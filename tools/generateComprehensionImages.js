import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jobs = [
  ["comprehension/library_visit.png", "children visiting a library after lunch"],
  ["comprehension/muddy_boots.png", "child wearing boots on muddy ground"],
  ["comprehension/bird_on_fence.png", "red bird sitting on a fence and singing"],
  ["comprehension/paint_flower.png", "child painting a flower with a small brush"],
  ["comprehension/open_backpack_books.png", "open backpack with books falling out"],
  ["comprehension/burned_cookies.png", "cookies slightly burned on a baking tray"],
  ["comprehension/puppy_chewed_shoe.png", "puppy beside a shoe with small chew holes"],
  ["comprehension/sturdy_tower.png", "strong block tower standing without falling"],
  ["comprehension/curious_kitten_boxes.png", "curious kitten looking inside boxes"],
  ["comprehension/team_problem_solving.png", "children listening and solving a puzzle together"],
  ["comprehension/shared_umbrella.png", "child sharing an umbrella with a friend in rain"],
  ["comprehension/community_cleanup.png", "children cleaning litter in a park"]
];

const basePrompt = `
Premium children's literacy assessment illustration.
Professional calm assessment style.
Not toy-like.
Soft clean educational illustration.
Warm neutral colors.
Clear single scene.
No text, no letters, no numbers, no speech bubbles.
Suitable for kindergarten to grade 3.
`;

async function generate(path, scene, index) {
  const fullPath = `public/images/${path}`;

  if (fs.existsSync(fullPath)) {
    console.log(`[${index}/${jobs.length}] Exists, skipping: ${path}`);
    return;
  }

  fs.mkdirSync(fullPath.split("/").slice(0, -1).join("/"), {
    recursive: true
  });

  console.log(`[${index}/${jobs.length}] Generating: ${path}`);

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: `${basePrompt}\nScene: ${scene}`,
    size: "1024x1024",
    quality: "low"
  });

  fs.writeFileSync(
    fullPath,
    Buffer.from(result.data[0].b64_json, "base64")
  );

  console.log(`[${index}/${jobs.length}] Saved: ${path}`);
}

for (let i = 0; i < jobs.length; i++) {
  const [path, scene] = jobs[i];
  await generate(path, scene, i + 1);
}

console.log("Comprehension image pack complete.");
