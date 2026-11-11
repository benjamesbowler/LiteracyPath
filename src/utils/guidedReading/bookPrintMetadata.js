import { ALL_HFW_WORDS } from "../../data/highFrequencyWordBands.js";
import { declaredNextStepsLessons } from "../../data/nextStepsPhonicsLessons.js";
import { PRONUNCIATION_RECORDS } from "../../features/soundSeekers/content/pronunciationRecords.js";
import { guidedReadingModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";
import { getPublicBookMetadata } from "./bookLevelMetadata.js";
import { DECODABLE_CORRESPONDENCES } from "./decodableScope.js";
import { getAnalysisPages, tokenizeReadingText } from "./textMetrics.js";

const HFW_ORDER = new Map(ALL_HFW_WORDS.map((word, index) => [word, index]));
const READING_WORD = /\p{L}/u;
const normalizeWord = word => String(word || "").toLowerCase().replaceAll("’", "'");
const printCommonWord = word => word.replace(/^i(?='|$)/u, "I");

// These labels describe the sound of the spelling in the accompanying words.
// The keys come from reviewed pronunciation units, never spelling fragments.
const LEXICON_LABELS = {
  short_a: "Short a", short_e: "Short e", short_i: "Short i", short_o: "Short o", short_u: "Short u",
  ai: "Long a (ai)", ay: "Long a (ay)", a_e: "Long a (a-e)",
  ee: "Long e (ee)", ea: "Long e (ea)", e_e: "Long e (e-e)",
  igh: "Long i (igh)", ie: "Long i (ie)", i_e: "Long i (i-e)",
  oa: "Long o (oa)", oe: "Long o (oe)", ow: "Long o (ow)", o_e: "Long o (o-e)",
  u_e: "Long u (u-e)", ue: "Long oo (ue)", oo: "Long oo (oo)", oo_short: "Short oo (oo)",
  oi: "oi sound", oy: "oy sound", ou: "ou sound", aw: "aw sound",
  ar: "ar sound", ir: "ir sound", ur: "ur sound", or: "or sound", air: "air sound",
  ch: "ch sound", sh: "sh sound", th: "Unvoiced th", wh: "wh sound", ck: "ck for the k sound",
  ng: "ng sound", nk: "nk sounds", qu: "qu sounds", tion: "-tion ending", le: "-le ending"
};

const DOUBLED_LETTERS = new Map([
  ["dd", "d"], ["ff", "f"], ["gg", "g"], ["ll", "l"], ["nn", "n"],
  ["pp", "p"], ["ss", "s"], ["tt", "t"], ["zz", "z"]
]);

// The exact read record gives the present-tense pronunciation only. The same
// printed form can have another sound in the books, so skip it as an example.
const VARIABLE_PRONUNCIATIONS = new Set(["read", "wind", "live", "lead", "tear", "bow"]);
const REDUCED_FUNCTION_WORDS = new Set(["a", "an", "and", "can", "for", "of", "the", "to", "was"]);

const SCOPE_SOUND_LABELS = {
  "a:æ": "Short a", "e:ɛ": "Short e", "i:ɪ": "Short i", "o:ɑ": "Short o", "o:ɒ": "Short o",
  "u:ʌ": "Short u", "o:ʌ": "o for the short u sound", "oo:ʊ": "Short oo (oo)",
  "ai:eɪ": "Long a (ai)", "o-e:oʊ": "Long o (o-e)", "ar:ɑr": "ar sound",
  "all:ɔl": "-all word part", "ch:tʃ": "ch sound", "sh:ʃ": "sh sound",
  "th:θ": "Unvoiced th", "th:ð": "Voiced th", "wh:w": "wh sound", "ng:ŋ": "ng sound",
  "nk:ŋk": "nk sounds", "qu:kw": "qu sounds", "x:ks": "x for the k and s sounds",
  "c:k": "c for the k sound", "y:j": "y sound", "j:dʒ": "j sound", "r:ɹ": "r sound", "g:ɡ": "g sound"
};

function scopeSoundLabel(grapheme, sound) {
  if (DOUBLED_LETTERS.get(grapheme) === sound) return `${grapheme} for the ${sound} sound`;
  return SCOPE_SOUND_LABELS[`${grapheme}:${sound}`] || (grapheme === sound ? `${grapheme} sound` : "");
}

function lexiconSoundLabel({ grapheme, soundKey }) {
  if (DOUBLED_LETTERS.get(grapheme) === soundKey || (grapheme === "zz" && soundKey === "zz")) {
    return `${grapheme} for the ${DOUBLED_LETTERS.get(grapheme)} sound`;
  }
  if (grapheme === "wh" && soundKey === "w") return "wh sound";
  if (grapheme === "ea" && soundKey === "ee") return "Long e (ea)";
  return LEXICON_LABELS[soundKey] || "";
}

function countPageWords(book) {
  const counts = new Map();
  for (const [index, page] of getAnalysisPages(book).entries()) {
    const text = Array.isArray(page.text) ? page.text.join(" ") : page.text;
    for (const printed of tokenizeReadingText(text)) {
      const word = normalizeWord(printed);
      if (!READING_WORD.test(word)) continue;
      if (!counts.has(word)) counts.set(word, { count: 0, pages: new Set(), printed });
      const entry = counts.get(word);
      entry.count++;
      entry.pages.add(index);
      if (printed === word) entry.printed = printed;
    }
  }
  return counts;
}

function frequentWords(book, counts) {
  const authored = new Set([
    ...(book.sightWords || []), ...(book.foundationsGuide?.highFrequencyWords || [])
  ].map(normalizeWord));
  return [...counts.keys()]
    .filter(word => HFW_ORDER.has(word) || authored.has(word))
    .sort((a, b) => counts.get(b).count - counts.get(a).count
      || counts.get(b).pages.size - counts.get(a).pages.size
      || (HFW_ORDER.get(a) ?? HFW_ORDER.size) - (HFW_ORDER.get(b) ?? HFW_ORDER.size))
    .slice(0, 10)
    .map(printCommonWord);
}

function phonicsRows(book, counts, titleWords) {
  const scope = book.decodableScope;
  const guide = book.foundationsGuide?.soundLetter;
  const practiceWords = new Set((scope?.practiceWords || []).map(normalizeWord));
  const byLabel = new Map();

  function add(label, word, priority = 0) {
    const entry = counts.get(word);
    if (!label || (!entry && !titleWords.has(word))) return;
    if (!byLabel.has(label)) byLabel.set(label, new Map());
    const examples = byLabel.get(label);
    const score = priority + Math.min(entry?.count || 0, 4);
    const printed = entry?.printed || titleWords.get(word);
    if (score > (examples.get(word)?.score ?? -1)) examples.set(word, { printed, score });
  }

  if (guide) add(scopeSoundLabel(guide.grapheme, guide.sound), normalizeWord(guide.word), 40);

  if (scope) {
    for (const record of scope.wordRecords || []) {
      if (record.type !== "regular") continue;
      const word = normalizeWord(record.word);
      for (const [index, grapheme] of record.graphemes.entries()) {
        const label = scopeSoundLabel(grapheme, record.sounds[index]);
        const focus = DECODABLE_CORRESPONDENCES[grapheme]?.cycle === scope.afterCycle;
        const isPattern = grapheme.length > 1 || label.startsWith("Short ");
        const priority = (focus ? 14 : 0) + (isPattern ? 6 : 0) + (practiceWords.has(word) ? 5 : 0);
        add(label, word, priority);
      }
    }
  } else {
    for (const word of counts.keys()) {
      if (VARIABLE_PRONUNCIATIONS.has(word) || REDUCED_FUNCTION_WORDS.has(word)) continue;
      for (const unit of PRONUNCIATION_RECORDS[word]?.units || []) {
        if (unit.role !== "regular") continue;
        add(lexiconSoundLabel(unit), word, unit.grapheme.length > 1 ? 4 : 0);
      }
    }
    // The title character Fluff also occurs in the story, with final ff as in puff.
    add("ff for the f sound", "fluff", 4);
  }

  const ranked = [...byLabel.entries()].map(([label, examples]) => {
    const rankedExamples = [...examples.values()].sort((a, b) => b.score - a.score).slice(0, 3);
    const score = rankedExamples[0].score + 2 * (rankedExamples.length - 1);
    return { label, words: rankedExamples.map(example => printCommonWord(example.printed)), score };
  });

  return ranked.sort((a, b) => b.score - a.score).slice(0, 3).map(({ label, words }) => ({ label, words }));
}

export function bookPrintMetadata(book = {}) {
  const metadata = getPublicBookMetadata(book);
  const counts = countPageWords(book);
  const titleWords = new Map(tokenizeReadingText(book.title).map(word => [normalizeWord(word), word]));
  const scope = book.decodableScope;
  const prerequisites = Number.isInteger(scope?.afterCycle)
    ? [`After Cycle ${scope.afterCycle}`, ...declaredNextStepsLessons(book).map(lesson => lesson.title)]
    : [];
  const teachFirstWords = (scope?.exceptions || book.foundationsGuide?.languagePrep || [])
    .map(({ word }) => normalizeWord(word))
    .filter(word => counts.has(word) || titleWords.has(word));

  return {
    levelLabel: metadata.levelLabel,
    modeLabel: guidedReadingModeLabel(metadata.readingMode),
    highFrequencyWords: frequentWords(book, counts),
    phonics: phonicsRows(book, counts, titleWords),
    prerequisites,
    teachFirstWords: [...new Set(teachFirstWords)].map(printCommonWord)
  };
}
