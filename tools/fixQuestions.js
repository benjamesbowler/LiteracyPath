import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function hasAnswerInQuestion(q) {
  if (!q.question || !q.answer) return false;

  const question = q.question.toLowerCase();
  const answer = String(q.answer).toLowerCase();

  return question.includes(`'${answer}'`) ||
         question.includes(`"${answer}"`) ||
         question.includes(` ${answer} `);
}

function fixQuestion(q) {
  const fixed = { ...q };

  if (
    hasAnswerInQuestion(q) &&
    (
      q.skill?.toLowerCase().includes("phonics") ||
      q.skill?.toLowerCase().includes("vowel") ||
      q.question?.toLowerCase().includes("vowel")
    )
  ) {
    fixed.question = fixed.question
      .replace(/in the middle of ['"][a-z]+['"]/i, "in the middle")
      .replace(/in ['"][a-z]+['"]/i, "")
      .replace(/of ['"][a-z]+['"]/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (fixed.question.length < 20) {
      fixed.question = "Which word has the short vowel sound?";
    }

    fixed.skill = "short vowels";
    fixed.questionType = "multiple_choice";
  }

  return fixed;
}

const fixedQuestions = generatedQuestions.map(fixQuestion);

let fixedCount = 0;

for (let i = 0; i < generatedQuestions.length; i++) {
  if (
    JSON.stringify(generatedQuestions[i]) !==
    JSON.stringify(fixedQuestions[i])
  ) {
    fixedCount++;
  }
}

const output =
`export const generatedQuestions = ${JSON.stringify(fixedQuestions, null, 2)};
`;

fs.writeFileSync("src/data/generatedQuestions.js", output);

console.log("Fixed questions:", fixedCount);
