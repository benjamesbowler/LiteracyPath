export const LEARNING_RESPONSE_POLICY_VERSION = "learning-response-v1";
export const LEARNING_RESPONSE_SCHEMA_VERSION = 1;
export const CHECKING_INSTRUMENTS = new Set(["formal_skills", "cycle_check", "el_benchmark", "progress_test", "adaptive_progress_test"]);

export function learningResponseUse({ role = "first_probe", responseStatus = "answered", valid = true, supported = false } = {}) {
  if (responseStatus !== "answered" || !valid) return "unscored";
  if (role === "transfer") return "formative_transfer_after_teaching";
  return supported || role === "guided" ? "supported_practice" : "independent_practice_response";
}
