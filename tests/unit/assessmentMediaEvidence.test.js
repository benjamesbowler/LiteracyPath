import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  collectAssessmentEvidenceImages,
  excludeFailedAssessmentMediaQuestions,
  getAssessmentDecorativeMediaProps,
  getAssessmentEvidenceAccessibleName,
  refillAssessmentRoundAfterMediaFailure
} from "../../src/policy/assessmentMediaEvidence.js";

function visualQuestion(id, image, word) {
  return {
    id,
    skillId: "initial_sounds",
    questionType: "visual_card_choice",
    imageCards: [{
      word,
      value: word,
      image
    }]
  };
}

test("failed evidence removes the item and refills the round without changing its length", () => {
  const failed = visualQuestion("failed-cat", "/missing/cat.webp", "cat");
  const sharesBrokenEvidence = visualQuestion("also-broken", "/missing/cat.webp", "cat");
  const retained = visualQuestion("retained-dog", "/images/dog.webp", "dog");
  const replacement = visualQuestion("replacement-map", "/images/map.webp", "map");

  const refilled = refillAssessmentRoundAfterMediaFailure({
    round: [failed, retained],
    failedQuestionId: failed.id,
    failedSource: "/missing/cat.webp",
    candidates: [failed, sharesBrokenEvidence, retained, replacement],
    targetLength: 2
  });

  assert.deepEqual(refilled.map(question => question.id), [
    "retained-dog",
    "replacement-map"
  ]);
  assert.equal(refilled.length, 2);
});

test("session filtering excludes both the failed item and any item using its failed evidence", () => {
  const questions = [
    visualQuestion("failed-cat", "/missing/cat.webp", "cat"),
    visualQuestion("same-file", "/missing/cat.webp", "cap"),
    visualQuestion("safe-dog", "/images/dog.webp", "dog")
  ];

  const eligible = excludeFailedAssessmentMediaQuestions(questions, {
    failedQuestionIds: new Set(["failed-cat"]),
    failedSources: new Set(["/missing/cat.webp"])
  });

  assert.deepEqual(eligible.map(question => question.id), ["safe-dog"]);
});

test("every collected answer-evidence image retains a role and equivalent label", () => {
  const question = {
    id: "picture-evidence",
    targetWord: "moon",
    imagePath: "/images/moon.webp",
    promptImageCards: [{
      word: "star",
      image: "/images/star.webp",
      alt: "A bright star"
    }],
    imageCards: [{
      word: "map",
      image: "/images/map.webp"
    }],
    answerOptions: [{
      label: "dog",
      imageUrl: "/images/dog.webp"
    }],
    choiceImages: {
      cat: {
        image: "/images/cat.webp"
      }
    }
  };

  const evidence = collectAssessmentEvidenceImages(question);
  assert.deepEqual(evidence.map(item => item.role), [
    "stimulus",
    "prompt",
    "choice",
    "choice",
    "choice"
  ]);
  assert.deepEqual(
    evidence.map(item => getAssessmentEvidenceAccessibleName(item)),
    [
      "Picture of moon",
      "A bright star",
      "Picture of map",
      "Picture of dog",
      "Picture of cat"
    ]
  );
});

test("generic image names are replaced, missing evidence names fail closed, and decoration is explicit", () => {
  assert.equal(
    getAssessmentEvidenceAccessibleName({
      alt: "question visual",
      label: "cup between two books",
      role: "stimulus"
    }),
    "Picture of cup between two books"
  );
  assert.throws(
    () => getAssessmentEvidenceAccessibleName({ alt: "image", role: "choice" }),
    /missing a meaningful accessible name/
  );
  assert.deepEqual(getAssessmentDecorativeMediaProps(), {
    "aria-hidden": "true",
    "data-assessment-media-kind": "decorative"
  });
});

test("the production assessment renderer routes evidence failures into the unscored replacement path", () => {
  const appSource = [
    readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8"),
    readFileSync(
      new URL("../../src/appState/assessmentRoundController.js", import.meta.url),
      "utf8"
    )
  ].join("\n");
  const surfaceSource = readFileSync(
    new URL("../../src/components/AppSurface.jsx", import.meta.url),
    "utf8"
  );
  const pagesSource = readFileSync(
    new URL("../../src/components/AppPages.jsx", import.meta.url),
    "utf8"
  );
  const imageTags = pagesSource.match(/<img\b[\s\S]*?\/>/g) || [];

  assert.match(appSource, /function handleAssessmentEvidenceImageError\(/);
  assert.match(appSource, /failedAssessmentMediaRef\.current\.failedQuestionIds\.add/);
  assert.match(appSource, /setCurrentQuestion\(null\)[\s\S]*?pickQuestion\(failedMode, failedStageIndex\)/);
  assert.match(surfaceSource, /onEvidenceImageError=\{handleAssessmentEvidenceImageError\}/);
  assert.match(appSource, /excludeSessionMediaFailures\([\s\S]*?allQuestionsRef\.current\.filter/);

  assert.ok(imageTags.length > 0, "the assessment renderer should contain classified evidence images");
  assert.equal(
    imageTags.every(tag => tag.includes("data-assessment-media-kind")),
    true,
    "every assessment image must explicitly declare whether it is item evidence or post-answer feedback"
  );
  assert.match(pagesSource, /function AssessmentEvidenceImage\([\s\S]*?onError=\{\(\) => onEvidenceImageError/);
});
