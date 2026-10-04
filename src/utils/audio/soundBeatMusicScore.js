// Original sixteen-step arrangements. The musical beat remains the existing
// AudioContext clock; changing orchestration never restarts that clock.
const melodies = [
  [0, null, 2, null, 4, null, 2, null, 3, null, 1, null, 4, 2, 1, null],
  [0, null, 4, null, 2, null, 3, null, 1, null, 2, null, 4, 3, 2, null],
  [0, 2, null, 4, 2, null, 1, null, 3, null, 4, 2, 1, null, 0, null],
  [4, null, 3, 2, 0, null, 2, null, 1, null, 3, null, 4, 2, 0, null],
  [0, null, 2, 4, null, 3, null, 2, 4, null, 3, null, 1, 2, 0, null],
  [2, null, 4, null, 3, 2, null, 0, 1, null, 3, 4, null, 2, 0, null],
  [0, 2, 4, null, 3, null, 2, null, 1, 3, 4, null, 2, null, 0, null],
  [4, null, 2, null, 0, 2, 3, null, 1, null, 3, null, 4, 3, 2, null],
  [0, 2, 4, 2, 3, null, 1, null, 4, 3, 2, 0, 1, 2, 4, null],
  [4, 3, 2, 0, 1, null, 2, null, 0, 2, 4, 3, 2, 1, 0, null]
];
const scales = { meadow: [0, 2, 4, 7, 9], dino: [0, 3, 5, 7, 10], moonwood: [0, 2, 3, 7, 10] };
const tonics = { meadow: 196, dino: 174.61, moonwood: 220 };

export function soundBeatMusicArrangement(index, world = 'meadow') {
  const section = Math.max(0, Math.min(9, Math.trunc(Number(index) || 0)));
  const scale = scales[world] || scales.meadow, tonic = tonics[world] || tonics.meadow;
  const frequency = (degree, octave = 0) => degree == null ? 0 : tonic * 2 ** ((scale[degree % scale.length] + octave * 12) / 12);
  const bassDegrees = section < 2 ? [0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 4, 3, 0, 0]
    : [0, 0, 3, 0, 2, 0, 4, 3, 0, 0, 3, 4, 2, 3, 1, 0];
  return {
    section, world: scales[world] ? world : 'meadow',
    name: ['Solo pulse', 'Answer pulse', 'Partner groove', 'Alternating duo', 'Chime entrance', 'Reed answer', 'Call and response', 'Turnaround', 'Ensemble', 'Finale'][section],
    bass: bassDegrees.map(degree => frequency(degree, -1)),
    lead: melodies[section].map(degree => frequency(degree, 1)),
    kick: section < 2 ? [0, 8] : section < 8 ? [0, 4, 8, 12] : [0, 4, 7, 8, 12],
    clap: section < 2 ? [] : [4, 12],
    hat: section < 4 ? [3, 7, 11, 15] : section < 8 ? [1, 3, 5, 7, 9, 11, 13, 15] : [1, 3, 5, 6, 7, 9, 11, 13, 14, 15],
    leadType: world === 'moonwood' ? 'sine' : 'triangle', bassType: world === 'dino' ? 'triangle' : 'sawtooth',
    leadVolume: section < 2 ? 0.022 : section < 8 ? 0.034 : 0.043
  };
}
