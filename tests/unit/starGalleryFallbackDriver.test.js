import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createGroveFallbackDriver, groveFallbackDriverRegistration, groveNeedsDriverRecovery } from '../../src/components/learn/games/games/starGalleryFallbackDriver.js';
import { physicalPalFallbackPose } from '../../src/components/learn/games/shared/physicalPalFallback.js';

test('Grove canonical operator recovery follows the authored driver failure independently of retained vehicle delivery', () => {
  for (const driver of ['pending', 'delivered', 'unavailable', 'disposed', undefined]) {
    for (const rover of ['pending', 'delivered', 'unavailable', 'disposed', undefined]) {
      assert.equal(groveNeedsDriverRecovery(driver, rover), driver === 'unavailable', 'A retained human driver cannot represent Bouncy/Chompy/Pip');
    }
  }
  assert.equal(groveNeedsDriverRecovery('delivered'), false, 'Failed trees or vehicle scenery cannot replace a delivered canonical operator');
});

test('Grove canonical seated recovery reports only visible shared Pal palms and never invents a sole or second dinosaur hand', () => {
  for (const [world, character] of [['meadow', 'bouncy'], ['dino', 'chompy'], ['moonwood', 'pip']]) {
    const row = groveFallbackDriverRegistration(world);
    const actual = physicalPalFallbackPose({ world, x: row.width / 2, y: 390, height: row.pixelsPerUnit * 2.2 });
    assert.equal(row.pose.character, character); assert(row.sockets.rightHand);
    assert.equal(row.sockets.feet, undefined);
    assert.deepEqual(Object.keys(row.sockets), Object.keys(actual.handSockets));
    for (const [name, point] of Object.entries(actual.handSockets)) {
      assert(point.y < row.height, 'Reported palm must lie in the actually visible upper-body crop');
      assert(Math.abs(row.sockets[name][0] - (point.x - row.width / 2) / row.pixelsPerUnit) < 1e-12);
      assert(Math.abs(row.sockets[name][1] - (row.height - point.y) / row.pixelsPerUnit) < 1e-12);
    }
    if (world === 'dino') assert.deepEqual(Object.keys(row.sockets), ['rightHand']);
  }
});

test('Grove recovery keeps real seat, steering rim and cut lever registered through vehicle/camera rotation and restores ownership on disposal', () => {
  const context = new Proxy({}, { get: (value, key) => key in value ? value[key] : () => {} });
  const canvas = { getContext: () => context }, vehicle = new THREE.Group();
  const old = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); old.userData.groveFallbackDriver = true; vehicle.add(old);
  vehicle.position.set(12, .4, -18); vehicle.rotation.y = 1.4;
  const seat = new THREE.Vector3(0, 1.26, .35), driver = createGroveFallbackDriver(THREE, { vehicle, world: 'dino', seat, makeCanvas: () => canvas });
  assert(driver); assert.equal(old.visible, false);
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 100); camera.position.set(3, 8, 9); camera.lookAt(vehicle.position); camera.updateMatrixWorld();
  driver.update(camera, { steerVisual: .7, cutterRemaining: .25 });
  const row = driver.inspect(), expectedSeat = vehicle.localToWorld(seat.clone());
  assert(new THREE.Vector3(...row.physicalSeat).distanceTo(expectedSeat) < 1e-9); assert.equal(row.feetReported, false);
  assert.equal(row.leverVisible, true); assert.deepEqual(row.leverGrip, row.sockets.rightHand);
  assert(Math.abs(new THREE.Vector3(...row.sockets.rightHand).distanceTo(new THREE.Vector3(...row.wheelCentre)) - row.wheelRadius) < .002,
    'The one real dinosaur palm touches its physical steering rim');
  driver.update(camera, { cutterRemaining: 0 }); assert.equal(driver.inspect().leverVisible, false);
  driver.dispose(); driver.dispose(); assert.equal(old.visible, true); assert.equal(vehicle.children.length, 1);
  assert.equal(canvas.width, 1); assert.equal(canvas.height, 1); old.geometry.dispose(); old.material.dispose();
});
