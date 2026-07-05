import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const stylesDir = join(here, "..", "..", "src", "styles");

// Child-facing stylesheets that could contain a reduced-motion override.
const CHILD_STYLES = [
  "phonics.css",
  "student-vibrant.css",
  "learn-games.css",
  "skills-block-quest.css",
  "pal-worlds.css"
];

// The letter-writing demo is a TEACHING animation - it models how to form the
// letter. Per the improvement-loop fundamentals it must play even when macOS
// Reduce Motion is on, so it must NEVER be gated inside a reduced-motion block.
const TEACHING_SELECTOR = ".letter-writer";

// Return every `@media (prefers-reduced-motion: reduce) { ... }` block body.
function reducedMotionBlocks(css) {
  const blocks = [];
  const marker = "prefers-reduced-motion";
  let from = 0;
  for (;;) {
    const at = css.indexOf(marker, from);
    if (at === -1) break;
    const open = css.indexOf("{", at);
    if (open === -1) break;
    let depth = 1;
    let i = open + 1;
    for (; i < css.length && depth > 0; i += 1) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") depth -= 1;
    }
    blocks.push(css.slice(open + 1, i - 1));
    from = i;
  }
  return blocks;
}

test("the letter-writing teaching animation is never disabled by reduced-motion", () => {
  for (const file of CHILD_STYLES) {
    let css;
    try {
      css = readFileSync(join(stylesDir, file), "utf8");
    } catch {
      continue; // file optional / renamed - skip rather than fail spuriously
    }
    for (const body of reducedMotionBlocks(css)) {
      assert.ok(!body.includes(TEACHING_SELECTOR),
        `${file}: "${TEACHING_SELECTOR}" (teaching animation) is inside a prefers-reduced-motion block and would be silenced`);
    }
  }
});
