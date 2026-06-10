import { useState } from "react";
import { loadPhonicsProgress, savePhonicsProgress } from "../../../utils/phonicsProgress";
import { PhonicsAlphabetPicker } from "./PhonicsAlphabetPicker";
import { PhonicsLearningFlow } from "./PhonicsLearningFlow";

export function PhonicsLearnTab({ progressScopeKey = "default" }) {
  const [activeLetter, setActiveLetter] = useState(null);
  const [progress, setProgress] = useState(() => loadPhonicsProgress(progressScopeKey));

  function handleSelectLetter(letter) {
    setActiveLetter(letter);
  }

  function handleLetterComplete(letter) {
    const updated = { ...progress, [letter]: "completed" };
    setProgress(updated);
    savePhonicsProgress(progressScopeKey, updated);
    setActiveLetter(null);
  }

  function handleBack() {
    setActiveLetter(null);
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

  return (
    <PhonicsAlphabetPicker
      progress={progress}
      onSelectLetter={handleSelectLetter}
    />
  );
}
