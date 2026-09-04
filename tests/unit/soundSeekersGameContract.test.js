import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { HEROES } from "../../src/features/soundSeekers/v3/content/cast.js";
import { createProgress } from "../../src/features/soundSeekers/v3/engine/progress.js";

let SoundSeekersV3;
let vite;

test.before(async () => {
  vite = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
  ({ default: SoundSeekersV3 } = await vite.ssrLoadModule("/src/features/soundSeekers/v3/SoundSeekersV3.jsx"));
});

test.after(async () => vite?.close());

const noop = () => {};
const renderGame = progress => renderToStaticMarkup(React.createElement(SoundSeekersV3, {
  progressScopeKey: "sound-seekers-contract",
  isSoundEnabled: false,
  onExit: noop,
  accessibilitySettings: {},
  loadProgress: () => progress,
  saveProgress: noop
}));

function count(html, marker) {
  return (html.match(new RegExp(marker, "gu")) || []).length;
}

test("current Story Trail exposes the complete child-surface contract at hero selection", () => {
  const html = renderGame(createProgress());

  assert.match(html, /data-child-surface="sound-seekers"/u);
  assert.equal(count(html, "data-child-title="), 1);
  assert.equal(count(html, "data-child-instruction="), 1);
  assert.equal(count(html, "data-child-choices="), 1);
  assert.equal(count(html, "data-child-progress="), 1);
  assert.equal(count(html, "data-child-primary="), 1);
  assert.match(html, /Who will you be\?/u);
  assert.match(html, /Start the trail/u);
  assert.equal(count(html, "class=\"ss3__hero-card\""), HEROES.length);
});

test("current Story Trail exposes the complete child-surface contract on the map", () => {
  const progress = { ...createProgress(), heroChosen: true };
  const html = renderGame(progress);

  assert.match(html, /data-child-surface="sound-seekers"/u);
  assert.equal(count(html, "data-child-title="), 1);
  assert.equal(count(html, "data-child-instruction="), 1);
  assert.equal(count(html, "data-child-choices="), 1);
  assert.equal(count(html, "data-child-progress="), 1);
  assert.equal(count(html, "data-child-primary="), 1);
  assert.match(html, /Sound Seekers/u);
  assert.match(html, /Help .* ✋/u);
});
