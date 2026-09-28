import { isCurrentElQuestProgress } from "./adventureMapProgress.js";
import { buildLearningEvidenceProfile } from "./learningEvidenceInsights.js";

// Latest-run records have no meaning outside their own source and timestamp.
// Old aggregate participation never supplies invented question evidence.
export function buildAdventureMapReport(progress = {}) {
  if (!isCurrentElQuestProgress(progress)) return { cycles: [], note: "No current Adventure Map practice recorded." };
  const cycles = Object.entries(progress.cycles).filter(([, cycle]) =>
    Number(cycle.plays) > 0 || cycle.lastPlayedAt || Object.keys(cycle.stations || {}).length
  ).map(([cycleId, cycle]) => {
    const check = cycle.lastCheck;
    const validSnapshot = check?.version === 1 && check.source === "adventure_map"
      && typeof check.completedAt === "string" && Number.isFinite(Date.parse(check.completedAt))
      && check.completedAt === cycle.lastPlayedAt && Array.isArray(check.questionRecords);
    const profile = buildLearningEvidenceProfile(validSnapshot ? check.questionRecords : [], { source: "adventure_map" });
    return {
      cycleId, title: cycle.title || cycleId.replace(/[_-]+/g, " ").replace(/^\w/, letter => letter.toUpperCase()),
      plays: Number(cycle.plays) || 0, lastPlayedAt: cycle.lastPlayedAt || "",
      completedStations: cycle.stations ? Object.values(cycle.stations).filter(value => value === true).length : null,
      snapshotStatus: validSnapshot ? "recorded" : check ? "unverified" : "not_recorded",
      profile
    };
  }).sort((a, b) => b.lastPlayedAt.localeCompare(a.lastPlayedAt) || a.cycleId.localeCompare(b.cycleId));
  return { cycles, note: "Latest saved practice check for each cycle. Earlier activity totals do not establish mastery or independent reading." };
}
