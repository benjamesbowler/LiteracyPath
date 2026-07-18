const recipe = (pattern, shape, layout, actions, completionShape, mission) => Object.freeze({
  pattern,
  shape,
  layout,
  actions: Object.freeze(actions),
  completionShape,
  mission
});

export const CHAPTER_VERB_RECIPES = Object.freeze({
  "canal-sort": recipe("sort", "river-sign", "sorting-lane", ["choose-sluice", "open-sluice"], "opened-sluice", "Choose the matching channel, then open its sluice."),
  "ferry-delivery": recipe("steer", "ferry-parcel", "delivery", ["board-ferry", "steer-ferry"], "docked-parcel", "Board the matching sound cargo, then steer through the river gates."),
  "fish-rescue": recipe("pursuit", "river-fish", "scatter", ["spot-fish", "net-fish"], "rescued-fish", "Spot the matching fish, then catch it in the pool."),
  "waterwheel-sequence": recipe("assembly", "wheel-paddle", "workshop", ["lift-paddle", "fit-paddle"], "fitted-paddle", "Fit the sound paddles in order."),
  "weir-concert": recipe("rhythm", "weir-bell", "circle", ["choose-note", "ring-bell"], "ringing-bell", "Play the matching river bells."),

  "bone-hunt": recipe("tool", "fossil-rune", "scatter", ["choose-fossil", "brush-fossil"], "brushed-fossil", "Brush the fossil that matches the sound."),
  "track-sort": recipe("route", "track-sign", "circle", ["choose-track", "follow-track"], "marked-track", "Follow the matching track."),
  "dig-and-build": recipe("assembly", "fossil-bone", "workshop", ["lift-bone", "fit-bone"], "fitted-bone", "Dig up and fit the fossil pieces."),
  "rescue-chase": recipe("pursuit", "rescue-flag", "stepping", ["spot-signal", "chase-flag"], "rescue-marker", "Find the missing ranger's signal, then run to it."),
  "pass-signal": recipe("signal", "fossil-beacon", "circle", ["choose-signal", "send-signal"], "lit-fossil-beacon", "Send the sound signal through the pass."),

  "machine-sequence": recipe("assembly", "forge-gear", "workshop", ["lift-gear", "fit-gear"], "turning-gear", "Repair the machine in sound order."),
  "ore-sort": recipe("sort", "forge-ore", "sorting-lane", ["choose-ore", "sort-ore"], "sorted-ore", "Choose the matching ore, then tip it into the hopper."),
  "forge-recipe": recipe("assembly", "forge-rune", "workshop", ["lift-rune", "feed-forge"], "forged-rune", "Feed the sounds into the forge in order."),
  "rail-delivery": recipe("delivery", "rail-parcel", "delivery", ["load-crate", "deliver-crate"], "delivered-crate", "Take the reading plate to the night train."),
  "word-forge": recipe("rhythm", "word-plate", "circle", ["choose-plate", "strike-plate"], "forged-plate", "Strike the sound plate when the forge glows."),

  "reed-listen": recipe("rhythm", "marsh-reed", "circle", ["choose-reed", "tune-reed"], "tuned-reed", "Tune the reed that matches the sound."),
  "lily-route": recipe("route", "marsh-lily", "stepping", ["choose-lily", "cross-lily"], "lit-lily", "Step onto the matching lily."),
  "marsh-fishing": recipe("pursuit", "marsh-fish", "scatter", ["spot-marsh-fish", "net-marsh-fish"], "rescued-marsh-fish", "Spot the fish carrying the sound, then catch it."),
  "mirror-match": recipe("assembly", "mirror-shard", "workshop", ["lift-shard", "fit-shard"], "fitted-mirror", "Fit the mirror sounds in order."),
  "fen-beacon": recipe("signal", "fen-beacon", "circle", ["choose-light", "flash-light"], "lit-fen-beacon", "Flash the matching fen lights."),

  "cliff-route": recipe("climb", "cliff-sign", "stepping", ["choose-climb", "climb-route"], "cliff-marker", "Choose the marked route, then climb the cliff holds."),
  "harbour-delivery": recipe("delivery", "harbour-crate", "delivery", ["lift-crate", "dock-crate"], "docked-crate", "Carry the sound crate to the harbour."),
  "storm-shelter": recipe("assembly", "shelter-board", "workshop", ["lift-board", "lock-board"], "locked-shelter", "Build the storm shelter in sound order."),
  "lens-assembly": recipe("assembly", "lens-shard", "workshop", ["lift-lens", "fit-lens"], "fitted-lens", "Rebuild the lighthouse lens."),
  "fleet-signal": recipe("signal", "fleet-flag", "circle", ["choose-flag", "wave-flag"], "fleet-light", "Signal the matching sound to the fleet."),

  "moth-herding": recipe("pursuit", "lantern-moth", "scatter", ["spot-moth", "guide-moth"], "resting-moth", "Find the matching moth, then guide it home."),
  "lantern-pattern": recipe("rhythm", "forest-lantern", "circle", ["choose-lantern", "light-lantern"], "lit-forest-lantern", "Repeat the lantern sound pattern."),
  "path-memory": recipe("route", "memory-sign", "circle", ["choose-memory-path", "follow-memory-path"], "remembered-path", "Choose the path that remembers the sound."),
  "telescope-build": recipe("assembly", "telescope-part", "workshop", ["lift-telescope-part", "fit-telescope-part"], "built-telescope", "Build the telescope in sound order."),
  "observatory-turn": recipe("turn", "orbit-dial", "circle", ["choose-orbit", "turn-orbit"], "aligned-observatory", "Turn the observatory to the matching sound."),

  "constellation-route": recipe("route", "star-node", "stepping", ["choose-star", "step-star"], "joined-star", "Follow the matching constellation star."),
  "sky-delivery": recipe("delivery", "sky-parcel", "delivery", ["lift-sky-parcel", "deliver-sky-parcel"], "delivered-star", "Carry the sound across the sky road."),
  "star-sort": recipe("sort", "star-token", "sorting-lane", ["choose-star", "sort-star"], "sorted-star", "Choose the matching star, then carry it to the prism."),
  "memory-journey": recipe("assembly", "memory-rune", "workshop", ["lift-memory", "restore-memory"], "restored-memory", "Restore the journey sounds in order."),
  "reading-finale": recipe("rhythm", "reading-star", "circle", ["choose-reading-sound", "release-reading-sound"], "awakened-reading-star", "Send every matching sound into the First Reading Star.")
});

export function chapterVerbRecipe(mechanic) {
  return CHAPTER_VERB_RECIPES[mechanic] || null;
}

export function chapterVerbForSection(section) {
  const stopIndex = Math.max(0, Number(section?.chapterStop || 1) - 1);
  return section?.chapter?.mechanicRotation?.[stopIndex] || null;
}
