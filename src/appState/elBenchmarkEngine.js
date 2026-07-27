/**
 * Teacher-only EL benchmark creation and archival engine.
 *
 * Keep this boundary behind loadElBenchmarkEngineModule() so the large
 * benchmark catalog and scorer are downloaded only when a teacher starts or
 * archives a formal benchmark.
 */
export { createElBenchmarkSession } from "../data/elBenchmarkSession.js";
export { buildElBenchmarkAttempt } from "../data/elBenchmarkAssessments.js";
