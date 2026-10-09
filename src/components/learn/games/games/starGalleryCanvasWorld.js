import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';
import { drawPhysicalPalFallback } from '../shared/physicalPalFallback.js';
import { groveDriverAction, groveDriverFrame } from './starGalleryDriverPose.js';
import { measureGroveRoverSeat, groveIsLegacyDriverMesh } from './starGalleryRoverRegistration.js';
import { drawGroveSceneryFloor, drawGroveTexturedTriangle } from './starGallerySurfaceProjection.js';
import { layoutGrovePlaques } from './starGalleryPlaqueLayout.js';

const driverIds = { meadow: 'bouncy-driver', dino: 'chompy-driver', moonwood: 'pip-driver' };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Canvas uses the current physical world and camera. Driving, reachable cuts,
// hazards, timing and learning remain owned by the existing simulation.
export function createSentenceGroveCanvasWorld(THREE, { canvas, atlases, getState, getTheme, getPromptBottom = () => 0 }) {
  const context = canvas.getContext('2d');
  if (!context) throw Error('Sentence Grove needs a drawable Canvas recovery surface');
  const bank = atlases ? createRegisteredPalArtBank(atlases) : null;
  if (bank) void bank.preload();
  const vector = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const quaternion = new THREE.Quaternion(), seatPoint = new THREE.Vector3(), headPoint = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let width = 1, height = 1, disposed = false, snapshot = null, roverKey = '', roverFaces = [], seat = null;
  function project(camera, x, y, z) {
    vector.set(x, y, z).project(camera);
    return { x: (vector.x + 1) * width / 2, y: (1 - vector.y) * height / 2,
      depth: vector.z, visible: vector.z >= -1 && vector.z < 1 };
  }
  function worldPixelScale(camera, point) {
    camera.getWorldQuaternion(quaternion); up.set(0, 1, 0).applyQuaternion(quaternion);
    const origin = project(camera, point.x, point.y, point.z);
    headPoint.copy(point).add(up);
    const next = project(camera, headPoint.x, headPoint.y, headPoint.z);
    return Math.hypot(next.x - origin.x, next.y - origin.y);
  }
  function drawCard(camera, key, action, position, worldHeight, rotate = 0) {
    const atlas = atlases?.[key], index = atlas?.frames.findIndex(frame => frame.action === action) ?? -1;
    const point = project(camera, position.x, position.y || 0, position.z);
    if (index < 0 || !point.visible) return false;
    const scale = worldPixelScale(camera, position) * worldHeight / atlas.nominalHeight;
    context.save(); context.translate(point.x, point.y); context.rotate(rotate);
    const drawn = bank.draw(context, key, index, { x: 0, y: 0, unitScale: scale });
    context.restore(); return drawn;
  }
  // Only the retained rover's own model is software-rasterised. Original
  // driver and tree layers use their decoded source artwork, with real palms
  // and seat geometry rather than a fabricated vehicle-box attachment.
  function prepareRover(vehicle) {
    const key = `${vehicle?.uuid}:${vehicle?.userData.authoredAsset || ''}:${vehicle?.userData.groveAttachmentRevision || 0}:${vehicle?.children.length || 0}`;
    if (key === roverKey) return;
    roverKey = key; roverFaces = []; seat = vehicle ? measureGroveRoverSeat(THREE, vehicle) : null;
    vehicle?.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry?.attributes.position || mesh.name.includes('original-rear-driver')) return;
      const multipleMaterials = Array.isArray(mesh.material);
      const materials = multipleMaterials ? mesh.material : [mesh.material];
      let owner = mesh, driverControl = false;
      while (owner && owner !== vehicle) {
        if (owner.name.endsWith('-registered-rover-driver')) driverControl = true;
        owner = owner.parent;
      }
      const geometry = mesh.geometry, positions = geometry.attributes.position, index = geometry.index;
      const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: index?.count || positions.count, materialIndex: 0 }];
      for (const group of groups) {
        const material = materials[multipleMaterials ? group.materialIndex : 0];
        if (!material?.color || material.map || material.transparent && material.opacity < .1) continue;
        for (let offset = group.start; offset + 2 < group.start + group.count; offset += 3) {
          roverFaces.push({ mesh, material, driverControl, legacyDriver: groveIsLegacyDriverMesh(mesh), indices: [0, 1, 2].map(delta => index ? index.getX(offset + delta) : offset + delta),
            color: `#${material.color.getHexString()}`, points: new Array(3), depth: 0 });
        }
      }
    });
  }
  function drawRover(camera, vehicle, replaceLegacyDriver, controlsOnly = false) {
    if (!vehicle) return;
    prepareRover(vehicle); vehicle.updateWorldMatrix(true, true);
    const visible = [];
    for (const face of roverFaces) {
      if (face.driverControl !== controlsOnly) continue;
      if (replaceLegacyDriver && face.legacyDriver) continue;
      let parent = face.mesh, hidden = false;
      while (parent && parent !== vehicle.parent) { if (!parent.visible) hidden = true; parent = parent.parent; }
      if (hidden) continue;
      const attribute = face.mesh.geometry.attributes.position;
      const vertices = [a, b, c];
      for (let index = 0; index < 3; index++) {
        const point = vertices[index].fromBufferAttribute(attribute, face.indices[index]).applyMatrix4(face.mesh.matrixWorld);
        face.points[index] = project(camera, point.x, point.y, point.z);
      }
      if (!face.points.every(point => point.visible)) continue;
      face.depth = face.points.reduce((sum, point) => sum + point.depth, 0) / 3; visible.push(face);
    }
    visible.sort((left, right) => right.depth - left.depth);
    for (const face of visible) {
      context.fillStyle = face.color; context.beginPath();
      face.points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
      context.closePath(); context.fill();
    }
  }
  function drawPaths(camera, state, theme) {
    const root = state.worldRoot?.getObjectByName('Garden gravel trails');
    if (!root) return;
    context.fillStyle = theme.path || '#BFCADD'; root.updateWorldMatrix(true, true);
    root.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry?.index) return;
      const positions = mesh.geometry.attributes.position, index = mesh.geometry.index;
      for (let offset = 0; offset < index.count; offset += 3) {
        const points = [a, b, c].map((vertex, delta) => {
          vertex.fromBufferAttribute(positions, index.getX(offset + delta)).applyMatrix4(mesh.matrixWorld);
          return project(camera, vertex.x, vertex.y, vertex.z);
        });
        if (!points.every(point => point.visible)) continue;
        const image = mesh.material?.map?.image, uv = mesh.geometry.attributes.uv;
        if (image && uv) {
          const coordinates = [0,1,2].map(delta => ({ x: uv.getX(index.getX(offset+delta)), y: uv.getY(index.getX(offset+delta)) * 24 }));
          const tile = Math.floor(Math.min(...coordinates.map(point => point.y)) + 1e-7);
          const source = coordinates.map(point => ({ x: point.x * image.width, y: (1 - (point.y - tile)) * image.height }));
          drawGroveTexturedTriangle(context,image,source,points);continue;
        }
        context.beginPath(); points.forEach((point, slot) => slot ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
        context.closePath(); context.fill();
      }
    });
  }
  function drawDriver(camera, state, world, time) {
    const vehicle = state.vehicle;
    if (!vehicle || !seat) return null;
    seatPoint.copy(seat.point); vehicle.localToWorld(seatPoint);
    const origin = project(camera, seatPoint.x, seatPoint.y, seatPoint.z), unitScale = worldPixelScale(camera, seatPoint);
    if (!origin.visible || unitScale < 1) return null;
    const action = groveDriverAction({ steer: state.steerVisual, cutterRemaining: state.cutterRemaining, recoveryRemaining: state.invulnerable });
    const selected = groveDriverFrame(atlases || {}, world, action), placement = { x: origin.x, y: origin.y, unitScale };
    const delivery = bank?.delivery()[driverIds[world]] || 'unavailable';
    const delivered = selected && bank?.draw(context, selected.key, selected.index, placement);
    if (!delivered && delivery === 'unavailable') {
      // Final art-unavailable identity uses the shared canonical drawing. Its
      // lower body is truthfully occluded by the actual seat/chassis layer.
      context.save(); context.beginPath(); context.rect(origin.x - 100, origin.y - 160, 200, 160); context.clip();
      drawPhysicalPalFallback(context, { world, x: origin.x, y: origin.y + unitScale * .8,
        height: unitScale * 2.2, direction: 'back', time, moving: false, action: 'idle' });
      context.restore();
    }
    const pose = delivered ? bank.pose(selected.key, selected.index, placement) : null;
    return { action, delivery, representation: delivered ? 'original-registered-rear-driver'
      : delivery === 'unavailable' ? 'procedural-art-unavailable' : 'retained-model-continuity', seat: seatPoint.toArray(),
      screenSeat: { x: origin.x, y: origin.y }, palms: pose ? structuredClone(pose.sockets) : null,
      bounds: pose ? { x: pose.origin.x + pose.destination.x, y: pose.origin.y + pose.destination.y,
        width: pose.destination.width, height: pose.destination.height,
        right: pose.origin.x + pose.destination.x + pose.destination.width,
        bottom: pose.origin.y + pose.destination.y + pose.destination.height } : null };
  }
  return {
    resize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth); height = Math.max(1, nextHeight);
      canvas.width = width; canvas.height = height;
    },
    render(camera, time) {
      if (disposed) return;
      const state = getState(), theme = getTheme(), world = state.level?.world || 'meadow', kit = `${world}-grove-kit`;
      camera.updateMatrixWorld();
      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, theme.sky); sky.addColorStop(.48, theme.fog); sky.addColorStop(1, theme.ground || '#527C49');
      context.fillStyle = sky; context.fillRect(0, 0, width, height);
      const details = state.worldRoot?.userData.groveScenery?.canvasAssets();
      const sceneryDraw = drawGroveSceneryFloor(THREE,context,camera,project,details,width,height);
      drawPaths(camera, state, theme);
      const objects = state.tokens.filter(token => token.group.visible).map(token => ({ kind: 'choice', token,
        position: token.group.position, depth: project(camera, token.group.position.x, 0, token.group.position.z).depth }));
      for (const plant of state.restoredPlants || []) objects.push({ kind: 'plant', plant,
        position: { x: plant.x, y: 0, z: plant.z }, depth: project(camera, plant.x, 0, plant.z).depth });
      for (const plant of details?.plan.plants || []) objects.push({ kind: 'dressing', plant,
        position: { x: plant.x, y: .025, z: plant.z }, depth: project(camera, plant.x, .025, plant.z).depth });
      objects.sort((left, right) => right.depth - left.depth);
      for (const object of objects) {
        if (object.kind === 'dressing') {
          drawCard(camera, kit, object.plant.action, object.position, object.plant.height);
        } else if (object.kind === 'plant') {
          drawCard(camera, kit, 'stump', object.position, 6.4);
          drawCard(camera, kit, 'sapling', object.position, 6.4 * clamp((time - object.plant.plantedAt) / 2.2, .03, 1));
        } else {
          const token = object.token, point = project(camera, token.group.position.x, token.group.position.y, token.group.position.z);
          if (!point.visible) continue;
          const drawn = drawCard(camera, kit, 'tree', token.group.position, 6.4, -token.group.rotation.z);
          if (!drawn) {
            const scale = worldPixelScale(camera, token.group.position);
            context.fillStyle = '#684830'; context.fillRect(point.x - scale * .35, point.y - scale * 4, scale * .7, scale * 4);
            context.fillStyle = theme.tree || '#52864E'; context.beginPath(); context.ellipse(point.x, point.y - scale * 4, scale * 1.8, scale * 2.1, 0, 0, Math.PI * 2); context.fill();
          }
        }
      }
      for (const hazard of state.hazards) {
        const point = project(camera, hazard.mesh.position.x, hazard.mesh.position.y, hazard.mesh.position.z);
        if (!point.visible) continue;
        const radius = worldPixelScale(camera, hazard.mesh.position) * hazard.radius;
        context.fillStyle = theme.hazard || '#C16443'; context.strokeStyle = '#18263E'; context.lineWidth = 2;
        context.beginPath(); context.arc(point.x, point.y, radius, 0, Math.PI * 2); context.fill(); context.stroke();
      }
      prepareRover(state.vehicle);
      const driverDelivery = bank?.delivery()[driverIds[world]] || 'unavailable';
      drawRover(camera, state.vehicle, Boolean(seat && ['delivered', 'unavailable'].includes(driverDelivery)));
      const driver = drawDriver(camera, state, world, time), labels = [];
      // Draw the existing source-registered wheel/lever geometry in front of
      // the body. An approximate second circle would detach from its palms at
      // oblique cameras and would duplicate the live vehicle's real controls.
      drawRover(camera, state.vehicle, false, true);
      // Every choice uses the same final readable layer, matching Three's
      // depthTest:false signs. Correctness never influences style or ordering.
      const reading = [];
      for (const [id, token] of state.tokens.entries()) {
        if (!token.group.visible || token.smashed) continue;
        token.labelMesh.getWorldPosition(right);
        const point = project(camera, right.x, right.y, right.z);
        if (!point.visible) continue;
        const text = String(token.label); let fontSize = clamp(worldPixelScale(camera, right) * 1.4, 18, 36);
        context.font = `700 ${fontSize}px Fredoka, sans-serif`;
        let metrics = context.measureText(text), inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        if (inkHeight > 0 && inkHeight < 18) {
          fontSize *= 18 / inkHeight;
          context.font = `700 ${fontSize}px Fredoka, sans-serif`;
          metrics = context.measureText(text); inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        }
        const boxWidth = metrics.width + 22, boxHeight = inkHeight + 14;
        reading.push({ id, x: point.x, y: point.y, aspect: boxWidth / boxHeight, pixelsPerUnit: 1,
          worldHeight: boxHeight, glyphFraction: inkHeight / boxHeight, text, fontSize, metrics });
      }
      for (const plaque of layoutGrovePlaques(reading, { width, height, promptBottom: getPromptBottom(), glyphFloor: 18,
        reserved: driver?.bounds ? [driver.bounds] : [] })) {
        const item = reading.find(item => item.id === plaque.id), box = plaque.bounds;
        const x = box.x + box.width / 2, y = box.y + box.height / 2;
        context.strokeStyle = '#684830'; context.lineWidth = 2; context.beginPath();
        context.moveTo(plaque.anchor.x, plaque.anchor.y); context.lineTo(x, y); context.stroke();
        context.fillStyle = '#FFFFFF'; context.strokeStyle = '#3454C8'; context.lineWidth = 2;
        context.beginPath(); context.roundRect(box.x, box.y, box.width, box.height, 8); context.fill(); context.stroke();
        context.font = `700 ${item.fontSize}px Fredoka, sans-serif`;
        context.fillStyle = '#18263E'; context.textAlign = 'center'; context.textBaseline = 'alphabetic';
        context.fillText(item.text, x, y + (item.metrics.actualBoundingBoxAscent - item.metrics.actualBoundingBoxDescent) / 2);
        labels.push({ label: item.text, x, y, width: box.width, height: box.height,
          bounds: box, anchor: plaque.anchor, glyphPixels: plaque.glyphPixels });
      }
      snapshot = { representation: 'same-controller-authored-canvas-recovery', world, driver,
        sceneryDraw,
        art: bank?.delivery() || {}, labels, sourceRoverTriangles: roverFaces.length, retainedRover: state.vehicle?.userData.authoredAsset || null };
    },
    deliveryRevision: () => JSON.stringify(bank?.delivery() || {}),
    inspect: () => snapshot ? structuredClone(snapshot) : null,
    dispose() { disposed = true; bank?.dispose(); roverFaces = []; snapshot = null; canvas.width = 1; canvas.height = 1; }
  };
}
