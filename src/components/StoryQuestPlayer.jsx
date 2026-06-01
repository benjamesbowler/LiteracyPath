import { useEffect, useMemo, useRef, useState } from "react";

function StoryQuestImage({ src, title }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div className="story-quest-image-placeholder" role="img" aria-label={`Illustration placeholder for ${title}`}>
        <span>{title}</span>
      </div>
    );
  }

  return (
    <img
      alt={`Story illustration for ${title}`}
      className="story-quest-image"
      onError={() => setImageFailed(true)}
      src={src}
    />
  );
}

export function StoryQuestPlayer({ quest, onExit }) {
  const pageById = useMemo(() => {
    return new Map((quest?.pages || []).map(page => [page.id, page]));
  }, [quest]);

  const [currentPageId, setCurrentPageId] = useState(quest?.startPageId || quest?.pages?.[0]?.id || "");
  const [history, setHistory] = useState([]);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioChecking, setAudioChecking] = useState(false);
  const audioRef = useRef(null);

  const currentPage = pageById.get(currentPageId) || quest?.pages?.[0] || null;
  const currentPageNumber = quest?.pages?.findIndex(page => page.id === currentPage?.id) + 1 || 1;
  const totalPages = quest?.pages?.length || 0;

  useEffect(() => {
    setCurrentPageId(quest?.startPageId || quest?.pages?.[0]?.id || "");
    setHistory([]);
  }, [quest]);

  useEffect(() => {
    let cancelled = false;
    const audioUrl = currentPage?.audioUrl || "";
    setAudioAvailable(false);
    setAudioChecking(Boolean(audioUrl));

    if (!audioUrl || typeof Audio === "undefined") {
      setAudioChecking(false);
      return () => {
        cancelled = true;
      };
    }

    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (!cancelled) {
        setAudioAvailable(true);
        setAudioChecking(false);
      }
    };
    audio.onerror = () => {
      if (!cancelled) {
        setAudioAvailable(false);
        setAudioChecking(false);
      }
    };
    audio.src = audioUrl;
    try {
      audio.load();
    } catch {
      setAudioAvailable(false);
      setAudioChecking(false);
    }

    return () => {
      cancelled = true;
      audio.pause();
    };
  }, [currentPage?.audioUrl]);

  function stopAudio() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current = null;
  }

  function replayAudio() {
    if (!audioAvailable || !currentPage?.audioUrl) return;
    stopAudio();
    const audio = new Audio(currentPage.audioUrl);
    audioRef.current = audio;
    audio.play().catch(() => setAudioAvailable(false));
  }

  function goToPage(nextPageId) {
    if (!pageById.has(nextPageId)) return;
    stopAudio();
    setHistory(previous => [...previous, currentPageId]);
    setCurrentPageId(nextPageId);
  }

  function goBack() {
    stopAudio();
    setHistory(previous => {
      if (previous.length === 0) return previous;
      const next = previous.slice(0, -1);
      setCurrentPageId(previous[previous.length - 1]);
      return next;
    });
  }

  function restart() {
    stopAudio();
    setHistory([]);
    setCurrentPageId(quest?.startPageId || quest?.pages?.[0]?.id || "");
  }

  if (!quest || !currentPage) {
    return (
      <section className="story-quest-player card">
        <h2>Story Quest</h2>
        <p>This story is not available yet.</p>
        {onExit && (
          <button className="lp-button lp-button-secondary" onClick={onExit} type="button">
            Back
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="story-quest-player card" aria-label={`${quest.title} Story Quest`}>
      <header className="story-quest-header">
        <div>
          <span className="story-quest-kicker">Story Quest</span>
          <h2>{quest.title}</h2>
          <p>{quest.skillFocus} - {quest.cycleFocus}</p>
        </div>
        <div className="story-quest-header-actions">
          <button className="lp-button lp-button-secondary" disabled={history.length === 0} onClick={goBack} type="button">
            Back
          </button>
          <button className="lp-button lp-button-secondary" onClick={restart} type="button">
            Restart
          </button>
          {onExit && (
            <button className="lp-button lp-button-secondary" onClick={onExit} type="button">
              Close
            </button>
          )}
        </div>
      </header>

      <div className="story-quest-progress" aria-label={`Page ${currentPageNumber} of ${totalPages}`}>
        <span>Page {currentPageNumber} of {totalPages}</span>
        <div>
          <span style={{ width: `${totalPages ? (currentPageNumber / totalPages) * 100 : 0}%` }} />
        </div>
      </div>

      <StoryQuestImage src={currentPage.imageUrl} title={quest.title} />

      <div className="story-quest-read-row">
        <button
          className="lp-button lp-button-secondary story-quest-audio-button"
          disabled={!audioAvailable}
          onClick={replayAudio}
          type="button"
        >
          {audioChecking ? "Checking Audio" : audioAvailable ? "Replay Audio" : "Audio Coming Soon"}
        </button>
        <div className="story-quest-text" aria-live="polite">
          {(currentPage.text || []).map((line, index) => (
            <p key={`${currentPage.id}-${index}`}>{line}</p>
          ))}
        </div>
      </div>

      <div className="story-quest-choice-grid">
        {(currentPage.choices || []).slice(0, 2).map(choice => (
          <button
            className="story-quest-choice-button"
            disabled={!pageById.has(choice.nextPageId)}
            key={`${currentPage.id}-${choice.label}`}
            onClick={() => goToPage(choice.nextPageId)}
            type="button"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </section>
  );
}
