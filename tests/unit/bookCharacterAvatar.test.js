import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import * as bookCharacters from "../../src/components/quest/bookCharacterAvatar.js";

const {
  BOOK_CHARACTER_BODY_IDS,
  BOOK_CHARACTER_LOOKS,
  BOOK_CHARACTER_OUTFIT_IDS,
  BOOK_CHARACTER_PAINTED_URLS,
  bookCharacterAsset,
  bookCharacterOutfit
} = bookCharacters;

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

test("the visible character catalogue only advertises finished illustrated states", () => {
  assert.deepEqual(BOOK_CHARACTER_BODY_IDS, ["tuft", "pebble", "moth"]);
  assert.deepEqual(BOOK_CHARACTER_OUTFIT_IDS, [
    "leaf-cap",
    "acorn-hat",
    "moth-wings",
    "vine-scarf",
    "stone-staff"
  ]);
  for (const bodyId of BOOK_CHARACTER_BODY_IDS) {
    assert.equal(BOOK_CHARACTER_LOOKS[bodyId].length, 4, `${bodyId} needs four painted colourways`);
    for (const look of BOOK_CHARACTER_LOOKS[bodyId]) {
      const asset = bookCharacterAsset({ body: bodyId, dye: look.id });
      assert.ok(existsSync(`public${asset}`), `${bodyId}/${look.id} points at missing artwork`);
    }
  }
});

test("the canonical painted inventory contains every possible book-character asset exactly once", () => {
  assert.ok(Array.isArray(BOOK_CHARACTER_PAINTED_URLS));
  assert.equal(Object.isFrozen(BOOK_CHARACTER_PAINTED_URLS), true);
  assert.equal(BOOK_CHARACTER_PAINTED_URLS.length, 51);
  assert.equal(new Set(BOOK_CHARACTER_PAINTED_URLS).size, 51);
  for (const url of BOOK_CHARACTER_PAINTED_URLS) {
    assert.match(url, /^\/game-assets\/sound-seekers\/characters\/(?:muddy|chompy|pip)\/(?:pose|mood|look|outfit)-[a-z-]+\.webp$/u);
    assert.ok(existsSync(`public${url}`), `${url} is missing`);
  }

  const explicitVariants = [
    "look-original", "look-honey", "look-moon", "look-woodland",
    "mood-happy", "mood-excited", "mood-thoughtful", "mood-brave",
    "pose-ready", "pose-walking", "pose-cheering", "pose-thinking"
  ];
  const outfitCases = [
    ["head", "leaf-cap"], ["head", "acorn-hat"], ["back", "moth-wings"],
    ["neck", "vine-scarf"], ["held", "stone-staff"]
  ];
  const everyAuthorityResult = BOOK_CHARACTER_BODY_IDS.flatMap(body => [
    ...explicitVariants.map(visualVariant => bookCharacterAsset({ body, visualVariant })),
    ...outfitCases.map(([slot, id]) => bookCharacterAsset({ body, equipped: { [slot]: id } })),
    bookCharacterAsset({ body, pose: "walk" }),
    bookCharacterAsset({ body, eyes: "eyes-wide" }),
    ...BOOK_CHARACTER_LOOKS[body].map(look => bookCharacterAsset({ body, dye: look.id }))
  ]);
  assert.equal(everyAuthorityResult.every(url => BOOK_CHARACTER_PAINTED_URLS.includes(url)), true);
  assert.deepEqual([...new Set(everyAuthorityResult)].sort(), [...BOOK_CHARACTER_PAINTED_URLS].sort());
});
