// Authoritative Story Quest manuscripts and route state.
// Production contract: docs/content/STORY_QUEST_PRODUCTION.md.
// Stable IDs preserve historical progress; contentRevision restarts incompatible routes.
// Early is a phonics track; A/B/C are supported reading profiles, not age claims.

export const storyQuests = [
  {
    "id": "mw_ra_c_01_pip_stone_loud_thing",
    "title": "Pip and Stone: The Loud Thing",
    "level": "C",
    "ageRange": "Ages 5-6",
    "adventureType": "Reading Adventure",
    "skillFocus": "Following sound and tracks; understanding a failed attempt and a changed strategy",
    "cycleFocus": "guided_reading_level_c_story_choice",
    "series": "Moonwood Tales",
    "characters": [
      "Pip",
      "Stone"
    ],
    "location": "Moonwood - Hollow Oak, Fog Marsh, reeds, dark water",
    "targetWords": [
      "Pip",
      "Stone",
      "frog",
      "marsh",
      "tracks",
      "reeds",
      "rock",
      "root",
      "call",
      "family",
      "water",
      "hand"
    ],
    "highFrequencyWords": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "hfw": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "mediaFolder": "pip-stone-loud-thing",
    "sentenceFrame": "",
    "genuineFailurePageId": "p08_stone_calls",
    "coverImageUrl": "/images/story-quests/covers/loud-thing.webp?v=11ed235297df",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "A huge croak shakes Hollow Oak.",
          "Pip and Stone turn toward Fog Marsh.",
          "\"Who is out there?\" says Pip."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p01_start.webp?v=004c78c1ae3e",
        "imageAlt": "Pip and the much taller Stone turn from Hollow Oak toward the misty marsh, startled by one enormous croak beyond the reeds.",
        "audioUrl": "/audio/production/en-US/story_page/a-huge-croak-shakes-hollow-oak-pip-and-stone-turn-toward-fog-marsh-who-i-6ac0877be6.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pip",
          "stone",
          "marsh"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_inside_marsh"
          }
        ]
      },
      {
        "id": "p04_inside_marsh",
        "text": [
          "Pip and Stone reach the marsh.",
          "Reeds shake beside a mossy rock.",
          "Wet tracks cross the mud."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p04_inside_marsh.webp?v=b8f15c82ae87",
        "imageAlt": "Pip and Stone stand on firm ground beside the marsh. Distinct wet frog tracks cross the mud toward a mossy rock half hidden by shaking reeds.",
        "audioUrl": "/audio/production/en-US/story_page/pip-and-stone-reach-the-marsh-reeds-shake-beside-a-mossy-rock-wet-tracks-dbcad70f9c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can they find the caller?",
        "skillTags": [
          "pip",
          "stone",
          "marsh",
          "tracks",
          "reeds",
          "rock"
        ],
        "choices": [
          {
            "label": "Follow the tracks",
            "nextPageId": "p05_tiny_tracks"
          },
          {
            "label": "Part the reeds",
            "nextPageId": "p05_reeds_shake"
          }
        ]
      },
      {
        "id": "p05_tiny_tracks",
        "text": [
          "Pip follows wet tracks to the rock.",
          "Stone leans down.",
          "A tiny foot slips behind the moss."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p05_tiny_tracks.webp?v=35beff9559ee",
        "imageAlt": "Pip crouches beside three clear wet frog prints ending at the mossy rock. Stone bends above him. One tiny green frog foot peeps behind the moss.",
        "audioUrl": "/audio/production/en-US/story_page/pip-follows-wet-tracks-to-the-rock-stone-leans-down-a-tiny-foot-slips-be-9b2ea86579.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pip",
          "stone",
          "tracks",
          "rock"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_mossy_stone"
          }
        ]
      },
      {
        "id": "p05_reeds_shake",
        "text": [
          "Pip parts the reeds beside the rock.",
          "Stone leans down.",
          "Something small opens a very wide mouth."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p05_reeds_shake.webp?v=04babab36036",
        "imageAlt": "Pip holds two reeds apart, revealing a tiny green frog with its mouth opening on the mossy rock. Stone bends to look, remaining much larger than Pip.",
        "audioUrl": "/audio/production/en-US/story_page/pip-parts-the-reeds-beside-the-rock-stone-leans-down-something-small-ope-679254d336.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pip",
          "stone",
          "reeds",
          "rock"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_mossy_stone"
          }
        ]
      },
      {
        "id": "p06_mossy_stone",
        "text": [
          "A tiny frog gives a huge CROAK.",
          "Stone sits down with a thump.",
          "\"That is you?\" says Pip."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p06_mossy_stone.webp?v=2b3c7c5d809e",
        "imageAlt": "The tiny green frog croaks from the rock. Pip stares in surprise. The enormous Stone has landed on his bottom beside Pip, startled by the frog’s big sound.",
        "audioUrl": "/audio/production/en-US/story_page/a-tiny-frog-gives-a-huge-croak-stone-sits-down-with-a-thump-that-is-you-1930c4bcf6.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pip",
          "stone",
          "frog"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_pip_speaks"
          }
        ]
      },
      {
        "id": "p07_pip_speaks",
        "text": [
          "\"I am lost,\" says the frog.",
          "\"I cannot hear my family.\"",
          "\"I can call!\" says Stone."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p07_pip_speaks.webp?v=18460c972259",
        "imageAlt": "The frog faces Pip and Stone from the mossy rock. Stone lifts his head and opens his mouth to offer a call; Pip watches the small frog.",
        "audioUrl": "/audio/production/en-US/story_page/i-am-lost-says-the-frog-i-cannot-hear-my-family-i-can-call-says-stone-2c39ad5735.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "stone",
          "frog",
          "call",
          "family"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_stone_calls"
          }
        ]
      },
      {
        "id": "p08_stone_calls",
        "text": [
          "\"CROAK!\" says Stone.",
          "Pip claps his hands over his ears.",
          "The frog dives behind a root."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p08_stone_calls.webp?v=b0d8ddfaef8c",
        "imageAlt": "Stone gives a loud call with his mouth open. Pip covers both ears. The tiny frog ducks behind a tree root, with only its eyes peeping out.",
        "audioUrl": "/audio/production/en-US/story_page/croak-says-stone-pip-claps-his-hands-over-his-ears-the-frog-dives-behind-f46abedf4c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pip",
          "stone",
          "frog",
          "root"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p09_pip_covers_ears"
          }
        ]
      },
      {
        "id": "p09_pip_covers_ears",
        "text": [
          "Stone closes his mouth.",
          "He lowers one hand beside the root.",
          "The frog peeps out."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p09_pip_covers_ears.webp?v=c8ea51d17d58",
        "imageAlt": "Stone kneels silently, holding one broad open hand low beside the root without touching the frog. The frog cautiously peeps out while Pip lowers his hands.",
        "audioUrl": "/audio/production/en-US/story_page/stone-closes-his-mouth-he-lowers-one-hand-beside-the-root-the-frog-peeps-6b97a9e8b5.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "stone",
          "frog",
          "root",
          "hand"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p09_pip_listens"
          }
        ]
      },
      {
        "id": "p09_pip_listens",
        "text": [
          "Pip cups one ear.",
          "A small croak comes from across the water.",
          "The frog hops out to listen."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p09_pip_listens.webp?v=c9fe9a865636",
        "imageAlt": "Pip cups an ear toward reeds on the far bank. The frog has emerged beside Stone’s open hand and also faces the distant reeds.",
        "audioUrl": "/audio/production/en-US/story_page/pip-cups-one-ear-a-small-croak-comes-from-across-the-water-the-frog-hops-688767f728.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can the frog reach its family?",
        "skillTags": [
          "pip",
          "frog",
          "water"
        ],
        "choices": [
          {
            "label": "Let the frog call",
            "nextPageId": "p09_toadling_calls"
          },
          {
            "label": "Ask Stone to carry",
            "nextPageId": "p08_search_family"
          }
        ]
      },
      {
        "id": "p09_toadling_calls",
        "text": [
          "The frog climbs onto a log.",
          "\"CROAK!\"",
          "Small croaks answer from the reeds."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p09_toadling_calls.webp?v=655dada01d95",
        "imageAlt": "The frog calls from a log on the near bank. Several small green frog faces peer from reeds on the opposite bank. Pip and Stone listen quietly.",
        "audioUrl": "/audio/production/en-US/story_page/the-frog-climbs-onto-a-log-croak-small-croaks-answer-from-the-reeds-281d702664.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "frog",
          "reeds"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p11_toadling_answer"
          }
        ]
      },
      {
        "id": "p11_toadling_answer",
        "text": [
          "The reeds part.",
          "The frog’s family hops onto the log.",
          "Pip and Stone make room."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p11_toadling_answer.webp?v=78e97362bd5c",
        "imageAlt": "The frog’s family has crossed the narrow shallows and joins it on the near-bank log. Pip steps back and Stone moves his huge hand aside, leaving the reunited frogs together.",
        "audioUrl": "/audio/production/en-US/story_page/the-reeds-part-the-frog-s-family-hops-onto-the-log-pip-and-stone-make-ro-59b9db23f9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "pip",
          "stone",
          "reeds",
          "family"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Try the other way to reunite the frogs."
      },
      {
        "id": "p08_search_family",
        "text": [
          "Stone lifts the frog in one palm.",
          "He steps across the shallow water.",
          "Pip walks along the bank."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p08_search_family.webp?v=66dafbd2e038",
        "imageAlt": "Stone stands in ankle-deep water with the tiny frog resting in one open palm, taking a long step toward the far bank. Pip follows on the firm bank.",
        "audioUrl": "/audio/production/en-US/story_page/stone-lifts-the-frog-in-one-palm-he-steps-across-the-shallow-water-pip-w-ad7cbfd6ed.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pip",
          "stone",
          "frog",
          "water"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p10_family_found"
          }
        ]
      },
      {
        "id": "p10_family_found",
        "text": [
          "The frog leaps onto the far bank.",
          "Its family crowds round.",
          "Stone gives a very small wave."
        ],
        "imageUrl": "/images/story-quests/moonwood/pip-stone-loud-thing/p10_family_found.webp?v=501f8066e23d",
        "imageAlt": "The frog lands among its family on the far bank. Stone, still much taller than Pip, gives a tiny finger-wave beside the shallow water. Pip watches the reunion.",
        "audioUrl": "/audio/production/en-US/story_page/the-frog-leaps-onto-the-far-bank-its-family-crowds-round-stone-gives-a-v-396128d5fb.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "stone",
          "frog",
          "family"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Try the other way to reunite the frogs."
      }
    ],
    "shortTitle": "The Loud Thing",
    "hook": "A tiny voice makes a very big noise.",
    "readingSupport": "Listen together or read with an adult; independent reading depends on the child’s taught words and reading experience.",
    "coverImageAlt": "A tiny voice makes a very big noise.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mw_ra_c_02_fern_wren_walking_garden",
    "title": "Fern and Wren: The Walking Garden",
    "level": "C",
    "ageRange": "Ages 5-6",
    "adventureType": "Reading Adventure",
    "skillFocus": "Reading cause and effect; following a stated potion rule and a chosen retrieval method",
    "cycleFocus": "guided_reading_level_c_story_choice",
    "series": "Moonwood Tales",
    "characters": [
      "Fern",
      "Wren"
    ],
    "location": "Moonwood - Fern's garden, Hollow Oak, Crystal Stream",
    "targetWords": [
      "Fern",
      "Wren",
      "plant",
      "pot",
      "pots",
      "purple",
      "green",
      "water",
      "feet",
      "gate",
      "drop"
    ],
    "highFrequencyWords": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "hfw": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "mediaFolder": "fern-wren-walking-garden",
    "sentenceFrame": "",
    "genuineFailurePageId": "p05_too_late",
    "coverImageUrl": "/images/story-quests/covers/walking-garden.webp?v=54345dc71b9f",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "Fern’s little plant droops in its pot.",
          "Wren carries two bottles.",
          "\"My green potion helps leaves,\" she says."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p01_start.webp?v=6a7f4f3e2312",
        "imageAlt": "Fern points to a drooping two-leaf seedling in a small terracotta pot. Wren arrives carrying one green potion bottle and one purple bottle; an empty cauldron and closed book sit nearby.",
        "audioUrl": "/audio/production/en-US/story_page/fern-s-little-plant-droops-in-its-pot-wren-carries-two-bottles-my-green-500b65aec7.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "wren",
          "plant",
          "pot",
          "green"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_recipe"
          }
        ]
      },
      {
        "id": "p02_recipe",
        "text": [
          "\"Purple drops grow feet.",
          "Water washes them away,\" reads Fern.",
          "Wren reaches for the green bottle."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p02_recipe.webp?v=5089ba9a49d0",
        "imageAlt": "Fern reads an open recipe book showing purple drops making feet beneath a pot and blue water washing those feet away. Wren reaches toward the green bottle; the purple bottle stands beside her sleeve.",
        "audioUrl": "/audio/production/en-US/story_page/purple-drops-grow-feet-water-washes-them-away-reads-fern-wren-reaches-fo-ada643110b.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fern",
          "wren",
          "purple",
          "green",
          "water",
          "feet"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_pour_potion"
          }
        ]
      },
      {
        "id": "p03_pour_potion",
        "text": [
          "Wren reaches past the green bottle.",
          "Her sleeve tips the purple one.",
          "Potion splashes from pot to pot."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p03_pour_potion.webp?v=b54872095e31",
        "imageAlt": "Wren’s loose sleeve knocks over the purple bottle as she reaches toward the green one. A connected purple splash runs into the row of terracotta pots, including the small drooping seedling.",
        "audioUrl": "/audio/production/en-US/story_page/wren-reaches-past-the-green-bottle-her-sleeve-tips-the-purple-one-potion-c71d5c24dc.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "wren",
          "pot",
          "purple",
          "green"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_all_walk"
          }
        ]
      },
      {
        "id": "p04_all_walk",
        "text": [
          "Roots poke out beneath the pots.",
          "The pots march through the open gate.",
          "\"Those are not leaves!\" says Wren."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p04_all_walk.webp?v=3c896d4b9431",
        "imageAlt": "The same three terracotta pots march through the open garden gate on pairs of little root-feet. Wren looks from the spilled purple bottle to the departing pots; Fern turns toward the gate.",
        "audioUrl": "/audio/production/en-US/story_page/roots-poke-out-beneath-the-pots-the-pots-march-through-the-open-gate-tho-7cae0ddc08.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "wren",
          "pots",
          "gate"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_too_late"
          }
        ]
      },
      {
        "id": "p05_too_late",
        "text": [
          "Wren grabs for the smallest pot.",
          "It steps over her hands.",
          "Fern hums. Two pots turn."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p05_too_late.webp?v=8b8863f69c57",
        "imageAlt": "Wren kneels reaching for the smallest walking pot, which steps over her open hands. Fern hums beside her; the other two pots turn toward Fern, responding to the sound.",
        "audioUrl": "/audio/production/en-US/story_page/wren-grabs-for-the-smallest-pot-it-steps-over-her-hands-fern-hums-two-po-566c15ea63.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can they bring the pots home?",
        "skillTags": [
          "fern",
          "wren",
          "pot",
          "pots"
        ],
        "choices": [
          {
            "label": "Follow the small pot",
            "nextPageId": "p04_small_plant"
          },
          {
            "label": "Sing to the pots",
            "nextPageId": "p07_sing_softly"
          }
        ]
      },
      {
        "id": "p04_small_plant",
        "text": [
          "The small pot trots toward a round door.",
          "Wren grabs her empty cauldron.",
          "Fern follows with the other pots."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p04_small_plant.webp?v=9e611245fb08",
        "imageAlt": "The small terracotta sprout pot trots toward a low round woodland door. The other two pots follow it in a line, with Fern and Wren behind; Wren carries the empty cauldron.",
        "audioUrl": "/audio/production/en-US/story_page/the-small-pot-trots-toward-a-round-door-wren-grabs-her-empty-cauldron-fe-a2f7558a9e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fern",
          "wren",
          "pot",
          "pots"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_tiny_escape"
          }
        ]
      },
      {
        "id": "p05_tiny_escape",
        "text": [
          "The little pot knocks on the door.",
          "Nobody answers.",
          "Wren holds out her empty cauldron."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p05_tiny_escape.webp?v=da256b83033e",
        "imageAlt": "The little pot taps the closed round door with a root-foot. The door stays closed. Wren crouches holding the empty cauldron open at ground level while the other pots queue behind.",
        "audioUrl": "/audio/production/en-US/story_page/the-little-pot-knocks-on-the-door-nobody-answers-wren-holds-out-her-empt-31750af262.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "wren",
          "pot"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_almost_fixed"
          }
        ]
      },
      {
        "id": "p08_almost_fixed",
        "text": [
          "The pots pile into Wren’s empty cauldron.",
          "\"A pot of pots!\" she says.",
          "She carries them back to the garden."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p08_almost_fixed.webp?v=011b767eef6b",
        "imageAlt": "Wren walks toward the clearly recognisable garden gate carrying her cauldron with all three small terracotta pots nested visibly inside. Fern walks beside her, leaving the closed round door behind.",
        "audioUrl": "/audio/production/en-US/story_page/the-pots-pile-into-wren-s-empty-cauldron-a-pot-of-pots-she-says-she-carr-3b63bd7f10.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pot",
          "pots"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_return_home"
          }
        ]
      },
      {
        "id": "p07_sing_softly",
        "text": [
          "Fern hums a marching tune.",
          "One pot taps a foot.",
          "The other pots turn toward her."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p07_sing_softly.webp?v=36f34f7ab9b2",
        "imageAlt": "Fern stands at her established full height and hums. The smallest pot taps one root-foot in rhythm; the other two pots turn to face her while Wren watches.",
        "audioUrl": "/audio/production/en-US/story_page/fern-hums-a-marching-tune-one-pot-taps-a-foot-the-other-pots-turn-toward-0e4488b9a5.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fern",
          "pot",
          "pots"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_tiny_dance"
          }
        ]
      },
      {
        "id": "p08_tiny_dance",
        "text": [
          "Fern steps backward toward the garden.",
          "The pots dance after her.",
          "Wren holds the gate wide."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p08_tiny_dance.webp?v=939377c8c9e1",
        "imageAlt": "Fern walks backward through the garden gate, leading the same three pots in a dancing line. Wren holds the gate open; the empty cauldron remains beside the garden path.",
        "audioUrl": "/audio/production/en-US/story_page/fern-steps-backward-toward-the-garden-the-pots-dance-after-her-wren-hold-0f13180bbf.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fern",
          "wren",
          "pots",
          "gate"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_return_home"
          }
        ]
      },
      {
        "id": "p08_return_home",
        "text": [
          "Fern lines the pots up by a bowl.",
          "\"Time to wash those feet!\" says Wren.",
          "The smallest pot twirls."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p08_return_home.webp?v=c2da7345be3a",
        "imageAlt": "All three pots are inside the garden again. Wren fills a broad bowl with water from a jug; Fern stands near the smallest pot as it gives a little twirl.",
        "audioUrl": "/audio/production/en-US/story_page/fern-lines-the-pots-up-by-a-bowl-time-to-wash-those-feet-says-wren-the-s-4d5968123f.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Which feet shall they wash?",
        "skillTags": [
          "fern",
          "wren",
          "pot",
          "pots",
          "feet"
        ],
        "choices": [
          {
            "label": "Wash every pot",
            "nextPageId": "p09_plants_settle"
          },
          {
            "label": "Keep one dancer",
            "nextPageId": "p09_silly_garden"
          }
        ]
      },
      {
        "id": "p09_plants_settle",
        "text": [
          "Fern washes the purple feet.",
          "The roots slip back inside each pot.",
          "Wren picks up the green bottle."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p09_plants_settle.webp?v=15358815d3ba",
        "imageAlt": "Fern pours a small cup of water over the last purple root-feet as they retract beneath their terracotta pot. All three pots now sit on the ground; Wren holds the green bottle.",
        "audioUrl": "/audio/production/en-US/story_page/fern-washes-the-purple-feet-the-roots-slip-back-inside-each-pot-wren-pic-e7d5bfb5e9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fern",
          "wren",
          "pot",
          "purple",
          "green",
          "feet"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p10_garden_safe"
          }
        ]
      },
      {
        "id": "p10_garden_safe",
        "text": [
          "Wren adds one green drop.",
          "The small plant lifts its leaves.",
          "\"Leaves!\" says Wren. \"At last!\""
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p10_garden_safe.webp?v=979c8837f461",
        "imageAlt": "Wren carefully releases one clearly visible green drop onto the same smallest seedling. It has no feet and its two leaves stand upright. Fern watches beside the other resting pots.",
        "audioUrl": "/audio/production/en-US/story_page/wren-adds-one-green-drop-the-small-plant-lifts-its-leaves-leaves-says-wr-066fe234f2.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "wren",
          "plant",
          "green",
          "drop"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Would you keep a dancing pot?"
      },
      {
        "id": "p09_silly_garden",
        "text": [
          "Fern washes the other pots.",
          "The smallest pot twirls beside Wren.",
          "\"Those feet can stay!\" says Fern."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p09_silly_garden.webp?v=d80892b97c89",
        "imageAlt": "Two washed terracotta pots rest without feet beside the water bowl. The smallest pot dances on its two root-feet between Fern and Wren inside the closed garden gate; its leaves lift as it twirls.",
        "audioUrl": "/audio/production/en-US/story_page/fern-washes-the-other-pots-the-smallest-pot-twirls-beside-wren-those-fee-6ea7454e07.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fern",
          "wren",
          "pot",
          "pots",
          "feet"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p12_ending_calm"
          }
        ]
      },
      {
        "id": "p12_ending_calm",
        "text": [
          "Wren gives the dancer one green drop.",
          "Its leaves lift. Its feet keep tapping.",
          "\"Leaves and feet!\" says Wren."
        ],
        "imageUrl": "/images/story-quests/moonwood/fern-wren-walking-garden/p12_ending_calm.webp?v=39e2256574a4",
        "imageAlt": "Wren releases one green drop onto the smallest dancing seedling. Its two leaves rise upright while its purple root-feet keep tapping. Fern watches beside the other two washed, resting pots inside the closed garden gate.",
        "audioUrl": "/audio/production/en-US/story_page/wren-gives-the-dancer-one-green-drop-its-leaves-lift-its-feet-keep-tappi-d65e47f77e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "wren",
          "green",
          "feet",
          "drop"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Would you keep a dancing pot?"
      }
    ],
    "shortTitle": "The Walking Garden",
    "hook": "Wren’s potion gives the flowerpots feet.",
    "readingSupport": "Listen together or read with an adult; independent reading depends on the child’s taught words and reading experience.",
    "coverImageAlt": "Wren’s potion gives the flowerpots feet.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mw_ra_c_03_luna_burrow_star_shell_door",
    "title": "Luna and Burrow: The Star Shell Door",
    "level": "C",
    "ageRange": "Ages 5-6",
    "adventureType": "Reading Adventure",
    "skillFocus": "Following a map, comparing routes, and seeing how a broken object can still be used",
    "cycleFocus": "guided_reading_level_c_story_choice",
    "series": "Moonwood Tales",
    "characters": [
      "Luna",
      "Burrow"
    ],
    "location": "Moonwood - Hollow Oak, Crystal Stream, old roots, star room",
    "targetWords": [
      "Luna",
      "Burrow",
      "shell",
      "map",
      "door",
      "stars",
      "stream",
      "roots",
      "stone",
      "wing",
      "point",
      "path"
    ],
    "highFrequencyWords": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "hfw": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "mediaFolder": "luna-burrow-star-shell-door",
    "sentenceFrame": "",
    "genuineFailurePageId": "p05_cracked_shell",
    "coverImageUrl": "/images/story-quests/covers/star-shell-door.webp?v=fe44371cb864",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "Luna finds a star shell.",
          "A folded map lies beneath it.",
          "\"A star room! Let’s look!\" says Burrow."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p01_start.webp?v=bc7f88c7d050",
        "imageAlt": "Luna looks at a palm-sized five-point star shell lying beside a folded map under a tree. Burrow unfolds the map and points to a clear drawing of a round door and a room containing stars.",
        "audioUrl": "/audio/production/en-US/story_page/luna-finds-a-star-shell-a-folded-map-lies-beneath-it-a-star-room-let-s-l-0c8b0437cb.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "luna",
          "burrow",
          "shell",
          "map"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_moon_map"
          }
        ]
      },
      {
        "id": "p02_moon_map",
        "text": [
          "Moonlight lights a path on the map.",
          "Burrow traces it toward old roots.",
          "Luna packs the shell."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p02_moon_map.webp?v=225b21487ede",
        "imageAlt": "Under a full moon, a silver route glows on the same map from the stream to a round door among roots. Burrow traces it. Luna uses her beak and wing to place the star shell into a small satchel.",
        "audioUrl": "/audio/production/en-US/story_page/moonlight-lights-a-path-on-the-map-burrow-traces-it-toward-old-roots-lun-3b37a4eb6c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "luna",
          "burrow",
          "shell",
          "map",
          "roots",
          "path"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_stream_path"
          }
        ]
      },
      {
        "id": "p03_stream_path",
        "text": [
          "The path runs across the stream.",
          "Stones lead to the far bank.",
          "Roots hide a low tunnel."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p03_stream_path.webp?v=68b54cc6f0a4",
        "imageAlt": "Luna and Burrow stand at a narrow stream. Two clearly distinct routes lead to the same root-covered bank: stepping stones across the water and a low opening beneath a large arching root.",
        "audioUrl": "/audio/production/en-US/story_page/the-path-runs-across-the-stream-stones-lead-to-the-far-bank-roots-hide-a-a8bde787f0.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Which way shall they try?",
        "skillTags": [
          "stream",
          "roots",
          "path"
        ],
        "choices": [
          {
            "label": "Cross the stones",
            "nextPageId": "p04_upstream"
          },
          {
            "label": "Dig through the roots",
            "nextPageId": "p04_burrow_digs"
          }
        ]
      },
      {
        "id": "p04_upstream",
        "text": [
          "Burrow steps onto a wet stone.",
          "His back foot slips.",
          "Luna holds out one strong wing."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p04_upstream.webp?v=baaa94610b37",
        "imageAlt": "Burrow’s rear paw slips on the first broad wet stepping stone. Luna stands on the next stone with one feathered wing extended to him; the banks are close and water shallow.",
        "audioUrl": "/audio/production/en-US/story_page/burrow-steps-onto-a-wet-stone-his-back-foot-slips-luna-holds-out-one-str-0910bbeb09.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "luna",
          "burrow",
          "stone",
          "wing"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_cross_stones"
          }
        ]
      },
      {
        "id": "p05_cross_stones",
        "text": [
          "Burrow holds Luna’s wing and stops wobbling.",
          "They cross to the far bank.",
          "The round door waits among the roots."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p05_cross_stones.webp?v=711dfd22d935",
        "imageAlt": "Burrow steadies himself by holding the edge of Luna’s feathered wing as they reach the far bank. A round stone door with an empty star-shaped recess is visible among the roots.",
        "audioUrl": "/audio/production/en-US/story_page/burrow-holds-luna-s-wing-and-stops-wobbling-they-cross-to-the-far-bank-t-da64a4d2c9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "burrow",
          "door",
          "roots",
          "wing"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_hidden_door"
          }
        ]
      },
      {
        "id": "p04_burrow_digs",
        "text": [
          "Burrow digs under the thick roots.",
          "Luna follows through the tunnel.",
          "His nose bumps a round stone door."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p04_burrow_digs.webp?v=f4876fd8621c",
        "imageAlt": "Burrow has dug a short tunnel under the roots to the round stone door. His nose gently touches its closed surface; Luna follows behind, wearing the same small satchel.",
        "audioUrl": "/audio/production/en-US/story_page/burrow-digs-under-the-thick-roots-luna-follows-through-the-tunnel-his-no-8bba7809f3.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "luna",
          "burrow",
          "door",
          "roots",
          "stone"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_hidden_door"
          }
        ]
      },
      {
        "id": "p06_hidden_door",
        "text": [
          "A star-shaped hole sits in the door.",
          "Luna unpacks the shell.",
          "Burrow pushes it in upside down."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p06_hidden_door.webp?v=eeef846dbc39",
        "imageAlt": "At the same round stone door, Luna’s open satchel rests beside her. Burrow pushes the five-point star shell upside down against the shallow star-shaped recess; its downward point does not match the recess’s upward point.",
        "audioUrl": "/audio/production/en-US/story_page/a-star-shaped-hole-sits-in-the-door-luna-unpacks-the-shell-burrow-pushes-195cb36b54.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "luna",
          "burrow",
          "shell",
          "door"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_cracked_shell"
          }
        ]
      },
      {
        "id": "p05_cracked_shell",
        "text": [
          "The shell sticks.",
          "Burrow gives it one hard push.",
          "A point snaps off. The door stays shut."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p05_cracked_shell.webp?v=408cc421fbb1",
        "imageAlt": "Burrow presses the misaligned star shell into the recess. One distinct point has snapped off and lies on the stone below; the larger four-point remainder stays caught against the closed door. Luna watches with natural wings, no hands or spectacles.",
        "audioUrl": "/audio/production/en-US/story_page/the-shell-sticks-burrow-gives-it-one-hard-push-a-point-snaps-off-the-doo-0af4958837.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "burrow",
          "shell",
          "door",
          "point"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_burrow_repairs"
          }
        ]
      },
      {
        "id": "p05_burrow_repairs",
        "text": [
          "Burrow picks up the broken point.",
          "He lays both pieces on the map.",
          "\"They still fit,\" says Luna."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p05_burrow_repairs.webp?v=33d9c0df23df",
        "imageAlt": "Burrow lays the detached point beside the matching four-point shell remainder on his unfolded map. Together the two pieces outline the original star; Luna points toward the matching door recess with a wing.",
        "audioUrl": "/audio/production/en-US/story_page/burrow-picks-up-the-broken-point-he-lays-both-pieces-on-the-map-they-sti-21d343a82d.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "luna",
          "burrow",
          "map",
          "point"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_door_opens"
          }
        ]
      },
      {
        "id": "p07_door_opens",
        "text": [
          "Burrow turns both pieces to fit the hole.",
          "He presses with one paw.",
          "The door swings open."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p07_door_opens.webp?v=2c09fb8bc643",
        "imageAlt": "Burrow has rotated the two star-shell pieces upright, flat and aligned in the matching star recess. He presses with one paw as the round stone door opens to blue stars; Luna watches beside him.",
        "audioUrl": "/audio/production/en-US/story_page/burrow-turns-both-pieces-to-fit-the-hole-he-presses-with-one-paw-the-doo-8ad461366d.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "burrow",
          "door"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_map_inside"
          }
        ]
      },
      {
        "id": "p08_map_inside",
        "text": [
          "Blue stars hang over a stone table.",
          "Two paths shine on the floor.",
          "Burrow sets down the map."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p08_map_inside.webp?v=2385f5c225ed",
        "imageAlt": "Inside the room, glowing blue star crystals hang over a stone table. Burrow lays his map on the table. A short gold path leads toward a high window; blue star reflections make a second path beside the table.",
        "audioUrl": "/audio/production/en-US/story_page/blue-stars-hang-over-a-stone-table-two-paths-shine-on-the-floor-burrow-s-097ef2701e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "What shall they explore?",
        "skillTags": [
          "burrow",
          "map",
          "stars",
          "stone"
        ],
        "choices": [
          {
            "label": "Follow the gold path",
            "nextPageId": "p09_gold_path"
          },
          {
            "label": "Draw the blue stars",
            "nextPageId": "p10_door_open_ending"
          }
        ]
      },
      {
        "id": "p09_gold_path",
        "text": [
          "The gold path leads to a high window.",
          "Moonwood shines beneath them.",
          "\"So many lights!\" says Burrow."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p09_gold_path.webp?v=c840f6260c5a",
        "imageAlt": "Luna and Burrow look through a high window at Moonwood’s treetops, stars and glowing paths below. The gold path is visible behind them inside the stone room; the map remains on the nearby table.",
        "audioUrl": "/audio/production/en-US/story_page/the-gold-path-leads-to-a-high-window-moonwood-shines-beneath-them-so-man-9905e7c4de.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "burrow",
          "path"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Follow the other path in the star room."
      },
      {
        "id": "p10_door_open_ending",
        "text": [
          "Burrow draws the stars on his map.",
          "Luna points with one wing.",
          "\"An owl!\" says Burrow."
        ],
        "imageUrl": "/images/story-quests/moonwood/luna-burrow-star-shell-door/p10_door_open_ending.webp?v=1b26cead2ee9",
        "imageAlt": "Burrow draws an owl-shaped arrangement of the room’s blue star crystals in an empty corner of his map. Luna indicates the matching constellation above them with her feathered wing; the door remains open behind them.",
        "audioUrl": "/audio/production/en-US/story_page/burrow-draws-the-stars-on-his-map-luna-points-with-one-wing-an-owl-says-5705beb526.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "luna",
          "burrow",
          "map",
          "stars",
          "wing"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Follow the other path in the star room."
      }
    ],
    "shortTitle": "The Star Shell Door",
    "hook": "A glowing map leads to a locked door.",
    "readingSupport": "Listen together or read with an adult; independent reading depends on the child’s taught words and reading experience.",
    "coverImageAlt": "A glowing map leads to a locked door.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mw_ra_c_04_dewdrop_flint_lost_glow",
    "title": "Dewdrop and Flint: The Hidden Glow",
    "level": "C",
    "ageRange": "Ages 5-6",
    "adventureType": "Reading Adventure",
    "skillFocus": "Following visible clues, explaining cause and effect, and adapting a solution to another creature’s needs",
    "cycleFocus": "guided_reading_level_c_story_choice",
    "series": "Moonwood Tales",
    "characters": [
      "Dewdrop",
      "Flint"
    ],
    "location": "Moonwood - Crystal Stream, Deep Dark, glow cave",
    "targetWords": [
      "Flint",
      "Dewdrop",
      "glow",
      "water",
      "stream",
      "path",
      "roots",
      "moss",
      "slab",
      "lantern",
      "cave",
      "gold"
    ],
    "highFrequencyWords": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "hfw": [
      "the",
      "a",
      "and",
      "in",
      "to"
    ],
    "mediaFolder": "dewdrop-flint-lost-glow",
    "sentenceFrame": "",
    "genuineFailurePageId": "p06_lantern_pop",
    "coverImageUrl": "/images/story-quests/covers/hidden-glow.webp?v=59188ab2c998",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "Gold light usually runs through Crystal Stream.",
          "Tonight, the little glow is missing.",
          "Flint cannot see the path."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p01_start.webp?v=0ad73c8aa95e",
        "imageAlt": "At night, Flint lifts his lit lantern beside a faint blue stream and an unlit woodland path. Dewdrop looks toward an empty mossy stream niche marked by a faint gold trace; no gold light reaches the path.",
        "audioUrl": "/audio/production/en-US/story_page/gold-light-usually-runs-through-crystal-stream-tonight-the-little-glow-i-94880b6507.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "glow",
          "stream",
          "path",
          "gold"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_water_whisper"
          }
        ]
      },
      {
        "id": "p03_water_whisper",
        "text": [
          "Dewdrop finds a dry stream channel.",
          "\"The glow follows running water,\" she says.",
          "A fallen slab blocks the flow."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p03_water_whisper.webp?v=d71dda13beb6",
        "imageAlt": "Dewdrop kneels touching the dry channel where it branches from the stream. A fallen stone slab visibly blocks that channel; blue water piles on the upstream side while Flint looks along the dry bed.",
        "audioUrl": "/audio/production/en-US/story_page/dewdrop-finds-a-dry-stream-channel-the-glow-follows-running-water-she-sa-43d9293c34.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "dewdrop",
          "glow",
          "water",
          "stream",
          "slab"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_deep_dark_edge"
          }
        ]
      },
      {
        "id": "p04_deep_dark_edge",
        "text": [
          "The dry channel runs under the roots.",
          "Flint lifts his lantern.",
          "A gold speck shines on the moss."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p04_deep_dark_edge.webp?v=08f1566a0982",
        "imageAlt": "Flint and Dewdrop stand where the dry channel enters tree roots. His lit lantern reveals two gold specks on the moss. A small dark cave opening is partly concealed farther along the bank.",
        "audioUrl": "/audio/production/en-US/story_page/the-dry-channel-runs-under-the-roots-flint-lifts-his-lantern-a-gold-spec-2d3d122f9c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can they find the glow?",
        "skillTags": [
          "flint",
          "roots",
          "moss",
          "lantern",
          "gold"
        ],
        "choices": [
          {
            "label": "Follow the gold specks",
            "nextPageId": "p06_moth_path"
          },
          {
            "label": "Listen with Dewdrop",
            "nextPageId": "p06_quiet_tree"
          }
        ]
      },
      {
        "id": "p06_moth_path",
        "text": [
          "Gold specks line the dry channel.",
          "Flint follows them to a cave.",
          "A tiny snore comes from inside."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p06_moth_path.webp?v=573cdfaf6ef7",
        "imageAlt": "Flint follows a short trail of distinct gold specks along the dry channel toward the mossy cave, holding his lit lantern. Dewdrop accompanies him; no moth or unrelated guide appears.",
        "audioUrl": "/audio/production/en-US/story_page/gold-specks-line-the-dry-channel-flint-follows-them-to-a-cave-a-tiny-sno-7f1efa6009.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "cave",
          "gold"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_glow_cave"
          }
        ]
      },
      {
        "id": "p06_quiet_tree",
        "text": [
          "Dewdrop listens beside the roots.",
          "A tiny snore comes from a mossy cave.",
          "She leads Flint to the sound."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p06_quiet_tree.webp?v=7e806997f28a",
        "imageAlt": "Dewdrop leans close to the roots with a listening gesture and points to the partly hidden cave. Flint follows with his lit lantern along the dry channel; gold specks remain incidental background evidence.",
        "audioUrl": "/audio/production/en-US/story_page/dewdrop-listens-beside-the-roots-a-tiny-snore-comes-from-a-mossy-cave-sh-2863945dd7.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "dewdrop",
          "roots",
          "cave"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_glow_cave"
          }
        ]
      },
      {
        "id": "p06_glow_cave",
        "text": [
          "The glow sleeps on dry moss.",
          "Its round body gives off gold light.",
          "\"Its stream is dry,\" says Dewdrop."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p06_glow_cave.webp?v=5f3246ec6e21",
        "imageAlt": "A small round gold creature sleeps curled on a dry moss mound inside the cave. The empty stream channel reaches the mound. Flint and Dewdrop look in from the entrance; Flint’s lantern is still lit.",
        "audioUrl": "/audio/production/en-US/story_page/the-glow-sleeps-on-dry-moss-its-round-body-gives-off-gold-light-its-stre-c3c345a66e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "dewdrop",
          "glow",
          "stream",
          "moss",
          "gold"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_glow_sleeps"
          }
        ]
      },
      {
        "id": "p07_glow_sleeps",
        "text": [
          "\"Wake up!\" says Flint.",
          "The glow curls tighter and covers its ears.",
          "Dewdrop lifts a finger to her lips."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p07_glow_sleeps.webp?v=bbe268e4d184",
        "imageAlt": "Flint calls toward the glow. The gold creature curls tightly with small paws covering its ears. Dewdrop gives Flint a quiet finger-to-lips signal; the dry channel remains visible.",
        "audioUrl": "/audio/production/en-US/story_page/wake-up-says-flint-the-glow-curls-tighter-and-covers-its-ears-dewdrop-li-c4c2c1f514.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "dewdrop",
          "glow"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_lantern_pop"
          }
        ]
      },
      {
        "id": "p06_lantern_pop",
        "text": [
          "Flint hurries back to the fallen slab.",
          "His boot slips. Splash!",
          "His lantern goes out in the water."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p06_lantern_pop.webp?v=28f23059efed",
        "imageAlt": "Beside the same blocked channel, Flint slips onto his bottom in shallow water. His lantern has splashed into the water and is dark. Dewdrop reaches toward it; the slab still blocks the flow.",
        "audioUrl": "/audio/production/en-US/story_page/flint-hurries-back-to-the-fallen-slab-his-boot-slips-splash-his-lantern-94b5cbc245.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "water",
          "slab",
          "lantern"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_heavy_crystal"
          }
        ]
      },
      {
        "id": "p07_heavy_crystal",
        "text": [
          "Dewdrop lifts out the dark lantern.",
          "Flint sets it down.",
          "He pushes the slab. It will not move."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p07_heavy_crystal.webp?v=38d071e963f4",
        "imageAlt": "The unlit wet lantern rests on the bank beside Dewdrop. Flint pushes the same fallen slab with both hands, but it remains across the dry channel; one small stone is visible wedged beneath its edge.",
        "audioUrl": "/audio/production/en-US/story_page/dewdrop-lifts-out-the-dark-lantern-flint-sets-it-down-he-pushes-the-slab-ebc6f4ad3b.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "dewdrop",
          "slab",
          "lantern"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_team_pull"
          }
        ]
      },
      {
        "id": "p08_team_pull",
        "text": [
          "Dewdrop spots a loose stone beneath the slab.",
          "Flint pulls it free.",
          "Water rushes through the narrow gap."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p08_team_pull.webp?v=cff2c5815468",
        "imageAlt": "Dewdrop points to the small wedged stone; Flint pulls it free from under the slab. Blue water begins flowing through the new gap into the channel. His dark lantern stays on the bank.",
        "audioUrl": "/audio/production/en-US/story_page/dewdrop-spots-a-loose-stone-beneath-the-slab-flint-pulls-it-free-water-r-949ea3454a.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "dewdrop",
          "water",
          "slab"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_crystal_moves"
          }
        ]
      },
      {
        "id": "p08_crystal_moves",
        "text": [
          "Dewdrop guides water under the slab.",
          "Flint slips a branch beneath it.",
          "He leans down. The slab tips."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p08_crystal_moves.webp?v=96e03be98ef1",
        "imageAlt": "Flint uses a sturdy fallen branch as a lever under the slab while Dewdrop guides a clear flow of water below it. The slab tips to one side, opening the channel. The wet dark lantern remains on the bank.",
        "audioUrl": "/audio/production/en-US/story_page/dewdrop-guides-water-under-the-slab-flint-slips-a-branch-beneath-it-he-l-bc63698e2d.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "flint",
          "dewdrop",
          "water",
          "slab"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_glow_wakes"
          }
        ]
      },
      {
        "id": "p07_glow_wakes",
        "text": [
          "Water trickles onto the moss.",
          "The glow opens one bright eye.",
          "It noses along the wet trail."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p07_glow_wakes.webp?v=950fec802caf",
        "imageAlt": "Back inside the cave, a visible trickle flows down the restored channel onto the moss. The gold creature is awake with one eye open, stretching its nose along the wet trail. Flint and Dewdrop watch quietly; no lantern is carried.",
        "audioUrl": "/audio/production/en-US/story_page/water-trickles-onto-the-moss-the-glow-opens-one-bright-eye-it-noses-alon-930f8f708f.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "glow",
          "water",
          "moss"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_sorry_glow"
          }
        ]
      },
      {
        "id": "p08_sorry_glow",
        "text": [
          "The glow covers its ears beside the waterfall.",
          "A quiet bend lies beyond the rocks.",
          "\"This way?\" says Dewdrop."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p08_sorry_glow.webp?v=efbec3a36732",
        "imageAlt": "The awake glow pauses with paws over its ears beside the small splashing waterfall at the channel’s outlet. Dewdrop points toward a calm side bend beyond the rocks. Flint looks at moss beneath the falling water.",
        "audioUrl": "/audio/production/en-US/story_page/the-glow-covers-its-ears-beside-the-waterfall-a-quiet-bend-lies-beyond-t-b787c46ff4.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can they make a quieter home?",
        "skillTags": [
          "dewdrop",
          "glow"
        ],
        "choices": [
          {
            "label": "Quiet the falling water",
            "nextPageId": "p10_gentle_ending"
          },
          {
            "label": "Open the quiet bend",
            "nextPageId": "p09_glow_chooses"
          }
        ]
      },
      {
        "id": "p10_gentle_ending",
        "text": [
          "Flint puts moss beneath the falling water.",
          "The glow slips into the quiet pool.",
          "Gold light fills the path."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p10_gentle_ending.webp?v=c74562784300",
        "imageAlt": "Flint places a thick moss cushion where the small waterfall lands, visibly softening the splash. The gold creature curls in the now-quiet pool. Gold light travels along the water to illuminate the previously dark path; Dewdrop watches.",
        "audioUrl": "/audio/production/en-US/story_page/flint-puts-moss-beneath-the-falling-water-the-glow-slips-into-the-quiet-71769b3a32.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "flint",
          "glow",
          "water",
          "path",
          "moss",
          "gold"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Try the other quiet home."
      },
      {
        "id": "p09_glow_chooses",
        "text": [
          "Dewdrop sends water round the quiet bend.",
          "The glow follows beneath a leaf.",
          "Gold light fills the path."
        ],
        "imageUrl": "/images/story-quests/moonwood/dewdrop-flint-lost-glow/p09_glow_chooses.webp?v=bf105a6eb552",
        "imageAlt": "Dewdrop opens a small clear channel around the quiet bend. The gold creature follows the flowing water into a sheltered pool beneath a leaf, and gold light reaches the same previously dark path. Flint stands quietly beside her, without the lantern.",
        "audioUrl": "/audio/production/en-US/story_page/dewdrop-sends-water-round-the-quiet-bend-the-glow-follows-beneath-a-leaf-9bfe1b3c83.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Read again or finish?",
        "skillTags": [
          "dewdrop",
          "glow",
          "water",
          "path",
          "gold"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "replayPrompt": "Try the other quiet home."
      }
    ],
    "shortTitle": "The Hidden Glow",
    "hook": "The paths are dark. Where is the little glow?",
    "readingSupport": "Listen together or read with an adult; independent reading depends on the child’s taught words and reading experience.",
    "coverImageAlt": "The paths are dark. Where is the little glow?",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "dp_ra_b_01_chompy_big_lunch_hunt",
    "title": "Chompy’s Picnic",
    "level": "B",
    "ageRange": "Ages 5-6",
    "adventureType": "Dino Pals Reading Adventure",
    "skillFocus": "Reading connected actions about offering, choosing and sharing food.",
    "cycleFocus": "guided_reading_level_b_story_choice",
    "series": "Dino Pals",
    "characters": [
      "Chompy",
      "Sunny",
      "Grumpy",
      "Bouncy"
    ],
    "location": "Sunny Hollow - Cozy Cave, Berry Bush Corner, Big Flat Rock, Muddy Puddle Pool, Long Meadow",
    "targetWords": [
      "Chompy",
      "Sunny",
      "Grumpy",
      "Bouncy",
      "berries",
      "berry",
      "leaf",
      "basket",
      "melon",
      "leaves",
      "picnic",
      "food",
      "fruit",
      "bowl",
      "rock",
      "four"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "I",
      "and",
      "on",
      "it",
      "his",
      "to",
      "says",
      "with",
      "for"
    ],
    "hfw": [
      "a",
      "the",
      "I",
      "and",
      "on",
      "it",
      "his",
      "to",
      "says",
      "with",
      "for"
    ],
    "mediaFolder": "chompy-lunch-hunt",
    "sentenceFrame": "Connected present-tense action; repeated concrete words change meaning with the route.",
    "genuineFailurePageId": "p04_grumpy_berries",
    "coverImageUrl": "/images/story-quests/covers/chompy-picnic.webp?v=e9f8ec570c08",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p01_start.webp?v=a439a3bd19f5",
        "audioUrl": "/audio/production/en-US/story_page/chompy-plans-a-big-picnic-his-tummy-gives-a-rumble-2823ff7b68.mp3",
        "text": [
          "Chompy plans a big picnic.",
          "His tummy gives a rumble."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_berries"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy sits by Cozy Cave with one hand on his rumbling tummy; a berry bush grows outside.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "picnic"
        ]
      },
      {
        "id": "p02_berries",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p02_berries.webp?v=07ade7117e75",
        "audioUrl": "/audio/production/en-US/story_page/chompy-picks-red-and-purple-berries-he-piles-them-on-a-leaf-ba2db1d593.mp3",
        "text": [
          "Chompy picks red and purple berries.",
          "He piles them on a leaf."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_save_berries"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy puts red and purple berries onto a broad leaf beside the berry bush.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "berries",
          "leaf"
        ]
      },
      {
        "id": "p03_save_berries",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p03_save_berries.webp?v=1afff72f4527",
        "audioUrl": "/audio/production/en-US/story_page/chompy-fills-a-leaf-basket-now-for-some-picnic-friends-237fe842fe.mp3",
        "text": [
          "Chompy fills a leaf basket.",
          "Now for some picnic friends!"
        ],
        "choices": [
          {
            "label": "Visit Grumpy",
            "nextPageId": "p04_grumpy_berries"
          },
          {
            "label": "Find Sunny",
            "nextPageId": "p04_sunny_shares"
          }
        ],
        "choicePrompt": "Who can Chompy invite?",
        "imageAlt": "Chompy puts the picked berries into a green leaf basket.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "leaf",
          "basket",
          "picnic"
        ]
      },
      {
        "id": "p04_grumpy_berries",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p04_grumpy_berries.webp?v=63211efc963d",
        "audioUrl": "/audio/production/en-US/story_page/chompy-holds-out-a-purple-berry-grumpy-turns-his-head-away-5d68cba169.mp3",
        "text": [
          "Chompy holds out a purple berry.",
          "Grumpy turns his head away."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_grumpy_tiny_smile"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy offers one purple berry; Grumpy gently turns his head away.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "grumpy",
          "berry"
        ]
      },
      {
        "id": "p05_grumpy_tiny_smile",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p05_grumpy_tiny_smile.webp?v=202dba6cbf29",
        "audioUrl": "/audio/production/en-US/story_page/no-berries-for-me-says-grumpy-i-like-melon-and-leaves-e7fc18c835.mp3",
        "text": [
          "“No berries for me,” says Grumpy.",
          "“I like melon and leaves.”"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_grumpy_full"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy turns from the berry and points towards broad edible leaves beside the path.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "berries",
          "melon",
          "leaves"
        ]
      },
      {
        "id": "p06_grumpy_full",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p06_grumpy_full.webp?v=b6783897a781",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-picks-some-fresh-green-leaves-chompy-calls-sunny-for-some-melon-5646260690.mp3",
        "text": [
          "Grumpy picks some fresh green leaves.",
          "Chompy calls Sunny for some melon."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_ask_sunny"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy gathers broad green leaves as Chompy calls towards Sunny near Cozy Cave.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "sunny",
          "grumpy",
          "melon",
          "leaves"
        ]
      },
      {
        "id": "p03_ask_sunny",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p03_ask_sunny.webp?v=7a18064011d9",
        "audioUrl": "/audio/production/en-US/story_page/sunny-brings-melon-slices-to-the-rock-chompy-brings-his-berry-basket-06168350c8.mp3",
        "text": [
          "Sunny brings melon slices to the rock.",
          "Chompy brings his berry basket."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_big_flat_rock"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny brings melon slices on a leaf plate, Chompy carries his berry basket, and Grumpy follows with leaves to Big Flat Rock.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "sunny",
          "berry",
          "basket",
          "melon",
          "rock"
        ]
      },
      {
        "id": "p05_big_flat_rock",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p05_big_flat_rock.webp?v=0cf528939e4b",
        "audioUrl": "/audio/production/en-US/story_page/sunny-sets-out-the-melon-slices-grumpy-adds-his-green-leaves-3ef96fb86a.mp3",
        "text": [
          "Sunny sets out the melon slices.",
          "Grumpy adds his green leaves."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_everyone_eats"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny places melon slices on Big Flat Rock; Grumpy puts down his leaves and Chompy sets down the berry basket.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "grumpy",
          "melon",
          "leaves"
        ]
      },
      {
        "id": "p06_everyone_eats",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p06_everyone_eats.webp?v=1a2d8e6676e9",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-joins-them-at-big-flat-rock-chompy-fills-four-leaf-plates-a9caef1462.mp3",
        "text": [
          "Bouncy joins them at Big Flat Rock.",
          "Chompy fills four leaf plates."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_thank_you_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy joins Chompy, Sunny and Grumpy at the picnic rock; Chompy puts different foods on four leaf plates.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "bouncy",
          "leaf",
          "rock",
          "four"
        ]
      },
      {
        "id": "p08_thank_you_ending",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p08_thank_you_ending.webp?v=bea152a1b54e",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-takes-a-bite-of-melon-chompy-s-tummy-stops-rumbling-6c0e4acd0f.mp3",
        "text": [
          "Grumpy takes a bite of melon.",
          "Chompy’s tummy stops rumbling."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Grumpy eats melon while Chompy, Sunny and Bouncy enjoy their own picnic plates.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "melon"
        ],
        "replayPrompt": "Who will Chompy visit next time?"
      },
      {
        "id": "p04_sunny_shares",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p04_sunny_shares.webp?v=464f4b865696",
        "audioUrl": "/audio/production/en-US/story_page/sunny-brings-fruit-to-the-picnic-rock-chompy-puts-down-his-berry-basket-a49dd8930e.mp3",
        "text": [
          "Sunny brings fruit to the picnic rock.",
          "Chompy puts down his berry basket."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_bouncy_lunch"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny brings fruit and Chompy puts his full green leaf basket on Big Flat Rock.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "sunny",
          "berry",
          "basket",
          "picnic",
          "fruit",
          "rock"
        ]
      },
      {
        "id": "p06_bouncy_lunch",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p06_bouncy_lunch.webp?v=d544bed51f3b",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-lands-beside-the-picnic-rock-his-spring-bumps-the-berry-basket-678a80b893.mp3",
        "text": [
          "Bouncy lands beside the picnic rock.",
          "His spring bumps the berry basket."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_berry_rain"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy’s spring bumps the leaf basket on the rock; Chompy reaches towards it and Sunny watches.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "berry",
          "basket",
          "picnic",
          "rock"
        ]
      },
      {
        "id": "p07_berry_rain",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p07_berry_rain.webp?v=b91e6237aaa7",
        "audioUrl": "/audio/production/en-US/story_page/the-basket-tips-berries-roll-everywhere-bouncy-stops-bouncing-2c9351c0c7.mp3",
        "text": [
          "The basket tips. Berries roll everywhere!",
          "Bouncy stops bouncing."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_berry_mess_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "The same leaf basket tips off the picnic rock; berries spill and Bouncy plants both springs.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "berries",
          "basket"
        ]
      },
      {
        "id": "p08_berry_mess_ending",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p08_berry_mess_ending.webp?v=3c91ba54a6a6",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-gathers-the-berries-chompy-washes-them-sunny-guards-the-picnic-fo-f23b06b0f8.mp3",
        "text": [
          "Bouncy gathers the berries. Chompy washes them.",
          "Sunny guards the picnic food."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_leaf_hat"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy gathers the spilled berries, Chompy rinses them beside the rock, and Sunny protects the other picnic food.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "sunny",
          "bouncy",
          "berries",
          "picnic",
          "food"
        ]
      },
      {
        "id": "p07_leaf_hat",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p07_leaf_hat.webp?v=fcec37db7844",
        "audioUrl": "/audio/production/en-US/story_page/sunny-folds-a-broad-leaf-into-a-bowl-chompy-fills-it-with-clean-berries-ca99c504c6.mp3",
        "text": [
          "Sunny folds a broad leaf into a bowl.",
          "Chompy fills it with clean berries."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_cave_door"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny folds a broad green serving bowl while Chompy fills it with the washed berries.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "sunny",
          "berries",
          "leaf",
          "bowl"
        ]
      },
      {
        "id": "p02_cave_door",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p02_cave_door.webp?v=e788be67eb22",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-brings-leaves-to-the-picnic-bouncy-sets-out-four-leaf-plates-0e193ca88a.mp3",
        "text": [
          "Grumpy brings leaves to the picnic.",
          "Bouncy sets out four leaf plates."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_leaf_hat_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy arrives with leaves; Bouncy sets four leaf plates on the rock beside Sunny’s fruit and Chompy’s berry bowl.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "bouncy",
          "leaf",
          "leaves",
          "picnic",
          "four"
        ]
      },
      {
        "id": "p08_leaf_hat_ending",
        "imageUrl": "/images/story-quests/dino-pals/chompy-lunch-hunt/p08_leaf_hat_ending.webp?v=2d225f63214c",
        "audioUrl": "/audio/production/en-US/story_page/chompy-passes-the-bowl-round-the-rock-four-friends-tuck-into-lunch-75f5d20f66.mp3",
        "text": [
          "Chompy passes the bowl round the rock.",
          "Four friends tuck into lunch."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Chompy passes the berry bowl; Sunny, Grumpy and Bouncy eat different foods from four leaf plates.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "bowl",
          "rock",
          "four"
        ],
        "replayPrompt": "Who will Chompy visit next time?"
      }
    ],
    "shortTitle": "Chompy’s Picnic",
    "hook": "Will everyone find a favourite picnic food?",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "dp_ra_b_02_sunnys_rainy_day_rescue",
    "title": "Sunny’s Rainy Rescue",
    "level": "B",
    "ageRange": "Ages 5-6",
    "adventureType": "Dino Pals Reading Adventure",
    "skillFocus": "Reading wet/dry contrasts and following a shelter problem through cause and repair.",
    "cycleFocus": "guided_reading_level_b_story_choice",
    "series": "Dino Pals",
    "characters": [
      "Sunny",
      "Grumpy",
      "Dozy"
    ],
    "location": "Sunny Hollow - Muddy Puddle Pool, Big Flat Rock, Cozy Cave, Fernwood forest",
    "targetWords": [
      "Sunny",
      "Grumpy",
      "Dozy",
      "rain",
      "wet",
      "dry",
      "pillow",
      "leaf",
      "leaves",
      "cave",
      "rock",
      "boat",
      "drip",
      "sun"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "and",
      "in",
      "on",
      "it",
      "his",
      "is",
      "says",
      "for"
    ],
    "hfw": [
      "a",
      "the",
      "and",
      "in",
      "on",
      "it",
      "his",
      "is",
      "says",
      "for"
    ],
    "mediaFolder": "sunny-rainy-rescue",
    "sentenceFrame": "Connected present-tense action; repeated concrete words change meaning with the route.",
    "genuineFailurePageId": "p03_dry_rock",
    "coverImageUrl": "/images/story-quests/covers/sunny-rainy-rescue.webp?v=ec47bc834031",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p01_start.webp?v=6ce0541a6aad",
        "audioUrl": "/audio/production/en-US/story_page/cold-rain-soaks-grumpy-and-dozy-sunny-looks-for-a-dry-place-247e8a06f3.mp3",
        "text": [
          "Cold rain soaks Grumpy and Dozy.",
          "Sunny looks for a dry place."
        ],
        "choices": [
          {
            "label": "Try the rock",
            "nextPageId": "p02_grumpy"
          },
          {
            "label": "Try the cave",
            "nextPageId": "p02_dozy"
          }
        ],
        "choicePrompt": "Where can they get dry?",
        "imageAlt": "Sunny stands beside wet Grumpy and Dozy in the rain; Dozy hugs his blue star-pattern pillow.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "grumpy",
          "dozy",
          "rain",
          "dry"
        ]
      },
      {
        "id": "p02_grumpy",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p02_grumpy.webp?v=5458821557f5",
        "audioUrl": "/audio/production/en-US/story_page/rain-drips-off-grumpy-s-back-even-my-tail-is-wet-he-says-79773faa96.mp3",
        "text": [
          "Rain drips off Grumpy’s back.",
          "“Even my tail is wet,” he says."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_dry_rock"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Rain drips from Grumpy’s back and club tail as he stands by Sunny.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "rain",
          "wet"
        ]
      },
      {
        "id": "p03_dry_rock",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p03_dry_rock.webp?v=41f95251f296",
        "audioUrl": "/audio/production/en-US/story_page/sunny-looks-behind-the-big-rock-rain-splashes-down-both-sides-caa97f66c2.mp3",
        "text": [
          "Sunny looks behind the big rock.",
          "Rain splashes down both sides."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_puddle"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny and Grumpy look around an exposed wet rock; Dozy follows with his pillow.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "rain",
          "rock"
        ]
      },
      {
        "id": "p03_puddle",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p03_puddle.webp?v=75513ae51e17",
        "audioUrl": "/audio/production/en-US/story_page/sunny-spots-a-broad-green-leaf-it-cannot-cover-all-three-friends-5a21cce5c7.mp3",
        "text": [
          "Sunny spots a broad green leaf.",
          "It cannot cover all three friends."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_cave_grumpy"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny, Grumpy and Dozy look at a broad leaf on the wet ground; it is too small to cover all three.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "leaf"
        ]
      },
      {
        "id": "p02_dozy",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p02_dozy.webp?v=b186e57641e3",
        "audioUrl": "/audio/production/en-US/story_page/my-pillow-drips-says-dozy-his-chin-drips-too-d2de2b8d31.mp3",
        "text": [
          "“My pillow drips,” says Dozy.",
          "His chin drips too."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_cozy_cave"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Dozy hugs his soaked star-pattern pillow; drops fall from the pillow and his chin.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "dozy",
          "pillow"
        ]
      },
      {
        "id": "p03_cozy_cave",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p03_cozy_cave.webp?v=a79e927f3a61",
        "audioUrl": "/audio/production/en-US/story_page/sunny-squeezes-water-from-the-pillow-a-little-stream-runs-out-a75f6113e4.mp3",
        "text": [
          "Sunny squeezes water from the pillow.",
          "A little stream runs out."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_cave_grumpy"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny squeezes Dozy’s wet pillow in Cozy Cave; Dozy and Grumpy watch water drip onto the cave floor.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "pillow"
        ]
      },
      {
        "id": "p04_cave_grumpy",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p04_cave_grumpy.webp?v=5a137f0fcbde",
        "audioUrl": "/audio/production/en-US/story_page/all-three-friends-huddle-in-cozy-cave-drip-rain-falls-through-a-crack-965d1009a7.mp3",
        "text": [
          "All three friends huddle in Cozy Cave.",
          "Drip! Rain falls through a crack."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_leaf_roof"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny, Grumpy and Dozy shelter in the cave; a roof crack drips onto their resting spot.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "rain",
          "cave",
          "drip"
        ]
      },
      {
        "id": "p05_leaf_roof",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p05_leaf_roof.webp?v=0cfc8260d5ef",
        "audioUrl": "/audio/production/en-US/story_page/sunny-tucks-broad-leaves-over-the-crack-the-drips-slow-down-cf818d8686.mp3",
        "text": [
          "Sunny tucks broad leaves over the crack.",
          "The drips slow down."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_grumpy_dry"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "At the low cave roof Sunny overlaps broad leaves over the crack; the others watch from the entrance.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "leaves"
        ]
      },
      {
        "id": "p06_grumpy_dry",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p06_grumpy_dry.webp?v=7e1783241d6e",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-presses-the-last-leaf-flat-no-more-drips-456569f6cf.mp3",
        "text": [
          "Grumpy presses the last leaf flat.",
          "No more drips!"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_dozy_dry"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy presses down the last roof leaf with a front foot; the cave below is no longer dripping.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "leaf"
        ]
      },
      {
        "id": "p06_dozy_dry",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p06_dozy_dry.webp?v=8358d97b49e6",
        "audioUrl": "/audio/production/en-US/story_page/sunny-spreads-the-pillow-on-dry-moss-dozy-curls-beside-it-fb993c3478.mp3",
        "text": [
          "Sunny spreads the pillow on dry moss.",
          "Dozy curls beside it."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_grumpy_smile"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny spreads the damp blue pillow on moss in the dry cave; Dozy curls beside it and Grumpy rests nearby.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "dozy",
          "dry",
          "pillow"
        ]
      },
      {
        "id": "p06_grumpy_smile",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p06_grumpy_smile.webp?v=fdb84b48fc99",
        "audioUrl": "/audio/production/en-US/story_page/the-rain-stops-sun-warms-the-cave-dozy-s-pillow-dries-2c85bbe5dc.mp3",
        "text": [
          "The rain stops. Sun warms the cave.",
          "Dozy’s pillow dries."
        ],
        "choices": [
          {
            "label": "Rest in the cave",
            "nextPageId": "p08_quiet_ending"
          },
          {
            "label": "Float a leaf boat",
            "nextPageId": "p07_leaf_boat"
          }
        ],
        "choicePrompt": "How can Sunny enjoy the dry day?",
        "imageAlt": "Sunlight reaches the repaired dry cave; the blue pillow dries on moss beside Dozy while Sunny and Grumpy rest.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "rain",
          "pillow",
          "cave",
          "sun"
        ]
      },
      {
        "id": "p08_quiet_ending",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p08_quiet_ending.webp?v=5a116f9b6c26",
        "audioUrl": "/audio/production/en-US/story_page/dozy-rests-on-his-dry-pillow-sunny-and-grumpy-stretch-out-beside-him-b9dce28039.mp3",
        "text": [
          "Dozy rests on his dry pillow.",
          "Sunny and Grumpy stretch out beside him."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "All three friends rest in the dry leaf-roofed cave; Dozy sleeps on his blue pillow.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "grumpy",
          "dozy",
          "dry",
          "pillow"
        ],
        "replayPrompt": "Will you try the other shelter?"
      },
      {
        "id": "p07_leaf_boat",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p07_leaf_boat.webp?v=2e40e4d9b8ee",
        "audioUrl": "/audio/production/en-US/story_page/dozy-naps-sunny-folds-a-leaf-boat-grumpy-gives-it-a-push-f6bed12b9e.mp3",
        "text": [
          "Dozy naps. Sunny folds a leaf boat.",
          "Grumpy gives it a push."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_grumpy_laugh_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Outside the cave Sunny and Grumpy float a green leaf boat; Dozy naps inside on his dry pillow.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "sunny",
          "grumpy",
          "dozy",
          "leaf",
          "boat"
        ]
      },
      {
        "id": "p08_grumpy_laugh_ending",
        "imageUrl": "/images/story-quests/dino-pals/sunny-rainy-rescue/p08_grumpy_laugh_ending.webp?v=72f3b9882f2d",
        "audioUrl": "/audio/production/en-US/story_page/the-boat-bumps-grumpy-s-foot-he-gives-it-one-more-push-6b4f55c761.mp3",
        "text": [
          "The boat bumps Grumpy’s foot.",
          "He gives it one more push."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "The leaf boat nudges Grumpy’s foot; he gently pushes it back towards Sunny while Dozy remains asleep in the cave.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "boat"
        ],
        "replayPrompt": "Will you try the other shelter?"
      }
    ],
    "shortTitle": "Sunny’s Rainy Rescue",
    "hook": "A wet pillow, a leaky cave—and a leafy idea.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "dp_ra_b_03_grumpy_almost_good_day",
    "title": "Grumpy Needs a Nap",
    "level": "B",
    "ageRange": "Ages 5-6",
    "adventureType": "Dino Pals Reading Adventure",
    "skillFocus": "Reading requests, physical consequences and repairs in a search for quiet rest.",
    "cycleFocus": "guided_reading_level_b_story_choice",
    "series": "Dino Pals",
    "characters": [
      "Grumpy",
      "Chompy",
      "Sunny",
      "Wiggly",
      "Fancy"
    ],
    "location": "Sunny Hollow - berry bush, stream, stones, sunny path",
    "targetWords": [
      "Grumpy",
      "Chompy",
      "Sunny",
      "Wiggly",
      "Fancy",
      "nap",
      "twig",
      "quiet",
      "stream",
      "tail",
      "stone",
      "stones",
      "tower",
      "shade",
      "fish",
      "wave",
      "path"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "I",
      "in",
      "on",
      "it",
      "his",
      "to",
      "is",
      "says",
      "with",
      "for"
    ],
    "hfw": [
      "a",
      "the",
      "I",
      "in",
      "on",
      "it",
      "his",
      "to",
      "is",
      "says",
      "with",
      "for"
    ],
    "mediaFolder": "grumpy-almost-good-day",
    "sentenceFrame": "Connected present-tense action; repeated concrete words change meaning with the route.",
    "genuineFailurePageId": "p03_list_making",
    "coverImageUrl": "/images/story-quests/covers/grumpy-nap.webp?v=acc1eadd54ff",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p01_start.webp?v=487461cfbf7c",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-wants-a-cool-quiet-nap-a-hard-twig-pokes-his-side-5fc45b54c6.mp3",
        "text": [
          "Grumpy wants a cool, quiet nap.",
          "A hard twig pokes his side."
        ],
        "choices": [
          {
            "label": "Move the twig",
            "nextPageId": "p02_bush"
          },
          {
            "label": "Try the stream",
            "nextPageId": "p02_stream"
          }
        ],
        "choicePrompt": "How can Grumpy get comfy?",
        "imageAlt": "A single twig pokes Grumpy’s side under a shady berry bush.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "nap",
          "twig",
          "quiet"
        ]
      },
      {
        "id": "p02_bush",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p02_bush.webp?v=182ff383d1f5",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-shuffles-away-from-the-twig-poke-it-catches-under-his-side-7a7b520d89.mp3",
        "text": [
          "Grumpy shuffles away from the twig.",
          "Poke! It catches under his side."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_list_making"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy shifts under the bush, but the same twig still presses against his side.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "twig"
        ]
      },
      {
        "id": "p03_list_making",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p03_list_making.webp?v=6b00d49d536f",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-nudges-the-twig-with-his-nose-one-end-is-stuck-under-a-root-f0d2ef0a36.mp3",
        "text": [
          "Grumpy nudges the twig with his nose.",
          "One end is stuck under a root."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_tell_sunny"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy nudges the twig; its far end is wedged beneath a visible bush root.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "twig"
        ]
      },
      {
        "id": "p04_tell_sunny",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p04_tell_sunny.webp?v=9282433c0f76",
        "audioUrl": "/audio/production/en-US/story_page/sunny-comes-along-the-path-that-twig-won-t-move-says-grumpy-5ce8b06216.mp3",
        "text": [
          "Sunny comes along the path.",
          "“That twig won’t move,” says Grumpy."
        ],
        "choices": [
          {
            "label": "Pull with Sunny",
            "nextPageId": "p05_sunny_helps"
          },
          {
            "label": "Find another spot",
            "nextPageId": "p07_one_thing_done"
          }
        ],
        "choicePrompt": "What can Grumpy try now?",
        "imageAlt": "Sunny arrives by the path; Grumpy points his nose towards the stuck twig.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "sunny",
          "twig",
          "path"
        ]
      },
      {
        "id": "p05_sunny_helps",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p05_sunny_helps.webp?v=b984b9c393c7",
        "audioUrl": "/audio/production/en-US/story_page/sunny-lifts-the-twig-grumpy-slides-it-past-the-root-847393897d.mp3",
        "text": [
          "Sunny lifts the twig.",
          "Grumpy slides it past the root."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_twig_fixed"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Sunny lifts one end of the twig with a forefoot; Grumpy slides it out from under the root.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "sunny",
          "twig"
        ]
      },
      {
        "id": "p06_twig_fixed",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p06_twig_fixed.webp?v=54a98178c4a6",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-pushes-the-twig-off-the-path-then-he-naps-in-the-cool-shade-2bc025d3a8.mp3",
        "text": [
          "Grumpy pushes the twig off the path.",
          "Then he naps in the cool shade."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "The twig lies safely beside the path; Grumpy sleeps in his cleared shaded spot as Sunny walks away.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "twig",
          "shade",
          "path"
        ],
        "replayPrompt": "Where else could Grumpy find a nap?"
      },
      {
        "id": "p07_one_thing_done",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p07_one_thing_done.webp?v=66a1a569a409",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-walks-past-the-berry-bush-sunny-points-to-a-soft-moss-patch-c93e9fab8e.mp3",
        "text": [
          "Grumpy walks past the berry bush.",
          "Sunny points to a soft moss patch."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_sunny_help_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy walks to a nearby shaded moss patch indicated by Sunny.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "sunny"
        ]
      },
      {
        "id": "p08_sunny_help_ending",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p08_sunny_help_ending.webp?v=5a96c4a0d5cd",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-naps-on-the-cool-moss-sunny-rests-farther-down-the-path-1fb5b39e51.mp3",
        "text": [
          "Grumpy naps on the cool moss.",
          "Sunny rests farther down the path."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Grumpy sleeps alone on shaded moss; Sunny rests comfortably farther down the path.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "sunny",
          "path"
        ],
        "replayPrompt": "Where else could Grumpy find a nap?"
      },
      {
        "id": "p02_stream",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p02_stream.webp?v=92cf9078b908",
        "audioUrl": "/audio/production/en-US/story_page/the-stream-splashes-grumpy-s-feet-it-is-no-place-for-a-nap-1f1995072b.mp3",
        "text": [
          "The stream splashes Grumpy’s feet.",
          "It is no place for a nap."
        ],
        "choices": [
          {
            "label": "Sit in the water",
            "nextPageId": "p03_chompy_finds"
          },
          {
            "label": "Step onto the bank",
            "nextPageId": "p03_stones_fall"
          }
        ],
        "choicePrompt": "Where can Grumpy rest?",
        "imageAlt": "Grumpy stands in the shallow stream as water splashes his feet; a grassy bank is close by.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "nap",
          "stream"
        ]
      },
      {
        "id": "p03_chompy_finds",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p03_chompy_finds.webp?v=a8d75dc7c50c",
        "audioUrl": "/audio/production/en-US/story_page/chompy-wades-into-the-stream-want-a-splash-he-says-d20129af50.mp3",
        "text": [
          "Chompy wades into the stream.",
          "“Want a splash?” he says."
        ],
        "choices": [
          {
            "label": "Ask for quiet",
            "nextPageId": "p04_ignore_chompy"
          },
          {
            "label": "Have one splash",
            "nextPageId": "p04_splash_chompy"
          }
        ],
        "choicePrompt": "What does Grumpy want?",
        "imageAlt": "Chompy wades towards Grumpy in shallow water and offers to play.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "stream"
        ]
      },
      {
        "id": "p04_ignore_chompy",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p04_ignore_chompy.webp?v=dbb8759bc9a2",
        "audioUrl": "/audio/production/en-US/story_page/i-need-a-nap-says-grumpy-chompy-steps-back-onto-the-bank-9e2203f3ef.mp3",
        "text": [
          "“I need a nap,” says Grumpy.",
          "Chompy steps back onto the bank."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_quiet_stream"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy asks for quiet and Chompy gives him space by stepping onto the bank.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "chompy",
          "nap"
        ]
      },
      {
        "id": "p05_quiet_stream",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p05_quiet_stream.webp?v=0387c8c2da7e",
        "audioUrl": "/audio/production/en-US/story_page/chompy-sits-without-a-sound-a-fish-leaps-plip-ae02f3d069.mp3",
        "text": [
          "Chompy sits without a sound.",
          "A fish leaps. Plip!"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_warm_ground_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy sits quietly on the bank; a small fish leaps near Grumpy.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "fish"
        ]
      },
      {
        "id": "p08_warm_ground_ending",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p08_warm_ground_ending.webp?v=2e3cc2b27b29",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-naps-in-a-shady-patch-chompy-watches-the-fish-49e1dda36f.mp3",
        "text": [
          "Grumpy naps in a shady patch.",
          "Chompy watches the fish."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Grumpy sleeps in bank shade while Chompy quietly watches the fish at a comfortable distance.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "chompy",
          "fish"
        ],
        "replayPrompt": "Where else could Grumpy find a nap?"
      },
      {
        "id": "p04_splash_chompy",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p04_splash_chompy.webp?v=6df0ea9b690c",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-swishes-his-club-tail-a-splash-shoots-over-chompy-s-head-6d57fecd0c.mp3",
        "text": [
          "Grumpy swishes his club tail.",
          "A splash shoots over Chompy’s head."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_wiggly_splash"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy uses his club tail to splash Chompy in a shared game.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "tail"
        ]
      },
      {
        "id": "p06_wiggly_splash",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p06_wiggly_splash.webp?v=98737baa1a92",
        "audioUrl": "/audio/production/en-US/story_page/wiggly-wades-in-to-join-them-his-long-tail-makes-a-wave-b01a10d7a7.mp3",
        "text": [
          "Wiggly wades in to join them.",
          "His long tail makes a wave."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_all_soaked"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Wiggly joins Grumpy and Chompy; his long tail pushes up a wave.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "wiggly",
          "tail",
          "wave"
        ]
      },
      {
        "id": "p07_all_soaked",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p07_all_soaked.webp?v=4b705c010e65",
        "audioUrl": "/audio/production/en-US/story_page/the-wave-washes-over-the-bank-grumpy-s-dry-patch-is-gone-c099c655bf.mp3",
        "text": [
          "The wave washes over the bank.",
          "Grumpy’s dry patch is gone."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_soaked_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Wiggly’s wave reaches the previously dry bank and soaks Grumpy and Chompy.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "wave"
        ]
      },
      {
        "id": "p08_soaked_ending",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p08_soaked_ending.webp?v=e02ba2d8ee39",
        "audioUrl": "/audio/production/en-US/story_page/the-three-friends-stretch-on-warm-sand-grumpy-naps-in-the-sun-15ec48807b.mp3",
        "text": [
          "The three friends stretch on warm sand.",
          "Grumpy naps in the sun."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Grumpy sleeps on dry warm sand with Chompy and Wiggly resting quietly beside him.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy"
        ],
        "replayPrompt": "Where else could Grumpy find a nap?"
      },
      {
        "id": "p03_stones_fall",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p03_stones_fall.webp?v=88cf05346b52",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-steps-out-beside-fancy-s-stone-tower-his-tail-knocks-it-down-a668436d31.mp3",
        "text": [
          "Grumpy steps out beside Fancy’s stone tower.",
          "His tail knocks it down."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_tell_fancy"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy steps onto the bank and accidentally knocks Fancy’s stacked stones with his tail.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "tail",
          "stone",
          "tower"
        ]
      },
      {
        "id": "p04_tell_fancy",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p04_tell_fancy.webp?v=0580cf7e55f6",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-calls-fancy-to-the-fallen-stones-my-tail-hit-them-he-says-af56c7bfa7.mp3",
        "text": [
          "Grumpy calls Fancy to the fallen stones.",
          "“My tail hit them,” he says."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_rebuild_stones"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy tells Fancy what happened beside the fallen tower.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "fancy",
          "tail",
          "stones"
        ]
      },
      {
        "id": "p06_rebuild_stones",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p06_rebuild_stones.webp?v=c2af766237cd",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-pushes-the-flat-stones-together-fancy-holds-the-stack-still-f317822289.mp3",
        "text": [
          "Grumpy pushes the flat stones together.",
          "Fancy holds the stack still."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_tower_rebuilt"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy and Fancy rebuild the tower beside a shady tree on the stream bank.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "fancy",
          "stones"
        ]
      },
      {
        "id": "p07_tower_rebuilt",
        "imageUrl": "/images/story-quests/dino-pals/grumpy-almost-good-day/p07_tower_rebuilt.webp?v=1a705b522bb5",
        "audioUrl": "/audio/production/en-US/story_page/fancy-pats-the-last-flat-stone-grumpy-naps-under-the-tree-45a6d65e52.mp3",
        "text": [
          "Fancy pats the last flat stone.",
          "Grumpy naps under the tree."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Fancy completes the repaired stone tower; Grumpy sleeps in the nearby tree’s shade.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "fancy",
          "stone"
        ],
        "replayPrompt": "Where else could Grumpy find a nap?"
      }
    ],
    "shortTitle": "Grumpy Needs a Nap",
    "hook": "Can Grumpy find one quiet, comfy spot?",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "dp_ra_b_04_bouncy_big_bounce",
    "title": "Bouncy and the Berries",
    "level": "B",
    "ageRange": "Ages 5-6",
    "adventureType": "Dino Pals Reading Adventure",
    "skillFocus": "Reading action, sound and consequence through berry gathering and a quiet cave crossing.",
    "cycleFocus": "guided_reading_level_b_story_choice",
    "series": "Dino Pals",
    "characters": [
      "Bouncy",
      "Chompy",
      "Grumpy",
      "Dozy"
    ],
    "location": "Sunny Hollow - berry bush corner, cozy cave, stream, big flat rock",
    "targetWords": [
      "Bouncy",
      "Chompy",
      "Grumpy",
      "Dozy",
      "basket",
      "berries",
      "berry",
      "bounce",
      "bounces",
      "branch",
      "leaf",
      "cave",
      "pebble",
      "picnic",
      "rock"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "and",
      "in",
      "on",
      "it",
      "his",
      "they",
      "to",
      "says",
      "with",
      "for"
    ],
    "hfw": [
      "a",
      "the",
      "and",
      "in",
      "on",
      "it",
      "his",
      "they",
      "to",
      "says",
      "with",
      "for"
    ],
    "mediaFolder": "bouncy-big-bounce",
    "sentenceFrame": "Connected present-tense action; repeated concrete words change meaning with the route.",
    "genuineFailurePageId": "p05_legs_give_up",
    "coverImageUrl": "/images/story-quests/covers/bouncy-berries.webp?v=3ce0a540226b",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p01_start.webp?v=81ac8cb6fa17",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-carries-an-empty-basket-chompy-waves-from-the-berry-bush-93fe0b7392.mp3",
        "text": [
          "Bouncy carries an empty basket.",
          "Chompy waves from the berry bush."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_berry_corner"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy carries an empty brown woven basket towards Chompy at the berry bush.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "chompy",
          "basket",
          "berry"
        ]
      },
      {
        "id": "p02_berry_corner",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p02_berry_corner.webp?v=8ee1221e3d83",
        "audioUrl": "/audio/production/en-US/story_page/chompy-points-to-a-high-branch-berries-for-the-picnic-he-says-a3c25dea3c.mp3",
        "text": [
          "Chompy points to a high branch.",
          "“Berries for the picnic!” he says."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_help_chompy"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy points to the high berry branch; Bouncy holds the empty basket.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "berries",
          "branch",
          "picnic"
        ]
      },
      {
        "id": "p03_help_chompy",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p03_help_chompy.webp?v=8d232c59c206",
        "audioUrl": "/audio/production/en-US/story_page/chompy-holds-the-basket-below-bouncy-bends-his-spring-legs-6605aa0bcb.mp3",
        "text": [
          "Chompy holds the basket below.",
          "Bouncy bends his spring legs."
        ],
        "choices": [
          {
            "label": "Try one big bounce",
            "nextPageId": "p04_big_bounce"
          },
          {
            "label": "Try three small bounces",
            "nextPageId": "p04_careful_bounce"
          }
        ],
        "choicePrompt": "How can Bouncy reach the berries?",
        "imageAlt": "Chompy holds the empty basket beneath the branch; Bouncy crouches on his spring legs.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "chompy",
          "basket"
        ]
      },
      {
        "id": "p04_big_bounce",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p04_big_bounce.webp?v=27686a962bc3",
        "audioUrl": "/audio/production/en-US/story_page/one-big-bounce-shakes-the-branch-berries-fly-past-the-basket-d4423e5d4f.mp3",
        "text": [
          "One big bounce shakes the branch.",
          "Berries fly past the basket."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_berries_fly"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy’s big bounce shakes berries past Chompy’s basket.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "basket",
          "berries",
          "bounce",
          "branch"
        ]
      },
      {
        "id": "p05_berries_fly",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p05_berries_fly.webp?v=89a01a8f943f",
        "audioUrl": "/audio/production/en-US/story_page/chompy-runs-after-the-falling-berries-bouncy-tries-one-more-bounce-c50ff42ba4.mp3",
        "text": [
          "Chompy runs after the falling berries.",
          "Bouncy tries one more bounce."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_legs_give_up"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy chases the scattered berries with the basket while Bouncy begins another bounce.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "chompy",
          "berries",
          "bounce"
        ]
      },
      {
        "id": "p05_legs_give_up",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p05_legs_give_up.webp?v=580ea5976043",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-s-springs-fold-into-the-ferns-chompy-sits-beside-him-cfb7cb26c3.mp3",
        "text": [
          "Bouncy’s springs fold into the ferns.",
          "Chompy sits beside him."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_everyone_sticky"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy sprawls on soft ferns with slack folded springs; Chompy sits beside him; scattered berries remain on the ground.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy"
        ]
      },
      {
        "id": "p06_everyone_sticky",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p06_everyone_sticky.webp?v=c72582129366",
        "audioUrl": "/audio/production/en-US/story_page/they-pick-up-the-berries-chompy-rinses-them-in-the-stream-b9ec29f88f.mp3",
        "text": [
          "They pick up the berries.",
          "Chompy rinses them in the stream."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_grumpy_nose"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy gathers spilled berries and Chompy rinses them in a shallow stream beside the berry bush.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "berries"
        ]
      },
      {
        "id": "p07_grumpy_nose",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p07_grumpy_nose.webp?v=16659af42d27",
        "audioUrl": "/audio/production/en-US/story_page/chompy-carries-the-basket-to-the-rock-bouncy-walks-beside-him-f0898e71f9.mp3",
        "text": [
          "Chompy carries the basket to the rock.",
          "Bouncy walks beside him."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_berry_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Chompy carries the full clean basket to Big Flat Rock; Bouncy walks beside him on relaxed springs.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "chompy",
          "basket",
          "rock"
        ]
      },
      {
        "id": "p08_berry_ending",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p08_berry_ending.webp?v=f983fcce65fc",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-and-chompy-share-the-berries-one-berry-bounces-off-chompy-s-chin-00dfdbff99.mp3",
        "text": [
          "Bouncy and Chompy share the berries.",
          "One berry bounces off Chompy’s chin."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Bouncy and Chompy eat berries at the picnic rock; one berry playfully drops from Chompy’s chin.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "chompy",
          "berries",
          "berry",
          "bounces"
        ],
        "replayPrompt": "What will a different bounce change?"
      },
      {
        "id": "p04_careful_bounce",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p04_careful_bounce.webp?v=8dead9908a40",
        "audioUrl": "/audio/production/en-US/story_page/three-small-bounces-shake-two-berries-down-both-land-in-the-basket-1318aafa36.mp3",
        "text": [
          "Three small bounces shake two berries down.",
          "Both land in the basket."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_chompy_catches"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy makes a small bounce and two berries land in Chompy’s basket.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "basket",
          "berries",
          "bounces"
        ]
      },
      {
        "id": "p06_chompy_catches",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p06_chompy_catches.webp?v=1b5d25f08aa0",
        "audioUrl": "/audio/production/en-US/story_page/grumpy-joins-them-with-a-broad-leaf-it-slides-more-berries-into-the-bask-f4dea11571.mp3",
        "text": [
          "Grumpy joins them with a broad leaf.",
          "It slides more berries into the basket."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_cozy_cave"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Grumpy joins Chompy and Bouncy and uses a low angled broad leaf to funnel berries into their basket.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "grumpy",
          "basket",
          "berries",
          "leaf"
        ]
      },
      {
        "id": "p02_cozy_cave",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p02_cozy_cave.webp?v=cbc876dd02af",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-takes-the-basket-through-the-cave-his-friends-walk-round-the-hill-e479ca8603.mp3",
        "text": [
          "Bouncy takes the basket through the cave.",
          "His friends walk round the hill."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_tiptoe_out"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "At the cave entrance Chompy passes the full basket to Bouncy; Grumpy waits on the outside path round the hill.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "basket",
          "cave"
        ]
      },
      {
        "id": "p03_tiptoe_out",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p03_tiptoe_out.webp?v=dc6aa8432488",
        "audioUrl": "/audio/production/en-US/story_page/a-pebble-blocks-the-narrow-path-dozy-sleeps-just-beyond-it-50a66a85da.mp3",
        "text": [
          "A pebble blocks the narrow path.",
          "Dozy sleeps just beyond it."
        ],
        "choices": [
          {
            "label": "Step round it",
            "nextPageId": "p04_quiet_exit"
          },
          {
            "label": "Hop over it",
            "nextPageId": "p04_pebble_trip"
          }
        ],
        "choicePrompt": "How can Bouncy pass the pebble?",
        "imageAlt": "Bouncy pauses with the basket before one pebble beside sleeping Dozy and his blue pillow.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "dozy",
          "pebble"
        ]
      },
      {
        "id": "p04_quiet_exit",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p04_quiet_exit.webp?v=1e569cf5c1dd",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-steps-round-the-pebble-dozy-sleeps-on-affe51cc54.mp3",
        "text": [
          "Bouncy steps round the pebble.",
          "Dozy sleeps on."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_quiet_rock_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy steps around the pebble towards the cave exit; Dozy remains asleep.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "dozy",
          "pebble"
        ]
      },
      {
        "id": "p08_quiet_rock_ending",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p08_quiet_rock_ending.webp?v=ea902e764e5d",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-meets-his-friends-at-the-rock-they-share-the-berries-6c0fdca9be.mp3",
        "text": [
          "Bouncy meets his friends at the rock.",
          "They share the berries."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Bouncy, Chompy and Grumpy share berries at Big Flat Rock; Dozy remains asleep back in the cave.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "berries",
          "rock"
        ],
        "replayPrompt": "What will a different bounce change?"
      },
      {
        "id": "p04_pebble_trip",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p04_pebble_trip.webp?v=e37773308ee8",
        "audioUrl": "/audio/production/en-US/story_page/a-spring-taps-the-pebble-click-dozy-opens-one-sleepy-eye-7f6ab03589.mp3",
        "text": [
          "A spring taps the pebble. Click!",
          "Dozy opens one sleepy eye."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_cave_echo"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy’s spring taps the pebble against another stone and Dozy opens one eye.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "dozy",
          "pebble"
        ]
      },
      {
        "id": "p05_cave_echo",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p05_cave_echo.webp?v=4c7910032e98",
        "audioUrl": "/audio/production/en-US/story_page/sorry-dozy-says-bouncy-he-sets-the-basket-down-7818bd5889.mp3",
        "text": [
          "“Sorry, Dozy,” says Bouncy.",
          "He sets the basket down."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_dozy_advice"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Bouncy quietly sets the full basket on moss beside Dozy and apologises.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "dozy",
          "basket"
        ]
      },
      {
        "id": "p07_dozy_advice",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p07_dozy_advice.webp?v=43c8462d7e99",
        "audioUrl": "/audio/production/en-US/story_page/a-berry-says-dozy-bouncy-leads-him-to-the-picnic-59fc62d411.mp3",
        "text": [
          "“A berry?” says Dozy.",
          "Bouncy leads him to the picnic."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p08_rock_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Dozy asks for a berry and follows Bouncy towards the picnic; Bouncy carries the basket, and Dozy leaves his pillow in the cave.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "bouncy",
          "dozy",
          "berry",
          "picnic"
        ]
      },
      {
        "id": "p08_rock_ending",
        "imageUrl": "/images/story-quests/dino-pals/bouncy-big-bounce/p08_rock_ending.webp?v=f55235002afa",
        "audioUrl": "/audio/production/en-US/story_page/chompy-and-grumpy-make-room-for-dozy-four-friends-share-the-berries-0bd81de695.mp3",
        "text": [
          "Chompy and Grumpy make room for Dozy.",
          "Four friends share the berries."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "Chompy and Grumpy make space for Bouncy and Dozy at the picnic rock; all four eat berries.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "chompy",
          "grumpy",
          "dozy",
          "berries"
        ],
        "replayPrompt": "What will a different bounce change?"
      }
    ],
    "shortTitle": "Bouncy and the Berries",
    "hook": "One big bounce—or three little ones?",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "dp_ra_b_05_shys_snail_shade",
    "title": "Shy’s Snail Trail",
    "level": "B",
    "ageRange": "Ages 5-7",
    "adventureType": "Dino Pals Reading Adventure",
    "skillFocus": "Reading texture, moisture and position words in a gentle causal rescue.",
    "cycleFocus": "guided_reading_level_b_story_choice",
    "series": "Dino Pals",
    "characters": [
      "Shy"
    ],
    "location": "Sunny Hollow - Fernwood edge, stream, shaded fern bank",
    "targetWords": [
      "Shy",
      "snail",
      "sand",
      "shade",
      "leaf",
      "twig",
      "bark",
      "moss",
      "path",
      "gap",
      "log",
      "fern",
      "trail",
      "feelers",
      "damp"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "in",
      "on",
      "it",
      "they",
      "with"
    ],
    "hfw": [
      "a",
      "the",
      "in",
      "on",
      "it",
      "they",
      "with"
    ],
    "mediaFolder": "shy-snail-shade",
    "sentenceFrame": "Connected present-tense action; repeated concrete words change meaning with the route.",
    "genuineFailurePageId": "p02_leaf_failure",
    "coverImageUrl": "/images/story-quests/covers/shy-snail-trail.webp?v=348865245fd4",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p01_start.webp?v=71eaceb6be73",
        "audioUrl": "/audio/production/en-US/story_page/a-snail-stops-on-the-hot-sand-shy-looks-towards-the-cool-shade-bef07b354a.mp3",
        "text": [
          "A snail stops on the hot sand.",
          "Shy looks towards the cool shade."
        ],
        "choices": [
          {
            "label": "Offer a leaf",
            "nextPageId": "p02_leaf_failure"
          },
          {
            "label": "Lay a twig",
            "nextPageId": "p02_twig_failure"
          }
        ],
        "choicePrompt": "What can Shy try?",
        "imageAlt": "Shy watches a small snail on sunlit sand beside the deep shade of Fernwood.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "shy",
          "snail",
          "sand",
          "shade"
        ]
      },
      {
        "id": "p02_leaf_failure",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p02_leaf_failure.webp?v=fb07f657eaba",
        "audioUrl": "/audio/production/en-US/story_page/the-leaf-tips-under-the-snail-back-it-slides-onto-the-sand-f6fe4f1ab8.mp3",
        "text": [
          "The leaf tips under the snail.",
          "Back it slides onto the sand."
        ],
        "choices": [
          {
            "label": "Lay flat bark",
            "nextPageId": "p03_bark"
          },
          {
            "label": "Lay damp moss",
            "nextPageId": "p03_moss"
          }
        ],
        "choicePrompt": "What can lie flat?",
        "imageAlt": "Shy’s leaf tips and the snail slides gently back onto the sand.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "snail",
          "sand",
          "leaf"
        ]
      },
      {
        "id": "p02_twig_failure",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p02_twig_failure.webp?v=df0a2d3e4378",
        "audioUrl": "/audio/production/en-US/story_page/the-twig-rolls-under-the-snail-the-snail-pulls-in-its-feelers-58f859e46a.mp3",
        "text": [
          "The twig rolls under the snail.",
          "The snail pulls in its feelers."
        ],
        "choices": [
          {
            "label": "Lay flat bark",
            "nextPageId": "p03_bark"
          },
          {
            "label": "Lay damp moss",
            "nextPageId": "p03_moss"
          }
        ],
        "choicePrompt": "What can lie flat?",
        "imageAlt": "A rounded twig rolls and the snail withdraws into its shell; Shy pauses to give it space.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "snail",
          "twig",
          "feelers"
        ]
      },
      {
        "id": "p03_bark",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p03_bark.webp?v=cb5a40c00620",
        "audioUrl": "/audio/production/en-US/story_page/shy-lays-rough-bark-flat-on-the-sand-the-snail-crawls-onto-it-b7cae94742.mp3",
        "text": [
          "Shy lays rough bark flat on the sand.",
          "The snail crawls onto it."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_bark_steps"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "The snail crawls onto flat bark beside Shy.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "shy",
          "snail",
          "sand",
          "bark"
        ]
      },
      {
        "id": "p04_bark_steps",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p04_bark_steps.webp?v=2e6439284c6e",
        "audioUrl": "/audio/production/en-US/story_page/shy-moves-the-back-piece-ahead-the-snail-crawls-onto-the-next-piece-315550de09.mp3",
        "text": [
          "Shy moves the back piece ahead.",
          "The snail crawls onto the next piece."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_bark"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Shy moves an empty bark piece from behind the snail to the front of a three-piece path.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "shy",
          "snail"
        ]
      },
      {
        "id": "p05_bark",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p05_bark.webp?v=42cc2448181d",
        "audioUrl": "/audio/production/en-US/story_page/piece-by-piece-they-reach-the-shade-a-hollow-log-lies-ahead-122ca5f471.mp3",
        "text": [
          "Piece by piece, they reach the shade.",
          "A hollow log lies ahead."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_log_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Three reused bark pieces reach the shaded entrance of a hollow log; Shy and the snail arrive there.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "shade",
          "log"
        ]
      },
      {
        "id": "p06_log_ending",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p06_log_ending.webp?v=d8d95626d4df",
        "audioUrl": "/audio/production/en-US/story_page/the-snail-rests-in-the-log-its-silver-trail-curls-behind-it-58ca1a51d8.mp3",
        "text": [
          "The snail rests in the log.",
          "Its silver trail curls behind it."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "The snail rests inside the shaded hollow log; a silver trail curls nearby as Shy watches.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "snail",
          "log",
          "trail"
        ],
        "replayPrompt": "Will bark or moss help next time?"
      },
      {
        "id": "p03_moss",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p03_moss.webp?v=3bf34cbc9d08",
        "audioUrl": "/audio/production/en-US/story_page/shy-lays-damp-moss-on-the-sand-the-snail-reaches-the-cool-patch-5cbfe6e630.mp3",
        "text": [
          "Shy lays damp moss on the sand.",
          "The snail reaches the cool patch."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_moss_dots"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "The snail crawls onto a damp moss patch beside Shy.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "shy",
          "snail",
          "sand",
          "moss",
          "damp"
        ]
      },
      {
        "id": "p04_moss_dots",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p04_moss_dots.webp?v=55663a795b96",
        "audioUrl": "/audio/production/en-US/story_page/the-snail-reaches-a-bare-gap-it-pulls-in-its-feelers-457d3724ca.mp3",
        "text": [
          "The snail reaches a bare gap.",
          "It pulls in its feelers."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_moss_strip"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "The snail pauses at a gap between moss patches and draws in its feelers; Shy notices.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "snail",
          "gap",
          "feelers"
        ]
      },
      {
        "id": "p04_moss_strip",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p04_moss_strip.webp?v=6600405cbc84",
        "audioUrl": "/audio/production/en-US/story_page/shy-fills-the-gap-with-damp-moss-out-come-the-feelers-b66b22bbd3.mp3",
        "text": [
          "Shy fills the gap with damp moss.",
          "Out come the feelers!"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_moss"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "Shy gently fills the gap with damp moss; the snail extends its feelers and starts forward.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "shy",
          "moss",
          "gap",
          "feelers",
          "damp"
        ]
      },
      {
        "id": "p05_moss",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p05_moss.webp?v=5051a6200ab9",
        "audioUrl": "/audio/production/en-US/story_page/the-moss-path-reaches-the-cool-shade-the-snail-heads-under-a-fern-ce5e01672a.mp3",
        "text": [
          "The moss path reaches the cool shade.",
          "The snail heads under a fern."
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_fern_ending"
          }
        ],
        "choicePrompt": "",
        "imageAlt": "The snail follows the damp moss into fern shade with Shy beside it.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "snail",
          "shade",
          "moss",
          "path",
          "fern"
        ]
      },
      {
        "id": "p06_fern_ending",
        "imageUrl": "/images/story-quests/dino-pals/shy-snail-shade/p06_fern_ending.webp?v=020981c7c0ec",
        "audioUrl": "/audio/production/en-US/story_page/the-snail-rests-under-the-fern-one-feeler-peeks-past-shy-s-foot-a65be40e06.mp3",
        "text": [
          "The snail rests under the fern.",
          "One feeler peeks past Shy’s foot."
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "choicePrompt": "Read again or finish?",
        "imageAlt": "The snail shelters under the fern beside Shy’s foot; one feeler peeks out.",
        "narrationNeedsRebuild": false,
        "skillTags": [
          "snail",
          "fern"
        ],
        "replayPrompt": "Will bark or moss help next time?"
      }
    ],
    "shortTitle": "Shy’s Snail Trail",
    "hook": "Help one tiny snail reach the cool shade.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "story_quest_short_a_sam_pam_01",
    "title": "Sam and Pam and the Cat",
    "level": "Early",
    "ageRange": "Ages 4-5",
    "adventureType": "Decodable Story",
    "skillFocus": "Read short-a CVC words in a connected story; track how a problem is solved.",
    "cycleFocus": "short a CVC + HFW 1-25",
    "characters": [
      "Sam",
      "Pam",
      "Dad",
      "Cat"
    ],
    "location": "Home lawn and the van",
    "targetWords": [
      "Sam",
      "Pam",
      "Dad",
      "cat",
      "mat",
      "bag",
      "map",
      "van",
      "jam",
      "can",
      "pat",
      "tap",
      "nap"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "is",
      "in",
      "on",
      "has"
    ],
    "hfw": [
      "a",
      "the",
      "is",
      "in",
      "on",
      "has"
    ],
    "mediaFolder": "sam-pam",
    "sentenceFrame": "___ has the ___.",
    "genuineFailurePageId": "page-05",
    "coverImageUrl": "/images/story-quests/covers/sam-pam.webp?v=5bd53e0ea4ea",
    "wordCards": [
      {
        "word": "bag",
        "imageUrl": "/images/story-quests/sam-pam/words/word-bag.webp"
      },
      {
        "word": "cat",
        "imageUrl": "/images/story-quests/sam-pam/words/word-cat.webp"
      },
      {
        "word": "jam",
        "imageUrl": "/images/story-quests/sam-pam/words/word-jam.webp"
      },
      {
        "word": "map",
        "imageUrl": "/images/story-quests/sam-pam/words/word-map.webp"
      },
      {
        "word": "mat",
        "imageUrl": "/images/story-quests/sam-pam/words/word-mat.webp"
      },
      {
        "word": "van",
        "imageUrl": "/images/story-quests/sam-pam/words/word-van.webp"
      }
    ],
    "startPageId": "page-01",
    "pages": [
      {
        "id": "page-01",
        "text": [
          "Dad is in the van."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-01.webp?v=e3f29a511689",
        "audioUrl": "/audio/production/en-US/story_page/dad-is-in-the-van-0fcb108520.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "dad",
          "van"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "page-02"
          }
        ],
        "imageAlt": "Dad waits inside the teal van while Sam and Pam stand at the table with their map, yellow bag and rolled red mat."
      },
      {
        "id": "page-02",
        "text": [
          "Pam has a bag.",
          "Sam has a map."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-02.webp?v=cd51ab7ecff3",
        "audioUrl": "/audio/production/en-US/story_page/pam-has-a-bag-sam-has-a-map-a46b10ad10.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pam",
          "bag",
          "sam",
          "map"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "page-04"
          }
        ],
        "imageAlt": "Pam holds the yellow bag beside Sam, who holds the open map near the van."
      },
      {
        "id": "page-04",
        "text": [
          "The jam is in the bag."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-04.webp?v=d9387aea802f",
        "audioUrl": "/audio/production/en-US/story_page/the-jam-is-in-the-bag-49de371781.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "jam",
          "bag"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "page-05"
          }
        ],
        "imageAlt": "Sam and Pam look into the open yellow bag, where the jam jar is packed."
      },
      {
        "id": "page-05",
        "text": [
          "The cat is on the map."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-05.webp?v=e76aa8c19420",
        "audioUrl": "/audio/production/en-US/story_page/the-cat-is-on-the-map-2cc34d3474.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can they get the map?",
        "skillTags": [
          "cat",
          "map"
        ],
        "choices": [
          {
            "label": "Pat the cat",
            "nextPageId": "page-03"
          },
          {
            "label": "Tap the mat",
            "nextPageId": "page-06"
          }
        ],
        "imageAlt": "The ginger cat sits across the open map on the red mat while Sam and Pam look at the covered route."
      },
      {
        "id": "page-03",
        "text": [
          "Pam can pat the cat."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-03.webp?v=d3f18e09e2f5",
        "audioUrl": "/audio/production/en-US/story_page/pam-can-pat-the-cat-d2ec1ea06e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pam",
          "can",
          "pat",
          "cat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "page-07"
          }
        ],
        "imageAlt": "Pam pats the cat on the red mat beside the uncovered map; Sam reaches toward the map."
      },
      {
        "id": "page-06",
        "text": [
          "Sam can tap the mat."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-06.webp?v=5c326690b58d",
        "audioUrl": "/audio/production/en-US/story_page/sam-can-tap-the-mat-84a24d580a.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "sam",
          "can",
          "tap",
          "mat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "page-07"
          }
        ],
        "imageAlt": "Sam taps a clear place on the red mat; the cat stands there beside the uncovered map."
      },
      {
        "id": "page-07",
        "text": [
          "Sam has the map.",
          "Pam has the bag."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-07.webp?v=d32d233c2f76",
        "audioUrl": "/audio/production/en-US/story_page/sam-has-the-map-pam-has-the-bag-eaea179bdf.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Will they go or stay?",
        "skillTags": [
          "sam",
          "map",
          "pam",
          "bag"
        ],
        "choices": [
          {
            "label": "Go by van",
            "nextPageId": "page-10"
          },
          {
            "label": "Stay for a nap",
            "nextPageId": "page-09"
          }
        ],
        "imageAlt": "Sam lifts the uncovered map while Pam takes the yellow bag beside the van; the cat is on the mat away from the paper."
      },
      {
        "id": "page-10",
        "text": [
          "The cat can nap in the van."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-10.webp?v=10a02f57d087",
        "audioUrl": "/audio/production/en-US/story_page/the-cat-can-nap-in-the-van-ae0877ef0f.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Pat or tap next time?",
        "skillTags": [
          "cat",
          "can",
          "nap",
          "van"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "page-01"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "The ginger cat rests in its carrier between the belted children in the van, with the yellow bag secured below and Dad driving.",
        "replayPrompt": "Pat or tap next time?"
      },
      {
        "id": "page-09",
        "text": [
          "The cat can nap on the mat."
        ],
        "imageUrl": "/images/story-quests/sam-pam/page-09.webp?v=40dc548db3c1",
        "audioUrl": "/audio/production/en-US/story_page/the-cat-can-nap-on-the-mat-6b0ffa3ccc.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Pat or tap next time?",
        "skillTags": [
          "cat",
          "can",
          "nap",
          "mat"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "page-01"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "The cat curls up on the red mat in the home garden while Sam and Pam sit beside the packed yellow bag and their recovered map.",
        "replayPrompt": "Pat or tap next time?"
      }
    ],
    "shortTitle": "Sam and Pam",
    "hook": "The cat sits on their map just when it is time to go.",
    "phonicsScope": {
      "vowel": "short a",
      "wordShapes": [
        "single-letter CVC"
      ],
      "graphemes": [
        "a",
        "b",
        "c",
        "d",
        "g",
        "j",
        "m",
        "n",
        "p",
        "s",
        "t",
        "v"
      ],
      "properNames": [
        "Sam",
        "Pam",
        "Dad"
      ],
      "commonExceptionWords": [
        "a",
        "the",
        "is",
        "in",
        "on",
        "and",
        "has"
      ],
      "excludedPatterns": [
        "consonant digraphs",
        "consonant clusters",
        "inflected -s endings",
        "possessive -s"
      ],
      "note": "Only story-body print is an independent decoding target. Common words outside the declared short-a code are explicitly taught as the listed HFW. Capitalization does not change the code."
    },
    "supportedLanguage": {
      "mode": "spoken support",
      "fields": [
        "hook",
        "imageAlt",
        "choicePrompt",
        "choices.label"
      ],
      "interfaceExceptions": [
        "next",
        "read",
        "again",
        "finish",
        "go",
        "by",
        "stay",
        "for"
      ],
      "note": "Hear controls speak prompts and interface labels; these labels and the hook are not claimed as decodable story text. Pat the cat and Tap the mat are themselves within the story code.",
      "spokenSupportWordsOutsideStoryCode": [
        "again",
        "by",
        "finish",
        "for",
        "get",
        "go",
        "how",
        "it",
        "just",
        "next",
        "or",
        "read",
        "sits",
        "stay",
        "their",
        "they",
        "time",
        "to",
        "when",
        "will"
      ]
    },
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mp_ra_a_01_muddy_splashy_missing_hat",
    "title": "Muddy and Splashy: The Missing Hat",
    "level": "A",
    "ageRange": "Ages 4-5",
    "adventureType": "Reading Adventure",
    "skillFocus": "Read a repeated search sentence; connect a find with cleaning and returning an object.",
    "cycleFocus": "guided_reading_level_a_story_choice",
    "characters": [
      "Muddy",
      "Splashy",
      "Clucky"
    ],
    "location": "Sunny Meadow Farm - mud wallow, duck pond, farmyard, big red barn",
    "targetWords": [
      "hat",
      "mud",
      "muddy",
      "pond",
      "wet",
      "stick",
      "leaf",
      "washes",
      "fans",
      "wears",
      "splashes"
    ],
    "highFrequencyWords": [
      "a",
      "the",
      "is",
      "not",
      "in",
      "it",
      "off"
    ],
    "hfw": [
      "a",
      "the",
      "is",
      "not",
      "in",
      "it",
      "off"
    ],
    "mediaFolder": "muddy-splashy-hat",
    "sentenceFrame": "A ___ is not the hat.",
    "genuineFailurePageId": "p04_stick",
    "coverImageUrl": "/images/story-quests/covers/missing-hat.webp?v=d74dcb205409",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "The hat blows off Clucky."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p01_start.webp?v=eea8ad0b9704",
        "audioUrl": "/audio/production/en-US/story_page/the-hat-blows-off-clucky-fd879cf512.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Where will they look?",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Search the mud",
            "nextPageId": "p02_muddy"
          },
          {
            "label": "Search the pond",
            "nextPageId": "p02_splashy"
          }
        ],
        "imageAlt": "Clucky reaches after her red hat as the wind blows it between Muddy's mud patch and Splashy's pond."
      },
      {
        "id": "p02_muddy",
        "text": [
          "Muddy looks in the mud."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p02_muddy.webp?v=a470e6f1b209",
        "audioUrl": "/audio/production/en-US/story_page/muddy-looks-in-the-mud-88378848b9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "muddy",
          "mud"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_stick"
          }
        ],
        "imageAlt": "Muddy studies a small red shape sticking out of the mud beside the barn."
      },
      {
        "id": "p04_stick",
        "text": [
          "A stick is not the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p04_stick.webp?v=774bce7b7795",
        "audioUrl": "/audio/production/en-US/story_page/a-stick-is-not-the-hat-0cc1c15d9e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "stick",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_hat_muddy"
          }
        ],
        "imageAlt": "Muddy uncovers a red-brown stick in the mud and looks puzzled."
      },
      {
        "id": "p06_hat_muddy",
        "text": [
          "Muddy finds the muddy hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p06_hat_muddy.webp?v=6d5075475161",
        "audioUrl": "/audio/production/en-US/story_page/muddy-finds-the-muddy-hat-0a8dad2d6e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "muddy",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_wash_hat"
          }
        ],
        "imageAlt": "Muddy and Splashy look at Clucky's red hat, now uncovered and coated with mud."
      },
      {
        "id": "p07_wash_hat",
        "text": [
          "Splashy washes mud off the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p07_wash_hat.webp?v=1efffce466be",
        "audioUrl": "/audio/production/en-US/story_page/splashy-washes-mud-off-the-hat-7033b1775d.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "washes",
          "mud",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_dry_hat"
          }
        ],
        "imageAlt": "Splashy rinses Clucky's hat in the pond while Muddy holds it steady; the mud washes away."
      },
      {
        "id": "p02_splashy",
        "text": [
          "Splashy looks in the pond."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p02_splashy.webp?v=2bacc87ea600",
        "audioUrl": "/audio/production/en-US/story_page/splashy-looks-in-the-pond-427dc69338.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "pond"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_leaf"
          }
        ],
        "imageAlt": "Splashy searches beside the pond reeds for the red hat."
      },
      {
        "id": "p04_leaf",
        "text": [
          "A leaf is not the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p04_leaf.webp?v=223fc5020fc4",
        "audioUrl": "/audio/production/en-US/story_page/a-leaf-is-not-the-hat-0f7cf8075f.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "leaf",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_hat_wet"
          }
        ],
        "imageAlt": "Splashy finds a floating red leaf rather than the red hat."
      },
      {
        "id": "p06_hat_wet",
        "text": [
          "Splashy lifts the wet hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p06_hat_wet.webp?v=30e7c5296d20",
        "audioUrl": "/audio/production/en-US/story_page/splashy-lifts-the-wet-hat-ca96af2cd1.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "wet",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_dry_hat"
          }
        ],
        "imageAlt": "Splashy lifts Clucky's dripping red hat from the pond while Muddy watches from the bank."
      },
      {
        "id": "p07_dry_hat",
        "text": [
          "Splashy fans the wet hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p07_dry_hat.webp?v=a48dff74106b",
        "audioUrl": "/audio/production/en-US/story_page/splashy-fans-the-wet-hat-826405499b.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "fans",
          "wet",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_clucky_muddy_hat"
          }
        ],
        "imageAlt": "Splashy fans the clean wet hat with spread wings while Muddy watches."
      },
      {
        "id": "p07_clucky_muddy_hat",
        "text": [
          "Clucky takes the dry hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p07_clucky_muddy_hat.webp?v=2ba86d67acb5",
        "audioUrl": "/audio/production/en-US/story_page/clucky-takes-the-dry-hat-00b9592674.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "What will Clucky do?",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Clucky wears it",
            "nextPageId": "p09_pond_ending"
          },
          {
            "label": "Lend it to Muddy",
            "nextPageId": "p09_fancy_muddy_ending"
          }
        ],
        "imageAlt": "Clucky receives the clean dry hat from Muddy and Splashy beside the barn."
      },
      {
        "id": "p09_pond_ending",
        "text": [
          "Clucky wears it. Splashy splashes."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p09_pond_ending.webp?v=871d7a01a7fa",
        "audioUrl": "/audio/production/en-US/story_page/clucky-wears-it-splashy-splashes-d0d413b886.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Try the other search?",
        "skillTags": [
          "wears",
          "splashes"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Clucky wears her clean red hat while Splashy splashes in the pond and Muddy watches.",
        "replayPrompt": "Try the other search?"
      },
      {
        "id": "p09_fancy_muddy_ending",
        "text": [
          "Clucky lets Muddy wear the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/muddy-splashy-hat/p09_fancy_muddy_ending.webp?v=8f8a91e70d59",
        "audioUrl": "/audio/production/en-US/story_page/clucky-lets-muddy-wear-the-hat-cc5a8d1986.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Who wears it next?",
        "skillTags": [
          "muddy",
          "hat"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Muddy wears the clean hat with Clucky's welcoming wing gesture while Splashy watches.",
        "replayPrompt": "Who wears it next?"
      }
    ],
    "shortTitle": "The Missing Hat",
    "hook": "A red hat blows away, and two friends find a muddy surprise.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mp_ra_a_02_shy_cuddly_quiet_adventure",
    "title": "Shy and Cuddly: A Quiet Hello",
    "level": "A",
    "ageRange": "Ages 4-5",
    "adventureType": "Reading Adventure",
    "skillFocus": "Read concrete actions and track how giving space changes a meeting.",
    "cycleFocus": "guided_reading_level_a_story_choice",
    "characters": [
      "Shy",
      "Cuddly"
    ],
    "location": "Sunny Meadow Farm - big red barn, big oak tree, flower meadow",
    "targetWords": [
      "comes",
      "calls",
      "jumps",
      "back",
      "tree",
      "sits",
      "hug",
      "rests",
      "nearby"
    ],
    "highFrequencyWords": [
      "the",
      "and",
      "to"
    ],
    "hfw": [
      "the",
      "and",
      "to"
    ],
    "mediaFolder": "shy-cuddly-quiet",
    "sentenceFrame": "Shy ___. Cuddly ___.",
    "genuineFailurePageId": "p04_call_shy",
    "coverImageUrl": "/images/story-quests/covers/quiet-hello.webp?v=00d20859961a",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "Cuddly comes to meet Shy."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p01_start.webp?v=615763405ee7",
        "audioUrl": "/audio/production/en-US/story_page/cuddly-comes-to-meet-shy-9867c6ca86.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "comes"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_call_shy"
          }
        ],
        "imageAlt": "Cuddly approaches the barn, where Shy peeks around the door with room to step back."
      },
      {
        "id": "p04_call_shy",
        "text": [
          "Cuddly calls. Shy jumps."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p04_call_shy.webp?v=1d085922ba11",
        "audioUrl": "/audio/production/en-US/story_page/cuddly-calls-shy-jumps-bf06a5f762.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "calls",
          "jumps"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_cuddly"
          }
        ],
        "imageAlt": "Cuddly cups paws around the mouth for a big greeting, and Shy jumps in surprise beside the barn door."
      },
      {
        "id": "p02_cuddly",
        "text": [
          "Cuddly steps back."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p02_cuddly.webp?v=f6ec595d2ff7",
        "audioUrl": "/audio/production/en-US/story_page/cuddly-steps-back-b5d97acf52.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "back"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p06_go_to_tree"
          }
        ],
        "imageAlt": "Cuddly lowers both paws and steps away from the barn door, leaving Shy a clear open space."
      },
      {
        "id": "p06_go_to_tree",
        "text": [
          "Shy leads Cuddly to the tree."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p06_go_to_tree.webp?v=3c2a274d1d34",
        "audioUrl": "/audio/production/en-US/story_page/shy-leads-cuddly-to-the-tree-5947acab95.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "tree"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_tree_under"
          }
        ],
        "imageAlt": "Shy walks ahead toward the oak tree while Cuddly follows at a comfortable distance."
      },
      {
        "id": "p07_tree_under",
        "text": [
          "Shy sits. Cuddly waits nearby."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p07_tree_under.webp?v=8d41e25bcc8a",
        "audioUrl": "/audio/production/en-US/story_page/shy-sits-cuddly-waits-nearby-3b27fb58d8.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How close will Shy sit?",
        "skillTags": [
          "sits",
          "nearby"
        ],
        "choices": [
          {
            "label": "Have a hug",
            "nextPageId": "p08_tree_hug"
          },
          {
            "label": "Leave a little space",
            "nextPageId": "p08_tree_purr"
          }
        ],
        "imageAlt": "Shy and Cuddly sit on the grass with a clear gap between them."
      },
      {
        "id": "p08_tree_hug",
        "text": [
          "Shy and Cuddly hug."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p08_tree_hug.webp?v=7f48866a1f3f",
        "audioUrl": "/audio/production/en-US/story_page/shy-and-cuddly-hug-0a385ef362.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Try a different hello?",
        "skillTags": [
          "hug"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Shy leans willingly into a gentle hug with Cuddly beneath the tree.",
        "replayPrompt": "Try a different hello?"
      },
      {
        "id": "p08_tree_purr",
        "text": [
          "Shy rests. Cuddly rests nearby."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/shy-cuddly-quiet/p08_tree_purr.webp?v=4d182674c6ae",
        "audioUrl": "/audio/production/en-US/story_page/shy-rests-cuddly-rests-nearby-4f91372ee9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Try a different hello?",
        "skillTags": [
          "rests",
          "nearby"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Shy sits comfortably apart from the curled-up Cuddly on the grass, with open space between them.",
        "replayPrompt": "Try a different hello?"
      }
    ],
    "shortTitle": "A Quiet Hello",
    "hook": "Cuddly's big hello is too loud, so Shy chooses a quieter way to meet.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mp_ra_a_03_bouncy_speedy_fast_map",
    "title": "Bouncy and Speedy: The Flying Map",
    "level": "A",
    "ageRange": "Ages 4-5",
    "adventureType": "Reading Adventure",
    "skillFocus": "Connect a map with visible landmarks; compare two ways to solve one problem.",
    "cycleFocus": "guided_reading_level_a_story_choice",
    "characters": [
      "Bouncy",
      "Speedy",
      "Tiny"
    ],
    "location": "Sunny Meadow Farm - farmyard, barn, duck pond, big hill, big oak tree",
    "targetWords": [
      "map",
      "tree",
      "runs",
      "wind",
      "jumps",
      "higher",
      "springs",
      "catches",
      "barn",
      "home",
      "berries",
      "find"
    ],
    "highFrequencyWords": [
      "the",
      "and",
      "to",
      "with",
      "it",
      "them",
      "up"
    ],
    "hfw": [
      "the",
      "and",
      "to",
      "with",
      "it",
      "them",
      "up"
    ],
    "mediaFolder": "bouncy-speedy-map",
    "sentenceFrame": "___ the map.",
    "genuineFailurePageId": "p04_too_fast",
    "coverImageUrl": "/images/story-quests/covers/flying-map.webp?v=ff9e750ef609",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "Bouncy wants to find Tiny."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p01_start.webp?v=d33f32dacd42",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-wants-to-find-tiny-f5dd48c123.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "find"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_speedy"
          }
        ],
        "imageAlt": "Bouncy and Speedy study their map beside the barn, with the distant oak beyond the pond."
      },
      {
        "id": "p02_speedy",
        "text": [
          "Speedy runs off with the map."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p02_speedy.webp?v=3fb5b18284e1",
        "audioUrl": "/audio/production/en-US/story_page/speedy-runs-off-with-the-map-037191d722.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "runs",
          "map"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_barn_fast"
          }
        ],
        "imageAlt": "Speedy runs along the path holding the map in his mouth while Bouncy follows behind."
      },
      {
        "id": "p03_barn_fast",
        "text": [
          "The wind takes the map."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p03_barn_fast.webp?v=bc86936f1622",
        "audioUrl": "/audio/production/en-US/story_page/the-wind-takes-the-map-fe6691fc35.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "wind",
          "map"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_too_fast"
          }
        ],
        "imageAlt": "A gust lifts the map out of Speedy's mouth while Bouncy follows and watches it rise."
      },
      {
        "id": "p04_too_fast",
        "text": [
          "Speedy jumps. The map sails higher."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p04_too_fast.webp?v=6bb7dc526006",
        "audioUrl": "/audio/production/en-US/story_page/speedy-jumps-the-map-sails-higher-5750c8146e.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can they catch it?",
        "skillTags": [
          "jumps",
          "map",
          "higher"
        ],
        "choices": [
          {
            "label": "Jump with Bouncy",
            "nextPageId": "p02_bouncy"
          },
          {
            "label": "Run ahead with Speedy",
            "nextPageId": "p04_map_caught"
          }
        ],
        "imageAlt": "Speedy jumps toward the map but misses as it floats above his nose; Bouncy watches from below."
      },
      {
        "id": "p02_bouncy",
        "text": [
          "Bouncy springs up and catches it."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p02_bouncy.webp?v=b6c542d5cd1f",
        "audioUrl": "/audio/production/en-US/story_page/bouncy-springs-up-and-catches-it-381df69ae9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "springs",
          "catches"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_speedy_waits"
          }
        ],
        "imageAlt": "Bouncy stretches both spring legs in a high jump and catches the map while Speedy waits below."
      },
      {
        "id": "p04_map_caught",
        "text": [
          "Speedy runs ahead and catches it."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p04_map_caught.webp?v=996133639957",
        "audioUrl": "/audio/production/en-US/story_page/speedy-runs-ahead-and-catches-it-5e24824571.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "runs",
          "catches"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_speedy_waits"
          }
        ],
        "imageAlt": "Speedy catches the falling map in his mouth farther along the path as Bouncy arrives behind."
      },
      {
        "id": "p05_speedy_waits",
        "text": [
          "They spread out the map."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p05_speedy_waits.webp?v=c843dd628a4b",
        "audioUrl": "/audio/production/en-US/story_page/they-spread-out-the-map-c22edd7ec7.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "map"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_barn"
          }
        ],
        "imageAlt": "Bouncy and Speedy spread the recovered map flat on the path and examine the dotted route together."
      },
      {
        "id": "p03_barn",
        "text": [
          "The path goes past the barn."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p03_barn.webp?v=d97b106e7d39",
        "audioUrl": "/audio/production/en-US/story_page/the-path-goes-past-the-barn-99850b3ab9.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "barn"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_big_tree"
          }
        ],
        "imageAlt": "Bouncy and Speedy walk together past the red barn, with the map held steadily between them and the pond ahead."
      },
      {
        "id": "p05_big_tree",
        "text": [
          "Tiny waves from the big tree."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p05_big_tree.webp?v=6fd68419d680",
        "audioUrl": "/audio/production/en-US/story_page/tiny-waves-from-the-big-tree-60041fdaa3.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "What will they do now?",
        "skillTags": [
          "tree"
        ],
        "choices": [
          {
            "label": "Share the berries",
            "nextPageId": "p09_tiny_snack_ending"
          },
          {
            "label": "Follow the map home",
            "nextPageId": "p09_home_ending"
          }
        ],
        "imageAlt": "Tiny waves beneath the oak beside a small bowl of red berries as Bouncy and Speedy arrive with the map."
      },
      {
        "id": "p09_tiny_snack_ending",
        "text": [
          "Tiny shares the red berries."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p09_tiny_snack_ending.webp?v=eef011a831a4",
        "audioUrl": "/audio/production/en-US/story_page/tiny-shares-the-red-berries-0289a6be39.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Catch the map another way?",
        "skillTags": [
          "berries"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Tiny offers the red berries to Bouncy and Speedy under the oak, with the recovered map open beside them.",
        "replayPrompt": "Catch the map another way?"
      },
      {
        "id": "p09_home_ending",
        "text": [
          "The map leads them home."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/bouncy-speedy-map/p09_home_ending.webp?v=0ad290fa527e",
        "audioUrl": "/audio/production/en-US/story_page/the-map-leads-them-home-e4bc0ba3c3.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Catch the map another way?",
        "skillTags": [
          "map",
          "home"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Bouncy and Speedy arrive back at the same barn gate using their recovered map.",
        "replayPrompt": "Catch the map another way?"
      }
    ],
    "shortTitle": "The Flying Map",
    "hook": "Their map blows away before they can find Tiny at the big tree.",
    "contentRevision": "2026-09-29-story-quests-v2"
  },
  {
    "id": "mp_ra_a_04_brave_tiny_big_little_rescue",
    "title": "Brave and Tiny: The Little Rescue",
    "level": "A",
    "ageRange": "Ages 4-5",
    "adventureType": "Reading Adventure",
    "skillFocus": "Follow a goal, a failed attempt and a practical rescue using in, out and up.",
    "cycleFocus": "guided_reading_level_a_story_choice",
    "characters": [
      "Brave",
      "Tiny",
      "Woolly",
      "Clucky"
    ],
    "location": "Sunny Meadow Farm - big barn, stone wall, flower pot, hay bale, little stream",
    "targetWords": [
      "hat",
      "thread",
      "pot",
      "slips",
      "stuck",
      "rope",
      "climbs",
      "tips",
      "feathers"
    ],
    "highFrequencyWords": [
      "the",
      "a",
      "and",
      "in",
      "up",
      "with",
      "to"
    ],
    "hfw": [
      "the",
      "a",
      "and",
      "in",
      "up",
      "with",
      "to"
    ],
    "mediaFolder": "brave-tiny-rescue",
    "sentenceFrame": "___ the hat.",
    "genuineFailurePageId": "p05_brave_stuck",
    "coverImageUrl": "/images/story-quests/covers/little-rescue.webp?v=1a966f23923f",
    "startPageId": "p01_start",
    "pages": [
      {
        "id": "p01_start",
        "text": [
          "The hat blows off Clucky."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p01_start.webp?v=676e2399d1cb",
        "audioUrl": "/audio/production/en-US/story_page/the-hat-blows-off-clucky-fd879cf512.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p02_brave"
          }
        ],
        "imageAlt": "Clucky's red hat blows toward a large flowerpot as Brave, Tiny and Woolly turn to follow."
      },
      {
        "id": "p02_brave",
        "text": [
          "Brave spots a red thread."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p02_brave.webp?v=c6cca0aa5943",
        "audioUrl": "/audio/production/en-US/story_page/brave-spots-a-red-thread-703306e4a4.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "thread"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p03_pot"
          }
        ],
        "imageAlt": "Brave and Tiny follow the red thread from the path toward the flowerpot."
      },
      {
        "id": "p03_pot",
        "text": [
          "The thread leads into the pot."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p03_pot.webp?v=bb3e1ea03beb",
        "audioUrl": "/audio/production/en-US/story_page/the-thread-leads-into-the-pot-b7e82cd289.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "thread",
          "pot"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_hat_in_pot"
          }
        ],
        "imageAlt": "A red thread runs over the flowerpot rim to the red hat inside; Brave and Tiny inspect it."
      },
      {
        "id": "p04_hat_in_pot",
        "text": [
          "Brave leans in for the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p04_hat_in_pot.webp?v=d7a722b11c0d",
        "audioUrl": "/audio/production/en-US/story_page/brave-leans-in-for-the-hat-aaa6188af8.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_brave_stuck"
          }
        ],
        "imageAlt": "Brave leans over the pot from a low crate toward the hat, while Tiny waits with the rope."
      },
      {
        "id": "p05_brave_stuck",
        "text": [
          "Brave slips in and gets stuck."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p05_brave_stuck.webp?v=ce102640c78a",
        "audioUrl": "/audio/production/en-US/story_page/brave-slips-in-and-gets-stuck-2e2f75fb78.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "How can Brave get out?",
        "skillTags": [
          "slips",
          "stuck"
        ],
        "choices": [
          {
            "label": "Tip with Woolly",
            "nextPageId": "p06_woolly_helps"
          },
          {
            "label": "Use Tiny's rope",
            "nextPageId": "p06_tiny_helps"
          }
        ],
        "imageAlt": "Brave is inside the upright flowerpot with the hat at the bottom; Tiny and Woolly look over the rim."
      },
      {
        "id": "p06_woolly_helps",
        "text": [
          "Woolly tips. Brave carries the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p06_woolly_helps.webp?v=03daa9907722",
        "audioUrl": "/audio/production/en-US/story_page/woolly-tips-brave-carries-the-hat-9912a0b08c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "tips",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_hat_found"
          }
        ],
        "imageAlt": "Woolly gently tips the pot onto the hay while Brave walks out carrying the red hat, with Tiny beside them."
      },
      {
        "id": "p06_tiny_helps",
        "text": [
          "Tiny drops a rope to Brave."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p06_tiny_helps.webp?v=74a36854e237",
        "audioUrl": "/audio/production/en-US/story_page/tiny-drops-a-rope-to-brave-d9b4ae15e6.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "rope"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p04_tiny_in_pot"
          }
        ],
        "imageAlt": "Tiny lowers a tan rope into the pot to Brave; the other end is securely tied around the nearby fence post."
      },
      {
        "id": "p04_tiny_in_pot",
        "text": [
          "Brave climbs up with the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p04_tiny_in_pot.webp?v=03dd3ab21974",
        "audioUrl": "/audio/production/en-US/story_page/brave-climbs-up-with-the-hat-4e1889791c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "climbs",
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p05_hat_found"
          }
        ],
        "imageAlt": "Brave climbs the anchored rope out of the pot while holding the red hat, and Tiny guides the rope from outside."
      },
      {
        "id": "p05_hat_found",
        "text": [
          "Brave gives Tiny the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p05_hat_found.webp?v=ab7f1f4bfdbf",
        "audioUrl": "/audio/production/en-US/story_page/brave-gives-tiny-the-hat-307ba91b4f.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Next",
            "nextPageId": "p07_clucky_happy"
          }
        ],
        "imageAlt": "Brave passes the recovered red hat to Tiny in the open grass beside Clucky."
      },
      {
        "id": "p07_clucky_happy",
        "text": [
          "Tiny gives Clucky the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p07_clucky_happy.webp?v=ef29b3406bab",
        "audioUrl": "/audio/production/en-US/story_page/tiny-gives-clucky-the-hat-e2206d123c.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "What will Clucky offer?",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Give two feathers",
            "nextPageId": "p09_fancy_brave_ending"
          },
          {
            "label": "Lend the hat",
            "nextPageId": "p06_hat_on_brave"
          }
        ],
        "imageAlt": "Tiny gives the red hat back to Clucky, who lowers a wing to receive it while Brave watches."
      },
      {
        "id": "p09_fancy_brave_ending",
        "text": [
          "Clucky shares two red feathers."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p09_fancy_brave_ending.webp?v=ec17927c975d",
        "audioUrl": "/audio/production/en-US/story_page/clucky-shares-two-red-feathers-c458ecaba6.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Try the other rescue?",
        "skillTags": [
          "feathers"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Clucky wears her returned hat and offers one red feather to Brave and one to Tiny.",
        "replayPrompt": "Try the other rescue?"
      },
      {
        "id": "p06_hat_on_brave",
        "text": [
          "Clucky lets Brave try the hat."
        ],
        "imageUrl": "/images/story-quests/meadow-pals/brave-tiny-rescue/p06_hat_on_brave.webp?v=a1cb943f0339",
        "audioUrl": "/audio/production/en-US/story_page/clucky-lets-brave-try-the-hat-76a7bf1e74.mp3",
        "narrationNeedsRebuild": false,
        "choicePrompt": "Try the other rescue?",
        "skillTags": [
          "hat"
        ],
        "choices": [
          {
            "label": "Read again",
            "nextPageId": "p01_start"
          },
          {
            "label": "Finish",
            "nextPageId": "end"
          }
        ],
        "imageAlt": "Brave wears Clucky's oversized hat with permission while Clucky and Tiny enjoy the playful try-on.",
        "replayPrompt": "Try the other rescue?"
      }
    ],
    "shortTitle": "The Little Rescue",
    "hook": "Brave falls into a flowerpot while helping Clucky find her hat.",
    "contentRevision": "2026-09-29-story-quests-v2"
  }
];

export const dinoPalsStoryQuestMetadata = storyQuests
  .filter(quest => quest.series === "Dino Pals")
  .map(({ id, title, level, ageRange, adventureType, skillFocus, cycleFocus, series, mediaFolder }) =>
    ({ id, title, level, ageRange, adventureType, skillFocus, cycleFocus, series, mediaFolder }));

export const dinoPalsV2MediaPendingStoryQuestDrafts = [];

export function getStoryQuestById(id) {
  return storyQuests.find(quest => quest.id === id) || null;
}
