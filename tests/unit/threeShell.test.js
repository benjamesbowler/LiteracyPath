import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import {
  QUALITY_TIERS,
  loadThree,
  resolveSteerRelease,
  setTextureSrgb
} from "../../src/components/learn/games/shared/threeShell.js";
import {
  createPausableFrameTimer,
  neutralizeArcadeInput
} from "../../src/components/learn/games/shared/frameTiming.js";

test("every 3D arcade surface resolves the shared npm Three.js runtime", async () => {
  assert.equal(await loadThree(), THREE);
  assert.equal(fs.existsSync("src/vendor/three/three.min.js"), false);
});

test("legacy lane-game canvas textures use the current Three.js colour-space API", () => {
  const texture = new THREE.Texture();
  setTextureSrgb(THREE, texture);
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
  texture.dispose();
});

test("3D arcade timing and shadow settings use supported Three.js APIs", () => {
  const sharedSource = fs.readFileSync(
    "src/components/learn/games/shared/threeShell.js",
    "utf8"
  );
  const gallerySource = fs.readFileSync(
    "src/components/learn/games/games/StarGalleryArcadeGame.jsx",
    "utf8"
  );

  assert.equal(QUALITY_TIERS.high.shadowMap, "pcf");
  assert.doesNotMatch(sharedSource, /PCFSoftShadowMap|pcfsoft/);
  assert.doesNotMatch(
    gallerySource,
    /new THREE\.(?:Clock|Timer)|PCFSoftShadowMap|pcfsoft/
  );
  assert.match(gallerySource, /function readFrameDelta\(now\)/);
  assert.match(gallerySource, /const dt = readFrameDelta\(now\);/);
  assert.match(gallerySource, /update\(dt\)/);
  assert.match(gallerySource, /premiumRender\.render\(dt\)/);
  assert.match(gallerySource, /frameTimer\.(?:pause|resume)\(\)/);
});

test("3D arcade timing freezes through pause and resumes from a zero-delta frame", () => {
  const timer = createPausableFrameTimer();
  assert.equal(timer.read(1_000), 0);
  assert.equal(timer.read(1_016), 0.016);
  assert.equal(timer.snapshot().elapsed, 0.016);

  timer.pause();
  assert.equal(timer.read(5_000), 0);
  assert.equal(timer.read(8_000), 0);
  assert.equal(timer.snapshot().elapsed, 0.016);

  timer.resume();
  assert.equal(timer.read(10_000), 0);
  assert.equal(timer.read(10_020), 0.02);
  assert.ok(Math.abs(timer.snapshot().elapsed - 0.036) < 1e-9);
});

test("pausing a 3D arcade surface clears every held keyboard and pointer input", () => {
  const keys = { left: true, right: false, up: true, down: false, boost: true };
  const pointer = { active: true, steer: -0.8, throttle: 1 };
  neutralizeArcadeInput(keys, pointer);
  assert.deepEqual(keys, {
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false
  });
  assert.deepEqual(pointer, { active: false, steer: 0, throttle: 0 });
});

test("shared lane steering resolves taps, cross-zone swipes and drag-away cancellation", () => {
  const rect = { left: 0, right: 120, top: 0, bottom: 200 };
  assert.equal(resolveSteerRelease({ startX: 50, startY: 80, endX: 53, endY: 82, rect, tapDirection: -1 }), -1);
  assert.equal(resolveSteerRelease({ startX: 50, startY: 80, endX: 150, endY: 84, rect, tapDirection: -1 }), 1);
  assert.equal(resolveSteerRelease({ startX: 50, startY: 80, endX: -8, endY: 150, rect, tapDirection: -1 }), 0);
});

test("shared lane steering commits on release and clears every cancellation path", () => {
  const sharedSource = fs.readFileSync(
    "src/components/learn/games/shared/threeShell.js",
    "utf8"
  );
  assert.match(sharedSource, /element\.addEventListener\("pointerup", onUp\)/);
  assert.match(sharedSource, /element\.addEventListener\("pointercancel", clear\)/);
  assert.match(sharedSource, /element\.addEventListener\("lostpointercapture", clear\)/);
  assert.match(sharedSource, /activateDirection\(direction\)/);
  assert.doesNotMatch(sharedSource, /addEventListener\("pointerdown", onLeft\)/);
});
