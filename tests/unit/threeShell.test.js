import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import {
  loadThree,
  setTextureSrgb
} from "../../src/components/learn/games/shared/threeShell.js";

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
