import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../../src/features/soundSeekers/visual/visualTokens.js";
import {
  SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS,
  appearanceSignature,
  createCharacterAppearance,
  deserializeCharacterAppearance,
  serializeCharacterAppearance
} from "../../src/features/soundSeekers/visual/characterCustomization.js";

let SoundSeekersCharacter;
let SoundSeekersCharacterCreator;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ SoundSeekersCharacter } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/CharacterSystem.jsx"
  ));
  ({ SoundSeekersCharacterCreator } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/CharacterCreator.jsx"
  ));
});

test.after(async () => {
  await vite?.close();
});

function assertRecursivelyFrozen(value) {
  if (value === null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) assertRecursivelyFrozen(child);
}

function withHiddenExtra(value) {
  const copy = { ...value };
  Object.defineProperty(copy, "hiddenExtra", { value: true, enumerable: false });
  return copy;
}

function withAccessor(value, key) {
  const copy = { ...value };
  const current = value[key];
  Object.defineProperty(copy, key, { get: () => current, enumerable: true });
  return copy;
}

const EMPTY_ACCESSORIES = Object.freeze({ back: null, head: null, neck: null, held: null });
const FULL_PLAYER_APPEARANCE = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: "body-shape-kite",
  paletteTokenId: "player-palette-river",
  accessories: {
    back: "gear-back-field-pack",
    head: "gear-head-star-band",
    neck: "gear-neck-seed-charm",
    held: "gear-held-field-journal"
  }
});

function resolvedElements(node) {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (Array.isArray(node)) return node.flatMap(resolvedElements);
  if (!React.isValidElement(node)) return [];
  if (typeof node.type === "function") return resolvedElements(node.type(node.props));
  return [node, ...resolvedElements(node.props.children)];
}

function characterMarkup(html) {
  const match = html.match(/<figure\b[^>]*data-sound-seekers-character=""[\s\S]*?<\/figure>/u);
  assert.ok(match, "rendered output must include the shared character subtree");
  return match[0];
}

function appearance(overrides = {}) {
  return {
    schemaVersion: 1,
    bodyShapeId: "body-shape-sprout",
    paletteTokenId: "player-palette-sunrise",
    accessories: { ...EMPTY_ACCESSORIES },
    ...overrides
  };
}

test("creator options are the one recursively frozen validation iterable", () => {
  assertRecursivelyFrozen(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS);
  assert.deepEqual(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS, {
    bodyShapes: [
      "body-shape-sprout", "body-shape-pebble", "body-shape-kite", "body-shape-bell"
    ],
    palettes: [
      "player-palette-sunrise", "player-palette-moss", "player-palette-river",
      "player-palette-sky", "player-palette-plum", "player-palette-berry"
    ],
    accessoriesBySlot: {
      back: [null, "gear-back-field-pack", "gear-back-leaf-cape", "gear-back-map-roll"],
      head: [null, "gear-head-leaf-cap", "gear-head-sun-visor", "gear-head-star-band"],
      neck: [null, "gear-neck-scout-scarf", "gear-neck-seed-charm", "gear-neck-river-knot"],
      held: [null, "gear-held-listening-shell", "gear-held-seed-lantern", "gear-held-field-journal"]
    }
  });
  assert.deepEqual(Object.keys(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS), [
    "bodyShapes", "palettes", "accessoriesBySlot"
  ]);
  assert.deepEqual(Object.keys(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot), [
    "back", "head", "neck", "held"
  ]);
  for (const paletteTokenId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes) {
    assert.equal(typeof SOUND_SEEKERS_VISUAL_TOKENS[paletteTokenId], "string");
  }
});

test("every creator option round-trips through one canonical appearance contract", () => {
  for (const bodyShapeId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes) {
    for (const paletteTokenId of SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes) {
      for (const [slot, options] of Object.entries(
        SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot
      )) {
        for (const accessoryId of options) {
          const accessories = { ...EMPTY_ACCESSORIES, [slot]: accessoryId };
          const normalized = createCharacterAppearance({
            schemaVersion: 1,
            bodyShapeId,
            paletteTokenId,
            accessories
          });
          const serialized = serializeCharacterAppearance(normalized);
          const resumed = deserializeCharacterAppearance(serialized);
          assert.deepEqual(resumed, normalized);
          assert.equal(appearanceSignature(resumed), appearanceSignature(normalized));
          assertRecursivelyFrozen(resumed);
        }
      }
    }
  }
});

test("normalization keeps all four cosmetic slots in stable order", () => {
  const raw = appearance({
    accessories: {
      held: "gear-held-listening-shell",
      neck: "gear-neck-seed-charm",
      head: "gear-head-star-band",
      back: "gear-back-field-pack"
    }
  });
  const normalized = createCharacterAppearance(raw);

  assert.notStrictEqual(normalized, raw);
  assert.deepEqual(Object.keys(normalized), [
    "schemaVersion", "bodyShapeId", "paletteTokenId", "accessories"
  ]);
  assert.deepEqual(Object.keys(normalized.accessories), ["back", "head", "neck", "held"]);
  assertRecursivelyFrozen(normalized);
  assert.equal(
    serializeCharacterAppearance(normalized),
    "{\"schemaVersion\":1,\"bodyShapeId\":\"body-shape-sprout\",\"paletteTokenId\":\"player-palette-sunrise\",\"accessories\":{\"back\":\"gear-back-field-pack\",\"head\":\"gear-head-star-band\",\"neck\":\"gear-neck-seed-charm\",\"held\":\"gear-held-listening-shell\"}}"
  );
});

test("appearance validation rejects structural, allowlist, slot, type, and duplicate failures", () => {
  const valid = appearance();
  const cases = [
    null,
    {},
    { ...valid, extra: true },
    withHiddenExtra(valid),
    { ...valid, [Symbol("extra")]: true },
    withAccessor(valid, "bodyShapeId"),
    { ...valid, schemaVersion: 2 },
    { ...valid, bodyShapeId: "body-shape-unknown" },
    { ...valid, paletteTokenId: "player-palette-unknown" },
    { ...valid, accessories: { back: null, head: null, neck: null } },
    { ...valid, accessories: { ...valid.accessories, pocket: null } },
    { ...valid, accessories: withHiddenExtra(valid.accessories) },
    { ...valid, accessories: { ...valid.accessories, [Symbol("extra")]: true } },
    { ...valid, accessories: withAccessor(valid.accessories, "back") },
    { ...valid, accessories: { ...valid.accessories, back: 4 } },
    { ...valid, accessories: { ...valid.accessories, back: "gear-head-leaf-cap" } }
  ];

  for (const invalid of cases) {
    assert.throws(() => createCharacterAppearance(invalid), /appearance|accessor|schema|body|palette/u);
  }
  assert.throws(() => createCharacterAppearance({
    ...valid,
    accessories: {
      ...valid.accessories,
      back: "gear-back-field-pack",
      head: "gear-back-field-pack"
    }
  }), /Duplicate character accessory/u);
});

test("deserialization accepts canonical JSON only", () => {
  const normalized = createCharacterAppearance(appearance());
  const canonical = serializeCharacterAppearance(normalized);

  assert.deepEqual(deserializeCharacterAppearance(canonical), normalized);
  for (const invalid of [
    ` ${canonical}`,
    `${canonical}\n`,
    JSON.stringify({
      bodyShapeId: normalized.bodyShapeId,
      schemaVersion: normalized.schemaVersion,
      paletteTokenId: normalized.paletteTokenId,
      accessories: normalized.accessories
    }),
    "not-json",
    4
  ]) {
    assert.throws(() => deserializeCharacterAppearance(invalid), /canonical|serialized|appearance/u);
  }
});

test("appearance signatures are stable and change with every cosmetic dimension", () => {
  const base = createCharacterAppearance(appearance());
  assert.equal(appearanceSignature(base), appearanceSignature(deserializeCharacterAppearance(
    serializeCharacterAppearance(base)
  )));

  const variants = [
    appearance({ bodyShapeId: "body-shape-pebble" }),
    appearance({ paletteTokenId: "player-palette-moss" }),
    appearance({ accessories: { ...EMPTY_ACCESSORIES, back: "gear-back-field-pack" } }),
    appearance({ accessories: { ...EMPTY_ACCESSORIES, head: "gear-head-leaf-cap" } }),
    appearance({ accessories: { ...EMPTY_ACCESSORIES, neck: "gear-neck-scout-scarf" } }),
    appearance({ accessories: { ...EMPTY_ACCESSORIES, held: "gear-held-listening-shell" } })
  ].map(createCharacterAppearance);

  assert.equal(new Set([base, ...variants].map(appearanceSignature)).size, variants.length + 1);
});

test("creator SSR exposes one native 56px control for every canonical option", () => {
  const html = renderToStaticMarkup(React.createElement(SoundSeekersCharacterCreator, {
    value: FULL_PLAYER_APPEARANCE,
    onChange: () => {}
  }));
  const optionCount = SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes.length
    + SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes.length
    + Object.values(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot)
      .reduce((total, options) => total + options.length, 0);

  assert.match(html, /<section[^>]*aria-label="Make your Sound Seeker"/u);
  assert.equal((html.match(/<fieldset\b/gu) ?? []).length, 6);
  assert.equal((html.match(/<legend>/gu) ?? []).length, 6);
  assert.equal((html.match(/<button\b/gu) ?? []).length, optionCount);
  assert.equal((html.match(/type="button"/gu) ?? []).length, optionCount);
  assert.equal((html.match(/data-min-css-px="56"/gu) ?? []).length, optionCount);
  assert.equal((html.match(/aria-pressed="true"/gu) ?? []).length, 6);
  assert.equal((html.match(/aria-label="[^"]+"/gu) ?? []).length, optionCount + 2);
});

test("creator preview and world render one byte-identical normalized character subtree", () => {
  const creatorHtml = renderToStaticMarkup(React.createElement(SoundSeekersCharacterCreator, {
    value: FULL_PLAYER_APPEARANCE,
    onChange: () => {}
  }));
  const worldHtml = renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
    characterId: "player",
    pose: "idle",
    appearance: FULL_PLAYER_APPEARANCE
  }));

  assert.match(creatorHtml, /data-character-context="creator-preview"/u);
  assert.equal(characterMarkup(creatorHtml), worldHtml);
  const encodedSignature = appearanceSignature(FULL_PLAYER_APPEARANCE).replaceAll('"', "&quot;");
  assert.ok(worldHtml.includes(`data-appearance-signature="${encodedSignature}"`));
  for (const accessoryId of Object.values(FULL_PLAYER_APPEARANCE.accessories)) {
    assert.match(worldHtml, new RegExp(`data-accessory-id="${accessoryId}"`, "u"));
  }
});

test("every creator choice reaches the sole normalized onChange path", () => {
  const changes = [];
  const tree = SoundSeekersCharacterCreator({
    value: FULL_PLAYER_APPEARANCE,
    onChange: value => changes.push(value)
  });
  const buttons = resolvedElements(tree).filter(element => element.type === "button");
  const choose = optionId => {
    const button = buttons.find(element => element.props["data-option-id"] === optionId);
    assert.ok(button, `missing creator choice ${optionId}`);
    button.props.onClick();
    assert.equal(changes.length, 1);
    const [next] = changes.splice(0);
    assertRecursivelyFrozen(next);
    assert.deepEqual(next, createCharacterAppearance(next));
    return next;
  };

  assert.equal(choose("body-shape-bell").bodyShapeId, "body-shape-bell");
  assert.equal(choose("player-palette-plum").paletteTokenId, "player-palette-plum");
  assert.equal(choose("gear-head-leaf-cap").accessories.head, "gear-head-leaf-cap");
  assert.equal(choose("none").accessories.back, null);

  const source = readFileSync(new URL(
    "../../src/features/soundSeekers/visual/CharacterCreator.jsx",
    import.meta.url
  ), "utf8");
  assert.equal((source.match(/\bonChange\(/gu) ?? []).length, 1);
});

test("creator rejects invalid saved appearance and a missing callback before rendering", () => {
  for (const invalidValue of [
    withHiddenExtra(FULL_PLAYER_APPEARANCE),
    { ...FULL_PLAYER_APPEARANCE, [Symbol("extra")]: true },
    withAccessor(FULL_PLAYER_APPEARANCE, "bodyShapeId"),
    {
      ...FULL_PLAYER_APPEARANCE,
      accessories: withHiddenExtra(FULL_PLAYER_APPEARANCE.accessories)
    },
    {
      ...FULL_PLAYER_APPEARANCE,
      accessories: { ...FULL_PLAYER_APPEARANCE.accessories, [Symbol("extra")]: true }
    },
    {
      ...FULL_PLAYER_APPEARANCE,
      accessories: withAccessor(FULL_PLAYER_APPEARANCE.accessories, "head")
    }
  ]) {
    assert.throws(
      () => renderToStaticMarkup(React.createElement(SoundSeekersCharacterCreator, {
        value: invalidValue,
        onChange: () => {}
      })),
      /appearance|accessories/u
    );
  }
  assert.throws(
    () => renderToStaticMarkup(React.createElement(SoundSeekersCharacterCreator, {
      value: FULL_PLAYER_APPEARANCE
    })),
    /onChange/u
  );
});
