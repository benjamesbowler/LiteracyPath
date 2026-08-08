import { STORY_CONTENT_POLICY_VERSION } from "./storyContentPolicy.js";

export const guidedReadingPolicyBaseline = Object.freeze({
  format: "guided-reading-book",
  itemCount: 206,
  sourceFingerprint: "50af050c4cb73dfec55eb247121ce9106513f624ec4088fc91b1c07e01fd4c05",
  status: "audited-fail",
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  reviewedAt: "2026-08-05",
  reviewer: "Codex editorial audit",
  claim: "All 206 books and 1,861 active pages have completed the current manuscript and illustration audit. Exact-current-text Leda narration resolves for all 1,861 page narrations and 900 isolated-word clips. Publication approval remains blocked until human listening validation is complete."
});

const historicalStoryQuestPolicyReviews = Object.freeze([
  Object.freeze({
    id: "mw_ra_c_01_pip_stone_loud_thing",
    sourceFingerprint: "9ecae1158714f9323080ab21ad09a0bd1ef43c398a006b3505a3ca0ec165f98f",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. A crash and small call establish an urgent fog-marsh rescue. Concrete choices test tracks, reeds, noise and listening; Stone's loud call fails as the fog thickens; softer calls and careful listening locate the frog family; and the final choice determines whether Pip and Stone share the rescue or keep the marsh quiet. All 25 pages have route-true Moonwood art and exact-text Leda narration.",
    targetGoal: "Pip and Stone must find the source of the crash and return the lost toadling to its family before the fog closes over the marsh.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved Pip and Stone models, bright clean flat 2D cartoon treatment, frog scale, Hollow Oak, marsh reeds and route-specific fog/action continuity."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 1629,
      pageNodes: 25,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 25,
      images: 25,
      imageTextMatches: 25,
      method: "All 25 active Moonwood illustrations were individually checked against the locked manuscript and route state; no replacement art was required."
    }),
    audioEvidence: Object.freeze({
      pages: 25,
      exactTextMappings: 25,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mw_ra_c_02_fern_wren_walking_garden",
    sourceFingerprint: "51c1dfd3e7dd4abd38f05d834f05d05d542d92c85a066dce3952bffa9608632f",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Wren asks to test her purple potion, one pot steps toward the gate, and the problem grows into a garden-wide escape. Every prompt now names a concrete action; grabbing a pot causes the others to scatter, while the corrected recipe, Fern's quiet song, careful counting and locking the potion away produce distinct consequences. All 23 pages have exact-text Leda narration and page-true Moonwood art.",
    targetGoal: "Fern and Wren must stop the potion-powered walking plants, return the garden safely and decide whether one harmless pot may keep its legs.",
    rewriteActions: [
      "Every prompt now identifies the real book, potion, catch, follow, song, count or lock decision.",
      "The failed catch explicitly scatters the remaining pots and motivates the calmer recipe and song solutions.",
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved recipe-page anatomy, Moonwood character models and the replacement silly-garden ending with exactly one two-legged pot."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 604,
      pageNodes: 23,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 23,
      images: 23,
      imageTextMatches: 23,
      method: "All active page images were checked against the locked manuscript; p09_silly_garden was replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 23,
      exactTextMappings: 23,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mw_ra_c_03_luna_burrow_star_shell_door",
    sourceFingerprint: "3fc762f24a3be2deaf575fda956e3785e9772ee0a7f4bf5d395fecabdbe20553",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. Luna and Burrow must open the star-shell door before moonset. The shell song, glowing map, kind-hands rule and star-fish line now supply reusable clues; the false star cracks as a genuine failed attempt; hiding it delays the door while returning it restores the kind path; and the former disconnected star-fish ending now points back to the round door. All 25 pages have page-true Moonwood art and exact-text Leda narration.",
    targetGoal: "Luna and Burrow must use the star-shell map to open the hidden door before moonset seals it for another night.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved Luna, Burrow, Pip and Wren models, full-moon night palette, star-shell markings, map, cracked-star state and round-door continuity."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 620,
      pageNodes: 25,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 25,
      images: 25,
      imageTextMatches: 25,
      method: "All 25 active Moonwood illustrations were individually checked against the locked manuscript and route state; the sorry-page text was corrected to match Luna's visible presence."
    }),
    audioEvidence: Object.freeze({
      pages: 25,
      exactTextMappings: 25,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mw_ra_c_04_dewdrop_flint_lost_glow",
    sourceFingerprint: "7adee8393b95f2123d9b5150881e8cee57f58035423613b3dc95cec4e151cdb3",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. Dewdrop and Flint must restore Crystal Stream's missing glow before Moonwood paths go dark. Water rings, gold traces, warm air, Fern's leaf veins and a gold-dusted moth now form one clue language; Flint's drowned lantern is a genuine failed attempt; and story, apology or choice routes all restore the stream and paths. All 28 active scenes use the same blue water-spirit Dewdrop model and exact-text Leda narration.",
    targetGoal: "Dewdrop and Flint must restore the stream's hidden glow before the Moonwood paths go dark.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved blue water-spirit Dewdrop, red-haired explorer Flint, active Wren/Fern/Stone models, lantern state, water level, gold-glow intensity and Moonwood night palette."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 792,
      pageNodes: 28,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 28,
      images: 28,
      imageTextMatches: 28,
      method: "All 28 active illustrations were individually checked against the locked manuscript; the active set consistently uses Dewdrop's blue water-spirit model and one contour language."
    }),
    audioEvidence: Object.freeze({
      pages: 28,
      exactTextMappings: 28,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "dp_ra_b_01_chompy_big_lunch_hunt",
    sourceFingerprint: "f427de980860ff6d0827e0026ffdc01636c987bd479b014594c80c2120df7786",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Hungry Chompy plans a picnic for every friend. His one-food berry plan fails when it neither fills him nor suits Grumpy, so he asks what friends like and gathers berries, fruit, melon and leaves. Every branch now produces a varied shared lunch, with 21 exact-text Leda clips and page-true Dino Pals art. All active Bouncy scenes show two canonical green feet above two separate coil springs.",
    targetGoal: "Chompy must gather a fair lunch for every Dino Pal before the picnic begins.",
    rewriteActions: [
      "Chompy's one-food berry plan now visibly fails and motivates asking Grumpy and Sunny what each friend likes.",
      "Every prompt now names a food, friend, location or repair decision with a route-specific consequence.",
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the six approved replacement scenes, Dino Bouncy's exact two-feet/two-springs anatomy, the leaf basket and the route-specific varied food inventory."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 133,
      pageNodes: 21,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 21,
      images: 21,
      imageTextMatches: 21,
      method: "All active page images were checked against the locked manuscript; six Bouncy/picnic scenes were replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 21,
      exactTextMappings: 21,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "dp_ra_b_02_sunnys_rainy_day_rescue",
    sourceFingerprint: "19266d55b7b2bf6f2feaa75472e68fb6c2d93efbd2a8e284d6f35ad591048d08",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Cold rain soaks Grumpy and Dozy, and every branch now keeps Sunny's promise to help both friends active. The wet rock and muddy splash are genuine failed attempts; the cave, leaf roof, apology, Wiggly's help and leaf boat produce clear consequences. All 22 pages have exact-text Leda narration and page-true Dino Pals art, including a replacement ending with all four required friends.",
    targetGoal: "Sunny must help Grumpy and Dozy escape the cold rain and reach a safe, warm ending.",
    rewriteActions: [
      "Both rescue needs remain explicit through every converging route and each ending resolves the storm safely.",
      "Every prompt now names a shelter, apology, helper, boat or weather decision with a visible consequence.",
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved wet-to-dry weather progression, canonical Dino Pals models and the replacement p08_grumpy_laugh_ending with Sunny, Grumpy, Dozy, Wiggly, the dry blue pillow and leaf boat."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 128,
      pageNodes: 22,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 22,
      images: 22,
      imageTextMatches: 22,
      method: "All active page images were checked against the locked manuscript; p08_grumpy_laugh_ending was replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 22,
      exactTextMappings: 22,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "dp_ra_b_03_grumpy_almost_good_day",
    sourceFingerprint: "51b645477e1f8797e0fcc7e4ea317f42855bd0aacde4d321bae4630a39166047",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. Grumpy now pursues one concrete Level B goal: find a cool, quiet place to nap. The stream, stone tower, berry bush, noisy friends and poking twig are connected tests of that goal; ignoring Chompy creates a genuine failed attempt; repairing the tower, moving the twig, sharing the berries or adapting to the stream produces visible consequences; and every route earns a quiet rest. All 29 pages have route-true Dino Pals art and exact-text Leda narration.",
    targetGoal: "Grumpy must find one cool, quiet place to nap; every apparent spot creates a problem that Grumpy must repair or adapt to.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved Grumpy, Chompy, Wiggly, Fancy, Dozy, Sunny and Dino Bouncy models, and keep the stream wetness, rebuilt tower, berry spill, pillow, twig and final resting place consistent with each route."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 77,
      pageNodes: 29,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 29,
      images: 29,
      imageTextMatches: 29,
      method: "All 29 active Dino Pals illustrations were individually checked against the locked manuscript and route state; seven contradictory scenes were replaced and visually inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 29,
      exactTextMappings: 29,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "dp_ra_b_04_bouncy_big_bounce",
    sourceFingerprint: "e49b5f975f88a3af98dc59414580ce2ff0950326b068681ab315675160cd7238",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. Bouncy now pursues one concrete Level B goal: carry the berry basket to the picnic at Big Flat Rock. Berry loss, weak springs, a bent bush, mud, a rattling cave shortcut and a loose pebble are causal delivery setbacks; friends help only after the child's decisions; and all five endings complete the same basket delivery. All 30 pages have route-true Dino Pals art and exact-text Leda narration.",
    targetGoal: "Bouncy must carry a basket of berries to the picnic at Big Flat Rock; every branch is a different route or setback on that delivery.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved Dino Bouncy model with exactly two green three-toed feet above two separate silver coils, keep Wiggly's blue tail visually separate, and track the single basket, berry count, mud, repaired bush, cave position and Big Flat Rock destination exactly."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 70,
      pageNodes: 30,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; all 50 non-terminal choice edges advanced and backtracked correctly in the live child preview."
    }),
    pageEvidence: Object.freeze({
      pages: 30,
      images: 30,
      imageTextMatches: 30,
      method: "All 30 unique pages were opened through their real choice paths in the live child preview; all 30 newly produced illustrations loaded, matched the locked route state and were visually checked at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 30,
      exactTextMappings: 30,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "dp_ra_b_05_shys_snail_shade",
    sourceFingerprint: "ddfc6d52127963ad33b888173ac5130572c38b161931d029aa9dacb2cbe899ae",
    status: "approved",
    reviewer: "Independent Codex review",
    reviewedAt: "2026-08-02",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48 after a fresh independent review. Shy must guide one stranded snail from drying hot sand into Fernwood shade. A smooth leaf tips and a rolling twig startles the snail; rough bark or damp moss then supports four visible layouts, an explicit final-path choice and four distinct shaded resting places. All 15 scenes have route-true Dino Pals art and exact-text Leda narration.",
    targetGoal: "Shy must guide one stranded snail into damp Fernwood shade before the hot sun dries its trail.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt, route or narration-flag change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved mint-green teal-spotted Shy model, single ordinary snail, late-afternoon Fernwood edge, leaf and twig failure states, bark and moss layout distinctions, final path endpoint, and four ending anchors exactly."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 32,
      pageNodes: 15,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; every route has six scenes and one full-beat failure. Two representative complete routes, replay and finish were also exercised in the live child player."
    }),
    pageEvidence: Object.freeze({
      pages: 15,
      images: 15,
      imageTextMatches: 15,
      method: "All 15 production illustrations were independently inspected at 1536 by 864 against the locked manuscript and route state; p05_bark and p06_fern_ending were repaired and accepted on a fresh review pass."
    }),
    audioEvidence: Object.freeze({
      pages: 15,
      exactTextMappings: 15,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "story_quest_short_a_sam_pam_01",
    sourceFingerprint: "e7ee567aa1f77c58cf0733fe4478e877474bbe2eb6daef29bc820c4738547be2",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. Sam and Pam now state and pursue one Early-reader goal: pack the map and bag, then reach the van. Every prompt names the concrete short-a decision, the cat sitting on the map is a genuine setback, both endings complete the trip, all ten illustrations match the page state, and all ten pages have exact-text Leda narration.",
    targetGoal: "Sam and Pam must pack the map and reach the van for their trip, using only the declared short-a and high-frequency-word scope.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved Sam, Pam, Dad and cat models and the exact map, bag, mat, jam and van state shown on each route."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 46,
      pageNodes: 10,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 10,
      images: 10,
      imageTextMatches: 10,
      method: "All ten existing illustrations were individually checked against the locked manuscript and route state; no replacement art was required."
    }),
    audioEvidence: Object.freeze({
      pages: 10,
      exactTextMappings: 10,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mp_ra_a_01_muddy_splashy_missing_hat",
    sourceFingerprint: "3b786089f1ee32675d1a7d50531171f0f20e40e9bbeba2b7485a6aa283ecd820",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Approved at 48/48. The opening now shows and names the wind taking Clucky's red hat; every search choice changes the clue path; the muddy-hat attempt genuinely fails; every ending returns the same red hat or shows Clucky granting Muddy permission to try it; the ambiguous signboard is removed; and all 20 pages have exact-text Leda narration.",
    targetGoal: "Muddy and Splashy must find Clucky's missing hat and return it before the wind carries it away.",
    rewriteActions: [
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved single red hat, Meadow Pals models, mud and water state, and sign-free meeting scene in future media revisions."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 111,
      pageNodes: 20,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 20,
      images: 20,
      imageTextMatches: 20,
      method: "All active page images were checked against the locked manuscript; the opening and meeting page were replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 20,
      exactTextMappings: 20,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mp_ra_a_02_shy_cuddly_quiet_adventure",
    sourceFingerprint: "5084f6430c4e2dc58b209ce7321c407cd50e5fe48ee4cb0ae1ce9e18352fb24f",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Cuddly comes to meet Shy, and every route lets the child protect Shy's pace through a wave, quiet waiting, shared rest, space or an invited hug. All 21 pages now have exact-text Leda narration and page-true art; the faulty crowded wave ending was replaced with a clean Shy-and-Cuddly scene.",
    targetGoal: "Cuddly comes to meet Shy while the child chooses a comfortable way for the friends to spend time together.",
    rewriteActions: [
      "The meeting goal is explicit in the opening and remains active through every route.",
      "Shy's communicated preference is carried into distinct wave, rest, space and hug endings.",
      "No manuscript repair remains open; any future text, prompt or route change must invalidate this fingerprint and trigger a fresh review."
    ],
    illustrationActions: [
      "Preserve the approved two-character wave ending, established Meadow Pals models, readable body language and comfort-level spacing in future media revisions."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 86,
      pageNodes: 21,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 21,
      images: 21,
      imageTextMatches: 21,
      method: "All active page images were checked against the locked manuscript; p08_wave_from_tree was replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 21,
      exactTextMappings: 21,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mp_ra_a_03_bouncy_speedy_fast_map",
    sourceFingerprint: "5e0fae81594b2136aa73f0f843d6cd19d8163cbaab4b6336fde313867da61479",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "Bouncy and Speedy follow Tiny's map past the barn, pond, hill, mouse tracks and big boot to the big tree. Speedy's rush can lose or muddy the map, while waiting, drying it or reading its clues repairs the mistake. All 27 pages now use concrete Level A language, page-true art and exact-text Leda narration.",
    targetGoal: "Bouncy and Speedy must follow Tiny's map to the big tree, overcome the consequences of rushing and discover who made the map.",
    rewriteActions: [
      "The BIG TREE promise is explicit on page one and every barn, pond, hill, track and map clue narrows the route or identifies Tiny.",
      "Speedy's too-fast choice now has a real consequence: the map is lost or muddied and must be caught, dried, retrieved or read carefully.",
      "Every ending confirms that Tiny made the map; no manuscript repair remains open, and future changes must invalidate this fingerprint."
    ],
    illustrationActions: [
      "Preserve the approved Meadow Pals models: yellow woolly Bouncy with four coil-spring legs, black-and-white Speedy with one tail and very small grey Tiny.",
      "Preserve the readable map state, tiny mouse tracks, muddy-map action, mouse signature and open-map ending in future media revisions."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 119,
      pageNodes: 27,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 27,
      images: 27,
      imageTextMatches: 27,
      method: "All 27 unique pages were opened through their real choice paths in Chromium; five misleading or non-canon scenes were replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 27,
      exactTextMappings: 27,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  }),
  Object.freeze({
    id: "mp_ra_a_04_brave_tiny_big_little_rescue",
    sourceFingerprint: "d2f766390bf15e9afa109747a82ba000c269bfebb71cf6a26f1efc24e9b48bc6",
    status: "approved",
    reviewer: "Codex editorial audit",
    reviewedAt: "2026-07-31",
    scores: { character: 4, goal: 4, causality: 4, obstacle: 4, agency: 4, ending: 4, language: 4, voice: 4, delight: 4, canon: 4, illustration: 4, audio: 4 },
    mandatoryViolations: [],
    summary: "The child selects one parade rescue on page one: recover Clucky's hat or Woolly's bell. Every later choice remains inside that selected object state, Brave's pot attempt is a genuine failure, Tiny's size changes the solution, and all endings visibly return the chosen item. All 32 pages use concrete Level A language, page-true art and exact-text Leda narration.",
    targetGoal: "The child chooses one missing parade item—Clucky's hat or Woolly's bell—and Brave and Tiny must return that selected item before the parade begins.",
    rewriteActions: [
      "The opening now names both missing parade items and makes the child's first choice lock the active rescue.",
      "Hat and bell routes remain separated; every clue, action and ending preserves the selected object state.",
      "Brave's stuck-pot and slipped-stone attempts have visible consequences, while Tiny's scale enables string, pot and stone solutions."
    ],
    illustrationActions: [
      "Preserve the approved Meadow scale order: Tiny smallest, Brave small, adult russet Clucky larger and Woolly largest.",
      "The pot scene must contain only the selected red hat; Clucky's feather ending keeps her recovered hat; both bell endings keep exactly one bell on Woolly."
    ],
    routeEvidence: Object.freeze({
      completeRoutes: 102,
      pageNodes: 32,
      method: "Exhaustive finite graph traversal excluding Read again replay edges; Story Quest integrity gate passed."
    }),
    pageEvidence: Object.freeze({
      pages: 32,
      images: 32,
      imageTextMatches: 32,
      method: "All 32 unique pages were opened through their real choice paths in Chromium; the mixed-object pot scene and two false endings were replaced and inspected at 1536 by 864."
    }),
    audioEvidence: Object.freeze({
      pages: 32,
      exactTextMappings: 32,
      voice: "en-US-Chirp3-HD-Leda",
      format: "MP3 128 kbps from 24 kHz LINEAR16 source"
    })
  })
]);

const currentStoryQuestReviewState = Object.freeze({
  mw_ra_c_01_pip_stone_loud_thing: Object.freeze({ fingerprint: "3ca1e261d3514b07bbc9c3c0871730df35c3784e7317048ad3b372565304d1e2", pages: 24, routes: 1329, exactAudio: 24, pendingAudio: 0, listeningPending: 24 }),
  mw_ra_c_02_fern_wren_walking_garden: Object.freeze({ fingerprint: "144f7b9b35fafc89393a948f065d2c29cefa6873aff4b87c7f8a17e3aa6f4d47", pages: 23, routes: 604, exactAudio: 23, pendingAudio: 0, listeningPending: 23 }),
  mw_ra_c_03_luna_burrow_star_shell_door: Object.freeze({ fingerprint: "e263fcc406e888e67ab4b4cebb6002165c1887327a053490a1bcfd373e39b8ec", pages: 27, routes: 616, exactAudio: 27, pendingAudio: 0, listeningPending: 27 }),
  mw_ra_c_04_dewdrop_flint_lost_glow: Object.freeze({ fingerprint: "90927ae348e824bf8e35c0b8c5338dd7559b6d53c643aa0956002bfde83b18c0", pages: 30, routes: 532, exactAudio: 30, pendingAudio: 0, listeningPending: 30 }),
  dp_ra_b_01_chompy_big_lunch_hunt: Object.freeze({ fingerprint: "584e11d86320470ea5555878e35e113c7e2c54a8e71ff5b2a7e4bac785f02865", pages: 21, routes: 133, exactAudio: 21, pendingAudio: 0, listeningPending: 21 }),
  dp_ra_b_02_sunnys_rainy_day_rescue: Object.freeze({ fingerprint: "ed375081d2bb7e04bc9e7126ac811faa2b97a461b6251942bb4c151304bf0e11", pages: 22, routes: 108, exactAudio: 22, pendingAudio: 0, listeningPending: 22 }),
  dp_ra_b_03_grumpy_almost_good_day: Object.freeze({ fingerprint: "7b1bbfc866c73ba856d817928a3a055e68776565e1926b26fcc01eef98c40b87", pages: 34, routes: 69, exactAudio: 34, pendingAudio: 0, listeningPending: 34 }),
  dp_ra_b_04_bouncy_big_bounce: Object.freeze({ fingerprint: "501ca57be053c103798f5858ae601a6474f77b414848cf48605cda5a7e35f03e", pages: 35, routes: 67, exactAudio: 35, pendingAudio: 0, listeningPending: 35 }),
  dp_ra_b_05_shys_snail_shade: Object.freeze({ fingerprint: "ddfc6d52127963ad33b888173ac5130572c38b161931d029aa9dacb2cbe899ae", pages: 15, routes: 32, exactAudio: 15, pendingAudio: 0, listeningPending: 0 }),
  story_quest_short_a_sam_pam_01: Object.freeze({ fingerprint: "0503d141d5d6d290f74332460f67b6cb4e3d7f3cdc4082d9c76121b9503c0e3f", pages: 10, routes: 46, exactAudio: 10, pendingAudio: 0, listeningPending: 10 }),
  mp_ra_a_01_muddy_splashy_missing_hat: Object.freeze({ fingerprint: "811df839e077ff5940a1b36bdd8c5deffb509f1bcf74fbe780f79316cf62f077", pages: 20, routes: 106, exactAudio: 20, pendingAudio: 0, listeningPending: 20 }),
  mp_ra_a_02_shy_cuddly_quiet_adventure: Object.freeze({ fingerprint: "419bff52e2b80226b257aaa5c69ece61231fbefbf093a2e1c38d739f07c6ec69", pages: 21, routes: 86, exactAudio: 21, pendingAudio: 0, listeningPending: 21 }),
  mp_ra_a_03_bouncy_speedy_fast_map: Object.freeze({ fingerprint: "6cfbce5b087db0a21865a2983b05f20abd8117ecd2dd4aeed11cc6dbfdf38ae0", pages: 27, routes: 119, exactAudio: 27, pendingAudio: 0, listeningPending: 27 }),
  mp_ra_a_04_brave_tiny_big_little_rescue: Object.freeze({ fingerprint: "8da25d0cdf0d838d3c013234fc3f924a98a988daf4519686cc5506b5e21bc68e", pages: 32, routes: 102, exactAudio: 32, pendingAudio: 0, listeningPending: 32 })
});

export const storyQuestPolicyReviews = Object.freeze(
  historicalStoryQuestPolicyReviews.map(review => {
    const current = currentStoryQuestReviewState[review.id];
    if (!current) return review;

    const audioReady = current.pendingAudio === 0 && current.listeningPending === 0;
    const audioViolation = current.pendingAudio > 0
      ? `audio-truth: ${current.pendingAudio} page narrations still require exact-text generation.`
      : `audio-truth: ${current.listeningPending} exact-current-text Leda page narrations still require human listening validation.`;
    return Object.freeze({
      ...review,
      sourceFingerprint: current.fingerprint,
      status: audioReady ? "approved" : "audited-fail",
      reviewedAt: "2026-08-05",
      scores: Object.freeze({
        ...review.scores,
        audio: audioReady ? 4 : 0
      }),
      mandatoryViolations: audioReady
        ? Object.freeze([])
        : Object.freeze([
            audioViolation
          ]),
      summary: audioReady
        ? `The current manuscript, branching graph, and strict visual audit pass for all ${current.pages} active pages across ${current.routes.toLocaleString("en-US")} finite routes. All ${current.exactAudio} pages resolve to exact-current-text Leda narration, so the current review remains approved.`
        : `The current manuscript, branching graph, and strict visual audit pass for all ${current.pages} active pages across ${current.routes.toLocaleString("en-US")} finite routes. Exact-current-text Leda narration is available for all ${current.exactAudio} pages; release approval is withheld until the remaining ${current.listeningPending} clips pass human listening validation.`,
      routeEvidence: Object.freeze({
        completeRoutes: current.routes,
        pageNodes: current.pages,
        method: "Exhaustive finite graph traversal excluding Read again replay edges; current Story Quest integrity gate passed."
      }),
      pageEvidence: Object.freeze({
        pages: current.pages,
        images: current.pages,
        imageTextMatches: current.pages,
        method: "Every current page image was included in the 2026-08-05 strict text, route-state, anatomy, continuity, and visual-style audit."
      }),
      audioEvidence: Object.freeze({
        pages: current.pages,
        exactTextMappings: current.exactAudio,
        pendingExactTextMappings: current.pendingAudio,
        pendingListeningValidation: current.listeningPending,
        voice: "en-US-Chirp3-HD-Leda",
        format: "MP3 128 kbps from 24 kHz LINEAR16 source"
      })
    });
  })
);

export const storyContentReviewRegistry = Object.freeze({
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  guidedReadingBaseline: guidedReadingPolicyBaseline,
  storyQuests: storyQuestPolicyReviews,
  futureFormats: Object.freeze({
    animation: "No active items registered",
    poem: "No active items registered",
    song: "No active items registered",
    audioStory: "No active items registered",
    comic: "No active items registered",
    play: "No active items registered"
  })
});
