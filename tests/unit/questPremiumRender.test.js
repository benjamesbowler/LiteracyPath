import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import {
  createBeveledLetterToken,
  disposeQuestScene,
  isPhonicsTokenSpec
} from "../../src/components/quest/world/questPremiumRender.js";

const fontJson = JSON.parse(readFileSync(
  new URL("../../public/fonts/quest/helvetiker_bold.typeface.json", import.meta.url),
  "utf8"
));
const font = new FontLoader().parse(fontJson);

test("phonics token selection is limited to compact labels on learning objects", () => {
  assert.equal(isPhonicsTokenSpec({ shape: "bridge-plank", label: "h" }), true);
  assert.equal(isPhonicsTokenSpec({ shape: "cake", label: "ship" }), true);
  assert.equal(isPhonicsTokenSpec({ shape: "awakened-lantern", value: "a", showToken: false }), false);
  assert.equal(isPhonicsTokenSpec({ shape: "trail-object", label: "green" }), false);
  assert.equal(isPhonicsTokenSpec({ shape: "story-path", label: "go home" }), false);
});

test("letter token factory creates beveled physical meshes and a world HUD anchor", () => {
  const token = createBeveledLetterToken({ font, text: "sh", order: 2 });
  token.position.set(3, 1, -4);
  token.updateMatrixWorld(true);

  const meshes = [];
  token.traverse(object => {
    if (object.isMesh) meshes.push(object);
  });
  assert.equal(meshes.length, 3);
  assert.ok(meshes.every(mesh => mesh.material.isMeshPhysicalMaterial));
  assert.ok(meshes.every(mesh => mesh.material.metalness === 0));
  assert.equal(meshes.find(mesh => mesh.geometry.type === "TextGeometry").geometry.parameters.options.bevelEnabled, true);
  assert.deepEqual(token.userData.updateHudWorldPosition().toArray().map(value => Number(value.toFixed(2))), [3, 1.62, -4]);
  assert.equal(token.userData.allocations.geometries.length, 3);
  assert.equal(typeof token.userData.dispose, "function");
});

test("quest scene disposal releases owned allocations and clears the graph", () => {
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const texture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  texture.userData.questOwned = true;
  const material = new THREE.MeshPhysicalMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  let geometryDisposed = false;
  let materialDisposed = false;
  let textureDisposed = false;
  geometry.addEventListener("dispose", () => { geometryDisposed = true; });
  material.addEventListener("dispose", () => { materialDisposed = true; });
  texture.addEventListener("dispose", () => { textureDisposed = true; });
  scene.add(mesh);

  disposeQuestScene(scene);

  assert.equal(geometryDisposed, true);
  assert.equal(materialDisposed, true);
  assert.equal(textureDisposed, true);
  assert.equal(scene.children.length, 0);
});
