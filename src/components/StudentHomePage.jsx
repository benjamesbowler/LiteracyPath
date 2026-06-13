import { useEffect, useMemo, useState } from "react";
import { ConfettiCelebration } from "./learn/games/shared/ConfettiCelebration.jsx";
import { playCelebrationFanfare } from "../utils/audio/gameSfx.js";
import {
  buildDailyMission,
  getMissionStatus,
  markMissionCelebrated
} from "../utils/dailyMission.js";
import { COMPANIONS, getCompanion, setCompanion, getCollectibles } from "../utils/studentProfile.js";
import { worldForScope } from "../utils/palWorlds.js";
import { warmStudentAssets } from "../utils/preloadAssets.js";
import { Gem } from "./Gem.jsx";

function StudentHomeCard({ title, subtitle, meta, art, onClick }) {
  return (
    <button className="student-home-card" onClick={onClick} type="button">
      <span className="student-home-card-art" aria-hidden="true">
        <img src={art} alt="" loading="lazy" />
      </span>
      <span className="student-home-card-label">
        {meta && <small className="student-home-card-meta">{meta}</small>}
        <strong>{title}</strong>
        <small className="student-home-card-subtitle">{subtitle}</small>
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

const MISSION_TILES = [
  { kind: "quest", label: "Quest", art: "/images/learn-games/art/word-hopscotch.webp" },
  { kind: "book", label: "Book", art: "/images/learn-games/home/home-reading-library.webp" },
  { kind: "game", label: "Game", art: "/images/learn-games/art/pop-the-word.webp" }
];

export function StudentHomePage({
  studentName,
  progressScopeKey = "default",
  onOpenPhonicsLearn,
  onOpenSkillsBlockQuest,
  onOpenStoryQuests,
  onOpenGuidedReading,
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
  const [collectibles] = useState(() => getCollectibles(progressScopeKey));

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

  const missionTargets = {
    quest: onOpenSkillsBlockQuest,
    book: () => onOpenGuidedReading?.(mission.book?.bookId || ""),
    game: () => {
      // Open the arcade straight onto today's game.
      try {
        if (mission.game?.gameId) window.localStorage.setItem("lp-open-game", mission.game.gameId);
      } catch { /* best effort */ }
      onOpenPhonicsLearn?.();
    }
  };

  return (
    <main className="student-home-page">
      <header className="student-home-topbar">
        <img className="student-home-logo pals-logo" src="/images/pals/literacy-pals-logo.webp" alt="Literacy Pals" />
        <button
          className="student-home-avatar"
          type="button"
          aria-label="Choose your companion"
          onClick={() => setPickingCompanion(true)}
        >
          {companion
            ? <img src={companion.image} alt="" />
            : String(studentName || "S").slice(0, 1).toUpperCase()}
        </button>
        <div>
          <span className="student-home-eyebrow">Hello</span>
          <strong>{studentName || "Reader"}</strong>
        </div>
        {status.streak > 0 && (
          <span className="student-home-streak" title="School-day streak">
            <FlameIcon />
            {status.streak} day{status.streak === 1 ? "" : "s"}
          </span>
        )}
        <button className="student-home-logout" onClick={onLogout} type="button" aria-label={logoutAriaLabel}>
          <SignOutIcon />
          <span>{logoutLabel}</span>
        </button>
      </header>

      <section className="student-mission" aria-label="Today's mission">
        <div className="student-mission-head">
          <span
            className="pal-sprite"
            aria-hidden="true"
            style={{ "--pal-sprite-sheet": `url(/images/pals/sprites/${worldForScope(progressScopeKey).id}-idle-4.webp)` }}
          />
          <div>
            <h1>Today&apos;s Mission</h1>
            <p>{status.missionComplete ? "All done. Brilliant work - explore anything you like!" : "Three stops. You choose the order."}</p>
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
                  <img src={tile.art} alt="" loading="lazy" />
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
      </section>

      <section className="student-home-explore" aria-label="Explore">
        <h2>Explore</h2>
        <div className="student-home-grid">
          <StudentHomeCard
            art="/images/learn-games/home/home-phonics.webp"
            meta="Letters and games"
            title="Phonics Quest"
            subtitle="Letters, words, and games"
            onClick={onOpenPhonicsLearn}
          />
          <StudentHomeCard
            art="/images/learn-games/home/home-skills-quest.webp"
            meta="One big path"
            title="Skills Quest"
            subtitle="Sounds, words, and reading runs"
            onClick={onOpenSkillsBlockQuest}
          />
          <StudentHomeCard
            art="/images/learn-games/home/home-story-quests.webp"
            meta="Story path"
            title="Story Quests"
            subtitle="Read, choose, and collect words"
            onClick={onOpenStoryQuests}
          />
          <StudentHomeCard
            art="/images/learn-games/home/home-reading-library.webp"
            meta="Book shelf"
            title="Reading Library"
            subtitle="Listen, read, and reread"
            onClick={onOpenGuidedReading}
          />
        </div>
      </section>

      {collectibles.length > 0 && (
        <section className="student-treasures" aria-label="My treasures">
          <h2>My Treasures</h2>
          <div className="student-treasures-shelf">
            {collectibles.map(item => (
              <div key={item.key} className="student-treasure" title={item.label || item.name}>
                <Gem color={item.color} size={40} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </section>
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
                  <img src={item.image} alt="" loading="lazy" />
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
            <img src="/images/learn-games/phinny-cheering.webp" alt="" />
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
