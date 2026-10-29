// Complete independently reviewed manuscripts, exact pronunciation records and teaching routines.
// Narrative text is frozen; refresh its full editorial review before changing it.
// Artwork descriptions reflect accepted final illustrations, independently of text approval.
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze); Object.freeze(value);
  }
  return value;
}

const MANUSCRIPTS = deepFreeze([
  {
    "id": "next-steps-01",
    "number": 1,
    "title": "In and On",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 6,
    "readingMode": "decodable",
    "type": "nonfiction",
    "narrator": "Sam",
    "focus": "Cumulative short-vowel spatial language; contrast in and on.",
    "practiceWords": [
      "hat",
      "tin",
      "mat"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tin",
        "graphemes": [
          "t",
          "i",
          "n"
        ],
        "sounds": [
          "t",
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      }
    ],
    "storyBibleReview": {
      "kind": "nonfiction",
      "storySpine": "Compare a hat resting on surfaces with the same hat inside a tin, then combine the relations: the hat is in the tin while the tin rests on Dad.",
      "topicQuestion": "What do in and on tell us about where things are?",
      "progression": "Hat on mat; hat on Dad; hat inside tin; tin on mat; close view of hat inside; tin with hat inside on Dad’s lap.",
      "synthesis": "An object can be inside a container while that container rests on another surface.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
    "props": [
      "One soft blue bucket hat, unchanged throughout.",
      "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
      "One cream mat with blue border.",
      "Dad remains present; the final tin rests securely on his lap."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds the soft blue hat beside the wide open empty silver tin on the mat. Dad sits nearby. Establish the comparison without displaying labels or the final nested arrangement.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "My hat is on the mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. The hat rests on the mat; its base visibly touches the mat. Sam points beside it; Dad sits nearby. The empty open tin waits next to the mat.",
        "imageAlt": "Sam points to a blue hat on a cream mat while Dad sits beside an open silver tin.",
        "state": {
          "page": 1,
          "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
          "visibleState": "The hat rests on the mat; its base visibly touches the mat. Sam points beside it; Dad sits nearby. The empty open tin waits next to the mat.",
          "propInvariants": [
            "One soft blue bucket hat, unchanged throughout.",
            "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
            "One cream mat with blue border.",
            "Dad remains present; the final tin rests securely on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam points to a blue hat on a cream mat while Dad sits beside an open silver tin.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "My hat is on Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam has placed the same blue hat on Dad’s head. Dad is seated in the same place; the open empty tin and mat remain visible.",
        "imageAlt": "Sam looks up at Dad, who wears the blue hat. The mat and silver tin are empty.",
        "state": {
          "page": 2,
          "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
          "visibleState": "Sam has placed the same blue hat on Dad’s head. Dad is seated in the same place; the open empty tin and mat remain visible.",
          "propInvariants": [
            "One soft blue bucket hat, unchanged throughout.",
            "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
            "One cream mat with blue border.",
            "Dad remains present; the final tin rests securely on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam looks up at Dad, who wears the blue hat. The mat and silver tin are empty.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "My hat is in a tin.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lowers the soft hat fully inside the wide tin on the mat. Show the hat below the near rim, with ample space inside and the hand releasing it.",
        "imageAlt": "Sam puts the blue hat inside the open tin on the mat. Dad sits beside him.",
        "state": {
          "page": 3,
          "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
          "visibleState": "Sam lowers the soft hat fully inside the wide tin on the mat. Show the hat below the near rim, with ample space inside and the hand releasing it.",
          "propInvariants": [
            "One soft blue bucket hat, unchanged throughout.",
            "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
            "One cream mat with blue border.",
            "Dad remains present; the final tin rests securely on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam puts the blue hat inside the open tin on the mat. Dad sits beside him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The tin is on the mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Wider view: the tin’s flat base rests directly on the mat, with the same hat still inside. Sam points to the contact between tin and mat; Dad remains nearby.",
        "imageAlt": "Sam points to the silver tin resting on the mat. The blue hat is inside.",
        "state": {
          "page": 4,
          "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
          "visibleState": "Wider view: the tin’s flat base rests directly on the mat, with the same hat still inside. Sam points to the contact between tin and mat; Dad remains nearby.",
          "propInvariants": [
            "One soft blue bucket hat, unchanged throughout.",
            "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
            "One cream mat with blue border.",
            "Dad remains present; the final tin rests securely on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam points to the silver tin resting on the mat. The blue hat is inside.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "My hat is in the tin.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Closer elevated view into that same tin, still on the mat. The blue hat lies entirely inside, below the visible rim. Sam’s hand points outside the opening without hiding the hat.",
        "imageAlt": "Sam points into the open tin, where the blue hat rests below the rim.",
        "state": {
          "page": 5,
          "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
          "visibleState": "Closer elevated view into that same tin, still on the mat. The blue hat lies entirely inside, below the visible rim. Sam’s hand points outside the opening without hiding the hat.",
          "propInvariants": [
            "One soft blue bucket hat, unchanged throughout.",
            "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
            "One cream mat with blue border.",
            "Dad remains present; the final tin rests securely on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam points into the open tin, where the blue hat rests below the rim.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The tin is on Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad holds the tin securely on his lap, its base resting across his thighs. The same hat remains visibly inside below the rim. Sam sits beside him; the empty mat remains on the floor.",
        "imageAlt": "Dad holds the tin on his lap with the blue hat inside. Sam sits beside him.",
        "state": {
          "page": 6,
          "setting": "A bright family sitting room. Dad sits beside a cream floor mat with a blue border; Sam demonstrates positions.",
          "visibleState": "Dad holds the tin securely on his lap, its base resting across his thighs. The same hat remains visibly inside below the rim. Sam sits beside him; the empty mat remains on the floor.",
          "propInvariants": [
            "One soft blue bucket hat, unchanged throughout.",
            "One wide round open silver tin, deep and wide enough for the soft hat to lie entirely below its rim. No lid exists in this sequence.",
            "One cream mat with blue border.",
            "Dad remains present; the final tin rests securely on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad holds the tin on his lap with the blue hat inside. Sam sits beside him.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Where is the hat at the end? Where is the tin?",
        "listenFor": "The hat is in the tin; the tin is on Dad’s lap. Accept pointing first, then model both prepositions."
      },
      "visual": {
        "page": 5,
        "prompt": "Look at the tin’s rim. Is any of the hat above it?",
        "lookFor": "The whole hat lies inside the opening, below the rim rather than resting on top of it."
      }
    },
    "levelRationale": "Six single-line pages, each at most six words; concrete repeated position frames and visible comparisons. No dialogue. Final nested relation is discussed orally rather than adding print.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "h",
        "sound": "h",
        "word": "hat",
        "model": "Say hat, notice the first /h/ sound, and point to h. Blend h–a–t, then read the whole sentence."
      },
      "decoding": {
        "words": [
          "hat",
          "tin",
          "mat"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "in",
          "meaning": "Inside a space or container."
        },
        {
          "word": "on",
          "meaning": "Resting on or touching the top of something."
        },
        {
          "word": "tin",
          "meaning": "An open metal container in this book."
        }
      ],
      "connectedReading": "After decoding each line, compare where the same hat is. At the end, use the picture to demonstrate both in and on. Revisit this short text as part of daily connected reading; narration remains supported reading.",
      "fluency": "Reread the repeated My hat is frame smoothly, giving in and on clear meaning without chanting individual words."
    },
    "reviewedTextFingerprint": "fnv1a64:a2aaba76d4865b93",
    "reviewedManuscriptSha256": "d512c837834e1e62dc79c292948f454ccaa336b45b17cc9f5d6e83344fa5e95e",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-02",
    "number": 2,
    "title": "In the Sun",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 9,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Cumulative short u in sun, run and hut.",
    "practiceWords": [
      "sun",
      "run",
      "hut"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hot",
        "graphemes": [
          "h",
          "o",
          "t"
        ],
        "sounds": [
          "h",
          "ɑ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "run",
        "graphemes": [
          "r",
          "u",
          "n"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sun",
        "graphemes": [
          "s",
          "u",
          "n"
        ],
        "sounds": [
          "s",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to cool down after running, but sitting on the sunny mat does not help, so he moves into the shady hut and rests comfortably.",
      "failedAttempt": "Sam stops running and sits on the mat, but he is still hot.",
      "turn": "Sam notices that the mat is in direct sun and chooses the shaded hut.",
      "resolution": "After resting inside the hut, Sam feels comfortable.",
      "canonIds": [
        "SMALL-SAM"
      ]
    },
    "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
    "props": [
      "One cream mat remains in direct sun.",
      "One fixed blue open-front play hut with an open bench inside.",
      "No drinks, fans or unexplained cooling props appear."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam pauses beside the sunny mat, with the open shady hut clearly visible nearby. Keep the setting inviting and ordinary.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I run in the sun.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam runs along the garden path past the cream mat. The blue hut stands in its fixed position behind him.",
        "imageAlt": "Sam runs along a sunny path beside a cream mat and an open blue hut.",
        "state": {
          "page": 1,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam runs along the garden path past the cream mat. The blue hut stands in its fixed position behind him.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam runs along a sunny path beside a cream mat and an open blue hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I am hot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam stops beside the mat, cheeks slightly flushed and one hand at his forehead; ordinary exertion, no medical distress.",
        "imageAlt": "Sam stands beside the mat with one hand on his forehead.",
        "state": {
          "page": 2,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam stops beside the mat, cheeks slightly flushed and one hand at his forehead; ordinary exertion, no medical distress.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam stands beside the mat with one hand on his forehead.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I sit on a mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sits on the cream mat in direct sunlight. The hut remains nearby, its interior visibly shaded.",
        "imageAlt": "Sam sits cross-legged on the sunny mat near the blue hut.",
        "state": {
          "page": 3,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam sits on the cream mat in direct sunlight. The hut remains nearby, its interior visibly shaded.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam sits cross-legged on the sunny mat near the blue hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I am hot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam is still seated on the mat, fanning his face with an empty hand. Keep the sunlit ground and same hut visible.",
        "imageAlt": "Sam fans his face with his hand while sitting on the sunny mat.",
        "state": {
          "page": 4,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam is still seated on the mat, fanning his face with an empty hand. Keep the sunlit ground and same hut visible.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam fans his face with his hand while sitting on the sunny mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "My mat is in the sun.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam looks down at the mat and its bright sunlit surroundings, then toward the shade inside the open hut. No printed sun symbols or labels.",
        "imageAlt": "Sam points to the sunny mat and looks toward the blue hut.",
        "state": {
          "page": 5,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam looks down at the mat and its bright sunlit surroundings, then toward the shade inside the open hut. No printed sun symbols or labels.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam points to the sunny mat and looks toward the blue hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I run to a hut.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam runs the few steps from the mat toward the open hut. Keep the mat behind him in its original sunny place.",
        "imageAlt": "Sam runs toward the open blue hut, leaving the mat in the sun.",
        "state": {
          "page": 6,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam runs the few steps from the mat toward the open hut. Keep the mat behind him in its original sunny place.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam runs toward the open blue hut, leaving the mat in the sun.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "I sit in the hut.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sits on the bench inside the shaded hut, feet relaxed and hands at his sides. The sunlit mat is visible through the opening.",
        "imageAlt": "Sam sits on a bench inside the blue hut. The mat is still outside in the sun.",
        "state": {
          "page": 7,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "Sam sits on the bench inside the shaded hut, feet relaxed and hands at his sides. The sunlit mat is visible through the opening.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam sits on a bench inside the blue hut. The mat is still outside in the sun.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I am not hot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. After a quiet rest, Sam sits comfortably on the same bench with relaxed shoulders and a small smile. Sunlight remains outside; the mat has not moved.",
        "imageAlt": "Sam sits on the bench in the shady hut with his hands in his lap. The mat is outside in the sun.",
        "state": {
          "page": 8,
          "setting": "One sunny garden with a cream mat on the lawn and an open-front blue play hut nearby. The hut casts a broad patch of shade.",
          "visibleState": "After a quiet rest, Sam sits comfortably on the same bench with relaxed shoulders and a small smile. Sunlight remains outside; the mat has not moved.",
          "propInvariants": [
            "One cream mat remains in direct sun.",
            "One fixed blue open-front play hut with an open bench inside.",
            "No drinks, fans or unexplained cooling props appear."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam sits on the bench in the shady hut with his hands in his lap. The mat is outside in the sun.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam change when sitting on the mat does not help?",
        "listenFor": "He moves from the sunshine to the shady hut and rests there."
      },
      "visual": {
        "page": 5,
        "prompt": "What shows why the mat is still a hot place to sit?",
        "lookFor": "The mat is in bright direct sunlight, while the hut has shade."
      }
    },
    "levelRationale": "Eight brief single-line pages use familiar first-person action and one concrete cause. A repeated feeling changes after a visible change of place; no dialogue or complex syntax.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "u",
        "sound": "ʌ",
        "word": "sun",
        "model": "Say sun and stretch its middle /ʌ/. Find u, then blend s–u–n without adding extra vowel sounds."
      },
      "decoding": {
        "words": [
          "sun",
          "run",
          "hut"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "hut",
          "meaning": "A small shelter."
        },
        {
          "word": "sun",
          "meaning": "The bright light here comes from the sun."
        }
      ],
      "connectedReading": "Read the print first, then trace Sam’s move from the mat to the hut. Ask the child to retell what did not work and what he changed. Reread during daily connected reading.",
      "fluency": "Read I am hot the same way on both occasions; give the final not its contrasting meaning."
    },
    "reviewedTextFingerprint": "fnv1a64:f0dceaf6e6c58c27",
    "reviewedManuscriptSha256": "b1fcde570c4d04a604a973f0448204a0c99b3d2dffcdf1df7aeb6b91e8bcaeb2",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-03",
    "number": 3,
    "title": "The Cat Can Run",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 10,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Cumulative hard c and short vowels in connected action.",
    "practiceWords": [
      "cat",
      "rag",
      "run"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "run",
        "graphemes": [
          "r",
          "u",
          "n"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants Cat to play, but a small tug of the rag does not entice Cat off the rug; Sam moves away with it, and Cat follows and pounces.",
      "failedAttempt": "Sam tugs the rag in one place; Cat remains on the rug.",
      "turn": "Sam changes from a tiny stationary tug to moving across the floor with the rag.",
      "resolution": "Cat runs after the moving rag and lands on it.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-CAT"
      ]
    },
    "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
    "props": [
      "One soft yellow toy rag, long enough to drag safely but with no strings.",
      "One tan oval rug remains fixed.",
      "Cat keeps ginger/white markings, green collar, four paws and one tail."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam kneels beside the resting cat with the yellow rag on the floor between them. Show the clear play space and fixed tan rug.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "The cat is on a rug.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Cat rests on the tan rug. Sam sits nearby, holding one end of the yellow rag on the floor.",
        "imageAlt": "Cat lies on a tan rug while Sam sits beside it holding a yellow rag.",
        "state": {
          "page": 1,
          "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
          "visibleState": "Cat rests on the tan rug. Sam sits nearby, holding one end of the yellow rag on the floor.",
          "propInvariants": [
            "One soft yellow toy rag, long enough to drag safely but with no strings.",
            "One tan oval rug remains fixed.",
            "Cat keeps ginger/white markings, green collar, four paws and one tail."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Cat lies on a tan rug while Sam sits beside it holding a yellow rag.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I tug a rag.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lightly tugs the rag toward himself along the floor. Cat watches from the rug without standing.",
        "imageAlt": "Sam pulls the yellow rag toward himself while Cat stays on the rug.",
        "state": {
          "page": 2,
          "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
          "visibleState": "Sam lightly tugs the rag toward himself along the floor. Cat watches from the rug without standing.",
          "propInvariants": [
            "One soft yellow toy rag, long enough to drag safely but with no strings.",
            "One tan oval rug remains fixed.",
            "Cat keeps ginger/white markings, green collar, four paws and one tail."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam pulls the yellow rag toward himself while Cat stays on the rug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The cat is on the rug.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Cat remains lying on the rug, paws tucked. Sam pauses with the same rag at his feet.",
        "imageAlt": "Sam kneels beside Cat, with the yellow rag resting on the floor.",
        "state": {
          "page": 3,
          "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
          "visibleState": "Cat remains lying on the rug, paws tucked. Sam pauses with the same rag at his feet.",
          "propInvariants": [
            "One soft yellow toy rag, long enough to drag safely but with no strings.",
            "One tan oval rug remains fixed.",
            "Cat keeps ginger/white markings, green collar, four paws and one tail."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam kneels beside Cat, with the yellow rag resting on the floor.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I run.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam begins running across the clear floor, holding the rag low so its far end slides along the ground. Cat turns toward the moving rag.",
        "imageAlt": "Sam runs across the floor with the yellow rag trailing behind him. Cat crouches on the rug.",
        "state": {
          "page": 4,
          "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
          "visibleState": "Sam begins running across the clear floor, holding the rag low so its far end slides along the ground. Cat turns toward the moving rag.",
          "propInvariants": [
            "One soft yellow toy rag, long enough to drag safely but with no strings.",
            "One tan oval rug remains fixed.",
            "Cat keeps ginger/white markings, green collar, four paws and one tail."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam runs across the floor with the yellow rag trailing behind him. Cat crouches on the rug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "The cat and I run.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam and Cat run in the same direction, Cat following the yellow rag that trails behind Sam’s hand. Keep natural four-paw feline anatomy.",
        "imageAlt": "Cat runs after Sam and the yellow rag across the clear floor.",
        "state": {
          "page": 5,
          "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
          "visibleState": "Sam and Cat run in the same direction, Cat following the yellow rag that trails behind Sam’s hand. Keep natural four-paw feline anatomy.",
          "propInvariants": [
            "One soft yellow toy rag, long enough to drag safely but with no strings.",
            "One tan oval rug remains fixed.",
            "Cat keeps ginger/white markings, green collar, four paws and one tail."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Cat runs after Sam and the yellow rag across the clear floor.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The cat is on the rag.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam stops and releases the rag. Cat pounces and settles with front paws and body on it; Sam crouches beside Cat, smiling. The rug stays behind them.",
        "imageAlt": "Cat lies on the yellow rag while Sam crouches beside it.",
        "state": {
          "page": 6,
          "setting": "One bright sitting room with a tan oval rug, cream floor and a low blue sofa. The floor beside the rug is clear for play.",
          "visibleState": "Sam stops and releases the rag. Cat pounces and settles with front paws and body on it; Sam crouches beside Cat, smiling. The rug stays behind them.",
          "propInvariants": [
            "One soft yellow toy rag, long enough to drag safely but with no strings.",
            "One tan oval rug remains fixed.",
            "Cat keeps ginger/white markings, green collar, four paws and one tail."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Cat lies on the yellow rag while Sam crouches beside it.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How does Sam get Cat to play?",
        "listenFor": "A small tug does not work. Sam runs with the rag, and Cat follows it."
      },
      "visual": {
        "page": 6,
        "prompt": "What shows that Cat has joined the game?",
        "lookFor": "Cat has left the rug and is on the yellow rag beside Sam."
      }
    },
    "levelRationale": "Six single-line pages with familiar actions, repeated cat/on frames and a concrete action payoff. The change from sitting to following is supported directly by the illustrations.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "c",
        "sound": "k",
        "word": "cat",
        "model": "Say cat, listen for the first /k/, and find c. Blend c–a–t and read the whole line."
      },
      "decoding": {
        "words": [
          "cat",
          "rag",
          "run"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "tug",
          "meaning": "Pull something a little."
        },
        {
          "word": "rag",
          "meaning": "The soft piece of cloth used as a toy here."
        }
      ],
      "connectedReading": "Read the lines without guessing from the picture. Afterward, compare the first tug with the running game and retell the change.",
      "fluency": "Reread the two cat-on-rug lines smoothly, then give the final rag ending a playful landing."
    },
    "reviewedTextFingerprint": "fnv1a64:d0b57b81b25b42e7",
    "reviewedManuscriptSha256": "399b69f33d4e6c8e09f8be4857e3b72c39941e5e018e4ca359e8c7ed9cf3e76f",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-04",
    "number": 4,
    "title": "I Hug Dad",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 10,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Short u in hum and hug; meaningful change in a repeated feeling.",
    "practiceWords": [
      "hum",
      "hug",
      "sad"
    ],
    "exceptions": [
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      }
    ],
    "wordRecords": [
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hug",
        "graphemes": [
          "h",
          "u",
          "g"
        ],
        "sounds": [
          "h",
          "ʌ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "hum",
        "graphemes": [
          "h",
          "u",
          "m"
        ],
        "sounds": [
          "h",
          "ʌ",
          "m"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sad",
        "graphemes": [
          "s",
          "a",
          "d"
        ],
        "sounds": [
          "s",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam sees that Dad is sad and tries humming to cheer him, but Dad stays quiet; Sam sits close and hugs him, and they end humming together.",
      "failedAttempt": "Sam hums nearby, but Dad remains sad and quiet.",
      "turn": "Sam approaches after Dad opens his arms, then offers a hug.",
      "resolution": "Dad relaxes and joins Sam in humming. This is one ordinary moment of comfort, not a claim that hugs solve every sadness.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
    "props": [
      "Dad’s blue armchair stays in the same place.",
      "No broken object, illness, gift or unexplained cause is introduced.",
      "Dad invites the hug with open arms; Sam chooses to sit on his lap."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam stands beside Dad’s chair, looking toward Dad’s quiet face. Keep the gentle domestic premise without a dramatic unexplained cause.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad is sad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad sits in the blue armchair with lowered shoulders and a downturned mouth. Sam stands beside the cream footstool.",
        "imageAlt": "Dad sits in a blue armchair with his shoulders lowered. Sam stands beside a cream footstool and looks at him.",
        "state": {
          "page": 1,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Dad sits in the blue armchair with lowered shoulders and a downturned mouth. Sam stands beside the cream footstool.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad sits in a blue armchair with his shoulders lowered. Sam stands beside a cream footstool and looks at him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I hum.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam hums softly beside the chair, mouth closed and cheeks relaxed. Dad listens but remains subdued. Do not draw musical symbols or words.",
        "imageAlt": "Sam stands beside Dad with his eyes closed and lips together. Dad sits quietly in the blue chair.",
        "state": {
          "page": 2,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Sam hums softly beside the chair, mouth closed and cheeks relaxed. Dad listens but remains subdued. Do not draw musical symbols or words.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam stands beside Dad with his eyes closed and lips together. Dad sits quietly in the blue chair.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dad is sad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad remains quiet, then opens his arms toward Sam. Sam stands close enough to accept the invitation.",
        "imageAlt": "Dad opens his arms toward Sam, who stands beside the blue chair.",
        "state": {
          "page": 3,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Dad remains quiet, then opens his arms toward Sam. Sam stands close enough to accept the invitation.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad opens his arms toward Sam, who stands beside the blue chair.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I sit on Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sits comfortably across Dad’s lap; Dad supports him with one arm. Both feet and hands remain anatomically clear.",
        "imageAlt": "Sam sits on Dad’s lap in the blue armchair. Dad supports him with one arm.",
        "state": {
          "page": 4,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Sam sits comfortably across Dad’s lap; Dad supports him with one arm. Both feet and hands remain anatomically clear.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam sits on Dad’s lap in the blue armchair. Dad supports him with one arm.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I hug Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam wraps his arms around Dad’s middle in a gentle hug. Dad returns the hug naturally.",
        "imageAlt": "Sam wraps his arms around Dad, and Dad hugs him in the blue chair.",
        "state": {
          "page": 5,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Sam wraps his arms around Dad’s middle in a gentle hug. Dad returns the hug naturally.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam wraps his arms around Dad, and Dad hugs him in the blue chair.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Dad is not sad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad relaxes and smiles softly at Sam, who is still sitting on his lap. The physical arrangement stays unchanged.",
        "imageAlt": "Dad smiles at Sam, who is sitting on his lap.",
        "state": {
          "page": 6,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Dad relaxes and smiles softly at Sam, who is still sitting on his lap. The physical arrangement stays unchanged.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad smiles at Sam, who is sitting on his lap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dad and I hum.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad and Sam sit close, both humming softly with closed relaxed lips and small smiles. Keep the gentle shared ending, with no musical text.",
        "imageAlt": "Dad and Sam sit together with closed eyes and small smiles.",
        "state": {
          "page": 7,
          "setting": "One quiet family sitting room with a roomy blue armchair, a low cream footstool and a sunny window.",
          "visibleState": "Dad and Sam sit close, both humming softly with closed relaxed lips and small smiles. Keep the gentle shared ending, with no musical text.",
          "propInvariants": [
            "Dad’s blue armchair stays in the same place.",
            "No broken object, illness, gift or unexplained cause is introduced.",
            "Dad invites the hug with open arms; Sam chooses to sit on his lap."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad and Sam sit together with closed eyes and small smiles.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam try, and what do Sam and Dad do together at the end?",
        "listenFor": "Sam first hums alone, then offers a hug. They end humming together."
      },
      "visual": {
        "page": 3,
        "prompt": "How does Dad show that Sam can come close?",
        "lookFor": "Dad opens his arms toward Sam."
      }
    },
    "levelRationale": "Seven very short single-line present-tense pages. Concrete familiar affection and a repeated feeling keep inference bounded; no dialogue or abstract moral.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "u",
        "sound": "ʌ",
        "word": "hug",
        "model": "Say hug, listen for /ʌ/ in the middle, and find u. Blend h–u–g, then read the sentence."
      },
      "decoding": {
        "words": [
          "hum",
          "hug",
          "sad"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "hum",
          "meaning": "Make a tune with your lips closed."
        },
        {
          "word": "hug",
          "meaning": "Put your arms gently around someone who wants a hug."
        }
      ],
      "connectedReading": "Read each line and keep track of who hums. Invite an oral retelling of Sam’s two attempts, without asking the child to disclose a personal sad event.",
      "fluency": "Read the short lines warmly. Contrast Sam humming alone with Dad and I in the last line."
    },
    "reviewedTextFingerprint": "fnv1a64:3330598b1df1a274",
    "reviewedManuscriptSha256": "c14bc991a631de4e78649dcce9242558077f7fdbf14529b8f1b31429168eb9e0",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-05",
    "number": 5,
    "title": "Tag Dad",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 10,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Hard g in tag; simple present-tense game actions and an invitation.",
    "practiceWords": [
      "tag",
      "run",
      "sit"
    ],
    "exceptions": [
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "wordRecords": [
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "uː"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "iː"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "run",
        "graphemes": [
          "r",
          "u",
          "n"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "tag",
        "graphemes": [
          "t",
          "a",
          "g"
        ],
        "sounds": [
          "t",
          "æ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "uː"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to tag Dad but cannot catch him by chasing; Sam stops at Dad’s looping path, tags him as he returns, and invites Dad to chase next.",
      "failedAttempt": "Sam runs after Dad but cannot reach him.",
      "turn": "Sam notices Dad’s route around the hut and waits beside it.",
      "resolution": "Sam gently tags Dad, then invites Dad to take a turn chasing.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
    "props": [
      "One fixed hut and one low bench beside its path.",
      "No equipment, scores or labels.",
      "A tag is a gentle hand touch to Dad’s forearm."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam reaches playfully toward Dad on the clear garden path. Show the hut and bench that establish the loop.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I can tag Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam and Dad face each other at the start of a playful tag game. Sam reaches out but has not touched Dad.",
        "imageAlt": "Sam reaches toward Dad on a garden path. A blue hut and a low bench stand behind them.",
        "state": {
          "page": 1,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Sam and Dad face each other at the start of a playful tag game. Sam reaches out but has not touched Dad.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam reaches toward Dad on a garden path. A blue hut and a low bench stand behind them.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Dad can run.\nI run.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad runs along the looping path and Sam follows at a safe distance. The hut and bench remain fixed.",
        "imageAlt": "Sam runs behind Dad along the garden path beside the blue hut.",
        "state": {
          "page": 2,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Dad runs along the looping path and Sam follows at a safe distance. The hut and bench remain fixed.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam runs behind Dad along the garden path beside the blue hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I do not tag Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam reaches toward Dad’s arm but is still a step short; Dad has rounded the hut toward the far side.",
        "imageAlt": "Sam reaches toward Dad as they run around the hut. His hand does not touch Dad.",
        "state": {
          "page": 3,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Sam reaches toward Dad’s arm but is still a step short; Dad has rounded the hut toward the far side.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam reaches toward Dad as they run around the hut. His hand does not touch Dad.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I do not run.\nI sit.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sits on the low bench next to the path, looking toward the hut’s return corner. Dad continues around the same loop.",
        "imageAlt": "Sam sits on the bench beside the hut while Dad runs around its far side.",
        "state": {
          "page": 4,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Sam sits on the low bench next to the path, looking toward the hut’s return corner. Dad continues around the same loop.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam sits on the bench beside the hut while Dad runs around its far side.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dad is at the hut.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad comes around the hut’s corner toward the bench. Sam leans forward, ready to stand beside the route; no hidden ambush.",
        "imageAlt": "Dad comes around the hut toward the bench. Sam turns toward him and leans forward.",
        "state": {
          "page": 5,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Dad comes around the hut’s corner toward the bench. Sam leans forward, ready to stand beside the route; no hidden ambush.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad comes around the hut toward the bench. Sam turns toward him and leans forward.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I tag Dad!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam stands and gently touches Dad’s forearm as Dad arrives beside the bench. Both are smiling.",
        "imageAlt": "Sam gently touches Dad’s forearm beside the bench. They smile at each other.",
        "state": {
          "page": 6,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Sam stands and gently touches Dad’s forearm as Dad arrives beside the bench. Both are smiling.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam gently touches Dad’s forearm beside the bench. They smile at each other.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "“You can tag me!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam steps away from Dad and gestures back toward himself, inviting Dad’s turn to chase. Show Sam as the speaker, with no speech lettering.",
        "imageAlt": "Sam points to himself while facing Dad on the garden path.",
        "state": {
          "page": 7,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Sam steps away from Dad and gestures back toward himself, inviting Dad’s turn to chase. Show Sam as the speaker, with no speech lettering.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam points to himself while facing Dad on the garden path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Dad and I run.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam runs ahead on the same clear path with Dad following. The roles are visibly reversed from page 2.",
        "imageAlt": "Dad runs after Sam along the garden path. Sam looks back at him.",
        "state": {
          "page": 8,
          "setting": "One open garden loop around a blue play hut, with a low bench beside the path and no obstacles in the running space.",
          "visibleState": "Sam runs ahead on the same clear path with Dad following. The roles are visibly reversed from page 2.",
          "propInvariants": [
            "One fixed hut and one low bench beside its path.",
            "No equipment, scores or labels.",
            "A tag is a gentle hand touch to Dad’s forearm."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad runs after Sam along the garden path. Sam looks back at him.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam do differently to tag Dad?",
        "listenFor": "He stops chasing and waits beside Dad’s route. After tagging Dad, he gives Dad a turn."
      },
      "visual": {
        "page": 5,
        "prompt": "Why is the bench a useful place for Sam to wait?",
        "lookFor": "Dad’s path around the hut passes right beside the bench."
      }
    },
    "levelRationale": "Eight brief pages with paired simple sentences, a negative contrast, a spatially clear plan and one dialogue page. The slight planning inference supports B rather than A.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "g",
        "sound": "ɡ",
        "word": "tag",
        "model": "Say tag, listen for the final /ɡ/, and point to g. Blend t–a–g; do not add an extra uh after g."
      },
      "decoding": {
        "words": [
          "tag",
          "run",
          "sit"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "tag",
          "meaning": "Touch someone gently in a chasing game."
        },
        {
          "word": "me",
          "meaning": "The person speaking: Sam on page 7."
        }
      ],
      "connectedReading": "Decode the printed action, then trace Dad’s route in the pictures. Ask the child to explain Sam’s change and the final role swap.",
      "fluency": "Pause naturally between the two short sentences. Read the invitation with friendly excitement, not speed."
    },
    "reviewedTextFingerprint": "fnv1a64:91daa9b9559c81c1",
    "reviewedManuscriptSha256": "94ad50d5c7b6d3f2108dbba7275c63601ce8259be9df4f071a9137855473345e",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-06",
    "number": 6,
    "title": "A Dot on My Cap",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 11,
    "readingMode": "decodable",
    "type": "nonfiction",
    "narrator": "Dot",
    "focus": "Short i/a and p in a purposeful dip–dab sequence.",
    "practiceWords": [
      "dip",
      "dab",
      "cap"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "dab",
        "graphemes": [
          "d",
          "a",
          "b"
        ],
        "sounds": [
          "d",
          "æ",
          "b"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dip",
        "graphemes": [
          "d",
          "i",
          "p"
        ],
        "sounds": [
          "d",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "iː"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "pot",
        "graphemes": [
          "p",
          "o",
          "t"
        ],
        "sounds": [
          "p",
          "ɑ",
          "t"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "storyBibleReview": {
      "kind": "nonfiction",
      "storySpine": "Follow how a rag makes a painted dot: set out the tools, dip the cloth, dab once, notice the mark, repeat, and wear the finished cap.",
      "topicQuestion": "How can a piece of cloth make dots on a cap?",
      "progression": "Prepare the rag; dip its corner; press it to the cap; inspect one dot; press again; show the completed cap in use.",
      "synthesis": "Dipping and dabbing leaves marks that decorate the cap.",
      "canonIds": [
        "SMALL-DOT"
      ]
    },
    "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
    "props": [
      "One plain white folded paper cap, large enough to wear.",
      "One small folded blue cotton rag with a rounded stamping corner.",
      "One open wide yellow pot of washable red paint.",
      "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
      "No lettering, brushes or additional paint colors. Paint dries before wearing."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot holds the plain white paper cap beside the folded blue rag, yellow paint pot and protective mat. Establish the tools without the finished pattern.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "My rag is on a mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. The folded blue rag rests on the cream mat beside the unmarked paper cap and open yellow pot of red paint. Dot sits at the table.",
        "imageAlt": "Dot sits at a table with a folded blue rag, a white paper cap and a yellow pot of red paint.",
        "state": {
          "page": 1,
          "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
          "visibleState": "The folded blue rag rests on the cream mat beside the unmarked paper cap and open yellow pot of red paint. Dot sits at the table.",
          "propInvariants": [
            "One plain white folded paper cap, large enough to wear.",
            "One small folded blue cotton rag with a rounded stamping corner.",
            "One open wide yellow pot of washable red paint.",
            "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
            "No lettering, brushes or additional paint colors. Paint dries before wearing."
          ],
          "cast": [
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot sits at a table with a folded blue rag, a white paper cap and a yellow pot of red paint.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I dip it in a pot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot dips just one rounded corner of the folded blue rag into the red paint. The plain cap remains on the mat.",
        "imageAlt": "Dot holds the blue rag above the paint pot. Its lower corner is red.",
        "state": {
          "page": 2,
          "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
          "visibleState": "Dot dips just one rounded corner of the folded blue rag into the red paint. The plain cap remains on the mat.",
          "propInvariants": [
            "One plain white folded paper cap, large enough to wear.",
            "One small folded blue cotton rag with a rounded stamping corner.",
            "One open wide yellow pot of washable red paint.",
            "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
            "No lettering, brushes or additional paint colors. Paint dries before wearing."
          ],
          "cast": [
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot holds the blue rag above the paint pot. Its lower corner is red.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I dab on my cap.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot presses the painted cloth corner onto the front-left panel of the paper cap, making the first round red dot.",
        "imageAlt": "Dot dabs the white paper cap with the blue rag. One red dot is on the front.",
        "state": {
          "page": 3,
          "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
          "visibleState": "Dot presses the painted cloth corner onto the front-left panel of the paper cap, making the first round red dot.",
          "propInvariants": [
            "One plain white folded paper cap, large enough to wear.",
            "One small folded blue cotton rag with a rounded stamping corner.",
            "One open wide yellow pot of washable red paint.",
            "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
            "No lettering, brushes or additional paint colors. Paint dries before wearing."
          ],
          "cast": [
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot dabs the white paper cap with the blue rag. One red dot is on the front.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "A dot is on my cap.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot lifts the rag and holds the cap so its single red dot is plainly visible. No second mark yet.",
        "imageAlt": "Dot holds up the paper cap with one red dot. She holds the blue rag in her other hand.",
        "state": {
          "page": 4,
          "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
          "visibleState": "Dot lifts the rag and holds the cap so its single red dot is plainly visible. No second mark yet.",
          "propInvariants": [
            "One plain white folded paper cap, large enough to wear.",
            "One small folded blue cotton rag with a rounded stamping corner.",
            "One open wide yellow pot of washable red paint.",
            "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
            "No lettering, brushes or additional paint colors. Paint dries before wearing."
          ],
          "cast": [
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot holds up the paper cap with one red dot. She holds the blue rag in her other hand.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I dab on my cap.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot presses the same cloth corner onto the front-right panel, making the second red dot. The first dot remains unchanged.",
        "imageAlt": "Dot dabs a second red dot onto the paper cap. One red dot is on each side of the front band.",
        "state": {
          "page": 5,
          "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
          "visibleState": "Dot presses the same cloth corner onto the front-right panel, making the second red dot. The first dot remains unchanged.",
          "propInvariants": [
            "One plain white folded paper cap, large enough to wear.",
            "One small folded blue cotton rag with a rounded stamping corner.",
            "One open wide yellow pot of washable red paint.",
            "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
            "No lettering, brushes or additional paint colors. Paint dries before wearing."
          ],
          "cast": [
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot dabs a second red dot onto the paper cap. One red dot is on each side of the front band.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "My cap is on me.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. After the paint has dried, Dot wears the white paper cap with exactly two red dots. The rag and paint pot remain on the mat; Dot’s hands and normal clothes are clean.",
        "imageAlt": "Dot wears the white paper cap with two red dots. The blue rag and paint pot are on the table.",
        "state": {
          "page": 6,
          "setting": "One child-height art table beside a bright window. Dot works on a cream protective mat.",
          "visibleState": "After the paint has dried, Dot wears the white paper cap with exactly two red dots. The rag and paint pot remain on the mat; Dot’s hands and normal clothes are clean.",
          "propInvariants": [
            "One plain white folded paper cap, large enough to wear.",
            "One small folded blue cotton rag with a rounded stamping corner.",
            "One open wide yellow pot of washable red paint.",
            "Exactly one red dot after page 3, two after page 5; the final cap has two dots.",
            "No lettering, brushes or additional paint colors. Paint dries before wearing."
          ],
          "cast": [
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot wears the white paper cap with two red dots. The blue rag and paint pot are on the table.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How does Dot make the marks on her cap?",
        "listenFor": "She dips the cloth in paint, dabs the cap, and repeats the action."
      },
      "visual": {
        "page": 4,
        "prompt": "What mark does the first dab leave?",
        "lookFor": "One red dot is visible on the white cap."
      }
    },
    "levelRationale": "Six single-line pages in a concrete ordered process. Repetition changes the visible number of marks and ends with the completed object in use; no fictional failed-attempt requirement is imposed.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "p",
        "sound": "p",
        "word": "dip",
        "model": "Say dip, listen for the final /p/, and find p. Blend d–i–p and compare it with the final p in cap."
      },
      "decoding": {
        "words": [
          "dip",
          "dab",
          "cap"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "dip",
          "meaning": "Put a small part into something, then lift it out."
        },
        {
          "word": "dab",
          "meaning": "Press lightly once."
        },
        {
          "word": "cap",
          "meaning": "The paper hat Dot decorates here."
        }
      ],
      "connectedReading": "Read each step, then explain dip and dab with empty-hand gestures. Retell the process in order. If making a cap later, use washable paint and let it dry before wearing.",
      "fluency": "Reread I dab on my cap as the same useful action with a new mark each time; pause at each full stop."
    },
    "reviewedTextFingerprint": "fnv1a64:5b5f3e7f9be0d49e",
    "reviewedManuscriptSha256": "beee5d545e5be74edf481a9145d01c4a7d9f1837a3afcba28c00539cc07e53b4",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-07",
    "number": 7,
    "title": "A Map",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 11,
    "readingMode": "decodable",
    "type": "nonfiction",
    "narrator": "Sam",
    "focus": "Cumulative p in map; distinguish real landmarks from their representations.",
    "practiceWords": [
      "map",
      "log",
      "hut"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Exact HFW introduced in Cycle 5. Long o is not the short-o correspondence; this whole word also precedes regular g in Cycle 10. No general long-vowel or g rule follows."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "ɡ",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 5. Long o is not the short-o correspondence; this whole word also precedes regular g in Cycle 10. No general long-vowel or g rule follows."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "log",
        "graphemes": [
          "l",
          "o",
          "g"
        ],
        "sounds": [
          "l",
          "ɑ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "map",
        "graphemes": [
          "m",
          "a",
          "p"
        ],
        "sounds": [
          "m",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "iː"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "storyBibleReview": {
      "kind": "nonfiction",
      "storySpine": "Observe a hut and log, find their matching representations on a simple map, then use that map’s path to reach the hut.",
      "topicQuestion": "How can a map show places and help us go somewhere?",
      "progression": "Look at the real hut and log; inspect their matching map; identify each feature; use the connecting route.",
      "synthesis": "A map shows where real places are in relation to one another and can support a route to a destination.",
      "canonIds": [
        "SMALL-SAM"
      ]
    },
    "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
    "props": [
      "One blue hut and one short tan log remain in fixed positions.",
      "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
      "The map orientation stays consistent with Sam’s view."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds the simple map card at the near log, with the blue hut and curved garden path visible beyond. Show clear landmark/icon correspondence without labels.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I see a hut.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam stands by the near end of the garden path and looks toward the real blue hut. The short log is beside him; the map card is in his hand, face turned away.",
        "imageAlt": "Sam stands beside a short log and looks toward a blue hut. He holds a cream card.",
        "state": {
          "page": 1,
          "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
          "visibleState": "Sam stands by the near end of the garden path and looks toward the real blue hut. The short log is beside him; the map card is in his hand, face turned away.",
          "propInvariants": [
            "One blue hut and one short tan log remain in fixed positions.",
            "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
            "The map orientation stays consistent with Sam’s view."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam stands beside a short log and looks toward a blue hut. He holds a cream card.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I see a log.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam looks down at the real short log beside the path. The hut remains at the path’s far end in the same direction.",
        "imageAlt": "Sam points down at the log beside the path. He holds a cream card.",
        "state": {
          "page": 2,
          "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
          "visibleState": "Sam looks down at the real short log beside the path. The hut remains at the path’s far end in the same direction.",
          "propInvariants": [
            "One blue hut and one short tan log remain in fixed positions.",
            "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
            "The map orientation stays consistent with Sam’s view."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam points down at the log beside the path. He holds a cream card.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I see a map.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam opens the cream map card toward the viewer. It shows exactly the blue hut icon, tan log icon and curved path in the same spatial arrangement as the garden.",
        "imageAlt": "Sam holds a map showing a log, a winding path, and a blue hut. The same log and hut are beside him.",
        "state": {
          "page": 3,
          "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
          "visibleState": "Sam opens the cream map card toward the viewer. It shows exactly the blue hut icon, tan log icon and curved path in the same spatial arrangement as the garden.",
          "propInvariants": [
            "One blue hut and one short tan log remain in fixed positions.",
            "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
            "The map orientation stays consistent with Sam’s view."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam holds a map showing a log, a winding path, and a blue hut. The same log and hut are beside him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The hut is on the map.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Over Sam’s shoulder, his finger points to the blue hut icon on the card; the real hut can be seen beyond the card in the matching direction.",
        "imageAlt": "Sam points to the hut on his map. The blue hut stands ahead of him.",
        "state": {
          "page": 4,
          "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
          "visibleState": "Over Sam’s shoulder, his finger points to the blue hut icon on the card; the real hut can be seen beyond the card in the matching direction.",
          "propInvariants": [
            "One blue hut and one short tan log remain in fixed positions.",
            "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
            "The map orientation stays consistent with Sam’s view."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam points to the hut on his map. The blue hut stands ahead of him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "The log is on the map.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. In the same orientation, Sam points to the tan log icon. The real log is visible below and beside him, matching that location on the map.",
        "imageAlt": "Sam points to the log on his map. The real log lies beside the path.",
        "state": {
          "page": 5,
          "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
          "visibleState": "In the same orientation, Sam points to the tan log icon. The real log is visible below and beside him, matching that location on the map.",
          "propInvariants": [
            "One blue hut and one short tan log remain in fixed positions.",
            "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
            "The map orientation stays consistent with Sam’s view."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam points to the log on his map. The real log lies beside the path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I can go to the hut.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam follows the curved path and arrives at the open hut, holding the map. The log remains at the far end behind him; both icons remain unchanged on the card.",
        "imageAlt": "Sam reaches the blue hut, holding his map.",
        "state": {
          "page": 6,
          "setting": "A small garden with a blue play hut at the far end of one curved path and a short fallen log beside the near end. Both landmarks are visible together.",
          "visibleState": "Sam follows the curved path and arrives at the open hut, holding the map. The log remains at the far end behind him; both icons remain unchanged on the card.",
          "propInvariants": [
            "One blue hut and one short tan log remain in fixed positions.",
            "One cream map card shows matching simple hut/log icons and the same curved connecting path; no letters, symbols requiring a key, compass or labels.",
            "The map orientation stays consistent with Sam’s view."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam reaches the blue hut, holding his map.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How do the pictures on the map help Sam?",
        "listenFor": "They stand for the real hut and log, and the path connects their places."
      },
      "visual": {
        "page": 4,
        "prompt": "Which real place matches the picture Sam is pointing to?",
        "lookFor": "The blue hut on the map matches the blue hut beyond the card."
      }
    },
    "levelRationale": "Six short single-line pages with a repeated I see frame followed by a concrete real-to-map comparison. Illustration carries spatial reference; the print stays within A syntax.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "p",
        "sound": "p",
        "word": "map",
        "model": "Say map and listen for the last /p/. Point to p, then blend m–a–p and read A Map as a title."
      },
      "decoding": {
        "words": [
          "map",
          "log",
          "hut"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "map",
          "meaning": "A drawing that shows where places or things are."
        },
        {
          "word": "on",
          "meaning": "Here, shown on the map’s flat surface."
        }
      ],
      "connectedReading": "After decoding, match each real landmark to its map picture. Ask the child to explain how Sam reaches the hut. Do not use the image as a substitute for reading the word map.",
      "fluency": "Reread the two matching The ... is on the map lines in meaningful phrases, then finish the route sentence naturally."
    },
    "factualSources": [
      {
        "title": "USGS: Topographic Map Symbols",
        "url": "https://pubs.usgs.gov/gip/TopographicMapSymbols/topomapsymbols.pdf",
        "supports": "Maps represent areas and use symbols for real features. This book uses a deliberately simpler local picture map, not a claim of topographic scale or navigational accuracy.",
        "checked": "2026-10-29"
      }
    ],
    "reviewedTextFingerprint": "fnv1a64:9e1c97900f924fe8",
    "reviewedManuscriptSha256": "8b3786df033a31c203a3855b9faa53677cf7a3a7f6f517b0dc7b0e2a4edde230",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-08",
    "number": 8,
    "title": "Is It a Cat?",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 11,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Short-vowel decoding with a concrete question and mistaken identity.",
    "practiceWords": [
      "cat",
      "tag",
      "hop"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x is the explicitly taught two-sound chunk ks; this is not a one-phoneme claim."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "uː"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "hop",
        "graphemes": [
          "h",
          "o",
          "p"
        ],
        "sounds": [
          "h",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "iː"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "iː"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "tag",
        "graphemes": [
          "t",
          "a",
          "g"
        ],
        "sounds": [
          "t",
          "æ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "tap",
        "graphemes": [
          "t",
          "a",
          "p"
        ],
        "sounds": [
          "t",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "uː"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam thinks the folded hat in a box is Cat, but it will not respond; a fabric tag provides a clue, and tugging it reveals Sam’s own hat.",
      "failedAttempt": "Sam calls to the apparent cat and taps the box; the folded shape does not move.",
      "turn": "Sam notices a fabric loop tag and tugs it, unfolding the hat.",
      "resolution": "Sam wears the hat while the real Cat rests on the rug.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-CAT"
      ]
    },
    "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
    "props": [
      "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
      "One open cardboard box, with no moving lid.",
      "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
      "No written tag or generated lettering."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam peers at the two pointed folds of a tan hat inside a shallow box. Keep the folds plausibly cat-like from Sam’s angle, with no face, eyes or literal cat body invented.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I see a cat in a box.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam peers into the shallow box. The tan hat’s two upper folds and cream lining create a cat-like silhouette; show no actual animal eyes or paws in the box.",
        "imageAlt": "Sam kneels beside a box containing a folded tan hat with two pointed corners.",
        "state": {
          "page": 1,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam peers into the shallow box. The tan hat’s two upper folds and cream lining create a cat-like silhouette; show no actual animal eyes or paws in the box.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam kneels beside a box containing a folded tan hat with two pointed corners.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "“Cat, can you hop?”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam bends toward the folded shape with an inviting hand gesture, speaking to what he thinks is Cat. The hat remains motionless.",
        "imageAlt": "Sam holds out a hand toward the folded tan shape in the box.",
        "state": {
          "page": 2,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam bends toward the folded shape with an inviting hand gesture, speaking to what he thinks is Cat. The hat remains motionless.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam holds out a hand toward the folded tan shape in the box.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I tap the box.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam gently taps the cardboard side with one finger. The folded hat remains in exactly the same position.",
        "imageAlt": "Sam taps the side of the box beside the folded tan hat.",
        "state": {
          "page": 3,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam gently taps the cardboard side with one finger. The folded hat remains in exactly the same position.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam taps the side of the box beside the folded tan hat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I do not see it hop.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam pauses beside the box, hands still, looking at the unresponsive shape. Keep the same folds; no hopping motion.",
        "imageAlt": "Sam rests his hands on his knees and watches the folded hat in the box.",
        "state": {
          "page": 4,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam pauses beside the box, hands still, looking at the unresponsive shape. Keep the same folds; no hopping motion.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam rests his hands on his knees and watches the folded hat in the box.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I see a tag.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam notices the blank fabric loop tag at the lower edge of the folded shape. A closer view reveals the loop without yet opening the hat fully.",
        "imageAlt": "Sam points to a cream tag on the folded tan hat.",
        "state": {
          "page": 5,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam notices the blank fabric loop tag at the lower edge of the folded shape. A closer view reveals the loop without yet opening the hat fully.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam points to a cream tag on the folded tan hat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I tug at the tag.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam tugs the fabric loop upward, lifting and unfolding the soft hat. Its open head-shaped cavity becomes visible; the box remains beneath.",
        "imageAlt": "Sam lifts the tan hat by its cream tag above the empty box.",
        "state": {
          "page": 6,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam tugs the fabric loop upward, lifting and unfolding the soft hat. Its open head-shaped cavity becomes visible; the box remains beneath.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam lifts the tan hat by its cream tag above the empty box.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "It is my hat!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds his recognizable tan hat open in both hands, smiling at the discovery. No extra item remains in the box.",
        "imageAlt": "Sam holds up his tan hat above the empty box.",
        "state": {
          "page": 7,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam holds his recognizable tan hat open in both hands, smiling at the discovery. No extra item remains in the box.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam holds up his tan hat above the empty box.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "My hat is on me.\nThe cat is on a rug.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam wears the tan hat. A wider view shows the real ginger Cat resting on the tan rug beyond the sofa, with its green collar and white chest clearly distinct from the hat.",
        "imageAlt": "Sam wears his tan hat beside the empty box. Cat sits on a tan rug nearby.",
        "state": {
          "page": 8,
          "setting": "One bright sitting room with a shallow open cardboard box beside a low blue sofa and a tan rug beyond it.",
          "visibleState": "Sam wears the tan hat. A wider view shows the real ginger Cat resting on the tan rug beyond the sofa, with its green collar and white chest clearly distinct from the hat.",
          "propInvariants": [
            "One tan soft winter hat with folded pointed corners, a cream lining and a blank fabric loop tag. Its shape initially resembles cat ears.",
            "One open cardboard box, with no moving lid.",
            "The real ginger Cat rests behind the sofa until the final wider view; never duplicate Cat inside the box.",
            "No written tag or generated lettering."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam wears his tan hat beside the empty box. Cat sits on a tan rug nearby.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What helps Sam work out what is in the box?",
        "listenFor": "The shape does not move, then he finds the tag and lifts out the hat."
      },
      "visual": {
        "page": 5,
        "prompt": "Which small detail gives Sam a new clue?",
        "lookFor": "A fabric loop tag sticks out from the folded shape."
      }
    },
    "levelRationale": "Eight short pages with one question in dialogue, a controlled false first impression, a visible clue and a twelve-word paired-sentence ending. The identity inference and pattern break warrant B.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "t",
        "sound": "t",
        "word": "tag",
        "model": "Say tag, locate the first /t/ and its spelling t, then blend t–a–g. Compare tag with the final g in tug."
      },
      "decoding": {
        "words": [
          "cat",
          "tag",
          "hop"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "tag",
          "meaning": "The little cloth loop sewn onto this hat."
        },
        {
          "word": "hop",
          "meaning": "Jump up on one foot or make a small jump."
        }
      ],
      "connectedReading": "Read the first claim as Sam’s mistaken thought. After the reveal, revisit the tag clue and explain why Sam changes his mind. Read the words rather than guessing the hidden object.",
      "fluency": "Read the question with a gentle rise, pause at the reveal, and let the final two sentences complete the joke."
    },
    "reviewedTextFingerprint": "fnv1a64:bc06f4fa2c6ade4f",
    "reviewedManuscriptSha256": "63c67d244c7615d748d69f81e0fb2dcebd583d7b400ac8fcc7180a354038dd38",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-09",
    "number": 9,
    "title": "A Red Dot",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 12,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Short e in red and pen; a visible change of background.",
    "practiceWords": [
      "red",
      "pen",
      "dot"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dab",
        "graphemes": [
          "d",
          "a",
          "b"
        ],
        "sounds": [
          "d",
          "æ",
          "b"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "uː"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "pen",
        "graphemes": [
          "p",
          "e",
          "n"
        ],
        "sounds": [
          "p",
          "ɛ",
          "n"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "iː"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "tan",
        "graphemes": [
          "t",
          "a",
          "n"
        ],
        "sounds": [
          "t",
          "æ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to see a dot, but his red pen leaves a hard-to-see mark on a red paper mat; he chooses a tan mat and makes a dot he can see.",
      "failedAttempt": "Sam dabs the red pen on the red paper mat and cannot distinguish the mark.",
      "turn": "Sam chooses the tan paper mat instead.",
      "resolution": "The red dot is plainly visible against the tan mat.",
      "canonIds": [
        "SMALL-SAM"
      ]
    },
    "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
    "props": [
      "One red water-based broad-tip pen, red barrel and cap attached to its back.",
      "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
      "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds the red pen above two plain smooth reusable work mats, one red and one tan. Establish the color contrast without showing the final marks.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a red pen.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam picks up the red pen from the craft table. The red and tan smooth reusable work mats lie beside each other, both unmarked.",
        "imageAlt": "Sam holds up a red pen at a table with a red work mat and a tan work mat.",
        "state": {
          "page": 1,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam picks up the red pen from the craft table. The red and tan smooth reusable work mats lie beside each other, both unmarked.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam holds up a red pen at a table with a red work mat and a tan work mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I get a red mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam places the red smooth reusable work mat in front of him. The tan mat waits beside it.",
        "imageAlt": "Sam moves the red work mat in front of himself while holding the red pen.",
        "state": {
          "page": 2,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam places the red smooth reusable work mat in front of him. The tan mat waits beside it.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam moves the red work mat in front of himself while holding the red pen.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I dab a dot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam presses the red pen once near the center of the red mat. Use matching red ink so the mark is very hard to distinguish, not a black outline around it.",
        "imageAlt": "Sam presses the red pen onto the red work mat. The tan mat is beside it.",
        "state": {
          "page": 3,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam presses the red pen once near the center of the red mat. Use matching red ink so the mark is very hard to distinguish, not a black outline around it.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam presses the red pen onto the red work mat. The tan mat is beside it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I do not see a dot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lifts the pen and leans closer to inspect the red mat; the red mark is still difficult to see. Do not erase the physical mark or invent a new color.",
        "imageAlt": "Sam looks closely at the red mat while holding his red pen.",
        "state": {
          "page": 4,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam lifts the pen and leans closer to inspect the red mat; the red mark is still difficult to see. Do not erase the physical mark or invent a new color.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam looks closely at the red mat while holding his red pen.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I get a tan mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam brings the tan mat into the working place and moves the red mat beside it. Both remain visible, with the same pen in his hand.",
        "imageAlt": "Sam slides the tan mat in front of him and holds his red pen. The red mat lies beside it.",
        "state": {
          "page": 5,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam brings the tan mat into the working place and moves the red mat beside it. Both remain visible, with the same pen in his hand.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam slides the tan mat in front of him and holds his red pen. The red mat lies beside it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I dab a dot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam presses the same red pen once onto the center of the tan mat, making one clear round red mark.",
        "imageAlt": "Sam makes a red dot on the tan mat with his red pen.",
        "state": {
          "page": 6,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam presses the same red pen once onto the center of the tan mat, making one clear round red mark.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam makes a red dot on the tan mat with his red pen.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "I can see a dot!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam points to the clear red dot on the tan mat. The red mat and its faint red mark remain beside it; no new marks or objects appear.",
        "imageAlt": "Sam points at a red dot on the tan mat.",
        "state": {
          "page": 7,
          "setting": "One child-height craft table in a bright room. Sam works with thin smooth reusable work mats used for drawing.",
          "visibleState": "Sam points to the clear red dot on the tan mat. The red mat and its faint red mark remain beside it; no new marks or objects appear.",
          "propInvariants": [
            "One red water-based broad-tip pen, red barrel and cap attached to its back.",
            "One red smooth reusable work mat matching the ink color and one tan smooth reusable work mat.",
            "One red mark on each mat by the end. Keep the first red mat beside the tan mat after the change."
          ],
          "cast": [
            "SMALL-SAM"
          ]
        },
        "pageDescription": "Sam points at a red dot on the tan mat.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam change so he can see the dot?",
        "listenFor": "He keeps the red pen but changes from a red mat to a tan mat."
      },
      "visual": {
        "page": 7,
        "prompt": "What makes the new dot easier to see?",
        "lookFor": "The red dot has a different color from the tan paper around it."
      }
    },
    "levelRationale": "Seven single-line pages use a repeated concrete action and a single visible contrast. The negative sentence is at most six words and no dialogue is introduced.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "e",
        "sound": "ɛ",
        "word": "pen",
        "model": "Say pen, listen for its middle /ɛ/, and locate e. Blend p–e–n, then reread the first sentence."
      },
      "decoding": {
        "words": [
          "red",
          "pen",
          "dot"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "mat",
          "meaning": "The thin, smooth reusable work mat used for drawing."
        },
        {
          "word": "tan",
          "meaning": "A light brown color."
        },
        {
          "word": "dab",
          "meaning": "Press lightly once."
        }
      ],
      "connectedReading": "Read each line first, then compare what stays the same and what changes. Retell the attempt on red and the result on tan.",
      "fluency": "Reread the two I dab a dot lines at a natural pace and make the change from do not see to can see meaningful."
    },
    "reviewedTextFingerprint": "fnv1a64:19fb2a3c5bc27078",
    "reviewedManuscriptSha256": "f427b1193e0c600bc6d1d51bc92379bb136c96bfcae08a832ae0d1e0e09186b7",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-10",
    "number": 10,
    "title": "A Den for the Cat",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 12,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Short e in den, peg and pet; a specific attachment solution.",
    "practiceWords": [
      "den",
      "peg",
      "pet"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Final x is the explicitly taught two-sound chunk ks; this is not a one-phoneme claim."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "den",
        "graphemes": [
          "d",
          "e",
          "n"
        ],
        "sounds": [
          "d",
          "ɛ",
          "n"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "peg",
        "graphemes": [
          "p",
          "e",
          "g"
        ],
        "sounds": [
          "p",
          "ɛ",
          "ɡ"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "pet",
        "graphemes": [
          "p",
          "e",
          "t"
        ],
        "sounds": [
          "p",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam and Dot make a cat den, but its loose cloth doorway slips onto Cat and then Dot; Sam uses a peg to hold the cloth up, leaving an open entrance.",
      "failedAttempt": "The loose cloth slips; tugging it only moves the loose cloth onto Dot’s arm.",
      "turn": "Sam fetches a peg and fastens the folded top edge of the cloth to the box rim.",
      "resolution": "The entrance stays open, Cat settles inside, and both children pet it.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-CAT"
      ]
    },
    "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
    "props": [
      "One roomy open-front cardboard box; its size never changes.",
      "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
      "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
      "Cat is never trapped, tied or covered over its face."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam and Dot set the roomy box beside Cat, holding the blue cloth ready to make a den. The supply tray with one peg sits nearby.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a box.\nIt is a den for the cat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sets the large open-front box on the floor, with Cat standing beside its wide entrance and Dot nearby. The cloth and supply tray are visible behind them.",
        "imageAlt": "Sam sets a large open box beside Dot and Cat. A blue cloth and one wooden peg lie nearby.",
        "state": {
          "page": 1,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "Sam sets the large open-front box on the floor, with Cat standing beside its wide entrance and Dot nearby. The cloth and supply tray are visible behind them.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam sets a large open box beside Dot and Cat. A blue cloth and one wooden peg lie nearby.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Dot and I get a rag.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam and Dot hold the lightweight blue cloth together above the box’s front opening. Cat stands outside the entrance.",
        "imageAlt": "Sam and Dot hold a blue cloth above the box. Cat stands beside them.",
        "state": {
          "page": 2,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "Sam and Dot hold the lightweight blue cloth together above the box’s front opening. Cat stands outside the entrance.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam and Dot hold a blue cloth above the box. Cat stands beside them.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The rag is on the box.\nIt is on the cat!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. The unfastened cloth slips down from the top edge onto Cat’s back. Cat’s head and all paws remain uncovered and free outside the box.",
        "imageAlt": "The blue cloth slips from the box onto Cat’s back. Sam and Dot raise their hands.",
        "state": {
          "page": 3,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "The unfastened cloth slips down from the top edge onto Cat’s back. Cat’s head and all paws remain uncovered and free outside the box.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "The blue cloth slips from the box onto Cat’s back. Sam and Dot raise their hands.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I tug at the rag.\nThe rag is on Dot!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam gently tugs the loose cloth away from Cat. It slides onto Dot’s forearm; Cat stands clear and unharmed. The cloth has no attachment yet.",
        "imageAlt": "Sam pulls the blue cloth clear of Cat, and it drapes over Dot’s arm.",
        "state": {
          "page": 4,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "Sam gently tugs the loose cloth away from Cat. It slides onto Dot’s forearm; Cat stands clear and unharmed. The cloth has no attachment yet.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam pulls the blue cloth clear of Cat, and it drapes over Dot’s arm.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I get a peg for the rag.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lifts the one large wooden peg from the nearby tray. Dot holds the loose cloth away from Cat.",
        "imageAlt": "Sam lifts a wooden peg from an empty tray while Dot holds the blue cloth beside the cat.",
        "state": {
          "page": 5,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "Sam lifts the one large wooden peg from the nearby tray. Dot holds the loose cloth away from Cat.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam lifts a wooden peg from an empty tray while Dot holds the blue cloth beside the cat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I peg the rag to the box.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam clips the folded top edge of the cloth to the cardboard rim with the peg, keeping a broad open doorway beneath. Dot steadies the box.",
        "imageAlt": "Sam clips the blue cloth to the box with a wooden peg while Dot steadies it. The cat waits beside the open entrance.",
        "state": {
          "page": 6,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "Sam clips the folded top edge of the cloth to the cardboard rim with the peg, keeping a broad open doorway beneath. Dot steadies the box.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam clips the blue cloth to the box with a wooden peg while Dot steadies it. The cat waits beside the open entrance.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The rag is up.\nThe cat can get in.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. The cloth stays raised on the single peg. Cat walks through the unobstructed doorway; its body fits comfortably inside.",
        "imageAlt": "The cat steps into the box beneath the blue cloth. Sam and Dot watch beside the den.",
        "state": {
          "page": 7,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "The cloth stays raised on the single peg. Cat walks through the unobstructed doorway; its body fits comfortably inside.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "The cat steps into the box beneath the blue cloth. Sam and Dot watch beside the den.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The cat is in the den.\nDot and I can pet it.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Cat rests comfortably inside the den near its open doorway. Sam and Dot kneel outside and gently pet its back; the one peg and raised cloth remain unchanged.",
        "imageAlt": "Sam and Dot gently pet the cat as it rests inside the den.",
        "state": {
          "page": 8,
          "setting": "One family playroom with a roomy low cardboard box beside a blue sofa and a clear cream floor.",
          "visibleState": "Cat rests comfortably inside the den near its open doorway. Sam and Dot kneel outside and gently pet its back; the one peg and raised cloth remain unchanged.",
          "propInvariants": [
            "One roomy open-front cardboard box; its size never changes.",
            "One large lightweight blue cloth called a rag in the text, used as a doorway flap.",
            "One large wooden clothespin peg, kept in a small open supply tray until fetched.",
            "Cat is never trapped, tied or covered over its face."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-CAT"
          ]
        },
        "pageDescription": "Sam and Dot gently pet the cat as it rests inside the den.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why does Sam get a peg after tugging the rag?",
        "listenFor": "Tugging moves the loose cloth but does not hold it in place. The peg keeps the entrance open."
      },
      "visual": {
        "page": 7,
        "prompt": "What keeps the cloth from slipping again?",
        "lookFor": "The wooden peg holds its folded top edge to the box rim."
      }
    },
    "levelRationale": "Eight pages with paired simple sentences, two light surprise beats, a clear causal tool choice and at most fourteen words per page. Concrete pronoun referents stay visible; no dialogue.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "e",
        "sound": "ɛ",
        "word": "peg",
        "model": "Say peg, locate the middle /ɛ/ and the letter e, then blend p–e–g. Compare the middle vowel in den and pet."
      },
      "decoding": {
        "words": [
          "den",
          "peg",
          "pet"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "den",
          "meaning": "A cozy shelter for the cat here."
        },
        {
          "word": "peg",
          "meaning": "A clip that holds two things together; peg also means fasten with that clip."
        },
        {
          "word": "rag",
          "meaning": "A large soft piece of cloth in this story."
        }
      ],
      "connectedReading": "Read the attempt and its consequence together. Retell why pulling alone fails and how the peg changes the doorway; reread for meaning during daily practice.",
      "fluency": "Pause briefly at each sentence boundary. Keep It linked to the rag on page 3, and read the final two sentences as a calm completed result."
    },
    "reviewedTextFingerprint": "fnv1a64:6078bccde682c512",
    "reviewedManuscriptSha256": "5785b4a2d92cca51b679e1fc61d97e6da7728a53c89473708574589164f8e957",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-11",
    "number": 11,
    "title": "A Job for Me",
    "appLevel": "A",
    "level": "A",
    "interestAge": "4–8",
    "afterCycle": 13,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "New j in job with cumulative short-vowel action words.",
    "practiceWords": [
      "job",
      "get",
      "sip"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "no",
        "cycle": 5,
        "reason": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "uː"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "job",
        "graphemes": [
          "j",
          "o",
          "b"
        ],
        "sounds": [
          "dʒ",
          "ɑ",
          "b"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "iː"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 9; e represents long e, not the later short-e correspondence. Teach this whole word only."
      },
      {
        "word": "mug",
        "graphemes": [
          "m",
          "u",
          "g"
        ],
        "sounds": [
          "m",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "no",
        "graphemes": [
          "n",
          "o"
        ],
        "sounds": [
          "n",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "The vowel is long /oʊ/, not short o; exact HFW introduced in Cycle 5."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "iː"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole word taught in Cycle11; ee /iː/ is not yet part of the regular code. This does not license other ee words."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sip",
        "graphemes": [
          "s",
          "i",
          "p"
        ],
        "sounds": [
          "s",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam sets out drinks for Dad and Dot but leaves his own place empty; he notices the gap, brings his cup and joins them for a drink.",
      "failedAttempt": "Sam serves Dad and Dot, then sees that his own place has no cup.",
      "turn": "Sam fetches the remaining yellow cup for himself.",
      "resolution": "Everyone has a drink, and Sam joins Dad and Dot rather than remaining only the helper.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-DAD"
      ]
    },
    "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
    "props": [
      "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
      "One blue picnic mat and one low tray remain fixed.",
      "No hot liquid, written place labels or duplicate cups."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam kneels beside the low tray holding three drinks, with Dad and Dot waiting around the blue mat. Keep each vessel and its color distinct.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I can do a job.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam kneels by the tray with the green mug, red cup and yellow cup. Dad and Dot sit at two places on the blue mat, with Sam’s empty place between them.",
        "imageAlt": "Sam kneels beside a tray holding a green mug, a red cup, and a yellow cup. Dad and Dot sit on the blue mat.",
        "state": {
          "page": 1,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam kneels by the tray with the green mug, red cup and yellow cup. Dad and Dot sit at two places on the blue mat, with Sam’s empty place between them.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam kneels beside a tray holding a green mug, a red cup, and a yellow cup. Dad and Dot sit on the blue mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I get a mug for Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lifts the green mug from the tray and places it in front of Dad. Red and yellow cups remain on the tray.",
        "imageAlt": "Sam puts the green mug in front of Dad. The red and yellow cups remain on the tray.",
        "state": {
          "page": 2,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam lifts the green mug from the tray and places it in front of Dad. Red and yellow cups remain on the tray.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam puts the green mug in front of Dad. The red and yellow cups remain on the tray.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I get a cup for Dot.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam puts the red cup in front of Dot. The yellow cup remains alone on the tray.",
        "imageAlt": "Sam puts the red cup in front of Dot. The yellow cup is still on the tray.",
        "state": {
          "page": 3,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam puts the red cup in front of Dot. The yellow cup remains alone on the tray.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam puts the red cup in front of Dot. The yellow cup is still on the tray.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I see no cup for me.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam looks at his own empty place on the mat. Dad has the green mug, Dot has the red cup, and the yellow cup remains visibly on the tray.",
        "imageAlt": "Sam looks at his empty place on the mat. His yellow cup is still on the tray.",
        "state": {
          "page": 4,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam looks at his own empty place on the mat. Dad has the green mug, Dot has the red cup, and the yellow cup remains visibly on the tray.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam looks at his empty place on the mat. His yellow cup is still on the tray.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I get a cup for me.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam fetches the yellow cup from the tray for himself. The tray is now empty.",
        "imageAlt": "Sam lifts the yellow cup from the tray. Dad and Dot sit beside their green mug and red cup.",
        "state": {
          "page": 5,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam fetches the yellow cup from the tray for himself. The tray is now empty.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam lifts the yellow cup from the tray. Dad and Dot sit beside their green mug and red cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I set it on the mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sets the yellow cup at his place on the blue mat. All three drinks are now in their intended places.",
        "imageAlt": "Sam sets his yellow cup on the mat between Dad's green mug and Dot's red cup.",
        "state": {
          "page": 6,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam sets the yellow cup at his place on the blue mat. All three drinks are now in their intended places.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam sets his yellow cup on the mat between Dad's green mug and Dot's red cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dad and Dot sip.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad sips from the green mug and Dot from the red cup. Sam sits at his own place and reaches for the yellow cup.",
        "imageAlt": "Dad sips from his green mug, and Dot sips from her red cup. Sam reaches toward his yellow cup.",
        "state": {
          "page": 7,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Dad sips from the green mug and Dot from the red cup. Sam sits at his own place and reaches for the yellow cup.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad sips from his green mug, and Dot sips from her red cup. Sam reaches toward his yellow cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I sip.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam sips from the yellow cup, joining the picnic. Dad and Dot lower their own vessels beside him; the tray remains empty.",
        "imageAlt": "Sam sips from his yellow cup. Dad and Dot hold their drinks and smile at him.",
        "state": {
          "page": 8,
          "setting": "One garden picnic area with a blue mat and a low tray beside it. Dad, Dot and Sam sit around three clear places on the mat.",
          "visibleState": "Sam sips from the yellow cup, joining the picnic. Dad and Dot lower their own vessels beside him; the tray remains empty.",
          "propInvariants": [
            "Exactly three drinks of cold water: one green mug for Dad, one red cup for Dot, one yellow cup for Sam.",
            "One blue picnic mat and one low tray remain fixed.",
            "No hot liquid, written place labels or duplicate cups."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam sips from his yellow cup. Dad and Dot hold their drinks and smile at him.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What does Sam notice after bringing drinks to Dad and Dot?",
        "listenFor": "His own place has no cup. He gets one and joins them."
      },
      "visual": {
        "page": 4,
        "prompt": "Which place is still missing a drink?",
        "lookFor": "Sam’s place is empty while Dad and Dot have their mug and cup."
      }
    },
    "levelRationale": "Eight single-line pages with familiar first-person sentence frames, a visible omission and a direct repair. The final two very short lines complete participation rather than adding a moral.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "j",
        "sound": "dʒ",
        "word": "job",
        "model": "Say job, listen for the first /dʒ/ sound, and point to j. Blend j–o–b, then read the title."
      },
      "decoding": {
        "words": [
          "job",
          "get",
          "sip"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "job",
          "meaning": "A task to do."
        },
        {
          "word": "sip",
          "meaning": "Take a small drink."
        },
        {
          "word": "me",
          "meaning": "Sam, the person telling this story."
        }
      ],
      "connectedReading": "After decoding, track who has a drink. Ask what Sam notices and how the last page changes his role. Keep independent attempts separate from narration support.",
      "fluency": "Read the repeated I get frame as a smooth phrase. Give the final I sip a quiet, satisfying pause."
    },
    "reviewedTextFingerprint": "fnv1a64:ea21491b5f204123",
    "reviewedManuscriptSha256": "241140fe14162dbfdf031530a413196c5a5c570ab16b9ec03fda3e59bfd8a738",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-12",
    "number": 12,
    "title": "A Wig for Dad",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 13,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Cumulative k in kit and explicit HFW his; a simple fastening solution.",
    "practiceWords": [
      "kit",
      "pin",
      "wig"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "his",
        "cycle": 13,
        "reason": "Exact HFW introduced in Cycle 13. Final s represents /z/, outside the regular single-s /s/ correspondence."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "Whole word taught in Cycle12; r-controlled or /ɔɹ/ is not part of the regular code contract. Connected speech may reduce to /fɚ/."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "his",
        "graphemes": [
          "h",
          "i",
          "s"
        ],
        "sounds": [
          "h",
          "ɪ",
          "z"
        ],
        "firstCycle": 13,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 13. Final s represents /z/, outside the regular single-s /s/ correspondence."
      },
      {
        "word": "hop",
        "graphemes": [
          "h",
          "o",
          "p"
        ],
        "sounds": [
          "h",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "kit",
        "graphemes": [
          "k",
          "i",
          "t"
        ],
        "sounds": [
          "k",
          "ɪ",
          "t"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "pin",
        "graphemes": [
          "p",
          "i",
          "n"
        ],
        "sounds": [
          "p",
          "ɪ",
          "n"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      },
      {
        "word": "wig",
        "graphemes": [
          "w",
          "i",
          "g"
        ],
        "sounds": [
          "w",
          "ɪ",
          "ɡ"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "uː"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants Dad to hop in a wig, but the wig falls off; Sam gets a cap and helps Dad fasten the wig to it, so both can hop while the costume stays on.",
      "failedAttempt": "Dad’s first hop sends the loose wig onto the rug.",
      "turn": "Sam fetches a cap; together they pin the wig to it while it is off Dad’s head.",
      "resolution": "Dad wears the secured wig and hops with Sam without losing it.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
    "props": [
      "One purple costume wig with a simple outlined curly silhouette.",
      "One orange baseball cap that fits Dad.",
      "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
      "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
      "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam offers Dad the purple wig from the open costume kit. The orange cap and single rounded-tip bobby pin are visible inside the kit, not already attached.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a kit for Dad.\nA wig is in the kit.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam opens the costume kit in front of Dad. The purple wig, orange cap and one rounded-tip bobby pin are clearly visible as separate items.",
        "imageAlt": "Sam opens a kit containing a purple wig, an orange cap, and one rounded bobby pin. Dad kneels beside him.",
        "state": {
          "page": 1,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Sam opens the costume kit in front of Dad. The purple wig, orange cap and one rounded-tip bobby pin are clearly visible as separate items.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam opens a kit containing a purple wig, an orange cap, and one rounded bobby pin. Dad kneels beside him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "The wig is on Dad.\n“Dad, can you hop?”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad wears the loose purple wig without the cap. Sam gestures upward, inviting a hop; the cap and bobby pin remain in the kit.",
        "imageAlt": "Dad wears the purple wig while Sam gestures toward him. The orange cap and bobby pin remain in the kit.",
        "state": {
          "page": 2,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Dad wears the loose purple wig without the cap. Sam gestures upward, inviting a hop; the cap and bobby pin remain in the kit.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad wears the purple wig while Sam gestures toward him. The orange cap and bobby pin remain in the kit.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dad can hop.\nThe wig is on the rug!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad lands from a small hop, now bareheaded, as the wig lands on the tan rug beside him. His normal short hair and beard remain visible.",
        "imageAlt": "Dad lands from a hop, and the purple wig lies on the rug. Sam watches.",
        "state": {
          "page": 3,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Dad lands from a small hop, now bareheaded, as the wig lands on the tan rug beside him. His normal short hair and beard remain visible.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad lands from a hop, and the purple wig lies on the rug. Sam watches.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I get a cap for Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lifts the orange cap from the kit. The loose wig lies on the rug; the bobby pin remains in the kit.",
        "imageAlt": "Sam lifts the orange cap while Dad watches. The wig lies on the rug, and the pin stays in the kit.",
        "state": {
          "page": 4,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Sam lifts the orange cap from the kit. The loose wig lies on the rug; the bobby pin remains in the kit.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam lifts the orange cap while Dad watches. The wig lies on the rug, and the pin stays in the kit.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dad and I pin the wig\nto his cap.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds the orange cap on the low kit lid while Dad slides the one rounded-tip bobby pin over the wig edge and cap fabric to secure the wig to the cap’s upper edge. Both items are off Dad’s head; do not show a sharp pin near skin.",
        "imageAlt": "Sam holds the orange cap while Dad pins the purple wig to it.",
        "state": {
          "page": 5,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Sam holds the orange cap on the low kit lid while Dad slides the one rounded-tip bobby pin over the wig edge and cap fabric to secure the wig to the cap’s upper edge. Both items are off Dad’s head; do not show a sharp pin near skin.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam holds the orange cap while Dad pins the purple wig to it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The wig is on Dad.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad wears the orange cap with the purple wig securely attached, brim visible. Sam checks the joined edge; the costume kit remains open and empty.",
        "imageAlt": "Dad wears the orange cap with the purple wig pinned to it. Sam points up at the wig.",
        "state": {
          "page": 6,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Dad wears the orange cap with the purple wig securely attached, brim visible. Sam checks the joined edge; the costume kit remains open and empty.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad wears the orange cap with the purple wig pinned to it. Sam points up at the wig.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "“Dad, can you hop?”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam invites another hop, looking up at Dad. Dad bends his knees slightly, still wearing the secured cap and wig.",
        "imageAlt": "Sam opens his arms toward Dad. Dad bends his knees with the pinned wig and cap still on his head.",
        "state": {
          "page": 7,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Sam invites another hop, looking up at Dad. Dad bends his knees slightly, still wearing the secured cap and wig.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam opens his arms toward Dad. Dad bends his knees with the pinned wig and cap still on his head.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Dad and I hop.\nThe wig is on Dad!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad and Sam make small hops together above the rug. The wig remains securely on Dad’s cap; keep both bodies anatomically natural and all limbs attached.",
        "imageAlt": "Sam and Dad hop together. The purple wig stays pinned to Dad's orange cap.",
        "state": {
          "page": 8,
          "setting": "One family dress-up corner with a tan rug and a low open costume kit beside it.",
          "visibleState": "Dad and Sam make small hops together above the rug. The wig remains securely on Dad’s cap; keep both bodies anatomically natural and all limbs attached.",
          "propInvariants": [
            "One purple costume wig with a simple outlined curly silhouette.",
            "One orange baseball cap that fits Dad.",
            "One large rounded-tip bobby pin; Dad slides it over the wig edge and cap fabric with both off his head.",
            "One open cardboard costume kit with a flat attached lid, and one fixed tan rug.",
            "Dad’s beard, normal clothes and face stay unchanged beneath accessories."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam and Dad hop together. The purple wig stays pinned to Dad's orange cap.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What makes the second hopping game different from the first?",
        "listenFor": "Sam and Dad fasten the wig to the cap before trying again, so it stays on."
      },
      "visual": {
        "page": 5,
        "prompt": "What is Dad fastening together?",
        "lookFor": "He uses one bobby pin to join the purple wig to the orange cap while Sam holds the cap."
      }
    },
    "levelRationale": "Eight pages with paired simple sentences and two short dialogue pages. A repeated invitation frames a visible failed attempt and repair; all lines stay within B limits.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "k",
        "sound": "k",
        "word": "kit",
        "model": "Say kit and listen for /k/ at the start. Find k, blend k–i–t, and notice that this spelling differs from c in cap."
      },
      "decoding": {
        "words": [
          "kit",
          "pin",
          "wig"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "wig",
          "meaning": "Hair worn as a costume."
        },
        {
          "word": "pin",
          "meaning": "Fasten with a pin; Dad uses a rounded-tip bobby pin here."
        },
        {
          "word": "his",
          "meaning": "Belonging to Dad here."
        }
      ],
      "connectedReading": "Read the two hopping attempts, then explain what changes between them. Teach his as the exact whole word with final /z/, without generalizing that sound to every s.",
      "fluency": "Read each invitation with the same playful voice. Pause at the fallen-wig surprise and let the final on Dad finish the callback."
    },
    "reviewedTextFingerprint": "fnv1a64:2b89ba9dd577ceee",
    "reviewedManuscriptSha256": "a9f84a1ac70bde018e4e24db0c174727ff77ba319c6d7e4c6c7d88e1dbd39e93",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-13",
    "number": 13,
    "title": "Is This a Win?",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 14,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "Cumulative short vowels; exact HFW this and your in a fair-start game.",
    "practiceWords": [
      "cap",
      "cup",
      "tap"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "this",
        "cycle": 14,
        "reason": "Exact HFW introduced in Cycle 14. The voiced th correspondence is taught as regular code in Cycle 15; this earlier book teaches this exact whole word only."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      },
      {
        "word": "your",
        "cycle": 14,
        "reason": "Whole word taught in Cycle14; our is an untaught r-controlled vowel spelling. This record uses U.S. /jʊɹ/; /jɔɹ/ and reduced /jɚ/ are ordinary variants, not new code."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Regular single-syllable VC/CVC word using already-taught sound values."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "tap",
        "graphemes": [
          "t",
          "a",
          "p"
        ],
        "sounds": [
          "t",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "this",
        "graphemes": [
          "th",
          "i",
          "s"
        ],
        "sounds": [
          "ð",
          "ɪ",
          "s"
        ],
        "firstCycle": 14,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 14. The voiced th correspondence is taught as regular code in Cycle 15; this earlier book teaches this exact whole word only."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Whole word taught in Cycle6; o represents /u/ here, not short /ɑ/. Connected speech can reduce to /tə/."
      },
      {
        "word": "win",
        "graphemes": [
          "w",
          "i",
          "n"
        ],
        "sounds": [
          "w",
          "ɪ",
          "n"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "uː"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      },
      {
        "word": "your",
        "graphemes": [
          "y",
          "our"
        ],
        "sounds": [
          "j",
          "ʊɹ"
        ],
        "firstCycle": 14,
        "type": "exception",
        "note": "Whole word taught in Cycle14; our is an untaught r-controlled vowel spelling. This record uses U.S. /jʊɹ/; /jɔɹ/ and reduced /jɚ/ are ordinary variants, not new code."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam’s cap reaches the cup from an unfairly close start; Dot points out the starting place, so Sam resets, takes a fair turn and accepts Dot’s successful turn.",
      "failedAttempt": "Sam taps his cap from ahead of the shared starting mat, so the apparent success is not a fair turn.",
      "turn": "Sam responds to Dot’s reminder by moving his cap back onto the mat.",
      "resolution": "Both use the same start; Dot’s cap reaches the cup, and Sam congratulates her and retrieves his cap.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ]
    },
    "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
    "props": [
      "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
      "One white target cup, upright and stationary.",
      "One thin blue starting mat. A cap must begin on the mat for each turn.",
      "No score numerals, lines, arrows or printed rules."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam and Dot kneel beside the blue mat with their tan and red toy caps and the white target cup beyond. Establish the simple game without announcing a winner.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I get a cap.\nDot can get a cap.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam takes the tan toy bottle cap and Dot takes the red one. The blue start mat and white upright target cup lie between them.",
        "imageAlt": "Sam holds a tan bottle cap, and Dot holds a red one. A blue mat and a white cup are on the floor.",
        "state": {
          "page": 1,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Sam takes the tan toy bottle cap and Dot takes the red one. The blue start mat and white upright target cup lie between them.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam holds a tan bottle cap, and Dot holds a red one. A blue mat and a white cup are on the floor.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "“Tap your cap to the cup!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot gestures from the blue starting mat toward the cup, explaining the game. Her red cap rests on the mat; Sam holds his tan cap.",
        "imageAlt": "Dot gestures toward the white cup while her red cap rests on the blue mat. Sam holds his tan cap.",
        "state": {
          "page": 2,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Dot gestures from the blue starting mat toward the cup, explaining the game. Her red cap rests on the mat; Sam holds his tan cap.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot gestures toward the white cup while her red cap rests on the blue mat. Sam holds his tan cap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I tap my cap.\nIt is at the cup!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam taps the tan cap from a position ahead of the mat, close to the cup; show his hand and the cap arriving against the cup. Dot’s red cap stays on the mat. The shorter start must be visually clear.",
        "imageAlt": "Sam taps his tan cap beside the cup, far beyond the blue mat. Dot's red cap remains on the mat.",
        "state": {
          "page": 3,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Sam taps the tan cap from a position ahead of the mat, close to the cup; show his hand and the cap arriving against the cup. Dot’s red cap stays on the mat. The shorter start must be visually clear.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam taps his tan cap beside the cup, far beyond the blue mat. Dot's red cap remains on the mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "“Your cap is not on the mat.”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot points back to the blue mat, then at Sam’s tan cap beside the cup. She speaks calmly; Sam looks at the shared starting place.",
        "imageAlt": "Dot points to the blue mat. Sam looks back at her while his tan cap stays beside the cup.",
        "state": {
          "page": 4,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Dot points back to the blue mat, then at Sam’s tan cap beside the cup. She speaks calmly; Sam looks at the shared starting place.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot points to the blue mat. Sam looks back at her while his tan cap stays beside the cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I set my cap on the mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam picks up his tan cap and sets it beside Dot’s red cap on the same blue mat. Cup remains in its original place.",
        "imageAlt": "Sam sets his tan cap beside Dot's red cap on the blue mat. The white cup stands farther along the floor.",
        "state": {
          "page": 5,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Sam picks up his tan cap and sets it beside Dot’s red cap on the same blue mat. Cup remains in its original place.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam sets his tan cap beside Dot's red cap on the blue mat. The white cup stands farther along the floor.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I tap my cap.\n“Dot, tap your cap!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam makes a gentle tap that leaves the tan cap still on the mat, then opens his hand toward Dot to invite her turn. Dot prepares to tap her red cap.",
        "imageAlt": "Sam touches his tan cap on the mat and gestures toward Dot. Dot gets ready to tap her red cap.",
        "state": {
          "page": 6,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Sam makes a gentle tap that leaves the tan cap still on the mat, then opens his hand toward Dot to invite her turn. Dot prepares to tap her red cap.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam touches his tan cap on the mat and gestures toward Dot. Dot gets ready to tap her red cap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The red cap is at the cup.\nMy cap is on the mat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot’s red cap has slid from the mat and now touches the target cup. Sam’s tan cap remains on the blue mat. Both children can see the result.",
        "imageAlt": "Dot points toward her red cap beside the white cup. Sam's tan cap remains on the blue mat.",
        "state": {
          "page": 7,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Dot’s red cap has slid from the mat and now touches the target cup. Sam’s tan cap remains on the blue mat. Both children can see the result.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot points toward her red cap beside the white cup. Sam's tan cap remains on the blue mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "“You win, Dot!”\nI get my cap.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam smiles toward Dot and retrieves his tan cap from the mat for another turn. Dot’s red cap stays beside the cup; the game’s fair result remains visible.",
        "imageAlt": "Sam smiles at Dot and picks up his tan cap. Her red cap stays beside the cup.",
        "state": {
          "page": 8,
          "setting": "One clear smooth playroom floor with a thin blue starting mat and a white upright target cup a short distance beyond it.",
          "visibleState": "Sam smiles toward Dot and retrieves his tan cap from the mat for another turn. Dot’s red cap stays beside the cup; the game’s fair result remains visible.",
          "propInvariants": [
            "Two large flat toy bottle caps: Sam’s tan cap and Dot’s red cap. These are not hats.",
            "One white target cup, upright and stationary.",
            "One thin blue starting mat. A cap must begin on the mat for each turn.",
            "No score numerals, lines, arrows or printed rules."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam smiles at Dot and picks up his tan cap. Her red cap stays beside the cup.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why does Sam take another turn from the mat?",
        "listenFor": "His first start was too close. Starting both caps on the same mat gives each child the same chance."
      },
      "visual": {
        "page": 7,
        "prompt": "Which cap reaches the cup after the fair start?",
        "lookFor": "Dot’s red cap touches the cup; Sam’s tan cap remains on the mat."
      }
    },
    "levelRationale": "Eight pages with simple sentences, a concrete rule and a small fairness inference. Four dialogue pages meet the B maximum of half the book; the longest page has thirteen words.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "a",
        "sound": "æ",
        "word": "cap",
        "model": "Say cap, listen for /æ/ in the middle, and find a. Blend c–a–p, then compare it with the middle sound in cup."
      },
      "decoding": {
        "words": [
          "cap",
          "cup",
          "tap"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "cap",
          "meaning": "A small round lid; here it is a large toy bottle cap."
        },
        {
          "word": "win",
          "meaning": "Succeed in the game."
        },
        {
          "word": "your",
          "meaning": "Belonging to the person being spoken to."
        }
      ],
      "connectedReading": "Decode the print, teach this as the exact Cycle 14 exception, then use the starting positions to explain why Sam tries again. Ask for the fair-start cause, not a memorized moral.",
      "fluency": "Distinguish the speakers through gentle expression. Pause at the two-sentence contrast on page 7 and make the final congratulations sound friendly."
    },
    "reviewedTextFingerprint": "fnv1a64:3b8a6dcc85c41f64",
    "reviewedManuscriptSha256": "07ea2bf0060dd61bdfb60dc37bba5095428b428e3cf211f7d6051dae64229045",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-14",
    "number": 14,
    "title": "Fan the Ship",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 15,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Sam",
    "focus": "The sh digraph in ship, with a concrete change from dry rim to water.",
    "practiceWords": [
      "ship",
      "rim",
      "fan"
    ],
    "exceptions": [
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Exact HFW introduced in Cycle 5. Long o is not the short-o correspondence; this whole word also precedes regular g in Cycle 10. No general long-vowel or g rule follows."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      }
    ],
    "wordRecords": [
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "fan",
        "graphemes": [
          "f",
          "a",
          "n"
        ],
        "sounds": [
          "f",
          "æ",
          "n"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Decodable after Cycle 12 from g/e/t even though get is later listed for HFW review."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "ɡ",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 5. Long o is not the short-o correspondence; this whole word also precedes regular g in Cycle 10. No general long-vowel or g rule follows."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "rim",
        "graphemes": [
          "r",
          "i",
          "m"
        ],
        "sounds": [
          "ɹ",
          "ɪ",
          "m"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "ship",
        "graphemes": [
          "sh",
          "i",
          "p"
        ],
        "sounds": [
          "ʃ",
          "ɪ",
          "p"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tub",
        "graphemes": [
          "t",
          "u",
          "b"
        ],
        "sounds": [
          "t",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to fan a toy ship across to Dad, but it sits on the dry tub rim; he puts it into the water, fans it across, and Dad fans it back.",
      "failedAttempt": "Fanning harder cannot move the ship across the water while it rests on the dry rim.",
      "turn": "Sam moves the ship off the rim and into the tub’s water.",
      "resolution": "The ship travels across to Dad, who uses the same fan to send it back to Sam.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
    "props": [
      "One blue toy ship with white cabin and orange flat deck.",
      "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
      "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
      "No second ship, motors, sails, wind arrows or labels."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds the folded blue fan beside the ship resting on the broad tub rim. Dad waits opposite him across the shallow water.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "My ship is on the rim.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. The blue ship rests entirely on the dry broad rim nearest Sam. Water lies below inside the tub. Sam holds the blue fan; Dad sits at the opposite end.",
        "imageAlt": "Sam holds a blue fan beside a toy ship resting on the tub's rim. Dad sits across the table.",
        "state": {
          "page": 1,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "The blue ship rests entirely on the dry broad rim nearest Sam. Water lies below inside the tub. Sam holds the blue fan; Dad sits at the opposite end.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam holds a blue fan beside a toy ship resting on the tub's rim. Dad sits across the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I fan the ship.\nIt is on the rim.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam moves the fan toward the ship, but the ship remains on the dry rim in the same position. Show motion through a natural hand pose, not arrows.",
        "imageAlt": "Sam fans the blue ship, which stays on the dry rim of the tub. Dad watches.",
        "state": {
          "page": 2,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Sam moves the fan toward the ship, but the ship remains on the dry rim in the same position. Show motion through a natural hand pose, not arrows.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam fans the blue ship, which stays on the dry rim of the tub. Dad watches.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I fan and fan.\nIt is on the rim.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam makes another fan stroke; the ship is still on the dry rim. His eyes turn down toward the water below it.",
        "imageAlt": "Sam fans again and looks down toward the water. The ship stays on the rim.",
        "state": {
          "page": 3,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Sam makes another fan stroke; the ship is still on the dry rim. His eyes turn down toward the water below it.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam fans again and looks down toward the water. The ship stays on the rim.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I set the ship in the tub.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam places the ship gently into the shallow water near his end of the tub. The fan rests beside his hand on the table.",
        "imageAlt": "Sam sets the blue ship in the water. The blue fan rests on the table.",
        "state": {
          "page": 4,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Sam places the ship gently into the shallow water near his end of the tub. The fan rests beside his hand on the table.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam sets the blue ship in the water. The blue fan rests on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I fan the ship.\nThe ship can go!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam fans the floating ship across the open water toward Dad. The ship is upright with a small visible ripple, no self-propulsion or added sail.",
        "imageAlt": "Sam waves a blue fan as the toy ship floats across the tub toward Dad.",
        "state": {
          "page": 5,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Sam fans the floating ship across the open water toward Dad. The ship is upright with a small visible ripple, no self-propulsion or added sail.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam waves a blue fan as the toy ship floats across the tub toward Dad.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "“Dad, get the ship!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad reaches to receive the ship at his end of the tub. Sam holds the fan out toward Dad to pass it next.",
        "imageAlt": "Dad reaches for the floating ship as Sam holds out the blue fan.",
        "state": {
          "page": 6,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Dad reaches to receive the ship at his end of the tub. Sam holds the fan out toward Dad to pass it next.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad reaches for the floating ship as Sam holds out the blue fan.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "“Dad, fan the ship!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dad now holds the same blue fan and fans the ship back across the water toward Sam. Sam speaks and waits with open hands; no second fan.",
        "imageAlt": "Dad fans the ship toward Sam, who waits with open hands.",
        "state": {
          "page": 7,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Dad now holds the same blue fan and fans the ship back across the water toward Sam. Sam speaks and waits with open hands; no second fan.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Dad fans the ship toward Sam, who waits with open hands.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I get the ship!",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam receives the returning ship at his side of the tub. Dad lowers the single fan with a smile; the ship remains upright in shallow water.",
        "imageAlt": "Sam receives the floating ship at his end of the tub while Dad lowers the blue fan.",
        "state": {
          "page": 8,
          "setting": "A sunny patio with a low play table. Sam and Dad sit at opposite ends of a wide shallow clear water tub.",
          "visibleState": "Sam receives the returning ship at his side of the tub. Dad lowers the single fan with a smile; the ship remains upright in shallow water.",
          "propInvariants": [
            "One blue toy ship with white cabin and orange flat deck.",
            "One broad flat-rimmed clear tub containing shallow water; its near rim is wide enough to support the ship.",
            "One blue folded paper hand fan; Sam passes this same fan to Dad between pages 6 and 7.",
            "No second ship, motors, sails, wind arrows or labels."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DAD"
          ]
        },
        "pageDescription": "Sam receives the floating ship at his end of the tub while Dad lowers the blue fan.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why does the ship move after Sam changes its position?",
        "listenFor": "It is floating in the water instead of resting on the dry rim, so the fan can push it across."
      },
      "visual": {
        "page": 4,
        "prompt": "What changes about the bottom of the ship here?",
        "lookFor": "It is now in the water instead of resting on the tub rim."
      }
    },
    "levelRationale": "Eight pages with short paired sentences, one physical cause and two dialogue pages. The repeated failed action changes at the explicit placement sentence; the return trip completes shared play.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "sh",
        "sound": "ʃ",
        "word": "ship",
        "model": "Say ship, listen for the first /ʃ/, and point to the two letters sh together. Blend sh–i–p; sh represents one sound here."
      },
      "decoding": {
        "words": [
          "ship",
          "rim",
          "fan"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "rim",
          "meaning": "The edge around the top of the tub."
        },
        {
          "word": "fan",
          "meaning": "Move air toward something with a fan."
        },
        {
          "word": "ship",
          "meaning": "A toy boat in this story."
        }
      ],
      "connectedReading": "Read both failed attempts and the placement change. Ask the child to explain where the ship was before and after. The final pass back connects the solution with shared play.",
      "fluency": "Read the repeated rim lines with gentle anticipation; pause at the change and use lively voices for the two invitations."
    },
    "reviewedTextFingerprint": "fnv1a64:b7c221cfdef1a59e",
    "reviewedManuscriptSha256": "64895f3c08002d1b473e683194549edb02d42949c21e06e04cf897e51f55b272",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-15",
    "number": 15,
    "title": "Can I Chat?",
    "appLevel": "B",
    "level": "B",
    "interestAge": "4–8",
    "afterCycle": 15,
    "readingMode": "decodable",
    "type": "fiction",
    "narrator": "Dot",
    "focus": "The ch and sh digraphs in chat and ship; a direct turn-taking repair.",
    "practiceWords": [
      "chat",
      "jet",
      "ship"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "cycle": 3,
        "reason": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Exact HFW introduced in Cycle 5. Long o is not the short-o correspondence; this whole word also precedes regular g in Cycle 10. No general long-vowel or g rule follows."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "The unstressed article has schwa, not the taught short-a sound; exact HFW introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 3,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 3 and practiced as a whole word. Final nd exceeds this collection's VC/CVC shape; its sounds are otherwise regular. Natural connected speech may reduce a to schwa; no new cluster rule is inferred."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "chat",
        "graphemes": [
          "ch",
          "a",
          "t"
        ],
        "sounds": [
          "tʃ",
          "æ",
          "t"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "uː"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "The vowel is /uː/, not the short-o correspondence; exact HFW introduced in Cycle 6."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Authored VC/CVC alignment; each sound is already in the declared cumulative code. Dot the child and dot the map mark share /dɑt/; case does not alter scope."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "ɡ",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 5. Long o is not the short-o correspondence; this whole word also precedes regular g in Cycle 10. No general long-vowel or g rule follows."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "The first-person pronoun I has long /aɪ/, not short i; exact HFW introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s is voiced /z/ in this exact HFW taught in Cycle 4; no general s-to-z permission."
      },
      {
        "word": "jet",
        "graphemes": [
          "j",
          "e",
          "t"
        ],
        "sounds": [
          "dʒ",
          "ɛ",
          "t"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/ in this exact Cycle 6 HFW; initial consonant y does not license it generally."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Name Sam obeys the same reviewed CVC code as other words."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "ship",
        "graphemes": [
          "sh",
          "i",
          "p"
        ],
        "sounds": [
          "ʃ",
          "ɪ",
          "p"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Whole-word HFW from Cycle 2; voiced th and unstressed schwa are not yet available as general code. Every occurrence precedes a consonant sound."
      },
      {
        "word": "tub",
        "graphemes": [
          "t",
          "u",
          "b"
        ],
        "sounds": [
          "t",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Fully regular within the declared VC/CVC scope; U.S. short-vowel pronunciation."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Authored VC/CVC pronunciation within the taught code."
      },
      {
        "word": "yes",
        "graphemes": [
          "y",
          "e",
          "s"
        ],
        "sounds": [
          "j",
          "ɛ",
          "s"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation; one short vowel, no consonant blend, suffix or untaught spelling."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "uː"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Exact HFW introduced in Cycle 10. ou represents /uː/ here; y is also not yet a regular correspondence at this point. Do not generalize the spelling."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam talks excitedly about his jet and Dot cannot get a turn; Dot asks to speak, Sam listens, and they combine her ship with his jet in one shared game.",
      "failedAttempt": "Dot tries to join the conversation, but Sam keeps talking and she stays silent.",
      "turn": "Dot asks directly for a turn; Sam stops and invites her to speak.",
      "resolution": "They act on Dot’s idea and set Sam’s jet on her ship, combining both contributions.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ]
    },
    "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
    "props": [
      "One small yellow toy jet held by Sam.",
      "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
      "One wide tub containing shallow water, visible from the start and unchanged throughout.",
      "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
    ],
    "coverBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam holds the yellow jet near his shoulder while Dot holds the red ship and raises one hand to join in. Show the ordinary conversation premise without angry caricatures.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam can chat and chat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam talks animatedly while holding the yellow jet. Dot holds the red ship and starts to raise one hand, waiting for a gap. The tub of shallow water is visible nearby.",
        "imageAlt": "Sam talks while holding a yellow toy jet. Dot holds a red ship beside the water tub.",
        "state": {
          "page": 1,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Sam talks animatedly while holding the yellow jet. Dot holds the red ship and starts to raise one hand, waiting for a gap. The tub of shallow water is visible nearby.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam talks while holding a yellow toy jet. Dot holds a red ship beside the water tub.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "“My jet can go up!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lifts the jet upward as he describes it. Dot watches with her mouth closed and her ship held still.",
        "imageAlt": "Sam raises the yellow jet above his shoulder. Dot watches with the red ship on her lap.",
        "state": {
          "page": 2,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Sam lifts the jet upward as he describes it. Dot watches with her mouth closed and her ship held still.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam raises the yellow jet above his shoulder. Dot watches with the red ship on her lap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I do not chat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot remains silent with her hand partly raised; Sam still holds the jet near his face. Show the missed conversational turn without bullying or humiliation.",
        "imageAlt": "Sam talks with the yellow jet near his face. Dot waits with one hand partly raised and the red ship on her lap.",
        "state": {
          "page": 3,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Dot remains silent with her hand partly raised; Sam still holds the jet near his face. Show the missed conversational turn without bullying or humiliation.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam talks with the yellow jet near his face. Dot waits with one hand partly raised and the red ship on her lap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "“Can I chat?”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot faces Sam and asks to speak, raising one open hand gently. Sam begins to turn his attention toward her.",
        "imageAlt": "Dot raises an open hand and speaks to Sam. Sam turns toward her with the jet lowered beside his shoulder.",
        "state": {
          "page": 4,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Dot faces Sam and asks to speak, raising one open hand gently. Sam begins to turn his attention toward her.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot raises an open hand and speaks to Sam. Sam turns toward her with the jet lowered beside his shoulder.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "“Yes, Dot. You can chat.”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam lowers the jet and looks at Dot, making an open inviting gesture. Dot is ready to speak; Sam is the speaker on this page.",
        "imageAlt": "Sam lowers his jet and opens a hand toward Dot. Dot holds her red ship and looks at him.",
        "state": {
          "page": 5,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Sam lowers the jet and looks at Dot, making an open inviting gesture. Dot is ready to speak; Sam is the speaker on this page.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Sam lowers his jet and opens a hand toward Dot. Dot holds her red ship and looks at him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "“My ship can go\nin a tub!”",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot sets the red ship afloat in the shallow tub as she explains her idea. Sam watches her and listens with the jet lowered.",
        "imageAlt": "Dot sets her red toy ship in the water while Sam holds his yellow jet and listens.",
        "state": {
          "page": 6,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Dot sets the red ship afloat in the shallow tub as she explains her idea. Sam watches her and listens with the jet lowered.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot sets her red toy ship in the water while Sam holds his yellow jet and listens.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Sam and I set\nthe jet on the ship.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Dot steadies her ship in the shallow tub while Sam places his small yellow jet on its broad flat deck. Both children take part; the ship remains upright.",
        "imageAlt": "Dot steadies the red ship while Sam sets his yellow jet on its deck.",
        "state": {
          "page": 7,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Dot steadies her ship in the shallow tub while Sam places his small yellow jet on its broad flat deck. Both children take part; the ship remains upright.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot steadies the red ship while Sam sets his yellow jet on its deck.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The jet is on the ship.\nSam and I chat.",
        "imageBrief": "Clean, clear, bright cartoon with crisp continuous outlines and flat colors; simple cel shading only. No painterly marks, paper/canvas texture, patchy daubs, embossing, fuzzy edges or generated lettering. Keep Small Steps canon faces, proportions, clothing and animal markings. Landscape composition with all important action fully visible. Sam and Dot now face each other in an easy shared conversation beside the tub; Dot speaks while Sam listens. The yellow jet rests securely on the red ship floating between them, showing both contributions in their shared game.",
        "imageAlt": "Dot talks to Sam beside the tub. The yellow jet rests on the red ship in the water.",
        "state": {
          "page": 8,
          "setting": "One bright playroom with a clear floor and a wide play tub of shallow water beside the window. Sam and Dot face each other with toys.",
          "visibleState": "Sam and Dot now face each other in an easy shared conversation beside the tub; Dot speaks while Sam listens. The yellow jet rests securely on the red ship floating between them, showing both contributions in their shared game.",
          "propInvariants": [
            "One small yellow toy jet held by Sam.",
            "One red toy ship with a broad flat deck and small white cabin at the back, held by Dot. It is distinct from the blue ship in book 14.",
            "One wide tub containing shallow water, visible from the start and unchanged throughout.",
            "The jet is small enough to rest securely on the ship’s flat deck; no new parts or vehicles appear."
          ],
          "cast": [
            "SMALL-SAM",
            "SMALL-DOT"
          ]
        },
        "pageDescription": "Dot talks to Sam beside the tub. The yellow jet rests on the red ship in the water.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What changes after Dot asks to chat?",
        "listenFor": "Sam listens to her idea, and they combine the jet and ship in their game."
      },
      "visual": {
        "page": 5,
        "prompt": "What shows that Sam is making room for Dot’s turn?",
        "lookFor": "He lowers his jet, looks at Dot and makes an inviting gesture."
      }
    },
    "levelRationale": "Eight short pages include four dialogue pages, clear speaker changes and a concrete social consequence. A final shared conversation returns to the opening with both children participating, and the combined toys make the change concrete.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ch",
        "sound": "tʃ",
        "word": "chat",
        "model": "Say chat, listen for the first /tʃ/, and point to ch together. Blend ch–a–t, then compare the first sound with sh in ship."
      },
      "decoding": {
        "words": [
          "chat",
          "jet",
          "ship"
        ],
        "model": "Point to each reviewed spelling from left to right, say its sound without an added vowel, blend the whole word, and reread its sentence for meaning. Teach the listed exact exception words separately; do not infer new spelling rules from them."
      },
      "languagePrep": [
        {
          "word": "chat",
          "meaning": "Talk with someone."
        },
        {
          "word": "jet",
          "meaning": "An airplane with jet engines; this one is a toy."
        },
        {
          "word": "up",
          "meaning": "Toward a higher place."
        }
      ],
      "connectedReading": "Read the dialogue and identify the speaker from each clear turn. Then explain how Dot gets a turn and how the last action includes both ideas. Offer unscored oral role-play after reading.",
      "fluency": "Give Sam and Dot distinct but natural voices. Pause between speakers and read Sam and I chat as a warm callback to Sam chatting alone at the start."
    },
    "reviewedTextFingerprint": "fnv1a64:b0d02981afcfb1d1",
    "reviewedManuscriptSha256": "d295bec86abec809a825e6faece0faaec513aeccde504a4d868116e0d2fb5b6b",
    "readingBandProfile": "standard",
    "additionalPrerequisites": []
  },
  {
    "id": "next-steps-16",
    "number": 16,
    "title": "A Dash and a Hop",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 15,
    "additionalPrerequisites": [
      "next-steps-final-blends"
    ],
    "focus": "sh in dash; explicitly taught final-consonant blending in fast, last and rest",
    "practiceWords": [
      "dash",
      "fast",
      "rest"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bit",
        "graphemes": [
          "b",
          "i",
          "t"
        ],
        "sounds": [
          "b",
          "ɪ",
          "t"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dash",
        "graphemes": [
          "d",
          "a",
          "sh"
        ],
        "sounds": [
          "d",
          "æ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fast",
        "graphemes": [
          "f",
          "a",
          "s",
          "t"
        ],
        "sounds": [
          "f",
          "æ",
          "s",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "fun",
        "graphemes": [
          "f",
          "u",
          "n"
        ],
        "sounds": [
          "f",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "hop",
        "graphemes": [
          "h",
          "o",
          "p"
        ],
        "sounds": [
          "h",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "if",
        "graphemes": [
          "i",
          "f"
        ],
        "sounds": [
          "ɪ",
          "f"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "last",
        "graphemes": [
          "l",
          "a",
          "s",
          "t"
        ],
        "sounds": [
          "l",
          "æ",
          "s",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "leg",
        "graphemes": [
          "l",
          "e",
          "g"
        ],
        "sounds": [
          "l",
          "ɛ",
          "g"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "log",
        "graphemes": [
          "l",
          "o",
          "g"
        ],
        "sounds": [
          "l",
          "ɑ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "i"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "much",
        "graphemes": [
          "m",
          "u",
          "ch"
        ],
        "sounds": [
          "m",
          "ʌ",
          "tʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "nod",
        "graphemes": [
          "n",
          "o",
          "d"
        ],
        "sounds": [
          "n",
          "ɑ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rest",
        "graphemes": [
          "r",
          "e",
          "s",
          "t"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "s",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rub",
        "graphemes": [
          "r",
          "u",
          "b"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "b"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "this",
        "graphemes": [
          "th",
          "i",
          "s"
        ],
        "sounds": [
          "ð",
          "ɪ",
          "s"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants a running game that he and Dot can enjoy together.",
      "failedAttempt": "Sam wins two ordinary dashes while Dot trails and loses interest.",
      "turn": "A hopping trial lets Dot reach the same endpoint with Sam; the next dash confirms the difference.",
      "resolution": "Sam chooses hopping for the last race; Dot arrives before him and both rest together.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
    "props": [
      "One low broad log at the left endpoint.",
      "One tan wooden play hut at the right endpoint.",
      "No finish-line banner, stopwatch, medals or extra competitors."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam hops beside a smiling running Dot midway between the log and hut; both complete bodies and both landmarks remain in frame.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dot and I dash to the log.\nI am fast. Dot is last.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam stands beside the log at the left end of the lane. Dot is still running toward him from the right. Her expression is disappointed, not distressed.",
        "imageAlt": "Sam reaches the log before Dot.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Sam stands beside the log at the left end of the lane. Dot is still running toward him from the right. Her expression is disappointed, not distressed.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam reaches the log before Dot.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I dash to the hut.\nDot is last at the hut.\nThis is not much fun for Dot.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam has reached the hut at the right. Dot arrives behind him with drooped shoulders. The same log remains far left.",
        "imageAlt": "Sam waits at the hut while Dot arrives behind him.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Sam has reached the hut at the right. Dot arrives behind him with drooped shoulders. The same log remains far left.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Sam waits at the hut while Dot arrives behind him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I sit with Dot.\nI nod at the log.\n\"Dash to the log, Dot!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot sit together on the grass near the hut. Sam points toward the log. Both look at the proposed endpoint.",
        "imageAlt": "Sam sits with Dot and points to the log.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Sam and Dot sit together on the grass near the hut. Sam points toward the log. Both look at the proposed endpoint.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Sam sits with Dot and points to the log.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I hop to the log.\nDot is at the log with me.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam lands a one-foot hop beside the log as Dot arrives beside him running. They look pleasantly surprised to arrive together.",
        "imageAlt": "Sam hops to the log as Dot runs beside him.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Sam lands a one-foot hop beside the log as Dot arrives beside him running. They look pleasantly surprised to arrive together.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Sam hops to the log as Dot runs beside him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I dash to the hut.\nDot is last at the hut.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam has dashed back to the hut and stands there. Dot is still approaching behind. The contrast with their shared arrival is visible.",
        "imageAlt": "Sam reaches the hut while Dot is still running.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Sam has dashed back to the hut and stands there. Dot is still approaching behind. The contrast with their shared arrival is visible.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam reaches the hut while Dot is still running.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "If I hop, Dot can dash with me.\nI nod at the hut.",
        "imageBrief": "After returning to the log at the left end of the lane, Sam raises one knee to demonstrate hopping and points toward the hut on the right. Dot stands beside him ready to run. They are planning the next race.",
        "imageAlt": "Sam lifts one knee while he and Dot look along the garden path.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Children at left log; Sam demonstrates hop and indicates right hut.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8.",
          "visibleState": "Children at left log; Sam demonstrates hop and indicates right hut."
        },
        "pageDescription": "Sam lifts one knee while he and Dot look along the garden path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "I hop to the hut.\nDot is at the hut. I am last!",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot stands at the hut smiling while Sam is still several hops short of it. Keep his single raised leg anatomically natural.",
        "imageAlt": "Dot reaches the hut while Sam hops toward her. A log stands at the other end of the garden.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Dot stands at the hut smiling while Sam is still several hops short of it. Keep his single raised leg anatomically natural.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Dot reaches the hut while Sam hops toward her. A log stands at the other end of the garden.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I rub my leg.\nDot and I rest for a bit.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot sit beside the hut. Sam gently rubs his calf while both smile; the hopping race has tired him.",
        "imageAlt": "Sam rubs his leg as he and Dot sit beside the hut.",
        "state": {
          "location": "An enclosed garden with a low round log at the left end of a straight grass play lane and a small tan play hut at the right. The landmarks never move.",
          "visible": "Sam and Dot sit beside the hut. Sam gently rubs his calf while both smile; the hopping race has tired him.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Sam rubs his leg as he and Dot sit beside the hut.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Sam change to make the race work for both of them?",
        "listenFor": "He hopped while Dot ran. They reached the log together, and Dot later reached the hut first."
      },
      "visual": {
        "page": 4,
        "prompt": "What is different about the way the children reach the log?",
        "lookFor": "Sam is hopping on one leg; Dot is running, and they arrive beside each other."
      }
    },
    "levelRationale": "C: the child compares repeated trials, interprets contrasting outcomes, and reads an explicit if-clause before Sam applies his new rule.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "sh",
        "sound": "ʃ",
        "word": "dash",
        "model": "Say dash naturally. Locate sh in its print and model its reviewed sound ʃ; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "dash",
          "fast",
          "rest"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in dash, fast, rest; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "dash",
          "meaning": "run quickly for a short distance"
        },
        {
          "word": "last",
          "meaning": "after the other person"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What did Sam change to make the race work for both of them? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 4 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:b7731abe98ad3000",
    "reviewedManuscriptSha256": "42a1745889fcfa7aa5c2df27711741ad25c8ea6b8ccc3d3322748671b47c11e8",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-17",
    "number": 17,
    "title": "A Tall Wall",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 16,
    "additionalPrerequisites": [
      "next-steps-final-blends"
    ],
    "focus": "all in tall and wall; stable construction through a changed base",
    "practiceWords": [
      "tall",
      "wall",
      "gap"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "of",
        "cycle": 4,
        "reason": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "gap",
        "graphemes": [
          "g",
          "a",
          "p"
        ],
        "sounds": [
          "g",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "g",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "let",
        "graphemes": [
          "l",
          "e",
          "t"
        ],
        "sounds": [
          "l",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "of",
        "graphemes": [
          "o",
          "f"
        ],
        "sounds": [
          "ə",
          "v"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "tall",
        "graphemes": [
          "t",
          "all"
        ],
        "sounds": [
          "t",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "tips",
        "graphemes": [
          "t",
          "i",
          "p",
          "s"
        ],
        "sounds": [
          "t",
          "ɪ",
          "p",
          "s"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "top",
        "graphemes": [
          "t",
          "o",
          "p"
        ],
        "sounds": [
          "t",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "wall",
        "graphemes": [
          "w",
          "all"
        ],
        "sounds": [
          "w",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Dot wants a tall cup wall to stay up.",
      "failedAttempt": "A narrow three-cup tower tumbles when she lets go.",
      "turn": "She changes the base to two cups side by side.",
      "resolution": "The third cup rests across the two lower cups and the wall stays up.",
      "canonIds": [
        "SMALL-DOT"
      ]
    },
    "narrator": {
      "characterId": "SMALL-DOT",
      "person": "first",
      "tense": "present"
    },
    "setting": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
    "props": [
      "Exactly three identical red plastic cups. Tall attempt alternates rim-down, rim-up, rim-down; stable pyramid uses all three rim-down.",
      "One rectangular green mat."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot kneels beside the stable three-cup pyramid on the green mat, proud but natural; show all three complete red cups.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I set a cup on a cup.",
        "imageBrief": "Dot puts the second red cup upright on the small closed base of the inverted first cup; the two closed bases touch. The third inverted cup waits beside them. Exactly three cups.",
        "imageAlt": "Dot stacks two red cups while another cup waits on the mat.",
        "state": {
          "location": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
          "visible": "Two cups form a base-to-base hourglass, Dot supports the upper upright cup; third cup separate.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 6.",
          "visibleState": "Two cups form a base-to-base hourglass, Dot supports the upper upright cup; third cup separate.",
          "propInvariants": [
            "Exactly three identical red plastic cups. Tall attempt alternates rim-down, rim-up, rim-down; stable pyramid uses all three rim-down.",
            "One rectangular green mat."
          ]
        },
        "pageDescription": "Dot stacks two red cups while another cup waits on the mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I set a cup on top.\nThe wall is tall.",
        "imageBrief": "Dot places the third cup rim-down on the wide upward-facing rim of the middle cup. Three cups form a narrow column with orientations bottom rim-down, middle rim-up, top rim-down.",
        "imageAlt": "Dot holds the top cup of a tall stack.",
        "state": {
          "location": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
          "visible": "Three-cup tall alternating column, top rim meets middle rim; Dot supports top cup.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 6.",
          "visibleState": "Three-cup tall alternating column, top rim meets middle rim; Dot supports top cup.",
          "propInvariants": [
            "Exactly three identical red plastic cups. Tall attempt alternates rim-down, rim-up, rim-down; stable pyramid uses all three rim-down.",
            "One rectangular green mat."
          ]
        },
        "pageDescription": "Dot holds the top cup of a tall stack.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I let go. The wall tips!",
        "imageBrief": "Dot lets go. The narrow alternating three-cup column tips sideways, with all three cups intact.",
        "imageAlt": "The cup wall tips onto the mat.",
        "state": {
          "location": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
          "visible": "Three alternating cups tip; Dot's hands clear.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 6.",
          "visibleState": "Three alternating cups tip; Dot's hands clear.",
          "propInvariants": [
            "Exactly three identical red plastic cups. Tall attempt alternates rim-down, rim-up, rim-down; stable pyramid uses all three rim-down.",
            "One rectangular green mat."
          ]
        },
        "pageDescription": "The cup wall tips onto the mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I set a cup and a cup\non the mat.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot places two inverted red cups side by side on the mat. The third cup waits to one side.",
        "imageAlt": "Dot puts two cups beside each other.",
        "state": {
          "location": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
          "visible": "Dot places two inverted red cups side by side on the mat. The third cup waits to one side.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 6."
        },
        "pageDescription": "Dot puts two cups beside each other.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I set a cup\non top of the gap.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot positions the third inverted cup so its rim bridges the two lower cups. Her hands still support it.",
        "imageAlt": "Dot places the third cup across the two lower cups.",
        "state": {
          "location": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
          "visible": "Dot positions the third inverted cup so its rim bridges the two lower cups. Her hands still support it.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 6."
        },
        "pageDescription": "Dot places the third cup across the two lower cups.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I let go. The wall is up!",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot holds both hands away and smiles. The three-cup triangular wall stands by itself on the green mat.",
        "imageAlt": "Dot kneels beside a pyramid of three red cups, with her hands resting on her lap.",
        "state": {
          "location": "A sunny indoor play corner. One rectangular green mat lies on a level floor.",
          "visible": "Dot holds both hands away and smiles. The three-cup triangular wall stands by itself on the green mat.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 6."
        },
        "pageDescription": "Dot kneels beside a pyramid of three red cups, with her hands resting on her lap.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Dot change after the cups fell?",
        "listenFor": "She used two cups at the bottom and one across the top instead of one narrow column."
      },
      "visual": {
        "page": 5,
        "prompt": "Which cups hold up the top cup?",
        "lookFor": "The two cups beside each other support the cup across their tops."
      }
    },
    "levelRationale": "B: a single construction problem, one observed failure and one changed arrangement, carried by short present-tense sentences.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "all",
        "sound": "ɔl",
        "word": "wall",
        "model": "Say wall naturally. Locate all in its print and model its reviewed sound ɔl; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "tall",
          "wall",
          "gap"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in tall, wall, gap; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "gap",
          "meaning": "a space between things"
        },
        {
          "word": "wall",
          "meaning": "a structure that stands up"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What did Dot change after the cups fell? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 5 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:1c1baa19d97122fe",
    "reviewedManuscriptSha256": "5390c91398d9a6976e50e905fdf5a042026c8a6c5e43e13f4d5d353244dc179f",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-18",
    "number": 18,
    "title": "The Quiz",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 16,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends"
    ],
    "focus": "qu in quiz, final blend in felt and initial blend in grin; using a visible clue",
    "practiceWords": [
      "quiz",
      "felt",
      "grin"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "no",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "felt",
        "graphemes": [
          "f",
          "e",
          "l",
          "t"
        ],
        "sounds": [
          "f",
          "ɛ",
          "l",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fin",
        "graphemes": [
          "f",
          "i",
          "n"
        ],
        "sounds": [
          "f",
          "ɪ",
          "n"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fish",
        "graphemes": [
          "f",
          "i",
          "sh"
        ],
        "sounds": [
          "f",
          "ɪ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "grin",
        "graphemes": [
          "g",
          "r",
          "i",
          "n"
        ],
        "sounds": [
          "g",
          "ɹ",
          "ɪ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lid",
        "graphemes": [
          "l",
          "i",
          "d"
        ],
        "sounds": [
          "l",
          "ɪ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "no",
        "graphemes": [
          "n",
          "o"
        ],
        "sounds": [
          "n",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "nod",
        "graphemes": [
          "n",
          "o",
          "d"
        ],
        "sounds": [
          "n",
          "ɑ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "quiz",
        "graphemes": [
          "qu",
          "i",
          "z"
        ],
        "sounds": [
          "kw",
          "ɪ",
          "z"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "i"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "tip",
        "graphemes": [
          "t",
          "i",
          "p"
        ],
        "sounds": [
          "t",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants Dad to identify a hidden felt fish.",
      "failedAttempt": "A small red glimpse leads Dad to guess a cap.",
      "turn": "Sam tips the lid to show the distinctive fin.",
      "resolution": "Dad identifies the fish and Sam puts it playfully in a real cap.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "A low play table in the family room. Dad sits opposite Sam.",
    "props": [
      "One small square cream cardboard box with a loose matching lid.",
      "One flat red felt fish with a clear triangular fin; no living fish.",
      "One blue child baseball cap, on the table until the final page."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dad share a playful look across the closed cream box; a small red felt fin peeks out. Keep the cap beside Sam.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad and I do a quiz.\nI get a box.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam lifts the empty cream box onto the table while Dad watches. The red felt fish lies on Sam’s side of the table and the blue cap is beside it.",
        "imageAlt": "Sam puts a box on the table in front of Dad.",
        "state": {
          "location": "A low play table in the family room. Dad sits opposite Sam.",
          "visible": "Sam lifts the empty cream box onto the table while Dad watches. The red felt fish lies on Sam’s side of the table and the blue cap is beside it.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 6."
        },
        "pageDescription": "Sam puts a box on the table in front of Dad.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I set a felt fish in the box.\nDad can see red.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The felt fish lies inside the box. Sam has set the lid almost fully on it; only a small anonymous red tip shows to Dad. Keep the recognizable fish body concealed from Dad’s view.",
        "imageAlt": "A small red tip peeks out from under the box lid.",
        "state": {
          "location": "A low play table in the family room. Dad sits opposite Sam.",
          "visible": "The felt fish lies inside the box. Sam has set the lid almost fully on it; only a small anonymous red tip shows to Dad. Keep the recognizable fish body concealed from Dad’s view.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 6."
        },
        "pageDescription": "A small red tip peeks out from under the box lid.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dad says, \"Is it a cap?\"\nI tip the lid.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad points toward the small red glimpse while Sam begins to tilt the lid. Show only the beginning of the reveal, not the full fish.",
        "imageAlt": "Dad points to the box while Sam tips the lid.",
        "state": {
          "location": "A low play table in the family room. Dad sits opposite Sam.",
          "visible": "Dad points toward the small red glimpse while Sam begins to tilt the lid. Show only the beginning of the reveal, not the full fish.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 6."
        },
        "pageDescription": "Dad points to the box while Sam tips the lid.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "\"No, Dad. Look at the fin.\"\nDad can see the fin.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam holds the lid tilted high enough to expose the triangular red felt fin. Dad leans forward to inspect the fin.",
        "imageAlt": "Sam shows Dad the felt fish’s fin.",
        "state": {
          "location": "A low play table in the family room. Dad sits opposite Sam.",
          "visible": "Sam holds the lid tilted high enough to expose the triangular red felt fin. Dad leans forward to inspect the fin.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 6."
        },
        "pageDescription": "Sam shows Dad the felt fish’s fin.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dad says, \"It is a fish!\" I nod.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam opens the box fully. Dad smiles and points to the whole red felt fish. Sam nods.",
        "imageAlt": "Dad points to the felt fish in the open box.",
        "state": {
          "location": "A low play table in the family room. Dad sits opposite Sam.",
          "visible": "Sam opens the box fully. Dad smiles and points to the whole red felt fish. Sam nods.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 6."
        },
        "pageDescription": "Dad points to the felt fish in the open box.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I set the fish in my cap.\nDad and I grin.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam holds the blue cap with the red felt fish sitting inside it. Sam and Dad grin together; the open empty box remains on the table.",
        "imageAlt": "Sam holds the fish in his cap while he and Dad grin.",
        "state": {
          "location": "A low play table in the family room. Dad sits opposite Sam.",
          "visible": "Sam holds the blue cap with the red felt fish sitting inside it. Sam and Dad grin together; the open empty box remains on the table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 6."
        },
        "pageDescription": "Sam holds the fish in his cap while he and Dad grin.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Which clue helped Dad change his answer?",
        "listenFor": "Seeing the fin showed that the red shape was a fish rather than a cap."
      },
      "visual": {
        "page": 4,
        "prompt": "What shape sticks out of Sam’s red piece? Show Dad.",
        "lookFor": "The pointed fin belongs to the felt fish."
      }
    },
    "levelRationale": "B, revised from planned C: one partial-view clue and one corrected guess form a complete six-page story. More pages would pad this small arc.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "qu",
        "sound": "kw",
        "word": "quiz",
        "model": "Say quiz naturally. Locate qu in its print and model its reviewed sound kw; keep the multiple consonant sounds in this taught chunk, rather than calling it one phoneme."
      },
      "decoding": {
        "words": [
          "quiz",
          "felt",
          "grin"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in quiz, felt, grin; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "quiz",
          "meaning": "a question game"
        },
        {
          "word": "felt",
          "meaning": "soft cloth used for crafts"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: Which clue helped Dad change his answer? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 4 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:678d4b3ab0dddb92",
    "reviewedManuscriptSha256": "d983af3af303ac46d97256611748f18f967dde7f46ecf763b3cdae6b34fb4b3f",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-19",
    "number": 19,
    "title": "A Job for Each",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 17,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends"
    ],
    "focus": "final adjacent consonants in help and cups; explicitly taught each and said",
    "practiceWords": [
      "help",
      "cups",
      "each"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "each",
        "cycle": 17,
        "reason": "Whole-word ea represents /i/. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "no",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "of",
        "cycle": 4,
        "reason": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "said",
        "cycle": 7,
        "reason": "Whole-word ai represents /ɛ/. Explicit HFW first introduced in Cycle 7."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "was",
        "cycle": 11,
        "reason": "Unstressed a is schwa and final s represents /z/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "all",
        "graphemes": [
          "all"
        ],
        "sounds": [
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bun",
        "graphemes": [
          "b",
          "u",
          "n"
        ],
        "sounds": [
          "b",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cups",
        "graphemes": [
          "c",
          "u",
          "p",
          "s"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p",
          "s"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dish",
        "graphemes": [
          "d",
          "i",
          "sh"
        ],
        "sounds": [
          "d",
          "ɪ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "each",
        "graphemes": [
          "ea",
          "ch"
        ],
        "sounds": [
          "i",
          "tʃ"
        ],
        "firstCycle": 17,
        "type": "exception",
        "note": "Whole-word ea represents /i/. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "g",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "got",
        "graphemes": [
          "g",
          "o",
          "t"
        ],
        "sounds": [
          "g",
          "ɑ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "had",
        "graphemes": [
          "h",
          "a",
          "d"
        ],
        "sounds": [
          "h",
          "æ",
          "d"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "help",
        "graphemes": [
          "h",
          "e",
          "l",
          "p"
        ],
        "sounds": [
          "h",
          "ɛ",
          "l",
          "p"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "job",
        "graphemes": [
          "j",
          "o",
          "b"
        ],
        "sounds": [
          "dʒ",
          "ɑ",
          "b"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "jug",
        "graphemes": [
          "j",
          "u",
          "g"
        ],
        "sounds": [
          "dʒ",
          "ʌ",
          "g"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "i"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "no",
        "graphemes": [
          "n",
          "o"
        ],
        "sounds": [
          "n",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "of",
        "graphemes": [
          "o",
          "f"
        ],
        "sounds": [
          "ə",
          "v"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "said",
        "graphemes": [
          "s",
          "ai",
          "d"
        ],
        "sounds": [
          "s",
          "ɛ",
          "d"
        ],
        "firstCycle": 7,
        "type": "exception",
        "note": "Whole-word ai represents /ɛ/. Explicit HFW first introduced in Cycle 7."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sat",
        "graphemes": [
          "s",
          "a",
          "t"
        ],
        "sounds": [
          "s",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sip",
        "graphemes": [
          "s",
          "i",
          "p"
        ],
        "sounds": [
          "s",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "that",
        "graphemes": [
          "th",
          "a",
          "t"
        ],
        "sounds": [
          "ð",
          "æ",
          "t"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "them",
        "graphemes": [
          "th",
          "e",
          "m"
        ],
        "sounds": [
          "ð",
          "ɛ",
          "m"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "then",
        "graphemes": [
          "th",
          "e",
          "n"
        ],
        "sounds": [
          "ð",
          "ɛ",
          "n"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "us",
        "graphemes": [
          "u",
          "s"
        ],
        "sounds": [
          "ʌ",
          "s"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "was",
        "graphemes": [
          "w",
          "a",
          "s"
        ],
        "sounds": [
          "w",
          "ə",
          "z"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Unstressed a is schwa and final s represents /z/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "u"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Dot and Sam are meant to bring a shared snack to Dad.",
      "failedAttempt": "Dot carries the first items while Sam sits; the remaining cups and buns make her workload visible.",
      "turn": "Sam gets up and proposes sharing the remaining jobs.",
      "resolution": "Both children deliver their part and Dad fills the cups while the children rest.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "person": "third",
      "tense": "past"
    },
    "setting": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
    "props": [
      "One yellow jug of water.",
      "One cream serving dish.",
      "Exactly three identical small blue cups.",
      "Exactly three small plain buns.",
      "One red rug in front of the hut."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot carries the nested blue cups and Sam carries three small buns toward Dad by the play hut. The jug and dish are already on the rug.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam and Dot had a job.\nDad was in the hut.\nThe jug and the dish had to go to Dad.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot and Sam stand at the supply table holding no items yet. The jug, dish, three cups and three buns are on the table. Dad sits on the rug at the hut.",
        "imageAlt": "Sam and Dot stand by the snack supplies while Dad waits at the hut.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Dot and Sam stand at the supply table holding no items yet. The jug, dish, three cups and three buns are on the table. Dad sits on the rug at the hut.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam and Dot stand by the snack supplies while Dad waits at the hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Dot got the jug to the hut.\nSam sat on the rug with Dad.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot sets the yellow jug on the rug. Sam now sits beside Dad. The dish, three cups and buns remain at the supply table.",
        "imageAlt": "Dot brings the jug to the rug where Sam and Dad sit.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Dot sets the yellow jug on the rug. Sam now sits beside Dad. The dish, three cups and buns remain at the supply table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Dot brings the jug to the rug where Sam and Dad sit.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dot got the dish to the hut.\nThen Dot sat.\nThe cup was not in the hut.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot has delivered the cream dish beside the jug and sits briefly at the rug’s edge with tired shoulders. The three blue cups and buns are still on the supply table.",
        "imageAlt": "Dot sits beside the jug and dish while the cups remain on the table.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Dot has delivered the cream dish beside the jug and sits briefly at the rug’s edge with tired shoulders. The three blue cups and buns are still on the supply table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Dot sits beside the jug and dish while the cups remain on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "\"Is that all?\" said Sam.\n\"No,\" said Dot.\n\"A cup and a bun for each of us.\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam looks toward Dot as she gestures from the rug to the waiting cups and buns. Dad remains seated; no food has yet been delivered.",
        "imageAlt": "Dot points toward the cups and buns still waiting on the table.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Sam looks toward Dot as she gestures from the rug to the waiting cups and buns. Dad remains seated; no food has yet been delivered.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Dot points toward the cups and buns still waiting on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Sam got up. \"I can help!\nI can get a bun for each of us.\nYou get the cups.\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam stands and offers to help, pointing toward the buns. Dot points toward the three blue cups. Both are ready to return to the supply table.",
        "imageAlt": "Sam stands beside Dot and points to the buns.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Sam stands and offers to help, pointing toward the buns. Dot points toward the three blue cups. Both are ready to return to the supply table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam stands beside Dot and points to the buns.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Dot got the cups.\nSam got a bun for each of them.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot carries the three empty nested cups while Sam carries the three small buns in both hands. They walk together toward the hut.",
        "imageAlt": "Dot carries the cups while Sam carries the buns.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Dot carries the three empty nested cups while Sam carries the three small buns in both hands. They walk together toward the hut.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Dot carries the cups while Sam carries the buns.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "\"A job for me!\" said Dad.\nDad got the jug.\nSam and Dot sat on the rug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot sit on the rug. The buns are on the cream dish. Dad lifts the yellow jug beside the three cups to serve water.",
        "imageAlt": "Sam, Dot, and Dad sit on the red rug. Dad pours a drink beside three buns and three blue cups.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Sam and Dot sit on the rug. The buns are on the cream dish. Dad lifts the yellow jug beside the three cups to serve water.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Sam, Dot, and Dad sit on the red rug. Dad pours a drink beside three buns and three blue cups.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "\"A sip for each of us!\" said Dad.\nDot had a sip. \"That is all!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad tilts the yellow jug to serve Sam’s blue cup. Dot takes a sip from her blue cup, and Dad’s own filled blue cup waits beside him. Exactly three cups and three buns remain on the red rug.",
        "imageAlt": "Dad pours a drink into Sam's cup while Dot takes a sip. Three buns sit on the dish.",
        "state": {
          "location": "A garden snack station with a low supply table on the left and a play hut with a red picnic rug on the right.",
          "visible": "Dad tilts the yellow jug to serve Sam’s blue cup. Dot takes a sip from her blue cup, and Dad’s own filled blue cup waits beside him. Exactly three cups and three buns remain on the red rug.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Dad pours a drink into Sam's cup while Dot takes a sip. Three buns sit on the dish.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How did the snack job change after Dot sat down?",
        "listenFor": "Sam fetched the buns, Dot fetched the cups, and Dad served the water."
      },
      "visual": {
        "page": 6,
        "prompt": "What is each child carrying? How does that help?",
        "lookFor": "Dot carries the cups and Sam carries the buns, so one child does not carry every item."
      }
    },
    "levelRationale": "C: past-tense narration, several speakers and a sequence of unequal effort, explicit negotiation, divided jobs and reciprocal adult help.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "p",
        "sound": "p",
        "word": "help",
        "model": "Say help naturally. Locate p in its print and model its reviewed sound p; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "help",
          "cups",
          "each"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in help, cups, each; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "each",
          "meaning": "every one, considered separately"
        },
        {
          "word": "jug",
          "meaning": "a container with a handle for pouring"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: How did the snack job change after Dot sat down? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 6 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:0b77f2f0d514493e",
    "reviewedManuscriptSha256": "a1bbea4bccc5750e5d2d7437678769d89657ebc9c7a7d4d8f9ec61eb94e1c345",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-20",
    "number": 20,
    "title": "Cut and Fit",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 18,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends"
    ],
    "focus": "x represents /ks/ in mix; final /s/ in bits; matching a continuous red path",
    "practiceWords": [
      "mix",
      "bits",
      "fit"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "each",
        "cycle": 17,
        "reason": "Whole-word ea represents /i/. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "more",
        "cycle": 18,
        "reason": "Whole-word ore represents /ɔɹ/. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "of",
        "cycle": 4,
        "reason": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "they",
        "cycle": 16,
        "reason": "Whole-word ey represents /eɪ/. Explicit HFW first introduced in Cycle 16."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bit",
        "graphemes": [
          "b",
          "i",
          "t"
        ],
        "sounds": [
          "b",
          "ɪ",
          "t"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bits",
        "graphemes": [
          "b",
          "i",
          "t",
          "s"
        ],
        "sounds": [
          "b",
          "ɪ",
          "t",
          "s"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cut",
        "graphemes": [
          "c",
          "u",
          "t"
        ],
        "sounds": [
          "k",
          "ʌ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "each",
        "graphemes": [
          "ea",
          "ch"
        ],
        "sounds": [
          "i",
          "tʃ"
        ],
        "firstCycle": 17,
        "type": "exception",
        "note": "Whole-word ea represents /i/. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "fit",
        "graphemes": [
          "f",
          "i",
          "t"
        ],
        "sounds": [
          "f",
          "ɪ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "map",
        "graphemes": [
          "m",
          "a",
          "p"
        ],
        "sounds": [
          "m",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "mix",
        "graphemes": [
          "m",
          "i",
          "x"
        ],
        "sounds": [
          "m",
          "ɪ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "more",
        "graphemes": [
          "m",
          "ore"
        ],
        "sounds": [
          "m",
          "ɔɹ"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ore represents /ɔɹ/. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "of",
        "graphemes": [
          "o",
          "f"
        ],
        "sounds": [
          "ə",
          "v"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "path",
        "graphemes": [
          "p",
          "a",
          "th"
        ],
        "sounds": [
          "p",
          "æ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "i"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "they",
        "graphemes": [
          "th",
          "ey"
        ],
        "sounds": [
          "ð",
          "eɪ"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ey represents /eɪ/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam and Dad turn their map into a puzzle.",
      "failedAttempt": "Their first two chosen pieces do not match.",
      "turn": "Sam follows the red path across the edges to choose a matching piece.",
      "resolution": "They reconstruct the whole map and choose to mix it up again.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "A low craft table with Sam and Dad seated side by side.",
    "props": [
      "One illustrated paper map, landscape rectangle: tan hut at left, brown log at right, continuous red winding path between them. No printed labels.",
      "One child-safe rounded scissors. Dad supervises cutting.",
      "The map is cut into exactly four large irregular pieces; outlines and printed features stay identical thereafter."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dad hold two matching map pieces above the table; show the continuous red path across their join, with the other two pieces nearby.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad and I have a map.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dad examine the whole uncut map on the table: hut left, log right, red path between them. Rounded scissors lie beside Dad.",
        "imageAlt": "Sam and Dad look at a map on the table.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "Sam and Dad examine the whole uncut map on the table: hut left, log right, red path between them. Rounded scissors lie beside Dad.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam and Dad look at a map on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I cut the map.\nDad and I mix up the bits.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam has cut the map into four large irregular pieces under Dad’s supervision. The four pieces are mixed face up; the scissors have been set safely aside.",
        "imageAlt": "Four large pieces of the map lie mixed on the table.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "Sam has cut the map into four large irregular pieces under Dad’s supervision. The four pieces are mixed face up; the scissors have been set safely aside.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Four large pieces of the map lie mixed on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dad and I have a bit each.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dad each hold one of two nonadjacent map pieces. The other two pieces remain flat on the table. Keep exactly four pieces.",
        "imageAlt": "Sam and Dad each hold a map piece.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "Sam and Dad each hold one of two nonadjacent map pieces. The other two pieces remain flat on the table. Keep exactly four pieces.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Sam and Dad each hold a map piece.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "They do not fit.\nI look at the red path.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The two held pieces meet at incompatible edges and the red path does not align. Sam studies the red line ending at the edge of his piece.",
        "imageAlt": "Sam and Dad hold two map pieces with red paths that do not line up. Two more pieces lie on the table.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "The two held pieces meet at incompatible edges and the red path does not align. Sam studies the red line ending at the edge of his piece.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Sam and Dad hold two map pieces with red paths that do not line up. Two more pieces lie on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I get a red bit.\nDad and I fit it.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam selects the correct neighboring piece from the table. He and Dad place it against the first piece so the red path joins.",
        "imageAlt": "Sam and Dad join two map pieces along the red path.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "Sam selects the correct neighboring piece from the table. He and Dad place it against the first piece so the red path joins.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam and Dad join two map pieces along the red path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Dad and I fit more of the map.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dad connect the remaining two pieces to the joined pair. All four large pieces are now arranged into the complete rectangle.",
        "imageAlt": "Sam and Dad fit all four pieces into the map.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "Sam and Dad connect the remaining two pieces to the joined pair. All four large pieces are now arranged into the complete rectangle.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Sam and Dad fit all four pieces into the map.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dad and I see\nthe hut on the map.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The completed four-piece map lies on the table. Sam and Dad point to the hut at the left end of its now-continuous red path.",
        "imageAlt": "Sam and Dad point to the hut on the completed map.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "The completed four-piece map lies on the table. Sam and Dad point to the hut at the left end of its now-continuous red path.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Sam and Dad point to the hut on the completed map.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Dad says, \"More?\" I mix it up!",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad smiles as Sam mixes the same four pieces face up for another round. Scissors remain unused at the edge of the table.",
        "imageAlt": "Sam mixes the four map pieces again while Dad smiles.",
        "state": {
          "location": "A low craft table with Sam and Dad seated side by side.",
          "visible": "Dad smiles as Sam mixes the same four pieces face up for another round. Scissors remain unused at the edge of the table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Sam mixes the four map pieces again while Dad smiles.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What helped Sam choose the right puzzle piece?",
        "listenFor": "He looked at where the red path crossed the edge and matched its continuation."
      },
      "visual": {
        "page": 5,
        "prompt": "Show where the red path joins across the two pieces.",
        "lookFor": "The red line meets at the shared edge instead of ending at a mismatched place."
      }
    },
    "levelRationale": "B: simple present-tense actions and a visible matching strategy, with one short invitation to play again.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "x",
        "sound": "ks",
        "word": "mix",
        "model": "Say mix naturally. Locate x in its print and model its reviewed sound ks; keep the multiple consonant sounds in this taught chunk, rather than calling it one phoneme."
      },
      "decoding": {
        "words": [
          "mix",
          "bits",
          "fit"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in mix, bits, fit; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "bits",
          "meaning": "small parts of something"
        },
        {
          "word": "fit",
          "meaning": "join in the right place"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What helped Sam choose the right puzzle piece? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 5 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:1cfeb952d92d7f97",
    "reviewedManuscriptSha256": "424a8c1dca824b01de47c4344b9b4b354df72dc70e5187cf9a6298f64a9766ff",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-21",
    "number": 21,
    "title": "A Big Tug",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 18,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "tug and initial blend in grin; helping in a cooperative physical game",
    "practiceWords": [
      "tug",
      "rest",
      "grin"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "like",
        "cycle": 17,
        "reason": "Whole-word i has /aɪ/; the final ke chunk aligns /k/ and its silent e. This does not teach split digraphs generally. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "grin",
        "graphemes": [
          "g",
          "r",
          "i",
          "n"
        ],
        "sounds": [
          "g",
          "ɹ",
          "ɪ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "like",
        "graphemes": [
          "l",
          "i",
          "ke"
        ],
        "sounds": [
          "l",
          "aɪ",
          "k"
        ],
        "firstCycle": 17,
        "type": "exception",
        "note": "Whole-word i has /aɪ/; the final ke chunk aligns /k/ and its silent e. This does not teach split digraphs generally. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rest",
        "graphemes": [
          "r",
          "e",
          "s",
          "t"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "s",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "tug",
        "graphemes": [
          "t",
          "u",
          "g"
        ],
        "sounds": [
          "t",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "u"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Dad challenges Dot to get the cloth in a gentle tug game.",
      "failedAttempt": "Dot’s tug alone does not move it from Dad.",
      "turn": "Sam joins Dot at the same end.",
      "resolution": "The children get the cloth and all three rest together.",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-DOT",
      "person": "first",
      "tense": "present"
    },
    "setting": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
    "props": [
      "One broad long soft orange cloth, used as the tug rag.",
      "One green mat. No rope loops, knots or pulling around bodies."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad sits on the green mat holding one end of the orange cloth; Dot and Sam hold its other end with playful smiles.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad says, \"Get the rag, Dot!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad sits on the green mat and offers one end of the orange cloth to Dot. Dot holds the opposite end, ready to try. Sam watches nearby.",
        "imageAlt": "Dad holds a cloth for Dot to tug.",
        "state": {
          "location": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
          "visible": "Dad sits on the green mat and offers one end of the orange cloth to Dot. Dot holds the opposite end, ready to try. Sam watches nearby.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 6."
        },
        "pageDescription": "Dad holds a cloth for Dot to tug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I tug and tug.\nThe rag is with Dad.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot leans back gently holding the cloth with both hands. Dad remains balanced and seated, still holding his end.",
        "imageAlt": "Dot pulls on the cloth while Dad stays seated.",
        "state": {
          "location": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
          "visible": "Dot leans back gently holding the cloth with both hands. Dad remains balanced and seated, still holding his end.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 6."
        },
        "pageDescription": "Dot pulls on the cloth while Dad stays seated.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Sam says, \"I can tug with you.\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam steps beside Dot and gestures to the cloth. Dot turns toward him; Dad waits without pulling.",
        "imageAlt": "Sam offers to help Dot with the cloth.",
        "state": {
          "location": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
          "visible": "Sam steps beside Dot and gestures to the cloth. Dot turns toward him; Dad waits without pulling.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 6."
        },
        "pageDescription": "Sam offers to help Dot with the cloth.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Sam and I tug. Dad is up!",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot hold the same end and tug together. Dad rises carefully onto both feet; no one falls.",
        "imageAlt": "Sam and Dot pull the cloth while Dad begins to stand.",
        "state": {
          "location": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
          "visible": "Sam and Dot hold the same end and tug together. Dad rises carefully onto both feet; no one falls.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 6."
        },
        "pageDescription": "Sam and Dot pull the cloth while Dad begins to stand.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I have the rag.\nDad says, \"I like to sit!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad has released the cloth and sits comfortably back on the mat. Dot holds the cloth while Sam smiles beside her.",
        "imageAlt": "Dot holds the cloth while Dad sits back on the mat.",
        "state": {
          "location": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
          "visible": "Dad has released the cloth and sits comfortably back on the mat. Dot holds the cloth while Sam smiles beside her.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 6."
        },
        "pageDescription": "Dot holds the cloth while Dad sits back on the mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I rest with Dad. Sam and I grin.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot sits beside Dad on the mat with the slack cloth across her lap. Sam sits nearby; both children grin at Dad.",
        "imageAlt": "Dot rests beside Dad while she and Sam grin.",
        "state": {
          "location": "A level garden lawn with one thick green play mat. The game stays close to the mat.",
          "visible": "Dot sits beside Dad on the mat with the slack cloth across her lap. Sam sits nearby; both children grin at Dad.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 6."
        },
        "pageDescription": "Dot rests beside Dad while she and Sam grin.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What changed when Sam joined Dot?",
        "listenFor": "The two children tugged together and got the cloth from Dad."
      },
      "visual": {
        "page": 4,
        "prompt": "Where are Sam’s and Dot’s hands on the cloth?",
        "lookFor": "Both children hold the same end, helping with the same pull."
      }
    },
    "levelRationale": "B, revised from planned C: one concrete cooperative problem and one direct solution make six purposeful present-tense pages.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "g",
        "sound": "g",
        "word": "grin",
        "model": "Say grin naturally. Locate g in its print and model its reviewed sound g; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "tug",
          "rest",
          "grin"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in tug, rest, grin; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "tug",
          "meaning": "pull firmly"
        },
        {
          "word": "grin",
          "meaning": "a wide smile"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What changed when Sam joined Dot? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 4 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:87362958898f0852",
    "reviewedManuscriptSha256": "b7cf7944f25d4fb5c94b1bf143b4cdc70a137eedb67088467e35bb6c4b88ec47",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-22",
    "number": 22,
    "title": "A Moth in the Shed",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 19,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "th in moth; lift and the contrast between rushing and carrying gently",
    "practiceWords": [
      "moth",
      "lift",
      "out"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "of",
        "cycle": 4,
        "reason": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "out",
        "cycle": 19,
        "reason": "Whole-word ou represents /aʊ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bud",
        "graphemes": [
          "b",
          "u",
          "d"
        ],
        "sounds": [
          "b",
          "ʌ",
          "d"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "but",
        "graphemes": [
          "b",
          "u",
          "t"
        ],
        "sounds": [
          "b",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dash",
        "graphemes": [
          "d",
          "a",
          "sh"
        ],
        "sounds": [
          "d",
          "æ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "g",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "jug",
        "graphemes": [
          "j",
          "u",
          "g"
        ],
        "sounds": [
          "dʒ",
          "ʌ",
          "g"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lid",
        "graphemes": [
          "l",
          "i",
          "d"
        ],
        "sounds": [
          "l",
          "ɪ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lift",
        "graphemes": [
          "l",
          "i",
          "f",
          "t"
        ],
        "sounds": [
          "l",
          "ɪ",
          "f",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "log",
        "graphemes": [
          "l",
          "o",
          "g"
        ],
        "sounds": [
          "l",
          "ɑ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "i"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "moth",
        "graphemes": [
          "m",
          "o",
          "th"
        ],
        "sounds": [
          "m",
          "ɑ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "net",
        "graphemes": [
          "n",
          "e",
          "t"
        ],
        "sounds": [
          "n",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "of",
        "graphemes": [
          "o",
          "f"
        ],
        "sounds": [
          "ə",
          "v"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "out",
        "graphemes": [
          "ou",
          "t"
        ],
        "sounds": [
          "aʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "Whole-word ou represents /aʊ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "shed",
        "graphemes": [
          "sh",
          "e",
          "d"
        ],
        "sounds": [
          "ʃ",
          "ɛ",
          "d"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "tin",
        "graphemes": [
          "t",
          "i",
          "n"
        ],
        "sounds": [
          "t",
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants the moth to leave the shed.",
      "failedAttempt": "Covering its tin perch with the net fails when it moves away.",
      "turn": "He notices it on the portable jug and lifts the jug gently instead of dashing with the net.",
      "resolution": "Outside, the moth moves to a bud and Sam takes the jug back in.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
    "props": [
      "One natural small brown moth, two wings on each side and six tiny legs; no human face or clothes. Lock its design before art.",
      "One closed cream tin on the table.",
      "One small blue insect net with rounded rim.",
      "One empty yellow plastic jug with a large handle.",
      "One low log outside, shrub with one visible pale bud beyond it."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam carries the empty yellow jug carefully with the brown moth perched on its rim. Dad walks beside him through the open shed door.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "\"Go out, moth!\"\nA moth is in the shed.\nIt is on the lid of a tin.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The brown moth rests on the lid of the cream tin on the shed table. Sam points toward the open door; Dad stands nearby. The blue net and yellow jug are visible on the table.",
        "imageAlt": "A brown moth rests on a tin while Sam points toward the open door.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "The brown moth rests on the lid of the cream tin on the shed table. Sam points toward the open door; Dad stands nearby. The blue net and yellow jug are visible on the table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "A brown moth rests on a tin while Sam points toward the open door.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I set a net on the tin,\nbut the moth is not in the net.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam has lowered the net over the tin, but the moth has flown clear of it toward the jug. Show the moth separate from the net and tin, never trapped or crushed.",
        "imageAlt": "The moth flies clear of the net above the tin.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "Sam has lowered the net over the tin, but the moth has flown clear of it toward the jug. Show the moth separate from the net and tin, never trapped or crushed.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "The moth flies clear of the net above the tin.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The moth is on a jug.\nI sit with Dad.\nThe net is on the mat.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The moth now rests on the yellow jug’s rim. Sam sits beside Dad on the green mat. The unused net lies flat on the mat.",
        "imageAlt": "The moth rests on the jug while Sam sits with Dad.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "The moth now rests on the yellow jug’s rim. Sam sits beside Dad on the green mat. The unused net lies flat on the mat.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "The moth rests on the jug while Sam sits with Dad.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I lift the jug,\nbut I do not dash.\nDad is with me.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam lifts the empty yellow jug by its handle carefully. The moth remains on its rim. Dad stands alongside; the net stays on the mat.",
        "imageAlt": "Sam holds a yellow jug with both hands. A brown moth rests on its rim, and Dad stands nearby.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "Sam lifts the empty yellow jug by its handle carefully. The moth remains on its rim. Dad stands alongside; the net stays on the mat.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Sam holds a yellow jug with both hands. A brown moth rests on its rim, and Dad stands nearby.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dad and I go out of the shed.\nThe moth is on the jug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dad walk slowly through the shed doorway. Sam carries the same jug level with the moth still on the rim.",
        "imageAlt": "Sam carries the jug out of the shed with Dad. The brown moth rests on the rim.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "Sam and Dad walk slowly through the shed doorway. Sam carries the same jug level with the moth still on the rim.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam carries the jug out of the shed with Dad. The brown moth rests on the rim.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I set the jug on a log.\nDad and I sit.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam sets the jug on the outdoor log. Sam and Dad sit a short distance away, leaving the moth undisturbed on the jug.",
        "imageAlt": "Sam and Dad sit beside the jug on the log.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "Sam sets the jug on the outdoor log. Sam and Dad sit a short distance away, leaving the moth undisturbed on the jug.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Sam and Dad sit beside the jug on the log.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The moth is not on the jug.\nIt is on a bud.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The moth has moved onto the pale bud of the nearby shrub. The yellow jug remains on the log. Sam and Dad look toward the bud.",
        "imageAlt": "The moth rests on the flower bud beside the log.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "The moth has moved onto the pale bud of the nearby shrub. The yellow jug remains on the log. Sam and Dad look toward the bud.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "The moth rests on the flower bud beside the log.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I get the jug.\nDad and I go in.\nThe moth is out.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam carries the empty jug back through the open shed door with Dad. The moth remains outside on the bud; show both locations clearly.",
        "imageAlt": "Sam and Dad take the jug inside while the moth stays outside.",
        "state": {
          "location": "A small garden shed with an open door facing a nearby log and flowering shrub. The inside contains a low table and green mat.",
          "visible": "Sam carries the empty jug back through the open shed door with Dad. The moth remains outside on the bud; show both locations clearly.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Sam and Dad take the jug inside while the moth stays outside.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How did Sam get the moth outside after the net failed?",
        "listenFor": "He carried the jug the moth was resting on and then gave it space."
      },
      "visual": {
        "page": 4,
        "prompt": "What is Sam holding, and where is the moth?",
        "lookFor": "He holds the jug by its handle; the moth rests on the rim, separate from his hands."
      }
    },
    "levelRationale": "C: a failed plan leads to a new interpretation of an animal’s position, a gentle transport sequence and a return that resolves both animal and prop locations.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "th",
        "sound": "θ",
        "word": "moth",
        "model": "Say moth naturally. Locate th in its print and model its reviewed sound θ; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "moth",
          "lift",
          "out"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in moth, lift, out; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "moth",
          "meaning": "a small winged insect"
        },
        {
          "word": "lift",
          "meaning": "raise something carefully"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: How did Sam get the moth outside after the net failed? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 4 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:c527aa7f9b9d3f35",
    "reviewedManuscriptSha256": "cf97b3d3ce83821daca15510a8ebc2fca7cd71f19a00b5b66a3d8831aa807b6e",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-23",
    "number": 23,
    "title": "Spin, Top!",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 20,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "initial /sp/ in spin, /st/ plus final /ps/ in stops, and /fl/ in flat",
    "practiceWords": [
      "spin",
      "stops",
      "flat"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "clap",
        "graphemes": [
          "c",
          "l",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "l",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fast",
        "graphemes": [
          "f",
          "a",
          "s",
          "t"
        ],
        "sounds": [
          "f",
          "æ",
          "s",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "flat",
        "graphemes": [
          "f",
          "l",
          "a",
          "t"
        ],
        "sounds": [
          "f",
          "l",
          "æ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lid",
        "graphemes": [
          "l",
          "i",
          "d"
        ],
        "sounds": [
          "l",
          "ɪ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "spin",
        "graphemes": [
          "s",
          "p",
          "i",
          "n"
        ],
        "sounds": [
          "s",
          "p",
          "ɪ",
          "n"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "stops",
        "graphemes": [
          "s",
          "t",
          "o",
          "p",
          "s"
        ],
        "sounds": [
          "s",
          "t",
          "ɑ",
          "p",
          "s"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "top",
        "graphemes": [
          "t",
          "o",
          "p"
        ],
        "sounds": [
          "t",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Dot wants the top to keep spinning.",
      "failedAttempt": "Spinning harder on the rug still ends quickly.",
      "turn": "She notices the uneven rug and adds a smooth flat lid.",
      "resolution": "The top spins freely on the lid and she shares the result with Dad.",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-DOT",
      "person": "first",
      "tense": "present"
    },
    "setting": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
    "props": [
      "One small yellow spinning top with a red stripe and blunt wooden tip.",
      "One broad rigid blue plastic lid with a smooth flat upper surface.",
      "Rug tufts are clean flat graphic shapes, not painterly texture."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot and Dad watch the yellow top spin on the flat blue lid atop the green rug; use clear curved motion marks without lettering.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I have a top.\nI spin it on the rug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot spins the yellow top directly on the tufted green rug. Dad watches at the edge of the rug. The blue lid is nearby, unused.",
        "imageAlt": "Dot spins a yellow top on the rug while Dad watches.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "Dot spins the yellow top directly on the tufted green rug. Dad watches at the edge of the rug. The blue lid is nearby, unused.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 7."
        },
        "pageDescription": "Dot spins a yellow top on the rug while Dad watches.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "The top stops. I spin it fast.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The top has tipped onto its side in the rug tufts. Dot grips it again and prepares a stronger spin.",
        "imageAlt": "The top lies on its side as Dot reaches for it.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "The top has tipped onto its side in the rug tufts. Dot grips it again and prepares a stronger spin.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 7."
        },
        "pageDescription": "The top lies on its side as Dot reaches for it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The top stops. I look at the rug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The top is again on its side, caught among the tufts. Dot bends close to examine the uneven rug surface.",
        "imageAlt": "Dot looks closely at the rug beside the stopped top.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "The top is again on its side, caught among the tufts. Dot bends close to examine the uneven rug surface.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 7."
        },
        "pageDescription": "Dot looks closely at the rug beside the stopped top.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The rug is not flat.\nI get a flat lid.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot touches the rug tufts with one hand and holds the smooth flat blue lid with the other, comparing the two surfaces.",
        "imageAlt": "Dot compares the rug with a flat blue lid.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "Dot touches the rug tufts with one hand and holds the smooth flat blue lid with the other, comparing the two surfaces.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 7."
        },
        "pageDescription": "Dot compares the rug with a flat blue lid.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I set the lid on the rug.\nI spin the top.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The blue lid lies flat and stable on the rug. Dot releases the yellow top in a fresh spin on its smooth surface.",
        "imageAlt": "Dot spins the top on the lid.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "The blue lid lies flat and stable on the rug. Dot releases the yellow top in a fresh spin on its smooth surface.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 7."
        },
        "pageDescription": "Dot spins the top on the lid.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The top is fast. Dad and I clap.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The top spins upright on the lid with a clear motion arc. Dot and Dad clap while keeping hands away from it.",
        "imageAlt": "Dot and Dad clap beside the spinning top.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "The top spins upright on the lid with a clear motion arc. Dot and Dad clap while keeping hands away from it.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 7."
        },
        "pageDescription": "Dot and Dad clap beside the spinning top.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dad says, \"A top on a lid!\"\nI spin it for Dad.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot gives the same top another spin on the lid for Dad, who leans in with a pleased expression. Keep the lid flat and the rug visible beneath it.",
        "imageAlt": "Dot spins a yellow top on a blue lid while Dad watches.",
        "state": {
          "location": "Family playroom with a thick green tufted rug on a level floor. Dad sits at its edge.",
          "visible": "Dot gives the same top another spin on the lid for Dad, who leans in with a pleased expression. Keep the lid flat and the rug visible beneath it.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 7."
        },
        "pageDescription": "Dot spins a yellow top on a blue lid while Dad watches.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Dot change the surface under the top?",
        "listenFor": "The rug caught the top, while the flat lid let it spin."
      },
      "visual": {
        "page": 4,
        "prompt": "What difference can you see between the two surfaces Dot is comparing?",
        "lookFor": "The rug has raised tufts; the lid is smooth and flat."
      }
    },
    "levelRationale": "B: two attempts establish the problem; an explicit surface contrast leads to one visible change and repeatable outcome.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "s",
        "sound": "s",
        "word": "spin",
        "model": "Say spin naturally. Locate s in its print and model its reviewed sound s; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "spin",
          "stops",
          "flat"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in spin, stops, flat; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "spin",
          "meaning": "turn around quickly in one place"
        },
        {
          "word": "flat",
          "meaning": "level and without bumps"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: Why did Dot change the surface under the top? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 4 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:6fe40a92a7b66188",
    "reviewedManuscriptSha256": "9cde0fabdc29af20ff9a9f9e9ce196230cc6346b7b3c8df5f14dad006bbe403d",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-24",
    "number": 24,
    "title": "The Cat Mask",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 20,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "final /sk/ in mask, initial /fl/ in flip and /st/ in stop",
    "practiceWords": [
      "mask",
      "flip",
      "stop"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "box",
        "graphemes": [
          "b",
          "o",
          "x"
        ],
        "sounds": [
          "b",
          "ɑ",
          "ks"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bump",
        "graphemes": [
          "b",
          "u",
          "m",
          "p"
        ],
        "sounds": [
          "b",
          "ʌ",
          "m",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "chin",
        "graphemes": [
          "ch",
          "i",
          "n"
        ],
        "sounds": [
          "tʃ",
          "ɪ",
          "n"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "flip",
        "graphemes": [
          "f",
          "l",
          "i",
          "p"
        ],
        "sounds": [
          "f",
          "l",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "hop",
        "graphemes": [
          "h",
          "o",
          "p"
        ],
        "sounds": [
          "h",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "mask",
        "graphemes": [
          "m",
          "a",
          "s",
          "k"
        ],
        "sounds": [
          "m",
          "æ",
          "s",
          "k"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "i"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "stop",
        "graphemes": [
          "s",
          "t",
          "o",
          "p"
        ],
        "sounds": [
          "s",
          "t",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "top",
        "graphemes": [
          "t",
          "o",
          "p"
        ],
        "sounds": [
          "t",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "u"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to play in his cat mask.",
      "failedAttempt": "Wearing it upside down blocks his view and he bumps an empty box.",
      "turn": "Dot notices the chin is on top.",
      "resolution": "Sam flips the mask, sees clearly and joins Dot hopping.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
    "props": [
      "One orange cat costume mask with two pointed ears, two eye openings and a pointed chin.",
      "A soft plain elastic strap. Mask is upside down until page5.",
      "One low empty cardboard box; no sharp or hard obstacle."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam holds the orange cat mask correctly in front of his chest as Dot points playfully to its two ears. Do not use the real cat character.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I have a cat mask.\nI put it on.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam puts the orange mask on upside down: chin above his forehead, ears below his cheeks, eye openings misaligned. Dot watches nearby.",
        "imageAlt": "Sam puts on a cat mask upside down.",
        "state": {
          "location": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
          "visible": "Sam puts the orange mask on upside down: chin above his forehead, ears below his cheeks, eye openings misaligned. Dot watches nearby.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 6."
        },
        "pageDescription": "Sam puts on a cat mask upside down.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I hop to Dot. I bump a box.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam makes a small hop and gently bumps the light empty cardboard box with his leg. He stays upright and unhurt. The upside-down mask still blocks his view.",
        "imageAlt": "Sam bumps a cardboard box while wearing the mask.",
        "state": {
          "location": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
          "visible": "Sam makes a small hop and gently bumps the light empty cardboard box with his leg. He stays upright and unhurt. The upside-down mask still blocks his view.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 6."
        },
        "pageDescription": "Sam bumps a cardboard box while wearing the mask.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "\"I do not see you, Dot!\" I stop.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam stands still with palms open, facing generally toward Dot. The mask remains upside down; no continuing movement or fall.",
        "imageAlt": "Sam stops beside Dot with the mask still upside down.",
        "state": {
          "location": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
          "visible": "Sam stands still with palms open, facing generally toward Dot. The mask remains upside down; no continuing movement or fall.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 6."
        },
        "pageDescription": "Sam stops beside Dot with the mask still upside down.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Dot says, \"The chin is on top!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot points at the mask’s pointed chin above Sam’s forehead. Sam holds still, listening. Its two ears are visibly below his cheeks.",
        "imageAlt": "Dot points to the mask’s chin above Sam’s forehead.",
        "state": {
          "location": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
          "visible": "Dot points at the mask’s pointed chin above Sam’s forehead. Sam holds still, listening. Its two ears are visibly below his cheeks.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 6."
        },
        "pageDescription": "Dot points to the mask’s chin above Sam’s forehead.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I flip the mask. I put it on.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam has flipped the mask and now holds it correctly against his face. Eye openings align with his eyes; ears are at the top and chin at the bottom.",
        "imageAlt": "Sam wears an orange cat mask with its ears at the top. Dot smiles beside him.",
        "state": {
          "location": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
          "visible": "Sam has flipped the mask and now holds it correctly against his face. Eye openings align with his eyes; ears are at the top and chin at the bottom.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 6."
        },
        "pageDescription": "Sam wears an orange cat mask with its ears at the top. Dot smiles beside him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I see Dot! Dot and I hop.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot hop together across the clear mat. Sam wears the mask correctly and can see through both eye openings. The empty box is safely to the side.",
        "imageAlt": "Sam and Dot hop together. Sam wears the orange cat mask, and the empty box sits to the side.",
        "state": {
          "location": "A clear indoor play space with a low empty cardboard box and a green floor mat.",
          "visible": "Sam and Dot hop together across the clear mat. Sam wears the mask correctly and can see through both eye openings. The empty box is safely to the side.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 6."
        },
        "pageDescription": "Sam and Dot hop together. Sam wears the orange cat mask, and the empty box sits to the side.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Dot notice that helped Sam?",
        "listenFor": "The mask’s chin was on top; Sam needed to turn the mask the right way up."
      },
      "visual": {
        "page": 4,
        "prompt": "Show the mask’s chin. Where does your own chin go?",
        "lookFor": "The pointed chin is above Sam’s forehead; it should be below his face."
      }
    },
    "levelRationale": "B, revised from planned C: a single visible orientation mistake, a specific clue and one corrective action make a complete short arc.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "s",
        "sound": "s",
        "word": "mask",
        "model": "Say mask naturally. Locate s in its print and model its reviewed sound s; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "mask",
          "flip",
          "stop"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in mask, flip, stop; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "mask",
          "meaning": "a cover worn over part of the face"
        },
        {
          "word": "flip",
          "meaning": "turn something over or around"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What did Dot notice that helped Sam? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 4 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:9924c2c23f1a026f",
    "reviewedManuscriptSha256": "496efad5681e962f92827053560703cfbd25bca7b72f35fd4a0985a9da0c4358",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-25",
    "number": 25,
    "title": "What Am I?",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 21,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "wh in what; flap as a newly permitted initial blend; contrasting actions as clues",
    "practiceWords": [
      "what",
      "flap",
      "chin"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "his",
        "cycle": 13,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 13."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "cycle": 11,
        "reason": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "what",
        "cycle": 21,
        "reason": "Whole-word a represents /ʌ/. Explicit HFW first introduced in Cycle 21."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "ball",
        "graphemes": [
          "b",
          "all"
        ],
        "sounds": [
          "b",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bat",
        "graphemes": [
          "b",
          "a",
          "t"
        ],
        "sounds": [
          "b",
          "æ",
          "t"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cat",
        "graphemes": [
          "c",
          "a",
          "t"
        ],
        "sounds": [
          "k",
          "æ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "chin",
        "graphemes": [
          "ch",
          "i",
          "n"
        ],
        "sounds": [
          "tʃ",
          "ɪ",
          "n"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "felt",
        "graphemes": [
          "f",
          "e",
          "l",
          "t"
        ],
        "sounds": [
          "f",
          "ɛ",
          "l",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "flap",
        "graphemes": [
          "f",
          "l",
          "a",
          "p"
        ],
        "sounds": [
          "f",
          "l",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "hen",
        "graphemes": [
          "h",
          "e",
          "n"
        ],
        "sounds": [
          "h",
          "ɛ",
          "n"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "his",
        "graphemes": [
          "h",
          "i",
          "s"
        ],
        "sounds": [
          "h",
          "ɪ",
          "z"
        ],
        "firstCycle": 13,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 13."
      },
      {
        "word": "hop",
        "graphemes": [
          "h",
          "o",
          "p"
        ],
        "sounds": [
          "h",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "mat",
        "graphemes": [
          "m",
          "a",
          "t"
        ],
        "sounds": [
          "m",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "nod",
        "graphemes": [
          "n",
          "o",
          "d"
        ],
        "sounds": [
          "n",
          "ɑ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "pat",
        "graphemes": [
          "p",
          "a",
          "t"
        ],
        "sounds": [
          "p",
          "æ",
          "t"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "quiz",
        "graphemes": [
          "qu",
          "i",
          "z"
        ],
        "sounds": [
          "kw",
          "ɪ",
          "z"
        ],
        "firstCycle": 13,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rag",
        "graphemes": [
          "r",
          "a",
          "g"
        ],
        "sounds": [
          "ɹ",
          "æ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "see",
        "graphemes": [
          "s",
          "ee"
        ],
        "sounds": [
          "s",
          "i"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Whole-word ee represents /i/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "ship",
        "graphemes": [
          "sh",
          "i",
          "p"
        ],
        "sounds": [
          "ʃ",
          "ɪ",
          "p"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "what",
        "graphemes": [
          "wh",
          "a",
          "t"
        ],
        "sounds": [
          "w",
          "ʌ",
          "t"
        ],
        "firstCycle": 21,
        "type": "exception",
        "note": "Whole-word a represents /ʌ/. Explicit HFW first introduced in Cycle 21."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Dot wants Dad to identify what she is acting.",
      "failedAttempt": "Flapping only the rag suggests a ship rather than a hen.",
      "turn": "Adding hopping clarifies the hen; each player then chooses useful physical clues.",
      "resolution": "Dot identifies Sam’s imitation of resting Dad from the cup, beard patch and pose, prompting Dad’s playful objection.",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-DAD",
        "SMALL-SAM"
      ]
    },
    "narrator": {
      "characterId": "SMALL-DOT",
      "person": "first",
      "tense": "present"
    },
    "setting": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
    "props": [
      "One cream cloth rag used for flapping.",
      "One red ball.",
      "One empty blue adult cup.",
      "One small brown felt beard-shaped patch; it waits on the craft table until Sam’s imitation."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot holds her arms like wings while Dad crouches playfully like a cat and Sam watches; keep all three complete and no printed question marks.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad and I have a quiz.\n\"What am I?\"\nI flap a rag at Dad.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot flaps the cream rag in front of seated Dad. Dad’s blue cup rests by his chair; the red ball and brown felt patch are on the low craft table. Sam watches.",
        "imageAlt": "Dot flaps a cloth while Dad and Sam watch.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Dot flaps the cream rag in front of seated Dad. Dad’s blue cup rests by his chair; the red ball and brown felt patch are on the low craft table. Sam watches.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Dot flaps a cloth while Dad and Sam watch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Dad says, \"A ship?\"\nI put the rag on the mat.\nI do not nod.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad gestures as if imagining a sail while Dot sets the rag on the mat and shakes her head. The rag stays there for the rest of the quiz.",
        "imageAlt": "Dot puts down the cloth as Dad gestures toward it.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Dad gestures as if imagining a sail while Dot sets the rag on the mat and shakes her head. The rag stays there for the rest of the quiz.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Dot puts down the cloth as Dad gestures toward it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I hop and flap. Dad says, \"A hen?\"\nI nod. Dad can see it!",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot hops with bent elbows moving like a hen’s wings. Dad smiles in recognition. Sam watches the clearer animal action.",
        "imageAlt": "Dot hops with her elbows held like wings.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Dot hops with bent elbows moving like a hen’s wings. Dad smiles in recognition. Sam watches the clearer animal action.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Dot hops with her elbows held like wings.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Dad says, \"What am I?\"\nDad is on the rug with a ball.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad crouches naturally on all fours beside the red ball on the rug, pretending to be a cat. Dot observes; the blue cup is set aside safely.",
        "imageAlt": "Dad crouches beside a red ball on the rug.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Dad crouches naturally on all fours beside the red ball on the rug, pretending to be a cat. Dot observes; the blue cup is set aside safely.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Dad crouches beside a red ball on the rug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dad and I bat the ball. \"A cat!\"\nI pat Dad on the chin.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot and Dad bat the red ball gently with open hands. Dot pats Dad’s beard lightly as both smile; this is pretend play, not a real animal.",
        "imageAlt": "Dot and Dad bat the ball while pretending to be cats.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Dot and Dad bat the red ball gently with open hands. Dot pats Dad’s beard lightly as both smile; this is pretend play, not a real animal.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Dot and Dad bat the ball while pretending to be cats.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Sam says, \"What am I?\"\nSam is on the mat.\nSam is not a cat.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam reclines on the mat in Dad’s earlier resting pose, holding the empty blue cup and a brown felt patch at his chin. Dot and Dad look toward him.",
        "imageAlt": "Sam rests on the mat with a cup and felt against his chin.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Sam reclines on the mat in Dad’s earlier resting pose, holding the empty blue cup and a brown felt patch at his chin. Dot and Dad look toward him.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Sam rests on the mat with a cup and felt against his chin.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "I look at Sam.\nSam is on the mat with a cup\nand felt on his chin.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. A closer view shows Sam resting with the blue cup and brown felt beard patch against his chin. Dot studies these specific clues.",
        "imageAlt": "Sam leans back with a blue cup and a pretend beard. Dot leans closer while Dad watches.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "A closer view shows Sam resting with the blue cup and brown felt beard patch against his chin. Dot studies these specific clues.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Sam leans back with a blue cup and a pretend beard. Dot leans closer while Dad watches.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "\"Dad!\" Dad says, \"I am up!\"\nSam is not up.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot points playfully toward upright Dad, who gestures to show he is standing. Sam remains reclining with the cup and beard patch, smiling.",
        "imageAlt": "Dad stands beside the chair while Sam lies on the mat with a cup and a pretend beard. Dot smiles at Sam.",
        "state": {
          "location": "A family-room rug beside a low craft table. Dad’s chair and blue cup establish his resting pose before the imitation.",
          "visible": "Dot points playfully toward upright Dad, who gestures to show he is standing. Sam remains reclining with the cup and beard patch, smiling.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Dad stands beside the chair while Sam lies on the mat with a cup and a pretend beard. Dot smiles at Sam.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Dot think Sam was pretending to be Dad?",
        "listenFor": "He used Dad’s resting pose, blue cup and a felt beard."
      },
      "visual": {
        "page": 7,
        "prompt": "Which two objects help you work out who Sam is pretending to be?",
        "lookFor": "Dad’s blue cup and the brown felt patch used as a beard."
      }
    },
    "levelRationale": "C: three connected rounds require readers to compare misleading and useful clues, follow changing speakers and interpret a prepared imitation joke.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "wh",
        "sound": "w",
        "word": "what",
        "model": "Say what naturally. Locate wh in its print and model its reviewed sound w; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "what",
          "flap",
          "chin"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in what, flap, chin; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "flap",
          "meaning": "move up and down like wings"
        },
        {
          "word": "quiz",
          "meaning": "a question game"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: Why did Dot think Sam was pretending to be Dad? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 7 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:63cebd65a32482b9",
    "reviewedManuscriptSha256": "fd8227257447e5e15fe806fdb598d0ec29d67405e2d7e875a2798a7a8e3affd5",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-26",
    "number": 26,
    "title": "Honk, Honk!",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 22,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "nk as /ŋk/ in honk; exact taught does and goes; choosing a useful action",
    "practiceWords": [
      "honk",
      "help",
      "goes"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "do",
        "cycle": 6,
        "reason": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "does",
        "cycle": 22,
        "reason": "Whole-word oe represents /ʌ/ and s represents /z/. Explicit HFW first introduced in Cycle 22."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "goes",
        "cycle": 22,
        "reason": "Whole-word oe represents /oʊ/ and s represents /z/. Explicit HFW first introduced in Cycle 22."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "am",
        "graphemes": [
          "a",
          "m"
        ],
        "sounds": [
          "æ",
          "m"
        ],
        "firstCycle": 1,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bus",
        "graphemes": [
          "b",
          "u",
          "s"
        ],
        "sounds": [
          "b",
          "ʌ",
          "s"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "do",
        "graphemes": [
          "d",
          "o"
        ],
        "sounds": [
          "d",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "does",
        "graphemes": [
          "d",
          "oe",
          "s"
        ],
        "sounds": [
          "d",
          "ʌ",
          "z"
        ],
        "firstCycle": 22,
        "type": "exception",
        "note": "Whole-word oe represents /ʌ/ and s represents /z/. Explicit HFW first introduced in Cycle 22."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fit",
        "graphemes": [
          "f",
          "i",
          "t"
        ],
        "sounds": [
          "f",
          "ɪ",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "gap",
        "graphemes": [
          "g",
          "a",
          "p"
        ],
        "sounds": [
          "g",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "g",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "goes",
        "graphemes": [
          "g",
          "oe",
          "s"
        ],
        "sounds": [
          "g",
          "oʊ",
          "z"
        ],
        "firstCycle": 22,
        "type": "exception",
        "note": "Whole-word oe represents /oʊ/ and s represents /z/. Explicit HFW first introduced in Cycle 22."
      },
      {
        "word": "help",
        "graphemes": [
          "h",
          "e",
          "l",
          "p"
        ],
        "sounds": [
          "h",
          "ɛ",
          "l",
          "p"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "honk",
        "graphemes": [
          "h",
          "o",
          "nk"
        ],
        "sounds": [
          "h",
          "ɑ",
          "ŋk"
        ],
        "firstCycle": 22,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "hut",
        "graphemes": [
          "h",
          "u",
          "t"
        ],
        "sounds": [
          "h",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "van",
        "graphemes": [
          "v",
          "a",
          "n"
        ],
        "sounds": [
          "v",
          "æ",
          "n"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam and Dot want to pass through the same narrow gateway in opposite directions.",
      "failedAttempt": "Their vehicles do not fit together and honking changes nothing.",
      "turn": "Sam moves into the hut-side space and lets Dot pass.",
      "resolution": "Each goes through separately and they exchange a friendly honk.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
    "props": [
      "Sam’s yellow open-top foot-powered toy van, low enough for both feet to reach the ground.",
      "Dot’s red open-top foot-powered toy bus of similar width.",
      "One fixed gateway wide enough for either vehicle alone, not both beside one another.",
      "These are small garden ride-ons, never road vehicles or motorized cars."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam in the yellow garden ride-on van waves to Dot in the red ride-on bus near the narrow gate; show feet reaching the ground and all wheels.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I am in a van.\nDot is in a bus.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam sits in his yellow ride-on van inside the garden. Dot sits in her red ride-on bus on the other side of the open gate. Both can reach the ground with their feet.",
        "imageAlt": "Sam sits in a toy van while Dot sits in a toy bus across the gate.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "Sam sits in his yellow ride-on van inside the garden. Dot sits in her red ride-on bus on the other side of the open gate. Both can reach the ground with their feet.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam sits in a toy van while Dot sits in a toy bus across the gate.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Dot and I go to the gap.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The two ride-ons approach opposite sides of the same gateway slowly. The hut and inside parking space are visible on Sam’s left.",
        "imageAlt": "The children approach the gate from opposite sides.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "The two ride-ons approach opposite sides of the same gateway slowly. The hut and inside parking space are visible on Sam’s left.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "The children approach the gate from opposite sides.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The van and the bus do not fit.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The vehicles face each other at the gateway with a safe gap between their bumpers. The opening plainly allows only one vehicle at a time.",
        "imageAlt": "The two toy vehicles face each other at the narrow gap.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "The vehicles face each other at the gateway with a safe gap between their bumpers. The opening plainly allows only one vehicle at a time.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "The two toy vehicles face each other at the narrow gap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Dot and I honk. It does not help.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot press their toy horns while staying stopped at the same narrow gap. Their positions do not change and neither vehicle passes.",
        "imageAlt": "Sam and Dot press their horns while the vehicles stay still.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "Sam and Dot press their toy horns while staying stopped at the same narrow gap. Their positions do not change and neither vehicle passes.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Sam and Dot press their horns while the vehicles stay still.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "\"Go on, Dot.\" I go to the hut.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam moves the van aside toward the hut parking space and gestures for Dot to go. Dot waits at the gateway.",
        "imageAlt": "Sam moves his van beside the hut and waves Dot through.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "Sam moves the van aside toward the hut parking space and gestures for Dot to go. Dot waits at the gateway.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam moves his van beside the hut and waves Dot through.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Dot goes in the gap.\nThe bus can fit.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot drives her bus through the gateway into the garden. Sam waits beside the hut with his van fully clear of her path.",
        "imageAlt": "Dot goes through the gate while Sam waits beside the hut.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "Dot drives her bus through the gateway into the garden. Sam waits beside the hut with his van fully clear of her path.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Dot goes through the gate while Sam waits beside the hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "I go in the gap.\nMy van can fit.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam now moves his van from the inside parking space through the open gateway to the outside. Dot and the bus are safely inside the garden.",
        "imageAlt": "Sam rides his yellow van through the open gate. Dot waves from her red bus beside the hut.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "Sam now moves his van from the inside parking space through the open gateway to the outside. Dot and the bus are safely inside the garden.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Sam rides his yellow van through the open gate. Dot waves from her red bus beside the hut.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Dot and I go.\nI honk, and Dot does.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. The children are on opposite sides after passing: Dot inside near the hut, Sam just outside. They smile, press their toy horns and wave to one another.",
        "imageAlt": "Sam and Dot press the horns on their toy vehicles on opposite sides of the open gate.",
        "state": {
          "location": "An enclosed garden with a tan play hut and one narrow open gateway. A clear parking space beside the hut adjoins the inside approach to the gateway.",
          "visible": "The children are on opposite sides after passing: Dot inside near the hut, Sam just outside. They smile, press their toy horns and wave to one another.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Sam and Dot press the horns on their toy vehicles on opposite sides of the open gate.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What helped both vehicles get through?",
        "listenFor": "Sam moved aside, so they could go through one at a time. Honking did not make the gap bigger."
      },
      "visual": {
        "page": 5,
        "prompt": "Where did Sam move his van? What space is clear now?",
        "lookFor": "Beside the hut; the gateway is clear for Dot’s bus."
      }
    },
    "levelRationale": "B: one familiar spatial problem, one unhelpful attempt and one practical turn-taking solution in present tense.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "nk",
        "sound": "ŋk",
        "word": "honk",
        "model": "Say honk naturally. Locate nk in its print and model its reviewed sound ŋk; keep the multiple consonant sounds in this taught chunk, rather than calling it one phoneme."
      },
      "decoding": {
        "words": [
          "honk",
          "help",
          "goes"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in honk, help, goes; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "honk",
          "meaning": "make the sound of a horn"
        },
        {
          "word": "gap",
          "meaning": "an open space between things"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What helped both vehicles get through? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 5 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:87b7732caf40543e",
    "reviewedManuscriptSha256": "a07b28050f13b24d20a08cb08c1cf3758364bb45839a0a91a8364e2a5296479f",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-27",
    "number": 27,
    "title": "The Prank",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 22,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "pr plus taught nk in prank; clipping changes a joke prop into something wearable",
    "practiceWords": [
      "prank",
      "felt",
      "clip"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "from",
        "cycle": 18,
        "reason": "Whole-word o represents /ʌ/ in this pronunciation. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "like",
        "cycle": 17,
        "reason": "Whole-word i has /aɪ/; the final ke chunk aligns /k/ and its silent e. This does not teach split digraphs generally. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "me",
        "cycle": 9,
        "reason": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "cycle": 6,
        "reason": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "big",
        "graphemes": [
          "b",
          "i",
          "g"
        ],
        "sounds": [
          "b",
          "ɪ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bug",
        "graphemes": [
          "b",
          "u",
          "g"
        ],
        "sounds": [
          "b",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bun",
        "graphemes": [
          "b",
          "u",
          "n"
        ],
        "sounds": [
          "b",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cap",
        "graphemes": [
          "c",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "clip",
        "graphemes": [
          "c",
          "l",
          "i",
          "p"
        ],
        "sounds": [
          "k",
          "l",
          "ɪ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cut",
        "graphemes": [
          "c",
          "u",
          "t"
        ],
        "sounds": [
          "k",
          "ʌ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fall",
        "graphemes": [
          "f",
          "all"
        ],
        "sounds": [
          "f",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "felt",
        "graphemes": [
          "f",
          "e",
          "l",
          "t"
        ],
        "sounds": [
          "f",
          "ɛ",
          "l",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "from",
        "graphemes": [
          "f",
          "r",
          "o",
          "m"
        ],
        "sounds": [
          "f",
          "ɹ",
          "ʌ",
          "m"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word o represents /ʌ/ in this pronunciation. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "g",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "grin",
        "graphemes": [
          "g",
          "r",
          "i",
          "n"
        ],
        "sounds": [
          "g",
          "ɹ",
          "ɪ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lap",
        "graphemes": [
          "l",
          "a",
          "p"
        ],
        "sounds": [
          "l",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "let",
        "graphemes": [
          "l",
          "e",
          "t"
        ],
        "sounds": [
          "l",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "like",
        "graphemes": [
          "l",
          "i",
          "ke"
        ],
        "sounds": [
          "l",
          "aɪ",
          "k"
        ],
        "firstCycle": 17,
        "type": "exception",
        "note": "Whole-word i has /aɪ/; the final ke chunk aligns /k/ and its silent e. This does not teach split digraphs generally. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "me",
        "graphemes": [
          "m",
          "e"
        ],
        "sounds": [
          "m",
          "i"
        ],
        "firstCycle": 9,
        "type": "exception",
        "note": "Final e represents /i/. Explicit HFW first introduced in Cycle 9."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "plan",
        "graphemes": [
          "p",
          "l",
          "a",
          "n"
        ],
        "sounds": [
          "p",
          "l",
          "æ",
          "n"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "prank",
        "graphemes": [
          "p",
          "r",
          "a",
          "nk"
        ],
        "sounds": [
          "p",
          "ɹ",
          "æ",
          "ŋk"
        ],
        "firstCycle": 22,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "sit",
        "graphemes": [
          "s",
          "i",
          "t"
        ],
        "sounds": [
          "s",
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "that",
        "graphemes": [
          "th",
          "a",
          "t"
        ],
        "sounds": [
          "ð",
          "æ",
          "t"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "to",
        "graphemes": [
          "t",
          "o"
        ],
        "sounds": [
          "t",
          "u"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final o represents /u/ in the careful reading model. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "with",
        "graphemes": [
          "w",
          "i",
          "th"
        ],
        "sounds": [
          "w",
          "ɪ",
          "θ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to surprise Dad with a harmless felt-bug prank.",
      "failedAttempt": "Dad immediately recognizes and likes the craft instead of being fooled.",
      "turn": "Dad puts the same bug in Sam’s cap while Sam is away, briefly surprising Sam.",
      "resolution": "Sam recognizes the joke and turns the bug into a cheerful cap decoration.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "A low craft table in the family room, with a snack plate on a nearby shelf.",
    "props": [
      "One large red felt bug cut by Sam, with six felt legs and two antennae. It is clearly a craft, not a living animal.",
      "One small cream cup.",
      "One blue child cap.",
      "One small rounded clip for fastening the felt bug to the cap.",
      "One plain bun on a plate and child-safe scissors at the craft table."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam grins in the blue cap with the red felt bug clipped to it; Dad smiles behind him beside the craft table.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I have a plan for a prank.\nI cut a big bug from red felt.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam cuts the outline of one big red felt bug at the table using rounded craft scissors. The cap, clip and cream cup wait nearby. Dad sits beside him.",
        "imageAlt": "Sam cuts a red felt bug at the craft table.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam cuts the outline of one big red felt bug at the table using rounded craft scissors. The cap, clip and cream cup wait nearby. Dad sits beside him.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam cuts a red felt bug at the craft table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I put the bug in a cup for Dad.\nI sit with my cap in my lap.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam has hidden the red felt bug in the cream cup and holds his blue cap in his lap. Dad reaches toward the offered cup.",
        "imageAlt": "Sam offers Dad a cup with the felt bug inside.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam has hidden the red felt bug in the cream cup and holds his blue cap in his lap. Dad reaches toward the offered cup.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Sam offers Dad a cup with the felt bug inside.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dad says, \"A felt bug for me?\nI like it!\"\nThat is not my plan.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad holds up the obvious red felt bug appreciatively. Sam looks surprised that Dad recognized it at once; no fright or distress.",
        "imageAlt": "Dad holds up the felt bug while Sam looks surprised.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Dad holds up the obvious red felt bug appreciatively. Sam looks surprised that Dad recognized it at once; no fright or distress.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Dad holds up the felt bug while Sam looks surprised.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "I go to get a bun.\nDad is with my cap and my bug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam walks toward the nearby bun plate. Dad sits at the table with the cap and felt bug, beginning his playful return joke.",
        "imageAlt": "Sam goes for a bun while Dad sits with the cap and felt bug.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam walks toward the nearby bun plate. Dad sits at the table with the cap and felt bug, beginning his playful return joke.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Sam goes for a bun while Dad sits with the cap and felt bug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "I get my cap. \"A bug!\"\nI let the cap fall.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam lifts his blue cap and notices the red felt bug inside. He lets the light cap drop a short distance onto the soft mat, startled but safe.",
        "imageAlt": "Sam drops his light cap when he spots the felt bug inside.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam lifts his blue cap and notices the red felt bug inside. He lets the light cap drop a short distance onto the soft mat, startled but safe.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam drops his light cap when he spots the felt bug inside.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I look at the bug.\nIt is my felt bug!\nI grin at Dad.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam retrieves the felt bug and grins at Dad as he recognizes his own craft. The cap lies intact beside him.",
        "imageAlt": "Sam holds up the red felt bug and grins at Dad. His blue cap rests on the mat.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam retrieves the felt bug and grins at Dad as he recognizes his own craft. The cap lies intact beside him.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Sam holds up the red felt bug and grins at Dad. His blue cap rests on the mat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "I clip the bug to my cap.\nIt is a big red bug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam uses the rounded clip to fasten the same red felt bug to the front of the blue cap. Dad watches, smiling.",
        "imageAlt": "Sam clips the red felt bug to the front of his blue cap. Dad watches.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam uses the rounded clip to fasten the same red felt bug to the front of the blue cap. Dad watches, smiling.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Sam clips the red felt bug to the front of his blue cap. Dad watches.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I put on my cap.\nDad says, \"A cap for a bug!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam wears the decorated cap. Dad points cheerfully to the bug as both enjoy the result. The bug remains visibly flat felt with six legs.",
        "imageAlt": "Sam wears the cap with the red felt bug on it.",
        "state": {
          "location": "A low craft table in the family room, with a snack plate on a nearby shelf.",
          "visible": "Sam wears the decorated cap. Dad points cheerfully to the bug as both enjoy the result. The bug remains visibly flat felt with six legs.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Sam wears the cap with the red felt bug on it.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Sam grin when he looked again at the bug?",
        "listenFor": "He recognized the felt bug he had made and realized Dad had returned the same joke."
      },
      "visual": {
        "page": 6,
        "prompt": "What shows that this is Sam’s craft bug?",
        "lookFor": "It is the same flat red felt shape with the same legs and antennae, not a living bug."
      }
    },
    "levelRationale": "C: the reader follows a failed plan, a reversed surprise and a reinterpretation of the same prop; the ending turns the shared joke into a new use.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "nk",
        "sound": "ŋk",
        "word": "prank",
        "model": "Say prank naturally. Locate nk in its print and model its reviewed sound ŋk; keep the multiple consonant sounds in this taught chunk, rather than calling it one phoneme."
      },
      "decoding": {
        "words": [
          "prank",
          "felt",
          "clip"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in prank, felt, clip; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "prank",
          "meaning": "a playful trick that should not hurt anyone"
        },
        {
          "word": "felt",
          "meaning": "soft cloth used for crafts"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: Why did Sam grin when he looked again at the bug? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 6 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:784d71305b9f8b66",
    "reviewedManuscriptSha256": "1b3c88050fc36c72b785d4e3334bf28b4d6620231ca40fc422fbd8c3fa595def",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-28",
    "number": 28,
    "title": "The King",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 23,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "ng in king; past-tense narrative and reciprocal action",
    "practiceWords": [
      "king",
      "got",
      "put"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "be",
        "cycle": 20,
        "reason": "Final e represents /i/. Explicit HFW first introduced in Cycle 20."
      },
      {
        "word": "for",
        "cycle": 12,
        "reason": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "said",
        "cycle": 7,
        "reason": "Whole-word ai represents /ɛ/. Explicit HFW first introduced in Cycle 7."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "was",
        "cycle": 11,
        "reason": "Unstressed a is schwa and final s represents /z/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "you",
        "cycle": 10,
        "reason": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "be",
        "graphemes": [
          "b",
          "e"
        ],
        "sounds": [
          "b",
          "i"
        ],
        "firstCycle": 20,
        "type": "exception",
        "note": "Final e represents /i/. Explicit HFW first introduced in Cycle 20."
      },
      {
        "word": "bun",
        "graphemes": [
          "b",
          "u",
          "n"
        ],
        "sounds": [
          "b",
          "ʌ",
          "n"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "can",
        "graphemes": [
          "c",
          "a",
          "n"
        ],
        "sounds": [
          "k",
          "æ",
          "n"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "did",
        "graphemes": [
          "d",
          "i",
          "d"
        ],
        "sounds": [
          "d",
          "ɪ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dot",
        "graphemes": [
          "d",
          "o",
          "t"
        ],
        "sounds": [
          "d",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "for",
        "graphemes": [
          "f",
          "or"
        ],
        "sounds": [
          "f",
          "ɔɹ"
        ],
        "firstCycle": 12,
        "type": "exception",
        "note": "The whole word contains r-controlled or. Explicit HFW first introduced in Cycle 12."
      },
      {
        "word": "get",
        "graphemes": [
          "g",
          "e",
          "t"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "got",
        "graphemes": [
          "g",
          "o",
          "t"
        ],
        "sounds": [
          "g",
          "ɑ",
          "t"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "had",
        "graphemes": [
          "h",
          "a",
          "d"
        ],
        "sounds": [
          "h",
          "æ",
          "d"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "hat",
        "graphemes": [
          "h",
          "a",
          "t"
        ],
        "sounds": [
          "h",
          "æ",
          "t"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "king",
        "graphemes": [
          "k",
          "i",
          "ng"
        ],
        "sounds": [
          "k",
          "ɪ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "not",
        "graphemes": [
          "n",
          "o",
          "t"
        ],
        "sounds": [
          "n",
          "ɑ",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "rug",
        "graphemes": [
          "r",
          "u",
          "g"
        ],
        "sounds": [
          "ɹ",
          "ʌ",
          "g"
        ],
        "firstCycle": 10,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "said",
        "graphemes": [
          "s",
          "ai",
          "d"
        ],
        "sounds": [
          "s",
          "ɛ",
          "d"
        ],
        "firstCycle": 7,
        "type": "exception",
        "note": "Whole-word ai represents /ɛ/. Explicit HFW first introduced in Cycle 7."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sat",
        "graphemes": [
          "s",
          "a",
          "t"
        ],
        "sounds": [
          "s",
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "set",
        "graphemes": [
          "s",
          "e",
          "t"
        ],
        "sounds": [
          "s",
          "ɛ",
          "t"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "tall",
        "graphemes": [
          "t",
          "all"
        ],
        "sounds": [
          "t",
          "ɔl"
        ],
        "firstCycle": 16,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "was",
        "graphemes": [
          "w",
          "a",
          "s"
        ],
        "sounds": [
          "w",
          "ə",
          "z"
        ],
        "firstCycle": 11,
        "type": "exception",
        "note": "Unstressed a is schwa and final s represents /z/. Explicit HFW first introduced in Cycle 11."
      },
      {
        "word": "you",
        "graphemes": [
          "y",
          "ou"
        ],
        "sounds": [
          "j",
          "u"
        ],
        "firstCycle": 10,
        "type": "exception",
        "note": "Whole-word ou represents /u/. Explicit HFW first introduced in Cycle 10."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam wants to play king and have Dot do every task.",
      "failedAttempt": "Dot stops responding when Sam demands another item.",
      "turn": "Sam notices her boundary and fetches a bun for each of them.",
      "resolution": "Dot reciprocates with a cup, and Sam gives the pretend royal role to a bun while they sit as equals.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ]
    },
    "narrator": {
      "person": "third",
      "tense": "past"
    },
    "setting": "A playroom with a rolled red rug, low snack table and clear floor.",
    "props": [
      "One tall clean yellow paper crown-like hat with a wide stable opening, used only for pretend play.",
      "One red rug.",
      "Two small blue cups.",
      "Two plain buns. No real throne, royal servants or other characters."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot sit together on the red rug beside the tall paper hat holding a bun. Keep the playful hat clearly a craft prop.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam was a king.\nSam had a tall hat.\nDot was not a king.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam wears the tall yellow paper hat and poses as a pretend king. Dot stands nearby. The rug is rolled on the floor; two cups and two buns wait on the low table.",
        "imageAlt": "Sam wears a tall paper hat beside Dot and the rolled rug.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Sam wears the tall yellow paper hat and poses as a pretend king. Dot stands nearby. The rug is rolled on the floor; two cups and two buns wait on the low table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam wears a tall paper hat beside Dot and the rolled rug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "\"Get my rug,\" said Sam.\nDot got the rug. Sam sat on it.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot unrolls the red rug for Sam. Sam sits on it wearing the hat; cups and buns stay on the table.",
        "imageAlt": "Dot unrolls the rug while Sam sits down.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Dot unrolls the red rug for Sam. Sam sits on it wearing the hat; cups and buns stay on the table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Dot unrolls the rug while Sam sits down.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "\"Get my cup,\" said Sam.\nDot got the cup.\nSam sat on the rug.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot brings one blue cup to Sam on the rug. Sam remains seated in his hat; the second cup and both buns stay on the table.",
        "imageAlt": "Dot brings Sam a cup on the rug.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Dot brings one blue cup to Sam on the rug. Sam remains seated in his hat; the second cup and both buns stay on the table.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Dot brings Sam a cup on the rug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "\"Get my bun,\" said Sam. Dot sat.\n\"You get it.\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot sits firmly on the floor beside the rug with folded hands. Sam points toward the buns, but Dot does not get up. Her expression is calm rather than angry.",
        "imageAlt": "Dot sits down while Sam points toward the buns.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Dot sits firmly on the floor beside the rug with folded hands. Sam points toward the buns, but Dot does not get up. Her expression is calm rather than angry.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Dot sits down while Sam points toward the buns.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Sam got up. Dot did not get up.\nSam got a bun for Dot\nand a bun for Sam.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam gets up and fetches both buns, holding one in each hand. Dot remains seated, watching his changed action.",
        "imageAlt": "Sam carries one bun in each hand.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Sam gets up and fetches both buns, holding one in each hand. Dot remains seated, watching his changed action.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Sam carries one bun in each hand.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "\"A bun for you,\" said Sam.\nDot set a cup on the rug for Sam.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam offers one bun to Dot. Dot brings the remaining blue cup onto the rug and sets it for Sam; the first cup moves beside Dot. Exactly two cups and two buns.",
        "imageAlt": "Sam offers Dot a bun as she sets a cup on the rug.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Sam offers one bun to Dot. Dot brings the remaining blue cup onto the rug and sets it for Sam; the first cup moves beside Dot. Exactly two cups and two buns.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Sam offers Dot a bun as she sets a cup on the rug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Sam put the tall hat on the rug.\n\"My bun can be the king!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam removes the tall yellow paper hat and sets it upright on the rug. He places his bun in its wide opening as a playful pretend king.",
        "imageAlt": "Sam puts his bun inside the yellow paper crown. Dot holds her bun beside two blue cups.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Sam removes the tall yellow paper hat and sets it upright on the rug. He places his bun in its wide opening as a playful pretend king.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Sam puts his bun inside the yellow paper crown. Dot holds her bun beside two blue cups.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Sam and Dot sat on the rug.\nThe bun was in the tall hat.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam and Dot sit side by side on the rug. Dot holds her bun, and Sam’s bun sits in the hat between them. Both blue cups remain on the rug.",
        "imageAlt": "Sam and Dot sit beside the bun inside the tall hat.",
        "state": {
          "location": "A playroom with a rolled red rug, low snack table and clear floor.",
          "visible": "Sam and Dot sit side by side on the rug. Dot holds her bun, and Sam’s bun sits in the hat between them. Both blue cups remain on the rug.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Sam and Dot sit beside the bun inside the tall hat.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Sam do after Dot stopped fetching things?",
        "listenFor": "He got a bun for Dot as well as himself, and they shared the tasks and snack."
      },
      "visual": {
        "page": 5,
        "prompt": "What is different about Sam’s hands and feet now?",
        "lookFor": "He is standing and carrying both buns instead of sitting and pointing for Dot to work."
      }
    },
    "levelRationale": "C: the child must track a social boundary and an action-based repair across dialogue and past-tense narration, then interpret the playful transfer of the hat.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ng",
        "sound": "ŋ",
        "word": "king",
        "model": "Say king naturally. Locate ng in its print and model its reviewed sound ŋ; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "king",
          "got",
          "put"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in king, got, put; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "king",
          "meaning": "a ruler; Sam is only pretending"
        },
        {
          "word": "said",
          "meaning": "the past-tense word used to tell what someone spoke"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What did Sam do after Dot stopped fetching things? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 5 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:e197201836cc549e",
    "reviewedManuscriptSha256": "2a9066677d75d2423b76408a40dd67f0b4d8280955aa5b0d2f6db94cc1a04e38",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-29",
    "number": 29,
    "title": "Sniff, Pup!",
    "appLevel": "B",
    "level": "B",
    "afterCycle": 24,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "ff in sniff; /sn/ at the start and the reviewed /s/ ending in sniffs",
    "practiceWords": [
      "sniff",
      "sniffs",
      "lift"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "each",
        "cycle": 17,
        "reason": "Whole-word ea represents /i/. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "of",
        "cycle": 4,
        "reason": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "put",
        "cycle": 19,
        "reason": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bit",
        "graphemes": [
          "b",
          "i",
          "t"
        ],
        "sounds": [
          "b",
          "ɪ",
          "t"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "cup",
        "graphemes": [
          "c",
          "u",
          "p"
        ],
        "sounds": [
          "k",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "each",
        "graphemes": [
          "ea",
          "ch"
        ],
        "sounds": [
          "i",
          "tʃ"
        ],
        "firstCycle": 17,
        "type": "exception",
        "note": "Whole-word ea represents /i/. Explicit HFW first introduced in Cycle 17."
      },
      {
        "word": "fish",
        "graphemes": [
          "f",
          "i",
          "sh"
        ],
        "sounds": [
          "f",
          "ɪ",
          "ʃ"
        ],
        "firstCycle": 15,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "gets",
        "graphemes": [
          "g",
          "e",
          "t",
          "s"
        ],
        "sounds": [
          "g",
          "ɛ",
          "t",
          "s"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "in",
        "graphemes": [
          "i",
          "n"
        ],
        "sounds": [
          "ɪ",
          "n"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "it",
        "graphemes": [
          "i",
          "t"
        ],
        "sounds": [
          "ɪ",
          "t"
        ],
        "firstCycle": 3,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lid",
        "graphemes": [
          "l",
          "i",
          "d"
        ],
        "sounds": [
          "l",
          "ɪ",
          "d"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "lift",
        "graphemes": [
          "l",
          "i",
          "f",
          "t"
        ],
        "sounds": [
          "l",
          "ɪ",
          "f",
          "t"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "of",
        "graphemes": [
          "o",
          "f"
        ],
        "sounds": [
          "ə",
          "v"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Unstressed o is schwa and f represents /v/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "on",
        "graphemes": [
          "o",
          "n"
        ],
        "sounds": [
          "ɑ",
          "n"
        ],
        "firstCycle": 5,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "pat",
        "graphemes": [
          "p",
          "a",
          "t"
        ],
        "sounds": [
          "p",
          "æ",
          "t"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "pink",
        "graphemes": [
          "p",
          "i",
          "nk"
        ],
        "sounds": [
          "p",
          "ɪ",
          "ŋk"
        ],
        "firstCycle": 22,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "pup",
        "graphemes": [
          "p",
          "u",
          "p"
        ],
        "sounds": [
          "p",
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "put",
        "graphemes": [
          "p",
          "u",
          "t"
        ],
        "sounds": [
          "p",
          "ʊ",
          "t"
        ],
        "firstCycle": 19,
        "type": "exception",
        "note": "The vowel is /ʊ/, not the taught short-u /ʌ/. Explicit HFW first introduced in Cycle 19."
      },
      {
        "word": "red",
        "graphemes": [
          "r",
          "e",
          "d"
        ],
        "sounds": [
          "ɹ",
          "ɛ",
          "d"
        ],
        "firstCycle": 12,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sniff",
        "graphemes": [
          "s",
          "n",
          "i",
          "ff"
        ],
        "sounds": [
          "s",
          "n",
          "ɪ",
          "f"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sniffs",
        "graphemes": [
          "s",
          "n",
          "i",
          "ff",
          "s"
        ],
        "sounds": [
          "s",
          "n",
          "ɪ",
          "f",
          "s"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "taps",
        "graphemes": [
          "t",
          "a",
          "p",
          "s"
        ],
        "sounds": [
          "t",
          "æ",
          "p",
          "s"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam invites Pup to find a small food reward hidden in one of two cups.",
      "failedAttempt": "Pup taps the empty pink cup first.",
      "turn": "Pup uses smell at the covered red cup.",
      "resolution": "Sam lifts the correct lid and Pup receives the fish.",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-PUP"
      ]
    },
    "narrator": {
      "characterId": "SMALL-SAM",
      "person": "first",
      "tense": "present"
    },
    "setting": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
    "props": [
      "One red plastic cup and one pink plastic cup, identical size, each with a matching loose lift-off lid.",
      "One tiny piece of plain cooked boneless fish, prepared and cool before the story begins.",
      "The fish stays in the red cup until the final page. The pink cup is always empty."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Pup lowers his nose toward the red lidded cup while Sam sits beside the red and pink cups; keep the reward concealed.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "I have a red cup\nand a pink cup.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam sits with Pup beside one empty red cup and one empty pink cup on the mat. The two loose lids and tiny prepared fish piece lie on a small plate nearby.",
        "imageAlt": "Sam and Pup sit beside a red cup and a pink cup.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Sam sits with Pup beside one empty red cup and one empty pink cup on the mat. The two loose lids and tiny prepared fish piece lie on a small plate nearby.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 7."
        },
        "pageDescription": "Sam and Pup sit beside a red cup and a pink cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I put a bit of fish\nin the red cup.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam places the single tiny fish piece into the red cup while Pup watches from beside him. The pink cup remains empty.",
        "imageAlt": "Sam puts a small piece of fish in the red cup.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Sam places the single tiny fish piece into the red cup while Pup watches from beside him. The pink cup remains empty.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 7."
        },
        "pageDescription": "Sam puts a small piece of fish in the red cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "I put a lid on each cup.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam places a loose matching lid on each cup. The fish is hidden in the red cup; both cups are now closed.",
        "imageAlt": "Sam covers both cups with lids.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Sam places a loose matching lid on each cup. The fish is hidden in the red cup; both cups are now closed.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 7."
        },
        "pageDescription": "Sam covers both cups with lids.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Pup taps the pink lid. I lift it.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Pup taps the pink lid with one natural front paw. Sam lifts that lid to show the empty pink cup. The red cup remains closed.",
        "imageAlt": "Pup taps the pink lid as Sam opens the empty cup.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Pup taps the pink lid with one natural front paw. Sam lifts that lid to show the empty pink cup. The red cup remains closed.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 7."
        },
        "pageDescription": "Pup taps the pink lid as Sam opens the empty cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Pup sniffs the red lid.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Pup lowers his nose close to the closed red lid and sniffs. Sam watches quietly. The empty pink cup remains open with its lid beside it.",
        "imageAlt": "Pup sniffs the lid of the red cup.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Pup lowers his nose close to the closed red lid and sniffs. Sam watches quietly. The empty pink cup remains open with its lid beside it.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 7."
        },
        "pageDescription": "Pup sniffs the lid of the red cup.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Pup taps the red lid. I lift it.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Pup taps the red lid with one front paw as Sam lifts it, revealing the tiny fish piece. Keep Pup’s nose clear of the moving lid.",
        "imageAlt": "Pup taps the red cup as Sam lifts its lid. A small piece of fish is inside.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Pup taps the red lid with one front paw as Sam lifts it, revealing the tiny fish piece. Keep Pup’s nose clear of the moving lid.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 7."
        },
        "pageDescription": "Pup taps the red cup as Sam lifts its lid. A small piece of fish is inside.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Pup gets the fish. I pat Pup.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Pup receives and eats the tiny fish piece beside the open red cup while Sam pats his shoulder. Both cups are now open and empty; both lids lie nearby.",
        "imageAlt": "Sam pats Pup's back as Pup licks the empty plate. Both cups stand open.",
        "state": {
          "location": "A clean kitchen floor mat used for a brief supervised-style scent game between Sam and Pup.",
          "visible": "Pup receives and eats the tiny fish piece beside the open red cup while Sam pats his shoulder. Both cups are now open and empty; both lids lie nearby.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 7."
        },
        "pageDescription": "Sam pats Pup's back as Pup licks the empty plate. Both cups stand open.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What did Pup try after tapping the empty cup?",
        "listenFor": "He sniffed the covered red cup and then tapped its lid."
      },
      "visual": {
        "page": 5,
        "prompt": "Which cup is still covered, and what is Pup doing there?",
        "lookFor": "The red cup is covered; Pup’s nose is close to its lid as he sniffs."
      }
    },
    "levelRationale": "B: a concrete two-choice search changes from the first selection to smell, with one consistent concealed object and a clear reward.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ff",
        "sound": "f",
        "word": "sniff",
        "model": "Say sniff naturally. Locate ff in its print and model its reviewed sound f; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "sniff",
          "sniffs",
          "lift"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in sniff, sniffs, lift; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "sniff",
          "meaning": "draw air in through the nose to smell something"
        },
        {
          "word": "lid",
          "meaning": "a cover for a container"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What did Pup try after tapping the empty cup? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 5 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:da4e3099871acf37",
    "reviewedManuscriptSha256": "a67cff4e25caf05431e90a0f3e80b89e4878c45140029175069fa08900bb9e48",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  },
  {
    "id": "next-steps-30",
    "number": 30,
    "title": "The Bell Band",
    "appLevel": "C",
    "level": "C",
    "afterCycle": 24,
    "additionalPrerequisites": [
      "next-steps-final-blends",
      "next-steps-initial-blends",
      "next-steps-both-blends"
    ],
    "focus": "ll in bell; /kl/ plus final /ps/ in claps; reading when-clauses",
    "practiceWords": [
      "bell",
      "claps",
      "stop"
    ],
    "exceptions": [
      {
        "word": "a",
        "cycle": 2,
        "reason": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "go",
        "cycle": 5,
        "reason": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "have",
        "cycle": 18,
        "reason": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "his",
        "cycle": 13,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 13."
      },
      {
        "word": "i",
        "cycle": 1,
        "reason": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "cycle": 4,
        "reason": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "look",
        "cycle": 15,
        "reason": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "my",
        "cycle": 6,
        "reason": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "says",
        "cycle": 16,
        "reason": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "the",
        "cycle": 2,
        "reason": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      }
    ],
    "wordRecords": [
      {
        "word": "a",
        "graphemes": [
          "a"
        ],
        "sounds": [
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Unstressed article uses schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "and",
        "graphemes": [
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "at",
        "graphemes": [
          "a",
          "t"
        ],
        "sounds": [
          "æ",
          "t"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "band",
        "graphemes": [
          "b",
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "b",
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 8,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "bell",
        "graphemes": [
          "b",
          "e",
          "ll"
        ],
        "sounds": [
          "b",
          "ɛ",
          "l"
        ],
        "firstCycle": 24,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "but",
        "graphemes": [
          "b",
          "u",
          "t"
        ],
        "sounds": [
          "b",
          "ʌ",
          "t"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "clap",
        "graphemes": [
          "c",
          "l",
          "a",
          "p"
        ],
        "sounds": [
          "k",
          "l",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "claps",
        "graphemes": [
          "c",
          "l",
          "a",
          "p",
          "s"
        ],
        "sounds": [
          "k",
          "l",
          "æ",
          "p",
          "s"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "dad",
        "graphemes": [
          "d",
          "a",
          "d"
        ],
        "sounds": [
          "d",
          "æ",
          "d"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "drum",
        "graphemes": [
          "d",
          "r",
          "u",
          "m"
        ],
        "sounds": [
          "d",
          "ɹ",
          "ʌ",
          "m"
        ],
        "firstCycle": 9,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "fast",
        "graphemes": [
          "f",
          "a",
          "s",
          "t"
        ],
        "sounds": [
          "f",
          "æ",
          "s",
          "t"
        ],
        "firstCycle": 4,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "go",
        "graphemes": [
          "g",
          "o"
        ],
        "sounds": [
          "g",
          "oʊ"
        ],
        "firstCycle": 5,
        "type": "exception",
        "note": "Final o represents /oʊ/. Explicit HFW first introduced in Cycle 5."
      },
      {
        "word": "hand",
        "graphemes": [
          "h",
          "a",
          "n",
          "d"
        ],
        "sounds": [
          "h",
          "æ",
          "n",
          "d"
        ],
        "firstCycle": 6,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "have",
        "graphemes": [
          "h",
          "a",
          "ve"
        ],
        "sounds": [
          "h",
          "æ",
          "v"
        ],
        "firstCycle": 18,
        "type": "exception",
        "note": "Whole-word ve aligns /v/ and the silent final e. Explicit HFW first introduced in Cycle 18."
      },
      {
        "word": "his",
        "graphemes": [
          "h",
          "i",
          "s"
        ],
        "sounds": [
          "h",
          "ɪ",
          "z"
        ],
        "firstCycle": 13,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 13."
      },
      {
        "word": "i",
        "graphemes": [
          "i"
        ],
        "sounds": [
          "aɪ"
        ],
        "firstCycle": 1,
        "type": "exception",
        "note": "Pronoun uses its whole-word long-vowel pronunciation. Explicit HFW first introduced in Cycle 1."
      },
      {
        "word": "is",
        "graphemes": [
          "i",
          "s"
        ],
        "sounds": [
          "ɪ",
          "z"
        ],
        "firstCycle": 4,
        "type": "exception",
        "note": "Final s represents /z/. Explicit HFW first introduced in Cycle 4."
      },
      {
        "word": "look",
        "graphemes": [
          "l",
          "oo",
          "k"
        ],
        "sounds": [
          "l",
          "ʊ",
          "k"
        ],
        "firstCycle": 15,
        "type": "exception",
        "note": "Whole-word oo represents /ʊ/. Explicit HFW first introduced in Cycle 15."
      },
      {
        "word": "my",
        "graphemes": [
          "m",
          "y"
        ],
        "sounds": [
          "m",
          "aɪ"
        ],
        "firstCycle": 6,
        "type": "exception",
        "note": "Final y represents /aɪ/. Explicit HFW first introduced in Cycle 6."
      },
      {
        "word": "ring",
        "graphemes": [
          "r",
          "i",
          "ng"
        ],
        "sounds": [
          "ɹ",
          "ɪ",
          "ŋ"
        ],
        "firstCycle": 23,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "sam",
        "graphemes": [
          "s",
          "a",
          "m"
        ],
        "sounds": [
          "s",
          "æ",
          "m"
        ],
        "firstCycle": 2,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "says",
        "graphemes": [
          "s",
          "ay",
          "s"
        ],
        "sounds": [
          "s",
          "ɛ",
          "z"
        ],
        "firstCycle": 16,
        "type": "exception",
        "note": "Whole-word ay represents /ɛ/ and final s represents /z/. Explicit HFW first introduced in Cycle 16."
      },
      {
        "word": "stop",
        "graphemes": [
          "s",
          "t",
          "o",
          "p"
        ],
        "sounds": [
          "s",
          "t",
          "ɑ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "tap",
        "graphemes": [
          "t",
          "a",
          "p"
        ],
        "sounds": [
          "t",
          "æ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "taps",
        "graphemes": [
          "t",
          "a",
          "p",
          "s"
        ],
        "sounds": [
          "t",
          "æ",
          "p",
          "s"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "the",
        "graphemes": [
          "th",
          "e"
        ],
        "sounds": [
          "ð",
          "ə"
        ],
        "firstCycle": 2,
        "type": "exception",
        "note": "Final e is unstressed schwa. Explicit HFW first introduced in Cycle 2."
      },
      {
        "word": "up",
        "graphemes": [
          "u",
          "p"
        ],
        "sounds": [
          "ʌ",
          "p"
        ],
        "firstCycle": 11,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      },
      {
        "word": "when",
        "graphemes": [
          "wh",
          "e",
          "n"
        ],
        "sounds": [
          "w",
          "ɛ",
          "n"
        ],
        "firstCycle": 21,
        "type": "regular",
        "note": "Reviewed U.S. pronunciation using only these taught correspondences; any adjacent consonants additionally require the book’s named blending lessons. Final s is /s/ only when written in this record."
      }
    ],
    "storyBibleReview": {
      "kind": "fiction",
      "storySpine": "Sam and Dot want to play as a band.",
      "failedAttempt": "They do not stop together, and Sam misses the stop signal while looking at his drum.",
      "turn": "Dad provides explicit clap/go and raised-hand/stop cues; Dot tells Sam to look.",
      "resolution": "They coordinate successfully, and Dad’s celebratory clap playfully starts them again.",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-SAM",
        "SMALL-DAD"
      ]
    },
    "narrator": {
      "characterId": "SMALL-DOT",
      "person": "first",
      "tense": "present"
    },
    "setting": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
    "props": [
      "One small blue hand drum with one soft mallet for Sam.",
      "One red-handled handbell for Dot.",
      "Dad uses only his hands for the signals. No printed notation or extra instruments."
    ],
    "coverBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot holds the red-handled bell and Sam holds his blue drum while Dad raises one open hand as a conductor. All eyes are on Dad.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam and I have a band.\nSam taps a drum. I ring a bell.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Sam taps his blue drum with its soft mallet while Dot rings the red-handled bell. Dad watches in front of them.",
        "imageAlt": "Sam taps a drum while Dot rings a bell.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Sam taps his blue drum with its soft mallet while Dot rings the red-handled bell. Dad watches in front of them.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 1 of 8."
        },
        "pageDescription": "Sam taps a drum while Dot rings a bell.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "I ring the bell. Sam taps fast.\nI stop, but Sam taps the drum.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot has stopped with the bell still in her hand, but Sam continues tapping rapidly while looking down at his drum. Their timing is visibly different.",
        "imageAlt": "Dot holds her bell still while Sam keeps tapping the drum.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Dot has stopped with the bell still in her hand, but Sam continues tapping rapidly while looking down at his drum. Their timing is visibly different.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 2 of 8."
        },
        "pageDescription": "Dot holds her bell still while Sam keeps tapping the drum.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dad claps. \"Stop and look,\" says Dad.\nSam and I stop.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad claps once and gestures for attention. Sam and Dot stop and look toward him, keeping their instruments still.",
        "imageAlt": "Dad claps as Sam and Dot stop to look at him.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Dad claps once and gestures for attention. Sam and Dot stop and look toward him, keeping their instruments still.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 3 of 8."
        },
        "pageDescription": "Dad claps as Sam and Dot stop to look at him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Dad says, \"When I clap, tap.\nWhen my hand is up, stop.\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad demonstrates his two signals: one hand is raised open after the clap, while Sam and Dot look attentively at him. Use one natural pose, not duplicate arms or a multi-panel diagram.",
        "imageAlt": "Dad raises an open hand while the children watch.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Dad demonstrates his two signals: one hand is raised open after the clap, while Sam and Dot look attentively at him. Use one natural pose, not duplicate arms or a multi-panel diagram.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 4 of 8."
        },
        "pageDescription": "Dad raises an open hand while the children watch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dad claps. I ring the bell.\nSam taps the drum.\nI look at Dad. His hand is up.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad’s hand is now raised open. Dot has just rung her bell; Sam is still tapping and looking down. This establishes the missed stop signal.",
        "imageAlt": "Dad holds his hand up while Sam still looks at the drum.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Dad’s hand is now raised open. Dot has just rung her bell; Sam is still tapping and looking down. This establishes the missed stop signal.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 5 of 8."
        },
        "pageDescription": "Dad holds his hand up while Sam still looks at the drum.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "I stop, but Sam taps.\n\"Look at Dad, Sam!\"",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dot holds her bell still and points toward Dad with her free hand. Sam keeps tapping but begins to lift his gaze. Dad’s hand remains up.",
        "imageAlt": "Dot points to Dad as Sam begins to look up.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Dot holds her bell still and points toward Dad with her free hand. Sam keeps tapping but begins to lift his gaze. Dad’s hand remains up.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 6 of 8."
        },
        "pageDescription": "Dot points to Dad as Sam begins to look up.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Sam and I look at Dad.\nDad claps.\nI ring the bell, and Sam taps.",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. Dad claps again; Sam and Dot both look at his hands and play together, Sam tapping the drum and Dot ringing the bell.",
        "imageAlt": "Dad claps while Sam plays the blue drum and Dot rings the red bell.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "Dad claps again; Sam and Dot both look at his hands and play together, Sam tapping the drum and Dot ringing the bell.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 7 of 8."
        },
        "pageDescription": "Dad claps while Sam plays the blue drum and Dot rings the red bell.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "I look at Dad. His hand is up.\nSam and I stop.\nDad claps. Sam and I go!",
        "imageBrief": "Clean, clear, bright cartoon picture-book illustration with strong clear outlines and flat colors. Use the current clean Small Steps cast master. No painted, embossed, patchy, gouache, canvas or paper texture; no lettering inside the image. After a successful stop, Dad gives an appreciative clap and the children immediately resume, smiling. Dad’s delighted expression makes this a playful extra round, not a failed test.",
        "imageAlt": "Dad kneels and claps while Sam drums and Dot rings the bell.",
        "state": {
          "location": "A family playroom with a clear rug and Dad standing in front of the two child musicians.",
          "visible": "After a successful stop, Dad gives an appreciative clap and the children immediately resume, smiling. Dad’s delighted expression makes this a playful extra round, not a failed test.",
          "continuity": "Preserve the book’s declared cast, fixed setting and prop ledger. This is page 8 of 8."
        },
        "pageDescription": "Dad kneels and claps while Sam drums and Dot rings the bell.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What helped Sam stop with Dot?",
        "listenFor": "He looked at Dad’s raised hand instead of only looking at his drum."
      },
      "visual": {
        "page": 6,
        "prompt": "Where is Dot pointing, and where should Sam look?",
        "lookFor": "She points to Dad’s raised hand, the stop signal."
      }
    },
    "levelRationale": "C: conditional when-clauses, a missed visual cue, coordinated correction and an intentionally playful double meaning for the final clap.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ll",
        "sound": "l",
        "word": "bell",
        "model": "Say bell naturally. Locate ll in its print and model its reviewed sound l; then blend it with the surrounding sounds."
      },
      "decoding": {
        "words": [
          "bell",
          "claps",
          "stop"
        ],
        "model": "Before reading, confirm the completed-cycle prerequisite and the named supplemental blending lessons. Model each reviewed sound in bell, claps, stop; join the sounds without dropping a consonant or adding a vowel. Teach the actual declared whole-word exceptions explicitly; their unusual spellings do not introduce a general pattern."
      },
      "languagePrep": [
        {
          "word": "band",
          "meaning": "people playing music together"
        },
        {
          "word": "signal",
          "meaning": "an action that gives information"
        }
      ],
      "connectedReading": "Let the child try the print, with support as needed. If a word is difficult, return to its reviewed spelling and sounds; use the picture to discuss meaning after reading, not to guess the word. Then ask: What helped Sam stop with Dot? A daily short reading routine may include this book; record independent reading separately from narration or word help.",
      "fluency": "Reread the page 6 passage with attention to its punctuation and the actual scene. Invite a smoother second reading that preserves every printed word, then check the explanation against the picture."
    },
    "reviewedTextFingerprint": "fnv1a64:e52cfc35b67aa662",
    "reviewedManuscriptSha256": "185511c47619dd20dac77212628ec0bfb4fefe8cc8aafda2eab6613ed56d0b57",
    "type": "fiction",
    "readingBandProfile": "standard",
    "readingMode": "decodable",
    "interestAge": "4–8; also suitable for older beginners"
  }
]);

export const GUIDED_READING_NEXT_STEPS_BOOKS = Object.freeze(MANUSCRIPTS.map(row => {
  const folder = "/guided-reading/next-steps/book-" + String(row.number).padStart(2, "0");
  const decodableScope = deepFreeze({
    id: row.id + ":v1", version: "2026-10-29.1", afterCycle: row.afterCycle,
    focus: row.focus, practiceWords: row.practiceWords, exceptions: row.exceptions, wordRecords: row.wordRecords,
    additionalPrerequisites: row.additionalPrerequisites,
    reviewedTextFingerprint: row.reviewedTextFingerprint, reviewedAt: "2026-10-29",
    reviewMethod: "Independent complete-manuscript, title, pronunciation and cumulative-code review",
    wordShape: "VC/CVC; named supplemental lessons permit final, initial and combined consonant blends cumulatively. Only explicitly reviewed correspondences, chunks and exact whole-word exceptions are permitted."
  });
  return deepFreeze({
    ...row, guidedReadingLevel: row.level,
    collection: "Next Steps", seriesTitle: "Next Steps", seriesId: "next-steps", seriesOrder: row.number,
    active: true, qaStatus: "approved", narrationProfile: "leda",
    decodableScope, fullTextDecodingEvidence: decodableScope,
    cast: row.storyBibleReview.canonIds,
    coverImage: folder + "/cover.webp", cover: folder + "/cover.webp", coverUrl: folder + "/cover.webp",
    pages: row.pages.map(page => ({
      ...page, image: folder + "/page-" + String(page.pageNumber).padStart(2, "0") + ".webp",
      pageAudioText: page.text, narrationProfile: "leda",
      active: true, qaStatus: "approved", narrationNeedsRebuild: true
    }))
  });
}));

export const GUIDED_READING_DISCUSSION_PROMPTS_NEXT_STEPS = deepFreeze(Object.fromEntries(
  GUIDED_READING_NEXT_STEPS_BOOKS.map(book => [book.id, book.discussion])
));

export const GUIDED_READING_NEXT_STEPS_METADATA = deepFreeze(Object.fromEntries(
  GUIDED_READING_NEXT_STEPS_BOOKS.map(book => [book.id, {readingBandProfile: book.readingBandProfile, readingMode: book.readingMode}])
));

export const GUIDED_READING_NEXT_STEPS_LEVEL_REVIEWS = deepFreeze(Object.fromEntries(
  GUIDED_READING_NEXT_STEPS_BOOKS.map(book => [book.id, {
    appReadingLevel: book.appLevel, rationale: book.levelRationale, reviewedAt: "2026-10-29",
    reviewMethod: "codex-full-manuscript-editorial-review", reviewedTextFingerprint: book.reviewedTextFingerprint
  }])
));
