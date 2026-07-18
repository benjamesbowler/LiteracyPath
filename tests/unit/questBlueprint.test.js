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

test("the map is honest about which chapters have reached the production bar", () => {
  assert.equal(QUEST_CHAPTERS[0].releaseStatus, "production");
  assert.deepEqual(QUEST_CHAPTERS.slice(1).map(chapter => chapter.releaseStatus), Array(7).fill("software-ready"));
});

test("each chapter has a distinct dramatic and production identity", () => {
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.destination)).size, 8);
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.chapterReward.id)).size, 8);
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.audio.score)).size, 8);
  const shortcutIds = new Set();
  QUEST_CHAPTERS.forEach(chapter => {
    assert.ok(chapter.conflict.length > 30);
    assert.ok(chapter.objective.length > 30);
    assert.ok(chapter.optionalDiscovery.title.length > 8);
    assert.ok(chapter.optionalDiscovery.message.length > 20);
    assert.ok(chapter.shortcut.label.length >= 6);
    assert.ok(chapter.shortcut.action.length >= 12);
    assert.ok(chapter.shortcut.effect.length >= 12);
    assert.equal(shortcutIds.has(chapter.shortcut.id), false);
    shortcutIds.add(chapter.shortcut.id);
    assert.equal(chapter.memoryStories.length, 4);
    assert.equal(new Set(chapter.memoryStories.map(story => story.line)).size, 4);
    const residentNames = new Set(chapter.cast.residents.map(resident => resident.name));
    chapter.memoryStories.forEach(story => {
      assert.equal(residentNames.has(story.speaker), true);
      assert.ok(story.line.length >= 20);
      assert.ok(story.change.length >= 12);
    });
    assert.equal(chapter.mechanicRotation.length, 5);
    assert.ok(new Set(chapter.routeTopologies).size >= 4);
    assert.ok(chapter.cast.guide.name);
    assert.equal(chapter.cast.residents.length, 3);
    const castNames = [chapter.cast.guide, ...chapter.cast.residents].map(friend => friend.name);
    assert.equal(new Set(castNames).size, castNames.length, `${chapter.id} repeats a cast member`);
    assert.ok(chapter.finale.action.length > 30);
    assert.ok(chapter.finale.consequence.length > 30);
    assert.equal(chapterFinaleForStop(chapter.stopIds[0]), null);
    assert.equal(chapterFinaleForStop(chapter.stopIds.at(-1))?.cue, chapter.finale.cue);
  });
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.finale.cue)).size, 8);
  assert.equal(new Set(QUEST_CHAPTERS.map(chapter => chapter.optionalDiscovery.message)).size, 8);
});

test("every chapter's location names belong to its current world and end at its destination", () => {
  for (const chapter of QUEST_CHAPTERS) {
    const chapterStops = chapter.stopIds.map(stopId => QUEST_STOPS.find(stop => stop.id === stopId));
    assert.ok(chapterStops.every(Boolean), `${chapter.id} has a missing curriculum stop`);
    assert.equal(chapterStops.at(-1).name, chapter.destination, `${chapter.id} does not arrive at its declared destination`);
    assert.equal(new Set(chapterStops.map(stop => stop.name)).size, 5, `${chapter.id} repeats a location name`);
  }
  assert.equal(QUEST_STOPS.find(stop => stop.id === "s10")?.name, "The Singing Weir");
  assert.equal(QUEST_STOPS.find(stop => stop.id === "s20")?.name, "The Word Forge");
  assert.equal(QUEST_STOPS.find(stop => stop.id === "s30")?.name, "Thunder Lighthouse");
  assert.equal(QUEST_STOPS.find(stop => stop.id === "s40")?.name, "The First Reading Star");
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
