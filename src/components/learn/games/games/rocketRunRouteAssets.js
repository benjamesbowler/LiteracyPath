import * as THREE from 'three';
import { setTextureSrgb } from '../shared/threeShell.js';
import { drawRegisteredPalFrame } from '../shared/registeredPalArt.js';

const roles = ['station', 'portal', 'courier', 'planet', 'asteroid', 'beacon', 'comet'];
const ownedUrl = /^\/game-assets\/rocket-run\/route-kit\/[a-z0-9-]+\.webp$/;
const finitePoint = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);

function checkedRecord(record, embedded = false) {
  if (!record || !Number.isInteger(record.width) || !Number.isInteger(record.height)
    || record.width <= 0 || record.height <= 0 || record.trueAlpha !== true
    || (embedded ? !record.runtime?.startsWith('data:image/webp;base64,') : !ownedUrl.test(record.runtime || '')))
    throw new Error('A delivered original Rocket route atlas is required');
  const cells = [];
  for (const role of roles) {
    const frame = record.roles?.[role];
    const [left, top, right, bottom] = frame?.cell || [];
    if (![left, top, right, bottom].every(Number.isInteger) || !Number.isFinite(frame?.pixelsPerUnit)
      || left < 0 || top < 0 || right > record.width || bottom > record.height || right <= left || bottom <= top
      || frame.pixelsPerUnit <= 0 || !finitePoint(frame.anchor)
      || frame.anchor[0] < 0 || frame.anchor[0] >= right-left || frame.anchor[1] < 0 || frame.anchor[1] >= bottom-top
      || cells.some(old => Math.min(right,old[2]) > Math.max(left,old[0])
        && Math.min(bottom,old[3]) > Math.max(top,old[1])))
      throw new Error('An actual original route silhouette/anchor is missing: ' + role);
    cells.push([left,top,right,bottom]);
    if ((role === 'courier' || role === 'asteroid') && (!(frame.motorCore?.radius > 0)
      || !Number.isFinite(frame.motorCore.radius) || !Array.isArray(frame.motorCore.sourcePoint)
      || frame.motorCore.sourcePoint.length !== 3 || frame.motorCore.sourcePoint.some(value => value !== 0)))
      throw new Error('An actual evaluated cargo/hazard core registration is missing');
  }
  return record;
}

/** One decoded original atlas and one shared GPU texture own the seven roles.
 * Primary failure requests the same full original bank embedded in the lazy
 * game module. No proxy geometry can acquire authored delivery. Each lease
 * has its own scene transform while sharing immutable atlas pixels/material.
 */
export function createRocketRouteAssets(record, { onDelivery = () => {}, ImageClass = globalThis.Image,
  makeTexture = image => setTextureSrgb(THREE, new THREE.Texture(image)) } = {}) {
  let disposed = false, generation = 0, image = null, atlas = null, texture = null, request = null;
  const meshes = new Set(), templates = new Map();
  const status = { primary: 'not-requested', embedded: 'not-requested', selected: null };
  function report() { if (!disposed) { try { onDelivery({ ...status }); } catch { /* Observation cannot prevent owned decode settlement. */ } } }
  function releaseTemplates() {
    for (const { geometry, material } of templates.values()) { geometry.dispose(); material.dispose(); }
    templates.clear(); texture?.dispose(); texture = null;
  }
  function releaseMeshes() {
    for (const mesh of meshes) mesh.removeFromParent();
    meshes.clear(); releaseTemplates();
  }
  async function attempt(id, metadata, mine) {
    try { checkedRecord(metadata, id === 'embedded'); }
    catch { status[id] = 'unavailable'; report(); return false; }
    if (!ImageClass || disposed || mine !== generation) return false;
    status[id] = 'pending'; report();
    if (disposed || mine !== generation) return false;
    return new Promise(resolve => {
      const picture = new ImageClass();
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true; clearTimeout(timer); picture.onload = picture.onerror = null;
        if (request?.cancel === cancel) request = null;
        if (disposed || mine !== generation) { resolve(false); return; }
        status[id] = ok ? 'delivered' : 'unavailable';
        if (ok) {
          try {
            texture = makeTexture(picture); texture.needsUpdate = true;
            image = picture; atlas = metadata; status.selected = id;
          } catch { texture?.dispose(); texture = null; status[id] = 'unavailable'; ok = false; }
        }
        report(); resolve(ok);
      };
      const cancel = () => { finish(false); picture.src = ''; };
      const timer = setTimeout(() => finish(false), 10000);
      request = { cancel };
      picture.onerror = () => finish(false);
      picture.onload = async () => {
        if (picture.naturalWidth !== metadata.width || picture.naturalHeight !== metadata.height) { finish(false); return; }
        try { await picture.decode(); finish(true); } catch { finish(false); }
      };
      picture.src = metadata.runtime;
    });
  }
  async function preload() {
    if (disposed) return false;
    const mine = ++generation;
    request?.cancel(); releaseMeshes(); image = null; atlas = null;
    status.primary = status.embedded = 'not-requested'; status.selected = null;
    if (await attempt('primary', record?.primary, mine)) return !disposed && mine === generation;
    if (disposed || mine !== generation) return false;
    const ok = await attempt('embedded', record?.embedded, mine);
    return ok && !disposed && mine === generation;
  }
  function template(role) {
    if (!image || !atlas || !texture) return null;
    if (templates.has(role)) return templates.get(role);
    const frame = atlas.roles[role];
    if (!frame) return null;
    const [left, top, right, bottom] = frame.cell;
    const width = right-left, height = bottom-top, ppu = frame.pixelsPerUnit;
    const geometry = new THREE.PlaneGeometry(width/ppu, height/ppu);
    geometry.translate((width/2-frame.anchor[0])/ppu, (frame.anchor[1]-height/2)/ppu, 0);
    const uv = geometry.attributes.uv;
    for (let index = 0; index < uv.count; index++) {
      const x = (left+uv.getX(index)*width)/atlas.width;
      const y = 1-(top+(1-uv.getY(index))*height)/atlas.height;
      uv.setXY(index, x, y);
    }
    uv.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false,
      side: THREE.DoubleSide, toneMapped: false });
    const value = { geometry, material }; templates.set(role, value); return value;
  }
  return {
    preload,
    coreRadius(role) { return !disposed && atlas?.roles?.[role]?.motorCore?.radius || null; },
    createMesh(role) {
      if (disposed) return null;
      const source = template(role); if (!source) return null;
      const mesh = new THREE.Mesh(source.geometry, source.material);
      mesh.userData.authoredRouteRole = role; mesh.userData.authoredDelivery = status.selected;
      meshes.add(mesh); return mesh;
    },
    releaseMesh(mesh) { if (!meshes.delete(mesh)) return; mesh.removeFromParent(); },
    draw(ctx, role, placement) {
      if (disposed || !image || !atlas?.roles?.[role]) return false;
      const frame = atlas.roles[role];
      return drawRegisteredPalFrame(ctx, image,
        { ...atlas, pixelsPerUnit: frame.pixelsPerUnit }, { ...frame, sockets: {} }, placement);
    },
    inspect() { return { ...status, disposed, activeMeshes: meshes.size, templates: templates.size,
      decodedBaseBytes: image ? image.naturalWidth*image.naturalHeight*4 : 0, textureOwners: texture ? 1 : 0 }; },
    dispose() {
      if (disposed) return; disposed = true; generation++;
      request?.cancel(); request = null; releaseMeshes(); image = null; atlas = null;
    },
  };
}
