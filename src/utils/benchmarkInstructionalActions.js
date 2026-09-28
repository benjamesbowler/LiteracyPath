import { EL_BENCHMARK_IDS } from "../data/elBenchmarkAssessmentCatalog.js";

const SOUND_ACTIONS = Object.freeze({
  rhyme: "Say pairs of familiar words aloud. Model how the endings match, then ask for a new rhyming word.",
  syllables: "Say familiar words slowly and move one counter for each syllable; blend the parts back together.",
  syllable: "Say familiar words slowly and move one counter for each syllable; blend the parts back together.",
  onset_rime: "Join the first sound to the rest of a spoken word, then gradually shorten the pause between them.",
  phoneme_isolation: "Say a short word and attend to one sound position at a time: first, last, then middle.",
  phoneme_blending: "Model continuous oral blending with two or three sounds. Let the student join the sounds in fresh words.",
  phoneme_segmentation: "Use counters for the individual sounds in a short spoken word, then blend it again. Count sounds, not letters.",
  phoneme_deletion: "Use counters to represent a spoken word; remove the requested sound and say what remains.",
  phoneme_substitution: "Represent a spoken word with counters. Change one sound, then blend the new word.",
  deletion: "Use counters to represent a spoken word; remove the requested sound and say what remains.",
  substitution: "Represent a spoken word with counters. Change one sound, then blend the new word."
});

function observedRecords(records) {
  return records.filter(record => record.administrationStatus === "administered"
    && !["not_scorable", "not_administered"].includes(record.responseStatus)
    && !record.validationIssues?.length
    && record.excludedFromScoring !== true
    && record.afterStop !== true);
}

function examples(records) {
  const words = [...new Set(records.map(record => record.targetWord).filter(Boolean))].slice(0, 3);
  return words.length ? ` Observed words: ${words.join(", ")}.` : "";
}

/** Teaching suggestions describe this attempt, never a mastery or placement decision. */
export function benchmarkInstructionalActions({ assessmentId, questionRecords = [], scoringSuppressed = false } = {}) {
  if (scoringSuppressed) return [];
  const records = observedRecords(questionRecords);
  const scored = records.filter(record => typeof record.isCorrect === "boolean");
  const errors = scored.filter(record => record.isCorrect === false);
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    const strands = [...new Set(errors.map(record => record.strand).filter(Boolean))];
    return strands.slice(0, 3).map(strand => {
      const count = errors.filter(record => record.strand === strand).length;
      return `${strand.replaceAll("_", " ")}: ${count} observed response${count === 1 ? " needs" : "s need"} follow-up. ${SOUND_ACTIONS[strand] || "Model this oral task, practise with fresh words, and check an independent response."} Keep print out of the sound-awareness practice.`;
    });
  }
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) {
    const plausible = errors.filter(record => record.plausible === true);
    const soundMapping = errors.filter(record => record.plausible === false && record.responseStatus !== "no_response");
    const actions = [];
    if (plausible.length) actions.push(`${plausible.length} spelling${plausible.length === 1 ? " represents" : "s represent"} the sounds but is not conventional. Compare the student's attempt with the target spelling after the assessment, identify the spelling choice, then practise the same pattern in fresh words.${examples(plausible)}`);
    if (soundMapping.length) actions.push(`Revisit sound-to-letter mapping: say a short word, segment every sound, choose the letters, then read the spelling back. Use the recorded response to locate the missing or changed sound.${examples(soundMapping)}`);
    if (errors.some(record => record.responseStatus === "no_response")) actions.push("Follow up words with no response in a short, untimed dictation task. Establish whether the difficulty was hearing the word, segmenting it, selecting letters, or writing them before choosing practice.");
    if (errors.some(record => record.plausible === null)) actions.push("Review the recorded spellings and judge whether they represent the spoken sounds before choosing between sound mapping and spelling-pattern practice.");
    return actions.slice(0, 3);
  }
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    const soundedOut = scored.filter(record => record.isCorrect && record.automatic === false);
    const actions = [];
    if (errors.length) actions.push(`Revisit the letter-sound pattern in the recorded errors. Model blending, then check fresh words with the same pattern without pictures or spoken answers.${examples(errors)}`);
    if (soundedOut.length) actions.push(`${soundedOut.length} word${soundedOut.length === 1 ? " was" : "s were"} read accurately with sounding out. Use short, spaced rereading practice followed by fresh words with the same pattern; encourage accuracy without a speed target.${examples(soundedOut)}`);
    return actions;
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    const passages = records.filter(record => record.routeJudgmentUsable === true);
    if (!passages.length) return [];
    const actions = [];
    if (passages.some(record => Number(record.errors) > 0)) actions.push("After the assessment, revisit the words read inaccurately and practise their spelling patterns. Then reread a suitable short passage to bring accurate word reading into connected text.");
    const observedProsody = passages.filter(record => Object.keys(record.prosody?.dimensions || {}).length);
    if (observedProsody.length) actions.push("Use the recorded expression, phrasing, smoothness and pace observations to choose a focus. Model one sentence, echo-read it together, then listen to an independent rereading; prioritise meaning and phrasing over faster reading.");
    if (passages.some(record => Number(record.selfCorrections) > 0)) actions.push("Acknowledge the student's self-corrections. Practise checking that what they read matches the print, then returning to the start of the phrase to keep the meaning clear.");
    return actions;
  }
  return [];
}
