import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles/fonts.js";
import "./index.css";
import "./App.css";
import "./styles/learn-games.css";
import "./styles/arcade-dark.css";
import "./styles/student-vibrant.css";
import "./styles/comic-theme.css";
import "./styles/ui-quality-pass.css";
import { GAME_LIST } from "./data/learnGamesData.js";
import { GamePlayer } from "./components/learn/games/GamePlayer.jsx";
import { saveGameCheckpoint } from "./utils/learnGamesProgress.js";
import { confirmedArcadeTaughtCycle } from "./components/learn/games/arcadeLearningContext.js";

const params = new URLSearchParams(window.location.search);
const requestedGameId = params.get("game") || GAME_LIST[0]?.id;
const game = GAME_LIST.find(candidate => candidate.id === requestedGameId);
const difficulty = ["easy", "medium", "hard"].includes(params.get("difficulty")) ? params.get("difficulty") : "easy";
// A separate review island lets the quieter opening be tried without replacing
// structures already saved while reviewing the original game.
const PREVIEW_SCOPE = params.get("review") === "clear-start"
  ? "fullscreen-overlay-clear-start-preview" : "fullscreen-overlay-preview";
// Explicit fixture context for authored reading tests, never inferred from the
// difficulty. Production receives only AppSurface's confirmed child placement.
const taughtCycle = confirmedArcadeTaughtCycle({ anchorCycle: Number(params.get("taughtCycle")) });

if (!game) {
  throw new Error(`Unknown game overlay preview id: ${requestedGameId}`);
}

if (params.get("resume") === "1") {
  const totals = { "drum-trail": 16, "lantern-lagoon": 8, "tower-tumble": 9, "rally-pals": 6, "burrow-builders": 6 };
  const supportAware = Boolean(totals[game.id]);
  saveGameCheckpoint(PREVIEW_SCOPE, game.id, difficulty, 1, totals[game.id] || 5,
    supportAware ? 913 : undefined, supportAware ? 0 : undefined);
}

export function GameOverlayPreview() {
  const [open, setOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(params.get("sound") === "1");

  if (!open) return <p role="status">Closed {game.title}</p>;

  return (
    <GamePlayer
      game={game}
      difficulty={difficulty}
      soundEnabled={soundEnabled}
      taughtCycle={taughtCycle}
      progressScopeKey={PREVIEW_SCOPE}
      onClose={() => setOpen(false)}
      onSoundEnabledChange={setSoundEnabled}
      onProgressChange={() => {}}
      onEngineReady={api => {
        if (import.meta.env.DEV) window.__arcadePreviewSnapshot = () => api?.debugSnapshot?.() ?? null;
      }}
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
