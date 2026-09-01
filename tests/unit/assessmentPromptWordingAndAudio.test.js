import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getLedaInstructionAudioPath } from "../../src/data/ledaProductionAudio.js";
import { LEDA_RUNTIME_SUPPLEMENT_AUDIO } from "../../src/data/generated/ledaRuntimeSupplement.generated.js";
import { ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE } from "../../src/data/generated/assessmentLedaGaps.generated.js";

const projectRoot = path.resolve(import.meta.dirname, "..", "..");
const bankDirectory = path.join(projectRoot, "src", "data", "v3", "banks");
const legacyPromptPattern = /\bwhich one\b|\b(?:starts?|ends?)\s+like\b|\b(?:which|what|find)\b[^.!?]{0,100}\b(?:starts?|ends?)\s+(?:with\s+)?the\s+same\b|\bfind the one that (?:starts?|ends?)\b/i;

async function loadAllQuestions() {
  const bankFiles = fs.readdirSync(bankDirectory)
    .filter(fileName => fileName.endsWith(".v3.generated.js"))
    .sort();
  const questions = [];
  for (const fileName of bankFiles) {
    const module = await import(`${pathToFileURL(path.join(bankDirectory, fileName)).href}?prompt-audit=${Date.now()}`);
    questions.push(...(module.questions || []));
  }
  return { bankFiles, questions };
}

function legacyAudioPaths() {
  const paths = new Set();
  for (const [text, audioPath] of Object.entries(LEDA_RUNTIME_SUPPLEMENT_AUDIO)) {
    if (legacyPromptPattern.test(text)) paths.add(audioPath);
  }
  for (const roleEntries of Object.values(ASSESSMENT_LEDA_GAP_AUDIO_BY_ROLE)) {
    for (const [text, audioPath] of Object.entries(roleEntries || {})) {
      if (legacyPromptPattern.test(text)) paths.add(audioPath);
    }
  }
  return paths;
}

test("all 30 active v3 banks use professional assessment wording, including retention", async () => {
  const { bankFiles, questions } = await loadAllQuestions();
  assert.equal(bankFiles.length, 30);
  assert.ok(questions.some(question => question.retentionOnly), "retention questions must be audited too");
  for (const question of questions) {
    for (const field of ["prompt", "question", "spokenPrompt"]) {
      const value = String(question[field] || "");
      assert.equal(legacyPromptPattern.test(value), false, `${question.id}:${field}:${value}`);
    }
  }
});

test("the tooth initial-sound item pins the canonical visible and spoken question", async () => {
  const { questions } = await loadAllQuestions();
  const tooth = questions.find(question =>
    question.skillId === "initial_sounds"
    && question.targetWord === "tooth"
    && !question.retentionOnly
  );
  assert.ok(tooth, "missing active tooth initial-sound item");
  assert.equal(tooth.prompt, "Which word has the same starting sound?");
  assert.equal(tooth.spokenPrompt, "Tooth. Which word has the same starting sound?");
});

test("no active or retention v3 prompt selects a legacy full-sentence recording", async () => {
  const { questions } = await loadAllQuestions();
  const legacyPaths = legacyAudioPaths();
  assert.ok(legacyPaths.size > 0, "legacy audio inventory must remain detectable until deliberately retired");
  for (const question of questions) {
    const audioPath = getLedaInstructionAudioPath(question.spokenPrompt || question.prompt || question.question || "");
    assert.equal(legacyPaths.has(audioPath), false, `${question.id}:${audioPath}`);
  }
});
