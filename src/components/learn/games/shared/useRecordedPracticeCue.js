import { useCallback, useEffect, useState } from "react";
import { hasRecordedSpeech } from "../../../../utils/learnGamesAudio.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from "../../../../data/ledaProductionAudio.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";

// Use the shared cue session so failed playback has a visible fallback, and
// mute, replay, pause and leaving the stage cannot leak a stale sentence.
export function useRecordedPracticeCue(text, enabled, autoPlay = true) {
  const [failedText, setFailedText] = useState("");
  const canHear = enabled && hasRecordedSpeech(text) && failedText !== text;
  const replay = useCallback(() => {
    if (!canHear) return;
    const src = /^[a-z]+$/i.test(text) ? getLedaWordAudioPath(text) : getLedaInstructionAudioPath(text);
    playCueAudio(src, { onUnavailable: () => setFailedText(text) });
  }, [canHear, text]);
  useEffect(() => {
    if (autoPlay) replay();
    return stopCueAudio;
  }, [autoPlay, replay]);
  return { canHear, replay };
}

