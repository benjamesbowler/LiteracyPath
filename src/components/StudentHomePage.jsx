// CHILD HOME: a compact continuation and eight visible picture destinations.
// Layout lives in src/styles/kids-home.css; shared chrome lives in kids-glass.css.
//
// WHAT THIS SCREEN IS FOR: answering "what do I do now?" in under a second,
// while leaving every destination one tap away.
//
// One policy-led continuation carries data-child-primary. The open gallery
// gives each destination a picture, a complete label and a separate replay
// target; reduced-choice mode remains an explicit teacher accessibility choice.
//
// WHICH ACTIVITY CONTINUES is not a new decision: it is
// selectStudentHomeRecommendation(), the same policy (and the same unit tests)
// that chose the earlier continuation. The redesign changed the presentation, not the
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

import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/skills-practice.css";
import { worldForScope } from "../utils/palWorlds.js";
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
import { warmStudentAssets } from "../utils/preloadAssets.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow, freshSpendableCoinCount } from "../utils/hollowEconomy.js";
import { loadHollowLedger, coinsSinceLastVisit } from "../utils/hollowState.js";
import { CHILD_BRAND } from "../data/childBrand.js";
import {
  STUDENT_HOME_ACTIVITY_TITLES,
  STUDENT_HOME_COPY,
  homeHeroInstruction
} from "../copy/studentNavigationCopy.js";
import { elSkillsBlockCycles } from "../data/elSkillsBlockCycles.js";
import { campaignHomeSummary } from '../features/soundSeekers/rounded/campaignSummary.js';
import { createCampaignStorage } from '../features/soundSeekers/v3/campaignStorage.js';
import { readElQuestLocalProgress } from "../utils/adventureMapLocalProgress.js";
import { CoinIcon } from "./shared/CurrencyIcons.jsx";
import { skillBlueprints } from "../content/blueprints/skillBlueprints.js";
import { TRANSFER_MISSIONS } from "../content/transfer/transferMissionRegistry.js";
import { TransferMissionRunner } from "./transfer/TransferMissionRunner.jsx";
import { readTransferMissionProgress } from "../policy/transferMissionPolicy.js";
import { selectTransferMission } from "../utils/transfer/selectTransferMission.js";
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
import ChildHomeMusicControl from "./ChildHomeMusicControl.jsx";
import {
  StudentHelpReminder,
  StudentWelcomeGuide
} from "./StudentWelcomeGuide.jsx";
import { ChildRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { STUDENT_NAVIGATION_ART } from "../policy/studentTabBar.js";
import { localProgressStorageKey } from "../utils/progressKeys.js";
import {
  beginStudentWelcomeVisit,
  dismissStudentWelcomePrompt
} from "../utils/studentWelcomeGuide.js";

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

function visibleDoorState(cardState) {
  return cardState?.label && cardState.label !== "New" ? cardState.label : "";
}

// A READ THAT FAILED IS NOT AN EMPTY READ.
//
// The old helper swallowed a malformed record and returned {}, which the UI
// then rendered as "nothing done yet" — a claim about the child, produced by a
// storage error. `ok` travels with the value so the screen can say "we could
// not load this" instead.
function readJsonArea(area, scopeKey) {
  if (area === "el_quest") return readElQuestLocalProgress(scopeKey);
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
  let campaign;
  try { const saved = createCampaignStorage({ storage: window.localStorage }).loadCampaignProgress(scopeKey); campaign = { ok: saved.ok, value: saved.progress || {} }; }
  catch { campaign = { ok: false, value: {} }; }
  const areas = {
    soundSeekers: campaign,
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

function PlayGlyph() {
  return <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" /></svg>;
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

// THE EXACT STOP the hero is continuing, from real progress. Every branch
// names a real source; the three activities that have no single "stop" to name
// say something true and general rather than inventing one.
function heroStopLine({ activityId, progress, mission }) {
  if (activityId === "sound-seekers") {
    const summary = campaignHomeSummary(progress.soundSeekers);
    return summary.next?.label || summary.stageName || '';
  }
  if (activityId === "adventure-map") {
    const playable = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
    const cycle = playable.find(
      item => !(Number(progress.adventureMap?.cycles?.[item.id]?.stars) > 0)
    ) || playable[0];
    return cycle ? STUDENT_HOME_COPY.mapStop(cycle.cycleNumber) : "";
  }
  if (activityId === "reading-library") {
    return mission.book?.title ? STUDENT_HOME_COPY.bookStop(mission.book.title) : "";
  }
  if (activityId === "arcade") {
    return mission.game?.title ? STUDENT_HOME_COPY.gameStop(mission.game.title) : "";
  }
  if (activityId === "phonics-learning") return STUDENT_HOME_COPY.phonicsStop;
  if (activityId === "story-quests") return STUDENT_HOME_COPY.storiesStop;
  if (activityId === "my-hollow") return STUDENT_HOME_COPY.hollowStop;
  return "";
}

export function StudentHomePage({
  studentName,
  progressScopeKey = "default",
  onOpenPhonicsLearn,
  onOpenWords,
  onOpenArcade,
  onOpenSkillsBlockQuest,
  onOpenSkillsPractice,
  onOpenSoundSeekers,
  onOpenStoryQuests,
  onOpenGuidedReading,
  // The approval allowlist. The mission deep-links by id, so it must use the
  // same fail-closed publication set as the library shelf.
  quarantinedBookIds,
  taughtTargetKeys = [],
  onOpenRewards,
  onLogout,
  speakText,
  studentGuideEnabled = false,
  studentGuideAutoEnabled = studentGuideEnabled,
  studentGuideRequested = false,
  studentGuideVisitKey = "",
  onStudentGuideRequestHandled,
  logoutLabel = "Sign out",
  logoutAriaLabel = "Log out"
}) {
  // The home page re-mounts on every visit, so reading once at mount keeps
  // the mission state fresh after each activity.
  const [status, setStatus] = useState(() => getMissionStatus(progressScopeKey));
  const mission = useMemo(
    () => buildDailyMission(progressScopeKey, quarantinedBookIds),
    [progressScopeKey, quarantinedBookIds]
  );
  const [celebration, setCelebration] = useState(null);
  const [companion, setCompanionState] = useState(() => getCompanion(progressScopeKey));
  const [speechStatus, setSpeechStatus] = useState("");
  const [companionPickerOpen, setCompanionPickerOpen] = useState(false);
  const companionDialogRef = useRef(null);
  const companionTriggerRef = useRef(null);
  useEffect(() => {
    if (!companionPickerOpen) return undefined;
    const trigger = companionTriggerRef.current;
    companionDialogRef.current?.showModal();
    return () => trigger?.focus();
  }, [companionPickerOpen]);
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
  const [welcomeMode, setWelcomeMode] = useState(() => (
    studentGuideRequested ? "tour" : "none"
  ));
  const [transferProgress,setTransferProgress]=useState(()=>readTransferMissionProgress(progressScopeKey));
  const [openTransferMission,setOpenTransferMission]=useState(null);
  const transferMission=useMemo(()=>{
    const activeMission=TRANSFER_MISSIONS.find(candidate=>(
      candidate.id===transferProgress.active?.missionId
      && candidate.contentVersion===transferProgress.active?.contentVersion
      && candidate.review?.status==="approved"
    ));
    if(activeMission)return activeMission;
    const today=new Date().toISOString().slice(0,10);
    const supportedFormats=taughtTargetKeys.flatMap(key=>Object.values(skillBlueprints[key]?.formatsByLevel||{}).flat());
    const todaysOffers=transferProgress.offers.filter(offer=>String(offer.offeredAt||"").startsWith(today)).length;
    return selectTransferMission({candidateMissions:TRANSFER_MISSIONS,taughtTargetKeys,completedMissionIds:transferProgress.completed,supportedFormats,offeredToday:todaysOffers,recentContexts:transferProgress.offers.slice(-2).map(offer=>offer.context)});
  },[taughtTargetKeys,transferProgress]);

  useEffect(() => {
    return warmStudentAssets(worldForScope(progressScopeKey));
  }, [progressScopeKey]);

  useEffect(() => {
    if (!studentGuideRequested) return undefined;
    const timer = window.setTimeout(() => onStudentGuideRequestHandled?.(), 0);
    return () => window.clearTimeout(timer);
  }, [onStudentGuideRequestHandled, studentGuideRequested]);

  // Wait until the focus-session poll has confirmed that this is an ordinary
  // student login. That keeps onboarding from flashing over, or consuming a
  // visit during, a teacher-controlled locked session. The timer keeps state
  // changes outside the effect body and the storage helper makes StrictMode's
  // effect rehearsal idempotent.
  useEffect(() => {
    if (!studentGuideAutoEnabled || studentGuideRequested) return undefined;
    const timer = window.setTimeout(() => {
      const prompt = beginStudentWelcomeVisit({
        enabled: true,
        loginKey: studentGuideVisitKey,
        scopeKey: progressScopeKey
      });
      setWelcomeMode(current => current === "none" ? prompt.kind : current);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    progressScopeKey,
    studentGuideAutoEnabled,
    studentGuideRequested,
    studentGuideVisitKey
  ]);

  // When cloud progress finishes hydrating, recompute the screen so the counts
  // are correct from the first Home view (not just after opening Market).
  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      const savedCompanion = getCompanion(progressScopeKey);
      setCompanionState(savedCompanion);
      if (savedCompanion) setCompanionPickerOpen(false);
      setStatus(getMissionStatus(progressScopeKey));
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
  function hear(lines) {
    const spoken = speakStudentRailLabel(lines, window);
    setSpeechStatus(spoken ? "Reading it out." : "Speech is unavailable.");
  }

  function hearWelcomeGuide(text) {
    if (!speakText) return;
    setSpeechStatus("Reading it out.");
    try {
      Promise.resolve(speakText(text, "", { allowBrowserFallback: true }))
        .catch(() => setSpeechStatus("Speech is unavailable."));
    } catch {
      setSpeechStatus("Speech is unavailable.");
    }
  }

  function openWelcomeGuide() {
    setAccountOpen(false);
    setWelcomeMode("tour");
  }

  function closeWelcomePrompt() {
    dismissStudentWelcomePrompt({
      loginKey: studentGuideVisitKey,
      scopeKey: progressScopeKey
    });
    setWelcomeMode("none");
  }

  const arcadeLocked = ARCADE_REQUIRES_DAILY_TASKS && !status.missionComplete;
  const railActions = {
    sounds: onOpenSoundSeekers,
    phonics: onOpenPhonicsLearn,
    words: onOpenWords,
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
      title: STUDENT_HOME_ACTIVITY_TITLES["sound-seekers"]
    },
    {
      id: "phonics-learning",
      available: Boolean(onOpenPhonicsLearn),
      onClick: onOpenPhonicsLearn,
      art: "/images/home-sage/phonics.webp",
      title: STUDENT_HOME_ACTIVITY_TITLES["phonics-learning"]
    },
    {
      id: "adventure-map",
      missionKind: "quest",
      available: Boolean(onOpenSkillsBlockQuest),
      onClick: onOpenSkillsBlockQuest,
      art: "/images/home-sage/adventure-map.webp",
      title: STUDENT_HOME_ACTIVITY_TITLES["adventure-map"]
    },
    {
      id: "arcade",
      missionKind: "game",
      available: Boolean(onOpenArcade || onOpenPhonicsLearn),
      onClick: () => { if (!arcadeLocked) openArcade(); },
      art: "/images/home-sage/arcade.webp",
      title: STUDENT_HOME_ACTIVITY_TITLES.arcade,
      locked: arcadeLocked
    },
    {
      id: "story-quests",
      available: Boolean(onOpenStoryQuests),
      onClick: onOpenStoryQuests,
      art: "/images/home-sage/story-quests.webp",
      title: STUDENT_HOME_ACTIVITY_TITLES["story-quests"]
    },
    {
      id: "reading-library",
      missionKind: "book",
      available: Boolean(onOpenGuidedReading),
      onClick: () => onOpenGuidedReading?.(""),
      art: "/images/home-sage/reading-library.webp",
      title: STUDENT_HOME_ACTIVITY_TITLES["reading-library"]
    },
    {
      id: "my-hollow",
      available: Boolean(onOpenRewards),
      onClick: onOpenRewards,
      art: "/images/home-sage/my-hollow.webp",
      title: STUDENT_HOME_ACTIVITY_TITLES["my-hollow"]
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
    ? STUDENT_HOME_COPY.unreadableProgress
    : primary ? heroStopLine({ activityId: primary.id, progress: homeProgress, mission }) : "";
  const playLabel = homeProgress.ok ? continuation.label : "Play";
  const heroInstruction = homeHeroInstruction(primary?.cardState);

  // Every ordinary Home destination stays visible. Reduced-choice mode is a
  // learner preference; it deliberately keeps its existing smaller selection.
  const doorways = [
    { id: "map", activityId: "adventure-map", note: "Follow your adventure" },
    { id: "books", activityId: "reading-library", note: "Listen and read" },
    { id: "stories", activityId: "story-quests", note: "Choose a story" },
    { id: "arcade", activityId: "arcade", note: "Choose a game" },
    { id: "phonics", activityId: "phonics-learning", note: "Sounds and writing" },
    { id: "words", activityId: "word-workshop", note: "Build and blend words" },
    { id: "sounds", activityId: "sound-seekers", note: "Help your friends" },
    { id: "hollow", activityId: "my-hollow", note: "Make it yours" }
  ].map(door => ({
    ...door,
    title: STUDENT_HOME_ACTIVITY_TITLES[door.activityId],
    go: door.id === "arcade" && arcadeLocked ? () => {} : railActions[door.id],
    locked: door.id === "arcade" && arcadeLocked,
    cardState: statefulActivities.find(activity => activity.id === door.activityId)?.cardState
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

      {companionPickerOpen && (
        <dialog ref={companionDialogRef} className="companion-picker" aria-label="Choose your Little Literacy Guide" onClose={() => setCompanionPickerOpen(false)} onKeyDown={event => {
          if (event.key !== "Tab") return;
          const buttons = [...event.currentTarget.querySelectorAll("button:not(:disabled)")];
          const first = buttons[0], last = buttons.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
          <div className="companion-picker-card">
            <h2>Choose your Little Literacy Guide</h2>
            <p>Your guide stays with you every day.</p>
            <button type="button" autoFocus onClick={() => setCompanionPickerOpen(false)}>Back to Home</button>
            <div className="companion-grid">
              {COMPANIONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={companion?.id === item.id ? "active" : ""}
                  onClick={() => {
                    const savedCompanion = getCompanion(progressScopeKey);
                    if (savedCompanion) {
                      setCompanionState(savedCompanion);
                      setCompanionPickerOpen(false);
                      return;
                    }
                    setCompanion(progressScopeKey, item.id);
                    setCompanionState(item);
                    setCompanionPickerOpen(false);
                  }}
                >
                  <img src={item.image} alt="" loading="lazy" onError={placeholderOnError} />
                  <span>{item.name}</span>
                  {item.series && <em className="companion-series">{item.series}</em>}
                </button>
              ))}
            </div>
          </div>
        </dialog>
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

      {studentGuideEnabled && companion && !celebration && welcomeMode === "reminder" && (
        <StudentHelpReminder
          onDismiss={closeWelcomePrompt}
          onShowGuide={() => setWelcomeMode("tour")}
        />
      )}

      {studentGuideEnabled && companion && !celebration && welcomeMode === "tour" && (
        <StudentWelcomeGuide
          companion={companion}
          onClose={closeWelcomePrompt}
          onHear={speakText ? hearWelcomeGuide : undefined}
          studentName={studentName}
        />
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
      onHelp={studentGuideEnabled ? openWelcomeGuide : undefined}
      onGrownUps={() => setAccountOpen(open => !open)}
      headerActions={<ChildHomeMusicControl key={progressScopeKey} scopeKey={progressScopeKey} />}
    >
      <div
        className="kg-screen kg-screen--home kg-home"
        data-child-surface="student-home"
        data-recommendation-policy={recommendation.policyId}
        data-recommendation-version={recommendation.policyVersion}
        data-recommendation-source={recommendation.source}
      >
        <section className="kg-home-continue" aria-labelledby="kg-home-hero-title">
          <div className="kg-home-continue-copy">
            <span className="kg-home-eyebrow" data-child-instruction="" data-learning-state-label="">{heroInstruction}</span>
            <h1 id="kg-home-hero-title" data-child-title="">{primary ? primary.title : "Choose a place to go"}</h1>
            <p className="kg-home-hero-stop">{primary ? heroStop : recommendation.childReason}</p>
            <ChildRecommendationExplanation className="kg-home-recommendation-reason" reason={recommendation.childReason} surface="student-home" />
          </div>
          <div className="kg-home-hero-actions">
            {primary && <button type="button" className="kg-button kg-home-play" onClick={() => {
              if (!getCompanion(progressScopeKey)) setCompanionState(COMPANIONS.find(item => item.id === "fluff"));
              startPrimary?.();
            }} aria-label={playLabel} data-child-primary="" data-child-emphasis="primary" data-home-priority="primary"
              data-recommendation-source={recommendation.source} data-learning-state={primary.cardState?.label || "New"}
              data-progress-marker={primary.cardState?.progressText || undefined} data-continuation-activity={primary.id}
              data-continuation-goal={continuation.goal} data-continuation-remaining={continuation.remaining ?? undefined}
              data-mission-primary-kind={primary.missionKind || undefined}>
              <PlayGlyph /><span data-child-emphasis-cue="">{!companion ? "Play with Fluff" : primary.cardState?.label === "Continue" ? "Carry on" : "Play"}</span>
            </button>}
            <button type="button" className="kg-speaker kg-home-hear-hero" aria-label="Hear this" onClick={() => hear(primary
              ? [heroInstruction, primary.title, heroStop] : [recommendation.childReason])}><SpeakerGlyph /></button>
          </div>
        </section>
        <p className="kg-home-daily-progress" data-child-progress="" data-mission-next-kind={nextStop?.kind || "complete"}
          data-mission-hero-owns-next={plan.heroOwnsNext ? "true" : "false"} data-read-state={homeProgress.ok ? "ready" : "unreadable"}>
          {homeProgress.ok ? plan.summary : "We could not open today’s progress. Try again soon."}
        </p>
        <section className="kg-home-explore" aria-labelledby="kg-home-explore-title">
          <div className="kg-home-explore-head">
            <h2 id="kg-home-explore-title">Choose a place</h2>
            <button type="button" className="kg-speaker kg-home-explore-hear" aria-label="Hear the places" onClick={() => hear([
              "Or go anywhere you like.", ...doors.map(door => door.title)
            ])}><SpeakerGlyph size={22} /></button>
          </div>
          <div className="kg-home-doors" data-child-choices="" data-choice-mode={reducedChoiceMode ? "reduced" : "full"}
            data-home-destination-count={doors.length}>
            {doors.map(door => <div className="kg-home-door-wrap" key={door.id}>
              <button type="button" className="kg-home-door" onClick={door.locked ? undefined : door.go}
                aria-disabled={door.locked || undefined} data-rail-destination={door.id} data-home-priority="choice"
                data-child-emphasis="choice" data-learning-state={door.cardState?.label || "New"}
                data-progress-marker={door.cardState?.progressText || undefined}>
                <span className="kg-home-door-art" aria-hidden="true">
                  <span className={`kg-home-menu-object${door.id === "words" ? " kg-home-word-object" : door.id === "phonics" ? " kg-home-letter-object" : ""}`}>
                    <img src={STUDENT_NAVIGATION_ART[door.id]} alt="" loading="eager" />
                    {door.id === "words" && <span className="kg-home-word-glyphs"><span>c</span><span>a</span><span>t</span></span>}
                    {door.id === "phonics" && <span className="kg-home-letter-glyphs"><span>a</span><span>b</span><span>c</span></span>}
                  </span>
                </span>
                <span className="kg-home-door-foot"><strong className="kg-card-title">{door.title}</strong>{!iconsOnly && <small>{door.locked ? "Finish your three stops first" : door.note}</small>}
                  {visibleDoorState(door.cardState) && <small className="kg-home-door-state" data-learning-state-label="">{visibleDoorState(door.cardState)}</small>}
                </span>
              </button>
              <button type="button" className="kg-speaker kg-home-door-hear" aria-label={`Hear ${door.title}`} onClick={() => hear([door.title, door.note])}><SpeakerGlyph size={20} /></button>
            </div>)}
          </div>
          <div className="kg-home-optional-actions">
            {onOpenSkillsPractice && <button type="button" className="kg-home-guide-choice skills-practice-home-action" onClick={onOpenSkillsPractice}>
              <img src="/images/navigation/map-icon.webp" alt="" /><span>Skills trail</span>
            </button>}
            {transferMission && <button type="button" className="kg-home-guide-choice" onClick={() => setOpenTransferMission(transferMission)}>Try a new challenge</button>}
            {!companion && <button ref={companionTriggerRef} type="button" className="kg-home-guide-choice" onClick={() => setCompanionPickerOpen(true)}>Choose your Guide</button>}
          </div>
        </section>

        <span className="kg-speech" role="status" aria-live="polite">{speechStatus}</span>
      </div>
      {openTransferMission&&<TransferMissionRunner mission={openTransferMission} scopeKey={progressScopeKey} progress={transferProgress} onProgress={setTransferProgress} onComplete={setTransferProgress} onClose={()=>setOpenTransferMission(null)}/>}

      {overlays}
    </StudentGlassShell>
  );
}
