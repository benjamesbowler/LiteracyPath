const wordAudio = word => `/audio/child-mode/words/${word.toLowerCase().replace(/[^a-z0-9'-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

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

const pagePath = (bookNumber, pageNumber) =>
  `/guided-reading/series/bob-and-nan/book-${String(bookNumber).padStart(2, "0")}/page-${String(pageNumber).padStart(3, "0")}.webp`;

const coverPath = bookNumber =>
  `/guided-reading/series/bob-and-nan/book-${String(bookNumber).padStart(2, "0")}/cover.webp`;

const createPage = ({ bookNumber, pageNumber, text, illustrationPrompt }) => ({
  pageNumber,
  text: normalizeReadingText(text),
  image: pagePath(bookNumber, pageNumber),
  pageAudio: null,
  words: words(text),
  illustrationPrompt,
  qaStatus: "needs_review",
  qaNotes: "Imported from the Bob and Nan Level A pack; needs text-picture QA before student release.",
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
  status: "teacher_preview",
  qaStatus: "needs_review",
  qaNotes: "Teacher preview only until every page image is confirmed to match the text.",
  active: false,
  teacherPreviewOnly: true,
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
  })
];
