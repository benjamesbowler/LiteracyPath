import { useCallback } from "react";
import { createRoot } from "react-dom/client";
import SoundSafariGame from "./components/learn/games/games/SoundSafariGame.jsx";

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || "medium";
  const level = Number(params.get("level") || "0");
  const handleEngineReady = useCallback(engine => {
    window.__soundSafariEngine = engine;
  }, []);

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#06101d" }}>
      <SoundSafariGame
        difficulty={difficulty}
        startLevel={level}
        isSoundEnabled={false}
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

createRoot(document.getElementById("root")).render(<Preview />);
