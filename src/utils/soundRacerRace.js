import { buildTrack, soundRacerLadder } from './soundRacerTracks.js';
import { wordsStartingWithTargetSound } from './rocketRunRounds.js';
import { onsetGrapheme, sharesSound } from '../components/elQuest/elQuestEngine.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../data/knownBadWordAudio.js';

function hasReleasedWord(word) {
  const path = getLedaWordAudioPath(word);
  return !!path && AUDIO_QUEST_PATHS.has(path) && !isKnownBadAudioPath(path);
}
let releasedVocabulary;
function releasedRaceVocabulary() {
  if (!releasedVocabulary) releasedVocabulary = [...new Set(['easy', 'medium', 'hard'].flatMap(difficulty =>
    soundRacerLadder(difficulty).flatMap((target, seed) => buildTrack(target, { difficulty, seed }).gates.filter(gate => gate.word).map(gate => gate.word))))].filter(hasReleasedWord);
  return releasedVocabulary;
}

/** Three driven laps share one authored circuit, with fresh reviewed word gates. */
export function buildSoundRacerRace(target, options = {}) {
  const circuit = buildTrack(target, options);
  const variants = Array.from({ length: 3 }, (_, index) => index === 0 ? circuit
    : buildTrack(target, { ...options, seed: `${options.seed ?? 0}:race:${index}` }));
  const band = { easy: [2, 4], low: [2, 4], medium: [3, 5], mid: [3, 5], hard: [4, 6], high: [4, 6] }[options.difficulty] || [2, 4];
  const reviewed = wordsStartingWithTargetSound(target).filter(word => word.length >= band[0] && word.length <= band[1] && hasReleasedWord(word));
  const correct = [...new Set([...circuit.gates.filter(gate => gate.correct).map(gate => gate.word), ...reviewed])].filter(word => reviewed.includes(word)).slice(0, 18);
  const distractors = releasedRaceVocabulary().filter(word => word.length >= band[0] && word.length <= band[1] && !sharesSound(onsetGrapheme(word), target));
  if (correct.length < 9 || distractors.length < 12) throw new Error(`Sound Racer lacks recorded race vocabulary for ${target}`);
  const laps = 3;
  let wordIndex = 0, distractorIndex = 0;
  const lapGoals = Array.from({ length: laps }, (_, lap) => Math.floor(correct.length / laps) + (lap < correct.length % laps ? 1 : 0));
  const gates = [];
  for (let lap = 0; lap < laps; lap++) {
    const layout = variants[lap].gates;
    const slots = layout.map((gate, index) => gate.kind === 'word' ? index : -1).filter(index => index >= 0);
    const targetSlots = new Set(Array.from({ length: lapGoals[lap] }, (_, index) => slots[Math.floor((index + .5) * slots.length / lapGoals[lap])]));
    for (let index = 0; index < layout.length; index++) {
      const original = layout[index];
      const gate = { ...original, lap: lap + 1, z: original.z + lap * circuit.totalLength };
      if (gate.kind === 'word') {
        gate.correct = targetSlots.has(index);
        gate.word = gate.correct ? correct[wordIndex++] : distractors[distractorIndex++ % distractors.length];
      }
      gates.push(gate);
    }
  }
  return { ...circuit, laps, raceLength: circuit.totalLength * laps, gates,
    needed: correct.length, lapGoals, circuitCheckpoints: circuit.checkpoints,
    checkpoints: Array.from({ length: laps * 3 + 1 }, (_, index) => index * circuit.totalLength / 3) };
}
