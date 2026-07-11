import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import GrammarGrindGame from "./components/learn/games/games/GrammarGrindGame.jsx";
import { startGameMusic, stopGameMusic } from "./utils/audio/gameMusic.js";

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const level = Number(params.get("level") || "0");
  const soundEnabled = params.get("sound") !== "0";
  const handleEngineReady = useCallback(engine => {
    window.__grammarGrindEngine = engine;
  }, []);

  useEffect(() => {
    if (soundEnabled) startGameMusic("grammar-grind", { fallbackWorldId: difficulty === "hard" ? "moonwood" : difficulty === "medium" ? "dino" : "meadow" });
    else stopGameMusic();
    return () => stopGameMusic();
  }, [difficulty, soundEnabled]);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#070b1a" }}>
      <GrammarGrindGame
        difficulty={difficulty}
        startLevel={level}
        isSoundEnabled={soundEnabled}
        onScoreUpdate={() => {}}
        onProgressUpdate={() => {}}
        onCheckpoint={() => {}}
        onComplete={(stars, finalScore, total) => {
          window.__grammarGrindComplete = { stars, finalScore, total };
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
