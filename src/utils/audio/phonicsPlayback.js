import { Howler } from "howler";

// Route and page lifecycle handlers can cancel phonics synchronously without
// loading the audio index used to choose a recording.
export const phonicsPlayback = { request: 0, active: null };

export function stopPhonicsAudio() {
  phonicsPlayback.request += 1;
  phonicsPlayback.active?.cancel("stopped");
  Howler.stop();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
