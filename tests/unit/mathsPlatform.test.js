import assert from "node:assert/strict";
import test from "node:test";
import { createManipulativeState, mathsManipulativeReducer, manipulativeTotal, snapshotManipulativeState } from "../../src/maths/manipulatives/mathsManipulatives.js";
import { mathsActivityRecipes, mathsActivityRecipesBySkill } from "../../src/maths/learn/mathsActivityRecipes.js";
import { MATHS_ASSESSMENT_BLUEPRINTS, assessmentOptionsForItem, buildMathsAssessmentRound, classifyMathsResponse, mathsAssessmentBank } from "../../src/maths/assessment/mathsAssessmentBank.js";
import { mathsStories, releasedMathsStories } from "../../src/maths/stories/mathsStoryCatalog.js";
import { createMathsGameSession, evaluateMathsGameRound, mathsGames } from "../../src/maths/games/mathsGames.js";
import { mathsSongs } from "../../src/maths/music/mathsSongs.js";
import { APPROVED_FOUNDATION_SKILL_IDS } from "../../src/maths/curriculum/mathsSkillTree.js";
import { buildMathsClassGroups, buildMathsClassReport, buildMathsLearnerReport } from "../../src/maths/reporting/mathsReporting.js";
import { buildMathsWorksheetTasks } from "../../src/maths/teacher/mathsWorksheetTasks.js";

test("five launch manipulatives have deterministic serialisable state", () => {
  const ids = ["counter_tray", "five_frame", "ten_frame", "number_line", "part_whole"];
  for (const id of ids) assert.equal(snapshotManipulativeState(createManipulativeState(id, { maximum: 10 })), snapshotManipulativeState(createManipulativeState(id, { maximum: 10 })));
  let tray = createManipulativeState("counter_tray", { maximum: 10 });
  tray = mathsManipulativeReducer(tray, { type: "add", groupId: "a" });
  tray = mathsManipulativeReducer(tray, { type: "add", groupId: "b" });
  assert.equal(manipulativeTotal(tray), 2);
  assert.deepEqual(tray.counters.map(counter => counter.groupId), ["a", "b"]);
});

test("manipulative state can restore an earlier serialised snapshot", () => {
  const start = createManipulativeState("number_line", { maximum: 20 });
  const jumped = mathsManipulativeReducer(start, { type: "jump", to: 7 });
  assert.equal(mathsManipulativeReducer(jumped, { type: "restore", state: start }).current, 0);
});

test("all eight approved skills ship five structured activity recipes", () => {
  assert.equal(mathsActivityRecipes.length, 40);
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    assert.equal(mathsActivityRecipesBySkill[skillId].length, 5);
    assert.deepEqual(mathsActivityRecipesBySkill[skillId].map(recipe => recipe.phase), ["retrieve", "model", "guided", "independent", "transfer"]);
  }
});

test("assessment bank has 20 fixed models and variation breadth per released skill", () => {
  assert.equal(mathsAssessmentBank.length, 160);
  assert.deepEqual(new Set(mathsAssessmentBank.map(model => model.blueprintId)), new Set(MATHS_ASSESSMENT_BLUEPRINTS));
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const models = mathsAssessmentBank.filter(model => model.skillId === skillId);
    assert.equal(models.length, 20);
    assert.ok(models.every(model => model.surfaceVariants.length === 4));
    assert.ok(models.every(model => model.representationFamilies.length >= 2));
    const round = buildMathsAssessmentRound({ skillId, seed: "stable-test", length: 6 });
    assert.equal(round.length, 6);
    assert.equal(new Set(round.map(item => item.id)).size, round.length);
    for (const item of round) {
      assert.equal(classifyMathsResponse(item, item.expected).correct, true);
      assert.equal(typeof classifyMathsResponse(item, "").classification, "string");
    }
  }
});

test("assessment rounds balance correct-answer position and bind exact render evidence", () => {
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const round = buildMathsAssessmentRound({ skillId, seed: "position-audit", length: 6 });
    assert.deepEqual(round.map(item => item.answerSlot).sort(), [0, 0, 1, 1, 2, 2]);
    for (const item of round) {
      assert.equal(assessmentOptionsForItem(item).indexOf(item.expected), item.answerSlot);
      assert.equal(item.renderSpec.blueprintId, item.blueprintId);
      assert.equal(item.renderSpec.target, item.values.target);
      assert.equal(item.renderSpec.representation, item.representation);
    }
  }
});

test("number story countable models match their declared totals and curriculum gate", () => {
  assert.equal(mathsStories.length, 4);
  assert.equal(releasedMathsStories.length, 2);
  for (const story of mathsStories) {
    assert.equal(story.pages.length, 8);
    for (const page of story.pages) {
      assert.ok(page.exactText.length > 10);
      if (page.model?.parts?.every(Number.isFinite) && page.model.kind !== "part_whole") assert.equal(page.model.parts.reduce((sum, value) => sum + value, Number(page.model.pool || 0)), page.model.total);
      if (Number.isFinite(page.model?.filled)) assert.ok(page.model.filled <= page.model.capacity);
    }
  }
});

test("four Maths games create eight deterministic, answerable, untimed decisions", () => {
  assert.equal(mathsGames.length, 4);
  for (const game of mathsGames) {
    const one = createMathsGameSession(game.id, "same-seed");
    const two = createMathsGameSession(game.id, "same-seed");
    assert.deepEqual(one.items, two.items);
    assert.equal(one.items.length, 8);
    assert.equal(new Set(one.items.map(item => item.id)).size, 8);
    for (const item of one.items) {
      assert.ok(item.options.includes(item.target));
      assert.equal(evaluateMathsGameRound(item, item.target).correct, true);
    }
  }
});

test("every game assignment generates eight rounds for its exact released skill", () => {
  for (const game of mathsGames) {
    for (const skillId of game.skillIds) {
      const session = createMathsGameSession(game.id, `assigned-${skillId}`, skillId);
      assert.equal(session.items.length, 8);
      assert.ok(session.items.every(item => item.skillId === skillId));
      assert.ok(session.items.every(item => evaluateMathsGameRound(item, item.target).correct));
    }
  }
});

test("three original classroom chants are available without becoming evidence", () => {
  assert.equal(mathsSongs.length, 3);
  assert.ok(mathsSongs.every(song => song.lyrics.length > 100 && song.tempo >= 80));
});

test("reporting discloses basis and never enables Secure before calibration", () => {
  const events = [{ studentId: "s1", skillId: "F-N-PART-10", eventType: "skills_check_response", occurredAt: new Date().toISOString(), evidence: { correct: true, source: "maths_skills_check", representation: "ten_frame" } }];
  const report = buildMathsLearnerReport(events, "s1");
  assert.equal(report.length, 8);
  assert.equal(report.find(row => row.skillId === "F-N-PART-10").eventCount, 1);
  assert.ok(report.every(row => row.secureEnabled === false));
});

test("class reporting keeps Not checked neutral and requires repeated signals for a pattern", () => {
  const students = [{ id: "s1", name: "One" }, { id: "s2", name: "Two" }];
  const events = [0, 1].map(index => ({
    studentId: "s1", skillId: "F-N-PART-10", eventType: "skills_check_response",
    occurredAt: new Date(Date.now() - index * 1000).toISOString(),
    evidence: { correct: false, source: "maths_skills_check", representation: index ? "ten_frame" : "part_whole", observedSignals: ["missing_part_mismatch"] }
  }));
  const classRow = buildMathsClassReport(events, students).find(row => row.skillId === "F-N-PART-10");
  assert.equal(classRow.statusCounts["Not checked"], 1);
  assert.deepEqual(classRow.learnerRows.find(row => row.student.id === "s1").report.possiblePatterns, ["missing_part_mismatch"]);
  const groups = buildMathsClassGroups(events.slice(0, 1), students, "F-N-PART-10");
  assert.deepEqual(groups.notChecked.map(row => row.student.id), ["s2"]);
  assert.equal(groups.reconnect.length, 1);
  assert.deepEqual(buildMathsLearnerReport(events.slice(0, 1), "s1").find(row => row.skillId === "F-N-PART-10").possiblePatterns, []);
});

test("worksheet versions contain real task models with matching answer data", () => {
  for (const template of ["frame", "part", "line", "match"]) {
    const versionA = buildMathsWorksheetTasks({ skillId: "F-N-PART-10", template, version: "A" });
    const versionB = buildMathsWorksheetTasks({ skillId: "F-N-PART-10", template, version: "B" });
    assert.equal(versionA.length, 8);
    assert.equal(versionB.length, 8);
    assert.notDeepEqual(versionA, versionB);
    assert.ok(versionA.every(task => task.kind && task.prompt && task.answer));
  }
});
