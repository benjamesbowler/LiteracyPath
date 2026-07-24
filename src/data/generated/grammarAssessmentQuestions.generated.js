/* eslint-disable no-unused-vars -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { getApprovedAudioPath } from "../audioPreferenceManifest.js";
import { getChildWordAsset } from "../childAssets.js";
import { isMediaQaRuntimeAllowed } from "../mediaQaManifest.js";

const SOURCE = "grammar_replacement_2026_06";
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

// Each row: [word, level1Sentence, imageScene, level2Sentence, level2Distractors?].
// Level 2 uses a different (harder) sentence than level 1 so the two levels are
// never duplicate prompt+answer pairs. An optional 4-word curated distractor
// list replaces the rotation when only hand-picked options are safe.
const nounTargets = [
  ["cat", "The ___ naps on the mat.", "a cat napping on a mat", "The ___ chases the ball of yarn."],
  ["dog", "The ___ runs in the park.", "a dog running in a park", "The ___ digs a hole in the garden."],
  ["bus", "The children ride the ___.", "children waiting by a bus", "The yellow ___ stops at the school."],
  ["hat", "She puts on a ___.", "a child wearing a hat", "The ___ keeps the sun off her head."],
  ["map", "We look at the ___ to find the road.", "a map on a table", "The ___ shows us the way home."],
  ["bed", "He sleeps in the ___.", "a bed in a bedroom", "The ___ has a soft warm blanket."],
  ["cup", "She drinks from the ___.", "a cup on a table", "The ___ is full of warm milk."],
  ["bug", "The ___ crawls on the leaf.", "a bug on a leaf", "The little ___ hides under the rock."],
  ["fish", "The ___ swims in the pond.", "a fish in water", "The ___ blows bubbles in the tank."],
  ["frog", "The ___ jumps near the pond.", "a frog near a pond", "The ___ catches a fly with its tongue."],
  ["goat", "The ___ eats grass.", "a goat eating grass", "The ___ climbs up the rocky hill."],
  ["duck", "The ___ swims on the lake.", "a duck on a lake", "The ___ splashes in the puddle."],
  ["man", "The ___ waves hello.", "a man waving", "The ___ reads his newspaper on the bench."],
  ["bag", "She packs the ___.", "a bag on a chair", "The ___ is heavy with library books."],
  ["ball", "He kicks the ___.", "a ball on grass", "The ___ bounces down the steps."],
  ["bat", "The player holds the ___.", "a baseball bat", "The player swings the ___ at the ball."],
  ["book", "We read the ___.", "a book open on a desk", "The ___ has pictures of dinosaurs."],
  ["chair", "The ___ is by the table.", "a chair by a table", "The ___ has four strong legs."],
  ["coat", "He wears a warm ___.", "a coat on a hook", "The ___ keeps him warm in the snow."],
  ["fox", "The ___ hides in the grass.", "a fox in grass", "The ___ sneaks through the tall grass."],
  ["flag", "The ___ waves in the wind.", "a flag on a pole", "The ___ flaps at the top of the pole."],
  ["jet", "The ___ flies in the sky.", "a jet in the sky", "The ___ leaves a white line in the sky."],
  ["leg", "The dog hurt its ___.", "a leg with a bandage", "The dog licks its sore ___."],
  ["log", "The ___ sits by the fire.", "a log near a fire", "The ___ floats down the river."],
  ["mug", "The ___ is full of milk.", "a mug on a table", "The ___ is warm from the cocoa."],
  ["pan", "Dad cooks with the ___.", "a pan on a stove", "The ___ sizzles on the stove."],
  ["pen", "She writes with a ___.", "a pen on paper", "The ___ ran out of blue ink."],
  ["pig", "The ___ rolls in the mud.", "a pig in mud", "The ___ sniffs for food in the mud."],
  ["pot", "The plant is in a ___.", "a plant in a pot", "The ___ holds a green leafy plant."],
  ["ram", "The ___ stands on the hill.", "a ram on a hill", "The ___ has big curly horns."]
];

const verbTargets = [
  ["run", "The child can ___ fast.", "a child running", "She can ___ faster than her brother."],
  ["hop", "The frog can ___ on the log.", "a frog hopping", "The frog will ___ from log to log."],
  ["dig", "The dog will ___ in the dirt.", "a dog digging", "The dog likes to ___ in the soft dirt."],
  ["stop", "The bus will ___ at the sign.", "a bus stopped at a sign", "The bus must ___ when the light is red."],
  ["clap", "The children ___ after the song.", "children clapping", "We ___ our hands after the show."],
  ["cut", "Mum will ___ the paper.", "scissors cutting paper", "Use the scissors to ___ along the line."],
  ["sit", "The boy will ___ on the chair.", "a boy sitting on a chair", "Please ___ down for story time."],
  ["read", "The girl will ___ the book.", "a girl reading a book", "She likes to ___ before bed."],
  ["swim", "The child can ___ in the pool.", "a child swimming", "We learn to ___ at the pool."],
  ["sleep", "The baby will ___ in the bed.", "a baby sleeping", "The baby will ___ after his bottle."],
  ["draw", "The child will ___ a star.", "a child drawing", "He will ___ a house with a red roof."],
  ["kick", "He will ___ the ball.", "a child kicking a ball", "She will ___ the ball into the net."],
  ["throw", "She will ___ the beanbag.", "a child throwing a beanbag", "He can ___ the beanbag into the hoop."],
  ["crawl", "The baby can ___ on the rug.", "a baby crawling", "The baby can ___ across the room."],
  ["drink", "The girl will ___ water.", "a girl drinking water", "She will ___ some water after the race."],
  ["paint", "The child will ___ a picture.", "a child painting", "We will ___ the picture with a big brush."],
  ["ride", "They will ___ a bike.", "a child riding a bike", "He learns to ___ his bike without help."],
  ["stand", "The class will ___ in a line.", "children standing in line", "We ___ in line for the bus."],
  ["open", "He will ___ the door.", "a child opening a door", "She will ___ the door for Grandpa."],
  ["wash", "She will ___ her hands.", "a child washing hands", "We ___ our hands before we eat."],
  ["pull", "The child will ___ the rope.", "a child pulling a rope", "The team will ___ the rope together."],
  ["push", "The child will ___ the cart.", "a child pushing a cart", "He will ___ the cart up the hill."],
  ["clean", "The child will ___ the table.", "a child cleaning a table", "We ___ the table after lunch."],
  ["laugh", "The friends ___ at the joke.", "children laughing", "The funny joke makes us ___."],
  ["smile", "The girl will ___ for the photo.", "a child smiling", "She will ___ when she sees the puppy."],
  ["wave", "The boy will ___ goodbye.", "a child waving", "We ___ goodbye from the window."],
  ["skip", "The child can ___ down the path.", "a child skipping", "She likes to ___ on the way to school."],
  ["climb", "The child will ___ the ladder.", "a child climbing a ladder", "He will ___ to the top of the ladder."],
  ["brush", "She will ___ her teeth.", "a child brushing teeth", "I ___ my teeth every night before bed."],
  ["mix", "He will ___ the batter.", "a child mixing batter", "We ___ the eggs into the batter."],
  ["blow", "She will ___ the bubbles.", "a child blowing bubbles", "The wind will ___ the leaves around."],
  ["carry", "Dad will ___ the big box.", "a man carrying a box", "She helps ___ the bags inside."],
  ["catch", "He will ___ the ball.", "a child catching a ball", "The mitt helps him ___ the fast ball."],
  ["cook", "Mum will ___ the dinner.", "a parent cooking dinner", "We ___ the soup in a big pot."],
  ["count", "We will ___ the blocks.", "a child counting blocks", "She can ___ from one to twenty."],
  ["dance", "The children ___ to the music.", "children dancing", "The friends will ___ at the party."],
  ["eat", "The boy will ___ his lunch.", "a boy eating lunch", "The rabbit likes to ___ crunchy carrots."],
  ["help", "The friends will ___ each other.", "children helping each other", "I can ___ Dad rake the leaves."],
  ["listen", "We ___ to the story.", "children listening to a story", "Please ___ for the school bell."],
  ["melt", "The sun will ___ the ice.", "ice melting in the sun", "The snowman will ___ on a warm day."],
  ["pour", "She will ___ the milk.", "a child pouring milk", "Dad will ___ the juice into the cups."],
  ["shake", "The wet dog will ___.", "a wet dog shaking", "You must ___ the bottle before you pour."],
  ["sing", "The class will ___ a song.", "children singing", "The birds ___ in the morning."],
  ["think", "I will ___ about the answer.", "a child thinking", "Take a minute to ___ before you guess."]
];

const adjectiveTargets = [
  ["big", "The ___ dog runs in the yard.", "a large dog", "The ___ dog needs a bigger bed."],
  ["red", "The ___ hat is on the table.", "a red hat", "The ripe apple is ___.", ["sad", "loud", "slow"]],
  ["black", "The ___ cat sits by the wall.", "a black cat", "The ___ cat hunts at night."],
  ["blue", "The ___ cup is on the shelf.", "a blue cup", "She picks the ___ cup, not the green one."],
  ["sad", "The ___ child needs a hug.", "a sad child", "The ___ child misses his mum."],
  ["hot", "The soup is ___.", "a steaming bowl of soup", "The ___ soup steams in the bowl."],
  ["cold", "The ice is ___.", "ice cubes", "The ice cubes feel ___ in my hand."],
  ["fast", "The ___ car wins the race.", "a fast car", "The ___ car zooms past the truck."],
  ["slow", "The ___ turtle walks on the path.", "a slow turtle", "The ___ turtle is last to the pond."],
  ["small", "The ___ bug is on the leaf.", "a small bug", "The ___ bug hides under a leaf."],
  ["wet", "The ___ dog shakes off water.", "a wet dog", "The ___ dog needs a big towel."],
  ["dry", "The ___ towel is on the chair.", "a dry towel", "The ___ towel is warm from the sun."],
  ["clean", "The ___ plate is on the table.", "a clean plate", "The ___ plate shines after washing."],
  ["dirty", "The ___ boots are by the door.", "dirty boots", "The ___ boots leave mud on the floor."],
  ["hard", "The ___ rock is on the path.", "a hard rock", "The ___ rock will not bend or squish."],
  ["soft", "The ___ pillow is on the bed.", "a soft pillow", "The ___ pillow feels like a cloud."],
  ["long", "The ___ rope is on the floor.", "a long rope", "The ___ rope reaches across the yard."],
  ["short", "The ___ pencil is in the box.", "a short pencil", "The ___ pencil is almost used up."],
  ["tall", "The ___ tree stands by the house.", "a tall tree", "The ___ tree is taller than the house."],
  ["round", "The ___ ball rolls away.", "a round ball", "The ___ ball rolls down the hill."],
  ["white", "The ___ shell is on the sand.", "a white shell", "The ___ shell shines on the dark sand."],
  ["happy", "The ___ child jumps up.", "a happy child", "The ___ child laughs and claps."],
  ["bright", "The ___ light shines.", "a bright lamp", "The ___ lamp lights up the room."],
  ["dark", "The ___ room is quiet.", "a dark room", "It is hard to see in the ___ room."],
  ["loud", "The ___ drum wakes the baby.", "a loud drum", "The ___ drum booms across the gym."],
  ["full", "The ___ cup sits on the table.", "a full cup", "The ___ cup spills if you bump it."],
  ["light", "The ___ bag is easy to carry.", "a light bag", "The ___ bag swings from one finger."],
  ["heavy", "The ___ box is hard to lift.", "a heavy box", "The ___ box needs two people to lift."],
  ["cute", "The ___ puppy plays.", "a cute puppy", "The ___ puppy wiggles its tail."],
  ["orange", "The ___ fish swims.", "an orange fish", "The ___ fish glows in the tank."],
  ["tiny", "The ___ ant walks up the wall.", "a tiny ant", "A ___ seed can grow into a big plant."],
  ["warm", "The ___ blanket feels nice.", "a warm blanket", "She wears a ___ coat in the snow."],
  ["old", "The ___ shoe has a hole.", "an old worn shoe", "The ___ truck is rusty and slow."],
  ["new", "The ___ shoes are shiny.", "a pair of new shoes", "He opens his ___ book first."],
  ["brown", "The ___ bear eats berries.", "a brown bear", "The ___ dog digs in the sand."],
  ["purple", "The ___ flower grows tall.", "a purple flower", "She paints a ___ star on the page."],
  ["fluffy", "The ___ chick says peep.", "a fluffy chick", "The ___ kitten looks like a cotton ball."],
  ["shiny", "The ___ coin sparkles.", "a shiny coin", "He finds a ___ shell on the beach."],
  ["sweet", "The ___ apple tastes good.", "a sweet red apple", "The bees make ___ honey."],
  ["strong", "The ___ horse pulls the cart.", "a strong horse", "The ___ man lifts the heavy log."],
  ["smooth", "The ___ stone feels nice.", "a smooth stone", "The slide is ___ and fast."],
  ["playful", "The ___ puppy chases the ball.", "a playful puppy", "The ___ kitten pounces on the string."]
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

function imageFor(word, partOfSpeech) {
  const normalized = slug(word);
  return grammarImageOverrides[partOfSpeech]?.[normalized] || getChildWordAsset(normalized)?.image || "";
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

function sentenceOptionFor(word, partOfSpeech) {
  const audio = approvedAudioFor(word);
  return {
    id: `${partOfSpeech}-${slug(word)}-text`,
    word,
    label: word,
    value: word,
    partOfSpeech,
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
    .map(word => sentenceOptionFor(word, partOfSpeech));
}

function sentenceFor(partOfSpeech, answer, level = 1) {
  const target = targetSets[partOfSpeech]?.find(([word]) => word === answer);
  if (level === 2 && target?.[3]) return target[3];
  if (target?.[1]) return target[1];
  if (partOfSpeech === "noun") return "Choose the ___ that fits the picture.";
  if (partOfSpeech === "verb") return "The child will ___ in the picture.";
  return "The pictured object looks ___.";
}

function makeLevelOneQuestion(config, target, index) {
  const [word, , scene] = target;
  const optionRows = [
    ...levelOneDistractors(config.partOfSpeech, index),
    [word, config.partOfSpeech]
  ].slice(0, 4);
  const options = rotate(optionRows, index).map(([option, optionPart]) => sentenceOptionFor(option, optionPart));
  const imagePath = imageFor(word, config.partOfSpeech);

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
    questionType: "ixl_template",
    templateType: FORMAT_SENTENCE_FIT,
    formatType: FORMAT_SENTENCE_FIT,
    prompt: config.sentencePrompt,
    question: config.sentencePrompt,
    sentence: sentenceFor(config.partOfSpeech, word),
    targetWord: word,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
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

function makeLevelTwoQuestion(config, target, index) {
  const [word, , scene, , curatedDistractors] = target;
  const options = Array.isArray(curatedDistractors) && curatedDistractors.length === 3
    ? rotate([...curatedDistractors, word], index).map(option => sentenceOptionFor(option, config.partOfSpeech))
    : sentenceOptions(config.partOfSpeech, word, index);
  const imagePath = imageFor(word, config.partOfSpeech);

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
    sentence: sentenceFor(config.partOfSpeech, word, 2),
    targetWord: word,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
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
  ].filter(question =>
    question.imagePath &&
    isMediaQaRuntimeAllowed(question.imagePath, "image")
  );
}

export const grammarAssessmentQuestions = [
  ...buildSkillQuestions(skillConfigs.nouns, nounTargets),
  ...buildSkillQuestions(skillConfigs.verbs, verbTargets),
  ...buildSkillQuestions(skillConfigs.adjectives, adjectiveTargets)
];
