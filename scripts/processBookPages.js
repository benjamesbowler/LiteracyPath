import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { publicDomainBooks } from "../src/content/books/publicDomainBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bookRoot = path.join(repoRoot, "public", "books", "public-domain");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "public_domain_processing_report.md");

function commandExists(command) {
  try {
    execFileSync("which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const hasPdfToPpm = commandExists("pdftoppm");
const hasMagick = commandExists("magick");
const hasConvert = commandExists("convert");
const lines = [
  "# Public-Domain Book Page Processing Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Renderer availability: pdftoppm=${hasPdfToPpm}, magick=${hasMagick}, convert=${hasConvert}`,
  ""
];

if (!hasPdfToPpm && !hasMagick && !hasConvert) {
  lines.push("No PDF/page rendering tool is available in this environment. Install poppler or ImageMagick, then rerun this script.");
}

let processed = 0;
let pending = 0;

for (const book of publicDomainBooks) {
  const bookDir = path.join(bookRoot, book.id);
  const pdfPath = path.join(bookDir, "original.pdf");
  const pagesDir = path.join(bookDir, "pages");
  fs.mkdirSync(pagesDir, { recursive: true });

  if (!fs.existsSync(pdfPath)) {
    pending += 1;
    lines.push(`- ${path.basename(bookDir)}: skipped, original.pdf is missing.`);
    continue;
  }

  if (!hasPdfToPpm) {
    pending += 1;
    lines.push(`- ${path.basename(bookDir)}: original.pdf exists but pdftoppm is unavailable for webp page rendering.`);
    continue;
  }

  try {
    execFileSync("pdftoppm", ["-webp", "-r", "144", pdfPath, path.join(pagesDir, "page")], { stdio: "ignore" });
    processed += 1;
    lines.push(`- ${path.basename(bookDir)}: rendered pages with pdftoppm.`);
  } catch (error) {
    pending += 1;
    lines.push(`- ${path.basename(bookDir)}: rendering failed (${error.message}).`);
  }
}

lines.splice(4, 0, `Summary: ${processed} processed, ${pending} pending.`);
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

console.log(`Public-domain processing complete. Processed: ${processed}; pending: ${pending}`);
