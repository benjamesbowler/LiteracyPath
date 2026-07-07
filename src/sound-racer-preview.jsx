import { createRoot } from "react-dom/client";
import SoundRacerGame from "./components/learn/games/games/SoundRacerGame.jsx";
import "./styles/learn-games.css";

document.body.style.margin = "0";
document.body.style.background = "#070b1e";

const params = new URLSearchParams(window.location.search);
const previewDifficulty = params.get("difficulty") || "medium";
const previewLevel = Number(params.get("level") || 0);

createRoot(document.getElementById("root")).render(
  <div style={{ width: "100vw", height: "100vh" }}>
    <SoundRacerGame
      difficulty={previewDifficulty}
      startLevel={previewLevel}
      isSoundEnabled={false}
      onScoreUpdate={() => {}}
      onProgressUpdate={() => {}}
      onComplete={() => {}}
      onCheckpoint={() => {}}
    />
  </div>
);
