import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const assetDir = join(process.cwd(), "dist", "assets");

const trackedChunks = [
  { id: "main index", match: /^index-.*\.js$/ },
  { id: "generated early skills", match: /^generated-early-skills-.*\.js$/ },
  { id: "question-bank-extra", match: /^question-bank-extra-.*\.js$/ },
  { id: "audio manifest", match: /^audio-manifest-.*\.js$/ },
  { id: "admin media inventory", match: /^admin-media-inventory-.*\.js$/ },
  { id: "guided-reading-data", match: /^guided-reading-data-.*\.js$/ },
  { id: "exceljs", match: /^exceljs.*\.js$/ },
  { id: "LearnAreaPage", match: /^LearnAreaPage-.*\.js$/ },
  { id: "AdminDashboardPage", match: /^AdminDashboardPage-.*\.js$/ },
  { id: "GuidedReadingPage", match: /^GuidedReadingPage-.*\.js$/ },
  { id: "FinishedReportPage", match: /^FinishedReportPage-.*\.js$/ }
];

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

let files = [];
try {
  files = readdirSync(assetDir).filter(file => file.endsWith(".js"));
} catch {
  console.log("No dist/assets JavaScript output found. Run npm run build first.");
  process.exit(0);
}

const rows = trackedChunks.map(chunk => {
  const matches = files.filter(file => chunk.match.test(file));
  if (matches.length === 0) {
    return {
      chunk: chunk.id,
      file: "not found",
      size: "-",
      gzip: "-"
    };
  }

  const file = matches
    .map(name => ({ name, size: statSync(join(assetDir, name)).size }))
    .sort((a, b) => b.size - a.size)[0].name;
  const path = join(assetDir, file);
  const bytes = readFileSync(path);

  return {
    chunk: chunk.id,
    file,
    size: formatKb(bytes.length),
    gzip: formatKb(gzipSync(bytes).length)
  };
});

console.log("Bundle Size Report");
console.table(rows);
