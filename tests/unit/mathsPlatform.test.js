import assert from "node:assert/strict";
import test from "node:test";
import { createManipulativeState, mathsManipulativeReducer, manipulativeTotal, snapshotManipulativeState } from "../../src/maths/manipulatives/mathsManipulatives.js";
import { MATHS_LESSON_REPAIR_PROGRESSIONS_BY_SKILL, mathsActivityRecipes, mathsActivityRecipesBySkill, mathsLessonStageFeedback, mathsLessonStageIsReady } from "../../src/maths/learn/mathsActivityRecipes.js";
import { MATHS_ASSESSMENT_BLUEPRINTS, MATHS_ASSESSMENT_CAPABILITIES_BY_SKILL, MATHS_ASSESSMENT_RESPONSE_DIRECTIONS, assessmentOptionsForItem, buildMathsAssessmentRound, classifyMathsResponse, materializeAssessmentItem, mathsAssessmentBank, mathsAssessmentRepairForClassification } from "../../src/maths/assessment/mathsAssessmentBank.js";
import { mathsStories, releasedMathsStories } from "../../src/maths/stories/mathsStoryCatalog.js";
import { createMathsGameSession, evaluateMathsGameRound, mathsGames } from "../../src/maths/games/mathsGames.js";
import { mathsSongs } from "../../src/maths/music/mathsSongs.js";
import { APPROVED_FOUNDATION_SKILL_IDS } from "../../src/maths/curriculum/mathsSkillTree.js";
import { buildMathsClassGroups, buildMathsClassReport, buildMathsLearnerReport } from "../../src/maths/reporting/mathsReporting.js";
import { buildMathsWorksheetTasks } from "../../src/maths/teacher/mathsWorksheetTasks.js";
import { MATHS_PRESENTATION_PROFILES } from "../../src/maths/teacher/mathsTeachingPlans.js";
import { mathsLessonStageChoices } from "../../src/maths/learn/mathsLessonReflections.js";

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

test("every guided lesson recipe carries a graduated, signal-safe repair progression", () => {
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const progression = MATHS_LESSON_REPAIR_PROGRESSIONS_BY_SKILL[skillId];
    assert.equal(progression.steps.length, 3);
    assert.ok(progression.possibleSignal.length > 40);
    assert.ok(progression.steps.every(step => step.length > 40));
    assert.doesNotMatch([progression.possibleSignal, ...progression.steps].join(" "), /master(?:y|ed)|faster|speed score/i);
    for (const recipe of mathsActivityRecipesBySkill[skillId]) {
      assert.equal(recipe.feedbackRules.length, 1);
      assert.equal(recipe.feedbackRules[0].possibleSignal, progression.possibleSignal);
      assert.deepEqual(recipe.feedbackRules[0].steps, progression.steps);
    }
  }

  const empty = createManipulativeState("counter_tray", { maximum: 10 });
  assert.equal(mathsLessonStageFeedback("F-N-COUNT-10", "make", null).repairStep, "Make one deliberate change to the model, then compare it with the challenge.");
  const attempts = [0, 1, 2].map(repairAttempt => mathsLessonStageFeedback("F-N-COUNT-10", "make", empty, "", 1, repairAttempt));
  assert.deepEqual(attempts.map(result => result.repairStep), MATHS_LESSON_REPAIR_PROGRESSIONS_BY_SKILL["F-N-COUNT-10"].steps);
  const seven = { ...empty, counters: Array.from({ length: 7 }, (_, index) => ({ id: `counter-${index + 1}`, groupId: "a" })) };
  assert.equal(mathsLessonStageFeedback("F-N-COUNT-10", "make", seven, "", 7).ready, true);
});

test("guided lesson reflection cannot replace the required mathematical model", () => {
  const emptyTen = createManipulativeState("ten_frame", { maximum: 10 });
  assert.equal(mathsLessonStageIsReady("F-N-PART-10", "retrieve", emptyTen, "I noticed a whole", 1), false);
  const fiveAndFive = {
    ...emptyTen,
    cells: ["part_a", "part_a", "part_a", "part_a", "part_a", "part_b", "part_b", "part_b", "part_b", "part_b"]
  };
  assert.equal(mathsLessonStageIsReady("F-N-PART-10", "retrieve", fiveAndFive, "I noticed a whole", 10), true);
  const tenAndZero = { ...emptyTen, cells: Array(10).fill("part_a") };
  assert.equal(mathsLessonStageIsReady("F-N-PART-10", "retrieve", tenAndZero, "I noticed a whole", 10), false);

  const sixAndFour = { ...emptyTen, cells: [...Array(6).fill("part_a"), ...Array(4).fill("part_b")] };
  assert.equal(mathsLessonStageIsReady("F-N-PART-10", "make", sixAndFour), true);
  assert.equal(mathsLessonStageIsReady("F-N-PART-10", "explain", sixAndFour, "I can point to the parts"), true);
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
  for (const skillId of ["F-N-COUNT-10", "F-N-COUNT-20", "F-N-MATCH"]) {
    const models = mathsAssessmentBank.filter(model => model.skillId === skillId);
    assert.equal(new Set(models.map(model => model.blueprintId)).size, 2);
    assert.equal(new Set(buildMathsAssessmentRound({ skillId, seed: "direction-check", length: 6 }).map(item => item.blueprintId)).size, 2);
  }
});

test("assessment capabilities never claim an interaction direction the renderer does not provide", () => {
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const capability = MATHS_ASSESSMENT_CAPABILITIES_BY_SKILL[skillId];
    const actual = [...new Set(mathsAssessmentBank.filter(model => model.skillId === skillId).map(model => model.responseDirection))].sort();
    assert.deepEqual(actual, [...capability.supportedDirections].sort(), skillId);
    assert.deepEqual(
      [...capability.supportedDirections, ...capability.unsupportedDirections].sort(),
      [...MATHS_ASSESSMENT_RESPONSE_DIRECTIONS].sort(),
      skillId
    );
    assert.ok(capability.unsupportedDirections.every(direction => !actual.includes(direction)), skillId);
    assert.deepEqual(capability.unsupportedDirections, [], `${skillId} must not falsely omit a released direction`);
  }
  assert.ok(mathsAssessmentBank.filter(model => model.responseDirection === "construction" && model.blueprintId === "number_sequence").every(model => model.interactionType === "construct_missing_numeral"));
  assert.ok(mathsAssessmentBank.filter(model => model.responseDirection === "construction" && model.blueprintId === "quick_quantity").every(model => model.interactionType === "reconstruct_quantity"));
  assert.ok(mathsAssessmentBank.filter(model => model.responseDirection === "construction" && model.blueprintId === "compare_quantities").every(model => model.interactionType === "pair_then_compare"));
  assert.ok(mathsAssessmentBank.filter(model => model.responseDirection === "recognition" && model.blueprintId === "part_whole").every(model => model.interactionType === "recognise_missing_part"));
});

test("every six-decision round deliberately balances directions, representations and transfer", () => {
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const capability = MATHS_ASSESSMENT_CAPABILITIES_BY_SKILL[skillId];
    for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
      const input = { skillId, seed: `breadth-${seedIndex}`, length: 6 };
      const round = buildMathsAssessmentRound(input);
      assert.deepEqual(round, buildMathsAssessmentRound(input), `${skillId} must reconstruct deterministically`);
      assert.deepEqual([...new Set(round.map(item => item.responseDirection))].sort(), [...capability.supportedDirections].sort(), skillId);
      assert.ok(round.some(item => item.evidencePurpose === "transfer"), `${skillId} needs transfer evidence`);
      for (const responseDirection of capability.supportedDirections) {
        const items = round.filter(item => item.responseDirection === responseDirection);
        assert.ok(new Set(items.map(item => item.representation)).size >= 2, `${skillId}:${responseDirection} needs two rendered representations`);
      }
      if (capability.supportedDirections.length === 2) {
        assert.ok(round.some(item => item.evidencePurpose === "recognition"), `${skillId} needs direct recognition evidence`);
        assert.ok(round.some(item => item.evidencePurpose === "construction"), `${skillId} needs direct construction evidence`);
      }
    }
  }
});

test("authored assessment models are answer-safe, plausible and repairable", () => {
  assert.equal(new Set(mathsAssessmentBank.map(model => model.id)).size, 160);
  assert.equal(mathsAssessmentBank[0].id, "f-n-seq-20-number_sequence-01");
  assert.equal(mathsAssessmentBank.at(-1).id, "f-n-part-10-part_whole-20");
  for (const model of mathsAssessmentBank) {
    assert.equal(model.feedbackPolicy, "deferred_teacher_review");
    assert.ok(model.repairProgressions.length >= 2);
    assert.ok(model.repairProgressions.every(progression => progression.steps.length === 3));
    assert.equal(new Set(model.distractors).size, model.distractors.length);
    assert.ok(model.distractors.every(value => Number.isInteger(value) && value >= 0 && value <= model.values.maximum && value !== model.expected));
    for (let variantIndex = 0; variantIndex < model.surfaceVariants.length; variantIndex += 1) {
      const item = materializeAssessmentItem(model, variantIndex);
      if (item.responseDirection === "recognition" && item.blueprintId !== "part_whole" && typeof item.expected === "number") {
        const visibleNumbers = (item.promptText.match(/\b\d+\b/g) || []).map(Number);
        assert.ok(!visibleNumbers.includes(item.expected), `${item.itemKey} prompt discloses its answer`);
      }
      if (item.responseDirection === "recognition" && item.blueprintId === "part_whole") {
        assert.match(item.promptText, /Which missing part/);
        assert.doesNotMatch(item.promptText, /missing part (?:is|equals)\s+\d+/i);
      }
    }
  }
  for (const classification of ["off_by_one_response", "sequence_choice_mismatch", "comparison_choice_mismatch", "missing_part_mismatch", "other_incorrect_response"]) {
    const progression = mathsAssessmentRepairForClassification(classification);
    assert.equal(progression.steps.length, 3);
    assert.match(progression.possibleSignal, /response|chosen|selected|constructed/i);
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
      assert.equal(item.renderSpec.responseDirection, item.responseDirection);
      assert.equal(item.renderSpec.evidencePurpose, item.evidencePurpose);
    }
  }
});

test("not sure stays neutral even when the expected numeric answer is zero", () => {
  const item = { expected: 0, blueprintId: "part_whole" };
  assert.deepEqual(classifyMathsResponse(item, null), {
    correct: false,
    classification: "not_checked",
    observedSignals: [],
    misconceptionCodes: []
  });
});

test("number story countable models match their declared totals and curriculum gate", () => {
  assert.equal(mathsStories.length, 8);
  assert.equal(releasedMathsStories.length, 6);
  for (const story of mathsStories) {
    assert.equal(story.pages.length, 8);
    for (const page of story.pages) {
      assert.ok(page.exactText.length > 10);
      if (page.model?.parts?.every(Number.isFinite) && page.model.kind !== "part_whole") assert.equal(page.model.parts.reduce((sum, value) => sum + value, Number(page.model.pool || 0)), page.model.total);
      if (Number.isFinite(page.model?.filled)) assert.ok(page.model.filled <= page.model.capacity);
    }
  }
});

test("five Maths games create eight deterministic, answerable, untimed decisions", () => {
  assert.equal(mathsGames.length, 5);
  for (const game of mathsGames) {
    const one = createMathsGameSession(game.id, "same-seed");
    const two = createMathsGameSession(game.id, "same-seed");
    assert.deepEqual(one.items, two.items);
    assert.equal(one.items.length, 8);
    assert.equal(new Set(one.items.map(item => item.id)).size, 8);
    for (const item of one.items) {
      assert.ok(item.options.includes(item.target));
      assert.equal(evaluateMathsGameRound(item, item.target).correct, true);
      assert.ok(item.options.some(option => !evaluateMathsGameRound(item, option).correct));
    }
  }
});

test("every released Foundation skill has an exact-mechanic Arcade game and spoken guidance", () => {
  const covered = new Set(mathsGames.flatMap(game => game.skillIds));
  assert.deepEqual(covered, new Set(APPROVED_FOUNDATION_SKILL_IDS));
  assert.ok(mathsGames.every(game => game.instructionText.length > 45 && game.successText.length > 35 && game.repairText.length > 35));
});

test("Frame Foundry keeps its declared whole invariant while only the parts change", () => {
  const session = createMathsGameSession("frame-foundry", "whole-invariant");
  for (const round of session.items) {
    const expectedWhole = round.skillId === "F-N-PART-5" ? 5 : 10;
    assert.equal(round.model.target, expectedWhole);
    assert.equal(round.model.capacity, expectedWhole);
    assert.equal(round.model.shown + round.target, expectedWhole);
  }
});

test("Arcade rounds never reveal or visually preselect an answer", () => {
  const carry = createMathsGameSession("count-and-carry", "semantic-audit");
  for (const item of carry.items) {
    assert.doesNotMatch(item.prompt, new RegExp(`\\b${item.target}\\b`));
    assert.equal(item.options.length, 3);
    assert.ok(item.options.every(option => option >= 1 && option <= (item.skillId === "F-N-COUNT-20" ? 20 : 10)));
  }
  const trail = createMathsGameSession("number-trail", "semantic-audit");
  assert.ok(trail.items.every(item => item.model.sequence.filter(value => value === null).length === 1));
  assert.ok(trail.items.every(item => item.model.sequence.includes(item.target) === false));
  assert.ok(trail.items.every(item => item.model.sequence.filter(value => value !== null).every(value => value >= 0 && value <= 20)));
  const reachableTrailTargets = new Set(Array.from({ length: 100 }, (_, seedIndex) => (
    createMathsGameSession("number-trail", `reachability-${seedIndex}`).items.map(item => item.target)
  )).flat());
  assert.deepEqual([...reachableTrailTargets].sort((left, right) => left - right), Array.from({ length: 20 }, (_, index) => index + 1));
});

test("Arcade feedback explains the mathematical structure for every mechanic", () => {
  for (const game of mathsGames) {
    const session = createMathsGameSession(game.id, "feedback-audit");
    for (const item of session.items) {
      const correct = evaluateMathsGameRound(item, item.target);
      const wrongOption = item.options.find(option => option !== item.target);
      const incorrect = evaluateMathsGameRound(item, wrongOption);
      assert.equal(correct.correct, true);
      assert.equal(incorrect.correct, false);
      assert.doesNotMatch(correct.feedbackText, /^That matches the maths\.$/);
      assert.doesNotMatch(incorrect.feedbackText, /^The model does not match yet\./);
      assert.ok(correct.feedbackText.length >= 40);
      assert.ok(incorrect.feedbackText.length >= 40);
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

test("eight original classroom chants cover every released Foundation skill without becoming evidence", () => {
  assert.equal(mathsSongs.length, 8);
  assert.ok(mathsSongs.every(song => song.lyrics.length > 100 && song.tempo >= 80));
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) assert.ok(mathsSongs.some(song => song.skillIds.includes(skillId)), `${skillId} needs a chant`);
});

test("reporting discloses basis and never enables Secure before calibration", () => {
  const events = [{ studentId: "s1", skillId: "F-N-PART-10", eventType: "skills_check_response", occurredAt: new Date().toISOString(), evidence: { correct: true, source: "maths_skills_check", representation: "ten_frame" } }];
  const report = buildMathsLearnerReport(events, "s1");
  assert.equal(report.length, 8);
  assert.equal(report.find(row => row.skillId === "F-N-PART-10").eventCount, 1);
  assert.equal(report.find(row => row.skillId === "F-N-PART-10").status, "Correct on checked items");
  assert.equal(report.find(row => row.skillId === "F-N-PART-10").direction, "Single check");
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

test("reporting does not treat the same authored item repeated across sessions as a stable pattern", () => {
  const students = [{ id: "s1", name: "One" }];
  const events = ["session-a", "session-b"].map((sessionId, index) => ({
    id: `event-${index}`,
    studentId: "s1", skillId: "F-N-PART-10", eventType: "skills_check_response",
    occurredAt: new Date(Date.now() + index * 1000).toISOString(),
    evidence: { sessionId, itemKey: "same-item:v1", correct: false, source: "maths_skills_check", representation: "ten_frame", observedSignals: ["missing_part_mismatch"] }
  }));
  const report = buildMathsLearnerReport(events, "s1").find(row => row.skillId === "F-N-PART-10");
  assert.deepEqual(report.possiblePatterns, []);
  const groups = buildMathsClassGroups([{ ...events[0], evidence: { ...events[0].evidence, correct: true, observedSignals: [] } }], students, "F-N-PART-10");
  assert.equal(groups.extend.length, 0);
});

test("reporting separates current indication from older history and extension needs independent varied evidence", () => {
  const student = { id: "s1", name: "One" };
  const event = (sessionId, correct, representation, source, daysAgo) => ({
    id: sessionId,
    studentId: "s1",
    skillId: "F-N-PART-10",
    eventType: "skills_check_response",
    occurredAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    evidence: { sessionId, itemKey: sessionId, correct, source, representation, observedSignals: correct ? [] : ["missing_part_mismatch"] }
  });
  const recovered = [
    event("old", false, "ten_frame", "maths_skills_check", 20),
    event("recent-a", true, "ten_frame", "small_group_exit", 3),
    event("recent-b", true, "part_whole", "small_group_exit", 2),
    event("recent-c", true, "two_colour_frame", "maths_skills_check", 1)
  ];
  const report = buildMathsLearnerReport(recovered, "s1").find(row => row.skillId === "F-N-PART-10");
  assert.equal(report.status, "Correct on checked items");
  assert.equal(report.direction, "Improving — recent checks were correct");
  assert.equal(report.independentOccasionCount, 3);
  assert.deepEqual(report.possiblePatterns, []);
  assert.equal(buildMathsClassGroups(recovered, [student], "F-N-PART-10").extend.length, 1);

  const oneOccasion = recovered.slice(1).map((row, index) => ({ ...row, id: `same-${index}`, evidence: { ...row.evidence, sessionId: "same-session" } }));
  assert.equal(buildMathsClassGroups(oneOccasion, [student], "F-N-PART-10").extend.length, 0);
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

test("part-whole worksheets keep five or ten invariant across every template, level and version", () => {
  for (const [skillId, whole] of [["F-N-PART-5", 5], ["F-N-PART-10", 10]]) {
    for (const template of ["frame", "part", "cut_build"]) {
      for (const level of ["support", "core", "extend"]) {
        for (const version of ["A", "B"]) {
          const tasks = buildMathsWorksheetTasks({ skillId, template, level, version });
          assert.ok(tasks.every(task => task.whole === whole || task.value === whole));
          assert.ok(tasks.every(task => {
            if (task.kind === "part_whole") return task.known + Number(task.answer.split(";")[0]) === whole;
            if (task.kind === "split_frame") return task.partA + task.partB === whole && task.capacity === whole;
            if (task.kind === "cut_build") return task.cards.reduce((sum, value) => sum + value, 0) === whole;
            return false;
          }));
          if (level === "support") assert.ok(tasks.every(task => task.workedCue));
          if (level === "extend") assert.ok(tasks.every(task => task.explain));
        }
      }
    }
  }
});

test("presentation claims do not leak truth through parity and part-whole talks keep a fixed whole", () => {
  for (const [skillId, profile] of Object.entries(MATHS_PRESENTATION_PROFILES)) {
    const rows = Array.from({ length: profile.maximum - profile.minimum + 1 }, (_, index) => profile.minimum + index)
      .map(value => ({ value, ...profile.trueFalse(value) }));
    assert.ok(rows.some(row => row.answer));
    assert.ok(rows.some(row => !row.answer));
    assert.ok(rows.some(row => row.value % 2 === 0 && row.answer));
    assert.ok(rows.some(row => row.value % 2 === 0 && !row.answer));
    assert.ok(rows.some(row => row.value % 2 === 1 && row.answer));
    assert.ok(rows.some(row => row.value % 2 === 1 && !row.answer));
    assert.ok(rows.every(row => row.proofPrompt.length > 20), skillId);
  }
  assert.equal(MATHS_PRESENTATION_PROFILES["F-N-PART-5"].fixedWhole, 5);
  assert.equal(MATHS_PRESENTATION_PROFILES["F-N-PART-10"].fixedWhole, 10);
});

test("lesson reflection choices name the exact mathematical thinking for every skill", () => {
  for (const skillId of APPROVED_FOUNDATION_SKILL_IDS) {
    const allChoices = ["retrieve", "notice", "model", "explain"].flatMap(stage => mathsLessonStageChoices(skillId, stage));
    assert.equal(allChoices.length, 8);
    assert.equal(new Set(allChoices).size, 8);
    assert.ok(allChoices.every(choice => choice.length >= 22));
  }
  assert.match(mathsLessonStageChoices("F-N-PART-10", "notice")[0], /complementary parts/);
  assert.match(mathsLessonStageChoices("F-N-COMPARE", "explain")[1], /more, fewer or same/);
});
