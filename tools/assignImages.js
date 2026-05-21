import fs from "fs";
import { generatedQuestions } from "../src/data/generatedQuestions.js";

const imageMap = {
  apple: "/images/vocabulary/apple.png",
  bicycle: "/images/vocabulary/bicycle.png",
  bike: "/images/vocabulary/bicycle.png",
  umbrella: "/images/vocabulary/umbrella.png",
  backpack: "/images/vocabulary/backpack.png",
  winter: "/images/vocabulary/winter.png",
  dock: "/images/vocabulary/dock.png",
  friends: "/images/vocabulary/friends.png",
  barn: "/images/vocabulary/barn.png",
  cake: "/images/vocabulary/cake.png",
  book: "/images/vocabulary/book.png",

  inside: "/images/prepositions/goat_inside_barn.png",
  outside: "/images/prepositions/duck_outside_pond.png",
  under: "/images/prepositions/dog_under_table.png",
  beside: "/images/prepositions/rabbit_beside_basket.png",
  behind: "/images/prepositions/bear_behind_tree.png",
  between: "/images/prepositions/cup_between_books.png",
  above: "/images/prepositions/bird_above_tree.png",
  near: "/images/prepositions/shoes_near_door.png",

  happy: "/images/emotions/happy_child.png",
  sad: "/images/emotions/sad_child.png",
  afraid: "/images/emotions/afraid_child.png",
  surprised: "/images/emotions/surprised_child.png",
  proud: "/images/emotions/proud_child.png",
  tired: "/images/emotions/tired_child.png",
  excited: "/images/emotions/excited_child.png",
  confused: "/images/emotions/confused_child.png",
  angry: "/images/emotions/angry_child.png",
  calm: "/images/emotions/calm_child.png"
};

function shouldSkipImage(q) {
  const skill = String(q.skill || "").toLowerCase();

  const skip = [
    "phonics",
    "initial",
    "final",
    "rhyming",
    "spelling",
    "short vowel",
    "long vowel",
    "blend",
    "digraph"
  ];

  return skip.some(s => skill.includes(s));
}

function assignImage(q) {
  const fixed = { ...q };

  if (shouldSkipImage(q)) {
    delete fixed.image;
    delete fixed.imagePath;
    return fixed;
  }

  const searchable =
    [
      q.question,
      q.passage,
      ...(q.choices || [])
    ]
    .join(" ")
    .toLowerCase();

  for (const key of Object.keys(imageMap)) {
    if (searchable.includes(key)) {
      fixed.imagePath = imageMap[key];
      delete fixed.image;
      return fixed;
    }
  }

  return fixed;
}

const updated = generatedQuestions.map(assignImage);

fs.writeFileSync(
  "src/data/generatedQuestions.js",
  `export const generatedQuestions = ${JSON.stringify(updated, null, 2)};\n`
);

console.log("Assigned images to generated questions.");
