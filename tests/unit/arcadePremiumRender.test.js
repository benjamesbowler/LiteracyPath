import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";

import {
  ArcadePremiumRenderPipeline,
  arcadeRenderProfile
} from "../../src/components/learn/games/shared/arcadePremiumRender.js";

function makeDirectHarness() {
  const canvas = { dataset: {} };
  let directRenders = 0;
  const renderer = {
    autoClear: true,
    capabilities: { getMaxAnisotropy: () => 8 },
    domElement: canvas,
    getContext: () => null,
    render: () => { directRenders += 1; }
  };
  const scene = {
    environment: null,
    environmentIntensity: 1,
    traverse: () => {}
  };
  const pipeline = new ArcadePremiumRenderPipeline({
    THREE,
    renderer,
    scene,
    camera: {},
    tier: "low"
  });
  return { canvas, pipeline, renderer, scene, renders: () => directRenders };
}

test("Arcade premium rendering scales image quality without removing the low-power path", () => {
  assert.deepEqual(
    ["low", "medium", "high"].map(tier => arcadeRenderProfile(tier).id),
    ["performance", "enhanced", "cinematic"]
  );
  assert.equal(arcadeRenderProfile("low").postEffects, false);
  assert.equal(arcadeRenderProfile("medium").effectLabel, "smaa-bloom");
  assert.equal(arcadeRenderProfile("high").effectLabel, "smaa-ssao-bloom");
  assert.equal(arcadeRenderProfile("high").shadowSize, 2048);
  assert.equal(arcadeRenderProfile("high", { softwareRenderer: true }).id, "performance");
});

test("all four live WebGL Arcade games use and dispose the premium renderer", () => {
  const games = [
    "RocketRunGame.jsx",
    "SoundRacerGame.jsx",
    "GrammarGrindGame.jsx",
    "StarGalleryArcadeGame.jsx"
  ];
  for (const game of games) {
    const source = fs.readFileSync(`src/components/learn/games/games/${game}`, "utf8");
    assert.match(source, /createArcadePremiumRenderPipeline/);
    assert.match(source, /premiumRender\.render\(/);
    assert.match(source, /premiumRender\.destroy\(\)/);
    assert.doesNotMatch(source, /renderer\.render\(scene, camera\)/);
  }
});

test("material preparation changes texture sampling once instead of re-uploading it", () => {
  const { pipeline } = makeDirectHarness();
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

  pipeline.prepareObject(mesh);
  const preparedVersion = texture.version;
  pipeline.prepareObject(mesh);

  assert.equal(texture.anisotropy, 2);
  assert.equal(texture.version, preparedVersion);
  mesh.geometry.dispose();
  material.dispose();
  texture.dispose();
  pipeline.destroy();
});

test("a lazy composer failure demotes once, frees premium targets and keeps direct rendering", () => {
  const { canvas, pipeline, renderer, scene, renders } = makeDirectHarness();
  let composerDisposals = 0;
  let targetDisposals = 0;
  let pmremDisposals = 0;
  pipeline.tier = "high";
  pipeline.profile = arcadeRenderProfile("high");
  pipeline.composer = {
    render: () => { throw new Error("fault injection"); },
    dispose: () => { composerDisposals += 1; }
  };
  pipeline.bloom = { selection: { clear: () => {} } };
  pipeline.environment = { isTexture: true };
  pipeline.environmentTarget = { dispose: () => { targetDisposals += 1; } };
  pipeline.pmrem = { dispose: () => { pmremDisposals += 1; } };
  scene.environment = pipeline.environment;

  assert.equal(pipeline.render(0.016), "low");
  assert.equal(pipeline.render(0.016), "low");

  assert.equal(composerDisposals, 1);
  assert.equal(targetDisposals, 1);
  assert.equal(pmremDisposals, 1);
  assert.equal(renders(), 2);
  assert.equal(renderer.autoClear, true);
  assert.equal(canvas.dataset.arcadeRenderProfile, "performance");
  assert.equal(canvas.dataset.arcadeRenderFallback, "true");
  pipeline.destroy();
});

test("bloom refresh drops transient objects that are no longer in the live scene", () => {
  const { pipeline, scene } = makeDirectHarness();
  const liveObjects = [];
  const selected = new Set();
  scene.traverse = visit => liveObjects.forEach(object => object.traverse(visit));
  pipeline.bloom = {
    selection: {
      add: object => selected.add(object),
      clear: () => selected.clear()
    }
  };
  const makeGlow = () => new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ blending: THREE.AdditiveBlending })
  );
  const first = makeGlow();
  const second = makeGlow();
  liveObjects.push(first, second);

  pipeline.refreshBloomSelection(scene);
  assert.deepEqual([...selected], [first, second]);
  liveObjects.splice(0, 1);
  pipeline.refreshBloomSelection(scene);
  assert.deepEqual([...selected], [second]);

  for (const object of [first, second]) {
    object.geometry.dispose();
    object.material.dispose();
  }
  pipeline.destroy();
});
