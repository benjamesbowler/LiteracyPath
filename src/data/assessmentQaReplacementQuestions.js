const QA_SOURCE = "assessment_qa_replacement_2026_06";

function makePatternQuestion({
  id,
  skillId,
  skillName,
  word,
  pattern,
  options,
  imagePath,
  prompt,
  phase = 1
}) {
  return {
    id,
    grade: "K-2",
    skill: skillName,
    skillName,
    skillId,
    level: 1,
    phase,
    assessmentLevel: 1,
    assessmentPhase: phase,
    phaseTarget: `level_1_phase_${phase}`,
    questionType: "ixl_template",
    templateType: "PICTURE_AUDIO_TO_PATTERN",
    formatType: "PICTURE_AUDIO_TO_PATTERN",
    prompt,
    question: prompt,
    targetWord: word,
    correctAnswer: pattern,
    answer: pattern,
    choices: options,
    answerOptions: options.map(value => ({ value, label: value })),
    imagePath,
    targetImage: imagePath,
    itemType: "phonics_pattern",
    itemKey: pattern,
    source: QA_SOURCE,
    tags: ["assessment-qa-replacement", "level-1-visual"]
  };
}

function makeVisualChoiceQuestion({
  id,
  skillId,
  skillName,
  prompt,
  answer,
  cards,
  phase = 1,
  itemType = "skill_item"
}) {
  return {
    id,
    grade: "K-2",
    skill: skillName,
    skillName,
    skillId,
    level: 1,
    phase,
    assessmentLevel: 1,
    assessmentPhase: phase,
    phaseTarget: `level_1_phase_${phase}`,
    questionType: "visual_card_choice",
    templateType: "GRAMMAR_IMAGE_CHOICE",
    formatType: "GRAMMAR_IMAGE_CHOICE",
    runtimeTemplateKey: `GRAMMAR_IMAGE_CHOICE_${skillId}_${phase}_${String(answer || "").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase()}_${cards.map(card => card.value).join("_").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase()}`,
    prompt,
    question: prompt,
    targetWord: answer,
    correctAnswer: answer,
    answer,
    choices: cards.map(card => card.value),
    imageCards: cards.map(card => ({
      id: `${id}_${card.value.replace(/\s+/g, "_")}`,
      word: card.value,
      label: card.label || card.value,
      value: card.value,
      image: card.image,
      partOfSpeech: card.partOfSpeech || ""
    })),
    itemType,
    itemKey: answer,
    source: QA_SOURCE,
    tags: ["assessment-qa-replacement", "level-1-visual"]
  };
}

const vowelTeamItems = [
  ["tree", "ee", "/images/child-mode/vowel-teams/tree.png"],
  ["beach", "ea", "/images/assessment/long-vowels/beach.webp"],
  ["rain", "ai", "/images/assessment/long-vowels/rain.webp"],
  ["train", "ai", "/images/assessment/blends/train.webp"],
  ["boat", "oa", "/images/assessment/long-vowels/boat.webp"],
  ["green", "ee", "/images/assessment/blends/green.webp"],
  ["sheep", "ee", "/images/assessment/long-vowels/sheep.webp"],
  ["leaf", "ea", "/images/assessment/long-vowels/leaf.webp"],
  ["coat", "oa", "/images/child-mode/vowels/coat.png"],
  ["goat", "oa", "/images/child-mode/vowels/goat.png"],
  ["seed", "ee", "/images/child-mode/initial-sounds/seed.png"],
  ["feet", "ee", "/images/child-mode/initial-sounds/feet.png"],
  ["road", "oa", "/images/child-mode/vowels/road.png"],
  ["soap", "oa", "/images/child-mode/vowels/soap.png"],
  ["oak", "oa", "/media/vocabulary/images/oak.webp"]
];

const vowelTeamOptionPool = ["ai", "ee", "ea", "oa", "ay", "ue", "igh", "ui", "oo"];

function vowelTeamOptions(pattern, index) {
  const distractors = vowelTeamOptionPool.filter(value => value !== pattern);
  const offset = index % distractors.length;
  return [
    pattern,
    ...[...distractors.slice(offset), ...distractors.slice(0, offset)].slice(0, 3)
  ];
}

const rControlledItems = [
  ["car", "ar", "/images/child-mode/initial-sounds/car.png"],
  ["star", "ar", "/images/child-mode/blends/star.png"],
  ["farm", "ar", "/images/child-mode/initial-sounds/farm.png"],
  ["arm", "ar", "/media/vocabulary/images/arm.webp"],
  ["bark", "ar", "/media/vocabulary/images/bark.webp"],
  ["barn", "ar", "/media/vocabulary/images/barn.webp"],
  ["card", "ar", "/media/vocabulary/images/card.webp"],
  ["bird", "ir", "/images/child-mode/r-controlled/bird.png"],
  ["girl", "ir", "/images/child-mode/initial-sounds/girl.png"],
  ["shirt", "ir", "/images/assessment/digraphs/shirt.webp"],
  ["bluebird", "ir", "/media/vocabulary/images/bluebird.webp"],
  ["corn", "or", "/images/child-mode/r-controlled/corn.png"],
  ["fork", "or", "/images/child-mode/initial-sounds/fork.png"],
  ["horse", "or", "/images/child-mode/r-controlled/horse.png"],
  ["butter", "er", "/media/vocabulary/images/butter.webp"],
  ["berry", "er", "/media/vocabulary/images/berry.webp"]
];

function rControlledOptions(pattern) {
  const base = pattern === "er" ? ["ar", "er", "ir", "or"] : ["ar", "ir", "or", "ur"];
  return base.includes(pattern) ? base : [pattern, ...base.filter(value => value !== pattern)].slice(0, 4);
}

const prepositionCards = [
  { value: "in the box", image: "/images/prepositions/cat_in_box.png" },
  { value: "under the table", image: "/images/prepositions/dog_under_table.png" },
  { value: "above the tree", image: "/images/prepositions/bird_above_tree.png" },
  { value: "on the chair", image: "/images/prepositions/ball_on_chair.png" },
  { value: "below", image: "/media/vocabulary/images/below.webp" },
  { value: "behind", image: "/media/vocabulary/images/behind.webp" },
  { value: "beside", image: "/media/vocabulary/images/beside.webp" },
  { value: "between", image: "/media/vocabulary/images/between.webp" },
  { value: "outside", image: "/media/vocabulary/images/outside.webp" },
  { value: "over", image: "/media/vocabulary/images/over.webp" },
  { value: "near", image: "/media/vocabulary/images/near.webp" },
  { value: "far", image: "/media/vocabulary/images/far.webp" }
];

const pluralCards = [
  { value: "cats", image: "/images/child-mode/plurals/cats.png" },
  { value: "dogs", image: "/images/child-mode/plurals/dogs.png" },
  { value: "cups", image: "/images/child-mode/plurals/cups.png" },
  { value: "books", image: "/images/child-mode/plurals/books.png" },
  { value: "hats", image: "/images/child-mode/plurals/hats.png" },
  { value: "boxes", image: "/images/child-mode/plurals/boxes.png" },
  { value: "dishes", image: "/images/child-mode/plurals/dishes.png" }
];

const antonymCards = [
  { value: "hot", image: "/images/child-mode/initial-sounds/hot.png" },
  { value: "cold", image: "/media/vocabulary/images/cold.webp" },
  { value: "big", image: "/images/assessment/hfw/big.webp" },
  { value: "small", image: "/media/vocabulary/images/small.webp" },
  { value: "happy", image: "/images/emotions/happy_child.png" },
  { value: "sad", image: "/images/emotions/sad_child.png" },
  { value: "wet", image: "/media/vocabulary/images/wet.webp" },
  { value: "dry", image: "/media/vocabulary/images/dry.webp" },
  { value: "open", image: "/images/assessment/hfw/open.webp" },
  { value: "closed", image: "/media/vocabulary/images/closed.webp" },
  { value: "full", image: "/media/vocabulary/images/full.webp" },
  { value: "empty", image: "/media/initial-sounds/images/e/empty.webp" },
  { value: "clean", image: "/media/vocabulary/images/clean.webp" },
  { value: "dirty", image: "/media/vocabulary/images/dirty.webp" }
];

export const assessmentQaReplacementQuestions = [
  ...vowelTeamItems.map(([word, pattern, imagePath], index) =>
    makePatternQuestion({
      id: `qa_vowel_teams_l1_${String(index + 1).padStart(2, "0")}_${word}`,
      skillId: "vowel_teams",
      skillName: "Vowel Teams",
      word,
      pattern,
      options: vowelTeamOptions(pattern, index),
      imagePath,
      prompt: `Look at the picture. Which vowel team completes ${word}?`,
      phase: index < 8 ? 1 : 2
    })
  ),
  ...rControlledItems.map(([word, pattern, imagePath], index) =>
    makePatternQuestion({
      id: `qa_r_controlled_l1_${String(index + 1).padStart(2, "0")}_${word}`,
      skillId: "r_controlled",
      skillName: "R-Controlled Vowels",
      word,
      pattern,
      options: rControlledOptions(pattern),
      imagePath,
      prompt: "Look and listen. Which r-controlled sound is in the word?",
      phase: index < 5 ? 1 : 2
    })
  ),
  ...prepositionCards.map((card, index) =>
    makeVisualChoiceQuestion({
      id: `qa_prepositions_l1_${String(index + 1).padStart(2, "0")}`,
      skillId: "prepositions",
      skillName: "Prepositions of Place",
      prompt: index === 0 ? "Where is the cat?" : index === 1 ? "Where is the dog?" : index === 2 ? "Where is the bird?" : index === 3 ? "Where is the ball?" : "Where is it?",
      answer: card.value,
      cards: [card, ...prepositionCards.filter(item => item.value !== card.value).slice(index % 4, (index % 4) + 3)].slice(0, 4),
      phase: index < Math.ceil(prepositionCards.length / 2) ? 1 : 2,
      itemType: "preposition"
    })
  ),
  ...prepositionCards.slice(0, 4).map((card, index) =>
    makeVisualChoiceQuestion({
      id: `qa_prepositions_l1_review_${String(index + 1).padStart(2, "0")}`,
      skillId: "prepositions",
      skillName: "Prepositions of Place",
      prompt: index === 0 ? "Where is the cat?" : index === 1 ? "Where is the dog?" : index === 2 ? "Where is the bird?" : "Where is the ball?",
      answer: card.value,
      cards: [card, ...prepositionCards.filter(item => item.value !== card.value).slice(0, 3)],
      phase: 2,
      itemType: "preposition"
    })
  ),
  ...pluralCards.flatMap((card, index) => {
    const start = index % Math.max(1, pluralCards.length - 3);
    const cards = [card, ...pluralCards.filter(item => item.value !== card.value).slice(start, start + 3)];
    return makeVisualChoiceQuestion({
      id: `qa_plurals_l1_${String(index + 1).padStart(2, "0")}`,
      skillId: "plurals",
      skillName: "Plurals",
      prompt: "Choose the word that matches the picture.",
      answer: card.value,
      cards,
      phase: index < Math.ceil(pluralCards.length / 2) ? 1 : 2,
      itemType: "plural_word"
    });
  }),
  ...pluralCards.map((card, index) =>
    makeVisualChoiceQuestion({
      id: `qa_plurals_l1_review_${String(index + 1).padStart(2, "0")}`,
      skillId: "plurals",
      skillName: "Plurals",
      prompt: "Choose the word that matches the picture.",
      answer: card.value,
      cards: [card, ...pluralCards.filter(item => item.value !== card.value).slice(0, 3)],
      phase: index < 2 ? 1 : 2,
      itemType: "plural_word"
    })
  ),
  ...pluralCards.slice(0, 5).map((card, index) =>
    makeVisualChoiceQuestion({
      id: `qa_plurals_l1_extra_${String(index + 1).padStart(2, "0")}`,
      skillId: "plurals",
      skillName: "Plurals",
      prompt: "Which word names more than one?",
      answer: card.value,
      cards: [card, ...pluralCards.filter(item => item.value !== card.value).slice(1, 4)],
      phase: 1,
      itemType: "plural_word"
    })
  ),
  ...[
    ["cold", "hot"],
    ["hot", "cold"],
    ["small", "big"],
    ["big", "small"],
    ["sad", "happy"],
    ["happy", "sad"],
    ["dry", "wet"],
    ["wet", "dry"],
    ["closed", "open"],
    ["open", "closed"],
    ["empty", "full"],
    ["full", "empty"],
    ["dirty", "clean"],
    ["clean", "dirty"]
  ].map(([opposite, answer], index) => {
    const answerCard = antonymCards.find(card => card.value === answer);
    const cards = [
      answerCard,
      ...antonymCards.filter(card => card.value !== answer).slice(index % 4, (index % 4) + 3)
    ].filter(Boolean).slice(0, 4);
    return makeVisualChoiceQuestion({
      id: `qa_antonyms_l1_${String(index + 1).padStart(2, "0")}`,
      skillId: "antonyms_synonyms",
      skillName: "Antonyms and Synonyms",
      prompt: `Which word means the opposite of ${opposite}?`,
      answer,
      cards,
      phase: index < 7 ? 1 : 2,
      itemType: "vocabulary_word"
    });
  }),
  makeVisualChoiceQuestion({
    id: "qa_antonyms_l1_extra_01",
    skillId: "antonyms_synonyms",
    skillName: "Antonyms and Synonyms",
    prompt: "Which word means the opposite of messy?",
    answer: "clean",
    cards: [
      antonymCards.find(card => card.value === "clean"),
      antonymCards.find(card => card.value === "dirty"),
      antonymCards.find(card => card.value === "open"),
      antonymCards.find(card => card.value === "full")
    ].filter(Boolean),
    phase: 1,
    itemType: "vocabulary_word"
  })
];
