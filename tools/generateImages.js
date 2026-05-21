import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const imageJobs = [
  {
    filename: "cat_sleeping.png",
    folder: "general",
    prompt: "Cute modern 2D educational game illustration of a cat sleeping on a soft mat, bright colors, clean background, child-friendly, no text."
  },
  {
    filename: "dog_running.png",
    folder: "general",
    prompt: "Cute modern 2D educational game illustration of a happy dog running in a park, bright colors, clean background, child-friendly, no text."
  },
  {
    filename: "girl_reading.png",
    folder: "comprehension",
    prompt: "Cute modern 2D educational game illustration of a young girl reading a book, bright colors, clean classroom background, child-friendly, no text."
  },
  {
    filename: "rainy_day.png",
    folder: "comprehension",
    prompt: "Cute modern 2D educational game illustration of a rainy day with umbrella and puddles, bright colors, clean background, child-friendly, no text."
  },
  {
    filename: "apple.png",
    folder: "vocabulary",
    prompt: "Cute modern 2D educational game illustration of a red apple, bright colors, clean simple background, child-friendly, no text."
  }
];

async function generateImage(job) {
  console.log("Generating:", job.filename);

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: job.prompt,
    size: "1024x1024",
    quality: "low"
  });

  const imageBase64 = result.data[0].b64_json;
  const imageBuffer = Buffer.from(imageBase64, "base64");

  const path = `public/images/${job.folder}/${job.filename}`;

  fs.writeFileSync(path, imageBuffer);

  console.log("Saved:", path);
}

async function main() {
  for (const job of imageJobs) {
    await generateImage(job);
  }

  console.log("Image batch complete.");
}

main();
