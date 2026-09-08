import test from "node:test";
import assert from "node:assert/strict";
import { createRacerSimulation, advanceRacerFrame } from "../../src/utils/soundRacerSimulation.js";
import { buildRacerMission, createRacerState, reduceRacerIntent, currentRacerRound } from "../../src/utils/soundRacerMission.js";
function initial() { return { sim: createRacerSimulation(), state: createRacerState(buildRacerMission()) }; }
function run(fps, seconds) { let context = initial(); for (let i = 0; i < fps * seconds; i++) context = advanceRacerFrame(context.sim, context.state, 1000 / fps); return context; }
const act = (state, type, fields = {}) => reduceRacerIntent(state, { type, revision: state.revision, roundId: currentRacerRound(state)?.id, ...fields });
test("fixed-step travel agrees across 30,60,120Hz and stops before grading", () => {
  const frames = [30, 60, 120].map(fps => run(fps, 2));
  for (const result of frames) assert.ok(Math.abs(result.sim.distance - frames[0].sim.distance) < 1e-8);
  for (const fps of [30, 60, 120]) {
    const { sim, state } = run(fps, 10);
    assert.equal(state.phase, "decision");
    assert.equal(sim.distance, currentRacerRound(state).distance);
    assert.equal(sim.speed, 0);
    assert.deepEqual(state.evidence, []);
  }
});
test("stall is bounded, pause freezes, resume discards hidden elapsed even if no paused frame ran", () => {
  let { sim, state } = run(60, 1);
  const before = sim.distance;
  let next = advanceRacerFrame(sim, state, 60000);
  assert.ok(next.sim.distance - before <= 2.5);
  state = act(state, "PAUSE");
  next = advanceRacerFrame(sim, state, 60000);
  assert.equal(next.sim.distance, before);
  state = act(state, "RESUME");
  next = advanceRacerFrame(sim, state, 60000);
  assert.equal(next.sim.distance, before);
});
test("committed route transition advances once and next fork still requires explicit answer", () => {
  let { sim, state } = run(60, 4);
  state = act(state, "SELECT_LANE", { lane: currentRacerRound(state).choices.find(choice => choice.correct).lane });
  state = act(state, "COMMIT");
  const events = [];
  for (let i = 0; i < 600; i++) {
    const result = advanceRacerFrame(sim, state, 1000 / 60);
    sim = result.sim; state = result.state; events.push(...result.events);
  }
  assert.equal(events.filter(event => event.type === "TRANSITION_DONE").length, 1);
  assert.equal(state.index, 1);
  assert.equal(state.phase, "decision");
  assert.equal(state.evidence.length, 1);
  assert.equal(sim.distance, state.mission.rounds[1].distance);
});

test("complete printed mission reaches the finish exactly once without autonomous answers", () => {
  let { sim, state } = initial();
  let transitions = 0;
  for (let frame = 0; frame < 2000 && state.phase !== "finished"; frame++) {
    if (state.phase === "decision") {
      state = act(state, "USE_PRINTED");
      state = act(state, "SELECT_LANE", { lane: currentRacerRound(state).choices.find(choice => choice.correct).lane });
      state = act(state, "COMMIT");
    }
    const result = advanceRacerFrame(sim, state, 50);
    sim = result.sim; state = result.state;
    transitions += result.events.filter(event => event.type === "TRANSITION_DONE").length;
  }
  assert.equal(state.phase, "finished");
  assert.equal(transitions, state.mission.needed);
  assert.equal(sim.distance, state.mission.finishDistance);
  assert.equal(state.evidence.filter(record => record.completed).length, state.mission.needed);
  const after = advanceRacerFrame(sim, state, 60000);
  assert.equal(after.sim.distance, sim.distance);
  assert.equal(after.events.length, 0);
});
