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
let getAssessmentFinishTally;
let getDecodingEvaluationPatch;
let getFluencyTimerInterruptionPatch;
let getFluencyTimerResetPatch;
let isDiscontinueEvidenceComplete;
let preserveTerminalSessionStatus;
let vite;
const assessmentPageSource = readFileSync(
  new URL("../../src/components/assessment/ELBenchmarkAssessmentPage.jsx", import.meta.url),
  "utf8"
);
const assessmentPageStyles = readFileSync(
  new URL("../../src/components/assessment/el-benchmark-assessment.css", import.meta.url),
  "utf8"
);
const appStyles = readFileSync(
  new URL("../../src/App.css", import.meta.url),
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
  getAssessmentFinishTally = AssessmentPage.getAssessmentFinishTally;
  getDecodingEvaluationPatch = AssessmentPage.getDecodingEvaluationPatch;
  getFluencyTimerInterruptionPatch = AssessmentPage.getFluencyTimerInterruptionPatch;
  getFluencyTimerResetPatch = AssessmentPage.getFluencyTimerResetPatch;
  isDiscontinueEvidenceComplete = AssessmentPage.isDiscontinueEvidenceComplete;
  preserveTerminalSessionStatus = AssessmentPage.preserveTerminalSessionStatus;
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

function countText(html, text) {
  return html.split(text).length - 1;
}

function completedFirstDecodingBand(plan, automaticCount = 5) {
  return Object.fromEntries(plan.items.slice(0, 8).map((item, index) => [item.id, {
    assessmentId: plan.assessmentId,
    automatic: index < automaticCount,
    evaluation: index < automaticCount ? "automatic_accurate" : "accurate_after_sounding",
    isCorrect: true,
    itemId: item.id,
    responseCaptureMode: "quick_teacher_judgment",
    status: "correct"
  }]));
}

function completedEncodingResponses(plan) {
  return Object.fromEntries(plan.items.map(item => [item.id, {
    assessmentId: plan.assessmentId,
    evaluation: "exact",
    exact: true,
    isCorrect: true,
    itemId: item.id,
    plausible: true,
    responseCaptureMode: "quick_teacher_judgment",
    status: "correct"
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

function teacherConfirmedPlacement(microphase, overrides = {}) {
  const label = microphase
    .split("_")
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
  return {
    anchorCycle: null,
    candidateMicrophase: microphase,
    confirmedAt: "2026-07-22T12:00:00.000Z",
    framework: "LiteracyPath provisional",
    isProvisional: true,
    label,
    microphase,
    ...overrides
  };
}

function progressLabel(html, resolved, planned) {
  return html.includes(`aria-label="${resolved} of ${planned} items resolved"`);
}

test("the simplified shell has one safe exit, one collapsed review drawer, and no Next button", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }));

  assert.equal(countText(html, "Save &amp; exit"), 1);
  assert.match(html, /<details class="el-benchmark-review-drawer"><summary>Review answers or instructions<\/summary>/);
  assert.equal(countText(html, "Next item"), 0);
  assert.match(buttonOpeningTag(html, "↶ Change previous answer"), /disabled/);
  assert.match(html, /Choose one answer above — it saves and moves on/);
  assert.doesNotMatch(html, /Return to assessments|Save partial &amp; exit/);
});

test("D-006 keeps progress, Save & exit, and Finish in the sticky action bar without clipping the EL page", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }));
  const header = html.match(/<header class="el-benchmark-topbar">([\s\S]*?)<\/header>/)?.[1] || "";
  const footer = html.match(/<footer class="el-benchmark-footer el-benchmark-footer-secondary">([\s\S]*?)<\/footer>/)?.[1] || "";

  assert.match(header, /Progress/);
  assert.match(header, /Save &amp; exit/);
  assert.match(header, /Finish check/);
  assert.doesNotMatch(footer, /Finish check/);
  assert.match(assessmentPageStyles, /\.el-benchmark-topbar\s*\{[\s\S]*?position: sticky;/);
  assert.match(
    assessmentPageStyles,
    /@media \(max-width: 820px\)[\s\S]*?\.el-benchmark-topbar\s*\{[\s\S]*?position: sticky;/
  );
  assert.match(
    assessmentPageStyles,
    /@media \(max-width: 820px\)[\s\S]*?\.el-benchmark-tablet-counters\s*\{[\s\S]*?position: static;/
  );
  assert.match(
    appStyles,
    /\.assessment-app\.el-benchmark-app\s*\{[\s\S]*?justify-content: flex-start;[\s\S]*?overflow: visible;/
  );
});

test("D-005 gives every benchmark item a large task heading and exact teacher directive", () => {
  const routes = [
    ["K", "BOY"],
    ["K", "MOY"],
    ["K", "EOY"],
    ["1", "BOY"],
    ["1", "MOY"],
    ["1", "EOY"],
    ["2", "BOY"],
    ["2", "MOY"],
    ["2", "EOY"]
  ];
  const paItemsByTask = new Map();
  routes.forEach(([grade, window]) => {
    const plan = getElBenchmarkPlan({
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      formId: "form-a-v2",
      grade,
      window
    });
    plan.items.forEach((item, index) => {
      const taskKey = `${item.strand}:${item.task}`;
      if (!paItemsByTask.has(taskKey)) paItemsByTask.set(taskKey, { grade, index, item, window });
    });
  });
  assert.ok(paItemsByTask.size >= 9, "Expected directive coverage across the PA strand/task catalog");

  const representativeSessions = [
    ...Array.from(paItemsByTask.values()).map(({ grade, index, window }) => makeSession(
      EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      { currentItemIndex: index, grade, startMicrophase: undefined, window }
    )),
    makeSession(EL_BENCHMARK_IDS.ENCODING, {
      grade: "K",
      startMicrophase: undefined,
      window: "BOY"
    }),
    makeSession(EL_BENCHMARK_IDS.DECODING, {
      grade: "1",
      startMicrophase: "early_partial",
      window: "BOY"
    }),
    makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
      grade: "2",
      startMicrophase: "middle_full",
      window: "BOY"
    })
  ];

  representativeSessions.forEach(session => {
    const html = renderAssessment(session);
    const instruction = html.match(/<section class="el-benchmark-item-instruction" aria-label="Teacher instruction">([\s\S]*?)<\/section>/)?.[1] || "";
    assert.match(instruction, /<strong>[^<]{3,}<\/strong>/);
    assert.match(instruction, /<p>[^<]{20,}<\/p>/);
  });

  const rhymeHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }));
  assert.match(rhymeHtml, /<strong>Rhyme — yes or no\?<\/strong>/);
  assert.match(rhymeHtml, /Say aloud: “Do moon and spoon rhyme\?” Say both words naturally — never show this screen to the child\./);

  const encodingHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }));
  const encodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  assert.match(encodingHtml, /<strong>Dictated spelling<\/strong>/);
  assert.ok(encodingHtml.includes(
    `Dictate aloud — word, sentence, word. The child writes only “${encodingPlan.items[0].targetWord}” on paper.`
  ));
  assert.match(assessmentPageStyles, /\.el-benchmark-item-instruction strong\s*\{[\s\S]*?font-size: clamp\(18px,/);
  assert.match(assessmentPageStyles, /\.el-benchmark-item-instruction p\s*\{[\s\S]*?font-size: clamp\(17px,/);
});

test("D-007 renders plain assessment-window and starting-band copy without raw route jargon", () => {
  const sessions = [
    makeSession(EL_BENCHMARK_IDS.ENCODING, {
      grade: "K",
      startMicrophase: undefined,
      window: "BOY"
    }),
    makeSession(EL_BENCHMARK_IDS.DECODING, {
      grade: "1",
      startMicrophase: "late_partial",
      window: "MOY"
    }),
    makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
      grade: "2",
      startMicrophase: "middle_consolidated",
      window: "EOY"
    })
  ];

  sessions.forEach(session => {
    const html = renderAssessment(session);
    assert.match(html, new RegExp(`${session.window === "BOY" ? "Beginning" : session.window === "MOY" ? "Middle" : "End"} of year · starting band:`));
    assert.doesNotMatch(html, />[^<]*(?:BOY:|MOY:|EOY:)[^<]*</);
    assert.doesNotMatch(html, /Kindergarten BOY|Grade [12] (?:BOY|MOY|EOY)/);
  });
  assert.doesNotMatch(assessmentPageSource, /\{plan\.route\?\.microphaseLabel/);
  assert.doesNotMatch(assessmentPageSource, /\{administrationRange\.label/);
});

test("a device-save failure stays prominent without reintroducing competing exit controls", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    grade: "K",
    startMicrophase: undefined,
    window: "BOY"
  }), { draftSaveFailed: true });

  assert.match(html, /role="alert">Draft could not be saved on this device\. Keep this page open and free storage before leaving\./);
  assert.doesNotMatch(html, /Saved automatically/);
  assert.equal(countText(html, "Save &amp; exit"), 1);
  assert.equal(countText(html, "Return to assessments"), 0);
});

test("completion is awaited, single-flight, visibly busy, and exposes an accessible retry", () => {
  assert.match(assessmentPageSource, /completionLockRef\.current = true/);
  assert.match(assessmentPageSource, /await onComplete\(nextSession\)/);
  assert.match(assessmentPageSource, /aria-busy=\{completionIsSaving \? "true" : undefined\}/);
  assert.match(assessmentPageSource, /\? "Finishing\.\.\."/);
  assert.match(assessmentPageSource, /<p role="alert"><strong>Could not finish\.<\/strong>/);
  assert.match(assessmentPageSource, /\? "Retry finish"/);
});

test("terminal assessment snapshots can be retried but never downgraded to a draft", () => {
  const completed = preserveTerminalSessionStatus({
    status: "completed",
    administrationStatus: "completed",
    completedAt: "2026-07-22T12:00:00.000Z"
  }, {
    status: "partial",
    administrationStatus: "partial",
    completedAt: "",
    updatedAt: "2026-07-22T12:05:00.000Z"
  });
  assert.equal(completed.status, "completed");
  assert.equal(completed.administrationStatus, "completed");
  assert.equal(completed.completedAt, "2026-07-22T12:00:00.000Z");

  const discontinued = preserveTerminalSessionStatus({
    status: "discontinued",
    discontinuedAt: "2026-07-22T12:00:00.000Z"
  }, {
    status: "in_progress",
    administrationStatus: "in_progress"
  });
  assert.equal(discontinued.status, "discontinued");
  assert.equal(discontinued.administrationStatus, "discontinued");
  assert.equal(discontinued.discontinuedAt, "2026-07-22T12:00:00.000Z");
});

test("rhyme recognition is a teacher-only two-word cue with large Yes, No, and Other controls", () => {
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
    window: "BOY"
  }));

  assert.match(html, /class="el-benchmark-rhyme-pair" aria-label="Teacher words: moon and spoon"/);
  assert.match(html, /<span>moon<\/span><small>and<\/small><span>spoon<\/span>/);
  assert.match(html, /Teacher screen — say both words aloud\. Do not show the print to the child\./);
  assert.match(html, /class="el-benchmark-quick-grid choices-3"/);
  assert.match(html, /class="el-benchmark-quick-button tone-positive"[^>]*>[\s\S]*?<span>Yes<\/span>/);
  assert.match(html, /class="el-benchmark-quick-button tone-negative"[^>]*>[\s\S]*?<span>No<\/span>/);
  assert.match(html, /class="el-benchmark-quick-button tone-neutral"[^>]*>[\s\S]*?<span>Other<\/span>/);
  assert.match(html, /<details class="el-benchmark-optional-detail"><summary>Other, no answer, or add what they said<\/summary>/);
  assert.match(html, /<button class="el-benchmark-button secondary" type="button">No response<\/button>/);
  assert.doesNotMatch(html, /aria-label="Teacher prompt"/);
  assert.equal(countText(html, item.teacherSay), 1, "the exact oral question must appear once in the teacher instruction");
});

test("open PA tasks keep normal scoring to three choices and place No response under Other", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS, {
    currentItemIndex: 0,
    grade: "K",
    startMicrophase: undefined,
    window: "MOY"
  }));

  assert.match(html, /Was the spoken answer correct\?/);
  assert.match(html, /<span>Correct<\/span>/);
  assert.match(html, /<span>Not yet<\/span>/);
  assert.match(html, /<span>Other<\/span>/);
  assert.match(html, /<details class="el-benchmark-optional-detail"><summary>Other, no answer, or add what they said<\/summary>/);
  assert.match(html, />No response<\/button>/);
  assert.doesNotMatch(html, /Incorrect or no response/);
});

test("Encoding always shows the paper-and-pencil setup and only three quick outcomes", () => {
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

  assert.match(html, /Give the child a pencil and lined paper\. Keep this screen facing you\./);
  assert.match(html, /<span>Say exactly<\/span>/);
  assert.ok(html.includes(item.teacherSay));
  assert.match(html, /How close was the spelling\?/);
  assert.match(html, /<span>Correct spelling<\/span>/);
  assert.match(html, /<span>Sounds right<\/span>/);
  assert.match(html, /<span>Not yet<\/span>/);
  assert.match(html, /<details class="el-benchmark-optional-detail"><summary>Other or add spelling detail<\/summary>/);
  assert.match(html, /Child&#x27;s spelling \(optional\)/);
  assert.match(html, />No response<\/button>/);
});

test("Decoding puts the word on screen with three immediate teacher judgments", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0
  }));

  assert.match(html, new RegExp(`class="el-benchmark-word-display" aria-label="Word to read: ${item.targetWord}">${item.targetWord}<`));
  assert.match(html, /How did the child read the word\?/);
  assert.match(html, /<span>Straight away<\/span>/);
  assert.match(html, /<span>Worked it out<\/span>/);
  assert.match(html, /<span>Not correct<\/span>/);
  assert.match(html, /<details class="el-benchmark-optional-detail"><summary>Other or add reading detail<\/summary>/);
  assert.match(html, />No response<\/button>/);
});

test("blank detail is complete only when it carries a coherent quick teacher judgment", () => {
  const cases = [
    {
      assessmentId: EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS,
      planOptions: { grade: "K", window: "BOY" },
      sessionOptions: { grade: "K", startMicrophase: undefined, window: "BOY" },
      response: { status: "correct", isCorrect: true, evaluation: "correct" }
    },
    {
      assessmentId: EL_BENCHMARK_IDS.ENCODING,
      planOptions: { grade: "K", window: "BOY" },
      sessionOptions: { grade: "K", startMicrophase: undefined, window: "BOY" },
      response: { status: "incorrect", isCorrect: false, exact: false, plausible: true, evaluation: "plausible" }
    },
    {
      assessmentId: EL_BENCHMARK_IDS.DECODING,
      planOptions: { grade: "K", startMicrophase: "middle_partial", window: "EOY" },
      sessionOptions: { grade: "K", startMicrophase: "middle_partial", window: "EOY" },
      response: { status: "correct", isCorrect: true, automatic: true, selfCorrected: false, evaluation: "automatic_accurate" }
    }
  ];

  for (const { assessmentId, planOptions, sessionOptions, response } of cases) {
    const plan = getElBenchmarkPlan({ assessmentId, formId: "form-a-v2", ...planOptions });
    const item = plan.items[0];
    const legacyHtml = renderAssessment(makeSession(assessmentId, {
      currentItemIndex: 0,
      ...sessionOptions,
      responses: { [item.id]: { ...response, responseText: "", transcription: "" } }
    }));
    assert.ok(progressLabel(legacyHtml, 0, plan.items.length), `${assessmentId} legacy blank remains incomplete`);
    assert.match(legacyHtml, /More detail is needed here/);

    const quickHtml = renderAssessment(makeSession(assessmentId, {
      currentItemIndex: 0,
      ...sessionOptions,
      responses: {
        [item.id]: {
          ...response,
          responseText: "",
          transcription: "",
          responseCaptureMode: "quick_teacher_judgment"
        }
      }
    }));
    assert.ok(progressLabel(quickHtml, 1, plan.items.length), `${assessmentId} coherent quick blank is complete`);
    assert.match(quickHtml, /Answer saved/);
  }
});

test("quick outcomes auto-advance only after the resulting item is complete", () => {
  assert.match(assessmentPageSource, /onQuickScore=\{patch => updateCurrentResponse\(patch, \{ advance: true \}\)\}/);
  assert.match(assessmentPageSource, /const nextIndex = options\.advance &&\s+isResponseComplete\(kind, nextResponse, currentItem\)/);
  assert.match(assessmentPageSource, /kind !== ASSESSMENT_KINDS\.FLUENCY/);
  assert.match(assessmentPageSource, /currentBand\?\.indexes\.includes\(currentIndex \+ 1\)/);
  assert.doesNotMatch(assessmentPageSource, />\s*Next item\s*</);
});

test("finish requires a deliberate tally review and counts every terminal outcome", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const responses = completedEncodingResponses(plan);
  responses[plan.items[6].id] = {
    itemId: plan.items[6].id,
    status: "not_administered"
  };
  responses[plan.items[7].id] = {
    itemId: plan.items[7].id,
    status: "not_scorable"
  };

  assert.deepEqual(
    getAssessmentFinishTally(plan.items, responses, "encoding"),
    { scored: 6, skipped: 1, notScorable: 1 }
  );
  assert.match(assessmentPageSource, /!showFinishConfirmation/);
  assert.match(assessmentPageSource, /Check the tally before finishing/);
  assert.match(assessmentPageSource, /Change final answer/);
  assert.match(assessmentPageSource, /Confirm and finish/);
});

test("typed Encoding and Decoding contradictions remain unresolved instead of auto-advancing", () => {
  const encodingPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "1",
    window: "BOY"
  });
  const encodingItem = encodingPlan.items[0];
  const encodingHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [encodingItem.id]: {
        evaluation: "exact",
        exact: true,
        isCorrect: true,
        plausible: true,
        responseCaptureMode: "exact_transcription",
        responseText: "not-the-target",
        status: "correct",
        transcription: "not-the-target"
      }
    }
  }));
  assert.match(encodingHtml, /The typed spelling does not match the correct spelling/);
  assert.ok(progressLabel(encodingHtml, 0, encodingPlan.items.length));
  assert.match(encodingHtml, /More detail is needed here/);

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
        responseCaptureMode: "exact_transcription",
        responseText: `${decodingItem.targetWord}-different`,
        selfCorrected: false,
        status: "correct"
      }
    }
  }));
  assert.match(decodingHtml, /The typed response does not match the displayed word/);
  assert.ok(progressLabel(decodingHtml, 0, decodingPlan.items.length));
  assert.match(decodingHtml, /More detail is needed here/);
});

test("a restored Encoding override that contradicts the selected outcome stays unresolved", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "1",
    window: "BOY"
  });
  const item = plan.items[0];
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: undefined,
    window: "BOY",
    responses: {
      [item.id]: {
        evaluation: "exact",
        exact: true,
        isCorrect: true,
        plausible: true,
        responseCaptureMode: "exact_transcription",
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

  assert.match(html, /The restored spelling override conflicts with this outcome/);
  assert.match(html, /More detail is needed here/);
});

test("decoding outcome transitions clear contradictory response state", () => {
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

test("revisiting a self-corrected Decoding item and choosing Straight away clears the old self-correction", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const item = plan.items[0];
  const selfCorrected = {
    automatic: false,
    errorTags: ["substitution"],
    evaluation: "accurate_after_sounding",
    isCorrect: true,
    responseCaptureMode: "exact_transcription",
    responseText: item.targetWord,
    selfCorrected: true,
    status: "self_corrected"
  };
  const revised = {
    ...selfCorrected,
    ...getDecodingEvaluationPatch("automatic_accurate", selfCorrected)
  };

  assert.equal(revised.status, "correct");
  assert.equal(revised.isCorrect, true);
  assert.equal(revised.automatic, true);
  assert.equal(revised.selfCorrected, false);
  assert.deepEqual(revised.errorTags, []);
  assert.equal(revised.evaluation, "automatic_accurate");

  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 0,
    responses: { [item.id]: revised }
  }));
  assert.match(html, /<button aria-pressed="true" class="el-benchmark-quick-button tone-positive"[^>]*>[\s\S]*?<span>Straight away<\/span>/);
  assert.match(html, /Answer saved/);
  assert.doesNotMatch(html, /<details class="el-benchmark-optional-detail" open/);
});

test("every Couldn't assess outcome still requires auditable reason evidence", () => {
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
    assert.match(invalidHtml, /aria-label="Reason this item cannot be scored"/);
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
    assert.doesNotMatch(validHtml, /aria-label="Reason this item cannot be scored"/);
  });
});

test("a completed Decoding word set offers one-tap Finish or Continue with override details hidden", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const stoppingHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 7,
    responses: completedFirstDecodingBand(plan, 5)
  }));

  assert.match(stoppingHtml, /This is a good place to finish/);
  assert.doesNotMatch(buttonOpeningTag(stoppingHtml, "Finish here"), /disabled/);
  assert.doesNotMatch(buttonOpeningTag(stoppingHtml, "Keep going instead"), /disabled/);
  assert.match(stoppingHtml, /<details class="el-benchmark-decision-detail"><summary>Why is finishing suggested\?<\/summary>/);
  assert.match(stoppingHtml, /aria-label="Item 9, not done yet, locked until the current decoding band is reviewed"[^>]*disabled/);
  assert.equal(countText(stoppingHtml, "Next item"), 0);
  assert.match(assessmentPageSource, /Why will another word set help\?/);
  assert.match(assessmentPageSource, /Save reason and continue/);
  assert.match(assessmentPageSource, /disabled=\{!overrideReason\.trim\(\)\}/);

  const continuingHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    currentItemIndex: 7,
    responses: completedFirstDecodingBand(plan, 6)
  }));
  assert.match(continuingHtml, /The child is ready for the next word set/);
  assert.doesNotMatch(buttonOpeningTag(continuingHtml, "Continue reading"), /disabled/);
  assert.doesNotMatch(continuingHtml, /Finish here<\/button>/);
});

test("a self-correction remains accurate but is excluded from the automatic count", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const responses = completedFirstDecodingBand(plan, 5);
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

  assert.match(html, /4 of 8 read straight away/);
  assert.match(html, /This is a good place to finish/);
});

test("Encoding accepts the suggested starting point in one tap and asks for rationale only on deviation", () => {
  const defaultPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "K",
    window: "BOY"
  });
  const defaultSession = makeSession(EL_BENCHMARK_IDS.ENCODING, {
    currentItemIndex: defaultPlan.items.length - 1,
    grade: "K",
    startMicrophase: undefined,
    window: "BOY",
    responses: completedEncodingResponses(defaultPlan)
  });
  const suggestedHtml = renderAssessment(defaultSession);
  assert.match(suggestedHtml, /Suggested starting point/);
  assert.match(suggestedHtml, /Based on the child’s grade and this time of year/);
  assert.doesNotMatch(buttonOpeningTag(suggestedHtml, "Use this starting point"), /disabled/);
  assert.match(suggestedHtml, /Choose a different starting point/);
  assert.doesNotMatch(suggestedHtml, /Why are you choosing a different starting point\?/);
  assert.doesNotMatch(buttonOpeningTag(suggestedHtml, "Choose starting point"), /disabled/);
  assert.match(suggestedHtml, /One final step: choose the child’s next starting point/);

  const acceptedHtml = renderAssessment({
    ...defaultSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_pre"),
    placementSource: "teacher_confirmation"
  });
  assert.match(acceptedHtml, /Starting point saved/);
  assert.match(acceptedHtml, /Middle Pre/);
  assert.doesNotMatch(buttonOpeningTag(acceptedHtml, "Finish check"), /disabled/);

  const deviationPlan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    formId: "form-a-v2",
    grade: "1",
    window: "BOY"
  });
  const deviationSession = makeSession(EL_BENCHMARK_IDS.ENCODING, {
    confirmedPlacement: teacherConfirmedPlacement("middle_partial"),
    currentItemIndex: deviationPlan.items.length - 1,
    grade: "1",
    placementSource: "teacher_confirmation",
    startMicrophase: undefined,
    window: "BOY",
    responses: completedEncodingResponses(deviationPlan)
  });
  const unreasonedHtml = renderAssessment(deviationSession);
  assert.match(unreasonedHtml, /Why are you choosing a different starting point\?/);
  assert.match(buttonOpeningTag(unreasonedHtml, "Save starting point"), /disabled/);
  assert.doesNotMatch(buttonOpeningTag(unreasonedHtml, "Choose starting point"), /disabled/);

  const reasonedHtml = renderAssessment({
    ...deviationSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_partial", {
      overrideReason: "Recent classroom reading shows this is a better fit."
    })
  });
  assert.match(reasonedHtml, /Reason: Recent classroom reading shows this is a better fit\./);
  assert.doesNotMatch(buttonOpeningTag(reasonedHtml, "Finish check"), /disabled/);
});

test("zero-scorable Decoding evidence can use the safe default without fabricating a scorer candidate", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const responses = Object.fromEntries(plan.items.map(item => [item.id, {
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
    currentItemIndex: plan.items.length - 1,
    responses
  });
  const suggestedHtml = renderAssessment(baseSession);

  assert.match(suggestedHtml, /Suggested starting point/);
  assert.match(suggestedHtml, /Result status: Partial · 0 scored items/);
  assert.doesNotMatch(buttonOpeningTag(suggestedHtml, "Use this starting point"), /disabled/);
  assert.doesNotMatch(suggestedHtml, /Why are you choosing a different starting point\?/);

  const acceptedHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_partial"),
    placementSource: "teacher_confirmation"
  });
  assert.match(acceptedHtml, /Starting point saved/);
  assert.doesNotMatch(buttonOpeningTag(acceptedHtml, "Finish check"), /disabled/);
});

test("Decoding permits the exact adjacent ceiling suggestion but rejects unrelated out-of-range placement", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_partial",
    window: "BOY"
  });
  const responses = Object.fromEntries(plan.items.map(item => [item.id, {
    automatic: true,
    evaluation: "automatic_accurate",
    isCorrect: true,
    itemId: item.id,
    responseCaptureMode: "quick_teacher_judgment",
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
  assert.match(proposedHtml, /Suggested starting point<\/span><strong>Early Full/);
  assert.doesNotMatch(buttonOpeningTag(proposedHtml, "Use this starting point"), /disabled/);

  const acceptedHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("early_full", { anchorCycle: 49 }),
    placementSource: "teacher_confirmation"
  });
  assert.match(acceptedHtml, /Starting point saved/);
  assert.doesNotMatch(buttonOpeningTag(acceptedHtml, "Finish check"), /disabled/);

  const invalidHtml = renderAssessment({
    ...baseSession,
    confirmedPlacement: teacherConfirmedPlacement("middle_full", {
      anchorCycle: 50,
      overrideReason: "A higher band was considered."
    }),
    placementSource: "teacher_confirmation"
  });
  assert.match(invalidHtml, /saved starting point is outside this check/i);
  assert.doesNotMatch(buttonOpeningTag(invalidHtml, "Choose starting point"), /disabled/);
});

test("ORF error and self-correction counters start at zero and remain live during timing", () => {
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
        errors: 0,
        itemId: item.id,
        selfCorrections: 0,
        status: "not_administered",
        timerStatus: "running"
      }
    }
  }));

  assert.match(html, /<output aria-label="Errors: 0">0<\/output>/);
  assert.match(html, /<output aria-label="Self-corrections: 0">0<\/output>/);
  assert.match(html, /<button aria-label="Add one errors"(?![^>]*disabled)[^>]*>/);
  assert.match(html, /<button aria-label="Add one self-corrections"(?![^>]*disabled)[^>]*>/);
  assert.doesNotMatch(html, /<h3>2\. Was this read accurate enough\?<\/h3>/);
  assert.match(assessmentPageSource, /saveElapsed\(elapsedSeconds, "running", \{\s+\.\.\.getFluencyTimerResetPatch\(\),\s+errors: 0,\s+selfCorrections: 0/);
});

test("tablet ORF keeps live counters with the on-screen passage", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  }));

  assert.equal(countText(html, "el-benchmark-tablet-counters"), 1);
  assert.equal(countText(html, "el-benchmark-desktop-counters"), 1);
  assert.match(html, /class="el-benchmark-tablet-counters" aria-label="Live reading counters"/);

  const tabletStart = assessmentPageStyles.indexOf("@media (max-width: 900px)");
  const tabletEnd = assessmentPageStyles.indexOf("@media (max-width: 820px)", tabletStart);
  const tabletStyles = assessmentPageStyles.slice(tabletStart, tabletEnd);
  assert.ok(tabletStart >= 0 && tabletEnd > tabletStart, "tablet breakpoint must remain defined");
  assert.match(tabletStyles, /\.el-benchmark-desktop-counters\s*\{\s*display: none;/);
  assert.match(tabletStyles, /\.el-benchmark-tablet-counters\s*\{[\s\S]*?position: sticky;[\s\S]*?display: grid;/);
  assert.match(tabletStyles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("ORF optional detail stays collapsed and does not compete with the timed passage", () => {
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  }));

  assert.match(html, /Start the timer, then let the child read directly from this screen/);
  assert.match(html, /<details class="el-benchmark-optional-detail"><summary>Optional notes, printable copy, or couldn’t score<\/summary>/);
  assert.match(html, /<details class="el-benchmark-clean-passage"><summary>Printable clean passage<\/summary>/);
  assert.doesNotMatch(html, /<details class="el-benchmark-optional-detail" open/);
  assert.doesNotMatch(html, /<details class="el-benchmark-clean-passage" open/);
});

test("a valid minute exposes atomic Yes-continue and Not-yet-stop choices", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  });
  const item = plan.items[0];
  const response = completedFluencyResponse(item);
  delete response.accurate;
  delete response.passageAccurate;
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses: { [item.id]: response }
  }));

  assert.match(html, /2\. Was this read accurate enough\?/);
  assert.match(html, /<span>Yes — continue<\/span>/);
  assert.match(html, /<span>Not yet — finish here<\/span>/);
  assert.match(html, /Record the teacher accuracy judgment before reviewing the passage route/);
  assert.match(buttonOpeningTag(html, "Finish check"), /disabled/);

  const atomicStart = assessmentPageSource.indexOf("const recordFluencyAccuracyAndRoute");
  const atomicEnd = assessmentPageSource.indexOf("const continueFluency", atomicStart);
  const atomicSource = assessmentPageSource.slice(atomicStart, atomicEnd);
  assert.ok(atomicStart >= 0 && atomicEnd > atomicStart);
  assert.match(atomicSource, /if \(accurate\)[\s\S]*currentItemIndex: currentIndex \+ 1[\s\S]*fluencyPassageDecisions/);
  assert.match(atomicSource, /routeSkipReason: "fluency_stop_teacher_judgment"/);
  assert.match(atomicSource, /fluencyStop: stopEvidence,[\s\S]*fluencyStopEvidence: stopEvidence/);
  assert.match(assessmentPageSource, /onAccuracyDecision=\{recordFluencyAccuracyAndRoute\}/);
});

test("ORF completes after a reliable minute without requiring optional expression ratings", () => {
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
    responses: { [item.id]: completedFluencyResponse(item) }
  }));

  assert.match(html, /Full minute recorded/);
  assert.match(html, /<output aria-label="Errors: 0">0<\/output>/);
  assert.match(html, /Reading expression \(optional\)/);
  assert.match(html, /All planned passages are complete/);
  assert.doesNotMatch(buttonOpeningTag(html, "Finish check"), /disabled/);
});

test("ORF completion requires a verified timer state, not just an elapsed number", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const invalid = completedFluencyResponse(item);
  invalid.timerStatus = "not_started";
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: invalid }
  }));

  assert.match(html, /Record exactly 60 seconds/);
  assert.match(buttonOpeningTag(html, "Finish check"), /disabled/);
});

test("ORF zero-word evidence is explicit, keeps accuracy N/A, and requires zero counts", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const validHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: completedZeroWordsFluencyResponse(item) }
  }));
  assert.match(validHtml, /No words reached recorded \(0 words attempted\)/);
  assert.match(validHtml, /<strong>Accuracy: N\/A<\/strong>/);
  assert.match(validHtml, /0 WCPM · Accuracy N\/A/);
  assert.doesNotMatch(validHtml, /2\. Was this read accurate enough\?/);
  assert.doesNotMatch(buttonOpeningTag(validHtml, "Finish here"), /disabled/);
  assert.match(buttonOpeningTag(validHtml, "Finish check"), /disabled/);

  const invalidCountsHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: completedZeroWordsFluencyResponse(item, { errors: null, selfCorrections: null })
    }
  }));
  assert.match(invalidCountsHtml, /For No words reached \(0\), errors and self-corrections must both be 0/);
  assert.match(buttonOpeningTag(invalidCountsHtml, "Finish check"), /disabled/);

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
  assert.match(buttonOpeningTag(invalidAccuracyHtml, "Finish check"), /disabled/);
});

test("ORF rejects short or legacy overlong timing instead of estimating a minute", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const shortHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: completedFluencyResponse(item, { elapsedSeconds: 59 }) }
  }));
  assert.match(shortHtml, /Record exactly 60 seconds/);
  assert.match(shortHtml, /00:01/);
  assert.match(buttonOpeningTag(shortHtml, "Finish check"), /disabled/);

  const overlongHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: { [item.id]: completedFluencyResponse(item, { elapsedSeconds: 90 }) }
  }));
  assert.match(overlongHtml, /Recorded time needs correction/);
  assert.match(overlongHtml, /Record exactly 60 seconds/);
  assert.match(buttonOpeningTag(overlongHtml, "Finish check"), /disabled/);
});

test("a valid full-passage early finish retains routing but never estimates WCPM", () => {
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

  assert.match(html, /Finished early at 59 seconds/);
  assert.match(html, /Finished in 59 seconds\. The accuracy result is saved, but a per-minute score is not estimated/);
  assert.match(html, /The accuracy result is saved; a per-minute score is not estimated/);
  assert.doesNotMatch(buttonOpeningTag(html, "Finish check"), /disabled/);
});

test("active timing keeps counters available but locks exits, printing, and accuracy choices", () => {
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
        errors: 0,
        itemId: item.id,
        selfCorrections: 0,
        status: "not_administered",
        timerStatus: "running"
      }
    }
  }));

  assert.match(html, /Stop — something interrupted us/);
  assert.match(html, /Child finished the whole passage/);
  assert.doesNotMatch(html, /Resume timer/);
  assert.match(buttonOpeningTag(html, "Save &amp; exit"), /disabled/);
  assert.match(buttonOpeningTag(html, "Print passage"), /disabled/);
  assert.match(buttonOpeningTag(html, "Finish check"), /disabled/);
  assert.doesNotMatch(html, /Yes — continue|Not yet — finish here/);
});

test("an interrupted timer cannot resume and must be reset before scoring", () => {
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
  assert.match(buttonOpeningTag(html, "Reset"), /type="button"/);
  assert.doesNotMatch(html, /Resume timer|>Start 1-minute read</);
  assert.match(buttonOpeningTag(html, "Finish check"), /disabled/);
});

test("resetting the fluency timer clears every abandoned score and provenance field", () => {
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

test("backgrounding, printing, or a clock jump invalidates continuous ORF timing", () => {
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
  assert.match(assessmentPageSource, /timer_session_restored_while_running/);
  assert.match(assessmentPageSource, /if \(!timingEvidenceReady \|\| zeroWordsReached\) return/);
});

test("ORF refuses impossible count combinations", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY"
  });
  const item = plan.items[0];
  const outOfRangeHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: { ...completedFluencyResponse(item), errors: 2, selfCorrections: 2, wordsAttempted: 1 }
    }
  }));
  assert.match(outOfRangeHtml, /Errors and self-corrections must be whole numbers from zero through words attempted/);
  assert.match(buttonOpeningTag(outOfRangeHtml, "Finish check"), /disabled/);

  const combinedHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    grade: "1",
    startMicrophase: "late_consolidated",
    window: "MOY",
    responses: {
      [item.id]: { ...completedFluencyResponse(item), errors: 1, selfCorrections: 1, wordsAttempted: 1 }
    }
  }));
  assert.match(combinedHtml, /Errors plus self-corrections cannot exceed the number of words attempted/);
  assert.match(buttonOpeningTag(combinedHtml, "Finish check"), /disabled/);
});

test("ORF renders the routed current passage, never the legacy first passage", () => {
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

test("ORF retains a clean printable student passage without scoring controls inside it", () => {
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

  assert.match(html, /Printable clean passage/);
  assert.match(html, /Print passage/);
  assert.match(sheet, /LiteracyPath EL-aligned provisional form/);
  assert.match(sheet, /not an official EL Education benchmark/);
  assert.match(sheet, new RegExp(`<h1>${item.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/h1><p>`));
  assert.match(sheet, /Teacher note — not part of the timed passage/);
  assert.doesNotMatch(sheet, /Errors|Self-corrections|Timer|button|input|select/);
});

test("a saved accurate ORF choice has already advanced to the next passage", () => {
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
      [first.id]: {
        action: "continue",
        accurate: true,
        passageAccurate: true,
        passageId: first.id,
        reason: "teacher_judgment_accurate"
      }
    },
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses: { [first.id]: completedFluencyResponse(first) }
  }));

  assert.match(html, new RegExp(second.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(html, /Accurate passage recorded|Explicitly continue/);
  assert.equal(countText(html, "Next item"), 0);
});

test("a saved Not-yet ORF choice atomically stops and marks later passages unadministered", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  });
  const first = plan.items[0];
  const responses = { [first.id]: completedFluencyResponse(first, { accurate: false }) };
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
  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    fluencyStop: stopEvidence,
    fluencyStopEvidence: stopEvidence,
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses
  }));

  assert.match(html, /Finished here/);
  assert.match(html, /Later passages will not count as incorrect/);
  assert.match(html, new RegExp(`<dt>Not done<\\/dt><dd>${plan.items.length - 1}<\\/dd>`));
  assert.match(html, /aria-label="Item 2, not done, locked after the confirmed fluency stop/);
  assert.doesNotMatch(html, /Item 2, incorrect|Confirm teacher-judgment stop/);
  assert.doesNotMatch(buttonOpeningTag(html, "Finish check"), /disabled/);
});

test("changing an earlier ORF passage to Not yet preserves later evidence and provides a review path", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    formId: "form-a-v2",
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY"
  });
  const first = plan.items[0];
  const second = plan.items[1];
  const firstResponse = completedFluencyResponse(first, { accurate: false });
  const laterResponse = {
    ...completedFluencyResponse(second),
    errors: 1,
    notes: "Retain this later observation exactly.",
    outcomeRecordedAt: "2026-07-22T13:05:00.000Z",
    wordsAttempted: 4
  };
  const responses = {
    [first.id]: firstResponse,
    [second.id]: laterResponse
  };
  const stopEvidence = {
    accurate: false,
    confirmed: true,
    criterion: "explicit_false",
    judgmentSource: "teacher",
    laterEvidencePreserved: true,
    passageAccurate: false,
    passageId: first.id,
    passageIndex: 0,
    reason: "teacher_judgment_not_accurate",
    retainedLaterPassageIds: [second.id],
    threshold: null
  };
  const stoppedHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    fluencyStop: stopEvidence,
    fluencyStopEvidence: stopEvidence,
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses
  }));

  assert.match(stoppedHtml, /Finished here/);
  assert.match(stoppedHtml, /Later reading stays saved as an extra result, but it will not change this stopping point or count toward the suggested start/);
  assert.doesNotMatch(buttonOpeningTag(stoppedHtml, "Undo and review later reading"), /disabled/);
  assert.match(stoppedHtml, /aria-label="Item 2, recorded, locked after the confirmed fluency stop"/);
  assert.doesNotMatch(stoppedHtml, /Item 2, not done|Item 2, incorrect/);

  const reviewDecision = {
    action: "review_later_evidence",
    accurate: false,
    passageAccurate: false,
    passageId: first.id,
    passageIndex: 0,
    reason: "review_later_evidence"
  };
  const reviewHtml = renderAssessment(makeSession(EL_BENCHMARK_IDS.ORAL_READING_FLUENCY, {
    currentItemIndex: 0,
    fluencyPassageDecisions: { [first.id]: reviewDecision },
    grade: "1",
    startMicrophase: "middle_partial",
    window: "MOY",
    responses
  }));
  const itemTwoTag = reviewHtml.match(/<button([^>]*) aria-label="Item 2, recorded"([^>]*)>/);
  assert.ok(itemTwoTag, "later recorded evidence remains available in the review drawer");
  assert.doesNotMatch(`${itemTwoTag[1]} ${itemTwoTag[2]}`, /disabled/);
  assert.match(reviewHtml, /Later reading is already saved/);
  assert.doesNotMatch(reviewHtml, /Item 2, not done|Item 2, incorrect/);

  const atomicStart = assessmentPageSource.indexOf("const recordFluencyAccuracyAndRoute");
  const atomicEnd = assessmentPageSource.indexOf("const continueFluency", atomicStart);
  const atomicSource = assessmentPageSource.slice(atomicStart, atomicEnd);
  assert.match(atomicSource, /const retainedLaterPassageIds = laterIndexes/);
  assert.match(atomicSource, /if \(retainedLaterPassageIds\.includes\(itemId\)\) return/);
  assert.match(atomicSource, /action: "review_later_evidence"/);
  assert.match(atomicSource, /laterEvidencePreserved: fluencyLaterHasEvidence/);
  assert.match(atomicSource, /retainedLaterPassageIds/);
  assert.match(atomicSource, /responses: nextResponses/);
  assert.match(atomicSource, /fluencyStop: stopEvidence/);

  const undoStart = assessmentPageSource.indexOf("const undoFluencyStop");
  const undoEnd = assessmentPageSource.indexOf("const continueDecoding", undoStart);
  const undoSource = assessmentPageSource.slice(undoStart, undoEnd);
  assert.match(undoSource, /response\?\.routeSkipReason !== "fluency_stop_teacher_judgment"/);
  assert.match(undoSource, /responses: nextResponses/);
  assert.doesNotMatch(undoSource, /fluencyPassageDecisions:\s*(?:\{\}|null)/, "undo must not clear the saved review-later route decision");
  assert.match(assessmentPageSource, /\["continue", "review_later_evidence"\]\.includes/);
  assert.deepEqual(responses[second.id], laterResponse, "rendering/review state must not alter the saved later observation");
});

test("a confirmed Decoding finish marks later items unadministered, never wrong", () => {
  const plan = getElBenchmarkPlan({
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    formId: "form-a-v2",
    grade: "K",
    startMicrophase: "middle_partial",
    window: "EOY"
  });
  const firstBandId = plan.items[0].bandId;
  const responses = completedFirstDecodingBand(plan, 5);
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
  assert.match(unconfirmedHtml, /Suggested starting point/);
  assert.doesNotMatch(buttonOpeningTag(unconfirmedHtml, "Use this starting point"), /disabled/);
  assert.doesNotMatch(buttonOpeningTag(unconfirmedHtml, "Choose starting point"), /disabled/);

  const html = renderAssessment(makeSession(EL_BENCHMARK_IDS.DECODING, {
    confirmedPlacement: teacherConfirmedPlacement(firstBandId),
    currentItemIndex: 7,
    decodingStop: stopEvidence,
    placementSource: "teacher_confirmation",
    responses,
    stopEvidence
  }));
  assert.match(html, /Finished here/);
  assert.match(html, new RegExp(`<dt>Not done<\\/dt><dd>${plan.items.length - 8}<\\/dd>`));
  assert.match(html, /aria-label="Item 9, not done/);
  assert.doesNotMatch(html, /Item 9, incorrect/);
  assert.doesNotMatch(buttonOpeningTag(html, "Finish check"), /disabled/);
});

test("the discontinue form still requires a note only when Other is selected", () => {
  assert.equal(isDiscontinueEvidenceComplete("student_fatigue", ""), true);
  assert.equal(isDiscontinueEvidenceComplete("other", ""), false);
  assert.equal(isDiscontinueEvidenceComplete("other", "Documented context"), true);
});
