const INTERACTIVE_KEY_TARGET_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[contenteditable='true']"
].join(", ");

// Activation keys still belong to the focused button. Movement keys can reach
// the active Arcade engine after a child clicks a pad, replay or sound button.
// Text fields, native select controls and modal actions keep all their keys.
export function isInteractiveKeyTarget(target, key) {
  if (!target || typeof target.closest !== "function") return false;
  const control = target.closest(INTERACTIVE_KEY_TARGET_SELECTOR);
  if (!control) return false;
  if (!/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|[wasd])$/i.test(key || "")) return true;
  const player = target.closest(".lg-game-player");
  if (!player || target.closest("[inert], input, select, textarea, [contenteditable='true']")) return true;
  const dialog = target.closest('[role="dialog"]');
  if (dialog && dialog !== player) return true;
  return !target.closest("button, [role='button']");
}
