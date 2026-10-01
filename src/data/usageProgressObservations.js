// Descriptive use evidence from current cloud state. These counters can include
// activity before the selected interval and are never added to dated events,
// independent question scores, time spent or mastery.
const object = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const list = value => Array.isArray(value) ? value : [];
const count = value => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
const entries = value => Object.entries(object(value));
const practiceRecords = value => list(value?.completions).length;
const practiceStatus = value => typeof value === "string" ? value : value?.status;
const usedPractice = value => ["inprogress","completed"].includes(practiceStatus(value)) || practiceRecords(value) > 0;

export function usageProgressObservations(data = {}) {
  const payload = data.payload;
  const sourceArea = data.area;
  const observations = [];
  let recognized = true;
  const add = (id,area,metrics) => {
    if (id && Object.values(metrics).some(value => typeof value === "number" && value > 0)) observations.push({id,area,metrics});
  };
  if (sourceArea === "learn_games") {
    for (const [id,game] of entries(payload?.games)) {
      const records = practiceRecords(game?.practiceRecord);
      const checkpoints = Object.values(object(game?.checkpoints)).filter(point => count(point?.level) > 0).length;
      add(id,id === "skills-trail" ? "skills_practice" : "games",{
        plays:count(game?.plays),storedPracticeRecords:records,resumeCheckpoints:checkpoints,
        storedUseRecords:Number(Boolean(game?.lastPlayedAt || records || checkpoints || count(game?.plays) || count(game?.stars) || count(game?.wordsCompleted)))
      });
    }
  } else if (sourceArea === "guided_reading") {
    const pageVisits = Object.values(object(payload?.pageStats)).reduce((sum,page) => sum+count(page?.openedCount),0);
    add(data.key,"guided_reading",{reads:count(payload?.readCount),pageVisits,pagesReached:count(payload?.completedPages),
      storedUseRecords:Number(Boolean(payload?.firstReadAt || payload?.lastReadAt || payload?.completed || pageVisits || count(payload?.completedPages) || count(payload?.readCount)))});
  } else if (sourceArea === "story_quests") {
    add(data.key,"story_quests",{completedRoutes:Number(Boolean(payload?.completed)),visitedPages:Math.max(count(payload?.visitedPageCount),list(payload?.visitedPageIds).length),
      storedUseRecords:Number(Boolean(payload?.opened || payload?.completed || payload?.lastPageId || count(payload?.visitedPageCount) || list(payload?.visitedPageIds).length))});
  } else if (["phonics_letters","cvc"].includes(sourceArea)) {
    add(data.key,sourceArea === "cvc" ? "words" : "sounds",{storedPracticeRecords:practiceRecords(payload),storedUseRecords:Number(usedPractice(payload))});
  } else if (sourceArea === "el_quest") {
    for (const [id,cycle] of entries(payload?.cycles)) {
      add(id,"adventure_map",{plays:count(cycle?.plays),completedStations:Object.values(object(cycle?.stations)).filter(station => station === true || usedPractice(station) || station?.completed === true).length,
        storedUseRecords:Number(Boolean(cycle?.lastPlayedAt || count(cycle?.plays) || cycle?.lastCheck))});
    }
  } else if (sourceArea === "phonics_quest") {
    const stops = new Set([...list(payload?.trail?.stopsDone),...list(payload?.trail?.completedStopIds),...entries(payload?.completed).filter(([,done])=>Boolean(done)).map(([id])=>id)]);
    for (const id of stops) add(id,"sound_seekers",{completedStops:1,storedUseRecords:1});
    for (const [id,record] of entries(payload?.campaign?.completedMissions)) add(id,"sound_seekers",{completedMissions:1,storedUseRecords:Number(Boolean(record))});
    for (const [id,checkpoint] of entries(payload?.campaign?.checkpoints)) add(id,"sound_seekers",{resumeCheckpoints:Number(Boolean(checkpoint?.attemptId)),storedUseRecords:Number(Boolean(checkpoint?.attemptId))});
    for (const id of list(payload?.campaign?.visitedStageIds)) add(id,"sound_seekers",{visitedStages:1,storedUseRecords:1});
    for (const [id,repair] of entries(payload?.trail?.repairs)) add(id,"sound_seekers",{repairProgress:count(repair),storedUseRecords:Number(count(repair)>0)});
    const attempts = count(payload?.trail?.chapterCoverage?.woodland?.attempts);
    add(data.key,"sound_seekers",{practiceAttempts:attempts,storedUseRecords:Number(attempts>0)});
  } else recognized = false;
  return {recognized,observations};
}
