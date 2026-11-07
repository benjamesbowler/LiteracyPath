import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";
import { GUIDED_READING_COVER_RENDITIONS } from "../../src/data/generated/guidedReadingCoverRenditions.generated.js";
import { GUIDED_READING_NARRATION_CLEARANCE } from "../../src/data/generated/guidedReadingNarrationClearance.generated.js";
import { appVisualAssetReview } from "../../src/content/appVisualAssetReviews.generated.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sha256 = value => createHash("sha256").update(value).digest("hex");
const stable = value => JSON.stringify(value, (key, row) => row && typeof row === "object" && !Array.isArray(row)
  ? Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b))) : row);
const words = value => String(value || "").match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const publicFile = value => {
  if (!value?.startsWith("/")) throw Error(`Missing published asset path: ${value}`);
  return `public${value.split("?")[0]}`;
};
const fileHash = relative => sha256(fs.readFileSync(path.join(root, relative)));

export const PUBLISHED_WORLD_DISCOVERY_IDS = Object.freeze([..."abcde"].flatMap(level =>
  Array.from({ length: 10 }, (_, index) => `world-discovery-${level}-${String(index + 1).padStart(2, "0")}`)));

// This is a measurement helper, not an approval/fixture regeneration command.
// Compare it with the fixed reviewed production snapshot. Shared registries may
// grow; only the original books' rows and all media they consume are frozen.
export function collectPublishedWorldDiscoverySnapshot() {
  const ids = new Set(PUBLISHED_WORLD_DISCOVERY_IDS);
  const books = getRuntimeGuidedReadingBooks().filter(book => ids.has(book.id));
  const categories = { illustrations: new Set(), cards: new Set(), pageAudio: new Set(), wordAudio: new Set(), references: new Set(["source-art/world-discovery/cast-v1.png"]), receipts: new Set(), productionReviews: new Set(["source-art/world-discovery/card-cover-review.json", "source-art/world-discovery/narration-review.json"]) };
  const bindings = {};
  const coverRows = {};
  const clearanceRows = {};
  for (const book of books) {
    const slug = book.id.replace("world-discovery-", "");
    categories.references.add(`source-art/world-discovery/${slug}-reference.webp`);
    categories.receipts.add(`source-art/world-discovery/receipts/${slug}-reference.json`);
    for (const [slot, image] of [["cover", book.coverImage], ...book.pages.map(page => [`page-${String(page.pageNumber).padStart(2, "0")}`, page.image])]) {
      categories.illustrations.add(publicFile(image));
      categories.receipts.add(`source-art/world-discovery/receipts/${slug}-${slot}.json`);
    }
    const card = GUIDED_READING_COVER_RENDITIONS[book.coverImage];
    categories.cards.add(publicFile(card?.src));
    coverRows[book.coverImage] = card;
    const speech = [...book.pages, { text: book.title, narrationNeedsRebuild: true }].map(page => {
      const audio = getGuidedReadingPageAudioPath(page);
      categories.pageAudio.add(publicFile(audio));
      const wordAudio = [...new Set(words(page.text))].sort().map(word => {
        const audioPath = getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page });
        categories.wordAudio.add(publicFile(audioPath));
        return [word, audioPath];
      });
      if (page.pageNumber) clearanceRows[`${book.id}::${page.pageNumber}`] = GUIDED_READING_NARRATION_CLEARANCE[`${book.id}::${page.pageNumber}`];
      return { pageNumber: page.pageNumber || "title", text: page.text, audio, wordAudio };
    });
    bindings[book.id] = sha256(stable({ book, speech }));
  }
  const imageFiles = new Set([...categories.illustrations, ...categories.cards]);
  const visualRows = appVisualAssetReview.assets.filter(row => imageFiles.has(publicFile(row.path))).sort((a, b) => a.path.localeCompare(b.path));
  const pageRows = readJson("docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json").pages
    .filter(row => ids.has(row.bookId)).sort((a, b) => a.bookId.localeCompare(b.bookId) || a.pageNumber - b.pageNumber);
  const sources = [...[..."abcde"].map(level => `src/content/world-discovery/level-${level}.json`), "src/content/world-discovery/reviews.json"];
  return {
    sourceFiles: Object.fromEntries(sources.map(file => [file, fileHash(file)])),
    runtimeOrder: books.map(book => book.id),
    runtimeBindings: bindings,
    assets: Object.fromEntries(Object.entries(categories).map(([name, files]) => {
      const entries = [...files].sort().map(file => [file, fileHash(file)]);
      return [name, { count: entries.length, pathAndByteManifestSha256: sha256(stable(entries)) }];
    })),
    sharedReviewRows: {
      covers: { count: Object.keys(coverRows).length, sha256: sha256(stable(coverRows)) },
      narrationClearance: { count: Object.keys(clearanceRows).length, sha256: sha256(stable(clearanceRows)) },
      appVisual: { count: visualRows.length, sha256: sha256(stable(visualRows)) },
      pageAlignment: { count: pageRows.length, sha256: sha256(stable(pageRows)) }
    }
  };
}
