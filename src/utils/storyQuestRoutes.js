export function isStoryQuestEnding(page) {
  return Boolean(page?.choices?.some(choice => choice.nextPageId === "end"));
}

export function isStoryQuestProgressRow(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && (value.v === undefined || value.v === 1));
}

export function isStoryQuestProgressLedger(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && Object.values(value).every(isStoryQuestProgressRow));
}

export function storyQuestEndingIds(progress = {}) {
  return [...new Set([
    ...(Array.isArray(progress?.endingPageIds) ? progress.endingPageIds : []),
    progress?.completed ? progress.endingPageId : null
  ].filter(id => typeof id === "string" && id.length > 0))];
}

export function storyQuestReplayFork(route, endingPageIds, exploredPageIds, pages) {
  const found = new Set(endingPageIds);
  const explored = new Set([...exploredPageIds, ...route]);

  function nearestFork(matches) {
    const memo = new Map();
    function leadsTo(id) {
      if (memo.has(id)) return memo.get(id);
      const page = pages.get(id);
      if (!page) return false;
      memo.set(id, false);
      const leadsToMatch = matches(page)
        || (!isStoryQuestEnding(page) && page.choices.some(choice => leadsTo(choice.nextPageId)));
      memo.set(id, leadsToMatch);
      return leadsToMatch;
    }

    for (let index = route.length - 2; index >= 0; index -= 1) {
      const choices = pages.get(route[index])?.choices || [];
      if (choices.some(choice => choice.nextPageId !== route[index + 1] && leadsTo(choice.nextPageId))) return index;
    }
    return -1;
  }

  const endingFork = nearestFork(page => isStoryQuestEnding(page) && !found.has(page.id));
  return endingFork >= 0 ? endingFork : nearestFork(page => !explored.has(page.id));
}

// The server unions progress arrays and ORs booleans. Keep the ordered route,
// revision and finished state together in one replaceable checkpoint string.
export function encodeStoryQuestCheckpoint({ contentRevision, visitedPageIds, routeFinished }) {
  return JSON.stringify({ contentRevision, visitedPageIds, routeFinished });
}

export function readStoryQuestCheckpoint(progress = {}) {
  if (typeof progress?.routeCheckpoint === "string") {
    try {
      const route = JSON.parse(progress.routeCheckpoint);
      if (Array.isArray(route?.visitedPageIds) && route.visitedPageIds.length
        && route.visitedPageIds.every(id => typeof id === "string" && id.length > 0)
        && typeof route.routeFinished === "boolean" && typeof route.contentRevision === "string") {
        return { ...route, lastPageId: route.visitedPageIds.at(-1) };
      }
    } catch { /* Older progress rows also have a route in top-level fields. */ }
  }
  return progress || {};
}
