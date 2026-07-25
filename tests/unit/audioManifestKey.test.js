import assert from "node:assert/strict";
import test from "node:test";

import { getGeneratedAudioKey } from "../../src/utils/audioManifestKey.js";

test("runtime audio keys retain the generator's SHA-1 naming contract", async () => {
  assert.equal(await getGeneratedAudioKey("hut"), "00020d3566aefa77");
  assert.equal(await getGeneratedAudioKey("sour"), "000b4b94cb03a48b");
  assert.equal(await getGeneratedAudioKey(""), "");
});
