import { adventureStationContinuation } from "../policy/adventureContinuation.js";
// One authored atlas fills the child viewport. Place details are available by
// mouse, keyboard and touch; only the continuation action opens practice.
// Artwork and coordinates share a versioned authority in adventureMapAtlas.js.

import { useCallback, useEffect, useRef, useState } from "react";

import { ADVENTURE_ATLAS_VIEW, mapAreaDetails } from "../data/adventureMapAtlas.js";
import "../styles/adventure-map-atlas.css";

import StudentGlassShell from "./StudentGlassShell.jsx";
import { ChildRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { filterSample } from "../policy/freeTierContent.js";
import {
  WIDE_WORLDS,
  WORLD_LANDMARKS_WIDE,
  getCachedWideOverride,
  loadWideMapOverride,
  wideMapPointsFor
} from "../data/mapStops.js";
import {
  clearElQuestLocalProgress,
  readElQuestLocalProgress
} from "../utils/adventureMapLocalProgress.js";
import { PAL_WORLDS } from "../utils/palWorlds.js";
import { completedWordMatchCycles } from "../utils/wordMatchProgression.js";
import { playCueAudio, stopCueAudio } from "../utils/audio/cuePlayer.js";
import { ADVENTURE_MAP_INSTRUCTIONS } from "./elQuest/adventureRoundAudio.js";
import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from "../data/generated/adventureMapInstructionAudio.generated.js";
import { normalizeLedaAudioText } from "../data/ledaProductionAudio.js";
import {
  ADVENTURE_MAP_PARTS,
  adventureMapPartFor,
  buildAdventureMapScene,
  resolveAdventureMapCycleLock
} from "../policy/childTrailPolicy.js";

function hideOnError(event) {
  event.currentTarget.style.display = "none";
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
  const read = readElQuestLocalProgress(scopeKey);
  const cycles = read.value?.cycles;
  return {
    ok: read.ok,
    reason: read.reason || "",
    cycles: cycles && typeof cycles === "object" && !Array.isArray(cycles) ? cycles : {}
  };
}

const allAdventureCycles = () => elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);

// A function, not a constant: the sample scope is set when a try session starts,
// which is long after this module is evaluated.
const playableCycles = () => filterSample("cycles", allAdventureCycles());

export function StudentAdventureMapPage({
  studentName,
  progressScopeKey = "default",
  onNavigate,
  onHome,
  onGrownUps,
  focusLocked = false,
  lockedCycleId = null,
  onLockedCycleAvailabilityChange = null,
  headerActions = null,
  // The real mode, handed in by the router so this screen never decides how the
  // Skills Quest is code-split. It receives the stop the child tapped.
  renderQuest
}) {
  const [openCycleId, setOpenCycleId] = useState("");
  const [openStationId, setOpenStationId] = useState("");
  const [speechStatus, setSpeechStatus] = useState("");
  const [opening, setOpening] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [areaId, setAreaId] = useState("");
  const [planeSize, setPlaneSize] = useState({ width: 760, height: 425 });
  const mapScrollRef = useRef(null);
  const areaRef = useRef(null);
  const dismissedAreaRef = useRef("");
  const [, setHydrationRevision] = useState(0);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      setHydrationRevision(revision => revision + 1);
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);

  // THE ADMIN'S STOP POSITIONS, LOADED THE WAY THE MODE LOADS THEM. The cached
  // copy paints on the first frame; the fetch refreshes it and falls back to
  // that same cache offline. Identical to ElSkillsQuest's read, deliberately:
  // one click-to-place edit has to move the marker on both screens or the front
  // door starts lying about where the child is going.
  const [wideOverride, setWideOverride] = useState(getCachedWideOverride);
  useEffect(() => {
    let alive = true;
    loadWideMapOverride().then(ov => { if (alive) setWideOverride(ov); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const read = readMapProgress(progressScopeKey);

  const starsFor = cycleId => Number(read.cycles?.[cycleId]?.stars) || 0;
  const availableCycles = playableCycles();
  const exactAssignmentCycles = allAdventureCycles();
  const cycleLock = resolveAdventureMapCycleLock({
    // An exact teacher assignment is classroom authority, not ordinary sample
    // browsing. Keep the open map inside the entitlement while allowing the
    // teacher's one named cycle through the same front door as the Quest.
    cycles: exactAssignmentCycles,
    lockedCycleId
  });
  const mapCycles = cycleLock.locked ? exactAssignmentCycles : availableCycles;
  const moreWordMatch = !cycleLock.locked
    && mapCycles.some(cycle => cycle.id === 'cycle-27')
    && completedWordMatchCycles({ cycles: read.cycles });

  useEffect(() => {
    if (!cycleLock.locked) return;
    onLockedCycleAvailabilityChange?.(cycleLock.contentAvailable);
  }, [cycleLock.contentAvailable, cycleLock.locked, onLockedCycleAvailabilityChange]);

  // The land the child is standing in: the one holding their first unfinished
  // stop. Same rule the mode itself uses to pick its home world, so the sign on
  // this screen and the map inside the mode never disagree.
  const currentCycle = cycleLock.locked
    ? cycleLock.cycle
    : mapCycles.find(cycle => starsFor(cycle.id) <= 0)
      || mapCycles[mapCycles.length - 1];
  const part = adventureMapPartFor(currentCycle?.cycleNumber || 1);
  const worldCycles = currentCycle
    ? mapCycles.filter(cycle => (
        cycle.cycleNumber >= part.first && cycle.cycleNumber <= part.last
      ))
    : [];
  const landmarks = WORLD_LANDMARKS_WIDE[part.id] || [];
  const mapArt = WIDE_WORLDS.find(world => world.id === part.id)?.image || "";
  const emblem = PAL_WORLDS[part.id]?.emblem || "";
  // Both map surfaces use percentages of the complete, uncropped atlas.
  const mapPoints = wideMapPointsFor(part.id, wideOverride);

  // Not memoised on purpose: the whole build walks nine cycles and nine
  // points, and every input (the cycle list, the landmark names, the closure
  // over the read) is a fresh value each render, so a useMemo here would cost a
  // dependency array and cache nothing.
  const scene = buildAdventureMapScene({
    cycles: worldCycles,
    starsFor,
    landmarks,
    points: mapPoints,
    activeCycleId: cycleLock.locked ? cycleLock.cycleId : null
  });
  const mapCards = moreWordMatch
    ? [{ id: 'more-word-match', name: 'More Word Match', number: '✓', state: 'next' }]
    : scene.cards.filter(stop => stop.state === "next");

  // The pal stands on a MARKER, not on a fact: scene.next is the child's next
  // stop whether or not the admin has placed a coordinate for it, and a stop
  // with no coordinate has no marker to stand on.
  const placedNext = scene.next
    ? scene.stops.find(stop => stop.id === scene.next.id)
    : null;

  // The world's own pose art, not the child's companion tile: companion images
  // have no alpha channel (measured — 1024x1024, opaque), so one standing on the
  // map is a white square with a pal in it. The pose art is cut out.
  const palArt = `/images/pals/poses/${part.id}-wave.webp`;

  // TWO CLAUSES, ONE OF THEM THE INSTRUCTION. The land is context — the badge
  // on the plate says it too — and "your pal is waiting at X" is the thing to
  // act on, so that clause is the one marked data-child-instruction and the one
  // held to the eight-word cap in tests/release/app-copy-standard.spec.js.
  const instruction = cycleLock.locked && !cycleLock.contentAvailable
    ? "This assigned map space is not available."
    : !read.ok
    ? "We could not open your map right now."
    : scene.next
      ? `Your pal is waiting at ${scene.next.name}.`
      : moreWordMatch ? "Keep matching new words." : "Every stop here is done.";

  const mapAudio = read.ok && (scene.next || moreWordMatch) && !openCycleId
    ? ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(ADVENTURE_MAP_INSTRUCTIONS.mapEntry)]
    : "";
  const hear = useCallback(() => {
    if (!mapAudio) return;
    playCueAudio(mapAudio, {
      playImmediately: true,
      onDelivery: event => {
        if (event.type === "started") setSpeechStatus("Reading it out.");
        if (event.type === "completed") setSpeechStatus("");
      },
      onUnavailable: () => setSpeechStatus("Tap the speaker to hear the directions.")
    });
  }, [mapAudio]);
  useEffect(() => {
    if (!mapAudio) return undefined;
    let active = true;
    let retryOnGesture = false;
    const play = () => playCueAudio(mapAudio, {
      playImmediately: true,
      onUnavailable: () => { if (active) retryOnGesture = true; }
    });
    const retry = event => {
      if (!retryOnGesture || event.target?.closest?.("button, a")) return;
      retryOnGesture = false;
      play();
    };
    play();
    window.addEventListener("pointerdown", retry);
    window.addEventListener("keydown", retry);
    return () => {
      active = false;
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      stopCueAudio();
    };
  }, [mapAudio]);

  useEffect(() => {
    const scroller = mapScrollRef.current;
    if (!scroller) return undefined;
    const resize = () => {
      const ratio = ADVENTURE_ATLAS_VIEW.w / ADVENTURE_ATLAS_VIEW.h;
      const portrait = scroller.clientHeight / scroller.clientWidth > 0.65;
      const width = portrait
        ? Math.max(760, scroller.clientWidth, scroller.clientHeight * ratio)
        : Math.max(760, Math.min(scroller.clientWidth, scroller.clientHeight * ratio));
      setPlaneSize({ width, height: width / ratio });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(scroller);
    resize();
    return () => observer.disconnect();
  }, [read.ok, openCycleId]);

  const selectedArea = scene.stops.find(stop => stop.id === areaId);
  const nextAreaId = placedNext?.id;
  const nextAreaX = placedNext?.x;
  const nextAreaY = placedNext?.y;
  useEffect(() => {
    if (!areaId) return undefined;
    const dismiss = event => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "pointerdown" && (areaRef.current?.contains(event.target)
        || event.target.closest?.("[data-stop]"))) return;
      dismissedAreaRef.current = areaId;
      setAreaId("");
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [areaId]);
  useEffect(() => {
    const scroller = mapScrollRef.current;
    if (!scroller || !nextAreaId) return;
    scroller.scrollLeft = Math.max(0,
      scroller.scrollWidth * nextAreaX / 100 - scroller.clientWidth / 2);
    const compact = scroller.clientWidth <= 820;
    const paddingTop = Number.parseFloat(getComputedStyle(scroller.firstElementChild).marginTop) || 0;
    const targetY = compact ? Math.min(scroller.clientHeight / 2, Math.max(scroller.clientWidth <= 430 ? 150 : 100, scroller.clientHeight - 300)) : scroller.clientHeight / 2;
    scroller.scrollTop = Math.max(0, paddingTop + planeSize.height * (nextAreaY || 0) / 100 - targetY);
  }, [part.id, nextAreaId, nextAreaX, nextAreaY, planeSize.width, planeSize.height]);

  const stateLabel = stop => {
    if (stop.state === "done") return `${stop.stars} of 3 stars`;
    if (stop.state === "next") {
      return cycleLock.locked
        ? "Your teacher chose this map space"
        : "This is your next unfinished stop";
    }
    return "Locked";
  };

  const primaryReason = cycleLock.locked
    ? "Your teacher chose this map space."
    : moreWordMatch ? "Match four pairs of new words." : "This is your next unfinished stop.";

  function recoverUnreadableProgress() {
    if (!clearElQuestLocalProgress(progressScopeKey)) {
      setRecoveryStatus("Ask a grown-up to try again.");
      return;
    }
    setRecoveryStatus("");
    setHydrationRevision(revision => revision + 1);
  }

  if (
    openCycleId
    && renderQuest
    && (!cycleLock.locked || openCycleId === cycleLock.cycleId)
  ) {
    return renderQuest({ cycleId: openCycleId, stationId: openStationId, onExit: () => {
      setOpenCycleId("");
      setOpenStationId("");
    } });
  }

  // A broken or newer record is a full-screen state, not an empty-looking map.
  // In particular, do not offer the destructive recovery action for a record
  // written by a newer app: its opaque fields must remain byte-for-byte intact.
  if (!read.ok) {
    const needsUpdate = read.reason === "unsupported_version";
    return (
      <StudentGlassShell
        studentName={studentName}
        scopeKey={progressScopeKey}
        active="map"
        onNavigate={onNavigate}
        onHome={focusLocked ? undefined : onHome}
        onGrownUps={focusLocked ? undefined : onGrownUps}
        profileInteractive={!focusLocked}
        showGrownUps={!focusLocked}
        showWallet={!focusLocked}
        tabs={focusLocked ? [] : undefined}
        headerActions={headerActions}
        nativeViewport
      >
        <div
          className="kg-screen kg-map kg-map--message"
          data-child-surface="adventure-map"
          data-learning-lane="practice_and_play"
          data-read-state={needsUpdate ? "update-required" : "unreadable"}
          data-quest-view={needsUpdate ? "progress-update-required" : "progress-recovery"}
        >
          <section className="kg-glass kg-glass--strong kg-map-message" role="status" aria-live="polite">
            <img className="kg-map-message-pal" src={palArt} alt="" onError={hideOnError} />
            <h1 className="kg-title" data-child-title="">
              {needsUpdate ? "Adventure Map needs an update" : "Adventure Map needs a fresh start"}
            </h1>
            <p className="kg-body" data-child-instruction="">
              {needsUpdate
                ? "Ask a grown-up to update this app."
                : "Clear this map copy to start fresh."}
            </p>
            <p className="kg-body kg-map-message-detail">
              {needsUpdate
                ? "Your saved map will stay safe."
                : "Your other learning stays safe."}
            </p>
            <button
              className="main-button kg-map-message-action"
              type="button"
              onClick={needsUpdate ? () => window.location.reload() : recoverUnreadableProgress}
            >
              {needsUpdate ? "Check for the update" : "Clear map copy and try again"}
            </button>
            <span className="kg-speech" role="status" aria-live="polite">{recoveryStatus}</span>
          </section>
        </div>
      </StudentGlassShell>
    );
  }

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="map"
      onNavigate={onNavigate}
      onHome={focusLocked ? undefined : onHome}
      onGrownUps={focusLocked ? undefined : onGrownUps}
      profileInteractive={!focusLocked}
      showGrownUps={!focusLocked}
      showWallet={!focusLocked}
      tabs={focusLocked ? [] : undefined}
      headerActions={headerActions}
      nativeViewport
    >
      <div
        className="kg-screen kg-map kg-map--atlas"
        data-child-surface="adventure-map"
        data-learning-lane="practice_and_play"
        data-read-state={read.ok ? "ready" : "unreadable"}
        data-focus-locked={cycleLock.locked ? "true" : "false"}
        data-locked-cycle-id={cycleLock.cycleId || undefined}
      >
        <div className="kg-atlas-heading">
          <div>
            <h1 className="kg-title" data-child-title="">Adventure Map</h1>
            <p
              className="kg-body kg-map-headline"
              role={read.ok ? undefined : "status"}
            >
              <span data-child-instruction="">{instruction}</span>
            </p>
          </div>
          <button
            type="button"
            className="kg-speaker kg-speaker--md kg-glass"
            aria-label="Hear this"
            onClick={hear}
            disabled={!mapAudio}
            data-map-instruction-audio={mapAudio}
          >
            <SpeakerGlyph />
          </button>
        </div>

        <section className="kg-atlas-scene" style={{ backgroundImage: `url(${mapArt})` }} aria-label="Your map" data-child-progress="">
          <div className="kg-atlas-scroll" ref={mapScrollRef} tabIndex={0} aria-label="Map. Scroll to explore the places.">
            <div className="kg-atlas-plane" style={{ width: planeSize.width, height: planeSize.height }}>
              <img className="kg-atlas-art" src={mapArt} alt="" loading="eager" decoding="async" onError={hideOnError} />
              <svg className="kg-atlas-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={scene.polyline} fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="4" strokeDasharray="1 10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="kg-atlas-stops" data-child-choices="">
                {scene.stops.map(stop => (
                  <button key={stop.id} type="button"
                    className={`kg-atlas-stop kg-atlas-stop--${stop.state}`}
                    style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                    data-node-state={stop.state} data-stop={stop.id}
                    aria-label={`${stop.name}, ${stateLabel(stop)}. Show place details`}
                    aria-expanded={areaId === stop.id}
                    aria-controls={areaId === stop.id ? "adventure-area-details" : undefined}
                    onPointerEnter={event => { if (event.pointerType === "mouse" && dismissedAreaRef.current !== stop.id) setAreaId(stop.id); }}
                    onPointerLeave={() => { if (dismissedAreaRef.current === stop.id) dismissedAreaRef.current = ""; }}
                    onFocus={() => setAreaId(stop.id)}
                    onClick={() => setAreaId(stop.id)}
                    data-child-emphasis={stop.state === "next" ? "context" : "choice"}>
                    <span aria-hidden="true">{stop.state === "done" ? "✓" : String(stop.number)}</span>
                    {stop.state === "next" && <span className="kg-atlas-stop-name" data-low={stop.y > 70 ? "true" : undefined} aria-hidden="true">{stop.name}</span>}
                  </button>
                ))}
                {placedNext && <img className="kg-atlas-pal" style={{ left: `${placedNext.x}%`, top: `${placedNext.y}%` }} src={palArt} alt="" onError={hideOnError} />}
              </div>
            </div>
          </div>
          <span className="kg-atlas-world"><img src={emblem} alt="" onError={hideOnError} />{part.name} · {part.part} of {ADVENTURE_MAP_PARTS.length}</span>
          {selectedArea && <aside ref={areaRef} id="adventure-area-details" className="kg-atlas-details" data-place={selectedArea.x > 60 ? "left" : "right"} aria-label={`${selectedArea.name} details`}>
            <button type="button" className="kg-atlas-details-close" aria-label="Close place details" onClick={() => { dismissedAreaRef.current = areaId; setAreaId(""); }}>×</button>
            <div className="kg-atlas-details-body">
            <span className={`kg-atlas-details-state kg-atlas-details-state--${selectedArea.state}`}>{stateLabel(selectedArea)}</span>
            <h2>{selectedArea.name}</h2>
            <p>{mapAreaDetails(part.id, scene.stops.indexOf(selectedArea))}</p>
            {selectedArea.state === "locked" && <p className="kg-atlas-details-hint">Keep following the path to get here.</p>}
            </div>
          </aside>}
        </section>

        <div className="kg-atlas-continue">
          {mapCards.map(stop => {
            const isNext = stop.state === "next";
            const isMoreWords = stop.id === 'more-word-match';
            const Tag = isNext ? "button" : "article";
            return (
              <Tag
                key={stop.id}
                {...(isNext ? { type: "button" } : {})}
                className={`kg-atlas-continue-button kg-map-card kg-map-card--${stop.state}`}
                disabled={isNext && opening}
                onClick={isNext ? async () => {
                  if (opening) return;
                  setOpening(true);
                  try {
                    const cycleId = isMoreWords ? "cycle-27" : stop.id;
                    const cycle = mapCycles.find(item => item.id === cycleId);
                    const { stationsForCycle } = await import("./elQuest/elQuestEngine.js");
                    const fresh = readMapProgress(progressScopeKey);
                    if (!fresh.ok) { setSpeechStatus("Your map could not be read. Try again."); return; }
                    const { nextStation } = adventureStationContinuation(stationsForCycle(cycle), fresh.cycles[cycleId]);
                    setOpenStationId(isMoreWords ? "spell" : nextStation?.id || "");
                    setOpenCycleId(cycleId);
                  } catch { setSpeechStatus("This game could not open. Try again."); }
                  finally { setOpening(false); }
                } : undefined}
                aria-label={isMoreWords ? 'More Word Match' : undefined}
                aria-disabled={!isNext || undefined}
                data-cycle-id={isMoreWords ? undefined : stop.id}
                data-node-state={stop.state}
                data-child-emphasis={stop.state === "next" ? "primary" : "choice"}
                {...(stop.state === "next" ? { "data-child-primary": "" } : {})}
              >
                <span className="kg-map-card-chip" aria-hidden="true">
                  {stop.state === "done" ? "✓" : String(stop.number)}
                </span>
                <span className="kg-map-card-text">
                  <strong>{opening ? "Opening…" : `Carry on · ${stop.name}`}</strong>
                  <small {...(stop.state === "next" ? { "data-child-emphasis-cue": "" } : {})}>
                    {read.ok && isNext
                      ? (
                          <ChildRecommendationExplanation
                            surface="adventure-map"
                            reason={primaryReason}
                          />
                        )
                      : read.ok ? stateLabel(stop) : "Still loading"}
                  </small>
                </span>
                {isNext && <span className="kg-map-card-go" aria-hidden="true">&#8594;</span>}
              </Tag>
            );
          })}
        </div>

        {scene.next && <button type="button" className="kg-atlas-browse" onClick={() => { setOpenStationId(""); setOpenCycleId(scene.next.id); }}>Choose another game here</button>}

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
    </StudentGlassShell>
  );
}
