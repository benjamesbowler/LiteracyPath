import { GUIDED_READING_TEXT_ANALYSIS } from "../../data/generated/guidedReadingTextAnalysis.generated.js";
import { fingerprintBookReadingText } from "./textMetrics.js";

export const APP_READING_LEVELS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);

export function appReadingLevelLabel(level) {
  return level ? `App level ${level}` : "App level pending";
}

export function getBookTextAnalysis(book) {
  const analysis = GUIDED_READING_TEXT_ANALYSIS[book?.id];
  if (!analysis) return {
    status: "unreviewed", appReadingLevel: null, rationale: "This text has not been assigned an app reading level.",
    metrics: null, lexile: { status: "pending", measure: null, label: "Lexile pending" }
  };
  if (analysis.textFingerprint !== fingerprintBookReadingText(book)) return {
    status: "stale", appReadingLevel: null, rationale: "This text changed after its reading-level review.",
    metrics: null, lexile: { status: "pending", measure: null, label: "Lexile pending" }
  };
  return { ...analysis, status: "current" };
}

export function validateLexileReceipt(receipt, textHash) {
  if (!receipt || typeof receipt !== "object") throw new Error("Lexile receipt must be an object.");
  if (!/^(?:BR\d{1,4}|\d{1,4})L$/.test(receipt.measure || "")) throw new Error("A specific Lexile measure such as 250L or BR100L is required.");
  if (receipt.textHash !== textHash) throw new Error("Lexile receipt does not match the current text hash.");
  if (!["certified", "authorized-commercial"].includes(receipt.measurementType)) throw new Error("A certified or authorized commercial measurement receipt is required.");
  if (receipt.provider !== "MetaMetrics") throw new Error("Lexile receipt must identify MetaMetrics as the measuring provider.");
  const timestamp = Date.parse(receipt.measuredAt || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receipt.measuredAt || "") || Number.isNaN(timestamp)
    || new Date(timestamp).toISOString().slice(0, 10) !== receipt.measuredAt) throw new Error("Lexile receipt requires a valid measurement date.");
  if (!receipt.receiptReference || typeof receipt.receiptReference !== "string") throw new Error("Lexile receipt requires a provenance reference.");
  if (receipt.authorizedForPublication !== true) throw new Error("Lexile receipt requires explicit publication authorization.");
  return {
    status: "measured", measure: receipt.measure, label: `Lexile ${receipt.measure}`,
    provider: receipt.provider, measurementType: receipt.measurementType,
    measuredAt: receipt.measuredAt, receiptReference: receipt.receiptReference,
    textHash: receipt.textHash, authorizedForPublication: true
  };
}
