export function promptForReadingMarkTarget(element) {
  element?.classList.add("choose-prompt");
  window.setTimeout(() => element?.classList.remove("choose-prompt"), 650);
}
