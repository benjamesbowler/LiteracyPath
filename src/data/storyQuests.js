// LiteracyPath Story Quests
//
// REWRITTEN 2026-07-26. Every page of all 13 quests was re-authored to sit at its
// declared Fountas & Pinnell band and to match what the existing illustrations
// actually show. See docs/STORY_QUEST_REWRITE_2026-07-26.md for the rationale,
// the per-book change notes, and the art work orders.
//
// Band ceilings enforced by tools/checkStoryQuestLevels.js:
//   A     1 line/page,  <=6 words/page,  present tense, no dialogue, no possessives
//   B     2 lines/page, <=14 words/page, present tense, "X," said Y. only
//   C     3 lines/page, <=22 words/page, present tense dominant, said/says only
//   Early true decodable: short-a CVC content words + declared HFW only
//
// EVERY page carries narrationNeedsRebuild: true. The text changed, so all 465
// existing narration mp3s now read the wrong words. The flag suppresses audio
// playback (see src/utils/guidedReading/readAloudPolicy.js and
// StoryQuestPlayer.jsx) until narration is regenerated. Do NOT remove the flag
// page-by-page — remove it only for pages whose audio has actually been rebuilt.

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

export const dinoPalsStoryQuestMetadata = [
  {
    id: "dp_ra_b_01_chompy_big_lunch_hunt",
    title: "Chompy's Big Lunch Hunt",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a repeating frame with two changing words",
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
    skillFocus: "Reading a wet-and-dry pattern with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    mediaFolder: "sunny-rainy-rescue"
  },
  {
    id: "dp_ra_b_03_grumpy_almost_good_day",
    title: "Grumpy's Almost-Good Day",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a repeating action frame with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    mediaFolder: "grumpy-almost-good-day"
  },
  {
    id: "dp_ra_b_04_bouncy_big_bounce",
    title: "Bouncy's Big Bounce",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a bouncing action pattern with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    mediaFolder: "bouncy-big-bounce"
  }
];

export const dinoPalsV2MediaPendingStoryQuestDrafts = [];

export const storyQuests = [
  {
    id: "mw_ra_c_01_pip_stone_loud_thing",
    title: "Pip and Stone: The Loud Thing",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Reading two-clause sentences with and; dialogue tagged with says",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Pip", "Stone"],
    location: "Moonwood - Hollow Oak, Fog Marsh, reeds, dark water",
    targetWords: ["Pip", "Stone", "frog", "loud", "marsh", "fog", "lost", "family", "quiet", "calls", "hand", "reeds"],
    highFrequencyWords: ["and", "the", "says", "with", "one", "very", "them", "this", "home", "again", "out", "of"],
    hfw: ["and", "the", "says", "with", "one", "very", "them", "this", "home", "again", "out", "of"],
    mediaFolder: "pip-stone-loud-thing",
    sentenceFrame: "Pip does one thing. Stone does another. The marsh answers.",
    genuineFailurePageId: "p08_stone_calls",
    retiredPageIds: ["p03_luna_says_together", "p05_together", "p06_small_answer", "p08_stone_carries", "p09_answer_far_side"],
    coverImageUrl: moonwoodImagePath("pip-stone-loud-thing", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Pip and Stone sit outside the Hollow Oak.", "A crash comes from the Fog Marsh.", "The leaves shake."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p01_start"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["pip", "stone", "marsh", "fog"],
        choices: [
          { label: "Go and look", nextPageId: "p02_pip_wants_to_go" },
          { label: "Stay by the oak", nextPageId: "p02_stone_waits" },
        ]
      },
      {
        id: "p02_pip_wants_to_go",
        text: ["\"I want to see it,\" says Pip.", "Stone folds both arms.", "\"It is very loud,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p02_pip_wants_to_go"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p02_pip_wants_to_go"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who goes first?",
        skillTags: ["pip", "stone", "loud"],
        choices: [
          { label: "Pip goes first", nextPageId: "p03_pip_edge" },
          { label: "Ask Stone to come", nextPageId: "p03_stone_one_foot" },
        ]
      },
      {
        id: "p02_stone_waits",
        text: ["Stone stays by the tree.", "The crash comes again.", "Pip looks at the path."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p02_stone_waits"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p02_stone_waits"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens now?",
        skillTags: ["pip", "stone"],
        choices: [
          { label: "Wait for Stone", nextPageId: "p03_stone_one_foot" },
          { label: "Walk in now", nextPageId: "p04_inside_marsh" },
        ]
      },
      {
        id: "p03_pip_edge",
        text: ["Pip walks to the edge of the marsh.", "Grey fog curls around his boots.", "The crash comes again."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p03_pip_edge"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p03_pip_edge"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Pip do?",
        skillTags: ["pip", "marsh", "fog"],
        choices: [
          { label: "Step into the fog", nextPageId: "p04_inside_marsh" },
          { label: "Wait for Stone", nextPageId: "p04_stone_appears" },
        ]
      },
      {
        id: "p03_stone_one_foot",
        text: ["Stone moves one foot.", "Then Stone moves the other foot.", "\"I am coming,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p03_stone_one_foot"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p03_stone_one_foot"),
        narrationNeedsRebuild: true,
        choicePrompt: "How do they go?",
        skillTags: ["stone"],
        choices: [
          { label: "Walk together", nextPageId: "p04_stone_appears" },
          { label: "Let Stone lead", nextPageId: "p04_stone_leads" },
        ]
      },
      {
        id: "p04_inside_marsh",
        text: ["Pip and Stone stand on the bank.", "The sound bounces off the water.", "The reeds shake."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p04_inside_marsh"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p04_inside_marsh"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do they look?",
        skillTags: ["pip", "stone", "reeds"],
        choices: [
          { label: "Look in the reeds", nextPageId: "p05_reeds_shake" },
          { label: "Look at the mud", nextPageId: "p05_tiny_tracks" },
        ]
      },
      {
        id: "p04_stone_appears",
        text: ["Stone puts one huge hand on Pip's shoulder.", "The fog is thick.", "The two of them wait."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p04_stone_appears"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p04_stone_appears"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they follow?",
        skillTags: ["pip", "stone", "fog", "hand"],
        choices: [
          { label: "Follow the noise", nextPageId: "p06_mossy_stone" },
          { label: "Look for tracks", nextPageId: "p05_tiny_tracks" },
        ]
      },
      {
        id: "p04_stone_leads",
        text: ["Stone walks first with a tall stick.", "Pip holds the lantern up.", "The ground squelches."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p04_stone_leads"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p04_stone_leads"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which way now?",
        skillTags: ["pip", "stone"],
        choices: [
          { label: "Follow the noise", nextPageId: "p05_reeds_shake" },
          { label: "Go to the rock", nextPageId: "p06_mossy_stone" },
        ]
      },
      {
        id: "p05_reeds_shake",
        text: ["The reeds shake hard.", "Pip points into them.", "Stone hides behind a rock."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p05_reeds_shake"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p05_reeds_shake"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do they look?",
        skillTags: ["pip", "stone", "reeds"],
        choices: [
          { label: "Pull the reeds back", nextPageId: "p06_mossy_stone" },
          { label: "Let Stone look", nextPageId: "p06_stone_bends" },
        ]
      },
      {
        id: "p05_tiny_tracks",
        text: ["Pip finds tiny wet tracks in the mud.", "They stop beside a mossy rock."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p05_tiny_tracks"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p05_tiny_tracks"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["pip"],
        choices: [
          { label: "Look on the rock", nextPageId: "p06_mossy_stone" },
          { label: "Call to it", nextPageId: "p07_pip_speaks" },
        ]
      },
      {
        id: "p06_mossy_stone",
        text: ["On the mossy rock sits a small green frog.", "Its mouth is very wide.", "All that noise comes from this frog."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p06_mossy_stone"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p06_mossy_stone"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who speaks to it?",
        skillTags: ["frog"],
        choices: [
          { label: "Pip talks to it", nextPageId: "p07_pip_speaks" },
          { label: "Stone kneels down", nextPageId: "p07_stone_gentle" },
        ]
      },
      {
        id: "p06_stone_bends",
        text: ["Stone bends down low.", "Stone is huge.", "The frog on the rock is not."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p06_stone_bends"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p06_stone_bends"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["stone", "frog"],
        choices: [
          { label: "Lift it gently", nextPageId: "p07_stone_gentle" },
          { label: "Look for its family", nextPageId: "p08_search_family" },
        ]
      },
      {
        id: "p07_pip_speaks",
        text: ["\"Why are you shouting?\" says Pip.", "\"I am lost,\" says the frog.", "\"I am calling my family.\""],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p07_pip_speaks"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p07_pip_speaks"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can they help?",
        skillTags: ["pip", "frog", "lost", "family"],
        choices: [
          { label: "Call out loud", nextPageId: "p08_stone_calls" },
          { label: "Search the marsh", nextPageId: "p08_search_family" },
        ]
      },
      {
        id: "p07_stone_gentle",
        text: ["Stone lies down and opens one hand.", "The frog steps onto his palm.", "\"We help you,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p07_stone_gentle"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p07_stone_gentle"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Stone do?",
        skillTags: ["stone", "frog", "hand"],
        choices: [
          { label: "Stone calls out", nextPageId: "p08_stone_calls" },
          { label: "Pip listens", nextPageId: "p09_pip_listens" },
        ]
      },
      {
        id: "p08_search_family",
        text: ["They look by the reeds.", "They look by the dark water.", "No frogs."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p08_search_family"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p08_search_family"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they try?",
        skillTags: ["reeds"],
        choices: [
          { label: "Climb and listen", nextPageId: "p09_pip_listens" },
          { label: "Call more softly", nextPageId: "p09_soft_call" },
        ]
      },
      {
        id: "p08_stone_calls",
        text: ["Stone calls across the marsh.", "Pip listens hard.", "Nothing calls back."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p08_stone_calls"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p08_stone_calls"),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["pip", "stone", "marsh", "calls"],
        choices: [
          { label: "Call one more time", nextPageId: "p09_pip_covers_ears" },
          { label: "Let Pip listen", nextPageId: "p09_pip_listens" },
        ]
      },
      {
        id: "p09_pip_listens",
        text: ["Pip climbs onto a root.", "He puts one hand by his ear.", "Far away, something answers."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p09_pip_listens"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p09_pip_listens"),
        narrationNeedsRebuild: true,
        choicePrompt: "What next?",
        skillTags: ["pip", "hand"],
        choices: [
          { label: "Go to the sound", nextPageId: "p10_family_found" },
          { label: "Let the frog call", nextPageId: "p09_toadling_calls" },
        ]
      },
      {
        id: "p09_pip_covers_ears",
        text: ["Stone calls again.", "Pip claps both hands over his ears.", "The frog hops behind a root."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p09_pip_covers_ears"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p09_pip_covers_ears"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["pip", "stone", "frog", "calls"],
        choices: [
          { label: "Call much softer", nextPageId: "p09_soft_call" },
          { label: "Let the frog call", nextPageId: "p09_toadling_calls" },
        ]
      },
      {
        id: "p09_soft_call",
        text: ["Stone calls again, much softer.", "Two frogs come out of the reeds.", "They look at the small green frog."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p09_soft_call"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p09_soft_call"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["stone", "frog", "calls", "reeds"],
        choices: [
          { label: "Go to the bank", nextPageId: "p10_family_found" },
          { label: "Let them come", nextPageId: "p11_toadling_answer" },
        ]
      },
      {
        id: "p09_toadling_calls",
        text: ["The small frog hops onto a log.", "It opens its mouth wide.", "A huge happy sound rolls out."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p09_toadling_calls"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p09_toadling_calls"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["frog"],
        choices: [
          { label: "Follow the sound", nextPageId: "p10_family_found" },
          { label: "Call again softly", nextPageId: "p09_soft_call" },
        ]
      },
      {
        id: "p10_family_found",
        text: ["Five small frogs sit along the bank.", "One leaps over the water.", "The lost frog leaps home."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p10_family_found"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p10_family_found"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do Pip and Stone do?",
        skillTags: ["frog", "lost"],
        choices: [
          { label: "Wave goodbye", nextPageId: "p11_back_home" },
          { label: "Say nothing", nextPageId: "p12_ending_quiet" },
        ]
      },
      {
        id: "p11_toadling_answer",
        text: ["The frog sits with its family.", "\"Are you always this loud?\" says Pip.", "\"Only when I am lost,\" says the frog."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p11_toadling_answer"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p11_toadling_answer"),
        narrationNeedsRebuild: true,
        choicePrompt: "How does it end?",
        skillTags: ["pip", "frog", "loud", "lost", "family"],
        choices: [
          { label: "Tell the wood", nextPageId: "p12_ending_loud" },
          { label: "Walk home", nextPageId: "p11_back_home" },
        ]
      },
      {
        id: "p11_back_home",
        text: ["Pip and Stone walk back to the Hollow Oak.", "The marsh is quiet now.", "Stone keeps one hand on Pip's shoulder."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p11_back_home"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p11_back_home"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["pip", "stone", "marsh", "quiet", "hand"],
        choices: [
          { label: "Tell the wood", nextPageId: "p12_ending_loud" },
          { label: "Say nothing", nextPageId: "p12_ending_quiet" },
        ]
      },
      {
        id: "p12_ending_loud",
        text: ["A hedgehog and an owl come to listen.", "\"Very small,\" says Pip.", "\"Very loud,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p12_ending_loud"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p12_ending_loud"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["pip", "stone", "loud"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p12_ending_quiet",
        text: ["Pip and Stone sit by the Hollow Oak.", "They tell no one about the frog.", "The wood stays quiet."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p12_ending_quiet"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p12_ending_quiet"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["pip", "stone", "frog", "quiet"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mw_ra_c_02_fern_wren_walking_garden",
    title: "Fern and Wren: The Walking Garden",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Reading colour and number words in context; dialogue tagged with says",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Fern", "Wren"],
    location: "Moonwood - Fern's garden, Hollow Oak, Crystal Stream",
    targetWords: ["Fern", "Wren", "garden", "potion", "pots", "walk", "green", "book", "sings", "plant", "purple", "path"],
    highFrequencyWords: ["and", "the", "says", "her", "one", "very", "then", "down", "out", "all", "no", "of"],
    hfw: ["and", "the", "says", "her", "one", "very", "then", "down", "out", "all", "no", "of"],
    mediaFolder: "fern-wren-walking-garden",
    sentenceFrame: "Wren tries a spell. The pots walk. Fern sings them back.",
    genuineFailurePageId: "p05_too_late",
    retiredPageIds: ["p06_wrong_book", "p06_crystal_stream", "p07_dewdrop_laughs", "p09_tiny_bow", "p10_wren_sorry", "p11_fewer_books"],
    coverImageUrl: moonwoodImagePath("fern-wren-walking-garden", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Fern waters the pots in her garden.", "Wren walks in with a cauldron.", "\"I made a potion,\" says Wren."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p01_start"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Fern do?",
        skillTags: ["fern", "wren", "garden", "potion", "pots"],
        choices: [
          { label: "Read the book", nextPageId: "p02_recipe" },
          { label: "Let Wren pour", nextPageId: "p03_pour_potion" },
        ]
      },
      {
        id: "p02_recipe",
        text: ["Fern holds the book open.", "The page says GREEN. The page says ONE DROP.", "Wren's potion is purple."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p02_recipe"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p02_recipe"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Fern do?",
        skillTags: ["fern", "wren", "potion", "green", "book", "purple"],
        choices: [
          { label: "Trust Wren", nextPageId: "p03_pour_potion" },
          { label: "Check the colour", nextPageId: "p03_wrong_colour" },
        ]
      },
      {
        id: "p03_wrong_colour",
        text: ["Fern looks at the potion again.", "It is not green.", "Wren stirs and stirs."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p03_wrong_colour"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p03_wrong_colour"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["fern", "wren", "potion", "green"],
        choices: [
          { label: "Warn Wren", nextPageId: "p04_fern_warns" },
          { label: "Pour it anyway", nextPageId: "p03_pour_potion" },
        ]
      },
      {
        id: "p03_pour_potion",
        text: ["Wren tips the potion onto a plant.", "The plant stands up straight.", "Then one small pot takes a step."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p03_pour_potion"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p03_pour_potion"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["wren", "potion", "plant"],
        choices: [
          { label: "Follow the small pot", nextPageId: "p04_small_plant" },
          { label: "Look at them all", nextPageId: "p04_all_walk" },
        ]
      },
      {
        id: "p04_fern_warns",
        text: ["\"Wren,\" says Fern. \"That colour is wrong.\"", "The big fern lifts one root.", "Wren turns around."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p04_fern_warns"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p04_fern_warns"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Fern do?",
        skillTags: ["fern", "wren"],
        choices: [
          { label: "Grab the cauldron", nextPageId: "p05_too_late" },
          { label: "Take a breath", nextPageId: "p05_fern_calm" },
        ]
      },
      {
        id: "p04_small_plant",
        text: ["The smallest pot walks off down the path.", "It walks very slowly.", "It heads for a round door in the bank."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p04_small_plant"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p04_small_plant"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["path"],
        choices: [
          { label: "Run after it", nextPageId: "p05_tiny_escape" },
          { label: "Call Fern", nextPageId: "p05_fern_calm" },
        ]
      },
      {
        id: "p04_all_walk",
        text: ["Every pot in the row starts to walk.", "They walk around Fern.", "They walk around Wren."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p04_all_walk"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p04_all_walk"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["fern", "wren", "walk"],
        choices: [
          { label: "Grab a pot", nextPageId: "p05_too_late" },
          { label: "Follow them", nextPageId: "p05_garden_empty" },
        ]
      },
      {
        id: "p05_too_late",
        text: ["Fern reaches for the cauldron.", "It tips over.", "Purple drops run out across the toppled pots."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p05_too_late"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p05_too_late"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Fern do?",
        skillTags: ["fern", "pots", "purple"],
        choices: [
          { label: "Stand still", nextPageId: "p05_fern_calm" },
          { label: "Look in the books", nextPageId: "p05_wren_panic" },
        ]
      },
      {
        id: "p05_tiny_escape",
        text: ["The small pot runs at the round door.", "It knocks.", "No one is home."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p05_tiny_escape"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p05_tiny_escape"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: [],
        choices: [
          { label: "Carry it back", nextPageId: "p05_fern_calm" },
          { label: "Let it go on", nextPageId: "p05_garden_empty" },
        ]
      },
      {
        id: "p05_fern_calm",
        text: ["Fern shuts her eyes and spreads her wings.", "Wren holds her book tight.", "One small plant sits down by Fern's feet."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p05_fern_calm"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p05_fern_calm"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Fern try?",
        skillTags: ["fern", "wren", "book", "plant"],
        choices: [
          { label: "Look in the books", nextPageId: "p07_book_fix" },
          { label: "Follow the pots", nextPageId: "p06_plants_everywhere" },
        ]
      },
      {
        id: "p05_wren_panic",
        text: ["Wren opens one book. Then another book.", "None of them has the green page.", "Fern kneels down beside her."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p05_wren_panic"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p05_wren_panic"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Wren do?",
        skillTags: ["fern", "wren", "green", "book"],
        choices: [
          { label: "Try a fast spell", nextPageId: "p06_fast_spell" },
          { label: "Find the green page", nextPageId: "p07_book_fix" },
        ]
      },
      {
        id: "p05_garden_empty",
        text: ["The garden is almost empty.", "One pot waddles down the path.", "A vine waves at Fern and Wren."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p05_garden_empty"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p05_garden_empty"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["fern", "wren", "garden", "path"],
        choices: [
          { label: "Follow the pots", nextPageId: "p06_plants_everywhere" },
          { label: "Call Fern", nextPageId: "p05_fern_calm" },
        ]
      },
      {
        id: "p06_fast_spell",
        text: ["Wren tries a quick spell.", "The pots stop.", "Then they all walk backward."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p06_fast_spell"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p06_fast_spell"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do now?",
        skillTags: ["wren", "pots", "walk"],
        choices: [
          { label: "Let Fern sing", nextPageId: "p07_sing_softly" },
          { label: "Follow the pots", nextPageId: "p06_plants_everywhere" },
        ]
      },
      {
        id: "p06_plants_everywhere",
        text: ["The pots cross the stream.", "Two of them stand at the lit oak door.", "One sits on a mushroom."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p06_plants_everywhere"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p06_plants_everywhere"),
        narrationNeedsRebuild: true,
        choicePrompt: "How do they get them back?",
        skillTags: ["pots"],
        choices: [
          { label: "Call them home", nextPageId: "p07_sing_softly" },
          { label: "Go and fetch them", nextPageId: "p08_almost_fixed" },
        ]
      },
      {
        id: "p07_book_fix",
        text: ["Wren finds the green page again.", "Her new potion is green.", "The first drop makes one plant sneeze."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p07_book_fix"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p07_book_fix"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Wren do?",
        skillTags: ["wren", "potion", "green", "plant"],
        artAction: "re-render",
        artNote: "Same composition, same GREEN / ONE DROP / STIR SLOWLY lettering; redraw Wren's left hand on the book board, which is currently a mitten with fused fingers.",
        choices: [
          { label: "Try again", nextPageId: "p08_almost_fixed" },
          { label: "Let Fern sing", nextPageId: "p07_sing_softly" },
        ]
      },
      {
        id: "p07_sing_softly",
        text: ["Fern lifts both arms and sings.", "Her song is very quiet.", "Six small pots come and sit by her."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p07_sing_softly"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p07_sing_softly"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens?",
        skillTags: ["fern", "pots", "sings"],
        choices: [
          { label: "The pots listen", nextPageId: "p08_return_home" },
          { label: "The small one dances", nextPageId: "p08_tiny_dance" },
        ]
      },
      {
        id: "p08_almost_fixed",
        text: ["The pots slow down.", "One plant sits in a teacup.", "Another plant keeps its legs."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p08_almost_fixed"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p08_almost_fixed"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["pots", "plant"],
        choices: [
          { label: "Send them home", nextPageId: "p08_return_home" },
          { label: "Count the pots", nextPageId: "p09_plants_settle" },
        ]
      },
      {
        id: "p08_tiny_dance",
        text: ["The smallest pot dances in a circle.", "Wren watches it.", "Fern keeps on singing."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p08_tiny_dance"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p08_tiny_dance"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["fern", "wren"],
        choices: [
          { label: "Let it finish", nextPageId: "p08_return_home" },
          { label: "Leave the big pot", nextPageId: "p09_silly_garden" },
        ]
      },
      {
        id: "p08_return_home",
        text: ["The pots turn around.", "They walk back along the path, one by one.", "Fern hums over them."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p08_return_home"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p08_return_home"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they watch?",
        skillTags: ["fern", "pots", "walk", "path"],
        choices: [
          { label: "Watch them settle", nextPageId: "p09_plants_settle" },
          { label: "Leave it silly", nextPageId: "p09_silly_garden" },
        ]
      },
      {
        id: "p09_plants_settle",
        text: ["Each pot finds its own place.", "The smallest one sits down last.", "It lands with a small thump."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p09_plants_settle"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p09_plants_settle"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens now?",
        skillTags: [],
        choices: [
          { label: "Fern counts the pots", nextPageId: "p10_garden_safe" },
          { label: "Put the potion away", nextPageId: "p12_ending_calm" },
        ]
      },
      {
        id: "p09_silly_garden",
        text: ["Fern picks up a pot and holds it.", "The big pot by the wall keeps its legs.", "Fern lets it keep them."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p09_silly_garden"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p09_silly_garden"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["fern"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p10_garden_safe",
        text: ["Fern counts every pot in the garden.", "They are all here.", "Wren holds her book and says nothing."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p10_garden_safe"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p10_garden_safe"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["fern", "wren", "garden", "book"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p12_ending_calm",
        text: ["Wren puts the purple potion in a vial.", "Fern shuts the garden gate.", "The smallest plant moves one leaf."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p12_ending_calm"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p12_ending_calm"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["fern", "wren", "garden", "potion", "plant", "purple"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mw_ra_c_03_luna_burrow_star_shell_door",
    title: "Luna and Burrow: The Star Shell Door",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Following a map through a branching journey; says as the only tag",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Luna", "Burrow", "Pip", "Wren"],
    location: "Moonwood - Hollow Oak, Crystal Stream, old roots, star room",
    targetWords: ["Luna", "Burrow", "star", "shell", "door", "map", "hum", "path", "stream", "roots", "open", "gold"],
    highFrequencyWords: ["and", "the", "says", "out", "then", "with", "this", "up", "on", "of", "his", "them"],
    hfw: ["and", "the", "says", "out", "then", "with", "this", "up", "on", "of", "his", "them"],
    mediaFolder: "luna-burrow-star-shell-door",
    sentenceFrame: "Luna holds the star. Burrow reads the map. The door waits.",
    genuineFailurePageId: "p05_cracked_shell",
    retiredPageIds: ["p03_marsh_path", "p04_bird_riddle", "p04_quiet_mist", "p05_door_answer", "p05_feather", "p05_song_answer", "p05_tunnel_wide", "p06_map_sings", "p06_stone_helps", "p07_knock_reply", "p07_luna_fixes", "p07_moss_laughs", "p07_stone_too_big", "p07_wrong_shell", "p08_key_joke", "p08_polite_door", "p08_star_room", "p08_stone_guard", "p09_blue_path", "p09_door_answer", "p09_echo_room", "p09_kind_sleep", "p09_luna_laughs", "p09_star_choice", "p10_free_seed", "p10_funny_ending", "p10_home_seed", "p10_marsh_light", "p10_stone_star", "p10_wren_ending"],
    coverImageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Luna finds a star shell under the oak.", "Burrow finds a tiny map inside it.", "The map shows a round door."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p01_start"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which way first?",
        skillTags: ["luna", "burrow", "star", "shell", "door", "map"],
        choices: [
          { label: "Listen to the shell", nextPageId: "p02_shell_song" },
          { label: "Open the map", nextPageId: "p02_moon_map" },
        ]
      },
      {
        id: "p02_moon_map",
        text: ["They hold the map up to the full moon.", "Silver lines glow across the map.", "The shell glows in the grass."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p02_moon_map"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p02_moon_map"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which way now?",
        skillTags: ["shell", "map"],
        choices: [
          { label: "Follow the silver line", nextPageId: "p03_stream_path" },
          { label: "Follow the roots", nextPageId: "p03_root_path" },
        ]
      },
      {
        id: "p02_shell_song",
        text: ["Burrow holds the shell to his ear.", "It hums.", "\"The shell is singing,\" says Luna."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p02_shell_song"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p02_shell_song"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which hum do they follow?",
        skillTags: ["luna", "burrow", "shell"],
        choices: [
          { label: "The low hum", nextPageId: "p03_root_path" },
          { label: "The bright hum", nextPageId: "p03_stream_path" },
        ]
      },
      {
        id: "p03_root_path",
        text: ["The hum leads them under old roots.", "Gold dots run along the floor.", "Burrow holds the map up."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p03_root_path"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p03_root_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["burrow", "map", "hum", "roots", "gold"],
        choices: [
          { label: "Dig under the roots", nextPageId: "p04_burrow_digs" },
          { label: "Follow the gold dots", nextPageId: "p04_pip_arrives" },
        ]
      },
      {
        id: "p03_stream_path",
        text: ["The Crystal Stream shines blue.", "The map floats over the water.", "Silver arrows shine on it."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p03_stream_path"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p03_stream_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which arrow now?",
        skillTags: ["map", "stream"],
        choices: [
          { label: "Go upstream", nextPageId: "p04_upstream" },
          { label: "Go under the bridge", nextPageId: "p04_bridge_shadow" },
        ]
      },
      {
        id: "p04_upstream",
        text: ["The water jumps over the shining stones.", "Burrow steps out onto the first stone.", "Luna opens both wings."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p04_upstream"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p04_upstream"),
        narrationNeedsRebuild: true,
        choicePrompt: "How do they cross?",
        skillTags: ["luna", "burrow"],
        choices: [
          { label: "Cross the stones", nextPageId: "p05_cross_stones" },
          { label: "Find a boat", nextPageId: "p05_leaf_boat" },
        ]
      },
      {
        id: "p04_bridge_shadow",
        text: ["A white star lies on the wet stones.", "It is not theirs.", "Burrow reaches out one paw."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p04_bridge_shadow"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p04_bridge_shadow"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Burrow do?",
        skillTags: ["burrow", "star"],
        choices: [
          { label: "Pick the star up", nextPageId: "p05_cracked_shell" },
          { label: "Leave it there", nextPageId: "p05_kind_choice" },
        ]
      },
      {
        id: "p04_burrow_digs",
        text: ["Burrow digs under the roots.", "His paw bumps something hard.", "A round stone door sits in the bank."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p04_burrow_digs"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p04_burrow_digs"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["burrow", "door", "roots"],
        choices: [
          { label: "Widen the tunnel", nextPageId: "p06_burrow_catches_map" },
          { label: "Look under the roots", nextPageId: "p05_kind_choice" },
        ]
      },
      {
        id: "p04_pip_arrives",
        text: ["Pip comes down the tunnel with a lantern.", "He kneels beside the map.", "\"I know this door,\" says Pip."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p04_pip_arrives"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p04_pip_arrives"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["door", "map"],
        choices: [
          { label: "Let Pip lead", nextPageId: "p05_pip_leads" },
          { label: "Read the map", nextPageId: "p06_burrow_catches_map" },
        ]
      },
      {
        id: "p05_cracked_shell",
        text: ["Burrow lifts the star out of the water.", "It cracks in his paws.", "Luna says nothing at all."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_cracked_shell"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_cracked_shell"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Burrow do?",
        skillTags: ["luna", "burrow", "star"],
        choices: [
          { label: "Carry it back", nextPageId: "p08_sorry_path" },
          { label: "Hide it", nextPageId: "p06_hidden_door" },
        ]
      },
      {
        id: "p05_cross_stones",
        text: ["The stones are wet and slippery.", "Burrow wobbles on the middle stone.", "Luna spreads both wings and steadies him."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_cross_stones"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_cross_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do they go?",
        skillTags: ["luna", "burrow"],
        choices: [
          { label: "Keep crossing", nextPageId: "p06_burrow_catches_map" },
          { label: "Turn to the roots", nextPageId: "p06_hidden_door" },
        ]
      },
      {
        id: "p05_leaf_boat",
        text: ["They climb into a curled green leaf.", "The leaf floats out across the pond.", "Burrow holds the map. Luna holds the star."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_leaf_boat"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_leaf_boat"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do they row?",
        skillTags: ["luna", "burrow", "star", "map"],
        choices: [
          { label: "Row to the bank", nextPageId: "p06_burrow_catches_map" },
          { label: "Land and call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p05_kind_choice",
        text: ["A white star lies in the roots.", "Luna leaves it where it lies.", "The map glows and a new path opens."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_kind_choice"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_kind_choice"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["luna", "star", "map", "path", "roots"],
        choices: [
          { label: "Go to the door", nextPageId: "p06_hidden_door" },
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p05_pip_leads",
        text: ["Pip holds the lantern high and walks first.", "The gold trail runs along the floor.", "Luna and Burrow keep close."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_pip_leads"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_pip_leads"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["luna", "burrow", "gold"],
        choices: [
          { label: "Follow the lantern", nextPageId: "p06_hidden_door" },
          { label: "Check the map", nextPageId: "p06_burrow_catches_map" },
        ]
      },
      {
        id: "p06_burrow_catches_map",
        text: ["Burrow pops out of a mossy mound.", "He holds the map over his head.", "Luna waits with the star."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_burrow_catches_map"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_burrow_catches_map"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do they go?",
        skillTags: ["luna", "burrow", "star", "map"],
        choices: [
          { label: "Go to the door", nextPageId: "p06_hidden_door" },
          { label: "Follow the new line", nextPageId: "p05_kind_choice" },
        ]
      },
      {
        id: "p06_hidden_door",
        text: ["The round door sits in the roots.", "Burrow pushes it. Luna pushes it.", "It does not move."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_hidden_door"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_hidden_door"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they try?",
        skillTags: ["luna", "burrow", "door", "roots"],
        choices: [
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
          { label: "Go to the stream", nextPageId: "p06_stream_gate" },
        ]
      },
      {
        id: "p06_stream_gate",
        text: ["A crystal gate stands in the stream.", "Tiny stars swim inside it.", "Burrow puts his nose on the crystal."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_stream_gate"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_stream_gate"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["burrow", "stream"],
        choices: [
          { label: "Open the gate", nextPageId: "p07_star_fish" },
          { label: "Go home", nextPageId: "p10_quiet_ending" },
        ]
      },
      {
        id: "p06_wren_warning",
        text: ["Wren runs up with three books.", "\"Old doors open for kind hands,\" she says.", "The smallest book sneezes."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_wren_warning"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_wren_warning"),
        narrationNeedsRebuild: true,
        choicePrompt: "How do they open it?",
        skillTags: ["open"],
        choices: [
          { label: "Let Wren read", nextPageId: "p07_wren_checks" },
          { label: "Use both hands", nextPageId: "p07_door_opens" },
        ]
      },
      {
        id: "p07_wren_checks",
        text: ["Wren opens the smallest book.", "The page says KIND HANDS OPEN THIS DOOR.", "Then she drops the book on her foot."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p07_wren_checks"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p07_wren_checks"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["door", "open"],
        choices: [
          { label: "Use kind hands", nextPageId: "p07_door_opens" },
          { label: "Go home", nextPageId: "p10_quiet_ending" },
        ]
      },
      {
        id: "p07_door_opens",
        text: ["Burrow puts both paws flat on the door.", "The door swings open.", "Blue stars fill the room inside."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p07_door_opens"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p07_door_opens"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["burrow", "door", "open"],
        choices: [
          { label: "Go inside", nextPageId: "p08_map_inside" },
          { label: "Stay outside", nextPageId: "p10_quiet_ending" },
        ]
      },
      {
        id: "p07_star_fish",
        text: ["The gate opens and star fish swim out.", "They swim up the stream.", "Luna and Burrow watch them go."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p07_star_fish"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p07_star_fish"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["luna", "burrow", "star", "stream"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_map_inside",
        text: ["Blue stars hang from the roof.", "Burrow lays the map on the stone table.", "A gold path runs out the far side."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p08_map_inside"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p08_map_inside"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which way now?",
        skillTags: ["burrow", "map", "path", "gold"],
        choices: [
          { label: "Follow the gold path", nextPageId: "p09_gold_path" },
          { label: "Take the map home", nextPageId: "p10_quiet_ending" },
        ]
      },
      {
        id: "p08_sorry_path",
        text: ["Burrow walks back to the bridge alone.", "He picks the cracked star off the path.", "He holds it in both paws."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p08_sorry_path"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p08_sorry_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Burrow do?",
        skillTags: ["burrow", "star", "path"],
        choices: [
          { label: "Set it back", nextPageId: "p05_kind_choice" },
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p09_gold_path",
        text: ["The gold path opens onto a great tree.", "Rabbits and foxes sit under it.", "Luna and Burrow step toward it."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p09_gold_path"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p09_gold_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["luna", "burrow", "path", "gold"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p10_quiet_ending",
        text: ["Luna and Burrow go home.", "The star and the map lie on the moss.", "The round door stays shut tonight."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p10_quiet_ending"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p10_quiet_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["luna", "burrow", "star", "door", "map"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mw_ra_c_04_dewdrop_flint_lost_glow",
    title: "Dewdrop and Flint: The Hidden Glow",
    level: "C",
    ageRange: "Ages 5-6",
    adventureType: "Reading Adventure",
    skillFocus: "Reading a search story; says as the only dialogue tag",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Dewdrop", "Flint", "Wren", "Fern", "Stone"],
    location: "Moonwood - Crystal Stream, Deep Dark, glow cave",
    targetWords: ["Dewdrop", "Flint", "glow", "stream", "dark", "gold", "light", "lantern", "cave", "water", "hiding", "blue"],
    highFrequencyWords: ["and", "the", "says", "out", "up", "with", "his", "her", "them", "down", "one", "of"],
    hfw: ["and", "the", "says", "out", "up", "with", "his", "her", "them", "down", "one", "of"],
    mediaFolder: "dewdrop-flint-lost-glow",
    sentenceFrame: "Flint lifts the lantern. Dewdrop listens to the water. The glow stays hidden.",
    genuineFailurePageId: "p06_lantern_pop",
    retiredPageIds: ["p02_dewdrop_listens", "p03_spark_bush", "p04_fern_garden", "p04_pip_glows", "p04_spark_jar", "p04_upstream_dark", "p04_wren_spell", "p05_crack_path", "p05_fern_clue", "p05_fish_answer", "p05_fish_tunnel", "p05_pip_lamp", "p05_shadow_moth", "p05_spark_water", "p06_burrow_dig", "p06_dewdrop_alone", "p06_dry_path", "p06_pip_mushroom", "p06_stone_guard", "p06_water_answer", "p07_door_question", "p07_dry_crawl", "p07_footprint_voice", "p07_frog_guard", "p07_lantern_crack", "p07_lantern_rolls", "p07_moth_lantern", "p07_moth_thanks", "p07_pip_lamp_big", "p07_pip_sits", "p07_puddle_laugh", "p07_tiny_door", "p07_waiting_room", "p08_crystal_moves", "p08_frog_ending_path", "p08_lantern_light", "p08_pip_proud", "p08_quiet_wait", "p08_safe_promise", "p08_team_pull", "p08_two_crystals", "p08_water_song", "p09_bright_wrong", "p09_everyone_helps", "p09_fern_repairs", "p09_stream_returns", "p09_wren_rule", "p10_frog_ending", "p10_lantern_ending", "p10_pip_ending", "p10_splash_ending", "p10_wren_ending"],
    coverImageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["The little glow is not in the stream tonight.", "Flint holds up his dark lantern.", "\"It is hiding,\" says Dewdrop."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p01_start"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dewdrop", "flint", "glow", "stream", "dark", "lantern", "hiding"],
        choices: [
          { label: "Shake the lantern", nextPageId: "p02_flint_shakes" },
          { label: "Listen to the water", nextPageId: "p03_water_whisper" },
        ]
      },
      {
        id: "p02_flint_shakes",
        text: ["Flint shakes his lantern.", "A gold spark jumps into a bush.", "The bush lights up. The glow is not there."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p02_flint_shakes"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p02_flint_shakes"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where next?",
        skillTags: ["flint", "glow", "gold", "lantern"],
        choices: [
          { label: "Follow the spark", nextPageId: "p03_lantern_path" },
          { label: "Call for Wren", nextPageId: "p03_wren_arrives" },
        ]
      },
      {
        id: "p03_water_whisper",
        text: ["Dewdrop lies flat on the water and listens.", "Rings run out from her.", "\"Something small is down there,\" she says."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p03_water_whisper"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p03_water_whisper"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do they look?",
        skillTags: ["dewdrop", "water"],
        choices: [
          { label: "Look under the stones", nextPageId: "p04_under_stones" },
          { label: "Try the dark trees", nextPageId: "p04_deep_dark_edge" },
        ]
      },
      {
        id: "p03_lantern_path",
        text: ["The stream shines blue all the way down.", "Blue is the water. Gold is the glow.", "Flint lifts the lantern and looks."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p03_lantern_path"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p03_lantern_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where next?",
        skillTags: ["flint", "glow", "stream", "gold", "lantern", "water", "blue"],
        choices: [
          { label: "Try the dark trees", nextPageId: "p04_deep_dark_edge" },
          { label: "Look under the stones", nextPageId: "p04_under_stones" },
        ]
      },
      {
        id: "p03_wren_arrives",
        text: ["Wren runs up with three books.", "\"I have a spell for finding things,\" she says.", "Two books slide out of her arms."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p03_wren_arrives"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p03_wren_arrives"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: [],
        choices: [
          { label: "Follow her smoke", nextPageId: "p05_smoke_arrow" },
          { label: "Wait on the path", nextPageId: "p05_wren_stops" },
        ]
      },
      {
        id: "p04_deep_dark_edge",
        text: ["The trees ahead hold no light.", "Flint stops at the edge of the black.", "Dewdrop floats out in front of him."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p04_deep_dark_edge"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p04_deep_dark_edge"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dewdrop", "flint", "light"],
        choices: [
          { label: "Walk into the dark", nextPageId: "p06_quiet_tree" },
          { label: "Ask Fern", nextPageId: "p05_fern_joins" },
        ]
      },
      {
        id: "p04_under_stones",
        text: ["Dewdrop slips under the water.", "Flint kneels on the flat stone above her.", "Small green lights drift past her hands."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p04_under_stones"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p04_under_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dewdrop", "flint", "water"],
        choices: [
          { label: "Cross the stones", nextPageId: "p07_soft_feet" },
          { label: "Lift the flat stone", nextPageId: "p05_stone_lifts" },
        ]
      },
      {
        id: "p05_smoke_arrow",
        text: ["Green smoke curls up from the path.", "It bends into an arrow.", "The arrow points at the ground."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_smoke_arrow"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_smoke_arrow"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which way now?",
        skillTags: [],
        choices: [
          { label: "Dig where it points", nextPageId: "p06_crack_opens" },
          { label: "Follow the moth", nextPageId: "p06_moth_caught" },
        ]
      },
      {
        id: "p05_stone_lifts",
        text: ["Stone lifts the flat slab off the hole.", "Warm air comes up out of the dark.", "\"Down there,\" says Stone."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_stone_lifts"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_stone_lifts"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dark"],
        choices: [
          { label: "Climb down the hole", nextPageId: "p06_crack_opens" },
          { label: "Look in the crack", nextPageId: "p06_lantern_pop" },
        ]
      },
      {
        id: "p05_fern_joins",
        text: ["Fern holds a big leaf up.", "\"The glow slept in my garden once,\" she says.", "Flint looks at the leaf."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_fern_joins"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_fern_joins"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["flint", "glow"],
        choices: [
          { label: "Take her leaf", nextPageId: "p06_question_path" },
          { label: "Let Fern sing", nextPageId: "p07_fern_song" },
        ]
      },
      {
        id: "p05_wren_stops",
        text: ["Wren says the words in her book.", "A big green mark hangs over the path.", "It does not point anywhere."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_wren_stops"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_wren_stops"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: [],
        choices: [
          { label: "Follow the mark", nextPageId: "p06_question_path" },
          { label: "Turn back", nextPageId: "p06_quiet_tree" },
        ]
      },
      {
        id: "p07_soft_feet",
        text: ["Flint steps out onto the stepping stones.", "Two of them glow gold under his boots.", "He stops on the last one."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_soft_feet"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_soft_feet"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which way now?",
        skillTags: ["flint", "glow", "gold"],
        choices: [
          { label: "Dive down", nextPageId: "p07_water_call" },
          { label: "Follow the trail", nextPageId: "p06_moth_path" },
        ]
      },
      {
        id: "p06_crack_opens",
        text: ["The rock opens into a narrow crack.", "Blue dots mark stones inside it.", "Flint puts both arms out and squeezes in."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_crack_opens"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_crack_opens"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["flint", "blue"],
        choices: [
          { label: "Follow the blue dots", nextPageId: "p06_moth_path" },
          { label: "Slow down", nextPageId: "p06_lantern_pop" },
        ]
      },
      {
        id: "p06_quiet_tree",
        text: ["A huge bare tree stands in the dark.", "Flint crouches down under it with his light.", "Nothing moves."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_quiet_tree"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_quiet_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["flint", "dark", "light"],
        choices: [
          { label: "Sit and wait", nextPageId: "p06_lantern_pop" },
          { label: "Look in the roots", nextPageId: "p06_moth_caught" },
        ]
      },
      {
        id: "p06_lantern_pop",
        text: ["Flint slips and sits down in the water.", "His lantern goes out.", "Dewdrop lifts it up. It stays dark."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_lantern_pop"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_lantern_pop"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dewdrop", "flint", "dark", "lantern", "water"],
        choices: [
          { label: "Take the lantern back", nextPageId: "p06_moth_path" },
          { label: "Follow the moth", nextPageId: "p06_moth_caught" },
        ]
      },
      {
        id: "p06_moth_caught",
        text: ["Flint catches a small dark moth.", "It sits still in his hands.", "Moths know where the glow sleeps."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_moth_caught"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_moth_caught"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["flint", "glow", "dark"],
        choices: [
          { label: "Let the moth go", nextPageId: "p06_moth_path" },
          { label: "Follow it", nextPageId: "p06_question_path" },
        ]
      },
      {
        id: "p06_question_path",
        text: ["A small yellow face peeks out of the bush.", "There is a tiny door behind it.", "The face pops back in."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_question_path"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_question_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: [],
        choices: [
          { label: "Open the tiny door", nextPageId: "p06_glow_cave" },
          { label: "Go to the water", nextPageId: "p07_water_call" },
        ]
      },
      {
        id: "p06_moth_path",
        text: ["A white trail curls through the air.", "It runs into a cave mouth in the moss.", "Warm light sits inside."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_moth_path"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_moth_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["light", "cave"],
        choices: [
          { label: "Go into the cave", nextPageId: "p06_glow_cave" },
          { label: "Go to the water", nextPageId: "p07_water_call" },
        ]
      },
      {
        id: "p06_glow_cave",
        text: ["At the end of the tunnel, warm light.", "The little glow is curled on a mound.", "It is fast asleep."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_glow_cave"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_glow_cave"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["glow", "light"],
        choices: [
          { label: "Wake it up", nextPageId: "p07_glow_wakes" },
          { label: "Let it sleep", nextPageId: "p07_glow_sleeps" },
        ]
      },
      {
        id: "p07_water_call",
        text: ["Flint lies on the bank and reaches down.", "Dewdrop swims up to his hand.", "\"There is a hole down here,\" she says."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_water_call"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_water_call"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dewdrop", "flint"],
        choices: [
          { label: "Dive with Dewdrop", nextPageId: "p07_heavy_crystal" },
          { label: "Wait on the bank", nextPageId: "p06_glow_cave" },
        ]
      },
      {
        id: "p07_heavy_crystal",
        text: ["A white slab lies on the sand.", "Gold light leaks out from under it.", "Dewdrop pushes. The slab does not shift."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_heavy_crystal"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_heavy_crystal"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Dewdrop do?",
        skillTags: ["dewdrop", "gold", "light"],
        choices: [
          { label: "Lift the slab", nextPageId: "p07_glow_wakes" },
          { label: "Call Flint down", nextPageId: "p07_glow_sleeps" },
        ]
      },
      {
        id: "p07_fern_song",
        text: ["Fern stands under the old tree and sings.", "White ribbons of sound run into the hollow.", "The little glow is in there."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_fern_song"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_fern_song"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens?",
        skillTags: ["glow"],
        choices: [
          { label: "Let her finish", nextPageId: "p06_glow_cave" },
          { label: "Look in the hollow", nextPageId: "p06_moth_path" },
        ]
      },
      {
        id: "p07_glow_sleeps",
        text: ["Flint sits down and waits.", "Dewdrop floats above the mound.", "The little glow sleeps on."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_glow_sleeps"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_glow_sleeps"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["dewdrop", "flint", "glow"],
        choices: [
          { label: "Tell it a story", nextPageId: "p08_glow_story" },
          { label: "Say sorry", nextPageId: "p08_sorry_glow" },
        ]
      },
      {
        id: "p07_glow_wakes",
        text: ["The glow wakes up and turns bright gold.", "It rolls to the edge of the mound.", "Flint sits very still."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_glow_wakes"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_glow_wakes"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["flint", "glow", "gold"],
        choices: [
          { label: "Say sorry", nextPageId: "p08_sorry_glow" },
          { label: "Go to the stream", nextPageId: "p10_gentle_ending" },
        ]
      },
      {
        id: "p08_sorry_glow",
        text: ["Flint puts one hand on his chest.", "\"We came in too loud,\" he says.", "The glow rolls a little closer."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p08_sorry_glow"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p08_sorry_glow"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["flint", "glow"],
        choices: [
          { label: "Go to the stream", nextPageId: "p10_gentle_ending" },
          { label: "Let it pick", nextPageId: "p09_glow_chooses" },
        ]
      },
      {
        id: "p08_glow_story",
        text: ["The glow floats up between them.", "Flint and Dewdrop stay in the cave with it.", "The stream keeps its own blue light."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p08_glow_story"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p08_glow_story"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["dewdrop", "flint", "glow", "stream", "light", "cave", "blue"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_glow_chooses",
        text: ["The glow picks a new bend of the stream.", "It leaves a gold trail behind it.", "Flint and Dewdrop let it go."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p09_glow_chooses"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p09_glow_chooses"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["dewdrop", "flint", "glow", "stream", "gold"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p10_gentle_ending",
        text: ["The glow drops back into the stream.", "Gold light runs along the blue water.", "Flint shuts his lantern."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p10_gentle_ending"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p10_gentle_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["flint", "glow", "stream", "gold", "light", "lantern", "water", "blue"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "dp_ra_b_01_chompy_big_lunch_hunt",
    title: "Chompy's Big Lunch Hunt",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a repeating frame with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Chompy", "Sunny", "Grumpy", "Bouncy"],
    location: "Sunny Hollow - Cozy Cave, Berry Bush Corner, Big Flat Rock, Muddy Puddle Pool, Long Meadow",
    targetWords: ["Chompy", "Sunny", "Grumpy", "Bouncy", "lunch", "berries", "berry", "leaf", "leaves", "cave", "rock", "mud", "basket", "grass", "melon", "hat", "path", "hungry"],
    highFrequencyWords: ["I", "a", "am", "and", "can", "go", "in", "is", "it", "not", "on", "said", "see", "the", "to", "you"],
    hfw: ["I", "a", "am", "and", "can", "go", "in", "is", "it", "not", "on", "said", "see", "the", "to", "you"],
    mediaFolder: "chompy-lunch-hunt",
    sentenceFrame: "Chompy can see the ___. \"___,\" said Chompy.",
    genuineFailurePageId: "p05_grumpy_tiny_smile",
    retiredPageIds: ["p04_not_full", "p04_more_food", "p04_leaf_lunch", "p05_mud_face", "p06_tummy_big", "p07_more_please", "p08_star_ending"],
    coverImageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Chompy is hungry. Very hungry.", "\"I can find a big lunch,\" said Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p01_start"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Chompy look?",
        skillTags: ["chompy", "lunch", "hungry"],
        choices: [
          { label: "Red berries", nextPageId: "p02_berries" },
          { label: "Cave door", nextPageId: "p02_cave_door" },
        ]
      },
      {
        id: "p02_berries",
        text: ["Chompy picks red and purple berries.", "Two berries are not a big lunch."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p02_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p02_berries"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy do?",
        skillTags: ["chompy", "berries", "lunch"],
        choices: [
          { label: "Eat two", nextPageId: "p03_eat_berries" },
          { label: "Save some", nextPageId: "p03_save_berries" },
        ]
      },
      {
        id: "p02_cave_door",
        text: ["Chompy can see Sunny by the cave.", "\"I am hungry,\" said Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p02_cave_door"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p02_cave_door"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can Chompy ask?",
        skillTags: ["chompy", "sunny", "cave", "hungry"],
        choices: [
          { label: "Ask Sunny", nextPageId: "p03_ask_sunny" },
          { label: "Sniff the path", nextPageId: "p03_sniff_path" },
        ]
      },
      {
        id: "p03_eat_berries",
        text: ["Chompy has a leaf plate of berries.", "\"I am still hungry,\" said Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_eat_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_eat_berries"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Chompy go?",
        skillTags: ["chompy", "leaf", "berries", "hungry"],
        choices: [
          { label: "Sniff the path", nextPageId: "p03_sniff_path" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p03_save_berries",
        text: ["Chompy puts berries in a leaf basket.", "Plop. Plop. Plop."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_save_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_save_berries"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy do?",
        skillTags: ["chompy", "berries", "leaf", "basket"],
        choices: [
          { label: "Share them", nextPageId: "p04_grumpy_berries" },
          { label: "Go to the rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p03_ask_sunny",
        text: ["Chompy holds out one arm.", "\"Come and eat with me,\" said Sunny."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_ask_sunny"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_ask_sunny"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy take?",
        skillTags: ["chompy", "sunny"],
        choices: [
          { label: "Take the fruit", nextPageId: "p04_sunny_shares" },
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p03_sniff_path",
        text: ["Chompy sniffs the path. Sniff, sniff.", "One way has brown mud on it."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_sniff_path"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_sniff_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which smell can Chompy follow?",
        skillTags: ["chompy", "path", "mud"],
        choices: [
          { label: "Follow the mud", nextPageId: "p04_mud_smell" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p04_mud_smell",
        text: ["Chompy can see wet mud.", "\"Mud is not lunch,\" said Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p04_mud_smell"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p04_mud_smell"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Chompy go?",
        skillTags: ["chompy", "mud", "lunch"],
        choices: [
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p04_sunny_shares",
        text: ["Sunny has fruit. Chompy has berries.", "\"I want a big lunch,\" said Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p04_sunny_shares"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p04_sunny_shares"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they go?",
        skillTags: ["sunny", "chompy", "berries", "lunch"],
        choices: [
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p04_grumpy_berries",
        text: ["Chompy holds up one red berry.", "Grumpy walks over to look."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p04_grumpy_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p04_grumpy_berries"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy do?",
        skillTags: ["chompy", "berry", "grumpy"],
        choices: [
          { label: "Hold it out", nextPageId: "p05_grumpy_tiny_smile" },
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p05_grumpy_tiny_smile",
        text: ["Chompy holds out one purple berry.", "Grumpy does not take it."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p05_grumpy_tiny_smile"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p05_grumpy_tiny_smile"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy do now?",
        skillTags: ["chompy", "berry", "grumpy"],
        choices: [
          { label: "Leave the basket", nextPageId: "p06_grumpy_full" },
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p06_grumpy_full",
        text: ["Chompy leaves the basket by Grumpy.", "Grumpy lies down beside it. Hmph."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p06_grumpy_full"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p06_grumpy_full"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Chompy go?",
        skillTags: ["chompy", "basket", "grumpy"],
        choices: [
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p05_long_meadow",
        text: ["Chompy can see the tall pale grass.", "Something goes boing in the grass."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p05_long_meadow"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p05_long_meadow"),
        narrationNeedsRebuild: true,
        choicePrompt: "What is in the grass?",
        skillTags: ["chompy", "grass"],
        choices: [
          { label: "Look in the grass", nextPageId: "p06_bouncy_lunch" },
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p05_big_flat_rock",
        text: ["Sunny puts fruit on Big Flat Rock.", "Chompy and Grumpy come to eat."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p05_big_flat_rock"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p05_big_flat_rock"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can they start?",
        skillTags: ["sunny", "rock", "chompy", "grumpy"],
        choices: [
          { label: "Eat together", nextPageId: "p06_everyone_eats" },
          { label: "Wait for Bouncy", nextPageId: "p06_bouncy_lunch" },
        ]
      },
      {
        id: "p06_bouncy_lunch",
        text: ["Bouncy leaps in. Boing! Boing!", "Berries go up in the air."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p06_bouncy_lunch"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p06_bouncy_lunch"),
        narrationNeedsRebuild: true,
        choicePrompt: "What falls out?",
        skillTags: ["bouncy", "berries"],
        choices: [
          { label: "Berries fall", nextPageId: "p07_berry_rain" },
          { label: "Leaves fall", nextPageId: "p07_leaf_hat" },
        ]
      },
      {
        id: "p06_everyone_eats",
        text: ["Grumpy eats melon. Bouncy eats banana.", "\"This is a big lunch!\" said Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p06_everyone_eats"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p06_everyone_eats"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy say?",
        skillTags: ["grumpy", "melon", "bouncy", "lunch", "chompy"],
        artAction: "re-render",
        artNote: "Same four-pal picnic on the big flat rock with the watermelon and banana slices, but Bouncy drawn with three-toed feet above his coil springs instead of bare footless spring tips.",
        choices: [
          { label: "Say thank you", nextPageId: "p08_thank_you_ending" },
          { label: "Make a hat", nextPageId: "p07_leaf_hat" },
        ]
      },
      {
        id: "p07_berry_rain",
        text: ["Chompy tips a leaf basket over.", "Red and purple berries pour out."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p07_berry_rain"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p07_berry_rain"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["chompy", "leaf", "basket", "berries"],
        choices: [
          { label: "Wash them", nextPageId: "p08_berry_mess_ending" },
          { label: "Say thank you", nextPageId: "p08_thank_you_ending" },
        ]
      },
      {
        id: "p07_leaf_hat",
        text: ["Chompy wears a big green leaf.", "Sunny points at the floppy hat."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p07_leaf_hat"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p07_leaf_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Chompy do?",
        skillTags: ["chompy", "leaf", "sunny", "hat"],
        choices: [
          { label: "Wear it", nextPageId: "p08_leaf_hat_ending" },
          { label: "Say thank you", nextPageId: "p08_thank_you_ending" },
        ]
      },
      {
        id: "p08_thank_you_ending",
        text: ["\"Thank you,\" said Chompy.", "Grumpy and Bouncy eat with Sunny."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p08_thank_you_ending"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p08_thank_you_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["chompy", "grumpy", "bouncy", "sunny"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_berry_mess_ending",
        text: ["Purple berries go splat on the rock.", "\"Look at that,\" said Bouncy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p08_berry_mess_ending"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p08_berry_mess_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["berries", "rock", "bouncy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_leaf_hat_ending",
        text: ["Chompy eats berries in the leaf hat.", "Sunny laughs. The sun goes down."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p08_leaf_hat_ending"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p08_leaf_hat_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["chompy", "berries", "leaf", "hat", "sunny"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "dp_ra_b_02_sunnys_rainy_day_rescue",
    title: "Sunny's Rainy Day Rescue",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a wet-and-dry pattern with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Sunny", "Grumpy", "Dozy", "Wiggly"],
    location: "Sunny Hollow - Muddy Puddle Pool, Big Flat Rock, Cozy Cave, Fernwood forest",
    targetWords: ["Sunny", "Grumpy", "Dozy", "Wiggly", "rain", "puddle", "mud", "wet", "dry", "leaf", "cave", "pillow", "tail", "boat", "rainbow", "splash", "nap", "rock"],
    highFrequencyWords: ["I", "a", "and", "can", "in", "is", "it", "on", "one", "said", "see", "the", "up", "want"],
    hfw: ["I", "a", "and", "can", "in", "is", "it", "on", "one", "said", "see", "the", "up", "want"],
    mediaFolder: "sunny-rainy-rescue",
    sentenceFrame: "___ is wet. \"I want a dry ___,\" said ___.",
    genuineFailurePageId: "p05_grumpy_splash",
    retiredPageIds: ["p04_wait", "p05_honky_rain", "p06_grumpy_ears", "p06_leaf_rain", "p06_dozy_again"],
    coverImageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Rain, rain, rain on Sunny Hollow.", "Grumpy is wet. Dozy is wet."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p01_start"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who needs help first?",
        skillTags: ["rain", "grumpy", "dozy", "wet"],
        choices: [
          { label: "Go to Grumpy", nextPageId: "p02_grumpy" },
          { label: "Go to Dozy", nextPageId: "p02_dozy" },
        ]
      },
      {
        id: "p02_grumpy",
        text: ["Rain drips off Grumpy's back.", "\"I want a dry place,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p02_grumpy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p02_grumpy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Sunny look?",
        skillTags: ["rain", "grumpy", "dry"],
        choices: [
          { label: "Big rock", nextPageId: "p03_dry_rock" },
          { label: "Cozy Cave", nextPageId: "p03_cozy_cave" },
        ]
      },
      {
        id: "p02_dozy",
        text: ["Dozy hugs a wet blue pillow.", "\"I want a dry nap,\" said Dozy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p02_dozy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p02_dozy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Sunny do?",
        skillTags: ["dozy", "pillow", "wet", "dry", "nap"],
        choices: [
          { label: "Cozy Cave", nextPageId: "p03_cozy_cave" },
          { label: "Find a leaf", nextPageId: "p03_puddle" },
        ]
      },
      {
        id: "p03_dry_rock",
        text: ["The big rock is wet too.", "\"Not that one,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p03_dry_rock"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p03_dry_rock"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Sunny look now?",
        skillTags: ["rock", "wet", "grumpy"],
        choices: [
          { label: "Try the cave", nextPageId: "p03_cozy_cave" },
          { label: "Try the puddle", nextPageId: "p03_puddle" },
        ]
      },
      {
        id: "p03_cozy_cave",
        text: ["Cozy Cave is warm and dry.", "Dozy smiles on the blue pillow."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p03_cozy_cave"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p03_cozy_cave"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can Sunny get?",
        skillTags: ["cave", "dry", "dozy", "pillow"],
        choices: [
          { label: "Get Grumpy", nextPageId: "p04_cave_grumpy" },
          { label: "Someone walks by", nextPageId: "p04_wiggly_tail" },
        ]
      },
      {
        id: "p03_puddle",
        text: ["Sunny can see a big puddle.", "A broad leaf is by the puddle."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p03_puddle"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p03_puddle"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Sunny do?",
        skillTags: ["sunny", "puddle", "leaf"],
        choices: [
          { label: "Jump in", nextPageId: "p04_splash" },
          { label: "Hold the leaf up", nextPageId: "p05_leaf_roof" },
        ]
      },
      {
        id: "p04_splash",
        text: ["Sunny jumps. SPLASH!", "Mud goes up and up and up."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p04_splash"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p04_splash"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who gets the mud?",
        skillTags: ["sunny", "mud", "splash"],
        choices: [
          { label: "Splash Grumpy", nextPageId: "p05_grumpy_splash" },
          { label: "Splash Dozy", nextPageId: "p05_dozy_splash" },
        ]
      },
      {
        id: "p04_cave_grumpy",
        text: ["Grumpy comes into Cozy Cave.", "Drip, drip goes the club tail."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p04_cave_grumpy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p04_cave_grumpy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can help Grumpy?",
        skillTags: ["grumpy", "cave", "tail"],
        choices: [
          { label: "Find a big leaf", nextPageId: "p05_leaf_roof" },
          { label: "Someone walks by", nextPageId: "p04_wiggly_tail" },
        ]
      },
      {
        id: "p04_wiggly_tail",
        text: ["Wiggly walks past the big puddle.", "The long tail swishes in the water."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p04_wiggly_tail"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p04_wiggly_tail"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does the tail do?",
        skillTags: ["wiggly", "puddle", "tail"],
        choices: [
          { label: "Big wave", nextPageId: "p05_tail_wave" },
          { label: "Leaf falls down", nextPageId: "p05_leaf_roof" },
        ]
      },
      {
        id: "p05_grumpy_splash",
        text: ["Mud hits Grumpy. SPLAT!", "Grumpy opens both eyes very wide."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_grumpy_splash"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_grumpy_splash"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Sunny do?",
        skillTags: ["mud", "grumpy"],
        choices: [
          { label: "Say sorry", nextPageId: "p06_sorry_grumpy" },
          { label: "Follow Grumpy", nextPageId: "p06_grumpy_dry" },
        ]
      },
      {
        id: "p05_dozy_splash",
        text: ["Mud lands by the blue pillow.", "\"Oh no!\" said Dozy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_dozy_splash"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_dozy_splash"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Sunny do?",
        skillTags: ["mud", "pillow", "dozy"],
        choices: [
          { label: "Dry the pillow", nextPageId: "p06_dozy_dry" },
          { label: "Make a leaf roof", nextPageId: "p05_leaf_roof" },
        ]
      },
      {
        id: "p05_tail_wave",
        text: ["Wiggly stands in the wide puddle.", "Sunny looks at the long curving tail."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_tail_wave"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_tail_wave"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they make?",
        skillTags: ["wiggly", "puddle", "sunny", "tail"],
        choices: [
          { label: "Make a leaf boat", nextPageId: "p07_leaf_boat" },
          { label: "Everyone splash", nextPageId: "p07_everyone_puddle" },
        ]
      },
      {
        id: "p05_leaf_roof",
        text: ["Sunny holds a big leaf up.", "The rain taps on the leaf."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_leaf_roof"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_leaf_roof"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can go under it?",
        skillTags: ["sunny", "leaf", "rain"],
        choices: [
          { label: "Grumpy sits under", nextPageId: "p06_grumpy_dry" },
          { label: "Dozy sits under", nextPageId: "p06_dozy_dry" },
        ]
      },
      {
        id: "p06_sorry_grumpy",
        text: ["\"Sorry,\" said Sunny.", "Sunny holds out a broad green leaf."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_sorry_grumpy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_sorry_grumpy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Sunny do?",
        skillTags: ["sunny", "leaf"],
        choices: [
          { label: "Make a leaf roof", nextPageId: "p06_grumpy_dry" },
          { label: "Wait for Grumpy", nextPageId: "p06_grumpy_smile" },
        ]
      },
      {
        id: "p06_grumpy_dry",
        text: ["Grumpy sits under a leaf shelter.", "\"This is better,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_grumpy_dry"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_grumpy_dry"),
        narrationNeedsRebuild: true,
        choicePrompt: "Can they go outside?",
        skillTags: ["grumpy", "leaf"],
        choices: [
          { label: "Go outside", nextPageId: "p07_everyone_puddle" },
          { label: "Stay dry", nextPageId: "p08_quiet_ending" },
        ]
      },
      {
        id: "p06_dozy_dry",
        text: ["Dozy sleeps on a dry pillow.", "The cave is warm and quiet."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_dozy_dry"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_dozy_dry"),
        narrationNeedsRebuild: true,
        choicePrompt: "Can they wake Dozy?",
        skillTags: ["dozy", "dry", "pillow", "cave"],
        choices: [
          { label: "Let him nap", nextPageId: "p08_quiet_ending" },
          { label: "Go outside", nextPageId: "p07_everyone_puddle" },
        ]
      },
      {
        id: "p06_grumpy_smile",
        text: ["Grumpy comes out of the cave.", "Sunny waits in the rain."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_grumpy_smile"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_grumpy_smile"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they try?",
        skillTags: ["grumpy", "cave", "sunny", "rain"],
        choices: [
          { label: "Everyone splash", nextPageId: "p07_everyone_puddle" },
          { label: "Make a leaf boat", nextPageId: "p07_leaf_boat" },
        ]
      },
      {
        id: "p07_leaf_boat",
        text: ["Sunny makes a boat from a leaf.", "It floats to Grumpy in the sun."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p07_leaf_boat"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p07_leaf_boat"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where does the boat go?",
        skillTags: ["sunny", "boat", "leaf", "grumpy"],
        choices: [
          { label: "The boat floats", nextPageId: "p08_rainbow_ending" },
          { label: "Sail it to Grumpy", nextPageId: "p08_grumpy_laugh_ending" },
        ]
      },
      {
        id: "p07_everyone_puddle",
        text: ["Grumpy splashes in the big puddle.", "Splash! Splash! Sunny jumps in too."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p07_everyone_puddle"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p07_everyone_puddle"),
        narrationNeedsRebuild: true,
        choicePrompt: "What comes next?",
        skillTags: ["grumpy", "splash", "puddle", "sunny"],
        choices: [
          { label: "The sun comes out", nextPageId: "p08_rainbow_ending" },
          { label: "Grumpy laughs", nextPageId: "p08_grumpy_laugh_ending" },
        ]
      },
      {
        id: "p08_rainbow_ending",
        text: ["Grumpy and Dozy look up at the sun.", "\"Look! A rainbow,\" said Sunny."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p08_rainbow_ending"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p08_rainbow_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy", "dozy", "rainbow", "sunny"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_grumpy_laugh_ending",
        text: ["Dozy watches Grumpy splash in the puddle.", "\"That is fun,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p08_grumpy_laugh_ending"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p08_grumpy_laugh_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["dozy", "grumpy", "splash", "puddle"],
        artAction: "re-render",
        artNote: "Same rainbow-sky meadow with Sunny laughing and Grumpy splashing in the shallow puddle, but add Dozy lying on the grass at the puddle's edge with his blue polka-dot pillow, watching them.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_quiet_ending",
        text: ["Dozy naps. Grumpy lies down too.", "One lamp glows. Rain drips outside."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p08_quiet_ending"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p08_quiet_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["dozy", "nap", "grumpy", "rain"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "dp_ra_b_03_grumpy_almost_good_day",
    title: "Grumpy's Almost-Good Day",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a repeating action frame with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Grumpy", "Chompy", "Wiggly", "Fancy", "Dozy", "Bouncy", "Sunny"],
    location: "Sunny Hollow - berry bush, stream, stones, sunny path",
    targetWords: ["Grumpy", "Chompy", "Wiggly", "Fancy", "Dozy", "Bouncy", "Sunny", "stream", "bush", "berry", "berries", "stone", "stones", "twig", "tail", "path", "wet", "nap", "hmph", "fish"],
    highFrequencyWords: ["a", "and", "at", "do", "go", "I", "in", "is", "not", "of", "on", "one", "said", "the", "this", "up"],
    hfw: ["a", "and", "at", "do", "go", "I", "in", "is", "not", "of", "on", "one", "said", "the", "this", "up"],
    mediaFolder: "grumpy-almost-good-day",
    sentenceFrame: "Grumpy ___ the ___. \"___,\" said Grumpy.",
    genuineFailurePageId: "p04_ignore_chompy",
    retiredPageIds: ["p05_chompy_delight", "p06_fish_jumps", "p06_warm_sun", "p07_peaceful_stream", "p07_berry_everywhere", "p08_stone_ending"],
    coverImageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Grumpy wakes up under the bush.", "One brown twig lies on the sand."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p01_start"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can help first?",
        skillTags: ["grumpy", "bush", "twig"],
        choices: [
          { label: "Go to the stream", nextPageId: "p02_stream" },
          { label: "Stay in the bush", nextPageId: "p02_bush" },
        ]
      },
      {
        id: "p02_stream",
        text: ["Grumpy stomps to the cool stream.", "The water runs over four grey feet."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p02_stream"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p02_stream"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Grumpy do?",
        skillTags: ["grumpy", "stream"],
        choices: [
          { label: "Sit in the water", nextPageId: "p03_chompy_finds" },
          { label: "Step out", nextPageId: "p03_stones_fall" },
        ]
      },
      {
        id: "p03_chompy_finds",
        text: ["Grumpy stands in the cold stream.", "Chompy sits on the bank."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_chompy_finds"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_chompy_finds"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Grumpy say?",
        skillTags: ["grumpy", "stream", "chompy"],
        choices: [
          { label: "Splash together", nextPageId: "p04_splash_chompy" },
          { label: "Tell Chompy to go", nextPageId: "p04_ignore_chompy" },
        ]
      },
      {
        id: "p04_ignore_chompy",
        text: ["\"Go away,\" said Grumpy.", "Chompy sits on the far bank."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_ignore_chompy"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_ignore_chompy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Grumpy do?",
        skillTags: ["grumpy", "chompy"],
        choices: [
          { label: "Sit in the quiet", nextPageId: "p05_quiet_stream" },
          { label: "Ask Chompy to play", nextPageId: "p04_splash_chompy" },
        ]
      },
      {
        id: "p04_splash_chompy",
        text: ["Grumpy swings the club tail. SPLASH!", "Chompy puts both arms up. HA!"],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_splash_chompy"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_splash_chompy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who comes next?",
        skillTags: ["grumpy", "tail", "chompy"],
        choices: [
          { label: "A pal walks by", nextPageId: "p06_wiggly_splash" },
          { label: "Sit and watch", nextPageId: "p05_quiet_stream" },
        ]
      },
      {
        id: "p05_quiet_stream",
        text: ["A little fish jumps in the stream.", "Chompy does not say one word."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_quiet_stream"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_quiet_stream"),
        narrationNeedsRebuild: true,
        choicePrompt: "What do they do?",
        skillTags: ["fish", "stream", "chompy"],
        choices: [
          { label: "A pal walks by", nextPageId: "p06_wiggly_splash" },
          { label: "Watch the fish", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p06_wiggly_splash",
        text: ["Wiggly walks into the stream.", "The long tail makes one big wave."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_wiggly_splash"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_wiggly_splash"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens now?",
        skillTags: ["wiggly", "stream", "tail"],
        choices: [
          { label: "One big wave", nextPageId: "p07_all_soaked" },
          { label: "Step back", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p07_all_soaked",
        text: ["Grumpy is wet. Chompy is wet.", "One drip lands on Grumpy's nose."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_all_soaked"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_all_soaked"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Grumpy do?",
        skillTags: ["grumpy", "chompy", "wet"],
        artAction: "re-render",
        artNote: "Same three-pal shallow pool with Chompy, Grumpy and Wiggly dripping, but relit into the book's golden sunrise with clear sky and no rain falling.",
        choices: [
          { label: "No more waves", nextPageId: "p08_soaked_ending" },
          { label: "Do it again", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p08_soaked_ending",
        text: ["Grumpy drips. Chompy drips. Wiggly drips.", "\"No more waves,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_soaked_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_soaked_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy", "chompy", "wiggly"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p03_stones_fall",
        text: ["Grumpy swings the club tail.", "Grey stones tumble down. Clatter!"],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_stones_fall"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_stones_fall"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Grumpy do?",
        skillTags: ["grumpy", "tail", "stones"],
        choices: [
          { label: "Look at the stones", nextPageId: "p04_look_at_stones" },
          { label: "Back in the water", nextPageId: "p03_chompy_finds" },
        ]
      },
      {
        id: "p04_look_at_stones",
        text: ["Grumpy looks down at the flat stones.", "Not one is standing up."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_look_at_stones"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_look_at_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Grumpy do?",
        skillTags: ["grumpy", "stones"],
        choices: [
          { label: "Go and tell", nextPageId: "p05_fancy_stones" },
          { label: "Start stacking", nextPageId: "p06_rebuild_stones" },
        ]
      },
      {
        id: "p05_fancy_stones",
        text: ["\"I bump the stones,\" said Grumpy.", "Fancy looks at the flat grey stones."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_fancy_stones"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_fancy_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["grumpy", "stones", "fancy"],
        choices: [
          { label: "Build it together", nextPageId: "p06_rebuild_stones" },
          { label: "Set the top stone", nextPageId: "p07_tower_rebuilt" },
        ]
      },
      {
        id: "p06_rebuild_stones",
        text: ["Grumpy nudges one flat stone up.", "Fancy leans in and holds it."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_rebuild_stones"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_rebuild_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["grumpy", "stone", "fancy"],
        choices: [
          { label: "Set the top stone", nextPageId: "p07_tower_rebuilt" },
          { label: "Sit in the sun", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p07_tower_rebuilt",
        text: ["The stone tower is tall again.", "\"One more on top,\" said Fancy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_tower_rebuilt"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_tower_rebuilt"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["stone", "fancy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p02_bush",
        text: ["Grumpy stays under the berry bush.", "Now the twig is gone."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p02_bush"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p02_bush"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can help?",
        skillTags: ["grumpy", "berry", "bush", "twig"],
        choices: [
          { label: "Eat one berry", nextPageId: "p03_berry_protest" },
          { label: "Look at the twigs", nextPageId: "p03_list_making" },
        ]
      },
      {
        id: "p03_berry_protest",
        text: ["Grumpy opens up for a purple berry.", "\"That is good,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_berry_protest"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_berry_protest"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Grumpy do?",
        skillTags: ["grumpy", "berry"],
        choices: [
          { label: "Eat them all", nextPageId: "p04_eat_secretly" },
          { label: "Play a berry game", nextPageId: "p04_berry_throw" },
        ]
      },
      {
        id: "p03_list_making",
        text: ["Grumpy looks at one brown twig.", "\"I do not like this day,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_list_making"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_list_making"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can help?",
        skillTags: ["grumpy", "twig"],
        artAction: "re-render",
        artNote: "Grumpy lying under the berry bush at sunrise, scowling at one brown twig on the sand in front of his face - no lettered leaf, no list, and his front claw drawn as an ordinary claw rather than a pencil point.",
        choices: [
          { label: "Ask for help", nextPageId: "p04_tell_sunny" },
          { label: "Eat one berry", nextPageId: "p03_berry_protest" },
        ]
      },
      {
        id: "p04_eat_secretly",
        text: ["Grumpy eats and does not look up.", "Dozy lies down beside the bush."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_eat_secretly"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_eat_secretly"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Grumpy do?",
        skillTags: ["grumpy", "dozy", "bush"],
        artAction: "re-render",
        artNote: "Same sunrise berry-bush frame with Grumpy over his leaf bowl of berries, but Dozy drawn lying with his chin resting on the blue pillow on the ground, not with the cushion sitting on his back like a saddle.",
        choices: [
          { label: "Show Dozy the bowl", nextPageId: "p05_dozy_finds" },
          { label: "Hide the bowl", nextPageId: "p07_grumpy_naps" },
        ]
      },
      {
        id: "p05_dozy_finds",
        text: ["Dozy sleeps on a blue pillow.", "Grumpy does not move one bit."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_dozy_finds"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_dozy_finds"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["dozy", "grumpy"],
        choices: [
          { label: "Nap too", nextPageId: "p07_grumpy_naps" },
          { label: "Sit very still", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p07_grumpy_naps",
        text: ["Grumpy shuts both eyes by Dozy.", "The bush is warm and still."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_grumpy_naps"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_grumpy_naps"),
        narrationNeedsRebuild: true,
        choicePrompt: "What next?",
        skillTags: ["grumpy", "dozy", "bush"],
        choices: [
          { label: "Wake up", nextPageId: "p08_nap_ending" },
          { label: "Nap all day", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p08_nap_ending",
        text: ["Grumpy opens both eyes. Dozy sleeps on.", "\"A good nap,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_nap_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_nap_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy", "dozy", "nap"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p04_berry_throw",
        text: ["Grumpy folds a green leaf basket.", "Bouncy bounces over on two springs."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_berry_throw"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_berry_throw"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can they play?",
        skillTags: ["grumpy", "bouncy"],
        choices: [
          { label: "Take turns", nextPageId: "p05_bouncy_berries" },
          { label: "Tail bat", nextPageId: "p06_berry_chaos" },
        ]
      },
      {
        id: "p05_bouncy_berries",
        text: ["Bouncy bounces. Plop! Plop! Plop!", "The leaf basket fills up with berries."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_bouncy_berries"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_bouncy_berries"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["bouncy", "berries"],
        choices: [
          { label: "Tail bat", nextPageId: "p06_berry_chaos" },
          { label: "Stop the game", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p06_berry_chaos",
        text: ["Berries go everywhere. Plop! Plop! Plop!", "One berry sits on Grumpy's snout. Hmph."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_berry_chaos"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_berry_chaos"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens now?",
        skillTags: ["berries", "berry", "grumpy", "hmph"],
        artAction: "re-render",
        artNote: "Same sunrise berry-bush frame but with the leaf basket knocked over and red berries scattered across the sand, Bouncy caught mid-bounce above them, and one berry balanced on Grumpy's snout.",
        choices: [
          { label: "Pick them all up", nextPageId: "p08_almost_ending" },
          { label: "Ask for help", nextPageId: "p04_tell_sunny" },
        ]
      },
      {
        id: "p04_tell_sunny",
        text: ["Sunny sits down beside the berry bush.", "Grumpy looks at one brown twig."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_tell_sunny"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_tell_sunny"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Sunny do?",
        skillTags: ["sunny", "berry", "bush", "grumpy", "twig"],
        artAction: "re-render",
        artNote: "Grumpy lying under the berry bush at sunrise looking at one brown twig on the sand, Sunny sitting beside him in her leaf cape - no lettered leaf, no list, no pencil-point claw.",
        choices: [
          { label: "Move the twig", nextPageId: "p05_sunny_helps" },
          { label: "Wait a bit", nextPageId: "p07_one_thing_done" },
        ]
      },
      {
        id: "p05_sunny_helps",
        text: ["The twig lies in front of Grumpy.", "Sunny looks at it too."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_sunny_helps"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_sunny_helps"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["twig", "grumpy", "sunny"],
        choices: [
          { label: "Push it off", nextPageId: "p06_twig_fixed" },
          { label: "Leave it", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p07_one_thing_done",
        text: ["Sunny walks off down the sandy path.", "The path is wide and empty."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_one_thing_done"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_one_thing_done"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Grumpy do?",
        skillTags: ["sunny", "path"],
        choices: [
          { label: "Look at the path", nextPageId: "p08_almost_ending" },
          { label: "Walk on the path", nextPageId: "p06_twig_fixed" },
        ]
      },
      {
        id: "p06_twig_fixed",
        text: ["The twig is off the path.", "\"Now I can walk,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_twig_fixed"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_twig_fixed"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["twig", "path", "grumpy"],
        artAction: "re-render",
        artNote: "A clear sandy path at sunrise with the brown twig pushed well off to one side and Grumpy walking down the open path alone - no lettered leaf, no strikethrough, no pencil-point claw.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_almost_ending",
        text: ["Grumpy lies in the golden light.", "\"Not bad,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_almost_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_almost_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy"],
        artAction: "re-render",
        artNote: "Grumpy lying under the berry bush in golden sunset light with a face visibly different from page one - heavy brow lifted, one corner of the mouth up, eyes half closed.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "dp_ra_b_04_bouncy_big_bounce",
    title: "Bouncy's Big Bounce",
    level: "B",
    ageRange: "Ages 5-6",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading a bouncing action pattern with two changing words",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Bouncy", "Chompy", "Grumpy", "Fancy", "Dozy", "Wiggly"],
    location: "Sunny Hollow - berry bush corner, cozy cave, stream, big flat rock",
    targetWords: ["Bouncy", "Chompy", "Grumpy", "Fancy", "Dozy", "Wiggly", "bounce", "boing", "berries", "berry", "bush", "basket", "cave", "moss", "pillow", "mud", "rock", "leaf", "ferns", "branch", "tail", "stone"],
    highFrequencyWords: ["a", "all", "and", "can", "I", "in", "is", "it", "like", "look", "not", "on", "one", "said", "the", "up"],
    hfw: ["a", "all", "and", "can", "I", "in", "is", "it", "like", "look", "not", "on", "one", "said", "the", "up"],
    mediaFolder: "bouncy-big-bounce",
    sentenceFrame: "Bouncy bounces to the ___. Boing! ___ goes up.",
    genuineFailurePageId: "p05_legs_give_up",
    retiredPageIds: ["p04_nearly_there", "p05_launched_out", "p06_dozy_wide_awake", "p06_fancy_dismay", "p06_over_stream", "p06_bouncy_launched", "p07_bouncy_repairs", "p07_grumpy_sticky", "p07_grumpy_stream"],
    coverImageUrl: dinoPalsImagePath("bouncy-big-bounce", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Bouncy bounces out of the cave.", "\"I can bounce all day,\" said Bouncy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p01_start"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Bouncy bounce?",
        skillTags: ["bouncy", "bounce", "cave"],
        choices: [
          { label: "Berry Bush Corner", nextPageId: "p02_berry_corner" },
          { label: "Cozy Cave", nextPageId: "p02_cozy_cave" },
        ]
      },
      {
        id: "p02_berry_corner",
        text: ["Bouncy bounces to the berry bush.", "Chompy cannot reach the top berries."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p02_berry_corner"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p02_berry_corner"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do?",
        skillTags: ["bouncy", "berry", "bush", "chompy", "berries"],
        choices: [
          { label: "Help Chompy", nextPageId: "p03_help_chompy" },
          { label: "Go round fast", nextPageId: "p03_too_fast" },
        ]
      },
      {
        id: "p03_help_chompy",
        text: ["Chompy holds up a green leaf bowl.", "Bouncy looks at the high branch."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_help_chompy"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_help_chompy"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can Bouncy help?",
        skillTags: ["chompy", "leaf", "bouncy", "branch"],
        choices: [
          { label: "One big bounce", nextPageId: "p04_big_bounce" },
          { label: "Small bounces", nextPageId: "p04_careful_bounce" },
        ]
      },
      {
        id: "p04_big_bounce",
        text: ["Bouncy does one enormous bounce.", "Up, up, up go the berries!"],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_big_bounce"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_big_bounce"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where do the berries go?",
        skillTags: ["bouncy", "bounce", "berries"],
        choices: [
          { label: "Berries come down", nextPageId: "p05_berries_fly" },
          { label: "Bounce again", nextPageId: "p05_legs_give_up" },
        ]
      },
      {
        id: "p04_careful_bounce",
        text: ["Bouncy does small bounces. Boing. Boing.", "Three berries drop into the bowl."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_careful_bounce"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_careful_bounce"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["bouncy", "boing", "berries"],
        choices: [
          { label: "Ask for help", nextPageId: "p06_chompy_catches" },
          { label: "Bounce again", nextPageId: "p05_legs_give_up" },
        ]
      },
      {
        id: "p05_berries_fly",
        text: ["The berries come down like rain.", "Chompy holds the leaf bowl up."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_berries_fly"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_berries_fly"),
        narrationNeedsRebuild: true,
        choicePrompt: "What about the last berries?",
        skillTags: ["berries", "chompy", "leaf"],
        choices: [
          { label: "Ask for help", nextPageId: "p06_chompy_catches" },
          { label: "Bounce again", nextPageId: "p05_legs_give_up" },
        ]
      },
      {
        id: "p05_legs_give_up",
        text: ["Bouncy flops into the ferns. No boing.", "Round red berries roll everywhere."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_legs_give_up"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_legs_give_up"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do?",
        skillTags: ["bouncy", "ferns", "boing", "berries"],
        artAction: "re-render",
        artNote: "Same fern bank and scattered whole red berries, but Bouncy drawn sprawled flat in the ferns with both coil springs splayed and slack and no motion arc, and Chompy staring rather than laughing.",
        choices: [
          { label: "Pick them up", nextPageId: "p06_everyone_sticky" },
          { label: "Ask for help", nextPageId: "p06_chompy_catches" },
        ]
      },
      {
        id: "p06_chompy_catches",
        text: ["Grumpy lies down with a broad leaf.", "Berries roll on. One. Two. Three."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_chompy_catches"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_chompy_catches"),
        narrationNeedsRebuild: true,
        choicePrompt: "What does Grumpy do?",
        skillTags: ["grumpy", "leaf", "berries"],
        choices: [
          { label: "One on the nose", nextPageId: "p07_grumpy_nose" },
          { label: "Tidy the sand", nextPageId: "p06_everyone_sticky" },
        ]
      },
      {
        id: "p06_everyone_sticky",
        text: ["Berries lie all over the sand.", "Bouncy picks them up one by one."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_everyone_sticky"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_everyone_sticky"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do next?",
        skillTags: ["berries", "bouncy"],
        choices: [
          { label: "Fill the basket", nextPageId: "p07_grumpy_nose" },
          { label: "Eat by the bush", nextPageId: "p08_berry_ending" },
        ]
      },
      {
        id: "p07_grumpy_nose",
        text: ["A leaf bowl sits on Grumpy's back.", "Bouncy and Chompy laugh and laugh."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_grumpy_nose"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_grumpy_nose"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they rest?",
        skillTags: ["leaf", "grumpy", "bouncy", "chompy"],
        choices: [
          { label: "Share the basket", nextPageId: "p08_berry_ending" },
          { label: "Go to the rock", nextPageId: "p08_rock_ending" },
        ]
      },
      {
        id: "p03_too_fast",
        text: ["Bouncy goes very, very fast.", "The path splits by a muddy puddle."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_too_fast"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_too_fast"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Bouncy land?",
        skillTags: ["bouncy", "mud"],
        choices: [
          { label: "Land in the leaves", nextPageId: "p04_bush_crash" },
          { label: "Land in the mud", nextPageId: "p04_puddle_bounce" },
        ]
      },
      {
        id: "p04_bush_crash",
        text: ["Bouncy lands in the soft leaves.", "Chompy points. Berries roll on the path."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_bush_crash"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_bush_crash"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can help the bush?",
        skillTags: ["bouncy", "chompy", "berries"],
        choices: [
          { label: "Get some help", nextPageId: "p05_fancy_bush_hit" },
          { label: "Plant it again", nextPageId: "p07_new_bush" },
        ]
      },
      {
        id: "p05_fancy_bush_hit",
        text: ["A bent branch lies on the ground.", "\"I want it tall again,\" said Fancy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_fancy_bush_hit"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_fancy_bush_hit"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["branch", "fancy"],
        choices: [
          { label: "Plant it again", nextPageId: "p07_new_bush" },
          { label: "Pick up the berries", nextPageId: "p08_berry_ending" },
        ]
      },
      {
        id: "p07_new_bush",
        text: ["Bouncy and Fancy plant the bush again.", "It stands up in dark brown soil."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_new_bush"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_new_bush"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do now?",
        skillTags: ["bouncy", "fancy", "bush"],
        choices: [
          { label: "Name the bush", nextPageId: "p08_fancy_ending" },
          { label: "Share the berries", nextPageId: "p08_berry_ending" },
        ]
      },
      {
        id: "p04_puddle_bounce",
        text: ["SPLASH! Bouncy lands in the mud.", "Mud goes up and up and up."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_puddle_bounce"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_puddle_bounce"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Bouncy go?",
        skillTags: ["bouncy", "mud"],
        choices: [
          { label: "Get some water", nextPageId: "p05_mud_everywhere" },
          { label: "Ask for help", nextPageId: "p06_fancy_mud_sail" },
        ]
      },
      {
        id: "p05_mud_everywhere",
        text: ["Bouncy tips water on the mud.", "Fancy waits by a heap of moss."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_mud_everywhere"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_mud_everywhere"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they clean first?",
        skillTags: ["bouncy", "mud", "fancy", "moss"],
        choices: [
          { label: "Clean the sail", nextPageId: "p06_fancy_mud_sail" },
          { label: "Big Flat Rock", nextPageId: "p08_rock_ending" },
        ]
      },
      {
        id: "p06_fancy_mud_sail",
        text: ["Bouncy tips water into a bowl.", "Fancy has mud on the big sail."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_fancy_mud_sail"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_fancy_mud_sail"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can they finish?",
        skillTags: ["bouncy", "fancy", "mud"],
        choices: [
          { label: "Big Flat Rock", nextPageId: "p08_rock_ending" },
          { label: "Back to the bush", nextPageId: "p08_berry_ending" },
        ]
      },
      {
        id: "p02_cozy_cave",
        text: ["Cozy Cave is dim and warm.", "Dozy sleeps on a blue pillow."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p02_cozy_cave"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p02_cozy_cave"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can Bouncy go past?",
        skillTags: ["cave", "dozy", "pillow"],
        choices: [
          { label: "Tiptoe past", nextPageId: "p03_tiptoe_out" },
          { label: "One tiny bounce", nextPageId: "p03_bounce_inside" },
        ]
      },
      {
        id: "p03_tiptoe_out",
        text: ["Bouncy tiptoes past the blue pillow.", "Left foot. Right foot. No boing."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_tiptoe_out"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_tiptoe_out"),
        narrationNeedsRebuild: true,
        choicePrompt: "Can Bouncy get out?",
        skillTags: ["bouncy", "pillow", "boing"],
        choices: [
          { label: "Step on a pebble", nextPageId: "p04_pebble_trip" },
          { label: "Keep tiptoeing", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p03_bounce_inside",
        text: ["Bouncy tries one tiny bounce. Boing.", "BOING! goes the big cave echo."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_bounce_inside"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_bounce_inside"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do?",
        skillTags: ["bouncy", "bounce", "boing", "cave"],
        choices: [
          { label: "Step on the moss", nextPageId: "p04_cave_chaos" },
          { label: "Hold still", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p04_pebble_trip",
        text: ["A little grey pebble goes tink.", "Dozy opens one sleepy eye."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_pebble_trip"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_pebble_trip"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do?",
        skillTags: ["dozy"],
        choices: [
          { label: "Get help", nextPageId: "p05_wiggly_enters" },
          { label: "Dozy wakes up", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p04_cave_chaos",
        text: ["Bouncy bounces on the green moss.", "POOF! Dust goes up. Dozy sleeps on."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_cave_chaos"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_cave_chaos"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can help Bouncy?",
        skillTags: ["bouncy", "moss", "dozy"],
        choices: [
          { label: "Get help", nextPageId: "p05_wiggly_enters" },
          { label: "Dozy wakes up", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p05_cave_echo",
        text: ["Dozy opens both eyes. Bouncy stops.", "\"Who is bouncing?\" said Dozy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_cave_echo"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_cave_echo"),
        narrationNeedsRebuild: true,
        choicePrompt: "What happens next?",
        skillTags: ["dozy", "bouncy"],
        choices: [
          { label: "Stop bouncing", nextPageId: "p07_dozy_advice" },
          { label: "Get help", nextPageId: "p05_wiggly_enters" },
        ]
      },
      {
        id: "p05_wiggly_enters",
        text: ["Wiggly puts the long tail down.", "Bouncy holds on and stands still."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_wiggly_enters"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_wiggly_enters"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["wiggly", "tail", "bouncy"],
        choices: [
          { label: "Tail rail", nextPageId: "p07_big_flat_rock" },
          { label: "Rest on the moss", nextPageId: "p07_dozy_advice" },
        ]
      },
      {
        id: "p07_dozy_advice",
        text: ["Bouncy stops. One. Two. Three. Four.", "Dozy shuts both eyes again."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_dozy_advice"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_dozy_advice"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do now?",
        skillTags: ["bouncy", "dozy"],
        choices: [
          { label: "Ten quiet seconds", nextPageId: "p08_rock_ending" },
          { label: "Go to the stream", nextPageId: "p08_stream_ending" },
        ]
      },
      {
        id: "p07_big_flat_rock",
        text: ["Bouncy lands on Big Flat Rock.", "\"Look at me,\" said Bouncy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_big_flat_rock"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_big_flat_rock"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["bouncy", "rock"],
        artAction: "re-render",
        artNote: "Same cheering group on the big flat grey rock at sunburst, but Bouncy's legs drawn complete - three-toed feet above each coil spring, planted on the stone, with no bare footless spring tips.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_berry_ending",
        text: ["The basket is full of red berries.", "\"Best berry team,\" said Chompy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p08_berry_ending"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p08_berry_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["basket", "berries", "berry", "chompy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_fancy_ending",
        text: ["The bush is not the same.", "\"I like it,\" said Fancy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p08_fancy_ending"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p08_fancy_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["bush", "fancy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_stream_ending",
        text: ["Bouncy stands on a stepping stone.", "\"Good bounce,\" said Grumpy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p08_stream_ending"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p08_stream_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["bouncy", "stone", "bounce", "grumpy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_rock_ending",
        text: ["Chompy and Wiggly sit on the rock.", "\"A very big bounce,\" said Bouncy."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p08_rock_ending"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p08_rock_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["chompy", "wiggly", "rock", "bounce", "bouncy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "story_quest_short_a_sam_pam_01",
    title: "Sam and Pam and the Cat",
    level: "Early",
    ageRange: "Ages 4-5",
    adventureType: "Decodable Story",
    skillFocus: "Short a CVC words and Fry 1-25 high frequency words",
    cycleFocus: "short a CVC + HFW 1-25",
    characters: ["Sam", "Pam", "Dad"],
    location: "Home lawn and the van",
    targetWords: ["Sam", "Pam", "Dad", "am", "cat", "mat", "bag", "map", "van", "jam", "has", "pats", "bad"],
    highFrequencyWords: ["I", "a", "the", "is", "in", "on", "and", "at", "it"],
    hfw: ["I", "a", "the", "is", "in", "on", "and", "at", "it"],
    mediaFolder: "sam-pam",
    sentenceFrame: "___ has the ___.",
    genuineFailurePageId: "page-05",
    coverImageUrl: samPamImagePath(1),
    wordCards: [{ word: "bag", imageUrl: samPamWordImagePath("bag") }, { word: "cat", imageUrl: samPamWordImagePath("cat") }, { word: "jam", imageUrl: samPamWordImagePath("jam") }, { word: "map", imageUrl: samPamWordImagePath("map") }, { word: "mat", imageUrl: samPamWordImagePath("mat") }, { word: "van", imageUrl: samPamWordImagePath("van") }],
    startPageId: "page-01",
    pages: [
      {
        id: "page-01",
        text: ["I am Sam.", "I am Pam."],
        imageUrl: samPamImagePath(1),
        audioUrl: samPamAudioPath(1),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["sam", "pam", "am"],
        choices: [
          { label: "The map", nextPageId: "page-02" },
          { label: "The cat", nextPageId: "page-03" },
        ]
      },
      {
        id: "page-02",
        text: ["Dad has a map.", "Pam has a bag."],
        imageUrl: samPamImagePath(2),
        audioUrl: samPamAudioPath(2),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["pam", "dad", "bag", "map", "has"],
        choices: [
          { label: "The bag", nextPageId: "page-04" },
          { label: "The cat", nextPageId: "page-03" },
        ]
      },
      {
        id: "page-03",
        text: ["Pam pats the cat.", "Sam has a mat."],
        imageUrl: samPamImagePath(3),
        audioUrl: samPamAudioPath(3),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["sam", "pam", "cat", "mat", "has", "pats"],
        choices: [
          { label: "The map", nextPageId: "page-05" },
          { label: "The bag", nextPageId: "page-04" },
        ]
      },
      {
        id: "page-04",
        text: ["Pam has jam.", "Jam is in the bag."],
        imageUrl: samPamImagePath(4),
        audioUrl: samPamAudioPath(4),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["pam", "bag", "jam", "has"],
        choices: [
          { label: "The mat", nextPageId: "page-06" },
          { label: "Pat the bag", nextPageId: "page-07" },
        ]
      },
      {
        id: "page-05",
        text: ["A cat is on the map.", "Bad cat!"],
        imageUrl: samPamImagePath(5),
        audioUrl: samPamAudioPath(5),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["cat", "map", "bad"],
        choices: [
          { label: "The mat", nextPageId: "page-06" },
          { label: "The bag", nextPageId: "page-04" },
        ]
      },
      {
        id: "page-06",
        text: ["The map is on the mat."],
        imageUrl: samPamImagePath(6),
        audioUrl: samPamAudioPath(6),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["mat", "map"],
        choices: [
          { label: "Dad and the map", nextPageId: "page-08" },
          { label: "The van", nextPageId: "page-10" },
        ]
      },
      {
        id: "page-07",
        text: ["The bag has jam.", "Sam pats it."],
        imageUrl: samPamImagePath(7),
        audioUrl: samPamAudioPath(7),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["sam", "bag", "jam", "has", "pats"],
        choices: [
          { label: "Dad and the map", nextPageId: "page-08" },
          { label: "The mat", nextPageId: "page-06" },
        ]
      },
      {
        id: "page-08",
        text: ["Dad has the map.", "Sam has the bag."],
        imageUrl: samPamImagePath(8),
        audioUrl: samPamAudioPath(8),
        narrationNeedsRebuild: true,
        choicePrompt: "What now?",
        skillTags: ["sam", "dad", "bag", "map", "has"],
        choices: [
          { label: "The van", nextPageId: "page-10" },
          { label: "Pam and the cat", nextPageId: "page-09" },
        ]
      },
      {
        id: "page-09",
        text: ["Sam and Pam at the van.", "A cat!"],
        imageUrl: samPamImagePath(9),
        audioUrl: samPamAudioPath(9),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["sam", "pam", "cat", "van"],
        choices: [
          { label: "Read again", nextPageId: "page-01" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "page-10",
        text: ["Sam, Pam and a cat.", "In the van!"],
        imageUrl: samPamImagePath(10),
        audioUrl: samPamAudioPath(10),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["sam", "pam", "cat", "van"],
        choices: [
          { label: "Read again", nextPageId: "page-01" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mp_ra_a_01_muddy_splashy_missing_hat",
    title: "Muddy and Splashy: The Missing Hat",
    level: "A",
    ageRange: "Ages 4-5",
    adventureType: "Reading Adventure",
    skillFocus: "One repeating frame; naming what a thing is not",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Muddy", "Splashy", "Clucky"],
    location: "Sunny Meadow Farm - mud wallow, duck pond, farmyard, big red barn",
    targetWords: ["hat", "mud", "muddy", "pond", "wet", "stick", "leaf", "boot", "frog"],
    highFrequencyWords: ["a", "is", "not", "the", "in", "on", "and", "up", "has", "no"],
    hfw: ["a", "is", "not", "the", "in", "on", "and", "up", "has", "no"],
    mediaFolder: "muddy-splashy-hat",
    sentenceFrame: "A ___ is not the hat.",
    genuineFailurePageId: "p08_clucky_grumpy",
    retiredPageIds: ["p03_mud_pat", "p03_water_splash", "p04_mud_search", "p04_pond_search", "p05_grumpy_boot", "p06_big_splash", "p07_clucky_wet_hat", "p08_hat_on_clucky"],
    coverImageUrl: meadowPalsImagePath("muddy-splashy-hat", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Clucky has no hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p01_start"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can the hat be?",
        skillTags: ["hat"],
        choices: [
          { label: "Look in the mud", nextPageId: "p02_muddy" },
          { label: "Look in the pond", nextPageId: "p02_splashy" },
        ]
      },
      {
        id: "p02_muddy",
        text: ["Muddy looks in the mud."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p02_muddy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p02_muddy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Muddy do?",
        skillTags: ["mud"],
        choices: [
          { label: "Dig in the mud", nextPageId: "p04_stick" },
          { label: "Go get Splashy", nextPageId: "p03_meet_splashy" },
        ]
      },
      {
        id: "p02_splashy",
        text: ["Splashy looks in the pond."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p02_splashy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p02_splashy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Splashy do?",
        skillTags: ["pond"],
        choices: [
          { label: "Look in the reeds", nextPageId: "p04_leaf" },
          { label: "Go get Muddy", nextPageId: "p03_meet_splashy" },
        ]
      },
      {
        id: "p04_stick",
        text: ["A stick is not the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p04_stick"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p04_stick"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Muddy do?",
        skillTags: ["stick", "hat"],
        choices: [
          { label: "Dig one more time", nextPageId: "p04_hat_found_early" },
          { label: "Go get Splashy", nextPageId: "p03_meet_splashy" },
        ]
      },
      {
        id: "p04_leaf",
        text: ["A leaf is not the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p04_leaf"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p04_leaf"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Splashy do?",
        skillTags: ["leaf", "hat"],
        choices: [
          { label: "Go get Muddy", nextPageId: "p03_meet_splashy" },
          { label: "Look by the reeds", nextPageId: "p05_frog" },
        ]
      },
      {
        id: "p04_hat_found_early",
        text: ["The hat is in the mud."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p04_hat_found_early"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p04_hat_found_early"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Muddy do?",
        skillTags: ["hat", "mud"],
        choices: [
          { label: "Wash the hat", nextPageId: "p07_wash_hat" },
          { label: "Go to Clucky", nextPageId: "p07_clucky_muddy_hat" },
        ]
      },
      {
        id: "p03_meet_splashy",
        text: ["Muddy and Splashy look together."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p03_meet_splashy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p03_meet_splashy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they look?",
        skillTags: [],
        artAction: "re-render",
        artNote: "Same meeting shot of Muddy and Splashy on the mud edge, but delete the blank two-board signpost at far left; a lettered-looking prop with no letters on it stops beginning readers.",
        choices: [
          { label: "In the mud", nextPageId: "p05_boot" },
          { label: "In the pond", nextPageId: "p05_frog" },
        ]
      },
      {
        id: "p05_boot",
        text: ["A boot is not the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p05_boot"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p05_boot"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they look?",
        skillTags: ["boot", "hat"],
        choices: [
          { label: "Dig in the mud", nextPageId: "p06_hat_muddy" },
          { label: "Go to the pond", nextPageId: "p06_hat_wet" },
        ]
      },
      {
        id: "p05_frog",
        text: ["A frog is not the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p05_frog"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p05_frog"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they look?",
        skillTags: ["frog", "hat"],
        choices: [
          { label: "Look past the frog", nextPageId: "p05_frog_ask" },
          { label: "Look in the reeds", nextPageId: "p06_hat_wet" },
        ]
      },
      {
        id: "p05_frog_ask",
        text: ["The frog sits by the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p05_frog_ask"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p05_frog_ask"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["frog", "hat"],
        choices: [
          { label: "Get the hat", nextPageId: "p06_hat_wet" },
          { label: "Fan it dry", nextPageId: "p07_dry_hat" },
        ]
      },
      {
        id: "p06_hat_muddy",
        text: ["Mud is on the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p06_hat_muddy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p06_hat_muddy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["mud", "hat"],
        choices: [
          { label: "Wash the hat", nextPageId: "p07_wash_hat" },
          { label: "Go to Clucky", nextPageId: "p07_clucky_muddy_hat" },
        ]
      },
      {
        id: "p06_hat_wet",
        text: ["The hat is in the pond."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p06_hat_wet"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p06_hat_wet"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["hat", "pond"],
        choices: [
          { label: "Fan the hat", nextPageId: "p07_dry_hat" },
          { label: "Go to Clucky", nextPageId: "p09_pond_ending" },
        ]
      },
      {
        id: "p07_wash_hat",
        text: ["The mud comes off the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p07_wash_hat"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p07_wash_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["mud", "hat"],
        choices: [
          { label: "Go to Clucky", nextPageId: "p09_mud_ending" },
          { label: "Go to the pond", nextPageId: "p09_pond_ending" },
        ]
      },
      {
        id: "p07_dry_hat",
        text: ["Splashy fans the wet hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p07_dry_hat"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p07_dry_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["wet", "hat"],
        choices: [
          { label: "Go to Clucky", nextPageId: "p09_pond_ending" },
          { label: "Put it on Muddy", nextPageId: "p08_hat_on_muddy" },
        ]
      },
      {
        id: "p07_clucky_muddy_hat",
        text: ["Clucky sees the muddy hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p07_clucky_muddy_hat"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p07_clucky_muddy_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Clucky do?",
        skillTags: ["muddy", "hat"],
        choices: [
          { label: "Wash it first", nextPageId: "p07_wash_hat" },
          { label: "Put it on now", nextPageId: "p08_clucky_grumpy" },
        ]
      },
      {
        id: "p08_clucky_grumpy",
        text: ["The hat is still muddy."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p08_clucky_grumpy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p08_clucky_grumpy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do now?",
        skillTags: ["hat", "muddy"],
        choices: [
          { label: "Wash it now", nextPageId: "p07_wash_hat" },
          { label: "Take it off Clucky", nextPageId: "p08_hat_on_muddy" },
        ]
      },
      {
        id: "p08_hat_on_muddy",
        text: ["The hat is on Muddy."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p08_hat_on_muddy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p08_hat_on_muddy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Muddy do?",
        skillTags: ["hat"],
        choices: [
          { label: "Give it back", nextPageId: "p09_pond_ending" },
          { label: "Show the pals", nextPageId: "p09_fancy_muddy_ending" },
        ]
      },
      {
        id: "p09_mud_ending",
        text: ["Mud goes up and up."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p09_mud_ending"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p09_mud_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["mud"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_pond_ending",
        text: ["Splashy goes in the pond."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p09_pond_ending"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p09_pond_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["pond"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_fancy_muddy_ending",
        text: ["Muddy has the red hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p09_fancy_muddy_ending"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p09_fancy_muddy_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["hat"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mp_ra_a_02_shy_cuddly_quiet_adventure",
    title: "Shy and Cuddly: Up in the Tree",
    level: "A",
    ageRange: "Ages 4-5",
    adventureType: "Reading Adventure",
    skillFocus: "One repeating frame; reading position words from the picture",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Shy", "Cuddly", "Bouncy"],
    location: "Sunny Meadow Farm - big red barn, big oak tree, flower meadow",
    targetWords: ["barn", "tree", "branch", "bird", "daisy", "hug", "hugs", "paw", "grass", "waves"],
    highFrequencyWords: ["a", "is", "the", "to", "by", "up", "at", "on", "and", "for", "in"],
    hfw: ["a", "is", "the", "to", "by", "up", "at", "on", "and", "for", "in"],
    mediaFolder: "shy-cuddly-quiet",
    sentenceFrame: "Shy is ___.",
    genuineFailurePageId: "p04_call_shy",
    retiredPageIds: ["p03_stay_still", "p03_barn_look", "p04_quiet_tiny", "p04_say_hi_tiny", "p04_wait_quietly", "p05_cuddly_arrives", "p05_sit_together", "p05_tiny_tree", "p07_tiny_waits", "p09_quiet_ending", "p09_tree_happy_ending"],
    coverImageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Shy waves to Cuddly."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p01_start"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who will you go with?",
        skillTags: ["waves"],
        choices: [
          { label: "Go with Shy", nextPageId: "p02_shy" },
          { label: "Go with Cuddly", nextPageId: "p02_cuddly" },
        ]
      },
      {
        id: "p02_shy",
        text: ["Shy is by the barn."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p02_shy"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p02_shy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Shy do?",
        skillTags: ["barn"],
        choices: [
          { label: "Peek out", nextPageId: "p03_peek" },
          { label: "Wait by the barn", nextPageId: "p04_call_shy" },
        ]
      },
      {
        id: "p02_cuddly",
        text: ["Cuddly looks for Shy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p02_cuddly"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p02_cuddly"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Cuddly look?",
        skillTags: [],
        choices: [
          { label: "By the barn", nextPageId: "p04_call_shy" },
          { label: "By the tree", nextPageId: "p03_tree_look" },
        ]
      },
      {
        id: "p03_peek",
        text: ["Bouncy goes past the barn."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p03_peek"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p03_peek"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Shy do?",
        skillTags: ["barn"],
        choices: [
          { label: "Wave a little", nextPageId: "p04_little_wave" },
          { label: "Step back", nextPageId: "p04_hide_again" },
        ]
      },
      {
        id: "p04_hide_again",
        text: ["Bouncy rolls a daisy to Shy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p04_hide_again"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p04_hide_again"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Shy do?",
        skillTags: ["daisy"],
        choices: [
          { label: "Wave a little", nextPageId: "p04_little_wave" },
          { label: "Go to the tree", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p04_little_wave",
        text: ["Shy waves to Bouncy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p04_little_wave"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p04_little_wave"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Shy go?",
        skillTags: ["waves"],
        choices: [
          { label: "To the barn", nextPageId: "p04_call_shy" },
          { label: "To the tree", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p04_call_shy",
        text: ["Cuddly is too loud."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p04_call_shy"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p04_call_shy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Cuddly do now?",
        skillTags: [],
        choices: [
          { label: "Wait a bit", nextPageId: "p08_barn_hug" },
          { label: "Go to the tree", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p03_tree_look",
        text: ["Cuddly looks up at the tree."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p03_tree_look"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p03_tree_look"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Cuddly do?",
        skillTags: ["tree"],
        choices: [
          { label: "Sit under it", nextPageId: "p04_tree_sit" },
          { label: "Look up", nextPageId: "p04_tree_look_up" },
        ]
      },
      {
        id: "p04_tree_sit",
        text: ["A bird sits in the tree."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p04_tree_sit"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p04_tree_sit"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Cuddly see?",
        skillTags: ["bird", "tree"],
        choices: [
          { label: "Look at the bird", nextPageId: "p05_bird" },
          { label: "Look in the leaves", nextPageId: "p04_tree_look_up" },
        ]
      },
      {
        id: "p04_tree_look_up",
        text: ["Shy is up in the tree."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p04_tree_look_up"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p04_tree_look_up"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Cuddly do?",
        skillTags: ["tree"],
        choices: [
          { label: "Call up to Shy", nextPageId: "p06_tree_find_shy" },
          { label: "Sit and wait", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p05_bird",
        text: ["Shy is by the bird."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p05_bird"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p05_bird"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Cuddly do?",
        skillTags: ["bird"],
        choices: [
          { label: "Call up to Shy", nextPageId: "p06_tree_find_shy" },
          { label: "Wait on the grass", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p06_tree_find_shy",
        text: ["Cuddly looks up at Shy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p06_tree_find_shy"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p06_tree_find_shy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Cuddly do?",
        skillTags: [],
        choices: [
          { label: "Go up too", nextPageId: "p07_tree_up" },
          { label: "Wait on the grass", nextPageId: "p07_tree_under" },
        ]
      },
      {
        id: "p06_go_to_tree",
        text: ["Shy is at the tree."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p06_go_to_tree"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p06_go_to_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they sit?",
        skillTags: ["tree"],
        choices: [
          { label: "On the grass", nextPageId: "p07_tree_under" },
          { label: "Up on the branch", nextPageId: "p07_tree_up" },
        ]
      },
      {
        id: "p07_tree_up",
        text: ["Shy is up on the branch."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p07_tree_up"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p07_tree_up"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Shy do?",
        skillTags: ["branch"],
        choices: [
          { label: "Wave from up high", nextPageId: "p08_wave_from_tree" },
          { label: "Go down and hug", nextPageId: "p08_tree_hug" },
        ]
      },
      {
        id: "p07_tree_under",
        text: ["Shy is on the grass."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p07_tree_under"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p07_tree_under"),
        narrationNeedsRebuild: true,
        choicePrompt: "How close will Shy sit?",
        skillTags: ["grass"],
        choices: [
          { label: "Have a hug", nextPageId: "p08_tree_hug" },
          { label: "Sit a bit apart", nextPageId: "p08_tree_purr" },
        ]
      },
      {
        id: "p08_tree_hug",
        text: ["Shy and Cuddly hug."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_tree_hug"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_tree_hug"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do now?",
        skillTags: ["hug"],
        choices: [
          { label: "Go up and wave", nextPageId: "p08_wave_from_tree" },
          { label: "Rest on the grass", nextPageId: "p08_tree_purr" },
        ]
      },
      {
        id: "p08_barn_hug",
        text: ["Cuddly holds up one paw."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_barn_hug"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_barn_hug"),
        narrationNeedsRebuild: true,
        choicePrompt: "Does Shy want a hug?",
        skillTags: ["paw"],
        choices: [
          { label: "Yes please", nextPageId: "p09_soft_hug_ending" },
          { label: "Not yet", nextPageId: "p09_almost_hug_ending" },
        ]
      },
      {
        id: "p08_tree_purr",
        text: ["Cuddly naps by Shy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_tree_purr"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_tree_purr"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: [],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_wave_from_tree",
        text: ["Shy waves from up high."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_wave_from_tree"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_wave_from_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["waves"],
        artAction: "re-render",
        artNote: "Same busy group shot of Shy and Cuddly waving from the low branch with Bouncy below, but reattach Bouncy's raised coil-spring leg to her body; it currently reads as detached and floating.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_soft_hug_ending",
        text: ["Shy hugs Cuddly."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p09_soft_hug_ending"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p09_soft_hug_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["hugs"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_almost_hug_ending",
        text: ["Shy is a bit away."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p09_almost_hug_ending"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p09_almost_hug_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: [],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mp_ra_a_03_bouncy_speedy_fast_map",
    title: "Bouncy and Speedy: Go to the Big Tree",
    level: "A",
    ageRange: "Ages 4-5",
    adventureType: "Reading Adventure",
    skillFocus: "One repeating frame; place words and following a route",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Bouncy", "Speedy", "Tiny", "Grumpy", "Splashy"],
    location: "Sunny Meadow Farm - farmyard, barn, duck pond, big hill, big oak tree",
    targetWords: ["map", "barn", "pond", "hill", "tree", "mud", "muddy", "boot", "snack", "path", "dirt"],
    highFrequencyWords: ["a", "is", "the", "to", "go", "in", "up", "at", "by", "has", "no"],
    hfw: ["a", "is", "the", "to", "go", "in", "up", "at", "by", "has", "no"],
    mediaFolder: "bouncy-speedy-map",
    sentenceFrame: "Go to the ___.",
    genuineFailurePageId: "p04_too_fast",
    retiredPageIds: ["p05_grumpy_wet", "p09_race_ending"],
    coverImageUrl: meadowPalsImagePath("bouncy-speedy-map", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Here is a map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p01_start"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who will you go with?",
        skillTags: ["map"],
        choices: [
          { label: "Go with Bouncy", nextPageId: "p02_bouncy" },
          { label: "Go with Speedy", nextPageId: "p02_speedy" },
        ]
      },
      {
        id: "p02_bouncy",
        text: ["Bouncy hops with the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p02_bouncy"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p02_bouncy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Bouncy go?",
        skillTags: ["map"],
        choices: [
          { label: "To the barn", nextPageId: "p03_barn" },
          { label: "To the pond", nextPageId: "p03_pond" },
        ]
      },
      {
        id: "p02_speedy",
        text: ["Speedy runs with the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p02_speedy"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p02_speedy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Speedy go?",
        skillTags: ["map"],
        choices: [
          { label: "To the barn", nextPageId: "p03_barn_fast" },
          { label: "To the hill", nextPageId: "p03_hill_fast" },
        ]
      },
      {
        id: "p03_barn",
        text: ["Go to the barn."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_barn"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_barn"),
        narrationNeedsRebuild: true,
        choicePrompt: "What is by the barn?",
        skillTags: ["barn"],
        choices: [
          { label: "Ask Tiny", nextPageId: "p04_tiny_map" },
          { label: "Look at the boot", nextPageId: "p04_boot" },
        ]
      },
      {
        id: "p03_pond",
        text: ["Go to the pond."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_pond"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_pond"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do?",
        skillTags: ["pond"],
        choices: [
          { label: "Shake the map", nextPageId: "p04_map_splash" },
          { label: "Go to the duck", nextPageId: "p04_splashy_help" },
        ]
      },
      {
        id: "p03_barn_fast",
        text: ["The map goes up."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_barn_fast"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_barn_fast"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Speedy do?",
        skillTags: ["map"],
        choices: [
          { label: "Get the map", nextPageId: "p04_map_caught" },
          { label: "Run on", nextPageId: "p04_too_fast" },
        ]
      },
      {
        id: "p03_hill_fast",
        text: ["Go to the hill."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_hill_fast"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_hill_fast"),
        narrationNeedsRebuild: true,
        choicePrompt: "Can Speedy stop?",
        skillTags: ["hill"],
        choices: [
          { label: "Stop now", nextPageId: "p04_speedy_stops" },
          { label: "Run on", nextPageId: "p04_too_fast" },
        ]
      },
      {
        id: "p04_tiny_map",
        text: ["Tiny looks at the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_tiny_map"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_tiny_map"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they go?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "The mud way", nextPageId: "p05_muddy_map" },
        ]
      },
      {
        id: "p04_boot",
        text: ["A big boot is here."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_boot"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_boot"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who has the big boot?",
        skillTags: ["boot"],
        choices: [
          { label: "Go to Grumpy", nextPageId: "p05_grumpy_boot" },
          { label: "Go to the tree", nextPageId: "p05_big_tree" },
        ]
      },
      {
        id: "p04_map_splash",
        text: ["Splash. Grumpy is wet."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_map_splash"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_map_splash"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Bouncy do?",
        skillTags: [],
        choices: [
          { label: "Hold up the map", nextPageId: "p05_bouncy_wet" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p04_splashy_help",
        text: ["Splashy holds the map flat."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_splashy_help"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_splashy_help"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they go?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "The mud way", nextPageId: "p05_muddy_map" },
        ]
      },
      {
        id: "p04_map_caught",
        text: ["Speedy has the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_map_caught"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_map_caught"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Speedy go?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Sit and wait", nextPageId: "p05_speedy_waits" },
        ]
      },
      {
        id: "p04_too_fast",
        text: ["Speedy has no map now."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_too_fast"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_too_fast"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Speedy do?",
        skillTags: ["map"],
        choices: [
          { label: "Look in the mud", nextPageId: "p05_muddy_map" },
          { label: "Sit and wait", nextPageId: "p05_speedy_waits" },
        ]
      },
      {
        id: "p04_speedy_stops",
        text: ["Bouncy hops past Speedy."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_speedy_stops"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_speedy_stops"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Speedy do?",
        skillTags: [],
        choices: [
          { label: "Go to the tree", nextPageId: "p05_big_tree" },
          { label: "Sit and wait", nextPageId: "p05_speedy_waits" },
        ]
      },
      {
        id: "p05_grumpy_boot",
        text: ["Grumpy has a big boot."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_grumpy_boot"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_grumpy_boot"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they go?",
        skillTags: ["boot"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p05_bouncy_wet",
        text: ["Bouncy holds up the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_bouncy_wet"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_bouncy_wet"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they go?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p05_speedy_waits",
        text: ["Speedy sits by the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_speedy_waits"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_speedy_waits"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they go?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p05_muddy_map",
        text: ["The map is in the mud."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_muddy_map"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_muddy_map"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can get the map?",
        skillTags: ["map", "mud"],
        choices: [
          { label: "Bouncy can", nextPageId: "p06_bouncy_muddy" },
          { label: "Speedy can", nextPageId: "p06_speedy_muddy" },
        ]
      },
      {
        id: "p05_big_tree",
        text: ["Go to the big tree."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_big_tree"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_big_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "What is at the tree?",
        skillTags: ["tree"],
        choices: [
          { label: "Look at the X", nextPageId: "p07_tree_stop" },
          { label: "Look at the farm", nextPageId: "p08_farm_view" },
        ]
      },
      {
        id: "p06_bouncy_muddy",
        text: ["Bouncy is muddy now."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p06_bouncy_muddy"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p06_bouncy_muddy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["muddy"],
        choices: [
          { label: "Look at the map", nextPageId: "p07_tree_stop" },
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
        ]
      },
      {
        id: "p06_speedy_muddy",
        text: ["Grumpy looks at the mud."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p06_speedy_muddy"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p06_speedy_muddy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["mud"],
        choices: [
          { label: "Look at the map", nextPageId: "p07_tree_stop" },
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
        ]
      },
      {
        id: "p06_lost_again",
        text: ["The path goes two ways."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p06_lost_again"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p06_lost_again"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["path"],
        choices: [
          { label: "Look at the map", nextPageId: "p07_tree_stop" },
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
        ]
      },
      {
        id: "p07_tree_stop",
        text: ["The X is in the dirt."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p07_tree_stop"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p07_tree_stop"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["dirt"],
        choices: [
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
          { label: "Look at the farm", nextPageId: "p08_farm_view" },
        ]
      },
      {
        id: "p08_tiny_snack",
        text: ["Tiny has a little snack."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p08_tiny_snack"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p08_tiny_snack"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["snack"],
        choices: [
          { label: "Share it here", nextPageId: "p09_tiny_snack_ending" },
          { label: "Go home", nextPageId: "p09_home_ending" },
        ]
      },
      {
        id: "p08_farm_view",
        text: ["The barn is on the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p08_farm_view"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p08_farm_view"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["barn", "map"],
        artAction: "re-render",
        artNote: "Same wide shot of Bouncy and Speedy under the oak with the barn and pond small in the distance, but give Bouncy the open map in her hoof-hands and separate the two bodies so Speedy has exactly one tail.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_home_ending",
        text: ["The map takes them home."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p09_home_ending"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p09_home_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["map"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_tiny_snack_ending",
        text: ["The map is by the snack."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p09_tiny_snack_ending"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p09_tiny_snack_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["map", "snack"],
        artAction: "re-render",
        artNote: "Same shot of Bouncy, Tiny and Speedy sharing the small red snack under the oak, but add the folded paper map lying open on the grass beside Tiny.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  },
  {
    id: "mp_ra_a_04_brave_tiny_big_little_rescue",
    title: "Brave and Tiny: The Little Rescue",
    level: "A",
    ageRange: "Ages 4-5",
    adventureType: "Reading Adventure",
    skillFocus: "One repeating frame; in, on, up, down",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Brave", "Tiny", "Woolly", "Clucky"],
    location: "Sunny Meadow Farm - big barn, stone wall, flower pot, hay bale, little stream",
    targetWords: ["hat", "bell", "pot", "wall", "stream", "wool", "stone", "stones", "hay", "feather", "thread", "string", "grass"],
    highFrequencyWords: ["a", "is", "the", "in", "on", "up", "down", "out", "and", "no", "not", "has", "can"],
    hfw: ["a", "is", "the", "in", "on", "up", "down", "out", "and", "no", "not", "has", "can"],
    mediaFolder: "brave-tiny-rescue",
    sentenceFrame: "The ___ is in the ___.",
    genuineFailurePageId: "p05_brave_stuck",
    retiredPageIds: ["p04_under_wool", "p05_feather_back", "p05_feather_brave", "p09_helpful_ending"],
    coverImageUrl: meadowPalsImagePath("brave-tiny-rescue", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["A hat and a bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p01_start"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who will you help?",
        skillTags: ["hat", "bell"],
        choices: [
          { label: "Go with Brave", nextPageId: "p02_brave" },
          { label: "Go with Tiny", nextPageId: "p02_tiny" },
        ]
      },
      {
        id: "p02_brave",
        text: ["Brave sees a red thread."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p02_brave"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p02_brave"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Brave look?",
        skillTags: ["thread"],
        choices: [
          { label: "In the pot", nextPageId: "p03_pot" },
          { label: "On the wall", nextPageId: "p03_wall" },
        ]
      },
      {
        id: "p02_tiny",
        text: ["Woolly has no bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p02_tiny"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p02_tiny"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Tiny look?",
        skillTags: ["bell"],
        choices: [
          { label: "Go to Woolly", nextPageId: "p03_woolly" },
          { label: "Go to the stream", nextPageId: "p04_stream" },
        ]
      },
      {
        id: "p03_pot",
        text: ["Look in the pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_pot"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_pot"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can look in it?",
        skillTags: ["pot"],
        choices: [
          { label: "Brave can", nextPageId: "p04_hat_in_pot" },
          { label: "Tiny can", nextPageId: "p04_tiny_in_pot" },
        ]
      },
      {
        id: "p03_wall",
        text: ["Look on the wall."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_wall"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_wall"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Brave see?",
        skillTags: ["wall"],
        choices: [
          { label: "A red feather", nextPageId: "p04_feather" },
          { label: "A red thread", nextPageId: "p03_hat" },
        ]
      },
      {
        id: "p03_hat",
        text: ["The hat is in the wall."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_hat"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["hat", "wall"],
        choices: [
          { label: "Go to the wall", nextPageId: "p04_hat_on_wall" },
          { label: "Go to Clucky", nextPageId: "p04_clucky_wall" },
        ]
      },
      {
        id: "p04_feather",
        text: ["A feather is not the hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_feather"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_feather"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["feather", "hat"],
        choices: [
          { label: "Go to Clucky", nextPageId: "p04_clucky_wall" },
          { label: "Look in the pot", nextPageId: "p04_hat_in_pot" },
        ]
      },
      {
        id: "p04_clucky_wall",
        text: ["The hat is on the wall."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_clucky_wall"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_clucky_wall"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can go up?",
        skillTags: ["hat", "wall"],
        choices: [
          { label: "Tiny can", nextPageId: "p05_tiny_climbs" },
          { label: "Brave can", nextPageId: "p05_brave_climbs" },
        ]
      },
      {
        id: "p04_hat_on_wall",
        text: ["The hat is up high."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_hat_on_wall"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_hat_on_wall"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can go up?",
        skillTags: ["hat"],
        choices: [
          { label: "Tiny can", nextPageId: "p05_tiny_climbs" },
          { label: "Brave can", nextPageId: "p05_brave_climbs" },
        ]
      },
      {
        id: "p04_hat_in_pot",
        text: ["The hat is in the pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_hat_in_pot"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_hat_in_pot"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Brave do?",
        skillTags: ["hat", "pot"],
        choices: [
          { label: "Reach in together", nextPageId: "p05_hat_found" },
          { label: "Lean in more", nextPageId: "p05_brave_stuck" },
        ]
      },
      {
        id: "p04_tiny_in_pot",
        text: ["Tiny goes down in the pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_tiny_in_pot"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_tiny_in_pot"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Tiny do?",
        skillTags: ["pot"],
        artAction: "re-render",
        artNote: "Same shot of Tiny at the bottom of the pot on a knotted string, but remove the gold bell so only the red hat is down there, and put the rope end in Tiny's paws instead of ending in mid-air.",
        choices: [
          { label: "Tie the string on", nextPageId: "p06_tiny_helps" },
          { label: "Lift it together", nextPageId: "p05_hat_found" },
        ]
      },
      {
        id: "p05_brave_stuck",
        text: ["Brave can not get out."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_brave_stuck"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_brave_stuck"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can help Brave?",
        skillTags: [],
        choices: [
          { label: "Tip the pot", nextPageId: "p06_woolly_helps" },
          { label: "Use the string", nextPageId: "p06_tiny_helps" },
        ]
      },
      {
        id: "p06_woolly_helps",
        text: ["The big pot tips over."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_woolly_helps"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_woolly_helps"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["pot"],
        choices: [
          { label: "Get the hat", nextPageId: "p05_hat_found" },
          { label: "Put it on Brave", nextPageId: "p06_hat_on_brave" },
        ]
      },
      {
        id: "p06_tiny_helps",
        text: ["The hat is on a string."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_tiny_helps"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_tiny_helps"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["hat", "string"],
        choices: [
          { label: "Lift it up", nextPageId: "p05_hat_found" },
          { label: "Put it on Brave", nextPageId: "p06_hat_on_brave" },
        ]
      },
      {
        id: "p05_tiny_climbs",
        text: ["Tiny goes up the stones."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_tiny_climbs"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_tiny_climbs"),
        narrationNeedsRebuild: true,
        choicePrompt: "Can Tiny get the hat?",
        skillTags: ["stones"],
        choices: [
          { label: "Get the hat", nextPageId: "p05_hat_found" },
          { label: "Not yet", nextPageId: "p06_brave_boost" },
        ]
      },
      {
        id: "p05_brave_climbs",
        text: ["Brave goes up one stone."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_brave_climbs"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_brave_climbs"),
        narrationNeedsRebuild: true,
        choicePrompt: "Can Brave go up more?",
        skillTags: ["stone"],
        choices: [
          { label: "Go up more", nextPageId: "p06_brave_slips" },
          { label: "Ask Tiny", nextPageId: "p06_brave_boost" },
        ]
      },
      {
        id: "p06_brave_slips",
        text: ["Brave lands in the hay."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_brave_slips"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_brave_slips"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Brave do?",
        skillTags: ["hay"],
        choices: [
          { label: "Try the low stone", nextPageId: "p06_brave_boost" },
          { label: "Get the hat", nextPageId: "p05_hat_found" },
        ]
      },
      {
        id: "p06_brave_boost",
        text: ["Tiny sees a low stone."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_brave_boost"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_brave_boost"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["stone"],
        choices: [
          { label: "Get the hat", nextPageId: "p05_hat_found" },
          { label: "Give it back", nextPageId: "p07_clucky_happy" },
        ]
      },
      {
        id: "p05_hat_found",
        text: ["Here is the red hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_hat_found"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_hat_found"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["hat"],
        choices: [
          { label: "Give it back", nextPageId: "p07_clucky_happy" },
          { label: "Get a feather", nextPageId: "p09_fancy_brave_ending" },
        ]
      },
      {
        id: "p06_hat_on_brave",
        text: ["The hat is on Brave."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_hat_on_brave"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_hat_on_brave"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Brave do?",
        skillTags: ["hat"],
        choices: [
          { label: "Give it back", nextPageId: "p07_clucky_happy" },
          { label: "Get a feather", nextPageId: "p09_fancy_brave_ending" },
        ]
      },
      {
        id: "p03_woolly",
        text: ["Woolly looks at the grass."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_woolly"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_woolly"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can they look?",
        skillTags: ["grass"],
        choices: [
          { label: "In the wool", nextPageId: "p05_brave_in_wool" },
          { label: "In the stream", nextPageId: "p04_stream" },
        ]
      },
      {
        id: "p05_brave_in_wool",
        text: ["Brave is in the wool."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_brave_in_wool"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_brave_in_wool"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["wool"],
        choices: [
          { label: "Lift the wool", nextPageId: "p06_woolly_laughs" },
          { label: "Go to the stream", nextPageId: "p05_bell_stream" },
        ]
      },
      {
        id: "p06_woolly_laughs",
        text: ["The bell is in the wool."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_woolly_laughs"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_woolly_laughs"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["bell", "wool"],
        choices: [
          { label: "Pick it up", nextPageId: "p06_bell_ring" },
          { label: "Go to Woolly", nextPageId: "p07_woolly_happy" },
        ]
      },
      {
        id: "p04_stream",
        text: ["Look in the stream."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_stream"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_stream"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["stream"],
        choices: [
          { label: "Look at the stones", nextPageId: "p05_bell_stream" },
          { label: "Get Brave", nextPageId: "p06_brave_stream" },
        ]
      },
      {
        id: "p05_bell_stream",
        text: ["The bell is on a stone."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_bell_stream"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_bell_stream"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can get the bell?",
        skillTags: ["bell", "stone"],
        choices: [
          { label: "Tiny can", nextPageId: "p05_bell_found" },
          { label: "Brave can", nextPageId: "p06_brave_stream" },
        ]
      },
      {
        id: "p06_brave_stream",
        text: ["Brave has the little bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_brave_stream"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_brave_stream"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can Brave do?",
        skillTags: ["bell"],
        choices: [
          { label: "Give it to Tiny", nextPageId: "p05_bell_found" },
          { label: "Ring it", nextPageId: "p06_bell_ring" },
        ]
      },
      {
        id: "p05_bell_found",
        text: ["Here is the little bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_bell_found"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_bell_found"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["bell"],
        choices: [
          { label: "Go to Woolly", nextPageId: "p07_woolly_happy" },
          { label: "Ring it", nextPageId: "p06_bell_ring" },
        ]
      },
      {
        id: "p06_bell_ring",
        text: ["Tiny holds up the bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_bell_ring"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_bell_ring"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do?",
        skillTags: ["bell"],
        choices: [
          { label: "Go to Woolly", nextPageId: "p07_woolly_happy" },
          { label: "Put it down", nextPageId: "p09_loud_bell_ending" },
        ]
      },
      {
        id: "p07_clucky_happy",
        text: ["The hat is on Clucky."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p07_clucky_happy"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p07_clucky_happy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["hat"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_fancy_brave_ending",
        text: ["Clucky gives Brave a feather."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p09_fancy_brave_ending"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p09_fancy_brave_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["feather"],
        artAction: "re-render",
        artNote: "Same shot of Clucky handing Brave a red feather, but Clucky must be wearing her red hat and drawn at the same scale and in the same painterly style as p07_clucky_happy.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p07_woolly_happy",
        text: ["The bell is on Woolly."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p07_woolly_happy"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p07_woolly_happy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["bell"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_loud_bell_ending",
        text: ["The bell rings and rings."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p09_loud_bell_ending"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p09_loud_bell_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["bell"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      }
    ]
  }
];

export function getStoryQuestById(id) {
  return storyQuests.find(quest => quest.id === id) || null;
}
