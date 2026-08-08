// STORY QUESTS — the child's shelf of choose-what-happens stories (phase D of
// the 2026-07-29 kids-side redesign).
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 5. Story
// Quests". Layout lives in src/styles/kids-library.css; every glass surface,
// radius, blur, type step and control comes from src/styles/kids-glass.css
// (phase A). The badge states come from src/policy/childLibraryPolicy.js,
// shared with Books.
//
// IT IS REACHED FROM BOOKS, AND THE BOOKS TAB STAYS LIT. There are five tabs
// and eight places; the spec puts Story Quests behind Books. `active="stories"`
// is mapped onto the Books tab by selectActiveStudentTab, so the bar is never
// left dark and the back chevron goes where the child came from.
//
// IT IS A FRONT DOOR, NOT A REPLACEMENT. Tapping a story opens the real
// player, which keeps everything it has: branching choices, resume on the route
// the child was actually on, page audio, fullscreen, the word panel and the
// completion screen with Read again. Nothing was culled.
//
// THE THREE NUMBERS THAT DO NOT COME BACK. The old shelf page led with
// "3 complete", "2 in progress" and "30 of 119 story words seen". The child UI
// caps its numeric systems at two — stars and coins — and those were a third, a
// fourth and a fifth. What replaced them is a per-story BADGE that says what to
// do rather than how much has been counted: Carry on, New, Done, Next world.
// "You are on page 3" survives because a page is a position in the story being
// read, not a score.

import { useMemo, useState } from "react";

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
  // Held in state and re-read when the child comes back from a story, so the
  // badges show the progress the player just saved rather than the state this
  // screen started in. Re-read in the event handler, never in an effect.
  const [read, setRead] = useState(() => readStoryQuestState(progressScopeKey));

  const reachedWorld = useMemo(
    () => reachedStoryWorld({ quests, progress: read.progress, readingLevel }),
    [quests, read.progress, readingLevel]
  );
  const [world, setWorld] = useState(reachedWorld);

  const cards = useMemo(() => buildQuestGrid({
    quests,
    progress: read.progress,
    world,
    reachedWorld,
    slots: QUEST_GRID_SLOTS
  }), [quests, read.progress, reachedWorld, world]);

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
          <span className="kg-pill kg-quests-pill" data-child-instruction="">
            {read.ok ? "You choose what happens" : "We could not open your stories"}
          </span>
          <span className="kg-spacer" />

          {/* THE WORLD FILTER, WHICH IS ALSO THE OLD LEVEL FILTER. The shelf
              page grouped stories by Level A / B / C and let a child jump
              between the groups; the groups are named by their world here,
              because "Meadow" is a place a five-year-old can point at. Every
              story stays reachable — thirteen stories, six cells. */}
          <div className="kg-glass kg-segment-tray" role="group" aria-label="Story worlds">
            {STORY_WORLDS.map(entry => (
              <button
                key={entry.id}
                type="button"
                className={`kg-segment${entry.id === world ? " is-active" : ""}`}
                aria-pressed={entry.id === world}
                onClick={() => setWorld(entry.id)}
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
              <div className="kg-quest-grid" data-child-choices="">
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`kg-glass kg-glass--tinted kg-quest-card${index === 0 ? " kg-quest-card--pick" : ""}`}
                    onClick={() => setPlayingId(card.id)}
                    data-quest-state={card.state}
                    data-quest-world={card.world}
                    {...(index === 0
                      ? { "data-child-primary": "", "data-child-emphasis": "primary" }
                      : { "data-child-emphasis": "choice" })}
                  >
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
                        {...(index === 0 ? { "data-child-emphasis-cue": "" } : {})}
                      >
                        {card.badge}
                      </span>
                    </span>
                    <span className="kg-quest-foot">
                      <strong className="kg-quest-title">{card.title}</strong>
                      <small className="kg-quest-note">{card.note}</small>
                    </span>
                  </button>
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
