// Source authority for assessment scene art. Every file under
// public/images/assessment/scenes must match exactly one decision below.
//
// The legacy comprehension illustrations were reviewed visually in the
// 2026-08-13 validity audit. They often reveal the answer to a text-first
// inference/cause/theme question, so they are not scoring evidence. They may
// only be considered later for post-answer explanation or teacher materials.
export const LEGACY_ASSESSMENT_SCENE_DECISIONS = Object.freeze([
  {
    prefix: "cause_effect-",
    mediaRole: "rejected-as-scoring",
    allowedUse: "post-answer-only",
    reason: "depicts the causal outcome or cause that the item asks the child to infer"
  },
  {
    prefix: "context_clues-",
    mediaRole: "rejected-as-scoring",
    allowedUse: "post-answer-only",
    reason: "depicts the target meaning and turns contextual reading into picture naming"
  },
  {
    prefix: "inference-",
    mediaRole: "rejected-as-scoring",
    allowedUse: "post-answer-only",
    reason: "depicts the inferred feeling, location, event, or explanation"
  },
  {
    prefix: "theme_higher_comprehension-",
    mediaRole: "rejected-as-scoring",
    allowedUse: "post-answer-only",
    reason: "depicts plot or moral cues that shortcut theme construction"
  }
]);

const approvedScoringScene = itemId => Object.freeze({
  itemId,
  visualReview: "approved-clean-cartoon",
  alignmentReview: "approved-exact-scoring-evidence",
  reviewedAt: "2026-08-13",
  styleProfile: Object.freeze({
    bright: true,
    bold: true,
    flat2d: true,
    crispOutlines: true,
    smoothSurfaces: true,
    canvasOrPaperGrain: false,
    embossedOrBevelledEdges: false,
    grittyOrFauxPaintTexture: false,
    photorealOrCinematicFinish: false
  }),
  renderingPolicy: "docs/content/QUESTION_DESIGN_BIBLE.md#9-media-and-accessibility-rules"
});

export const SENTENCE_COMPREHENSION_SCORING_SCENES = Object.freeze({
  "scene-girl-jumps-puddle.webp": approvedScoringScene("lp3.sentence_comprehension.l1.A.picture_match.v1"),
  "scene-boys-ladder-bakery.webp": approvedScoringScene("lp3.sentence_comprehension.l1.B.picture_match.v2"),
  "scene-cat-umbrella.webp": approvedScoringScene("lp3.sentence_comprehension.l1.C.picture_match.v3"),
  "scene-grandad-child-red-kite.webp": approvedScoringScene("lp3.sentence_comprehension.l1.A.picture_match.v4"),
  "scene-red-sock-falling.webp": approvedScoringScene("lp3.sentence_comprehension.l1.B.picture_match.v5"),
  "scene-ducks-ice-cream-van.webp": approvedScoringScene("lp3.sentence_comprehension.l1.C.picture_match.v6"),
  "scene-boy-giant-jelly.webp": approvedScoringScene("lp3.sentence_comprehension.l1.A.picture_match.v7"),
  "scene-snowman-sunglasses.webp": approvedScoringScene("lp3.sentence_comprehension.l1.B.picture_match.v8"),
  "scene-small-dog-leads-tall-man.webp": approvedScoringScene("lp3.sentence_comprehension.l1.R.picture_match.v9r"),
  "scene-family-asleep-film.webp": approvedScoringScene("lp3.sentence_comprehension.l1.R.picture_match.v10r")
});

export function getAssessmentSceneMediaDecision(relativePath = "") {
  const normalized = String(relativePath).replace(/^sentence-comprehension\//, "");
  const scoringDecision = SENTENCE_COMPREHENSION_SCORING_SCENES[normalized];
  if (String(relativePath).startsWith("sentence-comprehension/") && scoringDecision) {
    return {
      mediaRole: "scoring-evidence",
      allowedUse: "assessment-stimulus",
      ...scoringDecision,
      reason: "controlled picture-to-sentence evidence with visually balanced distractors"
    };
  }
  const matches = LEGACY_ASSESSMENT_SCENE_DECISIONS.filter(decision => normalized.startsWith(decision.prefix));
  return matches.length === 1 ? matches[0] : null;
}
