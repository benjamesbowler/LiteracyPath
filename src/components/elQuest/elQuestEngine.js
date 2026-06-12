// Builds real, playable rounds for the EL Skills Quest from the EL cycle
// curriculum data. Every round has a spoken cue, real choices, and one
// correct answer - mirroring how the EL skills block is taught:
// hear the sound -> find the sound in words -> read quick words -> build words.
import { LETTER_EXAMPLES } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
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
  // Entries can be plain strings or {grapheme, spelling} objects.
  return shuffleItems(cycle.reviewLetters || []).slice(0, 4).map(item => {
    const label = typeof item === "string"
      ? item
      : String(item?.spelling || item?.grapheme || "");
    return {
      grapheme: label,
      sound: "",
      spelling: label.replace(/[^a-zA-Z]/g, "").slice(0, label.length > 2 ? 2 : 1).toLowerCase()
    };
  }).filter(entry => entry.spelling);
}

function distractorGraphemes(correct, count) {
  return shuffleItems(ALL_GRAPHEMES.filter(g => g !== correct)).slice(0, count);
}

function exampleWordsFor(spelling, limit = 4) {
  return (LETTER_EXAMPLES[spelling] || []).slice(0, limit);
}

// Station - Letter Spot: match big and small letters.
const SINGLE_LETTERS = ALL_GRAPHEMES.filter(g => g.length === 1);
function buildLetterRounds(cycle) {
  const singles = focusEntries(cycle).filter(entry => entry.spelling.length === 1);
  const rounds = singles.flatMap(entry => {
    const lower = entry.spelling;
    const upper = lower.toUpperCase();
    const others = shuffleItems(SINGLE_LETTERS.filter(g => g !== lower)).slice(0, 2);
    return [
      {
        type: "letter",
        audio: graphemeAudioPath(lower),
        speechFallback: lower,
        prompt: `This is big ${upper}. Find its small letter.`,
        display: upper,
        choices: shuffleItems([lower, ...others]),
        answer: lower,
        choiceStyle: "letter"
      },
      {
        type: "letter",
        audio: graphemeAudioPath(lower),
        speechFallback: lower,
        prompt: `This is small ${lower}. Find its big letter.`,
        display: lower,
        choices: shuffleItems([upper, ...others.map(g => g.toUpperCase())]),
        answer: upper,
        choiceStyle: "letter"
      }
    ];
  });
  return rounds.length ? rounds : buildSoundRounds(cycle);
}

// Station - Sound Catch: hear the sound, tap the matching letter tile.
function buildSoundRounds(cycle) {
  // Two passes per focus sound with fresh distractors each time.
  return focusEntries(cycle).flatMap(entry => [0, 1].map(() => ({
    type: "sound",
    audio: graphemeAudioPath(entry.spelling),
    speechFallback: entry.spelling,
    prompt: "Tap the letter that makes this sound.",
    display: "",
    choices: shuffleItems([entry.spelling, ...distractorGraphemes(entry.spelling, 2)]),
    answer: entry.spelling,
    choiceStyle: "letter"
  })));
}

// Station - Sound Hunt: which picture starts with the sound?
function buildHuntRounds(cycle) {
  return focusEntries(cycle)
    .filter(entry => exampleWordsFor(entry.spelling).length)
    .flatMap(entry => {
      const answers = shuffleItems(exampleWordsFor(entry.spelling)).slice(0, 2);
      return answers.map(answer => {
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
    });
}

// Station - Quick Words: hear the high-frequency word, tap it.
function buildQuickWordRounds(cycle) {
  const own = cycle.highFrequencyWords || [];
  const review = COMMON_HFW.filter(w => !own.includes(w)).slice(0, Math.max(0, 6 - own.length));
  const hfw = [...own, ...review].slice(0, 6);
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

// Station - Word Build: build a word that uses a focus letter.
function buildWordBuildRounds(cycle) {
  const candidates = focusEntries(cycle)
    .flatMap(entry => exampleWordsFor(entry.spelling))
    .filter(word => word.length >= 2 && word.length <= 5);
  const words = shuffleItems([...new Set(candidates)]).slice(0, 4);
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

// Station - Word Play: change the first sound, take it away, join words.
const COMPOUND_WORDS = [
  ["sun", "set"], ["star", "fish"], ["cup", "cake"], ["pan", "cake"],
  ["back", "pack"], ["pop", "corn"], ["bed", "time"], ["sand", "box"],
  ["rain", "coat"], ["dog", "house"]
];

function uniqueChoices(items) {
  return [...new Set(items)];
}

function buildWordPlayRounds(cycle) {
  const rounds = [];
  const focusWords = uniqueChoices(
    focusEntries(cycle).flatMap(entry => exampleWordsFor(entry.spelling))
  ).filter(word => /^[a-z]{2,5}$/.test(word));
  const allWords = uniqueChoices(Object.values(LETTER_EXAMPLES).flat())
    .filter(word => /^[a-z]{2,5}$/.test(word));

  // Change the first sound: same rime, different onset.
  for (const word of shuffleItems(focusWords)) {
    const partner = allWords.find(other =>
      other !== word && other.slice(1) === word.slice(1) && other[0] !== word[0]);
    if (!partner || !wordAudioPath(partner)) continue;
    const decoy = shuffleItems(allWords.filter(o => o !== word && o !== partner))[0];
    const choices = uniqueChoices([partner, word, decoy]);
    if (choices.length < 3) continue;
    rounds.push({
      type: "play",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: `Change the first sound of "${word}". Which new word can you make?`,
      display: word,
      choices: shuffleItems(choices),
      answer: partner,
      choiceStyle: "word"
    });
    if (rounds.length >= 2) break;
  }

  // Take the first sound away.
  for (const word of shuffleItems(focusWords)) {
    const rest = word.slice(1);
    if (rest.length < 2) continue;
    const choices = uniqueChoices([rest, word.slice(0, 2), word[0] + word.slice(-1)]);
    if (choices.length < 3) continue;
    rounds.push({
      type: "play",
      audio: wordAudioPath(word),
      speechFallback: word,
      prompt: `Take the first sound away from "${word}". What is left?`,
      display: word,
      choices: shuffleItems(choices),
      answer: rest,
      choiceStyle: "word"
    });
    break;
  }

  // Join two small words into one big compound word.
  const pair = shuffleItems(COMPOUND_WORDS).find(([a, b]) => wordAudioPath(a + b));
  if (pair) {
    const full = pair[0] + pair[1];
    const decoys = shuffleItems(
      COMPOUND_WORDS.filter(p => p !== pair).map(([a, b]) => a + b)
    ).slice(0, 2);
    rounds.push({
      type: "play",
      audio: wordAudioPath(full),
      speechFallback: full,
      prompt: `"${pair[0]}" and "${pair[1]}" join to make one big word. Which is it?`,
      display: `${pair[0]} + ${pair[1]}`,
      choices: shuffleItems([full, ...decoys]),
      answer: full,
      choiceStyle: "word"
    });
  }

  return rounds.length ? rounds : buildQuickWordRounds(cycle);
}

// Station - Poem Time: read the cycle poem, then find words inside it.
function buildPoemRounds(cycle) {
  const poem = EL_CYCLE_POEMS.find(p => p.cycle === cycle.cycleNumber);
  if (!poem) return buildQuickWordRounds(cycle);
  const text = poem.lines.join("\n");
  const poemWords = uniqueChoices(
    text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 1)
  );
  return poem.findWords.map(word => ({
    type: "poem",
    audio: wordAudioPath(word),
    speechFallback: word,
    prompt: `Read the poem, then tap the word "${word}".`,
    display: text,
    poem: true,
    poemTitle: poem.title,
    choices: shuffleItems([word, ...shuffleItems(poemWords.filter(w => w !== word)).slice(0, 3)]),
    answer: word,
    choiceStyle: "word"
  }));
}

// Station - Letter Trace: write the focus letters with a finger.
function buildTraceRounds(cycle) {
  const rounds = focusEntries(cycle)
    .filter(entry => entry.spelling.length <= 2)
    .map(entry => ({
      type: "trace",
      audio: graphemeAudioPath(entry.spelling),
      speechFallback: entry.spelling,
      prompt: "Trace the letter with your finger.",
      display: "",
      letter: entry.spelling.length === 1
        ? `${entry.spelling.toUpperCase()}${entry.spelling}`
        : entry.spelling,
      choiceStyle: "trace"
    }));
  return rounds.length ? rounds : buildLetterRounds(cycle);
}

export const STATIONS = [
  { id: "letters", title: "Letter Spot", subtitle: "Big and small letters", build: buildLetterRounds },
  { id: "sounds", title: "Sound Catch", subtitle: "Hear it, find it", build: buildSoundRounds },
  { id: "hunt", title: "Sound Hunt", subtitle: "Pictures and first sounds", build: buildHuntRounds },
  { id: "quick", title: "Quick Words", subtitle: "Words you just know", build: buildQuickWordRounds },
  { id: "build", title: "Word Build", subtitle: "Make it yourself", build: buildWordBuildRounds },
  { id: "play", title: "Word Play", subtitle: "Change it, shrink it, join it", build: buildWordPlayRounds },
  { id: "poem", title: "Poem Time", subtitle: "Read it, find the words", build: buildPoemRounds },
  { id: "trace", title: "Letter Trace", subtitle: "Write it with your finger", build: buildTraceRounds },
  { id: "check", title: "Cycle Check", subtitle: "Show what you know", build: null }
];

export function buildStationRounds(cycle, stationId) {
  if (stationId === "check") {
    const everything = [
      ...buildLetterRounds(cycle),
      ...buildSoundRounds(cycle),
      ...buildHuntRounds(cycle),
      ...buildQuickWordRounds(cycle),
      ...buildWordBuildRounds(cycle),
      ...buildWordPlayRounds(cycle)
    ];
    return shuffleItems(everything).slice(0, 10);
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
