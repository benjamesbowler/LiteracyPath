import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  addBrowserFullscreenListener,
  exitBrowserFullscreen,
  getBrowserFullscreenElement,
  requestBrowserFullscreen
} from "../../src/utils/browserFullscreen.js";

test("fullscreen helpers support both standard and iPad WebKit APIs", async () => {
  const standardElement = { requestFullscreen() { this.called = true; } };
  assert.equal(await requestBrowserFullscreen(standardElement), true);
  assert.equal(standardElement.called, true);

  const webkitElement = { webkitRequestFullscreen() { this.called = true; } };
  assert.equal(await requestBrowserFullscreen(webkitElement), true);
  assert.equal(webkitElement.called, true);

  const standardDocument = { fullscreenElement: standardElement };
  const webkitDocument = { webkitFullscreenElement: webkitElement };
  assert.equal(getBrowserFullscreenElement(standardDocument), standardElement);
  assert.equal(getBrowserFullscreenElement(webkitDocument), webkitElement);

  const exitDocument = { webkitExitFullscreen() { this.exited = true; } };
  assert.equal(await exitBrowserFullscreen(exitDocument), true);
  assert.equal(exitDocument.exited, true);
});

test("fullscreen change listener covers both browser event names and cleans up", () => {
  const added = [];
  const removed = [];
  const doc = {
    addEventListener(name, listener) { added.push([name, listener]); },
    removeEventListener(name, listener) { removed.push([name, listener]); }
  };
  const listener = () => {};
  const cleanup = addBrowserFullscreenListener(doc, listener);
  assert.deepEqual(added.map(([name]) => name), ["fullscreenchange", "webkitfullscreenchange"]);
  cleanup();
  assert.deepEqual(removed, added);
});

test("the installable iPad app launches without Safari chrome", () => {
  const html = readFileSync("index.html", "utf8");
  const manifestSource = readFileSync("tools/viteQuestOfflinePlugin.mjs", "utf8");
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon\.png"/);
  assert.match(manifestSource, /display:\s*"fullscreen"/);
  assert.match(manifestSource, /display_override:\s*\["fullscreen", "standalone"\]/);
  assert.match(manifestSource, /app-icon-512\.png/);
});
