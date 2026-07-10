import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import ReelReadGame from "./components/learn/games/games/ReelReadGame.jsx";
import { startGameMusic, stopGameMusic } from "./utils/audio/gameMusic.js";
import { worldForDifficulty } from "./utils/palWorlds.js";

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const level = Number(params.get("level") || "0");
  const soundEnabled = params.get("sound") !== "0";
  const handleEngineReady = useCallback(engine => {
    window.__reelReadEngine = engine;
  }, []);

  useEffect(() => {
    if (soundEnabled) startGameMusic("reel-read", { fallbackWorldId: worldForDifficulty(difficulty).id });
    else stopGameMusic();
    return () => stopGameMusic();
  }, [difficulty, soundEnabled]);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#06101d" }}>
      <ReelReadGame
        difficulty={difficulty}
        startLevel={level}
        isSoundEnabled={soundEnabled}
        onScoreUpdate={() => {}}
        onProgressUpdate={() => {}}
        onCheckpoint={() => {}}
        onComplete={(stars, finalScore, total) => {
          window.__reelReadComplete = { stars, finalScore, total };
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
