// Seedwake Meadow is the production reference chapter. This file owns the
// chapter-specific story, physical verbs, collectibles, repairs, and satchel
// thresholds. Curriculum remains in questSequence.js.

export const SEEDWAKE_STOP_SPECS = Object.freeze({
  s1: Object.freeze({
    stopId: "s1",
    mechanic: "sound-hunt",
    verb: "find",
    mission: "Find the sleeping seed-lanterns around Hollow Tree.",
    arrival: "Moss has found the first dark lantern bed.",
    success: "Hollow Tree is glowing again.",
    collectible: Object.freeze({ id: "lantern-seed", label: "lantern seed", plural: "lantern seeds" }),
    repair: Object.freeze({ id: "hollow-tree-lights", label: "Hollow Tree lanterns" })
  }),
  s2: Object.freeze({
    stopId: "s2",
    mechanic: "flower-jump",
    verb: "jump",
    mission: "Jump across the waking flowers to climb Fern Steps.",
    arrival: "The fern stair has folded itself shut.",
    success: "The Fern Steps have opened.",
    collectible: Object.freeze({ id: "fern-light", label: "fern light", plural: "fern lights" }),
    repair: Object.freeze({ id: "fern-step-blooms", label: "Fern Step blooms" })
  }),
  s3: Object.freeze({
    stopId: "s3",
    mechanic: "delivery-run",
    verb: "carry",
    mission: "Read Bramble's parcels and carry each one to the Rook Stones.",
    arrival: "Bramble's sound parcels are scattered across the path.",
    success: "The Rook Stones are singing together.",
    collectible: Object.freeze({ id: "rook-note", label: "rook note", plural: "rook notes" }),
    repair: Object.freeze({ id: "rook-stone-chorus", label: "Rook Stone chorus" })
  }),
  s4: Object.freeze({
    stopId: "s4",
    mechanic: "bridge-build",
    verb: "build",
    mission: "Read the sound pieces and rebuild the crossing at Otter Ford.",
    arrival: "The river has lifted every piece of Otter Ford.",
    success: "Otter Ford is carrying travellers again.",
    collectible: Object.freeze({ id: "river-rivet", label: "river rivet", plural: "river rivets" }),
    repair: Object.freeze({ id: "otter-ford-crossing", label: "Otter Ford crossing" })
  }),
  s5: Object.freeze({
    stopId: "s5",
    mechanic: "gate-chorus",
    verb: "conduct",
    mission: "Conduct the five lantern gardens and wake Bramble Gate.",
    arrival: "Every lantern is ready, but the gate needs their sounds in tune.",
    success: "Bramble Gate is awake and Seedwake Meadow is restored.",
    collectible: Object.freeze({ id: "gate-chime", label: "gate chime", plural: "gate chimes" }),
    repair: Object.freeze({ id: "bramble-gate", label: "Bramble Gate" })
  })
});

export const SEEDWAKE_STOP_IDS = Object.freeze(Object.keys(SEEDWAKE_STOP_SPECS));

export const SEEDWAKE_CACHE_THRESHOLDS = Object.freeze([3, 8, 14]);

export function seedwakeStopSpec(stopOrId) {
  const id = typeof stopOrId === "object" ? stopOrId?.id : stopOrId;
  return SEEDWAKE_STOP_SPECS[id] || null;
}

export function seedwakeCollectibleForStop(stopOrId) {
  return seedwakeStopSpec(stopOrId)?.collectible || null;
}

export function seedwakeSatchel(state) {
  const drops = state?.trail?.drops || {};
  const completed = new Set(state?.trail?.stopsDone || []);
  const pockets = SEEDWAKE_STOP_IDS.map(stopId => {
    const spec = SEEDWAKE_STOP_SPECS[stopId];
    return {
      ...spec.collectible,
      stopId,
      count: Math.max(0, Number(drops[stopId]) || 0),
      repaired: completed.has(stopId),
      repair: spec.repair
    };
  });
  const total = pockets.reduce((sum, pocket) => sum + pocket.count, 0);
  const cacheCount = SEEDWAKE_CACHE_THRESHOLDS.filter(threshold => total >= threshold).length;
  const nextCacheAt = SEEDWAKE_CACHE_THRESHOLDS.find(threshold => total < threshold) || null;
  return {
    pockets,
    total,
    repairs: pockets.filter(pocket => pocket.repaired).map(pocket => pocket.repair),
    cacheCount,
    nextCacheAt,
    sparksBanked: total * 2,
    collectionComplete: pockets.every(pocket => pocket.count > 0)
  };
}

export function validateSeedwakeChapter() {
  const mechanics = new Set();
  const collectibles = new Set();
  const repairs = new Set();
  const errors = [];
  for (const [stopId, spec] of Object.entries(SEEDWAKE_STOP_SPECS)) {
    if (!spec.mission || !spec.success) errors.push(`${stopId}: missing story direction`);
    if (mechanics.has(spec.mechanic)) errors.push(`${stopId}: repeats mechanic ${spec.mechanic}`);
    if (collectibles.has(spec.collectible.id)) errors.push(`${stopId}: repeats collectible ${spec.collectible.id}`);
    if (repairs.has(spec.repair.id)) errors.push(`${stopId}: repeats repair ${spec.repair.id}`);
    mechanics.add(spec.mechanic);
    collectibles.add(spec.collectible.id);
    repairs.add(spec.repair.id);
  }
  return errors;
}
