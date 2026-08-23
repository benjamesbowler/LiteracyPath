import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import { summariseElLetterKnowledge } from "../../src/utils/elLetterKnowledgeSummary.js";
import { createSimpleElAssessmentWorkbook } from "../../src/utils/exportElAssessmentSimple.js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function cell(status) {
  return { status };
}

function letterMatrix() {
  return ALPHABET.map(letter => ({
    letter,
    letterPair: `${letter}/${letter.toLowerCase()}`,
    uppercaseName: cell("secure"),
    uppercaseSound: cell(letter === "A" ? "needs_support" : "secure"),
    lowercaseName: cell(letter === "B" ? "not_checked" : "secure"),
    lowercaseSound: cell("secure")
  }));
}

test("EL letter knowledge keeps uppercase/lowercase names/sounds separate with /26 coverage", () => {
  const groups = new Map(summariseElLetterKnowledge(letterMatrix()).map(group => [group.key, group]));

  assert.equal(groups.get("uppercaseName").knownCount, 26);
  assert.equal(groups.get("uppercaseName").total, 26);
  assert.equal(groups.get("uppercaseSound").knownCount, 25);
  assert.deepEqual(groups.get("uppercaseSound").knownLetters.slice(0, 3), ["B", "C", "D"]);
  assert.equal(groups.get("lowercaseName").knownCount, 25);
  assert.equal(groups.get("lowercaseName").notCheckedCount, 1);
  assert.ok(!groups.get("lowercaseName").knownLetters.includes("b"));
  assert.equal(groups.get("lowercaseSound").knownCount, 26);
});

test("simple EL workbook shows the four /26 totals and individual known-letter lists", async () => {
  const workbook = await createSimpleElAssessmentWorkbook({
    formalAssessments: {
      individualLetterMatrix: letterMatrix(),
      individualAdvancedPhonicsMatrix: [],
      individualBenchmarkProfile: []
    }
  }, {
    studentName: "Adam",
    className: "K-Co",
    scopeLabel: "Kindergarten · Beginning of year",
    generatedAt: new Date("2026-08-24T00:00:00.000Z")
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(buffer);
  const report = loaded.getWorksheet("Report");

  assert.equal(report.getCell("B10").value, "UPPERCASE LETTER NAMES KNOWN");
  assert.equal(report.getCell("B11").value, "26/26");
  assert.match(report.getCell("B12").value, /^Known: A, B, C/);
  assert.equal(report.getCell("E10").value, "UPPERCASE LETTER SOUNDS KNOWN");
  assert.equal(report.getCell("E11").value, "25/26");
  assert.match(report.getCell("E12").value, /^Known: B, C, D/);
  assert.equal(report.getCell("B14").value, "LOWERCASE LETTER NAMES KNOWN");
  assert.equal(report.getCell("B15").value, "25/26");
  assert.match(report.getCell("B16").value, /^Known: a, c, d/);
  assert.equal(report.getCell("E14").value, "LOWERCASE LETTER SOUNDS KNOWN");
  assert.equal(report.getCell("E15").value, "26/26");
});
