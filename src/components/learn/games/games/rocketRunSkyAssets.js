import * as THREE from 'three';
import { setTextureSrgb } from '../shared/threeShell.js';

const alternatives = ['primary', 'independent', 'embedded'];

/** Sequential selected-world sky delivery. One decoded image/texture survives;
 * disposal and retry invalidate the actual pending decode, never a sibling. */
export function createRocketSkyAssets(record, { onDelivery = () => {}, ImageClass = globalThis.Image,
  makeTexture = image => setTextureSrgb(THREE, new THREE.Texture(image)) } = {}) {
  let disposed = false, generation = 0, image = null, texture = null, cancel = null, selected = null;
  const status = Object.fromEntries(alternatives.map(id => [id, 'not-requested']));
  const report = () => { if (!disposed) { try { onDelivery({ ...status }); } catch { /* Observation cannot affect decode. */ } } };
  function release() { texture?.dispose(); texture = null; image = null; selected = null; }
  function attempt(id, metadata, mine) {
    if (!ImageClass || !metadata?.runtime || !Number.isInteger(metadata.width) || !Number.isInteger(metadata.height)
      || metadata.width <= 0 || metadata.height <= 0
      || (id === 'embedded' ? !metadata.runtime.startsWith('data:image/webp;base64,')
        : !/^\/game-assets\/rocket-run\/space-venues\/[a-z0-9-]+\.webp$/.test(metadata.runtime))) {
      status[id] = 'unavailable'; report(); return Promise.resolve(false);
    }
    status[id] = 'pending'; report();
    if (disposed || mine !== generation) return Promise.resolve(false);
    return new Promise(resolve => {
      const picture = new ImageClass(); let settled = false;
      const finish = ok => {
        if (settled) return; settled = true; clearTimeout(timer);
        picture.onload = picture.onerror = null; if (cancel === stop) cancel = null;
        if (disposed || mine !== generation) { resolve(false); return; }
        if (ok) {
          try {
            texture = makeTexture(picture); texture.needsUpdate = true;
            image = picture; selected = id;
          } catch { release(); ok = false; }
        }
        status[id] = ok ? 'delivered' : 'unavailable'; report(); resolve(ok);
      };
      const stop = () => { finish(false); picture.src = ''; };
      const timer = setTimeout(() => finish(false), 10000); cancel = stop;
      picture.onerror = () => finish(false);
      picture.onload = async () => {
        if (picture.naturalWidth !== metadata.width || picture.naturalHeight !== metadata.height) { finish(false); return; }
        try { await picture.decode(); finish(true); } catch { finish(false); }
      };
      picture.src = metadata.runtime;
    });
  }
  return {
    async preload() {
      if (disposed) return false;
      const mine = ++generation; cancel?.(); release();
      for (const id of alternatives) status[id] = 'not-requested';
      for (const id of alternatives) {
        if (disposed || mine !== generation) return false;
        if (await attempt(id, record?.[id], mine)) return !disposed && mine === generation;
      }
      return false;
    },
    image: () => disposed ? null : image,
    texture: () => disposed ? null : texture,
    delivery: () => ({ ...status }),
    inspect: () => ({ disposed, selected, textureOwners: texture ? 1 : 0,
      decodedImageOwners: image ? 1 : 0,
      decodedBaseBytes: image ? image.naturalWidth * image.naturalHeight * 4 : 0,
      delivery: { ...status } }),
    dispose() {
      if (disposed) return; disposed = true; generation++; cancel?.(); cancel = null; release();
      for (const id of alternatives) status[id] = 'disposed';
    },
  };
}
