import test from "node:test";
import assert from "node:assert/strict";

import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import {
  SOUND_SEEKERS_CAST_ARCS,
  getCastRelationshipBeat
} from "../../src/features/soundSeekers/content/castArcs.js";

test("eight identity-only cast arcs retain thirty-two committed characters", () => {
  assert.deepEqual(Object.keys(SOUND_SEEKERS_CAST_ARCS), SOUND_SEEKERS_CHAPTERS.map(chapter => chapter.id));
  const characters = Object.values(SOUND_SEEKERS_CAST_ARCS).flatMap(arc => arc.characters);
  assert.equal(characters.length, 32);
  assert.equal(new Set(characters.map(character => character.id)).size, 32);
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const arc = SOUND_SEEKERS_CAST_ARCS[chapter.id];
    const expected = [chapter.cast.guide, ...chapter.cast.residents]
      .map(character => ({ id: character.name, role: character.role, archetype: character.archetype }));
    assert.deepEqual(arc.characters, expected);
    for (const character of arc.characters) {
      assert.deepEqual(Object.keys(character), ["id", "role", "archetype"]);
      assert.doesNotMatch(JSON.stringify(character), /visual|palette|pose|prop|asset|renderer|bodyShape/iu);
    }
  }
});

test("forty beats carry ordered same-chapter callback lines", () => {
  const beats = Object.values(SOUND_SEEKERS_CAST_ARCS).flatMap(arc => arc.relationshipBeats);
  assert.equal(beats.length, 40);
  for (const chapter of SOUND_SEEKERS_CHAPTERS) {
    const expeditions = SOUND_SEEKERS_EXPEDITIONS.filter(item => item.chapterId === chapter.id);
    const beatsForChapter = SOUND_SEEKERS_CAST_ARCS[chapter.id].relationshipBeats;
    assert.equal(beatsForChapter.length, 5);
    beatsForChapter.forEach((beat, index) => {
      const expedition = expeditions[index];
      assert.strictEqual(getCastRelationshipBeat(beat.id), beat);
      assert.deepEqual(Object.keys(beat), [
        "id", "chapterId", "stopId", "residentId", "repairId", "consequenceId",
        "callbackRepairIds", "callbackLines"
      ]);
      assert.equal(beat.id, expedition.payoff.relationshipBeatId);
      assert.equal(beat.residentId, expedition.residentId);
      assert.equal(beat.repairId, expedition.payoff.repairId);
      assert.equal(beat.consequenceId, expedition.payoff.consequenceId);
      assert.deepEqual(beat.callbackLines.map(line => line.repairId), beat.callbackRepairIds);
      assert.equal(new Set(beat.callbackRepairIds).size, beat.callbackRepairIds.length);
      if (index === 0) assert.deepEqual(beat.callbackRepairIds, []);
      if (index > 0) assert.equal(beat.callbackRepairIds.includes(expeditions[index - 1].payoff.repairId), true);
      if (index === 4) assert.equal(beat.callbackRepairIds.includes(expeditions[0].payoff.repairId), true);
      for (const line of beat.callbackLines) {
        assert.deepEqual(Object.keys(line), ["repairId", "text"]);
        assert.equal(line.text.trim().length > 12, true);
      }
    });
  }
});
