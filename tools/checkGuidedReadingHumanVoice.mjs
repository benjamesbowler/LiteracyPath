#!/usr/bin/env node

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const levelArgumentIndex = process.argv.findIndex(argument => argument === "--level");
const requestedLevel = process.argv
  .find(argument => argument.startsWith("--level="))
  ?.split("=")[1]
  || (levelArgumentIndex >= 0 ? process.argv[levelArgumentIndex + 1] : "")
  || null;
if (requestedLevel && !["A", "B", "C"].includes(requestedLevel)) {
  throw new Error(`Unsupported Guided Reading level: ${requestedLevel}`);
}

const GENERIC_PROSE_PATTERNS = Object.freeze([
  { label: "stated lesson", pattern: /\b(?:they|he|she) learned that\b/i },
  { label: "generic future summary", pattern: /\bfrom that day on\b/i },
  { label: "generic optimistic ending", pattern: /\banything was possible\b/i },
  { label: "abstract emotion summary", pattern: /\b(?:a )?warm feeling\b/i },
  { label: "clinical child emotion", pattern: /\bworried feeling\b/i },
  { label: "clinical calming summary", pattern: /\bbreathing feels calm\b/i },
  { label: "abstract understanding summary", pattern: /\bunderstanding .+ (?:began|begun)\b/i },
  { label: "tidy growth moral", pattern: /\bnow (?:he|she|they) knew what .+ could feel like\b/i },
  { label: "abstract trait appraisal", pattern: /\bthey learned (?:he|she|it) (?:loved|liked|was|felt)\b/i },
  { label: "employee-like puppy description", pattern: /\binteresting work\b/i }
]);

const EMPTY_ENDING_PATTERNS = Object.freeze([
  {
    label: "empty gate-exit ending",
    pattern: /\b(?:go|goes|walk|walks|run|runs|leave|leaves|head|heads)\b.*\b(?:through|past|beyond|out of) the gate\b/i
  }
]);

const NON_US_SPELLING_PATTERNS = Object.freeze([
  { preferred: "apologize", pattern: /\bapologis(?:e|es|ed|ing)\b/i },
  { preferred: "authorize", pattern: /\bauthoris(?:e|es|ed|ing)\b/i },
  { preferred: "analyze", pattern: /\banalys(?:e|es|ed|ing)\b/i },
  { preferred: "behavior", pattern: /\bbehaviours?\b/i },
  { preferred: "canceled", pattern: /\bcancelled\b/i },
  { preferred: "catalog", pattern: /\bcatalogues?\b/i },
  { preferred: "center", pattern: /\bcentres?\b/i },
  { preferred: "check", pattern: /\bcheques?\b/i },
  { preferred: "color", pattern: /\bcolours?\b/i },
  { preferred: "cozy", pattern: /\bcosy\b/i },
  { preferred: "defense", pattern: /\bdefence\b/i },
  { preferred: "dreamed", pattern: /\bdreamt\b/i },
  { preferred: "airplane", pattern: /\baeroplanes?\b/i },
  { preferred: "aluminum", pattern: /\baluminium\b/i },
  { preferred: "favorite", pattern: /\bfavourites?\b/i },
  { preferred: "favor", pattern: /\bfavours?\b/i },
  { preferred: "flavor", pattern: /\bflavours?\b/i },
  { preferred: "gray", pattern: /\bgrey\b/i },
  { preferred: "honor", pattern: /\bhonours?\b/i },
  { preferred: "jewelry", pattern: /\bjewellery\b/i },
  { preferred: "kilometer", pattern: /\bkilometres?\b/i },
  { preferred: "labeled", pattern: /\blabelled\b/i },
  { preferred: "learned", pattern: /\blearnt\b/i },
  { preferred: "license", pattern: /\blicences?\b/i },
  { preferred: "liter", pattern: /\blitres?\b/i },
  { preferred: "marvelous", pattern: /\bmarvellous\b/i },
  { preferred: "meter", pattern: /\bmetres?\b/i },
  { preferred: "modeled", pattern: /\bmodelled\b/i },
  { preferred: "Mom", pattern: /\bmums?\b|\bmummy\b/i },
  { preferred: "neighbor", pattern: /\bneighbours?\b/i },
  { preferred: "offense", pattern: /\boffence\b/i },
  { preferred: "organize", pattern: /\borganis(?:e|es|ed|ing)\b/i },
  { preferred: "pajamas", pattern: /\bpyjamas?\b/i },
  { preferred: "practice", pattern: /\bpractis(?:e|es|ed|ing)\b/i },
  { preferred: "program", pattern: /\bprogrammes?\b/i },
  { preferred: "recognize", pattern: /\brecognis(?:e|es|ed|ing)\b/i },
  { preferred: "realize", pattern: /\brealis(?:e|es|ed|ing)\b/i },
  { preferred: "spoiled", pattern: /\bspoilt\b/i },
  { preferred: "synthesize", pattern: /\bsynthesis(?:e|es|ed|ing)\b/i },
  { preferred: "theater", pattern: /\btheatres?\b/i },
  { preferred: "tire", pattern: /\btyres?\b/i },
  { preferred: "traveled", pattern: /\btravelled\b/i },
  { preferred: "traveler", pattern: /\btravellers?\b/i },
  { preferred: "traveling", pattern: /\btravelling\b/i },
  { preferred: "while", pattern: /\bwhilst\b/i },
  { preferred: "among", pattern: /\bamongst\b/i }
]);

function collectStrings(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach(item => collectStrings(item, result));
  else if (value && typeof value === "object") {
    Object.values(value).forEach(item => collectStrings(item, result));
  }
  return result;
}

const CHILD_FACING_BOOK_FIELDS = Object.freeze([
  "title",
  "seriesTitle",
  "targetPatterns",
  "sightWords",
  "vocabulary",
  "topicTags"
]);

const CHILD_FACING_PAGE_FIELDS = Object.freeze([
  "text",
  "pageAudioText",
  "imageAlt",
  "pageDescription",
  "embeddedImageText",
  "words",
  "targetWords",
  "decodableFocus"
]);

const findings = guidedReadingBooks
  .filter(book => book.active !== false && book.type === "fiction")
  .flatMap(book => {
    const pages = (book.pages || []).filter(page => page.active !== false);
    const genericFindings = pages.flatMap(page => GENERIC_PROSE_PATTERNS
      .filter(rule => rule.pattern.test(String(page.text || "")))
      .map(rule => ({
        bookId: book.id,
        pageNumber: page.pageNumber,
        issue: rule.label,
        text: page.text
      })));
    const ending = pages.at(-1);
    const endingFindings = ending
      ? EMPTY_ENDING_PATTERNS
        .filter(rule => rule.pattern.test(String(ending.text || "")))
        .map(rule => ({
          bookId: book.id,
          pageNumber: ending.pageNumber,
          issue: rule.label,
          text: ending.text
        }))
      : [];
    return [...genericFindings, ...endingFindings];
  });

const usSpellingFindings = guidedReadingBooks
  .filter(book => book.active !== false && (!requestedLevel || book.level === requestedLevel))
  .flatMap(book => {
    const bookStrings = CHILD_FACING_BOOK_FIELDS.flatMap(field =>
      collectStrings(book[field]).map(text => ({ field, text }))
    );
    const pageStrings = (book.pages || [])
      .filter(page => page.active !== false)
      .flatMap(page => CHILD_FACING_PAGE_FIELDS.flatMap(field =>
        collectStrings(page[field]).map(text => ({
          pageNumber: page.pageNumber,
          field,
          text
        }))
      ));
    return [...bookStrings, ...pageStrings].flatMap(entry =>
      NON_US_SPELLING_PATTERNS
        .filter(rule => rule.pattern.test(entry.text))
        .map(rule => ({
          bookId: book.id,
          ...entry,
          issue: "non-U.S. spelling",
          preferred: rule.preferred
        }))
    );
  });

const summary = {
  activeFictionBooks: guidedReadingBooks.filter(
    book => book.active !== false && book.type === "fiction"
  ).length,
  activeFictionPages: guidedReadingBooks
    .filter(book => book.active !== false && book.type === "fiction")
    .reduce((count, book) => count + (book.pages || []).filter(page => page.active !== false).length, 0),
  usSpellingLevel: requestedLevel || "all",
  genericVoiceFindings: findings.length,
  usSpellingFindings: usSpellingFindings.length,
  findings: [...findings, ...usSpellingFindings]
};

console.log(JSON.stringify(summary, null, 2));
if (findings.length || usSpellingFindings.length) process.exitCode = 1;
