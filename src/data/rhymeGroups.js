function normalizeWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .trim();
}

export const rhymeGroups = {
  at: ["bat", "cat", "hat", "mat", "pat", "rat", "sat"],
  ap: ["cap", "clap", "map", "nap", "tap"],
  an: ["can", "fan", "man", "pan", "ran", "tan", "van"],
  ed: ["bed", "fed", "led", "red", "wed"],
  en: ["den", "hen", "men", "pen", "ten"],
  et: ["jet", "net", "pet", "wet"],
  ell: ["bell", "fell", "shell", "well"],
  eed: ["bead", "feed", "need", "seed", "weed"],
  ig: ["big", "dig", "fig", "pig", "wig"],
  ill: ["hill", "will"],
  in: ["bin", "fin", "pin", "tin", "win"],
  it: ["hit", "kit", "pit", "sit"],
  ish: ["dish", "fish", "wish"],
  og: ["dog", "fog", "frog", "hog", "log"],
  op: ["hop", "mop", "shop", "stop", "top"],
  ot: ["cot", "dot", "hot", "pot"],
  ox: ["box", "fox"],
  ock: ["dock", "lock", "rock", "sock"],
  ake: ["cake", "lake"],
  oat: ["boat", "coat", "goat"],
  oh: ["go", "snow"],
  oon: ["moon", "spoon"],
  ose: ["nose", "rose"],
  ug: ["bug", "dug", "hug", "mug", "rug"],
  un: ["bun", "fun", "run", "sun"],
  ut: ["cut", "nut"],
  uck: ["duck", "luck", "muck", "truck"],
  am: ["ham", "jam", "ram"],
  ar: ["car", "star"],
  air: ["bear", "chair"],
  ight: ["light", "night"],
  ee: ["bee", "tree"],
  ain: ["chain", "gain", "pain", "rain", "train"],
  ing: ["king", "ring", "sing", "wing"],
  ouse: ["house", "mouse"]
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
