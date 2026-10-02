import { sentenceTiles, shuffled } from "../../../../utils/recognitionPractice.js";
import { gameRandom } from "../../../../utils/gameReplay.js";
import { completeRepairDisplay } from "../../../../utils/repairSentence.js";
import { buildSortRounds } from "../../../../utils/adventureRounds.js";
import { SENTENCES, SENTENCE_FIX } from "../../../../data/learnGamesData.js";
import { getLedaInstructionAudioPath } from "../../../../data/ledaProductionAudio.js";

export const REPAIR_MARK_NAMES = Object.freeze({ ".": "full stop", "?": "question mark", "!": "exclamation mark" });

// Same-tier authored sentence sources already used in these practice games.
// Fresh outings have complete retained cues; saved decks bypass this builder.
export function buildRecordedHopOuting(difficulty = "easy", limit = 10, random = Math.random) {
  const tier = difficulty === "hard" ? "level3" : difficulty === "medium" ? "level2" : "level1";
  const original = SENTENCES[tier];
  const source = [...new Set([...original, ...(SENTENCE_FIX[difficulty] || SENTENCE_FIX.easy).map(fix => fix.say)])]
    .filter(sentence => getLedaInstructionAudioPath(sentence) && new Set(sentenceTiles(sentence).map(tile => tile.word)).size >= 3);
  const [modelSentence, ...targets] = shuffled(source, random);
  return { modelSentence, sentences: targets.slice(0, Math.min(limit, original.length - 1)) };
}

export function factoryChoiceRule(bins) {
  return bins[0].startsWith(bins[1]) || bins[1].startsWith(bins[0]) ? "If both match, use the longer group." : "Tap the matching chute.";
}

export function factoryRetryFeedback(word, target, chosen) {
  // A shorter overlapping prefix is still literally at the start of the
  // word. Explain the selected chute without claiming “ship does not start s”.
  return `${word} starts with ${target}. You chose ${chosen}. Try the ${target} chute.`;
}

// One outing samples reviewed contrasts rather than replaying the entire
// alphabet bank. Each contrast still presents two words for each chute.
export function buildFactoryOuting(difficulty = "easy", random = Math.random) {
  const source = buildSortRounds(difficulty, random);
  const shifts = [...new Set(source.items.map(item => item.shift))].map(shift => source.items.filter(item => item.shift === shift));
  const complex = shifts.filter(items => items.some(item => item.binA.length > 1 || item.binB.length > 1));
  const simple = shifts.filter(items => !complex.includes(items));
  const selected = difficulty === "hard" ? [...complex.slice(0, 4), ...simple.slice(0, 4)]
    : difficulty === "medium" ? [...complex.slice(0, 2), ...simple.slice(0, 4)] : simple.slice(0, 4);
  const items = shuffled(selected, random).flatMap((shiftItems, shift) => {
    const { binA, binB } = shiftItems[0];
    return shuffled([binA, binB].flatMap(bin => shuffled(shiftItems.filter(item => item.bin === bin), random).slice(0, 2)), random).map(item => ({ ...item, shift }));
  });
  return { binA: items[0].binA, binB: items[0].binB, items, shifts: selected.length };
}

export function nextHopWords(sentence, index, seed) {
  const words = sentenceTiles(sentence).map(tile => tile.word);
  const target = words[index];
  if (!target) return [];
  const random = gameRandom(`${seed}:${sentence}:${index}`);
  const foils = shuffled([...new Set(words)].filter(word => word !== target), random).slice(0, 2);
  return shuffled([target, ...foils], random);
}

export function repairPieces(fix, seed, savedOptions) {
  const saved = savedOptions?.map(piece => typeof piece === "string" ? piece : piece?.label);
  return saved?.length === fix.options.length && saved.every(piece => fix.options.includes(piece)) && new Set(saved).size === saved.length
    ? saved : shuffled(fix.options, gameRandom(`${seed}:${fix.display}`));
}

export function repairMeaningClue(fix) {
  // Both “box” and “bus” can be grammatical places for a fox to sit. This
  // story fact disambiguates the existing semantic choice without a giveaway
  // in tile colour/order or silently rejecting a reasonable reading.
  return fix.display === "The fox sat in the ___." ? "The fox is sitting in a cardboard container." : "";
}

export function repairReplayText(fix, answer = "") {
  // A complete canonical sentence gives away its missing piece. Before
  // success replay only the instruction; afterwards use the actual answer.
  return answer ? completeRepairDisplay(fix.display, answer) : fix.prompt;
}

export function repairFeedback(fix, response, accepted) {
  if (accepted) {
    if (fix.kind === "capital") return /Names|Days|Places/.test(fix.prompt) ? `${response} needs a capital because it is a name.` : `${response} begins the sentence with a capital.`;
    if (fix.kind === "end") return response === "?" ? "A question mark finishes a question." : response === "!" ? "An exclamation mark shows strong feeling." : "A full stop finishes this telling sentence.";
    return `“${response}” makes the whole sentence fit.`;
  }
  if (fix.kind === "capital") return /Names|Days|Places/.test(fix.prompt) ? `“${response}” is a name. Its first letter needs a capital; the other letters stay small.` : `“${response}” starts the sentence. Its first letter needs a capital; the other letters stay small.`;
  if (fix.kind === "end") {
    const intent = fix.answer === "?" ? "This sentence asks a question." : fix.answer === "!" ? "This sentence shows strong feeling." : "This is a calm telling sentence.";
    return `You chose a ${REPAIR_MARK_NAMES[response] || response}. ${intent} Try another end mark.`;
  }
  const clue = repairMeaningClue(fix);
  return `“${completeRepairDisplay(fix.display, response)}” ${clue ? `does not match our story. ${clue}` : "does not fit."} Read the whole sentence and try another word.`;
}
