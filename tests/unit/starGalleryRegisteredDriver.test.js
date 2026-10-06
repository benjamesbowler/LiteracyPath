import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { createGroveRegisteredDriver } from '../../src/components/learn/games/games/starGalleryRegisteredDriver.js';

const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/star-gallery/manifest.json', 'utf8'));
const atlases = Object.fromEntries(manifest.assets.filter(asset => asset.frames).map(asset => [asset.id, {
  width: asset.sourceSize[0], height: asset.sourceSize[1], pixelsPerUnit: asset.pixelsPerUnit, nominalHeight: asset.nominalHeight,
  frames: asset.frames, runtime: `/unit-grove-driver/${asset.id}.webp`
}]));

test('registered rover driver keeps actual palms on wheel and lever through all eighteen poses and rotated vehicles', async () => {
  const prior = globalThis.Image;
  globalThis.Image = class {
    set src(value) {
      const id = value.split('/').at(-1).replace('.webp', ''), atlas = atlases[id];
      this.naturalWidth = atlas.width; this.naturalHeight = atlas.height; queueMicrotask(() => this.onload?.());
    }
    async decode() {}
  };
  try {
    for (const world of ['meadow', 'dino', 'moonwood']) {
      const vehicle = new THREE.Group(), seat = new THREE.Vector3(0, 1.5, .35), scale = .9;
      vehicle.position.set(12, .1, -7);
      const camera = new THREE.PerspectiveCamera(); camera.position.set(15, 8, 12); camera.lookAt(vehicle.position); camera.updateMatrixWorld(true);
      const owner = createGroveRegisteredDriver(THREE, { vehicle, world, atlases, seat, scale });
      assert.equal(await owner.ready, true);
      for (const yaw of [-1.3, 0, 2.7]) for (const state of [{}, { steer: -.5 }, { steer: .5 }, { cutterRemaining: .3 }, { cutterRemaining: .1 }, { recoveryRemaining: .4 }]) {
        vehicle.rotation.y = yaw; const before = structuredClone(state), originalPosition = vehicle.position.clone();
        assert.equal(owner.update(camera, state), true); const pose = owner.inspect();
        const expectedSeat = vehicle.localToWorld(seat.clone()); assert.ok(expectedSeat.distanceTo(new THREE.Vector3(...pose.seat)) < 1e-8);
        const wheel = new THREE.Vector3(...pose.wheelCentre), left = new THREE.Vector3(...pose.sockets.leftHand);
        assert.ok(Math.abs(left.distanceTo(wheel) - pose.wheelRadius) <= .055 * scale, 'visible left palm lies inside the actual wheel rim tube');
        if (pose.action.startsWith('lever-')) {
          assert.equal(pose.leverVisible, true);
          const right = new THREE.Vector3(...pose.sockets.rightHand), grip = new THREE.Vector3(...pose.leverGrip);
          assert.ok(right.distanceTo(grip) <= .03 * scale + 1e-8, 'separate live lever grip touches the source palm');
        } else {
          assert.equal(pose.leverVisible, false);
          const right = new THREE.Vector3(...pose.sockets.rightHand);
          assert.ok(Math.abs(right.distanceTo(wheel) - pose.wheelRadius) <= .055 * scale, 'visible right palm retains the second actual rim-tube contact');
        }
        assert.deepEqual(state, before); assert.deepEqual(vehicle.position, originalPosition);
        assert.equal(pose.sockets.feet, undefined, 'occluded source anatomy never becomes an invented contact');
      }
      const texture = owner.root.children[0].material.map; let textureDisposals = 0;
      texture.addEventListener('dispose', () => textureDisposals++); owner.dispose(); owner.dispose();
      assert.equal(textureDisposals, 1); assert.equal(vehicle.children.length, 0);
    }
  } finally { globalThis.Image = prior; }
});
