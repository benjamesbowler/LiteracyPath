import { Suspense, useEffect, useState } from "react";
import { loadCvcProgress, saveCvcProgress, recordCvcCompletion } from "../../../utils/cvcProgress";
import { loadPhonicsProgress, savePhonicsProgress, recordPhonicsCompletion } from "../../../utils/phonicsProgress";
import { cvcWordFamilies } from "../../../data/cvcWordFamilies";
import { PhonicsAlphabetPicker } from "./PhonicsAlphabetPicker";
import { CvcLearningFlow } from "./cvc/CvcLearningFlow";
import { getWorkshopPrerequisites } from "./phonicsActivityState.js";
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

function PhonicsLearnContent({
  initialIsland = "",
  initialStep = 1,
  leaderboardAvailable = false,
  leaderboardClient,
  leaderboardStudentToken,
  lockedToLetters = false,
  lockedGameId = null,
  onLockedGameAvailabilityChange = null,
  progressScopeKey = "default"
}) {
  const exactGameLock = lockedGameId !== null;
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeFamily, setActiveFamily] = useState(null);
  const [activeIsland, setActiveIsland] = useState(() => (
    exactGameLock ? "games" : initialIsland || getInitialIsland()
  ));
  const [progress, setProgress] = useState(() => loadPhonicsProgress(progressScopeKey));
  const [cvcProgress, setCvcProgress] = useState(() => loadCvcProgress(progressScopeKey));

  const completedLettersCount = Object.values(progress).filter(status => status === "completed").length;
  const completedWordFamiliesCount = Object.values(cvcProgress).filter(status => status === "completed").length;
  const wordsUnlocked = cvcWordFamilies.some(family => getWorkshopPrerequisites(family, progress).eligible);
  const nextStepText = "Choose letters to practise, or see which letters each word nest needs.";

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
    if (!getWorkshopPrerequisites(family, progress).eligible) return;
    const updated = {
      ...cvcProgress,
      [family.id]: cvcProgress[family.id] === "completed" ? "completed" : "inprogress"
    };
    setCvcProgress(updated);
    saveCvcProgress(progressScopeKey, updated);
    setActiveFamily(family);
  }

  function handleLetterComplete(letter, completion) {
    const result = recordPhonicsCompletion(progressScopeKey, letter, completion);
    if (result.localSaved || result.queued) setProgress(previous => ({ ...previous, [letter]: "completed" }));
    return result;
  }

  function handleFamilyComplete(family, completion) {
    const result = recordCvcCompletion(progressScopeKey, family.id, completion);
    if (result.localSaved || result.queued) setCvcProgress(previous => ({ ...previous, [family.id]: "completed" }));
    return result;
  }

  function handleBack() {
    setActiveLetter(null);
    setActiveFamily(null);
  }

  function handleIslandClick(island) {
    if (exactGameLock && island !== "games") return;
    if (lockedToLetters && island !== "letters") return;
    setActiveIsland(island);
  }

  if (activeLetter) {
    return (
      <PhonicsLearningFlow
        key={`${progressScopeKey}:${activeLetter}`}
        letter={activeLetter}
        initialStep={initialStep}
        onBack={handleBack}
        onComplete={completion => handleLetterComplete(activeLetter, completion)}
        onExit={handleBack}
      />
    );
  }

  if (activeFamily) {
    return (
      <CvcLearningFlow
        key={`${progressScopeKey}:${activeFamily.id}`}
        family={activeFamily}
        initialStep={initialStep}
        onBack={handleBack}
        onComplete={completion => handleFamilyComplete(activeFamily, completion)}
        onExit={handleBack}
      />
    );
  }

  if (activeIsland === "games") {
    return (
      <div className="phonics-arcade-surface">
        <Suspense fallback={<div className="phonics-arcade-loading">Loading games...</div>}>
          <GameArcadeHub
            leaderboardAvailable={leaderboardAvailable}
            leaderboardClient={leaderboardClient}
            leaderboardStudentToken={leaderboardStudentToken}
            lockedGameId={lockedGameId}
            onLockedGameAvailabilityChange={onLockedGameAvailabilityChange}
            progressScopeKey={progressScopeKey}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="phonics-island-view">
      <section className="phonics-practice-overview" aria-label="Phonics practice progress">
        <div>
          <span className="phonics-practice-kicker">Phonics</span>
          <h2>{lockedToLetters ? "Letters and Sounds" : "Letters, Sounds, Words"}</h2>
          <p>{lockedToLetters ? "Choose a letter and practise its sound." : nextStepText}</p>
        </div>
        <div className="phonics-practice-stats" aria-label="Quest totals">
          <span><strong>{completedLettersCount} of 26</strong> letters</span>
          {!lockedToLetters && <span><strong>{completedWordFamiliesCount} of {cvcWordFamilies.length}</strong> word nests</span>}
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
        {!lockedToLetters && (
          <button
            className={`phonics-island-card ${activeIsland === "words" ? "active" : ""}`}
            onClick={() => handleIslandClick("words")}
            type="button"
            aria-label={wordsUnlocked ? "Words" : "Words. See letters to practise first."}
          >
            <IslandIcon type="words" />
            <span className="phonics-island-label">
              <span>Words</span>
              <small>{wordsUnlocked ? `${completedWordFamiliesCount}/${cvcWordFamilies.length} built` : "See letters to practise"}</small>
            </span>
          </button>
        )}
      </div>

      {activeIsland === "words" ? (
        <WorkshopFamilyPicker
          letterProgress={progress}
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

export function PhonicsLearnTab(props) {
  return <PhonicsLearnContent key={props.progressScopeKey || "default"} {...props} />;
}
