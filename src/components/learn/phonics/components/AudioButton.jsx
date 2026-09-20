import { memo, useCallback } from "react";
import { WoodlandAudioButton } from "../../../activities/WoodlandActivity.jsx";
import { hasPhonicsAudioSource, usePhonicsAudio } from "../../../../hooks/usePhonicsAudio";

const AudioButton = memo(function AudioButton({
  src,
  fallbackText,
  size = 80,
  className = ""
}) {
  const { play, isPlaying } = usePhonicsAudio(src, fallbackText);
  const canPlay = hasPhonicsAudioSource(src);

  const handleClick = useCallback(() => {
    play();
  }, [play]);

  if (!canPlay) return null;

  return (
    <WoodlandAudioButton
      onClick={handleClick}
      className={`phonics-audio-button wa-audio--icon ${className}`}
      style={{ "--phonics-audio-size": `${size}px` }}
      label="Play audio"
      aria-pressed={isPlaying}
    >{null}</WoodlandAudioButton>
  );
});

export default AudioButton;
