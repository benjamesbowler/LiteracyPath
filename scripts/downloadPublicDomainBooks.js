import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicDomainBooks } from "../src/content/books/publicDomainBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repoRoot, "public", "books", "public-domain");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "public_domain_download_report.md");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function createManifest(book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author || "",
    illustrator: book.illustrator || "",
    sourceUrl: book.sourceUrl,
    publicDomain: true,
    licenseNote: book.licenseNote,
    gradeBand: book.gradeBand,
    readingType: book.readingType,
    difficulty: book.difficulty,
    estimatedPages: book.estimatedPages || 0,
    tags: book.tags || [],
    skills: book.skills || [],
    pages: book.pages || [],
    comprehension: book.comprehension || [],
    active: false,
    downloadStatus: "pending_network_download",
    processingStatus: "not_processed"
  };
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destination, bytes);
}

ensureDir(outputRoot);
ensureDir(path.dirname(reportPath));

const lines = [
  "# Public-Domain Book Download Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "This script creates book folders and manifests first, then attempts downloads when a verified source URL is available.",
  ""
];

let downloaded = 0;
let pending = 0;
let failed = 0;

for (const book of publicDomainBooks) {
  const bookDir = path.join(outputRoot, book.id);
  ensureDir(bookDir);
  fs.writeFileSync(path.join(bookDir, "manifest.json"), `${JSON.stringify(createManifest(book), null, 2)}\n`);

  const pdfUrl = book.pdfUrl || "";
  if (!pdfUrl) {
    pending += 1;
    lines.push(`- ${book.title}: manifest created, PDF URL pending exact edition verification.`);
    continue;
  }

  try {
    await downloadFile(pdfUrl, path.join(bookDir, "original.pdf"));
    downloaded += 1;
    lines.push(`- ${book.title}: downloaded ${pdfUrl}`);
  } catch (error) {
    failed += 1;
    lines.push(`- ${book.title}: download failed from ${pdfUrl} (${error.message})`);
  }
}

lines.splice(4, 0, `Summary: ${downloaded} downloaded, ${pending} pending exact URLs, ${failed} failed.`);
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

console.log(`Public-domain book folders prepared: ${publicDomainBooks.length}`);
console.log(`Downloaded: ${downloaded}; pending exact URLs: ${pending}; failed: ${failed}`);
