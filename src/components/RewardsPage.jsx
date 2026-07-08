import { useEffect, useMemo, useState } from "react";
import { computeTreasury, TRAIL_TREASURES } from "../utils/treasureTrail.js";
import { DEN_THEMES, markRewardsSeen } from "../utils/denRewards.js";
import { loadStudentProfile, saveStudentProfile, getCompanion, getCollectibles } from "../utils/studentProfile.js";
import { playStarChime } from "../utils/audio/gameSfx.js";
import { Gem } from "./Gem.jsx";

// My Treasure Den - the student rewards HQ (Raz-Kids "Raz Rocket" pattern):
// one place that is THEIRS, where every gem earned anywhere in the app turns
// into visible prizes, badges and den decorations, with the next prize
// always in reach.

function hideOnError(event) {
  event.currentTarget.style.display = "none";
}

function TrailStop({ item, state, gems }) {
  return (
    <li className={`den-trail-stop ${state}`}>
      <span className="den-trail-icon" aria-hidden="true">
        {state === "locked" ? "🔒" : item.icon}
      </span>
      <strong>{item.name}</strong>
      {state === "next"
        ? <em>{item.at - gems} gem{item.at - gems === 1 ? "" : "s"} to go!</em>
        : <em>{state === "earned" ? "Yours!" : `${item.at} gems`}</em>}
    </li>
  );
}

export function RewardsPage({ studentName, progressScopeKey = "default", onBack }) {
  const treasury = useMemo(() => computeTreasury(progressScopeKey), [progressScopeKey]);
  const companion = useMemo(() => getCompanion(progressScopeKey), [progressScopeKey]);
  const collectibles = useMemo(() => getCollectibles(progressScopeKey), [progressScopeKey]);
  const [denTheme, setDenThemeState] = useState(() => loadStudentProfile(progressScopeKey).denTheme || "meadow");

  // Visiting the den "collects" the pop-up notifications.
  useEffect(() => {
    markRewardsSeen(progressScopeKey, treasury);
  }, [progressScopeKey, treasury]);

  const activeTheme = DEN_THEMES.find(theme => theme.id === denTheme && treasury.gems >= theme.at) || DEN_THEMES[0];

  function chooseTheme(theme) {
    if (treasury.gems < theme.at) return;
    setDenThemeState(theme.id);
    const profile = loadStudentProfile(progressScopeKey);
    saveStudentProfile(progressScopeKey, { ...profile, denTheme: theme.id });
    playStarChime();
  }

  const b = treasury.breakdown;
  const earnWays = [
    { icon: "⭐", label: "Win a quest star", pays: "1 gem", done: `${b.questStars} so far` },
    { icon: "🎮", label: "Win a game star", pays: "1 gem", done: `${b.gameStars} so far` },
    { icon: "📖", label: "Read a book", pays: "1 gem", done: `${b.booksRead} so far` },
    { icon: "🗺️", label: "Finish a story quest", pays: "2 gems", done: `${b.storiesDone} so far` }
  ];

  return (
    <main className="rewards-page" data-pal-world={activeTheme.id}>
      <div className="den-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${activeTheme.art})` }} />

      <header className="den-header">
        <button className="sbq-ghost-button" type="button" onClick={onBack}>← Home</button>
        <div className="den-title">
          <h1>{studentName ? `${studentName}'s Treasure Den` : "My Treasure Den"}</h1>
          <p>Every star, book, and quest you finish earns a gem here.</p>
        </div>
        <span className="kid-gem-counter den-gem-counter" aria-label={`${treasury.gems} gems collected`}>
          <Gem color="violet" size={26} />
          {treasury.gems}
        </span>
      </header>

      {companion && (
        <img className="den-companion" src={companion.image} alt="" onError={hideOnError} />
      )}

      <section className="den-card" aria-label="Treasure trail">
        <h2>🗺️ The Treasure Trail</h2>
        {treasury.nextTreasure ? (
          <div className="kid-next-unlock den-next">
            <strong>
              {treasury.nextTreasure.icon} {treasury.gemsToNext} more gem{treasury.gemsToNext === 1 ? "" : "s"} to win the {treasury.nextTreasure.name}!
            </strong>
            <div className="kid-next-unlock-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(treasury.nextProgress * 100)}>
              <span style={{ width: `${Math.round(treasury.nextProgress * 100)}%` }} />
            </div>
          </div>
        ) : (
          <p className="kid-trail-complete">🏆 You found every treasure on the trail!</p>
        )}
        <ol className="den-trail">
          {TRAIL_TREASURES.map(item => {
            const earned = treasury.gems >= item.at;
            const isNext = treasury.nextTreasure?.id === item.id;
            return (
              <TrailStop
                key={item.id}
                item={item}
                gems={treasury.gems}
                state={earned ? "earned" : isNext ? "next" : "locked"}
              />
            );
          })}
        </ol>
      </section>

      <section className="den-card" aria-label="Cycle badges">
        <h2>🏅 My Badge Wall</h2>
        {treasury.badges.length === 0 ? (
          <p className="den-empty">Finish a quest cycle to hang your first gold badge here!</p>
        ) : (
          <div className="student-treasures-shelf">
            {treasury.badges.map(badge => (
              <div key={badge.id} className="kid-badge" title={`${badge.name} complete`}>
                <span className="kid-badge-medal">
                  <img src={`/images/pals/${badge.world.id}-emblem.webp`} alt="" onError={hideOnError} />
                  <span className="kid-badge-number">{badge.cycleNumber}</span>
                </span>
                <span>{"⭐".repeat(Math.min(3, badge.stars))}</span>
              </div>
            ))}
            {collectibles.map(item => (
              <div key={item.key} className="kid-badge" title={item.label || item.name}>
                <span className="kid-badge-medal den-gem-medal"><Gem color={item.color} size={44} /></span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="den-card" aria-label="Den backdrops">
        <h2>🎨 Choose your world</h2>
        <div className="den-themes">
          {DEN_THEMES.map(theme => {
            const unlocked = treasury.gems >= theme.at;
            const active = activeTheme.id === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                className={`den-theme${active ? " active" : ""}${unlocked ? "" : " locked"}`}
                onClick={() => chooseTheme(theme)}
                disabled={!unlocked}
              >
                <img src={theme.art} alt="" onError={hideOnError} />
                <strong>{theme.name}</strong>
                <em>{unlocked ? (active ? "Your den!" : "Tap to choose") : `🔒 ${theme.at} gems`}</em>
              </button>
            );
          })}
        </div>
      </section>

      <section className="den-card" aria-label="How to earn gems">
        <h2>💎 How to earn gems</h2>
        <div className="den-earn-grid">
          {earnWays.map(way => (
            <div key={way.label} className="den-earn">
              <span aria-hidden="true">{way.icon}</span>
              <strong>{way.label}</strong>
              <em>{way.pays}</em>
              <small>{way.done}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
