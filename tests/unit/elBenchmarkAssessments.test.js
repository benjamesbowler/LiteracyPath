import test from "node:test";
import assert from "node:assert/strict";
import {
  EL_ADMINISTRATION_STATUSES,
  EL_BENCHMARK_CATALOG,
  EL_BENCHMARK_CONTENT_VERSION,
  EL_BENCHMARK_FORM_ID,
  EL_BENCHMARK_IDS,
  EL_DECODING_MICROPHASES,
  EL_FLUENCY_PASSAGES,
  EL_ITEM_RESPONSE_STATUSES,
  buildElBenchmarkAttempt,
  getElBenchmarkPlan,
  scoreElBenchmarkSession
} from "../../src/data/elBenchmarkAssessments.js";

const GRADES = ["K", "1", "2"];
const WINDOWS = ["BOY", "MOY", "EOY"];
const ASSESSMENT_IDS = Object.values(EL_BENCHMARK_IDS);

const EXPECTED_DECODING_WORDS = Object.freeze({
  middle_pre: ["an", "if", "in", "it", "on", "up", "sat", "mat"],
  early_partial: ["man", "rag", "ten", "web", "lip", "nod", "run", "mud"],
  middle_partial: ["back", "bell", "kiss", "sock", "duck", "wax", "buzz", "quit"],
  late_partial: ["shed", "chin", "math", "whip", "crab", "grip", "lamp", "desk"],
  early_full: ["shelf", "chest", "thank", "whisk", "scrap", "twist", "blend", "crust"],
  middle_full: ["gate", "kite", "rope", "mule", "mail", "feet", "coat", "tray"],
  late_full: ["storm", "fern", "shirt", "burn", "join", "boy", "pouch", "room"],
  early_consolidated: ["sandpit", "kitten", "basket", "cobweb", "helmet", "lemon", "helper", "landed"],
  middle_consolidated: ["thankful", "skipping", "wished", "unlock", "reader", "endless", "melted", "recheck"],
  late_consolidated: ["wonderful", "remember", "musician", "cheerfulness", "preview", "misbehave", "agreement", "quietly"]
});

const EXPECTED_ROUTES = {
  "K-BOY": ["middle_pre", 1, "middle_pre", "middle_pre"],
  "K-MOY": ["early_partial", 15, "middle_pre", "early_partial"],
  "K-EOY": ["middle_partial", 25, "early_partial", "late_partial"],
  "1-BOY": ["late_partial", 26, "early_partial", "late_partial"],
  "1-MOY": ["middle_full", 39, "late_partial", "middle_full"],
  "1-EOY": ["late_full", 50, "early_full", "late_full"],
  "2-BOY": ["early_consolidated", 51, "middle_full", "early_consolidated"],
  "2-MOY": ["middle_consolidated", 61, "late_full", "middle_consolidated"],
  "2-EOY": ["late_consolidated", 75, "early_consolidated", "late_consolidated"]
};

function plan(assessmentId, grade = "K", window = "BOY", extra = {}) {
  return getElBenchmarkPlan({ assessmentId, grade, window, ...extra });
}

function decodingResponses(items, automaticCount, correctCount = items.length) {
  return Object.fromEntries(items.map((item, index) => [item.id, {
    status: index < correctCount ? EL_ITEM_RESPONSE_STATUSES.CORRECT : EL_ITEM_RESPONSE_STATUSES.INCORRECT,
    isCorrect: index < correctCount,
    responseText: index < correctCount ? item.targetWord : `${item.targetWord}-different`,
    automatic: index < automaticCount
  }]));
}

test("public catalog exposes all four original provisional assessment domains", () => {
  assert.equal(EL_BENCHMARK_CONTENT_VERSION, "2026.07.21-v2");
  assert.equal(EL_BENCHMARK_FORM_ID, "form-a-v2");
  assert.deepEqual(EL_BENCHMARK_CATALOG.map(row => row.id), ASSESSMENT_IDS);
  assert.ok(EL_BENCHMARK_CATALOG.every(row => row.framework.label === "Literacy Guide provisional"));
  assert.ok(EL_BENCHMARK_CATALOG.every(row => /not an official/i.test(row.framework.disclaimer)));
  assert.deepEqual(
    EL_BENCHMARK_CATALOG.find(row => row.id === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY).routineGrades,
    ["1", "2"]
  );
  assert.deepEqual(
    EL_BENCHMARK_CATALOG.find(row => row.id === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY).optionalGrades,
    ["K"]
  );
});

test("all 36 grade-window-domain plans are deterministic and serializable", () => {
  for (const assessmentId of ASSESSMENT_IDS) {
    for (const grade of GRADES) {
      for (const window of WINDOWS) {
        const first = plan(assessmentId, grade, window);
        const second = plan(assessmentId, grade, window);
        assert.deepEqual(first, second, `${assessmentId} ${grade} ${window} is stable`);
        assert.doesNotThrow(() => JSON.stringify(first));
        assert.equal(first.grade, grade);
        assert.equal(first.window, window);
        assert.ok(first.items.length > 0);
        assert.equal(new Set(first.items.map(item => item.id)).size, first.items.length);
      }
    }
  }
});

test("grade-window decoding expectations and administration ranges match the supplied overview", () => {
  for (const [routeKey, [microphase, cycle, rangeStart, rangeEnd]] of Object.entries(EXPECTED_ROUTES)) {
    const [grade, window] = routeKey.split("-");
    const decoded = plan(EL_BENCHMARK_IDS.DECODING, grade, window);
    assert.equal(decoded.route.expectedMicrophase, microphase, `${routeKey} expected microphase`);
    assert.equal(decoded.route.expectedCycle, cycle, `${routeKey} expected cycle`);
    assert.equal(decoded.route.administrationRange.startMicrophase, rangeStart, `${routeKey} range start`);
    assert.equal(decoded.route.administrationRange.endMicrophase, rangeEnd, `${routeKey} range end`);
    assert.equal(decoded.route.selectedStartMicrophase, microphase, `${routeKey} fallback start`);
    assert.equal(decoded.items[0].microphase, microphase, `${routeKey} begins at selected/expected band`);
  }
  const kMoy = plan(EL_BENCHMARK_IDS.DECODING, "K", "MOY");
  assert.equal(kMoy.route.administrationRange.decodingRoutine, "optional_after_letter_sound_prerequisite");
  assert.equal(kMoy.administration.isRoutineForGrade, false);
  assert.equal(kMoy.route.administrationRange.encodingRoutine, "routine_after_letter_sound_prerequisite");

  for (const windowName of ["BOY", "MOY", "EOY"]) {
    const encoding = plan(EL_BENCHMARK_IDS.ENCODING, "K", windowName);
    assert.equal(encoding.administration.isRoutineForGrade, false);
    assert.match(encoding.administration.optionalReason, /not routine|letter-sound/i);
  }
  const kEoyDecoding = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY");
  assert.equal(kEoyDecoding.route.administrationRange.decodingRoutine, "routine_after_letter_sound_prerequisite");
  assert.equal(kEoyDecoding.administration.isRoutineForGrade, false);
});

test("encoding-indicated decoding start is never silently prepended with an easier route band", () => {
  const middleFull = plan(EL_BENCHMARK_IDS.DECODING, "1", "MOY", { startMicrophase: "middle_full" });
  assert.deepEqual(Array.from(new Set(middleFull.items.map(item => item.microphase))), ["middle_full"]);

  const latePartial = plan(EL_BENCHMARK_IDS.DECODING, "1", "MOY", { startMicrophase: "late_partial" });
  assert.deepEqual(
    Array.from(new Set(latePartial.items.map(item => item.microphase))),
    ["late_partial", "early_full", "middle_full"]
  );
  assert.throws(
    () => plan(EL_BENCHMARK_IDS.DECODING, "K", "BOY", { startMicrophase: "late_full" }),
    /outside.*route/i
  );
});

test("every named decoding band has exactly eight fixed items and the ≤5 stop rule", () => {
  const accessPlans = [
    plan(EL_BENCHMARK_IDS.DECODING, "K", "BOY"),
    plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" }),
    plan(EL_BENCHMARK_IDS.DECODING, "1", "EOY", { startMicrophase: "early_full" }),
    plan(EL_BENCHMARK_IDS.DECODING, "2", "BOY", { startMicrophase: "middle_full" }),
    plan(EL_BENCHMARK_IDS.DECODING, "2", "MOY", { startMicrophase: "late_full" }),
    plan(EL_BENCHMARK_IDS.DECODING, "2", "EOY", { startMicrophase: "early_consolidated" })
  ];
  const byBand = new Map();
  for (const decoded of accessPlans) {
    assert.equal(decoded.administration.stopRule.threshold, 5);
    assert.equal(decoded.administration.stopRule.denominator, 8);
    for (const item of decoded.items) {
      if (!byBand.has(item.bandId)) byBand.set(item.bandId, new Map());
      byBand.get(item.bandId).set(item.id, item);
    }
  }
  assert.deepEqual(Array.from(byBand.keys()), EL_DECODING_MICROPHASES.map(row => row.id));
  for (const microphase of EL_DECODING_MICROPHASES) {
    const items = Array.from(byBand.get(microphase.id).values());
    assert.equal(items.length, 8, `${microphase.id} has exactly eight items`);
    assert.ok(items.every((item, index) => item.position === index + 1));
    assert.deepEqual(
      items.map(item => item.targetWord),
      EXPECTED_DECODING_WORDS[microphase.id],
      `${microphase.id} fixed v2 word bank`
    );
    assert.ok(items.every(item => item.id.endsWith("-v2")), `${microphase.id} item ids are versioned`);
  }
});

test("Encoding and Decoding use matched-pattern but non-overlapping target words", () => {
  const encodingTargets = new Set();
  for (const grade of GRADES) {
    for (const window of WINDOWS) {
      plan(EL_BENCHMARK_IDS.ENCODING, grade, window).items.forEach(item => {
        encodingTargets.add(item.targetWord);
      });
    }
  }
  const decodingTargets = Object.values(EXPECTED_DECODING_WORDS).flat();
  assert.equal(decodingTargets.length, 80);
  assert.equal(new Set(decodingTargets).size, decodingTargets.length, "decoding words do not repeat across bands");
  assert.deepEqual(
    decodingTargets.filter(word => encodingTargets.has(word)),
    [],
    "spoken Encoding targets cannot cue the later isolated Decoding items"
  );
});

test("Early-to-Middle Partial progression is explicit and construct-distinct", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const early = decoded.items.filter(item => item.bandId === "early_partial");
  const middle = decoded.items.filter(item => item.bandId === "middle_partial");
  const earlyMetadata = EL_DECODING_MICROPHASES.find(row => row.id === "early_partial");
  const middleMetadata = EL_DECODING_MICROPHASES.find(row => row.id === "middle_partial");
  const middleComplexityTags = new Set(["final_ck", "final_double", "final_x", "initial_qu"]);

  assert.match(earlyMetadata.constructFocus, /one-to-one.*CVC/i);
  assert.match(middleMetadata.constructFocus, /closed.*complexity/i);
  assert.match(middleMetadata.progressionBasis, /after the transparent Early Partial band/i);
  assert.ok(early.every(item => item.featureTags.includes("cvc") && item.featureTags.includes("one_to_one_cvc")));
  assert.ok(middle.every(item => item.featureTags.includes("closed_syllable")));
  assert.ok(middle.every(item => item.featureTags.some(tag => middleComplexityTags.has(tag))));
  assert.ok(middle.every(item => item.constructFocus === middleMetadata.constructFocus));
});

test("automaticity guidance uses teacher judgement and invents no seconds cutoff", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "1", "BOY");
  const guidance = decoded.instructions.teacher.join(" ");
  assert.match(guidance, /teacher judgement/i);
  assert.doesNotMatch(guidance, /\bthree seconds\b|\b3 seconds\b/i);
});

test("original fluency passages are stable, dedicated, correctly counted, and K is optional", () => {
  const ids = new Set();
  const texts = new Set();
  for (const grade of GRADES) {
    for (const window of WINDOWS) {
      const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, grade, window);
      const passage = fluency.passage;
      const independentlyCounted = (passage.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
      assert.equal(passage.wordCount, independentlyCounted, `${passage.id} word count`);
      assert.equal(fluency.items[0].id, passage.id);
      assert.ok(passage.wordCount >= 20);
      ids.add(passage.id);
      texts.add(passage.text);
      assert.equal(fluency.administration.isRoutineForGrade, grade !== "K");
    }
  }
  assert.equal(ids.size, 9);
  assert.equal(texts.size, 9);
});

test("fluency has one phase-controlled full-minute opportunity for every named microphase", () => {
  assert.deepEqual(
    EL_FLUENCY_PASSAGES.map(passage => passage.microphase),
    EL_DECODING_MICROPHASES.map(microphase => microphase.id)
  );
  assert.equal(new Set(EL_FLUENCY_PASSAGES.map(passage => passage.id)).size, 10);
  assert.equal(new Set(EL_FLUENCY_PASSAGES.map(passage => passage.text)).size, 10);
  assert.ok(EL_FLUENCY_PASSAGES.some(passage => passage.microphase === "early_full"));
  for (const passage of EL_FLUENCY_PASSAGES) {
    const independentlyCounted = (passage.text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
    assert.equal(passage.wordCount, independentlyCounted, `${passage.microphase} exact word count`);
    assert.equal(passage.wordAudit.auditedWordCount, independentlyCounted);
    assert.equal(passage.wordAudit.meetsMinimumOpportunity, true);
    assert.ok(passage.featureAudit.primaryPatterns.length > 0);
    assert.match(passage.featureAudit.controlNotes, /word|vowel|blend|prefix|suffix|morphology|syllable/i);
    assert.match(passage.finishEarlyProtocol, /do not extrapolate or report WCPM/i);
    if (passage.microphaseOrder >= 5) assert.ok(passage.wordCount >= 100, `${passage.microphase} later passage length`);
  }
});

test("fluency plans begin at the decoding handoff and expose every higher named passage", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "2", "EOY", {
    startMicrophase: "early_full"
  });
  const expected = EL_DECODING_MICROPHASES.slice(4).map(row => row.id);
  assert.deepEqual(fluency.items.map(item => item.microphase), expected);
  assert.deepEqual(fluency.passages.map(item => item.id), fluency.items.map(item => item.id));
  assert.equal(fluency.passage.id, fluency.items[0].id);
  assert.equal(fluency.administration.stopRule.metric, "teacher_accuracy_judgment");
  assert.equal(fluency.administration.stopRule.operator, "explicit_false");
  assert.equal(fluency.administration.stopRule.requiredTimingSeconds, 60);
  assert.equal(fluency.administration.stopRule.accuracyPercentageCutoff, null);
});

test("phoneme manipulation regression keys each make the named single operation", () => {
  const items = new Map();
  for (const grade of GRADES) {
    for (const window of WINDOWS) {
      for (const item of plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, grade, window).items) {
        items.set(item.id, item);
      }
    }
  }
  const expected = {
    "pa-1-eoy-09": ["Change the /b/ in brag to /d/", "drag"],
    "pa-2-boy-07": ["Say crash without /r/", "cash"],
    "pa-2-moy-08": ["Change the /t/ in track to /k/", "crack"],
    "pa-2-eoy-05": ["every sound in sprint", "s p r i n t"],
    "pa-2-eoy-09": ["Change the /l/ in clam to /r/", "cram"],
    "pa-2-eoy-10": ["Change the /p/ in spoke to /t/", "stoke"],
    "pa-2-eoy-12": ["Say paint without /t/", "pain"]
  };
  for (const [id, [promptPart, answer]] of Object.entries(expected)) {
    assert.ok(items.get(id).teacherSay.includes(promptPart), `${id} prompt`);
    assert.ok(items.get(id).expectedAnswers.includes(answer), `${id} answer`);
  }
  assert.deepEqual(items.get("pa-k-moy-03").expectedAnswers.slice(0, 2), ["rab it", "rab-it"]);
  const manipulationItems = Array.from(items.values()).filter(item =>
    item.strand === "phoneme_deletion" || item.strand === "phoneme_substitution" || item.task === "deletion"
  );
  assert.ok(manipulationItems.length >= 35);
  assert.ok(manipulationItems.every(item => item.expectedAnswers.length > 0));
});

test("the train vowel item requires an unambiguous long-a oral judgment", () => {
  const pa = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "1", "MOY");
  const train = pa.items.find(item => item.id === "pa-1-moy-04");
  assert.ok(train);
  assert.equal(train.expectedAnswers.includes("a"), false);
  assert.equal(train.expectedAnswers.includes("/a/"), false);
  assert.ok(train.expectedAnswers.includes("/eɪ/"));
  assert.equal(train.teacherJudgmentRequired, true);
  assert.equal(train.dialectSensitive, true);
  assert.match(train.administrationNote, /long \/eɪ\/.*dialect/i);
  assert.match(pa.instructions.teacher.join(" "), /dialect-sensitive vowel responses/i);

  const unjudged = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "1",
    window: "MOY",
    administrationStatus: "partial",
    responses: { [train.id]: { status: "recorded", responseText: "a" } }
  });
  assert.equal(unjudged.questionRecords.find(row => row.questionId === train.id).isCorrect, null);
});

test("PA scoring preserves partial and not-scorable item evidence while computing strands", () => {
  const pa = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "BOY");
  const responses = Object.fromEntries(pa.items.map((item, index) => {
    if (index < 4) return [item.id, { status: "correct", isCorrect: true, responseText: item.expectedAnswers?.[0] || "teacher response" }];
    if (index < 6) return [item.id, { status: "incorrect", isCorrect: false, responseText: "teacher response" }];
    if (index === 6) return [item.id, { status: "no_response" }];
    return [item.id, { status: "not_scorable", notScorableReason: "Room interruption" }];
  }));
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses
  });
  assert.equal(score.administrationStatus, "completed");
  assert.equal(score.scoreStatus, "partial");
  assert.equal(score.scoredCount, 7);
  assert.equal(score.correctCount, 4);
  assert.equal(score.incorrectCount, 3);
  assert.equal(score.questionRecords.at(-1).responseStatus, "not_scorable");
  assert.equal(score.completion.notScorableCount, 1);
  assert.ok(score.subtestScores.strands.some(row => row.strand === "rhyme"));
  assert.ok(score.subtestScores.strands.some(row => row.strand === "phoneme_isolation"));
});

test("legacy attempted PA, Encoding, and Decoding items still require recorded response evidence", () => {
  const paPlan = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "1", "BOY");
  const pa = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(paPlan.items.map((item, index) => [item.id, {
      status: "correct",
      responseText: index === 0 ? "" : item.expectedAnswers?.[0] || "teacher response"
    }]))
  });
  assert.equal(pa.scoreStatus, "partial");
  assert.equal(pa.questionRecords[0].isCorrect, null);
  assert.equal(pa.questionRecords[0].selectedAnswer, "");
  assert.equal(pa.questionRecords[0].responseCaptureMode, "legacy_unspecified");
  assert.ok(pa.questionRecords[0].validationIssues.includes("response_transcription_required"));

  const encodingPlan = plan(EL_BENCHMARK_IDS.ENCODING, "1", "MOY");
  const encoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(encodingPlan.items.map((item, index) => [item.id, {
      status: "correct",
      transcription: index === 0 ? "" : item.targetWord,
      exact: true,
      plausible: true
    }]))
  });
  assert.equal(encoding.scoreStatus, "partial");
  assert.equal(encoding.questionRecords[0].exact, null);
  assert.equal(encoding.questionRecords[0].transcription, "");
  assert.equal(encoding.questionRecords[0].responseCaptureMode, "legacy_unspecified");
  assert.ok(encoding.questionRecords[0].validationIssues.includes("response_transcription_required"));

  const decodingPlan = plan(EL_BENCHMARK_IDS.DECODING, "1", "MOY");
  const decoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(decodingPlan.items.map((item, index) => [item.id, {
      status: "correct",
      responseText: index === 0 ? "" : item.targetWord,
      isCorrect: true,
      automatic: true
    }]))
  });
  assert.equal(decoding.scoreStatus, "partial");
  assert.equal(decoding.questionRecords[0].isCorrect, null);
  assert.equal(decoding.questionRecords[0].automatic, null);
  assert.equal(decoding.questionRecords[0].selectedAnswer, "");
  assert.equal(decoding.questionRecords[0].responseCaptureMode, "legacy_unspecified");
  assert.ok(decoding.questionRecords[0].validationIssues.includes("response_transcription_required"));
});

test("blank response detail is scorable only with a coherent quick teacher judgment", () => {
  const paPlan = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "BOY");
  const first = paPlan.items[0];
  const quickOutcomeAt = "2026-07-22T01:02:03.000Z";
  const validQuickResponse = {
    status: "correct",
    isCorrect: true,
    responseCaptureMode: "quick_teacher_judgment",
    outcomeRecordedAt: quickOutcomeAt
  };

  for (const [label, invalidFirstResponse] of [
    ["legacy capture", { status: "correct", isCorrect: true }],
    ["blank direct choice", { status: "correct", isCorrect: true, responseCaptureMode: "direct_choice" }],
    ["blank exact transcription", { status: "correct", isCorrect: true, responseCaptureMode: "exact_transcription" }],
    ["quick mode without a boolean judgment", { status: "correct", responseCaptureMode: "quick_teacher_judgment" }]
  ]) {
    const score = scoreElBenchmarkSession({
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      grade: "K",
      window: "BOY",
      administrationStatus: "completed",
      responses: Object.fromEntries(paPlan.items.map(item => [
        item.id,
        item.id === first.id ? invalidFirstResponse : validQuickResponse
      ]))
    });
    assert.equal(score.scoreStatus, "partial", label);
    assert.equal(score.questionRecords[0].isCorrect, null, label);
    assert.equal(score.questionRecords[0].selectedAnswer, "", label);
    assert.ok(score.questionRecords[0].validationIssues.includes("response_transcription_required"), label);
  }

  const valid = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(paPlan.items.map(item => [item.id, validQuickResponse]))
  });
  assert.equal(valid.scoreStatus, "scored");
  assert.equal(valid.scoredCount, paPlan.items.length);
  assert.ok(valid.questionRecords.every(record => record.validationIssues.length === 0));
  assert.ok(valid.questionRecords.every(record => record.responseCaptureMode === "quick_teacher_judgment"));
  assert.ok(valid.questionRecords.every(record => record.responseDetailCaptured === false));
  assert.ok(valid.questionRecords.every(record => record.selectedAnswer === ""));
  assert.ok(valid.questionRecords.every(record => record.outcomeRecordedAt === quickOutcomeAt));
});

test("rhyme recognition scores the child's direct Yes or No choice without teacher transcription", () => {
  const paPlan = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "BOY");
  const recognitionItems = paPlan.items.filter(item => item.strand === "rhyme" && item.task === "recognition");
  assert.deepEqual(recognitionItems.map(item => item.expectedAnswers[0]), ["yes", "no"]);

  const quickFallback = {
    status: "correct",
    isCorrect: true,
    responseCaptureMode: "quick_teacher_judgment"
  };
  const responses = Object.fromEntries(paPlan.items.map(item => [item.id, quickFallback]));
  for (const item of recognitionItems) {
    responses[item.id] = {
      status: "recorded",
      responseText: item.expectedAnswers[0],
      responseCaptureMode: "direct_choice",
      outcomeRecordedAt: "2026-07-22T02:00:00.000Z"
    };
  }

  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses
  });
  const scoredRecognition = score.questionRecords.filter(record => recognitionItems.some(item => item.id === record.questionId));
  assert.equal(score.scoreStatus, "scored");
  assert.ok(scoredRecognition.every(record => record.isCorrect === true));
  assert.deepEqual(scoredRecognition.map(record => record.selectedAnswer), ["yes", "no"]);
  assert.ok(scoredRecognition.every(record => record.responseCaptureMode === "direct_choice"));
  assert.ok(scoredRecognition.every(record => record.responseDetailCaptured === true));
  assert.ok(scoredRecognition.every(record => record.evaluationSource === "authored_answer_key"));
});

test("quick Encoding and Decoding outcomes score without fabricating an exact response", () => {
  const outcomeRecordedAt = "2026-07-22T03:04:05.000Z";
  const encodingPlan = plan(EL_BENCHMARK_IDS.ENCODING, "1", "MOY");
  const encoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(encodingPlan.items.map((item, index) => [item.id, {
      status: index === 0 ? "correct" : "incorrect",
      isCorrect: index === 0,
      exact: index === 0,
      plausible: index < 2,
      evaluation: index === 0 ? "exact" : index === 1 ? "plausible" : "implausible",
      responseCaptureMode: "quick_teacher_judgment",
      outcomeRecordedAt
    }]))
  });
  assert.equal(encoding.scoreStatus, "scored");
  assert.equal(encoding.metrics.exactCount, 1);
  assert.equal(encoding.metrics.plausibleCount, 2);
  assert.ok(encoding.questionRecords.every(record => record.transcription === ""));
  assert.ok(encoding.questionRecords.every(record => record.selectedAnswer === ""));
  assert.ok(encoding.questionRecords.every(record => record.responseDetailCaptured === false));
  assert.ok(encoding.questionRecords.every(record => record.evaluationSource === "quick_teacher_judgment"));

  const decodingPlan = plan(EL_BENCHMARK_IDS.DECODING, "1", "MOY");
  const decoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(decodingPlan.items.map((item, index) => [item.id, {
      status: index < 7 ? "correct" : "incorrect",
      isCorrect: index < 7,
      automatic: index < 6,
      selfCorrected: false,
      responseCaptureMode: "quick_teacher_judgment",
      outcomeRecordedAt
    }]))
  });
  assert.equal(decoding.scoreStatus, "scored");
  assert.equal(decoding.correctCount, 7);
  assert.equal(decoding.metrics.automaticCount, 6);
  assert.ok(decoding.questionRecords.every(record => record.selectedAnswer === ""));
  assert.ok(decoding.questionRecords.every(record => record.responseDetailCaptured === false));
  assert.ok(decoding.questionRecords.every(record => record.outcomeRecordedAt === outcomeRecordedAt));
  assert.ok(decoding.questionRecords.every(record => record.validationIssues.length === 0));
});

test("pure Decoding scoring rejects accuracy judgments that contradict the exact transcription", () => {
  const decodingPlan = plan(EL_BENCHMARK_IDS.DECODING, "1", "MOY");
  const mismatchedAccurate = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(decodingPlan.items.map(item => [item.id, {
      status: "correct",
      responseText: `${item.targetWord}-different`,
      isCorrect: true,
      automatic: true,
      selfCorrected: false
    }]))
  });
  assert.equal(mismatchedAccurate.scoreStatus, "partial");
  assert.equal(mismatchedAccurate.scoredCount, 0);
  assert.ok(mismatchedAccurate.validationIssues.every(issue => (
    issue.endsWith(":decoding_accurate_response_mismatch")
  )));

  const matchingIncorrect = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(decodingPlan.items.map(item => [item.id, {
      status: "incorrect",
      responseText: item.targetWord,
      isCorrect: false,
      automatic: false,
      selfCorrected: false
    }]))
  });
  assert.equal(matchingIncorrect.scoreStatus, "partial");
  assert.equal(matchingIncorrect.scoredCount, 0);
  assert.ok(matchingIncorrect.validationIssues.every(issue => (
    issue.endsWith(":decoding_incorrect_response_matches_target")
  )));
});

test("pure scorers reject contradictory restored response status fields in PA, Encoding, and Decoding", () => {
  const paPlan = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "BOY");
  const pa = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(paPlan.items.map(item => [item.id, {
      status: "incorrect",
      isCorrect: true,
      responseText: "wrong"
    }]))
  });
  assert.equal(pa.scoreStatus, "partial");
  assert.equal(pa.scoredCount, 0);
  assert.ok(pa.validationIssues.every(issue => issue.endsWith(":response_status_conflicts_with_correctness")));

  const encodingPlan = plan(EL_BENCHMARK_IDS.ENCODING, "1", "BOY");
  const encoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(encodingPlan.items.map(item => [item.id, {
      status: "incorrect",
      isCorrect: true,
      transcription: item.targetWord
    }]))
  });
  assert.equal(encoding.scoreStatus, "partial");
  assert.equal(encoding.scoredCount, 0);
  assert.ok(encoding.validationIssues.some(issue => issue.endsWith(":response_status_conflicts_with_correctness")));

  const decodingPlan = plan(EL_BENCHMARK_IDS.DECODING, "1", "BOY");
  const decoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(decodingPlan.items.map(item => [item.id, {
      status: "incorrect",
      isCorrect: true,
      responseText: "wrong",
      automatic: false,
      selfCorrected: true
    }]))
  });
  assert.equal(decoding.scoreStatus, "partial");
  assert.equal(decoding.scoredCount, 0);
  assert.ok(decoding.validationIssues.some(issue => issue.endsWith(":response_status_conflicts_with_correctness")));
  assert.ok(decoding.validationIssues.some(issue => issue.endsWith(":decoding_incorrect_state_conflict")));
});

test("explicit No response remains valid scored evidence without transcription", () => {
  const encodingPlan = plan(EL_BENCHMARK_IDS.ENCODING, "1", "BOY");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(encodingPlan.items.map(item => [item.id, {
      status: "no_response"
    }]))
  });
  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.correctCount, 0);
  assert.ok(score.questionRecords.every(record => record.validationIssues.length === 0));
});

test("pure scoring and persistence reject unaudited not-scorable evidence", () => {
  const pa = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "BOY");
  const first = pa.items[0];
  const second = pa.items[1];
  const session = {
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "not_scorable",
    startedAt: "2026-07-21T08:00:00.000Z",
    completedAt: "2026-07-21T08:03:00.000Z",
    responses: {
      [first.id]: { status: "not_scorable" },
      [second.id]: { status: "not_scorable", notScorableReason: "other" }
    }
  };
  const score = scoreElBenchmarkSession(session);

  assert.equal(score.scoreStatus, "partial");
  assert.ok(score.questionRecords[0].validationIssues.includes("not_scorable_reason_required"));
  assert.ok(score.questionRecords[1].validationIssues.includes("not_scorable_note_required"));
  assert.ok(score.validationIssues.some(issue => issue.endsWith(":not_scorable_reason_required")));
  assert.ok(score.validationIssues.some(issue => issue.endsWith(":not_scorable_note_required")));

  const attempt = buildElBenchmarkAttempt(session, {
    studentId: "student-audit",
    studentName: "Audit Student",
    classId: "class-audit",
    teacherId: "teacher-audit"
  });
  assert.equal(attempt.scoreStatus, "partial");
  assert.deepEqual(attempt.validationIssues, score.validationIssues);
  assert.ok(attempt.questionRecords[0].validationIssues.includes("not_scorable_reason_required"));
});

test("ORF retains generic not-scorable reason validation and cannot route on unaudited bypasses", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.items[0];
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: { status: "not_scorable" }
    },
    fluencyPassageDecisions: {
      [passage.id]: { action: "continue", reason: "passage_not_scorable" }
    }
  });

  assert.equal(score.scoreStatus, "partial");
  assert.ok(score.questionRecords[0].validationIssues.includes("not_scorable_reason_required"));
  assert.ok(score.validationIssues.some(issue => issue.endsWith(":not_scorable_reason_required")));
});

test("an unlisted but valid open rhyme is never auto-marked wrong without teacher judgement", () => {
  const pa = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "MOY");
  const openRhyme = pa.items.find(item => item.task === "production");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "MOY",
    administrationStatus: "partial",
    responses: {
      [openRhyme.id]: { status: "recorded", responseText: "smog" }
    }
  });
  const record = score.questionRecords.find(row => row.questionId === openRhyme.id);
  assert.equal(record.isCorrect, null);
  assert.equal(record.responseStatus, "recorded");
});

test("encoding keeps exact and plausible profiles separate and leaves placement to teacher confirmation", () => {
  const encoding = plan(EL_BENCHMARK_IDS.ENCODING, "K", "MOY");
  const responses = Object.fromEntries(encoding.items.map(item => [item.id, {
    status: "incorrect",
    transcription: "zz",
    isCorrect: false,
    plausible: false
  }]));
  responses[encoding.items[0].id] = { status: "correct", transcription: encoding.items[0].targetWord, isCorrect: true };
  const fox = encoding.items.find(item => item.targetWord === "fox");
  responses[fox.id] = {
    status: "incorrect",
    transcription: "foks",
    isCorrect: false,
    plausible: true,
    evaluation: "plausible",
    teacherOverride: { field: "plausible", from: false, to: true, reason: "All phonemes represented" }
  };
  const frozenSnapshot = structuredClone(responses);
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "MOY",
    administrationStatus: "completed",
    responses
  });
  assert.deepEqual(responses, frozenSnapshot, "pure scorer does not mutate responses");
  assert.equal(score.metrics.exactCount, 1);
  assert.equal(score.metrics.plausibleCount, 2);
  assert.equal(score.metrics.plausibleOnlyCount, 1);
  assert.equal(score.questionRecords.find(row => row.questionId === fox.id).plausibilitySource, "teacher_override");
  assert.equal(score.candidatePlacement.candidateMicrophase, null);
  assert.equal(score.candidatePlacement.requiresTeacherConfirmation, true);
  assert.equal(score.candidatePlacement.expectedMicrophase, "early_partial");
});

test("encoding exactness follows the transcription unless an audited exact override is supplied", () => {
  const encoding = plan(EL_BENCHMARK_IDS.ENCODING, "1", "BOY");
  const baseline = Object.fromEntries(encoding.items.map(item => [item.id, {
    status: "correct",
    transcription: item.targetWord,
    exact: true,
    isCorrect: true
  }]));
  const first = encoding.items[0];

  const falsePositive = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      ...baseline,
      [first.id]: { status: "correct", transcription: "not-the-word", exact: true, isCorrect: true }
    }
  });
  assert.equal(falsePositive.scoreStatus, "partial");
  assert.equal(falsePositive.questionRecords[0].computedExact, false);
  assert.equal(falsePositive.questionRecords[0].exact, false);
  assert.ok(falsePositive.questionRecords[0].validationIssues.includes(
    "encoding_exact_judgment_conflicts_with_transcription"
  ));

  const falseNegative = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      ...baseline,
      [first.id]: { status: "incorrect", transcription: first.targetWord, exact: false, isCorrect: false }
    }
  });
  assert.equal(falseNegative.scoreStatus, "partial");
  assert.equal(falseNegative.questionRecords[0].computedExact, true);
  assert.equal(falseNegative.questionRecords[0].exact, true);

  const auditedOverride = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      ...baseline,
      [first.id]: {
        status: "correct",
        transcription: "documented-variant",
        exact: true,
        isCorrect: true,
        teacherOverride: {
          field: "exact_spelling",
          from: false,
          to: true,
          reason: "The accepted-form bank requires an educator-approved local variant update."
        }
      }
    }
  });
  assert.equal(auditedOverride.scoreStatus, "scored");
  assert.equal(auditedOverride.questionRecords[0].exact, true);
  assert.equal(auditedOverride.questionRecords[0].exactOverrideApplied, true);
  assert.deepEqual(auditedOverride.questionRecords[0].validationIssues, []);
});

test("PA and Encoding expose raw evidence without unsourced 90/70 labels", () => {
  const paPlan = plan(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, "K", "BOY");
  const pa = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(paPlan.items.map((item, index) => [item.id, {
      status: index < 6 ? "correct" : "incorrect",
      isCorrect: index < 6,
      responseText: index < 6 ? item.expectedAnswers?.[0] || "teacher response" : "teacher response"
    }]))
  });
  const encodingPlan = plan(EL_BENCHMARK_IDS.ENCODING, "1", "BOY");
  const encoding = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: Object.fromEntries(encodingPlan.items.map((item, index) => [item.id, {
      status: index < 5 ? "correct" : "incorrect",
      transcription: index < 5 ? item.targetWord : "x",
      isCorrect: index < 5,
      plausible: index < 5
    }]))
  });
  for (const score of [pa, encoding]) {
    const serialized = JSON.stringify(score);
    assert.doesNotMatch(serialized, /secure_evidence|developing_evidence|priority_support_evidence/i);
    assert.doesNotMatch(serialized, /"evidenceLevel"/);
    assert.match(score.candidatePlacement.label, /descriptive/i);
  }
  assert.ok(pa.subtestScores.strands.every(row => Number.isFinite(row.correctCount)));
  assert.ok(encoding.subtestScores.exact);
});

test("teacher-confirmed Early Partial placement recommends Letter Identification", () => {
  const encodingPlan = plan(EL_BENCHMARK_IDS.ENCODING, "K", "EOY");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "EOY",
    administrationStatus: "completed",
    confirmedPlacement: {
      microphase: "early_partial",
      label: "Early Partial",
      confirmedAt: "2026-07-21T11:30:00.000Z"
    },
    placementSource: "teacher_confirmation",
    responses: Object.fromEntries(encodingPlan.items.map(item => [item.id, {
      status: "correct",
      transcription: item.targetWord,
      isCorrect: true
    }]))
  });
  assert.ok(score.recommendations.some(recommendation => /administer the Letter Identification assessment/i.test(recommendation)));

  const decodingPlan = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const firstBand = decodingPlan.items.filter(item => item.bandId === "early_partial");
  const decodingScore = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    confirmedPlacement: "early_partial",
    placementSource: "teacher_confirmation",
    responses: decodingResponses(firstBand, 5)
  });
  assert.ok(decodingScore.recommendations.some(recommendation => /administer the Letter Identification assessment/i.test(recommendation)));
});

test("Encoding letter-knowledge discontinuation routes directly to Assessment 1", () => {
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "discontinued",
    discontinueReason: "letter_knowledge_needed",
    responses: {}
  });

  assert.equal(score.scoreStatus, "discontinued");
  assert.ok(score.recommendations.some(recommendation => (
    /Assessment 1: Letter Name and Sound Recognition/i.test(recommendation) &&
    /before resuming Encoding or Decoding/i.test(recommendation)
  )));
});

test("global not-scorable status preserves observations but suppresses performance totals", () => {
  const encoding = plan(EL_BENCHMARK_IDS.ENCODING, "1", "BOY");
  const first = encoding.items[0];
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "not_scorable",
    responses: {
      [first.id]: { status: "correct", transcription: first.targetWord, isCorrect: true, notes: "Practice response before interruption" }
    }
  });
  assert.equal(score.scoreStatus, "not_scorable");
  assert.equal(score.totalQuestions, 0);
  assert.equal(score.correctCount, 0);
  assert.equal(score.accuracy, null);
  assert.equal(score.metrics.scoringSuppressed, true);
  assert.equal(score.questionRecords[0].selectedAnswer, first.targetWord, "raw observation is retained");
  assert.equal(score.candidatePlacement.status, "not_available");
});

test("decoding records a complete ≤5-of-8 stop and explicit later not-administered items", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const firstBand = decoded.items.filter(item => item.bandId === "early_partial");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    responses: decodingResponses(firstBand, 5)
  });
  assert.equal(score.stopBand, "early_partial");
  assert.equal(score.stopCycle, 15);
  assert.equal(score.stopCycleAnchor, 15);
  assert.equal(score.stopCycleAnchorLabel, "Cycle 15 anchor");
  assert.equal(score.stopCycleInterpretation, "comparison_anchor_not_assessed_exact_cycle");
  assert.equal(score.reason, "automatic_count_lte_5_of_8");
  assert.equal(score.scoreStatus, "scored", "a valid stop completes the required administration");
  assert.equal(score.totalQuestions, 8);
  assert.equal(score.metrics.bandProfile[0].stopEvidence.criterionMet, true);
  assert.equal(score.metrics.bandProfile[0].stopEvidence.effectiveStop, true);
  assert.equal(score.candidatePlacement.candidateMicrophase, "early_partial");
  assert.equal(score.fluencyStartMicrophase, null);
  const later = score.questionRecords.filter(row => row.bandId !== "early_partial");
  assert.equal(later.length, 16);
  assert.ok(later.every(row => row.responseStatus === "not_administered"));
  assert.ok(later.every(row => row.notAdministeredReason === "stopped_after_early_partial"));
});

test("an accurate decoding word with no automaticity judgment keeps the whole band partial", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const band = decoded.items.filter(item => item.bandId === "early_partial");
  const responses = decodingResponses(band, 5);
  delete responses[band.at(-1).id].automatic;
  const snapshot = structuredClone(responses);
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    responses
  });
  assert.deepEqual(responses, snapshot, "scoring remains pure");
  assert.equal(score.stopBand, "");
  assert.equal(score.reason, "");
  assert.equal(score.scoreStatus, "partial");
  assert.equal(score.questionRecords.find(row => row.questionId === band.at(-1).id).automatic, null);
  assert.equal(score.metrics.bandProfile[0].automaticityJudgedCount, 7);
  assert.equal(score.metrics.bandProfile[0].automaticityMissingCount, 1);
  assert.equal(score.metrics.bandProfile[0].stopEvidence.evidenceStatus, "partial");
  assert.equal(score.metrics.bandProfile[0].stopEvidence.criterionMet, null);
  assert.equal(score.completion.requiredAutomaticityCount, 7);
});

test("incorrect and self-corrected decoding responses are explicitly non-automatic", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "1", "BOY");
  const band = decoded.items.slice(0, 8);
  const responses = decodingResponses(band, 6);
  responses[band[0].id] = { status: "incorrect", isCorrect: false, responseText: `${band[0].targetWord}-different` };
  responses[band[1].id] = { status: "self_corrected", isCorrect: true, selfCorrected: true, responseText: band[1].targetWord };
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses
  });
  assert.equal(score.questionRecords.find(row => row.questionId === band[0].id).automatic, false);
  assert.equal(score.questionRecords.find(row => row.questionId === band[1].id).automatic, false);
});

test("decoding exposes the last >5 automatic band as fluency start, separate from instructional candidate", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const first = decoded.items.filter(item => item.bandId === "early_partial");
  const second = decoded.items.filter(item => item.bandId === "middle_partial");
  const responses = {
    ...decodingResponses(first, 6),
    ...decodingResponses(second, 5)
  };
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    responses
  });
  assert.equal(score.stopBand, "middle_partial");
  assert.equal(score.candidatePlacement.candidateMicrophase, "middle_partial");
  assert.deepEqual(score.fluencyStartMicrophase, {
    microphase: "early_partial",
    cycle: 15,
    label: "Early Partial",
    evidence: {
      automaticCount: 6,
      denominator: 8,
      accurateCount: 8,
      rule: "last_completed_band_with_more_than_5_automatic"
    }
  });
});

test("responses retained after a decoding stop never influence the Fluency handoff", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const first = decoded.items.filter(item => item.bandId === "early_partial");
  const later = decoded.items.filter(item => item.bandId === "middle_partial");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    responses: {
      ...decodingResponses(first, 5),
      ...decodingResponses(later, 8)
    }
  });

  assert.equal(score.stopBand, "early_partial");
  assert.equal(score.candidatePlacement.candidateMicrophase, "early_partial");
  assert.equal(score.fluencyStartMicrophase, null);
  assert.match(score.observations.join(" "), /recorded after the stop band and retained/i);
});

test("perfect evidence at Late Consolidated reports a truthful documented ceiling", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "2", "EOY", {
    startMicrophase: "late_consolidated"
  });
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "2",
    window: "EOY",
    startMicrophase: "late_consolidated",
    administrationStatus: "completed",
    responses: decodingResponses(decoded.items, 8)
  });

  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.candidatePlacement.candidateMicrophase, "late_consolidated");
  assert.equal(score.candidatePlacement.candidateAtCeiling, true);
  assert.match(score.candidatePlacement.reason, /highest named microphase|documented ceiling/i);
  assert.doesNotMatch(score.candidatePlacement.reason, /next named band/i);
});

test("a reasoned teacher stop override is retained and does not silently stop the band", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const first = decoded.items.filter(item => item.bandId === "early_partial");
  const second = decoded.items.filter(item => item.bandId === "middle_partial");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    responses: {
      ...decodingResponses(first, 5),
      ...decodingResponses(second, 5)
    },
    stopRuleOverrides: {
      early_partial: {
        continueAdministration: true,
        reason: "Student settled after an interrupted first list",
        teacherId: "teacher-1",
        recordedAt: "2026-07-21T10:00:00.000Z"
      }
    }
  });
  const firstEvidence = score.metrics.bandProfile.find(row => row.bandId === "early_partial").stopEvidence;
  assert.equal(firstEvidence.criterionMet, true);
  assert.equal(firstEvidence.effectiveStop, false);
  assert.equal(firstEvidence.teacherOverride.reason, "Student settled after an interrupted first list");
  assert.equal(score.stopBand, "middle_partial");
  assert.ok(score.observations.some(note => /overridden to continue.*Student settled/i.test(note)));
});

test("runner-shaped decodingBandDecisions can override stop evidence with an auditable reason", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "K", "EOY", { startMicrophase: "early_partial" });
  const first = decoded.items.filter(item => item.bandId === "early_partial");
  const second = decoded.items.filter(item => item.bandId === "middle_partial");
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "K",
    window: "EOY",
    startMicrophase: "early_partial",
    administrationStatus: "completed",
    responses: { ...decodingResponses(first, 5), ...decodingResponses(second, 4) },
    decodingBandDecisions: {
      early_partial: {
        action: "continue",
        reason: "teacher_override_below_threshold",
        overrideReason: "Fire alarm interrupted the first band",
        decidedAt: "2026-07-21T11:00:00.000Z"
      }
    }
  });
  const firstStop = score.metrics.bandProfile[0].stopEvidence;
  assert.equal(firstStop.effectiveStop, false);
  assert.equal(firstStop.teacherOverride.source, "decodingBandDecisions");
  assert.equal(firstStop.teacherOverride.reason, "Fire alarm interrupted the first band");
  assert.equal(firstStop.teacherOverride.decisionReason, "teacher_override_below_threshold");
  assert.equal(score.stopBand, "middle_partial");
});

test("an incomplete decoding band never becomes a completed stop decision", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "1", "BOY");
  const firstSeven = decoded.items.slice(0, 7);
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "BOY",
    administrationStatus: "partial",
    responses: decodingResponses(firstSeven, 5)
  });
  assert.equal(score.stopBand, "");
  assert.equal(score.scoreStatus, "partial");
  assert.equal(score.metrics.bandProfile[0].stopEvidence.evidenceStatus, "partial");
  assert.equal(score.metrics.bandProfile[0].stopEvidence.criterionMet, null);
});

test("explicit decoding discontinuation preserves runner reason and later item states", () => {
  const decoded = plan(EL_BENCHMARK_IDS.DECODING, "1", "EOY", { startMicrophase: "early_full" });
  const responses = decodingResponses(decoded.items.slice(0, 3), 1, 2);
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "EOY",
    startMicrophase: "early_full",
    administrationStatus: "discontinued",
    discontinueReason: "Student became unwell",
    responses
  });
  assert.equal(score.administrationStatus, "discontinued");
  assert.equal(score.scoreStatus, "discontinued");
  assert.equal(score.discontinueReason, "Student became unwell");
  assert.ok(score.questionRecords.slice(3).every(row => row.notAdministeredReason === "Student became unwell"));
});

test("fluency computes attempted/errors/WCPM/accuracy/prosody without claiming normed placement", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.passage;
  const wordsAttempted = Math.min(40, passage.wordCount);
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted,
        errors: 5,
        selfCorrections: 2,
        elapsedSeconds: 60,
        timerStatus: "complete",
        accurate: false,
        passageAccurate: false,
        prosody: { expression: 2, phrasing: 3, smoothness: 2, pace: 3 }
      }
    },
    fluencyStop: { confirmed: true, passageId: passage.id }
  });
  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.metrics.wordsAttempted, wordsAttempted);
  assert.equal(score.metrics.errors, 5);
  assert.equal(score.metrics.wcpm, wordsAttempted - 5);
  assert.equal(score.metrics.accuracy, Math.round(((wordsAttempted - 5) / wordsAttempted) * 100));
  assert.equal(score.metrics.prosody.average, 2.5);
  assert.equal(score.stopBand, passage.microphase);
  assert.equal(score.reason, "teacher_judged_not_accurate_after_60_seconds");
  assert.match(score.candidatePlacement.label, /descriptive fluency evidence only/i);
  assert.match(score.candidatePlacement.reason, /no grade-level or nationally normed/i);
});

test("fluency partial and not-scorable sessions never invent missing rate data", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "2", "MOY");
  const passage = fluency.passage;
  const partial = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "MOY",
    administrationStatus: "completed",
    responses: { [passage.id]: { status: "recorded", wordsAttempted: 30, errors: 3 } }
  });
  assert.equal(partial.scoreStatus, "partial");
  assert.equal(partial.metrics.accuracy, 90);
  assert.equal(partial.metrics.wcpm, null);

  const notScorable = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "MOY",
    administrationStatus: "not_scorable",
    responses: {
      [passage.id]: {
        status: "not_scorable",
        notScorableReason: "interrupted_or_noisy",
        wordsAttempted: 30,
        errors: 3,
        elapsedSeconds: 60
      }
    }
  });
  assert.equal(notScorable.scoreStatus, "not_scorable");
  assert.equal(notScorable.metrics.wordsAttempted, null);
  assert.equal(notScorable.metrics.wcpm, null);
});

test("a full-minute ORF with no words reached records zero WCPM without inventing accuracy", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.passage;
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 0,
        errors: 0,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "complete",
        zeroWordsReached: true
      }
    },
    fluencyStop: { confirmed: true, passageId: passage.id }
  });

  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.metrics.wordsAttempted, 0);
  assert.equal(score.metrics.correctWords, 0);
  assert.equal(score.metrics.wcpm, 0);
  assert.equal(score.metrics.accuracy, null);
  assert.equal(score.questionRecords[0].evidenceStatus, "complete");
  assert.equal(score.questionRecords[0].teacherAccuracyJudgment, null);
  assert.equal(score.questionRecords[0].judgmentSource, "explicit_zero_words_reached");

  const unauditedZero = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 0,
        errors: 0,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "complete",
        passageAccurate: false
      }
    }
  });
  assert.equal(unauditedZero.scoreStatus, "partial");
  assert.ok(
    unauditedZero.questionRecords[0].validationIssues.includes(
      "zero_words_reached_confirmation_required"
    )
  );
  assert.equal(unauditedZero.metrics.correctWords, null);
  assert.equal(unauditedZero.metrics.wcpm, null);
  assert.equal(unauditedZero.questionRecords[0].wcpm, null);
});

test("WCPM is scored only at exactly 60 seconds, never at 30, 59, or 90", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.passage;
  for (const elapsedSeconds of [30, 59, 90]) {
    const score = scoreElBenchmarkSession({
      assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
      grade: "1",
      window: "BOY",
      administrationStatus: "completed",
      responses: {
        [passage.id]: {
          status: "recorded",
          wordsAttempted: 40,
          errors: 4,
          selfCorrections: 0,
          elapsedSeconds,
          accurate: false
        }
      }
    });
    assert.equal(score.metrics.wcpm, null, `${elapsedSeconds}s WCPM`);
    assert.equal(score.questionRecords[0].wcpm, null, `${elapsedSeconds}s passage WCPM`);
    assert.equal(score.scoreStatus, "partial", `${elapsedSeconds}s status`);
    assert.equal(score.stopBand, "", `${elapsedSeconds}s cannot trigger one-minute stop`);
    assert.ok(score.questionRecords[0].validationIssues.includes("elapsed_seconds_must_equal_60"));
  }

  const exact = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 40,
        errors: 4,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "complete",
        accurate: false
      }
    }
  });
  assert.equal(exact.metrics.wcpm, 36);
  assert.equal(exact.scoreStatus, "scored");
  assert.equal(exact.stopBand, passage.microphase);
});

test("an exact elapsed value cannot score without a completed continuous timer session", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.passage;
  for (const timerStatus of ["", "running", "interrupted"]) {
    const score = scoreElBenchmarkSession({
      assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
      grade: "1",
      window: "BOY",
      administrationStatus: "completed",
      responses: {
        [passage.id]: {
          status: "recorded",
          wordsAttempted: 40,
          errors: 4,
          selfCorrections: 0,
          elapsedSeconds: 60,
          timerStatus,
          accurate: false
        }
      }
    });
    assert.equal(score.metrics.wcpm, null, `${timerStatus || "missing"} timer status WCPM`);
    assert.equal(score.scoreStatus, "partial", `${timerStatus || "missing"} timer status score`);
    assert.equal(score.stopBand, "", `${timerStatus || "missing"} timer status route`);
    assert.ok(score.questionRecords[0].validationIssues.includes("timer_completion_state_invalid"));
  }
});

test("impossible ORF self-correction counts remain partial and unscored", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.items[0];
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 10,
        errors: 1,
        selfCorrections: 11,
        elapsedSeconds: 60,
        timerStatus: "complete",
        passageAccurate: true
      }
    }
  });

  assert.equal(score.scoreStatus, "partial");
  assert.equal(score.questionRecords[0].wcpm, 9);
  assert.equal(score.questionRecords[0].correctWords, 9);
  assert.ok(score.questionRecords[0].validationIssues.includes("self_corrections_invalid"));
  assert.equal(score.metrics.aggregateSelfCorrections, null);
  assert.equal(score.metrics.selfCorrectionsMissingOrInvalidCount, 1);
});

test("interrupted ORF timing withholds WCPM even when the saved counts say 60 seconds", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.items[0];
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 20,
        errors: 2,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "interrupted",
        passageAccurate: true,
        timerInterrupted: true,
        interruptionReason: "timer_session_restored_while_running"
      }
    }
  });

  assert.equal(score.scoreStatus, "partial");
  assert.equal(score.metrics.wcpm, null);
  assert.equal(score.questionRecords[0].correctWords, null);
  assert.equal(score.questionRecords[0].timerInterrupted, true);
  assert.ok(score.validationIssues.some(issue => issue.includes("continuous_timing_interrupted")));
});

test("a discontinued Other reason requires a note in the pure scoring contract", () => {
  const missingReason = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "discontinued",
    responses: {}
  });
  assert.equal(missingReason.scoreStatus, "partial");
  assert.ok(missingReason.validationIssues.includes("discontinue_reason_required"));

  const missingNote = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "discontinued",
    discontinueReason: "other",
    discontinueNote: "",
    responses: {}
  });
  assert.equal(missingNote.scoreStatus, "partial");
  assert.ok(missingNote.validationIssues.includes("discontinue_note_required"));

  const documented = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    grade: "K",
    window: "BOY",
    administrationStatus: "discontinued",
    discontinueReason: "other",
    discontinueNote: "Student requested a break and did not return.",
    responses: {}
  });
  assert.equal(documented.validationIssues.includes("discontinue_note_required"), false);
  assert.equal(documented.scoreStatus, "discontinued");
});

test("ORF rejects impossible combined uncorrected-error and self-correction counts", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "BOY");
  const passage = fluency.items[0];
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: 10,
        errors: 8,
        selfCorrections: 8,
        elapsedSeconds: 60,
        timerStatus: "complete",
        passageAccurate: true
      }
    }
  });

  assert.equal(score.scoreStatus, "partial");
  assert.equal(score.questionRecords[0].wcpm, 2);
  assert.ok(
    score.questionRecords[0].validationIssues.includes(
      "errors_plus_self_corrections_exceed_words_attempted"
    )
  );
  assert.equal(score.metrics.aggregateSelfCorrections, null);
  assert.equal(score.metrics.selfCorrectionsMissingOrInvalidCount, 1);
});

test("valid finish-early evidence requires the full passage and never extrapolates WCPM", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "K", "BOY");
  const passage = fluency.passage;
  const valid = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: passage.wordCount,
        errors: 1,
        selfCorrections: 0,
        elapsedSeconds: 42,
        finishedEarly: true,
        timerStatus: "finished_early",
        accurate: true
      }
    }
  });
  assert.equal(valid.questionRecords[0].validFinishedEarly, true);
  assert.deepEqual(valid.questionRecords[0].informationalNotes, ["finished_early_wcpm_not_reported"]);
  assert.equal(valid.questionRecords[0].validationIssues.length, 0);
  assert.equal(valid.metrics.wcpm, null);
  assert.equal(valid.scoreStatus, "partial");
  assert.ok(valid.recommendations.some(note => /no WCPM or extrapolated rate/i.test(note)));

  const invalid = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "K",
    window: "BOY",
    administrationStatus: "completed",
    responses: {
      [passage.id]: {
        status: "recorded",
        wordsAttempted: passage.wordCount - 1,
        errors: 1,
        selfCorrections: 0,
        elapsedSeconds: 42,
        finishedEarly: true,
        timerStatus: "finished_early",
        accurate: true
      }
    }
  });
  assert.equal(invalid.questionRecords[0].validFinishedEarly, false);
  assert.ok(invalid.questionRecords[0].validationIssues.includes("finished_early_requires_full_passage"));
  assert.equal(invalid.metrics.wcpm, null);
});

test("full-text finish-early judgments continue or stop the ORF route without creating WCPM", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "2", "MOY", {
    startMicrophase: "middle_consolidated"
  });
  const [first, second] = fluency.items;
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "MOY",
    startMicrophase: "middle_consolidated",
    administrationStatus: "completed",
    responses: {
      [first.id]: {
        status: "recorded",
        wordsAttempted: first.wordCount,
        errors: 1,
        selfCorrections: 0,
        elapsedSeconds: 48,
        finishedEarly: true,
        timerStatus: "finished_early",
        accurate: true,
        passageAccurate: true
      },
      [second.id]: {
        status: "recorded",
        wordsAttempted: second.wordCount,
        errors: 7,
        selfCorrections: 1,
        elapsedSeconds: 55,
        finishedEarly: true,
        timerStatus: "finished_early",
        accurate: false,
        passageAccurate: false
      }
    },
    fluencyPassageDecisions: {
      [first.id]: { action: "continue", accurate: true, judgmentSource: "teacher" }
    },
    fluencyStop: { confirmed: true, passageId: second.id, accurate: false }
  });
  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.stopBand, "late_consolidated");
  assert.equal(score.reason, "teacher_judged_not_accurate_after_finished_passage");
  assert.deepEqual(score.fluencySequence.accurateMicrophases, ["middle_consolidated"]);
  assert.equal(score.fluencySequence.stop.timingContext, "finished_full_passage_early");
  assert.equal(score.fluencySequence.stop.elapsedSeconds, 55);
  assert.equal(score.fluencySequence.stop.wcpm, null);
  assert.ok(score.questionRecords.every(record => record.evidenceStatus === "finish_early_observation"));
  assert.ok(score.questionRecords.every(record => record.wcpm === null));
  assert.equal(score.metrics.wcpm, null);
  assert.equal(score.completion.completedByStopRule, true);
});

test("runner-shaped ORF responses follow the handoff sequence and stop at first explicit not-accurate passage", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "EOY", {
    startMicrophase: "early_full"
  });
  const [first, second, ...later] = fluency.items;
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "EOY",
    startMicrophase: "early_full",
    administrationStatus: "completed",
    routeSource: "decoding_fluency_handoff",
    sourceAttemptId: "decoding-attempt-7",
    responses: {
      [first.id]: {
        status: "recorded",
        wordsAttempted: 60,
        errors: 2,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "complete",
        accurate: true,
        passageAccurate: true,
        accuracyJudgmentSource: "teacher"
      },
      [second.id]: {
        status: "recorded",
        wordsAttempted: 55,
        errors: 6,
        selfCorrections: 1,
        elapsedSeconds: 60,
        timerStatus: "complete",
        accurate: false,
        passageAccurate: false,
        accuracyJudgmentSource: "teacher"
      },
      [later[0].id]: {
        status: "not_administered",
        accurate: null,
        passageAccurate: null,
        routeSkipReason: "fluency_stop_teacher_judgment",
        stopPassageId: second.id
      }
    },
    fluencyPassageDecisions: {
      [first.id]: { action: "continue", passageId: first.id, accurate: true, judgmentSource: "teacher" }
    },
    fluencyStop: {
      confirmed: true,
      passageId: second.id,
      microphase: second.microphase,
      accurate: false,
      criterion: "explicit_false",
      judgmentSource: "teacher"
    }
  });
  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.startMicrophase, "early_full");
  assert.equal(score.routeSource, "decoding_fluency_handoff");
  assert.equal(score.sourceAttemptId, "decoding-attempt-7");
  assert.equal(score.fluencyStartMicrophase.source, "decoding_fluency_handoff");
  assert.equal(score.fluencyStartMicrophase.sourceAttemptId, "decoding-attempt-7");
  assert.equal(score.fluencySequence.routeSource, "decoding_fluency_handoff");
  assert.equal(score.fluencySequence.sourceAttemptId, "decoding-attempt-7");
  assert.equal(score.stopBand, "middle_full");
  assert.equal(score.reason, "teacher_judged_not_accurate_after_60_seconds");
  assert.equal(score.metrics.wcpm, 49);
  assert.deepEqual(score.fluencySequence.accurateMicrophases, ["early_full"]);
  assert.equal(score.fluencySequence.stop.microphase, "middle_full");
  assert.equal(score.fluencySequence.stop.confirmedInRunner, true);
  assert.equal(score.fluencySequence.stop.runnerEvidence.criterion, "explicit_false");
  assert.equal(score.questionRecords[0].routeDecision.action, "continue");
  assert.equal(score.fluencySequence.accuracyPercentageCutoff, null);
  assert.deepEqual(score.fluencySequence.notAdministeredAfterStop, later.map(item => item.microphase));
  assert.ok(score.questionRecords.slice(2).every(record => record.responseStatus === "not_administered"));
  assert.ok(score.questionRecords.slice(2).every(record => record.validationIssues.length === 1));
  assert.ok(score.questionRecords.slice(2).every(record => record.validationIssues[0] === "not_administered_after_fluency_stop"));
});

test("an audited not-scorable ORF passage can be bypassed before a later valid stop", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "1", "EOY", {
    startMicrophase: "early_full"
  });
  const [notScorable, accurate, stopping] = fluency.items;
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "EOY",
    startMicrophase: "early_full",
    administrationStatus: "completed",
    responses: {
      [notScorable.id]: {
        status: "not_scorable",
        notScorableReason: "interrupted_or_noisy"
      },
      [accurate.id]: {
        status: "recorded",
        wordsAttempted: 60,
        errors: 2,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "complete",
        passageAccurate: true
      },
      [stopping.id]: {
        status: "recorded",
        wordsAttempted: 55,
        errors: 6,
        selfCorrections: 1,
        elapsedSeconds: 60,
        timerStatus: "complete",
        passageAccurate: false
      }
    },
    fluencyPassageDecisions: {
      [notScorable.id]: {
        action: "continue",
        passageId: notScorable.id,
        reason: "passage_not_scorable",
        judgmentSource: "teacher"
      },
      [accurate.id]: {
        action: "continue",
        passageId: accurate.id,
        reason: "teacher_judgment_accurate",
        judgmentSource: "teacher"
      }
    },
    fluencyStop: { confirmed: true, passageId: stopping.id, accurate: false }
  });

  assert.equal(score.scoreStatus, "scored");
  assert.equal(score.stopBand, stopping.microphase);
  assert.deepEqual(score.fluencySequence.reviewedNotScorableMicrophases, [notScorable.microphase]);
  assert.deepEqual(score.questionRecords[0].validationIssues, []);
  assert.equal(score.questionRecords[0].evidenceStatus, "not_scorable");
  assert.match(score.observations.join(" "), /not-scorable passage was explicitly reviewed/i);
});

test("future ORF passages carry no bogus missing-input validation errors before a stop", () => {
  const fluency = plan(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, "2", "MOY");
  const first = fluency.passage;
  const score = scoreElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "MOY",
    administrationStatus: "partial",
    responses: {
      [first.id]: {
        status: "recorded",
        wordsAttempted: 50,
        errors: 2,
        selfCorrections: 0,
        elapsedSeconds: 60,
        timerStatus: "complete",
        accurate: true
      }
    }
  });
  assert.ok(score.questionRecords.slice(1).every(record => record.evidenceStatus === "not_administered"));
  assert.ok(score.questionRecords.slice(1).every(record => record.validationIssues.length === 0));
  assert.ok(score.metrics.validationIssues.every(issue => issue.startsWith(first.id)));
});

test("persistence builder projects rich evidence and adds no generic mastery verdict", () => {
  const encoding = plan(EL_BENCHMARK_IDS.ENCODING, "K", "BOY");
  const responses = Object.fromEntries(encoding.items.map(item => [item.id, {
    status: "correct",
    transcription: item.targetWord,
    isCorrect: true
  }]));
  const session = {
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "BOY",
    administrationStatus: EL_ADMINISTRATION_STATUSES.COMPLETED,
    startedAt: "2026-07-21T09:00:00.000Z",
    completedAt: "2026-07-21T09:15:00.000Z",
    note: "Quiet one-to-one administration",
    discontinueNote: "Retained even when this completed fixture has no discontinue reason",
    confirmedPlacement: {
      microphase: "early_partial",
      candidateMicrophase: "early_partial",
      label: "Early Partial",
      confirmedAt: "2026-07-21T09:14:00.000Z"
    },
    placementSource: "teacher_confirmation",
    routeSource: "grade_window_expected_anchor",
    sourceAttemptId: "letter-sound-attempt-3",
    prerequisiteReview: {
      state: "override",
      code: "external_encoding_evidence",
      evidenceAttemptId: "letter-sound-attempt-3",
      teacherConfirmed: true,
      overrideReason: "Recent classroom spelling evidence supports this route.",
      reviewedAt: "2026-07-21T09:13:00.000Z"
    },
    responses
  };
  const ownership = { studentId: "student-1", studentName: "Ari", classId: "class-1", teacherId: "teacher-1" };
  const first = buildElBenchmarkAttempt(session, ownership);
  const second = buildElBenchmarkAttempt(session, ownership);
  assert.deepEqual(first, second, "attempt builder is deterministic");
  assert.equal(first.administrationStatus, "completed");
  assert.equal(first.plannedQuestionCount, 8);
  assert.equal(first.scoredCount, 8);
  assert.equal(first.framework.label, "Literacy Guide provisional");
  assert.equal(first.formVersion, EL_BENCHMARK_FORM_ID);
  assert.equal(first.contentVersion, EL_BENCHMARK_CONTENT_VERSION);
  assert.equal(first.benchmarkWindow, "BOY");
  assert.equal(first.note, "Quiet one-to-one administration");
  assert.equal(first.metadata.contentVersion, first.contentVersion);
  assert.equal(first.schemaVersion, 3);
  assert.equal(first.benchmark.schemaVersion, 1);
  assert.equal(first.metadata.attemptSchemaVersion, 3);
  assert.equal(first.metadata.benchmarkSchemaVersion, 1);
  assert.deepEqual(first.confirmedPlacement, session.confirmedPlacement);
  assert.deepEqual(first.metadata.confirmedPlacement, session.confirmedPlacement);
  assert.equal(first.placementSource, "teacher_confirmation");
  assert.equal(first.routeSource, "grade_window_expected_anchor");
  assert.equal(first.sourceAttemptId, "letter-sound-attempt-3");
  assert.equal(first.metadata.routeSource, first.routeSource);
  assert.equal(first.metadata.sourceAttemptId, first.sourceAttemptId);
  assert.deepEqual(first.prerequisiteReview, session.prerequisiteReview);
  assert.deepEqual(first.metadata.prerequisiteReview, session.prerequisiteReview);
  assert.equal(first.discontinueNote, session.discontinueNote);
  assert.equal(first.metadata.discontinueNote, session.discontinueNote);
  assert.ok(first.subtestScores.exact);
  assert.ok(first.metrics.featureProfile);
  assert.equal(Object.hasOwn(first, "passed"), false);
  assert.equal(Object.hasOwn(first, "mastered"), false);
});
