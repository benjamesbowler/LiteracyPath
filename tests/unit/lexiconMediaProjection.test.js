import assert from "node:assert/strict";
import test from "node:test";

import {
  getLexiconMediaEntry,
  lexiconMediaRows
} from "../../src/content/lexicon/lexiconMediaIndex.generated.js";
import { masterWordLexicon } from "../../src/content/lexicon/masterWordLexicon.js";

test("browser lexicon media projection exactly matches build-time media entries", () => {
  const expected = masterWordLexicon
    .filter(entry => entry.imageUrl || entry.audioUrl)
    .map(entry => [
      entry.lowercaseWord,
      entry.imageUrl || "",
      entry.audioUrl || "",
      entry.source || "existing-media"
    ])
    .sort((left, right) => left[0].localeCompare(right[0]));
  assert.deepEqual(lexiconMediaRows, expected);
});

test("browser lexicon lookup retains media without loading assessment banks", () => {
  for (const [word, imageUrl, audioUrl, source] of lexiconMediaRows) {
    assert.deepEqual(getLexiconMediaEntry(word), { word, imageUrl, audioUrl, source });
  }
  assert.equal(getLexiconMediaEntry("not-a-real-lexicon-word"), null);
});
