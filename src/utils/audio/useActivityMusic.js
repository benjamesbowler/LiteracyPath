import { useCallback, useState } from "react";

// Background music is an opt-in for this visit, never a saved learner setting.
// Scope changes reset during render so no effect can briefly start old music.
export function useActivityMusic(scope) {
  const [choice, setChoice] = useState(() => ({ scope, enabled: false }));
  if (choice.scope !== scope) setChoice({ scope, enabled: false });
  const setEnabled = useCallback(enabled => setChoice({ scope, enabled: enabled === true }), [scope]);
  return [choice.scope === scope && choice.enabled, setEnabled];
}
