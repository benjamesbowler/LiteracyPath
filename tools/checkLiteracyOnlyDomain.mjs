import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECKER_PATH = "tools/checkLiteracyOnlyDomain.mjs";
const CHECKER_TEST_PATH = "tests/unit/literacyOnlyDomain.test.js";
const CLEANUP_TOMBSTONE = "supabase/migrations/20260821220000_retired_domain_cleanup.sql";
const TEXT_EXTENSION = /\.(?:c?js|mjs|jsx|ts|tsx|json|md|html|css|csv|sql|py|toml|ya?ml|txt)$/i;
const RETIRED_CONTENT = /\b(?:maths?|mathematics|mathematical(?:ly)?|numeracy)\b|shapes_and_math/i;
const RETIRED_PATH = /(?:^|[/_.-])(?:maths?|mathematics|numeracy)(?:$|[/_.-])/i;
const FIRST_PARTY_PATH = /^(?:src|public|docs|tools|tests|supabase\/migrations)\//;
const WORLD_DISCOVERY_MANUSCRIPT = /^src\/content\/world-discovery\/(?:cohorts\/\d{2}-\d{2}\/)?level-[a-e]\.json$/;
const CLASSIFICATION_SOURCE_URL = "https://nrich.maths.org/problems/carroll-diagrams";
const DISCOVERY_REFERENCE_METADATA = [
  { bookId: "world-discovery-a-29", url: "https://nrich.maths.org/eyfs-activities/two-halves", title: "University of Cambridge NRICH: Two Halves" },
  { bookId: "world-discovery-b-29", url: "https://www.ncetm.org.uk/classroom-resources/ey-measures/", title: "National Centre for Excellence in the Teaching of Mathematics: Measures" },
  { bookId: "world-discovery-c-29", url: "https://www.ncetm.org.uk/classroom-resources/cp-year-3-unit-11-time/", title: "National Centre for Excellence in the Teaching of Mathematics: Time" }
];
const HALVES_ENDING_REVIEW = "Each piece is half the strip follows the all-around edge match and restored whole, earning the mathematical word.";

function trackedAndUntrackedFiles(root) {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  ).split("\0").filter(Boolean);
}

function withoutProgrammingPrimitives(content, relativePath = "") {
  // Blender authoring uses Python's standard numerical module. Exempt only
  // its actual import/member syntax; product copy in the same file still fails.
  if (relativePath.endsWith(".py") && /^import math\s*$/m.test(content)) {
    content = content.replace(/^import math[ \t]*$/gm, "")
      .replace(/\bmath\.[A-Za-z_][\w]*/g, "");
  }
  return content
    .replace(/\b(?:Phaser\.)?Math\.[A-Za-z_$][\w$]*/g, "")
    .replace(/\bMath\\\.[A-Za-z_$][\w$]*/g, "")
    .replace(/\bPhaser\.Math\b/g, "")
    .replace(/node_modules\/phaser\/src\/math\//g, "");
}

function withoutCanonicalScienceSourceUrl(content, relativePath) {
  const isReview = relativePath === "src/content/world-discovery/cohorts/21-30/reviews.json";
  if (!WORLD_DISCOVERY_MANUSCRIPT.test(relativePath) && !isReview) return content;
  let books;
  try {
    books = JSON.parse(content);
  } catch {
    return content;
  }
  if (isReview) {
    if (!books || typeof books !== "object" || Array.isArray(books)) return content;
    let changed = false;
    for (const reference of DISCOVERY_REFERENCE_METADATA) {
      const review = books[reference.bookId]?.sourceReview;
      if (!Array.isArray(review?.urls)) continue;
      review.urls = review.urls.map(url => {
        if (url !== reference.url) return url;
        changed = true;
        return "";
      });
    }
    // This fixed editorial observation classifies the word "half"; it is not
    // child-facing copy or a retired product feature. No other review prose
    // or occurrence of the same wording receives an exemption.
    const ending = books["world-discovery-a-29"]?.editorialScorecard?.categories?.ending;
    if (ending?.evidence === HALVES_ENDING_REVIEW) {
      ending.evidence = "";
      changed = true;
    }
    return changed ? JSON.stringify(books, null, 2) : content;
  }
  if (!Array.isArray(books)) return content;
  let changed = false;
  for (const book of books) {
    if (!/^world-discovery-[a-e]-\d{2}$/.test(book?.id)) continue;
    const sources = book.storyBibleReview?.scienceSources;
    if (!Array.isArray(sources)) continue;
    for (const source of sources) {
      // This exact reference supports classification in a reading book. Mask
      // only its URL in the scan copy; sibling prose and other URLs still fail.
      if (source?.url === CLASSIFICATION_SOURCE_URL) {
        source.url = "";
        changed = true;
      }
      // These fixed nonfiction references name their original academic source.
      // Only the exact citation fields are masked; book prose, claims, URLs
      // elsewhere and other publications retain the complete domain scan.
      const reference = DISCOVERY_REFERENCE_METADATA.find(row => row.bookId === book.id
        && row.url === source?.url && row.title === source?.title);
      if (reference) {
        source.url = "";
        source.title = "";
        changed = true;
      }
    }
  }
  return changed ? JSON.stringify(books, null, 2) : content;
}

function tombstoneIssues(content) {
  const issues = [];
  if (!/drop\s+(?:table|function)/i.test(content)) {
    issues.push(`${CLEANUP_TOMBSTONE}: must remain a deletion-only cleanup tombstone`);
  }
  if (/create\s+(?:table|function|view)[\s\S]{0,160}?maths?/i.test(content)) {
    issues.push(`${CLEANUP_TOMBSTONE}: must never recreate a retired domain object`);
  }
  return issues;
}

export function validateLiteracyOnlyDomain({ root = repoRoot, files } = {}) {
  const issues = [];
  const candidates = files || trackedAndUntrackedFiles(root);
  for (const relativePath of candidates) {
    const normalized = relativePath.split(path.sep).join("/");
    if ([CHECKER_PATH, CHECKER_TEST_PATH].includes(normalized)) continue;
    if (!FIRST_PARTY_PATH.test(normalized) && !["package.json", "vite.config.js", "README.md"].includes(normalized)) continue;
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    if (normalized === CLEANUP_TOMBSTONE) {
      issues.push(...tombstoneIssues(fs.readFileSync(absolutePath, "utf8")));
      continue;
    }
    if (RETIRED_PATH.test(normalized)) issues.push(`${normalized}: retired domain term remains in its path`);
    if (!TEXT_EXTENSION.test(normalized)) continue;
    const content = withoutProgrammingPrimitives(
      withoutCanonicalScienceSourceUrl(fs.readFileSync(absolutePath, "utf8"), normalized),
      normalized
    );
    const match = RETIRED_CONTENT.exec(content);
    if (match) {
      const line = content.slice(0, match.index).split("\n").length;
      issues.push(`${normalized}:${line}: retired domain term "${match[0]}" remains`);
    }
  }
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = validateLiteracyOnlyDomain();
  if (issues.length) {
    console.error(`Literacy-only domain verification failed with ${issues.length} issue(s):`);
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Literacy-only domain verified: no retired domain feature, content, media path, or schema object remains.");
  }
}
