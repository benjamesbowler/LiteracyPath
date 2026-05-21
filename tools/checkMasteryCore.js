import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";

console.log("Mastery core count:", masteryCoreQuestions.length);
console.log(masteryCoreQuestions.map(q => `${q.id} | ${q.skill}`).join("\n"));
