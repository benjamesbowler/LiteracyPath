/** Actual exported glTF node/animation subframe gate. No GPU, image decode,
 * target answers or motor changes. This reconstructs the declared glTF TRS
 * and samples its real channel buffers with Three's runtime interpolants.
 * It is exported-source motion evidence, never rendered likeness evidence. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';

const CLIPS = ['cruise', 'bank_left', 'bank_right', 'boost', 'shield_recover', 'catch', 'celebrate'];
const TOLERANCE = 1e-5;
const CONTACTS = ['leftGrip', 'rightGrip', 'leftSole', 'rightSole'];
const FRACTIONS = [.123, .25, .5, .75, .876];
const fromSource = point => new THREE.Vector3(point[0], point[2], -point[1]);
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function decodeGlbMotion(input) {
  const bytes = Buffer.from(input), data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (data.getUint32(0, true) !== 0x46546c67 || data.getUint32(4, true) !== 2
    || data.getUint32(8, true) !== bytes.byteLength) throw new Error('An exact glTF 2 binary is required');
  let json, binary;
  for (let offset = 12; offset < bytes.byteLength;) {
    const size = data.getUint32(offset, true), type = data.getUint32(offset + 4, true);
    const chunk = bytes.subarray(offset + 8, offset + 8 + size);
    if (chunk.byteLength !== size) throw new Error('Truncated actual GLB chunk');
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8'));
    else if (type === 0x004e4942) binary = chunk;
    offset += size + 8;
  }
  if (!json?.nodes?.length || !binary || json.buffers?.length !== 1 || json.buffers[0].uri) {
    throw new Error('A complete embedded original motion buffer is required');
  }
  const widths = { SCALAR: 1, VEC3: 3, VEC4: 4, MAT4: 16 };
  function accessor(index) {
    const spec = json.accessors[index], view = json.bufferViews[spec?.bufferView], width = widths[spec?.type];
    if (!view || view.buffer !== 0 || !width || spec.componentType !== 5126 || spec.sparse) {
      throw new Error('An unmodified float motion accessor is required');
    }
    const out = new Float32Array(spec.count * width), stride = view.byteStride || width * 4;
    const start = (view.byteOffset || 0) + (spec.byteOffset || 0);
    const actual = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
    for (let row = 0; row < spec.count; row++) for (let component = 0; component < width; component++) {
      out[row * width + component] = actual.getFloat32(start + row * stride + component * 4, true);
      if (!Number.isFinite(out[row * width + component])) throw new Error('Non-finite actual motion channel');
    }
    return out;
  }
  const nodes = json.nodes.map((record, index) => {
    const node = new THREE.Object3D();
    node.name = THREE.PropertyBinding.sanitizeNodeName(record.name || `node-${index}`);
    if (record.matrix) new THREE.Matrix4().fromArray(record.matrix).decompose(node.position, node.quaternion, node.scale);
    else {
      if (record.translation) node.position.fromArray(record.translation);
      if (record.rotation) node.quaternion.fromArray(record.rotation);
      if (record.scale) node.scale.fromArray(record.scale);
    }
    return node;
  });
  const parents = new Map();
  json.nodes.forEach((record, index) => record.children?.forEach(child => {
    if (!Number.isInteger(child) || !nodes[child] || child === index || parents.has(child)) {
      throw new Error('A valid single-parent original node hierarchy is required');
    }
    parents.set(child, index);
  }));
  for (const [child, parent] of parents) {
    const seen = new Set([child]); let ancestor = parent;
    while (ancestor !== undefined) {
      if (seen.has(ancestor)) throw new Error('Cyclic original node hierarchy');
      seen.add(ancestor); ancestor = parents.get(ancestor);
    }
    nodes[parent].add(nodes[child]);
  }
  const scene = new THREE.Group();
  for (const index of json.scenes?.[json.scene || 0]?.nodes || []) scene.add(nodes[index]);
  scene.updateMatrixWorld(true);
  const jointIds = new Set((json.skins || []).flatMap(skin => skin.joints || []));
  const byName = new Map(json.nodes.map((record, index) => [record.name, { node: nodes[index], index }]));
  const animations = new Map();
  for (const animation of json.animations || []) {
    const tracks = [], times = new Set();
    for (const channel of animation.channels) {
      const sampler = animation.samplers[channel.sampler], interpolation = sampler.interpolation || 'LINEAR';
      if (!['LINEAR', 'STEP'].includes(interpolation)) throw new Error('Unsupported channel interpolation must not be approximated');
      const inputTimes = accessor(sampler.input), values = accessor(sampler.output), target = channel.target;
      const property = { translation: 'position', rotation: 'quaternion', scale: 'scale' }[target.path];
      if (!property || !nodes[target.node]) throw new Error('Unsupported actual animation target');
      inputTimes.forEach(time => times.add(time));
      const Track = property === 'quaternion' ? THREE.QuaternionKeyframeTrack : THREE.VectorKeyframeTrack;
      tracks.push(new Track(`${nodes[target.node].name}.${property}`, inputTimes, values,
        interpolation === 'STEP' ? THREE.InterpolateDiscrete : THREE.InterpolateLinear));
    }
    if (animations.has(animation.name)) throw new Error('Duplicate actual clip');
    animations.set(animation.name, { clip: new THREE.AnimationClip(animation.name, -1, tracks), times: [...times].sort((a, b) => a - b) });
  }
  return { scene, animations, byName, jointIds };
}

export function evaluateRocketGlbContacts(input, record, { legacyDiagnostic = false } = {}) {
  const { scene, animations, byName, jointIds } = decodeGlbMotion(input);
  if (animations.size !== CLIPS.length || CLIPS.some(name => !animations.has(name))) throw new Error('Seven actual original clips are required');
  function joint(name) {
    const value = byName.get(name);
    if (!value || !jointIds.has(value.index)) throw new Error(`Missing actual skinned joint ${name}`);
    return value.node;
  }
  function registration(boneName, sourcePoint) {
    if (!Array.isArray(sourcePoint) || sourcePoint.length !== 3 || !sourcePoint.every(Number.isFinite)) {
      throw new Error('An original measured source point is required');
    }
    const bone = joint(boneName), local = fromSource(sourcePoint).applyMatrix4(bone.matrixWorld.clone().invert());
    return { bone, local };
  }
  const contacts = CONTACTS.map(name => {
    const sourcePoint = record.contacts?.[name], side = name.startsWith('left') ? 'L' : 'R';
    const boneName = (name.endsWith('Grip') ? 'hand.' : 'foot.') + side;
    const supportName = name.endsWith('Grip') ? name + 'Socket' : name.replace('Sole', 'FootDock');
    return { name, ...registration(boneName, sourcePoint), support: joint(supportName) };
  });
  if (!legacyDiagnostic) for (const side of ['L', 'R']) {
    for (const [name, from, to] of [['Wrist', 'forearm', 'hand'], ['Elbow', 'upperarm', 'forearm'], ['Ankle', 'shin', 'foot'], ['Knee', 'thigh', 'shin']]) {
      const pair = record.jointEndpoints?.[side.toLowerCase() + name];
      if (pair?.fromBone !== `${from}.${side}` || pair?.toBone !== `${to}.${side}`) {
        throw new Error('Every actual canonical limb endpoint pair is required');
      }
    }
  }
  const joints = Object.entries(record.jointEndpoints || {}).map(([name, pair]) => ({ name,
    from: registration(pair.fromBone, pair.fromSourcePoint), to: registration(pair.toBone, pair.toSourcePoint) }));
  if (!legacyDiagnostic && (joints.length !== 8 || !record.actualSourceSubframes || !record.release)) {
    throw new Error('Actual source subframe and eight original limb endpoint records are required');
  }
  if (!legacyDiagnostic) for (const side of ['L', 'R']) {
    const pair = record.torsoAttachmentPairs?.[side.toLowerCase() + 'Shoulder'];
    if (pair?.fromBone !== `upperarm.${side}` || pair?.toBone !== 'chest'
      || !record.shoulderAttachmentObservations) {
      throw new Error('Both actual original shoulder/torso registrations and source observations are required');
    }
  }
  const shoulders = Object.entries(record.torsoAttachmentPairs || {}).map(([name, pair]) => ({ name,
    from: registration(pair.fromBone, pair.fromSourcePoint), to: registration(pair.toBone, pair.toSourcePoint) }));
  const release = record.release || { clip: 'celebrate', contact: 'leftGrip', startPhase: .04, endPhase: .96 };
  const mixer = new THREE.AnimationMixer(scene), rows = [], failures = [];
  let maximumContactSeparation = 0, maximumJointSeparation = 0, maximumShoulderSeparation = 0,
    poses = 0, supported = 0, shoulderSamples = 0, failedSampleCount = 0;
  const pointOf = value => value.local.clone().applyMatrix4(value.bone.matrixWorld);
  for (const name of CLIPS) {
    mixer.stopAllAction();
    const { clip, times } = animations.get(name), action = mixer.clipAction(clip);
    if (!legacyDiagnostic) {
      const expected = (record.clips?.[name] - 1) / record.fps;
      if (!Number.isFinite(expected) || Math.abs(clip.duration - expected) > 1e-6 || Math.abs(times[0]) > 1e-6) {
        throw new Error('Actual exported clip must retain the original physical duration and zero start');
      }
    }
    action.reset().setLoop(THREE.LoopOnce, 1).play(); action.paused = true; action.clampWhenFinished = true;
    const samples = [...times];
    for (let index = 0; index < times.length - 1; index++) for (const fraction of FRACTIONS) {
      samples.push(times[index] + (times[index + 1] - times[index]) * fraction);
    }
    const summary = { clip: name, duration: clip.duration, keyTimes: times.length, poses: 0,
      maximumContactSeparation: 0, maximumJointSeparation: 0, maximumShoulderSeparation: 0,
      worstContact: null, worstJoint: null, worstShoulder: null };
    for (const time of samples) {
      action.time = time; mixer.update(0); scene.updateMatrixWorld(true);
      const phase = time / clip.duration; poses++; summary.poses++;
      for (const contact of contacts) {
        const released = name === release.clip && contact.name === release.contact
          && phase > release.startPhase && phase < release.endPhase;
        if (released) continue;
        supported++;
        const point = pointOf(contact), support = contact.support.getWorldPosition(new THREE.Vector3());
        const separation = point.distanceTo(support);
        if (separation > summary.maximumContactSeparation) {
          summary.maximumContactSeparation = separation;
          summary.worstContact = { name: contact.name, time, phase, point: point.toArray(), support: support.toArray(), separation };
        }
        if (!Number.isFinite(separation) || separation > TOLERANCE) {
          failedSampleCount++;
          if (failures.length < 32) failures.push({ kind: 'supported-contact', clip: name, contact: contact.name, time, phase, separation });
        }
      }
      for (const pair of joints) {
        const from = pointOf(pair.from), to = pointOf(pair.to), separation = from.distanceTo(to);
        if (separation > summary.maximumJointSeparation) {
          summary.maximumJointSeparation = separation;
          summary.worstJoint = { name: pair.name, time, phase, from: from.toArray(), to: to.toArray(), separation };
        }
        if (!Number.isFinite(separation) || separation > TOLERANCE) {
          failedSampleCount++;
          if (failures.length < 32) failures.push({ kind: 'limb-endpoint', clip: name, joint: pair.name, time, phase, separation });
        }
      }
      for (const pair of shoulders) {
        shoulderSamples++;
        const from = pointOf(pair.from), to = pointOf(pair.to), separation = from.distanceTo(to);
        if (separation > summary.maximumShoulderSeparation) {
          summary.maximumShoulderSeparation = separation;
          summary.worstShoulder = { name: pair.name, time, phase, from: from.toArray(), to: to.toArray(), separation };
        }
        if (!Number.isFinite(separation) || separation > TOLERANCE) {
          failedSampleCount++;
          if (failures.length < 32) failures.push({ kind: 'shoulder-attachment', clip: name, shoulder: pair.name, time, phase, separation });
        }
      }
    }
    maximumContactSeparation = Math.max(maximumContactSeparation, summary.maximumContactSeparation);
    maximumJointSeparation = Math.max(maximumJointSeparation, summary.maximumJointSeparation);
    maximumShoulderSeparation = Math.max(maximumShoulderSeparation, summary.maximumShoulderSeparation); rows.push(summary);
  }
  mixer.stopAllAction(); mixer.uncacheRoot(scene);
  return { status: failures.length ? 'FAIL actual exported intermediate contact/joint drift' : legacyDiagnostic
    ? 'DIAGNOSTIC only: old source lacks actual subframe/joint registrations' : 'PASS actual exported continuous-sample gate',
  threshold: TOLERANCE, sourceSha256: digest(input), actualPoses: poses, supportedContacts: supported,
  jointsPerPose: joints.length, shoulderSamples, shouldersPerPose: shoulders.length, failedSampleCount,
  maximumContactSeparation, maximumJointSeparation, maximumShoulderSeparation,
  clips: rows, failures, renderedMotion: 'UNKNOWN until native actor pixels/contacts', legacyDiagnostic };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [modelPath, sourceRecordPath, reportPath] = process.argv.slice(2);
  const result = evaluateRocketGlbContacts(fs.readFileSync(modelPath), JSON.parse(fs.readFileSync(sourceRecordPath)),
    { legacyDiagnostic: process.argv.includes('--diagnose-legacy') });
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, poses: result.actualPoses, maxContact: result.maximumContactSeparation,
    maxJoint: result.maximumJointSeparation, maxShoulder: result.maximumShoulderSeparation, threshold: result.threshold, failures: result.failedSampleCount }));
  process.exitCode = result.failures.length || result.legacyDiagnostic ? 1 : 0;
}
