// THE CHILD SHELL — phase A of the 2026-07-29 kids-side redesign.
//
// What these tests are defending, in order of how badly it hurts when it breaks:
//
//   1. A sub-screen that leaves the bottom bar with nothing lit. A five-year-old
//      who cannot read the title reads the lit tab instead; an unlit bar tells
//      them they are lost.
//   2. A third counter in the child header. The prior build surfaced roughly
//      eight numeric systems; the redesign caps it at two, and that cap erodes
//      one well-meant counter at a time unless something says no.
//   3. The three glass rules that are invisible until a real device shows them:
//      the missing -webkit- prefix, the missing saturate(), and a text-shadow
//      standing in for a scrim.
//   4. The bob-versus-centring-transform collision, which cost real debugging
//      time once already and would cost it again on every node scene in phases
//      C and F.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  STUDENT_RAIL_DESTINATIONS,
  STUDENT_RAIL_HOME,
  STUDENT_RAIL_ICON_PATHS,
  STUDENT_TAB_BAR,
  selectActiveStudentTab,
  validateStudentTabCoverage
} from "../../src/policy/studentRailPolicy.js";
import {
  KIDS_CONTENT_HEIGHT,
  KIDS_HEADER_HEIGHT,
  KIDS_STAGE_HEIGHT,
  KIDS_STAGE_MAX_WIDTH,
  KIDS_STAGE_MIN_WIDTH,
  KIDS_STAGE_WIDTH,
  KIDS_TABBAR_HEIGHT,
  applyKidsStageMetrics,
  computeKidsStageMetrics,
  computeKidsStageScale,
  computeKidsStageWidth,
  readKidsVisibleViewport
} from "../../src/utils/kidsStage.js";

const css = readFileSync("src/styles/kids-glass.css", "utf8");
const shellSource = readFileSync("src/components/StudentGlassShell.jsx", "utf8");
const appSource = readFileSync("src/components/AppSurface.jsx", "utf8");

// ── The tab bar that replaced the rail ──────────────────────────────────────

test("the bottom bar is the spec's five tabs, each with an icon that exists", () => {
  assert.deepEqual(
    STUDENT_TAB_BAR.map(tab => tab.id),
    ["home", "sounds", "books", "games", "hollow"]
  );
  assert.deepEqual(
    STUDENT_TAB_BAR.map(tab => tab.label),
    ["Home", "Sounds", "Books", "Games", "Hollow"]
  );
  for (const tab of STUDENT_TAB_BAR) {
    assert.ok(
      STUDENT_RAIL_ICON_PATHS[tab.icon],
      `tab "${tab.id}" names icon "${tab.icon}", which has no path`
    );
  }
});

test("Story Quests lights Books, the Adventure Map lights Sounds, and no place leaves the bar dark", () => {
  assert.equal(selectActiveStudentTab("stories"), "books");
  assert.equal(selectActiveStudentTab("map"), "sounds");
  // Letters/Phonics has no tab of its own either — it belongs to Sounds, the
  // same way the prototype's "Letters" doorway does.
  assert.equal(selectActiveStudentTab("phonics"), "sounds");
  assert.equal(selectActiveStudentTab("arcade"), "games");
  assert.equal(selectActiveStudentTab("sounds"), "sounds");
  assert.equal(selectActiveStudentTab("books"), "books");
  assert.equal(selectActiveStudentTab("hollow"), "hollow");
  assert.equal(selectActiveStudentTab("home"), "home");

  // Every place the child area can be in, including ones this policy has never
  // heard of, still lights exactly one real tab.
  const tabIds = new Set(STUDENT_TAB_BAR.map(tab => tab.id));
  for (const place of [STUDENT_RAIL_HOME, ...STUDENT_RAIL_DESTINATIONS]) {
    assert.ok(tabIds.has(selectActiveStudentTab(place.id)), `${place.id} lit no tab`);
  }
  for (const junk of ["", null, undefined, "not-a-place", 0, {}]) {
    assert.equal(selectActiveStudentTab(junk), "home");
  }
});

test("the destination registry and the tab bar cannot drift apart", () => {
  assert.deepEqual(validateStudentTabCoverage(), {
    pass: true,
    unmapped: [],
    unusedTabs: []
  });
  // A new destination with no tab is the failure this guard exists for.
  assert.deepEqual(
    validateStudentTabCoverage([{ id: "letters-lab", tab: "letters" }]).unmapped,
    ["letters-lab"]
  );
  // A tab nothing can light is dead chrome.
  assert.deepEqual(
    validateStudentTabCoverage([{ id: "home", tab: "home" }]).unusedTabs,
    ["sounds", "books", "games", "hollow"]
  );
});

test("the redesign is a re-layout, not a cull: every rail destination survives", () => {
  assert.equal(STUDENT_RAIL_DESTINATIONS.length, 7);
  assert.deepEqual(
    STUDENT_RAIL_DESTINATIONS.map(item => item.id),
    ["sounds", "phonics", "map", "books", "stories", "arcade", "hollow"]
  );
});

test("every tab the bar draws has a navigation action in the app shell", () => {
  const block = appSource.match(/const studentTabActions = \{[\s\S]*?\n {2}\};/);
  assert.ok(block, "could not find studentTabActions in AppSurface.jsx");
  for (const tab of STUDENT_TAB_BAR) {
    assert.match(
      block[0],
      new RegExp(`(^|[\\s{])${tab.id}:`, "m"),
      `the "${tab.id}" tab has no action — a child taps it and nothing happens`
    );
  }
});

// ── The canvas: fixed height, viewport-filling width ────────────────────────
//
// CHANGED 2026-07-29 (foundation pass). The canvas used to be a fixed
// 1194 x 834 box scaled by min(w/1194, h/834), which preserves the canvas
// ASPECT and therefore letterboxes every viewport that is not 1.43:1 — 125px of
// bare page down each side at 1280 x 720, 187px at 1920 x 1080. The height is
// now the fixed part and the width follows the viewport, so the stage fills the
// screen and the dead margin is gone by construction. 1194 x 834 is still the
// exact fixed point: scale 1, width 1194.

test("the authoring canvas is 1194 x 834 and the chrome takes 78 + 92 of it", () => {
  assert.equal(KIDS_STAGE_WIDTH, 1194);
  assert.equal(KIDS_STAGE_HEIGHT, 834);
  assert.equal(KIDS_HEADER_HEIGHT, 78);
  assert.equal(KIDS_TABBAR_HEIGHT, 92);
  assert.equal(KIDS_CONTENT_HEIGHT, 664);
  // The height is the constant every screen budgets against; the width token is
  // the authoring reference and the no-JS fallback, overwritten inline by the
  // shell with what the viewport actually affords.
  assert.match(css, /--kg-stage-width:\s*1194px/);
  assert.match(css, /--kg-stage-height:\s*834px/);
  assert.match(css, /--kg-header-height:\s*78px/);
  assert.match(css, /--kg-tabbar-height:\s*92px/);
  assert.equal(KIDS_STAGE_MIN_WIDTH, 1024);
  assert.equal(KIDS_STAGE_MAX_WIDTH, 3200);
});

test("the scale follows the height, and the width only when the stage would go under 1024", () => {
  assert.equal(computeKidsStageScale(1194, 834), 1);
  // Wider than the canvas but the same height: the scale does not move, the
  // canvas gets wider instead.
  assert.equal(computeKidsStageScale(1440, 834), 1);
  assert.equal(computeKidsStageScale(2388, 1668), 2);
  // 1024 x 768: width binds, because 834 design px of height would need more
  // room than 1024 design px of width leaves.
  assert.equal(
    computeKidsStageScale(1024, 768).toFixed(4),
    (768 / 834).toFixed(4)
  );
  // Portrait: width binds and the stage letterboxes top-and-bottom rather than
  // breaking the six-doorway row. 1024/1024 = 1 is smaller than 1366/834.
  assert.equal(computeKidsStageScale(1024, 1366), 1);
  // A stage at scale 0 or NaN is an invisible app; natural size is the safe
  // failure.
  for (const bad of [[0, 0], [-5, 900], [NaN, 900], [undefined, undefined], ["x", "y"]]) {
    assert.equal(computeKidsStageScale(bad[0], bad[1]), 1);
  }
  // Floor, so a tiny window clips rather than producing unreadable text.
  assert.equal(computeKidsStageScale(200, 150), 0.4);
});

test("the stage fills the viewport width at every size the owner reviews at", () => {
  // THE DEFECT THIS PINS: the owner's first note on the deployed build was that
  // "huge space at either side of every page is wasted". Width x scale must come
  // back as the viewport width, or the letterbox is back.
  for (const [width, height] of [
    [1194, 834],   // iPad landscape, the guaranteed-correct case
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [1024, 768]
  ]) {
    const { scale, stageWidth } = computeKidsStageMetrics(width, height);
    assert.equal(
      Math.round(stageWidth * scale),
      width,
      `${width} x ${height} leaves ${width - stageWidth * scale}px of dead page`
    );
    assert.ok(
      stageWidth >= KIDS_STAGE_MIN_WIDTH && stageWidth <= KIDS_STAGE_MAX_WIDTH,
      `${width} x ${height} produced a ${stageWidth} design-px canvas`
    );
  }
  // The iPad target is the exact fixed point of the whole policy.
  assert.deepEqual(computeKidsStageMetrics(1194, 834), { scale: 1, stageWidth: 1194 });
  // A 21:9 display still fills edge to edge. The safety ceiling exists only
  // for extreme display walls, not ordinary review monitors.
  assert.equal(
    Math.round(computeKidsStageWidth(3440, 1440) * computeKidsStageScale(3440, 1440)),
    3440
  );
  // A read with no viewport falls back to the authoring width, never to zero.
  assert.equal(computeKidsStageWidth(0, 0), KIDS_STAGE_WIDTH);
});

test("the metrics are written to the DOM as custom properties, not held in React state", () => {
  const written = {};
  const element = { style: { setProperty: (name, value) => { written[name] = value; } } };
  const metrics = applyKidsStageMetrics(element, { innerWidth: 1194, innerHeight: 834 });
  assert.deepEqual(metrics, { scale: 1, stageWidth: 1194 });
  assert.equal(written["--kg-scale"], "1");
  assert.equal(written["--kg-stage-width"], "1194px");
  assert.equal(written["--kg-physical-hit"], "56px");
  assert.equal(written["--kg-physical-answer-width"], "80px");
  assert.equal(written["--kg-physical-answer-height"], "64px");
  const portraitTabletWritten = {};
  applyKidsStageMetrics(
    { style: { setProperty: (name, value) => { portraitTabletWritten[name] = value; } } },
    { innerWidth: 768, innerHeight: 1024 }
  );
  assert.equal(
    portraitTabletWritten["--kg-physical-hit"],
    "56px",
    "the native portrait-tablet layout must not compensate for a transform it does not use"
  );
  assert.equal(portraitTabletWritten["--kg-physical-answer-width"], "80px");
  assert.equal(portraitTabletWritten["--kg-physical-answer-height"], "64px");
  const shortTabletWritten = {};
  const shortTabletMetrics = applyKidsStageMetrics(
    { style: { setProperty: (name, value) => { shortTabletWritten[name] = value; } } },
    { innerWidth: 1024, innerHeight: 650 }
  );
  assert.ok(
    (Number.parseFloat(shortTabletWritten["--kg-physical-answer-width"]) * shortTabletMetrics.scale) >= 80
  );
  assert.ok(
    (Number.parseFloat(shortTabletWritten["--kg-physical-answer-height"]) * shortTabletMetrics.scale) >= 64
  );
  assert.deepEqual(
    applyKidsStageMetrics(null, { innerWidth: 800, innerHeight: 600 }),
    { scale: 1, stageWidth: KIDS_STAGE_WIDTH }
  );

  // The shell must not setState inside the effect (react-hooks/set-state-in-effect)
  // and must clean its listeners up.
  assert.match(shellSource, /applyKidsStageMetrics\(stage, window\)/);
  assert.doesNotMatch(shellSource, /useState/);
  assert.match(shellSource, /removeEventListener\("resize", fit\)/);
});

test("iPad sizing follows Safari's visible viewport instead of space behind its browser bars", () => {
  const safariWindow = {
    innerWidth: 1194,
    innerHeight: 834,
    visualViewport: { width: 1194, height: 720, offsetLeft: 0, offsetTop: 52 }
  };
  assert.deepEqual(readKidsVisibleViewport(safariWindow), {
    width: 1194,
    height: 720,
    offsetLeft: 0,
    offsetTop: 52
  });
  const written = {};
  const element = { style: { setProperty: (name, value) => { written[name] = value; } } };
  const metrics = applyKidsStageMetrics(element, safariWindow);
  assert.equal(metrics.scale.toFixed(4), (720 / 834).toFixed(4));
  assert.equal(Math.round(metrics.stageWidth * metrics.scale), 1194);
  assert.match(shellSource, /window\.visualViewport\?\.addEventListener\("resize", fit\)/);
  assert.match(css, /height:\s*var\(--kg-visible-height, 100dvh\)/);
});

test("child buttons cannot turn a game tap into selected text", () => {
  const appCss = readFileSync("src/App.css", "utf8");
  assert.match(
    appCss,
    /\.student-mode-app :is\(button, \[role="button"\]\)[\s\S]*?-webkit-user-select:\s*none;[\s\S]*?touch-action:\s*manipulation;/
  );
});

test("the stage centres with a translate inside the scaled transform, never with place-items", () => {
  // The trap from docs/PRESENT_REDESIGN_2026-07-28.md: Chromium start-aligns a
  // grid item that overflows its track, so grid centring clipped the top-left
  // of the present-mode stage on every window smaller than the canvas.
  assert.match(
    css,
    /\.kg-stage\s*\{[^}]*transform:\s*translate\(-50%,\s*-50%\)\s*scale\(var\(--kg-scale[^}]*\}/,
    "the stage must centre with a translate in the same transform it scales in"
  );
  assert.match(css, /\.kg-viewport\s*\{[^}]*place-items:\s*initial/);
});

test("a screen that sizes itself with height:100% is a DIRECT child of the content area", () => {
  // Found by measurement, not by reading: wrapping the children in one extra
  // div collapsed every `height: 100%` frame to 0px, because a percentage
  // height only resolves against a parent with a definite one. The Story Quests
  // surface is exactly that shape (storyQuestSurface.test.js pins its
  // `height: 100%` rules), so this is a screen going blank, not a style nit.
  assert.match(
    shellSource,
    /<main className=\{`kg-main\$\{contentScrolls \? " kg-main--scroll" : ""\}`\}>\s*\{children\}\s*<\/main>/,
    "children must not be wrapped in an extra element inside .kg-main"
  );
  assert.match(css, /\.kg-main--scroll > \* \{\s*min-height: 100%;/);
  assert.equal(
    css.includes(".kg-legacy"),
    false,
    "the .kg-legacy wrapper broke the percentage-height chain; do not reintroduce it"
  );
});

// ── The cascade the design system has to win ────────────────────────────────

test("every rule in the system is scoped under .kg-stage, or App.css outranks it", () => {
  // Phase B measured this: the child area renders inside AppSurface's
  // `app student-mode-app` shell, and App.css styles EVERY button under `.app`
  // (`display: inline-flex; border: none; border-radius: 14px; padding: 10px
  // 16px; font-size: 15px`). That selector is (0,1,1) and a bare `.kg-button`
  // is (0,1,0), so the generic chrome won: a .kg-button--lg rendered at 14px
  // radius and 15px type, and a Home doorway's grid became inline-flex, which
  // collapsed its artwork to zero height. The `.kg-stage ` prefix ties the
  // specificity and load order (main.jsx imports this file after App.css)
  // settles it. An unscoped rule added later is silently overridden, so it is
  // pinned here rather than left to be rediscovered.
  const unscoped = [];
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of withoutComments.matchAll(/(^|\n)([ \t]*)([^{}@\n][^{}\n]*?)\s*\{/g)) {
    const selector = match[3].trim();
    // Blocks that are not selectors, and the two roots the prefix comes from.
    if (/^(?:from|to|\d+%|@|[\w-]+:)/.test(selector)) continue;
    if (!/^[.:[]|^[a-z]/i.test(selector)) continue;
    if (/^\.kg-viewport(,|$)/.test(selector) || /^\.kg-stage(\b|,|$)/.test(selector)) continue;
    if (selector.split(",").every(part => /(^|\s)\.kg-stage(\s|\.|:)/.test(part.trim()))) continue;
    unscoped.push(selector);
  }
  assert.deepEqual(
    unscoped,
    [],
    `these rules are not scoped under .kg-stage and lose to App.css's .app button: ${unscoped.join(" | ")}`
  );
});

test("the hover treatment cancels App.css's 1px lift — a touch design keeps geometry static", () => {
  // App.css: `.app button:hover:not(:disabled):not(.sbq-stop) { transform:
  // translateY(-1px) }`. The spec's allowance is a background-alpha change and
  // nothing else, and a card that jumps under a five-year-old's finger is the
  // thing that rules out.
  assert.match(
    css,
    /\.kg-stage button:hover:not\(:disabled\):not\(\.sbq-stop\) \{[^}]*transform: none;/,
    "the app-wide hover lift must be cancelled inside the stage"
  );
});

// ── The liquid-glass recipe ─────────────────────────────────────────────────

function declarations(property) {
  return [...css.matchAll(new RegExp(`^\\s*${property}:\\s*([^;]+);`, "gm"))]
    .map(match => match[1].replace(/\s+/g, " ").trim());
}

test("every backdrop-filter ships the -webkit- prefix and pairs blur with saturate", () => {
  const standard = declarations("backdrop-filter");
  const prefixed = declarations("-webkit-backdrop-filter");
  assert.ok(standard.length >= 6, `only ${standard.length} backdrop-filters found — the scan has drifted`);
  assert.deepEqual(
    standard,
    prefixed,
    "iPad Safari is the primary device: every backdrop-filter needs the -webkit- twin, in the same order and with the same value"
  );
  for (const value of standard) {
    // Reduced-transparency modes intentionally turn glass off. `none` still
    // needs the Safari prefix above, but it cannot contain blur/saturate.
    if (value === "none") continue;
    assert.match(value, /blur\(/, `backdrop-filter "${value}" has no blur`);
    assert.match(
      value,
      /saturate\(/,
      `backdrop-filter "${value}" has no saturate() — unsaturated blur turns the warm ambient gradient grey`
    );
  }
});

test("tier 2 keeps the inset highlight and the ambient-occlusion spread", () => {
  const tier2 = css.match(/^\.kg-stage \.kg-glass \{[\s\S]*?\n\}/m);
  assert.ok(tier2, "the tier-2 .kg-glass rule is gone");
  assert.match(
    tier2[0],
    /inset 0 1px 1px rgba\(255, 255, 255, 0\.9\)/,
    "the inset highlight is what sells the glass — keep it"
  );
  assert.match(
    tier2[0],
    /0 14px 30px -24px rgba\(30, 60, 50, 0\.55\)/,
    "the large negative spread is deliberate: it reads as ambient occlusion, not a drop shadow"
  );
  assert.match(tier2[0], /background: rgba\(255, 255, 255, 0\.5\)/);
});

test("the three tiers plus accent and deep glass all exist and are dark where they must be", () => {
  for (const tier of [
    ".kg-glass-chrome",
    ".kg-glass",
    ".kg-glass-dark",
    ".kg-glass-accent",
    ".kg-glass-deep"
  ]) {
    assert.ok(css.includes(`.kg-stage ${tier} {`), `${tier} is missing from the system`);
  }
  // Tier 3 and the deep glass are the only places white ink is legal, and they
  // are dark precisely so it is.
  assert.match(css.match(/^\.kg-stage \.kg-glass-dark \{[\s\S]*?\n\}/m)[0], /background: rgba\(18, 44, 38, 0\.5\)/);
  assert.match(css.match(/^\.kg-stage \.kg-glass-deep \{[\s\S]*?\n\}/m)[0], /color: #FFFFFF/);
});

test("there is no text-shadow anywhere — a missing scrim is what makes you want one", () => {
  // Comments explain the rule and name the thing they forbid, so scan the
  // declarations rather than the prose.
  const cssCode = css.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal(
    /text-shadow/i.test(cssCode),
    false,
    "reaching for text-shadow means the scrim is missing; use .kg-scrim + .kg-on-art instead"
  );
  assert.ok(css.includes(".kg-scrim::after"), "the scrim must paint over the artwork");
  assert.match(
    css.match(/^\.kg-stage \.kg-on-art \{[\s\S]*?\n\}/m)[0],
    /color: #FFFFFF/,
    "white ink belongs to .kg-on-art, which only exists inside a scrim"
  );
});

// ── Motion ──────────────────────────────────────────────────────────────────

test("the sprite wrapper centres with margins so bob's transform cannot destroy it", () => {
  const sprite = css.match(/^\.kg-stage \.kg-sprite \{[\s\S]*?\n\}/m);
  assert.ok(sprite, ".kg-sprite is gone — the animation gotcha is unguarded");
  assert.match(sprite[0], /margin-left: calc\(var\(--kg-sprite-size[^)]*\) \/ -2\)/);
  assert.equal(
    /(^|[^-])transform:/.test(sprite[0]),
    false,
    "kgBob animates transform on the inner img and would overwrite a centring transform here — centre with negative margins"
  );
  assert.match(css, /\.kg-sprite > img,\s*\n\.kg-stage \.kg-bob \{[\s\S]*?animation: kgBob/);
});

test("all animation is off under reduced motion, without silencing a teaching animation", () => {
  const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
  assert.ok(block, "kids-glass.css has no reduced-motion block");
  for (const cls of [".kg-bob", ".kg-halo", ".kg-pop", ".kg-motion", ".kg-sprite > img"]) {
    assert.ok(block[1].includes(cls), `${cls} still animates under reduced motion`);
  }
  assert.match(block[1], /animation: none/);
  // The letter-writing demo MODELS how to form a letter and must play even when
  // Reduce Motion is on; a blanket `*` disable in this file would silence it.
  assert.equal(block[1].includes(".letter-writer"), false);
  assert.equal(
    /\.kg-stage \*[\s,]/.test(block[1]),
    false,
    "disable named animation classes, not everything inside the stage"
  );
});

// ── Two currencies, a focus ring, and a 56px floor ──────────────────────────

test("the child header shows stars and coins and nothing else countable", () => {
  assert.match(shellSource, /kg-currency kg-currency--\$\{kind\}/);
  const kinds = [...shellSource.matchAll(/kind="([a-z]+)"/g)].map(match => match[1]);
  assert.deepEqual(
    kinds,
    ["stars", "coins"],
    "the header renders exactly two currencies: stars (earned) and coins (spendable)"
  );
  const forbidden = /\b(streak|flame|gems?|xp|points?|combo|score|level up)\b/i;
  // Comments explain the rule and legitimately name what was removed, so scan
  // the code with block comments stripped.
  const code = shellSource.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const hit = code.match(forbidden);
  assert.equal(
    hit,
    null,
    `the child header must show two currencies only; found "${hit?.[0]}" — the prior build surfaced about eight numeric systems and the spec forbids reintroducing them`
  );
  // Stars are the stars actually earned, not treasury.gems (which also folds in
  // books and stories, and "gems" is one of the systems that was removed).
  assert.match(code, /breakdown\.questStars/);
  assert.match(code, /breakdown\.gameStars/);
  assert.match(code, /breakdown\.soundSeekerStars/);
  assert.equal(/treasury\.gems/.test(code), false);
});

test("a wallet that cannot be read says so instead of claiming the child has nothing", () => {
  assert.match(shellSource, /ok: false/);
  assert.match(shellSource, /wallet\.ok\s*\?/);
  assert.match(shellSource, /still loading/);
});

test("the child wallet refreshes for every local progress write and cross-tab change", () => {
  assert.match(shellSource, /lp-progress-updated/);
  assert.match(shellSource, /addEventListener\("storage"/);
});

test("the shell adds the focus ring the prototype does not ship", () => {
  const focus = css.match(/\.kg-stage :is\(button[^{]*\):focus-visible \{[\s\S]*?\n\}/);
  assert.ok(focus, "no focus-visible rule — the a11y pass needs one");
  assert.match(focus[0], /outline: 3px solid var\(--kg-accent\) !important/);
  // App.css and lg-design-system.css both set focus styling with !important;
  // without matching it the ring is teal and the glass loses its border.
  assert.match(focus[0], /box-shadow: var\(--kg-self-shadow, none\) !important/);
});

test("56 x 56 is enforced as a floor for everything a child taps", () => {
  assert.match(css, /--kg-hit:\s*56px/);
  const floor = css.match(/\.kg-hit,[\s\S]*?\n\}/);
  assert.ok(floor, "the 56px floor rule is gone");
  for (const cls of [".kg-button", ".kg-speaker", ".kg-iconbutton", ".kg-tab", ".kg-chip"]) {
    assert.ok(floor[0].includes(cls), `${cls} is not covered by the 56px floor`);
  }
  // App.css forces .lp-button geometry with !important; the floor has to match
  // it or a child control silently shrinks below the target size.
  assert.match(floor[0], /min-width: var\(--kg-hit\) !important/);
  assert.match(floor[0], /min-height: var\(--kg-hit\) !important/);
  assert.match(css, /min-width: var\(--kg-physical-hit\) !important/);
  assert.match(css, /min-height: var\(--kg-physical-hit\) !important/);
  assert.match(
    css,
    /\.kg-stage \.kg-speaker--lg \{[\s\S]*?width:\s*66px;[\s\S]*?height:\s*66px;/,
    "the large speaker must be large in both dimensions before stage scaling"
  );
});

test("the header and the tab bar are built to the spec's exact geometry", () => {
  const header = css.match(/^\.kg-stage \.kg-header \{[\s\S]*?\n\}/m)[0];
  assert.match(header, /height: var\(--kg-header-height\)/);
  assert.match(header, /padding: 0 var\(--kg-space-22\)/);
  assert.match(header, /gap: 12px/);

  const tabbar = css.match(/^\.kg-stage \.kg-tabbar \{[\s\S]*?\n\}/m)[0];
  assert.match(tabbar, /height: var\(--kg-tabbar-height\)/);
  assert.match(tabbar, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(tabbar, /gap: 12px/);
  assert.match(tabbar, /padding: 0 var\(--kg-space-20\)/);

  const tab = css.match(/^\.kg-stage \.kg-tab \{[\s\S]*?\n\}/m)[0];
  assert.match(tab, /height: var\(--kg-tab-height\)/);
  assert.match(tab, /border-radius: var\(--kg-radius-card\)/);
  assert.match(css, /--kg-tab-height:\s*68px/);
  assert.match(css, /--kg-radius-card:\s*20px/);
});

test("the shell is one stage with one header, one content area and one bar", () => {
  for (const marker of [
    "kg-viewport",
    "kg-stage",
    "kg-ambient",
    "kg-glass-chrome kg-header",
    "kg-main",
    "kg-glass-chrome kg-tabbar"
  ]) {
    assert.ok(shellSource.includes(marker), `the shell no longer renders ${marker}`);
  }
  assert.match(shellSource, /aria-current=\{on \? "page" : undefined\}/);
  assert.match(shellSource, /aria-hidden="true"/);
});
