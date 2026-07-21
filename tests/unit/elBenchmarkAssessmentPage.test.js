import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import {
  EL_BENCHMARK_IDS,
  getElBenchmarkPlan
} from "../../src/data/elBenchmarkAssessments.js";

let AssessmentPage;
let getDecodingEvaluationPatch;
let getFluencyTimerInterruptionPatch;
let getFluencyTimerResetPatch;
let isDiscontinueEvidenceComplete;
let vite;
const assessmentPageSource = readFileSync(
  new URL("../../src/components/assessment/ELBenchmarkAssessmentPage.jsx", import.meta.url),
  "utf8"
);

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  const module = await vite.ssrLoadModule("/src/components/assessment/ELBenchmarkAssessmentPage.jsx");
  AssessmentPage = module.ELBenchmarkAssessmentPage;
  getDecodingEvaluationPatch = AssessmentPage.getDecodingEvaluationPatch;
  getFluencyTimerInterruptionPatch = AssessmentPage.getFluencyTimerInterruptionPatch;
  getFluencyTimerResetPatch = AssessmentPage.getFluencyTimerResetPatch;
  isDiscontinueEvidenceComplete = AssessmentPage.isDiscontinueEvidenceComplete;
});

test.after(async () => {
  await vite?.close();
});

function renderAssessment(session, props = {}) {
  return renderToStaticMarkup(React.createElement(AssessmentPage, {
    onCancel() {},
    onComplete() {},
    onSaveAndExit() {},
    onSessionChange() {},
    session,
    ...props
  }));
}

function makeSession(assessmentId, overrides = {}) {
  return {
    assessmentId,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    studentId: "student-1",
    studentName: "Test Student",
    window: "EOY",
    responses: {},
    ...overrides
  };
}

function buttonOpeningTag(html, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<button([^>]*)>\\s*${escapedLabel}\\s*</button>`));
  assert.ok(match, `Expected a button labelled "${label}"`);
  return match[1];
}

function completedFirstDecodingBand(plan) {
  return Object.fromEntries(plan.items.slice(0, 8).map((item, index) => [item.id, {
    assessmentId: plan.assessmentId,
    automatic: index < 5,
    evaluation: index < 5 ? "automatic_accurate" : "accurate_after_sounding",
    isCorrect: true,
    itemId: item.id,
    responseText: item.targetWord,
    status: "correct"
  }]));
}

function completedEncodingResponses(plan) {
  return Object.fromEntries(plan.items.map(item => [item.id, {
    assessmentId: plan.assessmentId,
    evaluation: "exact",
    isCorrect: true,
    itemId: item.id,
    plausible: false,
    responseText: item.targetWord,
    status: "correct",
    transcription: item.targetWord
  }]));
}

function completedFluencyResponse(item, { accurate = true, elapsedSeconds = 60 } = {}) {
  return {
    accurate,
    passageAccurate: accurate,
    elapsedSeconds,
    errors: 0,
    itemId: item.id,
    lastWord: "the",
    lastWordIndex: 0,
    selfCorrections: 0,
    status: elapsedSeconds >= 60 ? "recorded" : "not_administered",
    timerStatus: elapsedSeconds >= 60 ? "complete" : "stopped_early",
    wordsAttempted: 1
  };
}

function completedZeroWordsFluencyResponse(item, overrides = {}) {
  return {
    accurate: null,
    passageAccurate: null,
    elapsedSeconds: 60,
    errors: 0,
    itemId: item.id,
    lastWord: "",
    lastWordIndex: -1,
    selfCorrections: 0,
    status: "recorded",
    timerStatus: "complete",
    wordsAttempted: 0,
    zeroWordsReached: true,
    ...overrides
  };
}

function teacherConfirmedPlacement(microphase = "middle_partial", overrides = {}) {
  return {
    anchorCycle: 25,
    candidateMicrophase: microphase,
    confirmedAt: "2026-07-21T12:00:00.000Z",
    framework: "LiteracyPath provisional",
    isProvisional: true,
    label: "Middle Partial",
    microphase,
    ...overrides
  };
}

test("a failed device draft save stays visible and blocks the unsafe plain return", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }), { draftSaveFailed: true });

  assert.match(html, /role="alert">Draft could not be saved on this device\. Keep this page open and free storage before leaving\./);
  assert.doesNotMatch(html, /Changes save to this draft automatically/);
  assert.match(buttonOpeningTag(html, "Return to assessments"), /disabled/);
  assert.doesNotMatch(buttonOpeningTag(html, "Save partial &amp; exit"), /disabled/);
});

test("decoding blocks every silent cross-band jump until the completed band is reviewed", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const responses = completedFirstDecodingBand(plan);
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 7,
    responses
  }));

  assert.match(html, /Stopping threshold reached/);
  assert.match(html, /Confirm stop after this band/);
  assert.match(html, /Continue with teacher override/);
  assert.match(buttonOpeningTag(html, "Next item"), /disabled/);
  assert.match(html, /aria-label="Item 9, unadministered, locked until the current decoding band is reviewed"[^>]*disabled/);
});

test("a recorded decoding override unlocks the next band and preserves its reason", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const firstBandId = plan.items[0].bandId;
  const responses = completedFirstDecodingBand(plan);
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 7,
    decodingBandDecisions: {
      [firstBandId]: {
        action: "continue",
        automaticCount: 5,
        bandId: firstBandId,
        denominator: 8,
        overrideReason: "A fire alarm interrupted this band.",
        reason: "teacher_override_below_threshold"
      }
    },
    responses
  }));

  assert.match(html, /Continue decision saved/);
  assert.match(html, /Teacher override: A fire alarm interrupted this band\./);
  assert.doesNotMatch(buttonOpeningTag(html, "Next item"), /disabled/);
  assert.doesNotMatch(html, /aria-label="Item 9, unadministered, locked/);
});

test("a self-correction remains accurate but is excluded from the automatic count", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const responses = completedFirstDecodingBand(plan);
  responses[plan.items[0].id] = {
    ...responses[plan.items[0].id],
    automatic: false,
    selfCorrected: true,
    status: "self_corrected"
  };
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 7,
    responses
  }));

  assert.match(html, /4 of 8 automatic/);
  assert.match(html, /Stopping threshold reached/);
});

test("PA records no response separately from an attempted incorrect response", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    currentItemIndex: 0,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [item.id]: { evaluation: "no_response", isCorrect: false, itemId: item.id, status: "no_response" }
    }
  }));

  assert.match(html, /<button aria-pressed="true"[^>]*><span>No response<\/span>/);
  assert.match(html, /<button aria-pressed="false"[^>]*><span>Not yet<\/span><small>An attempted response was incorrect<\/small>/);
  assert.doesNotMatch(html, /Incorrect or no response/);
});

test("Encoding records no response separately from Not yet", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: 0,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [item.id]: { evaluation: "no_response", isCorrect: false, itemId: item.id, status: "no_response" }
    }
  }));

  assert.match(html, /<button aria-pressed="true"[^>]*><span>No response<\/span><small>Student wrote nothing<\/small>/);
  assert.match(html, /<button aria-pressed="false"[^>]*><span>Not yet<\/span>/);
});

test("Decoding records no response separately from an attempted incorrect word", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0,
    responses: {
      [item.id]: {
        automatic: false,
        errorTags: ["no_response"],
        evaluation: "no_response",
        isCorrect: false,
        itemId: item.id,
        selfCorrected: false,
        status: "no_response"
      }
    }
  }));

  assert.match(html, /<button aria-pressed="true"[^>]*><span>No response<\/span><small>Student gave no spoken response<\/small>/);
  assert.match(html, /<button aria-pressed="false"[^>]*><span>Incorrect<\/span><small>An attempted word was incorrect<\/small>/);
  assert.doesNotMatch(html, /Incorrect word or no response/);
});

test("Decoding accuracy cannot contradict the exact recorded spoken word", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const item = plan.items[0];
  const mismatchedAccurate = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0,
    responses: {
      [item.id]: {
        automatic: true,
        evaluation: "automatic_accurate",
        isCorrect: true,
        itemId: item.id,
        responseText: `${item.targetWord}-different`,
        selfCorrected: false,
        status: "correct"
      }
    }
  }));
  assert.match(mismatchedAccurate, /This transcription does not match the displayed word/);
  assert.match(buttonOpeningTag(mismatchedAccurate, "Next item"), /disabled/);

  const matchingIncorrect = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0,
    responses: {
      [item.id]: {
        automatic: false,
        evaluation: "incorrect",
        isCorrect: false,
        itemId: item.id,
        responseText: item.targetWord,
        selfCorrected: false,
        status: "incorrect"
      }
    }
  }));
  assert.match(matchingIncorrect, /This transcription matches the displayed word/);
  assert.match(buttonOpeningTag(matchingIncorrect, "Next item"), /disabled/);
});

test("attempted PA, Encoding, and Decoding outcomes require an exact nonblank response", () => {
  const paPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const paItem = paPlan.items[0];
  const paHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    currentItemIndex: 0,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [paItem.id]: {
        evaluation: "correct",
        isCorrect: true,
        itemId: paItem.id,
        responseText: "   ",
        status: "correct"
      }
    }
  }));
  assert.match(paHtml, /Enter the exact oral response before this item can be recorded/);
  assert.match(buttonOpeningTag(paHtml, "Next item"), /disabled/);

  const encodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const encodingItem = encodingPlan.items[0];
  const encodingHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: 0,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [encodingItem.id]: {
        evaluation: "plausible",
        isCorrect: false,
        itemId: encodingItem.id,
        plausible: true,
        responseText: "legacy-value-must-not-mask-blank-transcription",
        status: "incorrect",
        transcription: "   "
      }
    }
  }));
  assert.match(encodingHtml, /Transcribe the student&#x27;s written response before this item can be recorded/);
  assert.match(buttonOpeningTag(encodingHtml, "Next item"), /disabled/);

  const decodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const decodingItem = decodingPlan.items[0];
  const decodingHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0,
    responses: {
      [decodingItem.id]: {
        automatic: true,
        evaluation: "automatic_accurate",
        isCorrect: true,
        itemId: decodingItem.id,
        responseText: " ",
        selfCorrected: false,
        status: "correct"
      }
    }
  }));
  assert.match(decodingHtml, /Enter the exact spoken response before this item can be recorded/);
  assert.match(buttonOpeningTag(decodingHtml, "Next item"), /disabled/);
});

test("a restored Encoding override that conflicts with the selected evaluation stays incomplete", () => {
  const encodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "1",
    window: "BOY"
  });
  const item = encodingPlan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [item.id]: {
        evaluation: "exact",
        isCorrect: true,
        itemId: item.id,
        responseText: "not-the-target",
        status: "correct",
        transcription: "not-the-target",
        teacherOverride: {
          field: "exact_spelling",
          from: true,
          to: false,
          reason: "Restored contradictory legacy evidence"
        }
      }
    }
  }));

  assert.match(html, /restored exact-spelling override conflicts with the selected evaluation/i);
  assert.match(buttonOpeningTag(html, "Next item"), /disabled/);
});

test("decoding evaluation transitions clear contradictory response state", () => {
  const fromNoResponse = {
    automatic: false,
    errorTags: ["no_response"],
    evaluation: "no_response",
    isCorrect: false,
    responseText: "map",
    selfCorrected: false,
    status: "no_response"
  };
  const automatic = { ...fromNoResponse, ...getDecodingEvaluationPatch("automatic_accurate", fromNoResponse) };
  assert.equal(automatic.status, "correct");
  assert.equal(automatic.isCorrect, true);
  assert.equal(automatic.automatic, true);
  assert.equal(automatic.selfCorrected, false);
  assert.deepEqual(automatic.errorTags, []);

  const contradictoryIncorrect = {
    automatic: true,
    errorTags: ["substitution"],
    evaluation: "incorrect",
    isCorrect: false,
    responseText: "mop",
    selfCorrected: true,
    status: "incorrect"
  };
  const incorrect = { ...contradictoryIncorrect, ...getDecodingEvaluationPatch("incorrect", contradictoryIncorrect) };
  assert.equal(incorrect.automatic, false);
  assert.equal(incorrect.selfCorrected, false);
  assert.equal(incorrect.status, "incorrect");

  const notScorable = {
    ...contradictoryIncorrect,
    ...getDecodingEvaluationPatch("not_scorable", contradictoryIncorrect, {
      reason: "interrupted_or_noisy",
      note: "Hallway announcement"
    })
  };
  assert.equal(notScorable.isCorrect, null);
  assert.equal(notScorable.automatic, null);
  assert.equal(notScorable.selfCorrected, false);
  assert.deepEqual(notScorable.errorTags, []);
  assert.equal(notScorable.notScorableReason, "interrupted_or_noisy");
  assert.equal(notScorable.notScorableNote, "Hallway announcement");
});

test("contradictory decoding self-correction state is disabled and remains unresolved", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0,
    responses: {
      [item.id]: {
        automatic: true,
        errorTags: ["substitution"],
        evaluation: "incorrect",
        isCorrect: false,
        itemId: item.id,
        responseText: "mop",
        selfCorrected: true,
        status: "incorrect"
      }
    }
  }));

  assert.match(html, /<input disabled="" type="checkbox"\/>/);
  assert.match(html, /This item is partially recorded/);
  assert.match(buttonOpeningTag(html, "Next item"), /disabled/);
});

test("every not-scorable outcome requires auditable reason evidence", () => {
  const cases = [
    {
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      planOptions: { grade: "K", window: "BOY" },
      sessionOptions: { grade: "K", startMicrophase: undefined, window: "BOY" }
    },
    {
      assessmentId: EL_BENCHMARK_IDS.ENCODING,
      planOptions: { grade: "K", window: "BOY" },
      sessionOptions: { grade: "K", startMicrophase: undefined, window: "BOY" }
    },
    {
      assessmentId: EL_BENCHMARK_IDS.DECODING,
      planOptions: { grade: "K", startMicrophase: "middle_partial", window: "EOY" },
      sessionOptions: { grade: "K", startMicrophase: "middle_partial", window: "EOY" }
    },
    {
      assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
      planOptions: { grade: "1", startMicrophase: "late_consolidated", window: "MOY" },
      sessionOptions: { grade: "1", startMicrophase: "late_consolidated", window: "MOY" }
    }
  ];

  cases.forEach(({ assessmentId, planOptions, sessionOptions }) => {
    const plan = getElBenchmarkPlan({ assessmentId, formId: "form-a-v2", ...planOptions });
    const item = plan.items[0];
    const invalidHtml = renderAssessment(makeSession(assessmentId, {
      currentItemIndex: 0,
      ...sessionOptions,
      responses: {
        [item.id]: {
          evaluation: "not_scorable",
          isCorrect: null,
          itemId: item.id,
          notScorableNote: "",
          notScorableReason: "other",
          status: "not_scorable"
        }
      }
    }));
    assert.match(invalidHtml, /aria-label="Not-scorable evidence"/);
    assert.match(buttonOpeningTag(invalidHtml, "Save not-scorable reason"), /disabled/);

    const validHtml = renderAssessment(makeSession(assessmentId, {
      currentItemIndex: 0,
      ...sessionOptions,
      responses: {
        [item.id]: {
          evaluation: "not_scorable",
          isCorrect: null,
          itemId: item.id,
          notScorableNote: "Brief interruption",
          notScorableReason: "interrupted_or_noisy",
          status: "not_scorable"
        }
      }
    }));
    assert.match(validHtml, /<strong>Not scorable:<\/strong> Interrupted or too noisy \| Brief interruption/);
    assert.doesNotMatch(validHtml, /aria-label="Not-scorable evidence"/);
  });
});

test("encoding keeps the answer and dictation sentence out of the initial render", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: 0,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }));

  assert.match(html, /Answer hidden/);
  assert.match(html, /Reveal answer/);
  assert.match(html, /Reveal teacher script/);
  assert.doesNotMatch(html, new RegExp(`>${item.targetWord}<`, "i"));
  assert.equal(html.includes(item.sentence), false);
  assert.equal(html.includes(item.teacherSay), false);
});

test("phonological awareness keeps the scoring reference hidden until requested", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
    formId: "form-a-v2",
    grade: "1",
    window: "BOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: undefined,
    window: "BOY"
  }));

  assert.match(html, /Answer hidden/);
  assert.match(html, /Reveal scoring reference/);
  item.expectedAnswers.forEach(answer => {
    assert.equal(html.includes(`>${answer}<`), false);
  });
});

test("completed Encoding requires a teacher-selected Decoding start because no conversion table exists", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const baseSession = makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: plan.items.length - 1,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY",
    responses: completedEncodingResponses(plan)
  });
  const unconfirmedHtml = renderAssessment(baseSession);

  assert.match(unconfirmedHtml, /Confirm the Decoding start band/);
  assert.match(unconfirmedHtml, /No automatic Encoding conversion/);
  assert.match(unconfirmedHtml, /no validated spelling-to-microphase conversion table/);
  assert.match(unconfirmedHtml, /Preview score status: Scored/);
  assert.match(unconfirmedHtml, /Teacher rationale for this Encoding-to-Decoding route/);
  assert.match(unconfirmedHtml, /Grade and window administration range/);
  assert.doesNotMatch(unconfirmedHtml, /Outside normal range/);
  assert.match(buttonOpeningTag(unconfirmedHtml, "Complete assessment"), /disabled/);

  const confirmedHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_pre", {
      anchorCycle: 1,
      label: "Middle Pre"
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(confirmedHtml, /Middle Pre/);
  assert.match(confirmedHtml, /saved route needs a teacher rationale/);
  assert.match(buttonOpeningTag(confirmedHtml, "Complete assessment"), /disabled/);

  const reasonedConfirmedHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_pre", {
      anchorCycle: 1,
      label: "Middle Pre",
      overrideReason: "The spelling record and classroom blending evidence support this starting band."
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(reasonedConfirmedHtml, /Teacher rationale: The spelling record and classroom blending evidence support this starting band\./);
  assert.doesNotMatch(buttonOpeningTag(reasonedConfirmedHtml, "Complete assessment"), /disabled/);

  const invalidOutOfRangeHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("early_partial", {
      anchorCycle: 15,
      label: "Early Partial"
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(buttonOpeningTag(invalidOutOfRangeHtml, "Complete assessment"), /disabled/);

  const reasonedOutOfRangeHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("early_partial", {
      anchorCycle: 15,
      label: "Early Partial",
      overrideReason: "Current classroom blending evidence supports the higher starting band."
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(reasonedOutOfRangeHtml, /previously saved band is outside this grade and window route/);
  assert.match(buttonOpeningTag(reasonedOutOfRangeHtml, "Complete assessment"), /disabled/);
});

test("decoding cannot hand off a zero-evidence placement without a teacher rationale", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const responses = Object.fromEntries(plan.items.map(item => [item.id, {
    assessmentId: plan.assessmentId,
    automatic: null,
    evaluation: "not_scorable",
    isCorrect: null,
    itemId: item.id,
    notScorableNote: "Administration conditions invalidated this item.",
    notScorableReason: "response_unreliable",
    selfCorrected: false,
    status: "not_scorable"
  }]));
  const baseSession = makeSession(EL_BENCHMARK_IDS.DECODING, {
    confirmedPlacement: teacherConfirmedPlacement("middle_partial"),
    currentItemIndex: plan.items.length - 1,
    placementSource: "teacher_confirmation",
    responses
  });
  const unreasonedHtml = renderAssessment(baseSession);

  assert.match(unreasonedHtml, /No candidate available/);
  assert.match(unreasonedHtml, /Preview score status: Partial · 0 scorable items/);
  assert.match(unreasonedHtml, /Reason for selecting a route without a scorer candidate/);
  assert.match(unreasonedHtml, /saved route needs a teacher rationale/);
  assert.match(buttonOpeningTag(unreasonedHtml, "Complete assessment"), /disabled/);

  const reasonedHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_partial", {
      overrideReason: "Use the classroom decoding record until this assessment can be readministered."
    })
  });
  assert.match(reasonedHtml, /Teacher rationale: Use the classroom decoding record until this assessment can be readministered\./);
  assert.doesNotMatch(buttonOpeningTag(reasonedHtml, "Complete assessment"), /disabled/);
});

test("decoding allows only the scorer's exact adjacent ceiling proposal beyond the normal range", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_partial",
    window: "BOY"
  });
  assert.equal(plan.items.length, 8);
  const responses = Object.fromEntries(plan.items.map(item => [item.id, {
    assessmentId: plan.assessmentId,
    automatic: true,
    evaluation: "automatic_accurate",
    isCorrect: true,
    itemId: item.id,
    responseText: item.targetWord,
    selfCorrected: false,
    status: "correct"
  }]));
  const baseSession = makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: plan.items.length - 1,
    grade: "1",
    startMicrophase: "late_partial",
    window: "BOY",
    responses
  });
  const proposedHtml = renderAssessment(baseSession);

  assert.match(proposedHtml, /Scorer proposal<\/span><strong>Early Full/);
  assert.match(proposedHtml, /Exact adjacent scorer ceiling proposal/);
  assert.match(proposedHtml, /No other out-of-range band can be confirmed/);

  const ceilingConfirmedHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("early_full", {
      anchorCycle: 49,
      label: "Early Full"
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(ceilingConfirmedHtml, /Teacher confirmation saved/);
  assert.match(ceilingConfirmedHtml, /Early Full/);
  assert.doesNotMatch(buttonOpeningTag(ceilingConfirmedHtml, "Complete assessment"), /disabled/);

  const disallowedBandHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_full", {
      anchorCycle: 50,
      label: "Middle Full",
      overrideReason: "A higher band was considered."
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(disallowedBandHtml, /previously saved band is outside this grade and window route/);
  assert.match(buttonOpeningTag(disallowedBandHtml, "Complete assessment"), /disabled/);
});

test("ORF completes after a reliable minute without requiring optional prosody", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: completedFluencyResponse(item)
    }
  }));

  assert.match(html, /Prosody ratings \(optional\)/);
  assert.match(html, /<span>Uncorrected errors<\/span>/);
  assert.match(html, /Do not count self-corrections here\./);
  assert.match(html, /Full minute recorded/);
  assert.match(html, /00:00/);
  assert.doesNotMatch(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("ORF completion stays locked unless the timer itself records a valid completion state", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  for (const timerStatus of ["", "running", "interrupted"]) {
    const response = completedFluencyResponse(item, { accurate: false });
    response.timerStatus = timerStatus;
    const stopEvidence = {
      accurate: false,
      confirmed: true,
      passageId: item.id,
      passageIndex: 0,
      reason: "teacher_judgment_not_accurate"
    };
    const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
      currentItemIndex: 0,
      fluencyStop: stopEvidence,
      fluencyStopEvidence: stopEvidence,
      grade: "1",
      startMicrophase: "late_consolidated",
      window: "MOY",
      responses: { [item.id]: response }
    }));

    assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/, timerStatus || "missing");
    assert.match(html, /Record exactly 60 seconds/, timerStatus || "missing");
  }
});

test("ORF exposes an explicit audited zero-word outcome and keeps accuracy N/A", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const response = completedZeroWordsFluencyResponse(item);
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: response }
  }));

  assert.match(html, /aria-pressed="true"[^>]*><strong>No words reached \(0\)<\/strong>/);
  assert.match(html, /No words reached recorded \(0 words attempted\)/);
  assert.match(html, /<strong>Accuracy: N\/A<\/strong>No words were read/);
  assert.match(html, /0 WCPM · Accuracy N\/A/);
  assert.match(html, /Confirm no-words route stop/);
  assert.doesNotMatch(html, /<legend>Teacher accuracy judgment<\/legend>/);
  assert.match(html, /<input inputMode="numeric" max="[^"]+" min="0" disabled=""[^>]*value="0"\/>/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);

  const stopEvidence = {
    accurate: null,
    confirmed: true,
    criterion: "zero_words_reached",
    judgmentSource: "audited_zero_words",
    passageAccurate: null,
    passageId: item.id,
    passageIndex: 0,
    reason: "zero_words_full_minute",
    threshold: null,
    zeroWordsReached: true
  };
  const completedHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    fluencyStop: stopEvidence,
    fluencyStopEvidence: stopEvidence,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: response }
  }));
  assert.match(completedHtml, /Fluency stop evidence saved/);
  assert.doesNotMatch(buttonOpeningTag(completedHtml, "Complete assessment"), /disabled/);
});

test("ORF zero-word completion requires explicit zero counts and N/A accuracy", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const invalidCountsHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: completedZeroWordsFluencyResponse(item, { errors: 1 })
    }
  }));
  assert.match(invalidCountsHtml, /For No words reached \(0\), errors and self-corrections must both be 0/);
  assert.match(buttonOpeningTag(invalidCountsHtml, "Complete assessment"), /disabled/);

  const invalidAccuracyHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: completedZeroWordsFluencyResponse(item, { accurate: false, passageAccurate: false })
    }
  }));
  assert.match(invalidAccuracyHtml, /Accuracy must remain N\/A when no words were reached/);
  assert.match(buttonOpeningTag(invalidAccuracyHtml, "Complete assessment"), /disabled/);

  const undeclaredZeroHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: completedZeroWordsFluencyResponse(item, { zeroWordsReached: false })
    }
  }));
  assert.match(undeclaredZeroHtml, /Choose a last word reached, or explicitly record No words reached \(0\)/);
  assert.match(buttonOpeningTag(undeclaredZeroHtml, "Complete assessment"), /disabled/);
});

test("ORF remains incomplete before 60 seconds even when all count fields are present", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: completedFluencyResponse(item, { elapsedSeconds: 59 })
    }
  }));

  assert.match(html, /Record exactly 60 seconds/);
  assert.match(html, /00:01/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("ORF requires an explicit teacher accuracy judgment at 60 seconds", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const response = completedFluencyResponse(item);
  delete response.accurate;
  delete response.passageAccurate;
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: response }
  }));

  assert.match(html, /Record the teacher accuracy judgment before reviewing the passage route/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("ORF requires explicit zero count entries instead of coercing blank counts to zero", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const response = completedFluencyResponse(item);
  response.errors = null;
  response.selfCorrections = null;
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: response }
  }));

  assert.match(html, /Errors and self-corrections must be whole numbers from zero through words attempted/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("ORF rejects a legacy 90-second value instead of treating it as a valid minute", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: completedFluencyResponse(item, { elapsedSeconds: 90 }) }
  }));

  assert.match(html, /Recorded time needs correction/);
  assert.match(html, /Record exactly 60 seconds/);
  assert.doesNotMatch(html, /Full minute recorded/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("the explicit early-finish action is reachable and locks navigation while timing is active", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: {
        elapsedSeconds: 10,
        itemId: item.id,
        status: "not_administered",
        timerStatus: "running"
      }
    }
  }));

  assert.match(html, /Finished passage before 60 seconds/);
  assert.match(html, /Stop due to interruption/);
  assert.doesNotMatch(html, /Resume timer/);
  assert.match(buttonOpeningTag(html, "Print clean passage"), /disabled/);
  assert.doesNotMatch(html, /<legend>Teacher accuracy judgment<\/legend>/);
  assert.match(buttonOpeningTag(html, "Save partial &amp; exit"), /disabled/);
  assert.match(buttonOpeningTag(html, "Return to assessments"), /disabled/);
});

test("an interrupted timer cannot be resumed and requires a clean reset", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: {
        elapsedSeconds: 10,
        itemId: item.id,
        status: "not_administered",
        timerInterrupted: true,
        timerStatus: "interrupted"
      }
    }
  }));

  assert.match(html, /Timer interrupted — reset before reading again/);
  assert.match(html, /Interrupted timing cannot produce WCPM/);
  assert.match(html, /Reset timer/);
  assert.doesNotMatch(html, /Resume timer/);
  assert.doesNotMatch(html, />Start timer</);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("resetting the fluency timer clears every abandoned-trial score and provenance field", () => {
  assert.deepEqual(getFluencyTimerResetPatch(), {
    accurate: null,
    accurateInOneMinute: null,
    accuracy: null,
    accuracyJudgedAt: "",
    accuracyJudgmentSource: "",
    correctWords: null,
    errors: null,
    finishedEarly: false,
    interruptionReason: "",
    isCorrect: null,
    lastWord: "",
    lastWordIndex: null,
    notScorableNote: "",
    notScorableReason: "",
    passageAccurate: null,
    prosody: {},
    prosodyRating: null,
    selfCorrections: null,
    status: "not_administered",
    teacherAccuracyJudgment: null,
    timerInterrupted: false,
    informationalNotes: [],
    validationIssues: [],
    wcpm: null,
    wordsAttempted: null,
    zeroWordsReached: false
  });
});

test("fluency interruptions clear judgment provenance and background clock jumps cannot score", () => {
  assert.deepEqual(getFluencyTimerInterruptionPatch("page_hidden_during_timing"), {
    accurate: null,
    accurateInOneMinute: null,
    accuracyJudgedAt: "",
    accuracyJudgmentSource: "",
    interruptionReason: "page_hidden_during_timing",
    passageAccurate: null,
    teacherAccuracyJudgment: null,
    timerInterrupted: true
  });
  assert.match(assessmentPageSource, /addEventListener\("visibilitychange"/);
  assert.match(assessmentPageSource, /addEventListener\("pagehide"/);
  assert.match(assessmentPageSource, /addEventListener\("beforeprint"/);
  assert.match(assessmentPageSource, /tickAt - lastTimerTickAtRef\.current > 1500/);
  assert.match(assessmentPageSource, /if \(!timingEvidenceReady \|\| zeroWordsReached\) return;/);
});

test("the discontinue form requires a note when Other is selected", () => {
  assert.equal(isDiscontinueEvidenceComplete("student_fatigue", ""), true);
  assert.equal(isDiscontinueEvidenceComplete("other", ""), false);
  assert.equal(isDiscontinueEvidenceComplete("other", "Documented context"), true);
});

test("a valid full-text finish at 59 seconds retains accuracy routing but withholds WCPM", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: {
        ...completedFluencyResponse(item, { elapsedSeconds: 59 }),
        finishedEarly: true,
        lastWord: item.text.trim().split(/\s+/).at(-1),
        lastWordIndex: item.wordCount - 1,
        passageWordCount: item.wordCount,
        status: "recorded",
        timerStatus: "finished_early",
        wordsAttempted: item.wordCount
      }
    }
  }));

  assert.match(html, /Completed passage before 60 seconds/);
  assert.match(html, /Full passage finished in 59 seconds/);
  assert.match(html, /WCPM is withheld and never extrapolated/);
  assert.match(html, /WCPM is unavailable for this early finish/);
  assert.doesNotMatch(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("ORF refuses impossible count combinations even with valid timing and judgment", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: {
        ...completedFluencyResponse(item),
        errors: 2,
        selfCorrections: 2,
        wordsAttempted: 1
      }
    }
  }));

  assert.match(html, /Errors and self-corrections must be whole numbers from zero through words attempted/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("ORF rejects individually valid counts whose combined total exceeds words attempted", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: {
        ...completedFluencyResponse(item),
        errors: 1,
        selfCorrections: 1,
        wordsAttempted: 1
      }
    }
  }));

  assert.match(html, /Errors plus self-corrections cannot exceed the number of words attempted/);
  assert.match(buttonOpeningTag(html, "Complete assessment"), /disabled/);
});

test("an accurate ORF passage cannot be bypassed until the teacher explicitly continues", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  });
  assert.ok(plan.items.length > 1, "multi-passage ORF route is required for this test");
  const first = plan.items[0];
  const baseSession = makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses: { [first.id]: completedFluencyResponse(first) }
  });
  const lockedHtml = renderAssessment(baseSession);

  assert.match(lockedHtml, /Accurate passage recorded/);
  assert.match(lockedHtml, /Explicitly continue to administer the next planned microphase passage/);
  assert.match(buttonOpeningTag(lockedHtml, "Next item"), /disabled/);
  assert.match(lockedHtml, /aria-label="Item 2, unadministered, locked until the current passage route is reviewed"[^>]*disabled/);

  const unlockedHtml = renderAssessment({
    ...baseSession,
    fluencyPassageDecisions: {
      [first.id]: {
        action: "continue",
        accurate: true,
        passageAccurate: true,
        passageId: first.id,
        reason: "teacher_judgment_accurate"
      }
    }
  });
  assert.match(unlockedHtml, /Continue decision saved/);
  assert.doesNotMatch(buttonOpeningTag(unlockedHtml, "Next item"), /disabled/);
  assert.doesNotMatch(unlockedHtml, /aria-label="Item 2, unadministered, locked/);
});

test("ORF renders the current passage item rather than leaking the legacy first passage", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  });
  const first = plan.items[0];
  const second = plan.items[1];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 1,
    fluencyPassageDecisions: {
      [first.id]: { action: "continue", passageId: first.id, reason: "teacher_judgment_accurate" }
    },
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses: { [first.id]: completedFluencyResponse(first) }
  }));

  assert.match(html, new RegExp(second.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(html.includes(first.title), false);
  assert.match(html, /aria-label="Mark Nash as the last word reached, word 1"/);
});

test("ORF exposes a clean printable student passage with no scoring controls in the sheet", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  }));
  const sheet = html.match(/<article class="el-benchmark-clean-passage-sheet">([\s\S]*?)<\/article>/)?.[1] || "";

  assert.match(html, /Open clean student passage/);
  assert.match(html, /Print clean passage/);
  assert.doesNotMatch(html, /<legend>Teacher accuracy judgment<\/legend>/);
  assert.match(html, /Accuracy choices unlock only after a continuous full minute/);
  assert.match(sheet, /LiteracyPath EL-aligned provisional form/);
  assert.match(sheet, /not an official EL Education benchmark/);
  assert.match(sheet, new RegExp(`<h1>${item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/h1><p>`));
  assert.match(sheet, /<\/p><footer class="el-benchmark-clean-passage-disclaimer">Teacher note — not part of the timed passage\./);
  assert.match(sheet, /<\/footer>$/);
  assert.doesNotMatch(sheet, /Errors|Self-corrections|Timer|button|input|select/);
});

test("the first not-accurate ORF passage requires stop confirmation and never scores later passages wrong", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  });
  const first = plan.items[0];
  const firstResponse = completedFluencyResponse(first, { accurate: false });
  const baseSession = makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses: { [first.id]: firstResponse }
  });
  const pendingHtml = renderAssessment(baseSession);
  assert.match(pendingHtml, /Teacher judgment indicates a route stop/);
  assert.match(pendingHtml, /Confirm teacher-judgment stop/);
  assert.doesNotMatch(pendingHtml, /Fluency stop evidence saved/);
  assert.doesNotMatch(assessmentPageSource, /stopPatch\.fluencyStop = evidence/);
  assert.match(buttonOpeningTag(pendingHtml, "Complete assessment"), /disabled/);

  const responses = { [first.id]: firstResponse };
  plan.items.slice(1).forEach(item => {
    responses[item.id] = {
      accurate: null,
      isCorrect: null,
      itemId: item.id,
      passageAccurate: null,
      routeSkipReason: "fluency_stop_teacher_judgment",
      status: "not_administered",
      stopPassageId: first.id
    };
  });
  const stopEvidence = {
    accurate: false,
    confirmed: true,
    criterion: "explicit_false",
    judgmentSource: "teacher",
    passageAccurate: false,
    passageId: first.id,
    passageIndex: 0,
    reason: "teacher_judgment_not_accurate",
    threshold: null
  };
  const stoppedHtml = renderAssessment({
    ...baseSession,
    fluencyStop: stopEvidence,
    fluencyStopEvidence: stopEvidence,
    responses
  });

  assert.match(stoppedHtml, /Fluency stop evidence saved/);
  assert.match(stoppedHtml, /Undo fluency stop/);
  assert.match(stoppedHtml, new RegExp(`<dt>Unadministered<\\/dt><dd>${plan.items.length - 1}<\\/dd>`));
  assert.match(stoppedHtml, /aria-label="Item 2, not administered, locked after the confirmed fluency stop/);
  assert.doesNotMatch(stoppedHtml, /Item 2, incorrect/);
  assert.doesNotMatch(buttonOpeningTag(stoppedHtml, "Complete assessment"), /disabled/);
});

test("decoding stop outcomes show later items explicitly as not administered, never wrong", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const firstBandId = plan.items[0].bandId;
  const responses = completedFirstDecodingBand(plan);
  plan.items.slice(8).forEach(item => {
    responses[item.id] = {
      automatic: null,
      isCorrect: null,
      itemId: item.id,
      routeSkipReason: "decoding_stop_rule",
      status: "not_administered",
      stopBandId: firstBandId
    };
  });

  const stopEvidence = {
    automaticCount: 5,
    bandId: firstBandId,
    confirmed: true,
    denominator: 8,
    reason: "automatic_count_at_or_below_threshold",
    threshold: 5
  };
  const unconfirmedHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 7,
    decodingStop: stopEvidence,
    responses,
    stopEvidence
  }));
  assert.match(unconfirmedHtml, /Confirm the Decoding start band/);
  assert.match(unconfirmedHtml, /Scorer proposal/);
  assert.match(unconfirmedHtml, /Middle Partial/);
  assert.match(buttonOpeningTag(unconfirmedHtml, "Complete assessment"), /disabled/);

  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    confirmedPlacement: teacherConfirmedPlacement(firstBandId),
    currentItemIndex: 7,
    decodingStop: stopEvidence,
    placementSource: "teacher_confirmation",
    responses,
    stopEvidence
  }));

  assert.match(html, /Stopping evidence saved/);
  assert.match(html, new RegExp(`<dt>Unadministered<\\/dt><dd>${plan.items.length - 8}<\\/dd>`));
  assert.match(html, /aria-label="Item 9, not administered/);
  assert.doesNotMatch(html, /Item 9, incorrect/);
  assert.doesNotMatch(buttonOpeningTag(html, "Complete assessment"), /disabled/);

  const invalidAlternativeHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    confirmedPlacement: teacherConfirmedPlacement("late_partial", {
      anchorCycle: 26,
      label: "Late Partial"
    }),
    currentItemIndex: 7,
    decodingStop: stopEvidence,
    placementSource: "teacher_confirmation",
    responses,
    stopEvidence
  }));
  assert.match(buttonOpeningTag(invalidAlternativeHtml, "Complete assessment"), /disabled/);

  const reasonedAlternativeHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    confirmedPlacement: teacherConfirmedPlacement("late_partial", {
      anchorCycle: 26,
      label: "Late Partial",
      overrideReason: "Classroom evidence shows secure Middle Partial reading."
    }),
    currentItemIndex: 7,
    decodingStop: stopEvidence,
    placementSource: "teacher_confirmation",
    responses,
    stopEvidence
  }));
  assert.match(reasonedAlternativeHtml, /Teacher rationale: Classroom evidence shows secure Middle Partial reading\./);
  assert.doesNotMatch(buttonOpeningTag(reasonedAlternativeHtml, "Complete assessment"), /disabled/);
});
