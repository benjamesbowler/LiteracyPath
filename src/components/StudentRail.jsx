// THE SAGE RAIL — the child's map of the app.
//
// WHY THIS IS A COMPONENT AND NOT PART OF THE HOME PAGE
//
// It used to live inside StudentHomePage, which meant it existed on exactly
// one screen. Every sub-page — Phonics, Adventure Map, Reading Library, Story
// Quests — replaced it with a small floating "Back" chip in the top-left
// corner.
//
// For a 4-7 year old that is worse than a style inconsistency:
//
//   - They lose the only persistent map of where they are and what else there
//     is. A child who cannot yet read cannot rebuild that from a page title.
//   - Their identity anchor goes with it: the avatar they chose, their name,
//     and their coin count all vanish the moment they start an activity.
//   - Moving between two sections costs TWO taps and a context switch (back to
//     an unfamiliar home, find the tile, tap again) instead of one.
//   - The "Back" chip sits in the top-left, the hardest corner to reach on a
//     tablet held in two hands, and is ~44px against tiles many times its size.
//
// Keeping the rail is also what makes the visual consistency largely
// self-solving: the rail forces the cream ground, the type scale and the
// spacing to agree on every page it appears on.
//
// WHAT KEEPS ITS FULLSCREEN
//
// Worlds, not menus. Sound Seekers, My Hollow, the Arcade, and a book while it
// is open are PLACES — immersion is the point and the rail would break it.
// Everything that is a menu keeps the rail.

import { useMemo } from "react";
import { CoinIcon } from "./shared/CurrencyIcons.jsx";
import { getCompanion } from "../utils/studentProfile.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow } from "../utils/hollowEconomy.js";
import { loadHollowLedger } from "../utils/hollowState.js";

const RAIL_ICON_PATHS = {
  home: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z",
  sound: "M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6",
  phonics: "M5 19V6a2 2 0 0 1 2-2h10M7 19h11M9 15h6M9 11h6",
  map: "M9 4 3 7v13l6-3 6 3 6-3V4l-6 3z M9 4v13 M15 7v13",
  book: "M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z M8 3v18",
  story: "m12 4 2 4.2 4.6.6-3.4 3.2.9 4.6L12 14.4l-4.1 2.2.9-4.6L5.4 8.8 10 8.2Z",
  arcade: "M3 8h18v9H3z M7 12h2M17 12h.01M8 11v2",
  hollow: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
};

function RailIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={RAIL_ICON_PATHS[name] || RAIL_ICON_PATHS.home} />
    </svg>
  );
}

/**
 * @param active  which nav item is the current place: home | sounds | phonics
 *                | map | books | stories | arcade | hollow
 * @param nav     [{ id, label, icon, go }] — items with no `go` are dropped, so
 *                a locked Arcade simply does not appear rather than appearing
 *                dead.
 */
export default function StudentRail({
  studentName,
  scopeKey = "default",
  active = "home",
  nav = [],
  onHome,
  onCoins,
  children
}) {
  const items = nav.filter(item => item.go || item.id === active);

  // The rail reads its own avatar and wallet from the scope key rather than
  // having them threaded down. Every sub-page would otherwise have to import
  // the treasury, the ledger and the companion just to render a strip it does
  // not own — which is precisely the friction that led to the rail existing on
  // one screen in the first place.
  const companion = useMemo(() => getCompanion(scopeKey), [scopeKey]);
  const coins = useMemo(() => {
    try {
      const treasury = computeTreasury(scopeKey);
      return computeHollow(loadHollowLedger(scopeKey), treasury.breakdown).coins;
    } catch {
      // A wallet that cannot be computed must never take the navigation down
      // with it — the child still needs to be able to leave the page.
      return 0;
    }
  }, [scopeKey]);

  return (
    <aside className="hs-side" aria-label="Places to play">
      <span className="hs-avatar" aria-hidden="true">
        {companion?.image
          ? <img src={companion.image} alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
          : <strong style={{ fontSize: 34, color: "var(--hs-ink)" }}>{String(studentName || "S").slice(0, 1).toUpperCase()}</strong>}
      </span>
      <span className="hs-name">{studentName || "Reader"}</span>
      <button
        className="hs-coins"
        type="button"
        onClick={onCoins}
        aria-label={`${coins} coins. Open your Hollow.`}
      >
        <CoinIcon size={16} /> {coins}
      </button>

      <nav className="hs-nav">
        <button
          type="button"
          className={active === "home" ? "is-active" : ""}
          onClick={active === "home" ? undefined : onHome}
          aria-current={active === "home" ? "page" : undefined}
        >
          <RailIcon name="home" />Home
        </button>
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? "is-active" : ""}
            onClick={active === item.id ? undefined : item.go}
            aria-current={active === item.id ? "page" : undefined}
          >
            <RailIcon name={item.icon} />{item.label}
          </button>
        ))}
      </nav>

      <span className="hs-side-spacer" />

      {children}
    </aside>
  );
}
