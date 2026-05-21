import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

function cleanQuestion(q) {
  const fixed = { ...q };
  const text = String(fixed.question || "");

  // Bad: "Which word spells a bicycle?"
  if (/which word spells (a|an|the)?\s*/i.test(text)) {
    fixed.question = "Which word matches the picture?";
    fixed.skill = "vocabulary";
    fixed.questionType = "multiple_choice";
  }

  // Bad: "Which word spells bike?"
  if (/which word spells [a-z]+/i.test(text)) {
    fixed.question = "Which word is spelled correctly?";
    fixed.skill = "spelling";
    fixed.questionType = "multiple_choice";
  }

  // Bad wording: "What word is the picture?"
  if (/what word is the picture/i.test(text)) {
    fixed.question = "Which word matches the picture?";
    fixed.skill = "vocabulary";
    fixed.questionType = "multiple_choice";
  }

  // Bad wording: "Which word means a picture of..."
  if (/which word means a picture/i.test(text)) {
    fixed.question = "Which word matches the picture?";
    fixed.skill = "vocabulary";
    fixed.questionType = "multiple_choice";
  }

  // Better wording for image vocabulary
  if (
    fixed.skill &&
    String(fixed.skill).toLowerCase().includes("vocabulary") &&
    /which word/i.test(text) &&
    /picture/i.test(text)
  ) {
    fixed.question = "Which word matches the picture?";
  }

  // Avoid direct answer leakage in question
  if (
    fixed.answer &&
    fixed.question &&
    fixed.question.toLowerCase().includes(String(fixed.answer).toLowerCase()) &&
    !String(fixed.skill).toLowerCase().includes("context")
  ) {
    if (String(fixed.skill).toLowerCase().includes("vocabulary")) {
      fixed.question = "Which word matches the picture?";
    }
  }

  return fixed;
}

const cleaned = generatedQuestions.map(cleanQuestion);

let changed = 0;

for (let i = 0; i < generatedQuestions.length; i++) {
  if (JSON.stringify(generatedQuestions[i]) !== JSON.stringify(cleaned[i])) {
    changed++;
  }
}

const output =
`export const generatedQuestions = ${JSON.stringify(cleaned, null, 2)};
`;

fs.writeFileSync("src/data/generatedQuestions.js", output);

console.log("Cleaned bad wording:", changed);
