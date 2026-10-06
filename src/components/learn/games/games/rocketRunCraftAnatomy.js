import * as THREE from 'three';

const joints = Object.fromEntries(['L','R'].flatMap(side =>
  [['Wrist','forearm','hand'],['Elbow','upperarm','forearm'],['Ankle','shin','foot'],['Knee','thigh','shin']]
    .map(([name,from,to]) => [side.toLowerCase()+name,[`${from}.${side}`,`${to}.${side}`]])));
const point = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const nodeNamed = (root,name) => typeof name === 'string' ? root.getObjectByName(name)
  || root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)) : null;

/** Register source points before the first sampled pose/root placement. These
 * observations use live loaded bones, never a nominal pose or posed source
 * JSON. The original source gate supplies the tolerance/release registration.
 * No bone transforms, mesh/mixer, evidence or motion are mutated here. */
export function registerRocketCraftAnatomy(root, record) {
  const threshold = record?.actualSourceSubframes?.threshold;
  if (!(threshold > 0) || !Number.isFinite(threshold)) throw new Error('Actual source anatomy gate is missing');
  root.updateMatrixWorld(true);
  function register(boneName, sourcePoint) {
    const bone = nodeNamed(root,boneName);
    if (!bone?.isBone || !point(sourcePoint)) throw new Error('An original skinned source endpoint is missing');
    const [x,y,z] = sourcePoint;
    const local = new THREE.Vector3(x,z,-y).applyMatrix4(bone.matrixWorld.clone().invert());
    return { bone,local };
  }
  function pair(name,value,expected) {
    if (!value || value.fromBone !== expected[0] || value.toBone !== expected[1])
      throw new Error('An original anatomical pair is missing: '+name);
    return { name, from: register(value.fromBone,value.fromSourcePoint),
      to: register(value.toBone,value.toSourcePoint) };
  }
  if (Object.keys(record.jointEndpoints || {}).length !== 8)
    throw new Error('All eight actual limb endpoint pairs are required');
  const registeredJoints = Object.entries(joints).map(([name,expected]) => pair(name,record.jointEndpoints[name],expected));
  if (Object.keys(record.torsoAttachmentPairs || {}).length !== 2)
    throw new Error('Both actual shoulder/torso surface registrations are required');
  const shoulders = ['L','R'].map(side => pair(side.toLowerCase()+'Shoulder',
    record.torsoAttachmentPairs[side.toLowerCase()+'Shoulder'],[`upperarm.${side}`,'chest']));
  const release = record.release;
  if (release?.clip !== 'celebrate' || release.contact !== 'leftGrip'
    || !(release.startPhase >= 0) || !(release.endPhase <= 1) || !(release.startPhase < release.endPhase))
    throw new Error('The original visible left-palm release envelope is missing');
  const contacts = ['leftGrip','rightGrip','leftSole','rightSole'].map(name => {
    const value = record.contacts?.[name], support = nodeNamed(root,value?.support);
    if (!support?.isBone) throw new Error('An actual physical support is missing: '+name);
    return { name,...register(value.bone,value.sourcePoint),support };
  });
  const worldPoint = value => value.local.clone().applyMatrix4(value.bone.matrixWorld);
  const observePair = value => {
    const from = worldPoint(value.from),to = worldPoint(value.to),separation = from.distanceTo(to);
    return { name:value.name, from:from.toArray(),to:to.toArray(),separation,
      attached:Number.isFinite(separation) && separation <= threshold };
  };
  return {
    sample(clip,phase) {
      if (!Number.isFinite(phase) || phase < 0 || phase > 1) throw new Error('Observe an actual sampled clip phase');
      root.updateMatrixWorld(true);
      const surfaces = contacts.map(value => {
        const from = worldPoint(value),to = value.support.getWorldPosition(new THREE.Vector3());
        const separation = from.distanceTo(to),supported = !(clip === release.clip && value.name === release.contact
          && phase > release.startPhase && phase < release.endPhase);
        return { name:value.name,point:from.toArray(),support:to.toArray(),separation,supported,
          state:supported?'held-on-actual-support':'original-visible-palm-release',
          attached:supported ? Number.isFinite(separation) && separation <= threshold : null };
      });
      return { clip,phase,threshold,contacts:surfaces,joints:registeredJoints.map(observePair),
        shoulders:shoulders.map(observePair) };
    },
  };
}
