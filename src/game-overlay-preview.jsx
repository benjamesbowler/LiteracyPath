import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/learn-games.css";
import "./styles/arcade-dark.css";
import "./styles/student-vibrant.css";
import "./styles/comic-theme.css";
import { GAME_LIST } from "./data/learnGamesData.js";
import { GamePlayer } from "./components/learn/games/GamePlayer.jsx";
import { saveGameCheckpoint } from "./utils/learnGamesProgress.js";

const params = new URLSearchParams(window.location.search);
const requestedGameId = params.get("game") || GAME_LIST[0]?.id;
const game = GAME_LIST.find(candidate => candidate.id === requestedGameId);
const PREVIEW_SCOPE = "fullscreen-overlay-preview";

if (!game) {
  throw new Error(`Unknown game overlay preview id: ${requestedGameId}`);
}

if (params.get("resume") === "1") {
  saveGameCheckpoint(PREVIEW_SCOPE, game.id, "easy", 1, 5);
}

export function GameOverlayPreview() {
  const [open, setOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(params.get("sound") === "1");
  const [musicEnabled, setMusicEnabled] = useState(params.get("music") !== "0");

  if (!open) return <p role="status">Closed {game.title}</p>;

  return (
    <GamePlayer
      game={game}
      difficulty="easy"
      soundEnabled={soundEnabled}
      musicEnabled={musicEnabled}
      progressScopeKey={PREVIEW_SCOPE}
      onClose={() => setOpen(false)}
      onSoundEnabledChange={setSoundEnabled}
      onMusicEnabledChange={setMusicEnabled}
      onProgressChange={() => {}}
    />
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<GameOverlayPreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
