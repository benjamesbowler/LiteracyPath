/* eslint-disable no-unused-vars -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { dinoPalsV2StoryQuests } from "./generated/dinoPalsV2StoryQuests.generated.js";

const samPamMediaVersion = "sam-pam-picnic-rebuild-20260721";
const samPamImagePath = page => `/images/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.webp?v=${samPamMediaVersion}`;
const samPamAudioPath = page => `/audio/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.mp3?v=${samPamMediaVersion}`;
const samPamWordImagePath = word => `/images/story-quests/sam-pam/words/word-${word}.webp`;

const meadowPalsImagePath = (folder, pageId) => `/images/story-quests/meadow-pals/${folder}/${pageId}.webp`;
const meadowPalsAudioPath = (folder, pageId) => `/audio/story-quests/meadow-pals/${folder}/${pageId}.mp3`;
const dinoPalsImagePath = (folder, pageId) => `/images/story-quests/dino-pals/${folder}/${pageId}.webp`;
const dinoPalsAudioPath = (folder, pageId) => `/audio/story-quests/dino-pals/${folder}/${pageId}.mp3`;
const moonwoodImagePath = (folder, pageId) => `/images/story-quests/moonwood/${folder}/${pageId}.webp`;
const moonwoodAudioPath = (folder, pageId) => `/audio/story-quests/moonwood/${folder}/${pageId}.mp3`;

function meadowPalsPage(folder, id, text, choicePrompt, choices, skillTags = [], options = {}) {
  return {
    id,
    text,
    imageUrl: meadowPalsImagePath(folder, id),
    audioUrl: meadowPalsAudioPath(folder, id),
    choicePrompt,
    choices,
    skillTags,
    ...(["muddy-splashy-hat", "shy-cuddly-quiet"].includes(folder) ? { narrationNeedsRebuild: true } : {}),
    ...options
  };
}

function dinoPalsPage(folder, id, text, choicePrompt, choices, skillTags = [], options = {}) {
  return {
    id,
    text,
    imageUrl: dinoPalsImagePath(folder, id),
    audioUrl: dinoPalsAudioPath(folder, id),
    choicePrompt,
    choices,
    skillTags,
    ...options
  };
}

function moonwoodPage(folder, id, text, choicePrompt, choices, skillTags = [], options = {}) {
  return {
    id,
    text,
    imageUrl: moonwoodImagePath(folder, id),
    audioUrl: moonwoodAudioPath(folder, id),
    choicePrompt,
    choices,
    skillTags,
    ...options
  };
}

function storyQuestSkillTags(text = [], targetWords = []) {
  const normalizedText = text.join(" ").toLowerCase();
  return targetWords
    .map(word => String(word).toLowerCase())
    .filter(word => normalizedText.includes(word));
}

function moonwoodTargetPage(folder, id, text, choicePrompt, choices, targetWords = [], options = {}) {
  return moonwoodPage(folder, id, text, choicePrompt, choices, storyQuestSkillTags(text, targetWords), options);
}

function meadowPalsTargetPage(folder, id, text, choicePrompt, choices, targetWords = [], options = {}) {
  return meadowPalsPage(folder, id, text, choicePrompt, choices, storyQuestSkillTags(text, targetWords), options);
}

const muddySplashyFolder = "muddy-splashy-hat";
const shyCuddlyFolder = "shy-cuddly-quiet";
const bouncySpeedyFolder = "bouncy-speedy-map";
const braveTinyFolder = "brave-tiny-rescue";
const chompyLunchFolder = "chompy-lunch-hunt";
const sunnyRainyFolder = "sunny-rainy-rescue";
const bossyPicnicFolder = "bossy-picnic-mix-up";
const zippyFlappyFolder = "zippy-flappy-fast-slow";
const pipStoneFolder = "pip-stone-loud-thing";
const fernWrenFolder = "fern-wren-walking-garden";
const lunaBurrowStarShellDoorFolder = "luna-burrow-star-shell-door";
const dewdropFlintLostGlowFolder = "dewdrop-flint-lost-glow";
const lunaBurrowStarShellDoorTargetWords = ["Luna", "Burrow", "star", "shell", "door", "map", "moon", "listen", "choose", "path", "hidden", "brave", "open", "glow", "home"];
const dewdropFlintLostGlowTargetWords = ["Dewdrop", "Flint", "glow", "stream", "crystal", "dark", "bright", "float", "listen", "lantern", "whisper", "cave", "help", "shine", "again"];

export const dinoPalsStoryQuestMetadata = [
  {
    id: "dp_ra_b_01_chompy_big_lunch_hunt",
    title: "Chompy's Big Lunch Hunt",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Level B guided reading choice adventure",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    mediaFolder: "chompy-lunch-hunt"
  },
  {
    id: "dp_ra_b_02_sunnys_rainy_day_rescue",
    title: "Sunny's Rainy Day Rescue",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Level B guided reading choice adventure",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    mediaFolder: "sunny-rainy-rescue"
  }
];

const dinoPalsStoryQuests = [
  {
    id: "dp_ra_b_01_chompy_big_lunch_hunt",
    title: "Chompy's Big Lunch Hunt",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Level B guided reading choice adventure",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Chompy", "Sunny", "Grumpy", "Bouncy"],
    location: "Sunny Hollow - Cozy Cave, Berry Bush Corner, Big Flat Rock, Muddy Puddle Pool, Long Meadow",
    targetWords: ["Chompy", "lunch", "berries", "leaves", "cave", "rock", "mud", "rumbling", "enormous", "shared", "surprised", "sniffed"],
    highFrequencyWords: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "more", "no", "yes", "said", "for"],
    hfw: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "more", "no", "yes", "said", "for"],
    coverImageUrl: dinoPalsImagePath(chompyLunchFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      dinoPalsPage(chompyLunchFolder, "p01_start", ["Chompy woke up.", "His tummy was rumbling.", "\"I need lunch,\" he said."], "Where should Chompy go?", [
        { label: "Berries", nextPageId: "p02_berries" },
        { label: "Cave door", nextPageId: "p02_cave_door" }
      ], ["chompy", "rumbling", "lunch"]),
      dinoPalsPage(chompyLunchFolder, "p02_berries", ["Chompy sniffed the air.", "He found red berries.", "\"Sweet lunch!\" he said."], "What should Chompy do?", [
        { label: "Eat some", nextPageId: "p03_eat_berries" },
        { label: "Save some", nextPageId: "p03_save_berries" }
      ], ["chompy", "sniffed", "berries"]),
      dinoPalsPage(chompyLunchFolder, "p02_cave_door", ["Chompy padded to the cave door.", "Sunny was there with an enormous smile.", "\"Hello, Chompy!\" she said."], "Who should Chompy ask?", [
        { label: "Ask Sunny", nextPageId: "p03_ask_sunny" },
        { label: "Sniff path", nextPageId: "p03_sniff_path" }
      ], ["chompy", "sunny", "cave", "enormous"]),
      dinoPalsPage(chompyLunchFolder, "p03_eat_berries", ["Chompy ate a small bunch of berries.", "He paused and listened to his tummy.", "\"Still hungry,\" he said."], "What should Chompy do next?", [
        { label: "Check his tummy", nextPageId: "p04_not_full" },
        { label: "Find more food", nextPageId: "p04_more_food" }
      ], ["chompy", "berries", "more"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p03_save_berries", ["Chompy tucked some berries into a leaf basket.", "He left plenty on the bush for later.", "\"I can share these,\" he said."], "Who should Chompy visit?", [
        { label: "Sunny", nextPageId: "p04_sunny_shares" },
        { label: "Grumpy", nextPageId: "p04_grumpy_berries" }
      ], ["chompy", "berries", "share"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p03_ask_sunny", ["\"I am hungry,\" said Chompy.", "\"I can help,\" said Sunny.", "\"Food is more fun with friends.\""], "What should Sunny bring?", [
        { label: "Fruit", nextPageId: "p04_sunny_shares" },
        { label: "Leaves", nextPageId: "p04_leaf_lunch" }
      ], ["chompy", "sunny", "food"]),
      dinoPalsPage(chompyLunchFolder, "p03_sniff_path", ["Chompy sniffed the path.", "Sniff, sniff, sniff.", "One smell was not food."], "What smell does Chompy follow?", [
        { label: "Berry smell", nextPageId: "p02_berries" },
        { label: "Mud smell", nextPageId: "p04_mud_smell" }
      ], ["chompy", "sniffed", "mud"]),
      dinoPalsPage(chompyLunchFolder, "p04_not_full", ["Chompy was not full yet.", "His tummy made a gentle grumble.", "\"I need a proper lunch, not just berries,\" he said."], "What next?", [
        { label: "Find leaves", nextPageId: "p04_leaf_lunch" },
        { label: "Find pals", nextPageId: "p05_big_flat_rock" }
      ], ["chompy", "lunch", "more"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p04_more_food", ["Chompy wanted more food.", "He wanted an enormous lunch.", "\"Which way?\" he asked."], "Where should Chompy go?", [
        { label: "Big Rock", nextPageId: "p05_big_flat_rock" },
        { label: "Meadow", nextPageId: "p05_long_meadow" }
      ], ["chompy", "enormous", "lunch"]),
      dinoPalsPage(chompyLunchFolder, "p04_sunny_shares", ["Sunny shared fruit and fresh leaves.", "Chompy smiled at the balanced lunch.", "\"Thank you, Sunny.\""], "How should Chompy eat?", [
        { label: "Slowly, then check", nextPageId: "p06_tummy_big" },
        { label: "Invite the pals", nextPageId: "p05_big_flat_rock" }
      ], ["sunny", "shared", "lunch"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p04_grumpy_berries", ["Grumpy saw the berries.", "His tummy grumbled too.", "\"Hmph,\" said Grumpy."], "Does Grumpy want one?", [
        { label: "Yes", nextPageId: "p05_grumpy_tiny_smile" },
        { label: "Hmph no", nextPageId: "p05_big_flat_rock" }
      ], ["grumpy", "berries"]),
      dinoPalsPage(chompyLunchFolder, "p04_leaf_lunch", ["Chompy found a big leaf.", "He did not know if it was safe to eat.", "\"I should ask Sunny,\" he said."], "What can the leaf become?", [
        { label: "A lunch plate", nextPageId: "p05_big_flat_rock" },
        { label: "A floppy hat", nextPageId: "p07_leaf_hat" }
      ], ["chompy", "leaf"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p04_mud_smell", ["Chompy found mud.", "The mud was soggy.", "\"Mud is not lunch,\" he said."], "What should Chompy do?", [
        { label: "Step back", nextPageId: "p05_big_flat_rock" },
        { label: "Step around it", nextPageId: "p05_mud_face" }
      ], ["chompy", "mud", "soggy"]),
      dinoPalsPage(chompyLunchFolder, "p05_mud_face", ["Chompy stepped around the mud.", "One foot still went squish.", "\"Mud is not lunch,\" he said."], "Now what?", [
        { label: "Real food", nextPageId: "p05_big_flat_rock" },
        { label: "Ask Sunny", nextPageId: "p03_ask_sunny" }
      ], ["chompy", "mud"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p05_grumpy_tiny_smile", ["Grumpy tried one berry.", "He looked surprised.", "Then he almost smiled."], "What does Chompy do?", [
        { label: "Invite him to lunch", nextPageId: "p05_big_flat_rock" },
        { label: "Offer the basket", nextPageId: "p06_grumpy_full" }
      ], ["grumpy", "surprised", "berries"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p05_big_flat_rock", ["They carried their food to Big Flat Rock.", "Fruit, berries, and fresh leaves made a colourful lunch.", "\"A feast for friends!\" said Chompy."], "How should they begin?", [
        { label: "Take small portions", nextPageId: "p06_tummy_big" },
        { label: "Share together", nextPageId: "p06_everyone_eats" }
      ], ["chompy", "rock", "lunch", "enormous"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p05_long_meadow", ["Chompy went to Long Meadow.", "The grass tickled his nose.", "Something bounced in the grass."], "What is hiding there?", [
        { label: "Bouncy", nextPageId: "p06_bouncy_lunch" },
        { label: "More food", nextPageId: "p06_tummy_big" }
      ], ["chompy", "bouncy"]),
      dinoPalsPage(chompyLunchFolder, "p06_bouncy_lunch", ["Bouncy bounced in and stopped beside the picnic.", "His landing jiggled the leaf basket.", "\"Oops! I will help,\" said Bouncy."], "What tumbles out?", [
        { label: "Berries", nextPageId: "p07_berry_rain" },
        { label: "Leaves", nextPageId: "p07_leaf_hat" }
      ], ["bouncy", "lunch"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p06_tummy_big", ["Chompy forgot to eat slowly.", "Soon his tummy felt too tight.", "Sunny waited while Chompy checked how he felt."], "What should Chompy do?", [
        { label: "Stop and rest", nextPageId: "p08_star_ending" },
        { label: "Wait, then decide", nextPageId: "p07_more_please" }
      ], ["chompy", "sunny"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p06_everyone_eats", ["Everyone shared lunch.", "Chompy had lunch too.", "It felt peaceful."], "What does Chompy say?", [
        { label: "Thank you", nextPageId: "p08_thank_you_ending" },
        { label: "More?", nextPageId: "p07_more_please" }
      ], ["shared", "lunch", "peaceful"]),
      dinoPalsPage(chompyLunchFolder, "p06_grumpy_full", ["Grumpy shared the berries until he felt satisfied.", "He closed the basket with some left for later.", "\"Not bad,\" he grumbled."], "What should Chompy do?", [
        { label: "Check his tummy", nextPageId: "p08_thank_you_ending" },
        { label: "Pause with Grumpy", nextPageId: "p07_more_please" }
      ], ["grumpy", "grumbled", "berries"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p07_berry_rain", ["Berries tumbled from the jiggling basket.", "Chompy and Bouncy let them land.", "Then they gathered the clean berries together."], "What next?", [
        { label: "Rinse and share", nextPageId: "p06_everyone_eats" },
        { label: "Clean the mess", nextPageId: "p08_berry_mess_ending" }
      ], ["chompy", "berries"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p07_leaf_hat", ["A broad leaf fluttered onto Chompy's head.", "It made a splendid floppy hat.", "\"That is useful, but not lunch,\" said Sunny."], "How should Chompy use it?", [
        { label: "Make a lunch plate", nextPageId: "p08_thank_you_ending" },
        { label: "Wear it", nextPageId: "p08_leaf_hat_ending" }
      ], ["chompy", "leaf", "lunch"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p07_more_please", ["\"Maybe more,\" said Chompy.", "He paused, sipped water, and listened to his tummy.", "\"I am comfortably full,\" he decided."], "What happens next?", [
        { label: "Rest under the stars", nextPageId: "p08_star_ending" },
        { label: "Thank his friends", nextPageId: "p08_thank_you_ending" }
      ], ["chompy", "more"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p08_star_ending", ["That night, Chompy looked up.", "His tummy felt calm again.", "\"Breakfast can wait until morning,\" he whispered."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p08_thank_you_ending", ["\"Thank you,\" said Chompy.", "The pals packed the last berries for tomorrow.", "Chompy felt comfortably full."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "shared"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p08_berry_mess_ending", ["A few soft berries went splat.", "Chompy and Bouncy cleaned the rock together.", "The good berries stayed in the basket for tomorrow."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "berries", "bouncy"], { narrationNeedsRebuild: true }),
      dinoPalsPage(chompyLunchFolder, "p08_leaf_hat_ending", ["Chompy kept the leaf hat until lunch was ready.", "Then he ate slowly with his friends.", "The hat made everyone laugh."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "leaf"], { narrationNeedsRebuild: true })
    ]
  },
  {
    id: "dp_ra_b_02_sunnys_rainy_day_rescue",
    title: "Sunny's Rainy Day Rescue",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Level B guided reading choice adventure",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Sunny", "Grumpy", "Dozy", "Wiggly", "Honky"],
    location: "Sunny Hollow - Muddy Puddle Pool, Big Flat Rock, Cozy Cave, Fernwood forest",
    targetWords: ["Sunny", "rain", "puddle", "mud", "soggy", "dripping", "splashed", "surprised", "peaceful", "grumbled", "rainbow"],
    highFrequencyWords: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "in", "no", "yes", "said", "too"],
    hfw: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "in", "no", "yes", "said", "too"],
    coverImageUrl: dinoPalsImagePath(sunnyRainyFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      dinoPalsPage(sunnyRainyFolder, "p01_start", ["Rain fell on Sunny Hollow.", "Grumpy shivered, and Dozy hugged a soggy pillow.", "\"Two pals need help,\" said Sunny."], "Who should Sunny check first?", [
        { label: "Grumpy", nextPageId: "p02_grumpy" },
        { label: "Dozy", nextPageId: "p02_dozy" }
      ], ["sunny", "rain", "dripping"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p02_grumpy", ["Grumpy was soaked.", "Water dripped from his shell.", "\"Please help me find a dry place,\" he grumbled."], "Where should Sunny look?", [
        { label: "Dry rock", nextPageId: "p03_dry_rock" },
        { label: "Puddle", nextPageId: "p03_puddle" }
      ], ["grumpy", "rain", "grumbled"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p02_dozy", ["Dozy was sleepy.", "His pillow was soggy.", "\"My nap is wet,\" he said."], "What should Sunny do?", [
        { label: "Cozy Cave", nextPageId: "p03_cozy_cave" },
        { label: "Find a broad leaf", nextPageId: "p03_puddle" }
      ], ["dozy", "soggy"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p03_dry_rock", ["Sunny found Big Flat Rock.", "The rain had splashed it.", "\"Not dry,\" said Grumpy."], "What now?", [
        { label: "Try cave", nextPageId: "p03_cozy_cave" },
        { label: "Try puddle", nextPageId: "p03_puddle" }
      ], ["sunny", "rock", "splashed"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p03_cozy_cave", ["Cozy Cave was dry.", "Dozy hugged his rescued pillow.", "\"This is peaceful,\" he said."], "Who should Sunny check next?", [
        { label: "Grumpy", nextPageId: "p04_cave_grumpy" },
        { label: "Wiggly", nextPageId: "p04_wiggly_tail" }
      ], ["cave", "dozy", "peaceful"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p03_puddle", ["Sunny found a broad leaf beside a wide puddle.", "Rain dripped from her rainbow horns.", "The puddle also looked fun."], "What should Sunny do?", [
        { label: "Jump", nextPageId: "p04_splash" },
        { label: "Wait", nextPageId: "p04_wait" }
      ], ["sunny", "puddle"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p04_splash", ["Sunny checked the puddle edge, then jumped.", "Mud splashed farther than she expected.", "\"Oops!\" said Sunny."], "Who got splashed?", [
        { label: "Grumpy", nextPageId: "p05_grumpy_splash" },
        { label: "Dozy", nextPageId: "p05_dozy_splash" }
      ], ["sunny", "mud", "splashed"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p04_wait", ["Sunny waited by the puddle.", "Drip, drip, drip went the rain.", "Then footsteps came."], "Who walks by?", [
        { label: "Wiggly", nextPageId: "p04_wiggly_tail" },
        { label: "Honky", nextPageId: "p05_honky_rain" }
      ], ["sunny", "puddle", "rain"]),
      dinoPalsPage(sunnyRainyFolder, "p04_cave_grumpy", ["Grumpy came into the cave.", "His tail was still dripping.", "\"Too drippy,\" he grumbled."], "What helps?", [
        { label: "Leaf roof", nextPageId: "p05_leaf_roof" },
        { label: "Puddle game", nextPageId: "p03_puddle" }
      ], ["grumpy", "dripping", "grumbled"]),
      dinoPalsPage(sunnyRainyFolder, "p04_wiggly_tail", ["Wiggly hurried past the cave.", "His long tail swished across the puddle.", "\"Oops. Was everyone clear?\" he asked."], "What did the tail do?", [
        { label: "Made wave", nextPageId: "p05_tail_wave" },
        { label: "Knocked leaf", nextPageId: "p05_leaf_roof" }
      ], ["wiggly"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p05_grumpy_splash", ["Grumpy got splashed.", "His eyes widened.", "Sunny stopped and waited for him to speak."], "What should Sunny do?", [
        { label: "Ask how he feels", nextPageId: "p06_grumpy_smile" },
        { label: "Apologise and help", nextPageId: "p06_sorry_grumpy" }
      ], ["grumpy", "splashed", "surprised", "enormous"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p05_dozy_splash", ["Dozy got splashed.", "His eyes popped open.", "Sunny asked, \"Are you all right?\""], "What does Dozy say?", [
        { label: "Again?", nextPageId: "p06_dozy_again" },
        { label: "Nap now", nextPageId: "p03_cozy_cave" }
      ], ["dozy", "splashed"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p05_honky_rain", ["Honky called, \"RAIN!\"", "His enormous voice shook the leaves.", "Down they fell."], "What happened?", [
        { label: "Leaves fell", nextPageId: "p06_leaf_rain" },
        { label: "Ears covered", nextPageId: "p06_grumpy_ears" }
      ], ["honky", "rain", "enormous"]),
      dinoPalsPage(sunnyRainyFolder, "p05_tail_wave", ["Wiggly's tail made a wave.", "The puddle grew bigger.", "Sunny stepped back and asked, \"Shall we play?\""], "Who should splash?", [
        { label: "Sunny jumps", nextPageId: "p04_splash" },
        { label: "Everyone jumps", nextPageId: "p07_everyone_puddle" }
      ], ["wiggly", "puddle"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p05_leaf_roof", ["The big leaf made a roof.", "No more drip, drip.", "\"Good leaf,\" said Sunny."], "Who sits under it?", [
        { label: "Grumpy", nextPageId: "p06_grumpy_dry" },
        { label: "Dozy", nextPageId: "p06_dozy_dry" }
      ], ["leaf", "sunny"]),
      dinoPalsPage(sunnyRainyFolder, "p06_grumpy_smile", ["Grumpy's frown softened.", "\"Puddles can be fun when everyone agrees,\" he said.", "Sunny nodded."], "What should they try?", [
        { label: "Invite everyone", nextPageId: "p07_everyone_puddle" },
        { label: "Leaf roof", nextPageId: "p05_leaf_roof" }
      ], ["grumpy", "puddle"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p06_sorry_grumpy", ["\"Sorry,\" said Sunny.", "Grumpy dripped and grumbled.", "\"Help me get dry.\""], "What helps Grumpy?", [
        { label: "Dry leaf", nextPageId: "p05_leaf_roof" },
        { label: "Ask before another splash", nextPageId: "p06_grumpy_smile" }
      ], ["sunny", "grumpy", "grumbled"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p06_dozy_again", ["\"Again, please,\" said Dozy.", "Sunny made a tiny splash away from the pillow.", "Dozy giggled."], "What now?", [
        { label: "Everyone joins", nextPageId: "p07_everyone_puddle" },
        { label: "Dozy naps", nextPageId: "p03_cozy_cave" }
      ], ["dozy", "sunny", "splashed"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p06_leaf_rain", ["Leaves came down.", "It was leaf rain.", "Sunny had an idea."], "What can leaves make?", [
        { label: "Roof", nextPageId: "p05_leaf_roof" },
        { label: "Boat", nextPageId: "p07_leaf_boat" }
      ], ["leaf", "rain", "sunny"]),
      dinoPalsPage(sunnyRainyFolder, "p06_grumpy_ears", ["Grumpy covered his ears.", "\"Too loud,\" he said.", "Honky lowered the rainbow crest. \"Sorry.\""], "What should Honky do?", [
        { label: "Use a gentle voice", nextPageId: "p08_quiet_ending" },
        { label: "Invite pals one at a time", nextPageId: "p07_everyone_puddle" }
      ], ["grumpy", "honky"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p06_grumpy_dry", ["Grumpy was dry.", "The leaf kept rain away.", "\"This is better.\""], "Go outside?", [
        { label: "Yes", nextPageId: "p07_everyone_puddle" },
        { label: "No", nextPageId: "p08_quiet_ending" }
      ], ["grumpy", "rain", "leaf"]),
      dinoPalsPage(sunnyRainyFolder, "p06_dozy_dry", ["Dozy was dry.", "He fell asleep again.", "The cave felt peaceful."], "Wake Dozy?", [
        { label: "No", nextPageId: "p08_quiet_ending" },
        { label: "Soft splash", nextPageId: "p06_dozy_again" }
      ], ["dozy", "peaceful"]),
      dinoPalsPage(sunnyRainyFolder, "p07_leaf_boat", ["Sunny folded one leaf into a boat.", "It went plop and floated beside Grumpy.", "Grumpy watched its safe little journey."], "What should the leaf become?", [
        { label: "A boat across the puddle", nextPageId: "p08_rainbow_ending" },
        { label: "A roof for Grumpy", nextPageId: "p05_leaf_roof" }
      ], ["sunny", "leaf", "grumpy"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p07_everyone_puddle", ["Sunny asked, \"Shall we splash together?\"", "One by one, the pals joined in.", "Even Grumpy's tail made a tiny splash."], "What comes next?", [
        { label: "Sun out", nextPageId: "p08_rainbow_ending" },
        { label: "Grumpy laughs", nextPageId: "p08_grumpy_laugh_ending" }
      ], ["sunny", "grumpy", "splashed"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p08_rainbow_ending", ["The rain slowed, and the sun came out.", "A rainbow arched above Sunny Hollow.", "Every pal was safe, heard, and smiling.", "Sunny had turned a soggy day into a shared adventure."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["sunny", "rainbow"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p08_grumpy_laugh_ending", ["Grumpy's tail made one tiny splash.", "He tried to hold his frown, then laughed.", "Sunny laughed too.", "The rainy-day rescue ended in a puddle party."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["grumpy", "sunny", "surprised"], { narrationNeedsRebuild: true }),
      dinoPalsPage(sunnyRainyFolder, "p08_quiet_ending", ["Everyone used soft voices.", "The rain tapped gently outside.", "The cave was warm, and every pillow was dry.", "The pals rested together in peace."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["rain", "peaceful"], { narrationNeedsRebuild: true })
    ]
  },
  {
    id: "dp_ra_b_05_bossy_picnic_mix_up",
    title: "Bossy and the Picnic Mix-Up",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Level B guided reading choice adventure",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Bossy", "Chompy", "Wiggly", "Dozy", "Sunny"],
    location: "Sunny Hollow - picnic rock, berry bush, meadow, leafy trees",
    targetWords: ["Bossy", "plan", "picnic", "berries", "leaves", "basket", "help", "ask", "share", "mess", "tail", "sleep"],
    highFrequencyWords: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "help", "ask", "share", "said"],
    hfw: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "help", "ask", "share", "said"],
    coverImageUrl: dinoPalsImagePath(bossyPicnicFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      dinoPalsPage(bossyPicnicFolder, "p01_start", ["Bossy had a picnic plan.", "It was a very neat plan.", "Nothing could go wrong."], "Who should Bossy check first?", [
        { label: "Chompy", nextPageId: "p02_chompy" },
        { label: "Wiggly", nextPageId: "p02_wiggly" }
      ], ["bossy", "plan", "picnic"]),
      dinoPalsPage(bossyPicnicFolder, "p02_chompy", ["Bossy gave Chompy one job.", "\"Carry the berries,\" said Bossy.", "Chompy sniffed the basket."], "What should Chompy do?", [
        { label: "Carry the basket", nextPageId: "p03_carry_basket" },
        { label: "Taste one berry", nextPageId: "p03_taste_berry" }
      ], ["bossy", "chompy", "berries", "basket"]),
      dinoPalsPage(bossyPicnicFolder, "p02_wiggly", ["Bossy gave Wiggly one job.", "\"Carry the leaves,\" said Bossy.", "Wiggly tucked the tail in."], "What should Wiggly do?", [
        { label: "Walk carefully", nextPageId: "p03_walk_carefully" },
        { label: "Turn around", nextPageId: "p03_tail_sweep" }
      ], ["bossy", "wiggly", "leaves", "tail"]),
      dinoPalsPage(bossyPicnicFolder, "p03_carry_basket", ["Chompy carried the basket.", "The basket smelled sweet.", "Chompy walked slower and slower."], "What happens next?", [
        { label: "Chompy eats one", nextPageId: "p04_one_berry" },
        { label: "Chompy calls Sunny", nextPageId: "p04_sunny_helps" }
      ], ["chompy", "basket", "berries"]),
      dinoPalsPage(bossyPicnicFolder, "p03_taste_berry", ["Chompy tasted one berry.", "Then one more.", "Then maybe one more."], "How many berries are left?", [
        { label: "One berry left", nextPageId: "p04_one_berry" },
        { label: "No berries left", nextPageId: "p04_no_berries" }
      ], ["chompy", "berries"]),
      dinoPalsPage(bossyPicnicFolder, "p03_walk_carefully", ["Wiggly walked carefully.", "Very carefully.", "The tail did not agree."], "What does the tail find?", [
        { label: "The picnic blanket", nextPageId: "p04_blanket_flip" },
        { label: "Dozy's pillow", nextPageId: "p04_pillow_flip" }
      ], ["wiggly", "tail", "picnic"]),
      dinoPalsPage(bossyPicnicFolder, "p03_tail_sweep", ["Wiggly turned around.", "The tail went swish.", "Bossy's plan went flying."], "What went flying?", [
        { label: "The clipboard", nextPageId: "p04_clipboard_gone" },
        { label: "The leaves", nextPageId: "p04_leaf_storm" }
      ], ["wiggly", "tail", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p04_one_berry", ["One berry was left.", "Bossy looked at the basket.", "Chompy looked at the sky."], "What should Chompy say?", [
        { label: "\"Sorry.\"", nextPageId: "p05_chompy_sorry" },
        { label: "\"It fell.\"", nextPageId: "p05_not_true" }
      ], ["berries", "bossy", "basket"]),
      dinoPalsPage(bossyPicnicFolder, "p04_no_berries", ["The basket was empty.", "Chompy's tummy was not.", "Bossy blinked twice."], "What should they do?", [
        { label: "Find more berries", nextPageId: "p06_find_more" },
        { label: "Ask everyone to share", nextPageId: "p06_ask_nicely" }
      ], ["basket", "chompy", "bossy"]),
      dinoPalsPage(bossyPicnicFolder, "p04_sunny_helps", ["Sunny came over.", "\"You can do it, Chompy.\"", "Chompy held the basket higher."], "Where should the basket go?", [
        { label: "Take it to the rock", nextPageId: "p07_picnic_ready" },
        { label: "Share one berry", nextPageId: "p05_chompy_sorry" }
      ], ["sunny", "chompy", "basket"]),
      dinoPalsPage(bossyPicnicFolder, "p04_blanket_flip", ["The picnic blanket flipped.", "Cups rolled away.", "Bossy made a tiny squeak."], "Who can help?", [
        { label: "Wiggly fixes it", nextPageId: "p05_wiggly_fix" },
        { label: "Dozy helps", nextPageId: "p05_dozy_blanket" }
      ], ["picnic", "bossy"]),
      dinoPalsPage(bossyPicnicFolder, "p04_pillow_flip", ["Dozy's pillow flipped up.", "Dozy woke up.", "That was surprising."], "What should Dozy do?", [
        { label: "Help fold the blanket", nextPageId: "p05_dozy_blanket" },
        { label: "Go back to sleep", nextPageId: "p05_sleepy_pause" }
      ], ["dozy", "sleep"]),
      dinoPalsPage(bossyPicnicFolder, "p04_clipboard_gone", ["The clipboard flew away.", "Bossy gasped.", "No clipboard meant no plan."], "Where did it land?", [
        { label: "It landed in a bush", nextPageId: "p05_bush_clipboard" },
        { label: "It landed on Chompy", nextPageId: "p05_clipboard_on_chompy" }
      ], ["bossy", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p04_leaf_storm", ["Leaves flew everywhere.", "Dozy got a leaf hat.", "Sunny laughed kindly."], "How should they use the leaves?", [
        { label: "Use leaves as plates", nextPageId: "p06_leaf_plates" },
        { label: "Use leaves as a roof", nextPageId: "p06_leaf_roof" }
      ], ["leaves", "dozy", "sunny"]),
      dinoPalsPage(bossyPicnicFolder, "p05_chompy_sorry", ["\"I ate some,\" said Chompy.", "\"Some?\" asked Bossy.", "Chompy looked at his tummy."], "How does Bossy respond?", [
        { label: "Bossy feels cross", nextPageId: "p06_bossy_cross" },
        { label: "Bossy asks for help", nextPageId: "p06_ask_nicely" }
      ], ["chompy", "bossy", "ask"]),
      dinoPalsPage(bossyPicnicFolder, "p05_not_true", ["\"It fell,\" said Chompy.", "A berry rolled off his bib.", "\"Oh,\" said Chompy."], "What should Chompy do?", [
        { label: "Tell the truth", nextPageId: "p05_chompy_sorry" },
        { label: "Hide the berry", nextPageId: "p06_berry_rolls" }
      ], ["chompy", "berries"]),
      dinoPalsPage(bossyPicnicFolder, "p05_wiggly_fix", ["Wiggly tried to fix it.", "The tail helped.", "Then the tail unhelped."], "Did it work?", [
        { label: "Blanket folds neatly", nextPageId: "p07_picnic_ready" },
        { label: "Blanket flies again", nextPageId: "p06_ask_nicely" }
      ], ["wiggly", "tail", "help"]),
      dinoPalsPage(bossyPicnicFolder, "p05_dozy_blanket", ["Dozy sat on the blanket.", "That held it down.", "Dozy fell asleep."], "Was Dozy helpful?", [
        { label: "Yes, helpful", nextPageId: "p07_picnic_ready" },
        { label: "Sort of", nextPageId: "p06_sleepy_problem" }
      ], ["dozy", "sleep", "help"]),
      dinoPalsPage(bossyPicnicFolder, "p05_sleepy_pause", ["Dozy went back to sleep.", "The blanket stayed messy.", "Bossy took a deep breath."], "What should Bossy do?", [
        { label: "Wake Dozy kindly", nextPageId: "p05_dozy_blanket" },
        { label: "Ask everyone", nextPageId: "p06_ask_nicely" }
      ], ["dozy", "sleep", "bossy"]),
      dinoPalsPage(bossyPicnicFolder, "p05_bush_clipboard", ["The clipboard was in a bush.", "Chompy found berries there too.", "This was dangerous."], "What should Chompy grab?", [
        { label: "Grab clipboard", nextPageId: "p06_clipboard_back" },
        { label: "Grab berries", nextPageId: "p04_no_berries" }
      ], ["chompy", "berries"]),
      dinoPalsPage(bossyPicnicFolder, "p05_clipboard_on_chompy", ["The clipboard landed on Chompy.", "Chompy wore it like a hat.", "Bossy did not write that plan."], "What should Chompy do?", [
        { label: "Give it back", nextPageId: "p06_clipboard_back" },
        { label: "Wear it", nextPageId: "p08_silly_hat_ending" }
      ], ["chompy", "bossy", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p06_bossy_cross", ["Bossy felt cross.", "The picnic was still not ready.", "Being cross did not fix it."], "What should Bossy try?", [
        { label: "Ask nicely", nextPageId: "p06_ask_nicely" },
        { label: "Make a louder plan", nextPageId: "p06_loud_plan" }
      ], ["bossy", "picnic", "ask"]),
      dinoPalsPage(bossyPicnicFolder, "p06_ask_nicely", ["Bossy folded the clipboard.", "\"Can everyone help, please?\"", "Everyone looked up."], "Who helps first?", [
        { label: "Chompy helps", nextPageId: "p06_leaf_plates" },
        { label: "Wiggly helps", nextPageId: "p05_wiggly_fix" }
      ], ["bossy", "help", "ask"]),
      dinoPalsPage(bossyPicnicFolder, "p06_berry_rolls", ["The berry rolled away.", "Then five more rolled after it.", "Chompy chased them."], "Where do the berries go?", [
        { label: "Big Flat Rock", nextPageId: "p07_picnic_ready" },
        { label: "Muddy Puddle Pool", nextPageId: "p08_berry_splat_ending" }
      ], ["berries", "chompy"]),
      dinoPalsPage(bossyPicnicFolder, "p06_leaf_plates", ["They used leaves as plates.", "That was Sunny's idea.", "Bossy wrote it down."], "What goes on the plates?", [
        { label: "Berries", nextPageId: "p07_picnic_ready" },
        { label: "Leaves", nextPageId: "p08_leaf_lunch_ending" }
      ], ["leaves", "sunny", "bossy"]),
      dinoPalsPage(bossyPicnicFolder, "p06_leaf_roof", ["They made a leaf roof.", "It was not needed.", "But it looked wonderful."], "What should they do under it?", [
        { label: "Eat under it", nextPageId: "p07_picnic_ready" },
        { label: "Nap under it", nextPageId: "p08_dozy_roof_ending" }
      ], ["leaves", "picnic"]),
      dinoPalsPage(bossyPicnicFolder, "p06_sleepy_problem", ["Dozy held the blanket down.", "Dozy also held the cups down.", "By sleeping on them."], "What should they do?", [
        { label: "Move the cups", nextPageId: "p07_picnic_ready" },
        { label: "Let Dozy nap", nextPageId: "p08_dozy_roof_ending" }
      ], ["dozy", "sleep"]),
      dinoPalsPage(bossyPicnicFolder, "p06_clipboard_back", ["Bossy got the clipboard back.", "Then Bossy paused.", "Maybe the plan could change."], "Should the plan change?", [
        { label: "Change the plan", nextPageId: "p06_ask_nicely" },
        { label: "No", nextPageId: "p06_loud_plan" }
      ], ["bossy", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p06_loud_plan", ["Bossy used the megaphone.", "Everyone jumped.", "The cups jumped too."], "Was that better?", [
        { label: "No, not better", nextPageId: "p06_ask_nicely" },
        { label: "Funny", nextPageId: "p08_cup_jump_ending" }
      ], ["bossy", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p06_find_more", ["Bossy found the berry bush.", "Chompy found it too.", "\"I will wait,\" said Chompy."], "How should they collect berries?", [
        { label: "Ask everyone", nextPageId: "p06_ask_nicely" },
        { label: "Use the basket", nextPageId: "p07_picnic_ready" }
      ], ["bossy", "chompy", "berries", "basket"]),
      dinoPalsPage(bossyPicnicFolder, "p07_picnic_ready", ["At last, the picnic was ready.", "It was not Bossy's first plan.", "It was better."], "Who gets the first bite?", [
        { label: "Chompy gets first bite", nextPageId: "p08_chompy_bite_ending" },
        { label: "Everyone shares", nextPageId: "p08_teamwork_ending" }
      ], ["bossy", "picnic", "share"]),
      dinoPalsPage(bossyPicnicFolder, "p08_chompy_bite_ending", ["Chompy took one bite.", "A very big bite.", "Bossy made a new plan."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "bossy", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p08_teamwork_ending", ["Everyone shared the picnic.", "Bossy smiled.", "\"Good plan,\" said Bossy."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["bossy", "picnic", "share"]),
      dinoPalsPage(bossyPicnicFolder, "p08_silly_hat_ending", ["Chompy kept the clipboard hat.", "Bossy tried not to laugh.", "The hat was a terrible plan."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "bossy", "plan"]),
      dinoPalsPage(bossyPicnicFolder, "p08_berry_splat_ending", ["The berries went splat.", "The picnic turned purple.", "Chompy still said, \"Yum.\""], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["berries", "picnic", "chompy"]),
      dinoPalsPage(bossyPicnicFolder, "p08_leaf_lunch_ending", ["They had leaf lunch.", "Chompy chewed slowly.", "\"Needs berries,\" said Chompy."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["leaves", "chompy", "berries"]),
      dinoPalsPage(bossyPicnicFolder, "p08_dozy_roof_ending", ["Dozy napped under the leaf roof.", "The picnic waited.", "That was peaceful too."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["dozy", "sleep", "picnic"]),
      dinoPalsPage(bossyPicnicFolder, "p08_cup_jump_ending", ["The cups jumped again.", "Bossy wrote one rule.", "No megaphone at picnics."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["bossy", "picnic"])
    ]
  },
  {
    id: "dp_ra_b_06_zippy_flappy_fast_slow_up_down",
    title: "Zippy and Flappy: Fast, Slow, Up, Down",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Level B guided reading choice adventure",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Zippy", "Flappy", "Sunny", "Grumpy"],
    location: "Sunny Hollow - meadow, rock, fern patch, branch, home path",
    targetWords: ["Zippy", "Flappy", "fast", "slow", "up", "down", "run", "flap", "stop", "branch", "meadow", "quiet"],
    highFrequencyWords: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "up", "down", "stop", "said"],
    hfw: ["I", "am", "is", "the", "go", "to", "see", "can", "we", "you", "up", "down", "stop", "said"],
    coverImageUrl: dinoPalsImagePath(zippyFlappyFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      dinoPalsPage(zippyFlappyFolder, "p01_start", ["Zippy ran fast.", "Flappy flapped up.", "Both of them forgot to stop."], "Who should we follow?", [
        { label: "Follow Zippy", nextPageId: "p02_zippy" },
        { label: "Follow Flappy", nextPageId: "p02_flappy" }
      ], ["zippy", "flappy", "fast", "up", "stop"]),
      dinoPalsPage(zippyFlappyFolder, "p02_zippy", ["Zippy ran past the meadow.", "Zippy ran past the rock.", "Zippy ran past the reason for running."], "What should Zippy do?", [
        { label: "Stop now", nextPageId: "p03_zippy_stops" },
        { label: "Keep running", nextPageId: "p03_zippy_too_far" }
      ], ["zippy", "run", "meadow", "fast"]),
      dinoPalsPage(zippyFlappyFolder, "p02_flappy", ["Flappy flapped once.", "Flappy flapped twice.", "Flappy flapped into a fern."], "What should Flappy try?", [
        { label: "Try flying up", nextPageId: "p03_flappy_up" },
        { label: "Try walking", nextPageId: "p03_flappy_walks" }
      ], ["flappy", "flap", "up"]),
      dinoPalsPage(zippyFlappyFolder, "p03_zippy_stops", ["Zippy stopped.", "The scarf stopped too.", "That felt strange."], "What does Zippy notice?", [
        { label: "A flower", nextPageId: "p04_flower" },
        { label: "Flappy", nextPageId: "p04_find_flappy" }
      ], ["zippy", "stop"]),
      dinoPalsPage(zippyFlappyFolder, "p03_zippy_too_far", ["Zippy kept running.", "The Hollow got smaller.", "That was a problem."], "Who might help?", [
        { label: "Sunny", nextPageId: "p04_sunny_finds_zippy" },
        { label: "Flappy", nextPageId: "p04_flappy_sees_zippy" }
      ], ["zippy", "run"]),
      dinoPalsPage(zippyFlappyFolder, "p03_flappy_up", ["Flappy flapped up.", "Up, up, almost up.", "Then down."], "Where does Flappy land?", [
        { label: "On a branch", nextPageId: "p04_branch" },
        { label: "In the mud", nextPageId: "p04_mud_landing" }
      ], ["flappy", "up", "down", "branch"]),
      dinoPalsPage(zippyFlappyFolder, "p03_flappy_walks", ["Flappy walked instead.", "Walking worked.", "That was interesting."], "Where does Flappy walk?", [
        { label: "To the branch", nextPageId: "p04_branch" },
        { label: "To Zippy", nextPageId: "p04_find_flappy" }
      ], ["flappy", "slow", "branch"]),
      dinoPalsPage(zippyFlappyFolder, "p04_flower", ["Zippy saw one flower.", "Zippy had run past it nine times.", "It was still there."], "What should Zippy do?", [
        { label: "Look closely", nextPageId: "p05_slow_looking" },
        { label: "Run to tell Sunny", nextPageId: "p05_run_again" }
      ], ["zippy", "run", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p04_find_flappy", ["Zippy found Flappy.", "Flappy had feathers everywhere.", "Both of them looked busy."], "How should they move?", [
        { label: "Fast together", nextPageId: "p05_fast_together" },
        { label: "Slow together", nextPageId: "p05_slow_together" }
      ], ["zippy", "flappy", "fast", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p04_sunny_finds_zippy", ["Sunny found Zippy.", "\"You went very far,\" said Sunny.", "\"I noticed,\" said Zippy."], "How should Zippy go home?", [
        { label: "Run home", nextPageId: "p05_run_again" },
        { label: "Walk slowly", nextPageId: "p06_walk_home" }
      ], ["sunny", "zippy", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p04_flappy_sees_zippy", ["Flappy saw a red blur.", "Then the blur sat down.", "It was Zippy."], "How should Flappy reach Zippy?", [
        { label: "Flap over", nextPageId: "p05_flappy_rescue" },
        { label: "Walk over", nextPageId: "p05_slow_together" }
      ], ["flappy", "zippy", "flap"]),
      dinoPalsPage(zippyFlappyFolder, "p04_branch", ["Flappy landed on a branch.", "Not a big flight.", "But a good landing."], "Who should Flappy show?", [
        { label: "Show Zippy", nextPageId: "p04_find_flappy" },
        { label: "Show Grumpy", nextPageId: "p05_grumpy_advice" }
      ], ["flappy", "branch"]),
      dinoPalsPage(zippyFlappyFolder, "p04_mud_landing", ["Flappy landed in mud.", "It was soft.", "It was also very muddy."], "What should Flappy do?", [
        { label: "Try again", nextPageId: "p03_flappy_up" },
        { label: "Ask Grumpy", nextPageId: "p05_grumpy_advice" }
      ], ["flappy", "down"]),
      dinoPalsPage(zippyFlappyFolder, "p05_slow_looking", ["Zippy looked slowly.", "The flower had tiny dots.", "Slow was not boring."], "Who should Zippy show?", [
        { label: "Show Flappy", nextPageId: "p05_slow_together" },
        { label: "Show Sunny", nextPageId: "p06_walk_home" }
      ], ["zippy", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p05_run_again", ["Zippy ran again.", "Too fast.", "The flower was gone behind."], "Can Zippy stop this time?", [
        { label: "Stop this time", nextPageId: "p03_zippy_stops" },
        { label: "Not yet", nextPageId: "p03_zippy_too_far" }
      ], ["zippy", "fast", "stop"]),
      dinoPalsPage(zippyFlappyFolder, "p05_fast_together", ["Zippy ran.", "Flappy flapped.", "Nobody knew where they were going."], "Who do they pass?", [
        { label: "They pass Sunny", nextPageId: "p06_sunny_stop" },
        { label: "They pass Grumpy", nextPageId: "p06_grumpy_stop" }
      ], ["zippy", "flappy", "fast", "flap"]),
      dinoPalsPage(zippyFlappyFolder, "p05_slow_together", ["Zippy walked.", "Flappy walked too.", "That gave them time to see."], "What do they see?", [
        { label: "A branch", nextPageId: "p07_branch_practice" },
        { label: "The way home", nextPageId: "p06_walk_home" }
      ], ["zippy", "flappy", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p05_flappy_rescue", ["Flappy flapped toward Zippy.", "Three flaps up.", "One soft plop down."], "Did Zippy see?", [
        { label: "Zippy saw", nextPageId: "p05_slow_together" },
        { label: "Not yet", nextPageId: "p04_mud_landing" }
      ], ["flappy", "zippy", "flap", "up", "down"]),
      dinoPalsPage(zippyFlappyFolder, "p05_grumpy_advice", ["Grumpy looked at Flappy.", "\"You do not have to be good at everything.\"", "Flappy blinked."], "What should Flappy try?", [
        { label: "Try being Flappy", nextPageId: "p07_branch_practice" },
        { label: "Try being Zippy", nextPageId: "p05_fast_together" }
      ], ["grumpy", "flappy"]),
      dinoPalsPage(zippyFlappyFolder, "p06_walk_home", ["They walked home.", "It took a long time.", "Zippy saw many things."], "What does Zippy remember?", [
        { label: "The flower", nextPageId: "p08_flower_ending" },
        { label: "Walking with Flappy", nextPageId: "p08_friend_ending" }
      ], ["zippy", "flappy", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p06_sunny_stop", ["\"Stop!\" called Sunny.", "Zippy skidded.", "Flappy landed on Zippy."], "What next?", [
        { label: "Everyone okay", nextPageId: "p07_laugh" },
        { label: "Try slower", nextPageId: "p05_slow_together" }
      ], ["sunny", "zippy", "flappy", "stop"]),
      dinoPalsPage(zippyFlappyFolder, "p06_grumpy_stop", ["\"Stop,\" said Grumpy.", "It was not loud.", "But everyone stopped."], "What does Grumpy say?", [
        { label: "\"Slow down.\"", nextPageId: "p05_slow_together" },
        { label: "\"Try again.\"", nextPageId: "p07_branch_practice" }
      ], ["grumpy", "stop", "slow"]),
      dinoPalsPage(zippyFlappyFolder, "p07_branch_practice", ["Flappy tried again.", "Three flaps up.", "One neat branch."], "Who reacts?", [
        { label: "Zippy cheers", nextPageId: "p08_friend_ending" },
        { label: "Grumpy praises", nextPageId: "p08_grumpy_ending" }
      ], ["flappy", "up", "branch"]),
      dinoPalsPage(zippyFlappyFolder, "p07_laugh", ["Zippy laughed.", "Flappy laughed.", "Sunny laughed too."], "What should they do?", [
        { label: "Try slowly", nextPageId: "p05_slow_together" },
        { label: "Go home", nextPageId: "p06_walk_home" }
      ], ["zippy", "flappy", "sunny"]),
      dinoPalsPage(zippyFlappyFolder, "p08_flower_ending", ["Zippy found the flower again.", "This time, Zippy stopped.", "That was new."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["zippy", "stop"]),
      dinoPalsPage(zippyFlappyFolder, "p08_friend_ending", ["Zippy was fast.", "Flappy was Flappy.", "Together, they got home."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["zippy", "flappy", "fast"]),
      dinoPalsPage(zippyFlappyFolder, "p08_grumpy_ending", ["\"Not bad,\" said Grumpy.", "From Grumpy, that meant wonderful.", "Flappy stood very tall."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["grumpy", "flappy"])
    ]
  }
];

const activeLegacyDinoPalsStoryQuestIds = new Set([
  "dp_ra_b_01_chompy_big_lunch_hunt",
  "dp_ra_b_02_sunnys_rainy_day_rescue"
]);

export const dinoPalsV2MediaPendingStoryQuestDrafts = [];


const moonwoodStoryQuests = [
  {
    id: "mw_ra_c_01_pip_stone_loud_thing",
    title: "Pip and Stone: The Loud Thing",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Level C guided reading choice adventure",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Pip", "Stone", "Toadling"],
    location: "Moonwood - Hollow Oak, Fog Marsh, mossy stones, reeds, dark water",
    targetWords: ["Pip", "Stone", "loud", "marsh", "fog", "toadling", "lost", "family", "gentle", "together", "help", "quiet"],
    highFrequencyWords: ["and", "the", "from", "said", "went", "was", "were", "looked", "again", "with", "home", "everyone"],
    hfw: ["and", "the", "from", "said", "went", "was", "were", "looked", "again", "with", "home", "everyone"],
    coverImageUrl: moonwoodImagePath(pipStoneFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      moonwoodPage(pipStoneFolder, "p01_start", ["Pip and Stone sat outside the Hollow Oak.", "Then a crash came from the Fog Marsh.", "The leaves shook."], "What should they do?", [
        { label: "Find the noise", nextPageId: "p02_pip_wants_to_go" },
        { label: "Stay near the Hollow Oak", nextPageId: "p02_stone_waits" }
      ], ["pip", "stone", "marsh", "fog", "loud"]),
      moonwoodPage(pipStoneFolder, "p02_pip_wants_to_go", ["\"I want to find it,\" said Pip.", "Stone folded both arms.", "\"It is very loud,\" said Stone."], "Who should go first?", [
        { label: "Pip goes first", nextPageId: "p03_pip_edge" },
        { label: "Ask Stone to come", nextPageId: "p03_stone_one_foot" }
      ], ["pip", "stone", "loud"]),
      moonwoodPage(pipStoneFolder, "p02_stone_waits", ["Stone did not move.", "The noise came again.", "This time, even Stone blinked."], "What happens next?", [
        { label: "Stone follows Pip", nextPageId: "p03_stone_one_foot" },
        { label: "Call for Luna", nextPageId: "p03_luna_says_together" }
      ], ["stone"]),
      moonwoodPage(pipStoneFolder, "p03_pip_edge", ["Pip walked to the marsh edge.", "Grey fog curled around his boots.", "The noise came again."], "What should Pip do?", [
        { label: "Step into the fog", nextPageId: "p04_inside_marsh" },
        { label: "Wait for Stone", nextPageId: "p04_stone_appears" }
      ], ["pip", "marsh", "fog"]),
      moonwoodPage(pipStoneFolder, "p03_stone_one_foot", ["Stone had not moved.", "Then Stone moved one foot.", "Then another.", "\"I came anyway,\" said Stone."], "How should they go?", [
        { label: "Go together", nextPageId: "p04_stone_appears" },
        { label: "Let Stone lead", nextPageId: "p04_stone_leads" }
      ], ["stone", "together"]),
      moonwoodPage(pipStoneFolder, "p03_luna_says_together", ["Luna listened to the sound.", "\"The Fog Marsh is not for one friend alone,\" she said.", "\"Go together.\""], "What should they do?", [
        { label: "Go with Stone", nextPageId: "p04_stone_appears" },
        { label: "Go carefully", nextPageId: "p04_inside_marsh" }
      ], ["marsh", "together"]),
      moonwoodPage(pipStoneFolder, "p04_stone_appears", ["Stone appeared behind Pip.", "The fog was thick.", "Stone put one huge hand on Pip's shoulder."], "How should they move?", [
        { label: "Hold hands", nextPageId: "p05_together" },
        { label: "Follow the sound", nextPageId: "p05_reeds_shake" }
      ], ["pip", "stone", "fog", "together"]),
      moonwoodPage(pipStoneFolder, "p04_stone_leads", ["Stone stepped forward.", "The ground squelched.", "Pip stayed close behind."], "What should they follow?", [
        { label: "Follow the loud noise", nextPageId: "p05_reeds_shake" },
        { label: "Look for tracks", nextPageId: "p05_tiny_tracks" }
      ], ["pip", "stone", "loud"]),
      moonwoodPage(pipStoneFolder, "p04_inside_marsh", ["Inside the marsh, the sound bounced.", "The reeds shook.", "The water rippled."], "Where should they look?", [
        { label: "Look near the reeds", nextPageId: "p05_reeds_shake" },
        { label: "Look at the mud", nextPageId: "p05_tiny_tracks" }
      ], ["marsh"]),
      moonwoodPage(pipStoneFolder, "p05_together", ["\"Together,\" said Stone.", "Pip nodded.", "The noise came from deeper in the fog."], "What should they do?", [
        { label: "Creep closer", nextPageId: "p06_mossy_stone" },
        { label: "Call softly", nextPageId: "p06_small_answer" }
      ], ["pip", "stone", "fog", "together"]),
      moonwoodPage(pipStoneFolder, "p05_reeds_shake", ["The reeds shook.", "Something very small was making something very big.", "Pip pointed ahead."], "Where should they go?", [
        { label: "Go to the mossy stone", nextPageId: "p06_mossy_stone" },
        { label: "Call softly", nextPageId: "p06_small_answer" }
      ], ["pip"]),
      moonwoodPage(pipStoneFolder, "p05_tiny_tracks", ["Pip found tiny wet tracks.", "They went around a puddle.", "They stopped near a mossy stone."], "What should they do?", [
        { label: "Look on the stone", nextPageId: "p06_mossy_stone" },
        { label: "Ask Stone to look", nextPageId: "p06_stone_bends" }
      ], ["pip", "stone"]),
      moonwoodPage(pipStoneFolder, "p06_small_answer", ["Pip called softly.", "The marsh went quiet.", "Then a tiny voice said, \"Here.\""], "How should they answer?", [
        { label: "Find the voice", nextPageId: "p06_mossy_stone" },
        { label: "Let Stone answer", nextPageId: "p07_stone_gentle" }
      ], ["pip", "stone", "marsh", "quiet"]),
      moonwoodPage(pipStoneFolder, "p06_stone_bends", ["Stone bent down carefully.", "Stone was enormous.", "The thing on the stone was not."], "Who should speak?", [
        { label: "Look closer", nextPageId: "p06_mossy_stone" },
        { label: "Let Pip speak", nextPageId: "p07_pip_speaks" }
      ], ["stone", "pip"]),
      moonwoodPage(pipStoneFolder, "p06_mossy_stone", ["On a mossy stone sat a tiny toadling.", "Its mouth was very wide.", "All the loud noise had come from it."], "What should they do?", [
        { label: "Pip asks why", nextPageId: "p07_pip_speaks" },
        { label: "Stone kneels down", nextPageId: "p07_stone_gentle" }
      ], ["toadling", "loud", "pip", "stone"]),
      moonwoodPage(pipStoneFolder, "p07_pip_speaks", ["\"Why were you shouting?\" asked Pip.", "\"I am lost,\" said the toadling.", "\"I was calling my family.\""], "How can they help?", [
        { label: "Help call louder", nextPageId: "p08_stone_calls" },
        { label: "Search the marsh", nextPageId: "p08_search_family" }
      ], ["pip", "toadling", "lost", "family", "help", "marsh"]),
      moonwoodPage(pipStoneFolder, "p07_stone_gentle", ["Stone knelt down very slowly.", "\"We will help,\" said Stone.", "The toadling looked at Stone's hands."], "How should Stone help?", [
        { label: "Stone carries the toadling", nextPageId: "p08_stone_carries" },
        { label: "Stone calls out", nextPageId: "p08_stone_calls" }
      ], ["stone", "toadling", "help", "gentle"]),
      moonwoodPage(pipStoneFolder, "p08_search_family", ["They searched near the reeds.", "They searched near the dark water.", "The toadling looked smaller and smaller."], "What should they try?", [
        { label: "Use Stone's loud voice", nextPageId: "p08_stone_calls" },
        { label: "Climb higher to listen", nextPageId: "p09_pip_listens" }
      ], ["stone", "loud", "toadling", "family"]),
      moonwoodPage(pipStoneFolder, "p08_stone_carries", ["Stone opened both hands.", "The toadling sat in Stone's palms.", "\"You are very large,\" said the toadling."], "What should Stone do?", [
        { label: "Stone is gentle", nextPageId: "p08_stone_calls" },
        { label: "Pip walks beside them", nextPageId: "p09_pip_listens" }
      ], ["stone", "toadling", "gentle", "pip"]),
      moonwoodPage(pipStoneFolder, "p08_stone_calls", ["Stone stood tall.", "Stone called across the marsh.", "It was louder than the toadling.", "Much louder."], "What should they do?", [
        { label: "Listen for an answer", nextPageId: "p09_answer_far_side" },
        { label: "Too loud! Cover ears", nextPageId: "p09_pip_covers_ears" }
      ], ["stone", "marsh", "toadling", "loud"]),
      moonwoodPage(pipStoneFolder, "p09_pip_listens", ["Pip climbed on a root.", "He listened hard.", "Far away, something answered."], "What next?", [
        { label: "Go toward the answer", nextPageId: "p10_family_found" },
        { label: "Ask Stone to call again", nextPageId: "p08_stone_calls" }
      ], ["pip", "stone", "family"]),
      moonwoodPage(pipStoneFolder, "p09_answer_far_side", ["Something answered from the far side.", "The toadling sat up.", "\"That is them!\" it said."], "What should they do?", [
        { label: "Take the toadling home", nextPageId: "p10_family_found" },
        { label: "Let the toadling call back", nextPageId: "p09_toadling_calls" }
      ], ["toadling", "home", "family"]),
      moonwoodPage(pipStoneFolder, "p09_pip_covers_ears", ["Pip covered both ears.", "Stone looked sorry.", "The toadling looked very happy."], "What should Stone do?", [
        { label: "Listen for family", nextPageId: "p09_answer_far_side" },
        { label: "Stone calls softer", nextPageId: "p09_soft_call" }
      ], ["pip", "stone", "toadling", "family"]),
      moonwoodPage(pipStoneFolder, "p09_toadling_calls", ["The toadling opened its mouth.", "A huge sound came out again.", "This time, it sounded happy."], "What should they do?", [
        { label: "Follow the happy sound", nextPageId: "p10_family_found" },
        { label: "Stone helps too", nextPageId: "p08_stone_calls" }
      ], ["toadling", "stone", "help"]),
      moonwoodPage(pipStoneFolder, "p09_soft_call", ["Stone tried a softer call.", "It was still very loud.", "But it worked."], "What should they do?", [
        { label: "Follow the answer", nextPageId: "p10_family_found" },
        { label: "Laugh quietly", nextPageId: "p11_back_home" }
      ], ["stone", "loud", "quiet"]),
      moonwoodPage(pipStoneFolder, "p10_family_found", ["At the far side of the marsh, small eyes blinked.", "More toadlings hopped out.", "The lost toadling jumped home."], "What should Pip and Stone do?", [
        { label: "Wave goodbye", nextPageId: "p11_back_home" },
        { label: "Ask about the loud noise", nextPageId: "p11_toadling_answer" }
      ], ["marsh", "toadling", "lost", "home", "family"]),
      moonwoodPage(pipStoneFolder, "p11_toadling_answer", ["\"Are you always that loud?\" asked Pip.", "\"Only when lost,\" said the toadling.", "Stone smiled."], "How should it end?", [
        { label: "Go home", nextPageId: "p12_ending_quiet" },
        { label: "Tell everyone", nextPageId: "p12_ending_loud" }
      ], ["pip", "stone", "toadling", "loud", "lost"]),
      moonwoodPage(pipStoneFolder, "p11_back_home", ["Pip and Stone walked back.", "The marsh was quiet now.", "Stone's hand stayed near Pip's shoulder."], "What should they do?", [
        { label: "Tell everyone", nextPageId: "p12_ending_loud" },
        { label: "Keep it secret", nextPageId: "p12_ending_quiet" }
      ], ["pip", "stone", "marsh", "quiet"]),
      moonwoodPage(pipStoneFolder, "p12_ending_loud", ["Back at the Hollow Oak, everyone asked about the loud thing.", "\"Very small,\" said Pip.", "\"Very loud,\" said Stone."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["pip", "stone", "loud"]),
      moonwoodPage(pipStoneFolder, "p12_ending_quiet", ["Pip and Stone sat outside the Hollow Oak again.", "The forest was quiet.", "Stone smiled at the quiet."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["pip", "stone", "quiet"])
    ]
  },
  {
    id: "mw_ra_c_02_fern_wren_walking_garden",
    title: "Fern and Wren: The Walking Garden",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Level C guided reading choice adventure",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Fern", "Wren", "walking plants"],
    location: "Moonwood - Fern's garden, Hollow Oak, Crystal Stream, Burrow's tunnel",
    targetWords: ["Fern", "Wren", "garden", "potion", "plants", "walking", "wrong", "book", "sing", "calm", "home", "fewer"],
    highFrequencyWords: ["and", "the", "said", "was", "were", "looked", "then", "again", "home", "one", "very", "morning"],
    hfw: ["and", "the", "said", "was", "were", "looked", "then", "again", "home", "one", "very", "morning"],
    coverImageUrl: moonwoodImagePath(fernWrenFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      moonwoodPage(fernWrenFolder, "p01_start", ["Fern's garden was her favourite place.", "One morning, Wren arrived with a bubbling cauldron.", "\"I made a potion,\" said Wren."], "What should Fern do?", [
        { label: "Look at the potion", nextPageId: "p02_recipe" },
        { label: "Let Wren try it", nextPageId: "p03_pour_potion" }
      ], ["fern", "wren", "garden", "potion"]),
      moonwoodPage(fernWrenFolder, "p02_recipe", ["Fern read the page.", "GROWING POTION. GREEN. ONE DROP. STIR SLOWLY.", "Wren's potion was purple."], "What should Fern do?", [
        { label: "Trust Wren", nextPageId: "p03_pour_potion" },
        { label: "Check the book again", nextPageId: "p03_wrong_colour" }
      ], ["fern", "wren", "book"], { narrationNeedsRebuild: true }),
      moonwoodPage(fernWrenFolder, "p03_wrong_colour", ["The potion was meant to be green.", "It was more purple.", "Wren did not notice."], "What should happen?", [
        { label: "Fern warns Wren", nextPageId: "p04_fern_warns" },
        { label: "Wren pours it anyway", nextPageId: "p03_pour_potion" }
      ], ["potion", "wren", "fern"]),
      moonwoodPage(fernWrenFolder, "p03_pour_potion", ["Wren poured the potion on the plants.", "The plants stood straight.", "Then one small plant took a step."], "What should they do?", [
        { label: "Follow the small plant", nextPageId: "p04_small_plant" },
        { label: "Look at all the plants", nextPageId: "p04_all_walk" }
      ], ["wren", "potion", "plants", "walking"]),
      moonwoodPage(fernWrenFolder, "p04_fern_warns", ["\"Wren,\" said Fern.", "\"That colour is not right.\"", "The nearest fern stretched one root-foot."], "What should Fern do?", [
        { label: "Stop the potion", nextPageId: "p05_too_late" },
        { label: "Read the book", nextPageId: "p06_wrong_book" }
      ], ["fern", "wren", "potion", "book"]),
      moonwoodPage(fernWrenFolder, "p04_small_plant", ["The smallest plant walked slowly.", "Very slowly.", "It was heading for Burrow's tunnel."], "What should they do?", [
        { label: "Stop the small plant", nextPageId: "p05_tiny_escape" },
        { label: "Call Fern", nextPageId: "p05_fern_calm" }
      ], ["plants", "walking", "fern"]),
      moonwoodPage(fernWrenFolder, "p04_all_walk", ["All the plants began to walk.", "They walked around Fern.", "They walked around Wren.", "Then they went for a stroll."], "What should they do?", [
        { label: "Follow the plants", nextPageId: "p05_garden_empty" },
        { label: "Open the spell book", nextPageId: "p06_wrong_book" }
      ], ["plants", "walking", "fern", "wren", "book"]),
      moonwoodPage(fernWrenFolder, "p05_too_late", ["Fern reached for the cauldron.", "But the roots were already moving.", "The garden had feet."], "How should Fern react?", [
        { label: "Stay calm", nextPageId: "p05_fern_calm" },
        { label: "Panic with Wren", nextPageId: "p05_wren_panic" }
      ], ["fern", "garden", "calm", "wren"]),
      moonwoodPage(fernWrenFolder, "p05_tiny_escape", ["The tiny plant reached Burrow's tunnel.", "It knocked politely.", "No one answered."], "What should they do?", [
        { label: "Carry it back", nextPageId: "p07_sing_softly" },
        { label: "Let it explore", nextPageId: "p06_plants_everywhere" }
      ], ["plants"]),
      moonwoodPage(fernWrenFolder, "p05_fern_calm", ["Fern took one slow breath.", "Wren took three fast ones.", "The plants kept walking."], "What should Fern try?", [
        { label: "Check the books", nextPageId: "p06_wrong_book" },
        { label: "Sing to the plants", nextPageId: "p07_sing_softly" }
      ], ["fern", "wren", "plants", "walking", "calm", "book", "sing"]),
      moonwoodPage(fernWrenFolder, "p05_wren_panic", ["Wren opened MOON SPELLS.", "Then RAIN SPELLS. Then ROOT SPELLS.", "None was the potion book."], "What should Wren do?", [
        { label: "Ask Fern for help", nextPageId: "p05_fern_calm" },
        { label: "Try a fast spell", nextPageId: "p06_fast_spell" }
      ], ["wren", "book", "fern"], { narrationNeedsRebuild: true }),
      moonwoodPage(fernWrenFolder, "p05_garden_empty", ["The garden was almost empty.", "A flowerpot waddled down the path.", "A vine waved politely."], "What should they do?", [
        { label: "Follow the vine", nextPageId: "p06_crystal_stream" },
        { label: "Find the recipe", nextPageId: "p06_wrong_book" }
      ], ["garden", "book"]),
      moonwoodPage(fernWrenFolder, "p06_wrong_book", ["Wren found the problem.", "The open page said MOTION POTION.", "She needed GROWING POTION.", "Fern was very quiet."], "What should they use?", [
        { label: "Use the right book", nextPageId: "p07_book_fix" },
        { label: "Use Fern's song", nextPageId: "p07_sing_softly" }
      ], ["wren", "book", "wrong", "fern", "quiet"], { narrationNeedsRebuild: true }),
      moonwoodPage(fernWrenFolder, "p06_plants_everywhere", ["Plants walked into the Hollow Oak.", "Some went toward the Crystal Stream.", "One sat on a mushroom."], "How can they bring them back?", [
        { label: "Call them home", nextPageId: "p07_sing_softly" },
        { label: "Try Wren's spell", nextPageId: "p07_book_fix" }
      ], ["plants", "walking", "home", "wren"]),
      moonwoodPage(fernWrenFolder, "p06_fast_spell", ["Wren cast a quick spell.", "The plants stopped.", "Then they walked backward.", "That was not better."], "What should they do now?", [
        { label: "Let Fern sing", nextPageId: "p07_sing_softly" },
        { label: "Find the right page", nextPageId: "p07_book_fix" }
      ], ["wren", "plants", "walking", "fern", "sing", "book"]),
      moonwoodPage(fernWrenFolder, "p06_crystal_stream", ["A vine reached the Crystal Stream.", "It looked at the water.", "Then it sat down like it was tired."], "Who can help?", [
        { label: "Ask Dewdrop for help", nextPageId: "p07_dewdrop_laughs" },
        { label: "Sing to the vine", nextPageId: "p07_sing_softly" }
      ], ["plants", "sing"]),
      moonwoodPage(fernWrenFolder, "p07_dewdrop_laughs", ["Dewdrop watched the walking vine.", "\"I have seen stranger,\" she said.", "\"But not today.\""], "What should they do?", [
        { label: "Bring it home", nextPageId: "p08_return_home" },
        { label: "Call all plants", nextPageId: "p07_sing_softly" }
      ], ["walking", "home", "plants"]),
      moonwoodPage(fernWrenFolder, "p07_book_fix", ["Wren found GROWING POTION.", "She read every step carefully.", "Her first try made one plant sneeze."], "What should Wren do?", [
        { label: "Try again", nextPageId: "p08_almost_fixed" },
        { label: "Let Fern try", nextPageId: "p07_sing_softly" }
      ], ["wren", "book", "plants"], { narrationNeedsRebuild: true }),
      moonwoodPage(fernWrenFolder, "p07_sing_softly", ["Fern stood in the clearing.", "She closed her eyes.", "She sang very softly."], "What happens?", [
        { label: "The plants listen", nextPageId: "p08_return_home" },
        { label: "The smallest plant dances", nextPageId: "p08_tiny_dance" }
      ], ["fern", "sing", "plants", "calm"]),
      moonwoodPage(fernWrenFolder, "p08_almost_fixed", ["The plants slowed down.", "One plant sat in the wrong pot.", "Another wore a leaf like a hat."], "What should they do?", [
        { label: "Finish with Fern's song", nextPageId: "p08_return_home" },
        { label: "Accept the silly garden", nextPageId: "p09_silly_garden" }
      ], ["plants", "wrong", "fern", "sing", "garden"]),
      moonwoodPage(fernWrenFolder, "p08_tiny_dance", ["The smallest plant danced in a circle.", "Wren stared.", "Fern kept singing."], "What should they do?", [
        { label: "Let it finish", nextPageId: "p09_tiny_bow" },
        { label: "Call it home", nextPageId: "p08_return_home" }
      ], ["plants", "wren", "fern", "sing", "home"]),
      moonwoodPage(fernWrenFolder, "p08_return_home", ["The plants turned around.", "Slowly, like sleepy creatures, they walked home.", "One by one."], "What should they watch?", [
        { label: "Watch them settle", nextPageId: "p09_plants_settle" },
        { label: "Help the tiny plant", nextPageId: "p09_tiny_bow" }
      ], ["plants", "walking", "home", "help"]),
      moonwoodPage(fernWrenFolder, "p09_plants_settle", ["Each plant found its place.", "The smallest sat down last.", "It made a small happy thump."], "What should happen next?", [
        { label: "Wren apologises", nextPageId: "p10_wren_sorry" },
        { label: "Fern checks the garden", nextPageId: "p10_garden_safe" }
      ], ["plants", "wren", "fern", "garden"]),
      moonwoodPage(fernWrenFolder, "p09_tiny_bow", ["The smallest plant bowed.", "Then it sat in its pot.", "Wren bowed back.", "Fern almost smiled."], "What should they do?", [
        { label: "Wren apologises", nextPageId: "p10_wren_sorry" },
        { label: "Keep the bowing plant", nextPageId: "p10_garden_safe" }
      ], ["plants", "wren", "fern"]),
      moonwoodPage(fernWrenFolder, "p09_silly_garden", ["For a moment, the garden looked silly.", "Then a pot sneezed.", "Fern shook her head."], "What should Fern do?", [
        { label: "Fix it properly", nextPageId: "p08_return_home" },
        { label: "Ask Wren what she learned", nextPageId: "p10_wren_sorry" }
      ], ["garden", "fern", "wren"]),
      moonwoodPage(fernWrenFolder, "p10_wren_sorry", ["\"I am sorry,\" said Wren.", "\"Did you learn something?\" asked Fern.", "\"Yes,\" said Wren.", "\"I need more books.\""], "What should Fern say?", [
        { label: "Fern answers", nextPageId: "p11_fewer_books" },
        { label: "Read again", nextPageId: "p01_start" }
      ], ["wren", "fern", "book"]),
      moonwoodPage(fernWrenFolder, "p10_garden_safe", ["Fern checked each plant.", "Every root was home.", "Every leaf was calm."], "What should Fern do?", [
        { label: "Talk to Wren", nextPageId: "p10_wren_sorry" },
        { label: "End quietly", nextPageId: "p12_ending_calm" }
      ], ["fern", "plants", "home", "calm"]),
      moonwoodPage(fernWrenFolder, "p11_fewer_books", ["\"Fewer,\" said Fern.", "\"Fewer books.\"", "Wren looked at the pile.", "\"That might also work.\""], "Read again?", [
        { label: "Finish", nextPageId: "end" },
        { label: "Read again", nextPageId: "p01_start" }
      ], ["fern", "wren", "fewer", "book"]),
      moonwoodPage(fernWrenFolder, "p12_ending_calm", ["Fern's garden was quiet again.", "Wren put the purple potion away.", "The smallest plant did not move.", "Much."], "Read again?", [
        { label: "Finish", nextPageId: "end" },
        { label: "Read again", nextPageId: "p01_start" }
      ], ["fern", "garden", "wren", "potion", "plants", "calm"])
    ]
  },
  {
    id: "mw_ra_c_03_luna_burrow_star_shell_door",
    title: "Luna and Burrow: The Star Shell Door",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Level C guided reading choice adventure",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Luna", "Burrow", "Pip", "Stone", "Wren"],
    location: "Moonwood - Hollow Oak, Fog Marsh, Crystal Stream, old roots, hidden star room",
    targetWords: lunaBurrowStarShellDoorTargetWords,
    highFrequencyWords: ["and", "the", "said", "was", "were", "looked", "then", "again", "home", "one", "very", "inside"],
    hfw: ["and", "the", "said", "was", "were", "looked", "then", "again", "home", "one", "very", "inside"],
    coverImageUrl: moonwoodImagePath(lunaBurrowStarShellDoorFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p01_start", ["Luna found a star shell under the Hollow Oak.", "Burrow found a tiny map inside it.", "The map had no words."], "What should they try first?", [
        { label: "Hold it to the moon", nextPageId: "p02_moon_map" },
        { label: "Listen to the shell", nextPageId: "p02_shell_song" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p02_moon_map", ["Moonlight touched the map.", "Silver lines appeared.", "One line led to the Fog Marsh.", "One line led to the Crystal Stream."], "Which line should they choose?", [
        { label: "Go to the Fog Marsh", nextPageId: "p03_marsh_path" },
        { label: "Go to the Crystal Stream", nextPageId: "p03_stream_path" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p02_shell_song", ["Burrow held the shell to his ear.", "It hummed softly.", "\"The map is singing,\" said Luna."], "Which hum should they follow?", [
        { label: "Follow the low hum", nextPageId: "p03_root_path" },
        { label: "Follow the bright hum", nextPageId: "p03_stream_path" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p03_marsh_path", ["The Fog Marsh was still and grey.", "A stone bird stood beside the path.", "Its eyes were full of stars."], "What should Luna and Burrow do?", [
        { label: "Ask the stone bird", nextPageId: "p04_bird_riddle" },
        { label: "Walk past quietly", nextPageId: "p04_quiet_mist" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p03_stream_path", ["The Crystal Stream shone blue.", "The map floated above the water.", "Then it split into three silver arrows."], "Which arrow should they follow?", [
        { label: "Follow the arrow upstream", nextPageId: "p04_upstream" },
        { label: "Follow the arrow under the bridge", nextPageId: "p04_bridge_shadow" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p03_root_path", ["The low hum led under old roots.", "Burrow smiled.", "\"This is my kind of path,\" he said."], "Who should help with the roots?", [
        { label: "Let Burrow dig", nextPageId: "p04_burrow_digs" },
        { label: "Call Pip for help", nextPageId: "p04_pip_arrives" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p04_bird_riddle", ["The stone bird opened one eye.", "\"What opens with no key?\" it asked.", "Luna blinked."], "What should they answer?", [
        { label: "Say \"a song\"", nextPageId: "p05_song_answer" },
        { label: "Say \"a door\"", nextPageId: "p05_door_answer" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p04_quiet_mist", ["Luna and Burrow walked quietly.", "The mist moved aside.", "A tiny silver feather fell at Luna's feet."], "What should Luna do?", [
        { label: "Pick up the feather", nextPageId: "p05_feather" },
        { label: "Leave it for the bird", nextPageId: "p05_kind_choice" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p04_upstream", ["Upstream, the water jumped over shining stones.", "Burrow slipped once.", "Luna caught his paw."], "How should they cross?", [
        { label: "Cross the stones", nextPageId: "p05_cross_stones" },
        { label: "Look for another way", nextPageId: "p05_leaf_boat" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p04_bridge_shadow", ["Under the bridge, something glittered.", "It was another star shell.", "But this one was cracked."], "What should Burrow do?", [
        { label: "Take the cracked shell", nextPageId: "p05_cracked_shell" },
        { label: "Leave it and keep looking", nextPageId: "p05_kind_choice" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p04_burrow_digs", ["Burrow dug under the roots.", "His tunnel bumped into something hard.", "A round stone door was hiding underground."], "What should Burrow do?", [
        { label: "Knock on the door", nextPageId: "p06_hidden_door" },
        { label: "Dig around it", nextPageId: "p05_tunnel_wide" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p04_pip_arrives", ["Pip came with a lantern.", "\"I can be brave,\" he said.", "The lantern flickered near the roots."], "Who should lead?", [
        { label: "Let Pip lead", nextPageId: "p05_pip_leads" },
        { label: "Let Burrow lead", nextPageId: "p04_burrow_digs" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_song_answer", ["\"A song,\" said Luna.", "The stone bird smiled.", "It gave Luna a silver note."], "What should Luna do with the note?", [
        { label: "Follow the note", nextPageId: "p06_hidden_door" },
        { label: "Sing to the map", nextPageId: "p06_map_sings" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_door_answer", ["\"A door,\" said Burrow.", "The stone bird shook its head.", "\"Too easy,\" it said."], "What should they try next?", [
        { label: "Try again softly", nextPageId: "p05_song_answer" },
        { label: "Ask Luna to think", nextPageId: "p05_feather" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_feather", ["Luna touched the feather to the map.", "The map became light as air.", "It flew toward the old roots."], "What should they do?", [
        { label: "Follow the flying map", nextPageId: "p06_hidden_door" },
        { label: "Ask Burrow to catch it", nextPageId: "p06_burrow_catches_map" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_kind_choice", ["They did not take what was not theirs.", "The map glowed brighter.", "A new path opened between two roots."], "What should they do?", [
        { label: "Step through the roots", nextPageId: "p06_hidden_door" },
        { label: "Call Wren first", nextPageId: "p06_wren_warning" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_cross_stones", ["The stones were slippery.", "Burrow wobbled.", "Luna spread both wings and balanced him."], "Where should they go?", [
        { label: "Keep crossing", nextPageId: "p06_stream_gate" },
        { label: "Turn back to the roots", nextPageId: "p06_hidden_door" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_leaf_boat", ["They made a boat from a giant leaf.", "It spun in one circle.", "Then it carried them to a small door in the bank."], "What should they do?", [
        { label: "Open the bank door", nextPageId: "p06_stream_gate" },
        { label: "Call for Stone", nextPageId: "p06_stone_helps" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_cracked_shell", ["Burrow picked up the cracked shell.", "The map grew dim.", "\"That shell is not ours,\" said Luna."], "What should Burrow do?", [
        { label: "Put it back", nextPageId: "p05_kind_choice" },
        { label: "Keep it anyway", nextPageId: "p07_wrong_shell" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_tunnel_wide", ["Burrow made the tunnel wider.", "The ground rumbled.", "Stone's sleepy voice came from above."], "What should they do?", [
        { label: "Ask Stone to lift the root", nextPageId: "p06_stone_helps" },
        { label: "Knock before digging more", nextPageId: "p06_hidden_door" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p05_pip_leads", ["Pip held the lantern high.", "The light showed tiny star marks on the roots.", "One mark looked like a door."], "What should Pip do?", [
        { label: "Touch the star mark", nextPageId: "p06_hidden_door" },
        { label: "Follow more star marks", nextPageId: "p06_map_sings" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p06_map_sings", ["The map sang three notes.", "The shell sang three notes back.", "A door appeared in the old roots."], "How should they open it?", [
        { label: "Sing with Luna", nextPageId: "p07_door_opens" },
        { label: "Let Burrow knock", nextPageId: "p06_hidden_door" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p06_burrow_catches_map", ["Burrow jumped and caught the map.", "He landed in a pile of moss.", "The moss laughed."], "What should they do?", [
        { label: "Laugh too", nextPageId: "p07_moss_laughs" },
        { label: "Look for the door", nextPageId: "p06_hidden_door" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p06_wren_warning", ["Wren came running with three books.", "\"Do not open strange doors fast,\" she said.", "Then the smallest book sneezed."], "How should they open it?", [
        { label: "Open it carefully", nextPageId: "p07_door_opens" },
        { label: "Let Wren check first", nextPageId: "p07_wren_checks" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p06_stream_gate", ["The stream door was made of clear crystal.", "Inside it, tiny stars swam like fish.", "Burrow pressed his nose to the glass."], "What should they do?", [
        { label: "Open the crystal gate", nextPageId: "p07_star_fish" },
        { label: "Go back to the root door", nextPageId: "p06_hidden_door" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p06_stone_helps", ["Stone lifted one huge root very gently.", "Under it was a round door.", "\"Small door,\" said Stone.", "\"Big root.\""], "What should they do?", [
        { label: "Thank Stone", nextPageId: "p07_door_opens" },
        { label: "Ask Stone to come too", nextPageId: "p07_stone_too_big" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p06_hidden_door", ["The hidden door was round and small.", "It had no handle.", "Only a shell-shaped hollow."], "How should they open it?", [
        { label: "Place the star shell in the hollow", nextPageId: "p07_door_opens" },
        { label: "Knock three times", nextPageId: "p07_knock_reply" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_wrong_shell", ["The cracked shell did not fit.", "The shell-shaped hollow went dark.", "Burrow looked worried."], "What should Burrow do?", [
        { label: "Return the shell", nextPageId: "p05_kind_choice" },
        { label: "Ask Luna for help", nextPageId: "p07_luna_fixes" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_luna_fixes", ["Luna took one slow breath.", "\"We must return what is not ours,\" she said.", "Burrow nodded and held the cracked shell carefully."], "How should they make it right?", [
        { label: "Return it now", nextPageId: "p05_kind_choice" },
        { label: "Return it together", nextPageId: "p08_sorry_path" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_moss_laughs", ["The moss laughed louder.", "Pip laughed too.", "The hidden door opened just a crack."], "What should they do?", [
        { label: "Peek inside", nextPageId: "p08_star_room" },
        { label: "Wait for Luna", nextPageId: "p07_door_opens" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_wren_checks", ["Wren opened the smallest book.", "The page said KIND HANDS OPEN THIS DOOR.", "Then she dropped the book on her foot."], "What should they do?", [
        { label: "Use kind hands", nextPageId: "p07_door_opens" },
        { label: "Ask the door nicely", nextPageId: "p07_knock_reply" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_star_fish", ["Tiny star fish swam through the crystal gate.", "One carried a golden key.", "But the door had no lock."], "What should they do?", [
        { label: "Follow the star fish", nextPageId: "p08_star_room" },
        { label: "Ask why there is a key", nextPageId: "p08_key_joke" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_stone_too_big", ["Stone knelt beside the tiny door.", "His shoulders were far too wide.", "\"I will guard outside,\" said Stone."], "What should they do?", [
        { label: "Go inside with Luna", nextPageId: "p08_star_room" },
        { label: "Ask Stone to watch the map", nextPageId: "p08_stone_guard" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_knock_reply", ["Burrow knocked three times.", "The door knocked back.", "Burrow jumped behind Luna."], "What should Burrow do?", [
        { label: "Knock again politely", nextPageId: "p08_polite_door" },
        { label: "Use the star shell", nextPageId: "p07_door_opens" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p07_door_opens", ["The star shell clicked into place.", "The hidden door opened.", "Behind it was a room full of soft blue stars."], "What should they do?", [
        { label: "Step inside", nextPageId: "p08_star_room" },
        { label: "Send the map in first", nextPageId: "p08_map_inside" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p08_sorry_path", ["Luna and Burrow carried the cracked shell back to the bridge.", "Burrow put it exactly where he had found it.", "The map glowed with one arrow home and one arrow to the true door."], "Which honest path should they choose?", [
        { label: "Follow it home", nextPageId: "p10_quiet_ending" },
        { label: "Return to the true door", nextPageId: "p07_door_opens" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p08_key_joke", ["\"The key is for my lunch box,\" said the star fish.", "Burrow laughed so hard he sat down."], "What should they do?", [
        { label: "Follow the star fish", nextPageId: "p08_star_room" },
        { label: "Tell Luna the joke", nextPageId: "p09_luna_laughs" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p08_stone_guard", ["Stone held the map outside.", "He held it very carefully.", "Inside, the stars began to move."], "What should Luna do?", [
        { label: "Trust Stone", nextPageId: "p09_star_choice" },
        { label: "Call Stone's name", nextPageId: "p09_echo_room" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p08_polite_door", ["Burrow knocked again.", "\"Please,\" he said.", "The door opened. A tiny star moth sighed inside."], "What should Burrow do?", [
        { label: "Go inside", nextPageId: "p08_star_room" },
        { label: "Ask the star moth why", nextPageId: "p09_door_answer" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p08_map_inside", ["The map flew into the room.", "It landed on a little star table.", "Two paths lit up around it: one blue and one gold."], "Which path should they choose?", [
        { label: "Choose the blue path", nextPageId: "p09_blue_path" },
        { label: "Choose the gold path", nextPageId: "p09_gold_path" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p08_star_room", ["The room was bigger inside than outside.", "Stars floated like bubbles.", "At the centre was a sleeping moon seed."], "What should they do?", [
        { label: "Wake the moon seed", nextPageId: "p09_star_choice" },
        { label: "Let it sleep", nextPageId: "p09_kind_sleep" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_luna_laughs", ["Luna tried not to laugh.", "Then she did.", "The star fish bowed and swam away."], "What should Luna do?", [
        { label: "Look at the moon seed", nextPageId: "p09_star_choice" },
        { label: "Go home smiling", nextPageId: "p10_funny_ending" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_echo_room", ["Luna called Stone's name.", "The room called back, \"Stone, Stone, Stone.\"", "Outside, Stone waved one huge hand."], "What should Luna do?", [
        { label: "Keep going", nextPageId: "p09_star_choice" },
        { label: "Bring back a star for Stone", nextPageId: "p10_stone_star" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_door_answer", ["\"I sigh when people rush,\" said the star moth.", "Burrow sat down.", "\"I do that,\" he said."], "What should Burrow do?", [
        { label: "Promise to slow down", nextPageId: "p09_kind_sleep" },
        { label: "Ask about the moon seed", nextPageId: "p09_star_choice" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_blue_path", ["The blue path showed the Fog Marsh under stars.", "The marsh looked less scary from above."], "What should Luna do?", [
        { label: "Take a star to the marsh", nextPageId: "p10_marsh_light" },
        { label: "Return to Moonwood", nextPageId: "p10_quiet_ending" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_gold_path", ["The gold path showed Hollow Oak.", "Everyone was waiting outside.", "The moon seed glowed brighter."], "What should Luna do?", [
        { label: "Take the moon seed home", nextPageId: "p10_home_seed" },
        { label: "Leave it safe", nextPageId: "p09_kind_sleep" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_kind_sleep", ["Luna did not wake the moon seed.", "Burrow tucked the map beside it.", "The whole room glowed softly."], "How should they leave?", [
        { label: "Go home quietly", nextPageId: "p10_quiet_ending" },
        { label: "Tell Wren everything", nextPageId: "p10_wren_ending" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p09_star_choice", ["The moon seed opened one eye.", "\"Do you need me?\" it asked.", "Luna looked at Burrow."], "What should Luna say?", [
        { label: "Ask it to help Moonwood", nextPageId: "p10_home_seed" },
        { label: "Say it can choose", nextPageId: "p10_free_seed" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_marsh_light", ["They placed one star near the Fog Marsh.", "The mist turned silver.", "Even Burrow thought it looked beautiful."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_stone_star", ["Luna brought one tiny star to Stone.", "Stone held it in both hands.", "\"Small star,\" he whispered."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_home_seed", ["The moon seed floated to Hollow Oak.", "By morning, a small moon flower grew there.", "Burrow said it looked like a lamp."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_free_seed", ["The moon seed stretched and flew outside.", "It chose the tallest branch of Hollow Oak.", "Luna smiled."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_wren_ending", ["Wren wrote the whole adventure in one book.", "Then in three books.", "Then Fern took two books away."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_funny_ending", ["Burrow told everyone about the lunch-box key.", "For three days, Pip checked every fish for pockets."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords),
      moonwoodTargetPage(lunaBurrowStarShellDoorFolder, "p10_quiet_ending", ["Luna and Burrow sat outside Hollow Oak.", "The star shell was quiet now.", "But one tiny arrow on the map flashed."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], lunaBurrowStarShellDoorTargetWords, { narrationNeedsRebuild: true })
    ]
  },
  {
    id: "mw_ra_c_04_dewdrop_flint_lost_glow",
    title: "Dewdrop and Flint: The Lost Glow",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Level C guided reading choice adventure",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Dewdrop", "Flint", "Fern", "Wren", "Pip"],
    location: "Moonwood - Crystal Stream, Deep Dark, Fern's garden, glow cave",
    targetWords: dewdropFlintLostGlowTargetWords,
    highFrequencyWords: ["and", "the", "said", "was", "were", "looked", "then", "again", "with", "one", "very", "home"],
    hfw: ["and", "the", "said", "was", "were", "looked", "then", "again", "with", "one", "very", "home"],
    coverImageUrl: moonwoodImagePath(dewdropFlintLostGlowFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p01_start", ["The Crystal Stream usually glowed at night.", "But tonight it was dark.", "Flint's little lantern blinked once and went out."], "What should they do first?", [
        { label: "Ask Dewdrop what happened", nextPageId: "p02_dewdrop_listens" },
        { label: "Shake the lantern", nextPageId: "p02_flint_shakes" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p02_dewdrop_listens", ["Dewdrop floated close to the water.", "\"The stream is whispering,\" she said.", "Flint held very still."], "What should they do?", [
        { label: "Listen with Dewdrop", nextPageId: "p03_water_whisper" },
        { label: "Search with Flint", nextPageId: "p03_lantern_path" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p02_flint_shakes", ["Flint shook the lantern.", "A tiny spark jumped out.", "It zipped into a bush."], "What should Flint do?", [
        { label: "Catch the spark", nextPageId: "p03_spark_bush" },
        { label: "Call Wren for a spell", nextPageId: "p03_wren_arrives" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p03_water_whisper", ["The water whispered, \"The glow is hiding.\"", "Dewdrop's wings shone pale blue.", "Flint gulped."], "Where should they look?", [
        { label: "Follow the whisper upstream", nextPageId: "p04_upstream_dark" },
        { label: "Look under stepping stones", nextPageId: "p04_under_stones" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p03_lantern_path", ["The lantern pointed toward the Deep Dark.", "It pointed again toward Fern's garden.", "Flint did not like either path."], "Which path should they choose?", [
        { label: "Go toward the Deep Dark", nextPageId: "p04_deep_dark_edge" },
        { label: "Go to Fern first", nextPageId: "p04_fern_garden" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p03_spark_bush", ["The spark landed on Pip's nose.", "Pip sneezed.", "His nose glowed green."], "What should they do?", [
        { label: "Ask Pip to help", nextPageId: "p04_pip_glows" },
        { label: "Take the spark back", nextPageId: "p04_spark_jar" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p03_wren_arrives", ["Wren arrived with WATER SPELLS.", "Then LIGHT SPELLS.", "Then HOW NOT TO DROP BOOKS."], "What should Wren do?", [
        { label: "Try a careful spell", nextPageId: "p04_wren_spell" },
        { label: "Skip the spell and listen", nextPageId: "p03_water_whisper" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_upstream_dark", ["Upstream, the crystals were dull.", "A tiny fish blinked in the dark.", "\"This way,\" it bubbled."], "What should they do?", [
        { label: "Follow the fish", nextPageId: "p05_fish_tunnel" },
        { label: "Ask the fish a question", nextPageId: "p05_fish_answer" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_under_stones", ["Under the stepping stones were scratch marks.", "One stone had a crack shaped like a moon.", "Flint's lantern blinked once."], "What should they do?", [
        { label: "Squeeze into the crack", nextPageId: "p05_crack_path" },
        { label: "Call Stone", nextPageId: "p05_stone_lifts" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_deep_dark_edge", ["The Deep Dark was not empty.", "It rustled.", "It smelled like wet leaves and old secrets."], "What should Flint do?", [
        { label: "Keep going carefully", nextPageId: "p05_shadow_moth" },
        { label: "Turn back to Fern", nextPageId: "p04_fern_garden" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_fern_garden", ["Fern's garden was dim too.", "Fern held one leaf to the air.", "\"The glow passed here,\" she said."], "What should they do?", [
        { label: "Ask where it hides", nextPageId: "p05_fern_clue" },
        { label: "Take Fern with you", nextPageId: "p05_fern_joins" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_pip_glows", ["Pip's nose glowed brighter.", "\"I am a lamp,\" said Pip.", "Then he walked into a mushroom."], "What should they do?", [
        { label: "Let Pip lead", nextPageId: "p05_pip_lamp" },
        { label: "Put the glow in the lantern", nextPageId: "p04_spark_jar" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_spark_jar", ["Flint caught the spark in a little jar.", "The jar shook.", "\"I want water,\" whispered the spark."], "What should Flint do?", [
        { label: "Open it near the water", nextPageId: "p05_spark_water" },
        { label: "Keep it safe", nextPageId: "p05_fern_clue" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p04_wren_spell", ["Wren whispered a careful spell.", "Purple smoke puffed out.", "The smoke made an arrow, then sneezed."], "What should they do?", [
        { label: "Follow the smoke arrow", nextPageId: "p05_smoke_arrow" },
        { label: "Ask Wren to stop", nextPageId: "p05_wren_stops" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_fish_tunnel", ["The fish led them to a water tunnel.", "Dewdrop could float through.", "Flint could not."], "Who should go first?", [
        { label: "Dewdrop goes first", nextPageId: "p06_dewdrop_alone" },
        { label: "Find a dry path", nextPageId: "p06_dry_path" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_fish_answer", ["The fish made three bubbles.", "One showed a cave.", "One showed a moth.", "One showed a crystal."], "Which bubble should they follow?", [
        { label: "Go to the cave", nextPageId: "p06_glow_cave" },
        { label: "Look for the moth", nextPageId: "p05_shadow_moth" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_crack_path", ["Flint tried to squeeze through the crack.", "His lantern got stuck.", "Dewdrop tried not to smile."], "What should Flint do?", [
        { label: "Pull harder", nextPageId: "p06_lantern_pop" },
        { label: "Ask nicely", nextPageId: "p06_crack_opens" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_stone_lifts", ["Stone lifted the stepping stone.", "Under it was a tiny stairway.", "\"Small stairs,\" said Stone."], "What should they do?", [
        { label: "Go down", nextPageId: "p06_glow_cave" },
        { label: "Ask Stone to guard", nextPageId: "p06_stone_guard" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_shadow_moth", ["A shadow moth fluttered past.", "Its feet glowed gold.", "It left tiny sparks on the path."], "What should they do?", [
        { label: "Follow the moth", nextPageId: "p06_moth_path" },
        { label: "Catch it gently", nextPageId: "p06_moth_caught" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_fern_clue", ["Fern found a leaf with glowing edges.", "\"It hides where no one shouts,\" she said."], "Where should they go?", [
        { label: "To the quiet cave", nextPageId: "p06_glow_cave" },
        { label: "To the quietest tree", nextPageId: "p06_quiet_tree" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_fern_joins", ["Fern joined them with a basket of soft leaves.", "\"For nervous glowing things,\" she said."], "Where should they go?", [
        { label: "Return to the stream", nextPageId: "p05_spark_water" },
        { label: "Check the cave", nextPageId: "p06_glow_cave" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_pip_lamp", ["Pip led the way.", "He tripped on a mushroom.", "The mushroom began to glow too."], "What should they do?", [
        { label: "Help Pip up", nextPageId: "p06_pip_mushroom" },
        { label: "Follow the blue light", nextPageId: "p06_glow_cave" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_spark_water", ["The spark touched the water.", "It became a little glowing fish.", "Then it swam away."], "What should they do?", [
        { label: "Follow underwater", nextPageId: "p06_dewdrop_alone" },
        { label: "Ask where it went", nextPageId: "p06_water_answer" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_smoke_arrow", ["The smoke arrow pointed down.", "Then it curled into a tiny shovel shape.", "Burrow would have liked that."], "What should they do?", [
        { label: "Dig carefully", nextPageId: "p06_crack_opens" },
        { label: "Ask Burrow to dig", nextPageId: "p06_burrow_dig" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p05_wren_stops", ["Wren shut the spell book.", "The smoke turned into a question mark.", "\"That is not helpful,\" said Wren."], "What should they do?", [
        { label: "Follow the question mark", nextPageId: "p06_question_path" },
        { label: "Try listening", nextPageId: "p03_water_whisper" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_dewdrop_alone", ["Dewdrop floated through the water tunnel.", "She found a broken crystal on the stream floor.", "It was too heavy to lift alone."], "What should Dewdrop do?", [
        { label: "Try to lift it", nextPageId: "p07_heavy_crystal" },
        { label: "Call Flint", nextPageId: "p07_water_call" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_dry_path", ["Flint found a dry path beside the stream.", "It was low and narrow.", "His lantern scraped the roof."], "What should Flint do?", [
        { label: "Crawl through", nextPageId: "p07_dry_crawl" },
        { label: "Send the lantern first", nextPageId: "p07_lantern_rolls" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_glow_cave", ["Inside the quiet cave was the missing glow.", "It curled like a sleeping kitten.", "The stream waited outside."], "What should they do?", [
        { label: "Wake it gently", nextPageId: "p07_glow_wakes" },
        { label: "Let it sleep", nextPageId: "p07_glow_sleeps" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_lantern_pop", ["Pop!", "The lantern came free.", "Flint fell into a puddle.", "The puddle glowed."], "What should Flint do?", [
        { label: "Laugh", nextPageId: "p07_puddle_laugh" },
        { label: "Check the lantern", nextPageId: "p07_lantern_crack" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_crack_opens", ["The crack opened wider.", "Inside were silver footprints.", "They led under the stream."], "What should they do?", [
        { label: "Follow the footprints", nextPageId: "p06_glow_cave" },
        { label: "Ask who made them", nextPageId: "p07_footprint_voice" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_stone_guard", ["Stone stood beside the stairway.", "A frog sat on Stone's foot.", "Stone looked very serious."], "What should they do?", [
        { label: "Go down", nextPageId: "p06_glow_cave" },
        { label: "Help Stone", nextPageId: "p07_frog_guard" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_moth_path", ["The moth looped around an old stump.", "Behind it was a hidden cave.", "The cave was very quiet."], "What should they do?", [
        { label: "Enter the cave", nextPageId: "p06_glow_cave" },
        { label: "Thank the moth", nextPageId: "p07_moth_thanks" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_moth_caught", ["Flint held the moth very gently.", "The moth tapped his hand.", "It pointed to the cave."], "What should Flint do?", [
        { label: "Let it go", nextPageId: "p06_moth_path" },
        { label: "Carry it carefully", nextPageId: "p07_moth_lantern" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_quiet_tree", ["The quietest tree had glowing roots.", "The roots hummed like faraway bees.", "Dewdrop listened."], "What should they do?", [
        { label: "Look under the roots", nextPageId: "p06_glow_cave" },
        { label: "Call Fern", nextPageId: "p07_fern_song" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_pip_mushroom", ["Pip stood up.", "Now his ears glowed too.", "\"I am more lamp,\" said Pip."], "What should they do?", [
        { label: "Use Pip as a lamp", nextPageId: "p07_pip_lamp_big" },
        { label: "Ask Pip to sit still", nextPageId: "p07_pip_sits" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_water_answer", ["The water whispered again.", "\"The glow is scared of loud feet.\"", "Flint looked at his boots."], "What should Flint do?", [
        { label: "Walk softly", nextPageId: "p07_soft_feet" },
        { label: "Float with Dewdrop", nextPageId: "p06_dewdrop_alone" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_burrow_dig", ["Burrow came and dug three tunnels.", "One tunnel led to the cave.", "One tunnel led to a waiting room."], "Which tunnel should they take?", [
        { label: "Take the first tunnel", nextPageId: "p06_glow_cave" },
        { label: "Visit the waiting room", nextPageId: "p07_waiting_room" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p06_question_path", ["A glow shaped like a question mark floated to a tiny door.", "The plain door had no handle.", "The little question-glow looked worried."], "What should they do?", [
        { label: "Open the door", nextPageId: "p07_tiny_door" },
        { label: "Ask the question-glow", nextPageId: "p07_door_question" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_heavy_crystal", ["Dewdrop pushed the heavy crystal.", "It moved one tiny bit.", "Then it stopped."], "What should she do?", [
        { label: "Push again", nextPageId: "p08_crystal_moves" },
        { label: "Ask Flint", nextPageId: "p08_team_pull" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_water_call", ["Dewdrop called Flint's name.", "Bubbles carried it up.", "Flint heard, \"Flint, flint, help!\""], "What should Flint do?", [
        { label: "Reach down", nextPageId: "p08_team_pull" },
        { label: "Lower the lantern", nextPageId: "p08_lantern_light" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_dry_crawl", ["Flint crawled through the dry path.", "He found Dewdrop and the crystal.", "His knees were dusty."], "What should Flint do?", [
        { label: "Help Dewdrop", nextPageId: "p08_team_pull" },
        { label: "Look for another crystal", nextPageId: "p08_two_crystals" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_lantern_rolls", ["The lantern rolled through the path.", "It stopped beside the sleeping glow.", "The glow woke with a squeak."], "What should Flint do?", [
        { label: "Speak softly", nextPageId: "p08_sorry_glow" },
        { label: "Pick up the lantern", nextPageId: "p07_glow_wakes" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_glow_wakes", ["The glow opened one bright eye.", "\"Is the stream safe?\" it asked.", "Dewdrop nodded slowly."], "What should Dewdrop say?", [
        { label: "Promise it is safe", nextPageId: "p08_safe_promise" },
        { label: "Ask why it was scared", nextPageId: "p08_glow_story" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_glow_sleeps", ["They waited.", "Flint hummed very quietly.", "The glow stretched one tiny ray."], "What should they do?", [
        { label: "Wait quietly", nextPageId: "p08_quiet_wait" },
        { label: "Sing with Dewdrop", nextPageId: "p08_water_song" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_puddle_laugh", ["Flint laughed.", "The puddle made a glowing bubble.", "The bubble floated toward the cave."], "What should they do?", [
        { label: "Follow the bubble", nextPageId: "p06_glow_cave" },
        { label: "Fix the lantern", nextPageId: "p07_lantern_crack" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_lantern_crack", ["The lantern had a tiny crack.", "Inside it was a hiding light.", "\"Too noisy,\" whispered the light."], "What should Flint do?", [
        { label: "Open the lantern", nextPageId: "p08_lantern_light" },
        { label: "Speak gently", nextPageId: "p08_safe_promise" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_footprint_voice", ["A small voice said, \"I am behind the crystal.\"", "Dewdrop saw a soft gold glow.", "It did not come out."], "What should Dewdrop do?", [
        { label: "Invite it out", nextPageId: "p08_safe_promise" },
        { label: "Ask why it hid", nextPageId: "p08_glow_story" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_frog_guard", ["The frog croaked.", "Stone nodded.", "\"Guard frog,\" said Stone.", "The frog looked proud."], "What should they do?", [
        { label: "Leave Stone guarding", nextPageId: "p06_glow_cave" },
        { label: "Bring the frog", nextPageId: "p08_frog_ending_path" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_moth_thanks", ["The moth tapped Flint's nose.", "It left one silver spot there.", "Pip would have liked that."], "What should Flint do?", [
        { label: "Enter the cave", nextPageId: "p06_glow_cave" },
        { label: "Follow the silver spot", nextPageId: "p08_two_crystals" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_moth_lantern", ["The moth sat on the lantern.", "Now the lantern glowed gold.", "Flint smiled."], "What should they do?", [
        { label: "Enter the cave", nextPageId: "p06_glow_cave" },
        { label: "Use the silver lantern", nextPageId: "p08_lantern_light" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_fern_song", ["Fern sang to the roots.", "The roots opened a little door.", "Dewdrop heard water inside."], "What should they do?", [
        { label: "Sing softly", nextPageId: "p08_water_song" },
        { label: "Let Flint speak", nextPageId: "p08_safe_promise" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_pip_lamp_big", ["Pip's glow lit up five wrong paths.", "Pip looked proud.", "\"I found too many ways,\" he said."], "Which path should they take?", [
        { label: "Take the quiet path", nextPageId: "p06_glow_cave" },
        { label: "Take the shiny path", nextPageId: "p08_two_crystals" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_pip_sits", ["Pip sat still.", "The glow on his nose pointed like a small arrow.", "It pointed to the cave."], "What should they do?", [
        { label: "Go to the cave", nextPageId: "p06_glow_cave" },
        { label: "Thank Pip", nextPageId: "p08_pip_proud" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_soft_feet", ["Flint walked softly.", "His boots made no thumps.", "The dark stream shimmered."], "What should Flint do?", [
        { label: "Keep walking softly", nextPageId: "p08_safe_promise" },
        { label: "Call Dewdrop", nextPageId: "p08_team_pull" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_waiting_room", ["The waiting room had two tiny chairs.", "A little glow slept on one chair.", "Its tiny snores lit the room."], "What should they do?", [
        { label: "Sit and wait", nextPageId: "p08_quiet_wait" },
        { label: "Call the glow", nextPageId: "p08_safe_promise" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_tiny_door", ["The tiny door opened onto a tiny stage.", "A glow stood there, looking shy.", "It bowed."], "What should they do?", [
        { label: "Clap softly", nextPageId: "p08_glow_story" },
        { label: "Ask it to come home", nextPageId: "p08_safe_promise" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p07_door_question", ["Dewdrop asked, \"What question do you need?\"", "The question-glow smiled and pointed to the plain door.", "\"That one,\" it said."], "What should Dewdrop do?", [
        { label: "Step inside", nextPageId: "p06_glow_cave" },
        { label: "Ask another question", nextPageId: "p08_glow_story" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_crystal_moves", ["The crystal moved aside.", "Bright water rushed around its edges.", "The stream began to glow at the tips."], "What should they do?", [
        { label: "Move it all the way", nextPageId: "p09_stream_returns" },
        { label: "Call everyone", nextPageId: "p09_everyone_helps" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_team_pull", ["Flint pulled.", "Dewdrop pushed.", "The crystal slid with a soft chiming sound."], "What should they do?", [
        { label: "Put it back correctly", nextPageId: "p09_stream_returns" },
        { label: "Take it to Fern", nextPageId: "p09_fern_repairs" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_lantern_light", ["The lantern filled with shy light.", "It did not want to be shaken.", "Flint held it carefully."], "What should Flint do?", [
        { label: "Guide it home", nextPageId: "p09_stream_returns" },
        { label: "Let it choose", nextPageId: "p09_glow_chooses" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_two_crystals", ["There were two crystals.", "One was bright and loud.", "One was quiet and warm."], "Which crystal should they choose?", [
        { label: "Choose the bright crystal", nextPageId: "p09_bright_wrong" },
        { label: "Choose the quiet crystal", nextPageId: "p09_stream_returns" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_sorry_glow", ["Flint spoke in a soft voice.", "The glow blinked.", "\"No rolling lanterns,\" it whispered."], "What should Flint do?", [
        { label: "Promise", nextPageId: "p08_safe_promise" },
        { label: "Offer the lantern", nextPageId: "p08_lantern_light" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_safe_promise", ["Dewdrop and Flint promised to keep the stream safe.", "The glow uncurled a little.", "It was still shy."], "What should they do?", [
        { label: "Lead it to the water", nextPageId: "p09_stream_returns" },
        { label: "Ask what it needs", nextPageId: "p09_glow_chooses" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_glow_story", ["The glow told its story.", "Too many feet had stomped by the stream.", "So it hid where quiet things sleep."], "What should they do?", [
        { label: "Promise to listen", nextPageId: "p09_stream_returns" },
        { label: "Tell Wren to write a rule", nextPageId: "p09_wren_rule" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_quiet_wait", ["They waited without talking.", "At last, the glow stretched.", "It looked at Flint's lantern."], "What should they do?", [
        { label: "Walk with it", nextPageId: "p09_stream_returns" },
        { label: "Let it choose", nextPageId: "p09_glow_chooses" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_water_song", ["Dewdrop sang a water song.", "The glow hummed along.", "Even Flint's boots seemed quieter."], "What should they do?", [
        { label: "Sing it home", nextPageId: "p09_stream_returns" },
        { label: "Ask Flint to hold the lantern", nextPageId: "p08_lantern_light" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_frog_ending_path", ["The frog croaked three times.", "A tiny sparkle hopped from lily pad to lily pad.", "Stone saluted it."], "What should they do?", [
        { label: "Follow the sparkle", nextPageId: "p09_stream_returns" },
        { label: "Let the frog lead", nextPageId: "p10_frog_ending" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p08_pip_proud", ["Pip smiled so hard his nose got brighter.", "\"I am useful lamp,\" he said.", "The path lit up."], "What should they do?", [
        { label: "Follow Pip's glow", nextPageId: "p09_stream_returns" },
        { label: "Ask Pip to wait", nextPageId: "p10_pip_ending" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p09_fern_repairs", ["Fern tucked the crystal beside the water.", "The stream glowed blue and green.", "\"Better,\" said Fern."], "What should they do?", [
        { label: "Thank Fern", nextPageId: "p10_gentle_ending" },
        { label: "Check the lantern", nextPageId: "p10_lantern_ending" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p09_bright_wrong", ["The bright crystal flashed too much.", "Everyone shut their eyes.", "The glow hid again."], "What should they do?", [
        { label: "Try the quiet crystal", nextPageId: "p09_stream_returns" },
        { label: "Ask Fern for help", nextPageId: "p09_fern_repairs" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p09_everyone_helps", ["Fern, Wren, Pip, Stone, Dewdrop, and Flint moved the crystal together.", "The stream shimmered.", "No one stomped."], "What should happen next?", [
        { label: "Let the stream return", nextPageId: "p09_stream_returns" },
        { label: "Celebrate", nextPageId: "p10_splash_ending" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p09_glow_chooses", ["The glow looked at the stream.", "Then it looked at the quiet cave.", "At last, it chose the water."], "What should they do?", [
        { label: "Walk softly home", nextPageId: "p10_gentle_ending" },
        { label: "Tell Wren the rule", nextPageId: "p09_wren_rule" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p09_wren_rule", ["Wren wrote one clear rule.", "WALK SOFTLY BY THE STREAM.", "Then she added four pages of notes.", "Fern took the pen."], "What should happen next?", [
        { label: "Fern makes it shorter", nextPageId: "p10_wren_ending" },
        { label: "Return to the stream", nextPageId: "p09_stream_returns" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p09_stream_returns", ["The Crystal Stream glowed again.", "Dewdrop floated above it.", "Flint's lantern shone softly, not loudly."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p10_frog_ending", ["The guard frog sat by the stream.", "Stone stood beside it.", "Both looked very important."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p10_pip_ending", ["Pip tried to sit still.", "He wiggled once.", "The stream glowed anyway."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p10_splash_ending", ["Everyone celebrated with one quiet splash.", "Flint laughed.", "Dewdrop made a tiny rainbow."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p10_wren_ending", ["Fern circled the first sentence.", "\"This is all we need.\"", "Wren sighed.", "Then she made a tiny rule book."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords, { narrationNeedsRebuild: true }),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p10_lantern_ending", ["Flint's lantern glowed gently.", "He did not shake it.", "Not even once."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords),
      moonwoodTargetPage(dewdropFlintLostGlowFolder, "p10_gentle_ending", ["The stream kept shining.", "Dewdrop listened to the water.", "Flint walked home softly."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], dewdropFlintLostGlowTargetWords)
    ]
  }
];

export const storyQuests = [
  ...moonwoodStoryQuests,
  ...dinoPalsStoryQuests.filter(quest => activeLegacyDinoPalsStoryQuestIds.has(quest.id)),
  ...dinoPalsV2StoryQuests,
  {
    id: "story_quest_short_a_sam_pam_01",
    title: "Sam and Pam Go Out",
    level: "Early",
    adventureType: "Decodable Story",
    skillFocus: "CVC and Short Vowels",
    cycleFocus: "short a CVC + HFW 1-25",
    characters: ["Sam", "Pam"],
    targetWords: ["Sam", "Pam", "am", "cat", "mat", "bag", "map", "van", "jam"],
    highFrequencyWords: ["I", "am", "you", "go", "to", "the", "see", "can", "we"],
    hfw: ["I", "am", "you", "go", "to", "the", "see", "can", "we"],
    coverImageUrl: samPamImagePath(1),
    wordCards: ["bag", "cat", "jam", "map", "mat", "van"].map(word => ({
      word,
      imageUrl: samPamWordImagePath(word)
    })),
    startPageId: "page-01",
    pages: [
      {
        id: "page-01",
        text: ["I am Sam.", "I see Pam.", "We can plan a picnic."],
        imageUrl: samPamImagePath(1),
        audioUrl: samPamAudioPath(1),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they check first?",
        skillTags: ["short_a", "hfw_1_25", "sam", "pam"],
        choices: [
          { label: "Check the map", nextPageId: "page-02" },
          { label: "See the cat", nextPageId: "page-03" }
        ]
      },
      {
        id: "page-02",
        text: ["The van is parked.", "Dad has the map.", "Sam can help plan."],
        imageUrl: samPamImagePath(2),
        audioUrl: samPamAudioPath(2),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they do next?",
        skillTags: ["short_a", "van", "map"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-04" },
          { label: "Trace the path", nextPageId: "page-05" }
        ]
      },
      {
        id: "page-03",
        text: ["Pam can see the cat.", "The cat sits on the mat by the bag.", "Pam lets the cat sniff her hand."],
        imageUrl: samPamImagePath(3),
        audioUrl: samPamAudioPath(3),
        narrationNeedsRebuild: true,
        choicePrompt: "What should Pam do?",
        skillTags: ["short_a", "cat", "mat"],
        choices: [
          { label: "Pat the cat gently", nextPageId: "page-05" },
          { label: "Check the bag", nextPageId: "page-04" }
        ]
      },
      {
        id: "page-04",
        text: ["Sam has the bag.", "Pam puts a sealed jar of jam in the bag."],
        imageUrl: samPamImagePath(4),
        audioUrl: samPamAudioPath(4),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they pack next?",
        skillTags: ["short_a", "bag", "jam"],
        choices: [
          { label: "Add the cat snack", nextPageId: "page-07" },
          { label: "Take the bag to the mat", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-05",
        text: ["Pam has the map.", "The cat pats the park on the map.", "Sam laughs."],
        imageUrl: samPamImagePath(5),
        audioUrl: samPamAudioPath(5),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they do?",
        skillTags: ["short_a", "map", "cat"],
        choices: [
          { label: "Check that park", nextPageId: "page-06" },
          { label: "Pack the food", nextPageId: "page-04" }
        ]
      },
      {
        id: "page-06",
        text: ["Sam and Pam set the map on the mat.", "The cat sits beside them.", "A red star marks the park."],
        imageUrl: samPamImagePath(6),
        audioUrl: samPamAudioPath(6),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they check?",
        skillTags: ["short_a", "mat", "cat"],
        choices: [
          { label: "Pack jam and a cat snack", nextPageId: "page-07" },
          { label: "Check the path with Dad", nextPageId: "page-08" }
        ]
      },
      {
        id: "page-07",
        text: ["Sam can see the jam.", "Pam packs a cat snack too.", "The jam jar is shut tight."],
        imageUrl: samPamImagePath(7),
        audioUrl: samPamAudioPath(7),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they do next?",
        skillTags: ["short_a", "jam", "cat"],
        choices: [
          { label: "Zip the bag", nextPageId: "page-09" },
          { label: "Check the map", nextPageId: "page-08" }
        ]
      },
      {
        id: "page-08",
        text: ["Pam can see the map.", "Sam can see the van.", "Dad checks the path to the park."],
        imageUrl: samPamImagePath(8),
        audioUrl: samPamAudioPath(8),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they do next?",
        skillTags: ["short_a", "map", "van"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-07" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-09",
        text: ["Sam and Pam go to the van.", "Dad clips the cat carrier in place."],
        imageUrl: samPamImagePath(9),
        audioUrl: samPamAudioPath(9),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they do before Dad drives?",
        skillTags: ["short_a", "van", "cat"],
        choices: [
          { label: "Buckle up", nextPageId: "page-10" },
          { label: "Check the map once more", nextPageId: "page-08" }
        ]
      },
      {
        id: "page-10",
        text: ["Dad drives the van.", "Sam and Pam sit buckled up.", "The cat is safe in its carrier.", "We can go to the park!"],
        imageUrl: samPamImagePath(10),
        audioUrl: samPamAudioPath(10),
        narrationNeedsRebuild: true,
        choicePrompt: "Read again?",
        skillTags: ["short_a", "sam", "pam", "cat", "van"],
        choices: [
          { label: "Read again", nextPageId: "page-01" },
          { label: "Finish", nextPageId: "end" }
        ]
      }
    ]
  },
  {
    id: "mp_ra_a_01_muddy_splashy_missing_hat",
    title: "Muddy and Splashy: The Missing Hat",
    level: "A",
    adventureType: "Reading Adventure",
    skillFocus: "Level A guided reading choice adventure",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Muddy", "Splashy", "Clucky", "Grumpy"],
    location: "Sunny Meadow Farm - muddy pigpen, duck pond, farmyard, big red barn",
    targetWords: ["Muddy", "Splashy", "hat", "mud", "pond", "pigpen", "wet", "big", "little"],
    highFrequencyWords: ["I", "see", "the", "my", "is", "in", "go", "to", "can", "we", "no", "yes"],
    hfw: ["I", "see", "the", "my", "is", "in", "go", "to", "can", "we", "no", "yes"],
    coverImageUrl: meadowPalsImagePath(muddySplashyFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      meadowPalsPage(muddySplashyFolder, "p01_start", ["Clucky has lost her red hat.", "Muddy is by the mud.", "Splashy is by the pond."], "Where should they search first?", [
        { label: "Search with Muddy", nextPageId: "p02_muddy" },
        { label: "Search with Splashy", nextPageId: "p02_splashy" }
      ], ["muddy", "splashy", "mud", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p02_muddy", ["Muddy looks in the pigpen.", "A red shape peeks from the mud."], "What should Muddy do?", [
        { label: "Check the red shape", nextPageId: "p03_mud_pat" },
        { label: "Ask Splashy to help", nextPageId: "p03_meet_splashy" }
      ], ["muddy", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p02_splashy", ["Splashy looks across the pond.", "A red shape bobs by the reeds."], "What should Splashy do?", [
        { label: "Paddle closer", nextPageId: "p03_water_splash" },
        { label: "Ask Muddy to help", nextPageId: "p03_meet_splashy" }
      ], ["splashy"]),
      meadowPalsPage(muddySplashyFolder, "p03_mud_pat", ["Muddy pats the soft mud.", "The red shape starts to come free."], "What did Muddy find?", [
        { label: "A red-painted stick", nextPageId: "p04_stick" },
        { label: "Clucky's red hat", nextPageId: "p04_hat_found_early" }
      ], ["mud"]),
      meadowPalsPage(muddySplashyFolder, "p04_hat_found_early", ["It is Clucky's hat!", "The hat is muddy and no longer lost."], "What should they do?", [
        { label: "Wash the hat", nextPageId: "p07_wash_hat" },
        { label: "Show Clucky what they found", nextPageId: "p07_clucky_muddy_hat" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p03_water_splash", ["Splashy paddles closer.", "The red shape floats past."], "What is floating?", [
        { label: "A leaf", nextPageId: "p04_leaf" },
        { label: "Clucky's red hat", nextPageId: "p04_hat_found_early" }
      ], ["wet", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p03_meet_splashy", ["Muddy and Splashy meet by the barn.", "They agree to search together."], "Where should they look?", [
        { label: "Look in the mud", nextPageId: "p04_mud_search" },
        { label: "Look by the pond", nextPageId: "p04_pond_search" }
      ], ["muddy", "splashy", "mud", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p04_stick", ["It is not the hat.", "It is a red-painted stick."], "Where should Muddy search next?", [
        { label: "Go to the pond", nextPageId: "p04_pond_search" },
        { label: "Call Splashy", nextPageId: "p03_meet_splashy" }
      ], ["hat", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p04_leaf", ["It is not the hat.", "It is a bright red leaf."], "Where should Splashy search next?", [
        { label: "Go to the mud", nextPageId: "p04_mud_search" },
        { label: "Call Muddy", nextPageId: "p03_meet_splashy" }
      ], ["hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p04_mud_search", ["They search the big muddy pigpen.", "Something is stuck under the mud."], "What do they pull free?", [
        { label: "Pull a boot", nextPageId: "p05_boot" },
        { label: "Pull the hat", nextPageId: "p06_hat_muddy" }
      ], ["mud", "big", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p04_pond_search", ["They search beside the pond reeds.", "Something moves near a lily pad."], "What do they see?", [
        { label: "A frog", nextPageId: "p05_frog" },
        { label: "The hat", nextPageId: "p06_hat_wet" }
      ], ["pond", "wet", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_boot", ["It is Grumpy's old boot.", "It is not Clucky's hat."], "What next?", [
        { label: "Look again", nextPageId: "p06_hat_muddy" },
        { label: "Take the boot to Grumpy", nextPageId: "p05_grumpy_boot" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_frog", ["It is a little green frog.", "It is not Clucky's hat."], "What next?", [
        { label: "Look again", nextPageId: "p06_hat_wet" },
        { label: "Ask the frog", nextPageId: "p05_frog_ask" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_grumpy_boot", ["\"My boot!\" says Grumpy.", "He saw a red hat bob toward the pond."], "Follow Grumpy's clue?", [
        { label: "Check the mud once more", nextPageId: "p06_hat_muddy" },
        { label: "Go to the pond", nextPageId: "p06_hat_wet" }
      ], ["mud", "pond", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_frog_ask", ["The frog hops toward the reeds.", "Clucky's red hat bobs behind them."], "How should Splashy get it?", [
        { label: "Paddle over gently", nextPageId: "p06_hat_wet" },
        { label: "Make one careful wave", nextPageId: "p06_big_splash" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p06_hat_muddy", ["They find Clucky's hat.", "The red hat is muddy."], "What should they do?", [
        { label: "Wash the hat", nextPageId: "p07_wash_hat" },
        { label: "Show Clucky first", nextPageId: "p07_clucky_muddy_hat" }
      ], ["hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p06_hat_wet", ["They find Clucky's hat.", "The red hat is dripping wet."], "What should they do?", [
        { label: "Dry the hat", nextPageId: "p07_dry_hat" },
        { label: "Show Clucky first", nextPageId: "p07_clucky_wet_hat" }
      ], ["hat", "wet"]),
      meadowPalsPage(muddySplashyFolder, "p06_big_splash", ["Splashy makes one careful wave.", "The hat floats toward the bank."], "Who catches it?", [
        { label: "Muddy catches it by the mud", nextPageId: "p06_hat_muddy" },
        { label: "Clucky catches it by the path", nextPageId: "p07_clucky_wet_hat" }
      ], ["splashy", "hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p07_wash_hat", ["Splashy rinses the mud from the hat.", "The hat is clean but wet."], "Now what?", [
        { label: "Dry it", nextPageId: "p07_dry_hat" },
        { label: "Show Clucky the clean hat", nextPageId: "p07_clucky_wet_hat" }
      ], ["splashy", "hat", "wet"]),
      meadowPalsPage(muddySplashyFolder, "p07_dry_hat", ["Muddy sets the hat in the warm sun.", "Splashy fans it with both wings."], "What happens next?", [
        { label: "The hat dries", nextPageId: "p08_hat_on_clucky" },
        { label: "A breeze lifts the hat", nextPageId: "p08_hat_on_muddy" }
      ], ["muddy", "splashy", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p07_clucky_muddy_hat", ["Clucky sees her red hat.", "\"Thank you! It needs a wash,\" she says."], "What should they do?", [
        { label: "Wash it", nextPageId: "p07_wash_hat" },
        { label: "Try it before washing", nextPageId: "p08_clucky_grumpy" }
      ], ["hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p07_clucky_wet_hat", ["Clucky sees her red hat.", "\"Thank you! It needs to dry,\" she says."], "What should they do?", [
        { label: "Dry it", nextPageId: "p07_dry_hat" },
        { label: "Try it while wet", nextPageId: "p08_clucky_grumpy" }
      ], ["hat", "wet"]),
      meadowPalsPage(muddySplashyFolder, "p08_hat_on_clucky", ["The clean, dry hat is back on Clucky.", "Clucky beams at her friends."], "How should they celebrate?", [
        { label: "Muddy jumps in the mud", nextPageId: "p09_mud_ending" },
        { label: "Splashy jumps in the pond", nextPageId: "p09_pond_ending" }
      ], ["hat", "muddy", "splashy"]),
      meadowPalsPage(muddySplashyFolder, "p08_hat_on_muddy", ["A breeze lands the hat on Muddy.", "Muddy looks very fancy."], "What should Muddy do?", [
        { label: "Give it straight to Clucky", nextPageId: "p08_hat_on_clucky" },
        { label: "Model it once, then give it back", nextPageId: "p09_fancy_muddy_ending" }
      ], ["hat", "muddy"]),
      meadowPalsPage(muddySplashyFolder, "p08_clucky_grumpy", ["Clucky tries the hat too soon.", "A drip and a blob of mud make her frown."], "What will fix it?", [
        { label: "Wash the mud away", nextPageId: "p07_wash_hat" },
        { label: "Dry the clean hat", nextPageId: "p07_dry_hat" }
      ], ["hat", "little", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p09_mud_ending", ["Muddy jumps in the mud.", "Splashy flaps and laughs.", "Clucky waves from the dry path in her hat."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["muddy", "splashy", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p09_pond_ending", ["Splashy jumps in the pond.", "Muddy cheers from the bank.", "Clucky waves from the dry path in her hat."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["splashy", "muddy", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p09_fancy_muddy_ending", ["Muddy models the fancy red hat once.", "Clucky and Splashy laugh.", "Then Muddy gives the hat back to Clucky."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["muddy", "hat"])
    ]
  },
  {
    id: "mp_ra_a_02_shy_cuddly_quiet_adventure",
    title: "Shy and Cuddly: The Quiet Adventure",
    level: "A",
    adventureType: "Reading Adventure",
    skillFocus: "Level A guided reading choice adventure",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Shy", "Cuddly", "Bouncy", "Tiny"],
    location: "Sunny Meadow Farm - big red barn, big oak tree, flower meadow",
    targetWords: ["Shy", "Cuddly", "cat", "hug", "tree", "barn", "sit", "play", "big", "little"],
    highFrequencyWords: ["I", "see", "the", "is", "in", "go", "to", "can", "we", "you", "yes", "no"],
    hfw: ["I", "see", "the", "is", "in", "go", "to", "can", "we", "you", "yes", "no"],
    coverImageUrl: meadowPalsImagePath(shyCuddlyFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      meadowPalsPage(shyCuddlyFolder, "p01_start", ["Shy wants to join the fun.", "Cuddly wants to find a quiet friend."], "Who do you want to help?", [
        { label: "Help Shy", nextPageId: "p02_shy" },
        { label: "Help Cuddly", nextPageId: "p02_cuddly" }
      ], ["shy", "cuddly", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p02_shy", ["Shy waits behind the barn.", "A first step can be little."], "What should Shy try?", [
        { label: "Peek out", nextPageId: "p03_peek" },
        { label: "Listen quietly", nextPageId: "p03_stay_still" }
      ], ["shy", "play"]),
      meadowPalsPage(shyCuddlyFolder, "p02_cuddly", ["Cuddly looks for Shy.", "She wants to offer a quiet game."], "Where should Cuddly look?", [
        { label: "Look by the barn", nextPageId: "p03_barn_look" },
        { label: "Look by the tree", nextPageId: "p03_tree_look" }
      ], ["cuddly", "barn", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p03_peek", ["Shy peeks around the barn.", "Bouncy springs past, then slows down."], "What does Shy do?", [
        { label: "Step back", nextPageId: "p04_hide_again" },
        { label: "Wave a little", nextPageId: "p04_little_wave" }
      ], ["shy", "little"]),
      meadowPalsPage(shyCuddlyFolder, "p03_stay_still", ["Shy listens by the barn.", "Tiny's soft footsteps come near."], "What does Shy do?", [
        { label: "Say hi", nextPageId: "p04_say_hi_tiny" },
        { label: "Share the quiet", nextPageId: "p04_quiet_tiny" }
      ], ["shy", "little"]),
      meadowPalsPage(shyCuddlyFolder, "p03_barn_look", ["Cuddly sees one round ear by the barn.", "She stops several steps away."], "What should Cuddly do?", [
        { label: "Wait quietly", nextPageId: "p04_wait_quietly" },
        { label: "Call gently", nextPageId: "p04_call_shy" }
      ], ["cuddly", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p03_tree_look", ["Cuddly goes to the big tree.", "Its lowest branch is broad and low."], "What should Cuddly do?", [
        { label: "Sit under it", nextPageId: "p04_tree_sit" },
        { label: "Look up", nextPageId: "p04_tree_look_up" }
      ], ["cuddly", "tree", "big", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p04_hide_again", ["Shy steps back.", "Bouncy gives space and rolls one daisy toward the barn."], "Who can wait quietly with Shy?", [
        { label: "Tiny can", nextPageId: "p03_stay_still" },
        { label: "Cuddly can", nextPageId: "p05_cuddly_arrives" }
      ], ["shy"]),
      meadowPalsPage(shyCuddlyFolder, "p04_little_wave", ["Shy gives a little wave.", "Bouncy waves back without coming closer."], "Where will Shy meet Cuddly?", [
        { label: "By the barn", nextPageId: "p05_cuddly_arrives" },
        { label: "By the tree", nextPageId: "p06_go_to_tree" }
      ], ["shy", "little"]),
      meadowPalsPage(shyCuddlyFolder, "p04_say_hi_tiny", ["\"Hi,\" says Shy.", "Tiny tells Shy about a quiet game."], "Where should they go?", [
        { label: "To the tree", nextPageId: "p06_go_to_tree" },
        { label: "To Cuddly", nextPageId: "p05_cuddly_arrives" }
      ], ["shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p04_quiet_tiny", ["Tiny sits nearby without talking.", "Shy relaxes and sits too."], "Who should join the quiet circle?", [
        { label: "Cuddly", nextPageId: "p05_cuddly_arrives" },
        { label: "Bouncy", nextPageId: "p04_little_wave" }
      ], ["shy", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p04_wait_quietly", ["Cuddly sits at a kind distance.", "Shy peeks out and smiles."], "What does Shy choose?", [
        { label: "Sit by Cuddly", nextPageId: "p05_sit_together" },
        { label: "Meet at the tree", nextPageId: "p06_go_to_tree" }
      ], ["cuddly", "shy", "sit", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p04_call_shy", ["Cuddly calls a little too loudly.", "Shy startles, so Cuddly says sorry."], "What helps now?", [
        { label: "Wait quietly", nextPageId: "p04_wait_quietly" },
        { label: "Offer the tree game", nextPageId: "p06_go_to_tree" }
      ], ["cuddly", "shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p04_tree_sit", ["Cuddly sits under the tree.", "She hears a bird and a tiny rustle."], "What should Cuddly notice first?", [
        { label: "The rustle", nextPageId: "p06_tree_find_shy" },
        { label: "The bird", nextPageId: "p05_bird" }
      ], ["cuddly", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p04_tree_look_up", ["Cuddly looks up.", "Round grey ears peek from the low leaves."], "Who can help Cuddly greet Shy?", [
        { label: "Cuddly can", nextPageId: "p06_tree_find_shy" },
        { label: "Tiny can", nextPageId: "p05_tiny_tree" }
      ], ["cuddly", "shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p05_cuddly_arrives", ["Cuddly comes to the barn.", "\"Would you like quiet company?\" she asks."], "What does Shy choose?", [
        { label: "Sit by Cuddly", nextPageId: "p05_sit_together" },
        { label: "Meet at the tree", nextPageId: "p06_go_to_tree" }
      ], ["cuddly", "shy", "sit", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p05_sit_together", ["Shy sits beside Cuddly.", "Cuddly purrs softly and lets Shy choose."], "What sounds good?", [
        { label: "To the tree", nextPageId: "p06_go_to_tree" },
        { label: "Stay by the barn", nextPageId: "p08_barn_hug" }
      ], ["shy", "cuddly", "sit", "tree", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p05_bird", ["A little bird sings on a high twig.", "Below it, Shy sits on the broad low branch."], "What should Cuddly do?", [
        { label: "Greet Shy", nextPageId: "p06_tree_find_shy" },
        { label: "Listen first", nextPageId: "p04_tree_sit" }
      ], ["shy", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p05_tiny_tree", ["Tiny is under the tree.", "He points to Shy on the broad low branch."], "What now?", [
        { label: "Help Cuddly greet Shy", nextPageId: "p06_tree_find_shy" },
        { label: "Sit with Tiny", nextPageId: "p07_tiny_waits" }
      ], ["shy", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p06_go_to_tree", ["The friends meet at the big tree.", "Its lowest branch is broad and safe."], "Where should they sit?", [
        { label: "Under the tree", nextPageId: "p07_tree_under" },
        { label: "On the low branch", nextPageId: "p07_tree_up" }
      ], ["tree", "big", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p06_tree_find_shy", ["Cuddly spots Shy on the low branch.", "\"May I join you?\" Cuddly asks."], "What does Cuddly do?", [
        { label: "Join after yes", nextPageId: "p07_tree_up" },
        { label: "Wait below", nextPageId: "p07_tree_under" }
      ], ["shy", "cuddly", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p07_tiny_waits", ["Tiny and Cuddly wait below.", "Shy comes down when ready."], "What next?", [
        { label: "Sit together", nextPageId: "p07_tree_under" },
        { label: "Try the low branch", nextPageId: "p07_tree_up" }
      ], ["shy", "cuddly", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p07_tree_under", ["Shy and Cuddly sit under the tree.", "\"Close or a little space?\" Cuddly asks."], "What does Shy choose?", [
        { label: "Ask to sit close", nextPageId: "p08_tree_hug" },
        { label: "A little space", nextPageId: "p08_tree_purr" }
      ], ["shy", "cuddly", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p07_tree_up", ["They sit on the broad low branch.", "The meadow glows around them."], "What does Shy offer?", [
        { label: "Ask for a hug", nextPageId: "p08_tree_hug" },
        { label: "Wave", nextPageId: "p08_wave_from_tree" }
      ], ["shy", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p08_barn_hug", ["\"Would you like a hug?\" Cuddly asks.", "Shy stops to think."], "What does Shy say?", [
        { label: "Yes, please", nextPageId: "p09_soft_hug_ending" },
        { label: "Not yet", nextPageId: "p09_almost_hug_ending" }
      ], ["shy", "cuddly", "hug", "barn"], { narrationNeedsRebuild: true }),
      meadowPalsPage(shyCuddlyFolder, "p08_tree_hug", ["Shy asks, and Cuddly says yes.", "They share one gentle hug."], "What next?", [
        { label: "Happy", nextPageId: "p09_tree_happy_ending" },
        { label: "Rest quietly", nextPageId: "p09_quiet_ending" }
      ], ["shy", "cuddly", "hug", "tree"], { narrationNeedsRebuild: true }),
      meadowPalsPage(shyCuddlyFolder, "p08_tree_purr", ["Cuddly purrs softly from a little way off.", "Shy smiles and relaxes."], "What now?", [
        { label: "Ask for a hug", nextPageId: "p08_tree_hug" },
        { label: "Keep resting", nextPageId: "p09_quiet_ending" }
      ], ["shy", "cuddly", "hug"]),
      meadowPalsPage(shyCuddlyFolder, "p08_wave_from_tree", ["Shy and Cuddly wave from the low branch.", "Tiny and Bouncy wave back below."], "What next?", [
        { label: "Come down", nextPageId: "p09_tree_happy_ending" },
        { label: "Stay and watch", nextPageId: "p09_quiet_ending" }
      ], ["shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p09_soft_hug_ending", ["Shy says yes.", "The soft hug feels just right."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["shy", "hug"]),
      meadowPalsPage(shyCuddlyFolder, "p09_tree_happy_ending", ["Shy and Cuddly come down together.", "They found a quiet way to be friends."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["shy", "cuddly", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p09_quiet_ending", ["No running. No shouting.", "The friends watch the meadow together."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["sit"]),
      meadowPalsPage(shyCuddlyFolder, "p09_almost_hug_ending", ["\"Not yet,\" says Shy.", "Cuddly smiles, and they sit nearby instead."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["hug"], { narrationNeedsRebuild: true })
    ]
  },
  {
    id: "mp_ra_a_03_bouncy_speedy_fast_map",
    title: "Bouncy and Speedy: The Very Fast Map",
    level: "A",
    adventureType: "Reading Adventure",
    skillFocus: "Level A guided reading choice adventure",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Bouncy", "Speedy", "Tiny", "Grumpy"],
    location: "Sunny Meadow Farm - farmyard, barn, duck pond, big hill, big oak tree",
    targetWords: ["Bouncy", "Speedy", "map", "run", "hop", "barn", "pond", "hill", "tree", "fast", "stop"],
    highFrequencyWords: ["I", "am", "go", "to", "the", "see", "can", "we", "you", "is", "no", "yes"],
    hfw: ["I", "am", "go", "to", "the", "see", "can", "we", "you", "is", "no", "yes"],
    coverImageUrl: meadowPalsImagePath(bouncySpeedyFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      meadowPalsPage(bouncySpeedyFolder, "p01_start", ["Bouncy found a map.", "It points to the big tree."], "Who do you help?", [
        { label: "Help Bouncy", nextPageId: "p02_bouncy" },
        { label: "Help Speedy", nextPageId: "p02_speedy" }
      ], ["bouncy", "speedy", "map", "tree"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p02_bouncy", ["You are with Bouncy.", "Bouncy hops with the map."], "Where does Bouncy hop?", [
        { label: "To the barn", nextPageId: "p03_barn" },
        { label: "To the pond", nextPageId: "p03_pond" }
      ], ["bouncy", "hop", "map", "barn", "pond"]),
      meadowPalsPage(bouncySpeedyFolder, "p02_speedy", ["You are with Speedy.", "Speedy runs fast."], "Where does Speedy run?", [
        { label: "To the barn", nextPageId: "p03_barn_fast" },
        { label: "To the hill", nextPageId: "p03_hill_fast" }
      ], ["speedy", "run", "fast", "barn", "hill"]),
      meadowPalsPage(bouncySpeedyFolder, "p03_barn", ["Bouncy hops to the barn.", "Hop, hop, hop."], "What is by the barn?", [
        { label: "A boot", nextPageId: "p04_boot" },
        { label: "Tiny", nextPageId: "p04_tiny_map" }
      ], ["bouncy", "hop", "barn"]),
      meadowPalsPage(bouncySpeedyFolder, "p03_barn_fast", ["Speedy runs to the barn.", "The map flies up."], "What should Speedy grab?", [
        { label: "Grab the map", nextPageId: "p04_map_caught" },
        { label: "Check the boot", nextPageId: "p04_boot" }
      ], ["speedy", "run", "barn", "map"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p03_pond", ["Bouncy hops by the pond.", "One map corner gets wet."], "What should Bouncy do?", [
        { label: "Shake the map", nextPageId: "p04_map_splash" },
        { label: "Ask Splashy", nextPageId: "p04_splashy_help" }
      ], ["bouncy", "hop", "pond", "map"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p03_hill_fast", ["Speedy runs to the hill.", "Very, very fast."], "Can Speedy stop?", [
        { label: "Stop now", nextPageId: "p04_speedy_stops" },
        { label: "Keep going", nextPageId: "p04_too_fast" }
      ], ["speedy", "run", "hill", "fast", "stop"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_boot", ["It is a boot.", "It is not the map."], "Who can help?", [
        { label: "Tiny", nextPageId: "p04_tiny_map" },
        { label: "Grumpy", nextPageId: "p05_grumpy_boot" }
      ], ["map"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_map_caught", ["You caught the map.", "It shows two paths."], "Which path will Speedy take?", [
        { label: "To the pond", nextPageId: "p03_pond" },
        { label: "To the hill", nextPageId: "p03_hill_fast" }
      ], ["map", "speedy", "stop", "pond", "hill"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p04_tiny_map", ["Tiny sees the map.", "Tiny points up."], "Where should they go?", [
        { label: "To the big tree", nextPageId: "p05_big_tree" },
        { label: "To the pond", nextPageId: "p03_pond" }
      ], ["map", "tree", "pond"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_map_splash", ["Bouncy shook the map.", "Splash! Grumpy got wet."], "What should Bouncy do?", [
        { label: "Dry the map", nextPageId: "p05_bouncy_wet" },
        { label: "Say sorry", nextPageId: "p05_grumpy_wet" }
      ], ["bouncy", "map"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p04_splashy_help", ["Splashy spreads the map flat.", "Now they can read it."], "Which way will they go?", [
        { label: "Follow the tree arrow", nextPageId: "p05_big_tree" },
        { label: "Take the mud path", nextPageId: "p05_muddy_map" }
      ], ["map", "tree"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p04_speedy_stops", ["Speedy stopped.", "Bouncy hopped past."], "Follow Bouncy?", [
        { label: "Yes", nextPageId: "p05_big_tree" },
        { label: "No", nextPageId: "p05_speedy_waits" }
      ], ["speedy", "bouncy", "hop", "stop"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_too_fast", ["Speedy went too fast.", "The map flew away."], "Where should Speedy look?", [
        { label: "Look by the tree", nextPageId: "p05_big_tree" },
        { label: "Look by the mud", nextPageId: "p05_muddy_map" }
      ], ["speedy", "fast", "map", "tree"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p05_grumpy_boot", ["Grumpy sees the boot.", "\"That is my boot.\""], "What should they do?", [
        { label: "Ask Grumpy to come", nextPageId: "p05_big_tree" },
        { label: "Leave too fast", nextPageId: "p06_lost_again" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p05_bouncy_wet", ["Bouncy dries the map.", "Bouncy drips in the sun."], "Hop where?", [
        { label: "To the tree", nextPageId: "p05_big_tree" },
        { label: "To the barn", nextPageId: "p03_barn" }
      ], ["bouncy", "hop", "tree", "barn"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p05_grumpy_wet", ["Grumpy is wet.", "The friends say, \"We are sorry.\""], "What should they do?", [
        { label: "Run on", nextPageId: "p06_lost_again" },
        { label: "Help Grumpy dry", nextPageId: "p05_big_tree" }
      ], ["run"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p05_speedy_waits", ["Speedy waits.", "That is new."], "What should Speedy do?", [
        { label: "Wait for Bouncy", nextPageId: "p05_big_tree" },
        { label: "Ask Tiny", nextPageId: "p04_tiny_map" }
      ], ["speedy", "bouncy"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p05_muddy_map", ["The map is in the mud.", "Oh no."], "Who gets it?", [
        { label: "Bouncy", nextPageId: "p06_bouncy_muddy" },
        { label: "Speedy", nextPageId: "p06_speedy_muddy" }
      ], ["map", "bouncy", "speedy"]),
      meadowPalsPage(bouncySpeedyFolder, "p05_big_tree", ["They found the big tree.", "An X marks the roots."], "Will they stop and look?", [
        { label: "Stop and look", nextPageId: "p07_tree_stop" },
        { label: "Rush past", nextPageId: "p06_lost_again" }
      ], ["tree", "map", "stop"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p06_bouncy_muddy", ["Bouncy got the map.", "Bouncy got muddy."], "Is the map okay?", [
        { label: "Yes", nextPageId: "p05_big_tree" },
        { label: "No", nextPageId: "p06_lost_again" }
      ], ["bouncy", "map"]),
      meadowPalsPage(bouncySpeedyFolder, "p06_speedy_muddy", ["Speedy got the map.", "Speedy slid near Grumpy."], "What should Speedy do?", [
        { label: "Take the tree path", nextPageId: "p05_big_tree" },
        { label: "Check on Grumpy", nextPageId: "p05_grumpy_wet" }
      ], ["speedy", "map", "tree"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p06_lost_again", ["They rushed past the tree.", "Now they are lost."], "What can help?", [
        { label: "Ask Tiny", nextPageId: "p04_tiny_map" },
        { label: "Read the map slowly", nextPageId: "p05_big_tree" }
      ], ["stop", "map", "tree"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p07_tree_stop", ["They stopped by the roots.", "The map led them here."], "What do they find?", [
        { label: "The farm", nextPageId: "p08_farm_view" },
        { label: "A snack", nextPageId: "p08_tiny_snack" }
      ], ["stop", "tree", "map"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p08_farm_view", ["They see the farm.", "It is very big."], "Go home?", [
        { label: "Yes", nextPageId: "p09_home_ending" },
        { label: "One more race", nextPageId: "p09_race_ending" }
      ], ["big"]),
      meadowPalsPage(bouncySpeedyFolder, "p08_tiny_snack", ["Tiny brings a small snack.", "Tiny offers to share."], "Share it?", [
        { label: "Yes", nextPageId: "p09_tiny_snack_ending" },
        { label: "No, run home", nextPageId: "p09_home_ending" }
      ], ["run"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p09_home_ending", ["They went home.", "They did not run.", "Well... not much."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["run"]),
      meadowPalsPage(bouncySpeedyFolder, "p09_race_ending", ["Bouncy hopped.", "Speedy ran.", "Both stopped at the barn."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["bouncy", "speedy", "hop", "run"], { narrationNeedsRebuild: true }),
      meadowPalsPage(bouncySpeedyFolder, "p09_tiny_snack_ending", ["Tiny split the snack.", "Each friend had one bite.", "It was just enough."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], [], { narrationNeedsRebuild: true })
    ]
  },
  {
    id: "mp_ra_a_04_brave_tiny_big_little_rescue",
    title: "Brave and Tiny: The Big Little Rescue",
    level: "A",
    adventureType: "Reading Adventure",
    skillFocus: "Level A guided reading choice adventure",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Brave", "Tiny", "Woolly", "Clucky"],
    location: "Sunny Meadow Farm - big barn, stone wall, flower pot, hay bale, little stream",
    targetWords: ["Brave", "Tiny", "big", "little", "up", "down", "in", "on", "pot", "wall", "stream", "help"],
    highFrequencyWords: ["I", "am", "go", "to", "the", "see", "can", "we", "you", "is", "no", "yes", "help"],
    hfw: ["I", "am", "go", "to", "the", "see", "can", "we", "you", "is", "no", "yes", "help"],
    coverImageUrl: meadowPalsImagePath(braveTinyFolder, "p01_start"),
    startPageId: "p01_start",
    pages: [
      meadowPalsPage(braveTinyFolder, "p01_start", ["A gust rushed over the farm.", "Clucky's red hat flew off, and Woolly's bell went missing.", "Brave and Tiny hurried to help."], "Who should lead the search?", [
        { label: "Help Brave", nextPageId: "p02_brave" },
        { label: "Help Tiny", nextPageId: "p02_tiny" }
      ], ["brave", "tiny", "little"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p02_brave", ["Brave spots a red flash near the yard.", "It may be Clucky's hat."], "Where should Brave look first?", [
        { label: "To the pot", nextPageId: "p03_pot" },
        { label: "To the wall", nextPageId: "p03_wall" }
      ], ["brave", "help", "pot", "wall"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p02_tiny", ["Tiny studies the tracks left by the gust.", "He spots a red thread and hears Woolly call."], "Which clue should Tiny follow?", [
        { label: "A stuck hat", nextPageId: "p03_hat" },
        { label: "A sad Woolly", nextPageId: "p03_woolly" }
      ], ["tiny"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p03_pot", ["The empty flower pot is very deep.", "Something red rests at the bottom."], "How should they check it safely?", [
        { label: "Let Brave reach", nextPageId: "p04_hat_in_pot" },
        { label: "Lower Tiny on a string", nextPageId: "p04_tiny_in_pot" }
      ], ["brave", "pot", "big", "in"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p03_wall", ["The stone wall is high, but Brave looks carefully.", "Two red clues sit near the top."], "Which clue should Brave check?", [
        { label: "A feather", nextPageId: "p04_feather" },
        { label: "Clucky", nextPageId: "p04_clucky_wall" }
      ], ["brave", "wall", "big", "on"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p03_hat", ["Tiny follows the red thread.", "Clucky's hat is caught nearby."], "Where should Tiny look?", [
        { label: "In the pot", nextPageId: "p04_hat_in_pot" },
        { label: "On the wall", nextPageId: "p04_hat_on_wall" }
      ], ["tiny", "in", "pot", "on", "wall"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p03_woolly", ["Woolly's red ribbon hangs loose.", "\"The wind shook off my little bell,\" she says."], "Where should they follow the bell's faint jingle?", [
        { label: "Under the wool", nextPageId: "p04_under_wool" },
        { label: "By the stream", nextPageId: "p04_stream" }
      ], ["stream"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_hat_in_pot", ["The hat is in the deep pot.", "Brave leans over the rim, but her little wings cannot reach."], "What should they try?", [
        { label: "Reach together", nextPageId: "p05_hat_found" },
        { label: "Lean a little farther", nextPageId: "p05_brave_stuck" }
      ], ["brave", "in", "pot"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_tiny_in_pot", ["Tiny climbs down a safe knotted string.", "The pot has room for one small mouse."], "What does Tiny lift out?", [
        { label: "A hat", nextPageId: "p05_hat_found" },
        { label: "A bell", nextPageId: "p05_bell_found" }
      ], ["tiny", "in", "pot"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_feather", ["A loose red feather is caught on the wall.", "It is a clue, not the missing hat."], "What should Brave do with it?", [
        { label: "Show Clucky", nextPageId: "p04_clucky_wall" },
        { label: "Carry it carefully", nextPageId: "p05_feather_brave" }
      ], ["brave"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_clucky_wall", ["Clucky peers over the wall.", "\"My hat is caught on the high stones!\" she calls."], "What should they do first?", [
        { label: "Reach for the hat", nextPageId: "p04_hat_on_wall" },
        { label: "Return the feather", nextPageId: "p05_feather_back" }
      ], ["on", "wall"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_hat_on_wall", ["The hat is on the wall.", "It is too high for one little friend."], "Who should try the safe lower stones?", [
        { label: "Tiny", nextPageId: "p05_tiny_climbs" },
        { label: "Brave", nextPageId: "p05_brave_climbs" }
      ], ["tiny", "brave", "on", "wall", "up"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_under_wool", ["A soft curl of Woolly's fleece covers her ribbon.", "Tiny hears a tiny jingle beneath it."], "What is caught there?", [
        { label: "Lift the ribbon curl", nextPageId: "p05_bell_found" },
        { label: "Check the big curl", nextPageId: "p05_brave_in_wool" }
      ], ["tiny", "in"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p04_stream", ["They follow the jingle to the little stream.", "Something glints beside the stepping stones."], "What did the wind leave there?", [
        { label: "The bell", nextPageId: "p05_bell_stream" },
        { label: "A hat", nextPageId: "p03_hat" }
      ], ["stream", "little"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_hat_found", ["They found Clucky's hat.", "The wind cannot snatch it now."], "What should they do?", [
        { label: "Return it to Clucky", nextPageId: "p07_clucky_happy" },
        { label: "Try it once", nextPageId: "p06_hat_on_brave" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_hat_on_brave", ["Brave tries the hat for one silly moment.", "It slides down over her eyes."], "What should Brave do next?", [
        { label: "Return it to Clucky", nextPageId: "p07_clucky_happy" },
        { label: "Ask Clucky first", nextPageId: "p09_fancy_brave_ending" }
      ], ["brave", "big", "on"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_brave_stuck", ["Brave reaches too far and tips into the empty pot.", "She is safe, but she cannot hop out."], "Who has a good rescue idea?", [
        { label: "Tiny", nextPageId: "p06_tiny_helps" },
        { label: "Woolly", nextPageId: "p06_woolly_helps" }
      ], ["brave", "in", "pot"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_bell_found", ["They found Woolly's little bell.", "Its ribbon loop is still strong."], "What should they do?", [
        { label: "Return it to Woolly", nextPageId: "p07_woolly_happy" },
        { label: "Test it softly", nextPageId: "p06_bell_ring" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_feather_brave", ["Brave carries the loose feather to Clucky.", "\"I found this clue,\" she says."], "What should Brave do?", [
        { label: "Ask Clucky", nextPageId: "p09_fancy_brave_ending" },
        { label: "Give it back", nextPageId: "p05_feather_back" }
      ], ["brave"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_feather_back", ["Clucky tucks the loose feather safely away.", "\"Thank you. My hat is still missing,\" she says."], "Which search should continue?", [
        { label: "The hat", nextPageId: "p04_hat_on_wall" },
        { label: "The bell", nextPageId: "p04_under_wool" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_tiny_climbs", ["Tiny follows the wide, low stones.", "Small paws fit the little footholds."], "Can Tiny reach the hat safely?", [
        { label: "Yes", nextPageId: "p05_hat_found" },
        { label: "Not yet", nextPageId: "p06_brave_boost" }
      ], ["tiny", "up"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_brave_climbs", ["Brave hops onto the first low stone.", "The next gap is too wide."], "What should Brave do?", [
        { label: "Step back carefully", nextPageId: "p06_brave_slips" },
        { label: "Ask Tiny for an idea", nextPageId: "p06_brave_boost" }
      ], ["brave", "up", "help"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_brave_in_wool", ["Brave checks beneath a loose curl of fleece.", "The fluffy curl tumbles over her like a blanket."], "Who should lift it?", [
        { label: "Tiny", nextPageId: "p06_tiny_helps" },
        { label: "Woolly", nextPageId: "p06_woolly_laughs" }
      ], ["brave", "in"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p05_bell_stream", ["The bell rests on a flat stone beside the stream.", "Tiny sees a dry path of stepping stones."], "Who should cross?", [
        { label: "Tiny", nextPageId: "p05_bell_found" },
        { label: "Ask Brave", nextPageId: "p06_brave_stream" }
      ], ["tiny", "stream"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_tiny_helps", ["Tiny spots the small step that everyone missed.", "Together, Tiny and Brave reach the lost object."], "What did they find?", [
        { label: "The hat", nextPageId: "p05_hat_found" },
        { label: "The bell", nextPageId: "p05_bell_found" }
      ], ["tiny", "brave"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_woolly_helps", ["Woolly braces the pot with her shoulder.", "It rolls gently onto a soft hay bed, and Brave steps out."], "What else rolled free?", [
        { label: "The hat", nextPageId: "p05_hat_found" },
        { label: "The bell", nextPageId: "p05_bell_found" }
      ], ["pot"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_bell_ring", ["Tiny rings the bell once, very softly.", "Woolly hears it and trots over."], "How should they celebrate finding it?", [
        { label: "Give it back", nextPageId: "p07_woolly_happy" },
        { label: "Make a gentle song", nextPageId: "p09_loud_bell_ending" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_brave_boost", ["Tiny points out one low, wide stone.", "Brave hops up while Tiny guides her from below."], "What can Brave reach?", [
        { label: "The hat", nextPageId: "p05_hat_found" },
        { label: "The feather", nextPageId: "p05_feather_back" }
      ], ["tiny", "brave", "up"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_brave_slips", ["Brave's foot slips from the low stone.", "Plop! She lands in a soft pile of hay."], "What is the safer plan?", [
        { label: "Use Tiny's idea", nextPageId: "p06_brave_boost" },
        { label: "Ask Tiny", nextPageId: "p05_tiny_climbs" }
      ], ["brave", "down"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_woolly_laughs", ["The loose wool tickles Brave, and everyone giggles.", "Woolly lifts the curl while Brave crawls out."], "What tumbles free too?", [
        { label: "The bell", nextPageId: "p05_bell_found" },
        { label: "The hat", nextPageId: "p05_hat_found" }
      ], ["brave"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p06_brave_stream", ["Brave takes one careful step into the shallow stream.", "The current nudges the bell toward Tiny."], "Can they catch it together?", [
        { label: "Catch it together", nextPageId: "p05_bell_found" },
        { label: "Let Tiny guide", nextPageId: "p06_tiny_helps" }
      ], ["brave", "in", "stream"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p07_clucky_happy", ["Clucky gets her red hat back.", "\"Two little friends solved one big problem,\" she says."], "What should the team do now?", [
        { label: "Help Woolly", nextPageId: "p03_woolly" },
        { label: "Finish", nextPageId: "p09_helpful_ending" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p07_woolly_happy", ["Woolly ties the little bell safely to her red ribbon.", "Its gentle jingle makes everyone smile."], "What should the team do now?", [
        { label: "Help Clucky", nextPageId: "p03_hat" },
        { label: "Finish", nextPageId: "p09_helpful_ending" }
      ], [], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p09_fancy_brave_ending", ["Brave returns the clue and asks before keeping it.", "Clucky gives Brave one loose feather as a thank-you.", "A little helper can feel big with pride."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["brave", "big"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p09_loud_bell_ending", ["Woolly taps a gentle beat.", "Brave and Tiny take turns: ring, ring!", "Soon the whole yard is dancing."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["brave"], { narrationNeedsRebuild: true }),
      meadowPalsPage(braveTinyFolder, "p09_helpful_ending", ["Tiny and Brave worked as a team.", "Small paws and little wings solved a big problem.", "Helping together made everyone feel brave."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["tiny", "brave", "little", "help", "big"], { narrationNeedsRebuild: true })
    ]
  }
];

export function getStoryQuestById(id) {
  return storyQuests.find(quest => quest.id === id) || null;
}
