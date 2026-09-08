import { buildTrack, soundRacerLadder, buildSoundRacerEvidenceResult } from "./soundRacerTracks.js";
import { wordStartsWithTargetSound, wordsStartingWithTargetSound } from "./rocketRunRounds.js";
import { getChildAudioPath } from "../data/childAssets.js";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";
import { onsetGrapheme, sharesSound } from "../components/elQuest/elQuestEngine.js";
import { RACER_FORK_SPACING } from "./soundRacerRoute.js";

export const SOUND_RACER_MISSION_VERSION = "sound-racer-authored-v1";
function hash(text) {
  let value = 2166136261;
  for (const letter of String(text)) value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
  return value >>> 0;
}
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function buildRacerMission({ difficulty = "easy", trackIndex = 0, seed = trackIndex } = {}) {
  const ladder = soundRacerLadder(difficulty);
  if (!Number.isInteger(trackIndex) || trackIndex < 0 || trackIndex >= ladder.length) throw new Error("Invalid Sound Racer track index");
  const target = ladder[trackIndex];
  const track = buildTrack(target, { difficulty, seed });
  const correct = [...new Set(track.gates.filter(gate => gate.kind === "word" && gate.correct && wordStartsWithTargetSound(gate.word, target)).map(gate => gate.word))];
  const alternatives = [...new Set(track.gates.filter(gate => gate.kind === "word" && !gate.correct && !sharesSound(onsetGrapheme(gate.word), target)).map(gate => gate.word))];
  if (correct.length !== track.needed || !correct.length || alternatives.length < 2) throw new Error("Sound Racer track cannot supply a complete three-choice mission");
  const exampleWord = [...correct, ...wordsStartingWithTargetSound(target)]
    .find(word => AUDIO_FILE_PATHS.has(getChildAudioPath(word)));
  if (!exampleWord) throw new Error(`Sound Racer has no recorded example for ${target}`);
  const id = `sound-racer:${difficulty}:${trackIndex}:${hash(seed).toString(36)}`;
  const rounds = correct.map((word, index) => {
    const roundId = `${id}:fork:${index}`;
    const offset = hash(`${seed}:${index}:alternatives`) % alternatives.length;
    const words = [word, alternatives[offset], alternatives[(offset + 1) % alternatives.length]];
    const correctLane = hash(`${seed}:${target}:${index}:lane`) % 3;
    const choices = Array.from({ length: 3 }, (_, lane) => {
      const candidate = words[(lane - correctLane + 3) % 3];
      return { id: `${roundId}:lane:${lane}`, lane, word: candidate, correct: candidate === word, onset: onsetGrapheme(candidate) };
    });
    return { id: roundId, index, target, distance: RACER_FORK_SPACING * (index + 1), correctWord: word, choices };
  });
  return freeze({ id, contentVersion: SOUND_RACER_MISSION_VERSION, difficulty, trackIndex, trackCount: ladder.length,
    target, seed, exampleWord, rounds, needed: track.needed, finishDistance: rounds.at(-1).distance + 14 });
}
export function currentRacerRound(state) { return state.mission.rounds[state.index] || null; }
export function createRacerState(mission, { revision = 1 } = {}) {
  return { mission, missionId: mission.id, revision, phase: "approach", index: 0, lane: 1,
    selectedChoiceId: null, evidence: [], feedback: null, lastResponse: null, firstResponse: null,
    supportUsed: [], cue: { id: null, status: "pending" }, paused: false, clockEpoch: 0, usedCueIds: [] };
}
const CUE_PHASES = new Set(["approach", "decision", "retry"]);
// Every intent belongs to the current owner. Round-specific intents additionally
// require the exact roundId, so a prior audio/transition callback cannot leak.
export function reduceRacerIntent(state, intent) {
  if (!intent || intent.revision !== state.revision || (intent.missionId && intent.missionId !== state.missionId)) return state;
  if (intent.type === "PAUSE") return state.paused ? state : { ...state, paused: true, clockEpoch: state.clockEpoch + 1, cue: { id: null, status: "interrupted" } };
  if (intent.type === "RESUME") return state.paused ? { ...state, paused: false, clockEpoch: state.clockEpoch + 1 } : state;
  if (state.paused || state.phase === "finished") return state;
  const round = currentRacerRound(state);
  if (!round || intent.roundId !== round.id) return state;
  switch (intent.type) {
    case "SELECT_LANE": {
      if (!["approach", "decision"].includes(state.phase) || !Number.isInteger(intent.lane) || intent.lane < 0 || intent.lane > 2) return state;
      return { ...state, lane: intent.lane, selectedChoiceId: round.choices[intent.lane].id };
    }
    case "ARRIVE": return state.phase === "approach" ? { ...state, phase: "decision" } : state;
    case "CUE_REQUEST": {
      if (!CUE_PHASES.has(state.phase) || typeof intent.cueId !== "string" || !intent.cueId || state.usedCueIds.includes(intent.cueId)) return state;
      return { ...state, usedCueIds: [...state.usedCueIds, intent.cueId], cue: { id: intent.cueId, status: "pending" } };
    }
    case "CUE_RESULT": {
      if (!CUE_PHASES.has(state.phase) || !state.cue.id || intent.cueId !== state.cue.id
        || state.cue.status !== "pending" || !["delivered", "unavailable", "interrupted"].includes(intent.status)) return state;
      return { ...state, cue: { id: intent.cueId, status: intent.status } };
    }
    case "USE_PRINTED": return CUE_PHASES.has(state.phase) ? { ...state, cue: { id: null, status: "not_required" },
      supportUsed: [...new Set([...state.supportUsed, "printed_target"])] } : state;
    case "REQUEST_HELP": return CUE_PHASES.has(state.phase) ? { ...state,
      supportUsed: [...new Set([...state.supportUsed, "requested_help"])] } : state;
    case "RETRY": return state.phase === "retry" ? { ...state, phase: "decision", selectedChoiceId: null,
      supportUsed: [...new Set([...state.supportUsed, "previous_response"])] } : state;
    case "COMMIT": {
      if (state.phase !== "decision" || !state.selectedChoiceId) return state;
      const choice = round.choices.find(candidate => candidate.id === state.selectedChoiceId);
      if (!choice) return state;
      const previous = state.evidence.find(record => record.roundId === round.id);
      const response = freeze({ id: `${state.revision}:${round.id}:response:${(previous?.attempts || 0) + 1}`, roundId: round.id, choiceId: choice.id, word: choice.word, correct: choice.correct,
        independent: !previous && state.cue.status === "delivered" && state.supportUsed.length === 0,
        audioDelivery: state.cue.status,
        construct: state.cue.status === "delivered" ? "initial_sound_word_classification" : "printed_onset_word_matching",
        supportUsed: [...new Set([...state.supportUsed, ...(state.cue.status === "delivered" ? [] : [state.cue.status === "not_required" ? "printed_target" : `audio_${state.cue.status}`])])] });
      const record = { roundId: round.id, target: round.target, itemKey: round.correctWord,
        firstResponse: previous?.firstResponse || response, lastResponse: response,
        attempts: (previous?.attempts || 0) + 1,
        supportUsed: [...new Set([...(previous?.supportUsed || []), ...response.supportUsed])],
        completed: choice.correct, completionKind: choice.correct ? (response.independent ? "independent" : "supported") : "incomplete" };
      const evidence = previous ? state.evidence.map(item => item.roundId === round.id ? record : item) : [...state.evidence, record];
      return { ...state, evidence, phase: choice.correct ? "transition" : "retry", lastResponse: response,
        firstResponse: record.firstResponse,
        feedback: { kind: choice.correct ? "correct" : "incorrect", word: choice.word, onset: choice.onset, target: round.target } };
    }
    case "TRANSITION_DONE": {
      if (state.phase !== "transition") return state;
      const index = state.index + 1;
      if (index >= state.mission.rounds.length) return { ...state, phase: "finished", index };
      return { ...state, index, phase: "approach", selectedChoiceId: null, feedback: null, firstResponse: null,
        lastResponse: null, supportUsed: [], cue: { id: null, status: "pending" } };
    }
    default: return state;
  }
}
export function racerEvidence(state, { timeMs = 0 } = {}) {
  const firstIndependentCorrect = state.evidence.filter(record => record.firstResponse.independent && record.firstResponse.correct).length;
  const firstIndependentIncorrect = state.evidence.filter(record => record.firstResponse.independent && !record.firstResponse.correct).length;
  const firstChoiceCorrect = state.evidence.filter(record => record.firstResponse.correct).length;
  const firstChoiceIncorrect = state.evidence.filter(record => !record.firstResponse.correct).length;
  const completedPractice = state.evidence.filter(record => record.completed).length;
  const result = buildSoundRacerEvidenceResult({ wordsCorrect: firstChoiceCorrect, wordsWrong: firstChoiceIncorrect, timeMs,
    score: completedPractice * 100 });
  // Existing stars reward first deliberate game choices, including accessible
  // printed practice. These fields are never independent proficiency evidence.
  return { ...result, firstChoiceCorrect, firstChoiceIncorrect, firstIndependentCorrect, firstIndependentIncorrect, completedPractice,
    independentSoundAccuracy: firstIndependentCorrect + firstIndependentIncorrect > 0
      ? Math.round(100 * firstIndependentCorrect / (firstIndependentCorrect + firstIndependentIncorrect)) : null,
    supportedPractice: state.evidence.filter(record => record.completed && record.completionKind === "supported").length,
    unscoredFirstResponses: state.evidence.filter(record => !record.firstResponse.independent).length,
    firstResponseAccuracy: result.total ? result.accuracy : null };
}
