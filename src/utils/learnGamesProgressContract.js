// Recovery for historical cloud/local saves. Mirrors the malformed-field repair
// in lp_normalize_learn_games(payload, false); the database still rejects raw
// invalid writes. Keep resume/evidence internals intact and never invent scores.
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const counterBounds = { highScore: 2147483647, stars: 3, plays: Number.MAX_SAFE_INTEGER, wordsCompleted: Number.MAX_SAFE_INTEGER };

export function normalizeLearnGamesProgress(payload) {
  if (!isRecord(payload)) return {};
  const result = { ...payload };
  if (!Object.hasOwn(result, "games")) return result;
  if (!isRecord(result.games)) {
    delete result.games;
    return result;
  }
  result.games = Object.fromEntries(Object.entries(result.games).flatMap(([id, value]) => {
    if (!isRecord(value)) return [];
    const record = { ...value };
    for (const [field, maximum] of Object.entries(counterBounds)) {
      if (Object.hasOwn(record, field)
        && (!Number.isSafeInteger(record[field]) || record[field] < 0 || record[field] > maximum)) delete record[field];
    }
    for (const field of ["checkpoints", "bestSplits", "practiceRecord"]) {
      if (Object.hasOwn(record, field) && !isRecord(record[field])) delete record[field];
    }
    return [[id, record]];
  }));
  return result;
}
