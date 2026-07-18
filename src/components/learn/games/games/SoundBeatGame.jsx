import { useCallback, useEffect, useRef, useState } from "react";
import Ps1ArcadeGame from "./Ps1ArcadeGame.jsx";

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

export default function SoundBeatGame({ onEngineReady, ...props }) {
  const [showOnboarding, setShowOnboarding] = useState(readOnboarded);
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

  // Any key starts play from the intro card (Esc stays with the chrome).
  useEffect(() => {
    if (!showOnboarding) return undefined;
    const onKeyDown = event => {
      if (event.key === "Escape") return;
      if (event.key === " " || event.key === "Enter" || event.key.startsWith("Arrow")) event.preventDefault();
      dismissOnboarding();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showOnboarding, dismissOnboarding]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "100dvh" }}>
      <Ps1ArcadeGame kind="sound-beat" {...props} onEngineReady={handleEngineReady} />
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
            <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 16, fontWeight: 700, lineHeight: 1.6, color: "#dce8ff" }}>
              {ONBOARDING_HINTS.map(hint => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
            <div style={{ marginTop: 16, fontSize: 17, fontWeight: 900, color: "#ff3d8b" }}>
              Tap to play · or press any key
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
