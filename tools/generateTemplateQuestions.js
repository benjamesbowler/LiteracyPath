import fs from "fs";

const questions = [];

function add(q) {
  questions.push({
    id: q.id,
    grade: q.grade,
    skill: q.skill,
    difficulty: q.difficulty,
    passage: q.passage || "",
    question: q.question,
    image: q.image || "",
    imagePath: q.imagePath || "",
    questionType: q.questionType || "multiple_choice",
    choices: q.choices,
    answer: q.answer
  });
}

const initialSounds = [
  { sound: "/f/", answer: "fish", choices: ["fish", "sun", "van", "dog"] },
  { sound: "/m/", answer: "moon", choices: ["moon", "fish", "cake", "run"] },
  { sound: "/b/", answer: "bat", choices: ["bat", "cat", "sun", "fish"] },
  { sound: "/s/", answer: "sun", choices: ["sun", "dog", "map", "pen"] },
  { sound: "/d/", answer: "dog", choices: ["dog", "cat", "fish", "sun"] }
];

initialSounds.forEach((item, index) => {
  add({
    id: `template_initial_${index + 1}`,
    grade: "K",
    skill: "initial sounds",
    difficulty: 1,
    question: `Which word begins with the ${item.sound} sound?`,
    choices: item.choices,
    answer: item.answer
  });
});

const finalSounds = [
  { sound: "/t/", answer: "mat", choices: ["mat", "man", "map", "mad"] },
  { sound: "/g/", answer: "dog", choices: ["dog", "dot", "dock", "don"] },
  { sound: "/p/", answer: "cap", choices: ["cap", "cat", "can", "cab"] },
  { sound: "/n/", answer: "sun", choices: ["sun", "sup", "sut", "sub"] }
];

finalSounds.forEach((item, index) => {
  add({
    id: `template_final_${index + 1}`,
    grade: "K",
    skill: "final sounds",
    difficulty: 1,
    question: `Which word ends with the ${item.sound} sound?`,
    choices: item.choices,
    answer: item.answer
  });
});

const plurals = [
  { singular: "cat", answer: "cats", choices: ["cats", "cat", "caties", "cates"], difficulty: 2 },
  { singular: "baby", answer: "babies", choices: ["babies", "babys", "baby", "babyes"], difficulty: 3 },
  { singular: "knife", answer: "knives", choices: ["knives", "knifes", "knife", "knive"], difficulty: 4 },
  { singular: "child", answer: "children", choices: ["children", "childs", "childes", "childrens"], difficulty: 4 },
  { singular: "box", answer: "boxes", choices: ["boxes", "boxs", "box", "boxies"], difficulty: 3 }
];

plurals.forEach((item, index) => {
  add({
    id: `template_plural_${index + 1}`,
    grade: "1",
    skill: "plurals",
    difficulty: item.difficulty,
    question: `What is the plural of ${item.singular}?`,
    choices: item.choices,
    answer: item.answer
  });
});

const prefixes = [
  { word: "unhappy", answer: "not happy", choices: ["not happy", "very happy", "happy again", "full of happy"] },
  { word: "reread", answer: "read again", choices: ["read again", "stop reading", "read badly", "read loudly"] },
  { word: "unfair", answer: "not fair", choices: ["not fair", "very fair", "fair again", "full of fair"] },
  { word: "replay", answer: "play again", choices: ["play again", "stop playing", "play badly", "never play"] }
];

prefixes.forEach((item, index) => {
  add({
    id: `template_prefix_${index + 1}`,
    grade: "2",
    skill: "prefixes",
    difficulty: 3,
    question: `What does ${item.word} mean?`,
    choices: item.choices,
    answer: item.answer
  });
});

const prepositions = [
  {
    id: "template_prep_1",
    imagePath: "/images/prepositions/cat_in_box.png",
    question: "Where is the cat?",
    answer: "in the box",
    choices: ["in the box", "under the box", "beside the box", "behind the box"]
  },
  {
    id: "template_prep_2",
    imagePath: "/images/prepositions/dog_under_table.png",
    question: "Where is the dog?",
    answer: "under the table",
    choices: ["under the table", "on the table", "beside the table", "behind the table"]
  },
  {
    id: "template_prep_3",
    imagePath: "/images/prepositions/ball_on_chair.png",
    question: "Where is the ball?",
    answer: "on the chair",
    choices: ["on the chair", "under the chair", "behind the chair", "beside the chair"]
  }
];

prepositions.forEach((item, index) => {
  add({
    id: item.id,
    grade: "K",
    skill: "prepositions",
    difficulty: 1,
    questionType: "image_choice",
    imagePath: item.imagePath,
    question: item.question,
    choices: item.choices,
    answer: item.answer
  });
});

fs.writeFileSync(
  "src/data/templateQuestions.js",
  `export const templateQuestions = ${JSON.stringify(questions, null, 2)};\n`
);

console.log("Template questions created:", questions.length);
