import { useCallback, useEffect, useState } from "react";
import { cancelSpeech, hasRecordedSpeech } from "../../../../utils/learnGamesAudio.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from "../../../../data/ledaProductionAudio.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";

// Use the shared cue session so failed playback has a visible fallback, and
// mute, replay, pause and leaving the stage cannot leak a stale sentence.
export function useRecordedPracticeCue(text, enabled, autoPlay = true, onVoice) {
  const [failedText, setFailedText] = useState("");
  const canHear = enabled && hasRecordedSpeech(text) && failedText !== text;
  const replay = useCallback(() => {
    if (!canHear) return;
    const src = /^[a-z]+$/i.test(text) ? getLedaWordAudioPath(text) : getLedaInstructionAudioPath(text);
    cancelSpeech();
    const voice = new Promise(resolve => {
      let finished = false;
      const finish = status => { if (finished) return; finished = true; clearTimeout(watchdog); resolve(status); };
      // A missing terminal media event must not trap an answered result.
      const watchdog = setTimeout(() => { stopCueAudio(); setFailedText(text); finish('unavailable'); }, 20000);
      playCueAudio(src, {
        onUnavailable: () => { setFailedText(text); finish('unavailable'); },
        onDelivery: event => { if (['completed', 'failed', 'interrupted', 'unavailable'].includes(event.type)) finish(event.type); }
      });
    });
    onVoice?.(voice);
    return voice;
  }, [canHear, text, onVoice]);
  useEffect(() => {
    if (autoPlay) replay();
    return stopCueAudio;
  }, [autoPlay, replay]);
  return { canHear, replay };
}
