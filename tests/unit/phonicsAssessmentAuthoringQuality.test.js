import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { expandBank, checkFreshRetry, independentLengthShortcuts, makeImageResolver, lintBank, loadLexicon, ROOT } from "../../tools/assessmentRebuild/lib.mjs";
import { getSkillBlueprint } from "../../src/content/blueprints/skillBlueprints.js";
import { OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS } from "../../src/content/assessments/v3/objectiveAssessmentImageReviews.js";
import { ASSESSMENT_IMAGE_STYLE_DECISIONS } from "../../src/content/assessments/v3/assessmentImageStyleDecisions.js";
import { ASSESSMENT_REJECTED_IMAGE_HASHES } from "../../src/content/assessments/v3/assessmentImageReviewPolicy.js";

const skillIds = [
  "initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels",
  "short_vowel_discrimination", "hfw_1_25", "hfw_26_50", "hfw_51_75",
  "hfw_76_100", "blends", "digraphs", "long_vowels_silent_e",
  "vowel_teams", "r_controlled_vowels"
];
const sources = Object.fromEntries(await Promise.all(skillIds.map(async skillId => [
  skillId, (await import(`../../tools/assessmentRebuild/authoring/${skillId}.mjs`)).default
])));
const key = item => item.choices.find(choice => choice.k)?.t;
const label = (skillId, item) => `${skillId}/L${item.lvl}/${item.u}/v${item.v}`;

test("every phonics phase can deliver two complete fresh sittings without using reserves", () => {
  for (const [skillId, source] of Object.entries(sources)) {
    const blueprint = getSkillBlueprint(skillId);
    const result = checkFreshRetry(expandBank(source, blueprint), blueprint);
    assert.equal(result.pass, true, `${skillId}: ${JSON.stringify(result.phases)}`);
  }
});

test("normal phonics items have distinct tasks, not just different IDs or distractors", () => {
  for (const [skillId, source] of Object.entries(sources)) {
    const seen = new Map();
    for (const item of source.items.filter(item => !item.retention)) {
      const signature = JSON.stringify([
        item.lvl, item.fmt, item.prompt, item.sentence, item.target, key(item)
      ]);
      assert.ok(!seen.has(signature), `${label(skillId, item)} repeats ${seen.get(signature)}`);
      seen.set(signature, label(skillId, item));
      assert.equal(item.choices.filter(choice => choice.k).length, 1, label(skillId, item));
      assert.equal(new Set(item.choices.map(choice => choice.t)).size, item.choices.length, label(skillId, item));
      if (item.soundTiles) assert.equal(item.soundTiles.join(""), key(item), label(skillId, item));
    }
  }
});

test("an isolated HFW recording never asks children to distinguish homophones", () => {
  // Include common accent variants: been/bean/bin, which/witch, were/where.
  const homophones = [
    ["be", "bee"], ["to", "too", "two"], ["by", "buy", "bye"],
    ["their", "there", "they're"], ["which", "witch"], ["see", "sea"],
    ["some", "sum"], ["would", "wood"], ["write", "right", "wright"],
    ["been", "bean", "bin"], ["were", "where"], ["one", "won"],
    ["no", "know"], ["your", "you're"], ["for", "four", "fore"]
  ];
  for (const skillId of skillIds.filter(id => id.startsWith("hfw_"))) {
    for (const item of sources[skillId].items.filter(item => item.fmt === "HFW_AUDIO_FIND_WORD")) {
      const family = homophones.find(words => words.includes(key(item)));
      if (family) assert.deepEqual(item.choices.filter(choice => family.includes(choice.t)).map(choice => choice.t), [key(item)], label(skillId, item));
      assert.equal(item.target.toLowerCase(), key(item).toLowerCase());
      assert.equal(item.audioRole, "target_word");
    }
  }
});

test("rhyming choices cannot be solved from printed suffixes", () => {
  for (const item of sources.rhyming.items) {
    assert.equal(item.hideWrittenLabels, true, label("rhyming", item));
    assert.equal(item.constructClaim, "spoken_rhyme_discrimination");
    if (item.lvl === 2) assert.equal(item.evidenceModality, "audio");
    if (item.target) assert.ok(!item.prompt.toLowerCase().split(/[^a-z]+/).includes(item.target), label("rhyming", item));
    if (item.fmt === "RHYME_ODD_ONE_OUT") assert.equal(item.target, undefined);
  }
  const corn = sources.rhyming.items.find(item => item.lvl === 2 && item.u === "or" && item.v === 3);
  // /ɔː(r)n/ rhymes; fort has a different coda and cannot join this trio.
  assert.deepEqual(corn.choices.filter(choice => !choice.k).map(choice => choice.t).sort(), ["corn", "horn", "torn"]);
  assert.equal(key(corn), "bed");
});

test("short-vowel listening contrasts retain a same-consonant alternative", () => {
  const consonants = word => word.replace(/[aeiou]+/g, "_");
  for (const item of sources.short_vowel_discrimination.items.filter(item => item.fmt === "LISTEN_FIND_WORD")) {
    assert.ok(item.choices.some(choice => !choice.k && consonants(choice.t) === consonants(key(item))), label("short_vowel_discrimination", item));
  }
  for (const item of sources.cvc_short_vowels.items.filter(item => item.evidenceModality === "audio+print" && item.target === key(item) && item.choices.length > 1)) {
    assert.ok(item.choices.some(choice => !choice.k && consonants(choice.t) === consonants(key(item))), label("cvc_short_vowels", item));
  }
});

test("authored phonics uses approved current pixels and cannot revive globally rejected images", () => {
  const rejected = Object.values(OBJECTIVE_ASSESSMENT_IMAGE_REVIEWS).filter(review => review.status === "rejected");
  const rejectedPaths = new Set(rejected.map(review => review.path));
  const hashes = new Map();
  const hash = imagePath => {
    if (!hashes.has(imagePath)) hashes.set(imagePath,
      createHash("sha256").update(fs.readFileSync(path.join(ROOT, "public", imagePath))).digest("hex"));
    return hashes.get(imagePath);
  };
  const rejectedHashes = new Set([
    ...rejected.map(review => hash(review.path)),
    ...Object.keys(ASSESSMENT_REJECTED_IMAGE_HASHES)
  ]);
  for (const [skillId, source] of Object.entries(sources)) {
    const items = expandBank(source, getSkillBlueprint(skillId), source.imageResolver || makeImageResolver());
    for (const item of items) {
      const paths = [item.imagePath, ...(item.imageCards || []).map(card => card.image)].filter(Boolean);
      for (const imagePath of paths) {
        assert.equal(rejectedPaths.has(imagePath), false, `${item.id}: rejected path ${imagePath}`);
        assert.equal(rejectedHashes.has(hash(imagePath)), false, `${item.id}: rejected pixels ${imagePath}`);
        const decision = ASSESSMENT_IMAGE_STYLE_DECISIONS[imagePath];
        assert.equal(decision?.visualReview, "approved", `${item.id}: no current composite approval for ${imagePath}`);
        assert.equal(decision.sha256, hash(imagePath), `${item.id}: reviewed pixels changed at ${imagePath}`);
      }
    }
  }
});

test("the short-u CVC reserve keeps an independent heard contrast and stable retention identity", () => {
  const source = sources.cvc_short_vowels;
  const reserve = source.items.find(item => item.lvl === 2 && item.u === "short_u" && item.v === 8);
  assert.equal(reserve.retention, true);
  assert.equal(reserve.target, "lump");
  assert.equal(reserve.media, "audio-required");
  assert.equal(reserve.audioRole, "target_word");
  assert.deepEqual(new Set(reserve.choices.map(choice => choice.t)), new Set(["lump", "lamp", "limp", "lift"]));
  assert.equal(source.items.filter(item => item.lvl === 2 && item.target === reserve.target && key(item) === key(reserve)).length, 1);
  const expanded = expandBank(source, getSkillBlueprint("cvc_short_vowels"));
  assert.ok(expanded.some(item => item.id === "lp3.cvc_short_vowels.l2.R.short_u.v8r" && item.answer === "lump"));
});

test("CVC and short-vowel phases each cover all five vowels", () => {
  for (const skillId of ["cvc_short_vowels", "short_vowel_discrimination"]) {
    for (const level of [1, 2]) for (const phase of [1, 2]) {
      const units = new Set(sources[skillId].items.filter(item => item.lvl === level && item.ph === phase && !item.retention).map(item => item.u));
      assert.deepEqual([...units].sort(), ["short_a", "short_e", "short_i", "short_o", "short_u"], `${skillId}/L${level}/P${phase}`);
    }
  }
});

test("silent-e contrasts require hearing vowels, not appending or deleting printed e", () => {
  for (const item of sources.long_vowels_silent_e.items.filter(item => item.fmt === "SILENT_E_TRANSFORM")) {
    assert.equal(item.target, key(item), label("long_vowels_silent_e", item));
    assert.equal(item.audioRole, "target_word");
    assert.equal(item.constructClaim, "silent_e_vowel_contrast");
    assert.doesNotMatch(item.prompt, /add e|take.*e away/i);
  }
});

test("a short silent-e contrast needs its approved long partner, correct vowel family, and heard key", () => {
  const blueprint = getSkillBlueprint("long_vowels_silent_e");
  const items = expandBank(sources.long_vowels_silent_e, blueprint);
  const lexicon = loadLexicon();
  const tap = items.find(item => item.targetWord === "tap" && item.answer === "tap");
  assert.ok(tap);
  const lexicalIssues = (item, approved = lexicon) => lintBank([item], blueprint, approved).filter(issue => issue.code === "L-LEX");
  assert.deepEqual(lexicalIssues(tap), []);
  assert.equal(lexicon.phonics.a_e.includes("tap"), false, "the short word must not be classified as a long vowel");
  for (const [reason, invalid] of [
    ["wrong vowel family", { ...tap, itemKey: "i_e" }],
    ["wrong heard answer", { ...tap, answer: "tape" }],
    ["missing matching long partner", { ...tap, choices: tap.choices.filter(choice => choice !== "tape") }],
    ["missing contrast contract", { ...tap, constructClaim: undefined }]
  ]) assert.ok(lexicalIssues(invalid).length, reason);
  const missingApproval = { ...lexicon, phonics: { ...lexicon.phonics, a_e: lexicon.phonics.a_e.filter(word => word !== "tape") } };
  assert.ok(lexicalIssues(tap, missingApproval).length, "an unapproved long partner cannot grant the exception");
});

test("L2 final endings require explicit spoken contracts and reject genuine partial-ending distractors", () => {
  const blueprint = getSkillBlueprint("final_sounds");
  const items = expandBank(sources.final_sounds, blueprint);
  const letters = items.find(item => item.level === 2 && item.itemKey === "nd" && item.formatType === "ENDING_SOUND");
  const words = items.find(item => item.level === 2 && item.itemKey === "nd" && item.formatType === "FINAL_SOUND_PAIR_SELECT");
  const ambiguities = item => lintBank([item], blueprint, loadLexicon()).filter(issue => issue.code === "L-AMBIG");
  assert.deepEqual(ambiguities(letters), []);
  assert.deepEqual(ambiguities(words), []);
  assert.ok(ambiguities({ ...letters, spokenPrompt: "Hand. Choose an answer." }).length);
  assert.ok(ambiguities({ ...words, targetWord: undefined }).length);
  assert.ok(ambiguities({ ...words, spokenPrompt: "Hand. Choose an answer." }).length);
  assert.ok(ambiguities({ ...letters, choices: ["nd", "d", "nk", "h"] }).some(issue => /partial ending/.test(issue.message)));
  assert.ok(ambiguities({ ...words, choices: ["pond", "bed", "nut", "hen"] }).some(issue => /partial ending/.test(issue.message)));
});

test("final-sound validation distinguishes digraph sounds from their individual letters", () => {
  const blueprint = getSkillBlueprint("final_sounds");
  const items = expandBank(sources.final_sounds, blueprint);
  for (const [unit, contrast] of [["sh", "tooth"], ["th", "fish"], ["ng", "dog"]]) {
    const item = items.find(candidate => candidate.level === 2 && candidate.itemKey === unit && candidate.formatType === "FINAL_SOUND_PAIR_SELECT");
    const choices = [item.answer, contrast, ...item.choices.filter(choice => choice !== item.answer).slice(1)];
    const ambiguities = lintBank([{ ...item, choices }], blueprint, loadLexicon()).filter(issue => issue.code === "L-AMBIG");
    assert.deepEqual(ambiguities, [], `${unit}: ${contrast} shares no final phoneme with the anchor`);
  }
});

test("sound prompts do not supply a printed anchor or answer length", () => {
  for (const item of sources.final_sounds.items.filter(item => item.lvl === 2 && item.fmt === "FINAL_SOUND_PAIR_SELECT")) {
    assert.ok(!item.prompt.toLowerCase().split(/[^a-z]+/).includes(item.target));
    assert.equal(item.constructClaim, "final_sound_discrimination");
    assert.equal(item.audioRole, "target_word");
  }
  for (const item of sources.vowel_teams.items.filter(item => item.u === "igh")) {
    assert.doesNotMatch(item.prompt, /three letters/i);
  }
});

test("no independent answer-length strategy reaches the assessment pass mark", () => {
  for (const [skillId, source] of Object.entries(sources)) {
    for (const row of independentLengthShortcuts(expandBank(source, getSkillBlueprint(skillId)))) {
      assert.ok(row.expectedAccuracy < 0.7, `${skillId}: ${JSON.stringify(row)}`);
    }
  }
});
