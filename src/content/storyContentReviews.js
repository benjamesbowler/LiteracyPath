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
  authorityFingerprint: "a2642bd1f93c4b88fb4d510d50b6167761c7aeb63a5ca9ba3cc5cfeb3e15f866"
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
  itemCount: 226,
  sourceFingerprint: "1c2043e8c1df038b31b16e42cfd738d111660e2bea934e8d82fea4cb5f9b074f",
  contentStatus: "approved",
  releaseStatus: GUIDED_READING_RELEASE_READINESS.status,
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  reviewedAt: "2026-09-22",
  reviewer: "Editorial and source review",
  claim: "All 226 books and 2,019 pages have current manuscript, visual-file, exact-text narration, and provenance evidence. The 20 Willow Street books contain 160 compact pages and 180 directly reviewed self-created images. Direct human listening is not recorded for the 160 Willow Street page clips; acceptance follows continuous QA and does not claim those clips have been listened to. Reported defects, quarantine, and media-integrity failures remain blocking."
});

// Additive shared-story reviews do not refresh or approve changes to the
// existing graded corpus. Audio truth remains enforced by its separate gate.
export const guidedReadingSharedStoryReviews = Object.freeze([Object.freeze({
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
    "sourceFingerprint": "d819a698434b27e3b8608860bc1bcb59764ce70cbf526c5a5fdca5926d1bca0a",
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
    "sourceFingerprint": "e2d09a428f0a3eda076c704fd9bc0d9225e63401f78ba5b613ebe2d92f50698f",
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
    "sourceFingerprint": "648522187208866b23dbc799dc937a178b1b9aedad286356f23291f0cf7e0a25",
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
    "sourceFingerprint": "b4f5c5dea545163a933efc01e45a36bce3a75a721851a7d4b2ddee9838c950a5",
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
    "sourceFingerprint": "40b6f5e0fbc548df4da23666c2b1efb3806479a284081d161ec543820ad66c16",
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
    "sourceFingerprint": "333b07148c3397ac5d2aac17e3e24c8326e358ac2a99db4723e673f51446e7a3",
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
    "sourceFingerprint": "d9a60e33d0ced7294aa1b21a18fa980d168fa80e5e2f71812c196d49f127ce49",
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
    "sourceFingerprint": "d05feb164f1648147121f08b3cd5ac2748e70c8e58a3d13684d9069689b187f0",
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
    "sourceFingerprint": "6567045ebee7350f2a875c67a64d3f0e7153ed2ce88c7104d9b9da3c10e6652a",
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
    "sourceFingerprint": "5b079c76807830f5066062ee703a91d60abb077ba9c4e822713a06c8a7522773",
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
    "sourceFingerprint": "b65ca12b6e9e46dae6d8a466ee4ef78941606e1ce085b86cc3369e68ae360a65",
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
    "sourceFingerprint": "9958eabc043f85532ba25a42fb5ca7d757f21162a914494199ce1abad5875535",
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
    "sourceFingerprint": "65d64331fa23f9aa18dde797b9633a1adcd8835c1b0d0a2d03ae23a44a473a82",
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
    "sourceFingerprint": "9a7d996dd1f2356764ac5d358524daf2d80ce28a29d7edfe3f99a6bbf555cc8f",
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

export const storyContentReviewRegistry = Object.freeze({
  policyVersion: STORY_CONTENT_POLICY_VERSION,
  guidedReadingBaseline: guidedReadingPolicyBaseline,
  guidedReadingSharedStories: guidedReadingSharedStoryReviews,
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
