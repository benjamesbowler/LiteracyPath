/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { useEffect, useMemo, useRef, useState } from "react";
import { preloadMediaSet } from "../utils/preloadMedia.js";
import { resolveStoryQuestResume } from "../utils/storyQuestProgress.js";
import { getLedaInstructionAudioPath } from "../data/ledaProductionAudio.js";
import { getStoryQuestLedaAudioPath } from "../data/storyQuestLedaAudio.js";
import {
  addBrowserFullscreenListener,
  exitBrowserFullscreen,
  getBrowserFullscreenElement,
  requestBrowserFullscreen
} from "../utils/browserFullscreen.js";
import { STOP_CHILD_AUDIO_EVENT } from "../utils/audio/childAudioLifecycle.js";
import { spellingAudioPaths, wordSrc } from "../utils/questAudio.js";
import { storyQuestDecisionText } from "../data/storyQuestReaderCopy.js";
import { StoryQuestSpeaker } from "./StoryQuestSpeaker.jsx";
import "./StoryQuestPlayer.css";

function tokenizeStoryQuestLine(line = "") {
  return String(line).match(/\S+|\s+/g) || [];
}

function StoryQuestText({ lines, onHearWord }) {
  const [focusedWord, setFocusedWord] = useState(0);
  let wordIndex = 0;
  function moveWordFocus(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const words = [...event.currentTarget.closest(".story-quest-text").querySelectorAll(".story-quest-word")];
    const current = words.indexOf(event.currentTarget);
    const next = event.key === "Home" ? 0 : event.key === "End" ? words.length - 1
      : Math.max(0, Math.min(words.length - 1, current + (event.key === "ArrowRight" ? 1 : -1)));
    words[next]?.focus();
  }
  return (
    <div className="story-quest-text">
      {lines.map((line, lineIndex) => (
        <p key={lineIndex} aria-label={line}>
          {tokenizeStoryQuestLine(line).map((token, tokenIndex) => {
            if (!/[A-Za-z]/.test(token)) return <span key={tokenIndex}>{token}</span>;
            const index = wordIndex++;
            return <button
              aria-label={`Hear ${token.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")}`}
              aria-describedby="story-quest-keyboard-hint"
              className="story-quest-word" key={tokenIndex} type="button"
              tabIndex={index === focusedWord ? 0 : -1}
              onFocus={() => setFocusedWord(index)} onKeyDown={moveWordFocus}
              onClick={() => onHearWord(token)}
            >{token}</button>;
          })}
        </p>
      ))}
      <span className="story-quest-word-hint">Tap a word to hear it.</span>
      <span className="story-quest-keyboard-hint" id="story-quest-keyboard-hint">Use left and right arrows to choose a word, then Enter to hear it. Tab moves to the story choices.</span>
    </div>
  );
}

function StoryQuestImage({ src, title, alt }) {
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
      alt={alt || title}
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
  if (!page) return "";
  const pageText = Array.isArray(page.text) ? page.text.join(" ") : page.text;
  const rebuiltAudioUrl = getStoryQuestLedaAudioPath(pageText);
  if (rebuiltAudioUrl) return rebuiltAudioUrl;
  if (page.narrationNeedsRebuild) return "";
  return getLedaInstructionAudioPath(pageText) || page.audioUrl || "";
}

function closeMoreMenuAndRun(event, action) {
  event.currentTarget.closest("details")?.removeAttribute("open");
  action();
}

function StoryQuestMoreMenu({ isFullscreen, onRestart, onToggleFullscreen }) {
  return (
    <details className="story-quest-more-menu">
      <summary className="lp-button lp-button-secondary" aria-label="More story controls">
        More
      </summary>
      <div className="story-quest-more-actions" aria-label="More story controls" role="group">
        <button
          className="lp-button lp-button-secondary"
          onClick={event => closeMoreMenuAndRun(event, onRestart)}
          type="button"
        >
          Start over
        </button>
        <button
          className="lp-button lp-button-secondary"
          onClick={event => closeMoreMenuAndRun(event, onToggleFullscreen)}
          type="button"
        >
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </button>
      </div>
    </details>
  );
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

  const getInitialRoute = () => resolveStoryQuestResume(quest, initialProgress, initialPageId);
  const [currentPageId, setCurrentPageId] = useState(() => getInitialRoute().pageId);
  const [history, setHistory] = useState(() => getInitialRoute().history);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioChecking, setAudioChecking] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeWordSupport, setActiveWordSupport] = useState(null);
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const headingRef = useRef(null);
  const previousPageRef = useRef(currentPageId);
  const wordSupportPlaybackTokenRef = useRef(0);

  const currentPage = pageById.get(currentPageId) || quest?.pages?.[0] || null;
  const activeWordCard = (quest?.wordCards || []).find(card => card.word?.toLowerCase() === activeWordSupport?.word?.toLowerCase());
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
          .flatMap(page => {
            const printedWords = new Set((page.text || []).join(" ").toLowerCase().match(/[a-z]+(?:['’][a-z]+)*/g) || []);
            return (page.skillTags || []).filter(tag => printedWords.has(String(tag).toLowerCase()));
          })
      ]
        .map(tag => String(tag).toLowerCase())
        .filter(tag => targetWords.has(tag))
    ));
  }, [initialWordSignature, quest, visitedPageIds]);
  const progressSnapshot = useMemo(() => ({
    lastPageId: currentPageId,
    targetWordCount: quest?.targetWords?.length || 0,
    visitedPageCount: visitedPageIds.size,
    visitedPageIds: Array.from(visitedPageIds),
    wordsFound: foundWords,
    wordsFoundCount: foundWords.length,
    contentRevision: quest?.contentRevision || "",
    routeFinished: isComplete
  }), [currentPageId, foundWords, quest?.targetWords, quest?.contentRevision, visitedPageIds, isComplete]);

  useEffect(() => {
    if (!currentPageId || isComplete) return;
    onProgress?.(currentPageId, progressSnapshot);
  }, [currentPageId, isComplete, onProgress, progressSnapshot]);

  useEffect(() => {
    setActiveWordSupport(null);
    setAudioError("");
    if (previousPageRef.current !== currentPageId) {
      headingRef.current?.focus({ preventScroll: true });
      const scroller = playerRef.current?.closest(".story-quest-active-page");
      scroller?.scrollTo({ top: 0, behavior: "instant" });
      playerRef.current?.scrollTo({ top: 0, behavior: "instant" });
      previousPageRef.current = currentPageId;
    }
  }, [currentPageId]);

  useEffect(() => {
    const stopForRouteChange = () => {
      wordSupportPlaybackTokenRef.current += 1;
      const audio = audioRef.current;
      audioRef.current = null;
      audio?.pause();
      setIsAudioPlaying(false);
    };
    window.addEventListener(STOP_CHILD_AUDIO_EVENT, stopForRouteChange);
    return () => {
      window.removeEventListener(STOP_CHILD_AUDIO_EVENT, stopForRouteChange);
      wordSupportPlaybackTokenRef.current += 1;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

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
      setIsFullscreen(getBrowserFullscreenElement(document) === playerRef.current);
    }

    return addBrowserFullscreenListener(document, handleFullscreenChange);
  }, []);

  function stopAudio() {
    wordSupportPlaybackTokenRef.current += 1;
    setIsAudioPlaying(false);
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current = null;
  }

  async function playWordSupportSequence(paths) {
    stopAudio();
    if (!paths.length) return;
    setAudioError("");
    const playbackToken = wordSupportPlaybackTokenRef.current;
    setIsAudioPlaying(true);

    for (const path of paths) {
      if (playbackToken !== wordSupportPlaybackTokenRef.current) return;
      const played = await new Promise(resolve => {
        const audio = new Audio(path);
        audioRef.current = audio;
        audio.playbackRate = 1;
        audio.onended = () => resolve(true);
        audio.onpause = () => resolve(false);
        audio.onerror = () => resolve(false);
        audio.play().catch(() => resolve(false));
      });
      if (!played && playbackToken === wordSupportPlaybackTokenRef.current) {
        setAudioError("That audio could not play. Tap to hear it again.");
        break;
      }
    }

    if (playbackToken === wordSupportPlaybackTokenRef.current) {
      audioRef.current = null;
      setIsAudioPlaying(false);
    }
  }

  function handleStoryWordClick(displayedWord) {
    const word = String(displayedWord || "").replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "");
    if (!word) return;
    const path = getStoryQuestLedaAudioPath(word) || wordSrc(word);
    setActiveWordSupport({ word, audioAvailable: Boolean(path) });
    if (path) void playWordSupportSequence([path]);
  }

  function hearText(text) {
    const path = getStoryQuestLedaAudioPath(text) || getLedaInstructionAudioPath(text);
    if (path) void playWordSupportSequence([path]);
  }

  function replayAudio() {
    if (audioAvailable && currentAudioUrl) void playWordSupportSequence([currentAudioUrl]);
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
      onComplete?.({ ...progressSnapshot, routeFinished: true, endingPageId: currentPageId });
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
      if (getBrowserFullscreenElement(document) === player) {
        await exitBrowserFullscreen(document);
      } else if (player.requestFullscreen || player.webkitRequestFullscreen) {
        await requestBrowserFullscreen(player);
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
    if (typeof document !== "undefined" && getBrowserFullscreenElement(document) === playerRef.current) {
      void exitBrowserFullscreen(document);
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

  const decisionText = storyQuestDecisionText(currentPage);
  const decisionAudio = getStoryQuestLedaAudioPath(decisionText) || getLedaInstructionAudioPath(decisionText);

  return (
    <section
      className={["story-quest-player story-quest-reader card", previewMode ? "story-quest-preview-reader" : "", isFullscreen ? "fullscreen" : "", isComplete ? "story-quest-reader-complete" : ""].filter(Boolean).join(" ")}
      ref={playerRef}
      aria-label={`${quest.title} ${isComplete ? "complete" : "Story Quest"}`}
      data-page-id={currentPage.id}
    >
      <header className="story-quest-header">
        {onExit && <button className="lp-button lp-button-secondary" onClick={exitReader} type="button" aria-label="Back to Story Quests">Back</button>}
        <div className="story-quest-heading">
          <h1 ref={headingRef} tabIndex={-1}>{quest.shortTitle || quest.title}</h1>
          <span className="story-quest-position" role="status">{isComplete ? "The end" : `Scene ${currentSceneNumber}`}</span>
          {previewMode && <span className="story-quest-preview-badge">Student progress is not saved</span>}
        </div>
        <StoryQuestMoreMenu isFullscreen={isFullscreen} onRestart={restart} onToggleFullscreen={toggleFullscreen} />
      </header>

      <div className="story-quest-image-stage">
        <StoryQuestImage src={currentPage.imageUrl} title={quest.title} alt={currentPage.imageAlt} />
      </div>

      <div className="story-quest-read-row">
        <button
          className={`lp-button lp-button-secondary story-quest-audio-button${isAudioPlaying ? " audio-feedback-playing" : ""}`}
          disabled={!audioAvailable}
          onClick={isAudioPlaying ? stopAudio : replayAudio}
          type="button"
          aria-label={isAudioPlaying ? "Stop audio" : "Hear the story"}
        >
          <StoryQuestSpeaker />
          {audioChecking ? "Loading audio" : isAudioPlaying ? "Stop" : audioAvailable ? "Hear the story" : "Audio unavailable"}
        </button>
        <StoryQuestText key={currentPage.id} lines={currentPage.text || []} onHearWord={handleStoryWordClick} />
        {audioError && <p className="story-quest-audio-error" role="status">{audioError}</p>}
        {activeWordSupport && (
          <div className="story-quest-word-support" role="group" aria-label={`Word help for ${activeWordSupport.word}`}>
            {activeWordCard && <img className="story-quest-word-picture" src={activeWordCard.imageUrl} alt={`Illustration of ${activeWordCard.word}`} />}
            <strong>{activeWordSupport.word}</strong>
            <button type="button" onClick={() => handleStoryWordClick(activeWordSupport.word)} disabled={!activeWordSupport.audioAvailable}>Hear the word</button>
            <button type="button" onClick={() => playWordSupportSequence(spellingAudioPaths(activeWordSupport.word))} disabled={!spellingAudioPaths(activeWordSupport.word).length}>Hear the letters</button>
            <button type="button" aria-label="Close word help" onClick={() => setActiveWordSupport(null)}>×</button>
          </div>
        )}
      </div>

      <div className="story-quest-decision" aria-label={isComplete ? "Read another story" : "Choose what happens next"}>
        {isComplete ? (
          <>
            <div className="story-quest-decision-heading">
              <p className="story-quest-choice-prompt">{currentPage.replayPrompt || "Try a different path."}</p>
              <button className="story-quest-hear" type="button" aria-label="Hear the ending options" onClick={() => playWordSupportSequence([currentPage.replayPrompt || "Try a different path.", "Read again", "Choose a story"].map(text => getStoryQuestLedaAudioPath(text) || getLedaInstructionAudioPath(text)).filter(Boolean))}><StoryQuestSpeaker /></button>
            </div>
            <div className="story-quest-choice-grid">
              <button className="story-quest-choice-button" onClick={restart} type="button">Read again</button>
              {onExit && <button className="story-quest-choice-button" onClick={exitReader} type="button">Choose a story</button>}
            </div>
          </>
        ) : (
          <>
            {currentPage.choices?.length > 1 && (
              <div className="story-quest-decision-heading">
                <p className="story-quest-choice-prompt">{currentPage.choicePrompt}</p>
                <button className="story-quest-hear" type="button" onClick={() => hearText(decisionText)} disabled={!decisionAudio} aria-label="Hear the choices"><StoryQuestSpeaker /></button>
              </div>
            )}
            <div className={`story-quest-choice-grid${currentPage.choices?.length === 1 ? " single" : ""}`}>
              {(currentPage.choices || []).map(choice => (
                <div className="story-quest-choice" key={`${currentPage.id}-${choice.label}`}>
                  <button className="story-quest-choice-button" disabled={choice.nextPageId !== "end" && !pageById.has(choice.nextPageId)} onClick={() => goToPage(choice)} type="button">{choice.label}</button>
                  <button className="story-quest-hear" type="button" aria-label={`Hear choice: ${choice.label}`} onClick={() => hearText(choice.label)} disabled={!getStoryQuestLedaAudioPath(choice.label) && !getLedaInstructionAudioPath(choice.label)}><StoryQuestSpeaker /></button>
                </div>
              ))}
            </div>
            <button className="story-quest-previous" disabled={history.length === 0} onClick={goBack} type="button">Previous scene</button>
          </>
        )}
      </div>
    </section>
  );
}
