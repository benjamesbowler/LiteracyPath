export function completeRepairDisplay(display, answer) {
  return String(display || "").split("___").join(String(answer || ""));
}
