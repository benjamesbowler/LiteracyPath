// Builds real, playable rounds for the EL Skills Quest from the EL cycle
// curriculum data. Every round has a spoken cue, real choices, and one
// correct answer - mirroring how the EL skills block is taught:
// hear the sound -> find the sound in words -> read quick words -> build words.
import { LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { AUDIO_FILE_PATHS } from "../../data/generated/audioFilePaths.generated.js";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const ALL_GRAPHEMES = Object.keys(LETTER_EXAMPLES).filter(g => g.length <= 2 && g !== "qu");
const COMMON_HFW = ["the", "and", "is", "a", "to", "in", "it", "he", "we", "my"];

export function shuffleItems(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function firstExisting(paths) {
  return paths.find(path => AUDIO_FILE_PATHS.has(path)) || "";
}

// Spoken cue for a grapheme: pure phoneme recordings first, then the
// grapheme bank (digraphs etc.), with the spelling text as speech fallback.
export function graphemeAudioPath(spelling) {
  const clean = String(spelling || "").toLowerCase();
  if (!clean) return "";
  if (clean.length === 1 && VOWELS.has(clean)) {
    return firstExisting([
      `/audio/phonemes/short_${clean}.mp3`,
      `/audio/child-mode/clean-human/graphemes/short_vowels/short_${clean}.mp3`
    ]);
  }
  return firstExisting([
    `/audio/phonemes/${clean}.mp3`,
    `/audio/child-mode/clean-human/graphemes/consonants/${clean}.mp3`,
    `/audio/child-mode/clean-human/graphemes/digraphs_blends/${clean}.mp3`
  ]);
}

export function wordAudioPath(word) {
  const slug = String(word || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return firstExisting([
    `/audio/child-mode/clean-human/words/${slug}.mp3`,
    `/audio/child-mode/words/${slug}.mp3`,
    `/audio/child-mode/clean-human/hfw/${slug}.mp3`,
    `/audio/child-mode/hfw/${slug}.mp3`,
    `/guided-reading/audio/words/${slug}.mp3`,
    `/audio/vocabulary/${slug}.mp3`
  ]);
}

function focusEntries(cycle) {
  if (cycle.focusLetters?.length) {
    return cycle.focusLetters.map(item => ({
      grapheme: item.grapheme || item.spelling,
      sound: item.sound || "",
      spelling: (item.spelling || "").toLowerCase()
    }));
  }
  // Review/wrap-up cycles: sample from the letters under review.
  return shuffleItems(cycle.reviewLetters || []).slice(0, 4).map(label => ({
    grapheme: label,
    sound: "",
    spelling: label.replace(/[^a-zA-Z]/g, "").slice(0, label.length > 2 ? 2 : 1).toLowerCase()
  }));
}

function distractorGraphemes(correct, count) {
  return shuffleItems(ALL_GRAPHEMES.filter(g => g !== correct)).slice(0, count);
}

function exampleWordsFor(spelling, limit = 4) {
  return (LETTER_EXAMPLES[spelling] || []).slice(0, limit);
}

// Station 1 - Sound Catch: hear the sound, tap the matching letter tile.
function buildSoundRounds(cycle) {
  return focusEntries(cycle).map(entry => ({
    type: "sound",
    audio: graphemeAudioPath(entry.spelling),
    speechFallback: entry.spelling,
    prompt: "Tap the letter that makes this sound.",
    display: "",
    choices: shuffleItems([entry.spelling, ...distractorGraphemes(entry.spelling, 2)]),
    answer: entry.spelling,
    choiceStyle: "letter"
  }));
}

// Station 2 - Sound Hunt: which picture starts with the sound?
function buildHuntRounds(cycle) {
  return focusEntries(cycle)
    .filter(entry => exampleWordsFor(entry.spelling).length)
    .map(entry => {
      const answer = shuffleItems(exampleWordsFor(entry.spelling))[0];
      const others = shuffleItems(
        ALL_GRAPHEMES.filter(g => g !== entry.spelling).flatMap(g => exampleWordsFor(g, 1))
      ).slice(0, 2);
      return {
        type: "hunt",
        audio: graphemeAudioPath(entry.spelling),
        speechFallback: entry.spelling,
        prompt: "Which one starts with this sound?",
        display: "",
        choices: shuffleItems([answer, ...others]),
        answer,
        choiceStyle: "picture"
      };
    });
}

// Station 3 - Quick Words: hear the high-frequency word, tap it.
function buildQuickWordRounds(cycle) {
  const hfw = (cycle.highFrequencyWords || []).slice(0, 4);
  return hfw.map(word => {
    const distractors = shuffleItems([
      ...hfw.filter(item => item !== word),
      ...COMMON_HFW.filter(item => item !== word && !hfw.includes(item))
    ]).slice(0, 3);
    return {
      type: "quick",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: "Listen, then tap the word.",
      display: "",
      choices: shuffleItems([word, ...distractors]),
      answer: word,
      choiceStyle: "word"
    };
  });
}

// Station 4 - Word Build: build a word that uses a focus letter.
function buildWordBuildRounds(cycle) {
  const candidates = focusEntries(cycle)
    .flatMap(entry => exampleWordsFor(entry.spelling))
    .filter(word => word.length >= 2 && word.length <= 4);
  const words = shuffleItems([...new Set(candidates)]).slice(0, 2);
  return words.map(word => ({
    type: "build",
    audio: wordAudioPath(word),
    speechFallback: word,
    prompt: "Build the word you hear.",
    display: "",
    word,
    choiceStyle: "build"
  }));
}

export const STATIONS = [
  { id: "sounds", title: "Sound Catch", subtitle: "Hear it, find it", build: buildSoundRounds },
  { id: "hunt", title: "Sound Hunt", subtitle: "Pictures and first sounds", build: buildHuntRounds },
  { id: "quick", title: "Quick Words", subtitle: "Words you just know", build: buildQuickWordRounds },
  { id: "build", title: "Word Build", subtitle: "Make it yourself", build: buildWordBuildRounds },
  { id: "check", title: "Cycle Check", subtitle: "Show what you know", build: null }
];

export function buildStationRounds(cycle, stationId) {
  if (stationId === "check") {
    const everything = [
      ...buildSoundRounds(cycle),
      ...buildHuntRounds(cycle),
      ...buildQuickWordRounds(cycle),
      ...buildWordBuildRounds(cycle)
    ];
    return shuffleItems(everything).slice(0, 6);
  }
  const station = STATIONS.find(item => item.id === stationId);
  const rounds = station?.build ? station.build(cycle) : [];
  return rounds.length ? rounds : buildSoundRounds(cycle);
}

export function starsForAccuracy(correct, total, wrongs) {
  if (!total) return 0;
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
