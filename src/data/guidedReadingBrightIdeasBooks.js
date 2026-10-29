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
    "id": "bright-ideas-01",
    "number": 1,
    "title": "A Leaf Rubbing",
    "type": "nonfiction",
    "appLevel": "A",
    "level": "A",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [
        "SMALL-DOT"
      ],
      "topicQuestion": "How can the lines on a leaf appear on paper?",
      "progression": "Observe the leaf, place it under paper, rub, and compare the revealed shape.",
      "synthesis": "The rubbing records the leaf shape and raised lines.",
      "scienceSources": [
        {
          "title": "Columbia Museum of Art: Leaf Rubbings",
          "url": "https://www.columbiamuseum.org/art-activity-leaf-rubbings",
          "evidence": "Leaf underside faces up beneath paper; rubbing with the crayon side reveals raised veins.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "Dot sits at a low oak craft table beside a window in daylight.",
    "props": [
      "One broad green leaf with a pointed tip, central vein and five paired side veins",
      "One white sheet",
      "One unwrapped blue wax crayon"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot holds the finished blue leaf rubbing beside its single green source leaf at the oak table. Show matching branching veins and the unwrapped blue crayon lying nearby. One leaf, one paper, one crayon; no duplicate leaves or invented writing.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dot has a leaf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot holds a green leaf above the table. Exact state: Leaf whole; paper and crayon unused.",
        "imageAlt": "Dot holds a green leaf above a table with a blank sheet and a blue crayon.",
        "state": "Leaf whole; paper and crayon unused.",
        "pageDescription": "Dot holds a green leaf above a table with a blank sheet and a blue crayon.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "The leaf has raised lines.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot feels the raised lines on the underside of the leaf. Exact state: Leaf underside up; same vein pattern.",
        "imageAlt": "Dot touches a raised line on the green leaf.",
        "state": "Leaf underside up; same vein pattern.",
        "pageDescription": "Dot touches a raised line on the green leaf.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dot puts the leaf down.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot places the leaf on the table with its raised veins facing up. Exact state: Leaf tip points away from Dot throughout.",
        "imageAlt": "Dot puts the leaf on the table beside the blank paper.",
        "state": "Leaf tip points away from Dot throughout.",
        "pageDescription": "Dot puts the leaf on the table beside the blank paper.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The paper covers the leaf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot places the white sheet over the leaf. Exact state: Leaf fully covered; paper blank.",
        "imageAlt": "Dot lays a white sheet over the leaf.",
        "state": "Leaf fully covered; paper blank.",
        "pageDescription": "Dot lays a white sheet over the leaf.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dot rubs with the crayon.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot holds the paper still and rubs with the side of the blue crayon. Exact state: First blue patches reveal central vein; no leaf visible through paper.",
        "imageAlt": "Dot rubs a blue crayon across the paper while holding it still.",
        "state": "First blue patches reveal central vein; no leaf visible through paper.",
        "pageDescription": "Dot rubs a blue crayon across the paper while holding it still.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Blue lines show on the paper.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Blue branching lines appear beneath Dot’s crayon. Exact state: Five paired vein branches emerging in matching orientation.",
        "imageAlt": "Blue branching lines appear on the paper as Dot rubs with the crayon.",
        "state": "Five paired vein branches emerging in matching orientation.",
        "pageDescription": "Blue branching lines appear on the paper as Dot rubs with the crayon.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dot lifts the paper.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot lifts the finished blue rubbing beside the leaf. Exact state: Whole rubbing revealed; leaf unchanged.",
        "imageAlt": "Dot lifts the paper to show the blue rubbing. The green leaf lies below it.",
        "state": "Whole rubbing revealed; leaf unchanged.",
        "pageDescription": "Dot lifts the paper to show the blue rubbing. The green leaf lies below it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The lines match the leaf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot sits at a low oak craft table beside a window in daylight. Dot points between the leaf and its matching blue rubbing. Exact state: Comparison resolves opening inquiry; one original and one rubbing.",
        "imageAlt": "Dot points to matching lines on the green leaf and the blue rubbing.",
        "state": "Comparison resolves opening inquiry; one original and one rubbing.",
        "pageDescription": "Dot points to matching lines on the green leaf and the blue rubbing.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How did Dot make the leaf’s lines show?",
        "listenFor": "Leaf under paper; crayon rubbed on top; matching lines appeared."
      },
      "visual": {
        "page": 8,
        "prompt": "What matches on the leaf and paper?",
        "lookFor": "Central line, side branches and outside shape."
      }
    },
    "levelRationale": "One concrete clause per page, recurring leaf/paper/lines, and a visible ordered process. Raised and rubbing merit oral meaning support without raising the simple printed syntax.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "l",
        "sound": "l",
        "word": "leaf",
        "model": "Say leaf. Listen for /l/, then find l in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "Dot",
          "has",
          "rubs"
        ],
        "model": "Blend Dot: /d/ /ɑ/ /t/; has: /h/ /æ/ /z/; rubs: /r/ /ʌ/ /b/ /z/. Point out that final s spells /z/ in has and rubs. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. Read a naturally as /ə/ in these sentences; its letter name is /eɪ/."
      },
      "highFrequencyWords": [
        "the",
        "a"
      ],
      "languagePrep": [
        {
          "word": "raised",
          "meaning": "sticking up a little"
        },
        {
          "word": "match",
          "meaning": "have the same shape here"
        }
      ],
      "connectedReading": "Read the process in order, helping with unfamiliar words; retell using the leaf and paper.",
      "fluency": "Reread pages 5–8 in smooth phrases and pause at each full stop."
    },
    "reviewedTextFingerprint": "fnv1a64:fc4d5b48183da39d",
    "reviewedManuscriptSha256": "fd54bfed79dde65dddf82eaa38f43a45d4c0f32ee2c57255a815cf4ad7971347",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-02",
    "number": 2,
    "title": "Sam’s Sock Puppet",
    "type": "fiction",
    "appLevel": "A",
    "level": "A",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ],
      "storySpine": "Sam wants Dot to see his sock puppet, but he faces it toward himself; he turns it around and gets a nose tap.",
      "failedAttempt": "Sam waves the puppet while its face still points away from Dot.",
      "turn": "Sam sees that Dot is looking at the plain back and turns the puppet.",
      "resolution": "Dot sees its face; the soft puppet then taps Sam’s nose."
    },
    "setting": "Sam and Dot sit across a low playroom table in daylight.",
    "props": [
      "One clean red sock puppet with two sewn black eyes and a stitched mouth on its toe; plain back",
      "One low table"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam holds the red sock puppet between himself and Dot across the low table. The stitched face points toward Sam and the plain back toward Dot, who leans to see it. Stage the perspective problem clearly; no second puppet or added craft materials.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam has a sock puppet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Sam wears the red sock puppet on his right hand. Exact state: Puppet face toward Sam; Dot opposite.",
        "imageAlt": "Sam holds a red sock puppet toward himself while Dot sits across the table.",
        "state": "Puppet face toward Sam; Dot opposite.",
        "pageDescription": "Sam holds a red sock puppet toward himself while Dot sits across the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Sam shows Dot the puppet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Sam holds the puppet between himself and Dot. Exact state: Dot sees only plain back.",
        "imageAlt": "Sam holds the puppet out toward Dot, with its face still turned toward him.",
        "state": "Dot sees only plain back.",
        "pageDescription": "Sam holds the puppet out toward Dot, with its face still turned toward him.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dot sees the plain back.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Dot leans sideways to look at the puppet’s plain back. Exact state: Sam still looking at face.",
        "imageAlt": "Dot leans across the table to look at the plain back of Sam’s red sock puppet.",
        "state": "Sam still looking at face.",
        "pageDescription": "Dot leans across the table to look at the plain back of Sam’s red sock puppet.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Sam waves the puppet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Sam waves the puppet without turning its face. Exact state: Same orientation; no new prop.",
        "imageAlt": "Sam waves the puppet while Dot looks at its plain back.",
        "state": "Same orientation; no new prop.",
        "pageDescription": "Sam waves the puppet while Dot looks at its plain back.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dot points at the back.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Dot points to the plain side facing her. Exact state: Recognition cue; Sam follows her finger.",
        "imageAlt": "Dot points to the puppet’s plain back while Sam holds it up.",
        "state": "Recognition cue; Sam follows her finger.",
        "pageDescription": "Dot points to the puppet’s plain back while Sam holds it up.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Sam turns the puppet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Sam rotates his wrist to face the puppet toward Dot. Exact state: Face now visible to Dot.",
        "imageAlt": "Sam turns the puppet’s stitched face toward Dot.",
        "state": "Face now visible to Dot.",
        "pageDescription": "Sam turns the puppet’s stitched face toward Dot.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dot sees the face.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Dot laughs at the puppet’s stitched face. Exact state: Sam and Dot remain opposite.",
        "imageAlt": "Dot laughs as she looks at the puppet’s stitched face.",
        "state": "Sam and Dot remain opposite.",
        "pageDescription": "Dot laughs as she looks at the puppet’s stitched face.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The puppet taps Sam’s nose.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit across a low playroom table in daylight. Sam bends the soft puppet back and touches his own nose. Exact state: Tap is playful and gentle; Dot still sees face.",
        "imageAlt": "Sam touches his nose with the soft puppet while Dot laughs.",
        "state": "Tap is playful and gentle; Dot still sees face.",
        "pageDescription": "Sam touches his nose with the soft puppet while Dot laughs.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Sam turn the puppet?",
        "listenFor": "Dot could see only its back; turning revealed its face."
      },
      "visual": {
        "page": 3,
        "prompt": "Which part can Dot see?",
        "lookFor": "Plain sock back faces Dot; eyes face Sam."
      }
    },
    "levelRationale": "Highly controlled present-tense clauses and repeated concrete nouns support one perspective change and an immediate physical payoff.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "s",
        "sound": "s",
        "word": "sock",
        "model": "Say sock. Listen for /s/, then find s in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "Sam",
          "sock",
          "taps"
        ],
        "model": "Blend Sam: /s/ /æ/ /m/; sock: /s/ /ɑ/ /k/; taps: /t/ /æ/ /p/ /s/. The two letters ck work together for /k/. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. In has, final s spells /z/."
      },
      "highFrequencyWords": [
        "the",
        "has"
      ],
      "languagePrep": [
        {
          "word": "puppet",
          "meaning": "a toy moved by a hand"
        },
        {
          "word": "plain",
          "meaning": "without a face or pattern"
        }
      ],
      "connectedReading": "Let the reader try the print, then retell what Dot sees before and after the turn.",
      "fluency": "Reread the last three pages, letting the nose-tap line land without adding words."
    },
    "reviewedTextFingerprint": "fnv1a64:22681ef55a0336e8",
    "reviewedManuscriptSha256": "86e8461de537c9b50b093daac7f59f284e14be350b5456e8e4ce3b8f3e1b9443",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-03",
    "number": 3,
    "title": "Watch a Pill Bug",
    "type": "nonfiction",
    "appLevel": "B",
    "level": "B",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [],
      "topicQuestion": "What changes when a pill bug rolls up?",
      "progression": "Follow the same pill bug walking, curling, protecting its legs and unfolding.",
      "synthesis": "One animal can show a walking shape and a rounded protected shape.",
      "scienceSources": [
        {
          "title": "University of Florida IFAS: Armadillidium vulgare",
          "url": "https://ask.ifas.ufl.edu/publication/IN1099",
          "evidence": "Adult common pill bug has seven pairs of legs and can roll into a ball; gray/brown segmented anatomy.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "A shaded patch of damp leaf litter beside an old garden log, at close animal scale.",
    "props": [
      "One adult common pill bug, Armadillidium vulgare: gray segmented oval body, seven pairs of legs, two prominent antennae",
      "One curled brown leaf",
      "One fallen twig"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One natural adult common pill bug walks beside the curved brown leaf in damp litter. Show its segmented gray back, two prominent antennae and plausible seven leg pairs; no face, clothes, magnified human hands or second animal.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "A pill bug walks under a leaf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. A gray pill bug walks beneath the edge of a brown leaf. Exact state: One adult; seven leg pairs where visible.",
        "imageAlt": "A gray pill bug walks under the edge of a curled brown leaf.",
        "state": "One adult; seven leg pairs where visible.",
        "pageDescription": "A gray pill bug walks under the edge of a curled brown leaf.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Its legs move under its body.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. The pill bug walks along the damp wood with its legs beneath its body. Exact state: Natural close side view; no extra legs.",
        "imageAlt": "The pill bug moves its short legs along the wood.",
        "state": "Natural close side view; no extra legs.",
        "pageDescription": "The pill bug moves its short legs along the wood.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "A twig falls beside the pill bug.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. A small twig lands near the pill bug. Exact state: No child touching or provoking it; twig misses body.",
        "imageAlt": "A twig falls on the ground beside the pill bug.",
        "state": "No child touching or provoking it; twig misses body.",
        "pageDescription": "A twig falls on the ground beside the pill bug.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The pill bug curls up.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. The pill bug bends its segmented body inward. Exact state: Mid-curl, not two animals or multiple exposure.",
        "imageAlt": "The pill bug curls its body and tucks its legs inside.",
        "state": "Mid-curl, not two animals or multiple exposure.",
        "pageDescription": "The pill bug curls its body and tucks its legs inside.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Its hard back covers its soft legs.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. The pill bug forms a tight gray ball beside the twig. Exact state: Legs inside; one continuous shell of segments.",
        "imageAlt": "The pill bug forms a tight gray ball beside the twig.",
        "state": "Legs inside; one continuous shell of segments.",
        "pageDescription": "The pill bug forms a tight gray ball beside the twig.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "We wait.\nThe pill bug starts to open.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. The pill bug slowly unfolds beside the fallen twig. Exact state: Twig and leaf fixed.",
        "imageAlt": "The pill bug begins to open beside the fallen twig.",
        "state": "Twig and leaf fixed.",
        "pageDescription": "The pill bug begins to open beside the fallen twig.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Its legs reach the ground again.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. The pill bug extends its legs onto the damp soil. Exact state: Same adult now almost fully open.",
        "imageAlt": "The pill bug uncurls and puts its legs on the ground.",
        "state": "Same adult now almost fully open.",
        "pageDescription": "The pill bug uncurls and puts its legs on the ground.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The little ball can walk again.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A shaded patch of damp leaf litter beside an old garden log, at close animal scale. The pill bug walks back beneath the leaf. Exact state: Walking form returns; no human face or clothing.",
        "imageAlt": "The pill bug walks back under the brown leaf.",
        "state": "Walking form returns; no human face or clothing.",
        "pageDescription": "The pill bug walks back under the brown leaf.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What is different when the pill bug curls up?",
        "listenFor": "Its legs are tucked inside and its hard back faces outward."
      },
      "visual": {
        "page": 5,
        "prompt": "Where have the legs gone?",
        "lookFor": "Inside the curled body, not detached or vanished."
      }
    },
    "levelRationale": "Short present-tense sentences with changing subjects and simple cause/consequence. Soft/hard and curling require a modest contrast beyond A.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "b",
        "sound": "b",
        "word": "bug",
        "model": "Say bug. Listen for /b/, then find b in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "bug",
          "legs",
          "back"
        ],
        "model": "Blend bug: /b/ /ʌ/ /g/; legs: /l/ /ɛ/ /g/ /z/; back: /b/ /æ/ /k/. Final s spells /z/ in legs; ck spells /k/ in back. Frequent-word support: Read its as /ɪ/ /t/ /s/ with no apostrophe. In the, th spells /ð/; model its natural sentence vowel, often /ə/."
      },
      "highFrequencyWords": [
        "its",
        "the"
      ],
      "languagePrep": [
        {
          "word": "curls",
          "meaning": "bends into a round shape"
        },
        {
          "word": "soft",
          "meaning": "not hard"
        }
      ],
      "connectedReading": "Read the sequence and explain the change from walking to a ball and back.",
      "fluency": "Reread pages 4–8 with a brief pause after We wait."
    },
    "reviewedTextFingerprint": "fnv1a64:e6dd5e918b608896",
    "reviewedManuscriptSha256": "6e4bfa799888166213e146ce0217cf613a7bbc3ae5961ba939ef2aed950e9400",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-04",
    "number": 4,
    "title": "Dot’s Paper Chain",
    "type": "fiction",
    "appLevel": "B",
    "level": "B",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-SAM"
      ],
      "storySpine": "Dot wants a paper chain across the playhouse window, but separate rings fall apart; she threads each new strip through the last ring.",
      "failedAttempt": "She lifts a row of separate closed rings and the other rings stay on the table.",
      "turn": "Sam holds an open strip through a closed ring so Dot can see how they connect.",
      "resolution": "Dot remakes the rings into one hanging chain; the extra yellow ring becomes Sam’s bracelet."
    },
    "setting": "The playroom craft table stands beside a low wooden playhouse window.",
    "props": [
      "Eight pre-cut strips: four red and four blue",
      "Glue stick",
      "Low playhouse window with two pegs",
      "One extra yellow strip"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot lifts one end of the red-and-blue linked paper chain beside the low playhouse window, with Sam holding the other end. Exactly eight alternating rings, four of each color; the separate yellow strip lies on the table beside the glue stick.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dot makes rings for the window.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Dot closes a red paper strip into a ring with glue. Exact state: First of eight red/blue rings; yellow spare flat.",
        "imageAlt": "Dot closes a red paper strip into a ring while Sam watches.",
        "state": "First of eight red/blue rings; yellow spare flat.",
        "pageDescription": "Dot closes a red paper strip into a ring while Sam watches.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "She puts the rings in a row.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Eight separate rings lie in a red-blue row on the table. Exact state: No rings linked yet.",
        "imageAlt": "Dot arranges eight separate red and blue rings in a row.",
        "state": "No rings linked yet.",
        "pageDescription": "Dot arranges eight separate red and blue rings in a row.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dot lifts one.\nThe rest stay on the table.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Dot lifts the end red ring while seven separate rings remain below. Exact state: Failed lift; no phantom links.",
        "imageAlt": "Dot lifts one red ring while seven rings stay on the table.",
        "state": "Failed lift; no phantom links.",
        "pageDescription": "Dot lifts one red ring while seven rings stay on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Sam puts a strip through a ring.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Sam holds a reopened blue strip through Dot’s red ring. Exact state: One blue ring opened at glued seam; six other rings separate.",
        "imageAlt": "Sam threads a blue strip through the red ring that Dot holds.",
        "state": "One blue ring opened at glued seam; six other rings separate.",
        "pageDescription": "Sam threads a blue strip through the red ring that Dot holds.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dot joins the ends.\nNow two rings hang together.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Dot presses the blue strip’s ends together around the red ring. Exact state: Two truly interlocked loops; six waiting.",
        "imageAlt": "Dot joins the blue strip into a ring linked to Sam’s red ring.",
        "state": "Two truly interlocked loops; six waiting.",
        "pageDescription": "Dot joins the blue strip into a ring linked to Sam’s red ring.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "She opens each ring and links it.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Dot adds another reopened ring to the growing chain. Exact state: Work progresses red-blue; no cuts or tools.",
        "imageAlt": "Dot adds a red ring to the chain that Sam holds.",
        "state": "Work progresses red-blue; no cuts or tools.",
        "pageDescription": "Dot adds a red ring to the chain that Sam holds.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The chain hangs across the window.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. The eight linked rings hang between the two low pegs. Exact state: Four red and four blue loops; all linked in order.",
        "imageAlt": "Dot and Sam look at the red-and-blue chain hanging across the window.",
        "state": "Four red and four blue loops; all linked in order.",
        "pageDescription": "Dot and Sam look at the red-and-blue chain hanging across the window.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Sam makes a yellow ring.\nIt fits his wrist!",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The playroom craft table stands beside a low wooden playhouse window. Sam wears the extra yellow paper ring while Dot looks at the chain. Exact state: Eight-ring chain intact; one yellow bracelet.",
        "imageAlt": "Sam shows his yellow paper bracelet beside the hanging chain.",
        "state": "Eight-ring chain intact; one yellow bracelet.",
        "pageDescription": "Sam shows his yellow paper bracelet beside the hanging chain.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What made the separate rings become a chain?",
        "listenFor": "Each open strip went through the previous ring before its ends were joined."
      },
      "visual": {
        "page": 5,
        "prompt": "How are the two rings held together?",
        "lookFor": "One loop passes through the other; edges are not simply touching."
      }
    },
    "levelRationale": "Two short lines per page, limited dialogue-free present narration, and a concrete failed attempt/repair. Connective meaning develops through pictured loop geometry.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ch",
        "sound": "tʃ",
        "word": "chain",
        "model": "Say chain. Listen for /tʃ/, then find ch in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "Dot",
          "ends",
          "links"
        ],
        "model": "Blend Dot: /d/ /ɑ/ /t/; ends: /ɛ/ /n/ /d/ /z/; links: /l/ /ɪ/ /ŋ/ /k/ /s/. Hear /ŋ/ /k/ together in nk; final s sounds different in ends and links. Frequent-word support: In she, sh spells /ʃ/ and e spells /iː/. Explicitly model one as /wʌn/; its spelling is unusual. In two, w is silent and o spells /uː/."
      },
      "highFrequencyWords": [
        "she",
        "one",
        "two"
      ],
      "languagePrep": [
        {
          "word": "links",
          "meaning": "joins together"
        },
        {
          "word": "wrist",
          "meaning": "the joint beside your hand"
        }
      ],
      "connectedReading": "Read the failed lift and the repair, then explain why the second lift works.",
      "fluency": "Reread pages 3 and 5 to contrast stay with hang."
    },
    "reviewedTextFingerprint": "fnv1a64:d214ec5ff0b0dac8",
    "reviewedManuscriptSha256": "93b19a9e366ee401ca3fc73e0454b28ae4e6fe59fc8c549eabd7b438f6373fc5",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-05",
    "number": 5,
    "title": "Hooks and Loops",
    "type": "nonfiction",
    "appLevel": "C",
    "level": "B",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [
        "SMALL-SAM"
      ],
      "topicQuestion": "How does this strap hold a bag shut?",
      "progression": "Whole strap to two surfaces, their close-up connection, release and useful closure.",
      "synthesis": "Hooks catch loops to close the strap; pulling separates them again.",
      "scienceSources": [
        {
          "title": "VELCRO Companies: Hook and Loop",
          "url": "https://www.velcro.com/hook-and-loop/",
          "evidence": "Small hooks catch loops; pulling separates the sides. Generic technology, no brand claim in child text.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "Sam sits beside the oak playroom bench with one small blue shoulder bag.",
    "props": [
      "Blue bag with one wide red hook-and-loop flap strap",
      "Same enlarged hook and loop samples as explanatory close-ups"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam holds the blue bag with its wide red hook-and-loop strap partly open. Clearly show the two fabric contact surfaces and one book nearby. Keep the fastening mechanism ordinary, with no teeth, zipper, metal buckle or ripping cloth.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam shuts the flap on his bag.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Sam folds the blue bag’s flap down. Exact state: Red strap still unfastened.",
        "imageAlt": "Sam lowers the flap on his blue bag.",
        "state": "Red strap still unfastened.",
        "pageDescription": "Sam lowers the flap on his blue bag.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "He presses the strap.\nThe flap stays shut.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Sam presses the red strap onto its matching patch. Exact state: One closed fastener.",
        "imageAlt": "Sam presses the red strap against the front of his bag.",
        "state": "One closed fastener.",
        "pageDescription": "Sam presses the red strap against the front of his bag.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "He pulls the strap.\nIt comes apart with a rip!",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Sam peels the strap upward. Exact state: Separation shown; fabric intact, not torn.",
        "imageAlt": "Sam pulls the red strap away from the bag.",
        "state": "Separation shown; fabric intact, not torn.",
        "pageDescription": "Sam pulls the red strap away from the bag.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "One side feels rough.\nLook at the tiny hooks.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. A close view shows curved hooks on the strap underside. Exact state: Explicit magnification; same material, no teeth.",
        "imageAlt": "Sam holds the strap open. A magnified view shows tiny hooks rising from the fabric.",
        "state": "Explicit magnification; same material, no teeth.",
        "pageDescription": "Sam holds the strap open. A magnified view shows tiny hooks rising from the fabric.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "The other side has lots of loops.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. A close view shows soft loops on the bag patch. Exact state: Loops upright and connected to backing.",
        "imageAlt": "Sam holds the strap open. A magnified view shows small loops on the patch at the front of his bag.",
        "state": "Loops upright and connected to backing.",
        "pageDescription": "Sam holds the strap open. A magnified view shows small loops on the patch at the front of his bag.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Press the sides together.\nThe hooks catch the loops.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Magnified hooks catch loops where the two surfaces meet. Exact state: Interlocking geometry, no glue.",
        "imageAlt": "Sam presses the strap closed. A magnified view shows hooks catching loops.",
        "state": "Interlocking geometry, no glue.",
        "pageDescription": "Sam presses the strap closed. A magnified view shows hooks catching loops.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Many little catches hold the strap shut.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. The red strap lies closed across the blue bag. Exact state: Return to ordinary scale.",
        "imageAlt": "Sam holds his bag with its red strap closed.",
        "state": "Return to ordinary scale.",
        "pageDescription": "Sam holds his bag with its red strap closed.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Pulling bends the hooks away from the loops.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Magnified peeling shows hooks bending free of loops. Exact state: Both backings intact.",
        "imageAlt": "Sam peels back the strap. A magnified view shows hooks bending away from loops.",
        "state": "Both backings intact.",
        "pageDescription": "Sam peels back the strap. A magnified view shows hooks bending away from loops.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "Sam opens the bag and adds his book.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Sam puts one green book into the open blue bag. Exact state: Book introduced visibly; bag otherwise empty.",
        "imageAlt": "Sam puts a green book into his open blue bag.",
        "state": "Book introduced visibly; bag otherwise empty.",
        "pageDescription": "Sam puts a green book into his open blue bag.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Press the strap again.\nThe book stays inside.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam sits beside the oak playroom bench with one small blue shoulder bag. Sam presses the strap closed over the bag holding the book. Exact state: Same closure answers opening mechanism question.",
        "imageAlt": "Sam presses the red strap closed over his bag.",
        "state": "Same closure answers opening mechanism question.",
        "pageDescription": "Sam presses the red strap closed over his bag.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How can the same strap hold shut and open again?",
        "listenFor": "Hooks catch loops when pressed, then release when peeled."
      },
      "visual": {
        "page": 6,
        "prompt": "What is holding the two surfaces together?",
        "lookFor": "Curved hooks caught through soft loops."
      }
    },
    "levelRationale": "Print fits instructional B, but changing scale, part-to-whole mechanism, catch used as a noun, and reversible cause support App C.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "oo",
        "sound": "ʊ",
        "word": "book",
        "model": "Say book. Listen for /ʊ/, then find oo in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "shut",
          "strap",
          "book"
        ],
        "model": "Blend shut: /ʃ/ /ʌ/ /t/; strap: /s/ /t/ /r/ /æ/ /p/; book: /b/ /ʊ/ /k/. Point to sh for /ʃ/ and oo for /ʊ/. Frequent-word support: Explicitly model one as /wʌn/; its spelling is unusual. In the, th spells /ð/; model its natural sentence vowel, often /ə/. In he, e spells /iː/."
      },
      "highFrequencyWords": [
        "one",
        "the",
        "he"
      ],
      "languagePrep": [
        {
          "word": "hooks",
          "meaning": "little curved pieces that catch"
        },
        {
          "word": "loops",
          "meaning": "small curved threads with spaces inside"
        },
        {
          "word": "strap",
          "meaning": "a long narrow band"
        }
      ],
      "connectedReading": "Read every word before studying the close-up, then explain how pressing and pulling differ.",
      "fluency": "Reread paired action/result sentences in pages 2–3 and 10."
    },
    "reviewedTextFingerprint": "fnv1a64:51a21f1480d1453f",
    "reviewedManuscriptSha256": "69ee2a0ca97f802897eac4eb536e411367ac91053acda359e58b254d7dc4a4f5",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-06",
    "number": 6,
    "title": "Where Do the Drops Go?",
    "type": "nonfiction",
    "appLevel": "C",
    "level": "B",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-DAD"
      ],
      "topicQuestion": "Do these two fabrics do the same thing with water?",
      "progression": "Compare equal drops on an umbrella and towel, then connect each result to a useful job.",
      "synthesis": "The umbrella sheds these drops; the cotton towel absorbs them.",
      "scienceSources": [
        {
          "title": "American Chemical Society: Put Your Fabric to the Test",
          "url": "https://www.acs.org/education/celebrating-chemistry-editions/2022-ncw/put-your-fabric-to-the-test.html",
          "evidence": "Cotton towels absorb water; the selected umbrella fabric repels drops. Observation concerns these specimens, not every fabric.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "A covered porch in daylight; a low test table stands over a shallow tray.",
    "props": [
      "One blue nylon umbrella held open over the tray by Dad",
      "One dry yellow cotton towel",
      "One clear dropper",
      "One small cup of water"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot holds the clear dropper above the yellow cotton towel beside the open blue nylon umbrella supported by Dad over the low tray. One rounded water bead remains on the umbrella; one darker wet patch marks the towel. Keep two different surface responses readable.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dot has two fabrics to test.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dot sits with a yellow towel and Dad’s open blue umbrella. Exact state: Both surfaces dry; tray below.",
        "imageAlt": "Dot sits beside a yellow towel, a dropper and a cup of water. Dad holds a blue umbrella over a tray.",
        "state": "Both surfaces dry; tray below.",
        "pageDescription": "Dot sits beside a yellow towel, a dropper and a cup of water. Dad holds a blue umbrella over a tray.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "She puts a drop on the umbrella.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dot uses the dropper on one blue umbrella panel. Exact state: One rounded drop; Dad supports umbrella.",
        "imageAlt": "Dot puts a drop of water on the blue umbrella held by Dad.",
        "state": "One rounded drop; Dad supports umbrella.",
        "pageDescription": "Dot puts a drop of water on the blue umbrella held by Dad.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The drop sits on top.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. A close view shows the water drop resting on the umbrella fabric. Exact state: No absorption mark.",
        "imageAlt": "A rounded water bead rests on the top of the blue umbrella.",
        "state": "No absorption mark.",
        "pageDescription": "A rounded water bead rests on the top of the blue umbrella.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Dad tips the umbrella.\nThe drop rolls into the tray.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dad tilts the umbrella slightly and the drop slides down. Exact state: One drop reaches tray; no rain yet.",
        "imageAlt": "Dad tilts the blue umbrella, and a drop falls into the tray.",
        "state": "One drop reaches tray; no rain yet.",
        "pageDescription": "Dad tilts the blue umbrella, and a drop falls into the tray.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dot puts a drop on the towel.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dot adds one equal-sized drop to the yellow cotton towel. Exact state: Towel flat and otherwise dry.",
        "imageAlt": "Dot puts one drop on the yellow towel. A small bead remains in the tray.",
        "state": "Towel flat and otherwise dry.",
        "pageDescription": "Dot puts one drop on the yellow towel. A small bead remains in the tray.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The towel soaks it up.\nA wet patch spreads.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. A darker patch spreads around the drop on the towel. Exact state: No puddle beneath towel.",
        "imageAlt": "A darker wet patch spreads across the yellow towel.",
        "state": "No puddle beneath towel.",
        "pageDescription": "A darker wet patch spreads across the yellow towel.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The cloth holds the water now.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dot looks closely at the damp patch. Exact state: Water absorbed, not magically gone.",
        "imageAlt": "Dot points at the towel's wet patch while Dad holds the closed umbrella.",
        "state": "Water absorbed, not magically gone.",
        "pageDescription": "Dot points at the towel's wet patch while Dad holds the closed umbrella.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "This umbrella keeps rain off.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dad holds the blue umbrella over Dot during a light shower. Exact state: Brief outdoor demonstration; drops roll from edge.",
        "imageAlt": "Dad and Dot walk under the blue umbrella as rain falls around them.",
        "state": "Brief outdoor demonstration; drops roll from edge.",
        "pageDescription": "Dad and Dot walk under the blue umbrella as rain falls around them.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "This towel takes water in.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Back under the porch, Dot wipes water from the tray with the towel. Exact state: Existing wet patch remains; tray becomes dry.",
        "imageAlt": "Dot wipes the tray with the yellow towel while Dad holds the closed umbrella.",
        "state": "Existing wet patch remains; tray becomes dry.",
        "pageDescription": "Dot wipes the tray with the yellow towel while Dad holds the closed umbrella.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Different fabrics do different jobs.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A covered porch in daylight; a low test table stands over a shallow tray. Dot hangs the damp towel beside the dripping closed umbrella. Exact state: Two observed jobs compared; no universal fabric claim.",
        "imageAlt": "Dot hangs the damp yellow towel beside the dripping blue umbrella.",
        "state": "Two observed jobs compared; no universal fabric claim.",
        "pageDescription": "Dot hangs the damp yellow towel beside the dripping blue umbrella.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why is the towel useful for wiping the tray?",
        "listenFor": "It takes in water; the umbrella’s tested surface lets drops roll off."
      },
      "visual": {
        "page": 6,
        "prompt": "Where is the water on this page?",
        "lookFor": "In the towel’s growing damp patch."
      }
    },
    "levelRationale": "B-sized print supports App C comparative inference: drops persist in two different states and the final generalization is limited to tested fabrics.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "d",
        "sound": "d",
        "word": "drop",
        "model": "Say drop. Listen for /d/, then find d in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "drop",
          "wet",
          "cloth"
        ],
        "model": "Blend drop: /d/ /r/ /ɑ/ /p/; wet: /w/ /ɛ/ /t/; cloth: /k/ /l/ /ɔ/ /θ/. The two letters th spell /θ/. Cloth may use /ɑ/ in a U.S. accent with the cot–caught merger. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. In has, final s spells /z/. Read into in two parts, in-to; o in to can spell /uː/."
      },
      "highFrequencyWords": [
        "the",
        "has",
        "into"
      ],
      "languagePrep": [
        {
          "word": "fabrics",
          "meaning": "materials made from threads"
        },
        {
          "word": "soaks",
          "meaning": "takes liquid in"
        },
        {
          "word": "patch",
          "meaning": "one small area"
        }
      ],
      "connectedReading": "After reading, explain the two drops’ different paths using the printed action verbs.",
      "fluency": "Reread pages 8–10, emphasizing off, in and different."
    },
    "reviewedTextFingerprint": "fnv1a64:cc8c063fe31e4736",
    "reviewedManuscriptSha256": "b9b39f4f41514c56501d935676b1b6a3e1c4ab2a7c8430ecccea5c9bcc0b0558",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-07",
    "number": 7,
    "title": "The Pebble Pattern",
    "type": "fiction",
    "appLevel": "C",
    "level": "B",
    "readingBandProfile": "standard",
    "interestAge": "4–8",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-PUP"
      ],
      "storySpine": "Dot makes a pebble-and-leaf border, but Sam’s ball scatters one section; he uses the intact repeat to repair it.",
      "failedAttempt": "Sam puts the scattered pieces back in random order, leaving two pebbles together.",
      "turn": "Dot points to the undisturbed pebble-leaf repeat.",
      "resolution": "Sam restores the border and moves the ball game onto the grass."
    },
    "setting": "A dry garden path beside a small square flower bed in afternoon light.",
    "props": [
      "Six smooth gray pebbles and six fallen brown leaves arranged as a border",
      "One blue rubber ball"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot kneels beside the square flower bed and its alternating six gray pebbles and six brown leaves. Sam and Pup watch one blue ball near the path corner. Establish the complete pattern and nearby game without scattering a second set of pieces.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dot makes a pattern around the flowers.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Dot places gray pebbles and brown leaves beside the square bed. Exact state: Alternating border; six of each available.",
        "imageAlt": "Dot places gray pebbles and brown leaves beside the square bed.",
        "state": "Alternating border; six of each available.",
        "pageDescription": "Dot places gray pebbles and brown leaves beside the square bed.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "A pebble. A leaf.\nA pebble. A leaf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. The view follows an intact alternating section. Exact state: Two complete repeat units visible.",
        "imageAlt": "The view follows an intact alternating section.",
        "state": "Two complete repeat units visible.",
        "pageDescription": "The view follows an intact alternating section.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Sam rolls a ball for Pup.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Sam rolls the blue ball toward Pup on the path. Exact state: Border intact; ball approaching corner.",
        "imageAlt": "Sam rolls the blue ball toward Pup on the path.",
        "state": "Border intact; ball approaching corner.",
        "pageDescription": "Sam rolls the blue ball toward Pup on the path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The ball hits the border.\nThree pieces scatter.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. The ball scatters two pebbles and one leaf from the corner. Exact state: Exactly three displaced pieces; nine remain.",
        "imageAlt": "The ball scatters two pebbles and one leaf from the corner.",
        "state": "Exactly three displaced pieces; nine remain.",
        "pageDescription": "The ball scatters two pebbles and one leaf from the corner.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dot stops.\nSam brings the pieces back.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Dot stops placing pieces while Sam collects the three displaced items. Exact state: Impact recognized; ball rests away from bed.",
        "imageAlt": "Dot stops placing pieces while Sam collects the three displaced items.",
        "state": "Impact recognized; ball rests away from bed.",
        "pageDescription": "Dot stops placing pieces while Sam collects the three displaced items.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "He puts two pebbles side by side.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Sam returns the pieces with two adjacent pebbles. Exact state: Wrong order shown clearly, no missing pieces.",
        "imageAlt": "Sam returns the pieces with two adjacent pebbles.",
        "state": "Wrong order shown clearly, no missing pieces.",
        "pageDescription": "Sam returns the pieces with two adjacent pebbles.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dot points to the part still in place.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Dot points to an undisturbed pebble-leaf pair. Exact state: Clue precedes repair.",
        "imageAlt": "Dot points to an undisturbed pebble-leaf pair.",
        "state": "Clue precedes repair.",
        "pageDescription": "Dot points to an undisturbed pebble-leaf pair.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Sam follows the pattern.\nA pebble goes beside a leaf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Sam rearranges the corner to alternate pebble and leaf. Exact state: Six pebbles/six leaves restored.",
        "imageAlt": "Sam places a pebble beside a leaf to restore the pattern.",
        "state": "Six pebbles/six leaves restored.",
        "pageDescription": "Sam places a pebble beside a leaf to restore the pattern.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "The border matches all the way around.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Dot checks the complete alternating border with Sam. Exact state: No remaining damage or incorrect pair.",
        "imageAlt": "Dot and Sam check the completed alternating border.",
        "state": "No remaining damage or incorrect pair.",
        "pageDescription": "Dot and Sam check the completed alternating border.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Sam takes the ball to the grass.\nPup follows the ball.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A dry garden path beside a small square flower bed in afternoon light. Sam rolls the ball on the open lawn while Pup follows. Exact state: Border intact in background; changed game location earns ending.",
        "imageAlt": "Sam takes the blue ball onto the grass, and Pup follows.",
        "state": "Border intact in background; changed game location earns ending.",
        "pageDescription": "Sam takes the blue ball onto the grass, and Pup follows.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What helped Sam put the pieces back correctly?",
        "listenFor": "The intact part showed the repeat; he followed pebble then leaf."
      },
      "visual": {
        "page": 6,
        "prompt": "What is different from Dot’s original pattern?",
        "lookFor": "Two pebbles are touching without a leaf between them."
      }
    },
    "levelRationale": "Brief B-contract lines carry a repeating unit, an error, a visual clue and a social repair. Tracking a rule rather than a single action earns App C.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "p",
        "sound": "p",
        "word": "pattern",
        "model": "Say pattern. Listen for /p/, then find p in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "Sam",
          "hits",
          "grass"
        ],
        "model": "Blend Sam: /s/ /æ/ /m/; hits: /h/ /ɪ/ /t/ /s/; grass: /g/ /r/ /æ/ /s/. Final ss spells one /s/ in grass. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. In to, o can spell /uː/; model the natural weaker vowel when reading a phrase. Read a naturally as /ə/ in these sentences; its letter name is /eɪ/."
      },
      "highFrequencyWords": [
        "the",
        "to",
        "a"
      ],
      "languagePrep": [
        {
          "word": "pattern",
          "meaning": "a part that repeats in order"
        },
        {
          "word": "border",
          "meaning": "an edge around something"
        },
        {
          "word": "matches",
          "meaning": "follows the same order here"
        }
      ],
      "connectedReading": "Read and retell the accident, wrong repair and useful clue without guessing words from the pattern picture.",
      "fluency": "Reread page 2 rhythmically, then read page 6 slowly enough to hear the mismatch."
    },
    "reviewedTextFingerprint": "fnv1a64:eb3a2980ac31c7fd",
    "reviewedManuscriptSha256": "3ea5a33b129d80734c8bd37b2f5ee6fd686e0b147acbaa2823ebd8cd8cbeb028",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-08",
    "number": 8,
    "title": "How a Bicycle Stops",
    "type": "nonfiction",
    "appLevel": "D",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-DAD"
      ],
      "topicQuestion": "How can a hand on the handlebar slow a wheel far below it?",
      "progression": "Follow a linked chain from lever through cable and arms to pads and rim, then release it.",
      "synthesis": "A squeeze at the lever pulls the cable, moving pads against the rim to slow the wheel.",
      "scienceSources": [
        {
          "title": "Park Tool: Linear Pull Brake Service",
          "url": "https://www.parktool.com/en-us/blog/repair-help/linear-pull-brake-service",
          "evidence": "Pulling the cable draws brake arms and pads to the wheel rim; pads contact the rim, not tire.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised.",
    "props": [
      "One red bicycle with black tires, silver rims, cable-operated linear-pull rim brakes and black pads",
      "Stable repair stand"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad, Sam and Dot examine the securely clamped red bicycle at the workshop doorway. Show the raised front wheel, silver rim, two black brake pads and a continuous cable from the handlebar lever. All hands stay clear of the spokes; no riding pose or disk rotor.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad spins the raised wheel. Sam watches it turn.\nHow can the handlebar help stop it?",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. Dad spins the bicycle’s raised front wheel while Sam watches the handlebar. Exact state: Bike firmly clamped; everyone’s fingers clear of spokes.",
        "imageAlt": "Dad and the children watch the raised front wheel of the bicycle.",
        "state": "Bike firmly clamped; everyone’s fingers clear of spokes.",
        "pageDescription": "Dad and the children watch the raised front wheel of the bicycle.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "This bicycle has rim brakes.\nTheir pads press against the metal rim around the wheel.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. A close view shows two black pads beside the silver wheel rim. Exact state: Pads clear of rim and rubber tire.",
        "imageAlt": "A close view shows two black pads beside the silver wheel rim.",
        "state": "Pads clear of rim and rubber tire.",
        "pageDescription": "A close view shows two black pads beside the silver wheel rim.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Sam squeezes the brake lever on the handlebar.\nWatch the cable move.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. Sam squeezes the lever while Dot follows the attached cable with her gaze. Exact state: Cable tension increases; continuous cable housing to brake.",
        "imageAlt": "Sam squeezes the brake lever while Dot watches the cable.",
        "state": "Cable tension increases; continuous cable housing to brake.",
        "pageDescription": "Sam squeezes the brake lever while Dot watches the cable.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The cable pulls the two brake arms inward.\nEach arm carries one pad.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. A close view shows the cable pulling the paired brake arms inward. Exact state: Same front-brake geometry and one pad on each arm.",
        "imageAlt": "A close view shows the cable pulling the paired brake arms inward.",
        "state": "Same front-brake geometry and one pad on each arm.",
        "pageDescription": "A close view shows the cable pulling the paired brake arms inward.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "The pads meet the rim.\nThey do not press on the tire.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. Both black pads contact the silver rim beneath the tire. Exact state: Pads correctly aligned; no disk rotor.",
        "imageAlt": "Both black pads contact the silver rim beneath the tire.",
        "state": "Pads correctly aligned; no disk rotor.",
        "pageDescription": "Both black pads contact the silver rim beneath the tire.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The rubbing pads slow the turning wheel.\nThis rubbing is called friction.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. The wheel slows while Sam holds the lever in. Exact state: No magic motion or detached pads; friction at both rim surfaces.",
        "imageAlt": "Two black brake pads press against the silver wheel rim as the wheel slows.",
        "state": "No magic motion or detached pads; friction at both rim surfaces.",
        "pageDescription": "Two black brake pads press against the silver wheel rim as the wheel slows.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Sam lets go of the lever.\nThe pads move away from the rim.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. Sam releases the lever and a small gap opens beside each pad. Exact state: Brake spring returns arms; cable relaxed.",
        "imageAlt": "Small gaps separate both black brake pads from the silver wheel rim.",
        "state": "Brake spring returns arms; cable relaxed.",
        "pageDescription": "Small gaps separate both black brake pads from the silver wheel rim.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Dad spins the wheel again.\nWith space beside the pads, it turns freely.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. Dad gives the wheel a second gentle spin. Exact state: Same stand and wheel; hands clear after spin.",
        "imageAlt": "Dad shows Sam and Dot the raised bicycle wheel turning freely.",
        "state": "Same stand and wheel; hands clear after spin.",
        "pageDescription": "Dad shows Sam and Dot the raised bicycle wheel turning freely.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "Dot squeezes the lever this time.\nThe cable pulls, the pads press, and the wheel slows.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. Dot operates the lever while Sam traces the visible route with a pointing hand. Exact state: No contact with moving parts.",
        "imageAlt": "Dot squeezes the bicycle brake lever while Dad and Sam watch.",
        "state": "No contact with moving parts.",
        "pageDescription": "Dot squeezes the bicycle brake lever while Dad and Sam watch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "A small squeeze starts a chain of actions.\nThe brake connects the hand to the wheel.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dad’s workshop doorway in daylight; a red bicycle is clamped securely in a repair stand with its front wheel raised. The stopped bicycle fills the scene with lever, cable and rim brake all visible. Exact state: Wheel stopped; mechanism connected; no arrows or embedded labels.",
        "imageAlt": "Dad points out the connected brake cable while Sam and Dot watch.",
        "state": "Wheel stopped; mechanism connected; no arrows or embedded labels.",
        "pageDescription": "Dad points out the connected brake cable while Sam and Dot watch.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Follow the squeeze. What happens between the lever and wheel?",
        "listenFor": "Lever pulls cable; arms bring pads to rim; friction slows wheel."
      },
      "visual": {
        "page": 5,
        "prompt": "Are the pads touching the tire or the rim?",
        "lookFor": "Pads contact the metal rim below the rubber tire."
      }
    },
    "levelRationale": "Compact C print carries a four-part mechanism, spatial reference and the new term friction. Repeated causal observation and release/retest make App D appropriate.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "wh",
        "sound": "w",
        "word": "wheel",
        "model": "Say wheel. Listen for /w/, then find wh in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "spins",
          "rim",
          "brake"
        ],
        "model": "Blend spins: /s/ /p/ /ɪ/ /n/ /z/; rim: /r/ /ɪ/ /m/; brake: /b/ /r/ /eɪ/ /k/. Final s spells /z/ in spins; a-e spells /eɪ/ in brake. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. In this, th spells /ð/. In they, th spells /ð/ and ey spells /eɪ/."
      },
      "highFrequencyWords": [
        "the",
        "this",
        "they"
      ],
      "languagePrep": [
        {
          "word": "rim",
          "meaning": "the metal edge inside a wheel’s tire"
        },
        {
          "word": "lever",
          "meaning": "a handle that moves a mechanism"
        },
        {
          "word": "friction",
          "meaning": "rubbing that resists movement"
        }
      ],
      "connectedReading": "Read the sequence, then trace the cause through the printed nouns lever, cable, pads and rim.",
      "fluency": "Reread page 9 in three linked phrases, pausing lightly between actions."
    },
    "reviewedTextFingerprint": "fnv1a64:4597c87925880bab",
    "reviewedManuscriptSha256": "7c61f65f376ca108146e25720f181d64d8e5c7400cc54dd6e91986744b599cbf",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-09",
    "number": 9,
    "title": "How Much Rain?",
    "type": "nonfiction",
    "appLevel": "D",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [
        "SMALL-DOT",
        "SMALL-DAD"
      ],
      "topicQuestion": "How can we compare the rain from two showers?",
      "progression": "Set up a level gauge, read one shower, empty it, read another and compare the example amounts.",
      "synthesis": "The second illustrated shower leaves more measured rain; emptying between readings keeps the comparison meaningful.",
      "scienceSources": [
        {
          "title": "National Weather Service: Rainfall Measuring Tips",
          "url": "https://www.weather.gov/ilx/swop-rainfall",
          "evidence": "Use an open site, a level gauge, and empty after a final reading before the next rainfall.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "One open garden plot away from the house and trees. The wooden post and holder stay fixed; the measuring tube lifts out for emptying.",
    "props": [
      "One clear, straight-sided removable measuring tube, open at the top and sealed at the bottom, on a fixed wooden-post holder. No funnel. Four equally spaced scale marks labelled 15, 10, 5 and 0, with mm above; zero meets the inner floor.",
      "One clipboard with two example readings, 5 and 10.",
      "One blue pencil."
    ],
    "coverBrief": "Clean bright outlined flat cartoon. Dot and Dad stand by the empty upright measuring tube. The accepted embedded scale has equally spaced 15, 10, 5 and 0 marks and mm; zero meets the inner floor. Dad points beside the level rim while Dot holds the clipboard.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Two showers can sound alike on a roof.\nDo they leave the same amount of rain?",
        "imageBrief": "Dot looks from the porch toward the empty tube in its fixed holder; no measurement has been made. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot and Dad look at roof drips beside an empty rain gauge in the open garden.",
        "state": "Dot looks from the porch toward the empty tube in its fixed holder; no measurement has been made.",
        "embeddedImageText": "mm 15 10 5 0",
        "pageDescription": "Dot and Dad look at roof drips beside an empty rain gauge in the open garden."
      },
      {
        "pageNumber": 2,
        "text": "A rain gauge catches water.\nMarks on its side show how much rain has fallen.",
        "imageBrief": "Dad shows Dot the empty tube. Its accepted embedded scale has equally spaced 15, 10, 5 and 0 marks, with zero at the inner floor. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot points to the marks on the empty rain gauge while Dad holds the clipboard.",
        "state": "Dad shows Dot the empty tube. Its accepted embedded scale has equally spaced 15, 10, 5 and 0 marks, with zero at the inner floor.",
        "embeddedImageText": "mm 15 10 5 0",
        "pageDescription": "Dot points to the marks on the empty rain gauge while Dad holds the clipboard."
      },
      {
        "pageNumber": 3,
        "text": "Dad fixes the gauge in an open place.\nTrees and roofs must not block the rain.",
        "imageBrief": "Dad secures the tube in its holder away from the house and trees; the open rim is unobstructed. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dad steadies the rain gauge on its post while Dot holds the clipboard.",
        "state": "Dad secures the tube in its holder away from the house and trees; the open rim is unobstructed.",
        "embeddedImageText": "mm 15 10 5 0",
        "pageDescription": "Dad steadies the rain gauge on its post while Dot holds the clipboard."
      },
      {
        "pageNumber": 4,
        "text": "The rim sits level.\nA tilted gauge would not collect rain in the same way.",
        "imageBrief": "Dot checks the level open rim beside Dad. The tube is vertical and empty. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot points along the level rim of the upright rain gauge.",
        "state": "Dot checks the level open rim beside Dad. The tube is vertical and empty.",
        "embeddedImageText": "mm 15 10 5 0",
        "pageDescription": "Dot points along the level rim of the upright rain gauge."
      },
      {
        "pageNumber": 5,
        "text": "Here is an example after one shower.\nThe gauge holds five millimeters of rain.",
        "imageBrief": "Close view of the gauge alone after the first shower; water is exactly at 5. These are illustrative readings, not reported real measurements. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "The rain gauge water reaches the five mark.",
        "state": "Close view of the gauge alone after the first shower; water is exactly at 5. These are illustrative readings, not reported real measurements.",
        "embeddedImageText": "mm 15 10 5 0",
        "pageDescription": "The rain gauge water reaches the five mark."
      },
      {
        "pageNumber": 6,
        "text": "Dot records five. Then she empties the gauge.\nThe next shower needs an empty start.",
        "imageBrief": "Dot lifts the tube out and pours the last drops from its lowered open rim into the garden. The holder stays fixed. Dad holds the first recorded reading, 5. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot tips the rain gauge to pour out the last drops. Dad holds the recorded five.",
        "state": "Dot lifts the tube out and pours the last drops from its lowered open rim into the garden. The holder stays fixed. Dad holds the first recorded reading, 5.",
        "embeddedImageText": "mm 15 10 5 0; 5",
        "pageDescription": "Dot tips the rain gauge to pour out the last drops. Dad holds the recorded five."
      },
      {
        "pageNumber": 7,
        "text": "After the next shower, the example gauge holds ten millimeters.\nDot records ten.",
        "imageBrief": "After another shower, the refitted tube holds water exactly at 10. Dot records 10; the earlier 5 was emptied and is not carried over. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot records ten while the gauge water reaches the ten mark.",
        "state": "After another shower, the refitted tube holds water exactly at 10. Dot records 10; the earlier 5 was emptied and is not carried over.",
        "embeddedImageText": "mm 15 10 5 0; 5 10",
        "pageDescription": "Dot records ten while the gauge water reaches the ten mark."
      },
      {
        "pageNumber": 8,
        "text": "Ten is more than five.\nThe second shower left more rain in this gauge.",
        "imageBrief": "The tube remains at 10 while Dot compares both records and points to the earlier 5. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot points between her recorded amounts, five and ten, beside the ten-mark gauge.",
        "state": "The tube remains at 10 while Dot compares both records and points to the earlier 5.",
        "embeddedImageText": "mm 15 10 5 0; 5 10",
        "pageDescription": "Dot points between her recorded amounts, five and ten, beside the ten-mark gauge."
      },
      {
        "pageNumber": 9,
        "text": "Without emptying the gauge, the showers would mix.\nWe could not read the second shower by itself.",
        "imageBrief": "Explanatory reset view: the tube is empty and Dad has the two readings and one blue pencil. This is not a third measurement. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot indicates the empty gauge while Dad holds the two recorded amounts, five and ten.",
        "state": "Explanatory reset view: the tube is empty and Dad has the two readings and one blue pencil. This is not a third measurement.",
        "embeddedImageText": "mm 15 10 5 0; 5 10",
        "pageDescription": "Dot indicates the empty gauge while Dad holds the two recorded amounts, five and ten."
      },
      {
        "pageNumber": 10,
        "text": "The roof gave us a sound.\nThe gauge gave us amounts we could compare.",
        "imageBrief": "Dot closes the clipboard beside the empty refitted gauge; roof drips fall far away on the left. Clean bright outlined flat cartoon, preserving the accepted scale and gauge master.",
        "imageAlt": "Dot holds her closed clipboard beside the empty gauge as she and Dad look toward the roof drips.",
        "state": "Dot closes the clipboard beside the empty refitted gauge; roof drips fall far away on the left.",
        "embeddedImageText": "mm 15 10 5 0",
        "pageDescription": "Dot holds her closed clipboard beside the empty gauge as she and Dad look toward the roof drips."
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did Dot empty the gauge after the first reading?",
        "listenFor": "So the next amount represented only the second shower."
      },
      "visual": {
        "page": 7,
        "prompt": "What must the water level line up with?",
        "lookFor": "The ten-millimeter mark on the same upright gauge."
      }
    },
    "levelRationale": "An explicit two-event comparison requires measurement vocabulary, retained numbers and a counterfactual about mixed readings, within short C sentences.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "sh",
        "sound": "ʃ",
        "word": "shower",
        "model": "Say shower. Listen for /ʃ/, then find sh in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "rain",
          "rim",
          "ten"
        ],
        "model": "Blend rain: /r/ /eɪ/ /n/; rim: /r/ /ɪ/ /m/; ten: /t/ /ɛ/ /n/. Point to ai for /eɪ/ in rain. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. Explicitly model one as /wʌn/; its spelling is unusual. In two, w is silent and o spells /uː/."
      },
      "highFrequencyWords": [
        "the",
        "one",
        "two"
      ],
      "languagePrep": [
        {
          "word": "gauge",
          "meaning": "a tool for measuring an amount"
        },
        {
          "word": "level",
          "meaning": "flat rather than tilted here"
        },
        {
          "word": "millimeters",
          "meaning": "small units of length used for the rain depth"
        }
      ],
      "connectedReading": "Read the two measurements and explain which shower left more, using the text rather than a guessed picture height.",
      "fluency": "Reread pages 5–8 with clear pauses after each measurement."
    },
    "reviewedTextFingerprint": "fnv1a64:480af6bb285e2d8b",
    "reviewedManuscriptSha256": "64335d1768abb19bd8fd92eafe0a3a9beda7050e88a75ea38a45ae2cd7983911",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-10",
    "number": 10,
    "title": "A Weaverbird Builds",
    "type": "nonfiction",
    "appLevel": "D",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [],
      "topicQuestion": "How can a bird make a hanging nest from grass?",
      "progression": "Material gathering, attachment, interweaving, enclosed form and lower entrance.",
      "synthesis": "The interwoven strips form a nest attached to the branch with an entrance below.",
      "scienceSources": [
        {
          "title": "Los Angeles Zoo: Black-Headed Weaver",
          "url": "https://lazoo.org/explore-your-zoo/our-animals/birds/black-headed-weaver/",
          "evidence": "Ploceus cucullatus males construct hanging woven grass nests; feet and beak secure strips; entrance below.",
          "checked": "2026-10-28"
        },
        {
          "title": "Fife Zoo: Village Weaver",
          "url": "https://www.fifezoo.org/village-weaver",
          "evidence": "Breeding male has black head, yellow body; woven rounded nest with bottom entrance.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season.",
    "props": [
      "One male village weaver, Ploceus cucullatus, with black head, yellow body, brown-black patterned wings and red eyes",
      "One forked slender branch",
      "Fresh green grass strips",
      "One female of the same species at the end"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The male village weaver grips a forked branch while threading one fresh grass strip through a partly woven hanging nest. Breeding plumage matches Ploceus cucullatus. Keep an opening underneath and a visible branch attachment, not a nest floating beside the branch.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "A village weaver grips a branch.\nThere is no nest here yet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. A male village weaver clings to a slender forked branch above grass. Exact state: No nest; breeding plumage fixed.",
        "imageAlt": "A male village weaver clings to a slender forked branch above grass.",
        "state": "No nest; breeding plumage fixed.",
        "pageDescription": "A male village weaver clings to a slender forked branch above grass.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "The male bird collects long strips of grass.\nHe carries them in his beak.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. The weaver holds one long green strip in his beak. Exact state: Same tree behind; no tools or hands.",
        "imageAlt": "The weaver holds one long green strip in his beak.",
        "state": "Same tree behind; no tools or hands.",
        "pageDescription": "The weaver holds one long green strip in his beak.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "He works the first strips around the branch.\nHis beak and feet hold them in place.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. The weaver threads green strips securely around the fork. Exact state: Initial attachment firmly touches branch.",
        "imageAlt": "The weaver threads green strips securely around the fork.",
        "state": "Initial attachment firmly touches branch.",
        "pageDescription": "The weaver threads green strips securely around the fork.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "More strips pass over and under one another.\nThis is weaving.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. Close view of the bird guiding a strip through earlier strips. Exact state: Visible interlacing; not glued strands.",
        "imageAlt": "Close view of the bird guiding a strip through earlier strips.",
        "state": "Visible interlacing; not glued strands.",
        "pageDescription": "Close view of the bird guiding a strip through earlier strips.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "The woven shape grows below the branch.\nEach new strip joins the nest already there.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. A partly woven rounded shell hangs from the branch. Exact state: Early shell with large gaps; gradual growth.",
        "imageAlt": "A partly woven rounded shell hangs from the branch.",
        "state": "Early shell with large gaps; gradual growth.",
        "pageDescription": "A partly woven rounded shell hangs from the branch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The bird pulls loose ends through the weave.\nThe strips hold one another.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. The weaver pulls one loose grass end through the nest wall. Exact state: Same developing shell, no second nest.",
        "imageAlt": "The weaver pulls one loose grass end through the nest wall.",
        "state": "Same developing shell, no second nest.",
        "pageDescription": "The weaver pulls one loose grass end through the nest wall.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "A rounded wall now hangs from the branch.\nAn opening remains underneath.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. The nearly finished nest hangs with a clear downward entrance. Exact state: No entrance on top or side.",
        "imageAlt": "A rounded green nest hangs from the branch with an opening underneath.",
        "state": "No entrance on top or side.",
        "pageDescription": "A rounded green nest hangs from the branch with an opening underneath.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The entrance leads up into the nest.\nThe bird can cling below it.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. The male clings below the finished nest beside its entrance. Exact state: Nest empty; no eggs without female event.",
        "imageAlt": "The male weaver clings below the nest entrance.",
        "state": "Nest empty; no eggs without female event.",
        "pageDescription": "The male weaver clings below the nest entrance.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "A female comes to inspect the nest.\nShe may accept it or choose another.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. A female village weaver peers toward the entrance while the male stays nearby. Exact state: No invented guaranteed acceptance or immediate chicks.",
        "imageAlt": "A female village weaver looks toward the nest entrance while the male waits nearby.",
        "state": "No invented guaranteed acceptance or immediate chicks.",
        "pageDescription": "A female village weaver looks toward the nest entrance while the male waits nearby.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "A beak, two feet, and many grass strips make this hanging shelter.\nThe weave holds the shape.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One leafy tree beside grass in sub-Saharan Africa during the village weaver’s breeding season. The completed woven nest hangs from its original branch with the male beside it. Exact state: Same nest and lower entrance; useful synthesis rather than universal claim.",
        "imageAlt": "The male weaver perches beside the completed hanging nest.",
        "state": "Same nest and lower entrance; useful synthesis rather than universal claim.",
        "pageDescription": "The male weaver perches beside the completed hanging nest.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What holds the grass strips together in the nest?",
        "listenFor": "They pass around and through other strips; the nest is woven and attached to the branch."
      },
      "visual": {
        "page": 7,
        "prompt": "Where is the way into this nest?",
        "lookFor": "An opening underneath, leading up into the enclosed chamber."
      }
    },
    "levelRationale": "Close construction steps, growth over time and specialized weaving/entrance vocabulary require linked spatial explanation beyond App C, while print remains compact.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "w",
        "sound": "w",
        "word": "weave",
        "model": "Say weave. Listen for /w/, then find w in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "nest",
          "strips",
          "feet"
        ],
        "model": "Blend nest: /n/ /ɛ/ /s/ /t/; strips: /s/ /t/ /r/ /ɪ/ /p/ /s/; feet: /f/ /iː/ /t/. Keep the consonants clear without adding extra vowel sounds; ee spells /iː/. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. In he, e spells /iː/. Explicitly model one as /wʌn/; its spelling is unusual."
      },
      "highFrequencyWords": [
        "the",
        "he",
        "one"
      ],
      "languagePrep": [
        {
          "word": "weaving",
          "meaning": "passing strips over and under one another"
        },
        {
          "word": "inspect",
          "meaning": "look closely to check"
        },
        {
          "word": "shelter",
          "meaning": "a place that gives protection"
        }
      ],
      "connectedReading": "Read how one strip becomes part of a whole nest; explain why these pages need this order.",
      "fluency": "Reread pages 3–6 in smooth action phrases, slowing to clarify over and under."
    },
    "reviewedTextFingerprint": "fnv1a64:1efc4b3863027c47",
    "reviewedManuscriptSha256": "83eb157020172f7d952c0d9762e698e6ab30bf1585d47ba51b7478d13c63985e",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-11",
    "number": 11,
    "title": "The Game That Would Not End",
    "type": "fiction",
    "appLevel": "D",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT"
      ],
      "storySpine": "Sam wants to play his new board game, but a backward arrow sends both counters around the same loop; he and Dot trace and repair the route.",
      "failedAttempt": "Sam rolls again, expecting luck to reach the finish, but returns to the same space.",
      "turn": "Dot traces the route without rolling and discovers the arrow points into the loop.",
      "resolution": "They turn the arrow, restart equally and finish a fair game; Sam asks for a rematch."
    },
    "setting": "Sam and Dot sit at the oak playroom table with a homemade board game.",
    "props": [
      "One cardboard path with twelve round spaces and start/finish pictures, no written labels",
      "One removable curved arrow at the fork after space eight",
      "Red and blue counters",
      "One dot die"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot study the same twelve-space board game from opposite sides of the low table. Dot traces the fork while Sam holds the loose direction arrow. Preserve the loop back from space eight to five and the other branch to the picnic finish; no generated numbers or extra counters.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam has made a board game.\n“First to the picnic wins,” he says, setting down two counters.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Sam places red and blue counters at the start of a homemade path. Exact state: Twelve-space route; fork at eight; picnic finish at twelve.",
        "imageAlt": "Sam places red and blue counters at the start of a homemade path.",
        "state": "Twelve-space route; fork at eight; picnic finish at twelve.",
        "pageDescription": "Sam places red and blue counters at the start of a homemade path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Dot rolls and follows the path.\nAt the fork, an arrow sends her counter around a bend.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Dot moves the blue counter from the fork onto a curved return path. Exact state: Arrow points back to space five, not finish branch.",
        "imageAlt": "Dot moves the blue counter from the fork onto a curved return path.",
        "state": "Arrow points back to space five, not finish branch.",
        "pageDescription": "Dot moves the blue counter from the fork onto a curved return path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "“Back here?” Dot asks.\nHer counter has returned to a space she passed before.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Dot’s counter sits again at space five while she points toward the fork. Exact state: Loop visible; Sam’s red counter approaching it.",
        "imageAlt": "Dot’s counter sits again at space five while she points toward the fork.",
        "state": "Loop visible; Sam’s red counter approaching it.",
        "pageDescription": "Dot’s counter sits again at space five while she points toward the fork.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Sam reaches the same arrow.\nHis counter goes around the bend and comes back too.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Sam moves the red counter into the same return route. Exact state: Both counters trapped by rule, not cheating.",
        "imageAlt": "Sam moves the red counter into the same return route.",
        "state": "Both counters trapped by rule, not cheating.",
        "pageDescription": "Sam moves the red counter into the same return route.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "“I need a bigger roll,” Sam says.\nHe rolls again, but the path brings him back.",
        "imageBrief": "Sam shows a die roll of six while both counters rest at the fifth yellow space.",
        "imageAlt": "Sam shows a die roll of six while both counters rest at the fifth yellow space.",
        "state": "Sam shows a die roll of six while both counters rest at the fifth yellow space.",
        "pageDescription": "Sam shows a die roll of six while both counters rest at the fifth yellow space.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Dot puts the die down.\n“Let’s follow the path with a finger instead.”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Dot places the die aside and starts tracing the path. Exact state: Counters stay where they were.",
        "imageAlt": "Dot places the die aside and starts tracing the path.",
        "state": "Counters stay where they were.",
        "pageDescription": "Dot places the die aside and starts tracing the path.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Her finger reaches the arrow and turns back.\nThe other branch leads straight to the picnic.",
        "imageBrief": "Dot points to the fork as she checks the two possible routes.",
        "imageAlt": "Dot points to the fork as she checks the two possible routes.",
        "state": "Dot points to the fork as she checks the two possible routes.",
        "pageDescription": "Dot points to the fork as she checks the two possible routes.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Sam turns the loose arrow.\n“Try that.” Dot’s finger follows the new direction to the finish.",
        "imageBrief": "Sam turns the purple arrow toward the four final yellow spaces.",
        "imageAlt": "Sam turns the purple arrow toward the four final yellow spaces.",
        "state": "Sam turns the purple arrow toward the four final yellow spaces.",
        "pageDescription": "Sam turns the purple arrow toward the four final yellow spaces.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "They put both counters back at the start.\nThis time, the same rules can lead either player to the picnic.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Both counters restart side by side after the correction. Exact state: No player keeps an unfair lead.",
        "imageAlt": "Both counters restart side by side after the correction.",
        "state": "No player keeps an unfair lead.",
        "pageDescription": "Both counters restart side by side after the correction.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Dot reaches the picnic first.\nSam slides his counter back to the start. “Again?”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot sit at the oak playroom table with a homemade board game. Dot’s blue counter rests at the picnic while Sam sets his red counter at the start. Exact state: Completed fair game, invitation earned by repaired rule.",
        "imageAlt": "Dot’s blue counter rests at the picnic while Sam sets his red counter at the start.",
        "state": "Completed fair game, invitation earned by repaired rule.",
        "pageDescription": "Dot’s blue counter rests at the picnic while Sam sets his red counter at the start.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why could a bigger roll not fix the first game?",
        "listenFor": "The arrow always sent counters back; the route, not the die, needed changing."
      },
      "visual": {
        "page": 7,
        "prompt": "Which branch would let a player finish?",
        "lookFor": "The forward branch toward the picnic, rather than the return loop."
      }
    },
    "levelRationale": "Varied dialogue and a fair diagram clue sustain a ten-step causal investigation. Reader must reject a luck explanation and track a changed rule.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ar",
        "sound": "ɑr",
        "word": "start",
        "model": "Say start. Listen for /ɑr/, then find ar in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "path",
          "bend",
          "start"
        ],
        "model": "Blend path: /p/ /æ/ /θ/; bend: /b/ /ɛ/ /n/ /d/; start: /s/ /t/ /ɑr/ /t/. Point to th for /θ/ and ar for /ɑr/ in the U.S. voice. Frequent-word support: In they, th spells /ð/ and ey spells /eɪ/. In same, a-e spells /eɪ/. In the, th spells /ð/; model its natural sentence vowel, often /ə/."
      },
      "highFrequencyWords": [
        "they",
        "same",
        "the"
      ],
      "languagePrep": [
        {
          "word": "counter",
          "meaning": "a small piece moved in a game"
        },
        {
          "word": "fork",
          "meaning": "a place where one path splits"
        },
        {
          "word": "direction",
          "meaning": "the way something points or moves"
        }
      ],
      "connectedReading": "Read the failed rolls and traced route, then explain the change that makes the finish reachable.",
      "fluency": "Reread Sam’s first confident line and final Again? with their different meanings."
    },
    "reviewedTextFingerprint": "fnv1a64:d5c3f9d8b26a9a26",
    "reviewedManuscriptSha256": "7096a90cb7627787438d1cbcb8538384dfad81b0bd7ab274da1adb3e9cd9eed7",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-12",
    "number": 12,
    "title": "From Sand to a Bottle",
    "type": "nonfiction",
    "appLevel": "E",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [],
      "topicQuestion": "How can grainy ingredients become a smooth glass bottle?",
      "progression": "Ingredients transform through melting, portioning, forming, controlled cooling and inspection.",
      "synthesis": "A bottle’s shape and material result from several different controlled changes, not sand simply pressed into a mold.",
      "scienceSources": [
        {
          "title": "O-I: How a Glass Bottle Is Made",
          "url": "https://www.o-i.com/wp-content/uploads/2019/04/How-a-Glass-Bottle-is-Made.pdf",
          "evidence": "Container glass uses silica sand, soda ash, limestone and cullet; melting, gobs, mold blowing, annealing, inspection.",
          "checked": "2026-10-28"
        },
        {
          "title": "Corning: How Glass Is Made",
          "url": "https://www.corning.com/worldwide/en/innovation/materials-science/glass/how-glass-made.html",
          "evidence": "Soda-lime glass combines sand, soda ash and limestone; it is one glass family, not every glass recipe.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers.",
    "props": [
      "Silica sand, soda ash, limestone and clean recycled container-glass pieces",
      "Enclosed furnace and forming machine",
      "One clear bottle shape tracked through production",
      "Controlled cooling tunnel"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Show a clear finished bottle beside a readable industrial view of one glowing glass portion entering the bottle mold. Use the same bottle silhouette and factory equipment as the pages, with honest scale separation and no child in the hot working area.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "This smooth bottle began as sand and broken glass.\nHow did those pieces become one clear container?",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. A clear bottle stands beside separate small displays of sand, minerals and glass pieces. Exact state: Diagrammatic comparison, not ingredients inside finished bottle.",
        "imageAlt": "A clear bottle stands beside separate small displays of sand, minerals and glass pieces.",
        "state": "Diagrammatic comparison, not ingredients inside finished bottle.",
        "pageDescription": "A clear bottle stands beside separate small displays of sand, minerals and glass pieces.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "This bottle is made from soda-lime glass.\nIts recipe has sand, soda ash, and limestone.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. Three material piles appear in a factory preparation area. Exact state: Specific soda-lime container process; no universal glass recipe.",
        "imageAlt": "Three material piles appear in a factory preparation area.",
        "state": "Specific soda-lime container process; no universal glass recipe.",
        "pageDescription": "Three material piles appear in a factory preparation area.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Clean recycled glass can join the mix.\nThese small glass pieces are called cullet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. Clean glass fragments move toward a measured batch beside the raw ingredients. Exact state: Cullet safely contained; no children handling shards.",
        "imageAlt": "Clean glass fragments move toward a measured batch beside the raw ingredients.",
        "state": "Cullet safely contained; no children handling shards.",
        "pageDescription": "Clean glass fragments move toward a measured batch beside the raw ingredients.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The ingredients are measured and mixed.\nThe batch goes into a very hot furnace.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. Measured materials enter an enclosed industrial furnace. Exact state: No finished bottle yet; adults behind barrier.",
        "imageAlt": "Measured materials enter an enclosed industrial furnace.",
        "state": "No finished bottle yet; adults behind barrier.",
        "pageDescription": "Measured materials enter an enclosed industrial furnace.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Heat changes the batch into molten glass.\nMolten means melted and able to flow.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. A cutaway reveals glowing molten glass inside the furnace. Exact state: Illustrated cutaway, enclosed real equipment outside.",
        "imageAlt": "A cutaway reveals glowing molten glass inside the furnace.",
        "state": "Illustrated cutaway, enclosed real equipment outside.",
        "pageDescription": "A cutaway reveals glowing molten glass inside the furnace.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "A machine cuts the molten glass into portions.\nEach glowing portion is called a gob.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. One molten glass gob drops into the forming machine. Exact state: Only one tracked gob emphasized; no hand-held cutting.",
        "imageAlt": "One molten glass gob drops into the forming machine.",
        "state": "Only one tracked gob emphasized; no hand-held cutting.",
        "pageDescription": "One molten glass gob drops into the forming machine.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The gob enters a mold.\nThe mold gives the bottle its shape.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. A cutaway mold holds the forming glass. Exact state: Same future bottle outline; mold remains closed during forming.",
        "imageAlt": "A cutaway mold holds the forming glass.",
        "state": "Same future bottle outline; mold remains closed during forming.",
        "pageDescription": "A cutaway mold holds the forming glass.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Air helps push the glass against the mold.\nA hollow bottle forms inside.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. A technical cutaway shows glass expanding against the bottle mold. Exact state: Hollow center distinct; no solid glass bottle.",
        "imageAlt": "A technical cutaway shows glass expanding against the bottle mold.",
        "state": "Hollow center distinct; no solid glass bottle.",
        "pageDescription": "A technical cutaway shows glass expanding against the bottle mold.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "The new bottle is still hot.\nIt passes through an oven that controls how it cools.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. The formed bottle moves into the controlled cooling tunnel. Exact state: Same bottle shape; no immediate kitchen handling.",
        "imageAlt": "The formed bottle moves into the controlled cooling tunnel.",
        "state": "Same bottle shape; no immediate kitchen handling.",
        "pageDescription": "The formed bottle moves into the controlled cooling tunnel.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Heating and cooling in this careful way reduce stresses in the glass.\nThe process is called annealing.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. A row of identical bottles passes along the cooling tunnel toward its cooler end. Exact state: No visible stress cracks as normal outcome.",
        "imageAlt": "A row of identical bottles passes along the cooling tunnel toward its cooler end.",
        "state": "No visible stress cracks as normal outcome.",
        "pageDescription": "A row of identical bottles passes along the cooling tunnel toward its cooler end.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "Each bottle is checked for flaws.\nA flawed bottle can be melted and made again.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. An inspection machine examines a cooled bottle beside a separate recycling return route. Exact state: Good tracked bottle passes; defective example separate.",
        "imageAlt": "An inspection machine examines a cooled bottle beside a separate recycling return route.",
        "state": "Good tracked bottle passes; defective example separate.",
        "pageDescription": "An inspection machine examines a cooled bottle beside a separate recycling return route.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "The bottle has been mixed, melted, shaped, cooled, and checked.\nNow it can hold a drink.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. An illustrated container-glass factory sequence, ending at a kitchen table; all factory workers are adults behind appropriate barriers. The clear finished bottle stands filled with water on a kitchen table. Exact state: Same neck/base silhouette; final material and use answer question.",
        "imageAlt": "The clear finished bottle stands filled with water on a kitchen table.",
        "state": "Same neck/base silhouette; final material and use answer question.",
        "pageDescription": "The clear finished bottle stands filled with water on a kitchen table.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why is making a bottle more than pouring sand into a shape?",
        "listenFor": "Ingredients must melt, be formed hollow, cool under control and be checked."
      },
      "visual": {
        "page": 8,
        "prompt": "Where will the drink fit?",
        "lookFor": "Inside the hollow space, not inside a solid lump of glass."
      }
    },
    "levelRationale": "Twelve linked transformations, unfamiliar process terms and distinctions between material, shape and controlled cooling create App E explanatory demands despite compact C pages.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "sh",
        "sound": "ʃ",
        "word": "shaped",
        "model": "Say shaped. Listen for /ʃ/, then find sh in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "sand",
          "glass",
          "shaped"
        ],
        "model": "Blend sand: /s/ /æ/ /n/ /d/ and glass: /g/ /l/ /æ/ /s/. Read shape as /ʃ/ /eɪ/ /p/, then add /t/ for ed in shaped; a-e spells /eɪ/. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. Read into in two parts, in-to; o in to can spell /uː/. In these, th spells /ð/, e-e spells /iː/, and s spells /z/."
      },
      "highFrequencyWords": [
        "the",
        "into",
        "these"
      ],
      "languagePrep": [
        {
          "word": "molten",
          "meaning": "melted and able to flow"
        },
        {
          "word": "mold",
          "meaning": "a form that gives a material its shape"
        },
        {
          "word": "annealing",
          "meaning": "controlled heating and cooling that reduces stress in glass"
        }
      ],
      "connectedReading": "Read one transformation at a time; explain what changes and what has not yet happened.",
      "fluency": "Reread the closing list in meaningful groups rather than as separate word calls."
    },
    "reviewedTextFingerprint": "fnv1a64:cd27114770f73a20",
    "reviewedManuscriptSha256": "6ebe590458460eb13f39e0d8db702cef0b3bd31764357f6bedd94a4308d693d2",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-13",
    "number": 13,
    "title": "The Octopus in the Rocks",
    "type": "nonfiction",
    "appLevel": "E",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [],
      "topicQuestion": "How can the same octopus become harder to see?",
      "progression": "Find the animal, track its changing appearance, inspect a simple skin mechanism and return to the hidden animal.",
      "synthesis": "Controlled color and texture changes help break up the octopus’s outline against its surroundings.",
      "scienceSources": [
        {
          "title": "Monterey Bay Aquarium: Giant Pacific Octopus",
          "url": "https://www.montereybayaquarium.org/visit/exhibits/giant-pacific-octopus",
          "evidence": "Giant Pacific octopus can change skin color to blend with rocks; it has eight arms.",
          "checked": "2026-10-28"
        },
        {
          "title": "Smithsonian Ocean: How Octopuses and Squids Change Color",
          "url": "https://ocean.si.edu/ocean-life/invertebrates/how-octopuses-and-squids-change-color",
          "evidence": "Muscles control pigment sacs in skin, exposing more or less color; color changes can serve camouflage.",
          "checked": "2026-10-28"
        },
        {
          "title": "Seattle Aquarium: Giant Pacific Octopus",
          "url": "https://www.seattleaquarium.org/animal/giant-pacific-octopus/",
          "evidence": "Giant Pacific octopus also changes skin texture with muscle structures.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance.",
    "props": [
      "One natural giant Pacific octopus, Enteroctopus dofleini, with eight arms and paired rows of suckers",
      "One mottled brown rock group",
      "Pale sand patch",
      "Explanatory skin close-ups separate from ordinary-scale views"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. One giant Pacific octopus blends with the rocky foreground. Its eye and one curling arm provide a fair visual clue; the rest of its eight-armed body stays anatomically coherent among the rocks. No human facial expression or rock with an eye of its own.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Something is resting among these rocks.\nLook for an eye above a curling arm.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. A mottled giant Pacific octopus rests against similarly colored rocks. Exact state: Eight arms belong to one body; camouflage plausible, not literal invisibility.",
        "imageAlt": "A mottled giant Pacific octopus rests against similarly colored rocks.",
        "state": "Eight arms belong to one body; camouflage plausible, not literal invisibility.",
        "pageDescription": "A mottled giant Pacific octopus rests against similarly colored rocks.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "It is a giant Pacific octopus.\nIts skin blends with the rocky background.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. The same octopus raises one arm, making its outline clearer. Exact state: One eye and arm bases correctly placed.",
        "imageAlt": "The same octopus raises one arm, making its outline clearer.",
        "state": "One eye and arm bases correctly placed.",
        "pageDescription": "The same octopus raises one arm, making its outline clearer.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "The octopus moves onto pale sand.\nIts color can change as it moves.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. The octopus crosses from brown rock onto pale sand. Exact state: Natural arm movement; color partly lighter.",
        "imageAlt": "The octopus crosses from brown rock onto pale sand.",
        "state": "Natural arm movement; color partly lighter.",
        "pageDescription": "The octopus crosses from brown rock onto pale sand.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Paler patches spread across its skin.\nThe animal has not become a different octopus.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. The same octopus displays paler patches on the sand. Exact state: Body proportions and eight-arm structure unchanged.",
        "imageAlt": "The same octopus displays paler patches on the sand.",
        "state": "Body proportions and eight-arm structure unchanged.",
        "pageDescription": "The same octopus displays paler patches on the sand.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Tiny sacs of color lie in the skin.\nMuscles can stretch them wider.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. An explanatory magnified skin diagram shows pigment sacs with surrounding muscles. Exact state: Schematic, not free-floating colored beads or paint.",
        "imageAlt": "An explanatory magnified skin diagram shows pigment sacs with surrounding muscles.",
        "state": "Schematic, not free-floating colored beads or paint.",
        "pageDescription": "An explanatory magnified skin diagram shows pigment sacs with surrounding muscles.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "A stretched sac shows more color.\nA smaller sac shows less.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. Two simplified states of the same pigment structure show expanded and contracted area. Exact state: Concept comparison; shapes not literal animal cells with faces.",
        "imageAlt": "Two simplified states of the same pigment structure show expanded and contracted area.",
        "state": "Concept comparison; shapes not literal animal cells with faces.",
        "pageDescription": "Two simplified states of the same pigment structure show expanded and contracted area.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Many tiny changes make a larger pattern.\nThe octopus can produce patches across its body.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. The view returns from skin detail to mottled patches on the octopus. Exact state: No claim each visible patch equals one cell.",
        "imageAlt": "The view returns from skin detail to mottled patches on the octopus.",
        "state": "No claim each visible patch equals one cell.",
        "pageDescription": "The view returns from skin detail to mottled patches on the octopus.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Color is only part of the disguise.\nThe skin can also look smoother or bumpier.",
        "imageBrief": "The octopus rests beside a rock with rounded bumps raised on its skin.",
        "imageAlt": "The octopus rests beside a rock with rounded bumps raised on its skin.",
        "state": "The octopus rests beside a rock with rounded bumps raised on its skin.",
        "pageDescription": "The octopus rests beside a rock with rounded bumps raised on its skin.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "Bumps and patches help hide the body’s outline.\nA hungry animal may find it harder to spot.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. A distant fish passes above the camouflaged octopus among rocks. Exact state: No predation contact or guarantee of perfect concealment.",
        "imageAlt": "A distant fish passes above the camouflaged octopus among rocks.",
        "state": "No predation contact or guarantee of perfect concealment.",
        "pageDescription": "A distant fish passes above the camouflaged octopus among rocks.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "These changes are called camouflage.\nThe octopus is still there even when we lose its outline.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. The whole octopus blends into the rock group while one arm tip remains visible. Exact state: No magical disappearing body.",
        "imageAlt": "The whole octopus blends into the rock group while one arm tip remains visible.",
        "state": "No magical disappearing body.",
        "pageDescription": "The whole octopus blends into the rock group while one arm tip remains visible.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "Return to the first rocks.\nCan you trace an arm and find the eye now?",
        "imageBrief": "A close view shows the same octopus eye and a curling arm among the rocks.",
        "imageAlt": "A close view shows the same octopus eye and a curling arm among the rocks.",
        "state": "A close view shows the same octopus eye and a curling arm among the rocks.",
        "pageDescription": "A close view shows the same octopus eye and a curling arm among the rocks.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "The rocks did not grow an eye.\nA living octopus changed the way its body looked.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A cool rocky northeast Pacific seabed; one giant Pacific octopus is followed at a respectful distance. The octopus lifts an arm away from the opening rocks, revealing itself. Exact state: Gentle factual payoff; rocks remain faceless.",
        "imageAlt": "The octopus lifts an arm away from the opening rocks, revealing itself.",
        "state": "Gentle factual payoff; rocks remain faceless.",
        "pageDescription": "The octopus lifts an arm away from the opening rocks, revealing itself.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What changes, and what stays the same, when this octopus hides?",
        "listenFor": "Color and skin texture change; it remains the same eight-armed animal."
      },
      "visual": {
        "page": 11,
        "prompt": "Which visible details belong to the animal rather than the rock?",
        "lookFor": "An eye and curling arm connect to the hidden body."
      }
    },
    "levelRationale": "An observation-to-microscopic-mechanism-to-whole progression requires sustained referents, scale shifts and inference. Technical ideas are explained with short clauses, supporting App E.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ar",
        "sound": "ɑr",
        "word": "arm",
        "model": "Say arm. Listen for /ɑr/, then find ar in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "rocks",
          "skin",
          "arm"
        ],
        "model": "Blend rocks: /r/ /ɑ/ /k/ /s/; skin: /s/ /k/ /ɪ/ /n/; arm: /ɑr/ /m/. Point to ck for /k/ and ar for /ɑr/ in the U.S. voice. Frequent-word support: In the, th spells /ð/; model its natural sentence vowel, often /ə/. Read its as /ɪ/ /t/ /s/ with no apostrophe. Model there as /ðɛr/ in the U.S. voice; connect th to /ð/ and ere to /ɛr/."
      },
      "highFrequencyWords": [
        "the",
        "its",
        "there"
      ],
      "languagePrep": [
        {
          "word": "outline",
          "meaning": "the edge of a shape"
        },
        {
          "word": "sacs",
          "meaning": "small pouches"
        },
        {
          "word": "camouflage",
          "meaning": "appearance that makes an animal harder to notice"
        }
      ],
      "connectedReading": "Read the whole-to-part explanation, then explain why an outline can be harder to follow.",
      "fluency": "Reread pages 5–8 slowly, grouping each cause with its result."
    },
    "reviewedTextFingerprint": "fnv1a64:624d74cc46d0b54f",
    "reviewedManuscriptSha256": "519c2243be07ef36d0503fb5f7e4b7ed854a17f890530d975a973d1611aeefe5",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-14",
    "number": 14,
    "title": "Dot’s Two Promises",
    "type": "fiction",
    "appLevel": "E",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-DAD",
        "SMALL-PUP"
      ],
      "storySpine": "Dot promises to score Sam’s game and refill Pup’s water, then tries to handle both at once; she stops the game and completes the care task before restarting.",
      "failedAttempt": "Dot runs between the scorekeeping place and water pitcher, missing a turn while still leaving the bowl empty.",
      "turn": "Sam asks for the missed score and Dot admits she has not done either task properly.",
      "resolution": "They pause the game, Dot fills the bowl, and they restart with an agreed order rather than another overlapping promise."
    },
    "setting": "The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard.",
    "props": [
      "Pup’s empty blue water bowl",
      "One three-minute sand timer",
      "Six cardboard bowling pins",
      "One soft red ball",
      "One small water pitcher",
      "One plain wiping cloth kept beside the sink"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Dot stands between Pup’s empty blue bowl and Sam’s six-pin game. She holds the small pitcher while Sam gestures toward the red ball and upright sand timer. Both specific tasks are visible; no tally or written score in the art.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Dad shows Dot Pup’s empty water bowl.\n“Please fill this before the next game.” Dot brings the pitcher from the shelf.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Dad points to the empty blue bowl as Dot takes the small pitcher. Exact state: Care need established before play; no long dehydration scene.",
        "imageAlt": "Dad points to the empty blue bowl as Dot takes the small pitcher.",
        "state": "Care need established before play; no long dehydration scene.",
        "pageDescription": "Dad points to the empty blue bowl as Dot takes the small pitcher.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Sam has set up six bowling pins.\n“Will you keep score?” he asks. Dot nods and puts the pitcher down.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Sam shows six cardboard pins while Dot sets the empty pitcher on the counter. Exact state: First task interrupted; bowl still empty.",
        "imageAlt": "Sam shows six cardboard pins while Dot sets the empty pitcher on the counter.",
        "state": "First task interrupted; bowl still empty.",
        "pageDescription": "Sam shows six cardboard pins while Dot sets the empty pitcher on the counter.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Sam turns the sand timer.\nDot watches his first roll. Three pins fall, and she holds up three fingers.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Dot scores three fallen pins while sand begins to run. Exact state: Three upright/three fallen; water unfinished.",
        "imageAlt": "Dot scores three fallen pins while sand begins to run.",
        "state": "Three upright/three fallen; water unfinished.",
        "pageDescription": "Dot scores three fallen pins while sand begins to run.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Pup noses the empty bowl.\nDot sees the pitcher and remembers Dad’s request. “One second,” she tells Sam.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Pup nudges the empty bowl while Dot looks toward the kitchen pitcher. Exact state: Visible care reminder, no speaking puppy.",
        "imageAlt": "Pup nudges the empty bowl while Dot looks toward the kitchen pitcher.",
        "state": "Visible care reminder, no speaking puppy.",
        "pageDescription": "Pup nudges the empty bowl while Dot looks toward the kitchen pitcher.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Dot hurries to the tap.\nBehind her, Sam rolls again. She hears pins tumble but cannot see how many fell.",
        "imageBrief": "Dot fills the pitcher at the sink with fallen pins from the second roll behind her.",
        "imageAlt": "Dot fills the pitcher at the sink with fallen pins from the second roll behind her.",
        "state": "Dot fills the pitcher at the sink with fallen pins from the second roll behind her.",
        "pageDescription": "Dot fills the pitcher at the sink with fallen pins from the second roll behind her.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "“What is my score?” Sam asks.\nDot looks at the pins. Sam has already stood them up again.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Sam waits beside reset pins as Dot returns holding water. Exact state: Score cannot be inferred; bowl still empty.",
        "imageAlt": "Sam waits beside reset pins as Dot returns holding water.",
        "state": "Score cannot be inferred; bowl still empty.",
        "pageDescription": "Sam waits beside reset pins as Dot returns holding water.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dot starts to guess, then stops.\n“I missed your turn. And Pup still has no water.”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Dot lowers her counting fingers and points to the water bowl. Exact state: Honest recognition; water in pitcher, not bowl.",
        "imageAlt": "Dot lowers her counting fingers and points to the water bowl.",
        "state": "Honest recognition; water in pitcher, not bowl.",
        "pageDescription": "Dot lowers her counting fingers and points to the water bowl.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Sam lays the ball down.\n“Let’s stop the timer.” He turns it on its side while Dot carries the water over.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Sam stops play and lays the sand timer sideways. Exact state: Visible pause agreed; no automatic earned score.",
        "imageAlt": "Sam stops play and lays the sand timer sideways.",
        "state": "Visible pause agreed; no automatic earned score.",
        "pageDescription": "Sam stops play and lays the sand timer sideways.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "Dot fills the bowl. Pup drinks.\nShe puts the pitcher away and wipes the drops beside the bowl.",
        "imageBrief": "Dot wipes the floor beside the full blue bowl while Pup drinks; the pitcher is back on the shelf.",
        "imageAlt": "Dot wipes the floor beside the full blue bowl while Pup drinks; the pitcher is back on the shelf.",
        "state": "Dot wipes the floor beside the full blue bowl while Pup drinks; the pitcher is back on the shelf.",
        "pageDescription": "Dot wipes the floor beside the full blue bowl while Pup drinks; the pitcher is back on the shelf.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "“Now I can watch the whole game,” Dot says.\nSam stands up all six pins and returns the sand to one end.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Dot returns to her scoring place while Sam resets pins and timer. Exact state: Fresh equal start; no lost turn hidden.",
        "imageAlt": "Dot returns to her scoring place while Sam resets pins and timer.",
        "state": "Fresh equal start; no lost turn hidden.",
        "pageDescription": "Dot returns to her scoring place while Sam resets pins and timer.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "They start again. Sam rolls, and Dot counts each fallen pin.\nThis time she stays beside the game.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Dot watches the rolling ball and clearly counts fallen pins. Exact state: Water bowl visible full enough in background; Pup resting.",
        "imageAlt": "Dot watches the rolling ball and clearly counts fallen pins.",
        "state": "Water bowl visible full enough in background; Pup resting.",
        "pageDescription": "Dot watches the rolling ball and clearly counts fallen pins.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "When the sand runs out, Dot gives the score.\nSam rolls the ball to her. “Your turn.”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The same home on one afternoon: playroom adjoining a kitchen with a view of the fenced yard. Sam rolls the ball to Dot while Pup rests beside the water bowl. Exact state: Both specific promises fulfilled; game now passes naturally to Dot; water remains in the bowl.",
        "imageAlt": "Sam rolls the ball to Dot while Pup rests beside the water bowl.",
        "state": "Both specific promises fulfilled; game now passes naturally to Dot; water remains in the bowl.",
        "pageDescription": "Sam rolls the ball to Dot while Pup rests beside the water bowl.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why was guessing Sam’s score not a solution?",
        "listenFor": "Dot had not seen the turn; she needed to admit it, finish the other job and agree to restart."
      },
      "visual": {
        "page": 6,
        "prompt": "Why can Dot no longer count the fallen pins?",
        "lookFor": "Sam has already stood all six up."
      }
    },
    "levelRationale": "Two simultaneous obligations, off-view information, a missed event and negotiated repair require motive and temporal inference over twelve pages. The language remains concrete and within C limits.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "s",
        "sound": "s",
        "word": "stops",
        "model": "Say stops. Listen for /s/, then find s in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "pins",
          "stops",
          "score"
        ],
        "model": "Blend pins: /p/ /ɪ/ /n/ /z/; stops: /s/ /t/ /ɑ/ /p/ /s/; score: /s/ /k/ /ɔr/. Final s spells /z/ in pins and /s/ in stops; ore spells /ɔr/. Frequent-word support: Model what as /wʌt/ in the selected U.S. voice; wh spells /w/ and a spells /ʌ/. In has, final s spells /z/. In she, sh spells /ʃ/ and e spells /iː/."
      },
      "highFrequencyWords": [
        "what",
        "has",
        "she"
      ],
      "languagePrep": [
        {
          "word": "score",
          "meaning": "a count used in a game"
        },
        {
          "word": "promises",
          "meaning": "things you say you will do"
        },
        {
          "word": "missed",
          "meaning": "did not see or do at the needed time"
        }
      ],
      "connectedReading": "Read and keep track of both unfinished jobs; retell the moment Dot tells the truth and what happens next.",
      "fluency": "Use different phrasing for Sam’s question, Dot’s admission and her clear later statement."
    },
    "reviewedTextFingerprint": "fnv1a64:40fdb45523d3e8df",
    "reviewedManuscriptSha256": "749596d83ccdbffc8ab2a5caf4f2ed7dc5fc6d8308662fa00a23ebef2cb717bf",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-15",
    "number": 15,
    "title": "A Footprint Becomes a Fossil",
    "type": "nonfiction",
    "appLevel": "F",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [],
      "topicQuestion": "How can a brief step leave evidence millions of years later?",
      "progression": "A possible footprint forms, survives burial, becomes preserved in rock, is exposed and supports limited inferences.",
      "synthesis": "A track preserves evidence of an action; it does not preserve every detail of the animal.",
      "scienceSources": [
        {
          "title": "Natural History Museum: Dinosaur Footprints",
          "url": "https://www.nhm.ac.uk/discover/dinosaur-footprints.html",
          "evidence": "Tracks in suitable soft sediment can survive burial; preservation is conditional. Tracks provide evidence, not exact species certainty.",
          "checked": "2026-10-28"
        },
        {
          "title": "National Park Service: How Dinosaur Footprints Form",
          "url": "https://home.nps.gov/dena/learn/nature/making-dino-prints.htm",
          "evidence": "Mud prints can be buried by sediment, preserved in rock, and later exposed.",
          "checked": "2026-10-28"
        },
        {
          "title": "American Museum of Natural History: Who Was That Dinosaur?",
          "url": "https://www.amnh.org/exhibitions/dinosaurs-ancient-fossils/trackways/who-was-that-dinosaur",
          "evidence": "Trackways provide clues about animal size and motion; a trace differs from a preserved body.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface.",
    "props": [
      "One three-toed dinosaur footprint with matching left-right trackway",
      "Mud layer, later pale sediment infill and upper layers",
      "Present-day scale ruler and camera used by an adult scientist"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A present-day scientist studies the preserved three-toed trackway across exposed rock. A foreground footprint matches the exact shape used throughout the explanatory sequence. Include a small measuring scale placed beside the track; do not show a living dinosaur in the modern scene.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "A dinosaur steps onto soft ground.\nIts foot lifts, but a print remains. Could that mark outlast the animal?",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. A natural three-toed dinosaur foot lifts from damp sediment. Exact state: Documentary reconstruction; no Dino Pals cast; exact print shape begins.",
        "imageAlt": "A natural three-toed dinosaur foot lifts from damp sediment.",
        "state": "Documentary reconstruction; no Dino Pals cast; exact print shape begins.",
        "pageDescription": "A natural three-toed dinosaur foot lifts from damp sediment.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "This is one way a footprint can become a fossil.\nMost fresh prints do not last so long.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. The new three-toed print sits beside another mark partly washed away. Exact state: One possible preservation route, not an inevitable life cycle.",
        "imageAlt": "The new three-toed print sits beside another mark partly washed away.",
        "state": "One possible preservation route, not an inevitable life cycle.",
        "pageDescription": "The new three-toed print sits beside another mark partly washed away.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Ground that is too hard may take no clear print.\nVery soft mud may slump into the mark.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. A simple comparison shows hard ground and slumped mud beside a clear print. Exact state: Three substrate examples clearly separate; no false same-print state.",
        "imageAlt": "A simple comparison shows hard ground and slumped mud beside a clear print.",
        "state": "Three substrate examples clearly separate; no false same-print state.",
        "pageDescription": "A simple comparison shows hard ground and slumped mud beside a clear print.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Our print holds its shape.\nLater, a gentle layer of sand or mud covers it without washing it away.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. Fine pale sediment settles into and over the intact footprint. Exact state: Original brown print surface remains under new material.",
        "imageAlt": "Fine pale sediment settles into and over the intact footprint.",
        "state": "Original brown print surface remains under new material.",
        "pageDescription": "Fine pale sediment settles into and over the intact footprint.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "More sediment builds above it.\nThe old mark is protected from footsteps and running water at the surface.",
        "imageBrief": "A side cutaway shows a shallow footprint depression under new layers, with a separate top-view inset of its three toes. The footprint is a depression in a horizontal sedimentary surface. A shallow side section plus separate top-view inset identifies the three-toed shape; never represent it standing vertically through strata.",
        "imageAlt": "A side cutaway shows a shallow footprint depression under new layers, with a separate top-view inset of its three toes.",
        "state": "The footprint is a depression in a horizontal sedimentary surface. A shallow side section plus separate top-view inset identifies the three-toed shape; never represent it standing vertically through strata.",
        "pageDescription": "A side cutaway shows a shallow footprint depression under new layers, with a separate top-view inset of its three toes.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Over a very long time, these sediments can become rock.\nThe footprint’s shape may remain within the layers.",
        "imageBrief": "The same rock layers preserve the shallow depression, with a separate top-view inset identifying its three-toed outline. The footprint is a depression in a horizontal sedimentary surface. A shallow side section plus separate top-view inset identifies the three-toed shape; never represent it standing vertically through strata.",
        "imageAlt": "The same rock layers preserve the shallow depression, with a separate top-view inset identifying its three-toed outline.",
        "state": "The footprint is a depression in a horizontal sedimentary surface. A shallow side section plus separate top-view inset identifies the three-toed shape; never represent it standing vertically through strata.",
        "pageDescription": "The same rock layers preserve the shallow depression, with a separate top-view inset identifying its three-toed outline.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The dinosaur is long gone.\nIts preserved step is a trace fossil, rather than a fossil of its body.",
        "imageBrief": "A stepped cutaway exposes the horizontal footprint-bearing surface beneath younger layers. The footprint is a depression in a horizontal sedimentary surface. A shallow side section plus separate top-view inset identifies the three-toed shape; never represent it standing vertically through strata.",
        "imageAlt": "A stepped cutaway exposes the horizontal footprint-bearing surface beneath younger layers.",
        "state": "The footprint is a depression in a horizontal sedimentary surface. A shallow side section plus separate top-view inset identifies the three-toed shape; never represent it standing vertically through strata.",
        "pageDescription": "A stepped cutaway exposes the horizontal footprint-bearing surface beneath younger layers.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Much later, wind and water wear away rock above the track.\nPart of the old surface becomes bare.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. Erosion uncovers one edge of the track-bearing layer. Exact state: Removed upper layers; no human digging required.",
        "imageAlt": "Erosion uncovers one edge of the track-bearing layer.",
        "state": "Removed upper layers; no human digging required.",
        "pageDescription": "Erosion uncovers one edge of the track-bearing layer.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "A scientist finds the mark and records its shape.\nPhotos and measurements help save the evidence.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. An adult scientist photographs the footprint with a scale beside it. Exact state: No chiseling or child collection; scale not placed over track.",
        "imageAlt": "An adult scientist photographs the footprint with a scale beside it.",
        "state": "No chiseling or child collection; scale not placed over track.",
        "pageDescription": "An adult scientist photographs the footprint with a scale beside it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Nearby prints form a trackway.\nTheir spacing can give clues about how the animal moved.",
        "imageBrief": "Several three-toed prints form a trackway across the same rock surface. Several prints form a narrow trackway; no claim of a specific gait or exact stride is certified by the illustration.",
        "imageAlt": "Several three-toed prints form a trackway across the same rock surface.",
        "state": "Several prints form a narrow trackway; no claim of a specific gait or exact stride is certified by the illustration.",
        "pageDescription": "Several three-toed prints form a trackway across the same rock surface.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "A print does not tell us everything.\nIts shape alone may not identify the exact dinosaur species.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. The scientist compares the measured print with several plain foot-shape drawings. Exact state: No falsely certain named species identification.",
        "imageAlt": "The scientist compares the measured print with several plain foot-shape drawings.",
        "state": "No falsely certain named species identification.",
        "pageDescription": "The scientist compares the measured print with several plain foot-shape drawings.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "The track cannot show the animal’s color.\nThat fact needs other evidence, not a guess from the toes.",
        "imageBrief": "Two differently colored hypothetical dinosaur silhouettes appear above the same three-toed footprint.",
        "imageAlt": "Two differently colored hypothetical dinosaur silhouettes appear above the same three-toed footprint.",
        "state": "Two differently colored hypothetical dinosaur silhouettes appear above the same three-toed footprint.",
        "pageDescription": "Two differently colored hypothetical dinosaur silhouettes appear above the same three-toed footprint.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 13,
        "text": "We can still say that an animal pressed its foot here.\nThe rock keeps evidence of that moment.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. Close view of the footprint links its deep toe marks to the original step shape. Exact state: Same print preserved; body appearance left uncertain.",
        "imageAlt": "Close view of the footprint links its deep toe marks to the original step shape.",
        "state": "Same print preserved; body appearance left uncertain.",
        "pageDescription": "Close view of the footprint links its deep toe marks to the original step shape.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 14,
        "text": "One step took a moment.\nThe trace lets us study that action millions of years later.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A scientifically informed illustrative sequence from an ancient muddy shore through layered sediment to a present-day exposed rock surface. A wide present-day view shows the exposed trackway crossing ancient rock. Exact state: Return to opening action with surviving trace; no living dinosaur in present.",
        "imageAlt": "A wide present-day view shows the exposed trackway crossing ancient rock.",
        "state": "Return to opening action with surviving trace; no living dinosaur in present.",
        "pageDescription": "A wide present-day view shows the exposed trackway crossing ancient rock.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What can the footprint tell us, and what can it not tell us by itself?",
        "listenFor": "It records a step and may give movement clues; it cannot show color or always name the exact species."
      },
      "visual": {
        "page": 5,
        "prompt": "What protects the old print here?",
        "lookFor": "New layers cover the marked surface while preserving its shape."
      }
    },
    "levelRationale": "Conditional preservation, geological time, trace/body distinction and limits of inference require specialist understanding across fourteen compact pages. These relationships earn App F without pretending the text is cumulatively decodable.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "i",
        "sound": "ɪ",
        "word": "print",
        "model": "Say print. Listen for /ɪ/, then find i in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "step",
          "print",
          "track"
        ],
        "model": "Blend step: /s/ /t/ /ɛ/ /p/; print: /p/ /r/ /ɪ/ /n/ /t/; track: /t/ /r/ /æ/ /k/. Keep each consonant audible without inserting extra vowel sounds; ck spells /k/. Frequent-word support: In could, ou spells /ʊ/ and l is silent. In the, th spells /ð/; model its natural sentence vowel, often /ə/. In that, th spells /ð/."
      },
      "highFrequencyWords": [
        "could",
        "the",
        "that"
      ],
      "languagePrep": [
        {
          "word": "sediment",
          "meaning": "small pieces of material that settle in layers"
        },
        {
          "word": "trace",
          "meaning": "a mark left by an action"
        },
        {
          "word": "evidence",
          "meaning": "something that helps us work out what happened"
        }
      ],
      "connectedReading": "Read the possible sequence, then sort one supported conclusion from one unanswered question.",
      "fluency": "Reread may, can and could accurately; do not turn qualified facts into certainties."
    },
    "reviewedTextFingerprint": "fnv1a64:2d9bb91e624a0069",
    "reviewedManuscriptSha256": "f083fd3d468328c99ba3e67576e190da6b223c2ce4e4cd33f2683e4f44dd131a",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-16",
    "number": 16,
    "title": "How a Lock Lifts a Boat",
    "type": "nonfiction",
    "appLevel": "F",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [],
      "topicQuestion": "How does a floating boat reach a higher stretch of canal?",
      "progression": "Match the lower level, admit boat, close gates, admit upper water, match the upper level and exit.",
      "synthesis": "Rising water lifts the floating boat inside the chamber; matching levels allows the exit gate to open.",
      "scienceSources": [
        {
          "title": "Canal & River Trust: How a Canal Lock Works",
          "url": "https://canalrivertrust.org.uk/canals-and-rivers/how-does-a-canal-lock-work",
          "evidence": "Gated chamber changes water level through small controlled openings; exit opens after levels match.",
          "checked": "2026-10-28"
        },
        {
          "title": "Parks Canada: How Locks Work",
          "url": "https://www.parcs.canada.ca/lhn-nhs/qc/canalcarillon/culture/ecluses-locks",
          "evidence": "Water-filled lock chambers move boats between water levels.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right.",
    "props": [
      "One red narrowboat pointing right",
      "One chamber between lower left and upper right gates",
      "Small controlled water openings distinct from boat gates",
      "One adult operator on the bank"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A clear side view shows the red boat floating inside the lock chamber between the lower canal on the left and higher canal on the right. Both boat gates are closed and the chamber is midway through filling from upper-side small passages. No lift platform or simultaneous open gates.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "A red boat reaches a higher stretch of canal.\nIt cannot float uphill through the air. What can lift it?",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. A red narrowboat approaches the lower side of a lock with a higher canal beyond. Exact state: Boat at lower left; upper right water clearly higher.",
        "imageAlt": "A red narrowboat approaches the lower side of a lock with a higher canal beyond.",
        "state": "Boat at lower left; upper right water clearly higher.",
        "pageDescription": "A red narrowboat approaches the lower side of a lock with a higher canal beyond.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "A lock is a chamber between gates.\nWater inside can be raised or lowered to match either side.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. A side cutaway shows the chamber between the two gate sets. Exact state: Lower left level low; chamber initially low; upper right high.",
        "imageAlt": "A side cutaway shows the chamber between the two gate sets.",
        "state": "Lower left level low; chamber initially low; upper right high.",
        "pageDescription": "A side cutaway shows the chamber between the two gate sets.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "First, the chamber water matches the lower canal.\nThe upper gates stay shut.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The empty chamber and lower canal show one continuous water height. Exact state: Both boat gates initially shut; small openings closed after equalizing.",
        "imageAlt": "The empty chamber and lower canal show one continuous water height.",
        "state": "Both boat gates initially shut; small openings closed after equalizing.",
        "pageDescription": "The empty chamber and lower canal show one continuous water height.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The lower gates open, and the boat enters.\nThe boat still floats at the lower height.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The boat moves right into the chamber through open lower gates. Exact state: Upper gates shut; no change of water height.",
        "imageAlt": "The boat moves right into the chamber through open lower gates.",
        "state": "Upper gates shut; no change of water height.",
        "pageDescription": "The boat moves right into the chamber through open lower gates.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "The lower gates close behind the boat.\nNow both ends of the chamber are closed.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The red boat rests inside with both gate sets closed. Exact state: Boat centered; adult controls from bank.",
        "imageAlt": "The red boat rests inside with both gate sets closed.",
        "state": "Boat centered; adult controls from bank.",
        "pageDescription": "The red boat rests inside with both gate sets closed.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "The operator opens small passages from the upper side.\nThese are water openings, not the wide gates for boats.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. A clear cutaway shows upper-side small passages opening below water. Exact state: Lower passages shut; all boat gates shut.",
        "imageAlt": "A clear cutaway shows upper-side small passages opening below water.",
        "state": "Lower passages shut; all boat gates shut.",
        "pageDescription": "A clear cutaway shows upper-side small passages opening below water.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Water flows from the higher canal into the chamber.\nThe water level around the boat begins to rise.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. Water enters through the upper passages as the chamber level rises. Exact state: Higher-to-lower flow; no lower outflow.",
        "imageAlt": "Water enters through the upper passages as the chamber level rises.",
        "state": "Higher-to-lower flow; no lower outflow.",
        "pageDescription": "Water enters through the upper passages as the chamber level rises.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The boat rises with the water.\nIt stays afloat as more water flows in.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The boat floats higher in the filling chamber. Exact state: No mechanical lift floor or change of hull size.",
        "imageAlt": "The boat floats higher in the filling chamber.",
        "state": "No mechanical lift floor or change of hull size.",
        "pageDescription": "The boat floats higher in the filling chamber.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "The chamber fills until its water matches the upper canal.\nThe boat has reached the new height.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The chamber surface aligns with the upper canal surface. Exact state: Lower gates still hold back height difference.",
        "imageAlt": "The chamber surface aligns with the upper canal surface.",
        "state": "Lower gates still hold back height difference.",
        "pageDescription": "The chamber surface aligns with the upper canal surface.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "The operator closes the small water passages.\nWith levels matched, the upper gates can open.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The operator closes the passage control beside the upper gates. Exact state: Upper gate beginning to open only after equal levels.",
        "imageAlt": "The operator closes the passage control beside the upper gates.",
        "state": "Upper gate beginning to open only after equal levels.",
        "pageDescription": "The operator closes the passage control beside the upper gates.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "The boat moves out onto the higher water.\nThe lower gates remain shut behind the chamber.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The red boat exits right onto the upper canal. Exact state: Boat still right-facing; no other gate open.",
        "imageAlt": "The red boat exits right onto the upper canal.",
        "state": "Boat still right-facing; no other gate open.",
        "pageDescription": "The red boat exits right onto the upper canal.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "Going down uses the opposite change.\nA boat in a closed chamber descends as water drains to the lower side.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. A clearly separate explanatory cutaway shows a blue example boat descending. Exact state: New boat explicitly example; closed boat gates; lower passages open.",
        "imageAlt": "A clearly separate explanatory cutaway shows a blue example boat descending.",
        "state": "New boat explicitly example; closed boat gates; lower passages open.",
        "pageDescription": "A clearly separate explanatory cutaway shows a blue example boat descending.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 13,
        "text": "In either direction, the water must match the next canal section before the exit gates open.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. Two small comparison views show equal surfaces beside an upper exit and a lower exit. Exact state: Both diagrams separate; no combined impossible gate state.",
        "imageAlt": "Two small comparison views show equal surfaces beside an upper exit and a lower exit.",
        "state": "Both diagrams separate; no combined impossible gate state.",
        "pageDescription": "Two small comparison views show equal surfaces beside an upper exit and a lower exit.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 14,
        "text": "The red boat has climbed without leaving the water.\nThe lock changed the water’s height around it.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A simplified working canal lock viewed from the side and above, with the lower reach consistently left and upper reach right. The red boat travels along the upper canal with the lock behind. Exact state: Original boat successfully higher; causal answer complete.",
        "imageAlt": "The red boat travels along the upper canal with the lock behind.",
        "state": "Original boat successfully higher; causal answer complete.",
        "pageDescription": "The red boat travels along the upper canal with the lock behind.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "What raises the red boat before the upper gates open?",
        "listenFor": "Water entering the chamber raises its surface and the floating boat until the upper levels match."
      },
      "visual": {
        "page": 7,
        "prompt": "Which opening admits water, and which gates stay closed?",
        "lookFor": "Small upper passages admit water; both wide boat gates stay shut."
      }
    },
    "levelRationale": "Four spatial states, two kinds of openings, pressure-related level matching and reversed operation demand sustained mechanism tracking. Compact C print supports App F with adult vocabulary preparation.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "sh",
        "sound": "ʃ",
        "word": "shut",
        "model": "Say shut. Listen for /ʃ/, then find sh in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "lock",
          "shut",
          "boat"
        ],
        "model": "Blend lock: /l/ /ɑ/ /k/; shut: /ʃ/ /ʌ/ /t/; boat: /b/ /oʊ/ /t/. Point to ck for /k/, sh for /ʃ/, and oa for /oʊ/. Frequent-word support: In both, o spells /oʊ/ and th spells /θ/. In the, th spells /ð/; model its natural sentence vowel, often /ə/. Read be-fore with stress on fore; ore spells /ɔr/ in the U.S. voice."
      },
      "highFrequencyWords": [
        "both",
        "the",
        "before"
      ],
      "languagePrep": [
        {
          "word": "chamber",
          "meaning": "the space between the lock gates"
        },
        {
          "word": "passages",
          "meaning": "small ways for water to flow"
        },
        {
          "word": "level",
          "meaning": "the height of a water surface here"
        }
      ],
      "connectedReading": "Read with the lower/upper orientation fixed; explain which state must change before the next action.",
      "fluency": "Reread pages 5–10, grouping each condition with the action it permits."
    },
    "reviewedTextFingerprint": "fnv1a64:e0088847adf2bc3a",
    "reviewedManuscriptSha256": "c172c10393954509e2dd3103952c5458c0d117c5ddbd5ccaf6cde5090af7f5ad",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-17",
    "number": 17,
    "title": "Whose Sponge Wins?",
    "type": "fiction",
    "appLevel": "F",
    "level": "C",
    "readingBandProfile": "standard",
    "interestAge": "5–8",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-DAD"
      ],
      "storySpine": "Sam calls his big blue sponge the best, but Dot spots unequal conditions; they redesign and repeat the comparison before choosing a sponge for a real job.",
      "failedAttempt": "The first comparison changes both sponge size and water amount, so its apparent winner cannot answer the question.",
      "turn": "Dot separates what they want to compare from what they must keep the same.",
      "resolution": "Two controlled trials favor this yellow sample; Sam revises his claim and uses it for the small spill."
    },
    "setting": "The kitchen craft table on a dry afternoon, with a low waterproof testing tray.",
    "props": [
      "One large blue sponge and one smaller yellow sponge, then two fresh pairs of equal-sized samples of those same materials prepared by Dad",
      "Two identical clear shallow dishes",
      "One measuring cup",
      "Two identical clear collecting cups",
      "Timer"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. Sam and Dot hold the original unequal dry sponges, large blue and smaller yellow, over the testing tray. Dad watches nearby. Matching clear dishes and cups establish the comparison; do not show an unsupported universal winner or multiply the initial samples.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam’s blue sponge is huge. Dot’s yellow sponge is small.\n“Mine will soak up more,” Sam says, reaching for water.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Sam holds a large blue sponge beside Dot’s small yellow sponge. Exact state: Both dry; size difference explicit.",
        "imageAlt": "Sam holds a large blue sponge beside Dot’s small yellow sponge.",
        "state": "Both dry; size difference explicit.",
        "pageDescription": "Sam holds a large blue sponge beside Dot’s small yellow sponge.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Sam pours plenty into his dish. Dot pours a little into hers.\nThey dip their sponges and lift them out.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. The two unequal sponges dip into dishes with visibly unequal water amounts. Exact state: First comparison uncontrolled; no numerical claim.",
        "imageAlt": "The two unequal sponges dip into dishes with visibly unequal water amounts.",
        "state": "First comparison uncontrolled; no numerical claim.",
        "pageDescription": "The two unequal sponges dip into dishes with visibly unequal water amounts.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Sam squeezes his sponge into a cup. More water comes out.\n“Blue wins!” He holds his cup above Dot’s.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Sam shows a fuller collected-water cup than Dot’s. Exact state: First apparent result only; not universal material claim.",
        "imageAlt": "Sam shows a fuller collected-water cup than Dot’s.",
        "state": "First apparent result only; not universal material claim.",
        "pageDescription": "Sam shows a fuller collected-water cup than Dot’s.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Dot puts the sponges side by side.\n“Yours had more sponge and more water. What did we really compare?”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Dot aligns the unequal sponges and points to the differently filled starting dishes. Exact state: Ambiguity recognized; no instant corrected result.",
        "imageAlt": "Dot aligns the unequal sponges and points to the differently filled starting dishes.",
        "state": "Ambiguity recognized; no instant corrected result.",
        "pageDescription": "Dot aligns the unequal sponges and points to the differently filled starting dishes.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Sam lowers his cup.\nThey cannot tell whether the material, size, or water amount made the difference.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Sam sets his cup down beside both sponges. Exact state: First conclusion suspended, not erased.",
        "imageAlt": "Sam sets his cup down beside both sponges.",
        "state": "First conclusion suspended, not erased.",
        "pageDescription": "Sam sets his cup down beside both sponges.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "Dad prepares two fresh pieces of the same size.\nOne is blue and one is yellow; both start dry.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Dad presents fresh equal-sized rectangular samples. Exact state: Identical length, width and thickness; cutting already adult-completed.",
        "imageAlt": "Dad presents fresh equal-sized rectangular samples.",
        "state": "Identical length, width and thickness; cutting already adult-completed.",
        "pageDescription": "Dad presents fresh equal-sized rectangular samples.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dot measures the same amount of water into two matching dishes.\nSam checks that neither sample has been dipped yet.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Dot pours equal measured water into identical dishes while Sam checks dry samples. Exact state: Only material differs; ample water available.",
        "imageAlt": "Dot pours equal measured water into identical dishes while Sam checks dry samples.",
        "state": "Only material differs; ample water available.",
        "pageDescription": "Dot pours equal measured water into identical dishes while Sam checks dry samples.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "They dip both samples for the same time.\nThen each sample drains above its dish for the same short wait.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Both samples rest in the dishes while one shared timer runs. Exact state: Equal soak and drain duration; one depicted moment.",
        "imageAlt": "Both samples rest in the dishes while one shared timer runs.",
        "state": "Equal soak and drain duration; one depicted moment.",
        "pageDescription": "Both samples rest in the dishes while one shared timer runs.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "They squeeze each sample into a matching cup until it stops dripping.\nThis time, the yellow sample gives more water.",
        "imageBrief": "Sam and Dot squeeze the equal-sized samples into matching cups; the yellow sample gives more water.",
        "imageAlt": "Sam and Dot squeeze the equal-sized samples into matching cups; the yellow sample gives more water.",
        "state": "Sam and Dot squeeze the equal-sized samples into matching cups; the yellow sample gives more water.",
        "pageDescription": "Sam and Dot squeeze the equal-sized samples into matching cups; the yellow sample gives more water.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "“Once might fool us,” Sam says.\nThey empty the cups and repeat with another dry pair of equal-sized samples.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. The kitchen craft table on a dry afternoon, with a low waterproof testing tray. Sam resets the cups as Dad provides a second equal-sized dry pair. Exact state: New dry samples of same respective materials; not wet reuse.",
        "imageAlt": "Sam resets the cups as Dad provides a second equal-sized dry pair.",
        "state": "New dry samples of same respective materials; not wet reuse.",
        "pageDescription": "Sam resets the cups as Dad provides a second equal-sized dry pair.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "The yellow sample gives more water again.\nDot points to both results. “This yellow material held more in our test.”",
        "imageBrief": "Dot points to two rows of result sketches beside the second pair of collecting cups.",
        "imageAlt": "Dot points to two rows of result sketches beside the second pair of collecting cups.",
        "state": "Dot points to two rows of result sketches beside the second pair of collecting cups.",
        "pageDescription": "Dot points to two rows of result sketches beside the second pair of collecting cups.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "Sam picks up the huge blue sponge.\n“It still holds lots. But we did not test them fairly the first time.”",
        "imageBrief": "Sam holds the huge original blue sponge above the small tested samples; the result paper is turned face down for tidying. The result paper is deliberately turned face down after page11; its plain back remains visible through tidying. Both real collecting cups retain qualitatively more water for yellow; artwork does not assert numerical volumes.",
        "imageAlt": "Sam holds the huge original blue sponge above the small tested samples; the result paper is turned face down for tidying.",
        "state": "The result paper is deliberately turned face down after page11; its plain back remains visible through tidying. Both real collecting cups retain qualitatively more water for yellow; artwork does not assert numerical volumes.",
        "pageDescription": "Sam holds the huge original blue sponge above the small tested samples; the result paper is turned face down for tidying.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 13,
        "text": "A little water spills from the measuring cup.\nSam reaches for the tested yellow sponge and wipes the tray.",
        "imageBrief": "Sam uses a yellow test sample on a small spill inside the tray; the result paper remains face down. The result paper is deliberately turned face down after page11; its plain back remains visible through tidying. Both real collecting cups retain qualitatively more water for yellow; artwork does not assert numerical volumes.",
        "imageAlt": "Sam uses a yellow test sample on a small spill inside the tray; the result paper remains face down.",
        "state": "The result paper is deliberately turned face down after page11; its plain back remains visible through tidying. Both real collecting cups retain qualitatively more water for yellow; artwork does not assert numerical volumes.",
        "pageDescription": "Sam uses a yellow test sample on a small spill inside the tray; the result paper remains face down.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 14,
        "text": "“Yellow wins this puddle,” he says.\nDot wipes the other end with blue. “This one can help too.”",
        "imageBrief": "Sam wipes the left end with yellow while Dot wipes the right with blue; the result paper remains face down. The result paper is deliberately turned face down after page11; its plain back remains visible through tidying. Both real collecting cups retain qualitatively more water for yellow; artwork does not assert numerical volumes.",
        "imageAlt": "Sam wipes the left end with yellow while Dot wipes the right with blue; the result paper remains face down.",
        "state": "The result paper is deliberately turned face down after page11; its plain back remains visible through tidying. Both real collecting cups retain qualitatively more water for yellow; artwork does not assert numerical volumes.",
        "pageDescription": "Sam wipes the left end with yellow while Dot wipes the right with blue; the result paper remains face down.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why did they change their first claim, and what did they keep the same in the new test?",
        "listenFor": "First trial mixed size and water amount; later trials controlled sample size, starting dryness, water, soak/drain time and squeezing."
      },
      "visual": {
        "page": 6,
        "prompt": "What has changed from the first comparison?",
        "lookFor": "Fresh dry sponge samples have matching dimensions."
      }
    },
    "levelRationale": "Reader distinguishes a confounded observation from a controlled comparison, follows repeated trials and interprets a deliberately limited conclusion. This sustained evidence reasoning earns App F; it is not a universal sponge experiment result.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "o",
        "sound": "ʌ",
        "word": "sponge",
        "model": "Say sponge. Listen for /ʌ/, then find o in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "test",
          "dry",
          "held"
        ],
        "model": "Blend test: /t/ /ɛ/ /s/ /t/; dry: /d/ /r/ /aɪ/; held: /h/ /ɛ/ /l/ /d/. In dry, final y spells /aɪ/. Frequent-word support: In more, ore spells /ɔr/ in the U.S. voice. In same, a-e spells /eɪ/. In they, th spells /ð/ and ey spells /eɪ/."
      },
      "highFrequencyWords": [
        "more",
        "same",
        "they"
      ],
      "languagePrep": [
        {
          "word": "sample",
          "meaning": "a small piece used to test something"
        },
        {
          "word": "compare",
          "meaning": "look at things to find differences"
        },
        {
          "word": "material",
          "meaning": "what something is made from"
        }
      ],
      "connectedReading": "Read the first claim and revised conclusion, then explain which evidence justified the change.",
      "fluency": "Reread Dot’s questions with natural questioning stress; keep this and our in the conclusion audible."
    },
    "reviewedTextFingerprint": "fnv1a64:860a462e8db646da",
    "reviewedManuscriptSha256": "6ed4567ff1f001c31dab7275b3683060508041c37092f499c0ae0f8f1fd7ea13",
    "readingMode": "predictable-levelled",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-18",
    "number": 18,
    "title": "Wren and the Borrowed Ribbons",
    "type": "fiction",
    "appLevel": "G",
    "level": "C",
    "readingBandProfile": "extended",
    "interestAge": "7–9",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "MOON-WREN",
        "MOON-FERN",
        "MOON-PIP"
      ],
      "storySpine": "Wren wants a bright garden banner, but mistakes Fern’s tied basket markers for spare ribbon; a failed guessed restoration leads her to Pip’s earlier drawing and a concrete repair.",
      "failedAttempt": "Wren returns the three ribbons by guessing, which cannot restore the information they carried.",
      "turn": "She notices Pip’s earlier drawing shows the original ribbon order and checks it against the unmoved baskets.",
      "resolution": "Wren restores each marker from evidence and uses the genuinely spare plain strips for her banner.",
      "magicRules": "No new magic. Wren solves a physical information-loss problem through observation and ordinary craft."
    },
    "setting": "Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions.",
    "props": [
      "Three identical covered seed baskets in a fixed row",
      "Red ribbon tied on left basket, blue on middle, yellow on right",
      "Pip’s colored drawing of that exact row",
      "One black sketch pencil and three short colored pencils: red, blue and yellow",
      "Tray of loose plain cloth strips",
      "Plain banner cord"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Wren holds the unfinished banner cord beside Fern’s garden table. The three covered baskets retain red-left, blue-middle and yellow-right ribbon markers beside the crooked root. Pip draws the baskets; Fern stands nearby. Keep the tray of plain strips separate, with no floating magical colors.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Wren wanted a bright banner for Fern’s garden. Three covered baskets stood on the table. Their red, blue, and yellow ribbons looked much grander than plain string.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Wren studies three ribbon-tied baskets on Fern’s garden table. Exact state: Left red, middle blue, right yellow; lids closed; banner cord bare.",
        "imageAlt": "Wren studies three ribbon-tied baskets on Fern’s garden table.",
        "state": "Left red, middle blue, right yellow; lids closed; banner cord bare.",
        "pageDescription": "Wren studies three ribbon-tied baskets on Fern’s garden table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Pip sat beside the table, drawing the baskets. He copied each ribbon’s color. Fern needed those colors to remember which garden bed each basket of seeds belonged to.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Pip makes a colored drawing of the fixed basket row while Fern checks it. Exact state: Drawing faithfully records left red/middle blue/right yellow; avoid generated letters.",
        "imageAlt": "Pip makes a colored drawing of the fixed basket row while Fern checks it.",
        "state": "Drawing faithfully records left red/middle blue/right yellow; avoid generated letters.",
        "pageDescription": "Pip makes a colored drawing of the fixed basket row while Fern checks it.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "“May I borrow some ribbon?” Wren asked, and Fern pointed toward a tray. “Take the loose strips,” Fern said. Wren glanced at the baskets before Fern returned to planting.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Fern points clearly at a tray of loose plain strips while Wren looks at the baskets. Exact state: Permission limited to loose strips; tied markers still present.",
        "imageAlt": "Fern points clearly at a tray of loose plain strips while Wren looks at the baskets.",
        "state": "Permission limited to loose strips; tied markers still present.",
        "pageDescription": "Fern points clearly at a tray of loose plain strips while Wren looks at the baskets.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Wren untied the red ribbon, then the blue and yellow ones. She knotted them along her banner cord. The baskets stayed in place, but all three now looked alike.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Wren ties the removed colored ribbons onto her banner cord. Exact state: All three basket lids closed and positions unchanged; plain tray untouched.",
        "imageAlt": "Wren ties the removed colored ribbons onto her banner cord.",
        "state": "All three basket lids closed and positions unchanged; plain tray untouched.",
        "pageDescription": "Wren ties the removed colored ribbons onto her banner cord.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Fern returned for the seeds and stopped at the bare baskets. “Which one goes beside the pond?” Wren lowered the banner. She had borrowed more than decoration.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Fern points to the three unmarked baskets while Wren lowers the banner. Exact state: Consequence is lost information, not angry punishment.",
        "imageAlt": "Fern points to the three unmarked baskets while Wren lowers the banner.",
        "state": "Consequence is lost information, not angry punishment.",
        "pageDescription": "Fern points to the three unmarked baskets while Wren lowers the banner.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "“I can put them back,” Wren said. She tied yellow on the left basket and red in the middle. Fern kept her planting basket on the ground.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Wren attaches two markers in the wrong order while Fern waits. Exact state: Left yellow, middle red, right unmarked; blue still on banner cord.",
        "imageAlt": "Wren attaches two markers in the wrong order while Fern waits.",
        "state": "Left yellow, middle red, right unmarked; blue still on banner cord.",
        "pageDescription": "Wren attaches two markers in the wrong order while Fern waits.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Fern asked how Wren knew the order was right. Wren could not answer, so she loosened the knots. All three ribbons went flat on the table again.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Wren removes the guessed markers and lays red, blue and yellow ribbons on the table. Exact state: All baskets unmarked again; no seeds moved or planted.",
        "imageAlt": "Wren removes the guessed markers and lays red, blue and yellow ribbons on the table.",
        "state": "All baskets unmarked again; no seeds moved or planted.",
        "pageDescription": "Wren removes the guessed markers and lays red, blue and yellow ribbons on the table.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Pip put down his pencil. His drawing still showed the colors, though the real baskets had lost them. Wren pulled her chair beside him and looked closely.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Pip shows the earlier colored drawing to Wren. Exact state: Original drawing unchanged; table row matches positions.",
        "imageAlt": "Pip shows the earlier colored drawing to Wren.",
        "state": "Original drawing unchanged; table row matches positions.",
        "pageDescription": "Pip shows the earlier colored drawing to Wren.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "The drawing showed red on the left basket beside the crooked root. Wren checked that root, then tied the red ribbon back. She kept the drawing open.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Fern’s garden table beneath Hollow Oak in one dry late afternoon; three covered seed baskets stay in fixed left-to-right positions. Wren matches the left basket to the crooked root in Pip’s drawing. Exact state: Left red restored from evidence; middle/right bare.",
        "imageAlt": "Wren matches the left basket to the crooked root in Pip’s drawing.",
        "state": "Left red restored from evidence; middle/right bare.",
        "pageDescription": "Wren matches the left basket to the crooked root in Pip’s drawing.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Blue belonged in the middle, and yellow belonged on the right. Wren replaced both markers. Pip checked every ribbon against his drawing before Fern lifted a basket.",
        "imageBrief": "Pip checks the restored red, blue and yellow basket markers against his drawing while Wren rests her hands on the yellow basket’s handle.",
        "imageAlt": "Pip checks the restored red, blue and yellow basket markers against his drawing while Wren rests her hands on the yellow basket’s handle.",
        "state": "Pip checks the restored red, blue and yellow basket markers against his drawing while Wren rests her hands on the yellow basket’s handle.",
        "pageDescription": "Pip checks the restored red, blue and yellow basket markers against his drawing while Wren rests her hands on the yellow basket’s handle.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "Fern took the correctly marked basket to the pond bed. Wren carried the other two behind her. This time she waited for Fern to show where each belonged.",
        "imageBrief": "Fern carries the red basket toward the pond bed; Wren carries the blue and yellow baskets behind. Pip has set down his pencil and turned the drawing face down. After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "imageAlt": "Fern carries the red basket toward the pond bed; Wren carries the blue and yellow baskets behind. Pip has set down his pencil and turned the drawing face down.",
        "state": "After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "pageDescription": "Fern carries the red basket toward the pond bed; Wren carries the blue and yellow baskets behind. Pip has set down his pencil and turned the drawing face down.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "Back at the table, Wren opened the tray she had missed. Plain cloth strips lay inside. She rubbed one between her fingers, then tied it to the empty banner cord.",
        "imageBrief": "Wren knots a plain cream strip onto the bare cord while all three colored markers remain on their seed baskets in the garden. After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "imageAlt": "Wren knots a plain cream strip onto the bare cord while all three colored markers remain on their seed baskets in the garden.",
        "state": "After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "pageDescription": "Wren knots a plain cream strip onto the bare cord while all three colored markers remain on their seed baskets in the garden.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 13,
        "text": "Pip helped add more plain strips. The breeze lifted them above the table. Wren held up the banner, and Fern stepped underneath without moving a single basket marker.",
        "imageBrief": "Wren and Pip hold a plain-cloth banner above the table while Fern passes beneath it on the grass. After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "imageAlt": "Wren and Pip hold a plain-cloth banner above the table while Fern passes beneath it on the grass.",
        "state": "After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "pageDescription": "Wren and Pip hold a plain-cloth banner above the table while Fern passes beneath it on the grass.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 14,
        "text": "One loose strip tickled the tip of Wren’s hat. She ducked beneath it and laughed. The banner could flutter all it liked; Fern’s colors stayed with the seeds.",
        "imageBrief": "One cream strip on the thin banner cord brushes Wren’s hat while the three marked seed baskets remain in their garden beds. After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "imageAlt": "One cream strip on the thin banner cord brushes Wren’s hat while the three marked seed baskets remain in their garden beds.",
        "state": "After using the drawing to restore the markers on10, Pip puts down his pencil and turns the one paper face down on11; the same blank back remains visible12–14. Seed baskets first move on11, red by pond left and blue/yellow beside right beds.",
        "pageDescription": "One cream strip on the thin banner cord brushes Wren’s hat while the three marked seed baskets remain in their garden beds.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Why was guessing the ribbon order different from using Pip’s drawing?",
        "listenFor": "Guessing could restore the wrong information; the earlier drawing recorded the exact unchanged positions."
      },
      "visual": {
        "page": 9,
        "prompt": "What helps Wren match the drawing to the real table?",
        "lookFor": "The crooked root beside the left basket anchors the order."
      }
    },
    "levelRationale": "Fourteen connected paragraphs, three voices, permission versus assumption, lost information and evidence-based restoration sustain inference across an extended read-together story. Every clue is seeded before use.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "i",
        "sound": "ɪ",
        "word": "ribbon",
        "model": "Say ribbon. Listen for /ɪ/, then find i in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "knots",
          "plain",
          "seeds"
        ],
        "model": "Blend knots: /n/ /ɑ/ /t/ /s/; plain: /p/ /l/ /eɪ/ /n/; seeds: /s/ /iː/ /d/ /z/. In knots, k is silent; ai spells /eɪ/ in plain; ee spells /iː/ and final s spells /z/ in seeds. Frequent-word support: In those, th spells /ð/, o-e spells /oʊ/, and s spells /z/. In which, wh spells /w/ and ch spells /tʃ/. In some, o spells /ʌ/ and the final e is silent."
      },
      "highFrequencyWords": [
        "those",
        "which",
        "some"
      ],
      "languagePrep": [
        {
          "word": "marker",
          "meaning": "something used to identify a place or thing"
        },
        {
          "word": "decoration",
          "meaning": "something added for its appearance"
        },
        {
          "word": "order",
          "meaning": "the places things have in a sequence"
        }
      ],
      "connectedReading": "Read together without pre-explaining the mistake. Retell the permission, wrong assumption, failed guess and checked repair.",
      "fluency": "Pause at Wren’s failure to answer on page 7, then let the checked repair paragraphs flow in linked phrases."
    },
    "reviewedTextFingerprint": "fnv1a64:b1550ade377f2bc5",
    "reviewedManuscriptSha256": "448418e3317ffa8a8c0bf83bffaa19c4f3c695488f2e4d79b3b73cc864d838a5",
    "readingMode": "supported-read-together",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-19",
    "number": 19,
    "title": "Stone’s Flower in Pieces",
    "type": "fiction",
    "appLevel": "G",
    "level": "C",
    "readingBandProfile": "extended",
    "interestAge": "7–9",
    "storyBibleReview": {
      "kind": "fiction",
      "canonIds": [
        "MOON-STONE",
        "MOON-PIP",
        "MOON-LUNA"
      ],
      "storySpine": "Stone wants a flower for a bare garden patch, but delicate clay fails under his broad hands and a large stone arrangement cannot pass through the gate; he carries and assembles its parts.",
      "failedAttempt": "Tiny clay petals squash; the larger arranged flower is too wide to carry through the narrow gate on its board.",
      "turn": "Stone notices that the flower is already made of separate parts and plans to assemble it at its destination.",
      "resolution": "He clears the blocked path, transports the pieces separately and lays the complete six-petaled flower in the bare patch."
    },
    "setting": "A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon.",
    "props": [
      "One small lump of soft gray clay for failed first flower",
      "One broad flat carrying board",
      "Six smooth flat pale petal stones and one round golden center stone",
      "One cleared path and narrow gate",
      "Pip’s small blue watering can"
    ],
    "coverBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. Stone holds the broad board level with the seven-stone flower: six pale petals around one golden center. Pip stands by the narrow gate and Luna perches above it. The board is visibly wider than the gateway. Preserve Stone at 2–3 times Pip’s height with smooth original model and tan tunic.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "A bare patch waited inside the garden gate. Stone wanted to put a flower there that would stay bright after the blossoms fell. Pip brought him a little lump of clay.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone and Pip look through the narrow gate toward a bare patch. Exact state: Original smooth giant Stone 2–3 times Pip; clay introduced.",
        "imageAlt": "Pip brings clay to Stone beside the open garden gate.",
        "state": "Original smooth giant Stone 2–3 times Pip; clay introduced.",
        "pageDescription": "Pip brings clay to Stone beside the open garden gate.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "Stone pinched six tiny petals around a small clay middle. When he lifted the flower, two petals flattened under his broad thumb. He set the soft shape down again.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone’s large thumb flattens two tiny clay petals as he tries to lift the flower. Exact state: One failed clay flower; no broken skin or sharp tools.",
        "imageAlt": "Stone’s broad thumb flattens two petals of the small clay flower.",
        "state": "One failed clay flower; no broken skin or sharp tools.",
        "pageDescription": "Stone’s broad thumb flattens two petals of the small clay flower.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "“Too small for these,” Stone said, spreading his hands. Beyond the path lay smooth flat stones. He chose six pale ones and a round golden stone for the center.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone selects six pale flat stones and one round golden center stone. Exact state: Seven exact stones; clay remains on table.",
        "imageAlt": "Stone chooses six pale stones and one golden stone.",
        "state": "Seven exact stones; clay remains on table.",
        "pageDescription": "Stone chooses six pale stones and one golden stone.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "Pip found a broad board, and Stone arranged the flower on top. Six pale petals circled the golden middle. Luna landed nearby and looked down at the shape.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone arranges six stones around one center on a broad board. Exact state: All seven stones on board; Luna natural feather wings and glasses.",
        "imageAlt": "Stone arranges seven stones on a broad board while Pip and Luna watch.",
        "state": "All seven stones on board; Luna natural feather wings and glasses.",
        "pageDescription": "Stone arranges seven stones on a broad board while Pip and Luna watch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Stone lifted the board with both hands. The flower stayed together, but the board nearly filled the path. Pip walked ahead to open the narrow garden gate.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone carries the broad board toward the gate while Pip goes ahead. Exact state: Both hands under board; stones lie flat; scale preserved.",
        "imageAlt": "Stone carries the board while Pip opens the garden gate.",
        "state": "Both hands under board; stones lie flat; scale preserved.",
        "pageDescription": "Stone carries the board while Pip opens the garden gate.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "At the gate, the board stopped against both posts. Stone tilted it, and one petal slid. Pip called for him to keep it flat, so Stone lowered the board.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone lowers the too-wide board as one pale petal slides slightly inward. Exact state: One petal shifts but remains on board; no hidden breakage.",
        "imageAlt": "The wide board stops at the gate as Pip warns Stone.",
        "state": "One petal shifts but remains on board; no hidden breakage.",
        "pageDescription": "The wide board stops at the gate as Pip warns Stone.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "The board now blocked the path. Pip could not bring his small watering can through. Stone moved the board back to the clearing before he tried anything else.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone moves the board aside so Pip and his watering can can pass. Exact state: Immediate social impact repaired; gate unobstructed.",
        "imageAlt": "Stone moves the board aside so Pip can carry his watering can through.",
        "state": "Immediate social impact repaired; gate unobstructed.",
        "pageDescription": "Stone moves the board aside so Pip can carry his watering can through.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "Luna watched Stone replace the slipped petal. “Does the flower have to travel all at once?” she asked. Stone rested one broad finger beside the golden middle.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Luna observes while Stone returns the slipped petal beside the center. Exact state: Question prompts Stone, not an omniscient solution command.",
        "imageAlt": "Stone replaces a petal while Luna watches and Pip waits by the clear gate.",
        "state": "Question prompts Stone, not an omniscient solution command.",
        "pageDescription": "Stone replaces a petal while Luna watches and Pip waits by the clear gate.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "Stone lifted just the golden center. It fit easily through the gate, even in his large hand. He carried it to the bare patch and placed it in the middle.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone carries only the round golden stone through the gate. Exact state: Six pale petals remain on board; center moved intentionally.",
        "imageAlt": "Stone carries the golden center through the clear gate.",
        "state": "Six pale petals remain on board; center moved intentionally.",
        "pageDescription": "Stone carries the golden center through the clear gate.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "Pip carried one small petal, and Stone carried the others in two trips. They set the stones beside the patch. The narrow gate stayed clear between every trip.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Pip carries one pale stone while Stone brings others through the clear gate. Exact state: Transport sequence explicit; total six petals, no duplicates.",
        "imageAlt": "Pip and Stone carry the last petal stones to the garden patch.",
        "state": "Transport sequence explicit; total six petals, no duplicates.",
        "pageDescription": "Pip and Stone carry the last petal stones to the garden patch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "Stone knelt outside the patch and placed the petals around the center. From his low view, two looked closer together than the rest. He paused before pressing them down.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone kneels and examines the six stones spaced around the golden center. Exact state: Six petals arrived; two crowded, no count change.",
        "imageAlt": "Stone checks the uneven spaces between the petal stones.",
        "state": "Six petals arrived; two crowded, no count change.",
        "pageDescription": "Stone checks the uneven spaces between the petal stones.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "Luna flew to a low branch above the patch. She pointed one feathered wing toward the crowded pair. Stone moved a petal, then checked the spaces with his finger.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Luna indicates the crowded pair from above while Stone shifts one petal. Exact state: Feather wing, no hand; Stone makes final adjustment.",
        "imageAlt": "Luna points a feathered wing while Stone adjusts a petal.",
        "state": "Feather wing, no hand; Stone makes final adjustment.",
        "pageDescription": "Luna points a feathered wing while Stone adjusts a petal.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 13,
        "text": "Now six pale petals surrounded the golden middle with even spaces. Pip poured water onto the soil nearby. The stone flower stayed firm, and the path remained open.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. The completed six-petaled stone flower lies flat in the bare patch. Exact state: Seven stones correct; no water aimed at moving pieces; path clear.",
        "imageAlt": "Pip waters beside the completed stone flower.",
        "state": "Seven stones correct; no water aimed at moving pieces; path clear.",
        "pageDescription": "Pip waters beside the completed stone flower.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 14,
        "text": "Stone held his broad hands beside the finished flower. Nothing needed pinching, and nothing needed carrying. Pip set the squashed clay flower near it. “A little one for company.”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve the approved original Moonwood character identities and proportions, including smooth-skinned Stone rather than the rocky expansion model. Stone is 2–3 times Pip height; Fern has green skin and frond hair; Luna has feather wings and round glasses. Landscape, no generated lettering. A dry clearing beside Hollow Oak, a narrow garden gate and one bare circular soil patch beyond it in late afternoon. Stone rests his hands beside the large stone flower while Pip places the failed small clay flower nearby. Exact state: Original clay callback; two flowers distinct; repair and goal complete.",
        "imageAlt": "Pip places the small clay flower beside Stone’s finished flower.",
        "state": "Original clay callback; two flowers distinct; repair and goal complete.",
        "pageDescription": "Pip places the small clay flower beside Stone’s finished flower.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "How did Stone change the plan after the gate stopped him?",
        "listenFor": "He moved the parts separately and assembled the flower in its final place; he also cleared the path."
      },
      "visual": {
        "page": 6,
        "prompt": "What would happen if Stone tipped the board farther?",
        "lookFor": "The loose stone petals could slide; keeping it flat matters."
      }
    },
    "levelRationale": "Extended paragraphs link two different scale failures, an affected companion, transport state and a perspective check. Sustained object tracking and three-character inference support G read-together placement.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "o-e",
        "sound": "oʊ",
        "word": "stone",
        "model": "Say stone. Listen for /oʊ/, then find o and the final e working together around n. Read the whole word again."
      },
      "decoding": {
        "words": [
          "flat",
          "gate",
          "stone"
        ],
        "model": "Blend flat: /f/ /l/ /æ/ /t/; gate: /g/ /eɪ/ /t/; stone: /s/ /t/ /oʊ/ /n/. The split spellings a-e and o-e represent /eɪ/ and /oʊ/. Frequent-word support: In could, ou spells /ʊ/ and l is silent. In would, ou spells /ʊ/ and l is silent. In two, w is silent and o spells /uː/."
      },
      "highFrequencyWords": [
        "could",
        "would",
        "two"
      ],
      "languagePrep": [
        {
          "word": "petal",
          "meaning": "one part around a flower’s center"
        },
        {
          "word": "tilted",
          "meaning": "sloped away from flat"
        },
        {
          "word": "surrounded",
          "meaning": "went all around"
        }
      ],
      "connectedReading": "Read together, tracking the seven stone pieces and explaining why assembling at the destination works.",
      "fluency": "Reread the gate scene with urgency in Pip’s warning, then slow for Stone’s careful rearrangement."
    },
    "reviewedTextFingerprint": "fnv1a64:9a12d22bd00c2c93",
    "reviewedManuscriptSha256": "06caf96e74877bf7bb79bdf71cd86565d437c17b63329e7e23a50a5114c5da4a",
    "readingMode": "supported-read-together",
    "additionalPrerequisites": []
  },
  {
    "id": "bright-ideas-20",
    "number": 20,
    "title": "Beneath Our Street",
    "type": "nonfiction",
    "appLevel": "H",
    "level": "READ_ALOUD",
    "readingBandProfile": "read-aloud",
    "interestAge": "5–9",
    "storyBibleReview": {
      "kind": "nonfiction",
      "canonIds": [
        "SMALL-SAM",
        "SMALL-DOT",
        "SMALL-DAD"
      ],
      "topicQuestion": "How do separate hidden networks connect everyday things above one example street?",
      "progression": "Follow supply water, used water, rainfall drainage and electrical power separately; compare their routes and reassemble the visible street.",
      "synthesis": "An ordinary street can cover several different systems; their separate connections explain different jobs, and actual places vary.",
      "scienceSources": [
        {
          "title": "EPA: Drinking Water Distribution System Tools and Resources",
          "url": "https://www.epa.gov/dwreginfo/drinking-water-distribution-system-tools-and-resources",
          "evidence": "A distribution network connects treatment/source to consumers through pipes, storage, pumps and valves.",
          "checked": "2026-10-28"
        },
        {
          "title": "USGS: How Water Is Supplied to Homes",
          "url": "https://www.usgs.gov/water-science-school/science/water-qa-how-water-supplied-our-homes",
          "evidence": "An elevated tank is one way a public water system supplies homes through pipes using gravity; arrangements vary.",
          "checked": "2026-10-28"
        },
        {
          "title": "CDC: How Water Treatment Works",
          "url": "https://www.cdc.gov/drinking-water/about/how-water-treatment-works.html",
          "evidence": "Drinking-water treatment aims to meet safety standards; process choices depend on source water.",
          "checked": "2026-10-28"
        },
        {
          "title": "EPA: Municipal Wastewater",
          "url": "https://www.epa.gov/npdes/municipal-wastewater",
          "evidence": "Sewers collect used water and carry it to treatment; separate and combined systems both exist.",
          "checked": "2026-10-28"
        },
        {
          "title": "NYC Department of Environmental Protection: Wastewater Treatment Process",
          "url": "https://www.nyc.gov/site/dep/water/wastewater-treatment-process.page",
          "evidence": "Treatment separates solids, uses biological processes and disinfects to reduce disease-causing microorganisms; do not imply sterile water.",
          "checked": "2026-10-28"
        },
        {
          "title": "EPA: Combined Sewer Overflow Basics",
          "url": "https://www.epa.gov/npdes/combined-sewer-overflow-basics",
          "evidence": "In a separate system, wastewater and stormwater use different pipes; a combined system shares pipes.",
          "checked": "2026-10-28"
        },
        {
          "title": "UK Power Networks: Underground Cables and Overhead Lines",
          "url": "https://www.ukpowernetworks.co.uk/help/whats-the-difference-between-underground-cables-and-overhead-lines",
          "evidence": "Electricity can reach homes through underground cables or overhead lines; underground cables are common in built-up areas.",
          "checked": "2026-10-28"
        },
        {
          "title": "HSE: Underground Cables",
          "url": "https://www.hse.gov.uk/electricity/underground.htm",
          "evidence": "Underground cables require trained location and maintenance; drawings indicate routes, not perfect exact positions.",
          "checked": "2026-10-28"
        }
      ]
    },
    "setting": "One community-room table with a working street model. All three people stand on the floor. A blue-framed window is on the left and a teal cupboard is on the right; both foreground and background use crisp outlined flat cartoon shapes.",
    "props": [
      "One tan model base with three gray road panels. The left and right panels stay fixed. Dad holds the center panel on page 1; it lies aside at the back right on pages 2–10, is lowered on page 11 and closes the road on page 12.",
      "Two houses: plain red-roof house on the left and blue-roof cutaway house on the right. Only the right house has a visible silver sink.",
      "Blue water tower on four legs at back left, connected to a small white water-treatment building and one blue supply main with a branch to each house. A pump is visible inside the building only in the page 3 explanatory cutaway.",
      "One brown drain leaves the right sink separately from its blue supply and leads to two covered gray wastewater tanks at back right. Page 6 reveals the tanks' interiors through front cutaway windows, keeping their lids on.",
      "One gray curb grate at front right connects through its own gray pipe to the model river. One orange cable connects the gray power box at lower left to the streetlamp at front left. The four colored systems never join each other.",
      "One red toy bus with blue windows and black wheels stays on the left road until Sam drives it across the closed road on page 12.",
      "One tiny model worker with yellow hardhat, yellow shirt, navy overalls, brown shoes and arms at sides is introduced on the green back-right model grass on page 9 and remains through page 12.",
      "Dad shows one white four-row route plan on page 9. It has colored routes and picture icons with no letters. The same paper lies face down, blank back visible, at the back left of the table on pages 10–12."
    ],
    "coverBrief": "Dad holds the single removable center road panel while Sam lifts the red bus and Dot watches the four separate colored routes beneath the model street. All six shoes are on the floor. Two houses and one visible right-house sink. Clean bright outlined flat cartoon throughout the room, window and model; no title lettering.",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Sam parks a toy bus on a model street. Dot turns a tiny tap, but the model sink stays dry. “Where would real water come from?” she asks. Dad lifts a road panel. Beneath it lie several routes, each going somewhere different.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dad lifts one model road panel while Sam parks a toy bus and Dot points to the model sink. Exact state: Display model, not live plumbing; routes partly revealed; no real open service shaft.",
        "imageAlt": "Dad lifts the center road panel while Sam parks the red bus and Dot touches the model faucet.",
        "state": "The center panel is in Dad's hands. All six shoes stand on the floor. The blue supply, brown drain, gray rainwater pipe and orange cable stay separate.",
        "pageDescription": "Dad lifts the center road panel while Sam parks the red bus and Dot touches the model faucet.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 2,
        "text": "“This is one example street,” Dad says. “Real streets do not all have the same pipes.” Blue model pipes lead toward the houses. Brown pipes lead away. A gray drain and an orange cable follow other routes. The colors help us track this model; real pipes may look different.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. The open model shows four separated color-coded routes beneath the road. Exact state: Blue supply/brown sewer/gray storm/orange cable distinct; no crossed joined systems.",
        "imageAlt": "The open street model reveals four separate colored routes beneath the houses and road.",
        "state": "One center panel lies aside at the back right. The red bus stays on the left road. Dad explains while Dot looks beside the right-house sink.",
        "pageDescription": "The open street model reveals four separate colored routes beneath the houses and road.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 3,
        "text": "Dot follows a blue pipe back to a small water tower. “In some towns, pumps lift water into a high tank,” Dad explains. “Gravity helps it flow from there through pipes.” Dot traces the route from the tower toward the houses. The tall tank now has a job.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dot traces the blue supply route from the tower to the two model houses. Exact state: Tower elevated; model pump on source side; no sewer connection to tower.",
        "imageAlt": "Dot points to the blue water tower; a cutaway in the small treatment building reveals a pump inside.",
        "state": "Dot stands on the left and Sam on the right. The explanatory cutaway reveals the existing building's pump, without adding an external pump. The center panel remains aside at back right.",
        "pageDescription": "Dot points to the blue water tower; a cutaway in the small treatment building reveals a pump inside.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 4,
        "text": "The supply pipes branch beneath the street and enter the buildings. Water for drinking has to meet safety standards before people use it. In this example, it comes from a water-treatment plant. “So the tap is near the end of a long route,” Dot says, following the last branch.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dot follows a branch of the blue network into the model sink. Exact state: One supply source/treatment route; no claim all water sources need identical treatment.",
        "imageAlt": "Dot points to the right-house sink at the end of the blue water-supply branch.",
        "state": "Sam is back on the left and Dot on the right. The treatment-building door is closed, hiding the pump inside. Blue supply and brown drain remain visibly separate.",
        "pageDescription": "Dot points to the right-house sink at the end of the blue water-supply branch.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 5,
        "text": "Sam points to the sink’s drain. “Does used water go back that way?” Dad shows him a different pipe. Water from sinks and toilets can enter a sewer. In this street model, the brown sewer carries that used water toward a wastewater-treatment plant, not back to the drinking-water tower.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dad shows Sam the separate brown drain route beneath the model sink. Exact state: Brown route leaves house independently; blue supply remains separate.",
        "imageAlt": "Sam follows the sink drain while Dad points to its separate brown pipe.",
        "state": "Dot stands left and Sam right. The brown drain runs from the right sink toward the same two covered wastewater tanks. The red bus and spare road panel remain in place.",
        "pageDescription": "Sam follows the sink drain while Dad points to its separate brown pipe.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 6,
        "text": "At the wastewater plant, screens catch large bits of waste. Other steps let solids settle, and tiny living things help break down waste. Treatment also reduces harmful germs. Sam moves his finger from tank to tank. “Used water has a longer journey than I thought.”",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. The brown route reaches a model wastewater plant with several simple treatment sections. Exact state: No direct untreated reuse connection; no promised total removal of everything.",
        "imageAlt": "Sam traces the route between two covered wastewater tanks shown with front cutaway windows.",
        "state": "The first tank's front cutaway shows screening and settling; the second shows aeration bubbles. Both tank lids stay on. No extra tank or joined blue and brown route is introduced.",
        "pageDescription": "Sam traces the route between two covered wastewater tanks shown with front cutaway windows.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 7,
        "text": "Dot finds a grate beside the model curb. “Rain goes here,” she says. In this example, a separate storm pipe carries runoff toward a waterway. Some places combine rainwater and sewage in one system instead. “Another journey,” Dot says, moving her finger from the curb to the little river.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dot traces the gray curb-drain pipe to a model waterway. Exact state: Separate example retained; combined system described, not mixed into same illustration.",
        "imageAlt": "Dot points to the curb grate and its separate gray pipe leading toward the model river.",
        "state": "Dot stands right, Sam left. Dot has one pointing hand and one other arm; no extra hand. The blue, brown and orange routes remain distinct.",
        "pageDescription": "Dot points to the curb grate and its separate gray pipe leading toward the model river.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 8,
        "text": "The orange route has no water in it. It represents an electrical cable. Cables can carry electricity beneath streets to buildings and lights. Elsewhere, wires may run above the ground on poles. “The streetlamp needs a connection too,” Sam says, tracing the cable to its base.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Sam traces the orange cable from the power connection to the model streetlamp. Exact state: Cable solid insulated line; no water channel or visible electrical sparks.",
        "imageAlt": "Sam points beside the orange cable where it enters the streetlamp base.",
        "state": "One orange cable leads from the lower-left power box to the same front-left lamp. Dot and Dad watch; the red bus remains on the left road.",
        "pageDescription": "Sam points beside the orange cable where it enters the streetlamp base.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 9,
        "text": "Sam notices a model worker beside a loose road panel. “How do workers find the right pipe?” he asks. “They use plans and special tools,” Dad says. Trained crews locate buried equipment, check problems, and make repairs. A street can look still while people keep its hidden systems working.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dad shows a simple route plan beside a model maintenance worker and a loose road panel. Exact state: Children remain at safe display; no real digging, open trench or operational tool use.",
        "imageAlt": "Dad shows a four-row route plan beside a tiny model worker in a yellow hardhat.",
        "state": "Dad holds the single plan with two hands. Its four rows show blue water, brown drainage, gray rainwater and orange electricity with picture icons. Sam points to it. The worker first appears on the back-right green model grass.",
        "pageDescription": "Dad shows a four-row route plan beside a tiny model worker in a yellow hardhat.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 10,
        "text": "“One big tunnel for everything?” Sam asks. Dot shakes her head and follows the separate model routes. Drinking water comes in, used water goes away, and the cable carries electricity. Their jobs differ, so their connections matter. Dot puts her finger between the blue and brown pipes. There is a gap all along.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Dot points to separated supply, sewer and cable routes under the same road corridor. Exact state: No single combined utility tube; each route remains attached to its intended endpoint.",
        "imageAlt": "Dot places her pointing fingertip in the tan gap between the blue supply pipe and brown drainpipe.",
        "state": "Her fingertip touches neither pipe. The plan now lies face down, blank back visible, at the back left of the table. The worker and spare road panel remain at the back right; the center road gap is empty.",
        "pageDescription": "Dot places her pointing fingertip in the tan gap between the blue supply pipe and brown drainpipe.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 11,
        "text": "Before replacing the road, Dot traces each route once more. Sam checks the houses, lamp, and curb drain above them. They match each visible object to its hidden connection. Then they lower the panels without moving any pipes. The street looks ordinary again, but now they can explain what it covers.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Sam and Dot replace the road panels after checking the model endpoints. Exact state: All networks stay fixed; final panel partly lifted for visible continuity.",
        "imageAlt": "Sam and Dot lower the single center road panel back into its gap.",
        "state": "The plan stays face down at back left. The worker stays on back-right green model grass. Both children use natural hands to lower the same panel; there is no second spare panel.",
        "pageDescription": "Sam and Dot lower the single center road panel back into its gap.",
        "embeddedImageText": ""
      },
      {
        "pageNumber": 12,
        "text": "Sam drives the bus past the little houses. “Water coming in. Used water going out. Power for the light.” Dot taps the road gently. “All underneath this quiet street.” “Beep, beep!” Sam says. Dot laughs. The model street is quiet underneath, but the bus is not.",
        "imageBrief": "Use the built-in image generator. Clean, clear, bright cartoon illustration with crisp consistent outlines, simple flat colors and readable shapes. No embossed relief, patchy or daubed paint, painterly/gouache effects, canvas grain, paper texture or simulated brushwork. Preserve locked Small Steps character identities, clothes and proportions, translating the rendering to this clean cartoon style. Landscape, full composition with action inset; no generated text, labels, numbers or pseudo-writing. A community discovery room with a large removable-top street model; Sam, Dot and Dad remain beside the model throughout. Sam drives the toy bus along the reassembled street while Dot points toward the model sink. Exact state: Road whole; lamp and houses in original places; model tap remains a model, not magically live.",
        "imageAlt": "Sam drives the red bus along the closed road while Dot taps its gray surface.",
        "state": "All three road panels form a continuous top surface. The model's front cutaway still reveals four separate routes. The worker remains on back-right green grass and the plan stays face down at back left.",
        "pageDescription": "Sam drives the red bus along the closed road while Dot taps its gray surface.",
        "embeddedImageText": ""
      }
    ],
    "discussion": {
      "oral": {
        "prompt": "Choose one thing above the street and explain its hidden connection. Why must we keep the routes separate?",
        "listenFor": "Supply brings water, sewer carries used water away, storm route carries runoff in this example, cable carries power; different jobs and destinations."
      },
      "visual": {
        "page": 10,
        "prompt": "Which routes pass near one another without joining?",
        "lookFor": "Blue water, brown sewer and orange cable share space beneath the road but remain separate."
      }
    },
    "levelRationale": "Twelve sustained paragraphs combine dialogue, four invisible systems, model-versus-reality caveats and cross-page synthesis. The sustained investigation warrants supported H shared reading, with no independent C placement or decodability claim.",
    "foundationsGuide": {
      "soundLetter": {
        "grapheme": "ai",
        "sound": "eɪ",
        "word": "drain",
        "model": "Say drain. Listen for /eɪ/, then find ai in the printed word. Read the whole word again."
      },
      "decoding": {
        "words": [
          "tap",
          "drain",
          "street"
        ],
        "model": "Blend tap: /t/ /æ/ /p/; drain: /d/ /r/ /eɪ/ /n/; street: /s/ /t/ /r/ /iː/ /t/. Point to ai for /eɪ/ and ee for /iː/; keep each initial consonant audible. Frequent-word support: Model where as /wɛr/ in the U.S. voice; wh spells /w/ and ere spells /ɛr/. In would, ou spells /ʊ/ and l is silent. In some, o spells /ʌ/ and the final e is silent."
      },
      "highFrequencyWords": [
        "where",
        "would",
        "some"
      ],
      "languagePrep": [
        {
          "word": "routes",
          "meaning": "ways that lead from one place to another"
        },
        {
          "word": "wastewater",
          "meaning": "water that has been used and needs treatment"
        },
        {
          "word": "runoff",
          "meaning": "rainwater moving over the ground"
        },
        {
          "word": "cable",
          "meaning": "covered wires that can carry electricity"
        }
      ],
      "connectedReading": "Read together in short sections. Let the child read selected printed words and sentences, then explain one complete route with its start and destination.",
      "fluency": "Reread one paragraph at a time, grouping explanations into meaning units. Narration or word help remains supported practice, not evidence of independent reading."
    },
    "reviewedTextFingerprint": "fnv1a64:ba5d6cb74aaf2747",
    "reviewedManuscriptSha256": "33e71ec8d18e20aaad74f608e1c060407f87da3ed38ac3c390e6676930973cbc",
    "readingMode": "supported-read-together",
    "additionalPrerequisites": []
  }
]);

export const GUIDED_READING_BRIGHT_IDEAS_BOOKS = Object.freeze(MANUSCRIPTS.map(row => {
  const folder = "/guided-reading/bright-ideas/book-" + String(row.number).padStart(2, "0");

  return deepFreeze({
    ...row, guidedReadingLevel: row.level,
    collection: "Bright Ideas", seriesTitle: "Bright Ideas", seriesId: "bright-ideas", seriesOrder: row.number,
    active: true, qaStatus: "approved", narrationProfile: "leda",
    ...(row.level === "READ_ALOUD" ? { independentReadingLevel: null } : {}),
    cast: row.storyBibleReview.canonIds,
    coverImage: folder + "/cover.webp", cover: folder + "/cover.webp", coverUrl: folder + "/cover.webp",
    pages: row.pages.map(page => ({
      ...page, image: folder + "/page-" + String(page.pageNumber).padStart(2, "0") + ".webp",
      pageAudioText: page.text, narrationProfile: "leda",
      active: true, qaStatus: "approved", narrationNeedsRebuild: true
    }))
  });
}));

export const GUIDED_READING_DISCUSSION_PROMPTS_BRIGHT_IDEAS = deepFreeze(Object.fromEntries(
  GUIDED_READING_BRIGHT_IDEAS_BOOKS.map(book => [book.id, book.discussion])
));

export const GUIDED_READING_BRIGHT_IDEAS_METADATA = deepFreeze(Object.fromEntries(
  GUIDED_READING_BRIGHT_IDEAS_BOOKS.map(book => [book.id, {readingBandProfile: book.readingBandProfile, readingMode: book.readingMode}])
));

export const GUIDED_READING_BRIGHT_IDEAS_LEVEL_REVIEWS = deepFreeze(Object.fromEntries(
  GUIDED_READING_BRIGHT_IDEAS_BOOKS.map(book => [book.id, {
    appReadingLevel: book.appLevel, rationale: book.levelRationale, reviewedAt: "2026-10-29",
    reviewMethod: "codex-full-manuscript-editorial-review", reviewedTextFingerprint: book.reviewedTextFingerprint
  }])
));
