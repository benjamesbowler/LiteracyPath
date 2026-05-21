import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const skillConfigs = [
  {
    skill: "phonics",
    grades: "K-1",
    difficulty: "1-2",
    count: 100
  },
  {
    skill: "spelling",
    grades: "K-2",
    difficulty: "1-3",
    count: 100
  },
  {
    skill: "antonyms",
    grades: "1-2",
    difficulty: "2-3",
    count: 80
  },
  {
    skill: "plurals",
    grades: "1-2",
    difficulty: "2-4",
    count: 80
  },
  {
    skill: "sentence comprehension",
    grades: "K-2",
    difficulty: "2-3",
    count: 100
  },
  {
    skill: "reading comprehension",
    grades: "1-3",
    difficulty: "3-5",
    count: 120
  },
  {
    skill: "inference",
    grades: "2-3",
    difficulty: "4-5",
    count: 80
  }
];

async function generateSkillBlock(config) {

  console.log(`Generating ${config.skill}...`);

  const response =
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: `
Create ${config.count} VERY HIGH QUALITY elementary reading assessment questions aligned with early reading foundations and EL Education Skills Block style skill progression.

Skill:
${config.skill}

Grade range:
${config.grades}

Difficulty range:
${config.difficulty}

Return ONLY valid JSON array.

Format:
{
  "id": "",
  "grade": "K",
  "skill": "",
  "difficulty": 1,
  "passage": "",
  "question": "",
  "image": "",
  "choices": ["", "", "", ""],
  "answer": ""
}

IMPORTANT RULES:
- Make distractors believable but clearly incorrect
- There must be ONLY ONE correct answer
- Do not include two real correct spellings in spelling questions
- Do not put the answer word inside the question unless it is a context clues item
- Avoid awkward wording like "Which word spells a bicycle?"
- Use clean stems such as:
  * Which word matches the picture?
  * Which word is spelled correctly?
  * Which word begins with the /b/ sound?
  * Which word has the same middle sound as "pet"?
  * What does the word ___ mean?
  * What can you infer from the passage?
- For spelling questions, wrong choices must be misspellings of the target word, not other correctly spelled words
- For phonics questions, test one exact sound skill only
- For reading comprehension, the answer must be found or inferred from the passage
- Use real educational assessment quality
- Questions must all be unique
- image should be one fitting emoji only if helpful
- answer must exactly match one choice
- exactly 4 choices
- no markdown
- no explanations
`
        }
      ]
    });

  return JSON.parse(
    response.choices[0].message.content
  );
}

async function main() {

  let allQuestions = [];

  for (const config of skillConfigs) {

    const block =
      await generateSkillBlock(config);

    allQuestions =
      [...allQuestions, ...block];
  }

  const fileContent =
`export const generatedQuestions = ${JSON.stringify(allQuestions, null, 2)};
`;

  fs.writeFileSync(
    "src/data/generatedQuestions.js",
    fileContent
  );

  console.log(
    "Finished generating:",
    allQuestions.length
  );
}

main();
