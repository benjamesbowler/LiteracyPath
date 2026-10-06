import { rocketRunRouteLayout } from '../../../../utils/rocketRunRouteLayout.js';

export function rocketRunRouteScreenPlacement(row, view) {
  const point = view.project(row.x, row.y, row.z);
  const right = view.camera.matrixWorld.elements;
  // The atlas plane faces the actual camera. Use its right axis rather than
  // world X, whose foreshortening would make Canvas narrower than Three.
  const unit = view.project(row.x+right[0], row.y+right[1], row.z+right[2]);
  return { x: point.x, y: point.y, depth: point.depth,
    unitScale: Math.hypot(unit.x-point.x, unit.y-point.y)*row.scale };
}

/** One physical placement list feeds Three and Canvas. Future/unreadable cargo
 * still has an actual visible body, but response presentation remains the
 * separately measured word-face contract. This function never reads a word,
 * target, correctness, intent or language history. */
export function rocketRunRoutePlacements(state, meteors = [], sourceRadius = () => null, { world = 'meadow' } = {}) {
  const route = rocketRunRouteLayout({ distance: state.distance, round: state.round,
    seed: state.seed, journeyIndex: state.journeyIndex, world });
  const objects = route.objects.map(row => ({ ...row, kind: 'scenery' }));
  const sizeFor = (role,radius) => {
    const core = sourceRadius(role);
    return Number.isFinite(core) && core > 0 ? radius/core : 0;
  };
  for (const carrier of state.carriers || []) {
    if (!carrier.alive || carrier.passed || !Number.isFinite(carrier.x)
      || !Number.isFinite(carrier.z) || !(carrier.radius > 0)) continue;
    objects.push({ id: `cargo-${carrier.flightId}`, kind: 'cargo', role: 'courier',
      x: carrier.x, y: .54, z: carrier.z, scale: sizeFor('courier',carrier.radius),
      motorCollider: true, motorId: carrier.flightId });
  }
  for (const meteor of meteors) {
    if (meteor.alive === false || meteor.passed || !Number.isFinite(meteor.x)
      || !Number.isFinite(meteor.z) || !(meteor.radius > 0)) continue;
    objects.push({ id: `hazard-${meteor.id}`, kind: 'hazard', role: 'asteroid',
      x: meteor.x, y: .54, z: meteor.z, scale: sizeFor('asteroid',meteor.radius),
      motorCollider: true, motorId: meteor.id });
  }
  return { itineraryId: route.itineraryId, itineraryName: route.itineraryName,
    kind: route.kind, cycle: route.cycle, routeLength: route.routeLength, objects };
}

/** Own only scene instances; the atlas bank owns its shared templates/texture.
 * Call dispose before any general scene disposer. A new/failed atlas delivery
 * detaches its prior instances, which are rebuilt on the next genuine update.
 */
export function createRocketRoutePresentation(assets, group, { world = 'meadow' } = {}) {
  const meshes = new Map();
  let disposed = false, current = { kind: null, objects: [] };
  function release(id) {
    const mesh = meshes.get(id);
    if (!mesh) return;
    assets.releaseMesh(mesh); meshes.delete(id);
  }
  function releaseInstances() {
    for (const id of [...meshes.keys()]) release(id);
  }
  return {
    update(state, view, meteors = [], { createMeshes = true } = {}) {
      if (disposed) return;
      current = rocketRunRoutePlacements(state, meteors,role => assets.coreRadius(role), { world });
      if (!createMeshes) { releaseInstances(); return; }
      const active = new Set();
      for (const row of current.objects) {
        if (!(row.scale > 0)) continue;
        active.add(row.id);
        let mesh = meshes.get(row.id);
        if (mesh && mesh.parent !== group) { release(row.id); mesh = null; }
        if (!mesh) {
          mesh = assets.createMesh(row.role);
          if (!mesh) continue;
          meshes.set(row.id, mesh); group.add(mesh);
        }
        mesh.position.set(row.x, row.y, row.z);
        mesh.scale.setScalar(row.scale);
        mesh.quaternion.copy(view.camera.quaternion);
        mesh.userData.motorId = row.motorId ?? null;
        mesh.userData.motorCollider = row.motorCollider;
        // One depth authority orders overlapping transparent silhouettes.
        mesh.renderOrder = -Math.round(view.project(row.x, row.y, row.z).depth*100000);
      }
      for (const id of [...meshes.keys()]) if (!active.has(id)) release(id);
    },
    draw(ctx, view, { minDepth = -1, maxDepth = 1 } = {}) {
      if (disposed) return { delivered: 0, requested: 0 };
      let delivered = 0, requested = 0;
      // Match Three's physical far-to-near composition. No response label or
      // operator image is painted here, so those remain separately legible.
      const placements = current.objects.map(row => ({ row, screen: rocketRunRouteScreenPlacement(row, view) }))
        .sort((a,b) => b.screen.depth-a.screen.depth);
      for (const { row, screen } of placements) {
        if (screen.depth < minDepth || screen.depth >= maxDepth) continue;
        if (!Number.isFinite(screen.unitScale) || screen.unitScale <= 0) continue;
        requested++;
        if (assets.draw(ctx, row.role, screen)) delivered++;
      }
      return { delivered, requested };
    },
    inspect() { return { ...structuredClone(current), instanceCount: meshes.size, disposed }; },
    releaseInstances,
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseInstances();
      current = { kind: null, objects: [] };
    },
  };
}
