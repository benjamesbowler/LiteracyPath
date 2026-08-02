import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import { GUIDED_READING_QUIZZES } from "../../src/data/generated/guidedReadingQuizzes.generated.js";
import {
  GUIDED_READING_BIG_IDEA_POLICY_VERSION,
  guidedReadingBigIdeaAnswer,
  guidedReadingBigIdeaFairnessIssues
} from "../../src/policy/guidedReadingBigIdeaPolicy.js";
import {
  answerIsSupportedByText,
  auditGuidedReadingQuestionBank
} from "../../tools/guidedReadingQuestionAuditLib.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const quizDirectory = path.join(repoRoot, "public", "guided-reading", "quizzes");

test("every active Guided Reading book has three evidence-grounded comprehension questions", () => {
  const result = auditGuidedReadingQuestionBank({ books: guidedReadingBooks, quizDirectory });
  assert.deepEqual(result.failures, []);
  assert.equal(result.metrics.bookCount, 206);
  assert.equal(result.metrics.quizFileCount, 206);
  assert.equal(result.metrics.questionCount, 618);
  assert.equal(result.metrics.evidenceCount, 618);
  assert.equal(result.metrics.supportedAnswerCount, 618);
  assert.equal(result.metrics.prohibitedPromptCount, 0);
  assert.equal(result.metrics.repeatedAnswerCount, 0);
  assert.equal(result.metrics.answerLengthGiveawayCount, 0);
  assert.equal(result.metrics.bigIdeaQuestionCount, 76);
  assert.equal(result.metrics.fairBigIdeaQuestionCount, 76);
});

test("big-idea choices never use another true book detail as a second defensible answer", () => {
  const pets = guidedReadingBooks.find(book => book.id === "gr-a-26");
  const answer = guidedReadingBigIdeaAnswer(pets);
  const ambiguousQuestion = {
    skill: "main_idea",
    answer,
    choices: [answer, pets.pages[0].text, pets.pages[2].text],
    bigIdeaPolicy: GUIDED_READING_BIG_IDEA_POLICY_VERSION
  };

  assert.match(
    guidedReadingBigIdeaFairnessIssues(ambiguousQuestion, pets).join("\n"),
    /not an explicit narrow-scope misconception/
  );
});

test("the frog life-cycle answer covers the whole book, not its final call detail", () => {
  const frogs = guidedReadingBooks.find(book => book.id === "level-c-nonfiction-10-frogs");
  assert.equal(
    guidedReadingBigIdeaAnswer(frogs),
    "Frogs grow from eggs and live on land and in water."
  );
  assert.notEqual(guidedReadingBigIdeaAnswer(frogs), frogs.pages.at(-1).text);
});

test("the bundled runtime question bank exactly matches every approved source quiz", () => {
  assert.equal(Object.keys(GUIDED_READING_QUIZZES).length, guidedReadingBooks.length);

  guidedReadingBooks.forEach(book => {
    const authored = JSON.parse(fs.readFileSync(path.join(quizDirectory, `${book.id}.json`), "utf8"));
    const expectedRuntimeQuiz = {
      bookId: authored.bookId,
      quizVersion: authored.quizVersion,
      contentHash: authored.contentHash,
      questions: authored.questions.map(({ id, prompt, choices, answer, kind }) => ({
        id,
        prompt,
        choices,
        answer,
        kind
      }))
    };

    assert.deepEqual(
      GUIDED_READING_QUIZZES[book.id],
      expectedRuntimeQuiz,
      `${book.id} differs between the authored source and bundled runtime bank`
    );
  });
});

test("conceptual answers need a traceable rationale when their wording is not in the evidence", () => {
  const answer = "Everyone used their strength together.";
  const evidence = "We did that, said Sunny. All of us.";

  assert.equal(answerIsSupportedByText(answer, evidence, { conceptual: true }), false);
  assert.equal(answerIsSupportedByText(answer, evidence, {
    conceptual: true,
    rationale: "Sunny's words 'all of us' show that everyone used their different strengths together."
  }), true);
  assert.equal(answerIsSupportedByText(answer, evidence, {
    conceptual: true,
    rationale: "This is the correct interpretation of the story."
  }), false);
  assert.equal(answerIsSupportedByText(answer, evidence, {
    conceptual: true,
    rationale: "Sunny watched while everyone worked."
  }), false);
  assert.equal(answerIsSupportedByText(answer, evidence, {
    conceptual: true,
    rationale: "Sunny shows that everyone worked on the problem."
  }), false);
  assert.equal(answerIsSupportedByText(answer, evidence, {
    conceptual: true,
    rationale: "Everyone used their strength together because the cave was blue."
  }), false);
});

test("direct evidence needs strong semantic coverage and matching polarity", () => {
  assert.equal(answerIsSupportedByText("plants help people", "Plants help people grow food."), true);
  assert.equal(answerIsSupportedByText("plants destroy people", "Plants help people grow food."), false);
  assert.equal(answerIsSupportedByText("the dog sleeps", "The dog runs through the park."), false);
  assert.equal(answerIsSupportedByText("plants help people", "Plants do not help people."), false);
  assert.equal(answerIsSupportedByText("plants do not help people", "Plants help people."), false);
});

test("every clause of a compound answer needs an evidence link", () => {
  assert.equal(answerIsSupportedByText("a blue sky and green grass", "The sky is blue."), false);
  assert.equal(answerIsSupportedByText(
    "a blue sky and green grass",
    "The sky is blue. The grass is green."
  ), true);
  assert.equal(answerIsSupportedByText(
    "a blue sky and dry grass",
    "The sky is blue. The grass is green."
  ), false);
});
