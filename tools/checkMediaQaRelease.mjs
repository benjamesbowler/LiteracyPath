import { mediaQaReviewItems } from "../src/data/generated/mediaQaReviewItems.generated.js";

const counts = {};
const pending = [];

for (const item of mediaQaReviewItems) {
  const status = item.status || "pending";
  const mediaKind = item.imagePath ? "image" : "text-only";
  const key = `${item.area || "unknown"}:${mediaKind}:${status}`;
  counts[key] = (counts[key] || 0) + 1;
  if (status === "pending") pending.push(item);
}

console.log("Runtime-reachable media review coverage:");
Object.entries(counts)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([key, count]) => console.log(`  ${key}: ${count}`));

if (pending.length) {
  const examples = pending.slice(0, 20).map(item =>
    `${item.area}:${item.skillId || item.bookId || "unknown"}:${item.questionId || item.pageId || "unknown"}:${item.imagePath || "text-only"}`
  );
  console.error(`Media review release gate failed: ${pending.length} published pairings are pending human review.`);
  examples.forEach(example => console.error(`  ${example}`));
  if (pending.length > examples.length) console.error(`  ...and ${pending.length - examples.length} more`);
  process.exit(1);
}

console.log(`Media review release gate passed: ${mediaQaReviewItems.length} published pairings reviewed.`);
