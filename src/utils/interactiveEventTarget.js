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

// Window-level game shortcuts must leave focused controls to their native
// keyboard behaviour. `closest` also covers icons or labels nested in a button.
export function isInteractiveKeyTarget(target) {
  return Boolean(
    target &&
    typeof target.closest === "function" &&
    target.closest(INTERACTIVE_KEY_TARGET_SELECTOR)
  );
}
