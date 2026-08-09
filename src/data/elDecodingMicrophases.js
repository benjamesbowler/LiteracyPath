/**
 * Named decoding bands and cycle anchors from the supplied overview.
 *
 * This small, content-free definition module is shared by the benchmark and
 * the signed-in shell. Keeping it separate prevents the complete assessment
 * bank from being downloaded merely to label a child's saved placement.
 * The early-full entry has no exact cycle in the overview, so its anchor stays
 * null rather than inventing a value.
 */
export const EL_DECODING_MICROPHASES = Object.freeze([
  Object.freeze({
    id: "middle_pre", label: "Middle Pre", anchorCycle: 1, rangeNote: "Cycle 1 anchor",
    constructFocus: "VC and simplest transparent CVC baseline",
    progressionBasis: "LiteracyPath-authored construct sequence; the cycle value is a comparison anchor, not an assessed exact cycle."
  }),
  Object.freeze({
    id: "early_partial", label: "Early Partial", anchorCycle: 15, rangeNote: "Cycle 15 anchor",
    constructFocus: "Transparent one-to-one short-vowel CVC words",
    progressionBasis: "Uses only common single-letter consonant and short-vowel correspondences before spelling-pattern complexity is introduced."
  }),
  Object.freeze({
    id: "middle_partial", label: "Middle Partial", anchorCycle: 25, rangeNote: "Cycle 25 anchor",
    constructFocus: "Short-vowel closed words with final spelling or multiphoneme complexity",
    progressionBasis: "Retains short vowels while adding final ck, doubled final consonants, x, and qu after the transparent Early Partial band."
  }),
  Object.freeze({
    id: "late_partial", label: "Late Partial", anchorCycle: 26, rangeNote: "Cycle 26 anchor",
    constructFocus: "Digraphs and simple initial or final blends",
    progressionBasis: "Adds common consonant digraphs and two-consonant blends after closed-word spelling complexity."
  }),
  Object.freeze({
    id: "early_full", label: "Early Full", anchorCycle: null, rangeNote: "Grade 1 early-full range entry; no single cycle specified",
    constructFocus: "Digraphs combined with final clusters and denser consonant blends",
    progressionBasis: "Combines previously sampled consonant patterns within the same word; no exact cycle is inferred."
  }),
  Object.freeze({
    id: "middle_full", label: "Middle Full", anchorCycle: 39, rangeNote: "Cycle 39 anchor",
    constructFocus: "Common silent-e and vowel-team patterns",
    progressionBasis: "Moves from short-vowel closed words to common long-vowel spellings."
  }),
  Object.freeze({
    id: "late_full", label: "Late Full", anchorCycle: 50, rangeNote: "Cycle 50 anchor",
    constructFocus: "R-controlled vowels, diphthongs, and complex vowel teams",
    progressionBasis: "Adds less transparent vowel patterns after common long-vowel spellings."
  }),
  Object.freeze({
    id: "early_consolidated", label: "Early Consolidated", anchorCycle: 51, rangeNote: "Cycle 51 anchor",
    constructFocus: "Compounds, two-syllable words, and transparent inflections",
    progressionBasis: "Extends established sound-spelling patterns across syllable boundaries."
  }),
  Object.freeze({
    id: "middle_consolidated", label: "Middle Consolidated", anchorCycle: 61, rangeNote: "Cycle 61 anchor",
    constructFocus: "Common prefixes, suffixes, and inflected bases",
    progressionBasis: "Adds productive morphology to familiar base-word patterns."
  }),
  Object.freeze({
    id: "late_consolidated", label: "Late Consolidated", anchorCycle: 75, rangeNote: "Cycle 75 anchor",
    constructFocus: "Longer multisyllable words with derivational morphology",
    progressionBasis: "Combines affixes, syllable analysis, and less transparent derived forms at the documented ceiling."
  })
]);
