import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateWorldDiscoveryDrafts, validateWorldDiscoveryDraftBatch, validateWorldDiscoveryReviews } from "./worldDiscoveryValidationLib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const WORLD_DISCOVERY_SOURCE_DIR = path.join(root, "src/content/world-discovery");
const levels = ["a", "b", "c", "d", "e"];
const sha256 = value => createHash("sha256").update(value).digest("hex");

export function parseWorldDiscoverySourceArgs(args, { allowOutputDir = false } = {}) {
  const options = {};
  const remaining = [];
  const flags = new Map([["--source-dir", "sourceDir"], ["--first-number", "firstNumber"], ["--last-number", "lastNumber"]]);
  if (allowOutputDir) flags.set("--output-dir", "outputDir");
  for (let index = 0; index < args.length; index += 1) {
    const key = flags.get(args[index]);
    if (!key) { remaining.push(args[index]); continue; }
    if (Object.hasOwn(options, key)) throw Error(`Duplicate ${args[index]}`);
    const value = args[++index];
    if (!value || value.startsWith("--")) throw Error(`Missing value for ${args[index - 1]}`);
    options[key] = ["firstNumber", "lastNumber"].includes(key) ? Number(value) : value;
  }
  return { options, remaining };
}

// Isolated manuscripts are production inputs, never runtime registrations.
// The original source remains the default. New inputs require an explicit
// ten-strand range and may never impersonate the published first fifty IDs.
export function readWorldDiscoverySource({ sourceDir, firstNumber, lastNumber, bookId, requireReviews = false } = {}) {
  const directory = fs.realpathSync(path.resolve(root, sourceDir || WORLD_DISCOVERY_SOURCE_DIR));
  const isolated = directory !== fs.realpathSync(WORLD_DISCOVERY_SOURCE_DIR);
  if (!isolated && (firstNumber !== undefined || lastNumber !== undefined)) throw Error("Number ranges apply only to an explicit isolated --source-dir");
  const level = bookId?.match(/^world-discovery-([a-e])-\d{2}$/)?.[1];
  if (bookId && !level) throw Error("Expected a World Discovery ID");
  const entries = (level ? [level] : levels).flatMap(letter => {
    const file = path.join(directory, `level-${letter}.json`);
    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(rows)) throw Error(`${file}: expected an array of manuscripts`);
    return rows;
  });
  const books = bookId ? entries.filter(book => book.id === bookId) : entries;
  if (bookId && books.length !== 1) throw Error(`${bookId}: expected exactly one manuscript; found ${books.length}`);
  if (isolated && entries.some(book => /^world-discovery-[a-e]-0[1-9]$|^world-discovery-[a-e]-10$/.test(book?.id))) {
    throw Error("Isolated source collides with the published first fifty World Discovery IDs");
  }
  const validation = isolated
    ? validateWorldDiscoveryDraftBatch(books, { firstNumber, lastNumber, requireComplete: !bookId })
    : validateWorldDiscoveryDrafts(books, { requireComplete: !bookId });
  if (validation.failures.length) throw Error(validation.failures.join("\n"));
  let reviews;
  if (requireReviews) {
    reviews = JSON.parse(fs.readFileSync(path.join(directory, "reviews.json"), "utf8"));
    const failures = validateWorldDiscoveryReviews(books, reviews);
    if (failures.length) throw Error(failures.join("\n"));
  }
  return { books, reviews, directory, isolated, firstNumber, lastNumber,
    manuscriptSha256: sha256(JSON.stringify(books)) };
}
