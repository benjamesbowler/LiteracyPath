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
import { PAL_WORLDS } from "../../src/utils/palWorlds.js";

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
  assert.match(code, /const done = kind => Boolean\(missionStatus\.done\[kind\]\)/);
  // The hero backdrop is the CLEAN plate, not the panorama that already has
  // pals painted into it — see the "one illustration" test below.
  assert.match(code, /src=\{world\.backdrop\}/);
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

test("the home layout keeps the spec's vertical geometry and assumes no fixed width", () => {
  assert.match(css, /grid-template-rows:\s*232px auto minmax\(0, 1fr\);/);
  assert.match(css, /gap:\s*var\(--kg-space-13\);/);
  assert.match(css, /border-radius:\s*var\(--kg-radius-hero\);/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) 250px;/);
  assert.match(css, /padding:\s*18px 22px;/);
  assert.match(
    css,
    /repeating-linear-gradient\(\s*90deg,\s*rgba\(62, 119, 107, 0\.18\) 0 10px,\s*transparent 10px 22px\s*\)/,
    "the dashed connector is the thing that makes the circles read as one path — and it must be quieter than the states it joins"
  );
  // The connector anchors on the first and last column CENTRES, so it works for
  // the two-stop strip as well as the three-stop one. --kg-stop-count is set on
  // the body, which is the connector's parent; on the list it never reaches it.
  assert.match(
    css,
    /left:\s*calc\(50% \/ var\(--kg-stop-count, 3\)\);\s*right:\s*calc\(50% \/ var\(--kg-stop-count, 3\)\);/
  );
  assert.match(code, /className="kg-home-stops-body"\s*\n\s*style=\{\{ "--kg-stop-count"/);
  // The width is the viewport's now (src/utils/kidsStage.js), so every
  // horizontal track on this screen has to be a fraction. A px column here
  // would reintroduce the dead margin the canvas change removed.
  assert.equal(
    /grid-template-columns:\s*repeat\(\d/.test(css),
    false,
    "doorway and stop columns follow their count, never a hard-coded number"
  );
  assert.match(css, /grid-template-columns:\s*repeat\(var\(--kg-door-count, 6\), minmax\(0, 1fr\)\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(var\(--kg-stop-count, 3\), minmax\(0, 1fr\)\)/);
});

test("the three stop states are separated on size, fill, ring and ink — not on one of them", () => {
  // The shipped build set only the ring alpha, so done, next and later all read
  // as the same pale circle and a five-year-old could not tell which was theirs.
  const sizeFor = state => css.match(
    new RegExp(`\\.kg-home-stop\\[data-mission-state="${state}"\\] \\{\\s*--kg-stop-size:\\s*(\\d+)px`)
  );
  const later = sizeFor("later");
  const next = sizeFor("next");
  assert.ok(later && next, "the per-state marker sizes are gone");
  assert.match(css, /\.kg-home-stop \{\s*--kg-stop-size:\s*56px/);
  assert.ok(
    Number(next[1]) >= Number(later[1]) + 20,
    `next (${next[1]}px) must be far bigger than later (${later[1]}px)`
  );
  // done: solid green disc, white tick, white ring. next: full-colour art, a
  // 3px accent ring and the spec's accent halo. later: dashed hairline, faded.
  assert.match(css, /\[data-mission-state="done"\] \.kg-home-stop-marker \{[\s\S]*?background: var\(--kg-success\)/);
  assert.match(css, /\[data-mission-state="done"\] \.kg-home-stop-veil \{\s*background: rgba\(111, 179, 95, 0\.78\)/);
  assert.match(css, /\[data-mission-state="next"\] \.kg-home-stop-marker \{[\s\S]*?border: 3px solid var\(--kg-accent\)/);
  assert.match(css, /0 0 0 6px rgba\(var\(--kg-accent-rgb\), 0\.26\)/);
  assert.match(css, /\[data-mission-state="later"\] \.kg-home-stop-marker \{[\s\S]*?border: 2px dashed/);
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
  assert.match(code, /function DoneRingGlyph\(/);
  assert.match(code, /<DoneRingGlyph \/>/);
});

test("the hero pairs a clean backdrop with ONE placed pal, never two sets of characters", () => {
  // pals/{world}-panorama.webp already has a rabbit and a hedgehog painted into
  // it; the hero used to stand a third character (world.point) on top of them.
  assert.match(code, /src=\{world\.backdrop\}/);
  assert.equal(
    /src=\{world\.banner\}/.test(code),
    false,
    "the panorama has pals painted in — a placed pal needs the clean plate"
  );
  assert.match(code, /src=\{world\.point\}/);
  for (const world of Object.values(PAL_WORLDS)) {
    assert.match(
      world.backdrop,
      /^\/images\/backdrops\/activity-bg-[a-z]+\.webp$/,
      `${world.id} has no clean backdrop`
    );
    assert.notEqual(world.backdrop, world.banner);
  }
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
