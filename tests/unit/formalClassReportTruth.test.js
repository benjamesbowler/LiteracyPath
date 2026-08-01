import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, ROOT), "utf8");
}

test("formal class report never formats a withheld result as null percent", async () => {
  const source = await read("src/components/reports/ClassSummaryReportDocument.jsx");

  assert.match(source, /function displayAccuracy\(value\)/);
  assert.match(source, /: "Not enough results"/);
  assert.match(source, /displayAccuracy\(model\?\.snapshot\?\.averageAccuracy\)/);
  assert.doesNotMatch(source, /`\$\{model\?\.snapshot\?\.averageAccuracy\}%`/);
});

test("formal class report does not invent reading classifications or empty report pages", async () => {
  const source = await read("src/components/reports/ClassSummaryReportDocument.jsx");

  assert.doesNotMatch(source, /<th>Reading<\/th>/);
  assert.doesNotMatch(source, />NR<\/span>/);
  assert.match(source, /\{priorities\.length \? \(/);
  assert.match(source, /\{groups\.length \? \(/);
  assert.match(source, /\{secureSkills\.length \? \(/);
  assert.match(source, /More results are needed before making a class-wide judgement/);
});

test("teacher reporting retains the canonical five plain-language learning states", async () => {
  const source = await read("src/data/reportingEvidenceModel.js");

  for (const label of [
    "Secure",
    "Developing",
    "Needs support",
    "Not enough results",
    "Not checked"
  ]) {
    assert.match(source, new RegExp(label));
  }
});

test("the school-year class filter states its exact 1 August assumption", async () => {
  const source = await read("src/components/AppPages.jsx");

  assert.match(source, /classReportSchoolYearStart/);
  assert.match(source, /Since \$\{shortReportDate\(classReportSchoolYearStart\(now\)\)\} \(1 August school-year default\)/);
  assert.match(source, /starts on 1 August because this school has no/);
  assert.doesNotMatch(source, /<option value="schoolYear">This school year<\/option>/);
});
