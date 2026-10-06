import { createRegisteredPalArtBank, registeredPalFrameGeometry } from '../shared/registeredPalArt.js';
import { createGroveRegisteredDriver } from './starGalleryRegisteredDriver.js';
import { measureGroveRoverSeat, groveLegacyDriverVisibility } from './starGalleryRoverRegistration.js';
import { createGroveCutter } from './starGalleryCutter.js';
import { createGroveFallbackDriver, groveNeedsDriverRecovery } from './starGalleryFallbackDriver.js';

// This owner decorates the existing physical rover/trees. It never moves a
// target, selects a repair, changes reach or replaces the driving controller.
export function createSentenceGroveAuthoredWorld(THREE, { world, atlases, onDelivery = () => {} }) {
  const key = `${world}-grove-kit`, atlas = atlases[key];
  if (!atlas) throw Error(`Missing ${world} original cut/restoration kit`);
  const bank = createRegisteredPalArtBank({ kit: atlas });
  const material = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: .04, depthWrite: true,
    side: THREE.DoubleSide, toneMapped: false, forceSinglePass: true });
  const geometries = new Map(), registrations = new Map(), trees = new Map(), plants = new Map();
  const cameraQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  let texture = null, disposed = false, kitDelivery = 'pending', driver = null, driverMask = null, cutter = null, rover = null, measuredSeat = null;
  let retainedRoverDelivery = 'pending', fallbackDriver = null;
  for (const frame of atlas.frames) {
    const geometry = new THREE.PlaneGeometry(1, 1), uv = geometry.attributes.uv;
    const [left, top, right, bottom] = frame.cell;
    uv.setXY(0, left / atlas.width, 1 - top / atlas.height); uv.setXY(1, right / atlas.width, 1 - top / atlas.height);
    uv.setXY(2, left / atlas.width, 1 - bottom / atlas.height); uv.setXY(3, right / atlas.width, 1 - bottom / atlas.height);
    geometries.set(frame.action, geometry); registrations.set(frame.action, registeredPalFrameGeometry(atlas, frame));
  }
  const ready = bank.preload().then(([image]) => {
    if (disposed) return false;
    kitDelivery = image ? 'delivered' : 'unavailable';
    if (image) {
      texture = new THREE.Texture(image); texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false; texture.needsUpdate = true; material.map = texture; material.needsUpdate = true;
    }
    onDelivery({ kit: kitDelivery, driver: driver?.delivery() || 'not-requested' });
    return Boolean(image);
  });
  function object(action, height = 6.4) {
    const registration = registrations.get(action), geometry = geometries.get(action);
    if (!registration || !geometry) return null;
    const root = new THREE.Group(), face = new THREE.Mesh(geometry, material);
    root.name = `original-${world}-${action}`;
    root.scale.setScalar(height / atlas.nominalHeight);
    face.scale.set(registration.scale[0], registration.scale[1], 1);
    face.position.set((.5 - registration.center[0]) * registration.scale[0], (.5 - registration.center[1]) * registration.scale[1], 0);
    root.add(face); root.visible = kitDelivery === 'delivered';
    return { root, registration };
  }
  function removeTree(token) {
    const owned = trees.get(token);
    if (!owned) return;
    owned.root.removeFromParent(); owned.root.clear();
    for (const [mesh, visible] of owned.oldVisible) mesh.visible = visible;
    trees.delete(token);
  }
  function billboard(root, camera) {
    camera.getWorldQuaternion(cameraQuaternion);
    root.parent.getWorldQuaternion(parentQuaternion);
    root.quaternion.copy(parentQuaternion.invert()).multiply(cameraQuaternion);
  }
  function maskTree(token, owned) {
    for (const mesh of [...(token.treeFallback || []), ...(token.gardenAsset ? [token.gardenAsset] : [])]) {
      if (!owned.oldVisible.has(mesh)) owned.oldVisible.set(mesh, mesh.visible);
      mesh.visible = false;
    }
  }
  return {
    ready,
    setRetainedRoverDelivery(value) {
      if (['pending', 'delivered', 'unavailable', 'disposed'].includes(value)) retainedRoverDelivery = value;
    },
    attachRover(vehicle) {
      if (disposed || !vehicle) return false;
      fallbackDriver?.dispose(); fallbackDriver = null;
      driver?.dispose(); driverMask?.dispose(); cutter?.dispose(); driver = null; measuredSeat = measureGroveRoverSeat(THREE, vehicle);
      rover = vehicle;
      vehicle.userData.groveAttachmentRevision = (vehicle.userData.groveAttachmentRevision || 0) + 1;
      if (!measuredSeat) return false;
      driverMask = groveLegacyDriverVisibility(vehicle);
      cutter = createGroveCutter(THREE, { vehicle, seat: measuredSeat.point });
      driver = createGroveRegisteredDriver(THREE, { vehicle, world, atlases, seat: measuredSeat.point,
        onDelivery: value => {
          if (disposed) return;
          driverMask?.setAuthoredDelivered(value === 'delivered');
          onDelivery({ kit: kitDelivery, driver: value });
        } });
      return true;
    },
    attachTree(token) {
      if (disposed || trees.has(token)) return;
      const owned = object('tree');
      if (!owned) return;
      owned.oldVisible = new Map(); token.group.add(owned.root); trees.set(token, owned);
      if (kitDelivery === 'delivered') maskTree(token, owned);
    },
    detachTree: removeTree,
    beginCut(token) {
      const owned = trees.get(token), point = owned?.registration.sockets.cut;
      if (point && kitDelivery === 'delivered') {
        owned.root.updateWorldMatrix(true, false);
        cutter?.begin(owned.root.localToWorld(new THREE.Vector3(...point)));
      } else {
        // The original procedural tree already has a visible cut mark. Its
        // actual geometry supplies recovery contact, never an answer index or
        // a guessed atlas rectangle centre.
        cutter?.begin(token.cutMark?.getWorldPosition(new THREE.Vector3()) || null);
      }
    },
    // Regrowth is visual restoration after an already committed real cut. Its
    // location is the actual struck tree, independent of future answer choices.
    restorePlant(id, root, position, age = 0) {
      if (disposed || plants.has(id) || !Number.isFinite(position?.x) || !Number.isFinite(position?.z)) return false;
      const stump = object('stump'), sapling = object('sapling');
      if (!stump || !sapling) return false;
      const plant = new THREE.Group(); plant.position.set(position.x, .025, position.z); plant.add(stump.root, sapling.root); root.add(plant);
      plants.set(id, { root: plant, stump, sapling, age: Math.max(0, Math.min(30, age)) });
      return true;
    },
    update(camera, state, dt = 0, reducedMotion = false) {
      if (disposed) return;
      const finalRecovery = groveNeedsDriverRecovery(driver?.delivery());
      if (finalRecovery && !fallbackDriver && rover && measuredSeat) fallbackDriver = createGroveFallbackDriver(THREE, { vehicle: rover, world, seat: measuredSeat.point });
      if (!finalRecovery && fallbackDriver) { fallbackDriver.dispose(); fallbackDriver = null; }
      driverMask?.setRecoveryVisible(Boolean(fallbackDriver));
      fallbackDriver?.update(camera, state);
      driver?.update(camera, { steer: state.steerVisual, cutterRemaining: state.cutterRemaining || 0, recoveryRemaining: state.invulnerable || 0 });
      // The measured rover mount owns this physical machine independently of
      // its painted driver/tree layers. Missing kits use beginCut's actual
      // visible cut mark; a retained rover keeps its mounted tool available.
      cutter?.update({ remaining: state.cutterRemaining, dt, available: driver?.delivery() === 'delivered' || retainedRoverDelivery === 'delivered' || Boolean(fallbackDriver),
        paused: state.paused || state.ended, reducedMotion });
      for (const [token, owned] of trees) {
        owned.root.visible = kitDelivery === 'delivered';
        if (kitDelivery === 'delivered') maskTree(token, owned);
        billboard(owned.root, camera);
        // Keep the current real fall/bump animation visible after cancelling
        // only the random tree yaw for the authored camera-facing leaf plane.
        owned.root.rotateZ(token.group.rotation.z);
      }
      for (const plant of plants.values()) {
        if (!state.paused && !state.ended) plant.age = Math.min(30, plant.age + Math.max(0, dt));
        plant.stump.root.visible = kitDelivery === 'delivered'; plant.sapling.root.visible = kitDelivery === 'delivered';
        billboard(plant.stump.root, camera); billboard(plant.sapling.root, camera);
        const growth = Math.min(1, plant.age / 2.2);
        plant.sapling.root.scale.setScalar(6.4 / atlas.nominalHeight * Math.max(.03, growth));
      }
    },
    treeCutContact(token) {
      const owned = trees.get(token), point = owned?.registration.sockets.cut;
      if (kitDelivery !== 'delivered' || !point) return null;
      owned.root.updateWorldMatrix(true, false);
      return owned.root.localToWorld(new THREE.Vector3(...point));
    },
    inspect() {
      return structuredClone({ world, kitDelivery, driver: driver?.inspect() || null, fallbackDriver: fallbackDriver?.inspect() || null, retainedRoverDelivery, cutter: cutter?.inspect() || null,
        physicalSeat: measuredSeat ? { point: measuredSeat.point.toArray(), area: measuredSeat.area, faceCount: measuredSeat.faceCount, source: measuredSeat.source } : null,
        retainedDriver: driverMask?.inspect() || null, retainedRover: rover?.userData.authoredAsset || null,
        treeCount: trees.size, restoredPlants: [...plants.entries()].map(([id, plant]) => ({ id, age: plant.age, position: plant.root.position.toArray() })),
        ownedTextures: Number(Boolean(texture)) + Number(driver?.delivery() === 'delivered') + Number(Boolean(fallbackDriver)) });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      fallbackDriver?.dispose(); fallbackDriver = null;
      driver?.dispose(); driverMask?.dispose(); cutter?.dispose();
      for (const token of [...trees.keys()]) removeTree(token);
      for (const plant of plants.values()) { plant.root.removeFromParent(); plant.root.clear(); }
      plants.clear(); bank.dispose(); texture?.dispose(); material.dispose();
      for (const geometry of geometries.values()) geometry.dispose();
      geometries.clear(); registrations.clear(); driver = null; rover = null;
    }
  };
}
