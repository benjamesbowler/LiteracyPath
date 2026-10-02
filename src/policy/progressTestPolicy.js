export const PROGRESS_TEST_TYPE = "adaptive_progress_test";
export const PROGRESS_TEST_INSTRUMENT = "literacypath_progress";
export const PROGRESS_TEST_POLICY_VERSION = "progress-ordinal-v1";
export const PROGRESS_TEST_TRACKS = Object.freeze([
  { id: "hear_sounds", label: "Hear sounds", suggestion: "Listen for initial sounds, then check with fresh spoken comparisons." },
  { id: "printed_words", label: "Read words and spellings", suggestion: "Check word reading with fresh words; selected answers do not measure oral fluency." },
  { id: "common_words", label: "Recognize common words", suggestion: "Practise the sampled words in fresh contexts, then check recognition again." },
  { id: "word_meaning", label: "Understand words and sentences", suggestion: "Explore the sampled word meanings in talk and examples." },
  { id: "listening_stories", label: "Understand spoken stories", suggestion: "Retell a short spoken story and explain a detail from it." },
  { id: "reading_stories", label: "Read and understand", suggestion: "Read a fresh short text and explain the evidence for an answer." }
].map(Object.freeze));
export const PROGRESS_TEST_PLANS = Object.freeze({
  broad_profile: Object.freeze({ id: "broad_profile", label: "Broad profile", minimumPerTrack: 4, maximumPerTrack: 8, maximumValid: 36, maximumPresentations: 48 }),
  focused: Object.freeze({ id: "focused", label: "Focused check", minimumPerTrack: 10, maximumPerTrack: 16, maximumValid: 16, maximumPresentations: 24 })
});
export function isProgressTest(record = {}) {
  return record.assessmentType === PROGRESS_TEST_TYPE || record.metadata?.instrumentId === PROGRESS_TEST_INSTRUMENT;
}
export function progressPlan({ planKind = "broad_profile", trackId = "" } = {}) {
  const plan = PROGRESS_TEST_PLANS[planKind];
  if (!plan || (planKind === "focused" && !PROGRESS_TEST_TRACKS.some(track => track.id === trackId))) throw new Error("Choose a valid progress-check plan.");
  return { ...plan, trackIds: planKind === "focused" ? [trackId] : PROGRESS_TEST_TRACKS.map(track => track.id) };
}
