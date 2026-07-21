/**
 * Stable public API for LiteracyPath's original provisional EL-aligned
 * benchmark forms.  UI, reporting, and persistence code should import from
 * this facade rather than reaching into the catalog/scorer implementation.
 */

export {
  EL_ADMINISTRATION_STATUSES,
  EL_BENCHMARK_CATALOG,
  EL_BENCHMARK_CONTENT_VERSION,
  EL_BENCHMARK_ERROR_TAGS,
  EL_BENCHMARK_FORM_ID,
  EL_BENCHMARK_IDS,
  EL_BENCHMARK_SCHEMA_VERSION,
  EL_DECODING_MICROPHASES,
  EL_FLUENCY_PASSAGES,
  EL_ITEM_RESPONSE_STATUSES,
  getElBenchmarkPlan,
  listElBenchmarkRoutes
} from "./elBenchmarkAssessmentCatalog.js";

export {
  EL_BENCHMARK_ATTEMPT_SCHEMA_VERSION,
  EL_BENCHMARK_SCORING_VERSION,
  buildElBenchmarkAttempt,
  scoreElBenchmarkSession
} from "../utils/elBenchmarkAssessmentScoring.js";
