import { getBiomeKit } from "../content/biomeKits.js";
import { SOUND_SEEKERS_CHAPTERS } from "../content/chapters/index.js";
import { getExpedition } from "../content/expeditions.js";

const COMPLETION_SUMMARY_KEYS = Object.freeze([
  "kind",
  "stopId",
  "journeyStep",
  "repairId",
  "relationshipBeatId",
  "consequenceId"
]);

function exactCompletionSummary(summary, expedition) {
  return Boolean(summary && typeof summary === "object" && !Array.isArray(summary)
    && Object.getPrototypeOf(summary) === Object.prototype
    && Reflect.ownKeys(summary).length === COMPLETION_SUMMARY_KEYS.length
    && COMPLETION_SUMMARY_KEYS.every(key => Object.hasOwn(summary, key))
    && summary.kind === "sound_seekers_mission_committed"
    && Number.isSafeInteger(summary.journeyStep) && summary.journeyStep >= 1
    && summary.stopId === expedition?.stopId
    && summary.repairId === expedition?.payoff.repairId
    && summary.relationshipBeatId === expedition?.payoff.relationshipBeatId
    && summary.consequenceId === expedition?.payoff.consequenceId);
}

export function RewardReveal({ summary, onContinue }) {
  const expedition = getExpedition(summary?.stopId);
  const chapter = expedition
    ? SOUND_SEEKERS_CHAPTERS.find(item => item.id === expedition.chapterId)
    : null;
  const kit = chapter ? getBiomeKit(chapter.id) : null;
  if (!exactCompletionSummary(summary, expedition) || !kit) {
    throw new TypeError("Reward reveal needs an exact completed expedition summary");
  }
  if (typeof onContinue !== "function") {
    throw new TypeError("Reward reveal needs a continue action");
  }
  const chapterComplete = expedition.stopId === chapter.stopIds.at(-1);
  return (
    <main
      className="ss-reward"
      aria-labelledby="ss-reward-title"
      data-wonder-effect-id={kit.wonderEffectId}
      style={{ "--ss-reward-image": `url(${JSON.stringify(kit.background.src)})` }}
    >
      <div className="ss-reward__light" aria-hidden="true"><i /><i /><i /></div>
      <section className="ss-reward__card">
        <p className="ss-eyebrow">The world remembers what you learned</p>
        <h1 id="ss-reward-title">{expedition.title} is repaired!</h1>
        <p>{chapterComplete ? chapter.finale.consequence : `${expedition.residentId}'s home has changed for good.`}</p>
        <div className="ss-reward__seal" aria-hidden="true"><span>✓</span></div>
        <strong>{chapterComplete ? chapter.chapterReward.label : "New field-journal memory"}</strong>
        <small>{chapterComplete ? chapter.chapterReward.worldEffect : "Return later and the repaired landmark will still be here."}</small>
        <button className="ss-primary-button" type="button" onClick={onContinue}>See the repaired world</button>
      </section>
    </main>
  );
}

export default RewardReveal;
