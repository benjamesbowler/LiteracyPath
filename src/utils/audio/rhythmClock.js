// One pausable timebase for note rendering, input judgement and musical phase.
export function createRhythmClock({ wallTime, audioTime }) {
  let wall = wallTime();
  let audio = audioTime();
  let value = wall;
  let paused = false;
  function now() {
    const nextWall = wallTime();
    const nextAudio = audioTime();
    if (!paused) {
      const elapsed = audio != null && nextAudio != null ? nextAudio - audio : nextWall - wall;
      value += Math.max(0, elapsed);
    }
    wall = nextWall;
    audio = nextAudio;
    return value;
  }
  return {
    now,
    pause() { now(); paused = true; },
    resume() { now(); paused = false; }
  };
}

export function nextPhraseBeat(now, origin, spacing, lead = 1.05) {
  return origin + Math.ceil((now + lead - origin) / spacing) * spacing;
}
