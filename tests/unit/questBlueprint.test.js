import test from "node:test";
import assert from "node:assert/strict";
import {
  QUEST_CHAPTERS,
  chapterFinaleForStop,
  chapterForStop,
  chapterRouteTopology,
  chapterStopNumber,
  validateQuestChapters
} from "../../src/data/questChapters.js";
import { QUEST_STOPS } from "../../src/data/questSequence.js";
import {
  mechanicPlanForStop,
  validateMechanicMatrix
} from "../../src/data/questMechanicMatrix.js";

test("world blueprint assigns every curriculum stop to one five-stop chapter", () => {
  assert.equal(QUEST_CHAPTERS.length, 8);
  assert.deepEqual(validateQuestChapters(), []);
  assert.equal(new Set(QUEST_CHAPTERS.flatMap(chapter => chapter.stopIds)).size, 40);
  for (const stop of QUEST_STOPS) {
    assert.ok(chapterForStop(stop), `${stop.id} has a chapter`);
    assert.ok(chapterStopNumber(stop) >= 1 && chapterStopNumber(stop) <= 5);
    assert.equal(typeof chapterRouteTopology(stop), "string");
  }
});

test("each chapter has a distinct dramatic and production identity", () => {
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.destination)).size, 8);
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.chapterReward.id)).size, 8);
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.audio.score)).size, 8);
  QUEST_CHAPTERS.forEach(chapter => {
    assert.ok(chapter.conflict.length > 30);
    assert.ok(chapter.objective.length > 30);
    assert.equal(chapter.mechanicRotation.length, 5);
    assert.ok(new Set(chapter.routeTopologies).size >= 4);
    assert.ok(chapter.cast.guide.name);
    assert.equal(chapter.cast.residents.length, 3);
    assert.ok(chapter.finale.action.length > 30);
    assert.ok(chapter.finale.consequence.length > 30);
    assert.equal(chapterFinaleForStop(chapter.stopIds[0]), null);
    assert.equal(chapterFinaleForStop(chapter.stopIds.at(-1))?.cue, chapter.finale.cue);
  });
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.finale.cue)).size, 8);
});

test("curriculum matrix gives all 40 stops observable learning evidence", () => {
  assert.deepEqual(validateMechanicMatrix(QUEST_STOPS), []);
  QUEST_STOPS.forEach(stop => {
    const plan = mechanicPlanForStop(stop);
    assert.ok(plan.requiredEvidence.length >= 2, `${stop.id} has multi-domain evidence`);
    assert.ok(plan.physicalCandidates.length >= 1, `${stop.id} has an in-world mechanic candidate`);
    assert.equal(Object.keys(plan.shellEvidence).length, stop.shells.length);
  });
});
