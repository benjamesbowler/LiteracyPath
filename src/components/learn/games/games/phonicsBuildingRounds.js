export const BUILDING_FAMILIES = Object.freeze({
  easy: [["at", "cat", "hat", "bat", "mat", "rat"], ["an", "fan", "can", "pan", "man"], ["ig", "pig", "wig", "fig"], ["op", "mop", "top"], ["un", "sun", "bun"], ["en", "hen", "pen", "den"], ["et", "net", "jet", "vet"], ["ot", "pot", "dot", "cot"], ["ug", "bug", "mug", "rug", "jug"], ["in", "pin", "fin", "bin", "tin"]],
  medium: [["op", "shop", "chop", "mop", "top"], ["ip", "ship", "trip", "lip"], ["ock", "clock", "rock", "sock"], ["ell", "shell", "bell"], ["amp", "stamp", "lamp"], ["and", "hand", "band"]],
  hard: [["ing", "string", "spring", "ring", "king"], ["ain", "train", "brain", "rain"], ["ock", "clock", "rock", "sock"], ["amp", "stamp", "lamp"], ["est", "nest", "vest"]]
});

export function shuffleBuildingChoices(values, random = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

// Later worlds require digraph/cluster onsets and longer rimes, rather than
// motor speed or more identical CVC rounds. Every shown target is an owned,
// reviewed pictured word. Rimes retain the same spoken vowel within a family.
export function buildPhonicsBlendMissions(difficulty = "easy", random = Math.random) {
  const tier = BUILDING_FAMILIES[difficulty] || BUILDING_FAMILIES.easy;
  return shuffleBuildingChoices(tier, random).map(([rime, ...words], index) => ({
    id: `blend-${difficulty}-${index}-${rime}`, familyId: `-${rime.toUpperCase()}`, rime,
    word: words[0], onset: words[0].slice(0, -rime.length), familyWords: [...words],
    targets: [words[0], ...shuffleBuildingChoices(words.slice(1), random)].slice(0, difficulty === "easy" ? 3 : words.length), label: `Picture for ${words[0]}`
  }));
}

export const GARDEN_LETTER_CONTRASTS = Object.freeze({
  easy: [["cat", "bat"], ["pig", "fig"], ["sun", "bun"], ["map", "mat"], ["bug", "jug"], ["pen", "hen"], ["fox", "box"], ["fan", "pan"], ["mop", "top"], ["van", "can"], ["pot", "dot"], ["hat", "rat"], ["net", "jet"]],
  medium: [["ship", "shop"], ["fish", "dish"], ["rock", "sock"], ["ring", "king"], ["book", "hook"], ["boat", "coat"], ["coat", "goat"], ["ball", "bell"], ["hand", "band"], ["cats", "bats"], ["fork", "fort"], ["kite", "bite"], ["cats", "hats"]],
  hard: [["bench", "bunch"], ["train", "brain"], ["train", "trail"], ["mouse", "house"], ["porch", "torch"], ["charm", "chart"], ["cheek", "cheer"], ["chick", "check"], ["shade", "shape"], ["boxes", "foxes"], ["dishes", "wishes"], ["cream", "dream"], ["glass", "class"]]
});
const FLOWERS = ["sunflower", "daisy", "bluebell", "rose", "poppy", "berry bush"];

export function buildPhonicsGardenRounds(difficulty = "easy", random = Math.random) {
  const pairs = shuffleBuildingChoices(GARDEN_LETTER_CONTRASTS[difficulty] || GARDEN_LETTER_CONTRASTS.easy, random);
  const forward = pairs.map(([sourceWord, word]) => ({ sourceWord, word }));
  const reverse = pairs.map(([word, sourceWord]) => ({ sourceWord, word }));
  return [...forward, ...reverse].map((contrast, index) => {
    const changeIndex = [...contrast.sourceWord].findIndex((letter, i) => letter !== contrast.word[i]);
    const expected = contrast.word[changeIndex], old = contrast.sourceWord[changeIndex];
    const decoys = shuffleBuildingChoices([..."abcdefghijklmnopqrstuvwxyz"].filter(letter => letter !== expected && letter !== old), random).slice(0, 3);
    return { ...contrast, id: `garden-${difficulty}-${index}-${contrast.sourceWord}-${contrast.word}`, targetLabel: `Picture for ${contrast.word}`, changeIndex,
      flower: FLOWERS[index % FLOWERS.length], plantName: FLOWERS[index % FLOWERS.length], bank: shuffleBuildingChoices([expected, old, ...decoys], random) };
  });
}
