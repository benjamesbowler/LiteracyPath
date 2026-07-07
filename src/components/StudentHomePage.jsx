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
import { newRewardsSinceLastVisit } from "../utils/denRewards.js";
import { Gem } from "./Gem.jsx";

// Decorative art must never show a broken-image icon to kids; hide it instead.
function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

function StudentHomeCard({ title, subtitle, meta, art, onClick, className = "", tags = [], cta }) {
  return (
    <button className={["student-home-card", className].filter(Boolean).join(" ")} onClick={onClick} type="button">
      <span className="student-home-card-art" aria-hidden="true">
        <img src={art} alt="" loading="lazy" onError={hideOnError} />
      </span>
      <span className="student-home-card-label">
        {meta && <small className="student-home-card-meta">{meta}</small>}
        <strong>{title}</strong>
        <small className="student-home-card-subtitle">{subtitle}</small>
        {tags.length > 0 && (
          <span className="student-home-card-tags" aria-hidden="true">
            {tags.map(tag => <span key={tag}>{tag}</span>)}
          </span>
        )}
        {cta && <span className="comic-card-cta" aria-hidden="true">{cta}</span>}
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

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" fill="currentColor">
      <path d="M12 2c1 3-1 4.5-2 6-1.2 1.8-1.6 3.4-.6 5.4-2-.7-3-2-3.2-3.9C4.6 11.6 4 13.5 4 15a8 8 0 0 0 16 0c0-5-4.8-6.7-5-11-1.6 1-2.4 2.6-2 4.6C11.6 6.8 11.3 4.4 12 2Z" />
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

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
      <circle cx="12" cy="12" r="10" fill="#ffcf1a" stroke="#12141f" strokeWidth="2" />
      <path d="M12 6.3l1.7 3.5 3.8.5-2.8 2.6.7 3.8L12 15.4l-3.4 1.9.7-3.8-2.8-2.6 3.8-.5z" fill="#12141f" />
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

function ShieldIcon({ children }) {
  return (
    <span className="student-progress-shield" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="38" height="38">
        <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" fill="#0056b6" stroke="#12141f" strokeWidth="1.5" />
      </svg>
      <em>{children}</em>
    </span>
  );
}

const MISSION_TILES = [
  { kind: "quest", label: "Quest", art: "/images/learn-games/art/word-hopscotch.webp" },
  { kind: "book", label: "Book", art: "/images/learn-games/home/home-reading-library.webp" },
  { kind: "game", label: "Game", art: "/images/learn-games/art/pop-the-word.webp" }
];

export function StudentHomePage({
  studentName,
  progressScopeKey = "default",
  onOpenPhonicsLearn,
  onOpenArcade,
  onOpenSkillsBlockQuest,
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
  const treasury = useMemo(() => computeTreasury(progressScopeKey), [progressScopeKey]);
  const [freshRewards, setFreshRewards] = useState(() => newRewardsSinceLastVisit(progressScopeKey, computeTreasury(progressScopeKey)));
  const [accountOpen, setAccountOpen] = useState(false);
  // Placeholder scoring until the real incentive system lands — all derived from gems.
  const points = Math.round(treasury.gems * 12 + (treasury.breakdown?.gameStars || 0) * 5);
  const level = Math.max(1, Math.floor(treasury.gems / 12) + 1);
  const nextPercent = Math.round(((treasury.gems % 12) / 12) * 100);

  useEffect(() => {
    warmStudentAssets(worldForScope(progressScopeKey));
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

  return (
    <main className="student-home-page">
      <header className="student-home-topbar student-home-topbar-comic">
        <span className="student-home-brand">
          <img className="student-home-brand-logo" src="/images/pals/literacy-pals-logo.webp" alt="" onError={hideOnError} />
          <span className="student-home-brand-text"><strong>Literacy</strong><em>Pals</em></span>
        </span>
        <button
          className="student-home-namepill"
          type="button"
          aria-label="Choose your companion"
          onClick={() => setPickingCompanion(true)}
        >
          <span className="student-home-namepill-face">
            {companion
              ? <img src={companion.image} alt="" onError={hideOnError} />
              : String(studentName || "S").slice(0, 1).toUpperCase()}
          </span>
          <strong>{studentName || "Reader"}</strong>
        </button>
        <div className="student-home-account">
          {status.streak > 0 && (
            <span className="student-home-streak" title="School-day streak">
              <FlameIcon />
              {status.streak}
            </span>
          )}
          <span className="comic-topbar-gems" title="Gems">
            <Gem color="violet" size={18} />
            {treasury.gems}
          </span>
          <span className="comic-topbar-coins" title="Points">
            <CoinIcon />
            {points.toLocaleString()}
          </span>
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
                    <img src={tile.art} alt="" loading="lazy" onError={hideOnError} />
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
        tags={["Letters", "Writing", "Sounds", "Words"]}
        onClick={onOpenPhonicsLearn}
      />
      <StudentHomeCard
        className="student-home-card-map"
        art="/images/learn-games/home/home-skills-quest.webp"
        meta="Map quest"
        title="EL Map Quests"
        subtitle="Follow the map through EL skills"
        onClick={onOpenSkillsBlockQuest}
      />
      <StudentHomeCard
        className="student-home-card-arcade"
        art="/images/learn-games/home/home-arcade.webp"
        meta="Games"
        title="Arcade"
        subtitle="All literacy games live here"
        cta="Play now"
        onClick={() => openArcade()}
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

        <section className="kid-den-banner student-progress-banner student-progress-comic" aria-label="Points and progress">
          <span className="student-progress-title">Points + Progress</span>
          <span className="student-progress-stat">
            <Gem color="violet" size={24} />
            <span><strong>{treasury.gems}</strong><small>Gems</small></span>
          </span>
          <span className="student-progress-stat">
            <CoinIcon />
            <span><strong>{points.toLocaleString()}</strong><small>Points</small></span>
          </span>
          <span className="student-progress-stat">
            <ShieldIcon>{level}</ShieldIcon>
            <span><strong>Level {level}</strong></span>
          </span>
          <div className="student-progress-next">
            <div className="student-progress-next-head">
              <span>Next level</span>
              <span>{nextPercent}%</span>
            </div>
            <div className="kid-next-unlock-track" aria-hidden="true">
              <span style={{ width: `${nextPercent}%` }} />
            </div>
          </div>
          <button className="kid-den-button student-progress-view" type="button" onClick={onOpenRewards}>
            View Progress
          </button>
        </section>
      </section>

      {freshRewards.length > 0 && (
        <div className="kid-reward-toast" role="status">
          <span className="kid-reward-toast-icon" aria-hidden="true">{freshRewards[0].icon}</span>
          <div>
            <strong>You earned the {freshRewards[0].label}!</strong>
            <small>{freshRewards.length > 1 ? `+ ${freshRewards.length - 1} more waiting for you` : "It's waiting in your den"}</small>
          </div>
          <button className="kid-den-button" type="button" onClick={onOpenRewards}>See it!</button>
          <button className="kid-reward-toast-close" type="button" aria-label="Close" onClick={() => setFreshRewards([])}>×</button>
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
    </main>
  );
}
