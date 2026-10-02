import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhonicsCompletion } from './phonicsActivityState.js';

export function usePhonicsCompletion(onComplete, initialCompletion = null) {
  const retained = useRef(initialCompletion);
  const [saveFailed, setSaveFailed] = useState(Boolean(initialCompletion));
  const retrySave = useCallback(() => {
    if (!retained.current) return;
    try {
      const result = onComplete(retained.current);
      const failed = result?.localSaved === false && result?.queued === false;
      setSaveFailed(failed); return !failed;
    } catch { setSaveFailed(true); return false; }
  }, [onComplete]);
  const complete = useCallback(steps => {
    retained.current ||= createPhonicsCompletion(steps);
    return retrySave();
  }, [retrySave]);
  const resetCompletion = useCallback(() => { retained.current = null; setSaveFailed(false); }, []);
  useEffect(() => {
    if (!saveFailed) return undefined;
    const protect = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [saveFailed]);
  return { complete, saveFailed, retrySave, resetCompletion, retainedCompletion: retained };
}
