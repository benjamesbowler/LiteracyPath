import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { CHILD_BRAND } from "../../src/data/childBrand.js";
import { TEACHER_BRAND } from "../../src/data/teacherBrand.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("the child area has one approved endorsed identity", () => {
  assert.deepEqual(CHILD_BRAND, {
    name: "Little Literacy Guides",
    endorsedName: "Little Literacy Guides by literacy.guide",
    logoPath: "/images/pals/little-literacy-guides-logo.webp",
    markPath: "/images/pals/little-literacy-guides-mark.webp"
  });
  assert.equal(Object.isFrozen(CHILD_BRAND), true);
});

test("approved child-brand artwork exists at every canonical path", () => {
  for (const assetPath of [CHILD_BRAND.logoPath, CHILD_BRAND.markPath]) {
    assert.equal(
      existsSync(path.join(repoRoot, "public", assetPath.replace(/^\//, ""))),
      true,
      `missing child-brand asset: ${assetPath}`
    );
  }
});

test("the teacher area has one approved adult identity", () => {
  assert.deepEqual(TEACHER_BRAND, {
    name: "Literacy Guide",
    areaName: "Teacher Tools",
    endorsedName: "Literacy Guide Teacher Tools"
  });
  assert.equal(Object.isFrozen(TEACHER_BRAND), true);
});

test("entry, home, and preloading cannot drift back to retired runtime names", () => {
  const runtimeFiles = [
    "src/components/StudentEntryPage.jsx",
    "src/components/StudentHomePage.jsx",
    "src/styles/comic-theme.css",
    "src/styles/home-sage.css",
    "src/styles/lp-tokens.css",
    "src/styles/pal-worlds.css",
    "src/utils/palWorlds.js",
    "src/utils/preloadAssets.js"
  ];
  const retiredNames = [
    /Mivlings/i,
    /Literacy(?:\s|<[^>]+>)*Pals/i,
    /mivlings-logo/i,
    /literacy-pals-logo/i
  ];

  for (const relativePath of runtimeFiles) {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    for (const retiredName of retiredNames) {
      assert.doesNotMatch(source, retiredName, `${relativePath} contains ${retiredName}`);
    }
  }

  // 2026-07-29 (kids redesign, phase B): the child home's chrome is now the
  // glass shell's header — profile, stars, coins, grown-ups — which the spec
  // gives no brand lockup. The endorsed identity did NOT leave the child area;
  // it moved to the grown-ups menu, the one adult-facing surface on the screen,
  // where it still has to be the approved endorsed name and nothing retired.
  const homeSource = readFileSync(path.join(repoRoot, "src/components/StudentHomePage.jsx"), "utf8");
  assert.match(homeSource, /className="kg-home-brand" role="img" aria-label=\{CHILD_BRAND\.endorsedName\}/);
});

test("the entry gateway gives students and teachers their own branded destinations", () => {
  const entrySource = readFileSync(path.join(repoRoot, "src/components/StudentEntryPage.jsx"), "utf8");
  const entryStyles = readFileSync(path.join(repoRoot, "src/styles/landing.css"), "utf8");

  assert.doesNotMatch(entrySource, /className="pals-entry-brand"/, "the child logo must not brand the whole gateway");
  assert.match(entrySource, /className="entry-brand-logo entry-student-logo"/);
  assert.match(entrySource, /import teacherMarkUrl from "\.\.\/assets\/logomark\.svg"/);
  assert.match(entrySource, /className="entry-teacher-name">\{TEACHER_BRAND\.name\}<\/span>/);
  assert.match(entrySource, /className="entry-teacher-tools">\{TEACHER_BRAND\.areaName\}<\/span>/);
  assert.match(entrySource, /className="student-entry-card-cta pals-cta">Start playing<\/span>/);
  assert.match(entrySource, /className="student-entry-card-cta pals-cta">Open Teacher Tools<\/span>/);
  assert.match(entrySource, /aria-labelledby="student-entry-title"/);
  assert.match(entrySource, /aria-describedby="student-entry-description"/);
  assert.match(entrySource, /aria-labelledby="teacher-entry-title"/);
  assert.match(entrySource, /aria-describedby="teacher-entry-description"/);
  assert.match(
    entryStyles,
    /\.student-entry-page\.pals-entry\.lp-landing\s*\{[\s\S]*?--landing-paper: #f7f0e4;/,
    "the shared gateway must use a neutral platform background"
  );
  assert.match(
    entryStyles,
    /\.pals-entry \.student-entry-grid\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/,
    "desktop must present the two destinations side by side"
  );
  assert.match(
    entryStyles,
    /@media \(max-width: 720px\)[\s\S]*?\.pals-entry \.student-entry-grid\s*\{\s*grid-template-columns: min\(100%, 420px\);/,
    "phones must stack both destinations into one readable column"
  );
});

// 2026-07-29 (kids redesign, phase B): the home screen was rebuilt onto the
// fixed 1194 x 834 glass canvas, so the assertions that pinned the sage skin's
// card hierarchy and its container-query reflow now point at the new layout —
// same intent, new implementation. The intent is unchanged and is the reason
// this test exists: SEVEN destinations, ONE policy-selected primary action, and
// artwork that stays reproducible.
test("the child home keeps all seven destinations behind one policy-selected action", async () => {
  const homeSource = readFileSync(path.join(repoRoot, "src/components/StudentHomePage.jsx"), "utf8");
  const homeStyles = readFileSync(path.join(repoRoot, "src/styles/kids-home.css"), "utf8");
  const appSource = readFileSync(path.join(repoRoot, "src/components/AppSurface.jsx"), "utf8");
  const imageGeneratorSource = readFileSync(path.join(repoRoot, "tools/generateImage.mjs"), "utf8");
  const imageJobs = JSON.parse(readFileSync(path.join(repoRoot, "tools/image-jobs/home-sage-cards.json"), "utf8"));
  const activitiesSource = homeSource.match(/const activities = \[[\s\S]*?\n {2}\];/)?.[0] || "";
  const hollowImagePath = path.join(repoRoot, "public/images/home-sage/my-hollow.webp");
  const hollowImageJob = imageJobs.find(job => job.out === "public/images/home-sage/my-hollow.webp");

  assert.equal((activitiesSource.match(/\n {6}id: "/g) || []).length, 7);
  assert.match(
    activitiesSource,
    /id: "my-hollow"[\s\S]*?onClick: onOpenRewards[\s\S]*?art: "\/images\/home-sage\/my-hollow\.webp"[\s\S]*?title: "My Hollow"/
  );
  assert.match(
    appSource,
    /onOpenRewards=\{\(\) => \{[\s\S]*?setAppView\(APP_VIEWS\.STUDENT_REWARDS\);[\s\S]*?appView === APP_VIEWS\.STUDENT_REWARDS[\s\S]*?<HollowPage/,
    "the home callback must continue to open the real My Hollow page"
  );
  // ONE unmistakable next action. The hero's Play button is built from
  // selectStudentHomeRecommendation's primary and is the only thing on the
  // screen carrying data-child-primary; the six doorways are marked as
  // choices. Two primaries here is the exact regression the redesign removed.
  assert.match(
    homeSource,
    /const primary = recommendation\.primary;/,
    "the hero must be the policy-selected activity, not a second selection rule"
  );
  assert.equal(
    (homeSource.match(/data-child-primary=/g) || []).length,
    1,
    "exactly one primary call to action may exist on the child home"
  );
  assert.match(homeSource, /data-child-emphasis="primary"/);
  assert.match(homeSource, /data-child-emphasis="choice"/);
  assert.equal(
    existsSync(hollowImagePath),
    true,
    "missing the My Hollow home-card artwork"
  );
  assert.ok(hollowImageJob, "the My Hollow artwork must remain reproducible from the Sage card manifest");
  const hollowMetadata = await sharp(hollowImagePath).metadata();
  assert.deepEqual(
    [hollowMetadata.width, hollowMetadata.height],
    [hollowImageJob.width, hollowImageJob.height],
    "the generated artwork dimensions must match its reproducible job"
  );
  assert.match(
    imageGeneratorSource,
    /const height = Number\(job\.height \|\| args\.height \|\| width \|\| 0\);[\s\S]*?pipe\.resize\(width, height, \{ fit: "cover" \}\)/,
    "the shared image generator must honour the card job's explicit aspect ratio"
  );
  // The spec's Home geometry: a 232px hero over the daily stops over the
  // doorways, which take whatever height is left. The hero owning a fixed
  // 232px is what keeps it the loudest thing on the screen at every state.
  assert.match(
    homeStyles,
    /\.kg-stage \.kg-home\s*\{[\s\S]*?grid-template-rows:\s*232px auto minmax\(0, 1fr\);/,
    "the hero must keep its fixed 232px row above the stops and the doorways"
  );
  // Six equal doorways by default; the count follows what is actually rendered
  // so a reduced-choice child gets fewer, bigger doors instead of empty tracks.
  assert.match(
    homeStyles,
    /\.kg-stage \.kg-home-doors\s*\{[\s\S]*?grid-template-columns:\s*repeat\(var\(--kg-door-count, 6\), minmax\(0, 1fr\)\);/,
    "the doorway grid must be six equal columns and follow the doorways rendered"
  );
  // Exactly one daily stop is "next", and it is the only one with the accent
  // ring and halo — the glance-level answer to "which one now?". The halo was
  // widened from 4px/.22 to 6px/.26 on 2026-07-29: on screen the three states
  // all read as the same pale circle, and the dashed connector was louder than
  // any of them.
  assert.match(
    homeStyles,
    /\.kg-stage \.kg-home-stop\[data-mission-state="next"\] \.kg-home-stop-marker\s*\{[\s\S]*?rgba\(var\(--kg-accent-rgb\), 0\.26\)/,
    "the next daily stop must carry the accent halo that marks it as next"
  );
  // The canvas has a FIXED HEIGHT and a viewport-following width
  // (src/utils/kidsStage.js), so Home reflows horizontally through fractional
  // tracks and never through a breakpoint: a width media query here would be a
  // second layout to maintain, and a hard-coded column count would put the dead
  // side margin back.
  assert.equal(
    /@container|@media \(max-width/.test(homeStyles),
    false,
    "the child home reflows through fr tracks, not through breakpoints"
  );
});
