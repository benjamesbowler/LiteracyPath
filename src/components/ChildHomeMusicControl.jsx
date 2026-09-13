import { useCallback, useEffect, useRef, useState } from "react";

import { applyLearnerAudioIntensity } from "../accessibility/learnerAccessibility.js";
import {
  CHILD_HOME_MUSIC_DEFAULT_ENABLED,
  CHILD_HOME_MUSIC_TRACKS,
  nextChildHomeMusicTrackIndex
} from "../data/childHomeMusic.js";
import { STUDENT_RAIL_ICON_PATHS } from "../policy/studentRailPolicy.js";
import { STOP_CHILD_AUDIO_EVENT } from "../utils/audio/childAudioLifecycle.js";

function MusicGlyph() {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STUDENT_RAIL_ICON_PATHS.soundWaves} />
    </svg>
  );
}

function musicControlCopy(playbackState) {
  if (playbackState === "playing" || playbackState === "starting") {
    return { label: "Music on", action: "Turn music off" };
  }
  if (playbackState === "waiting") {
    return { label: "Play music", action: "Play music" };
  }
  if (playbackState === "unavailable") {
    return { label: "Music unavailable", action: "Music is unavailable" };
  }
  return { label: "Music off", action: "Turn music on" };
}

export default function ChildHomeMusicControl() {
  const audioRef = useRef(null);
  const mountedRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const playbackRequested = useRef(CHILD_HOME_MUSIC_DEFAULT_ENABLED);
  const playbackAttempt = useRef(0);
  const failedTracks = useRef(0);
  // Consent lasts for this visit only. A saved on preference from an earlier
  // visit must never start music on a classroom iPad.
  const [playbackState, setPlaybackState] = useState("off");
  const track = CHILD_HOME_MUSIC_TRACKS[trackIndex] || CHILD_HOME_MUSIC_TRACKS[0];
  const targetVolume = applyLearnerAudioIntensity(track?.volume || 0);

  const stop = useCallback((nextState = "off") => {
    playbackRequested.current = false;
    playbackAttempt.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // A track that has not loaded yet is already at its beginning.
      }
    }
    if (mountedRef.current) setPlaybackState(nextState);
  }, []);

  const start = useCallback(() => {
    if (!playbackRequested.current) return Promise.resolve(false);
    const audio = audioRef.current;
    if (!audio || !track) {
      stop("unavailable");
      return Promise.resolve(false);
    }
    const attempt = ++playbackAttempt.current;
    audio.volume = targetVolume;
    let playback;
    try {
      playback = audio.play();
    } catch (error) {
      playback = Promise.reject(error);
    }
    return Promise.resolve(playback).then(() => {
      if (!mountedRef.current || !playbackRequested.current || attempt !== playbackAttempt.current) {
        // A late play promise cannot undo an explicit stop or a route change.
        if (!playbackRequested.current) audio.pause();
        return false;
      }
      if (audio.paused) {
        playbackRequested.current = false;
        setPlaybackState("waiting");
        return false;
      }
      failedTracks.current = 0;
      setPlaybackState("playing");
      return true;
    }).catch(() => {
      if (!mountedRef.current || attempt !== playbackAttempt.current) return false;
      playbackRequested.current = false;
      // Only another tap on the music control may retry blocked playback.
      setPlaybackState("waiting");
      return false;
    });
  }, [stop, targetVolume, track]);

  useEffect(() => {
    const audio = audioRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      playbackRequested.current = false;
      playbackAttempt.current += 1;
      if (!audio) return;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Detaching an unloaded element has already stopped it.
      }
    };
  }, []);

  useEffect(() => {
    // Track changes may continue a playlist the child explicitly started.
    // Mounting Home never requests playback.
    if (playbackRequested.current) void start();
  }, [start]);

  useEffect(() => {
    const stopForChildAudioLifecycle = () => stop();
    const stopForHiddenPage = () => { if (document.hidden) stop(); };
    window.addEventListener(STOP_CHILD_AUDIO_EVENT, stopForChildAudioLifecycle);
    window.addEventListener("pagehide", stopForChildAudioLifecycle);
    document.addEventListener("visibilitychange", stopForHiddenPage);
    return () => {
      window.removeEventListener(STOP_CHILD_AUDIO_EVENT, stopForChildAudioLifecycle);
      window.removeEventListener("pagehide", stopForChildAudioLifecycle);
      document.removeEventListener("visibilitychange", stopForHiddenPage);
    };
  }, [stop]);

  function toggleMusic() {
    if (playbackState === "unavailable") return;
    if (playbackState === "playing" || playbackState === "starting") {
      stop();
      return;
    }
    playbackRequested.current = true;
    failedTracks.current = 0;
    setPlaybackState("starting");
    void start();
  }

  function playNextTrack() {
    if (!playbackRequested.current || CHILD_HOME_MUSIC_TRACKS.length <= 1) return;
    setPlaybackState("starting");
    setTrackIndex(index => nextChildHomeMusicTrackIndex(index));
  }

  function handleTrackError() {
    if (!playbackRequested.current) return;
    failedTracks.current += 1;
    if (failedTracks.current < CHILD_HOME_MUSIC_TRACKS.length) {
      playNextTrack();
      return;
    }
    stop("unavailable");
  }

  function handlePause() {
    if (!mountedRef.current || !audioRef.current?.paused || audioRef.current.ended) return;
    if (playbackRequested.current) stop();
  }

  if (!track) return null;
  const copy = musicControlCopy(playbackState);

  return (
    <>
      <button
        type="button"
        className="kg-home-music-control"
        aria-label={copy.action}
        aria-pressed={playbackState === "playing" || playbackState === "starting"}
        aria-describedby="kg-home-current-track"
        data-child-home-music=""
        data-music-enabled={playbackState === "playing" || playbackState === "starting" ? "true" : "false"}
        data-playback-state={playbackState}
        disabled={playbackState === "unavailable"}
        onClick={toggleMusic}
      >
        <MusicGlyph />
        <span>{copy.label}</span>
      </button>
      <span className="kg-visually-hidden" id="kg-home-current-track">
        {track.title} by {track.artist}
      </span>
      <audio
        ref={audioRef}
        src={track.source}
        preload="none"
        loop={CHILD_HOME_MUSIC_TRACKS.length === 1}
        playsInline
        aria-hidden="true"
        data-child-home-music-audio=""
        data-track-id={track.id}
        onPause={handlePause}
        onEnded={playNextTrack}
        onError={handleTrackError}
      />
    </>
  );
}
