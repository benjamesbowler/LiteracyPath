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
    assert.ok(wearable.layout, `${wearable.id} has no body-specific anchor`);
    assert.ok(wearable.layout.width > 0 && wearable.layout.height > 0, `${wearable.id} has an invalid size`);
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

test("every book character has coherent anchors for every simultaneous wearable slot", () => {
  for (const body of ["tuft", "pebble", "moth"]) {
    const wearables = bookCharacterWearables({ ...fullyDressed, body });
    assert.equal(wearables.length, 4, `${body} lost a wearable slot`);
    assert.deepEqual(wearables.map(item => item.slot), ["back", "head", "neck", "held"]);
    assert.equal(wearables.find(item => item.slot === "back").layout.depth, 0, `${body} wings are not behind the body`);
    assert.ok(wearables.find(item => item.slot === "held").layout.depth > 0, `${body} held item is not in front`);
  }
});
