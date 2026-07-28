import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, ROOT), "utf8");
}

test("formal class report never formats a withheld result as null percent", async () => {
  const source = await read("src/components/AdminDashboardPage.jsx");

  assert.match(source, /function reportPercentage\(value, unavailable = "Not enough results"\)/);
  assert.match(source, /\["Answer accuracy", reportPercentage\(model\.snapshot\.averageAccuracy\)/);
  assert.doesNotMatch(source, /`\$\{model\.snapshot\.averageAccuracy\}%`/);
  assert.doesNotMatch(source, /Math\.max\(4, row\.accuracy\)/);
  assert.match(source, /accuracy !== null && \(/);
});

test("formal class report does not invent reading classifications or empty report pages", async () => {
  const source = await read("src/components/AdminDashboardPage.jsx");

  assert.doesNotMatch(source, /<th>Reading<\/th>/);
  assert.doesNotMatch(source, />NR<\/span>/);
  assert.match(source, /const hasReadingRows = model\.readingRows\.length > 0;/);
  assert.match(source, /\{hasReadingRows && \(/);
  assert.match(source, /\{model\.growthAreas\.length > 0 && \(/);
  assert.match(source, /\{\(hasClassPriorities \|\| hasGroups\) && \(/);
});

test("formal class report uses the canonical five plain-language learning states", async () => {
  const source = await read("src/components/AdminDashboardPage.jsx");
  const css = await read("src/App.css");

  for (const label of [
    "Secure",
    "Developing",
    "Needs support",
    "Not enough results",
    "Not checked"
  ]) {
    assert.match(source, new RegExp(label));
  }
  assert.match(source, /`\$\{reportPercentage\(cell\?\.accuracy, "No score"\)\} · \$\{cell\?\.statusLabel\}`/);
  assert.match(source, /aria-label=\{`\$\{student\.studentName\}, \$\{skill\.displaySkillName\}: \$\{cellLabel\}/);
  assert.match(css, /\.formal-class-progress-cell\.not_enough_evidence/);
  assert.match(css, /\.formal-class-report-print-details\s*\{\s*display: none;/);
  assert.match(source, /className="formal-class-report-print-details"/);
});

test("the school-year class filter states its exact 1 August assumption", async () => {
  const source = await read("src/components/AppPages.jsx");

  assert.match(source, /classReportSchoolYearStart/);
  assert.match(source, /Since \$\{shortReportDate\(classReportSchoolYearStart\(now\)\)\} \(1 August school-year default\)/);
  assert.match(source, /starts on 1 August because this school has no/);
  assert.doesNotMatch(source, /<option value="schoolYear">This school year<\/option>/);
});
