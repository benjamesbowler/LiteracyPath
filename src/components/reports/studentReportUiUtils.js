export const STUDENT_REPORT_VIEWS = [
  {
    id: "whole-child",
    label: "Whole child",
    shortLabel: "Whole child",
    description: "What this child knows across every learning area."
  },
  {
    id: "el-assessments",
    label: "EL checks",
    shortLabel: "EL checks",
    description: "EL check results and next steps."
  },
  {
    id: "guided-reading",
    label: "Guided reading",
    shortLabel: "Guided reading",
    description: "Books, reading observations, words and teacher notes."
  },
  {
    id: "skills-check",
    label: "Skills check",
    shortLabel: "Skills check",
    description: "Check results and progress by skill."
  },
  {
    id: "other-learning",
    label: "Other learning",
    shortLabel: "Other learning",
    description: "Useful practice results from other learning areas."
  }
];

const VIEW_IDS = new Set(STUDENT_REPORT_VIEWS.map(view => view.id));

export function normalizeStudentReportView(value = "") {
  return VIEW_IDS.has(value) ? value : "whole-child";
}

export function readStudentReportHash() {
  if (typeof window === "undefined") return "";
  const match = window.location.hash.match(/(?:^#|&)student-report=([^&]+)/);
  return match ? normalizeStudentReportView(decodeURIComponent(match[1])) : "";
}

export function studentReportHash(viewId) {
  return `#student-report=${encodeURIComponent(normalizeStudentReportView(viewId))}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanStatus(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function reportStatusLabel(value = "") {
  const status = cleanStatus(value?.id || value?.label || value);
  if (["secure", "mastered", "passed", "got it", "on track"].includes(status)) return "Secure";
  if (["developing", "building", "almost", "almost there", "current", "attempted"].includes(status)) return "Developing";
  if (["needs support", "needs teaching", "needs reteaching", "needs re teaching", "support"].includes(status)) return "Needs teaching";
  if (status === "mixed" || status === "mixed evidence") return "Mixed results";
  return "Not checked";
}

export function getGuidedReadingLandingMeta({ progress = null, loadStatus = "idle" } = {}) {
  if (progress) {
    const totalBooksRead = Math.max(0, Number(progress.totalBooksRead) || 0);
    return `${totalBooksRead} completed book${totalBooksRead === 1 ? "" : "s"}`;
  }
  if (loadStatus === "error") return "Reading summary unavailable";
  return "Reading records loading";
}

export function getSkillsCheckLandingMeta({ attemptCount = 0, skillMasterySummary = [] } = {}) {
  const hasMastery = Array.isArray(skillMasterySummary) &&
    skillMasterySummary.some(summary => Number(summary?.masteredCount || 0) > 0);
  if (hasMastery) return "Saved check results available";

  const savedAttempts = Math.max(0, Number(attemptCount) || 0);
  if (savedAttempts > 0) {
    return `${savedAttempts} saved check${savedAttempts === 1 ? "" : "s"}`;
  }
  return "No saved checks yet";
}

function firstValidTimestamp(...values) {
  for (const value of values) {
    if (value === "" || value === null || value === undefined) continue;
    const timestamp = new Date(value).getTime();
    if (Number.isFinite(timestamp)) return { timestamp, value };
  }
  return { timestamp: null, value: "" };
}

function guidedWordStatus(row = {}) {
  const status = cleanStatus(row.status || row.statusLabel);
  if (status === "support" || status.includes("needs support") || status.includes("needs teaching")) {
    return "support";
  }
  if (status === "correct" || status.includes("read correctly")) return "correct";
  return "";
}

function guidedWordTimestamp(row = {}) {
  return firstValidTimestamp(
    row.date,
    row.observedAt,
    row.occurredAt,
    row.updatedAt,
    row.completedAt
  ).timestamp;
}

function shouldReplaceGuidedWordMark(current, candidate) {
  const currentTime = guidedWordTimestamp(current);
  const candidateTime = guidedWordTimestamp(candidate);
  const currentStatus = guidedWordStatus(current);
  const candidateStatus = guidedWordStatus(candidate);

  // Only two recorded dates establish a reliable chronology. When either
  // date is unknown (or the dates tie), retain the support mark so the report
  // never hides a possible teaching need.
  if (currentTime !== null && candidateTime !== null && currentTime !== candidateTime) {
    return candidateTime > currentTime;
  }
  if (currentStatus !== candidateStatus) return candidateStatus === "support";
  if (currentTime === null && candidateTime !== null) return true;
  return false;
}

export function buildGuidedReadingViewModel(rows = [], wordRows = []) {
  const books = asArray(rows);
  const latestWordState = new Map();
  asArray(wordRows).forEach(row => {
    const word = String(row?.word || "").trim();
    const key = word.toLocaleLowerCase();
    const status = guidedWordStatus(row);
    if (!key || !status) return;

    const candidate = { ...row, word };
    const current = latestWordState.get(key);
    if (!current || shouldReplaceGuidedWordMark(current, candidate)) {
      latestWordState.set(key, candidate);
    }
  });

  const correctWords = [];
  const supportWords = [];
  latestWordState.forEach(row => {
    if (guidedWordStatus(row) === "correct") correctWords.push(row);
    if (guidedWordStatus(row) === "support") supportWords.push(row);
  });
  const sortWords = (a, b) => String(a.word).localeCompare(String(b.word), undefined, { sensitivity: "base" });
  correctWords.sort(sortWords);
  supportWords.sort(sortWords);

  const notes = books.flatMap(book => asArray(book.notes).map((note, index) => ({
    ...note,
    id: note?.id || `${book.bookId || book.title}-${index}`,
    bookId: book.bookId,
    title: book.title,
    // A book's last-read date is not necessarily the date a note was saved.
    // Leave an unknown note date blank so the UI says "Date not recorded".
    date: firstValidTimestamp(
      note?.date,
      note?.occurredAt,
      note?.observedAt,
      note?.updatedAt,
      note?.savedAt,
      note?.createdAt,
      note?.timestamp
    ).value
  }))).sort((a, b) => {
    const aTime = firstValidTimestamp(a.date).timestamp;
    const bTime = firstValidTimestamp(b.date).timestamp;
    if (aTime === null && bTime === null) return 0;
    if (aTime === null) return 1;
    if (bTime === null) return -1;
    return bTime - aTime;
  });

  return { books, correctWords, supportWords, notes };
}

export function buildOtherLearningViewModel({ arcadeAreas = {}, soundSeekersReport = {}, storyQuestRows = [] } = {}) {
  const gameMap = arcadeAreas?.games?.games || arcadeAreas?.games || {};
  const games = Object.entries(gameMap || {}).map(([gameId, row = {}]) => ({
    ...row,
    gameId,
    title: String(gameId).replace(/[_-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase())
  })).filter(game => Number(game.plays || 0) > 0 || game.lastPlayedAt || Number(game.wordsCompleted || 0) > 0);
  return {
    soundSeekers: {
      heat: asArray(soundSeekersReport?.heat),
      interactionEvidence: asArray(soundSeekersReport?.interactionEvidence)
    },
    arcade: {
      games,
      gamesPlayed: games.reduce((sum, game) => sum + (Number(game.plays) || 0), 0)
    },
    storyQuests: { quests: asArray(storyQuestRows) }
  };
}
