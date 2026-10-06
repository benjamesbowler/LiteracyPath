import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { measureGroveRoverSeat, groveLegacyDriverVisibility, createGroveRecoveryRollFrame } from '../../src/components/learn/games/games/starGalleryRoverRegistration.js';
import { createGroveFallbackDriver } from '../../src/components/learn/games/games/starGalleryFallbackDriver.js';

test('Grove attachment comes from the retained rover cushion, remains vehicle-local through pose and keeps its valid old driver until actual new delivery', async () => {
  const bytes = await fs.readFile('public/game-assets/arcade-worlds/garden-rover.glb');
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '', resolve, reject));
  const vehicle = new THREE.Group(); vehicle.add(gltf.scene);
  const pose = measureGroveRoverSeat(THREE, vehicle);
  assert(pose);
  assert.equal(pose.faceCount, 2, 'the actual retained lower cushion has two upward-facing top triangles');
  assert(pose.area > .7 && pose.area < .73, 'the measured full top is the actual 1.12 by .64 retained cushion');
  assert(Math.abs(pose.point.x) < .02);
  assert(pose.point.y > 1.27 && pose.point.y < 1.31, 'actual top cushion triangles, rather than its seat-back bound');
  assert(pose.point.z > .3 && pose.point.z < .6);
  vehicle.position.set(17, .4, -28); vehicle.rotation.set(.05, 1.6, -.07);
  const rotated = measureGroveRoverSeat(THREE, vehicle);
  assert(rotated.point.distanceTo(pose.point) < 1e-8, 'vehicle pose cannot shift its physical local seating point');
  const visibility = groveLegacyDriverVisibility(vehicle), oldDriver = [];
  vehicle.traverse(mesh => { if (mesh.isMesh && ['Tunic', 'Hair', 'Skin'].includes(mesh.material?.name)) oldDriver.push(mesh); });
  assert(oldDriver.length >= 3); assert(oldDriver.every(mesh => mesh.visible));
  visibility.setAuthoredDelivered(false); assert(oldDriver.every(mesh => mesh.visible));
  visibility.setRecoveryVisible(true); assert(oldDriver.every(mesh => !mesh.visible));
  assert.equal(visibility.inspect().canonicalRecoveryVisible, true);
  assert.equal(visibility.inspect().hiddenOnlyAfterAuthoredDelivery, false, 'Procedural recovery is not authored-art delivery');
  visibility.setAuthoredDelivered(true); visibility.setRecoveryVisible(false);
  assert(oldDriver.every(mesh => !mesh.visible), 'Real authored delivery keeps only the old driver masked when recovery retires');
  visibility.setAuthoredDelivered(false); assert(oldDriver.every(mesh => mesh.visible));
  visibility.setAuthoredDelivered(true); assert(oldDriver.every(mesh => !mesh.visible));
  const body = vehicle.getObjectByProperty('isMesh', true);
  assert.equal(body.visible, true, 'driver substitution never hides the retained physical vehicle');
  visibility.dispose(); assert(oldDriver.every(mesh => mesh.visible));
});

test('Grove fully missing-model recovery uses the actual drawn cushion top, and does not invent its driver seat from a vehicle box', () => {
  const vehicle = new THREE.Group(), material = new THREE.MeshBasicMaterial(); material.name = 'Seat';
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1, .18, .8), material);
  cushion.userData.groveFallbackSeat = true; cushion.position.set(0, 1.17, .35); vehicle.add(cushion);
  const measured = measureGroveRoverSeat(THREE, vehicle);
  assert(measured); assert(Math.abs(measured.point.x) < 1e-8);
  assert(Math.abs(measured.point.y - 1.26) < 1e-7); assert(Math.abs(measured.point.z - .35) < 1e-7);
  assert.equal(measured.faceCount, 2); assert(Math.abs(measured.area - .8) < 1e-7);
  assert.match(measured.source, /drawn recovery rover/);
  cushion.geometry.dispose(); material.dispose();
});

test('the recovery roll frame preserves the old exterior while exposing the canonical seated palms to the real chase view', () => {
  const material = new THREE.MeshBasicMaterial(), frame = createGroveRecoveryRollFrame(THREE, material);
  const oldWall = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.75, .16), material);
  oldWall.position.set(0, 1.65, .98);
  const oldBounds = new THREE.Box3().setFromObject(oldWall), bounds = new THREE.Box3().setFromObject(frame);
  assert(bounds.min.distanceTo(oldBounds.min) < 1e-7);
  assert(bounds.max.distanceTo(oldBounds.max) < 1e-7, 'Exterior reach and height stay unchanged');
  const vehicle = new THREE.Group(); vehicle.add(frame);
  const seatMaterial = new THREE.MeshBasicMaterial(); seatMaterial.name = 'Seat';
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(1, .18, .8), seatMaterial);
  cushion.userData.groveFallbackSeat = true; cushion.position.set(0, 1.17, .35); vehicle.add(cushion);
  const seat = measureGroveRoverSeat(THREE, vehicle);
  assert(Math.abs(seat.point.y - 1.26) < 1e-7);
  const camera = new THREE.PerspectiveCamera(58, 1.6, .1, 100);
  camera.position.set(0, 9.2, 14.6); camera.lookAt(0, 1.9, -4.6); camera.updateMatrixWorld();
  const context = new Proxy({}, { get: (value, key) => key in value ? value[key] : () => {} });
  const driver = createGroveFallbackDriver(THREE, { vehicle, world: 'meadow', seat: seat.point, makeCanvas: () => ({ getContext: () => context }) });
  driver.update(camera, { cutterRemaining: .15 });
  vehicle.updateMatrixWorld(true); oldWall.updateMatrixWorld(true);
  for (const point of Object.values(driver.inspect().sockets)) {
    const direction = new THREE.Vector3(...point).sub(camera.position).normalize();
    const ray = new THREE.Raycaster(camera.position, direction);
    assert(ray.intersectObject(oldWall).length > 0, 'The actual old panel hid the reported palm');
    assert.equal(ray.intersectObject(frame, true).length, 0, 'The actual canonical palm ray passes through the open frame');
  }
  driver.dispose();
  const geometries = new Set(); frame.traverse(mesh => { if (mesh.geometry) geometries.add(mesh.geometry); });
  for (const geometry of geometries) geometry.dispose();
  oldWall.geometry.dispose(); cushion.geometry.dispose(); seatMaterial.dispose(); material.dispose();
});
