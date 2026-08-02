#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingWorldExpansionBooks } from "../src/data/guidedReadingWorldExpansionBooks.js";
import { guidedReadingBookContentHash } from "./guidedReadingQuestionAuditLib.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quizDirectory = path.join(repositoryRoot, "public", "guided-reading", "quizzes");

// Opening, failed-attempt and earned-resolution pages are editorial evidence,
// not similarity guesses. Keep them explicit when a manuscript changes.
const PAGE_ANCHORS = Object.freeze({
  "meadow-pals-26-muddys-cool-wall": [1, 3, 7],
  "meadow-pals-27-splashys-reed-boat": [1, 5, 7],
  "meadow-pals-28-woollys-wool-cloud": [1, 3, 8],
  "meadow-pals-29-shys-pond-rings": [1, 4, 7],
  "meadow-pals-30-cuddlys-yarn-ball": [1, 4, 7],
  "meadow-pals-31-bouncys-hay-lift": [1, 4, 8],
  "meadow-pals-32-tinys-giant-berry": [1, 5, 8],
  "meadow-pals-33-braves-beetle-bridge": [1, 4, 7],
  "meadow-pals-34-grumpys-sun-clock": [1, 5, 8],
  "meadow-pals-35-gigglys-round-wheel": [1, 4, 8],
  "dino-pals-21-fancys-moonleaf-arch": [1, 3, 8],
  "dino-pals-22-shys-sinking-path": [1, 4, 8],
  "dino-pals-23-flappys-fern-delivery": [1, 3, 8],
  "dino-pals-24-clumsys-steady-bowls": [1, 3, 8],
  "dino-pals-25-sneezys-seed-cloud": [1, 4, 8],
  "dino-pals-26-sunnys-two-part-picnic": [1, 4, 8],
  "dino-pals-27-bossys-three-paths": [1, 3, 8],
  "dino-pals-28-honkys-echo-tunnel": [1, 4, 8],
  "dino-pals-29-cheekys-shadow-show": [1, 4, 8],
  "dino-pals-30-dozy-stops-the-melon": [1, 5, 8],
  "moonwood-tales-c-26": [1, 3, 9],
  "moonwood-tales-c-27": [1, 3, 9],
  "moonwood-tales-c-28": [1, 4, 9],
  "moonwood-tales-c-29": [1, 5, 9],
  "moonwood-tales-c-30": [1, 4, 8],
  "moonwood-tales-c-31": [1, 4, 8],
  "moonwood-tales-c-32": [1, 4, 9],
  "moonwood-tales-c-33": [1, 4, 9],
  "moonwood-tales-c-34": [1, 4, 9],
  "moonwood-tales-c-35": [1, 4, 9]
});

function question(book, index, prompt, answerPage, distractorPages, skill, rationale = "") {
  const answer = book.pages[answerPage - 1].text;
  return {
    id: `${book.id}-q${index}`,
    prompt,
    choices: [answer, ...distractorPages.map(page => book.pages[page - 1].text)],
    answer,
    kind: "text",
    skill,
    ...(rationale ? { rationale } : {}),
    evidencePage: answerPage,
    evidenceText: answer
  };
}

fs.mkdirSync(quizDirectory, { recursive: true });
for (const book of guidedReadingWorldExpansionBooks) {
  const [openingPage, failurePage, resolutionPage] = PAGE_ANCHORS[book.id] || [];
  if (!openingPage || !failurePage || !resolutionPage) throw new Error(`${book.id}: missing editorial quiz anchors`);
  const simple = book.level === "A";
  const advanced = book.level === "C";
  const opening = book.pages[openingPage - 1].text;
  const failure = book.pages[failurePage - 1].text;
  const resolution = book.pages[resolutionPage - 1].text;
  const questions = [
    question(
      book,
      1,
      simple
        ? `What happens first in ${book.title}?`
        : advanced
          ? `Which event introduces the situation in ${book.title}?`
          : `Which event begins ${book.title}?`,
      openingPage,
      [failurePage, resolutionPage],
      "sequence"
    ),
    question(
      book,
      2,
      simple
        ? `What goes wrong in ${book.title}?`
        : advanced
          ? `Which event shows that the first attempt fails in ${book.title}?`
          : `Which event shows the first plan fails in ${book.title}?`,
      failurePage,
      [openingPage, resolutionPage],
      "problem_solution",
      `${failure} This shows that the first attempt does not solve the central problem introduced by ${opening}`
    ),
    question(
      book,
      3,
      simple
        ? `What solves the problem in ${book.title}?`
        : advanced
          ? `Which event resolves the central problem in ${book.title}?`
          : `Which event solves the problem in ${book.title}?`,
      resolutionPage,
      [openingPage, failurePage],
      "outcome",
      `${resolution} This event shows how the central problem is resolved after ${failure}`
    )
  ];
  const quiz = {
    schemaVersion: 2,
    quizVersion: "2026-08-01.1",
    bookId: book.id,
    contentHash: guidedReadingBookContentHash(book),
    questions
  };
  fs.writeFileSync(path.join(quizDirectory, `${book.id}.json`), `${JSON.stringify(quiz, null, 2)}\n`);
}

console.log(`Generated ${guidedReadingWorldExpansionBooks.length} Story-Bible-aligned expansion quizzes.`);
