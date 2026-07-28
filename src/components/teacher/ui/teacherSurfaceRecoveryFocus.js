const ACTIVE_RECOVERY_WATCHES = new Map();

function isVisible(element) {
  if (!element || element.hidden || element.getAttribute?.("aria-hidden") === "true") {
    return false;
  }
  if (typeof element.getClientRects !== "function") return true;
  return element.getClientRects().length > 0;
}

function makeProgrammaticallyFocusable(element) {
  if (!element) return null;
  if (
    !element.matches?.(
      "a[href], button, input, select, textarea, [tabindex]"
    )
  ) {
    element.setAttribute?.("tabindex", "-1");
  }
  return element;
}

function focusWithoutScrolling(element) {
  const target = makeProgrammaticallyFocusable(element);
  if (!target || typeof target.focus !== "function") return false;
  target.focus({ preventScroll: true });
  return true;
}

function pageHeading(documentRef, sourceRoot) {
  const candidates = [
    ...(sourceRoot?.closest?.("main")?.querySelectorAll?.(
      ".teacher-page-header h1, .teacher-page-header h2, h1"
    ) || []),
    ...(documentRef?.querySelectorAll?.(
      "main .teacher-page-header h1, main .teacher-page-header h2, main h1"
    ) || [])
  ];
  return candidates.find(isVisible) || null;
}

/**
 * Keeps a keyboard user with a retry through all three real outcomes:
 * the retry control is replaced by a loading status, loading becomes the same
 * recoverable error again, or loading succeeds and the normal page returns.
 *
 * The watcher is deliberately bounded. It observes only the source state's
 * parent when possible, disconnects as soon as a final target is focused, and
 * times out after fifteen seconds if a caller never settles its read state.
 */
export function beginTeacherSurfaceRecoveryFocus({
  surface,
  sourceControl,
  documentRef = typeof document === "undefined" ? null : document,
  MutationObserverRef = typeof MutationObserver === "undefined"
    ? null
    : MutationObserver,
  requestFrame = typeof requestAnimationFrame === "undefined"
    ? callback => setTimeout(callback, 0)
    : requestAnimationFrame,
  cancelFrame = typeof cancelAnimationFrame === "undefined"
    ? clearTimeout
    : cancelAnimationFrame,
  setTimer = setTimeout,
  clearTimer = clearTimeout
} = {}) {
  if (!surface || !sourceControl || !documentRef || !MutationObserverRef) {
    return () => {};
  }

  ACTIVE_RECOVERY_WATCHES.get(surface)?.();

  const sourceState = sourceControl.closest?.("[data-teacher-surface]") || null;
  const sourceRoot = sourceState?.parentElement || sourceState || null;
  const sourceIndex = sourceRoot && sourceState
    ? Array.from(sourceRoot.children || []).indexOf(sourceState)
    : -1;
  let sawLoading = false;
  let finished = false;
  let frameId = null;
  let timeoutId = null;

  const surfaceSelector = `[data-teacher-surface="${surface}"]`;

  function currentState() {
    const indexedCandidate = sourceIndex >= 0
      ? sourceRoot?.children?.[sourceIndex]
      : null;
    if (
      indexedCandidate?.matches?.(surfaceSelector)
      && isVisible(indexedCandidate)
    ) {
      return indexedCandidate;
    }
    const localCandidate = sourceRoot?.querySelector?.(surfaceSelector);
    if (isVisible(localCandidate)) return localCandidate;
    // When the containing read region still exists, absence here is the
    // successful outcome. A different warning for the same broad surface
    // elsewhere on the page must not steal this retry's focus.
    if (sourceRoot?.isConnected) return null;
    return [...(documentRef.querySelectorAll?.(surfaceSelector) || [])]
      .find(isVisible) || null;
  }

  function stop() {
    if (finished) return;
    finished = true;
    observer.disconnect();
    if (frameId !== null) cancelFrame(frameId);
    if (timeoutId !== null) clearTimer(timeoutId);
    if (ACTIVE_RECOVERY_WATCHES.get(surface) === stop) {
      ACTIVE_RECOVERY_WATCHES.delete(surface);
    }
  }

  function focusFinalTarget(stateElement) {
    if (stateElement) {
      const recoveryAction = [
        ...(stateElement.querySelectorAll?.(
          ".teacher-surface-state-actions button:not(:disabled)"
        ) || [])
      ].find(isVisible);
      if (focusWithoutScrolling(recoveryAction || stateElement)) {
        stop();
        return true;
      }
    }
    if (focusWithoutScrolling(pageHeading(documentRef, sourceRoot))) {
      stop();
      return true;
    }
    return false;
  }

  function evaluate() {
    if (finished) return;
    const stateElement = currentState();
    const state = stateElement?.getAttribute?.("data-teacher-state") || "";
    const sourceStillFocused = sourceControl.isConnected
      && documentRef.activeElement === sourceControl;

    if (state === "loading") {
      sawLoading = true;
      if (!sourceStillFocused && documentRef.activeElement !== stateElement) {
        focusWithoutScrolling(stateElement);
      }
      return;
    }

    if (sawLoading || !sourceControl.isConnected || !sourceStillFocused) {
      focusFinalTarget(stateElement);
    }
  }

  const observer = new MutationObserverRef(() => {
    if (frameId !== null) cancelFrame(frameId);
    frameId = requestFrame(() => {
      frameId = null;
      evaluate();
    });
  });
  observer.observe(sourceRoot || documentRef.body, {
    childList: true,
    subtree: true
  });

  ACTIVE_RECOVERY_WATCHES.set(surface, stop);
  frameId = requestFrame(() => {
    frameId = null;
    evaluate();
  });
  timeoutId = setTimer(() => {
    const stateElement = currentState();
    if (sawLoading || !sourceControl.isConnected) {
      focusFinalTarget(
        stateElement?.getAttribute?.("data-teacher-state") === "loading"
          ? null
          : stateElement
      );
    }
    stop();
  }, 15_000);

  return stop;
}
