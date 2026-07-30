import { useCallback, useEffect, useRef, useState } from "react";
import Ps1ArcadeGame from "./Ps1ArcadeGame.jsx";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { getLedaWordAudioPath } from "../../../../data/ledaProductionAudio.js";

// First-run onboarding: one intro card per device, dismissed forever after.
// Storage may be denied (private mode) — then the card shows again next
// session, but it must never crash the game.
const ONBOARDING_KEY = "lp-arcade-onboarded-v1:sound-beat";

function readOnboarded() {
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

const ONBOARDING_HINTS = [
  "Listen for each sound, then tap on the beat.",
  "Tap the screen, or press Space on a keyboard.",
  "Finish with GO to say the whole word."
];

export default function SoundBeatGame({ onEngineReady, isSoundEnabled = true, ...props }) {
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboarded());
  const showOnboardingRef = useRef(showOnboarding);
  const engineRef = useRef(null);

  // The engine starts paused behind the intro card. The wrapped resume keeps
  // chrome resumes (quit dialog, tab-visible) from starting play under it.
  const handleEngineReady = useCallback(api => {
    engineRef.current = api;
    if (!showOnboardingRef.current) {
      onEngineReady?.(api);
      return;
    }
    api.pause();
    onEngineReady?.({
      ...api,
      resume: () => {
        if (!showOnboardingRef.current) api.resume();
      }
    });
  }, [onEngineReady]);

  const dismissOnboarding = useCallback(() => {
    showOnboardingRef.current = false;
    setShowOnboarding(false);
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "1");
    } catch { /* storage denied: the card simply returns next session */ }
    engineRef.current?.resume();
  }, []);

  // Only game activation keys start play. Tab and browser/assistive shortcuts
  // remain available while the dialog is open.
  useEffect(() => {
    if (!showOnboarding) return undefined;
    const onKeyDown = event => {
      const activates = event.key === " " || event.key === "Enter" || event.key === "ArrowUp";
      if (!activates) return;
      event.preventDefault();
      dismissOnboarding();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showOnboarding, dismissOnboarding]);

  // A short recorded child-voice action cue complements the picture sequence.
  // If autoplay is blocked, the visual card remains fully usable; never TTS.
  useEffect(() => {
    if (!showOnboarding || !isSoundEnabled) return undefined;
    const timer = window.setTimeout(() => {
      playCueAudio(getLedaWordAudioPath("tap"), { volume: 0.88 });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      stopCueAudio();
    };
  }, [showOnboarding, isSoundEnabled]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "100dvh" }}>
      <Ps1ArcadeGame kind="sound-beat" {...props} isSoundEnabled={isSoundEnabled} onEngineReady={handleEngineReady} />
      {showOnboarding && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How to play Sound Beat"
          onPointerDown={dismissOnboarding}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(2,5,16,.84)",
            cursor: "pointer",
            textAlign: "center",
            fontFamily: '"Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: 560,
              margin: 16,
              padding: "26px 30px",
              background: "rgba(4,9,20,.94)",
              border: "2px solid rgba(184,255,61,.66)",
              borderRadius: 18,
              boxShadow: "0 18px 60px rgba(0,0,0,.55)"
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, color: "#b8ff3d" }}>Sound Beat</div>
            <p style={{ fontSize: 19, fontWeight: 800, color: "#fff", margin: "10px 0 14px" }}>
              Tap each sound on the beat.
            </p>
            <div
              aria-hidden="true"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "8px 0 16px" }}
            >
              <span style={{ width: 58, height: 58, display: "grid", placeItems: "center", border: "2px solid #52fff0", borderRadius: 12, color: "#52fff0", fontSize: 30 }}>♪</span>
              <span style={{ color: "#fff", fontSize: 26 }}>→</span>
              <span style={{ width: 116, height: 58, display: "grid", placeItems: "center", border: "2px solid #ffd23d", borderRadius: 12, color: "#ffd23d", fontSize: 25, letterSpacing: 8 }}>●●●</span>
              <span style={{ color: "#fff", fontSize: 26 }}>→</span>
              <span style={{ width: 58, height: 58, display: "grid", placeItems: "center", background: "#b8ff3d", borderRadius: 12, color: "#07101d", fontSize: 19, fontWeight: 950 }}>GO</span>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: "#dce8ff" }}>
              {ONBOARDING_HINTS.map(hint => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={dismissOnboarding}
              onPointerDown={event => event.stopPropagation()}
              style={{
                marginTop: 16,
                border: "2px solid #ff3d8b",
                borderRadius: 12,
                background: "rgba(255,61,139,.14)",
                color: "#ff8cbb",
                padding: "10px 20px",
                fontSize: 17,
                fontWeight: 900,
                cursor: "pointer"
              }}
            >
              Tap to play
            </button>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#dce8ff" }}>
              or press Space / Enter
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
