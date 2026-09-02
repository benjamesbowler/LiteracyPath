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

const TEXTS = [
  "A mat.", "Dad sat.", "The hot lid.", "A bun is hot.", "A cat can sit.",
  "The fox is in.", "Fix the bell.", "The bell is on.",
  "The fish sat in the box.", "You can sing with the bell.",
  "The duck can pick the rock.", "The hand can lift the lamp.",
  "We can sit on the rock.", "The flag is on the black block.",
  "The frog can jump from the truck.", "The sky is sunny by the shop.",
  "The big frog can jump. The red fox can run.",
  "The whale can swim. The snake can run.",
  "The white bike can ride. The kite can fly.",
  "The stone is by the rope. We can lift it.",
  "The cute mule can use the gate. The huge cube can fit.",
  "The athlete can complete the run. We can use these.",
  "The train can stay. The rain is on the tray.",
  "The sheep eat. The green leaf is by the tree.",
  "The bright light is high. The night is black. We can read the right path.",
  "The boat is slow. The goat can go on the road. The snow is white.",
  "The moon is blue. We can sit in the room. The food is hot.",
  "The cook took the book. Look at the good food. We can eat.",
  "The loud sound is down. The brown cow is out. We can sit now.",
  "The boy can point. We can pick the coin. The toy is on.",
  "The star is bright. The car can start. We can park by the farm.",
  "The claw is sharp. The storm can grow. We should store the corn.",
  "The bird can turn by the fern. The girl can look at it. We can sit by the bird.",
  "The chair is by the stair. The girl can sit there. We can share the fair cake with friends.",
  "The bird is near the tree. The girl can hear it sing. We can sit near the fern.",
  "The creature is here. It can follow the light. We can wait and look at the picture. The path is secure.",
  "The giant can climb the dark rock. Its magic light is ready. We can read the words and rest at school.",
  "The cats jumped up. The dogs had landed by the stars. We keep reading as the birds are singing.",
  "We cross the bridge. The apple is in the middle of the table. Take the simple puzzle and leave the rocks.",
  "Every quest is an action. We read the whole book and listen. We reach the station as the stars shout yes."
];

const CORRECT_TOKENS = [
  "b", "a", "c", "b", null, "c", "a", "b", "c", null,
  "a", "c", "b", "a", null, "b", "c", "a", "b", null,
  "c", "a", "b", "c", null, "a", "b", "c", "a", null,
  "b", "c", "a", "b", null, "c", "a", "b", "c", null
];

const FOCUS = [
  "mat", "dad", "lid", "bun", "cat", "fox", "bell", "fish", "box", "song",
  "rock", "lamp", "swim", "flag", "truck", "sky", "train", "whale", "bike", "stone",
  "mule", "run", "rain", "tree", "light", "boat", "moon", "book", "sound", "point",
  "star", "storm", "bird", "chair", "near", "picture", "words", "cats", "bridge", "quest"
];

const BOSS_DETAILS = Object.freeze({
  5: { wordId: "cat", contextId: "bramble-gate-novel-decode", options: ["Take the flower path.", "Take the stream path."] },
  10: { wordId: "thing", contextId: "singing-weir-novel-decode", options: ["Ring the high bell.", "Ring the low bell."] },
  15: { wordId: "truck", contextId: "claw-pass-novel-decode", options: ["Open the rock road.", "Open the fern road."] },
  20: { wordId: "stone", contextId: "word-forge-novel-decode", options: ["Light the blue forge.", "Light the red forge."] },
  25: { wordId: "night", contextId: "mirror-fen-novel-decode", options: ["Wake the moon light.", "Wake the reed light."] },
  30: { wordId: "point", contextId: "thunder-lighthouse-novel-decode", options: ["Turn the sea beam.", "Turn the sky beam."] },
  35: { wordId: "near", contextId: "observatory-novel-decode", options: ["Turn the near ring.", "Turn the far ring."] },
  40: { wordId: "action", contextId: "first-reading-star-novel-decode", options: ["Wake the dawn road.", "Wake the star road."] }
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
  const focus = FOCUS[index - 1];
  const correct = CORRECT_TOKENS[index - 1];
  const labelByRole = {
    correct: `Use the ${focus}.`,
    first: `Move past the ${focus}.`,
    second: `Wait by the ${focus}.`
  };
  let miss = 0;
  const options = ["a", "b", "c"].map(letter => {
    const role = letter === correct ? "correct" : miss++ === 0 ? "first" : "second";
    const childLabel = labelByRole[role];
    return {
      token: `ct-${stopId}-${letter}`,
      presentation: "image",
      childLabel,
      accessibleLabel: childLabel,
      visualSemanticId: `scene-${stopId}-option-${slug(childLabel)}`
    };
  });
  return {
    choice: {
      kind: "assessed_connected_text",
      comparisonFamilyId: `scene-${stopId}-repair-actions`,
      options
    },
    narrativeBranches: []
  };
}

function narrativeChoice(index) {
  const stopId = `s${index}`;
  const options = BOSS_DETAILS[index].options.map((childLabel, offset) => ({
    token: `story-${stopId}-${offset === 0 ? "a" : "b"}`,
    presentation: "image",
    childLabel,
    accessibleLabel: childLabel,
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
  const text = TEXTS[offset];
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
    advancedTokenIds: [],
    advancedTokenAudit: [],
    advancedTokenAuditDecision: {
      status: "reviewed_none_required",
      reviewerRole: "literacy-content-review",
      reviewedAt: REVIEWED_AT,
      evidenceRef: `task3:${sceneId}:advanced-token-audit`
    },
    textAudioKey: `quest/scenes/${sceneId}/text`,
    prompt: {
      text: boss ? "Which path should we take?" : "Which repair matches the words?",
      audioKey: `quest/scenes/${sceneId}/prompt`
    },
    ...choiceData,
    visualSemanticId: `${sceneId}-visual`
  };
}));
