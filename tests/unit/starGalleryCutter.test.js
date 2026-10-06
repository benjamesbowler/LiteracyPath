import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createGroveCutter } from '../../src/components/learn/games/games/starGalleryCutter.js';

test('Grove real hinged reach meets the actual clicked bark point under rover translation/yaw and freezes safely with its owner', () => {
  const vehicle = new THREE.Group(); vehicle.position.set(10, .1, -4); vehicle.rotation.y = 1.25;
  const owner = createGroveCutter(THREE, { vehicle, seat: new THREE.Vector3(0, 1.3, .45) });
  const bark = new THREE.Vector3(12.4, 1.1, -5.8);
  owner.begin(bark); owner.update({ remaining: .16, dt: 1 / 60, available: true });
  const contact = owner.inspect();
  assert.equal(contact.actualContact, true);
  assert(new THREE.Vector3(...contact.tip).distanceTo(bark) < 1e-8);
  assert.equal(contact.representation, 'physical-hinged-telescopic-cut-tool');
  const blade = vehicle.getObjectByName('actual-bark-contact-cutter'), spin = blade.rotation.y;
  owner.update({ remaining: .16, dt: 10, available: true, paused: true });
  assert.equal(blade.rotation.y, spin);
  owner.update({ remaining: 0, available: true });
  assert.equal(owner.inspect().actualContact, false); assert.equal(owner.inspect().target, null);
  owner.update({ remaining: .16, available: false });
  assert.equal(vehicle.getObjectByName('grove-articulated-cutter').visible, false);
  owner.dispose(); owner.dispose();
  assert.equal(vehicle.getObjectByName('grove-articulated-cutter'), undefined);
});
