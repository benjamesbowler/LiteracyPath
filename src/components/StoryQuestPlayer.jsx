/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowArcLeft, ArrowBendDownRight, BookOpen, Ear, Eye, Footprints, HandHeart, HandTap, Hourglass, Signpost, Sparkle } from "@phosphor-icons/react";
import { preloadMediaSet } from "../utils/preloadMedia.js";
import { resolveStoryQuestResume } from "../utils/storyQuestProgress.js";
import { encodeStoryQuestCheckpoint, isStoryQuestEnding, storyQuestEndingIds, storyQuestReplayFork } from "../utils/storyQuestRoutes.js";
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
import { storyQuestDecisionText, storyQuestEndingCountText, storyQuestEndingText, storyQuestPlayText } from "../data/storyQuestReaderCopy.js";
import { StoryQuestSpeaker } from "./StoryQuestSpeaker.jsx";
import { ImmersiveReader } from "./guided-reading/ImmersiveReader.jsx";
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
      <span className="story-quest-keyboard-hint" id="story-quest-keyboard-hint">Use left and right arrows to choose a word, then Enter to hear it. Tab moves to the next story control.</span>
    </div>
  );
}

function StoryQuestImage({ src, title, alt, action }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageBounds, setImageBounds] = useState(null);
  const imageRef = useRef(null);
  const target = action?.target;
  const showFocus = Boolean(target);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || imageFailed || !showFocus) return;

    function measure() {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const scale = Math.min(image.clientWidth / image.naturalWidth, image.clientHeight / image.naturalHeight);
      setImageBounds({
        width: image.naturalWidth * scale,
        height: image.naturalHeight * scale
      });
    }

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(image);
    image.addEventListener("load", measure);
    measure();
    return () => {
      observer?.disconnect();
      image.removeEventListener("load", measure);
    };
  }, [imageFailed, showFocus]);

  if (!src || imageFailed) {
    return (
      <div className="story-quest-image-placeholder" role="img" aria-label={`Illustration placeholder for ${title}`}>
        <span>{title}</span>
      </div>
    );
  }

  return <>
    <img
      alt={alt || title}
      className="story-quest-image"
      decoding="async"
      fetchPriority="high"
      loading="eager"
      onError={() => setImageFailed(true)}
      ref={imageRef}
      src={src}
    />
    {target && imageBounds && (
      <span className="story-quest-illustration-focus" key={action.label} aria-hidden="true"
        style={{
          left: `calc(50% + ${(target[0] / 100 - 0.5) * imageBounds.width}px)`,
          top: `calc(50% + ${(target[1] / 100 - 0.5) * imageBounds.height}px)`
        }}
      />
    )}
  </>;
}

function getStoryQuestPageAudioUrl(page) {
  if (!page) return "";
  const pageText = Array.isArray(page.text) ? page.text.join(" ") : page.text;
  const rebuiltAudioUrl = getStoryQuestLedaAudioPath(pageText);
  if (rebuiltAudioUrl) return rebuiltAudioUrl;
  if (page.narrationNeedsRebuild) return "";
  return getLedaInstructionAudioPath(pageText) || page.audioUrl || "";
}

function speechPath(text) {
  if (!text) return "";
  return getStoryQuestLedaAudioPath(text) || getLedaInstructionAudioPath(text);
}

const ACTION_ICONS = { look: Eye, listen: Ear, help: HandHeart, move: Footprints, wait: Hourglass, touch: HandTap };

function SceneActions({ play, active, imageUrl, onHear, onAct }) {
  const feedbackRef = useRef(null);
  const instructions = storyQuestPlayText(play);

  useEffect(() => {
    if (active) feedbackRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <section className="story-quest-play" aria-label="Explore the scene">
      <div className="story-quest-play-head">
        <HandTap size={22} weight="duotone" aria-hidden="true" />
        <p>{play.prompt}</p>
        <button className="story-quest-hear" type="button" aria-label="Hear the scene actions"
          onClick={() => onHear(instructions)} disabled={!speechPath(instructions)}><StoryQuestSpeaker /></button>
      </div>
      <div className="story-quest-play-actions">
        {play.actions.map(action => {
          const Icon = ACTION_ICONS[action.icon];
          return (
            <button className="story-quest-play-action" key={action.label} type="button"
              aria-pressed={action === active}
              onClick={() => onAct(action)}>
              <Icon size={22} weight="duotone" aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
      <div className="story-quest-play-feedback" aria-live="polite" ref={feedbackRef}>
        {active && (
          <div className="story-quest-play-reveal" key={active.label}>
            <Sparkle size={20} weight="fill" aria-hidden="true" />
            {active.target && (
              <span className="story-quest-play-detail" aria-hidden="true">
                <img src={imageUrl} alt="" style={{ transform: `translate(-${active.target[0]}%, -${active.target[1]}%)` }} />
              </span>
            )}
            <p>{active.reveal}</p>
            <button className="story-quest-hear" type="button" aria-label="Hear what you found"
              onClick={() => onHear(active.reveal)} disabled={!speechPath(active.reveal)}><StoryQuestSpeaker /></button>
          </div>
        )}
      </div>
    </section>
  );
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

  const [{ pageId: currentPageId, history }, setRoute] = useState(() => resolveStoryQuestResume(quest, initialProgress, initialPageId));
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [audioChecking, setAudioChecking] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportFullscreen, setViewportFullscreen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionEndings, setSessionEndings] = useState([]);
  const [sessionScenes, setSessionScenes] = useState([]);
  const [activeWordSupport, setActiveWordSupport] = useState(null);
  const [sceneAction, setSceneAction] = useState(null);
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const headingRef = useRef(null);
  const endingHeadingRef = useRef(null);
  const previousPageRef = useRef(currentPageId);
  const wordSupportPlaybackTokenRef = useRef(0);

  const currentPage = pageById.get(currentPageId) || quest?.pages?.[0] || null;
  const activeWordCard = (quest?.wordCards || []).find(card => card.word?.toLowerCase() === activeWordSupport?.word?.toLowerCase());
  const currentAudioUrl = getStoryQuestPageAudioUrl(currentPage);
  const currentSceneNumber = history.length + 1;
  const endingPages = useMemo(() => [...pageById.values()].filter(isStoryQuestEnding), [pageById]);
  const foundEndingIds = useMemo(() => {
    const saved = new Set([...storyQuestEndingIds(initialProgress), ...sessionEndings]);
    return endingPages.filter(page => saved.has(page.id)).map(page => page.id);
  }, [endingPages, initialProgress, sessionEndings]);
  const savedScenes = Array.isArray(initialProgress.exploredPageIds) ? initialProgress.exploredPageIds : [];
  const replayFork = isComplete
    ? storyQuestReplayFork([...history, currentPageId], foundEndingIds, [...savedScenes, ...sessionScenes], pageById)
    : -1;
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
  const progressSnapshot = useMemo(() => {
    const checkpoint = {
      contentRevision: quest?.contentRevision || "",
      visitedPageIds: Array.from(visitedPageIds),
      routeFinished: false
    };
    return {
      ...checkpoint,
      lastPageId: currentPageId,
      targetWordCount: quest?.targetWords?.length || 0,
      visitedPageCount: visitedPageIds.size,
      wordsFound: foundWords,
      wordsFoundCount: foundWords.length,
      routeCheckpoint: encodeStoryQuestCheckpoint(checkpoint)
    };
  }, [currentPageId, foundWords, quest?.targetWords, quest?.contentRevision, visitedPageIds]);

  useEffect(() => {
    if (!currentPageId || isComplete) return;
    onProgress?.(currentPageId, progressSnapshot);
  }, [currentPageId, isComplete, onProgress, progressSnapshot]);

  useEffect(() => {
    if (isComplete) endingHeadingRef.current?.focus();
  }, [isComplete]);

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
    let wasFullscreen = false;

    function handleFullscreenChange() {
      const entered = getBrowserFullscreenElement(document) === playerRef.current;
      setIsFullscreen(entered);
      if (wasFullscreen && !entered) {
        requestAnimationFrame(() => playerRef.current?.querySelector(".story-quest-more-menu > summary")?.focus({ preventScroll: true }));
      }
      wasFullscreen = entered;
    }

    return addBrowserFullscreenListener(document, handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!viewportFullscreen) return undefined;
    const closeOnEscape = event => {
      if (event.key !== "Escape") return;
      setViewportFullscreen(false);
      setIsFullscreen(false);
      requestAnimationFrame(() => playerRef.current?.querySelector(".story-quest-more-menu > summary")?.focus());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [viewportFullscreen]);

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
    const path = speechPath(text);
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
      const endingPageIds = [...new Set([...foundEndingIds, currentPageId])];
      setSessionEndings(endingPageIds);
      onComplete?.({
        ...progressSnapshot,
        routeFinished: true,
        routeCheckpoint: encodeStoryQuestCheckpoint({ ...progressSnapshot, routeFinished: true }),
        endingPageId: currentPageId,
        endingPageIds
      });
      return;
    }
    if (!pageById.has(nextPageId)) return;
    stopAudio();
    setSceneAction(null);
    setSessionScenes(previous => previous.includes(nextPageId) ? previous : [...previous, nextPageId]);
    setRoute({ pageId: nextPageId, history: [...history, currentPageId] });
  }

  function goBack() {
    if (!history.length) return;
    stopAudio();
    setSceneAction(null);
    setRoute({ pageId: history.at(-1), history: history.slice(0, -1) });
  }

  function restart() {
    stopAudio();
    setSceneAction(null);
    setActiveWordSupport(null);
    setRoute({ pageId: quest?.startPageId || quest?.pages?.[0]?.id || "", history: [] });
    setIsComplete(false);
  }

  function tryAnotherPath() {
    if (replayFork < 0) return;
    stopAudio();
    setSceneAction(null);
    setRoute({ pageId: history[replayFork], history: history.slice(0, replayFork) });
    setIsComplete(false);
  }

  async function toggleFullscreen() {
    if (viewportFullscreen) {
      setViewportFullscreen(false);
      setIsFullscreen(false);
      requestAnimationFrame(() => playerRef.current?.querySelector(".story-quest-more-menu > summary")?.focus());
      return;
    }
    const player = playerRef.current;
    if (!player || typeof document === "undefined") {
      setIsFullscreen(value => !value);
      return;
    }

    try {
      if (getBrowserFullscreenElement(document) === player) {
        await exitBrowserFullscreen(document);
      } else {
        const entered = await requestBrowserFullscreen(player);
        if (!entered) {
          setViewportFullscreen(true);
          setIsFullscreen(true);
        }
      }
    } catch (error) {
      console.warn("Story Quest fullscreen toggle unavailable.", error);
      setIsFullscreen(value => !value);
    }
  }

  function exitReader() {
    stopAudio();
    setViewportFullscreen(false);
    setIsFullscreen(false);
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
  const decisionAudio = speechPath(decisionText);
  const endingCountText = storyQuestEndingCountText(foundEndingIds.length, endingPages.length);
  const endingAudio = isComplete ? [
    storyQuestEndingText(currentPage),
    replayFork >= 0 && "Try another path",
    "Read again",
    onExit && "Choose a story",
    endingCountText
  ].map(speechPath).filter(Boolean) : [];

  return (
    <ImmersiveReader active={viewportFullscreen} className="story-quest-immersive-reader">
    <section
      className={["story-quest-player story-quest-reader card", previewMode ? "story-quest-preview-reader" : "", isFullscreen ? "fullscreen" : "", isComplete ? "story-quest-reader-complete" : ""].filter(Boolean).join(" ")}
      ref={playerRef}
      aria-label={`${quest.title} ${isComplete ? "complete" : "Story Quest"}`}
      data-page-id={currentPage.id}
      data-text-layout={(currentPage.text || []).join(" ").split(/\s+/).length <= 35 ? "short" : "long"}
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

      <div className="story-quest-image-stage" key={`image-${currentPage.id}`}>
        <StoryQuestImage src={currentPage.imageUrl} title={quest.title} alt={currentPage.imageAlt} action={sceneAction} />
      </div>

      <div className="story-quest-read-row">
        <button
          className={`lp-button lp-button-secondary story-quest-audio-button${isAudioPlaying ? " audio-feedback-playing" : ""}`}
          disabled={!audioAvailable && !isAudioPlaying}
          onClick={isAudioPlaying ? stopAudio : replayAudio}
          type="button"
          aria-label={isAudioPlaying ? "Stop audio" : "Hear the story"}
        >
          <StoryQuestSpeaker />
          {isAudioPlaying ? "Stop" : audioChecking ? "Loading audio" : audioAvailable ? "Hear the story" : "Audio unavailable"}
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

      {currentPage.play && !isComplete && (
        <SceneActions key={`actions-${currentPage.id}`} play={currentPage.play} active={sceneAction} imageUrl={currentPage.imageUrl} onHear={hearText}
          onAct={action => { stopAudio(); setSceneAction(action); }} />
      )}

      <div className="story-quest-decision" aria-label={isComplete ? "Read another story" : "Choose what happens next"}>
        {isComplete ? (
          <>
            <div className="story-quest-ending-label">
              <BookOpen size={24} weight="duotone" aria-hidden="true" />
              <h2 ref={endingHeadingRef} tabIndex={-1}>{currentPage.endingTitle || "The end"}</h2>
            </div>
            <div className="story-quest-decision-heading">
              <p className="story-quest-choice-prompt">{currentPage.replayPrompt || "Try a different path."}</p>
              <button className="story-quest-hear" type="button" aria-label="Hear the ending options"
                onClick={() => playWordSupportSequence(endingAudio)} disabled={!endingAudio.length}><StoryQuestSpeaker /></button>
            </div>
            {replayFork >= 0 && (
              <button className="story-quest-choice-button story-quest-replay" type="button" onClick={tryAnotherPath}>
                <Signpost size={24} weight="duotone" aria-hidden="true" /> Try another path
              </button>
            )}
            <div className="story-quest-choice-grid">
              <button className="story-quest-choice-button" onClick={restart} type="button">Read again</button>
              {onExit && <button className="story-quest-choice-button" onClick={exitReader} type="button">Choose a story</button>}
            </div>
            <section className="story-quest-endings" aria-label="Endings found">
              <p>{endingCountText}</p>
              <ul>
                {endingPages.filter(page => foundEndingIds.includes(page.id)).map(page => (
                  <li key={page.id} aria-current={page.id === currentPageId ? "true" : undefined}>
                    <img src={page.imageUrl} alt="" loading="lazy" decoding="async" />
                    <span>{page.endingTitle || "The end"}</span>
                  </li>
                ))}
              </ul>
            </section>
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
                  <button className="story-quest-choice-button" disabled={choice.nextPageId !== "end" && !pageById.has(choice.nextPageId)} onClick={() => goToPage(choice)} type="button">
                    {choice.label}{currentPage.play && choice.label === "Next" && <ArrowBendDownRight size={20} aria-hidden="true" />}
                  </button>
                  <button className="story-quest-hear" type="button" aria-label={`Hear choice: ${choice.label}`} onClick={() => hearText(choice.label)} disabled={!speechPath(choice.label)}><StoryQuestSpeaker /></button>
                </div>
              ))}
            </div>
            <button className="story-quest-previous" onClick={goBack} disabled={!history.length} type="button">
              {currentPage.play && <ArrowArcLeft size={19} aria-hidden="true" />}Previous scene
            </button>
          </>
        )}
      </div>
    </section>
    </ImmersiveReader>
  );
}
