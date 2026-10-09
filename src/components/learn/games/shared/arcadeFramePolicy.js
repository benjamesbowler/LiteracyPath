// A paused canvas retains its last complete frame. Resize, asset delivery and
// presentation changes may invalidate it without advancing simulation time.
export function createArcadeRenderGate() {
  let dirty = true, previousPaused = null, previousRevision;
  return {
    invalidate() { dirty = true; },
    shouldRender(paused, revision) {
      if (paused !== previousPaused || revision !== previousRevision) dirty = true;
      previousPaused = paused; previousRevision = revision;
      if (paused && !dirty) return false;
      dirty = false;
      return true;
    }
  };
}

// Retain the existing 60 Hz camera feel at other rendering cadences.
export function arcadeDampingFactor(deltaSeconds, factorAt60Hz) {
  return 1 - Math.pow(1 - factorAt60Hz, Math.max(0, deltaSeconds) * 60);
}

// Physical sources remain independently held; equivalent keys/buttons resolve
// to one intent, and opposing directions cancel without losing either source.
export function arcadeHeldAxes(sources) {
  let left = false, right = false, up = false, down = false;
  for (const source of sources) {
    if (source.endsWith(':left')) left = true;
    else if (source.endsWith(':right')) right = true;
    else if (source.endsWith(':up')) up = true;
    else if (source.endsWith(':down')) down = true;
  }
  return { x: Number(right) - Number(left), y: Number(down) - Number(up) };
}
