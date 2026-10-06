import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSentenceGroveCanvasSurface } from '../../src/components/learn/games/games/starGalleryCanvasSurface.js';

function drawingSurface() {
  const labels = [], ink = {};
  const context = new Proxy({ measureText: text => {
    const size = Number(/([\d.]+)px/.exec(ink.font)?.[1] || 18);
    return { width: String(text).length * size * .6, actualBoundingBoxAscent: size * .7, actualBoundingBoxDescent: size * .1 };
  },
    createLinearGradient: () => ({ addColorStop() {} }),
    fillText: (text, x, y) => labels.push({ text, x, y, fill: ink.fillStyle }) }, {
    get: (target, key) => key in target ? target[key] : key in ink ? ink[key] : () => {},
    set: (_target, key, value) => { ink[key] = value; return true; }
  });
  return { canvas: { getContext: () => context, width: 1, height: 1 }, labels };
}

test('Grove Canvas recovery retains the real controller/camera and equally styled projected choices in every canonical world', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const { canvas, labels } = drawingSurface(), root = new THREE.Group();
    const vehicle = new THREE.Group(), seatMaterial = new THREE.MeshBasicMaterial({ color: '#18263E' }); seatMaterial.name = 'Seat';
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1, .18, .8), seatMaterial);
    seat.userData.groveFallbackSeat = true; seat.position.set(0, 1.17, .35); vehicle.add(seat); vehicle.position.set(0, .1, 6); root.add(vehicle);
    const tokens = ['is', 'are', 'am'].map((label, index) => {
      const group = new THREE.Group(), labelMesh = new THREE.Object3D(); group.position.set((index - 1) * 4, 0, 0);
      labelMesh.position.y = 3; group.add(labelMesh); root.add(group);
      return { label, group, labelMesh, smashed: false };
    });
    const state = { level: { world }, worldRoot: root, vehicle, tokens, hazards: [], restoredPlants: [],
      steerVisual: .3, cutterRemaining: .12, invulnerable: 0, learning: { firstResponses: [], completions: [] } };
    const camera = new THREE.PerspectiveCamera(56, 1024 / 768, .1, 220);
    camera.position.set(0, 14, 22); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
    const before = { position: vehicle.position.clone(), learning: structuredClone(state.learning), choices: tokens.map(token => token.label) };
    let time = 12;
    const surface = createSentenceGroveCanvasSurface(THREE, { canvas, atlases: null, camera: () => camera,
      getState: () => state, getTheme: () => ({ sky: '#83C4EF', fog: '#D7E7F5', ground: '#527C49' }), getTime: () => time });
    surface.renderer.setSize(1024, 768); assert.equal(surface.pipeline.render(), 'low');
    const actual = surface.inspect();
    assert.equal(actual.world, world); assert.equal(actual.representation, 'same-controller-authored-canvas-recovery');
    assert.equal(actual.driver.representation, 'procedural-art-unavailable'); assert.equal(actual.driver.delivery, 'unavailable');
    assert.equal(actual.driver.palms, null, 'unavailable source art never creates fabricated rear-driver hand sockets');
    assert.equal(actual.labels.length, 3); assert.deepEqual(labels.map(row => row.text), before.choices);
    assert.equal(new Set(labels.map(row => row.fill)).size, 1, 'response correctness cannot mark a tree visually');
    for (const [index, label] of actual.labels.entries()) {
      const point = tokens[index].labelMesh.getWorldPosition(new THREE.Vector3()).project(camera);
      assert.ok(Math.abs(label.anchor.x - (point.x + 1) * 512) < 1e-8);
      assert.ok(Math.abs(label.anchor.y - (1 - point.y) * 384) < 1e-8);
      assert(label.glyphPixels >= 18); assert(label.bounds.x >= 6 && label.bounds.right <= 1018);
      assert(label.bounds.y >= 6 && label.bounds.bottom <= 684);
    }
    vehicle.position.x = 3; time = 13; surface.pipeline.render();
    assert.notDeepEqual(surface.inspect().driver.screenSeat, actual.driver.screenSeat, 'a real controller movement changes the drawn seat');
    assert.deepEqual(state.learning, before.learning); assert.deepEqual(tokens.map(token => token.label), before.choices);
    assert.equal(state.cutterRemaining, .12, 'drawing never consumes the cut clock');
    surface.pipeline.destroy(); surface.renderer.dispose(); assert.equal(surface.inspect(), null);
    assert.equal(canvas.width, 1); assert.equal(canvas.height, 1);
    root.traverse(mesh => { mesh.geometry?.dispose(); mesh.material?.dispose(); });
  }
});
