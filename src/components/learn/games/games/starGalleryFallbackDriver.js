import { drawPhysicalPalFallback, physicalPalFallbackPose } from '../shared/physicalPalFallback.js';

// Vehicle delivery and canonical operator delivery are independent. The
// retained rover's old human is not a recovery representation of a Pal.
export const groveNeedsDriverRecovery = driver => driver === 'unavailable';

const width = 512, seatY = 300, soleY = 390, pixelsPerUnit = 150;

// The canonical asset-free Pal is seated at the same actual cushion attachment
// as the original driver. Chassis occludes the lower body; no feet are reported.
// Only palms actually drawn by the shared fallback become physical sockets.
export function groveFallbackDriverRegistration(world) {
  const pose = physicalPalFallbackPose({ world, x: width / 2, y: soleY, height: pixelsPerUnit * 2.2 });
  return { width, height: seatY, pixelsPerUnit, pose,
    sockets: Object.fromEntries(Object.entries(pose.handSockets).filter(([, point]) => point.y < seatY)
      .map(([name, point]) => [name, [(point.x - width / 2) / pixelsPerUnit, (seatY - point.y) / pixelsPerUnit, .035]])) };
}

export function createGroveFallbackDriver(THREE, { vehicle, world, seat, makeCanvas = () => document.createElement('canvas') }) {
  if (!vehicle || !seat) throw Error('The actual drawn cushion must exist before driver recovery');
  const registration = groveFallbackDriverRegistration(world), canvas = makeCanvas();
  canvas.width = width; canvas.height = seatY;
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.width = canvas.height = 1; return null; }
  ctx.clearRect(0, 0, width, seatY);
  drawPhysicalPalFallback(ctx, { world, x: width / 2, y: soleY, height: pixelsPerUnit * 2.2, moving: false, direction: 'back', time: 0 });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: .04,
    depthWrite: true, side: THREE.DoubleSide, toneMapped: false });
  const root = new THREE.Group(); root.name = `${world}-canonical-art-unavailable-rover-driver`; root.position.copy(seat); vehicle.add(root);
  const geometry = new THREE.PlaneGeometry(width / pixelsPerUnit, seatY / pixelsPerUnit);
  const body = new THREE.Mesh(geometry, material); body.name = 'canonical-upper-body-recovery'; body.position.y = seatY / pixelsPerUnit / 2; root.add(body);
  const old = new Map(); vehicle.traverse(mesh => { if (mesh.userData.groveFallbackDriver) { old.set(mesh, mesh.visible); mesh.visible = false; } });
  const wood = new THREE.MeshStandardMaterial({ color: '#614333', roughness: .85 }), metal = new THREE.MeshStandardMaterial({ color: '#bbcad3', roughness: .5 });
  const rimGeometry = new THREE.TorusGeometry(1, .05, 6, 24), wheel = new THREE.Mesh(rimGeometry, wood); wheel.name = 'actual-fallback-palm-steering-wheel'; root.add(wheel);
  const shaftGeometry = new THREE.CylinderGeometry(.035, .035, 1, 6), shaft = new THREE.Mesh(shaftGeometry, metal); root.add(shaft);
  const gripGeometry = new THREE.SphereGeometry(.075, 8, 6), grip = new THREE.Mesh(gripGeometry, wood); root.add(grip);
  const qVehicle = new THREE.Quaternion(), qCamera = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const left = registration.sockets.leftHand ? new THREE.Vector3(...registration.sockets.leftHand) : null;
  const right = registration.sockets.rightHand ? new THREE.Vector3(...registration.sockets.rightHand) : null;
  const hand = right || left, centre = hand ? left && right ? left.clone().add(right).multiplyScalar(.5) : hand.clone().add(new THREE.Vector3(-.13, -.15, 0)) : null;
  if (centre) { wheel.position.copy(centre); wheel.position.z = .025; wheel.scale.setScalar(hand.distanceTo(centre)); }
  wheel.visible = Boolean(centre); shaft.visible = grip.visible = false;
  let disposed = false;
  return {
    root,
    update(camera, state) {
      if (disposed) return;
      camera.getWorldQuaternion(qCamera); vehicle.getWorldQuaternion(qVehicle); root.quaternion.copy(qVehicle.invert()).multiply(qCamera);
      wheel.rotation.z = (state.steerVisual || 0) * .2;
      shaft.visible = grip.visible = Boolean(hand && state.cutterRemaining > 0);
      if (shaft.visible) {
        const pivot = new THREE.Vector3(hand.x, -.3, -.12), direction = hand.clone().sub(pivot);
        shaft.position.copy(pivot).add(hand).multiplyScalar(.5); shaft.scale.y = direction.length(); shaft.quaternion.setFromUnitVectors(up, direction.normalize()); grip.position.copy(hand);
      }
    },
    inspect() {
      root.updateWorldMatrix(true, true);
      return { representation: 'procedural-art-unavailable', world, character: registration.pose.character,
        physicalSeat: root.getWorldPosition(new THREE.Vector3()).toArray(), feetReported: false,
        sockets: Object.fromEntries(Object.entries(registration.sockets).map(([name, point]) => [name, root.localToWorld(new THREE.Vector3(...point)).toArray()])),
        wheelVisible: wheel.visible, wheelCentre: wheel.getWorldPosition(new THREE.Vector3()).toArray(),
        wheelRadius: wheel.scale.x * root.getWorldScale(new THREE.Vector3()).x,
        leverVisible: shaft.visible, leverGrip: grip.visible ? grip.getWorldPosition(new THREE.Vector3()).toArray() : null, ownedTextures: 1 };
    },
    dispose() {
      if (disposed) return; disposed = true; root.removeFromParent(); root.clear();
      for (const [mesh, visible] of old) mesh.visible = visible; old.clear();
      for (const owned of [texture, geometry, rimGeometry, shaftGeometry, gripGeometry, material, wood, metal]) owned.dispose();
      canvas.width = canvas.height = 1;
    }
  };
}
