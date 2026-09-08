import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhonicsCompletion } from './phonicsActivityState.js';

export function usePhonicsCompletion(onComplete) {
  const retained = useRef(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const retrySave = useCallback(() => {
    if (!retained.current) return;
    try {
      const result = onComplete(retained.current);
      setSaveFailed(result?.localSaved === false && result?.queued === false);
    } catch { setSaveFailed(true); }
  }, [onComplete]);
  const complete = useCallback(steps => {
    retained.current ||= createPhonicsCompletion(steps);
    retrySave();
  }, [retrySave]);
  const resetCompletion = useCallback(() => { retained.current = null; setSaveFailed(false); }, []);
  useEffect(() => {
    if (!saveFailed) return undefined;
    const protect = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [saveFailed]);
  return { complete, saveFailed, retrySave, resetCompletion };
}
