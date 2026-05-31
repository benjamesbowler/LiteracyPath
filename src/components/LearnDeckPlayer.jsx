import { useEffect, useState } from "react";
import { LearnDeckInteractionLayer } from "./LearnDeckInteractionLayer.jsx";
import { resolveDeckSlideImage, resolveLearnAudio, resolveLearnImage } from "../utils/mediaResolver.js";

function getYouTubeEmbedUrl(value = "") {
  const rawUrl = String(value || "").trim();
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.replace("/", "");
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
    }
    if (url.hostname.endsWith("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return rawUrl;
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

function LearnDeckVideo({ slide }) {
  const localVideo = slide?.video || slide?.videoPath || "";
  const embedUrl = slide?.embedUrl || getYouTubeEmbedUrl(slide?.videoUrl);

  if (localVideo) {
    return (
      <video className="learn-deck-video" controls preload="metadata" src={localVideo}>
        Video playback is not available in this browser.
      </video>
    );
  }

  if (embedUrl) {
    return (
      <iframe
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="learn-deck-video"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embedUrl}
        title={slide?.alt || slide?.prompt || "Learn deck video"}
      />
    );
  }

  return (
    <div className="learn-deck-image-placeholder">
      <span>Video needed</span>
      <strong>{slide?.prompt || "Playable video will appear here."}</strong>
      <small>Static video placeholder slides are hidden until a playable video source is added.</small>
    </div>
  );
}

function LearnDeckSlideImage({ slide, deck }) {
  const [failedImage, setFailedImage] = useState({ src: "", failed: false });
  if (slide?.type === "video") return <LearnDeckVideo slide={slide} />;

  const resolvedImage = resolveDeckSlideImage(slide, { label: slide?.alt || deck?.title });
  const imageFailed = failedImage.failed && failedImage.src === resolvedImage.src;

  if (!resolvedImage.available || imageFailed) {
    return (
      <div className="learn-deck-image-placeholder">
        <span>Slide image needed</span>
        <strong>{deck?.title}</strong>
        <small>{resolvedImage.label || slide?.id || "Teacher-created slide visual will appear here."}</small>
      </div>
    );
  }

  return (
    <img
      alt={slide.alt || `${deck.title} slide`}
      className="learn-deck-slide-image"
      onError={() => setFailedImage({ src: resolvedImage.src, failed: true })}
      src={resolvedImage.src}
    />
  );
}

function LearnDeckTeacherLinks({ slide }) {
  if (!slide?.links?.length) return null;

  return (
    <div className="learn-deck-teacher-links" aria-label="Teacher resources">
      {slide.links.map(link => (
        <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
          {link.label || "Open teacher resource"}
        </a>
      ))}
    </div>
  );
}

function collectLearnDeckMediaWarnings(deck) {
  return (deck?.slides || []).flatMap(slide => {
    const warnings = [];
    if (slide.image && !resolveDeckSlideImage(slide).available) {
      warnings.push({ slideId: slide.id, mediaType: "slide-image", value: slide.image });
    }

    (slide.cards || []).forEach(card => {
      if (card.image && !resolveLearnImage(card.image, { label: card.label }).available) {
        warnings.push({ slideId: slide.id, cardId: card.id, mediaType: "card-image", value: card.image });
      }
      if (card.audio && !resolveLearnAudio(card.audio, { label: card.label }).available) {
        warnings.push({ slideId: slide.id, cardId: card.id, mediaType: "card-audio", value: card.audio });
      }
    });

    (slide.groups || []).forEach(group => {
      (group.words || []).forEach(word => {
        if (word.image && !resolveLearnImage(word.image, { label: word.label }).available) {
          warnings.push({ slideId: slide.id, wordId: word.id, mediaType: "word-image", value: word.image });
        }
        if (word.audio && !resolveLearnAudio(word.audio, { label: word.label }).available) {
          warnings.push({ slideId: slide.id, wordId: word.id, mediaType: "word-audio", value: word.audio });
        }
      });
    });

    return warnings;
  });
}

export function LearnDeckPlayer({ deck, onExit }) {
  const [slideState, setSlideState] = useState({ deckId: "", index: 0 });
  const slides = deck?.slides || [];
  const deckId = deck?.id || "";
  const slideIndex = slideState.deckId === deckId ? slideState.index : 0;
  const slide = slides[slideIndex] || slides[0];
  const canGoPrevious = slideIndex > 0;
  const canGoNext = slideIndex < slides.length - 1;

  function setSlideIndex(nextIndexOrUpdater) {
    setSlideState(current => {
      const currentIndex = current.deckId === deckId ? current.index : 0;
      const nextIndex = typeof nextIndexOrUpdater === "function"
        ? nextIndexOrUpdater(currentIndex)
        : nextIndexOrUpdater;
      return { deckId, index: nextIndex };
    });
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onExit?.();
      if (event.key === "ArrowLeft") setSlideIndex(index => Math.max(index - 1, 0));
      if (event.key === "ArrowRight") setSlideIndex(index => Math.min(index + 1, slides.length - 1));
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onExit, slides.length]);

  useEffect(() => {
    if (!import.meta.env.DEV || !deck) return;
    const warnings = collectLearnDeckMediaWarnings(deck);
    if (warnings.length) {
      console.warn("Learn deck has media paths that the resolver will treat as unavailable.", {
        deckId: deck.id,
        warnings
      });
    }
  }, [deck]);

  if (!deck) return null;

  return (
    <div className="learn-created-deck-fullscreen" role="dialog" aria-modal="true" aria-label={`${deck.title} interactive Learn deck`}>
      <header className="learn-created-deck-header">
        <strong>{slide?.prompt || slide?.alt || deck.title}</strong>
        <span className="learn-created-slide-counter">Slide {slideIndex + 1} of {slides.length}</span>
        <button className="lp-button lp-button-secondary" onClick={onExit} type="button">Exit</button>
      </header>
      <nav className="learn-progress-strip" aria-label={`Deck progress slide ${slideIndex + 1} of ${slides.length}`}>
        {slides.map((item, index) => (
          <button
            aria-label={`Go to slide ${index + 1}: ${item.prompt || item.alt || item.id || deck.title}`}
            className={index === slideIndex ? "active" : ""}
            key={item.id || `${deck.id}-slide-${index}`}
            onClick={() => setSlideIndex(index)}
            type="button"
          >
            <span></span>
          </button>
        ))}
      </nav>
      <main className="learn-created-deck-stage">
        <LearnDeckSlideImage deck={deck} slide={slide} />
        <LearnDeckInteractionLayer slide={slide} />
      </main>
      <footer className="learn-created-deck-footer">
        <button className="lp-button lp-button-secondary" disabled={!canGoPrevious} onClick={() => setSlideIndex(index => Math.max(index - 1, 0))} type="button">Previous</button>
        <div className="learn-created-deck-footer-note">
          <strong>{slide?.prompt || slide?.alt || deck.title}</strong>
          <LearnDeckTeacherLinks slide={slide} />
        </div>
        <button className="lp-button lp-button-primary" disabled={!canGoNext} onClick={() => setSlideIndex(index => Math.min(index + 1, slides.length - 1))} type="button">Next</button>
      </footer>
    </div>
  );
}
