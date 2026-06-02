const samPamImagePath = page => `/images/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.webp`;
const samPamAudioPath = page => `/audio/story-quests/sam-pam/page-${String(page).padStart(2, "0")}.mp3`;
const samPamWordImagePath = word => `/images/story-quests/sam-pam/words/word-${word}.webp`;

const meadowPalsImagePath = (folder, pageId) => `/images/story-quests/meadow-pals/${folder}/${pageId}.webp`;
const meadowPalsAudioPath = (folder, pageId) => `/audio/story-quests/meadow-pals/${folder}/${pageId}.mp3`;

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

const muddySplashyFolder = "muddy-splashy-hat";
const shyCuddlyFolder = "shy-cuddly-quiet";

export const storyQuests = [
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
  }
];

export function getStoryQuestById(id) {
  return storyQuests.find(quest => quest.id === id) || null;
}
