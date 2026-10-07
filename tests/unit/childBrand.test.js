import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { CHILD_BRAND } from "../../src/data/childBrand.js";
import { TEACHER_BRAND } from "../../src/data/teacherBrand.js";
import { STUDENT_HOME_ACTIVITY_TITLES } from "../../src/copy/studentNavigationCopy.js";
import { STUDENT_NAVIGATION_ART } from "../../src/policy/studentTabBar.js";

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
  assert.match(entrySource, /import teacherMarkUrl from "\.\.\/assets\/logomark\.webp"/);
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
    /\.student-entry-page\.pals-entry\.lp-landing\s*\{[\s\S]*?--landing-paper: #F7F8FA;/,
    "the shared gateway must use a neutral platform background"
  );
  assert.match(
    entryStyles,
    /\.pals-entry \.student-entry-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1\.15fr\)\s+minmax\(0, \.85fr\)/,
    "desktop must present the two destinations side by side with the current weighted split"
  );
  assert.match(
    entryStyles,
    /@media \(max-width: 720px\)[\s\S]*?\.pals-entry \.student-entry-grid\s*\{\s*grid-template-columns: min\(100%, 420px\);/,
    "phones must stack both destinations into one readable column"
  );
});

// The public brand stays stable as Home exposes eight picture destinations.
test("the child home keeps eight visible destinations and one policy-selected action", async () => {
  const homeSource = readFileSync(path.join(repoRoot, "src/components/StudentHomePage.jsx"), "utf8");
  const homeStyles = readFileSync(path.join(repoRoot, "src/styles/kids-home.css"), "utf8");
  const appSource = readFileSync(path.join(repoRoot, "src/components/AppSurface.jsx"), "utf8");
  assert.equal(STUDENT_HOME_ACTIVITY_TITLES["my-hollow"], "My Hollow");
  assert.equal(STUDENT_HOME_ACTIVITY_TITLES["word-workshop"], "Words");
  assert.match(appSource, /onOpenWords=\{\(\) => \{[\s\S]*?setStudentLearnIsland\("words"\)/);
  assert.match(appSource, /onOpenRewards=\{\(\) => \{[\s\S]*?setAppView\(APP_VIEWS\.STUDENT_REWARDS\);[\s\S]*?appView === APP_VIEWS\.STUDENT_REWARDS[\s\S]*?<HollowPage/);
  assert.match(homeSource, /const primary = recommendation\.primary;/);
  assert.equal((homeSource.match(/data-child-primary=/g) || []).length, 1);
  assert.match(homeSource, /data-child-emphasis="choice"/);
  assert.match(homeStyles, /\.kg-stage \.kg-home \{[^}]*overflow: auto/);
  assert.match(homeStyles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(homeSource, /<details className="kg-home-discovery"/);
  for (const [destination, asset] of Object.entries(STUDENT_NAVIGATION_ART)) {
    const metadata = await sharp(path.join(repoRoot, "public", asset)).metadata();
    assert.equal(metadata.width, metadata.height, `${destination} uses an individually contained square object`);
    assert.equal(metadata.hasAlpha, true, `${destination} retains a transparent background`);
  }
});
