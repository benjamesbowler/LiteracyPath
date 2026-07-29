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

const source = readFileSync("src/components/StudentHomePage.jsx", "utf8");
const css = readFileSync("src/styles/kids-home.css", "utf8");
// Comments explain the rules and legitimately name what was removed, so scans
// for forbidden copy run against the code with comments stripped.
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

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
  assert.match(code, /<li\s+key=\{stop\.kind\}/);
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
  assert.match(code, /currentStopIndex\(progress\.soundSeekers\)/);
  assert.match(code, /stopAtIndex\(index\)/);
  assert.match(code, /mission\.book\?\.title/);
  assert.match(code, /mission\.game\?\.title/);
  // The daily stops: the same mission state the rest of the app writes.
  assert.match(code, /getMissionStatus\(progressScopeKey\)/);
  assert.match(code, /status\.done\[stop\.kind\]/);
  // The Arcade doorway counts the real arcade list; the mock says twelve.
  assert.match(code, /GAME_LIST\.filter\(game => \(game\.surfaces \|\| \[\]\)\.includes\("arcade"\)/);
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
  assert.match(code, /homeProgress\.ok \? \(/);
  assert.match(source, /We could not open today/);
});

test("every rail destination is still reachable from the home screen", () => {
  // Six doorways cover six of the seven; Sound Seekers is the hero and also the
  // Sounds tab. Nothing was culled — the redesign is a re-layout.
  const doorways = [...code.matchAll(/\{ id: "([a-z-]+)", title: "/g)].map(match => match[1]);
  assert.deepEqual(doorways, ["map", "books", "stories", "arcade", "phonics", "hollow"]);
  const reachable = new Set([...doorways, "sounds"]);
  for (const destination of STUDENT_RAIL_DESTINATIONS) {
    assert.ok(
      reachable.has(destination.id),
      `${destination.id} has no way in from the home screen`
    );
  }
  // Every activity the recommendation policy can pick still has a callback.
  assert.equal((code.match(/\n {6}id: "/g) || []).length, 7);
});

test("the doorways carry the spec's titles, notes, tints and art", () => {
  for (const [title, note, tint, art] of [
    ["Adventure Map", "Win stars", "--kg-tint-map", "adventure-map"],
    ["Books", "Real books", "--kg-tint-books", "reading-library"],
    ["Story Quests", "You choose", "--kg-tint-stories", "story-quests"],
    ["Arcade", null, "--kg-tint-arcade", "arcade"],
    ["Letters", "Sounds and writing", "--kg-tint-letters", "phonics"],
    ["My Hollow", "Make it yours", "--kg-tint-hollow", "my-hollow"]
  ]) {
    const row = code.match(new RegExp(`title: "${title}", note: [^\\n]*`));
    assert.ok(row, `the ${title} doorway is missing`);
    if (note) assert.ok(row[0].includes(`"${note}"`), `${title}'s note is not the spec's`);
    assert.ok(row[0].includes(tint), `${title} does not use ${tint}`);
    assert.ok(row[0].includes(`/images/home-sage/${art}.webp`), `${title} has the wrong art`);
  }
  // A pre-reader navigates by picture and icon; the note is the only part the
  // icons-only preference may remove.
  assert.match(code, /\{!iconsOnly && \(/);
});

test("the pre-reader affordances survive: speaker buttons and tap-to-hear", () => {
  assert.equal(
    (code.match(/aria-label="Hear this"/g) || []).length,
    2,
    "the spec puts a speaker on the hero and on the doorway heading"
  );
  assert.match(code, /speakStudentRailLabel\(text, window\)/);
  // The old rail spoke one destination per button; the section speaker has to
  // read every doorway name or a pre-reader loses them.
  assert.match(code, /doors\.map\(door => door\.title\)\.join\(""?\. ""?\)/);
  assert.match(code, /aria-live="polite"/);
});

test("reduced-choice mode and the grown-ups menu both survive the re-layout", () => {
  // Reduced choice runs through the SAME policy helper the rail used, so a
  // teacher setting cannot be lost by a layout change.
  assert.match(code, /selectStudentRailItems\(doorways, \{ active: "home", reducedChoiceMode \}\)/);
  assert.match(code, /loadStudentProfile\(progressScopeKey\)\.reducedChoiceMode/);
  // Grown-ups: the shell's header button opens the menu that holds change
  // companion and sign out.
  assert.match(code, /onGrownUps=\{\(\) => setAccountOpen\(open => !open\)\}/);
  assert.match(code, /setPickingCompanion\(true\)/);
  assert.match(code, /onClick=\{onLogout\}/);
  assert.match(code, /aria-label=\{logoutAriaLabel\}/);
});

test("the home layout is built to the spec's geometry on the fixed canvas", () => {
  assert.match(css, /grid-template-rows:\s*232px auto minmax\(0, 1fr\);/);
  assert.match(css, /gap:\s*var\(--kg-space-13\);/);
  assert.match(css, /border-radius:\s*var\(--kg-radius-hero\);/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) 250px;/);
  assert.match(css, /padding:\s*18px 22px;/);
  assert.match(css, /padding:\s*var\(--kg-space-13\) var\(--kg-space-22\) 15px;/);
  assert.match(
    css,
    /repeating-linear-gradient\(\s*90deg,\s*rgba\(62, 119, 107, 0\.3\) 0 10px,\s*transparent 10px 22px\s*\)/,
    "the dashed connector is the thing that makes three circles read as one path"
  );
  assert.match(css, /left:\s*17%;\s*right:\s*17%;\s*top:\s*32px;\s*height:\s*4px;/);
  assert.match(css, /width:\s*64px;\s*height:\s*64px;\s*border-radius:\s*50%;/);
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
  // The bob/centring collision: the hero's companion is a wrapper plus an inner
  // animated <img>, and the wrapper must never own a transform.
  const pal = css.match(/\.kg-stage \.kg-home-hero-pal\.kg-sprite \{[\s\S]*?\n\}/);
  assert.ok(pal, "the hero sprite wrapper is gone");
  assert.equal(/(^|[^-])transform:/.test(pal[0]), false);
  assert.match(code, /<img className="kg-bob"/);
});
