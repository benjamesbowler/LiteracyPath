/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { preloadMediaSet } from "../utils/preloadMedia.js";
import { buildStoryQuestResumeHistory } from "../utils/storyQuestProgress.js";
import "./StoryQuestPlayer.css";

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
      decoding="async"
      fetchPriority="high"
      loading="eager"
      onError={() => setImageFailed(true)}
      src={src}
    />
  );
}

function getStoryQuestPageAudioUrl(page) {
  if (!page || page.narrationNeedsRebuild) return "";
  return page.audioUrl || "";
}

export function StoryQuestPlayer({
  quest,
  initialPageId = "",
  initialProgress = {},
  onComplete,
  onExit,
  onProgress,
  previewMode = false
}) {
  const pageById = useMemo(() => {
    return new Map((quest?.pages || []).map(page => [page.id, page]));
  }, [quest]);

  const getStartPageId = useCallback(() =>
    initialPageId && pageById.has(initialPageId)
      ? initialPageId
      : quest?.startPageId || quest?.pages?.[0]?.id || "", [initialPageId, pageById, quest]);
  const getInitialHistory = useCallback(() => buildStoryQuestResumeHistory({
    currentPageId: getStartPageId(),
    progress: initialProgress,
    validPageIds: Array.from(pageById.keys())
  }), [getStartPageId, initialProgress, pageById]);

  const [currentPageId, setCurrentPageId] = useState(getStartPageId);
  const [history, setHistory] = useState(getInitialHistory);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioChecking, setAudioChecking] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const audioRef = useRef(null);
  const playerRef = useRef(null);

  const currentPage = pageById.get(currentPageId) || quest?.pages?.[0] || null;
  const currentAudioUrl = getStoryQuestPageAudioUrl(currentPage);
  const currentSceneNumber = history.length + 1;
  const visitedPageIds = useMemo(() => new Set([...history, currentPageId].filter(Boolean)), [currentPageId, history]);
  const initialWordSignature = (Array.isArray(initialProgress?.wordsFound)
    ? initialProgress.wordsFound
    : [])
    .map(word => String(word || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("\u0000");
  const foundWords = useMemo(() => {
    const targetWords = new Set((quest?.targetWords || []).map(word => word.toLowerCase()));
    return Array.from(new Set(
      [
        ...(initialWordSignature ? initialWordSignature.split("\u0000") : []),
        ...(quest?.pages || [])
          .filter(page => visitedPageIds.has(page.id))
          .flatMap(page => page.skillTags || [])
      ]
        .map(tag => String(tag).toLowerCase())
        .filter(tag => targetWords.has(tag))
    ));
  }, [initialWordSignature, quest, visitedPageIds]);
  const targetWordTotal = quest?.targetWords?.length || 0;
  const wordProgressPercent = targetWordTotal ? (foundWords.length / targetWordTotal) * 100 : 0;
  const currentPageWords = (currentPage?.skillTags || [])
    .filter(tag => !["short_a", "hfw_1_25"].includes(String(tag).toLowerCase()))
    .slice(0, 4);
  const progressSnapshot = useMemo(() => ({
    lastPageId: currentPageId,
    targetWordCount: quest?.targetWords?.length || 0,
    visitedPageCount: visitedPageIds.size,
    visitedPageIds: Array.from(visitedPageIds),
    wordsFound: foundWords,
    wordsFoundCount: foundWords.length
  }), [currentPageId, foundWords, quest?.targetWords, visitedPageIds]);

  useEffect(() => {
    if (!currentPageId || isComplete) return;
    onProgress?.(currentPageId, progressSnapshot);
  }, [currentPageId, isComplete, onProgress, progressSnapshot]);

  useEffect(() => {
    let cancelled = false;
    const audioUrl = currentAudioUrl;
    setAudioAvailable(false);
    setAudioChecking(Boolean(audioUrl));
    setIsAudioPlaying(false);

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
  }, [currentAudioUrl]);

  useEffect(() => {
    if (!currentPage) return;
    const nextPages = (currentPage.choices || [])
      .filter(choice => choice.nextPageId !== "end")
      .map(choice => pageById.get(choice.nextPageId))
      .filter(Boolean);
    void preloadMediaSet({
      images: [currentPage.imageUrl, ...nextPages.map(page => page.imageUrl)],
      audio: [currentAudioUrl, ...nextPages.map(getStoryQuestPageAudioUrl)]
    });
  }, [currentAudioUrl, currentPage, pageById]);

  useEffect(() => {
    if (!isComplete) return;
    const startPage = pageById.get(quest?.startPageId) || quest?.pages?.[0] || null;
    if (!startPage) return;
    void preloadMediaSet({
      images: [startPage.imageUrl],
      audio: [getStoryQuestPageAudioUrl(startPage)]
    });
  }, [isComplete, pageById, quest]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function stopAudio() {
    setIsAudioPlaying(false);
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current = null;
  }

  function replayAudio() {
    if (!audioAvailable || !currentAudioUrl) return;
    stopAudio();
    const audio = new Audio(currentAudioUrl);
    audioRef.current = audio;
    audio.onended = () => {
      audioRef.current = null;
      setIsAudioPlaying(false);
    };
    audio.onerror = () => {
      audioRef.current = null;
      setIsAudioPlaying(false);
      setAudioAvailable(false);
    };
    audio.play()
      .then(() => setIsAudioPlaying(true))
      .catch(() => {
        audioRef.current = null;
        setIsAudioPlaying(false);
        setAudioAvailable(false);
      });
  }

  function goToPage(choice) {
    const nextPageId = choice?.nextPageId;
    const isReplayChoice = nextPageId === (quest?.startPageId || quest?.pages?.[0]?.id)
      && String(choice?.label || "").trim().toLowerCase() === "read again";
    if (isReplayChoice) {
      restart();
      return;
    }
    if (nextPageId === "end") {
      stopAudio();
      setIsComplete(true);
      onComplete?.(progressSnapshot);
      return;
    }
    if (!pageById.has(nextPageId)) return;
    stopAudio();
    setHistory(previous => [...previous, currentPageId]);
    setCurrentPageId(nextPageId);
    setIsComplete(false);
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
    setIsComplete(false);
  }

  async function toggleFullscreen() {
    const player = playerRef.current;
    if (!player || typeof document === "undefined") {
      setIsFullscreen(value => !value);
      return;
    }

    try {
      if (document.fullscreenElement === player) {
        await document.exitFullscreen();
      } else if (player.requestFullscreen) {
        await player.requestFullscreen();
      } else {
        setIsFullscreen(value => !value);
      }
    } catch (error) {
      console.warn("Story Quest fullscreen toggle unavailable.", error);
      setIsFullscreen(value => !value);
    }
  }

  function exitReader() {
    stopAudio();
    if (typeof document !== "undefined" && document.fullscreenElement === playerRef.current) {
      document.exitFullscreen?.().catch(() => {});
    }
    onExit?.();
  }

  if (!quest || !currentPage) {
    return (
      <section className="story-quest-player card">
        <h1>Story Quest</h1>
        <p>This story is not available yet.</p>
        {onExit && (
          <button className="lp-button lp-button-secondary" onClick={onExit} type="button">
            Back
          </button>
        )}
      </section>
    );
  }

  if (isComplete) {
    return (
      <section
        aria-label={`${quest.title} complete`}
        className={[
          "story-quest-player story-quest-reader story-quest-reader-complete card",
          previewMode ? "story-quest-preview-reader" : "",
          isFullscreen ? "fullscreen" : ""
        ].filter(Boolean).join(" ")}
        ref={playerRef}
      >
        <header className="story-quest-header">
          <div>
            <span className="story-quest-kicker">{previewMode ? "Teacher preview" : "Reading adventure"}</span>
            <h1>{quest.title}</h1>
            <p>Adventure complete</p>
            {previewMode && (
              <span className="story-quest-preview-badge" role="status">
                Student progress is not saved
              </span>
            )}
          </div>
          <div className="story-quest-header-actions">
            <button className="lp-button lp-button-secondary" onClick={toggleFullscreen} type="button">
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
          </div>
        </header>

        <div className="story-quest-image-placeholder story-quest-complete-panel" role="img" aria-label={`${quest.title} complete`}>
          <span>Great reading!</span>
        </div>

        <div className="story-quest-choice-grid">
          <button className="story-quest-choice-button" onClick={restart} type="button">
            Read again
          </button>
          {onExit && (
            <button className="story-quest-choice-button" onClick={exitReader} type="button">
              Back to Story Quests
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className={[
        "story-quest-player story-quest-reader card",
        previewMode ? "story-quest-preview-reader" : "",
        isFullscreen ? "fullscreen" : ""
      ].filter(Boolean).join(" ")}
      ref={playerRef}
      aria-label={`${quest.title} Story Quest`}
    >
      <header className="story-quest-header">
        <div>
          <span className="story-quest-kicker">{previewMode ? "Teacher preview" : quest.adventureType || "Read"}</span>
          <h1>{quest.title}</h1>
          {previewMode && (
            <span className="story-quest-preview-badge" role="status">
              Student progress is not saved
            </span>
          )}
        </div>
        <div className="story-quest-header-actions">
          <button className="lp-button lp-button-secondary" disabled={history.length === 0} onClick={goBack} type="button">
            Previous scene
          </button>
          <button className="lp-button lp-button-secondary" onClick={restart} type="button">
            Restart story
          </button>
          <button className="lp-button lp-button-secondary" onClick={toggleFullscreen} type="button">
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
          {onExit && (
            <button className="lp-button lp-button-secondary" onClick={exitReader} type="button">
              Back to Story Quests
            </button>
          )}
        </div>
      </header>

      <div
        className="story-quest-progress"
        aria-label={`Scene ${currentSceneNumber} on this route. ${foundWords.length} of ${targetWordTotal} story words seen.`}
        role="status"
      >
        <div className="story-quest-progress-top">
          <span>Scene {currentSceneNumber}</span>
          <span>{foundWords.length}/{targetWordTotal} story words seen</span>
        </div>
        <div className="story-quest-progress-bar">
          <span style={{ width: `${wordProgressPercent}%` }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          className="story-quest-image-stage"
          key={`${currentPage.id}-image`}
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={{ duration: 0.24 }}
        >
          <StoryQuestImage src={currentPage.imageUrl} title={quest.title} />
        </motion.div>
      </AnimatePresence>

      <div className="story-quest-read-row">
        <button
          className={[
            "lp-button lp-button-secondary story-quest-audio-button",
            audioChecking ? "audio-feedback-loading" : "",
            isAudioPlaying ? "audio-feedback-playing" : ""
          ].filter(Boolean).join(" ")}
          disabled={!audioAvailable}
          onClick={replayAudio}
          type="button"
        >
          {audioChecking && <span className="audio-loading-dot" aria-hidden="true" />}
          {audioChecking
            ? "Checking audio"
            : isAudioPlaying
              ? "Playing audio"
              : audioAvailable
                ? "Replay audio"
                : currentAudioUrl
                  ? "Audio unavailable"
                  : "No audio for this scene"}
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
            className="story-quest-text"
            exit={{ opacity: 0, y: -6 }}
            initial={{ opacity: 0, y: 8 }}
            key={`${currentPage.id}-text`}
            transition={{ duration: 0.2 }}
          >
            {(currentPage.text || []).map((line, index) => (
              <p key={`${currentPage.id}-${index}`}>{line}</p>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="story-quest-word-panel" aria-label="Story words seen">
        <span>{foundWords.length}/{targetWordTotal} story words seen</span>
        <div>
          {(quest.targetWords || []).map(word => {
            const normalizedWord = word.toLowerCase();
            const found = foundWords.includes(normalizedWord);
            const current = currentPageWords.map(item => String(item).toLowerCase()).includes(normalizedWord);
            return (
              <span className={[found ? "found" : "", current ? "current" : ""].filter(Boolean).join(" ")} key={word}>
                {word}
              </span>
            );
          })}
        </div>
      </div>

      <div className="story-quest-decision" aria-label="Choose what happens next">
        {currentPage.choicePrompt && (
          <div className="story-quest-choice-prompt" aria-live="polite">
            {currentPage.choicePrompt}
          </div>
        )}

        <div className="story-quest-choice-grid">
          {(currentPage.choices || []).slice(0, 2).map(choice => (
            <button
              className="story-quest-choice-button"
              disabled={choice.nextPageId !== "end" && !pageById.has(choice.nextPageId)}
              key={`${currentPage.id}-${choice.label}`}
              onClick={() => goToPage(choice)}
              type="button"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
