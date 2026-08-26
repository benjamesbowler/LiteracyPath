import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import SoundRacerGame from "./components/learn/games/games/SoundRacerGame.jsx";
import { startGameMusic, stopGameMusic } from "./utils/audio/gameMusic.js";
import "./styles/learn-games.css";

document.body.style.margin = "0";
document.body.style.background = "#070b1e";

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const previewDifficulty = params.get("difficulty") || "medium";
  const previewLevel = Number(params.get("level") || 0);
  const soundEnabled = params.get("sound") !== "0";
  const musicEnabled = params.get("music") !== "0";

  useEffect(() => {
    if (musicEnabled) startGameMusic("sound-racer");
    else stopGameMusic();
    return () => stopGameMusic();
  }, [musicEnabled]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <SoundRacerGame
        difficulty={previewDifficulty}
        startLevel={previewLevel}
        isSoundEnabled={soundEnabled}
        onScoreUpdate={() => {}}
        onProgressUpdate={() => {}}
        onComplete={() => {}}
        onCheckpoint={() => {}}
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
