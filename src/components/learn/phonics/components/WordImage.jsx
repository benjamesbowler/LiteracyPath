import { useState } from "react";

export function WordImage({ src, word, className = "" }) {
  const [failed, setFailed] = useState(false);
  const initial = (word || "?")[0].toUpperCase();

  if (failed || !src) {
    return (
      <div className={`phonics-img-placeholder ${className}`} aria-label={word}>
        <span className="phonics-img-placeholder-letter">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={word}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
