export function promptForReadingMarkTarget(element) {
  element?.classList.add("choose-prompt");
  window.setTimeout(() => element?.classList.remove("choose-prompt"), 650);
}

// A session host belongs only to the teacher's whole-class/group surface.
// Scoping it here prevents stale group state from changing a normal teacher or
// child reader (most visibly by hiding its read-aloud controls).
export function getActiveGuidedReadingSessionHost(mode, sessionHost) {
  if (mode !== "class" || !sessionHost?.session) return null;
  const status = String(sessionHost.session.status || "active").toLowerCase();
  return status === "active" ? sessionHost : null;
}

export function canUseGuidedReadingReadAloud(mode, sessionHost) {
  return !getActiveGuidedReadingSessionHost(mode, sessionHost);
}
