// THE SOUND TRAIL — the child's view of Sound Seekers (phase C of the
// 2026-07-29 kids-side redesign).
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 2. Sound Trail
// (Sound Seekers)". Layout lives in src/styles/kids-trail.css; every glass
// surface, radius, blur, type step and animation comes from
// src/styles/kids-glass.css (phase A). The node placement and the chip states
// come from src/policy/childTrailPolicy.js, shared with the Adventure Map.
//
// WHAT THIS SCREEN IS FOR: the long game. How far you have come, exactly what
// is next, and which sounds are yours now. Sound Seekers is a forty-stop
// journey and until this screen existed none of that was visible until you were
// three taps inside the mode.
//
// IT IS A FRONT DOOR, NOT A REPLACEMENT. Go launches the real mode, which keeps
// every capability it has: the Den, the creature creator, the chapter map with
// its shortcuts and relics, free-roam review and the Trading Post. Nothing was
// moved out of it and nothing was culled; this screen is the shell-level view
// the mode never had.
//
// EVERY NUMBER IS REAL. The mock's "12 stops in", "Ember Fox / stage 2", and
// its sixteen green letters are placeholders (the spec says so). Here the stop
// count, the stop names, the milestone, the beastie and every chip are read
// from the save file, and a read that FAILED says so rather than drawing an
// empty trail — an empty trail is a claim about the child.
//
// TWO CURRENCIES, AND ONLY TWO. Stars and coins, both in the shell's header.
// The beastie pill names its growth stage by NAME ("Young"), not by number: a
// third counter on a child screen is how the two-currency cap erodes.

import { useMemo, useState } from "react";

import StudentGlassShell from "./StudentGlassShell.jsx";
import { getStop, stopAtIndex, QUEST_STOPS, taughtThrough } from "../data/questSequence.js";
import { QUEST_CHAPTERS, chapterForStop } from "../data/questChapters.js";
import { currentStopIndex } from "../utils/questProgress.js";
import { isMastered } from "../utils/questMastery.js";
import { graphemeLabel } from "../utils/questLabels.js";
import { loadQuestProgress, questProgressStorageKey } from "../utils/questStore.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow } from "../utils/hollowEconomy.js";
import { loadHollowLedger } from "../utils/hollowState.js";
import { PAL_WORLDS } from "../utils/palWorlds.js";
import { speakStudentRailLabel } from "../policy/studentRailPolicy.js";
import { buildSoundChips, buildSoundTrailScene } from "../policy/childTrailPolicy.js";

// Decorative art must never show a broken-image icon to a child.
function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
    </svg>
  );
}

function SpeakerGlyph({ size = 27 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M5 9.5v5h3.6l4.4 3.4V6.1L8.6 9.5H5Z" fill="currentColor" />
      <path
        d="M16.4 9a4.6 4.6 0 0 1 0 6M19.2 6.2a8.6 8.6 0 0 1 0 11.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// A CORRUPT SAVE IS NOT AN EMPTY SAVE.
//
// loadQuestProgress() deliberately hands back a playable default when the JSON
// will not parse — a white screen loses a child, a fresh trail does not. That is
// right for the GAME and wrong for a progress screen: rendering the default here
// would tell the child they have walked nothing. So the raw record is parsed
// first, purely to learn whether it was readable, and `ok` travels with the
// state the way readJsonArea() does on the Home screen.
function readTrailState(scopeKey) {
  if (typeof window === "undefined") return { ok: true, state: loadQuestProgress(scopeKey) };
  try {
    const raw = window.localStorage.getItem(questProgressStorageKey(scopeKey));
    if (raw) JSON.parse(raw);
    return { ok: true, state: loadQuestProgress(scopeKey) };
  } catch {
    return { ok: false, state: loadQuestProgress(scopeKey) };
  }
}

// The beastie the child is growing, from the Hollow's own ledger. The most
// grown one, then the first hatched — never invented: a child with no beastie
// yet simply has no pill, because a placeholder pet is a lie about their
// collection.
function readBeastie(scopeKey) {
  try {
    const treasury = computeTreasury(scopeKey);
    const hollow = computeHollow(loadHollowLedger(scopeKey), treasury.breakdown);
    const beasties = [...(hollow.beasties || [])];
    if (!beasties.length) return null;
    beasties.sort((a, b) => (b.growth?.stage || 0) - (a.growth?.stage || 0));
    return beasties[0];
  } catch {
    return null;
  }
}

// The milestone at the end of each chapter — the terracotta camp star on the
// path. Its name is the chapter's own destination, so the sign on the trail and
// the place the mode takes you to are the same fact.
const TRAIL_MILESTONES = Object.fromEntries(
  QUEST_CHAPTERS.map(chapter => [chapter.stopIds[chapter.stopIds.length - 1], chapter.destination])
);

const TRAIL_MAPS = Object.freeze({
  meadow: "/images/pals/maps/meadow-map-wide.webp",
  dino: "/images/pals/maps/dino-map-wide.webp",
  moonwood: "/images/pals/maps/moonwood-map-wide.webp"
});

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function countWord(value) {
  const n = Math.max(0, Number(value) || 0);
  return n < COUNT_WORDS.length ? COUNT_WORDS[n] : String(n);
}

// The count can open a sentence ("Three more to reach Claw Pass"), and a
// lower-case word there reads as a typo to the adult beside the child.
function sentenceCase(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

// A label centred on a marker near the edge of the scene would be clipped by
// the panel's own overflow at the narrow end of the 1024-1560 canvas range, so
// the first and last few percent pull their label back inside instead.
function labelAnchor(x) {
  if (x <= 12) return "start";
  if (x >= 88) return "end";
  return "center";
}

// "sh and ch" / "sh, ch and th" — a list a five-year-old hears the way an adult
// would read it aloud.
function joinSounds(list) {
  if (list.length <= 1) return list[0] || "";
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

export function StudentSoundTrailPage({
  studentName,
  progressScopeKey = "default",
  onNavigate,
  onHome,
  onGrownUps,
  // The real mode, handed in by the router so this screen never decides how
  // Sound Seekers is code-split. `onExit` brings the child back HERE, which is
  // where they left from.
  renderQuest
}) {
  const [playing, setPlaying] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");

  const read = useMemo(() => readTrailState(progressScopeKey), [progressScopeKey]);
  const beastie = useMemo(() => readBeastie(progressScopeKey), [progressScopeKey]);

  const state = read.state;
  const nextIndex = currentStopIndex(state);
  const doneIds = state.trail?.stopsDone || [];
  const nextStop = stopAtIndex(nextIndex);
  const chapter = chapterForStop(nextStop?.id || "s1") || QUEST_CHAPTERS[0];

  // Placing ten markers is a walk over ten stops; memoising it would cost a
  // dependency array and cache nothing worth caching.
  const scene = buildSoundTrailScene({
    stops: QUEST_STOPS,
    doneIds,
    nextIndex,
    milestones: TRAIL_MILESTONES
  });

  // The sounds the next stop teaches. Morphology (-s, -ing) is not a sound, so
  // it never becomes a chip and never appears in the "listen for" line — that
  // mistake is what once had the game segmenting "thing" as th|ing.
  const focus = (getStop(nextStop?.id || "")?.teach || [])
    .filter(entry => entry.kind !== "morph")
    .map(entry => entry.id);

  // Every grapheme taught through the LAST FINISHED stop — what the child
  // actually has, as opposed to what the next stop is about to teach. Walking
  // forty stop definitions is cheaper than a dependency array, so this is a
  // plain computation and the React compiler is left to decide.
  const owned = [...taughtThrough(Math.max(0, nextIndex - 1))];
  const mastery = state.mastery || {};
  const mastered = owned.filter(id => isMastered(mastery, id));
  const sounds = buildSoundChips({ owned, mastered, focus });

  const world = PAL_WORLDS[nextStop?.world || "meadow"] || PAL_WORLDS.meadow;
  const doneCount = doneIds.length;
  const stopsToMilestone = Math.max(0, chapter.stopRange[1] - nextIndex + 1);
  const trailComplete = doneCount >= QUEST_STOPS.length;

  // WHAT THE HEADLINE MAY CLAIM. Only what the save file actually said. An
  // unreadable record gets a sentence about the record, never a count of zero.
  const headline = !read.ok
    ? "We could not open your trail right now."
    : trailComplete
      ? "You have walked the whole trail. Every sound is yours."
      : doneCount === 0
        ? `You are at the start. Your first stop is ${nextStop?.name || "waiting"}.`
        : `You are ${countWord(doneCount)} stops in. ${
          sentenceCase(stopsToMilestone <= 1 ? "one" : countWord(stopsToMilestone))
        } more to reach ${chapter.destination}.`;

  // THE INSTRUCTION IS ONE SHORT LINE, AND THAT IS A RULE, NOT A STYLE.
  // tests/release/app-copy-standard.spec.js caps a child instruction at eight
  // words, and a stop can teach seven sounds at once (s15 teaches br, cr, dr,
  // fr, gr, pr and tr). Naming three and saying so is true and readable; naming
  // all seven is a sentence a five-year-old will not finish. Every sound is on
  // screen anyway, as a chip.
  const soundLabels = focus.map(graphemeLabel).filter(Boolean);
  const instruction = !soundLabels.length
    ? "Read the words you know."
    : soundLabels.length <= 3
      ? `Listen for ${joinSounds(soundLabels)}.`
      : `Listen for ${soundLabels.slice(0, 3).join(", ")} and more.`;

  // The sprite that stands above the next marker. The plate underneath is
  // world.backdrop — the CLEAN, character-free art — so this is the only
  // creature in the frame. Pair a placed pal with a clean plate, or use a
  // populated plate alone; never both (the panorama already has two pals in it,
  // which is how a third one ended up on the Home hero).
  //
  // The fallback is the world's POSE art, not the child's companion tile:
  // companion images have no alpha channel (measured — 1024x1024, opaque), so
  // one standing on an illustration is a white square with a pal in it. Beastie
  // and pose art are cut out.
  const beastieSrc = beastie
    ? `/images/hollow/${beastie.id}-s${beastie.growth?.stage || 1}.webp`
    : "";
  const spriteSrc = beastieSrc || world.point || "";

  function hear(text) {
    const spoken = speakStudentRailLabel(text, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  if (playing && renderQuest) return renderQuest({ onExit: () => setPlaying(false) });

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="sounds"
      onNavigate={onNavigate}
      onHome={onHome}
      onGrownUps={onGrownUps}
    >
      <div
        className="kg-screen kg-trail"
        data-child-surface="sound-seekers"
        data-read-state={read.ok ? "ready" : "unreadable"}
      >
        <div className="kg-trail-head">
          <div>
            <h1 className="kg-title" data-child-title="">The Sound Trail</h1>
            <p className="kg-body kg-trail-headline" role={read.ok ? undefined : "status"}>
              {headline}
            </p>
          </div>
          {beastie && (
            <span className="kg-pill kg-glass kg-glass--strong kg-trail-beastie">
              <img src={beastieSrc} alt="" onError={hideOnError} />
              {beastie.name} &middot; {beastie.growth?.name || ""}
            </span>
          )}
        </div>

        {/* THE TRAIL SCENE. Ten stops of a forty-stop journey, windowed so the
            next one sits mid-path (see childTrailPolicy). The scrim is the
            spec's trail gradient and it is what makes white labels legal over a
            bright meadow — there is no text-shadow in this system. */}
        <section
          className="kg-node-scene kg-scrim kg-scrim--trail kg-trail-scene"
          aria-label="How far along the trail you are"
          data-child-progress=""
        >
          <img
            className="kg-node-scene-art"
            src={TRAIL_MAPS[world.id] || TRAIL_MAPS.meadow}
            alt=""
            loading="eager"
            decoding="async"
            onError={hideOnError}
          />
          <div className="kg-node-layer">
            <svg
              className="kg-node-path"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={scene.polyline}
                stroke="rgba(255,255,255,.72)"
                strokeWidth="2.5"
                strokeDasharray="4 6"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {scene.nodes.map(node => (
              <span
                key={node.key}
                className={`kg-node kg-node--${node.state}${node.state === "next" ? " kg-halo" : ""}`}
                style={{
                  "--kg-node-x": `${node.x}%`,
                  "--kg-node-y": `${node.y}%`,
                  "--kg-node-size": `${node.size}px`,
                  fontSize: `${node.state === "camp" ? 22 : 17}px`
                }}
                data-node-state={node.state}
                data-stop={node.stopId}
                role="img"
                aria-label={
                  node.state === "done"
                    ? `${node.name}, done`
                    : node.state === "next"
                      ? `${node.name}, your next stop`
                      : node.state === "camp"
                        ? `${node.label}, still ahead`
                        : `${node.name}, still ahead`
                }
              >
                {node.state === "done" ? "✓" : node.state === "camp" ? "★" : ""}
              </span>
            ))}

            {scene.nodes.filter(node => node.label).map(node => (
              <span
                key={`label-${node.key}`}
                className="kg-glass-dark kg-node-label"
                style={{
                  "--kg-node-x": `${node.x}%`,
                  "--kg-node-y": `${node.y}%`,
                  "--kg-node-drop": `${node.size / 2 + 11}px`
                }}
                data-anchor={labelAnchor(node.x)}
                aria-hidden="true"
              >
                {node.label}
              </span>
            ))}

            {/* THE ANIMATION GOTCHA, answered. kgBob animates `transform`, so a
                sprite that centred itself with a transform would be thrown off
                the marker the moment it moved. .kg-sprite is the outer wrapper
                (negative margins, no transform of its own) and .kg-bob rides the
                inner <img>. Both classes are off under reduced motion. */}
            {scene.next && spriteSrc && (
              <span
                className="kg-sprite kg-node-sprite"
                style={{
                  "--kg-node-x": `${scene.next.x}%`,
                  "--kg-node-y": `${scene.next.y}%`,
                  "--kg-node-lift": `${scene.next.size / 2 + 3}px`,
                  "--kg-sprite-size": "80px"
                }}
                aria-hidden="true"
              >
                <img className="kg-bob" src={spriteSrc} alt="" onError={hideOnError} />
              </span>
            )}
          </div>
        </section>

        <div className="kg-trail-foot">
          <section
            className="kg-glass kg-glass--strong kg-trail-next"
            aria-labelledby="kg-trail-next-title"
          >
            <div>
              <span className="kg-eyebrow">Next stop</span>
              <h2 className="kg-panel-title kg-trail-next-name" id="kg-trail-next-title">
                {nextStop?.name || chapter.destination}
              </h2>
              <p className="kg-body kg-trail-next-line" data-child-instruction="">
                {instruction}
              </p>
            </div>
            <div className="kg-trail-next-actions">
              <button
                type="button"
                className="kg-button kg-glass-accent kg-trail-go"
                onClick={() => setPlaying(true)}
                aria-label={`Go to ${nextStop?.name || "your next stop"}`}
                data-child-primary=""
                data-child-emphasis="primary"
              >
                <PlayGlyph />
                <span data-child-emphasis-cue="">Go</span>
              </button>
              <button
                type="button"
                className="kg-speaker kg-glass kg-trail-hear"
                aria-label="Hear this"
                onClick={() => hear(`${headline} Next stop. ${nextStop?.name || ""}. ${instruction}`)}
              >
                <SpeakerGlyph />
              </button>
            </div>
          </section>

          <section
            className="kg-glass kg-glass--quiet kg-trail-sounds"
            aria-labelledby="kg-trail-sounds-title"
            data-child-choices=""
          >
            <div className="kg-trail-sounds-head">
              <h2 className="kg-section-title kg-trail-sounds-title" id="kg-trail-sounds-title">
                Sounds you own
              </h2>
              {/* The panel cannot scroll and a child forty stops along owns more
                  spellings than fit, so the newest are shown and the total says
                  so. Naming the count is what keeps "sounds you own" true. */}
              {read.ok && sounds.ownedCount > 0 && (
                <span className="kg-caption">{sounds.ownedCount} so far</span>
              )}
            </div>
            <div className="kg-trail-chips">
              {/* Green means the mastery gate credited it: four correct, 75%
                  over the last four, in two different mini-games on two
                  different days. It is a claim about the child, so it is never
                  handed out for "seen it". */}
              {sounds.chips.map(chip => (
                <span
                  key={`${chip.state}-${chip.id}`}
                  className={`kg-trail-chip kg-trail-chip--${chip.state}`}
                  data-sound-state={chip.state}
                >
                  {graphemeLabel(chip.id)}
                </span>
              ))}
            </div>
          </section>
        </div>

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
    </StudentGlassShell>
  );
}
