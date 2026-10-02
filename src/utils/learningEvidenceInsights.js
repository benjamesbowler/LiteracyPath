import { isIndependentOutcome } from "../policy/outcomeIndependence.js";

// Descriptive teaching detail, never a second scoring or mastery policy. Read
// saved item snapshots only: changing today's bank must not rewrite history.
const FORMAT_LABELS = Object.freeze({
  letterPair: "Match letter cases", letterTrace: "Trace a letter", soundChoice: "Choose a sound",
  sightWordChoice: "Choose a written word", sceneHunt: "Find a pictured target",
  missingLetter: "Complete one letter", rhymePair: "Match rhyming words",
  compoundPicture: "Combine pictured words", pictureSearch: "Find a picture",
  wordBuild: "Build a word", wordComplete: "Complete part of a word",
  pictureSound: "Choose a picture", wordMeaning: "Match word meaning",
  FIRST_SOUND: "Identify the first sound", LAST_SOUND: "Identify the last sound",
  SYLLABLE_COUNT: "Count syllables", RHYME_MATCH: "Match rhyming words",
  HFW_SENTENCE_CLOZE: "Choose a word in a sentence", HFW_SENTENCE_SPELL: "Spell a word in a sentence",
  WORD_TO_PICTURE: "Match a written word and picture", PICTURE_TO_WORD: "Choose a written word",
  SOUND_TO_LETTER: "Match a sound to a letter", LETTER_TO_SOUND: "Match a letter to a sound"
});

const text = value => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
// Multi-select snapshots may contain several saved answer labels. Never expose
// object identifiers or stringify an arbitrary payload as a child's response.
const answerText = value => Array.isArray(value) ? value.map(text).filter(Boolean).join(", ") : text(value);
const words = value => text(value).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
const targetLabel = value => text(value).replace(/[_.]+/g, " ");
const list = value => Array.isArray(value) ? value : [];
const countFields = () => ({ presented: 0, scored: 0, correct: 0, incorrect: 0, supported: 0, mediaFailed: 0, unscored: 0 });

export function learningEvidenceResponseSummary(counts) {
  return [
    counts.scored ? `${counts.correct} of ${counts.scored} independent responses correct` : "No independent scored responses recorded",
    counts.supported ? `${counts.supported} supported` : "",
    counts.mediaFailed ? `${counts.mediaFailed} unavailable media` : "",
    counts.unscored ? `${counts.unscored} unscored` : ""
  ].filter(Boolean).join("; ") + ".";
}

export function learningEvidenceFormatLabel(value) {
  const format = formatFamily(value);
  return FORMAT_LABELS[format] || words(format) || "Format not recorded";
}

function formatFamily(value) {
  const format = text(value);
  if (/^HFW_SENTENCE_CLOZE(?:_|$)/i.test(format)) return "HFW_SENTENCE_CLOZE";
  if (/^HFW_SENTENCE_SPELL(?:_|$)/i.test(format)) return "HFW_SENTENCE_SPELL";
  return format;
}

export function learningEvidenceResponseKind(record, source = "assessment", administrationStatus = "") {
  if (["not_scorable", "not_administered"].includes(administrationStatus)) return "unscored";
  const status = text(record.responseStatus).toLowerCase();
  const evidence = record.evidence || record.metadata?.evidence || {};
  if (status === "media_failed" || (record.audioRequired === true && record.audioDelivery !== "delivered")
    || (evidence.audioRequired === true && evidence.audioDelivered === false)) return "mediaFailed";
  if (["transfer", "guided"].includes(record.presentationRole) || ["formative_transfer_after_teaching", "supported_practice"].includes(record.evidenceUse)) return "supported";
  if (["supported", "self_corrected"].includes(status) || !isIndependentOutcome({ evidence })) return "supported";
  // An explicit unscored state always wins over an older Boolean flag.
  if (status && !["correct", "incorrect"].includes(status)) return "unscored";
  if (!status && source !== "assessment") return "unscored";
  if (status === "correct" || status === "incorrect") return status;
  if (record.isCorrect === true) return "correct";
  if (record.isCorrect === false) return "incorrect";
  return "unscored";
}

function addResponse(counts, kind) {
  counts.presented += 1;
  counts[kind] += 1;
  if (["correct", "incorrect"].includes(kind)) counts.scored += 1;
}

function instructionFor(construct, target) {
  const area = words(construct);
  const focus = target ? `“${target}”` : "the recorded target";
  if (/spoken word picture|word meaning|vocabulary/.test(area)) return `Name and explain ${focus} with a clear picture, then ask for it among different pictures without a model.`;
  if (/initial grapheme completion|medial grapheme completion|final grapheme completion|phoneme completion|medial vowel completion|missing letter/.test(area)) return `Say ${focus}, stretch its sounds, and model the missing letter. Check a fresh word with the same sound position; the supplied letters are support.`;
  if (/initial sound|initial phoneme|first sound|final sound|ending sound|last sound/.test(area)) return `Model the ${/final|ending|last/.test(area) ? "last" : "first"} sound for ${focus} using a pictured word. Compare it with the recorded response, then try the sound in a fresh pictured word.`;
  if (/rhyme|rhyming/.test(area)) return `Say the pictured words aloud and compare their endings. Model one rhyme for ${focus}, then check with a different pair.`;
  if (/syllable/.test(area)) return `Say ${focus} naturally and tap its spoken beats. Model once, then check a fresh word without tapping for the student.`;
  if (/letter match|letter pair|letter name|visual letter/.test(area)) return `Name ${focus} and match its upper- and lowercase forms. Check again with the letter in a different position.`;
  if (/auditory word recognition|high frequency word matching/.test(area)) return `Link the spoken word ${focus} to its printed letters, explaining any unexpected spelling. Check again with the required spoken cue and fresh answer positions; this checks matching, not independent decoding.`;
  if (/sight word|high frequency/.test(area)) return `Map the sounds in ${focus} to its letters and explain any unexpected spelling. Remove the model, then revisit the word in a fresh example.`;
  if (/word in context/.test(area)) return `Read the sentence and discuss which word fits its meaning and grammar. Use ${focus} in another sentence, then check a fresh sentence without supplying the missing word.`;
  if (/letter sound|grapheme|phonics|phoneme/.test(area)) return `Model the sound–letter link for ${focus}. Contrast the recorded choices, then check a different word using the same link.`;
  if (/spell|encoding|word build/.test(area)) return `Say ${focus}, segment its sounds, and map each sound to letters. Remove the model and check a fresh word using the same pattern.`;
  if (/blend|decod|vowel|word recognition|word reading|sight word/.test(area)) return `Model sounding out ${focus} and blending the sounds. Then check a fresh decodable word using the same pattern without a spoken model.`;
  if (/compound/.test(area)) return `Name the two pictured words and join their meanings. Model ${focus}, then check a different compound word.`;
  if (/sentence|syntax|grammar|punctuation/.test(area)) return `Read the sentence aloud, explain the part being checked, and model the change. Ask the student to apply it in a fresh sentence.`;
  if (/comprehension|infer|sequence|verbal reasoning/.test(area)) return `Return to the recorded text or picture and ask what supports the answer. Model the reasoning, then check it with a fresh example.`;
  return `Model ${focus}, discuss the recorded response, and check a fresh example without giving the answer.`;
}

function nextAction(row) {
  const example = row.exampleWords[0] || row.label;
  if (row.incorrect > 0) return instructionFor(row.construct, example);
  if (row.supported > 0 && /grapheme_completion|phoneme_completion|medial_vowel_completion/.test(row.construct)) return instructionFor(row.construct, example);
  if (row.supported > 0) return `Revisit ${row.label}, then remove the model or hint and collect a fresh independent response.`;
  if (row.mediaFailed > 0) return `Restore and replay the required media for ${row.label} before checking again. This is missing evidence, not a learning error.`;
  if (row.unscored > 0) return `Collect a scored response for ${row.label}; this record does not establish a correct or incorrect answer.`;
  return `Check ${row.label} in a fresh example or another suitable question format to see whether the response transfers.`;
}

export function buildLearningEvidenceProfile(records = [], { source = "assessment", skillId = "", administrationStatus = "" } = {}) {
  const totals = countFields();
  const targets = new Map();
  const formats = new Map();
  const identities = new Set();
  let identifiedPresentations = 0;
  for (const record of list(records).filter(row => row && typeof row === "object")) {
    const kind = learningEvidenceResponseKind(record, source, administrationStatus);
    addResponse(totals, kind);
    const construct = text(record.evidenceConstruct || record.construct || record.itemType || record.skillId || skillId);
    const target = text(record.itemKey || record.diagnosticTarget || record.targetPattern || record.targetSound || record.targetLetter || record.targetWord);
    const format = formatFamily(record.responseFormat || record.formatType || record.templateType || record.mechanicId);
    const identity = text(record.semanticKey || record.questionId) || (target && format ? JSON.stringify([construct, target, format, record.targetWord, record.prompt]) : "");
    if (identity) {
      identities.add(identity);
      identifiedPresentations += 1;
    }
    if (format) {
      const row = formats.get(format) || { key: format, label: learningEvidenceFormatLabel(format), ...countFields() };
      addResponse(row, kind);
      formats.set(format, row);
    }
    const key = JSON.stringify([construct, target]);
    const row = targets.get(key) || {
      key, label: targetLabel(target) || "Target not recorded", construct, constructLabel: words(construct) || "Skill not recorded",
      targetRecorded: Boolean(target), exampleWords: [], formatLabels: [], confusions: [], recordedResponses: [], ...countFields()
    };
    addResponse(row, kind);
    const exampleWord = text(record.targetWord);
    if (exampleWord && !row.exampleWords.includes(exampleWord)) row.exampleWords.push(exampleWord);
    const formatLabel = format ? learningEvidenceFormatLabel(format) : "";
    if (formatLabel && !row.formatLabels.includes(formatLabel)) row.formatLabels.push(formatLabel);
    // Describe a saved contrast, never infer a misconception from a score.
    const selected = answerText(record.selectedAnswer ?? record.selected ?? record.responseText);
    const expected = answerText(record.correctAnswer ?? record.expectedResponse);
    if (["incorrect", "supported"].includes(kind) && selected) {
      const response = row.recordedResponses.find(entry => entry.selected === selected && entry.kind === kind);
      if (response) response.count += 1;
      else row.recordedResponses.push({ selected, kind, count: 1 });
    }
    if (kind === "incorrect" && selected && expected && selected !== expected) {
      const contrast = row.confusions.find(entry => entry.selected === selected && entry.expected === expected);
      if (contrast) contrast.count += 1;
      else row.confusions.push({ selected, expected, count: 1 });
    }
    targets.set(key, row);
  }
  const targetRows = [...targets.values()].map(row => ({ ...row, nextAction: nextAction(row) }));
  const breadth = {
    distinctItems: identities.size,
    distinctTargets: targetRows.filter(row => row.targetRecorded).length,
    distinctFormats: formats.size,
    repeatedPresentations: identifiedPresentations - identities.size,
    itemIdentityMissing: totals.presented - identifiedPresentations
  };
  return {
    source,
    totals: { ...totals, ...breadth },
    targets: targetRows,
    formats: [...formats.values()],
    nextSteps: targetRows.filter(row => row.incorrect || row.supported || row.mediaFailed || row.unscored),
    summary: totals.presented
      ? `${breadth.distinctTargets} recorded target${breadth.distinctTargets === 1 ? "" : "s"}${breadth.distinctFormats ? ` across ${breadth.distinctFormats} question format${breadth.distinctFormats === 1 ? "" : "s"}` : "; question formats not recorded"}. ${learningEvidenceResponseSummary(totals)}`
      : "Question-level evidence not recorded. Target and question-format coverage are unknown.",
    claimBoundary: source === "assessment"
      ? "These are descriptions of saved responses, not separate proficiency judgments. Use the learning status and its evidence requirements in this report."
      : "Practice responses guide the next teaching move. They do not establish formal mastery, retention, or reading fluency."
  };
}
