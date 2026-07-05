import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { QUEST_STORY_QUESTIONS } from "../../src/data/generated/questStoryQuestions.generated.js";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "..", "public");

// Story Stop shows the book's cover and asks the child to read the title. A
// missing cover file renders a broken image on a core child surface, so every
// referenced cover must exist on disk.
test("every quest Story Stop cover image exists on disk", () => {
  const covers = new Set();
  for (const world of Object.values(QUEST_STORY_QUESTIONS)) {
    for (const q of world.questions || []) {
      if (q.cover) covers.add(q.cover);
    }
  }
  assert.ok(covers.size > 0, "expected at least one quest cover");
  for (const cover of covers) {
    const onDisk = join(publicDir, cover.replace(/^\//, ""));
    assert.ok(existsSync(onDisk), `quest cover missing on disk: ${cover}`);
  }
});
