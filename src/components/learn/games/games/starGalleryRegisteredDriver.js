import { createRegisteredPalArtBank, registeredPalFrameGeometry } from '../shared/registeredPalArt.js';
import { groveDriverAction, groveDriverFrame } from './starGalleryDriverPose.js';

// The live rover owns the seating point. The atlas owns its measured visible
// seat and palms; camera-facing artwork and attached controls share one basis.
// This owner never changes vehicle steering, collision or literacy decisions.
export function createGroveRegisteredDriver(THREE, { vehicle, world, atlases, seat, scale = 1, onDelivery = () => {} }) {
  if (!vehicle || !seat || !Number.isFinite(scale) || scale <= 0) throw new Error('A real rover seat and positive driver scale are required');
  const readyFrame = groveDriverFrame(atlases, world, 'ready');
  if (!readyFrame) throw new Error('Missing registered rear driver');
  const bank = createRegisteredPalArtBank({ driver: readyFrame.atlas });
  const root = new THREE.Group(); root.name = `${world}-registered-rover-driver`; root.visible = false;
  root.position.copy(seat); root.scale.setScalar(scale); vehicle.add(root);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .04, depthWrite: true, side: THREE.DoubleSide, toneMapped: false });
  const body = new THREE.Mesh(geometry, material); body.name = 'original-rear-driver'; root.add(body);
  const wood = new THREE.MeshStandardMaterial({ color: 0x614333, roughness: .8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xbbc8d3, roughness: .45, metalness: .55 });
  const wheel = new THREE.Group(); wheel.name = 'real-hand-registered-steering-wheel'; root.add(wheel);
  const rimGeometry = new THREE.TorusGeometry(1, .055, 6, 32);
  const rim = new THREE.Mesh(rimGeometry, wood); wheel.add(rim);
  const spokeGeometry = new THREE.CylinderGeometry(.025, .025, 1, 6);
  const spokes = Array.from({ length: 3 }, () => { const spoke = new THREE.Mesh(spokeGeometry, metal); wheel.add(spoke); return spoke; });
  const lever = new THREE.Group(); lever.name = 'real-palm-registered-cut-lever'; root.add(lever);
  const leverGeometry = new THREE.CylinderGeometry(.035, .035, 1, 6);
  const shaft = new THREE.Mesh(leverGeometry, metal); lever.add(shaft);
  const gripGeometry = new THREE.SphereGeometry(.075, 10, 6);
  const grip = new THREE.Mesh(gripGeometry, wood); lever.add(grip);
  const qVehicle = new THREE.Quaternion(), qCamera = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const left = new THREE.Vector3(), right = new THREE.Vector3(), centre = new THREE.Vector3(), direction = new THREE.Vector3();
  const zero = new THREE.Vector3(), spokeEnd = new THREE.Vector3(), leverHand = new THREE.Vector3(), leverConsole = new THREE.Vector3();
  const readyRegistration = registeredPalFrameGeometry(readyFrame.atlas, readyFrame.frame);
  let texture = null, disposed = false, active = null, registration = null, delivered = 'pending';
  const ready = bank.preload().then(([image]) => {
    if (disposed) return false;
    delivered = image ? 'delivered' : 'unavailable';
    if (image) {
      texture = new THREE.Texture(image); texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false; texture.needsUpdate = true;
      material.map = texture; material.needsUpdate = true;
    }
    onDelivery(delivered); return Boolean(image);
  });
  function select(frame) {
    if (active === frame) return;
    active = frame; registration = registeredPalFrameGeometry(readyFrame.atlas, frame);
    body.scale.set(registration.scale[0], registration.scale[1], 1);
    body.position.set((.5 - registration.center[0]) * registration.scale[0], (.5 - registration.center[1]) * registration.scale[1], 0);
    const [l, t, r, b] = frame.cell, uv = geometry.attributes.uv;
    uv.setXY(0, l / readyFrame.atlas.width, 1 - t / readyFrame.atlas.height); uv.setXY(1, r / readyFrame.atlas.width, 1 - t / readyFrame.atlas.height);
    uv.setXY(2, l / readyFrame.atlas.width, 1 - b / readyFrame.atlas.height); uv.setXY(3, r / readyFrame.atlas.width, 1 - b / readyFrame.atlas.height); uv.needsUpdate = true;
  }
  function moveSegment(mesh, start, end, thickness = 1) {
    direction.subVectors(end, start); const length = direction.length();
    mesh.visible = length > .001;
    if (!mesh.visible) return;
    mesh.position.copy(start).add(end).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(up, direction.normalize()); mesh.scale.set(thickness, length, thickness);
  }
  function controls(action) {
    const l = registration.sockets.leftHand, r = registration.sockets.rightHand;
    wheel.visible = Boolean(l && r); lever.visible = Boolean(l && r && action.startsWith('lever-'));
    if (!wheel.visible) return;
    left.set(l[0], l[1], .025); right.set(r[0], r[1], .025);
    if (lever.visible) {
      const normal = readyRegistration.sockets.rightHand;
      right.set(normal[0], normal[1], .025);
    }
    centre.copy(left).add(right).multiplyScalar(.5);
    const radius = Math.max(.08, left.distanceTo(right) / 2);
    wheel.position.copy(centre); wheel.rotation.z = Math.atan2(right.y - left.y, right.x - left.x); rim.scale.setScalar(radius);
    for (let i = 0; i < spokes.length; i++) {
      const angle = i * Math.PI * 2 / 3;
      spokeEnd.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      moveSegment(spokes[i], zero, spokeEnd);
    }
    if (lever.visible) {
      // Hinged shaft runs from the live operator control console to the actual
      // palm; no fabricated wrist or detached tool pivot is used.
      leverHand.set(r[0], r[1], .03);
      leverConsole.set(right.x, Math.min(-.12, right.y - .65), -.18);
      moveSegment(shaft, leverConsole, leverHand); grip.position.copy(leverHand);
    }
  }
  return {
    root, ready, delivery: () => delivered,
    update(camera, state) {
      if (disposed || delivered !== 'delivered') return false;
      const action = groveDriverAction(state), selected = groveDriverFrame(atlases, world, action);
      if (!selected) { root.visible = false; return false; }
      select(selected.frame); root.visible = true;
      camera.getWorldQuaternion(qCamera); vehicle.getWorldQuaternion(qVehicle); root.quaternion.copy(qVehicle.invert()).multiply(qCamera);
      controls(action); return true;
    },
    inspect() {
      root.updateWorldMatrix(true, true);
      const sockets = Object.fromEntries(Object.entries(registration?.sockets || {}).map(([name, point]) =>
        [name, root.localToWorld(new THREE.Vector3(...point)).toArray()]));
      return structuredClone({ world, delivery: delivered, frame: active?.id || null, action: active?.action || null, sockets,
        bodyCorners: delivered === 'delivered' ? Array.from({ length: geometry.attributes.position.count }, (_, index) =>
          body.localToWorld(new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, index)).toArray()) : [],
        seat: root.getWorldPosition(new THREE.Vector3()).toArray(), wheelVisible: wheel.visible, leverVisible: lever.visible,
        wheelCentre: wheel.getWorldPosition(new THREE.Vector3()).toArray(), wheelRadius: rim.scale.x * scale,
        leverGrip: lever.visible ? grip.getWorldPosition(new THREE.Vector3()).toArray() : null,
        representation: delivered === 'delivered' ? 'original-registered-rear-driver' : 'unavailable' });
    },
    dispose() {
      if (disposed) return; disposed = true; root.removeFromParent(); root.clear(); bank.dispose(); texture?.dispose();
      for (const owned of [geometry, rimGeometry, spokeGeometry, leverGeometry, gripGeometry, material, wood, metal]) owned.dispose();
    }
  };
}
