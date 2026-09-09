import { useEffect, useRef } from 'react';

/** Native keyboard/mouse activation, with forgiving released finger taps.
 * Browsers can omit click after a small touch move even with touch-action:none.
 * The same button must own both ends; a cancelled or interrupted hold is not an answer.
 */
export default function CycleButton({ onClick, disabled, children, ...props }) {
  const held = useRef(null);
  const suppressClick = useRef(false);
  const button = useRef(null);
  const cancel = () => {
    const pointerId = held.current;
    held.current = null;
    if (pointerId !== null) suppressClick.current = true;
    if (pointerId !== null && button.current?.hasPointerCapture?.(pointerId)) button.current.releasePointerCapture(pointerId);
  };
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => {
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('blur', cancel); cancel(); };
  }, []);
  return <button {...props} ref={button} disabled={disabled}
    onPointerDown={event => {
      if (disabled || event.button !== 0 || event.isPrimary === false) return;
      suppressClick.current = false;
      if (event.pointerType === 'mouse') return;
      held.current = event.pointerId;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }}
    onPointerUp={event => {
      if (held.current !== event.pointerId) return;
      held.current = null;
      suppressClick.current = true;
      const element = event.currentTarget;
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      if (disabled || !hit || !element.contains(hit)) return;
      event.preventDefault();
      onClick?.(event);
    }}
    onPointerCancel={cancel} onLostPointerCapture={cancel}
    onClick={event => {
      if (disabled || (event.detail !== 0 && (suppressClick.current || ['touch', 'pen'].includes(event.nativeEvent.pointerType)))) return;
      onClick?.(event);
    }}>{children}</button>;
}
