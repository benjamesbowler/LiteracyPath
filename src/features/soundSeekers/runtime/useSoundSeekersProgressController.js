import { useCallback, useMemo, useSyncExternalStore } from "react";
import { createSoundSeekersProgressController } from "./soundSeekersProgressController.js";
import { useDeferredControllerDisposal } from "./useDeferredControllerDisposal.js";

export function useSoundSeekersProgressController(progressScopeKey) {
  const controller = useMemo(
    () => createSoundSeekersProgressController({ progressScopeKey }),
    [progressScopeKey]
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot
  );
  const commitState = useCallback(
    (update, options) => controller.commit(update, options),
    [controller]
  );
  useDeferredControllerDisposal(controller);
  return Object.freeze({ state, commitState, flush: controller.flush });
}
