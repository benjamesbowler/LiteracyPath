import { SOUND_SEEKERS_CHAPTERS } from "../content/chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../content/expeditions.js";
import { deriveNarrativeBranchState } from "../engine/worldState.js";
import { isSoundSeekersV2 } from "../engine/stateV2.js";
import { ModalSurface } from "./ModalSurface.jsx";

function ownsChapterGift(state, chapter) {
  return state.rewards.claimedIds.includes(chapter.chapterReward.id)
    || chapter.stopIds.every(stopId => state.trail.completedStopIds.includes(stopId));
}

export function FieldJournal({ state, onClose }) {
  if (!isSoundSeekersV2(state) || typeof onClose !== "function") {
    throw new TypeError("Field journal needs canonical Sound Seekers progress and a close action");
  }
  const memories = SOUND_SEEKERS_EXPEDITIONS
    .filter(expedition => state.journal.scenes.includes(expedition.connectedTextId))
    .map(expedition => ({
      expedition,
      branch: expedition.transfer.boss
        ? deriveNarrativeBranchState(state, expedition.connectedTextId)
        : null
    }));
  const worldGifts = SOUND_SEEKERS_CHAPTERS.filter(chapter => ownsChapterGift(state, chapter));
  return (
    <ModalSurface className="ss-sheet ss-journal" labelledBy="ss-journal-title" onClose={onClose}>
      <header className="ss-sheet__header">
        <div>
          <p className="ss-eyebrow">Everything you discovered</p>
          <h1 id="ss-journal-title">Field journal</h1>
        </div>
        <button type="button" className="ss-icon-button" aria-label="Close field journal" data-ss-modal-initial-focus="" onClick={onClose}>×</button>
      </header>
      <div className="ss-journal__summary" aria-label="Journal totals">
        <span><strong>{state.journal.words.length}</strong> words</span>
        <span><strong>{state.journal.scenes.length}</strong> story memories</span>
        <span><strong>{worldGifts.length}</strong> world {worldGifts.length === 1 ? "gift" : "gifts"}</span>
      </div>
      <div className="ss-journal__pages">
        <article>
          <h2>Word discoveries</h2>
          {state.journal.words.length ? (
            <ul className="ss-journal__word-grid">
              {state.journal.words.map(word => <li key={word}>{word}</li>)}
            </ul>
          ) : <p>Your first word discovery will appear here.</p>}
        </article>
        <article>
          <h2>World memories</h2>
          {memories.length ? (
            <ol className="ss-journal__memories">
              {memories.map(({ expedition, branch }) => (
                <li key={expedition.stopId} data-story-outcome-id={branch?.storyOutcomeId}>
                  <strong>{expedition.title}</strong>
                  <span>{state.trail.repairs[expedition.payoff.repairId] ? "Repaired" : "Visited"}</span>
                  {branch ? <small>Your choice remains part of this world.</small> : null}
                </li>
              ))}
            </ol>
          ) : <p>Read your first story scene to begin this page.</p>}
        </article>
        <article>
          <h2>World gifts</h2>
          <ul className="ss-journal__rewards">
            {SOUND_SEEKERS_CHAPTERS.map(chapter => {
              const owned = ownsChapterGift(state, chapter);
              return (
                <li key={chapter.chapterReward.id} data-owned={owned ? "true" : "false"}>
                  <span aria-hidden="true" className="ss-journal__reward-gem" />
                  <strong>{owned ? chapter.chapterReward.label : "Undiscovered world gift"}</strong>
                  <small>{owned ? chapter.chapterReward.worldEffect : `Complete ${chapter.title} to discover it.`}</small>
                </li>
              );
            })}
          </ul>
        </article>
      </div>
      <button className="ss-primary-button ss-sheet__done" type="button" onClick={onClose}>Back to the trail</button>
    </ModalSurface>
  );
}

export default FieldJournal;
