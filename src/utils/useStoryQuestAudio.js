import { useEffect, useRef, useState } from "react";
import { getStoryQuestLedaAudioPath } from "../data/storyQuestLedaAudio.js";
import { getLedaInstructionAudioPath } from "../data/ledaProductionAudio.js";
import { STOP_CHILD_AUDIO_EVENT } from "./audio/childAudioLifecycle.js";

export function useStoryQuestAudio() {
  const audioRef = useRef(null);
  const [status, setStatus] = useState("");
  function stop() {
    audioRef.current?.pause();
    audioRef.current = null;
  }
  useEffect(() => {
    window.addEventListener(STOP_CHILD_AUDIO_EVENT, stop);
    return () => {
      window.removeEventListener(STOP_CHILD_AUDIO_EVENT, stop);
      stop();
    };
  }, []);
  function play(text) {
    stop();
    const path = getStoryQuestLedaAudioPath(text) || getLedaInstructionAudioPath(text);
    if (!path) { setStatus("Audio unavailable"); return; }
    const audio = new Audio(path);
    audioRef.current = audio;
    setStatus("");
    audio.onended = () => { if (audioRef.current === audio) audioRef.current = null; };
    audio.onerror = () => { if (audioRef.current === audio) setStatus("Audio unavailable"); };
    audio.play().catch(() => { if (audioRef.current === audio) setStatus("Tap to hear it again"); });
  }
  return { play, stop, status };
}
