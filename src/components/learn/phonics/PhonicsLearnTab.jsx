import { Suspense, useEffect, useState } from "react";
import { loadCvcProgress, saveCvcProgress } from "../../../utils/cvcProgress";
import { loadPhonicsProgress, savePhonicsProgress } from "../../../utils/phonicsProgress";
import { cvcWordFamilies } from "../../../data/cvcWordFamilies";
import { PhonicsAlphabetPicker } from "./PhonicsAlphabetPicker";
import { CvcLearningFlow } from "./cvc/CvcLearningFlow";
import { useCvcSoundCue } from "./cvc/cvcHelpers";
import { WorkshopFamilyPicker } from "./cvc/WorkshopFamilyPicker";
import { PhonicsLearningFlow } from "./PhonicsLearningFlow";
import { lazyWithRetry } from "../../../utils/lazyWithRetry";

const GameArcadeHub = lazyWithRetry(() => import("../games/GameArcadeHub").then(module => ({
  default: module.GameArcadeHub
})));

function getInitialIsland() {
  try {
    const wantsGame = window.localStorage.getItem("lp-open-game");
    const wantsArcade = window.localStorage.getItem("lp-open-arcade");
    if (wantsArcade) window.localStorage.removeItem("lp-open-arcade");
    return wantsGame || wantsArcade ? "games" : "letters";
  } catch {
    return "letters";
  }
}

function IslandIcon({ type }) {
  if (type === "games") {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64" focusable="false">
        <rect x="10" y="22" width="44" height="28" rx="10" />
        <path d="M23 36h10M28 31v10" />
        <circle cx="42" cy="34" r="2.8" />
        <circle cx="48" cy="40" r="2.8" />
        <path d="M24 22c0-8 16-8 16 0" />
      </svg>
    );
  }

  if (type === "words") {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64" focusable="false">
        <path d="M18 44c2-11 10-18 22-18s18 7 20 18" />
        <path d="M23 26c1-8 7-13 15-13s14 5 15 13" />
        <rect x="11" y="40" width="12" height="12" rx="3" />
        <rect x="26" y="40" width="12" height="12" rx="3" />
        <rect x="41" y="40" width="12" height="12" rx="3" />
      </svg>
    );
  }

  return <span aria-hidden="true">Aa</span>;
}

function IslandLockIcon() {
  return (
    <svg className="phonics-island-lock" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
    </svg>
  );
}

export function PhonicsLearnTab({
  initialIsland = "",
  progressScopeKey = "default"
}) {
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeFamily, setActiveFamily] = useState(null);
  const [activeIsland, setActiveIsland] = useState(() => initialIsland || getInitialIsland());
  const [progress, setProgress] = useState(() => loadPhonicsProgress(progressScopeKey));
  const [cvcProgress, setCvcProgress] = useState(() => loadCvcProgress(progressScopeKey));
  const { playCue } = useCvcSoundCue();
  const completedLettersCount = Object.values(progress).filter(status => status === "completed").length;
  const completedWordFamiliesCount = Object.values(cvcProgress).filter(status => status === "completed").length;
  const wordsUnlocked = completedLettersCount >= 6;
  const lettersToUnlockWords = Math.max(0, 6 - completedLettersCount);
  const nextStepText = wordsUnlocked
    ? "Choose letters, practise sounds, or build short words."
    : `Learn ${lettersToUnlockWords} more letter${lettersToUnlockWords === 1 ? "" : "s"} to unlock Word Workshop.`;

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId !== progressScopeKey) return;
      setProgress(loadPhonicsProgress(progressScopeKey));
      setCvcProgress(loadCvcProgress(progressScopeKey));
    }

    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);

  function handleSelectLetter(letter) {
    const updated = {
      ...progress,
      [letter]: progress[letter] === "completed" ? "completed" : "inprogress"
    };
    setProgress(updated);
    savePhonicsProgress(progressScopeKey, updated);
    setActiveLetter(letter);
  }

  function handleSelectFamily(family) {
    const updated = {
      ...cvcProgress,
      [family.id]: cvcProgress[family.id] === "completed" ? "completed" : "inprogress"
    };
    setCvcProgress(updated);
    saveCvcProgress(progressScopeKey, updated);
    setActiveFamily(family);
  }

  function handleLetterComplete(letter) {
    const updated = { ...progress, [letter]: "completed" };
    setProgress(updated);
    savePhonicsProgress(progressScopeKey, updated);
    setActiveLetter(null);
  }

  function handleFamilyComplete(family) {
    const updated = { ...cvcProgress, [family.id]: "completed" };
    setCvcProgress(updated);
    saveCvcProgress(progressScopeKey, updated);
    setActiveFamily(null);
  }

  function handleBack() {
    setActiveLetter(null);
    setActiveFamily(null);
  }

  function handleIslandClick(island) {
    if (island === "words" && !wordsUnlocked) {
      playCue("", "Learn 6 letters first!");
      return;
    }
    setActiveIsland(island);
  }

  if (activeLetter) {
    return (
      <PhonicsLearningFlow
        letter={activeLetter}
        onBack={handleBack}
        onComplete={() => handleLetterComplete(activeLetter)}
      />
    );
  }

  if (activeFamily) {
    return (
      <CvcLearningFlow
        family={activeFamily}
        onBack={handleBack}
        onComplete={() => handleFamilyComplete(activeFamily)}
      />
    );
  }

  if (activeIsland === "games") {
    return (
      <div className="phonics-arcade-surface">
        <Suspense fallback={<div className="phonics-arcade-loading">Loading games...</div>}>
          <GameArcadeHub progressScopeKey={progressScopeKey} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="phonics-island-view">
      <section className="phonics-practice-overview" aria-label="Phonics practice progress">
        <div>
          <span className="phonics-practice-kicker">Phonics</span>
          <h1 data-child-title="">Letters, Sounds, Words</h1>
          <p data-child-instruction="">{nextStepText}</p>
        </div>
        <div className="phonics-practice-stats" aria-label="Quest totals" data-child-progress="">
          <span><strong>{completedLettersCount} of 26</strong> letters</span>
          <span><strong>{completedWordFamiliesCount} of {cvcWordFamilies.length}</strong> word nests</span>
        </div>
      </section>

      <div className="phonics-island-switcher" aria-label="Choose Learn area" data-child-choices="">
        <button
          className={`phonics-island-card ${activeIsland === "letters" ? "active" : ""}`}
          onClick={() => handleIslandClick("letters")}
          type="button"
          aria-label="Letters"
        >
          <IslandIcon type="letters" />
          <span className="phonics-island-label">
            <span>Letters</span>
            <small>{completedLettersCount} of 26 complete</small>
          </span>
        </button>
        <button
          className={`phonics-island-card ${activeIsland === "words" ? "active" : ""} ${wordsUnlocked ? "" : "locked"}`}
          onClick={() => handleIslandClick("words")}
          type="button"
          aria-label={wordsUnlocked ? "Words" : "Words locked. Learn 6 letters first."}
        >
          <IslandIcon type="words" />
          <span className="phonics-island-label">
            <span>Words</span>
            <small>{wordsUnlocked ? `${completedWordFamiliesCount}/${cvcWordFamilies.length} built` : `${lettersToUnlockWords} ${lettersToUnlockWords === 1 ? "letter" : "letters"} to unlock`}</small>
          </span>
          {!wordsUnlocked && <IslandLockIcon />}
        </button>
      </div>

      {activeIsland === "words" && wordsUnlocked ? (
        <WorkshopFamilyPicker
          progress={cvcProgress}
          onSelectFamily={handleSelectFamily}
        />
      ) : (
        <PhonicsAlphabetPicker
          progress={progress}
          onSelectLetter={handleSelectLetter}
        />
      )}
    </div>
  );
}
