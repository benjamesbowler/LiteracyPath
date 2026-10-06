// The retained rover's actual cushion geometry supplies the attachment. No
// sprite-box estimate, vehicle bounding-box centre or invisible palm is used.
const OLD_DRIVER_MATERIALS = new Set(['Cheek', 'Cream.001', 'Hair', 'HairLight', 'Ink', 'Iris',
  'Leather', 'LeatherLight', 'Skin', 'Tunic', 'TunicLight', 'White']);

// The recovery rover has an open roll frame, not an opaque wall between the
// seated operator and the chase camera. Keep the original exterior bounds.
export function createGroveRecoveryRollFrame(THREE, material) {
  const frame = new THREE.Group(); frame.name = 'drawn-recovery-rover-open-roll-frame';
  const uprightGeometry = new THREE.BoxGeometry(.16, 1.75, .16);
  for (const x of [-.945, .945]) {
    const upright = new THREE.Mesh(uprightGeometry, material);
    upright.position.set(x, 1.65, .98); frame.add(upright);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.05, .16, .16), material);
  beam.position.set(0, 2.445, .98); frame.add(beam);
  return frame;
}

export function groveIsLegacyDriverMesh(mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return Boolean(mesh.isMesh && (mesh.userData.groveFallbackDriver
    || materials.length && materials.every(material => OLD_DRIVER_MATERIALS.has(material?.name))));
}

export function measureGroveRoverSeat(THREE, vehicle) {
  vehicle.updateWorldMatrix(true, true);
  const inverseVehicle = vehicle.matrixWorld.clone().invert(), candidates = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const edge = new THREE.Vector3(), normal = new THREE.Vector3(), centre = new THREE.Vector3();
  vehicle.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry?.attributes.position) return;
    let parent = mesh;
    while (parent && parent !== vehicle.parent) {
      if (!parent.visible) return;
      parent = parent.parent;
    }
    const multipleMaterials = Array.isArray(mesh.material);
    const materials = multipleMaterials ? mesh.material : [mesh.material];
    const seatIndices = materials.flatMap((material, index) => material?.name === 'Seat' ? [index] : []);
    if (!seatIndices.length) return;
    const geometry = mesh.geometry, position = geometry.attributes.position, index = geometry.index;
    geometry.computeBoundingBox();
    const sourceCeiling = geometry.boundingBox.min.y + (geometry.boundingBox.max.y - geometry.boundingBox.min.y) * .45;
    const transform = inverseVehicle.clone().multiply(mesh.matrixWorld);
    const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: index?.count ?? position.count, materialIndex: 0 }];
    for (const group of groups) {
      // Three applies a single material to every geometry group, regardless
      // of the BoxGeometry face indices stored in materialIndex.
      if (!seatIndices.includes(multipleMaterials ? group.materialIndex : 0)) continue;
      for (let offset = group.start; offset + 2 < group.start + group.count; offset += 3) {
        const ai = index ? index.getX(offset) : offset, bi = index ? index.getX(offset + 1) : offset + 1, ci = index ? index.getX(offset + 2) : offset + 2;
        a.fromBufferAttribute(position, ai); b.fromBufferAttribute(position, bi); c.fromBufferAttribute(position, ci);
        // The lower cushion is separate from the upright seat back in the
        // retained named Seat material. Only real upward-facing cushion faces
        // contribute to the measured, area-weighted attachment.
        if (!mesh.userData.groveFallbackSeat && (a.y + b.y + c.y) / 3 > sourceCeiling) continue;
        a.applyMatrix4(transform); b.applyMatrix4(transform); c.applyMatrix4(transform);
        normal.crossVectors(edge.subVectors(b, a), centre.subVectors(c, a));
        const area = normal.length() / 2;
        if (area < 1e-8 || normal.normalize().y < .98) continue;
        centre.copy(a).add(b).add(c).divideScalar(3);
        candidates.push({ area, centre: centre.clone(), sourceMesh: mesh.name, fallback: Boolean(mesh.userData.groveFallbackSeat) });
      }
    }
  });
  if (!candidates.length) return null;
  const area = candidates.reduce((sum, face) => sum + face.area, 0);
  const point = candidates.reduce((sum, face) => sum.addScaledVector(face.centre, face.area / area), new THREE.Vector3());
  return { point, area, faceCount: candidates.length, source: candidates.every(face => face.fallback)
    ? 'Actual drawn recovery rover Seat-material upward cushion triangles'
    : 'Actual retained rover Seat-material upward cushion triangles' };
}

export function groveLegacyDriverVisibility(vehicle) {
  const retained = new Map();
  vehicle.traverse(mesh => {
    if (groveIsLegacyDriverMesh(mesh)) retained.set(mesh, mesh.visible);
  });
  let authoredDelivered = false, recoveryVisible = false;
  function sync() {
    for (const [mesh, visible] of retained) mesh.visible = authoredDelivered || recoveryVisible ? false : visible;
  }
  return {
    setAuthoredDelivered(delivered) {
      authoredDelivered = Boolean(delivered); sync();
    },
    setRecoveryVisible(value) { recoveryVisible = Boolean(value); sync(); },
    inspect: () => ({ retainedMeshCount: retained.size, hiddenOnlyAfterAuthoredDelivery: authoredDelivered, canonicalRecoveryVisible: recoveryVisible }),
    dispose() { for (const [mesh, visible] of retained) mesh.visible = visible; retained.clear(); }
  };
}
