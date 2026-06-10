import { useState } from "react";
import { loadCvcProgress, saveCvcProgress } from "../../../utils/cvcProgress";
import { loadPhonicsProgress, savePhonicsProgress } from "../../../utils/phonicsProgress";
import { PhonicsAlphabetPicker } from "./PhonicsAlphabetPicker";
import { CvcLearningFlow } from "./cvc/CvcLearningFlow";
import { useCvcSoundCue } from "./cvc/cvcHelpers";
import { WorkshopFamilyPicker } from "./cvc/WorkshopFamilyPicker";
import { PhonicsLearningFlow } from "./PhonicsLearningFlow";

function IslandIcon({ type }) {
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

export function PhonicsLearnTab({ progressScopeKey = "default" }) {
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeFamily, setActiveFamily] = useState(null);
  const [activeIsland, setActiveIsland] = useState("letters");
  const [progress, setProgress] = useState(() => loadPhonicsProgress(progressScopeKey));
  const [cvcProgress, setCvcProgress] = useState(() => loadCvcProgress(progressScopeKey));
  const { playCue } = useCvcSoundCue();
  const completedLettersCount = Object.values(progress).filter(status => status === "completed").length;
  const wordsUnlocked = completedLettersCount >= 6;

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

  return (
    <div className="phonics-island-view">
      <div className="phonics-island-switcher" aria-label="Choose Learn area">
        <button
          className={`phonics-island-card ${activeIsland === "letters" ? "active" : ""}`}
          onClick={() => handleIslandClick("letters")}
          type="button"
          aria-label="Letters"
        >
          <IslandIcon type="letters" />
          <span>Letters</span>
        </button>
        <button
          className={`phonics-island-card ${activeIsland === "words" ? "active" : ""} ${wordsUnlocked ? "" : "locked"}`}
          onClick={() => handleIslandClick("words")}
          type="button"
          aria-label={wordsUnlocked ? "Words" : "Words locked. Learn 6 letters first."}
        >
          <IslandIcon type="words" />
          <span>Words</span>
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
