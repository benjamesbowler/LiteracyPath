const VISUAL_LEVEL_ONE_SKILLS = new Set([
  "vowel_teams",
  "r_controlled",
  "r_controlled_vowels",
  "prepositions",
  "prepositions_of_place",
  "plurals",
  "antonyms_synonyms"
]);

const SIMPLE_WORDS_BY_SKILL = {
  vowel_teams: new Set([
    "tree", "beach", "rain", "train", "boat", "green", "sheep", "peach", "leaf", "coat",
    "goat", "seed", "feet", "road", "soap", "oak", "bead", "beak", "bean", "beehive",
    "beet", "beetle", "chain", "cheese", "clay", "eel", "hay", "loaf", "pail", "paint"
  ]),
  r_controlled: new Set([
    "car", "star", "farm", "arm", "bark", "barn", "card", "bird", "girl", "shirt",
    "bluebird", "corn", "fork", "horse", "butter", "berry", "turtle", "nurse", "purse"
  ]),
  plurals: new Set([
    "cats", "dogs", "cups", "hats", "books", "cars", "balls", "ducks", "birds", "bags",
    "boxes", "buses", "dishes", "puppies", "leaves", "foxes", "benches"
  ]),
  antonyms_synonyms: new Set([
    "hot", "cold", "big", "small", "happy", "sad", "wet", "dry", "open", "closed",
    "full", "empty", "clean", "dirty", "fast", "slow", "tall", "short", "up", "down"
  ])
};

const HARD_WORDS = new Set([
  "airplane", "anteater", "armchair", "artichoke", "asparagus", "beachball", "blackberry",
  "blueberry", "butternut", "canteen", "cheetah", "chessboard", "clipboard", "cornbread",
  "curtain", "earring", "fernleaf", "greenbean", "hairpin", "meadow", "meerkat", "rough",
  "brave", "smart", "pretty", "early"
]);

function normalizeSkillId(value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (normalized === "r_controlled_vowels") return "r_controlled";
  if (normalized === "prepositions_of_place") return "prepositions";
  return normalized;
}

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getQuestionLevel(question = {}) {
  const level = Number(question.level || question.assessmentLevel || question.depthLevel || question.difficulty || 1);
  return level >= 2 ? 2 : 1;
}

function getTargetWord(question = {}) {
  return normalizeWord(question.targetWord || question.word || question.correctAnswer || question.answer || question.itemKey || "");
}

function hasDeclaredImage(question = {}) {
  return Boolean(
    question.imagePath ||
    question.imageUrl ||
    question.image ||
    question.targetImage ||
    question.targetImagePath ||
    question.targetImageUrl ||
    question.imageCards?.some(card => card?.image || card?.imagePath || card?.imageUrl) ||
    question.promptImageCards?.some(card => card?.image || card?.imagePath || card?.imageUrl) ||
    question.answerOptions?.some(option => option?.image || option?.imagePath || option?.imageUrl)
  );
}

export function getLevelOneContentQualityIssues(question = {}) {
  const skillId = normalizeSkillId(question.skillId || question.assessmentSkillId || question.skillName || question.skill || "");
  if (!VISUAL_LEVEL_ONE_SKILLS.has(skillId) || getQuestionLevel(question) !== 1) return [];

  const issues = [];
  const targetWord = getTargetWord(question);
  const prompt = String([question.prompt, question.question].filter(Boolean).join(" ")).toLowerCase();
  const source = question.source || question._source || "";

  if (!hasDeclaredImage(question)) issues.push("Level 1 visual skill is missing image-backed prompt or answer choices");
  if (prompt.includes("which word or phrase tells where")) issues.push("Level 1 prepositions must be concrete spatial image questions");
  if (targetWord && HARD_WORDS.has(targetWord)) issues.push(`hard or abstract Level 1 target: ${targetWord}`);

  const simpleSet = SIMPLE_WORDS_BY_SKILL[skillId];
  if (simpleSet && targetWord && !simpleSet.has(targetWord) && source !== "assessment_qa_replacement_2026_06") {
    issues.push(`Level 1 target is outside the approved simple set: ${targetWord}`);
  }

  return [...new Set(issues)];
}

export function isLevelOneContentQualityAllowed(question = {}) {
  return getLevelOneContentQualityIssues(question).length === 0;
}
