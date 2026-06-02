import { getApprovedAudioPath } from "../../data/audioPreferenceManifest";
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
  const approvedAudioPath = audioRole === "target_word"
    ? getTargetWordAudioPath(text, audioPath)
    : getApprovedAudioPath(text, audioPath);

  if (import.meta.env.DEV && audioRole === "target_word" && isGenericInstructionAudioPath(audioPath)) {
    console.warn("Assessment target-word audio rejected instruction/prompt audio path.", {
      text,
      audioPath,
      label
    });
  }

  if (!approvedAudioPath) {
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
        <span aria-hidden="true">🔇</span>
      </button>
    );
  }

  return (
    <button
      className={`assessment-audio-button ${className}`}
      onClick={() =>
        speakText(text, approvedAudioPath, {
          allowBrowserFallback: false,
          requireApprovedAudio: true,
          audioRole
        })
      }
      aria-label={label}
      type="button"
    >
      <span aria-hidden="true">🔊</span>
    </button>
  );
}
