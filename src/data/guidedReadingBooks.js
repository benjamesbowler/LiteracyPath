import { guidedReadingRegenBooks } from "./guidedReadingRegenBooks.js";
import { guidedReadingSeriesBooks } from "./guidedReadingSeriesBooks.js";
import { guidedStoryBooks } from "./guidedStoryBooks.js";
import { firstFactsLevelABooks } from "./firstFactsLevelABooks.js";
import { firstFactsLevelCBooks } from "./firstFactsLevelCBooks.js";
import { enrichGuidedReadingBook } from "../utils/guidedReading/phonicsPageAnalyzer.js";

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

const countReadingWords = text =>
  normalizeReadingText(text)
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

const countReadingSentences = text => (normalizeReadingText(text).match(/[.!?]+/g) || []).length;

function getHonestGuidedReadingLevel(book) {
  const pages = (book.pages || []).filter(page => page.active !== false && page.qaStatus === "approved");
  const originalLevel = String(book.level || "").toUpperCase();
  if (!["C", "D", "E", "F"].includes(originalLevel) || !pages.length) return originalLevel;

  const averageWordsPerPage = pages.reduce((sum, page) => sum + countReadingWords(page.text), 0) / pages.length;
  const oneSentencePageCount = pages.filter(page => countReadingSentences(page.text) <= 1).length;
  const mostlyOneSentence = oneSentencePageCount / pages.length >= 0.6;

  if (mostlyOneSentence || averageWordsPerPage < 12) return "B";
  return originalLevel;
}

function relevelGuidedReadingBook(book) {
  const originalLevel = String(book.level || "").toUpperCase();
  const honestLevel = getHonestGuidedReadingLevel(book);
  if (honestLevel === originalLevel) return book;

  return {
    ...book,
    originalLevel,
    level: honestLevel,
    relevelReason: `Reclassified from Level ${originalLevel} to Level ${honestLevel}: active pages average below Level C-F text length and are mostly one sentence per page.`
  };
}

const rawGuidedReadingBooks = [
  {
    "id": "gr-a-26",
    "title": "What Is a Map?",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "map",
      "road",
      "park"
    ],
    "theme": "maps show places",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-26-cover.png",
    "pages": [
      {
        "text": "A map shows a place.",
        "image": "/guided-reading/pages/gr-a-26-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-26-page-1.mp3",
        "highFrequencyWords": [
          "A",
          "shows",
          "a"
        ],
        "decodableWords": [
          "map",
          "place"
        ]
      },
      {
        "text": "This map shows a park.",
        "image": "/guided-reading/pages/gr-a-26-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-26-page-2.mp3",
        "highFrequencyWords": [
          "This",
          "shows",
          "a"
        ],
        "decodableWords": [
          "map",
          "park"
        ]
      },
      {
        "text": "The park has a road.",
        "image": "/guided-reading/pages/gr-a-26-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-26-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "a"
        ],
        "decodableWords": [
          "park",
          "road"
        ]
      },
      {
        "text": "The road has a path.",
        "image": "/guided-reading/pages/gr-a-26-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-26-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "a"
        ],
        "decodableWords": [
          "road",
          "path"
        ]
      },
      {
        "text": "The path has a pond.",
        "image": "/guided-reading/pages/gr-a-26-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-26-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "a"
        ],
        "decodableWords": [
          "path",
          "pond"
        ]
      },
      {
        "text": "A map helps you see a place!",
        "image": "/guided-reading/pages/gr-a-26-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-26-page-6.mp3",
        "highFrequencyWords": [
          "A",
          "helps",
          "you",
          "see",
          "a"
        ],
        "decodableWords": [
          "map",
          "place"
        ]
      }
    ]
  },
  {
    "id": "gr-a-27",
    "title": "Day and Night",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "sun",
      "moon",
      "sky"
    ],
    "theme": "basic day/night cycle",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-27-cover.png",
    "pages": [
      {
        "text": "The sun is in the sky.",
        "image": "/guided-reading/pages/gr-a-27-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-27-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "in",
          "the"
        ],
        "decodableWords": [
          "sun",
          "sky"
        ]
      },
      {
        "text": "It is day.",
        "image": "/guided-reading/pages/gr-a-27-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-27-page-2.mp3",
        "highFrequencyWords": [
          "It",
          "is"
        ],
        "decodableWords": [
          "day"
        ]
      },
      {
        "text": "The sun goes down.",
        "image": "/guided-reading/pages/gr-a-27-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-27-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "goes",
          "down"
        ],
        "decodableWords": [
          "sun"
        ]
      },
      {
        "text": "The moon is in the sky.",
        "image": "/guided-reading/pages/gr-a-27-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-27-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "in",
          "the"
        ],
        "decodableWords": [
          "moon",
          "sky"
        ]
      },
      {
        "text": "It is night.",
        "image": "/guided-reading/pages/gr-a-27-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-27-page-5.mp3",
        "highFrequencyWords": [
          "It",
          "is"
        ],
        "decodableWords": [
          "night"
        ]
      },
      {
        "text": "Day and night go round and round!",
        "image": "/guided-reading/pages/gr-a-27-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-27-page-6.mp3",
        "highFrequencyWords": [
          "and",
          "go",
          "round"
        ],
        "decodableWords": [
          "Day",
          "night"
        ]
      }
    ]
  },
  {
    "id": "gr-a-28",
    "title": "How Rain Helps",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "rain",
      "plant",
      "grow"
    ],
    "theme": "rain supports plants",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-28-cover.png",
    "pages": [
      {
        "text": "Rain comes down from the sky.",
        "image": "/guided-reading/pages/gr-a-28-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-28-page-1.mp3",
        "highFrequencyWords": [
          "down",
          "from",
          "the"
        ],
        "decodableWords": [
          "Rain",
          "comes",
          "sky"
        ]
      },
      {
        "text": "Rain helps the plants.",
        "image": "/guided-reading/pages/gr-a-28-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-28-page-2.mp3",
        "highFrequencyWords": [
          "helps",
          "the"
        ],
        "decodableWords": [
          "Rain",
          "plants"
        ]
      },
      {
        "text": "The plants get a drink.",
        "image": "/guided-reading/pages/gr-a-28-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-28-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "get",
          "a",
          "drink"
        ],
        "decodableWords": [
          "plants"
        ]
      },
      {
        "text": "The plants grow up.",
        "image": "/guided-reading/pages/gr-a-28-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-28-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "grow",
          "up"
        ],
        "decodableWords": [
          "plants"
        ]
      },
      {
        "text": "The sun helps the plants too.",
        "image": "/guided-reading/pages/gr-a-28-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-28-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "helps",
          "too"
        ],
        "decodableWords": [
          "sun",
          "plants"
        ]
      },
      {
        "text": "Rain and sun help plants grow!",
        "image": "/guided-reading/pages/gr-a-28-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-28-page-6.mp3",
        "highFrequencyWords": [
          "and",
          "help",
          "grow"
        ],
        "decodableWords": [
          "Rain",
          "sun",
          "plants"
        ]
      }
    ]
  },
  {
    "id": "gr-a-29",
    "title": "Animal Homes",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "nest",
      "den",
      "pond"
    ],
    "theme": "animals need safe homes",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-29-cover.png",
    "pages": [
      {
        "text": "Animals need homes.",
        "image": "/guided-reading/pages/gr-a-29-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-29-page-1.mp3",
        "highFrequencyWords": [
          "need"
        ],
        "decodableWords": [
          "Animals",
          "homes"
        ]
      },
      {
        "text": "A bird has a nest in a tree.",
        "image": "/guided-reading/pages/gr-a-29-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-29-page-2.mp3",
        "highFrequencyWords": [
          "A",
          "has",
          "in",
          "a"
        ],
        "decodableWords": [
          "bird",
          "nest",
          "tree"
        ]
      },
      {
        "text": "A fox has a den in a hill.",
        "image": "/guided-reading/pages/gr-a-29-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-29-page-3.mp3",
        "highFrequencyWords": [
          "A",
          "has",
          "in",
          "a"
        ],
        "decodableWords": [
          "fox",
          "den",
          "hill"
        ]
      },
      {
        "text": "A fish has a pond.",
        "image": "/guided-reading/pages/gr-a-29-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-29-page-4.mp3",
        "highFrequencyWords": [
          "A",
          "has",
          "a"
        ],
        "decodableWords": [
          "fish",
          "pond"
        ]
      },
      {
        "text": "A bug has a log.",
        "image": "/guided-reading/pages/gr-a-29-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-29-page-5.mp3",
        "highFrequencyWords": [
          "A",
          "has",
          "a"
        ],
        "decodableWords": [
          "bug",
          "log"
        ]
      },
      {
        "text": "Each animal has a safe home!",
        "image": "/guided-reading/pages/gr-a-29-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-29-page-6.mp3",
        "highFrequencyWords": [
          "Each",
          "has",
          "a",
          "safe"
        ],
        "decodableWords": [
          "animal",
          "home"
        ]
      }
    ]
  },
  {
    "id": "gr-a-30",
    "title": "We Take Care of Books",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "book",
      "page",
      "shelf"
    ],
    "theme": "book care routines",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-30-cover.png",
    "pages": [
      {
        "text": "Books are for us.",
        "image": "/guided-reading/pages/gr-a-30-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-30-page-1.mp3",
        "highFrequencyWords": [
          "are",
          "for",
          "us"
        ],
        "decodableWords": [
          "Books"
        ]
      },
      {
        "text": "We turn the pages with care.",
        "image": "/guided-reading/pages/gr-a-30-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-30-page-2.mp3",
        "highFrequencyWords": [
          "We",
          "turn",
          "the",
          "with",
          "care"
        ],
        "decodableWords": [
          "pages"
        ]
      },
      {
        "text": "We keep books dry.",
        "image": "/guided-reading/pages/gr-a-30-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-30-page-3.mp3",
        "highFrequencyWords": [
          "We",
          "keep",
          "dry"
        ],
        "decodableWords": [
          "books"
        ]
      },
      {
        "text": "We put books on the shelf.",
        "image": "/guided-reading/pages/gr-a-30-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-30-page-4.mp3",
        "highFrequencyWords": [
          "We",
          "put",
          "on",
          "the"
        ],
        "decodableWords": [
          "books",
          "shelf"
        ]
      },
      {
        "text": "We share books with friends.",
        "image": "/guided-reading/pages/gr-a-30-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-30-page-5.mp3",
        "highFrequencyWords": [
          "We",
          "share",
          "with"
        ],
        "decodableWords": [
          "books",
          "friends"
        ]
      },
      {
        "text": "We love our books!",
        "image": "/guided-reading/pages/gr-a-30-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-30-page-6.mp3",
        "highFrequencyWords": [
          "We",
          "love",
          "our"
        ],
        "decodableWords": [
          "books"
        ]
      }
    ]
  },
  {
    "id": "gr-b-31",
    "title": "How Seeds Become Plants",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "science vocabulary",
      "sequence words",
      "short vowels"
    ],
    "theme": "plant life cycle",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-31-cover.png",
    "pages": [
      {
        "text": "A seed is small. But it has a big job.",
        "image": "/guided-reading/pages/gr-b-31-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-31-page-1.mp3",
        "highFrequencyWords": [
          "A",
          "is",
          "small",
          "But",
          "it",
          "has",
          "a",
          "big"
        ],
        "decodableWords": [
          "seed",
          "job"
        ]
      },
      {
        "text": "The seed sits in soil. It drinks up water.",
        "image": "/guided-reading/pages/gr-b-31-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-31-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "in",
          "It",
          "up",
          "water"
        ],
        "decodableWords": [
          "seed",
          "sits",
          "soil",
          "drinks"
        ]
      },
      {
        "text": "A root pops out. It digs deep down.",
        "image": "/guided-reading/pages/gr-b-31-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-31-page-3.mp3",
        "highFrequencyWords": [
          "out",
          "It",
          "down"
        ],
        "decodableWords": [
          "root",
          "pops",
          "digs",
          "deep"
        ]
      },
      {
        "text": "A stem reaches up. A leaf opens wide.",
        "image": "/guided-reading/pages/gr-b-31-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-31-page-4.mp3",
        "highFrequencyWords": [
          "up",
          "A"
        ],
        "decodableWords": [
          "stem",
          "reaches",
          "leaf",
          "opens",
          "wide"
        ]
      },
      {
        "text": "The sun gives the plant food. It grows tall.",
        "image": "/guided-reading/pages/gr-b-31-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-31-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "sun",
          "gives",
          "the",
          "food",
          "It",
          "tall"
        ],
        "decodableWords": [
          "plant",
          "grows"
        ]
      },
      {
        "text": "A tiny seed can become a huge plant. Nature is amazing!",
        "image": "/guided-reading/pages/gr-b-31-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-31-page-6.mp3",
        "highFrequencyWords": [
          "A",
          "can",
          "become",
          "a",
          "is",
          "amazing"
        ],
        "decodableWords": [
          "tiny",
          "seed",
          "huge",
          "plant",
          "Nature"
        ]
      }
    ]
  },
  {
    "id": "gr-b-32",
    "title": "Why Bees Visit Flowers",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "science concepts",
      "pollination intro",
      "simple cause-effect"
    ],
    "theme": "pollination and nature's partnerships",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-32-cover.png",
    "pages": [
      {
        "text": "Bees buzz from flower to flower. They are not just playing.",
        "image": "/guided-reading/pages/gr-b-32-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-32-page-1.mp3",
        "highFrequencyWords": [
          "from",
          "to",
          "They",
          "are",
          "not",
          "just",
          "playing"
        ],
        "decodableWords": [
          "Bees",
          "buzz",
          "flower",
          "flower"
        ]
      },
      {
        "text": "A flower has sweet nectar inside. The bee wants a sip.",
        "image": "/guided-reading/pages/gr-b-32-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-32-page-2.mp3",
        "highFrequencyWords": [
          "A",
          "has",
          "nectar",
          "inside",
          "The",
          "wants",
          "a"
        ],
        "decodableWords": [
          "flower",
          "sweet",
          "bee",
          "sip"
        ]
      },
      {
        "text": "The bee lands on a petal. Dust sticks to its legs.",
        "image": "/guided-reading/pages/gr-b-32-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-32-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "on",
          "a",
          "its"
        ],
        "decodableWords": [
          "bee",
          "lands",
          "petal",
          "Dust",
          "sticks",
          "legs"
        ]
      },
      {
        "text": "That dust is pollen. It helps plants make seeds.",
        "image": "/guided-reading/pages/gr-b-32-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-32-page-4.mp3",
        "highFrequencyWords": [
          "That",
          "is",
          "helps",
          "plants",
          "make",
          "seeds"
        ],
        "decodableWords": [
          "dust",
          "pollen"
        ]
      },
      {
        "text": "The bee flies to the next bloom. Pollen drops off.",
        "image": "/guided-reading/pages/gr-b-32-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-32-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "to",
          "the",
          "next",
          "off"
        ],
        "decodableWords": [
          "bee",
          "flies",
          "bloom",
          "Pollen",
          "drops"
        ]
      },
      {
        "text": "Bees get food. Flowers get help. They need each other!",
        "image": "/guided-reading/pages/gr-b-32-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-32-page-6.mp3",
        "highFrequencyWords": [
          "get",
          "food",
          "get",
          "help",
          "They",
          "need",
          "each",
          "other"
        ],
        "decodableWords": [
          "Bees",
          "Flowers"
        ]
      }
    ]
  },
  {
    "id": "gr-b-33",
    "title": "What Makes Shadows?",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "light and shadow science",
      "question-answer format"
    ],
    "theme": "physics of light and shadows",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-33-cover.png",
    "pages": [
      {
        "text": "Look at your shadow! It moves when you move.",
        "image": "/guided-reading/pages/gr-b-33-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-33-page-1.mp3",
        "highFrequencyWords": [
          "at",
          "your",
          "It",
          "when",
          "you",
          "move"
        ],
        "decodableWords": [
          "Look",
          "shadow",
          "moves"
        ]
      },
      {
        "text": "A shadow needs light. It also needs something solid.",
        "image": "/guided-reading/pages/gr-b-33-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-33-page-2.mp3",
        "highFrequencyWords": [
          "A",
          "needs",
          "light",
          "It",
          "also",
          "needs",
          "something"
        ],
        "decodableWords": [
          "shadow",
          "solid"
        ]
      },
      {
        "text": "When light hits you, it stops. It cannot pass through.",
        "image": "/guided-reading/pages/gr-b-33-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-33-page-3.mp3",
        "highFrequencyWords": [
          "When",
          "light",
          "it",
          "stops",
          "It",
          "cannot",
          "pass",
          "through"
        ],
        "decodableWords": [
          "hits"
        ]
      },
      {
        "text": "The dark spot behind you is the shadow.",
        "image": "/guided-reading/pages/gr-b-33-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-33-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "dark",
          "spot",
          "behind",
          "you",
          "is",
          "the"
        ],
        "decodableWords": [
          "shadow"
        ]
      },
      {
        "text": "A big object makes a big shadow. A small object makes a small one.",
        "image": "/guided-reading/pages/gr-b-33-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-33-page-5.mp3",
        "highFrequencyWords": [
          "A",
          "makes",
          "a",
          "A",
          "makes",
          "a",
          "one"
        ],
        "decodableWords": [
          "big",
          "object",
          "big",
          "shadow",
          "small",
          "object",
          "small"
        ]
      },
      {
        "text": "Try it! Stand in the sun. Watch your shadow dance.",
        "image": "/guided-reading/pages/gr-b-33-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-33-page-6.mp3",
        "highFrequencyWords": [
          "in",
          "the",
          "sun",
          "Watch",
          "your"
        ],
        "decodableWords": [
          "Stand",
          "shadow",
          "dance"
        ]
      }
    ]
  },
  {
    "id": "gr-b-34",
    "title": "How Bread Is Made",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "sequence and process",
      "food science vocabulary"
    ],
    "theme": "from wheat to bread",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-34-cover.png",
    "pages": [
      {
        "text": "Bread starts as a tiny seed. The seed is wheat.",
        "image": "/guided-reading/pages/gr-b-34-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-34-page-1.mp3",
        "highFrequencyWords": [
          "as",
          "a",
          "The",
          "is"
        ],
        "decodableWords": [
          "Bread",
          "starts",
          "tiny",
          "seed",
          "seed",
          "wheat"
        ]
      },
      {
        "text": "Farmers plant wheat in fields. The sun and rain help it grow.",
        "image": "/guided-reading/pages/gr-b-34-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-34-page-2.mp3",
        "highFrequencyWords": [
          "in",
          "The",
          "and",
          "help",
          "it",
          "grow"
        ],
        "decodableWords": [
          "Farmers",
          "plant",
          "wheat",
          "fields",
          "sun",
          "rain"
        ]
      },
      {
        "text": "When wheat is dry, it turns to grain. Mills grind the grain into flour.",
        "image": "/guided-reading/pages/gr-b-34-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-34-page-3.mp3",
        "highFrequencyWords": [
          "When",
          "is",
          "dry",
          "it",
          "turns",
          "to",
          "grain",
          "grind",
          "the",
          "into"
        ],
        "decodableWords": [
          "wheat",
          "Mills",
          "grain",
          "flour"
        ]
      },
      {
        "text": "Bakers mix flour with water and yeast. The dough gets soft and puffy.",
        "image": "/guided-reading/pages/gr-b-34-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-34-page-4.mp3",
        "highFrequencyWords": [
          "with",
          "and",
          "The",
          "gets",
          "soft",
          "and"
        ],
        "decodableWords": [
          "Bakers",
          "mix",
          "flour",
          "water",
          "yeast",
          "dough",
          "puffy"
        ]
      },
      {
        "text": "They bake the dough in a hot oven. The smell fills the room!",
        "image": "/guided-reading/pages/gr-b-34-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-34-page-5.mp3",
        "highFrequencyWords": [
          "the",
          "in",
          "a",
          "hot",
          "oven",
          "The",
          "smell",
          "fills",
          "the",
          "room"
        ],
        "decodableWords": [
          "They",
          "bake",
          "dough"
        ]
      },
      {
        "text": "From seed to loaf, many hands help. Bread is a team effort!",
        "image": "/guided-reading/pages/gr-b-34-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-34-page-6.mp3",
        "highFrequencyWords": [
          "From",
          "to",
          "many",
          "hands",
          "help",
          "is",
          "a",
          "team",
          "effort"
        ],
        "decodableWords": [
          "seed",
          "loaf",
          "Bread"
        ]
      }
    ]
  },
  {
    "id": "gr-b-35",
    "title": "Big Machines at Work",
    "type": "nonfiction",
    "level": "B",
    "targetSkills": [
      "machine vocabulary",
      "descriptive features",
      "action words"
    ],
    "theme": "construction vehicles and their jobs",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-35-cover.png",
    "pages": [
      {
        "text": "Look at the big machines! Each one has a special job.",
        "image": "/guided-reading/pages/gr-b-35-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-35-page-1.mp3",
        "highFrequencyWords": [
          "at",
          "the",
          "big",
          "Each",
          "one",
          "has",
          "a",
          "special",
          "job"
        ],
        "decodableWords": [
          "Look",
          "machines"
        ]
      },
      {
        "text": "The bulldozer pushes piles of dirt. It clears the land.",
        "image": "/guided-reading/pages/gr-b-35-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-35-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "pushes",
          "piles",
          "of",
          "dirt",
          "It",
          "clears",
          "the"
        ],
        "decodableWords": [
          "bulldozer",
          "land"
        ]
      },
      {
        "text": "The crane lifts steel beams up high. It builds towers.",
        "image": "/guided-reading/pages/gr-b-35-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-35-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "up",
          "high",
          "It",
          "builds"
        ],
        "decodableWords": [
          "crane",
          "lifts",
          "steel",
          "beams",
          "towers"
        ]
      },
      {
        "text": "The dump truck hauls rocks and sand. Its bed tips way back.",
        "image": "/guided-reading/pages/gr-b-35-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-35-page-4.mp3",
        "highFrequencyWords": [
          "and",
          "Its",
          "bed",
          "tips",
          "way",
          "back"
        ],
        "decodableWords": [
          "dump",
          "truck",
          "hauls",
          "rocks",
          "sand"
        ]
      },
      {
        "text": "The cement mixer spins and spins. It keeps concrete smooth.",
        "image": "/guided-reading/pages/gr-b-35-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-35-page-5.mp3",
        "highFrequencyWords": [
          "and",
          "keeps",
          "smooth"
        ],
        "decodableWords": [
          "cement",
          "mixer",
          "spins",
          "spins",
          "concrete"
        ]
      },
      {
        "text": "Big machines work hard. They help build our roads and homes!",
        "image": "/guided-reading/pages/gr-b-35-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-35-page-6.mp3",
        "highFrequencyWords": [
          "work",
          "hard",
          "They",
          "help",
          "build",
          "our",
          "roads",
          "and",
          "homes"
        ],
        "decodableWords": [
          "Big",
          "machines"
        ]
      }
    ]
  },
  {
    "id": "gr-c-37",
    "title": "How We Use Water",
    "type": "nonfiction",
    "level": "C",
    "targetSkills": [
      "everyday science",
      "conservation awareness",
      "descriptive language"
    ],
    "theme": "water in our daily lives",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-37-cover.png",
    "pages": [
      {
        "text": "Water is everywhere. It is in our lakes, sinks, and bodies.",
        "image": "/guided-reading/pages/gr-c-37-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-37-page-1.mp3",
        "highFrequencyWords": [
          "is",
          "everywhere",
          "It",
          "is",
          "in",
          "our",
          "and"
        ],
        "decodableWords": [
          "Water",
          "lakes",
          "sinks",
          "bodies"
        ]
      },
      {
        "text": "We drink water to stay healthy. It keeps our skin clear.",
        "image": "/guided-reading/pages/gr-c-37-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-37-page-2.mp3",
        "highFrequencyWords": [
          "We",
          "water",
          "to",
          "stay",
          "healthy",
          "It",
          "keeps",
          "our",
          "skin",
          "clear"
        ],
        "decodableWords": [
          "drink"
        ]
      },
      {
        "text": "Farmers use water to grow food. Without it, crops would wilt.",
        "image": "/guided-reading/pages/gr-c-37-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-37-page-3.mp3",
        "highFrequencyWords": [
          "use",
          "water",
          "to",
          "grow",
          "food",
          "Without",
          "it",
          "crops",
          "would"
        ],
        "decodableWords": [
          "Farmers",
          "wilt"
        ]
      },
      {
        "text": "Factories need water too. It cools hot machines.",
        "image": "/guided-reading/pages/gr-c-37-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-37-page-4.mp3",
        "highFrequencyWords": [
          "need",
          "water",
          "too",
          "It",
          "hot",
          "machines"
        ],
        "decodableWords": [
          "Factories",
          "cools"
        ]
      },
      {
        "text": "Water helps us clean. We wash hands, clothes, and floors.",
        "image": "/guided-reading/pages/gr-c-37-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-37-page-5.mp3",
        "highFrequencyWords": [
          "helps",
          "us",
          "clean",
          "We",
          "wash",
          "hands",
          "clothes",
          "and"
        ],
        "decodableWords": [
          "Water",
          "floors"
        ]
      },
      {
        "text": "Clean water is precious. We must use it wisely and keep it pure.",
        "image": "/guided-reading/pages/gr-c-37-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-37-page-6.mp3",
        "highFrequencyWords": [
          "is",
          "precious",
          "We",
          "must",
          "use",
          "it",
          "wisely",
          "and",
          "keep",
          "it",
          "pure"
        ],
        "decodableWords": [
          "Clean",
          "water"
        ]
      }
    ]
  },
  {
    "id": "gr-c-38",
    "title": "Birds Build Nests",
    "type": "nonfiction",
    "level": "C",
    "targetSkills": [
      "animal behavior",
      "process description",
      "nature vocabulary"
    ],
    "theme": "how birds construct homes",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-38-cover.png",
    "pages": [
      {
        "text": "Birds need safe homes for their eggs. So they build nests!",
        "image": "/guided-reading/pages/gr-c-38-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-38-page-1.mp3",
        "highFrequencyWords": [
          "need",
          "safe",
          "homes",
          "for",
          "their",
          "eggs",
          "So",
          "they",
          "build"
        ],
        "decodableWords": [
          "Birds",
          "nests"
        ]
      },
      {
        "text": "A robin weaves grass and twigs. She makes a round cup.",
        "image": "/guided-reading/pages/gr-c-38-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-38-page-2.mp3",
        "highFrequencyWords": [
          "A",
          "and",
          "She",
          "makes",
          "a",
          "round",
          "cup"
        ],
        "decodableWords": [
          "robin",
          "weaves",
          "grass",
          "twigs"
        ]
      },
      {
        "text": "A hummingbird uses spider silk. The silk holds the nest to a branch.",
        "image": "/guided-reading/pages/gr-c-38-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-38-page-3.mp3",
        "highFrequencyWords": [
          "uses",
          "silk",
          "The",
          "silk",
          "holds",
          "the",
          "nest",
          "to",
          "a",
          "branch"
        ],
        "decodableWords": [
          "hummingbird",
          "spider"
        ]
      },
      {
        "text": "An eagle builds a huge pile of sticks. It can weigh a ton!",
        "image": "/guided-reading/pages/gr-c-38-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-38-page-4.mp3",
        "highFrequencyWords": [
          "An",
          "of",
          "sticks",
          "It",
          "can",
          "weigh",
          "a",
          "ton"
        ],
        "decodableWords": [
          "eagle",
          "builds",
          "huge",
          "pile"
        ]
      },
      {
        "text": "A woodpecker carves a hole in a tree. No sticks needed!",
        "image": "/guided-reading/pages/gr-c-38-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-38-page-5.mp3",
        "highFrequencyWords": [
          "in",
          "a",
          "tree",
          "No",
          "sticks",
          "needed"
        ],
        "decodableWords": [
          "woodpecker",
          "carves",
          "hole"
        ]
      },
      {
        "text": "Each nest is just right for its bird. Nature is a clever builder!",
        "image": "/guided-reading/pages/gr-c-38-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-38-page-6.mp3",
        "highFrequencyWords": [
          "Each",
          "nest",
          "is",
          "just",
          "right",
          "for",
          "its",
          "bird",
          "is",
          "a",
          "clever",
          "builder"
        ],
        "decodableWords": [
          "Nature"
        ]
      }
    ]
  },
  {
    "id": "gr-c-39",
    "title": "From Caterpillar to Butterfly",
    "type": "nonfiction",
    "level": "C",
    "targetSkills": [
      "life cycle sequence",
      "transformation vocabulary",
      "nature science"
    ],
    "theme": "complete metamorphosis",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-39-cover.png",
    "pages": [
      {
        "text": "A butterfly starts as an egg. The egg is no bigger than a dot!",
        "image": "/guided-reading/pages/gr-c-39-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-39-page-1.mp3",
        "highFrequencyWords": [
          "A",
          "starts",
          "as",
          "an",
          "egg",
          "The",
          "egg",
          "is",
          "no",
          "bigger",
          "than",
          "a"
        ],
        "decodableWords": [
          "butterfly"
        ]
      },
      {
        "text": "The egg hatches. A tiny caterpillar crawls out. It is very hungry!",
        "image": "/guided-reading/pages/gr-c-39-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-39-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "egg",
          "hatches",
          "A",
          "tiny",
          "out",
          "It",
          "is",
          "very",
          "hungry"
        ],
        "decodableWords": [
          "caterpillar",
          "crawls"
        ]
      },
      {
        "text": "The caterpillar eats leaves. It grows bigger each day.",
        "image": "/guided-reading/pages/gr-c-39-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-39-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "eats",
          "leaves",
          "It",
          "grows",
          "bigger",
          "each",
          "day"
        ],
        "decodableWords": [
          "caterpillar"
        ]
      },
      {
        "text": "Then it spins a chrysalis. It hangs like a jewel on a stem.",
        "image": "/guided-reading/pages/gr-c-39-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-39-page-4.mp3",
        "highFrequencyWords": [
          "Then",
          "it",
          "spins",
          "a",
          "It",
          "like",
          "a",
          "jewel",
          "on",
          "a",
          "stem"
        ],
        "decodableWords": [
          "chrysalis",
          "hangs"
        ]
      },
      {
        "text": "Inside, big changes happen. The caterpillar turns to soup!",
        "image": "/guided-reading/pages/gr-c-39-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-39-page-5.mp3",
        "highFrequencyWords": [
          "Inside",
          "big",
          "changes",
          "happen",
          "The",
          "turns",
          "to"
        ],
        "decodableWords": [
          "caterpillar",
          "soup"
        ]
      },
      {
        "text": "At last, a winged beauty breaks free. Hello, butterfly!",
        "image": "/guided-reading/pages/gr-c-39-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-39-page-6.mp3",
        "highFrequencyWords": [
          "At",
          "last",
          "a",
          "winged",
          "beauty",
          "breaks",
          "free",
          "Hello"
        ],
        "decodableWords": [
          "butterfly"
        ]
      }
    ]
  },
  {
    "id": "gr-c-40",
    "title": "Healthy Hands",
    "type": "nonfiction",
    "level": "C",
    "targetSkills": [
      "health habits",
      "procedural text",
      "hygiene vocabulary"
    ],
    "theme": "proper handwashing and health",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-40-cover.png",
    "pages": [
      {
        "text": "Your hands touch many things. They pick up germs you cannot see.",
        "image": "/guided-reading/pages/gr-c-40-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-40-page-1.mp3",
        "highFrequencyWords": [
          "Your",
          "hands",
          "touch",
          "many",
          "things",
          "They",
          "pick",
          "up",
          "germs",
          "you",
          "cannot",
          "see"
        ],
        "decodableWords": []
      },
      {
        "text": "Germs can make you sick. Washing hands keeps them away.",
        "image": "/guided-reading/pages/gr-c-40-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-40-page-2.mp3",
        "highFrequencyWords": [
          "can",
          "make",
          "you",
          "sick",
          "Washing",
          "hands",
          "keeps",
          "them",
          "away"
        ],
        "decodableWords": [
          "Germs"
        ]
      },
      {
        "text": "First, wet your hands under warm water.",
        "image": "/guided-reading/pages/gr-c-40-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-40-page-3.mp3",
        "highFrequencyWords": [
          "First",
          "wet",
          "your",
          "hands",
          "under",
          "warm",
          "water"
        ],
        "decodableWords": []
      },
      {
        "text": "Next, add soap. Rub your palms, backs, and between fingers.",
        "image": "/guided-reading/pages/gr-c-40-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-40-page-4.mp3",
        "highFrequencyWords": [
          "Next",
          "add",
          "soap",
          "your",
          "and",
          "between",
          "fingers"
        ],
        "decodableWords": [
          "Rub",
          "palms",
          "backs"
        ]
      },
      {
        "text": "Scrub for twenty seconds. Sing a song to keep time!",
        "image": "/guided-reading/pages/gr-c-40-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-40-page-5.mp3",
        "highFrequencyWords": [
          "for",
          "twenty",
          "seconds",
          "Sing",
          "a",
          "song",
          "to",
          "keep",
          "time"
        ],
        "decodableWords": [
          "Scrub"
        ]
      },
      {
        "text": "Rinse and dry. Now your hands are clean. Good job!",
        "image": "/guided-reading/pages/gr-c-40-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-40-page-6.mp3",
        "highFrequencyWords": [
          "and",
          "dry",
          "Now",
          "your",
          "hands",
          "are",
          "clean",
          "Good",
          "job"
        ],
        "decodableWords": [
          "Rinse"
        ]
      }
    ]
  },
  {
    "id": "gr-d-42",
    "title": "Why Leaves Change",
    "type": "nonfiction",
    "level": "D",
    "targetSkills": [
      "seasonal science",
      "chlorophyll concept",
      "nature cycles"
    ],
    "theme": "the science of autumn leaf color",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-42-cover.png",
    "pages": [
      {
        "text": "In summer, leaves are green. But hidden colors wait inside.",
        "image": "/guided-reading/pages/gr-d-42-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-42-page-1.mp3",
        "highFrequencyWords": [
          "In",
          "summer",
          "leaves",
          "are",
          "green",
          "But",
          "hidden",
          "colors",
          "wait",
          "inside"
        ],
        "decodableWords": []
      },
      {
        "text": "A green chemical called chlorophyll helps leaves catch sunlight.",
        "image": "/guided-reading/pages/gr-d-42-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-42-page-2.mp3",
        "highFrequencyWords": [
          "A",
          "green",
          "chemical",
          "called",
          "helps",
          "leaves",
          "catch",
          "sunlight"
        ],
        "decodableWords": [
          "chlorophyll"
        ]
      },
      {
        "text": "As days get shorter, trees make less chlorophyll. The green fades away.",
        "image": "/guided-reading/pages/gr-d-42-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-42-page-3.mp3",
        "highFrequencyWords": [
          "As",
          "days",
          "get",
          "shorter",
          "trees",
          "make",
          "less",
          "The",
          "green",
          "fades",
          "away"
        ],
        "decodableWords": [
          "chlorophyll"
        ]
      },
      {
        "text": "Then yellow and orange shine through. These colors were there all along!",
        "image": "/guided-reading/pages/gr-d-42-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-42-page-4.mp3",
        "highFrequencyWords": [
          "Then",
          "yellow",
          "and",
          "orange",
          "shine",
          "through",
          "These",
          "colors",
          "were",
          "there",
          "all",
          "along"
        ],
        "decodableWords": []
      },
      {
        "text": "Some trees make red and purple too. Sugar trapped in leaves makes these hues.",
        "image": "/guided-reading/pages/gr-d-42-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-42-page-5.mp3",
        "highFrequencyWords": [
          "Some",
          "trees",
          "make",
          "red",
          "and",
          "too",
          "Sugar",
          "trapped",
          "in",
          "leaves",
          "makes",
          "these"
        ],
        "decodableWords": [
          "hues"
        ]
      },
      {
        "text": "When leaves fall, they feed the soil. New green leaves will come in spring!",
        "image": "/guided-reading/pages/gr-d-42-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-42-page-6.mp3",
        "highFrequencyWords": [
          "When",
          "leaves",
          "fall",
          "they",
          "feed",
          "the",
          "soil",
          "New",
          "green",
          "leaves",
          "will",
          "come",
          "in",
          "spring"
        ],
        "decodableWords": []
      }
    ]
  },
  {
    "id": "gr-d-43",
    "title": "The Work of Pollinators",
    "type": "nonfiction",
    "level": "D",
    "targetSkills": [
      "ecosystem science",
      "animal roles",
      "cause-effect"
    ],
    "theme": "pollinators and food production",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-43-cover.png",
    "pages": [
      {
        "text": "One out of every three bites of food exists because of pollinators.",
        "image": "/guided-reading/pages/gr-d-43-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-43-page-1.mp3",
        "highFrequencyWords": [
          "one",
          "out",
          "of",
          "every",
          "three",
          "bites",
          "of",
          "food",
          "exists",
          "because",
          "of"
        ],
        "decodableWords": [
          "pollinators"
        ]
      },
      {
        "text": "Bees are the most famous pollinators. But butterflies, birds, and bats help too.",
        "image": "/guided-reading/pages/gr-d-43-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-43-page-2.mp3",
        "highFrequencyWords": [
          "are",
          "the",
          "most",
          "famous",
          "But",
          "and",
          "and",
          "help",
          "too"
        ],
        "decodableWords": [
          "Bees",
          "pollinators",
          "butterflies",
          "birds",
          "bats"
        ]
      },
      {
        "text": "When a bee visits a bloom, pollen dusts its fuzzy body.",
        "image": "/guided-reading/pages/gr-d-43-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-43-page-3.mp3",
        "highFrequencyWords": [
          "When",
          "a",
          "bee",
          "visits",
          "a",
          "bloom",
          "pollen",
          "dusts",
          "its",
          "fuzzy",
          "body"
        ],
        "decodableWords": []
      },
      {
        "text": "The bee flies to the next flower. Pollen rubs off. The flower can now make fruit.",
        "image": "/guided-reading/pages/gr-d-43-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-43-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "bee",
          "flies",
          "to",
          "the",
          "next",
          "flower",
          "Pollen",
          "rubs",
          "off",
          "The",
          "flower",
          "can",
          "now",
          "make",
          "fruit"
        ],
        "decodableWords": []
      },
      {
        "text": "Without pollinators, apples, berries, and almonds would vanish.",
        "image": "/guided-reading/pages/gr-d-43-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-43-page-5.mp3",
        "highFrequencyWords": [
          "Without",
          "apples",
          "berries",
          "and",
          "almonds",
          "would",
          "vanish"
        ],
        "decodableWords": [
          "pollinators"
        ]
      },
      {
        "text": "Planting flowers helps pollinators thrive. They feed us. We should feed them too.",
        "image": "/guided-reading/pages/gr-d-43-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-43-page-6.mp3",
        "highFrequencyWords": [
          "Planting",
          "flowers",
          "helps",
          "pollinators",
          "thrive",
          "They",
          "feed",
          "us",
          "We",
          "should",
          "feed",
          "them",
          "too"
        ],
        "decodableWords": []
      }
    ]
  },
  {
    "id": "gr-d-44",
    "title": "How Communities Share Spaces",
    "type": "nonfiction",
    "level": "D",
    "targetSkills": [
      "social studies",
      "community concepts",
      "compare-contrast"
    ],
    "theme": "shared community places and their purposes",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-44-cover.png",
    "pages": [
      {
        "text": "A community is a group of people living in the same area. They share many spaces.",
        "image": "/guided-reading/pages/gr-d-44-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-44-page-1.mp3",
        "highFrequencyWords": [
          "is",
          "a",
          "group",
          "of",
          "people",
          "living",
          "in",
          "the",
          "same",
          "area",
          "They",
          "share",
          "many",
          "spaces"
        ],
        "decodableWords": [
          "community"
        ]
      },
      {
        "text": "A park gives people a place to play and rest. It has grass, trees, and paths.",
        "image": "/guided-reading/pages/gr-d-44-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-44-page-2.mp3",
        "highFrequencyWords": [
          "gives",
          "people",
          "a",
          "place",
          "to",
          "play",
          "and",
          "rest",
          "It",
          "has",
          "and",
          "and"
        ],
        "decodableWords": [
          "park",
          "grass",
          "trees",
          "paths"
        ]
      },
      {
        "text": "A library holds books for everyone. You can borrow stories and learn new facts.",
        "image": "/guided-reading/pages/gr-d-44-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-44-page-3.mp3",
        "highFrequencyWords": [
          "holds",
          "books",
          "for",
          "everyone",
          "You",
          "can",
          "borrow",
          "stories",
          "and",
          "learn",
          "new",
          "facts"
        ],
        "decodableWords": [
          "library"
        ]
      },
      {
        "text": "A market lets people buy fresh food. Farmers sell fruits and vegetables there.",
        "image": "/guided-reading/pages/gr-d-44-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-44-page-4.mp3",
        "highFrequencyWords": [
          "lets",
          "people",
          "buy",
          "fresh",
          "food",
          "sell",
          "and",
          "there"
        ],
        "decodableWords": [
          "market",
          "Farmers",
          "fruits",
          "vegetables"
        ]
      },
      {
        "text": "A school is where children learn. Teachers help them read, write, and think.",
        "image": "/guided-reading/pages/gr-d-44-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-44-page-5.mp3",
        "highFrequencyWords": [
          "is",
          "where",
          "children",
          "learn",
          "Teachers",
          "help",
          "them",
          "read",
          "write",
          "and",
          "think"
        ],
        "decodableWords": [
          "school"
        ]
      },
      {
        "text": "These spaces bring people together. When we share, our community grows stronger.",
        "image": "/guided-reading/pages/gr-d-44-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-44-page-6.mp3",
        "highFrequencyWords": [
          "These",
          "spaces",
          "bring",
          "people",
          "together",
          "When",
          "we",
          "share",
          "our",
          "community",
          "grows",
          "stronger"
        ],
        "decodableWords": []
      }
    ]
  },
  {
    "id": "gr-d-45",
    "title": "What Soil Is Made Of",
    "type": "nonfiction",
    "level": "D",
    "targetSkills": [
      "earth science",
      "layers and composition",
      "scientific vocabulary"
    ],
    "theme": "soil composition and importance",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-45-cover.png",
    "pages": [
      {
        "text": "Look down at the ground beneath your feet. That brown matter is soil.",
        "image": "/guided-reading/pages/gr-d-45-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-45-page-1.mp3",
        "highFrequencyWords": [
          "down",
          "at",
          "the",
          "ground",
          "beneath",
          "your",
          "feet",
          "That",
          "brown",
          "matter",
          "is",
          "soil"
        ],
        "decodableWords": []
      },
      {
        "text": "Soil is a mix of many things. It has rock bits, water, air, and living matter.",
        "image": "/guided-reading/pages/gr-d-45-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-45-page-2.mp3",
        "highFrequencyWords": [
          "is",
          "a",
          "mix",
          "of",
          "many",
          "things",
          "It",
          "has",
          "rock",
          "bits",
          "water",
          "air",
          "and",
          "living",
          "matter"
        ],
        "decodableWords": [
          "soil"
        ]
      },
      {
        "text": "Tiny rocks in soil come from big rocks that broke apart over time.",
        "image": "/guided-reading/pages/gr-d-45-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-45-page-3.mp3",
        "highFrequencyWords": [
          "Tiny",
          "rocks",
          "in",
          "soil",
          "come",
          "from",
          "big",
          "rocks",
          "that",
          "broke",
          "apart",
          "over",
          "time"
        ],
        "decodableWords": []
      },
      {
        "text": "Dead leaves and plants rot in the soil. They add nutrients that help new plants grow.",
        "image": "/guided-reading/pages/gr-d-45-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-45-page-4.mp3",
        "highFrequencyWords": [
          "Dead",
          "leaves",
          "and",
          "plants",
          "rot",
          "in",
          "the",
          "soil",
          "They",
          "add",
          "that",
          "help",
          "new",
          "plants",
          "grow"
        ],
        "decodableWords": [
          "nutrients"
        ]
      },
      {
        "text": "Worms and bugs live in soil. They dig tunnels that let air and water move through.",
        "image": "/guided-reading/pages/gr-d-45-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-45-page-5.mp3",
        "highFrequencyWords": [
          "and",
          "bugs",
          "live",
          "in",
          "soil",
          "They",
          "dig",
          "that",
          "let",
          "air",
          "and",
          "water",
          "move",
          "through"
        ],
        "decodableWords": [
          "Worms",
          "tunnels"
        ]
      },
      {
        "text": "Without soil, most plants could not grow. Soil keeps our world green and fed.",
        "image": "/guided-reading/pages/gr-d-45-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-45-page-6.mp3",
        "highFrequencyWords": [
          "Without",
          "soil",
          "most",
          "plants",
          "could",
          "not",
          "grow",
          "soil",
          "keeps",
          "our",
          "world",
          "green",
          "and",
          "fed"
        ],
        "decodableWords": []
      }
    ]
  },
  {
    "id": "gr-e-46",
    "title": "How Water Changes the Land",
    "type": "nonfiction",
    "level": "E",
    "targetSkills": [
      "earth science",
      "erosion and weathering",
      "process description"
    ],
    "theme": "water as a force that shapes landscapes",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-46-cover.png",
    "pages": [
      {
        "text": "Water is patient and powerful. Over time, it changes the shape of the land.",
        "image": "/guided-reading/pages/gr-e-46-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-46-page-1.mp3",
        "highFrequencyWords": [
          "is",
          "patient",
          "and",
          "powerful",
          "Over",
          "time",
          "it",
          "changes",
          "the",
          "shape",
          "of",
          "the",
          "land"
        ],
        "decodableWords": [
          "Water"
        ]
      },
      {
        "text": "Rain falls on mountains. Tiny drops find cracks in the rock and freeze.",
        "image": "/guided-reading/pages/gr-e-46-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-46-page-2.mp3",
        "highFrequencyWords": [
          "falls",
          "on",
          "mountains",
          "Tiny",
          "drops",
          "find",
          "cracks",
          "in",
          "the",
          "rock",
          "and",
          "freeze"
        ],
        "decodableWords": [
          "Rain"
        ]
      },
      {
        "text": "Frozen water expands. The cracks grow wider. Bits of rock break off.",
        "image": "/guided-reading/pages/gr-e-46-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-46-page-3.mp3",
        "highFrequencyWords": [
          "water",
          "expands",
          "The",
          "cracks",
          "grow",
          "wider",
          "Bits",
          "of",
          "rock",
          "break",
          "off"
        ],
        "decodableWords": [
          "Frozen"
        ]
      },
      {
        "text": "Rivers carry sand and stone. They grind against canyon walls, carving deep paths.",
        "image": "/guided-reading/pages/gr-e-46-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-46-page-4.mp3",
        "highFrequencyWords": [
          "carry",
          "sand",
          "and",
          "stone",
          "They",
          "grind",
          "against",
          "canyon",
          "walls",
          "carving",
          "deep",
          "paths"
        ],
        "decodableWords": [
          "Rivers"
        ]
      },
      {
        "text": "Waves hit the shore again and again. They smooth rocks and shape beaches.",
        "image": "/guided-reading/pages/gr-e-46-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-46-page-5.mp3",
        "highFrequencyWords": [
          "hit",
          "the",
          "shore",
          "again",
          "and",
          "again",
          "They",
          "smooth",
          "rocks",
          "and",
          "shape",
          "beaches"
        ],
        "decodableWords": [
          "Waves"
        ]
      },
      {
        "text": "Every river valley, every canyon, every beach tells a water story.",
        "image": "/guided-reading/pages/gr-e-46-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-46-page-6.mp3",
        "highFrequencyWords": [
          "Every",
          "river",
          "valley",
          "every",
          "canyon",
          "every",
          "beach",
          "tells",
          "a",
          "water",
          "story"
        ],
        "decodableWords": []
      }
    ]
  },
  {
    "id": "gr-e-47",
    "title": "Planning a Safe Route",
    "type": "nonfiction",
    "level": "E",
    "targetSkills": [
      "spatial reasoning",
      "safety concepts",
      "procedural planning"
    ],
    "theme": "how to plan safe walking routes",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-47-cover.png",
    "pages": [
      {
        "text": "Getting from one place to another takes planning. A safe route keeps you out of danger.",
        "image": "/guided-reading/pages/gr-e-47-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-47-page-1.mp3",
        "highFrequencyWords": [
          "Getting",
          "from",
          "one",
          "place",
          "to",
          "another",
          "takes",
          "planning",
          "A",
          "safe",
          "route",
          "keeps",
          "you",
          "out",
          "of",
          "danger"
        ],
        "decodableWords": []
      },
      {
        "text": "Start by looking at a map. Find your home and your goal. Trace the streets between them.",
        "image": "/guided-reading/pages/gr-e-47-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-47-page-2.mp3",
        "highFrequencyWords": [
          "by",
          "looking",
          "at",
          "a",
          "map",
          "Find",
          "your",
          "home",
          "and",
          "your",
          "goal",
          "Trace",
          "the",
          "streets",
          "between",
          "them"
        ],
        "decodableWords": [
          "Start"
        ]
      },
      {
        "text": "Pick paths with sidewalks. Walking on the street is risky. Sidewolds separate you from cars.",
        "image": "/guided-reading/pages/gr-e-47-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-47-page-3.mp3",
        "highFrequencyWords": [
          "with",
          "sidewalks",
          "Walking",
          "on",
          "the",
          "street",
          "is",
          "risky",
          "you",
          "from",
          "cars"
        ],
        "decodableWords": [
          "paths"
        ]
      },
      {
        "text": "Choose well-lit streets. Darkness hides tripe and other hazards. Light helps you see.",
        "image": "/guided-reading/pages/gr-e-47-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-47-page-4.mp3",
        "highFrequencyWords": [
          "well",
          "lit",
          "streets",
          "Darkness",
          "hides",
          "and",
          "other",
          "Light",
          "helps",
          "you",
          "see"
        ],
        "decodableWords": [
          "Choose",
          "hazards"
        ]
      },
      {
        "text": "Cross at corners and use crosswalks. Drivers expect walkers there. Always look both ways.",
        "image": "/guided-reading/pages/gr-e-47-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-47-page-5.mp3",
        "highFrequencyWords": [
          "at",
          "corners",
          "and",
          "use",
          "crosswalks",
          "Drivers",
          "expect",
          "walkers",
          "there",
          "Always",
          "look",
          "both",
          "ways"
        ],
        "decodableWords": [
          "Cross"
        ]
      },
      {
        "text": "A good route is safe, short, and simple. Plan ahead, walk smart, and stay alert.",
        "image": "/guided-reading/pages/gr-e-47-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-47-page-6.mp3",
        "highFrequencyWords": [
          "A",
          "good",
          "route",
          "is",
          "safe",
          "short",
          "and",
          "simple",
          "Plan",
          "ahead",
          "walk",
          "smart",
          "and",
          "stay",
          "alert"
        ],
        "decodableWords": []
      }
    ]
  },
  {
    "id": "gr-e-48",
    "title": "Why Animals Migrate",
    "type": "nonfiction",
    "level": "E",
    "targetSkills": [
      "animal behavior",
      "seasonal adaptation",
      "ecosystem connections"
    ],
    "theme": "the reasons and methods of animal migration",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-48-cover.png",
    "pages": [
      {
        "text": "Every year, billions of animals travel long distances. This journey is called migration.",
        "image": "/guided-reading/pages/gr-e-48-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-48-page-1.mp3",
        "highFrequencyWords": [
          "Every",
          "year",
          "billions",
          "of",
          "animals",
          "travel",
          "long",
          "distances",
          "This",
          "journey",
          "is",
          "called"
        ],
        "decodableWords": [
          "migration"
        ]
      },
      {
        "text": "Most animals migrate to find food. When winter comes, insects and plants disappear.",
        "image": "/guided-reading/pages/gr-e-48-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-48-page-2.mp3",
        "highFrequencyWords": [
          "Most",
          "animals",
          "migrate",
          "to",
          "find",
          "food",
          "When",
          "winter",
          "comes",
          "insects",
          "and",
          "plants",
          "disappear"
        ],
        "decodableWords": []
      },
      {
        "text": "Birds fly south to warm places. They follow the same paths their parents used.",
        "image": "/guided-reading/pages/gr-e-48-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-48-page-3.mp3",
        "highFrequencyWords": [
          "fly",
          "south",
          "to",
          "warm",
          "places",
          "They",
          "follow",
          "the",
          "same",
          "paths",
          "their",
          "parents",
          "used"
        ],
        "decodableWords": [
          "Birds"
        ]
      },
      {
        "text": "Some whales swim to cold waters to feed. There, tiny sea creatures bloom in summer.",
        "image": "/guided-reading/pages/gr-e-48-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-48-page-4.mp3",
        "highFrequencyWords": [
          "Some",
          "whales",
          "swim",
          "to",
          "cold",
          "waters",
          "to",
          "feed",
          "There",
          "tiny",
          "sea",
          "creatures",
          "bloom",
          "in",
          "summer"
        ],
        "decodableWords": []
      },
      {
        "text": "Monarch butterflies travel thousands of miles. It takes four generations to complete the round trip!",
        "image": "/guided-reading/pages/gr-e-48-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-48-page-5.mp3",
        "highFrequencyWords": [
          "travel",
          "thousands",
          "of",
          "miles",
          "It",
          "takes",
          "four",
          "generations",
          "to",
          "complete",
          "the",
          "round",
          "trip"
        ],
        "decodableWords": [
          "Monarch",
          "butterflies"
        ]
      },
      {
        "text": "Migrating animals do not use maps. They use the sun, stars, and Earths magnetic field to guide them.",
        "image": "/guided-reading/pages/gr-e-48-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-48-page-6.mp3",
        "highFrequencyWords": [
          "animals",
          "do",
          "not",
          "use",
          "maps",
          "They",
          "use",
          "the",
          "sun",
          "stars",
          "and",
          "magnetic",
          "field",
          "to",
          "guide",
          "them"
        ],
        "decodableWords": [
          "Migrating",
          "Earths"
        ]
      }
    ]
  },
  {
    "id": "gr-e-49",
    "title": "How Simple Machines Help",
    "type": "nonfiction",
    "level": "E",
    "targetSkills": [
      "physics basics",
      "six simple machines",
      "real-world applications"
    ],
    "theme": "simple machines and their uses",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-49-cover.png",
    "pages": [
      {
        "text": "A simple machine is a tool that makes work easier. There are six kinds.",
        "image": "/guided-reading/pages/gr-e-49-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-49-page-1.mp3",
        "highFrequencyWords": [
          "is",
          "a",
          "tool",
          "that",
          "makes",
          "work",
          "easier",
          "There",
          "are",
          "six",
          "kinds"
        ],
        "decodableWords": [
          "simple",
          "machine"
        ]
      },
      {
        "text": "A lever helps you lift heavy things. A seesaw on the playground is a lever.",
        "image": "/guided-reading/pages/gr-e-49-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-49-page-2.mp3",
        "highFrequencyWords": [
          "helps",
          "you",
          "lift",
          "heavy",
          "things",
          "A",
          "on",
          "the",
          "playground",
          "is",
          "a",
          "lever"
        ],
        "decodableWords": [
          "lever",
          "seesaw"
        ]
      },
      {
        "text": "A wheel and axle let things roll. Bikes, cars, and scooters all use this pair.",
        "image": "/guided-reading/pages/gr-e-49-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-49-page-3.mp3",
        "highFrequencyWords": [
          "and",
          "axle",
          "let",
          "things",
          "roll",
          "and",
          "all",
          "use",
          "this"
        ],
        "decodableWords": [
          "wheel",
          "Bikes",
          "cars",
          "scooters"
        ]
      },
      {
        "text": "A pulley uses a rope and wheel to lift loads up high. Flagpoles use pulleys.",
        "image": "/guided-reading/pages/gr-e-49-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-49-page-4.mp3",
        "highFrequencyWords": [
          "uses",
          "a",
          "rope",
          "and",
          "wheel",
          "to",
          "lift",
          "loads",
          "up",
          "high",
          "Flagpoles",
          "use"
        ],
        "decodableWords": [
          "pulley",
          "pulleys"
        ]
      },
      {
        "text": "An inclined plane is a slanted surface. Ramps help wheelchairs roll up stairs.",
        "image": "/guided-reading/pages/gr-e-49-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-49-page-5.mp3",
        "highFrequencyWords": [
          "is",
          "a",
          "slanted",
          "surface",
          "help",
          "wheelchairs",
          "roll",
          "up"
        ],
        "decodableWords": [
          "inclined",
          "plane",
          "Ramps",
          "stairs"
        ]
      },
      {
        "text": "Simple machines are everywhere. They make our daily tasks possible.",
        "image": "/guided-reading/pages/gr-e-49-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-49-page-6.mp3",
        "highFrequencyWords": [
          "are",
          "everywhere",
          "They",
          "make",
          "our",
          "daily",
          "tasks",
          "possible"
        ],
        "decodableWords": [
          "simple",
          "machines"
        ]
      }
    ]
  },
  {
    "id": "gr-e-50",
    "title": "Reading Like a Researcher",
    "type": "nonfiction",
    "level": "E",
    "targetSkills": [
      "research habits",
      "active reading",
      "literacy metacognition"
    ],
    "theme": "how to read and learn like a researcher",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-50-cover.png",
    "pages": [
      {
        "text": "Researchers do not just read words. They ask questions, make connections, and dig deeper.",
        "image": "/guided-reading/pages/gr-e-50-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-50-page-1.mp3",
        "highFrequencyWords": [
          "do",
          "not",
          "just",
          "read",
          "words",
          "They",
          "ask",
          "questions",
          "make",
          "connections",
          "and",
          "dig",
          "deeper"
        ],
        "decodableWords": [
          "Researchers"
        ]
      },
      {
        "text": "Before reading, look at the title and pictures. What do you already know? What do you hope to learn?",
        "image": "/guided-reading/pages/gr-e-50-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-50-page-2.mp3",
        "highFrequencyWords": [
          "Before",
          "reading",
          "look",
          "at",
          "the",
          "title",
          "and",
          "pictures",
          "What",
          "do",
          "you",
          "already",
          "know",
          "What",
          "do",
          "you",
          "hope",
          "to",
          "learn"
        ],
        "decodableWords": []
      },
      {
        "text": "While reading, pause to think. Does this make sense? Highlight important facts.",
        "image": "/guided-reading/pages/gr-e-50-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-50-page-3.mp3",
        "highFrequencyWords": [
          "While",
          "reading",
          "pause",
          "to",
          "think",
          "Does",
          "this",
          "make",
          "sense",
          "Highlight",
          "important",
          "facts"
        ],
        "decodableWords": []
      },
      {
        "text": "After reading, summarize what you learned. Say it in your own words.",
        "image": "/guided-reading/pages/gr-e-50-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-50-page-4.mp3",
        "highFrequencyWords": [
          "After",
          "reading",
          "summarize",
          "what",
          "you",
          "learned",
          "Say",
          "it",
          "in",
          "your",
          "own",
          "words"
        ],
        "decodableWords": []
      },
      {
        "text": "Good readers check sources. Is the author an expert? Is the information current?",
        "image": "/guided-reading/pages/gr-e-50-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-50-page-5.mp3",
        "highFrequencyWords": [
          "Good",
          "readers",
          "check",
          "sources",
          "Is",
          "the",
          "author",
          "an",
          "expert",
          "Is",
          "the",
          "information",
          "current"
        ],
        "decodableWords": []
      },
      {
        "text": "Reading is not just looking at words. It is thinking, wondering, and growing your mind.",
        "image": "/guided-reading/pages/gr-e-50-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-50-page-6.mp3",
        "highFrequencyWords": [
          "is",
          "not",
          "just",
          "looking",
          "at",
          "words",
          "It",
          "is",
          "thinking",
          "wondering",
          "and",
          "growing",
          "your",
          "mind"
        ],
        "decodableWords": [
          "Reading"
        ]
      }
    ]
  }
];

const PACK_8_REGENERATION_REASON =
  "Pack 8 page art contains embedded book text and/or visual story details that conflict with the app text and narration. Disable until Kimi regenerates clean illustration-only page images or provides matching app text and narration.";

export const guidedReadingBookCandidates = rawGuidedReadingBooks.map(book => ({
  ...book,
  active: false,
  needsRegeneration: true,
  regenerationReason: PACK_8_REGENERATION_REASON,
  qaStatus: "needs_regeneration",
  qaNotes: PACK_8_REGENERATION_REASON,
  pages: book.pages.map(page => ({
    ...page,
    text: normalizeReadingText(page.text),
    active: false,
    needsRegeneration: true,
    regenerationReason: PACK_8_REGENERATION_REASON,
    imageAlt: page.imageAlt || `${book.title} page illustration`,
    pageDescription: page.pageDescription || "",
    embeddedImageText: page.embeddedImageText || "",
    targetWords: page.targetWords || [...new Set(words(page.text).map(word => word.text.toLowerCase()))],
    decodableFocus: page.decodableFocus || book.targetSkills || [],
    qaStatus: "needs_regeneration",
    qaNotes: PACK_8_REGENERATION_REASON,
    words: words(page.text)
  }))
}));

const approvedGuidedReadingCandidates = guidedReadingBookCandidates
  .filter(book => book.active !== false && book.qaStatus === "approved")
  .map(book => ({
    ...book,
    pages: book.pages.filter(page => page.active !== false && page.qaStatus === "approved")
  }))
  .filter(book => book.pages.length >= 4);

const approvedRegeneratedGuidedReadingBooks = guidedReadingRegenBooks
  .filter(book => book.active !== false && book.qaStatus === "approved")
  .map(book => ({
    ...book,
    pages: (book.pages || []).filter(page => page.active !== false && page.qaStatus === "approved")
  }))
  .filter(book => book.pages.length >= 4);

const approvedSeriesBooks = guidedReadingSeriesBooks
  .filter(book => book.active !== false && book.qaStatus === "approved")
  .map(book => ({
    ...book,
    pages: (book.pages || []).filter(page => page.active !== false && page.qaStatus === "approved")
  }))
  .filter(book => book.pages.length >= 4);

const activeGuidedReadingBaseBooks = [
  ...approvedGuidedReadingCandidates,
  ...approvedRegeneratedGuidedReadingBooks,
  ...firstFactsLevelABooks,
  ...firstFactsLevelCBooks,
  ...approvedSeriesBooks
];

export const guidedReadingRelevelAudit = activeGuidedReadingBaseBooks.map(book => {
  const pages = (book.pages || []).filter(page => page.active !== false && page.qaStatus === "approved");
  const averageWordsPerPage = pages.length
    ? pages.reduce((sum, page) => sum + countReadingWords(page.text), 0) / pages.length
    : 0;
  const oneSentencePageCount = pages.filter(page => countReadingSentences(page.text) <= 1).length;
  const newLevel = getHonestGuidedReadingLevel(book);

  return {
    id: book.id,
    title: book.title,
    type: normalizeGuidedReadingType(book.type),
    oldLevel: book.level,
    newLevel,
    pageCount: pages.length,
    averageWordsPerPage: Number(averageWordsPerPage.toFixed(1)),
    oneSentencePageCount,
    reason: newLevel === book.level
      ? "Level remains appropriate for current text length."
      : `Mostly one-sentence pages with ${Number(averageWordsPerPage.toFixed(1))} average words per page; not appropriate for Level ${book.level}.`
  };
});

export const guidedStoryBookDrafts = guidedStoryBooks;
export const guidedReadingSeriesBookDrafts = guidedReadingSeriesBooks;

export const guidedReadingBooks = activeGuidedReadingBaseBooks
  .map(relevelGuidedReadingBook)
  .filter(book => book.pages.length >= 4);

export const enrichedGuidedReadingBooks = guidedReadingBooks.map(enrichGuidedReadingBook);

export function normalizeGuidedReadingType(type = "") {
  const normalized = String(type || "").toLowerCase().replace(/[^a-z]/g, "");
  return normalized === "fiction" ? "fiction" : "nonfiction";
}

export function formatGuidedReadingType(type = "") {
  return normalizeGuidedReadingType(type) === "nonfiction" ? "Non-Fiction" : "Fiction";
}

export function getGuidedReadingProgress(book = {}, record = {}) {
  const totalPages = book.pages?.length || record.totalPages || 0;
  const completedPages = Math.min(
    totalPages,
    Math.max(
      Number(record.completedPages || 0),
      Object.keys(record.pages || {}).length
    )
  );
  const completed = Boolean(record.completed || record.completedAt || (totalPages && completedPages >= totalPages));
  const firstReadAt = record.firstReadAt || record.completedAt || "";
  const lastReadAt = record.lastReadAt || record.completedAt || record.updatedAt || "";
  const readCount = Math.max(Number(record.readCount || 0), completed ? 1 : 0);

  return {
    studentId: record.studentId || "",
    bookId: book.id || record.bookId || "",
    title: book.title || record.title || "",
    level: book.level || record.level || "",
    type: normalizeGuidedReadingType(book.type || record.type || ""),
    firstReadAt,
    lastReadAt,
    readCount,
    completedPages,
    totalPages,
    completed
  };
}

export function summarizeGuidedReadingProgress(records = {}) {
  const rows = guidedReadingBooks
    .map(book => {
      const record = records[book.id];
      if (!record) return null;
      return getGuidedReadingProgress(book, record);
    })
    .filter(Boolean);
  const completedBooks = rows.filter(row => row.completed);
  const inProgressBooks = rows.filter(row => !row.completed && row.completedPages > 0);
  const byLevel = ["A", "B", "C", "D", "E", "F"].reduce((acc, level) => {
    acc[level] = completedBooks.filter(row => row.level === level).length;
    return acc;
  }, {});
  const fictionCount = completedBooks.filter(row => row.type === "fiction").length;
  const nonfictionCount = completedBooks.filter(row => row.type === "nonfiction").length;
  const totalRereads = completedBooks.reduce((sum, row) => sum + Math.max(0, row.readCount - 1), 0);
  const latestReadingDate = rows
    .map(row => row.lastReadAt)
    .filter(Boolean)
    .sort()
    .at(-1) || "";

  return {
    rows,
    completedBooks,
    inProgressBooks,
    totalBooksRead: completedBooks.length,
    fictionCount,
    nonfictionCount,
    byLevel,
    totalRereads,
    latestReadingDate
  };
}

export function summarizeGuidedReadingRecord(record) {
  const pages = Object.values(record?.pages || {});
  const markEntries = pages.flatMap(page => Object.entries(page.wordMarks || {}));
  const correct = markEntries.filter(([, mark]) => mark === "correct").length;
  const support = markEntries.filter(([, mark]) => mark === "support").length;
  const attempted = correct + support;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const correctWords = [];
  const supportWords = [];

  pages.forEach((page, pageIndex) => {
    Object.entries(page.wordMarks || {}).forEach(([wordIndex, mark]) => {
      if (mark === "correct") {
        const word = page.words?.[wordIndex] || page.wordTexts?.[wordIndex] || "";
        if (word) correctWords.push(word);
      }
      if (mark === "support") {
        const word = page.words?.[wordIndex] || page.wordTexts?.[wordIndex] || "";
        if (word) supportWords.push(word);
      }
    });
  });

  return {
    attempted,
    correct,
    support,
    accuracy,
    correctWords: [...new Set(correctWords.map(word => String(word).toLowerCase()))],
    supportWords: [...new Set(supportWords.map(word => String(word).toLowerCase()))],
    pageNotes: pages
      .map((page, index) => ({ page: index + 1, note: page.note || "" }))
      .filter(item => item.note.trim()),
    wholeBookNote: record?.wholeBookNote || "",
    completedAt: record?.completedAt || ""
  };
}

export function getGuidedReadingWordStatusRows(records = {}) {
  const aggregate = new Map();

  Object.entries(records || {}).forEach(([bookId, record]) => {
    const book = guidedReadingBooks.find(item => item.id === bookId);
    const title = book?.title || record.title || bookId;
    const level = book?.level || record.level || "";
    const type = normalizeGuidedReadingType(book?.type || record.type || "");
    Object.entries(record.pages || {}).forEach(([pageIndex, page]) => {
      const pageNumber = Number(pageIndex) + 1;
      Object.entries(page.wordMarks || {}).forEach(([wordIndex, mark]) => {
        if (mark !== "correct" && mark !== "support") return;
        const word = page.words?.[wordIndex] || page.wordTexts?.[wordIndex] || "";
        if (!word) return;
        const date = page.updatedAt || record.lastReadAt || record.completedAt || record.updatedAt || "";
        const status = mark === "correct" ? "Read Correctly" : "Needs Support";
        const key = [date, bookId, pageNumber, String(word).toLowerCase(), status].join("::");
        const previous = aggregate.get(key) || {
          date,
          bookId,
          title,
          level,
          type,
          page: pageNumber,
          word: String(word).toLowerCase(),
          status,
          count: 0
        };
        previous.count += 1;
        aggregate.set(key, previous);
      });
    });
  });

  return [...aggregate.values()].sort((a, b) =>
    String(b.date).localeCompare(String(a.date)) ||
    a.title.localeCompare(b.title) ||
    a.page - b.page ||
    a.word.localeCompare(b.word)
  );
}

export function summarizeGuidedReadingRecords(records = {}) {
  return Object.entries(records)
    .map(([bookId, record]) => {
      const book = guidedReadingBooks.find(item => item.id === bookId);
      return {
        bookId,
        title: book?.title || record.title || bookId,
        type: book?.type || record.type || "",
        level: book?.level || record.level || "",
        ...summarizeGuidedReadingRecord(record)
      };
    })
    .filter(summary => summary.attempted > 0 || summary.wholeBookNote || summary.pageNotes.length > 0);
}
