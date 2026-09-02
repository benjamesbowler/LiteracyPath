import { useState } from "react";
import { createRoot } from "react-dom/client";
import { getMeaningSupport } from "../../src/features/soundSeekers/content/meaningSupport.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import WordWorkbench from "../../src/features/soundSeekers/ui/WordWorkbench.jsx";
import { resolveMeaningVisual } from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";

const parameters = new URLSearchParams(window.location.search);
const mode = parameters.get("mode") || "ship";
const shipPronunciation = getPronunciation("ship");

const shipRack = Object.freeze([
  Object.freeze({ id: "workbench-ship-rack-sh", label: "sh" }),
  Object.freeze({ id: "workbench-ship-rack-i", label: "i" }),
  Object.freeze({ id: "workbench-ship-rack-p", label: "p" }),
  Object.freeze({ id: "workbench-ship-rack-ch", label: "ch" })
]);

const shipReady = Object.freeze({
  challengeId: "workbench-ship-challenge",
  powerId: "word_forge",
  instructionLabel: "Choose the letter or letter team for this sound.",
  visualCue: Object.freeze({ kind: "whole_word" }),
  status: "active",
  correction: null,
  slots: Object.freeze([
    Object.freeze({ id: "workbench-ship-slot-1", tileId: null }),
    Object.freeze({ id: "workbench-ship-slot-2", tileId: null }),
    Object.freeze({ id: "workbench-ship-slot-3", tileId: null })
  ]),
  rack: shipRack,
  sweep: "not_ready",
  morphology: null
});

const shipAwaiting = Object.freeze({
  ...shipReady,
  status: "awaiting_mission_commit",
  slots: Object.freeze([
    Object.freeze({ id: "workbench-ship-slot-1", tileId: "workbench-ship-rack-sh" }),
    shipReady.slots[1],
    shipReady.slots[2]
  ])
});

const shipSweepReady = Object.freeze({
  ...shipReady,
  slots: Object.freeze([
    Object.freeze({ id: "workbench-ship-slot-1", tileId: "workbench-ship-rack-sh" }),
    Object.freeze({ id: "workbench-ship-slot-2", tileId: "workbench-ship-rack-i" }),
    Object.freeze({ id: "workbench-ship-slot-3", tileId: "workbench-ship-rack-p" })
  ]),
  sweep: "ready"
});

const shipCorrection = Object.freeze({
  ...shipReady,
  correction: Object.freeze({
    supportLevel: 1,
    mode: "retry",
    replayContrast: true,
    isolatePosition: null,
    reduceIrrelevantLoad: false,
    modelOnce: false,
    requiresFreshAttempt: false,
    queueIsomorphicReview: false
  })
});

const morphologyReady = Object.freeze({
  challengeId: "content-placement-attempt:visit:morphology:s38-morphology:0:0:challenge:0:morphology",
  powerId: "word_forge",
  instructionLabel: "Endings can change or extend a word.",
  visualCue: Object.freeze({ kind: "morphology" }),
  status: "active",
  correction: null,
  slots: Object.freeze([
    Object.freeze({ id: "morphology-base-slot", tileId: "morphology-base-fixed" }),
    Object.freeze({ id: "morphology-ending-slot", tileId: null })
  ]),
  rack: Object.freeze([Object.freeze({ id: "morphology-ending-tile", label: "s" })]),
  sweep: "not_ready",
  morphology: Object.freeze({
    kind: "morphology_introduction",
    baseWord: "cat",
    ending: "s",
    derivedWord: "cats",
    meaning: "more than one"
  })
});

const morphologyAdvanced = Object.freeze({
  ...morphologyReady,
  status: "awaiting_mission_commit",
  slots: Object.freeze([
    morphologyReady.slots[0],
    Object.freeze({ id: "morphology-ending-slot", tileId: "morphology-ending-tile" })
  ]),
  sweep: "meaning_ready"
});

const meaningPayoff = Object.freeze({
  support: getMeaningSupport("ship"),
  visual: resolveMeaningVisual(getMeaningSupport("ship").visualSemanticId),
  reducedMotion: parameters.get("motion") === "reduced"
});

const correctionPresentation = Object.freeze({
  mode: "retry",
  replayContrast: true,
  selectedContrast: "ch",
  visibleText: "You chose ch. Listen to ch and sh, then try again.",
  spokenText: "You chose ch. Listen to ch and sh, then try again."
});

window.__soundSeekersWorkbenchInputs = [];
window.__soundSeekersWorkbenchReplays = [];

function WorkbenchHarness() {
  const initial = mode === "morphology"
    ? morphologyReady
    : mode === "sweep" ? shipSweepReady
      : mode === "correction" ? shipCorrection : shipReady;
  const [model, setModel] = useState(initial);
  window.__setSoundSeekersWorkbenchModel = next => {
    if (next === "ship-awaiting") setModel(shipAwaiting);
    if (next === "morphology-advanced") setModel(morphologyAdvanced);
  };
  return (
    <div data-workbench-harness="task2-controlled-v2">
      <WordWorkbench
        model={model}
        pronunciation={mode === "morphology" ? null : shipPronunciation}
        meaningPayoff={mode === "meaning" ? meaningPayoff : null}
        correctionPresentation={mode === "correction" ? correctionPresentation : null}
        onInput={input => window.__soundSeekersWorkbenchInputs.push(input)}
        onReplayWholeWord={() => window.__soundSeekersWorkbenchReplays.push("whole-word")}
        onReplayMeaning={() => window.__soundSeekersWorkbenchReplays.push("meaning")}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<WorkbenchHarness />);
