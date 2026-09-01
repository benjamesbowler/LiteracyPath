import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import blendsSource from "../../tools/assessmentRebuild/authoring/blends.mjs";
import cvcSource from "../../tools/assessmentRebuild/authoring/cvc_short_vowels.mjs";
import rhymingSource from "../../tools/assessmentRebuild/authoring/rhyming.mjs";
import shortVowelSource from "../../tools/assessmentRebuild/authoring/short_vowel_discrimination.mjs";
import { expandBank, ROOT } from "../../tools/assessmentRebuild/lib.mjs";

const sources = [rhymingSource, cvcSource, shortVowelSource, blendsSource];
const expandedBySkill = Object.fromEntries(sources.map(source => [
  source.skillId,
  expandBank(source, skillBlueprints[source.skillId], source.imageResolver)
]));

const rawKey = item => item.choices.find(choice => choice.k)?.t;
const byId = (skillId, id) => {
  const item = expandedBySkill[skillId].find(candidate => candidate.id === id);
  assert.ok(item, `${id} must keep its stable identity`);
  return item;
};

test("P1 phonics repairs keep bank identities while removing non-objective scoring pictures", () => {
  assert.deepEqual(Object.fromEntries(sources.map(source => [source.skillId, source.items.length])), {
    rhyming: 145,
    cvc_short_vowels: 70,
    short_vowel_discrimination: 70,
    blends: 106
  });

  const concreteRhymingKeys = {
    "lp3.rhyming.l1.A.ub.v1": "tub",
    "lp3.rhyming.l1.B.ub.v2": "tub",
    "lp3.rhyming.l1.C.ub.v3": "tub",
    "lp3.rhyming.l1.C.et.v3": "net",
    "lp3.rhyming.l1.B.ig.v2": "pig",
    "lp3.rhyming.l1.C.ig.v3": "pig",
    "lp3.rhyming.l1.A.ock.v1": "clock",
    "lp3.rhyming.l1.B.ock.v2": "clock",
    "lp3.rhyming.l1.C.ock.v3": "clock",
    "lp3.rhyming.l1.C.ot.v3": "pot",
    "lp3.rhyming.l1.B.un.v2": "sun",
    "lp3.rhyming.l1.B.up.v2": "cup",
    "lp3.rhyming.l1.C.up.v3": "cup",
    "lp3.rhyming.l1.B.ut.v2": "nut",
    "lp3.rhyming.l1.C.ut.v3": "nut"
  };
  for (const [id, expectedKey] of Object.entries(concreteRhymingKeys)) {
    const item = byId("rhyming", id);
    assert.equal(item.answer, expectedKey, `${id} must key an independently nameable concrete noun`);
    assert.equal(item.imageCards.some(card => card.word === expectedKey && card.image), true);
  }

  assert.equal(byId("cvc_short_vowels", "lp3.cvc_short_vowels.l2.C.short_i.v3").targetWord, "brick");
  assert.deepEqual(
    new Set(byId("cvc_short_vowels", "lp3.cvc_short_vowels.l2.C.short_i.v3").choices),
    new Set(["brick", "black", "block", "click"])
  );
  assert.equal(byId("cvc_short_vowels", "lp3.cvc_short_vowels.l2.B.short_i.v5").targetWord, "gift");
  assert.equal(byId("cvc_short_vowels", "lp3.cvc_short_vowels.l2.R.short_u.v8r").targetWord, "brush");
  assert.equal(byId("short_vowel_discrimination", "lp3.short_vowel_discrimination.l2.C.short_i.v6").answer, "pig");

  const rejectedBlendPictures = new Set(["draw", "ground", "swim", "smile", "spring", "stop"]);
  for (const item of blendsSource.items) {
    const visualKey = item.cards ? rawKey(item) : item.img;
    assert.equal(rejectedBlendPictures.has(visualKey), false, `${visualKey} must not remain scoring picture evidence`);
    const assessedWords = [item.target, rawKey(item)].filter(word => rejectedBlendPictures.has(word));
    if (assessedWords.length) {
      assert.equal(item.media, "audio-required", `${assessedWords.join(", ")} must use audio plus print`);
      assert.equal(item.evidenceModality, "audio+print");
      assert.equal(item.audioRole, "target_word");
    }
  }
  assert.equal(byId("blends", "lp3.blends.l1.B.sw.v2").answer, "swing");
  assert.equal(byId("blends", "lp3.blends.l1.B.st.v2").answer, "star");
});

test("every authored audio-dependent item in the repaired banks resolves production word audio", () => {
  for (const source of sources) {
    for (const item of expandedBySkill[source.skillId]) {
      const requirements = [];
      if (item.mediaTier === "audio-required") {
        requirements.push(["target-word", item.targetWord || item.answer]);
      }
      if (item.hideWrittenLabels) {
        assert.equal(item.evidenceModality, "audio+image", `${item.id} must declare its hidden-label modality`);
        if (item.targetWord) requirements.push(["spoken-anchor", item.targetWord]);
        for (const card of item.imageCards || []) requirements.push(["answer-card", card.word || card.label]);
      }
      for (const [role, word] of requirements) {
        const audioPath = getLedaWordAudioPath(word);
        assert.ok(audioPath, `${item.id} needs ${role} audio for ${word}`);
        assert.equal(fs.existsSync(path.join(ROOT, "public", audioPath.replace(/^\//, ""))), true);
      }
    }
  }
});

test("G9 fails for missing audio-required targets and hidden-label answer cards", t => {
  const scenarios = [
    { skillId: "blends", word: "block", role: "target-word" },
    { skillId: "short_vowel_discrimination", word: "sun", role: "answer-card" }
  ];

  for (const { skillId, word, role } of scenarios) {
    const audioPath = getLedaWordAudioPath(word);
    assert.ok(audioPath, `the ${word} control recording must exist before it can be hidden from the gate`);
    const hiddenAudio = path.join(ROOT, "public", audioPath.replace(/^\//, ""));
    assert.equal(fs.existsSync(hiddenAudio), true);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "literacypath-audio-gate-"));
    t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
    const preloadPath = path.join(tempDir, "hide-one-audio-file.mjs");
    fs.writeFileSync(preloadPath, [
      'import fs from "node:fs";',
      'import path from "node:path";',
      'const originalExistsSync = fs.existsSync.bind(fs);',
      `const hiddenAudio = ${JSON.stringify(hiddenAudio)};`,
      'fs.existsSync = value => path.resolve(String(value)) === path.resolve(hiddenAudio)',
      '  ? false',
      '  : originalExistsSync(value);'
    ].join("\n"));

    const importHook = `--import=${pathToFileURL(preloadPath).href}`;
    const result = spawnSync(process.execPath, ["tools/assessmentRebuild/gate.mjs", "--skill", skillId], {
      cwd: ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, importHook].filter(Boolean).join(" ")
      },
      timeout: 120_000
    });
    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    assert.match(output, /G9:FAIL/);
    assert.match(output, new RegExp(`L-AUDIO-REQUIRED .*${role} audio for "${word}"`));
  }
});
