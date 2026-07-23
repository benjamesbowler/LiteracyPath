import assert from "node:assert/strict";
import test from "node:test";

import {
  guidedReadingQuestionsShareCoreConcept,
  isGuidedReadingQuestionGenreAppropriate,
  isGuidedReadingQuestionStructurallyValid,
  prepareGuidedReadingQuiz,
  randomizeGuidedReadingAnswerPositions
} from "../../src/utils/guidedReading/bookQuizQuestions.js";

const book = { id: "test-book", type: "fiction" };
const questions = [
  {
    prompt: "What did Pip carry?",
    choices: ["a map", "a drum", "a kite"],
    answer: "a map",
    kind: "text"
  },
  {
    prompt: "Why did Pip stop?",
    choices: ["to help Fern", "to eat lunch", "to hide"],
    answer: "to help Fern",
    kind: "text"
  },
  {
    prompt: "How did the trip end?",
    choices: ["They reached home.", "They got lost.", "They fell asleep."],
    answer: "They reached home.",
    kind: "text"
  }
];

test("a guided-reading question needs one answer among exactly three unique choices", () => {
  assert.equal(isGuidedReadingQuestionStructurallyValid(questions[0]), true);
  assert.equal(isGuidedReadingQuestionStructurallyValid({ ...questions[0], prompt: "No question mark" }), false);
  assert.equal(isGuidedReadingQuestionStructurallyValid({ ...questions[0], choices: ["a map", "a map", "a kite"] }), false);
  assert.equal(isGuidedReadingQuestionStructurallyValid({ ...questions[0], answer: "a boat" }), false);
});

test("a prepared three-question quiz uses every answer position exactly once", () => {
  const prepared = randomizeGuidedReadingAnswerPositions(questions, () => 0);
  const positions = prepared.map(question => question.choices.indexOf(question.answer)).sort();
  assert.deepEqual(positions, [0, 1, 2]);
  assert.deepEqual(prepared.map(question => question.answer), questions.map(question => question.answer));
});

test("the runtime rejects generic templates and repeated answer concepts", () => {
  assert.equal(prepareGuidedReadingQuiz({ bookId: book.id, questions }, book, { random: () => 0 })?.length, 3);

  const generic = questions.map((question, index) => index === 0
    ? { ...question, prompt: "Which word was in your book?" }
    : question);
  assert.equal(prepareGuidedReadingQuiz({ bookId: book.id, questions: generic }, book), null);

  const repeated = questions.map(question => ({
    ...question,
    choices: ["Pip", "Fern", "Stone"],
    answer: "Pip"
  }));
  assert.equal(prepareGuidedReadingQuiz({ bookId: book.id, questions: repeated }, book), null);
});

test("the runtime rejects fiction language in a nonfiction quiz", () => {
  const nonfictionBook = { ...book, type: "nonfiction" };
  const genreMismatch = questions.map((question, index) => index === 1
    ? { ...question, prompt: "Which character fixed the problem?" }
    : question);
  assert.equal(prepareGuidedReadingQuiz({ bookId: book.id, questions: genreMismatch }, nonfictionBook), null);

  const choiceMismatch = questions.map((question, index) => index === 0
    ? { ...question, choices: ["a map", "the main character", "a kite"] }
    : question);
  assert.equal(isGuidedReadingQuestionGenreAppropriate(choiceMismatch[0], nonfictionBook), false);
  assert.equal(prepareGuidedReadingQuiz({ bookId: book.id, questions: choiceMismatch }, nonfictionBook), null);

  const answerMismatch = questions.map((question, index) => index === 2
    ? {
        ...question,
        choices: ["the main character", "the final fact", "the last place"],
        answer: "the main character"
      }
    : question);
  assert.equal(isGuidedReadingQuestionGenreAppropriate(answerMismatch[2], nonfictionBook), false);
  assert.equal(prepareGuidedReadingQuiz({ bookId: book.id, questions: answerMismatch }, nonfictionBook), null);
});

test("the runtime rejects two questions that test the same title-linked core concept", () => {
  const clumsyBook = { id: "clumsy-book", title: "Clumsy to the Rescue", type: "fiction" };
  const overlappingQuestions = [
    {
      prompt: "Why could Clumsy search farther than the others?",
      choices: ["Clumsy could see over the ferns.", "Clumsy knew the path.", "Clumsy could swim."],
      answer: "Clumsy could see over the ferns.",
      kind: "text"
    },
    questions[1],
    {
      prompt: "Why did Clumsy and Wiggly make a good team?",
      choices: [
        "Clumsy could see it and Wiggly could reach it.",
        "Clumsy and Wiggly both fell asleep.",
        "Clumsy and Wiggly hid the pillow."
      ],
      answer: "Clumsy could see it and Wiggly could reach it.",
      kind: "text"
    }
  ];

  assert.equal(guidedReadingQuestionsShareCoreConcept(
    overlappingQuestions[0],
    overlappingQuestions[2],
    clumsyBook
  ), true);
  assert.equal(prepareGuidedReadingQuiz({
    bookId: clumsyBook.id,
    questions: overlappingQuestions
  }, clumsyBook), null);

  const distinctSpellQuestions = [
    { answer: "She reads the spell backwards." },
    { answer: "Reading each spell carefully can prevent the same mistake." }
  ];
  assert.equal(guidedReadingQuestionsShareCoreConcept(
    distinctSpellQuestions[0],
    distinctSpellQuestions[1],
    { title: "The Very Small Wizard" }
  ), false);
});

test("the runtime rejects a quiz file for the wrong book", () => {
  assert.equal(prepareGuidedReadingQuiz({ bookId: "another-book", questions }, book), null);
});
