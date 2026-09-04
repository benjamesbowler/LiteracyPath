import { useEffect, useRef } from "react";

// React Strict Mode intentionally disconnects and reconnects committed effects.
// Deferring destruction by one microtask lets that replay reacquire the same
// render-owned controller, while a real unmount or dependency change still
// disposes the exact old owner.
export function useDeferredControllerDisposal(controller) {
  const generationsRef = useRef(new WeakMap());
  useEffect(() => {
    const generations = generationsRef.current;
    generations.set(controller, (generations.get(controller) || 0) + 1);
    return () => {
      const releaseGeneration = (generations.get(controller) || 0) + 1;
      generations.set(controller, releaseGeneration);
      queueMicrotask(() => {
        if (generations.get(controller) === releaseGeneration) controller.dispose();
      });
    };
  }, [controller]);
}
