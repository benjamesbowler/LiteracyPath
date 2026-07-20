import fs from "node:fs";
import path from "node:path";
import { STOP_PIXEL_MAPS } from "../src/data/questPixelMaps.js";

const ROOT = process.cwd();
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
const fail = message => {
  console.error(`PIXEL QUEST CHECK FAILED: ${message}`);
  process.exitCode = 1;
};
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) fail(`${label} is missing ${needle}`);
};

const packageJson = JSON.parse(read("package.json"));
if (!String(packageJson.dependencies?.phaser || "").includes("4.2.0")) {
  fail("Phaser 4.2.0 is not pinned in dependencies");
}

const viteConfig = read("vite.config.js");
const performance = read("src/utils/questPerformance.js");
const root = read("src/components/quest/QuestRoot.jsx");
const component = read("src/components/quest/world/QuestPixelWorld.jsx");
const fallback = read("src/components/quest/world/QuestTrail2D.jsx");
const runtime = read("src/components/quest/world/questPixelRuntime.js");
const avatar = read("src/components/quest/world/questPixelAvatar.js");
const chapterMechanics = read("src/data/questChapterMechanics.js");
const pixelCast = read("src/data/questPixelCast.js");
const sliceSystems = read("src/utils/questSliceSystems.js");
const physicalPlan = read("src/utils/questPhysicalPlan.js");
const reward = read("src/components/quest/RewardScreen.jsx");
const phaserSurface = read("src/vendor/phaserSoundSeekers.cjs");

const pngDimensions = relative => {
  const data = fs.readFileSync(path.join(ROOT, assetRoot, relative));
  if (data.toString("ascii", 1, 4) !== "PNG") {
    fail(`asset is not a PNG: ${relative}`);
    return { width: 0, height: 0 };
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
};

requireText(performance, "{ id: \"pixel\", label: \"Pixel adventure\" }", "display-mode registry");
requireText(viteConfig, "src/vendor/phaserSoundSeekers.cjs", "Sound Seekers Phaser build");
requireText(viteConfig, "'typeof CANVAS_RENDERER': 'true'", "Canvas renderer feature flag");
requireText(viteConfig, "'typeof WEBGL_RENDERER': 'false'", "disabled Phaser WebGL feature flag");
requireText(viteConfig, "optimizeDeps", "development Phaser feature flags");
requireText(viteConfig, "global: 'globalThis'", "browser-safe Phaser global");
requireText(phaserSurface, "phaser-core.js", "trimmed Phaser core");
requireText(phaserSurface, "physics/arcade/ArcadePhysics.js", "explicit Arcade physics plugin");
for (const factory of ["ContainerFactory", "ArcFactory", "EllipseFactory", "RectangleFactory", "ZoneFactory"]) {
  requireText(phaserSurface, `${factory}.js`, `${factory} registration`);
}
for (const subsystem of [
  "phaser-arcade-physics.js",
  "gameobjects/video",
  "gameobjects/particles",
  "gameobjects/rope",
  "gameobjects/domelement",
  "gameobjects/bitmaptext",
  "tilemaps/Tilemap"
]) {
  if (phaserSurface.includes(subsystem)) fail(`trimmed Phaser surface imports ${subsystem}`);
}
requireText(root, "const QuestPixelWorld = lazyWithRetry(", "retrying lazy renderer boundary");
requireText(root, "() => import(\"./world/QuestPixelWorld.jsx\")", "pixel renderer dynamic import");
requireText(root, "{ reloadOnFailure: false }", "in-place 2D fallback policy");
requireText(root, "usePixel", "QuestRoot pixel branch");
requireText(root, "ceremonyOverlayVisible", "in-world finale reveal window");
requireText(component, "ceremony: Boolean(ceremony)", "pixel finale scene state");
requireText(runtime, "antialias: false", "crisp Phaser renderer");
requireText(runtime, "smoothPixelArt: false", "crisp Phaser renderer");
requireText(runtime, "pixelArt: true", "crisp Phaser renderer");
requireText(runtime, "roundPixels: true", "crisp Phaser renderer");
requireText(runtime, "powerPreference: \"high-performance\"", "Phaser renderer");
requireText(runtime, "choiceInside.has(choice.id)", "choice contact debounce");
requireText(runtime, "distance <= choice.radius + 12", "new-stage overlap latch");
requireText(runtime, "const clearDistance = choice.radius + (shortRelease ? 4 : 15)", "role-aware post-choice separation");
requireText(runtime, "this.cameras.main.startFollow(this.cameraFocus", "encounter-safe camera framing");
requireText(runtime, "questCameraTravelTarget", "bounded velocity-aware travel camera anticipation");
requireText(runtime, "questPointerObstacleVector", "collision-aware pointer steering");
requireText(runtime, "resolveQuestObstacleContacts", "solid scenery contact and sliding");
requireText(runtime, "this.navigationObstacles.push", "authored solid scenery registry");
requireText(runtime, "questCeremonySfxSequence", "timed chapter-material ceremony sound arc");
requireText(runtime, "for (const timer of this.ceremonyTimers) timer.remove(false)", "ceremony sound timer teardown");
requireText(runtime, "const forward = { x: 0, y: 1 }", "stable screen-readable choice staging");
requireText(runtime, "syncCarriedObject", "visible carry-state prop");
requireText(runtime, "stage?.carryFromStage == null", "stage-zero carry support");
requireText(runtime, "questPixelChoiceOffsets", "phone-safe answer staging");
requireText(runtime, "questPixelAvoidActorOverlap", "actor-safe answer staging");
requireText(sliceSystems, "groupShiftX", "group-safe narrow-screen sorting lane fit");
requireText(runtime, "createEncounterClearingCanvas", "tile-authored encounter clearings");
requireText(runtime, "ctx.ellipse(centreX, centreY", "organic encounter clearing edge");
requireText(runtime, "const embeddedLabel", "diegetic short-grapheme labels");
requireText(runtime, "PIXEL_LOWERCASE_GLYPHS", "renderer-stable lowercase task alphabet");
requireText(runtime, "const authoredLabelBadge", "body-mounted authored-object labels");
requireText(runtime, "seedwake-premium-hollow-tree", "premium Seedwake landmarks");
requireText(runtime, "premiumSeedwake", "premium Seedwake scenery variation");
requireText(runtime, "river-premium-waterwheel", "premium River Gardens landmarks");
requireText(runtime, "premiumRiver", "premium River Gardens scenery variation");
requireText(runtime, "fossil-premium-brush-station", "premium Fossil Canyon task-object kit");
requireText(runtime, "forge-premium-word-forge", "premium Forge Settlement landmark kit");
requireText(runtime, "forge-premium-gear-socket", "premium Forge Settlement task-object kit");
requireText(runtime, "glass-premium-mirror-fen-beacon", "premium Glass Marsh landmark kit");
requireText(runtime, "glass-premium-mirror-socket", "premium Glass Marsh task-object kit");
requireText(runtime, "storm-premium-thunder-lighthouse", "premium Storm Coast landmark kit");
requireText(runtime, "storm-premium-lens-socket", "premium Storm Coast task-object kit");
requireText(runtime, "lantern-premium-sleeping-observatory", "premium Lantern Forest landmark kit");
requireText(runtime, "lantern-premium-observatory-socket", "premium Lantern Forest task-object kit");
requireText(runtime, "star-premium-first-reading-star", "premium Star Reach landmark kit");
requireText(runtime, "star-premium-reading-star-socket", "premium Star Reach task-object kit");
requireText(runtime, "activeVerbProfile", "activity-specific movement and camera direction");
requireText(runtime, "playActionPerformance", "activity-specific character performance");
requireText(runtime, 'profile.response === "steer" && stage.steerStep', "ferry steering channel");
requireText(runtime, 'item.role === "steer-gate"', "ferry steering gates");
requireText(runtime, 'stage?.verbPattern === "steer"', "visible ferry boarding state");
requireText(runtime, 'profile.response === "signal" && stage.signalStep', "visible signal relay");
requireText(runtime, "updateSignalChoice", "sustained signal alignment");
requireText(runtime, 'profile.response === "climb" && stage.climbStep', "visible cliff face");
requireText(runtime, "updateClimbChoice", "sustained climbing holds");
requireText(runtime, "destroyTweenedObject", "stage tween disposal");
requireText(runtime, "!this.gateGlowTween", "single gate glow tween guard");
requireText(runtime, "getDiagnostics()", "live runtime health counters");
requireText(runtime, "this.tweens?.getTweens?.().length", "live tween count");
requireText(component, "onDiagnostics: diagnostics", "runtime health telemetry bridge");
requireText(component, "data-runtime-tweens", "read-only runtime health inspection");
requireText(runtime, "Math.exp(-Math.max(1, delta)", "eased pixel locomotion");
requireText(runtime, "this.model.activeStage?.rhythm", "direct rhythm interaction");
requireText(sliceSystems, "questPixelVerbProfile", "authored pixel verb profiles");
requireText(runtime, "const WORLD_THEMES", "multi-world pixel art direction");
for (const world of ["meadow", "dino", "moonwood"]) {
  requireText(runtime, `${world}: Object.freeze({`, `${world} pixel kit`);
}
requireText(runtime, "CHAPTER_PIXEL_PROFILES", "chapter-specific pixel art direction");
requireText(runtime, "createStopMapComposition", "stop-authored scene composition");
requireText(runtime, "pixelResidentPoint", "stop-authored resident staging");
requireText(runtime, "const choiceLeft = cameraCentreX - visibleHalfWidth + 48", "camera-safe authored clearings");
const stopMaps = Object.values(STOP_PIXEL_MAPS);
const routeAuthoredMaps = stopMaps.filter(map => map.authorship === "route-authored");
const generatedMaps = stopMaps.filter(map => map.authorship === "generated");
if (stopMaps.length !== 40) fail(`expected 40 stop map briefs, found ${stopMaps.length}`);
if (new Set(stopMaps.map(map => map.motif)).size !== 40) fail("stop map motifs are not unique");
if (routeAuthoredMaps.length !== 40) fail(`expected all 40 stop maps to be route-authored, found ${routeAuthoredMaps.length}`);
if (generatedMaps.length !== 0) fail(`expected no generated-map backlog, found ${generatedMaps.length}`);
for (const [index, map] of routeAuthoredMaps.entries()) {
  if (!Array.isArray(map.routePoints) || map.routePoints.length < 8) fail(`s${index + 1} has no authored route coordinates`);
  if (!map.landmarkAnchor) fail(`s${index + 1} has no authored landmark anchor`);
  if (!Array.isArray(map.sceneryAnchors) || map.sceneryAnchors.length < 10) fail(`s${index + 1} has no authored scenery composition`);
}
requireText(runtime, "samplePixelMapRoute(map.routePoints, progress)", "authored route runtime");
requireText(runtime, 'setData("authoredStopScenery", true)', "authored scenery runtime");
for (const chapter of [
  "seedwake-meadow",
  "river-gardens",
  "fossil-canyon",
  "forge-settlement",
  "glass-marsh",
  "storm-coast",
  "lantern-forest",
  "star-reach"
]) {
  requireText(runtime, `"${chapter}": Object.freeze({`, `${chapter} pixel profile`);
}
for (const landmark of ["singing-weir", "rib-camp", "word-forge", "mirror-fen", "thunder-lighthouse", "sleeping-observatory", "reading-star"]) {
  requireText(runtime, `landmark: "${landmark}"`, `${landmark} set piece`);
}
requireText(runtime, "this.bridge.onError?.(", "pixel renderer error boundary");
requireText(component, "onError: reason => onSceneError?.(reason)", "accessible renderer fallback");
requireText(runtime, "this.bridge.onGate?.()", "continuous gate callback");
requireText(runtime, "function addChoiceArt", "mechanic-specific world-object factory");
requireText(runtime, "syncCompletions", "persistent task consequences");
requireText(runtime, "burstCache", "physical secret-cache response");
requireText(runtime, "updateReactiveFoliage", "reactive traversal scenery");
requireText(runtime, "quest-weather-rain-splash", "authored Storm Coast rain response");
requireText(runtime, "quest-weather-cloud", "authored River Gardens mist");
requireText(runtime, "quest-weather-snow", "authored Star Reach particles");
requireText(runtime, "seedwake-shaman-lion", "expanded animated resident cast");
requireText(runtime, "QUEST_PIXEL_CHAPTER_CASTS", "chapter-specific animated resident cast");
requireText(runtime, "questPixelResidentItemPath", "authored resident item performances");
requireText(runtime, "questPixelResidentJumpPath", "authored resident celebration performances");
requireText(runtime, "-jump-sheet", "resident celebrations no longer borrow walking frames");
requireText(runtime, "-item-sheet", "resident work no longer borrows walking frames");
requireText(runtime, "questPixelCeremonyFormation", "in-world chapter-cast formation");
requireText(runtime, "questPixelNamedChapterCast", "stable named in-world chapter cast");
requireText(runtime, "questPixelResidentKey", "named encounter identity");
if (runtime.includes("index % sourceKeys.length")) fail("short finale casts are still padded with duplicate residents");
requireText(runtime, "syncCeremony(Boolean(model.ceremony))", "in-world finale synchronisation");
requireText(runtime, "CEREMONY_RELIC_SHAPES", "chapter relic visual identities");
requireText(runtime, 'setData("chapterRelic"', "physical chapter relic handoff");
requireText(runtime, "createArenaPlazaCanvas", "textured chapter-finale plaza");
if (runtime.includes("fillCircle(center, y, 102)")) fail("chapter finale still uses the oversized procedural target floor");
requireText(fallback, "questPixelResidentKey", "accessible named-cast parity");
requireText(reward, "questPixelResidentKey", "named ceremony-cast parity");
requireText(reward, "questPixelResidentJumpPath", "authored ceremony performance parity");
for (const resident of ["seedwake-ninja-blue", "seedwake-samurai-blue", "seedwake-samurai-green"]) {
  requireText(pixelCast, `"${resident}"`, `${resident} cast registry`);
}
requireText(runtime, "seedwake-success", "non-voice feedback audio");
requireText(component, "applyQuestTaskInput(", "shared physical verb integration");
requireText(component, "recordCorrectionMiss(", "correction ladder integration");
requireText(component, "nextQueuedReview(", "deferred review integration");
requireText(component, "pixelPosition", "checkpoint position integration");
requireText(component, "const [section] = useState(", "stable pixel stop plan");
requireText(component, "hasGraphemeAudio", "honest grapheme replay controls");
requireText(component, "stageCueAvailable", "honest encounter replay controls");
requireText(fallback, "const [section] = useState(", "stable 2D stop plan");
requireText(fallback, "stageCueAvailable", "honest 2D replay controls");
requireText(component, "budgetPhysicalSection(", "pixel physical-action budget");
requireText(fallback, "budgetPhysicalSection(", "2D physical-action budget");
requireText(physicalPlan, "QUEST_PHYSICAL_ACTION_BUDGET = 10", "real child-action budget");
requireText(read("src/utils/questEncounters.js"), "buildAudibleLetterRound", "audible advanced-sound fallback");
requireText(sliceSystems, "CHAPTER_VERB_HANDLERS", "later-chapter stateful verb handlers");
for (const pattern of ["delivery", "assembly", "pursuit", "route", "sort", "tool", "turn", "steer", "signal", "climb", "rhythm"]) {
  requireText(chapterMechanics, `recipe("${pattern}"`, `${pattern} chapter verb recipes`);
}
const authoredVerbCount = [...chapterMechanics.matchAll(/^\s+"[a-z-]+": recipe\(/gm)].length;
if (authoredVerbCount !== 35) fail(`expected 35 later-chapter verb recipes, found ${authoredVerbCount}`);

for (const direction of ["down", "left", "right", "up"]) {
  requireText(avatar, `"${direction}"`, "four-direction Beastie");
}
for (const feature of ["pattern", "eyes", "mouth", "crest", "tail", "feet", "equipped"]) {
  requireText(avatar, `creature.${feature}`, `Beastie ${feature} rendering`);
}
requireText(avatar, "image.data[offset + 3] = 255", "hard pixel-alpha Beastie edges");
requireText(avatar, "Math.round(shifted / 17) * 17", "quantised Beastie palette");
if (component.includes("@react-three") || runtime.includes("@react-three")) {
  fail("pixel renderer imports React Three Fiber");
}

const assetRoot = "public/game-assets/quest-pixel";
const assets = [
  "SOURCE.md",
  "license/CC0-1.0.txt",
  "seedwake/tiles/field.png",
  "seedwake/tiles/nature.png",
  "seedwake/tiles/village.png",
  "seedwake/characters/mask-frog/walk.png",
  "seedwake/characters/spirit/walk.png",
  "seedwake/characters/green-pig/walk.png",
  "seedwake/characters/shaman-lion/walk.png",
  "seedwake/characters/egg-boy/walk.png",
  "seedwake/characters/ninja-blue/walk.png",
  "seedwake/characters/samurai-blue/walk.png",
  "seedwake/characters/samurai-green/walk.png",
  "seedwake/animated/flag-green.png",
  "seedwake/animated/water-ripples.png",
  "seedwake/items/seed-1.png",
  "seedwake/fx/spark.png",
  "seedwake/fx/cache-wood-burst.png",
  "seedwake/fx/cache-pot-burst.png",
  "seedwake/fx/grass-rustle.png",
  "seedwake/props/cache-crate.png",
  "seedwake/props/cache-pot.png",
  "seedwake/props/reactive-grass.png",
  "seedwake/audio/success.wav",
  "seedwake/audio/pickup.wav",
  "seedwake/audio/wrong.wav",
  "seedwake/audio/magic.wav",
  "weather/rain.png",
  "weather/rain-on-floor.png",
  "weather/cloud.png",
  "weather/snow.png",
  "seedwake/audio/action-discover.wav",
  "seedwake/audio/action-hop.wav",
  "seedwake/audio/action-lift.wav",
  "seedwake/audio/action-place.wav",
  "seedwake/audio/action-build.wav",
  "seedwake/audio/action-pulse.wav",
  "seedwake/audio/action-wait.wav",
  "dino/tiles/field.png",
  "dino/tiles/desert.png",
  "dino/characters/cave-lion/walk.png",
  "dino/characters/cave-lion/idle.png",
  "dino/characters/cavegirl/idle.png",
  "dino/characters/caveman/idle.png",
  "dino/characters/cave-lion-2/walk.png",
  "dino/characters/cave-lion-2/idle.png",
  "dino/characters/cavegirl-2/walk.png",
  "dino/characters/cavegirl-2/idle.png",
  "dino/characters/caveman-2/walk.png",
  "dino/characters/caveman-2/idle.png",
  "dino/items/bone.png",
  "moonwood/tiles/field.png",
  "moonwood/tiles/ruins.png",
  "moonwood/characters/sorcerer/walk.png",
  "moonwood/characters/sorcerer/idle.png",
  "moonwood/characters/vampire/idle.png",
  "moonwood/characters/robot/idle.png",
  "moonwood/characters/sorcerer-orange/walk.png",
  "moonwood/characters/sorcerer-orange/idle.png",
  "moonwood/characters/robot-green/walk.png",
  "moonwood/characters/robot-green/idle.png",
  "moonwood/characters/skeleton/walk.png",
  "moonwood/characters/skeleton/idle.png",
  "moonwood/items/gem-purple.png",
  "moonwood/fx/fog.png"
];
const performanceResidentDirectories = [
  "seedwake/characters/mask-frog",
  "seedwake/characters/spirit",
  "seedwake/characters/green-pig",
  "seedwake/characters/shaman-lion",
  "seedwake/characters/egg-boy",
  "seedwake/characters/ninja-blue",
  "seedwake/characters/samurai-blue",
  "seedwake/characters/samurai-green",
  "dino/characters/cave-lion",
  "dino/characters/cavegirl",
  "dino/characters/caveman",
  "dino/characters/cave-lion-2",
  "dino/characters/cavegirl-2",
  "dino/characters/caveman-2",
  "moonwood/characters/sorcerer",
  "moonwood/characters/vampire",
  "moonwood/characters/robot",
  "moonwood/characters/sorcerer-orange",
  "moonwood/characters/robot-green",
  "moonwood/characters/skeleton"
];
for (const directory of performanceResidentDirectories) {
  assets.push(`${directory}/item.png`, `${directory}/jump.png`);
}
assets.push(
  "seedwake/characters/ninja-blue/idle.png",
  "seedwake/characters/samurai-blue/idle.png",
  "seedwake/characters/samurai-green/idle.png"
);
const premiumResidents = ["pip", "moss", "tumble", "bramble"];
assets.push("seedwake/characters-premium/SOURCE.md");
for (const resident of premiumResidents) {
  assets.push(
    `seedwake/characters-premium/${resident}/walk.png`,
    `seedwake/characters-premium/${resident}/idle.png`,
    `seedwake/characters-premium/${resident}/item.png`,
    `seedwake/characters-premium/${resident}/jump.png`
  );
}
const premiumRiverResidents = ["nori", "fizz", "quill", "rill"];
assets.push("river-gardens/characters-premium/SOURCE.md");
for (const resident of premiumRiverResidents) {
  assets.push(
    `river-gardens/characters-premium/${resident}/walk.png`,
    `river-gardens/characters-premium/${resident}/idle.png`,
    `river-gardens/characters-premium/${resident}/item.png`,
    `river-gardens/characters-premium/${resident}/jump.png`
  );
}
const premiumFossilResidents = ["fen", "rook", "amber", "claw"];
assets.push("fossil-canyon/characters-premium/SOURCE.md");
for (const resident of premiumFossilResidents) {
  assets.push(
    `fossil-canyon/characters-premium/${resident}/walk.png`,
    `fossil-canyon/characters-premium/${resident}/idle.png`,
    `fossil-canyon/characters-premium/${resident}/item.png`,
    `fossil-canyon/characters-premium/${resident}/jump.png`
  );
}
const premiumForgeResidents = ["cinder", "bolt", "soot", "bellows"];
assets.push("forge-settlement/characters-premium/SOURCE.md");
for (const resident of premiumForgeResidents) {
  assets.push(
    `forge-settlement/characters-premium/${resident}/walk.png`,
    `forge-settlement/characters-premium/${resident}/idle.png`,
    `forge-settlement/characters-premium/${resident}/item.png`,
    `forge-settlement/characters-premium/${resident}/jump.png`
  );
}
const premiumGlassResidents = ["vale", "ripple", "mica", "glint"];
assets.push("glass-marsh/characters-premium/SOURCE.md");
for (const resident of premiumGlassResidents) {
  assets.push(
    `glass-marsh/characters-premium/${resident}/walk.png`,
    `glass-marsh/characters-premium/${resident}/idle.png`,
    `glass-marsh/characters-premium/${resident}/item.png`,
    `glass-marsh/characters-premium/${resident}/jump.png`
  );
}
const premiumStormResidents = ["skiff", "kelp", "boom", "prism"];
assets.push("storm-coast/characters-premium/SOURCE.md");
for (const resident of premiumStormResidents) {
  assets.push(
    `storm-coast/characters-premium/${resident}/walk.png`,
    `storm-coast/characters-premium/${resident}/idle.png`,
    `storm-coast/characters-premium/${resident}/item.png`,
    `storm-coast/characters-premium/${resident}/jump.png`
  );
}
const premiumLanternResidents = ["echo", "luma", "wisp", "orbit"];
assets.push("lantern-forest/characters-premium/SOURCE.md");
for (const resident of premiumLanternResidents) {
  assets.push(
    `lantern-forest/characters-premium/${resident}/walk.png`,
    `lantern-forest/characters-premium/${resident}/idle.png`,
    `lantern-forest/characters-premium/${resident}/item.png`,
    `lantern-forest/characters-premium/${resident}/jump.png`
  );
}
const premiumStarResidents = ["nova", "comet", "aster", "dawn"];
assets.push("star-reach/characters-premium/SOURCE.md");
for (const resident of premiumStarResidents) {
  assets.push(
    `star-reach/characters-premium/${resident}/walk.png`,
    `star-reach/characters-premium/${resident}/idle.png`,
    `star-reach/characters-premium/${resident}/item.png`,
    `star-reach/characters-premium/${resident}/jump.png`
  );
}
const premiumScenery = Object.freeze({
  "round-tree.png": [128, 128],
  "blossom-tree.png": [128, 128],
  "flower-shrub.png": [96, 96],
  "hollow-tree.png": [160, 160],
  "trail-ruin.png": [112, 112],
  "seed-lantern.png": [80, 80]
});
assets.push("seedwake/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumScenery)) {
  assets.push(`seedwake/scenery-premium/${asset}`);
}
const premiumRiverScenery = Object.freeze({
  "waterwheel-weir.png": [160, 160],
  "lily-ferry.png": [112, 112],
  "sluice-gate.png": [128, 128],
  "canal-map.png": [128, 128],
  "garden-arch.png": [144, 144],
  "willow-bank.png": [144, 144]
});
assets.push("river-gardens/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumRiverScenery)) {
  assets.push(`river-gardens/scenery-premium/${asset}`);
}
const premiumFossilScenery = Object.freeze({
  "rib-arch.png": [176, 176],
  "dig-camp.png": [160, 160],
  "rope-bridge.png": [176, 176],
  "bone-signal.png": [176, 176],
  "amber-outcrop.png": [144, 144],
  "survey-station.png": [160, 160],
  "dig-basin.png": [256, 192]
});
assets.push("fossil-canyon/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumFossilScenery)) {
  assets.push(`fossil-canyon/scenery-premium/${asset}`);
}
const premiumFossilInteraction = Object.freeze({
  "fossil-rune.png": [80, 80],
  "track-marker.png": [80, 80],
  "fitted-bone.png": [80, 80],
  "rescue-flag.png": [80, 80],
  "fossil-beacon.png": [88, 88],
  "brush-station.png": [96, 96]
});
assets.push("fossil-canyon/interaction-premium/SOURCE.md");
for (const asset of Object.keys(premiumFossilInteraction)) {
  assets.push(`fossil-canyon/interaction-premium/${asset}`);
}
const premiumForgeScenery = Object.freeze({
  "gearworks-gate.png": [192, 192],
  "ore-hopper.png": [176, 176],
  "plate-foundry.png": [192, 192],
  "night-train.png": [224, 176],
  "word-forge.png": [208, 208],
  "workshop-market.png": [192, 176],
  "steam-pipes.png": [128, 128],
  "tool-rack.png": [144, 128],
  "rail-signal.png": [96, 144],
  "ore-cart.png": [128, 112],
  "sorting-conveyor.png": [224, 160],
  "ember-rivet.png": [64, 64]
});
assets.push("forge-settlement/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumForgeScenery)) {
  assets.push(`forge-settlement/scenery-premium/${asset}`);
}
const premiumForgeInteraction = Object.freeze({
  "machine-gear.png": [80, 80],
  "ore-tray.png": [80, 80],
  "forge-rune.png": [80, 80],
  "rail-trolley.png": [96, 80],
  "word-plate.png": [88, 88],
  "gear-socket.png": [96, 96]
});
assets.push("forge-settlement/interaction-premium/SOURCE.md");
for (const asset of Object.keys(premiumForgeInteraction)) {
  assets.push(`forge-settlement/interaction-premium/${asset}`);
}
const premiumGlassScenery = Object.freeze({
  "reedlight-landing.png": [208, 176],
  "ripple-pool.png": [208, 192],
  "mica-steps.png": [192, 208],
  "glint-causeway.png": [224, 176],
  "mirror-fen-beacon.png": [192, 224],
  "glass-workshop.png": [208, 192],
  "glass-reeds.png": [128, 160],
  "crystal-lilies.png": [144, 112],
  "marsh-lantern.png": [96, 160],
  "mirror-pool.png": [160, 128],
  "glass-boardwalk.png": [208, 112],
  "mirror-gem.png": [64, 64]
});
assets.push("glass-marsh/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumGlassScenery)) {
  assets.push(`glass-marsh/scenery-premium/${asset}`);
}
const premiumGlassInteraction = Object.freeze({
  "tuned-reed.png": [88, 112],
  "lily-step.png": [96, 80],
  "marsh-fish-net.png": [104, 88],
  "mirror-shard.png": [88, 96],
  "fen-beacon.png": [96, 112],
  "mirror-socket.png": [112, 88]
});
assets.push("glass-marsh/interaction-premium/SOURCE.md");
for (const asset of Object.keys(premiumGlassInteraction)) {
  assets.push(`glass-marsh/interaction-premium/${asset}`);
}
const premiumStormScenery = Object.freeze({
  "galecliff-path.png": [208, 240],
  "shellhaven.png": [224, 208],
  "signal-harbour.png": [224, 192],
  "stormglass-cove.png": [224, 224],
  "thunder-lighthouse.png": [176, 240],
  "storm-shelter.png": [224, 176],
  "black-cliff.png": [136, 176],
  "tide-pool.png": [152, 120],
  "storm-buoy.png": [96, 144],
  "harbour-boardwalk.png": [176, 112],
  "sailcloth-windbreak.png": [152, 112],
  "lens-shard-pickup.png": [64, 72]
});
assets.push("storm-coast/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumStormScenery)) {
  assets.push(`storm-coast/scenery-premium/${asset}`);
}
const premiumStormInteraction = Object.freeze({
  "cliff-holds.png": [112, 128],
  "harbour-crate.png": [104, 104],
  "shelter-board.png": [120, 96],
  "storm-lens-shard.png": [96, 112],
  "fleet-signal-flag.png": [88, 112],
  "lighthouse-lens-socket.png": [120, 96]
});
assets.push("storm-coast/interaction-premium/SOURCE.md");
for (const asset of Object.keys(premiumStormInteraction)) {
  assets.push(`storm-coast/interaction-premium/${asset}`);
}
const premiumLanternScenery = Object.freeze({
  "mothlight-gate.png": [208, 240],
  "echo-roots.png": [240, 224],
  "wispwood-turn.png": [240, 192],
  "orbit-hollow.png": [240, 224],
  "sleeping-observatory.png": [224, 240],
  "lantern-tree-workshop.png": [224, 208],
  "lantern-tree.png": [160, 184],
  "luminous-roots.png": [144, 104],
  "moth-cluster.png": [120, 112],
  "root-footbridge.png": [152, 144],
  "telescope-pedestal.png": [112, 128],
  "living-map-pickup.png": [72, 64]
});
assets.push("lantern-forest/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumLanternScenery)) {
  assets.push(`lantern-forest/scenery-premium/${asset}`);
}
const premiumLanternInteraction = Object.freeze({
  "moth-roost.png": [112, 104],
  "forest-lantern.png": [96, 120],
  "memory-path-marker.png": [120, 112],
  "telescope-part.png": [120, 96],
  "observatory-orbit-dial.png": [120, 120],
  "observatory-alignment-socket.png": [120, 112]
});
assets.push("lantern-forest/interaction-premium/SOURCE.md");
for (const asset of Object.keys(premiumLanternInteraction)) {
  assets.push(`lantern-forest/interaction-premium/${asset}`);
}
const premiumStarScenery = Object.freeze({
  "comet-stair.png": [232, 240],
  "aster-archive.png": [240, 240],
  "dawn-causeway.png": [240, 224],
  "reading-skybridge.png": [240, 224],
  "first-reading-star.png": [240, 240],
  "star-road-workshop.png": [224, 224],
  "floating-star-garden.png": [168, 152],
  "constellation-rail.png": [160, 120],
  "skybridge-island.png": [168, 144],
  "comet-beacon.png": [112, 160],
  "dawn-crystals.png": [144, 112],
  "reader-page-pickup.png": [72, 72]
});
assets.push("star-reach/scenery-premium/SOURCE.md");
for (const asset of Object.keys(premiumStarScenery)) {
  assets.push(`star-reach/scenery-premium/${asset}`);
}
const premiumStarInteraction = Object.freeze({
  "constellation-route-node.png": [120, 120],
  "sky-courier-capsule.png": [128, 104],
  "star-sorting-prism.png": [120, 120],
  "memory-journey-page.png": [128, 112],
  "reading-sound-sigil.png": [120, 120],
  "first-reading-star-socket.png": [120, 120]
});
assets.push("star-reach/interaction-premium/SOURCE.md");
for (const asset of Object.keys(premiumStarInteraction)) {
  assets.push(`star-reach/interaction-premium/${asset}`);
}
for (const relative of assets) {
  const file = path.join(ROOT, assetRoot, relative);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) fail(`asset is missing or empty: ${relative}`);
}
requireText(read(`${assetRoot}/SOURCE.md`), "Ninja Adventure - Asset Pack", "asset provenance");
requireText(read(`${assetRoot}/license/CC0-1.0.txt`), "CC0 1.0 Universal", "asset license");
requireText(
  read(`${assetRoot}/seedwake/characters-premium/SOURCE.md`),
  "project-authored 64-pixel resident animation",
  "premium named-cast provenance"
);
requireText(
  read(`${assetRoot}/seedwake/scenery-premium/SOURCE.md`),
  "project-authored premium Seedwake scenery",
  "premium Seedwake scenery provenance"
);
requireText(
  read(`${assetRoot}/river-gardens/characters-premium/SOURCE.md`),
  "project-authored 64-pixel resident animation",
  "premium River Gardens named-cast provenance"
);
requireText(
  read(`${assetRoot}/river-gardens/scenery-premium/SOURCE.md`),
  "project-authored premium River Gardens scenery",
  "premium River Gardens scenery provenance"
);
requireText(
  read(`${assetRoot}/fossil-canyon/characters-premium/SOURCE.md`),
  "project-authored 64-pixel resident animation",
  "premium Fossil Canyon named-cast provenance"
);
requireText(
  read(`${assetRoot}/fossil-canyon/scenery-premium/SOURCE.md`),
  "project-authored Fossil Canyon scenery kit",
  "premium Fossil Canyon scenery provenance"
);
requireText(
  read(`${assetRoot}/fossil-canyon/interaction-premium/SOURCE.md`),
  "project-authored Fossil Canyon interaction kit",
  "premium Fossil Canyon interaction provenance"
);
requireText(
  read(`${assetRoot}/forge-settlement/characters-premium/SOURCE.md`),
  "project-authored 64-pixel resident animation",
  "premium Forge Settlement named-cast provenance"
);
requireText(
  read(`${assetRoot}/forge-settlement/scenery-premium/SOURCE.md`),
  "project-authored Forge Settlement scenery kit",
  "premium Forge Settlement scenery provenance"
);
requireText(
  read(`${assetRoot}/forge-settlement/interaction-premium/SOURCE.md`),
  "project-authored Forge Settlement interaction kit",
  "premium Forge Settlement interaction provenance"
);
requireText(
  read(`${assetRoot}/glass-marsh/characters-premium/SOURCE.md`),
  "project-authored 64-pixel resident animation",
  "premium Glass Marsh named-cast provenance"
);
requireText(
  read(`${assetRoot}/glass-marsh/scenery-premium/SOURCE.md`),
  "project-authored Glass Marsh scenery kit",
  "premium Glass Marsh scenery provenance"
);
requireText(
  read(`${assetRoot}/glass-marsh/interaction-premium/SOURCE.md`),
  "project-authored Glass Marsh interaction kit",
  "premium Glass Marsh interaction provenance"
);
requireText(
  read(`${assetRoot}/storm-coast/characters-premium/SOURCE.md`),
  "project-authored 64-pixel resident animation",
  "premium Storm Coast named-cast provenance"
);
requireText(
  read(`${assetRoot}/storm-coast/scenery-premium/SOURCE.md`),
  "project-authored Storm Coast scenery kit",
  "premium Storm Coast scenery provenance"
);
requireText(
  read(`${assetRoot}/storm-coast/interaction-premium/SOURCE.md`),
  "project-authored Storm Coast interaction kit",
  "premium Storm Coast interaction provenance"
);
requireText(
  read(`${assetRoot}/lantern-forest/characters-premium/SOURCE.md`),
  "project-authored 64-pixel Lantern Forest resident animation",
  "premium Lantern Forest named-cast provenance"
);
requireText(
  read(`${assetRoot}/lantern-forest/scenery-premium/SOURCE.md`),
  "project-authored Lantern Forest landmark and support kit",
  "premium Lantern Forest scenery provenance"
);
requireText(
  read(`${assetRoot}/lantern-forest/interaction-premium/SOURCE.md`),
  "project-authored Lantern Forest physical learning-object kit",
  "premium Lantern Forest interaction provenance"
);
requireText(
  read(`${assetRoot}/star-reach/characters-premium/SOURCE.md`),
  "Project-authored with OpenAI image generation",
  "premium Star Reach named-cast provenance"
);
requireText(
  read(`${assetRoot}/star-reach/scenery-premium/SOURCE.md`),
  "Project-authored with OpenAI image generation",
  "premium Star Reach scenery provenance"
);
requireText(
  read(`${assetRoot}/star-reach/interaction-premium/SOURCE.md`),
  "Project-authored with OpenAI image generation",
  "premium Star Reach interaction provenance"
);
for (const resident of premiumResidents) {
  const walk = `seedwake/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `seedwake/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumRiverResidents) {
  const walk = `river-gardens/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `river-gardens/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumFossilResidents) {
  const walk = `fossil-canyon/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `fossil-canyon/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumForgeResidents) {
  const walk = `forge-settlement/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `forge-settlement/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumGlassResidents) {
  const walk = `glass-marsh/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `glass-marsh/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumStormResidents) {
  const walk = `storm-coast/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `storm-coast/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumLanternResidents) {
  const walk = `lantern-forest/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `lantern-forest/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const resident of premiumStarResidents) {
  const walk = `star-reach/characters-premium/${resident}/walk.png`;
  const walkSize = pngDimensions(walk);
  if (walkSize.width !== 256 || walkSize.height !== 256) {
    fail(`${resident} walk sheet must be 256x256, found ${walkSize.width}x${walkSize.height}`);
  }
  for (const action of ["idle", "item", "jump"]) {
    const relative = `star-reach/characters-premium/${resident}/${action}.png`;
    const size = pngDimensions(relative);
    if (size.width !== 256 || size.height !== 64) {
      fail(`${resident} ${action} sheet must be 256x64, found ${size.width}x${size.height}`);
    }
  }
}
for (const [asset, [width, height]] of Object.entries(premiumScenery)) {
  const relative = `seedwake/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumRiverScenery)) {
  const relative = `river-gardens/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumFossilScenery)) {
  const relative = `fossil-canyon/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumFossilInteraction)) {
  const relative = `fossil-canyon/interaction-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumForgeScenery)) {
  const relative = `forge-settlement/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumForgeInteraction)) {
  const relative = `forge-settlement/interaction-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumGlassScenery)) {
  const relative = `glass-marsh/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumGlassInteraction)) {
  const relative = `glass-marsh/interaction-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumStormScenery)) {
  const relative = `storm-coast/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumStormInteraction)) {
  const relative = `storm-coast/interaction-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumLanternScenery)) {
  const relative = `lantern-forest/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumLanternInteraction)) {
  const relative = `lantern-forest/interaction-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumStarScenery)) {
  const relative = `star-reach/scenery-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}
for (const [asset, [width, height]] of Object.entries(premiumStarInteraction)) {
  const relative = `star-reach/interaction-premium/${asset}`;
  const size = pngDimensions(relative);
  if (size.width !== width || size.height !== height) {
    fail(`${asset} must be ${width}x${height}, found ${size.width}x${size.height}`);
  }
}

if (!process.exitCode) {
  console.log(`Pixel quest check passed: ${assets.length} curated assets, crisp renderer contract, all 40 route-authored maps, Beastie layers, learning parity, and gate continuity are present.`);
}
