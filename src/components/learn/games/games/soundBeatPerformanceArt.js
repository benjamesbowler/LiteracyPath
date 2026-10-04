import { createRegisteredPalArtBank } from '../shared/registeredPalArt.js';
import { SOUND_BEAT_ART } from './soundBeatArtData.js';

export const SOUND_BEAT_CAST = Object.freeze({ meadow: ['bouncy', 'woolly'], dino: ['chompy', 'sunny'], moonwood: ['pip', 'wren'] });

// Frame names follow the inspected final drawing, not the generator's requested
// row labels. Occluded grips are deliberately absent from every selected list.
export const SOUND_BEAT_POSES = Object.freeze({
  bouncy: { contact: { rightHand: 0, leftHand: 1 }, ready: 3, preparation: { rightHand: [2, 5, 4], leftHand: [14, 0, 0] }, recovery: [8, 9, 10, 11], finale: [12, 13, 14, 15] },
  woolly: { contact: { rightHand: 1, leftHand: 0 }, ready: 3, preparation: { rightHand: [7, 0, 4], leftHand: [5, 1, 6] }, recovery: [8, 9, 10, 11], finale: [12, 13, 14, 15] },
  chompy: { contact: { rightHand: 0, leftHand: 1 }, ready: 3, preparation: { rightHand: [2, 6, 4], leftHand: [7, 5, 0] }, recovery: [8, 9, 10, 11], finale: [12, 13, 14, 15] },
  sunny: { direct: true, contact: { rightForefoot: 4, leftForefoot: 0 }, ready: 3, preparation: { rightForefoot: [7, 2, 12], leftForefoot: [5, 7, 6] }, recovery: [8, 9, 10, 11], finale: [12, 13, 14, 15] },
  pip: { contact: { rightHand: 0, leftHand: 1 }, ready: 3, preparation: { rightHand: [2, 5, 1], leftHand: [7, 6, 0] }, recovery: [8, 9, 10, 11], finale: [12, 13, 14, 15] },
  wren: { contact: { rightHand: 0, leftHand: 2 }, ready: 3, preparation: { rightHand: [5, 6, 4], leftHand: [7, 1, 0] }, recovery: [8, 9, 10, 11], finale: [12, 13, 14, 15] }
});

export function soundBeatHandForLane(actorIndex, lane) {
  const local = lane % 2;
  return actorIndex === 0 ? (local === 0 ? 'rightHand' : 'leftHand') : (local === 0 ? 'leftHand' : 'rightHand');
}

export function soundBeatContactForLane(character, actorIndex, lane) {
  const hand = soundBeatHandForLane(actorIndex, lane);
  return character === 'sunny' ? hand.replace('Hand', 'Forefoot') : hand;
}

export function soundBeatMusicalPose({ character, actorIndex, lane, targetTime, now, input, missAt = -Infinity, phraseAt = null, roundStartAt = 0, spacing = 0.7, section = 0, musicEnabled = false, reducedMotion = false }) {
  const poses = SOUND_BEAT_POSES[character];
  if (!poses) return null;
  const atlas = `${character}-music-performance-v1`;
  const ready = { atlas, frame: poses.ready, action: 'ready', hand: null, limb: null, phase: 0, contact: false };
  const physicalPose = value => ({ ...value, limb: value.hand, hand: poses.direct ? null : value.hand });
  if (input && Math.floor(input.lane / 2) === actorIndex && now >= input.at && now - input.at < 0.46) {
    const hand = soundBeatContactForLane(character, actorIndex, input.lane);
    const phase = Math.min(1, (now - input.at) / 0.46);
    // Input is already judged. The contact drawing appears immediately; the
    // visible approaching note supplied the anticipation before this event.
    if (phase < 0.23) return physicalPose({ atlas, frame: poses.contact[hand], action: 'strike', hand, phase, contact: true });
    return physicalPose({ atlas, frame: phase < 0.65 ? poses.preparation[hand][0] : poses.ready, action: 'follow-through', hand, phase, contact: false });
  }
  if (phraseAt !== null && now - phraseAt < 0.85 && now >= phraseAt) {
    const phase = (now - phraseAt) / 0.85;
    return { atlas, frame: poses.finale[Math.min(3, Math.floor(phase * 4))], action: 'phrase-finale', hand: null, phase, contact: false };
  }
  if (now >= missAt && now - missAt < 0.65) {
    const phase = (now - missAt) / 0.65;
    return { atlas, frame: poses.recovery[Math.min(3, Math.floor(phase * 4))], action: 'recovery', hand: null, phase, contact: false };
  }
  const until = targetTime - now;
  if (Math.floor(lane / 2) === actorIndex && until >= 0 && until < 0.6) {
    const phase = 1 - until / 0.6, hand = soundBeatContactForLane(character, actorIndex, lane);
    return physicalPose({ atlas, frame: poses.preparation[hand][Math.min(2, Math.floor(phase * 3))], action: 'anticipation', hand, phase, contact: false });
  }
  if (musicEnabled && section >= 2 && !reducedMotion) {
    const beat = Math.max(0, (now - roundStartAt) / Math.max(0.2, spacing));
    const phase = (beat + actorIndex) % 2;
    const hand = soundBeatContactForLane(character, actorIndex, Math.floor(beat / 2 + actorIndex) % 2);
    if (phase < 0.16) return physicalPose({ atlas, frame: poses.contact[hand], action: 'accompaniment', hand, phase, contact: true });
    if (phase > 1.45) return physicalPose({ atlas, frame: poses.preparation[hand][1], action: 'groove-preparation', hand, phase: (phase - 1.45) / 0.55, contact: false });
  }
  return ready;
}

export function createSoundBeatPerformanceArt(world) {
  const atlases = Object.fromEntries(Object.entries(SOUND_BEAT_ART).filter(([name]) => name.includes('-music-')));
  let bank = createRegisteredPalArtBank(atlases);
  let disposed = false;
  const characters = SOUND_BEAT_CAST[world] || SOUND_BEAT_CAST.meadow;
  const ids = characters.map(character => `${character}-music-performance-v1`);
  void bank.preload(ids);
  return { characters, has: id => Boolean(atlases[id]),
    draw: (...args) => bank.draw(...args), pose: (...args) => bank.pose(...args), delivery: () => bank.delivery(),
    async reload() {
      if (disposed) return [];
      bank.dispose(); bank = createRegisteredPalArtBank(atlases); return bank.preload(ids);
    },
    dispose() { if (disposed) return; disposed = true; bank.dispose(); }
  };
}
