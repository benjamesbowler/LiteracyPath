import { mediaQaReviewItems } from "../src/data/generated/mediaQaReviewItems.generated.js";
import { isBetaMediaPairingTestVisible } from "../src/policy/betaReleasePolicy.js";

const betaMode = process.argv.includes("--beta");

const requestedAreas = new Set(
  process.argv
    .filter(argument => argument.startsWith("--area="))
    .map(argument => argument.slice("--area=".length).trim())
    .filter(Boolean)
);
const reviewItems = requestedAreas.size
  ? mediaQaReviewItems.filter(item => requestedAreas.has(item.area))
  : mediaQaReviewItems;
const counts = {};
const pending = [];

for (const item of reviewItems) {
  const status = item.status || "pending";
  const mediaKind = item.imagePath ? "image" : "text-only";
  const key = `${item.area || "unknown"}:${mediaKind}:${status}`;
  counts[key] = (counts[key] || 0) + 1;
  if (status === "pending") pending.push(item);
}

console.log(
  `Runtime-reachable media review coverage${requestedAreas.size ? ` for ${[...requestedAreas].join(", ")}` : ""}:`
);
Object.entries(counts)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([key, count]) => console.log(`  ${key}: ${count}`));

if (pending.length && !betaMode) {
  const examples = pending.slice(0, 20).map(item =>
    `${item.area}:${item.skillId || item.bookId || "unknown"}:${item.questionId || item.pageId || "unknown"}:${item.imagePath || "text-only"}`
  );
  console.error(`Media review release gate failed: ${pending.length} published pairings are pending human review.`);
  examples.forEach(example => console.error(`  ${example}`));
  if (pending.length > examples.length) console.error(`  ...and ${pending.length - examples.length} more`);
  process.exit(1);
}

if (betaMode) {
  const betaVisible = reviewItems.filter(item => isBetaMediaPairingTestVisible(item.status || "pending"));
  const quarantined = reviewItems.filter(item => (item.status || "pending") === "quarantined");
  console.log(
    `Beta media publication gate passed: ${betaVisible.length} pairings are test-visible, ` +
    `${quarantined.length} quarantined, and ${pending.length} remain explicitly pending human review.`
  );
} else {
  console.log(`Media review release gate passed: ${reviewItems.length} published pairings reviewed.`);
}
