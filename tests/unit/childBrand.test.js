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

  const homeSource = readFileSync(path.join(repoRoot, "src/components/StudentHomePage.jsx"), "utf8");
  assert.match(homeSource, /className="hs-logo" role="img" aria-label=\{CHILD_BRAND\.endorsedName\}/);
});

test("the entry gateway gives students and teachers their own branded destinations", () => {
  const entrySource = readFileSync(path.join(repoRoot, "src/components/StudentEntryPage.jsx"), "utf8");
  const entryStyles = readFileSync(path.join(repoRoot, "src/styles/pal-worlds.css"), "utf8");

  assert.doesNotMatch(entrySource, /className="pals-entry-brand"/, "the child logo must not brand the whole gateway");
  assert.match(entrySource, /className="entry-brand-logo entry-student-logo"/);
  assert.match(entrySource, /import teacherMarkUrl from "\.\.\/assets\/logomark\.svg"/);
  assert.match(entrySource, /className="entry-teacher-name">\{TEACHER_BRAND\.name\}<\/span>/);
  assert.match(entrySource, /className="entry-teacher-tools">\{TEACHER_BRAND\.areaName\}<\/span>/);
  assert.match(entrySource, /className="student-entry-card-cta pals-cta">Students<\/span>/);
  assert.match(entrySource, /className="student-entry-card-cta pals-cta">Teachers<\/span>/);
  assert.match(entrySource, /aria-labelledby="student-entry-title"/);
  assert.match(entrySource, /aria-describedby="student-entry-description"/);
  assert.match(entrySource, /aria-labelledby="teacher-entry-title"/);
  assert.match(entrySource, /aria-describedby="teacher-entry-description"/);
  assert.match(
    entryStyles,
    /\.student-entry-page\.pals-entry\s*\{[\s\S]*?#edf1ee;/,
    "the shared gateway must use a neutral platform background"
  );
  assert.match(
    entryStyles,
    /\.pals-entry \.student-entry-grid\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/,
    "desktop must present the two destinations side by side"
  );
  assert.match(
    entryStyles,
    /@media \(max-width: 720px\)[\s\S]*?\.pals-entry \.student-entry-grid\s*\{\s*grid-template-columns: minmax\(0, 420px\);/,
    "phones must stack both destinations into one readable column"
  );
});

test("the Sage home keeps all seven destinations in its policy-led hierarchy", async () => {
  const homeSource = readFileSync(path.join(repoRoot, "src/components/StudentHomePage.jsx"), "utf8");
  const homeStyles = readFileSync(path.join(repoRoot, "src/styles/home-sage.css"), "utf8");
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
  assert.match(
    homeSource,
    /hero=\{priority === "primary"\}[\s\S]*?priority=\{priority\}[\s\S]*?recommendationSource=/,
    "the policy-selected activity must own the single hero role"
  );
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
  assert.match(
    homeStyles,
    /\.lp-home-sage \.hs-recommendation-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(0, 1fr\);/,
    "the desktop hierarchy must reserve more space for the policy-selected activity"
  );
  assert.match(
    homeStyles,
    /\.lp-home-sage \.hs-card\.is-hero\s*\{[\s\S]*?border:\s*2px solid var\(--hs-sage\);/,
    "the single recommended activity must retain the strongest card treatment"
  );
  assert.match(homeStyles, /@container hs-sheet \(max-width: 920px\)[\s\S]*?\.hs-recommendation-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(
    homeStyles,
    /@container hs-sheet \(max-width: 520px\)[\s\S]*?\.hs-secondary-grid,[\s\S]*?\.hs-explore-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/,
    "secondary and exploration choices must collapse to one readable phone column"
  );
});
