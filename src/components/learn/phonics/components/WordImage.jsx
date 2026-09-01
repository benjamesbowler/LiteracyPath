import { useState } from "react";

export function WordImage({ src, word, className = "", priority = false }) {
  const [failedSrc, setFailedSrc] = useState("");
  const [loadedSrc, setLoadedSrc] = useState("");
  const initial = (word || "?")[0].toUpperCase();
  const failed = Boolean(src && failedSrc === src);
  const loaded = Boolean(src && loadedSrc === src);

  if (failed || !src) {
    return (
      <div className={`phonics-img-placeholder ${className}`} aria-label={word}>
        <span className="phonics-img-placeholder-letter">{initial}</span>
      </div>
    );
  }

  return (
    <span className={`phonics-img-frame ${className}`}>
      <img
        src={src}
        alt={word}
        className={loaded ? "is-loaded" : ""}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
      />
      {!loaded && (
        <span className="phonics-img-placeholder" aria-hidden="true">
          <span className="phonics-img-placeholder-letter">{initial}</span>
        </span>
      )}
    </span>
  );
}
