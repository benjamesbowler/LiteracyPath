import path from "node:path";

import { skillTree } from "../src/skillTree.js";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { storyQuests } from "../src/data/storyQuests.js";
import { loadAssessmentSkillBank } from "../src/data/loadAssessmentSkillBank.js";
import { mediaQaReviewRows } from "../src/data/generated/mediaQaReview.generated.js";
import { getMediaQaReviewId } from "../src/data/mediaQaReviewStatus.js";
import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = process.cwd();
const outItems = path.join(repoRoot, "src/data/generated/mediaQaReviewItems.generated.js");
const outDecisions = path.join(repoRoot, "src/data/generated/mediaQaReview.generated.js");
const hfwSkillIds = new Set(["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]);
const decisionById = new Map((mediaQaReviewRows || []).map(row => [row.reviewId || getMediaQaReviewId(row), row]));

function text(value = "") {
  return String(value ?? "").trim();
}

function normalizeStatus(status = "") {
  return ["pending", "approved", "quarantined"].includes(status) ? status : "pending";
}

function answerValue(value = "") {
  if (Array.isArray(value)) return value.map(answerValue).filter(Boolean).join(" | ");
  if (value && typeof value === "object") return value.value || value.label || value.text || value.word || value.answer || "";
  return value || "";
}

function imageFrom(value = {}) {
  if (!value || typeof value !== "object") return "";
  return text(value.imagePath || value.imageUrl || value.image || value.media?.imagePath || value.media?.imageUrl || value.media?.image || "");
}

function questionImageEntries(question = {}) {
  const entries = [];
  const primary = text(question.imagePath || question.imageUrl || question.image || question.primaryImage || question.questionImage || question.targetImagePath || question.targetImageUrl || question.targetImage || "");
  if (primary) entries.push({ imagePath: primary, imageRole: "question_image" });
  for (const field of ["answerOptions", "options", "choices", "imageCards"]) {
    if (!Array.isArray(question[field])) continue;
    for (const option of question[field]) {
      const imagePath = imageFrom(option);
      if (imagePath) entries.push({ imagePath, imageRole: field, targetWord: answerValue(option) });
    }
  }
  const seen = new Set();
  return entries.filter(entry => {
    const key = `${entry.imagePath}::${entry.imageRole}::${entry.targetWord || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildReviewItem(input = {}) {
  const reviewId = getMediaQaReviewId(input);
  const decision = decisionById.get(reviewId);
  return {
    reviewId,
    area: input.area || "assessment",
    skillId: input.skillId || "",
    displaySkillName: input.displaySkillName || input.skillId || "",
    questionId: input.questionId || "",
    bookId: input.bookId || "",
    pageId: input.pageId || "",
    pageNumber: input.pageNumber || "",
    bookTitle: input.bookTitle || "",
    level: input.level || "",
    phase: input.phase || "",
    targetWord: input.targetWord || "",
    imagePath: input.imagePath || "",
    imageRole: input.imageRole || "",
    text: input.text || "",
    answerChoices: input.answerChoices || [],
    correctAnswer: input.correctAnswer || "",
    status: normalizeStatus(decision?.status || input.status || "pending"),
    reviewedAt: decision?.reviewedAt || "",
    notes: decision?.notes || ""
  };
}

function skillLabel(skillId = "") {
  return skillTree.find(skill => skill.id === skillId)?.label || skillId;
}

const items = [];

for (const skill of skillTree) {
  const questions = await loadAssessmentSkillBank(skill.id);
  for (const question of questions) {
    const questionId = text(question.approvedQuestionId || question.questionId || question.id);
    const entries = questionImageEntries(question);
    if (hfwSkillIds.has(skill.id) && entries.length === 0) {
      items.push(buildReviewItem({
        area: "assessment",
        skillId: skill.id,
        displaySkillName: skill.label,
        questionId,
        targetWord: question.targetWord || question.correctAnswer || question.answer || "",
        imagePath: "",
        text: question.sentenceWithBlank || question.visibleSentenceWithBlank || question.fullSentence || question.sentenceText || question.prompt || question.question || "",
        answerChoices: Array.isArray(question.answerOptions)
          ? question.answerOptions.map(answerValue).filter(Boolean)
          : (Array.isArray(question.choices) ? question.choices.map(answerValue).filter(Boolean) : []),
        correctAnswer: answerValue(question.correctAnswer || question.answer),
        level: question.level || "",
        phase: question.phase || "",
        status: "approved"
      }));
      continue;
    }
    for (const entry of entries) {
      items.push(buildReviewItem({
        area: "assessment",
        skillId: skill.id,
        displaySkillName: skill.label,
        questionId,
        targetWord: entry.targetWord || question.targetWord || question.targetPattern || question.phonicsPattern || question.correctAnswer || question.answer || "",
        imagePath: entry.imagePath,
        imageRole: entry.imageRole,
        text: question.sentenceWithBlank || question.visibleSentenceWithBlank || question.fullSentence || question.sentenceText || question.passage || question.prompt || question.question || "",
        answerChoices: Array.isArray(question.answerOptions)
          ? question.answerOptions.map(answerValue).filter(Boolean)
          : (Array.isArray(question.choices) ? question.choices.map(answerValue).filter(Boolean) : []),
        correctAnswer: answerValue(question.correctAnswer || question.answer),
        level: question.level || "",
        phase: question.phase || ""
      }));
    }
  }
}

for (const book of guidedReadingBooks) {
  for (const page of book.pages || []) {
    const imagePath = text(page.image || page.imageUrl || page.imagePath);
    if (!imagePath) continue;
    items.push(buildReviewItem({
      area: "guided_reading",
      skillId: "guided_reading",
      displaySkillName: "Guided Reading",
      bookId: book.id,
      pageId: `${book.id}:page-${page.pageNumber || page.id}`,
      pageNumber: page.pageNumber || "",
      bookTitle: book.title,
      level: book.level || "",
      targetWord: (page.targetWords || []).join(", "),
      imagePath,
      imageRole: "guided_reading_page",
      text: Array.isArray(page.text) ? page.text.join(" ") : page.text || page.pageAudioText || ""
    }));
  }
}

for (const quest of storyQuests || []) {
  for (const page of quest.pages || []) {
    const imagePath = text(page.imageUrl || page.image || page.imagePath);
    if (!imagePath) continue;
    items.push(buildReviewItem({
      area: "story_quests",
      skillId: "story_quests",
      displaySkillName: "Story Quests",
      bookId: quest.id,
      pageId: `${quest.id}:${page.id || page.pageId || ""}`,
      pageNumber: page.id || "",
      bookTitle: quest.title,
      targetWord: (page.skillTags || quest.targetWords || []).join(", "),
      imagePath,
      imageRole: "story_quest_page",
      text: Array.isArray(page.text) ? page.text.join(" ") : page.text || page.choicePrompt || ""
    }));
  }
}

const uniqueItems = Array.from(new Map(items.map(item => [item.reviewId, item])).values())
  .sort((a, b) => `${a.area}:${a.skillId}:${a.questionId}:${a.pageId}:${a.imagePath}`.localeCompare(`${b.area}:${b.skillId}:${b.questionId}:${b.pageId}:${b.imagePath}`));

const decisions = uniqueItems
  .filter(item => item.status !== "pending" || item.notes || item.reviewedAt)
  .map(item => ({
    reviewId: item.reviewId,
    area: item.area,
    skillId: item.skillId,
    questionId: item.questionId,
    bookId: item.bookId,
    pageId: item.pageId,
    targetWord: item.targetWord,
    imagePath: item.imagePath,
    text: item.text,
    answerChoices: item.answerChoices,
    correctAnswer: item.correctAnswer,
    status: item.status,
    reviewedAt: item.reviewedAt,
    notes: item.notes
  }));

writeFile(outItems, `// Generated by tools/buildUnifiedMediaQaReviewData.js. Do not hand-edit.\n\nexport const mediaQaReviewItems = ${JSON.stringify(uniqueItems, null, 2)};\n\nexport default mediaQaReviewItems;\n`);
writeFile(outDecisions, `// Generated/manual media QA decisions. Updated by tools or local admin export/import workflows.\n\nexport const mediaQaReviewRows = ${JSON.stringify(decisions, null, 2)};\n\nexport default mediaQaReviewRows;\n`);

const byArea = uniqueItems.reduce((counts, item) => {
  counts[item.area] = (counts[item.area] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  generated: path.relative(repoRoot, outItems),
  decisions: path.relative(repoRoot, outDecisions),
  items: uniqueItems.length,
  byArea
}, null, 2));
