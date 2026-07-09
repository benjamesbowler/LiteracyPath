import { createRoot } from "react-dom/client";
import SentenceExpressGame from "./components/learn/games/games/SentenceExpressGame.jsx";

document.body.style.margin = "0";
document.body.style.background = "#0e141f";

const params = new URLSearchParams(window.location.search);
const previewDifficulty = params.get("difficulty") || "easy";
const previewLevel = Number(params.get("level") || 0);
const previewSound = params.get("sound") !== "off";

createRoot(document.getElementById("root")).render(
  <div style={{ width: "100vw", height: "100vh" }}>
    <SentenceExpressGame
      difficulty={previewDifficulty}
      startLevel={previewLevel}
      isSoundEnabled={previewSound}
      onComplete={result => console.log("[sentence-express] level complete", result)}
      onQuit={() => console.log("[sentence-express] quit")}
    />
  </div>
);
