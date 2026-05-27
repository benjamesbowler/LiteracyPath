import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(repoRoot, "src", "App.css"), "utf8");
const appPages = fs.readFileSync(path.join(repoRoot, "src", "components", "AppPages.jsx"), "utf8");

const failures = [];

function requirePattern(label, source, pattern) {
  if (!pattern.test(source)) failures.push(label);
}

requirePattern(
  "Assessment shell should use a wide responsive viewport width.",
  css,
  /\.assessment-shell\s*{[\s\S]*?width:\s*min\(96vw,\s*1280px\)/
);
requirePattern(
  "Assessment shell should hide page-level overflow.",
  css,
  /\.assessment-shell\s*{[\s\S]*?overflow:\s*hidden/
);
requirePattern(
  "Assessment card should not use page-level auto scrolling for normal questions.",
  css,
  /\.assessment-card\s*{[\s\S]*?overflow:\s*hidden/
);
requirePattern(
  "Rhyming assessment layout class should be applied at render time.",
  appPages,
  /isRhymingPictureItem\s*\?\s*"rhyming-assessment-layout"/
);
requirePattern(
  "Rhyming assessment should use a two-column desktop layout.",
  css,
  /\.assessment-question-layout\.rhyming-assessment-layout\s*{[\s\S]*?grid-template-columns:\s*minmax\(250px,\s*0\.82fr\)\s*minmax\(420px,\s*1\.18fr\)/
);
requirePattern(
  "Rhyming answer grid should stay 2x2 inside the answer panel.",
  css,
  /\.rhyming-assessment-layout\s+\.rhyming-picture-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
);
requirePattern(
  "Rhyming layout should have a tablet/mobile stacked fallback.",
  css,
  /@media\s*\(max-width:\s*899px\)\s*{[\s\S]*?\.assessment-question-layout\.rhyming-assessment-layout/
);

const narrowAssessmentMatches = css.match(/assessment[^{}]*{[^{}]*(?:max-width|width):\s*(?:640px|min\(\s*640px)/gi) || [];
if (narrowAssessmentMatches.length) {
  failures.push(`Assessment CSS still contains narrow 640px desktop sizing: ${narrowAssessmentMatches.join(" | ")}`);
}

if (failures.length) {
  console.error("Assessment layout contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Assessment layout contracts passed.");

