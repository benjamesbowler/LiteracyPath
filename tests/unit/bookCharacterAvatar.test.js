import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import {
  bookCharacterAsset,
  bookCharacterWearables
} from "../../src/components/quest/bookCharacterAvatar.js";

const fullyDressed = {
  body: "tuft",
  dye: "sand",
  visualVariant: "look-honey",
  equipped: {
    head: "leaf-cap",
    back: "moth-wings",
    neck: "vine-scarf",
    held: "stone-staff"
  }
};

test("book characters use real illustrated state assets", () => {
  const asset = bookCharacterAsset(fullyDressed);
  assert.equal(asset, "/game-assets/sound-seekers/characters/muddy/look-honey.webp");
  assert.ok(existsSync(`public${asset}`));
});

test("character wearables compose across all four independent slots", () => {
  const wearables = bookCharacterWearables(fullyDressed);
  assert.deepEqual(
    wearables.map(item => item.slot),
    ["back", "head", "neck", "held"]
  );
  assert.equal(wearables.length, 4);
  for (const wearable of wearables) {
    assert.ok(existsSync(`public${wearable.asset}`), `${wearable.id} has no real art asset`);
  }

  // Changing the head slot must preserve every other worn item.
  const changedHat = {
    ...fullyDressed,
    equipped: { ...fullyDressed.equipped, head: "acorn-hat" }
  };
  assert.deepEqual(
    bookCharacterWearables(changedHat).map(item => item.id),
    ["moth-wings", "acorn-hat", "vine-scarf", "stone-staff"]
  );
});
