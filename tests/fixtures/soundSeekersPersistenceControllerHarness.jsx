import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";
import { useSoundSeekersProgressController } from "../../src/features/soundSeekers/runtime/useSoundSeekersProgressController.js";
import { questProgressStorageKey } from "../../src/utils/questStore.js";

function resumableState(base, {
  journeyStep,
  stopId,
  settings = {},
  assignment = base.assignment
}) {
  return normalizeSoundSeekersState({
    ...base,
    trail: {
      ...base.trail,
      journeyStep,
      routeCursor: journeyStep
    },
    checkpoint: {
      contentVersion: base.contentVersion,
      stopId
    },
    assignment,
    settings: { ...base.settings, ...settings }
  });
}

function notifyHydrated(scope) {
  window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
    detail: {
      studentId: scope,
      rows: [{ area: "phonics_quest", key: "__all__" }],
      resetApplied: false
    }
  }));
}

function ProgressSurface({ scope, onUnmount, onScopeChange }) {
  const { state, commitState } = useSoundSeekersProgressController(scope);

  const createConflict = () => {
    const local = resumableState(state, {
      journeyStep: 4,
      stopId: "s4",
      settings: {
        soundEnabled: false,
        highContrast: false,
        displayMode: "auto"
      }
    });
    commitState(local);
    const remoteBase = createSoundSeekersState();
    const remote = resumableState(remoteBase, {
      journeyStep: 18,
      stopId: "s18",
      settings: { highContrast: true, displayMode: "pixel" }
    });
    localStorage.setItem(questProgressStorageKey(scope), JSON.stringify(remote));
    notifyHydrated(scope);
  };

  const commitAndUnmount = () => {
    commitState(resumableState(state, {
      journeyStep: 6,
      stopId: "s6",
      settings: { highContrast: true }
    }));
    onUnmount();
  };

  const commitAndSwitchScope = () => {
    commitState(resumableState(state, {
      journeyStep: 7,
      stopId: "s7",
      settings: { simplifiedScene: true }
    }));
    onScopeChange(`${scope}-next`);
  };

  const attemptAssignmentTakeover = () => {
    commitState(resumableState(state, {
      journeyStep: Math.max(2, state.trail.journeyStep + 1),
      stopId: "s6",
      assignment: {
        targets: ["attacker_target"],
        note: "Child-owned replacement"
      }
    }), { flush: true });
  };

  return (
    <section data-sound-seekers-persistence-ready="true">
      <h1>Sound Seekers persistence controller</h1>
      <output data-testid="progress-scope">{scope}</output>
      <pre data-testid="progress-snapshot">{JSON.stringify(state)}</pre>
      <button type="button" onClick={createConflict}>Create local and remote conflict</button>
      <button type="button" onClick={commitAndUnmount}>Commit route and unmount</button>
      <button type="button" onClick={commitAndSwitchScope}>Commit route and switch scope</button>
      <button type="button" onClick={() => onScopeChange(`${scope}-next`)}>Switch progress scope</button>
      <button type="button" onClick={attemptAssignmentTakeover}>Attempt child assignment takeover</button>
      <button type="button" onClick={onUnmount}>Unmount progress controller</button>
    </section>
  );
}

function PersistenceHarness() {
  const requestedScope = new URLSearchParams(window.location.search).get("scope");
  const [scope, setScope] = useState(requestedScope || "sound-seekers-persistence");
  const [mounted, setMounted] = useState(true);

  return (
    <div data-sound-seekers-persistence-harness="">
      {mounted ? (
        <ProgressSurface
          scope={scope}
          onUnmount={() => setMounted(false)}
          onScopeChange={setScope}
        />
      ) : (
        <section data-testid="controller-unmounted">
          <p>Progress controller unmounted.</p>
          <button type="button" onClick={() => setMounted(true)}>Mount progress controller</button>
        </section>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PersistenceHarness />
  </StrictMode>
);
