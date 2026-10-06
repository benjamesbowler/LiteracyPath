import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { composeGroveCamera } from '../../src/components/learn/games/games/starGalleryCameraComposition.js';

test('portrait and short framing show every physical choice below the actual prompt without moving the vehicle or trees', () => {
  const labels = [[-14, 3, 18], [0, 3, 23], [14, 3, 18]], player = [0, 0, 0];
  const before = structuredClone({ labels, player });
  for (const [width, height, promptBottom] of [[1280, 800, 87], [320, 780, 174], [568, 320, 140]]) {
    const narrow = width < 650, camera = new THREE.PerspectiveCamera(narrow ? 66 : 58, width / height, .1, 220);
    camera.position.set(0, narrow ? 13 : 9.2, narrow ? -19 : -14.6); camera.lookAt(0, 1.9, 4.6);
    const framing = composeGroveCamera(THREE, camera, { width, height, promptBottom, labels, player });
    assert(framing.zoom > 0 && framing.zoom <= 1); assert(framing.shift >= 0);
    for (const label of labels) {
      const point = new THREE.Vector3(...label).project(camera), x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
      assert(x >= 24 && x <= width - 24, `actual horizontal choice centre ${x} fits ${width}`);
      assert(y >= promptBottom + 25.9, `label ${y} clears actual card bottom ${promptBottom}`);
      assert(point.z >= -1 && point.z < 1);
    }
    const foot = new THREE.Vector3(...player).project(camera);
    assert((1 - foot.y) * height / 2 <= height - 19.9, 'actual vehicle sole plane stays in view');
  }
  assert.deepEqual({ labels, player }, before);
});

test('a real steering turn ignores choices behind the camera and retains a finite ordinary view', () => {
  const camera = new THREE.PerspectiveCamera(66, 320 / 780, .1, 220);
  camera.position.set(0, 13, -19); camera.lookAt(0, 1.9, 4.6);
  const pose = composeGroveCamera(THREE, camera, { width: 320, height: 780, promptBottom: 176, labels: [[0, 3, -70]], player: [0, 0, 0] });
  assert.equal(pose.zoom, 1); assert.equal(pose.shift, 0); assert(camera.projectionMatrix.elements.every(Number.isFinite));
});
