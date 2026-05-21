import fs from "fs";

const files = [
  ["src/questions.js", "questions"],
  ["src/data/generatedQuestions.js", "generatedQuestions"],
  ["src/data/templateQuestions.js", "templateQuestions"],
  ["src/data/templateExpansion.js", "templateExpansion"],
  ["src/data/templateExpansion2.js", "templateExpansion2"],
  ["src/data/templateExpansion3.js", "templateExpansion3"],
  ["src/data/templateExpansion4.js", "templateExpansion4"],
  ["src/data/templateExpansion5.js", "templateExpansion5"],
  ["src/data/templateExpansion6.js", "templateExpansion6"]
];

async function loadModule(path) {
  return await import("../" + path + "?cacheBust=" + Date.now());
}

function isBad(q) {
  const text = [
    q.question,
    q.skill,
    q.passage,
    ...(q.choices || [])
  ].join(" ").toLowerCase();

  const middleSound =
    text.includes("middle sound") ||
    text.includes("middle vowel") ||
    text.includes("same middle");

  const hasSunSon =
    text.includes("sun") &&
    text.includes("son");

  return middleSound && hasSunSon;
}

let totalRemoved = 0;

for (const [file, exportName] of files) {
  if (!fs.existsSync(file)) continue;

  const mod = await loadModule(file);
  const list = mod[exportName];

  if (!Array.isArray(list)) continue;

  const cleaned = list.filter(q => !isBad(q));
  const removed = list.length - cleaned.length;

  totalRemoved += removed;

  fs.writeFileSync(
    file,
    `export const ${exportName} = ${JSON.stringify(cleaned, null, 2)};\n`
  );

  console.log(`${file}: removed ${removed}`);
}

console.log("Total removed:", totalRemoved);
