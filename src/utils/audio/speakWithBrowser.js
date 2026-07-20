// Gold-voice policy: browser speech synthesis is not an acceptable phonics or
// pre-reader fallback. Keep this compatibility export as an explicit no-op so
// older call sites fail safely and silently while they migrate to recorded
// clips, picture-first guidance, or gated controls.
export function speakWithBrowser() {
  return false;
}

export function resetPreferredBrowserVoiceForTests() {
  // Retained for callers/tests that used to reset the synthesized voice cache.
}
