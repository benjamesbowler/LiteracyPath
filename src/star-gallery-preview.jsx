import { useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import StarGalleryGame from "./components/learn/games/games/StarGalleryGame.jsx";
import { startGameMusic, stopGameMusic } from "./utils/audio/gameMusic.js";
import { worldForDifficulty } from "./utils/palWorlds.js";

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const level = Number(params.get("level") || "0");
  const soundEnabled = params.get("sound") !== "0";
  const handleEngineReady = useCallback(engine => {
    window.__starGalleryEngine = engine;
  }, []);

  useEffect(() => {
    if (soundEnabled) startGameMusic(worldForDifficulty(difficulty).id);
    else stopGameMusic();
    return () => stopGameMusic();
  }, [difficulty, soundEnabled]);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#050716" }}>
      <StarGalleryGame
        difficulty={difficulty}
        startLevel={level}
        isSoundEnabled={soundEnabled}
        onScoreUpdate={() => {}}
        onProgressUpdate={() => {}}
        onCheckpoint={() => {}}
        debugGlobalName="__starGalleryEngine"
        onComplete={(stars, finalScore, total) => {
          window.__starGalleryComplete = { stars, finalScore, total };
        }}
        onEngineReady={handleEngineReady}
      />
    </div>
  );
}

export default Preview;

createRoot(document.getElementById("root")).render(<Preview />);
