import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import SoundSafariGame from "./components/learn/games/games/SoundSafariGame.jsx";
import { startGameMusic, stopGameMusic } from "./utils/audio/gameMusic.js";

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const level = Number(params.get("level") || "0");
  const soundEnabled = params.get("sound") !== "0";
  const handleEngineReady = useCallback(engine => {
    window.__soundSafariEngine = engine;
  }, []);

  useEffect(() => {
    if (soundEnabled) startGameMusic("sound-safari");
    else stopGameMusic();
    return () => stopGameMusic();
  }, [soundEnabled]);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#06101d" }}>
      <SoundSafariGame
        difficulty={difficulty}
        startLevel={level}
        isSoundEnabled={soundEnabled}
        onScoreUpdate={() => {}}
        onProgressUpdate={() => {}}
        onCheckpoint={() => {}}
        onComplete={(stars, finalScore, total) => {
          window.__soundSafariComplete = { stars, finalScore, total };
        }}
        onEngineReady={handleEngineReady}
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
