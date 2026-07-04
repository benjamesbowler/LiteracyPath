// Builds real, playable rounds for the EL Skills Quest from the EL cycle
// curriculum data. Every round has a spoken cue, real choices, and one
// correct answer - mirroring how the EL skills block is taught:
// hear the sound -> find the sound in words -> read quick words -> build words.
import { LETTER_EXAMPLES, elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { EL_CYCLE_POEMS } from "../../data/elCyclePoems.js";
import { QUEST_STORY_QUESTIONS, VERIFIED_PICTURE_WORDS } from "../../data/generated/questStoryQuestions.generated.js";
import { AUDIO_FILE_PATHS } from "../../data/generated/audioFilePaths.generated.js";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const ALL_GRAPHEMES = Object.keys(LETTER_EXAMPLES).filter(g => g.length <= 2 && g !== "qu");

// Words a child has been TAUGHT by the end of a given cycle - review and
// distractor words must never run ahead of the curriculum.
function taughtHfwThrough(cycleNumber) {
  const words = [];
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const word of cycle.highFrequencyWords || []) {
      const clean = word.toLowerCase();
      if (!words.includes(clean)) words.push(clean);
    }
  }
  return words;
}

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

// Distractor letters come from material the child has already met where
// possible, so early cycles never test against never-seen letters.
function taughtGraphemesThrough(cycleNumber) {
  const taught = [];
  for (const cycle of elSkillsBlockCycles) {
    if (!cycle.cycleNumber || cycle.cycleNumber > cycleNumber) continue;
    for (const item of cycle.focusLetters || []) {
      const spelling = (item.spelling || "").toLowerCase();
      if (spelling && spelling.length <= 2 && !taught.includes(spelling)) taught.push(spelling);
    }
  }
  return taught;
}

function distractorGraphemes(correct, count, cycleNumber) {
  const taught = cycleNumber
    ? taughtGraphemesThrough(cycleNumber).filter(g => g !== correct)
    : [];
  const pool = taught.length >= count
    ? taught
    : [...new Set([...taught, ...ALL_GRAPHEMES.filter(g => g !== correct)])];
  return shuffleItems(pool.filter(g => g !== correct)).slice(0, count);
}

// Pattern spellings without their own example list borrow real recorded
// words that contain the pattern, so their rounds always have a word cue.
const PATTERN_EXAMPLES = {
  ang: ["bang", "sang"],
  ing: ["ring", "sing", "king"],
  ong: ["song", "long"],
  ung: ["hung"],
  ff: ["puff", "off"],
  ss: ["miss", "grass"],
  zz: ["buzz"],
  ll: ["ball", "fall", "call", "bell"]
};

function exampleWordsFor(spelling, limit = 4) {
  const own = LETTER_EXAMPLES[spelling] || [];
  const list = own.length ? own : (PATTERN_EXAMPLES[spelling] || []);
  return list.slice(0, limit);
}

const PICTURE_WORDS = new Set(VERIFIED_PICTURE_WORDS);
function hasPicture(word) {
  return PICTURE_WORDS.has(String(word || "").toLowerCase());
}

function pictureWordsFor(spelling, limit = 4) {
  const all = LETTER_EXAMPLES[spelling] || [];
  const withImages = all.filter(hasPicture);
  return (withImages.length ? withImages : all).slice(0, limit);
}

// Station - Letter Spot: match big and small letters. The cue speaks the
// letter's NAME (ay, bee...), matching the "This is big A" prompt.
function letterNameAudioPath(letter) {
  return firstExisting([`/audio/letter-names/${letter}.mp3`]) || graphemeAudioPath(letter);
}

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
        audio: letterNameAudioPath(lower),
        speechFallback: lower,
        prompt: `This is big ${upper}. Find its small letter.`,
        display: upper,
        choices: shuffleItems([lower, ...others]),
        answer: lower,
        choiceStyle: "letter"
      },
      {
        type: "letter",
        audio: letterNameAudioPath(lower),
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
  // Two passes per focus sound with fresh distractors each time. Pattern
  // sounds without a recorded phoneme cue with a real word instead.
  return focusEntries(cycle).flatMap(entry => [0, 1].map(() => {
    const phoneme = graphemeAudioPath(entry.spelling);
    const exampleWord = shuffleItems(exampleWordsFor(entry.spelling))[0] || "";
    const wordCue = exampleWord ? wordAudioPath(exampleWord) : "";
    return {
      type: "sound",
      audio: phoneme || wordCue,
      speechFallback: "",
      prompt: phoneme
        ? "Tap the letter that makes this sound."
        : `Listen to the word. Tap the letters you hear in "${exampleWord}".`,
      display: "",
      choices: shuffleItems([entry.spelling, ...distractorGraphemes(entry.spelling, 2, cycle.cycleNumber)]),
      answer: entry.spelling,
      choiceStyle: "letter"
    };
  }));
}

// Station - Sound Hunt: which picture starts with the sound?
function buildHuntRounds(cycle) {
  return focusEntries(cycle)
    .filter(entry => pictureWordsFor(entry.spelling).length)
    .flatMap(entry => {
      const answers = shuffleItems(pictureWordsFor(entry.spelling)).slice(0, 2);
      return answers.map(answer => {
        const others = shuffleItems(
          ALL_GRAPHEMES.filter(g => g !== entry.spelling).flatMap(g => pictureWordsFor(g, 1))
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
// Review words and distractors only come from cycles already taught.
function buildQuickWordRounds(cycle) {
  const own = (cycle.highFrequencyWords || []).map(w => w.toLowerCase());
  const taught = taughtHfwThrough(cycle.cycleNumber || 1);
  const earlier = taught.filter(w => !own.includes(w));
  const review = shuffleItems(earlier).slice(0, Math.max(0, 6 - own.length));
  const hfw = [...own, ...review].slice(0, 6);
  // Early cycles with few taught words: practise each word twice instead.
  const sequence = hfw.length >= 4 ? hfw : [...hfw, ...hfw];
  return sequence.map(word => {
    const distractors = shuffleItems([
      ...hfw.filter(item => item !== word),
      ...earlier.filter(item => item !== word && !hfw.includes(item))
    ]).slice(0, Math.min(3, Math.max(1, hfw.length - 1 + earlier.length)));
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
    // Only clean 2-5 letter words: a single letter or a stray space would
    // render the wrong number of boxes and make the round impossible to pass.
    .filter(word => /^[a-z]{2,5}$/.test(word));
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
  // v2 = the gold re-record matching the rewritten character poems. Until those
  // files exist the round just cues the target word (the old v1 audio voiced the
  // previous poems, so we must NOT play it - it would say the wrong words).
  const narration = `/audio/learn-games/poems/v2/cycle-${String(cycle.cycleNumber).padStart(2, "0")}.mp3`;
  const poemAudio = AUDIO_FILE_PATHS.has(narration) ? narration : "";
  return poem.findWords.map(word => ({
    type: "poem",
    audio: poemAudio || wordAudioPath(word),
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

// Station - Story Stop: who-did-what questions from the world's own books.
function buildStoryRounds(cycle) {
  const n = cycle.cycleNumber || 1;
  const world = n >= 19 ? "moonwood" : n >= 10 ? "dino" : "meadow";
  const bank = QUEST_STORY_QUESTIONS[world];
  if (!bank?.questions?.length) return buildQuickWordRounds(cycle);
  const picks = shuffleItems(bank.questions).slice(0, 4);
  return picks.map(item => {
    const decoys = shuffleItems(bank.names.filter(name => name !== item.answer)).slice(0, 2);
    return {
      type: "story",
      audio: "",
      speechFallback: "",
      prompt: item.prompt,
      display: "",
      choices: shuffleItems([item.answer, ...decoys]),
      answer: item.answer,
      choiceStyle: "word"
    };
  });
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

// ── Fluency & Patterns games (cycles 25-27: no new letters) ──────────────────
// These wrap-up cycles consolidate reading fluency, spelling patterns, sight
// words and poems instead of teaching new letter-sounds, so they get their own
// set of games. Every word is decodable / already taught by this point.

// Curated spelling-pattern families. The child sorts by the PATTERN, not a sound.
const PATTERN_FAMILIES = [
  { label: "end with y", members: ["by", "my", "why", "try", "fly", "sky", "cry", "dry"], decoys: ["sun", "map", "run", "top", "bed", "net"] },
  { label: "end with -ay", members: ["day", "say", "may", "play", "stay", "way"], decoys: ["dog", "sit", "cup", "ten", "mud", "log"] },
  { label: "end with -ll", members: ["ball", "fall", "call", "tall", "bell", "fill"], decoys: ["bat", "mop", "sun", "net", "rug", "pin"] },
  { label: "have -ng", members: ["ring", "king", "song", "bang", "hang", "long"], decoys: ["rat", "pig", "cup", "red", "mud", "tap"] },
  { label: "start with sh", members: ["ship", "shop", "shed", "shell", "shut", "shin"], decoys: ["pig", "top", "run", "bed", "map", "sun"] },
  { label: "end with -ck", members: ["duck", "sock", "kick", "lock", "back", "pick"], decoys: ["dog", "sun", "map", "ten", "bus", "fan"] }
];

// Each fluency cycle leads with the pattern its OWN sight words follow
// (25: again/day/say -> -ay; 26: by/my/why/try -> -y; 27: mixed review),
// then mixes in review families for variety.
const CYCLE_PATTERN_LEADS = {
  25: ["end with -ay", "end with -ll"],
  26: ["end with y", "have -ng"],
  27: ["end with -ck", "start with sh"]
};

function patternFamiliesForCycle(cycle) {
  const leads = (CYCLE_PATTERN_LEADS[cycle?.cycleNumber] || [])
    .map(label => PATTERN_FAMILIES.find(family => family.label === label))
    .filter(Boolean);
  const rest = shuffleItems(PATTERN_FAMILIES.filter(family => !leads.includes(family)));
  return [...leads, ...rest];
}

// Station - Pattern Power: tap EVERY word that fits the pattern (multi-select).
function buildPatternPowerRounds(cycle) {
  return patternFamiliesForCycle(cycle).slice(0, 4).map(family => {
    const fits = shuffleItems(family.members).slice(0, 3);
    const decoys = shuffleItems(family.decoys).slice(0, 3);
    const items = shuffleItems([
      ...fits.map(word => ({ word, fits: true })),
      ...decoys.map(word => ({ word, fits: false }))
    ]);
    return {
      type: "pattern",
      audio: "",
      speechFallback: "",
      prompt: `Tap all the words that ${family.label}.`,
      patternLabel: family.label,
      items,
      choiceStyle: "pattern"
    };
  });
}

// Curated chains where each step changes exactly one letter / sound.
const WORD_CHAINS = [
  ["sat", "sit", "sip", "lip"],
  ["man", "mat", "map", "cap"],
  ["pig", "pin", "pan", "pat"],
  ["hot", "hop", "top", "tap"],
  ["bed", "bad", "bag", "big"],
  ["run", "ran", "rat", "sat"]
];

function changedSlot(from, to) {
  for (let i = 0; i < Math.min(from.length, to.length); i += 1) {
    if (from[i] !== to[i]) return i;
  }
  return -1;
}

// Station - Word Chains: change one sound to turn one word into the next.
// Each cycle draws from its own half of the chain bank so cycles differ.
function buildWordChainRounds(cycle) {
  const n = Number(cycle?.cycleNumber) || 25;
  const offset = ((n - 25) * 2) % WORD_CHAINS.length;
  const pool = [...WORD_CHAINS.slice(offset), ...WORD_CHAINS.slice(0, offset)].slice(0, 4);
  const rounds = [];
  for (const chain of shuffleItems(pool).slice(0, 2)) {
    for (let i = 0; i < chain.length - 1; i += 1) {
      const from = chain[i];
      const to = chain[i + 1];
      const slot = changedSlot(from, to);
      if (slot < 0 || from.length !== to.length) continue;
      const answer = to[slot];
      const distractors = shuffleItems("aeioubdgmnpst".split("")
        .filter(l => l !== answer && l !== from[slot])).slice(0, 2);
      rounds.push({
        type: "chain",
        audio: wordAudioPath(to),
        speechFallback: to,
        prompt: `Change "${from}" into "${to}". Tap the missing letter.`,
        display: to.split("").map((ch, idx) => (idx === slot ? "_" : ch)).join(" "),
        choices: shuffleItems([answer, ...distractors]),
        answer,
        choiceStyle: "letter"
      });
    }
  }
  return rounds;
}

// Station - Speedy Words: read the sight word and tap it fast (gentle timer).
function buildSpeedyWordRounds(cycle) {
  return buildQuickWordRounds(cycle).map(round => ({
    ...round,
    type: "speed",
    prompt: "Read it, then tap the word - be quick!",
    display: round.answer
  }));
}

// Station - Spell It: hear (or read) a sight word and build its spelling.
function buildSpellRounds(cycle) {
  const words = uniqueChoices((cycle.highFrequencyWords || []).map(w => w.toLowerCase()))
    .filter(word => /^[a-z]{2,6}$/.test(word));
  if (!words.length) return buildWordBuildRounds(cycle);
  return words.slice(0, 5).map(word => {
    const audio = wordAudioPath(word);
    return {
      type: "build",
      audio,
      speechFallback: word,
      prompt: audio ? "Spell the word you hear." : "Spell this word.",
      display: audio ? "" : word,
      word,
      choiceStyle: "build"
    };
  });
}

const STANDARD_STATIONS = [
  { id: "letters", title: "Letter Spot", subtitle: "Big and small letters", build: buildLetterRounds },
  { id: "sounds", title: "Sound Catch", subtitle: "Hear it, find it", build: buildSoundRounds },
  { id: "hunt", title: "Sound Hunt", subtitle: "Pictures and first sounds", build: buildHuntRounds },
  { id: "quick", title: "Quick Words", subtitle: "Words you just know", build: buildQuickWordRounds },
  { id: "build", title: "Word Build", subtitle: "Make it yourself", build: buildWordBuildRounds },
  { id: "play", title: "Word Play", subtitle: "Change it, shrink it, join it", build: buildWordPlayRounds },
  { id: "poem", title: "Poem Time", subtitle: "Read it, find the words", build: buildPoemRounds },
  { id: "story", title: "Story Stop", subtitle: "Who did what in our books?", build: buildStoryRounds },
  { id: "trace", title: "Letter Trace", subtitle: "Write it with your finger", build: buildTraceRounds },
  { id: "check", title: "Cycle Check", subtitle: "Show what you know", build: null }
];

// Cycles 25-27 swap the letter-sound games for fluency, pattern and poem games.
const FLUENCY_STATIONS = [
  { id: "pattern", title: "Pattern Power", subtitle: "Sort the word patterns", build: buildPatternPowerRounds },
  { id: "chain", title: "Word Chains", subtitle: "Change one sound", build: buildWordChainRounds },
  { id: "speed", title: "Speedy Words", subtitle: "Read them fast", build: buildSpeedyWordRounds },
  { id: "poem", title: "Poem Play", subtitle: "Read it, find the words", build: buildPoemRounds },
  { id: "spell", title: "Spell It", subtitle: "Build the word", build: buildSpellRounds },
  { id: "check", title: "Cycle Check", subtitle: "Show what you know", build: null }
];

// Backwards-compatible default export (the standard letter-sound set).
export const STATIONS = STANDARD_STATIONS;

// Cycles 25+ have no new focus letters - they are fluency / pattern wrap-ups.
export function isFluencyCycle(cycle) {
  return (cycle?.cycleNumber || 0) >= 25;
}

export function stationsForCycle(cycle) {
  return isFluencyCycle(cycle) ? FLUENCY_STATIONS : STANDARD_STATIONS;
}

export function buildStationRounds(cycle, stationId) {
  if (stationId === "check") {
    const everything = isFluencyCycle(cycle)
      ? [
          ...buildPatternPowerRounds(cycle),
          ...buildWordChainRounds(cycle),
          ...buildSpeedyWordRounds(cycle),
          ...buildSpellRounds(cycle),
          ...buildPoemRounds(cycle)
        ]
      : [
          ...buildLetterRounds(cycle),
          ...buildSoundRounds(cycle),
          ...buildHuntRounds(cycle),
          ...buildQuickWordRounds(cycle),
          ...buildWordBuildRounds(cycle),
          ...buildWordPlayRounds(cycle)
        ];
    return shuffleItems(everything).slice(0, 10);
  }
  const station = [...STANDARD_STATIONS, ...FLUENCY_STATIONS].find(item => item.id === stationId);
  const rounds = station?.build ? station.build(cycle) : [];
  if (rounds.length) return rounds;
  return isFluencyCycle(cycle) ? buildSpeedyWordRounds(cycle) : buildSoundRounds(cycle);
}

export function starsForAccuracy(correct, total, wrongs) {
  if (!total) return 0;
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
