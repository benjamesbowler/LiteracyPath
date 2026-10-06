import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';

const clips = ['cruise', 'bank_left', 'bank_right', 'boost', 'shield_recover', 'catch', 'celebrate'];
const definitions = [
  ['flight', 'primary', 42, 'registered-actions'],
  ['emergency', 'emergency', 21, 'embedded-registered-actions'],
  ['idle', 'independentIdle', 1, 'independent-idle'],
];

function validAtlas(atlas, id, count) {
  if (!atlas?.runtime || atlas.frames?.length !== count) return false;
  if (id === 'emergency' && !atlas.runtime.startsWith('data:image/webp;base64,')) return false;
  if (id !== 'emergency' && !/^\/game-assets\/rocket-run\/flight-actions\/[a-z0-9-]+\.webp$/.test(atlas.runtime)) return false;
  if (id === 'idle') return atlas.frames[0].clip === 'cruise';
  return clips.every(clip => atlas.frames.filter(frame => frame.clip === clip).length === count / clips.length);
}

/** One selected world's complete registered action bank. Decode alternatives
 * only after a genuine failure, and release failed/old owners before retry.
 * Idle can keep a recovery opening recognisable; it never certifies play. */
export function createRocketFlightAssets(record, { onDelivery = () => {},
  makeBank = createRegisteredPalArtBank } = {}) {
  let disposed = false, generation = 0, bank = null, atlas = null, selected = null, decodedBytes = 0;
  const status = { flight: 'not-requested', emergency: 'not-requested', idle: 'not-requested' };
  const report = () => { if (!disposed) { try { onDelivery({ ...status }); } catch { /* Observation has no ownership. */ } } };
  function release() { bank?.dispose(); bank = null; atlas = null; selected = null; decodedBytes = 0; }
  async function preload() {
    if (disposed) return false;
    const mine = ++generation;
    release();
    for (const id of Object.keys(status)) status[id] = 'not-requested';
    for (const [id, key, count] of definitions) {
      if (disposed || mine !== generation) return false;
      const candidate = record?.[key];
      if (!validAtlas(candidate, id, count)) { status[id] = 'unavailable'; report(); continue; }
      let owner;
      try {
        owner = makeBank({ [id]: candidate }); bank = owner;
        status[id] = 'pending'; report();
        const images = await owner.preload([id]);
        if (disposed || mine !== generation) { owner.dispose(); return false; }
        const image = images?.[0];
        if (image && owner.delivery()[id] === 'delivered') {
          atlas = candidate; selected = id;
          decodedBytes = (image.naturalWidth || image.width) * (image.naturalHeight || image.height) * 4;
          status[id] = 'delivered'; report(); return id !== 'idle';
        }
      } catch { /* A malformed or failed decode must use the next real bank. */ }
      owner?.dispose(); if (bank === owner) bank = null;
      status[id] = 'unavailable'; report();
    }
    return false;
  }
  return {
    preload,
    draw(ctx, pose, placement) {
      if (disposed || !selected || !atlas || !bank) return { delivered: false, complete: false, tier: 'unavailable' };
      const candidates = atlas.frames.map((frame, index) => ({ frame, index }))
        .filter(row => row.frame.clip === (selected === 'idle' ? 'cruise' : pose.clip));
      const nearest = candidates.reduce((best, row) => !best || Math.abs(row.frame.phase - pose.phase)
        < Math.abs(best.frame.phase - pose.phase) ? row : best, null);
      const delivered = Boolean(nearest && bank.draw(ctx, selected, nearest.index, placement));
      return { delivered, complete: delivered && selected !== 'idle',
        tier: definitions.find(row => row[0] === selected)[3] };
    },
    delivery: () => ({ ...status }),
    inspect: () => ({ disposed, selected, complete: selected === 'flight' || selected === 'emergency',
      decodedBaseBytes: decodedBytes, decodedImageOwners: atlas ? 1 : 0, delivery: { ...status } }),
    dispose() {
      if (disposed) return; disposed = true; generation++; release();
      for (const id of Object.keys(status)) status[id] = 'disposed';
    },
  };
}
