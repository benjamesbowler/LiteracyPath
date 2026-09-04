import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import { QUEST_STOPS } from "../../src/data/questSequence.js";
import { createTeachSequence } from "../../src/features/soundSeekers/engine/teachSequence.js";
import { createSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../../src/features/soundSeekers/visual/visualTokens.js";
import "../../src/features/soundSeekers/sound-seekers.css";
import { CampaignMap } from "../../src/features/soundSeekers/ui/CampaignMap.jsx";
import { SettingsSheet } from "../../src/features/soundSeekers/ui/SettingsSheet.jsx";
import { TeachAllSequence } from "../../src/features/soundSeekers/ui/TeachAllSequence.jsx";

const initialSettings = Object.freeze({
  ...createSoundSeekersState().settings,
  autoTravel: false,
  slowerMovement: false,
  noDamageTravel: false,
  largerTargets: false,
  extendedResponse: false,
  simplifiedScene: false
});
const tokenStyle = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => [
    `--ss-token-${tokenId}`,
    value
  ])
));
const teachItem = createTeachSequence(QUEST_STOPS.find(stop => stop.id === "s38")).items
  .find(item => item.targetId === "suffix_s");
const teachBinding = Object.freeze({
  scopeKey: "learner-task5",
  missionId: "mission:1:s38:0:38",
  phaseId: "s38-teach",
  attemptId: "mission:1:s38:0:38:s38-teach:attempt:0"
});
const audioController = Object.freeze({
  request() {},
  invalidate() {},
  subscribe() { return () => {}; },
  getSnapshot() { return Object.freeze({ request: null, delivery: null }); }
});
const surface = new URLSearchParams(window.location.search).get("surface") || "map";

function Task5UiHarness() {
  const [settings, setSettings] = useState(initialSettings);
  const [sheet, setSheet] = useState(null);
  const state = createSoundSeekersState({ settings });

  if (surface === "teach") {
    return (
      <div className="sound-seekers-v2" data-task5-ui-harness="" style={tokenStyle}>
        <TeachAllSequence
          item={teachItem}
          binding={teachBinding}
          audioController={audioController}
          onComplete={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="sound-seekers-v2" data-task5-ui-harness="" style={tokenStyle}>
      <CampaignMap
        state={state}
        onStart={() => {}}
        onOpenJournal={() => {}}
        onOpenCreator={() => {}}
        onOpenSettings={() => setSheet("settings")}
        onExit={() => {}}
      />
      {sheet === "settings" ? (
        <SettingsSheet
          settings={settings}
          onChange={setSettings}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Task5UiHarness />);
