// SOUND SEEKERS WORLD BLUEPRINT
//
// The phonics sequence remains owned by questSequence.js. This file owns the
// journey wrapped around it: eight destinations, five curriculum stops each.
// Runtime systems should read this contract instead of deriving variety from
// the old three broad act names.

const stopIds = (first, last) => Array.from(
  { length: last - first + 1 },
  (_, offset) => `s${first + offset}`
);

const CHAPTER_FINALES = Object.freeze({
  "seedwake-meadow": Object.freeze({
    id: "bramble-chorus",
    cue: "bramble-gate",
    title: "Wake Bramble Gate",
    action: "Light the five lantern flowers and open the living gate.",
    consequence: "The meadow lanterns stay awake along every later path."
  }),
  "river-gardens": Object.freeze({
    id: "singing-weir-concert",
    cue: "singing-weir",
    title: "Restart the Singing Weir",
    action: "Turn the waterwheels together and send the sound cargo home.",
    consequence: "The garden channels keep flowing and reveal cache islands."
  }),
  "fossil-canyon": Object.freeze({
    id: "claw-pass-signal",
    cue: "claw-pass",
    title: "Reopen Claw Pass",
    action: "Raise the bone signal and guide the separated dig team through.",
    consequence: "Fossil trail marks remain visible across the canyon."
  }),
  "forge-settlement": Object.freeze({
    id: "word-forge-ignition",
    cue: "word-forge",
    title: "Ignite the Word Forge",
    action: "Start the forge rings and release the night reading train.",
    consequence: "Repaired machines stay lit throughout the settlement."
  }),
  "glass-marsh": Object.freeze({
    id: "mirror-fen-beacon",
    cue: "mirror-fen",
    title: "Relight Mirror Fen",
    action: "Tune the glass reeds and reflect one safe path through the mist.",
    consequence: "Hidden marsh routes keep their silver path-light."
  }),
  "storm-coast": Object.freeze({
    id: "thunder-lighthouse-beam",
    cue: "thunder-lighthouse",
    title: "Wake the Thunder Lighthouse",
    action: "Assemble the storm lens and sweep the harbour with its beam.",
    consequence: "The coast wind settles around signs and distant finds."
  }),
  "lantern-forest": Object.freeze({
    id: "observatory-turn",
    cue: "sleeping-observatory",
    title: "Turn the Sleeping Observatory",
    action: "Wake the dome, align the telescope and return the sky to the forest.",
    consequence: "Mapped branches remain marked by living lanterns."
  }),
  "star-reach": Object.freeze({
    id: "first-reading-star-awakening",
    cue: "first-reading-star",
    title: "Wake the First Reading Star",
    action: "Join the constellation road and send every gathered sound home.",
    consequence: "Every restored landmark shines across the whole journey."
  })
});

export const QUEST_CHAPTERS = Object.freeze([
  {
    id: "seedwake-meadow",
    index: 1,
    releaseStatus: "production",
    title: "Seedwake Meadow",
    stopRange: [1, 5],
    stopIds: stopIds(1, 5),
    worldKit: "meadow",
    destination: "Bramble Gate",
    conflict: "The meadow's sound-lanterns have gone dark and the gate vines will not open.",
    objective: "Wake the five lantern gardens and carry their notes to Bramble Gate.",
    optionalDiscovery: { title: "Bramble's trail note", message: "Bramble left a warm lantern here." },
    shortcut: { id: "lantern-run", label: "Lantern Run", action: "Follow the flowers between restored gardens.", effect: "Carries practice sounds through the places you repaired." },
    memoryStories: [
      { speaker: "Moss", line: "The seeds you woke are lighting new sound paths.", change: "Lantern flowers now mark the return lane." },
      { speaker: "Tumble", line: "Your bridge held through the night rain.", change: "The ford is open for every meadow friend." },
      { speaker: "Bramble", line: "The gate heard your sounds and grew another arch.", change: "A warm shortcut now crosses the brambles." },
      { speaker: "Moss", line: "I planted your brightest Spark beside the trail.", change: "Restored gardens point toward hidden caches." }
    ],
    finale: CHAPTER_FINALES["seedwake-meadow"],
    cast: {
      guide: { name: "Bouncy", role: "lantern keeper", archetype: "meadow-scout" },
      residents: [
        { name: "Moss", role: "seed gardener", archetype: "garden-tender" },
        { name: "Tumble", role: "ford builder", archetype: "river-builder" },
        { name: "Bramble", role: "gate keeper", archetype: "gate-warden" }
      ]
    },
    chapterReward: { id: "seedwake-lantern", label: "Seedwake Lantern", ability: "spark-magnet", abilityLabel: "Draws nearby sparks to you", worldEffect: "The meadow flowers sing when you pass." },
    mechanicRotation: ["sound-hunt", "flower-jump", "delivery-run", "bridge-build", "gate-chorus"],
    routeTopologies: ["meander", "branching-grove", "horseshoe", "switchback", "ridge-climb"],
    visual: { terrain: "flower meadow and shallow streams", landmark: "windmill lantern", weather: "bright morning to warm sunset", propSet: "orchards, reeds, stepping stones, woven fences" },
    audio: { score: "seedwake-ramble", ambience: "birds, bees, reeds and water" }
  },
  {
    id: "river-gardens",
    index: 2,
    releaseStatus: "software-ready",
    title: "River Gardens",
    stopRange: [6, 10],
    stopIds: stopIds(6, 10),
    worldKit: "meadow",
    destination: "The Singing Weir",
    conflict: "Runaway waterwheels are sending the garden boats down the wrong channels.",
    objective: "Redirect the river, rescue the sound cargo and restart the Singing Weir.",
    optionalDiscovery: { title: "Rill's river note", message: "Rill hid a ferry whistle by the water." },
    shortcut: { id: "lily-ferry", label: "Lily Ferry", action: "Ride the restored channel across the gardens.", effect: "Revisits weak sounds beside the working waterwheels." },
    memoryStories: [
      { speaker: "Fizz", line: "The sluice you sorted is watering every terrace.", change: "A lily ferry now stops at this bank." },
      { speaker: "Quill", line: "I drew your safe channel onto the river map.", change: "Blue markers reveal the return current." },
      { speaker: "Rill", line: "The rescued fish brought the missing bell home.", change: "The weir sings when your ferry passes." },
      { speaker: "Fizz", line: "Your wheel sequence keeps the upper garden flowing.", change: "A fast channel now links both riverbanks." }
    ],
    finale: CHAPTER_FINALES["river-gardens"],
    cast: {
      guide: { name: "Nori", role: "river pilot", archetype: "otter-pilot" },
      residents: [
        { name: "Fizz", role: "bee engineer", archetype: "meadow-engineer" },
        { name: "Quill", role: "canal cartographer", archetype: "map-maker" },
        { name: "Rill", role: "weir conductor", archetype: "river-conductor" }
      ]
    },
    chapterReward: { id: "river-whistle", label: "River Whistle", ability: "branch-caches", abilityLabel: "Reveals reward caches off the main trail", worldEffect: "Calls a lily ferry at marked riverbanks." },
    mechanicRotation: ["canal-sort", "ferry-delivery", "fish-rescue", "waterwheel-sequence", "weir-concert"],
    routeTopologies: ["horseshoe", "island-loop", "branching-grove", "figure-eight", "switchback"],
    visual: { terrain: "terraced ponds and river islands", landmark: "singing waterwheel", weather: "mist, sun showers and clear blue", propSet: "boats, lilies, sluice gates, garden arches" },
    audio: { score: "river-garden-paddle", ambience: "flowing water, frogs, wooden wheels and soft bells" }
  },
  {
    id: "fossil-canyon",
    index: 3,
    releaseStatus: "software-ready",
    title: "Fossil Canyon",
    stopRange: [11, 15],
    stopIds: stopIds(11, 15),
    worldKit: "dino",
    destination: "Claw Pass",
    conflict: "A dust fall has buried the fossil trail and separated the dig team.",
    objective: "Read the bone marks, find the missing crew and reopen Claw Pass.",
    optionalDiscovery: { title: "Amber's ridge note", message: "Amber marked a safe trail through the rocks." },
    shortcut: { id: "survey-zipline", label: "Survey Zipline", action: "Take the reopened ridge line over the fossil beds.", effect: "Returns to weak sounds along the marked dig route." },
    memoryStories: [
      { speaker: "Rook", line: "Your bone trail led us to a whole new footprint.", change: "Survey flags now mark the return ridge." },
      { speaker: "Amber", line: "The tracks you sorted brought the dig carts home.", change: "A rope line now crosses the lower shelf." },
      { speaker: "Claw", line: "That fossil frame survived the canyon wind.", change: "The restored arch points toward safe ground." },
      { speaker: "Rook", line: "The crew you found mapped a faster pass.", change: "The survey zipline now spans the canyon." }
    ],
    finale: CHAPTER_FINALES["fossil-canyon"],
    cast: {
      guide: { name: "Fen", role: "fossil ranger", archetype: "ridge-ranger" },
      residents: [
        { name: "Rook", role: "bone surveyor", archetype: "dino-scholar" },
        { name: "Amber", role: "dig captain", archetype: "excavator" },
        { name: "Claw", role: "pass runner", archetype: "ridge-runner" }
      ]
    },
    chapterReward: { id: "fossil-compass", label: "Fossil Compass", ability: "far-sight", abilityLabel: "Shows distant trail finds", worldEffect: "Reveals buried trail marks and optional cache paths." },
    mechanicRotation: ["bone-hunt", "track-sort", "dig-and-build", "rescue-chase", "pass-signal"],
    routeTopologies: ["ridge-climb", "switchback", "horseshoe", "branching-grove", "figure-eight"],
    visual: { terrain: "red canyon shelves and fossil beds", landmark: "giant rib arch", weather: "high sun, dust gusts and amber dusk", propSet: "dig tents, rope bridges, bone fields, survey flags" },
    audio: { score: "fossil-ridge-march", ambience: "wind, loose stones, canvas and distant calls" }
  },
  {
    id: "forge-settlement",
    index: 4,
    releaseStatus: "software-ready",
    title: "Forge Settlement",
    stopRange: [16, 20],
    stopIds: stopIds(16, 20),
    worldKit: "dino",
    destination: "The Word Forge",
    conflict: "The settlement's word machines are jammed and the night train cannot leave.",
    objective: "Repair the workshops, fuel the forge and assemble the train's reading plates.",
    optionalDiscovery: { title: "Bellows' forge note", message: "Bellows saved the first gear from the forge." },
    shortcut: { id: "night-train", label: "Night Train", action: "Board the repaired train between the workshops.", effect: "Carries review sounds past every working machine." },
    memoryStories: [
      { speaker: "Bolt", line: "The machine you restarted has not missed a beat.", change: "Its signal opens the workshop return rail." },
      { speaker: "Soot", line: "Your sorted ore forged three new reading plates.", change: "Loaded carts now clear the side platform." },
      { speaker: "Bellows", line: "The recipe you built is glowing in the master book.", change: "A lit gantry joins both forge floors." },
      { speaker: "Bolt", line: "The night train remembers the route you repaired.", change: "The shortcut train now waits at the gate." }
    ],
    finale: CHAPTER_FINALES["forge-settlement"],
    cast: {
      guide: { name: "Cinder", role: "forge apprentice", archetype: "forge-smith" },
      residents: [
        { name: "Bolt", role: "machine keeper", archetype: "workshop-mechanic" },
        { name: "Soot", role: "train driver", archetype: "rail-driver" },
        { name: "Bellows", role: "master smith", archetype: "forge-master" }
      ]
    },
    chapterReward: { id: "forge-tool", label: "Wordsmith Tool", ability: "repair-aura", abilityLabel: "Keeps repaired landmarks glowing", worldEffect: "Repairs marked machines and opens workshop shortcuts." },
    mechanicRotation: ["machine-sequence", "ore-sort", "forge-recipe", "rail-delivery", "word-forge"],
    routeTopologies: ["hub-and-spokes", "switchback", "figure-eight", "ridge-climb", "island-loop"],
    visual: { terrain: "cliff workshops and rail yards", landmark: "turning word forge", weather: "smoke shafts, sparks and cool night", propSet: "gears, rails, cranes, furnaces and market awnings" },
    audio: { score: "forge-yard-stomp", ambience: "hammers, steam, wheels and furnace pulses" }
  },
  {
    id: "glass-marsh",
    index: 5,
    releaseStatus: "software-ready",
    title: "Glass Marsh",
    stopRange: [21, 25],
    stopIds: stopIds(21, 25),
    worldKit: "moonwood",
    destination: "Mirror Fen",
    conflict: "Moon mist has frozen the reed mirrors and hidden the safe path across the marsh.",
    objective: "Tune the reed lights, free the marsh creatures and relight Mirror Fen.",
    optionalDiscovery: { title: "Glint's marsh note", message: "Glint left a moon-bright reed in the mist." },
    shortcut: { id: "silver-causeway", label: "Silver Causeway", action: "Follow the relit mirrors across the mist.", effect: "Reflects weak sounds through restored reed gardens." },
    memoryStories: [
      { speaker: "Ripple", line: "The reed you tuned now answers the evening insects.", change: "Its note lights the first causeway stone." },
      { speaker: "Mica", line: "Your lily route is carrying glass seeds again.", change: "Silver ripples mark a safe return path." },
      { speaker: "Glint", line: "The marsh creatures returned to the clear pools.", change: "Their lights reveal the hidden crossing." },
      { speaker: "Ripple", line: "Every mirror you matched is holding its beam.", change: "The Silver Causeway now spans the mist." }
    ],
    finale: CHAPTER_FINALES["glass-marsh"],
    cast: {
      guide: { name: "Vale", role: "marsh lightkeeper", archetype: "fen-guide" },
      residents: [
        { name: "Ripple", role: "reed tuner", archetype: "reed-musician" },
        { name: "Mica", role: "glass gardener", archetype: "crystal-tender" },
        { name: "Glint", role: "mirror watcher", archetype: "fen-watcher" }
      ]
    },
    chapterReward: { id: "mirror-reed", label: "Mirror Reed", ability: "path-glow", abilityLabel: "Lights branching and hidden paths", worldEffect: "Makes hidden marsh paths glow for a short time." },
    mechanicRotation: ["reed-listen", "lily-route", "marsh-fishing", "mirror-match", "fen-beacon"],
    routeTopologies: ["branching-grove", "island-loop", "spiral", "horseshoe", "figure-eight"],
    visual: { terrain: "shallow luminous marsh and glass reeds", landmark: "mirror lighthouse", weather: "blue mist, moonbreaks and silver rain", propSet: "reed mirrors, lily ferries, crystal pools, rope walkways" },
    audio: { score: "glass-marsh-drift", ambience: "reeds, water drops, insects and glass chimes" }
  },
  {
    id: "storm-coast",
    index: 6,
    releaseStatus: "software-ready",
    title: "Storm Coast",
    stopRange: [26, 30],
    stopIds: stopIds(26, 30),
    worldKit: "moonwood",
    destination: "Thunder Lighthouse",
    conflict: "The lighthouse lens is scattered across coves while a reading storm closes in.",
    objective: "Cross the cliffs, recover the lens pieces and guide the sound fleet home.",
    optionalDiscovery: { title: "Prism's coast note", message: "Prism left a weather flag for lost boats." },
    shortcut: { id: "harbour-boardwalk", label: "Harbour Boardwalk", action: "Race the repaired boardwalk beneath the lighthouse beam.", effect: "Reviews weak sounds between calm windbreaks." },
    memoryStories: [
      { speaker: "Kelp", line: "Your cliff markers stayed bright through the squall.", change: "Rope lights now line the return ledge." },
      { speaker: "Boom", line: "The cargo you carried reached every harbour boat.", change: "A raised boardwalk crosses the tide pools." },
      { speaker: "Prism", line: "Your storm shelter kept the sound flags dry.", change: "Calm windbreaks open a coastal shortcut." },
      { speaker: "Kelp", line: "The lens pieces are still sweeping the cove.", change: "The lighthouse beam marks the fast route." }
    ],
    finale: CHAPTER_FINALES["storm-coast"],
    cast: {
      guide: { name: "Skiff", role: "coast runner", archetype: "cliff-scout" },
      residents: [
        { name: "Kelp", role: "harbour keeper", archetype: "harbour-worker" },
        { name: "Boom", role: "storm drummer", archetype: "weather-caller" },
        { name: "Prism", role: "lens maker", archetype: "lighthouse-maker" }
      ]
    },
    chapterReward: { id: "storm-lens", label: "Storm Lens", ability: "reach-boost", abilityLabel: "Extends your in-world task reach", worldEffect: "Focuses distant signs and calms wind tunnels." },
    mechanicRotation: ["cliff-route", "harbour-delivery", "storm-shelter", "lens-assembly", "fleet-signal"],
    routeTopologies: ["ridge-climb", "horseshoe", "switchback", "branching-grove", "spiral"],
    visual: { terrain: "black cliffs, sea caves and harbour terraces", landmark: "thunder lighthouse", weather: "fast clouds, rain squalls and clear storm light", propSet: "buoys, sailcloth, cranes, tide pools and lens frames" },
    audio: { score: "storm-coast-skip", ambience: "surf, ropes, gull-like calls, rain and low thunder" }
  },
  {
    id: "lantern-forest",
    index: 7,
    releaseStatus: "software-ready",
    title: "Lantern Forest",
    stopRange: [31, 35],
    stopIds: stopIds(31, 35),
    worldKit: "moonwood",
    destination: "The Sleeping Observatory",
    conflict: "The forest paths keep rearranging and the observatory has lost the sky.",
    objective: "Wake the lantern trees, map the moving paths and turn the observatory dome.",
    optionalDiscovery: { title: "Orbit's moth map", message: "Orbit drew a star path on this moth map." },
    shortcut: { id: "mothway", label: "Living Mothway", action: "Follow the lantern moths between remembered branches.", effect: "Guides weak sounds through the restored forest." },
    memoryStories: [
      { speaker: "Luma", line: "The moths you guided built a new lantern roost.", change: "Their lights gather above the return branch." },
      { speaker: "Wisp", line: "Your lantern pattern is still travelling tree to tree.", change: "Root lights mark a stable forest lane." },
      { speaker: "Orbit", line: "The path you remembered stopped moving at last.", change: "A living mothway crosses the deep grove." },
      { speaker: "Luma", line: "Your telescope showed the moths their first star.", change: "They now guide visitors to the observatory." }
    ],
    finale: CHAPTER_FINALES["lantern-forest"],
    cast: {
      guide: { name: "Echo", role: "lantern cartographer", archetype: "forest-mapper" },
      residents: [
        { name: "Luma", role: "moth keeper", archetype: "lantern-tender" },
        { name: "Wisp", role: "path listener", archetype: "forest-listener" },
        { name: "Orbit", role: "observatory keeper", archetype: "star-scholar" }
      ]
    },
    chapterReward: { id: "lantern-map", label: "Living Lantern Map", ability: "route-memory", abilityLabel: "Guides you toward the next friend", worldEffect: "Marks discovered branches and return paths." },
    mechanicRotation: ["moth-herding", "lantern-pattern", "path-memory", "telescope-build", "observatory-turn"],
    routeTopologies: ["branching-grove", "spiral", "hub-and-spokes", "figure-eight", "ridge-climb"],
    visual: { terrain: "towering roots and glowing canopy bridges", landmark: "rotating woodland observatory", weather: "deep twilight, drifting spores and star shafts", propSet: "lantern pods, root stairs, suspended bridges, telescopes" },
    audio: { score: "lantern-forest-prowl", ambience: "moths, leaves, wooden creaks and distant tones" }
  },
  {
    id: "star-reach",
    index: 8,
    releaseStatus: "software-ready",
    title: "Star Reach",
    stopRange: [36, 40],
    stopIds: stopIds(36, 40),
    worldKit: "moonwood",
    destination: "The First Reading Star",
    conflict: "The final sky road is broken and every sound gathered on the journey is fading.",
    objective: "Rebuild the constellations, carry every sound home and wake the First Reading Star.",
    optionalDiscovery: { title: "A first reader's page", message: "The first readers left a page for you." },
    shortcut: { id: "constellation-rail", label: "Constellation Rail", action: "Ride the completed sky road between restored stars.", effect: "Carries every weak sound through the final memories." },
    memoryStories: [
      { speaker: "Comet", line: "The route you rebuilt is carrying dawn parcels.", change: "A comet rail now stops at the first garden." },
      { speaker: "Aster", line: "Your sound cargo became a new constellation.", change: "Star markers join the archive to the road." },
      { speaker: "Dawn", line: "The sorted lights are waking the eastern sky.", change: "A bright bridge now crosses the cloud gap." },
      { speaker: "Comet", line: "Every journey memory found its place in the sky.", change: "The Constellation Rail now runs end to end." }
    ],
    finale: CHAPTER_FINALES["star-reach"],
    cast: {
      guide: { name: "Nova", role: "star road keeper", archetype: "star-guide" },
      residents: [
        { name: "Comet", role: "sky courier", archetype: "star-runner" },
        { name: "Aster", role: "constellation builder", archetype: "sky-builder" },
        { name: "Dawn", role: "first-light singer", archetype: "final-guardian" }
      ]
    },
    chapterReward: { id: "first-reading-star", label: "First Reading Star", ability: "world-light", abilityLabel: "Illuminates every restored landmark", worldEffect: "Lights every restored landmark across the full trail." },
    mechanicRotation: ["constellation-route", "sky-delivery", "star-sort", "memory-journey", "reading-finale"],
    routeTopologies: ["spiral", "ridge-climb", "figure-eight", "hub-and-spokes", "constellation"],
    visual: { terrain: "floating stone gardens and sky bridges", landmark: "first reading star", weather: "moving constellations, dawn bands and meteor showers", propSet: "star rails, floating ruins, light bridges, constellation frames" },
    audio: { score: "star-reach-finale", ambience: "high wind, glass harmonics, distant chorus and star pulses" }
  }
]);

const CHAPTER_BY_STOP = new Map(
  QUEST_CHAPTERS.flatMap(chapter => chapter.stopIds.map(stopId => [stopId, chapter]))
);

export function chapterForStop(stopOrId) {
  const value = typeof stopOrId === "object" ? (stopOrId?.id || stopOrId?.index) : stopOrId;
  const stopId = typeof value === "number" ? `s${value}` : String(value || "");
  return CHAPTER_BY_STOP.get(stopId) || null;
}

export function chapterStopNumber(stopOrId) {
  const chapter = chapterForStop(stopOrId);
  if (!chapter) return 0;
  const value = typeof stopOrId === "object" ? (stopOrId?.id || stopOrId?.index) : stopOrId;
  const stopId = typeof value === "number" ? `s${value}` : String(value || "");
  return chapter.stopIds.indexOf(stopId) + 1;
}

export function chapterRouteTopology(stopOrId) {
  const chapter = chapterForStop(stopOrId);
  const localIndex = chapterStopNumber(stopOrId) - 1;
  return chapter?.routeTopologies?.[localIndex] || "meander";
}

export function chapterFinaleForStop(stopOrId) {
  const chapter = chapterForStop(stopOrId);
  if (!chapter) return null;
  const value = typeof stopOrId === "object" ? (stopOrId?.id || stopOrId?.index) : stopOrId;
  const stopId = typeof value === "number" ? `s${value}` : String(value || "");
  return chapter.stopIds.at(-1) === stopId ? { ...chapter.finale, chapterId: chapter.id } : null;
}

export function validateQuestChapters(chapters = QUEST_CHAPTERS) {
  const errors = [];
  const stopSet = new Set();
  const rewardSet = new Set();
  const shortcutSet = new Set();
  chapters.forEach((chapter, chapterIndex) => {
    if (chapter.index !== chapterIndex + 1) errors.push(`${chapter.id}: chapter index is not sequential`);
    if (!["production", "software-ready", "prototype"].includes(chapter.releaseStatus)) errors.push(`${chapter.id}: invalid release status`);
    if (chapter.stopIds.length !== 5) errors.push(`${chapter.id}: expected exactly five stops`);
    if (new Set(chapter.routeTopologies).size < 4) errors.push(`${chapter.id}: route topology repeats too often`);
    if (chapter.mechanicRotation.length !== 5) errors.push(`${chapter.id}: expected five mechanic beats`);
    if (!chapter.finale?.id || !chapter.finale?.cue || !chapter.finale?.action || !chapter.finale?.consequence) {
      errors.push(`${chapter.id}: chapter finale is incomplete`);
    }
    if (!chapter.optionalDiscovery?.title || !chapter.optionalDiscovery?.message) {
      errors.push(`${chapter.id}: optional discovery is incomplete`);
    }
    if (!chapter.shortcut?.id || !chapter.shortcut?.label || !chapter.shortcut?.action || !chapter.shortcut?.effect) {
      errors.push(`${chapter.id}: chapter shortcut is incomplete`);
    } else if (shortcutSet.has(chapter.shortcut.id)) {
      errors.push(`${chapter.shortcut.id}: duplicate chapter shortcut`);
    } else {
      shortcutSet.add(chapter.shortcut.id);
    }
    if (!Array.isArray(chapter.memoryStories) || chapter.memoryStories.length !== 4) {
      errors.push(`${chapter.id}: expected four restored-world memories`);
    } else {
      const residents = new Set((chapter.cast?.residents || []).map(resident => resident.name));
      chapter.memoryStories.forEach((story, memoryIndex) => {
        if (!residents.has(story?.speaker) || !story?.line || !story?.change) {
          errors.push(`${chapter.id}: memory ${memoryIndex + 1} is incomplete`);
        }
      });
      if (new Set(chapter.memoryStories.map(story => story.line)).size !== chapter.memoryStories.length) {
        errors.push(`${chapter.id}: restored-world memory lines must be unique`);
      }
    }
    chapter.stopIds.forEach(stopId => {
      if (stopSet.has(stopId)) errors.push(`${stopId}: assigned to more than one chapter`);
      stopSet.add(stopId);
    });
    if (rewardSet.has(chapter.chapterReward.id)) errors.push(`${chapter.chapterReward.id}: duplicate chapter reward`);
    if (!chapter.chapterReward.ability || !chapter.chapterReward.abilityLabel) errors.push(`${chapter.id}: chapter reward has no usable ability`);
    rewardSet.add(chapter.chapterReward.id);
  });
  if (new Set(chapters.map(chapter => chapter.finale?.cue)).size !== chapters.length) {
    errors.push("chapter finale cues must be unique");
  }
  for (let index = 1; index <= 40; index += 1) {
    if (!stopSet.has(`s${index}`)) errors.push(`s${index}: missing chapter assignment`);
  }
  return errors;
}
