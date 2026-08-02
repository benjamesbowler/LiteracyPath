import { stopCueAudio } from "./cuePlayer.js";
import { cancelGameSfx } from "./gameSfx.js";
import { stopGameAmbience, stopGameMusic } from "./gameMusic.js";
import { stopPhonicsAudio } from "../../hooks/usePhonicsAudio.js";
import { stopQuestActionSfx } from "../questActionAudio.js";

export const STOP_CHILD_AUDIO_EVENT = "lp-stop-child-audio";

let browserLifecycleInstalled = false;

export function stopAllChildAudio(reason = "route-change") {
  stopPhonicsAudio();
  stopCueAudio();
  stopGameMusic({ fadeSeconds: 0 });
  stopGameAmbience({ fadeSeconds: 0 });
  cancelGameSfx();
  stopQuestActionSfx();

  if (typeof window !== "undefined") {
    window.speechSynthesis?.cancel?.();
    const StopEvent = window.CustomEvent || globalThis.CustomEvent;
    if (StopEvent) {
      window.dispatchEvent(new StopEvent(STOP_CHILD_AUDIO_EVENT, {
        detail: { reason }
      }));
    }
  }
  if (typeof document !== "undefined") {
    document.querySelectorAll("audio").forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Detached or not-yet-ready media is already effectively stopped.
      }
    });
  }
}

export function installChildAudioPageLifecycle() {
  if (browserLifecycleInstalled || typeof window === "undefined") return () => {};
  browserLifecycleInstalled = true;
  const stopForPageExit = () => stopAllChildAudio("page-exit");
  const stopForHiddenPage = () => {
    if (typeof document !== "undefined" && document.hidden) stopAllChildAudio("page-hidden");
  };
  window.addEventListener("pagehide", stopForPageExit);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", stopForHiddenPage);
  }
  return () => {
    window.removeEventListener("pagehide", stopForPageExit);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", stopForHiddenPage);
    }
    browserLifecycleInstalled = false;
  };
}
