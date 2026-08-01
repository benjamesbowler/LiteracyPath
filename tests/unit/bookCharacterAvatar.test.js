import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import {
  bookCharacterAsset,
  bookCharacterOutfit
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
  assert.equal(asset, "/game-assets/sound-seekers/characters/muddy/outfit-willow-wand.webp");
  assert.ok(existsSync(`public${asset}`));
});

test("every outfit is a complete character-specific illustration", () => {
  const outfits = [
    ["head", "leaf-cap", "outfit-leaf-cloak"],
    ["head", "acorn-hat", "outfit-acorn-hat"],
    ["back", "moth-wings", "outfit-moth-wings"],
    ["neck", "vine-scarf", "outfit-vine-scarf"],
    ["held", "stone-staff", "outfit-willow-wand"]
  ];
  for (const body of ["tuft", "pebble", "moth"]) {
    const characterFolder = body === "tuft" ? "muddy" : body === "pebble" ? "chompy" : "pip";
    for (const [slot, id, filename] of outfits) {
      const asset = bookCharacterAsset({ body, equipped: { [slot]: id } });
      assert.equal(asset, `/game-assets/sound-seekers/characters/${characterFolder}/${filename}.webp`);
      assert.ok(existsSync(`public${asset}`), `${characterFolder}/${filename} is missing`);
    }
  }
});

test("legacy multi-item saves render one deterministic finished outfit", () => {
  assert.deepEqual(bookCharacterOutfit(fullyDressed), {
    id: "stone-staff",
    slot: "held",
    assetName: "outfit-willow-wand"
  });
});
