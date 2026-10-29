import { GUIDED_READING_NEXT_STEPS_LEVEL_REVIEWS } from "./guidedReadingNextStepsBooks.js";
import { GUIDED_READING_BRIGHT_IDEAS_LEVEL_REVIEWS } from "./guidedReadingBrightIdeasBooks.js";
// Authored full-manuscript reviews; never infer a public level from legacy placement or text length.
// Update a fingerprint only after reviewing the entire changed manuscript.
export const GUIDED_READING_LEVEL_REVIEWS = Object.freeze({
  ...GUIDED_READING_NEXT_STEPS_LEVEL_REVIEWS,
  ...GUIDED_READING_BRIGHT_IDEAS_LEVEL_REVIEWS,
  "gr-a-26": {
    "appReadingLevel": "C",
    "rationale": "The dog and cat care lists combine several needs, then hay and room to fly distinguish other pets; the final different-kinds-of-care statement gathers the examples into a comparison.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:032ced625a8facc8",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short declaratives with coordinated lists and infinitive purposes.",
      "vocabulary": "Exercise, quiet, hay and care extend everyday pet nouns.",
      "knowledge": "Needs differ by animal rather than one care routine fitting all.",
      "progression": "Six examples culminate in an explicit generalization.",
      "inference": "Low; care differences are stated, not deduced."
    }
  },
  "gr-a-27": {
    "appReadingLevel": "D",
    "rationale": "Sunlight reaching our side of Earth, heat warming land and water, and plants making food connect the Sun to several functions; the safety instruction adds another sentence shape.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:467d1a2a6c7343dd",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Declaratives plus a two-sentence imperative page.",
      "vocabulary": "Huge star, sunlight, daytime and life on Earth.",
      "knowledge": "Links an astronomical object to daytime, heat and plant food.",
      "progression": "Moves from identity through effects to safety and synthesis.",
      "inference": "Moderate conceptual connection; mechanisms are compressed."
    }
  },
  "gr-a-28": {
    "appReadingLevel": "B",
    "rationale": "The can-look color frame repeats around red apples, blue sky and green grass; ripe, clear and the final spotting question create modest variation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:8476ed9900934ad5",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "One short clause per example, then two brief directions/questions.",
      "vocabulary": "Familiar colors with ripe, clear, fresh and Earth.",
      "knowledge": "Observable colors with a qualified yellow-looking Sun.",
      "progression": "A series of examples followed by an explicit noticing invitation.",
      "inference": "Minimal; no explanation of color is required."
    }
  },
  "gr-a-29": {
    "appReadingLevel": "B",
    "rationale": "Eyes help me see repeats through familiar body actions, with coordinated eat-and-speak and hold-and-make phrases before the ownership and care close.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2615f5f645d1bbd4",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated helps-me clauses; a final coordinated sentence.",
      "vocabulary": "Familiar body parts and common action verbs.",
      "knowledge": "Concrete functions and body ownership.",
      "progression": "Repeated examples expand into one whole-body statement.",
      "inference": "Low; every function is explicit."
    }
  },
  "gr-b-31": {
    "appReadingLevel": "C",
    "rationale": "Seasonal observations introduce buds, late summer daylight and frost, then explicitly return to spring; the text describes a cycle without explaining its hidden cause.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1fe96a7678cabc14",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied declaratives with some, many and may qualifiers.",
      "vocabulary": "Buds, frost, season and pattern.",
      "knowledge": "Recognizing changing seasons and yearly recurrence.",
      "progression": "Spring-to-winter observations end with spring again.",
      "inference": "Low; the return is explicitly stated."
    }
  },
  "gr-b-32": {
    "appReadingLevel": "C",
    "rationale": "Bite an apple and a paired crisp sentence introduce sensory comparisons; bunches and bumpy peel lead to the explicit fact that fruit grows from a flower.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:7f013edfb319f23a",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Imperative, paired declaratives and a question.",
      "vocabulary": "Crisp, ripe, bunches, bumpy peel and flower.",
      "knowledge": "Fruit properties plus a simple origin relationship.",
      "progression": "Examples give way to a question answered on the last page.",
      "inference": "Low; the flower connection is supplied."
    }
  },
  "gr-b-33": {
    "appReadingLevel": "C",
    "rationale": "Each tool has a concrete job, but wrench turning nuts and bolts and a ruler checking length require specific vocabulary; the final safety pair broadens the pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:e36b413ea124e183",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short subject-verb-object clauses; two sentences at the close.",
      "vocabulary": "Hammer, saw, wrench, bolts, drill and length.",
      "knowledge": "Tools are differentiated by purpose.",
      "progression": "Parallel examples culminate in jobs and adult help.",
      "inference": "Low; uses are stated directly."
    }
  },
  "gr-b-34": {
    "appReadingLevel": "D",
    "rationale": "Sunlight reaches one side of Earth and our place turns away from it; the darkening sky and alternating day and night depend on a spatial rotation explanation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:79e718c95179810a",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Very short declaratives with that-side and our-place references.",
      "vocabulary": "Sunlight, Earth, reaches and turns away.",
      "knowledge": "Relating a turning Earth to local day and night.",
      "progression": "Linked causal steps rather than separate sky observations.",
      "inference": "Moderate spatial modeling despite explicit wording."
    }
  },
  "gr-b-35": {
    "appReadingLevel": "C",
    "rationale": "Chef and teacher examples are supported by a job-action pattern, while firefighter, blaze and emergency widen vocabulary before the town-level summary.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:7d9f78b43e79343a",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Mostly short job-action clauses with one broader closing statement.",
      "vocabulary": "Chef, firefighter, blaze, police and emergency.",
      "knowledge": "Familiar occupations with different community functions.",
      "progression": "A set of jobs leads to an explicit shared purpose.",
      "inference": "Low; the social connection is stated."
    }
  },
  "gr-c-37": {
    "appReadingLevel": "D",
    "rationale": "Freeze and invisible vapor connect changes of state with plant roots and drinking; the final sentence explicitly classifies ice, liquid and vapor as forms of water.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:6a91d9a5d41aa717",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses with cause/change constructions and a closing three-item classification.",
      "vocabulary": "Liquid, freeze, invisible vapor, roots and forms.",
      "knowledge": "Water changes state while remaining water.",
      "progression": "Properties and changes precede uses and synthesis.",
      "inference": "Moderate; unseen vapor and same-substance identity need conceptual integration."
    }
  },
  "gr-c-38": {
    "appReadingLevel": "C",
    "rationale": "Repeated body-part functions support tongue and warmth; the ending connects five senses working together to learning rather than only listing actions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:62721532601c9a43",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short help-us statements and two final linked sentences.",
      "vocabulary": "Tongue, touch, warmth and senses.",
      "knowledge": "Functions of five senses and their combination.",
      "progression": "Five examples become one explicit learning connection.",
      "inference": "Low; synthesis is provided."
    }
  },
  "gr-c-39": {
    "appReadingLevel": "C",
    "rationale": "Wheel face, roof edge and egg outline show different ways flat shapes appear on solid things; the conclusion explicitly names that distinction.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:faf81a7f15e8dbec",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied demonstratives with one paired-sentence opening.",
      "vocabulary": "Triangle, rectangle, oval, edge, outline and solid.",
      "knowledge": "Recognizing a flat aspect of a three-dimensional object.",
      "progression": "Concrete examples end with the flat-on-solid generalization.",
      "inference": "Low to moderate visual abstraction; properties are not formally derived."
    }
  },
  "gr-d-42": {
    "appReadingLevel": "D",
    "rationale": "Coasts, peaks, deep oceans and continents widen the scale from a home in space to a little park as one part of Earth; that part-whole structure raises conceptual demand.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:dcf423a05456f72b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied declaratives and a long coordinated closing list.",
      "vocabulary": "Coast, peaks, oceans, forests and continents.",
      "knowledge": "Geographic categories at different scales and their shared planet.",
      "progression": "Broad Earth overview narrows to the local park.",
      "inference": "Moderate spatial/part-whole integration."
    }
  },
  "gr-d-43": {
    "appReadingLevel": "B",
    "rationale": "First-person wash, eat, drink and brush statements describe familiar routines; twice a day and the final habits-care statement modestly vary the repeated I opening.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:fd102069774a8b6d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short first-person clauses with common time phrases.",
      "vocabulary": "Soap, brush, twice, habits and body.",
      "knowledge": "Familiar health routines without biological mechanisms.",
      "progression": "Examples end in a directly stated care benefit.",
      "inference": "Low; no hidden health causes must be explained."
    }
  },
  "gr-d-44": {
    "appReadingLevel": "D",
    "rationale": "Nest, den, burrow and pond examples distinguish a shelter from the wider food-water-shelter habitat; the nest-is-just-one-part ending requires a category relationship.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:78eb72b263083520",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short explanatory clauses plus a two-sentence definition ending.",
      "vocabulary": "Shelter, den, burrow, web and habitat.",
      "knowledge": "Part-whole distinction between habitat and shelter.",
      "progression": "Examples prepare the final definition and contrast.",
      "inference": "Moderate conceptual classification; the distinction is explicit but must be integrated."
    }
  },
  "gr-d-45": {
    "appReadingLevel": "D",
    "rationale": "Earth around Sun and Moon around Earth establish different orbital relationships; nearest, beyond and farther away then contrast the objects' distances.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:8297fa239ef39367",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short relational clauses with a paired-sentence close.",
      "vocabulary": "Nearest, circles, astronauts, spacecraft and planets.",
      "knowledge": "Two orbital reference points and relative space distances.",
      "progression": "Object relationships build to near/far comparison.",
      "inference": "Moderate spatial understanding beyond object naming."
    }
  },
  "gr-e-46": {
    "appReadingLevel": "C",
    "rationale": "Dry scaly skin and egg laying introduce reptiles; snakes, turtles and basking lizards give concrete examples, ending in an explicit warm-Sun link to movement and hunting.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:434c6b06fe27a91c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short declaratives with most/many qualifiers and one stated cause.",
      "vocabulary": "Reptiles, scaly, shell, protect and bask.",
      "knowledge": "An animal class, body features and a basic warmth benefit.",
      "progression": "General features lead to examples and one direct functional link.",
      "inference": "Low; no body-temperature mechanism or multi-step explanation is required."
    }
  },
  "gr-e-47": {
    "appReadingLevel": "D",
    "rationale": "Root-stem-leaf growth, tadpole-to-frog change and caterpillar-chrysalis-butterfly change combine into a comparison of growing bigger and changing shape.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:dabdc17d863d84f7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Simple clauses with lists and paired transformation sentences.",
      "vocabulary": "Tadpole, caterpillar, chrysalis, stem and living things.",
      "knowledge": "Different biological transformations within a shared growth concept.",
      "progression": "General needs precede three transformations and a synthesis.",
      "inference": "Moderate comparison across distinct life changes."
    }
  },
  "gr-e-48": {
    "appReadingLevel": "D",
    "rationale": "Wood and glass contrasts support the reading, but two poles, opposite-pole attraction and matching-pole repulsion introduce an unseen relational rule.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c2bff9614d749888",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short statements with repeated negation and contrasting subjects.",
      "vocabulary": "Magnet, poles, metal, opposite, matching and attract.",
      "knowledge": "A force depends on material and on pole relationship.",
      "progression": "Material tests lead to a different pole-interaction rule.",
      "inference": "Moderate; readers distinguish two kinds of magnetic comparison."
    }
  },
  "gr-e-49": {
    "appReadingLevel": "C",
    "rationale": "Clothing-purpose clauses vary between shading, holding heat, staying dry and sleeping, then compare weather with activities. These changing functions and the abstract final category add language demands beyond a repeated B naming pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:23540db0fd32f609",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied purpose clauses and an abstract comparative close.",
      "vocabulary": "Shades, holds heat, gloves, pajamas and activities.",
      "knowledge": "Garments serve different practical conditions.",
      "progression": "Examples culminate in selection by weather and activity.",
      "inference": "Low; purposes and comparison are explicit."
    }
  },
  "gr-e-50": {
    "appReadingLevel": "C",
    "rationale": "Find, catch and feel vary across sensory color/shape and loud/soft contrasts; tongue and the final senses-explore link broaden the familiar body-part opening.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:500b474cde26b8f6",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses with coordinated lists and varied verbs.",
      "vocabulary": "Tongue, tastes, touch, senses and explore.",
      "knowledge": "Sensory distinctions and coordinated exploration.",
      "progression": "Five observations join in a final collective function.",
      "inference": "Low; the connections are supplied."
    }
  },
  "first-facts-level-a-01-colors": {
    "appReadingLevel": "B",
    "rationale": "Paired ball-and-hat and cup-and-bag examples keep color naming predictable, while singular frog and bright-Sun observations vary subject structure before a brief summary.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:258b377f2170b69b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short copular clauses with singular and coordinated subjects.",
      "vocabulary": "Familiar objects/colors plus bright and flower.",
      "knowledge": "Direct color observations.",
      "progression": "Examples end with an explicit many-colors statement.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-02-farm-animals": {
    "appReadingLevel": "A",
    "rationale": "Six pages repeat A animal says sound with pig, hen, cow, dog, duck and cat; the final sentence directly gathers these as farm-animal sounds.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9d8fa709c46dee2e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "One highly stable four-word sentence frame.",
      "vocabulary": "Familiar animals and conventional sound words.",
      "knowledge": "Literal animal-sound associations.",
      "progression": "Parallel examples and a simple summary.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-03-big-and-little": {
    "appReadingLevel": "A",
    "rationale": "Big dog/little bug and other noun pairs repeat the same two fragments; the closing sentence simply names the big-or-little contrast.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:52f9fe02222adbaf",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated two-word noun phrases and one short clause.",
      "vocabulary": "Familiar objects with repeated big/little.",
      "knowledge": "Direct size contrast.",
      "progression": "Six identical paired-label structures followed by summary.",
      "inference": "Minimal; no relative-size explanation is required."
    }
  },
  "first-facts-level-a-04-water": {
    "appReadingLevel": "A",
    "rationale": "Drink, play and wash repeat we and water, then fish, ducks and frogs repeat action-in-water sentences; the last line states a shared water need.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f07c17ab2d9a8142",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Very short action clauses with repeated water phrases.",
      "vocabulary": "Common actions and familiar pond animals.",
      "knowledge": "Familiar water uses and living things needing it.",
      "progression": "Two closely parallel example groups with a direct close.",
      "inference": "Minimal; the final need is stated."
    }
  },
  "first-facts-level-a-05-the-sky": {
    "appReadingLevel": "B",
    "rationale": "Shines above us and glows at night repeat location/time phrases, but floats, jet and the final look-up direction widen the action pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:5cfa70b7e29263a3",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses with changing subjects and verbs; final imperative.",
      "vocabulary": "Sun, Moon, stars, floats, cloud and jet.",
      "knowledge": "Concrete observations of things in the sky.",
      "progression": "Related examples without a hidden explanation.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-06-animals-can": {
    "appReadingLevel": "A",
    "rationale": "Dog can run, cat can jump and four other animal-action examples repeat A animal can verb; I can move too directly echoes the same construction.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:21d660e67f107938",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Stable four-word can-action clauses.",
      "vocabulary": "Familiar animals and movement verbs.",
      "knowledge": "Literal movement abilities.",
      "progression": "Parallel examples plus a direct self-connection.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-07-bugs": {
    "appReadingLevel": "B",
    "rationale": "The can-action frame supports fly, sting, dig and hide, but a worm digging through soil and the creatures-around-us close change structure and vocabulary.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3491fce5c50360b2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses with a prepositional expansion and summary.",
      "vocabulary": "Sting, soil, crawl and creatures.",
      "knowledge": "Small creatures' visible actions and locations.",
      "progression": "Related examples culminate in a general setting statement.",
      "inference": "Low."
    }
  },
  "first-facts-level-a-08-my-pet": {
    "appReadingLevel": "B",
    "rationale": "This animal needs repeats concrete bed, rest, water, perch and hopping-space needs; gentle cuddle and wants to play introduce two small closing pattern changes.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:5e018106b61d2735",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short needs/likes/wants clauses, sometimes with to-infinitives.",
      "vocabulary": "Perch, quiet, gentle cuddle and space.",
      "knowledge": "Basic pet care and responsive interaction.",
      "progression": "Examples shift to one dog's changing rest/contact/play needs.",
      "inference": "Low; each need is stated."
    }
  },
  "first-facts-level-a-09-hot-and-cold": {
    "appReadingLevel": "A",
    "rationale": "Hot and cold recur in very short Sun, ice, fire, snow, soup and milk examples; the final line simply repeats the sensory contrast.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:21f067f11050e04d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Brief predictable contrast clauses using feel/is/can be.",
      "vocabulary": "Very familiar temperature words and objects.",
      "knowledge": "Immediate hot/cold sensations.",
      "progression": "Alternating examples with a literal concluding contrast.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-10-shapes": {
    "appReadingLevel": "C",
    "rationale": "Round and square examples lead to rectangular and triangular, then a circle comparison and a find-a-shape question; formal shape vocabulary exceeds the short print load.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ce619f7584b43c52",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied clauses, comparison phrase and final question.",
      "vocabulary": "Rectangular, triangular, circle and shape.",
      "knowledge": "Recognizing named geometric forms in objects.",
      "progression": "Different shape examples followed by an application prompt.",
      "inference": "Low; identifying another example needs transfer, not causal reasoning."
    }
  },
  "first-facts-level-a-11-at-the-farm": {
    "appReadingLevel": "B",
    "rationale": "Pig/chick/cow sound statements alternate with a tall barn, hay as food and a running farm dog; this variety breaks a single repeated labeling frame.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b2366c2c36033d16",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied declarations with one food-for phrase.",
      "vocabulary": "Barn, chick, peep, hay and farm.",
      "knowledge": "Concrete farm objects, sounds and animal needs.",
      "progression": "Related farm examples end in a location summary.",
      "inference": "Low."
    }
  },
  "first-facts-level-a-12-in-the-sea": {
    "appReadingLevel": "B",
    "rationale": "Repeated swimming statements add swish, sideways, dives and slowly, with a final people-can-swim connection; movements stay concrete and directly stated.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:be6a6a0f2f660a4d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses with small verb/adverb changes and one coordinated verb.",
      "vocabulary": "Shark, crab, whale, seal, sideways and dives.",
      "knowledge": "Visible animal movements.",
      "progression": "Parallel examples broaden to people.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-13-fruit": {
    "appReadingLevel": "B",
    "rationale": "Apple, banana, plum, orange and grape descriptions compare familiar color, softness, size and roundness; the last two lines generalize those observable features.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:bd7cb21d7895e479",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied copular/sensory clauses and a coordinated adjective pair.",
      "vocabulary": "Ripe, plum, grape, sweet and soft.",
      "knowledge": "Concrete fruit properties.",
      "progression": "Examples lead to explicit size and color categories.",
      "inference": "Low."
    }
  },
  "first-facts-level-a-14-the-tree": {
    "appReadingLevel": "C",
    "rationale": "Roots under ground, trunk support, branches reaching and leaves catching sunlight connect named parts into one apple tree; syntax varies while the final integration is explicit.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:473119f50aa76929",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied declaratives with spatial and functional verbs.",
      "vocabulary": "Roots, trunk, branches and sunlight.",
      "knowledge": "Plant parts have different locations/functions in one organism.",
      "progression": "Parts are introduced before the whole-tree synthesis.",
      "inference": "Low to moderate part-whole connection."
    }
  },
  "first-facts-level-a-15-baby-animals": {
    "appReadingLevel": "B",
    "rationale": "This little chick/kitten/puppy pattern is varied by wool, fur and a calf drinking milk; the ending directly states that babies grow bigger.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:37efd3e35ac32a19",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short this-animal clauses with changing attributes/actions.",
      "vocabulary": "Lamb, wool, cub, fur and calf.",
      "knowledge": "Familiar young animals and their properties.",
      "progression": "Parallel examples end in a literal growth generalization.",
      "inference": "Low."
    }
  },
  "first-facts-level-a-16-fast-and-slow": {
    "appReadingLevel": "B",
    "rationale": "Can move fast and moves slowly repeat across vehicles and animals, while does not rush and the final find instruction introduce small changes.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c2c91e8be0d5e799",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short contrast clauses, simple negation and an imperative.",
      "vocabulary": "Jet, snail, slowly and rush.",
      "knowledge": "Direct movement-speed comparison.",
      "progression": "Fast examples precede slow examples and a selection prompt.",
      "inference": "Low."
    }
  },
  "first-facts-level-a-17-a-seed-grows": {
    "appReadingLevel": "C",
    "rationale": "Soil, a downward root, an upward shoot, a leaf, a bud and a flower form seven different growth stages; the reader follows changing plant parts rather than a repeated B action frame.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:faac98f4f4446f12",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short but varied declaratives with directional contrasts and becomes.",
      "vocabulary": "Soil, root, shoot, bud and sunlight.",
      "knowledge": "A plant emerges and develops through ordered stages.",
      "progression": "A continuous seed-to-flower sequence across all seven pages.",
      "inference": "Low inference; stages are explicit but must be connected."
    }
  },
  "first-facts-level-a-18-my-body": {
    "appReadingLevel": "A",
    "rationale": "My two eyes can see repeats through ears, nose, mouth, hands and feet; the final whole-body ownership sentence is a small direct variation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:bedf417c687b7476",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Stable my-body-part can-action clauses.",
      "vocabulary": "Familiar body parts and common actions.",
      "knowledge": "Literal functions and body ownership.",
      "progression": "Parallel examples followed by a brief whole-body close.",
      "inference": "Minimal."
    }
  },
  "first-facts-level-a-19-day-and-night": {
    "appReadingLevel": "B",
    "rationale": "Bright daytime, birds singing, the Sun setting and stars shining are observations with modest time-language variation; no cause of the cycle is explained.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0191b1d11cc7b540",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short declaratives with during/at time phrases.",
      "vocabulary": "Daytime, during, sets and night.",
      "knowledge": "Familiar day/night observations.",
      "progression": "Moves from day to setting to night and recurrence.",
      "inference": "Low; take turns names rather than explains the cycle."
    }
  },
  "first-facts-level-a-20-space": {
    "appReadingLevel": "C",
    "rationale": "Moon, Sun, Earth, Mars and Saturn examples introduce hot star, rocky planet and rings, then explicitly group stars and planets in space.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d7e15aa920c815a6",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied descriptive clauses.",
      "vocabulary": "Mars, Saturn, rocky planet, rings and circle.",
      "knowledge": "Astronomical object categories and relative distance.",
      "progression": "Several objects lead to one explicit category summary.",
      "inference": "Low; orbital mechanisms are not explained."
    }
  },
  "first-facts-a-01-look-at-the-colors": {
    "appReadingLevel": "C",
    "rationale": "Paired apple/robin and Sun/duck comparisons use two sentences per page; robin's breast, feathers and lavender broaden descriptive vocabulary before the final noticing question.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a835be99de8b3e16",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated paired short observations with changing subjects and a final question.",
      "vocabulary": "Robin's breast, orange-red, feathers, pumpkin and lavender.",
      "knowledge": "Object-color comparisons rather than color mechanisms.",
      "progression": "Six color groups culminate in a world-level noticing invitation.",
      "inference": "Low; each comparison is explicit."
    }
  },
  "first-facts-a-02-the-four-seasons": {
    "appReadingLevel": "C",
    "rationale": "Spring nesting and young animals, summer growth, fall leaf change and winter clothing form an explicit seasonal cycle; frost and yearly cycle widen vocabulary without explaining Earth's seasons.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:36b86968acb62c40",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses, some paired-sentence pages and then recurrence.",
      "vocabulary": "Nest, young, frost, squirrel and yearly cycle.",
      "knowledge": "Seasonal observations and yearly repetition.",
      "progression": "A clear spring-to-winter-to-spring sequence.",
      "inference": "Low; the return and sequence are stated."
    }
  },
  "first-facts-a-03-little-seeds-grow": {
    "appReadingLevel": "C",
    "rationale": "Water entering and splitting a seed coat precede first-root, next-shoot and first-flower stages; temporal words support a continuous, concrete growth account.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2bf651352d4b8309",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied sentences with paired statements and first/next/at-last markers.",
      "vocabulary": "Damp soil, seed coat, root, shoot and sunlight.",
      "knowledge": "A tiny plant emerges from a seed through observable stages.",
      "progression": "Seven linked stages in one explicit process.",
      "inference": "Low; the split and growth order are supplied."
    }
  },
  "first-facts-a-04-what-is-weather": {
    "appReadingLevel": "C",
    "rationale": "Wind bends twigs, snow falls as flakes, and lightning precedes thunder; the rainbow statement adds an explicit connection between sunlight and raindrops.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:914bdfc1c37cae81",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied observation clauses, a paired temporal page and a question.",
      "vocabulary": "Raindrops, twigs, flakes, lightning, thunder and rainbow.",
      "knowledge": "Several familiar weather phenomena, without their underlying mechanisms.",
      "progression": "Related examples end in a change/noticing prompt.",
      "inference": "Low; sequence and connections are stated."
    }
  },
  "first-facts-a-05-flowers-and-trees": {
    "appReadingLevel": "C",
    "rationale": "Petals, thorns, roots taking in water and deciduous/evergreen observations compare plants; every feature or function is directly stated and the final needs list is explicit.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a6c61c617c6f17f3",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short declaratives, one paired-sentence page and coordinated lists.",
      "vocabulary": "Petals, centers, thorns, roots and pine trees.",
      "knowledge": "Concrete plant parts, seasonal differences and growth needs.",
      "progression": "Flower examples move to tree examples, then common needs.",
      "inference": "Low; no hidden process or multi-step mechanism must be inferred."
    }
  },
  "first-facts-a-06-baby-animals": {
    "appReadingLevel": "C",
    "rationale": "The young-animal is-called-a-name frame is stable, but calf, lamb, foal and duckling require a broader naming set than the simpler B baby-animal descriptions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:54bdbc8b82af7904",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated naming clauses across seven examples and one summary.",
      "vocabulary": "Puppy, kitten, calf, chick, lamb, foal and duckling.",
      "knowledge": "Adult-to-young category/name associations.",
      "progression": "An extended parallel naming set closes with growth and learning.",
      "inference": "Low; associations are supplied."
    }
  },
  "first-facts-a-07-animals-on-the-farm": {
    "appReadingLevel": "C",
    "rationale": "Milk for a calf, mud for cooling, a woolly coat and a horse's heavy load introduce different concrete functions, followed by an explicit food-water-shelter-care summary.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cba7bc5dc1f6de53",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short declaratives, some coordinated actions and one purpose phrase.",
      "vocabulary": "Munches, calf, woolly, load, paddles and shelter.",
      "knowledge": "Animal needs, bodily features and common farm functions.",
      "progression": "Different animals culminate in a shared care statement.",
      "inference": "Low; individual causes/purposes are directly given."
    }
  },
  "first-facts-a-08-animals-in-the-ocean": {
    "appReadingLevel": "D",
    "rationale": "Whales and dolphins coming up for air, octopus arms, protective crab shell and curling seahorse tail build a comparison of movement, hiding and breathing adaptations.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:87a8c970836d58c2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied clauses, a paired-sentence whale page and coordinated functions.",
      "vocabulary": "Octopus, seahorse, dolphins, fins and guards.",
      "knowledge": "Different marine bodies support distinct survival functions.",
      "progression": "An overview leads through adaptations to a three-function synthesis.",
      "inference": "Moderate cross-example comparison."
    }
  },
  "first-facts-a-09-animals-at-night": {
    "appReadingLevel": "D",
    "rationale": "An opening question leads to owls sensing dim movement, bats using echoes and foxes finding prey; these are introductory sensory hunting mechanisms rather than simple nighttime labels.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:231a382f90798b73",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "A question plus varied short declaratives and a summary.",
      "vocabulary": "Dim, echoes, hedgehogs and prey.",
      "knowledge": "Nocturnal hunting uses different senses.",
      "progression": "One question is developed through four animal examples.",
      "inference": "Moderate; echo-based hunting is not directly familiar observation."
    }
  },
  "first-facts-a-10-bugs-all-around-us": {
    "appReadingLevel": "D",
    "rationale": "Pollen transfer, aphid hunting, underground nests, earthworm tunnels and a snail's broad foot connect food and shelter above and below one garden.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:44f3d2a4abde43b9",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied declaratives, an opening question and a spatially contrasting close.",
      "vocabulary": "Pollen, bloom, aphids, tunnel and broad foot.",
      "knowledge": "Different organisms' feeding, movement and shelter functions.",
      "progression": "A shared setting links several ecological examples.",
      "inference": "Moderate synthesis across organisms and above/below locations."
    }
  },
  "first-facts-a-11-pets-we-love": {
    "appReadingLevel": "C",
    "rationale": "Dogs' exercise and regular care, rabbits' company and room, and hamsters' digging/exploration extend coordinated needs lists; the final care-fits-animal principle compares them explicitly.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c63a711956c9a786",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated need clauses with multi-item lists and a generalizing close.",
      "vocabulary": "Exercise, regular care, shelter, company and explore.",
      "knowledge": "Care routines differ between animal kinds.",
      "progression": "Several need lists lead to a stated matching principle.",
      "inference": "Low; differences and conclusion are given."
    }
  },
  "first-facts-a-12-shapes-everywhere": {
    "appReadingLevel": "D",
    "rationale": "Equal square sides, square rectangle corners and a stretched oval pair formal properties with object examples; readers apply defined attributes when finding flat shapes.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:33e4a16d00be2d3c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated two-sentence definition/example pages and final question.",
      "vocabulary": "Equal sides, rectangle, square corners, points and stretched.",
      "knowledge": "Classification by number, equality and geometric attributes.",
      "progression": "A succession of property-example pairs becomes an application task.",
      "inference": "Moderate abstraction from an object's appearance to formal properties."
    }
  },
  "first-facts-a-13-big-and-small": {
    "appReadingLevel": "B",
    "rationale": "Big beside a mouse is reversed to small beside an elephant, then repeated with a toy car, flower and whale; the final prompt asks a direct comparison.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:745f896c11e78c0d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated looks-big/small-beside clauses and a brief imperative.",
      "vocabulary": "Elephant, mouse, beside, whale and compare.",
      "knowledge": "Size depends on the paired comparison.",
      "progression": "A reversed opening pair supports later examples.",
      "inference": "Low; each relationship is explicit."
    }
  },
  "first-facts-a-14-hot-and-cold": {
    "appReadingLevel": "C",
    "rationale": "Fire's stay-back instruction, food needing time to cool, temperature naming and asking an adult vary the concrete hot/cold examples into practical safety language.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b144194e67042186",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses, an imperative, a paired-sentence page and before-touching phrase.",
      "vocabulary": "Warm, cool, temperature and adult.",
      "knowledge": "Temperature sensations and safe handling choices.",
      "progression": "Examples progress to a category name and an adult-check rule.",
      "inference": "Low; the safety actions are explicit."
    }
  },
  "first-facts-a-15-things-that-float-and-sink": {
    "appReadingLevel": "D",
    "rationale": "Hollow duck/solid stone and heavy hollow boat examples challenge a simple weight rule; shape and material and the heavy-floats/light-sinks close require comparing competing properties.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2a34a4f5c37ab940",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short contrast statements, two paired-sentence pages and an experiment question.",
      "vocabulary": "Hollow, solid, floats, sinks and material.",
      "knowledge": "Buoyancy depends on more than apparent weight.",
      "progression": "Examples set up a generalization that overturns an easy assumption.",
      "inference": "Moderate causal comparison and experimental interpretation."
    }
  },
  "first-facts-a-16-push-and-pull": {
    "appReadingLevel": "C",
    "rationale": "Away/close contrasts repeat through door, swing and zipper examples; a magnet pulling a steel clip extends the set before the explicit start-stop-turn summary.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c85ec3e1affbb3ed",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short parallel definitions and examples with a three-verb close.",
      "vocabulary": "Push, pull, zipper, magnet and steel paper clip.",
      "knowledge": "Visible forces change motion; one magnetic example is introduced.",
      "progression": "Two contrasts develop through applications to a summary.",
      "inference": "Low; no pole rule or hidden force mechanism is explained."
    }
  },
  "first-facts-a-17-hello-sun": {
    "appReadingLevel": "D",
    "rationale": "Earth turning explains morning and evening and the Sun's apparent crossing; closest-star language, midday warmth and eye safety add distinct conceptual relationships.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:510dfdb9625e7573",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied declaratives with and/so clauses plus paired imperatives.",
      "vocabulary": "Closest, midday, fades and seems.",
      "knowledge": "Rotation differs from the Sun's apparent movement; sunlight has heat and safety effects.",
      "progression": "Observations lead to the explicit causal correction at the close.",
      "inference": "Moderate perspective and spatial understanding."
    }
  },
  "first-facts-a-18-the-moon": {
    "appReadingLevel": "D",
    "rationale": "Reflected sunlight, crescent/full sunlit faces and Moon-Earth motion explain why moonlight appears; readers must integrate illumination and viewpoint rather than simply name phases.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:eefc976ac7f02029",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short explanatory clauses with repeated sunlit/reflect wording.",
      "vocabulary": "Reflects, surface, crescent, fully and moonlight.",
      "knowledge": "The Moon has no light source of its own; visible shapes depend on illumination.",
      "progression": "Initial claim develops through face examples and a final restatement.",
      "inference": "Moderate invisible-light relationship."
    }
  },
  "first-facts-a-19-day-and-night": {
    "appReadingLevel": "D",
    "rationale": "The side toward the Sun having day and the side turned from it having night explain a rotation cycle; repeated Earth turns supports syntax without removing the spatial model.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:46a8716a2a666b7b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short repeated declaratives with toward/turned-from references.",
      "vocabulary": "Half, toward, turned from, Earth and appear.",
      "knowledge": "A rotating Earth changes the illumination of each side.",
      "progression": "Causal states are connected through turn, night and day returning.",
      "inference": "Moderate perspective/spatial reasoning."
    }
  },
  "first-facts-a-20-my-five-senses": {
    "appReadingLevel": "C",
    "rationale": "Questions frame body-part observations; light/color/shape and touch/warmth/cold lists plus the senses-working-together statement broaden a familiar repeated pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:faa4ccdc91f99ad5",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Opening/closing questions, short clauses and coordinated lists.",
      "vocabulary": "Tongue, notices, warmth and senses.",
      "knowledge": "The five senses jointly support learning about surroundings.",
      "progression": "Five functions answer an opening question and lead to personal application.",
      "inference": "Low; collective use is stated."
    }
  },
  "first-facts-a-21-how-i-grow": {
    "appReadingLevel": "C",
    "rationale": "First sit/crawl, then stand/walk and soon run/play establish explicit milestones; new skills, growth needs and individual timing widen the comparison.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:8d863571e38a3515",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short first-person statements, time markers and action lists.",
      "vocabulary": "Crawl, practice, skills and own way/time.",
      "knowledge": "Development varies and needs food, play and sleep.",
      "progression": "Chronological milestones lead to needs and individual variation.",
      "inference": "Low; order and differences are stated."
    }
  },
  "first-facts-a-22-staying-healthy": {
    "appReadingLevel": "D",
    "rationale": "Nutrients, active hearts/muscles, germs and fluoride link different habits to body functions; the text supplies several introductory biological relationships rather than familiar routines alone.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:13c022915cbc1224",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied subject-action clauses with functional explanations.",
      "vocabulary": "Nutrients, muscles, germs, fluoride and brains.",
      "knowledge": "Different health actions affect different body systems.",
      "progression": "Distinct mechanisms accumulate into a habits-add-up conclusion.",
      "inference": "Moderate integration of less visible health benefits."
    }
  },
  "first-facts-a-23-my-body": {
    "appReadingLevel": "C",
    "rationale": "Brain thinking, stomach breaking down food and arms balancing vary body functions before sunscreen and helmet protection; the practical actions stay explicit and concrete.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c2389d73e838b9d0",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied clauses, action lists and two paired-sentence pages.",
      "vocabulary": "Brain, stomach, balance, sunscreen and helmet.",
      "knowledge": "Basic organ functions, movement and protection.",
      "progression": "Body examples move to care actions and ownership.",
      "inference": "Low; processes are mentioned but not mechanistically explained."
    }
  },
  "first-facts-a-24-rocks-and-pebbles": {
    "appReadingLevel": "D",
    "rationale": "Moving water smoothing pebbles, a shell-shaped fossil from a long-ago animal and big rocks wearing down connect present evidence to past change.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:32a8f398161b5e50",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short explanatory clauses with a paired fossil page and a where-adult-says condition.",
      "vocabulary": "Pebble, fossil, collect, wears down and streams.",
      "knowledge": "Erosion and fossil traces represent change over time.",
      "progression": "Examples connect uses/evidence and end with an erosion outcome.",
      "inference": "Moderate causal and past-evidence interpretation."
    }
  },
  "first-facts-a-25-water-everywhere": {
    "appReadingLevel": "D",
    "rationale": "Cloud/rain/river movement, living things' uses and liquid/ice/invisible vapor combine into a water-location/form explanation; the final oceans/clouds comparison requires synthesis.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b88aa1f2ba24f145",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short declaratives, lists and a paired question/answer close.",
      "vocabulary": "Refill, crops, liquid, vapor and rainwater.",
      "knowledge": "Water occupies different locations and forms while supporting life.",
      "progression": "Locations lead to uses, forms and a final cross-location comparison.",
      "inference": "Moderate classification and connection of seen/unseen forms."
    }
  },
  "level-c-nonfiction-01-bees": {
    "appReadingLevel": "E",
    "rationale": "Queen/worker roles connect nectar-to-honey production with pollen moving flower-to-flower and later fruit; an as-clause and the final garden benefit require following two linked processes.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1fc6c0c71b1ca464",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied longer sentences, an as-clause, question and paired causal statements.",
      "vocabulary": "Queen, worker, hive, nectar, pollen and blooming.",
      "knowledge": "Colony work and pollination have related but distinct outcomes.",
      "progression": "An opening honey question expands into production, pollination and mutual benefit.",
      "inference": "Moderate causal synthesis across the two processes."
    }
  },
  "level-c-nonfiction-02-volcanoes": {
    "appReadingLevel": "F",
    "rationale": "Magma rising through vents becomes lava or explosive ash/gas; island building, mineral-rich soil and scientific warning signs add multiple geological causes and outcomes.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ea9b78b1255b845e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied multi-clause explanations, passive naming and temporal transformations.",
      "vocabulary": "Magma, vents, eruptions, minerals, globe and earthquakes.",
      "knowledge": "Several volcanic processes, constructive/destructive effects and prediction evidence.",
      "progression": "Underground origin extends to surface products, long-term changes and monitoring.",
      "inference": "Substantial cause/effect integration across time and place."
    }
  },
  "level-c-nonfiction-03-penguins": {
    "appReadingLevel": "F",
    "rationale": "While/when clauses track alternating parental care; hunting, colony calls and camouflage viewed from above versus below add several adaptations and perspective shifts.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9a649cc721b7e44c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Compound/subordinate sentences and a two-sentence viewpoint comparison.",
      "vocabulary": "Antarctic, huddle, flippers, colony, surface and coasts.",
      "knowledge": "Emperor reproduction, thermal care and aquatic camouflage, with a species qualifier.",
      "progression": "Family care broadens to hunting, recognition, protection and other penguins.",
      "inference": "Substantial perspective switching and functional connections."
    }
  },
  "level-c-nonfiction-04-the-moon": {
    "appReadingLevel": "F",
    "rationale": "Measurement, reflected-light observation, changing sunlit portions, tides, impact craters and Apollo samples form an inquiry requiring several scientific explanations and evidence sources.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:892b9b7a570583a7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied multi-clause sentences with as/where relations and paired explanatory pages.",
      "vocabulary": "Quarter, telescope, gravity, tides, craters, Apollo and samples.",
      "knowledge": "Scale, phases, gravity, impacts and geological evidence.",
      "progression": "The supplied page order moves between remote measurement and direct/sample investigation.",
      "inference": "Substantial integration of observations with hidden mechanisms and past evidence."
    }
  },
  "level-c-nonfiction-05-how-seeds-grow": {
    "appReadingLevel": "F",
    "rationale": "Absorbing roots, leaves making food through photosynthesis, flower pollination and seed dispersal connect several processes in a seed-to-seed cycle.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3a542bd749f2c81b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied explanatory sentences, lists, paired statements and an imperative close.",
      "vocabulary": "Absorbs, photosynthesis, pollination, pollen, pods and emerges.",
      "knowledge": "Germination, food production, reproduction and dispersal are interdependent.",
      "progression": "A complete cycle links successive mechanisms and returns to planting.",
      "inference": "Substantial cross-process causal understanding."
    }
  },
  "level-c-nonfiction-06-spiders": {
    "appReadingLevel": "F",
    "rationale": "Spinnerets making silk, orb-web construction, alternative web forms and a jumping spider's hunting strategy are compared before prey handling and egg protection.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:6c7a95ad21c0daf4",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied compound clauses, a framing question and sequential multi-verb actions.",
      "vocabulary": "Spinnerets, orb-weaver, spokes, spirals, funnels, prey and silk sac.",
      "knowledge": "Anatomy, structures and alternative predation/reproduction strategies.",
      "progression": "A catching-flying-insects question expands into contrasting methods and consequences.",
      "inference": "Substantial comparison of structure and hunting function."
    }
  },
  "level-c-nonfiction-07-under-the-ocean": {
    "appReadingLevel": "F",
    "rationale": "A depth journey links sunlight, coral construction, increasing pressure, bioluminescence and plankton oxygen production; meters/kilometers add difficult scale relationships.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0e2044e41c1149a9",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied explanatory paragraphs, paired/triple statements and a just-as comparison.",
      "vocabulary": "Pressure, bioluminescence, Mariana Trench, plankton and oxygen.",
      "knowledge": "Depth/light/pressure relationships plus reef and food-production mechanisms.",
      "progression": "A descent to the trench returns far above to sunlit plankton.",
      "inference": "Substantial spatial, numerical and biological integration."
    }
  },
  "level-c-nonfiction-08-butterflies": {
    "appReadingLevel": "F",
    "rationale": "A four-stage monarch cycle is explicit, but antennae, milkweed, chrysalis, metamorphosis and proboscis introduce dense specialist vocabulary alongside body change and feeding function.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0099a61ee3347918",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied clauses, multiple actions, paired statements and a named-part explanatory insertion.",
      "vocabulary": "Antennae, monarch, chrysalis, metamorphosis, proboscis and nectar.",
      "knowledge": "Insect anatomy, complete metamorphosis and mouthpart function.",
      "progression": "Egg-to-adult development closes with new eggs beginning the next cycle.",
      "inference": "Moderate causal sequencing with substantial biological vocabulary integration."
    }
  },
  "level-c-nonfiction-09-caves": {
    "appReadingLevel": "F",
    "rationale": "Acidic water widening limestone, mineral deposits forming stalactites/stalagmites and their joining into columns explain slow processes before animal adaptations and ancient art broaden the timescale.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c49819ca16fd0ca1",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied cause statements, paired sequential pages and a contrastive close.",
      "vocabulary": "Acidic, limestone, mineral-rich, stalactites, stalagmites and columns.",
      "knowledge": "Chemical weathering, deposition, cave ecology and archaeological timescales.",
      "progression": "Formation leads to structures, living inhabitants and past human visitors.",
      "inference": "Substantial reasoning about slow unseen causes and traces."
    }
  },
  "level-c-nonfiction-10-frogs": {
    "appReadingLevel": "E",
    "rationale": "A clear egg-tadpole-froglet-adult chain supports gills and lungs, while shrinking tail, moist-skin breathing and camouflage connect bodily change to two habitats.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0dd5f90e3afed36c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied clauses with but/as/through links, lists and paired pages.",
      "vocabulary": "Tadpole, gills, froglet, lungs, moist and life cycle.",
      "knowledge": "Metamorphosis, breathing, feeding and seasonal reproduction in one species.",
      "progression": "One chronological cycle returns to spring eggs.",
      "inference": "Moderate physiological and cycle synthesis, strongly supported by sequence."
    }
  },
  "bob-and-nan-01": {
    "appReadingLevel": "B",
    "rationale": "The running-pal goal moves through wanting, running alone, running together and resting side by side. Repeated names support the text, but the varying clause patterns and social outcome make this a short B narrative rather than an A naming/action pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2f222b0f0ab51aaa",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "The running-pal goal moves through wanting, running alone, running together and resting side by side. Repeated names support the text, but the varying clause patterns and social outcome make this a short B narrative rather than an A naming/action pattern.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-02-park": {
    "appReadingLevel": "B",
    "rationale": "Short park actions lead to a hill solving a blocked-view problem; the opening question and whole-park comparison add a simple inference.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3c79d272db017955",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Short park actions lead to a hill solving a blocked-view problem; the opening question and whole-park comparison add a simple inference.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-03-fluff": {
    "appReadingLevel": "B",
    "rationale": "Bob wants Fluff to sit, then Fluff moves between two children before calm patting produces the result. Infinitive phrasing, calmly and changing spatial relations add small pattern and vocabulary demands appropriate to B.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cc585ac4446b0f9b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Bob wants Fluff to sit, then Fluff moves between two children before calm patting produces the result. Infinitive phrasing, calmly and changing spatial relations add small pattern and vocabulary demands appropriate to B.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-04-beach": {
    "appReadingLevel": "B",
    "rationale": "Short construction actions form a wave-knocks-it-down problem; farther-from-the-waves connects the revised plan to the dry ending.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a03fbbdd3077b430",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Short construction actions form a wave-knocks-it-down problem; farther-from-the-waves connects the revised plan to the dry ending.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-05-school": {
    "appReadingLevel": "B",
    "rationale": "Names and bag-holding actions repeat, but classroom, side-by-side and a smile exchange add situational inference and longer words.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b0e7571249748ac7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Names and bag-holding actions repeat, but classroom, side-by-side and a smile exchange add situational inference and longer words.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-06-zoo": {
    "appReadingLevel": "B",
    "rationale": "Repeated spots/finds examples support a six-animal checklist; hidden frog, elephant and complete add small vocabulary demands.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:92fb5a97dc144adf",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Repeated spots/finds examples support a six-animal checklist; hidden frog, elephant and complete add small vocabulary demands.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-07-birthday": {
    "appReadingLevel": "B",
    "rationale": "Short birthday actions include paper that will not rip, then a bat reveal; the reader connects the present to the final game.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:736efd1dd20300a7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Short birthday actions include paper that will not rip, then a bat reveal; the reader connects the present to the final game.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-08-sick": {
    "appReadingLevel": "B",
    "rationale": "Feeling too ill to play, falling asleep beside Fluff, resting for two days and becoming stronger form a short recovery sequence. Several changing clause frames and time/comparison language put the combined demand in B.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3cf00385374ea68c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Feeling too ill to play, falling asleep beside Fluff, resting for two days and becoming stronger form a short recovery sequence. Several changing clause frames and time/comparison language put the combined demand in B.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-09-read": {
    "appReadingLevel": "B",
    "rationale": "Short repeated Bob-reads lines support a simple learning sequence; sounds-out and cannot-read-yet require a little topic knowledge.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ef8cd6be88116f3b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "Short repeated Bob-reads lines support a simple learning sequence; sounds-out and cannot-read-yet require a little topic knowledge.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "bob-and-nan-10-vet": {
    "appReadingLevel": "B",
    "rationale": "The sore-leg problem proceeds explicitly through vet, medicine and rest; weeks-pass introduces a time jump across short sentences.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:bbf9b533a36e7816",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary their opening, subject and purpose across the book, with some negation or linked actions.",
      "vocabulary": "Familiar people, objects and actions with modest topic or spatial phrase variation.",
      "knowledge": "Familiar child/pet situation; any problem and result stay concrete.",
      "progression": "The sore-leg problem proceeds explicitly through vet, medicine and rest; weeks-pass introduces a time jump across short sentences.",
      "inference": "A small goal, changed condition or action/result link is supported by the explicit prose."
    }
  },
  "james-and-anna-01-space": {
    "appReadingLevel": "D",
    "rationale": "Dialogue, sound effects and a pretend-space frame vary short sentences; the reader must distinguish building a box rocket from imagined travel.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:eae6ebde3d6dcfc1",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Dialogue, sound effects and a pretend-space frame vary short sentences; the reader must distinguish building a box rocket from imagined travel.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "james-and-anna-02-chips": {
    "appReadingLevel": "D",
    "rationale": "Repeated Drop commands organize Chips's mischief; quoted dialogue, possessives and a final successful attempt connect several events.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:df2d91df3d514776",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Repeated Drop commands organize Chips's mischief; quoted dialogue, possessives and a final successful attempt connect several events.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "james-and-anna-03-shopping": {
    "appReadingLevel": "D",
    "rationale": "A longer shopping sequence tracks list items and safe egg handling; crunchy, checkout and an unspoken look add vocabulary and inference.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a94199b59775cca2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "A longer shopping sequence tracks list items and safe egg handling; crunchy, checkout and an unspoken look add vocabulary and inference.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "james-and-anna-04-dentist": {
    "appReadingLevel": "D",
    "rationale": "Short dialogue and action show worry changing through reassurance; dental checkup, armrests and physical reactions need contextual interpretation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:28426347606a3e01",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Short dialogue and action show worry changing through reassurance; dental checkup, armrests and physical reactions need contextual interpretation.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "james-and-anna-05-tree-house": {
    "appReadingLevel": "D",
    "rationale": "A tree-house plan drives ordered construction steps; quoted dialogue, tools and a nighttime landing widen vocabulary and sequence length.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:441b79a5a2ad0abe",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "A tree-house plan drives ordered construction steps; quoted dialogue, tools and a nighttime landing widen vocabulary and sequence length.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "ja-b-06": {
    "appReadingLevel": "D",
    "rationale": "Farm jobs shift into an escape and repair; dialogue, counting, zigzags and several named animals require tracking parallel actions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a7379161a62c2f9f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Farm jobs shift into an escape and repair; dialogue, counting, zigzags and several named animals require tracking parallel actions.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "ja-b-07": {
    "appReadingLevel": "E",
    "rationale": "Audition, rehearsal and stage fright form linked time stages; metaphorical lost lines and a thumbs-up imply confidence changing through support.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:14c74d43e8eda02f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Audition, rehearsal and stage fright form linked time stages; metaphorical lost lines and a thumbs-up imply confidence changing through support.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "ja-b-08": {
    "appReadingLevel": "D",
    "rationale": "Short action and dialogue track two pets, damage and cleanup; figurative rockets/fly wording adds demands beyond a repeated action frame.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:7918424bff6bbb1e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Short action and dialogue track two pets, damage and cleanup; figurative rockets/fly wording adds demands beyond a repeated action frame.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "ja-b-09": {
    "appReadingLevel": "D",
    "rationale": "Repeated bike failures lead to looking ahead and keeping hands on; short dialogue and hedge callbacks require causal reading across pages.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:de4dc9ec2f378ead",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Repeated bike failures lead to looking ahead and keeping hands on; short dialogue and hedge callbacks require causal reading across pages.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "ja-b-10": {
    "appReadingLevel": "D",
    "rationale": "Tent assembly, a nighttime fox and a repaired seam form a longer sequence; fragments, dialogue and camping equipment diversify the print.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a4b5050ac04d8115",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short paragraphs with direct dialogue, paired sentences and occasional longer coordinated clauses.",
      "vocabulary": "Everyday family language plus specific setting/action words and figurative reactions.",
      "knowledge": "Tent assembly, a nighttime fox and a repaired seam form a longer sequence; fragments, dialogue and camping equipment diversify the print.",
      "progression": "Several connected scenes keep a practical goal or activity in view.",
      "inference": "Track an explicit action/consequence chain; the school play adds sustained performance anxiety and a supported emotional change."
    }
  },
  "ab-c-01": {
    "appReadingLevel": "E",
    "rationale": "Past-tense school events link anxiety to repeated attempts; investigate, woodlouse and physical feeling clues add vocabulary and supported inference.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0cadcedfede47817",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "Past-tense school events link anxiety to repeated attempts; investigate, woodlouse and physical feeling clues add vocabulary and supported inference.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-02": {
    "appReadingLevel": "E",
    "rationale": "Sorting, selling and counting sustain a tent-buying goal; while-clauses, money amounts and a kept toy require tracking related decisions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:bc9fb14d2d618418",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "Sorting, selling and counting sustain a tent-buying goal; while-clauses, money amounts and a kept toy require tracking related decisions.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-03": {
    "appReadingLevel": "F",
    "rationale": "A longer trip follows a route through weather changes and a lighthouse; descriptive compounds, distance/time shifts and a map payoff add complexity.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:95307ed6c289cf6b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "A longer trip follows a route through weather changes and a lighthouse; descriptive compounds, distance/time shifts and a map payoff add complexity.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-04": {
    "appReadingLevel": "F",
    "rationale": "A foster dog's trust develops across many incidents; quoted guidance, compound clauses and a final quiet pencil scene imply the changed relationship.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:63484315cfd2f6e9",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "A foster dog's trust develops across many incidents; quoted guidance, compound clauses and a final quiet pencil scene imply the changed relationship.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-05": {
    "appReadingLevel": "E",
    "rationale": "Gate and warmth clues organize a missing-dog search; a return explanation requires linking earlier habits, the radiator and pawprints.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:fcbdb0103a10c7e8",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "Gate and warmth clues organize a missing-dog search; a return explanation requires linking earlier habits, the radiator and pawprints.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-06": {
    "appReadingLevel": "F",
    "rationale": "Crystal growth, daily records and judging form a multi-step investigation; why/while clauses and figurative comparisons add explanatory demands.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c4599672c1a5dae3",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "Crystal growth, daily records and judging form a multi-step investigation; why/while clauses and figurative comparisons add explanatory demands.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-07": {
    "appReadingLevel": "E",
    "rationale": "An observation goal changes from birds to pond life; past-tense dialogue, bird blind and nature vocabulary support a sustained perspective shift.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d98d2108e295949a",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "An observation goal changes from birds to pond life; past-tense dialogue, bird blind and nature vocabulary support a sustained perspective shift.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-08": {
    "appReadingLevel": "F",
    "rationale": "Repeated bullying, attempted boundaries and teacher support form a longer social sequence; dialogue and physical reactions imply changing confidence.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1fcf59eb6bdb2901",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "Repeated bullying, attempted boundaries and teacher support form a longer social sequence; dialogue and physical reactions imply changing confidence.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-09": {
    "appReadingLevel": "E",
    "rationale": "A loose-tooth worry spans days and weeks; while/beneath phrases, dialogue and bodily feeling clues support inference about reassurance and growth.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:5858a121cba5ca12",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "A loose-tooth worry spans days and weeks; while/beneath phrases, dialogue and bodily feeling clues support inference about reassurance and growth.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "ab-c-10": {
    "appReadingLevel": "F",
    "rationale": "Castle clues build an inquiry with a delayed storeroom answer; armor, archers, moat and protection add historical knowledge and compound sentences.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cce2432d3dfcd94e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Sustained past-tense prose with direct dialogue, varied longer clauses and temporal shifts.",
      "vocabulary": "Broader descriptive and situational language; F titles add multiple specialist, spatial or social relationships.",
      "knowledge": "Castle clues build an inquiry with a delayed storeroom answer; armor, archers, moat and protection add historical knowledge and compound sentences.",
      "progression": "A connected story across multiple scenes, with reasons, setbacks, adjustments and a retrospective ending.",
      "inference": "Read supported motives or reactions across scenes; the F titles combine more relationships rather than merely adding length."
    }
  },
  "dino-pals-01-chompys-big-lunch": {
    "appReadingLevel": "C",
    "rationale": "paired eating-and-rumbling sentences, a shared basket and the final quiet-tummy callback require varied short language and linking the food to a satisfied appetite; this exceeds a small repeated B action frame.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a88f20671ad3953b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired simple sentences, direct speech and a final fragment vary the page shapes.",
      "vocabulary": "gobbles, munches, rumble and half extend familiar food words.",
      "knowledge": "Hunger, shared portions and becoming full are concrete familiar concepts.",
      "progression": "Several foods fail to quiet the rumble before shared lunch succeeds; bedtime closes the sequence.",
      "inference": "Connect the absent final rumble with having eaten enough."
    }
  },
  "dino-pals-02-sunnys-rainy-day": {
    "appReadingLevel": "C",
    "rationale": "Sunny's splash, three frowns and a smaller invitation create an explicitly observable social repair, while huddle/broad leaves and changing short sentence patterns demand more than B's narrow action sequence.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:076034030f0b0863",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses alternate with two-sentence pages, a three-name list and brief dialogue.",
      "vocabulary": "huddle, broad, soaks and frowns broaden concrete weather/play vocabulary.",
      "knowledge": "Rain, shelter and splashing friends need no specialist knowledge.",
      "progression": "Unwanted big splash is replaced by a small pool tap; friends enter one by one.",
      "inference": "Read the frowns as a reason for Sunny to change her invitation."
    }
  },
  "dino-pals-03-dozy-wont-wake-up": {
    "appReadingLevel": "C",
    "rationale": "repeated unsuccessful calls support the text, but paired actions, several named callers and the shift from noise to the smell of berry buns add C-level variation and a simple sensory inference.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1badbce86cb3ed83",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired short sentences and three clipped clauses sit alongside longer single actions.",
      "vocabulary": "honks, peeks, spot and berry buns extend familiar sleep/food language.",
      "knowledge": "Sound may fail to wake someone while food smell attracts them.",
      "progression": "Calling escalates, a place is kept, warm buns prompt waking and joining lunch.",
      "inference": "Infer why sniffing and a peeking eye follow the arrival of hot buns."
    }
  },
  "dino-pals-04-grumpy-needs-help": {
    "appReadingLevel": "C",
    "rationale": "the trapped-tail problem is concrete and resolved in short dialogue, with pulling versus shared pushing stated through visible results; rock's flat side and springs free add language variety without a sustained D investigation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a888cd96d14a3add",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Simple action sentences pair with short quoted refusals, requests and thanks.",
      "vocabulary": "traps, studies, flat side and springs free broaden the action vocabulary.",
      "knowledge": "A heavy object can trap a tail; the direction of effort can matter.",
      "progression": "Pulling worsens the trap, Grumpy inspects the rock, then requests a shared push.",
      "inference": "Link his changed request to the failed solo pull and inspection."
    }
  },
  "dino-pals-05-bossy-makes-a-plan": {
    "appReadingLevel": "D",
    "rationale": "three mismatched jobs fail differently before Bossy asks the Pals to demonstrate strengths and reallocates jobs. Tracking that revision across several characters, including Chompy's changed waiting, exceeds a single C action/result chain.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:8f3635aff6fa1fab",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Then-linked clauses, dialogue and three separately assigned actions on one page vary the structure.",
      "vocabulary": "hauls, guards, fetches and job/list language require distinguishing assignments.",
      "knowledge": "A group plan works better when tasks fit its members; lunch preparation remains concrete.",
      "progression": "Goal and list lead to three failures, a request, demonstrations and a revised allocation.",
      "inference": "Infer why the demonstrated jobs replace the first list and why Chompy now waits."
    }
  },
  "dino-pals-06-bouncy-bumps-into-everything": {
    "appReadingLevel": "C",
    "rationale": "Bouncy's repeated bumps form an accessible pattern, while each accident changes the object and repair, and the final empty-field choice links the earlier mess to a safer large bounce.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:19623f3820f5e774",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short paired action/repair sentences alternate with a sound effect and object list.",
      "vocabulary": "falls, plates, gather, enormous and checks broaden familiar movement language.",
      "knowledge": "Bumping objects causes spills; open space changes the risk.",
      "progression": "Successive bumps cause repairs, a sneeze enlarges the mess, then Bouncy checks for space.",
      "inference": "Connect the empty field with avoiding the damage caused by earlier bouncing."
    }
  },
  "dino-pals-07-wigglys-messy-day": {
    "appReadingLevel": "C",
    "rationale": "the long-tail accidents and explicitly marked space carry the sequence; favorite, freezes, keeps clear and the apology vary the language and require a supported reading of friends' reactions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:29ccacefbb43d17f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short sentences include paired actions, a quoted apology and a possessive noun phrase.",
      "vocabulary": "swish, favorite, freezes, keeps clear and swishes extend concrete motion words.",
      "knowledge": "A long tail needs room; accidental splashes can upset a friend.",
      "progression": "Accidents and repairs lead to an apology, marked space and slower swishing.",
      "inference": "Link Fancy's withdrawal and later distance to the tail's effect, using the explicit request for room."
    }
  },
  "dino-pals-08-zippy-slows-down": {
    "appReadingLevel": "D",
    "rationale": "Zippy must recognise flowers he passed, use the bent tree to retrace his route and lead Sunny home past the waterfall. This landmark-memory chain adds a fair spatial clue demand beyond C's directly linked actions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4dca344fcf5c2070",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short action sentences mix with questions, remembered dialogue and directional phrases.",
      "vocabulary": "shortcut, nowhere nearby, passed and bent tree carry route relationships.",
      "knowledge": "Recognising and retracing landmarks can recover a route.",
      "progression": "A rushed shortcut fails; remembered flowers lead to the tree, a reunion and the return route.",
      "inference": "Connect the recognised flowers and tree to his earlier journey rather than simply following a named home path."
    }
  },
  "dino-pals-09-honkys-inside-voice": {
    "appReadingLevel": "C",
    "rationale": "repeated loud/soft contrasts support Honky's breakfast problem, while the rain rescue requires choosing a louder call for a different purpose and the closing whisper recalls the original difficulty.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3317752ea632dbb2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired simple sentences, quoted requests and a shouted invitation vary the page pattern.",
      "vocabulary": "tumble, whispers, shower, bolts and rescued extend familiar breakfast/weather words.",
      "knowledge": "Useful voice volume depends on distance, weather and who needs to hear.",
      "progression": "A quiet-call trial is undone by cheering; the storm makes a loud call useful before quiet breakfast resumes.",
      "inference": "Distinguish the appropriate storm call from the earlier disruptive shouting."
    }
  },
  "dino-pals-10-cheekys-prank-goes-wrong": {
    "appReadingLevel": "C",
    "rationale": "two unwanted pranks, a shared slip, cleanup and a direct question explain Cheeky's changed joke. Varied actions and dialogue create more demand than B, while the repair remains concrete and explicit.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cb19129c7ce5d966",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied subject/action sentences include then and a direct question.",
      "vocabulary": "favorite, scrubs, prank actions and silly faces broaden social/play vocabulary.",
      "knowledge": "A joke can obstruct or hurt someone; asking what they enjoy offers a concrete alternative.",
      "progression": "The hat prank fails, the mud prank backfires, Cheeky repairs it and asks both friends.",
      "inference": "Compare who laughs before and after the repair to understand the changed joke."
    }
  },
  "dino-pals-11-shys-secret-gift": {
    "appReadingLevel": "D",
    "rationale": "the repeated gifts support a mystery, but readers must connect noisy searches, Sunny's silent wait, two small feet and Shy's reply, then recognise the reciprocal gifts as a response to the discovered giver.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:bc0f000f3e539b82",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short narration and dialogue follow repeated finds sentences.",
      "vocabulary": "hidden giver, silently, bracelet and fern carry the search and gift evidence.",
      "knowledge": "A giver may leave gifts unseen; others can reciprocate appreciation.",
      "progression": "Three gifts establish a pattern; failed watches precede a quiet observation, reveal and next-morning response.",
      "inference": "Use the feet and conversation to identify the hidden giver and interpret the final returned gifts."
    }
  },
  "dino-pals-12-fancys-bad-day": {
    "appReadingLevel": "D",
    "rationale": "the folded fan passes through several unsuitable offers before wetting and pressing solve it, and the closing bracelet expresses thanks. Woven/fold/damp vocabulary and the multi-step repair exceed a simple C consequence chain.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:be88cd272126b965",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short dialogue alternates with paired actions and comparative perspective sentences.",
      "vocabulary": "woven, fold, damp, flattens and reflection add craft-specific language.",
      "knowledge": "A folded leaf fan can be softened with water and pressed flat.",
      "progression": "Different failed offers lead to a water-and-rock plan, two repair steps and a thank-you gift.",
      "inference": "Compare the observers' reactions with Fancy's concern and connect the bracelet with Wiggly's help."
    }
  },
  "dino-pals-13-clumsy-to-the-rescue": {
    "appReadingLevel": "D",
    "rationale": "the search changes from low viewpoints to Clumsy's higher view, then separates locating the pillow from retrieving it. The blue-square clue, downstream setting and second helper require connected spatial reasoning.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:80647dcc4d6b0a0e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied action sentences mix with quoted claims, an offer and a confession.",
      "vocabulary": "scans, beyond, floats, falls short and soggy support search/retrieval distinctions.",
      "knowledge": "A higher viewpoint can reveal a hidden object without making it reachable.",
      "progression": "Low searches fail, Clumsy locates the pillow, Bouncy explains its movement and Wiggly retrieves it.",
      "inference": "Identify the blue square as the pillow and distinguish seeing it from being able to reach it."
    }
  },
  "dino-pals-14-what-is-flappy": {
    "appReadingLevel": "D",
    "rationale": "Flappy revises the assumption that wings mean upward flight by observing claws, climbing and gliding. The contrast with Bossy and the repeated up/down demonstrations introduce connected biological and physical relationships.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a870d9f5059953ca",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Questions, but-linked contrasts and quoted explanations vary otherwise short actions.",
      "vocabulary": "feathered, claws, grip, bark, glides and nest form a specific movement vocabulary.",
      "knowledge": "Wings can support gliding while claws support climbing; different animals move differently.",
      "progression": "Failed flapping and jumping lead to claw evidence, climbing, a glide and a final demonstration.",
      "inference": "Combine the ground-gripping claws and spread wings to explain Flappy's successful route."
    }
  },
  "dino-pals-15-sneezy-and-the-waterfall": {
    "appReadingLevel": "D",
    "rationale": "a blocked stream explains the stopped waterfall, three failed attempts establish the problem, and Sneezy's warning, sheltering friends and aimed sneeze resolve it. Readers track several coordinated causal steps across the sequence.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:5a21dfc678b3774a",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Mostly short sentences include direct warning, clipped effects and a three-part final page.",
      "vocabulary": "blocks, shoves, fern dust, aims and arcs broaden terrain/action language.",
      "knowledge": "An upstream blockage interrupts water flow; moving it restarts the falls.",
      "progression": "Blockage, failed pushes, sneeze trigger, safety preparation and directed clearing precede restored flow.",
      "inference": "Connect the cleared upstream rocks with the waterfall's return and the stand-back warning with flying rocks."
    }
  },
  "dino-pals-16-chompy-and-grumpys-day-out": {
    "appReadingLevel": "D",
    "rationale": "the quiet outing develops contrasting preferences, a two-attempt ditch problem, rescue and an understated invitation back to berries. Sun-warmed/mud-covered language and the friendship change add demands beyond a repeated C action sequence.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:23b96c3ebfd49a6d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short sentences use compound descriptions, paired actions and direct speech.",
      "vocabulary": "pebble, sun-warmed, ditch, grips and mud-covered broaden concrete descriptive language.",
      "knowledge": "A firm tail can help someone climb from a ditch; friends can accommodate different preferences.",
      "progression": "Contrasting leaf/pebble encounters lead to rest, rescue and a changed shared ending.",
      "inference": "Read Grumpy's berry advice as making room for Chompy's preference after helping him."
    }
  },
  "dino-pals-17-the-sunny-hollow-games": {
    "appReadingLevel": "D",
    "rationale": "Bossy's one-winner board conflicts with different strengths across the games, so the reader must compare categories and understand the revised one-winner-per-game rule. Repeated bows support a multi-character plan change.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cecc68765d06116b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short narration includes questions, superlatives, exclamations and several paired actions.",
      "vocabulary": "farthest, tidying, scattered, patterns and different winners carry activity/category distinctions.",
      "knowledge": "Different contests can reward different strengths rather than producing one overall winner.",
      "progression": "One blank space fails to fit several winners; the plan changes and the board fills.",
      "inference": "Connect the growing winner list with the need to change the board's original purpose."
    }
  },
  "dino-pals-18-dozys-wonderful-dream": {
    "appReadingLevel": "D",
    "rationale": "the explicit dream and waking frame supports imagined cloud beds, but repeated failures must be compared with the stable rock solution and the friends' return around Dozy's pillow.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2329c1cc1b604f76",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired clauses, contractions, directional phrases and brief dialogue vary the short narration.",
      "vocabulary": "sags, nearly, rocky peak, wobble, thin and murmurs extend place/material language.",
      "knowledge": "A dream can change physical rules; a stable support differs from a shifting cloud.",
      "progression": "Sleep frames several failing beds, a rock-supported bed and a return to waking companions.",
      "inference": "Distinguish dream events from the waking frame and connect the shared bed with his request to stay."
    }
  },
  "dino-pals-19-zippys-race": {
    "appReadingLevel": "D",
    "rationale": "the race joins friends' easy-win claim, excessive practice, tired legs, a close finish and changed training next morning. The reason for Zippy's silence and the understated final rest require supported inference.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c4a1b8cc47078cd2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short action/dialogue sentences include temporal shifts and a final then-linked pair.",
      "vocabulary": "valleys, practice loops, final bend, crosses and winner's pebble extend race language.",
      "knowledge": "Too much practice without rest can tire a runner before competition.",
      "progression": "Expectations lead to overtraining, a hard race, reflection and a shorter next-day practice.",
      "inference": "Connect the easy-win pressure to extra laps and infer why the next morning's routine changes."
    }
  },
  "dino-pals-20-the-big-storm": {
    "appReadingLevel": "D",
    "rationale": "a storm forecast turns a sprawling job list into coordinated tasks by several Pals, followed by shelter and cleanup. The dry pillow is evidence that the linked preparation worked.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ec80a1f79c1dcdea",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short narration mixes quoted fragments, a question and paired action/dialogue pages.",
      "vocabulary": "trails, scattered, sweep, supplies, branches and pounds extend preparation/weather language.",
      "knowledge": "Shared preparation and shelter protect people and belongings during a storm.",
      "progression": "Warning leads to reassigned jobs, gathering, clearing, stacking, sheltering and post-storm cleanup.",
      "inference": "Integrate distinct characters' tasks into one plan and read the dry pillow as its concrete outcome."
    }
  },
  "meadow-pals-01-muddy-has-a-bath": {
    "appReadingLevel": "A",
    "rationale": "Muddy/mud/bath recur in very short familiar present-tense clauses, and brown water, another wash and staying clean make the outcome direct. Supper supplies a concrete purpose without a new conceptual explanation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:22f1e1f017af82c4",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Mostly single short subject/verb clauses with repeated Muddy openings and one pronoun.",
      "vocabulary": "mud, bath, water, washes, clean and supper form a small familiar set.",
      "knowledge": "Washing removes mud before eating; no specialist background is required.",
      "progression": "Muddy gets muddy, washes again and stays clean for supper.",
      "inference": "Only the direct connection between mud, washing and clean is needed."
    }
  },
  "meadow-pals-02-woolly-cant-sleep": {
    "appReadingLevel": "B",
    "rationale": "the goes sound pattern and repeated listening support the story, while nestles, straw and the slow-breath turn introduce modest vocabulary and a simple self-settling consequence beyond A's most predictable actions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ab23ea1b56f036b2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Single short clauses vary between Woolly actions and sound-source sentences.",
      "vocabulary": "listens, slow breath, nestles and straw extend the familiar sleep/sound set.",
      "knowledge": "Listening can keep someone alert; slow breathing and settling can precede sleep.",
      "progression": "Several sounds hold Woolly's attention before breathing and nesting lead to sleep.",
      "inference": "Connect the changed settling action with the final sleep; no hidden motive is needed."
    }
  },
  "meadow-pals-03-clucky-lays-an-egg": {
    "appReadingLevel": "B",
    "rationale": "repeated too high/hard/small trials support the nest search, but several material and position contrasts, a tipping hat and the farmer's straw solution require small pattern changes and a concrete problem/solution link.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d55e9ff635218934",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses alternate sensory judgments with finding and bringing actions.",
      "vocabulary": "nest, log, corner, straw, high, hard and soft build a modest contrast set.",
      "knowledge": "A safe nest needs suitable support and soft material.",
      "progression": "Unsuitable places are rejected before a dry corner and straw provide a safe nest.",
      "inference": "Compare the stated physical qualities to understand why the final straw works."
    }
  },
  "meadow-pals-04-bouncy-wont-stop": {
    "appReadingLevel": "B",
    "rationale": "Bouncy's repeated hopping causes a tipped pail and spilled eggs, then separate fetching/gathering actions repair both. The two affected friends and final route around them add variation beyond A's single direct outcome.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c3fc511b0fbfc45c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short sentences include a sound effect, paired clauses and an and-linked repair.",
      "vocabulary": "pail, spills, fetches, gathers and around extend familiar hop/path language.",
      "knowledge": "Fast movement can spill things; water and eggs require different repairs.",
      "progression": "Two accidents lead to a warning, restitution and a changed route.",
      "inference": "Match each repair with its earlier accident and understand hopping around friends as the adjustment."
    }
  },
  "meadow-pals-05-grumpy-gets-a-surprise": {
    "appReadingLevel": "B",
    "rationale": "very short birthday actions and familiar cake/hat words support Grumpy's withdrawal and return, while the preference for less noise and the one-more-bite variation require a small social link beyond a fixed A pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:602d6d858f43d810",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short declarative clauses vary between named and pronoun subjects.",
      "vocabulary": "birthday, crowd, bite and one more extend familiar party objects/actions.",
      "knowledge": "Someone can want a quiet birthday and still enjoy friends and cake.",
      "progression": "Grumpy rejects noisy party objects, friends wait, Tiny brings cake and he smiles.",
      "inference": "Connect the quiet approach and cake with his renewed engagement without assuming his original boundary was wrong."
    }
  },
  "meadow-pals-06-sleepy-cant-wake-up": {
    "appReadingLevel": "A",
    "rationale": "Sleepy's repeated not-waking, staying and snoring responses anchor familiar bed/bell/toast actions; the final smell-to-breakfast turn is concrete and directly named rather than inferred through a complex clue.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:aa1ad9a13fa0a0f6",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses repeatedly name Sleepy, with straightforward other-character actions.",
      "vocabulary": "bed, bell, call, toast and breakfast are familiar; snores is context-supported.",
      "knowledge": "Sleeping, waking and wanting breakfast require everyday knowledge.",
      "progression": "Wake-up attempts fail until Sleepy smells toast and joins breakfast.",
      "inference": "Connect the explicitly named smell of toast with getting up for breakfast."
    }
  },
  "meadow-pals-07-noisy-tries-to-be-quiet": {
    "appReadingLevel": "B",
    "rationale": "the quiet goal, loud yell and renewed try lead to a point-and-whisper response that lets Sleepy remain asleep. Two distractions and the changed response create a simple causal comparison beyond A repetition.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:283b22ad4163c948",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses include an and-linked final strategy and an exclamation.",
      "vocabulary": "beak, crawls, points and whispers extend the quiet/sleep vocabulary.",
      "knowledge": "A quiet response is less likely to wake a sleeping friend.",
      "progression": "A bug prompts a yell; a worm prompts pointing and whispering after another try.",
      "inference": "Compare the two responses and Sleepy's stated reactions."
    }
  },
  "meadow-pals-08-tiny-is-very-small": {
    "appReadingLevel": "A",
    "rationale": "key/log/hole/small recur through a tightly supported retrieval, and repeated Tiny actions explicitly show the small character succeeding where larger reaching fails. The size relation remains one concrete, visible contrast.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4912024e914e0a96",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Very short clauses use repeated reach/key and Tiny action frames; one final cheer is paired.",
      "vocabulary": "key, log, hole, small, reach and crawls form a narrow concrete set.",
      "knowledge": "A small body can fit a small opening that a larger limb cannot reach through.",
      "progression": "Failed reaching establishes one obstacle; Tiny enters, finds and retrieves the key.",
      "inference": "Read small enough in relation to the already named small hole."
    }
  },
  "meadow-pals-09-shy-comes-out-to-play": {
    "appReadingLevel": "A",
    "rationale": "repeated Shy/Cuddly names and very short waits/sits/steps clauses make the approach to play direct. Cuddly's stillness and Shy's exit are stated in order, with no dialogue or hidden clue to decode.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2b26893cf29667c5",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Single short present-tense clauses repeatedly name the actor.",
      "vocabulary": "play, waits, barn, still, steps and sits are familiar concrete words.",
      "knowledge": "A still, nearby friend can make joining play easier.",
      "progression": "Shy withdraws, Cuddly waits still, then Shy emerges, sits and joins.",
      "inference": "Connect Cuddly's stillness with Shy's explicitly shown approach."
    }
  },
  "meadow-pals-10-giggly-has-the-hiccups": {
    "appReadingLevel": "B",
    "rationale": "repeated hiccups and does not help frames support failed remedies, but worse, a returning hiccup and the second breath require tracking a small recurrence and changed response beyond A's direct finish.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:67d1b0bd3f525c0f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short action clauses alternate with sound effects and a concluding fragment-plus-clause.",
      "vocabulary": "hiccups, worse, sip and slow breath broaden familiar body/action language.",
      "knowledge": "Hiccups can stop and return; a calm breath is the story's attempted response.",
      "progression": "Laughing worsens hiccups; sip and hop fail; breathing helps twice.",
      "inference": "Link the repeated breath to the two explicitly stated stopping events."
    }
  },
  "meadow-pals-11-brave-climbs-the-hay-bale": {
    "appReadingLevel": "A",
    "rationale": "Brave repeatedly climbs, falls and tries again in very short clauses, then finds a lower step and reaches the top. The single clearly stated climbing solution outweighs incidental descriptive words such as steep.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:95bb9f7337aff3f5",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses repeatedly begin with Brave; falls/again reinforces predictability.",
      "vocabulary": "hay bale, straw, steep, lower and top are concrete, with repeated climb/fall support.",
      "knowledge": "A lower step can make a high place easier to reach.",
      "progression": "Two failed climbs are followed by one lower-step success and the same route down.",
      "inference": "Connect the lower step with reaching the top; the return path is explicitly the same."
    }
  },
  "meadow-pals-12-hungry-eats-everything": {
    "appReadingLevel": "B",
    "rationale": "repeated feeding actions and the empty-trough/farmer-response sequence remain simple, while trough, gate, hay and slowly add broader concrete vocabulary and a small need-to-help link.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f62cce31fe90a371",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses include eats and drinks and a possessive closing sentence.",
      "vocabulary": "chews, hay, trough, gate and full extend familiar food/water language.",
      "knowledge": "A calf needs suitable food and water and can become full.",
      "progression": "Eating is interrupted by no water; a call brings supplies and slow feeding ends in fullness.",
      "inference": "Connect the empty trough and call with the farmer's arrival."
    }
  },
  "meadow-pals-13-splashy-finds-a-puddle": {
    "appReadingLevel": "B",
    "rationale": "repeated Splashy/jump actions lead to explicitly wet, displeased friends and a named drying repair. Scowls/frowns and choosing a roomier puddle add a simple social consequence without a C-level explanation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f7011ece47ba32f3",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses include two paired action/reaction sentences and an and-linked repair.",
      "vocabulary": "puddle, scowls, drips, frowns and space broaden the splash vocabulary.",
      "knowledge": "Splashing can wet nearby friends; more space avoids that result.",
      "progression": "A big splash upsets two friends, Splashy dries them and chooses more space.",
      "inference": "Match the frowns with getting wet and the new puddle choice with avoiding another splash."
    }
  },
  "meadow-pals-14-speedy-slows-down": {
    "appReadingLevel": "B",
    "rationale": "runs past repeats briefly, but the full text adds missing the path, being unseen, losing home and stopping to use Tiny's call. The route/sound recovery and several later pattern changes exceed A's direct repeated actions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:82a279c123f83593",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Three runs past sentences give support before varied negatives and a coordinated stops and listens clause.",
      "vocabulary": "toward, misses, path, cannot find and way home express more than landmark labels.",
      "knowledge": "Rushing can lead past a route; stopping to listen can supply a direction home.",
      "progression": "Repeated fast movement creates disorientation, then listening and a call lead to recovery.",
      "inference": "Connect Tiny's call with Speedy's ability to find home, after his own movement has failed."
    }
  },
  "meadow-pals-15-cuddly-wants-a-hug": {
    "appReadingLevel": "B",
    "rationale": "repeated approaches and familiar hug actions support Cuddly's search, while changing pronoun references and asking/nodding require tracking who wants the hug and who agrees.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:da095b064af024b1",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses alternate named and pronoun subjects; the last page has three clipped sentences.",
      "vocabulary": "hug, waits, asks, one more and nods remain concrete social vocabulary.",
      "knowledge": "Friends may accept or decline contact; a request and a nod communicate agreement.",
      "progression": "Several unavailable partners lead to waiting, asking Woolly and a mutually chosen repeat hug.",
      "inference": "Resolve she/her references and read the nod as an answer to the request."
    }
  },
  "meadow-pals-16-muddy-and-splashy-make-a-mess": {
    "appReadingLevel": "A",
    "rationale": "mud repeats through making and jumping into one pool, and short clauses directly name the splash, Grumpy's frown, washing and grin. Two protagonists share one concrete consequence and repair.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ce288eb435fd2cc2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Very short declaratives repeat mud and use they for the established pair.",
      "vocabulary": "mud, pail, pool, jump, wash and clean form a narrow concrete action set.",
      "knowledge": "Mud splashes nearby objects and can be washed off.",
      "progression": "They make one pool, splash Grumpy, wash him and leave together.",
      "inference": "Connect the frown to the mud and the grin to the explicitly named wash."
    }
  },
  "meadow-pals-17-bouncy-and-speedy-have-a-race": {
    "appReadingLevel": "A",
    "rationale": "they pass repeats across three familiar landmarks, and the missed turn is followed immediately by stop and turn and finishing together. Short clauses keep the correction explicit without the remembered-clue demand of Dino Zippy's route.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:83c76778028c0d5f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses use repeated race/together words and a three-page they pass frame.",
      "vocabulary": "race, beside, barn, pond, hill, turn and finish are familiar concrete route words.",
      "knowledge": "A race follows a route; a missed turn can be corrected by turning back.",
      "progression": "The race starts, passes landmarks, misses a turn, then corrects it and finishes.",
      "inference": "Interpret behind them as requiring the immediately stated stop and turn."
    }
  },
  "meadow-pals-18-noisy-wakes-everyone-up": {
    "appReadingLevel": "B",
    "rationale": "repeated dark sky and loud calls support the early wake-up sequence, while too soon, till dawn and friends' frowns require linking time of day to Noisy's decision to wait.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:eee916205f93ee1c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary actor and include a final two-sentence reaction/wait pair.",
      "vocabulary": "too soon, peeks, still dark and dawn extend familiar sleep/day language.",
      "knowledge": "Calling everyone awake before daylight can be unwelcome; dawn supplies a later time.",
      "progression": "Noisy calls twice before daylight, sees the response and waits for dawn.",
      "inference": "Connect darkness and frowning friends with the corrected timing."
    }
  },
  "meadow-pals-19-tiny-and-brave-go-on-an-adventure": {
    "appReadingLevel": "B",
    "rationale": "repeated red hat/log words help, but the complete story combines a chase, a size-dependent retrieval and Brave's tying action to prevent another loss. Fit/through/outside/tight add several linked spatial and object-state changes.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:09248e6dae1772d9",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary the actor, pronouns and directional complements rather than maintaining one action pattern.",
      "vocabulary": "lifts, chase, fit, through, outside and ties tight extend the concrete hat/log set.",
      "knowledge": "A smaller animal can enter a narrow log, and a tied hat is less likely to blow away.",
      "progression": "Wind loss leads to a chase, failed entry, Tiny's retrieval and Brave's securing action.",
      "inference": "Connect size to the retrieval and the final tying step to the hat staying on."
    }
  },
  "meadow-pals-20-shy-and-cuddly-find-each-other": {
    "appReadingLevel": "B",
    "rationale": "short search and hiding actions converge through Shy's hum, then asking and leaning in establish a chosen hug. Branch, pronoun shifts and the sound-to-location link extend A's direct repeated actions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4ffca2edafbda7c4",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses vary the actor and later use they and her.",
      "vocabulary": "close by, branch, hum, looks up and leans in form a modest spatial/social extension.",
      "knowledge": "A sound can reveal a hidden nearby friend; a hug can be requested and accepted.",
      "progression": "Looking and hiding converge at the tree; both sit, ask, choose contact and smile.",
      "inference": "Connect the hum with looking up and the lean with accepting the requested hug."
    }
  },
  "meadow-pals-21-woolly-and-grumpy-are-stuck": {
    "appReadingLevel": "B",
    "rationale": "repeated left/right moves support the wool-and-horn problem, while tighter and lock of wool require a concrete physical link between pulling, worsening the knot and stopping before help.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:def4f1a4ac720455",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses repeat they/both and left/right actions.",
      "vocabulary": "horn, loose wool, knot, tighter and lock of wool extend familiar stuck/pull language.",
      "knowledge": "Pulling tangled wool can tighten it; stopping gives a helper room to free it.",
      "progression": "Wool catches, pulling and side moves worsen it, then stopping permits release.",
      "inference": "Link movement with the tighter knot and final space with avoiding another tangle."
    }
  },
  "meadow-pals-22-sleepys-big-dream": {
    "appReadingLevel": "B",
    "rationale": "the dream is explicitly announced and then one short race sequence shows fast running, tired legs, rest and a narrow win. The one-hoof comparison and simple pacing consequence exceed A but remain directly linked.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9e28ffa9013cd9f4",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses include a then-marked result and before phrases.",
      "vocabulary": "dream, breath, last lap and wins by one hoof broaden familiar race words.",
      "knowledge": "Running too fast can tire someone; resting can help them continue.",
      "progression": "An explicit dream frame contains overfast running, fatigue, rest and a close finish.",
      "inference": "Connect tired legs with the rest; the dream need not be distinguished from an unmarked second timeline."
    }
  },
  "meadow-pals-23-giggly-and-clucky-bake-a-cake": {
    "appReadingLevel": "B",
    "rationale": "repeated brings actions and cake words support the sequence, while a spill, flat cake and measuring before baking again create a concrete retry. Ingredients and oven add modest topic vocabulary without sustained explanation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:61528bf52677185b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses use repeated Clucky brings and one and-linked cleanup/retry.",
      "vocabulary": "flour, oven, measure, flat and tall build a small baking/contrast set.",
      "knowledge": "Baking involves ingredients and measuring; a failed result can prompt a retry.",
      "progression": "Ingredients and spill precede a flat cake; measuring and rebaking yield the tall shared cake.",
      "inference": "Connect measuring again with the changed result; no recipe or chemical process is explained."
    }
  },
  "meadow-pals-24-grumpys-secret": {
    "appReadingLevel": "B",
    "rationale": "The repeated does-not-know search leads Tiny along the path to Grumpy watering his plants. Familiar short actions and a directly stated garden reveal support B; shoots and a time marker add modest vocabulary without a second process or concealed mechanism.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d0a196151339242b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated short negatives give way to varied actions and a weeks later temporal phrase.",
      "vocabulary": "dawn, grows, shoots, beams and garden extend beyond the repeated character/search words.",
      "knowledge": "Young shoots grow over weeks with water, so the later garden is a changed living state.",
      "progression": "Absence prompts a search, gardening is shown, then weeks pass before the friends see the result.",
      "inference": "Connect Grumpy's early absence and watering with the later established garden."
    }
  },
  "meadow-pals-25-the-big-farm-party": {
    "appReadingLevel": "B",
    "rationale": "familiar party preparations use short named-character actions, then Shy and Grumpy withdraw and join after less noise. The quieter-party link is direct despite several characters.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:440cba78da8bf9a2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses vary the actor and include one final paired subject.",
      "vocabulary": "party, fruit cake, drum, flags, far off and less noise remain concrete social words.",
      "knowledge": "Some friends need a quieter setting to join a group event.",
      "progression": "Preparations create a noisy party; two friends keep away, noise decreases and both join.",
      "inference": "Connect the explicitly reduced noise with the two friends' return."
    }
  },
  "moonwood-tales-c-01": {
    "appReadingLevel": "G",
    "rationale": "Pip tests the supposed Bravery Stone across a climb and a fog crossing, yet still feels fear. Burrow’s pocket question and Pip’s confident final offer require the reader to reinterpret both earlier successes without an explicit explanation that the magic did not supply his courage.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4503795391c33c3d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Past-tense paragraphs combine temporal, purpose and concessive clauses with indirect dialogue.",
      "vocabulary": "Flickered, discovery, courage, steep, grips, reeds and dull broaden familiar action language.",
      "knowledge": "The reader distinguishes a claimed magical property from evidence of personal action.",
      "progression": "Two separate trials precede the fading stone and a retrospective reinterpretation.",
      "inference": "Connect the pocket question, persistent fear and final confident action across pages.",
      "sustainedReading": "Twelve connected paragraphs require memory of the original belief and both tests."
    }
  },
  "moonwood-tales-c-02": {
    "appReadingLevel": "G",
    "rationale": "The unfinished growth song supplies a rule that persists through escalating plant damage and unsuccessful new spells. The leaves repeat the opening notes and pause, so the reader must connect that audible clue to the missing ending before the completed song restores access to Hollow Oak.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b56e06fc33ce6e10",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "As, while, before and so clauses link parallel actions and consequences.",
      "vocabulary": "Verse, enormous, dense, tangled, stem, casting and flowering extend ordinary gardening language.",
      "knowledge": "A fictional song has a completion condition; adding unrelated spells does not satisfy it.",
      "progression": "An interrupted action causes escalating consequences, failed attempts and a clue-based repair.",
      "inference": "Retain the missing ending and recognize the leaves as repeating the incomplete pattern.",
      "sustainedReading": "Twelve paragraphs connect the opening omission to the final whole-song response."
    }
  },
  "moonwood-tales-c-03": {
    "appReadingLevel": "E",
    "rationale": "Stone’s fear, Burrow’s need and the careful crossing and return form one sustained, plainly explained problem. The final still-swaying bridge leaves a supported emotional inference, but the text introduces no concealed mechanism, specialist explanation or interleaved mystery requiring a G-level reading.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:27a5a4403a27e794",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied compound sentences and keeping, when and so clauses describe controlled movement.",
      "vocabulary": "Sway, narrow, gripped, fixed, steady, shore and rushing are concrete in context.",
      "knowledge": "Bridge crossing, reassuring a friend and managing fear use familiar physical and social ideas.",
      "progression": "One failed first step is followed by a supported outward and return journey.",
      "inference": "Notice that Stone acts despite continuing uncertainty; the bridge itself does not change.",
      "sustainedReading": "Twelve paragraphs sustain one realistic action sequence rather than several competing threads."
    }
  },
  "moonwood-tales-c-04": {
    "appReadingLevel": "F",
    "rationale": "Repeated failed fire practice develops into a different use for Glimmer’s cinnamon breath. The fox follows the smell expecting food and drops the seed pouch after a sneeze; readers connect the earlier apparently useless warmth to this rescue and recognize the need to rest without a stated moral.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:751975ba766eb2cb",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Multi-sentence paragraphs vary temporal clauses, dialogue, participles and cause-and-effect links.",
      "vocabulary": "Flicker, scowled, cinnamon, pouch, clamped, bolted and practice patch enrich the action.",
      "knowledge": "Smell can mislead an animal; fatigue can make further practice unhelpful.",
      "progression": "Several practice outcomes seed the later fox episode and the quiet resting close.",
      "inference": "Connect scent, the fox’s mistaken food expectation and a useful non-fire response.",
      "sustainedReading": "Twelve paragraphs retain several practice outcomes before applying one in a later episode."
    }
  },
  "moonwood-tales-c-05": {
    "appReadingLevel": "G",
    "rationale": "The reader must follow mirrored writing, starting direction, a size-changing error and a curling page that blocks completion of the correction. Luna’s wing solves that physical obstacle; Wren’s rejection of another charm in favor of a step-stool book then depends on understanding the earlier magical and practical risks.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3785a5c404cc22eb",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, as if, before and instead of clauses carry comparisons and conditions.",
      "vocabulary": "Reflection, spine, opposite, charm, mirrored and crowded introduce literary and book-related terms.",
      "knowledge": "Writing direction and the relative size of the reader and page jointly matter.",
      "progression": "A procedural mistake changes scale; the correction is itself interrupted before assistance succeeds.",
      "inference": "Track why correct direction alone is insufficient and why the final ordinary solution appeals.",
      "sustainedReading": "Twelve paragraphs sustain a reversible rule, a spatial obstacle and a changed decision."
    }
  },
  "moonwood-tales-c-06": {
    "appReadingLevel": "G",
    "rationale": "Flint’s accurate map becomes misleading because the paths change after he records them. Dating a new map, preserving the earlier one under YESTERDAY and beginning an atlas require the reader to separate a representation’s historical truth from its usefulness for the present journey.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2505f96e8e6b908e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Temporal, purpose and concessive clauses contrast past accuracy with present mismatch.",
      "vocabulary": "Parchment, quill, symbol, landmark, mismatch and atlas carry substantial unfamiliar word demands.",
      "knowledge": "Maps represent places at a time; changed terrain does not make the past record meaningless.",
      "progression": "A confident complete map fails, then becomes one dated record in an ongoing method.",
      "inference": "Understand both maps can be accurate for different times and why updates remain necessary.",
      "sustainedReading": "Twelve paragraphs revisit the same representational problem through several days and outcomes."
    }
  },
  "moonwood-tales-c-07": {
    "appReadingLevel": "G",
    "rationale": "Dewdrop tests a stranger’s impressive story against its description of moles and Burrow’s dry-tunnel map. Readers evaluate an unreliable speaker using several contradictions, then distinguish the false boast from the fish’s real discovery and infer why an ordinary true experience earns attention.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9507ea7d543e334f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Embedded quotation, reported claims and conditional could-not reasoning vary sentence structures.",
      "vocabulary": "Boasted, stranger, passage, trailing, admitted, spring and ordinary create semantic demands.",
      "knowledge": "Physical habitat facts and the difference between claims and checked evidence matter.",
      "progression": "A claim prompts questioning, external checking, confrontation, admission and a verified replacement story.",
      "inference": "Combine dry tunnels, brown Burrow and the fish’s answers to judge reliability and motive.",
      "sustainedReading": "Twelve paragraphs require retention and reassessment of earlier claims during the later meeting."
    }
  },
  "moonwood-tales-c-08": {
    "appReadingLevel": "G",
    "rationale": "The carved door, Luna’s partial memory, the notch-and-claw latch and the old glowing pictures lead to a room that records Moonwood’s past. Burrow’s ordinary chalk drawing then begins to glow, requiring readers to connect the newly observed present with the room’s historical function.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d3783c0560516568",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, until, instead of and as clauses extend action and interpretive sentences.",
      "vocabulary": "Spade, ancient, carving, sketch, notch, latch, vanished and wingtip are varied and unfamiliar.",
      "knowledge": "A picture archive can preserve past places and accept a new record of the present.",
      "progression": "Discovery, safe inspection, a physical clue and a remembered identity precede a new magical effect.",
      "inference": "Connect the final glowing chalk tree with the surrounding historical records.",
      "sustainedReading": "Thirteen paragraphs sustain a discovery through several characters and two successive revelations."
    }
  },
  "moonwood-tales-c-09": {
    "appReadingLevel": "G",
    "rationale": "Loose wand magic turns sneezes into increasingly disruptive events, and suppressing a sneeze worsens the effect. Spark must stop experimenting, help repair two places and keep his wand aside; the last harmless sneeze asks readers to connect changed behavior with the rule established at the beginning.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f7cc1eada486b5a7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Because, which, while, just as and with-every clauses combine causes, timing and consequences.",
      "vocabulary": "Stray, porridge, petals, gathered, powerful, key, measured and rinsed broaden language.",
      "knowledge": "The fictional sneeze-and-wand relation must stay distinct from ordinary cold-care actions.",
      "progression": "Escalating accidents cross several locations before a two-part cleanup and a final retest.",
      "inference": "Compare the last sneeze with earlier ones and retain the abandoned wand’s significance.",
      "sustainedReading": "Fourteen paragraphs involve several helpers, separate consequences and a delayed behavior-change payoff."
    }
  },
  "moonwood-tales-c-10": {
    "appReadingLevel": "F",
    "rationale": "Luna’s cold-water and silver-pebble memories narrow a search before the box is recovered. The text then explains the seeds’ purpose and follows their planting beside the old oak. This is rich sustained narrative with supported clue use, but the search’s decisive links are supplied directly.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:133e776f915a7a77",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Where, while, before and purpose clauses vary longer descriptions and action sequences.",
      "vocabulary": "Urgent, current, latch, shaded, stepping stones and mound require broader concrete vocabulary.",
      "knowledge": "Cold storage protects seeds; old trees can be succeeded by newly planted ones.",
      "progression": "Search and elimination lead to retrieval, checking contents and a substantial planting sequence.",
      "inference": "Link the remembered water and pebble to one location and the planting to the old oak.",
      "sustainedReading": "Fourteen paragraphs sustain a clear main goal and its meaningful aftermath."
    }
  },
  "moonwood-tales-c-11": {
    "appReadingLevel": "F",
    "rationale": "Pip and Stone’s assumption that a huge sound means a huge creature is overturned by a tiny lost toadling. Stone must then soften his own call to help it. The linked size/sound reversals and shifting reactions make this richer than a simple rescue, while the cause and solution are openly explained.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:eff2c40da7d4394e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Because, after and instead of constructions connect expectations, timing and choices.",
      "vocabulary": "Booming, source, distant, rustled, toadling, reeds and echo enrich descriptive language.",
      "knowledge": "Loudness need not indicate body size; a helper’s voice can frighten a small listener.",
      "progression": "A sound mystery resolves into a lost-family problem and a second communication adjustment.",
      "inference": "Reconsider the initial size assumption and compare Stone’s first and gentler calls.",
      "sustainedReading": "Twelve paragraphs maintain the sound motif through two connected problems."
    }
  },
  "moonwood-tales-c-12": {
    "appReadingLevel": "F",
    "rationale": "The missing stream music is traced upstream to a boulder, and separate pushing and water attempts fail. The successful solution combines water loosening mud from beneath with a vine pulling from the bank, requiring causal and spatial reasoning beyond a friendship-only narrative.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c2cc520ce43f2ac7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, with-every, allowing and at-the-same-time constructions link simultaneous mechanisms.",
      "vocabulary": "Source, current, boulder, pressure, braced, loosened and restored introduce broader terms.",
      "knowledge": "Reduced flow, trapped objects and opposing forces explain the physical problem beneath the fantasy.",
      "progression": "Symptoms are followed upstream, two attempts fail and coordinated actions remove the obstruction.",
      "inference": "Understand why water underneath plus pulling succeeds where pushing or surface water does not.",
      "sustainedReading": "Twelve paragraphs follow one physical mechanism with a musical result and closing joke."
    }
  },
  "moonwood-tales-c-13": {
    "appReadingLevel": "F",
    "rationale": "Spark and Glimmer alternate roles as unsuccessful teachers, then simplify one floating target and use Glimmer’s gliding breath as a model. Readers connect two learning problems and infer the value of observation and smaller steps, with the actual breath and boot results made visible in the prose.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d4da751a4428f251",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Temporal shifts, direct speech and while/when/yet clauses interleave two learners’ actions.",
      "vocabulary": "Hovered, glided, instructions, charts, cupped and even breath expand movement and teaching language.",
      "knowledge": "A model can reveal an action; isolating a small part can make a difficult task manageable.",
      "progression": "Reciprocal failed lessons develop over three days before each learner achieves a limited success.",
      "inference": "Compare cumbersome charts with targeted observation and connect gliding to controlled breath.",
      "sustainedReading": "Twelve paragraphs maintain two linked goals and a reciprocal relationship."
    }
  },
  "moonwood-tales-c-14": {
    "appReadingLevel": "F",
    "rationale": "Conflicting guides lead Wren and Flint astray, after which observing the mushrooms supplies a reliable route. The brighter side, linked lights and dated map are directly described, so the reader tracks a richer comparison between methods without needing a sustained concealed-rule deduction.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3d3c8f6e17bb633e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, instead of, as if and temporal clauses combine disagreement, observation and movement.",
      "vocabulary": "Direction, unfamiliar, recognized, pulsed, relief and marker-related language broaden vocabulary.",
      "knowledge": "Maps and spells can be fallible; observed landmarks and dated records can help navigation.",
      "progression": "A choice fails, both original tools fail and environmental observation provides a new route.",
      "inference": "Compare certainty with checked evidence and retain the bright-side signal as the route repeats.",
      "sustainedReading": "Twelve paragraphs sustain one navigation problem with an explicit observational solution."
    }
  },
  "moonwood-tales-c-15": {
    "appReadingLevel": "G",
    "rationale": "Burrow cannot initially read the carved trees in order. Luna’s root hint and the changing tree sizes identify the beginning, after which the rabbit’s acorn and doorway explain Hollow Oak’s history. Burrow’s final comparison with his own tunnel requires transferring that long time-scale relationship to the present.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:662d2db5db65b96c",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Some/others contrasts, reported past events and before/after relationships structure the embedded history.",
      "vocabulary": "Gallery, carved, ceiling, waistcoat, raised, acorn and doorway extend descriptive vocabulary.",
      "knowledge": "A pictorial sequence can encode chronology, tree growth and the survival of an old entrance.",
      "progression": "An unreadable historical display becomes an ordered origin story and then a personal comparison.",
      "inference": "Use size and root clues to order images, then connect the ancient doorway with Burrow’s work.",
      "sustainedReading": "Twelve paragraphs move between present investigation, depicted past and an inferred future possibility."
    }
  },
  "moonwood-tales-c-16": {
    "appReadingLevel": "F",
    "rationale": "Moved objects prompt a night watch, which reveals Burrow carrying boots and biscuits while asleep. The prose identifies his state as soon as he is seen; crumbs and footprints then corroborate it for Burrow. Readers retain evidence and understand the joke, but need not solve an extended ambiguous mystery.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1d38eed661caf456",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, without, even when and temporal clauses link simultaneous watching and sleeping actions.",
      "vocabulary": "Clearing, crouched, drooped, shuffling, waistcoat and overturned enrich narrative description.",
      "knowledge": "Sleepwalking explains apparently intentional movement without waking memory.",
      "progression": "An unexplained repeated event leads to watching, observation, evidence and restitution.",
      "inference": "Connect earlier moved objects with the witnessed actions and infer the biscuit/boot humor.",
      "sustainedReading": "Twelve paragraphs maintain a straightforward evidence-to-explanation sequence."
    }
  },
  "moonwood-tales-c-17": {
    "appReadingLevel": "F",
    "rationale": "A visible purple/green mismatch warns that Wren has made the wrong potion; walking plants confirm the mistake. The discovered recipe gives a clearly ordered song-then-water cure. Varied dialogue, unfamiliar objects and the multi-step repair require F-level support without a concealed G-level rule.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:80656d079571dda9",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, but, followed by and one-by-one structures link warnings, parallel movement and ordered treatment.",
      "vocabulary": "Cauldron, potion, recipe, motion, sprinkled, parade and waddled introduce substantial unfamiliar language.",
      "knowledge": "Instructions have conditions and order; warnings must be checked before acting.",
      "progression": "A warning is ignored, effects spread and an explicitly supplied two-stage cure restores the garden.",
      "inference": "Connect the wrong color with the later moving plants and infer responsibility from the final agreement.",
      "sustainedReading": "Twelve paragraphs sustain one error and its sequential, explicitly explained correction."
    }
  },
  "moonwood-tales-c-18": {
    "appReadingLevel": "F",
    "rationale": "A current presses the trapped fish tighter, so Stone must identify the movable rock and overcome his reluctance to enter the water. The reader integrates force, rock position and emotional restraint; Stone’s wet but relaxed close requires a modest inference about changed priorities.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cbc319e3f2239587",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Instead of, though, although and while clauses connect mechanical failure with conflicting feelings.",
      "vocabulary": "Shallows, desperately, injuries, current, loose, released and arc broaden physical vocabulary.",
      "knowledge": "The direction of a force and a rock’s support determine whether a trapped animal can move.",
      "progression": "A failed water attempt leads to a second helper, inspection, precise movement and release.",
      "inference": "Connect the loose mud and rock movement; read Stone’s relaxed shoulders after the unwanted splash.",
      "sustainedReading": "Twelve paragraphs combine a physical solution and a continuing fear/help conflict."
    }
  },
  "moonwood-tales-c-19": {
    "appReadingLevel": "G",
    "rationale": "The search separates misleading gold dust from the route rain actually took, eliminates dry tunnels and connects an empty box with newly rooted seedlings. The solution changes from retrieving missing seeds to protecting their growth and using their light in place, requiring a sustained causal reinterpretation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9c3601090b635d7f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "If, where, when and cause clauses support elimination, parallel searches and a changed plan.",
      "vocabulary": "Channel, delicate, seedlings, shallow, tremble and aboveground extend environmental vocabulary.",
      "knowledge": "Runoff can move seeds, wet soil supports germination and rooted seedlings must not be treated like loose seeds.",
      "progression": "Several false leads are tested before evidence reveals a different state of the missing objects.",
      "inference": "Combine rain route, dry tunnels, hum and roots; understand why the original goal must change.",
      "sustainedReading": "Twelve paragraphs sustain distributed clues and a final reinterpretation of both loss and solution."
    }
  },
  "moonwood-tales-c-20": {
    "appReadingLevel": "F",
    "rationale": "Patterns on the fallen fragments answer their constellations, and a blocked view explains why a higher ledge is needed. Luna states the deadline and rule, after which the group carries and aligns the pieces. The celestial vocabulary and spatial matching are substantial, but the key relations are explicitly given.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:957bdf03eea1baeb",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "When, before and purpose clauses link changing light, visibility and timed collective action.",
      "vocabulary": "Fragments, constellations, pulsed, ledge, beams and paling introduce specialist and literary words.",
      "knowledge": "The fiction depends on matching star patterns and an unobstructed view rather than ordinary falling rocks.",
      "progression": "Observation and a failed low attempt lead to a stated rule and a shared higher-site solution.",
      "inference": "Retain matching patterns and the trees’ obstruction while the setting changes.",
      "sustainedReading": "Twelve paragraphs sustain a single explicitly explained return-to-sky task."
    }
  },
  "moonwood-tales-c-21": {
    "appReadingLevel": "F",
    "rationale": "An unseen scratching source leads several friends through a room search to Twig’s hidden home. The spectacles-on-head discovery resolves the second problem directly, while her collecting and sorting explain the room’s objects. Richer atmosphere and vocabulary sustain the read without an extended hidden mechanism.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2977ea7ef0ebccf2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, where, followed by and temporal clauses vary suspenseful description and discovery.",
      "vocabulary": "Muttering, tangled, spectacles, lenses, collected and neighbors broaden otherwise familiar domestic language.",
      "knowledge": "Searching can overlook a visible object; lenses help the owner distinguish small items.",
      "progression": "An unknown sound prompts a doorway search, then a new neighbor’s small problem is resolved.",
      "inference": "Recognize the spectacles joke and connect the crowded collection with the difficulty finding them.",
      "sustainedReading": "Twelve paragraphs sustain atmosphere and two plainly resolved discoveries."
    }
  },
  "moonwood-tales-c-22": {
    "appReadingLevel": "G",
    "rationale": "The race follows several competitors through different mistakes while Wren’s spell accelerates everyone except herself. Her change from winning to marking a safe return, Dewdrop’s return after finishing and the contrasting final awards require integration of simultaneous events, intentions and consequences across the ensemble.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:231b285085818ee8",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Instead of, while, as and though clauses coordinate overlapping actions and contrasting motives.",
      "vocabulary": "Clutching, signal, confident, scattered, soggy and finish-line terms extend narrative vocabulary.",
      "knowledge": "Winning a route race and helping lost competitors are different achievements.",
      "progression": "Several separate mishaps converge into a recovery route and a socially meaningful award scene.",
      "inference": "Track who knows what, why Wren changes goals and why two winners’ situations differ.",
      "sustainedReading": "Twelve paragraphs distribute attention across many named participants and reconnect their threads."
    }
  },
  "moonwood-tales-c-23": {
    "appReadingLevel": "G",
    "rationale": "Pip’s marker establishes changing evidence before the search finds a crowded mist spirit. The expanding fog is linked to displaced habitat and blocked water; removing objects, clearing the channel and creating a boundary solve related but distinct causes. The closing marker check validates the whole account.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:561b99f7dbc98182",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Whether, until, so and at-the-same-time clauses connect investigation and parallel repairs.",
      "vocabulary": "Boundary, clutter, channel, mist, crowded and marker-related language adds conceptual vocabulary.",
      "knowledge": "Habitat space, water movement, shared responsibility and a physical boundary interact within the fantasy.",
      "progression": "Measurement over days leads to diagnosis, two coordinated repairs and a later evidence check.",
      "inference": "Relate the fog’s advance to crowded habitat and understand why cleanup alone is not the whole response.",
      "sustainedReading": "Twelve paragraphs sustain linked environmental and social explanations through a recurring observation."
    }
  },
  "moonwood-tales-c-24": {
    "appReadingLevel": "F",
    "rationale": "Glimmer’s controlled attempts, a wobbling flame and Luna’s stop instruction lead to lighting one lantern that activates the path. The practical safety sequence is explicit; the richer demands lie in varied clauses, fire-control vocabulary and reading Glimmer’s quiet pride rather than in a concealed magic rule.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0af2a4ccf98e49b8",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "After, before, as and without clauses link practice, control and a spreading light sequence.",
      "vocabulary": "Controlled, extinguisher, steadily, wick, vanished and lanterns extend practical vocabulary.",
      "knowledge": "Aiming and stopping a flame differ from merely producing one; the lantern transfer is fictional.",
      "progression": "A small success escalates, is stopped and becomes a safe practical application.",
      "inference": "Interpret the held cheer, silent grin and hug as a response to long-awaited success.",
      "sustainedReading": "Twelve paragraphs sustain one explicitly guided practice episode and emotional close."
    }
  },
  "moonwood-tales-c-25": {
    "appReadingLevel": "F",
    "rationale": "The friends build a frightened creature’s trust, interpret its brief answer and navigate beyond the range of their light using Burrow’s scent clue. The matching eyes and final blink establish reunion indirectly. Atmosphere and perspective create a richer supported rescue, without an elaborate magical condition.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d18db032e07ab1cf",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Past-tense paragraphs vary temporal connectors, direct dialogue and clauses describing cautious group action.",
      "vocabulary": "Creature, trembled, uncertain, familiar, clearing, silver moss and enormous broaden language.",
      "knowledge": "Trust, cautious navigation and recognizing a family from shared features are the main knowledge demands.",
      "progression": "Contact and feeding lead to a group journey, an obstacle, a sensory clue and reunion.",
      "inference": "Infer trust from approach and family recognition from eyes, closeness and the answering blink.",
      "sustainedReading": "Twelve paragraphs preserve an unfamiliar setting and a vulnerable character’s viewpoint."
    }
  },
  "meadow-pals-26-muddys-cool-wall": {
    "appReadingLevel": "C",
    "rationale": "Muddy first changes wet blocks into hard ones to build a stable wall, then uses that wall's shade to cool the pool. Those two connected material/heat relationships raise the demand beyond one B action/consequence.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:101eac80a13dfc0e",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses remain accessible but change subjects and track two stages of cause.",
      "vocabulary": "stacks, slumps, open pool, dries, hard and shades form a specific construction/heat set.",
      "knowledge": "Wet mud can slump, dry mud can hold shape, and shade can reduce warming.",
      "progression": "Failed wet wall exposes the pool; drying, rebuilding and shading lead to cool mud.",
      "inference": "Connect the repaired wall's stability with its separate role in keeping the pool shaded."
    }
  },
  "meadow-pals-27-splashys-reed-boat": {
    "appReadingLevel": "B",
    "rationale": "short boat actions repeat a spin before Splashy folds the sail and the boat goes straight. Reed/sail vocabulary adds breadth, while one concrete failed push and changed sail state keep the link simple.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:007f016b2e0d2a69",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses repeat boat/spins and vary named/pronoun subjects.",
      "vocabulary": "reed, sail, spins, folds and straight extend the familiar wind/boat vocabulary.",
      "knowledge": "A boat's sail can affect how wind moves it.",
      "progression": "Release and a harder push both spin the boat; folding the sail changes the motion.",
      "inference": "Compare the before/after motion when the sail is folded."
    }
  },
  "meadow-pals-28-woollys-wool-cloud": {
    "appReadingLevel": "B",
    "rationale": "repeated wool words and short collection/patting/drying actions show how a blown-away cloud craft is fixed. Tufts and board add concrete vocabulary, while mud supplies one visibly sequenced holding solution.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:24eb8a3dcdd4ce6a",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses include a sound-effect pair and repeat named-character/wool actions.",
      "vocabulary": "tufts, loose wool, spreads, board and stays put extend a small craft set.",
      "knowledge": "Wool can blow away; wet mud can hold it to a board as it dries.",
      "progression": "Wind undoes the craft, Woolly retrieves wool, Muddy adds mud and the dried craft stays.",
      "inference": "Connect mud under the wool and drying with the stated stable result."
    }
  },
  "meadow-pals-29-shys-pond-rings": {
    "appReadingLevel": "B",
    "rationale": "the short pond question and waiting sequence lead directly to a visible frog. Creeps/bank and varied small actions broaden the language, but the answer is revealed rather than requiring a sustained D clue chain.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a31f6f3e441a982d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses include one question and a sound-effect/action pair.",
      "vocabulary": "rings, below, creeps, bank, still and leap extend a small pond vocabulary.",
      "knowledge": "A moving animal can disturb pond water and reveal itself after waiting.",
      "progression": "Rings prompt a search, an accidental stone interrupts it, and quiet waiting reveals the frog.",
      "inference": "Connect the frog with the original rings; the intervening stone explains a separate disturbance."
    }
  },
  "meadow-pals-30-cuddlys-yarn-ball": {
    "appReadingLevel": "B",
    "rationale": "yarn repeats through pulling, tight knots, following back and freeing loops before rolling a ball. Strand/knots/loop broaden concrete vocabulary, and the reversed approach remains one short physical problem/solution.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:e34fd93d2faad4d1",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses repeatedly name Cuddly or she, with familiar action complements.",
      "vocabulary": "yarn, strand, knots, loop, rolls and tidy form a concrete textile set.",
      "knowledge": "Pulling tangled yarn can tighten knots; loosening loops permits winding.",
      "progression": "A harder pull fails, tracing backward and freeing loops allow the desired ball.",
      "inference": "Connect the changed action with releasing rather than tightening the knots."
    }
  },
  "meadow-pals-31-bouncys-hay-lift": {
    "appReadingLevel": "B",
    "rationale": "repeated hay/bale/bounce words support an overshoot followed by a smaller bounce. Top/past/inside and pressing springs add a modest physical-direction link beyond a fixed A action pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1ca49d6aa44a0932",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses include a sound-effect pair and now-marked adjustment.",
      "vocabulary": "bale, springs, past, cart, presses and fits extend concrete movement words.",
      "knowledge": "Changing a bounce can change where a carried object lands.",
      "progression": "One bale overshoots into a cart; Bouncy resets and uses a smaller bounce to place it.",
      "inference": "Link smaller motion with the bale reaching its intended place."
    }
  },
  "meadow-pals-32-tinys-giant-berry": {
    "appReadingLevel": "C",
    "rationale": "Tiny must stabilise the oval berry with a pebble and turn it so the formerly blocked wide side can pass the root. Shape, orientation, downhill movement and a prop create a connected physical solution beyond one B effect.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:62fc6b532cbc09a1",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Mostly short clauses culminate in a paired turn-and-roll sentence, with several directional references.",
      "vocabulary": "oval, wide side, root, downhill, props and pebble carry the solution.",
      "knowledge": "An oval object's orientation affects clearance, and a prop can prevent rollback.",
      "progression": "A root blocks the berry, pushing causes rollback, a pebble stabilises it and turning permits passage.",
      "inference": "Infer why turning the stabilised berry solves the earlier wide-side obstruction."
    }
  },
  "meadow-pals-33-braves-beetle-bridge": {
    "appReadingLevel": "B",
    "rationale": "short beetle/Brave clauses contrast an unhelpful tap with a leaf tunnel and waiting. Far end and out add one spatial relationship, while the safe arrival is explicitly stated.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:378761974270dacd",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short single clauses repeat beetle and Brave/he; a final inverted out walks adds small variation.",
      "vocabulary": "beetle, safe, tunnel, far end and flowers form a modest concrete nature set.",
      "knowledge": "A small insect may stop when disturbed and use a covered route.",
      "progression": "Tapping stops the beetle, so Brave builds a tunnel and waits for it to reach flowers.",
      "inference": "Connect waiting and the tunnel with the beetle's subsequent safe movement."
    }
  },
  "meadow-pals-34-grumpys-sun-clock": {
    "appReadingLevel": "C",
    "rationale": "the reader must compare a marked shady edge that shifts twice with a trunk that remains shaded, then understand why moving lunch beside the trunk solves the problem. This temporal/spatial comparison exceeds one B action/result.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a9313255525f27c5",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses use again/soon/still to compare changing and stable conditions across pages.",
      "vocabulary": "shade, shady edge, marks, warms, trunk and cool carry the spatial heat contrast.",
      "knowledge": "Shade can move as sunlight changes; an object's position can stay protected.",
      "progression": "Two temporary moves fail before Grumpy notices persistent shade at the trunk.",
      "inference": "Connect the repeated shifting edge with choosing a consistently shaded location."
    }
  },
  "meadow-pals-35-gigglys-round-wheel": {
    "appReadingLevel": "B",
    "rationale": "the broken wheel and scattered flowers make the problem explicit, and a fitting round wood slice plus reloaded flowers show a concrete repair. A diagnostic question adds variation without a sustained explanation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:e5198a8233d3ab92",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short clauses include a sound effect, one question and paired stopping/reflection.",
      "vocabulary": "cart, wheel, thumps, wood slice, fits and arrive extend a familiar delivery set.",
      "knowledge": "A round replacement can restore a cart wheel's function.",
      "progression": "Pulling a broken cart faster worsens the spill; stopping, fitting a slice and reloading complete delivery.",
      "inference": "Infer that the fitting round slice replaces the broken wheel, using the immediately established fault."
    }
  },
  "dino-pals-21-fancys-moonleaf-arch": {
    "appReadingLevel": "C",
    "rationale": "Fancy compares rolling round supports with stable flat ones, then coordinates curved branches and knots to finish an arch. Paired results and construction vocabulary broaden both language and physical relationships.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c99499854a085890",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Single actions alternate with two- and three-sentence observation/result pages.",
      "vocabulary": "moonleaf, arch, balances, curve, knot and sturdy form a specific construction set.",
      "knowledge": "The shape of supports affects stability; branches can form an arch.",
      "progression": "A round-stone collapse prompts flat replacements, curved branches and tied leaves before sunset.",
      "inference": "Use the explicitly observed rolling stones to understand why flat supports work."
    }
  },
  "dino-pals-22-shys-sinking-path": {
    "appReadingLevel": "C",
    "rationale": "the sinking stone is followed by beetles at a dry edge and yellow-leaf route marking. Specific terrain vocabulary and paired observations link evidence to a practical crossing while stating the dry-ground conclusion directly.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:6282cecd5554a8e2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short varied actions mix with paired failure/observation sentences.",
      "vocabulary": "bubbles, sinks, edge, track and ground broaden familiar path/mud language.",
      "knowledge": "Wet mud may not support a stone; a nearby dry route can carry travellers.",
      "progression": "A test crossing fails, beetles suggest an edge route, Shy confirms it and marks it for others.",
      "inference": "Connect the beetles' route with the stated dry ground, then the marked track with safe travel."
    }
  },
  "dino-pals-23-flappys-fern-delivery": {
    "appReadingLevel": "C",
    "rationale": "a wide fern spins and blocks Flappy's view, then rolling and tying it makes a narrow load for a successful delivery. Paired actions and the wide/narrow comparison exceed B's brief one-variable action frame.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3c7b92b5d803a9a9",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired and three-clause pages mix with single longer actions and a final emphatic fragment.",
      "vocabulary": "grips, glides, bundle, narrow, loop and roof form a broader delivery/material set.",
      "knowledge": "A broad load catches wind and obstructs vision; bundling changes both effects.",
      "progression": "A roof delivery fails, the fern is rolled and tied, then delivered before the rain.",
      "inference": "Connect the narrower hanging load with straight flight and the roof with the dry cave."
    }
  },
  "dino-pals-24-clumsys-steady-bowls": {
    "appReadingLevel": "C",
    "rationale": "four stacked bowls roll away, stop on different surfaces and are returned singly to flat ground. The question and varied paired language support a clear comparison of carrying and placement methods.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:107a80856d62c29f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short narration alternates with a direct question and paired observation/result sentences.",
      "vocabulary": "stacks, clatter, downhill, roots and one at a time extend practical bowl/ground language.",
      "knowledge": "Stacked objects can fall during turning; stable surfaces and separate carrying reduce movement.",
      "progression": "Stacking fails, Clumsy observes where bowls stop, then changes transport and placement.",
      "inference": "Connect roots/flat rock stopping the bowls with the final choice of flat ground."
    }
  },
  "dino-pals-25-sneezys-seed-cloud": {
    "appReadingLevel": "C",
    "rationale": "Sneezy's clearing sneeze enlarges the fluff cloud, but seeds stuck to a wet rock suggest a damp leaf for cleanup. Specific material words and the observation-to-plan link create broader C demands.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:591fe88c27992516",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short action pages include dialogue, sound effects and paired ending actions.",
      "vocabulary": "tickly, seed fluff, drifts, bursts, damp and sweeps broaden nature/material vocabulary.",
      "knowledge": "Light seed fluff scatters in moving air and can adhere to a wet surface.",
      "progression": "A failed sneeze leads to wet-rock evidence, leaf preparation, cleanup and planting.",
      "inference": "Transfer the wet rock's observed effect to using the damp leaf."
    }
  },
  "dino-pals-26-sunnys-two-part-picnic": {
    "appReadingLevel": "C",
    "rationale": "two different temperature preferences survive one failed shared-shade solution, then the sun/shade boundary permits one picnic with two locations. Paired contrasting sentences and explicit comparison raise demand above B.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ddce51fe80a1b870",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired wants/results and a three-fragment closing contrast vary the short action sentences.",
      "vocabulary": "beneath, thick fern, sharp line, cool half and sunny half carry spatial temperature relationships.",
      "knowledge": "Sun warms berries while shade can keep a friend cooler.",
      "progression": "One shared placement meets only one need; observing a boundary leads to two adjacent placements.",
      "inference": "Integrate both characters' preferences to understand why splitting the mats works."
    }
  },
  "dino-pals-27-bossys-three-paths": {
    "appReadingLevel": "C",
    "rationale": "Zippy's easy crossing contrasts with Grumpy's gap problem, and Bossy supplies closer stones plus alternative routes. Varied short language and an explicit different-needs comparison justify C without assuming a higher level from the clipboard alone.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:207c328f9fa98a1f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses pair contrasts and include a three-item route list.",
      "vocabulary": "gap, farther, closer, bank, edge and clipboard extend path-building vocabulary.",
      "knowledge": "Different bodies need different step distances or routes.",
      "progression": "One path works for one friend, fails for another, then is supplemented and recorded.",
      "inference": "Connect Grumpy's observed step limit with closer stones and the provision of alternatives."
    }
  },
  "dino-pals-28-honkys-echo-tunnel": {
    "appReadingLevel": "D",
    "rationale": "Honky replaces an uninformative loud call with separate soft tests, then combines a faint echo and moving fern in cool stream air to select a tunnel. The final return confirms a multi-cue investigation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:8cadc23f32dec213",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Questions, sound effects, a contrast and paired observations vary the narration.",
      "vocabulary": "branching, chamber, echoes, faint and stirs are specific sound/space words.",
      "knowledge": "Echo differences and moving air can supply clues about connected spaces.",
      "progression": "An indiscriminate test fails; controlled calls distinguish tunnels, environmental cues guide choice and a return confirms it.",
      "inference": "Combine two clues and compare all-tunnel noise with the more useful quiet test."
    }
  },
  "dino-pals-29-cheekys-shadow-show": {
    "appReadingLevel": "D",
    "rationale": "the noon failure must be compared with the later low sun, longer shadows and a turned screen before the show works. Time, light direction and projection relationships create a connected spatial explanation beyond C's single comparison.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:812fec173e3a9d24",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Paired result sentences, temporal phrases and varied short action clauses structure the sequence.",
      "vocabulary": "noon, screen, blank, sinks lower, stretch and takes a bow extend shadow/show language.",
      "knowledge": "Sun angle affects shadow direction and length; screen placement affects what is visible.",
      "progression": "A noon show fails, later shadows provide evidence, screen position changes and performers complete the show.",
      "inference": "Connect low sun and long shadows with why the reoriented screen receives the large image."
    }
  },
  "dino-pals-30-dozy-stops-the-melon": {
    "appReadingLevel": "C",
    "rationale": "the rolling melon and pillow produce a failed tap, a pillow caught in a dip and Dozy's changed catching plan. Paired events and directional vocabulary sustain a short physical cause chain above B.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1a66d96a2e4a0a3f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short paired actions include a contracted causal result and sound-effect repetition.",
      "vocabulary": "props, guards, scrambles, dip, across and catches extend the rolling-object vocabulary.",
      "knowledge": "A hollow can stop a rolling object and a spread pillow can cushion a landing.",
      "progression": "A prop dislodges, both objects roll, a tap worsens speed, and the caught pillow becomes a trap.",
      "inference": "Connect the pillow stopping in the dip with Dozy's plan for the still-moving melon."
    }
  },
  "moonwood-tales-c-26": {
    "appReadingLevel": "F",
    "rationale": "A trembling root leads Pip and Burrow to a buried branch and second rope, revealing how wind aboveground rings the bell. A loose wedge fails before a tied rope works. Readers follow a multi-link physical explanation, which the prose supplies directly before the successful retest.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1876eb0be8cb9f00",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Though, with every, while and as clauses link hidden simultaneous movements.",
      "vocabulary": "Trembled, buried, branch, wedge, gust, peg and rehung add mechanical vocabulary.",
      "knowledge": "A linked rope mechanism can transmit movement from a tree to a bell.",
      "progression": "Symptom, failed restraint, source tracing, temporary failure and a stronger restraint form a causal sequence.",
      "inference": "Connect root vibration, wind, branch and rope rather than assuming the bell moves by magic.",
      "sustainedReading": "Ten paragraphs sustain one explained mechanism through two different repair attempts."
    }
  },
  "moonwood-tales-c-27": {
    "appReadingLevel": "F",
    "rationale": "Stone’s attempt to clear the shade creates another shadow, so reflected moonlight becomes an alternative. The rock’s angle, a beam too high and Fern’s adjustment require spatial and causal reasoning. Each relation is narrated directly, making this a compact F-level explanation in story form.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ecb3597e7d5d0819",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "As, until and temporal phrases link movement, shadows and changed beam direction.",
      "vocabulary": "Moonbeam, reflected, tilted, propped, crescent and fragile extend spatial and light vocabulary.",
      "knowledge": "A shadow blocks light and an angled reflective surface redirects it in the story.",
      "progression": "A direct approach worsens the problem before a different light path is tested and adjusted.",
      "inference": "Track why Stone changes position and why a small tilt moves the beam onto the buds.",
      "sustainedReading": "Ten paragraphs maintain one light-and-position relationship with explicit feedback."
    }
  },
  "moonwood-tales-c-28": {
    "appReadingLevel": "G",
    "rationale": "Long notes tighten the root into loops, while silence stops it and brief taps draw it without allowing a curl. Fern must infer that difference from several failures and apply it at changing positions to make an arch; the owls’ final hooting then strengthens the intended new shape.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:52f708ed6e2f3f3f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "When, with no, before and until-like limits express response timing and control.",
      "vocabulary": "Curve, loosened, tightened, unwound, frame and gripped support abstracted movement relations.",
      "knowledge": "A fictional sound-response rule distinguishes duration and position of the stimulus.",
      "progression": "Observation and repeated failure lead to isolating a variable and applying the rule at three locations.",
      "inference": "Compare sustained notes with taps and transfer that distinction to the final hooting effect.",
      "sustainedReading": "Ten paragraphs repeatedly test the same rule and require it to predict the closing response."
    }
  },
  "moonwood-tales-c-29": {
    "appReadingLevel": "G",
    "rationale": "Wren confuses a pocket’s one-object limit with the small size of ten berries. The reader sees each new berry displace the last before Wren does, then must understand how one tied bundle can contain ten berries while still satisfying the unchanged magical rule.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f3a69168ea71ffc0",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Where, without and as clauses link unseen simultaneous loss with Wren’s confident movement.",
      "vocabulary": "Weightless, previous, bundle, single and broad leaf carry quantification and containment meanings.",
      "knowledge": "The count of containers differs from the count of their contents.",
      "progression": "A stated constraint is misapplied, demonstrated repeatedly and satisfied through a new representation.",
      "inference": "Maintain the one-object rule and recognize the bundle as a change of unit rather than a changed spell.",
      "sustainedReading": "Ten paragraphs retain one constraint, dramatic irony and a numerically consistent solution."
    }
  },
  "moonwood-tales-c-30": {
    "appReadingLevel": "F",
    "rationale": "Luna’s size-sorted mobile produces the wrong projection, so she compares the hanging stars with the real sky and adjusts their positions. A red star’s position relative to three silver points and the wall’s owl pattern require representational and spatial comparison, but the method and success criteria are directly explained.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cff7a16e4c48d373",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "After, while and before clauses organize comparison and adjustment of representations.",
      "vocabulary": "Constellation, mobile, reflected, securely, latch and east add topic and directional language.",
      "knowledge": "A constellation is a relational pattern; ordering by size does not preserve it.",
      "progression": "One wrong organizing principle is replaced by observation, comparison and incremental correction.",
      "inference": "Understand why a neat size row differs from a matching sky pattern.",
      "sustainedReading": "Ten paragraphs follow one clearly modeled representational task."
    }
  },
  "moonwood-tales-c-31": {
    "appReadingLevel": "F",
    "rationale": "Following a curved root returns Burrow to his starting point, so he measures its circle and finds a straight route beneath it. The contrast among map, circular obstacle and underground crossing requires spatial reasoning and knowledge of soil support, with each discovery clearly stated.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f059ae2a04f605a6",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Until, instead of, before and purpose clauses express route alternatives and verification.",
      "vocabulary": "Shortcut, measurements, strip, firm, crossing and potting bench extend spatial vocabulary.",
      "knowledge": "Circling an obstacle differs from crossing beneath its depth; firm soil supports a tunnel.",
      "progression": "A direct plan fails, following the obstacle fails and measurement reveals a different route.",
      "inference": "Compare the curved return with the lower crossing and connect the revised map to the real tunnel.",
      "sustainedReading": "Ten paragraphs sustain a physically explained geometry problem."
    }
  },
  "moonwood-tales-c-32": {
    "appReadingLevel": "F",
    "rationale": "Flint cannot read the root shadows safely until Pip discovers the angled crystal dividing the lantern beam. The falling crystal briefly recreates the doubled shadows, confirming the cause. Readers integrate light source, beam and obstacle, but the optical mechanism is directly explained rather than left as a long mystery.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d3a6a0c8ab6056b1",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Before, as and could-not constructions link observation, parallel action and testing.",
      "vocabulary": "Crystal, angled faces, beam, collar and explorer pouch broaden light and object vocabulary.",
      "knowledge": "In the story, a divided light beam produces an extra shadow of each obstacle.",
      "progression": "Attempts to navigate the symptom fail; inspecting the source reveals and tests the cause.",
      "inference": "Use the repeated double-shadow event during the crystal’s fall as causal confirmation.",
      "sustainedReading": "Ten paragraphs maintain one optical explanation and a short confirming retest."
    }
  },
  "moonwood-tales-c-33": {
    "appReadingLevel": "F",
    "rationale": "Direct warm breath curls the paper without reaching the cold sap between layers. Glimmer and Luna instead warm a rock beneath the stack so heat reaches the adhesive indirectly. The reader must distinguish the damaged material from the material needing treatment and follow a clear causal repair.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:cab0c4cc85500d65",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While and contrasting sentences connect conditions, material change and indirect treatment.",
      "vocabulary": "Amber, sap, hardened, surface, softened and layer introduce material-property language.",
      "knowledge": "Heat can move through a stack; warming adhesive differs from blowing on exposed paper.",
      "progression": "A direct attempt worsens the problem, prompting a controlled indirect method and repair.",
      "inference": "Connect curled paper and still-cold sap with the decision to warm from underneath.",
      "sustainedReading": "Ten paragraphs sustain one plainly described material-and-heat relationship."
    }
  },
  "moonwood-tales-c-34": {
    "appReadingLevel": "G",
    "rationale": "A copy disappears after ten counts even when Spark retries, so lasting success cannot come from merely recasting the spell. Capturing the temporary hook’s negative shape in clay, filling that hollow with fiber and removing a permanent hook require readers to track a representation surviving its vanished original.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c658c580a933e90f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "When, before, even though and as clauses maintain a timed condition across successive attempts.",
      "vocabulary": "Replacement, woven root fiber, mold, hollow, curved and solid create substantial process vocabulary.",
      "knowledge": "A mold preserves an object’s negative shape and can form a lasting positive copy.",
      "progression": "Repeated failure establishes an invariant rule; a new multi-stage fabrication process works within it.",
      "inference": "Distinguish temporary object, retained hollow and durable replacement; recognize that the spell’s rule never changes.",
      "sustainedReading": "Ten paragraphs sustain a timed magical constraint plus a multi-step representational solution."
    }
  },
  "moonwood-tales-c-35": {
    "appReadingLevel": "F",
    "rationale": "One heavy striker produces harsh simultaneous sounds, so Pip tests and assigns different tools to four chimes, straightens a twisted cord and plays them in sequence. Tracking size, tool, sound and order creates multiple concrete relationships, with the successful mappings explicitly named.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f0e947cdb79a8cbb",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "While, as, until and comparative phrases link simultaneous inspection with ordered testing.",
      "vocabulary": "Chime, tuning, harsh, suited, tinkle and tilted extend sound and movement language.",
      "knowledge": "Different strikers and suspended alignment affect sounds; sequential notes differ from a crash.",
      "progression": "A uniform approach fails before differentiated tests, a physical adjustment and an ordered performance.",
      "inference": "Connect tool-to-chime matching and the untwisted cord with the clearer final sound sequence.",
      "sustainedReading": "Ten paragraphs maintain four concrete mappings and a straightforward test-and-adjust procedure."
    }
  },
  "willow-street-the-lunchbox-mix-up": {
    "appReadingLevel": "C",
    "rationale": "Lunchbox names and labels repeat through swapping; a remaining spoon and folded-napkin clue connect the second check to a complete repair.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:fe25eac0fd7c00a2",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "Lunchbox names and labels repeat through swapping; a remaining spoon and folded-napkin clue connect the second check to a complete repair.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-the-lost-library-book": {
    "appReadingLevel": "C",
    "rationale": "Repeated look-under/between/beside searches anchor the story; a leaf triggers memory of a bench and a librarian's dialogue resolves the search.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:222e5ca5628f857d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "Repeated look-under/between/beside searches anchor the story; a leaf triggers memory of a bench and a librarian's dialogue resolves the search.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-the-windy-picnic": {
    "appReadingLevel": "C",
    "rationale": "Wind and napkin words recur through a chase and relocation; a while-clause and food-box weights connect two practical solutions.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9c47ef910e4f7c19",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "Wind and napkin words recur through a chase and relocation; a while-clause and food-box weights connect two practical solutions.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-the-puddle-plan": {
    "appReadingLevel": "C",
    "rationale": "Short dialogue and paired action/result sentences test mud then stones; dry, sticky and stable contrasts make the safer route explicit.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:410472a00391f25b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "Short dialogue and paired action/result sentences test mud then stones; dry, sticky and stable contrasts make the safer route explicit.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-the-squeaky-wheel": {
    "appReadingLevel": "D",
    "rationale": "A failed stones check precedes a gardener's oil-on-axle repair; the reader links lubrication and repeated turning to the quiet wheel.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:a5f6f63dc862e652",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "A failed stones check precedes a gardener's oil-on-axle repair; the reader links lubrication and repeated turning to the quiet wheel.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-the-garden-gate": {
    "appReadingLevel": "C",
    "rationale": "A failed gate pull is explained by a stone underneath; beneath, gritty and close-before-moving phrases support an ordered physical repair.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b22c1a6c6ab8b3cb",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "A failed gate pull is explained by a stone underneath; beneath, gritty and close-before-moving phrases support an ordered physical repair.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-nanis-chapati-lunch": {
    "appReadingLevel": "C",
    "rationale": "A lunch-tin space problem is solved by repeated folding; chapati, lentils, steel tin and triangle broaden concrete food and shape vocabulary.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f4f9de48c29f169d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "A lunch-tin space problem is solved by repeated folding; chapati, lentils, steel tin and triangle broaden concrete food and shape vocabulary.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-dumplings-for-new-year": {
    "appReadingLevel": "D",
    "rationale": "An overfilled wrapper fails, then smaller filling and pinched edges work; quoted instruction and boiling-water cooking track a longer making sequence.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:2c7f9c799ee61d32",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "An overfilled wrapper fails, then smaller filling and pinched edges work; quoted instruction and boiling-water cooking track a longer making sequence.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-drums-for-carnival": {
    "appReadingLevel": "D",
    "rationale": "A premature drum answer interrupts a call; group timing, waits-for-the-end and a final march require understanding an audible response pattern.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:5bd534dcb06f1c38",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "A premature drum answer interrupts a call; group timing, waits-for-the-end and a final march require understanding an audible response pattern.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-eid-morning-with-samir": {
    "appReadingLevel": "C",
    "rationale": "A family morning sequence includes a blocked view and finding a friend; prayers, parcel and dates broaden vocabulary while events remain explicit.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:22169235dd9c2fdf",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied short clauses include selected speech, subordination or temporal links.",
      "vocabulary": "Everyday school/community words plus specific topic or process terms.",
      "knowledge": "A family morning sequence includes a blocked view and finding a friend; prayers, parcel and dates broaden vocabulary while events remain explicit.",
      "progression": "A visible problem or task is followed through several related steps to its result.",
      "inference": "Link the supplied cause, clue or comparison; D titles add a specialized process or convention."
    }
  },
  "willow-street-grow-a-bean-in-a-jar": {
    "appReadingLevel": "D",
    "rationale": "Until-damp and between-paper-and-glass directions require spatial/conditional control; daily checking precedes the root/shoot sequence and transferring the sprouted bean.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c03c7a474cbfcf2f",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Imperatives with until/between conditions and a then sequence.",
      "vocabulary": "Damp, indirect light, shoot and sprouted.",
      "knowledge": "Maintaining an observable germination setup and planting safely.",
      "progression": "Eight dependent steps with a repeated moisture check.",
      "inference": "Low to moderate procedural monitoring; outcomes are explicit."
    }
  },
  "willow-street-make-a-paper-kite": {
    "appReadingLevel": "D",
    "rationale": "Sticks across a diamond, a line tied where they cross and wind behind the reader require ordered spatial construction; the road/wire rule constrains the flying site.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:d210652b33f1199d",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Imperatives, a where-clause and a final coordinated action.",
      "vocabulary": "Diamond, firmly, ribbon, line and wires.",
      "knowledge": "Parts must connect correctly and be used in a safe outdoor location.",
      "progression": "Construction, checking and flight form one dependent procedure.",
      "inference": "Moderate spatial execution rather than hidden story inference."
    }
  },
  "willow-street-build-a-cardboard-ramp": {
    "appReadingLevel": "D",
    "rationale": "After a secured ramp is built, two release-and-mark trials require changing ramp height and comparing stopping points; the result depends on retaining both marks.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4eb52e20e65dcc07",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Imperatives with so/then/which clauses and a longer second-trial sentence.",
      "vocabulary": "Ramp, release, stopping point, compare and traveled farther.",
      "knowledge": "A controlled comparison links one changed setup to two observed distances.",
      "progression": "Setup leads to trial, changed trial and explicit comparison.",
      "inference": "Moderate experimental comparison; the answer is observed rather than supplied."
    }
  },
  "willow-street-make-fruit-and-yoghurt-cups": {
    "appReadingLevel": "D",
    "rationale": "Allergy checking, rinsing and adult cutting frame the repeated cup/fruit layering; cover-and-chill until snack time adds a temporal safety constraint.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:f62316f97ed534c5",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Ordered imperatives with coordinated actions and an until phrase.",
      "vocabulary": "Ingredient, allergies, rinse, yogurt and chill.",
      "knowledge": "Food hygiene, ingredient safety and preparation order.",
      "progression": "A complete recipe leads from checks to cold serving.",
      "inference": "Low to moderate procedural constraint tracking."
    }
  },
  "willow-street-from-wheat-to-bread": {
    "appReadingLevel": "E",
    "rationale": "Grain harvesting, cleaning and grinding connect to flour/yeast/dough transformation; before and while clauses plus the yeast-rise cause require following a sustained production explanation.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:fc5f542f9a7a5348",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Passive forms and before/while subordinate clauses across linked stages.",
      "vocabulary": "Harvester, grain, mill, flour, yeast, dough and risen.",
      "knowledge": "Crop processing and a biological rising process precede heat transformation.",
      "progression": "Eight connected stages follow wheat through processing to shared bread.",
      "inference": "Moderate cause and material-continuity integration."
    }
  },
  "willow-street-where-rainwater-goes": {
    "appReadingLevel": "D",
    "rationale": "Repeated some-rainwater branches show soil soaking, pavement runoff, gutters and drains before streams/sea and vapor/cloud return; each route and transition is stated directly.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:3193295116ef53ba",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Short declaratives, repeated some frames, one and-clause and a final relative clause.",
      "vocabulary": "Pavement, gutters, water butts, drains and vapor.",
      "knowledge": "Introductory drainage and water-cycle relationships.",
      "progression": "Several explicit routes connect to one evaporation/condensation return.",
      "inference": "Moderate route and cycle integration, with little unstated mechanism."
    }
  },
  "willow-street-inside-a-fire-station": {
    "appReadingLevel": "D",
    "rationale": "Dispatcher details trigger clothing and engine preparation; emergency roles, return checks and training form a work cycle with when/before language and equipment lists.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:42aef2972d832fc7",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied active clauses, when/before phrases, passive checks and action lists.",
      "vocabulary": "Dispatcher, protective, emergencies, rescue and first aid.",
      "knowledge": "A coordinated emergency-response process with different roles.",
      "progression": "Preparation proceeds to response, return and readiness.",
      "inference": "Moderate role/sequence tracking; all connections are explicit."
    }
  },
  "willow-street-how-paper-is-recycled": {
    "appReadingLevel": "E",
    "rationale": "Sorting unwanted material, making pulp, screening staples and pressing/drying sheets require following material transformation and removal across a connected manufacturing chain.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4cb872a56209f236",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Passive forms, a relative clause and before-making sequence language.",
      "vocabulary": "Recycling, pulp, screens, staples, layer and heated rollers.",
      "knowledge": "Different treatments change waste paper into usable new material.",
      "progression": "Collection leads through sorting, pulping, cleaning and drying to new products.",
      "inference": "Moderate continuity and function inference between processing stages."
    }
  },
  "willow-street-a-snail-comes-out-at-night": {
    "appReadingLevel": "E",
    "rationale": "Dusk-to-dawn behavior links sensing tentacles, a muscular foot, slime and feeding to damp conditions; the so-it-will-not-dry-out ending explains the return to shelter.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:0dcf011ac560e7bc",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Varied descriptive clauses with temporal shifts and a causal so clause.",
      "vocabulary": "Tentacles, surroundings, muscular, decaying and dusk/dawn.",
      "knowledge": "Anatomical functions and moisture-related adaptation.",
      "progression": "A night activity cycle moves from shelter to sensing/moving/feeding and back.",
      "inference": "Moderate inference connecting earlier dampness to the explicit drying-out cause."
    }
  },
  "willow-street-how-a-book-is-made": {
    "appReadingLevel": "D",
    "rationale": "Author, editor, illustrator and designer roles precede printing, folding and binding; the transition from page sheets to page groups requires an ordered production model.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:4fbc992a78718f7b",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Repeated professional-action openings followed by passive manufacturing clauses.",
      "vocabulary": "Revises, illustrator, designer, ink and bound.",
      "knowledge": "Roles and physical assembly contribute sequentially to a book.",
      "progression": "Creation moves into printing/assembly and distribution.",
      "inference": "Moderate process continuity; no mechanism or causal investigation is developed."
    }
  },
  "meadow-pals-science-01-missing-sandwich": {
    "appReadingLevel": "H",
    "rationale": "the full sandwich investigation sustains paragraph-length dialogue and explanatory clauses across organs, chemical helpers, nutrient absorption, blood transport, waste and elapsed time. Its specialist causal network and two linked mysteries far exceed the short Meadow/Dino stories.",
    "reviewedAt": "2026-10-29",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:61b5dc18669d6b34",
    "levelSystem": "literacy-guide-a-h-v1",
    "dimensionObservations": {
      "syntax": "Extended paragraphs, definitions, subordinate/relative clauses, compound statements and dialogue require sustained integration.",
      "vocabulary": "digestive system, enzymes, starch, esophagus, pancreas, nutrients, bacteria, rectum and anus need explicit specialist support.",
      "knowledge": "Multiple digestive organs and fluids interact; absorption and transport differ from waste formation.",
      "progression": "A question frames the mouth-to-exit journey, with liver/pancreas contributions, blood distribution, timing and a final explanation/callback.",
      "inference": "Trace what leaves the food tube for the blood versus what remains as waste, resolve the sandwich question and infer the noseprint joke."
    }
  },
  "small-steps-01": {
    "appReadingLevel": "B",
    "rationale": "Short first-person clauses repeat cat, mat and fit; the cat changes from the crowded mat to Sam’s lap, making one concrete cause and solution visible.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:6101ba6c8cd6502d"
  },
  "small-steps-02": {
    "appReadingLevel": "B",
    "rationale": "Repeated mud, rug and rag phrases support a failed wipe and rinsed-cloth solution; the hat callback adds gentle humor without difficult syntax.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:384d936b43a3c1fd"
  },
  "small-steps-03": {
    "appReadingLevel": "B",
    "rationale": "Brief commands and first-person actions compare two boxes; the puppy’s fit and the small-box hat have direct pictured outcomes.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:062d684321e7cc62"
  },
  "small-steps-04": {
    "appReadingLevel": "B",
    "rationale": "Very short hot-bun observations and repeated fanning support one change in method; the command to Dad and Yum close vary voice within familiar concrete language.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:ba3695acb62fdcdb"
  },
  "small-steps-05": {
    "appReadingLevel": "B",
    "rationale": "Brief present clauses track a hen leaving the lap and choosing to return after the people sit; vet is introduced in a simple naming clause and the change remains visible.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:1c8890532ededb32"
  },
  "small-steps-06": {
    "appReadingLevel": "B",
    "rationale": "Tug and lid repeat across a failed solo attempt and shared pull; a short two-person action and jam-on-Dad payoff add modest causal variation.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c57415aa1acde29c"
  },
  "small-steps-07": {
    "appReadingLevel": "B",
    "rationale": "The repeated in-my-bag frame changes to a question, unsuccessful tug and removal; hat, mug, log and zip keep the packing problem concrete.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:dfcc78a95f0b34be"
  },
  "small-steps-08": {
    "appReadingLevel": "B",
    "rationale": "Short first-person actions contrast a large hat and small cap; a simple handoff to Dad and shared running resolve the visible size problem.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:c3d247f26c816cc6"
  },
  "small-steps-09": {
    "appReadingLevel": "B",
    "rationale": "Repeated cat-nap sentences alternate with Sam-and-Dot actions; chatting, waking and shutting the shop make the rest interruption and resolution explicit.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:82312a8e71832b7e"
  },
  "small-steps-10": {
    "appReadingLevel": "B",
    "rationale": "Short chip/chin/dish clauses follow a dropped snack, clean replacement and friendly question; the small pictured chin joke adds limited inference without complex grammar.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:191b9cd75d9ff20a"
  },
  "small-steps-11": {
    "appReadingLevel": "B",
    "rationale": "Repeated get/set actions compare two felt shapes; brief dialogue identifies the wrong part and the visibly completed fish resolves the sequence.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:bac73f1aeaac227e"
  },
  "small-steps-12": {
    "appReadingLevel": "B",
    "rationale": "On and in distinguish a ball balanced on a rim from a ball placed inside; repeated ball/tin language, one question and direct spatial cause support the short sequence.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:31235ecfeb728152"
  },
  "small-steps-13": {
    "appReadingLevel": "B",
    "rationale": "Simple first-person clauses explain a hot pig’s repeated digging; the failed fit, wider pit and comfortable rest form one concrete problem and resolution.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:996578e9c54dfe5c"
  },
  "small-steps-14": {
    "appReadingLevel": "B",
    "rationale": "Short repeated look/get/run clauses carry a two-place search; a visible picture-map dot corrects the first guess and the printed ending confirms finding the cap.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:57bb276a8ca1fc82"
  },
  "small-steps-15": {
    "appReadingLevel": "B",
    "rationale": "Repeated pup/tub/rag actions distinguish a dry cloth from a wet one; the removed mud and wet-Sam callback stay within short concrete present clauses.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:60eb2077db6d9cfd"
  },
  "small-steps-16": {
    "appReadingLevel": "B",
    "rationale": "Short get/dip/toss statements follow a failed cup attempt and successful net; the wet-ball handoff adds a pictured humorous consequence without additional syntax.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:9755a9d4179bd54c"
  },
  "small-steps-17": {
    "appReadingLevel": "B",
    "rationale": "Repeated toy-van and log language supports a failed tug and changed angle; whiz links the question to the rolling resolution while the objects remain concrete.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:554423702d953b4f"
  },
  "small-steps-18": {
    "appReadingLevel": "B",
    "rationale": "Brief ink, pink and sink clauses follow a spreading smear and wet-rag correction; the final colored rag/finger consequence requires only a simple comparison.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:5c4ea7485784ad47"
  },
  "small-steps-19": {
    "appReadingLevel": "B",
    "rationale": "Repeated sing/song clauses contrast pan noise with quieter singing; a brief command and the cat’s return make the effect on another character visible.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:e84e58297a29a70f"
  },
  "small-steps-20": {
    "appReadingLevel": "B",
    "rationale": "Short bell/fuzz/cup clauses follow a small sound clue and discovery; repeated ding and the explicit cleanup/ringing close resolve the search with familiar actions.",
    "reviewedAt": "2026-10-28",
    "reviewMethod": "codex-full-manuscript-editorial-review",
    "reviewedTextFingerprint": "fnv1a64:b837bdf6ccfd4f61"
  }
});
