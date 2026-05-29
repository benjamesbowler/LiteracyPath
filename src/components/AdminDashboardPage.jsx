import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildMediaQaRecords,
  MEDIA_QA_STATUSES,
  readMediaQaOverrides,
  updateMediaQaRecords
} from "../data/mediaQaManifest";
import { publicMediaInventory } from "../data/publicMediaInventory";
import { guidedReadingBooks } from "../data/guidedReadingBooks";
import { addDeletedMediaRecords, isMediaDeleted } from "../data/deletedMediaManifest";
import { enrichGuidedReadingBook } from "../utils/guidedReading/phonicsPageAnalyzer";
import { recommendBooksForStudent } from "../utils/guidedReading/recommendBooksForStudent";
import {
  GUIDED_READING_MOVE_LEVELS,
  applyGuidedReadingLevelOverride,
  readGuidedReadingLevelOverrides,
  setGuidedReadingLevelOverride
} from "../utils/guidedReading/bookLevelOverrides";
import {
  exportAssessmentAttemptsCsv,
  summarizeAssessmentHistory
} from "../data/assessmentHistoryStore";
import {
  deleteSavedElAssessmentReport,
  getSavedElAssessmentReports
} from "../data/elAssessmentReportStore.js";
import {
  downloadElAssessmentReport,
  exportClassElAssessmentExcel,
  exportStudentElAssessmentExcel
} from "../utils/exportElAssessmentExcel.js";
import { exportGuidedReadingCompletionExcel } from "../utils/exportGuidedReadingCompletionExcel.js";

const GUIDED_IMAGE_QA_STORAGE_KEY = "lpGuidedReadingImageQa";
const GUIDED_IMAGE_QA_RESET_KEY = "lpGuidedReadingImageQaResetVersion";
const GUIDED_IMAGE_QA_RESET_VERSION = "2026-05-27-book-level-controls";
const GUIDED_IMAGE_QA_STATUSES = [
  "unreviewed",
  "moved_level",
  "deleted"
];

function downloadTextFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function MiniLineChart({ points = [], label = "Progress" }) {
  const numericPoints = points
    .map((point, index) => ({ x: index, y: Number(point.value || point.accuracy || 0), label: point.label || "" }))
    .filter(point => Number.isFinite(point.y));
  if (numericPoints.length === 0) {
    return <div className="teacher-chart-empty">No graph data yet.</div>;
  }
  if (numericPoints.length === 1) {
    return (
      <div className="teacher-single-point-chart" aria-label={label}>
        <strong>{numericPoints[0].y}%</strong>
        <span>{numericPoints[0].label || "Latest"}</span>
      </div>
    );
  }
  const max = Math.max(100, ...numericPoints.map(point => point.y));
  const min = Math.min(0, ...numericPoints.map(point => point.y));
  const width = 320;
  const height = 120;
  const path = numericPoints.map((point, index) => {
    const x = (index / Math.max(1, numericPoints.length - 1)) * width;
    const y = height - ((point.y - min) / Math.max(1, max - min)) * height;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className="teacher-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <path d={path} />
      {numericPoints.map((point, index) => {
        const x = (index / Math.max(1, numericPoints.length - 1)) * width;
        const y = height - ((point.y - min) / Math.max(1, max - min)) * height;
        return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="4" />;
      })}
    </svg>
  );
}

function getSkillStatusClass(accuracy, attempts = 0) {
  if (!attempts) return "not-assessed";
  if (accuracy >= 85) return "mastered";
  if (accuracy >= 65) return "developing";
  return "support";
}

function mediaQaToCsv(records) {
  const headers = [
    "mediaType",
    "targetWord",
    "skillId",
    "skillName",
    "level",
    "filePath",
    "status",
    "rejectionReason",
    "reviewerNotes",
    "replacementPath",
    "linkedQuestionCount",
    "heuristicFlags"
  ];
  return [
    headers.join(","),
    ...records.map(record => [
      record.mediaType,
      record.targetWord,
      record.skillId,
      record.skillName,
      record.level,
      record.filePath,
      record.status,
      record.rejectionReason,
      record.reviewerNotes,
      record.replacementPath,
      record.linkedQuestionIds?.length || 0,
      (record.heuristicFlags || []).join("; ")
    ].map(csvEscape).join(","))
  ].join("\n");
}

function mediaQaToKimiMarkdown(records, mediaType) {
  const title = mediaType === "image" ? "Kimi Image Replacement Request" : "Kimi Audio Replacement Request";
  const globalRules = mediaType === "image"
    ? "Create a clean educational flashcard-style cartoon illustration of a single target object. Plain pure white background. Centered object only. No shadow, glow, aura, sparkles, rainbow coloring, face, eyes, smile, arms, legs, text, or background scene. Use natural realistic colors and high readability at small size."
    : "Record a clear spoken word or phrase only. Use neutral adult female American English, correct pronunciation, normalized volume, no music, no sound effects, no clipping, no background noise, and short silence before/after.";

  const grouped = records.reduce((map, record) => {
    const key = record.skillName || record.skillId || "Uncategorized";
    map.set(key, [...(map.get(key) || []), record]);
    return map;
  }, new Map());

  return [
    `# ${title}`,
    "",
    "## Status Meanings",
    "",
    "- `needs_kimi`: no usable asset is available, so Kimi must create one.",
    "- `rejected`: an existing asset failed QA and must be replaced with a new asset that meets the rules.",
    "- `blocked`: do not serve this asset to students; regenerate only if this target should remain active.",
    "",
    "## Global Rules",
    "",
    globalRules,
    "",
    ...[...grouped.entries()].flatMap(([skill, rows]) => [
      `## ${skill}`,
      "",
      ...rows.map(record => [
        `### ${record.targetWord || record.filePath}`,
        "",
        `- Target word/text: ${record.targetWord || ""}`,
        `- QA status: ${record.status}`,
        `- Required path: ${record.replacementPath || record.filePath}`,
        `- Current path: ${record.filePath}`,
        `- Reason: ${getKimiRequestReason(record)}`,
        `- Prompt: ${mediaType === "image"
          ? `Create one clear, natural-colored, cute educational cartoon image of ${record.targetWord || "the target object"}. ${globalRules}`
          : `Record "${record.targetWord || "target audio"}". ${globalRules}`}`,
        ""
      ].join("\n"))
    ])
  ].join("\n");
}

function statusLabel(status) {
  return status.replaceAll("_", " ");
}

function DeleteConfirmationModal({
  pendingDelete,
  confirmationText,
  setConfirmationText,
  onCancel,
  onConfirm
}) {
  if (!pendingDelete) return null;

  return (
    <div className="qa-delete-modal-backdrop" role="presentation">
      <section className="qa-delete-modal" role="dialog" aria-modal="true" aria-labelledby="qa-delete-title">
        <h3 id="qa-delete-title">Permanently delete this asset?</h3>
        <p>This cannot be undone from student runtime. This first pass marks it deleted; the local deletion tool moves the file into quarantine by default.</p>
        <p><strong>{pendingDelete.label}</strong></p>
        <small>{pendingDelete.path || pendingDelete.bookId}</small>
        <label>
          Type DELETE to confirm
          <input
            autoFocus
            onChange={event => setConfirmationText(event.target.value)}
            value={confirmationText}
          />
        </label>
        <div className="button-row">
          <button className="report-button" onClick={onCancel} type="button">Cancel</button>
          <button
            className="report-button danger"
            disabled={confirmationText !== "DELETE"}
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function getKimiRequestReason(record) {
  if (record.rejectionReason) return record.rejectionReason;
  if (record.reviewerNotes) return record.reviewerNotes;
  if ((record.heuristicFlags || []).length) return record.heuristicFlags.join(", ");
  if (record.status === "needs_kimi") return "No usable asset is available; create this asset from scratch.";
  if (record.status === "rejected") return "Existing asset was rejected in QA; replace it with an up-to-spec asset.";
  if (record.status === "blocked") return "Asset is blocked from student runtime; regenerate only if this target should remain active.";
  return "Needs QA replacement.";
}

function readGuidedImageQaOverrides() {
  if (typeof localStorage === "undefined") return {};
  const resetVersion = localStorage.getItem(GUIDED_IMAGE_QA_RESET_KEY);
  if (resetVersion !== GUIDED_IMAGE_QA_RESET_VERSION) {
    localStorage.removeItem(GUIDED_IMAGE_QA_STORAGE_KEY);
    localStorage.setItem(GUIDED_IMAGE_QA_RESET_KEY, GUIDED_IMAGE_QA_RESET_VERSION);
    return {};
  }
  try {
    return JSON.parse(localStorage.getItem(GUIDED_IMAGE_QA_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeGuidedImageQaOverrides(overrides = {}) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(GUIDED_IMAGE_QA_STORAGE_KEY, JSON.stringify(overrides));
}

function resetGuidedImageQaOverrides() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(GUIDED_IMAGE_QA_STORAGE_KEY);
  localStorage.setItem(GUIDED_IMAGE_QA_RESET_KEY, GUIDED_IMAGE_QA_RESET_VERSION);
}

function buildGuidedImageQaRecords(overrides = readGuidedImageQaOverrides(), levelOverrides = readGuidedReadingLevelOverrides()) {
  return guidedReadingBooks.map(rawBook => {
    const book = applyGuidedReadingLevelOverride(rawBook, levelOverrides);
    const id = `${book.id}:book`;
    return {
      id,
      bookId: book.id,
      title: book.title,
      seriesTitle: book.seriesTitle || "",
      level: book.level,
      originalLevel: rawBook.level,
      type: book.type,
      pageCount: book.pages?.length || 0,
      text: `${book.title || ""}${book.seriesTitle ? ` · ${book.seriesTitle}` : ""}`,
      image: book.coverImage || book.cover || "",
      pages: book.pages || [],
      assetType: "guided-reading-book",
      qaStatus: book.qaStatus || "",
      qaNotes: book.qaNotes || "",
      status: levelOverrides[book.id] ? "moved_level" : "unreviewed",
      reviewerNotes: "",
      reviewedAt: "",
      ...overrides[id],
      level: levelOverrides[book.id] || book.level,
      movedToLevel: levelOverrides[book.id] || ""
    };
  });
}

function guidedImageQaToCsv(records) {
  const headers = [
    "bookId",
    "title",
    "level",
    "type",
    "status",
    "image",
    "pageCount",
    "qaStatus",
    "reviewerNotes"
  ];
  return [
    headers.join(","),
    ...records.map(record => [
      record.bookId,
      record.title,
      record.level,
      record.type,
      record.status,
      record.image,
      record.pageCount,
      record.qaStatus,
      record.reviewerNotes
    ].map(csvEscape).join(","))
  ].join("\n");
}

function guidedImageQaToKimiMarkdown(records) {
  const remakeRecords = records.filter(record => record.status === "no_match_remake");
  const wholeBookRecords = records.filter(record => record.status === "whole_book_continuity_remake");
  const rejectedStoryRecords = records.filter(record => record.status === "whole_book_reject_story");
  const wholeBookGroups = wholeBookRecords.reduce((map, record) => {
    const key = record.bookId;
    map.set(key, [...(map.get(key) || []), record]);
    return map;
  }, new Map());
  const rejectedStoryGroups = rejectedStoryRecords.reduce((map, record) => {
    const key = record.bookId;
    map.set(key, [...(map.get(key) || []), record]);
    return map;
  }, new Map());

  return [
    "# Kimi Guided Reading Image Remake Request",
    "",
    "These pages/books were marked by admin QA for image remake.",
    "",
    "## Global Image Rules",
    "",
    "- Use the exact app text as the source of truth.",
    "- Create a new image that clearly shows the main idea/action of that exact page text.",
    "- Do not illustrate the previous page or the next page.",
    "- No embedded text, captions, labels, or speech bubbles.",
    "- Keep character appearance, clothing, setting, time of day, and art style consistent across the book.",
    "- For whole-book continuity remakes, generate a completely new matching image set for the full book. Every page must share complete continuity of characters, setting, scene logic, season, time, lighting, props, and style.",
    "- Do not reuse the previous mismatched image set for whole-book continuity remakes.",
    "- Whole-book story rejections are not image requests. Do not render images for rejected stories; add replacement books to the next Codex book-development round.",
    "- Use warm, natural colors. No rainbow/fantasy effects unless the text explicitly requires them.",
    "",
    "## Whole-Book Story Rejections",
    "",
    "These books were rejected because the writing/story was judged weak, lame, nonsensical, or not worth salvaging. Do not create images for these books. Add one replacement book to the next guided story development round for each rejected book.",
    "",
    ...[...rejectedStoryGroups.entries()].flatMap(([bookId, rows]) => {
      const sortedRows = [...rows].sort((a, b) => Number(a.pageNumber || 0) - Number(b.pageNumber || 0));
      const first = sortedRows[0] || {};
      return [
        `## ${first.title || bookId} - Reject Entire Book`,
        "",
        `- Book ID: ${bookId}`,
        `- Level: ${first.level || ""}`,
        `- Type: ${first.type || ""}`,
        "- Decision: Reject this whole book from the production queue.",
        "- Development action: Add `+1 replacement book` to the next guided story development round at the same level/type.",
        `- Admin notes: ${sortedRows.find(record => record.reviewerNotes)?.reviewerNotes || "Story/writing rejected by admin QA."}`,
        "",
        "### Existing Page Text For Reference",
        "",
        ...sortedRows.map(record => `- Page ${record.pageNumber}: ${record.text}`)
      ];
    }),
    rejectedStoryGroups.size ? "" : "_None._",
    "",
    "## Whole-Book Continuity Remakes",
    "",
    ...[...wholeBookGroups.entries()].flatMap(([bookId, rows]) => {
      const sortedRows = [...rows].sort((a, b) => Number(a.pageNumber || 0) - Number(b.pageNumber || 0));
      const first = sortedRows[0] || {};
      return [
        `## ${first.title || bookId} - Whole New Image Set`,
        "",
        `- Book ID: ${bookId}`,
        `- Level: ${first.level || ""}`,
        `- Type: ${first.type || ""}`,
        "- Reason: Admin requested a whole new image set because the current book lacks complete visual continuity.",
        "- Required continuity: all new images must have complete continuity of characters, setting, scene, season, time of day, lighting, recurring props, and illustration style across the whole book.",
        "- Kimi instruction: remake the full cover/page image set from the exact app text below. Do not improvise new story details.",
        "",
        "### Page Requirements",
        "",
        ...sortedRows.map(record => [
          `#### Page ${record.pageNumber}`,
          "",
          `- Current image path: ${record.image}`,
          `- Required replacement path: ${record.image}`,
          `- Exact app text: ${record.text}`,
          `- Admin notes: ${record.reviewerNotes || "Whole-book continuity remake requested."}`,
          `- Prompt: Create one warm child-friendly guided reading illustration for "${record.title}", page ${record.pageNumber}. The image must match this exact page text: "${record.text}". This page must be part of a completely continuous full-book image set with the same characters, same setting logic, same season/time/lighting continuity, same recurring props, and same art style as all other pages in the book. No embedded text, captions, labels, watermarks, or speech bubbles.`,
          ""
        ].join("\n"))
      ];
    }),
    wholeBookGroups.size ? "" : "_None._",
    "",
    "## Single-Page Text-Picture Remakes",
    "",
    "These pages were marked `no match remake image using text` by admin QA.",
    "",
    ...remakeRecords.map(record => [
      `## ${record.title} - Page ${record.pageNumber}`,
      "",
      `- Book ID: ${record.bookId}`,
      `- Level: ${record.level}`,
      `- Current image path: ${record.image}`,
      `- Original generated image path: ${record.originalImage || "same as current"}`,
      `- Image remapped from generated page: ${record.imageRemapSourcePage || "not remapped"}`,
      `- Required replacement path: ${record.image}`,
      `- Exact app text: ${record.text}`,
      `- Admin notes: ${record.reviewerNotes || "Image does not match the page text."}`,
      `- Prompt: Create one warm child-friendly guided reading illustration for "${record.title}", page ${record.pageNumber}. The image must match this exact page text: "${record.text}". Show the main character(s), setting, and action from this text only. Do not include embedded text, captions, labels, or speech bubbles. Preserve book continuity and natural colors.`,
      ""
    ].join("\n"))
  ].join("\n");
}

function MediaQaPage({ mediaType, questions = [], onBack }) {
  const [overrides, setOverrides] = useState(() => readMediaQaOverrides());
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const audioPreviewRef = useRef(null);
  const allRecords = useMemo(
    () => buildMediaQaRecords(questions, overrides, publicMediaInventory).filter(record => record.mediaType === mediaType),
    [questions, overrides, mediaType]
  );
  const skillOptions = useMemo(() => [...new Set(allRecords.map(record => record.skillName || record.skillId).filter(Boolean))].sort(), [allRecords]);
  const statusCounts = useMemo(() => allRecords.reduce((counts, record) => {
    counts.all += 1;
    counts[record.status] = (counts[record.status] || 0) + 1;
    if (!record.exists || !record.filePath) counts.missing += 1;
    if ((record.heuristicFlags || []).length > 0) counts.suspected += 1;
    return counts;
  }, {
    all: 0,
    missing: 0,
    suspected: 0
  }), [allRecords]);
  const visibleRecords = allRecords.filter(record => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [record.targetWord, record.filePath, record.skillName, record.skillId].some(value => String(value || "").toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === "all" ||
      record.status === statusFilter ||
      (statusFilter === "missing" && (!record.exists || !record.filePath)) ||
      (statusFilter === "suspected" && (record.heuristicFlags || []).length > 0);
    const matchesSkill = skillFilter === "all" || record.skillName === skillFilter || record.skillId === skillFilter;
    return matchesSearch && matchesStatus && matchesSkill;
  });
  const selectedSet = new Set(selectedIds);
  const qaRules = mediaType === "image"
    ? [
      "white background only",
      "single centered object",
      "no faces/eyes/smiles",
      "no sparkles/glow/aura",
      "no rainbow/fantasy colors",
      "no dark backgrounds",
      "no shadows",
      "no text",
      "no cluttered scenes",
      "natural object colors",
      "kindergarten-readable"
    ]
    : [
      "clear pronunciation",
      "correct target word",
      "neutral adult female voice preferred",
      "no music",
      "no sound effects",
      "no clipping",
      "no background noise",
      "normalized volume",
      "no wrong accent/pronunciation",
      "short silence before/after only"
    ];

  function playPreviewAudio(filePath) {
    if (!filePath) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }
    const audio = new Audio(filePath);
    audioPreviewRef.current = audio;
    audio.play().catch(error => {
      console.warn("Audio QA preview failed", error);
    });
  }

  function applyStatus(ids, status) {
    if (!ids.length) return;
    const next = updateMediaQaRecords(ids, { status });
    setOverrides(next);
    setSelectedIds([]);
  }

  function requestDeleteRecord(record) {
    setPendingDelete({
      kind: "assessment-media",
      record,
      label: `${record.targetWord || record.filePath} (${mediaType})`,
      path: record.filePath
    });
    setDeleteConfirmationText("");
  }

  function confirmDeleteRecord() {
    if (!pendingDelete?.record || deleteConfirmationText !== "DELETE") return;
    const record = pendingDelete.record;
    const next = updateMediaQaRecords([record.id], {
      status: "deleted",
      reviewerNotes: "Soft-deleted by admin QA. Use tools/deleteQaAsset.js to quarantine the file locally.",
      replacementNeeded: true
    });
    addDeletedMediaRecords([{
      assetType: mediaType,
      path: record.filePath,
      word: record.targetWord || "",
      skillId: record.skillId || "",
      reason: "Deleted from media QA admin page.",
      replacementNeeded: true
    }]);
    setOverrides(next);
    setSelectedIds(ids => ids.filter(id => id !== record.id));
    setPendingDelete(null);
    setDeleteConfirmationText("");
  }

  function exportRecords(format) {
    const base = `literacypath-${mediaType}-qa`;
    if (format === "csv") downloadTextFile(`${base}.csv`, mediaQaToCsv(visibleRecords), "text/csv");
    if (format === "json") downloadTextFile(`${base}.json`, JSON.stringify(visibleRecords, null, 2), "application/json");
    if (format === "kimi") {
      const rows = visibleRecords.filter(record => ["rejected", "needs_kimi", "blocked"].includes(record.status) || (record.heuristicFlags || []).length);
      downloadTextFile(`${base}-kimi-request.md`, mediaQaToKimiMarkdown(rows, mediaType), "text/markdown");
    }
  }

  return (
    <main className="admin-dashboard page-stack media-qa-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>{mediaType === "image" ? "Image QA" : "Audio QA"}</h2>
            <p className="muted-text">
              Moderate every public {mediaType} asset the app can serve. Showing {visibleRecords.length} of {allRecords.length} records.
            </p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={() => exportRecords("csv")} type="button">Export CSV</button>
            <button className="report-button" onClick={() => exportRecords("json")} type="button">Export JSON</button>
            <button className="report-button" onClick={() => exportRecords("kimi")} type="button">Export Kimi Markdown</button>
          </div>
        </div>

        <div className="media-qa-rules">
          {qaRules.map(rule => <span key={rule}>{rule}</span>)}
          <span>needs kimi = no usable asset exists</span>
          <span>rejected = remake to spec</span>
        </div>
      </section>

      <section className="report-panel page-stack">
        <div className="media-qa-status-tabs" role="tablist" aria-label={`${mediaType} QA status filters`}>
          {["all", ...MEDIA_QA_STATUSES, "suspected", "missing"].map(status => (
            <button
              className={statusFilter === status ? "active" : ""}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {statusLabel(status)} <span>{statusCounts[status] || 0}</span>
            </button>
          ))}
        </div>

        <div className="admin-content-filters">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search target word or filename" type="search" />
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {MEDIA_QA_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
            <option value="suspected">Suspected bad media</option>
            <option value="missing">Missing file path</option>
          </select>
          <select value={skillFilter} onChange={event => setSkillFilter(event.target.value)}>
            <option value="all">All skills</option>
            {skillOptions.map(skill => <option key={skill} value={skill}>{skill}</option>)}
          </select>
        </div>

        <div className="button-row media-qa-bulk-actions">
          {MEDIA_QA_STATUSES.filter(status => status !== "unreviewed").map(status => (
            <button className="report-button" disabled={!selectedIds.length} key={status} onClick={() => applyStatus(selectedIds, status)} type="button">
              Mark selected {statusLabel(status)}
            </button>
          ))}
          <button className="report-button" disabled={!selectedIds.length} onClick={() => applyStatus(selectedIds, "unreviewed")} type="button">
            Undo selected
          </button>
        </div>
      </section>

      <DeleteConfirmationModal
        pendingDelete={pendingDelete}
        confirmationText={deleteConfirmationText}
        setConfirmationText={setDeleteConfirmationText}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteConfirmationText("");
        }}
        onConfirm={confirmDeleteRecord}
      />

      {mediaType === "image" ? (
        <section className="media-qa-grid">
          {visibleRecords.map(record => (
            <article className={`media-qa-card status-${record.status}`} key={record.id}>
              <label className="media-qa-select">
                <input
                  checked={selectedSet.has(record.id)}
                  onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, record.id] : ids.filter(id => id !== record.id))}
                  type="checkbox"
                />
                Select
              </label>
              <img alt={record.targetWord || record.filePath} src={record.filePath} />
              <div>
                <h3>{record.targetWord || "Untitled"}</h3>
                <p>{record.skillName || "Unknown skill"} {record.level ? `· Level ${record.level}` : ""}</p>
                <span>{statusLabel(record.status)}</span>
                <small>{record.filePath}</small>
                <small>{record.linkedQuestionIds.length} linked questions</small>
                {record.source === "public_file_inventory" && <small>Public file inventory</small>}
                {isMediaDeleted(record.filePath) && <small>Deleted/quarantined</small>}
                {!record.exists && <small>Missing file</small>}
                {(record.heuristicFlags || []).length > 0 && <small>Flags: {record.heuristicFlags.join(", ")}</small>}
              </div>
              <div className="media-qa-card-actions">
                {MEDIA_QA_STATUSES.filter(status => status !== record.status).map(status => (
                  <button key={status} onClick={() => applyStatus([record.id], status)} type="button">{statusLabel(status)}</button>
                ))}
                <button className="report-button danger" onClick={() => requestDeleteRecord(record)} type="button">Delete</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="admin-table-wrap">
          <table className="dashboard-table admin-table media-qa-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Play</th>
                <th>Target</th>
                <th>Skill</th>
                <th>Status</th>
                <th>Path</th>
                <th>Linked</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map(record => (
                <tr key={record.id}>
                  <td>
                    <input
                      checked={selectedSet.has(record.id)}
                      onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, record.id] : ids.filter(id => id !== record.id))}
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <button
                      aria-label={`Play ${record.targetWord || record.filePath}`}
                      className="media-qa-play-button"
                      onClick={() => playPreviewAudio(record.filePath)}
                      type="button"
                    >
                      ▶
                    </button>
                  </td>
                  <td>{record.targetWord}</td>
                  <td>{record.skillName}{record.level ? ` · Level ${record.level}` : ""}</td>
                  <td>{statusLabel(record.status)}</td>
                  <td>{record.filePath}</td>
                  <td>{record.linkedQuestionIds.length}</td>
                  <td>{record.source || ""}</td>
                  <td>
                    <div className="button-row">
                      {MEDIA_QA_STATUSES.filter(status => status !== record.status).map(status => (
                        <button className="report-button" key={status} onClick={() => applyStatus([record.id], status)} type="button">{statusLabel(status)}</button>
                      ))}
                      <button className="report-button danger" onClick={() => requestDeleteRecord(record)} type="button">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function GuidedReadingImageQaPage({ onBack }) {
  const [overrides, setOverrides] = useState(() => readGuidedImageQaOverrides());
  const [levelOverrides, setLevelOverrides] = useState(() => readGuidedReadingLevelOverrides());
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookFilter, setBookFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const records = useMemo(() => buildGuidedImageQaRecords(overrides, levelOverrides), [overrides, levelOverrides]);
  const bookOptions = useMemo(() => [...new Set(records.map(record => record.title))].sort(), [records]);
  const levelOptions = useMemo(() => [...new Set(records.map(record => record.level).filter(Boolean))].sort(), [records]);
  const visibleRecords = records.filter(record => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [record.title, record.bookId, record.text, record.image].some(value =>
      String(value || "").toLowerCase().includes(query)
    );
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesBook = bookFilter === "all" || record.title === bookFilter;
    const matchesLevel = levelFilter === "all" || record.level === levelFilter;
    return matchesSearch && matchesStatus && matchesBook && matchesLevel;
  });

  useEffect(() => {
    setOverrides(readGuidedImageQaOverrides());
    setLevelOverrides(readGuidedReadingLevelOverrides());
  }, []);

  function markGuidedBookMoved(recordId, level) {
    const next = {
      ...overrides,
      [recordId]: {
        ...(overrides[recordId] || {}),
        status: "moved_level",
        reviewerNotes: `Moved to Level ${level}.`,
        reviewedAt: new Date().toISOString()
      }
    };
    writeGuidedImageQaOverrides(next);
    setOverrides(next);
  }

  function moveGuidedBook(record, level) {
    const nextLevelOverrides = setGuidedReadingLevelOverride(record.bookId, level);
    setLevelOverrides(nextLevelOverrides);
    markGuidedBookMoved(record.id, level);
  }

  function requestGuidedDelete(record) {
    setPendingDelete({
      kind: "guided-reading-book",
      record,
      bookId: record.bookId,
      path: record.image,
      label: `${record.title} (entire book asset set)`
    });
    setDeleteConfirmationText("");
  }

  function confirmGuidedDelete() {
    if (!pendingDelete?.record || deleteConfirmationText !== "DELETE") return;
    const { record } = pendingDelete;
    const next = { ...overrides };
    const affectedRecords = [record];

    affectedRecords.forEach(item => {
      next[item.id] = {
        ...(next[item.id] || {}),
        status: "deleted",
        reviewerNotes: "Whole book soft-deleted by admin QA. Use tools/deleteQaAsset.js to quarantine files locally.",
        reviewedAt: new Date().toISOString()
      };
    });
    writeGuidedImageQaOverrides(next);
    addDeletedMediaRecords([
      {
        assetType: "guided-reading-book",
        path: "",
        bookId: record.bookId,
        reason: "Whole guided-reading book soft-deleted from admin QA.",
        replacementNeeded: true
      },
      ...(record.pages || []).map(item => ({
        assetType: item.assetType || "guided-reading-page",
        path: item.image,
        bookId: record.bookId,
        pageNumber: item.pageNumber,
        reason: "Guided-reading asset deleted as part of whole-book QA delete.",
        replacementNeeded: true
      }))
    ]);
    setOverrides(next);
    setPendingDelete(null);
    setDeleteConfirmationText("");
  }

  function exportGuidedQa(format) {
    const base = "literacypath-guided-reading-image-qa";
    if (format === "csv") downloadTextFile(`${base}.csv`, guidedImageQaToCsv(visibleRecords), "text/csv");
    if (format === "json") downloadTextFile(`${base}.json`, JSON.stringify(visibleRecords, null, 2), "application/json");
  }

  const counts = records.reduce((map, record) => {
    map[record.status] = (map[record.status] || 0) + 1;
    return map;
  }, {});

  return (
    <main className="admin-dashboard page-stack media-qa-page guided-image-qa-page">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Guided Reading Book Controls</h2>
            <p className="muted-text">Keep the library public, remove a whole book if needed, or move a book into Level A, B, or C.</p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={() => exportGuidedQa("csv")} type="button">Export CSV</button>
            <button className="report-button" onClick={() => exportGuidedQa("json")} type="button">Export JSON</button>
          </div>
        </div>
        <div className="media-qa-rules">
          <span>all guided reading books are public unless deleted</span>
          <span>Delete Whole Book soft-blocks the book from runtime</span>
          <span>Move to A/B/C changes its shelf level in this browser</span>
          <span>use source data for permanent level changes after review</span>
        </div>
        <p className="muted-text">
          {records.length} books · {counts.moved_level || 0} level moves · {counts.deleted || 0} deleted
        </p>
      </section>

      <DeleteConfirmationModal
        pendingDelete={pendingDelete}
        confirmationText={deleteConfirmationText}
        setConfirmationText={setDeleteConfirmationText}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteConfirmationText("");
        }}
        onConfirm={confirmGuidedDelete}
      />

      <section className="report-panel page-stack">
        <div className="admin-content-filters">
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search book, page text, or image path" type="search" />
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {GUIDED_IMAGE_QA_STATUSES.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <select value={bookFilter} onChange={event => setBookFilter(event.target.value)}>
            <option value="all">All books</option>
            {bookOptions.map(title => <option key={title} value={title}>{title}</option>)}
          </select>
          <select value={levelFilter} onChange={event => setLevelFilter(event.target.value)}>
            <option value="all">All levels</option>
            {levelOptions.map(level => <option key={level} value={level}>Level {level}</option>)}
          </select>
        </div>
      </section>

      <section className="guided-image-qa-grid">
        {visibleRecords.map(record => (
          <article className={`guided-image-qa-card status-${record.status}`} key={record.id}>
            <div className="guided-image-qa-preview">
              {record.image ? <img alt={`${record.title} cover`} src={record.image} /> : <span>Missing cover</span>}
            </div>
            <div className="guided-image-qa-body">
              <div>
                <p className="panel-label">{record.bookId} · {record.type} · Level {record.level} · {record.pageCount} pages</p>
                <h3>{record.title}</h3>
                <p className="guided-image-qa-text">{record.seriesTitle || "Guided Reading"}</p>
              </div>
              <small>{record.image}</small>
              <span>{statusLabel(record.status)}</span>
              <div className="guided-image-qa-actions">
                <button className="report-button danger" onClick={() => requestGuidedDelete(record)} type="button">
                  Delete Whole Book
                </button>
                {GUIDED_READING_MOVE_LEVELS.map(level => (
                  <button className="report-button" key={level} onClick={() => moveGuidedBook(record, level)} type="button">
                    Move to {level}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export function AdminDashboardPage({
  teachers,
  classes,
  students,
  pendingAccounts = [],
  loading,
  refreshDashboard,
  deleteClass,
  deleteStudent,
  updateTeacherAccountStatus,
  questionBankCoverage = [],
  mediaQuestions = [],
  assessmentHistory = [],
  dashboardMode = "admin",
  teacherId = "",
  message
}) {
  const isTeacherMode = dashboardMode === "teacher";
  const [skillFilter, setSkillFilter] = useState("all");
  const [adminQaPage, setAdminQaPage] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    if (window.location.pathname.includes("/admin/media/images")) return "images";
    if (window.location.pathname.includes("/admin/media/audio")) return "audio";
    if (window.location.pathname.includes("/admin/guided-reading/image-qa")) return "guidedReadingImages";
    return "dashboard";
  });
  const [activeSection, setActiveSection] = useState(isTeacherMode ? "teacherReport" : "overview");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [patternFilter, setPatternFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusFilterLocal, setStatusFilterLocal] = useState("all");
  const [exportNotice, setExportNotice] = useState("");
  const [selectedElClassId, setSelectedElClassId] = useState("");
  const [selectedElStudentId, setSelectedElStudentId] = useState("");
  const [savedElReports, setSavedElReports] = useState([]);
  const [elReportNotice, setElReportNotice] = useState("");
  const teacherStorageId = teacherId || "local";
  const selectedClassId = selectedElClassId || classes[0]?.id || "";
  const elClassStudents = students.filter(student => !selectedClassId || student.classId === selectedClassId || student.class_id === selectedClassId);
  const selectedStudent = elClassStudents.find(student => student.id === selectedElStudentId) || elClassStudents[0] || students[0] || null;

  function refreshSavedElReports() {
    setSavedElReports(getSavedElAssessmentReports({ teacherId: teacherStorageId }));
  }

  useEffect(() => {
    refreshSavedElReports();
  }, [teacherStorageId]);

  useEffect(() => {
    if (!selectedElClassId && classes[0]?.id) {
      setSelectedElClassId(classes[0].id);
    }
  }, [classes, selectedElClassId]);

  useEffect(() => {
    if (!selectedElStudentId && selectedStudent?.id) {
      setSelectedElStudentId(selectedStudent.id);
    }
    if (selectedElStudentId && elClassStudents.length > 0 && !elClassStudents.some(student => student.id === selectedElStudentId)) {
      setSelectedElStudentId(elClassStudents[0].id);
    }
  }, [elClassStudents, selectedElStudentId, selectedStudent]);
  const templateOptions = useMemo(() => Array.from(new Set(
    questionBankCoverage.flatMap(row => Object.keys(row.templates || {}))
  )).sort(), [questionBankCoverage]);
  const difficultyOptions = useMemo(() => Array.from(new Set(
    questionBankCoverage.flatMap(row => Object.keys(row.difficulties || {}))
  )).sort(), [questionBankCoverage]);
  const filteredCoverage = questionBankCoverage.filter(row => {
    const matchesSkill = skillFilter === "all" || row.skill === skillFilter;
    const matchesTemplate = templateFilter === "all" || row.templates?.[templateFilter];
    const matchesDifficulty = difficultyFilter === "all" || row.difficulties?.[difficultyFilter];
    const matchesPattern = !patternFilter || Object.keys(row.patterns || {}).some(pattern =>
      pattern.toLowerCase().includes(patternFilter.toLowerCase())
    );
    const matchesMedia =
      mediaFilter === "all" ||
      (mediaFilter === "missing_image" && row.missingImage > 0) ||
      (mediaFilter === "missing_audio" && row.missingAudio > 0) ||
      (mediaFilter === "complete_media" && row.missingImage === 0 && row.missingAudio === 0) ||
      (mediaFilter === "bad_media" && row.badMedia > 0);
    const matchesStatus =
      statusFilterLocal === "all" ||
      (statusFilterLocal === "active" && row.active > 0) ||
      (statusFilterLocal === "inactive" && row.inactive > 0);

    return matchesSkill && matchesTemplate && matchesDifficulty && matchesPattern && matchesMedia && matchesStatus;
  });
  const guidedReadingInsight = useMemo(() => {
    const enriched = guidedReadingBooks.map(enrichGuidedReadingBook);
    const byStatus = enriched.reduce((map, book) => {
      const status = book.qaStatus || "unknown";
      map[status] = (map[status] || 0) + 1;
      return map;
    }, {});
    const byLevel = enriched.reduce((map, book) => {
      const level = book.level || "Unleveled";
      map[level] = (map[level] || 0) + 1;
      return map;
    }, {});
    const patternCounts = enriched.flatMap(book => book.dominantPhonicsPatterns || []).reduce((map, pattern) => {
      map[pattern] = (map[pattern] || 0) + 1;
      return map;
    }, {});
    const microphaseCounts = enriched.reduce((map, book) => {
      const key = book.recommendedMicrophase || "early-reading";
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
    const recommendations = recommendBooksForStudent({
      books: guidedReadingBooks,
      studentProgress: { needs: ["cvc", "short-a", "final-sounds", "digraphs"] },
      readingHistory: {}
    }).slice(0, 6);

    return {
      total: enriched.length,
      active: enriched.filter(book => book.active !== false).length,
      draft: enriched.filter(book => book.qaStatus !== "approved").length,
      missingImages: enriched.reduce((sum, book) => sum + (book.pages || []).filter(page => !page.image).length, 0),
      missingText: enriched.reduce((sum, book) => sum + (book.pages || []).filter(page => !page.text).length, 0),
      byStatus,
      byLevel,
      patternCounts,
      microphaseCounts,
      recommendations
    };
  }, []);
  const assessmentSummary = useMemo(() =>
    summarizeAssessmentHistory(assessmentHistory, { students, classes }),
  [assessmentHistory, students, classes]);
  const recentAttempts = [...assessmentHistory]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 40);
  const classChartPoints = [...assessmentHistory]
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map(record => ({
      label: record.completedAt ? new Date(record.completedAt).toLocaleDateString() : "",
      value: record.accuracy
    }));
  const skillColumns = [
    "Initial Sounds",
    "Final Sounds",
    "Rhyming",
    "CVC and Short Vowels",
    "Short Vowel Discrimination",
    "High-Frequency Words 1-25",
    "Blends",
    "Digraphs",
    "Long Vowels and Silent E"
  ];
  const skillStatusByStudent = new Map();
  assessmentSummary.students.forEach(student => {
    const rows = assessmentHistory.filter(record => record.studentId === student.studentId);
    const bySkill = new Map();
    rows.forEach(record => {
      const key = record.skillName;
      const existing = bySkill.get(key) || { correct: 0, total: 0, attempts: 0 };
      existing.correct += Number(record.correctCount || 0);
      existing.total += Number(record.totalQuestions || 0);
      existing.attempts += 1;
      bySkill.set(key, existing);
    });
    skillStatusByStudent.set(student.studentId, bySkill);
  });

  function openAdminQaPage(page) {
    setAdminQaPage(page);
    if (typeof window !== "undefined") {
      const path = page === "images"
        ? "/admin/media/images"
        : page === "audio"
          ? "/admin/media/audio"
          : page === "guidedReadingImages"
            ? "/admin/guided-reading/image-qa"
            : "/";
      window.history.pushState({}, "", path);
    }
  }

  async function handleGuidedReadingCompletionExport() {
    setExportNotice("");
    try {
      const data = await exportGuidedReadingCompletionExcel({
        students,
        classes,
        teacherId: isTeacherMode ? teacherId : ""
      });
      setExportNotice(
        data.totals.totalGuidedReadingSessions
          ? `Guided Reading completion Excel exported with ${data.totals.totalCompletedBooks} completed book rows.`
          : "Guided Reading completion Excel exported with no records yet."
      );
    } catch (error) {
      console.error("Guided Reading completion Excel export failed.", error);
      setExportNotice("Could not export Guided Reading completion Excel.");
    }
  }

  async function handleStudentElAssessmentExport() {
    setElReportNotice("");
    if (!selectedStudent?.id) {
      setElReportNotice("Choose a student before exporting an individual EL report.");
      return;
    }
    try {
      const report = await exportStudentElAssessmentExcel({
        assessmentHistory,
        students,
        classes,
        studentId: selectedStudent.id,
        classId: selectedClassId || selectedStudent.classId || selectedStudent.class_id || "",
        teacherId: teacherStorageId
      });
      refreshSavedElReports();
      setElReportNotice(`Student EL assessment Excel exported for ${report.studentName}.`);
    } catch (error) {
      console.error("Student EL assessment Excel export failed.", error);
      setElReportNotice("Could not export the student EL assessment Excel.");
    }
  }

  async function handleClassElAssessmentExport() {
    setElReportNotice("");
    try {
      const report = await exportClassElAssessmentExcel({
        assessmentHistory,
        students,
        classes,
        classId: selectedClassId,
        teacherId: teacherStorageId
      });
      refreshSavedElReports();
      setElReportNotice(`Class EL assessment Excel exported for ${report.className}.`);
    } catch (error) {
      console.error("Class EL assessment Excel export failed.", error);
      setElReportNotice("Could not export the class EL assessment Excel.");
    }
  }

  async function handleDownloadSavedElReport(report) {
    setElReportNotice("");
    try {
      await downloadElAssessmentReport(report);
      setElReportNotice(`Downloaded ${report.fileName || "saved EL report"}.`);
    } catch (error) {
      console.error("Saved EL assessment report download failed.", error);
      setElReportNotice("Could not download the saved EL report.");
    }
  }

  function handleDeleteSavedElReport(reportId) {
    deleteSavedElAssessmentReport(reportId, { teacherId: teacherStorageId });
    refreshSavedElReports();
    setElReportNotice("Saved EL report deleted from this browser.");
  }

  const adminSections = isTeacherMode
    ? [
      { id: "teacherReport", label: "Teacher Dashboard", count: assessmentHistory.length },
      { id: "archive", label: "Assessment Archive", count: assessmentHistory.length },
      { id: "classes", label: "Classes", count: classes.length },
      { id: "students", label: "Students", count: students.length }
    ]
    : [
      { id: "overview", label: "Overview", count: null },
      { id: "teacherReport", label: "Teacher Reports", count: assessmentHistory.length },
      { id: "archive", label: "Assessment Archive", count: assessmentHistory.length },
      { id: "signups", label: "Signup Requests", count: pendingAccounts.filter(account => (account.approval_status || account.status || "pending") === "pending").length },
      { id: "guidedInsight", label: "Guided Reading Insight", count: guidedReadingInsight.active },
      { id: "coverage", label: "Content Coverage", count: filteredCoverage.length },
      { id: "teachers", label: "Teachers", count: teachers.length },
      { id: "classes", label: "Classes", count: classes.length },
      { id: "students", label: "Students", count: students.length }
    ];

  if (adminQaPage === "images") {
    return <MediaQaPage mediaType="image" questions={mediaQuestions} onBack={() => openAdminQaPage("dashboard")} />;
  }

  if (adminQaPage === "audio") {
    return <MediaQaPage mediaType="audio" questions={mediaQuestions} onBack={() => openAdminQaPage("dashboard")} />;
  }

  if (adminQaPage === "guidedReadingImages") {
    return <GuidedReadingImageQaPage onBack={() => openAdminQaPage("dashboard")} />;
  }

  return (
    <main className="admin-dashboard page-stack">
      <section className="card page-stack">
        <div className="admin-header">
          <div className="admin-page-heading">
            <h2>{isTeacherMode ? "Teacher Dashboard" : "Admin Dashboard"}</h2>
            <p className="muted-text">
              {isTeacherMode
                ? "Class reports, student progress, assessment history, and export tools."
                : "Review content coverage and manage app data."}
            </p>
          </div>

          <div className="button-row admin-controls">
            {refreshDashboard && (
              <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
                {loading ? "Loading..." : "Refresh"}
              </button>
            )}
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <nav className="admin-section-tabs" aria-label="Admin Dashboard sections">
          {adminSections.map(section => (
            <button
              className={activeSection === section.id ? "active" : ""}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <span>{section.label}</span>
              {typeof section.count === "number" && <small>{section.count}</small>}
            </button>
          ))}
          {!isTeacherMode && (
            <>
              <button onClick={() => openAdminQaPage("images")} type="button">
                <span>Image QA</span>
              </button>
              <button onClick={() => openAdminQaPage("audio")} type="button">
                <span>Audio QA</span>
              </button>
              <button onClick={() => openAdminQaPage("guidedReadingImages")} type="button">
                <span>Guided Reading Image QA</span>
              </button>
            </>
          )}
        </nav>
      </section>

      {!isTeacherMode && activeSection === "overview" && (
        <section className="report-panel page-stack admin-section admin-section-panel">
          <div className="admin-section-heading">
            <div>
              <h3>Dashboard Summary</h3>
              <p className="muted-text">Jump into the admin area you need without scrolling through every tool.</p>
            </div>
          </div>
          <div className="admin-overview-grid">
            {adminSections.filter(section => section.id !== "overview").map(section => (
              <button
                className="admin-overview-card"
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <span>{section.label}</span>
                <strong>{section.count}</strong>
              </button>
            ))}
            <button className="admin-overview-card" onClick={() => openAdminQaPage("images")} type="button">
              <span>Image QA</span>
              <strong>Open</strong>
            </button>
            <button className="admin-overview-card" onClick={() => openAdminQaPage("audio")} type="button">
              <span>Audio QA</span>
              <strong>Open</strong>
            </button>
            <button className="admin-overview-card" onClick={() => openAdminQaPage("guidedReadingImages")} type="button">
              <span>Guided Reading Image QA</span>
              <strong>Open</strong>
            </button>
          </div>
        </section>
      )}

      {activeSection === "teacherReport" && (
        <section className="report-panel page-stack admin-section admin-section-panel teacher-dashboard-redesign">
          <div className="admin-section-heading">
            <div>
              <h3>Teacher Dashboard</h3>
              <p className="muted-text">Simple class reporting from saved assessment attempts.</p>
            </div>
            <div className="teacher-action-list">
              <button className="lp-button lp-button-secondary" onClick={handleGuidedReadingCompletionExport} type="button">
                Export Guided Reading Completion Excel
              </button>
              <span className="admin-count-pill">{assessmentSummary.attempts} attempts</span>
            </div>
          </div>
          {exportNotice && <p className="message">{exportNotice}</p>}

          <div className="teacher-report-card el-assessment-dashboard-section">
            <div className="admin-section-heading">
              <div>
                <h4>EL Assessment Snapshot</h4>
                <p className="muted-text">
                  Export individual and whole-class Skills Block reports, save report history, and compare progress over time.
                </p>
              </div>
              <span className="admin-count-pill">{savedElReports.length} saved EL reports</span>
            </div>

            {assessmentHistory.length === 0 && (
              <p className="message">No EL assessment records yet. Complete student assessments to generate EL reports.</p>
            )}
            {elReportNotice && <p className="message">{elReportNotice}</p>}

            <div className="teacher-report-metrics">
              <article>
                <span>EL assessments</span>
                <strong>{assessmentSummary.attempts}</strong>
              </article>
              <article>
                <span>Average accuracy</span>
                <strong>{assessmentSummary.averageAccuracy}%</strong>
              </article>
              <article>
                <span>Focus skills</span>
                <strong>{assessmentSummary.weakestSkills.length}</strong>
              </article>
            </div>

            <div className="el-assessment-export-row">
              <label>
                Class report
                <select
                  disabled={classes.length === 0}
                  onChange={event => {
                    setSelectedElClassId(event.target.value);
                    setSelectedElStudentId("");
                  }}
                  value={selectedClassId}
                >
                  {classes.length === 0 ? (
                    <option value="">No classes yet</option>
                  ) : classes.map(row => (
                    <option key={row.id} value={row.id}>{row.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Student report
                <select
                  disabled={elClassStudents.length === 0}
                  onChange={event => setSelectedElStudentId(event.target.value)}
                  value={selectedElStudentId || elClassStudents[0]?.id || ""}
                >
                  {elClassStudents.length === 0 ? (
                    <option value="">No students yet</option>
                  ) : elClassStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </label>
              <button
                className="lp-button lp-button-secondary"
                disabled={elClassStudents.length === 0}
                onClick={handleStudentElAssessmentExport}
                type="button"
              >
                Export Student EL Assessment Excel
              </button>
              <button className="lp-button lp-button-secondary" onClick={handleClassElAssessmentExport} type="button">
                Export Class EL Assessment Excel
              </button>
            </div>

            <div className="teacher-report-grid compact">
              <article className="teacher-report-card">
                <h5>Progress Comparison</h5>
                <MiniLineChart points={classChartPoints} label="EL class accuracy over time" />
                {classChartPoints.length < 2 && <p className="muted-text">Generate another report later to compare progress over time.</p>}
              </article>
              <article className="teacher-report-card">
                <h5>Current EL Focus</h5>
                {assessmentSummary.weakestSkills.length ? assessmentSummary.weakestSkills.slice(0, 4).map(skill => (
                  <p key={skill.skillId || skill.skillName}><strong>{skill.skillName}</strong> · {skill.accuracy}% · {skill.status}</p>
                )) : <p>No saved assessment attempts yet.</p>}
              </article>
            </div>

            <div className="el-saved-reports">
              <h5>Saved EL Reports</h5>
              {savedElReports.length === 0 ? (
                <p>No saved EL reports yet.</p>
              ) : savedElReports.slice(0, 10).map(report => (
                <article className="el-saved-report-row" key={report.reportId}>
                  <div>
                    <strong>{report.reportType === "individual" ? "Student" : "Class"} EL report</strong>
                    <span>{report.studentName || report.className || "Unknown"} · {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : ""}</span>
                    <small>{report.summary?.totalAssessments || 0} assessments · {report.summary?.averageAccuracy || 0}% average</small>
                  </div>
                  <div className="button-row">
                    <button className="report-button" onClick={() => handleDownloadSavedElReport(report)} type="button">Download Again</button>
                    <button
                      className="report-button"
                      onClick={() => setElReportNotice(report.comparison?.note || `Compared with ${report.comparison?.previousGeneratedAt ? new Date(report.comparison.previousGeneratedAt).toLocaleDateString() : "no previous report available yet"}. Accuracy change: ${report.comparison?.accuracyChange || 0}%.`)}
                      type="button"
                    >
                      Compare
                    </button>
                    <button className="report-button danger" onClick={() => handleDeleteSavedElReport(report.reportId)} type="button">Delete local copy</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="teacher-report-metrics">
            <article>
              <span>Students</span>
              <strong>{students.length}</strong>
            </article>
            <article>
              <span>Assessments saved</span>
              <strong>{assessmentSummary.attempts}</strong>
            </article>
            <article>
              <span>Class average</span>
              <strong>{assessmentSummary.averageAccuracy}%</strong>
            </article>
            <article>
              <span>Need support</span>
              <strong>{assessmentSummary.studentsNeedingSupport.length}</strong>
            </article>
          </div>

          <div className="teacher-report-grid">
            <article className="teacher-report-card">
              <h4>Class Accuracy Over Time</h4>
              <MiniLineChart points={classChartPoints} label="Class accuracy over time" />
            </article>
            <article className="teacher-report-card">
              <h4>Skills Needing Attention</h4>
              {assessmentSummary.weakestSkills.length ? assessmentSummary.weakestSkills.map(skill => (
                <p key={skill.skillId || skill.skillName}><strong>{skill.skillName}</strong> · {skill.accuracy}% · {skill.status}</p>
              )) : <p>No saved assessment evidence yet.</p>}
            </article>
            <article className="teacher-report-card">
              <h4>Students Needing Support</h4>
              {assessmentSummary.studentsNeedingSupport.length ? assessmentSummary.studentsNeedingSupport.map(student => (
                <p key={student.studentId}><strong>{student.studentName}</strong> · {student.accuracy}% · {student.supportSkills.slice(0, 3).join(", ") || "review recent work"}</p>
              )) : <p>No support flags yet.</p>}
            </article>
            <article className="teacher-report-card">
              <h4>Ready for Challenge</h4>
              {assessmentSummary.studentsReadyToLevelUp.length ? assessmentSummary.studentsReadyToLevelUp.map(student => (
                <p key={student.studentId}><strong>{student.studentName}</strong> · latest passed {student.latest?.skillName}</p>
              )) : <p>No level-up flags yet.</p>}
            </article>
          </div>

          <div className="teacher-report-card">
            <h4>Student List</h4>
            <div className="teacher-student-report-list">
              {assessmentSummary.students.length ? assessmentSummary.students.map(student => (
                <article key={student.studentId}>
                  <div>
                    <strong>{student.studentName}</strong>
                    <span>{student.className || "Class not linked"} · {student.attempts} assessments</span>
                  </div>
                  <div>
                    <span>{student.accuracy}% recent accuracy</span>
                    <small>{student.latest ? `Latest: ${student.latest.skillName}` : "No recent activity"}</small>
                  </div>
                  <div className="teacher-student-flags">
                    {!student.latest && <b>No recent assessment</b>}
                    {student.accuracy < 70 && <b>Low accuracy</b>}
                    {student.supportSkills.length > 0 && <b>Needs support</b>}
                    {student.latest?.passed && <b>Ready to level up</b>}
                  </div>
                </article>
              )) : <p>No saved assessment history yet. Complete an assessment to populate the dashboard.</p>}
            </div>
          </div>

          <div className="teacher-report-card teacher-heatmap-card">
            <h4>Skill Coverage Heatmap</h4>
            <div className="teacher-heatmap">
              <div className="teacher-heatmap-row header">
                <span>Student</span>
                {skillColumns.map(skill => <span key={skill}>{skill.replace("High-Frequency Words", "HFW")}</span>)}
              </div>
              {(assessmentSummary.students.length ? assessmentSummary.students : students.map(student => ({ studentId: student.id, studentName: student.name }))).map(student => {
                const bySkill = skillStatusByStudent.get(student.studentId) || new Map();
                return (
                  <div className="teacher-heatmap-row" key={student.studentId}>
                    <strong>{student.studentName}</strong>
                    {skillColumns.map(skill => {
                      const row = bySkill.get(skill);
                      const accuracy = row?.total ? Math.round((row.correct / row.total) * 100) : 0;
                      return (
                        <span className={`heatmap-cell ${getSkillStatusClass(accuracy, row?.attempts || 0)}`} key={skill}>
                          {row?.attempts ? `${accuracy}%` : "-"}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="teacher-report-card">
            <h4>Whole Class Next Steps</h4>
            <p>{assessmentSummary.weakestSkills[0] ? `${assessmentSummary.studentsNeedingSupport.length} students need support. Start with ${assessmentSummary.weakestSkills[0].skillName}.` : "No class trend yet. Save a few assessment attempts first."}</p>
            <p>{assessmentSummary.strongestSkills[0] ? `${assessmentSummary.strongestSkills[0].skillName} is currently the strongest skill area.` : "Strongest skills will appear after assessment history is saved."}</p>
          </div>
        </section>
      )}

      {activeSection === "archive" && (
        <section className="report-panel page-stack admin-section admin-section-panel">
          <div className="admin-section-heading">
            <div>
              <h3>Assessment Archive</h3>
              <p className="muted-text">Saved checkpoint attempts for class and student reporting.</p>
            </div>
            <div className="teacher-action-list">
              <button
                className="lp-button lp-button-secondary"
                onClick={handleGuidedReadingCompletionExport}
                type="button"
              >
                Export Guided Reading Completion Excel
              </button>
              <button
                className="lp-button lp-button-secondary"
                disabled={assessmentHistory.length === 0}
                onClick={() => downloadTextFile("assessment-history.csv", exportAssessmentAttemptsCsv(assessmentHistory), "text/csv")}
                type="button"
              >
                Export CSV
              </button>
              <button
                className="lp-button lp-button-secondary"
                disabled={assessmentHistory.length === 0}
                onClick={() => downloadTextFile("assessment-history.json", JSON.stringify(assessmentHistory, null, 2), "application/json")}
                type="button"
              >
                Export JSON
              </button>
            </div>
          </div>

          {recentAttempts.length === 0 ? (
            <p>No assessment attempts have been saved in this browser yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="dashboard-table admin-table admin-responsive-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Skill</th>
                    <th>Level</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Missed Items</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map(record => (
                    <tr key={record.attemptId}>
                      <td data-label="Date">{record.completedAt ? new Date(record.completedAt).toLocaleString() : ""}</td>
                      <td data-label="Student">{record.studentName}</td>
                      <td data-label="Skill">{record.skillName}</td>
                      <td data-label="Level">L{record.skillLevel} P{record.skillPhase}</td>
                      <td data-label="Score">{record.correctCount}/{record.totalQuestions} ({record.accuracy}%)</td>
                      <td data-label="Status">{record.status}</td>
                      <td data-label="Missed">{record.missedItems.slice(0, 6).join(", ") || "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {!isTeacherMode && activeSection === "signups" && (
      <section className="card page-stack admin-section admin-section-panel">
        <div className="admin-section-heading">
          <div>
            <h3>Signup Requests</h3>
            <p className="muted-text">Approve or reject teacher account requests. Pending requests are blocked from the app until approved.</p>
          </div>
          <span className="admin-count-pill">{pendingAccounts.filter(account => (account.approval_status || account.status || "pending") === "pending").length}</span>
        </div>
        {pendingAccounts.length === 0 ? (
          <p>No signup requests loaded.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table admin-responsive-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Reviewed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAccounts.map(account => (
                  <tr key={account.id || account.user_id || account.email}>
                    <td data-label="Email">{account.email || "Email unavailable"}</td>
                    <td data-label="Username">{account.username || "-"}</td>
                    <td data-label="Name">{account.display_name || account.name || "-"}</td>
                    <td data-label="Status">{account.approval_status || account.status || "pending"}</td>
                    <td data-label="Requested">{(account.requested_at || account.created_at) ? new Date(account.requested_at || account.created_at).toLocaleDateString() : ""}</td>
                    <td data-label="Reviewed">{account.reviewed_at ? new Date(account.reviewed_at).toLocaleDateString() : "Not reviewed"}</td>
                    <td data-label="Actions">
                      <div className="admin-row-actions">
                        <button className="report-button" onClick={() => updateTeacherAccountStatus?.(account.id, "approved")} type="button">
                          Approve
                        </button>
                        <button className="report-button danger" onClick={() => updateTeacherAccountStatus?.(account.id, "rejected")} type="button">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {!isTeacherMode && activeSection === "guidedInsight" && (
      <section className="report-panel page-stack admin-section admin-section-panel guided-insight-panel">
        <div className="admin-header">
          <div>
            <h3>Guided Reading Insight</h3>
            <p className="muted-text">Book availability, phonics patterns, microphase recommendations, and QA warnings for assignment planning.</p>
          </div>
          <span className="guided-insight-status">{guidedReadingInsight.active}/{guidedReadingInsight.total} visible</span>
        </div>
        <div className="guided-insight-grid">
          <article>
            <strong>QA Status</strong>
            {Object.entries(guidedReadingInsight.byStatus).map(([status, count]) => (
              <span key={status}>{status}: {count}</span>
            ))}
            {guidedReadingInsight.draft > 0 && <small>{guidedReadingInsight.draft} draft/review books should not be assigned by default.</small>}
          </article>
          <article>
            <strong>Levels</strong>
            {Object.entries(guidedReadingInsight.byLevel).map(([level, count]) => (
              <span key={level}>Level {level}: {count}</span>
            ))}
          </article>
          <article>
            <strong>Microphases</strong>
            {Object.entries(guidedReadingInsight.microphaseCounts).slice(0, 6).map(([phase, count]) => (
              <span key={phase}>{phase.replace(/-/g, " ")}: {count}</span>
            ))}
          </article>
          <article>
            <strong>Top Patterns</strong>
            {Object.entries(guidedReadingInsight.patternCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([pattern, count]) => (
              <span key={pattern}>{pattern.replace(/-/g, " ")}: {count}</span>
            ))}
          </article>
        </div>
        <div className="guided-insight-recommendations">
          <strong>Sample targeted recommendations</strong>
          {guidedReadingInsight.recommendations.map(item => (
            <span key={item.book.id}>{item.book.title} · Level {item.book.level} · {item.reasons.slice(0, 2).join(" · ")}</span>
          ))}
        </div>
        {(guidedReadingInsight.missingImages > 0 || guidedReadingInsight.missingText > 0) && (
          <p className="message warning">Guided Reading warning: {guidedReadingInsight.missingImages} missing page images and {guidedReadingInsight.missingText} missing text fields.</p>
        )}
      </section>
      )}

      {!isTeacherMode && activeSection === "coverage" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Content Coverage</h3>
        <p className="muted-text">Filter active assessment content and watch for skills below the 30-question floor.</p>

        <div className="admin-content-filters">
          <select value={skillFilter} onChange={event => setSkillFilter(event.target.value)}>
            <option value="all">All skills</option>
            {questionBankCoverage.map(row => (
              <option key={row.skill} value={row.skill}>{row.skill}</option>
            ))}
          </select>

          <select value={templateFilter} onChange={event => setTemplateFilter(event.target.value)}>
            <option value="all">All templates</option>
            {templateOptions.map(template => (
              <option key={template} value={template}>{template}</option>
            ))}
          </select>

          <select value={difficultyFilter} onChange={event => setDifficultyFilter(event.target.value)}>
            <option value="all">All difficulties</option>
            {difficultyOptions.map(difficulty => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
          </select>

          <input
            value={patternFilter}
            onChange={event => setPatternFilter(event.target.value)}
            placeholder="Pattern"
            type="search"
          />

          <select value={mediaFilter} onChange={event => setMediaFilter(event.target.value)}>
            <option value="all">All media</option>
            <option value="missing_image">Missing image</option>
            <option value="missing_audio">Missing audio</option>
            <option value="complete_media">Complete media</option>
            <option value="bad_media">Bad media flagged</option>
          </select>

          <select value={statusFilterLocal} onChange={event => setStatusFilterLocal(event.target.value)}>
            <option value="all">Active + inactive</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Questions</th>
                <th>Runtime</th>
                <th>30+</th>
                <th>Templates</th>
                <th>Patterns</th>
                <th>Media gaps</th>
                <th>Bad media</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoverage.map(row => (
                <tr key={row.skill}>
                  <td data-label="Skill"><strong>{row.skill}</strong></td>
                  <td data-label="Questions">{row.total}</td>
                  <td data-label="Runtime">{row.runtimeSelectable ?? row.active}</td>
                  <td data-label="30+">{(row.runtimeSelectable ?? row.active) >= 30 ? "OK" : "Below 30"}</td>
                  <td data-label="Templates">{Object.entries(row.templates).map(([key, count]) => `${key}: ${count}`).join(", ")}</td>
                  <td data-label="Patterns">{Object.entries(row.patterns).slice(0, 8).map(([key, count]) => `${key}: ${count}`).join(", ") || "Not tagged"}</td>
                  <td data-label="Media gaps">{row.missingImage} image / {row.missingAudio} audio</td>
                  <td data-label="Bad media">{row.badMedia || 0}</td>
                  <td data-label="Status">{row.active} active / {row.inactive} inactive</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {!isTeacherMode && activeSection === "teachers" && (
      <section className="card page-stack admin-section admin-section-panel">
        <h3>Teachers</h3>
        {teachers.length === 0 ? (
          <p>No teacher data loaded.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Answers</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td data-label="Email">{teacher.email}</td>
                    <td data-label="User ID">{teacher.id}</td>
                    <td data-label="Classes">{teacher.classes}</td>
                    <td data-label="Students">{teacher.students}</td>
                    <td data-label="Answers">{teacher.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {activeSection === "classes" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Classes</h3>
        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(row => (
                <tr key={row.id}>
                  <td data-label="Name">{row.name}</td>
                  <td data-label="Teacher">{row.teacher_id}</td>
                  <td data-label="Students">{row.studentCount}</td>
                  <td data-label="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td data-label="Delete">
                    <button className="reset-button" onClick={() => deleteClass(row.id, row.name)} type="button">
                      Delete Class
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {activeSection === "students" && (
      <section className="report-panel page-stack admin-section admin-section-panel">
        <h3>Students</h3>
        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.map(row => (
                <tr key={row.id}>
                  <td data-label="Name">{row.name}</td>
                  <td data-label="Class">{row.className}</td>
                  <td data-label="Teacher">{row.teacher_id}</td>
                  <td data-label="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td data-label="Delete">
                    <button className="reset-button" onClick={() => deleteStudent(row.id, row.name)} type="button">
                      Delete Student
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </main>
  );
}
