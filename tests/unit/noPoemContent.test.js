import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { elSkillsBlockCycles, EL_LEARN_SECTION_IDS } from "../../src/data/elSkillsBlockCycles.js";
import { stationsForCycle, buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { buildCyclePracticePlan } from "../../src/components/cycle-practice/cyclePracticeContent.js";
import { buildCyclePresentation, PRESENTATION_DAYS, presentationCycleSummary } from "../../src/utils/present/presentationBuilder.js";
import { availableWorksheetTypes, buildWorksheetDocument } from "../../src/utils/worksheets/worksheetBuilder.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { listV3PublishedSkillIds } from "../../src/data/v3/v3Registry.js";
import { selectAssessmentRoundCandidate } from "../../src/data/assessmentRoundSelector.js";
import { getLedaProductionAudioPath } from "../../src/data/ledaProductionAudio.js";

const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const poemContent = /\bpoems?\b|\bpoetry\b|poemAndChant/i;

test("all 27 cycles exclude verse and its questions from every student station and check", () => {
  assert.equal(cycles.length, 27);
  assert.doesNotMatch(JSON.stringify(EL_LEARN_SECTION_IDS), poemContent);
  for (const cycle of cycles) {
    assert.doesNotMatch(JSON.stringify(cycle), poemContent, cycle.id);
    const stations = stationsForCycle(cycle);
    assert.ok(stations.length > 0, cycle.id);
    for (const station of stations) {
      assert.doesNotMatch(JSON.stringify(station), poemContent, `${cycle.id}: ${station.id}`);
      const rounds = buildStationRounds(cycle, station.id, { seed: `no-verse:${cycle.id}:${station.id}` });
      assert.ok(rounds.length > 0);
      assert.doesNotMatch(JSON.stringify(rounds), poemContent, `${cycle.id}: ${station.id}`);
    }
    for (const check of [false, true]) {
      const plan = buildCyclePracticePlan(cycle, `no-verse:${cycle.id}`, 0, check);
      assert.ok(plan.rounds.length > 0, `${cycle.id}: ${check ? "check" : "practice"}`);
      assert.doesNotMatch(JSON.stringify(plan), poemContent, cycle.id);
    }
  }
});

test("all whole-cycle and daily presentations and all worksheet recipes exclude poems", () => {
  for (const cycle of cycles) {
    assert.doesNotMatch(presentationCycleSummary(cycle.id), poemContent);
    for (const day of PRESENTATION_DAYS) {
      const presentation = buildCyclePresentation(cycle.id, { day: day.value });
      assert.ok(presentation.slideCount > 0);
      assert.doesNotMatch(JSON.stringify(presentation), poemContent, `${cycle.id}: ${day.value || "whole"}`);
    }
    for (const type of availableWorksheetTypes(cycle)) {
      const worksheet = buildWorksheetDocument({ cycleId: cycle.id, type, pages: 6 });
      assert.doesNotMatch(worksheet.html, poemContent, `${cycle.id}: ${type}`);
    }
  }
});

test("legacy station links resolve only to the current pictured compound-word game", () => {
  for (const cycle of cycles) {
    const oldLink = buildStationRounds(cycle, "poem", { seed: `legacy:${cycle.id}` });
    const currentLink = buildStationRounds(cycle, "compound", { seed: `legacy:${cycle.id}` });
    assert.deepEqual(oldLink, currentLink);
    assert.ok(oldLink.every(round => round.mechanicId === "compoundPicture"));
    assert.doesNotMatch(JSON.stringify(oldLink), poemContent);
  }
});

test("all published assessment banks and their selected rounds exclude poem questions", async () => {
  const skillIds = listV3PublishedSkillIds();
  assert.equal(skillIds.length, 30);
  for (const skillId of skillIds) {
    const bank = await loadAssessmentSkillBank(skillId);
    assert.ok(bank.length > 0, skillId);
    assert.doesNotMatch(JSON.stringify(bank), poemContent, skillId);
    for (const level of [1, 2]) {
      const selected = [];
      const pool = bank.filter(question => question.level === level);
      for (let index = 0; index < Math.min(12, pool.length); index += 1) {
        const { question } = selectAssessmentRoundCandidate(pool, { selectedQuestions: selected, skillId, roundLength: 12 });
        if (!question) break;
        assert.doesNotMatch(JSON.stringify(question), poemContent, `${skillId}: level ${level}`);
        selected.push(question);
      }
      assert.ok(selected.length > 0, `${skillId}: level ${level} is selectable`);
    }
  }
});

test("the corrected book-fair answer uses an existing exact recording", () => {
  assert.equal(getLedaProductionAudioPath("a poetry competition was judged"), "");
  const audio = getLedaProductionAudioPath("the fair sold out of tickets early");
  assert.ok(audio);
  assert.ok(existsSync(new URL(`../../public${audio}`, import.meta.url)));
});
