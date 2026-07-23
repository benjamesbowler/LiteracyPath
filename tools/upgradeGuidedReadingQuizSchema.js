#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import {
  answerIsSupportedByText,
  guidedReadingBookContentHash
} from "./guidedReadingQuestionAuditLib.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quizDirectory = path.join(repoRoot, "public", "guided-reading", "quizzes");

function normalizedWords(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .match(/[a-z0-9']+/g) || [];
}

function inferNonfictionSkill(prompt = "") {
  if (/\bwhy\b|\bwhat makes\b|\bwhat happens when\b/i.test(prompt)) return "cause_effect";
  if (/\bwhen\b|\bfirst\b|\bnext\b|\bafter\b|\bbefore\b/i.test(prompt)) return "sequence";
  if (/\bbig or (?:small|little)\b|\bhot or cold\b|\bwhich one\b/i.test(prompt)) return "comparison";
  if (/\bhelp\b|\bused? (?:for|to)\b|\bwhat (?:can|does|do)\b/i.test(prompt)) return "function";
  if (/\bbook say\b|\ball (?:pets|things|animals)\b|\bmain\b/i.test(prompt)) return "main_idea";
  return "key_detail";
}

function inferFictionSkill(prompt = "") {
  if (/\bwhy\b|\bbecause\b/i.test(prompt)) return "cause_effect";
  if (/\bfirst\b|\bnext\b|\bafter\b|\bbefore\b/i.test(prompt)) return "sequence";
  if (/\bend\b|\bfinally\b/i.test(prompt)) return "outcome";
  if (/\bwhere\b|\bsetting\b/i.test(prompt)) return "setting";
  return "character_action";
}

function inferEvidencePage(book, question) {
  const promptWords = new Set(normalizedWords(question.prompt));
  const ranked = (book.pages || []).map((page, index) => {
    const pageWords = new Set(normalizedWords(page.text));
    const promptOverlap = [...promptWords].filter(word => pageWords.has(word)).length;
    const answerSupported = answerIsSupportedByText(question.answer, page.text);
    return { index, page, promptOverlap, answerSupported };
  }).sort((a, b) =>
    Number(b.answerSupported) - Number(a.answerSupported) ||
    b.promptOverlap - a.promptOverlap ||
    a.index - b.index
  );

  const best = ranked[0];
  if (!best?.answerSupported) {
    throw new Error(`${book.id}: cannot infer evidence for answer "${question.answer}"`);
  }
  return { evidencePage: best.index + 1, evidenceText: best.page.text };
}

let updated = 0;
for (const book of guidedReadingBooks) {
  const filePath = path.join(quizDirectory, `${book.id}.json`);
  const current = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const questions = current.questions.map((question, index) => {
    const inferredEvidence = question.evidencePage && question.evidenceText
      ? { evidencePage: question.evidencePage, evidenceText: question.evidenceText }
      : inferEvidencePage(book, question);
    const answerWordCount = normalizedWords(question.answer).length;
    return {
      id: `${book.id}-q${index + 1}`,
      prompt: question.prompt,
      choices: question.choices,
      answer: question.answer,
      kind: answerWordCount === 1 ? "word" : "text",
      skill: question.skill || (book.type === "fiction"
        ? inferFictionSkill(question.prompt)
        : inferNonfictionSkill(question.prompt)),
      ...(String(question.rationale || "").trim() ? { rationale: question.rationale } : {}),
      ...(Array.isArray(question.supportingEvidence) && question.supportingEvidence.length
        ? { supportingEvidence: question.supportingEvidence }
        : {}),
      ...inferredEvidence
    };
  });

  const upgraded = {
    schemaVersion: 2,
    quizVersion: "2026-07-22.2",
    bookId: book.id,
    contentHash: guidedReadingBookContentHash(book),
    questions
  };
  fs.writeFileSync(filePath, `${JSON.stringify(upgraded, null, 2)}\n`);
  updated += 1;
}

console.log(`Upgraded ${updated} Guided Reading quiz files to schema v2.`);
