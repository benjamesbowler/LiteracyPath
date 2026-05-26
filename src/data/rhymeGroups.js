function normalizeWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();
}

export const rhymeGroups = {
  at: ["cat", "bat", "hat", "mat", "rat"],
  an: ["pan", "fan", "can", "man", "van"],
  ap: ["map", "cap", "nap", "tap", "gap"],
  am: ["jam", "ham", "ram", "dam", "yam"],
  ag: ["bag", "tag", "wag", "rag"],
  ad: ["dad", "sad", "mad", "pad"],
  ed: ["bed", "red", "fed"],
  en: ["pen", "hen", "ten", "men"],
  et: ["jet", "net", "pet", "wet"],
  eg: ["leg", "peg"],
  ig: ["pig", "wig", "dig", "big", "fig"],
  in: ["pin", "fin", "win", "bin"],
  ip: ["lip", "sip", "dip", "zip"],
  it: ["sit", "hit", "pit", "bit"],
  og: ["dog", "log", "fog", "hog"],
  op: ["mop", "hop", "top", "pop"],
  ot: ["hot", "pot", "dot", "cot"],
  ug: ["bug", "rug", "mug", "jug"],
  un: ["sun", "run", "fun", "bun"],
  up: ["cup", "pup", "up"],
  ut: ["nut", "cut", "hut"],
  ell: ["bell", "fell", "shell", "well"],
  eed: ["bead", "feed", "need", "seed", "weed"],
  ox: ["box", "fox"],
  oh: ["go", "snow"],
  oon: ["moon", "spoon"],
  ose: ["nose", "rose"],
  air: ["bear", "chair"],
  ee: ["bee", "tree"],
  ain: ["chain", "gain", "pain", "rain", "train"],
  ing: ["ring", "king", "wing", "sing", "swing"],
  ang: ["bang", "fang", "hang", "rang"],
  ong: ["song", "long", "gong"],
  unk: ["bunk", "dunk", "junk", "trunk"],
  ink: ["sink", "pink", "wink", "link"],
  ank: ["bank", "tank", "sank", "plank"],
  ock: ["sock", "rock", "lock", "clock"],
  ack: ["back", "pack", "sack", "track"],
  ick: ["kick", "lick", "brick", "stick"],
  ill: ["hill", "pill", "mill", "will"],
  all: ["ball", "wall", "fall", "tall"],
  ash: ["dash", "cash", "trash"],
  ish: ["fish", "dish", "wish"],
  uck: ["duck", "truck", "luck"],
  ake: ["cake", "lake", "snake"],
  ame: ["game", "name", "flame"],
  ide: ["ride", "slide", "hide"],
  ight: ["light", "night", "sight"],
  oat: ["boat", "coat", "goat"],
  eep: ["sheep", "jeep", "sleep"],
  ouse: ["mouse", "house"],
  ird: ["bird", "third"],
  urn: ["burn", "turn"],
  ar: ["car", "star", "jar"],
  or: ["corn", "horn", "storm"]
};

const wordToRhymeGroup = Object.entries(rhymeGroups).reduce((map, [group, words]) => {
  words.forEach(word => {
    map.set(normalizeWord(word), group);
  });
  return map;
}, new Map());

export function getRhymeGroup(word) {
  return wordToRhymeGroup.get(normalizeWord(word)) || "";
}

export function areTrueRhymes(a, b) {
  const groupA = getRhymeGroup(a);
  return Boolean(groupA && groupA === getRhymeGroup(b));
}

export function getRhymeOptionMatches(targetWord, options = []) {
  const targetGroup = getRhymeGroup(targetWord);
  return {
    targetGroup,
    matches: options
      .map(option => normalizeWord(option))
      .filter(option => option && getRhymeGroup(option) === targetGroup)
  };
}

export function getRhymePairMatches(itemKey, options = []) {
  const expectedGroup = normalizeWord(itemKey);
  return options
    .map(option => normalizeWord(option))
    .filter(option => option && getRhymeGroup(option) === expectedGroup);
}

export function hasKnownRhymeWord(word) {
  return Boolean(getRhymeGroup(word));
}
