import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { getMediaQaReviewId } from "../src/data/mediaQaReviewStatus.js";
import { normalizeLedaAudioText } from "../src/data/normalizeLedaAudioText.js";

const area = "story_quests";
const outputPath = "src/data/generated/mediaQaReviewItems.generated.js";
const sha256 = value => createHash("sha256").update(value).digest("hex");
const cleanPath = value => String(value || "").split(/[?#]/)[0];
const pageKey = (bookId, pageId) => `${bookId}::${pageId}`;
const observation = "Synchronized from current runtime text and exact media hashes; no new visual or human-listening observation recorded.";

/** Replace only Story Quest inventory rows. Review status is a separate concern. */
export function syncStoryQuestMediaQaItems({
  existingItems, quests, narrationManifest, getNarrationPath, readAsset
}) {
  const priorRows = existingItems.filter(item => item.area === area);
  const priorByPage = new Map();
  for (const row of priorRows) {
    const key = pageKey(row.bookId, row.pageId);
    // A duplicated legacy row must never erase a reported defect.
    if (!priorByPage.has(key) || row.status === "quarantined") priorByPage.set(key, row);
  }
  const clipsByPath = new Map(narrationManifest.clips.map(clip => [clip.audioPath, clip]));
  const seenPages = new Set();
  const mediaCache = new Map();
  function mediaHash(assetPath) {
    const asset = cleanPath(assetPath);
    if (!asset.startsWith("/") || asset.includes("..")) throw new Error(`Invalid public media path: ${assetPath}`);
    if (!mediaCache.has(asset)) {
      const bytes = readAsset(asset);
      if (!bytes?.length) throw new Error(`Missing or empty current media: ${asset}`);
      mediaCache.set(asset, sha256(bytes));
    }
    return mediaCache.get(asset);
  }
  const currentRows = quests.flatMap(quest => quest.pages.map((page, index) => {
    const pageId = `${quest.id}:${page.id}`;
    const key = pageKey(quest.id, pageId);
    if (seenPages.has(key)) throw new Error(`Duplicate current Story Quest page: ${key}`);
    seenPages.add(key);
    const previous = priorByPage.get(key);
    const text = page.text.join(" ");
    const audioPath = getNarrationPath(text);
    const clip = clipsByPath.get(audioPath);
    if (!clip || clip.key !== normalizeLedaAudioText(text) || !clip.references?.some(reference => (
      reference.questId === quest.id && reference.pageId === page.id && reference.text === text
    ))) throw new Error(`Missing exact narration manifest reference: ${quest.id}/${page.id}`);
    const imageSha256 = mediaHash(page.imageUrl);
    const audioSha256 = mediaHash(audioPath);
    if (audioSha256 !== clip.audioSha256) throw new Error(`Narration bytes differ from manifest: ${quest.id}/${page.id}`);
    const answerChoices = (page.choices || []).map(choice => choice.label);
    const mediaFingerprint = sha256(JSON.stringify({
      text, choices: page.choices || [], choicePrompt: page.choicePrompt || "",
      imageAlt: page.imageAlt || "", imagePath: cleanPath(page.imageUrl), imageSha256,
      audioPath: cleanPath(audioPath), audioSha256
    }));
    const sameMedia = previous?.mediaFingerprint === mediaFingerprint;
    const row = {
      area, skillId: area, displaySkillName: "Story Quests", questionId: "",
      bookId: quest.id, pageId, pageNumber: index + 1, bookTitle: quest.title,
      level: quest.level || "", phase: quest.phase || "", targetWord: (page.skillTags || []).join(", "),
      imagePath: page.imageUrl, imageRole: "story_quest_page", imageAlt: page.imageAlt || "", imageSha256,
      text, textSha256: sha256(text), answerChoices, correctAnswer: "",
      audioPath, audioSha256, audioVoice: clip.voice, audioSource: clip.source,
      narrationGenerator: narrationManifest.generator,
      mediaFingerprint,
      status: previous?.status || "accepted",
      reviewedAt: sameMedia ? previous.reviewedAt || "" : "",
      notes: sameMedia ? previous.notes || "" : previous?.status === "quarantined" && previous.notes
        ? `Reported defect remains quarantined. Prior review notes: ${previous.notes}`
        : observation,
      observation
    };
    // Keep old IDs stable so device-local decisions survive query/hash updates.
    return {
      reviewId: previous?.reviewId || getMediaQaReviewId({ ...row, imagePath: cleanPath(row.imagePath) }),
      ...row
    };
  }));
  let inserted = false;
  const items = existingItems.flatMap(item => {
    if (item.area !== area) return [item];
    if (inserted) return [];
    inserted = true;
    return currentRows;
  });
  if (!inserted) items.push(...currentRows);
  const unrelatedBefore = existingItems.filter(item => item.area !== area);
  const unrelatedAfter = items.filter(item => item.area !== area);
  const unrelatedBeforeSha256 = sha256(JSON.stringify(unrelatedBefore));
  const unrelatedAfterSha256 = sha256(JSON.stringify(unrelatedAfter));
  const currentKeys = new Set(currentRows.map(row => pageKey(row.bookId, row.pageId)));
  const addedRows = currentRows.filter(row => !priorByPage.has(pageKey(row.bookId, row.pageId)));
  return {
    items,
    priorRows,
    summary: {
      previousStoryQuestRows: priorRows.length,
      currentStoryQuestRows: currentRows.length,
      removedStoryQuestRows: priorRows.filter(row => !currentKeys.has(pageKey(row.bookId, row.pageId))).length,
      addedStoryQuestRows: addedRows.length,
      addedStoryQuestPagesByBook: [...new Set(addedRows.map(row => row.bookId))].map(bookId => ({
        bookId, bookTitle: addedRows.find(row => row.bookId === bookId).bookTitle,
        pageIds: addedRows.filter(row => row.bookId === bookId).map(row => row.pageId)
      })),
      unrelatedRows: unrelatedBefore.length,
      unrelatedBeforeSha256, unrelatedAfterSha256,
      unrelatedRowsUnchanged: unrelatedBeforeSha256 === unrelatedAfterSha256,
      statuses: currentRows.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] || 0) + 1 }), {}),
      observation
    }
  };
}

export function renderMediaQaItems(items) {
  return "// Story Quest rows synchronized by tools/syncStoryQuestMediaQa.mjs. Do not hand-edit.\n"
    + "// Other areas are preserved from the checked-in inventory.\n\n"
    + `export const mediaQaReviewItems = ${JSON.stringify(items, null, 2)};\n\n`
    + "export default mediaQaReviewItems;\n";
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(argument => argument !== "--check")) throw new Error("Usage: node tools/syncStoryQuestMediaQa.mjs [--check]");
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const target = path.join(root, outputPath);
  const previousSource = fs.readFileSync(target, "utf8");
  const [{ mediaQaReviewItems }, { storyQuests }, { getStoryQuestLedaAudioPath }] = await Promise.all([
    import(pathToFileURL(target).href),
    import("../src/data/storyQuests.js"),
    import("../src/data/storyQuestLedaAudio.js")
  ]);
  const narrationManifest = JSON.parse(fs.readFileSync(path.join(root, "src/content/storyQuestNarrationManifest.generated.json"), "utf8"));
  const result = syncStoryQuestMediaQaItems({
    existingItems: mediaQaReviewItems, quests: storyQuests, narrationManifest,
    getNarrationPath: getStoryQuestLedaAudioPath,
    readAsset: asset => fs.readFileSync(path.join(root, "public", asset.slice(1)))
  });
  const nextSource = renderMediaQaItems(result.items);
  const changed = nextSource !== previousSource;
  const summary = { ...result.summary, changed, checkOnly: args.includes("--check") };
  if (changed && !summary.checkOnly) {
    const receiptDirectory = path.join(root, ".artifacts/story-quest-media-qa");
    fs.mkdirSync(receiptDirectory, { recursive: true });
    const receipt = path.join(receiptDirectory, `sync-${Date.now()}.json`);
    // Preserve historical claims as historical evidence before replacing them.
    fs.writeFileSync(receipt, JSON.stringify({
      ...summary, previousSourceSha256: sha256(previousSource), nextSourceSha256: sha256(nextSource),
      priorRows: result.priorRows
    }, null, 2) + "\n", { flag: "wx" });
    fs.writeFileSync(target, nextSource);
    summary.receipt = path.relative(root, receipt);
  }
  console.log(JSON.stringify(summary, null, 2));
  if (summary.checkOnly && changed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
