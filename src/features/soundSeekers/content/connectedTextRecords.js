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
  ["s1", "Wake the Seed Lanterns", "Lift mat.", "What action wakes the light?", ["lift", "mat"], [["a", "Sit at mat."], ["b", "Lift mat."], ["c", "Mat sat."]], [["lift", 0, "new_concept"]], [["ct-s1-a", "sit", 0, "new_concept"], ["ct-s1-b", "lift", 0, "new_concept"]]],
  ["s2", "Rebuild the Fern-Step Song", "Sit at fin.", "How can Tumble set the step?", "sit", [["a", "Sit at fin."], ["b", "Fit fin."], ["c", "Fan fin."]]],
  ["s3", "Turn the Rook Wind Stones", "Hit hot rock.", "What turns the hot wind stone?", ["hot", "rock"], [["a", "Sit on rock."], ["b", "Hit hot hat."], ["c", "Hit hot rock."]], [["rock", 2, "new_concept"]], [["ct-s3-a", "rock", 2, "new_concept"], ["ct-s3-c", "rock", 2, "new_concept"]]],
  ["s4", "Raise the Otter Ford", "Fit bun in bin.", "How can Tumble fill the ford gap?", "bun", [["a", "Fit bun on bin."], ["b", "Fit bun in bin."], ["c", "Fit bud in bin."]]],
  ["s6", "Guide the Bluff Bees Home", "Get buzz home in box.", "How can Fizz guide the buzz home?", ["buzz", "box", "home"], [["a", "Get buzz in net."], ["b", "Get box in van."], ["c", "Get buzz home in box."]], [["buzz", 1, "new_concept"], ["home", 2, "new_concept"]], [["ct-s6-a", "buzz", 1, "new_concept"], ["ct-s6-c", "buzz", 1, "new_concept"], ["ct-s6-c", "home", 2, "new_concept"]]],
  ["s7", "Relaunch the Lily Ferry", "Get jam off bell.", "What frees the ferry bell?", "jam", [["a", "Get jam off bell."], ["b", "Get bell off mat."], ["c", "Get jam on bell."]]],
  ["s8", "Clear Fishpool Reach", "Mat can fix net.", "What can patch the fish net?", "mat", [["a", "Box can fix net."], ["b", "Mat can fix net."], ["c", "Mat can fix bell."]]],
  ["s9", "Mend Wheelhouse Bend", "We can fix the ship.", "What gets the wheelhouse moving?", "ship", [["a", "Fix fish."], ["b", "Fix net."], ["c", "Fix ship."]]],
  ["s11", "Raise the Amber Trail Markers", "Pick the rock on the path.", "What reveals the amber path?", "rock", [["a", "Pick rock on path."], ["b", "Kick path rock."], ["c", "Sit on path rock."]]],
  ["s12", "Rebuild the Rattlebones Lift", "Lift the lamp with a hand.", "How can Amber raise the lift lamp?", "hand", [["a", "Kick lamp."], ["b", "Pick lamp."], ["c", "Lift lamp."]]],
  ["s13", "Reveal the Ash-Flat Trail", "Spin at the spot on the path.", "What reveals the ash-flat mark?", "spin", [["a", "Sit at spot."], ["b", "Spin at spot."], ["c", "Skip at spot."]]],
  ["s14", "Bridge Fern Canyon", "Clap at the flag on the block.", "What calls the fern bridge?", "clap", [["a", "Clap at flag."], ["b", "Flip flag."], ["c", "Clap at block."]]],
  ["s16", "Unlock Gearworks Gate", "Click the lock by it.", "Which action opens Bolt's lane?", "by", [["a", "Click flag."], ["b", "Click lock."], ["c", "Fly by lock."]]],
  ["s17", "Restart the Ore Hopper", "A big rock is on the ship. Lift the rock off.", "What unjams Soot's hopper?", "ship", [["a", "Kick rock."], ["b", "Sit on rock."], ["c", "Lift rock."]]],
  ["s18", "Relight the Plate Foundry", "The cake plate is not hot. Make the flame hot.", "What relights the foundry?", "cake", [["a", "Make flame hot."], ["b", "Make cake hot."], ["c", "Make plate hot."]]],
  ["s19", "Release the Night Train", "Slide the bike off the ship. It can run.", "What clears the train brake?", "bike", [["a", "Hide bike."], ["b", "Slide bike off."], ["c", "Ride bike."]]],
  ["s21", "Moor the Reedlight Ferry", "The cube is by the ship. The rope is on the cube.", "Where should Ripple fasten the rope?", "cube", [["a", "Rope on mule."], ["b", "Rope on gate."], ["c", "Rope on cube."]]],
  ["s22", "Clear Ripple Pool", "The theme is rain. Pick rain, not flame.", "Which picture clears the doubled signal?", "theme", [["a", "Pick rain."], ["b", "Pick run."], ["c", "Pick flame."]], [["rain", 3, "new_concept"], ["rain", 5, "new_concept"]], [["ct-s22-a", "rain", 1, "new_concept"]]],
  ["s23", "Raise the Mica Steps", "The train can stay. The rain tray can sit by the train.", "Where should Glint set the rain tray?", "rain", [["a", "Tray on train."], ["b", "Rain tray by train."], ["c", "Tray in train."]]],
  ["s24", "Tune Glint Causeway", "The tree can sing. Clap with the tree.", "What tunes the causeway song?", "tree", [["a", "Sing with tree."], ["b", "Sit by tree."], ["c", "Clap with tree."]]],
  ["s26", "Secure Galecliff Path", "Show the road by the coat. The boat can go that way.", "Which marker keeps the boat on course?", "boat", [["a", "Road by coat."], ["b", "Road by snow."], ["c", "Road by goat."]]],
  ["s27", "Rebuild Shellhaven Roof", "Snow is on the room. Glue the blue moon coat on the room.", "What covers Boom's shelter?", "moon", [["a", "Food in room."], ["b", "Glue blue moon coat."], ["c", "Snow in room."]]],
  ["s28", "Restore Signal Harbour", "The ship is by the boat. Look in the book. Hook the light.", "How can Prism relight the harbour signal?", "book", [["a", "Hook book on boat."], ["b", "Hide light in book."], ["c", "Hook light."]]],
  ["s29", "Calm Stormglass Cove", "The loud sound is by the rock. Sit now. The sound can stop.", "What helps the cove grow calm?", "sound", [["a", "Sit now."], ["b", "Bang rock."], ["c", "Make sound loud."]]],
  ["s31", "Open Mothlight Gate", "The dark path is by the park. Park the car by the gate. The car can stop.", "Where should Luma stop the car?", "car", [["a", "Start car."], ["b", "Park car by gate."], ["c", "Hide car at farm."]]],
  ["s32", "Wake the Echo Roots", "The storm hit the tree. A dark star is on it. Draw the star on the tree.", "What wakes Wisp's folded root stair?", "storm", [["a", "Saw tree."], ["b", "Store star."], ["c", "Draw star on tree."]]],
  ["s33", "Mark Wispwood Turn", "The bird can turn by the fern. The girl can look at it. Draw the turn so the girl can look.", "What completes Orbit's living map?", "bird", [["a", "Draw turn."], ["b", "Look at bird."], ["c", "Sit by fern."]]],
  ["s34", "Align Orbit Hollow", "The chair is by the stair. The girl can share the fair cake there. Pair the chair with the stair.", "Which pairing lines up the hollow rings?", "chair", [["a", "Pair chair with hair."], ["b", "Pair chair with stair."], ["c", "Pair stair with hair."]]],
  ["s36", "Raise Comet Stair", "The creature is here. It can follow the pure light. Make the dark stair bright so the path is secure.", "What raises Comet's faded stair?", "pure", [["a", "Follow creature."], ["b", "Stair still dark."], ["c", "Make stair bright."]]],
  ["s37", "Open Aster Archive", "The giant can climb to the dark city cell. The magic words are ready. Read the magic words at the lock.", "What opens Aster's archive?", "city", [["a", "Read magic words."], ["b", "Climb city cell."], ["c", "Rest by lock."]]],
  ["s38", "Join Dawn Causeway", "The cats jumped up. The dogs landed by the stars. Join the star path so the cats can step on it.", "What joins Dawn's divided path?", "cats", [["a", "Follow dogs."], ["b", "Join star path."], ["c", "Sit by stars."]]],
  ["s39", "Complete Reading Skybridge", "We can cross the bridge. Take the little puzzle over it, and leave the rocks by the table.", "What completes Comet's skybridge?", "little", [["a", "Leave puzzle by table."], ["b", "Take rocks over bridge."], ["c", "Take little puzzle."]]]
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
