import { SOUND_SEEKERS_CHAPTERS } from "./chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "./expeditions.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const AUTHORED_CALLBACK_LINES = Object.freeze({
  "seedwake-s2-tumble-partnership": { "wake-seeds": "Moss saw us wake the seed lanterns, so Tumble trusts us with the fern-step song." },
  "seedwake-s3-bramble-curiosity": { "mend-fern-steps": "Tumble heard the fern steps sing again and sends Bramble to ask for our help." },
  "seedwake-s4-tumble-confidence": { "light-rook-stones": "Bramble watched the rook stones turn and knows we can find the hidden ford." },
  "seedwake-s5-bramble-welcome": {
    "raise-otter-ford": "Tumble crossed the raised otter ford and arrives beside Bramble at the meadow gate.",
    "wake-seeds": "Moss brings a seed lantern from our first repair to welcome us through the gate."
  },
  "river-s7-quill-teamwork": { "restore-beehive-bluff": "Fizz heard the bluff bees return and asks Quill to help us launch the lily ferry." },
  "river-s8-rill-trust": { "relaunch-lily-ferry": "Quill sailed the lily ferry to Rill, who now trusts us with the hidden fishpool markers." },
  "river-s9-fizz-pride": { "clear-fishpool-reach": "Rill saw the fishpool channel clear and points Fizz toward the dry wheelhouse." },
  "river-s10-rill-celebration": {
    "mend-wheelhouse-bend": "Fizz watches the wheelhouse turn and joins Rill beside the silent weir.",
    "restore-beehive-bluff": "The bees from the restored bluff follow us to the weir as the gardens wake."
  },
  "fossil-s12-amber-reliance": { "raise-amber-marker": "Rook found the marked amber trail and brings Amber to us for help with the bone lift." },
  "fossil-s13-claw-curiosity": { "rebuild-rattlebones-lift": "Amber rides the rebuilt lift with Claw, who asks us to uncover the lost ash trail." },
  "fossil-s14-rook-courage": { "reveal-ash-flat-trail": "Claw follows the glowing ash trail and shows Rook where the canyon span fell." },
  "fossil-s15-claw-friendship": {
    "bridge-fern-canyon": "Rook crosses the new fern bridge and stands with Claw at the sealed pass.",
    "raise-amber-marker": "The first amber marker still shines behind the team, showing how far we came together."
  },
  "forge-s17-soot-trust": { "unlock-gearworks-gate": "Bolt sees the gearworks gate open and trusts us to help Soot at the jammed hopper." },
  "forge-s18-bellows-respect": { "restart-ore-hopper": "Soot sends fresh ore from the moving hopper, and Bellows welcomes us into the cold foundry." },
  "forge-s19-bolt-partnership": { "relight-plate-foundry": "Bellows sees the foundry flame return and asks Bolt to clear the stopped night train with us." },
  "forge-s20-bellows-pride": {
    "release-night-train": "Bolt waves from the moving night train as Bellows leads us to the dark word forge.",
    "unlock-gearworks-gate": "The open gearworks gate lets every helper reach the final forge repair."
  },
  "glass-s22-mica-trust": { "moor-reedlight-ferry": "Ripple secures the reedlight ferry and brings Mica safely to the clouded pool." },
  "glass-s23-glint-confidence": { "clear-ripple-pool": "Mica sees the ripple pool reflect clearly and trusts Glint to guide us toward the sunken steps." },
  "glass-s24-ripple-partnership": { "raise-mica-steps": "Glint climbs the raised mica steps and calls Ripple to help tune the broken causeway." },
  "glass-s25-glint-friendship": {
    "tune-glint-causeway": "Ripple hears the causeway sing and crosses it beside Glint toward Mirror Fen.",
    "moor-reedlight-ferry": "The moored ferry shines behind the friends as they relight the last marsh beacon."
  },
  "storm-s27-boom-relief": { "secure-galecliff-path": "Kelp follows the safe galecliff signs and reaches Boom's open shelter before the rain." },
  "storm-s28-prism-confidence": { "rebuild-shellhaven-roof": "Boom stays dry beneath the mended roof and sends Prism with us to the dark harbour." },
  "storm-s29-kelp-courage": { "restore-signal-harbour": "Prism sees the harbour signals glow and helps Kelp face the roaring cove." },
  "storm-s30-prism-pride": {
    "calm-stormglass-cove": "Kelp carries the recovered lens pieces from the calm cove to Prism at the lighthouse.",
    "secure-galecliff-path": "The secure cliff path lets the whole coast team climb to the final beacon."
  },
  "lantern-s32-wisp-curiosity": { "open-mothlight-gate": "Luma opens the mothlight gate and invites Wisp to explore the sleeping roots with us." },
  "lantern-s33-orbit-reliance": { "wake-echo-roots": "Wisp climbs the waking root stairs and asks Orbit to help us mark the wandering turn." },
  "lantern-s34-luma-partnership": { "mark-wispwood-turn": "Orbit records the wispwood turn, guiding Luma back to the misaligned hollow rings." },
  "lantern-s35-orbit-friendship": {
    "align-orbit-hollow": "Luma walks through the aligned rings beside Orbit toward the sleeping observatory.",
    "open-mothlight-gate": "Light from the open mothlight gate reaches the friends at the forest's final path."
  },
  "star-s37-aster-trust": { "raise-comet-stair": "Comet climbs the bright stair and trusts Aster to open the archive above it." },
  "star-s38-dawn-partnership": { "open-aster-archive": "Aster shares the opened sky maps with Dawn so we can reconnect the star gardens." },
  "star-s39-comet-courage": { "join-dawn-causeway": "Dawn crosses the joined causeway and meets Comet at the unfinished skybridge." },
  "star-s40-dawn-celebration": {
    "complete-reading-skybridge": "Comet carries the last puzzle across the finished skybridge to Dawn and the reading star.",
    "raise-comet-stair": "The first raised comet stair now carries every friend toward the final celebration."
  }
});

export const SOUND_SEEKERS_CAST_ARCS = deepFreeze(Object.fromEntries(
  SOUND_SEEKERS_CHAPTERS.map(chapter => {
    const expeditions = SOUND_SEEKERS_EXPEDITIONS.filter(item => item.chapterId === chapter.id);
    const characters = [chapter.cast.guide, ...chapter.cast.residents]
      .map(character => ({
        id: character.name,
        role: character.role,
        archetype: character.archetype
      }));
    const relationshipBeats = expeditions.map((expedition, index) => {
      const earlier = expeditions.slice(0, index);
      const callbackRepairIds = index === 4
        ? [...new Set([earlier.at(-1).payoff.repairId, earlier[0].payoff.repairId])]
        : index > 0 ? [earlier.at(-1).payoff.repairId] : [];
      return {
        id: expedition.payoff.relationshipBeatId,
        chapterId: expedition.chapterId,
        stopId: expedition.stopId,
        residentId: expedition.residentId,
        repairId: expedition.payoff.repairId,
        consequenceId: expedition.payoff.consequenceId,
        callbackRepairIds,
        callbackLines: callbackRepairIds.map(repairId => {
          const text = AUTHORED_CALLBACK_LINES[expedition.payoff.relationshipBeatId]?.[repairId];
          if (!text) throw new Error(`${expedition.payoff.relationshipBeatId}: missing authored callback for ${repairId}`);
          return { repairId, text };
        })
      };
    });
    return [chapter.id, { chapterId: chapter.id, characters, relationshipBeats }];
  })
));

const beatById = new Map(Object.values(SOUND_SEEKERS_CAST_ARCS)
  .flatMap(arc => arc.relationshipBeats).map(beat => [beat.id, beat]));

export function getCastRelationshipBeat(relationshipBeatId) {
  return beatById.get(String(relationshipBeatId || "").trim()) || null;
}
