import { queueProgressSave } from "./progressSync.js";

const STORY_QUEST_PROGRESS_STORAGE_KEY = "literacyPath.storyQuestProgress.v1";

export function storyQuestProgressStorageKey(progressScopeKey = "default") {
  return `${STORY_QUEST_PROGRESS_STORAGE_KEY}.${encodeURIComponent(progressScopeKey || "default")}`;
}

export function loadStoryQuestProgress(progressScopeKey = "default") {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(storyQuestProgressStorageKey(progressScopeKey)) || "{}");
  } catch {
    return {};
  }
}

export function saveStoryQuestProgress(progressScopeKey = "default", progress = {}) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storyQuestProgressStorageKey(progressScopeKey), JSON.stringify(progress));
  } catch {
    // Storage may be unavailable (private browsing / quota). The cloud queue
    // below still carries the progress.
  }
  try {
    Object.entries(progress || {}).forEach(([questId, payload]) => {
      queueProgressSave("story_quests", questId, { v: 1, ...payload }, { scopeKey: progressScopeKey });
    });
  } catch {
    // Story Quest progress is helpful report context, but it should never block reading.
  }
}

export function formatStoryQuestDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not yet";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatStoryQuestStatus(row = {}) {
  return row.completed ? "Completed" : "In progress";
}

export function getStoryQuestWords(row = {}) {
  if (Array.isArray(row.wordsFound) && row.wordsFound.length > 0) {
    return row.wordsFound.filter(Boolean);
  }

  if (Array.isArray(row.wordsEncountered) && row.wordsEncountered.length > 0) {
    return row.wordsEncountered.filter(Boolean);
  }

  return [];
}

export function summarizeStoryQuestProgress(progress = {}, quests = []) {
  const questById = new Map((quests || []).map(quest => [quest.id, quest]));
  const rows = Object.entries(progress || {})
    .map(([questId, row = {}]) => {
      const quest = questById.get(questId) || {};
      const words = getStoryQuestWords(row);
      const wordCount = Number.isFinite(Number(row.wordsFoundCount))
        ? Number(row.wordsFoundCount)
        : words.length;
      const lastActivityAt = row.updatedAt || row.completedAt || "";
      const title = quest.title || row.title || questId;
      const levelLabel = quest.level && /^[A-Z]$/.test(quest.level)
        ? `Level ${quest.level}`
        : quest.level || quest.skillFocus || "";

      return {
        questId,
        title,
        levelLabel,
        series: quest.series || "",
        status: formatStoryQuestStatus(row),
        completed: Boolean(row.completed),
        completedAt: row.completedAt || "",
        lastActivityAt,
        words,
        wordCount,
        targetWordCount: Number.isFinite(Number(row.targetWordCount))
          ? Number(row.targetWordCount)
          : Array.isArray(quest.targetWords)
            ? quest.targetWords.length
            : 0,
        visitedPageCount: Number.isFinite(Number(row.visitedPageCount)) ? Number(row.visitedPageCount) : 0,
        lastPageId: row.lastPageId || ""
      };
    })
    .filter(row => row.title && (row.lastActivityAt || row.completed || row.lastPageId || row.wordCount > 0))
    .sort((a, b) => {
      const aTime = new Date(a.lastActivityAt || a.completedAt || 0).getTime();
      const bTime = new Date(b.lastActivityAt || b.completedAt || 0).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });

  const mostRecentActivityAt = rows.reduce((latest, row) => {
    const currentTime = new Date(row.lastActivityAt || row.completedAt || 0).getTime();
    const latestTime = new Date(latest || 0).getTime();
    if (!Number.isFinite(currentTime)) return latest;
    return currentTime > (Number.isFinite(latestTime) ? latestTime : 0)
      ? row.lastActivityAt || row.completedAt
      : latest;
  }, "");

  return {
    completedCount: rows.filter(row => row.completed).length,
    inProgressCount: rows.filter(row => !row.completed).length,
    totalWordsFound: rows.reduce((total, row) => total + row.wordCount, 0),
    mostRecentActivityAt,
    rows
  };
}
