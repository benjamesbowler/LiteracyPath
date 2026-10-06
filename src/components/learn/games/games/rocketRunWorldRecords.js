const IDENTITIES = Object.freeze({
  easy: Object.freeze({ world: 'meadow', character: 'bouncy' }),
  medium: Object.freeze({ world: 'dino', character: 'chompy' }),
  hard: Object.freeze({ world: 'moonwood', character: 'pip' }),
});

export function rocketRunWorldIdentity(difficulty = 'easy') {
  if (!Object.hasOwn(IDENTITIES, difficulty)) throw new Error('Unknown Rocket difficulty');
  return IDENTITIES[difficulty];
}

function checkedSelectedRecords(records, identity) {
  const record = records?.[identity.world];
  if (!record || Object.keys(records).length !== 1 || record.character !== identity.character
    || !record.url?.startsWith('/game-assets/rocket-run/models/')
    || record.capture?.socket !== 'wordCaptureSocket'
    || record.flight?.primary?.frames?.length !== 42 || record.flight?.emergency?.frames?.length !== 21
    || !['station', 'portal', 'courier', 'planet', 'asteroid', 'beacon', 'comet']
      .every(role => record.route?.primary?.roles?.[role])
    || !record.venue?.primary || !record.venue?.embedded) {
    throw new Error('The selected complete Rocket world is unavailable');
  }
  return records;
}

/** Own the asynchronous metadata boundary before any world, audio or clock is
 * created. A pending pause/support action remains real when the engine starts;
 * stale imports can never create an engine after exit or a newer retry. */
export function createRocketWorldRecordsOwner({ difficulty = 'easy', loadWorld, createEngine, onStatus = () => {} }) {
  const identity = rocketRunWorldIdentity(difficulty);
  let disposed = false, request = 0, engine = null, paused = false, loading = null;
  let status = 'waiting', error = null;
  const support = new Set();
  const inspect = () => ({ status, world: identity.world, character: identity.character,
    paused, error, disposed, request });
  const notify = () => { if (!disposed) onStatus(inspect()); };
  async function start() {
    if (disposed) return false;
    const current = ++request;
    loading?.abort();
    const controller = new AbortController(); loading = controller;
    engine?.destroy(); engine = null; status = 'loading'; error = null; notify();
    try {
      const records = checkedSelectedRecords(await loadWorld(identity.world, { signal: controller.signal }), identity);
      if (disposed || current !== request) return false;
      engine = createEngine({ records, initiallyPaused: paused, initialSupportReasons: [...support] });
      status = 'ready'; notify();
      return true;
    } catch (failure) {
      if (disposed || current !== request) return false;
      engine?.destroy(); engine = null;
      status = 'failed'; error = String(failure.message || failure); notify();
      return false;
    } finally {
      if (loading === controller) loading = null;
    }
  }
  function destroy() {
    if (disposed) return;
    disposed = true; request++; loading?.abort(); loading = null; engine?.destroy(); engine = null;
  }
  return { start, destroy,
    pause() { if (disposed) return; paused = true; engine?.pause(); },
    resume() { if (disposed) return; paused = false; engine?.resume(); },
    markSupported(reason) { if (disposed || !reason) return; support.add(reason); engine?.markSupported(reason); },
    hold: (...args) => engine?.hold(...args), choose: (...args) => engine?.choose(...args),
    release: (...args) => engine?.release(...args),
    replay: (...args) => engine?.replay(...args), retrySave: (...args) => engine?.retrySave(...args),
    retryArt: (...args) => engine?.retryArt(...args), retryFlight: (...args) => engine?.retryFlight(...args),
    resumeContext: (...args) => engine?.resumeContext(...args),
    soundChanged: (...args) => engine?.soundChanged(...args),
    inspect,
    debugSnapshot() { return engine ? { ...engine.debugSnapshot(), worldRecords: inspect() }
      : { worldRecords: inspect(), paused, recordLoading: status === 'loading' }; },
  };
}
