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
    partial: Boolean(item.soundCorrect || item.wordCorrect) && !Boolean(item.soundCorrect && item.wordCorrect)
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
                {card.items.map(item => (
                  <ElItemChip
                    key={item.label}
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
  const hasData = row.attempts > 0 || row.status === "passed";
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

function GrowthChart({ model }) {
  const points = model.progressPoints.slice(-8);
  if (points.length < 2) {
    return (
      <div className="student-report-muted-card">
        Complete two or more assessments to see progress over time.
      </div>
    );
  }

  const width = 700;
  const height = 230;
  const left = 54;
  const right = 18;
  const top = 24;
  const bottom = 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxX = Math.max(1, points.length - 1);
  const latest = points.at(-1);
  const first = points[0];
  const line = points.map((point, index) => {
    const x = left + (index / maxX) * plotWidth;
    const y = top + (1 - clampPercent(point.value) / 100) * plotHeight;
    return { ...point, x, y };
  });
  const path = line.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const latestArea = latest.skillArea?.color || "#2563EB";

  return (
    <div className="student-report-growth-card">
      <div className="growth-card-top">
        <p>{latest.skillArea?.label || "Skill"} ({latest.skillName}) — {points.length} checkpoints recorded</p>
        {model.sameSkillDelta !== null && (
          <span className={`growth-delta ${model.sameSkillDelta >= 0 ? "positive" : "negative"}`}>
            {model.sameSkillDelta >= 0 ? "+" : ""}{model.sameSkillDelta}% since last round
          </span>
        )}
      </div>
      <svg className="student-report-growth-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Assessment accuracy per checkpoint">
        {[100, 80, 60, 40, 20].map(value => {
          const y = top + (1 - value / 100) * plotHeight;
          return (
            <g key={value}>
              <text x={left - 8} y={y + 5} textAnchor="end">{value}%</text>
              <line x1={left} x2={width - right} y1={y} y2={y} />
            </g>
          );
        })}
        {line.map(point => (
          <text key={`${point.completedAt}-label`} x={point.x} y={height - 8} textAnchor="middle">{point.label}</text>
        ))}
        <path d={path} style={{ stroke: latestArea }} />
        {line.map(point => (
          <circle key={`${point.completedAt}-dot`} cx={point.x} cy={point.y} r="6" style={{ fill: point.skillArea?.color || latestArea }}>
            <title>{`${point.skillName}: ${point.value}% on ${point.label}`}</title>
          </circle>
        ))}
      </svg>
      <p className="growth-summary">
        {model.snapshot.studentName} moved from {first.value}% on {first.label} to {latest.value}% on {latest.label}
        {latest.skillName ? `, most recently on ${latest.skillName}.` : "."}
      </p>
    </div>
  );
}

function LearnedSection({ correctWordRows, model }) {
  const mastered = model.itemGroups.mastered || [];
  const sightWords = mastered.filter(row =>
    String(row.itemType || "").includes("sight") ||
    String(row.itemType || "").includes("hfw") ||
    String(row.skillName || "").toLowerCase().includes("high-frequency")
  );
  const sounds = mastered.filter(row =>
    String(row.itemType || "").includes("sound") ||
    String(row.itemType || "").includes("rhyme") ||
    String(row.itemType || "").includes("letter") ||
    String(row.itemType || "").includes("vowel")
  );
  const fallbackSight = sightWords.length ? sightWords : mastered.filter(row => row.label && !String(row.itemType || "").includes("sound")).slice(0, 60);
  const fallbackSounds = sounds.length ? sounds : mastered.slice(0, 30);

  return (
    <div className="student-report-learned-grid">
      <article className="student-report-learned-card words">
        <h3>Sight Words Mastered ({fallbackSight.length})</h3>
        <ChipTextList items={fallbackSight.map(row => row.label)} limit={60} />
      </article>
      <article className="student-report-learned-card sounds">
        <h3>Sounds Mastered ({fallbackSounds.length})</h3>
        <ChipTextList items={fallbackSounds.map(row => row.label)} limit={60} />
      </article>
      <article className="student-report-learned-card mastered">
        <h3>Guided Reading — Words Read Correctly (recent books)</h3>
        <ChipTextList
          items={correctWordRows.map(row => `${row.word} (${row.title}, p.${row.page})`)}
          limit={30}
        />
      </article>
    </div>
  );
}

function ChipTextList({ items = [], limit = 60 }) {
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
  const [storyQuestSummary, setStoryQuestSummary] = useState(() =>
    summarizeStoryQuestProgress(loadStoryQuestProgress(storyQuestProgressScopeKey), storyQuests)
  );

  useEffect(() => {
    if (!Object.keys(guidedReadingRecords || {}).length) {
      setGuidedReadingReportRows([]);
      setGuidedReadingWordRows([]);
      return undefined;
    }

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
  }, [guidedReadingRecords]);

  useEffect(() => {
    setStoryQuestSummary(summarizeStoryQuestProgress(
      loadStoryQuestProgress(storyQuestProgressScopeKey),
      storyQuests
    ));
  }, [storyQuestProgressScopeKey]);

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
    guidedReadingReportRows,
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
    guidedReadingReportRows,
    storyQuestSummary
  ]);

  const elCards = useMemo(() => buildElAssessmentCards({
    letterAssessment,
    patternAssessment,
    model
  }), [letterAssessment, patternAssessment, model]);
  const correctWordRows = guidedReadingWordRows.filter(row => row.status === "Read Correctly").slice(0, 30);
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

        <SectionBand title="Growth Over Time" subtitle="Assessment accuracy per checkpoint round — most recent on the right" />
        <GrowthChart model={model} />

        <SectionBand title="Words, Sounds & Skills Learned" subtitle="Items at Mastered level only" accent="#16A34A" />
        <LearnedSection correctWordRows={correctWordRows} model={model} />

        <SectionBand title="Areas Needing Support" subtitle="Items below 60% accuracy — prioritised by widest gap" accent="#DC2626" />
        <SupportSection model={model} />

        <SectionBand title="Guided Reading & Story Quest" subtitle="Book progress, conference notes, and vocabulary" accent="#16A34A" />
        <GuidedReadingSection guidedReadingReportRows={guidedReadingReportRows} storyQuestSummary={storyQuestSummary} />

        <SectionBand title="Next Session Plan" subtitle={`Recommended focus for ${model.snapshot.studentName}'s next teaching session`} />
        <NextSessionPlan model={model} />

        <footer className="student-report-footer">
          Generated by Literacy Guide · Report covers saved assessment sessions to {generatedDate} · For teacher use only
        </footer>
      </article>
    </div>
  );
}
