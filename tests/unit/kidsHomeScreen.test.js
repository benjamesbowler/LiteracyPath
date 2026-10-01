// THE CHILD HOME SCREEN — phase B of the 2026-07-29 kids-side redesign.
//
// What these tests defend, in order of how badly it hurts when it breaks:
//
//   1. The single next action. The whole point of the redesign is that the old
//      home had a mission strip, a hero, two secondary cards and a drawer all
//      competing. A second primary here undoes the redesign, silently.
//   2. The two-currency cap. Stars and coins only. A streak sentence used to
//      live in this file's celebration copy; it is gone and must stay gone.
//   3. Invented numbers. Every count and name on this screen has to come from
//      real student state — the mock's figures are placeholders.
//   4. A read failure rendering as an empty-data claim ("nothing done yet" is a
//      statement about the child; a storage error is not).
//   5. Reachability for a pre-reader: art + icon + a short label for every
//      destination, and a speaker button on the screen.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { STUDENT_RAIL_DESTINATIONS } from "../../src/policy/studentRailPolicy.js";
import { STUDENT_HOME_ACTIVITY_TITLES } from "../../src/copy/studentNavigationCopy.js";
import { STUDENT_NAVIGATION_ART } from "../../src/policy/studentTabBar.js";

const source = readFileSync("src/components/StudentHomePage.jsx", "utf8");
const css = readFileSync("src/styles/kids-home.css", "utf8");
const preview = readFileSync("preview/home.jsx", "utf8");
// Comments explain the rules and legitimately name what was removed, so scans
// for forbidden copy run against the code with comments stripped.
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("the visual preview loads the production child layers in cascade order", () => {
  const requiredLayers = [
    "styles/fonts.js",
    "styles/sage-form.css",
    "styles/kids-glass.css",
    "styles/kids-home.css",
    "styles/kids-trail.css",
    "styles/kids-library.css",
    "styles/ui-quality-pass.css"
  ];
  let previousIndex = -1;
  for (const layer of requiredLayers) {
    const layerIndex = preview.indexOf(layer);
    assert.ok(layerIndex > previousIndex, `${layer} is missing or out of order in the Home preview`);
    previousIndex = layerIndex;
  }
});

test("the home screen has exactly one primary call to action", () => {
  assert.equal(
    (code.match(/data-child-primary=/g) || []).length,
    1,
    "two primaries is the competition the redesign removed"
  );
  assert.match(code, /data-child-emphasis="primary"/);
  assert.match(code, /data-child-emphasis="choice"/);
  // The three daily stops are a checklist, not three more buttons: they render
  // as list items so they cannot become rival calls to action.
  assert.match(code, /className="kg-home-daily-progress"/);
  assert.equal(
    /<button[^>]*data-mission-step/.test(code),
    false,
    "the daily stops must stay a read-only checklist"
  );
});

test("only stars and coins are countable in the child home", () => {
  // `(?<![.\w])` keeps a property access out of it: the hero art is
  // worldForScope(...).point, which is a pose, not a score.
  const hit = code.match(/(?<![.\w])(streak|flame|gems?|xp|points?|combo|high ?score|level up)\b/i);
  assert.equal(
    hit,
    null,
    `the child UI caps its numeric systems at stars and coins; found "${hit?.[0]}"`
  );
  // The celebration used to say "that's N school days in a row" (the file's own
  // header comment still names the sentence it removed, so scan the code).
  assert.equal(/school days in a row/.test(code), false);
});

test("every displayed value is read from real student state, never a mock figure", () => {
  // The hero: which activity, and the exact stop inside it.
  assert.match(code, /selectStudentHomeRecommendation\(\{/);
  assert.match(code, /campaignHomeSummary\(progress\.soundSeekers\)/);
  assert.match(code, /loadCampaignProgress\(scopeKey\)/);
  assert.doesNotMatch(code, /currentStopIndex|stopAtIndex/);
  assert.match(code, /mission\.book\?\.title/);
  assert.match(code, /mission\.game\?\.title/);
  // The daily stops: the same mission state the rest of the app writes.
  assert.match(code, /getMissionStatus\(progressScopeKey\)/);
  assert.match(code, /const done = kind => Boolean\(missionStatus\.done\[kind\]\)/);
  // The hero backdrop is the CLEAN plate, not the panorama that already has
  // pals painted into it — see the "one illustration" test below.
  assert.doesNotMatch(code, /className="kg-home-hero-art"/);
  // The doorway describes the task; it makes no stale catalogue-count claim.
  assert.match(code, /note: "Choose a game"/);
  assert.match(code, /homeProgress\.ok \? plan\.summary/);
  assert.equal(
    /"12 games"|"6 stars waiting"|"Stop 12/.test(code),
    false,
    "the prototype's placeholder figures must not be hard-coded"
  );
});

test("a progress read that failed never renders as an empty-data claim", () => {
  assert.match(code, /return \{ ok: false, value: \{\} \};/);
  assert.match(code, /ok: Object\.values\(areas\)\.every\(result => result\.ok\)/);
  assert.match(code, /data-read-state=\{homeProgress\.ok \? "ready" : "unreadable"\}/);
  assert.match(code, /homeProgress\.ok \? plan\.summary/);
  assert.match(source, /We could not open today/);
});

test("every destination is visible on ordinary Home without a disclosure", () => {
  const doorways = [...code.matchAll(/\{ id: "([a-z-]+)", activityId: /g)].map(match => match[1]);
  assert.deepEqual(doorways, ["map", "books", "stories", "arcade", "phonics", "words", "sounds", "hollow"]);
  for (const destination of STUDENT_RAIL_DESTINATIONS) assert.ok(doorways.includes(destination.id));
  assert.doesNotMatch(code, /<details className="kg-home-explore"/);
  assert.equal((code.match(/\n {6}id: "/g) || []).length, 7, "recommendation still uses the seven existing activity policies");
});

test("Home uses canonical short destination labels and selected simple art", () => {
  assert.deepEqual(Object.values(STUDENT_HOME_ACTIVITY_TITLES), ["Sound Seekers", "Letters", "Words", "Adventure Map", "Arcade", "Story Quests", "Books", "My Hollow"]);
  assert.match(code, /STUDENT_HOME_ACTIVITY_TITLES\[door\.activityId\]/);
  assert.match(code, /src=\{STUDENT_NAVIGATION_ART\[door\.id\]\}/);
  assert.deepEqual(Object.keys(STUDENT_NAVIGATION_ART), ["map", "books", "stories", "arcade", "phonics", "words", "sounds", "hollow"]);
  assert.doesNotMatch(code, /menu-simple-atlas|door\.atlas/, "each destination uses its own square object asset");
  assert.match(code, /!iconsOnly &&/);
  assert.doesNotMatch(code, /kg-home-create|kg-home-soundkeys-title/, "SoundKeys stays in Arcade");
});

test("the pre-reader affordances survive: speaker buttons and tap-to-hear", () => {
  assert.equal(
    (code.match(/aria-label="Hear this"/g) || []).length,
    1,
    "the continuation has one replay"
  );
  assert.match(code, /speakStudentRailLabel\(lines, window\)/);
  // The old rail spoke one destination per button; the section speaker queues
  // every visible doorway name as its own recorded Leda clip.
  assert.match(code, /\.\.\.doors\.map\(door => door\.title\)/);
  assert.match(code, /aria-label=\{`Hear \$\{door\.title\}`\}/);
  assert.match(code, /aria-live="polite"/);
});

test("reduced-choice mode and the grown-ups menu both survive the re-layout", () => {
  // Reduced choice runs through the SAME policy helper the rail used, so a
  // teacher setting cannot be lost by a layout change.
  assert.match(code, /selectStudentRailItems\(doorways, \{ active: "home", reducedChoiceMode \}\)/);
  assert.match(code, /loadStudentProfile\(progressScopeKey\)\.reducedChoiceMode/);
  // Grown-ups: the shell's header button opens the menu. Guide changes belong
  // in the Hollow (and cost stars), while sign-out stays protected here.
  assert.match(code, /onGrownUps=\{\(\) => setAccountOpen\(open => !open\)\}/);
  assert.match(code, /My Little Literacy Guide/);
  assert.match(code, /onClick=\{onOpenRewards\}/);
  assert.doesNotMatch(code, /setPickingCompanion\(true\)/);
  assert.match(code, /onClick=\{onLogout\}/);
  assert.match(code, /aria-label=\{logoutAriaLabel\}/);
});

test("Home gives cards natural rows and one scroll area instead of clipping them", () => {
  assert.match(css, /\.kg-stage \.kg-home \{[^}]*overflow: auto;/);
  assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /min-height: 56px/);
  assert.doesNotMatch(css, /kg-home-browse-toggle|details\.kg-home-explore|kg-home-guide-photo/);
});

test("the compact progress line keeps real read state without an extra route panel", () => {
  assert.match(code, /data-read-state=\{homeProgress\.ok \? "ready" : "unreadable"\}/);
  assert.match(code, /homeProgress\.ok \? plan\.summary/);
  assert.doesNotMatch(code, /className="kg-home-stops"/);
});

test("the hero and the strip never state the same next action twice", () => {
  // The shipped build put "Adventure Map / Stop 1 on the map" in the hero and
  // "Adventure Map / Up next" in the strip directly under it. The strip drops
  // the stop the hero already owns; the count still reports all three.
  assert.match(code, /function planTodaysStops\(/);
  assert.match(code, /const heroOwnsNext = Boolean\(/);
  assert.match(code, /heroOwnsNext\s*\n?\s*\?\s*DAILY_STOPS\.filter\(stop => stop\.kind !== heroMissionKind\)/);
  assert.match(code, /heroMissionKind: primary\?\.missionKind \|\| ""/);
  assert.match(code, /data-mission-hero-owns-next=/);
  // The heading tells the child what the shortened strip is.
  assert.match(source, /"Then two more today"/);
  assert.match(source, /"Then one more today"/);
});

test("the stops count names a real number and promises no stars", () => {
  // "Three stops to go" sat beside a star glyph and named a star total nothing
  // awards — books give none. A tick in a ring counts finished tasks and claims
  // nothing about treasure.
  assert.match(code, /`\$\{doneCount\} of 3 done`/);
  assert.equal(
    /StarGlyph/.test(code),
    false,
    "the stops chip must not carry a star: no star total exists for the daily stops"
  );
  assert.match(code, /className="kg-home-daily-progress"/);
});

test("the familiar Guide stays in the shell without a duplicate giant Home portrait", () => {
  assert.match(code, /<StudentGlassShell/);
  assert.match(code, /scopeKey=\{progressScopeKey\}/);
  assert.doesNotMatch(code, /className="kg-home-guide"|className="kg-home-hero-art"/);
  assert.match(code, /My Little Literacy Guide/);
});

test("the home stylesheet takes system classes and re-declares no glass recipe", () => {
  // Every rule stage-scoped, for the same reason kids-glass.css is: App.css's
  // `.app button` is (0,1,1) and would otherwise outrank the screen.
  const selectors = [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(^|\n)([^{}@\n][^{}\n]*?)\s*\{/g)]
    .map(match => match[2].trim())
    .filter(selector => /^[.:[]|^[a-z]/i.test(selector) && !/^(?:from|to|\d+%)/.test(selector));
  const unscoped = selectors.filter(selector => (
    !selector.split(",").every(part => /(^|\s)\.kg-stage(\s|\.|:)/.test(part.trim()))
  ));
  assert.deepEqual(unscoped, [], `unscoped home rules lose to App.css: ${unscoped.join(" | ")}`);
  // The glass itself belongs to the system file. A backdrop-filter here means a
  // recipe was copied instead of a class being used.
  assert.equal(
    /backdrop-filter/.test(css),
    false,
    "take a glass class from kids-glass.css; never re-declare the recipe in a screen"
  );
  assert.equal(
    /text-shadow/.test(css),
    false,
    "reaching for text-shadow means the scrim is missing"
  );
  assert.match(css, /\.kg-stage \.kg-home-continue/);
});
