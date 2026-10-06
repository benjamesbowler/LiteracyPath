import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import * as THREE from 'three';
import { decodeGlbMotion, evaluateRocketGlbContacts } from '../../artwork/games/rocket-run/verify_rocket_craft_contacts.mjs';

const names = ['cruise', 'bank_left', 'bank_right', 'boost', 'shield_recover', 'catch', 'celebrate'];
const sourcePoints = { leftGrip: [-.232, .233, 1.018], rightGrip: [.232, .233, 1.018],
  leftSole: [-.25, .79, .298], rightSole: [.25, .79, .298] };
const converted = point => [point[0], point[2], -point[1]];

// Small synthetic binary-motion fixture exercises the actual accessor,
// ancestry and runtime quaternion interpolants. It makes no art/rig claim.
function motionFixture({ inverseParent = false, interpolation = 'LINEAR', shoulderDrift = false } = {}) {
  const nodes = [{ name: 'flightRoot', children: [] }, { name: 'flightYoke', children: [] }];
  const joints = {}, ids = new Map([['flightRoot', 0], ['flightYoke', 1]]);
  nodes[0].children.push(1);
  function add(name, point, parent = 0) {
    const index = nodes.length; ids.set(name, index);
    nodes.push({ name, translation: converted(point), children: [] }); nodes[parent].children.push(index); return index;
  }
  for (const side of ['L', 'R']) {
    const grip = sourcePoints[side === 'L' ? 'leftGrip' : 'rightGrip'];
    const sole = sourcePoints[side === 'L' ? 'leftSole' : 'rightSole'];
    add(`upperarm.${side}`, grip); add(`forearm.${side}`, grip);
    add(`hand.${side}`, grip, 1); add(`${side === 'L' ? 'left' : 'right'}GripSocket`, grip, 1);
    add(`thigh.${side}`, sole); add(`shin.${side}`, sole); add(`foot.${side}`, sole);
    add(`${side === 'L' ? 'left' : 'right'}FootDock`, sole);
    for (const [name, from, to, point] of [['Wrist', 'forearm', 'hand', grip], ['Elbow', 'upperarm', 'forearm', grip],
      ['Ankle', 'shin', 'foot', sole], ['Knee', 'thigh', 'shin', sole]]) {
      joints[side.toLowerCase() + name] = { fromBone: `${from}.${side}`, toBone: `${to}.${side}`,
        fromSourcePoint: point, toSourcePoint: point };
    }
  }
  add('chest', [0, 0, 0]);
  const shoulders = Object.fromEntries(['L', 'R'].map(side => [side.toLowerCase() + 'Shoulder', {
    fromBone: `upperarm.${side}`, toBone: 'chest', fromSourcePoint: [side === 'L' ? -.27 : .27, -.36, 1.40],
    toSourcePoint: [side === 'L' ? -.27 : .27, -.36, 1.40] }]));
  const views = [], accessors = [], bins = [];
  function accessor(values, type) {
    const array = new Float32Array(values), bytes = Buffer.from(array.buffer);
    const index = accessors.length;
    views.push({ buffer: 0, byteOffset: bins.reduce((sum, value) => sum + value.length, 0), byteLength: bytes.length });
    const width = { SCALAR: 1, VEC3: 3, VEC4: 4 }[type];
    accessors.push({ bufferView: views.length - 1, componentType: 5126, count: values.length / width, type }); bins.push(bytes);
    return index;
  }
  const animation = () => {
    const input = accessor([0, 1], 'SCALAR'), samplers = [], channels = [];
    function track(node, path, values) {
      const output = accessor(values, path === 'rotation' ? 'VEC4' : 'VEC3');
      samplers.push({ input, output, interpolation }); channels.push({ sampler: samplers.length - 1, target: { node, path } });
    }
    if (inverseParent) {
      const forearm = ids.get('forearm.L'), hand = ids.get('hand.L');
      const point = new THREE.Vector3(...converted(sourcePoints.leftGrip));
      nodes[forearm].translation = [0, 0, 0]; nodes[hand].translation = point.toArray();
      nodes[1].children = nodes[1].children.filter(value => value !== hand);
      if (!nodes[forearm].children.includes(hand)) nodes[forearm].children.push(hand);
      const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
      const end = point.clone().applyQuaternion(quaternion.clone().invert());
      track(forearm, 'rotation', [0, 0, 0, 1, ...quaternion.toArray()]);
      track(hand, 'translation', [...point.toArray(), ...end.toArray()]);
    } else {
      const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), .42);
      track(0, 'rotation', [0, 0, 0, 1, ...rotation.toArray()]);
      if (shoulderDrift) track(ids.get('upperarm.L'), 'rotation', [0, 0, 0, 1, ...rotation.toArray()]);
    }
    return { samplers, channels };
  };
  const animations = names.map(name => ({ name, ...animation() })), binary = Buffer.concat(bins);
  const json = { asset: { version: '2.0' }, buffers: [{ byteLength: binary.length }], bufferViews: views, accessors,
    nodes, scenes: [{ nodes: [0] }], scene: 0, skins: [{ joints: nodes.map((_, index) => index) }], animations };
  const raw = Buffer.from(JSON.stringify(json)), padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32); raw.copy(padded);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + padded.length + 8 + binary.length, 8);
  const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(padded.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return { bytes: Buffer.concat([header, jsonHeader, padded, binHeader, binary]), record: {
    contacts: sourcePoints, jointEndpoints: joints, actualSourceSubframes: { threshold: 1e-5 },
    torsoAttachmentPairs: shoulders, shoulderAttachmentObservations: { status: 'Synthetic registration only, no art claim' },
    release: { clip: 'celebrate', contact: 'leftGrip', startPhase: .03, endPhase: .97 },
    clips: Object.fromEntries(names.map(name => [name, 31])), fps: 30 } };
}

test('actual binary continuous-sample gate preserves common rigid ancestry and all eight limb joins', () => {
  const { bytes, record } = motionFixture(), before = Buffer.from(bytes);
  const result = evaluateRocketGlbContacts(bytes, record);
  assert.match(result.status, /^PASS/); assert.equal(result.jointsPerPose, 8);
  assert.equal(result.clips.length, 7); assert.equal(result.actualPoses, 49);
  assert.ok(result.maximumContactSeparation < 1e-5); assert.ok(result.maximumJointSeparation < 1e-5);
  assert.equal(result.shoulderSamples, 98); assert.equal(result.shouldersPerPose, 2);
  assert.ok(result.maximumShoulderSeparation < 1e-5); assert.equal(result.failedSampleCount, 0);
  assert.deepEqual(bytes, before, 'inspection cannot rewrite the real motion buffer');
});

test('correct endpoint keys cannot hide interpolated inverse-parent hand contact failure', () => {
  const { bytes, record } = motionFixture({ inverseParent: true });
  const result = evaluateRocketGlbContacts(bytes, record, { legacyDiagnostic: true });
  assert.match(result.status, /^FAIL/);
  const failure = result.failures.find(row => row.kind === 'supported-contact');
  assert.ok(failure); assert.ok(failure.time > 0 && failure.time < 1);
  assert.ok(failure.separation > 1e-5);
  assert.ok(result.clips[0].worstContact.time > 0 && result.clips[0].worstContact.time < 1);
});

test('unsupported interpolation or missing semantic limb records cannot acquire a strict pass', () => {
  const unknown = motionFixture({ interpolation: 'CUBICSPLINE' });
  assert.throws(() => decodeGlbMotion(unknown.bytes), /interpolation/);
  const { bytes, record } = motionFixture(); delete record.jointEndpoints.lWrist;
  assert.throws(() => evaluateRocketGlbContacts(bytes, record), /canonical limb/);
  assert.throws(() => decodeGlbMotion(Buffer.alloc(12)), /glTF 2/);
});

test('all eight limb joins and four contacts cannot hide an actual shoulder/torso opening', () => {
  const { bytes, record } = motionFixture({ shoulderDrift: true });
  const before = Buffer.from(bytes), result = evaluateRocketGlbContacts(bytes, record);
  assert.match(result.status, /^FAIL/);
  assert.ok(result.maximumContactSeparation < 1e-5); assert.ok(result.maximumJointSeparation < 1e-5);
  assert.ok(result.maximumShoulderSeparation > .01);
  assert.ok(result.failures.some(row => row.kind === 'shoulder-attachment' && row.shoulder === 'lShoulder'));
  assert.ok(result.failedSampleCount > 0); assert.deepEqual(bytes, before);
});

test('missing real shoulder registration cannot produce a strict source-motion pass', () => {
  const { bytes, record } = motionFixture(); delete record.torsoAttachmentPairs.lShoulder;
  assert.throws(() => evaluateRocketGlbContacts(bytes, record), /shoulder\/torso/);
});
