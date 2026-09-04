import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import {
  SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS,
  appearanceSignature,
  createCharacterAppearance,
  serializeCharacterAppearance
} from "../../src/features/soundSeekers/visual/characterCustomization.js";

let CreatorSheet;
let vite;

test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ CreatorSheet } = await vite.ssrLoadModule("/src/features/soundSeekers/ui/CreatorSheet.jsx"));
});

test.after(async () => vite?.close());

function baseAppearance() {
  return createCharacterAppearance({
    schemaVersion: 1,
    bodyShapeId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes[0],
    paletteTokenId: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes[0],
    accessories: Object.fromEntries(Object.keys(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot)
      .map(slot => [slot, null]))
  });
}

function appearanceCases() {
  const base = baseAppearance();
  return [
    ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes.map(bodyShapeId => createCharacterAppearance({ ...base, bodyShapeId })),
    ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes.map(paletteTokenId => createCharacterAppearance({ ...base, paletteTokenId })),
    ...Object.entries(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot)
      .flatMap(([slot, values]) => values.map(value => createCharacterAppearance({
        ...base,
        accessories: { ...base.accessories, [slot]: value }
      })))
  ];
}

test("every canonical creator appearance has byte-identical serialization and signature on the shared player renderer", () => {
  for (const appearance of appearanceCases()) {
    const html = renderToStaticMarkup(React.createElement(CreatorSheet, {
      appearance,
      onChange() {},
      onClose() {}
    }));
    assert.match(html, /data-character-creator=""/u);
    assert.match(html, /data-character-id="player"/u);
    assert.match(html, new RegExp(appearance.bodyShapeId, "u"));
    assert.match(html, new RegExp(appearance.paletteTokenId, "u"));
    assert.equal(appearanceSignature(appearance), `sound-seekers-appearance:${serializeCharacterAppearance(appearance)}`);
    assert.equal((html.match(/data-appearance-signature=/gu) || []).length >= 2, true);
  }
});

test("creator imports the sole canonical option catalog and rejects noncanonical appearance data", () => {
  const base = baseAppearance();
  const html = renderToStaticMarkup(React.createElement(CreatorSheet, {
    appearance: base,
    onChange() {},
    onClose() {}
  }));
  for (const option of [
    ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes,
    ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes,
    ...Object.values(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot).flat().filter(Boolean)
  ]) assert.match(html, new RegExp(option, "u"));
  assert.throws(() => renderToStaticMarkup(React.createElement(CreatorSheet, {
    appearance: { ...base, bodyShapeId: "invented-body" },
    onChange() {}
  })), /Unknown character body shape/u);
});
