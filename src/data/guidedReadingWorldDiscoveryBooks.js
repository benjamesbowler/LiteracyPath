import manifest from "../content/world-discovery/cohorts.json" with { type: "json" };
import { WORLD_DISCOVERY_REGISTERED_COHORTS } from "./generated/worldDiscoveryCohorts.generated.js";
import { registeredWorldDiscoveryCohorts } from "./worldDiscoveryCohortContract.js";
import { adaptWorldDiscoveryBook } from "./worldDiscoveryBookAdapter.js";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// Draft cohorts have no imports or public metadata. Registration binds the full
// source and authored reviews; prebuild separately verifies actual media bytes.
const released = registeredWorldDiscoveryCohorts(manifest, WORLD_DISCOVERY_REGISTERED_COHORTS);
const reviews = Object.assign({}, ...released.map(entry => entry.reviews));
export const WORLD_DISCOVERY_MANUSCRIPTS = deepFreeze(released.flatMap(entry => entry.books));

export const GUIDED_READING_WORLD_DISCOVERY_LEVEL_REVIEWS = deepFreeze(reviews);

export const GUIDED_READING_WORLD_DISCOVERY_BOOKS = deepFreeze(released.flatMap(entry =>
  entry.books.map(row => adaptWorldDiscoveryBook(row, entry.reviews[row.id], entry.cohort, true))
));

export const GUIDED_READING_WORLD_DISCOVERY_METADATA = deepFreeze(Object.fromEntries(
  WORLD_DISCOVERY_MANUSCRIPTS.map(book => [book.id, {
    readingBandProfile: book.readingBandProfile,
    readingMode: book.readingMode
  }])
));

export const GUIDED_READING_DISCUSSION_PROMPTS_WORLD_DISCOVERY = deepFreeze(Object.fromEntries(
  WORLD_DISCOVERY_MANUSCRIPTS.map(book => [book.id, book.discussion])
));
