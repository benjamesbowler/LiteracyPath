export const BUDDY_READER_POLICY = Object.freeze({
  version: 1,
  partner: "LEDA narration",
  childMediaCollected: false,
  scoresReadingSpeed: false,
  scoresPronunciation: false,
  turnPattern: "alternating_pages"
});

export function buildBuddyReaderPlan(pageCount, startPageIndex = 0) {
  const count = Math.max(0, Number(pageCount) || 0);
  const start = Math.max(0, Math.min(count - 1, Number(startPageIndex) || 0));
  return Array.from({ length: count - start }, (_, offset) => ({
    pageIndex: start + offset,
    reader: offset % 2 === 0 ? "child" : "leda"
  }));
}

export function appendBuddyTurn(session, turn) {
  const turns = Array.isArray(session?.turns) ? session.turns : [];
  if (turns.some(row => row.pageIndex === turn.pageIndex && row.reader === turn.reader)) {
    return session;
  }
  return {
    schemaVersion: 1,
    startedAt: session?.startedAt || turn.completedAt,
    completedAt: session?.completedAt || null,
    childMediaCollected: false,
    turns: [...turns, turn]
  };
}

export function summarizeBuddyReader(session) {
  const turns = Array.isArray(session?.turns) ? session.turns : [];
  return {
    childTurns: turns.filter(turn => turn.reader === "child").length,
    ledaTurns: turns.filter(turn => turn.reader === "leda").length,
    totalTurns: turns.length,
    completedAt: session?.completedAt || null,
    evidenceClaim: "turn_completion_only"
  };
}
