import fs from "node:fs";
import path from "node:path";
import { curatedPublicDomainBooks, pilotPublicDomainBookIds } from "./curatedBooks.js";
import { ensureDir, getBookRawDir, parseArgs, writeJson } from "./shared.js";

function extensionFromUrl(url = "") {
  const clean = url.split("?")[0].split("#")[0];
  const extension = path.extname(clean).toLowerCase();
  if ([".pdf", ".txt", ".text", ".jpg", ".jpeg", ".png", ".webp"].includes(extension)) return extension;
  return ".txt";
}

function metadataFor(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    source: book.sourceUrl,
    sourceName: book.source,
    publicDomain: true,
    readingLevel: book.readingLevel,
    guidedReadingLevel: book.guidedReadingLevel,
    type: book.tags.includes("fairy tale") || book.tags.includes("classic") || book.tags.includes("animals") ? "fiction" : "nonfiction",
    tags: book.tags,
    active: false,
    qaStatus: "draft",
    curation: {
      band: book.band,
      priority: book.priority,
      notes: book.notes,
      illustrationQuality: book.illustrationQuality,
      ocrCleanupLikely: book.ocrCleanupLikely
    }
  };
}

async function downloadWithRetries(url, targetPath, retries = 2) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "LiteracyPath public-domain guided-reading importer"
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      ensureDir(path.dirname(targetPath));
      fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
      return { ok: true, bytes: arrayBuffer.byteLength };
    } catch (error) {
      lastError = error;
    }
  }
  return { ok: false, error: lastError?.message || "Unknown download failure" };
}

export async function downloadCuratedBooks({ pilotOnly = false, force = false } = {}) {
  const selected = curatedPublicDomainBooks
    .filter(book => !book.tags.includes("rejected"))
    .filter(book => !pilotOnly || pilotPublicDomainBookIds.includes(book.id));
  const rows = [];

  for (const book of selected) {
    const rawDir = getBookRawDir(book.id);
    ensureDir(rawDir);
    writeJson(path.join(rawDir, "metadata.json"), metadataFor(book));

    if (!book.downloadUrl) {
      rows.push({
        id: book.id,
        title: book.title,
        status: "needs_direct_download_url",
        sourceUrl: book.sourceUrl,
        target: ""
      });
      continue;
    }

    const target = path.join(rawDir, `source${extensionFromUrl(book.downloadUrl)}`);
    if (fs.existsSync(target) && !force) {
      rows.push({
        id: book.id,
        title: book.title,
        status: "already_downloaded",
        sourceUrl: book.sourceUrl,
        target
      });
      continue;
    }

    const result = await downloadWithRetries(book.downloadUrl, target);
    rows.push({
      id: book.id,
      title: book.title,
      status: result.ok ? "downloaded" : "failed",
      sourceUrl: book.sourceUrl,
      downloadUrl: book.downloadUrl,
      target,
      bytes: result.bytes || 0,
      error: result.error || ""
    });
  }

  writeJson("docs/guided-reading/curated_download_report.json", {
    generatedAt: new Date().toISOString(),
    pilotOnly,
    rows
  });

  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs();
  downloadCuratedBooks({ pilotOnly: Boolean(args.pilot), force: Boolean(args.force) })
    .then(rows => {
      const downloaded = rows.filter(row => row.status === "downloaded").length;
      const failed = rows.filter(row => row.status === "failed").length;
      const missing = rows.filter(row => row.status === "needs_direct_download_url").length;
      console.log(`Curated download pass complete. Downloaded: ${downloaded}. Failed: ${failed}. Needs URL: ${missing}.`);
      rows.filter(row => row.status === "failed").forEach(row => {
        console.warn(`- ${row.id}: ${row.error}`);
      });
      if (failed) process.exitCode = 1;
    })
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}

