// Supplemental Vowel Teams variety bank. Keep this scoped to vowel_teams only.

const VOWEL_TEAM_PATTERNS = [
  "ai",
  "ay",
  "ee",
  "ea",
  "oa",
  "oe",
  "ow",
  "oo",
  "ue",
  "ui",
  "ew",
  "oi",
  "oy",
  "ou",
  "igh",
  "ie",
  "eigh"
];

const LEVEL_TWO_ITEMS = [
  ["grapefruit", "ui", "/media/vocabulary/images/grapefruit.webp", "/media/vocabulary/audio/grapefruit.mp3", "a grapefruit cut in half on a table"],
  ["kiwifruit", "ui", "/media/initial-sounds/images/k/kiwifruit.webp", "/media/initial-sounds/audio/k/kiwifruit.mp3", "a whole kiwifruit and a sliced kiwifruit"],
  ["newt", "ew", "/media/initial-sounds/images/n/newt.webp", "/media/initial-sounds/audio/n/newt.mp3", "a small newt on a rock"],
  ["boy", "oy", "/images/generated/boy_afraid.png", "/guided-reading/audio/words/boy.mp3", "a young boy"],
  ["nightlight", "igh", "/media/initial-sounds/images/n/nightlight.webp", "/media/initial-sounds/audio/n/nightlight.mp3", "a small nightlight glowing in a room"],
  ["lighthouse", "igh", "/media/initial-sounds/images/l/lighthouse.webp", "/media/initial-sounds/audio/l/lighthouse.mp3", "a lighthouse by the sea"],
  ["field", "ie", "/media/vocabulary/images/field.webp", "/media/vocabulary/audio/field.mp3", "a grassy field"],
  ["shield", "ie", "/media/vocabulary/images/shield.webp", "/media/vocabulary/audio/shield.mp3", "a shield"],
  ["eight", "eigh", "/images/assessment/long-vowels/eight.webp", "/audio/assessment/long-vowels/eight.mp3", "eight small objects grouped together"],
  ["sleigh", "eigh", "/images/assessment/long-vowels/sleigh.webp", "/audio/assessment/long-vowels/sleigh.mp3", "a sleigh on snow"],
  ["soil", "oi", "/media/vocabulary/images/soil.webp", "/media/vocabulary/audio/soil.mp3", "dark soil in a garden"],
  ["coin", "oi", "/media/vocabulary/images/coin.webp", "/media/vocabulary/audio/coin.mp3", "a coin"],
  ["blueberry", "ue", "/media/vocabulary/images/blueberry.webp", "/media/vocabulary/audio/blueberry.mp3", "blueberries"],
  ["bluebird", "ue", "/media/vocabulary/images/bluebird.webp", "/media/vocabulary/audio/bluebird.mp3", "a bluebird"],
  ["blue", "ue", "/images/assessment/long-vowels/blue.webp", "/audio/assessment/long-vowels/blue.mp3", "a blue crayon"]
];

function slug(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rotate(values, index) {
  const offset = index % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function patternOptions(targetPattern, index) {
  return [
    targetPattern,
    ...rotate(VOWEL_TEAM_PATTERNS.filter(pattern => pattern !== targetPattern), index * 3).slice(0, 3)
  ];
}

function partialWord(word, pattern) {
  return word.replace(pattern, "_".repeat(pattern.length));
}

function makeQuestion([word, pattern, imagePath, audioPath, imageAlt], index) {
  const options = patternOptions(pattern, index);
  const phase = index % 2 === 0 ? 1 : 2;

  return {
    id: `vowel_teams_l2_variety_${String(index + 1).padStart(2, "0")}_${pattern}_${slug(word)}`,
    grade: "K-2",
    skillId: "vowel_teams",
    skillName: "Vowel Teams",
    skill: "Vowel Teams",
    level: 2,
    difficulty: 2,
    phase,
    assessmentPhase: phase,
    phaseTarget: `level_2_phase_${phase}`,
    targetPattern: pattern,
    phonicsPattern: pattern,
    targetWord: word,
    audioText: word,
    itemType: "phonics_pattern",
    itemKey: pattern,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    audioPath,
    audioUrl: audioPath,
    imageAlt,
    active: true,
    qaStatus: "approved",
    source: "vowel_teams_variety_2026_06",
    tags: ["generated-gap", "vowel_teams", pattern, word, "level_2"],
    sortIndex: index + 1,
    questionType: "ixl_template",
    templateType: "LONG_VOWEL_TEAM_COMPLETE",
    formatType: "LONG_VOWEL_TEAM_COMPLETE",
    prompt: "Look at the picture. Which vowel team completes the word?",
    question: "Look at the picture. Which vowel team completes the word?",
    partialWord: partialWord(word, pattern),
    choices: options,
    answerOptions: options.map(option => ({ value: option, label: option })),
    correctAnswer: pattern,
    answer: pattern,
    explanation: `The vowel team "${pattern}" completes "${word}".`
  };
}

export const vowelTeamsVarietyQuestions = LEVEL_TWO_ITEMS.map(makeQuestion);
