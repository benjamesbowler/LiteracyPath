import { useState } from "react";
import { createRoot } from "react-dom/client";
import { toChildConnectedTextScene } from "../../src/features/soundSeekers/content/connectedText.js";
import { SceneVisual } from "../../src/features/soundSeekers/visual/SceneVisual.jsx";

const parameters = new URLSearchParams(window.location.search);
const sceneId = parameters.get("scene") || "scene-s1";
const childScene = toChildConnectedTextScene(sceneId, "fallback-browser-seed");

window.__soundSeekersChoiceTokens = [];

function SoundSeekersVisualHarness() {
  const [lastChoiceToken, setLastChoiceToken] = useState("");
  const choose = token => {
    window.__soundSeekersChoiceTokens.push(token);
    setLastChoiceToken(token);
  };

  return (
    <>
      <SceneVisual
        childScene={childScene}
        activeAttemptId={null}
        reducerRevision={null}
        sceneAccess={null}
        cropProfile="landscape"
        densityProfile="full"
        motionProfile="reduced"
        onChoose={choose}
      />
      <output data-last-choice-token="">{lastChoiceToken}</output>
    </>
  );
}

createRoot(document.getElementById("root")).render(<SoundSeekersVisualHarness />);
