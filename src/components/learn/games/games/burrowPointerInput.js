// A construction tap must begin and end on the same canvas. Drags, cancelled
// touches, secondary buttons and releases arriving from other controls do not
// edit the island. Both renderers own and dispose this same pointer contract.
export function cancelBurrowTap(canvas) { canvas?.dispatchEvent(new Event('burrow-tap-cancel')); }

export function bindBurrowTap(canvas, activate, enabled = () => true, hover) {
  let start = null;
  const cancel = () => { start = null; };
  const clear = () => { cancel(); hover?.(null); };
  const down = event => {
    if (!enabled() || event.button !== 0 || event.isPrimary === false || start) { cancel(); return; }
    start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  };
  const move = event => {
    if (start && (event.pointerId !== start.id || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12)) cancel();
    if (event.pointerType === 'mouse' && event.buttons === 0 && !start && enabled()) hover?.(event);
  };
  const up = event => {
    const owned = start; cancel();
    if (!owned || event.pointerId !== owned.id || !enabled() || Math.hypot(event.clientX - owned.x, event.clientY - owned.y) > 12) return;
    const bounds = canvas.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
    activate(event);
  };
  const unhover = () => hover?.(null);
  const visibility = () => { if (document.hidden) clear(); };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('pointerleave', unhover);
  canvas.addEventListener('burrow-tap-cancel', clear);
  canvas.addEventListener('lostpointercapture', cancel);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    clear();
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', cancel);
    canvas.removeEventListener('pointerleave', unhover);
    canvas.removeEventListener('burrow-tap-cancel', clear);
    canvas.removeEventListener('lostpointercapture', cancel);
    window.removeEventListener('blur', clear);
    document.removeEventListener('visibilitychange', visibility);
  };
}
