import { mediaQaReviewItems } from "../src/data/generated/mediaQaReviewItems.generated.js";
import { isBetaMediaPairingTestVisible } from "../src/policy/betaReleasePolicy.js";
import { summarizeMediaQaWorkload } from "../src/utils/mediaQaWorkload.js";

const requestedAreas = new Set(
  process.argv
    .filter(argument => argument.startsWith("--area="))
    .map(argument => argument.slice("--area=".length).trim())
    .filter(Boolean)
);
const reviewItems = requestedAreas.size
  ? mediaQaReviewItems.filter(item => requestedAreas.has(item.area))
  : mediaQaReviewItems;
const workload = summarizeMediaQaWorkload(reviewItems);
const counts = {};
const invalid = [];

for (const item of reviewItems) {
  const rawStatus = String(item.status || "accepted");
  const status = rawStatus === "quarantined" ? "quarantined" : "accepted";
  const mediaKind = item.imagePath ? "image" : "text-only";
  const key = `${item.area || "unknown"}:${mediaKind}:${status}`;
  counts[key] = (counts[key] || 0) + 1;
  if (!["accepted", "quarantined", "approved", "pending"].includes(rawStatus)) {
    invalid.push(`${item.reviewId || "unknown"}: ${rawStatus}`);
  }
}

console.log(
  `Runtime-reachable media review coverage${requestedAreas.size ? ` for ${[...requestedAreas].join(", ")}` : ""}:`
);
Object.entries(counts)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([key, count]) => console.log(`  ${key}: ${count}`));

if (invalid.length) {
  console.error(`Media review release gate failed: ${invalid.length} rows have an invalid status.`);
  invalid.slice(0, 20).forEach(row => console.error(`  ${row}`));
  process.exit(1);
}

const runtimeVisible = reviewItems.filter(item => isBetaMediaPairingTestVisible(item.status));
if (runtimeVisible.length + workload.quarantinedPairings !== reviewItems.length) {
  console.error("Media review release gate failed: publication state does not cover every row.");
  process.exit(1);
}

console.log(
  `Media review release gate passed: ${runtimeVisible.length} accepted under continuous review; `
  + `${workload.quarantinedPairings} reported defects quarantined from runtime.`
);
