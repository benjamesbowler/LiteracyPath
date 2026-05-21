import { questions } from "../src/questions.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const allQuestions = [...questions, ...generatedQuestions];

const problems = [];
const ids = new Set();
const questionTexts = new Set();

for (const q of allQuestions) {
  if (!q.id) problems.push(["missing id", q]);
  if (!q.question) problems.push(["missing question", q.id]);
  if (!q.skill) problems.push(["missing skill", q.id]);
  if (!q.grade) problems.push(["missing grade", q.id]);
  if (!q.difficulty || q.difficulty < 1 || q.difficulty > 5) {
    problems.push(["bad difficulty", q.id]);
  }

  if (!Array.isArray(q.choices)) {
    problems.push(["choices not array", q.id]);
  } else {
    if (q.choices.length < 2) problems.push(["too few choices", q.id]);

    const uniqueChoices = new Set(q.choices);
    if (uniqueChoices.size !== q.choices.length) {
      problems.push(["duplicate choices", q.id]);
    }

    if (!q.choices.includes(q.answer)) {
      problems.push(["answer not in choices", q.id]);
    }
  }

  if (!q.answer) problems.push(["missing answer", q.id]);

  if (ids.has(q.id)) {
    problems.push(["duplicate id", q.id]);
  }
  ids.add(q.id);

  const cleanQuestion = String(q.question).toLowerCase().trim();
  if (questionTexts.has(cleanQuestion)) {
    problems.push(["duplicate question text", q.id]);
  }
  questionTexts.add(cleanQuestion);

  if (q.passage && q.passage.length < 10) {
    problems.push(["very short passage", q.id]);
  }

  if (q.question && q.question.length < 8) {
    problems.push(["very short question", q.id]);
  }
}

console.log("TOTAL QUESTIONS:", allQuestions.length);
console.log("PROBLEMS FOUND:", problems.length);

for (const problem of problems.slice(0, 100)) {
  console.log("-", problem[0], ":", problem[1]);
}

if (problems.length > 100) {
  console.log(`...and ${problems.length - 100} more`);
}

if (problems.length === 0) {
  console.log("Question bank passed basic validation.");
}
