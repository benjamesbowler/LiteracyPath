import test from "node:test";
import assert from "node:assert/strict";
import { buildRacerMission, createRacerState, currentRacerRound, reduceRacerIntent, racerEvidence } from "../../src/utils/soundRacerMission.js";
import { buildTrack, soundRacerLadder } from "../../src/utils/soundRacerTracks.js";
import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";
import { sharesSound, onsetGrapheme } from "../../src/components/elQuest/elQuestEngine.js";
const act = (state, type, fields = {}) => reduceRacerIntent(state, { type, revision: state.revision, roundId: currentRacerRound(state)?.id, ...fields });
function heard(state, cueId = "cue") { return act(act(state, "CUE_REQUEST", { cueId }), "CUE_RESULT", { cueId, status: "delivered" }); }
function choose(state, correct) { return act(state, "SELECT_LANE", { lane: currentRacerRound(state).choices.find(choice => choice.correct === correct).lane }); }

test("every curriculum track and seeded mission preserves exact eligible quota and sound-distinct forks", () => {
  const missionIds = new Set();
  for (const difficulty of ["easy", "medium", "hard", "low", "mid", "high"]) {
    assert.equal(soundRacerLadder(difficulty).length, 10);
    for (let trackIndex = 0; trackIndex < 10; trackIndex++) for (const seed of [0, 1, 27, "classroom-replay"]) {
      const mission = buildRacerMission({ difficulty, trackIndex, seed });
      assert.deepEqual(buildRacerMission({ difficulty, trackIndex, seed }), mission);
      assert.equal(mission.rounds.length, buildTrack(mission.target, { difficulty, seed }).needed);
      assert.ok(!missionIds.has(mission.id)); missionIds.add(mission.id);
      const ids = new Set();
      for (const round of mission.rounds) {
        assert.equal(round.choices.length, 3);
        assert.equal(new Set(round.choices.map(choice => choice.word)).size, 3);
        assert.equal(round.choices.filter(choice => choice.correct).length, 1);
        for (const choice of round.choices) {
          assert.equal(ids.has(choice.id), false); ids.add(choice.id);
          if (choice.correct) assert.equal(wordStartsWithTargetSound(choice.word, mission.target), true);
          else assert.equal(sharesSound(onsetGrapheme(choice.word), mission.target), false);
        }
      }
    }
  }
});
test("only explicit commitment records first response; duplicate callbacks cannot rescore", () => {
  let state = createRacerState(buildRacerMission());
  state = choose(state, true);
  assert.equal(act(state, "COMMIT"), state);
  state = act(state, "ARRIVE");
  state = heard(state);
  const before = state;
  state = act(state, "COMMIT");
  assert.equal(before.evidence.length, 0);
  assert.equal(state.evidence.length, 1);
  assert.equal(state.evidence[0].firstResponse.independent, true);
  assert.equal(act(state, "COMMIT"), state);
  assert.equal(act(state, "CUE_RESULT", { cueId: "cue", status: "unavailable" }), state);
  assert.equal(act(state, "SELECT_LANE", { lane: 0 }), state);
});
test("wrong first response survives supported retry and eventual success", () => {
  let state = heard(act(createRacerState(buildRacerMission()), "ARRIVE"));
  state = act(choose(state, false), "COMMIT");
  const original = structuredClone(state.evidence[0].firstResponse);
  assert.equal(state.phase, "retry");
  assert.equal(act(state, "COMMIT"), state);
  state = act(choose(act(state, "RETRY"), true), "COMMIT");
  assert.equal(state.phase, "transition");
  assert.deepEqual(state.evidence[0].firstResponse, original);
  assert.equal(state.evidence[0].completionKind, "supported");
  assert.equal(state.evidence[0].attempts, 2);
  assert.equal(racerEvidence(state).firstIndependentIncorrect, 1);
  assert.equal(racerEvidence(state).firstIndependentCorrect, 0);
  assert.equal(racerEvidence(state).completedPractice, 1);
});
test("stale session, round, cue ownership and paused inputs fail closed", () => {
  let state = act(createRacerState(buildRacerMission(), { revision: "session-b" }), "ARRIVE");
  state = act(state, "CUE_REQUEST", { cueId: "old" });
  state = act(state, "CUE_REQUEST", { cueId: "current" });
  assert.equal(act(state, "CUE_REQUEST", { cueId: "old" }), state);
  assert.equal(act(state, "CUE_REQUEST", { cueId: "current" }), state);
  for (const fields of [{ cueId: "old" }, { cueId: "current", revision: "session-a" }, { cueId: "current", roundId: "previous" }])
    assert.equal(act(state, "CUE_RESULT", { status: "delivered", ...fields }), state);
  state = act(state, "PAUSE");
  assert.equal(act(state, "SELECT_LANE", { lane: 0 }), state);
  assert.equal(act(state, "COMMIT"), state);
  assert.equal(act(state, "CUE_RESULT", { cueId: "current", status: "delivered" }), state);
  state = act(state, "RESUME");
  assert.equal(act(state, "CUE_RESULT", { cueId: "current", status: "delivered" }), state);
});
test("unavailable, pending and printed cues remain playable without independent sound claims", () => {
  for (const mode of ["pending", "unavailable", "interrupted", "printed"]) {
    let state = act(createRacerState(buildRacerMission()), "ARRIVE");
    if (mode === "printed") state = act(state, "USE_PRINTED");
    else if (mode !== "pending") state = act(act(state, "CUE_REQUEST", { cueId: mode }), "CUE_RESULT", { cueId: mode, status: mode });
    state = act(choose(state, true), "COMMIT");
    assert.equal(state.phase, "transition");
    assert.equal(racerEvidence(state).firstIndependentCorrect, 0);
    assert.equal(racerEvidence(state).unscoredFirstResponses, 1);
    assert.equal(racerEvidence(state).independentSoundAccuracy, null);
    assert.equal(racerEvidence(state).firstChoiceCorrect, 1);
    assert.equal(racerEvidence(state).stars, 3);
    assert.equal(state.evidence[0].firstResponse.construct, "printed_onset_word_matching");
  }
});
test("all forks finish exactly once; stale previous-fork commits cannot alter next fork", () => {
  let state = createRacerState(buildRacerMission());
  while (state.phase !== "finished") {
    state = act(state, "ARRIVE");
    const oldId = currentRacerRound(state).id;
    state = act(choose(heard(state, oldId), true), "COMMIT");
    state = act(state, "TRANSITION_DONE");
    assert.equal(act(state, "COMMIT", { roundId: oldId }), state);
  }
  assert.equal(state.evidence.length, state.mission.needed);
  assert.equal(racerEvidence(state).firstIndependentCorrect, state.mission.needed);
  assert.equal(racerEvidence(state).stars, 3);
  assert.equal(act(state, "TRANSITION_DONE"), state);
});
