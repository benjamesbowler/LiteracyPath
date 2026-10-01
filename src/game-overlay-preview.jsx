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
const PREVIEW_SCOPE = "fullscreen-overlay-preview";
// Explicit fixture context for authored reading tests, never inferred from the
// difficulty. Production receives only AppSurface's confirmed child placement.
const taughtCycle = confirmedArcadeTaughtCycle({ anchorCycle: Number(params.get("taughtCycle")) });

if (!game) {
  throw new Error(`Unknown game overlay preview id: ${requestedGameId}`);
}

if (params.get("resume") === "1") {
  const supportAware = ["drum-trail", "lantern-lagoon"].includes(game.id);
  saveGameCheckpoint(PREVIEW_SCOPE, game.id, "easy", 1, supportAware ? (game.id === "drum-trail" ? 16 : 8) : 5,
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
