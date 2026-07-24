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

import { useEffect, useMemo, useState } from "react";
import { CoinIcon } from "./shared/CurrencyIcons.jsx";
import { getCompanion, loadStudentProfile } from "../utils/studentProfile.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow } from "../utils/hollowEconomy.js";
import { loadHollowLedger } from "../utils/hollowState.js";
import StudentRailNav from "./StudentRailNav.jsx";

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
  const [profileRevision, setProfileRevision] = useState(0);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== scopeKey) return;
      if (
        Array.isArray(event.detail?.rows)
        && !event.detail.rows.some(row => row.area === "profile")
      ) return;
      setProfileRevision(revision => revision + 1);
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [scopeKey]);

  // The rail reads its own avatar and wallet from the scope key rather than
  // having them threaded down. Every sub-page would otherwise have to import
  // the treasury, the ledger and the companion just to render a strip it does
  // not own — which is precisely the friction that led to the rail existing on
  // one screen in the first place.
  const profile = useMemo(() => {
    void profileRevision;
    return loadStudentProfile(scopeKey);
  }, [scopeKey, profileRevision]);
  const companion = useMemo(() => {
    void profileRevision;
    return getCompanion(scopeKey);
  }, [scopeKey, profileRevision]);
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

      <StudentRailNav
        active={active}
        nav={nav}
        onHome={onHome}
        reducedChoiceMode={Boolean(profile.reducedChoiceMode)}
      />

      <span className="hs-side-spacer" />

      {children}
    </aside>
  );
}
