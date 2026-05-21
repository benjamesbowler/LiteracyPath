import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jobs = [
  {
    filename: "riddle_box.png",
    prompt: "Premium children's reading assessment illustration. A colorful cardboard box that could hold shoes or presents, cozy classroom background, soft 3D clay-like style, warm lighting, no text, no letters, no numbers."
  },
  {
    filename: "boy_afraid.png",
    prompt: "Premium children's reading assessment illustration. A young boy looking afraid in a safe child-friendly scene, wide eyes, slightly worried face, soft 3D clay-like style, warm colors, no scary details, no text, no letters, no numbers."
  },
  {
    filename: "goat_inside_barn.png",
    prompt: "Premium children's reading assessment illustration. A cute goat clearly inside a red barn, cozy farm scene, soft 3D clay-like style, bright child-friendly colors, no text, no letters, no numbers."
  }
];

async function main() {
  fs.mkdirSync("public/images/generated", { recursive: true });

  for (const job of jobs) {
    console.log("Generating:", job.filename);

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: job.prompt,
      size: "1024x1024",
      quality: "low"
    });

    const buffer = Buffer.from(result.data[0].b64_json, "base64");

    fs.writeFileSync(
      `public/images/generated/${job.filename}`,
      buffer
    );

    console.log("Saved:", job.filename);
  }

  console.log("Special images complete.");
}

main();
