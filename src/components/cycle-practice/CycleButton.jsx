import { useCallback, useEffect, useRef } from 'react';

// A touch release can remove a pause/retry panel before the browser sends its
// click. Keep ownership across button instances so it cannot hit a new answer.
let releasedFinger = null;
function isReleasedFingerClick(event) {
  if (!releasedFinger || event.detail === 0) return false;
  const elapsed = event.timeStamp - releasedFinger.at;
  if (elapsed < 0 || elapsed > 1000) return false;
  const pointerId = event.nativeEvent.pointerId;
  if (['touch', 'pen'].includes(event.nativeEvent.pointerType) && typeof pointerId === 'number') return pointerId === releasedFinger.id;
  // WebKit can label the compatibility click as a new mouse pointer. A real
  // mouse press clears releasedFinger in pointerdown before its click arrives.
  return Math.abs(event.clientX - releasedFinger.x) < 2 && Math.abs(event.clientY - releasedFinger.y) < 2;
}

/** Native keyboard/mouse activation, with forgiving released finger taps.
 * Browsers can omit click after a small touch move even with touch-action:none.
 * The same button must own both ends; a cancelled or interrupted hold is not an answer.
 */
export default function CycleButton({ onClick, disabled, children, ...props }) {
  const held = useRef(null);
  const suppressClick = useRef(false);
  const button = useRef(null);
  const pressTimer = useRef(null);
  const releaseCapture = useCallback(pointerId => {
    try {
      if (button.current?.hasPointerCapture?.(pointerId)) button.current.releasePointerCapture(pointerId);
    } catch { /* Safari may have already released an interrupted pointer. */ }
  }, []);
  const showPress = () => {
    clearTimeout(pressTimer.current);
    button.current?.setAttribute('data-pressed', 'true');
    // A quick tap can start and finish before a frame is painted.
    pressTimer.current = setTimeout(() => button.current?.removeAttribute('data-pressed'), 120);
  };
  const cancel = useCallback(event => {
    if (event?.pointerId !== undefined && event.pointerId !== held.current) return;
    const pointerId = held.current;
    held.current = null;
    if (pointerId !== null) suppressClick.current = true;
    clearTimeout(pressTimer.current);
    button.current?.removeAttribute('data-pressed');
    if (pointerId !== null) releaseCapture(pointerId);
  }, [releaseCapture]);
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled, cancel]);
  useEffect(() => {
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('blur', cancel); cancel(); };
  }, [cancel]);
  return <button {...props} ref={button} disabled={disabled}
    onPointerDown={event => {
      if (disabled || event.button !== 0 || event.isPrimary === false) return;
      suppressClick.current = false;
      releasedFinger = null;
      if (event.pointerType === 'mouse') return;
      held.current = event.pointerId;
      showPress();
      try { event.currentTarget.setPointerCapture?.(event.pointerId); }
      catch { /* An inside release or native click can still complete this tap. */ }
    }}
    onPointerUp={event => {
      if (held.current !== event.pointerId) return;
      held.current = null;
      suppressClick.current = true;
      releasedFinger = { id: event.pointerId, at: event.timeStamp, x: event.clientX, y: event.clientY };
      const element = event.currentTarget;
      releaseCapture(event.pointerId);
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      if (disabled || !hit || !element.contains(hit)) return;
      event.preventDefault();
      showPress();
      onClick?.(event);
    }}
    onPointerCancel={cancel} onLostPointerCapture={cancel}
    onClick={event => {
      if (disabled) return;
      if (isReleasedFingerClick(event)) return;
      if (event.detail !== 0 && suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      // Suppress the duplicate of a handled release, never all native touch
      // clicks: assistive input and Safari can legitimately deliver only click.
      showPress();
      onClick?.(event);
    }}>{children}</button>;
}
