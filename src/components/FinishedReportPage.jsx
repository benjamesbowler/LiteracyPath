import { useEffect, useMemo, useState } from "react";
import { storyQuests } from "../data/storyQuests.js";
import {
  buildStudentReportModel,
  formatItemLabel,
  getSkillArea
} from "../data/reportingSystem.js";
import {
  loadStoryQuestProgress,
  summarizeStoryQuestProgress
} from "../utils/storyQuestProgress.js";

const STATUS_TEXT = {
  on_track: "On Track",
  developing: "Developing",
  needs_support: "Needs Support",
  not_started: "Not Assessed"
};

const STATUS_RULES = {
  mastered: { label: "Mastered", className: "mastered" },
  developing: { label: "Developing", className: "developing" },
  needs_support: { label: "Needs Support", className: "needs-support" },
  not_assessed: { label: "Not assessed", className: "not-assessed" }
};

const AREA_ORDER = [
  "Phonological Awareness",
  "Phonics",
  "High-Frequency Words",
  "Grammar / Language",
  "Guided Reading"
];
const EMPTY_REPORT_ROWS = [];

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function statusFromAccuracy(accuracy, hasData = true) {
  if (!hasData) return STATUS_RULES.not_assessed;
  if (accuracy >= 80) return STATUS_RULES.mastered;
  if (accuracy >= 60) return STATUS_RULES.developing;
  return STATUS_RULES.needs_support;
}

function getSnapshotBadgeClass(statusId = "") {
  switch (statusId) {
    case "on_track":
      return "lg-badge-on-track";
    case "developing":
      return "lg-badge-developing";
    case "needs_support":
      return "lg-badge-needs-support";
    default:
      return "lg-badge-not-started";
  }
}

function getMetricClass(role = "") {
  switch (role) {
    case "accuracy":
      return "lg-metric-teal";
    case "skill":
      return "lg-metric-blue";
    case "skills":
      return "lg-metric-green";
    case "answered":
      return "lg-metric-purple";
    default:
      return "lg-metric-neutral";
  }
}

function getSkillTileDomainClass(row = {}) {
  const value = `${row.skillArea || ""} ${row.skillName || ""}`.toLowerCase();
  if (value.includes("phonological")) return "lg-tile-phonological";
  if (value.includes("high-frequency")) return "lg-tile-hfw";
  if (value.includes("grammar") || value.includes("language")) return "lg-tile-grammar";
  if (value.includes("guided reading") || value.includes("reading")) return "lg-tile-reading";
  return "lg-tile-phonics";
}

function getSkillTileStatusClass(statusClassName = "") {
  switch (statusClassName) {
    case "mastered":
      return "lg-tile-mastered";
    case "developing":
      return "lg-tile-developing";
    case "needs-support":
      return "lg-tile-support";
    default:
      return "";
  }
}

function normaliseList(values = []) {
  return Array.from(new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean)));
}

function formatClassLabel(value = "") {
  return value || "Class not linked";
}

function getGuidedReadingNoteRows(summary = {}) {
  return [
    summary.wholeBookNote ? { label: "Book", note: summary.wholeBookNote } : null,
    ...(summary.pageNotes || []).map(item => ({
      label: `Page ${item.page}`,
      note: item.note
    }))
  ].filter(item => item?.note?.trim());
}

function buildGuidedReadingReportRows(records = {}, module = {}) {
  const summariesByBook = new Map(
    (module.summarizeGuidedReadingRecords?.(records) || []).map(summary => [summary.bookId, summary])
  );
  const books = module.guidedReadingBooks || [];

  return Object.entries(records || {})
    .map(([bookId, record = {}]) => {
      const book = books.find(item => item.id === bookId) || {};
      const progress = module.getGuidedReadingProgress?.(book, { ...record, bookId }) || {};
      const summary = summariesByBook.get(bookId) || module.summarizeGuidedReadingRecord?.(record) || {};
      const readCount = Math.max(Number(progress.readCount || record.readCount || 0), progress.completed ? 1 : 0);

      return {
        bookId,
        title: book.title || record.title || bookId,
        level: book.level || record.level || progress.level || "",
        lastReadAt: progress.lastReadAt || record.lastReadAt || record.completedAt || record.updatedAt || "",
        readCount,
        latestAccuracy: Number(summary.accuracy || 0),
        supportWords: summary.supportWords || [],
        correctWords: summary.correctWords || [],
        notes: getGuidedReadingNoteRows(summary),
        pagesRead: Number(progress.completedPages || record.completedPages || 0),
        attempted: Number(summary.attempted || 0)
      };
    })
    .filter(row =>
      row.pagesRead > 0 ||
      row.readCount > 0 ||
      row.attempted > 0 ||
      row.correctWords.length > 0 ||
      row.supportWords.length > 0 ||
      row.notes.length > 0
    )
    .sort((a, b) =>
      String(b.lastReadAt).localeCompare(String(a.lastReadAt)) ||
      a.title.localeCompare(b.title)
    );
}

function SectionBand({ accent = "#0D7A73", children, subtitle, title }) {
  return (
    <div className="student-report-section-band" style={{ "--section-accent": accent }}>
      <div className="student-report-section-stripe" aria-hidden="true"></div>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ReportActions({ exportCSVData, returnToTeacherDashboard, startAssessment }) {
  return (
    <div className="student-report-actions screen-only">
      <button className="main-button" onClick={startAssessment} type="button">Start Assessment</button>
      <button className="report-button primary-export" onClick={() => window.print()} type="button">Export Report</button>
      {exportCSVData && (
        <button className="report-button csv-link" onClick={exportCSVData} type="button">Download Data (CSV)</button>
      )}
      {returnToTeacherDashboard && (
        <button className="report-button" onClick={returnToTeacherDashboard} type="button">Teacher Dashboard</button>
      )}
    </div>
  );
}

function StatusCallout({ snapshot }) {
  return (
    <section className={`student-report-status-callout ${snapshot.status.id}`}>
      <div>
        <strong className={`lg-badge ${getSnapshotBadgeClass(snapshot.status.id)}`}>
          <span className="lg-badge-icon" aria-hidden="true">{snapshot.status.id === "needs_support" ? "!" : "✓"}</span>
          {STATUS_TEXT[snapshot.status.id] || snapshot.status.label}
        </strong>
        <span>{snapshot.status.description}</span>
      </div>
      <p>Last active: <strong>{snapshot.lastActive || "No saved activity"}</strong></p>
    </section>
  );
}

function SnapshotGrid({ model, skillTotal }) {
  const metrics = [
    ["Overall Accuracy", `${model.snapshot.accuracy}%`, "accuracy"],
    ["Current Skill", model.snapshot.currentSkill, "skill"],
    ["Skills Passed", `${model.snapshot.skillsPassed} / ${skillTotal}`, "skills"],
    ["Questions Answered", model.snapshot.totalAnswered, "answered"]
  ];
  return (
    <section className="student-report-snapshot-grid lg-metric-grid">
      {metrics.map(([label, value, role]) => (
        <article className={`snapshot-metric ${role} lg-metric-card ${getMetricClass(role)}`} key={label}>
          <span className="lg-metric-label">{label}</span>
          <strong className="lg-metric-value">{value}</strong>
        </article>
      ))}
    </section>
  );
}

function buildElAssessmentCards({ letterAssessment = [], patternAssessment = [] }) {
  const nameItems = letterAssessment.map(item => ({
    label: item.letter,
    known: Boolean(item.knowsName)
  }));
  const soundItems = letterAssessment.map(item => ({
    label: `/${String(item.letter || "").toLowerCase()}/`,
    known: Boolean(item.knowsSound)
  }));
  const namesKnown = nameItems.filter(item => item.known).length;
  const soundsKnown = soundItems.filter(item => item.known).length;
  const nameTotal = nameItems.length || 52;
  const soundTotal = soundItems.length || 52;
  const patternItems = patternAssessment.map(item => ({
    label: item.pattern,
    known: Boolean(item.soundCorrect && item.wordCorrect),
    partial: Boolean(item.soundCorrect || item.wordCorrect) && !(item.soundCorrect && item.wordCorrect)
  }));
  const patternTotal = patternAssessment.length ? patternAssessment.length * 2 : 0;
  const patternCorrect = patternAssessment.reduce((sum, item) =>
    sum + Number(Boolean(item.soundCorrect)) + Number(Boolean(item.wordCorrect)), 0);

  return [
    {
      title: "Letter Names",
      correct: namesKnown,
      total: nameTotal,
      accuracy: nameTotal ? clampPercent((namesKnown / nameTotal) * 100) : 0,
      hasData: letterAssessment.length > 0,
      items: nameItems
    },
    {
      title: "Letter Sounds",
      correct: soundsKnown,
      total: soundTotal,
      accuracy: soundTotal ? clampPercent((soundsKnown / soundTotal) * 100) : 0,
      hasData: letterAssessment.length > 0,
      items: soundItems
    },
    {
      title: "Phonics Patterns",
      correct: patternCorrect,
      total: patternTotal,
      accuracy: patternTotal ? clampPercent((patternCorrect / patternTotal) * 100) : 0,
      hasData: patternAssessment.length > 0,
      items: patternItems
    }
  ];
}

function ElItemChip({ label, known, partial = false }) {
  const cls = known ? "el-chip-known" : partial ? "el-chip-partial" : "el-chip-unknown";
  return <span className={`el-item-chip ${cls}`}>{label}</span>;
}

function ElAssessmentSection({ cards }) {
  const hasAny = cards.some(card => card.hasData);
  if (!hasAny) {
    return (
      <div className="student-report-muted-card">
        No EL assessment recorded yet. Run an EL assessment to populate this section.
      </div>
    );
  }

  return (
    <div className="student-report-el-grid lg-el-grid">
      {cards.map(card => {
        const status = statusFromAccuracy(card.accuracy, card.hasData);
        return (
          <article className={`el-card ${status.className} lg-el-card`} key={card.title}>
            <h3 className="lg-el-label">{card.title}</h3>
            <strong className="lg-el-score">{card.total ? `${card.correct} / ${card.total}` : "Not assessed"}</strong>
            <p>{card.hasData ? `${card.accuracy}% · ${status.label.toUpperCase()}` : "Not assessed"}</p>
            {card.hasData && card.items?.length > 0 && (
              <div className="el-chip-grid">
                {card.items.map((item, index) => (
                  <ElItemChip
                    key={`${card.title}-${item.label}-${index}`}
                    label={item.label}
                    known={item.known}
                    partial={item.partial}
                  />
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function groupSkillRows(rows = []) {
  const grouped = new Map();
  rows.forEach(row => {
    const key = row.skillArea || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });
  return Array.from(grouped.entries())
    .sort(([a], [b]) => {
      const ai = AREA_ORDER.indexOf(a);
      const bi = AREA_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.localeCompare(b);
    });
}

function SkillTile({ row }) {
  const hasData =
    row.attempts > 0 ||
    row.status === "passed" ||
    (row.coverage?.mastered > 0 && row.coverage?.total > 0);
  const status = statusFromAccuracy(row.accuracy, hasData);
  const scoreText = row.checkpointHistory.at(-1)?.score || row.checkpointScore;
  const unit = row.coverage?.unit || "items";
  const total = row.coverage?.total || scoreText?.split("/")?.[1] || 0;
  const mastered = row.coverage?.mastered || scoreText?.split("/")?.[0] || 0;

  return (
    <article
      className={`student-report-skill-tile ${status.className} lg-skill-tile ${getSkillTileDomainClass(row)} ${getSkillTileStatusClass(status.className)}`}
      style={{ "--skill-accent": row.skillAreaColor || "#0D7A73" }}
    >
      <span className="lg-skill-tile-num">{row.index + 1}</span>
      <strong className="lg-skill-tile-name">{row.label}</strong>
      <b className="lg-skill-tile-score">{hasData ? `${row.accuracy}%` : "—"}</b>
      <small className="lg-skill-tile-sub">{total ? `${mastered}/${total} ${unit}` : "No item evidence"} · {status.label}</small>
    </article>
  );
}

function SkillSetSection({ rows }) {
  return (
    <div className="student-report-skill-groups">
      {groupSkillRows(rows).map(([area, areaRows]) => {
        const areaMeta = getSkillArea({ skillName: area });
        return (
          <section className="student-report-skill-group lg-domain-section" key={area}>
            <div className="lg-domain-header">
              <div className="student-report-skill-rule lg-domain-pip" style={{ "--area-color": areaMeta.color, background: areaMeta.color }}></div>
              <h3 className="lg-domain-label" style={{ color: areaMeta.color }}>{area}</h3>
            </div>
            <div className="student-report-skill-grid lg-skill-tiles">
              {areaRows.map(row => <SkillTile key={row.skillId} row={row} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GrowthSection({ model, letterAssessment = [], patternAssessment = [] }) {
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const skillRows = model.skillMapRows || [];
  const dropdownOptions = [
    { value: "", label: "All Skills (overview)" },
    ...skillRows.map(row => {
      const history = row.checkpointHistory || [];
      return {
        value: row.skillId,
        label: `${row.index + 1}. ${row.label}${
          history.length
            ? ` (${history.length} attempt${history.length === 1 ? "" : "s"})`
            : " — not yet attempted"
        }`
      };
    }),
    {
      value: "el_letter",
      label: `EL: Letter Name & Sound${letterAssessment.length ? ` (${letterAssessment.length} items)` : " — not yet assessed"}`
    },
    {
      value: "el_pattern",
      label: `EL: Advanced Phonics${patternAssessment.length ? ` (${patternAssessment.length} items)` : " — not yet assessed"}`
    }
  ];
  const selectedRow = selectedSkillId
    ? skillRows.find(row => row.skillId === selectedSkillId)
    : null;

  return (
    <div className="growth-section">
      <div className="growth-section-controls screen-only">
        <label className="growth-skill-selector">
          <span>Skill</span>
          <select value={selectedSkillId} onChange={event => setSelectedSkillId(event.target.value)}>
            {dropdownOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {!selectedSkillId && (
        <AllSkillsBarChart
          rows={skillRows}
          letterAssessment={letterAssessment}
          patternAssessment={patternAssessment}
        />
      )}
      {selectedSkillId === "el_letter" && (
        <ElSkillSummary
          title="EL: Letter Name & Sound"
          records={letterAssessment}
          getAccuracy={item => Math.round((((item.knowsName ? 1 : 0) + (item.knowsSound ? 1 : 0)) / 2) * 100)}
          getLabel={item => item.letter || ""}
        />
      )}
      {selectedSkillId === "el_pattern" && (
        <ElSkillSummary
          title="EL: Advanced Phonics"
          records={patternAssessment}
          getAccuracy={item => Math.round((((item.soundCorrect ? 1 : 0) + (item.wordCorrect ? 1 : 0)) / 2) * 100)}
          getLabel={item => item.pattern || ""}
        />
      )}
      {selectedRow && <SkillLineChart row={selectedRow} />}
    </div>
  );
}

function AllSkillsBarChart({ rows = [], letterAssessment = [], patternAssessment = [] }) {
  return (
    <div className="growth-all-skills-chart">
      <div className="growth-all-skills-key">
        <span className="growth-key-item attempted">Attempted</span>
        <span className="growth-key-item not-started">Not started yet</span>
      </div>
      <div className="growth-bar-list" role="list">
        {rows.map(row => {
          const hasData = (row.checkpointHistory || []).length > 0 || row.attempts > 0;
          const pct = clampPercent(row.accuracy);
          return (
            <div
              className={`growth-bar-row${hasData ? "" : " not-started"}`}
              key={row.skillId}
              role="listitem"
              aria-label={`${row.label}: ${hasData ? `${pct}%` : "not started"}`}
            >
              <span className="growth-bar-label" title={row.label}>
                {row.index + 1}. {row.label}
              </span>
              <div className="growth-bar-track">
                <div
                  className="growth-bar-fill"
                  style={{
                    "--bar-width": `${pct}%`,
                    width: hasData ? `${pct}%` : "0%",
                    background: hasData ? (row.skillAreaColor || "#0C6B65") : "#e5e7eb"
                  }}
                />
                <span className="growth-bar-pct">{hasData ? `${pct}%` : "Not started"}</span>
              </div>
            </div>
          );
        })}
        {(() => {
          const namesKnown = letterAssessment.filter(item => item.knowsName).length;
          const soundsKnown = letterAssessment.filter(item => item.knowsSound).length;
          const elTotal = letterAssessment.length * 2 || 52;
          const elCorrect = namesKnown + soundsKnown;
          const pct = elTotal ? clampPercent((elCorrect / elTotal) * 100) : 0;
          const hasData = letterAssessment.length > 0;
          return (
            <div
              key="el-letter-growth-bar"
              className={`growth-bar-row${hasData ? "" : " not-started"}`}
              role="listitem"
              aria-label={`EL: Letter Name & Sound: ${hasData ? `${pct}%` : "not assessed"}`}
            >
              <span className="growth-bar-label">EL: Letter Name & Sound</span>
              <div className="growth-bar-track">
                <div
                  className="growth-bar-fill"
                  style={{
                    width: hasData ? `${pct}%` : "0%",
                    background: hasData ? "#2563EB" : "#e5e7eb"
                  }}
                />
                <span className="growth-bar-pct">{hasData ? `${pct}%` : "Not assessed"}</span>
              </div>
            </div>
          );
        })()}
        {(() => {
          const patternTotal = patternAssessment.length * 2 || 0;
          const patternCorrect = patternAssessment.reduce(
            (sum, item) => sum + (item.soundCorrect ? 1 : 0) + (item.wordCorrect ? 1 : 0),
            0
          );
          const pct = patternTotal ? clampPercent((patternCorrect / patternTotal) * 100) : 0;
          const hasData = patternAssessment.length > 0;
          return (
            <div
              key="el-pattern-growth-bar"
              className={`growth-bar-row${hasData ? "" : " not-started"}`}
              role="listitem"
              aria-label={`EL: Advanced Phonics: ${hasData ? `${pct}%` : "not assessed"}`}
            >
              <span className="growth-bar-label">EL: Advanced Phonics</span>
              <div className="growth-bar-track">
                <div
                  className="growth-bar-fill"
                  style={{
                    width: hasData ? `${pct}%` : "0%",
                    background: hasData ? "#7C3AED" : "#e5e7eb"
                  }}
                />
                <span className="growth-bar-pct">{hasData ? `${pct}%` : "Not assessed"}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function SkillLineChart({ row }) {
  const points = row.checkpointHistory || [];
  if (!points.length) {
    return <div className="student-report-muted-card">No checkpoint rounds recorded for {row.label} yet.</div>;
  }

  const width = 700;
  const height = 230;
  const left = 54;
  const right = 18;
  const top = 24;
  const bottom = 50;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxX = Math.max(1, points.length - 1);
  const color = row.skillAreaColor || "#0C6B65";
  const line = points.map((point, index) => {
    const x = left + (points.length === 1 ? plotWidth / 2 : (index / maxX) * plotWidth);
    const y = top + (1 - clampPercent(point.accuracy) / 100) * plotHeight;
    const attemptDate = point.date
      ? new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : null;
    return {
      ...point,
      x,
      y,
      label: `Attempt ${index + 1}`,
      sublabel: attemptDate || ""
    };
  });
  const path = line.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const first = line[0];
  const latest = line.at(-1);
  const delta = clampPercent(latest.accuracy) - clampPercent(first.accuracy);

  return (
    <div className="student-report-growth-card">
      <div className="growth-card-top">
        <p><strong>{row.label}</strong> - {points.length} checkpoint attempt{points.length === 1 ? "" : "s"}</p>
        <span className={`growth-delta ${delta >= 0 ? "positive" : "negative"}`}>
          {delta >= 0 ? "+" : ""}{delta}% since first round
        </span>
      </div>
      <svg className="student-report-growth-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${row.label} checkpoint accuracy`}>
        {[100, 80, 60, 40, 20].map(value => {
          const y = top + (1 - value / 100) * plotHeight;
          return (
            <g key={value}>
              <text x={left - 8} y={y + 5} textAnchor="end">{value}%</text>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e2e8f0" />
            </g>
          );
        })}
        {line.map((point, index) => (
          <g key={`xlabel-${index}`}>
            <text x={point.x} y={height - 20} textAnchor="middle" className="growth-axis-label">{point.label}</text>
            {point.sublabel && (
              <text x={point.x} y={height - 6} textAnchor="middle" className="growth-axis-sublabel">{point.sublabel}</text>
            )}
          </g>
        ))}
        <path d={path} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: color }} />
        {line.map((point, index) => (
          <circle
            key={`${point.label}-dot-${index}`}
            cx={point.x}
            cy={point.y}
            r="6"
            style={{ fill: point.passed ? color : "#fff", stroke: color, strokeWidth: 2 }}
          >
            <title>{`${point.label}: ${point.accuracy}% (${point.score})${point.passed ? " passed" : ""}`}</title>
          </circle>
        ))}
      </svg>
      <p className="growth-summary">
        {row.label}: {first.accuracy}% on attempt 1
        {points.length > 1 ? ` → ${latest.accuracy}% on attempt ${points.length}` : " (1 attempt recorded so far)"}
        {latest.passed ? " — checkpoint passed" : ""}
      </p>
    </div>
  );
}

function ElSkillSummary({ title, records = [], getAccuracy, getLabel }) {
  if (!records.length) {
    return <div className="student-report-muted-card">No {title} data recorded yet.</div>;
  }
  const fullyCorrect = records.filter(item => getAccuracy(item) >= 100).length;
  const overallPct = Math.round((fullyCorrect / records.length) * 100);

  return (
    <div className="growth-el-summary-card">
      <div className="growth-card-top">
        <p><strong>{title}</strong> - {records.length} items assessed</p>
        <span className="growth-delta positive">{overallPct}% overall</span>
      </div>
      <div className="growth-el-item-grid" role="list">
        {records.map((item, index) => {
          const accuracy = getAccuracy(item);
          const label = getLabel(item);
          return (
            <div
              key={`${label}-${index}`}
              className={`growth-el-item ${accuracy >= 100 ? "correct" : accuracy >= 50 ? "partial" : "incorrect"}`}
              role="listitem"
              title={`${label}: ${accuracy}%`}
            >
              {label}
            </div>
          );
        })}
      </div>
      <p className="growth-summary muted-text">{fullyCorrect} of {records.length} items fully correct.</p>
    </div>
  );
}

function LearnedSection({ correctWordRows, model }) {
  const mastered = model.itemGroups.mastered || [];
  const hfwAssessmentWords = mastered
    .filter(row => row.itemType === "sight_word")
    .map(row => row.label || row.itemKey)
    .filter(Boolean);
  const guidedReadingCorrectWords = correctWordRows.map(row => row.word).filter(Boolean);
  const allSightWords = Array.from(new Set([...hfwAssessmentWords, ...guidedReadingCorrectWords]))
    .sort((a, b) => a.localeCompare(b));
  const sounds = mastered.filter(row =>
    row.itemType === "initial_sound" ||
    row.itemType === "final_sound" ||
    row.itemType === "rhyming_family" ||
    row.itemType === "short_vowel" ||
    row.itemType === "letter_sound" ||
    row.itemType === "phonics_pattern"
  );
  const letterNames = mastered.filter(row => row.itemType === "letter_name");
  const soundsAndLetterNames = [...sounds, ...letterNames];

  return (
    <div className="student-report-learned-grid">
      <article className="student-report-learned-card words">
        <h3>Sight Words Mastered ({allSightWords.length})</h3>
        <ChipTextList items={allSightWords} limit={Infinity} />
      </article>
      <article className="student-report-learned-card sounds">
        <h3>Sounds / Letter Names Mastered ({soundsAndLetterNames.length})</h3>
        <SoundsProgressChart sounds={sounds} letterNames={letterNames} />
        <ChipTextList items={soundsAndLetterNames.map(row => row.label || row.itemKey)} limit={Infinity} />
      </article>
      <article className="student-report-learned-card mastered">
        <h3>Guided Reading — Words Read Correctly (recent books)</h3>
        <ChipTextList
          items={correctWordRows.map(row => `${row.word} (${row.title}, p.${row.page})`)}
          limit={Infinity}
        />
      </article>
    </div>
  );
}

function SoundsProgressChart({ sounds = [], letterNames = [] }) {
  const level1Items = sounds.filter(row =>
    row.itemType === "initial_sound" ||
    row.itemType === "rhyming_family" ||
    row.itemType === "short_vowel"
  );
  const level2Items = sounds
    .filter(row =>
      row.itemType === "final_sound" ||
      row.itemType === "letter_sound" ||
      row.itemType === "phonics_pattern"
    )
    .concat(letterNames);
  const level1Total = 25;
  const level2Total = Math.max(level2Items.length + 5, 26);
  const level1Pct = Math.min(100, Math.round((level1Items.length / level1Total) * 100));
  const level2Pct = Math.min(100, level2Items.length ? Math.round((level2Items.length / level2Total) * 100) : 0);

  return (
    <div className="sounds-progress-chart" aria-label="Sounds mastery by level">
      <div className="sounds-progress-row">
        <span className="sounds-progress-label">Level 1 Sounds</span>
        <div className="sounds-progress-track">
          <div
            className="sounds-progress-fill level1"
            style={{ width: `${level1Pct}%` }}
            aria-label={`${level1Items.length} of ${level1Total} Level 1 sounds mastered`}
          />
        </div>
        <span className="sounds-progress-count">{level1Items.length}/{level1Total}</span>
      </div>
      <div className="sounds-progress-row">
        <span className="sounds-progress-label">Level 2 Sounds / Letter Names</span>
        <div className="sounds-progress-track">
          <div
            className="sounds-progress-fill level2"
            style={{ width: `${level2Pct}%` }}
            aria-label={`${level2Items.length} of ${level2Total} Level 2 items mastered`}
          />
        </div>
        <span className="sounds-progress-count">{level2Items.length}/{level2Total}</span>
      </div>
    </div>
  );
}

function ChipTextList({ items = [], limit = Infinity }) {
  const list = normaliseList(items);
  const visible = list.slice(0, limit);
  return (
    <p className="student-report-chip-text">
      {visible.length ? visible.map(item => <span key={item}>{item}</span>) : <em>None recorded yet</em>}
      {list.length > visible.length && <strong>+{list.length - visible.length} more</strong>}
    </p>
  );
}

function getTeachingNote(row, recommendations = {}) {
  const match = (recommendations.focusItems || []).find(item =>
    item.itemType === row.itemType && item.itemKey === row.itemKey
  );
  if (match?.teachingNote) return match.teachingNote;
  const examples = normaliseList([...(row.missedExamples || []), ...(row.examples || [])]).slice(0, 4);
  return examples.length
    ? `Practise with ${examples.join(", ")}.`
    : `Practise ${row.label || formatItemLabel(row.itemType, row.itemKey)} in a short mixed review.`;
}

function SupportSection({ model }) {
  const rows = (model.itemGroups.needsSupport || [])
    .filter(row => row.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || a.label.localeCompare(b.label))
    .slice(0, 15);

  if (!rows.length) {
    return <div className="student-report-muted-card">No items below 60% accuracy are currently recorded.</div>;
  }

  return (
    <div className="student-report-support-table-wrap">
      <table className="student-report-support-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Skill Area</th>
            <th>Score</th>
            <th>Teaching Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const area = getSkillArea({ skillId: row.skillId, skillName: row.skillName });
            return (
              <tr key={`${row.itemType}-${row.itemKey}`}>
                <td>{row.label}</td>
                <td>{area.label} — {row.skillName}</td>
                <td><strong>{row.correct}/{row.attempts} · {row.accuracy}%</strong></td>
                <td>{getTeachingNote(row, model.recommendations)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GuidedReadingSection({ guidedReadingReportRows, storyQuestSummary }) {
  const storyRows = storyQuestSummary.rows || [];
  const storyWords = normaliseList(storyRows.flatMap(row => row.words || [])).sort((a, b) => a.localeCompare(b));

  return (
    <div className="student-report-reading-stack">
      {guidedReadingReportRows.length ? (
        <div className="student-report-reading-table-wrap">
          <table className="student-report-reading-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Level</th>
                <th>Reads</th>
                <th>Accuracy</th>
                <th>Support Words</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {guidedReadingReportRows.slice(0, 8).map(row => (
                <tr key={row.bookId}>
                  <td>{row.title}</td>
                  <td>{row.level || "—"}</td>
                  <td>{row.readCount}</td>
                  <td className={row.latestAccuracy >= 80 ? "score-good" : row.latestAccuracy >= 60 ? "score-mid" : "score-low"}>
                    {row.latestAccuracy || 0}%
                  </td>
                  <td>{row.supportWords.length ? row.supportWords.slice(0, 8).join(", ") : "none"}</td>
                  <td>{row.notes[0]?.note || "No notes recorded."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="student-report-muted-card">No guided reading record saved yet.</div>
      )}

      <article className="story-vocabulary-card">
        <h3>Story Quest — Vocabulary Collected</h3>
        {storyRows.length ? (
          <>
            {storyRows.slice(0, 3).map(row => (
              <p key={row.questId}>
                <strong>{row.title}</strong> · {row.stars || row.starCount || (row.completed ? 1 : 0)} stars · {row.status}
              </p>
            ))}
            <ChipTextList items={storyWords} limit={40} />
          </>
        ) : (
          <p>No Story Quest vocabulary collected yet.</p>
        )}
      </article>
    </div>
  );
}

function NextSessionPlan({ model }) {
  return (
    <div className="student-report-next-grid lg-next-plan">
      <article className="student-report-next-card recommended lg-plan-card lg-plan-card-focus">
        <h3>Recommended Focus</h3>
        <h4>{model.recommendations.recommendedSkill}</h4>
        <p>{model.recommendations.reason}</p>
        <strong>Focus items:</strong>
        {(model.recommendations.focusItems || []).slice(0, 3).map(item => (
          <p key={`${item.itemType}-${item.itemKey}`}><b>{item.label}</b> — {item.teachingNote}</p>
        ))}
        {!model.recommendations.focusItems?.length && <p>Start with a short checkpoint to gather fresh evidence.</p>}
      </article>
      <article className="student-report-next-card quick lg-plan-card lg-plan-card-wins">
        <h3>Quick Wins ✓</h3>
        {(model.recommendations.quickWins || []).length ? (
          <ul>{model.recommendations.quickWins.map(item => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>No quick wins recorded yet.</p>
        )}
      </article>
      <article className="student-report-next-card caution lg-plan-card lg-plan-card-flags">
        <h3>Caution Flags !</h3>
        {(model.recommendations.cautionFlags || []).length ? (
          <ul>{model.recommendations.cautionFlags.map(item => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>No caution flags at this time.</p>
        )}
      </article>
    </div>
  );
}

export function FinishedReportPage({
  startAssessment,
  studentName,
  className = "",
  totalAnswered,
  accuracy,
  currentStage,
  currentSkillIndex,
  skillTree,
  currentStageQuestions,
  mastery,
  coverageSnapshot,
  skillMasterySummary = [],
  itemMastery = {},
  assessmentHistory = [],
  exportCSVData,
  letterAssessment = [],
  patternAssessment = [],
  guidedReadingRecords = {},
  storyQuestProgressScopeKey = "default",
  returnToTeacherDashboard
}) {
  const [guidedReadingReportRows, setGuidedReadingReportRows] = useState([]);
  const [guidedReadingWordRows, setGuidedReadingWordRows] = useState([]);
  const hasGuidedReadingRecords = Object.keys(guidedReadingRecords || {}).length > 0;
  const activeGuidedReadingReportRows = hasGuidedReadingRecords ? guidedReadingReportRows : EMPTY_REPORT_ROWS;
  const activeGuidedReadingWordRows = hasGuidedReadingRecords ? guidedReadingWordRows : EMPTY_REPORT_ROWS;
  const storyQuestSummary = useMemo(() =>
    summarizeStoryQuestProgress(loadStoryQuestProgress(storyQuestProgressScopeKey), storyQuests),
  [storyQuestProgressScopeKey]);

  useEffect(() => {
    if (!hasGuidedReadingRecords) return undefined;

    let cancelled = false;
    import("../data/guidedReadingBooks").then(module => {
      if (!cancelled) {
        setGuidedReadingReportRows(buildGuidedReadingReportRows(guidedReadingRecords, module));
        setGuidedReadingWordRows(module.getGuidedReadingWordStatusRows?.(guidedReadingRecords) || []);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [guidedReadingRecords, hasGuidedReadingRecords]);

  const model = useMemo(() => buildStudentReportModel({
    studentName,
    className,
    totalAnswered,
    accuracy,
    currentStage,
    currentSkillIndex,
    skillTree,
    currentStageQuestions,
    mastery,
    coverageSnapshot,
    skillMasterySummary,
    itemMastery,
    assessmentHistory,
    guidedReadingReportRows: activeGuidedReadingReportRows,
    storyQuestSummary
  }), [
    studentName,
    className,
    totalAnswered,
    accuracy,
    currentStage,
    currentSkillIndex,
    skillTree,
    currentStageQuestions,
    mastery,
    coverageSnapshot,
    skillMasterySummary,
    itemMastery,
    assessmentHistory,
    activeGuidedReadingReportRows,
    storyQuestSummary
  ]);

  const elCards = useMemo(() => buildElAssessmentCards({
    letterAssessment,
    patternAssessment
  }), [letterAssessment, patternAssessment]);
  const correctWordRows = activeGuidedReadingWordRows.filter(row => row.status === "Read Correctly");
  const generatedDate = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="student-report-shell">
      <ReportActions
        exportCSVData={exportCSVData}
        returnToTeacherDashboard={returnToTeacherDashboard}
        startAssessment={startAssessment}
      />

      <article className="student-report-document" aria-label={`Individual student report for ${model.snapshot.studentName}`}>
        <div className="student-report-page-top">
          <span>Literacy Guide · Individual Student Report</span>
          <span>{model.snapshot.studentName} · {formatClassLabel(model.snapshot.className)}</span>
        </div>

        <header className="student-report-hero lg-student-header">
          <div>
            <span>Individual Student Report</span>
            <h1 className="lg-student-header-name">{model.snapshot.studentName}</h1>
            <p className="lg-student-header-sub">{formatClassLabel(model.snapshot.className)} · Generated {generatedDate}</p>
          </div>
        </header>

        <StatusCallout snapshot={model.snapshot} />

        <SectionBand title="Student Snapshot" subtitle="Key metrics at a glance" />
        <SnapshotGrid model={model} skillTotal={skillTree.length} />

        <SectionBand title="EL Assessments" subtitle="Formal early literacy assessment results" accent="#2563EB" />
        <ElAssessmentSection cards={elCards} />

        <SectionBand title="Skill-Set Assessments" subtitle="Checkpoint results across all assessed skill areas" />
        <SkillSetSection rows={model.skillMapRows} />

        <SectionBand title="Growth Over Time" subtitle="Default view shows all skills. Use the dropdown to view checkpoint progress for a specific skill." />
        <GrowthSection model={model} letterAssessment={letterAssessment} patternAssessment={patternAssessment} />

        <SectionBand title="Words, Sounds & Skills Learned" subtitle="Items at Mastered level only" accent="#16A34A" />
        <LearnedSection correctWordRows={correctWordRows} model={model} />

        <SectionBand title="Areas Needing Support" subtitle="Items below 60% accuracy — prioritised by widest gap" accent="#DC2626" />
        <SupportSection model={model} />

        <SectionBand title="Guided Reading & Story Quest" subtitle="Book progress, conference notes, and vocabulary" accent="#16A34A" />
        <GuidedReadingSection guidedReadingReportRows={activeGuidedReadingReportRows} storyQuestSummary={storyQuestSummary} />

        <SectionBand title="Next Session Plan" subtitle={`Recommended focus for ${model.snapshot.studentName}'s next teaching session`} />
        <NextSessionPlan model={model} />

        <footer className="student-report-footer">
          Generated by Literacy Guide · Report covers saved assessment sessions to {generatedDate} · For teacher use only
        </footer>
      </article>
    </div>
  );
}
