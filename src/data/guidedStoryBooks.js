const normalizeText = text => String(text || "").replace(/\s+/g, " ").trim();

const wordAudio = word => `/audio/child-mode/words/${word.toLowerCase().replace(/[^a-z0-9'-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

const words = text =>
  normalizeText(text)
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

const characterFieldFallbacks = {
  ageSpecies: "Use the exact age/species implied by the canonical appearance; do not change age or species between pages.",
  skinFurColor: "Use the exact skin, fur, feather, or body color named in the canonical appearance; if not visible, keep it visually unchanged.",
  hairStyleColor: "Use the exact hair, mane, feather, or head detail named in the canonical appearance; if not applicable, do not invent one.",
  eyeColor: "Use one consistent eye color and eye style across every page.",
  clothing: "Use the same clothing on every page; if no clothing is specified, do not add random clothing.",
  accessories: "Use only the accessories named in the canonical appearance, and keep them unchanged.",
  personality: "Keep the character's emotional role consistent with the story arc.",
  speakingStyle: "Use natural child-friendly dialogue that matches the character's role.",
  heightBuild: "Keep the same size, body shape, proportions, and visual age across every page.",
  settingRelationship: "Keep the character visually connected to the story setting and sequence."
};

function normalizeCharacterProfile(character) {
  const canonicalAppearance = character.canonicalAppearance || character.consistency || "";

  return {
    name: character.name,
    canonicalAppearance,
    ageSpecies: character.ageSpecies || character.species || canonicalAppearance || characterFieldFallbacks.ageSpecies,
    skinFurColor: character.skinFurColor || character.furColor || character.bodyColor || characterFieldFallbacks.skinFurColor,
    hairStyleColor: character.hairStyleColor || character.hairColor || character.maneColor || characterFieldFallbacks.hairStyleColor,
    eyeColor: character.eyeColor || characterFieldFallbacks.eyeColor,
    clothing: character.clothing || characterFieldFallbacks.clothing,
    accessories: character.accessories || characterFieldFallbacks.accessories,
    personality: character.personality || characterFieldFallbacks.personality,
    speakingStyle: character.speakingStyle || characterFieldFallbacks.speakingStyle,
    heightBuild: character.heightBuild || characterFieldFallbacks.heightBuild,
    settingRelationship: character.settingRelationship || characterFieldFallbacks.settingRelationship,
    consistency: canonicalAppearance
  };
}

function buildEnvironmentBible(config) {
  return {
    primarySetting: config.primarySetting,
    timeOfDay: config.timeOfDay || "Use the same time-of-day logic from the story sequence; do not change randomly.",
    weather: config.weather || "Use stable weather unless the page text clearly changes it.",
    lighting: config.lighting || "Keep lighting coherent from page to page unless the story intentionally changes time.",
    recurringProps: config.recurringProps || [],
    settingContinuity: config.settingContinuity || "Each page must feel like it belongs to the same story world and sequence.",
    forbiddenSettingDrift: [
      "random desert, beach, classroom, city, or indoor switch unless written in the page text",
      "random season changes",
      "random weather changes",
      "random day/night changes",
      "unexplained new buildings, props, or background characters"
    ]
  };
}

const continuityChecklist = [
  "same character appearance",
  "same clothing and accessories",
  "same hair/fur/body colors",
  "same visual age/species/body proportions",
  "same illustration style",
  "logical setting continuity",
  "coherent time of day/weather/lighting",
  "recurring props remain consistent",
  "story events flow in page order"
];

const ignoredCharacterTerms = new Set(["the", "and", "with", "little", "small", "adult", "young"]);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function inferVisibleCharacters(item, characterBible) {
  if (Array.isArray(item.visibleCharacters)) return item.visibleCharacters;

  const haystack = `${item.text} ${item.requiredAction}`.toLowerCase();
  const visible = characterBible
    .filter(character => {
      const terms = String(character.name || "")
        .toLowerCase()
        .split(/\s+/)
        .map(term => term.replace(/[^a-z0-9'-]/g, ""))
        .filter(term => term.length > 2 && !ignoredCharacterTerms.has(term));
      return terms.some(term => new RegExp(`\\b${escapeRegExp(term)}\\b`).test(haystack));
    })
    .map(character => character.name);

  return visible.length ? visible : [characterBible[0]?.name].filter(Boolean);
}

function page(text, action, setting) {
  return {
    text: normalizeText(text),
    requiredAction: action,
    setting
  };
}

function buildStoryBook(config) {
  const characterBible = config.characterBible.map(normalizeCharacterProfile);
  const environmentBible = buildEnvironmentBible(config);
  const pages = config.pages.map((item, index) => ({
    pageNumber: index + 1,
    text: item.text,
    image: "",
    pageAudio: "",
    imageAlt: `${config.title} page ${index + 1} illustration`,
    requiredAction: item.requiredAction,
    visibleCharacters: inferVisibleCharacters(item, characterBible),
    setting: item.setting || config.primarySetting,
    pageDescription: item.requiredAction,
    embeddedImageText: "",
    targetWords: config.targetVocabulary,
    decodableFocus: config.decodableFocus,
    highFrequencyWords: config.highFrequencyWords,
    words: words(item.text),
    qaStatus: "draft_needs_assets",
    qaNotes: "Draft guided story page. Waiting for matching illustration-only art and exact narration.",
    imagePrompt: [
      `Book: ${config.title}. Page ${index + 1}.`,
      `Exact app text: "${item.text}"`,
      `Show: ${item.requiredAction}`,
      `Setting: ${item.setting || config.primarySetting}.`,
      `Canonical character bible: ${characterBible.map(character => `${character.name}: ${character.canonicalAppearance}; clothing: ${character.clothing}; accessories: ${character.accessories}; height/build: ${character.heightBuild}`).join(" | ")}.`,
      `Environment bible: primary setting is ${environmentBible.primarySetting}; time/weather/lighting must remain coherent with previous pages.`,
      `Continuity rule: this page must visually follow page ${index === 0 ? "1 as the opening scene" : index}; do not redesign characters, clothing, props, setting, lighting, or art style.`,
      "No embedded text, captions, labels, watermarks, speech bubbles, or extra characters.",
      "Keep character age/species, clothing, colors, and accessories identical to the character bible."
    ].join(" ")
  }));

  const imagePromptPack = pages.map(item => ({
    pageNumber: item.pageNumber,
    exactAppText: item.text,
    imagePrompt: item.imagePrompt,
    requiredVisibleCharacters: item.visibleCharacters,
    requiredSetting: item.setting || config.primarySetting,
    requiredAction: item.requiredAction,
    forbiddenElements: [
      "embedded text",
      "captions",
      "speech bubbles",
      "watermarks",
      "random extra characters",
      "random character redesigns",
      "random clothing changes",
      "random setting, weather, or lighting changes",
      "scary or violent imagery"
    ],
    characterBible,
    environmentBible,
    continuityNotes: [
      `Use the canonical character bible for ${config.title} on every page.`,
      "Reference the prior page before generating the next page.",
      "Maintain one illustrated universe across the whole book."
    ],
    continuityChecklist,
    consistencyNotes: characterBible.map(character => `${character.name}: ${character.canonicalAppearance}`).join(" ")
  }));

  const narrationScript = pages.map(item => ({
    pageNumber: item.pageNumber,
    fileName: `${config.id}-page-${String(item.pageNumber).padStart(2, "0")}.mp3`,
    exactNarrationText: item.text,
    voiceStyle: "neutral warm human guided-reading teacher voice",
    pacingNotes: "natural, calm, slightly slower than conversation, no extra intro or outro",
    pronunciationNotes: config.pronunciationNotes || "Read words naturally. Do not spell words letter by letter."
  }));

  return {
    id: config.id,
    title: config.title,
    type: "fiction",
    level: config.level,
    sourceType: config.sourceType,
    sourceTitle: config.sourceTitle,
    sourceCollection: config.sourceCollection,
    active: false,
    qaStatus: "draft_needs_assets",
    coverImage: "",
    targetSkills: config.decodableFocus,
    targetVocabulary: config.targetVocabulary,
    decodableFocus: config.decodableFocus,
    highFrequencyWords: config.highFrequencyWords,
    comprehensionFocus: config.comprehensionFocus,
    moral: config.moral,
    theme: config.moral,
    primarySetting: config.primarySetting,
    characterBible,
    environmentBible,
    continuityNotes: [
      "Fiction continuity is mandatory. Character drift, random clothing changes, setting drift, lighting drift, or disconnected scene sequencing blocks activation.",
      "Consistency overrides image prettiness. A beautiful page that redesigns a character or setting is a failed page.",
      "Nonfiction may vary by page, but this fiction book must preserve narrative and visual continuity."
    ],
    continuityChecklist,
    continuityStatus: "draft_needs_assets",
    imagePromptPack,
    narrationScript,
    pages
  };
}

const levelC = {
  level: "C",
  highFrequencyWords: ["the", "said", "little", "went", "help", "was"],
  decodableFocus: ["short vowels", "digraph review", "simple dialogue"]
};

const levelD = {
  level: "D",
  highFrequencyWords: ["because", "again", "around", "could", "would", "before"],
  decodableFocus: ["short vowel review", "blends", "digraphs", "story sequence"]
};

const levelE = {
  level: "E",
  highFrequencyWords: ["through", "thought", "enough", "together", "different", "answer"],
  decodableFocus: ["multisyllable words", "dialogue", "problem and solution"]
};

const levelF = {
  level: "F",
  highFrequencyWords: ["although", "wondered", "decided", "carefully", "important", "understood"],
  decodableFocus: ["richer sentences", "inference", "retelling", "character motivation"]
};

const draftDefinitions = [
  {
    id: "gs-c-01",
    title: "The Lion and the Little Mouse",
    ...levelC,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Lion and the Mouse",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["lion", "mouse", "net", "help", "free", "kind"],
    comprehensionFocus: "Small actions can solve big problems.",
    moral: "Kindness matters, even when help seems small.",
    primarySetting: "sunny grassland near a shady tree",
    characterBible: [
      {
        name: "Luma the lion",
        consistency: "golden adult lion with a soft brown mane, amber eyes, broad paws, and calm gentle posture",
        ageSpecies: "adult lion",
        skinFurColor: "golden fur with a warm brown mane",
        hairStyleColor: "full soft brown mane, same shape on every page",
        eyeColor: "amber eyes",
        clothing: "no clothing",
        accessories: "no accessories",
        personality: "powerful but gentle, surprised at first, grateful by the end",
        speakingStyle: "slow, warm, respectful",
        heightBuild: "large sturdy lion with broad paws and consistent adult proportions",
        settingRelationship: "belongs in the same sunny grassland near one shady tree"
      },
      {
        name: "Pip the mouse",
        consistency: "small gray mouse with round ears, black eyes, pink nose, and a tiny blue scarf",
        ageSpecies: "small mouse",
        skinFurColor: "soft gray fur with pale pink inner ears and nose",
        hairStyleColor: "smooth gray head fur with round ears",
        eyeColor: "small black eyes",
        clothing: "tiny blue scarf only",
        accessories: "tiny blue scarf, always tied the same way",
        personality: "brave, polite, determined, kind",
        speakingStyle: "small but clear and brave",
        heightBuild: "tiny rounded mouse, always much smaller than Luma",
        settingRelationship: "lives near the grassland tree and small mouse hole"
      }
    ],
    pages: [
      page("Luma the lion slept under a warm tree. Pip the mouse ran over his paw and stopped with a squeak.", "Luma sleeping while Pip freezes beside his paw", "warm grassland under a tree"),
      page("Luma opened one eye and lifted his head. Pip said, “Please let me go, and I will help you one day.”", "Luma looking down gently as Pip speaks", "same tree in the grassland"),
      page("The lion almost laughed at the tiny mouse. Then he saw that Pip was brave, so he let him run home.", "Luma lowering his paw while Pip runs safely away", "sunny grass near mouse hole"),
      page("The next morning, hunters left a rope net in the tall grass. Luma stepped into it and could not get free.", "Luma tangled carefully in a rope net", "tall grass near the tree"),
      page("Luma roared, but the net held tight. Birds flew up, and Pip heard the sound from his small home.", "Pip hearing Luma from a mouse hole", "edge of grassland"),
      page("Pip ran to the net and saw the thick ropes. He did not run away, even though the ropes were big.", "Pip beside the rope net looking determined", "grass around the net"),
      page("Pip bit one rope, then another rope. His small teeth worked slowly, but they worked well.", "Pip chewing through rope strands", "close view of net and grass"),
      page("At last, the net opened wide. Luma shook his mane and stepped out carefully.", "Luma stepping out of open net while Pip watches", "sunny grassland"),
      page("Luma bowed his great head to Pip. “You helped me,” said the lion, “just as you promised.”", "Luma thanking Pip with a gentle bow", "under the tree again"),
      page("Pip smiled and sat beside the lion’s paw. From that day on, Luma remembered that help can be small and strong.", "Pip and Luma sitting peacefully together", "warm tree shade")
    ]
  },
  {
    id: "gs-c-02",
    title: "The Crow and the Water Jar",
    ...levelC,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Crow and the Pitcher",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["crow", "jar", "stone", "water", "think", "drink"],
    comprehensionFocus: "A character solves a problem by trying a plan.",
    moral: "Thinking carefully can help when strength is not enough.",
    primarySetting: "dry garden path with a clay water jar",
    characterBible: [
      {
        name: "Cora the crow",
        consistency: "black crow with glossy feathers, dark eyes, charcoal beak, and a tiny green leaf tucked near one wing",
        ageSpecies: "adult crow",
        skinFurColor: "glossy black feathers with subtle blue highlights",
        hairStyleColor: "smooth black head feathers",
        eyeColor: "dark brown eyes",
        clothing: "no clothing",
        accessories: "tiny green leaf tucked near the same wing on every page",
        personality: "thirsty, thoughtful, patient, proud of a good plan",
        speakingStyle: "clear and thoughtful",
        heightBuild: "small bird with consistent crow proportions",
        settingRelationship: "moves around the same dry garden path and clay jar"
      },
      {
        name: "Little sparrow",
        consistency: "small tan sparrow with a cream belly, tiny brown beak, and bright black eyes",
        ageSpecies: "small sparrow",
        skinFurColor: "tan feathers with cream belly",
        hairStyleColor: "smooth tan head feathers",
        eyeColor: "bright black eyes",
        clothing: "no clothing",
        accessories: "no accessories",
        personality: "curious and impressed",
        speakingStyle: "short cheerful chirps",
        heightBuild: "smaller than Cora, round sparrow body",
        settingRelationship: "watches from the same garden wall near the jar"
      }
    ],
    pages: [
      page("Cora the crow flew over a dry garden. Her throat felt scratchy, and she looked for water.", "Cora flying over a dry garden path", "dry garden"),
      page("She found a tall clay jar beside a wall. Cora hopped close and saw water far down inside.", "Cora peering into a tall clay jar", "garden wall"),
      page("Cora pushed her beak into the jar. The water was too low, and she could not reach it.", "Cora trying to reach water in the jar", "beside the jar"),
      page("She looked around the garden path. Small smooth stones lay near the wall.", "Cora noticing stones on the path", "stone path"),
      page("Cora picked up one stone and dropped it into the jar. Plink! The water moved a little.", "Cora dropping one stone into jar", "beside jar"),
      page("She dropped in another stone, then another. The water rose slowly, just like Cora hoped.", "Cora adding stones while water level rises", "garden path"),
      page("The sun was hot, but Cora did not quit. She carried stone after stone to the jar.", "Cora working steadily in sunlight", "dry sunny garden"),
      page("Soon the water was near the top. Cora leaned in and took a cool drink.", "Cora drinking from the raised water", "jar by wall"),
      page("A little sparrow watched from the wall. “You made the water come up!” the sparrow chirped.", "sparrow watching Cora near jar", "garden wall"),
      page("Cora shook her wings and smiled. “I did not make it come up,” she said. “I made a good plan.”", "Cora standing proudly beside jar", "dry garden now calm")
    ]
  },
  {
    id: "gs-c-03",
    title: "The Fox and the High Grapes",
    ...levelC,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Fox and the Grapes",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["fox", "grapes", "jump", "high", "try", "honest"],
    comprehensionFocus: "Readers infer why the fox changes what he says.",
    moral: "It is better to be honest about disappointment.",
    primarySetting: "vineyard with a high grape vine",
    characterBible: [
      {
        name: "Felix the fox",
        consistency: "small red fox with orange-red fur, white tail tip, amber eyes, and a tan satchel",
        ageSpecies: "young fox",
        skinFurColor: "orange-red fur with cream chest and white tail tip",
        hairStyleColor: "smooth red fox head fur with pointed ears",
        eyeColor: "amber eyes",
        clothing: "no clothing",
        accessories: "tan satchel worn across one shoulder, same placement every page",
        personality: "eager, embarrassed, then honest",
        speakingStyle: "quick and proud at first, softer when honest",
        heightBuild: "small slim fox with consistent pointed ears and bushy tail",
        settingRelationship: "walks beneath the same grape vine and vineyard fence"
      },
      {
        name: "Fence bird",
        consistency: "small blue bird with a yellow chest, round black eyes, and short tail feathers",
        ageSpecies: "small bird",
        skinFurColor: "blue feathers with yellow chest",
        hairStyleColor: "smooth blue head feathers",
        eyeColor: "round black eyes",
        clothing: "no clothing",
        accessories: "no accessories",
        personality: "observant and gentle",
        speakingStyle: "light, curious, kind",
        heightBuild: "tiny bird, always much smaller than Felix",
        settingRelationship: "perches on the same vineyard fence near the grapes"
      }
    ],
    pages: [
      page("Felix the fox walked by a vine after lunch. Purple grapes hung high above his head.", "Felix looking up at high purple grapes", "sunny vineyard"),
      page("The grapes looked round and sweet. Felix licked his lips and backed up for a jump.", "Felix preparing to jump", "under grape vine"),
      page("He jumped once, but his paws touched only air. The grapes swung gently in the wind.", "Felix jumping below grapes", "vineyard"),
      page("He jumped again and landed in a puff of dust. The grapes still waited high on the vine.", "Felix landing in dust after jump", "dusty path"),
      page("Felix looked left and right. No one had seen him miss, but his ears felt hot.", "Felix embarrassed but alone", "vineyard path"),
      page("A bird called from the fence, “Those grapes look good.” Felix stood tall and flicked his tail.", "bird on fence and Felix pretending confidence", "fence near vine"),
      page("“They are probably sour,” said Felix. “I did not want them anyway.”", "Felix walking away from grapes", "vineyard fence"),
      page("Felix took three steps, then stopped. His stomach still wanted grapes, and his words felt wrong.", "Felix pausing thoughtfully", "path away from vine"),
      page("He looked back and said, “I wanted them, but they were too high for me today.” The honest words felt better than pretending.", "Felix speaking honestly to bird", "vineyard path"),
      page("The bird nodded from the fence. Felix felt lighter as he walked on to find lunch he could reach.", "Felix walking calmly toward berry bushes", "sunny path")
    ]
  },
  {
    id: "gs-c-04",
    title: "The Dog and the River Shadow",
    ...levelC,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Dog and His Shadow",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["dog", "river", "shadow", "bone", "drop", "want"],
    comprehensionFocus: "Readers connect a choice to its consequence.",
    moral: "Wanting more can make us lose what we have.",
    primarySetting: "small bridge over a calm river",
    characterBible: [
      {
        name: "Rex the dog",
        consistency: "brown dog with floppy ears, warm brown eyes, short tail, and a red collar",
        ageSpecies: "friendly medium-sized dog",
        skinFurColor: "warm brown fur with slightly darker floppy ears",
        hairStyleColor: "short smooth brown head fur",
        eyeColor: "warm brown eyes",
        clothing: "no clothing",
        accessories: "red collar, always the same",
        personality: "proud, tempted, disappointed, then wiser",
        speakingStyle: "expressed through dog body language, no spoken dialogue",
        heightBuild: "medium dog with sturdy body and floppy ears",
        settingRelationship: "walks from the village path across the same small river bridge"
      },
      {
        name: "Baker Mara",
        consistency: "kind adult baker with medium brown skin, gray-streaked dark hair in a bun, white apron, and blue dress",
        ageSpecies: "adult human baker",
        skinFurColor: "medium brown skin",
        hairStyleColor: "dark hair with gray streaks, always tied in a bun",
        eyeColor: "dark brown eyes",
        clothing: "white apron over a simple blue dress",
        accessories: "small flour cloth tucked at apron side",
        personality: "kind, observant, calm",
        speakingStyle: "gentle and practical",
        heightBuild: "average-height adult with steady posture",
        settingRelationship: "belongs to the village path near the bakery and bridge"
      }
    ],
    pages: [
      page("Rex the dog found a big treat near the bakery. He carried it proudly toward home.", "Rex carrying a treat in his mouth", "village path"),
      page("To get home, Rex had to cross a small bridge. The river below was smooth and bright.", "Rex stepping onto bridge over river", "wooden bridge"),
      page("Rex looked down and saw another dog in the water. That dog had a treat too.", "Rex seeing his reflection in river", "bridge over water"),
      page("The dog in the water looked close. Rex thought, “If I take that treat, I will have two.”", "Rex staring at reflection with greedy expression", "river below bridge"),
      page("Rex barked at the water dog. The treat fell from his mouth and splashed into the river.", "Rex dropping treat into water", "bridge"),
      page("The water dog vanished with the ripples. Rex stared at the empty river.", "Rex watching ripples in river", "quiet bridge"),
      page("Rex sniffed the bridge boards. His treat was gone, and there was no other dog.", "Rex sniffing bridge sadly", "bridge boards"),
      page("A baker waved from the path. “Rex, why do you look so sad?” she asked.", "baker gently speaking to Rex", "village path near bridge"),
      page("Rex wagged his tail slowly. He could not answer, but he knew he had made a poor choice.", "Rex looking thoughtful beside baker", "bridge path"),
      page("From then on, Rex carried treats straight home. He did not bark at river shadows again.", "Rex walking home calmly with a small treat", "sunny village path")
    ]
  },
  {
    id: "gs-c-05",
    title: "The Wind and the Sun",
    ...levelC,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The North Wind and the Sun",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["wind", "sun", "coat", "warm", "blow", "gentle"],
    comprehensionFocus: "Readers compare two different problem-solving approaches.",
    moral: "Gentleness can work better than force.",
    primarySetting: "country road with a traveler in a coat",
    characterBible: [
      { name: "North Wind", consistency: "soft blue swirling wind with a friendly face in the clouds" },
      { name: "Sunny Sun", consistency: "golden sun with warm rays and a gentle smile" },
      { name: "Mara the traveler", consistency: "child traveler with brown skin, curly black hair, yellow coat, and blue backpack" }
    ],
    pages: [
      page("North Wind and Sunny Sun watched a traveler on the road. Mara wore a yellow coat and held it tight.", "wind and sun looking at Mara walking in coat", "country road"),
      page("“I can make Mara take off that coat,” said North Wind. He puffed up his cheeks and blew hard.", "North Wind blowing toward Mara", "windy road"),
      page("The wind pushed at Mara’s coat. Mara shivered and pulled the coat closer.", "Mara holding coat tight in wind", "country road"),
      page("North Wind blew harder and harder. Dust danced, but the coat stayed on.", "strong wind swirling dust around Mara", "road with dust"),
      page("Sunny Sun said, “Let me try in my own way.” North Wind rested behind a cloud.", "Sun preparing to shine while Wind rests", "sky over road"),
      page("Sunny Sun sent warm light over the road. Mara smiled and loosened the coat.", "warm sunlight on Mara", "sunny road"),
      page("The light grew soft and steady. Mara stopped by a stone wall and took off the coat.", "Mara removing coat comfortably", "road beside stone wall"),
      page("North Wind watched with wide eyes. “You did not push at all,” he said.", "Wind surprised while Sun shines", "sky and road"),
      page("Sunny Sun glowed gently. “Warmth helped Mara choose,” said the sun.", "Sun speaking kindly to Wind", "bright sky"),
      page("North Wind nodded and softened his breeze. Mara walked on, happy in the calm warm day.", "Mara walking happily with coat over arm", "calm sunny road")
    ]
  },
  {
    id: "gs-d-01",
    title: "The Tortoise Takes Each Step",
    ...levelD,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Tortoise and the Hare",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["tortoise", "hare", "race", "steady", "finish", "boast"],
    comprehensionFocus: "Readers track how character habits affect the ending.",
    moral: "Steady effort can win over careless speed.",
    primarySetting: "meadow race path from an oak tree to a hill",
    characterBible: [
      { name: "Tess the tortoise", consistency: "green tortoise with a small purple walking ribbon tied to her shell" },
      { name: "Hugo the hare", consistency: "tan hare with long ears and a red running scarf" }
    ],
    pages: [
      page("Hugo the hare loved to race across the meadow. He told every animal that no one could ever beat his quick feet.", "Hugo boasting to meadow animals", "meadow starting line"),
      page("Tess the tortoise listened from the shade of an oak tree. “I will race you,” she said in a quiet but steady voice.", "Tess calmly challenging Hugo", "oak tree"),
      page("The animals marked a path from the oak to the hill. Hugo bounced in place, but Tess looked at the road ahead.", "animals marking race path", "meadow path"),
      page("When the race began, Hugo shot forward like a leaf in the wind. Tess took one careful step, then another.", "Hugo sprinting while Tess starts slowly", "meadow path"),
      page("Soon Hugo was far ahead. He looked back, laughed, and decided he had time for a little rest.", "Hugo resting under bush", "pathside bush"),
      page("Tess kept moving past flowers, stones, and soft grass. She did not hurry, and she did not stop.", "Tess walking steadily past flowers", "meadow trail"),
      page("Hugo curled up under a bush and closed his eyes. The warm sun and quiet bees made him sleep longer than he planned.", "Hugo asleep with bees nearby", "sunny bush"),
      page("Tess passed the sleeping hare without a word. Her legs were tired, but the finish hill was close.", "Tess passing sleeping Hugo", "near hill"),
      page("The animals cheered as Tess reached the hill. Hugo woke and ran fast, but he was too late.", "Tess crossing finish while animals cheer", "hill finish line"),
      page("Hugo lowered his ears and shook Tess’s hand. Tess smiled because each small step had carried her all the way.", "Hugo congratulating Tess", "finish hill")
    ]
  },
  {
    id: "gs-d-02",
    title: "The Ant Saves a Crumb",
    ...levelD,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Ant and the Grasshopper",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["ant", "grasshopper", "winter", "crumb", "work", "share"],
    comprehensionFocus: "Readers identify planning, responsibility, and kindness.",
    moral: "Planning helps, and kindness can teach without shaming.",
    primarySetting: "garden path through summer and winter",
    characterBible: [
      { name: "Anya the ant", consistency: "small black ant with a red berry basket" },
      { name: "Gus the grasshopper", consistency: "green grasshopper with a tiny brown fiddle case" }
    ],
    pages: [
      page("All summer, Anya the ant carried crumbs to her warm little store room. Gus the grasshopper played music in the tall grass.", "Anya carrying crumbs while Gus plays", "summer garden"),
      page("“Come sing with me,” called Gus. Anya smiled, but she kept working because winter would come later.", "Gus inviting Anya while she carries crumbs", "garden path"),
      page("The days grew cooler, and the garden leaves turned gold. Anya counted her crumbs and fixed the door to her home.", "Anya preparing home as leaves turn", "autumn garden"),
      page("Gus still played when the wind was soft. He liked the music, but he forgot to gather food.", "Gus playing as leaves fall", "autumn grass"),
      page("Then winter covered the garden with snow. Gus was cold, hungry, and sorry that he had not planned.", "Gus cold outside in snow", "snowy garden"),
      page("Gus knocked gently on Anya’s door. “I made a mistake,” he said. “May I sit somewhere warm?”", "Gus knocking at Anya's door", "snowy ant home"),
      page("Anya opened the door and shared a small bowl of soup. She did not laugh at Gus or make him feel small.", "Anya sharing soup with Gus", "warm ant home"),
      page("Gus thanked her and asked how he could help. Anya showed him how to sweep snow away from the door.", "Gus helping sweep snow", "outside ant home"),
      page("When spring returned, Gus played one song, then gathered seeds with Anya. Work and music both had a place.", "Gus and Anya gathering seeds", "spring garden"),
      page("At the next winter storm, both friends were ready. Gus played a soft tune while Anya poured warm soup.", "friends cozy inside with soup and fiddle", "warm home in winter")
    ]
  },
  {
    id: "gs-d-03",
    title: "The Bundle That Would Not Break",
    ...levelD,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Bundle of Sticks",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["bundle", "sticks", "together", "break", "family", "strong"],
    comprehensionFocus: "Readers explain the lesson using story evidence.",
    moral: "People are stronger when they work together.",
    primarySetting: "family garden beside a small cottage",
    characterBible: [
      { name: "Grandpa Eli", consistency: "elderly man with warm brown skin, white hair, round glasses, and a green vest" },
      { name: "Mina", consistency: "child with black braids, orange shirt, and blue pants" },
      { name: "Leo", consistency: "child with light brown hair, striped green shirt, and tan shorts" }
    ],
    pages: [
      page("Mina and Leo argued while they cleaned the garden. Each child wanted to choose a different job first.", "Mina and Leo arguing with garden tools", "family garden"),
      page("Grandpa Eli watched quietly from the porch. He picked up one dry stick and handed it to Mina.", "Grandpa handing one stick to Mina", "cottage porch"),
      page("Mina snapped the stick easily. Leo grinned because one stick was not hard to break.", "Mina breaking one stick", "garden path"),
      page("Then Grandpa tied ten sticks into a bundle. He handed the bundle to Leo and asked him to try.", "Grandpa tying bundle of sticks", "garden"),
      page("Leo pushed and pulled, but the bundle stayed whole. Mina tried too, and the sticks still would not break.", "children trying to break bundle", "garden"),
      page("Grandpa untied the bundle and laid the sticks apart. “Alone, each stick is easy to break,” he said.", "sticks spread out on garden table", "garden table"),
      page("He tied the sticks together again. “Together, they help one another stay strong.”", "Grandpa holding tied bundle", "garden"),
      page("Mina looked at Leo and picked up the rake. Leo picked up the basket, and they made a new plan.", "children choosing tools calmly", "garden"),
      page("Mina raked leaves while Leo carried them away. The job went faster when they stopped arguing.", "children working together", "garden"),
      page("At sunset, the garden path was clear. Grandpa smiled because the children had learned what the bundle meant.", "family admiring clean garden", "sunset garden")
    ]
  },
  {
    id: "gs-d-04",
    title: "Two Mice, Two Homes",
    ...levelD,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Town Mouse and the Country Mouse",
    sourceCollection: "Aesop's Fables",
    targetVocabulary: ["town", "country", "quiet", "noise", "safe", "home"],
    comprehensionFocus: "Readers compare settings and character preferences.",
    moral: "The best home is the one where you feel safe and content.",
    primarySetting: "country cottage and busy town kitchen",
    characterBible: [
      { name: "Milo the country mouse", consistency: "tan mouse with a straw hat and green vest" },
      { name: "Tilly the town mouse", consistency: "gray mouse with a purple capelet and tiny silver satchel" }
    ],
    pages: [
      page("Milo the country mouse lived under a quiet cottage step. He ate seeds, berries, and crumbs from the garden.", "Milo outside quiet cottage with seeds", "country cottage"),
      page("His cousin Tilly came from town wearing a shiny capelet. She looked at Milo’s simple supper and raised her nose.", "Tilly visiting Milo at rustic supper", "cottage step"),
      page("“Come to town,” said Tilly. “There are cakes, cheese, and bright rooms everywhere.”", "Tilly inviting Milo", "country cottage"),
      page("Milo followed Tilly to a tall town house. The kitchen smelled wonderful, and a feast waited on the table.", "two mice entering town kitchen", "busy town kitchen"),
      page("Milo tasted a crumb of cake. Just then, a door slammed, and both mice dashed under a cupboard.", "mice hiding under cupboard", "town kitchen"),
      page("When the room was quiet, they crept out again. A cat’s shadow crossed the floor, and Tilly pulled Milo behind a bowl.", "cat shadow near mice", "kitchen floor"),
      page("Milo’s heart thumped like a drum. The food was rich, but every sound made him jump.", "Milo frightened beside food", "kitchen table"),
      page("“Do you live like this every day?” asked Milo. Tilly shrugged and said, “You get used to running.”", "Milo and Tilly whispering behind cup", "kitchen shelf"),
      page("The next morning, Milo walked back to his cottage. His seeds looked plain, but the garden was peaceful.", "Milo returning to country home", "country path"),
      page("Milo ate supper under the stars and felt safe. He liked visiting Tilly, but the quiet country was home.", "Milo eating happily under stars", "cottage step at evening")
    ]
  },
  {
    id: "gs-d-05",
    title: "The Little Red Hen Shares a Plan",
    ...levelD,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Little Red Hen",
    sourceCollection: "Traditional folk tale",
    targetVocabulary: ["hen", "wheat", "bread", "help", "bake", "share"],
    comprehensionFocus: "Readers trace work steps from wheat to bread.",
    moral: "Sharing work makes sharing rewards fair.",
    primarySetting: "small farm kitchen and wheat patch",
    characterBible: [
      { name: "Ruby the hen", consistency: "red hen with a yellow scarf and kind eyes" },
      { name: "Ben the duck", consistency: "white duck with a blue cap" },
      { name: "Moss the cat", consistency: "gray cat with a green bow" }
    ],
    pages: [
      page("Ruby the hen found wheat seeds near the fence. “Who will help me plant these?” she asked.", "Ruby holding wheat seeds near fence", "farmyard"),
      page("Ben the duck wanted to splash in the pond. Moss the cat wanted to nap in the sun.", "Ben by pond and Moss napping", "farmyard"),
      page("Ruby planted the seeds herself and watered them each morning. Soon green shoots came up from the soil.", "Ruby watering wheat shoots", "wheat patch"),
      page("When the wheat grew tall, Ruby asked for help again. Ben and Moss were busy with their own fun.", "Ruby beside tall wheat asking friends", "wheat patch"),
      page("Ruby cut the wheat and carried it to the mill. The sack was heavy, but she kept going.", "Ruby carrying wheat sack", "path to mill"),
      page("At the mill, the wheat became flour. Ruby thanked the miller and carried the flour home.", "Ruby receiving flour at mill", "small mill"),
      page("Ruby mixed flour, water, and yeast in a bowl. The kitchen filled with the warm smell of rising bread.", "Ruby mixing dough in kitchen", "farm kitchen"),
      page("Ben and Moss came to the window when the bread baked. “May we have some?” they asked softly.", "Ben and Moss at kitchen window", "farm kitchen"),
      page("Ruby looked at the bread, then at her friends. “Next time, we can work together from the start,” she said.", "Ruby speaking kindly with bread on table", "kitchen table"),
      page("The next week, all three friends planted seeds. When the bread was ready, everyone shared it with happy hearts.", "Ruby, Ben, and Moss sharing bread", "farmyard picnic")
    ]
  },
  {
    id: "gs-e-01",
    title: "The Three Small Houses",
    ...levelE,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Three Little Pigs",
    sourceCollection: "English Fairy Tales / traditional",
    targetVocabulary: ["straw", "sticks", "bricks", "safe", "build", "patient"],
    comprehensionFocus: "Readers compare planning choices and outcomes.",
    moral: "Careful work takes longer, but it can keep us safe.",
    primarySetting: "green meadow with three small houses",
    characterBible: [
      { name: "Pip Pig", consistency: "pink pig with a yellow vest" },
      { name: "Poppy Pig", consistency: "pink pig with a blue dress" },
      { name: "Pax Pig", consistency: "pink pig with green overalls and round glasses" },
      { name: "Willa Wolf", consistency: "gray wolf with a red scarf, expressive but not scary" }
    ],
    pages: [
      page("Three small pigs set out to build homes near the meadow. Pip wanted a house quickly, Poppy wanted one by sunset, and Pax wanted one that would last.", "three pigs arriving in meadow with tools", "meadow"),
      page("Pip stacked straw into a bright little house. It looked cheerful, but the walls rustled whenever the wind passed by.", "Pip building straw house", "meadow edge"),
      page("Poppy tied sticks together for her house. It was stronger than straw, but she could still see daylight through the walls.", "Poppy building stick house", "near trees"),
      page("Pax carried bricks one at a time. His work was slow, and the others finished long before he placed the last brick.", "Pax building brick house slowly", "meadow"),
      page("That evening, Willa Wolf came down the path sneezing from meadow dust. She leaned near Pip’s straw house and blew without meaning to.", "Willa sneezing near straw house", "path by straw house"),
      page("The straw walls scattered across the grass. Pip ran to Poppy’s house, and Willa called, “I am sorry, but this wind is strong!”", "straw scattering while Pip runs", "meadow"),
      page("Another sneeze shook the stick house. The sticks tumbled down, so Pip and Poppy hurried to Pax’s brick door.", "stick house tumbling gently", "near trees"),
      page("Inside the brick house, the pigs were safe and dry. Pax shared soup while the wind moved around the strong walls.", "three pigs cozy inside brick house", "brick house interior"),
      page("Willa knocked politely and asked for a place out of the dust. The pigs let her sit by the door, where she could sneeze into a cloth.", "Willa sitting politely near door", "brick house doorway"),
      page("The next morning, everyone helped rebuild. Pip used straw for a garden roof, Poppy used sticks for a fence, and Pax showed them how bricks make a safe home.", "friends rebuilding together", "sunny meadow")
    ]
  },
  {
    id: "gs-e-02",
    title: "Golda and the Three Bowls",
    ...levelE,
    sourceType: "public_domain_adaptation",
    sourceTitle: "Goldilocks and the Three Bears",
    sourceCollection: "English Fairy Tales / traditional",
    targetVocabulary: ["cottage", "porridge", "chair", "blanket", "belong", "apologize"],
    comprehensionFocus: "Readers infer how a character learns respect.",
    moral: "Other people’s things should be treated with care.",
    primarySetting: "cozy forest cottage",
    characterBible: [
      { name: "Golda", consistency: "child with light brown skin, curly golden-brown hair, teal coat, and red boots" },
      { name: "Bear family", consistency: "three gentle brown bears wearing simple cream aprons" }
    ],
    pages: [
      page("Golda walked through the forest with a basket of berries. When rain began to fall, she saw a small cottage with smoke curling from the chimney.", "Golda approaching cottage in light rain", "forest path"),
      page("She knocked once, but no one answered. The door was not locked, and Golda stepped inside to get dry.", "Golda entering cottage cautiously", "cottage doorway"),
      page("Three bowls of porridge sat on the table. Golda was hungry, but she knew the bowls belonged to someone else.", "Golda looking at three porridge bowls", "cottage kitchen"),
      page("She tasted the smallest spoonful from the smallest bowl. The porridge was just right, and then Golda felt worse because she had taken it.", "Golda tasting porridge with guilty expression", "kitchen table"),
      page("In the sitting room, three chairs waited by the fire. Golda sat in the little chair, and one wooden leg cracked.", "Golda sitting in small chair as it cracks", "sitting room"),
      page("Golda tried to fix the chair, but she did not know how. She grew tired and climbed the stairs to look for a quiet place.", "Golda holding cracked chair leg worriedly", "stairway"),
      page("Three beds stood under warm quilts. Golda curled up on the smallest bed and soon fell asleep.", "Golda sleeping in small bed", "bedroom"),
      page("The bear family came home from their walk. They saw the porridge, the chair, and the muddy red boot prints.", "bear family noticing clues", "cottage kitchen"),
      page("Golda woke and saw the bears standing nearby. “I am sorry,” she said. “I came in without asking and did not care for your things.”", "Golda apologizing to gentle bears", "bedroom"),
      page("The bears accepted her apology and helped her mend the chair. Golda walked home with a lesson she would remember longer than the rain.", "Golda helping bears mend chair", "cottage sitting room")
    ]
  },
  {
    id: "gs-e-03",
    title: "The Gingerbread Runner",
    ...levelE,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Gingerbread Man",
    sourceCollection: "Traditional tale",
    targetVocabulary: ["gingerbread", "runner", "river", "trust", "clever", "choice"],
    comprehensionFocus: "Readers notice repeated language and predict risk.",
    moral: "Being fast is useful, but being careful is wise.",
    primarySetting: "bakery, farm lane, and riverbank",
    characterBible: [
      { name: "Ginger", consistency: "gingerbread cookie with white icing buttons and a blue icing smile" },
      { name: "Nora the baker", consistency: "older woman with brown skin, gray bun, and a flour-dusted blue apron" },
      { name: "Finn Fox", consistency: "red fox with a cream chest and green neckerchief" }
    ],
    pages: [
      page("Nora the baker made a gingerbread cookie for the village fair. When she opened the oven, the cookie hopped down and bowed.", "Ginger hopping from bakery tray", "warm bakery"),
      page("“I am Ginger, and I can run!” cried the cookie. Before Nora could answer, Ginger zipped out the bakery door.", "Ginger running out bakery door", "village street"),
      page("Ginger ran past hens, goats, and children carrying ribbons. Everyone laughed and called, “Come back for the fair!”", "Ginger running past fair preparations", "village lane"),
      page("The cookie ran faster and faster. He liked the cheers so much that he stopped listening to the road.", "Ginger smiling while running", "farm lane"),
      page("At the riverbank, Ginger skidded to a stop. The bridge was gone because workers were fixing it downstream.", "Ginger stopping at riverbank", "riverbank"),
      page("Finn Fox stepped from the reeds and smiled. “I can carry you across,” he said. “Hop onto my back.”", "Finn Fox offering help at river", "river reeds"),
      page("Ginger looked at the water and then at Finn’s sharp teeth. He remembered Nora saying that quick feet still need a careful mind.", "Ginger thinking before choosing", "riverbank"),
      page("“Thank you,” said Ginger, “but I will wait for the bridge.” Finn flicked his tail and slipped away into the reeds.", "Ginger politely refusing Finn", "riverbank"),
      page("Nora and the children reached the river with a basket. They cheered because Ginger had made a wise choice.", "Nora and children arriving with basket", "river path"),
      page("At the fair, Ginger sat on a high plate and told his story. He was still quick, but now he listened before he ran.", "Ginger at village fair telling story", "fair table")
    ]
  },
  {
    id: "gs-e-04",
    title: "The Helpful Shoemaker Elves",
    ...levelE,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Elves and the Shoemaker",
    sourceCollection: "Grimm fairy tales",
    targetVocabulary: ["shoemaker", "leather", "stitch", "secret", "thankful", "gift"],
    comprehensionFocus: "Readers identify gratitude and evidence of kindness.",
    moral: "Quiet help and thankful hearts can change a home.",
    primarySetting: "small shoe shop at night",
    characterBible: [
      { name: "Mr. Leno", consistency: "elderly shoemaker with brown skin, silver beard, round glasses, and a burgundy vest" },
      { name: "Mira", consistency: "elderly woman with warm tan skin, gray braid, and blue shawl" },
      { name: "Two helpful elves", consistency: "small cheerful elves with green caps, brown tunics, and tiny sewing kits" }
    ],
    pages: [
      page("Mr. Leno had leather for one last pair of shoes. He cut the pieces carefully, then left them on the workbench for morning.", "Mr. Leno cutting leather pieces", "shoe shop"),
      page("That night, two tiny elves climbed through the open window. They stitched, tapped, and tied until moonlight faded.", "elves making shoes at night", "moonlit shop"),
      page("In the morning, Mr. Leno found a perfect pair of shoes. Mira touched the neat stitches and wondered who had helped.", "Mr. Leno and Mira finding shoes", "shoe shop morning"),
      page("A traveler bought the shoes and paid enough for more leather. Mr. Leno cut two pairs before bedtime.", "traveler buying shoes", "shoe shop"),
      page("Again, the elves came at night. Their little hammers clicked softly while the town slept.", "elves working on two pairs", "night shop"),
      page("Mira whispered, “Someone kind is helping us.” She and Mr. Leno decided to watch from behind the curtain.", "Mira and Mr. Leno peeking behind curtain", "shop at night"),
      page("They saw the elves sewing with bare feet on the cold floor. The tiny helpers looked happy, but they shivered.", "elves sewing while shivering", "cold workshop"),
      page("The next day, Mira made warm coats and tiny boots. Mr. Leno polished two little tool belts as gifts.", "Mira sewing tiny coats", "kitchen table"),
      page("That night, the elves found the gifts on the bench. They danced in their boots and bowed toward the quiet house.", "elves dancing with new clothes", "shoe shop"),
      page("The elves did not return, but the shop stayed busy. Mr. Leno and Mira kept helping others whenever they could.", "happy shop serving townspeople", "shoe shop day")
    ]
  },
  {
    id: "gs-e-05",
    title: "The Bremen Music Plan",
    ...levelE,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Bremen Town Musicians",
    sourceCollection: "Grimm fairy tales",
    targetVocabulary: ["musician", "journey", "window", "together", "brave", "home"],
    comprehensionFocus: "Readers explain how teamwork changes the outcome.",
    moral: "Friends can make a new home together.",
    primarySetting: "country road and empty cottage near Bremen",
    characterBible: [
      { name: "Della Donkey", consistency: "gray donkey with a red blanket" },
      { name: "Bram Dog", consistency: "brown dog with a blue collar" },
      { name: "Cleo Cat", consistency: "orange cat with green eyes" },
      { name: "Rooster Ray", consistency: "red rooster with golden tail feathers" }
    ],
    pages: [
      page("Della Donkey wanted to become a musician in Bremen. She packed a small blanket and started down the country road.", "Della walking with blanket bundle", "country road"),
      page("Bram Dog limped beside a gate, too tired to guard sheep anymore. Della invited him to sing bass in her band.", "Della meeting Bram by gate", "farm gate"),
      page("Cleo Cat sat on a stone wall with nowhere to go. Bram said her soft purr could be the band’s gentle drum.", "friends meeting Cleo on wall", "stone wall"),
      page("Rooster Ray called from a fence post. He wanted a new morning job, so the friends welcomed his bright voice.", "Rooster Ray joining friends", "fence post"),
      page("The road grew dark before they reached Bremen. In the forest, they saw light shining from a cottage window.", "four animals seeing cottage light", "forest road"),
      page("The friends peeked through the window and saw a messy table. No family was inside, but the cottage looked forgotten.", "animals peeking into empty cottage", "cottage window"),
      page("Della had a plan. The friends stacked themselves tall and made the loudest music they had ever made.", "animals stacked making music", "outside cottage"),
      page("The sound echoed through the trees. Owls blinked, leaves shook, and the friends burst into laughter.", "animals laughing after music", "forest cottage"),
      page("Inside, the cottage was warm and empty. The friends cleaned the table and shared a simple supper.", "animals cleaning and eating together", "cottage interior"),
      page("They never did reach Bremen that night. They had found music, friendship, and a home right where they were.", "animals playing music in cozy cottage", "cottage interior")
    ]
  },
  {
    id: "gs-f-01",
    title: "The Small Duck Who Kept Going",
    ...levelF,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Ugly Duckling",
    sourceCollection: "Hans Christian Andersen fairy tales",
    targetVocabulary: ["duckling", "different", "pond", "season", "reflection", "belong"],
    comprehensionFocus: "Readers infer feelings from actions and setting changes.",
    moral: "Growing takes time, and belonging may come in an unexpected place.",
    primarySetting: "pond through changing seasons",
    characterBible: [
      { name: "Ori", consistency: "gray young swan with soft feathers, dark beak, and gentle eyes" },
      { name: "Mother Duck", consistency: "brown duck with a cream chest and blue ribbon on one wing" },
      { name: "Swan family", consistency: "white swans with long necks and calm faces" }
    ],
    pages: [
      page("At the edge of the pond, Mother Duck watched her eggs crack open. One hatchling, Ori, was larger and grayer than the rest, and the ducklings stared.", "Ori hatching beside smaller ducklings", "spring pond nest"),
      page("Ori tried to paddle with the ducklings, but his feet splashed too wide. When the others laughed, he dipped his head and followed quietly.", "Ori splashing awkwardly with ducklings", "pond"),
      page("Days passed, and Ori grew faster than the others. He wished he could shrink into the reeds whenever visitors called him strange.", "Ori hiding near reeds", "pond reeds"),
      page("One windy morning, Ori left the pond to find a place where no one laughed. The path felt lonely, but the sky was wide above him.", "Ori walking away along path", "windy pond path"),
      page("He slept near a marsh and listened to night insects. Even alone, Ori noticed stars shining on the water like small lanterns.", "Ori resting by marsh under stars", "marsh night"),
      page("Autumn painted the trees gold, and Ori’s gray feathers began to change. He did not understand the white feathers growing along his wings.", "Ori noticing white feathers", "autumn pond edge"),
      page("Winter came cold and quiet. Ori found shelter near a barn, where a kind child left grain by the fence.", "Ori sheltering near barn in winter", "snowy barn"),
      page("When spring returned, Ori followed a stream back toward open water. His neck felt longer, and his wings felt strong.", "Ori following stream in spring", "spring stream"),
      page("On the pond, three white swans glided toward him. Ori lowered his head, afraid they would laugh too.", "white swans approaching Ori", "bright pond"),
      page("The swans bowed in welcome, and Ori saw his reflection between them. He was not a duck at all; he had grown into a swan.", "Ori seeing swan reflection", "pond water"),
      page("Mother Duck watched from the reeds and smiled softly. Ori still remembered hard days, but now he understood that different did not mean wrong.", "Mother Duck watching Ori with swans", "pond reeds"),
      page("Ori spread his wings and moved across the shining pond. He had found the place where his wide feet, long neck, and quiet heart belonged.", "Ori swimming proudly with swans", "sunlit pond")
    ]
  },
  {
    id: "gs-f-02",
    title: "Jack and the Tall Bean Vine",
    ...levelF,
    sourceType: "public_domain_adaptation",
    sourceTitle: "Jack and the Beanstalk",
    sourceCollection: "English Fairy Tales / traditional",
    targetVocabulary: ["market", "beans", "vine", "cloud", "careful", "promise"],
    comprehensionFocus: "Readers evaluate choices and consequences.",
    moral: "Courage needs honesty and careful choices.",
    primarySetting: "small farm, cloud garden, and tall bean vine",
    characterBible: [
      { name: "Jack", consistency: "child with tan skin, straight black hair, patched green jacket, and brown boots" },
      { name: "Mama", consistency: "woman with tan skin, black braid, blue work dress, and kind tired eyes" },
      { name: "Cloud Keeper", consistency: "very tall gentle figure with silver hair, violet robe, and cloud-patterned belt" }
    ],
    pages: [
      page("Jack and Mama lived on a small farm with one tired cow. When the cupboard grew almost empty, Mama asked Jack to take the cow to market.", "Jack and Mama beside cow at small farm", "small farm"),
      page("On the road, a traveler offered Jack five shining beans. Jack knew Mama wanted coins, but the beans seemed to hum with a strange promise.", "traveler offering glowing beans to Jack", "market road"),
      page("Mama was upset when Jack returned without coins. She tossed the beans outside, and Jack went to bed wishing he had made a wiser choice.", "Mama upset as beans are tossed outside", "farm kitchen"),
      page("By morning, a green vine climbed past the roof and into the clouds. Jack touched the leaves and decided to see where his mistake had led.", "huge bean vine beside cottage", "farmyard morning"),
      page("He climbed carefully until the farm looked tiny below. Above the clouds, he found a garden with silver paths and quiet doors.", "Jack climbing vine into cloud garden", "cloud garden"),
      page("A tall Cloud Keeper opened one door and frowned. “Small visitor, why are you here?” he asked in a voice like distant thunder.", "Cloud Keeper greeting Jack", "cloud doorway"),
      page("Jack told the truth about the cow, the beans, and Mama’s empty cupboard. The Cloud Keeper listened without interrupting.", "Jack explaining honestly", "cloud hall"),
      page("The Cloud Keeper gave Jack a small golden harp seed. “Plant this only if you promise to use its music to help your home,” he said.", "Cloud Keeper giving harp-shaped seed", "cloud garden"),
      page("Jack climbed down before sunset and told Mama everything. Together they planted the seed beside the kitchen door.", "Jack and Mama planting seed", "farmyard"),
      page("The seed grew into a small harp vine that sang when watered. Its songs brought neighbors to trade bread, cloth, and tools.", "neighbors listening to harp vine", "farmyard"),
      page("Jack worked hard to care for the vine and the cow. He learned that wonder is better when it comes with honesty.", "Jack caring for cow and vine", "small farm"),
      page("When the tall bean vine faded, Jack did not feel sad. The lesson stayed, and so did the music that helped the farm begin again.", "Jack and Mama smiling beside harp vine", "sunset farm")
    ]
  },
  {
    id: "gs-f-03",
    title: "The Quiet Pea",
    ...levelF,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Princess and the Pea",
    sourceCollection: "Hans Christian Andersen fairy tales",
    targetVocabulary: ["storm", "guest", "mattress", "notice", "truth", "comfort"],
    comprehensionFocus: "Readers infer character traits from small details.",
    moral: "Small discomforts can reveal a careful and honest heart.",
    primarySetting: "castle guest room during a rainstorm",
    characterBible: [
      { name: "Princess Lina", consistency: "young traveler with deep brown skin, short black curls, purple rain cloak, and silver boots" },
      { name: "Queen Maren", consistency: "older queen with fair skin, white braid, green gown, and pearl pin" },
      { name: "Prince Theo", consistency: "young prince with light brown skin, wavy dark hair, and blue jacket" }
    ],
    pages: [
      page("Rain hammered the castle windows late at night. When the gate bell rang, Prince Theo found Lina standing outside with water dripping from her cloak.", "Theo opening gate for rain-soaked Lina", "castle gate at night"),
      page("Lina bowed and asked for shelter. She said she was a princess traveling home, but her carriage had broken near the forest road.", "Lina speaking politely at castle door", "castle entry"),
      page("Queen Maren welcomed Lina inside and gave her warm soup. The queen noticed Lina thanked every servant by name.", "Lina thanking servants over soup", "castle dining room"),
      page("The queen wondered whether Lina noticed small things because she cared, not because she complained. She placed one dry pea under many soft mattresses.", "Queen Maren placing pea under mattresses", "guest room"),
      page("Lina climbed into the tall bed and tried to sleep. The room was warm, but something tiny pressed against her back all night.", "Lina trying to sleep in tall bed", "guest room"),
      page("In the morning, Lina looked tired but did not grumble. She only asked whether she might help smooth the bed because it had felt uneven.", "Lina politely speaking in morning", "guest room"),
      page("Queen Maren lifted the mattresses and found the pea still in place. Prince Theo looked surprised that Lina had noticed it.", "Queen showing pea to Theo and Lina", "guest room"),
      page("Lina laughed softly. “It was small,” she said, “but small things can keep a person awake.”", "Lina smiling about the pea", "castle bedroom"),
      page("The queen smiled because Lina had told the truth kindly. She saw a guest who noticed details and still treated others with care.", "Queen Maren smiling warmly", "castle hall"),
      page("When Lina’s carriage was repaired, the castle family sent food for her journey. Theo tucked the pea into a tiny box as a funny memory.", "Theo giving small box to Lina", "castle courtyard"),
      page("Lina visited again in spring, this time under clear skies. Everyone remembered the storm, the tall bed, and the quiet little pea.", "Lina returning in spring", "castle garden"),
      page("The pea stayed in the castle study as a reminder. Even the smallest thing can tell a true story when someone is honest enough to notice.", "pea in tiny display box", "castle study")
    ]
  },
  {
    id: "gs-f-04",
    title: "Hare and Hedgehog at the Field",
    ...levelF,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Hare and the Hedgehog",
    sourceCollection: "Grimm fairy tales",
    targetVocabulary: ["hedgehog", "field", "race", "clever", "proud", "respect"],
    comprehensionFocus: "Readers compare cleverness, pride, and fairness.",
    moral: "Pride can make a person careless; respect should come before winning.",
    primarySetting: "long field with two furrows",
    characterBible: [
      { name: "Hattie Hedgehog", consistency: "small hedgehog with brown spines, round glasses, and a yellow vest" },
      { name: "Henri Hedgehog", consistency: "small hedgehog with brown spines, blue cap, and green scarf" },
      { name: "Hugo Hare", consistency: "tall tan hare with red running scarf and proud posture" }
    ],
    pages: [
      page("Hugo Hare bounded along the field and laughed at Hattie Hedgehog’s short legs. Hattie did not like being mocked in her own garden.", "Hugo laughing while Hattie stands in field", "field furrow"),
      page("“Short legs can still finish a race,” said Hattie. Hugo laughed louder and challenged her to run the long furrow.", "Hattie calmly challenging Hugo", "field"),
      page("Hattie asked for a moment to get ready. She hurried to Henri, who looked almost exactly like her from far away.", "Hattie speaking with Henri", "edge of field"),
      page("They made a quiet plan. Hattie would start at one end, and Henri would wait at the other end of the furrow.", "hedgehogs planning together", "field edge"),
      page("Hugo lined up beside Hattie and shouted, “Go!” He flew down the field while Hattie took only a few steps.", "Hugo racing away from Hattie", "long furrow"),
      page("At the far end, Henri popped up and called, “I am already here!” Hugo skidded in surprise.", "Henri appearing at finish", "far end of field"),
      page("Hugo demanded another race back. Hattie waited at the first end and called, “I am already here!”", "Hattie waiting at starting end", "field start"),
      page("Again and again, Hugo ran while the hedgehogs traded places. His proud smile faded into tired confusion.", "Hugo running back and forth tired", "field"),
      page("At last, Hattie raised one paw. “Enough,” she said. “We did not race to hurt you. We raced so you would listen.”", "Hattie stopping race respectfully", "field"),
      page("Hugo sat in the grass and caught his breath. He understood that laughing at someone can make your own ears close.", "Hugo listening to Hattie", "field grass"),
      page("The next day, Hugo passed the hedgehog garden quietly. “Good morning,” he said, and this time he meant it.", "Hugo greeting hedgehogs kindly", "garden path"),
      page("Hattie smiled from the cabbages. A race had not made her taller, but it had helped Hugo grow wiser.", "Hattie smiling in garden", "vegetable garden")
    ]
  },
  {
    id: "gs-f-05",
    title: "The Honest Ax",
    ...levelF,
    sourceType: "public_domain_adaptation",
    sourceTitle: "The Honest Woodcutter",
    sourceCollection: "Aesop-style traditional fable",
    targetVocabulary: ["woodcutter", "silver", "golden", "honest", "river", "reward"],
    comprehensionFocus: "Readers identify honesty through repeated choices.",
    moral: "Truth is worth more than a prize.",
    primarySetting: "quiet forest river",
    characterBible: [
      { name: "Niko", consistency: "young woodcutter with olive skin, curly dark hair, brown vest, and simple boots" },
      { name: "River Guardian", consistency: "gentle glowing figure made of blue water and silver light" }
    ],
    pages: [
      page("Niko worked beside the forest river, cutting fallen branches for firewood. His iron ax was old, but it was the only tool he owned.", "Niko cutting fallen branches by river", "forest river"),
      page("As Niko reached for a branch, the ax slipped from his hand. It splashed into the deep water and vanished.", "Niko dropping ax into river", "riverbank"),
      page("Niko sat on a stone with his head in his hands. Without the ax, he could not finish his work or help his family.", "Niko upset on stone by river", "riverbank"),
      page("The river shimmered, and a guardian rose from the water. In one hand, the guardian held a golden ax.", "River Guardian holding golden ax", "glowing river"),
      page("“Is this your ax?” asked the guardian. Niko looked at the bright tool and shook his head.", "Niko refusing golden ax", "river"),
      page("The guardian dipped below and returned with a silver ax. Niko’s eyes widened, but he said, “That one is not mine either.”", "guardian offering silver ax", "riverbank"),
      page("At last, the guardian brought up Niko’s old iron ax. Niko smiled with relief and reached for the worn wooden handle.", "guardian returning iron ax", "riverbank"),
      page("“You told the truth when a lie would have been easy,” said the guardian. The river shone like morning glass.", "guardian praising Niko", "river"),
      page("The guardian gave Niko the iron ax and a small silver wedge for his work. Niko accepted it with a careful thank-you.", "Niko receiving ax and small wedge", "riverbank"),
      page("Back in the village, Niko told the story exactly as it happened. He did not make himself sound braver than he had been.", "Niko telling villagers story", "village edge"),
      page("Some people asked why he had not taken the golden ax. Niko smiled and said, “A false prize would not feel like mine.”", "Niko explaining honesty to neighbors", "village"),
      page("From then on, Niko kept the iron ax clean and sharp. Every time it flashed in the sun, he remembered that truth had brought it home.", "Niko working with iron ax in sunlight", "forest river")
    ]
  }
];

const additionalOriginals = [
  {
    id: "gs-c-06",
    title: "The Bell in the Tree",
    ...levelC,
    sourceType: "original",
    sourceTitle: "Original LiteracyPath fable",
    sourceCollection: "LiteracyPath original guided stories",
    targetVocabulary: ["bell", "tree", "wind", "listen", "lost", "home"],
    comprehensionFocus: "Readers track clues that help a character solve a problem.",
    moral: "Listening carefully can help us find the way.",
    primarySetting: "school garden with a bell hanging in a tree",
    characterBible: [
      {
        name: "Mina",
        consistency: "young child with warm brown skin, straight black bob haircut, brown eyes, red sweater, denim pants, and yellow rain boots",
        ageSpecies: "young child",
        skinFurColor: "warm brown skin",
        hairStyleColor: "straight black bob haircut, same length every page",
        eyeColor: "brown eyes",
        clothing: "red sweater, denim pants, yellow rain boots",
        accessories: "no accessories",
        personality: "careful, caring, curious, learns from a small mistake",
        speakingStyle: "gentle and clear",
        heightBuild: "small child with consistent K-2 age proportions",
        settingRelationship: "cares for the school garden and the bell tree"
      },
      {
        name: "Taro",
        consistency: "small white dog with one brown ear, black nose, round dark eyes, and a blue collar",
        ageSpecies: "small dog",
        skinFurColor: "white fur with one brown ear",
        hairStyleColor: "short smooth dog fur",
        eyeColor: "round dark eyes",
        clothing: "no clothing",
        accessories: "blue collar, always the same",
        personality: "playful, easily distracted, happy to return",
        speakingStyle: "dog body language, no spoken dialogue",
        heightBuild: "small compact dog, always below Mina's knees",
        settingRelationship: "plays in and around Mina's school garden"
      }
    ],
    pages: [
      page("Mina hung a little bell in the garden tree. Taro the dog watched the bell shine in the morning sun.", "Mina hanging bell while Taro watches", "school garden"),
      page("After lunch, Taro chased a leaf through the gate. The wind pushed the leaf down a quiet path.", "Taro chasing leaf out gate", "garden gate"),
      page("Mina called for Taro, but the dog did not come. She stood still and listened to the windy garden.", "Mina listening near gate", "garden"),
      page("Far away, she heard a tiny ring. The bell in the tree was moving in the wind.", "bell ringing in tree", "school garden"),
      page("Taro heard the bell too and lifted his ears. The sound told him which way led back.", "Taro hearing bell on path", "quiet path"),
      page("Mina rang the bell again and again. Taro ran toward the sound with muddy paws.", "Mina ringing bell as Taro returns", "garden gate"),
      page("Taro jumped into Mina’s arms. Mina laughed because the bell had become a helper.", "Mina hugging Taro", "garden"),
      page("The next day, Mina made a small rule for herself. She would close the gate before play.", "Mina closing the garden gate carefully with no visible text or sign", "garden gate"),
      page("Taro sat under the tree and listened. The bell was quiet now, but he knew its sound.", "Taro sitting under bell tree", "tree"),
      page("When the wind rang the bell, Mina smiled. It reminded her that careful listening can bring a friend home.", "Mina and Taro smiling under tree", "school garden")
    ]
  },
  {
    id: "gs-d-06",
    title: "Mina and the Broken Bridge",
    ...levelD,
    sourceType: "original",
    sourceTitle: "Original LiteracyPath fable",
    sourceCollection: "LiteracyPath original guided stories",
    targetVocabulary: ["bridge", "stream", "repair", "plank", "team", "safe"],
    comprehensionFocus: "Readers sequence a collaborative problem and solution.",
    moral: "A careful team can make a safe path for everyone.",
    primarySetting: "small village stream with a wooden footbridge",
    characterBible: [
      { name: "Mina", consistency: "child with black hair in two braids, lavender jacket, and green boots" },
      { name: "Oren", consistency: "child with light brown skin, curly brown hair, orange vest, and blue pants" },
      { name: "Grandma Sela", consistency: "elderly woman with silver hair, dark skin, and a teal shawl" }
    ],
    pages: [
      page("Mina and Oren carried lunch to Grandma Sela across the stream. Halfway there, they saw that one bridge plank had cracked.", "children discovering cracked bridge plank", "village stream"),
      page("Oren wanted to jump over the crack, but Mina held up her hand. The stream was shallow, yet the bridge was not safe.", "Mina stopping Oren from crossing", "bridge"),
      page("They called to Grandma Sela from the bank. She waved and told them to think before they stepped.", "Grandma Sela across stream advising children", "stream bank"),
      page("Mina found a long stick and measured the broken plank. Oren drew the shape in the mud so they would remember.", "children measuring plank with stick", "stream bank"),
      page("At the shed, they found a smooth board and a small box of nails. The board was heavy, so they carried it together.", "children carrying board together", "tool shed"),
      page("Grandma Sela met them at the bridge with a hammer. She showed them how to place the board flat and straight.", "Grandma guiding board placement", "bridge"),
      page("Mina held the board steady while Oren handed nails. Grandma tapped each nail until the board did not wobble.", "team repairing bridge", "wooden bridge"),
      page("They tested the bridge with one foot, then two. It stayed firm, and the stream flowed quietly below.", "Mina testing repaired bridge", "bridge"),
      page("At last, they crossed with the lunch basket. Grandma Sela thanked them for bringing food and making the path safe.", "children crossing to Grandma with lunch", "stream"),
      page("That afternoon, neighbors used the bridge again. Mina and Oren felt proud because their careful work helped more than one person.", "neighbors crossing repaired bridge", "village stream")
    ]
  },
  {
    id: "gs-e-06",
    title: "The Lantern Path",
    ...levelE,
    sourceType: "original",
    sourceTitle: "Original LiteracyPath fable",
    sourceCollection: "LiteracyPath original guided stories",
    targetVocabulary: ["lantern", "path", "storm", "guide", "neighbor", "brave"],
    comprehensionFocus: "Readers infer courage from quiet helpful actions.",
    moral: "A small light can help many people when it is shared.",
    primarySetting: "hill village during a stormy evening",
    characterBible: [
      { name: "Ila", consistency: "child with warm brown skin, short curly hair, mustard coat, and round lantern" },
      { name: "Mr. Vale", consistency: "older neighbor with pale skin, gray beard, navy coat, and wooden cane" }
    ],
    pages: [
      page("Rain fell hard on the hill village, and the path grew dark before supper. Ila lit the round lantern that hung by her door.", "Ila lighting lantern at doorway", "rainy village hill"),
      page("Across the lane, Mr. Vale stepped outside with his cane. He needed to reach the lower house, but the stones were slick.", "Mr. Vale looking at wet path", "village lane"),
      page("Ila felt nervous about the wind, yet she lifted the lantern high. “I can walk beside you,” she called.", "Ila offering lantern help", "rainy lane"),
      page("They moved one stone at a time. The lantern made a warm circle on the path, and Mr. Vale found each step.", "Ila guiding Mr. Vale", "stone path"),
      page("At the bend, another neighbor opened a door. She saw the light and joined them with a covered basket.", "neighbor joining lantern path", "village bend"),
      page("Soon three more lanterns appeared along the hill. The dark path turned into a chain of soft golden lights.", "several lanterns glowing on hill path", "hill village"),
      page("The wind pushed at Ila’s coat, but she kept her lantern steady. She was still afraid, but she was also helping.", "Ila holding lantern steady in wind", "stormy path"),
      page("When they reached the lower house, warm voices welcomed everyone inside. Mr. Vale thanked Ila for starting the path.", "neighbors entering warm lower house", "doorway"),
      page("Ila looked back up the hill and saw lights still moving carefully. Her one lantern had helped other lights find the way.", "Ila seeing lanterns up hill", "village hill"),
      page("After the storm, the village hung lantern hooks along the path. Ila knew courage could be quiet, bright, and shared.", "villagers adding lantern hooks", "sunny village path")
    ]
  },
  {
    id: "gs-f-06",
    title: "The Fox and the Rain Jar",
    ...levelF,
    sourceType: "original",
    sourceTitle: "Original LiteracyPath fable",
    sourceCollection: "LiteracyPath original guided stories",
    targetVocabulary: ["rain", "jar", "promise", "garden", "patient", "generous"],
    comprehensionFocus: "Readers explain how a character changes across the story.",
    moral: "A promise grows stronger when it helps more than one person.",
    primarySetting: "dry woodland garden waiting for rain",
    characterBible: [
      { name: "Rafi Fox", consistency: "red fox with white paws, amber eyes, and a blue seed pouch" },
      { name: "Momo Mole", consistency: "small brown mole with round glasses and a green digging apron" },
      { name: "Lark", consistency: "small tan bird with a yellow chest and bright black eyes" }
    ],
    pages: [
      page("Rafi Fox kept a clay jar under the old cedar tree. He said the jar would catch the first rain and save his own garden.", "Rafi placing clay jar under cedar", "dry woodland garden"),
      page("Momo Mole asked whether the jar could help the shared vegetable patch too. Rafi shook his head because he wanted tall flowers by his den.", "Momo asking Rafi about shared patch", "dry garden"),
      page("Days passed without rain, and every leaf curled at the edges. Rafi checked the empty jar each morning and frowned at the bright sky.", "Rafi checking empty jar", "cedar tree"),
      page("Lark flew down with news from the hill. “Rain is coming tonight,” she sang, “but the wind will be strong.”", "Lark warning Rafi of storm", "woodland hill"),
      page("Rafi tied the jar to the cedar with a vine. He promised himself that not one drop would be wasted.", "Rafi tying jar securely", "cedar tree"),
      page("The rain arrived with silver lines across the dark leaves. The jar filled quickly, and little streams ran toward the low vegetable patch.", "rain filling jar and streams forming", "rainy garden"),
      page("By morning, Rafi’s jar was full, but the shared patch was still dry under a fallen branch. Momo was digging alone beside wilted leaves.", "Momo digging near dry patch", "vegetable patch"),
      page("Rafi looked at his flower bed, then at Momo’s tired paws. His promise had been to save the rain, not to keep it only for himself.", "Rafi thinking between flowers and patch", "garden"),
      page("He carried the jar to the shared patch and poured water around each plant. Momo smiled as the soil turned dark and soft.", "Rafi watering shared patch", "vegetable patch"),
      page("The flowers by Rafi’s den did not grow as tall that week. Still, he felt proud when the vegetable leaves lifted toward the sun.", "shared vegetables perking up", "sunny patch"),
      page("When the next rain came, Rafi set out three jars. One was for his den, one for the patch, and one for any neighbor who needed it.", "Rafi placing three jars", "cedar tree"),
      page("Lark sang from the cedar while Momo patted the wet soil. Rafi had learned that saved rain feels best when it helps a whole garden grow.", "Rafi, Momo, and Lark near thriving garden", "woodland garden")
    ]
  }
];

const selectedPublicDomainDrafts = [
  ...draftDefinitions.slice(0, 4),
  ...draftDefinitions.slice(5, 9),
  ...draftDefinitions.slice(10, 14),
  ...draftDefinitions.slice(15, 19)
];

export const guidedStoryBooks = [...selectedPublicDomainDrafts, ...additionalOriginals].map(buildStoryBook);
