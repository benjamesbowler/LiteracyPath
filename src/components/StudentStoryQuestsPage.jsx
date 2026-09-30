import { useEffect, useMemo, useState } from "react";

import { useStoryQuestAudio } from "../utils/useStoryQuestAudio.js";
import { storyQuestInvitation } from "../data/storyQuestReaderCopy.js";
import { StoryQuestSpeaker } from "./StoryQuestSpeaker.jsx";
import StudentGlassShell from "./StudentGlassShell.jsx";
import { storyQuests } from "../data/storyQuests.js";
import { filterSample } from "../policy/freeTierContent.js";
import {
  isStoryQuestTeacherPreviewScope,
  loadStoryQuestProgress,
  storyQuestProgressStorageKey
} from "../utils/storyQuestProgress.js";
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

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

function BackGlyph() {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

// A READ THAT FAILED IS NOT A CHILD WHO HAS READ NOTHING. loadStoryQuestProgress
// swallows a corrupt record and returns {}, which this screen would draw as six
// brand-new stories — a claim about the child produced by a storage error. The
// raw blob is parsed first purely to learn whether it was readable, exactly as
// the Sound Trail checks its save file.
function readStoryQuestState(progressScopeKey = "default") {
  if (typeof window === "undefined") return { ok: true, progress: {} };
  if (isStoryQuestTeacherPreviewScope(progressScopeKey)) return { ok: true, progress: {} };
  try {
    const raw = window.localStorage.getItem(storyQuestProgressStorageKey(progressScopeKey));
    if (raw) JSON.parse(raw);
    return { ok: true, progress: loadStoryQuestProgress(progressScopeKey) };
  } catch {
    return { ok: false, progress: {} };
  }
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
  const [read, setRead] = useState(() => readStoryQuestState(progressScopeKey));

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      setRead(readStoryQuestState(progressScopeKey));
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);

  const reachedWorld = useMemo(
    () => reachedStoryWorld({ quests, progress: read.progress, readingLevel }),
    [quests, read.progress, readingLevel]
  );
  const [world, setWorld] = useState(reachedWorld);

  const cards = useMemo(() => buildQuestGrid({
    quests,
    progress: read.progress,
    world,
    readingLevel,
    slots: QUEST_GRID_SLOTS
  }), [quests, read.progress, readingLevel, world]);

  if (playingId && renderQuest) {
    return renderQuest({
      questId: playingId,
      onExit: () => {
        setPlayingId("");
        setRead(readStoryQuestState(progressScopeKey));
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
        data-read-state={read.ok ? "ready" : "unreadable"}
      >
        <div className="kg-quests-head">
          <button
            type="button"
            className="kg-glass kg-glass--strong kg-back"
            onClick={onBackToBooks}
            aria-label="Back to Books"
          >
            <BackGlyph />
          </button>
          <h1 className="kg-title" data-child-title="">Story Quests</h1>
          <button className="kg-quest-listen" type="button" aria-label="Hear how Story Quests work" onClick={() => narration.play("You choose what happens")}><StoryQuestSpeaker /><span className="kg-quest-hear-label">Hear</span></button>
          <span className="kg-pill kg-quests-pill" data-child-instruction="">
            {read.ok ? "You choose what happens" : "We could not open your stories"}
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
                onClick={() => { setWorld(entry.id); narration.play(entry.label); }}
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
        {narration.status && <p role="status">{narration.status}</p>}
        <section className="kg-quest-region" aria-label="Your stories" data-child-progress="">
          {cards.length
            ? (
              <div className="kg-quest-grid" data-child-choices="">
                {cards.map((card, index) => (
                  <article
                    key={card.id}
                    className={`kg-glass kg-glass--tinted kg-quest-card${index === 0 ? " kg-quest-card--pick" : ""}`}
                    data-quest-state={card.state}
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
                      <span
                        className={`kg-quest-badge kg-quest-badge--${card.state}`}
                      >
                        {card.badge}
                      </span>
                    </span>
                    <span className="kg-quest-foot">
                      <strong className="kg-quest-title">{card.title}</strong>
                      <small className="kg-quest-note">{card.state === "carry-on" ? card.note : quests.find(quest => quest.id === card.id)?.childSynopsis || card.note}</small>
                      {card.readingNote && <small className="kg-quest-reading-note">{card.readingNote}</small>}
                      {index === 0 && (
                        <small className="kg-quest-action" data-child-emphasis-cue="">
                          {card.state === "carry-on" ? "Continue" : card.state === "done" ? "Read again" : "Start story"}
                        </small>
                      )}
                    </span>
                    </button>
                    <button className="kg-quest-listen" type="button" aria-label={`Hear about ${card.fullTitle}`} onClick={() => narration.play(storyQuestInvitation(quests.find(quest => quest.id === card.id)))}><StoryQuestSpeaker /> Hear this story</button>
                  </article>
                ))}
              </div>
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
