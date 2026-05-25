import { useMemo, useRef, useState } from "react";
import {
  buildMediaQaRecords,
  MEDIA_QA_STATUSES,
  readMediaQaOverrides,
  updateMediaQaRecords
} from "../data/mediaQaManifest";
import { guidedReadingBooks } from "../data/guidedReadingBooks";

const GUIDED_IMAGE_QA_STORAGE_KEY = "lpGuidedReadingImageQa";
const GUIDED_IMAGE_QA_STATUSES = [
  "unreviewed",
  "match",
  "no_match_remake",
  "whole_book_continuity_remake",
  "whole_book_reject_story"
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

function buildGuidedImageQaRecords(overrides = readGuidedImageQaOverrides()) {
  return guidedReadingBooks.flatMap(book =>
    (book.pages || []).map(page => {
      const id = `${book.id}:page-${String(page.pageNumber || 0).padStart(3, "0")}`;
      return {
        id,
        bookId: book.id,
        title: book.title,
        level: book.level,
        type: book.type,
        reviewMode: Boolean(book.reviewMode),
        pageNumber: page.pageNumber,
        text: page.text || "",
        image: page.image || "",
        originalImage: page.originalImage || "",
        imageRemapSourcePage: page.imageRemapSourcePage || "",
        qaStatus: page.qaStatus || book.qaStatus || "",
        qaNotes: page.qaNotes || book.qaNotes || "",
        status: "unreviewed",
        reviewerNotes: "",
        reviewedAt: "",
        ...overrides[id]
      };
    })
  );
}

function guidedImageQaToCsv(records) {
  const headers = [
    "bookId",
    "title",
    "level",
    "type",
    "pageNumber",
    "status",
    "image",
    "originalImage",
    "imageRemapSourcePage",
    "text",
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
      record.pageNumber,
      record.status,
      record.image,
      record.originalImage,
      record.imageRemapSourcePage,
      record.text,
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
  const audioPreviewRef = useRef(null);
  const allRecords = useMemo(() => buildMediaQaRecords(questions, overrides).filter(record => record.mediaType === mediaType), [questions, overrides, mediaType]);
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
                {!record.exists && <small>Missing file</small>}
                {(record.heuristicFlags || []).length > 0 && <small>Flags: {record.heuristicFlags.join(", ")}</small>}
              </div>
              <div className="media-qa-card-actions">
                {MEDIA_QA_STATUSES.filter(status => status !== record.status).map(status => (
                  <button key={status} onClick={() => applyStatus([record.id], status)} type="button">{statusLabel(status)}</button>
                ))}
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookFilter, setBookFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const records = useMemo(() => buildGuidedImageQaRecords(overrides), [overrides]);
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

  function applyGuidedStatus(recordId, status) {
    const next = {
      ...overrides,
      [recordId]: {
        ...(overrides[recordId] || {}),
        status,
        reviewedAt: new Date().toISOString()
      }
    };
    writeGuidedImageQaOverrides(next);
    setOverrides(next);
  }

  function applyWholeBookStatus(bookId, status, defaultNotes) {
    const next = { ...overrides };
    records
      .filter(record => record.bookId === bookId)
      .forEach(record => {
        next[record.id] = {
          ...(next[record.id] || {}),
          status,
          reviewerNotes: next[record.id]?.reviewerNotes || defaultNotes,
          reviewedAt: new Date().toISOString()
        };
      });
    writeGuidedImageQaOverrides(next);
    setOverrides(next);
  }

  function updateNotes(recordId, reviewerNotes) {
    const next = {
      ...overrides,
      [recordId]: {
        ...(overrides[recordId] || {}),
        reviewerNotes,
        reviewedAt: new Date().toISOString()
      }
    };
    writeGuidedImageQaOverrides(next);
    setOverrides(next);
  }

  function exportGuidedQa(format) {
    const base = "literacypath-guided-reading-image-qa";
    if (format === "csv") downloadTextFile(`${base}.csv`, guidedImageQaToCsv(visibleRecords), "text/csv");
    if (format === "json") downloadTextFile(`${base}.json`, JSON.stringify(visibleRecords, null, 2), "application/json");
    if (format === "kimi") downloadTextFile(`${base}-kimi-remake-request.md`, guidedImageQaToKimiMarkdown(visibleRecords), "text/markdown");
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
            <h2>Guided Reading Image QA</h2>
            <p className="muted-text">Check whether each page picture matches the exact app text. Pages marked no match export as Kimi remake requests.</p>
          </div>
          <div className="button-row admin-controls">
            <button className="report-button" onClick={onBack} type="button">Admin Dashboard</button>
            <button className="report-button" onClick={() => exportGuidedQa("csv")} type="button">Export CSV</button>
            <button className="report-button" onClick={() => exportGuidedQa("json")} type="button">Export JSON</button>
            <button className="report-button" onClick={() => exportGuidedQa("kimi")} type="button">Export Kimi Remake Request</button>
          </div>
        </div>
        <div className="media-qa-rules">
          <span>text-picture match = keep image</span>
          <span>no match remake image using text = send to Kimi</span>
          <span>whole book continuity remake = new full image set</span>
          <span>reject whole book = add +1 replacement book next round</span>
          <span>exact app text is the source of truth</span>
          <span>no embedded text or speech bubbles</span>
          <span>preserve character continuity</span>
        </div>
        <p className="muted-text">
          {counts.match || 0} matched · {counts.no_match_remake || 0} page remakes · {counts.whole_book_continuity_remake || 0} continuity remakes · {counts.whole_book_reject_story || 0} story rejections · {counts.unreviewed || 0} unreviewed
        </p>
      </section>

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
              {record.image ? <img alt={`${record.title} page ${record.pageNumber}`} src={record.image} /> : <span>Missing image</span>}
            </div>
            <div className="guided-image-qa-body">
              <div>
                <p className="panel-label">{record.bookId} · Level {record.level} · Page {record.pageNumber}</p>
                <h3>{record.title}</h3>
                <p className="guided-image-qa-text">{record.text}</p>
              </div>
              <small>{record.image}</small>
              {record.imageRemapSourcePage && (
                <small>Remapped from generated page {record.imageRemapSourcePage}{record.originalImage ? ` (${record.originalImage})` : ""}</small>
              )}
              <span>{statusLabel(record.status)}</span>
              <textarea
                aria-label={`Notes for ${record.title} page ${record.pageNumber}`}
                onChange={event => updateNotes(record.id, event.target.value)}
                placeholder="Optional notes for Kimi or QA..."
                value={record.reviewerNotes || ""}
              />
              <div className="guided-image-qa-actions">
                <button className="report-button" onClick={() => applyGuidedStatus(record.id, "match")} type="button">
                  Text-picture match
                </button>
                <button className="report-button danger" onClick={() => applyGuidedStatus(record.id, "no_match_remake")} type="button">
                  No match remake image using text
                </button>
                <button className="report-button danger" onClick={() => applyWholeBookStatus(record.bookId, "whole_book_continuity_remake", "Whole-book continuity remake requested.")} type="button">
                  Whole book continuity remake
                </button>
                <button className="report-button danger" onClick={() => applyWholeBookStatus(record.bookId, "whole_book_reject_story", "Whole book rejected; add +1 replacement book to next development round.")} type="button">
                  Reject whole book/story
                </button>
                <button className="report-button" onClick={() => applyGuidedStatus(record.id, "unreviewed")} type="button">
                  Undo
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export function AdminDashboardPage({
  flags,
  teachers,
  classes,
  students,
  statusFilter,
  setStatusFilter,
  loading,
  refreshDashboard,
  resolveFlag,
  reopenFlag,
  deleteClass,
  deleteStudent,
  questionBankCoverage = [],
  mediaQuestions = [],
  message
}) {
  const [skillFilter, setSkillFilter] = useState("all");
  const [adminQaPage, setAdminQaPage] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    if (window.location.pathname.includes("/admin/media/images")) return "images";
    if (window.location.pathname.includes("/admin/media/audio")) return "audio";
    if (window.location.pathname.includes("/admin/guided-reading/image-qa")) return "guidedReadingImages";
    return "dashboard";
  });
  const [templateFilter, setTemplateFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [patternFilter, setPatternFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusFilterLocal, setStatusFilterLocal] = useState("all");
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
          <div>
            <h2>Admin Dashboard</h2>
            <p className="muted-text">Review flagged questions and manage app data.</p>
          </div>

          <div className="button-row admin-controls">
            <button className="report-button" onClick={() => openAdminQaPage("images")} type="button">
              Image QA
            </button>
            <button className="report-button" onClick={() => openAdminQaPage("audio")} type="button">
              Audio QA
            </button>
            <button className="report-button" onClick={() => openAdminQaPage("guidedReadingImages")} type="button">
              Guided Reading Image QA
            </button>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="open">Open flags</option>
              <option value="resolved">Resolved flags</option>
              <option value="all">All flags</option>
            </select>
            <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="report-panel page-stack admin-section">
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
                  <td><strong>{row.skill}</strong></td>
                  <td>{row.total}</td>
                  <td>{row.runtimeSelectable ?? row.active}</td>
                  <td>{(row.runtimeSelectable ?? row.active) >= 30 ? "OK" : "Below 30"}</td>
                  <td>{Object.entries(row.templates).map(([key, count]) => `${key}: ${count}`).join(", ")}</td>
                  <td>{Object.entries(row.patterns).slice(0, 8).map(([key, count]) => `${key}: ${count}`).join(", ") || "Not tagged"}</td>
                  <td>{row.missingImage} image / {row.missingAudio} audio</td>
                  <td>{row.badMedia || 0}</td>
                  <td>{row.active} active / {row.inactive} inactive</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Flagged Questions</h3>

        {flags.length === 0 ? (
          <p>No flagged questions for this filter.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Student</th>
                  <th>Skill</th>
                  <th>Question</th>
                  <th>Choices</th>
                  <th>Correct</th>
                  <th>Issue</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flags.map(flag => (
                  <tr key={flag.id}>
                    <td>{flag.status}</td>
                    <td>{flag.created_at ? new Date(flag.created_at).toLocaleString() : ""}</td>
                    <td>{flag.teacher_email || flag.teacher_id}</td>
                    <td>{flag.class_name}</td>
                    <td>{flag.student_name}</td>
                    <td>
                      <strong>{flag.skill}</strong>
                      <div className="muted-text">{flag.diagnostic_target}</div>
                    </td>
                    <td className="admin-question-cell">{flag.question_text}</td>
                    <td>{Array.isArray(flag.choices) ? flag.choices.join(", ") : ""}</td>
                    <td>{flag.correct_answer}</td>
                    <td>{flag.issue_type}</td>
                    <td>{flag.note}</td>
                    <td>
                      {flag.status === "resolved" ? (
                        <button className="report-button" onClick={() => reopenFlag(flag.id)} type="button">
                          Reopen
                        </button>
                      ) : (
                        <button className="report-button" onClick={() => resolveFlag(flag.id)} type="button">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card page-stack admin-section">
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
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>{teacher.email}</td>
                    <td>{teacher.id}</td>
                    <td>{teacher.classes}</td>
                    <td>{teacher.students}</td>
                    <td>{teacher.answers}</td>
                    <td>{teacher.flags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-panel page-stack admin-section">
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
                  <td>{row.name}</td>
                  <td>{row.teacher_id}</td>
                  <td>{row.studentCount}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td>
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

      <section className="report-panel page-stack admin-section">
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
                  <td>{row.name}</td>
                  <td>{row.className}</td>
                  <td>{row.teacher_id}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td>
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
    </main>
  );
}
