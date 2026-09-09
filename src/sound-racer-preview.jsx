import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import SoundRacerGame from "./components/learn/games/games/SoundRacerGame.jsx";
import { startGameMusic, stopGameMusic } from "./utils/audio/gameMusic.js";
import "./styles/learn-games.css";

document.body.style.margin = "0";
document.body.style.background = "#070b1e";

function Preview() {
  const observed = useRef({ completions: [], checkpoints: [], progress: [], score: 0 });
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const snapshot = () => structuredClone(observed.current);
    window.__SOUND_RACER_PREVIEW__ = { snapshot };
    return () => { if (window.__SOUND_RACER_PREVIEW__?.snapshot === snapshot) delete window.__SOUND_RACER_PREVIEW__; };
  }, []);
  const params = new URLSearchParams(window.location.search);
  const previewDifficulty = params.get("difficulty") || "medium";
  const previewLevel = Number(params.get("level") || 0);
  const soundEnabled = params.get("sound") !== "0";
  const musicEnabled = params.get("music") === "1";
  const diagnostics = import.meta.env.DEV ? {
    seed: params.get("seed") || "review",
    fallback: params.get("fallback") === "1",
    assetFailure: params.get("assetFailure") === "1",
    reducedMotion: params.get("motion") === "reduced",
    quality: ["low", "medium", "high"].includes(params.get("quality")) ? params.get("quality") : undefined
  } : undefined;

  useEffect(() => {
    if (musicEnabled) startGameMusic("sound-racer");
    else stopGameMusic();
    return () => stopGameMusic();
  }, [musicEnabled]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <SoundRacerGame
        diagnostics={diagnostics}
        difficulty={previewDifficulty}
        startLevel={previewLevel}
        isSoundEnabled={soundEnabled}
        onScoreUpdate={score => { observed.current.score = score; }}
        onProgressUpdate={(current, total) => { observed.current.progress.push({ current, total }); }}
        onComplete={(stars, score, completed) => { observed.current.completions.push({ stars, score, completed }); }}
        onCheckpoint={(current, total) => { observed.current.checkpoints.push({ current, total }); }}
      />
    </div>
  );
}

export default Preview;

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<Preview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
