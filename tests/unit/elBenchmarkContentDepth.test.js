import test from "node:test";
import assert from "node:assert/strict";
import {
  EL_BENCHMARK_FORM_IDS, EL_BENCHMARK_IDS, EL_FLUENCY_PASSAGES_BY_FORM,
  getElBenchmarkPlan, getElBenchmarkSessionPlan
} from "../../src/data/elBenchmarkAssessmentCatalog.js";
import { EL_PA_DEPTH_ITEMS } from "../../src/data/elBenchmarkContentDepth.js";
import { createElBenchmarkSession, selectElBenchmarkForm } from "../../src/data/elBenchmarkSession.js";

const forms = Object.values(EL_BENCHMARK_FORM_IDS);
const windows = ["BOY", "MOY", "EOY"];
const grades = ["K", "1", "2"];
const planFor = (assessmentId, grade, window, formId = forms[0], extra = {}) =>
  getElBenchmarkPlan({ assessmentId, grade, window, formId, ...extra });

test("all 27 spelling forms sample twelve unique words with complete word-sentence-word scripts", () => {
  for (const formId of forms) {
    const acrossWindows = [];
    for (const grade of grades) for (const window of windows) {
      const plan = planFor(EL_BENCHMARK_IDS.ENCODING, grade, window, formId);
      assert.equal(plan.items.length, 12);
      assert.equal(new Set(plan.items.map(item => item.targetWord)).size, 12);
      assert.equal(plan.instructions.practiceExamples.length, 1);
      for (const item of plan.items) {
        assert.equal(item.teacherSay, `${item.targetWord}. ${item.sentence} ${item.targetWord}.`);
        assert.match(item.sentence.toLowerCase(), new RegExp(`\\b${item.targetWord}\\b`));
        assert.ok(item.featureGuidance.length, item.id);
        assert.ok(item.scoringGuidance.accept.includes("Phonologically plausible"));
        assert.match(item.administrationNote, /hidden until the student has written/);
        acrossWindows.push(item.targetWord);
      }
    }
    assert.equal(new Set(acrossWindows).size, 108, `${formId} does not reuse spelling targets between windows`);
  }
});

test("oral forms expand sampling without mistaking graphemes or syllable counts for sound responses", () => {
  for (const formId of forms) for (const grade of grades) for (const window of windows) {
    const plan = planFor(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, grade, window, formId);
    assert.ok(plan.items.length >= 10 && plan.items.length <= 14);
    assert.equal(new Set(plan.items.map(item => item.teacherSay)).size, plan.items.length);
    for (const item of plan.items) {
      assert.match(item.administrationNote, /Oral only/);
      assert.ok(item.expectedAnswers.length);
      assert.ok(item.expectedAnswers.every(answer => !/:\d+$/.test(answer)), "A syllable count alone is not segmentation evidence");
      assert.doesNotMatch(item.teacherSay, /\/x\//, "x must not be modeled as a single phoneme");
      const expectedCount = { three_phoneme: 3, four_phoneme: 4, five_phoneme: 5 }[item.task];
      if (expectedCount && item.strand === "phoneme_blending") {
        assert.equal([...item.teacherSay.matchAll(/\/([^/]+)\//g)].length, expectedCount, item.id);
      }
      if (expectedCount && item.strand === "phoneme_segmentation") {
        assert.equal(item.expectedAnswers[0].trim().split(/\s+/).length, expectedCount, item.id);
      }
      assert.equal(item.teacherJudgmentRequired, !(item.strand === "rhyme" && item.task === "recognition"));
    }
  }
  const c = planFor(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "MOY", forms[2]);
  assert.equal(c.items[7].teacherSay, "Blend /m/ /o/ /p/.");
  assert.deepEqual(c.items[7].expectedAnswers, ["mop"]);
  for (const formId of forms) {
    const grade2 = planFor(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "2", "EOY", formId);
    assert.equal(grade2.items[0].expectedAnswers[0].split(" ").length, 4, "Four syllables in each EOY form");
    assert.equal(grade2.items[4].expectedAnswers[0].split(" ").length, 6, "Six phonemes in each EOY cluster segmentation task");
  }
});

test("new deletion and substitution items change exactly the requested sound", () => {
  // Independently transcribed oral forms. Spelling changes are deliberately
  // irrelevant: cold→coal, lamp→lamb and wild→while retain their spoken vowels.
  const dictionary = {
    lamp: "l a m p", lamb: "l a m", bend: "b e n d", ben: "b e n", cold: "k oh l d", coal: "k oh l",
    dog: "d o g", dot: "d o t", pig: "p i g", pin: "p i n", cup: "k u p", cut: "k u t",
    bed: "b e d", bad: "b a d", bag: "b a g", big: "b i g", hot: "h o t", hat: "h a t",
    tent: "t e n t", ten: "t e n", went: "w e n t", when: "w e n", best: "b e s t", bess: "b e s",
    ship: "sh i p", shop: "sh o p", chop: "ch o p", chip: "ch i p", paint: "p ay n t", pain: "p ay n",
    wild: "w eye l d", while: "w eye l", mild: "m eye l d", mile: "m eye l", told: "t oh l d", toll: "t oh l",
    stamp: "s t a m p", stump: "s t u m p", track: "t r a k", trick: "t r i k", stack: "s t a k", stuck: "s t u k",
    slip: "s l i p", slop: "s l o p", spin: "s p i n", spun: "s p u n", drip: "d r i p", drop: "d r o p",
    splat: "s p l a t", spat: "s p a t", brand: "b r a n d", band: "b a n d", glide: "g l eye d", guide: "g eye d",
    clamp: "k l a m p", clams: "k l a m z", spent: "s p e n t", spend: "s p e n d", tens: "t e n z"
  };
  let checked = 0;
  for (const route of Object.values(EL_PA_DEPTH_ITEMS)) for (const rows of Object.values(route)) for (const item of rows) {
    if (!["phoneme_deletion", "phoneme_substitution"].includes(item.strand)) continue;
    const target = /(?:Say |in )([a-z]+) (?:without|to)/.exec(item.teacherSay)?.[1];
    assert.ok(target, item.teacherSay);
    const before = dictionary[target]?.split(" ");
    const after = dictionary[item.expectedAnswers[0].toLowerCase()]?.split(" ");
    assert.ok(before && after, `${target} needs an independent oral transcription`);
    if (item.strand === "phoneme_deletion") {
      const deleted = /without \/([^/]+)\//.exec(item.teacherSay)[1];
      const position = item.task === "final" ? before.length - 1 : before.indexOf(deleted);
      assert.equal(before[position], deleted, item.teacherSay);
      assert.deepEqual(before.filter((_, i) => i !== position), after, item.teacherSay);
    } else {
      assert.equal(before.length, after.length, item.teacherSay);
      const changed = before.map((sound, i) => sound === after[i] ? -1 : i).filter(i => i >= 0);
      assert.equal(changed.length, 1, item.teacherSay);
      const replacement = /to \/([^/]+)\//.exec(item.teacherSay)[1];
      // Unvoiced /s/ becomes voiced /z/ in the ordinary plural clams; the
      // script must name the sound actually heard, not just its written s.
      assert.equal(after[changed[0]], replacement, item.teacherSay);
    }
    checked += 1;
  }
  assert.equal(checked, 33);
});

test("current word-reading bands retain eight items while removing future vowel patterns from early-full forms", () => {
  for (const formId of forms) {
    const early = planFor(EL_BENCHMARK_IDS.DECODING, "1", "EOY", formId, { startMicrophase: "early_full" });
    const band = early.items.filter(item => item.bandId === "early_full");
    assert.equal(band.length, 8);
    assert.equal(early.administration.stopRule.denominator, 8);
    assert.equal(early.administration.stopRule.threshold, 5);
    assert.ok(band.every(item => !["wharf", "whilst"].includes(item.targetWord)));
    assert.ok(band.every(item => item.featureGuidance.length && /isolated word/.test(item.administrationNote)));
  }
  const a = planFor(EL_BENCHMARK_IDS.ENCODING, "2", "MOY", forms[0]);
  const b = planFor(EL_BENCHMARK_IDS.ENCODING, "2", "MOY", forms[1]);
  assert.deepEqual(a.items.find(item => item.targetWord === "movement").featureTags, ["suffix", "exceptional_vowel"]);
  assert.ok(b.items.find(item => item.targetWord === "payment").featureTags.includes("vowel_team"));
  assert.ok(b.items.find(item => item.targetWord === "neatly").featureTags.includes("vowel_team"));
});

test("all thirty fluency passages have truthful word counts, real focus examples and an unscored meaning follow-up", () => {
  for (const passages of Object.values(EL_FLUENCY_PASSAGES_BY_FORM)) {
    assert.equal(passages.length, 10);
    for (const passage of passages) {
      const tokens = passage.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g);
      assert.equal(tokens.length, passage.wordCount);
      assert.equal(passage.wordAudit.auditedWordCount, tokens.length);
      assert.equal(passage.wordAudit.meetsMinimumOpportunity, true);
      const vocabulary = new Set(tokens.map(word => word.toLowerCase()));
      for (const word of passage.featureAudit.focusWords) assert.ok(vocabulary.has(word.toLowerCase()), `${passage.id}: ${word}`);
      assert.equal(passage.meaningCheck.scored, false);
      assert.match(passage.meaningCheck.administrationNote, /after timing.*complete text/);
      assert.deepEqual(passage.prosodyRubric.levels.map(level => level.score), [1, 2, 3, 4]);
      assert.match(passage.finishEarlyProtocol, /Do not extrapolate or report WCPM/);
    }
    assert.deepEqual(passages[1].featureTags, ["cvc", "short_vowels", "one_to_one_cvc"]);
    assert.ok(!passages[4].featureTags.includes("silent_e"));
  }
});

test("new sessions freeze their administered plan and reject mismatched saved snapshots", () => {
  const session = createElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, grade: "K", window: "BOY",
    ownership: { studentId: "content-depth-test", teacherId: "teacher-1" },
    sessionToken: "content-depth", startedAt: "2026-09-28T00:00:00Z"
  });
  assert.equal(session.responseSchemaVersion, 3);
  assert.equal(session.administrationVersion, "2026.09.28-v2");
  const resumed = getElBenchmarkSessionPlan(session);
  resumed.items[0].teacherSay = "changed outside the session";
  assert.notEqual(session.planSnapshot.items[0].teacherSay, resumed.items[0].teacherSay);
  assert.throws(() => getElBenchmarkSessionPlan({ ...session, formId: "form-b-v2" }), /does not match/);
  assert.throws(() => getElBenchmarkSessionPlan({ ...session, startMicrophase: "late_full" }), /does not match/);
  assert.throws(() => getElBenchmarkSessionPlan({ ...session, planSnapshot: { ...session.planSnapshot, items: [session.planSnapshot.items[0], session.planSnapshot.items[0]] } }), /does not match/);
});

test("exact legacy form IDs replay original content for unfinished drafts without changing current forms", () => {
  const legacyA = getElBenchmarkSessionPlan({ assessmentId: EL_BENCHMARK_IDS.ENCODING, grade: "1", window: "MOY", formId: "form-a-v2" });
  assert.equal(legacyA.contentVersion, "2026.07.21-v2");
  assert.equal(legacyA.items.length, 8);
  assert.equal(legacyA.items[0].id, "enc-1-moy-01");
  assert.equal(legacyA.items[0].targetWord, "cake");
  const legacyC = getElBenchmarkSessionPlan({ assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, grade: "K", window: "MOY", formId: "form-c-v1" });
  assert.equal(legacyC.items[7].teacherSay, "Blend /f/ /o/ /x/.", "Historical stimulus remains what was actually administered, including its former defect");
  assert.equal(planFor(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "MOY", "C").items[7].teacherSay, "Blend /m/ /o/ /p/.");
  const selected = selectElBenchmarkForm({ studentId: "s", assessmentId: EL_BENCHMARK_IDS.ENCODING, grade: "1", window: "MOY", assessmentHistory: [{ id: "draft", studentId: "s", assessmentType: EL_BENCHMARK_IDS.ENCODING, grade: "1", benchmarkWindow: "MOY", status: "in_progress", formId: "form-b-v1", updatedAt: "2026-09-27T00:00:00Z" }] });
  assert.equal(selected.formId, "form-b-v1");
  assert.equal(selected.resumeAttemptId, "draft");
});
