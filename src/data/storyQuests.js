// LiteracyPath Story Quests
//
// REWRITTEN 2026-07-26. Every page of the original 13 quests was re-authored to sit at its
// declared Fountas & Pinnell band and to match what the existing illustrations
// actually show. See docs/STORY_QUEST_REWRITE_2026-07-26.md for the rationale,
// the per-book change notes, and the art work orders.
//
// Band ceilings enforced by tools/checkStoryQuestLevels.js:
//   A     1 line/page,  <=6 words/page,  present tense, no dialogue, no possessives
//   B     2 lines/page, <=14 words/page, present tense, "X," says Y. only
//   C     3 lines/page, <=22 words/page, present tense dominant, said/says only
//   Early true decodable: short-a CVC content words + declared HFW only
//
// Pages whose rewritten narration is not yet available carry
// narrationNeedsRebuild: true. The flag suppresses their legacy audio in
// StoryQuestPlayer.jsx. Set it to false only after the locked page text has an
// exact-text production mapping in storyQuestLedaAudio.generated.js and the
// mapped file has passed the story-content media gate.

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
    skillFocus: "Reading short cause-and-effect sentences about Grumpy's nap",
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
  },
  {
    id: "dp_ra_b_05_shys_snail_shade",
    title: "Shy's Snail Shade",
    level: "B",
    ageRange: "Ages 5-7",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading texture and path words through cause and effect",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    mediaFolder: "shy-snail-shade"
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
    retiredPageIds: ["p03_luna_says_together", "p05_together", "p06_small_answer", "p08_stone_carries", "p09_answer_far_side", "p12_ending_quiet"],
    coverImageUrl: moonwoodImagePath("pip-stone-loud-thing", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["A crash comes from Fog Marsh.", "A small call slips through the fog.", "They must find it before thick fog closes in."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p01_start"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Search now or wait for the call?",
        skillTags: ["pip", "stone", "marsh", "fog"],
        choices: [
          { label: "Search now", nextPageId: "p02_pip_wants_to_go" },
          { label: "Wait for the call", nextPageId: "p02_stone_waits" },
        ]
      },
      {
        id: "p02_pip_wants_to_go",
        text: ["\"I want to see it,\" says Pip.", "Stone folds both arms.", "\"It is very loud,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p02_pip_wants_to_go"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p02_pip_wants_to_go"),
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "Wait for Stone or call him over?",
        skillTags: ["pip", "stone"],
        choices: [
          { label: "Wait for Stone", nextPageId: "p03_stone_one_foot" },
          { label: "Call Stone over", nextPageId: "p04_inside_marsh" },
        ]
      },
      {
        id: "p03_pip_edge",
        text: ["Pip walks to the edge of the marsh.", "Gray fog curls around his boots.", "The crash comes again."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p03_pip_edge"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p03_pip_edge"),
        narrationNeedsRebuild: true,
        choicePrompt: "Call Stone over or wait for him?",
        skillTags: ["pip", "marsh", "fog"],
        choices: [
          { label: "Call Stone over", nextPageId: "p04_inside_marsh" },
          { label: "Wait for Stone", nextPageId: "p04_stone_appears" },
        ]
      },
      {
        id: "p03_stone_one_foot",
        text: ["Stone lifts one heavy foot.", "Pip waits beside the path.", "\"I am coming,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p03_stone_one_foot"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p03_stone_one_foot"),
        narrationNeedsRebuild: true,
        choicePrompt: "Walk side by side or let Stone lead?",
        skillTags: ["stone"],
        choices: [
          { label: "Walk side by side", nextPageId: "p04_stone_appears" },
          { label: "Let Stone lead", nextPageId: "p04_stone_leads" },
        ]
      },
      {
        id: "p04_inside_marsh",
        text: ["Pip and Stone stand on the bank.", "The sound bounces off the water.", "The reeds shake."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p04_inside_marsh"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p04_inside_marsh"),
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "What do they follow?",
        skillTags: ["pip", "stone", "fog", "hand"],
        choices: [
          { label: "Follow the noise", nextPageId: "p06_mossy_stone" },
          { label: "Look for tracks", nextPageId: "p05_tiny_tracks" },
        ]
      },
      {
        id: "p04_stone_leads",
        text: ["Stone finds a tall stick.", "Pip lights his lantern.", "Stone leads them into the marsh."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p04_stone_leads"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p04_stone_leads"),
        narrationNeedsRebuild: true,
        choicePrompt: "Put the tools down and check the reeds or rock?",
        skillTags: ["pip", "stone"],
        choices: [
          { label: "Check the reeds", nextPageId: "p05_reeds_shake" },
          { label: "Check the rock", nextPageId: "p06_mossy_stone" },
        ]
      },
      {
        id: "p05_reeds_shake",
        text: ["Pip parts the reeds beside a mossy rock.", "Stone leans closer.", "Something small moves on top."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p05_reeds_shake"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p05_reeds_shake"),
        narrationNeedsRebuild: true,
        choicePrompt: "Look at the rock or let Stone bend down?",
        skillTags: ["pip", "stone", "reeds"],
        choices: [
          { label: "Look at the rock", nextPageId: "p06_mossy_stone" },
          { label: "Let Stone bend down", nextPageId: "p06_stone_bends" },
        ]
      },
      {
        id: "p05_tiny_tracks",
        text: ["Pip finds tiny wet tracks in the mud.", "They stop beside a mossy rock."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p05_tiny_tracks"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p05_tiny_tracks"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the tracks or ask Stone to look?",
        skillTags: ["pip"],
        choices: [
          { label: "Follow the tracks", nextPageId: "p06_mossy_stone" },
          { label: "Ask Stone to look", nextPageId: "p06_stone_bends" },
        ]
      },
      {
        id: "p06_mossy_stone",
        text: ["A small green frog sits on the mossy rock.", "Its wide mouth opens.", "The huge crash comes from this tiny frog."],
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
        text: ["Stone kneels beside the mossy rock.", "His face is level with the frog.", "It looks no bigger than his thumb."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p06_stone_bends"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p06_stone_bends"),
        narrationNeedsRebuild: true,
        choicePrompt: "Hold the frog or start the search?",
        skillTags: ["stone", "frog"],
        choices: [
          { label: "Hold the frog gently", nextPageId: "p07_stone_gentle" },
          { label: "Carry it and search", nextPageId: "p08_search_family" },
        ]
      },
      {
        id: "p07_pip_speaks",
        text: ["\"Why are you shouting?\" says Pip.", "\"I am lost,\" says the frog.", "\"I am calling my family.\""],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p07_pip_speaks"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p07_pip_speaks"),
        narrationNeedsRebuild: false,
        choicePrompt: "How can they help?",
        skillTags: ["pip", "frog", "lost", "family"],
        choices: [
          { label: "Call out loud", nextPageId: "p08_stone_calls" },
          { label: "Search the marsh", nextPageId: "p08_search_family" },
        ]
      },
      {
        id: "p07_stone_gentle",
        text: ["Stone kneels and opens both hands.", "The frog stands beside his palms.", "\"We will help you,\" says Stone."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p07_stone_gentle"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p07_stone_gentle"),
        narrationNeedsRebuild: true,
        choicePrompt: "Should Stone call or should Pip listen?",
        skillTags: ["stone", "frog", "hand"],
        choices: [
          { label: "Stone calls out", nextPageId: "p08_stone_calls" },
          { label: "Pip listens", nextPageId: "p09_pip_listens" },
        ]
      },
      {
        id: "p08_search_family",
        text: ["Stone carries the small frog.", "Pip checks the reeds beside the dark water.", "No family answers."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p08_search_family"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p08_search_family"),
        narrationNeedsRebuild: true,
        choicePrompt: "Climb and listen or call softly?",
        skillTags: ["reeds"],
        choices: [
          { label: "Climb and listen", nextPageId: "p09_pip_listens" },
          { label: "Call more softly", nextPageId: "p09_soft_call" },
        ]
      },
      {
        id: "p08_stone_calls",
        text: ["Stone calls out across the marsh.", "Pip covers both ears.", "The frog looks up, but nothing calls back."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p08_stone_calls"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p08_stone_calls"),
        narrationNeedsRebuild: true,
        choicePrompt: "Call loudly again or let Pip listen?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the answer or let the frog call?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Call softly or let the frog call?",
        skillTags: ["pip", "stone", "frog", "calls"],
        choices: [
          { label: "Call much softer", nextPageId: "p09_soft_call" },
          { label: "Let the frog call", nextPageId: "p09_toadling_calls" },
        ]
      },
      {
        id: "p09_soft_call",
        text: ["Stone calls again, much softer.", "The small frog listens beside Pip.", "A faint answer comes from the reeds."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p09_soft_call"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p09_soft_call"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the answer or let the frog answer?",
        skillTags: ["stone", "frog", "calls", "reeds"],
        choices: [
          { label: "Follow the answer", nextPageId: "p10_family_found" },
          { label: "Let the frog answer", nextPageId: "p09_toadling_calls" },
        ]
      },
      {
        id: "p09_toadling_calls",
        text: ["The small frog hops onto a log.", "It opens its mouth wide.", "An answer rolls back through the reeds."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p09_toadling_calls"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p09_toadling_calls"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the answer or wait for the frogs?",
        skillTags: ["frog"],
        choices: [
          { label: "Follow the answer", nextPageId: "p10_family_found" },
          { label: "Wait for the frogs", nextPageId: "p11_toadling_answer" },
        ]
      },
      {
        id: "p10_family_found",
        text: ["Six frogs wait on the far bank.", "The lost frog leaps over the water.", "It lands beside its family."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p10_family_found"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p10_family_found"),
        narrationNeedsRebuild: true,
        choicePrompt: "Talk to the frog or walk home quietly?",
        skillTags: ["frog", "lost"],
        choices: [
          { label: "Talk to the frog", nextPageId: "p11_toadling_answer" },
          { label: "Walk home quietly", nextPageId: "p11_back_home" },
        ]
      },
      {
        id: "p11_toadling_answer",
        text: ["The frog sits with its family.", "\"Are you always this loud?\" says Pip.", "\"Only when I am lost,\" says the frog."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p11_toadling_answer"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p11_toadling_answer"),
        narrationNeedsRebuild: false,
        choicePrompt: "Tell the wood or walk home quietly?",
        skillTags: ["pip", "frog", "loud", "lost", "family"],
        choices: [
          { label: "Tell the wood", nextPageId: "p12_ending_loud" },
          { label: "Walk home quietly", nextPageId: "p11_back_home" },
        ]
      },
      {
        id: "p11_back_home",
        text: ["Pip and Stone walk home to Hollow Oak.", "The marsh is quiet now.", "Stone keeps one hand on Pip's shoulder."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p11_back_home"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p11_back_home"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["pip", "stone", "marsh", "quiet", "hand"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish quietly", nextPageId: "end" },
        ]
      },
      {
        id: "p12_ending_loud",
        text: ["Friends gather at Hollow Oak.", "Pip tells how the frog meets its family.", "Stone shows how tiny it is with both hands."],
        imageUrl: moonwoodImagePath("pip-stone-loud-thing", "p12_ending_loud"),
        audioUrl: moonwoodAudioPath("pip-stone-loud-thing", "p12_ending_loud"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["pip", "stone", "loud"],
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
    skillFocus: "Reading color and number words in context; dialogue tagged with says",
    cycleFocus: "guided_reading_level_c_story_choice",
    series: "Moonwood Tales",
    characters: ["Fern", "Wren"],
    location: "Moonwood - Fern's garden, Hollow Oak, Crystal Stream",
    targetWords: ["Fern", "Wren", "garden", "potion", "pots", "walk", "green", "book", "sings", "plant", "purple", "path"],
    highFrequencyWords: ["and", "the", "says", "her", "one", "very", "then", "down", "all", "no", "of"],
    hfw: ["and", "the", "says", "her", "one", "very", "then", "down", "all", "no", "of"],
    mediaFolder: "fern-wren-walking-garden",
    sentenceFrame: "Wren tries a spell. The pots walk. Fern sings them back.",
    genuineFailurePageId: "p05_too_late",
    retiredPageIds: ["p06_wrong_book", "p06_crystal_stream", "p07_dewdrop_laughs", "p09_tiny_bow", "p10_wren_sorry", "p11_fewer_books"],
    coverImageUrl: moonwoodImagePath("fern-wren-walking-garden", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Fern checks the pots in her garden.", "Wren walks in with a purple cauldron.", "\"Can we test my potion?\" says Wren."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p01_start"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Check the book or test the potion?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Trust Wren or check the color?",
        skillTags: ["fern", "wren", "potion", "green", "book", "purple"],
        choices: [
          { label: "Trust Wren", nextPageId: "p03_pour_potion" },
          { label: "Check the color", nextPageId: "p03_wrong_colour" },
        ]
      },
      {
        id: "p03_wrong_colour",
        text: ["Fern looks at the potion again.", "It is not green.", "Purple steam drifts toward the big fern."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p03_wrong_colour"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p03_wrong_colour"),
        narrationNeedsRebuild: true,
        choicePrompt: "Warn Wren or pour it?",
        skillTags: ["fern", "wren", "potion", "green"],
        choices: [
          { label: "Warn Wren", nextPageId: "p04_fern_warns" },
          { label: "Pour it anyway", nextPageId: "p03_pour_potion" },
        ]
      },
      {
        id: "p03_pour_potion",
        text: ["Wren tips the purple potion on a plant.", "The plant stands up straight.", "One small pot steps toward the gate."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p03_pour_potion"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p03_pour_potion"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow one pot or watch them all?",
        skillTags: ["wren", "potion", "plant"],
        choices: [
          { label: "Follow the small pot", nextPageId: "p04_small_plant" },
          { label: "Look at them all", nextPageId: "p04_all_walk" },
        ]
      },
      {
        id: "p04_fern_warns",
        text: ["The big fern lifts one root from the pot.", "Fern points at it.", "Wren turns and stares."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p04_fern_warns"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p04_fern_warns"),
        narrationNeedsRebuild: true,
        choicePrompt: "Catch one pot or stay calm?",
        skillTags: ["fern", "wren"],
        choices: [
          { label: "Catch one pot", nextPageId: "p05_too_late" },
          { label: "Take a breath", nextPageId: "p05_fern_calm" },
        ]
      },
      {
        id: "p04_small_plant",
        text: ["The smallest pot walks slowly down the path.", "Fern and Wren follow it.", "It heads for a round door."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p04_small_plant"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p04_small_plant"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow it to the door or ask Fern to stop it?",
        skillTags: ["path"],
        choices: [
          { label: "Follow to the door", nextPageId: "p05_tiny_escape" },
          { label: "Ask Fern to stop", nextPageId: "p05_fern_calm" },
        ]
      },
      {
        id: "p04_all_walk",
        text: ["Every pot in the row starts to walk.", "They walk around Fern.", "They walk around Wren."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p04_all_walk"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p04_all_walk"),
        narrationNeedsRebuild: false,
        choicePrompt: "Catch one pot or follow them?",
        skillTags: ["fern", "wren", "walk"],
        choices: [
          { label: "Catch one pot", nextPageId: "p05_too_late" },
          { label: "Follow them", nextPageId: "p05_garden_empty" },
        ]
      },
      {
        id: "p05_too_late",
        text: ["Fern grabs for a walking pot.", "The other pots scatter past her.", "Wren cannot stop them."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p05_too_late"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p05_too_late"),
        narrationNeedsRebuild: false,
        choicePrompt: "Stand still or check the books?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Carry it home or let it walk?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Check the books or follow the pots?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Fast spell or find the green page?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the pots or stop and think?",
        skillTags: ["fern", "wren", "garden", "path"],
        choices: [
          { label: "Follow the pots", nextPageId: "p06_plants_everywhere" },
          { label: "Stop and think", nextPageId: "p05_fern_calm" },
        ]
      },
      {
        id: "p06_fast_spell",
        text: ["Wren tries a quick spell.", "The pots jump.", "Soil flies everywhere."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p06_fast_spell"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p06_fast_spell"),
        narrationNeedsRebuild: false,
        choicePrompt: "Sing softly or follow the jumping pots?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Sing them home or fetch them?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Try green potion or Fern's song?",
        skillTags: ["wren", "potion", "green", "plant"],
        artAction: "approved-existing",
        artNote: "Approved existing scene: Wren holds the green recipe open with clean, separate fingers; the green cauldron and sneezing plant show the corrected potion working.",
        choices: [
          { label: "Try again", nextPageId: "p08_almost_fixed" },
          { label: "Let Fern sing", nextPageId: "p07_sing_softly" },
        ]
      },
      {
        id: "p07_sing_softly",
        text: ["Fern lifts both arms and sings.", "Her song is very quiet.", "The walking plants gather around her."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p07_sing_softly"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p07_sing_softly"),
        narrationNeedsRebuild: false,
        choicePrompt: "Send them home or let one dance?",
        skillTags: ["fern", "pots", "sings"],
        choices: [
          { label: "Sing them home", nextPageId: "p08_return_home" },
          { label: "The small one dances", nextPageId: "p08_tiny_dance" },
        ]
      },
      {
        id: "p08_almost_fixed",
        text: ["The pots slow down one by one.", "Wren finds one sitting in a teacup.", "Another still keeps its legs."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p08_almost_fixed"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p08_almost_fixed"),
        narrationNeedsRebuild: true,
        choicePrompt: "Guide them home or watch them settle?",
        skillTags: ["pots", "plant"],
        choices: [
          { label: "Guide them home", nextPageId: "p08_return_home" },
          { label: "Watch them settle", nextPageId: "p09_plants_settle" },
        ]
      },
      {
        id: "p08_tiny_dance",
        text: ["The smallest pot dances in a circle.", "Wren watches it.", "Fern keeps on singing."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p08_tiny_dance"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p08_tiny_dance"),
        narrationNeedsRebuild: false,
        choicePrompt: "Let it finish or keep one silly?",
        skillTags: ["fern", "wren"],
        choices: [
          { label: "Let it finish", nextPageId: "p08_return_home" },
          { label: "Keep one silly", nextPageId: "p09_silly_garden" },
        ]
      },
      {
        id: "p08_return_home",
        text: ["The pots turn around.", "They walk back along the path, one by one.", "Fern hums over them."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p08_return_home"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p08_return_home"),
        narrationNeedsRebuild: false,
        choicePrompt: "Settle every pot or keep one silly?",
        skillTags: ["fern", "pots", "walk", "path"],
        choices: [
          { label: "Watch them settle", nextPageId: "p09_plants_settle" },
          { label: "Keep one silly", nextPageId: "p09_silly_garden" },
        ]
      },
      {
        id: "p09_plants_settle",
        text: ["Each pot finds its own place.", "The smallest one sits down last.", "It lands with a small thump."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p09_plants_settle"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p09_plants_settle"),
        narrationNeedsRebuild: false,
        choicePrompt: "Count them or lock the potion?",
        skillTags: [],
        choices: [
          { label: "Fern counts the pots", nextPageId: "p10_garden_safe" },
          { label: "Put the potion away", nextPageId: "p12_ending_calm" },
        ]
      },
      {
        id: "p09_silly_garden",
        text: ["One big pot keeps its legs.", "It dances beside the path, away from the gate.", "Wren and Fern watch it dance."],
        imageUrl: moonwoodImagePath("fern-wren-walking-garden", "p09_silly_garden"),
        audioUrl: moonwoodAudioPath("fern-wren-walking-garden", "p09_silly_garden"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["fern"],
        artAction: "approved-replacement",
        artNote: "Replacement shows one and only one walking pot keeping two attached root legs while all other pots remain settled.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p10_garden_safe",
        text: ["All the pots rest in their old places.", "Wren closes the green book.", "Fern checks the tallest plant."],
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
        text: ["Wren corks the purple potion and puts it away.", "Fern watches the smallest pot.", "It stays still, and both smile."],
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
    highFrequencyWords: ["and", "the", "says", "out", "with", "this", "up", "on", "of", "his", "them"],
    hfw: ["and", "the", "says", "out", "with", "this", "up", "on", "of", "his", "them"],
    mediaFolder: "luna-burrow-star-shell-door",
    sentenceFrame: "Luna holds the star shell. Burrow reads the map. The door waits.",
    genuineFailurePageId: "p05_cracked_shell",
    retiredPageIds: ["p03_marsh_path", "p04_bird_riddle", "p04_quiet_mist", "p05_door_answer", "p05_feather", "p05_song_answer", "p05_tunnel_wide", "p06_map_sings", "p06_stone_helps", "p07_knock_reply", "p07_luna_fixes", "p07_moss_laughs", "p07_stone_too_big", "p07_wrong_shell", "p08_key_joke", "p08_polite_door", "p08_star_room", "p08_stone_guard", "p09_blue_path", "p09_door_answer", "p09_echo_room", "p09_kind_sleep", "p09_luna_laughs", "p09_star_choice", "p10_free_seed", "p10_funny_ending", "p10_home_seed", "p10_marsh_light", "p10_stone_star", "p10_wren_ending"],
    coverImageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Luna finds a star shell.", "Burrow finds a map inside it.", "It shows a round door that seals at moonset."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p01_start"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the shell song or read the map?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the silver line or the glowing roots?",
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
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "Dig under the roots or follow the gold dots?",
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
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "Widen the tunnel or try the round door?",
        skillTags: ["burrow", "door", "roots"],
        choices: [
          { label: "Widen the tunnel", nextPageId: "p06_burrow_catches_map" },
          { label: "Try the round door", nextPageId: "p06_hidden_door" },
        ]
      },
      {
        id: "p04_pip_arrives",
        text: ["Pip comes down the tunnel with a lantern.", "He kneels beside the map.", "\"I know this door,\" says Pip."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p04_pip_arrives"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p04_pip_arrives"),
        narrationNeedsRebuild: false,
        choicePrompt: "Let Pip lead or read the map together?",
        skillTags: ["door", "map"],
        choices: [
          { label: "Let Pip lead", nextPageId: "p05_pip_leads" },
          { label: "Read the map", nextPageId: "p06_burrow_catches_map" },
        ]
      },
      {
        id: "p05_cracked_shell",
        text: ["The white star cracks in Burrow's paws.", "One point snaps off and lands on the stone.", "Burrow freezes."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_cracked_shell"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_cracked_shell"),
        narrationNeedsRebuild: true,
        choicePrompt: "Set the star down or tell Luna what happened?",
        skillTags: ["luna", "burrow", "star"],
        choices: [
          { label: "Set it down gently", nextPageId: "p05_burrow_repairs" },
          { label: "Tell Luna", nextPageId: "p08_sorry_path" },
        ]
      },
      {
        id: "p05_burrow_repairs",
        text: ["Burrow sets the cracked star down.", "He fits the loose point back into place.", "Luna watches until its light returns."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_burrow_repairs"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_burrow_repairs"),
        narrationNeedsRebuild: true,
        choicePrompt: "Wait for its light or call Wren?",
        skillTags: ["luna", "burrow", "star"],
        choices: [
          { label: "Wait for its light", nextPageId: "p05_kind_choice" },
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p05_cross_stones",
        text: ["The stones are wet and slippery.", "Burrow wobbles on the middle stone.", "Luna spreads both wings and steadies him."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_cross_stones"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_cross_stones"),
        narrationNeedsRebuild: false,
        choicePrompt: "Where do they go?",
        skillTags: ["luna", "burrow"],
        choices: [
          { label: "Keep crossing", nextPageId: "p06_burrow_catches_map" },
          { label: "Turn to the roots", nextPageId: "p06_hidden_door" },
        ]
      },
      {
        id: "p05_leaf_boat",
        text: ["They climb into a curled green leaf.", "The leaf floats across the stream.", "Burrow holds the map. Luna holds the star shell."],
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
        text: ["The white star rests where it belongs.", "Its light grows steady beside the map.", "A new silver path uncurls between the roots."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_kind_choice"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_kind_choice"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the path to the door or call Wren?",
        skillTags: ["luna", "star", "map", "path", "roots"],
        choices: [
          { label: "Follow the path", nextPageId: "p06_hidden_door" },
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p05_pip_leads",
        text: ["Pip leads them along the gold trail.", "His lantern shines on the round door.", "\"Here it is,\" says Pip."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p05_pip_leads"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p05_pip_leads"),
        narrationNeedsRebuild: true,
        choicePrompt: "Try the round door or follow the map?",
        skillTags: ["luna", "burrow", "gold"],
        choices: [
          { label: "Try the round door", nextPageId: "p06_hidden_door" },
          { label: "Follow the map", nextPageId: "p06_burrow_catches_map" },
        ]
      },
      {
        id: "p06_burrow_catches_map",
        text: ["Burrow reaches a mossy bank and lifts the map.", "Luna holds the star shell.", "The round door waits among old roots."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_burrow_catches_map"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_burrow_catches_map"),
        narrationNeedsRebuild: true,
        choicePrompt: "Try the round door or call Wren?",
        skillTags: ["luna", "burrow", "star", "map"],
        choices: [
          { label: "Try the door", nextPageId: "p06_hidden_door" },
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p06_hidden_door",
        text: ["The round door waits in the roots.", "Luna holds up the star shell.", "Burrow studies the stone, but it will not move."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_hidden_door"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_hidden_door"),
        narrationNeedsRebuild: true,
        choicePrompt: "Call Wren or follow the stream?",
        skillTags: ["luna", "burrow", "door", "roots"],
        choices: [
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
          { label: "Follow the stream", nextPageId: "p06_stream_gate" },
        ]
      },
      {
        id: "p06_stream_gate",
        text: ["A crystal gate stands in the stream.", "Tiny stars swim inside it.", "Burrow puts his nose on the crystal."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_stream_gate"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_stream_gate"),
        narrationNeedsRebuild: false,
        choicePrompt: "Open the star gate or call Wren?",
        skillTags: ["burrow", "stream"],
        choices: [
          { label: "Open the gate", nextPageId: "p07_star_fish" },
          { label: "Call Wren", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p06_wren_warning",
        text: ["Wren runs up with three books.", "\"Old doors open for kind hands,\" she says.", "Moonlight on the door grows thin."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p06_wren_warning"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p06_wren_warning"),
        narrationNeedsRebuild: false,
        choicePrompt: "How do they open it?",
        skillTags: ["open"],
        choices: [
          { label: "Let Wren read", nextPageId: "p07_wren_checks" },
          { label: "Use both hands", nextPageId: "p07_door_opens" },
        ]
      },
      {
        id: "p07_wren_checks",
        text: ["The smallest book says, KIND HANDS OPEN THIS DOOR.", "\"That means gentle paws,\" says Wren.", "Burrow nods."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p07_wren_checks"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p07_wren_checks"),
        narrationNeedsRebuild: true,
        choicePrompt: "Use gentle paws or thank Wren and go home?",
        skillTags: ["door", "open"],
        choices: [
          { label: "Use gentle paws", nextPageId: "p07_door_opens" },
          { label: "Thank Wren; go home", nextPageId: "p10_quiet_ending" },
        ]
      },
      {
        id: "p07_door_opens",
        text: ["The round door swings open.", "Burrow lowers his paws.", "Blue stars fill the room inside."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p07_door_opens"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p07_door_opens"),
        narrationNeedsRebuild: true,
        choicePrompt: "Enter the star room or leave the door closed?",
        skillTags: ["burrow", "door", "open"],
        choices: [
          { label: "Go inside", nextPageId: "p08_map_inside" },
          { label: "Take the map home", nextPageId: "p10_door_open_ending" },
        ]
      },
      {
        id: "p07_star_fish",
        text: ["Starfish swim out of the gate.", "They form a silver line upstream.", "The line points back to the round door."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p07_star_fish"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p07_star_fish"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the starfish or ask Wren to read?",
        skillTags: ["luna", "burrow", "star", "stream"],
        choices: [
          { label: "Follow the starfish", nextPageId: "p07_door_opens" },
          { label: "Call Wren to read", nextPageId: "p07_wren_checks" },
        ]
      },
      {
        id: "p08_map_inside",
        text: ["Blue stars hang from the roof.", "Burrow lays the map on the stone table.", "A gold path runs out the far side."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p08_map_inside"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p08_map_inside"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the gold path or carry the map home?",
        skillTags: ["burrow", "map", "path", "gold"],
        choices: [
          { label: "Follow the gold path", nextPageId: "p09_gold_path" },
          { label: "Take the map home", nextPageId: "p10_door_open_ending" },
        ]
      },
      {
        id: "p08_sorry_path",
        text: ["Burrow sets the cracked star down.", "\"I should not touch it,\" he says.", "Luna helps him fit the point back into place."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p08_sorry_path"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p08_sorry_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Wait for its light or call Wren about the door?",
        skillTags: ["burrow", "star", "path"],
        choices: [
          { label: "Wait for its light", nextPageId: "p05_kind_choice" },
          { label: "Call Wren about it", nextPageId: "p06_wren_warning" },
        ]
      },
      {
        id: "p09_gold_path",
        text: ["The gold path opens beneath Hollow Oak.", "Their friends wave under the tree.", "Luna and Burrow arrive before moonset."],
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
        text: ["Luna and Burrow reach Hollow Oak.", "They mark the round door on the map.", "Next time, they will use gentle paws."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p10_quiet_ending"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p10_quiet_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["luna", "burrow", "star", "door", "map"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p10_door_open_ending",
        text: ["Luna and Burrow reach Hollow Oak.", "The star shell and map rest on the moss.", "The round door is open now."],
        imageUrl: moonwoodImagePath("luna-burrow-star-shell-door", "p10_door_open_ending"),
        audioUrl: moonwoodAudioPath("luna-burrow-star-shell-door", "p10_door_open_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["luna", "burrow", "star", "door", "map", "open"],
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
    targetWords: ["Dewdrop", "Flint", "glow", "stream", "dark", "gold", "light", "lantern", "cave", "water", "blue"],
    highFrequencyWords: ["and", "the", "says", "out", "up", "with", "his", "her", "them", "down", "one", "of"],
    hfw: ["and", "the", "says", "out", "up", "with", "his", "her", "them", "down", "one", "of"],
    mediaFolder: "dewdrop-flint-lost-glow",
    sentenceFrame: "Flint lifts the lantern. Dewdrop listens to the water. The glow stays hidden.",
    genuineFailurePageId: "p06_lantern_pop",
    retiredPageIds: ["p02_dewdrop_listens", "p03_spark_bush", "p04_fern_garden", "p04_pip_glows", "p04_spark_jar", "p04_upstream_dark", "p04_wren_spell", "p05_crack_path", "p05_fern_clue", "p05_fish_answer", "p05_fish_tunnel", "p05_pip_lamp", "p05_shadow_moth", "p05_spark_water", "p06_burrow_dig", "p06_dewdrop_alone", "p06_dry_path", "p06_pip_mushroom", "p06_stone_guard", "p06_water_answer", "p07_door_question", "p07_dry_crawl", "p07_footprint_voice", "p07_frog_guard", "p07_lantern_crack", "p07_lantern_rolls", "p07_moth_lantern", "p07_moth_thanks", "p07_pip_lamp_big", "p07_pip_sits", "p07_puddle_laugh", "p07_tiny_door", "p07_waiting_room", "p08_frog_ending_path", "p08_lantern_light", "p08_pip_proud", "p08_quiet_wait", "p08_safe_promise", "p08_two_crystals", "p08_water_song", "p09_bright_wrong", "p09_everyone_helps", "p09_fern_repairs", "p09_stream_returns", "p09_wren_rule", "p10_frog_ending", "p10_lantern_ending", "p10_pip_ending", "p10_splash_ending", "p10_wren_ending"],
    coverImageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["The little glow is gone from Crystal Stream.", "Moonwood paths turn dark.", "Flint lifts his lantern; Dewdrop listens for the glow."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p01_start"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Shake Flint's lantern or listen to the water?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the gold spark or ask Wren to trace it?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Where do they look?",
        skillTags: ["dewdrop", "water"],
        choices: [
          { label: "Look under the stones", nextPageId: "p04_under_stones" },
          { label: "Try the dark trees", nextPageId: "p04_deep_dark_edge" },
        ]
      },
      {
        id: "p03_lantern_path",
        text: ["The gold spark fades beside the blue stream.", "Flint raises his lantern.", "Dewdrop watches the water."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p03_lantern_path"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p03_lantern_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Search the dark trees or test the stones underwater?",
        skillTags: ["flint", "glow", "stream", "gold", "lantern", "water", "blue"],
        choices: [
          { label: "Try the dark trees", nextPageId: "p04_deep_dark_edge" },
          { label: "Look under the stones", nextPageId: "p04_under_stones" },
        ]
      },
      {
        id: "p03_wren_arrives",
        text: ["Wren arrives with three heavy books.", "\"I have water and light spells,\" she says.", "The third book is about not dropping books."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p03_wren_arrives"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p03_wren_arrives"),
        narrationNeedsRebuild: true,
        choicePrompt: "Should Wren try a quick spell or a careful spell?",
        skillTags: [],
        choices: [
          { label: "Try a quick spell", nextPageId: "p05_smoke_arrow" },
          { label: "Try a careful spell", nextPageId: "p05_wren_stops" },
        ]
      },
      {
        id: "p04_deep_dark_edge",
        text: ["The trees ahead hold no light.", "Flint stops at the edge of the black.", "Dewdrop floats out in front of him."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p04_deep_dark_edge"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p04_deep_dark_edge"),
        narrationNeedsRebuild: false,
        choicePrompt: "Enter the dark with Dewdrop or ask Fern?",
        skillTags: ["dewdrop", "flint", "light"],
        choices: [
          { label: "Walk into the dark", nextPageId: "p06_quiet_tree" },
          { label: "Ask Fern", nextPageId: "p05_fern_joins" },
        ]
      },
      {
        id: "p04_under_stones",
        text: ["Dewdrop slips under the water.", "Flint kneels on a flat stone above her.", "A pale light shines beneath a stone."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p04_under_stones"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p04_under_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "Cross the glowing stones or call Stone to lift the slab?",
        skillTags: ["dewdrop", "flint", "water"],
        choices: [
          { label: "Cross the glowing stones", nextPageId: "p07_soft_feet" },
          { label: "Call Stone", nextPageId: "p05_stone_lifts" },
        ]
      },
      {
        id: "p05_smoke_arrow",
        text: ["Wren's spell leaves a green smoke arrow.", "It points at the ground beside Flint.", "Wren stays back. Flint and Dewdrop follow it."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_smoke_arrow"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_smoke_arrow"),
        narrationNeedsRebuild: true,
        choicePrompt: "Dig where it points or search beside the arrow?",
        skillTags: [],
        choices: [
          { label: "Dig where it points", nextPageId: "p06_crack_opens" },
          { label: "Search beside the arrow", nextPageId: "p06_question_path" },
        ]
      },
      {
        id: "p05_stone_lifts",
        text: ["Stone lifts the flat slab from hidden steps.", "Warm air rises from below.", "\"The glow may be down there,\" says Stone."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_stone_lifts"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_stone_lifts"),
        narrationNeedsRebuild: true,
        choicePrompt: "Thank Stone, then take the steps or cross the wet ground?",
        skillTags: ["dark"],
        choices: [
          { label: "Take the steps", nextPageId: "p06_crack_opens" },
          { label: "Cross the wet ground", nextPageId: "p06_lantern_pop" },
        ]
      },
      {
        id: "p05_fern_joins",
        text: ["Fern points to a plant with gold veins.", "The veins bend toward an old tree.", "\"The glow slept there once,\" she says."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_fern_joins"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_fern_joins"),
        narrationNeedsRebuild: true,
        choicePrompt: "Thank Fern, then follow the gold veins or let her sing?",
        skillTags: ["flint", "glow"],
        choices: [
          { label: "Follow the gold veins", nextPageId: "p06_question_path" },
          { label: "Let her sing", nextPageId: "p07_fern_song" },
        ]
      },
      {
        id: "p05_wren_stops",
        text: ["Wren's green smoke curls into a question mark.", "A smaller arrow points down the path.", "Dewdrop hears water under the roots."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p05_wren_stops"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p05_wren_stops"),
        narrationNeedsRebuild: true,
        choicePrompt: "Thank Wren, then follow the arrow or listen by the roots?",
        skillTags: [],
        choices: [
          { label: "Follow the arrow", nextPageId: "p06_question_path" },
          { label: "Listen by the roots", nextPageId: "p06_quiet_tree" },
        ]
      },
      {
        id: "p07_soft_feet",
        text: ["Flint steps out onto the stepping stones.", "Two of them glow gold under his boots.", "He stops on the last one."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_soft_feet"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_soft_feet"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask Dewdrop to dive or follow the gold trail?",
        skillTags: ["flint", "glow", "gold"],
        choices: [
          { label: "Ask Dewdrop to dive", nextPageId: "p07_water_call" },
          { label: "Follow the gold trail", nextPageId: "p06_moth_path" },
        ]
      },
      {
        id: "p06_crack_opens",
        text: ["The rock opens into a narrow crack.", "Pale footprints lead down stone steps.", "Flint opens both arms and squeezes through."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_crack_opens"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_crack_opens"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the footprints or hurry over the wet stones?",
        skillTags: ["flint", "blue"],
        choices: [
          { label: "Follow the footprints", nextPageId: "p06_moth_path" },
          { label: "Hurry over wet stones", nextPageId: "p06_lantern_pop" },
        ]
      },
      {
        id: "p06_quiet_tree",
        text: ["A huge bare tree stands in the dark.", "Flint kneels beside a warm hollow.", "Dewdrop sees a small gold light inside."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_quiet_tree"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_quiet_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the light or check the roots below?",
        skillTags: ["flint", "dark", "light"],
        choices: [
          { label: "Follow the light", nextPageId: "p06_moth_path" },
          { label: "Check the roots below", nextPageId: "p06_question_path" },
        ]
      },
      {
        id: "p06_lantern_pop",
        text: ["Flint slips and sits down in the water.", "His lantern goes out.", "Dewdrop lifts it up. It stays dark."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_lantern_pop"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_lantern_pop"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look for another light or wait beside the lantern?",
        skillTags: ["dewdrop", "flint", "dark", "lantern", "water"],
        choices: [
          { label: "Look for a light", nextPageId: "p06_moth_path" },
          { label: "Wait beside it", nextPageId: "p06_moth_caught" },
        ]
      },
      {
        id: "p06_moth_caught",
        text: ["A purple moth lands on Flint's hands.", "Its soft glow relights his lantern.", "Dewdrop watches it turn toward a warm cave."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_moth_caught"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_moth_caught"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the moth or search nearby bushes?",
        skillTags: ["flint", "glow", "dark"],
        choices: [
          { label: "Follow the moth", nextPageId: "p06_moth_path" },
          { label: "Search the bushes", nextPageId: "p06_question_path" },
        ]
      },
      {
        id: "p06_question_path",
        text: ["A tiny yellow guide curls above the bush.", "Its tail points at a little door.", "Flint and Dewdrop lean closer."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_question_path"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_question_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Open the tiny door or call softly to the glow?",
        skillTags: [],
        choices: [
          { label: "Open the tiny door", nextPageId: "p06_glow_cave" },
          { label: "Call softly", nextPageId: "p07_glow_wakes" },
        ]
      },
      {
        id: "p06_moth_path",
        text: ["A faint trail curls through the air.", "It leads to a cave mouth in the moss.", "Warm gold light glows inside."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_moth_path"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_moth_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "Enter the warm cave or call from the entrance?",
        skillTags: ["light", "cave"],
        choices: [
          { label: "Go into the cave", nextPageId: "p06_glow_cave" },
          { label: "Call from outside", nextPageId: "p07_glow_wakes" },
        ]
      },
      {
        id: "p06_glow_cave",
        text: ["Warm light fills the end of the tunnel.", "The little glow curls on a mossy mound.", "It is fast asleep."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p06_glow_cave"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p06_glow_cave"),
        narrationNeedsRebuild: true,
        choicePrompt: "Call to the glow or wait beside it?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Let Dewdrop dive or follow the bank to the cave?",
        skillTags: ["dewdrop", "flint"],
        choices: [
          { label: "Dewdrop dives", nextPageId: "p07_heavy_crystal" },
          { label: "Follow the bank", nextPageId: "p06_glow_cave" },
        ]
      },
      {
        id: "p07_heavy_crystal",
        text: ["A white slab lies on the sand.", "Gold light leaks out from under it.", "Dewdrop pushes. The slab does not shift."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_heavy_crystal"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_heavy_crystal"),
        narrationNeedsRebuild: false,
        choicePrompt: "Call Flint to help or listen for moving water?",
        skillTags: ["dewdrop", "gold", "light"],
        choices: [
          { label: "Call Flint to help", nextPageId: "p08_team_pull" },
          { label: "Listen for moving water", nextPageId: "p08_crystal_moves" },
        ]
      },
      {
        id: "p08_team_pull",
        text: ["Flint reaches into the stream.", "Together, they pull a loose crystal from the slab.", "Blue water rushes through the gap."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p08_team_pull"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p08_team_pull"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the current or follow the bank?",
        skillTags: ["dewdrop", "flint", "stream"],
        choices: [
          { label: "Follow the current", nextPageId: "p06_glow_cave" },
          { label: "Follow the bank", nextPageId: "p06_moth_path" },
        ]
      },
      {
        id: "p08_crystal_moves",
        text: ["Dewdrop follows the new current.", "It helps her slide the slab aside.", "Blue water rushes into a gap under the bank."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p08_crystal_moves"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p08_crystal_moves"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the current or follow the bank?",
        skillTags: ["dewdrop", "flint", "water"],
        choices: [
          { label: "Follow the current", nextPageId: "p06_glow_cave" },
          { label: "Follow the bank", nextPageId: "p06_moth_path" },
        ]
      },
      {
        id: "p07_fern_song",
        text: ["Fern sings beside the old tree.", "White ribbons drift into the hollow.", "\"The glow is inside,\" says Fern."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_fern_song"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_fern_song"),
        narrationNeedsRebuild: true,
        choicePrompt: "Thank Fern and enter the hollow, or find a wider entrance?",
        skillTags: ["glow"],
        choices: [
          { label: "Enter the hollow", nextPageId: "p06_glow_cave" },
          { label: "Find a wider entrance", nextPageId: "p06_moth_path" },
        ]
      },
      {
        id: "p07_glow_sleeps",
        text: ["Flint sits down and waits.", "Dewdrop floats above the mound.", "The little glow sleeps on."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_glow_sleeps"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_glow_sleeps"),
        narrationNeedsRebuild: false,
        choicePrompt: "Tell the glow a story or speak softly?",
        skillTags: ["dewdrop", "flint", "glow"],
        choices: [
          { label: "Tell it a story", nextPageId: "p08_glow_story" },
          { label: "Speak softly", nextPageId: "p08_sorry_glow" },
        ]
      },
      {
        id: "p07_glow_wakes",
        text: ["The glow wakes up and turns bright gold.", "It rolls to the edge of the mound.", "Flint sits very still."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p07_glow_wakes"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p07_glow_wakes"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask the glow to return or give it time?",
        skillTags: ["flint", "glow", "gold"],
        choices: [
          { label: "Ask it to return", nextPageId: "p08_sorry_glow" },
          { label: "Give it time", nextPageId: "p07_glow_sleeps" },
        ]
      },
      {
        id: "p08_sorry_glow",
        text: ["Flint lowers his voice.", "\"Crystal Stream needs your light,\" he says.", "The glow rolls a little closer."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p08_sorry_glow"),
        audioUrl: moonwoodAudioPath("dewdrop-flint-lost-glow", "p08_sorry_glow"),
        narrationNeedsRebuild: true,
        choicePrompt: "Will the glow return or choose a new place?",
        skillTags: ["flint", "glow"],
        choices: [
          { label: "Return to the stream", nextPageId: "p10_gentle_ending" },
          { label: "Choose a new place", nextPageId: "p09_glow_chooses" },
        ]
      },
      {
        id: "p08_glow_story",
        text: ["The glow wakes for Flint's story.", "It follows Flint and Dewdrop to Crystal Stream.", "Blue water sparkles. Moonwood paths shine again."],
        imageUrl: moonwoodImagePath("dewdrop-flint-lost-glow", "p09_stream_returns"),
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
        text: ["The glow chooses a quiet stream bend.", "Its gold trail lights every Moonwood path.", "Flint and Dewdrop wave as it settles."],
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
        text: ["The glow returns to Crystal Stream.", "Gold light runs through the blue water.", "Flint lowers his lantern. Moonwood shines again."],
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
    highFrequencyWords: ["I", "a", "and", "can", "in", "is", "it", "not", "on", "says", "see", "the"],
    hfw: ["I", "a", "and", "can", "in", "is", "it", "not", "on", "says", "see", "the"],
    mediaFolder: "chompy-lunch-hunt",
    sentenceFrame: "Chompy can see the ___. \"___,\" says Chompy.",
    genuineFailurePageId: "p05_grumpy_tiny_smile",
    retiredPageIds: ["p04_not_full", "p04_more_food", "p04_leaf_lunch", "p05_mud_face", "p06_tummy_big", "p07_more_please", "p08_star_ending"],
    coverImageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Hungry Chompy plans a big picnic lunch.", "He will find food for every friend."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p01_start"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Where can Chompy look?",
        skillTags: ["chompy", "lunch", "hungry"],
        choices: [
          { label: "Red berries", nextPageId: "p02_berries" },
          { label: "Cave door", nextPageId: "p02_cave_door" },
        ]
      },
      {
        id: "p02_berries",
        text: ["Chompy picks red and purple berries.", "He piles them on one leaf."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p02_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p02_berries"),
        narrationNeedsRebuild: false,
        choicePrompt: "Eat the berries or save them to share?",
        skillTags: ["chompy", "berries", "lunch"],
        choices: [
          { label: "Eat the berries", nextPageId: "p03_eat_berries" },
          { label: "Save them to share", nextPageId: "p03_save_berries" },
        ]
      },
      {
        id: "p02_cave_door",
        text: ["Chompy sees Sunny by the cave.", "\"Can we feed every friend?\" asks Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p02_cave_door"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p02_cave_door"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask Sunny or follow a food smell?",
        skillTags: ["chompy", "sunny", "cave", "hungry"],
        choices: [
          { label: "Ask Sunny", nextPageId: "p03_ask_sunny" },
          { label: "Follow a food smell", nextPageId: "p03_sniff_path" },
        ]
      },
      {
        id: "p03_eat_berries",
        text: ["Chompy eats his leaf plate of berries.", "His tummy still rumbles."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_eat_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_eat_berries"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask a friend or search the meadow?",
        skillTags: ["chompy", "leaf", "berries", "hungry"],
        choices: [
          { label: "Follow a food smell", nextPageId: "p03_sniff_path" },
          { label: "Search Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p03_save_berries",
        text: ["Chompy saves berries in a leaf basket.", "They can be shared at the picnic."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_save_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_save_berries"),
        narrationNeedsRebuild: false,
        choicePrompt: "Offer Grumpy a berry or find more foods?",
        skillTags: ["chompy", "berries", "leaf", "basket"],
        choices: [
          { label: "Offer Grumpy one", nextPageId: "p04_grumpy_berries" },
          { label: "Find more foods", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p03_ask_sunny",
        text: ["Sunny smiles at Chompy.", "\"Let us find food for every friend.\""],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_ask_sunny"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_ask_sunny"),
        narrationNeedsRebuild: false,
        choicePrompt: "Pack Sunny's fruit or search by the rock?",
        skillTags: ["chompy", "sunny"],
        choices: [
          { label: "Pack the fruit", nextPageId: "p04_sunny_shares" },
          { label: "Search by the rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p03_sniff_path",
        text: ["Chompy sniffs the path. Sniff, sniff.", "One way has brown mud on it."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p03_sniff_path"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p03_sniff_path"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which smell can Chompy follow?",
        skillTags: ["chompy", "path", "mud"],
        choices: [
          { label: "Follow the mud", nextPageId: "p04_mud_smell" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p04_mud_smell",
        text: ["Chompy can see wet mud.", "\"Mud is not lunch,\" says Chompy."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p04_mud_smell"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p04_mud_smell"),
        narrationNeedsRebuild: true,
        choicePrompt: "Search by the rock or in Long Meadow?",
        skillTags: ["chompy", "mud", "lunch"],
        choices: [
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p04_sunny_shares",
        text: ["Sunny packs fruit. Chompy saves berries.", "Two friends still need lunch."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p04_sunny_shares"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p04_sunny_shares"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look by the rock or in Long Meadow?",
        skillTags: ["sunny", "chompy", "berries", "lunch"],
        choices: [
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
        ]
      },
      {
        id: "p04_grumpy_berries",
        text: ["Chompy offers Grumpy one purple berry.", "Grumpy shakes his head."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p04_grumpy_berries"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p04_grumpy_berries"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask Grumpy or find more foods?",
        skillTags: ["chompy", "berry", "grumpy"],
        choices: [
          { label: "Ask Grumpy", nextPageId: "p05_grumpy_tiny_smile" },
          { label: "Find more foods", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p05_grumpy_tiny_smile",
        text: ["Grumpy still does not want the berry.", "Chompy needs more than one food."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p05_grumpy_tiny_smile"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p05_grumpy_tiny_smile"),
        narrationNeedsRebuild: true,
        choicePrompt: "Ask Grumpy or search by the rock?",
        skillTags: ["chompy", "berry", "grumpy"],
        choices: [
          { label: "Ask Grumpy", nextPageId: "p06_grumpy_full" },
          { label: "Search by the rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p06_grumpy_full",
        text: ["Grumpy points past the berry basket.", "\"I like melon and leaves,\" he says."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p06_grumpy_full"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p06_grumpy_full"),
        narrationNeedsRebuild: false,
        choicePrompt: "Search Long Meadow or Big Flat Rock?",
        skillTags: ["chompy", "basket", "grumpy", "leaves"],
        choices: [
          { label: "Long Meadow", nextPageId: "p05_long_meadow" },
          { label: "Big Flat Rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p05_long_meadow",
        text: ["Chompy sees tall grass in Long Meadow.", "Something goes boing inside it."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p05_long_meadow"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p05_long_meadow"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look for Bouncy or search by the rock?",
        skillTags: ["chompy", "grass"],
        choices: [
          { label: "Look for Bouncy", nextPageId: "p06_bouncy_lunch" },
          { label: "Search by the rock", nextPageId: "p05_big_flat_rock" },
        ]
      },
      {
        id: "p05_big_flat_rock",
        text: ["Sunny and Grumpy meet Chompy at the rock.", "They bring fruit and green leaves."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p05_big_flat_rock"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p05_big_flat_rock"),
        narrationNeedsRebuild: true,
        choicePrompt: "Start the picnic or wait for Bouncy?",
        skillTags: ["sunny", "rock", "chompy", "grumpy"],
        choices: [
          { label: "Set every place", nextPageId: "p06_everyone_eats" },
          { label: "Wait for Bouncy", nextPageId: "p06_bouncy_lunch" },
        ]
      },
      {
        id: "p06_bouncy_lunch",
        text: ["Chompy finds Bouncy at the picnic rock.", "A spring foot bumps the berry basket."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p06_bouncy_lunch"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p06_bouncy_lunch"),
        narrationNeedsRebuild: true,
        choicePrompt: "Catch the berries or go back to Sunny?",
        skillTags: ["bouncy", "berries"],
        artAction: "approved-replacement",
        artNote: "The replacement preserves the berry-basket bump and shows Dino Bouncy with exactly two green three-toed feet above two separate coil springs.",
        choices: [
          { label: "Catch the berries", nextPageId: "p07_berry_rain" },
          { label: "Go back to Sunny", nextPageId: "p07_leaf_hat" },
        ]
      },
      {
        id: "p06_everyone_eats",
        text: ["Bouncy joins the picnic at Big Flat Rock.", "Every friend chooses a favorite food."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p06_everyone_eats"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p06_everyone_eats"),
        narrationNeedsRebuild: true,
        choicePrompt: "Thank the helpers or make a leaf hat?",
        skillTags: ["grumpy", "melon", "bouncy", "lunch", "chompy"],
        artAction: "approved-replacement",
        artNote: "The replacement shows all four friends choosing varied foods and Dino Bouncy with exactly two green three-toed feet above two separate coil springs.",
        choices: [
          { label: "Say thank you", nextPageId: "p08_thank_you_ending" },
          { label: "Make a leaf hat", nextPageId: "p07_leaf_hat" },
        ]
      },
      {
        id: "p07_berry_rain",
        text: ["Bouncy reaches for the berry basket.", "It tips, and the berries spill."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p07_berry_rain"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p07_berry_rain"),
        narrationNeedsRebuild: true,
        choicePrompt: "Wash the berries or pick them up?",
        skillTags: ["chompy", "leaf", "basket", "berries"],
        artAction: "approved-replacement",
        artNote: "The replacement makes the accidental basket spill clear and shows Dino Bouncy with exactly two arms, two feet and two coil springs.",
        choices: [
          { label: "Wash the berries", nextPageId: "p08_berry_mess_ending" },
          { label: "Pick them up", nextPageId: "p08_thank_you_ending" },
        ]
      },
      {
        id: "p07_leaf_hat",
        text: ["Sunny helps Chompy make a broad leaf hat.", "The picnic waits nearby."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p07_leaf_hat"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p07_leaf_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "Wear it or set the table?",
        skillTags: ["chompy", "leaf", "sunny", "hat"],
        choices: [
          { label: "Wear the leaf hat", nextPageId: "p08_leaf_hat_ending" },
          { label: "Set the table", nextPageId: "p08_thank_you_ending" },
        ]
      },
      {
        id: "p08_thank_you_ending",
        text: ["Every friend shares food at the picnic.", "Chompy thanks them for helping."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p08_thank_you_ending"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p08_thank_you_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["chompy", "grumpy", "bouncy", "sunny"],
        artAction: "approved-replacement",
        artNote: "The replacement shows Chompy, Sunny, Grumpy and Bouncy sharing the varied picnic, with Bouncy's two feet correctly seated above two springs.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_berry_mess_ending",
        text: ["Chompy and Bouncy wash every berry.", "The picnic food is clean again."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p08_berry_mess_ending"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p08_berry_mess_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["berries", "rock", "bouncy"],
        artAction: "approved-replacement",
        artNote: "The replacement shows Chompy and Bouncy washing the berries, the clean basket, and Sunny and Grumpy waiting at the picnic rock; Bouncy has two canonical spring feet.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_leaf_hat_ending",
        text: ["Chompy serves berries from his leaf hat.", "Every friend gets a picnic lunch."],
        imageUrl: dinoPalsImagePath("chompy-lunch-hunt", "p08_leaf_hat_ending"),
        audioUrl: dinoPalsAudioPath("chompy-lunch-hunt", "p08_leaf_hat_ending"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["chompy", "berries", "leaf", "hat", "sunny"],
        artAction: "approved-replacement",
        artNote: "The replacement shows Chompy serving berries from the broad leaf hat while Sunny, Grumpy and Bouncy each receive a varied picnic plate; Bouncy has two canonical spring feet.",
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
    highFrequencyWords: ["I", "a", "and", "in", "is", "it", "on", "one", "says", "see", "the", "up", "want"],
    hfw: ["I", "a", "and", "in", "is", "it", "on", "one", "says", "see", "the", "up", "want"],
    mediaFolder: "sunny-rainy-rescue",
    sentenceFrame: "___ is wet. \"I want a dry ___,\" says ___.",
    genuineFailurePageId: "p05_grumpy_splash",
    retiredPageIds: ["p04_wait", "p05_honky_rain", "p06_grumpy_ears", "p06_leaf_rain", "p06_dozy_again"],
    coverImageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Cold rain soaks Grumpy and Dozy.", "Sunny will help both friends get dry."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p01_start"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Who needs help first?",
        skillTags: ["rain", "grumpy", "dozy", "wet"],
        choices: [
          { label: "Go to Grumpy", nextPageId: "p02_grumpy" },
          { label: "Go to Dozy", nextPageId: "p02_dozy" },
        ]
      },
      {
        id: "p02_grumpy",
        text: ["Rain drips off Grumpy's back.", "\"I want a dry place,\" says Grumpy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p02_grumpy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p02_grumpy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Try the big rock or bring both friends to the cave?",
        skillTags: ["rain", "grumpy", "dry"],
        choices: [
          { label: "Big rock", nextPageId: "p03_dry_rock" },
          { label: "Bring both to cave", nextPageId: "p04_cave_grumpy" },
        ]
      },
      {
        id: "p02_dozy",
        text: ["Dozy hugs a wet blue pillow.", "\"I want a dry nap,\" says Dozy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p02_dozy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p02_dozy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Take Dozy to the cave or find a leaf?",
        skillTags: ["dozy", "pillow", "wet", "dry", "nap"],
        choices: [
          { label: "Go to Cozy Cave", nextPageId: "p03_cozy_cave" },
          { label: "Find a broad leaf", nextPageId: "p03_puddle" },
        ]
      },
      {
        id: "p03_dry_rock",
        text: ["The big rock is wet too.", "\"Not that one,\" says Grumpy."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p03_dry_rock"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p03_dry_rock"),
        narrationNeedsRebuild: true,
        choicePrompt: "Where can Sunny help them now?",
        skillTags: ["rock", "wet", "grumpy"],
        choices: [
          { label: "Bring both to cave", nextPageId: "p04_cave_grumpy" },
          { label: "Try the puddle", nextPageId: "p03_puddle" },
        ]
      },
      {
        id: "p03_cozy_cave",
        text: ["Sunny brings Dozy into Cozy Cave.", "Sunny dries Dozy's blue pillow."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p03_cozy_cave"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p03_cozy_cave"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can Sunny bring Grumpy in?",
        skillTags: ["cave", "dry", "dozy", "pillow"],
        choices: [
          { label: "Get Grumpy", nextPageId: "p04_cave_grumpy" },
          { label: "Ask Wiggly to help", nextPageId: "p04_wiggly_tail" },
        ]
      },
      {
        id: "p03_puddle",
        text: ["Sunny finds a broad leaf by the puddle.", "It may keep one friend dry."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p03_puddle"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p03_puddle"),
        narrationNeedsRebuild: false,
        choicePrompt: "Use the leaf or test the puddle?",
        skillTags: ["sunny", "puddle", "leaf"],
        choices: [
          { label: "Jump in", nextPageId: "p04_splash" },
          { label: "Make a leaf roof", nextPageId: "p05_leaf_roof" },
        ]
      },
      {
        id: "p04_splash",
        text: ["Sunny jumps into the muddy puddle.", "Mud flies far in every direction."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p04_splash"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p04_splash"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who should Sunny check first?",
        skillTags: ["sunny", "mud", "splash"],
        choices: [
          { label: "Check Grumpy", nextPageId: "p05_grumpy_splash" },
          { label: "Check Dozy", nextPageId: "p05_dozy_splash" },
        ]
      },
      {
        id: "p04_cave_grumpy",
        text: ["Sunny leads wet Grumpy into Cozy Cave.", "Dozy hugs his dry blue pillow."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p04_cave_grumpy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p04_cave_grumpy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Use a leaf roof or ask Wiggly?",
        skillTags: ["grumpy", "cave", "tail"],
        choices: [
          { label: "Find a big leaf", nextPageId: "p05_leaf_roof" },
          { label: "Ask Wiggly", nextPageId: "p04_wiggly_tail" },
        ]
      },
      {
        id: "p04_wiggly_tail",
        text: ["Sunny asks Wiggly to help.", "Wiggly's long tail swishes through the puddle."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p04_wiggly_tail"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p04_wiggly_tail"),
        narrationNeedsRebuild: false,
        choicePrompt: "Use a falling leaf or the big wave?",
        skillTags: ["wiggly", "puddle", "tail"],
        choices: [
          { label: "Use the big wave", nextPageId: "p05_tail_wave" },
          { label: "Catch a leaf", nextPageId: "p05_leaf_roof" },
        ]
      },
      {
        id: "p05_grumpy_splash",
        text: ["Mud hits Grumpy. SPLAT!", "\"Oh no,\" says Sunny."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_grumpy_splash"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_grumpy_splash"),
        narrationNeedsRebuild: false,
        choicePrompt: "Apologize first or bring the leaf?",
        skillTags: ["mud", "grumpy"],
        choices: [
          { label: "Say sorry", nextPageId: "p06_sorry_grumpy" },
          { label: "Bring the leaf", nextPageId: "p06_grumpy_dry" },
        ]
      },
      {
        id: "p05_dozy_splash",
        text: ["Mud lands by Dozy's blue pillow.", "\"Oh no!\" says Sunny."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_dozy_splash"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_dozy_splash"),
        narrationNeedsRebuild: false,
        choicePrompt: "Dry the pillow or make a leaf roof?",
        skillTags: ["mud", "pillow", "dozy"],
        choices: [
          { label: "Dry the pillow", nextPageId: "p06_dozy_dry" },
          { label: "Make a leaf roof", nextPageId: "p05_leaf_roof" },
        ]
      },
      {
        id: "p05_tail_wave",
        text: ["Wiggly dips his long tail in the puddle.", "Sunny thinks of a leaf boat."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_tail_wave"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_tail_wave"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask Grumpy to help or call both friends?",
        skillTags: ["wiggly", "puddle", "sunny", "tail"],
        choices: [
          { label: "Ask Grumpy to help", nextPageId: "p07_leaf_boat" },
          { label: "Call both friends", nextPageId: "p07_everyone_puddle" },
        ]
      },
      {
        id: "p05_leaf_roof",
        text: ["Sunny holds the broad leaf up.", "It makes a little green roof."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p05_leaf_roof"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p05_leaf_roof"),
        narrationNeedsRebuild: false,
        choicePrompt: "Take it to Grumpy or Dozy?",
        skillTags: ["sunny", "leaf", "rain"],
        choices: [
          { label: "Cover Grumpy", nextPageId: "p06_grumpy_dry" },
          { label: "Carry it to Dozy", nextPageId: "p06_dozy_dry" },
        ]
      },
      {
        id: "p06_sorry_grumpy",
        text: ["\"I am sorry,\" says Sunny.", "Sunny offers Grumpy the broad green leaf."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_sorry_grumpy"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_sorry_grumpy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Make a roof or give Grumpy time?",
        skillTags: ["sunny", "leaf"],
        choices: [
          { label: "Make a leaf roof", nextPageId: "p06_grumpy_dry" },
          { label: "Give him time", nextPageId: "p06_grumpy_smile" },
        ]
      },
      {
        id: "p06_grumpy_dry",
        text: ["Sunny builds a broad leaf roof.", "Grumpy waits underneath, warm and dry."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_grumpy_dry"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_grumpy_dry"),
        narrationNeedsRebuild: true,
        choicePrompt: "Gather in the cave or play after the rain?",
        skillTags: ["grumpy", "leaf"],
        choices: [
          { label: "Call everyone outside", nextPageId: "p07_everyone_puddle" },
          { label: "Gather friends in cave", nextPageId: "p08_quiet_ending" },
        ]
      },
      {
        id: "p06_dozy_dry",
        text: ["Dozy sleeps on his dry blue pillow.", "Sunny must still bring Grumpy in."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_dozy_dry"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_dozy_dry"),
        narrationNeedsRebuild: false,
        choicePrompt: "Bring Grumpy in or call him outside?",
        skillTags: ["dozy", "dry", "pillow", "cave"],
        choices: [
          { label: "Bring Grumpy and Wiggly", nextPageId: "p08_quiet_ending" },
          { label: "Call Grumpy and Wiggly", nextPageId: "p07_everyone_puddle" },
        ]
      },
      {
        id: "p06_grumpy_smile",
        text: ["Sunny waits quietly by Cozy Cave.", "Grumpy comes close at last."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p06_grumpy_smile"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p06_grumpy_smile"),
        narrationNeedsRebuild: true,
        choicePrompt: "Call Dozy out or make a leaf boat?",
        skillTags: ["grumpy", "cave", "sunny", "rain"],
        choices: [
          { label: "Call everyone outside", nextPageId: "p07_everyone_puddle" },
          { label: "Make a leaf boat", nextPageId: "p07_leaf_boat" },
        ]
      },
      {
        id: "p07_leaf_boat",
        text: ["Sunny folds the leaf into a boat.", "Grumpy pushes it across the puddle."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p07_leaf_boat"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p07_leaf_boat"),
        narrationNeedsRebuild: true,
        choicePrompt: "Call the friends to the boat or the rainbow?",
        skillTags: ["sunny", "boat", "leaf", "grumpy"],
        choices: [
          { label: "Call friends to rainbow", nextPageId: "p08_rainbow_ending" },
          { label: "Call Dozy and Wiggly", nextPageId: "p08_grumpy_laugh_ending" },
        ]
      },
      {
        id: "p07_everyone_puddle",
        text: ["Sunny calls Grumpy and Dozy outside.", "Grumpy and Wiggly splash together."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p07_everyone_puddle"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p07_everyone_puddle"),
        narrationNeedsRebuild: true,
        choicePrompt: "Float a leaf boat or look at the sky?",
        skillTags: ["grumpy", "splash", "puddle", "sunny"],
        choices: [
          { label: "Look for a rainbow", nextPageId: "p08_rainbow_ending" },
          { label: "Float a leaf boat", nextPageId: "p08_grumpy_laugh_ending" },
        ]
      },
      {
        id: "p08_rainbow_ending",
        text: ["All four friends see a rainbow.", "Grumpy is warm. Dozy's blue pillow is dry."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p08_rainbow_ending"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p08_rainbow_ending"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy", "dozy", "rainbow", "sunny"],
        artAction: "approved-existing",
        artNote: "The approved image shows Sunny, Grumpy, Dozy with his dry blue pillow, and Wiggly together under the rainbow after the storm.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_grumpy_laugh_ending",
        text: ["All four friends float the leaf boat.", "Grumpy splashes. Dozy keeps his pillow dry."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p08_grumpy_laugh_ending"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p08_grumpy_laugh_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["dozy", "grumpy", "splash", "puddle"],
        artAction: "approved-replacement",
        artNote: "The replacement shows exactly Sunny, Grumpy, Dozy and Wiggly after the rain, with Grumpy splashing, Dozy beside his dry blue pillow and a leaf boat floating in the puddle.",
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_quiet_ending",
        text: ["All four friends rest in Cozy Cave.", "Grumpy is warm. Dozy's pillow is dry."],
        imageUrl: dinoPalsImagePath("sunny-rainy-rescue", "p08_quiet_ending"),
        audioUrl: dinoPalsAudioPath("sunny-rainy-rescue", "p08_quiet_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["dozy", "nap", "grumpy", "rain"],
        artAction: "approved-existing",
        artNote: "The approved image shows Dozy sleeping on the blue pillow while Sunny, Grumpy and Wiggly rest safely inside the lamp-lit cave as rain falls outside.",
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
    skillFocus: "Reading short cause-and-effect sentences about Grumpy's nap",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Grumpy", "Chompy", "Wiggly", "Fancy", "Dozy", "Bouncy", "Sunny"],
    location: "Sunny Hollow - berry bush, stream, stones, sunny path",
    targetWords: ["Grumpy", "Chompy", "Wiggly", "Fancy", "Dozy", "Bouncy", "Sunny", "stream", "bush", "berry", "berries", "stone", "stones", "twig", "tail", "path", "nap", "fish"],
    highFrequencyWords: ["a", "and", "at", "in", "is", "not", "on", "one", "the", "up"],
    hfw: ["a", "and", "at", "in", "is", "not", "on", "one", "the", "up"],
    mediaFolder: "grumpy-almost-good-day",
    sentenceFrame: "Grumpy tries ___. The ___ changes his nap.",
    genuineFailurePageId: "p04_ignore_chompy",
    retiredPageIds: ["p05_chompy_delight", "p06_fish_jumps", "p06_warm_sun", "p07_peaceful_stream", "p07_berry_everywhere"],
    coverImageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Grumpy wants a cool, quiet nap.", "A hard twig pokes his side."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p01_start"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Try the cool stream or the shady bush?",
        skillTags: ["grumpy", "bush", "twig"],
        choices: [
          { label: "Go to the stream", nextPageId: "p02_stream" },
          { label: "Stay in the bush", nextPageId: "p02_bush" },
        ]
      },
      {
        id: "p02_stream",
        text: ["The cool stream bumps Grumpy's feet.", "It is not calm yet."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p02_stream"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p02_stream"),
        narrationNeedsRebuild: false,
        choicePrompt: "Rest in the water or step onto land?",
        skillTags: ["grumpy", "stream"],
        choices: [
          { label: "Sit in the water", nextPageId: "p03_chompy_finds" },
          { label: "Step out", nextPageId: "p03_stones_fall" },
        ]
      },
      {
        id: "p03_chompy_finds",
        text: ["Chompy finds Grumpy in the stream.", "Grumpy asks for a quiet nap."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_chompy_finds"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_chompy_finds"),
        narrationNeedsRebuild: false,
        choicePrompt: "Invite Chompy or send him away?",
        skillTags: ["grumpy", "stream", "chompy"],
        choices: [
          { label: "Splash together", nextPageId: "p04_splash_chompy" },
          { label: "Tell Chompy to go", nextPageId: "p04_ignore_chompy" },
        ]
      },
      {
        id: "p04_ignore_chompy",
        text: ["Grumpy sends Chompy away. Chompy frowns.", "\"I am sorry,\" says Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_ignore_chompy"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_ignore_chompy"),
        narrationNeedsRebuild: true,
        choicePrompt: "What can they do now?",
        skillTags: ["grumpy", "chompy"],
        choices: [
          { label: "Sit quietly together", nextPageId: "p05_quiet_stream" },
          { label: "Splash together", nextPageId: "p04_splash_chompy" },
        ]
      },
      {
        id: "p04_splash_chompy",
        text: ["Grumpy and Chompy splash together.", "The fun is too loud for sleep."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_splash_chompy"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_splash_chompy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Welcome Wiggly or watch quietly?",
        skillTags: ["grumpy", "tail", "chompy"],
        choices: [
          { label: "Welcome Wiggly", nextPageId: "p06_wiggly_splash" },
          { label: "Watch quietly", nextPageId: "p05_quiet_stream" },
        ]
      },
      {
        id: "p05_quiet_stream",
        text: ["They sit still by the stream.", "A jumping fish breaks the quiet."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_quiet_stream"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_quiet_stream"),
        narrationNeedsRebuild: false,
        choicePrompt: "Welcome Wiggly or rest by the fish?",
        skillTags: ["fish", "stream", "chompy"],
        choices: [
          { label: "Welcome Wiggly", nextPageId: "p06_wiggly_splash" },
          { label: "Call Wiggly, then rest", nextPageId: "p08_soaked_ending" },
        ]
      },
      {
        id: "p06_wiggly_splash",
        text: ["Wiggly steps into the stream.", "His long tail sends up a huge wave."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_wiggly_splash"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_wiggly_splash"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ride the wave or find dry ground?",
        skillTags: ["wiggly", "stream", "tail"],
        choices: [
          { label: "One big wave", nextPageId: "p07_all_soaked" },
          { label: "Find dry ground", nextPageId: "p08_soaked_ending" },
        ]
      },
      {
        id: "p07_all_soaked",
        text: ["The wave soaks all three friends.", "Grumpy's nap place is gone."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_all_soaked"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_all_soaked"),
        narrationNeedsRebuild: false,
        choicePrompt: "Dry together or find warm ground?",
        skillTags: ["grumpy", "chompy", "wet"],
        choices: [
          { label: "Dry together", nextPageId: "p08_soaked_ending" },
          { label: "Find warm ground", nextPageId: "p08_warm_ground_ending" },
        ]
      },
      {
        id: "p08_soaked_ending",
        text: ["Chompy and Wiggly rest with Grumpy.", "His quiet nap can start."],
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
        id: "p08_warm_ground_ending",
        text: ["They find warm ground in the sun.", "Grumpy naps beside Chompy and Wiggly."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_warm_ground_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_warm_ground_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy", "chompy", "wiggly", "nap"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p03_stones_fall",
        text: ["Grumpy steps out to find dry shade.", "His tail knocks down Fancy's stone tower."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_stones_fall"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_stones_fall"),
        narrationNeedsRebuild: false,
        choicePrompt: "Check the stones or tell Fancy?",
        skillTags: ["grumpy", "tail", "stones"],
        choices: [
          { label: "Look at the stones", nextPageId: "p04_look_at_stones" },
          { label: "Tell Fancy", nextPageId: "p04_tell_fancy" },
        ]
      },
      {
        id: "p04_tell_fancy",
        text: ["Grumpy calls Fancy to the fallen tower.", "She comes to see the stones."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_tell_fancy"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_tell_fancy"),
        narrationNeedsRebuild: true,
        choicePrompt: "Hear Fancy's plan or start rebuilding?",
        skillTags: ["grumpy", "fancy", "stones"],
        choices: [
          { label: "Hear Fancy's plan", nextPageId: "p05_fancy_stones" },
          { label: "Start rebuilding together", nextPageId: "p06_rebuild_stones" },
        ]
      },
      {
        id: "p04_look_at_stones",
        text: ["The fallen stones block the shady spot.", "Grumpy can leave or fix them."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_look_at_stones"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_look_at_stones"),
        narrationNeedsRebuild: false,
        choicePrompt: "Tell Fancy or start rebuilding?",
        skillTags: ["grumpy", "stones"],
        choices: [
          { label: "Tell Fancy", nextPageId: "p05_fancy_stones" },
          { label: "Start stacking", nextPageId: "p06_rebuild_stones" },
        ]
      },
      {
        id: "p05_fancy_stones",
        text: ["Grumpy tells Fancy what happened.", "She asks him to rebuild the tower."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_fancy_stones"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_fancy_stones"),
        narrationNeedsRebuild: false,
        choicePrompt: "Build together or choose the top stone?",
        skillTags: ["grumpy", "stones", "fancy"],
        choices: [
          { label: "Build it together", nextPageId: "p06_rebuild_stones" },
          { label: "Choose the top stone", nextPageId: "p07_tower_rebuilt" },
        ]
      },
      {
        id: "p06_rebuild_stones",
        text: ["Grumpy pushes the flat stones together.", "Fancy holds the stack still."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_rebuild_stones"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_rebuild_stones"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who should set the top stone?",
        skillTags: ["grumpy", "stone", "fancy"],
        choices: [
          { label: "Set the top stone", nextPageId: "p07_tower_rebuilt" },
          { label: "Let Fancy set it", nextPageId: "p07_fancy_tower_ending" },
        ]
      },
      {
        id: "p07_tower_rebuilt",
        text: ["The stone tower stands again.", "Its cool shade gives Grumpy a quiet nap."],
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
        id: "p07_fancy_tower_ending",
        text: ["Fancy's top stone completes the tower.", "Grumpy's quiet nap place is ready."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_stone_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_fancy_tower_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["stone", "fancy", "grumpy", "nap"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p02_bush",
        text: ["The berry bush is shady.", "But the hard twig pokes Grumpy again."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p02_bush"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p02_bush"),
        narrationNeedsRebuild: false,
        choicePrompt: "Try a berry or move the twig?",
        skillTags: ["grumpy", "berry", "bush", "twig"],
        choices: [
          { label: "Eat one berry", nextPageId: "p03_berry_protest" },
          { label: "Look at the twigs", nextPageId: "p03_list_making" },
        ]
      },
      {
        id: "p03_berry_protest",
        text: ["Grumpy eats one purple berry.", "It is sweet, but the twig still pokes."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_berry_protest"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_berry_protest"),
        narrationNeedsRebuild: false,
        choicePrompt: "Eat alone or make a berry game?",
        skillTags: ["grumpy", "berry"],
        choices: [
          { label: "Eat alone", nextPageId: "p04_eat_secretly" },
          { label: "Make a berry game", nextPageId: "p04_berry_throw" },
        ]
      },
      {
        id: "p03_list_making",
        text: ["Grumpy stares at the hard twig.", "It lies beside his nap place."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p03_list_making"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p03_list_making"),
        narrationNeedsRebuild: true,
        choicePrompt: "Ask Sunny or try a berry?",
        skillTags: ["grumpy", "twig"],
        choices: [
          { label: "Ask for help", nextPageId: "p04_tell_sunny" },
          { label: "Eat one berry", nextPageId: "p03_berry_protest" },
        ]
      },
      {
        id: "p04_eat_secretly",
        text: ["Grumpy gulps berries without looking up.", "Dozy brings a soft blue pillow."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_eat_secretly"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_eat_secretly"),
        narrationNeedsRebuild: true,
        choicePrompt: "Welcome Dozy now or rest beside him?",
        skillTags: ["grumpy", "dozy", "bush"],
        choices: [
          { label: "Share the shade", nextPageId: "p05_dozy_finds" },
          { label: "Rest beside Dozy", nextPageId: "p07_grumpy_naps" },
        ]
      },
      {
        id: "p05_dozy_finds",
        text: ["Dozy curls on his blue pillow.", "Grumpy lies beside him on warm ground."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_dozy_finds"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_dozy_finds"),
        narrationNeedsRebuild: true,
        choicePrompt: "Nap beside Dozy or sit very still?",
        skillTags: ["dozy", "grumpy"],
        choices: [
          { label: "Nap too", nextPageId: "p07_grumpy_naps" },
          { label: "Sit very still", nextPageId: "p08_nap_ending" },
        ]
      },
      {
        id: "p07_grumpy_naps",
        text: ["Grumpy curls beside Dozy.", "The warm bush becomes a quiet nap place."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_grumpy_naps"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_grumpy_naps"),
        narrationNeedsRebuild: false,
        choicePrompt: "Wake after the nap or rest longer?",
        skillTags: ["grumpy", "dozy", "bush"],
        choices: [
          { label: "Wake up", nextPageId: "p08_nap_ending" },
          { label: "Rest longer", nextPageId: "p08_long_nap_ending" },
        ]
      },
      {
        id: "p08_nap_ending",
        text: ["Grumpy rests beside sleeping Dozy.", "The bush is quiet at last."],
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
        id: "p08_long_nap_ending",
        text: ["Grumpy and Dozy keep resting.", "The quiet bush shades them."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_long_nap_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_long_nap_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy", "dozy", "bush", "nap"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p04_berry_throw",
        text: ["Bouncy brings a leaf basket.", "A berry game may move the twig."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_berry_throw"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_berry_throw"),
        narrationNeedsRebuild: false,
        choicePrompt: "Take turns or use Grumpy's tail?",
        skillTags: ["grumpy", "bouncy"],
        choices: [
          { label: "Take turns", nextPageId: "p05_bouncy_berries" },
          { label: "Tail bat", nextPageId: "p06_berry_chaos" },
        ]
      },
      {
        id: "p05_bouncy_berries",
        text: ["Grumpy bats one berry with his tail.", "Bouncy bounces beside the leaf basket."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_bouncy_berries"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_bouncy_berries"),
        narrationNeedsRebuild: true,
        choicePrompt: "Bat again or clean up?",
        skillTags: ["bouncy", "berries"],
        choices: [
          { label: "Bat again", nextPageId: "p06_berry_chaos" },
          { label: "Stop and clean up", nextPageId: "p08_almost_ending" },
        ]
      },
      {
        id: "p06_berry_chaos",
        text: ["The basket tips and berries scatter.", "Grumpy's nap place is messier than before."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_berry_chaos"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_berry_chaos"),
        narrationNeedsRebuild: false,
        choicePrompt: "Clean together or ask Sunny?",
        skillTags: ["berries", "berry", "grumpy"],
        choices: [
          { label: "Clean together", nextPageId: "p08_almost_ending" },
          { label: "Ask for help", nextPageId: "p04_tell_sunny" },
        ]
      },
      {
        id: "p04_tell_sunny",
        text: ["Grumpy shows Sunny the hard twig.", "She asks how they can clear the shade."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p04_tell_sunny"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p04_tell_sunny"),
        narrationNeedsRebuild: false,
        choicePrompt: "Move the twig now or wait?",
        skillTags: ["sunny", "berry", "bush", "grumpy", "twig"],
        choices: [
          { label: "Move the twig", nextPageId: "p05_sunny_helps" },
          { label: "Wait a bit", nextPageId: "p07_one_thing_done" },
        ]
      },
      {
        id: "p05_sunny_helps",
        text: ["Sunny brings ferns for the shade.", "One hard twig lies by Grumpy."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p05_sunny_helps"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p05_sunny_helps"),
        narrationNeedsRebuild: true,
        choicePrompt: "Move the twig or walk away?",
        skillTags: ["twig", "grumpy", "sunny"],
        choices: [
          { label: "Move the twig", nextPageId: "p06_twig_fixed" },
          { label: "Walk away", nextPageId: "p07_one_thing_done" },
        ]
      },
      {
        id: "p07_one_thing_done",
        text: ["Grumpy starts to walk away.", "Sunny watches from the berry bush."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p07_one_thing_done"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p07_one_thing_done"),
        narrationNeedsRebuild: true,
        choicePrompt: "Turn back or ask Sunny?",
        skillTags: ["sunny", "path"],
        choices: [
          { label: "Turn back", nextPageId: "p06_twig_fixed" },
          { label: "Ask Sunny", nextPageId: "p08_sunny_help_ending" },
        ]
      },
      {
        id: "p06_twig_fixed",
        text: ["The hard twig lies off the path.", "Grumpy naps in the quiet shade."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p06_twig_fixed"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p06_twig_fixed"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["twig", "path", "grumpy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_sunny_help_ending",
        text: ["Sunny helps Grumpy move the hard twig.", "His quiet nap place is ready."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_sunny_help_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_sunny_help_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["sunny", "grumpy", "twig", "nap"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_almost_ending",
        text: ["Berries fill the basket again.", "Grumpy finds quiet ground past the twigs."],
        imageUrl: dinoPalsImagePath("grumpy-almost-good-day", "p08_almost_ending"),
        audioUrl: dinoPalsAudioPath("grumpy-almost-good-day", "p08_almost_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["grumpy"],
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
    targetWords: ["Bouncy", "Chompy", "Grumpy", "Fancy", "Dozy", "Wiggly", "bounce", "berries", "berry", "bush", "basket", "cave", "moss", "mud", "rock", "leaf", "ferns", "branch", "tail", "stone"],
    highFrequencyWords: ["a", "and", "can", "in", "is", "it", "on", "one", "the", "up"],
    hfw: ["a", "and", "can", "in", "is", "it", "on", "one", "the", "up"],
    mediaFolder: "bouncy-big-bounce",
    sentenceFrame: "Bouncy carries the basket to ___. The ___ changes the trip.",
    genuineFailurePageId: "p05_legs_give_up",
    retiredPageIds: ["p04_nearly_there", "p05_launched_out", "p06_dozy_wide_awake", "p06_fancy_dismay", "p06_over_stream", "p06_bouncy_launched", "p07_bouncy_repairs", "p07_grumpy_sticky", "p07_grumpy_stream"],
    coverImageUrl: dinoPalsImagePath("bouncy-big-bounce", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Bouncy carries the berry basket.", "The picnic waits at Big Flat Rock."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p01_start"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which path should Bouncy take?",
        skillTags: ["bouncy", "bounce", "cave"],
        choices: [
          { label: "Berry bush path", nextPageId: "p02_berry_corner" },
          { label: "Quiet cave path", nextPageId: "p02_cozy_cave" },
        ]
      },
      {
        id: "p02_berry_corner",
        text: ["The basket needs more berries.", "Chompy points to a high branch."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p02_berry_corner"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p02_berry_corner"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should they fill the basket?",
        skillTags: ["bouncy", "berry", "bush", "chompy", "berries"],
        choices: [
          { label: "Try small bounces", nextPageId: "p03_help_chompy" },
          { label: "Rush around the bush", nextPageId: "p03_too_fast" },
        ]
      },
      {
        id: "p03_help_chompy",
        text: ["Chompy holds the basket below.", "Bouncy studies the high berry branch."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_help_chompy"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_help_chompy"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should Bouncy shake the berries?",
        skillTags: ["chompy", "leaf", "bouncy", "branch"],
        choices: [
          { label: "One huge bounce", nextPageId: "p04_big_bounce" },
          { label: "Three small bounces", nextPageId: "p04_careful_bounce" },
        ]
      },
      {
        id: "p04_big_bounce",
        text: ["One huge bounce shakes the branch.", "Berries fly past the basket."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_big_bounce"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_big_bounce"),
        narrationNeedsRebuild: false,
        choicePrompt: "How can they save the flying berries?",
        skillTags: ["bouncy", "bounce", "berries"],
        choices: [
          { label: "Catch them below", nextPageId: "p05_berries_fly" },
          { label: "Ask Grumpy, bounce again", nextPageId: "p05_legs_give_up" },
        ]
      },
      {
        id: "p04_careful_bounce",
        text: ["Small bounces shake two berries down.", "Both land in the basket."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_careful_bounce"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_careful_bounce"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should they gather the last berries?",
        skillTags: ["bouncy", "boing", "berries"],
        choices: [
          { label: "Ask Chompy and Grumpy", nextPageId: "p06_chompy_catches" },
          { label: "Ask Grumpy, keep bouncing", nextPageId: "p05_legs_give_up" },
        ]
      },
      {
        id: "p05_berries_fly",
        text: ["Red berries rain around Chompy.", "He holds the basket wide."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_berries_fly"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_berries_fly"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should they catch the last berries?",
        skillTags: ["berries", "chompy", "leaf"],
        choices: [
          { label: "Use Grumpy's broad leaf", nextPageId: "p06_chompy_catches" },
          { label: "Ask Grumpy, bounce again", nextPageId: "p05_legs_give_up" },
        ]
      },
      {
        id: "p05_legs_give_up",
        text: ["Bouncy's tired springs fold in the ferns.", "Chompy and Grumpy see the berries spill."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_legs_give_up"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_legs_give_up"),
        narrationNeedsRebuild: true,
        choicePrompt: "How can they go on?",
        skillTags: ["bouncy", "ferns", "boing", "berries"],
        choices: [
          { label: "Rest, then gather them", nextPageId: "p06_everyone_sticky" },
          { label: "Ask friends to help", nextPageId: "p06_chompy_catches" },
        ]
      },
      {
        id: "p06_chompy_catches",
        text: ["Grumpy joins them with a broad leaf.", "Chompy catches berries in the basket."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_chompy_catches"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_chompy_catches"),
        narrationNeedsRebuild: true,
        choicePrompt: "What should they do with the last berries?",
        skillTags: ["grumpy", "leaf", "berries"],
        choices: [
          { label: "Catch the last berry", nextPageId: "p07_grumpy_nose" },
          { label: "Gather the dusty berries", nextPageId: "p06_everyone_sticky" },
        ]
      },
      {
        id: "p06_everyone_sticky",
        text: ["Chompy and Grumpy help Bouncy gather berries.", "They keep the clean ones."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_everyone_sticky"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_everyone_sticky"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who should help carry the clean berries?",
        skillTags: ["berries", "bouncy"],
        choices: [
          { label: "Carry with Grumpy", nextPageId: "p07_grumpy_nose" },
          { label: "Call Wiggly to help", nextPageId: "p08_berry_ending" },
        ]
      },
      {
        id: "p07_grumpy_nose",
        text: ["Grumpy brings the full basket to the rock.", "Bouncy and Chompy start the picnic."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_grumpy_nose"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_grumpy_nose"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["leaf", "grumpy", "bouncy", "chompy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p03_too_fast",
        text: ["Bouncy rushes. The basket swings.", "Berries spill by a muddy puddle."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_too_fast"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_too_fast"),
        narrationNeedsRebuild: false,
        choicePrompt: "Where should Bouncy turn?",
        skillTags: ["bouncy", "mud"],
        choices: [
          { label: "Turn toward the bush", nextPageId: "p04_bush_crash" },
          { label: "Jump across the puddle", nextPageId: "p04_puddle_bounce" },
        ]
      },
      {
        id: "p04_bush_crash",
        text: ["The basket snags a berry bush.", "A branch bends, and berries roll away."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_bush_crash"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_bush_crash"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should Bouncy repair the damage?",
        skillTags: ["bouncy", "chompy", "berries"],
        choices: [
          { label: "Ask Fancy to help", nextPageId: "p05_fancy_bush_hit" },
          { label: "Ask Fancy, lift it", nextPageId: "p07_new_bush" },
        ]
      },
      {
        id: "p05_fancy_bush_hit",
        text: ["Fancy props up the bent branch.", "The loose berries still need help."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_fancy_bush_hit"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_fancy_bush_hit"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which job should Bouncy do first?",
        skillTags: ["branch", "fancy"],
        choices: [
          { label: "Tie the branch upright", nextPageId: "p07_new_bush" },
          { label: "Fix and gather", nextPageId: "p08_fancy_ending" },
        ]
      },
      {
        id: "p07_new_bush",
        text: ["Bouncy and Fancy tie the bush up.", "The basket is ready again."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_new_bush"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_new_bush"),
        narrationNeedsRebuild: false,
        choicePrompt: "Invite Fancy or cross the stones alone?",
        skillTags: ["bouncy", "fancy", "bush"],
        choices: [
          { label: "Invite Fancy along", nextPageId: "p08_fancy_ending" },
          { label: "Cross stones alone", nextPageId: "p08_stream_ending" },
        ]
      },
      {
        id: "p04_puddle_bounce",
        text: ["Splash! Bouncy lands in the mud.", "The basket stays upright."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_puddle_bounce"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_puddle_bounce"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should Bouncy clean the basket?",
        skillTags: ["bouncy", "mud"],
        choices: [
          { label: "Rinse it with water", nextPageId: "p05_mud_everywhere" },
          { label: "Ask Fancy for moss", nextPageId: "p06_fancy_mud_sail" },
        ]
      },
      {
        id: "p05_mud_everywhere",
        text: ["Bouncy rinses mud from the basket.", "Fancy brings soft moss to dry it."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_mud_everywhere"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_mud_everywhere"),
        narrationNeedsRebuild: false,
        choicePrompt: "Is the basket ready for the picnic?",
        skillTags: ["bouncy", "mud", "fancy", "moss"],
        choices: [
          { label: "Dry it with moss", nextPageId: "p06_fancy_mud_sail" },
          { label: "Dry it, then cross", nextPageId: "p08_stream_ending" },
        ]
      },
      {
        id: "p06_fancy_mud_sail",
        text: ["Bouncy wipes the basket with moss.", "Fancy holds it for him."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_fancy_mud_sail"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_fancy_mud_sail"),
        narrationNeedsRebuild: false,
        choicePrompt: "Who can guide Bouncy to Big Flat Rock?",
        skillTags: ["bouncy", "fancy", "mud"],
        choices: [
          { label: "Thank Fancy; ask Wiggly", nextPageId: "p07_big_flat_rock" },
          { label: "Cross stones alone", nextPageId: "p08_stream_ending" },
        ]
      },
      {
        id: "p02_cozy_cave",
        text: ["The cave is still. Dozy sleeps.", "Bouncy carries the basket past him."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p02_cozy_cave"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p02_cozy_cave"),
        narrationNeedsRebuild: false,
        choicePrompt: "How can Bouncy let Dozy sleep?",
        skillTags: ["cave", "dozy", "pillow"],
        choices: [
          { label: "Walk without bouncing", nextPageId: "p03_tiptoe_out" },
          { label: "Try one tiny bounce", nextPageId: "p03_bounce_inside" },
        ]
      },
      {
        id: "p03_tiptoe_out",
        text: ["Bouncy tiptoes with the basket.", "A loose pebble lies near."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_tiptoe_out"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_tiptoe_out"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should Bouncy cross the pebbles?",
        skillTags: ["bouncy", "pillow", "boing"],
        choices: [
          { label: "Kick the pebble", nextPageId: "p04_pebble_trip" },
          { label: "Take slow, quiet steps", nextPageId: "p04_quiet_exit" },
        ]
      },
      {
        id: "p04_quiet_exit",
        text: ["Bouncy steps around the pebble.", "Dozy sleeps as Bouncy leaves the cave."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_quiet_exit"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_quiet_exit"),
        narrationNeedsRebuild: true,
        choicePrompt: "Which path should Bouncy check outside?",
        skillTags: ["bouncy", "dozy", "pebble", "cave"],
        choices: [
          { label: "Check the rock path", nextPageId: "p06_outside_paths" },
          { label: "Check the stream", nextPageId: "p06_quiet_stream_path" },
        ]
      },
      {
        id: "p06_outside_paths",
        text: ["Bouncy walks the dry rock path.", "The full basket stays steady."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_outside_paths"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_outside_paths"),
        narrationNeedsRebuild: true,
        choicePrompt: "How should Bouncy reach Big Flat Rock?",
        skillTags: ["bouncy", "basket", "rock", "path"],
        choices: [
          { label: "Stay on the rocks", nextPageId: "p08_quiet_rock_ending" },
          { label: "Cross the stream", nextPageId: "p08_stream_ending" },
        ]
      },
      {
        id: "p06_quiet_stream_path",
        text: ["Bouncy stops beside the stream stones.", "The full basket stays dry."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p06_quiet_stream_path"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p06_quiet_stream_path"),
        narrationNeedsRebuild: true,
        choicePrompt: "How should Bouncy reach Big Flat Rock?",
        skillTags: ["bouncy", "basket", "stream", "stone"],
        choices: [
          { label: "Cross the stones", nextPageId: "p08_stream_ending" },
          { label: "Take the rock path", nextPageId: "p08_quiet_rock_ending" },
        ]
      },
      {
        id: "p03_bounce_inside",
        text: ["One tiny bounce makes the basket rattle.", "The echo fills the cave."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p03_bounce_inside"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p03_bounce_inside"),
        narrationNeedsRebuild: false,
        choicePrompt: "How can Bouncy quiet the basket?",
        skillTags: ["bouncy", "bounce", "boing", "cave"],
        choices: [
          { label: "Use the soft moss", nextPageId: "p04_cave_chaos" },
          { label: "Hold the basket still", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p04_pebble_trip",
        text: ["The pebble clicks on the basket.", "Dozy opens one sleepy eye."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_pebble_trip"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_pebble_trip"),
        narrationNeedsRebuild: false,
        choicePrompt: "How can Bouncy keep the cave quiet?",
        skillTags: ["dozy"],
        choices: [
          { label: "Say sorry; call Wiggly", nextPageId: "p05_apology_before_wiggly" },
          { label: "Say sorry to Dozy", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p04_cave_chaos",
        text: ["Bouncy sets the basket on green moss.", "It tips, but the berries stay in."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p04_cave_chaos"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p04_cave_chaos"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should Bouncy steady the basket?",
        skillTags: ["bouncy", "moss", "dozy"],
        choices: [
          { label: "Say sorry; call Wiggly", nextPageId: "p05_apology_before_wiggly" },
          { label: "Hold it and wait", nextPageId: "p05_cave_echo" },
        ]
      },
      {
        id: "p05_apology_before_wiggly",
        text: ["\"Sorry, Dozy,\" says Bouncy.", "Dozy nods. Bouncy calls Wiggly."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_apology_before_wiggly"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_apology_before_wiggly"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who should help Bouncy leave the cave?",
        skillTags: ["bouncy", "dozy", "sorry", "wiggly"],
        choices: [
          { label: "Ask Wiggly for help", nextPageId: "p05_wiggly_enters" },
          { label: "Ask Dozy for help", nextPageId: "p07_dozy_advice" },
        ]
      },
      {
        id: "p05_cave_echo",
        text: ["\"Sorry, Dozy,\" says Bouncy.", "Bouncy holds the basket still. The echo fades."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_cave_echo"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_cave_echo"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can help them leave?",
        skillTags: ["dozy", "bouncy"],
        choices: [
          { label: "Ask Dozy for directions", nextPageId: "p07_dozy_advice" },
          { label: "Ask Wiggly for help", nextPageId: "p05_wiggly_enters" },
        ]
      },
      {
        id: "p05_wiggly_enters",
        text: ["Wiggly lays down his long tail.", "It makes a rail for the basket."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p05_wiggly_enters"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p05_wiggly_enters"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should they leave the cave?",
        skillTags: ["wiggly", "tail", "bouncy"],
        choices: [
          { label: "Follow Wiggly outside", nextPageId: "p07_big_flat_rock" },
          { label: "Thank Wiggly, ask Dozy", nextPageId: "p07_dozy_advice" },
        ]
      },
      {
        id: "p07_dozy_advice",
        text: ["Dozy shows a quiet path out.", "Bouncy steadies the basket and walks."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_dozy_advice"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_dozy_advice"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which way should Bouncy reach the picnic?",
        skillTags: ["bouncy", "dozy"],
        choices: [
          { label: "Take the rock path", nextPageId: "p08_rock_ending" },
          { label: "Cross stones alone", nextPageId: "p08_stream_ending" },
        ]
      },
      {
        id: "p07_big_flat_rock",
        text: ["Bouncy and Wiggly bring the full basket.", "They reach Big Flat Rock."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p07_big_flat_rock"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p07_big_flat_rock"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who joins them at the picnic?",
        skillTags: ["bouncy", "rock"],
        choices: [
          { label: "Meet Chompy", nextPageId: "p08_berry_ending" },
          { label: "Say goodbye; meet Dozy", nextPageId: "p08_rock_ending" },
        ]
      },
      {
        id: "p08_berry_ending",
        text: ["Chompy joins Bouncy and Wiggly at the rock.", "They share the full basket."],
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
        text: ["Fancy and Bouncy bring the full basket.", "The picnic begins at Big Flat Rock."],
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
        text: ["Bouncy keeps the basket dry on each stone.", "The picnic can begin."],
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
        id: "p08_quiet_rock_ending",
        text: ["Bouncy reaches Big Flat Rock alone.", "The full basket is ready for the picnic."],
        imageUrl: dinoPalsImagePath("bouncy-big-bounce", "p08_quiet_rock_ending"),
        audioUrl: dinoPalsAudioPath("bouncy-big-bounce", "p08_quiet_rock_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["bouncy", "basket", "rock", "picnic"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_rock_ending",
        text: ["Bouncy and Dozy are at Big Flat Rock.", "The picnic can begin."],
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
    id: "dp_ra_b_05_shys_snail_shade",
    title: "Shy's Snail Shade",
    level: "B",
    ageRange: "Ages 5-7",
    adventureType: "Dino Pals Reading Adventure",
    skillFocus: "Reading texture and path words through cause and effect",
    cycleFocus: "guided_reading_level_b_story_choice",
    series: "Dino Pals",
    characters: ["Shy"],
    location: "Sunny Hollow - Fernwood edge, stream, shaded fern bank",
    targetWords: [
      "Shy", "snail", "trail", "sun", "shade", "Fernwood", "leaf", "sand",
      "twig", "bark", "moss", "stream", "fern", "log", "root", "stone",
      "rough", "smooth", "damp", "cool"
    ],
    highFrequencyWords: ["a", "and", "in", "into", "it", "one", "the", "under"],
    hfw: ["a", "and", "in", "into", "it", "one", "the", "under"],
    mediaFolder: "shy-snail-shade",
    sentenceFrame: "Shy lays the ___. The snail follows the ___.",
    genuineFailurePageId: "p02_leaf_failure",
    retiredPageIds: [],
    coverImageUrl: dinoPalsImagePath("shy-snail-shade", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Hot sun dries one snail trail.", "Shy must guide the snail into Fernwood shade."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p01_start"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "What can Shy try?",
        skillTags: ["sun", "snail", "trail", "shy", "fernwood", "shade"],
        choices: [
          { label: "Slide a broad leaf", nextPageId: "p02_leaf_failure" },
          { label: "Roll a small twig", nextPageId: "p02_twig_failure" },
        ]
      },
      {
        id: "p02_leaf_failure",
        text: ["Shy slides the snail on a leaf.", "The smooth leaf tips. Back on sand."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p02_leaf_failure"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p02_leaf_failure"),
        narrationNeedsRebuild: false,
        choicePrompt: "What surface can grip?",
        skillTags: ["shy", "snail", "leaf", "smooth", "sand"],
        choices: [
          { label: "Try rough bark", nextPageId: "p03_bark" },
          { label: "Lay damp moss", nextPageId: "p03_moss" },
        ]
      },
      {
        id: "p02_twig_failure",
        text: ["Shy rolls a twig. Sand spills.", "The snail pulls in and stops."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p02_twig_failure"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p02_twig_failure"),
        narrationNeedsRebuild: false,
        choicePrompt: "What surface can help?",
        skillTags: ["shy", "snail", "twig", "sand"],
        choices: [
          { label: "Bridge with bark", nextPageId: "p03_bark" },
          { label: "Mark with moss", nextPageId: "p03_moss" },
        ]
      },
      {
        id: "p03_bark",
        text: ["Shy lays rough bark beside the snail.", "The snail grips it and crawls."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p03_bark"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p03_bark"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should bark lead?",
        skillTags: ["shy", "rough", "bark", "snail"],
        choices: [
          { label: "Use short pieces", nextPageId: "p04_bark_steps" },
          { label: "Use one strip", nextPageId: "p04_bark_strip" },
        ]
      },
      {
        id: "p03_moss",
        text: ["Shy lays damp moss beside the snail.", "The snail follows its cool edge."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p03_moss"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p03_moss"),
        narrationNeedsRebuild: false,
        choicePrompt: "How should moss lead?",
        skillTags: ["shy", "damp", "moss", "snail", "cool"],
        choices: [
          { label: "Place small dots", nextPageId: "p04_moss_dots" },
          { label: "Lay one strip", nextPageId: "p04_moss_strip" },
        ]
      },
      {
        id: "p04_bark_steps",
        text: ["Three bark pieces cross the hot sand.", "Shy moves each piece ahead."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p04_bark_steps"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p04_bark_steps"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which path reaches shade?",
        skillTags: ["bark", "sand", "shy", "shade"],
        choices: [
          { label: "Finish with bark", nextPageId: "p05_bark" },
          { label: "Finish with moss", nextPageId: "p05_moss" },
        ]
      },
      {
        id: "p04_bark_strip",
        text: ["One bark strip points toward the ferns.", "The snail crawls along its rough edge."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p04_bark_strip"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p04_bark_strip"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which path reaches shade?",
        skillTags: ["bark", "fern", "snail", "rough", "shade"],
        choices: [
          { label: "Finish with bark", nextPageId: "p05_bark" },
          { label: "Finish with moss", nextPageId: "p05_moss" },
        ]
      },
      {
        id: "p04_moss_dots",
        text: ["Damp moss dots curve across the sand.", "The snail follows each cool patch."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p04_moss_dots"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p04_moss_dots"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which path reaches shade?",
        skillTags: ["damp", "moss", "sand", "snail", "cool", "shade"],
        choices: [
          { label: "Finish with bark", nextPageId: "p05_bark" },
          { label: "Finish with moss", nextPageId: "p05_moss" },
        ]
      },
      {
        id: "p04_moss_strip",
        text: ["One damp moss strip crosses the sand.", "The snail follows its green edge."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p04_moss_strip"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p04_moss_strip"),
        narrationNeedsRebuild: false,
        choicePrompt: "Which path reaches shade?",
        skillTags: ["damp", "moss", "sand", "snail", "shade"],
        choices: [
          { label: "Finish with bark", nextPageId: "p05_bark" },
          { label: "Finish with moss", nextPageId: "p05_moss" },
        ]
      },
      {
        id: "p05_bark",
        text: ["Shy joins the bark into one rough path.", "It reaches the shaded fern bank."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p05_bark"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p05_bark"),
        narrationNeedsRebuild: false,
        choicePrompt: "Where can the snail rest?",
        skillTags: ["shy", "bark", "rough", "fern", "snail"],
        choices: [
          { label: "Under the old log", nextPageId: "p06_log_ending" },
          { label: "Up the mossy root", nextPageId: "p06_root_ending" },
        ]
      },
      {
        id: "p05_moss",
        text: ["Shy joins the moss into one damp path.", "It reaches the shaded fern bank."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p05_moss"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p05_moss"),
        narrationNeedsRebuild: false,
        choicePrompt: "Where can the snail rest?",
        skillTags: ["shy", "moss", "damp", "fern", "snail"],
        choices: [
          { label: "Beside the wet stone", nextPageId: "p06_stone_ending" },
          { label: "Under the broad fern", nextPageId: "p06_fern_ending" },
        ]
      },
      {
        id: "p06_log_ending",
        text: ["The snail reaches cool bark under the log.", "Shy watches one silver trail curl."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p06_log_ending"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p06_log_ending"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["snail", "cool", "bark", "log", "shy", "trail"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p06_root_ending",
        text: ["The snail climbs the mossy root.", "Its silver trail curls above Shy's footprints."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p06_root_ending"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p06_root_ending"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["snail", "moss", "root", "trail", "shy"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p06_stone_ending",
        text: ["The snail rests beside one wet stone.", "Shy places one stream drop near it."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p06_stone_ending"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p06_stone_ending"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["snail", "stone", "shy", "stream"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p06_fern_ending",
        text: ["The snail slips under one broad fern.", "One feeler peeks past Shy's foot."],
        imageUrl: dinoPalsImagePath("shy-snail-shade", "p06_fern_ending"),
        audioUrl: dinoPalsAudioPath("shy-snail-shade", "p06_fern_ending"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["snail", "fern", "shy"],
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
    targetWords: ["Sam", "Pam", "Dad", "cat", "mat", "bag", "map", "van", "jam", "has", "pats", "sat"],
    highFrequencyWords: ["a", "the", "is", "in", "on", "and", "at", "it", "they"],
    hfw: ["a", "the", "is", "in", "on", "and", "at", "it", "they"],
    mediaFolder: "sam-pam",
    sentenceFrame: "___ has the ___.",
    genuineFailurePageId: "page-05",
    coverImageUrl: samPamImagePath(1),
    wordCards: [{ word: "bag", imageUrl: samPamWordImagePath("bag") }, { word: "cat", imageUrl: samPamWordImagePath("cat") }, { word: "jam", imageUrl: samPamWordImagePath("jam") }, { word: "map", imageUrl: samPamWordImagePath("map") }, { word: "mat", imageUrl: samPamWordImagePath("mat") }, { word: "van", imageUrl: samPamWordImagePath("van") }],
    startPageId: "page-01",
    pages: [
      {
        id: "page-01",
        text: ["Sam and Pam pack for the van."],
        imageUrl: samPamImagePath(1),
        audioUrl: samPamAudioPath(1),
        narrationNeedsRebuild: false,
        choicePrompt: "Pack the map or pat the cat?",
        skillTags: ["sam", "pam", "van"],
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
        narrationNeedsRebuild: false,
        choicePrompt: "Pack the bag or pat the cat?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Get the map or pack the bag?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Set out the mat or pat the bag?",
        skillTags: ["pam", "bag", "jam", "has"],
        choices: [
          { label: "The mat", nextPageId: "page-06" },
          { label: "Pat the bag", nextPageId: "page-07" },
        ]
      },
      {
        id: "page-05",
        text: ["The cat sat on the map.", "No map!"],
        imageUrl: samPamImagePath(5),
        audioUrl: samPamAudioPath(5),
        narrationNeedsRebuild: false,
        choicePrompt: "Get the mat or pack the bag?",
        skillTags: ["cat", "map", "sat"],
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
        narrationNeedsRebuild: false,
        choicePrompt: "Give Dad the map or get in the van?",
        skillTags: ["mat", "map"],
        choices: [
          { label: "Give Dad the map", nextPageId: "page-08" },
          { label: "Get in the van", nextPageId: "page-10" },
        ]
      },
      {
        id: "page-07",
        text: ["The bag has jam.", "Sam pats it."],
        imageUrl: samPamImagePath(7),
        audioUrl: samPamAudioPath(7),
        narrationNeedsRebuild: false,
        choicePrompt: "Give Dad the map or set out the mat?",
        skillTags: ["sam", "bag", "jam", "has", "pats"],
        choices: [
          { label: "Give Dad the map", nextPageId: "page-08" },
          { label: "Set out the mat", nextPageId: "page-06" },
        ]
      },
      {
        id: "page-08",
        text: ["Dad has the map.", "Sam has the bag."],
        imageUrl: samPamImagePath(8),
        audioUrl: samPamAudioPath(8),
        narrationNeedsRebuild: false,
        choicePrompt: "Get in the van or wait for Pam?",
        skillTags: ["sam", "dad", "bag", "map", "has"],
        choices: [
          { label: "Get in the van", nextPageId: "page-10" },
          { label: "Wait for Pam", nextPageId: "page-09" },
        ]
      },
      {
        id: "page-09",
        text: ["They pat the cat at the van."],
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
        text: ["They pack the van. The cat is in."],
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
    highFrequencyWords: ["a", "is", "not", "the", "in", "on", "and"],
    hfw: ["a", "is", "not", "the", "in", "on", "and"],
    mediaFolder: "muddy-splashy-hat",
    sentenceFrame: "A ___ is not the hat.",
    genuineFailurePageId: "p08_clucky_grumpy",
    retiredPageIds: ["p03_mud_pat", "p03_water_splash", "p04_mud_search", "p04_pond_search", "p05_grumpy_boot", "p06_big_splash", "p07_clucky_wet_hat", "p08_hat_on_clucky"],
    coverImageUrl: meadowPalsImagePath("muddy-splashy-hat", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Wind takes the red hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p01_start"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p01_start"),
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "Dig again or get Splashy?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Search reeds or get Muddy?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Dig again or get Splashy?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Get Muddy or search the reeds?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Wash it or go to Clucky?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Search the mud or the pond?",
        skillTags: [],
        artAction: "approved-replacement",
        artNote: "Replacement removes the ambiguous signboard. The page now shows only Muddy and Splashy meeting between the established mud and pond search areas.",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Search the mud or the pond?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Past the frog or in reeds?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Get the hat or fan it?",
        skillTags: ["frog", "hat"],
        choices: [
          { label: "Go to the hat", nextPageId: "p06_hat_wet" },
          { label: "Fan it dry", nextPageId: "p07_dry_hat" },
        ]
      },
      {
        id: "p06_hat_muddy",
        text: ["Mud is on the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p06_hat_muddy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p06_hat_muddy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Wash it or go to Clucky?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Fan it or dry it in sunlight?",
        skillTags: ["hat", "pond"],
        choices: [
          { label: "Fan the hat", nextPageId: "p07_dry_hat" },
          { label: "Dry it in sunlight", nextPageId: "p09_pond_ending" },
        ]
      },
      {
        id: "p07_wash_hat",
        text: ["The mud comes off the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p07_wash_hat"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p07_wash_hat"),
        narrationNeedsRebuild: false,
        choicePrompt: "Who takes the hat back?",
        skillTags: ["mud", "hat"],
        choices: [
          { label: "Muddy takes it", nextPageId: "p09_mud_ending" },
          { label: "Splashy takes it", nextPageId: "p09_pond_ending" },
        ]
      },
      {
        id: "p07_dry_hat",
        text: ["Splashy fans the wet hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p07_dry_hat"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p07_dry_hat"),
        narrationNeedsRebuild: false,
        choicePrompt: "Take it back or try it?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Wash it or wear it muddy?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Who should wash the muddy hat?",
        skillTags: ["hat", "muddy"],
        choices: [
          { label: "Muddy can wash it", nextPageId: "p07_wash_hat" },
          { label: "Splashy can wash it", nextPageId: "p09_pond_ending" },
        ]
      },
      {
        id: "p08_hat_on_muddy",
        text: ["The hat is on Muddy."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p08_hat_on_muddy"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p08_hat_on_muddy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Give it back or ask Clucky?",
        skillTags: ["hat"],
        choices: [
          { label: "Give it back", nextPageId: "p09_pond_ending" },
          { label: "Ask Clucky first", nextPageId: "p09_fancy_muddy_ending" },
        ]
      },
      {
        id: "p09_mud_ending",
        text: ["Clucky wears the hat. Muddy splashes."],
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
        text: ["Clucky wears the hat. Splashy splashes."],
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
        text: ["Clucky lets Muddy wear the hat."],
        imageUrl: meadowPalsImagePath("muddy-splashy-hat", "p09_fancy_muddy_ending"),
        audioUrl: meadowPalsAudioPath("muddy-splashy-hat", "p09_fancy_muddy_ending"),
        narrationNeedsRebuild: false,
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
    targetWords: ["barn", "tree", "branch", "bird", "daisy", "hug", "hugs", "grass", "waves"],
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
        text: ["Cuddly comes to meet Shy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p01_start"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Who will you follow?",
        skillTags: ["waves"],
        choices: [
          { label: "Go with Shy", nextPageId: "p02_shy" },
          { label: "Go with Cuddly", nextPageId: "p02_cuddly" },
        ]
      },
      {
        id: "p02_shy",
        text: ["Shy waits by the barn."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p02_shy"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p02_shy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Will Shy peek or wait?",
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
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "Will Shy wave or step back?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Will Shy wave or leave?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Where can Shy go?",
        skillTags: ["waves"],
        choices: [
          { label: "To the barn", nextPageId: "p04_call_shy" },
          { label: "To the tree", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p04_call_shy",
        text: ["Cuddly calls too loudly."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p04_call_shy"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p04_call_shy"),
        narrationNeedsRebuild: false,
        choicePrompt: "How can Cuddly help?",
        skillTags: [],
        choices: [
          { label: "Wait quietly", nextPageId: "p08_barn_hug" },
          { label: "Walk to the tree", nextPageId: "p06_go_to_tree" },
        ]
      },
      {
        id: "p03_tree_look",
        text: ["Cuddly looks up at the tree."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p03_tree_look"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p03_tree_look"),
        narrationNeedsRebuild: false,
        choicePrompt: "Will Cuddly sit or look up?",
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
        narrationNeedsRebuild: false,
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
        narrationNeedsRebuild: false,
        choicePrompt: "Will Cuddly call or wait?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Will Cuddly call or wait?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Will Cuddly climb or wait?",
        skillTags: [],
        choices: [
          { label: "Go up too", nextPageId: "p07_tree_up" },
          { label: "Wait on the grass", nextPageId: "p07_tree_under" },
        ]
      },
      {
        id: "p06_go_to_tree",
        text: ["Shy meets Cuddly at the tree."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p06_go_to_tree"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p06_go_to_tree"),
        narrationNeedsRebuild: false,
        choicePrompt: "Where can they sit?",
        skillTags: ["tree"],
        choices: [
          { label: "On the grass", nextPageId: "p07_tree_under" },
          { label: "Up on the branch", nextPageId: "p07_tree_up" },
        ]
      },
      {
        id: "p07_tree_up",
        text: ["They sit together on the branch."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p07_tree_up"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p07_tree_up"),
        narrationNeedsRebuild: true,
        choicePrompt: "Will Shy wave or climb down?",
        skillTags: ["branch"],
        choices: [
          { label: "Wave from up high", nextPageId: "p08_wave_from_tree" },
          { label: "Go down and hug", nextPageId: "p08_tree_hug" },
        ]
      },
      {
        id: "p07_tree_under",
        text: ["Shy sits with Cuddly on grass."],
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
        narrationNeedsRebuild: false,
        choicePrompt: "Will they wave or rest?",
        skillTags: ["hug"],
        choices: [
          { label: "Go up and wave", nextPageId: "p08_wave_from_tree" },
          { label: "Rest on the grass", nextPageId: "p08_tree_purr" },
        ]
      },
      {
        id: "p08_barn_hug",
        text: ["Shy comes close. Cuddly waits."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_barn_hug"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_barn_hug"),
        narrationNeedsRebuild: true,
        choicePrompt: "Does Shy want a hug?",
        skillTags: [],
        choices: [
          { label: "Yes please", nextPageId: "p09_soft_hug_ending" },
          { label: "Not yet", nextPageId: "p09_almost_hug_ending" },
        ]
      },
      {
        id: "p08_tree_purr",
        text: ["Cuddly naps near Shy."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_tree_purr"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_tree_purr"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: [],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p08_wave_from_tree",
        text: ["Shy waves up high with Cuddly."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p08_wave_from_tree"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p08_wave_from_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["waves"],
        artAction: "approved-replacement",
        artNote: "Approved scene: only Shy and Cuddly on the low branch; Shy gives the single clear wave while Cuddly watches. No extra characters or detached limbs.",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["hugs"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_almost_hug_ending",
        text: ["Shy sits near Cuddly."],
        imageUrl: meadowPalsImagePath("shy-cuddly-quiet", "p09_almost_hug_ending"),
        audioUrl: meadowPalsAudioPath("shy-cuddly-quiet", "p09_almost_hug_ending"),
        narrationNeedsRebuild: false,
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
    characters: ["Bouncy", "Speedy", "Tiny", "Splashy"],
    location: "Sunny Meadow Farm - farmyard, barn, duck pond, big hill, big oak tree",
    targetWords: ["map", "barn", "pond", "hill", "tree", "mud", "muddy", "boot", "snack"],
    highFrequencyWords: ["a", "is", "the", "to", "in", "up", "at", "by", "has", "no"],
    hfw: ["a", "is", "the", "to", "in", "up", "at", "by", "has", "no"],
    mediaFolder: "bouncy-speedy-map",
    sentenceFrame: "Go to the ___.",
    genuineFailurePageId: "p04_too_fast",
    retiredPageIds: ["p05_grumpy_wet", "p09_race_ending"],
    coverImageUrl: meadowPalsImagePath("bouncy-speedy-map", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["The map says BIG TREE."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p01_start"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p01_start"),
        narrationNeedsRebuild: false,
        choicePrompt: "Go with Bouncy or Speedy?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Try the barn or pond path?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Try the barn or hill path?",
        skillTags: ["map"],
        choices: [
          { label: "To the barn", nextPageId: "p03_barn_fast" },
          { label: "To the hill", nextPageId: "p03_hill_fast" },
        ]
      },
      {
        id: "p03_barn",
        text: ["The map points past the barn."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_barn"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_barn"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask Tiny or follow a mouse track?",
        skillTags: ["barn"],
        choices: [
          { label: "Ask Tiny", nextPageId: "p04_tiny_map" },
          { label: "Look at the boot", nextPageId: "p04_boot" },
        ]
      },
      {
        id: "p03_pond",
        text: ["A pond splash wets the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_pond"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_pond"),
        narrationNeedsRebuild: true,
        choicePrompt: "Shake the map or ask Splashy?",
        skillTags: ["pond"],
        choices: [
          { label: "Shake the map", nextPageId: "p04_map_splash" },
          { label: "Ask Splashy", nextPageId: "p04_splashy_help" },
        ]
      },
      {
        id: "p03_barn_fast",
        text: ["The map blows up high."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_barn_fast"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_barn_fast"),
        narrationNeedsRebuild: false,
        choicePrompt: "Catch the map or keep running?",
        skillTags: ["map"],
        choices: [
          { label: "Get the map", nextPageId: "p04_map_caught" },
          { label: "Run on", nextPageId: "p04_too_fast" },
        ]
      },
      {
        id: "p03_hill_fast",
        text: ["The map points down the hill."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p03_hill_fast"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p03_hill_fast"),
        narrationNeedsRebuild: false,
        choicePrompt: "Who should hold the map?",
        skillTags: ["hill"],
        choices: [
          { label: "Give it to Bouncy", nextPageId: "p04_speedy_stops" },
          { label: "Keep it and run", nextPageId: "p04_too_fast" },
        ]
      },
      {
        id: "p04_tiny_map",
        text: ["Tiny sees a mouse mark."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_tiny_map"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_tiny_map"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the tree mark or mud mark?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "The mud way", nextPageId: "p05_muddy_map" },
        ]
      },
      {
        id: "p04_boot",
        text: ["Small tracks pass by the boot."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_boot"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_boot"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the track or tree mark?",
        skillTags: ["boot"],
        choices: [
          { label: "Follow the track", nextPageId: "p05_grumpy_boot" },
          { label: "Go to the tree", nextPageId: "p05_big_tree" },
        ]
      },
      {
        id: "p04_map_splash",
        text: ["The wet map shows a tree."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_map_splash"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_map_splash"),
        narrationNeedsRebuild: false,
        choicePrompt: "Dry the map or run on?",
        skillTags: [],
        choices: [
          { label: "Hold up the map", nextPageId: "p05_bouncy_wet" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p04_splashy_help",
        text: ["Splashy dries the wet map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_splashy_help"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_splashy_help"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the tree mark or mud mark?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the tree mark or stop to read?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Stop to read", nextPageId: "p05_speedy_waits" },
        ]
      },
      {
        id: "p04_too_fast",
        text: ["Speedy has no map now."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_too_fast"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_too_fast"),
        narrationNeedsRebuild: false,
        choicePrompt: "Search the mud or wait for help?",
        skillTags: ["map"],
        choices: [
          { label: "Look in the mud", nextPageId: "p05_muddy_map" },
          { label: "Find the map", nextPageId: "p05_speedy_waits" },
        ]
      },
      {
        id: "p04_speedy_stops",
        text: ["Bouncy holds the map for Speedy."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p04_speedy_stops"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p04_speedy_stops"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the tree mark or stop to read?",
        skillTags: [],
        choices: [
          { label: "Go to the tree", nextPageId: "p05_big_tree" },
          { label: "Let Speedy read", nextPageId: "p05_speedy_waits" },
        ]
      },
      {
        id: "p05_grumpy_boot",
        text: ["Mouse tracks pass the big boot."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_grumpy_boot"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_grumpy_boot"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow tracks to tree or run on?",
        skillTags: ["boot"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p05_bouncy_wet",
        text: ["Bouncy dries the wet map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_bouncy_wet"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_bouncy_wet"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the tree mark or run on?",
        skillTags: ["map"],
        choices: [
          { label: "To the big tree", nextPageId: "p05_big_tree" },
          { label: "Run on", nextPageId: "p06_lost_again" },
        ]
      },
      {
        id: "p05_speedy_waits",
        text: ["Speedy waits and reads the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_speedy_waits"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_speedy_waits"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the tree mark or run on?",
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
        choicePrompt: "Should Bouncy or Speedy get it?",
        skillTags: ["map", "mud"],
        choices: [
          { label: "Bouncy gets it", nextPageId: "p06_bouncy_muddy" },
          { label: "Speedy gets it", nextPageId: "p06_speedy_muddy" },
        ]
      },
      {
        id: "p05_big_tree",
        text: ["They are at the big tree."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p05_big_tree"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p05_big_tree"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the red X or look across the farm?",
        skillTags: ["tree"],
        choices: [
          { label: "Look at the X", nextPageId: "p07_tree_stop" },
          { label: "Look at the farm", nextPageId: "p08_farm_view" },
        ]
      },
      {
        id: "p06_bouncy_muddy",
        text: ["Bouncy gets the muddy map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p06_bouncy_muddy"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p06_bouncy_muddy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Find the X or ask Tiny?",
        skillTags: ["muddy"],
        choices: [
          { label: "Look at the map", nextPageId: "p07_tree_stop" },
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
        ]
      },
      {
        id: "p06_speedy_muddy",
        text: ["Speedy gets the muddy map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p06_speedy_muddy"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p06_speedy_muddy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Find the X or ask Tiny?",
        skillTags: ["mud"],
        choices: [
          { label: "Look at the map", nextPageId: "p07_tree_stop" },
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
        ]
      },
      {
        id: "p06_lost_again",
        text: ["Two paths lead to the tree."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p06_lost_again"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p06_lost_again"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read the map or ask Tiny?",
        skillTags: ["path"],
        choices: [
          { label: "Look at the map", nextPageId: "p07_tree_stop" },
          { label: "Ask for help", nextPageId: "p08_tiny_snack" },
        ]
      },
      {
        id: "p07_tree_stop",
        text: ["They find the red X."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p07_tree_stop"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p07_tree_stop"),
        narrationNeedsRebuild: true,
        choicePrompt: "Follow the red X or look at the farm?",
        skillTags: ["dirt"],
        choices: [
          { label: "Follow the red X", nextPageId: "p08_tiny_snack" },
          { label: "Look at the farm", nextPageId: "p08_farm_view" },
        ]
      },
      {
        id: "p08_tiny_snack",
        text: ["Tiny waits with a little snack."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p08_tiny_snack"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p08_tiny_snack"),
        narrationNeedsRebuild: false,
        choicePrompt: "Share the snack or head home?",
        skillTags: ["snack"],
        choices: [
          { label: "Share the snack", nextPageId: "p09_tiny_snack_ending" },
          { label: "Follow the map home", nextPageId: "p09_home_ending" },
        ]
      },
      {
        id: "p08_farm_view",
        text: ["The map shows the whole farm."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p08_farm_view"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p08_farm_view"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["barn", "map"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_home_ending",
        text: ["The map leads them home."],
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
        text: ["Tiny shares. They read the map."],
        imageUrl: meadowPalsImagePath("bouncy-speedy-map", "p09_tiny_snack_ending"),
        audioUrl: meadowPalsAudioPath("bouncy-speedy-map", "p09_tiny_snack_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["map", "snack"],
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
    skillFocus: "Simple location sentences; in, on, up, down",
    cycleFocus: "guided_reading_level_a_story_choice",
    characters: ["Brave", "Tiny", "Woolly", "Clucky"],
    location: "Sunny Meadow Farm - big barn, stone wall, flower pot, hay bale, little stream",
    targetWords: ["hat", "bell", "pot", "wall", "stream", "wool", "stone", "stones", "hay", "feather", "thread", "string"],
    highFrequencyWords: ["a", "is", "the", "in", "on", "up", "down", "and", "not"],
    hfw: ["a", "is", "the", "in", "on", "up", "down", "and", "not"],
    mediaFolder: "brave-tiny-rescue",
    sentenceFrame: "The ___ is in/on the ___.",
    genuineFailurePageId: "p05_brave_stuck",
    retiredPageIds: ["p04_under_wool", "p05_feather_back", "p05_feather_brave", "p09_helpful_ending"],
    coverImageUrl: meadowPalsImagePath("brave-tiny-rescue", "p01_start"),
    startPageId: "p01_start",
    pages: [
      {
        id: "p01_start",
        text: ["Who needs help today?"],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p01_start"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p01_start"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who will Brave and Tiny help?",
        skillTags: ["hat", "bell"],
        choices: [
          { label: "Help Clucky", nextPageId: "p02_brave" },
          { label: "Help Woolly", nextPageId: "p02_tiny" },
        ]
      },
      {
        id: "p02_brave",
        text: ["Brave follows a red thread."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p02_brave"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p02_brave"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look in the pot or by the wall?",
        skillTags: ["thread"],
        choices: [
          { label: "In the pot", nextPageId: "p03_pot" },
          { label: "Look by the wall", nextPageId: "p03_wall" },
        ]
      },
      {
        id: "p02_tiny",
        text: ["Woolly needs the little bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p02_tiny"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p02_tiny"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look by Woolly or in the stream?",
        skillTags: ["bell"],
        choices: [
          { label: "Look by Woolly", nextPageId: "p03_woolly" },
          { label: "Look in the stream", nextPageId: "p04_stream" },
        ]
      },
      {
        id: "p03_pot",
        text: ["The thread ends at the pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_pot"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_pot"),
        narrationNeedsRebuild: false,
        choicePrompt: "Who can look in the pot?",
        skillTags: ["pot"],
        choices: [
          { label: "Let Brave look", nextPageId: "p04_hat_in_pot" },
          { label: "Let Tiny look", nextPageId: "p04_tiny_in_pot" },
        ]
      },
      {
        id: "p03_wall",
        text: ["The thread goes to the wall."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_wall"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_wall"),
        narrationNeedsRebuild: false,
        choicePrompt: "Follow the feather or the thread?",
        skillTags: ["wall"],
        choices: [
          { label: "Follow the feather", nextPageId: "p04_feather" },
          { label: "Follow the thread", nextPageId: "p03_hat" },
        ]
      },
      {
        id: "p03_hat",
        text: ["Tiny sees the red hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_hat"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_hat"),
        narrationNeedsRebuild: true,
        choicePrompt: "Go to the hat or ask Clucky?",
        skillTags: ["hat", "wall"],
        choices: [
          { label: "Go to the hat", nextPageId: "p04_hat_on_wall" },
          { label: "Ask Clucky", nextPageId: "p04_clucky_wall" },
        ]
      },
      {
        id: "p04_feather",
        text: ["A feather is not the hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_feather"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_feather"),
        narrationNeedsRebuild: false,
        choicePrompt: "Ask Clucky or look in the pot?",
        skillTags: ["feather", "hat"],
        choices: [
          { label: "Ask Clucky", nextPageId: "p04_clucky_wall" },
          { label: "Look in the pot", nextPageId: "p04_hat_in_pot" },
        ]
      },
      {
        id: "p04_clucky_wall",
        text: ["Clucky spots the red hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_clucky_wall"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_clucky_wall"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can go up?",
        skillTags: ["hat", "wall"],
        choices: [
          { label: "Tiny climbs", nextPageId: "p05_tiny_climbs" },
          { label: "Brave hops", nextPageId: "p05_brave_climbs" },
        ]
      },
      {
        id: "p04_hat_on_wall",
        text: ["The red hat sits up high."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_hat_on_wall"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_hat_on_wall"),
        narrationNeedsRebuild: true,
        choicePrompt: "Who can go up?",
        skillTags: ["hat"],
        choices: [
          { label: "Tiny climbs", nextPageId: "p05_tiny_climbs" },
          { label: "Brave hops", nextPageId: "p05_brave_climbs" },
        ]
      },
      {
        id: "p04_hat_in_pot",
        text: ["The hat is in the pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_hat_in_pot"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_hat_in_pot"),
        narrationNeedsRebuild: false,
        choicePrompt: "Reach together or lean in?",
        skillTags: ["hat", "pot"],
        choices: [
          { label: "Reach in together", nextPageId: "p05_hat_found" },
          { label: "Lean in more", nextPageId: "p05_brave_stuck" },
        ]
      },
      {
        id: "p04_tiny_in_pot",
        text: ["Tiny goes down to the hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_tiny_in_pot"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_tiny_in_pot"),
        narrationNeedsRebuild: false,
        choicePrompt: "Tie the string or lift together?",
        skillTags: ["pot"],
        choices: [
          { label: "Tie the string on", nextPageId: "p06_tiny_helps" },
          { label: "Lift it together", nextPageId: "p05_hat_found" },
        ]
      },
      {
        id: "p05_brave_stuck",
        text: ["Brave is stuck in the pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_brave_stuck"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_brave_stuck"),
        narrationNeedsRebuild: false,
        choicePrompt: "Tip the pot or use the string?",
        skillTags: [],
        choices: [
          { label: "Tip the pot", nextPageId: "p06_woolly_helps" },
          { label: "Use the string", nextPageId: "p06_tiny_helps" },
        ]
      },
      {
        id: "p06_woolly_helps",
        text: ["Woolly tips the big pot."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_woolly_helps"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_woolly_helps"),
        narrationNeedsRebuild: false,
        choicePrompt: "Take the hat or try it on?",
        skillTags: ["pot"],
        choices: [
          { label: "Get the hat", nextPageId: "p05_hat_found" },
          { label: "Try it on", nextPageId: "p06_hat_on_brave" },
        ]
      },
      {
        id: "p06_tiny_helps",
        text: ["Tiny ties string to the hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_tiny_helps"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_tiny_helps"),
        narrationNeedsRebuild: false,
        choicePrompt: "Lift the hat or try it on?",
        skillTags: ["hat", "string"],
        choices: [
          { label: "Lift it up", nextPageId: "p05_hat_found" },
          { label: "Try it on", nextPageId: "p06_hat_on_brave" },
        ]
      },
      {
        id: "p05_tiny_climbs",
        text: ["Tiny goes up the stones."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_tiny_climbs"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_tiny_climbs"),
        narrationNeedsRebuild: false,
        choicePrompt: "Get the hat or ask Brave?",
        skillTags: ["stones"],
        choices: [
          { label: "Get the hat", nextPageId: "p05_hat_found" },
          { label: "Ask Brave", nextPageId: "p06_brave_boost" },
        ]
      },
      {
        id: "p05_brave_climbs",
        text: ["Brave hops up one stone."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_brave_climbs"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_brave_climbs"),
        narrationNeedsRebuild: false,
        choicePrompt: "Climb more or ask Tiny?",
        skillTags: ["stone"],
        choices: [
          { label: "Go up more", nextPageId: "p06_brave_slips" },
          { label: "Ask Tiny", nextPageId: "p06_brave_boost" },
        ]
      },
      {
        id: "p06_brave_slips",
        text: ["Brave slips into soft hay."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_brave_slips"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_brave_slips"),
        narrationNeedsRebuild: false,
        choicePrompt: "Use the low stone or reach again?",
        skillTags: ["hay"],
        choices: [
          { label: "Use the low stone", nextPageId: "p06_brave_boost" },
          { label: "Reach for the hat", nextPageId: "p05_hat_found" },
        ]
      },
      {
        id: "p06_brave_boost",
        text: ["The low stone helps Brave."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_brave_boost"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_brave_boost"),
        narrationNeedsRebuild: false,
        choicePrompt: "What can they do?",
        skillTags: ["stone"],
        choices: [
          { label: "Get the hat", nextPageId: "p05_hat_found" },
          { label: "Get it for Clucky", nextPageId: "p07_clucky_happy" },
        ]
      },
      {
        id: "p05_hat_found",
        text: ["Brave and Tiny have the hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_hat_found"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_hat_found"),
        narrationNeedsRebuild: false,
        choicePrompt: "Give it back or ask for a feather?",
        skillTags: ["hat"],
        choices: [
          { label: "Give it back", nextPageId: "p07_clucky_happy" },
          { label: "Trade hat for feather", nextPageId: "p09_fancy_brave_ending" },
        ]
      },
      {
        id: "p06_hat_on_brave",
        text: ["Brave tries the red hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_hat_on_brave"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_hat_on_brave"),
        narrationNeedsRebuild: false,
        choicePrompt: "Give it back or ask for a feather?",
        skillTags: ["hat"],
        choices: [
          { label: "Give it back", nextPageId: "p07_clucky_happy" },
          { label: "Trade hat for feather", nextPageId: "p09_fancy_brave_ending" },
        ]
      },
      {
        id: "p03_woolly",
        text: ["Tiny looks beside Woolly."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p03_woolly"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p03_woolly"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look in the wool or the stream?",
        skillTags: ["grass"],
        choices: [
          { label: "In the wool", nextPageId: "p05_brave_in_wool" },
          { label: "In the stream", nextPageId: "p04_stream" },
        ]
      },
      {
        id: "p05_brave_in_wool",
        text: ["Brave looks in the wool."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_brave_in_wool"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_brave_in_wool"),
        narrationNeedsRebuild: false,
        choicePrompt: "Lift the wool or check the stream?",
        skillTags: ["wool"],
        choices: [
          { label: "Lift the wool", nextPageId: "p06_woolly_laughs" },
          { label: "Go to the stream", nextPageId: "p05_bell_stream" },
        ]
      },
      {
        id: "p06_woolly_laughs",
        text: ["The bell hides in the wool."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_woolly_laughs"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_woolly_laughs"),
        narrationNeedsRebuild: false,
        choicePrompt: "Pick it up or give it back?",
        skillTags: ["bell", "wool"],
        choices: [
          { label: "Pick it up", nextPageId: "p06_bell_ring" },
          { label: "Give Woolly the bell", nextPageId: "p07_woolly_happy" },
        ]
      },
      {
        id: "p04_stream",
        text: ["Tiny looks in the stream."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p04_stream"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p04_stream"),
        narrationNeedsRebuild: false,
        choicePrompt: "Look on the stones or get Brave?",
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
        narrationNeedsRebuild: false,
        choicePrompt: "Who can get the bell?",
        skillTags: ["bell", "stone"],
        choices: [
          { label: "Tiny gets it", nextPageId: "p05_bell_found" },
          { label: "Brave gets it", nextPageId: "p06_brave_stream" },
        ]
      },
      {
        id: "p06_brave_stream",
        text: ["Brave lifts the bell from water."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_brave_stream"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_brave_stream"),
        narrationNeedsRebuild: true,
        choicePrompt: "Give it to Tiny or ring it?",
        skillTags: ["bell"],
        choices: [
          { label: "Give it to Tiny", nextPageId: "p05_bell_found" },
          { label: "Ring it", nextPageId: "p06_bell_ring" },
        ]
      },
      {
        id: "p05_bell_found",
        text: ["Brave and Tiny have the bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p05_bell_found"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p05_bell_found"),
        narrationNeedsRebuild: false,
        choicePrompt: "Give it back or ring it?",
        skillTags: ["bell"],
        choices: [
          { label: "Give Woolly the bell", nextPageId: "p07_woolly_happy" },
          { label: "Ring it", nextPageId: "p06_bell_ring" },
        ]
      },
      {
        id: "p06_bell_ring",
        text: ["Tiny rings the little bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p06_bell_ring"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p06_bell_ring"),
        narrationNeedsRebuild: false,
        choicePrompt: "Give it back or rest it first?",
        skillTags: ["bell"],
        choices: [
          { label: "Give it back", nextPageId: "p07_woolly_happy" },
          { label: "Wait, then return it", nextPageId: "p09_loud_bell_ending" },
        ]
      },
      {
        id: "p07_clucky_happy",
        text: ["Clucky wears the red hat."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p07_clucky_happy"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p07_clucky_happy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["hat"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_fancy_brave_ending",
        text: ["Hat for Clucky. Feather for Brave."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p09_fancy_brave_ending"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p09_fancy_brave_ending"),
        narrationNeedsRebuild: true,
        choicePrompt: "Read it again?",
        skillTags: ["feather"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p07_woolly_happy",
        text: ["Woolly wears the little bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p07_woolly_happy"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p07_woolly_happy"),
        narrationNeedsRebuild: false,
        choicePrompt: "Read it again?",
        skillTags: ["bell"],
        choices: [
          { label: "Read again", nextPageId: "p01_start" },
          { label: "Finish", nextPageId: "end" },
        ]
      },
      {
        id: "p09_loud_bell_ending",
        text: ["Woolly wears the quiet bell."],
        imageUrl: meadowPalsImagePath("brave-tiny-rescue", "p09_loud_bell_ending"),
        audioUrl: meadowPalsAudioPath("brave-tiny-rescue", "p09_loud_bell_ending"),
        narrationNeedsRebuild: false,
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
