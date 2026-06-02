const samPamMediaVersion = "sam-pam-alf-replacement-20260602";
const samPamImagePath = page => `/images/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.webp?v=${samPamMediaVersion}`;
const samPamAudioPath = page => `/audio/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.mp3?v=${samPamMediaVersion}`;
const samPamWordImagePath = word => `/images/story-quests/sam-pam/words/word-${word}.webp`;

const meadowPalsImagePath = (folder, pageId) => `/images/story-quests/meadow-pals/${folder}/${pageId}.webp`;
const meadowPalsAudioPath = (folder, pageId) => `/audio/story-quests/meadow-pals/${folder}/${pageId}.mp3`;
const dinoPalsImagePath = (folder, pageId) => `/images/story-quests/dino-pals/${folder}/${pageId}.webp`;
const dinoPalsAudioPath = (folder, pageId) => `/audio/story-quests/dino-pals/${folder}/${pageId}.mp3`;
const moonwoodImagePath = (folder, pageId) => `/images/story-quests/moonwood/${folder}/${pageId}.webp`;
const moonwoodAudioPath = (folder, pageId) => `/audio/story-quests/moonwood/${folder}/${pageId}.mp3`;

function meadowPalsPage(folder, id, text, choicePrompt, choices, skillTags = []) {
  return {
    id,
    text,
    imageUrl: meadowPalsImagePath(folder, id),
    audioUrl: meadowPalsAudioPath(folder, id),
    choicePrompt,
    choices,
    skillTags
  };
}

function dinoPalsPage(folder, id, text, choicePrompt, choices, skillTags = []) {
  return {
    id,
    text,
    imageUrl: dinoPalsImagePath(folder, id),
    audioUrl: dinoPalsAudioPath(folder, id),
    choicePrompt,
    choices,
    skillTags
  };
}

function moonwoodPage(folder, id, text, choicePrompt, choices, skillTags = []) {
  return {
    id,
    text,
    imageUrl: moonwoodImagePath(folder, id),
    audioUrl: moonwoodAudioPath(folder, id),
    choicePrompt,
    choices,
    skillTags
  };
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
    mediaFolder: "bossy-picnic-mix-up"
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
    mediaFolder: "zippy-flappy-fast-slow"
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
      dinoPalsPage(chompyLunchFolder, "p03_eat_berries", ["Chompy ate the berries.", "His tummy rumbled again.", "\"More, please!\" he said."], "Is Chompy full?", [
        { label: "Yes?", nextPageId: "p04_not_full" },
        { label: "Nope", nextPageId: "p04_more_food" }
      ], ["chompy", "berries", "more"]),
      dinoPalsPage(chompyLunchFolder, "p03_save_berries", ["Chompy saved some berries.", "That was hard work.", "\"I can share,\" he said."], "Who gets some?", [
        { label: "Sunny", nextPageId: "p04_sunny_shares" },
        { label: "Grumpy", nextPageId: "p04_grumpy_berries" }
      ], ["chompy", "berries", "share"]),
      dinoPalsPage(chompyLunchFolder, "p03_ask_sunny", ["\"I am hungry,\" said Chompy.", "\"I can help,\" said Sunny.", "\"Food is more fun with friends.\""], "What should Sunny bring?", [
        { label: "Fruit", nextPageId: "p04_sunny_shares" },
        { label: "Leaves", nextPageId: "p04_leaf_lunch" }
      ], ["chompy", "sunny", "food"]),
      dinoPalsPage(chompyLunchFolder, "p03_sniff_path", ["Chompy sniffed the path.", "Sniff, sniff, sniff.", "One smell was not food."], "What smell does Chompy follow?", [
        { label: "Berry smell", nextPageId: "p02_berries" },
        { label: "Mud smell", nextPageId: "p04_mud_smell" }
      ], ["chompy", "sniffed", "mud"]),
      dinoPalsPage(chompyLunchFolder, "p04_not_full", ["Chompy was not full.", "His tummy made a little grumble.", "\"That means more lunch,\" he said."], "What next?", [
        { label: "Find leaves", nextPageId: "p04_leaf_lunch" },
        { label: "Find pals", nextPageId: "p05_big_flat_rock" }
      ], ["chompy", "lunch", "more"]),
      dinoPalsPage(chompyLunchFolder, "p04_more_food", ["Chompy wanted more food.", "He wanted an enormous lunch.", "\"Which way?\" he asked."], "Where should Chompy go?", [
        { label: "Big Rock", nextPageId: "p05_big_flat_rock" },
        { label: "Meadow", nextPageId: "p05_long_meadow" }
      ], ["chompy", "enormous", "lunch"]),
      dinoPalsPage(chompyLunchFolder, "p04_sunny_shares", ["Sunny shared her lunch.", "Chompy smiled at the fruit.", "\"Thank you, Sunny.\""], "Eat it all?", [
        { label: "Eat it all", nextPageId: "p06_tummy_big" },
        { label: "Share too", nextPageId: "p05_big_flat_rock" }
      ], ["sunny", "shared", "lunch"]),
      dinoPalsPage(chompyLunchFolder, "p04_grumpy_berries", ["Grumpy saw the berries.", "His tummy grumbled too.", "\"Hmph,\" said Grumpy."], "Does Grumpy want one?", [
        { label: "Yes", nextPageId: "p05_grumpy_tiny_smile" },
        { label: "Hmph no", nextPageId: "p05_big_flat_rock" }
      ], ["grumpy", "berries"]),
      dinoPalsPage(chompyLunchFolder, "p04_leaf_lunch", ["Chompy found a big leaf.", "Crunch!", "\"That leaf was mostly hat,\" he said."], "Did that help?", [
        { label: "A little", nextPageId: "p04_not_full" },
        { label: "Not much", nextPageId: "p05_long_meadow" }
      ], ["chompy", "leaf"]),
      dinoPalsPage(chompyLunchFolder, "p04_mud_smell", ["Chompy found mud.", "The mud was soggy.", "\"Mud is not lunch,\" he said."], "What should Chompy do?", [
        { label: "Step back", nextPageId: "p05_big_flat_rock" },
        { label: "Taste it?", nextPageId: "p05_mud_face" }
      ], ["chompy", "mud", "soggy"]),
      dinoPalsPage(chompyLunchFolder, "p05_mud_face", ["Chompy tasted the mud.", "His face went funny.", "\"No, no, no!\""], "Now what?", [
        { label: "Real food", nextPageId: "p05_big_flat_rock" },
        { label: "Ask Sunny", nextPageId: "p03_ask_sunny" }
      ], ["chompy", "mud"]),
      dinoPalsPage(chompyLunchFolder, "p05_grumpy_tiny_smile", ["Grumpy had one berry.", "He looked surprised.", "Then he almost smiled."], "What does Chompy do?", [
        { label: "Ask more", nextPageId: "p05_big_flat_rock" },
        { label: "Give more", nextPageId: "p06_grumpy_full" }
      ], ["grumpy", "surprised", "berries"]),
      dinoPalsPage(chompyLunchFolder, "p05_big_flat_rock", ["They went to Big Flat Rock.", "Lunch was waiting there.", "\"Enormous lunch!\" said Chompy."], "Who eats first?", [
        { label: "Chompy", nextPageId: "p06_tummy_big" },
        { label: "Everyone", nextPageId: "p06_everyone_eats" }
      ], ["chompy", "rock", "lunch", "enormous"]),
      dinoPalsPage(chompyLunchFolder, "p05_long_meadow", ["Chompy went to Long Meadow.", "The grass tickled his nose.", "Something bounced in the grass."], "What is hiding there?", [
        { label: "Bouncy", nextPageId: "p06_bouncy_lunch" },
        { label: "More food", nextPageId: "p06_tummy_big" }
      ], ["chompy", "bouncy"]),
      dinoPalsPage(chompyLunchFolder, "p06_bouncy_lunch", ["Bouncy bounced in.", "The lunch bounced too.", "\"Oops!\" said Bouncy."], "What flies up?", [
        { label: "Berries", nextPageId: "p07_berry_rain" },
        { label: "Leaves", nextPageId: "p07_leaf_hat" }
      ], ["bouncy", "lunch"]),
      dinoPalsPage(chompyLunchFolder, "p06_tummy_big", ["Chompy ate and ate.", "His tummy got enormous.", "Sunny looked surprised."], "Is Chompy full?", [
        { label: "Yes", nextPageId: "p08_star_ending" },
        { label: "Not yet", nextPageId: "p07_more_please" }
      ], ["chompy", "enormous", "surprised"]),
      dinoPalsPage(chompyLunchFolder, "p06_everyone_eats", ["Everyone shared lunch.", "Chompy had lunch too.", "It felt peaceful."], "What does Chompy say?", [
        { label: "Thank you", nextPageId: "p08_thank_you_ending" },
        { label: "More?", nextPageId: "p07_more_please" }
      ], ["shared", "lunch", "peaceful"]),
      dinoPalsPage(chompyLunchFolder, "p06_grumpy_full", ["Grumpy had more berries.", "His tummy was full.", "\"Not bad,\" he grumbled."], "What about Chompy?", [
        { label: "Full too", nextPageId: "p08_thank_you_ending" },
        { label: "Wants more", nextPageId: "p07_more_please" }
      ], ["grumpy", "grumbled", "berries"]),
      dinoPalsPage(chompyLunchFolder, "p07_berry_rain", ["Berries came down.", "Chompy opened wide.", "Plop, plop, yum!"], "Catch them?", [
        { label: "Yes", nextPageId: "p06_tummy_big" },
        { label: "No", nextPageId: "p08_berry_mess_ending" }
      ], ["chompy", "berries"]),
      dinoPalsPage(chompyLunchFolder, "p07_leaf_hat", ["A leaf landed on Chompy.", "It made a floppy hat.", "\"Not lunch,\" said Sunny."], "Eat the hat?", [
        { label: "Chomp it", nextPageId: "p07_more_please" },
        { label: "Wear it", nextPageId: "p08_leaf_hat_ending" }
      ], ["chompy", "leaf", "lunch"]),
      dinoPalsPage(chompyLunchFolder, "p07_more_please", ["\"More, please!\" said Chompy.", "Sunny laughed softly.", "\"One more, then rest.\""], "What happens next?", [
        { label: "One berry", nextPageId: "p08_star_ending" },
        { label: "No more", nextPageId: "p08_thank_you_ending" }
      ], ["chompy", "more"]),
      dinoPalsPage(chompyLunchFolder, "p08_star_ending", ["That night, Chompy looked up.", "His tummy was quiet.", "\"What is breakfast?\" he whispered."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy"]),
      dinoPalsPage(chompyLunchFolder, "p08_thank_you_ending", ["\"Thank you,\" said Chompy.", "The pals shared the last berry.", "Chompy was full, for now."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "shared"]),
      dinoPalsPage(chompyLunchFolder, "p08_berry_mess_ending", ["The berries went splat.", "Chompy looked at his feet.", "\"Berry boots!\" said Bouncy."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "berries", "bouncy"]),
      dinoPalsPage(chompyLunchFolder, "p08_leaf_hat_ending", ["Chompy kept the leaf hat.", "It was not lunch.", "It was still fun."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["chompy", "leaf"])
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
      dinoPalsPage(sunnyRainyFolder, "p01_start", ["Rain fell on Sunny Hollow.", "Sunny smiled at the dripping trees.", "\"Someone needs help,\" she said."], "Who should Sunny help?", [
        { label: "Grumpy", nextPageId: "p02_grumpy" },
        { label: "Dozy", nextPageId: "p02_dozy" }
      ], ["sunny", "rain", "dripping"]),
      dinoPalsPage(sunnyRainyFolder, "p02_grumpy", ["Grumpy was wet.", "Water dripped from his shell.", "\"Rain is rude,\" he grumbled."], "What should Sunny do?", [
        { label: "Dry rock", nextPageId: "p03_dry_rock" },
        { label: "Puddle", nextPageId: "p03_puddle" }
      ], ["grumpy", "rain", "grumbled"]),
      dinoPalsPage(sunnyRainyFolder, "p02_dozy", ["Dozy was sleepy.", "His pillow was soggy.", "\"My nap is wet,\" he said."], "What should Sunny do?", [
        { label: "Cozy Cave", nextPageId: "p03_cozy_cave" },
        { label: "Puddle", nextPageId: "p03_puddle" }
      ], ["dozy", "soggy"]),
      dinoPalsPage(sunnyRainyFolder, "p03_dry_rock", ["Sunny found Big Flat Rock.", "The rain had splashed it.", "\"Not dry,\" said Grumpy."], "What now?", [
        { label: "Try cave", nextPageId: "p03_cozy_cave" },
        { label: "Try puddle", nextPageId: "p03_puddle" }
      ], ["sunny", "rock", "splashed"]),
      dinoPalsPage(sunnyRainyFolder, "p03_cozy_cave", ["Cozy Cave was dry.", "Dozy hugged his pillow.", "\"This is peaceful,\" he said."], "Who comes in?", [
        { label: "Grumpy", nextPageId: "p04_cave_grumpy" },
        { label: "Wiggly", nextPageId: "p04_wiggly_tail" }
      ], ["cave", "dozy", "peaceful"]),
      dinoPalsPage(sunnyRainyFolder, "p03_puddle", ["Sunny saw a wide puddle.", "Rain dripped from her rainbow horns.", "Sunny smiled."], "Jump in?", [
        { label: "Jump", nextPageId: "p04_splash" },
        { label: "Wait", nextPageId: "p04_wait" }
      ], ["sunny", "puddle", "rainbow"]),
      dinoPalsPage(sunnyRainyFolder, "p04_splash", ["Sunny jumped in.", "Mud splashed up high.", "\"Oops!\" said Sunny."], "Who got splashed?", [
        { label: "Grumpy", nextPageId: "p05_grumpy_splash" },
        { label: "Dozy", nextPageId: "p05_dozy_splash" }
      ], ["sunny", "mud", "splashed"]),
      dinoPalsPage(sunnyRainyFolder, "p04_wait", ["Sunny waited by the puddle.", "Drip, drip, drip went the rain.", "Then footsteps came."], "Who walks by?", [
        { label: "Wiggly", nextPageId: "p04_wiggly_tail" },
        { label: "Honky", nextPageId: "p05_honky_rain" }
      ], ["sunny", "puddle", "rain"]),
      dinoPalsPage(sunnyRainyFolder, "p04_cave_grumpy", ["Grumpy came into the cave.", "His tail was still dripping.", "\"Too drippy,\" he grumbled."], "What helps?", [
        { label: "Leaf roof", nextPageId: "p05_leaf_roof" },
        { label: "Puddle game", nextPageId: "p03_puddle" }
      ], ["grumpy", "dripping", "grumbled"]),
      dinoPalsPage(sunnyRainyFolder, "p04_wiggly_tail", ["Wiggly came by.", "His long tail went swish.", "\"Sorry!\" said Wiggly."], "What did the tail do?", [
        { label: "Made wave", nextPageId: "p05_tail_wave" },
        { label: "Knocked leaf", nextPageId: "p05_leaf_roof" }
      ], ["wiggly"]),
      dinoPalsPage(sunnyRainyFolder, "p05_grumpy_splash", ["Grumpy got splashed.", "He looked surprised.", "\"That was enormous,\" he said."], "Is Grumpy mad?", [
        { label: "A little", nextPageId: "p06_grumpy_smile" },
        { label: "Very", nextPageId: "p06_sorry_grumpy" }
      ], ["grumpy", "splashed", "surprised", "enormous"]),
      dinoPalsPage(sunnyRainyFolder, "p05_dozy_splash", ["Dozy got splashed.", "His eyes popped open.", "\"Was that my nap?\" he asked."], "What does Dozy say?", [
        { label: "Again?", nextPageId: "p06_dozy_again" },
        { label: "Nap now", nextPageId: "p03_cozy_cave" }
      ], ["dozy", "splashed"]),
      dinoPalsPage(sunnyRainyFolder, "p05_honky_rain", ["Honky called, \"RAIN!\"", "His enormous voice shook the leaves.", "Down they fell."], "What happened?", [
        { label: "Leaves fell", nextPageId: "p06_leaf_rain" },
        { label: "Ears covered", nextPageId: "p06_grumpy_ears" }
      ], ["honky", "rain", "enormous"]),
      dinoPalsPage(sunnyRainyFolder, "p05_tail_wave", ["Wiggly's tail made a wave.", "The puddle grew bigger.", "Sunny clapped."], "Jump in?", [
        { label: "Sunny jumps", nextPageId: "p04_splash" },
        { label: "Everyone jumps", nextPageId: "p07_everyone_puddle" }
      ], ["wiggly", "puddle"]),
      dinoPalsPage(sunnyRainyFolder, "p05_leaf_roof", ["The big leaf made a roof.", "No more drip, drip.", "\"Good leaf,\" said Sunny."], "Who sits under it?", [
        { label: "Grumpy", nextPageId: "p06_grumpy_dry" },
        { label: "Dozy", nextPageId: "p06_dozy_dry" }
      ], ["leaf", "sunny"]),
      dinoPalsPage(sunnyRainyFolder, "p06_grumpy_smile", ["Grumpy did not smile.", "Well, not much.", "\"Maybe puddles are fine,\" he said."], "Try again?", [
        { label: "Big splash", nextPageId: "p07_everyone_puddle" },
        { label: "Leaf roof", nextPageId: "p05_leaf_roof" }
      ], ["grumpy", "puddle"]),
      dinoPalsPage(sunnyRainyFolder, "p06_sorry_grumpy", ["\"Sorry,\" said Sunny.", "Grumpy dripped and grumbled.", "\"Help me get dry.\""], "What helps Grumpy?", [
        { label: "Dry leaf", nextPageId: "p05_leaf_roof" },
        { label: "Little splash", nextPageId: "p06_grumpy_smile" }
      ], ["sunny", "grumpy", "grumbled"]),
      dinoPalsPage(sunnyRainyFolder, "p06_dozy_again", ["\"Again?\" said Dozy.", "Sunny splashed softly.", "Dozy giggled."], "What now?", [
        { label: "Everyone joins", nextPageId: "p07_everyone_puddle" },
        { label: "Dozy naps", nextPageId: "p03_cozy_cave" }
      ], ["dozy", "sunny", "splashed"]),
      dinoPalsPage(sunnyRainyFolder, "p06_leaf_rain", ["Leaves came down.", "It was leaf rain.", "Sunny had an idea."], "What can leaves make?", [
        { label: "Roof", nextPageId: "p05_leaf_roof" },
        { label: "Boat", nextPageId: "p07_leaf_boat" }
      ], ["leaf", "rain", "sunny"]),
      dinoPalsPage(sunnyRainyFolder, "p06_grumpy_ears", ["Grumpy covered his ears.", "\"Too loud!\" he said.", "Honky looked sorry."], "What should Honky do?", [
        { label: "Soft voice", nextPageId: "p08_quiet_ending" },
        { label: "Call pals", nextPageId: "p07_everyone_puddle" }
      ], ["grumpy", "honky"]),
      dinoPalsPage(sunnyRainyFolder, "p06_grumpy_dry", ["Grumpy was dry.", "The leaf kept rain away.", "\"This is better.\""], "Go outside?", [
        { label: "Yes", nextPageId: "p07_everyone_puddle" },
        { label: "No", nextPageId: "p08_quiet_ending" }
      ], ["grumpy", "rain", "leaf"]),
      dinoPalsPage(sunnyRainyFolder, "p06_dozy_dry", ["Dozy was dry.", "He fell asleep again.", "The cave felt peaceful."], "Wake Dozy?", [
        { label: "No", nextPageId: "p08_quiet_ending" },
        { label: "Soft splash", nextPageId: "p06_dozy_again" }
      ], ["dozy", "peaceful"]),
      dinoPalsPage(sunnyRainyFolder, "p07_leaf_boat", ["Sunny made a leaf boat.", "It went plop.", "Grumpy watched it float."], "Where does it go?", [
        { label: "Across", nextPageId: "p08_rainbow_ending" },
        { label: "Into Grumpy", nextPageId: "p06_grumpy_smile" }
      ], ["sunny", "leaf", "grumpy"]),
      dinoPalsPage(sunnyRainyFolder, "p07_everyone_puddle", ["One by one, they joined in.", "Everyone splashed.", "Even Grumpy's tail splashed."], "What comes next?", [
        { label: "Sun out", nextPageId: "p08_rainbow_ending" },
        { label: "Grumpy laughs", nextPageId: "p08_grumpy_laugh_ending" }
      ], ["sunny", "grumpy", "splashed"]),
      dinoPalsPage(sunnyRainyFolder, "p08_rainbow_ending", ["The sun came out.", "A rainbow came too.", "Sunny was right."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["sunny", "rainbow"]),
      dinoPalsPage(sunnyRainyFolder, "p08_grumpy_laugh_ending", ["Grumpy laughed.", "Just a little.", "Sunny looked surprised."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["grumpy", "sunny", "surprised"]),
      dinoPalsPage(sunnyRainyFolder, "p08_quiet_ending", ["The rain was soft.", "The cave was warm.", "The pals felt peaceful."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["rain", "peaceful"])
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
      moonwoodPage(fernWrenFolder, "p02_recipe", ["Fern looked at the recipe.", "\"Are you sure?\" she asked.", "\"Completely,\" said Wren.", "Mostly."], "What should Fern do?", [
        { label: "Trust Wren", nextPageId: "p03_pour_potion" },
        { label: "Check the book again", nextPageId: "p03_wrong_colour" }
      ], ["fern", "wren", "book"]),
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
      moonwoodPage(fernWrenFolder, "p05_wren_panic", ["Wren opened one book.", "Then another.", "Then another.", "None of them were the right book."], "What should Wren do?", [
        { label: "Ask Fern for help", nextPageId: "p05_fern_calm" },
        { label: "Try a fast spell", nextPageId: "p06_fast_spell" }
      ], ["wren", "book", "fern"]),
      moonwoodPage(fernWrenFolder, "p05_garden_empty", ["The garden was almost empty.", "A flowerpot waddled down the path.", "A vine waved politely."], "What should they do?", [
        { label: "Follow the vine", nextPageId: "p06_crystal_stream" },
        { label: "Find the recipe", nextPageId: "p06_wrong_book" }
      ], ["garden", "book"]),
      moonwoodPage(fernWrenFolder, "p06_wrong_book", ["Wren found the problem.", "\"This is the motion recipe,\" she said.", "\"Not the growing recipe.\"", "Fern was very quiet."], "What should they use?", [
        { label: "Use the right book", nextPageId: "p07_book_fix" },
        { label: "Use Fern's song", nextPageId: "p07_sing_softly" }
      ], ["wren", "book", "wrong", "fern", "quiet"]),
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
      moonwoodPage(fernWrenFolder, "p07_book_fix", ["Wren found the right page.", "She read very carefully.", "The spell made one plant sneeze."], "What should Wren do?", [
        { label: "Try again", nextPageId: "p08_almost_fixed" },
        { label: "Let Fern try", nextPageId: "p07_sing_softly" }
      ], ["wren", "book", "plants"]),
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
  }
];

export const storyQuests = [
  ...moonwoodStoryQuests,
  ...dinoPalsStoryQuests,
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
        text: ["I am Sam.", "I see Pam.", "We can go out."],
        imageUrl: samPamImagePath(1),
        audioUrl: samPamAudioPath(1),
        skillTags: ["short_a", "hfw_1_25", "sam", "pam"],
        choices: [
          { label: "Go to the van", nextPageId: "page-02" },
          { label: "See the cat", nextPageId: "page-03" }
        ]
      },
      {
        id: "page-02",
        text: ["Sam and Pam go to the van.", "Sam has a map."],
        imageUrl: samPamImagePath(2),
        audioUrl: samPamAudioPath(2),
        skillTags: ["short_a", "van", "map"],
        choices: [
          { label: "Get the bag", nextPageId: "page-04" },
          { label: "See the map", nextPageId: "page-05" }
        ]
      },
      {
        id: "page-03",
        text: ["Pam can see a cat.", "The cat is on a mat."],
        imageUrl: samPamImagePath(3),
        audioUrl: samPamAudioPath(3),
        skillTags: ["short_a", "cat", "mat"],
        choices: [
          { label: "Pat the cat", nextPageId: "page-05" },
          { label: "Get the bag", nextPageId: "page-04" }
        ]
      },
      {
        id: "page-04",
        text: ["Sam has the bag.", "Pam can see jam in the bag."],
        imageUrl: samPamImagePath(4),
        audioUrl: samPamAudioPath(4),
        skillTags: ["short_a", "bag", "jam"],
        choices: [
          { label: "Go to the mat", nextPageId: "page-06" },
          { label: "Go to the van", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-05",
        text: ["Pam has the map.", "Sam can see the cat on the map."],
        imageUrl: samPamImagePath(5),
        audioUrl: samPamAudioPath(5),
        skillTags: ["short_a", "map", "cat"],
        choices: [
          { label: "Go with Pam", nextPageId: "page-06" },
          { label: "Go with Sam", nextPageId: "page-06" }
        ]
      },
      {
        id: "page-06",
        text: ["We go to the mat.", "The cat sat by Sam and Pam."],
        imageUrl: samPamImagePath(6),
        audioUrl: samPamAudioPath(6),
        skillTags: ["short_a", "mat", "cat"],
        choices: [
          { label: "See the jam", nextPageId: "page-07" },
          { label: "See the map", nextPageId: "page-08" }
        ]
      },
      {
        id: "page-07",
        text: ["Sam can see jam.", "Pam can see the cat."],
        imageUrl: samPamImagePath(7),
        audioUrl: samPamAudioPath(7),
        skillTags: ["short_a", "jam", "cat"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-09" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-08",
        text: ["Pam can see the map.", "Sam can see the van."],
        imageUrl: samPamImagePath(8),
        audioUrl: samPamAudioPath(8),
        skillTags: ["short_a", "map", "van"],
        choices: [
          { label: "Pack the bag", nextPageId: "page-09" },
          { label: "Go to the van", nextPageId: "page-09" }
        ]
      },
      {
        id: "page-09",
        text: ["Sam and Pam go to the van.", "The cat can go too."],
        imageUrl: samPamImagePath(9),
        audioUrl: samPamAudioPath(9),
        skillTags: ["short_a", "van", "cat"],
        choices: [
          { label: "Go home", nextPageId: "page-10" },
          { label: "See the map", nextPageId: "page-10" }
        ]
      },
      {
        id: "page-10",
        text: ["Sam, Pam, and the cat go in the van.", "We can go out again."],
        imageUrl: samPamImagePath(10),
        audioUrl: samPamAudioPath(10),
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
      meadowPalsPage(muddySplashyFolder, "p01_start", ["Muddy is in the mud.", "Splashy is in the pond."], "Who do you want to help?", [
        { label: "Help Muddy", nextPageId: "p02_muddy" },
        { label: "Help Splashy", nextPageId: "p02_splashy" }
      ], ["muddy", "splashy", "mud", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p02_muddy", ["You are with Muddy.", "Muddy has mud."], "What does Muddy do?", [
        { label: "Pat the mud", nextPageId: "p03_mud_pat" },
        { label: "Run to Splashy", nextPageId: "p03_meet_splashy" }
      ], ["muddy", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p02_splashy", ["You are with Splashy.", "Splashy has water."], "What does Splashy do?", [
        { label: "Splash the water", nextPageId: "p03_water_splash" },
        { label: "Run to Muddy", nextPageId: "p03_meet_splashy" }
      ], ["splashy"]),
      meadowPalsPage(muddySplashyFolder, "p03_mud_pat", ["Pat, pat, pat.", "The mud is soft."], "What is in the mud?", [
        { label: "A stick", nextPageId: "p04_stick" },
        { label: "A red hat", nextPageId: "p04_hat_found_early" }
      ], ["mud"]),
      meadowPalsPage(muddySplashyFolder, "p04_hat_found_early", ["It is the hat!", "The hat is not lost now."], "What should they do?", [
        { label: "Wash the hat", nextPageId: "p07_wash_hat" },
        { label: "Take it to Clucky", nextPageId: "p07_clucky_muddy_hat" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p03_water_splash", ["Splash, splash, splash.", "The water is wet."], "What floats by?", [
        { label: "A leaf", nextPageId: "p04_leaf" },
        { label: "A red hat", nextPageId: "p04_hat_found_early" }
      ], ["wet", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p03_meet_splashy", ["Muddy ran.", "Splashy ran.", "They met by the barn."], "Where should they look?", [
        { label: "Look in the mud", nextPageId: "p04_mud_search" },
        { label: "Look by the pond", nextPageId: "p04_pond_search" }
      ], ["muddy", "splashy", "mud", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p04_stick", ["It is not a hat.", "It is a stick."], "Where now?", [
        { label: "Go to the pond", nextPageId: "p04_pond_search" },
        { label: "Call Splashy", nextPageId: "p03_meet_splashy" }
      ], ["hat", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p04_leaf", ["It is not a hat.", "It is a leaf."], "Where now?", [
        { label: "Go to the mud", nextPageId: "p04_mud_search" },
        { label: "Call Muddy", nextPageId: "p03_meet_splashy" }
      ], ["hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p04_mud_search", ["They look in the mud.", "The mud is very big."], "What do they pull?", [
        { label: "Pull a boot", nextPageId: "p05_boot" },
        { label: "Pull the hat", nextPageId: "p06_hat_muddy" }
      ], ["mud", "big", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p04_pond_search", ["They look in the pond.", "The pond is very wet."], "What do they see?", [
        { label: "A frog", nextPageId: "p05_frog" },
        { label: "The hat", nextPageId: "p06_hat_wet" }
      ], ["pond", "wet", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_boot", ["It is a boot.", "It is not the hat."], "What next?", [
        { label: "Look again", nextPageId: "p06_hat_muddy" },
        { label: "Take the boot to Grumpy", nextPageId: "p05_grumpy_boot" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_frog", ["It is a frog.", "It is not the hat."], "What next?", [
        { label: "Look again", nextPageId: "p06_hat_wet" },
        { label: "Ask the frog", nextPageId: "p05_frog_ask" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_grumpy_boot", ["Grumpy sees the boot.", "\"No,\" said Grumpy."], "Where is the hat?", [
        { label: "In the mud", nextPageId: "p06_hat_muddy" },
        { label: "In the pond", nextPageId: "p06_hat_wet" }
      ], ["mud", "pond", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p05_frog_ask", ["The frog hops.", "The hat bobs."], "Get the hat?", [
        { label: "Yes", nextPageId: "p06_hat_wet" },
        { label: "Splash first", nextPageId: "p06_big_splash" }
      ], ["hat"]),
      meadowPalsPage(muddySplashyFolder, "p06_hat_muddy", ["They find the hat.", "The hat is muddy."], "What should they do?", [
        { label: "Wash the hat", nextPageId: "p07_wash_hat" },
        { label: "Take it to Clucky", nextPageId: "p07_clucky_muddy_hat" }
      ], ["hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p06_hat_wet", ["They find the hat.", "The hat is wet."], "What should they do?", [
        { label: "Dry the hat", nextPageId: "p07_dry_hat" },
        { label: "Take it to Clucky", nextPageId: "p07_clucky_wet_hat" }
      ], ["hat", "wet"]),
      meadowPalsPage(muddySplashyFolder, "p06_big_splash", ["Splashy jumps.", "The hat flies up!"], "Where did it go?", [
        { label: "To the mud", nextPageId: "p06_hat_muddy" },
        { label: "To Clucky", nextPageId: "p08_hat_on_clucky" }
      ], ["splashy", "hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p07_wash_hat", ["Splashy washed the hat.", "Now the hat is wet."], "Now what?", [
        { label: "Dry it", nextPageId: "p07_dry_hat" },
        { label: "Give it back", nextPageId: "p07_clucky_wet_hat" }
      ], ["splashy", "hat", "wet"]),
      meadowPalsPage(muddySplashyFolder, "p07_dry_hat", ["Muddy shook the hat.", "Splashy shook too."], "Is the hat dry?", [
        { label: "Yes", nextPageId: "p08_hat_on_clucky" },
        { label: "No", nextPageId: "p08_hat_on_muddy" }
      ], ["muddy", "splashy", "hat"]),
      meadowPalsPage(muddySplashyFolder, "p07_clucky_muddy_hat", ["Clucky sees the hat.", "\"It is muddy!\""], "Fix it?", [
        { label: "Wash it", nextPageId: "p07_wash_hat" },
        { label: "Wear it", nextPageId: "p08_clucky_grumpy" }
      ], ["hat", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p07_clucky_wet_hat", ["Clucky sees the hat.", "\"It is wet!\""], "Fix it?", [
        { label: "Dry it", nextPageId: "p07_dry_hat" },
        { label: "Wear it", nextPageId: "p08_clucky_grumpy" }
      ], ["hat", "wet"]),
      meadowPalsPage(muddySplashyFolder, "p08_hat_on_clucky", ["The hat is back.", "Clucky is happy."], "What do Muddy and Splashy do?", [
        { label: "Jump in mud", nextPageId: "p09_mud_ending" },
        { label: "Jump in pond", nextPageId: "p09_pond_ending" }
      ], ["hat", "muddy", "splashy"]),
      meadowPalsPage(muddySplashyFolder, "p08_hat_on_muddy", ["The hat lands on Muddy.", "Muddy looks fancy."], "Who gets the hat?", [
        { label: "Clucky", nextPageId: "p08_hat_on_clucky" },
        { label: "Muddy", nextPageId: "p09_fancy_muddy_ending" }
      ], ["hat", "muddy"]),
      meadowPalsPage(muddySplashyFolder, "p08_clucky_grumpy", ["Clucky put on the hat.", "Clucky did not smile."], "What helps?", [
        { label: "A little splash", nextPageId: "p09_pond_ending" },
        { label: "A little mud", nextPageId: "p09_mud_ending" }
      ], ["hat", "little", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p09_mud_ending", ["Muddy jumps in mud.", "Splashy jumps too.", "Clucky steps back."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["muddy", "splashy", "mud"]),
      meadowPalsPage(muddySplashyFolder, "p09_pond_ending", ["Splashy jumps in the pond.", "Muddy jumps too.", "Clucky steps back."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["splashy", "muddy", "pond"]),
      meadowPalsPage(muddySplashyFolder, "p09_fancy_muddy_ending", ["Muddy has the hat.", "Clucky has no hat.", "Oh, Muddy!"], "Read again?", [
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
      meadowPalsPage(shyCuddlyFolder, "p01_start", ["Shy is by the barn.", "Cuddly is in the yard."], "Who do you want to help?", [
        { label: "Help Shy", nextPageId: "p02_shy" },
        { label: "Help Cuddly", nextPageId: "p02_cuddly" }
      ], ["shy", "cuddly", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p02_shy", ["You are with Shy.", "Shy wants to play."], "What should Shy do?", [
        { label: "Peek out", nextPageId: "p03_peek" },
        { label: "Stay still", nextPageId: "p03_stay_still" }
      ], ["shy", "play"]),
      meadowPalsPage(shyCuddlyFolder, "p02_cuddly", ["You are with Cuddly.", "Cuddly wants a friend."], "Where should Cuddly look?", [
        { label: "Look by the barn", nextPageId: "p03_barn_look" },
        { label: "Look by the tree", nextPageId: "p03_tree_look" }
      ], ["cuddly", "barn", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p03_peek", ["Shy peeks out.", "Bouncy hops by."], "What does Shy do?", [
        { label: "Hide again", nextPageId: "p04_hide_again" },
        { label: "Wave a little", nextPageId: "p04_little_wave" }
      ], ["shy", "little"]),
      meadowPalsPage(shyCuddlyFolder, "p03_stay_still", ["Shy stays still.", "A little mouse comes by."], "What does Shy do?", [
        { label: "Say hi", nextPageId: "p04_say_hi_tiny" },
        { label: "Stay quiet", nextPageId: "p04_quiet_tiny" }
      ], ["shy", "little"]),
      meadowPalsPage(shyCuddlyFolder, "p03_barn_look", ["Cuddly went to the barn.", "Cuddly sat down."], "What should Cuddly do?", [
        { label: "Wait quietly", nextPageId: "p04_wait_quietly" },
        { label: "Call to Shy", nextPageId: "p04_call_shy" }
      ], ["cuddly", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p03_tree_look", ["Cuddly went to the tree.", "The tree was big."], "What should Cuddly do?", [
        { label: "Sit under it", nextPageId: "p04_tree_sit" },
        { label: "Look up", nextPageId: "p04_tree_look_up" }
      ], ["cuddly", "tree", "big", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p04_hide_again", ["Shy hid again.", "Bouncy hopped away."], "Who comes next?", [
        { label: "Tiny", nextPageId: "p03_stay_still" },
        { label: "Cuddly", nextPageId: "p05_cuddly_arrives" }
      ], ["shy"]),
      meadowPalsPage(shyCuddlyFolder, "p04_little_wave", ["Shy gave a little wave.", "Bouncy waved back."], "Is Shy ready?", [
        { label: "Not yet", nextPageId: "p05_cuddly_arrives" },
        { label: "Yes", nextPageId: "p06_go_to_tree" }
      ], ["shy", "little"]),
      meadowPalsPage(shyCuddlyFolder, "p04_say_hi_tiny", ["\"Hi,\" said Shy.", "\"Hi,\" said Tiny."], "Where should they go?", [
        { label: "To the tree", nextPageId: "p06_go_to_tree" },
        { label: "To Cuddly", nextPageId: "p05_cuddly_arrives" }
      ], ["shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p04_quiet_tiny", ["Tiny sat down.", "Shy sat too."], "Who joins them?", [
        { label: "Cuddly", nextPageId: "p05_cuddly_arrives" },
        { label: "Bouncy", nextPageId: "p04_little_wave" }
      ], ["shy", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p04_wait_quietly", ["Cuddly did not rush.", "Cuddly just sat."], "What does Shy do?", [
        { label: "Sit by Cuddly", nextPageId: "p05_sit_together" },
        { label: "Go to the tree", nextPageId: "p06_go_to_tree" }
      ], ["cuddly", "shy", "sit", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p04_call_shy", ["\"Come out,\" said Cuddly.", "Shy did not come out."], "What helps?", [
        { label: "Wait quietly", nextPageId: "p04_wait_quietly" },
        { label: "Go to the tree", nextPageId: "p06_go_to_tree" }
      ], ["cuddly", "shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p04_tree_sit", ["Cuddly sat by the tree.", "It was quiet."], "Who is in the tree?", [
        { label: "Shy", nextPageId: "p06_tree_find_shy" },
        { label: "A bird", nextPageId: "p05_bird" }
      ], ["cuddly", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p04_tree_look_up", ["Cuddly looked up.", "Two ears looked down."], "Who is it?", [
        { label: "Shy", nextPageId: "p06_tree_find_shy" },
        { label: "Tiny", nextPageId: "p05_tiny_tree" }
      ], ["cuddly", "shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p05_cuddly_arrives", ["Cuddly came by.", "Cuddly sat down."], "What does Shy do?", [
        { label: "Sit by Cuddly", nextPageId: "p05_sit_together" },
        { label: "Go to the tree", nextPageId: "p06_go_to_tree" }
      ], ["cuddly", "shy", "sit", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p05_sit_together", ["Shy sat by Cuddly.", "Cuddly purred."], "Where next?", [
        { label: "To the tree", nextPageId: "p06_go_to_tree" },
        { label: "Stay by the barn", nextPageId: "p08_barn_hug" }
      ], ["shy", "cuddly", "sit", "tree", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p05_bird", ["A bird sat in the tree.", "But Shy was there too."], "Look again?", [
        { label: "Look again", nextPageId: "p06_tree_find_shy" },
        { label: "Sit down", nextPageId: "p04_tree_sit" }
      ], ["shy", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p05_tiny_tree", ["Tiny was under the tree.", "Shy was in the tree."], "What now?", [
        { label: "Help Cuddly look", nextPageId: "p06_tree_find_shy" },
        { label: "Sit with Tiny", nextPageId: "p07_tiny_waits" }
      ], ["shy", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p06_go_to_tree", ["They went to the tree.", "The tree was big."], "Where should they sit?", [
        { label: "Under the tree", nextPageId: "p07_tree_under" },
        { label: "In the tree", nextPageId: "p07_tree_up" }
      ], ["tree", "big", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p06_tree_find_shy", ["Shy is in the tree!", "Cuddly found Shy."], "What does Cuddly do?", [
        { label: "Climb up", nextPageId: "p07_tree_up" },
        { label: "Sit below", nextPageId: "p07_tree_under" }
      ], ["shy", "cuddly", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p07_tiny_waits", ["Tiny sat.", "Cuddly sat.", "Shy came down."], "What next?", [
        { label: "Sit together", nextPageId: "p07_tree_under" },
        { label: "Climb up", nextPageId: "p07_tree_up" }
      ], ["shy", "cuddly", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p07_tree_under", ["They sat under the tree.", "It was quiet."], "What does Cuddly do?", [
        { label: "Lean on Shy", nextPageId: "p08_tree_hug" },
        { label: "Purr softly", nextPageId: "p08_tree_purr" }
      ], ["shy", "cuddly", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p07_tree_up", ["They sat in the tree.", "They could see the farm."], "What does Shy do?", [
        { label: "Smile", nextPageId: "p08_tree_hug" },
        { label: "Wave", nextPageId: "p08_wave_from_tree" }
      ], ["shy", "tree", "sit"]),
      meadowPalsPage(shyCuddlyFolder, "p08_barn_hug", ["Cuddly leaned in.", "Shy stayed still."], "Is it a hug?", [
        { label: "Yes", nextPageId: "p09_soft_hug_ending" },
        { label: "Almost", nextPageId: "p09_almost_hug_ending" }
      ], ["shy", "cuddly", "hug", "barn"]),
      meadowPalsPage(shyCuddlyFolder, "p08_tree_hug", ["Cuddly got a hug.", "Shy got a hug too."], "How do they feel?", [
        { label: "Happy", nextPageId: "p09_tree_happy_ending" },
        { label: "Quiet", nextPageId: "p09_quiet_ending" }
      ], ["shy", "cuddly", "hug", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p08_tree_purr", ["Cuddly purred.", "Shy smiled."], "What now?", [
        { label: "Hug", nextPageId: "p08_tree_hug" },
        { label: "Rest", nextPageId: "p09_quiet_ending" }
      ], ["shy", "cuddly", "hug"]),
      meadowPalsPage(shyCuddlyFolder, "p08_wave_from_tree", ["Shy waved from the tree.", "Tiny waved back."], "What next?", [
        { label: "Come down", nextPageId: "p09_tree_happy_ending" },
        { label: "Stay quiet", nextPageId: "p09_quiet_ending" }
      ], ["shy", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p09_soft_hug_ending", ["It was a soft hug.", "Shy liked it."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["shy", "hug"]),
      meadowPalsPage(shyCuddlyFolder, "p09_tree_happy_ending", ["Shy is happy.", "Cuddly is happy.", "They are friends."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["shy", "cuddly", "tree"]),
      meadowPalsPage(shyCuddlyFolder, "p09_quiet_ending", ["They did not run.", "They did not shout.", "They sat together."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["sit"]),
      meadowPalsPage(shyCuddlyFolder, "p09_almost_hug_ending", ["It was almost a hug.", "That was good too."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["hug"])
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
      meadowPalsPage(bouncySpeedyFolder, "p01_start", ["Bouncy has a map.", "Speedy wants to go."], "Who do you help?", [
        { label: "Help Bouncy", nextPageId: "p02_bouncy" },
        { label: "Help Speedy", nextPageId: "p02_speedy" }
      ], ["bouncy", "speedy", "map"]),
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
      meadowPalsPage(bouncySpeedyFolder, "p03_barn_fast", ["Speedy runs to the barn.", "The map flies up."], "What do you catch?", [
        { label: "The map", nextPageId: "p04_map_caught" },
        { label: "The boot", nextPageId: "p04_boot" }
      ], ["speedy", "run", "barn", "map"]),
      meadowPalsPage(bouncySpeedyFolder, "p03_pond", ["Bouncy hops to the pond.", "The map gets wet."], "What should Bouncy do?", [
        { label: "Shake the map", nextPageId: "p04_map_splash" },
        { label: "Ask Splashy", nextPageId: "p04_splashy_help" }
      ], ["bouncy", "hop", "pond", "map"]),
      meadowPalsPage(bouncySpeedyFolder, "p03_hill_fast", ["Speedy runs to the hill.", "Very, very fast."], "Can Speedy stop?", [
        { label: "Stop now", nextPageId: "p04_speedy_stops" },
        { label: "Keep going", nextPageId: "p04_too_fast" }
      ], ["speedy", "run", "hill", "fast", "stop"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_boot", ["It is a boot.", "It is not the map."], "Who can help?", [
        { label: "Tiny", nextPageId: "p04_tiny_map" },
        { label: "Grumpy", nextPageId: "p05_grumpy_boot" }
      ], ["map"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_map_caught", ["You caught the map.", "Speedy did not stop."], "Where does Speedy go?", [
        { label: "To the pond", nextPageId: "p03_pond" },
        { label: "To the hill", nextPageId: "p03_hill_fast" }
      ], ["map", "speedy", "stop", "pond", "hill"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_tiny_map", ["Tiny sees the map.", "Tiny points up."], "Where should they go?", [
        { label: "To the big tree", nextPageId: "p05_big_tree" },
        { label: "To the pond", nextPageId: "p03_pond" }
      ], ["map", "tree", "pond"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_map_splash", ["Bouncy shook the map.", "Splash!"], "Who got wet?", [
        { label: "Bouncy", nextPageId: "p05_bouncy_wet" },
        { label: "Grumpy", nextPageId: "p05_grumpy_wet" }
      ], ["bouncy", "map"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_splashy_help", ["Splashy helps.", "Splashy likes wet maps."], "Where does the map point?", [
        { label: "To the tree", nextPageId: "p05_big_tree" },
        { label: "To the mud", nextPageId: "p05_muddy_map" }
      ], ["map", "tree"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_speedy_stops", ["Speedy stopped.", "Bouncy hopped past."], "Follow Bouncy?", [
        { label: "Yes", nextPageId: "p05_big_tree" },
        { label: "No", nextPageId: "p05_speedy_waits" }
      ], ["speedy", "bouncy", "hop", "stop"]),
      meadowPalsPage(bouncySpeedyFolder, "p04_too_fast", ["Speedy went too fast.", "The map went too."], "Where did it land?", [
        { label: "In the tree", nextPageId: "p05_big_tree" },
        { label: "In the mud", nextPageId: "p05_muddy_map" }
      ], ["speedy", "fast", "map", "tree"]),
      meadowPalsPage(bouncySpeedyFolder, "p05_grumpy_boot", ["Grumpy sees the boot.", "\"That is my boot.\""], "Does Grumpy help?", [
        { label: "Yes", nextPageId: "p05_big_tree" },
        { label: "No", nextPageId: "p06_lost_again" }
      ], []),
      meadowPalsPage(bouncySpeedyFolder, "p05_bouncy_wet", ["Bouncy is wet.", "Bouncy still hops."], "Hop where?", [
        { label: "To the tree", nextPageId: "p05_big_tree" },
        { label: "To the barn", nextPageId: "p03_barn" }
      ], ["bouncy", "hop", "tree", "barn"]),
      meadowPalsPage(bouncySpeedyFolder, "p05_grumpy_wet", ["Grumpy is wet.", "Grumpy is not happy."], "Run?", [
        { label: "Yes", nextPageId: "p06_lost_again" },
        { label: "No", nextPageId: "p05_big_tree" }
      ], ["run"]),
      meadowPalsPage(bouncySpeedyFolder, "p05_speedy_waits", ["Speedy waits.", "That is new."], "Who comes back?", [
        { label: "Bouncy", nextPageId: "p05_big_tree" },
        { label: "Tiny", nextPageId: "p04_tiny_map" }
      ], ["speedy", "bouncy"]),
      meadowPalsPage(bouncySpeedyFolder, "p05_muddy_map", ["The map is in the mud.", "Oh no."], "Who gets it?", [
        { label: "Bouncy", nextPageId: "p06_bouncy_muddy" },
        { label: "Speedy", nextPageId: "p06_speedy_muddy" }
      ], ["map", "bouncy", "speedy"]),
      meadowPalsPage(bouncySpeedyFolder, "p05_big_tree", ["They got to the big tree.", "The map says stop."], "Do they stop?", [
        { label: "Yes", nextPageId: "p07_tree_stop" },
        { label: "No", nextPageId: "p06_lost_again" }
      ], ["tree", "map", "stop"]),
      meadowPalsPage(bouncySpeedyFolder, "p06_bouncy_muddy", ["Bouncy got the map.", "Bouncy got muddy."], "Is the map okay?", [
        { label: "Yes", nextPageId: "p05_big_tree" },
        { label: "No", nextPageId: "p06_lost_again" }
      ], ["bouncy", "map"]),
      meadowPalsPage(bouncySpeedyFolder, "p06_speedy_muddy", ["Speedy got the map.", "Speedy slid in mud."], "Where did Speedy slide?", [
        { label: "To the tree", nextPageId: "p05_big_tree" },
        { label: "To Grumpy", nextPageId: "p05_grumpy_wet" }
      ], ["speedy", "map", "tree"]),
      meadowPalsPage(bouncySpeedyFolder, "p06_lost_again", ["They did not stop.", "Now they are lost."], "Who can help?", [
        { label: "Tiny", nextPageId: "p04_tiny_map" },
        { label: "The map", nextPageId: "p05_big_tree" }
      ], ["stop", "map"]),
      meadowPalsPage(bouncySpeedyFolder, "p07_tree_stop", ["They stopped.", "They sat by the tree."], "What do they see?", [
        { label: "The farm", nextPageId: "p08_farm_view" },
        { label: "A snack", nextPageId: "p08_tiny_snack" }
      ], ["stop", "tree"]),
      meadowPalsPage(bouncySpeedyFolder, "p08_farm_view", ["They see the farm.", "It is very big."], "Go home?", [
        { label: "Yes", nextPageId: "p09_home_ending" },
        { label: "One more race", nextPageId: "p09_race_ending" }
      ], ["big"]),
      meadowPalsPage(bouncySpeedyFolder, "p08_tiny_snack", ["Tiny has a snack.", "It is very, very small."], "Share it?", [
        { label: "Yes", nextPageId: "p09_tiny_snack_ending" },
        { label: "No, run home", nextPageId: "p09_home_ending" }
      ], ["run"]),
      meadowPalsPage(bouncySpeedyFolder, "p09_home_ending", ["They went home.", "They did not run.", "Well... not much."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["run"]),
      meadowPalsPage(bouncySpeedyFolder, "p09_race_ending", ["Bouncy hopped.", "Speedy ran.", "Oh no!"], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["bouncy", "speedy", "hop", "run"]),
      meadowPalsPage(bouncySpeedyFolder, "p09_tiny_snack_ending", ["Tiny shared the snack.", "It was too small.", "They all laughed."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], [])
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
      meadowPalsPage(braveTinyFolder, "p01_start", ["Brave is little.", "Tiny is little too."], "Who do you help?", [
        { label: "Help Brave", nextPageId: "p02_brave" },
        { label: "Help Tiny", nextPageId: "p02_tiny" }
      ], ["brave", "tiny", "little"]),
      meadowPalsPage(braveTinyFolder, "p02_brave", ["You are with Brave.", "Brave can help."], "Where should Brave go?", [
        { label: "To the pot", nextPageId: "p03_pot" },
        { label: "To the wall", nextPageId: "p03_wall" }
      ], ["brave", "help", "pot", "wall"]),
      meadowPalsPage(braveTinyFolder, "p02_tiny", ["You are with Tiny.", "Tiny sees a problem."], "What does Tiny see?", [
        { label: "A stuck hat", nextPageId: "p03_hat" },
        { label: "A sad Woolly", nextPageId: "p03_woolly" }
      ], ["tiny"]),
      meadowPalsPage(braveTinyFolder, "p03_pot", ["Brave went to the pot.", "The pot was big."], "What is in the pot?", [
        { label: "A hat", nextPageId: "p04_hat_in_pot" },
        { label: "Tiny", nextPageId: "p04_tiny_in_pot" }
      ], ["brave", "pot", "big", "in"]),
      meadowPalsPage(braveTinyFolder, "p03_wall", ["Brave went to the wall.", "The wall was big."], "What is on the wall?", [
        { label: "A feather", nextPageId: "p04_feather" },
        { label: "Clucky", nextPageId: "p04_clucky_wall" }
      ], ["brave", "wall", "big", "on"]),
      meadowPalsPage(braveTinyFolder, "p03_hat", ["Tiny sees a hat.", "The hat is stuck."], "Where is it stuck?", [
        { label: "In the pot", nextPageId: "p04_hat_in_pot" },
        { label: "On the wall", nextPageId: "p04_hat_on_wall" }
      ], ["tiny", "in", "pot", "on", "wall"]),
      meadowPalsPage(braveTinyFolder, "p03_woolly", ["Woolly is sad.", "\"My bell is gone.\""], "Where should they look?", [
        { label: "Under the wool", nextPageId: "p04_under_wool" },
        { label: "By the stream", nextPageId: "p04_stream" }
      ], ["stream"]),
      meadowPalsPage(braveTinyFolder, "p04_hat_in_pot", ["The hat is in the pot.", "Brave jumps in."], "What happens?", [
        { label: "Brave finds it", nextPageId: "p05_hat_found" },
        { label: "Brave gets stuck", nextPageId: "p05_brave_stuck" }
      ], ["brave", "in", "pot"]),
      meadowPalsPage(braveTinyFolder, "p04_tiny_in_pot", ["Tiny is in the pot.", "Tiny can fit."], "What does Tiny find?", [
        { label: "A hat", nextPageId: "p05_hat_found" },
        { label: "A bell", nextPageId: "p05_bell_found" }
      ], ["tiny", "in", "pot"]),
      meadowPalsPage(braveTinyFolder, "p04_feather", ["It is a feather.", "It is not the hat."], "Who lost it?", [
        { label: "Clucky", nextPageId: "p04_clucky_wall" },
        { label: "Brave", nextPageId: "p05_feather_brave" }
      ], ["brave"]),
      meadowPalsPage(braveTinyFolder, "p04_clucky_wall", ["Clucky is on the wall.", "Clucky is cross."], "What does Clucky need?", [
        { label: "Her hat", nextPageId: "p04_hat_on_wall" },
        { label: "Her feather", nextPageId: "p05_feather_back" }
      ], ["on", "wall"]),
      meadowPalsPage(braveTinyFolder, "p04_hat_on_wall", ["The hat is on the wall.", "It is too high."], "Who can get it?", [
        { label: "Tiny", nextPageId: "p05_tiny_climbs" },
        { label: "Brave", nextPageId: "p05_brave_climbs" }
      ], ["tiny", "brave", "on", "wall", "up"]),
      meadowPalsPage(braveTinyFolder, "p04_under_wool", ["Tiny looks in the wool.", "It is very fluffy."], "What is in there?", [
        { label: "The bell", nextPageId: "p05_bell_found" },
        { label: "Brave", nextPageId: "p05_brave_in_wool" }
      ], ["tiny", "in"]),
      meadowPalsPage(braveTinyFolder, "p04_stream", ["They go to the stream.", "The stream is little."], "What is by the stream?", [
        { label: "The bell", nextPageId: "p05_bell_stream" },
        { label: "A hat", nextPageId: "p03_hat" }
      ], ["stream", "little"]),
      meadowPalsPage(braveTinyFolder, "p05_hat_found", ["They found the hat.", "Clucky can have it."], "Take it to Clucky?", [
        { label: "Yes", nextPageId: "p07_clucky_happy" },
        { label: "Wait", nextPageId: "p06_hat_on_brave" }
      ], []),
      meadowPalsPage(braveTinyFolder, "p06_hat_on_brave", ["The hat is on Brave.", "Brave feels big."], "Who gets the hat?", [
        { label: "Clucky", nextPageId: "p07_clucky_happy" },
        { label: "Brave", nextPageId: "p09_fancy_brave_ending" }
      ], ["brave", "big", "on"]),
      meadowPalsPage(braveTinyFolder, "p05_brave_stuck", ["Brave is in the pot.", "Brave is stuck."], "Who helps?", [
        { label: "Tiny", nextPageId: "p06_tiny_helps" },
        { label: "Woolly", nextPageId: "p06_woolly_helps" }
      ], ["brave", "in", "pot"]),
      meadowPalsPage(braveTinyFolder, "p05_bell_found", ["They found the bell.", "Woolly can have it."], "Take it to Woolly?", [
        { label: "Yes", nextPageId: "p07_woolly_happy" },
        { label: "Ring it first", nextPageId: "p06_bell_ring" }
      ], []),
      meadowPalsPage(braveTinyFolder, "p05_feather_brave", ["Brave has a feather.", "Brave looks fancy."], "Keep it?", [
        { label: "Yes", nextPageId: "p09_fancy_brave_ending" },
        { label: "Give it back", nextPageId: "p05_feather_back" }
      ], ["brave"]),
      meadowPalsPage(braveTinyFolder, "p05_feather_back", ["Clucky gets the feather.", "Clucky is pleased."], "What is still missing?", [
        { label: "The hat", nextPageId: "p04_hat_on_wall" },
        { label: "The bell", nextPageId: "p04_under_wool" }
      ], []),
      meadowPalsPage(braveTinyFolder, "p05_tiny_climbs", ["Tiny climbs up.", "Tiny is very good at small."], "Can Tiny reach it?", [
        { label: "Yes", nextPageId: "p05_hat_found" },
        { label: "Not yet", nextPageId: "p06_brave_boost" }
      ], ["tiny", "up"]),
      meadowPalsPage(braveTinyFolder, "p05_brave_climbs", ["Brave climbs up.", "Brave is very brave."], "What happens?", [
        { label: "Brave slips", nextPageId: "p06_brave_slips" },
        { label: "Tiny helps", nextPageId: "p06_brave_boost" }
      ], ["brave", "up", "help"]),
      meadowPalsPage(braveTinyFolder, "p05_brave_in_wool", ["Brave is in the wool.", "Only her feet show."], "Pull Brave out?", [
        { label: "Yes", nextPageId: "p06_tiny_helps" },
        { label: "Wait", nextPageId: "p06_woolly_laughs" }
      ], ["brave", "in"]),
      meadowPalsPage(braveTinyFolder, "p05_bell_stream", ["The bell is by the stream.", "Tiny can get it."], "Get the bell?", [
        { label: "Yes", nextPageId: "p05_bell_found" },
        { label: "Ask Brave", nextPageId: "p06_brave_stream" }
      ], ["tiny", "stream"]),
      meadowPalsPage(braveTinyFolder, "p06_tiny_helps", ["Tiny helped Brave.", "Brave got out."], "What did they find?", [
        { label: "The hat", nextPageId: "p05_hat_found" },
        { label: "The bell", nextPageId: "p05_bell_found" }
      ], ["tiny", "brave"]),
      meadowPalsPage(braveTinyFolder, "p06_woolly_helps", ["Woolly helped.", "The pot tipped over."], "What rolled out?", [
        { label: "The hat", nextPageId: "p05_hat_found" },
        { label: "The bell", nextPageId: "p05_bell_found" }
      ], ["pot"]),
      meadowPalsPage(braveTinyFolder, "p06_bell_ring", ["Ring, ring!", "Woolly jumped."], "Say sorry?", [
        { label: "Yes", nextPageId: "p07_woolly_happy" },
        { label: "Ring again", nextPageId: "p09_loud_bell_ending" }
      ], []),
      meadowPalsPage(braveTinyFolder, "p06_brave_boost", ["Tiny gave Brave a boost.", "Up, up, up!"], "What do they get?", [
        { label: "The hat", nextPageId: "p05_hat_found" },
        { label: "The feather", nextPageId: "p05_feather_back" }
      ], ["tiny", "brave", "up"]),
      meadowPalsPage(braveTinyFolder, "p06_brave_slips", ["Brave slipped down.", "Plop."], "Try again?", [
        { label: "Yes", nextPageId: "p06_brave_boost" },
        { label: "Ask Tiny", nextPageId: "p05_tiny_climbs" }
      ], ["brave", "down"]),
      meadowPalsPage(braveTinyFolder, "p06_woolly_laughs", ["Woolly giggled.", "Brave popped out."], "What popped out too?", [
        { label: "The bell", nextPageId: "p05_bell_found" },
        { label: "The hat", nextPageId: "p05_hat_found" }
      ], ["brave"]),
      meadowPalsPage(braveTinyFolder, "p06_brave_stream", ["Brave jumped in.", "Splash!"], "Did Brave get the bell?", [
        { label: "Yes", nextPageId: "p05_bell_found" },
        { label: "No", nextPageId: "p06_tiny_helps" }
      ], ["brave", "in", "stream"]),
      meadowPalsPage(braveTinyFolder, "p07_clucky_happy", ["Clucky got her hat.", "Clucky stood tall."], "What now?", [
        { label: "Help Woolly", nextPageId: "p03_woolly" },
        { label: "Finish", nextPageId: "p09_helpful_ending" }
      ], []),
      meadowPalsPage(braveTinyFolder, "p07_woolly_happy", ["Woolly got her bell.", "Woolly smiled."], "What now?", [
        { label: "Help Clucky", nextPageId: "p03_hat" },
        { label: "Finish", nextPageId: "p09_helpful_ending" }
      ], []),
      meadowPalsPage(braveTinyFolder, "p09_fancy_brave_ending", ["Brave kept the feather.", "Brave felt big."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["brave", "big"]),
      meadowPalsPage(braveTinyFolder, "p09_loud_bell_ending", ["Ring, ring, ring!", "Oh, Brave!"], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["brave"]),
      meadowPalsPage(braveTinyFolder, "p09_helpful_ending", ["Tiny helped.", "Brave helped.", "Little can help big."], "Read again?", [
        { label: "Read again", nextPageId: "p01_start" },
        { label: "Finish", nextPageId: "end" }
      ], ["tiny", "brave", "little", "help", "big"])
    ]
  }
];

export function getStoryQuestById(id) {
  return storyQuests.find(quest => quest.id === id) || null;
}
