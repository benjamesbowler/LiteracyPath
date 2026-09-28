import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { advancedPhonicsPatterns } from "../../src/data/advancedPhonicsPatterns.js";
import { restoreManualAssessmentDraftsFromHistory } from "../../src/appState/manualAssessmentFlow.js";
import { addManualDiagnosticEvidenceSheet, cleanDiagnosticObservation, diagnosticAssessmentComplete, diagnosticDraft, diagnosticObservationIssue, diagnosticResponseFields, isDiagnosticEntryComplete, manualDiagnosticEvidenceRows, nextDiagnosticItemIndex, summarizeDiagnostic, upsertDiagnosticEntry } from "../../src/utils/manualDiagnosticEvidence.js";

const letters = [{ display: "A", type: "uppercase" }, { display: "a", type: "lowercase" }];

test("an explicit pending subtask survives false legacy compatibility flags", () => {
  const entry = { letter: "A", nameOutcome: "correct", soundOutcome: "", knowsName: true, knowsSound: false, recorded: false };
  assert.equal(diagnosticDraft(entry).sound.outcome, "");
  assert.equal(isDiagnosticEntryComplete(entry), false);
  assert.equal(diagnosticAssessmentComplete([entry], [letters[0]]), false);
  assert.equal(isDiagnosticEntryComplete({ ...entry, recorded: true }), false);
  assert.equal(diagnosticDraft({ knowsName: true, knowsSound: false }).sound.outcome, "incorrect");
});

test("exact response evidence never substitutes the target for an untranscribed answer", () => {
  const empty = diagnosticResponseFields({ letter: "A", nameOutcome: "correct" }, "name");
  assert.equal(empty.selectedAnswer, "");
  assert.equal(empty.responseDetailCaptured, false);
  assert.equal(empty.responseCaptureMode, "teacher_observation");
  const heard = diagnosticResponseFields({ letter: "A", nameOutcome: "incorrect", responseEvidence: { name: { responseText: "  bee ", notes: "mixed case", errorTags: ["letter_confusion", "letter_confusion", "invalid"] } } }, "name");
  assert.equal(heard.selectedAnswer, "bee");
  assert.equal(heard.responseCaptureMode, "teacher_transcription");
  assert.deepEqual(heard.errorTags, ["letter_confusion"]);
  assert.equal(diagnosticResponseFields({ letter: "A", knowsSound: true }, "sound").isCorrect, true);
});

test("no response is scored separately while unscorable and unadministered stay outside denominator", () => {
  const entries = [
    { letter: "A", nameOutcome: "correct", soundOutcome: "no_response", recorded: true },
    { letter: "a", nameOutcome: "not_scorable", soundOutcome: "not_administered", recorded: true }
  ];
  const profile = summarizeDiagnostic(entries, letters);
  assert.deepEqual(profile.totals.name, { correct: 1, incorrect: 0, no_response: 0, not_scorable: 1, not_administered: 0, scored: 1 });
  assert.equal(profile.totals.sound.scored, 1);
  assert.equal(profile.totals.sound.no_response, 1);
  assert.equal(profile.review.length, 1);
  assert.equal(profile.review[0].task, "sound");
  assert.equal(diagnosticResponseFields(entries[1], "name").isCorrect, null);
  assert.equal(diagnosticResponseFields(entries[0], "sound").isCorrect, false);
  assert.equal(diagnosticAssessmentComplete(entries, letters), true);
});

test("review corrections retain later evidence and never duplicate a retry", () => {
  const entries = [{ letter: "A" }, { letter: "a", responseEvidence: { name: { responseText: "ay" } } }];
  const edited = upsertDiagnosticEntry(entries, 0, { letter: "A", nameOutcome: "correct" });
  assert.equal(edited.length, 2);
  assert.equal(edited[1], entries[1]);
  assert.equal(entries[0].nameOutcome, undefined);
  assert.equal(upsertDiagnosticEntry(edited, 0, edited[0]).length, 2);
});

test("diagnostic gates require genuine error evidence and an access reason", () => {
  assert.match(diagnosticObservationIssue("incorrect", {}), /what the student said/);
  assert.equal(diagnosticObservationIssue("incorrect", { responseText: "bee" }), "");
  assert.match(diagnosticObservationIssue("not_scorable", {}), /why/);
  assert.equal(diagnosticObservationIssue("not_scorable", { notes: "Interrupted" }), "");
  assert.match(diagnosticObservationIssue("no_response", { responseText: "bee" }), /response is recorded/);
  assert.equal(diagnosticObservationIssue("correct", {}), "");
  assert.equal(cleanDiagnosticObservation({ responseText: "x".repeat(800) }).responseText.length, 600);
});

test("partial archive restores the unrecorded subtask, exact response and authored form", () => {
  const entry = { pattern: "oa", exampleWord: "road", soundOutcome: "incorrect", wordOutcome: "", recorded: false, formIndex: 2, formVersion: "old-form", group: "Vowel teams", responseEvidence: { sound: { responseText: "ah", errorTags: ["vowel"], notes: "Said a short vowel", selfCorrected: false } } };
  const records = ["sound", "word"].map(task => ({ ...diagnosticResponseFields(entry, task), targetPattern: "oa", targetWord: "road" }));
  const restored = restoreManualAssessmentDraftsFromHistory({ studentId: "student-1", assessmentHistory: [{ assessmentType: "advanced_phonics_patterns", administrationStatus: "partial", attemptId: "stable-id", startedAt: "2026-09-28T09:00:00Z", studentId: "student-1", questionRecords: records }] });
  assert.equal(restored.patternIndex, 0);
  assert.equal(restored.patternAssessment[0].wordOutcome, "");
  assert.equal(restored.patternAssessment[0].exampleWord, "road");
  assert.equal(restored.patternAssessment[0].formIndex, 2);
  assert.equal(restored.patternAssessment[0].formVersion, "old-form");
  assert.equal(restored.patternAssessment[0].responseEvidence.sound.responseText, "ah");
  assert.deepEqual(restored.patternAssessment[0].responseEvidence.sound.errorTags, ["vowel"]);
});

test("Excel evidence distinguishes missing work and never invents a transcript", async () => {
  const entries = [{ letter: "A", nameOutcome: "correct", soundOutcome: "no_response" }];
  const rows = manualDiagnosticEvidenceRows(entries, letters);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].responseText, "");
  assert.equal(rows[1].outcome, "No response");
  assert.equal(rows[2].outcome, "Not recorded");
  const workbook = new ExcelJS.Workbook();
  addManualDiagnosticEvidenceSheet(workbook, entries, letters, "letter");
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.equal(reloaded.getWorksheet("Response evidence").getCell("E4").value, "Not recorded");
  assert.equal(reloaded.getWorksheet("Response evidence").getCell("F2").value, "");
});

test("stable pattern inventory keeps all 33 targets with varied authored words and explicit constructs", () => {
  assert.equal(advancedPhonicsPatterns.length, 33);
  assert.equal(new Set(advancedPhonicsPatterns.map(item => item.pattern)).size, 33);
  assert.deepEqual(advancedPhonicsPatterns.slice(0, 4).map(item => item.pattern), ["oa", "ch", "a_e", "ur"]);
  for (const item of advancedPhonicsPatterns) {
    assert.equal(item.examples.length, 3);
    assert.ok(item.soundGuidance && item.group && item.administrationNote && item.formVersion);
    assert.equal(item.construct, ["ing", "tion", "ts", "-le"].includes(item.pattern) ? "spelling_part_pronunciation" : "grapheme_sound_correspondence");
  }
  assert.ok(!advancedPhonicsPatterns.find(item => item.pattern === "ea").examples.includes("read"));
  assert.match(advancedPhonicsPatterns.find(item => item.pattern === "th").soundGuidance, /voiced/);
});

test("finishing returns to an earlier incomplete item and invalid error drafts cannot complete", () => {
  const partial = [{ letter: "A", nameOutcome: "correct", soundOutcome: "", recorded: false }, { letter: "a", nameOutcome: "correct", soundOutcome: "correct", recorded: true }];
  assert.equal(nextDiagnosticItemIndex(partial, letters, "letter", 1), 0);
  const missingEvidence = { letter: "A", nameOutcome: "incorrect", soundOutcome: "correct", recorded: true, diagnosticVersion: "manual-diagnostic-v2" };
  assert.equal(isDiagnosticEntryComplete(missingEvidence), false);
  assert.equal(isDiagnosticEntryComplete({ ...missingEvidence, responseEvidence: { name: { responseText: "bee" } } }), true);
});
