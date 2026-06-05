import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import logomarkUrl from "../assets/logomark.svg";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "../styles/assessment.css";
import { getApprovedAudioPath } from "../data/audioPreferenceManifest";
import {
  getTargetWordAudioPath,
  SHORT_VOWEL_LISTEN_PROMPT
} from "../utils/assessmentAudioRoles";
import {
  getApprovedCardAudioPath,
  shouldShowUniformCardAudio
} from "../assessmentContentValidation";
import {
  getAnswerOptionLabel,
  getAnswerOptionMedia,
  getAnswerOptionValue,
  normalizeAnswerOption
} from "../utils/answerOptions";
import {
  isGraphemeChoiceQuestion
} from "../utils/assessmentChoiceIntent";
import { summarizeAssessmentHistory } from "../data/assessmentHistoryStore.js";
import { getFinalSoundsLevel1QuestionIssues } from "../data/earlyPhonicsValidation.js";
import { getTargetObjectImage } from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { AssessmentAudioButton } from "./assessment/AssessmentAudioButton.jsx";
import { HfwLetterBuildPanel } from "./assessment/HfwLetterBuildPanel.jsx";

export { AuthPage } from "./AuthPage.jsx";

function FixSentenceQuestion({ currentQuestion, answerQuestion }) {
  const [selectedTiles, setSelectedTiles] = useState([]);

  // TODO(fix-sentence-drag): Upgrade this tap-to-order tile builder to true drag-and-drop when touch/mouse reordering is prioritized.
  const tiles = currentQuestion.tiles || currentQuestion.choices || [];
  const builtSentence = selectedTiles.map(item => item.tile).join(" ");
  const availableTiles = tiles
    .map((tile, index) => ({ tile, index }))
    .filter(item =>
      !selectedTiles.some(selected => selected.index === item.index)
    );

  useEffect(() => {
    setSelectedTiles([]);
  }, [currentQuestion.id]);

  function addTile(item) {
    setSelectedTiles(prev => [...prev, item]);
  }

  function removeTile(index) {
    setSelectedTiles(prev =>
      prev.filter((_, selectedIndex) => selectedIndex !== index)
    );
  }

  return (
    <div className="fix-sentence-panel">
      <div className="broken-sentence">
        <span>Fix:</span>
        <strong>{currentQuestion.brokenSentence}</strong>
      </div>

      <div className="sentence-builder" aria-label="Built sentence">
        {selectedTiles.length === 0 ? (
          <span className="sentence-placeholder">Tap words to build the sentence</span>
        ) : (
          selectedTiles.map((item, index) => (
            <button
              className="sentence-tile selected"
              key={`${item.tile}-${item.index}`}
              onClick={() => removeTile(index)}
              type="button"
            >
              {item.tile}
            </button>
          ))
        )}
      </div>

      <div className="sentence-tiles" aria-label="Word tiles">
        {availableTiles.map(item => (
          <button
            className="sentence-tile"
            key={`${item.tile}-${item.index}`}
            onClick={() => addTile(item)}
            type="button"
          >
            {item.tile}
          </button>
        ))}
      </div>

      <div className="fix-sentence-actions">
        <button
          className="reset-button"
          onClick={() => setSelectedTiles([])}
          type="button"
        >
          Reset
        </button>

        <button
          className="main-button"
          disabled={selectedTiles.length === 0}
          onClick={() => answerQuestion(builtSentence)}
          type="button"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function TopNavigation({
  appView,
  nameSaved,
  studentName,
  currentStage,
  goToOverview,
  goToSkills,
  goToElAssessments,
  goToGuidedReading,
  goToTeacherDashboard,
  goToLearn,
  goToTools,
  switchStudent,
  viewReport,
  teacherEmail,
  logOutTeacher,
  isAdmin,
  openAdminDashboard
}) {
  const activeStep =
    appView === "letters" || appView === "advancedPhonics" ? "assessment" : appView;
  const infoItems = [
    { id: "section", label: activeStep === "select" ? "Class/Student Select" : "Teacher Mode", active: true },
    {
      id: "teacher",
      label: teacherEmail || "Signed in",
      onClick: goToTeacherDashboard,
      ariaLabel: "Open Teacher Dashboard"
    },
    {
      id: "student",
      label: nameSaved ? studentName || "Unnamed student" : "No student selected",
      onClick: nameSaved ? goToOverview : null,
      ariaLabel: nameSaved ? "Open Student Overview" : undefined
    },
    ...(nameSaved && currentStage ? [{
      id: "stage",
      label: currentStage.label,
      onClick: goToSkills,
      ariaLabel: "Open Skills"
    }] : [])
  ];
  const needsStudentTitle = nameSaved ? undefined : "Select a student first";
  const getStudentActionLabel = (label) => (
    nameSaved ? undefined : `${label} unavailable. Select a student first.`
  );

  return (
    <nav className="top-nav" aria-label="Teacher navigation">
      <div className="top-nav-identity">
        <img src={logomarkUrl} alt="Literacy Guide" className="top-nav-logo" aria-hidden="true" />
        <div className="breadcrumb" aria-label="Current teacher context">
        {infoItems.map((item, index) => (
          <span
            className={
              item.active
                ? "breadcrumb-step active"
                : "breadcrumb-step"
            }
            key={item.id}
          >
            {item.onClick ? (
              <button
                aria-label={item.ariaLabel}
                className="breadcrumb-button"
                onClick={item.onClick}
                type="button"
              >
                <span className="breadcrumb-label">{item.label}</span>
              </button>
            ) : (
              <span className="breadcrumb-label">{item.label}</span>
            )}
            {index < infoItems.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </span>
        ))}
        </div>
      </div>

      <div className="top-nav-actions">
        <div className="top-nav-group" role="group" aria-label="Student navigation">
          <span className="top-nav-group-label">Student</span>
          <div className="top-nav-group-actions">
            <button
              aria-label={getStudentActionLabel("Student Overview")}
              className={appView === "overview" ? "nav-button primary" : "nav-button"}
              onClick={goToOverview}
              disabled={!nameSaved}
              title={needsStudentTitle}
            >
              Student Overview
            </button>

            <button
              aria-label={getStudentActionLabel("Skills")}
              className={appView === "skills" ? "nav-button primary" : "nav-button"}
              onClick={goToSkills}
              disabled={!nameSaved}
              title={needsStudentTitle}
            >
              Skills
            </button>

            <button
              aria-label={getStudentActionLabel("EL Assessments")}
              className={appView === "elAssessments" ? "nav-button primary" : "nav-button"}
              onClick={goToElAssessments}
              disabled={!nameSaved}
              title={needsStudentTitle}
            >
              EL Assessments
            </button>

            <button
              aria-label={getStudentActionLabel("Guided Reading")}
              className={appView === "guidedReading" ? "nav-button primary" : "nav-button"}
              onClick={goToGuidedReading}
              disabled={!nameSaved}
              title={needsStudentTitle}
            >
              Guided Reading
            </button>

            <button
              className={appView === "learn" ? "nav-button primary" : "nav-button"}
              onClick={goToLearn}
            >
              Story Quest Adventures
            </button>
          </div>
        </div>

        <div className="top-nav-group" role="group" aria-label="Teacher navigation actions">
          <span className="top-nav-group-label">Teacher</span>
          <div className="top-nav-group-actions">
            <button
              className={appView === "teacherDashboard" ? "nav-button primary" : "nav-button"}
              onClick={goToTeacherDashboard}
            >
              Teacher Dashboard
            </button>

            <button
              aria-label={getStudentActionLabel("Tools")}
              className={appView === "tools" ? "nav-button primary" : "nav-button"}
              onClick={goToTools}
              disabled={!nameSaved}
              title={needsStudentTitle}
            >
              Tools
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="top-nav-group" role="group" aria-label="Admin navigation">
            <span className="top-nav-group-label">Admin</span>
            <div className="top-nav-group-actions">
              <button className="nav-button" onClick={openAdminDashboard}>
                Admin Dashboard
              </button>
            </div>
          </div>
        )}

        <div className="top-nav-group account" role="group" aria-label="Account actions">
          <span className="top-nav-group-label">Account</span>
          <div className="top-nav-group-actions">
            <button className="nav-button" onClick={switchStudent}>
              Switch Student
            </button>

            <button className="nav-button" onClick={logOutTeacher}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function PairSelectionQuestion({ currentQuestion, answerQuestion, speakText }) {
  const [selectedWords, setSelectedWords] = useState([]);
  const showCardAudio = shouldShowUniformCardAudio(currentQuestion.imageCards || []);
  const isFinalSoundsPair = currentQuestion?.skillId === "final_sounds" || currentQuestion?.questionType === "final_sound_pair";

  useEffect(() => {
    setSelectedWords([]);
  }, [currentQuestion.id]);

  function toggleWord(word) {
    setSelectedWords(previous => {
      if (previous.includes(word)) {
        return previous.filter(item => item !== word);
      }

      if (previous.length >= 2) {
        return [previous[1], word];
      }

      return [...previous, word];
    });
  }

  return (
    <div className={isFinalSoundsPair ? "initial-sound-pair-panel final-sounds-pair-panel" : "initial-sound-pair-panel"}>
      <div className={isFinalSoundsPair ? "initial-sound-card-grid final-sounds-pair-grid" : "initial-sound-card-grid"}>
        {(currentQuestion.imageCards || []).map(card => {
          const label = getAnswerOptionLabel(card) || card.word;
          const value = getAnswerOptionValue(card) || label;
          const selected = selectedWords.includes(value);
          const image = card.image || card.imageUrl || card.imagePath || "";

          return (
            <article
              className={[
                "initial-sound-card",
                isFinalSoundsPair ? "final-sounds-pair-card" : "",
                selected ? "selected" : ""
              ].filter(Boolean).join(" ")}
              key={value}
            >
              <button
                className={isFinalSoundsPair ? "initial-sound-image-button final-sounds-pair-image-button" : "initial-sound-image-button"}
                onClick={() => toggleWord(value)}
                aria-pressed={selected}
                aria-label={`Select picture for ${label}`}
                type="button"
              >
                <img src={image} alt={card.alt || `Picture for ${label}`} />
                {!currentQuestion.hideWrittenLabels && <strong>{label}</strong>}
              </button>

              {showCardAudio && (
                <AssessmentAudioButton
                  text={label}
                  audioPath={getApprovedCardAudioPath(card)}
                  speakText={speakText}
                  label={`Hear ${label}`}
                  className="initial-sound-card-audio"
                />
              )}
            </article>
          );
        })}
      </div>

      <button
        className={isFinalSoundsPair ? "main-button initial-sound-submit final-sounds-pair-submit" : "main-button initial-sound-submit"}
        disabled={selectedWords.length !== 2}
        onClick={() => answerQuestion(selectedWords)}
        type="button"
      >
        Submit
      </button>
    </div>
  );
}

function VisualCardChoiceQuestion({ currentQuestion, answerQuestion, speakText }) {
  const [selectedValues, setSelectedValues] = useState([]);
  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);
  const showCardAudio = !isRhymingPictureItem && shouldShowUniformCardAudio(currentQuestion.imageCards || []);
  const requiredSelections = Math.max(1, Number(currentQuestion.requiredSelections || currentQuestion.correctAnswers?.length || 1));
  const isMultiSelect = isRhymingPictureItem && requiredSelections > 1;
  const panelClassName = isRhymingPictureItem
    ? "visual-card-choice-panel rhyming-picture-panel"
    : "visual-card-choice-panel";
  const gridClassName = isRhymingPictureItem
    ? "visual-card-grid rhyming-picture-grid"
    : "visual-card-grid";

  useEffect(() => {
    setSelectedValues([]);
  }, [currentQuestion.id]);

  function toggleValue(value) {
    setSelectedValues(previous => {
      if (previous.includes(value)) return previous.filter(item => item !== value);
      if (previous.length >= requiredSelections) return [...previous.slice(1), value];
      return [...previous, value];
    });
  }

  return (
    <div className={panelClassName}>
      <div className={gridClassName}>
        {(currentQuestion.imageCards || []).map(card => {
          const label = getAnswerOptionLabel(card) || card.word;
          const value = getAnswerOptionValue(card) || label;
          const image = card.image || card.imageUrl || card.imagePath || "";
          const selected = selectedValues.includes(value);

          return (
            <article
              className={[
                isRhymingPictureItem ? "visual-assessment-card rhyming-answer-card" : "visual-assessment-card",
                selected ? "selected" : ""
              ].filter(Boolean).join(" ")}
              key={card.id || value}
            >
              <button
                className="visual-assessment-card-button"
                onClick={() => isMultiSelect ? toggleValue(value) : answerQuestion(value)}
                aria-label={isMultiSelect ? `Select ${label}` : `Choose ${label}`}
                aria-pressed={isMultiSelect ? selected : undefined}
                type="button"
              >
                {image && (
                  <img src={image} alt={card.alt || `Picture for ${label}`} />
                )}
                {!currentQuestion.hideWrittenLabels && <strong>{label}</strong>}
              </button>

              {showCardAudio && (
                <AssessmentAudioButton
                  text={label}
                  audioPath={getApprovedCardAudioPath(card)}
                  speakText={speakText}
                  label={`Hear ${label}`}
                  className="initial-sound-card-audio"
                />
              )}
            </article>
          );
        })}
      </div>

      {isMultiSelect && (
        <button
          className="main-button initial-sound-submit"
          disabled={selectedValues.length !== requiredSelections}
          onClick={() => answerQuestion(selectedValues)}
          type="button"
        >
          Submit {selectedValues.length}/{requiredSelections}
        </button>
      )}
    </div>
  );
}

function GrammarSentenceFitQuestion({ currentQuestion, answerQuestion, speakText }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const answerOptions = currentQuestion.answerOptions || [];
  const normalizedAnswerOptions = answerOptions.map(option => ({
    ...normalizeAnswerOption(option),
    media: getAnswerOptionMedia(option)
  }));
  const sentence = currentQuestion.sentence || "";
  const [beforeBlank, afterBlank = ""] = sentence.split("___");

  useEffect(() => {
    setSelectedOption(null);
  }, [currentQuestion.id]);

  function selectOption(option) {
    setSelectedOption(option);
  }

  function handleDrop(event) {
    event.preventDefault();
    const value = event.dataTransfer.getData("text/plain");
    const option = normalizedAnswerOptions.find(item => item.value === value);
    if (option) selectOption(option);
  }

  return (
    <div className="ixl-template-panel grammar-sentence-fit-panel">
      <div
        className="sound-order-build grammar-sentence-drop-zone"
        onDragOver={event => event.preventDefault()}
        onDrop={handleDrop}
        aria-label="Sentence answer"
      >
        <span>{beforeBlank}</span>
        <span className={selectedOption ? "sound-order-selected-tile" : "sound-order-empty-slot"}>
          {selectedOption?.label || ""}
        </span>
        <span>{afterBlank}</span>
      </div>

      <div className="ixl-answer-grid four-options">
        {normalizedAnswerOptions.map((option, index) => {
          const audioPath = getApprovedAudioPath(option.label, option.media.audio || "");
          const selected = selectedOption?.value === option.value;

          return (
            <article
              className={selected ? "ixl-answer-card selected" : "ixl-answer-card"}
              key={`${option.value}-${index}`}
            >
              <button
                className="ixl-answer-button"
                draggable
                onClick={() => selectOption(option)}
                onDragStart={event => event.dataTransfer.setData("text/plain", option.value)}
                type="button"
              >
                <strong>{option.label}</strong>
              </button>

              {audioPath && (
                <AssessmentAudioButton
                  text={option.label}
                  audioPath={audioPath}
                  speakText={speakText}
                  label={`Hear ${option.label}`}
                  className="initial-sound-card-audio"
                />
              )}
            </article>
          );
        })}
      </div>

      <div className="button-row ixl-template-actions">
        <button
          className="reset-button"
          onClick={() => setSelectedOption(null)}
          type="button"
        >
          Reset
        </button>
        <button
          className="main-button"
          disabled={!selectedOption}
          onClick={() => answerQuestion(selectedOption.value)}
          type="button"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function IxlStyleTemplateQuestion({ currentQuestion, answerQuestion, speakText }) {
  const [selectedTiles, setSelectedTiles] = useState([]);
  const isHfwLetterBuild = isHfwLetterBuildQuestion(currentQuestion);
  const isGrammarSentenceFit = isGrammarSentenceFitQuestion(currentQuestion);
  const isSoundOrder = currentQuestion.templateType === "PUT_SOUNDS_IN_ORDER";
  const isGraphemeChoiceItem = isGraphemeChoiceQuestion(currentQuestion);
  const isShortVowelWordChoiceItem = isShortVowelWordChoiceQuestion(currentQuestion);
  const answerOptions = currentQuestion.answerOptions || [];
  const normalizedAnswerOptions = answerOptions.map(option => ({
    ...normalizeAnswerOption(option),
    media: isGraphemeChoiceItem
      ? { image: "", audio: "", alt: "" }
      : getAnswerOptionMedia(option)
  }));
  const hasImageOptions = !isGraphemeChoiceItem && normalizedAnswerOptions.some(option => Boolean(option.media.image));
  const isCompactLetterOptions =
    (isGraphemeChoiceItem || !hasImageOptions) &&
    normalizedAnswerOptions.length <= 4 &&
    normalizedAnswerOptions.every(option => option.label.length <= 3);
  const answerGridClassName = [
    "ixl-answer-grid",
    normalizedAnswerOptions.length === 4 ? "four-options" : "",
    hasImageOptions ? "image-options" : "",
    isCompactLetterOptions ? "letter-options" : "",
    isShortVowelWordChoiceItem ? "short-vowel-ixl-word-choice-grid" : ""
  ].filter(Boolean).join(" ");
  const showOptionAudio =
    !isGraphemeChoiceItem &&
    normalizedAnswerOptions.length > 0 &&
    normalizedAnswerOptions.every(option => Boolean(getApprovedAudioPath(option.label, option.media.audio || "")));

  useEffect(() => {
    setSelectedTiles([]);
  }, [currentQuestion.id]);

  if (isGrammarSentenceFit) {
    return (
      <GrammarSentenceFitQuestion
        currentQuestion={currentQuestion}
        answerQuestion={answerQuestion}
        speakText={speakText}
      />
    );
  }

  if (isHfwLetterBuild) {
    return (
      <HfwLetterBuildPanel
        currentQuestion={currentQuestion}
        answerQuestion={answerQuestion}
        speakText={speakText}
      />
    );
  }

  function addTile(tile, index) {
    setSelectedTiles(previous => [...previous, { tile, index }]);
  }

  function removeTile(index) {
    setSelectedTiles(previous => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  if (isSoundOrder) {
    const tiles = currentQuestion.soundTiles || [];
    const selectedIndexes = new Set(selectedTiles.map(item => item.index));
    const builtWord = selectedTiles.map(item => item.tile).join("");
    const targetLength = String(currentQuestion.correctAnswer || currentQuestion.answer || "").length;

    return (
      <div className={isHfwLetterBuild ? "ixl-template-panel hfw-letter-build-panel" : "ixl-template-panel"}>
        <div className="sound-order-build" aria-label="Built word">
          {selectedTiles.length === 0 && !isHfwLetterBuild ? (
            <span className="sound-order-placeholder">
              Tap the sounds in order
            </span>
          ) : (
            selectedTiles.map((item, index) => (
              <button
                className="sound-order-selected-tile"
                key={`${item.tile}-${item.index}`}
                onClick={() => removeTile(index)}
                type="button"
              >
                {item.tile}
              </button>
            ))
          )}
          {isHfwLetterBuild && selectedTiles.length < targetLength && (
            Array.from({ length: targetLength - selectedTiles.length }, (_, index) => (
              <span className="sound-order-empty-slot" key={`empty-${index}`} aria-hidden="true"></span>
            ))
          )}
        </div>

        <div className={isHfwLetterBuild ? "sound-order-tile-row hfw-letter-tile-row" : "sound-order-tile-row"}>
          {tiles.map((tile, index) => (
            <button
              className="sound-order-tile"
              disabled={selectedIndexes.has(index)}
              key={`${tile}-${index}`}
              onClick={() => addTile(tile, index)}
              type="button"
            >
              {tile}
            </button>
          ))}
        </div>

        <div className="button-row ixl-template-actions">
          <button
            className="reset-button"
            onClick={() => setSelectedTiles([])}
            type="button"
          >
            Reset
          </button>
          <button
            className="main-button"
            disabled={builtWord.length !== targetLength}
            onClick={() => answerQuestion(builtWord)}
            type="button"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ixl-template-panel">
      {currentQuestion.partialWord && (
        <div className="partial-word-card" aria-label="Partial word">
          {currentQuestion.partialWord}
        </div>
      )}

      <div className={answerGridClassName}>
        {normalizedAnswerOptions.map((option, index) => {
          const label = option.label;
          const value = option.value;
          const image = option.media.image;
          const audioPath = getApprovedAudioPath(label, option.media.audio || "");
          const rawOption = option.raw && typeof option.raw === "object" ? option.raw : {};

          return (
            <article
              className={[
                image ? "ixl-answer-card image-card" : "ixl-answer-card",
                isShortVowelWordChoiceItem ? "short-vowel-ixl-answer-card" : ""
              ].filter(Boolean).join(" ")}
              key={`${value}-${index}`}
            >
              <button
                className={[
                  isGraphemeChoiceItem ? "ixl-answer-button grapheme-text-tile final-sound-text-tile final-sound-grapheme-option" : "ixl-answer-button",
                  isShortVowelWordChoiceItem ? "short-vowel-ixl-answer-button" : ""
                ].filter(Boolean).join(" ")}
                onClick={() => answerQuestion(value)}
                type="button"
              >
                {!isGraphemeChoiceItem && image && (
                  <img src={image} alt={rawOption.alt || rawOption.imageAlt || `Picture for ${label}`} />
                )}
                <strong>{label}</strong>
              </button>

              {showOptionAudio && audioPath && (
                <AssessmentAudioButton
                  text={label}
                  audioPath={audioPath}
                  speakText={speakText}
                  label={`Hear ${label}`}
                  className="initial-sound-card-audio"
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ListeningVisual() {
  return (
    <div className="assessment-listening-visual" aria-hidden="true">
      <span>🔊</span>
    </div>
  );
}

const FINAL_SOUNDS_STUDENT_PROMPT = "Listen to the word. Which sound does it end with?";
const HFW_AUDIO_FIND_WORD_PROMPT = "Listen to the word. Which word did you hear?";

function isFinalSoundsEndingQuestion(question = {}) {
  return String(question?.skillId || "").toLowerCase() === "final_sounds" &&
    String(question?.formatType || question?.templateType || "").toUpperCase() === "ENDING_SOUND";
}

function isRhymingPictureQuestion(question = {}) {
  return String(question?.skillId || "").toLowerCase() === "rhyming" &&
    String(question?.formatType || question?.templateType || "").toUpperCase() === "RHYMING_PICTURE";
}

function isShortVowelWordChoiceQuestion(question = {}) {
  const skillId = String(question?.skillId || "").toLowerCase();
  const format = String(question?.formatType || question?.templateType || "").toUpperCase();
  const prompt = String(question?.prompt || question?.question || "").toLowerCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination") &&
    format === "SHORT_VOWEL_WORD" &&
    /\bwhich word has the short [aeiou] sound\b/.test(prompt)
  );
}

function isListenChooseVowelQuestion(question = {}) {
  const skillId = String(question?.skillId || "").toLowerCase();
  const format = String(question?.formatType || question?.templateType || "").toUpperCase();
  const prompt = String(question?.prompt || question?.question || "").toLowerCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination") &&
    format === "LISTEN_CHOOSE_VOWEL" &&
    prompt.includes("which vowel sound do you hear")
  );
}

function isHfwAudioFindWordQuestion(question = {}) {
  const skillId = String(question?.skillId || "").toLowerCase();
  const format = String(question?.formatType || question?.templateType || "").toUpperCase();
  return skillId.startsWith("hfw_") && ["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD"].includes(format);
}

function isHfwLetterBuildQuestion(question = {}) {
  const skillId = String(question?.skillId || "").toLowerCase();
  const format = String(question?.formatType || question?.templateType || "").toUpperCase();
  return skillId.startsWith("hfw_") && (format === "HFW_LETTER_BUILD" || format.startsWith("HFW_SENTENCE_SPELL"));
}

function isGrammarSentenceFitQuestion(question = {}) {
  return String(question?.formatType || question?.templateType || "").toUpperCase() === "GRAMMAR_SENTENCE_FIT";
}

function stripTargetWordFromPrompt(prompt = "", targetWord = "") {
  const safePrompt = String(prompt || "");
  const word = String(targetWord || "").trim();
  if (!word) return safePrompt;
  return safePrompt
    .replace(new RegExp(`["“”']?${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["“”']?`, "gi"), "the word")
    .replace(/\s+/g, " ")
    .trim();
}

function getStudentVisiblePrompt(question = {}) {
  const safeQuestion = question || {};
  if (isFinalSoundsEndingQuestion(safeQuestion)) return FINAL_SOUNDS_STUDENT_PROMPT;
  if (isHfwAudioFindWordQuestion(safeQuestion)) return HFW_AUDIO_FIND_WORD_PROMPT;
  if (isListenChooseVowelQuestion(safeQuestion)) return SHORT_VOWEL_LISTEN_PROMPT;
  return safeQuestion.prompt || safeQuestion.question || "";
}

function formatAnswerForFeedback(value = "") {
  return String(value || "").split("|").filter(Boolean).join(", ");
}

function AssessmentStimulus({ currentQuestion, isListenAndFindWord, isPairSelection, isVisualCardChoice, isIxlStyleTemplate, isShortVowelWordChoice, isListenChooseVowel, isGrammarSentenceFit, speakText, shouldShowImage }) {
  if (!currentQuestion) return null;

  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);
  const isHfwLetterBuildItem = isHfwLetterBuildQuestion(currentQuestion);
  const isHfwQuestion = String(currentQuestion.skillId || "").toLowerCase().startsWith("hfw_");
  const stimulusAudioText = currentQuestion.audioText || currentQuestion.targetWord || currentQuestion.answer;
  const approvedStimulusAudioPath = isHfwQuestion
    ? ""
    : isListenChooseVowel
    ? getTargetWordAudioPath(currentQuestion.targetWord || currentQuestion.audioText, currentQuestion.audioPath || currentQuestion.audioUrl || "")
    : getApprovedAudioPath(
      stimulusAudioText,
      isRhymingPictureItem ? "" : currentQuestion.audioPath
    );
  const rawStimulusAudioPath = isHfwQuestion || isRhymingPictureItem ? "" : currentQuestion.audioPath || currentQuestion.audioUrl || "";
  const isFinalSoundsEndingItem = isFinalSoundsEndingQuestion(currentQuestion);
  const targetObjectImage = getTargetObjectImage(currentQuestion);
  const stimulusImage = isFinalSoundsEndingItem
    ? targetObjectImage
    : (
      currentQuestion.imagePath ||
      currentQuestion.imageUrl ||
      currentQuestion.targetImage ||
      currentQuestion.targetImagePath ||
      currentQuestion.targetImageUrl ||
      currentQuestion.image ||
      ""
    );
  const hasPromptImages = currentQuestion.promptImageCards?.length > 0;
  const hasPassage = Boolean(currentQuestion.passage || currentQuestion.sentence || currentQuestion.context);
  const visiblePassageTexts = [];
  const visiblePassageKeys = new Set();
  function addVisiblePassageText(value) {
    const text = String(value || "").trim();
    const key = text.replace(/\s+/g, " ");
    if (!text || visiblePassageKeys.has(key)) return;
    visiblePassageKeys.add(key);
    visiblePassageTexts.push(text);
  }
  if (!isHfwLetterBuildItem) addVisiblePassageText(currentQuestion.passage);
  if (!isGrammarSentenceFit && !isHfwLetterBuildItem) addVisiblePassageText(currentQuestion.sentence || currentQuestion.context);
  const hasMainImage = isListenChooseVowel || isShortVowelWordChoice
    ? false
    : isRhymingPictureItem
    ? Boolean(stimulusImage)
    : isFinalSoundsEndingItem
    ? Boolean(targetObjectImage)
    : shouldShowImage(currentQuestion) || (
    stimulusImage &&
    (
      isIxlStyleTemplate ||
      currentQuestion.formatType === "PICTURE_TO_PRINT_MATCH" ||
      currentQuestion.formatType === "PLURAL_IMAGE_SPELLING" ||
      currentQuestion.question?.toLowerCase().includes("matches the picture")
    )
  );
  if (isFinalSoundsEndingItem && !targetObjectImage && import.meta.env.DEV) {
    console.warn("Blocked Final Sounds stimulus from rendering without a target object image", {
      id: currentQuestion.id,
      targetWord: currentQuestion.targetWord,
      imagePath: currentQuestion.imagePath,
      imageUrl: currentQuestion.imageUrl,
      targetImage: currentQuestion.targetImage,
      targetImagePath: currentQuestion.targetImagePath
    });
  }
  const shouldShowListeningVisual =
    !hasPromptImages &&
    !hasPassage &&
    !hasMainImage &&
    !isPairSelection &&
    !isFinalSoundsEndingItem &&
    !isIxlStyleTemplate &&
    !isShortVowelWordChoice &&
    Boolean(approvedStimulusAudioPath || isListenChooseVowel || isListenAndFindWord || currentQuestion.formatType === "LISTEN_FIND_WORD" || currentQuestion.formatType === "HFW_AUDIO_FIND_WORD");

  return (
    <div className="assessment-stimulus">
      {hasPromptImages && (
        <div className="prompt-image-row" aria-label="Question picture">
          {currentQuestion.promptImageCards.map(card => (
            <img
              key={card.id || card.word}
              src={card.image}
              alt={card.alt || `Picture for ${card.word}`}
              className="prompt-image-card"
            />
          ))}
        </div>
      )}

      {hasMainImage && !hasPromptImages && (
        <div className="image-box assessment-main-image-wrap">
          <img
            src={stimulusImage}
              alt={isRhymingPictureItem ? `Picture for ${currentQuestion.targetWord}` : isFinalSoundsEndingItem ? "Picture for the listening word" : "question visual"}
              className="question-image assessment-main-image"
            />
          {isRhymingPictureItem && currentQuestion.targetWord && (
            <strong className="rhyming-target-word">{currentQuestion.targetWord}</strong>
          )}
          {!isRhymingPictureItem && (approvedStimulusAudioPath || rawStimulusAudioPath) && (
            <AssessmentAudioButton
              text={stimulusAudioText}
              audioPath={approvedStimulusAudioPath || rawStimulusAudioPath}
              speakText={speakText}
              label="Hear the word"
              className="mini-audio-button assessment-stimulus-audio"
              audioRole="target_word"
              showDisabled
            />
          )}
        </div>
      )}

      {shouldShowListeningVisual && (
        <div className="assessment-listening-panel">
          <ListeningVisual />
          {(approvedStimulusAudioPath || rawStimulusAudioPath) && (
            <AssessmentAudioButton
              text={stimulusAudioText}
              audioPath={approvedStimulusAudioPath || rawStimulusAudioPath}
              speakText={speakText}
              label="Hear the word"
              className="mini-audio-button assessment-stimulus-audio"
              audioRole="target_word"
              showDisabled
            />
          )}
        </div>
      )}

      {visiblePassageTexts.map(text => (
        <div className="passage-wrap assessment-passage-card" key={text}>
          <p className="passage">{text}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminDashboardPage({
  teachers,
  classes,
  students,
  loading,
  refreshDashboard,
  deleteClass,
  deleteStudent,
  message
}) {
  return (
    <main className="admin-dashboard page-stack">
      <section className="card page-stack">
        <div className="admin-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="muted-text">Review content coverage and manage app data.</p>
          </div>

          <div className="button-row admin-controls">
            <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="card page-stack admin-section">
        <h3>Teachers</h3>
        {teachers.length === 0 ? (
          <p>No teacher data loaded.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Classes</th>
                  <th>Students</th>
                  <th>Answers</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher.id}>
                    <td>{teacher.email}</td>
                    <td>{teacher.id}</td>
                    <td>{teacher.classes}</td>
                    <td>{teacher.students}</td>
                    <td>{teacher.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Classes</h3>
        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Teacher</th>
                <th>Students</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(row => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.teacher_id}</td>
                  <td>{row.studentCount}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td>
                    <button className="reset-button" onClick={() => deleteClass(row.id, row.name)} type="button">
                      Delete Class
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Students</h3>
        <div className="admin-table-wrap">
          <table className="dashboard-table admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Teacher</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.map(row => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.className}</td>
                  <td>{row.teacher_id}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</td>
                  <td>
                    <button className="reset-button" onClick={() => deleteStudent(row.id, row.name)} type="button">
                      Delete Student
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export function StudentSelectPage({
  classList,
  selectedClassId,
  setSelectedClassId,
  setStudentList,
  loadStudents,
  newClassName,
  setNewClassName,
  createClass,
  loadClassDashboard,
  studentList,
  loadingStudents,
  loadStudentProgress,
  studentName,
  setStudentName,
  saveStudentName,
  showClassDashboard,
  classDashboard,
  skillTree,
  setShowClassDashboard,
  deleteClass,
  deleteStudent
}) {
  return (
    <div className="page-stack">
      <div className="name-entry page-stack">
        <h3>Select Class</h3>

        <select
          value={selectedClassId || ""}
          onChange={e => {
            const id = e.target.value || null;
            setSelectedClassId(id);
            setStudentList([]);
            if (id) loadStudents(id);
          }}
        >
          <option value="">Choose class</option>

          {classList.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        <h3>Create New Class</h3>

        <div className="class-action-grid">
          <input
            className="class-name-input"
            autoComplete="off"
            value={newClassName}
            placeholder="Enter class name"
            onChange={e => setNewClassName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") createClass();
            }}
          />

          <button className="save-name-button class-action-button" onClick={createClass}>
            Create Class
          </button>

          {selectedClassId && (
            <button
              className="report-button class-action-button"
              onClick={() => loadClassDashboard(selectedClassId)}
            >
              View Class Dashboard
            </button>
          )}

          {selectedClassId && (
            <button
              className="reset-button class-action-button"
              onClick={() => deleteClass(selectedClassId)}
            >
              Delete Class
            </button>
          )}
        </div>

        {selectedClassId && (
          <>
            <h3>Select Student</h3>

            <select
              value=""
              onChange={e => {
                const selected =
                  studentList.find(s => s.id === e.target.value);

                if (selected) {
                  loadStudentProgress(selected.id, selected.name);
                }
              }}
            >
              <option value="">
                {loadingStudents ? "Loading students..." : "Choose existing student"}
              </option>

              {studentList.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

            <h3>Create New Student</h3>
          </>
        )}

        <input
          autoComplete="off"
          value={studentName}
          placeholder={selectedClassId ? "Enter new student name" : "Select a class first"}
          disabled={!selectedClassId}
          onChange={e => setStudentName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") saveStudentName();
          }}
        />

        <button
          className="save-name-button"
          onClick={saveStudentName}
          disabled={!selectedClassId}
        >
          Create Student
        </button>
      </div>

      {showClassDashboard && (
        <div className="report-panel page-stack">
          <h2>Class Dashboard</h2>

          {classDashboard.length === 0 ? (
            <p>No students in this class yet.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Answered</th>
                  <th>Accuracy</th>
                  <th>Checkpoints</th>
                  <th>Current Skill</th>
                  <th>Last Active</th>
                  <th>Open</th>
                  <th>Delete</th>
                </tr>
              </thead>

              <tbody>
                {classDashboard.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.answered}</td>
                    <td>{row.accuracy}%</td>
                    <td>{row.masteredCount}/{skillTree.length}</td>
                    <td>{row.currentSkill}</td>
                    <td>{row.lastActive}</td>
                    <td>
                      <button
                        className="report-button"
                        onClick={() => {
                          loadStudentProgress(row.id, row.name);
                          setShowClassDashboard(false);
                        }}
                      >
                        Open
                      </button>
                    </td>
                    <td>
                      <button
                        className="reset-button"
                        onClick={() => deleteStudent(row.id, row.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="button-row">
            <button
              className="reset-button"
              onClick={() => setShowClassDashboard(false)}
            >
              Close Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentOverviewPage({
  studentName,
  currentSkillIndex,
  currentStage,
  accuracy,
  totalAnswered,
  roundCorrect,
  passScore,
  roundLength,
  skillTree,
  setCurrentSkillIndex,
  setRoundAnswers,
  setCurrentQuestion,
  setFeedback,
  setMessage,
  startAssessment,
  startAdvancedPhonicsAssessment,
  startTargetedReview,
  weaknessSnapshot,
  itemMasterySnapshot,
  coverageSnapshot,
  setAppView,
  switchStudent,
  openResetStudentProgress,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment,
  isAdmin = false
}) {
  const strongestAreas =
    weaknessSnapshot.strongest.slice(0, 3);

  const needsPractice =
    weaknessSnapshot.needsPractice.slice(0, 4);

  const suggestedFocus =
    weaknessSnapshot.suggestedNextFocus;

  const itemSnapshot = itemMasterySnapshot || {
    mastered: [],
    attempting: [],
    evidence: [],
    unseenCount: 0,
    trackedCount: 0
  };

  const formatItemLabel = item =>
    item.itemKey + " (" + item.itemType.replace(/_/g, " ") + ", " + item.correct + "/" + item.attempts + ")";

  const formatEvidenceLabel = item => {
    const formats = item.formatTypes?.length ? item.formatTypes.join(", ") : "none yet";
    const positions = item.phonicsPositions?.length ? item.phonicsPositions.join(", ") : "none";
    const blockers = item.masteryBlockers?.length ? item.masteryBlockers.join("; ") : "No blockers";

    return item.itemKey + " (" + item.itemType.replace(/_/g, " ") + "): formats " + formats + "; PTD " + (item.hadPTDExposure ? "yes" : "no") + "; cross-pattern " + (item.crossPatternExposure ? "yes" : "no") + "; positions " + positions + "; " + blockers;
  };

  const currentCoverage = coverageSnapshot?.[currentStage.id] || {
    mastered: 0,
    total: 0,
    unit: "items"
  };
  const checkpointPercent = Math.min(100, Math.round((roundCorrect / Math.max(roundLength, 1)) * 100));
  const coveragePercent = currentCoverage.total
    ? Math.round((currentCoverage.mastered / currentCoverage.total) * 100)
    : 0;
  const checkpointPassed = roundCorrect >= passScore;
  const hasProgress = totalAnswered > 0 || roundCorrect > 0 || currentCoverage.mastered > 0;

  return (
    <div className="card page-card teacher-overview-dashboard">
      <section className="teacher-overview-hero" aria-label="Student overview summary">
        <div className="teacher-student-title">
          <p className="panel-label">Student Overview</p>
          <h2>{studentName || "Unnamed student"}</h2>
          <p>{currentSkillIndex + 1}. {currentStage.label}</p>
        </div>

        <div className="teacher-metric-strip" aria-label="Student progress summary">
          <div>
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <span>Checkpoint</span>
            <strong>{roundCorrect}/{roundLength}</strong>
          </div>
          <div>
            <span>Coverage</span>
            <strong>{currentCoverage.mastered}/{currentCoverage.total || 0}</strong>
          </div>
          <div>
            <span>Answered</span>
            <strong>{totalAnswered}</strong>
          </div>
        </div>
      </section>

      <section className="teacher-start-grid" aria-label="Start assessment">
        <label className="teacher-skill-selector">
          <span>Start or adjust skill level</span>
          <select
            value={currentSkillIndex}
            onChange={e => {
              setCurrentSkillIndex(Number(e.target.value));
              setRoundAnswers([]);
              setCurrentQuestion(null);
              setFeedback(null);
              setMessage("Start skill changed.");
            }}
          >
            {skillTree.map((stage, index) => (
              <option key={stage.id} value={index}>
                {index + 1}. {stage.label}
              </option>
            ))}
          </select>
        </label>

        <div className="teacher-primary-action">
          <div>
            <strong>{hasProgress ? "Continue assessment path" : "Begin checkpoint path"}</strong>
            <p>{passScore}/{roundLength} correct is enough evidence to move forward.</p>
          </div>
          <button className="lp-button lp-button-primary" onClick={startAssessment}>
            {hasProgress ? "Resume Full Screen Assessment" : "Enter Full Screen Assessment"}
          </button>
        </div>

        <div className="teacher-quick-actions" aria-label="Quick actions">
          <button className="lp-button lp-button-secondary" onClick={switchStudent}>
            Switch Student
          </button>
          <button className="lp-button lp-button-secondary" onClick={() => setAppView("finished")}>
            View Report
          </button>
          <button
            className="lp-button lp-button-danger-outline"
            onClick={openResetStudentProgress}
            type="button"
          >
            Reset Assessment Data
          </button>
        </div>
      </section>

      <section className="teacher-progress-grid" aria-label="Progress details">
        <div className="coverage-card compact">
          <div className="coverage-card-header">
            <strong>Checkpoint progress</strong>
            <span>{checkpointPassed ? "Passed" : `${roundCorrect}/${roundLength}`}</span>
          </div>
          <div className="coverage-bar" aria-label="Checkpoint progress">
            <span style={{ width: `${checkpointPercent}%` }}></span>
          </div>
        </div>

        <div className="coverage-card compact">
          <div className="coverage-card-header">
            <strong>Coverage progress</strong>
            <span>{currentCoverage.mastered}/{currentCoverage.total || 0} {currentCoverage.unit}</span>
          </div>
          <div className="coverage-bar secondary" aria-label="Item coverage progress">
            <span style={{ width: `${coveragePercent}%` }}></span>
          </div>
        </div>
      </section>

      <section className="teacher-tab-panel" aria-label="Next recommendation">
        <div className="teacher-panel-header">
          <div>
            <h3>Next recommendation</h3>
            <p>{suggestedFocus ? `${suggestedFocus.target} in ${suggestedFocus.stage}` : "Complete more questions to build a recommendation."}</p>
          </div>
          <button
            className="lp-button lp-button-secondary"
            disabled={!suggestedFocus}
            onClick={startTargetedReview}
          >
            Start Targeted Review
          </button>
        </div>

        <div className="weakness-grid compact">
          <div>
            <strong>Needs practice</strong>
            {needsPractice.length > 0 ? (
              <ul>
                {needsPractice.map(item => (
                  <li key={`${item.stage}-${item.target}`}>
                    {item.target} in {item.stage} ({item.incorrect} missed)
                  </li>
                ))}
              </ul>
            ) : (
              <p>No clear weak spots yet.</p>
            )}
          </div>

          <div>
            <strong>Strongest area</strong>
            {strongestAreas.length > 0 ? (
              <ul>
                {strongestAreas.slice(0, 2).map(item => (
                  <li key={`${item.stage}-${item.target}`}>
                    {item.target} ({item.correct}/{item.total})
                  </li>
                ))}
              </ul>
            ) : (
              <p>Not enough data yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function getSkillCategory(stage) {
  const label = stage.label.toLowerCase();
  if (/initial|final|rhym|cvc|short vowel/.test(label)) return "Reading Foundations";
  if (/blend|digraph|long vowel|vowel team|controlled|homophone/.test(label)) return "Phonics Patterns";
  if (/high-frequency|sight/.test(label)) return "Sight Words";
  if (/noun|verb|adjective|preposition|plural|prefix|suffix/.test(label)) return "Grammar";
  if (/antonym|synonym|context/.test(label)) return "Vocabulary";
  return "Reading Strategies";
}

const skillCategoryOrder = [
  "Reading Foundations",
  "Phonics Patterns",
  "Sight Words",
  "Vocabulary",
  "Grammar",
  "Reading Strategies"
];

export function SkillsProgressPage({
  studentName,
  skillTree,
  currentSkillIndex,
  setCurrentSkillIndex,
  setRoundAnswers,
  setCurrentQuestion,
  setFeedback,
  setMessage,
  mastery,
  coverageSnapshot,
  startAssessment
}) {
  const grouped = skillCategoryOrder.map(category => ({
    category,
    skills: skillTree
      .map((stage, index) => ({ stage, index }))
      .filter(item => getSkillCategory(item.stage) === category)
  }));

  const startSkill = index => {
    setCurrentSkillIndex(index);
    setRoundAnswers([]);
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage("Start skill changed.");
    startAssessment(index);
  };

  return (
    <div className="teacher-product-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Skills / Progress</p>
          <h2>{studentName || "Student"} Skill Map</h2>
          <p>Browse adaptive checkpoints by category and jump into the next useful practice round.</p>
        </div>
      </section>

      <div className="skill-catalogue">
        {grouped.map(group => (
          <section className="skill-category-section" key={group.category}>
            <div className="skill-category-header">
              <h3>{group.category}</h3>
              <span>{group.skills.length} skills</span>
            </div>

            <div className="skill-compact-list">
              {group.skills.map(({ stage, index }) => {
                const data = mastery[stage.id];
                const coverage = coverageSnapshot?.[stage.id] || { mastered: 0, total: 0, unit: "items" };
                const checkpointPercent = data?.lastTotal
                  ? Math.round((data.lastScore / data.lastTotal) * 100)
                  : 0;
                const coveragePercent = coverage.total
                  ? Math.round((coverage.mastered / coverage.total) * 100)
                  : 0;
                const unlocked = index <= currentSkillIndex || Boolean(data?.mastered);
                const status = data?.mastered
                  ? "Passed"
                  : index === currentSkillIndex
                    ? "Current"
                    : unlocked
                      ? "Open"
                      : "Locked";
                const actionLabel = !unlocked
                  ? "Locked"
                  : index === currentSkillIndex
                    ? "Start"
                    : data?.mastered
                      ? "Practice"
                      : "Open";
                const lockHelp = "Complete earlier skills to unlock.";

                return (
                  <article className={`skill-catalogue-row ${status.toLowerCase()}`} key={stage.id}>
                    <div className="skill-card-heading">
                      <div className="skill-index-badge">{index + 1}</div>
                      <div className="skill-row-main">
                        <strong>{stage.label}</strong>
                        <span>{index === currentSkillIndex ? "Current focus" : data?.mastered ? "Checkpoint passed" : unlocked ? "Ready for practice" : "Not available yet"}</span>
                      </div>
                      <span className={`skill-status-badge ${status.toLowerCase()}`}>{status}</span>
                    </div>

                    <div className="skill-progress-grid">
                      <div className="skill-row-meter">
                        <span><strong>Checkpoint</strong> {data ? `${data.lastScore}/${data.lastTotal}` : "Not started"}</span>
                        <span className="mini-progress-bar" aria-label={`Checkpoint progress ${checkpointPercent}%`}>
                          <span style={{ width: `${checkpointPercent}%` }}></span>
                        </span>
                      </div>
                      <div className="skill-row-meter">
                        <span><strong>Coverage</strong> {coverage.mastered}/{coverage.total} {coverage.unit}</span>
                        <span className="mini-progress-bar secondary" aria-label={`Coverage progress ${coveragePercent}%`}>
                          <span style={{ width: `${coveragePercent}%` }}></span>
                        </span>
                      </div>
                    </div>

                    <div className="skill-action-area">
                      <button
                        className={index === currentSkillIndex ? "lp-button lp-button-primary" : "lp-button lp-button-secondary"}
                        disabled={!unlocked}
                        onClick={() => startSkill(index)}
                        title={!unlocked ? lockHelp : undefined}
                        type="button"
                      >
                        {actionLabel}
                      </button>
                      {!unlocked && (
                        <span className="skill-lock-help">{lockHelp}</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ELAssessmentsPage({
  studentName,
  startLetterAssessment,
  startAdvancedPhonicsAssessment,
  openGuidedReading
}) {
  return (
    <div className="teacher-product-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">EL Assessments</p>
          <h2>Formal Assessment Tools</h2>
          <p>Formal EL assessments are separate from adaptive practice progress for {studentName || "this student"}.</p>
        </div>
      </section>

      <section className="teacher-action-panel-grid">
        <article className="teacher-action-panel">
          <h3>Letter Name and Sound</h3>
          <p>Run the formal letter identification assessment for the selected student.</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startLetterAssessment}>
              Start Letter Assessment
            </button>
          </div>
        </article>

        <article className="teacher-action-panel">
          <h3>Advanced Phonics Patterns</h3>
          <p>Run the formal advanced phonics pattern assessment for the selected student.</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startAdvancedPhonicsAssessment}>
              Start Advanced Phonics
            </button>
          </div>
        </article>

        <article className="teacher-action-panel">
          <h3>Guided Reading</h3>
          <p>Listen to a student read an original sample book, mark word reading, and record teacher notes.</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={openGuidedReading} type="button">
              Open Guided Reading
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

const LazyGuidedReadingPage = lazy(() =>
  import("./guided-reading/GuidedReadingPage.jsx").then(module => ({
    default: module.GuidedReadingPage
  }))
);

function GuidedReadingLoadingFallback() {
  return (
    <div className="teacher-product-page guided-reading-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Guided Reading</p>
          <h2>Loading Guided Reading...</h2>
          <p>Preparing the book library and reader.</p>
        </div>
      </section>
    </div>
  );
}

export function GuidedReadingPage(props) {
  return (
    <Suspense fallback={<GuidedReadingLoadingFallback />}>
      <LazyGuidedReadingPage {...props} />
    </Suspense>
  );
}
export function TeacherReportsPage({
  studentName,
  startAssessment,
  viewFinishedReport,
  openGuidedReading,
  guidedReadingRecords = {},
  assessmentHistory = [],
  skillMasterySummary = [],
  exportData,
  exportCSVData,
  exportReadingReport,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment
}) {
  const [detailsReady, setDetailsReady] = useState(false);
  const [dateRange, setDateRange] = useState("last90");
  const [guidedReadingReportHelpers, setGuidedReadingReportHelpers] = useState(null);
  const reportsLoadStartRef = useRef(0);

  useEffect(() => {
    reportsLoadStartRef.current = typeof performance !== "undefined" ? performance.now() : Date.now();
    setDetailsReady(false);

    const revealDetails = () => setDetailsReady(true);
    let timeoutId = null;
    let idleId = null;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(revealDetails, { timeout: 250 });
    } else {
      timeoutId = window.setTimeout(revealDetails, 0);
    }

    return () => {
      if (idleId && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [studentName, assessmentHistory, guidedReadingRecords]);

  useEffect(() => {
    if (!detailsReady || guidedReadingReportHelpers) return undefined;

    let cancelled = false;
    import("../data/guidedReadingBooks").then(module => {
      if (cancelled) return;
      setGuidedReadingReportHelpers({
        formatGuidedReadingType: module.formatGuidedReadingType,
        getGuidedReadingWordStatusRows: module.getGuidedReadingWordStatusRows,
        summarizeGuidedReadingProgress: module.summarizeGuidedReadingProgress,
        summarizeGuidedReadingRecords: module.summarizeGuidedReadingRecords
      });
    });

    return () => {
      cancelled = true;
    };
  }, [detailsReady, guidedReadingReportHelpers]);

  const guidedReadingDetailsReady = detailsReady && Boolean(guidedReadingReportHelpers);

  const filteredAssessmentHistory = useMemo(() => {
    if (dateRange === "all") return assessmentHistory;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    return assessmentHistory.filter(record => {
      const completedAt = new Date(record.completedAt || record.date || 0);
      return Number.isFinite(completedAt.getTime()) && completedAt >= cutoff;
    });
  }, [assessmentHistory, dateRange]);

  const assessmentSummary = useMemo(() => {
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const summary = summarizeAssessmentHistory(filteredAssessmentHistory);
    if (import.meta.env.DEV) {
      const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      console.debug("[Reports] assessment summary", {
        durationMs: duration,
        attempts: filteredAssessmentHistory.length,
        dateRange
      });
    }
    return summary;
  }, [filteredAssessmentHistory, dateRange]);

  const readingProgress = useMemo(() => {
    if (!guidedReadingDetailsReady) return null;
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const progress = guidedReadingReportHelpers.summarizeGuidedReadingProgress(guidedReadingRecords);
    if (import.meta.env.DEV) {
      const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      console.debug("[Reports] guided reading progress", {
        durationMs: duration,
        recordCount: Object.keys(guidedReadingRecords || {}).length,
        completedBooks: progress.completedBooks.length
      });
    }
    return progress;
  }, [guidedReadingDetailsReady, guidedReadingRecords, guidedReadingReportHelpers]);

  const wordStatusRows = useMemo(() => {
    if (!guidedReadingDetailsReady) return [];
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const rows = guidedReadingReportHelpers.getGuidedReadingWordStatusRows(guidedReadingRecords);
    if (import.meta.env.DEV) {
      const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      console.debug("[Reports] guided reading word rows", {
        durationMs: duration,
        rows: rows.length
      });
    }
    return rows;
  }, [guidedReadingDetailsReady, guidedReadingRecords, guidedReadingReportHelpers]);

  const guidedSummaries = useMemo(() => {
    if (!guidedReadingDetailsReady) return [];
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const rows = guidedReadingReportHelpers.summarizeGuidedReadingRecords(guidedReadingRecords);
    if (import.meta.env.DEV) {
      const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      console.debug("[Reports] guided reading conference summaries", {
        durationMs: duration,
        rows: rows.length
      });
    }
    return rows;
  }, [guidedReadingDetailsReady, guidedReadingRecords, guidedReadingReportHelpers]);

  const greenWordRows = useMemo(
    () => wordStatusRows.filter(row => row.status === "Read Correctly").slice(0, 10),
    [wordStatusRows]
  );
  const orangeWordRows = useMemo(
    () => wordStatusRows.filter(row => row.status === "Needs Support").slice(0, 10),
    [wordStatusRows]
  );
  const hasAssessmentData =
    assessmentSummary.attempts > 0 ||
    skillMasterySummary.some(summary => summary.masteredCount > 0);
  const hasReadingData = Boolean(readingProgress) && (
    readingProgress.totalBooksRead > 0 ||
    readingProgress.inProgressBooks.length > 0 ||
    readingProgress.totalRereads > 0
  );

  useEffect(() => {
    if (!detailsReady || !import.meta.env.DEV) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    console.debug("[Reports] details ready", {
      totalElapsedMs: Math.round(now - reportsLoadStartRef.current),
      assessmentAttempts: assessmentHistory.length,
      guidedReadingRecords: Object.keys(guidedReadingRecords || {}).length
    });
  }, [detailsReady, assessmentHistory.length, guidedReadingRecords]);

  return (
    <div className="teacher-product-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>{studentName || "Student"} Reports</h2>
          <p>Review assessment results and export files from one focused report area.</p>
        </div>
        <label className="report-filter-control">
          <span>Date range</span>
          <select value={dateRange} onChange={event => setDateRange(event.target.value)}>
            <option value="last90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>
      </section>

      <section className="teacher-action-panel-grid">
        <article className="teacher-action-panel">
          <h3>Student Report</h3>
          {hasAssessmentData ? (
            <p>
              {assessmentSummary.attempts
                ? `${assessmentSummary.attempts} saved assessments · ${assessmentSummary.averageAccuracy}% average accuracy.`
                : "Open the finished report view for checkpoint summaries, coverage, mastered items, and teacher notes."}
            </p>
          ) : (
            <div className="report-empty-state">
              <strong>No assessment data yet.</strong>
              <p>Start the first assessment to build checkpoint summaries, coverage, and mastered item lists.</p>
              {startAssessment && (
                <button className="lp-button lp-button-secondary" onClick={startAssessment} type="button">
                  Start First Assessment
                </button>
              )}
            </div>
          )}
          {assessmentSummary.latestAttempt && (
            <div className="guided-reading-report-mini">
              <span>Latest: {assessmentSummary.latestAttempt.skillName}</span>
              <span>{assessmentSummary.latestAttempt.correctCount}/{assessmentSummary.latestAttempt.totalQuestions} correct</span>
            </div>
          )}
          {skillMasterySummary.some(summary => summary.masteredCount > 0) && (
            <div className="mastery-detail-list compact">
              {skillMasterySummary
                .filter(summary => summary.masteredCount > 0)
                .slice(0, 5)
                .map(summary => (
                  <article key={summary.skillId}>
                    <strong>{summary.skillName}</strong>
                    <span>{summary.displayText}</span>
                  </article>
                ))}
            </div>
          )}
          <button className="lp-button lp-button-primary" onClick={viewFinishedReport}>
            View Report
          </button>
        </article>

        <article className="teacher-action-panel">
          <h3>Reading Report</h3>
          {!readingProgress ? (
            <p className="muted-text">Loading guided reading summary...</p>
          ) : !hasReadingData ? (
            <div className="report-empty-state">
              <strong>No guided reading records yet.</strong>
              <p>Open Guided Reading to begin saving book progress and conference notes.</p>
              <button className="lp-button lp-button-secondary" onClick={openGuidedReading} type="button">
                Open Guided Reading
              </button>
            </div>
          ) : (
            <>
              <p>
                {readingProgress.totalBooksRead} books completed · {readingProgress.inProgressBooks.length} in progress · {readingProgress.totalRereads} rereads
              </p>
              <div className="guided-reading-report-mini">
                <span>Non-Fiction: {readingProgress.nonfictionCount}</span>
                <span>Latest: {readingProgress.latestReadingDate ? new Date(readingProgress.latestReadingDate).toLocaleDateString() : "Not yet"}</span>
              </div>
            </>
          )}
          {readingProgress?.completedBooks.length > 0 && (
            <div className="reading-report-table compact">
              {readingProgress.completedBooks.slice(0, 6).map(row => (
                <article key={row.bookId}>
                  <strong>{row.title}</strong>
                  <span>Level {row.level} · {guidedReadingReportHelpers.formatGuidedReadingType(row.type)} · read {row.readCount}x</span>
                </article>
              ))}
            </div>
          )}
          <div className="teacher-action-list">
            <button className="lp-button lp-button-primary" onClick={exportReadingReport} type="button">
              Export Reading Report
            </button>
            <button className="lp-button lp-button-secondary" onClick={openGuidedReading} type="button">
              Open Guided Reading
            </button>
          </div>
        </article>

        <article className="teacher-action-panel">
          <h3>Words Read Correctly</h3>
          {!guidedReadingDetailsReady ? (
            <p className="muted-text">Loading word records...</p>
          ) : greenWordRows.length > 0 ? (
            <div className="guided-record-list compact">
              {greenWordRows.map(row => (
                <article key={`${row.bookId}-${row.page}-${row.word}-${row.date}-green`}>
                  <strong>{row.word}</strong>
                  <span>{row.title} · Level {row.level} · Page {row.page}</span>
                  <span>Count: {row.count}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="report-empty-state compact">
              <strong>No words marked green yet.</strong>
              <p>Open Guided Reading and mark words read correctly during a conference.</p>
            </div>
          )}
        </article>

        <article className="teacher-action-panel">
          <h3>Words Needing Support</h3>
          {!guidedReadingDetailsReady ? (
            <p className="muted-text">Loading support words...</p>
          ) : orangeWordRows.length > 0 ? (
            <div className="guided-record-list compact">
              {orangeWordRows.map(row => (
                <article key={`${row.bookId}-${row.page}-${row.word}-${row.date}-orange`}>
                  <strong>{row.word}</strong>
                  <span>{row.title} · Level {row.level} · Page {row.page}</span>
                  <span>Count: {row.count}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="report-empty-state compact">
              <strong>No support words marked yet.</strong>
              <p>Support-word notes will appear after Guided Reading conferences.</p>
            </div>
          )}
        </article>

        <article className="teacher-action-panel">
          <h3>Guided Reading Conference Notes</h3>
          {!guidedReadingDetailsReady ? (
            <p className="muted-text">Loading conference notes...</p>
          ) : guidedSummaries.length > 0 ? (
            <div className="guided-record-list compact">
              {guidedSummaries.slice(0, 12).map(item => (
                <article key={item.bookId}>
                  <strong>{item.title}</strong>
                  <span>{item.correct}/{item.attempted} correct · {item.accuracy}%</span>
                  <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
                </article>
              ))}
            </div>
          ) : (
            <div className="report-empty-state compact">
              <strong>No guided reading records yet.</strong>
              <p>Open Guided Reading to save the first book record for this student.</p>
              <button className="lp-button lp-button-secondary" onClick={openGuidedReading} type="button">
                Open Guided Reading
              </button>
            </div>
          )}
        </article>

        <article className="teacher-action-panel">
          <h3>Exports</h3>
          <p>Download adaptive and formal assessment exports without changing student progress.</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={exportData}>
              Export Text Report
            </button>
            <button className="lp-button lp-button-secondary" onClick={exportCSVData}>
              Export Excel CSV
            </button>
            {letterAssessment.length > 0 && (
              <button className="lp-button lp-button-secondary" onClick={exportLetterAssessment} type="button">
                Export Letter Excel
              </button>
            )}
            {patternAssessment.length > 0 && (
              <button className="lp-button lp-button-secondary" onClick={exportPatternAssessment} type="button">
                Export Pattern Excel
              </button>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export function TeacherSettingsToolsPage({
  studentName,
  switchStudent,
  openResetStudentProgress,
  isAdmin,
  itemMasterySnapshot
}) {
  const itemSnapshot = itemMasterySnapshot || {
    mastered: [],
    attempting: [],
    evidence: [],
    unseenCount: 0,
    trackedCount: 0
  };
  const formatItemLabel = item =>
    item.itemKey + " (" + item.itemType.replace(/_/g, " ") + ", " + item.correct + "/" + item.attempts + ")";

  return (
    <div className="teacher-product-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Settings / Tools</p>
          <h2>Student Tools</h2>
          <p>Manage the selected student without mixing tools into the assessment dashboard.</p>
        </div>
      </section>

      <section className="teacher-action-panel-grid">
        <article className="teacher-action-panel">
          <h3>Student</h3>
          <p>Current student: {studentName || "Unnamed student"}</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={switchStudent}>
              Switch Student
            </button>
            <button className="lp-button lp-button-danger-outline" onClick={openResetStudentProgress} type="button">
              Reset Student Progress
            </button>
          </div>
        </article>
      </section>

      {isAdmin && (
        <section className="admin-tools-stack">
          <details className="item-mastery-debug">
            <summary>Developer item mastery snapshot</summary>
            <div className="item-mastery-grid">
              <div>
                <strong>Mastered items</strong>
                {itemSnapshot.mastered.length > 0 ? (
                  <ul>
                    {itemSnapshot.mastered.map(item => (
                      <li key={item.itemType + "-" + item.itemKey}>{formatItemLabel(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No mastered item records yet.</p>
                )}
              </div>
              <div>
                <strong>Attempting items</strong>
                {itemSnapshot.attempting.length > 0 ? (
                  <ul>
                    {itemSnapshot.attempting.map(item => (
                      <li key={item.itemType + "-" + item.itemKey}>{formatItemLabel(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No item attempts recorded yet.</p>
                )}
              </div>
              <div>
                <strong>Coverage</strong>
                <p>{itemSnapshot.unseenCount} unseen of {itemSnapshot.trackedCount} tracked runtime items.</p>
              </div>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

export function ResetStudentProgressDialog({
  open,
  studentName,
  resetting,
  onReset,
  onCancel
}) {
  const [resetPhrase, setResetPhrase] = useState("");

  useEffect(() => {
    if (!open) {
      setResetPhrase("");
    }
  }, [open]);

  if (!open) return null;

  const canConfirmReset = resetPhrase.trim() === "RESET";
  const studentLabel = studentName || "the student";

  function cancelReset() {
    setResetPhrase("");
    onCancel();
  }

  function confirmReset() {
    if (!canConfirmReset || resetting) return;
    onReset();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card reset-progress-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-progress-title">
        <h2 id="reset-progress-title">Reset Assessment Data</h2>
        <p>
          This resets assessment progress, scores, skill mastery, checkpoints, attempts, coverage,
          level and phase progress, incorrect pattern tracking, and assessment history for {studentLabel}.
        </p>
        <p>
          The student profile, class assignment, account login, Guided Reading history, and Story Quest progress
          are kept in place.
        </p>

        <div className="full-reset-confirmation" aria-live="polite">
          <strong>Confirm assessment reset</strong>
          <p>Type RESET to enable the final reset button.</p>
          <label>
            <span>Type RESET</span>
            <input
              autoComplete="off"
              disabled={resetting}
              onChange={event => setResetPhrase(event.target.value)}
              value={resetPhrase}
            />
          </label>
        </div>

        <div className="button-row">
          <button
            className="report-button"
            disabled={resetting}
            onClick={cancelReset}
            type="button"
          >
            Cancel
          </button>
          <button
            className="reset-button"
            disabled={resetting || !canConfirmReset}
            onClick={confirmReset}
            type="button"
          >
            Reset Assessment Data
          </button>
        </div>
      </section>
    </div>
  );
}

export function CheckpointDecisionPage({
  checkpoint,
  continueSkill,
  reviewInitialSoundLevelOne,
  moveToNextSkill,
  retrySkill,
  reviewMistakes,
  returnToOverview
}) {
  if (!checkpoint) return null;

  const completedText =
    `${checkpoint.correct}/${checkpoint.total} ${checkpoint.skillLabel}`;
  const canMoveNext =
    checkpoint.passed && checkpoint.nextSkillLabel;
  const isInitialSoundsCheckpoint = checkpoint?.skillId === "initial_sounds";
  const initialLevel = checkpoint.initialSoundDebug?.level || 1;
  const currentLevelMastered = Boolean(checkpoint.initialSoundDebug?.currentLevelMastered);
  const levelOneMastered = Boolean(checkpoint.initialSoundDebug?.levelOneMastered);
  const finalSoundsLevelOneMastered = Boolean(checkpoint.masteryDepth?.levelOneMastered);
  const pathStatus = checkpoint.pathStatus || {
    level: initialLevel || 1,
    phase: 1,
    label: `Level ${initialLevel || 1} Phase 1`,
    nextActionLabel: "Continue next phase",
    finalStepComplete: false
  };
  const primaryPassedLabel = pathStatus.finalStepComplete
    ? `Move to next skill${checkpoint.nextSkillLabel ? `: ${checkpoint.nextSkillLabel}` : ""}`
    : pathStatus.nextActionLabel;
  const retryLabel = checkpoint.accuracyPassed
    ? `Continue ${pathStatus.label}`
    : `Retry ${pathStatus.label}`;

  return (
    <main className="assessment-shell checkpoint-decision-shell">
      <section className="card checkpoint-decision-card">
        <p className="panel-label">Checkpoint complete</p>
        <h2>You completed {completedText}.</h2>
        <div className="level-mastery-callout checkpoint-path-callout">
          <strong>{pathStatus.label}</strong>
          <p>
            {checkpoint.passed
              ? pathStatus.finalStepComplete
                ? "This skill path is complete. The next formal step is the next skill."
                : `Next formal step: ${pathStatus.nextActionLabel}.`
              : `Stay on ${pathStatus.label} until this phase is passed.`}
          </p>
        </div>

        {isInitialSoundsCheckpoint && (
          <div className="level-mastery-callout">
            <strong>
              {currentLevelMastered
                ? `Level ${initialLevel} mastered`
                : `Level ${initialLevel} in progress`}
            </strong>
            <p>
              {currentLevelMastered && initialLevel === 1
                ? "Ready for Level 2. Level 1 stays available for review."
                : levelOneMastered && initialLevel === 2
                  ? "Level 2 is using harder words after Level 1 mastery."
                  : "Keep Level 1 practice focused on the remaining unmastered sounds before moving up."}
            </p>
          </div>
        )}

        <div className="checkpoint-result-grid">
          <div>
            <span>Accuracy</span>
            <strong>{checkpoint.accuracy}%</strong>
          </div>
          <div>
            <span>Checkpoint</span>
            <strong>{checkpoint.passed ? "Passed" : "Needs retry"}</strong>
          </div>
          <div>
            <span>Skill coverage</span>
            <strong>
              {checkpoint.coverage.mastered}/{checkpoint.coverage.total} {checkpoint.coverage.unit} covered
            </strong>
          </div>
          {checkpoint.masteryDepth && (
            <div>
              <span>Mastery depth</span>
              <strong>
                {checkpoint.masteryDepth.mastered}/{checkpoint.masteryDepth.total} mastered
              </strong>
            </div>
          )}
        </div>

        {checkpoint.blockedPassReason && (
          <div className="level-mastery-callout">
            <strong>More coverage needed</strong>
            <p>{checkpoint.blockedPassReason}</p>
          </div>
        )}

        <div className="checkpoint-detail-grid">
          <section>
            <h3>Covered this round</h3>
            {checkpoint.coveredThisRound.length > 0 ? (
              <div className="word-chip-row">
                {checkpoint.coveredThisRound.map(item => (
                  <span className="word-chip mastered" key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">No item keys were recorded for this round.</p>
            )}
          </section>

          <section>
            <h3>Already covered before this round</h3>
            {checkpoint.alreadyMastered?.length > 0 ? (
              <div className="word-chip-row">
                {checkpoint.alreadyMastered.map(item => (
                  <span className="word-chip mastered" key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">No prior coverage was recorded for this skill.</p>
            )}
          </section>

          <section>
            <h3>Total covered</h3>
            {checkpoint.totalCoveredItems?.length > 0 ? (
              <div className="word-chip-row">
                {checkpoint.totalCoveredItems.map(item => (
                  <span className="word-chip mastered" key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">Coverage will appear after this round saves.</p>
            )}
          </section>

          <section>
            <h3>Still to cover</h3>
            {checkpoint.remainingItems.length > 0 ? (
              <div className="word-chip-row">
                {checkpoint.remainingItems.map(item => (
                  <span className="word-chip" key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">All configured items for this skill are covered.</p>
            )}
          </section>

          {checkpoint.initialSoundDebug && (
            <section>
              <h3>Initial Sounds round details</h3>
              <p className="muted-text">
                Level {checkpoint.initialSoundDebug.level}, phase {checkpoint.initialSoundDebug.phase || "review"}.
              </p>
              {checkpoint.initialSoundDebug.reviewLetters?.length > 0 && (
                <>
                  <strong>Review letters selected</strong>
                  <div className="word-chip-row">
                    {checkpoint.initialSoundDebug.reviewLetters.map(item => (
                      <span className="word-chip" key={item}>{item}</span>
                    ))}
                  </div>
                </>
              )}
              {checkpoint.initialSoundDebug.selectedTargetWords?.length > 0 && (
                <>
                  <strong>Selected target words</strong>
                  <div className="word-chip-row">
                    {checkpoint.initialSoundDebug.selectedTargetWords.map(item => (
                      <span className="word-chip mastered" key={item}>{item}</span>
                    ))}
                  </div>
                </>
              )}
              {checkpoint.initialSoundDebug.blockedLetters?.length > 0 && (
                <>
                  <strong>Blocked because media is missing</strong>
                  <div className="word-chip-row">
                    {checkpoint.initialSoundDebug.blockedLetters.map(item => (
                      <span className="word-chip" key={item}>{item}</span>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {checkpoint.masteryDepth && (
            <section>
              <h3>{checkpoint.masteryDepth.label} depth</h3>
              <p className="muted-text">
                Successful rounds: {checkpoint.masteryDepth.successfulRounds}/{checkpoint.masteryDepth.requiredSuccessfulRounds}.
                {finalSoundsLevelOneMastered
                  ? " Level 1 depth is complete. Level 2 is unlocked."
                  : " Level 2 stays locked until every Level 1 sound has enough correct examples."}
              </p>
              <div className="word-chip-row">
                {Object.values(checkpoint.masteryDepth.bySound || {}).map(row => (
                  <span className={row.mastered ? "word-chip mastered" : "word-chip"} key={row.target}>
                    {row.target}: {row.correctCount} correct, {row.uniqueCorrectTargetWords.length} words, {row.availableTargetWords?.length || 0}/{row.requiredContentWords || 3} content
                  </span>
                ))}
              </div>
              {checkpoint.masteryDepth.contentGaps?.length > 0 && (
                <>
                  <strong>Content gaps</strong>
                  <div className="word-chip-row">
                    {checkpoint.masteryDepth.contentGaps.map(gap => (
                      <span className="word-chip" key={gap.target}>
                        {gap.target}: {gap.availableWordCount}/{gap.requiredWordCount} distinct usable words
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>

        <div className="button-row checkpoint-decision-actions">
          {checkpoint.passed ? (
            <>
              <button
                className="main-button"
                disabled={pathStatus.finalStepComplete && !canMoveNext}
                onClick={pathStatus.finalStepComplete ? moveToNextSkill : continueSkill}
                type="button"
              >
                {primaryPassedLabel}
              </button>

              {isInitialSoundsCheckpoint && levelOneMastered && (
                <button className="report-button" onClick={reviewInitialSoundLevelOne} type="button">
                  Review Level 1
                </button>
              )}

              {!pathStatus.finalStepComplete && (
                <button
                  className="report-button"
                  disabled={!canMoveNext}
                  onClick={moveToNextSkill}
                  type="button"
                >
                  Skip to next skill{checkpoint.nextSkillLabel ? `: ${checkpoint.nextSkillLabel}` : ""}
                </button>
              )}
            </>
          ) : (
            <>
              <button className="main-button" onClick={checkpoint.accuracyPassed ? continueSkill : retrySkill} type="button">
                {retryLabel}
              </button>

              <button className="report-button" onClick={reviewMistakes} type="button">
                Review mistakes
              </button>
            </>
          )}

          <button className="report-button" onClick={returnToOverview} type="button">
            Return to Student Overview
          </button>
        </div>
      </section>
    </main>
  );
}

export function DashboardSummary({
  currentSkillIndex,
  skillTree,
  currentStage,
  roundCorrect,
  roundLength,
  accuracy
}) {
  return (
    <div className="dashboard">
      <div className="dash-card">
        <span>Current Skill</span>
        <strong>{currentSkillIndex + 1}/{skillTree.length}</strong>
      </div>

      <div className="dash-card wide-card">
        <span>Focus</span>
        <strong>{currentStage.label}</strong>
      </div>

      <div className="dash-card">
        <span>Round</span>
        <strong>{roundCorrect}/{roundLength}</strong>
      </div>

      <div className="dash-card">
        <span>Accuracy</span>
        <strong>{accuracy}%</strong>
      </div>
    </div>
  );
}

export function AdvancedPhonicsPatternAssessmentPage({
  studentName,
  patternIndex,
  patternItems,
  endAssessment,
  recordPatternResult,
  patternAssessment,
  resetPatternAssessment,
  returnToTeacherDashboard
}) {
  const [soundCorrect, setSoundCorrect] = useState(false);
  const [wordCorrect, setWordCorrect] = useState(false);

  useEffect(() => {
    setSoundCorrect(false);
    setWordCorrect(false);
  }, [patternIndex]);

  const currentPattern = patternItems[patternIndex];

  return (
    <main className="assessment-shell letter-focus-shell">
      {patternIndex < patternItems.length ? (
        <>
          <div className="assessment-topbar letter-topbar">
            <div className="assessment-meta">
              <span>{studentName || "Unnamed student"}</span>
              <strong>Advanced Phonics Pattern Assessment</strong>
            </div>

            <div className="assessment-progress">
              <div className="progress-label">
                Pattern {patternIndex + 1} of {patternItems.length}
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((patternIndex + 1) / patternItems.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <button className="reset-button assessment-end-button" onClick={endAssessment}>
              End Assessment
            </button>
          </div>

          <section className="card letter-focus-card pattern-focus-card">
            <div className="pattern-display">
              {currentPattern.pattern}
            </div>

            <div className="pattern-example">
              {currentPattern.exampleWord}
            </div>
          </section>

          <div className="letter-action-panel pattern-action-panel">
            <label className={soundCorrect ? "pattern-check-control active" : "pattern-check-control"}>
              <input
                checked={soundCorrect}
                onChange={event => setSoundCorrect(event.target.checked)}
                type="checkbox"
              />
              <span>Sound correct</span>
            </label>

            <label className={wordCorrect ? "pattern-check-control active" : "pattern-check-control"}>
              <input
                checked={wordCorrect}
                onChange={event => setWordCorrect(event.target.checked)}
                type="checkbox"
              />
              <span>Word correct</span>
            </label>

            <button
              className="main-button letter-next-button"
              onClick={() => recordPatternResult(soundCorrect, wordCorrect)}
            >
              Next Pattern
            </button>
          </div>
        </>
      ) : (
        <section className="card letter-complete-card page-stack">
          <h2>Assessment Complete</h2>

          <p>
            Pattern sounds correct:
            {" "}
            {patternAssessment.filter(x => x.soundCorrect).length}/{patternItems.length}
          </p>

          <p>
            Example words correct:
            {" "}
            {patternAssessment.filter(x => x.wordCorrect).length}/{patternItems.length}
          </p>

          <div className="button-row">
            <button
              className="reset-button"
              onClick={resetPatternAssessment}
            >
              Restart Pattern Assessment
            </button>

            {returnToTeacherDashboard && (
              <button
                className="report-button"
                onClick={returnToTeacherDashboard}
                type="button"
              >
                Return to Teacher Dashboard
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export function LetterAssessmentPage({
  studentName,
  letterIndex,
  letterItems,
  endAssessment,
  recordLetterResult,
  letterAssessment,
  resetLetterAssessment,
  returnToTeacherDashboard
}) {
  const [knowsName, setKnowsName] = useState(false);
  const [knowsSound, setKnowsSound] = useState(false);

  useEffect(() => {
    setKnowsName(false);
    setKnowsSound(false);
  }, [letterIndex]);

  const currentLetter = letterItems[letterIndex];

  return (
    <main className="assessment-shell letter-focus-shell">
      {letterIndex < letterItems.length ? (
        <>
          <div className="assessment-topbar letter-topbar">
            <div className="assessment-meta">
              <span>{studentName || "Unnamed student"}</span>
              <strong>EL Letter Name and Sound</strong>
            </div>

            <div className="assessment-progress">
              <div className="progress-label">
                Letter {letterIndex + 1} of {letterItems.length}
                {" "}
                ({currentLetter.type})
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((letterIndex + 1) / letterItems.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <button className="reset-button assessment-end-button" onClick={endAssessment}>
              End Assessment
            </button>
          </div>

          <section className="card letter-focus-card">
            <div className="letter-display">
              {currentLetter.display}
            </div>
          </section>

          <div className="letter-action-panel">
            <button
              className={knowsName ? "letter-mark-button active" : "letter-mark-button"}
              onClick={() => setKnowsName(value => !value)}
            >
              Name Known
            </button>

            <button
              className={knowsSound ? "letter-mark-button active" : "letter-mark-button"}
              onClick={() => setKnowsSound(value => !value)}
            >
              Sound Known
            </button>

            <button
              className="main-button letter-next-button"
              onClick={() => recordLetterResult(knowsName, knowsSound)}
            >
              Next Letter
            </button>
          </div>
        </>
      ) : (
        <section className="card letter-complete-card page-stack">
          <h2>Assessment Complete</h2>

          <p>
            Letter names known:
            {" "}
            {letterAssessment.filter(x => x.knowsName).length}/52
          </p>

          <p>
            Letter sounds known:
            {" "}
            {letterAssessment.filter(x => x.knowsSound).length}/52
          </p>

          <div className="button-row">
            <button
              className="reset-button"
              onClick={resetLetterAssessment}
            >
              Restart Letter Assessment
            </button>

            {returnToTeacherDashboard && (
              <button
                className="report-button"
                onClick={returnToTeacherDashboard}
                type="button"
              >
                Return to Teacher Dashboard
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export function AssessmentPage({
  currentQuestion,
  feedback,
  studentName,
  currentSkillIndex,
  currentStage,
  setFeedback,
  pickQuestion,
  roundAnswers,
  roundLength,
  roundProgress,
  shouldShowImage,
  answerQuestion,
  speakText,
  message,
  endAssessment,
  returnToStudentOverview,
  assessmentMode,
  isAssessmentTransitioning = false
}) {
  const safeSkillId =
    currentQuestion?.skillId ??
    currentStage?.id ??
    currentQuestion?.skill ??
    null;
  const safeCurrentStage = currentStage || {
    id: safeSkillId || "unknown_skill",
    label: currentQuestion?.skillName || currentQuestion?.skill || "Assessment"
  };
  const assessmentExit = returnToStudentOverview || endAssessment;

  const isListenAndFindWord =
    currentQuestion?.questionType === "listen_and_find_word" ||
    isHfwAudioFindWordQuestion(currentQuestion);
  const isPairSelection =
    ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(currentQuestion?.questionType);
  const isVisualCardChoice =
    currentQuestion?.questionType === "visual_card_choice" &&
    !isGraphemeChoiceQuestion(currentQuestion);
  const isIxlStyleTemplate =
    currentQuestion?.questionType === "ixl_template";
  const isFinalSoundsEndingItem = isFinalSoundsEndingQuestion(currentQuestion);
  const isGraphemeChoiceItem = isGraphemeChoiceQuestion(currentQuestion);
  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);
  const isShortVowelWordChoiceItem = isShortVowelWordChoiceQuestion(currentQuestion);
  const isListenChooseVowelItem = isListenChooseVowelQuestion(currentQuestion);
  const isGrammarSentenceFitItem = isGrammarSentenceFitQuestion(currentQuestion);
  const isHfwSkillItem = String(safeSkillId || "").toLowerCase().startsWith("hfw_");
  const renderAssessmentTopbar = () => (
    <div className="assessment-topbar">
      <div className="assessment-meta">
        <span>{studentName || "Unnamed student"}</span>
        <strong>
          {assessmentMode === "targetedReview"
            ? "Targeted Review"
            : `${currentSkillIndex + 1}. ${safeCurrentStage.label}`}
        </strong>
      </div>

      <div className="assessment-progress">
        <div className="progress-label">
          Question {Math.min(roundAnswers.length + 1, roundLength)} of {roundLength}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${roundProgress}%` }}
          ></div>
        </div>

        <div className="assessment-progress-dots" aria-label={`Question ${Math.min(roundAnswers.length + 1, roundLength)} of ${roundLength}`}>
          {Array.from({ length: roundLength }, (_, index) => (
            <span
              className={
                index < roundAnswers.length
                  ? "complete"
                  : index === roundAnswers.length
                    ? "current"
                    : ""
              }
              key={index}
            ></span>
          ))}
        </div>
      </div>

      <button className="reset-button assessment-end-button" onClick={endAssessment} type="button">
        End Assessment
      </button>
    </div>
  );
  const renderFeedbackCard = () => feedback ? (
    <motion.div
      className={[
        "feedback-card assessment-feedback",
        feedback.isCorrect ? "correct-feedback" : "wrong-feedback",
        feedback.skillId === "final_sounds" ? "final-sounds-feedback" : ""
      ].filter(Boolean).join(" ")}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h2>{feedback.isCorrect ? "Correct!" : feedback.support?.type === "pair_selection" ? "Sorry, incorrect." : "Let's learn from that one"}</h2>

      {feedback.support?.type !== "pair_selection" && (
        <>
          <p><strong>Your answer:</strong> {formatAnswerForFeedback(feedback.chosen)}</p>
          <p><strong>Correct answer:</strong> {formatAnswerForFeedback(feedback.correct)}</p>
        </>
      )}

      {!feedback.isCorrect && (
        <div className="teaching-slide">
          {feedback.support?.type === "pair_selection" ? (
            <div className="initial-sound-support">
              <section>
                <strong>Correct answer</strong>
                <div className="support-image-row">
                  {(feedback.support.correctWords || []).map(word => {
                    const card = feedback.support.cardsByWord?.[word];
                    return card ? (
                      <figure key={word}>
                        <img src={card.image} alt={card.alt || `Picture for ${word}`} />
                      </figure>
                    ) : null;
                  })}
                </div>
              </section>

              <section>
                <strong>You answered</strong>
                <div className="support-image-row">
                  {(feedback.support.chosenWords || []).map(word => {
                    const card = feedback.support.cardsByWord?.[word];
                    return card ? (
                      <figure key={word}>
                        <img src={card.image} alt={card.alt || `Picture for ${word}`} />
                      </figure>
                    ) : null;
                  })}
                </div>
              </section>

              <p>Words are made up of sounds. Some words share the same beginning, ending, or rhyming sound.</p>
              <p>{feedback.support.exampleText}</p>
              <p>{feedback.support.wrongText}</p>
            </div>
          ) : (
            <>
              <h3>Teaching Tip</h3>
              <p>{feedback.explanation}</p>
              <p><strong>Skill focus:</strong> {feedback.skill}</p>
            </>
          )}
        </div>
      )}

      {feedback.isCorrect && feedback.autoAdvance ? (
        <p className="muted-text feedback-auto-advance">Next question coming up...</p>
      ) : (
        <button
          className="main-button"
          onClick={() => {
            pickQuestion();
            setFeedback(null);
          }}
          type="button"
        >
          Continue
        </button>
      )}
    </motion.div>
  ) : null;

  const hasValidAssessmentTransitionState =
    Boolean(feedback) ||
    Boolean(isAssessmentTransitioning) ||
    (roundAnswers.length > 0 && !message);
  const shouldShowAssessmentLoadingState =
    !currentQuestion && !hasValidAssessmentTransitionState;

  if (shouldShowAssessmentLoadingState) {
    return (
      <main className="assessment-shell">
        <div className="card assessment-card">
          <h2>Loading assessment...</h2>
          {message && <p className="message">{message}</p>}
          <div className="button-row assessment-start-row">
            <button className="main-button" onClick={pickQuestion} type="button">
              {roundAnswers.length === 0 ? "Start Skill Round" : "Next Question"}
            </button>
            <button className="report-button" onClick={assessmentExit} type="button">
              Return to Student Overview
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentQuestion && feedback) {
    return (
      <main className="assessment-shell">
        {renderAssessmentTopbar()}
        {renderFeedbackCard()}
      </main>
    );
  }

  if (!currentQuestion && isAssessmentTransitioning) {
    return (
      <main className="assessment-shell">
        {renderAssessmentTopbar()}
        <div className="card assessment-card assessment-transition-card">
          <h2>Preparing next question...</h2>
        </div>
      </main>
    );
  }

  if (currentQuestion && !safeSkillId) {
    console.error("Assessment missing skillId", {
      currentQuestion,
      currentStage
    });

    return (
      <main className="assessment-shell">
        <div className="card assessment-card">
          <h2>This assessment needs a quick fix.</h2>
          <p>Please return and try again.</p>
          <button className="main-button" onClick={assessmentExit} type="button">
            Return to Student Overview
          </button>
        </div>
      </main>
    );
  }

  if (
    import.meta.env.DEV &&
    currentQuestion &&
    String(currentQuestion.skillId || "").toLowerCase() === "final_sounds" &&
    Number(currentQuestion.level || currentQuestion.difficulty || 1) === 1
  ) {
    const levelOneIssues = getFinalSoundsLevel1QuestionIssues(currentQuestion);
    if (levelOneIssues.length > 0) {
      console.warn("Final Sounds Level 1 question reached render with invalid options or target", {
        id: currentQuestion.id,
        targetWord: currentQuestion.targetWord || currentQuestion.audioText,
        level: currentQuestion.level,
        source: currentQuestion.source || currentQuestion._source || "unknown",
        issues: levelOneIssues,
        question: currentQuestion
      });
    }
  }
  const visiblePrompt = getStudentVisiblePrompt(currentQuestion);
  const promptAudioText = isFinalSoundsEndingItem
    ? visiblePrompt
    : (
      currentQuestion?.spokenPrompt ||
      visiblePrompt ||
      currentQuestion?.audioText ||
      ""
    );
  const promptAudioPath = isHfwSkillItem || isRhymingPictureItem
    ? ""
    : getApprovedAudioPath(
      isHfwAudioFindWordQuestion(currentQuestion)
        ? currentQuestion?.audioText || currentQuestion?.targetWord || currentQuestion?.answer
        : promptAudioText,
      (isPairSelection || isHfwAudioFindWordQuestion(currentQuestion)) ? currentQuestion?.audioPath || currentQuestion?.audioUrl || "" : ""
    );
  const rawPromptAudioPath = !isHfwSkillItem && (isPairSelection || isHfwAudioFindWordQuestion(currentQuestion))
    ? currentQuestion?.audioPath || currentQuestion?.audioUrl || ""
    : "";
  const normalizedChoices = (currentQuestion?.choices || []).map(choice => ({
    ...normalizeAnswerOption(choice),
    media: getAnswerOptionMedia(choice)
  }));
  const getChoiceAudioText = choice =>
    isListenChooseVowelItem && /^[aeiou]$/i.test(choice.label)
      ? `short ${choice.label.toLowerCase()}`
      : choice.label;
  const textChoiceAudioPaths = Object.fromEntries(
    normalizedChoices.map(choice => [
      choice.value,
      getApprovedAudioPath(getChoiceAudioText(choice), choice.media.audio || "")
    ])
  );
  const showTextChoiceAudio =
    (!isListenAndFindWord || isShortVowelWordChoiceItem) &&
    !String(safeSkillId || "").toLowerCase().startsWith("hfw_") &&
    !isPairSelection &&
    !isVisualCardChoice &&
    !isIxlStyleTemplate &&
    normalizedChoices.length > 0 &&
    normalizedChoices.every(choice => Boolean(textChoiceAudioPaths[choice.value]));

  return (
    <main className="assessment-shell">
      {renderAssessmentTopbar()}

      {!currentQuestion && !feedback && (
        <div className="button-row assessment-start-row">
          <button className="main-button" onClick={pickQuestion}>
            {roundAnswers.length === 0 ? "Start Skill Round" : "Next Question"}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            className={[
              "card assessment-card assessment-question-layout",
              isRhymingPictureItem ? "rhyming-assessment-layout" : "",
              safeSkillId === "final_sounds" ? "final-sounds-assessment-card" : "",
              isPairSelection && safeSkillId === "final_sounds" ? "final-sounds-pair-assessment-card" : "",
              isFinalSoundsEndingItem ? "final-sounds-ending-assessment-card" : "",
              isGraphemeChoiceItem ? "grapheme-choice-assessment-card" : "",
              isShortVowelWordChoiceItem ? "short-vowel-word-choice-card" : "",
              isListenChooseVowelItem ? "short-vowel-listen-choice-card" : ""
            ].filter(Boolean).join(" ")}
            key={currentQuestion.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <div className="question-line assessment-prompt">
              {(promptAudioPath || rawPromptAudioPath) && (
                <AssessmentAudioButton
                  text={promptAudioText}
                  audioPath={promptAudioPath || rawPromptAudioPath}
                  speakText={speakText}
                  label="Listen to question"
                  className={isPairSelection ? "mini-audio-button instruction-audio-button" : "mini-audio-button"}
                  showDisabled
                />
              )}
              <h2>{visiblePrompt}</h2>
            </div>

            <AssessmentStimulus
              currentQuestion={currentQuestion}
              isListenAndFindWord={isListenAndFindWord}
              isPairSelection={isPairSelection}
              isVisualCardChoice={isVisualCardChoice}
              isIxlStyleTemplate={isIxlStyleTemplate}
              isShortVowelWordChoice={isShortVowelWordChoiceItem}
              isListenChooseVowel={isListenChooseVowelItem}
              isGrammarSentenceFit={isGrammarSentenceFitItem}
              speakText={speakText}
              shouldShowImage={shouldShowImage}
            />

            {isPairSelection ? (
              <PairSelectionQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
              />
            ) : isVisualCardChoice ? (
              <VisualCardChoiceQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
              />
            ) : isIxlStyleTemplate ? (
              <IxlStyleTemplateQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
              />
            ) : currentQuestion.questionType === "fix_sentence" ? (
              <FixSentenceQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
              />
            ) : (
              <div className={[
                isListenAndFindWord && !isShortVowelWordChoiceItem ? "choices visual-word-choices assessment-answer-grid" : "choices assessment-answer-grid",
                isShortVowelWordChoiceItem ? "short-vowel-word-choice-grid" : "",
                isListenChooseVowelItem ? "vowel-choice-grid" : "",
                isGraphemeChoiceItem ? "grapheme-choice-grid final-sounds-grapheme-grid" : ""
              ].filter(Boolean).join(" ")}>
                {normalizedChoices.map((choice, index) => {
                  const choiceImage = currentQuestion.choiceImages?.[choice.value] || currentQuestion.choiceImages?.[choice.label] || {};
                  const choiceButtonClassName = [
                    isListenAndFindWord && !isShortVowelWordChoiceItem ? "choice-button visual-word-choice assessment-answer-card" : "choice-button assessment-answer-card",
                    isShortVowelWordChoiceItem ? "short-vowel-word-choice-button" : "",
                    isGraphemeChoiceItem ? "grapheme-choice-button final-sound-choice-button final-sound-grapheme-option" : ""
                  ].filter(Boolean).join(" ");

                  return (
                  <div
                    className={isListenAndFindWord && !isShortVowelWordChoiceItem ? "choice-wrap visual-word-choice-wrap" : "choice-wrap"}
                    key={index}
                  >
                    {showTextChoiceAudio && (
                      <AssessmentAudioButton
                        text={getChoiceAudioText(choice)}
                        audioPath={textChoiceAudioPaths[choice.value]}
                        speakText={speakText}
                        label={`Listen to ${choice.label}`}
                        className="choice-audio"
                      />
                    )}
                    <button
                      className={choiceButtonClassName}
                      onClick={() => answerQuestion(choice.value)}
                    >
                      {isListenAndFindWord && !isShortVowelWordChoiceItem && !isGraphemeChoiceItem && choiceImage.image && (
                        <img
                          src={choiceImage.image}
                          alt={choiceImage.alt || `Picture for ${choice.label}`}
                          className="visual-word-choice-image"
                        />
                      )}
                      <span>{choice.label}</span>
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {renderFeedbackCard()}

      {message && !feedback && (
        <h2 className="message">{message}</h2>
      )}
    </main>
  );
}

export function FinishedReportPage({
  startAssessment,
  keepPracticingSkill,
  startTargetedReview,
  goToOverview,
  studentName,
  totalAnswered,
  accuracy,
  currentStage,
  currentSkillIndex,
  setCurrentSkillIndex,
  setRoundAnswers,
  setCurrentQuestion,
  setFeedback,
  setMessage,
  skillTree,
  currentStageQuestions,
  mastery,
  coverageSnapshot,
  skillMasterySummary = [],
  allowPassageAudio,
  setAllowPassageAudio,
  exportData,
  exportCSVData,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment,
  returnToTeacherDashboard
}) {
  const latestCheckpointIndex = Math.max(
    -1,
    currentSkillIndex - 1,
    ...skillTree
      .map((stage, index) => mastery[stage.id]?.mastered ? index : -1)
      .filter(index => index !== -1)
  );
  const latestCheckpointStage = skillTree[latestCheckpointIndex];
  const latestCheckpointCoverage = latestCheckpointStage
    ? coverageSnapshot?.[latestCheckpointStage.id]
    : null;
  const latestCheckpointIncomplete =
    latestCheckpointCoverage &&
    latestCheckpointCoverage.mastered < latestCheckpointCoverage.total;

  return (
    <div className="report-panel page-stack">
      <h2>Finished Report</h2>

      <div className="button-row finished-report-actions">
        <button className="main-button" onClick={startAssessment}>
          Continue Learning
        </button>

        <button className="report-button" onClick={goToOverview}>
          Return to Dashboard
        </button>

        {returnToTeacherDashboard && (
          <button className="report-button" onClick={returnToTeacherDashboard} type="button">
            Return to Teacher Dashboard
          </button>
        )}

        <button className="report-button" onClick={goToOverview}>
          Return to Menu
        </button>

        <button className="report-button" onClick={startTargetedReview} type="button">
          Review Mistakes
        </button>

        <button className="report-button" onClick={startTargetedReview} type="button">
          Retry Incorrect Only
        </button>
      </div>

      <p><strong>Student:</strong> {studentName || "Unnamed student"}</p>
      <p><strong>Total answered:</strong> {totalAnswered}</p>
      <p><strong>Accuracy:</strong> {accuracy}%</p>
      <p><strong>Current focus:</strong> {currentStage.label}</p>

      <label>
        <strong>Set start skill: </strong>
        <select
          value={currentSkillIndex}
          onChange={e => {
            setCurrentSkillIndex(Number(e.target.value));
            setRoundAnswers([]);
            setCurrentQuestion(null);
            setFeedback(null);
            setMessage("Start skill changed.");
          }}
        >
          {skillTree.map((stage, index) => (
            <option key={stage.id} value={index}>
              {index + 1}. {stage.label}
            </option>
          ))}
        </select>
      </label>
      <p><strong>Available questions in this skill:</strong> {currentStageQuestions.length}</p>
      <p><strong>Checkpoint rule:</strong> 9/10 correct to unlock the next skill.</p>

      {latestCheckpointStage && mastery[latestCheckpointStage.id]?.mastered && (
        <section className="checkpoint-complete-panel">
          <div>
            <h3>Checkpoint Passed</h3>
            <p>
              {latestCheckpointIncomplete
                ? "Checkpoint passed. Student may move forward, but this skill is not fully covered yet."
                : "Checkpoint passed and item coverage is complete for the tracked items in this skill."}
            </p>
            {latestCheckpointCoverage && (
              <div className="coverage-card compact">
                <div className="coverage-card-header">
                  <strong>{latestCheckpointStage.label} Coverage</strong>
                  <span>{latestCheckpointCoverage.mastered}/{latestCheckpointCoverage.total} {latestCheckpointCoverage.unit} mastered</span>
                </div>
                <div className="coverage-bar secondary" aria-label={`${latestCheckpointStage.label} coverage progress`}>
                  <span style={{ width: `${latestCheckpointCoverage.total ? Math.round((latestCheckpointCoverage.mastered / latestCheckpointCoverage.total) * 100) : 0}%` }}></span>
                </div>
              </div>
            )}
          </div>

          <div className="button-row">
            <button className="main-button" onClick={() => startAssessment(currentSkillIndex)} type="button">
              Move to Next Skill
            </button>
            <button
              className="report-button"
              onClick={() => keepPracticingSkill(latestCheckpointIndex)}
              type="button"
            >
              Keep Practicing This Skill
            </button>
          </div>
        </section>
      )}

      <h3>Skill Checkpoints and Coverage</h3>

      {skillTree.map((stage, index) => {
        const data = mastery[stage.id];
        const coverage = coverageSnapshot?.[stage.id] || {
          mastered: 0,
          total: 0,
          unit: "items"
        };
        const checkpointPercent = data?.lastTotal
          ? Math.round((data.lastScore / data.lastTotal) * 100)
          : 0;
        const coveragePercent = coverage.total
          ? Math.round((coverage.mastered / coverage.total) * 100)
          : 0;

        return (
          <div className="skill-row" key={stage.id}>
            <span>{index + 1}. {stage.label}</span>
            <span>{data?.mastered ? "Checkpoint Passed" : index === currentSkillIndex ? "Current Checkpoint" : "Locked"}</span>
            <span className="skill-row-progress">
              <span>Checkpoint: {data ? `${data.lastScore}/${data.lastTotal}` : "-"}</span>
              <span className="mini-progress-bar"><span style={{ width: `${checkpointPercent}%` }}></span></span>
            </span>
            <span className="skill-row-progress">
              <span>Coverage: {coverage.mastered}/{coverage.total} {coverage.unit} mastered</span>
              <span className="mini-progress-bar secondary"><span style={{ width: `${coveragePercent}%` }}></span></span>
            </span>
          </div>
        );
      })}

      <section className="mastery-detail-panel">
        <h3>Mastered Words and Items</h3>
        <div className="mastery-detail-list">
          {skillMasterySummary
            .filter(summary => summary.masteredCount > 0)
            .map(summary => (
              <article key={summary.skillId}>
                <strong>{summary.skillName}</strong>
                <span>{summary.displayText}</span>
              </article>
            ))}
          {skillMasterySummary.every(summary => summary.masteredCount === 0) && (
            <p>Item-level word lists will build from new correct answers.</p>
          )}
        </div>
      </section>

      <label className="teacher-toggle">
        <input
          type="checkbox"
          checked={allowPassageAudio}
          onChange={() => setAllowPassageAudio(!allowPassageAudio)}
        />
        Allow passage audio
      </label>

      <div className="button-row export-actions">
        <button className="report-button" onClick={exportData}>
          Export Text Report
        </button>

        <button className="report-button" onClick={exportCSVData}>
          Export Excel CSV
        </button>

        {letterAssessment.length > 0 && (
          <button className="report-button" onClick={exportLetterAssessment} type="button">
            Export Letter Excel
          </button>
        )}

        {patternAssessment.length > 0 && (
          <button className="report-button" onClick={exportPatternAssessment} type="button">
            Export Pattern Excel
          </button>
        )}

        {returnToTeacherDashboard && (
          <button className="report-button" onClick={returnToTeacherDashboard} type="button">
            Return to Teacher Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
