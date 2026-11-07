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
  itemCount: 395,
  sourceFingerprint: "2f9af123064017d88af2ba7e8018ba73d88d73cbc12b521a8f3f52b86016bf9f",
  contentStatus: "approved",
  releaseStatus: GUIDED_READING_RELEASE_READINESS.status,
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  reviewedAt: "2026-11-07",
  integrationReview: "The catalogue contains 397 runtime books and 3,501 pages. World Discovery contains 100 independently reviewed full manuscripts, twenty per public App level A–E, with 880 story pages and 100 covers. The second fifty-book cohort adds distinct directions within the ten established strands. Its exact text, scene states, factual sources, public-level rationales and complete-book scorecards are in src/content/world-discovery/cohorts/11-20; independent visual records and automated narration screening are in source-art/world-discovery/cohorts/11-20. The original fifty-book source/media fixture remains unchanged. Current-byte visual and narration gates enforce readiness separately; automated recognition and signal checks are not human listening. No classroom or physical-device observation is claimed.",
  reviewer: "Editorial and source review",
  claim: "All 395 graded books and 3,477 pages received complete manuscript review. The original 226 graded books received nine page-line corrections and one title correction. Small Steps adds 20 cumulative decodables; Next Steps adds 30 more with exact cumulative pronunciation, word-shape and exception evidence. Bright Ideas adds 19 graded leveled books; its additional shared H book and the existing Missing Sandwich book retain separate exact manuscript contracts. World Discovery adds 100 predictable/levelled books across identity, relationships, community, fantasy, geography, space, animals, life cycles, classification and caring for our world; it makes no cumulative decoding claim. The collections distinguish phonics practice from broader leveled and supported reading. Current illustrations and ordered sequences are enforced by their separate hash-locked visual gate; this text baseline cannot clear a media defect. Exact narration provenance and automated recognition screening remain distinct from human listening. No classroom outcome, publisher-level equivalence or direct human-listening observation is claimed. Reported defects, quarantine and media-integrity failures remain blocking."
});

// Additive shared-story reviews do not refresh or approve changes to the
// existing graded corpus. Audio truth remains enforced by its separate gate.
export const guidedReadingSharedStoryReviews = Object.freeze([Object.freeze({
  "bookId": "bright-ideas-20",
  "contentStatus": "approved",
  "manuscriptSha256": "33e71ec8d18e20aaad74f608e1c060407f87da3ed38ac3c390e6676930973cbc",
  "expectedPages": 12,
  "readingPlacement": "App H; shared reading for interest ages 5–9; no independent decoding level",
  "reviewEvidence": "Complete twelve-page frozen manuscript, science claims and teaching routine independently reviewed. The shared reading contract preserves the exact text, supported placement and Leda narration. Media acceptance is recorded separately in the final expansion review."
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
    "sourceFingerprint": "6aa4924b719c11b2473e293f78a3a11053702f53503791eb6503fa9856ac8046",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 13,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 13,
      "images": 13,
      "imageTextMatches": 13,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 13,
      "exactTextMappings": 13,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 13,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mw_ra_c_02_fern_wren_walking_garden",
    "sourceFingerprint": "d76304f6f53fb2df3114b9c2365d9b84c63d8b3288f323c227b5b2aff0187a48",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 15,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 15,
      "images": 15,
      "imageTextMatches": 15,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 15,
      "exactTextMappings": 15,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 15,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mw_ra_c_03_luna_burrow_star_shell_door",
    "sourceFingerprint": "2f9fa1d989469908acfb73b8fd6ee58a50dfa7ac7d68d139eb4ffe8b2812d050",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 13,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 13,
      "images": 13,
      "imageTextMatches": 13,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 13,
      "exactTextMappings": 13,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 13,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mw_ra_c_04_dewdrop_flint_lost_glow",
    "sourceFingerprint": "b8a568aa387db830cf697627ada1471e40028e82ead11c6bdb9c06162e05d555",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 15,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 15,
      "images": 15,
      "imageTextMatches": 15,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 15,
      "exactTextMappings": 15,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 15,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "dp_ra_b_01_chompy_big_lunch_hunt",
    "sourceFingerprint": "e9b9de725b548a7616914cbdb1a257e4284634aa726aee271603664a1ed2f5f0",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 2,
      "pageNodes": 17,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 17,
      "images": 17,
      "imageTextMatches": 17,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 17,
      "exactTextMappings": 17,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 17,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "dp_ra_b_02_sunnys_rainy_day_rescue",
    "sourceFingerprint": "4dfd0a0d1b33719254ac49328fdcb62309f3c74e23f0e374c476d3599158b14f",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 14,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 14,
      "images": 14,
      "imageTextMatches": 14,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 14,
      "exactTextMappings": 14,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 14,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "dp_ra_b_03_grumpy_almost_good_day",
    "sourceFingerprint": "8e812a6e4bff39463aa258897d4af8c9142f22147e62cddfc11d8348aaabb9b9",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 5,
      "pageNodes": 21,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 21,
      "images": 21,
      "imageTextMatches": 21,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 21,
      "exactTextMappings": 21,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 21,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "dp_ra_b_04_bouncy_big_bounce",
    "sourceFingerprint": "261beac03cd5873d0c3438fc79e1d53f525deb4ae65a1bba719cc29b6466cc00",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 3,
      "pageNodes": 19,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 19,
      "images": 19,
      "imageTextMatches": 19,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 19,
      "exactTextMappings": 19,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 19,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "dp_ra_b_05_shys_snail_shade",
    "sourceFingerprint": "eaa40c95cc1bdf315390fb4f655f38c579e4cec3b8980c951a1c989db8b315d6",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 12,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 12,
      "images": 12,
      "imageTextMatches": 12,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 12,
      "exactTextMappings": 12,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 12,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "story_quest_short_a_sam_pam_01",
    "sourceFingerprint": "a4720f15e0277dadb1e8ed004052c68d4a605fdf19d5d333bf74166b653a9cf3",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 9,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 9,
      "images": 9,
      "imageTextMatches": 9,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 9,
      "exactTextMappings": 9,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 9,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mp_ra_a_01_muddy_splashy_missing_hat",
    "sourceFingerprint": "b07645a03ca3ab818706ac9b91cadeaa7c0af028c1a983a78feb25dcd78ef176",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 12,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 12,
      "images": 12,
      "imageTextMatches": 12,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 12,
      "exactTextMappings": 12,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 12,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mp_ra_a_02_shy_cuddly_quiet_adventure",
    "sourceFingerprint": "d3c3e051e3d07120085a76895a218bfe09df5246d626c5b35d647150a60844a7",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 2,
      "pageNodes": 7,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 7,
      "images": 7,
      "imageTextMatches": 7,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 7,
      "exactTextMappings": 7,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 7,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mp_ra_a_03_bouncy_speedy_fast_map",
    "sourceFingerprint": "a28624a82ef19b621272a551866b37fb9980c73f884e3d8504141e91a99465d8",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 11,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 11,
      "images": 11,
      "imageTextMatches": 11,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 11,
      "exactTextMappings": 11,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 11,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
    }
  },
  {
    "id": "mp_ra_a_04_brave_tiny_big_little_rescue",
    "sourceFingerprint": "dc4beb010e7b59febba384fddc87e69d0089f6935c61e44e925ee6ef196728a5",
    "status": "approved",
    "reviewer": "Codex editorial and direct visual review",
    "reviewedAt": "2026-09-30",
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
      "Natural compact prose, explicit Next links, story-specific replay and independently audible invitations/decisions replace repetitive forced questions."
    ],
    "illustrationActions": [
      "Current scene art and dedicated cover inspected against final prose, anatomy, recurring props and incoming route state; exact accepted bytes are locked by cache identity and the scoped app visual review."
    ],
    "routeEvidence": {
      "completeRoutes": 4,
      "pageNodes": 12,
      "method": "Exhaustive finite graph and browser traversal of all 52 current routes; replay edges excluded."
    },
    "pageEvidence": {
      "pages": 12,
      "images": 12,
      "imageTextMatches": 12,
      "method": "Every current image directly inspected against the revised scene; corrected images reviewed again and final hashes recorded. Original 340-page dispositions consolidate to 190 active scenes and 150 retired."
    },
    "audioEvidence": {
      "pages": 12,
      "exactTextMappings": 12,
      "pendingExactTextMappings": 0,
      "pendingListeningValidation": 12,
      "voice": "en-US-Chirp3-HD-Leda",
      "format": "MP3 128 kbps from 24 kHz LINEAR16 source",
      "provenance": "src/content/storyQuestNarrationManifest.generated.json",
      "method": "914 current clips hash-checked and fully decoded; independent unprompted local recognition screening prompted 26 clearer takes. Recognition ambiguity is recorded separately from confirmed defects.",
      "limitation": "No direct human listening, classroom or physical-device observation is claimed. Acceptance follows continuous QA pass-by-exception."
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
