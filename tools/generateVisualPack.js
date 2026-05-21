import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const jobs = [
  // Vocabulary objects
  ["vocabulary/apple.png", "single red apple on a clean table"],
  ["vocabulary/bicycle.png", "child friendly bicycle standing in a sunny park"],
  ["vocabulary/umbrella.png", "colorful umbrella in light rain"],
  ["vocabulary/backpack.png", "school backpack on a classroom chair"],
  ["vocabulary/winter.png", "child friendly winter scene with snow, scarf, and mittens"],
  ["vocabulary/dock.png", "wooden dock beside calm water"],
  ["vocabulary/friends.png", "two children smiling and playing together"],
  ["vocabulary/barn.png", "red barn on a friendly farm"],
  ["vocabulary/cake.png", "slice of chocolate cake on a plate"],
  ["vocabulary/book.png", "open picture book on a desk"],

  // Prepositions
  ["prepositions/cat_in_box.png", "cute cat clearly inside a cardboard box"],
  ["prepositions/dog_under_table.png", "cute dog clearly under a table"],
  ["prepositions/ball_on_chair.png", "ball clearly on top of a chair"],
  ["prepositions/bird_above_tree.png", "bird flying clearly above a tree"],
  ["prepositions/rabbit_beside_basket.png", "rabbit clearly beside a basket"],
  ["prepositions/bear_behind_tree.png", "small teddy bear clearly behind a tree"],
  ["prepositions/goat_inside_barn.png", "cute goat clearly inside a barn"],
  ["prepositions/duck_outside_pond.png", "duck clearly outside the pond standing on grass"],
  ["prepositions/cup_between_books.png", "cup clearly between two books"],
  ["prepositions/shoes_near_door.png", "pair of shoes clearly near a door"],

  // Emotions
  ["emotions/happy_child.png", "happy child smiling with bright face"],
  ["emotions/sad_child.png", "sad child with gentle expression, safe and child friendly"],
  ["emotions/afraid_child.png", "child looking afraid but safe, worried expression, no scary details"],
  ["emotions/surprised_child.png", "surprised child with wide eyes and open mouth"],
  ["emotions/proud_child.png", "proud child holding completed school work"],
  ["emotions/tired_child.png", "tired child yawning at a desk"],
  ["emotions/excited_child.png", "excited child jumping happily"],
  ["emotions/confused_child.png", "confused child looking at a puzzle"],
  ["emotions/angry_child.png", "angry child with crossed arms, safe classroom scene"],
  ["emotions/calm_child.png", "calm child sitting quietly and reading"],

  // Inference / comprehension scenes
  ["scenes/chocolate_cake_mess.png", "child with chocolate on hands after eating cake quickly"],
  ["scenes/raincoat_umbrella.png", "child wearing raincoat and holding umbrella near rainy window"],
  ["scenes/broken_glass_broom.png", "adult safely sweeping broken glass with broom, child friendly scene"],
  ["scenes/lost_teddy.png", "child looking under bed for a missing teddy bear"],
  ["scenes/plant_wilting.png", "plant looking dry and wilted beside an empty watering can"],
  ["scenes/classroom_busy.png", "busy classroom with children reading, writing, and building"],
  ["scenes/boy_approaching_gate.png", "boy walking closer to a garden gate"],
  ["scenes/girl_locating_book.png", "girl searching and finding a book on a shelf"],
  ["scenes/team_building_blocks.png", "children working together to build a tower with blocks"],
  ["scenes/birdhouse_retry.png", "child rebuilding a birdhouse after first attempt fell apart"]
];

const basePrompt = `
Premium children's literacy assessment illustration.

Art direction:
- consistent cozy storybook game style
- soft 3D clay-like characters and objects
- warm classroom-friendly colors
- polished educational app quality
- simple clear composition
- expressive but not exaggerated
- clean background
- soft lighting and depth
- no text
- no letters
- no numbers
- no speech bubbles
- no scary details
- suitable for kindergarten to grade 3
`;

async function generateOne(path, description, index, total) {
  const fullPath = `public/images/${path}`;

  if (fs.existsSync(fullPath)) {
    console.log(`[${index}/${total}] Already exists, skipping: ${path}`);
    return;
  }

  fs.mkdirSync(fullPath.split("/").slice(0, -1).join("/"), {
    recursive: true
  });

  console.log(`[${index}/${total}] Generating: ${path}`);

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: `${basePrompt}\nScene: ${description}`,
    size: "1024x1024",
    quality: "low"
  });

  const buffer = Buffer.from(result.data[0].b64_json, "base64");
  fs.writeFileSync(fullPath, buffer);

  console.log(`[${index}/${total}] Saved: ${path}`);
}

async function main() {
  console.log("Starting visual pack generation...");
  console.log("Total images:", jobs.length);

  for (let i = 0; i < jobs.length; i++) {
    const [path, description] = jobs[i];

    try {
      await generateOne(path, description, i + 1, jobs.length);
    } catch (error) {
      console.error("Failed:", path);
      console.error(error.message);
    }
  }

  console.log("Visual pack generation complete.");
}

main();
