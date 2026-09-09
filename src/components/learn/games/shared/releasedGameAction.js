// Shared native semantic activation; the engine owns epochs and pause reset.
export function attachReleasedGameAction(button, action, input) {
  let held = null;
  const cancel = event => {
    if (held && event?.pointerId != null && event.pointerId !== held.id) return;
    const id = held?.id;
    if (id != null && input.owner === id) input.owner = null;
    held = null; delete button.dataset.pressed;
    if (id != null && button.hasPointerCapture?.(id)) button.releasePointerCapture(id);
  };
  const down = event => {
    if (button.disabled || event.button !== 0 || held || input.owner != null) return;
    input.owner = event.pointerId;
    held = { id: event.pointerId, epoch: input.epoch }; button.dataset.pressed = 'true';
    button.setPointerCapture?.(event.pointerId);
  };
  const up = event => {
    if (!held || event.pointerId !== held.id) return;
    const valid = held.epoch === input.epoch, box = button.getBoundingClientRect(); cancel();
    if (valid && !button.disabled && event.clientX >= box.left && event.clientX <= box.right &&
      event.clientY >= box.top && event.clientY <= box.bottom) action();
  };
  const click = event => { if (event.detail === 0 && !button.disabled && input.owner == null) action(); };
  const listeners = [['pointerdown', down], ['pointerup', up], ['pointercancel', cancel], ['lostpointercapture', cancel], ['click', click]];
  listeners.forEach(([type, handler]) => button.addEventListener(type, handler));
  input.cancels.add(cancel);
  return () => { cancel(); input.cancels.delete(cancel); listeners.forEach(([type, handler]) => button.removeEventListener(type, handler)); };
}

