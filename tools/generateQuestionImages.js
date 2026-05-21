import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const IMAGE_LIMIT = 5;

const imageFriendlySkills = [
  "phonics",
  "spelling",
  "vocabulary",
  "antonyms",
  "plurals",
  "sentence comprehension",
  "reading comprehension",
  "inference"
];

function safeFileName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function makePrompt(q) {
  return `
Create a premium children's reading game illustration.

Art direction:
- cozy storybook game world
- soft 3D clay-like characters and objects
- warm classroom-friendly colors
- polished educational app quality
- expressive but simple characters
- clean scene with depth and lighting
- consistent style across all images
- charming, playful, high quality
- no text
- no letters
- no numbers
- no speech bubbles
- no scary details
- suitable for kindergarten to grade 3
`;
}

async function generateImage(question, index) {
  const folder = "public/images/generated";
  fs.mkdirSync(folder, { recursive: true });

  const filename =
    `${index + 1}_${question.skill}_${safeFileName(question.answer)}.png`
      .replaceAll(" ", "_");

  const path = `${folder}/${filename}`;

  console.log("Generating image for:", question.id);

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: makePrompt(question),
    size: "1024x1024",
    quality: "low"
  });

  const imageBase64 = result.data[0].b64_json;
  const imageBuffer = Buffer.from(imageBase64, "base64");

  fs.writeFileSync(path, imageBuffer);

  return `/images/generated/${filename}`;
}

async function main() {
  const updated = [...generatedQuestions];

  const targets = updated
    .filter(q =>
      !q.imagePath &&
      imageFriendlySkills.includes(q.skill)
    )
    .slice(0, IMAGE_LIMIT);

  console.log("Images to generate:", targets.length);

  for (let i = 0; i < targets.length; i++) {
    const question = targets[i];
    const imagePath = await generateImage(question, i);

    const index = updated.findIndex(q => q.id === question.id);
    updated[index] = {
      ...updated[index],
      imagePath
    };

    console.log("Attached:", imagePath);
  }

  const fileContent =
`export const generatedQuestions = ${JSON.stringify(updated, null, 2)};
`;

  fs.writeFileSync(
    "src/data/generatedQuestions.js",
    fileContent
  );

  console.log("Done. Updated generatedQuestions.js");
}

main();
