export function LearnCardImage({ image, label, className = "" }) {
  if (!image) {
    return <span className={`learn-card-image-fallback ${className}`.trim()} aria-hidden="true">{String(label || "?").slice(0, 1).toUpperCase()}</span>;
  }
  return <img alt="" className={`learn-card-image ${className}`.trim()} src={image} />;
}

export function LearnAudioButton({ audio, label = "Play audio" }) {
  if (!audio) return null;

  function playAudio(event) {
    event.stopPropagation();
    const sound = new Audio(audio);
    sound.play().catch(() => {});
  }

  return (
    <button className="learn-audio-icon-button" onClick={playAudio} type="button">
      {label}
    </button>
  );
}
