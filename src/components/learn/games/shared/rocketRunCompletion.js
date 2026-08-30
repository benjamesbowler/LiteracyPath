// Rocket Run owns its one-action instruction, retry, round-transition, and
// completion cards inside the WebGL HUD. Isolate whichever card is active and
// make every gameplay/replay control behind it inert until that card closes.
const overlayIsolation = new WeakMap();

export function isolateRocketRunActionOverlay(hud, overlay, action, label) {
  if (!hud || !overlay) return;
  restoreRocketRunHud(hud, overlay);
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", label);
  const previousInert = [...hud.children].map(child => [child, child.inert]);
  previousInert.forEach(([child]) => {
    child.inert = child !== overlay;
  });
  const trapFocus = event => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    action?.focus();
  };
  overlay.addEventListener("keydown", trapFocus);
  overlayIsolation.set(overlay, { previousInert, trapFocus });
  action?.focus();
}

export function isolateRocketRunCompletion(hud, overlay, action) {
  isolateRocketRunActionOverlay(hud, overlay, action, "Rocket Run complete");
}

export function restoreRocketRunHud(hud, overlay) {
  if (!hud || !overlay) return;
  const isolation = overlayIsolation.get(overlay);
  if (!isolation) return;
  isolation.previousInert.forEach(([child, wasInert]) => {
    child.inert = wasInert;
  });
  overlay.removeEventListener("keydown", isolation.trapFocus);
  overlayIsolation.delete(overlay);
  overlay.removeAttribute("role");
  overlay.removeAttribute("aria-modal");
  overlay.removeAttribute("aria-label");
}
