export const PRESS_CONTENT_REVIEW = Object.freeze({
  version: 1,
  reviewedAt: "2026-08-09",
  status: "approved",
  checks: Object.freeze({
    noChildCapture: true,
    noPublicSharing: true,
    noGeneratedProse: true,
    noUnrestrictedImages: true,
    narrativeCausality: true,
    culturalAndStereotypeReview: true,
    assetAltTextComplete: true
  }),
  note: "V1 uses text and locally approved non-child sticker scenes only. Camera, uploads, free drawing storage, narration recording, comments, likes, and public profiles are excluded."
});
