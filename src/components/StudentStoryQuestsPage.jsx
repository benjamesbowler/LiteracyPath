import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { useStoryQuestAudio } from "../utils/useStoryQuestAudio.js";
import { storyQuestInvitation } from "../data/storyQuestReaderCopy.js";
import { StoryQuestSpeaker } from "./StoryQuestSpeaker.jsx";
import StudentGlassShell from "./StudentGlassShell.jsx";
import { storyQuests } from "../data/storyQuests.js";
import { filterSample } from "../policy/freeTierContent.js";
import { readStoryQuestProgress } from "../utils/storyQuestProgress.js";
import {
  QUEST_GRID_SLOTS,
  STORY_WORLDS,
  buildQuestGrid,
  reachedStoryWorld
} from "../policy/childLibraryPolicy.js";

// The Arcade filter's world colours, from the spec's token table. The card
// tints that go with them are literal rgba in kids-library.css rather than a
// color-mix() of these: iPad Safari is the primary device and color-mix is
// newer than the oldest iPad this runs on.
const WORLD_DOTS = {
  meadow: "var(--kg-world-meadow)",
  dino: "var(--kg-world-dino)",
  moonwood: "var(--kg-world-moonwood)"
};
const COMPACT_SHELF_QUERY = "(max-width: 700px), (max-height: 560px)";

function isCompactShelf() {
  return window.matchMedia(COMPACT_SHELF_QUERY).matches;
}

function subscribeToShelfViewport(listener) {
  const query = window.matchMedia(COMPACT_SHELF_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

function ShelfArrow({ forward = false }) {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={forward ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
    </svg>
  );
}

export function StudentStoryQuestsPage({
  studentName,
  progressScopeKey = "default",
  // filterSample returns the SAME array when the session sees everything, so a
  // normal child is unaffected; a try session gets the sample.
  quests = filterSample("storyQuests", storyQuests),
  readingLevel = "",
  onNavigate,
  onHome,
  onGrownUps,
  onBackToBooks,
  // The real player, handed in by the router so this screen never decides how
  // the story surface is shelled. `onExit` brings the child back HERE.
  renderQuest
}) {
  const [playingId, setPlayingId] = useState("");
  const narration = useStoryQuestAudio();
  // Held in state and re-read when the child comes back from a story, so the
  // badges show the progress the player just saved rather than the state this
  // screen started in. Re-read in the event handler, never in an effect.
  const [read, setRead] = useState(() => readStoryQuestProgress(progressScopeKey));
  const readUnavailable = read.status === "unreadable" || read.status === "cached";

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId !== progressScopeKey) return;
      setRead(readStoryQuestProgress(progressScopeKey));
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);

  const reachedWorld = useMemo(
    () => reachedStoryWorld({ quests, progress: read.progress, readingLevel }),
    [quests, read.progress, readingLevel]
  );
  const [world, setWorld] = useState(reachedWorld);
  const [shelfPage, setShelfPage] = useState(0);
  const compactShelf = useSyncExternalStore(subscribeToShelfViewport, isCompactShelf, () => false);

  const cards = useMemo(() => buildQuestGrid({
    quests,
    progress: read.progress,
    world,
    readingLevel,
    slots: quests.length
  }), [quests, read.progress, readingLevel, world]);
  const cardsPerPage = compactShelf ? 1 : QUEST_GRID_SLOTS;
  const shelfPageCount = Math.ceil(cards.length / cardsPerPage);
  const visiblePage = Math.max(0, Math.min(shelfPage, shelfPageCount - 1));
  const visibleCards = cards.slice(visiblePage * cardsPerPage, (visiblePage + 1) * cardsPerPage);

  function changeShelfPage(nextPage) {
    narration.stop();
    setShelfPage(nextPage);
  }

  if (playingId && renderQuest) {
    return renderQuest({
      questId: playingId,
      onExit: () => {
        setPlayingId("");
        setRead(readStoryQuestProgress(progressScopeKey));
      }
    });
  }

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="stories"
      onNavigate={onNavigate}
      onHome={onHome}
      onGrownUps={onGrownUps}
    >
      <div
        className="kg-screen kg-quests"
        data-child-surface="story-quests"
        data-read-state={read.status === "unreadable" ? "unreadable" : "ready"}
        data-quest-shelf={compactShelf ? "compact" : "grid"}
        data-quest-shelf-paged={shelfPageCount > 1 || undefined}
      >
        <div className="kg-quests-head">
          <button
            type="button"
            className="kg-glass kg-glass--strong kg-back"
            onClick={onBackToBooks}
            aria-label="Back to Books"
          >
            <ShelfArrow />
          </button>
          <h1 className="kg-title" data-child-title="">Story Quests</h1>
          {readUnavailable ? (
            <button type="button" className="kg-quest-listen" onClick={() => {
              narration.stop();
              setRead(readStoryQuestProgress(progressScopeKey));
            }}>Retry</button>
          ) : (
            <button className="kg-quest-listen" type="button" aria-label="Hear how Story Quests work" onClick={() => narration.play("You choose what happens")}><StoryQuestSpeaker /><span className="kg-quest-hear-label">Hear</span></button>
          )}
          <span className="kg-pill kg-quests-pill" data-child-instruction="" role={narration.status || readUnavailable ? "status" : undefined}>
            {read.status === "unreadable" ? "We could not open your stories"
              : read.status === "cached" ? "Last saved copy" : narration.status || "You choose what happens"}
          </span>
          <span className="kg-spacer" />
          {/* THE WORLD FILTER, WHICH IS ALSO THE OLD LEVEL FILTER. The shelf
              page grouped stories by Level A / B / C and let a child jump
              between the groups; the groups are named by their world here,
              because "Meadow" is a place a five-year-old can point at. Every
              story stays reachable in its world. */}
          <div className="kg-glass kg-segment-tray" role="group" aria-label="Story worlds">
            {STORY_WORLDS.map(entry => (
              <button
                key={entry.id}
                type="button"
                className={`kg-segment${entry.id === world ? " is-active" : ""}`}
                aria-pressed={entry.id === world}
                onClick={() => {
                  if (entry.id !== world) setShelfPage(0);
                  setWorld(entry.id);
                  narration.play(entry.label);
                }}
              >
                <span
                  className="kg-segment-dot"
                  style={{ "--kg-segment-dot": WORLD_DOTS[entry.id] }}
                  aria-hidden="true"
                />
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {/* The section is where the child's state is shown (every badge); the
            grid inside it is the set of choices. */}
        <section className="kg-quest-region" aria-label="Your stories" data-child-progress="">
          {cards.length
            ? (
              <>
                <div className="kg-quest-grid" data-child-choices="">
                  {visibleCards.map((card, index) => (
                    <article
                      key={card.id}
                      className={`kg-glass kg-glass--tinted kg-quest-card${index === 0 ? " kg-quest-card--pick" : ""}`}
                      data-quest-state={read.status === "unreadable" ? undefined : card.state}
                      data-quest-world={card.world}
                    >
                      <button {...(index === 0
                        ? { "data-child-primary": "", "data-child-emphasis": "primary" }
                        : { "data-child-emphasis": "choice" })} className="kg-quest-open" type="button" onClick={() => { narration.stop(); setPlayingId(card.id); }} aria-label={`${card.state === "carry-on" ? "Continue" : "Open"} ${card.fullTitle}`}>
                      <span className="kg-quest-art">
                        <img
                          src={card.art}
                          alt=""
                          loading={index < 3 ? "eager" : "lazy"}
                          decoding="async"
                          onError={hideOnError}
                        />
                        {(!readUnavailable || Object.hasOwn(read.progress, card.id)) && <span
                          className={`kg-quest-badge kg-quest-badge--${card.state}`}
                        >
                          {card.badge}
                        </span>}
                      </span>
                      <span className="kg-quest-foot">
                        <strong className="kg-quest-title">{card.title}</strong>
                        <small className="kg-quest-note">{card.state === "carry-on" ? card.note : quests.find(quest => quest.id === card.id)?.childSynopsis || card.note}</small>
                        {card.readingNote && <small className="kg-quest-reading-note">{card.readingNote}</small>}
                        {index === 0 && (
                          <small className="kg-quest-action" data-child-emphasis-cue="">
                            {readUnavailable ? "Read without saving" : card.state === "carry-on" ? "Continue" : card.state === "done" ? "Read again" : "Start story"}
                          </small>
                        )}
                      </span>
                      </button>
                      <button className="kg-quest-listen" type="button" aria-label={`Hear about ${card.fullTitle}`} onClick={() => narration.play(storyQuestInvitation(quests.find(quest => quest.id === card.id)))}><StoryQuestSpeaker /> <span className="kg-quest-synopsis-label">Hear this story</span></button>
                    </article>
                  ))}
                </div>
                {shelfPageCount > 1 && (
                  <nav className="kg-quest-pagination" aria-label="More stories in this world">
                    <button
                      type="button"
                      className="kg-quest-previous"
                      aria-label="Previous stories"
                      disabled={visiblePage === 0}
                      onClick={() => changeShelfPage(visiblePage - 1)}
                    >
                      <ShelfArrow />
                      <span>Previous</span>
                    </button>
                    <output aria-live="polite">{visiblePage + 1} of {shelfPageCount}</output>
                    <button
                      type="button"
                      className="kg-quest-next"
                      aria-label="Next stories"
                      disabled={visiblePage + 1 === shelfPageCount}
                      onClick={() => changeShelfPage(visiblePage + 1)}
                    >
                      <ShelfArrow forward />
                      <span>Next</span>
                    </button>
                  </nav>
                )}
              </>
            )
            : (
              <div className="kg-glass kg-glass--strong kg-library-empty" role="status">
                <h2 className="kg-panel-title">Your stories are getting ready</h2>
                <p className="kg-body">New stories are on the way. Check back soon.</p>
              </div>
            )}
        </section>
      </div>
    </StudentGlassShell>
  );
}
