const REVIEWED_AT = "2026-09-02T00:00:00.000Z";

const HEART_WORDS = new Set([
  "a", "i", "the", "is", "to", "go", "my", "and", "he", "she", "we", "me", "be", "was",
  "no", "you", "they", "all", "her", "are", "said", "so", "have", "like", "some", "come",
  "were", "there", "little", "one", "do", "when", "out", "what", "oh", "their", "people",
  "called", "looked", "asked", "your", "water", "where", "who", "again", "thought", "through",
  "work", "any", "many", "laughed", "because", "different", "eyes", "friends", "once", "please",
  "could", "would", "should"
]);

const tokenize = text => String(text || "")
  .normalize("NFKC")
  .replace(/[\u2018\u2019]/gu, "'")
  .toLocaleLowerCase("en-US")
  .match(/[a-z]+(?:'[a-z]+)?/gu) || [];

const slug = value => String(value).toLocaleLowerCase("en-US")
  .replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const IDENTITIES = [
  ["seedwake-meadow", "Moss", "seed-lanterns-dark", "seedwake-path-dark", "wake-seeds", "seedwake-s1-moss-trust", "seedwake-path-lit"],
  ["seedwake-meadow", "Tumble", "fern-step-notes-scattered", "fern-path-broken", "mend-fern-steps", "seedwake-s2-tumble-partnership", "fern-steps-sing"],
  ["seedwake-meadow", "Bramble", "rook-stones-still", "rook-hill-windless", "light-rook-stones", "seedwake-s3-bramble-curiosity", "rook-stones-turn"],
  ["seedwake-meadow", "Tumble", "otter-ford-submerged", "meadow-crossing-closed", "raise-otter-ford", "seedwake-s4-tumble-confidence", "otter-ford-open"],
  ["seedwake-meadow", "Bramble", "bramble-gate-asleep", "meadow-gate-closed", "open-meadow-gate", "seedwake-s5-bramble-welcome", "bramble-gate-blooming"],
  ["river-gardens", "Fizz", "beehive-paths-crossed", "river-terraces-unpollinated", "restore-beehive-bluff", "river-s6-fizz-relief", "beehive-bluff-buzzing"],
  ["river-gardens", "Quill", "lily-ferry-grounded", "river-crossing-stalled", "relaunch-lily-ferry", "river-s7-quill-teamwork", "lily-ferry-running"],
  ["river-gardens", "Rill", "fishpool-markers-mixed", "fishpool-channel-hidden", "clear-fishpool-reach", "river-s8-rill-trust", "fishpool-channel-clear"],
  ["river-gardens", "Fizz", "wheelhouse-paddles-missing", "upper-canals-dry", "mend-wheelhouse-bend", "river-s9-fizz-pride", "wheelhouse-turning"],
  ["river-gardens", "Rill", "singing-weir-silent", "river-gardens-still", "restart-singing-weir", "river-s10-rill-celebration", "singing-weir-flowing"],
  ["fossil-canyon", "Rook", "amber-markers-buried", "dig-route-unmarked", "raise-amber-marker", "fossil-s11-rook-respect", "amber-trail-visible"],
  ["fossil-canyon", "Amber", "bone-lift-cable-loose", "dig-team-separated", "rebuild-rattlebones-lift", "fossil-s12-amber-reliance", "rattlebones-lift-running"],
  ["fossil-canyon", "Claw", "ash-trail-covered", "fossil-carts-lost", "reveal-ash-flat-trail", "fossil-s13-claw-curiosity", "ash-trail-glowing"],
  ["fossil-canyon", "Rook", "fern-canyon-span-fallen", "canyon-return-cut-off", "bridge-fern-canyon", "fossil-s14-rook-courage", "fern-canyon-bridged"],
  ["fossil-canyon", "Claw", "claw-pass-sealed", "excavation-team-divided", "reopen-claw-pass", "fossil-s15-claw-friendship", "claw-pass-open"],
  ["forge-settlement", "Bolt", "gearworks-lock-misread", "forge-lane-closed", "unlock-gearworks-gate", "forge-s16-bolt-confidence", "gearworks-gate-open"],
  ["forge-settlement", "Soot", "ore-hopper-jammed", "foundry-fuel-stalled", "restart-ore-hopper", "forge-s17-soot-trust", "ore-hopper-running"],
  ["forge-settlement", "Bellows", "plate-foundry-cold", "machine-plates-unmade", "relight-plate-foundry", "forge-s18-bellows-respect", "plate-foundry-lit"],
  ["forge-settlement", "Bolt", "night-train-braked", "settlement-cargo-waiting", "release-night-train", "forge-s19-bolt-partnership", "night-train-running"],
  ["forge-settlement", "Bellows", "word-forge-rings-dark", "settlement-machines-still", "ignite-word-forge", "forge-s20-bellows-pride", "word-forge-burning"],
  ["glass-marsh", "Ripple", "reedlight-mooring-lost", "marsh-landing-drifting", "moor-reedlight-ferry", "glass-s21-ripple-relief", "reedlight-ferry-moored"],
  ["glass-marsh", "Mica", "ripple-pool-reflections-clouded", "marsh-signals-doubled", "clear-ripple-pool", "glass-s22-mica-trust", "ripple-pool-clear"],
  ["glass-marsh", "Glint", "mica-steps-submerged", "marsh-high-path-lost", "raise-mica-steps", "glass-s23-glint-confidence", "mica-steps-raised"],
  ["glass-marsh", "Ripple", "glint-causeway-out-of-tune", "glass-route-fractured", "tune-glint-causeway", "glass-s24-ripple-partnership", "glint-causeway-singing"],
  ["glass-marsh", "Glint", "mirror-fen-beacon-dark", "safe-marsh-route-hidden", "relight-mirror-fen", "glass-s25-glint-friendship", "mirror-fen-lit"],
  ["storm-coast", "Kelp", "galecliff-signs-scattered", "coast-path-unsafe", "secure-galecliff-path", "storm-s26-kelp-trust", "galecliff-path-secure"],
  ["storm-coast", "Boom", "shellhaven-roof-open", "harbour-shelter-wet", "rebuild-shellhaven-roof", "storm-s27-boom-relief", "shellhaven-roof-mended"],
  ["storm-coast", "Prism", "harbour-signals-dark", "boats-without-bearing", "restore-signal-harbour", "storm-s28-prism-confidence", "signal-harbour-lit"],
  ["storm-coast", "Kelp", "stormglass-cove-roaring", "lens-pieces-unreachable", "calm-stormglass-cove", "storm-s29-kelp-courage", "stormglass-cove-calm"],
  ["storm-coast", "Prism", "thunder-lighthouse-lens-broken", "harbour-without-beam", "wake-thunder-lighthouse", "storm-s30-prism-pride", "thunder-lighthouse-awake"],
  ["lantern-forest", "Luma", "mothlight-gate-unmapped", "forest-route-looping", "open-mothlight-gate", "lantern-s31-luma-trust", "mothlight-gate-open"],
  ["lantern-forest", "Wisp", "echo-roots-asleep", "root-stairs-folded", "wake-echo-roots", "lantern-s32-wisp-curiosity", "echo-roots-awake"],
  ["lantern-forest", "Orbit", "wispwood-signs-wandering", "living-map-incomplete", "mark-wispwood-turn", "lantern-s33-orbit-reliance", "wispwood-turn-marked"],
  ["lantern-forest", "Luma", "orbit-hollow-rings-misaligned", "observatory-path-shut", "align-orbit-hollow", "lantern-s34-luma-partnership", "orbit-hollow-aligned"],
  ["lantern-forest", "Orbit", "observatory-dome-still", "forest-sky-unread", "turn-sleeping-observatory", "lantern-s35-orbit-friendship", "sleeping-observatory-turning"],
  ["star-reach", "Comet", "comet-stair-faded", "sky-road-unreachable", "raise-comet-stair", "star-s36-comet-confidence", "comet-stair-raised"],
  ["star-reach", "Aster", "aster-archive-locked", "sky-maps-hidden", "open-aster-archive", "star-s37-aster-trust", "aster-archive-open"],
  ["star-reach", "Dawn", "dawn-causeway-separated", "star-gardens-divided", "join-dawn-causeway", "star-s38-dawn-partnership", "dawn-causeway-joined"],
  ["star-reach", "Comet", "reading-skybridge-unfinished", "first-star-route-broken", "complete-reading-skybridge", "star-s39-comet-courage", "reading-skybridge-complete"],
  ["star-reach", "Dawn", "first-reading-star-dim", "sky-road-disconnected", "wake-first-reading-star", "star-s40-dawn-celebration", "first-reading-star-awake"]
];

const option = (stopId, letter, childLabel, accessibleLabel = childLabel) => ({
  token: `ct-${stopId}-${letter}`,
  presentation: "image",
  childLabel,
  accessibleLabel,
  visualSemanticId: `scene-${stopId}-option-${slug(childLabel)}`
});

const ASSESSED_CONTENT = [
  ["s1", "Wake the Seed Lanterns", "Lift mat; see light.", "What uncovers Moss's seed light?", ["lift", "mat", "see", "light"], [["a", "Lift light."], ["b", "Lift mat.", "Lift the mat so the seed light can be seen."], ["c", "Lift mats."]], [["lift", 0, "new_concept"], ["see", 2, "new_concept"], ["light", 3, "new_concept"]], [["ct-s1-a", "lift", 0, "new_concept"], ["ct-s1-a", "light", 1, "new_concept"], ["ct-s1-b", "lift", 0, "new_concept"], ["ct-s1-c", "lift", 0, "new_concept"]]],
  ["s2", "Rebuild the Fern-Step Song", "Fit fin.", "What mends Tumble's fern step?", "sit", [["a", "Fit fin.", "Fit the missing fin into the fern step; do not sit beside it."], ["b", "Sit at fin."], ["c", "Fan fin."]]],
  ["s3", "Turn the Rook Wind Stones", "Hit the hot rock drum.", "What starts Bramble's wind-stone drum?", ["hot", "rock", "drum"], [["a", "Sit on rock."], ["b", "Hit hot hat."], ["c", "Hit hot rock.", "Hit the hot rock drum to start the wind stones."]], [["rock", 3, "new_concept"], ["drum", 4, "new_concept"]], [["ct-s3-a", "rock", 2, "new_concept"], ["ct-s3-c", "rock", 2, "new_concept"]]],
  ["s4", "Raise the Otter Ford", "Fit rock in the gap.", "What fills Tumble's ford gap?", ["rock", "gap", "bun"], [["a", "Bun in gap."], ["b", "Rock in gap.", "Fit the hard rock into the ford gap; keep the soft bun for lunch."], ["c", "Rock on gap."]], [["rock", 1, "new_concept"], ["gap", 4, "new_concept"]], [["ct-s4-a", "gap", 2, "new_concept"], ["ct-s4-b", "rock", 0, "new_concept"], ["ct-s4-b", "gap", 2, "new_concept"], ["ct-s4-c", "rock", 0, "new_concept"], ["ct-s4-c", "gap", 2, "new_concept"]]],
  ["s6", "Guide the Bluff Bees Home", "Get the buzz box home.", "How can Fizz guide the bluff bees home?", ["buzz", "box", "home"], [["a", "Get net home."], ["b", "Get van home."], ["c", "Get box home.", "Carry the box that is buzzing home with the bees."]], [["buzz", 2, "new_concept"], ["home", 4, "new_concept"]], [["ct-s6-a", "home", 2, "new_concept"], ["ct-s6-b", "home", 2, "new_concept"], ["ct-s6-c", "home", 2, "new_concept"]]],
  ["s7", "Relaunch the Lily Ferry", "Get jam off the bell.", "What frees Quill's ferry brake bell?", "jam", [["a", "Get jam off bell.", "Pull the sticky jam off the ferry brake bell."], ["b", "Get bell off mat."], ["c", "Get jam on bell."]]],
  ["s8", "Clear Fishpool Reach", "Cut the net.", "What clears Rill's fishpool channel?", "mat", [["a", "Fix net."], ["b", "Cut net.", "Cut the net that blocks the fishpool channel; a mat would cover it."], ["c", "Cut bell."]]],
  ["s9", "Mend Wheelhouse Bend", "Fix the ship fin; it can spin.", "What turns Fizz's water wheel?", ["ship", "spin"], [["a", "Fix fish fin."], ["b", "Sit at ship."], ["c", "Fix ship fin.", "Fix the ship fin so the water wheel can spin."]], [["spin", 6, "new_concept"]]],
  ["s11", "Raise the Amber Trail Markers", "Pick the rock off the path.", "What reveals Rook's amber path?", "rock", [["a", "Pick rock off path.", "Pick the rock off the amber path marker."], ["b", "Kick rock on path."], ["c", "Sit on path rock."]]],
  ["s12", "Rebuild the Rattlebones Lift", "Fit the lamp in the lift.", "What mends Amber's loose lift part?", ["hand", "lift"], [["a", "Lift lamp."], ["b", "Fit ship lamp."], ["c", "Fit lamp in lift.", "Fit the loose lamp part into the lift by hand."]]],
  ["s13", "Reveal the Ash-Flat Trail", "Spin the fan; it can clear the path.", "What blows Claw's ash off the trail?", ["spin", "clear"], [["a", "Sit at fan."], ["b", "Spin fan.", "Spin the fan to blow the ash off the path."], ["c", "Hit fan."]], [["clear", 5, "new_concept"]]],
  ["s14", "Bridge Fern Canyon", "Clap at the flag; the path can grow.", "What grows Rook's fern bridge?", ["clap", "grow"], [["a", "Clap at flag.", "Clap at the magic flag to grow the fern bridge."], ["b", "Flip flag."], ["c", "Clap at block."]], [["grow", 7, "new_concept"]]],
  ["s16", "Unlock Gearworks Gate", "Click the lock to lift the gate.", "Which action opens Bolt's lane?", ["by", "gate"], [["a", "Click flag."], ["b", "Click lock.", "Click the gearworks lock by the gate to lift it."], ["c", "Fly by lock."]], [["gate", 6, "new_concept"]]],
  ["s17", "Restart the Ore Hopper", "Big rock is in the bin. Lift the rock off.", "What clears Soot's hopper bin?", ["rock", "lift"], [["a", "Kick rock in."], ["b", "Sit on rock."], ["c", "Lift rock off.", "Lift the rock out of the ore hopper bin."]]],
  ["s18", "Relight the Plate Foundry", "The flame is not hot. Make the flame hot.", "What relights Bellows's foundry?", ["cake", "hot"], [["a", "Make flame hot.", "Heat the foundry flame, not the nearby cake."], ["b", "Make cake hot."], ["c", "Make plate hot."]]],
  ["s19", "Release the Night Train", "The bike is on the train path. Slide the bike off.", "What clears Bolt's night-train track?", ["bike", "train"], [["a", "Hide bike."], ["b", "Slide bike off.", "Slide the bike off the night-train track."], ["c", "Ride bike."]], [["train", 5, "new_concept"]]],
  ["s21", "Moor the Reedlight Ferry", "The big cube can stop the ship. Fit the rope on the cube.", "What anchors Ripple's drifting ferry?", "cube", [["a", "Rope on mule."], ["b", "Rope on gate."], ["c", "Rope on cube.", "Fasten the ship rope to the big cube anchor."]]],
  ["s22", "Clear Ripple Pool", "Rain can make it run. Pick rain to start it.", "Which sign starts Mica's clear-water pump?", ["rain", "start", "theme"], [["a", "Pick rain.", "Pick rain, the sign's water theme, to start the clear-water pump."], ["b", "Pick run."], ["c", "Pick flame."]], [["rain", 0, "new_concept"], ["rain", 6, "new_concept"], ["start", 8, "new_concept"]], [["ct-s22-a", "rain", 1, "new_concept"]]],
  ["s23", "Raise the Mica Steps", "Lift the rain tray. It can lift the path.", "What raises Glint's hidden steps?", ["rain", "lift"], [["a", "Lift train."], ["b", "Lift rain tray.", "Lift the rain tray on its rope to raise the hidden steps."], ["c", "Sit by tray."]]],
  ["s24", "Tune Glint Causeway", "The tree can sing. Clap with tree; the path can sing.", "What tunes Ripple's causeway song?", "tree", [["a", "Sing with tree."], ["b", "Sit by tree."], ["c", "Clap with tree.", "Clap with the singing tree to tune the causeway path."]]],
  ["s26", "Secure Galecliff Path", "Show coat on the right road. The boat can go that way.", "Which marker keeps Kelp's boat on course?", "boat", [["a", "Show coat on road.", "Show the coat marker on the right safe road."], ["b", "Show snow on road."], ["c", "Show goat on road."]]],
  ["s27", "Rebuild Shellhaven Roof", "Snow is in the room. Glue on the blue moon coat to stop it.", "What covers Boom's shelter?", "moon", [["a", "Glue food coat."], ["b", "Glue blue moon coat.", "Glue on the blue moon roof coat to stop the snow."], ["c", "Snow on room."]]],
  ["s28", "Restore Signal Harbour", "The book is the light plan. Hook light high so boat can go.", "How can Prism relight the harbour signal?", ["book", "light"], [["a", "Hook book on boat."], ["b", "Hide light in book."], ["c", "Hook light high.", "Hook the planned light high so boats can see the signal."]]],
  ["s29", "Calm Stormglass Cove", "The loud sound is in the box. The lid is off. Close the lid on the box.", "What makes Kelp's stormglass box calm?", "sound", [["a", "Close lid on box.", "Close the lid to keep the loud sound inside the box."], ["b", "Bang on box."], ["c", "Make sound loud."]]],
  ["s31", "Open Mothlight Gate", "The star can lift the gate. Park the car on the star.", "What opens Luma's mothlight gate?", "car", [["a", "Start car at gate."], ["b", "Park car on star.", "Park the car on the star pad so it lifts the gate."], ["c", "Hide car at farm."]]],
  ["s32", "Wake the Echo Roots", "The storm hit the tree. The light is off. Draw a star on the tree; the light can turn on.", "What wakes Wisp's echo-root light?", ["light", "turn", "storm"], [["a", "Saw tree."], ["b", "Store star."], ["c", "Draw star on tree.", "Draw the star on the storm-dark tree to turn on the echo-root light."]], [["turn", 18, "new_concept"]]],
  ["s33", "Mark Wispwood Turn", "The bird can turn by the fern. The girl can look at it. Draw the turn on the path so the girl can look.", "What completes Orbit's living map?", "bird", [["a", "Draw turn on path."], ["b", "Look at bird."], ["c", "Sit by fern."]]],
  ["s34", "Align Orbit Hollow", "The chair is by one ring. The stair is by the last ring. Pair the chair with the stair.", "Which markers line up Luma's hollow rings?", "chair", [["a", "Pair chair with hair."], ["b", "Pair chair with stair.", "Pair the chair and stair markers to line up the hollow rings."], ["c", "Pair stair with hair."]]],
  ["s36", "Raise Comet Stair", "The creature is here. Pure light can lift the dark stair. Make the stair bright with pure light so the path is secure.", "What raises Comet's faded stair?", "pure", [["a", "Follow creature."], ["b", "Stair still dark."], ["c", "Make stair bright.", "Make the stair bright because pure light lifts it."]]],
  ["s37", "Open Aster Archive", "The magic words are ready. The lock is dark. Read the magic words at the lock so it can click.", "What opens Aster's archive?", "city", [["a", "Read magic words.", "Read the magic words at the archive lock; do not climb toward the city cell."], ["b", "Climb city cell."], ["c", "Rest by lock."]]],
  ["s38", "Join Dawn Causeway", "The cats jumped up. The dogs landed by the stars. Join the star path so the cats can step on it.", "What joins Dawn's divided path?", "cats", [["a", "Follow dogs."], ["b", "Join star path."], ["c", "Sit by stars."]]],
  ["s39", "Complete Reading Skybridge", "The bridge is not complete. The little puzzle can fit in its gap. Fit the little puzzle in the gap.", "What completes Comet's skybridge?", "little", [["a", "Leave puzzle by table."], ["b", "Fit rocks in gap."], ["c", "Fit little puzzle in gap.", "Fit the little puzzle tile into the bridge gap."]]]
];

const ASSESSED_SCENE_CONTENT = Object.freeze(Object.fromEntries(ASSESSED_CONTENT.map(
  ([stopId, title, text, prompt, meaningWordId, choices, advanced = [], labelAdvanced = []]) => [stopId, Object.freeze({
    title,
    text,
    prompt,
    meaningWordIds: Object.freeze(Array.isArray(meaningWordId) ? meaningWordId : [meaningWordId]),
    options: Object.freeze(choices.map(([letter, label, accessibleLabel]) =>
      Object.freeze(option(stopId, letter, label, accessibleLabel)))),
    advanced: Object.freeze(advanced.map(([tokenId, tokenOrdinal, advancedReason]) =>
      Object.freeze({ tokenId, tokenOrdinal, advancedReason }))),
    labelAdvanced: Object.freeze(labelAdvanced.map(([optionToken, tokenId, tokenOrdinal, advancedReason]) =>
      Object.freeze({ optionToken, tokenId, tokenOrdinal, advancedReason })))
  })]
)));

const BOSS_TEXTS = Object.freeze({
  s5: "Cat at cup.",
  s10: "The thin thing can ring.",
  s15: "The frog can jump from the truck.",
  s20: "The stone is by home. We can lift it.",
  s25: "The bright light is high. The night is black. We can read the right path.",
  s30: "The boy can point. We can pick the coin. The toy is on.",
  s35: "The bird is near the tree. The girl can hear it sing. We can sit near the fern.",
  s40: "Every fiction quest is an action. We read the whole book and listen. We reach the station as the stars shout yes."
});

const BOSS_MEANING_WORD_IDS = Object.freeze({
  s5: Object.freeze([["cat"], ["cup"]]),
  s10: Object.freeze([["thin"], ["thing"]]),
  s15: Object.freeze([["frog"], ["truck"]]),
  s20: Object.freeze([["home"], ["stone"]]),
  s25: Object.freeze([["light"], ["night"]]),
  s30: Object.freeze([["coin"], ["point"]]),
  s35: Object.freeze([["hear"], ["near"]]),
  s40: Object.freeze([["fiction"], ["action"]])
});

const BOSS_DETAILS = Object.freeze({
  5: { wordId: "cat", contextId: "bramble-gate-novel-decode", options: [["Cat gap.", "Follow the gate path beside the cat."], ["Cup gap.", "Follow the gate path beside the cup."]] },
  10: { wordId: "thing", contextId: "singing-weir-novel-decode", options: [["Thin bell.", "Ring the thin silver bell."], ["Thing bell.", "Ring the bell beside the singing thing."]] },
  15: { wordId: "truck", contextId: "claw-pass-novel-decode", options: [["Frog path.", "Open the canyon road beside the frog."], ["Truck path.", "Open the canyon road beside the truck."]] },
  20: { wordId: "stone", contextId: "word-forge-novel-decode", options: [["Home lamp.", "Carry the forge light home."], ["Stone lamp.", "Set the forge light beside the stone."]] },
  25: { wordId: "night", contextId: "mirror-fen-novel-decode", options: [["Light path.", "Follow the bright light path."], ["Night path.", "Follow the quiet night path."]] },
  30: { wordId: "point", contextId: "thunder-lighthouse-novel-decode", options: [["Coin light.", "Aim the lighthouse beam at the coin marker."], ["Point light.", "Point the lighthouse beam toward the toy marker."]] },
  35: { wordId: "near", contextId: "observatory-novel-decode", options: [["Hear ring.", "Turn the ring toward the song we hear."], ["Near ring.", "Turn the ring nearest the bird."]] },
  40: { wordId: "action", contextId: "first-reading-star-novel-decode", options: [["Fiction path.", "Open the imagined fiction path."], ["Action path.", "Open the path that shows every action."]] }
});

function levelFor(index) {
  if (index <= 8) return "phrase";
  if (index <= 16) return "sentence";
  if (index <= 24) return "paired_sentences";
  if (index <= 32) return "micro_scene";
  return "short_passage";
}

function transferRef(index, boss) {
  const stopId = `s${index}`;
  const bossDetails = BOSS_DETAILS[index];
  return {
    category: "transfer",
    slotId: `transfer-slot-${stopId}`,
    recordId: `transfer:${stopId}`,
    actionId: `${stopId}-transfer`,
    configurationId: `${stopId}-transfer-configuration`,
    contextId: boss ? bossDetails.contextId : index === 3 ? "s3-wind-stone-instruction" : `${stopId}-controlled-scene`,
    connectedTextId: `scene-${stopId}`,
    instructionId: boss ? "blend-bridge-choose-novel-meaning"
      : index === 3 ? "memory-delivery-follow-decoded-instruction" : "story-power-choose-story-action",
    powerId: boss ? "blend_bridge" : index === 3 ? "memory_delivery" : "story_power",
    expectedAction: boss ? "choose_novel_decoded_meaning"
      : index === 3 ? "follow_decoded_instruction" : "choose_story_action",
    recordsDomain: boss ? "novel_decoding" : "connected_text_transfer",
    wordId: boss ? bossDetails.wordId : null,
    bossTransferId: boss ? bossDetails.contextId : null
  };
}

function assessedChoice(index) {
  const stopId = `s${index}`;
  const authored = ASSESSED_SCENE_CONTENT[stopId];
  if (!authored) throw new Error(`${stopId}: missing explicit assessed scene content`);
  return {
    choice: {
      kind: "assessed_connected_text",
      comparisonFamilyId: `scene-${stopId}-repair-actions`,
      options: authored.options
    },
    narrativeBranches: []
  };
}

function narrativeChoice(index) {
  const stopId = `s${index}`;
  const options = BOSS_DETAILS[index].options.map(([childLabel, accessibleLabel], offset) => ({
    token: `story-${stopId}-${offset === 0 ? "a" : "b"}`,
    presentation: "image",
    childLabel,
    accessibleLabel,
    visualSemanticId: `scene-${stopId}-option-${slug(childLabel)}`
  }));
  return {
    choice: {
      kind: "narrative_bridge",
      comparisonFamilyId: `scene-${stopId}-story-paths`,
      options
    },
    narrativeBranches: options.map((option, offset) => ({
      token: option.token,
      storyOutcomeId: `scene-${stopId}-story-outcome-${offset === 0 ? "a" : "b"}`,
      postDecisionSemanticId: `scene-${stopId}-post-decision-${offset === 0 ? "a" : "b"}`
    }))
  };
}

export const CONNECTED_TEXT_RECORDS = deepFreeze(IDENTITIES.map((identity, offset) => {
  const index = offset + 1;
  const stopId = `s${index}`;
  const sceneId = `scene-${stopId}`;
  const [chapterId, residentId, problemId, consequencePreviewId, repairId,
    relationshipBeatId, consequenceId] = identity;
  const boss = Boolean(BOSS_DETAILS[index]);
  const assessedContent = ASSESSED_SCENE_CONTENT[stopId] || null;
  const text = boss ? BOSS_TEXTS[stopId] : assessedContent.text;
  const surfaces = tokenize(text);
  const tokenIds = surfaces.map(surface => HEART_WORDS.has(surface) ? `hw:${surface}` : surface);
  const choiceData = boss ? narrativeChoice(index) : assessedChoice(index);
  return {
    id: sceneId,
    stopId,
    chapterId,
    storyRef: {
      category: "stories",
      slotId: `story-slot-${stopId}`,
      recordId: `story:${sceneId}`,
      contentId: sceneId
    },
    transferRef: transferRef(index, boss),
    residentId,
    problemId,
    consequencePreviewId,
    repairId,
    relationshipBeatId,
    consequenceId,
    level: levelFor(index),
    text,
    tokenIds,
    heartWordIds: [...new Set(tokenIds.filter(id => id.startsWith("hw:")))],
    advancedTokenIds: boss ? [] : [...new Set(assessedContent.advanced.map(entry => entry.tokenId))].sort(),
    advancedTokenAudit: boss ? [] : assessedContent.advanced,
    advancedTokenAuditDecision: {
      status: !boss && assessedContent.advanced.length ? "reviewed" : "reviewed_none_required",
      reviewerRole: "literacy-content-review",
      reviewedAt: REVIEWED_AT,
      evidenceRef: `task3:${sceneId}:advanced-token-audit`
    },
    advancedChildLabelTokenIds: boss ? []
      : [...new Set(assessedContent.labelAdvanced.map(entry => entry.tokenId))].sort(),
    advancedChildLabelAudit: boss ? [] : assessedContent.labelAdvanced,
    advancedChildLabelAuditDecision: {
      status: !boss && assessedContent.labelAdvanced.length ? "reviewed" : "reviewed_none_required",
      reviewerRole: "literacy-content-review",
      reviewedAt: REVIEWED_AT,
      evidenceRef: `task3:${sceneId}:advanced-child-label-audit`
    },
    textAudioKey: `quest/scenes/${sceneId}/text`,
    prompt: {
      text: boss ? "Which path should we take?" : assessedContent.prompt,
      audioKey: `quest/scenes/${sceneId}/prompt`
    },
    ...choiceData,
    postDecisionMeaningWordIds: boss
      ? BOSS_MEANING_WORD_IDS[stopId]
      : [assessedContent.meaningWordIds],
    preChoiceCharacterIds: [
      ({ "seedwake-meadow": "Bouncy", "river-gardens": "Nori", "fossil-canyon": "Fen",
        "forge-settlement": "Cinder", "glass-marsh": "Vale", "storm-coast": "Skiff",
        "lantern-forest": "Echo", "star-reach": "Nova" })[chapterId],
      residentId
    ],
    visualSemanticId: `${sceneId}-visual`
  };
}));
