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
import { CoinIcon } from "./shared/CurrencyIcons.jsx";

// Decorative art must never show a broken-image icon to kids; hide it instead.
function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

function StudentHomeCard({ title, subtitle, meta, art, onClick, className = "", tags = [], cta, locked = false, lockedLabel }) {
  return (
    <button
      className={["student-home-card", className, locked ? "student-home-card-locked" : ""].filter(Boolean).join(" ")}
      onClick={onClick}
      type="button"
      aria-disabled={locked || undefined}
    >
      <span className="student-home-card-art" aria-hidden="true">
        <img src={art} alt="" loading="eager" decoding="async" fetchpriority="high" onError={hideOnError} />
      </span>
      {locked && <span className="student-home-card-lock" aria-hidden="true">🔑</span>}
      <span className="student-home-card-label">
        {meta && <small className="student-home-card-meta">{meta}</small>}
        <strong>{title}</strong>
        <small className="student-home-card-subtitle">{locked && lockedLabel ? lockedLabel : subtitle}</small>
        {tags.length > 0 && (
          <span className="student-home-card-tags" aria-hidden="true">
            {tags.map(tag => <span key={tag}>{tag}</span>)}
          </span>
        )}
        {cta && !locked && <span className="comic-card-cta" aria-hidden="true">{cta}</span>}
      </span>
    </button>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h9v2H6v12h7v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H10v-2h6.4l-2.2-2.2 1.4-1.4Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="currentColor">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.6 0-8 1.8-8 4.4V20h16v-1.6C20 15.8 15.6 14 12 14Z" />
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
// A calmer shell around the same activities (see src/styles/home-sage.css and
// mockups/kids-home-chalkie-style.html). Flag-gated so it can be A/B tested
// with real children against the comic skin: localStorage lp-home-skin, or
// ?homeSkin=sage for a one-off look. Both skins share every handler, all
// mission/wallet state, and the overlays — the skin is presentation only.
const HOME_SKIN_KEY = "lp-home-skin";

function readHomeSkin() {
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("homeSkin");
    if (fromQuery === "sage" || fromQuery === "comic") return fromQuery;
    return window.localStorage.getItem(HOME_SKIN_KEY) === "sage" ? "sage" : "comic";
  } catch {
    return "comic";
  }
}

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

function SageCard({ hero = false, art, title, fillChip, lineChips = [], foot, footNote, locked = false, lockedLabel, onClick }) {
  return (
    <button
      type="button"
      className={["hs-card", hero ? "is-hero" : "", locked ? "is-locked" : ""].filter(Boolean).join(" ")}
      onClick={onClick}
      aria-disabled={locked || undefined}
    >
      <span className="hs-thumb" aria-hidden="true">
        <img src={art} alt="" loading="eager" decoding="async" onError={hideOnError} />
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
  // The "keep going" hint: the cheapest Market thing they can't afford yet -
  // or the good news that they can afford something right now.
  const savingsHint = useMemo(() => {
    const wares = [...hollow.market.gear, ...hollow.market.hollow, ...hollow.market.eggs]
      .filter(item => item.id.startsWith("egg-") || !hollow.ownedIds.has(item.id))
      .sort((a, b) => a.price - b.price);
    if (!wares.length) return null;
    const affordable = wares.filter(item => item.price <= hollow.coins).pop();
    if (affordable) return { ready: true, item: affordable, pct: 100 };
    const next = wares[0];
    return { ready: false, item: next, short: next.price - hollow.coins, pct: Math.round((hollow.coins / next.price) * 100) };
  }, [hollow]);

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

  const [homeSkin, setHomeSkin] = useState(readHomeSkin);
  function switchHomeSkin(next) {
    setHomeSkin(next);
    setAccountOpen(false);
    try { window.localStorage.setItem(HOME_SKIN_KEY, next); } catch { /* best effort */ }
  }

  // Shared by both skins — the skin is presentation only.
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
                  <img src={item.image} alt="" loading="lazy" onError={hideOnError} />
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

  if (homeSkin === "sage") {
    const missionLeft = MISSION_TILES.filter(tile => !status.done[tile.kind]).length;
    const nextMission = MISSION_TILES.find(tile => !status.done[tile.kind]);
    const arcadeLocked = ARCADE_REQUIRES_DAILY_TASKS && !status.missionComplete;
    const sageNav = [
      { id: "sounds", label: "Sound Seekers", icon: "sound", go: onOpenSoundSeekers },
      { id: "phonics", label: "Phonics", icon: "phonics", go: onOpenPhonicsLearn },
      { id: "map", label: "Adventure Map", icon: "map", go: onOpenSkillsBlockQuest },
      { id: "books", label: "Books", icon: "book", go: onOpenGuidedReading ? () => onOpenGuidedReading("") : null },
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
            <h3>Daily challenge</h3>
            <p>A quest, a book and a game</p>
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
            <span className="hs-logo" aria-hidden="true"><strong>Literacy</strong>Pals</span>
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
                  <button type="button" role="menuitem" onClick={() => switchHomeSkin("comic")}>
                    <SageIcon name="swap" />Back to classic look
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
                  art="/images/quest/meadow/sky.webp"
                  title="Sound Seekers"
                  fillChip="Adventure"
                  lineChips={["The Sound Trail"]}
                  foot="Walk the trail"
                  footNote="your creature is waiting"
                  onClick={onOpenSoundSeekers}
                />
              )}
              <SageCard
                art="/images/learn-games/home/home-phonics.webp"
                title="Phonics Learning"
                fillChip="Practice"
                lineChips={["Letters and sounds"]}
                foot="Build some words"
                onClick={onOpenPhonicsLearn}
              />
              <SageCard
                art="/images/learn-games/home/home-skills-quest.webp"
                title="Adventure Map"
                fillChip="Adventure"
                lineChips={["Win stars"]}
                foot="Follow the path"
                onClick={onOpenSkillsBlockQuest}
              />
              <SageCard
                art="/images/learn-games/home/home-arcade.webp"
                title="Arcade"
                fillChip="Games"
                lineChips={["11 games"]}
                foot="Jump into a game"
                locked={arcadeLocked}
                lockedLabel="Finish your 3 tasks to unlock"
                onClick={() => { if (!arcadeLocked) openArcade(); }}
              />
              <SageCard
                art="/images/learn-games/home/home-story-quests.webp"
                title="Story Quests"
                fillChip="Stories"
                lineChips={["You choose"]}
                foot="Read and choose"
                onClick={onOpenStoryQuests}
              />
              <SageCard
                art="/images/learn-games/home/home-reading-library.webp"
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

  return (
    <main className="student-home-page">
      <header className="student-home-topbar student-home-topbar-comic">
        <div className="student-home-topbar-left">
          <span className="student-home-brand">
            <img className="student-home-brand-logo" src="/images/pals/literacy-pals-logo.webp" alt="Literacy Pals" onError={hideOnError} />
            <span className="student-home-brand-text"><strong>Literacy</strong><em>Pals</em></span>
          </span>
          {/* Display only - companion changes live in the account menu (Settings). */}
          <div className="student-home-namepill">
            <span className="student-home-namepill-face">
              {companion
                ? <img src={companion.image} alt="" onError={hideOnError} />
                : String(studentName || "S").slice(0, 1).toUpperCase()}
            </span>
            <strong>{studentName || "Reader"}</strong>
          </div>
        </div>

        {/* Sound Seekers is a standalone flagship mode, separate from the
            practice-card grid. Its centre position keeps the account and child
            identity controls stable on every breakpoint. */}
        {onOpenSoundSeekers && (
          <div className="student-home-topbar-centre">
            <button
              type="button"
              className="student-home-seekers-btn"
              onClick={onOpenSoundSeekers}
              aria-label="Open Sound Seekers"
            >
              Sound Seekers
            </button>
          </div>
        )}

        <div className="student-home-account">
          <button
            className="comic-topbar-gems"
            type="button"
            onClick={onOpenRewards}
            title="Your Hollow"
            aria-label={`${hollow.coins} coins. Open your Hollow.`}
          >
            <CoinIcon size={18} /> {hollow.coins}
          </button>
          {savingsHint && (
            <button
              className="student-home-topbar-progress"
              type="button"
              onClick={onOpenRewards}
              title="Your Hollow"
              aria-label={savingsHint.ready
                ? `You can afford the ${savingsHint.item.name}! Open your Hollow.`
                : `${savingsHint.short} more coins for the ${savingsHint.item.name}. Open your Hollow.`}
            >
              <span className="kid-next-unlock-track" aria-hidden="true"><span style={{ width: `${savingsHint.pct}%` }} /></span>
              <em aria-hidden="true">{savingsHint.ready ? "🛒 Ready!" : `🛒 ${savingsHint.short}`}</em>
            </button>
          )}
          <div className="student-home-account-wrap">
            <button
              className="student-home-account-btn"
              type="button"
              aria-haspopup="true"
              aria-expanded={accountOpen}
              aria-label="Account menu"
              onClick={() => setAccountOpen(value => !value)}
            >
              <AccountIcon />
              <span aria-hidden="true">▾</span>
            </button>
            {accountOpen && (
              <div className="student-home-account-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); setPickingCompanion(true); }}>
                  Change companion
                </button>
                <button type="button" role="menuitem" onClick={() => switchHomeSkin("sage")}>
                  Try the new look
                </button>
                <button type="button" role="menuitem" onClick={onLogout} aria-label={logoutAriaLabel}>
                  <SignOutIcon />{logoutLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="student-home-board" aria-label="Student learning areas">
        <section className="student-mission student-mission-banner" aria-label="Daily challenge">
          <div className="student-mission-head">
            <span
              className="pal-sprite"
              aria-hidden="true"
              style={{ "--pal-sprite-sheet": `url(/images/pals/sprites/${worldForScope(progressScopeKey).id}-idle-4.webp)` }}
            />
            <div>
              <span className="student-board-kicker">Daily challenge</span>
              <h1>Three quick tasks</h1>
              <p>{status.missionComplete ? "All done. Choose another area to keep going." : "A quest, a book, and an arcade round."}</p>
            </div>
            <div className="student-mission-tracker" aria-label={`${status.doneCount} of 3 complete`}>
              {MISSION_TILES.map(tile => (
                <span key={tile.kind} className={status.done[tile.kind] ? "done" : ""} aria-hidden="true">
                  {status.done[tile.kind] ? <CheckIcon /> : null}
                </span>
              ))}
              <strong>{status.doneCount}/3</strong>
            </div>
          </div>

          <div className="student-mission-grid">
            {MISSION_TILES.map(tile => {
              const item = mission[tile.kind];
              const done = Boolean(status.done[tile.kind]);
              return (
                <button
                  key={tile.kind}
                  type="button"
                  className={`student-mission-tile${done ? " done" : ""}`}
                  onClick={missionTargets[tile.kind]}
                >
                  <span className="student-mission-art" aria-hidden="true">
                    <img src={tile.art} alt="" loading="eager" decoding="async" onError={hideOnError} />
                    {done && <span className="student-mission-done-badge"><CheckIcon /></span>}
                  </span>
                  <span className="student-mission-copy">
                    <small>{tile.label}</small>
                    <strong>{item.title}{item.detail ? ` · ${item.detail}` : ""}</strong>
                    <em>{item.why}</em>
                  </span>
                </button>
              );
            })}
          </div>

          {!status.missionComplete && (
            <button
              className="student-mission-next-button"
              type="button"
              onClick={() => {
                const nextTile = MISSION_TILES.find(tile => !status.done[tile.kind]);
                if (nextTile) missionTargets[nextTile.kind]?.();
              }}
            >
              Start next task
            </button>
          )}
        </section>

      <StudentHomeCard
        className="student-home-card-phonics"
        art="/images/learn-games/home/home-phonics.webp"
        meta="Phonics learning"
        title="Phonics Learning"
        subtitle="Letters, writing, sounds, and word building"
        onClick={onOpenPhonicsLearn}
      />
      <StudentHomeCard
        className="student-home-card-map"
        art="/images/learn-games/home/home-skills-quest.webp"
        meta="Adventure map"
        title="Adventure Map"
        subtitle="Follow the path and win stars"
        onClick={onOpenSkillsBlockQuest}
      />
      <StudentHomeCard
        className="student-home-card-arcade"
        art="/images/learn-games/home/home-arcade.webp"
        meta="Games"
        title="Arcade"
        subtitle="Jump into a learning game"
        cta="Play now"
        locked={ARCADE_REQUIRES_DAILY_TASKS && !status.missionComplete}
        lockedLabel="Finish your 3 tasks to unlock"
        onClick={() => { if (!ARCADE_REQUIRES_DAILY_TASKS || status.missionComplete) openArcade(); }}
      />
      <StudentHomeCard
        className="student-home-card-story"
        art="/images/learn-games/home/home-story-quests.webp"
        meta="Story path"
        title="Story Quests"
        subtitle="Read, choose, and collect words"
        onClick={onOpenStoryQuests}
      />
      <StudentHomeCard
        className="student-home-card-library"
        art="/images/learn-games/home/home-reading-library.webp"
        meta="Books"
        title="Reading Library"
        subtitle="Listen, read, and reread"
        onClick={onOpenGuidedReading}
      />
      </section>

      {overlays}
    </main>
  );
}
