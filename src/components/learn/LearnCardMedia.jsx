import { useState } from "react";
import { resolveLearnAudio, resolveLearnImage } from "../../utils/mediaResolver.js";

export function LearnCardImage({ image, label, className = "" }) {
  const resolvedImage = resolveLearnImage(image, { label });
  const [failedImage, setFailedImage] = useState({ src: "", failed: false });
  const imageFailed = failedImage.failed && failedImage.src === resolvedImage.src;
  const fallbackLabel = String(resolvedImage.label || label || "?").slice(0, 1).toUpperCase();

  if (!resolvedImage.available || imageFailed) {
    return <span className={`learn-card-image-fallback ${className}`.trim()} aria-hidden="true">{fallbackLabel}</span>;
  }

  return (
    <img
      alt=""
      className={`learn-card-image ${className}`.trim()}
      onError={() => setFailedImage({ src: resolvedImage.src, failed: true })}
      src={resolvedImage.src}
    />
  );
}

export function LearnAudioButton({ audio, label = "Play audio" }) {
  const resolvedAudio = resolveLearnAudio(audio, { label });
  if (!resolvedAudio.available) return null;

  function playAudio(event) {
    event.stopPropagation();
    const sound = new Audio(resolvedAudio.src);
    sound.play().catch(error => {
      if (import.meta.env.DEV) {
        console.warn("Learn deck audio could not play.", { audio: resolvedAudio.src, error });
      }
    });
  }

  return (
    <button className="learn-audio-icon-button" onClick={playAudio} type="button">
      {label}
    </button>
  );
}
