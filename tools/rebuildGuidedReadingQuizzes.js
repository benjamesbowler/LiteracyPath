#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { guidedReadingBookContentHash } from "./guidedReadingQuestionAuditLib.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quizDirectory = path.join(repoRoot, "public", "guided-reading", "quizzes");
const QUIZ_VERSION = "2026-08-01.1";

// Page anchors are editorial decisions, not similarity guesses. They identify
// the exact opening/problem/resolution evidence that the Story Bible names.
// Keeping them explicit prevents a nearby repeated character name from being
// mistaken for the causal turn during future regeneration.
export const FICTION_PAGE_ANCHORS = Object.freeze({
  "bob-and-nan-01": [1, 2, 5],
  "bob-and-nan-02-park": [1, 2, 7],
  "bob-and-nan-03-fluff": [1, 5, 6],
  "bob-and-nan-04-beach": [1, 5, 7],
  "bob-and-nan-05-school": [1, 4, 7],
  "bob-and-nan-06-zoo": [1, 5, 8],
  "bob-and-nan-07-birthday": [1, 3, 5],
  "bob-and-nan-08-sick": [1, 4, 7],
  "bob-and-nan-09-read": [1, 2, 5],
  "bob-and-nan-10-vet": [1, 2, 8],
  "james-and-anna-01-space": [1, 7, 14],
  "james-and-anna-02-chips": [1, 7, 12],
  "james-and-anna-03-shopping": [1, 8, 11],
  "james-and-anna-04-dentist": [1, 7, 10],
  "james-and-anna-05-tree-house": [1, 9, 11],
  "ja-b-06": [1, 8, 10],
  "ja-b-07": [1, 9, 12],
  "ja-b-08": [1, 7, 12],
  "ja-b-09": [1, 3, 10],
  "ja-b-10": [1, 10, 14],
  "ab-c-01": [1, 6, 13],
  "ab-c-02": [1, 6, 11],
  "ab-c-03": [1, 8, 12],
  "ab-c-04": [1, 10, 14],
  "ab-c-05": [1, 5, 14],
  "ab-c-06": [1, 5, 11],
  "ab-c-07": [1, 5, 9],
  "ab-c-08": [1, 7, 8],
  "ab-c-09": [1, 4, 13],
  "ab-c-10": [1, 7, 13],
  "dino-pals-01-chompys-big-lunch": [1, 3, 7],
  "dino-pals-02-sunnys-rainy-day": [1, 4, 7],
  "dino-pals-03-dozy-wont-wake-up": [1, 4, 8],
  "dino-pals-04-grumpy-needs-help": [1, 5, 7],
  "dino-pals-05-bossy-makes-a-plan": [1, 6, 8],
  "dino-pals-06-bouncy-bumps-into-everything": [1, 6, 8],
  "dino-pals-07-wigglys-messy-day": [1, 5, 8],
  "dino-pals-08-zippy-slows-down": [1, 4, 8],
  "dino-pals-09-honkys-inside-voice": [1, 6, 8],
  "dino-pals-10-cheekys-prank-goes-wrong": [1, 6, 8],
  "dino-pals-11-shys-secret-gift": [1, 6, 12],
  "dino-pals-12-fancys-bad-day": [1, 7, 11],
  "dino-pals-13-clumsy-to-the-rescue": [1, 5, 8],
  "dino-pals-14-what-is-flappy": [1, 6, 8],
  "dino-pals-15-sneezy-and-the-waterfall": [1, 6, 12],
  "dino-pals-16-chompy-and-grumpys-day-out": [1, 7, 9],
  "dino-pals-17-the-sunny-hollow-games": [1, 6, 8],
  "dino-pals-18-dozys-wonderful-dream": [1, 7, 11],
  "dino-pals-19-zippys-race": [1, 4, 12],
  "dino-pals-20-the-big-storm": [1, 3, 10],
  "meadow-pals-01-muddy-has-a-bath": [1, 6, 9],
  "meadow-pals-02-woolly-cant-sleep": [1, 6, 9],
  "meadow-pals-03-clucky-lays-an-egg": [1, 5, 8],
  "meadow-pals-04-bouncy-wont-stop": [1, 5, 7],
  "meadow-pals-05-grumpy-gets-a-surprise": [1, 6, 9],
  "meadow-pals-06-sleepy-cant-wake-up": [1, 6, 9],
  "meadow-pals-07-noisy-tries-to-be-quiet": [1, 4, 10],
  "meadow-pals-08-tiny-is-very-small": [1, 4, 9],
  "meadow-pals-09-shy-comes-out-to-play": [1, 5, 9],
  "meadow-pals-10-giggly-has-the-hiccups": [1, 5, 9],
  "meadow-pals-11-brave-climbs-the-hay-bale": [1, 6, 8],
  "meadow-pals-12-hungry-eats-everything": [1, 3, 7],
  "meadow-pals-13-splashy-finds-a-puddle": [1, 8, 9],
  "meadow-pals-14-speedy-slows-down": [1, 7, 9],
  "meadow-pals-15-cuddly-wants-a-hug": [1, 5, 8],
  "meadow-pals-16-muddy-and-splashy-make-a-mess": [1, 7, 9],
  "meadow-pals-17-bouncy-and-speedy-have-a-race": [1, 8, 10],
  "meadow-pals-18-noisy-wakes-everyone-up": [1, 3, 9],
  "meadow-pals-19-tiny-and-brave-go-on-an-adventure": [1, 6, 9],
  "meadow-pals-20-shy-and-cuddly-find-each-other": [1, 4, 10],
  "meadow-pals-21-woolly-and-grumpy-are-stuck": [1, 6, 9],
  "meadow-pals-22-sleepys-big-dream": [1, 7, 8],
  "meadow-pals-23-giggly-and-clucky-bake-a-cake": [1, 7, 10],
  "meadow-pals-24-grumpys-secret": [1, 5, 10],
  "meadow-pals-25-the-big-farm-party": [1, 9, 13],
  "moonwood-tales-c-01": [1, 4, 10],
  "moonwood-tales-c-02": [1, 4, 12],
  "moonwood-tales-c-03": [1, 4, 10],
  "moonwood-tales-c-04": [1, 8, 12],
  "moonwood-tales-c-05": [1, 3, 9],
  "moonwood-tales-c-06": [1, 5, 12],
  "moonwood-tales-c-07": [1, 5, 12],
  "moonwood-tales-c-08": [1, 7, 9],
  "moonwood-tales-c-09": [1, 9, 14],
  "moonwood-tales-c-10": [1, 5, 13],
  "moonwood-tales-c-11": [1, 11, 12],
  "moonwood-tales-c-12": [1, 7, 10],
  "moonwood-tales-c-13": [1, 6, 11],
  "moonwood-tales-c-14": [1, 6, 10],
  "moonwood-tales-c-15": [1, 4, 11],
  "moonwood-tales-c-16": [1, 5, 12],
  "moonwood-tales-c-17": [1, 7, 12],
  "moonwood-tales-c-18": [1, 6, 9],
  "moonwood-tales-c-19": [1, 6, 12],
  "moonwood-tales-c-20": [1, 6, 12],
  "moonwood-tales-c-21": [1, 4, 12],
  "moonwood-tales-c-22": [1, 4, 12],
  "moonwood-tales-c-23": [1, 2, 12],
  "moonwood-tales-c-24": [1, 6, 11],
  "moonwood-tales-c-25": [1, 8, 11]
});

const VERB_PATTERN = new RegExp(
  "^(.*?)(?:\\s+)(is|are|was|were|has|have|had|can|cannot|can't|could|may|might|should|will|does|do|did|need(?:s|ed)?|use(?:s|d)?|help(?:s|ed)?|provide(?:s|d)?|make(?:s|d)?|become(?:s)?|grow(?:s|n)?|move(?:s|d)?|travel(?:s|led)?|turn(?:s|ed)?|bring(?:s)?|build(?:s|built)?|collect(?:s|ed)?|keep(?:s|kept)?|protect(?:s|ed)?|support(?:s|ed)?|hold(?:s|held)?|contain(?:s|ed)?|include(?:s|d)?|show(?:s|ed)?|form(?:s|ed)?|appear(?:s|ed)?|live(?:s|d)?|work(?:s|ed)?|eat(?:s|en)?|drink(?:s|drank)?|find(?:s|found)?|gather(?:s|ed)?|carry|carries|carried|open(?:s|ed)?|close(?:s|d)?|reach(?:es|ed)?|start(?:s|ed)?|stop(?:s|ped)?|run(?:s|ran)?|walk(?:s|ed)?|fly|flies|flew|swim(?:s|swam)?|rest(?:s|ed)?|wake(?:s|woke)?|want(?:s|ed)?|try|tries|tried|see(?:s|saw)?|hear(?:s|heard)?|feel(?:s|felt)?|look(?:s|ed)?|say|says|said|call(?:s|ed)?|share(?:s|d)?|check(?:s|ed)?|follow(?:s|ed)?|return(?:s|ed)?|push(?:es|ed)?|pull(?:s|ed)?|read(?:s)?|write(?:s|wrote)?|learn(?:s|ed)?|play(?:s|ed)?|sit(?:s|sat)?|stand(?:s|stood)?|fall(?:s|fell)?|rise(?:s|rose)?|shine(?:s|shone)?|warm(?:s|ed)?|brighten(?:s|ed)?|drive(?:s|drove)?|cut(?:s)?|measure(?:s|d)?|treat(?:s|ed)?|fight(?:s|fought)?|prepare(?:s|d)?|respond(?:s|ed)?|lay(?:s|laid)?|breathe(?:s|d)?|absorb(?:s|ed)?|reflect(?:s|ed)?|rotate(?:s|d)?|repeat(?:s|ed)?|change(?:s|d)?|describe(?:s|d)?|detect(?:s|ed)?|anchor(?:s|ed)?|occur(?:s|red)?|exist(?:s|ed)?|enter(?:s|ed)?|come(?:s|came)?|stick(?:s|stuck)?|balance(?:s|d)?|hatch(?:es|ed)?)(?:\\s+)(.+)$",
  "i"
);

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "before", "by", "can", "did", "do", "does",
  "for", "from", "has", "have", "he", "her", "him", "his", "in", "is", "it", "its", "of", "on", "or",
  "she", "that", "the", "their", "them", "they", "this", "to", "was", "we", "were", "with", "you"
]);

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value = "") {
  return normalize(value)
    .split(" ")
    .filter(token => token && !STOP_WORDS.has(token));
}

function firstSentence(text = "") {
  const sentence = String(text).trim().match(/^.*?[.!?](?=\s|$)/)?.[0] || String(text).trim();
  return sentence.replace(/^[“"]|[”"]$/g, "").trim();
}

function statementSubject(text = "") {
  const sentence = firstSentence(text).replace(/^[^a-z0-9]+/i, "");
  const match = sentence.match(VERB_PATTERN);
  if (!match) return "";
  return match[1]
    .replace(/^as a baby\s+/i, "")
    .replace(/^in many temperate places\s+/i, "")
    .replace(/^(?:at|after|before|by|during|in|inside|near|on|outside|through|under|when|while)\b[^,]*,\s*/i, "")
    .replace(/^(?:then|suddenly|soon|today|tomorrow|later|finally)\s+/i, "")
    .replace(/\s+(?:also|first|mostly|often|sometimes|usually)$/i, "")
    .trim();
}

function lowerInitial(value = "") {
  if (!value) return value;
  if (/^(?:I|Earth|Moonwood|Sun|Moon|Mars|Saturn|Bob|Nan|James|Anna|Aiden|Betty|Pip|Stone|Fern|Wren|Luna|Burrow|Dewdrop|Flint|Glimmer|Spark|Chompy|Sunny|Dozy|Grumpy|Bossy|Bouncy|Wiggly|Zippy|Honky|Fancy|Clumsy|Sneezy|Flappy|Shy|Muddy|Splashy|Clucky|Cuddly|Speedy|Tiny|Brave|Woolly)\b/.test(value)) {
    return value;
  }
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function closestLengthDistractors(answerIndex, pages, excludedIndexes = new Set()) {
  const answer = pages[answerIndex].text;
  return pages
    .map((page, index) => ({ index, text: page.text, distance: Math.abs(page.text.length - answer.length) }))
    .filter(item => item.index !== answerIndex && !excludedIndexes.has(item.index) && normalize(item.text) !== normalize(answer))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .slice(0, 2)
    .map(item => item.text);
}

function conceptualIndex(book, field, excludedIndexes = new Set()) {
  const conceptTokens = new Set(tokens(book.storyBibleReview?.[field] || ""));
  const candidates = book.pages
    .map((page, index) => {
      const pageTokens = new Set(tokens(page.text));
      const overlap = [...conceptTokens].filter(token => pageTokens.has(token)).length;
      return { index, overlap };
    })
    .filter(item => !excludedIndexes.has(item.index))
    .sort((a, b) => b.overlap - a.overlap || a.index - b.index);
  return candidates[0]?.index ?? 0;
}

function makeQuestion(book, index, {
  prompt,
  answerIndex,
  answerText = "",
  choiceTexts = [],
  skill,
  rationale = "",
  distractorIndexes = []
}) {
  const answer = answerText || book.pages[answerIndex].text;
  const indexedDistractors = distractorIndexes
    .filter(pageIndex => Number.isInteger(pageIndex) && pageIndex !== answerIndex)
    .map(pageIndex => book.pages[pageIndex]?.text)
    .filter(Boolean)
    .filter(text => normalize(text) !== normalize(answer));
  const distractors = [...new Set(indexedDistractors)];
  if (distractors.length < 2) {
    distractors.push(...closestLengthDistractors(answerIndex, book.pages, new Set(distractorIndexes)));
  }
  const choices = choiceTexts.length
    ? [...new Set(choiceTexts)]
    : [...new Set([answer, ...distractors])].slice(0, 3);
  if (choices.length !== 3) throw new Error(`${book.id}: could not build three distinct choices for question ${index + 1}`);

  return {
    id: `${book.id}-q${index + 1}`,
    prompt,
    choices,
    answer,
    kind: tokens(answer).length === 1 ? "word" : "text",
    skill,
    ...(rationale ? { rationale } : {}),
    evidencePage: answerIndex + 1,
    evidenceText: book.pages[answerIndex].text
  };
}

function fictionQuestions(book) {
  const editorialAnchors = FICTION_PAGE_ANCHORS[book.id]?.map(pageNumber => pageNumber - 1);
  if (editorialAnchors?.some(index => !book.pages[index])) {
    throw new Error(`${book.id}: editorial quiz anchor is outside its ${book.pages.length} active pages (${editorialAnchors.map(index => index + 1).join(", ")})`);
  }
  const openingIndex = editorialAnchors?.[0] ?? 0;
  const failureIndex = editorialAnchors?.[1] ?? conceptualIndex(book, "failedAttempt", new Set([openingIndex, book.pages.length - 1]));
  let resolutionIndex = editorialAnchors?.[2] ?? conceptualIndex(book, "resolution", new Set([openingIndex, failureIndex]));
  if (!editorialAnchors && resolutionIndex <= failureIndex && book.pages.length - 1 !== failureIndex) resolutionIndex = book.pages.length - 1;

  const simple = book.level === "A";
  const advanced = book.level === "C";
  const questions = [
    makeQuestion(book, 0, {
      prompt: simple
        ? `What happens first in ${book.title}?`
        : advanced
          ? `Which event introduces the situation in ${book.title}?`
          : `Which event begins ${book.title}?`,
      answerIndex: openingIndex,
      skill: "sequence",
      distractorIndexes: [failureIndex, resolutionIndex]
    }),
    makeQuestion(book, 1, {
      prompt: book.id === "bob-and-nan-06-zoo"
        ? "Which event helps Nan and Bob finish the hardest part of their zoo search?"
        : simple
        ? `What goes wrong in ${book.title}?`
        : advanced
          ? `Which event shows that the first attempt fails in ${book.title}?`
          : `Which event shows the first plan fails in ${book.title}?`,
      answerIndex: failureIndex,
      skill: book.id === "bob-and-nan-06-zoo" ? "cause_effect" : "problem_solution",
      rationale: `${book.pages[failureIndex].text} This shows that the first attempt does not solve the central problem.`,
      distractorIndexes: [openingIndex, resolutionIndex]
    }),
    makeQuestion(book, 2, {
      prompt: simple
        ? `What happens at the end of ${book.title}?`
        : advanced
          ? `Which event resolves the central problem in ${book.title}?`
          : `Which event solves the problem in ${book.title}?`,
      answerIndex: resolutionIndex,
      skill: "outcome",
      rationale: `${book.pages[resolutionIndex].text} This event shows how the central problem is resolved.`,
      distractorIndexes: [openingIndex, failureIndex]
    })
  ];

  if (book.id === "bob-and-nan-06-zoo") {
    questions[0] = makeQuestion(book, 0, {
      prompt: "Which animal does Bob spot first after checking the zoo card?",
      answerIndex: 1,
      answerText: "a big cat",
      choiceTexts: ["a big cat", "a red bird", "the big fish"],
      skill: "sequence"
    });
  }
  if (book.id === "bob-and-nan-08-sick") {
    questions[2] = makeQuestion(book, 2, {
      prompt: "How do Bob and Nan feel after they sip and rest?",
      answerIndex: 6,
      answerText: "well",
      choiceTexts: ["well", "ill", "tired"],
      skill: "outcome",
      rationale: "Page 7 says Bob and Nan feel well, which shows that sipping and resting helped them recover."
    });
  }
  if (book.id === "bob-and-nan-09-read") {
    questions[2] = makeQuestion(book, 2, {
      prompt: "What does Bob read after he blends cat?",
      answerIndex: 4,
      answerText: "one sentence",
      choiceTexts: ["one sentence", "one letter", "one book"],
      skill: "outcome",
      rationale: "Page 5 says Bob reads one sentence, which shows that Nan's blending help worked."
    });
  }
  return questions;
}

function nonfictionMiddleIndex(book) {
  const lastIndex = book.pages.length - 1;
  const firstSubject = normalize(statementSubject(book.pages[0]?.text));
  const lastSubject = normalize(statementSubject(book.pages[lastIndex]?.text));
  const midpoint = (lastIndex - 1) / 2;
  const candidates = book.pages
    .map((page, index) => ({
      index,
      subject: normalize(statementSubject(page.text)),
      distance: Math.abs(index - midpoint)
    }))
    .filter(item => item.index > 0 && item.index < lastIndex)
    .sort((a, b) => {
      const aDistinct = Number(Boolean(a.subject && a.subject !== firstSubject && a.subject !== lastSubject));
      const bDistinct = Number(Boolean(b.subject && b.subject !== firstSubject && b.subject !== lastSubject));
      return bDistinct - aDistinct || a.distance - b.distance || a.index - b.index;
    });
  return candidates[0]?.index ?? Math.max(1, Math.floor(lastIndex / 2));
}

function detailPrompt(book, pageIndex, position) {
  const subject = statementSubject(book.pages[pageIndex].text);
  const promptTitle = String(book.title).replace(/[?!.]+$/, "");
  if (subject && !/^(?:i|it|this|that|they|these|those|he|she|we)(?:\s|$)/i.test(subject)) {
    return book.level === "A"
      ? `What do we learn about ${lowerInitial(subject)}?`
      : `Which fact about ${lowerInitial(subject)} is given in ${promptTitle}?`;
  }
  return position === "start"
    ? `Which fact is introduced first in ${promptTitle}?`
    : `Which fact is explained next in ${promptTitle}?`;
}

function classifyNonfictionSkill(text = "") {
  if (/\b(?:because|so|therefore|makes?|causes?|creates?|results?|when)\b/i.test(text)) return "cause_effect";
  if (/\b(?:helps?|uses?|needs?|provides?|protects?|supports?|for|to)\b/i.test(text)) return "function";
  if (/\b(?:first|next|then|after|before|becomes?|develops?|germinates?|grows?)\b/i.test(text)) return "sequence";
  if (/\b(?:different|both|while|than|compare|larger|smaller|more|less)\b/i.test(text)) return "comparison";
  if (/\b(?:called|means|describes?)\b/i.test(text)) return "vocabulary";
  return "key_detail";
}

function nonfictionQuestions(book) {
  const openingIndex = book.id === "first-facts-a-08-animals-in-the-ocean" ? 1 : 0;
  const middleIndex = nonfictionMiddleIndex(book);
  const synthesisIndex = book.pages.length - 1;
  const middleSkill = classifyNonfictionSkill(book.pages[middleIndex].text);
  const questions = [
    makeQuestion(book, 0, {
      prompt: detailPrompt(book, openingIndex, "start"),
      answerIndex: openingIndex,
      skill: "key_detail",
      distractorIndexes: [middleIndex, synthesisIndex]
    }),
    makeQuestion(book, 1, {
      prompt: detailPrompt(book, middleIndex, "middle"),
      answerIndex: middleIndex,
      skill: middleSkill,
      distractorIndexes: [openingIndex, synthesisIndex]
    }),
    makeQuestion(book, 2, {
      prompt: book.level === "A"
        ? `What is the big idea in ${book.title}?`
        : `Which statement gives the main idea of ${book.title}?`,
      answerIndex: synthesisIndex,
      skill: "main_idea",
      rationale: `${book.pages[synthesisIndex].text} This final statement gathers the book's details into its main idea.`,
      distractorIndexes: [openingIndex, middleIndex]
    })
  ];

  if (book.id === "first-facts-level-a-03-big-and-little") {
    questions[0] = makeQuestion(book, 0, {
      prompt: "Which animals are shown on the first page?",
      answerIndex: 0,
      answerText: "dog and bug",
      choiceTexts: ["dog and bug", "fish and crab", "hat and cap"],
      skill: "key_detail"
    });
    questions[1] = makeQuestion(book, 1, {
      prompt: "Which vehicles are compared in Big and Little?",
      answerIndex: 2,
      answerText: "bus and car",
      choiceTexts: ["bus and car", "tree and seed", "sun and moon"],
      skill: "comparison"
    });
  }
  return questions;
}

fs.mkdirSync(quizDirectory, { recursive: true });
for (const book of guidedReadingBooks) {
  const questions = book.type === "fiction" ? fictionQuestions(book) : nonfictionQuestions(book);
  const quiz = {
    schemaVersion: 2,
    quizVersion: QUIZ_VERSION,
    bookId: book.id,
    contentHash: guidedReadingBookContentHash(book),
    questions
  };
  fs.writeFileSync(path.join(quizDirectory, `${book.id}.json`), `${JSON.stringify(quiz, null, 2)}\n`);
}

console.log(`Rebuilt ${guidedReadingBooks.length} Guided Reading quiz files from approved Story Bible manuscripts.`);
