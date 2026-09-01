import { QUEST_STOPS } from "../../../data/questSequence.js";
import {
  SOUND_POWER_IDS,
  getInstructionContract
} from "./instructionContracts.js";
import { SOUND_SEEKERS_CHAPTERS } from "./chapters/index.js";
import {
  SOUND_SEEKERS_WORDS,
  assertShippingPronunciationLexicon,
  getPronunciation
} from "./pronunciationLexicon.js";
import { getReviewSequence } from "./reviewSequences.js";
import { createTeachSequence } from "../engine/teachSequence.js";

const POWER_CONFIG = Object.freeze({
  [SOUND_POWER_IDS.ECHO_SEARCH]: Object.freeze({ instructionId: "echo-search-find-source" }),
  [SOUND_POWER_IDS.CONTRAST_SORT]: Object.freeze({ instructionId: "contrast-sort-place-sound" }),
  [SOUND_POWER_IDS.WORD_FORGE]: Object.freeze({ instructionId: "word-forge-place-tile", wordBased: true }),
  [SOUND_POWER_IDS.BLEND_BRIDGE]: Object.freeze({ instructionId: "blend-bridge-choose-meaning", wordBased: true }),
  [SOUND_POWER_IDS.MEMORY_DELIVERY]: Object.freeze({ instructionId: "memory-delivery-deliver-heart-word" }),
  [SOUND_POWER_IDS.STORY_POWER]: Object.freeze({ instructionId: "story-power-choose-story-action" })
});

const NON_WORD_POWER_ROTATION = Object.freeze([
  SOUND_POWER_IDS.ECHO_SEARCH,
  SOUND_POWER_IDS.CONTRAST_SORT,
  SOUND_POWER_IDS.MEMORY_DELIVERY
]);
const WORD_POWER_ROTATION = Object.freeze([
  SOUND_POWER_IDS.WORD_FORGE,
  SOUND_POWER_IDS.BLEND_BRIDGE
]);
const WONDER_REPRESENTATION_BY_CHAPTER = Object.freeze({
  "seedwake-meadow": "sound-to-light-ripple",
  "river-gardens": "classified-cargo-restores-waterflow",
  "fossil-canyon": "blended-segments-draw-a-trail-line",
  "forge-settlement": "grapheme-boxes-turn-forge-gears",
  "glass-marsh": "contrast-pairs-reveal-the-safe-path",
  "storm-coast": "remembered-cues-align-the-storm-lens",
  "lantern-forest": "read-phrases-grow-the-living-map",
  "star-reach": "six-sound-powers-join-a-constellation"
});

const EXPEDITION_BLUEPRINTS = Object.freeze([
  { stopId: "s1", title: "Wake the Seed Lanterns", residentId: "Moss", problemId: "seed-lanterns-dark", previewId: "seedwake-path-dark", contexts: ["s1-seed-lantern-search", "s1-path-mat-forge"], wordId: "mat", relationshipBeatId: "seedwake-s1-moss-trust", consequenceId: "seedwake-path-lit" },
  { stopId: "s2", title: "Rebuild the Fern-Step Song", residentId: "Tumble", problemId: "fern-step-notes-scattered", previewId: "fern-path-broken", contexts: ["s2-stream-note-sort", "s2-fern-word-bridge"], wordId: "sit", relationshipBeatId: "seedwake-s2-tumble-partnership", consequenceId: "fern-steps-sing" },
  { stopId: "s3", title: "Turn the Rook Wind Stones", residentId: "Bramble", problemId: "rook-stones-still", previewId: "rook-hill-windless", contexts: ["s3-rook-note-delivery", "s3-stone-hot-forge"], wordId: "hot", relationshipBeatId: "seedwake-s3-bramble-curiosity", consequenceId: "rook-stones-turn" },
  { stopId: "s4", title: "Raise the Otter Ford", residentId: "Tumble", problemId: "otter-ford-submerged", previewId: "meadow-crossing-closed", contexts: ["s4-ford-sound-search", "s4-bun-plank-bridge"], wordId: "bun", relationshipBeatId: "seedwake-s4-tumble-confidence", consequenceId: "otter-ford-open" },
  { stopId: "s5", title: "Open Bramble Gate", residentId: "Bramble", problemId: "bramble-gate-asleep", previewId: "meadow-gate-closed", contexts: ["s5-gate-vine-sort", "s5-cup-key-forge"], wordId: "cup", bossWordId: "cat", relationshipBeatId: "seedwake-s5-bramble-welcome", consequenceId: "bramble-gate-blooming" },

  { stopId: "s6", title: "Guide the Bluff Bees Home", residentId: "Fizz", problemId: "beehive-paths-crossed", previewId: "river-terraces-unpollinated", contexts: ["s6-pollen-cue-delivery", "s6-box-hive-bridge"], wordId: "box", relationshipBeatId: "river-s6-fizz-relief", consequenceId: "beehive-bluff-buzzing" },
  { stopId: "s7", title: "Relaunch the Lily Ferry", residentId: "Quill", problemId: "lily-ferry-grounded", previewId: "river-crossing-stalled", contexts: ["s7-ferry-bell-search", "s7-jam-crate-forge"], wordId: "jam", relationshipBeatId: "river-s7-quill-teamwork", consequenceId: "lily-ferry-running" },
  { stopId: "s8", title: "Clear Fishpool Reach", residentId: "Rill", problemId: "fishpool-markers-mixed", previewId: "fishpool-channel-hidden", contexts: ["s8-canal-marker-sort", "s8-mat-ferry-bridge"], wordId: "mat", relationshipBeatId: "river-s8-rill-trust", consequenceId: "fishpool-channel-clear" },
  { stopId: "s9", title: "Mend Wheelhouse Bend", residentId: "Fizz", problemId: "wheelhouse-paddles-missing", previewId: "upper-canals-dry", contexts: ["s9-paddle-cue-delivery", "s9-ship-paddle-forge"], wordId: "ship", relationshipBeatId: "river-s9-fizz-pride", consequenceId: "wheelhouse-turning" },
  { stopId: "s10", title: "Restart the Singing Weir", residentId: "Rill", problemId: "singing-weir-silent", previewId: "river-gardens-still", contexts: ["s10-weir-note-search", "s10-thin-rill-bridge"], wordId: "thin", bossWordId: "thing", relationshipBeatId: "river-s10-rill-celebration", consequenceId: "singing-weir-flowing" },

  { stopId: "s11", title: "Raise the Amber Trail Markers", residentId: "Rook", problemId: "amber-markers-buried", previewId: "dig-route-unmarked", contexts: ["s11-fossil-marker-sort", "s11-rock-marker-forge"], wordId: "rock", relationshipBeatId: "fossil-s11-rook-respect", consequenceId: "amber-trail-visible" },
  { stopId: "s12", title: "Rebuild the Rattlebones Lift", residentId: "Amber", problemId: "bone-lift-cable-loose", previewId: "dig-team-separated", contexts: ["s12-lift-cue-delivery", "s12-hand-rail-bridge"], wordId: "hand", relationshipBeatId: "fossil-s12-amber-reliance", consequenceId: "rattlebones-lift-running" },
  { stopId: "s13", title: "Reveal the Ash-Flat Trail", residentId: "Claw", problemId: "ash-trail-covered", previewId: "fossil-carts-lost", contexts: ["s13-ash-echo-search", "s13-spin-compass-forge"], wordId: "spin", relationshipBeatId: "fossil-s13-claw-curiosity", consequenceId: "ash-trail-glowing" },
  { stopId: "s14", title: "Bridge Fern Canyon", residentId: "Rook", problemId: "fern-canyon-span-fallen", previewId: "canyon-return-cut-off", contexts: ["s14-bridge-piece-sort", "s14-clap-signal-bridge"], wordId: "clap", relationshipBeatId: "fossil-s14-rook-courage", consequenceId: "fern-canyon-bridged" },
  { stopId: "s15", title: "Reopen Claw Pass", residentId: "Claw", problemId: "claw-pass-sealed", previewId: "excavation-team-divided", contexts: ["s15-pass-cue-delivery", "s15-frog-signal-forge"], wordId: "frog", bossWordId: "truck", relationshipBeatId: "fossil-s15-claw-friendship", consequenceId: "claw-pass-open" },

  { stopId: "s16", title: "Unlock Gearworks Gate", residentId: "Bolt", problemId: "gearworks-lock-misread", previewId: "forge-lane-closed", contexts: ["s16-gear-echo-search", "s16-by-key-bridge"], wordId: "by", relationshipBeatId: "forge-s16-bolt-confidence", consequenceId: "gearworks-gate-open" },
  { stopId: "s17", title: "Restart the Ore Hopper", residentId: "Soot", problemId: "ore-hopper-jammed", previewId: "foundry-fuel-stalled", contexts: ["s17-ore-label-sort", "s17-ship-chute-forge"], wordId: "ship", relationshipBeatId: "forge-s17-soot-trust", consequenceId: "ore-hopper-running" },
  { stopId: "s18", title: "Relight the Plate Foundry", residentId: "Bellows", problemId: "plate-foundry-cold", previewId: "machine-plates-unmade", contexts: ["s18-furnace-cue-delivery", "s18-cake-mould-bridge"], wordId: "cake", relationshipBeatId: "forge-s18-bellows-respect", consequenceId: "plate-foundry-lit" },
  { stopId: "s19", title: "Release the Night Train", residentId: "Bolt", problemId: "night-train-braked", previewId: "settlement-cargo-waiting", contexts: ["s19-train-signal-search", "s19-bike-cog-forge"], wordId: "bike", relationshipBeatId: "forge-s19-bolt-partnership", consequenceId: "night-train-running" },
  { stopId: "s20", title: "Ignite the Word Forge", residentId: "Bellows", problemId: "word-forge-rings-dark", previewId: "settlement-machines-still", contexts: ["s20-forge-token-sort", "s20-home-ring-bridge"], wordId: "home", bossWordId: "stone", relationshipBeatId: "forge-s20-bellows-pride", consequenceId: "word-forge-burning" },

  { stopId: "s21", title: "Moor the Reedlight Ferry", residentId: "Ripple", problemId: "reedlight-mooring-lost", previewId: "marsh-landing-drifting", contexts: ["s21-mooring-cue-delivery", "s21-cube-anchor-forge"], wordId: "cube", relationshipBeatId: "glass-s21-ripple-relief", consequenceId: "reedlight-ferry-moored" },
  { stopId: "s22", title: "Clear Ripple Pool", residentId: "Mica", problemId: "ripple-pool-reflections-clouded", previewId: "marsh-signals-doubled", contexts: ["s22-reflection-echo-search", "s22-theme-glass-bridge"], wordId: "theme", relationshipBeatId: "glass-s22-mica-trust", consequenceId: "ripple-pool-clear" },
  { stopId: "s23", title: "Raise the Mica Steps", residentId: "Glint", problemId: "mica-steps-submerged", previewId: "marsh-high-path-lost", contexts: ["s23-step-token-sort", "s23-rain-step-forge"], wordId: "rain", relationshipBeatId: "glass-s23-glint-confidence", consequenceId: "mica-steps-raised" },
  { stopId: "s24", title: "Tune Glint Causeway", residentId: "Ripple", problemId: "glint-causeway-out-of-tune", previewId: "glass-route-fractured", contexts: ["s24-reed-cue-delivery", "s24-tree-tone-bridge"], wordId: "tree", relationshipBeatId: "glass-s24-ripple-partnership", consequenceId: "glint-causeway-singing" },
  { stopId: "s25", title: "Relight Mirror Fen", residentId: "Glint", problemId: "mirror-fen-beacon-dark", previewId: "safe-marsh-route-hidden", contexts: ["s25-beacon-echo-search", "s25-light-lens-forge"], wordId: "light", bossWordId: "night", relationshipBeatId: "glass-s25-glint-friendship", consequenceId: "mirror-fen-lit" },

  { stopId: "s26", title: "Secure Galecliff Path", residentId: "Kelp", problemId: "galecliff-signs-scattered", previewId: "coast-path-unsafe", contexts: ["s26-cliff-sign-sort", "s26-boat-rope-bridge"], wordId: "boat", relationshipBeatId: "storm-s26-kelp-trust", consequenceId: "galecliff-path-secure" },
  { stopId: "s27", title: "Rebuild Shellhaven Roof", residentId: "Boom", problemId: "shellhaven-roof-open", previewId: "harbour-shelter-wet", contexts: ["s27-roof-cue-delivery", "s27-moon-tile-forge"], wordId: "moon", relationshipBeatId: "storm-s27-boom-relief", consequenceId: "shellhaven-roof-mended" },
  { stopId: "s28", title: "Restore Signal Harbour", residentId: "Prism", problemId: "harbour-signals-dark", previewId: "boats-without-bearing", contexts: ["s28-signal-echo-search", "s28-book-code-bridge"], wordId: "book", relationshipBeatId: "storm-s28-prism-confidence", consequenceId: "signal-harbour-lit" },
  { stopId: "s29", title: "Calm Stormglass Cove", residentId: "Kelp", problemId: "stormglass-cove-roaring", previewId: "lens-pieces-unreachable", contexts: ["s29-wave-token-sort", "s29-sound-shell-forge"], wordId: "sound", relationshipBeatId: "storm-s29-kelp-courage", consequenceId: "stormglass-cove-calm" },
  { stopId: "s30", title: "Wake the Thunder Lighthouse", residentId: "Prism", problemId: "thunder-lighthouse-lens-broken", previewId: "harbour-without-beam", contexts: ["s30-lens-cue-delivery", "s30-coin-lens-bridge"], wordId: "coin", bossWordId: "point", relationshipBeatId: "storm-s30-prism-pride", consequenceId: "thunder-lighthouse-awake" },

  { stopId: "s31", title: "Open Mothlight Gate", residentId: "Luma", problemId: "mothlight-gate-unmapped", previewId: "forest-route-looping", contexts: ["s31-mothlight-echo-search", "s31-car-map-forge"], wordId: "car", relationshipBeatId: "lantern-s31-luma-trust", consequenceId: "mothlight-gate-open" },
  { stopId: "s32", title: "Wake the Echo Roots", residentId: "Wisp", problemId: "echo-roots-asleep", previewId: "root-stairs-folded", contexts: ["s32-root-token-sort", "s32-storm-root-bridge"], wordId: "storm", relationshipBeatId: "lantern-s32-wisp-curiosity", consequenceId: "echo-roots-awake" },
  { stopId: "s33", title: "Mark Wispwood Turn", residentId: "Orbit", problemId: "wispwood-signs-wandering", previewId: "living-map-incomplete", contexts: ["s33-map-cue-delivery", "s33-bird-marker-forge"], wordId: "bird", relationshipBeatId: "lantern-s33-orbit-reliance", consequenceId: "wispwood-turn-marked" },
  { stopId: "s34", title: "Align Orbit Hollow", residentId: "Luma", problemId: "orbit-hollow-rings-misaligned", previewId: "observatory-path-shut", contexts: ["s34-orbit-echo-search", "s34-chair-ring-bridge"], wordId: "chair", relationshipBeatId: "lantern-s34-luma-partnership", consequenceId: "orbit-hollow-aligned" },
  { stopId: "s35", title: "Turn the Sleeping Observatory", residentId: "Orbit", problemId: "observatory-dome-still", previewId: "forest-sky-unread", contexts: ["s35-dome-token-sort", "s35-hear-gear-forge"], wordId: "hear", bossWordId: "near", relationshipBeatId: "lantern-s35-orbit-friendship", consequenceId: "sleeping-observatory-turning" },

  { stopId: "s36", title: "Raise Comet Stair", residentId: "Comet", problemId: "comet-stair-faded", previewId: "sky-road-unreachable", contexts: ["s36-star-cue-delivery", "s36-pure-light-bridge"], wordId: "pure", relationshipBeatId: "star-s36-comet-confidence", consequenceId: "comet-stair-raised" },
  { stopId: "s37", title: "Open Aster Archive", residentId: "Aster", problemId: "aster-archive-locked", previewId: "sky-maps-hidden", contexts: ["s37-archive-echo-search", "s37-city-key-forge"], wordId: "city", relationshipBeatId: "star-s37-aster-trust", consequenceId: "aster-archive-open" },
  { stopId: "s38", title: "Join Dawn Causeway", residentId: "Dawn", problemId: "dawn-causeway-separated", previewId: "star-gardens-divided", contexts: ["s38-ending-token-sort", "s38-cats-path-bridge"], wordId: "cats", relationshipBeatId: "star-s38-dawn-partnership", consequenceId: "dawn-causeway-joined" },
  { stopId: "s39", title: "Complete Reading Skybridge", residentId: "Comet", problemId: "reading-skybridge-unfinished", previewId: "first-star-route-broken", contexts: ["s39-bridge-cue-delivery", "s39-table-plank-forge"], wordId: "table", relationshipBeatId: "star-s39-comet-courage", consequenceId: "reading-skybridge-complete" },
  { stopId: "s40", title: "Wake the First Reading Star", residentId: "Dawn", problemId: "first-reading-star-dim", previewId: "sky-road-disconnected", contexts: ["s40-star-echo-search", "s40-station-ray-bridge"], wordId: "station", bossWordId: "action", relationshipBeatId: "star-s40-dawn-celebration", consequenceId: "first-reading-star-awake" }
]);

function chapterForStop(stopId) {
  const chapter = SOUND_SEEKERS_CHAPTERS.find(item => item.stopIds.includes(stopId));
  if (!chapter) throw new Error(`${stopId}: no Sound Seekers chapter`);
  return chapter;
}

function wordContract(wordId, stopIndex) {
  const pronunciation = getPronunciation(wordId);
  if (!pronunciation) throw new Error(`${wordId}: missing authored pronunciation`);
  const unitTargetIds = pronunciation.units.map(unit => unit.evidenceTargetId);
  if (unitTargetIds.some(targetId => !targetId)) {
    throw new Error(`${wordId}: every assessed unit needs an explicit evidence target`);
  }

  const taughtThroughStop = new Set(QUEST_STOPS
    .filter(stop => stop.index <= stopIndex)
    .flatMap(stop => stop.teach.map(target => target.id)));
  for (const targetId of unitTargetIds) {
    if (!taughtThroughStop.has(targetId)) throw new Error(`${wordId}:${targetId} was not taught by s${stopIndex}`);
  }

  const coveredLetters = new Set(pronunciation.units.flatMap(unit => unit.letterIndices));
  if (coveredLetters.size !== pronunciation.word.length) {
    throw new Error(`${wordId}: pronunciation units do not cover the printed word`);
  }
  return Object.freeze({ wordId: pronunciation.id, unitTargetIds: Object.freeze(unitTargetIds) });
}

function decisionContract(powerId, instructionId = POWER_CONFIG[powerId]?.instructionId) {
  const config = POWER_CONFIG[powerId];
  const instruction = config && getInstructionContract(instructionId);
  if (!instruction || instruction.powerId !== powerId || instruction.phase !== "decision") {
    throw new Error(`${powerId}: missing exact decision instruction ${instructionId || "(none)"}`);
  }
  return Object.freeze({
    powerId,
    instructionId: instruction.instructionId,
    expectedAction: instruction.expectedAction,
    recordsDomain: instruction.recordsDomain
  });
}

function withFirstUseOnboarding(phase, seenPowers) {
  if (seenPowers.has(phase.powerId)) return phase;
  seenPowers.add(phase.powerId);
  return {
    ...phase,
    onboarding: Object.freeze({ consequenceFree: true, recordsDomain: null })
  };
}

function challengePhase({ id, powerId, contextId, contentSlotId, focusTargetId, wordId, stopIndex }, seenPowers) {
  const contract = decisionContract(powerId);
  const phase = {
    id,
    kind: "challenge",
    ...contract,
    contextId,
    contentSlotIds: Object.freeze([contentSlotId])
  };
  if (POWER_CONFIG[powerId].wordBased) Object.assign(phase, wordContract(wordId, stopIndex));
  if (powerId === SOUND_POWER_IDS.ECHO_SEARCH || powerId === SOUND_POWER_IDS.CONTRAST_SORT) {
    phase.targetIds = Object.freeze([focusTargetId]);
  }
  return Object.freeze(withFirstUseOnboarding(phase, seenPowers));
}

function transferPhase({ stopId, stopIndex, connectedTextId, boss, bossWordId, bossTransferId }, seenPowers) {
  const powerId = boss ? SOUND_POWER_IDS.BLEND_BRIDGE : SOUND_POWER_IDS.STORY_POWER;
  const contract = decisionContract(
    powerId,
    boss ? "blend-bridge-choose-novel-meaning" : POWER_CONFIG[powerId].instructionId
  );
  const phase = {
    id: `${stopId}-transfer`,
    kind: "transfer",
    ...contract,
    contextId: boss ? bossTransferId : `${stopId}-controlled-scene`,
    connectedTextId,
    ...(boss ? wordContract(bossWordId, stopIndex) : {})
  };
  return Object.freeze(withFirstUseOnboarding(phase, seenPowers));
}

function buildExpedition(blueprint, blueprintIndex, seenPowers) {
  const stop = QUEST_STOPS[blueprintIndex];
  if (!stop || stop.id !== blueprint.stopId) throw new Error(`${blueprint.stopId}: expedition order changed`);
  const chapter = chapterForStop(stop.id);
  const localIndex = chapter.stopIds.indexOf(stop.id);
  const review = getReviewSequence(stop.id);
  const introducedTargetIds = Object.freeze(stop.teach.map(target => target.id));
  const reviewTargetIds = review?.targetIds || Object.freeze([]);
  const focusTargetId = introducedTargetIds[0] || reviewTargetIds[0];
  if (!focusTargetId) throw new Error(`${stop.id}: expedition needs an introduced or review target`);

  const residentNames = new Set([chapter.cast.guide.name, ...chapter.cast.residents.map(resident => resident.name)]);
  if (!residentNames.has(blueprint.residentId)) throw new Error(`${stop.id}:${blueprint.residentId} is not in the chapter cast`);

  const teachSequence = createTeachSequence(stop);
  const teach = Object.freeze({
    mode: review ? "review" : "introduce",
    targetIds: introducedTargetIds,
    reviewTargetIds,
    instructionIds: Object.freeze(review
      ? ["echo-search-replay"]
      : [...new Set(teachSequence.items.map(item => item.instructionId))]),
    scored: false
  });
  const heartWordSlotIds = Object.freeze([
    `heart-slot-${stop.id}-1`,
    `heart-slot-${stop.id}-2`
  ]);
  const connectedTextId = `scene-${stop.id}`;
  const primaryPowerId = NON_WORD_POWER_ROTATION[blueprintIndex % NON_WORD_POWER_ROTATION.length];
  const boss = stop.index % 5 === 0;
  const secondaryPowerId = boss
    ? SOUND_POWER_IDS.WORD_FORGE
    : WORD_POWER_ROTATION[blueprintIndex % WORD_POWER_ROTATION.length];

  const phases = Object.freeze([
    Object.freeze({ id: `${stop.id}-arrival`, kind: "arrival", recordsDomain: null }),
    Object.freeze({ id: `${stop.id}-teach`, kind: "teach", recordsDomain: null }),
    challengePhase({
      id: `${stop.id}-primary`, powerId: primaryPowerId, contextId: blueprint.contexts[0],
      contentSlotId: heartWordSlotIds[0], focusTargetId, wordId: blueprint.wordId, stopIndex: stop.index
    }, seenPowers),
    challengePhase({
      id: `${stop.id}-secondary`, powerId: secondaryPowerId, contextId: blueprint.contexts[1],
      contentSlotId: heartWordSlotIds[1], focusTargetId, wordId: blueprint.wordId, stopIndex: stop.index
    }, seenPowers),
    Object.freeze({ id: `${stop.id}-wonder`, kind: "wonder", recordsDomain: null }),
    transferPhase({
      stopId: stop.id,
      stopIndex: stop.index,
      connectedTextId,
      boss,
      bossWordId: blueprint.bossWordId,
      bossTransferId: chapter.bossTransferId
    }, seenPowers),
    Object.freeze({ id: `${stop.id}-payoff`, kind: "payoff", recordsDomain: null })
  ]);

  return Object.freeze({
    id: `expedition-${stop.id}`,
    stopId: stop.id,
    stopIndex: stop.index,
    chapterId: chapter.id,
    title: blueprint.title,
    residentId: blueprint.residentId,
    arrival: Object.freeze({ problemId: blueprint.problemId, consequencePreviewId: blueprint.previewId }),
    teach,
    phases,
    heartWordSlotIds,
    connectedTextId,
    wonder: Object.freeze({
      id: chapter.wonderId,
      representation: WONDER_REPRESENTATION_BY_CHAPTER[chapter.id]
    }),
    transfer: Object.freeze({ boss, imaginary: false }),
    payoff: Object.freeze({
      repairId: chapter.repairBeatIds[localIndex],
      relationshipBeatId: blueprint.relationshipBeatId,
      consequenceId: blueprint.consequenceId
    }),
    resume: Object.freeze({ safePhaseIds: Object.freeze([
      `${stop.id}-arrival`, `${stop.id}-teach`, `${stop.id}-primary`, `${stop.id}-secondary`,
      `${stop.id}-transfer`, `${stop.id}-payoff`
    ]) }),
    naturalStop: true
  });
}

if (EXPEDITION_BLUEPRINTS.length !== QUEST_STOPS.length) {
  throw new Error("Sound Seekers needs one authored expedition blueprint per curriculum stop");
}

const seenPowers = new Set();
export const SOUND_SEEKERS_EXPEDITIONS = Object.freeze(EXPEDITION_BLUEPRINTS.map(
  (blueprint, index) => buildExpedition(blueprint, index, seenPowers)
));

const assessedWordIds = [...new Set(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases
  .map(phase => phase.wordId)
  .filter(Boolean)))];
assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS, { requiredEvidenceWordIds: assessedWordIds });

export const HEART_WORD_SLOT_IDS = Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(
  expedition => expedition.heartWordSlotIds
));
export const CONNECTED_TEXT_IDS = Object.freeze(SOUND_SEEKERS_EXPEDITIONS.map(
  expedition => expedition.connectedTextId
));

const expeditionsByStopId = new Map(SOUND_SEEKERS_EXPEDITIONS.map(expedition => [expedition.stopId, expedition]));

export function getExpedition(stopId) {
  return expeditionsByStopId.get(String(stopId || "").trim()) || null;
}
