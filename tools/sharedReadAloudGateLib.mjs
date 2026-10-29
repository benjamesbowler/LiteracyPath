import { createHash } from "node:crypto";
import { SHARED_READ_ALOUD_CONTRACTS, usesCharacterNarration } from "../src/data/sharedReadAloudContracts.js";
import { splitGuidedReadingSentences } from "../src/utils/guidedReading/readAloudPolicy.js";
import { validateScienceReadAloudManuscript } from "./meadowPalsScienceGateLib.mjs";

const words = text => String(text || "").match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/gu) || [];
export function validateSharedReadAloudManuscript(book = {}) {
  if (usesCharacterNarration(book)) return validateScienceReadAloudManuscript(book);
  const contract = SHARED_READ_ALOUD_CONTRACTS[book.id];
  if (!contract) return ["unregistered shared-read-aloud book"];
  const errors = [];
  if (book.level !== "READ_ALOUD" || book.readingBandProfile !== "read-aloud"
    || book.readingMode !== "supported-read-together") errors.push("shared-reading placement changed");
  if (book.title !== contract.title) errors.push("approved title changed");
  if (book.pages?.length !== contract.expectedPages) errors.push("approved page count changed");
  const hash = createHash("sha256").update(JSON.stringify((book.pages || []).map(page => page.text))).digest("hex");
  if (hash !== contract.manuscriptSha256) errors.push("approved manuscript changed");
  if (book.independentReadingLevel !== null || !book.interestAge) errors.push("interest age and decoding claim must stay separate");
  if (book.narrationProfile !== contract.narrationProfile) errors.push("approved narration profile changed");
  for (const [index, page] of (book.pages || []).entries()) {
    const sentences = splitGuidedReadingSentences(page.text);
    if (words(page.text).length > contract.maximumPageWords
      || sentences.length > contract.maximumPageSentences
      || sentences.some(sentence => words(sentence).length > contract.maximumSentenceWords)) {
      errors.push(`page ${index + 1}: approved text budget exceeded`);
    }
    if (page.narrationProfile !== contract.narrationProfile) errors.push(`page ${index + 1}: approved narration profile changed`);
  }
  return errors;
}
