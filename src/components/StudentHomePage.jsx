// THE CHILD HOME SCREEN — phase B of the 2026-07-29 kids-side redesign.
//
// Binding spec: mockups/design-handoff-kids-side/README.md, "### 1. Home".
// Layout lives in src/styles/kids-home.css; every glass surface, radius, blur,
// type step and animation comes from src/styles/kids-glass.css (phase A).
//
// WHAT THIS SCREEN IS FOR: answering "what do I do now?" in under a second,
// while leaving every destination one tap away.
//
// ONE UNMISTAKABLE NEXT ACTION. The old home offered a daily-mission strip, a
// "recommended" hero, two secondary cards and a collapsed "more to explore"
// drawer, all competing for the same glance, behind a text-labelled rail a
// pre-reader cannot use. This screen has exactly ONE primary call to action —
// the hero's Play button, which carries data-child-primary. The three stops
// below it are a READ-ONLY checklist (three taps that all lead somewhere would
// re-create the competition the redesign removed), and the six doorways are
// equal, quiet alternatives. A second loud button here is a regression.
//
// WHICH ACTIVITY THE HERO CONTINUES is not a new decision: it is
// selectStudentHomeRecommendation(), the same policy (and the same unit tests)
// that chose the old hero. The redesign changed the presentation, not the
// rule.
//
// TWO CURRENCIES, AND ONLY TWO. Stars and coins, both in the shell's header.
// This file must not surface a streak, gems, XP or points — the celebration
// copy used to name a streak ("that's N school days in a row") and that
// sentence is gone.
//
// NUMBERS ARE WIRED, NOT INVENTED. The mock's counts are placeholders. Every
// number and name on this screen is read from real student state; where no
// real source exists (the mock's "6 stars waiting"), the screen says something
// true instead of showing a made-up figure.

import { useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "./learn/games/shared/ConfettiCelebration.jsx";
import { playCelebrationFanfare } from "../utils/audio/gameSfx.js";
import {
  buildDailyMission,
  getMissionStatus,
  markMissionCelebrated,
  markMissionStepCelebrated
} from "../utils/dailyMission.js";
import {
  COMPANIONS,
  getCompanion,
  loadStudentProfile,
  setCompanion
} from "../utils/studentProfile.js";
import { worldForScope } from "../utils/palWorlds.js";
import { warmStudentAssets } from "../utils/preloadAssets.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow, freshSpendableCoinCount } from "../utils/hollowEconomy.js";
import { loadHollowLedger, coinsSinceLastVisit } from "../utils/hollowState.js";
import { CHILD_BRAND } from "../data/childBrand.js";
import { GAME_LIST } from "../data/learnGamesData.js";
import { filterSample } from "../policy/freeTierContent.js";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { stopAtIndex } from "../data/questSequence.js";
import { currentStopIndex } from "../utils/questProgress.js";
import { CoinIcon } from "./shared/CurrencyIcons.jsx";
import {
  buildStudentHomeCardState,
  buildStudentHomeContinuation,
  selectStudentHomeRecommendation
} from "../policy/learningPolicy.js";
import {
  STUDENT_RAIL_ICON_PATHS,
  selectStudentRailItems,
  speakStudentRailLabel
} from "../policy/studentRailPolicy.js";
import StudentGlassShell from "./StudentGlassShell.jsx";
import { localProgressStorageKey } from "../utils/progressKeys.js";

// Decorative art must never show a broken-image icon to kids; hide it instead.
// Branded placeholder for card/tile artwork: a sage-sky rounded tile with a
// cream star. Missing art must never collapse a card's layout (REVIEW.md,
// Designer #10) — decorative images (logos, avatars) still just hide.
const ART_PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" rx="12" fill="#BFE3D8"/><path d="M80 38l7.5 15.2 16.8 2.4-12.1 11.8 2.9 16.7L80 76.2l-15.1 7.9 2.9-16.7-12.1-11.8 16.8-2.4z" fill="#FBF4EA"/></svg>'
);

function placeholderOnError(event) {
  const img = event.currentTarget;
  if (img.dataset.placeholdered === "true") return;
  img.dataset.placeholdered = "true";
  img.src = ART_PLACEHOLDER;
}

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

// A READ THAT FAILED IS NOT AN EMPTY READ.
//
// The old helper swallowed a malformed record and returned {}, which the UI
// then rendered as "nothing done yet" — a claim about the child, produced by a
// storage error. `ok` travels with the value so the screen can say "we could
// not load this" instead.
function readJsonArea(area, scopeKey) {
  if (typeof window === "undefined") return { ok: true, value: {} };
  const key = localProgressStorageKey(area, scopeKey);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { ok: true, value: {} };
    const parsed = JSON.parse(raw);
    return { ok: true, value: parsed && typeof parsed === "object" ? parsed : {} };
  } catch {
    return { ok: false, value: {} };
  }
}

function readStudentHomeProgress(scopeKey) {
  const areas = {
    soundSeekers: readJsonArea("phonics_quest", scopeKey),
    phonics: readJsonArea("phonics_letters", scopeKey),
    adventureMap: readJsonArea("el_quest", scopeKey),
    arcade: readJsonArea("learn_games", scopeKey),
    storyQuests: readJsonArea("story_quests", scopeKey),
    readingLibrary: readJsonArea("guided_reading", scopeKey),
    hollow: readJsonArea("hollow", scopeKey),
    dailyStops: readJsonArea("daily_mission", scopeKey)
  };
  const progress = Object.fromEntries(
    Object.entries(areas).map(([name, result]) => [name, result.value])
  );
  return { ...progress, ok: Object.values(areas).every(result => result.ok) };
}

// ── Glyphs ───────────────────────────────────────────────────────────────────
// Inline SVG, currentColor, no icon library and no ink outlines — the same
// rule kids-glass.css states for .kg-icon.

// The stops chip counts TASKS, not treasure. It carried a star glyph beside
// "Three stops to go" in the shipped build, which promised a star total that
// does not exist — books award none — and named a number nothing on the screen
// could confirm. A tick in a ring says "things finished" and claims nothing.
function DoneRingGlyph({ size = 17 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M7.8 12.3l2.9 2.9 5.5-5.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
    </svg>
  );
}

function SpeakerGlyph({ size = 30 }) {
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

function DoorIcon({ name }) {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-kg-icon={name}>
      <path d={STUDENT_RAIL_ICON_PATHS[name] || STUDENT_RAIL_ICON_PATHS.home} />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STUDENT_RAIL_ICON_PATHS.person} />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 4h9v2H6v12h7v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H10v-2h6.4l-2.2-2.2 1.4-1.4Z" />
    </svg>
  );
}

// LAUNCH RULE: when the app goes fully live, flip this to true so the arcade
// unlocks only after the day's 3 tasks. During the open beta it stays free.
const ARCADE_REQUIRES_DAILY_TASKS = false;

// Today's three stops. The spec's own labels — a child reads the picture, and
// the two-line label is there for the adult beside them. `kind` is the daily
// mission kind the state is read from, so the checklist and the mission are
// the same fact rendered twice, never two lists that can disagree.
const DAILY_STOPS = [
  { kind: "quest", label: "Adventure Map", art: "/images/home-sage/adventure-map.webp" },
  { kind: "book", label: "Read a book", art: "/images/home-sage/reading-library.webp" },
  { kind: "game", label: "Play a game", art: "/images/home-sage/arcade.webp" }
];

const STOP_STATE_LABEL = { done: "Done", next: "Up next", later: "After that" };

// THE HERO AND THE STRIP MUST NOT SAY THE SAME THING TWICE.
//
// The recommendation policy and the daily mission's first unfinished task pick
// from overlapping sets, so they COINCIDE often — the shipped build showed
// "Adventure Map / Stop 1 on the map" in the hero and "Adventure Map / Up next"
// in the strip directly beneath it: one instruction, printed twice, across the
// screen's two strongest surfaces.
//
// The fix is subtraction, not rewording. When the hero already owns the next
// stop, that stop LEAVES the strip and the strip becomes what is left of the
// day. The heading says so, and the count still reports all three, so nothing
// about the day is hidden — only the duplicate is.
function planTodaysStops({ missionStatus, readable, heroMissionKind }) {
  const done = kind => Boolean(missionStatus.done[kind]);
  const doneCount = DAILY_STOPS.filter(stop => done(stop.kind)).length;
  const nextStop = DAILY_STOPS.find(stop => !done(stop.kind));
  const heroOwnsNext = Boolean(
    heroMissionKind && nextStop && nextStop.kind === heroMissionKind
  );
  const shown = heroOwnsNext
    ? DAILY_STOPS.filter(stop => stop.kind !== heroMissionKind)
    : DAILY_STOPS;
  const stillToDo = shown.filter(stop => !done(stop.kind)).length;
  const heading = !heroOwnsNext
    ? "Today’s three stops"
    : stillToDo === 2
      ? "Then two more today"
      : stillToDo === 1
        ? "Then one more today"
        : "Already done today";
  return {
    nextStop,
    heroOwnsNext,
    heading,
    // A read that failed is not a child who has done nothing, so the count only
    // speaks when the read worked.
    summary: readable ? `${doneCount} of 3 done` : "",
    stops: shown.map(stop => ({
      ...stop,
      state: done(stop.kind)
        ? "done"
        : !heroOwnsNext && nextStop?.kind === stop.kind ? "next" : "later"
    }))
  };
}

// How many games the Arcade really holds. The mock says twelve; the repo's
// arcade-tagged list is the truth, so the doorway counts it rather than
// repeating a placeholder.
//
// Counted THROUGH the sample filter, or the doorway lies to the one visitor
// most likely to be counting. On the anonymous try-out the arcade holds a
// handful of games; a tile promising eleven and delivering four is a worse
// first impression than a tile that says four. `filterSample` returns the same
// array untouched for every full-content session, so this is a no-op for
// everybody else.
function arcadeGameCount() {
  const arcadeGames = GAME_LIST.filter(game => (game.surfaces || []).includes("arcade") && !game.hidden);
  return filterSample("games", GAME_LIST)
    .filter(game => arcadeGames.includes(game)).length;
}

// THE EXACT STOP the hero is continuing, from real progress. Every branch
// names a real source; the three activities that have no single "stop" to name
// say something true and general rather than inventing one.
function heroStopLine({ activityId, progress, mission }) {
  if (activityId === "sound-seekers") {
    const index = currentStopIndex(progress.soundSeekers);
    const stop = stopAtIndex(index);
    return stop ? `Stop ${index} — ${stop.name}` : "";
  }
  if (activityId === "adventure-map") {
    const playable = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
    const cycle = playable.find(
      item => !(Number(progress.adventureMap?.cycles?.[item.id]?.stars) > 0)
    ) || playable[0];
    return cycle ? `Stop ${cycle.cycleNumber} on the map` : "";
  }
  if (activityId === "reading-library") {
    return mission.book?.title ? `Your book — ${mission.book.title}` : "";
  }
  if (activityId === "arcade") {
    return mission.game?.title ? `Your game — ${mission.game.title}` : "";
  }
  if (activityId === "phonics-learning") return "Letters and sounds";
  if (activityId === "story-quests") return "A story you choose";
  if (activityId === "my-hollow") return "Your own place";
  return "";
}

export function StudentHomePage({
  studentName,
  progressScopeKey = "default",
  onOpenPhonicsLearn,
  onOpenArcade,
  onOpenSkillsBlockQuest,
  onOpenSoundSeekers,
  onOpenStoryQuests,
  onOpenGuidedReading,
  // The publication blocklist. The mission's book tile deep-links to a book by
  // id, so it needs the same filter the library shelf uses — otherwise a book
  // an admin had explicitly pulled could still be the advertised book of the day.
  quarantinedBookIds,
  onOpenRewards,
  onOpenSoundKeys,
  onLogout,
  logoutLabel = "Sign out",
  logoutAriaLabel = "Log out"
}) {
  // The home page re-mounts on every visit, so reading once at mount keeps
  // the mission state fresh after each activity.
  const [status] = useState(() => getMissionStatus(progressScopeKey));
  const mission = useMemo(
    () => buildDailyMission(progressScopeKey, quarantinedBookIds),
    [progressScopeKey, quarantinedBookIds]
  );
  const [celebration, setCelebration] = useState(null);
  const [companion, setCompanionState] = useState(() => getCompanion(progressScopeKey));
  const [guideChoiceReady, setGuideChoiceReady] = useState(() => Boolean(getCompanion(progressScopeKey)));
  const [speechStatus, setSpeechStatus] = useState("");
  // Cloud progress hydrates asynchronously AFTER this page mounts. Until it
  // lands, treasury/ledger are empty and the wallet shows the welcome-gift
  // default (100). Bumping this tick on the hydration event recomputes the
  // wallet with real earnings/spending — fixes "100 coins on load, 9 after the
  // Market, then 9 everywhere".
  const [hydrationTick, setHydrationTick] = useState(0);
  const [freshCoins, setFreshCoins] = useState(() => {
    const t = computeTreasury(progressScopeKey);
    const h = computeHollow(loadHollowLedger(progressScopeKey), t.breakdown);
    return freshSpendableCoinCount(
      h.coins,
      coinsSinceLastVisit(progressScopeKey, h.coinsEarnedTotal)
    );
  });
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    warmStudentAssets(worldForScope(progressScopeKey));
  }, [progressScopeKey]);

  // When cloud progress finishes hydrating, recompute the screen so the counts
  // are correct from the first Home view (not just after opening Market).
  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      setCompanionState(getCompanion(progressScopeKey));
      setGuideChoiceReady(true);
      setHydrationTick(tick => tick + 1);
      const treasury = computeTreasury(progressScopeKey);
      const hollow = computeHollow(loadHollowLedger(progressScopeKey), treasury.breakdown);
      setFreshCoins(freshSpendableCoinCount(
        hollow.coins,
        coinsSinceLastVisit(progressScopeKey, hollow.coinsEarnedTotal)
      ));
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    window.addEventListener("lp-progress-updated", handleHydrated);
    return () => {
      window.removeEventListener("lp-progress-hydrated", handleHydrated);
      window.removeEventListener("lp-progress-updated", handleHydrated);
    };
  }, [progressScopeKey]);

  // A returning child's profile may arrive from the cloud after Home mounts.
  // Waiting for that read prevents the first-choice panel flashing on every
  // login. Offline/new children still reach it after a short bounded wait.
  useEffect(() => {
    if (companion || guideChoiceReady) return undefined;
    const timer = window.setTimeout(() => setGuideChoiceReady(true), 3500);
    return () => window.clearTimeout(timer);
  }, [companion, guideChoiceReady]);

  useEffect(() => {
    const stepKind = status.uncelebratedStep;
    const type = stepKind ? "step" : status.needsCelebration ? "mission" : "";
    if (!type) return undefined;
    const timer = window.setTimeout(() => {
      setCelebration({ type, kind: stepKind || "" });
      playCelebrationFanfare();
      if (stepKind) markMissionStepCelebrated(progressScopeKey, stepKind);
      else markMissionCelebrated(progressScopeKey);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [progressScopeKey, status.needsCelebration, status.uncelebratedStep]);

  function openArcade(gameId = "") {
    try {
      if (gameId) window.localStorage.setItem("lp-open-game", gameId);
      else window.localStorage.setItem("lp-open-arcade", "true");
    } catch { /* best effort */ }
    (onOpenArcade || onOpenPhonicsLearn)?.();
  }

  const missionTargets = {
    quest: onOpenSkillsBlockQuest,
    book: () => onOpenGuidedReading?.(mission.book?.bookId || ""),
    game: () => openArcade(mission.game?.gameId || "")
  };

  function closeCelebration() {
    if (celebration?.type === "step" && status.missionComplete && status.needsCelebration) {
      setCelebration({ type: "mission", kind: "" });
      playCelebrationFanfare();
      markMissionCelebrated(progressScopeKey);
      return;
    }
    setCelebration(null);
  }

  // Tap-to-hear. The old rail carried a speaker beside every destination; the
  // redesign has two, so each one reads the whole region it heads rather than
  // one label — a pre-reader still gets every name spoken.
  function hear(text) {
    const spoken = speakStudentRailLabel(text, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  const arcadeLocked = ARCADE_REQUIRES_DAILY_TASKS && !status.missionComplete;
  const railActions = {
    sounds: onOpenSoundSeekers,
    phonics: onOpenPhonicsLearn,
    map: onOpenSkillsBlockQuest,
    books: onOpenGuidedReading ? () => onOpenGuidedReading("") : null,
    stories: onOpenStoryQuests,
    arcade: arcadeLocked ? null : () => openArcade(),
    hollow: onOpenRewards
  };
  const homeProgress = useMemo(() => {
    void hydrationTick;
    return readStudentHomeProgress(progressScopeKey);
  }, [progressScopeKey, hydrationTick]);
  const reducedChoiceMode = useMemo(() => {
    void hydrationTick;
    return Boolean(loadStudentProfile(progressScopeKey).reducedChoiceMode);
  }, [progressScopeKey, hydrationTick]);
  const activities = [
    {
      id: "sound-seekers",
      available: Boolean(onOpenSoundSeekers),
      onClick: onOpenSoundSeekers,
      art: "/images/home-sage/sound-seekers.webp",
      title: "The Sound Trail"
    },
    {
      id: "phonics-learning",
      available: Boolean(onOpenPhonicsLearn),
      onClick: onOpenPhonicsLearn,
      art: "/images/home-sage/phonics.webp",
      title: "Letters"
    },
    {
      id: "adventure-map",
      missionKind: "quest",
      available: Boolean(onOpenSkillsBlockQuest),
      onClick: onOpenSkillsBlockQuest,
      art: "/images/home-sage/adventure-map.webp",
      title: "Adventure Map"
    },
    {
      id: "arcade",
      missionKind: "game",
      available: Boolean(onOpenArcade || onOpenPhonicsLearn),
      onClick: () => { if (!arcadeLocked) openArcade(); },
      art: "/images/home-sage/arcade.webp",
      title: "Arcade",
      locked: arcadeLocked
    },
    {
      id: "story-quests",
      available: Boolean(onOpenStoryQuests),
      onClick: onOpenStoryQuests,
      art: "/images/home-sage/story-quests.webp",
      title: "Story Quests"
    },
    {
      id: "reading-library",
      missionKind: "book",
      available: Boolean(onOpenGuidedReading),
      onClick: () => onOpenGuidedReading?.(""),
      art: "/images/home-sage/reading-library.webp",
      title: "Books"
    },
    {
      id: "my-hollow",
      available: Boolean(onOpenRewards),
      onClick: onOpenRewards,
      art: "/images/home-sage/my-hollow.webp",
      title: "My Hollow"
    }
  ];
  const statefulActivities = activities.map(activity => ({
    ...activity,
    cardState: buildStudentHomeCardState(activity.id, homeProgress)
  }));
  // The SAME policy that chose the old hero chooses this one. Its unit tests
  // (studentHomeRecommendationPolicy) still pin the rule.
  const recommendation = selectStudentHomeRecommendation({
    activities: statefulActivities,
    missionStatus: status
  });
  const primary = recommendation.primary;
  const continuation = buildStudentHomeContinuation({
    activity: primary,
    missionStatus: status,
    soundSeekersProgress: homeProgress.soundSeekers
  });
  const primaryMissionAction = primary?.missionKind ? missionTargets[primary.missionKind] : null;
  const startPrimary = primaryMissionAction || primary?.onClick;
  // A stop we could not read is NOT stop one, and "2 tasks left today" derived
  // from an unreadable checklist is a claim about the child produced by a
  // storage error. Both fall back to something true; Play still works, because
  // navigating somewhere is safe whatever the read did.
  const heroStop = !homeProgress.ok
    ? "We could not find your last stop."
    : primary ? heroStopLine({ activityId: primary.id, progress: homeProgress, mission }) : "";
  const playLabel = homeProgress.ok ? continuation.label : "Play";
  const world = worldForScope(progressScopeKey);

  // The six doorways, in the spec's order. Ids are the rail destination ids so
  // reduced-choice mode keeps working through the SAME policy helper the rail
  // used — a teacher setting outlives a layout.
  const doorways = [
    { id: "map", title: "Adventure Map", note: "Win stars", icon: "map", tint: "var(--kg-tint-map)", art: "/images/home-sage/adventure-map.webp" },
    { id: "books", title: "Books", note: "Real books", icon: "book", tint: "var(--kg-tint-books)", art: "/images/home-sage/reading-library.webp" },
    { id: "stories", title: "Story Quests", note: "You choose", icon: "story", tint: "var(--kg-tint-stories)", art: "/images/home-sage/story-quests.webp" },
    { id: "arcade", title: "Arcade", note: `${arcadeGameCount()} games`, icon: "arcade", tint: "var(--kg-tint-arcade)", art: "/images/home-sage/arcade.webp" },
    { id: "phonics", title: "Letters", note: "Sounds and writing", icon: "phonics", tint: "var(--kg-tint-letters)", art: "/images/home-sage/phonics.webp" },
    { id: "hollow", title: "My Hollow", note: "Make it yours", icon: "hollow", tint: "var(--kg-tint-hollow)", art: "/images/home-sage/my-hollow.webp" }
  ].map(door => ({
    ...door,
    go: door.id === "arcade" && arcadeLocked ? () => {} : railActions[door.id],
    locked: door.id === "arcade" && arcadeLocked,
    cardState: statefulActivities.find(activity => (
      activity.id === (door.id === "map"
        ? "adventure-map"
        : door.id === "books"
          ? "reading-library"
          : door.id === "phonics"
            ? "phonics-learning"
            : door.id === "stories"
              ? "story-quests"
              : door.id === "hollow" ? "my-hollow" : "arcade")
    ))?.cardState
  }));
  const doors = selectStudentRailItems(doorways, { active: "home", reducedChoiceMode });
  // "Icons only" is a real preference slot on the student profile, read here so
  // the doorway notes can be hidden for a pre-reader. Nothing writes it yet —
  // no teacher control ships for it — so it is off for every child today.
  const iconsOnly = useMemo(() => {
    void hydrationTick;
    return loadStudentProfile(progressScopeKey).doorLabels === "Icons only";
  }, [progressScopeKey, hydrationTick]);

  // The strip, minus whatever the hero already says. See planTodaysStops.
  const plan = planTodaysStops({
    missionStatus: status,
    readable: homeProgress.ok,
    heroMissionKind: primary?.missionKind || ""
  });
  const nextStop = plan.nextStop;

  function goToTab(tabId) {
    setAccountOpen(false);
    const action = {
      sounds: railActions.sounds,
      books: railActions.books,
      games: railActions.arcade,
      hollow: railActions.hollow
    }[tabId];
    action?.();
  }

  const overlays = (
    <>
      {accountOpen && (
        <div className="kg-home-menu kg-glass kg-glass--strong" role="menu">
          <span className="kg-home-brand" role="img" aria-label={CHILD_BRAND.endorsedName}>
            <img src={CHILD_BRAND.markPath} alt="" onError={hideOnError} />
            <span aria-hidden="true">
              <strong>Little Literacy</strong>
              Guides
            </span>
          </span>
          <button
            className="kg-home-menu-item"
            type="button"
            role="menuitem"
            onClick={() => { setAccountOpen(false); onOpenRewards?.(); }}
          >
            <PersonIcon />My Little Literacy Guide
          </button>
          <button
            className="kg-home-menu-item"
            type="button"
            role="menuitem"
            onClick={onLogout}
            aria-label={logoutAriaLabel}
          >
            <SignOutIcon />{logoutLabel}
          </button>
        </div>
      )}

      {freshCoins > 0 && (
        <div className="kid-reward-toast" role="status">
          <span className="kid-reward-toast-icon" aria-hidden="true"><CoinIcon size={30} /></span>
          <div>
            <strong>You earned {freshCoins} coin{freshCoins === 1 ? "" : "s"}!</strong>
            <small>Spend them at the Market in your Hollow</small>
          </div>
          <button className="kid-den-button" type="button" onClick={onOpenRewards}>Go spend!</button>
          <button className="kid-reward-toast-close" type="button" aria-label="Close" onClick={() => setFreshCoins(0)}>×</button>
        </div>
      )}

      {guideChoiceReady && !companion && (
        <div className="companion-picker" role="dialog" aria-label="Choose your Little Literacy Guide">
          <div className="companion-picker-card">
            <h2>Choose your Little Literacy Guide</h2>
            <p>Pick a character from one of your books. Your guide stays with you every day.</p>
            <div className="companion-grid">
              {COMPANIONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={companion?.id === item.id ? "active" : ""}
                  onClick={() => {
                    setCompanion(progressScopeKey, item.id);
                    setCompanionState(item);
                  }}
                >
                  <img src={item.image} alt="" loading="lazy" onError={placeholderOnError} />
                  <span>{item.name}</span>
                  {item.series && <em className="companion-series">{item.series}</em>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div
          className="student-mission-celebrate"
          role="dialog"
          aria-modal="true"
          aria-label={celebration.type === "step" ? "One stop done" : "All three stops done"}
        >
          <ConfettiCelebration show />
          <div className="student-mission-celebrate-card">
            <img src="/images/learn-games/phinny-cheering.webp" alt="" onError={hideOnError} />
            <h2>{celebration.type === "step" ? "Nice work!" : "All three done!"}</h2>
            {celebration.type === "step" ? (
              <p>
                {nextStop
                  ? `Next up: ${nextStop.label}.`
                  : "That was the last one for today."}
              </p>
            ) : (
              <p>Great work today. See you tomorrow!</p>
            )}
            <button className="main-button" type="button" onClick={closeCelebration}>
              {celebration.type === "step"
                ? status.missionComplete ? "See them all done" : "See what’s next"
                : "Keep exploring"}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="home"
      onNavigate={goToTab}
      onHome={() => setAccountOpen(false)}
      onGrownUps={() => setAccountOpen(open => !open)}
    >
      <div
        className="kg-screen kg-screen--home kg-home"
        data-child-surface="student-home"
        data-recommendation-policy={recommendation.policyId}
        data-recommendation-version={recommendation.policyVersion}
        data-recommendation-source={recommendation.source}
      >
        {/* a. CONTINUE HERO — the one next action.

            THE BACKDROP IS THE CLEAN ONE, ON PURPOSE. This used to paint
            world.banner (pals/{world}-panorama.webp), which ALREADY has a
            rabbit and a hedgehog painted into it, and then stood a third
            character — world.point, a second rabbit — on top of them. Two
            rabbits in one illustration is a compositing accident, not a scene.
            world.backdrop is the character-free plate from public/images/
            backdrops/, so the placed pal is the only creature in the frame and
            the hero reads as one picture. Pair a placed pal with a clean plate,
            or use a populated plate alone — never both. */}
        <section
          className="kg-home-hero kg-scrim kg-scrim--hero"
          aria-labelledby="kg-home-hero-title"
        >
          <img
            className="kg-home-hero-art"
            src={world.backdrop}
            alt=""
            loading="eager"
            decoding="async"
            onError={hideOnError}
          />
          <div className="kg-home-hero-body kg-on-art">
            <div className="kg-home-hero-copy">
              <span
                className="kg-pill kg-eyebrow kg-glass-light kg-glass-light--quiet kg-home-eyebrow"
                data-child-instruction=""
              >
                Carry on where you stopped
              </span>
              <h1 className="kg-hero-title kg-home-hero-title" id="kg-home-hero-title" data-child-title="">
                {primary ? primary.title : "Choose a place to go"}
              </h1>
              <p className="kg-body kg-home-hero-stop">
                {primary ? heroStop : recommendation.childReason}
              </p>
              <div className="kg-home-hero-actions">
                {primary && (
                  <button
                    type="button"
                    className="kg-button kg-button--lg kg-glass-accent kg-home-play"
                    onClick={startPrimary}
                    aria-label={playLabel}
                    data-child-primary=""
                    data-child-emphasis="primary"
                    data-home-priority="primary"
                    data-recommendation-source={recommendation.source}
                    data-learning-state={primary.cardState?.label || "New"}
                    data-progress-marker={primary.cardState?.progressText || undefined}
                    data-continuation-activity={primary.id}
                    data-continuation-goal={continuation.goal}
                    data-continuation-remaining={continuation.remaining ?? undefined}
                    data-mission-primary-kind={primary.missionKind || undefined}
                  >
                    <PlayGlyph />
                    <span data-child-emphasis-cue="">Play</span>
                  </button>
                )}
                <button
                  type="button"
                  className="kg-speaker kg-speaker--lg kg-glass-light kg-home-hear-hero"
                  aria-label="Hear this"
                  onClick={() => hear(
                    primary
                      ? `Carry on where you stopped. ${primary.title}. ${heroStop}`
                      : recommendation.childReason
                  )}
                >
                  <SpeakerGlyph />
                </button>
              </div>
            </div>
            <span className="kg-home-guide" aria-label={companion ? `${companion.name}, your Little Literacy Guide` : "Choose your Little Literacy Guide"}>
              <span className="kg-home-guide-photo">
                {companion
                  ? <img src={companion.image} alt="" onError={hideOnError} />
                  : <PersonIcon />}
              </span>
              <span className="kg-home-guide-name kg-glass-dark">
                <small>My Little Literacy Guide</small>
                <strong>{companion?.name || "Choose a guide"}</strong>
              </span>
            </span>
          </div>
        </section>

        {/* b. THE REST OF TODAY — a checklist, not three more buttons, and
            never a second copy of the hero's instruction (see planTodaysStops). */}
        <section
          className="kg-home-stops kg-glass kg-glass--strong"
          aria-labelledby="kg-home-stops-title"
          data-child-progress=""
          data-mission-next-kind={nextStop?.kind || "complete"}
          data-mission-hero-owns-next={plan.heroOwnsNext ? "true" : "false"}
          data-read-state={homeProgress.ok ? "ready" : "unreadable"}
        >
          <div className="kg-home-stops-head">
            <h2 className="kg-section-title" id="kg-home-stops-title">{plan.heading}</h2>
            {plan.summary && (
              <span className="kg-home-stops-count">
                <DoneRingGlyph />
                {plan.summary}
              </span>
            )}
          </div>
          {homeProgress.ok ? (
            /* --kg-stop-count belongs on the BODY, not on the <ol>: the dashed
               connector is a sibling of the list, so a value set on the list
               never reaches it and the track silently anchors to the 3-stop
               fallback while only two markers are drawn. */
            <div
              className="kg-home-stops-body"
              style={{ "--kg-stop-count": String(plan.stops.length) }}
            >
              <span className="kg-home-stops-track" aria-hidden="true" />
              <ol className="kg-home-stops-row">
                {plan.stops.map(stop => (
                  <li
                    key={stop.kind}
                    className="kg-home-stop"
                    data-mission-step={stop.kind}
                    data-mission-state={stop.state}
                    aria-current={stop.state === "next" ? "step" : undefined}
                  >
                    <span className="kg-home-stop-marker">
                      <img src={stop.art} alt="" loading="eager" onError={placeholderOnError} />
                      <span className="kg-home-stop-veil" aria-hidden="true">
                        {stop.state === "done" ? "✓" : ""}
                      </span>
                    </span>
                    <span className="kg-home-stop-label">
                      <strong>{stop.label}</strong>
                      <small>{STOP_STATE_LABEL[stop.state]}</small>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="kg-body kg-home-stops-unread" role="status">
              We could not open today&rsquo;s three stops. Try again soon.
            </p>
          )}
        </section>

        {/* c. OR GO ANYWHERE YOU LIKE — six equal, quiet doorways. */}
        <section className="kg-home-explore" aria-labelledby="kg-home-explore-title">
          <div className="kg-home-explore-head">
            <h2 className="kg-section-title" id="kg-home-explore-title">Or go anywhere you like</h2>
            <button
              type="button"
              className="kg-speaker kg-glass"
              aria-label="Hear this"
              onClick={() => hear(
                `Or go anywhere you like. ${doors.map(door => door.title).join(". ")}.`
              )}
            >
              <SpeakerGlyph size={22} />
            </button>
          </div>
          <div
            className="kg-home-doors"
            data-child-choices=""
            data-choice-mode={reducedChoiceMode ? "reduced" : "full"}
            style={{ "--kg-door-count": String(doors.length) }}
          >
            {/* The tint is the CARD's now, not just a 32px chip's. Six pale
                spec tints across six white cards is what turns a correct-but-
                grey row into a row a five-year-old wants to touch, and it costs
                the emphasis budget nothing: no accent amber, no scale change,
                no motion, still data-child-emphasis="choice". */}
            {doors.map(door => (
              <button
                key={door.id}
                type="button"
                className="kg-home-door kg-glass kg-glass--tinted kg-glass--raised"
                onClick={door.locked ? undefined : door.go}
                aria-disabled={door.locked || undefined}
                data-rail-destination={door.id}
                data-home-priority="choice"
                data-child-emphasis="choice"
                data-learning-state={door.cardState?.label || "New"}
                style={{ "--kg-tint": door.tint }}
              >
                {/* The icon chip rides ON the artwork, not in the footer. In
                    the footer it ate a third of the card's text width, which is
                    why "Adventure Map" and "Story Quests" wrapped to two lines
                    and every card in the row ended up a different height with a
                    different amount of picture in it. */}
                <span className="kg-home-door-art kg-scrim kg-scrim--sheen">
                  <img src={door.art} alt="" loading="eager" decoding="async" onError={placeholderOnError} />
                  <span className="kg-home-door-chip">
                    <DoorIcon name={door.icon} />
                  </span>
                </span>
                <span className="kg-home-door-foot">
                  <span className="kg-home-door-text">
                    <strong className="kg-card-title">{door.title}</strong>
                    {!iconsOnly && (
                      <small className="kg-home-door-note">
                        {door.locked ? "Finish your three stops first" : door.note}
                      </small>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {onOpenSoundKeys && (
          <section className="kg-home-create" aria-labelledby="kg-home-soundkeys-title">
            <div className="kg-home-create-copy">
              <span className="kg-home-create-spark" aria-hidden="true">♫</span>
              <div>
                <h2 className="kg-section-title" id="kg-home-soundkeys-title">SoundKeys</h2>
                <p className="kg-body">Build words with sound keys.</p>
              </div>
            </div>
            <button type="button" className="kg-button kg-button--md kg-home-create-button" onClick={onOpenSoundKeys} data-child-emphasis="choice">
              Start SoundKeys
            </button>
          </section>
        )}

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>

      {overlays}
    </StudentGlassShell>
  );
}
