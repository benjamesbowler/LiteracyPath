import { useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "./learn/games/shared/ConfettiCelebration.jsx";
import { playCelebrationFanfare } from "../utils/audio/gameSfx.js";
import {
  buildDailyMission,
  getMissionStatus,
  markMissionCelebrated
} from "../utils/dailyMission.js";
import { COMPANIONS, getCompanion, setCompanion } from "../utils/studentProfile.js";
import { worldForScope } from "../utils/palWorlds.js";
import { warmStudentAssets } from "../utils/preloadAssets.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow } from "../utils/hollowEconomy.js";
import { loadHollowLedger, coinsSinceLastVisit } from "../utils/hollowState.js";
import { CHILD_BRAND } from "../data/childBrand.js";
import { CoinIcon } from "./shared/CurrencyIcons.jsx";

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
  // "Skills Quest", not "Quest": this tile routes to the EL Skills Quest, and
  // the bare word "Quest" sat one header away from the Sound Seekers button —
  // two different modes, one name, and the flagship lost the coin toss.
  { kind: "quest", label: "Skills Quest", art: "/images/learn-games/art/word-hopscotch.webp" },
  { kind: "book", label: "Book", art: "/images/learn-games/home/home-reading-library.webp" },
  { kind: "game", label: "Game", art: "/images/learn-games/art/pop-the-word.webp" }
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
function SageCard({ hero = false, art, fallbackArt, title, fillChip, lineChips = [], foot, footNote, locked = false, lockedLabel, onClick }) {
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
    >
      <span className="hs-thumb" aria-hidden="true">
        <img src={art} alt="" loading="eager" decoding="async" onError={artError} />
      </span>
      <h2>{title}</h2>
      <span className="hs-chips">
        {fillChip && <span className="hs-chip is-fill">{fillChip}</span>}
        {lineChips.map(chip => <span key={chip} className="hs-chip is-line">{chip}</span>)}
      </span>
      <hr />
      <span className="hs-foot">
        <span className="hs-mini"><SageIcon name={locked ? "arcade" : "play"} /></span>
        {locked && lockedLabel ? lockedLabel : foot}
        {footNote && !locked && <em>&nbsp;· {footNote}</em>}
      </span>
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
  const [showCelebration, setShowCelebration] = useState(false);
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
    if (!status.needsCelebration) return undefined;
    const timer = window.setTimeout(() => {
      setShowCelebration(true);
      playCelebrationFanfare();
      markMissionCelebrated(progressScopeKey);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [progressScopeKey, status.needsCelebration]);

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

      {showCelebration && (
        <div className="student-mission-celebrate" role="dialog" aria-label="Mission complete">
          <ConfettiCelebration show />
          <div className="student-mission-celebrate-card">
            <img src="/images/learn-games/phinny-cheering.webp" alt="" onError={hideOnError} />
            <h2>Mission complete!</h2>
            <p>
              {status.streak > 1
                ? `That's ${status.streak} school days in a row. See you tomorrow!`
                : "Your streak starts today. See you tomorrow!"}
            </p>
            <button className="main-button" type="button" onClick={() => setShowCelebration(false)}>
              Keep exploring
            </button>
          </div>
        </div>
      )}
    </>
  );

    const missionLeft = MISSION_TILES.filter(tile => !status.done[tile.kind]).length;
    const nextMission = MISSION_TILES.find(tile => !status.done[tile.kind]);
    const arcadeLocked = ARCADE_REQUIRES_DAILY_TASKS && !status.missionComplete;
    const sageNav = [
      { id: "sounds", label: "Sound Seekers", icon: "sound", go: onOpenSoundSeekers },
      { id: "phonics", label: "Phonics", icon: "phonics", go: onOpenPhonicsLearn },
      { id: "map", label: "Adventure Map", icon: "map", go: onOpenSkillsBlockQuest },
      { id: "books", label: "Books", icon: "book", go: onOpenGuidedReading ? () => onOpenGuidedReading("") : null },
      { id: "stories", label: "Story Quests", icon: "story", go: onOpenStoryQuests },
      { id: "arcade", label: "Arcade", icon: "arcade", go: arcadeLocked ? null : () => openArcade() },
      { id: "hollow", label: "My Hollow", icon: "hollow", go: onOpenRewards }
    ].filter(item => item.go);

    return (
      <main className="lp-home-sage">
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

          <nav className="hs-nav" aria-label="Places to play">
            <button type="button" className="is-active"><SageIcon name="home" />Home</button>
            {sageNav.map(item => (
              <button key={item.id} type="button" onClick={item.go}><SageIcon name={item.icon} />{item.label}</button>
            ))}
          </nav>

          <span className="hs-side-spacer" />

          <div className="hs-daily">
            <h3>Today&rsquo;s adventure</h3>
            <p>Quest, story, then game — go!</p>
            <div className="hs-daily-dots" aria-label={`${status.doneCount} of 3 complete`}>
              {MISSION_TILES.map(tile => (
                <span key={tile.kind} className={status.done[tile.kind] ? "is-done" : ""} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => (nextMission ? missionTargets[nextMission.kind]?.() : onOpenRewards?.())}
            >
              {status.missionComplete ? "All done — go spend!" : missionLeft === 1 ? "One to go — play it" : `${missionLeft} to go — play one`}
            </button>
          </div>
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
              {(onOpenSoundSeekers || onOpenSkillsBlockQuest) && (
                <button className="hs-btn-primary" type="button" onClick={onOpenSoundSeekers || onOpenSkillsBlockQuest}>
                  <SageIcon name="play" />Keep playing
                </button>
              )}
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
              <h1>Hello, {studentName || "friend"}!</h1>
              <p className="hs-sub">
                {status.missionComplete
                  ? "All three tasks done. Anything you like now!"
                  : "What shall we play today?"}
              </p>
            </div>

            <div className="hs-grid">
              {onOpenSoundSeekers && (
                <SageCard
                  hero
                  art="/images/home-sage/sound-seekers.webp"
                  fallbackArt="/images/quest/meadow/sky.webp"
                  title="Sound Seekers"
                  fillChip="Adventure"
                  lineChips={["The Sound Trail"]}
                  foot="Walk the trail"
                  footNote="your creature is waiting"
                  onClick={onOpenSoundSeekers}
                />
              )}
              <SageCard
                art="/images/home-sage/phonics.webp"
                fallbackArt="/images/learn-games/home/home-phonics.webp"
                title="Phonics Learning"
                fillChip="Practice"
                lineChips={["Letters and sounds"]}
                foot="Build some words"
                onClick={onOpenPhonicsLearn}
              />
              <SageCard
                art="/images/home-sage/adventure-map.webp"
                fallbackArt="/images/learn-games/home/home-skills-quest.webp"
                title="Adventure Map"
                fillChip="Adventure"
                lineChips={["Win stars"]}
                foot="Follow the path"
                onClick={onOpenSkillsBlockQuest}
              />
              <SageCard
                art="/images/home-sage/arcade.webp"
                fallbackArt="/images/learn-games/home/home-arcade.webp"
                title="Arcade"
                fillChip="Games"
                lineChips={["11 games"]}
                foot="Jump into a game"
                locked={arcadeLocked}
                lockedLabel="Finish your 3 tasks to unlock"
                onClick={() => { if (!arcadeLocked) openArcade(); }}
              />
              <SageCard
                art="/images/home-sage/story-quests.webp"
                fallbackArt="/images/learn-games/home/home-story-quests.webp"
                title="Story Quests"
                fillChip="Stories"
                lineChips={["You choose"]}
                foot="Read and choose"
                onClick={onOpenStoryQuests}
              />
              <SageCard
                art="/images/home-sage/reading-library.webp"
                fallbackArt="/images/learn-games/home/home-reading-library.webp"
                title="Reading Library"
                fillChip="Read"
                lineChips={["Real books"]}
                foot="Pick a book"
                onClick={() => onOpenGuidedReading?.("")}
              />
            </div>
          </section>
        </div>

        {overlays}
      </main>
    );
}
