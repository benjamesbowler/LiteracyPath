import { useEffect, useRef, useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import {
  getTargetWordAudioPath,
  isGenericInstructionAudioPath
} from "../../utils/assessmentAudioRoles";

export function AssessmentAudioButton({
  text,
  audioPath = "",
  speakText,
  label = "Play audio",
  className = "mini-audio-button",
  audioRole = "",
  showDisabled = false
}) {
  const [audioState, setAudioState] = useState("idle");
  const feedbackTimerRef = useRef(null);
  const approvedAudioPath = audioRole === "target_word"
    ? getTargetWordAudioPath(text, audioPath)
    : audioPath;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  if (import.meta.env.DEV && audioRole === "target_word" && isGenericInstructionAudioPath(audioPath)) {
    console.warn("Assessment target-word audio rejected instruction/prompt audio path.", {
      text,
      audioPath,
      label
    });
  }

  const canUseBrowserVoice = Boolean(String(text || "").trim());

  if (!approvedAudioPath && !canUseBrowserVoice) {
    if (audioPath && import.meta.env.DEV) {
      console.warn("Assessment audio unavailable or not approved.", { text, audioPath, label });
    }
    if (!showDisabled) return null;
    return (
      <button
        className={`assessment-audio-button ${className}`}
        aria-label={`${label} unavailable`}
        title="Audio is not available yet."
        type="button"
        disabled
      >
        <SpeakerSlash size={20} weight="bold" aria-hidden="true" />
      </button>
    );
  }

  async function playApprovedAudio() {
    if (audioState === "loading") return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setAudioState("loading");
    try {
      await speakText(text, approvedAudioPath, {
        allowBrowserFallback: !approvedAudioPath,
        requireApprovedAudio: Boolean(approvedAudioPath),
        audioRole
      });
      setAudioState("playing");
      feedbackTimerRef.current = setTimeout(() => setAudioState("idle"), 1200);
    } catch {
      setAudioState("idle");
    }
  }

  const isLoading = audioState === "loading";
  const isPlaying = audioState === "playing";

  return (
    <button
      className={[
        "assessment-audio-button",
        className,
        isLoading ? "audio-feedback-loading" : "",
        isPlaying ? "audio-feedback-playing" : ""
      ].filter(Boolean).join(" ")}
      disabled={isLoading}
      onClick={playApprovedAudio}
      aria-label={isLoading ? `${label} loading` : isPlaying ? `${label} playing` : label}
      type="button"
    >
      {isLoading ? <span className="audio-loading-dot" aria-hidden="true" /> : <SpeakerHigh size={20} weight="bold" aria-hidden="true" />}
    </button>
  );
}
