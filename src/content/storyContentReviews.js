import { STORY_CONTENT_POLICY_VERSION } from "./storyContentPolicy.js";
import { WILLOW_STREET_BOOK_MANIFEST } from "../data/guidedReadingBridgeBooks.manifest.js";
import { MISSING_SANDWICH_BOOK_ID, MISSING_SANDWICH_MANUSCRIPT_SHA256 } from "../data/meadowPalsScienceBooks.js";

export const GUIDED_READING_RELEASE_READINESS = Object.freeze({
  status: "accepted",
  reviewMode: "continuous-pass-by-exception",
  bookIds: Object.freeze(WILLOW_STREET_BOOK_MANIFEST.map(book => book.id)),
  blockedBooks: Object.freeze([]),
  expectedImages: 180,
  reviewedImages: 180,
  expectedNarrationPages: 160,
  exactNarrationPages: 160,
  humanListeningPendingPages: 160,
  visualReview: "docs/guided-reading/willow-street-visual-review.json",
  reason: "Willow Street images, original-detail visual reviews, exact-current-text narration files, and provenance checks are complete. Direct human listening is not recorded for 160 page clips; under continuous QA, missing listening metadata alone does not block release. Reported defects, quarantine, and media-integrity failures remain blocking.",
  authorityFingerprint: "e3ba7ec6e57ba0fa679c266de5085230822a91bf02c875f70b222ff12a8e61fe"
});

const GUIDED_READING_RELEASE_BLOCK_BY_ID = new Map(
  GUIDED_READING_RELEASE_READINESS.blockedBooks.map(id => [id, GUIDED_READING_RELEASE_READINESS])
);

export function getGuidedReadingReleaseBlock(bookOrId) {
  const id = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return GUIDED_READING_RELEASE_BLOCK_BY_ID.get(id) || null;
}

export function classifyGuidedReadingMediaFinding(bookOrId, finding) {
  return getGuidedReadingReleaseBlock(bookOrId)
    ? { error: null, releaseBlock: finding }
    : { error: finding, releaseBlock: null };
}

export const guidedReadingPolicyBaseline = Object.freeze({
  format: "guided-reading-book",
  itemCount: 445,
  sourceFingerprint: "802992d7a9bcdd397c14d63cf6277cca3bbb39803c47866657d2a02822eb4b1d",
  contentStatus: "approved",
  releaseStatus: GUIDED_READING_RELEASE_READINESS.status,
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  reviewedAt: "2026-11-22",
  suitabilityReview: "The 22 November audit read all 447 books and 3,941 pages against the A–H rubric and screened all 4,388 cover and page positions in sequence. It revised 269 book pages for concrete ESL wording, factual clarity and narrative continuity, repaired eight illustrations and moved Which Way Is North? from App level C to D. The separate Cycle Shorts review covered all 27 passages, pictures and questions. Current speech signal, automated recognition, runtime and image checks are recorded independently.",
  integrationReview: "The earlier November 9 review reread the complete 397-book, 3,501-page runtime catalogue and inspected its ordered illustrations for concrete ESL wording, causal and character continuity, literal image support, anatomy, counts and factual accuracy. Authored text, teaching prompts and stale level rationales were repaired without changing assigned A–H levels. The user explicitly authorized repairs to both original World Discovery cohorts; versioned November 9 registrations retain the original release fixture and audio evidence as immutable history. That full-book review and repair provenance remains in source-art/guided-reading-remediation/2026-11-09 and source-art/world-discovery/remediation/2026-11-09. The separate additive nonfiction review covers fifty new A–E books and 440 pages, their teaching prompts, factual sources, all 490 final illustrations, fifty references and fifty delivery covers. Complete scorecards, independent ordered image reviews and exact automated narration evidence are retained in source-art/world-discovery/cohorts/21-30. The resulting runtime contains 447 books and 3,941 pages; preservation checks retain all earlier books and review rows. The November 10 audit directly reread all447 current manuscripts and replaced five overly narrow or abstract World Discovery topics with People Power, Vehicles That Fly, Gasoline and Electric Cars, Transport Through Time, and Different Countries, Different Places. The five complete replacement manuscripts, oral preparation/discussion, all51 finished illustrations, five references and five delivery cards received separate direct and independent review; exact current-byte narration screening and versioned repair evidence are under source-art/world-discovery/remediation/2026-11-10. Independent public levels are B/C/D/E/D; stable production slots, catalogue membership and all other manuscripts remain unchanged. Historical reading evidence is separated from current-topic progress. Current-byte visual, narration and reader gates enforce readiness separately; automated recognition and signal checks are not human listening. No classroom or physical-device observation is claimed. The November 11 transport repair structurally rewrites only Transport Through Time around power and carrying purposes across past, present and tested future vehicles. Its exact202word manuscript, independent E calibration, complete41/48 editorial scorecard, twelve native reference/cover/page assets and current512px card have separately bound independent evidence under source-art/world-discovery/remediation/2026-11-11/transport-complete-book-review.json. Current required narration reconciles584 exact screened bindings with1279 historically approved reuses; the52 fresh screening rows retain their raw43/9 reports and do not imply human listening. All446 other runtime books, the other49 cohort manuscripts/reviews and historical media evidence remain exact. The delivery repair addresses an old offline worker serving obsolete images; rendered-reader, PDF and production verification remain separate release checks.",
  reviewer: "Editorial and source review",
  claim: "All 445 graded books and their 3,917 reading pages have current editorial review. The two shared stories have their own exact manuscript contracts. Decodable books retain the tested letter, sound and exception-word prerequisites. The current visual gate pins each image to its scene. The current narration gate binds exact text, voice and file identity. Automated signal, recognition and browser checks establish their named evidence. Teacher observation and classroom outcomes are separate."
});

// Additive shared-story reviews do not refresh or approve changes to the
// existing graded corpus. Audio truth remains enforced by its separate gate.
export const guidedReadingSharedStoryReviews = Object.freeze([Object.freeze({
  "bookId": "bright-ideas-20",
  "contentStatus": "approved",
  "manuscriptSha256": "670fc3df5f9ac2ae65faf13d75b18784d17b68df53c653233205abaa3927c741",
  "expectedPages": 12,
  "readingPlacement": "App H; shared reading for interest ages 5–9; no independent decoding level",
  "reviewEvidence": "November 9 complete twelve-page reread and ordered image review after concrete ESL repairs to water movement, pipe repair and the separate cable route. The shared reading contract pins this exact revised manuscript and supported placement. Matching Leda narration was decoded and independently transcribed; media acceptance and browser checks remain separately recorded."
}), Object.freeze({
  bookId: MISSING_SANDWICH_BOOK_ID,
  contentStatus: "approved",
  manuscriptSha256: MISSING_SANDWICH_MANUSCRIPT_SHA256,
  expectedPages: 12,
  readingPlacement: "Shared reading for interest ages 5–7; no independent A/B/C decoding claim",
  reviewEvidence: "The approved 411-word storyboard is preserved exactly in twelve pages; all twelve final page images and the cover have current direct visual-review records.",
  visualManifest: "public/guided-reading/science/missing-sandwich/manifest.json",
  narrationManifest: "public/audio/production/en-US/meadow_science/missing-sandwich/manifest.json"
})]);

// Current compact Story Quest editorial and media review. Scores are bounded
// editorial judgments, not child-outcome or human-listening evidence.
export const storyQuestPolicyReviews = Object.freeze([
  {
    "id": "mw_ra_c_01_pip_stone_loud_thing",
    "sourceFingerprint": "f359cd8036dc475324e5472ec791817aa014d4782898552ab906330d3b291c46",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 3,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 3,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Find the hidden source of the enormous croak and help the separated frogs reunite.",
    "summary": "Replaced near-identical forks with two real decisions; visible tracks, quiet listening and stepping stones support the frog reunion.",
    "rewriteActions": [
      "Replaced near-identical forks with two real decisions; visible tracks, quiet listening and stepping stones support the frog reunion.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 13,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 13,
      "images": 13,
      "imageTextMatches": 13,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 13,
      "exactTextMappings": 13,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 13,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mw_ra_c_02_fern_wren_walking_garden",
    "sourceFingerprint": "20b6af54ccbcee0a7dfbb952903395514ba69bf5334c00ab6ace6664f4094389",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 3,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 3,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Restore Fern's drooping plant while controlling Wren's walking-foot potion.",
    "summary": "Established two potion rules before use; green lifts leaves, purple grows feet; water removes feet and one dancer can remain.",
    "rewriteActions": [
      "Established two potion rules before use; green lifts leaves, purple grows feet; water removes feet and one dancer can remain.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 15,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 15,
      "images": 15,
      "imageTextMatches": 15,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 15,
      "exactTextMappings": 15,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 15,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mw_ra_c_03_luna_burrow_star_shell_door",
    "sourceFingerprint": "6093ea84a5a291b6fac3c2a6a933a268a3dfdab6061fc720a38782fb4da87cd2",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 3,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 3,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Follow the map and fit the star shell to open the door, then choose what to explore.",
    "summary": "Kept the folded map and shell through both routes; upside-down insertion fails before both pieces turn and fit.",
    "rewriteActions": [
      "Kept the folded map and shell through both routes; upside-down insertion fails before both pieces turn and fit.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 6,
      "pageNodes": 13,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 13,
      "images": 13,
      "imageTextMatches": 13,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 13,
      "exactTextMappings": 13,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 13,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mw_ra_c_04_dewdrop_flint_lost_glow",
    "sourceFingerprint": "982989af9dac2914f44e76ad7ea73cfad4a36fcda9c7086a3af27ed4ee662651",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 3,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 3,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Find the missing glow and restore light to the stream without forcing it awake.",
    "summary": "Kept the stream, fallen slab and dark lantern state coherent; gentle water and the lever produce visible changes.",
    "rewriteActions": [
      "Kept the stream, fallen slab and dark lantern state coherent; gentle water and the lever produce visible changes.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 15,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 15,
      "images": 15,
      "imageTextMatches": 15,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 15,
      "exactTextMappings": 15,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 15,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "dp_ra_b_01_chompy_big_lunch_hunt",
    "sourceFingerprint": "9045dd6289d30019f147d5752aa71e5ebc27269e4537b842efe72cb684bc8fdf",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Gather picnic food and invite companions who can choose what they enjoy.",
    "summary": "Preserved Grumpy's refusal and practical leaf basket; berry mishaps lead to a specific shared picnic.",
    "rewriteActions": [
      "Preserved Grumpy's refusal and practical leaf basket; berry mishaps lead to a specific shared picnic.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 3,
      "pageNodes": 17,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 17,
      "images": 17,
      "imageTextMatches": 17,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 17,
      "exactTextMappings": 17,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 17,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "dp_ra_b_02_sunnys_rainy_day_rescue",
    "sourceFingerprint": "4bda61144c02f4db3b1cc9831c254362b58d419b35b67141eec20f3f96901255",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Get Grumpy and Dozy dry when rain exposes each shelter's weakness.",
    "summary": "Made shelter failures visible; Dozy's star pillow and Sunny's supported leaf roof remain consistent.",
    "rewriteActions": [
      "Made shelter failures visible; Dozy's star pillow and Sunny's supported leaf roof remain consistent.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 6,
      "pageNodes": 14,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 14,
      "images": 14,
      "imageTextMatches": 14,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 14,
      "exactTextMappings": 14,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 14,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "dp_ra_b_03_grumpy_almost_good_day",
    "sourceFingerprint": "9d0129385972e08565b902609db42020a224a7b661766a224ac2872d10cbd3fa",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Find a cool quiet nap through practical repairs, help or a different resting place.",
    "summary": "Replaced mood-correction language with nap choices; seven stones, twig repair and quiet boundaries stay consistent.",
    "rewriteActions": [
      "Replaced mood-correction language with nap choices; seven stones, twig repair and quiet boundaries stay consistent.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 5 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 5,
      "pageNodes": 21,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 21,
      "images": 21,
      "imageTextMatches": 21,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 21,
      "exactTextMappings": 21,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 21,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "dp_ra_b_04_bouncy_big_bounce",
    "sourceFingerprint": "9e618cb55cd5b86d9bddd0a2caa22d049862500cef8b10d832c7ffdf04517fc6",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Pick and carry berries, changing the bounce and route when berries spill.",
    "summary": "Established two-legged spring anatomy and fixed basket; different bounces change berry loss and cave travel.",
    "rewriteActions": [
      "Established two-legged spring anatomy and fixed basket; different bounces change berry loss and cave travel.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 3 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 3,
      "pageNodes": 19,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 19,
      "images": 19,
      "imageTextMatches": 19,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 19,
      "exactTextMappings": 19,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 19,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "dp_ra_b_05_shys_snail_shade",
    "sourceFingerprint": "03379d21144d9462d62abecd197b424bed9ff194c27bef568e172fa58c7de564",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 4,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 4,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Help a snail reach shade using stable reused bark or a joined damp moss path.",
    "summary": "Removed unsupported snail-sand generalisations; leaf/twig instability, three reused bark pieces and a filled moss gap drive action.",
    "rewriteActions": [
      "Removed unsupported snail-sand generalisations; leaf/twig instability, three reused bark pieces and a filled moss gap drive action.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 12,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 12,
      "images": 12,
      "imageTextMatches": 12,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 12,
      "exactTextMappings": 12,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 12,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "story_quest_short_a_sam_pam_01",
    "sourceFingerprint": "57a5ad15ae48152dc9fe24a73927b4b1e4265fd1f6dd6a30955d20d1f9b8d9a8",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 3,
      "goal": 4,
      "causality": 4,
      "obstacle": 3,
      "agency": 3,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 3,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Move the cat from the map and choose a trip or a picnic at home.",
    "summary": "Declared the short-a track and exception words; kept grammar natural and cat/map/mat/van/bag states coherent.",
    "rewriteActions": [
      "Declared the short-a track and exception words; kept grammar natural and cat/map/mat/van/bag states coherent.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 9,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 9,
      "images": 9,
      "imageTextMatches": 9,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 9,
      "exactTextMappings": 9,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 9,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mp_ra_a_01_muddy_splashy_missing_hat",
    "sourceFingerprint": "a50728aee410a8842cfb06cdb9fc50fdb5bfc4a768f4499131fcacd4cc1914ad",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 3,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 3,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Recover Clucky's red hat and choose who wears it after the muddy surprise.",
    "summary": "Removed forced noun possessives and cosmetic decisions; hat identity, muddy reveal and ending wearer stay consistent.",
    "rewriteActions": [
      "Removed forced noun possessives and cosmetic decisions; hat identity, muddy reveal and ending wearer stay consistent.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 12,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 12,
      "images": 12,
      "imageTextMatches": 12,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 12,
      "exactTextMappings": 12,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 12,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mp_ra_a_02_shy_cuddly_quiet_adventure",
    "sourceFingerprint": "30ded24da0ffaf5dd98d8c7bc151bc56e49b5810316397d5bab6a300541a58e6",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 3,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 3,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Let Shy choose space or a quiet greeting, and have Cuddly respect that choice.",
    "summary": "Preserved quietness as valid; separated requesting space from accepting contact and made the final greeting visible.",
    "rewriteActions": [
      "Preserved quietness as valid; separated requesting space from accepting contact and made the final greeting visible.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 2,
      "pageNodes": 7,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 7,
      "images": 7,
      "imageTextMatches": 7,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 7,
      "exactTextMappings": 7,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 7,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mp_ra_a_03_bouncy_speedy_fast_map",
    "sourceFingerprint": "c915fbd306fff302912c1a718b8887ed6c786fbe1a07dd4bb59d21471184d520",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 3,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 3,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Recover Tiny's wind-blown map and follow its actual landmarks to find him.",
    "summary": "Locked the diagram's barn/pond/oak geometry and authorship; waiting and recovering the map change the route.",
    "rewriteActions": [
      "Locked the diagram's barn/pond/oak geometry and authorship; waiting and recovering the map change the route.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 6 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 11,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 11,
      "images": 11,
      "imageTextMatches": 11,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 11,
      "exactTextMappings": 11,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 11,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  },
  {
    "id": "mp_ra_a_04_brave_tiny_big_little_rescue",
    "sourceFingerprint": "517bbb68a18a1924e79d0049810b63c13768e60a9bfa37f9fe02b2164cdb9773",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-11-22",
    "scores": {
      "character": 4,
      "goal": 4,
      "causality": 4,
      "obstacle": 3,
      "agency": 4,
      "ending": 4,
      "language": 4,
      "voice": 3,
      "delight": 3,
      "canon": 3,
      "illustration": 3,
      "audio": 3
    },
    "mandatoryViolations": [],
    "targetGoal": "Recover Clucky's hat using Brave's effort, Tiny's rope or Woolly's help.",
    "summary": "Separated the rope and Woolly rescue routes; anchored the climb, kept the hat handoffs and two feathers explicit.",
    "rewriteActions": [
      "Separated the rope and Woolly rescue routes; anchored the climb, kept the hat handoffs and two feathers explicit.",
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions.",
      "Added 3 scene encounters with distinct clues or reactions and 2 named endings. Recorded the new prompts, reveals and revised story copy."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review.",
      "Checked 4 illustration targets directly on the active scenes. Preserved the scene artwork and matching route state."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 12,
      "method": "Traversed the finite graph to check every path reaches an authored ending through at least one playable encounter. Replay links excluded."
    },
    "pageEvidence": {
      "pages": 12,
      "images": 12,
      "imageTextMatches": 12,
      "method": "Existing illustrations retained. Revised moments, endings and action targets checked against the active scene art."
    },
    "audioEvidence": {
      "pages": 12,
      "exactTextMappings": 12,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 12,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "Exact production Leda clips for current prose, prompts, choices, action reveals and endings are mapped to the current narration manifest. The catalogue passed hash, decoding and signal checks.",
      "limitation": "The new recordings were machine-checked. No human listening or classroom observation is claimed."
    }
  }
].map(review => Object.freeze(review)));

export const actionSongPolicyReviews = Object.freeze([Object.freeze({
  id: "hop-and-stop",
  format: "song",
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  sourceFingerprint: "72a2409792e77343968c89c33652babe7ca9cb1abe4099e876ed642d205c93f8",
  status: "approved",
  reviewer: "Codex editorial, direct visual and automated media review",
  reviewedAt: "2026-11-02",
  readingPlacement: "Read Together; supported language, without an independent decoding level",
  pageEvidence: Object.freeze({ pages: 8, concept: "Compare hop/stop and up/down; pause for a butterfly, then resume after it clears Speedy's face." }),
  lyricsEvidence: Object.freeze({ lines: 20, performedWordingChecked: true, humanListening: false }),
  gameEvidence: Object.freeze({ rounds: 8, targets: Object.freeze(["hop", "stop", "up", "down"]), scored: false, learnerWrites: false }),
  evidence: "docs/product/HOP_AND_STOP.md"
})]);

export const storyContentReviewRegistry = Object.freeze({
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  guidedReadingBaseline: guidedReadingPolicyBaseline,
  guidedReadingSharedStories: guidedReadingSharedStoryReviews,
  storyQuests: storyQuestPolicyReviews,
  actionSongs: actionSongPolicyReviews,
  futureFormats: Object.freeze({
    animation: "Hop and Stop is registered with its matching action-song unit",
    poem: "No active items registered",
    song: "Registered in actionSongs",
    audioStory: "No active items registered",
    comic: "No active items registered",
    play: "No active items registered"
  })
});
