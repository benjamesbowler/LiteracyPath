import * as THREE from 'three';
import { SOUND_SEEKERS_ROUNDED_PALETTE as palette } from '../visual/visualTokens.js';

const trailColors = {
  meadow: { marker: palette['ffe4b0'], edge: palette['a87b55'] },
  dino: { marker: palette['ffd391'], edge: palette['98724f'] },
  moonwood: { marker: palette['e3eaff'], edge: palette['637c93'] },
};

function markerGeometry(worldId) {
  if (worldId === 'dino') return new THREE.IcosahedronGeometry(.35, 0).scale(.8, 1.35, .8);
  const shape = new THREE.Shape();
  const sides = worldId === 'meadow' ? 40 : 10;
  for (let index = 0; index < sides; index++) {
    const angle = Math.PI / 2 + index / sides * Math.PI * 2;
    const radius = worldId === 'meadow' ? .33 + .087 * Math.cos((angle - Math.PI / 2) * 5) : index % 2 ? .2 : .44;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .09, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 2 });
}

export function createCampaignTrailView(scene, trail, { getHeight }) {
  const colors = trailColors[trail.worldId];
  const outerGeometry = new THREE.TorusGeometry(.85, .065, 6, 28);
  const innerGeometry = new THREE.TorusGeometry(.72, .032, 6, 28);
  const beadGeometry = new THREE.CircleGeometry(1, 8).rotateX(-Math.PI / 2);
  const emblemGeometry = markerGeometry(trail.worldId);
  const dense = new THREE.MeshBasicMaterial({ color: colors.edge });
  const light = new THREE.MeshBasicMaterial({ color: colors.marker });
  const enamel = new THREE.MeshStandardMaterial({ color: colors.marker, emissive: colors.edge, emissiveIntensity: .5, roughness: .43 });
  const translucent = new THREE.MeshBasicMaterial({ color: colors.marker, depthWrite: false, transparent: true, opacity: .7 });

  const fieldMarker = new THREE.Group();
  const rings = new THREE.Group();
  for (const [geometry, material] of [[outerGeometry, dense], [innerGeometry, light]]) {
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    rings.add(ring);
  }
  const emblem = new THREE.Mesh(emblemGeometry, enamel);
  fieldMarker.add(rings, emblem);

  const maxBeads = 12;
  const beads = new THREE.InstancedMesh(beadGeometry, translucent, maxBeads);
  beads.count = 0;
  const bead = new THREE.Object3D();
  fieldMarker.visible = false;
  beads.visible = false;
  scene.add(fieldMarker, beads);

  const lastIndex = trail.checkpoints.length - 1;
  let shownIndex = -1;

  function update(index, timeSeconds, { reduced = false, active = true } = {}) {
    fieldMarker.visible = active;
    const complete = index > lastIndex;
    beads.visible = active && !complete;
    if (!active) return;

    if (index !== shownIndex) {
      shownIndex = index;
      const point = trail.checkpoints[Math.min(index, lastIndex)];
      fieldMarker.position.set(point.x, getHeight(point.x, point.z) + .1, point.z);
      if (!complete) {
        const from = trail.checkpoints[index - 1] || trail.origin;
        const steps = Math.min(maxBeads + 1, Math.ceil(Math.hypot(point.x - from.x, point.z - from.z) / 1.65));
        for (let step = 1; step < steps; step++) {
          const fraction = step / steps;
          const x = THREE.MathUtils.lerp(from.x, point.x, fraction);
          const z = THREE.MathUtils.lerp(from.z, point.z, fraction);
          bead.position.set(x, getHeight(x, z) + .07, z);
          bead.scale.setScalar(.12 + fraction * .075);
          bead.updateMatrix();
          beads.setMatrixAt(step - 1, bead.matrix);
        }
        beads.count = steps - 1;
        beads.instanceMatrix.needsUpdate = true;
        beads.computeBoundingSphere();
      }
    }

    const bob = reduced || complete ? 0 : Math.sin(timeSeconds * 2.7);
    emblem.position.y = (complete ? 1.28 : .95) + bob * .13;
    emblem.rotation.y = .4 + bob * .18;
    emblem.scale.setScalar(complete ? 1.38 : 1);
    rings.scale.setScalar((complete ? 1.22 : 1) + bob * .04);
  }

  function dispose() {
    scene.remove(fieldMarker, beads);
    beads.dispose();
    for (const geometry of [outerGeometry, innerGeometry, beadGeometry, emblemGeometry]) geometry.dispose();
    for (const material of [dense, light, enamel, translucent]) material.dispose();
  }

  return { update, dispose };
}
