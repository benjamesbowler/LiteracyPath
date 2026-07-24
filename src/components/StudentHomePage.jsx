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
import { computeHollow } from "../utils/hollowEconomy.js";
import { loadHollowLedger, coinsSinceLastVisit } from "../utils/hollowState.js";
import { CHILD_BRAND } from "../data/childBrand.js";
import { CoinIcon } from "./shared/CurrencyIcons.jsx";
import {
  buildStudentHomeCardState,
  buildStudentHomeContinuation,
  selectStudentHomeRecommendation
} from "../policy/learningPolicy.js";
import { STUDENT_RAIL_DESTINATIONS } from "../policy/studentRailPolicy.js";
import StudentRailNav from "./StudentRailNav.jsx";
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

function readProgressArea(area, scopeKey) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(localProgressStorageKey(area, scopeKey)) || "{}"
    );
  } catch {
    return {};
  }
}

function readStudentHomeProgress(scopeKey) {
  return {
    soundSeekers: readProgressArea("phonics_quest", scopeKey),
    phonics: readProgressArea("phonics_letters", scopeKey),
    adventureMap: readProgressArea("el_quest", scopeKey),
    arcade: readProgressArea("learn_games", scopeKey),
    storyQuests: readProgressArea("story_quests", scopeKey),
    readingLibrary: readProgressArea("guided_reading", scopeKey),
    hollow: readProgressArea("hollow", scopeKey)
  };
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h9v2H6v12h7v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H10v-2h6.4l-2.2-2.2 1.4-1.4Z" />
    </svg>
  );
}

// LAUNCH RULE: when the app goes fully live, flip this to true so the arcade
// unlocks only after the day's 3 tasks. During the open beta it stays free.
const ARCADE_REQUIRES_DAILY_TASKS = false;

const MISSION_TILES = [
  { kind: "quest", label: "Adventure Map", art: "/images/learn-games/art/word-hopscotch.webp" },
  { kind: "book", label: "Reading Library", art: "/images/learn-games/home/home-reading-library.webp" },
  { kind: "game", label: "Arcade", art: "/images/learn-games/art/pop-the-word.webp" }
];

// ── the "sage" home skin ─────────────────────────────────────────────────────
// The default since 2026-07-15: a calmer shell around the same activities
// (see src/styles/home-sage.css and mockups/kids-home-chalkie-style.html).
// The older "comic" home screen and its account-menu "classic look" switch were
// removed on 2026-07-22 — sage is now the only home skin. Note: comic-theme.css
// stays imported in main.jsx as the shared style base the sage palette is
// layered on, so it is intentionally NOT deleted.

const SAGE_ICON_PATHS = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v9h13v-9",
  sound: "M4 19c4-1 5-4 5-7 0-3 2-6 6-6 3 0 5 2 5 5 0 5-4 9-10 9-2.5 0-4.5-.4-6-1Z",
  phonics: "M5 19h14M7 15 12 4l5 11M8.8 11.5h6.4",
  map: "M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2ZM9 4v14M15 6v14",
  arcade: "M4 8h16v10H4zM8 11v4M6 13h4M15 12h.01M18 14h.01",
  book: "M12 6c-2-1.6-4.5-2-8-2v14c3.5 0 6 .4 8 2 2-1.6 4.5-2 8-2V4c-3.5 0-6 .4-8 2ZM12 6v14",
  story: "m12 4 2 4.2 4.6.6-3.4 3.2.9 4.6L12 14.4l-4.1 2.2.9-4.6L5.4 8.8 10 8.2Z",
  hollow: "M12 3 4 9v11h16V9l-8-6ZM9.5 20v-6h5v6",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c1.5-3.5 4.2-5 7.5-5s6 1.5 7.5 5",
  play: "M7 5.5v13l11-6.5-11-6.5Z",
  swap: "M7 8h10l-3-3M17 16H7l3 3"
};

function SageIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={SAGE_ICON_PATHS[name] || SAGE_ICON_PATHS.home} />
    </svg>
  );
}

// Sage card art lives in /images/home-sage/ (generated via
// tools/image-jobs/home-sage-cards.json — calm palette, house prompt rules).
// Until a file is generated, the card falls back to the comic-era art rather
// than showing an empty tile, so the skin never depends on the image batch
// having run. The comic skin's own files are never overwritten.
function SageCard({
  hero = false,
  art,
  fallbackArt,
  title,
  fillChip,
  lineChips = [],
  foot,
  footNote,
  locked = false,
  lockedLabel,
  onClick,
  priority,
  recommendationSource,
  recommendationReason,
  cardState,
  continuation
}) {
  const [loadedArt, setLoadedArt] = useState("");
  const artReady = loadedArt === art;

  function artError(event) {
    const img = event.currentTarget;
    if (fallbackArt && img.dataset.fellBack !== "true") {
      img.dataset.fellBack = "true";
      img.src = fallbackArt;
      return;
    }
    placeholderOnError(event);
  }
  return (
    <button
      type="button"
      className={["hs-card", hero ? "is-hero" : "", locked ? "is-locked" : ""].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-disabled={locked || undefined}
      data-home-priority={priority}
      data-recommendation-source={recommendationSource || undefined}
      data-learning-state={cardState?.label || "New"}
      data-progress-marker={cardState?.progressText || undefined}
      data-child-primary={hero ? "" : undefined}
      data-child-emphasis={hero ? "primary" : "choice"}
      data-continuation-activity={hero ? continuation?.activityId : undefined}
      data-continuation-goal={hero ? continuation?.goal : undefined}
      data-continuation-remaining={hero ? continuation?.remaining ?? undefined : undefined}
      data-mission-primary-kind={hero ? continuation?.missionKind || undefined : undefined}
      aria-label={hero ? continuation?.label : undefined}
    >
      <span className="hs-thumb" aria-hidden="true" data-media-state={artReady ? "ready" : "loading"}>
        <img
          src={art}
          alt=""
          loading="eager"
          decoding="async"
          onError={artError}
          onLoad={() => setLoadedArt(art)}
        />
      </span>
      {hero && <span className="hs-card-kicker">Recommended next</span>}
      <h3>{title}</h3>
      {hero && continuation?.label && (
        <span className="hs-card-action" data-child-emphasis-cue="">
          <SageIcon name="play" />
          {continuation.label}
        </span>
      )}
      {recommendationReason && <span className="hs-card-reason">{recommendationReason}</span>}
      <span className="hs-card-state-row">
        <strong className={`hs-card-state is-${cardState?.tone || "new"}`}>
          {cardState?.label || "New"}
        </strong>
        {cardState?.progressText && (
          <small className="hs-card-progress">{cardState.progressText}</small>
        )}
      </span>
      <span className="hs-chips">
        {fillChip && <span className="hs-chip is-fill">{fillChip}</span>}
        {lineChips.map(chip => <span key={chip} className="hs-chip is-line">{chip}</span>)}
      </span>
      {!hero && (
        <>
          <hr />
          <span className="hs-foot">
            <span className="hs-mini"><SageIcon name={locked ? "arcade" : "play"} /></span>
            {locked && lockedLabel ? lockedLabel : foot}
            {footNote && !locked && <em>&nbsp;· {footNote}</em>}
          </span>
        </>
      )}
    </button>
  );
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
  onOpenRewards,
  onLogout,
  logoutLabel = "Sign out",
  logoutAriaLabel = "Log out"
}) {
  // The home page re-mounts on every visit, so reading once at mount keeps
  // the mission state fresh after each activity.
  const [status] = useState(() => getMissionStatus(progressScopeKey));
  const mission = useMemo(() => buildDailyMission(progressScopeKey), [progressScopeKey]);
  const [celebration, setCelebration] = useState(null);
  const [companion, setCompanionState] = useState(() => getCompanion(progressScopeKey));
  const [pickingCompanion, setPickingCompanion] = useState(false);
  // Cloud progress hydrates asynchronously AFTER this page mounts. Until it
  // lands, treasury/ledger are empty and the wallet shows the welcome-gift
  // default (100). Bumping this tick on the hydration event recomputes the
  // wallet with real earnings/spending — fixes "100 coins on load, 9 after the
  // Market, then 9 everywhere".
  const [hydrationTick, setHydrationTick] = useState(0);
  const treasury = useMemo(() => {
    void hydrationTick; // recompute when cloud progress hydrates (see effect below)
    return computeTreasury(progressScopeKey);
  }, [progressScopeKey, hydrationTick]);
  // Rewards V2: the wallet is derived earnings minus the stored spending ledger.
  const hollow = useMemo(() => computeHollow(loadHollowLedger(progressScopeKey), treasury.breakdown), [progressScopeKey, treasury]);
  const [freshCoins, setFreshCoins] = useState(() => {
    const t = computeTreasury(progressScopeKey);
    const h = computeHollow(loadHollowLedger(progressScopeKey), t.breakdown);
    return coinsSinceLastVisit(progressScopeKey, h.coinsEarnedTotal);
  });
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    warmStudentAssets(worldForScope(progressScopeKey));
  }, [progressScopeKey]);

  // When cloud progress finishes hydrating, recompute the wallet so the coin
  // count is correct from the first Home view (not just after opening Market).
  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      setHydrationTick(tick => tick + 1);
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
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
  const nextMission = MISSION_TILES.find(tile => !status.done[tile.kind]);
  const celebratedMissionTile = MISSION_TILES.find(tile => tile.kind === celebration?.kind);

  function closeCelebration() {
    if (celebration?.type === "step" && status.missionComplete && status.needsCelebration) {
      setCelebration({ type: "mission", kind: "" });
      playCelebrationFanfare();
      markMissionCelebrated(progressScopeKey);
      return;
    }
    setCelebration(null);
  }

  // Presentation-only overlays for the home screen.
  const overlays = (
    <>
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

      {(pickingCompanion || !companion) && (
        <div className="companion-picker" role="dialog" aria-label="Choose your companion">
          <div className="companion-picker-card">
            <h2>{companion ? "Change your companion" : "Choose your companion!"}</h2>
            <p>Your companion learns with you every day.</p>
            <div className="companion-grid">
              {COMPANIONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={companion?.id === item.id ? "active" : ""}
                  onClick={() => {
                    setCompanion(progressScopeKey, item.id);
                    setCompanionState(item);
                    setPickingCompanion(false);
                  }}
                >
                  <img src={item.image} alt="" loading="lazy" onError={placeholderOnError} />
                  <span>{item.name}</span>
                  {item.series && <em className="companion-series">{item.series}</em>}
                </button>
              ))}
            </div>
            {companion && (
              <button className="text-button" type="button" onClick={() => setPickingCompanion(false)}>
                Keep {companion.name}
              </button>
            )}
          </div>
        </div>
      )}

      {celebration && (
        <div
          className="student-mission-celebrate"
          role="dialog"
          aria-modal="true"
          aria-label={celebration.type === "step"
            ? `${celebratedMissionTile?.label || "Adventure"} step complete`
            : "Mission complete"}
        >
          <ConfettiCelebration show />
          <div className="student-mission-celebrate-card">
            <img src="/images/learn-games/phinny-cheering.webp" alt="" onError={hideOnError} />
            <h2>
              {celebration.type === "step"
                ? `${celebratedMissionTile?.label || "Adventure"} complete!`
                : "Mission complete!"}
            </h2>
            {celebration.type === "step" ? (
              <p>
                {nextMission
                  ? `Nice work. Next up: ${nextMission.label}.`
                  : "That was the final step in today’s adventure."}
              </p>
            ) : (
              <p>
                {status.streak > 1
                  ? `That's ${status.streak} school days in a row. See you tomorrow!`
                  : "Your streak starts today. See you tomorrow!"}
              </p>
            )}
            <button className="main-button" type="button" onClick={closeCelebration}>
              {celebration.type === "step"
                ? status.missionComplete ? "See mission complete" : "See what’s next"
                : "Keep exploring"}
            </button>
          </div>
        </div>
      )}
    </>
  );

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
  const sageNav = STUDENT_RAIL_DESTINATIONS
    .map(item => ({ ...item, go: railActions[item.id] }))
    .filter(item => item.go);
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
      fallbackArt: "/images/quest/meadow/sky.webp",
      title: "Sound Seekers",
      fillChip: "Adventure",
      lineChips: ["The Sound Trail"],
      foot: "Walk the trail",
      footNote: "your creature is waiting"
    },
    {
      id: "phonics-learning",
      available: Boolean(onOpenPhonicsLearn),
      onClick: onOpenPhonicsLearn,
      art: "/images/home-sage/phonics.webp",
      fallbackArt: "/images/learn-games/home/home-phonics.webp",
      title: "Phonics Learning",
      fillChip: "Practice",
      lineChips: ["Letters and sounds"],
      foot: "Build some words"
    },
    {
      id: "adventure-map",
      missionKind: "quest",
      available: Boolean(onOpenSkillsBlockQuest),
      onClick: onOpenSkillsBlockQuest,
      art: "/images/home-sage/adventure-map.webp",
      fallbackArt: "/images/learn-games/home/home-skills-quest.webp",
      title: "Adventure Map",
      fillChip: "Adventure",
      lineChips: ["Win stars"],
      foot: "Follow the path"
    },
    {
      id: "arcade",
      missionKind: "game",
      available: Boolean(onOpenArcade || onOpenPhonicsLearn),
      onClick: () => { if (!arcadeLocked) openArcade(); },
      art: "/images/home-sage/arcade.webp",
      fallbackArt: "/images/learn-games/home/home-arcade.webp",
      title: "Arcade",
      fillChip: "Games",
      lineChips: ["11 games"],
      foot: "Jump into a game",
      locked: arcadeLocked,
      lockedLabel: "Finish your 3 tasks to unlock"
    },
    {
      id: "story-quests",
      available: Boolean(onOpenStoryQuests),
      onClick: onOpenStoryQuests,
      art: "/images/home-sage/story-quests.webp",
      fallbackArt: "/images/learn-games/home/home-story-quests.webp",
      title: "Story Quests",
      fillChip: "Stories",
      lineChips: ["You choose"],
      foot: "Read and choose"
    },
    {
      id: "reading-library",
      missionKind: "book",
      available: Boolean(onOpenGuidedReading),
      onClick: () => onOpenGuidedReading?.(""),
      art: "/images/home-sage/reading-library.webp",
      fallbackArt: "/images/learn-games/home/home-reading-library.webp",
      title: "Reading Library",
      fillChip: "Read",
      lineChips: ["Real books"],
      foot: "Pick a book"
    },
    {
      id: "my-hollow",
      available: Boolean(onOpenRewards),
      onClick: onOpenRewards,
      art: "/images/home-sage/my-hollow.webp",
      fallbackArt: "/images/hollow/hollow-interior.webp",
      title: "My Hollow",
      fillChip: "Rewards",
      lineChips: ["Make it yours"],
      foot: "Visit your Hollow"
    }
  ];
  const statefulActivities = activities.map(activity => ({
    ...activity,
    cardState: buildStudentHomeCardState(activity.id, homeProgress)
  }));
  const recommendation = selectStudentHomeRecommendation({
    activities: statefulActivities,
    missionStatus: status
  });
  const continuation = buildStudentHomeContinuation({
    activity: recommendation.primary,
    missionStatus: status,
    soundSeekersProgress: homeProgress.soundSeekers
  });

  function renderActivity(activity, priority) {
    if (!activity) return null;
    const primaryMissionAction = priority === "primary" && activity.missionKind
      ? missionTargets[activity.missionKind]
      : null;
    return (
      <SageCard
        key={activity.id}
        {...activity}
        onClick={primaryMissionAction || activity.onClick}
        hero={priority === "primary"}
        priority={priority}
        recommendationSource={priority === "primary" ? recommendation.source : undefined}
        recommendationReason={priority === "primary" ? recommendation.childReason : undefined}
        continuation={priority === "primary"
          ? {
            ...continuation,
            activityId: recommendation.primary.id,
            missionKind: recommendation.primary.missionKind
          }
          : undefined}
      />
    );
  }

  return (
      <main
        className="lp-home-sage"
        data-recommendation-policy={recommendation.policyId}
        data-recommendation-version={recommendation.policyVersion}
        data-recommendation-source={recommendation.source}
        data-child-surface="student-home"
      >
        <aside className="hs-side">
          <span className="hs-avatar" aria-hidden="true">
            {companion
              ? <img src={companion.image} alt="" onError={hideOnError} />
              : <strong style={{ fontSize: 34, color: "var(--hs-ink)" }}>{String(studentName || "S").slice(0, 1).toUpperCase()}</strong>}
          </span>
          <span className="hs-name">{studentName || "Reader"}</span>
          <button className="hs-coins" type="button" onClick={onOpenRewards} aria-label={`${hollow.coins} coins. Open your Hollow.`}>
            <CoinIcon size={16} /> {hollow.coins}
          </button>

          <StudentRailNav
            active="home"
            nav={sageNav}
            reducedChoiceMode={reducedChoiceMode}
          />

          <span className="hs-side-spacer" />
        </aside>

        <div className="hs-main">
          <div className="hs-topbar">
            <span className="hs-logo" role="img" aria-label={CHILD_BRAND.endorsedName}>
              <img src={CHILD_BRAND.markPath} alt="" onError={hideOnError} />
              <span className="hs-logo-copy" aria-hidden="true">
                <strong>Little Literacy</strong>
                <span>Guides</span>
              </span>
            </span>
            <div className="hs-top-actions">
              <button
                className="hs-btn-ghost"
                type="button"
                aria-haspopup="true"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(value => !value)}
              >
                <SageIcon name="person" />Grown-ups
              </button>
              {accountOpen && (
                <div className="hs-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); setPickingCompanion(true); }}>
                    <SageIcon name="person" />Change companion
                  </button>
                  <button type="button" role="menuitem" onClick={onLogout} aria-label={logoutAriaLabel}>
                    <SignOutIcon />{logoutLabel}
                  </button>
                </div>
              )}
            </div>
          </div>

          <section className="hs-sheet" aria-label="Student learning areas">
            <div className="hs-sheet-head">
              <h1 data-child-title="">Hello, {studentName || "friend"}!</h1>
              <p className="hs-sub" data-child-instruction="">
                {status.missionComplete
                  ? "All three tasks done. Anything you like now!"
                  : "What shall we play today?"}
              </p>
            </div>

            <section
              className="hs-mission-main"
              aria-labelledby="hs-mission-heading"
              data-mission-next-kind={nextMission?.kind || "complete"}
              data-child-progress=""
            >
              <div className="hs-mission-main-head">
                <div>
                  <span>Today</span>
                  <h2 id="hs-mission-heading">Your daily adventure</h2>
                </div>
                <strong>{status.doneCount} of 3 complete</strong>
              </div>
              <progress
                className="hs-mission-progress"
                max="3"
                value={status.doneCount}
                aria-label={`${status.doneCount} of 3 daily adventure steps complete`}
              />
              <ol className="hs-mission-steps">
                {MISSION_TILES.map((tile, index) => {
                  const isDone = Boolean(status.done[tile.kind]);
                  const isNext = nextMission?.kind === tile.kind;
                  return (
                    <li
                      key={tile.kind}
                      className={isDone ? "is-done" : isNext ? "is-next" : ""}
                      data-mission-step={tile.kind}
                      data-mission-state={isDone ? "done" : isNext ? "next" : "later"}
                      aria-current={isNext ? "step" : undefined}
                    >
                      <span className="hs-mission-step-number" aria-hidden="true">
                        {isDone ? "✓" : index + 1}
                      </span>
                      <span>
                        <strong>{tile.label}</strong>
                        <small>{isDone ? "Done" : isNext ? "Up next" : "Later"}</small>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>

            {recommendation.primary ? (
              <>
                <div className="hs-recommendation-grid" aria-label="Recommended learning choices" data-child-choices="">
                  <section className="hs-primary-choice" aria-label="Recommended next activity">
                    {renderActivity(recommendation.primary, "primary")}
                  </section>
                  <section className="hs-secondary-choices" aria-labelledby="hs-secondary-heading">
                    <div className="hs-choice-heading">
                      <span>Choose another</span>
                      <h2 id="hs-secondary-heading">Two more good choices</h2>
                    </div>
                    <div className="hs-secondary-grid">
                      {recommendation.secondary.map(activity => renderActivity(activity, "secondary"))}
                    </div>
                  </section>
                </div>

                {recommendation.explore.length > 0 && (
                  <details className="hs-more-explore">
                    <summary>
                      <span>
                        <strong>More to explore</strong>
                        <small>{recommendation.explore.length} more places</small>
                      </span>
                      <SageIcon name="play" />
                    </summary>
                    <div className="hs-explore-grid">
                      {recommendation.explore.map(activity => renderActivity(activity, "explore"))}
                    </div>
                  </details>
                )}
              </>
            ) : (
              <p className="hs-no-activity" role="status">{recommendation.childReason}</p>
            )}
          </section>
        </div>

        {overlays}
      </main>
    );
}
