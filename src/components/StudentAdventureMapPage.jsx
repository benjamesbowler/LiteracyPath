// THE ADVENTURE MAP — the child's view of the Skills Quest (phase C of the
// 2026-07-29 kids-side redesign).
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 3. Adventure
// Map". Layout lives in src/styles/kids-trail.css; every glass surface, radius,
// blur, type step and animation comes from src/styles/kids-glass.css (phase A).
// The stop placement and the four card states come from
// src/policy/childTrailPolicy.js, shared with the Sound Trail.
//
// THE SCRIM IS NOT DECORATION ON THIS SCREEN. meadow-map-wide.webp is a bright,
// high-key plate and every overlay on it is white. The spec's contrast rule
// names exactly this case: any panel over artwork gets the dark scrim, and its
// overlays use tier-3 dark glass. That is what removes the need for a
// text-shadow — and there is no text-shadow anywhere in this system.
//
// IT IS A FRONT DOOR, NOT A REPLACEMENT. Tapping a stop opens the Skills Quest
// at that stop, and the mode keeps everything it had: its own full map with the
// three lands, drag-to-pan, the admin-placed landmark coordinates, the station
// rota, the Cycle Check and the certificate. Nothing was culled.
//
// EVERY NUMBER IS REAL. The mock's "Duck Pond, 3 of 3 stars" is a placeholder
// (the spec says so). The land, the part, the place names, which stop is next
// and every star count are read from the child's own progress, and a read that
// FAILED says so rather than drawing a map with nothing done on it.

import { useMemo, useState } from "react";

import StudentGlassShell from "./StudentGlassShell.jsx";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { WIDE_WORLDS, WORLD_LANDMARKS_WIDE } from "../data/mapStops.js";
import { localProgressStorageKey } from "../utils/progressKeys.js";
import { PAL_WORLDS } from "../utils/palWorlds.js";
import { speakStudentRailLabel } from "../policy/studentRailPolicy.js";
import {
  ADVENTURE_MAP_PARTS,
  adventureMapPartFor,
  buildAdventureMapScene
} from "../policy/childTrailPolicy.js";

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

// A label centred on a marker near the edge of the scene would be clipped by
// the panel's own overflow at the narrow end of the 1024-1560 canvas range, so
// the first and last few percent pull their label back inside instead.
function labelAnchor(x) {
  if (x <= 12) return "start";
  if (x >= 88) return "end";
  return "center";
}

function SpeakerGlyph({ size = 22 }) {
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

// A READ THAT FAILED IS NOT A CHILD WHO HAS DONE NOTHING. The Skills Quest's
// own loader swallows a corrupt record and returns `{ cycles: {} }`, which this
// screen would draw as a map with every stop locked — a claim about the child
// produced by a storage error. `ok` travels with the value instead.
function readMapProgress(scopeKey) {
  if (typeof window === "undefined") return { ok: true, cycles: {} };
  try {
    const raw = window.localStorage.getItem(localProgressStorageKey("el_quest", scopeKey));
    if (!raw) return { ok: true, cycles: {} };
    const parsed = JSON.parse(raw);
    const cycles = parsed && typeof parsed === "object" && parsed.cycles;
    return { ok: true, cycles: cycles && typeof cycles === "object" ? cycles : {} };
  } catch {
    return { ok: false, cycles: {} };
  }
}

const PLAYABLE_CYCLES = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);

export function StudentAdventureMapPage({
  studentName,
  progressScopeKey = "default",
  onNavigate,
  onHome,
  onGrownUps,
  // The real mode, handed in by the router so this screen never decides how the
  // Skills Quest is code-split. It receives the stop the child tapped.
  renderQuest
}) {
  const [openCycleId, setOpenCycleId] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");

  const read = useMemo(() => readMapProgress(progressScopeKey), [progressScopeKey]);

  const starsFor = cycleId => Number(read.cycles?.[cycleId]?.stars) || 0;

  // The land the child is standing in: the one holding their first unfinished
  // stop. Same rule the mode itself uses to pick its home world, so the sign on
  // this screen and the map inside the mode never disagree.
  const currentCycle = PLAYABLE_CYCLES.find(cycle => starsFor(cycle.id) <= 0)
    || PLAYABLE_CYCLES[PLAYABLE_CYCLES.length - 1];
  const part = adventureMapPartFor(currentCycle?.cycleNumber || 1);
  const worldCycles = PLAYABLE_CYCLES.filter(cycle => (
    cycle.cycleNumber >= part.first && cycle.cycleNumber <= part.last
  ));
  const landmarks = WORLD_LANDMARKS_WIDE[part.id] || [];
  const mapArt = WIDE_WORLDS.find(world => world.id === part.id)?.image || "";
  const emblem = PAL_WORLDS[part.id]?.emblem || "";

  // Not memoised on purpose: the whole build walks nine cycles and seven
  // points, and every input (the cycle list, the landmark names, the closure
  // over the read) is a fresh value each render, so a useMemo here would cost a
  // dependency array and cache nothing.
  const scene = buildAdventureMapScene({ cycles: worldCycles, starsFor, landmarks });

  // The world's own pose art, not the child's companion tile: companion images
  // have no alpha channel (measured — 1024x1024, opaque), so one standing on the
  // map is a white square with a pal in it. The pose art is cut out.
  const palArt = `/images/pals/poses/${part.id}-wave.webp`;

  // TWO CLAUSES, ONE OF THEM THE INSTRUCTION. The land is context — the badge
  // on the plate says it too — and "your pal is waiting at X" is the thing to
  // act on, so that clause is the one marked data-child-instruction and the one
  // held to the eight-word cap in tests/release/app-copy-standard.spec.js.
  const context = read.ok ? `Walk the ${part.name}.` : "";
  const instruction = !read.ok
    ? "We could not open your map right now."
    : scene.next
      ? `Your pal is waiting at ${scene.next.name}.`
      : "Every stop here is done.";

  function hear(text) {
    const spoken = speakStudentRailLabel(text, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  const stateLabel = stop => {
    if (stop.state === "done") return `${stop.stars} of 3 stars`;
    if (stop.state === "next") return "Your pal is here";
    return "Locked";
  };

  if (openCycleId && renderQuest) {
    return renderQuest({ cycleId: openCycleId, onExit: () => setOpenCycleId("") });
  }

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="map"
      onNavigate={onNavigate}
      onHome={onHome}
      onGrownUps={onGrownUps}
    >
      <div
        className="kg-screen kg-map"
        data-child-surface="adventure-map"
        data-read-state={read.ok ? "ready" : "unreadable"}
      >
        <div className="kg-trail-head">
          <div>
            <h1 className="kg-title" data-child-title="">Adventure Map</h1>
            <p
              className="kg-body kg-map-headline"
              role={read.ok ? undefined : "status"}
            >
              {context && `${context} `}
              <span data-child-instruction="">{instruction}</span>
            </p>
          </div>
          <button
            type="button"
            className="kg-speaker kg-glass"
            aria-label="Hear this"
            onClick={() => hear(`Adventure Map. ${context} ${instruction}`)}
          >
            <SpeakerGlyph />
          </button>
        </div>

        <section
          className="kg-node-scene kg-scrim kg-map-scene"
          aria-label="Your map"
          data-child-progress=""
        >
          <img
            className="kg-node-scene-art"
            src={mapArt}
            alt=""
            loading="eager"
            decoding="async"
            onError={hideOnError}
          />
          <span className="kg-glass-dark kg-pill kg-map-badge">
            <img src={emblem} alt="" onError={hideOnError} />
            {part.name} &mdash; part {part.part} of {ADVENTURE_MAP_PARTS.length}
          </span>
          <div className="kg-node-layer">
            <svg
              className="kg-node-path"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={scene.polyline}
                stroke="rgba(255,255,255,.8)"
                strokeWidth="6"
                strokeDasharray="1 12"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {scene.stops.map(stop => {
              const locked = stop.state === "locked";
              const Tag = locked ? "span" : "button";
              return (
                <Tag
                  key={stop.id}
                  {...(locked
                    ? { role: "img", "aria-disabled": "true" }
                    : { type: "button", onClick: () => setOpenCycleId(stop.id) })}
                  className={`kg-node kg-node--${stop.state}${stop.state === "next" ? " kg-halo" : ""}`}
                  style={{
                    "--kg-node-x": `${stop.x}%`,
                    "--kg-node-y": `${stop.y}%`,
                    "--kg-node-size": `${stop.size}px`,
                    fontSize: `${stop.state === "next" ? 26 : 19}px`
                  }}
                  data-node-state={stop.state}
                  data-stop={stop.id}
                  aria-label={
                    stop.state === "done"
                      ? `${stop.name}, ${stop.stars} of 3 stars. Play it again.`
                      : stop.state === "next"
                        ? `${stop.name}, your pal is here. Go there.`
                        : `${stop.name}, locked`
                  }
                  data-child-emphasis="choice"
                >
                  {stop.state === "done" ? "✓" : String(stop.number)}
                </Tag>
              );
            })}

            {scene.stops.filter(stop => stop.label).map(stop => (
              <span
                key={`label-${stop.id}`}
                className="kg-glass-dark kg-glass-dark--deep kg-node-label"
                style={{
                  "--kg-node-x": `${stop.x}%`,
                  "--kg-node-y": `${stop.y}%`,
                  "--kg-node-drop": "44px"
                }}
                data-anchor={labelAnchor(stop.x)}
                aria-hidden="true"
              >
                {stop.label}
              </span>
            ))}

            {/* Wrapper positions, inner <img> animates — kgBob writes
                `transform` and would otherwise overwrite a centring one. */}
            {scene.next && scene.stops.some(stop => stop.id === scene.next.id) && (
              <span
                className="kg-sprite kg-node-sprite"
                style={{
                  "--kg-node-x": `${scene.stops.find(stop => stop.id === scene.next.id).x}%`,
                  "--kg-node-y": `${scene.stops.find(stop => stop.id === scene.next.id).y}%`,
                  "--kg-node-lift": "34px",
                  "--kg-sprite-size": "74px"
                }}
                aria-hidden="true"
              >
                <img className="kg-bob" src={palArt} alt="" onError={hideOnError} />
              </span>
            )}
          </div>
        </section>

        <div className="kg-map-cards" data-child-choices="">
          {scene.cards.map(stop => {
            const locked = stop.state === "locked";
            return (
              <button
                key={stop.id}
                type="button"
                className={`kg-glass kg-map-card kg-map-card--${stop.state}`}
                onClick={locked ? undefined : () => setOpenCycleId(stop.id)}
                aria-disabled={locked || undefined}
                data-node-state={stop.state}
                data-child-emphasis={stop.state === "next" ? "primary" : "choice"}
                {...(stop.state === "next" ? { "data-child-primary": "" } : {})}
              >
                <span className="kg-map-card-chip" aria-hidden="true">
                  {stop.state === "done" ? "✓" : String(stop.number)}
                </span>
                <span className="kg-map-card-text">
                  <strong>{stop.name}</strong>
                  <small {...(stop.state === "next" ? { "data-child-emphasis-cue": "" } : {})}>
                    {read.ok ? stateLabel(stop) : "Still loading"}
                  </small>
                </span>
              </button>
            );
          })}
        </div>

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
    </StudentGlassShell>
  );
}
