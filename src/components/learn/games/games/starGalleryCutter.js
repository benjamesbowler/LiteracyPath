// The rover's new visible console fixture owns this articulated tool. Only an
// actual reachable cut supplies its bark point; it never chooses a repair.
export function createGroveCutter(THREE, { vehicle, seat }) {
  const root = new THREE.Group(); root.name = 'grove-articulated-cutter';
  root.position.copy(seat).add(new THREE.Vector3(0, -.42, -.55));
  vehicle.add(root);
  const metal = new THREE.MeshStandardMaterial({ color: 0xbac5d1, metalness: .62, roughness: .4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3c4655, metalness: .4, roughness: .65 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4a750, metalness: .45, roughness: .55 });
  const poleGeometry = new THREE.CylinderGeometry(.07, .09, .55, 8);
  const baseGeometry = new THREE.CylinderGeometry(.23, .28, .12, 12);
  const jointGeometry = new THREE.SphereGeometry(.13, 10, 6);
  const armGeometry = new THREE.CylinderGeometry(.055, .075, 1, 8);
  const bladeGeometry = new THREE.CylinderGeometry(.34, .34, .065, 16);
  const toothGeometry = new THREE.BoxGeometry(.095, .075, .13);
  const pole = new THREE.Mesh(poleGeometry, dark); pole.position.y = -.275;
  const base = new THREE.Mesh(baseGeometry, dark); base.position.y = -.52;
  const joint = new THREE.Mesh(jointGeometry, brass);
  root.add(pole, base, joint);
  const arms = [new THREE.Mesh(armGeometry, metal), new THREE.Mesh(armGeometry, dark)];
  const elbow = new THREE.Mesh(jointGeometry, brass);
  const blade = new THREE.Group(), disc = new THREE.Mesh(bladeGeometry, metal);
  blade.name = 'actual-bark-contact-cutter'; blade.add(disc);
  for (let index = 0; index < 12; index++) {
    const angle = index / 12 * Math.PI * 2, tooth = new THREE.Mesh(toothGeometry, metal);
    tooth.position.set(Math.cos(angle) * .34, 0, Math.sin(angle) * .34);
    tooth.rotation.y = -angle; blade.add(tooth);
  }
  root.add(...arms, elbow, blade);
  const up = new THREE.Vector3(0, 1, 0), start = new THREE.Vector3(), middle = new THREE.Vector3();
  const end = new THREE.Vector3(), direction = new THREE.Vector3(), rest = new THREE.Vector3(0, .06, -.62);
  const targetWorld = new THREE.Vector3(), localTarget = new THREE.Vector3();
  let disposed = false, target = false, delivered = false, spin = 0, contact = false;
  function segment(mesh, from, to) {
    direction.subVectors(to, from);
    const length = direction.length();
    mesh.position.copy(from).add(to).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    mesh.scale.set(1, length, 1);
  }
  return {
    begin(point) {
      target = Boolean(point && [point.x, point.y, point.z].every(Number.isFinite));
      if (target) targetWorld.copy(point);
    },
    update({ remaining = 0, dt = 0, available = false, paused = false, reducedMotion = false }) {
      if (disposed) return;
      delivered = available; root.visible = available;
      if (!available) return;
      root.updateWorldMatrix(true, false);
      end.copy(rest);
      const progress = Math.max(0, Math.min(1, (.32 - remaining) / .16));
      const extension = remaining > .08 ? progress : Math.max(0, remaining / .08);
      if (target && remaining > 0) end.lerp(root.worldToLocal(localTarget.copy(targetWorld)), extension);
      contact = target && remaining > .08 && progress >= 1;
      // Two real hinged sections and an extending reach; body and wrists are
      // never stretched to span the surrounding choice fan.
      middle.copy(end).multiplyScalar(.52); middle.y += .22 * (1 - extension);
      segment(arms[0], start, middle); segment(arms[1], middle, end);
      elbow.position.copy(middle); blade.position.copy(end);
      if (!paused && !reducedMotion && remaining > 0) spin += Math.max(0, dt) * 24;
      blade.rotation.y = spin;
      if (remaining <= 0) target = false;
    },
    inspect() {
      root.updateWorldMatrix(true, true);
      return { delivered, actualContact: contact, mount: root.getWorldPosition(new THREE.Vector3()).toArray(),
        tip: blade.getWorldPosition(new THREE.Vector3()).toArray(), target: target ? targetWorld.toArray() : null,
        representation: 'physical-hinged-telescopic-cut-tool' };
    },
    dispose() {
      if (disposed) return;
      disposed = true; root.removeFromParent(); root.clear();
      for (const owned of [metal, dark, brass, poleGeometry, baseGeometry, jointGeometry, armGeometry, bladeGeometry, toothGeometry]) owned.dispose();
    }
  };
}
