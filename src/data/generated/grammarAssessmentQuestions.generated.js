import { getApprovedAudioPath } from "../audioPreferenceManifest.js";
import { getChildWordAsset } from "../childAssets.js";

const SOURCE = "grammar_replacement_2026_06";
const FORMAT_IMAGE_CHOICE = "GRAMMAR_IMAGE_CHOICE";
const FORMAT_SENTENCE_FIT = "GRAMMAR_SENTENCE_FIT";

const skillConfigs = {
  nouns: {
    skillId: "nouns",
    skillName: "Nouns",
    prompt: "Choose the noun.",
    sentencePrompt: "Choose the noun that best fits the sentence.",
    itemType: "grammar_noun",
    partOfSpeech: "noun"
  },
  verbs: {
    skillId: "verbs",
    skillName: "Verbs",
    prompt: "Choose the verb.",
    sentencePrompt: "Choose the verb that best fits the sentence.",
    itemType: "grammar_verb",
    partOfSpeech: "verb"
  },
  adjectives: {
    skillId: "adjectives",
    skillName: "Adjectives",
    prompt: "Choose the adjective.",
    sentencePrompt: "Choose the adjective that best fits the sentence.",
    itemType: "grammar_adjective",
    partOfSpeech: "adjective"
  }
};

const nounTargets = [
  ["cat", "The ___ naps on the mat.", "a cat napping on a mat"],
  ["dog", "The ___ runs in the park.", "a dog running in a park"],
  ["bus", "The children ride the ___.", "children waiting by a bus"],
  ["hat", "She puts on a ___.", "a child wearing a hat"],
  ["map", "We look at the ___ to find the road.", "a map on a table"],
  ["bed", "He sleeps in the ___.", "a bed in a bedroom"],
  ["cup", "She drinks from the ___.", "a cup on a table"],
  ["bug", "The ___ crawls on the leaf.", "a bug on a leaf"],
  ["fish", "The ___ swims in the pond.", "a fish in water"],
  ["frog", "The ___ jumps near the pond.", "a frog near a pond"],
  ["goat", "The ___ eats grass.", "a goat eating grass"],
  ["duck", "The ___ swims on the lake.", "a duck on a lake"],
  ["man", "The ___ waves hello.", "a man waving"],
  ["bag", "She packs the ___.", "a bag on a chair"],
  ["ball", "He kicks the ___.", "a ball on grass"],
  ["bat", "The player holds the ___.", "a baseball bat"],
  ["book", "We read the ___.", "a book open on a desk"],
  ["chair", "The ___ is by the table.", "a chair by a table"],
  ["coat", "He wears a warm ___.", "a coat on a hook"],
  ["fox", "The ___ hides in the grass.", "a fox in grass"],
  ["flag", "The ___ waves in the wind.", "a flag on a pole"],
  ["jet", "The ___ flies in the sky.", "a jet in the sky"],
  ["leg", "The dog hurt its ___.", "a leg with a bandage"],
  ["log", "The ___ sits by the fire.", "a log near a fire"],
  ["mug", "The ___ is full of milk.", "a mug on a table"],
  ["pan", "Dad cooks with the ___.", "a pan on a stove"],
  ["pen", "She writes with a ___.", "a pen on paper"],
  ["pig", "The ___ rolls in the mud.", "a pig in mud"],
  ["pot", "The plant is in a ___.", "a plant in a pot"],
  ["ram", "The ___ stands on the hill.", "a ram on a hill"]
];

const verbTargets = [
  ["run", "The child can ___ fast.", "a child running"],
  ["hop", "The frog can ___ on the log.", "a frog hopping"],
  ["dig", "The dog will ___ in the dirt.", "a dog digging"],
  ["stop", "The bus will ___ at the sign.", "a bus stopped at a sign"],
  ["clap", "The children ___ after the song.", "children clapping"],
  ["cut", "Mum will ___ the paper.", "scissors cutting paper"],
  ["sit", "The boy will ___ on the chair.", "a boy sitting on a chair"],
  ["read", "The girl will ___ the book.", "a girl reading a book"],
  ["swim", "The child can ___ in the pool.", "a child swimming"],
  ["sleep", "The baby will ___ in the bed.", "a baby sleeping"],
  ["draw", "The child will ___ a star.", "a child drawing"],
  ["kick", "He will ___ the ball.", "a child kicking a ball"],
  ["throw", "She will ___ the beanbag.", "a child throwing a beanbag"],
  ["crawl", "The baby can ___ on the rug.", "a baby crawling"],
  ["drink", "The girl will ___ water.", "a girl drinking water"],
  ["paint", "The child will ___ a picture.", "a child painting"],
  ["ride", "They will ___ a bike.", "a child riding a bike"],
  ["stand", "The class will ___ in a line.", "children standing in line"],
  ["open", "He will ___ the door.", "a child opening a door"],
  ["wash", "She will ___ her hands.", "a child washing hands"],
  ["pull", "The child will ___ the rope.", "a child pulling a rope"],
  ["push", "The child will ___ the cart.", "a child pushing a cart"],
  ["clean", "The child will ___ the table.", "a child cleaning a table"],
  ["laugh", "The friends ___ at the joke.", "children laughing"],
  ["smile", "The girl will ___ for the photo.", "a child smiling"],
  ["wave", "The boy will ___ goodbye.", "a child waving"],
  ["skip", "The child can ___ down the path.", "a child skipping"],
  ["climb", "The child will ___ the ladder.", "a child climbing a ladder"],
  ["brush", "She will ___ her teeth.", "a child brushing teeth"],
  ["mix", "He will ___ the batter.", "a child mixing batter"]
];

const adjectiveTargets = [
  ["big", "The ___ dog runs in the yard.", "a large dog"],
  ["red", "The ___ hat is on the table.", "a red hat"],
  ["black", "The ___ cat sits by the wall.", "a black cat"],
  ["blue", "The ___ cup is on the shelf.", "a blue cup"],
  ["sad", "The ___ child needs a hug.", "a sad child"],
  ["hot", "The soup is ___.", "a steaming bowl of soup"],
  ["cold", "The ice is ___.", "ice cubes"],
  ["fast", "The ___ car wins the race.", "a fast car"],
  ["slow", "The ___ turtle walks on the path.", "a slow turtle"],
  ["small", "The ___ bug is on the leaf.", "a small bug"],
  ["wet", "The ___ dog shakes off water.", "a wet dog"],
  ["dry", "The ___ towel is on the chair.", "a dry towel"],
  ["clean", "The ___ plate is on the table.", "a clean plate"],
  ["dirty", "The ___ boots are by the door.", "dirty boots"],
  ["hard", "The ___ rock is on the path.", "a hard rock"],
  ["soft", "The ___ pillow is on the bed.", "a soft pillow"],
  ["long", "The ___ rope is on the floor.", "a long rope"],
  ["short", "The ___ pencil is in the box.", "a short pencil"],
  ["tall", "The ___ tree stands by the house.", "a tall tree"],
  ["round", "The ___ ball rolls away.", "a round ball"],
  ["white", "The ___ shell is on the sand.", "a white shell"],
  ["happy", "The ___ child jumps up.", "a happy child"],
  ["bright", "The ___ light shines.", "a bright lamp"],
  ["dark", "The ___ room is quiet.", "a dark room"],
  ["loud", "The ___ drum wakes the baby.", "a loud drum"],
  ["full", "The ___ cup sits on the table.", "a full cup"],
  ["light", "The ___ bag is easy to carry.", "a light bag"],
  ["heavy", "The ___ box is hard to lift.", "a heavy box"],
  ["cute", "The ___ puppy plays.", "a cute puppy"],
  ["orange", "The ___ fish swims.", "an orange fish"]
];

const targetSets = {
  noun: nounTargets,
  verb: verbTargets,
  adjective: adjectiveTargets
};

const grammarImageOverrides = {
  adjective: {
    "beautiful": "/media/vocabulary/images/adjective-beautiful.webp",
    "brave": "/media/vocabulary/images/adjective-brave.webp",
    "brown": "/media/vocabulary/images/adjective-brown.webp",
    "bumpy": "/media/vocabulary/images/adjective-bumpy.webp",
    "calm": "/media/vocabulary/images/adjective-calm.webp",
    "crisp": "/media/vocabulary/images/adjective-crisp.webp",
    "cute": "/media/vocabulary/images/adjective-cute.webp",
    "deep": "/media/vocabulary/images/adjective-deep.webp",
    "dusty": "/media/vocabulary/images/adjective-dusty.webp",
    "fierce": "/media/vocabulary/images/adjective-fierce.webp",
    "fluffy": "/media/vocabulary/images/adjective-fluffy.webp",
    "gentle": "/media/vocabulary/images/adjective-gentle.webp",
    "huge": "/media/vocabulary/images/adjective-huge.webp",
    "loud": "/media/vocabulary/images/adjective-loud.webp",
    "new": "/media/vocabulary/images/adjective-new.webp",
    "noisy": "/media/vocabulary/images/adjective-noisy.webp",
    "old": "/media/vocabulary/images/adjective-old.webp",
    "playful": "/media/vocabulary/images/adjective-playful.webp",
    "prickly": "/media/vocabulary/images/adjective-prickly.webp",
    "proud": "/media/vocabulary/images/adjective-proud.webp",
    "purple": "/media/vocabulary/images/adjective-purple.webp",
    "rough": "/media/vocabulary/images/adjective-rough.webp",
    "sharp": "/media/vocabulary/images/adjective-sharp.webp",
    "shiny": "/media/vocabulary/images/adjective-shiny.webp",
    "silent": "/media/vocabulary/images/adjective-silent.webp",
    "smelly": "/media/vocabulary/images/adjective-smelly.webp",
    "smooth": "/media/vocabulary/images/adjective-smooth.webp",
    "sour": "/media/vocabulary/images/adjective-sour.webp",
    "sparkly": "/media/vocabulary/images/adjective-sparkly.webp",
    "square": "/media/vocabulary/images/adjective-square.webp",
    "striped": "/media/vocabulary/images/adjective-striped.webp",
    "strong": "/media/vocabulary/images/adjective-strong.webp",
    "sweet": "/media/vocabulary/images/adjective-sweet.webp",
    "tiny": "/media/vocabulary/images/adjective-tiny.webp",
    "warm": "/media/vocabulary/images/adjective-warm.webp",
    "young": "/media/vocabulary/images/adjective-young.webp",
  },
  noun: {
    "artist": "/media/vocabulary/images/noun-artist.webp",
    "baby": "/media/vocabulary/images/noun-baby.webp",
    "child": "/media/vocabulary/images/noun-child.webp",
    "children": "/media/vocabulary/images/noun-children.webp",
    "coach": "/media/vocabulary/images/noun-coach.webp",
    "farmer": "/media/vocabulary/images/noun-farmer.webp",
    "friend": "/media/vocabulary/images/noun-friend.webp",
    "market": "/media/vocabulary/images/noun-market.webp",
    "mum": "/media/vocabulary/images/noun-mum.webp",
    "museum": "/media/vocabulary/images/noun-museum.webp",
    "pilot": "/media/vocabulary/images/noun-pilot.webp",
    "puppy": "/media/vocabulary/images/noun-puppy.webp",
    "school": "/media/vocabulary/images/noun-school.webp",
    "sister": "/media/vocabulary/images/noun-sister.webp",
    "station": "/media/vocabulary/images/noun-station.webp",
    "teacher": "/media/vocabulary/images/noun-teacher.webp",
    "ticket": "/media/vocabulary/images/noun-ticket.webp",
  },
  verb: {
    "ate": "/media/vocabulary/images/verb-ate.webp",
    "bake": "/media/vocabulary/images/verb-bake.webp",
    "baked": "/media/vocabulary/images/verb-baked.webp",
    "barked": "/media/vocabulary/images/verb-barked.webp",
    "blow": "/media/vocabulary/images/verb-blow.webp",
    "build": "/media/vocabulary/images/verb-build.webp",
    "builds": "/media/vocabulary/images/verb-builds.webp",
    "carry": "/media/vocabulary/images/verb-carry.webp",
    "catch": "/media/vocabulary/images/verb-catch.webp",
    "compare": "/media/vocabulary/images/verb-compare.webp",
    "cook": "/media/vocabulary/images/verb-cook.webp",
    "count": "/media/vocabulary/images/verb-count.webp",
    "cried": "/media/vocabulary/images/verb-cried.webp",
    "dance": "/media/vocabulary/images/verb-dance.webp",
    "drew": "/media/vocabulary/images/verb-drew.webp",
    "drive": "/media/vocabulary/images/verb-drive.webp",
    "eat": "/media/vocabulary/images/verb-eat.webp",
    "explain": "/media/vocabulary/images/verb-explain.webp",
    "fall": "/media/vocabulary/images/verb-fall.webp",
    "fell": "/media/vocabulary/images/verb-fell.webp",
    "flew": "/media/vocabulary/images/verb-flew.webp",
    "fly": "/media/vocabulary/images/verb-fly.webp",
    "galloped": "/media/vocabulary/images/verb-galloped.webp",
    "help": "/media/vocabulary/images/verb-help.webp",
    "hide": "/media/vocabulary/images/verb-hide.webp",
    "hung": "/media/vocabulary/images/verb-hung.webp",
    "jumped": "/media/vocabulary/images/verb-jumped.webp",
    "listen": "/media/vocabulary/images/verb-listen.webp",
    "measure": "/media/vocabulary/images/verb-measure.webp",
    "melt": "/media/vocabulary/images/verb-melt.webp",
    "observe": "/media/vocabulary/images/verb-observe.webp",
    "played": "/media/vocabulary/images/verb-played.webp",
    "pour": "/media/vocabulary/images/verb-pour.webp",
    "predict": "/media/vocabulary/images/verb-predict.webp",
    "raised": "/media/vocabulary/images/verb-raised.webp",
    "ran": "/media/vocabulary/images/verb-ran.webp",
    "reads": "/media/vocabulary/images/verb-reads.webp",
    "repair": "/media/vocabulary/images/verb-repair.webp",
    "rises": "/media/vocabulary/images/verb-rises.webp",
    "runs": "/media/vocabulary/images/verb-runs.webp",
    "sang": "/media/vocabulary/images/verb-sang.webp",
    "sat": "/media/vocabulary/images/verb-sat.webp",
    "shake": "/media/vocabulary/images/verb-shake.webp",
    "share": "/media/vocabulary/images/verb-share.webp",
    "sing": "/media/vocabulary/images/verb-sing.webp",
    "smiled": "/media/vocabulary/images/verb-smiled.webp",
    "swam": "/media/vocabulary/images/verb-swam.webp",
    "swayed": "/media/vocabulary/images/verb-swayed.webp",
    "think": "/media/vocabulary/images/verb-think.webp",
    "walked": "/media/vocabulary/images/verb-walked.webp",
    "write": "/media/vocabulary/images/verb-write.webp",
  },
};

const adjectiveDistractors = adjectiveTargets.map(([word]) => word);
const verbDistractors = verbTargets.map(([word]) => word);
const nounDistractors = nounTargets.map(([word]) => word);

function slug(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rotate(items, offset) {
  if (!items.length) return [];
  const start = Math.abs(offset) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function svgDataUri({ word, partOfSpeech, scene }) {
  const colorByPart = {
    noun: ["#f7c948", "#3b2f13"],
    verb: ["#4fc3a1", "#12352d"],
    adjective: ["#7aa7ff", "#10264d"]
  };
  const [accent, ink] = colorByPart[partOfSpeech] || colorByPart.noun;
  const title = word.replace(/\b\w/g, char => char.toUpperCase());
  const detail = String(scene || `${partOfSpeech} picture`).slice(0, 44);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" role="img" aria-label="${title}"><rect width="360" height="260" rx="24" fill="#fff8ea"/><circle cx="80" cy="72" r="42" fill="${accent}"/><rect x="54" y="132" width="252" height="62" rx="20" fill="#ffffff" stroke="${accent}" stroke-width="8"/><path d="M74 198c44-42 77-42 121 0 31-31 61-34 91-8" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round"/><text x="180" y="103" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="${ink}">${title}</text><text x="180" y="170" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#4c5564">${detail}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function approvedAudioFor(word) {
  const normalized = slug(word);
  const asset = getChildWordAsset(normalized);
  const candidatePaths = [
    asset?.audio,
    `/audio/child-mode/clean-human/words/${normalized}.mp3`,
    `/audio/child-mode/words/${normalized}.mp3`,
    `/media/vocabulary/audio/${normalized}.mp3`,
    `/media/final-sounds/audio/b/${normalized}.mp3`
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    const approved = getApprovedAudioPath(normalized, candidatePath);
    if (approved) return approved;
  }

  return "";
}

function imageFor(word, partOfSpeech, scene = "") {
  return grammarImageOverrides[partOfSpeech]?.[slug(word)] || svgDataUri({ word, partOfSpeech, scene });
}

function cardFor(word, partOfSpeech, scene = "", withAudio = false) {
  const audio = withAudio ? approvedAudioFor(word) : "";
  const image = imageFor(word, partOfSpeech, scene);
  return {
    id: `${partOfSpeech}-${slug(word)}`,
    word,
    label: word,
    value: word,
    partOfSpeech,
    image,
    imagePath: image,
    alt: `${word} ${partOfSpeech} card`,
    ...(audio ? { audio, audioPath: audio, audioUrl: audio } : {})
  };
}

function levelOneDistractors(partOfSpeech, index) {
  const pools = {
    noun: [
      ...verbDistractors.map(word => [word, "verb"]),
      ...adjectiveDistractors.map(word => [word, "adjective"])
    ],
    verb: [
      ...nounDistractors.map(word => [word, "noun"]),
      ...adjectiveDistractors.map(word => [word, "adjective"])
    ],
    adjective: [
      ...nounDistractors.map(word => [word, "noun"]),
      ...verbDistractors.map(word => [word, "verb"])
    ]
  };
  return rotate(pools[partOfSpeech], index * 5).slice(0, 3);
}

function sentenceOptions(partOfSpeech, answer, index) {
  const words = targetSets[partOfSpeech].map(([word]) => word);
  return rotate(words.filter(word => word !== answer), index * 7)
    .slice(0, 3)
    .concat(answer)
    .sort((a, b) => rotate([a, b], index).join("").localeCompare(rotate([b, a], index).join("")))
    .map(word => cardFor(word, partOfSpeech, "", true));
}

function withAnswerPosition(cards, answer, index) {
  const ordered = rotate(cards, index);
  if (ordered.some(card => card.value === answer)) return ordered;
  return cards;
}

function makeLevelOneQuestion(config, target, index) {
  const [word, , scene] = target;
  const distractors = levelOneDistractors(config.partOfSpeech, index)
    .map(([distractor, part]) => cardFor(distractor, part, ""));
  const cards = withAnswerPosition([
    cardFor(word, config.partOfSpeech, scene),
    ...distractors
  ], word, index);

  return {
    id: `grammar_${config.skillId}_l1_${String(index + 1).padStart(3, "0")}`,
    grade: "K-2",
    skill: config.skillName,
    skillName: config.skillName,
    skillId: config.skillId,
    level: 1,
    phase: index < 15 ? 1 : 2,
    assessmentLevel: 1,
    assessmentPhase: index < 15 ? 1 : 2,
    phaseTarget: `level_1_phase_${index < 15 ? 1 : 2}`,
    questionType: "visual_card_choice",
    templateType: FORMAT_IMAGE_CHOICE,
    formatType: FORMAT_IMAGE_CHOICE,
    prompt: config.prompt,
    question: config.prompt,
    targetWord: word,
    correctAnswer: word,
    answer: word,
    choices: cards.map(card => card.value),
    imageCards: cards,
    itemType: config.itemType,
    itemKey: word,
    partOfSpeech: config.partOfSpeech,
    disableAudio: true,
    source: SOURCE,
    active: true,
    explanation: `${word} is a ${config.partOfSpeech}.`
  };
}

function makeLevelTwoQuestion(config, target, index) {
  const [word, sentence, scene] = target;
  const options = sentenceOptions(config.partOfSpeech, word, index);

  return {
    id: `grammar_${config.skillId}_l2_${String(index + 1).padStart(3, "0")}`,
    grade: "K-2",
    skill: config.skillName,
    skillName: config.skillName,
    skillId: config.skillId,
    level: 2,
    phase: index < 15 ? 1 : 2,
    assessmentLevel: 2,
    assessmentPhase: index < 15 ? 1 : 2,
    phaseTarget: `level_2_phase_${index < 15 ? 1 : 2}`,
    questionType: "ixl_template",
    templateType: FORMAT_SENTENCE_FIT,
    formatType: FORMAT_SENTENCE_FIT,
    prompt: config.sentencePrompt,
    question: config.sentencePrompt,
    sentence,
    targetWord: word,
    imagePath: svgDataUri({ word, partOfSpeech: config.partOfSpeech, scene }),
    imageUrl: svgDataUri({ word, partOfSpeech: config.partOfSpeech, scene }),
    targetImage: svgDataUri({ word, partOfSpeech: config.partOfSpeech, scene }),
    targetImageAlt: scene,
    correctAnswer: word,
    answer: word,
    choices: options.map(option => option.value),
    answerOptions: options,
    itemType: config.itemType,
    itemKey: word,
    partOfSpeech: config.partOfSpeech,
    requireOptionAudio: true,
    disableAudio: true,
    source: SOURCE,
    active: true,
    explanation: `${word} makes the sentence make sense.`
  };
}

function buildSkillQuestions(config, targets) {
  return [
    ...targets.map((target, index) => makeLevelOneQuestion(config, target, index)),
    ...targets.map((target, index) => makeLevelTwoQuestion(config, target, index))
  ];
}

export const grammarAssessmentQuestions = [
  ...buildSkillQuestions(skillConfigs.nouns, nounTargets),
  ...buildSkillQuestions(skillConfigs.verbs, verbTargets),
  ...buildSkillQuestions(skillConfigs.adjectives, adjectiveTargets)
];
