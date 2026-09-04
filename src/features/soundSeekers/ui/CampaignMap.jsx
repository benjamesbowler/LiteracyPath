import { SOUND_SEEKERS_CHAPTERS } from "../content/chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS, getExpedition } from "../content/expeditions.js";
import { getBiomeKit } from "../content/biomeKits.js";
import { deriveNarrativeBranchState, deriveResidentRequest } from "../engine/worldState.js";
import { isSoundSeekersV2 } from "../engine/stateV2.js";

const stopOrdinal = stopId => Number(String(stopId).slice(1));

function chapterProgress(state, chapter) {
  const completed = chapter.stopIds.filter(stopId => state.trail.completedStopIds.includes(stopId));
  return { completed: completed.length, total: chapter.stopIds.length };
}

function StopMarker({ expedition, state, currentStopId, onStart }) {
  const completed = state.trail.completedStopIds.includes(expedition.stopId);
  const current = expedition.stopId === currentStopId;
  const resumable = state.checkpoint?.mission?.stopId === expedition.stopId;
  const available = completed || current || resumable;
  const branch = expedition.transfer.boss
    ? deriveNarrativeBranchState(state, expedition.connectedTextId)
    : null;
  const repaired = state.trail.repairs?.[expedition.payoff.repairId] === true;
  const label = resumable
    ? `Resume ${expedition.title}`
    : completed ? `Replay ${expedition.title}` : `Begin ${expedition.title}`;

  return (
    <li className="ss-map__stop" data-stop-state={resumable ? "resume" : completed ? "complete" : current ? "current" : "locked"}>
      <button
        className="ss-map__stop-button"
        type="button"
        disabled={!available}
        aria-label={available ? label : `${expedition.title}, locked`}
        aria-current={current ? "step" : undefined}
        onClick={() => onStart(expedition.stopId)}
      >
        <span className="ss-map__stop-number" aria-hidden="true">{stopOrdinal(expedition.stopId)}</span>
        <span className="ss-map__stop-copy">
          <strong>{expedition.title}</strong>
          <small>{repaired ? "Landmark repaired" : resumable ? "Expedition in progress" : current ? `${expedition.residentId} needs you` : completed ? "Ready to revisit" : "Follow the trail to unlock"}</small>
        </span>
        <span className="ss-map__stop-mark" aria-hidden="true">{repaired ? "✓" : resumable ? "▶" : current ? "!" : ""}</span>
      </button>
      {branch ? (
        <p className="ss-map__branch-memory" data-story-outcome-id={branch.storyOutcomeId}>
          Your choice changed this place.
        </p>
      ) : null}
    </li>
  );
}

export function CampaignMap({
  state,
  onStart,
  onOpenJournal,
  onOpenCreator,
  onOpenSettings,
  onExit
}) {
  const actions = [onStart, onOpenJournal, onOpenCreator, onOpenSettings, onExit];
  if (!isSoundSeekersV2(state) || actions.some(action => typeof action !== "function")) {
    throw new TypeError("Campaign map needs canonical Sound Seekers progress and callable actions");
  }
  const currentStopId = state.checkpoint?.mission?.stopId
    || `s${Math.min(40, Math.max(1, state.trail.routeCursor))}`;
  const currentExpedition = getExpedition(currentStopId) || SOUND_SEEKERS_EXPEDITIONS[0];
  const request = deriveResidentRequest(state, currentExpedition.stopId);
  const totalRepairs = Object.values(state.trail.repairs).filter(Boolean).length;

  return (
    <main className="ss-map" aria-labelledby="ss-map-title" data-sound-seekers-campaign-map="">
      <header className="ss-map__hero">
        <div className="ss-map__title-lockup">
          <p className="ss-eyebrow">A reading adventure</p>
          <h1 id="ss-map-title" data-child-title="">Sound Seekers</h1>
          <p>Listen, build, read, and bring every world back to life.</p>
        </div>
        <div className="ss-map__repair-meter" aria-label={`${totalRepairs} of 40 places repaired`} data-child-progress="">
          <span aria-hidden="true" className="ss-map__repair-orb" />
          <strong>{totalRepairs}/40</strong>
          <span>places glowing</span>
        </div>
        <nav className="ss-map__tools" aria-label="Sound Seekers trail tools">
          <button type="button" onClick={onOpenJournal}>Field journal</button>
          <button type="button" onClick={onOpenCreator}>My seeker</button>
          <button type="button" onClick={onOpenSettings}>Game settings</button>
          <button type="button" onClick={onExit}>Leave trail</button>
        </nav>
      </header>

      <section className="ss-map__next" aria-labelledby="ss-map-next-title">
        <div>
          <p className="ss-eyebrow">Next expedition · Stop {stopOrdinal(currentStopId)}</p>
          <h2 id="ss-map-next-title">{currentExpedition.title}</h2>
          <p data-child-instruction="">{request?.callbackLines?.[0]?.text || `${currentExpedition.residentId} needs a Sound Seeker.`}</p>
        </div>
        <button className="ss-primary-button" type="button" onClick={() => onStart(currentStopId)} data-child-primary="" data-child-emphasis="primary" data-child-emphasis-cue="">
          {state.checkpoint?.mission?.stopId === currentStopId ? "Carry on my adventure" : "Start my adventure"}
        </button>
      </section>

      <ol className="ss-map__chapters" aria-label="Eight Sound Seekers worlds" data-child-choices="">
        {SOUND_SEEKERS_CHAPTERS.map(chapter => {
          const progress = chapterProgress(state, chapter);
          const kit = getBiomeKit(chapter.id);
          return (
            <li
              key={chapter.id}
              className="ss-map__chapter"
              data-chapter-id={chapter.id}
              style={{ "--ss-chapter-image": `url(${JSON.stringify(kit.background.src)})` }}
            >
              <header className="ss-map__chapter-header">
                <p>World {chapter.index}</p>
                <h2>{chapter.title}</h2>
                <span>{progress.completed} of {progress.total} repairs</span>
              </header>
              <p className="ss-map__objective">{chapter.objective}</p>
              <ol className="ss-map__stops">
                {chapter.stopIds.map(stopId => (
                  <StopMarker
                    key={stopId}
                    expedition={getExpedition(stopId)}
                    state={state}
                    currentStopId={currentStopId}
                    onStart={onStart}
                  />
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

export default CampaignMap;
