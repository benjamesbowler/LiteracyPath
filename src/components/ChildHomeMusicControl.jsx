import { useCallback, useEffect, useRef, useState } from "react";

import { applyLearnerAudioIntensity } from "../accessibility/learnerAccessibility.js";
import {
  CHILD_HOME_MUSIC_DEFAULT_ENABLED,
  CHILD_HOME_MUSIC_TRACKS,
  childHomeMusicPreferenceKey,
  nextChildHomeMusicTrackIndex
} from "../data/childHomeMusic.js";
import { STUDENT_RAIL_ICON_PATHS } from "../policy/studentRailPolicy.js";
import { STOP_CHILD_AUDIO_EVENT } from "../utils/audio/childAudioLifecycle.js";

function readMusicPreference(scopeKey) {
  if (typeof window === "undefined") return CHILD_HOME_MUSIC_DEFAULT_ENABLED;
  try {
    const stored = window.localStorage.getItem(childHomeMusicPreferenceKey(scopeKey));
    if (stored === null) return CHILD_HOME_MUSIC_DEFAULT_ENABLED;
    return stored === "true";
  } catch {
    return CHILD_HOME_MUSIC_DEFAULT_ENABLED;
  }
}

function saveMusicPreference(scopeKey, enabled) {
  try {
    window.localStorage.setItem(childHomeMusicPreferenceKey(scopeKey), String(enabled));
  } catch {
    // A private browsing storage failure must not make the control unusable.
  }
}

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

export default function ChildHomeMusicControl({ scopeKey = "default" }) {
  const audioRef = useRef(null);
  const mountedRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [preferenceEnabled, setPreferenceEnabled] = useState(
    () => readMusicPreference(scopeKey)
  );
  const [playbackState, setPlaybackState] = useState(
    () => readMusicPreference(scopeKey) ? "starting" : "off"
  );
  const track = CHILD_HOME_MUSIC_TRACKS[trackIndex] || CHILD_HOME_MUSIC_TRACKS[0];
  const targetVolume = applyLearnerAudioIntensity(track?.volume || 0);

  const stop = useCallback((nextState = "off") => {
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
    const audio = audioRef.current;
    if (!audio || !track) {
      return Promise.resolve().then(() => {
        if (mountedRef.current) setPlaybackState("unavailable");
        return false;
      });
    }
    audio.volume = targetVolume;
    let playback;
    try {
      playback = audio.play();
    } catch (error) {
      playback = Promise.reject(error);
    }
    return Promise.resolve(playback).then(() => {
      if (audio.paused) {
        if (mountedRef.current) setPlaybackState("waiting");
        return false;
      }
      if (mountedRef.current) setPlaybackState("playing");
      return true;
    }).catch(() => {
      // Browsers can block autoplay until a child taps. The waiting state is
      // truthful and the next pointer or keyboard action retries playback.
      if (mountedRef.current) setPlaybackState("waiting");
      return false;
    });
  }, [targetVolume, track]);

  useEffect(() => {
    const audio = audioRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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
    if (preferenceEnabled) {
      void start();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      // An unloaded track is already at its beginning.
    }
  }, [preferenceEnabled, start]);

  useEffect(() => {
    if (!preferenceEnabled || playbackState !== "waiting") return undefined;
    const retry = event => {
      // The control's own click handler starts or stops music. Retrying on its
      // preceding pointerdown would turn the same tap into two opposing actions.
      if (event.target?.closest?.("[data-child-home-music]")) return;
      setPlaybackState("starting");
      void start();
    };
    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach(eventName => window.addEventListener(eventName, retry, { once: true }));
    return () => events.forEach(eventName => window.removeEventListener(eventName, retry));
  }, [playbackState, preferenceEnabled, start]);

  useEffect(() => {
    const stopForChildAudioLifecycle = () => {
      stop(preferenceEnabled ? "waiting" : "off");
    };
    window.addEventListener(STOP_CHILD_AUDIO_EVENT, stopForChildAudioLifecycle);
    return () => window.removeEventListener(STOP_CHILD_AUDIO_EVENT, stopForChildAudioLifecycle);
  }, [preferenceEnabled, stop]);

  function toggleMusic() {
    if (playbackState === "unavailable") return;
    if (playbackState === "playing" || playbackState === "starting") {
      saveMusicPreference(scopeKey, false);
      setPreferenceEnabled(false);
      stop("off");
      return;
    }
    saveMusicPreference(scopeKey, true);
    setPreferenceEnabled(true);
    setPlaybackState("starting");
    void start();
  }

  function playNextTrack() {
    if (CHILD_HOME_MUSIC_TRACKS.length <= 1) return;
    setPlaybackState("starting");
    setTrackIndex(index => nextChildHomeMusicTrackIndex(index));
  }

  function handleTrackError() {
    if (CHILD_HOME_MUSIC_TRACKS.length > 1) {
      playNextTrack();
      return;
    }
    setPlaybackState("unavailable");
  }

  function handlePause() {
    if (!mountedRef.current) return;
    setPlaybackState(preferenceEnabled ? "waiting" : "off");
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
        data-music-enabled={preferenceEnabled ? "true" : "false"}
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
        preload="metadata"
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
