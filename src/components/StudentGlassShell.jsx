// THE CHILD SHELL — fluid-width 834px stage, 78px header, 92px five-tab bar.
//
// Every child screen renders inside `children`. The design coordinate system
// keeps a fixed height so each surface can prove it does not scroll, while its
// width follows the viewport so there is no narrow centre band.
//
// WHY THE TAB BAR REPLACED THE LEFT RAIL. The rail was a text-labelled column a
// pre-reader cannot use, in the hardest corner of a two-handed tablet to reach.
// Five tabs across 1194px give a ~215px hit area each, under the thumbs, with
// the icon carrying the meaning. Everything the rail was defending — a
// persistent map of the app, the identity anchor, one-tap moves between
// sections — the bar keeps: the header holds the child's companion and name,
// the bar is on every screen, and no destination was dropped.
//
// WHAT THIS HEADER MAY SHOW. Two currencies and only two: stars (earned,
// display only) and coins (spendable, and the button goes to the place they are
// spent). The prior build surfaced roughly eight numeric systems to the child.
// The rule is in the spec and repeated in kids-glass.css because it is the kind
// of rule that erodes one well-meant counter at a time.

import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  STUDENT_RAIL_ICON_PATHS,
  STUDENT_TAB_BAR,
  selectActiveStudentTab
} from "../policy/studentRailPolicy.js";
import { applyKidsStageMetrics } from "../utils/kidsStage.js";
import { getAvailableGuideStars, getCompanion } from "../utils/studentProfile.js";
import { computeTreasury } from "../utils/treasureTrail.js";
import { computeHollow } from "../utils/hollowEconomy.js";
import { loadHollowLedger } from "../utils/hollowState.js";

let studentProfileRevision = 0;

function subscribeToStudentProfile(scopeKey, callback) {
  const refresh = event => {
    if (event.detail?.studentId && event.detail.studentId !== scopeKey) return;
    studentProfileRevision += 1;
    callback();
  };
  window.addEventListener("lp-progress-hydrated", refresh);
  window.addEventListener("lp-student-profile-updated", refresh);
  return () => {
    window.removeEventListener("lp-progress-hydrated", refresh);
    window.removeEventListener("lp-student-profile-updated", refresh);
  };
}

// The spec's own glyphs. The app's existing CoinIcon is a comic-era icon with a
// 2px black outline, and this system has no ink outlines anywhere — so the two
// currency glyphs are drawn here to the spec's exact fills instead of reused.
const STAR_PATH =
  "M12 2.6l2.9 6.2 6.6.8-4.8 4.6 1.2 6.6L12 17.6 6.1 20.8l1.2-6.6L2.5 9.6l6.6-.8L12 2.6z";

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d={STAR_PATH} fill="#F2B33D" />
    </svg>
  );
}

function CoinGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#F0A93C" />
      <circle cx="12" cy="12" r="6.6" fill="#FFCE5C" />
    </svg>
  );
}

function GlassIcon({ name }) {
  return (
    <svg
      className="kg-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-kg-icon={name}
    >
      <path d={STUDENT_RAIL_ICON_PATHS[name] || STUDENT_RAIL_ICON_PATHS.home} />
    </svg>
  );
}

// A wallet that cannot be read must NOT render as "0" — that is a claim the
// child has nothing, which is a different statement from "we could not load
// it". `ok: false` renders a neutral placeholder and says so to a screen
// reader, exactly as the app's other read-state handling does.
function readWallet(scopeKey) {
  try {
    const treasury = computeTreasury(scopeKey);
    const breakdown = treasury.breakdown || {};
    // Stars are the child-facing count of stars actually earned. It is NOT
    // treasury.gems: "gems" is a separate internal total that also folds in
    // books and stories, and gems are one of the numeric systems the redesign
    // removed from the child's view.
    const stars =
      (Number(breakdown.questStars) || 0)
      + (Number(breakdown.gameStars) || 0)
      + (Number(breakdown.soundSeekerStars) || 0);
    const coins = computeHollow(loadHollowLedger(scopeKey), breakdown).coins;
    return { ok: true, stars: getAvailableGuideStars(scopeKey, stars), coins };
  } catch {
    return { ok: false, stars: null, coins: null };
  }
}

function Currency({ kind, value, ok, caption, label, onClick }) {
  const Tag = onClick ? "button" : "span";
  const shown = ok ? String(value) : "--";
  return (
    <Tag
      className={`kg-currency kg-currency--${kind}`}
      {...(onClick ? { type: "button", onClick } : {})}
      aria-label={label}
    >
      {kind === "stars" ? <StarGlyph /> : <CoinGlyph />}
      <span className="kg-currency-value" aria-hidden="true">{shown}</span>
      <span className="kg-currency-caption" aria-hidden="true">{caption}</span>
    </Tag>
  );
}

/**
 * @param active   the place the child is in: one of the ids in
 *                 STUDENT_RAIL_DESTINATIONS, or "home". It is mapped to the tab
 *                 that lights via selectActiveStudentTab, so a sub-screen never
 *                 leaves the bar dark.
 * @param onNavigate  (tabId) => void. Called with the tab the child tapped.
 * @param scopeKey    the progress scope the header reads its wallet from.
 * @param contentScrolls  legacy screens were written to own a scrolling
 *                 viewport; clipping them would delete content, so they get a
 *                 scrolling content area until their phase rebuilds them.
 */
export default function StudentGlassShell({
  studentName,
  scopeKey = "default",
  active = "home",
  onNavigate,
  onHome,
  onGrownUps,
  contentScrolls = false,
  children
}) {
  const stageRef = useRef(null);

  // The stage metrics are written straight to the DOM node, never held in
  // state: setting state from inside an effect on first paint is what
  // react-hooks/set-state-in-effect forbids, and a resize should move two
  // numbers, not re-render the whole child area. The canvas height is fixed and
  // its WIDTH follows the viewport, so the stage fills the screen instead of
  // letterboxing — see src/utils/kidsStage.js for the policy and its reasons.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const fit = () => applyKidsStageMetrics(stage, window);
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  const profileRevision = useSyncExternalStore(
    callback => subscribeToStudentProfile(scopeKey, callback),
    () => studentProfileRevision,
    () => 0
  );
  void profileRevision;
  const companion = getCompanion(scopeKey);
  const wallet = readWallet(scopeKey);
  const activeTab = selectActiveStudentTab(active);
  const name = studentName || "Reader";
  const goTo = tabId => {
    if (tabId === "home" && onHome) return onHome();
    return onNavigate?.(tabId);
  };

  return (
    <div className="kg-viewport lp-rail-shell">
      <div className="kg-stage" ref={stageRef}>
        <div className="kg-ambient" aria-hidden="true" />

        <header className="kg-glass-chrome kg-header">
          <button
            type="button"
            className="kg-profile"
            onClick={onHome}
            aria-label="Go to your home page"
          >
            <span className="kg-avatar" aria-hidden="true">
              {companion?.image
                ? (
                  <img
                    src={companion.image}
                    alt=""
                    onError={event => { event.currentTarget.style.display = "none"; }}
                  />
                )
                : <strong>{name.slice(0, 1).toUpperCase()}</strong>}
            </span>
            <span className="kg-identity">
              <span className="kg-identity-name">{name}</span>
              {companion?.name && (
                <span className="kg-identity-pal">with {companion.name}</span>
              )}
            </span>
          </button>

          <span className="kg-spacer" />

          <Currency
            kind="stars"
            ok={wallet.ok}
            value={wallet.stars}
            caption="stars"
            label={wallet.ok
              ? `${wallet.stars} stars you have won.`
              : "Your stars are still loading."}
          />
          <Currency
            kind="coins"
            ok={wallet.ok}
            value={wallet.coins}
            caption="to spend"
            label={wallet.ok
              ? `${wallet.coins} coins to spend. Open your Hollow.`
              : "Your coins are still loading. Open your Hollow."}
            onClick={() => goTo("hollow")}
          />

          <button
            type="button"
            className="kg-iconbutton"
            onClick={onGrownUps}
            aria-label="Grown-ups"
          >
            <GlassIcon name="person" />
          </button>
        </header>

        {/* children are rendered as DIRECT children of .kg-main on purpose:
            screens that size themselves with `height: 100%` collapse to zero
            behind an extra wrapper div, because a percentage height needs a
            parent with a definite one. See kids-glass.css. */}
        <main className={`kg-main${contentScrolls ? " kg-main--scroll" : ""}`}>
          {children}
        </main>

        <nav
          className="kg-glass-chrome kg-tabbar"
          aria-label="Where to go"
          data-active-tab={activeTab}
        >
          {STUDENT_TAB_BAR.map(tab => {
            const on = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                className={`kg-tab${on ? " is-active" : ""}`}
                onClick={() => goTo(tab.id)}
                aria-current={on ? "page" : undefined}
                data-tab={tab.id}
              >
                <GlassIcon name={tab.icon} />
                <span className="kg-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
