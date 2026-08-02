import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  guidedReadingQuestionsShareCoreConcept,
  isGuidedReadingQuestionGenreAppropriate,
  isGuidedReadingQuestionStructurallyValid,
  isProhibitedGuidedReadingPrompt
} from "../src/utils/guidedReading/bookQuizQuestions.js";
import { guidedReadingBigIdeaFairnessIssues } from "../src/policy/guidedReadingBigIdeaPolicy.js";

const FICTION_SKILLS = new Set([
  "character_action",
  "setting",
  "sequence",
  "cause_effect",
  "problem_solution",
  "motivation",
  "inference",
  "outcome",
  "theme"
]);

const NONFICTION_SKILLS = new Set([
  "main_idea",
  "key_detail",
  "function",
  "cause_effect",
  "sequence",
  "comparison",
  "vocabulary"
]);

const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "because", "before", "by", "can", "could", "did",
  "do", "does", "each", "even", "for", "from", "had", "has", "have", "he", "her", "hers", "him", "his",
  "i", "in", "is", "it", "its", "may", "might", "of", "on", "or", "our", "she", "should", "than", "that",
  "the", "their", "them", "they", "thing", "things", "this", "to", "us", "was", "we", "were", "when",
  "whenever", "with", "would", "you", "your"
]);

const NEGATION_PATTERN = /\b(?:cannot|can't|didn't|doesn't|don't|isn't|neither|never|no|nobody|none|nor|not|nothing|wasn't|weren't|without|won't)\b/i;
const RATIONALE_LINK_PATTERN = /\b(?:because|demonstrat(?:e|es|ing)|explain(?:s|ing)?|indicat(?:e|es|ing)|link(?:s|ed|ing)?|mean(?:s|ing)?|show(?:s|ed|ing)?|so|suggest(?:s|ed|ing)?|therefore|which)\b/i;
const DIRECT_SUPPORT_THRESHOLD = 0.8;
const RATIONALE_ANSWER_THRESHOLD = 0.75;

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/(^|[^a-z0-9])'+/g, "$1")
    .replace(/'+(?=$|[^a-z0-9])/g, "")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(token = "") {
  if (token.length > 3 && token.endsWith("'s")) return token.slice(0, -2);
  if (token.length > 5 && token.endsWith("ing")) {
    let base = token.slice(0, -3);
    if (/([bdfgmnprt])\1$/.test(base)) base = base.slice(0, -1);
    if (/(?:ak|at|car|chang|clos|creat|giv|liv|lov|mak|mov|practis|rac|rais|smil|tak|us|writ)$/.test(base)) {
      return `${base}e`;
    }
    return base;
  }
  if (token.length > 4 && token.endsWith("ied")) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith("ed")) {
    let base = token.slice(0, -2);
    if (/([bdfgmnprt])\1$/.test(base)) base = base.slice(0, -1);
    if (/(?:ak|at|car|chang|clos|creat|giv|liv|lov|mak|mov|practis|rac|rais|smil|tak|us|writ)$/.test(base)) {
      return `${base}e`;
    }
    return base;
  }
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && /(?:sses|xes|zes|ches|shes)$/.test(token)) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  return token;
}

function contentTokens(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .filter(token => !STOP_WORDS.has(token))
    .map(stem);
}

function uniqueContentTokens(value = "") {
  return [...new Set(contentTokens(value))];
}

function supportedTokenCount(sourceTokens = [], comparisonTokens = []) {
  const comparisonSet = new Set(comparisonTokens);
  return sourceTokens.filter(token => comparisonSet.has(token)).length;
}

function hasTargetedNegationConflict(answer = "", evidence = "") {
  const answerIsNegated = NEGATION_PATTERN.test(String(answer));
  const evidenceIsNegated = NEGATION_PATTERN.test(String(evidence));
  if (answerIsNegated === evidenceIsNegated) return false;
  if (answerIsNegated) return true;

  const answerTokenSet = new Set(uniqueContentTokens(answer));
  const minimumMatchedTokens = answerTokenSet.size === 1 ? 1 : 2;
  return evidenceSegments(evidence).some(segment => {
    if (!NEGATION_PATTERN.test(segment)) return false;
    const rawTokens = normalizeText(segment).split(" ").filter(Boolean);
    const negationIndexes = rawTokens
      .map((token, index) => NEGATION_PATTERN.test(token) ? index : -1)
      .filter(index => index >= 0);
    const matchedIndexes = rawTokens
      .map((token, index) => answerTokenSet.has(stem(token)) ? index : -1)
      .filter(index => index >= 0);
    if (new Set(matchedIndexes.map(index => stem(rawTokens[index]))).size < minimumMatchedTokens) return false;
    const firstMatch = Math.min(...matchedIndexes);
    const lastMatch = Math.max(...matchedIndexes);
    return negationIndexes.some(index => index >= firstMatch - 3 && index <= lastMatch + 3);
  });
}

function hasStrongTokenSupport(answer = "", evidence = "", threshold = DIRECT_SUPPORT_THRESHOLD) {
  const answerTokens = uniqueContentTokens(answer);
  const evidenceTokens = uniqueContentTokens(evidence);
  if (!answerTokens.length || !evidenceTokens.length) return false;

  const supported = supportedTokenCount(answerTokens, evidenceTokens);
  if (answerTokens.length === 1) return supported === 1;
  const required = Math.max(2, Math.ceil(answerTokens.length * threshold));
  return supported >= required;
}

function evidenceSegments(value = "") {
  return String(value)
    .split(/[.!?;:\n]+/)
    .map(segment => segment.trim())
    .filter(Boolean);
}

function answerClauses(value = "") {
  return String(value)
    .split(/\s+(?:and|or)\s+|[,;]/i)
    .map(clause => clause.trim())
    .filter(clause => uniqueContentTokens(clause).length);
}

function clauseHasDirectSupport(clause = "", evidence = "") {
  const matchingSegment = evidenceSegments(evidence).some(segment =>
    hasStrongTokenSupport(clause, segment) && !hasTargetedNegationConflict(clause, segment)
  );
  if (matchingSegment) return true;

  // Some direct answers combine adjacent source sentences (for example,
  // "grow big"). The combined excerpt may support that answer only when its
  // overall polarity also agrees; this prevents a nearby negated sentence from
  // silently flipping the meaning.
  return hasStrongTokenSupport(clause, evidence) && !hasTargetedNegationConflict(clause, evidence);
}

function rationaleIsTraceable(answer = "", evidence = "", rationale = "") {
  const normalizedRationale = normalizeText(rationale);
  if (normalizedRationale.length < 24) return false;
  if (normalizedRationale === normalizeText(answer) || normalizedRationale === normalizeText(evidence)) return false;
  if (!RATIONALE_LINK_PATTERN.test(String(rationale))) return false;

  const answerTokens = uniqueContentTokens(answer);
  const evidenceTokens = uniqueContentTokens(evidence);
  const rationaleTokens = uniqueContentTokens(rationale);
  if (!answerTokens.length || !evidenceTokens.length || !rationaleTokens.length) return false;

  const answerLinks = supportedTokenCount(answerTokens, rationaleTokens);
  const requiredAnswerLinks = answerTokens.length === 1
    ? 1
    : Math.max(2, Math.ceil(answerTokens.length * RATIONALE_ANSWER_THRESHOLD));
  if (answerLinks < requiredAnswerLinks) return false;

  // Evidence anchors must do more than repeat a single convenient word from
  // the answer. For normal excerpts, require two distinct source terms, at
  // least one of which is not already doing the answer-linking work. A true
  // one-token excerpt is the only principled exception.
  const answerTokenSet = new Set(answerTokens);
  const evidenceSpecificTokens = evidenceTokens.filter(token => !answerTokenSet.has(token));
  const evidenceLinks = supportedTokenCount(evidenceTokens, rationaleTokens);
  if (evidenceTokens.length === 1) return evidenceLinks === 1;
  if (evidenceLinks < 2) return false;
  return !evidenceSpecificTokens.length || supportedTokenCount(evidenceSpecificTokens, rationaleTokens) >= 1;
}

export function answerIsSupportedByText(answer = "", evidence = "", { conceptual = false, rationale = "" } = {}) {
  const normalizedAnswer = normalizeText(answer);
  const normalizedEvidence = normalizeText(evidence);
  if (!normalizedAnswer || !normalizedEvidence) return false;

  const clauses = answerClauses(answer);
  if (clauses.length && clauses.every(clause => clauseHasDirectSupport(clause, evidence))) return true;
  if (!conceptual) return false;
  return rationaleIsTraceable(answer, evidence, rationale);
}

export function guidedReadingBookContentHash(book = {}) {
  const source = (book.pages || []).map((page, index) => ({
    pageNumber: page.pageNumber || index + 1,
    text: normalizeText(page.text)
  }));
  return `sha256:${createHash("sha256").update(JSON.stringify(source)).digest("hex")}`;
}

function expectedKind(answer = "") {
  return normalizeText(answer).split(" ").filter(Boolean).length === 1 ? "word" : "text";
}

function hasCorrectAnswerLengthGiveaway(question = {}) {
  const correct = String(question.answer || "").replace(/\s+/g, " ").trim().length;
  const distractors = (question.choices || [])
    .filter(choice => normalizeText(choice) !== normalizeText(question.answer))
    .map(choice => String(choice).replace(/\s+/g, " ").trim().length);
  if (!correct || distractors.length !== 2) return false;

  const shortestDistractor = Math.min(...distractors);
  const longestDistractor = Math.max(...distractors);
  const conspicuouslyLong = correct >= longestDistractor * 2.2 && correct - longestDistractor >= 12;
  const conspicuouslyShort = correct * 2.2 <= shortestDistractor && shortestDistractor - correct >= 12;
  return conspicuouslyLong || conspicuouslyShort;
}

function targetedDetailFairnessIssues(question = {}) {
  const prompt = String(question.prompt || "").trim();
  if (/^What do we learn about\b/i.test(prompt)) {
    return ["broad 'What do we learn?' wording can make several true book facts defensible"];
  }
  const match = prompt.match(/^Which sentence tells about (.+?) in .+\?$/i);
  if (!match) return [];
  const targetTokens = uniqueContentTokens(match[1]);
  if (!targetTokens.length) return ["the detail prompt has no concrete target"];
  const matchingChoices = (question.choices || []).filter(choice => {
    const choiceTokens = new Set(uniqueContentTokens(choice));
    return targetTokens.every(token => choiceTokens.has(token));
  });
  const answerTokens = new Set(uniqueContentTokens(question.answer));
  const answerMatches = targetTokens.every(token => answerTokens.has(token));
  const issues = [];
  if (!answerMatches) issues.push("the marked answer does not name the prompt's target");
  if (matchingChoices.length !== 1) {
    issues.push(`exactly one choice must name the prompt's target; found ${matchingChoices.length}`);
  }
  return issues;
}

function parseQuizFile(filePath) {
  try {
    return { data: JSON.parse(fs.readFileSync(filePath, "utf8")), error: "" };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

export function auditGuidedReadingQuestionBank({ books = [], quizDirectory = "" } = {}) {
  const failures = [];
  const warnings = [];
  const rows = [];
  const promptCounts = new Map();
  const expectedIds = new Set(books.map(book => book.id));
  const quizFiles = fs.existsSync(quizDirectory)
    ? fs.readdirSync(quizDirectory).filter(file => file.endsWith(".json")).sort()
    : [];
  const actualIds = new Set(quizFiles.map(file => path.basename(file, ".json")));

  for (const id of expectedIds) {
    if (!actualIds.has(id)) failures.push(`${id}: missing quiz file`);
  }
  for (const id of actualIds) {
    if (!expectedIds.has(id)) failures.push(`${id}: orphan quiz file has no active Guided Reading book`);
  }

  let questionCount = 0;
  let evidenceCount = 0;
  let supportedAnswerCount = 0;
  let directlySupportedAnswerCount = 0;
  let rationaleSupportedAnswerCount = 0;
  let supportingEvidenceExcerptCount = 0;
  let fictionQuestionCount = 0;
  let nonfictionQuestionCount = 0;
  let bigIdeaQuestionCount = 0;
  let fairBigIdeaQuestionCount = 0;

  for (const book of books) {
    const filePath = path.join(quizDirectory, `${book.id}.json`);
    const bookFailures = [];
    const { data, error } = parseQuizFile(filePath);
    if (error) {
      bookFailures.push(`invalid JSON (${error})`);
    } else if (data) {
      if (data.schemaVersion !== 2) bookFailures.push(`schemaVersion is ${data.schemaVersion ?? "missing"}, expected 2`);
      if (!String(data.quizVersion || "").trim()) bookFailures.push("quizVersion is missing");
      if (data.bookId !== book.id) bookFailures.push(`bookId is ${data.bookId || "missing"}`);
      if (data.contentHash !== guidedReadingBookContentHash(book)) {
        bookFailures.push("contentHash does not match the current approved page text");
      }
      if (!Array.isArray(data.questions) || data.questions.length !== 3) {
        bookFailures.push(`expected exactly 3 questions, found ${data.questions?.length ?? 0}`);
      }

      const questions = Array.isArray(data.questions) ? data.questions : [];
      const answerConcepts = new Set();
      const promptConcepts = new Set();
      const evidencePages = new Set();
      const skills = new Set();
      const questionIds = new Set();
      const allowedSkills = book.type === "fiction" ? FICTION_SKILLS : NONFICTION_SKILLS;

      questions.forEach((question, index) => {
        const label = `question ${index + 1}`;
        questionCount += 1;
        if (book.type === "fiction") fictionQuestionCount += 1;
        else nonfictionQuestionCount += 1;

        if (!isGuidedReadingQuestionStructurallyValid(question)) {
          bookFailures.push(`${label}: invalid prompt/choice/answer structure`);
        }
        const expectedQuestionId = `${book.id}-q${index + 1}`;
        if (question.id !== expectedQuestionId) {
          bookFailures.push(`${label}: id is "${question.id || "missing"}", expected "${expectedQuestionId}"`);
        } else if (questionIds.has(question.id)) {
          bookFailures.push(`${label}: duplicate question id "${question.id}"`);
        }
        questionIds.add(question.id);
        if (isProhibitedGuidedReadingPrompt(question.prompt)) {
          bookFailures.push(`${label}: prohibited generic template "${question.prompt}"`);
        }
        if (!isGuidedReadingQuestionGenreAppropriate(question, book)) {
          bookFailures.push(`${label}: genre-inappropriate fiction wording appears in its prompt, choices, or answer`);
        }
        if (hasCorrectAnswerLengthGiveaway(question)) {
          bookFailures.push(`${label}: correct answer is a conspicuous length outlier among its choices`);
        }
        if (book.type === "nonfiction" && question.skill !== "main_idea") {
          targetedDetailFairnessIssues(question).forEach(issue => (
            bookFailures.push(`${label}: detail-question fairness: ${issue}`)
          ));
        }

        const normalizedPrompt = normalizeText(question.prompt);
        const normalizedAnswer = normalizeText(question.answer);
        promptCounts.set(normalizedPrompt, (promptCounts.get(normalizedPrompt) || 0) + 1);
        if (promptConcepts.has(normalizedPrompt)) bookFailures.push(`${label}: repeated prompt within quiz`);
        if (answerConcepts.has(normalizedAnswer)) bookFailures.push(`${label}: repeated correct answer "${question.answer}"`);
        promptConcepts.add(normalizedPrompt);
        answerConcepts.add(normalizedAnswer);

        if (!allowedSkills.has(question.skill)) {
          bookFailures.push(`${label}: missing or invalid ${book.type} skill "${question.skill || ""}"`);
        } else {
          skills.add(question.skill);
        }

        if (question.skill === "main_idea") {
          bigIdeaQuestionCount += 1;
          const fairnessIssues = guidedReadingBigIdeaFairnessIssues(question, book);
          if (!fairnessIssues.length) fairBigIdeaQuestionCount += 1;
          fairnessIssues.forEach(issue => bookFailures.push(`${label}: big-idea fairness: ${issue}`));
        }

        const evidenceTexts = [];
        const evidencePage = Number(question.evidencePage);
        const page = Number.isInteger(evidencePage) ? book.pages?.[evidencePage - 1] : null;
        if (!page) {
          bookFailures.push(`${label}: evidencePage ${question.evidencePage ?? "missing"} is invalid`);
        } else {
          evidencePages.add(evidencePage);
          const evidenceText = String(question.evidenceText || "").trim();
          if (!evidenceText) {
            bookFailures.push(`${label}: evidenceText is missing`);
          } else if (!normalizeText(page.text).includes(normalizeText(evidenceText))) {
            bookFailures.push(`${label}: evidenceText does not occur on page ${evidencePage}`);
          } else {
            evidenceCount += 1;
            evidenceTexts.push(evidenceText);
          }
        }

        const supportingEvidence = question.supportingEvidence ?? [];
        if (!Array.isArray(supportingEvidence)) {
          bookFailures.push(`${label}: supportingEvidence must be an array when supplied`);
        } else {
          const seenSupportingEvidence = new Set();
          supportingEvidence.forEach((item, supportIndex) => {
            const supportLabel = `${label} supporting evidence ${supportIndex + 1}`;
            const supportPageNumber = Number(item?.evidencePage);
            const supportPage = Number.isInteger(supportPageNumber) ? book.pages?.[supportPageNumber - 1] : null;
            const supportText = String(item?.evidenceText || "").trim();
            const supportKey = `${supportPageNumber}:${normalizeText(supportText)}`;
            if (!supportPage) {
              bookFailures.push(`${supportLabel}: evidencePage ${item?.evidencePage ?? "missing"} is invalid`);
            } else if (!supportText) {
              bookFailures.push(`${supportLabel}: evidenceText is missing`);
            } else if (!normalizeText(supportPage.text).includes(normalizeText(supportText))) {
              bookFailures.push(`${supportLabel}: evidenceText does not occur on page ${supportPageNumber}`);
            } else if (seenSupportingEvidence.has(supportKey) ||
              (supportPageNumber === evidencePage && normalizeText(supportText) === normalizeText(question.evidenceText))) {
              bookFailures.push(`${supportLabel}: duplicates another evidence excerpt`);
            } else {
              seenSupportingEvidence.add(supportKey);
              evidencePages.add(supportPageNumber);
              evidenceTexts.push(supportText);
              supportingEvidenceExcerptCount += 1;
            }
          });
        }

        if (evidenceTexts.length) {
          const combinedEvidenceText = evidenceTexts.join(" ");
          const conceptualSkill = ["cause_effect", "problem_solution", "motivation", "inference", "theme", "main_idea", "outcome"].includes(question.skill);
          const directlySupported = answerIsSupportedByText(question.answer, combinedEvidenceText);
          const rationaleSupported = !directlySupported && answerIsSupportedByText(question.answer, combinedEvidenceText, {
            conceptual: conceptualSkill,
            rationale: question.rationale
          });
          if (directlySupported || rationaleSupported) {
            supportedAnswerCount += 1;
            if (directlySupported) directlySupportedAnswerCount += 1;
            if (rationaleSupported) rationaleSupportedAnswerCount += 1;
          } else {
            bookFailures.push(`${label}: answer "${question.answer}" needs direct textual support or a traceable conceptual rationale`);
          }
        }

        if (question.kind !== expectedKind(question.answer)) {
          bookFailures.push(`${label}: kind should be "${expectedKind(question.answer)}" for answer "${question.answer}"`);
        }
      });

      for (let firstIndex = 0; firstIndex < questions.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < questions.length; secondIndex += 1) {
          if (guidedReadingQuestionsShareCoreConcept(questions[firstIndex], questions[secondIndex], book)) {
            bookFailures.push(
              `questions ${firstIndex + 1} and ${secondIndex + 1} repeat the same title-linked core concept`
            );
          }
        }
      }

      if (questions.length === 3 && answerConcepts.size !== 3) {
        bookFailures.push(`quiz has ${answerConcepts.size} distinct answers; expected 3`);
      }
      if (questions.length === 3 && evidencePages.size < 2) {
        bookFailures.push(`quiz uses only ${evidencePages.size} evidence page; expected at least 2`);
      }
      if (book.type === "fiction" && questions.length === 3 && skills.size !== 3) {
        bookFailures.push(`fiction quiz uses ${skills.size} distinct skills; expected 3`);
      }
      if (book.type === "nonfiction" && book.level === "C" && questions.length === 3 && skills.size < 2) {
        bookFailures.push(`Level C nonfiction quiz uses ${skills.size} distinct skills; expected at least 2`);
      }
    }

    bookFailures.forEach(issue => failures.push(`${book.id}: ${issue}`));
    rows.push({
      id: book.id,
      title: book.title,
      type: book.type,
      level: book.level,
      questions: data?.questions?.length || 0,
      status: bookFailures.length ? "FAIL" : "PASS",
      issues: bookFailures
    });
  }

  for (const [prompt, count] of promptCounts) {
    if (count > 4) failures.push(`bank: exact prompt repeated ${count} times: "${prompt}"`);
  }

  const metrics = {
    bookCount: books.length,
    quizFileCount: quizFiles.length,
    questionCount,
    fictionQuestionCount,
    nonfictionQuestionCount,
    bigIdeaQuestionCount,
    fairBigIdeaQuestionCount,
    evidenceCount,
    supportedAnswerCount,
    directlySupportedAnswerCount,
    rationaleSupportedAnswerCount,
    supportingEvidenceExcerptCount,
    prohibitedPromptCount: failures.filter(item => item.includes("prohibited generic template")).length,
    repeatedAnswerCount: failures.filter(item => item.includes("repeated correct answer")).length,
    repeatedCoreConceptCount: failures.filter(item => item.includes("repeat the same title-linked core concept")).length,
    answerLengthGiveawayCount: failures.filter(item => item.includes("conspicuous length outlier")).length,
    passingBooks: rows.filter(row => row.status === "PASS").length,
    failingBooks: rows.filter(row => row.status === "FAIL").length,
    failureCount: failures.length,
    warningCount: warnings.length
  };

  return { failures, warnings, rows, metrics };
}
