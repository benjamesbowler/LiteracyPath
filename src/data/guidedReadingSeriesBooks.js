import { moonwoodTalesBooks } from "./moonwoodTalesBooks.js";

const wordAudio = word => `/guided-reading/audio/words/${word.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

const normalizeReadingText = text =>
  String(text || "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

const words = text =>
  normalizeReadingText(text)
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

const seriesPagePath = (seriesId, bookNumber, pageNumber) =>
  `/guided-reading/series/${seriesId}/book-${String(bookNumber).padStart(2, "0")}/page-${String(pageNumber).padStart(3, "0")}.webp`;

const seriesCoverPath = (seriesId, bookNumber) =>
  `/guided-reading/series/${seriesId}/book-${String(bookNumber).padStart(2, "0")}/cover.webp`;

const pagePath = (bookNumber, pageNumber) =>
  seriesPagePath("bob-and-nan", bookNumber, pageNumber);

const coverPath = bookNumber =>
  seriesCoverPath("bob-and-nan", bookNumber);

const createPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: pagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: "approved",
  qaNotes: "Reviewed fiction page released for student Guided Reading.",
  active: true
});

const createBobAndNanBook = ({
  id,
  title,
  bookNumber,
  theme,
  pages
}) => ({
  id,
  seriesId: "bob-and-nan",
  seriesTitle: "Bob and Nan",
  title,
  type: "fiction",
  category: "fiction",
  level: "A",
  ageRange: "4-5",
  bookNumber,
  author: "Nora Bell",
  illustrator: "Milo Reed",
  status: "approved",
  qaStatus: "approved",
  qaNotes: "Reviewed fiction book released for student Guided Reading.",
  active: true,
  teacherPreviewOnly: false,
  source: "bob_and_nan_level_a_pack_2026_05_26",
  coverImage: coverPath(bookNumber),
  targetSkills: ["level-a", "early-fiction", "one-sentence-pages"],
  theme,
  characterReference: {
    bob: "Bob is a 4-5 year old boy with short black hair, a red T-shirt, blue shorts, white socks, and red shoes.",
    nan: "Nan is a 4-5 year old girl with blonde bobbed hair, a red dress, white socks, and red shoes.",
    fluff: "Fluff is a small fluffy brown puppy introduced only in book 3."
  },
  seriesReference:
    "Keep Bob and Nan visually consistent across the full Level A series. Use warm, clean, child-friendly illustrations with no embedded text.",
  pages: pages.map(page => createPage({ bookNumber, ...page }))
});

const jamesPagePath = (bookNumber, pageNumber) =>
  seriesPagePath("james-and-anna", bookNumber, pageNumber);

const jamesCoverPath = bookNumber =>
  seriesCoverPath("james-and-anna", bookNumber);

const createJamesPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: jamesPagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: "approved",
  qaNotes: "Reviewed fiction page released for student Guided Reading.",
  active: true
});

const createJamesAndAnnaBook = ({
  id,
  title,
  bookNumber,
  theme,
  targetPatterns,
  sightWords,
  pages
}) => ({
  id,
  seriesId: "james-and-anna",
  seriesTitle: "James and Anna",
  seriesName: "James and Anna",
  title,
  type: "fiction",
  category: "fiction",
  level: "B",
  guidedReadingLevel: "B",
  ageRange: "5-6",
  bookNumber,
  order: bookNumber,
  author: "Ava Stone",
  illustrator: "Finn Blue",
  status: "approved",
  qaStatus: "approved",
  qaNotes: "Reviewed fiction book released for student Guided Reading.",
  active: true,
  teacherPreviewOnly: false,
  source: "james_and_anna_level_b_pack_2026_05_26",
  coverImage: jamesCoverPath(bookNumber),
  targetSkills: ["level-b", "early-fiction", "longer-sentences"],
  sightWords,
  targetPatterns,
  theme,
  characterReference: {
    james: "James is 5-6 with brown skin, close-cropped black hair, a green-and-white striped T-shirt, blue shorts, white socks, and red trainers.",
    anna: "Anna is 5-6 with light skin, chestnut-brown hair in two bunches, a yellow pinafore dress over a white top, white socks, and red shoes.",
    chips: "Chips is a small white goat with big brown patches, yellow eyes, short horns, floppy ears, and a blue collar with a blue bell. Chips appears from book 2 onward only where the text says so.",
    zim: "Zim is a tiny lime-green alien with three large black eyes, stick limbs, one antenna, and a wide grin. Zim appears only in book 1."
  },
  imageGenerationReference:
    "Keep James, Anna, Chips, and Zim consistent across the Level B series. Use the source page text and prompt for each page; no embedded text, no speech bubbles, no captions, and no one-page image/text shift.",
  expectedStoryPageCount: pages.length,
  availableStoryPageCount: pages.length,
  missingStoryPages: [],
  pages: pages.map(page => createJamesPage({ bookNumber, ...page }))
});

const aidenPagePath = (bookNumber, pageNumber) =>
  seriesPagePath("aiden-and-betty", bookNumber, pageNumber);

const aidenCoverPath = bookNumber =>
  seriesCoverPath("aiden-and-betty", bookNumber);

const createAidenPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: aidenPagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: "approved",
  qaNotes: "Reviewed fiction page released for student Guided Reading.",
  active: true
});

const createAidenAndBettyBook = ({
  id,
  title,
  bookNumber,
  theme,
  targetPatterns,
  sightWords,
  pages
}) => ({
  id,
  seriesId: "aiden-and-betty",
  seriesTitle: "Aiden and Betty",
  seriesName: "Aiden and Betty",
  title,
  type: "fiction",
  category: "fiction",
  level: "C",
  guidedReadingLevel: "C",
  ageRange: "6-7",
  bookNumber,
  order: bookNumber,
  author: "Nora Bell",
  illustrator: "Kimi",
  status: "approved",
  qaStatus: "approved",
  qaNotes: "Reviewed fiction book released for student Guided Reading.",
  active: true,
  teacherPreviewOnly: false,
  source: "aiden_and_betty_level_c_pack_2026_05_26",
  coverImage: aidenCoverPath(bookNumber),
  targetSkills: ["level-c", "fiction", "chapter-style-sentences"],
  sightWords,
  targetPatterns,
  theme,
  characterReference: {
    aiden: "Aiden is 6-7 with fair skin, freckles, sandy-blonde hair, an orange hoodie with a white lightning bolt, dark grey trousers, and white trainers with orange laces.",
    betty: "Betty is 6-7 with warm medium-brown skin, a neat brown bob, a blue Alice headband, a teal T-shirt, white dungarees, and blue-and-white canvas trainers.",
    socks: "Socks is a small monkey with cream-white fur on face and chest, darker brown on back, black hands and feet, and a tiny red waistcoat."
  },
  imageGenerationReference:
    "Keep Aiden, Betty, and Socks consistent across the Level C series. Use the source page text and prompt for each page; no non-diegetic embedded text, captions, or page numbers.",
  expectedStoryPageCount: pages.length,
  availableStoryPageCount: pages.length,
  missingStoryPages: [],
  pages: pages.map(page => createAidenPage({ bookNumber, ...page }))
});

const dinoPagePath = (bookNumber, pageNumber) =>
  seriesPagePath("dino-pals", bookNumber, pageNumber);

const dinoCoverPath = bookNumber =>
  seriesCoverPath("dino-pals", bookNumber);

const dinoAudioPath = (bookNumber, pageNumber) =>
  `/guided-reading/series/dino-pals/book-${String(bookNumber).padStart(2, "0")}/audio/page-${String(pageNumber).padStart(3, "0")}.mp3`;

const createDinoPage = ({ bookNumber, pageNumber, text }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: dinoPagePath(bookNumber, pageNumber),
  audio: dinoAudioPath(bookNumber, pageNumber),
  pageAudio: dinoAudioPath(bookNumber, pageNumber),
  words: words(text),
  qaStatus: "approved",
  qaNotes: "Released for student Guided Reading.",
  active: true
});

const createDinoPalsBook = ({
  id,
  title,
  bookNumber,
  theme,
  pages
}) => ({
  id,
  seriesId: "dino-pals",
  seriesTitle: "Dino Pals",
  seriesName: "Dino Pals",
  title,
  type: "fiction",
  category: "fiction",
  level: "B",
  guidedReadingLevel: "B",
  ageRange: "5-6",
  bookNumber,
  order: bookNumber,
  author: "Nora Bell",
  illustrator: "Milo Reed",
  status: "approved",
  qaStatus: "approved",
  qaNotes: "Released for student Guided Reading.",
  active: true,
  teacherPreviewOnly: false,
  source: "dino_pals_level_b_pack_2026_05_27",
  coverImage: dinoCoverPath(bookNumber),
  targetSkills: ["level-b", "fiction", "dino-pals"],
  sightWords: ["the", "said", "was", "you", "I", "to", "and", "it"],
  targetPatterns: ["level-b", "fiction", "dialogue", "expression"],
  theme,
  characterReference: {
    chompy: "Orange baby T-Rex with tiny arms, a big round tummy, a white bib, and a sweet hungry personality.",
    sunny: "Yellow baby Triceratops with rainbow-tipped horns and a bright happy outlook.",
    dozy: "Lavender baby Stegosaurus with sleepy half-closed eyes and a small pillow.",
    grumpy: "Dark green baby Ankylosaurus with a scowl, club tail, and secretly kind heart.",
    bossy: "Teal baby Pterodactyl with pink wing membranes, a leaf clipboard, and a tiny reed megaphone.",
    bouncy: "Lime green baby Pachycephalosaurus with a dome head and constant bouncing energy.",
    wiggly: "Pale blue baby Diplodocus with a long wavy tail and an apologetic expression.",
    zippy: "Red and yellow baby Velociraptor with a small rainbow scarf and speedy movement.",
    honky: "Coral baby Parasaurolophus with a huge rainbow crest and a very loud voice.",
    cheeky: "Purple baby Oviraptor with orange spots, a mischievous grin, and a playful wink."
  },
  settingReference:
    "Sunny Hollow is a warm lush valley where baby dinosaurs live and play, with Cozy Cave, Berry Bush Corner, Fernwood forest, Rainbow Waterfall, the Long Meadow, and Mount Rumble in the distance.",
  expectedStoryPageCount: pages.length,
  availableStoryPageCount: pages.length,
  missingStoryPages: [],
  pages: pages.map(page => createDinoPage({ bookNumber, ...page }))
});

const meadowPagePath = (bookNumber, pageNumber) =>
  seriesPagePath("meadow-pals", bookNumber, pageNumber);

const meadowCoverPath = bookNumber =>
  seriesCoverPath("meadow-pals", bookNumber);

const meadowAudioPath = (bookNumber, pageNumber) =>
  "/guided-reading/series/meadow-pals/book-" + String(bookNumber).padStart(2, "0") + "/audio/page-" + String(pageNumber).padStart(3, "0") + ".mp3";

const createMeadowPage = ({ bookNumber, pageNumber, text }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: meadowPagePath(bookNumber, pageNumber),
  audio: meadowAudioPath(bookNumber, pageNumber),
  pageAudio: meadowAudioPath(bookNumber, pageNumber),
  words: words(text),
  qaStatus: "approved",
  qaNotes: "Released for student Guided Reading.",
  active: true
});

const createMeadowPalsBook = ({
  id,
  title,
  bookNumber,
  theme,
  character,
  pages
}) => ({
  id,
  seriesId: "meadow-pals",
  seriesTitle: "Meadow Pals",
  seriesName: "Meadow Pals",
  title,
  type: "fiction",
  category: "fiction",
  level: "A",
  guidedReadingLevel: "A",
  ageRange: "4-5",
  bookNumber,
  order: bookNumber,
  author: "Nora Bell",
  illustrator: "Milo Reed",
  status: "approved",
  qaStatus: "approved",
  qaNotes: "Released for student Guided Reading after source page text, images, and page audio matched.",
  active: true,
  teacherPreviewOnly: false,
  source: "meadow_pals_level_a_pack_2026_05_28",
  coverImage: meadowCoverPath(bookNumber),
  targetSkills: ["level-a", "fiction", "meadow-pals"],
  sightWords: ["the", "said", "is", "to", "and", "it", "in", "was"],
  targetPatterns: ["level-a", "fiction", "simple-sentences", "repeated-language"],
  theme,
  characterReference: {
    muddy: "Muddy is a friendly Meadow Pals character who loves mud and keeps the same look across the series.",
    woolly: "Woolly is a gentle Meadow Pals character used consistently across bedtime and friendship pages.",
    clucky: "Clucky is a busy hen-like Meadow Pals character who appears in farmyard scenes.",
    bouncy: "Bouncy is an energetic Meadow Pals character who hops and moves with playful energy.",
    grumpy: "Grumpy is a Meadow Pals character with a gruff expression and a kind heart.",
    sleepy: "Sleepy is a tired Meadow Pals character who often rests or naps.",
    noisy: "Noisy is a loud Meadow Pals character learning when to be quiet.",
    tiny: "Tiny is a very small Meadow Pals character shown with clear scale cues.",
    shy: "Shy is a quiet Meadow Pals character who slowly joins the group.",
    giggly: "Giggly is a happy Meadow Pals character who laughs often.",
    brave: "Brave is a determined Meadow Pals character who keeps trying.",
    hungry: "Hungry is a Meadow Pals character who likes to eat.",
    splashy: "Splashy is a Meadow Pals character who loves puddles and water play.",
    speedy: "Speedy is a fast Meadow Pals character who learns to slow down.",
    cuddly: "Cuddly is a warm Meadow Pals character who likes hugs."
  },
  settingReference:
    "Meadow Pals takes place in a warm farm meadow with a barn, pond, hill, log, hay bale, flowers, grass, and cozy character homes. Keep scenes bright, simple, and child-friendly with no embedded text.",
  expectedStoryPageCount: pages.length,
  availableStoryPageCount: pages.length,
  missingStoryPages: [],
  pages: pages.map(page => createMeadowPage({ bookNumber, ...page }))
});

const meadowPalsBookData = [
  {
    "id": "meadow-pals-01-muddy-has-a-bath",
    "title": "Muddy Has a Bath",
    "bookNumber": 1,
    "theme": "Muddy in Sunny Meadow",
    "character": "Muddy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Muddy is in the mud."
      },
      {
        "pageNumber": 2,
        "text": "Muddy is very muddy."
      },
      {
        "pageNumber": 3,
        "text": "\"You need a bath,\" said Clucky."
      },
      {
        "pageNumber": 4,
        "text": "Muddy got in the bath."
      },
      {
        "pageNumber": 5,
        "text": "The bath got very muddy."
      },
      {
        "pageNumber": 6,
        "text": "Muddy got out."
      },
      {
        "pageNumber": 7,
        "text": "Muddy ran to the mud."
      },
      {
        "pageNumber": 8,
        "text": "Muddy is muddy again."
      },
      {
        "pageNumber": 9,
        "text": "Muddy is happy."
      }
    ]
  },
  {
    "id": "meadow-pals-02-woolly-cant-sleep",
    "title": "Woolly Can't Sleep",
    "bookNumber": 2,
    "theme": "Woolly in Sunny Meadow",
    "character": "Woolly",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Woolly got into bed."
      },
      {
        "pageNumber": 2,
        "text": "Hoo! went the wind."
      },
      {
        "pageNumber": 3,
        "text": "Woolly sat up."
      },
      {
        "pageNumber": 4,
        "text": "Buzz! went a bug."
      },
      {
        "pageNumber": 5,
        "text": "Woolly sat up."
      },
      {
        "pageNumber": 6,
        "text": "Moo! went Hungry."
      },
      {
        "pageNumber": 7,
        "text": "Woolly sat up."
      },
      {
        "pageNumber": 8,
        "text": "Then it was quiet."
      },
      {
        "pageNumber": 9,
        "text": "Woolly went to sleep."
      }
    ]
  },
  {
    "id": "meadow-pals-03-clucky-lays-an-egg",
    "title": "Clucky Lays an Egg",
    "bookNumber": 3,
    "theme": "Clucky in Sunny Meadow",
    "character": "Clucky",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Clucky has to lay an egg."
      },
      {
        "pageNumber": 2,
        "text": "She sat in the nest.\n\"Not yet,\" said Clucky."
      },
      {
        "pageNumber": 3,
        "text": "She sat on the log.\n\"Not yet,\" said Clucky."
      },
      {
        "pageNumber": 4,
        "text": "She sat in the box.\n\"Not yet,\" said Clucky."
      },
      {
        "pageNumber": 5,
        "text": "She sat on the hat.\n\"Not yet!\" said Clucky."
      },
      {
        "pageNumber": 6,
        "text": "She sat in the mud."
      },
      {
        "pageNumber": 7,
        "text": "Oh! An egg!"
      },
      {
        "pageNumber": 8,
        "text": "\"Not in the mud!\" said Clucky."
      }
    ]
  },
  {
    "id": "meadow-pals-04-bouncy-wont-stop",
    "title": "Bouncy Won't Stop",
    "bookNumber": 4,
    "theme": "Bouncy in Sunny Meadow",
    "character": "Bouncy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Bouncy likes to hop."
      },
      {
        "pageNumber": 2,
        "text": "Hop. Hop. Hop."
      },
      {
        "pageNumber": 3,
        "text": "\"Stop!\" said Grumpy.\nHop. Hop. Hop."
      },
      {
        "pageNumber": 4,
        "text": "\"Stop!\" said Clucky.\nHop. Hop. Hop."
      },
      {
        "pageNumber": 5,
        "text": "\"Stop!\" said everyone.\nHop. Hop. Hop."
      },
      {
        "pageNumber": 6,
        "text": "Bouncy stopped."
      },
      {
        "pageNumber": 7,
        "text": "Then Bouncy hopped again."
      }
    ]
  },
  {
    "id": "meadow-pals-05-grumpy-gets-a-surprise",
    "title": "Grumpy Gets a Surprise",
    "bookNumber": 5,
    "theme": "Grumpy in Sunny Meadow",
    "character": "Grumpy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "It is Grumpy's birthday."
      },
      {
        "pageNumber": 2,
        "text": "\"I do not like birthdays,\" said Grumpy."
      },
      {
        "pageNumber": 3,
        "text": "\"I do not like cake,\" said Grumpy."
      },
      {
        "pageNumber": 4,
        "text": "\"I do not like hats,\" said Grumpy."
      },
      {
        "pageNumber": 5,
        "text": "\"SURPRISE!\" said everyone."
      },
      {
        "pageNumber": 6,
        "text": "\"I do not like surprises,\" said Grumpy."
      },
      {
        "pageNumber": 7,
        "text": "Grumpy had some cake."
      },
      {
        "pageNumber": 8,
        "text": "Grumpy had some more cake."
      },
      {
        "pageNumber": 9,
        "text": "Grumpy had a lot of cake."
      },
      {
        "pageNumber": 10,
        "text": "\"I like cake,\" said Grumpy."
      }
    ]
  },
  {
    "id": "meadow-pals-06-sleepy-cant-wake-up",
    "title": "Sleepy Can't Wake Up",
    "bookNumber": 6,
    "theme": "Sleepy in Sunny Meadow",
    "character": "Sleepy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "\"Get up, Sleepy!\" said Noisy."
      },
      {
        "pageNumber": 2,
        "text": "Sleepy did not get up."
      },
      {
        "pageNumber": 3,
        "text": "\"Get up, Sleepy!\" said Clucky."
      },
      {
        "pageNumber": 4,
        "text": "Sleepy did not get up."
      },
      {
        "pageNumber": 5,
        "text": "\"Get up, Sleepy!\" said Bouncy."
      },
      {
        "pageNumber": 6,
        "text": "Sleepy did not get up."
      },
      {
        "pageNumber": 7,
        "text": "\"GET UP, SLEEPY!\" said Noisy."
      },
      {
        "pageNumber": 8,
        "text": "Sleepy got up."
      },
      {
        "pageNumber": 9,
        "text": "Sleepy went back to bed."
      }
    ]
  },
  {
    "id": "meadow-pals-07-noisy-tries-to-be-quiet",
    "title": "Noisy Tries to Be Quiet",
    "bookNumber": 7,
    "theme": "Noisy in Sunny Meadow",
    "character": "Noisy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "\"Shh!\" said everyone."
      },
      {
        "pageNumber": 2,
        "text": "Noisy was quiet."
      },
      {
        "pageNumber": 3,
        "text": "Then a bug sat on Noisy."
      },
      {
        "pageNumber": 4,
        "text": "\"AHHH!\" said Noisy."
      },
      {
        "pageNumber": 5,
        "text": "\"Shh!\" said everyone."
      },
      {
        "pageNumber": 6,
        "text": "Noisy was very quiet."
      },
      {
        "pageNumber": 7,
        "text": "Then Noisy saw a worm."
      },
      {
        "pageNumber": 8,
        "text": "\"A WORM! A WORM! A WORM!\""
      },
      {
        "pageNumber": 9,
        "text": "\"SHH!\" said everyone."
      },
      {
        "pageNumber": 10,
        "text": "Noisy is not good at quiet."
      }
    ]
  },
  {
    "id": "meadow-pals-08-tiny-is-very-small",
    "title": "Tiny is Very Small",
    "bookNumber": 8,
    "theme": "Tiny in Sunny Meadow",
    "character": "Tiny",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Tiny is small."
      },
      {
        "pageNumber": 2,
        "text": "Very, very small."
      },
      {
        "pageNumber": 3,
        "text": "Tiny cannot reach the top."
      },
      {
        "pageNumber": 4,
        "text": "Tiny cannot open the big door."
      },
      {
        "pageNumber": 5,
        "text": "Tiny cannot jump the gap."
      },
      {
        "pageNumber": 6,
        "text": "But Tiny can fit in the pot."
      },
      {
        "pageNumber": 7,
        "text": "Tiny can fit in the bag."
      },
      {
        "pageNumber": 8,
        "text": "Tiny can fit in the log."
      },
      {
        "pageNumber": 9,
        "text": "Small is very, very good."
      }
    ]
  },
  {
    "id": "meadow-pals-09-shy-comes-out-to-play",
    "title": "Shy Comes Out to Play",
    "bookNumber": 9,
    "theme": "Shy in Sunny Meadow",
    "character": "Shy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Shy wants to play."
      },
      {
        "pageNumber": 2,
        "text": "But Shy is behind the barn."
      },
      {
        "pageNumber": 3,
        "text": "Bouncy went past.\n\"Come and play!\"\nShy hid."
      },
      {
        "pageNumber": 4,
        "text": "Tiny went past.\n\"Come and play!\"\nShy hid."
      },
      {
        "pageNumber": 5,
        "text": "Cuddly sat down by the barn."
      },
      {
        "pageNumber": 6,
        "text": "Cuddly did not go away."
      },
      {
        "pageNumber": 7,
        "text": "Shy sat next to Cuddly."
      },
      {
        "pageNumber": 8,
        "text": "Then Shy came out."
      },
      {
        "pageNumber": 9,
        "text": "Shy is playing!"
      }
    ]
  },
  {
    "id": "meadow-pals-10-giggly-has-the-hiccups",
    "title": "Giggly Has the Hiccups",
    "bookNumber": 10,
    "theme": "Giggly in Sunny Meadow",
    "character": "Giggly",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Giggly has the hiccups."
      },
      {
        "pageNumber": 2,
        "text": "Hic! Hic! Hic!"
      },
      {
        "pageNumber": 3,
        "text": "Giggly began to giggle.\nHic! Hee! Hic! Hee!"
      },
      {
        "pageNumber": 4,
        "text": "\"Drink this,\" said Clucky.\nHic! Hee! Hic! Hee!"
      },
      {
        "pageNumber": 5,
        "text": "\"Jump up,\" said Bouncy.\nHic! Hee! Hic! Hee!"
      },
      {
        "pageNumber": 6,
        "text": "\"Be very still,\" said Woolly.\nHic! Hee! Hic! Hee!"
      },
      {
        "pageNumber": 7,
        "text": "Then Giggly stopped."
      },
      {
        "pageNumber": 8,
        "text": "Hic."
      },
      {
        "pageNumber": 9,
        "text": "Oh no."
      }
    ]
  },
  {
    "id": "meadow-pals-11-brave-climbs-the-hay-bale",
    "title": "Brave Climbs the Hay Bale",
    "bookNumber": 11,
    "theme": "Brave in Sunny Meadow",
    "character": "Brave",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The hay bale is big."
      },
      {
        "pageNumber": 2,
        "text": "Very, very big."
      },
      {
        "pageNumber": 3,
        "text": "\"I can get up,\" said Brave."
      },
      {
        "pageNumber": 4,
        "text": "Brave fell off."
      },
      {
        "pageNumber": 5,
        "text": "\"I can get up,\" said Brave."
      },
      {
        "pageNumber": 6,
        "text": "Brave fell off again."
      },
      {
        "pageNumber": 7,
        "text": "\"I can get up,\" said Brave."
      },
      {
        "pageNumber": 8,
        "text": "Brave got up!"
      },
      {
        "pageNumber": 9,
        "text": "\"I am up!\" said Brave."
      },
      {
        "pageNumber": 10,
        "text": "Then Brave fell off."
      }
    ]
  },
  {
    "id": "meadow-pals-12-hungry-eats-everything",
    "title": "Hungry Eats Everything",
    "bookNumber": 12,
    "theme": "Hungry in Sunny Meadow",
    "character": "Hungry",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Hungry ate the grass."
      },
      {
        "pageNumber": 2,
        "text": "Hungry ate the flowers."
      },
      {
        "pageNumber": 3,
        "text": "Hungry ate the hat.\n\"My hat!\" said Clucky."
      },
      {
        "pageNumber": 4,
        "text": "Hungry ate the map.\n\"My map!\" said Tiny."
      },
      {
        "pageNumber": 5,
        "text": "Hungry ate the big cake.\n\"My cake!\" said Grumpy."
      },
      {
        "pageNumber": 6,
        "text": "Hungry was full."
      },
      {
        "pageNumber": 7,
        "text": "Hungry ate one more bit of grass."
      }
    ]
  },
  {
    "id": "meadow-pals-13-splashy-finds-a-puddle",
    "title": "Splashy Finds a Puddle",
    "bookNumber": 13,
    "theme": "Splashy in Sunny Meadow",
    "character": "Splashy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Splashy sees a puddle."
      },
      {
        "pageNumber": 2,
        "text": "It is a small puddle."
      },
      {
        "pageNumber": 3,
        "text": "Splashy jumps in."
      },
      {
        "pageNumber": 4,
        "text": "Splashy jumps and jumps."
      },
      {
        "pageNumber": 5,
        "text": "The puddle gets big.\nThe puddle gets very big."
      },
      {
        "pageNumber": 6,
        "text": "\"My feet are wet!\" said Grumpy."
      },
      {
        "pageNumber": 7,
        "text": "\"My hat is wet!\" said Clucky."
      },
      {
        "pageNumber": 8,
        "text": "\"My bed is wet!\" said Sleepy."
      },
      {
        "pageNumber": 9,
        "text": "Splashy is very happy."
      }
    ]
  },
  {
    "id": "meadow-pals-14-speedy-slows-down",
    "title": "Speedy Slows Down",
    "bookNumber": 14,
    "theme": "Speedy in Sunny Meadow",
    "character": "Speedy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Speedy runs fast.\nVery, very fast."
      },
      {
        "pageNumber": 2,
        "text": "Speedy runs to the barn."
      },
      {
        "pageNumber": 3,
        "text": "Speedy runs to the pond."
      },
      {
        "pageNumber": 4,
        "text": "Speedy runs to the big hill."
      },
      {
        "pageNumber": 5,
        "text": "Speedy runs to the..."
      },
      {
        "pageNumber": 6,
        "text": "Where is Speedy?"
      },
      {
        "pageNumber": 7,
        "text": "Speedy is lost."
      },
      {
        "pageNumber": 8,
        "text": "Speedy sits down."
      },
      {
        "pageNumber": 9,
        "text": "\"Over here!\" said Tiny."
      },
      {
        "pageNumber": 10,
        "text": "Speedy runs home."
      }
    ]
  },
  {
    "id": "meadow-pals-15-cuddly-wants-a-hug",
    "title": "Cuddly Wants a Hug",
    "bookNumber": 15,
    "theme": "Cuddly in Sunny Meadow",
    "character": "Cuddly",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Cuddly wants a hug."
      },
      {
        "pageNumber": 2,
        "text": "\"No hugs!\" said Grumpy."
      },
      {
        "pageNumber": 3,
        "text": "\"I am too wet!\" said Splashy."
      },
      {
        "pageNumber": 4,
        "text": "\"I am too fast!\" said Speedy."
      },
      {
        "pageNumber": 5,
        "text": "\"I am too muddy!\" said Muddy."
      },
      {
        "pageNumber": 6,
        "text": "Cuddly sat down."
      },
      {
        "pageNumber": 7,
        "text": "\"Oh, come here,\" said Woolly."
      },
      {
        "pageNumber": 8,
        "text": "Woolly gave Cuddly a big hug."
      },
      {
        "pageNumber": 9,
        "text": "\"More hugs!\" said Cuddly."
      },
      {
        "pageNumber": 10,
        "text": "\"No more hugs,\" said Woolly."
      }
    ]
  },
  {
    "id": "meadow-pals-16-muddy-and-splashy-make-a-mess",
    "title": "Muddy and Splashy Make a Mess",
    "bookNumber": 16,
    "theme": "Muddy and Splashy in Sunny Meadow",
    "character": "Muddy and Splashy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Muddy has some mud."
      },
      {
        "pageNumber": 2,
        "text": "Splashy has some water."
      },
      {
        "pageNumber": 3,
        "text": "Mud and water make... mud!"
      },
      {
        "pageNumber": 4,
        "text": "Muddy jumped in. Splashy jumped in."
      },
      {
        "pageNumber": 5,
        "text": "The mud went up."
      },
      {
        "pageNumber": 6,
        "text": "The mud went down."
      },
      {
        "pageNumber": 7,
        "text": "The mud went on Grumpy."
      },
      {
        "pageNumber": 8,
        "text": "\"I do not like mud!\" said Grumpy."
      },
      {
        "pageNumber": 9,
        "text": "Muddy likes mud. Splashy likes mud too."
      }
    ]
  },
  {
    "id": "meadow-pals-17-bouncy-and-speedy-have-a-race",
    "title": "Bouncy and Speedy Have a Race",
    "bookNumber": 17,
    "theme": "Bouncy and Speedy in Sunny Meadow",
    "character": "Bouncy and Speedy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "\"I am fast,\" said Speedy."
      },
      {
        "pageNumber": 2,
        "text": "\"I am fast too!\" said Bouncy."
      },
      {
        "pageNumber": 3,
        "text": "Ready. Set. Go!"
      },
      {
        "pageNumber": 4,
        "text": "Speedy ran fast. Bouncy hopped fast."
      },
      {
        "pageNumber": 5,
        "text": "They ran past the barn."
      },
      {
        "pageNumber": 6,
        "text": "They ran past the pond."
      },
      {
        "pageNumber": 7,
        "text": "They ran past the big hill."
      },
      {
        "pageNumber": 8,
        "text": "They ran and ran."
      },
      {
        "pageNumber": 9,
        "text": "They did not stop."
      },
      {
        "pageNumber": 10,
        "text": "They are still going."
      }
    ]
  },
  {
    "id": "meadow-pals-18-noisy-wakes-everyone-up",
    "title": "Noisy Wakes Everyone Up",
    "bookNumber": 18,
    "theme": "Noisy in Sunny Meadow",
    "character": "Noisy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "It is dark. Everyone is asleep."
      },
      {
        "pageNumber": 2,
        "text": "Noisy got up."
      },
      {
        "pageNumber": 3,
        "text": "COCK-A-DOODLE-DOO!"
      },
      {
        "pageNumber": 4,
        "text": "Grumpy woke up. Woolly woke up. Clucky woke up."
      },
      {
        "pageNumber": 5,
        "text": "Sleepy did not wake up."
      },
      {
        "pageNumber": 6,
        "text": "COCK-A-DOODLE-DOO!"
      },
      {
        "pageNumber": 7,
        "text": "Sleepy woke up."
      },
      {
        "pageNumber": 8,
        "text": "It is still dark."
      },
      {
        "pageNumber": 9,
        "text": "\"NOISY!\" said everyone."
      }
    ]
  },
  {
    "id": "meadow-pals-19-tiny-and-brave-go-on-an-adventure",
    "title": "Tiny and Brave Go on an Adventure",
    "bookNumber": 19,
    "theme": "Tiny and Brave in Sunny Meadow",
    "character": "Tiny and Brave",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Tiny has lost a hat."
      },
      {
        "pageNumber": 2,
        "text": "\"I will help,\" said Brave."
      },
      {
        "pageNumber": 3,
        "text": "They went to the barn. No hat."
      },
      {
        "pageNumber": 4,
        "text": "They went to the pond. No hat."
      },
      {
        "pageNumber": 5,
        "text": "They went to the big hill. No hat."
      },
      {
        "pageNumber": 6,
        "text": "They went back home."
      },
      {
        "pageNumber": 7,
        "text": "The hat was on Tiny."
      },
      {
        "pageNumber": 8,
        "text": "\"Oh,\" said Brave."
      },
      {
        "pageNumber": 9,
        "text": "\"Oh,\" said Tiny."
      }
    ]
  },
  {
    "id": "meadow-pals-20-shy-and-cuddly-find-each-other",
    "title": "Shy and Cuddly Find Each Other",
    "bookNumber": 20,
    "theme": "Shy and Cuddly in Sunny Meadow",
    "character": "Shy and Cuddly",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Cuddly wants a hug. Cuddly looks and looks."
      },
      {
        "pageNumber": 2,
        "text": "Shy is hiding."
      },
      {
        "pageNumber": 3,
        "text": "Cuddly went past the big tree."
      },
      {
        "pageNumber": 4,
        "text": "Shy is in the big tree!"
      },
      {
        "pageNumber": 5,
        "text": "\"Oh!\" said Shy."
      },
      {
        "pageNumber": 6,
        "text": "\"Oh!\" said Cuddly."
      },
      {
        "pageNumber": 7,
        "text": "They sat in the big tree."
      },
      {
        "pageNumber": 8,
        "text": "Cuddly got a hug."
      },
      {
        "pageNumber": 9,
        "text": "Shy got a hug too."
      },
      {
        "pageNumber": 10,
        "text": "Both of them are happy."
      }
    ]
  },
  {
    "id": "meadow-pals-21-woolly-and-grumpy-are-stuck",
    "title": "Woolly and Grumpy Are Stuck",
    "bookNumber": 21,
    "theme": "Woolly and Grumpy in Sunny Meadow",
    "character": "Woolly and Grumpy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Woolly is stuck. Grumpy is stuck."
      },
      {
        "pageNumber": 2,
        "text": "Woolly's wool is on Grumpy's horn."
      },
      {
        "pageNumber": 3,
        "text": "\"Pull!\" said Grumpy. The wool did not come off."
      },
      {
        "pageNumber": 4,
        "text": "Grumpy went left. Woolly went left."
      },
      {
        "pageNumber": 5,
        "text": "Grumpy went right. Woolly went right."
      },
      {
        "pageNumber": 6,
        "text": "Grumpy sat down. Woolly sat down."
      },
      {
        "pageNumber": 7,
        "text": "\"I do not like this,\" said Grumpy. \"I do not like this,\" said Woolly."
      },
      {
        "pageNumber": 8,
        "text": "Tiny got the wool off."
      },
      {
        "pageNumber": 9,
        "text": "Grumpy ran. Woolly ran. Not the same way."
      }
    ]
  },
  {
    "id": "meadow-pals-22-sleepys-big-dream",
    "title": "Sleepy's Big Dream",
    "bookNumber": 22,
    "theme": "Sleepy in Sunny Meadow",
    "character": "Sleepy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sleepy went to sleep."
      },
      {
        "pageNumber": 2,
        "text": "Sleepy had a dream."
      },
      {
        "pageNumber": 3,
        "text": "In the dream, Sleepy could run. Run! Run! Run!"
      },
      {
        "pageNumber": 4,
        "text": "In the dream, Sleepy could jump. Jump! Jump! Jump!"
      },
      {
        "pageNumber": 5,
        "text": "In the dream, Sleepy was very fast."
      },
      {
        "pageNumber": 6,
        "text": "In the dream, Sleepy was a superhero!"
      },
      {
        "pageNumber": 7,
        "text": "Then Sleepy woke up."
      },
      {
        "pageNumber": 8,
        "text": "Sleepy went back to sleep."
      }
    ]
  },
  {
    "id": "meadow-pals-23-giggly-and-clucky-bake-a-cake",
    "title": "Giggly and Clucky Bake a Cake",
    "bookNumber": 23,
    "theme": "Giggly and Clucky in Sunny Meadow",
    "character": "Giggly and Clucky",
    "pages": [
      {
        "pageNumber": 1,
        "text": "\"We will bake a cake,\" said Clucky."
      },
      {
        "pageNumber": 2,
        "text": "Clucky got the eggs. Giggly giggled at the eggs."
      },
      {
        "pageNumber": 3,
        "text": "Clucky got the flour. Giggly giggled at the flour."
      },
      {
        "pageNumber": 4,
        "text": "The flour went on Clucky."
      },
      {
        "pageNumber": 5,
        "text": "\"Ha! Ha! Ha!\" said Giggly."
      },
      {
        "pageNumber": 6,
        "text": "Clucky did not giggle."
      },
      {
        "pageNumber": 7,
        "text": "The cake went in."
      },
      {
        "pageNumber": 8,
        "text": "The cake came out."
      },
      {
        "pageNumber": 9,
        "text": "It was a very flat cake."
      },
      {
        "pageNumber": 10,
        "text": "Giggly giggled at the cake."
      },
      {
        "pageNumber": 11,
        "text": "Clucky had a bit. Then Clucky giggled too."
      }
    ]
  },
  {
    "id": "meadow-pals-24-grumpys-secret",
    "title": "Grumpy's Secret",
    "bookNumber": 24,
    "theme": "Grumpy in Sunny Meadow",
    "character": "Grumpy",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Every day, Grumpy goes off."
      },
      {
        "pageNumber": 2,
        "text": "\"Where does Grumpy go?\" said Woolly."
      },
      {
        "pageNumber": 3,
        "text": "\"I do not know,\" said Clucky."
      },
      {
        "pageNumber": 4,
        "text": "\"I do not know,\" said Bouncy."
      },
      {
        "pageNumber": 5,
        "text": "\"I do not know,\" said Noisy."
      },
      {
        "pageNumber": 6,
        "text": "Tiny went to look."
      },
      {
        "pageNumber": 7,
        "text": "Grumpy was in the garden."
      },
      {
        "pageNumber": 8,
        "text": "Grumpy was watering the flowers."
      },
      {
        "pageNumber": 9,
        "text": "Big red flowers. Big yellow flowers."
      },
      {
        "pageNumber": 10,
        "text": "\"You can look,\" said Grumpy. \"But do not tell.\""
      },
      {
        "pageNumber": 11,
        "text": "Tiny told everyone."
      }
    ]
  },
  {
    "id": "meadow-pals-25-the-big-farm-party",
    "title": "The Big Farm Party",
    "bookNumber": 25,
    "theme": "The Meadow Pals in Sunny Meadow",
    "character": "Meadow Pals",
    "pages": [
      {
        "pageNumber": 1,
        "text": "It is party day!"
      },
      {
        "pageNumber": 2,
        "text": "Muddy made a mud cake."
      },
      {
        "pageNumber": 3,
        "text": "Clucky made a big cake."
      },
      {
        "pageNumber": 4,
        "text": "Noisy played the music. It was very, very loud."
      },
      {
        "pageNumber": 5,
        "text": "Bouncy blew up the balloons. She did not stop."
      },
      {
        "pageNumber": 6,
        "text": "Tiny hung up the flags."
      },
      {
        "pageNumber": 7,
        "text": "Shy hid behind the barn."
      },
      {
        "pageNumber": 8,
        "text": "\"Come in, Shy!\" said Cuddly. Shy came in."
      },
      {
        "pageNumber": 9,
        "text": "Grumpy sat at the back."
      },
      {
        "pageNumber": 10,
        "text": "Grumpy had a lot of cake."
      },
      {
        "pageNumber": 11,
        "text": "\"I like parties,\" said Grumpy."
      },
      {
        "pageNumber": 12,
        "text": "Everyone is at the party."
      },
      {
        "pageNumber": 13,
        "text": "Everyone is happy."
      }
    ]
  }
];

export const guidedReadingSeriesBooks = [
  createBobAndNanBook({
    id: "bob-and-nan-01",
    title: "Bob and Nan",
    bookNumber: 1,
    theme: "introducing Bob and Nan",
    pages: [
      {
        pageNumber: 1,
        text: "This is Bob.",
        illustrationPrompt: "Bob stands facing viewer. Green spring garden behind him, small yellow and white daisies, low white picket fence, blue sky."
      },
      {
        pageNumber: 2,
        text: "Bob can run.",
        illustrationPrompt: "Bob mid-run left to right, big grin, black hair windswept. Green lawn, pink cherry blossom tree in background."
      },
      {
        pageNumber: 3,
        text: "This is Nan.",
        illustrationPrompt: "Nan stands facing viewer, big warm smile, hands clasped. Same spring garden setting as page 1."
      },
      {
        pageNumber: 4,
        text: "Nan can run.",
        illustrationPrompt: "Nan mid-run right to left, red dress flaring slightly, blonde hair streaming back. Same spring setting."
      },
      {
        pageNumber: 5,
        text: "Bob and Nan ran.",
        illustrationPrompt: "Bob and Nan running side by side on bright green grass, both grinning. Open spring field, blue sky."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan sat.",
        illustrationPrompt: "Bob and Nan sitting cross-legged on grass, smiling at viewer. Yellow buttercups and daisies around them."
      },
      {
        pageNumber: 7,
        text: "Bob and Nan are pals!",
        illustrationPrompt: "Bob and Nan standing together, Nan's arm around Bob's shoulder. Their two houses behind them, spring garden."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-02-park",
    title: "Bob and Nan go to the Park",
    bookNumber: 2,
    theme: "park play",
    pages: [
      {
        pageNumber: 1,
        text: "Bob and Nan go to the park.",
        illustrationPrompt: "Bob and Nan walking side by side along a path toward a park gate. Green park visible beyond the gate. Spring day."
      },
      {
        pageNumber: 2,
        text: "Bob can run fast!",
        illustrationPrompt: "Bob sprinting along a park path, arms wide, huge grin. Park trees and path behind him."
      },
      {
        pageNumber: 3,
        text: "Nan can run fast!",
        illustrationPrompt: "Nan sprinting on park grass, dress flaring, hair flying, huge grin. Matching energy to Bob."
      },
      {
        pageNumber: 4,
        text: "Bob got on the big swing.",
        illustrationPrompt: "Bob seated on a park swing, gripping the chains, feet pointing forward in a big arc. Delighted expression."
      },
      {
        pageNumber: 5,
        text: "Nan got on the big swing.",
        illustrationPrompt: "Nan seated on the swing next to Bob's, pumping her legs, swinging high. Big smile."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan ran up the big hill.",
        illustrationPrompt: "Bob and Nan running up a steep grassy hill together, leaning forward, laughing."
      },
      {
        pageNumber: 7,
        text: "What a fun day!",
        illustrationPrompt: "Bob and Nan at the top of the hill, arms raised in triumph, big smiles. Park spread out below them."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-03-fluff",
    title: "Bob, Nan and Fluff",
    bookNumber: 3,
    theme: "meeting Fluff",
    pages: [
      {
        pageNumber: 1,
        text: "Bob and Nan sat in the sun.",
        illustrationPrompt: "Bob and Nan sitting on the grass in bright summer sunshine, eyes half-closed contentedly. Garden setting."
      },
      {
        pageNumber: 2,
        text: "Bob saw a pup!",
        illustrationPrompt: "Bob pointing in surprise and delight at a small brown dog that has appeared at the garden gate. Wide eyes."
      },
      {
        pageNumber: 3,
        text: "The pup ran to Nan.",
        illustrationPrompt: "The small brown fluffy dog bounding happily across the grass toward Nan, tail wagging."
      },
      {
        pageNumber: 4,
        text: "Nan pat the pup.",
        illustrationPrompt: "Nan kneeling on the grass, gently patting the small brown dog's head. Dog's eyes closed in bliss, tail wagging."
      },
      {
        pageNumber: 5,
        text: "Bob pat the pup.",
        illustrationPrompt: "Bob kneeling beside Nan, also patting the dog. Both children and the dog look very happy together."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan call the pup Fluff.",
        illustrationPrompt: "Bob and Nan looking at each other and smiling, the dog sitting between them looking up at them."
      },
      {
        pageNumber: 7,
        text: "Fluff is our pup!",
        illustrationPrompt: "Bob, Nan and Fluff together, Bob and Nan kneeling with Fluff between them. All three joyful."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-04-beach",
    title: "Bob and Nan go to the Beach",
    bookNumber: 4,
    theme: "beach day",
    pages: [
      {
        pageNumber: 1,
        text: "Bob and Nan go to the beach.",
        illustrationPrompt: "Bob and Nan walking along a sandy path toward the sea, carrying a bucket and spade each. Excited faces."
      },
      {
        pageNumber: 2,
        text: "The sun is hot!",
        illustrationPrompt: "Bob and Nan standing on the beach looking up at a huge bright sun, shielding their eyes and grinning."
      },
      {
        pageNumber: 3,
        text: "Bob can dig.",
        illustrationPrompt: "Bob crouching on the sand, digging enthusiastically with a red spade, building a sandcastle."
      },
      {
        pageNumber: 4,
        text: "Nan can dig.",
        illustrationPrompt: "Nan crouching next to Bob's sandcastle, adding to it with a yellow spade. A growing sand structure between them."
      },
      {
        pageNumber: 5,
        text: "Bob got wet!",
        illustrationPrompt: "Bob standing in the shallow sea, a wave just washing over his shoes. Mouth open in a gasp, then laughing."
      },
      {
        pageNumber: 6,
        text: "Nan got wet!",
        illustrationPrompt: "Nan splashing in the shallow sea, both arms out for balance, sea water splashing all around. Huge delighted grin."
      },
      {
        pageNumber: 7,
        text: "Bob and Nan had fun at the beach!",
        illustrationPrompt: "Bob and Nan sitting on the sand at the water's edge. Sun lower now, sea sparkling. Happy, tired smiles."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-05-school",
    title: "Bob and Nan's First Day at School",
    bookNumber: 5,
    theme: "first day at school",
    pages: [
      {
        pageNumber: 1,
        text: "It is the big day.",
        illustrationPrompt: "Bob and Nan standing outside their houses in the early morning. Both in school clothes, looking nervous and excited. Autumn trees behind."
      },
      {
        pageNumber: 2,
        text: "Bob has his bag.",
        illustrationPrompt: "Bob holding up a blue school bag proudly, but his face shows mixed feelings, brave but a little nervous."
      },
      {
        pageNumber: 3,
        text: "Nan has her bag.",
        illustrationPrompt: "Nan clutching a red school bag to her chest, nervous expression. Mum's hand on her shoulder for reassurance."
      },
      {
        pageNumber: 4,
        text: "Bob is sad.",
        illustrationPrompt: "Bob's face with a slightly wobbly bottom lip, eyes wide, not crying but close. School gate visible ahead of him."
      },
      {
        pageNumber: 5,
        text: "Nan is sad.",
        illustrationPrompt: "Nan's face similarly worried, clutching Mum's hand tightly. Both are walking bravely forward."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan sit at a desk.",
        illustrationPrompt: "Bob and Nan seated side by side at small school desks in a bright classroom. Looking around with wide curious eyes."
      },
      {
        pageNumber: 7,
        text: "Bob and Nan had fun at school!",
        illustrationPrompt: "End of the day. Bob and Nan running out of the school gate, huge grins, school bags bouncing. Mum waiting."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-06-zoo",
    title: "Nan and Bob go to the Zoo",
    bookNumber: 6,
    theme: "zoo visit",
    pages: [
      {
        pageNumber: 1,
        text: "Nan and Bob go to the zoo.",
        illustrationPrompt: "Nan and Bob at the zoo entrance, a big colourful sign above them. Excited faces, Fluff on a lead beside them."
      },
      {
        pageNumber: 2,
        text: "Bob sees a big cat.",
        illustrationPrompt: "Bob pressing his face against a fence or glass, eyes wide, pointing at a large lion or tiger in the enclosure behind."
      },
      {
        pageNumber: 3,
        text: "Nan sees a red bird.",
        illustrationPrompt: "Nan gazing up in wonder at a large bright red macaw or flamingo in a tall aviary."
      },
      {
        pageNumber: 4,
        text: "Nan and Bob see the big fish.",
        illustrationPrompt: "Nan and Bob at an aquarium tank, noses pressed to the glass, huge fish swimming past on the other side."
      },
      {
        pageNumber: 5,
        text: "Nan sees a fat frog on a log.",
        illustrationPrompt: "Nan crouching down pointing at a large round frog sitting on a log in a glass tank or pond."
      },
      {
        pageNumber: 6,
        text: "Bob and Nan see the big ape.",
        illustrationPrompt: "Bob and Nan standing at a rope-and-glass enclosure, watching a large gorilla or orangutan sitting inside."
      },
      {
        pageNumber: 7,
        text: "The big ape ate a fig.",
        illustrationPrompt: "Close up of the large ape holding a fig and eating it calmly while Bob and Nan watch with delighted eyes."
      },
      {
        pageNumber: 8,
        text: "Nan and Bob had a lot of fun!",
        illustrationPrompt: "End of the zoo day. Nan and Bob walking back to the exit, Fluff between them, all three tired but very happy."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-07-birthday",
    title: "Nan and Bob: Bob's Birthday Party",
    bookNumber: 7,
    theme: "birthday party",
    pages: [
      {
        pageNumber: 1,
        text: "It is Bob's big day!",
        illustrationPrompt: "Bob waking up in bed, sunlight streaming in, big excited smile. Balloons tied to his bedpost."
      },
      {
        pageNumber: 2,
        text: "Nan has a big gift for Bob.",
        illustrationPrompt: "Nan standing at Bob's front door, holding a large wrapped present almost as big as herself."
      },
      {
        pageNumber: 3,
        text: "Bob rips it! It is a red bat!",
        illustrationPrompt: "Bob tearing open the wrapping paper with delight, discovering a bright red cricket bat inside."
      },
      {
        pageNumber: 4,
        text: "Mum lit the big cake.",
        illustrationPrompt: "Mum lighting six candles on a large birthday cake while Bob and Nan watch eagerly."
      },
      {
        pageNumber: 5,
        text: "Bob can see six big candles.",
        illustrationPrompt: "Close up on Bob's face, lit by candlelight, eyes reflecting the six flames."
      },
      {
        pageNumber: 6,
        text: "Nan and Bob ate the big cake!",
        illustrationPrompt: "Nan and Bob sitting at a table, each with a large slice of cake, eating enthusiastically."
      },
      {
        pageNumber: 7,
        text: "Nan and Bob run and hop!",
        illustrationPrompt: "Nan and Bob playing outside after the party, running and hopping on the garden lawn."
      },
      {
        pageNumber: 8,
        text: "It was the best day!",
        illustrationPrompt: "Bob and Nan sitting in the garden at the end of the day, happy and tired."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-08-sick",
    title: "Nan and Bob get Sick",
    bookNumber: 8,
    theme: "getting better",
    pages: [
      {
        pageNumber: 1,
        text: "Bob is hot. Bob is ill.",
        illustrationPrompt: "Bob in bed with flushed cheeks, looking tired but safe and cared for."
      },
      {
        pageNumber: 2,
        text: "Bob has to rest in bed.",
        illustrationPrompt: "Bob tucked into bed resting quietly while Nan and Fluff look in gently."
      },
      {
        pageNumber: 3,
        text: "Nan is ill too.",
        illustrationPrompt: "Nan sitting up in bed or on the sofa with flushed cheeks, looking tired."
      },
      {
        pageNumber: 4,
        text: "Nan has a nap. Fluff has a nap too.",
        illustrationPrompt: "Nan asleep under a blanket with Fluff curled up asleep nearby."
      },
      {
        pageNumber: 5,
        text: "Mum has a hot cup for Nan and Bob.",
        illustrationPrompt: "Mum bringing warm cups to Nan and Bob as they rest."
      },
      {
        pageNumber: 6,
        text: "Nan and Bob sip and rest.",
        illustrationPrompt: "Nan and Bob quietly sipping from cups while resting with blankets."
      },
      {
        pageNumber: 7,
        text: "Bob is well! Nan is well!",
        illustrationPrompt: "Bob and Nan smiling brightly, standing up and looking healthy again."
      },
      {
        pageNumber: 8,
        text: "Run, Bob! Run, Nan! Run, Fluff!",
        illustrationPrompt: "Bob, Nan, and Fluff running outside together, fully well and joyful."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-09-read",
    title: "Nan and Bob Learn to Read",
    bookNumber: 9,
    theme: "learning to read",
    pages: [
      {
        pageNumber: 1,
        text: "Nan has a big red book.",
        illustrationPrompt: "Nan sitting cross-legged on a rug, holding a large red book open on her lap."
      },
      {
        pageNumber: 2,
        text: "Nan can read! Bob can not yet.",
        illustrationPrompt: "Nan reading confidently while Bob sits beside her looking puzzled but interested."
      },
      {
        pageNumber: 3,
        text: "Nan will help Bob.",
        illustrationPrompt: "Nan pointing at a word in the open book while Bob watches carefully."
      },
      {
        pageNumber: 4,
        text: "C - A - T. Cat! Bob can get it!",
        illustrationPrompt: "Bob pointing at the word CAT in the book with a surprised, delighted expression."
      },
      {
        pageNumber: 5,
        text: "Bob can read it: 'The dog ran.'",
        illustrationPrompt: "Bob holding the book himself and reading the sentence while Nan listens proudly."
      },
      {
        pageNumber: 6,
        text: "Bob can read! Bob is so glad!",
        illustrationPrompt: "Bob celebrating with the book while Nan claps and Fluff bounds around him."
      },
      {
        pageNumber: 7,
        text: "Nan and Bob read all day.",
        illustrationPrompt: "Nan and Bob on the sofa, each absorbed in their own book, with Fluff asleep between them."
      },
      {
        pageNumber: 8,
        text: "Fluff had a nap. Good dog, Fluff!",
        illustrationPrompt: "Close-up of Fluff fast asleep on the sofa between two open books while Nan and Bob smile at him."
      }
    ]
  }),
  createBobAndNanBook({
    id: "bob-and-nan-10-vet",
    title: "Fluff Visits the Vet",
    bookNumber: 10,
    theme: "vet visit",
    pages: [
      {
        pageNumber: 1,
        text: "Fluff has a sore leg.",
        illustrationPrompt: "Fluff sitting with one paw slightly raised, looking sorry for himself while Nan and Bob crouch beside him."
      },
      {
        pageNumber: 2,
        text: "Nan and Bob are sad.",
        illustrationPrompt: "Nan and Bob with worried faces looking at Fluff and stroking him gently."
      },
      {
        pageNumber: 3,
        text: "Mum and Nan and Bob go to the vet.",
        illustrationPrompt: "Mum, Nan and Bob walking together with Fluff, heading to the vet."
      },
      {
        pageNumber: 4,
        text: "Fluff sits on the big bed.",
        illustrationPrompt: "Fluff sitting on the vet's examination table while Nan and Bob stand close to reassure him."
      },
      {
        pageNumber: 5,
        text: "The vet has a look.",
        illustrationPrompt: "A kind vet gently examining Fluff's paw while Nan and Bob watch."
      },
      {
        pageNumber: 6,
        text: "The vet has a jab for Fluff.",
        illustrationPrompt: "The vet preparing a small injection while Fluff bravely squeezes his eyes shut."
      },
      {
        pageNumber: 7,
        text: "Fluff is so good! What a pup!",
        illustrationPrompt: "The vet offering Fluff a treat while Nan and Bob hug each other in relief."
      },
      {
        pageNumber: 8,
        text: "Fluff is well! Run, Fluff, run!",
        illustrationPrompt: "Fluff running freely in the spring garden with Bob and Nan running alongside him."
      }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-01-space",
    title: "James and Anna go to Space",
    bookNumber: 1,
    theme: "cardboard rocket space adventure",
    sightWords: ["and", "the", "said", "they", "were", "into", "some", "very"],
    targetPatterns: ["final-sounds", "short-vowels", "longer-sentences", "dialogue"],
    pages: [
      { pageNumber: 1, text: `James and Anna were in the garden. They had lots of big, flat boxes.`, illustrationPrompt: "James and Anna in the garden surrounded by large cardboard boxes." },
      { pageNumber: 2, text: `"Let us make a rocket!" said James. "We can fly all the way into space!"`, illustrationPrompt: "James pointing up at the sky while Anna looks up smiling." },
      { pageNumber: 3, text: `Anna grabbed her pen and drew the plan. "It needs big wings," she said, "and a pointed nose cone at the top."`, illustrationPrompt: "Anna drawing a rocket plan on paper in the garden." },
      { pageNumber: 4, text: `They cut and snipped and stuck and taped. They worked all morning long.`, illustrationPrompt: "James and Anna cutting, taping, and building the cardboard rocket." },
      { pageNumber: 5, text: `James got the red paint. Anna got the silver paint. They painted and painted until it shone!`, illustrationPrompt: "James and Anna painting a red and silver cardboard rocket." },
      { pageNumber: 6, text: `"It is the best rocket ever made!" said James. He and Anna stood back and grinned.`, illustrationPrompt: "James and Anna proudly admiring the finished cardboard rocket." },
      { pageNumber: 7, text: `They climbed inside. James held up five fingers. "Five... four... three... two... one... BLAST OFF!"`, illustrationPrompt: "James and Anna inside the rocket starting the countdown." },
      { pageNumber: 8, text: `Up, up, up went the rocket! They shot past the white clouds and into the deep, dark sky.`, illustrationPrompt: "Imagination scene with the rocket blasting upward through clouds toward space." },
      { pageNumber: 9, text: `They flew past big round planets. Some had red spots. Some had wide, shining rings!`, illustrationPrompt: "Rocket flying past planets with spots and rings in space." },
      { pageNumber: 10, text: `They landed on the moon with a big BUMP! It was pale and still and very, very quiet.`, illustrationPrompt: "James and Anna landing on the moon in little space suits." },
      { pageNumber: 11, text: `A small green alien ran to say hello. "My name is Zim!" it said. "Do you want to play?"`, illustrationPrompt: "Zim the small green alien greeting James and Anna on the moon." },
      { pageNumber: 12, text: `James and Anna played with Zim all day. They jumped so high on the moon!`, illustrationPrompt: "James, Anna, and Zim jumping high on the moon." },
      { pageNumber: 13, text: `"Time to go home," said Anna. "Come back soon!" called Zim, and he waved and waved.`, illustrationPrompt: "Rocket lifting off while Zim waves goodbye from the moon." },
      { pageNumber: 14, text: `BUMP! They were back in the garden. Mum had made cake. "Best trip EVER!" they said.`, illustrationPrompt: "James and Anna back in the garden with Mum holding cake." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-02-chips",
    title: "James and Anna and Chips",
    bookNumber: 2,
    theme: "pet goat mischief",
    sightWords: ["and", "had", "his", "was", "with", "from", "one", "said"],
    targetPatterns: ["final-sounds", "short-vowels", "consonant-digraphs", "dialogue"],
    pages: [
      { pageNumber: 1, text: `James and Anna had a pet goat. His name was Chips. He was small and white with big brown patches.`, illustrationPrompt: "James and Anna in the garden with Chips the small white and brown goat." },
      { pageNumber: 2, text: `Chips had a blue bell on his collar. JINGLE! JINGLE! JINGLE! You could hear him coming from far away!`, illustrationPrompt: "Chips trotting with a blue bell jingling on his collar." },
      { pageNumber: 3, text: `Chips liked to eat. He ate the long green grass. He ate sticks and bits of bark. One day, he ate Dad's best hat!`, illustrationPrompt: "Chips chewing Dad's straw hat while Dad looks shocked." },
      { pageNumber: 4, text: `"CHIPS!" said Dad. Chips blinked. He chewed. He looked the other way.`, illustrationPrompt: "Dad pointing at Chips while Chips calmly chews and looks away." },
      { pageNumber: 5, text: `James made Chips a lead from a long piece of rope. Now Chips could come on walks!`, illustrationPrompt: "James tying a rope lead to Chips's collar." },
      { pageNumber: 6, text: `They set off down the lane. Chips trotted along and stopped to munch the long grass at the sides.`, illustrationPrompt: "James and Anna walking Chips down a leafy lane." },
      { pageNumber: 7, text: `Then Chips saw a big rose bush. He ran at it. CRUNCH! MUNCH! SNAP! The rose bush was gone.`, illustrationPrompt: "Chips charging into a rose bush with petals and leaves flying." },
      { pageNumber: 8, text: `"Oh, Chips!" said Anna. But she gave him a big hug. Chips licked her right on the nose.`, illustrationPrompt: "Anna hugging Chips while he licks her nose." },
      { pageNumber: 9, text: `They got home just in time for lunch. James filled Chips's bowl with fresh grass and sliced apple.`, illustrationPrompt: "James filling Chips's bowl with grass and sliced apple." },
      { pageNumber: 10, text: `Chips ate it all in a flash. He looked at the bowl. Then he looked at James. Then he looked at James's jumper.`, illustrationPrompt: "Chips looking from the empty bowl to James's jumper." },
      { pageNumber: 11, text: `CRUNCH! He ate the jumper.`, illustrationPrompt: "Chips chewing James's jumper while James looks shocked." },
      { pageNumber: 12, text: `"CHIPS!" they both said. But they could not stop smiling. Chips was naughty and cheeky and silly — and they loved him so much.`, illustrationPrompt: "James and Anna pointing at Chips but smiling warmly." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-03-shopping",
    title: "James and Anna go Shopping",
    bookNumber: 3,
    theme: "helping Mum shop",
    sightWords: ["was", "said", "the", "they", "both", "home", "with"],
    targetPatterns: ["final-sounds", "short-vowels", "compound-phrases", "dialogue"],
    pages: [
      { pageNumber: 1, text: `It was a bright autumn day. Mum had a long list. "I need help at the shop," she said. "Can you both come?"`, illustrationPrompt: "Mum holding a shopping list while James and Anna look eager." },
      { pageNumber: 2, text: `"Yes!" said James and Anna. James grabbed the list. Anna grabbed the bags. Off they went!`, illustrationPrompt: "James with the list and Anna with bags heading out." },
      { pageNumber: 3, text: `The shop was big and bright. It smelled of fresh bread and ripe fruit.`, illustrationPrompt: "James and Anna stepping into a bright supermarket." },
      { pageNumber: 4, text: `"We need bread, grapes, cheese, eggs and orange juice," said James, reading the list carefully.`, illustrationPrompt: "James reading the list carefully in the shop." },
      { pageNumber: 5, text: `Anna ran to find the bread. She picked the big round loaf with seeds on top. It smelled amazing!`, illustrationPrompt: "Anna choosing a round seeded loaf from the bread shelf." },
      { pageNumber: 6, text: `James found the grapes. Red ones or green ones? He put both bunches in the basket — just to be safe.`, illustrationPrompt: "James choosing both red and green grapes." },
      { pageNumber: 7, text: `They found the cheese, the eggs and the juice. James was very careful with the eggs.`, illustrationPrompt: "James carefully carrying an egg box while Anna has other shopping." },
      { pageNumber: 8, text: `Then Anna spotted the cake stand! Big cakes, small cakes, jam tarts and iced buns — all in a long, shining row.`, illustrationPrompt: "Anna and James dazzled by a cake display." },
      { pageNumber: 9, text: `"Can we get a cake each?" asked James. Mum smiled. "One each," she said.`, illustrationPrompt: "James asking Mum for cake while Mum holds up one finger." },
      { pageNumber: 10, text: `James chose a big slice of lemon cake with thick white icing. Anna chose a pink strawberry jam tart.`, illustrationPrompt: "James choosing lemon cake and Anna choosing a jam tart." },
      { pageNumber: 11, text: `At the till, Mum let James put the shopping on the belt. He was VERY careful with the eggs.`, illustrationPrompt: "James carefully placing eggs on the checkout belt." },
      { pageNumber: 12, text: `On the way home, the bread smelled so good. James started to reach into the bag. Anna gave him a look. He stopped.`, illustrationPrompt: "James reaching for bread while Anna gives him a warning look." },
      { pageNumber: 13, text: `At home, Mum made lunch. After, they had their cakes. Chips ate the paper bag. "CHIPS!" they said. But they were laughing too hard to be cross.`, illustrationPrompt: "James and Anna laughing at the table while Chips eats the paper bag." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-04-dentist",
    title: "James and Anna go to the Dentist",
    bookNumber: 4,
    theme: "first dentist visit",
    sightWords: ["was", "said", "the", "there", "they", "both", "very"],
    targetPatterns: ["final-sounds", "digraphs", "longer-sentences", "dialogue"],
    pages: [
      { pageNumber: 1, text: `It was time to go to the dentist. James did NOT want to go. Anna did NOT want to go. But Mum said they must.`, illustrationPrompt: "James and Anna worried at home while Mum holds appointment cards." },
      { pageNumber: 2, text: `"The dentist is very kind," said Mum. "She just takes a little look inside your mouth. That is all."`, illustrationPrompt: "Mum gently reassuring James and Anna." },
      { pageNumber: 3, text: `James was not so sure. He made his most worried face all the way there. Anna held his hand.`, illustrationPrompt: "Anna holding James's hand on the way to the dentist." },
      { pageNumber: 4, text: `At the dentist, there was a big fish tank in the waiting room! Bright fish darted in and out of rocks and weeds.`, illustrationPrompt: "James and Anna looking at a big fish tank in the waiting room." },
      { pageNumber: 5, text: `James pressed his nose flat to the glass. "That one looks just like a tiny striped rocket!" he said.`, illustrationPrompt: "James pressing his nose to the fish tank glass." },
      { pageNumber: 6, text: `Anna found a book about sharks on the shelf. She sat down and read and read. She forgot to feel scared.`, illustrationPrompt: "Anna reading a shark picture book in the waiting room." },
      { pageNumber: 7, text: `"James!" called the dentist. He stood up. He walked in. The big chair went up and down like a ride!`, illustrationPrompt: "James in the dentist chair as it goes up and down." },
      { pageNumber: 8, text: `"Open wide!" said the dentist. She used a small mirror and a bright little light. "All done! Ten out of ten!" James grinned.`, illustrationPrompt: "Kind dentist checking James's teeth with mirror and light." },
      { pageNumber: 9, text: `James came out. "It did not hurt at all!" he said. "And the chair goes UP and DOWN!" Anna laughed.`, illustrationPrompt: "James returning to the waiting room excited and relieved." },
      { pageNumber: 10, text: `"Anna!" called the dentist. Anna walked in. She sat in the big chair. She had to admit — it was like a ride.`, illustrationPrompt: "Anna sitting in the dentist chair and starting to smile." },
      { pageNumber: 11, text: `The dentist sang a little tune while she checked Anna's teeth. Anna smiled the whole time. "Ten out of ten!" said the dentist.`, illustrationPrompt: "Dentist humming while checking Anna's teeth." },
      { pageNumber: 12, text: `"Well done, both of you," said Mum. "You were so brave today." They each got a sticker — James got a rocket, Anna got a star.`, illustrationPrompt: "James and Anna showing their stickers outside the dentist." },
      { pageNumber: 13, text: `That night, they brushed their teeth for a very long time. Chips sat at the bathroom door and watched. "Good night, Chips," said Anna. Chips blinked.`, illustrationPrompt: "James and Anna brushing teeth while Chips watches from the doorway." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "james-and-anna-05-tree-house",
    title: "James and Anna build a Tree House",
    bookNumber: 5,
    theme: "building a tree house",
    sightWords: ["the", "said", "they", "were", "with", "there", "best"],
    targetPatterns: ["final-sounds", "digraphs", "blends", "dialogue"],
    pages: [
      { pageNumber: 1, text: `At the end of the garden stood a big old oak tree. James and Anna had been staring at it for days.`, illustrationPrompt: "James and Anna staring up at a big old oak tree." },
      { pageNumber: 2, text: `"We should build a tree house!" said James. He got his notebook and drew the plan right away. It had a door, a window, a flag and a rope ladder.`, illustrationPrompt: "James drawing a tree house plan in a notebook." },
      { pageNumber: 3, text: `Anna made a list. "We will need planks of wood, nails, rope, hinges and paint," she said. "And a flag."`, illustrationPrompt: "Anna making a building list while James listens." },
      { pageNumber: 4, text: `"I can help," said Dad, "but you two are in charge. You tell me the plan."`, illustrationPrompt: "Dad looking at James's plan under the oak tree." },
      { pageNumber: 5, text: `Dad did the tricky high bits — the tall planks and the big nails. James and Anna passed the tools and held the wood still.`, illustrationPrompt: "Dad on a ladder while James and Anna help with tools and wood." },
      { pageNumber: 6, text: `BANG! BANG! BANG! went the hammer. WHIRR! went the drill. The frame went up bit by bit.`, illustrationPrompt: "Action scene as the tree house frame goes up." },
      { pageNumber: 7, text: `Next came the floor — flat planks, all in a row. "Walk on it!" said Dad. They did. It held firm!`, illustrationPrompt: "James and Anna testing the new tree house floor." },
      { pageNumber: 8, text: `Then they made the walls and cut a little door. James helped saw a window hole with a small hand saw.`, illustrationPrompt: "James helping saw a window hole with Dad guiding." },
      { pageNumber: 9, text: `Now for the best bit — the paint! James chose blue for the walls. Anna chose yellow for the door. Chips chewed the lid off the paint tin.`, illustrationPrompt: "James painting blue walls, Anna painting the yellow door, Chips taking the paint lid." },
      { pageNumber: 10, text: `When the paint was dry, Anna cut a red star from felt and glued it on the flag. James fixed the flag to a long stick and tied it to the roof.`, illustrationPrompt: "Anna making the flag while James ties it to the roof." },
      { pageNumber: 11, text: `The tree house was done! Blue walls, a yellow door, a red star flag and a rope ladder all the way to the ground.`, illustrationPrompt: "Wide shot of the finished blue and yellow tree house." },
      { pageNumber: 12, text: `James and Anna climbed up and sat at the little window. "This is the best thing we have ever made," said Anna.`, illustrationPrompt: "James and Anna smiling from the tree house window." },
      { pageNumber: 13, text: `Mum sent up a tray of juice and biscuits on a rope. Dad waved from below. Chips jangled at the base of the tree, trying to reach the biscuits.`, illustrationPrompt: "A tray of juice and biscuits being hoisted to the tree house while Chips reaches up." },
      { pageNumber: 14, text: `That night, they got their sleeping bags and climbed up to sleep. Stars shone above them. "Best. Night. Ever," said James. Anna smiled. She agreed.`, illustrationPrompt: "Night scene with James and Anna in sleeping bags inside the glowing tree house." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "ja-b-06",
    title: "James and Anna visit Grandma's Farm",
    bookNumber: 6,
    theme: "grandma farm visit",
    sightWords: ["and", "the", "said", "they", "there", "was", "were", "too"],
    targetPatterns: ["level-b", "longer-sentences", "dialogue", "farm-vocabulary"],
    pages: [
      { pageNumber: 1, text: `James and Anna were going to stay at Grandma's farm for the week. They packed their bags — and Chips got in the car too.`, illustrationPrompt: "James and Anna loading bags into the back of a car, Chips standing proudly next to the car looking like he fully intends to come along. Summer morning outside their house." },
      { pageNumber: 2, text: `Grandma's farm was big and sunny. There were hens in the yard, ducks by the pond and a very fat pig called Percy.`, illustrationPrompt: "Wide sunny farm scene: Grandma's farmhouse (stone walls, red door) in background. Hens pecking in the yard, ducks at a pond, and a very round pink pig (Percy) visible in his pen. James and Anna stand at the farm gate, wide-eyed." },
      { pageNumber: 3, text: `James ran to see the hens. "They have laid five eggs!" he said. He put them one by one — very, very carefully — into a basket.`, illustrationPrompt: "James crouching in the henhouse, lifting a brown egg from a nest with both hands, tongue out with care. A basket beside him already has four eggs. Three hens watch him calmly." },
      { pageNumber: 4, text: `Anna found the duck pond. Three white ducks swam in slow circles. One waddled right up and ate seeds from Anna's hand.`, illustrationPrompt: "Anna kneeling at the edge of a small pond, arm outstretched, a white duck eating seeds from her flat palm. Two more white ducks glide on the water behind it. Anna's expression: total delight." },
      { pageNumber: 5, text: `Grandma had a big brown horse called Bess. She was huge and gentle. Her nose was the softest thing James had ever felt.`, illustrationPrompt: "James reaching up to touch the nose of Bess — a large warm-brown horse looking over a stable door. Bess's nose is large and James's whole hand is barely as wide as it. James looks utterly amazed. Grandma stands beside him smiling." },
      { pageNumber: 6, text: `Anna got to brush Bess's mane. James gave her a big red apple. Bess sniffed it — then snaffled the whole thing in one go!`, illustrationPrompt: "Anna standing on a small step, carefully brushing Bess's long dark mane. James holds up an apple to Bess's open mouth. Bess's lips are reaching for it with comic enthusiasm." },
      { pageNumber: 7, text: `Then Percy the pig got out. He ran in and out of the hen house and round and round the yard at top speed.`, illustrationPrompt: "Percy the round pink pig charging through the yard at full speed, hens scattering in all directions with feathers flying. Percy looks thrilled. James and Anna chase after him with arms wide." },
      { pageNumber: 8, text: `James chased Percy one way. Anna chased Percy the other way. Grandma just stood and laughed until her eyes watered.`, illustrationPrompt: "Comic chase scene: James running left, Anna running right, Percy zigzagging through the middle. Grandma in the background, doubled over laughing. Chips watches from a fence post, chewing thoughtfully." },
      { pageNumber: 9, text: `Chips had been quiet all morning. Then they found him — in the veggie patch, eating the bean plants.`, illustrationPrompt: "Chips in the middle of a vegetable patch, surrounded by half-eaten bean plants. He has a long green bean trailing from his mouth. He looks perfectly content and completely unsurprised to be found." },
      { pageNumber: 10, text: `"CHIPS!" said James and Anna together. Grandma came and looked. "He fits in very well here," she said.`, illustrationPrompt: "James and Anna pointing at Chips in the veggie patch. Grandma stands beside them, arms folded, smiling with genuine amusement rather than cross. Chips blinks." },
      { pageNumber: 11, text: `That evening, Grandma made soup from the garden and fried the eggs James had found. It was the best meal they had ever tasted.`, illustrationPrompt: "Kitchen scene: Grandma at the stove, stirring a pot of thick soup. James and Anna at the kitchen table, bowls in front of them, tasting with big happy expressions. Golden evening light." },
      { pageNumber: 12, text: `They sat outside as the sun went down. Bess looked over her gate. Percy slept in the mud. Chips ate the fence post. It had been the best farm day ever.`, illustrationPrompt: "Golden sunset farm scene: James and Anna sitting on a fence rail with Grandma between them. Bess's head over the stable gate in the background. Percy a round pink lump asleep in the pen. Chips quietly chewing the fence post they are sitting on. Warm, perfect end-of-day light." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "ja-b-07",
    title: "James and Anna and the School Play",
    bookNumber: 7,
    theme: "school play confidence",
    sightWords: ["the", "said", "they", "were", "want", "all", "could", "after"],
    targetPatterns: ["level-b", "longer-sentences", "dialogue", "school-vocabulary"],
    pages: [
      { pageNumber: 1, text: `Mrs. Green told the class: "We are putting on a school play! It is called 'The Lost Dragon'."`, illustrationPrompt: "Mrs. Green standing at the front of a bright primary school classroom, holding up a colourful playscript booklet. The class sits before her, all with excited faces. James and Anna visible in the front row." },
      { pageNumber: 2, text: `James put his hand straight up. "I want to be the dragon!" Six other children put their hands up too. They would all have to try out.`, illustrationPrompt: "James's hand shoots up first, arm fully extended, the most determined look on his face. Around him, five or six other hands also go up. Mrs. Green watches with a smile." },
      { pageNumber: 3, text: `Anna did not want to be the dragon. She wanted to paint the big backdrop — the scenery behind the stage.`, illustrationPrompt: "Anna with a large blank roll of paper spread on the floor, studying it thoughtfully. Beside her: pots of paint, wide brushes. She has a clear plan in her mind." },
      { pageNumber: 4, text: `James practised his dragon roar all week. It shook the windows. Mum wore earmuffs. Chips ran under the sofa.`, illustrationPrompt: "James at home, mouth wide open in a massive roar, arms raised like claws. Through the window: the glass is shown vibrating. Mum in the background wearing large yellow earmuffs, giving a thumbs up. Chips's tail and hind legs are visible under the sofa." },
      { pageNumber: 5, text: `On the day of try-outs, James roared so loud that Mrs. Green's glasses slid right down her nose. He got the part!`, illustrationPrompt: "James mid-roar in front of Mrs. Green and the class. Mrs. Green's round glasses have slid to the very tip of her nose. She looks impressed despite herself. The class watches in awe." },
      { pageNumber: 6, text: `Anna painted for three whole days. She made mountains, a red sunset sky and a tall castle with a flag. Everyone said it was brilliant.`, illustrationPrompt: "Anna standing back from an enormous painted backdrop — mountains in purples and blues, a vivid red-orange sky, a castle with a small flag. She holds a paintbrush, covered in paint, looking at her work with pride. Other children visible, impressed." },
      { pageNumber: 7, text: `On the night of the play, James wore a green scale costume and a red dragon mask. He looked completely brilliant.`, illustrationPrompt: "James in his dragon costume: green scale fabric suit, a magnificent red dragon mask with golden eyes and small horns. He stands backstage, in full costume, looking at his reflection in a mirror. He looks brilliant and knows it." },
      { pageNumber: 8, text: `Then the lights went up and James walked on stage. He could see the WHOLE school in the dark. His legs went very wobbly.`, illustrationPrompt: "James's point of view as he steps onto a brightly lit stage: looking out into a dark hall packed with rows and rows of faces. James's legs (in green dragon suit) are visible and slightly shaky. An overwhelming moment." },
      { pageNumber: 9, text: `He forgot his first line. The hall went silent. Anna was watching from the side. She caught his eye and gave him a thumbs up.`, illustrationPrompt: "James standing on stage, mouth slightly open — he has forgotten the words. Frozen. The audience is a blur of watching faces. At the side of the stage (in the wing), Anna peeks around the curtain, giving a firm thumbs up and a calm, steady look." },
      { pageNumber: 10, text: `James took a deep breath. He thought of his best roar. Then he let it out — the biggest, loudest roar he had ever done.`, illustrationPrompt: "James on stage: head back, mouth fully open, roaring magnificently. His dragon mask pushed up slightly for the roar. Sound waves visible around him in a playful illustration style. His legs are solid again." },
      { pageNumber: 11, text: `The play went brilliantly after that. James roared and stomped and the little ones in the front row screamed and giggled.`, illustrationPrompt: "Stage scene: James in full dragon character, arms raised, stomping across Anna's beautiful backdrop. The front row of small children — Reception age — some covering their eyes in delight, some laughing. Energy and joy." },
      { pageNumber: 12, text: `At the very end, everyone stood and clapped. James and Anna walked to the front of the stage and bowed together.`, illustrationPrompt: "James and Anna side by side at the front of the stage, both bowing — James in dragon costume (mask now pushed up), Anna still with paint on her hands. The audience is on its feet clapping. Spotlight on them both." },
      { pageNumber: 13, text: `Mum and Dad clapped the loudest. Mum had tears. Dad said it was just the bright lights. James and Anna did not believe him.`, illustrationPrompt: "Mum and Dad in the audience — Mum clapping with tears on her cheeks, face radiant. Dad clapping just as hard, but pointing at the stage lights above as if explaining something. James and Anna on stage looking at each other with knowing grins." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "ja-b-08",
    title: "Chips's Play Date",
    bookNumber: 8,
    theme: "pet play date",
    sightWords: ["and", "the", "said", "they", "were", "would", "each", "other"],
    targetPatterns: ["level-b", "longer-sentences", "dialogue", "pet-vocabulary"],
    pages: [
      { pageNumber: 1, text: `Their neighbour Mrs. Chen had a big, bouncy dog called Bella. "Would Chips like a play date?" Mrs. Chen asked one morning.`, illustrationPrompt: "Mrs. Chen at the garden gate with Bella on a lead. Bella is a large bouncy golden dog, tongue out, tail a blur. James and Anna look at each other with delight. Chips, behind them, eyes Bella with great interest." },
      { pageNumber: 2, text: `"Yes!" said James and Anna. They were absolutely sure it would be fine. They were wrong.`, illustrationPrompt: "James and Anna nodding enthusiastically, both giving a confident thumbs up. Behind them, Chips is already trying to eat the gate latch. A subtle hint of what is to come." },
      { pageNumber: 3, text: `James brought Chips into the garden. Anna opened the gate. Bella bounded in like a very large, very furry rocket.`, illustrationPrompt: "Bella mid-leap through the open gate — all four paws off the ground, ears up, tongue out, enormous energy. James has Chips on his rope lead. Chips watches the incoming Bella with calm interest." },
      { pageNumber: 4, text: `Bella ran in circles round and round Chips. Chips watched her. Then Chips decided to chase Bella.`, illustrationPrompt: "Bella a blur of motion circling Chips. Chips stands still, watching. Then — Chips's expression shifts. He turns and starts to chase Bella back. James and Anna watch the reversal with wide eyes." },
      { pageNumber: 5, text: `Bella chased Chips. Chips chased Bella. They ran round and round the garden at an absolutely ridiculous speed.`, illustrationPrompt: "A circular chase: Chips chasing Bella chasing Chips in a wide loop round the garden. Motion lines everywhere. James and Anna stand in the middle, spinning to watch, looking slightly dazed." },
      { pageNumber: 6, text: `Bella crashed into the paddling pool. Water exploded in every direction. James and Anna were completely soaked.`, illustrationPrompt: "Bella hitting the paddling pool at full speed — water erupts in a massive splash-explosion. James and Anna nearby are drenched, mouths open in shock, arms out. Chips is the only dry one." },
      { pageNumber: 7, text: `Chips jumped over the flower bed. Bella jumped after him. Daisies and petals flew in all directions.`, illustrationPrompt: "Chips sailing over a flower bed in a surprisingly athletic leap. Bella right behind him, ears flying, also leaping. Flowers and petals burst outward around them." },
      { pageNumber: 8, text: `Mrs. Chen stood at the garden gate and laughed so hard that she had to sit down on the grass.`, illustrationPrompt: "Mrs. Chen has literally sat down on the grass outside the gate, hand over her mouth, eyes squeezed shut with laughter — helpless. James and Anna look at her from the garden, still dripping." },
      { pageNumber: 9, text: `At last, both Chips and Bella lay down on the lawn side by side, panting. Chips licked Bella's ear. Bella licked Chips's nose.`, illustrationPrompt: "Chips and Bella lying on the lawn, both panting, both completely exhausted. Chips's neck stretches over to lick Bella's ear. Bella's tongue curls up to lick Chips's pink nose. Mutual affection." },
      { pageNumber: 10, text: `"I think they like each other," said Anna. "They are just as bad as each other," said James.`, illustrationPrompt: "James (LEFT) and Anna (RIGHT) looking down at Chips and Bella lying on the grass together. Anna has a warm smile. James has his arms folded, a rueful expression — but also trying not to smile." },
      { pageNumber: 11, text: `Mum brought out two bowls — water for Bella, chopped apple for Chips. Bella drank hers. Chips ate his. Then Chips ate Bella's water too.`, illustrationPrompt: "Mum setting two bowls down on the grass. Bella drinking from the water bowl. Chips eating his apple. Then — Chips has nudged Bella aside and is drinking Bella's water as well. Bella looks confused. Chips looks satisfied." },
      { pageNumber: 12, text: `"CHIPS!" said James and Anna. Chips blinked. Bella wagged her tail. It had been the very best play date.`, illustrationPrompt: "James and Anna pointing at Chips (the water bowl situation). Chips blinks, completely unbothered. Bella sits beside Chips, tail wagging — she had a wonderful time and doesn't mind about the water at all. Mrs. Chen at the gate, still smiling." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "ja-b-09",
    title: "James and Anna's New Bikes",
    bookNumber: 9,
    theme: "learning to ride bikes",
    sightWords: ["and", "the", "said", "they", "could", "both", "where", "again"],
    targetPatterns: ["level-b", "longer-sentences", "dialogue", "action-vocabulary"],
    pages: [
      { pageNumber: 1, text: `For their birthdays, James and Anna each got a new bike. James's was red. Anna's was purple.`, illustrationPrompt: "James and Anna outside with two brand new bikes — a red one for James, a purple one for Anna. Both looking at their bikes with huge excited eyes. Chips sniffs the bikes with interest." },
      { pageNumber: 2, text: `They put on their helmets and walked the bikes outside. James could not wait. Anna checked the brakes first.`, illustrationPrompt: "James already wheeling his red bike eagerly toward the lane, helmet on (green and white stripes). Anna beside her purple bike, carefully squeezing the brakes to test them first. Helmets: James's green-striped, Anna's yellow with a star." },
      { pageNumber: 3, text: `James set off first. He got going — then wobbled — then wobbled more — then crashed softly into the hedge. He was fine. Just surprised.`, illustrationPrompt: "James and his red bike have gently toppled into a garden hedge. James sticks out from the hedge at an angle, arms out, wide eyes, slightly startled but unharmed. The bike's wheels spin slowly in the air." },
      { pageNumber: 4, text: `Anna set off nice and slowly. She did not wobble. She did not crash. She rode all the way to the end of the path and back.`, illustrationPrompt: "Anna on her purple bike, upright, steady, pedalling calmly along the path. Her expression is focused and pleased. James, still extracting himself from the hedge, watches her with wide eyes." },
      { pageNumber: 5, text: `"How did you DO that?" said James. "I kept my eyes on where I wanted to go," said Anna. "Don't look at the ground."`, illustrationPrompt: "James standing beside his bike, looking at Anna in disbelief. Anna stands with her bike, calm, one eyebrow slightly raised, giving him the advice. Patient and clear." },
      { pageNumber: 6, text: `James tried again. Eyes forward. Pedal. Wobble. Wobble. Then — he was doing it! He was really, properly doing it!`, illustrationPrompt: "James on his red bike, moving forward. His expression shifting: concentration → wobble → dawning realisation → pure joy. He is riding! Arms still stiff, but he is doing it!" },
      { pageNumber: 7, text: `By lunchtime, they could both ride all the way down the long lane and back without stopping once.`, illustrationPrompt: "James and Anna side by side on their bikes, riding together down a sunny summer lane. Both confident now, both smiling. Trees and hedges on either side, blue sky above." },
      { pageNumber: 8, text: `Then James tried riding with NO hands. He made it exactly three seconds before heading straight into the same bush.`, illustrationPrompt: "James with both hands raised in the air in triumph — then the exact same hedge from earlier rising into frame. He is about to crash again. His expression: the dawning horror of someone who knows exactly what is about to happen." },
      { pageNumber: 9, text: `Anna sat next to the bush. "Same bush as before," she said. James laughed from somewhere inside it.`, illustrationPrompt: "Anna sitting cross-legged on the grass beside the hedge, holding her purple bike, looking at the bush with one eyebrow raised. James's feet and lower legs are visible sticking out from the hedge again. A hand emerges. He is laughing." },
      { pageNumber: 10, text: `Dad got his old bike out and the three of them went for a long ride down to the duck pond.`, illustrationPrompt: "Dad, James and Anna cycling together along a summer lane — Dad in the middle, James left, Anna right. All three pedalling at a gentle pace. Trees, hedges, blue sky. Chips watches them go from the garden gate." },
      { pageNumber: 11, text: `They ate their sandwiches by the duck pond. Chips waited at home. Chips and bikes were definitely not a good idea.`, illustrationPrompt: "Dad, James and Anna sitting on the grass by the duck pond, sandwiches in hand, the bikes propped against a tree behind them. Ducks on the pond. A peaceful, perfect picnic. Back home: Chips visible in the garden, looking after them wistfully." },
      { pageNumber: 12, text: `On the way home, James and Anna raced. They crossed the gate post at exactly the same time. A perfect tie.`, illustrationPrompt: "James and Anna side by side, both leaning forward on their bikes, racing flat out. They cross a gate post at EXACTLY the same moment — shoulder to shoulder, wheel to wheel, both grinning." },
      { pageNumber: 13, text: `That night their legs ached. But they were both smiling. "Same time tomorrow?" said James. Anna was already asleep.`, illustrationPrompt: "Bedtime: James's bedroom. James and Anna both in sleeping bags/beds, still in their helmets (they fell asleep like that). James turning to ask his question. Anna already completely, peacefully asleep. Their bikes propped against the wall. Warm lamplight." }
    ]
  }),
  createJamesAndAnnaBook({
    id: "ja-b-10",
    title: "James, Anna and Chips go Camping",
    bookNumber: 10,
    theme: "back garden camping",
    sightWords: ["and", "the", "said", "they", "was", "were", "what", "would"],
    targetPatterns: ["level-b", "longer-sentences", "dialogue", "camping-vocabulary"],
    pages: [
      { pageNumber: 1, text: `Dad put up a big green tent in the back garden. "We are going camping!" he said. "Just for one night."`, illustrationPrompt: "Dad wrestling with tent poles in the back garden, a large green tent half-erected around him. James and Anna watch with huge enthusiasm. Chips has already eaten one tent peg." },
      { pageNumber: 2, text: `James and Anna helped bang in the tent pegs and thread the poles through. Chips ate one peg. Then he tried to eat a second.`, illustrationPrompt: "James hammering a tent peg with a mallet, tongue out. Anna threading a pole through the tent fabric. Chips has a tent peg in his mouth, half chewed. His expression: entirely committed to eating it." },
      { pageNumber: 3, text: `They packed their sleeping bags, a torch, a pack of cards, two books and lots of snacks.`, illustrationPrompt: "The tent is now up. James and Anna packing things through the small door — sleeping bags (green for James, purple for Anna), a yellow torch, cards, books, a bag of snacks. Very organised. Very excited." },
      { pageNumber: 4, text: `Chips was coming too. He had his own little blanket and his bell, which jingled every single time he moved.`, illustrationPrompt: "Chips inside the tent, looking very pleased to be included. A small blue blanket has been laid out for him. His bell jingles at the slightest movement. James and Anna squeeze in either side of him." },
      { pageNumber: 5, text: `Dad made a small camp fire in a safe metal dish. They toasted marshmallows on long sticks over the warm flames.`, illustrationPrompt: "The family sitting around a small, contained camp fire in a metal dish. Dad, James and Anna each hold long sticks with marshmallows toasting over the orange flames. Chips sits nearby, eyeing the marshmallow bag." },
      { pageNumber: 6, text: `The marshmallow on Chips's stick got too close to the fire. It caught light. Chips ate the whole thing — stick and all.`, illustrationPrompt: "Chips's marshmallow is on fire at the end of his stick (someone held it for him). Chips is entirely unfazed. He leans forward and eats the burning marshmallow, stick and all, in one go. James and Anna watch with wide eyes." },
      { pageNumber: 7, text: `They played cards in the tent by torchlight. Chips ate two cards before they noticed. The game got harder after that.`, illustrationPrompt: "Inside the tent by torchlight. James, Anna and Chips play cards — the torch lights the scene from the centre. Chips's jaw is working. Two card-shaped items are clearly being chewed. James counts his cards and notices something is wrong." },
      { pageNumber: 8, text: `At midnight, a fox barked in the lane. Chips went very still. James shone the torch outside. Nothing was there.`, illustrationPrompt: "Late at night in the tent. Chips is rigid, ears straight up, yellow eyes wide — on full alert. James holds the torch, its beam pointing out through the unzipped tent door into darkness. Anna watches, wide awake. The garden outside is dark and still." },
      { pageNumber: 9, text: `"What if it comes back?" said James. "Then we will scare it," said Anna. She picked up the air horn Dad had packed.`, illustrationPrompt: "Anna holds a small red air horn, expression completely calm and prepared. James looks at the air horn with a mixture of hope and apprehension. Chips has both ears pinned back — he senses what is coming." },
      { pageNumber: 10, text: `The air horn worked. The fox did not come back. Dad DID come — running from the house in his pyjamas, looking very startled.`, illustrationPrompt: "Dad bursting through the back door in striped pyjamas, hair wild, eyes wide. The tent is visible across the garden. James and Anna peek out of the tent with slightly guilty looks. Chips has his ears flat." },
      { pageNumber: 11, text: `They tried to sleep. Chips leaned on James. James leaned on Anna. Anna leaned on the tent wall. Nobody was quite comfortable.`, illustrationPrompt: "Sleeping bag pileup inside the tent: Chips leaning heavily on James (green sleeping bag). James leaning on Anna (purple sleeping bag). Anna pressed against the tent wall, eye open. All in a slightly squashed chain. Bell still jingling at the lightest movement." },
      { pageNumber: 12, text: `In the morning, dew was on the grass and the birds sang. Chips had eaten a corner of the tent in the night.`, illustrationPrompt: "Morning light through the tent. James and Anna sitting up in sleeping bags, hair ruffled. A triangular hole is visible in the corner of the tent. Chips sits beside it, looking out through the hole at the dewy garden. Morning birds visible through the hole." },
      { pageNumber: 13, text: `"CHIPS!" they said. But the sun was warm and breakfast was good and it had been a perfect camp.`, illustrationPrompt: "James and Anna and Chips outside the tent in the morning garden. Dad has brought a tray of toast and juice. Everyone is sitting on the grass. The tent with its chewed corner stands behind them. All faces warm and happy." },
      { pageNumber: 14, text: `"Next year," said James, "we camp in a real field." "Next year," said Mum from the doorway, "Chips stays home." Chips ate the tent door zip.`, illustrationPrompt: "A perfect final image: Mum stands at the back door, arms folded, delivering her verdict with a dry smile. Dad and the children sit on the grass looking at her. Chips — standing at the tent — is eating the zip off the tent door. His bell jingles with the effort." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-01",
    title: "Aiden and Betty Start Grade 1",
    bookNumber: 1,
    theme: "first day of Grade 1",
    sightWords: ["the", "was", "said", "with", "their", "were", "they", "both"],
    targetPatterns: ["level-c", "longer-sentences", "dialogue", "school-vocabulary"],
    pages: [
      { pageNumber: 1, text: `The summer holidays were over at last. Aiden sat on his bed and stared at his new school bag. Grade 1. The words sounded bigger than they looked.`, illustrationPrompt: "Aiden sitting on his bed, staring at a new school bag on the floor." },
      { pageNumber: 2, text: `Betty was not worried at all. She had already packed her bag twice. "We're going to have proper lessons and proper homework," she said, bouncing on her toes. "Isn't that brilliant?" Aiden wasn't absolutely sure that it was.`, illustrationPrompt: "Betty excited in the hallway with her school bag while Aiden looks uncertain." },
      { pageNumber: 3, text: `Their new classroom was bright and busy, with bookshelves along every wall and a large window that looked out onto the playing field. Their teacher was called Miss Okafor. She had bright yellow glasses and smiled like she really meant it.`, illustrationPrompt: "Aiden and Betty entering a bright classroom with Miss Okafor greeting them." },
      { pageNumber: 4, text: `"In Grade 1," said Miss Okafor, "we will read chapter books, solve number puzzles and begin to understand how the world around us works." Aiden thought that sounded like an awful lot — but he found he was leaning forward slightly without meaning to.`, illustrationPrompt: "Miss Okafor addressing the class while Aiden leans forward with interest." },
      { pageNumber: 5, text: `Everyone had their own desk with a name label. Aiden's said AIDEN in neat blue letters. He ran his finger over it slowly and felt, just slightly, like it might turn out to be all right.`, illustrationPrompt: "Close-up of Aiden tracing the name label on his desk." },
      { pageNumber: 6, text: `The first lesson was handwriting — joined-up letters, which were completely new and seemed designed to be tricky. Aiden's pen slipped and he made a large blot right across the middle of the page. He went very red.`, illustrationPrompt: "Aiden staring at a large ink blot on his handwriting page." },
      { pageNumber: 7, text: `Betty leaned over and showed him her page quietly. Her joined-up writing was also not her best work. "Mine looks like a wonky caterpillar," she whispered. Aiden laughed before he could stop himself, and his face stopped being red.`, illustrationPrompt: "Betty showing Aiden her wonky handwriting while he laughs with relief." },
      { pageNumber: 8, text: `At lunch, they sat together by the window. Aiden opened his lunchbox and found a small folded note from Mum tucked under his sandwich. It said: You've got this, star. He smiled all the way through his apple.`, illustrationPrompt: "Aiden reading Mum's note at lunch beside Betty." },
      { pageNumber: 9, text: `After lunch came Maths. Miss Okafor wrote sums on the board, each one slightly harder than the last. Some of them made Aiden's brain feel stretched in an unfamiliar way. He was discovering that this was not entirely a bad feeling.`, illustrationPrompt: "Aiden concentrating hard during Maths while Miss Okafor writes sums." },
      { pageNumber: 10, text: `Betty answered three questions out loud and got them all right. Aiden raised his hand once, very carefully, and he got his right too. Miss Okafor stuck a gold star beside both their names on the board. Aiden looked at his star for quite a long time.`, illustrationPrompt: "Miss Okafor placing gold stars beside Aiden and Betty's names." },
      { pageNumber: 11, text: `Then there was Science — real Science, with a magnifying glass and a tray of soil and seeds. Aiden forgot to be nervous. He was too busy looking at a woodlouse through the magnifying glass and writing down exactly what he saw.`, illustrationPrompt: "Aiden absorbed in a science activity with a magnifying glass and notebook." },
      { pageNumber: 12, text: `At home time, Mum was waiting at the gate. She crouched down with an expectant look. "Well?" she said. They both started talking at exactly the same moment and didn't stop for ten minutes.`, illustrationPrompt: "Mum at the school gate as Aiden and Betty talk over each other." },
      { pageNumber: 13, text: `"Grade 1 is brilliant," announced Betty, just before bed. "It's actually not that bad," said Aiden, which from Aiden meant exactly the same thing. He turned his light off, closed his eyes, and was asleep before he could think of anything to worry about.`, illustrationPrompt: "Aiden peacefully in bed at night after his first Grade 1 day." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-02",
    title: "Aiden and Betty have a Yard Sale",
    bookNumber: 2,
    theme: "yard sale and choosing what to keep",
    sightWords: ["the", "was", "said", "they", "with", "were", "could", "some"],
    targetPatterns: ["level-c", "dialogue", "money-vocabulary", "problem-solving"],
    pages: [
      { pageNumber: 1, text: `It was the first warm Saturday of spring, and Aiden and Betty stood in the middle of the playroom staring at something that had got entirely out of control. Toys, books, games and puzzles were piled up to the shelves. There was even a foam sword that neither of them remembered buying.`, illustrationPrompt: "Aiden and Betty in a playroom full of toys, books, games, and puzzles." },
      { pageNumber: 2, text: `"We should have a yard sale," said Betty. She said it the way she said all her best ideas — quickly and firmly, as though the idea had already made up its mind. "We could make actual money." Aiden wasn't certain at first, but when she said the word money, he started to listen.`, illustrationPrompt: "Betty announcing the yard sale idea while Aiden starts to listen." },
      { pageNumber: 3, text: `They spent Friday evening sorting everything into three piles: SELL, KEEP and MAYBE. The MAYBE pile kept losing things to SELL, because, as Betty pointed out, they hadn't touched any of them in over a year. By nine o'clock, the MAYBE pile had completely disappeared.`, illustrationPrompt: "Aiden and Betty sorting toys into labelled piles." },
      { pageNumber: 4, text: `Betty made neat round price stickers on square labels, writing each price in her best handwriting. Aiden made the sign for the front gate — YARD SALE: EVERYTHING MUST GO — in six colours, with three exclamation marks, then a fourth one, just to make sure.`, illustrationPrompt: "Betty writing price stickers while Aiden makes a colourful yard sale sign." },
      { pageNumber: 5, text: `On Saturday morning, they dragged two folding tables out to the front path and arranged everything carefully. The old teddies sat in a row at the back and looked slightly sorry for themselves. "They'll go to good homes," said Aiden, mostly to himself, as a form of reassurance.`, illustrationPrompt: "Aiden and Betty arranging yard sale tables on the front path." },
      { pageNumber: 6, text: `Their first customer was Mr Perkins from next door, who was very old and took a very long time about everything. He picked up every single item on the table, turned it over carefully, and put it back. After twenty minutes, he held up one small rubber duck. It cost twenty cents.`, illustrationPrompt: "Mr Perkins slowly examining items at the yard sale." },
      { pageNumber: 7, text: `Then things got busy. Children came from further up the street with their parents. A woman bought a whole crate of craft supplies without looking at any of them. A small boy bought four plastic dinosaurs and a jigsaw puzzle and carried them away in a tight proud bundle. Things were selling faster than Betty could write them down.`, illustrationPrompt: "A busy yard sale with children and parents buying things." },
      { pageNumber: 8, text: `By midday, more than half the table was clear. Betty sat down on the front step and counted the money tin carefully, then counted it again. "Forty-eight dollars and thirty cents," she announced. Aiden let out a long, astonished breath, which was all he could manage.`, illustrationPrompt: "Betty counting the money tin while Aiden looks astonished." },
      { pageNumber: 9, text: `A girl called Rosa arrived late with her grandmother and spent a thoughtful amount of time choosing. She ended up with three books, a snow globe and the foam sword, which she tucked under her arm like a very satisfied general. Aiden watched the sword go and found he didn't mind at all.`, illustrationPrompt: "Rosa choosing books, a snow globe, and the foam sword." },
      { pageNumber: 10, text: `They had set up a lemonade stand beside the sale table — Betty's idea, planned the previous Thursday. Aiden poured from a glass jug. Betty collected the money and kept the queue moving. By one o'clock they had sold every cup and run entirely out of lemons.`, illustrationPrompt: "Aiden and Betty running a lemonade stand beside the yard sale." },
      { pageNumber: 11, text: `"What shall we spend it on?" Betty asked. They sat on the front step with the money tin between them and talked it through the way they talked through important things — slowly and carefully, considering every option.`, illustrationPrompt: "Aiden and Betty sitting on the front step with the money tin." },
      { pageNumber: 12, text: `They agreed on a proper tent for the garden — not a tiny pop-up one but a real one with a porch and a little vent window. Somewhere they could take their books on rainy afternoons and feel like they were somewhere else entirely.`, illustrationPrompt: "Aiden and Betty imagining a proper garden tent for reading." },
      { pageNumber: 13, text: `As Aiden folded up the last table, he found something wedged at the very back — his old stuffed elephant, Nelly, who he had completely forgotten was there. He held her for a long moment. Then he carried her inside and put her on the shelf above his desk. Some things, he decided, were not for selling.`, illustrationPrompt: "Aiden finding his old stuffed elephant Nelly after the yard sale." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-03",
    title: "Aiden and Betty go on Holiday",
    bookNumber: 3,
    theme: "coastal family holiday",
    sightWords: ["the", "was", "said", "they", "were", "with", "there", "their"],
    targetPatterns: ["level-c", "setting-description", "dialogue", "holiday-vocabulary"],
    pages: [
      { pageNumber: 1, text: `The last day of the summer term was also the loudest day of the school year. Aiden and Betty burst through the front door and both shouted "HOLIDAY!" at exactly the same moment, which echoed all the way up the stairs and made the dog next door bark.`, illustrationPrompt: "Aiden and Betty bursting through the front door shouting holiday." },
      { pageNumber: 2, text: `They were going to the coast for a whole week — a small blue cottage right on the clifftop, with a gate in the garden wall that opened straight onto the coastal path. Mum had booked it in January. They had been counting down ever since.`, illustrationPrompt: "A blue clifftop cottage by the coastal path." },
      { pageNumber: 3, text: `The drive took three hours. Betty counted every red car they passed. Aiden read two chapters of his book, fell asleep on his own shoulder, woke up, read another chapter, and then asked "Are we nearly there?" for the fourth time. They were, finally, nearly there.`, illustrationPrompt: "Aiden and Betty in the family car on the long drive to the coast." },
      { pageNumber: 4, text: `The cottage smelled of sea salt and old wood and something warm that Aiden couldn't name. They raced upstairs to choose rooms. There was a small room and a slightly bigger room. They flipped a coin — Aiden got the bigger room, but Betty got the one with the sea view, which meant it was perfectly even.`, illustrationPrompt: "Aiden and Betty choosing bedrooms in the seaside cottage." },
      { pageNumber: 5, text: `The beach was a five-minute walk down a steep sandy path through tall marram grass. When they came over the last dune and the sea appeared — wide and green and going all the way to the horizon — Aiden stopped walking entirely and just looked for a long moment.`, illustrationPrompt: "Aiden and Betty seeing the sea from the dunes." },
      { pageNumber: 6, text: `Aiden spent the whole first morning at a rock pool near the headland. He found three kinds of crab, a sea anemone that closed when you touched it, and a tiny fish he thought might be a blenny. He wrote everything down in his field notebook in careful columns.`, illustrationPrompt: "Aiden studying a rock pool and writing in his field notebook." },
      { pageNumber: 7, text: `Betty was brilliant at boogie boarding from the very first wave. She rode it all the way to shore, fell off, laughed, and waded back in immediately. By the afternoon she was steering around in the foam. Dad tried it once and fell off at once, which everyone found funny, including Dad.`, illustrationPrompt: "Betty boogie boarding while Dad falls off and everyone laughs." },
      { pageNumber: 8, text: `On Wednesday it rained all morning. They played three rounds of Cluedo, drank hot chocolate in large mugs and listened to the rain hammer against the cottage windows. It was, Aiden thought, pressing his mug to his chin, one of the cosiest mornings he could remember.`, illustrationPrompt: "A rainy cottage morning with board games and hot chocolate." },
      { pageNumber: 9, text: `The lighthouse was Dad's idea. It was tall and white and stood on a headland two miles along the coastal path. There were one hundred and forty-seven steps to the top — they counted every single one, out loud, all together, and arrived slightly out of breath but very proud.`, illustrationPrompt: "The family climbing the lighthouse stairs." },
      { pageNumber: 10, text: `The view from the top was unlike anything Aiden had seen. The whole coastline curved away in both directions — bays and headlands, a small fishing village far below, and the sea stretching to the horizon, catching the light like crinkled silver foil.`, illustrationPrompt: "Aiden and Betty looking out from the top of the lighthouse." },
      { pageNumber: 11, text: `On their last evening, they sat on the sea wall with fish and chips wrapped in paper. The chips were crispy and perfectly salty. Aiden told Mum they were the best chips he had ever eaten in his entire life, and Mum said that was the sea air doing it, and she was right.`, illustrationPrompt: "The family eating fish and chips on the sea wall." },
      { pageNumber: 12, text: `Betty found a small smooth white pebble at the shoreline and turned it over and over in her fingers all the way back to the cottage. She was going to put it on her windowsill at home, so she'd always have a piece of the coast — something real from a real day.`, illustrationPrompt: "Betty holding a smooth white pebble at the shoreline." },
      { pageNumber: 13, text: `The drive home felt half as long as the drive there, which Aiden thought was mathematically impossible. When they turned into their street, the house looked completely the same as when they'd left it. Aiden noticed he felt, quietly, like he was a little bit different.`, illustrationPrompt: "Aiden and Betty arriving home after their holiday." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-04",
    title: "Aiden and Betty and Socks",
    bookNumber: 4,
    theme: "meeting Socks the monkey",
    sightWords: ["the", "was", "said", "they", "with", "from", "his", "he"],
    targetPatterns: ["level-c", "animal-care", "dialogue", "character-description"],
    pages: [
      { pageNumber: 1, text: `It was an ordinary Saturday in late August when Uncle Eddie arrived at the door with a travelling bag, a very wide smile, and something small and determined making a noise from inside his coat.`, illustrationPrompt: "Uncle Eddie arriving with a travelling bag and something small in his coat." },
      { pageNumber: 2, text: `Uncle Eddie was Dad's younger brother, and he was a wildlife researcher who had spent the last two years living near a tropical rainforest, studying primates. He had, apparently, brought one with him.`, illustrationPrompt: "Uncle Eddie explaining his wildlife research while Aiden and Betty listen." },
      { pageNumber: 3, text: `Carefully, Uncle Eddie unzipped the carry-case. Inside, curled up like a small comma, was the most compact monkey Aiden had ever seen. He had cream-white fur on his face and chest, darker brown on his back, and small black hands and feet that looked, unmistakably, like he was wearing a pair of extremely neat little socks.`, illustrationPrompt: "Uncle Eddie opening the carry-case to reveal Socks." },
      { pageNumber: 4, text: `"His name is Socks," said Uncle Eddie. "He was orphaned when he was very small, and I've raised him from a baby. He understands a lot of what you say, he copies behaviour, and he is completely tame." He paused just a moment. "He is also, just occasionally, a little bit naughty."`, illustrationPrompt: "Uncle Eddie introducing Socks to the family." },
      { pageNumber: 5, text: `Socks looked at Aiden. Then he looked at Betty. Then he reached out one small black hand, calmly removed Aiden's watch from Aiden's wrist, and put it on his own. He looked at it with great satisfaction. "Charming," said Mum. "Yes," said Uncle Eddie, completely unsurprised.`, illustrationPrompt: "Socks removing Aiden's watch and putting it on himself." },
      { pageNumber: 6, text: `Uncle Eddie explained that he was returning to the rainforest for six months and couldn't bring Socks along this time. He looked at Dad with a hopeful expression. Dad said yes before Mum could say anything at all, which was exactly what Mum had expected him to do.`, illustrationPrompt: "Uncle Eddie asking Dad to care for Socks while Mum reacts." },
      { pageNumber: 7, text: `Socks explored the house in eleven minutes. He opened every drawer he could reach, rearranged the fruit bowl into a different order, sat briefly on each windowsill and posted three letters from the hall table into the back of the television. He seemed very pleased with his work.`, illustrationPrompt: "Socks mischievously exploring and rearranging the house." },
      { pageNumber: 8, text: `"He loves shiny objects," Uncle Eddie explained at dinner. "He adores warm spots — the airing cupboard is a particular risk. And if he gets bored, he will find a way to become interesting." Everyone filed this information away carefully.`, illustrationPrompt: "Uncle Eddie explaining Socks's habits at dinner." },
      { pageNumber: 9, text: `Socks sat at the table in a tiny red waistcoat that Uncle Eddie had stitched for him. He watched everyone use their fork with great attention. Then he picked up his own fork and used it correctly. Then he threw the fork across the room. "He does that every evening," said Uncle Eddie. "We've never understood why."`, illustrationPrompt: "Socks at the dinner table using and then throwing a fork." },
      { pageNumber: 10, text: `That night, Dad built Socks a cosy sleeping box — a wooden crate lined with a soft fleece blanket — and settled it in the warm corner of the kitchen. In the morning, Socks was not in it. He was curled up fast asleep at the foot of Aiden's bed, his small black hand curled around Aiden's pencil torch.`, illustrationPrompt: "Socks asleep at the foot of Aiden's bed with a pencil torch." },
      { pageNumber: 11, text: `Over the following weeks, Socks wove himself into the house. He had his own peg for his waistcoat. He met them at the door when they came home from school. He sat on Dad's shoulder while Dad read the newspaper and turned the pages for him, very seriously.`, illustrationPrompt: "Socks becoming part of family routines at home." },
      { pageNumber: 12, text: `He was also, as promised, occasionally naughty. He dropped a teaspoon into the toaster. He unravelled the entire roll of cling film in the kitchen drawer. He stole every single one of Betty's hair bobbles and lined them up on the windowsill in a precise order that nobody could explain.`, illustrationPrompt: "Socks causing small household mischief with hair bobbles and cling film." },
      { pageNumber: 13, text: `"He is completely impossible," said Mum, as she did most evenings. But she had also started setting a small dish of whatever she was cooking on the corner of the counter every night, because Socks knew exactly where it appeared and waited there very patiently, and she had not been able to bring herself to stop.`, illustrationPrompt: "Mum setting a small dish of food on the counter for Socks." },
      { pageNumber: 14, text: `Aiden had been keeping a field notebook — just as Uncle Eddie had shown him. He had titled it: Socks: A Field Study. He had written things like: Prefers grapes to apple. Expresses disapproval by sitting with back turned. Unusually precise about the order of objects. He turned to a fresh page. It was going to take a very long time to fully understand Socks. He hoped, quietly, that he had the time.`, illustrationPrompt: "Aiden writing careful notes about Socks in his field notebook." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-05",
    title: "Socks Goes Missing",
    bookNumber: 5,
    theme: "finding missing Socks",
    sightWords: ["the", "was", "said", "they", "with", "where", "could", "there"],
    targetPatterns: ["level-c", "mystery", "dialogue", "emotional-arc"],
    pages: [
      { pageNumber: 1, text: `It started with the waistcoat hook being empty.`, illustrationPrompt: "Close-up of the empty hook where Socks's waistcoat usually hangs." },
      { pageNumber: 2, text: `Every morning, Socks sat on the kitchen counter and waited while Betty did up the buttons on his little red waistcoat, which always lived on its own peg beside the back door. But on a Tuesday in October, the peg was empty. And when Aiden went to check, Socks's sleeping box in the corner of his room was empty too.`, illustrationPrompt: "Aiden discovering Socks's sleeping box is empty." },
      { pageNumber: 3, text: `They searched everywhere. Aiden checked under every sofa cushion and behind every bookshelf. Betty methodically looked in every high cupboard. Mum turned the garden upside down. Dad searched the garden again, more systematically, with a torch — even though it was daytime. Socks was not anywhere.`, illustrationPrompt: "The family searching everywhere for Socks." },
      { pageNumber: 4, text: `"He couldn't have got out," said Dad. "All the windows were shut last night." Then Mum remembered the bathroom window — the small one above the bath, left open just a crack for steam. She looked at Aiden and Aiden looked at Betty. A crack that was, they all realised at the same moment, almost exactly the width of a small monkey.`, illustrationPrompt: "The family realising Socks may have escaped through the bathroom window." },
      { pageNumber: 5, text: `They went out onto the pavement and called his name. "Socks! Socks!" The October wind moved through the trees and sent leaves skittering across the path. No small monkey appeared. Aiden put his hands in his pockets and tried not to feel too worried. It didn't work very well.`, illustrationPrompt: "Aiden and Betty calling for Socks on the autumn pavement." },
      { pageNumber: 6, text: `Betty designed a MISSING MONKEY poster on her tablet in under five minutes. It had a photograph of Socks in his waistcoat, a written description, and their phone number in large digits. She printed fourteen copies. They posted them through letter boxes up and down both sides of the street without stopping.`, illustrationPrompt: "Aiden and Betty posting missing monkey flyers." },
      { pageNumber: 7, text: `Aiden re-read his field notebook carefully, looking for anything useful. He had written: Drawn to shiny objects. Drawn to warm spots. Will follow interesting smells. Exceptionally good at getting into places he shouldn't. He stared at that last line for quite a long time. It did not narrow things down.`, illustrationPrompt: "Aiden reading his field notebook on the front step." },
      { pageNumber: 8, text: `By three o'clock, the sky had gone grey and the wind had picked up. Aiden was sitting on the front step, not saying much. He kept thinking about what Uncle Eddie had said once: that animals raised by hand always know where home is. He held onto that thought very carefully.`, illustrationPrompt: "Aiden sitting quietly on the front step, worried about Socks." },
      { pageNumber: 9, text: `Then the phone rang. It was their neighbour Mrs Obi, from number thirty-seven, three houses down. Her voice was very precise. "I believe," she said carefully, "that there may be a small monkey in my kitchen. He appears to be eating my shortbread."`, illustrationPrompt: "Mum answering the phone and realising Socks has been found." },
      { pageNumber: 10, text: `They ran. All four of them, in their socks, without stopping to find shoes, down the pavement to number thirty-seven. They could hear, even from the gate, a small and very determined crunching sound coming from inside.`, illustrationPrompt: "The family running down the street in their socks." },
      { pageNumber: 11, text: `There was Socks, sitting on Mrs Obi's kitchen counter beside an open shortbread tin. He was wearing his waistcoat — which they had also assumed was missing — and had crumbs on his face and the expression of someone who sees absolutely no problem with any of this whatsoever.`, illustrationPrompt: "Socks on Mrs Obi's kitchen counter eating shortbread." },
      { pageNumber: 12, text: `"How on earth did he get in?" asked Dad. Mrs Obi pointed to the cat flap in her back door. Of course. Socks had worked out the cat flap. He had also — from the state of the shortbread tin — clearly been in before, which nobody had known and which explained certain things about Mrs Obi's biscuit situation.`, illustrationPrompt: "Mrs Obi pointing to the cat flap while the family understands." },
      { pageNumber: 13, text: `Aiden picked him up and held him. Socks was warm and solid and smelled faintly of shortbread. He patted Aiden's cheek twice with one small black hand, the way he sometimes did when he felt like being kind, and then tucked his head under Aiden's chin. Aiden breathed out slowly.`, illustrationPrompt: "Aiden holding Socks with quiet relief." },
      { pageNumber: 14, text: `On the way home, Betty said they needed a tracker collar. Aiden said they needed to block every cat flap on the street. Mum said they needed a more interesting biscuit tin. Dad said they should call Uncle Eddie and tell him what his monkey had been up to. They all laughed, and kept laughing, all the way home — and Socks rode on Aiden's shoulder the whole way, looking, as always, entirely pleased with himself.`, illustrationPrompt: "The family walking home laughing with Socks on Aiden's shoulder." }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-06",
    title: "Aiden and Betty and the Science Fair",
    bookNumber: 6,
    theme: "science fair and crystal-growing experiment",
    sightWords: ["the", "was", "said", "they", "with", "because", "every", "their"],
    targetPatterns: ["level-c", "science-vocabulary", "dialogue", "cause-and-effect"],
    pages: [
      { pageNumber: 1, text: `Miss Okafor announced the Science Fair on a grey Wednesday in February. Every pair in Grade 1 would present a project. Aiden had his notebook open before she had finished the sentence.` },
      { pageNumber: 2, text: `"What shall we study?" said Betty. They sat with the notebook between them and listed every idea they had. Aiden had eleven. Betty had nine. Three of them were exactly the same, which Betty said proved they had good scientific minds.` },
      { pageNumber: 3, text: `They decided to grow crystals. It was Betty's original idea and Aiden's second choice, which Betty said made it the obvious answer. They ordered the kit and spent four days watching for the post.` },
      { pageNumber: 4, text: `The crystal-growing worked perfectly. Blue copper sulphate crystals grew on a thread in a jam jar, getting bigger and more geometric every day. Aiden photographed them every morning. Betty kept a careful growth chart.` },
      { pageNumber: 5, text: `Then Socks found the crystal jar. He did not eat it. He simply moved it from the windowsill to a high shelf, where he sat beside it with the expression of someone who had just acquired something important.` },
      { pageNumber: 6, text: `"Socks!" said Aiden and Betty. Socks examined the jar from every angle, turning it slowly. He handed it back eventually — and the crystals were, miraculously, completely intact.` },
      { pageNumber: 7, text: `They made their display board on a rainy Saturday — a bright blue background, a photograph of each day's crystal growth, Betty's data chart, and a title in Aiden's best six-colour lettering: HOW DO CRYSTALS GROW?` },
      { pageNumber: 8, text: `On the morning of the Science Fair, Betty packed the display board in a folder while Aiden carried the crystal jar carefully in both hands. Socks watched from the hallway with what Aiden's notebook called 'intense strategic interest.'` },
      { pageNumber: 9, text: `The school hall was full of projects — a volcano that erupted three times, a model solar system, a survey about favourite foods with real graphs. Betty looked at all of them carefully and said nothing. Aiden chewed the inside of his cheek.` },
      { pageNumber: 10, text: `The judges spent a very long time with Aiden and Betty's crystals — because Betty could explain not just what had happened but why, which turned out to be the whole point of the exercise.` },
      { pageNumber: 11, text: `Third place, with a commendation for experimental method, went to HOW DO CRYSTALS GROW? The commendation was on a proper certificate with a gold border. Betty read every word of it, twice.` },
      { pageNumber: 12, text: `That evening, Aiden added a new page to his field notebook: WHAT MAKES A GOOD EXPERIMENT. He had six points. Socks sat on the desk and watched him write, which Aiden had never seen him do before.` },
      { pageNumber: 13, text: `"I think he might be learning," said Aiden carefully, watching Socks watch the pen. "Don't encourage him," said Betty, from the doorway. Socks blinked once, in a way that suggested he had already learned considerably more than anyone knew.` }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-07",
    title: "Aiden, Betty and Socks's Big Adventure",
    bookNumber: 7,
    theme: "nature reserve adventure with Socks",
    sightWords: ["the", "was", "said", "they", "with", "there", "because", "their"],
    targetPatterns: ["level-c", "nature-vocabulary", "dialogue", "observation"],
    pages: [
      { pageNumber: 1, text: `Uncle Eddie came back for a long weekend in June — browner from the sun, with a new bag of unusual gifts and more stories than they had time to hear. Socks heard the doorbell and ran in circles for forty-five seconds without stopping.` },
      { pageNumber: 2, text: `Uncle Eddie told them about the nature reserve two miles from town — woodland, a river, meadows, a hide for watching birds. "Socks would understand it completely," he said. Mum said she wasn't certain that made it a good idea. They went anyway.` },
      { pageNumber: 3, text: `The reserve was layered with sounds — insects, birds, the river — all at once and all different. Socks sat on Aiden's shoulder and went completely still, his head turning slowly to track each sound. Aiden had never seen him so quiet.` },
      { pageNumber: 4, text: `Betty found the bird hide first — a long wooden structure with narrow slot windows over the reed bed. Inside: a log book, borrowed binoculars, and a board listing twelve species to find. She was immediately in her element.` },
      { pageNumber: 5, text: `Through the binoculars, Betty saw a kingfisher — a bright impossible dart of blue-orange above the water, there and then gone. She had to put the binoculars down and close her eyes for a moment. She had seen it. She wrote it in the log book.` },
      { pageNumber: 6, text: `Socks had other interests. He had crossed a wide fallen tree over the river before anyone had finished the sentence. Aiden said they should follow. Uncle Eddie said absolutely not. Then Uncle Eddie looked at the tree. Then they crossed it.` },
      { pageNumber: 7, text: `The far bank was different — thicker trees, softer ground, a field of tall meadow grass beyond the treeline. Socks bounded ahead, turning back every few steps to make sure they were following.` },
      { pageNumber: 8, text: `He led them to a shallow pool in a mossy clearing — fed by a spring, perfectly clear and still. Two dragonflies skimmed the surface, electric blue. Aiden crouched at the edge and looked in. Small things moved in the shallows. He forgot to breathe.` },
      { pageNumber: 9, text: `Betty wrote down every species she could identify in the hide log book, which she had technically borrowed without permission. Uncle Eddie said they'd bring it back. She wrote in neat columns: dragonflies, water boatmen, a great diving beetle.` },
      { pageNumber: 10, text: `On the way back, the sun was low and the meadow was full of seed heads catching the light. Socks rode on Uncle Eddie's shoulder, which he had always done but which now looked, here, like a kind of homecoming.` },
      { pageNumber: 11, text: `Uncle Eddie left on Sunday evening. He stayed on the doorstep a long time, saying goodbye properly. When the car was gone, Socks sat on the hall windowsill and watched the empty road. Then he came inside and sat on Aiden's lap, which he had never done before. Aiden stayed very still.` },
      { pageNumber: 12, text: `Aiden had started a new notebook that evening — not the Socks field study, but a nature notebook. He had titled it with the date. Betty had started a matching one, without them discussing it. Both were already half a page in.` },
      { pageNumber: 13, text: `"Do you think he misses the rainforest?" Aiden asked one evening. Betty thought for a long time. "I think he's decided this is his rainforest," she said. Aiden looked at Socks on his shoulder. "Yeah," he said. "I think so too."` }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-08",
    title: "Aiden and Betty and the Bully",
    bookNumber: 8,
    theme: "responding to bullying with confidence",
    sightWords: ["the", "was", "said", "they", "with", "because", "always", "about"],
    targetPatterns: ["level-c", "social-emotional", "dialogue", "school-vocabulary"],
    pages: [
      { pageNumber: 1, text: `There was a boy in Year 2 called Marcus who thought it was funny to call people names. He had decided, for reasons that made no sense at all, that Aiden's name was Lazy-den. He said it on Wednesday. Two children laughed, which made him say it again on Thursday.` },
      { pageNumber: 2, text: `Aiden didn't say anything. He went home and sat on his bed and stared at the ceiling. He wasn't crying, but he wasn't fine either. He didn't really want to talk about it — which Betty noticed immediately.` },
      { pageNumber: 3, text: `"What happened?" said Betty. Aiden told her in pieces, looking at the floor. Betty listened to all of it without saying anything. Then she said: "He's wrong. And being wrong loudly is still just being wrong." Aiden thought about that.` },
      { pageNumber: 4, text: `That night, Aiden wrote in his notebook: When something is unfair, you have two choices — pretend it isn't happening, or decide what to do. He starred the second option. He didn't quite know yet what doing something looked like.` },
      { pageNumber: 5, text: `On Friday, Marcus said it again in the lunch queue. Betty was right there. She looked at Marcus with exactly one raised eyebrow and said, clearly: "His name is Aiden. Which you know." Marcus looked surprised. He didn't say anything else.` },
      { pageNumber: 6, text: `Aiden felt two things: grateful for Betty, and also frustrated, because he wanted to have done it himself. Betty, who had been watching him think, said: "Next time you'll do it. I was just practising with you."` },
      { pageNumber: 7, text: `On Monday, Marcus said it one more time, in front of a small group. Aiden turned around. He looked at Marcus directly for a moment. Then he said, clearly: "My name is Aiden." That was all. He turned back.` },
      { pageNumber: 8, text: `It was quiet. Nobody laughed. Marcus said something low, but nobody around him responded. Aiden walked on. His legs were slightly shaky — but he hadn't shown it, and he was extremely proud of himself.` },
      { pageNumber: 9, text: `He wrote in his notebook that evening: Saying a true thing clearly is harder than it looks and better than it sounds. He underlined it twice.` },
      { pageNumber: 10, text: `Betty read it over his shoulder. She didn't comment on it. She put her hand on his shoulder for a moment and went back to her own desk. That was enough.` },
      { pageNumber: 11, text: `A week later, Marcus bumped into Aiden's tray at lunch — accidentally this time, genuinely. He said sorry, just once, with his eyes down. Aiden nodded. He didn't make a big thing of it. Some things, he thought, didn't need to become a story.` },
      { pageNumber: 12, text: `Miss Okafor had noticed, in the way that good teachers always notice. She started a class discussion about what it means to be fair, and what you do when things aren't. Several children looked at the floor. Marcus looked at the window.` },
      { pageNumber: 13, text: `"The point," said Miss Okafor, "is not that everyone will always be kind. The point is that you always have a choice about how to respond — and that choice is completely yours." Aiden wrote it down. It felt like something worth keeping.` }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-09",
    title: "Aiden and Betty: New Teeth",
    bookNumber: 9,
    theme: "losing baby teeth and growing up",
    sightWords: ["the", "was", "said", "they", "with", "there", "because", "through"],
    targetPatterns: ["level-c", "body-vocabulary", "dialogue", "emotional-arc"],
    pages: [
      { pageNumber: 1, text: `It started with a slight wobble. Aiden was eating an apple when he felt, for the first time in his life, that one of his front teeth was moving in a way that front teeth were definitely not supposed to move.` },
      { pageNumber: 2, text: `He told Betty. Betty got the torch and studied it with great interest. "It's definitely loose," she said. "It'll fall out and a permanent one will grow. That's much better, actually." Aiden was not entirely sure that it was.` },
      { pageNumber: 3, text: `That night, Aiden worried about the tooth. It felt wrong — like something was breaking. He wrote in his notebook: Things that are strange: losing a tooth. Also, why teeth? Socks sat on the desk and watched him with great curiosity.` },
      { pageNumber: 4, text: `Mum said it was completely normal and that they had both lost teeth before when they were smaller — Aiden had even eaten one inside a peanut butter sandwich and not noticed for an hour. Aiden was not certain this was reassuring.` },
      { pageNumber: 5, text: `Betty lost her first tooth the very next day, which nobody had seen coming. It came out at lunch, and she held it up and examined it with great interest before putting it in her pocket, as if this were a routine scientific procedure.` },
      { pageNumber: 6, text: `"Does it hurt?" said Aiden. "Not really," said Betty. "It felt strange for a second. Then it was over." She looked at the gap in her mouth in a small mirror. "It's just a tooth," she said. "A very old, very small tooth."` },
      { pageNumber: 7, text: `Aiden's tooth came out on a Thursday. Not dramatically — he was reading his book and he touched it and then it was just there in his fingers, which was very quick and very strange and did not hurt at all.` },
      { pageNumber: 8, text: `He held it up for a long time. It was tiny. It was the smallest thing that had ever felt significant. He put it in the small envelope Mum left for him, and when he placed it under his pillow it felt ceremonial.` },
      { pageNumber: 9, text: `In the morning, the tooth was gone and there was a coin in its place. Aiden knew, in the way children who read a lot know things, that it was Mum or Dad who had swapped it. He said nothing, because some things are better left as stories.` },
      { pageNumber: 10, text: `Three weeks later, the new tooth began to come through. It was enormous relative to the gap — a proper square adult tooth in a mouth that had been full of small rounded baby ones. Aiden looked at himself in the mirror and felt extremely strange.` },
      { pageNumber: 11, text: `"You don't look strange," said Betty. "You look older." She said it the way she said true things — simply, as though it were just a fact. Aiden looked in the mirror again. It was going to take some getting used to.` },
      { pageNumber: 12, text: `Socks was fascinated by both of them through this whole period. He kept trying to look in their mouths. He seemed to find it deeply interesting, which Aiden added to the field notebook under: Primate-specific dental curiosity — possible.` },
      { pageNumber: 13, text: `"I think he'll be disappointed when we stop changing," said Aiden. "He already has all the teeth he'll get," said Betty. Socks demonstrated this by grinning at them both from very close range, showing every single tooth.` }
    ]
  }),
  createAidenAndBettyBook({
    id: "ab-c-10",
    title: "Aiden and Betty and the Castle",
    bookNumber: 10,
    theme: "castle visit and historical thinking",
    sightWords: ["the", "was", "said", "they", "with", "there", "through", "before"],
    targetPatterns: ["level-c", "history-vocabulary", "dialogue", "reflection"],
    pages: [
      { pageNumber: 1, text: `Dad had been talking about the castle trip since January. A proper medieval castle, forty minutes away — with a tower you could actually climb, a dungeon that was a real dungeon, and a great hall whose stone floor had been there for six hundred years. Betty had already read a book about it.` },
      { pageNumber: 2, text: `They drove there on a bright Saturday in April. Aiden pressed his face to the car window when the castle appeared over the hill — grey stone towers above the treeline, impossibly old and very much still there. He felt something he didn't yet have a word for.` },
      { pageNumber: 3, text: `The entrance was a proper drawbridge — working, over a real water-filled moat. It was smaller than he'd imagined and more real than he'd imagined. Aiden crossed it one step at a time, listening to the echo of his footsteps on old wood, thinking about every person who had crossed it before him.` },
      { pageNumber: 4, text: `The great hall was vast and grey and cool. The stone floor was uneven and worn in paths where feet had walked for centuries. Aiden crouched and pressed his hand flat to the floor. Six hundred years of footsteps had passed here. He could not quite hold that thought all at once.` },
      { pageNumber: 5, text: `Betty had the guide map. She navigated with precise efficiency — Great Hall, Armoury, North Tower, King's Chamber, Dungeon — the best order for minimum backtracking. Aiden followed behind her, reading every information board they passed, completely at home in a world of facts.` },
      { pageNumber: 6, text: `In the armoury, there was a full suit of plate armour. It was smaller than Aiden expected. The guide told them that real knights were roughly the same size as Dad, which was very hard to imagine. Aiden tried on a gauntlet under supervision. His hand barely fit inside.` },
      { pageNumber: 7, text: `The dungeon was underground and smelled of cold stone and old air. Betty read every board by torchlight. Aiden stood still in the near-dark for a moment and thought about how this exact place had been here through everything — and felt briefly, appropriately small.` },
      { pageNumber: 8, text: `The North Tower had one hundred and twelve steps. They counted every one, out loud, all together. The staircase was so narrow they had to go single file. At the top: the whole landscape, the river, the town, a motorway miles away. The same view and entirely different.` },
      { pageNumber: 9, text: `"Imagine standing here," said Betty quietly, "and not knowing what was coming." Aiden thought about that for a long time, looking out. There was something important in it he couldn't quite hold yet. He wrote it in his notebook anyway, to think about later.` },
      { pageNumber: 10, text: `On the way down, Aiden stopped at a narrow slit window in the tower wall — an arrow loop. He looked through it. The angle was exact — a perfect line of sight across the approach. Everything in this building was designed for a specific purpose.` },
      { pageNumber: 11, text: `In the castle shop, Betty bought a small accurate model of the castle as it looked in 1350, before a section of wall fell. Aiden bought a book on medieval building techniques. Dad bought a novelty ceramic goblet that Mum said, quietly but firmly, would not be coming into the kitchen.` },
      { pageNumber: 12, text: `The drive home was quiet in the way that follows something large. "What are you thinking about?" said Mum. Aiden and Betty both answered at the same time, with completely different answers. "That," said Mum, "is exactly right."` },
      { pageNumber: 13, text: `That evening, Aiden wrote in his field notebook for a long time — the drawbridge, the worn floor, the arrow loop, the view. At the bottom of the last page he wrote: Things were happening before we got here. They'll keep happening after. That's not sad. That's just how big it is. He underlined it.` }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-01-chompys-big-lunch",
    title: "Chompy's Big Lunch",
    bookNumber: 1,
    theme: "chompy and food",
    pages: [
      { pageNumber: 1, text: "Chompy woke up. I am hungry, said Chompy." },
      { pageNumber: 2, text: "Chompy ate some berries. More, please! said Chompy." },
      { pageNumber: 3, text: "Chompy found some leaves. I am still hungry, said Chompy." },
      { pageNumber: 4, text: "Sunny shared her lunch. Here you go, Chompy! said Sunny." },
      { pageNumber: 5, text: "Chompy ate and ate. More, please! said Chompy." },
      { pageNumber: 6, text: "Chompy's tummy was very big now. I am... still a little hungry, said Chompy." },
      { pageNumber: 7, text: "Oh, Chompy! laughed all the Dino Pals. Chompy laughed too." },
      { pageNumber: 8, text: "That night, Chompy looked at the stars. I wonder what breakfast will be, said Chompy." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-02-sunnys-rainy-day",
    title: "Sunny's Rainy Day",
    bookNumber: 2,
    theme: "rainy day play",
    pages: [
      { pageNumber: 1, text: "It rained in Sunny Hollow. Big dark clouds rolled in." },
      { pageNumber: 2, text: "Oh no! said Grumpy. Oh no! said Dozy, yawning. Oh no! said Wiggly." },
      { pageNumber: 3, text: "Oh YES! said Sunny. More puddles!" },
      { pageNumber: 4, text: "Sunny jumped in the puddles. SPLASH! SPLASH! SPLASH!" },
      { pageNumber: 5, text: "Come in! called Sunny. It is lovely!" },
      { pageNumber: 6, text: "One by one, the Dino Pals joined in." },
      { pageNumber: 7, text: "Hmph, said Grumpy. This is... not terrible." },
      { pageNumber: 8, text: "The sun came back out. See? said Sunny. Every day is a good day!" }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-03-dozy-wont-wake-up",
    title: "Dozy Won't Wake Up",
    bookNumber: 3,
    theme: "waking sleepy Dozy",
    pages: [
      { pageNumber: 1, text: "It was morning in Sunny Hollow. Everyone was up. Everyone except Dozy." },
      { pageNumber: 2, text: "Wake up, Dozy! called Bouncy. Dozy did not wake up." },
      { pageNumber: 3, text: "Wake up, Dozy! called Zippy. Dozy did not wake up." },
      { pageNumber: 4, text: "WAKE UP, DOZY! called Honky. Dozy did not wake up." },
      { pageNumber: 5, text: "We have a problem, said Bossy. We need Dozy for the picnic!" },
      { pageNumber: 6, text: "Chompy had an idea. Chompy found the biggest, yummiest lunch in Sunny Hollow." },
      { pageNumber: 7, text: "Dozy sniffed. Dozy opened one eye. Is that... lunch? said Dozy." },
      { pageNumber: 8, text: "Dozy was up! I was just resting my eyes, said Dozy. Dozy's eyes were already closing again." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-04-grumpy-needs-help",
    title: "Grumpy Needs Help",
    bookNumber: 4,
    theme: "accepting help",
    pages: [
      { pageNumber: 1, text: "Grumpy was stuck. Grumpy's tail was caught under a big rock." },
      { pageNumber: 2, text: "I do NOT need help, said Grumpy." },
      { pageNumber: 3, text: "Can I help? said Sunny. NO, said Grumpy." },
      { pageNumber: 4, text: "Can I help? said Bouncy. NO, said Grumpy. Bouncy bounced anyway." },
      { pageNumber: 5, text: "Can WE help? said all the Dino Pals. NO! said Grumpy." },
      { pageNumber: 6, text: "Grumpy pulled and pulled. Grumpy was still stuck." },
      { pageNumber: 7, text: "Oh, fine, said Grumpy quietly. All the Dino Pals helped together. POP!" },
      { pageNumber: 8, text: "Thank you, said Grumpy. Not that I needed it. But Grumpy was smiling. Just a little." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-05-bossy-makes-a-plan",
    title: "Bossy Makes a Plan",
    bookNumber: 5,
    theme: "planning and teamwork",
    pages: [
      { pageNumber: 1, text: "Listen up! called Bossy. I have a plan!" },
      { pageNumber: 2, text: "Chompy: get berries. Sunny: get leaves. Wiggly: carry things. Dozy: try to stay awake." },
      { pageNumber: 3, text: "Everyone got to work. Chompy ate the berries. Chompy! said Bossy." },
      { pageNumber: 4, text: "Wiggly's tail knocked everything over. Wiggly! said Bossy." },
      { pageNumber: 5, text: "Dozy fell asleep. DOZY! said Bossy." },
      { pageNumber: 6, text: "The plan was a mess. Nobody is doing it right! said Bossy." },
      { pageNumber: 7, text: "Bossy, said Sunny, can we try YOUR way AND our way? They worked together. It worked!" },
      { pageNumber: 8, text: "Hmm, said Bossy. Bossy wrote on the clipboard: New plan: ask nicely." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-06-bouncy-bumps-into-everything",
    title: "Bouncy Bumps Into Everything",
    bookNumber: 6,
    theme: "self-control and movement",
    pages: [
      { pageNumber: 1, text: "Bouncy woke up. Bouncy bounced straight into the cave wall. BONK!" },
      { pageNumber: 2, text: "Bouncy bounced to the waterfall. Bouncy bumped into Fancy. BOING!" },
      { pageNumber: 3, text: "MY SAIL! cried Fancy. Sorry! called Bouncy, already bouncing away." },
      { pageNumber: 4, text: "Bouncy bumped into Wiggly. CRASH! Wiggly knocked over everything. Again." },
      { pageNumber: 5, text: "Bouncy bumped into Sneezy. Sneezy took a HUGE breath in..." },
      { pageNumber: 6, text: "AAAACHOOOO! Leaves, berries, and Bossy's clipboard all blew away." },
      { pageNumber: 7, text: "All the Dino Pals looked at Bouncy. Sorry, said Bouncy, smiling." },
      { pageNumber: 8, text: "Maybe I should bounce in the meadow, said Bouncy. BOING! BOING! BOING!" }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-07-wigglys-messy-day",
    title: "Wiggly's Messy Day",
    bookNumber: 7,
    theme: "messy accidents and acceptance",
    pages: [
      { pageNumber: 1, text: "Wiggly woke up carefully. Today, said Wiggly, I will not knock anything over." },
      { pageNumber: 2, text: "Wiggly walked carefully. Wiggly's tail knocked over Chompy's breakfast. Sorry, Chompy!" },
      { pageNumber: 3, text: "Wiggly walked very carefully. Wiggly's tail knocked Grumpy's favourite rock. Hmph! said Grumpy." },
      { pageNumber: 4, text: "Wiggly walked SO carefully. Wiggly's tail knocked Fancy into the mud puddle. Oh no." },
      { pageNumber: 5, text: "Wiggly sat very, very still. The tail still knocked over three berries and a leaf." },
      { pageNumber: 6, text: "Wiggly felt sad. My tail has a mind of its own, said Wiggly." },
      { pageNumber: 7, text: "I like your tail, said Dozy sleepily. It fans me while I nap. The Dino Pals all agreed." },
      { pageNumber: 8, text: "Wiggly smiled. Current score, said Wiggly. Tail: twelve. Wiggly: also twelve." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-08-zippy-slows-down",
    title: "Zippy Slows Down",
    bookNumber: 8,
    theme: "slowing down to notice",
    pages: [
      { pageNumber: 1, text: "Zippy ran to the waterfall. Zippy ran back. Zippy ran to the meadow. Zippy ran back." },
      { pageNumber: 2, text: "Zippy! called Sunny. Where are you going? I DON'T KNOW! called Zippy, already gone." },
      { pageNumber: 3, text: "Zippy ran so fast that Zippy ran right past the picnic. And the waterfall. And Sunny Hollow." },
      { pageNumber: 4, text: "Zippy stopped. Where was Sunny Hollow? Zippy had never stopped before." },
      { pageNumber: 5, text: "It was very quiet. Zippy looked around. There were flowers. There was a big blue sky." },
      { pageNumber: 6, text: "Oh, said Zippy. This is... nice. Zippy sat down. Zippy had never sat down before." },
      { pageNumber: 7, text: "Sunny found Zippy. I was looking at a flower, said Zippy. I went past it twelve times first." },
      { pageNumber: 8, text: "Zippy walked home. Slowly. It took ages. Zippy loved it." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-09-honkys-inside-voice",
    title: "Honky's Inside Voice",
    bookNumber: 9,
    theme: "voice volume and usefulness",
    pages: [
      { pageNumber: 1, text: "GOOD MORNING SUNNY HOLLOW! called Honky. Every leaf fell off every tree." },
      { pageNumber: 2, text: "Shh! said Grumpy. SORRY! said Honky. More leaves fell." },
      { pageNumber: 3, text: "Honky, said Bossy, you need an inside voice. What is an inside voice? A quiet one. I do not have one of those." },
      { pageNumber: 4, text: "Honky tried very hard to be quiet. Hello, whispered Honky. It still blew Chompy's bib sideways." },
      { pageNumber: 5, text: "Honky felt sad. I am just too loud, said Honky. Sorry. TOOT." },
      { pageNumber: 6, text: "Then a thunderstorm came. Dozy woke up frightened. All the Dino Pals hid." },
      { pageNumber: 7, text: "IT IS OKAY! called Honky. Honky's voice was louder than the thunder. Dozy stopped shaking." },
      { pageNumber: 8, text: "Maybe Honky's voice is very useful after all, said Bossy. THANK YOU! said Honky. Every leaf fell off again." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-10-cheekys-prank-goes-wrong",
    title: "Cheeky's Prank Goes Wrong",
    bookNumber: 10,
    theme: "pranks and consequences",
    pages: [
      { pageNumber: 1, text: "Cheeky had an idea. Cheeky always had ideas. Most of them were pranks." },
      { pageNumber: 2, text: "Cheeky hid in the ferns. Cheeky tied Wiggly's tail to a tree. Hee hee, said Cheeky." },
      { pageNumber: 3, text: "Wiggly walked off. BOING! Wiggly bounced back. My tail is stuck! HEE HEE HEE! said Cheeky." },
      { pageNumber: 4, text: "Next: Cheeky put mud on Fancy's favourite rock. Fancy sat down. OH! cried Fancy." },
      { pageNumber: 5, text: "Cheeky laughed and laughed. But then Cheeky slipped on the same mud. SPLAT!" },
      { pageNumber: 6, text: "Now Cheeky was muddy. The Dino Pals looked at Cheeky. Cheeky looked at the Dino Pals." },
      { pageNumber: 7, text: "Even Cheeky had to laugh. Okay, said Cheeky. That one was funny." },
      { pageNumber: 8, text: "Cheeky helped clean Fancy's rock. Will you do any more pranks? asked Fancy. Maybe just one more, said Cheeky. And winked." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-11-shys-secret-gift",
    title: "Shy's Secret Gift",
    bookNumber: 11,
    theme: "quiet kindness and friendship",
    pages: [
      { pageNumber: 1, text: "Every morning, the Dino Pals found a small gift on the Big Flat Rock. Nobody knew who left them." },
      { pageNumber: 2, text: "One day it was a smooth pebble for Grumpy. Someone knows I like pebbles, said Grumpy, suspicious but pleased." },
      { pageNumber: 3, text: "One day it was a pile of extra berries for Chompy. Someone knows me very well, said Chompy, already eating them." },
      { pageNumber: 4, text: "One day it was a leafy fan for Dozy. This is perfect, said Dozy, already asleep with it." },
      { pageNumber: 5, text: "Who is leaving these gifts? said Bossy. I need to know. It is not on my clipboard." },
      { pageNumber: 6, text: "Bouncy thought it was a ghost. Zippy ran everywhere looking, very fast. Honky called out asking. Every leaf fell off." },
      { pageNumber: 7, text: "Cheeky had a plan. Cheeky would stay up all night to watch. Cheeky fell asleep at midnight." },
      { pageNumber: 8, text: "One morning, Sunny stayed very still and very quiet behind a fern. Sunny waited." },
      { pageNumber: 9, text: "Sunny saw two small eyes behind a rock. And two small pink paws placing a tiny woven grass bracelet on the rock." },
      { pageNumber: 10, text: "Shy! said Sunny, softly. The gifts are from you, aren't they? Shy nodded, going very pink." },
      { pageNumber: 11, text: "They were the best gifts we ever had, said Sunny. Will you come and sit with us? Shy came out. Just a little way. But it was something." },
      { pageNumber: 12, text: "The next morning, eleven gifts were on the Big Flat Rock. One from each Dino Pal. A small pink paw reached out and took them, one by one." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-12-fancys-bad-day",
    title: "Fancy's Bad Day",
    bookNumber: 12,
    theme: "accepting help",
    pages: [
      { pageNumber: 1, text: "Fancy woke up and found something terrible. Fancy's sail was bent. Not a little bent. Very bent." },
      { pageNumber: 2, text: "I cannot leave the cave, said Fancy. Not like this. Fancy sat very still and stared at the cave wall." },
      { pageNumber: 3, text: "Clumsy looked in from a great height. It looks fine to me, said Clumsy. You cannot even see your own feet, said Fancy." },
      { pageNumber: 4, text: "Chompy offered to sit on the sail to flatten it. ABSOLUTELY NOT, said Fancy." },
      { pageNumber: 5, text: "Bouncy offered to bounce on it gently. That is not what gently means, said Fancy." },
      { pageNumber: 6, text: "Dozy offered a pillow. It needs weight, not softness, said Fancy. Dozy went back to sleep." },
      { pageNumber: 7, text: "Honky offered to shout at it until it moved. Everyone agreed this would make things much worse." },
      { pageNumber: 8, text: "What if, said Wiggly carefully, we got it a little wet? Fancy stared. Go on, said Fancy." },
      { pageNumber: 9, text: "Wiggly fetched water from the waterfall very carefully. The tail only knocked over two things. Sorry, said Wiggly." },
      { pageNumber: 10, text: "Wiggly dampened the sail gently and pressed it very softly. Slowly, slowly, it began to straighten." },
      { pageNumber: 11, text: "Fancy looked in the pool. Oh, said Fancy. Oh, that is much better. Fancy looked at Wiggly. Thank you. A real thank you." },
      { pageNumber: 12, text: "The next morning, Fancy left a beautifully woven bracelet outside Wiggly's cave. Wiggly's tail knocked it away at once. Sorry! said Wiggly. It is fine, said Fancy. And meant it." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-13-clumsy-to-the-rescue",
    title: "Clumsy to the Rescue",
    bookNumber: 13,
    theme: "using strengths to help",
    pages: [
      { pageNumber: 1, text: "Has anyone seen my pillow? said Dozy. Dozy had been looking for it all morning. This was serious." },
      { pageNumber: 2, text: "Everyone searched. Bouncy bounced into every corner. Zippy ran everywhere twice. Cheeky looked in all the hiding spots. Nothing." },
      { pageNumber: 3, text: "It could be anywhere, said Bossy, looking at the clipboard. Sunny Hollow is very big." },
      { pageNumber: 4, text: "Not from where I am standing, said Clumsy. Everyone looked up." },
      { pageNumber: 5, text: "Clumsy could see over all the ferns, past the waterfall, all the way to the Long Meadow and beyond." },
      { pageNumber: 6, text: "I can see the mud puddle, said Clumsy. I can see the berry bushes. I can see Chompy at the berry bushes, which is not a surprise." },
      { pageNumber: 7, text: "Can you see the pillow? said Dozy. There was a long pause. Oh, said Clumsy. Yes. It is in the waterfall." },
      { pageNumber: 8, text: "How did it get there? said Grumpy. Everyone looked at Bouncy. I bounced past it, said Bouncy. SORRY." },
      { pageNumber: 9, text: "The pool was too deep to reach in. I cannot see my feet, said Clumsy. I certainly cannot reach the bottom." },
      { pageNumber: 10, text: "I can reach it, said Wiggly. Wiggly stretched the long neck down, down, down. The tail swept three rocks and a berry bush. Sorry. But Wiggly had the pillow." },
      { pageNumber: 11, text: "Dozy hugged the pillow. Thank you, said Dozy. Both of you. Then Dozy fell asleep, right there, on the spot." },
      { pageNumber: 12, text: "We make a good team, said Clumsy. You see the problem. I reach the problem. Exactly, said Clumsy, and accidentally knocked off Wiggly's hat. Sorry." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-14-what-is-flappy",
    title: "What is Flappy?",
    bookNumber: 14,
    theme: "identity and belonging",
    pages: [
      { pageNumber: 1, text: "Flappy woke up and tried to fly. Flappy got three wing-flaps up. Then landed in the mud." },
      { pageNumber: 2, text: "I should be able to fly, said Flappy. I have wings. You are also a dinosaur, said Grumpy. Dinosaurs do not fly." },
      { pageNumber: 3, text: "Bossy flies, said Flappy. Bossy is a Pterodactyl. You are an Archaeopteryx. That is different. How is it different? said Flappy. Grumpy did not actually know." },
      { pageNumber: 4, text: "Flappy asked Sunny. You are wonderful just as you are! said Sunny. But what AM I? said Flappy. Wonderful! said Sunny. Flappy went away still confused." },
      { pageNumber: 5, text: "Flappy tried roaring like the other dinosaurs. A small squawk came out. Some feathers drifted down." },
      { pageNumber: 6, text: "Flappy tried stomping. Flappy's feet were quite small. Nobody noticed." },
      { pageNumber: 7, text: "Flappy tried nesting in a tree. This part actually worked quite well. Flappy was surprised." },
      { pageNumber: 8, text: "Flappy tried eating leaves. Fine. Flappy tried catching insects mid-air. Remarkably good at this. Flappy was more surprised." },
      { pageNumber: 9, text: "Grumpy, said Flappy. Am I a dinosaur or a bird? Grumpy thought for a very long time. You are Flappy, said Grumpy. That is enough." },
      { pageNumber: 10, text: "But dinosaurs do not nest in trees, said Flappy. You do, said Grumpy. And birds do not live in Sunny Hollow with everyone else. You do, said Grumpy." },
      { pageNumber: 11, text: "So I am something new? said Flappy. You are something Flappy, said Grumpy. Which nobody else is." },
      { pageNumber: 12, text: "Flappy went back to the tree. Got three wing-flaps up. Landed neatly on a branch. Sat very high up and looked at all of Sunny Hollow below. Oh, said Flappy quietly. That is quite good actually." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-15-sneezy-and-the-waterfall",
    title: "Sneezy and the Waterfall",
    bookNumber: 15,
    theme: "turning a problem into a strength",
    pages: [
      { pageNumber: 1, text: "One morning, Rainbow Waterfall was not making rainbows. It was not making anything at all. The waterfall had stopped." },
      { pageNumber: 2, text: "The Dino Pals went to look. A huge pile of rocks had fallen in the night and blocked the stream above." },
      { pageNumber: 3, text: "We need to move those rocks, said Bossy. Everyone tried pushing. The rocks did not move at all." },
      { pageNumber: 4, text: "Chompy is strong, said Sunny. Chompy tried. Chompy ate a nearby berry bush instead. Sorry, said Chompy." },
      { pageNumber: 5, text: "Grumpy has a strong tail, said Sunny. Grumpy swung the club tail at the rocks. CLONK. One small rock moved. There were fifty more." },
      { pageNumber: 6, text: "This will take all day, said Grumpy. Hmph. Everyone sat down feeling stuck." },
      { pageNumber: 7, text: "Sneezy had been very quiet. Sneezy could feel something building. High up. In the pollen from the ferns." },
      { pageNumber: 8, text: "Sneezy's nose began to twitch. The Dino Pals turned to look. Oh no, said Bossy. Oh yes, said Wiggly." },
      { pageNumber: 9, text: "Sneezy took a breath in. The biggest breath anyone in Sunny Hollow had ever taken. The ferns bent backwards." },
      { pageNumber: 10, text: "Everyone move back, said Grumpy. They moved back." },
      { pageNumber: 11, text: "AAAAAAACHOOOOOO! The sneeze hit the rocks like a wave. Rocks scattered in every direction. The stream burst free. The waterfall roared back. A rainbow appeared." },
      { pageNumber: 12, text: "Sorry, said Sneezy, dabbing with the handkerchief. Every leaf had fallen off every tree. Do not apologise, said Grumpy. For once, Grumpy was actually smiling." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-16-chompy-and-grumpys-day-out",
    title: "Chompy and Grumpy's Day Out",
    bookNumber: 16,
    theme: "unlikely friendship",
    pages: [
      { pageNumber: 1, text: "I am going to the Long Meadow, said Grumpy. There is a good flat rock there. Peaceful. No one around. Chompy appeared. Can I come? said Chompy. Grumpy closed their eyes. Fine." },
      { pageNumber: 2, text: "They set off. Grumpy walked steadily. Chompy stopped to eat something every thirty steps." },
      { pageNumber: 3, text: "This is a leaf, said Grumpy. I know, said Chompy. It is a good leaf." },
      { pageNumber: 4, text: "This is a pebble, said Grumpy. I am not eating the pebble, said Chompy. Glad to hear it, said Grumpy." },
      { pageNumber: 5, text: "They reached the meadow. Grumpy found the flat rock and sat on it. Chompy found a berry patch immediately." },
      { pageNumber: 6, text: "Grumpy sat. It was the right temperature. The right shape. Grumpy almost smiled." },
      { pageNumber: 7, text: "Then Chompy fell into a ditch. HELP, said Chompy. It was not a deep ditch. But Chompy's arms were very tiny." },
      { pageNumber: 8, text: "Grumpy looked at Chompy in the ditch. Grumpy looked at the perfect flat rock. Grumpy sighed. Hold on." },
      { pageNumber: 9, text: "Grumpy's club tail lowered into the ditch. Chompy grabbed on. Grumpy pulled. Chompy came out covered in mud." },
      { pageNumber: 10, text: "Thank you, said Chompy. Hmph, said Grumpy. They sat on the rock together. Less peaceful with Chompy. But not actually terrible." },
      { pageNumber: 11, text: "This is a good rock, said Chompy. Yes, said Grumpy. Is there anything to eat near it? said Chompy. Grumpy pointed at the berry patch. Chompy went happily." },
      { pageNumber: 12, text: "Grumpy sat on the rock alone. It was peaceful. But after a while, Grumpy called: There is a good-looking bush to your left. Thanks, Grumpy! said Chompy. Grumpy said nothing. But the corner of the mouth went up. Just slightly." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-17-the-sunny-hollow-games",
    title: "The Sunny Hollow Games",
    bookNumber: 17,
    theme: "fair play and celebrating strengths",
    pages: [
      { pageNumber: 1, text: "I have an announcement! called Bossy, megaphone raised. We are having the First Sunny Hollow Games. Tomorrow. Everyone looked at each other." },
      { pageNumber: 2, text: "There would be a running race, a jumping contest, a loudness competition, and a prize for the tidiest corner of the Hollow. More events to be decided, said Bossy. I have a clipboard." },
      { pageNumber: 3, text: "Zippy won the running race before anyone else had started. Does it count if no one saw the finish? asked Bossy. It counts, said Zippy." },
      { pageNumber: 4, text: "Bouncy won the jumping contest. Bouncy also won the unplanned bumping-into-things event, which had not been on the clipboard. Bossy added it." },
      { pageNumber: 5, text: "Honky won the loudness competition. Every leaf fell off every tree. We all knew that would happen, said Grumpy." },
      { pageNumber: 6, text: "Wiggly tried to win the tidiest corner. The tail knocked everything over while tidying. I am giving myself zero points, said Wiggly." },
      { pageNumber: 7, text: "The tidiest corner prize went to Shy. Shy had arranged twelve perfect pebbles behind a rock where nobody could see them. It counts, said Bossy carefully." },
      { pageNumber: 8, text: "Grumpy won the grumpiest face competition that Cheeky invented. Grumpy won immediately. I am not sure that is a compliment, said Grumpy. It absolutely is, said Cheeky." },
      { pageNumber: 9, text: "Dozy slept through most of the events and woke up in time for the picnic. Did I win anything? said Dozy. Most restful competitor, said Bossy. Deserved, said Dozy, and fell asleep again." },
      { pageNumber: 10, text: "Fancy held a Best Sail competition. Fancy was the only one with a sail. Fancy gave themselves first prize. This seems fair, said Fancy." },
      { pageNumber: 11, text: "Sneezy entered the farthest-blast competition. Sneezy's sneeze sent the test leaf all the way to the Long Meadow. The judge had to run to collect the result. Zippy collected it. Obviously." },
      { pageNumber: 12, text: "Who won the Games overall? said Chompy, having eaten most of the prize berries. Everyone won something, said Bossy. That is the point. Even me? said Chompy. Chompy wins: Most Enthusiastic Participant. That is because I ate all the prizes, said Chompy. Yes, said Bossy." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-18-dozys-wonderful-dream",
    title: "Dozy's Wonderful Dream",
    bookNumber: 18,
    theme: "dreams and perspective",
    pages: [
      { pageNumber: 1, text: "One afternoon, Dozy fell asleep in the Long Meadow. This was not unusual. But this time, Dozy did not wake up for a very, very long time." },
      { pageNumber: 2, text: "Dozy has been asleep for three hours, said Bossy. Should we be worried? said Bossy. Dozy looks very peaceful, said Sunny. They watched Dozy sleeping. Dozy was definitely very peaceful." },
      { pageNumber: 3, text: "Inside the dream, Dozy was wide awake. Dozy had never been so awake. Everything was golden and warm and soft." },
      { pageNumber: 4, text: "In the dream, Sunny Hollow was made of clouds. Dozy was walking on clouds. The clouds were warm and soft, which was very agreeable." },
      { pageNumber: 5, text: "Chompy was there, but all the food was made of more clouds. This is disappointing, said Dream Chompy." },
      { pageNumber: 6, text: "Dream Grumpy was grumpy about the clouds. They are too soft. I cannot sit on them properly. Dream Grumpy was exactly the same as real Grumpy." },
      { pageNumber: 7, text: "Dream Bouncy bounced so high that Bouncy went above the clouds and kept going. Everyone watched. Nobody was surprised." },
      { pageNumber: 8, text: "Dozy floated on a cloud past the Rainbow Waterfall. But in the dream, the waterfall was made of warm golden light. Oh, said Dozy. This is very nice." },
      { pageNumber: 9, text: "At the top of Mount Rumble, all the Dino Pals were there. Sitting on the warm peak. Watching all of Sunny Hollow spread out below, tiny and green and perfect." },
      { pageNumber: 10, text: "I can see everything from here, said Dream Dozy. We can always see everything, said Dream Sunny. You just need to be up high enough. Dozy thought about this." },
      { pageNumber: 11, text: "Back in the meadow, Dozy's eyes opened. All the Dino Pals were sitting in a circle, waiting. What was it like? said Sunny." },
      { pageNumber: 12, text: "It was exactly like this, said Dozy, looking at all of them, but cloudier. Dozy's eyes closed again. Wake me for supper." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-19-zippys-race",
    title: "Zippy's Race",
    bookNumber: 19,
    theme: "competition and resilience",
    pages: [
      { pageNumber: 1, text: "A message arrived in Sunny Hollow. Zippy delivered it. It took two seconds. There was going to be a race. A real race. With runners from other valleys." },
      { pageNumber: 2, text: "Zippy will win easily, said Sunny. Obviously, said Bossy. Hmph. Probably, said Grumpy. Zippy went very quiet." },
      { pageNumber: 3, text: "Zippy ran three circuits of Sunny Hollow. Then four. Then five. Then kept going." },
      { pageNumber: 4, text: "Are you practising? said Wiggly. I am thinking, said Zippy. You run to think? I always run. The thinking happens in between." },
      { pageNumber: 5, text: "The race day came. The runners lined up. They were all fast. One was very fast indeed." },
      { pageNumber: 6, text: "BANG. They were off. Zippy was first. Of course. But the very fast runner was close. Very close." },
      { pageNumber: 7, text: "Zippy ran harder. The scarf was flat out behind. Everything was a blur." },
      { pageNumber: 8, text: "Zippy crossed the line first. Just. The second runner arrived a heartbeat later." },
      { pageNumber: 9, text: "The Dino Pals cheered. Honky cheered loudest. Every leaf fell off every tree in the whole valley." },
      { pageNumber: 10, text: "The second runner came over. Good race, they said. You too, said Zippy, breathing hard for the first time ever." },
      { pageNumber: 11, text: "Zippy held the small winner's pebble and looked at it. Zippy, said Sunny, are you all right? I nearly lost, said Zippy." },
      { pageNumber: 12, text: "But you didn't, said Sunny. Zippy ran four more circuits of Sunny Hollow. I know, said Zippy, on the third lap. I just like to make sure." }
    ]
  }),
  createDinoPalsBook({
    id: "dino-pals-20-the-big-storm",
    title: "The Big Storm",
    bookNumber: 20,
    theme: "teamwork and safety",
    pages: [
      { pageNumber: 1, text: "The morning felt strange. The air was heavy and still. Mount Rumble was not puffing its usual heart-shaped rings." },
      { pageNumber: 2, text: "Storm coming, said Grumpy. Big one. Grumpy was almost always right about weather. Everyone believed Grumpy." },
      { pageNumber: 3, text: "We need to get ready, said Bossy. For once, nobody argued. They needed the plan." },
      { pageNumber: 4, text: "Clumsy stood tall and looked out over the whole Hollow. The storm is coming from the east, said Clumsy. The tall ferns are already bending. That gives us time." },
      { pageNumber: 5, text: "Sneezy's nose could smell the rain from far away. Twenty minutes, said Sneezy. Maybe fifteen. Everyone moved faster." },
      { pageNumber: 6, text: "Honky called all the Dino Pals from across the Hollow. One enormous blast. Every leaf fell off. But everyone heard and came running." },
      { pageNumber: 7, text: "Wiggly's long tail swept the Big Flat Rock clear in seconds. Food, supplies, anything that could blow away. Sorry, said Wiggly, sweeping everything. This time everyone was grateful." },
      { pageNumber: 8, text: "Zippy ran back and forth collecting everything needed before anyone could finish asking. Twelve trips in four minutes. Done, said Zippy." },
      { pageNumber: 9, text: "Bouncy bounced up to reach the high branches and secure anything at risk. Only bumped into three things. A new record, said Bouncy." },
      { pageNumber: 10, text: "Shy, who knew every hidden corner of the Fernwood, led everyone to the deepest part of Cozy Cave. Shy knew exactly where it was warmest." },
      { pageNumber: 11, text: "The storm arrived. It was loud and wild. But inside Cozy Cave it was warm. Fifteen Dino Pals, very close together. Even Grumpy did not mind." },
      { pageNumber: 12, text: "When it passed, Sunny Hollow sparkled. We did that, said Sunny. All of us. Not bad, said Grumpy. From Grumpy, that meant wonderful." }
    ]
  }),
  ...meadowPalsBookData.map(createMeadowPalsBook),
  ...moonwoodTalesBooks
];
