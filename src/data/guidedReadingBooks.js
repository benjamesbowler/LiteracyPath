const wordAudio = word => `/audio/child-mode/words/${word.toLowerCase().replace(/[^a-z0-9'-]+/g, "-").replace(/^-+|-+$/g, "")}.mp3`;

const words = text =>
  text
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudio(word)
    }));

const rawGuidedReadingBooks = [
  {
    "id": "gr-a-01",
    "title": "The Red Hat Plan",
    "type": "fiction",
    "level": "A",
    "targetSkills": [
      "short a CVC",
      "simple HFW"
    ],
    "theme": "solving a small classroom problem",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-01-cover.png",
    "pages": [
      {
        "text": "Nan has a red hat.",
        "image": "/guided-reading/pages/gr-a-01-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-01-page-1.mp3",
        "highFrequencyWords": [
          "has",
          "a"
        ],
        "decodableWords": [
          "Nan",
          "red",
          "hat"
        ]
      },
      {
        "text": "The hat is on the mat.",
        "image": "/guided-reading/pages/gr-a-01-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-01-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "on",
          "the"
        ],
        "decodableWords": [
          "hat",
          "mat"
        ]
      },
      {
        "text": "Nan can not get the hat.",
        "image": "/guided-reading/pages/gr-a-01-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-01-page-3.mp3",
        "highFrequencyWords": [
          "can",
          "not",
          "get",
          "the"
        ],
        "decodableWords": [
          "Nan",
          "hat"
        ]
      },
      {
        "text": "Sam has a plan.",
        "image": "/guided-reading/pages/gr-a-01-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-01-page-4.mp3",
        "highFrequencyWords": [
          "has",
          "a"
        ],
        "decodableWords": [
          "Sam",
          "plan"
        ]
      },
      {
        "text": "Sam can tap the mat.",
        "image": "/guided-reading/pages/gr-a-01-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-01-page-5.mp3",
        "highFrequencyWords": [
          "can",
          "the"
        ],
        "decodableWords": [
          "Sam",
          "tap",
          "mat"
        ]
      },
      {
        "text": "Nan can get the hat!",
        "image": "/guided-reading/pages/gr-a-01-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-01-page-6.mp3",
        "highFrequencyWords": [
          "can",
          "get",
          "the"
        ],
        "decodableWords": [
          "Nan",
          "hat"
        ]
      }
    ]
  },
  {
    "id": "gr-a-02",
    "title": "Sam Can Help",
    "type": "fiction",
    "level": "A",
    "targetSkills": [
      "CVC",
      "can",
      "help"
    ],
    "theme": "kindness during cleanup",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-02-cover.png",
    "pages": [
      {
        "text": "The class has a mess.",
        "image": "/guided-reading/pages/gr-a-02-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-02-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "a"
        ],
        "decodableWords": [
          "class",
          "mess"
        ]
      },
      {
        "text": "Cans and bags are on the rug.",
        "image": "/guided-reading/pages/gr-a-02-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-02-page-2.mp3",
        "highFrequencyWords": [
          "and",
          "are",
          "on",
          "the"
        ],
        "decodableWords": [
          "Cans",
          "bags",
          "rug"
        ]
      },
      {
        "text": "Sam can pick up the cans.",
        "image": "/guided-reading/pages/gr-a-02-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-02-page-3.mp3",
        "highFrequencyWords": [
          "can",
          "up",
          "the"
        ],
        "decodableWords": [
          "Sam",
          "pick",
          "cans"
        ]
      },
      {
        "text": "Sam can pick up the bags.",
        "image": "/guided-reading/pages/gr-a-02-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-02-page-4.mp3",
        "highFrequencyWords": [
          "can",
          "up",
          "the"
        ],
        "decodableWords": [
          "Sam",
          "pick",
          "bags"
        ]
      },
      {
        "text": "I can help, says Nan.",
        "image": "/guided-reading/pages/gr-a-02-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-02-page-5.mp3",
        "highFrequencyWords": [
          "can",
          "help",
          "says"
        ],
        "decodableWords": [
          "Nan"
        ]
      },
      {
        "text": "The class is clean!",
        "image": "/guided-reading/pages/gr-a-02-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-02-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "is"
        ],
        "decodableWords": [
          "class",
          "clean"
        ]
      }
    ]
  },
  {
    "id": "gr-a-03",
    "title": "The Map in the Bag",
    "type": "fiction",
    "level": "A",
    "targetSkills": [
      "short a",
      "map",
      "bag"
    ],
    "theme": "using a map to find a lost item",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-03-cover.png",
    "pages": [
      {
        "text": "Nan and Sam see a bag.",
        "image": "/guided-reading/pages/gr-a-03-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-03-page-1.mp3",
        "highFrequencyWords": [
          "and",
          "see",
          "a"
        ],
        "decodableWords": [
          "Nan",
          "Sam",
          "bag"
        ]
      },
      {
        "text": "A map is in the bag!",
        "image": "/guided-reading/pages/gr-a-03-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-03-page-2.mp3",
        "highFrequencyWords": [
          "is",
          "in",
          "the"
        ],
        "decodableWords": [
          "map",
          "bag"
        ]
      },
      {
        "text": "The map has an X.",
        "image": "/guided-reading/pages/gr-a-03-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-03-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "an"
        ],
        "decodableWords": [
          "map"
        ]
      },
      {
        "text": "Nan and Sam run to the X.",
        "image": "/guided-reading/pages/gr-a-03-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-03-page-4.mp3",
        "highFrequencyWords": [
          "and",
          "to",
          "the"
        ],
        "decodableWords": [
          "Nan",
          "Sam",
          "run"
        ]
      },
      {
        "text": "The X is on a mat.",
        "image": "/guided-reading/pages/gr-a-03-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-03-page-5.mp3",
        "highFrequencyWords": [
          "is",
          "on",
          "a"
        ],
        "decodableWords": [
          "mat"
        ]
      },
      {
        "text": "A red pen is on the mat!",
        "image": "/guided-reading/pages/gr-a-03-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-03-page-6.mp3",
        "highFrequencyWords": [
          "is",
          "on",
          "the"
        ],
        "decodableWords": [
          "red",
          "pen",
          "mat"
        ]
      }
    ]
  },
  {
    "id": "gr-a-04",
    "title": "Kit and the Big Box",
    "type": "fiction",
    "level": "A",
    "targetSkills": [
      "short i/o",
      "big",
      "box"
    ],
    "theme": "sharing space and taking turns",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-04-cover.png",
    "pages": [
      {
        "text": "Kit sees a big box.",
        "image": "/guided-reading/pages/gr-a-04-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-04-page-1.mp3",
        "highFrequencyWords": [
          "sees",
          "a",
          "big"
        ],
        "decodableWords": [
          "Kit",
          "box"
        ]
      },
      {
        "text": "I sit in the box, says Kit.",
        "image": "/guided-reading/pages/gr-a-04-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-04-page-2.mp3",
        "highFrequencyWords": [
          "in",
          "the",
          "says"
        ],
        "decodableWords": [
          "sit",
          "box",
          "Kit"
        ]
      },
      {
        "text": "Dot sees the big box.",
        "image": "/guided-reading/pages/gr-a-04-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-04-page-3.mp3",
        "highFrequencyWords": [
          "sees",
          "the",
          "big"
        ],
        "decodableWords": [
          "Dot",
          "box"
        ]
      },
      {
        "text": "I sit in the box, says Dot.",
        "image": "/guided-reading/pages/gr-a-04-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-04-page-4.mp3",
        "highFrequencyWords": [
          "in",
          "the",
          "says"
        ],
        "decodableWords": [
          "sit",
          "box",
          "Dot"
        ]
      },
      {
        "text": "You sit. I sit. We sit!",
        "image": "/guided-reading/pages/gr-a-04-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-04-page-5.mp3",
        "highFrequencyWords": [
          "You",
          "sit",
          "We"
        ],
        "decodableWords": []
      },
      {
        "text": "The box is fun for Kit and Dot!",
        "image": "/guided-reading/pages/gr-a-04-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-04-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "fun",
          "for",
          "and"
        ],
        "decodableWords": [
          "box",
          "Kit",
          "Dot"
        ]
      }
    ]
  },
  {
    "id": "gr-a-05",
    "title": "Nan and the Seed",
    "type": "fiction",
    "level": "A",
    "targetSkills": [
      "short e",
      "seed vocabulary in context"
    ],
    "theme": "patience as a seed sprouts",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-a-05-cover.png",
    "pages": [
      {
        "text": "Nan has a seed.",
        "image": "/guided-reading/pages/gr-a-05-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-05-page-1.mp3",
        "highFrequencyWords": [
          "has",
          "a"
        ],
        "decodableWords": [
          "Nan",
          "seed"
        ]
      },
      {
        "text": "Nan puts the seed in a pot.",
        "image": "/guided-reading/pages/gr-a-05-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-05-page-2.mp3",
        "highFrequencyWords": [
          "the",
          "in",
          "a"
        ],
        "decodableWords": [
          "Nan",
          "puts",
          "seed",
          "pot"
        ]
      },
      {
        "text": "Nan gets a wet rag.",
        "image": "/guided-reading/pages/gr-a-05-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-05-page-3.mp3",
        "highFrequencyWords": [
          "gets",
          "a"
        ],
        "decodableWords": [
          "Nan",
          "wet",
          "rag"
        ]
      },
      {
        "text": "The seed is in the wet rag.",
        "image": "/guided-reading/pages/gr-a-05-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-05-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "in",
          "the"
        ],
        "decodableWords": [
          "seed",
          "wet",
          "rag"
        ]
      },
      {
        "text": "Nan lets the seed rest.",
        "image": "/guided-reading/pages/gr-a-05-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-05-page-5.mp3",
        "highFrequencyWords": [
          "lets",
          "the",
          "rest"
        ],
        "decodableWords": [
          "Nan",
          "seed"
        ]
      },
      {
        "text": "The seed is a plant!",
        "image": "/guided-reading/pages/gr-a-05-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-a-05-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "a"
        ],
        "decodableWords": [
          "seed",
          "plant"
        ]
      }
    ]
  },
  {
    "id": "gr-a-26",
    "title": "What Is a Map?",
    "type": "nonfiction",
    "level": "A",
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
    "level": "A",
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
    "level": "A",
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
    "level": "A",
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
    "level": "A",
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
    "id": "gr-b-06",
    "title": "Mina Fixes the Gate",
    "type": "fiction",
    "level": "B",
    "targetSkills": [
      "short vowels",
      "silent e preview",
      "blends (st",
      "nd)",
      "persistence"
    ],
    "theme": "persistence and teamwork",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-06-cover.png",
    "pages": [
      {
        "text": "Mina sees a broken gate.",
        "image": "/guided-reading/pages/gr-b-06-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-06-page-1.mp3",
        "highFrequencyWords": [
          "a"
        ],
        "decodableWords": [
          "Mina",
          "sees",
          "broken",
          "gate"
        ]
      },
      {
        "text": "The gate will not stay shut.",
        "image": "/guided-reading/pages/gr-b-06-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-06-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "will",
          "not"
        ],
        "decodableWords": [
          "gate",
          "stay",
          "shut"
        ]
      },
      {
        "text": "Mina gets a stick and some string.",
        "image": "/guided-reading/pages/gr-b-06-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-06-page-3.mp3",
        "highFrequencyWords": [
          "and",
          "some"
        ],
        "decodableWords": [
          "Mina",
          "gets",
          "stick",
          "string"
        ]
      },
      {
        "text": "She ties the stick to the gate.",
        "image": "/guided-reading/pages/gr-b-06-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-06-page-4.mp3",
        "highFrequencyWords": [
          "the",
          "to"
        ],
        "decodableWords": [
          "She",
          "ties",
          "stick",
          "gate"
        ]
      },
      {
        "text": "The stick breaks! Mina tries again.",
        "image": "/guided-reading/pages/gr-b-06-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-06-page-5.mp3",
        "highFrequencyWords": [
          "The"
        ],
        "decodableWords": [
          "stick",
          "breaks",
          "Mina",
          "tries",
          "again"
        ]
      },
      {
        "text": "This time, Mina uses a plank and nails. The gate stays shut!",
        "image": "/guided-reading/pages/gr-b-06-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-06-page-6.mp3",
        "highFrequencyWords": [
          "The"
        ],
        "decodableWords": [
          "This",
          "time",
          "Mina",
          "uses",
          "plank",
          "and",
          "nails",
          "gate",
          "stays",
          "shut"
        ]
      }
    ]
  },
  {
    "id": "gr-b-07",
    "title": "The Quiet Bell",
    "type": "fiction",
    "level": "B",
    "targetSkills": [
      "short vowels",
      "-ell word family",
      "community awareness"
    ],
    "theme": "noticing needs in a community",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-07-cover.png",
    "pages": [
      {
        "text": "Tess has a bell on her desk.",
        "image": "/guided-reading/pages/gr-b-07-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-07-page-1.mp3",
        "highFrequencyWords": [
          "has",
          "a",
          "her"
        ],
        "decodableWords": [
          "Tess",
          "bell",
          "on",
          "desk"
        ]
      },
      {
        "text": "The bell is too quiet.",
        "image": "/guided-reading/pages/gr-b-07-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-07-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "too"
        ],
        "decodableWords": [
          "bell",
          "quiet"
        ]
      },
      {
        "text": "No one can hear the bell ring.",
        "image": "/guided-reading/pages/gr-b-07-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-07-page-3.mp3",
        "highFrequencyWords": [
          "No",
          "one",
          "can",
          "the"
        ],
        "decodableWords": [
          "hear",
          "bell",
          "ring"
        ]
      },
      {
        "text": "Tess gets a shell and a spoon.",
        "image": "/guided-reading/pages/gr-b-07-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-07-page-4.mp3",
        "highFrequencyWords": [
          "a",
          "and"
        ],
        "decodableWords": [
          "Tess",
          "gets",
          "shell",
          "spoon"
        ]
      },
      {
        "text": "She bangs the spoon on the shell.",
        "image": "/guided-reading/pages/gr-b-07-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-07-page-5.mp3",
        "highFrequencyWords": [
          "the",
          "on"
        ],
        "decodableWords": [
          "She",
          "bangs",
          "spoon",
          "shell"
        ]
      },
      {
        "text": "Now the class can hear! Tess made a new bell.",
        "image": "/guided-reading/pages/gr-b-07-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-07-page-6.mp3",
        "highFrequencyWords": [
          "the",
          "can",
          "hear",
          "made",
          "a"
        ],
        "decodableWords": [
          "Now",
          "class",
          "Tess",
          "new",
          "bell"
        ]
      }
    ]
  },
  {
    "id": "gr-b-08",
    "title": "A Lunch for Two",
    "type": "fiction",
    "level": "B",
    "targetSkills": [
      "HFW practice",
      "simple dialogue",
      "friendship"
    ],
    "theme": "generosity and friendship",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-08-cover.png",
    "pages": [
      {
        "text": "Dell has a big lunch bag.",
        "image": "/guided-reading/pages/gr-b-08-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-08-page-1.mp3",
        "highFrequencyWords": [
          "has",
          "a",
          "big"
        ],
        "decodableWords": [
          "Dell",
          "lunch",
          "bag"
        ]
      },
      {
        "text": "She sees Nell with no lunch.",
        "image": "/guided-reading/pages/gr-b-08-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-08-page-2.mp3",
        "highFrequencyWords": [
          "with",
          "no"
        ],
        "decodableWords": [
          "She",
          "sees",
          "Nell",
          "lunch"
        ]
      },
      {
        "text": "Will you share? asks Nell.",
        "image": "/guided-reading/pages/gr-b-08-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-08-page-3.mp3",
        "highFrequencyWords": [
          "you",
          "asks"
        ],
        "decodableWords": [
          "Will",
          "share",
          "Nell"
        ]
      },
      {
        "text": "Yes! says Dell. She splits the sandwich.",
        "image": "/guided-reading/pages/gr-b-08-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-08-page-4.mp3",
        "highFrequencyWords": [
          "says",
          "She",
          "the"
        ],
        "decodableWords": [
          "Yes",
          "Dell",
          "splits",
          "sandwich"
        ]
      },
      {
        "text": "They share the chips and the drink.",
        "image": "/guided-reading/pages/gr-b-08-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-08-page-5.mp3",
        "highFrequencyWords": [
          "the",
          "and"
        ],
        "decodableWords": [
          "They",
          "share",
          "chips",
          "drink"
        ]
      },
      {
        "text": "Two friends, one lunch. It is the best lunch ever!",
        "image": "/guided-reading/pages/gr-b-08-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-08-page-6.mp3",
        "highFrequencyWords": [
          "one",
          "It",
          "is",
          "the",
          "best"
        ],
        "decodableWords": [
          "Two",
          "friends",
          "lunch",
          "ever"
        ]
      }
    ]
  },
  {
    "id": "gr-b-09",
    "title": "The Kite That Waited",
    "type": "fiction",
    "level": "B",
    "targetSkills": [
      "long i preview",
      "short vowels",
      "patience"
    ],
    "theme": "waiting for the right conditions",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-09-cover.png",
    "pages": [
      {
        "text": "Finn has a red kite.",
        "image": "/guided-reading/pages/gr-b-09-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-09-page-1.mp3",
        "highFrequencyWords": [
          "has",
          "a"
        ],
        "decodableWords": [
          "Finn",
          "red",
          "kite"
        ]
      },
      {
        "text": "He runs with the kite. It will not fly.",
        "image": "/guided-reading/pages/gr-b-09-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-09-page-2.mp3",
        "highFrequencyWords": [
          "with",
          "the",
          "It",
          "will",
          "not"
        ],
        "decodableWords": [
          "He",
          "runs",
          "kite",
          "fly"
        ]
      },
      {
        "text": "No wind, says Finn. He sits and waits.",
        "image": "/guided-reading/pages/gr-b-09-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-09-page-3.mp3",
        "highFrequencyWords": [
          "says",
          "He",
          "and"
        ],
        "decodableWords": [
          "No",
          "wind",
          "Finn",
          "sits",
          "waits"
        ]
      },
      {
        "text": "The trees start to sway. The wind is here!",
        "image": "/guided-reading/pages/gr-b-09-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-09-page-4.mp3",
        "highFrequencyWords": [
          "The",
          "to",
          "is",
          "here"
        ],
        "decodableWords": [
          "trees",
          "start",
          "sway",
          "wind"
        ]
      },
      {
        "text": "Finn runs fast. The kite goes up, up, up!",
        "image": "/guided-reading/pages/gr-b-09-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-09-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "up"
        ],
        "decodableWords": [
          "Finn",
          "runs",
          "fast",
          "kite",
          "goes"
        ]
      },
      {
        "text": "The kite flies high in the sky. Waiting was worth it!",
        "image": "/guided-reading/pages/gr-b-09-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-09-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "in",
          "the",
          "it"
        ],
        "decodableWords": [
          "kite",
          "flies",
          "high",
          "sky",
          "Waiting",
          "was",
          "worth"
        ]
      }
    ]
  },
  {
    "id": "gr-b-10",
    "title": "Omar's Bright Idea",
    "type": "fiction",
    "level": "B",
    "targetSkills": [
      "CVC and HFW mix",
      "creative problem solving"
    ],
    "theme": "creative problem solving",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-b-10-cover.png",
    "pages": [
      {
        "text": "The classroom is dark and gloomy.",
        "image": "/guided-reading/pages/gr-b-10-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-10-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "and"
        ],
        "decodableWords": [
          "classroom",
          "dark",
          "gloomy"
        ]
      },
      {
        "text": "The bulb is burned out.",
        "image": "/guided-reading/pages/gr-b-10-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-10-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "out"
        ],
        "decodableWords": [
          "bulb",
          "burned"
        ]
      },
      {
        "text": "Omar looks at the sun-filled windows.",
        "image": "/guided-reading/pages/gr-b-10-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-10-page-3.mp3",
        "highFrequencyWords": [
          "at",
          "the"
        ],
        "decodableWords": [
          "Omar",
          "looks",
          "sun",
          "filled",
          "windows"
        ]
      },
      {
        "text": "He gets foil and tape. He makes a reflector.",
        "image": "/guided-reading/pages/gr-b-10-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-10-page-4.mp3",
        "highFrequencyWords": [
          "He",
          "and",
          "a"
        ],
        "decodableWords": [
          "gets",
          "foil",
          "tape",
          "makes",
          "reflector"
        ]
      },
      {
        "text": "Omar puts the reflector by the window.",
        "image": "/guided-reading/pages/gr-b-10-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-10-page-5.mp3",
        "highFrequencyWords": [
          "the",
          "by"
        ],
        "decodableWords": [
          "Omar",
          "puts",
          "reflector",
          "window"
        ]
      },
      {
        "text": "Sunlight bounces in! The room is bright. Omar saved the day!",
        "image": "/guided-reading/pages/gr-b-10-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-b-10-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "is"
        ],
        "decodableWords": [
          "Sunlight",
          "bounces",
          "in",
          "room",
          "bright",
          "Omar",
          "saved",
          "day"
        ]
      }
    ]
  },
  {
    "id": "gr-c-11",
    "title": "The Bridge of Sticks",
    "type": "fiction",
    "level": "C",
    "targetSkills": [
      "silent e",
      "teamwork",
      "engineering thinking"
    ],
    "theme": "cooperation and creative engineering",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-11-cover.png",
    "pages": [
      {
        "text": "The creek is wide. The friends need to cross.",
        "image": "/guided-reading/pages/gr-c-11-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-11-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "to"
        ],
        "decodableWords": [
          "creek",
          "wide",
          "friends",
          "need",
          "cross"
        ]
      },
      {
        "text": "Jade piles stones in the water. They wobble and sink.",
        "image": "/guided-reading/pages/gr-c-11-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-11-page-2.mp3",
        "highFrequencyWords": [
          "the",
          "and"
        ],
        "decodableWords": [
          "Jade",
          "piles",
          "stones",
          "water",
          "wobble",
          "sink"
        ]
      },
      {
        "text": "We need a plan, says Blake. Let us use sticks.",
        "image": "/guided-reading/pages/gr-c-11-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-11-page-3.mp3",
        "highFrequencyWords": [
          "a",
          "says",
          "us",
          "use"
        ],
        "decodableWords": [
          "We",
          "need",
          "plan",
          "Blake",
          "Let",
          "sticks"
        ]
      },
      {
        "text": "They weave long sticks over the stones.",
        "image": "/guided-reading/pages/gr-c-11-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-11-page-4.mp3",
        "highFrequencyWords": [
          "over",
          "the"
        ],
        "decodableWords": [
          "They",
          "weave",
          "long",
          "sticks",
          "stones"
        ]
      },
      {
        "text": "Mud seals the cracks. Leaves cover the top.",
        "image": "/guided-reading/pages/gr-c-11-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-11-page-5.mp3",
        "highFrequencyWords": [
          "the"
        ],
        "decodableWords": [
          "Mud",
          "seals",
          "cracks",
          "Leaves",
          "cover",
          "top"
        ]
      },
      {
        "text": "The bridge holds! Together, they made a safe path.",
        "image": "/guided-reading/pages/gr-c-11-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-11-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "a"
        ],
        "decodableWords": [
          "bridge",
          "holds",
          "Together",
          "They",
          "made",
          "safe",
          "path"
        ]
      }
    ]
  },
  {
    "id": "gr-c-12",
    "title": "The Lost Paintbrush",
    "type": "fiction",
    "level": "C",
    "targetSkills": [
      "silent e",
      "problem-solution structure",
      "descriptive language"
    ],
    "theme": "resourcefulness when things go missing",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-12-cover.png",
    "pages": [
      {
        "text": "Rosa needs her paintbrush for art class.",
        "image": "/guided-reading/pages/gr-c-12-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-12-page-1.mp3",
        "highFrequencyWords": [
          "her",
          "for"
        ],
        "decodableWords": [
          "Rosa",
          "needs",
          "paintbrush",
          "art",
          "class"
        ]
      },
      {
        "text": "She looks in her desk. She looks in her bag.",
        "image": "/guided-reading/pages/gr-c-12-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-12-page-2.mp3",
        "highFrequencyWords": [
          "She",
          "in",
          "her"
        ],
        "decodableWords": [
          "looks",
          "desk",
          "bag"
        ]
      },
      {
        "text": "The brush is gone! Rosa feels upset.",
        "image": "/guided-reading/pages/gr-c-12-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-12-page-3.mp3",
        "highFrequencyWords": [
          "The",
          "is",
          "feels"
        ],
        "decodableWords": [
          "brush",
          "gone",
          "Rosa",
          "upset"
        ]
      },
      {
        "text": "She sees a feather on the floor.",
        "image": "/guided-reading/pages/gr-c-12-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-12-page-4.mp3",
        "highFrequencyWords": [
          "a",
          "on",
          "the"
        ],
        "decodableWords": [
          "She",
          "sees",
          "feather",
          "floor"
        ]
      },
      {
        "text": "Rosa dips the feather in paint. It makes fine lines!",
        "image": "/guided-reading/pages/gr-c-12-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-12-page-5.mp3",
        "highFrequencyWords": [
          "the",
          "in",
          "It"
        ],
        "decodableWords": [
          "Rosa",
          "dips",
          "feather",
          "paint",
          "makes",
          "fine",
          "lines"
        ]
      },
      {
        "text": "Sometimes the best tools are the ones you find.",
        "image": "/guided-reading/pages/gr-c-12-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-12-page-6.mp3",
        "highFrequencyWords": [
          "the",
          "best",
          "are",
          "the",
          "ones",
          "you"
        ],
        "decodableWords": [
          "Sometimes",
          "tools",
          "find"
        ]
      }
    ]
  },
  {
    "id": "gr-c-13",
    "title": "A Garden for Everyone",
    "type": "fiction",
    "level": "C",
    "targetSkills": [
      "silent e",
      "vowel teams (ea",
      "oo)",
      "community theme"
    ],
    "theme": "inclusive community projects",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-13-cover.png",
    "pages": [
      {
        "text": "The playground has a bare spot by the fence.",
        "image": "/guided-reading/pages/gr-c-13-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-13-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "a",
          "by",
          "the"
        ],
        "decodableWords": [
          "playground",
          "bare",
          "spot",
          "fence"
        ]
      },
      {
        "text": "Ivy has an idea. We can plant a garden here!",
        "image": "/guided-reading/pages/gr-c-13-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-13-page-2.mp3",
        "highFrequencyWords": [
          "an",
          "idea",
          "We",
          "can",
          "a",
          "here"
        ],
        "decodableWords": [
          "Ivy",
          "plant",
          "garden"
        ]
      },
      {
        "text": "Some kids bring seeds. Some bring tools.",
        "image": "/guided-reading/pages/gr-c-13-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-13-page-3.mp3",
        "highFrequencyWords": [
          "Some",
          "bring"
        ],
        "decodableWords": [
          "kids",
          "seeds",
          "tools"
        ]
      },
      {
        "text": "They dig the soil. They drop in seeds.",
        "image": "/guided-reading/pages/gr-c-13-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-13-page-4.mp3",
        "highFrequencyWords": [
          "the"
        ],
        "decodableWords": [
          "They",
          "dig",
          "soil",
          "drop",
          "in",
          "seeds"
        ]
      },
      {
        "text": "Each day they water and weed. Green shoots peek up!",
        "image": "/guided-reading/pages/gr-c-13-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-13-page-5.mp3",
        "highFrequencyWords": [
          "they",
          "and",
          "up"
        ],
        "decodableWords": [
          "Each",
          "day",
          "water",
          "weed",
          "Green",
          "shoots",
          "peek"
        ]
      },
      {
        "text": "Soon the garden blooms. It is bright and beautiful and ours.",
        "image": "/guided-reading/pages/gr-c-13-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-13-page-6.mp3",
        "highFrequencyWords": [
          "the",
          "It",
          "is",
          "and",
          "and",
          "ours"
        ],
        "decodableWords": [
          "Soon",
          "garden",
          "blooms",
          "bright",
          "beautiful"
        ]
      }
    ]
  },
  {
    "id": "gr-c-14",
    "title": "The Rain Jar",
    "type": "fiction",
    "level": "C",
    "targetSkills": [
      "silent e",
      "cause and effect",
      "environmental awareness"
    ],
    "theme": "observing nature and resourcefulness",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-14-cover.png",
    "pages": [
      {
        "text": "The sun bakes the school garden. The leaves droop.",
        "image": "/guided-reading/pages/gr-c-14-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-14-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "the",
          "school"
        ],
        "decodableWords": [
          "sun",
          "bakes",
          "garden",
          "leaves",
          "droop"
        ]
      },
      {
        "text": "We need water, says Chen. But the hose is off.",
        "image": "/guided-reading/pages/gr-c-14-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-14-page-2.mp3",
        "highFrequencyWords": [
          "We",
          "need",
          "says",
          "But",
          "the",
          "is",
          "off"
        ],
        "decodableWords": [
          "water",
          "Chen",
          "hose"
        ]
      },
      {
        "text": "Chen looks at the dark clouds. Rain is coming!",
        "image": "/guided-reading/pages/gr-c-14-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-14-page-3.mp3",
        "highFrequencyWords": [
          "the",
          "is",
          "coming"
        ],
        "decodableWords": [
          "Chen",
          "looks",
          "dark",
          "clouds",
          "Rain"
        ]
      },
      {
        "text": "He places a big jar by the garden bed.",
        "image": "/guided-reading/pages/gr-c-14-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-14-page-4.mp3",
        "highFrequencyWords": [
          "a",
          "by",
          "the"
        ],
        "decodableWords": [
          "He",
          "places",
          "big",
          "jar",
          "garden",
          "bed"
        ]
      },
      {
        "text": "Plop, plop, plop! Rain fills the jar.",
        "image": "/guided-reading/pages/gr-c-14-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-14-page-5.mp3",
        "highFrequencyWords": [
          "the"
        ],
        "decodableWords": [
          "Plop",
          "Rain",
          "fills",
          "jar"
        ]
      },
      {
        "text": "Chen pours the rain on the plants. Nature gave them a drink!",
        "image": "/guided-reading/pages/gr-c-14-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-14-page-6.mp3",
        "highFrequencyWords": [
          "the",
          "on",
          "the",
          "them",
          "a"
        ],
        "decodableWords": [
          "Chen",
          "pours",
          "rain",
          "plants",
          "Nature",
          "gave",
          "drink"
        ]
      }
    ]
  },
  {
    "id": "gr-c-15",
    "title": "The Lantern Path",
    "type": "fiction",
    "level": "C",
    "targetSkills": [
      "silent e",
      "vowel teams",
      "empathy and courage"
    ],
    "theme": "kindness and bravery",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-15-cover.png",
    "pages": [
      {
        "text": "The power goes out at school. The halls go dark.",
        "image": "/guided-reading/pages/gr-c-15-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-15-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "at",
          "school",
          "The",
          "go",
          "dark"
        ],
        "decodableWords": [
          "power",
          "goes",
          "out",
          "halls"
        ]
      },
      {
        "text": "Some kids are scared. Mei sees their worried faces.",
        "image": "/guided-reading/pages/gr-c-15-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-15-page-2.mp3",
        "highFrequencyWords": [
          "Some",
          "are",
          "sees",
          "their"
        ],
        "decodableWords": [
          "kids",
          "scared",
          "Mei",
          "worried",
          "faces"
        ]
      },
      {
        "text": "She finds paper lanterns in the art room.",
        "image": "/guided-reading/pages/gr-c-15-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-15-page-3.mp3",
        "highFrequencyWords": [
          "in",
          "the",
          "art",
          "room"
        ],
        "decodableWords": [
          "She",
          "finds",
          "paper",
          "lanterns"
        ]
      },
      {
        "text": "Mei lights each one with a small candle.",
        "image": "/guided-reading/pages/gr-c-15-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-15-page-4.mp3",
        "highFrequencyWords": [
          "each",
          "one",
          "with",
          "a"
        ],
        "decodableWords": [
          "Mei",
          "lights",
          "small",
          "candle"
        ]
      },
      {
        "text": "She places them along the hallway floor.",
        "image": "/guided-reading/pages/gr-c-15-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-15-page-5.mp3",
        "highFrequencyWords": [
          "them",
          "along",
          "the",
          "floor"
        ],
        "decodableWords": [
          "She",
          "places",
          "hallway"
        ]
      },
      {
        "text": "A warm path glows. No one is scared now. Mei led the way.",
        "image": "/guided-reading/pages/gr-c-15-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-15-page-6.mp3",
        "highFrequencyWords": [
          "A",
          "is",
          "now",
          "the",
          "way"
        ],
        "decodableWords": [
          "warm",
          "path",
          "glows",
          "No",
          "one",
          "scared",
          "Mei",
          "led"
        ]
      }
    ]
  },
  {
    "id": "gr-d-16",
    "title": "Maya and the Broken Bridge",
    "type": "fiction",
    "level": "D",
    "targetSkills": [
      "vowel teams (ai",
      "ay)",
      "problem-solving",
      "perseverance"
    ],
    "theme": "perseverance through setbacks",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-16-cover.png",
    "pages": [
      {
        "text": "Maya and her friends build a bridge of blocks.",
        "image": "/guided-reading/pages/gr-d-16-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-16-page-1.mp3",
        "highFrequencyWords": [
          "and",
          "her"
        ],
        "decodableWords": [
          "Maya",
          "friends",
          "build",
          "bridge",
          "blocks"
        ]
      },
      {
        "text": "They test it with a toy car. Crash! The bridge falls.",
        "image": "/guided-reading/pages/gr-d-16-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-16-page-2.mp3",
        "highFrequencyWords": [
          "it",
          "with",
          "a",
          "The",
          "falls"
        ],
        "decodableWords": [
          "They",
          "test",
          "toy",
          "car",
          "Crash",
          "bridge"
        ]
      },
      {
        "text": "\"It is ruined!\" stamps Leo. Maya shakes her head.",
        "image": "/guided-reading/pages/gr-d-16-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-16-page-3.mp3",
        "highFrequencyWords": [
          "It",
          "is",
          "her"
        ],
        "decodableWords": [
          "ruined",
          "stamps",
          "Leo",
          "Maya",
          "shakes",
          "head"
        ]
      },
      {
        "text": "We need a base, says Maya. Wide and flat and strong.",
        "image": "/guided-reading/pages/gr-d-16-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-16-page-4.mp3",
        "highFrequencyWords": [
          "a",
          "says",
          "and",
          "and"
        ],
        "decodableWords": [
          "We",
          "need",
          "base",
          "Maya",
          "Wide",
          "flat",
          "strong"
        ]
      },
      {
        "text": "They slide a book under the blocks. The bridge stands tall.",
        "image": "/guided-reading/pages/gr-d-16-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-16-page-5.mp3",
        "highFrequencyWords": [
          "a",
          "under",
          "the",
          "The",
          "stands"
        ],
        "decodableWords": [
          "They",
          "slide",
          "book",
          "blocks",
          "bridge",
          "tall"
        ]
      },
      {
        "text": "The toy car rolls across. Maya smiles. Never give up!",
        "image": "/guided-reading/pages/gr-d-16-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-16-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "toy",
          "across",
          "up"
        ],
        "decodableWords": [
          "car",
          "rolls",
          "Maya",
          "smiles",
          "Never",
          "give"
        ]
      }
    ]
  },
  {
    "id": "gr-d-17",
    "title": "The Honest Choice",
    "type": "fiction",
    "level": "D",
    "targetSkills": [
      "vowel teams (oa",
      "ow)",
      "character moral decisions"
    ],
    "theme": "honesty and integrity",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-17-cover.png",
    "pages": [
      {
        "text": "Zoe finds a shiny coin in the lunch line.",
        "image": "/guided-reading/pages/gr-d-17-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-17-page-1.mp3",
        "highFrequencyWords": [
          "a",
          "in",
          "the",
          "line"
        ],
        "decodableWords": [
          "Zoe",
          "finds",
          "shiny",
          "coin",
          "lunch"
        ]
      },
      {
        "text": "She looks around. No one seems to notice.",
        "image": "/guided-reading/pages/gr-d-17-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-17-page-2.mp3",
        "highFrequencyWords": [
          "around",
          "No",
          "one",
          "seems",
          "to"
        ],
        "decodableWords": [
          "She",
          "looks",
          "notice"
        ]
      },
      {
        "text": "Zoe clutches the coin. She thinks of the bake sale.",
        "image": "/guided-reading/pages/gr-d-17-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-17-page-3.mp3",
        "highFrequencyWords": [
          "the",
          "She",
          "of",
          "the"
        ],
        "decodableWords": [
          "Zoe",
          "clutches",
          "coin",
          "thinks",
          "bake",
          "sale"
        ]
      },
      {
        "text": "Then she sees a younger child crying by the door.",
        "image": "/guided-reading/pages/gr-d-17-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-17-page-4.mp3",
        "highFrequencyWords": [
          "she",
          "sees",
          "a",
          "by",
          "the"
        ],
        "decodableWords": [
          "Then",
          "younger",
          "child",
          "crying",
          "door"
        ]
      },
      {
        "text": "\"Did you lose this?\" Zoe asks. The child nods and beams.",
        "image": "/guided-reading/pages/gr-d-17-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-17-page-5.mp3",
        "highFrequencyWords": [
          "you",
          "this",
          "The",
          "child",
          "and"
        ],
        "decodableWords": [
          "Did",
          "lose",
          "Zoe",
          "asks",
          "nods",
          "beams"
        ]
      },
      {
        "text": "Zoe feels warm inside. Doing the right thing is its own reward.",
        "image": "/guided-reading/pages/gr-d-17-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-17-page-6.mp3",
        "highFrequencyWords": [
          "the",
          "right",
          "thing",
          "is",
          "its",
          "own"
        ],
        "decodableWords": [
          "Zoe",
          "feels",
          "warm",
          "inside",
          "Doing",
          "reward"
        ]
      }
    ]
  },
  {
    "id": "gr-d-18",
    "title": "The Smallest Seed",
    "type": "fiction",
    "level": "D",
    "targetSkills": [
      "vowel teams (ee",
      "ea)",
      "growth mindset metaphor"
    ],
    "theme": "patience and believing in small beginnings",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-18-cover.png",
    "pages": [
      {
        "text": "In a garden of giants, one seed is tiny.",
        "image": "/guided-reading/pages/gr-d-18-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-18-page-1.mp3",
        "highFrequencyWords": [
          "In",
          "a",
          "of",
          "one",
          "is"
        ],
        "decodableWords": [
          "garden",
          "giants",
          "seed",
          "tiny"
        ]
      },
      {
        "text": "The other seeds tease it. You are too small to grow!",
        "image": "/guided-reading/pages/gr-d-18-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-18-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "other",
          "it",
          "You",
          "are",
          "too",
          "to"
        ],
        "decodableWords": [
          "seeds",
          "tease",
          "small",
          "grow"
        ]
      },
      {
        "text": "A gust of wind blows the tiny seed far away.",
        "image": "/guided-reading/pages/gr-d-18-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-18-page-3.mp3",
        "highFrequencyWords": [
          "A",
          "of",
          "away"
        ],
        "decodableWords": [
          "gust",
          "wind",
          "blows",
          "tiny",
          "seed",
          "far"
        ]
      },
      {
        "text": "It lands in rich soil. Rain falls. Sun beams down.",
        "image": "/guided-reading/pages/gr-d-18-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-18-page-4.mp3",
        "highFrequencyWords": [
          "It",
          "in",
          "soil",
          "Rain",
          "falls",
          "Sun",
          "down"
        ],
        "decodableWords": [
          "lands",
          "rich",
          "beams"
        ]
      },
      {
        "text": "A green leaf peeks out. Then two. Then ten!",
        "image": "/guided-reading/pages/gr-d-18-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-18-page-5.mp3",
        "highFrequencyWords": [
          "out",
          "Then",
          "Then"
        ],
        "decodableWords": [
          "green",
          "leaf",
          "peeks",
          "two",
          "ten"
        ]
      },
      {
        "text": "The tiny seed becomes the tallest sunflower. Small starts matter.",
        "image": "/guided-reading/pages/gr-d-18-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-18-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "seed",
          "the",
          "matter"
        ],
        "decodableWords": [
          "tiny",
          "becomes",
          "tallest",
          "sunflower",
          "Small",
          "starts"
        ]
      }
    ]
  },
  {
    "id": "gr-d-19",
    "title": "The Team With No Captain",
    "type": "fiction",
    "level": "D",
    "targetSkills": [
      "r-controlled vowels",
      "leadership and shared responsibility"
    ],
    "theme": "shared leadership and collaboration",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-19-cover.png",
    "pages": [
      {
        "text": "The soccer team has no captain. Everyone wants to lead.",
        "image": "/guided-reading/pages/gr-d-19-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-19-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "has",
          "no",
          "Everyone",
          "wants",
          "to",
          "lead"
        ],
        "decodableWords": [
          "soccer",
          "team",
          "captain"
        ]
      },
      {
        "text": "We need one voice, says Coach Verra. Not five.",
        "image": "/guided-reading/pages/gr-d-19-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-19-page-2.mp3",
        "highFrequencyWords": [
          "one",
          "says",
          "Not"
        ],
        "decodableWords": [
          "We",
          "need",
          "voice",
          "Coach",
          "Verra",
          "five"
        ]
      },
      {
        "text": "During practice, each player calls a different play.",
        "image": "/guided-reading/pages/gr-d-19-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-19-page-3.mp3",
        "highFrequencyWords": [
          "each",
          "a",
          "different"
        ],
        "decodableWords": [
          "During",
          "practice",
          "player",
          "calls",
          "play"
        ]
      },
      {
        "text": "They trip and tangle. No goal. No score. Just chaos.",
        "image": "/guided-reading/pages/gr-d-19-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-19-page-4.mp3",
        "highFrequencyWords": [
          "No",
          "No",
          "Just"
        ],
        "decodableWords": [
          "They",
          "trip",
          "tangle",
          "goal",
          "score",
          "chaos"
        ]
      },
      {
        "text": "Then Stan speaks up. What if we take turns leading?",
        "image": "/guided-reading/pages/gr-d-19-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-19-page-5.mp3",
        "highFrequencyWords": [
          "Then",
          "speaks",
          "up",
          "if",
          "we",
          "take",
          "turns"
        ],
        "decodableWords": [
          "Stan",
          "What",
          "leading"
        ]
      },
      {
        "text": "They win the game. Every player scored. Together, they were the captain.",
        "image": "/guided-reading/pages/gr-d-19-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-19-page-6.mp3",
        "highFrequencyWords": [
          "the",
          "game",
          "Every",
          "scored",
          "they",
          "were",
          "the"
        ],
        "decodableWords": [
          "They",
          "win",
          "player",
          "Together",
          "captain"
        ]
      }
    ]
  },
  {
    "id": "gr-d-20",
    "title": "The Window Garden",
    "type": "fiction",
    "level": "D",
    "targetSkills": [
      "multisyllabic words",
      "vowel teams",
      "urban nature theme"
    ],
    "theme": "finding nature in unexpected places",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-20-cover.png",
    "pages": [
      {
        "text": "Ava lives in a tall building. There is no yard to tend.",
        "image": "/guided-reading/pages/gr-d-20-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-20-page-1.mp3",
        "highFrequencyWords": [
          "in",
          "a",
          "tall",
          "There",
          "is",
          "no",
          "to"
        ],
        "decodableWords": [
          "Ava",
          "lives",
          "building",
          "yard",
          "tend"
        ]
      },
      {
        "text": "She looks out the window at the brick wall.",
        "image": "/guided-reading/pages/gr-d-20-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-20-page-2.mp3",
        "highFrequencyWords": [
          "out",
          "the",
          "window",
          "at",
          "the",
          "wall"
        ],
        "decodableWords": [
          "She",
          "looks",
          "brick"
        ]
      },
      {
        "text": "Ava fills small pots with soil. She places them on the sill.",
        "image": "/guided-reading/pages/gr-d-20-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-20-page-3.mp3",
        "highFrequencyWords": [
          "with",
          "She",
          "them",
          "on",
          "the"
        ],
        "decodableWords": [
          "Ava",
          "fills",
          "small",
          "pots",
          "soil",
          "places",
          "sill"
        ]
      },
      {
        "text": "She plants basil, mint, and a tiny tomato vine.",
        "image": "/guided-reading/pages/gr-d-20-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-20-page-4.mp3",
        "highFrequencyWords": [
          "and",
          "a",
          "tiny"
        ],
        "decodableWords": [
          "She",
          "plants",
          "basil",
          "mint",
          "tomato",
          "vine"
        ]
      },
      {
        "text": "Each morning she waters. Each evening she checks for sprouts.",
        "image": "/guided-reading/pages/gr-d-20-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-20-page-5.mp3",
        "highFrequencyWords": [
          "she",
          "she",
          "for"
        ],
        "decodableWords": [
          "Each",
          "morning",
          "waters",
          "Each",
          "evening",
          "checks",
          "sprouts"
        ]
      },
      {
        "text": "Green leaves reach for the sky. A garden can grow anywhere.",
        "image": "/guided-reading/pages/gr-d-20-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-20-page-6.mp3",
        "highFrequencyWords": [
          "for",
          "the",
          "A",
          "can",
          "grow",
          "anywhere"
        ],
        "decodableWords": [
          "Green",
          "leaves",
          "reach",
          "sky",
          "garden"
        ]
      }
    ]
  },
  {
    "id": "gr-e-21",
    "title": "The Long Way Home",
    "type": "fiction",
    "level": "E",
    "targetSkills": [
      "long vowel teams (ai",
      "ee",
      "oa)",
      "narrative sequencing",
      "problem solving"
    ],
    "theme": "adaptability when plans change",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-21-cover.png",
    "pages": [
      {
        "text": "The school bus breaks down far from home.",
        "image": "/guided-reading/pages/gr-e-21-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-21-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "school",
          "bus",
          "down",
          "far",
          "from",
          "home"
        ],
        "decodableWords": [
          "breaks"
        ]
      },
      {
        "text": "The driver calls for help. We must wait, she says.",
        "image": "/guided-reading/pages/gr-e-21-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-21-page-2.mp3",
        "highFrequencyWords": [
          "The",
          "for",
          "help",
          "We",
          "must",
          "wait",
          "she",
          "says"
        ],
        "decodableWords": [
          "driver",
          "calls"
        ]
      },
      {
        "text": "Eli looks at the map on his phone. There is a path through the park.",
        "image": "/guided-reading/pages/gr-e-21-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-21-page-3.mp3",
        "highFrequencyWords": [
          "at",
          "the",
          "map",
          "on",
          "his",
          "There",
          "is",
          "a",
          "through",
          "the"
        ],
        "decodableWords": [
          "Eli",
          "looks",
          "phone",
          "path",
          "park"
        ]
      },
      {
        "text": "Who wants to walk? he asks. Five friends raise their hands.",
        "image": "/guided-reading/pages/gr-e-21-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-21-page-4.mp3",
        "highFrequencyWords": [
          "Who",
          "wants",
          "to",
          "he",
          "asks",
          "Five",
          "their"
        ],
        "decodableWords": [
          "walk",
          "friends",
          "raise",
          "hands"
        ]
      },
      {
        "text": "They hike past ponds and meadows. They spot birds and deer.",
        "image": "/guided-reading/pages/gr-e-21-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-21-page-5.mp3",
        "highFrequencyWords": [
          "past",
          "and",
          "and"
        ],
        "decodableWords": [
          "They",
          "hike",
          "ponds",
          "meadows",
          "spot",
          "birds",
          "deer"
        ]
      },
      {
        "text": "They reach home at sunset. Sometimes the long way is the best way.",
        "image": "/guided-reading/pages/gr-e-21-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-21-page-6.mp3",
        "highFrequencyWords": [
          "They",
          "home",
          "at",
          "Sometimes",
          "the",
          "way",
          "is",
          "the",
          "best",
          "way"
        ],
        "decodableWords": [
          "reach",
          "sunset",
          "long"
        ]
      }
    ]
  },
  {
    "id": "gr-e-22",
    "title": "The Debate at Table Four",
    "type": "fiction",
    "level": "E",
    "targetSkills": [
      "complex vowel teams",
      "persuasive language",
      "respectful disagreement"
    ],
    "theme": "learning to disagree respectfully",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-22-cover.png",
    "pages": [
      {
        "text": "At lunch, table four has a big debate. Which season is best?",
        "image": "/guided-reading/pages/gr-e-22-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-22-page-1.mp3",
        "highFrequencyWords": [
          "At",
          "table",
          "four",
          "has",
          "a",
          "big",
          "Which",
          "is",
          "best"
        ],
        "decodableWords": [
          "lunch",
          "debate",
          "season"
        ]
      },
      {
        "text": "Winter! shouts Nia. Snow days and hot cocoa by the fire!",
        "image": "/guided-reading/pages/gr-e-22-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-22-page-2.mp3",
        "highFrequencyWords": [
          "by",
          "the",
          "fire"
        ],
        "decodableWords": [
          "Winter",
          "shouts",
          "Nia",
          "Snow",
          "days",
          "hot",
          "cocoa"
        ]
      },
      {
        "text": "Spring! cries Jules. Flowers bloom and birds return to sing!",
        "image": "/guided-reading/pages/gr-e-22-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-22-page-3.mp3",
        "highFrequencyWords": [
          "to"
        ],
        "decodableWords": [
          "Spring",
          "cries",
          "Jules",
          "Flowers",
          "bloom",
          "birds",
          "return",
          "sing"
        ]
      },
      {
        "text": "Voices rise. Faces flush. No one will change their mind.",
        "image": "/guided-reading/pages/gr-e-22-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-22-page-4.mp3",
        "highFrequencyWords": [
          "No",
          "one",
          "will",
          "change",
          "their",
          "mind"
        ],
        "decodableWords": [
          "Voices",
          "rise",
          "Faces",
          "flush"
        ]
      },
      {
        "text": "Then Kira speaks. What if each season teaches us something?",
        "image": "/guided-reading/pages/gr-e-22-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-22-page-5.mp3",
        "highFrequencyWords": [
          "Then",
          "speaks",
          "What",
          "if",
          "each",
          "us",
          "something"
        ],
        "decodableWords": [
          "Kira",
          "season",
          "teaches"
        ]
      },
      {
        "text": "Table four grows quiet. Maybe being right is less important than being kind.",
        "image": "/guided-reading/pages/gr-e-22-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-22-page-6.mp3",
        "highFrequencyWords": [
          "Table",
          "four",
          "grows",
          "quiet",
          "being",
          "is",
          "less",
          "than",
          "being",
          "kind"
        ],
        "decodableWords": [
          "Maybe",
          "right",
          "important"
        ]
      }
    ]
  },
  {
    "id": "gr-e-23",
    "title": "The Day the Lights Went Out",
    "type": "fiction",
    "level": "E",
    "targetSkills": [
      "complex phonics",
      "community resilience",
      "descriptive language"
    ],
    "theme": "community coming together during hardship",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-23-cover.png",
    "pages": [
      {
        "text": "A storm knocks out the power on Maple Street.",
        "image": "/guided-reading/pages/gr-e-23-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-23-page-1.mp3",
        "highFrequencyWords": [
          "out",
          "the",
          "power",
          "on"
        ],
        "decodableWords": [
          "storm",
          "knocks",
          "Maple",
          "Street"
        ]
      },
      {
        "text": "Screens go black. Clocks blink. The fridge hums to silence.",
        "image": "/guided-reading/pages/gr-e-23-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-23-page-2.mp3",
        "highFrequencyWords": [
          "go",
          "black",
          "Clocks",
          "blink",
          "The",
          "to",
          "silence"
        ],
        "decodableWords": [
          "Screens",
          "fridge",
          "hums"
        ]
      },
      {
        "text": "Mr. Cruz brings flashlights. Ms. Reed shares candles from her pantry.",
        "image": "/guided-reading/pages/gr-e-23-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-23-page-3.mp3",
        "highFrequencyWords": [
          "from",
          "her"
        ],
        "decodableWords": [
          "Mr",
          "Cruz",
          "brings",
          "flashlights",
          "Ms",
          "Reed",
          "shares",
          "candles",
          "pantry"
        ]
      },
      {
        "text": "Neighbors gather in the street. They share food from warming grills.",
        "image": "/guided-reading/pages/gr-e-23-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-23-page-4.mp3",
        "highFrequencyWords": [
          "in",
          "the",
          "They",
          "share",
          "food",
          "from"
        ],
        "decodableWords": [
          "Neighbors",
          "gather",
          "street",
          "warming",
          "grills"
        ]
      },
      {
        "text": "Children play tag in the moonlight. Stories pass from porch to porch.",
        "image": "/guided-reading/pages/gr-e-23-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-23-page-5.mp3",
        "highFrequencyWords": [
          "play",
          "tag",
          "in",
          "the",
          "from",
          "to"
        ],
        "decodableWords": [
          "Children",
          "moonlight",
          "Stories",
          "pass",
          "porch",
          "porch"
        ]
      },
      {
        "text": "When the lights return, no one rushes inside. The dark brought them together.",
        "image": "/guided-reading/pages/gr-e-23-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-23-page-6.mp3",
        "highFrequencyWords": [
          "When",
          "the",
          "lights",
          "no",
          "one",
          "rushes",
          "inside",
          "The",
          "them",
          "together"
        ],
        "decodableWords": [
          "return",
          "dark",
          "brought"
        ]
      }
    ]
  },
  {
    "id": "gr-e-24",
    "title": "The Community Mural",
    "type": "fiction",
    "level": "E",
    "targetSkills": [
      "complex multisyllabic words",
      "collaborative creativity",
      "cultural celebration"
    ],
    "theme": "collective art and community identity",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-24-cover.png",
    "pages": [
      {
        "text": "A gray wall sits at the edge of the playground. It needs color.",
        "image": "/guided-reading/pages/gr-e-24-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-24-page-1.mp3",
        "highFrequencyWords": [
          "A",
          "at",
          "the",
          "of",
          "the",
          "It",
          "needs",
          "color"
        ],
        "decodableWords": [
          "gray",
          "wall",
          "sits",
          "edge",
          "playground"
        ]
      },
      {
        "text": "Ms. Park asks each student to paint one thing they love about their town.",
        "image": "/guided-reading/pages/gr-e-24-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-24-page-2.mp3",
        "highFrequencyWords": [
          "each",
          "student",
          "to",
          "paint",
          "one",
          "thing",
          "they",
          "love",
          "about",
          "their",
          "town"
        ],
        "decodableWords": [
          "Ms",
          "Park",
          "asks"
        ]
      },
      {
        "text": "Diego paints the library. Amara paints the farmers market. Lena paints the river.",
        "image": "/guided-reading/pages/gr-e-24-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-24-page-3.mp3",
        "highFrequencyWords": [
          "the",
          "the",
          "the"
        ],
        "decodableWords": [
          "Diego",
          "paints",
          "library",
          "Amara",
          "farmers",
          "market",
          "Lena",
          "river"
        ]
      },
      {
        "text": "They paint families, pets, and trees. Each brushstroke tells a story.",
        "image": "/guided-reading/pages/gr-e-24-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-24-page-4.mp3",
        "highFrequencyWords": [
          "and",
          "Each",
          "a",
          "story"
        ],
        "decodableWords": [
          "They",
          "paint",
          "families",
          "pets",
          "trees",
          "brushstroke",
          "tells"
        ]
      },
      {
        "text": "The mural grows. Faces, places, memories blend into one big picture.",
        "image": "/guided-reading/pages/gr-e-24-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-24-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "big"
        ],
        "decodableWords": [
          "mural",
          "grows",
          "Faces",
          "places",
          "memories",
          "blend",
          "picture"
        ]
      },
      {
        "text": "The whole town gathers to see. This wall belongs to everyone.",
        "image": "/guided-reading/pages/gr-e-24-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-24-page-6.mp3",
        "highFrequencyWords": [
          "The",
          "whole",
          "town",
          "to",
          "see",
          "This",
          "wall",
          "belongs",
          "to",
          "everyone"
        ],
        "decodableWords": [
          "gathers"
        ]
      }
    ]
  },
  {
    "id": "gr-e-25",
    "title": "A Promise to the Pond",
    "type": "fiction",
    "level": "E",
    "targetSkills": [
      "complex vowels",
      "environmental stewardship",
      "narrative arc"
    ],
    "theme": "protecting nature through commitment",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-e-25-cover.png",
    "pages": [
      {
        "text": "The pond behind school is full of trash. The water smells foul.",
        "image": "/guided-reading/pages/gr-e-25-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-25-page-1.mp3",
        "highFrequencyWords": [
          "The",
          "behind",
          "school",
          "is",
          "full",
          "of",
          "trash",
          "The",
          "water",
          "smells",
          "foul"
        ],
        "decodableWords": [
          "pond"
        ]
      },
      {
        "text": "No frogs croak. No dragonflies hover. The pond is dying.",
        "image": "/guided-reading/pages/gr-e-25-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-25-page-2.mp3",
        "highFrequencyWords": [
          "No",
          "No",
          "The",
          "pond",
          "is",
          "dying"
        ],
        "decodableWords": [
          "frogs",
          "croak",
          "dragonflies",
          "hover"
        ]
      },
      {
        "text": "Tara makes a pledge. We will clean this pond. We will save it.",
        "image": "/guided-reading/pages/gr-e-25-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-25-page-3.mp3",
        "highFrequencyWords": [
          "a",
          "We",
          "will",
          "this",
          "pond",
          "We",
          "will",
          "it"
        ],
        "decodableWords": [
          "Tara",
          "makes",
          "pledge",
          "clean",
          "save"
        ]
      },
      {
        "text": "Every Friday, they pull out bottles and bags. They scoop mud.",
        "image": "/guided-reading/pages/gr-e-25-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-25-page-4.mp3",
        "highFrequencyWords": [
          "out",
          "and",
          "They"
        ],
        "decodableWords": [
          "Every",
          "Friday",
          "pull",
          "bottles",
          "bags",
          "scoop",
          "mud"
        ]
      },
      {
        "text": "Week by week, the water clears. Green moss returns. Tadpoles wriggle.",
        "image": "/guided-reading/pages/gr-e-25-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-25-page-5.mp3",
        "highFrequencyWords": [
          "by",
          "the"
        ],
        "decodableWords": [
          "Week",
          "week",
          "water",
          "clears",
          "Green",
          "moss",
          "returns",
          "Tadpoles",
          "wriggle"
        ]
      },
      {
        "text": "At last, a frog croaks. Tara keeps her promise. Nature keeps its promise too.",
        "image": "/guided-reading/pages/gr-e-25-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-e-25-page-6.mp3",
        "highFrequencyWords": [
          "At",
          "a",
          "keeps",
          "her",
          "promise",
          "keeps",
          "its",
          "promise",
          "too"
        ],
        "decodableWords": [
          "last",
          "frog",
          "croaks",
          "Tara",
          "Nature"
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
    "id": "gr-c-36",
    "title": "Weather Tools",
    "type": "nonfiction",
    "level": "C",
    "targetSkills": [
      "science tools vocabulary",
      "how things work",
      "silent e"
    ],
    "theme": "tools meteorologists use",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-c-36-cover.png",
    "pages": [
      {
        "text": "How do we know what the weather will be? We use tools!",
        "image": "/guided-reading/pages/gr-c-36-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-36-page-1.mp3",
        "highFrequencyWords": [
          "do",
          "we",
          "know",
          "what",
          "the",
          "weather",
          "will",
          "be",
          "We",
          "use"
        ],
        "decodableWords": [
          "tools"
        ]
      },
      {
        "text": "A thermometer measures heat. The red line rises on a hot day.",
        "image": "/guided-reading/pages/gr-c-36-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-36-page-2.mp3",
        "highFrequencyWords": [
          "measures",
          "heat",
          "The",
          "red",
          "line",
          "on",
          "a",
          "hot",
          "day"
        ],
        "decodableWords": [
          "thermometer",
          "rises"
        ]
      },
      {
        "text": "A rain gauge collects drops. It shows how much rain fell.",
        "image": "/guided-reading/pages/gr-c-36-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-36-page-3.mp3",
        "highFrequencyWords": [
          "drops",
          "It",
          "shows",
          "how",
          "much",
          "rain",
          "fell"
        ],
        "decodableWords": [
          "gauge",
          "collects"
        ]
      },
      {
        "text": "A wind vane points where wind blows. It spins on top of a pole.",
        "image": "/guided-reading/pages/gr-c-36-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-36-page-4.mp3",
        "highFrequencyWords": [
          "where",
          "wind",
          "blows",
          "It",
          "spins",
          "on",
          "top",
          "of",
          "a",
          "pole"
        ],
        "decodableWords": [
          "vane",
          "points"
        ]
      },
      {
        "text": "A barometer measures air pressure. It helps predict storms.",
        "image": "/guided-reading/pages/gr-c-36-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-36-page-5.mp3",
        "highFrequencyWords": [
          "air",
          "pressure",
          "It",
          "helps",
          "predict",
          "storms"
        ],
        "decodableWords": [
          "barometer",
          "measures"
        ]
      },
      {
        "text": "With these tools, we can read the sky. Weather is no mystery!",
        "image": "/guided-reading/pages/gr-c-36-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-c-36-page-6.mp3",
        "highFrequencyWords": [
          "With",
          "these",
          "tools",
          "we",
          "can",
          "read",
          "the",
          "sky",
          "Weather",
          "is",
          "no",
          "mystery"
        ],
        "decodableWords": []
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
    "id": "gr-d-41",
    "title": "How Bridges Hold Weight",
    "type": "nonfiction",
    "level": "D",
    "targetSkills": [
      "engineering concepts",
      "structural vocabulary",
      "cause-effect"
    ],
    "theme": "bridge engineering basics",
    "source": "kimi_assets8_guided_reading_pack_01",
    "coverImage": "/guided-reading/covers/gr-d-41-cover.png",
    "pages": [
      {
        "text": "Bridges carry people and cars across rivers and valleys. How do they stay up?",
        "image": "/guided-reading/pages/gr-d-41-page-1.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-41-page-1.mp3",
        "highFrequencyWords": [
          "carry",
          "people",
          "and",
          "cars",
          "across",
          "rivers",
          "and",
          "valleys",
          "How",
          "do",
          "they",
          "stay",
          "up"
        ],
        "decodableWords": [
          "Bridges"
        ]
      },
      {
        "text": "A beam bridge is flat and simple. The beam pushes down on two strong posts called piers.",
        "image": "/guided-reading/pages/gr-d-41-page-2.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-41-page-2.mp3",
        "highFrequencyWords": [
          "is",
          "flat",
          "and",
          "simple",
          "The",
          "pushes",
          "down",
          "on",
          "two",
          "strong",
          "posts",
          "called"
        ],
        "decodableWords": [
          "beam",
          "bridge",
          "beam",
          "piers"
        ]
      },
      {
        "text": "An arch bridge curves up. The curve spreads weight to both ends.",
        "image": "/guided-reading/pages/gr-d-41-page-3.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-41-page-3.mp3",
        "highFrequencyWords": [
          "An",
          "up",
          "The",
          "curve",
          "spreads",
          "weight",
          "to",
          "both",
          "ends"
        ],
        "decodableWords": [
          "arch",
          "bridge",
          "curves"
        ]
      },
      {
        "text": "A suspension bridge hangs from cables. Towers hold the cables tight.",
        "image": "/guided-reading/pages/gr-d-41-page-4.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-41-page-4.mp3",
        "highFrequencyWords": [
          "A",
          "from",
          "cables",
          "hold",
          "the",
          "cables",
          "tight"
        ],
        "decodableWords": [
          "suspension",
          "bridge",
          "hangs",
          "Towers"
        ]
      },
      {
        "text": "The key is balance. Every part shares the load. Engineers test each bridge.",
        "image": "/guided-reading/pages/gr-d-41-page-5.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-41-page-5.mp3",
        "highFrequencyWords": [
          "The",
          "key",
          "is",
          "balance",
          "Every",
          "part",
          "shares",
          "the",
          "load",
          "Each",
          "bridge"
        ],
        "decodableWords": [
          "Engineers",
          "test"
        ]
      },
      {
        "text": "Next time you cross a bridge, look at its shape. Smart design keeps you safe!",
        "image": "/guided-reading/pages/gr-d-41-page-6.png",
        "pageAudio": "/guided-reading/audio/narration/gr-d-41-page-6.mp3",
        "highFrequencyWords": [
          "Next",
          "time",
          "you",
          "cross",
          "a",
          "bridge",
          "look",
          "at",
          "its",
          "shape",
          "keeps",
          "you",
          "safe"
        ],
        "decodableWords": [
          "Smart",
          "design"
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

export const guidedReadingBooks = rawGuidedReadingBooks.map(book => ({
  ...book,
  pages: book.pages.map(page => ({
    ...page,
    words: words(page.text)
  }))
}));

export function summarizeGuidedReadingRecord(record) {
  const pages = Object.values(record?.pages || {});
  const markEntries = pages.flatMap(page => Object.entries(page.wordMarks || {}));
  const correct = markEntries.filter(([, mark]) => mark === "correct").length;
  const support = markEntries.filter(([, mark]) => mark === "support").length;
  const attempted = correct + support;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const supportWords = [];

  pages.forEach((page, pageIndex) => {
    Object.entries(page.wordMarks || {}).forEach(([wordIndex, mark]) => {
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
    supportWords: [...new Set(supportWords.map(word => String(word).toLowerCase()))],
    pageNotes: pages
      .map((page, index) => ({ page: index + 1, note: page.note || "" }))
      .filter(item => item.note.trim()),
    wholeBookNote: record?.wholeBookNote || "",
    completedAt: record?.completedAt || ""
  };
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
