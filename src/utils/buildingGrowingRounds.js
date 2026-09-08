import { CVC_WORDS, WORD_FAMILIES } from "../data/learnGamesData.js";
import { hasKnownBadWordAudio } from "../data/knownBadWordAudio.js";
import { getChildWordAsset } from "../data/childAssets.js";

import { segmentWord } from "./graphemeSegments.js";
import { WORKSHOP_OBJECTS } from "./workshopObjects.js";

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

const OBJECT_LABELS = {
  cat: "A cat", dog: "A dog", hat: "A hat", bat: "A bat", bed: "A bed",
  bus: "A bus", cup: "A cup", bug: "A bug", fox: "A fox", map: "A map",
  pen: "A pen", pig: "A pig", fan: "A fan", fig: "A fig", mop: "A mop",
  sun: "The sun", hen: "A hen", net: "A net", pot: "A pot", pin: "A pin",
  ship: "A ship", fish: "A fish", frog: "A frog", crab: "A crab", tree: "A tree",
  star: "A star", flag: "A flag", sock: "A sock", lamp: "A lamp", ring: "A ring",
  chin: "A chin", shed: "A shed", moth: "A moth", bath: "A bath", duck: "A duck",
  rock: "A rock", king: "A king", hand: "A hand", tent: "A tent", milk: "Milk",
  nest: "A nest", drum: "A drum", brush: "A brush", clock: "A clock", train: "A train",
  plant: "A plant", shirt: "A shirt", bread: "Bread", dress: "A dress", glass: "A glass",
  stamp: "A stamp", string: "A string", spring: "A spring", branch: "A branch",
  shrimp: "A shrimp", lunch: "Lunch", bench: "A bench"
};

const BLEND_TARGETS = [
  ["-AT", "cat"],
  ["-AN", "fan"],
  ["-IG", "pig"],
  ["-OP", "mop"],
  ["-UN", "sun"],
  ["-EN", "hen"],
  ["-ET", "net"],
  ["-OT", "pot"],
  ["-UG", "bug"],
  ["-IN", "pin"]
];

const GARDEN_TRANSFORMS = [
  { sourceWord: "cat", word: "bat", flower: "sunflower", plantName: "Sunflower" },
  { sourceWord: "pig", word: "fig", flower: "fig tree", plantName: "fig tree" },
  { sourceWord: "sun", word: "bun", flower: "daisy", plantName: "Daisy" },
  { sourceWord: "map", word: "mat", flower: "berry bush", plantName: "Berry bush" },
  { sourceWord: "bug", word: "jug", flower: "bluebell", plantName: "Bluebell" },
  { sourceWord: "pen", word: "hen", flower: "rose", plantName: "Rose" },
  { sourceWord: "fox", word: "box", flower: "poppy", plantName: "Poppy" }
];

function cleanCvcPool(difficulty = "easy") {
  const tier = difficulty === "hard" ? "hard" : difficulty === "medium" ? "medium" : "easy";
  const source = CVC_WORDS[tier] || CVC_WORDS.easy;
  return [...new Set(source)].filter(word => {
    const asset = getChildWordAsset(word);
    return /^[a-z]+$/.test(word) && (WORKSHOP_OBJECTS[word]?.units.length || 0) >= 3 &&
      Boolean(WORKSHOP_OBJECTS[word]) &&
      Boolean(asset?.image || asset?.fallbackImage) && !hasKnownBadWordAudio(word);
  });
}

export function buildCvcWorkshopRounds(difficulty = "easy", count = 6) {
  const pool = cleanCvcPool(difficulty);
  return shuffle(pool).slice(0, count).map((word, roundIndex) => ({
    id: `cvc-${roundIndex}-${word}`,
    word,
    label: OBJECT_LABELS[word] || getChildWordAsset(word)?.alt || word,
    action: WORKSHOP_OBJECTS[word].action,
    destination: WORKSHOP_OBJECTS[word].destination,
    useResult: WORKSHOP_OBJECTS[word].useResult,
    units: WORKSHOP_OBJECTS[word].units.map((unit, tileIndex) => ({
      id: `${word}-${roundIndex}-${tileIndex}`,
      grapheme: unit.grapheme,
      phoneme: unit.phoneme,
      index: tileIndex
    }))
  }));
}

export function buildBlendMissions(difficulty = "easy") {
  const count = difficulty === "hard" ? 6 : difficulty === "medium" ? 5 : 4;
  return shuffle(BLEND_TARGETS).slice(0, count).map(([familyId, word], index) => {
    const familyWords = WORD_FAMILIES[familyId] || [];
    const onset = word.slice(0, word.length - (familyId.length - 1));
    return {
      id: `blend-${index}-${word}`,
      familyId,
      word,
      onset,
      rime: familyId.slice(1).toLowerCase(),
      familyWords,
      label: OBJECT_LABELS[word] || getChildWordAsset(word)?.alt || word,
      units: segmentWord(word).map((grapheme, unitIndex) => ({ id: `${word}-${index}-${unitIndex}`, grapheme, phoneme: grapheme, index: unitIndex }))
    };
  });
}

export const GARDEN_FLOWERS = Object.freeze(GARDEN_TRANSFORMS.map(round => round.flower));

export function buildGrowingGardenRounds() {
  const count = 5;
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  return shuffle(GARDEN_TRANSFORMS).slice(0, count).map((round, index) => {
    const decoys = shuffle([...alphabet].filter(letter => !round.word.includes(letter))).slice(0, 3);
    return {
      ...round,
      id: `garden-${index}-${round.sourceWord}-${round.word}`,
      targetLabel: OBJECT_LABELS[round.word] || `A ${round.word}`,
      changeIndex: [...round.sourceWord].findIndex((letter, letterIndex) => letter !== round.word[letterIndex]),
      bank: shuffle([...new Set([...round.word, ...decoys])])
    };
  });
}
