/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "../styles/assessment.css";
import {
  getTargetWordAudioPath,
  SHORT_VOWEL_LISTEN_PROMPT
} from "../utils/assessmentAudioRoles";
import {
  getApprovedCardAudioPath
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
import { buildClassReportModel } from "../data/reportingSystem.js";
import { getFinalSoundsLevel1QuestionIssues } from "../data/earlyPhonicsValidation.js";
import { getTargetObjectImage } from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { isHfwSpellingQuestion } from "../data/isHfwSpellingQuestion.js";
import { submitQuestionReport } from "../data/questionFlagStore.js";
import { AssessmentAudioButton } from "./assessment/AssessmentAudioButton.jsx";
import { HfwLetterBuildPanel } from "./assessment/HfwLetterBuildPanel.jsx";
import { MetricFigure } from "./MetricDefinition.jsx";
import { RouteLoadingFallback } from "./RouteLoadingFallback.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import { TeacherSurfaceState } from "./teacher/ui/TeacherSurfaceState.jsx";
import {
  getAssessmentDecorativeMediaProps,
  getAssessmentEvidenceAccessibleName,
  getAssessmentMainImageLabel
} from "../policy/assessmentMediaEvidence.js";
import { lazyWithRetry } from "../utils/lazyWithRetry.js";
import { countPhrase, progressPhrase, TEACHER_COPY } from "../copy/teacherCopy.js";
import { exportAssessmentAttemptsCsv } from "../data/assessmentHistoryStore.js";
import {
  buildExportProvenanceRows,
  exportProvenanceCsvPreamble
} from "../utils/exportProvenance.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import {
  printTeacherDocument,
  TEACHER_PRINT_TARGETS
} from "../utils/teacherPrintTarget.js";
import { getPreferredPhonemeAudioPath } from "../data/phonemeAudioBank.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../data/ledaProductionAudio.js";

export { AuthPage } from "./AuthPage.jsx";

const EL_BENCHMARK_ASSESSMENT_IDS = new Set([
  "el_phonological_awareness",
  "el_encoding",
  "el_decoding",
  "el_oral_reading_fluency"
]);

const ClassSummaryReportDocument = lazyWithRetry(() =>
  import("./reports/ClassSummaryReportDocument.jsx").then(module => ({
    default: module.ClassSummaryReportDocument
  }))
);

const ElFormalAssessmentsPanel = lazyWithRetry(() =>
  import("./reports/ElFormalAssessmentsPanel.jsx").then(module => ({
    default: module.ElFormalAssessmentsPanel
  }))
);

const COMPREHENSION_PASSAGE_SKILL_IDS = new Set([
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme",
  "theme_higher_comprehension"
]);

function getApprovedAudioPath(text = "", audioPath = "") {
  return getLedaInstructionAudioPath(text)
    || getLedaWordAudioPath(text)
    || audioPath
    || "";
}

function getShortVowelLetter(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .match(/^(?:short[_\s-]*)?([aeiou])$/)?.[1] || "";
}

// Keep short-vowel cues explicit at the assessment boundary so a label
// fallback can never become a spoken letter name or browser-generated cue.
const SHORT_VOWEL_AUDIO_PATHS = Object.freeze(
  Object.fromEntries("aeiou".split("").map(letter => [letter, getPreferredPhonemeAudioPath(letter)]))
);

function getPhonemeAudioPath(value = "", fallbackPath = "") {
  const shortVowel = getShortVowelLetter(value);
  const normalized = shortVowel || String(value || "").trim().toLowerCase();
  if (shortVowel && SHORT_VOWEL_AUDIO_PATHS[shortVowel]) return SHORT_VOWEL_AUDIO_PATHS[shortVowel];
  const preferred = getPreferredPhonemeAudioPath(normalized);
  if (preferred) return preferred;
  const safeFallback = String(fallbackPath || "");
  return /^\/audio\/(?:phonemes\/|production\/en-US\/pattern\/)/.test(safeFallback)
    ? safeFallback
    : "";
}

function normalizeSoundTile(tile) {
  if (tile && typeof tile === "object") {
    const media = tile.media && typeof tile.media === "object" ? tile.media : {};
    const label = String(tile.label ?? tile.text ?? tile.value ?? tile.letter ?? tile.grapheme ?? "").trim();
    const value = String(tile.value ?? tile.letter ?? tile.grapheme ?? label).trim();
    const audioHint = String(tile.audioText ?? tile.sound ?? tile.phoneme ?? "").trim() || label || value;
    const shortVowel = getShortVowelLetter(audioHint) || getShortVowelLetter(value) || getShortVowelLetter(label);
    const answerValue = shortVowel && /short/i.test(`${label} ${value} ${audioHint}`) ? shortVowel : value;
    const display = shortVowel ? shortVowel : label || value;

    return {
      answerValue,
      audioPath: getPhonemeAudioPath(shortVowel || audioHint || answerValue, media.audio || tile.audioPath || tile.audio || ""),
      audioText: shortVowel ? shortVowel : audioHint || answerValue,
      display,
      label: shortVowel ? `short ${shortVowel}` : label || value
    };
  }

  const raw = String(tile ?? "").trim();
  const shortVowel = getShortVowelLetter(raw);
  return {
    answerValue: shortVowel ? shortVowel : raw,
    audioPath: getPhonemeAudioPath(shortVowel || raw),
    audioText: shortVowel ? shortVowel : raw,
    display: shortVowel ? shortVowel : raw,
    label: shortVowel ? `short ${shortVowel}` : raw
  };
}

function normalizeSkillId(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isComprehensionPassageQuestion(question = {}) {
  const skillId = normalizeSkillId(question.assessmentSkillId || question.skillId || question.skill || "");
  return COMPREHENSION_PASSAGE_SKILL_IDS.has(skillId) && Boolean(String(question.passage || "").trim());
}

function countPassageSentences(text = "") {
  return (String(text || "").match(/[.!?]+/g) || []).length;
}

function ComprehensionPassageCard({ text, currentQuestion, speakText }) {
  const [passageExpanded, setPassageExpanded] = useState(true);
  const sentenceCount = countPassageSentences(text);
  const questionDepth = Number(currentQuestion.level || currentQuestion.difficulty || 1);
  const canTogglePassage = questionDepth >= 3 && sentenceCount >= 5;
  const isLongPassage = sentenceCount >= 6;

  return (
    <div className="passage-wrap assessment-passage-card comprehension-passage-card">
      <div className="comprehension-passage-header">
        <strong>Passage</strong>
        <div className="comprehension-passage-actions">
          <AssessmentAudioButton
            text={text}
            audioPath={getApprovedAudioPath(
              text,
              currentQuestion.passageAudioPath || currentQuestion.audioPath || ""
            )}
            speakText={speakText}
            label="Listen to passage"
            className="mini-audio-button"
            showDisabled
          />
          {isLongPassage && (
            <span className="comprehension-passage-length">
              {sentenceCount} sentences
            </span>
          )}
          {canTogglePassage && (
            <button
              className="passage-toggle"
              onClick={() => setPassageExpanded(expanded => !expanded)}
              type="button"
              aria-expanded={passageExpanded}
            >
              {passageExpanded ? "Hide passage" : "Show passage again"}
            </button>
          )}
        </div>
      </div>

      {(!canTogglePassage || passageExpanded) ? (
        <p className="passage comprehension-passage-text">{text}</p>
      ) : (
        <p className="comprehension-passage-collapsed">Passage hidden</p>
      )}
    </div>
  );
}

function FixSentenceQuestion({ currentQuestion, answerQuestion, speakText }) {
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
        <AssessmentAudioButton
          text={currentQuestion.brokenSentence}
          audioPath={getApprovedAudioPath(
            currentQuestion.brokenSentence,
            currentQuestion.sentenceAudioPath || ""
          )}
          speakText={speakText}
          label="Listen to sentence"
          className="mini-audio-button"
          showDisabled
        />
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
          <span className="sentence-tile-with-audio" key={`${item.tile}-${item.index}`}>
            <AssessmentAudioButton
              text={item.tile}
              audioPath={getApprovedAudioPath(item.tile)}
              speakText={speakText}
              label={`Hear ${item.tile}`}
              className="choice-audio"
              showDisabled
            />
            <button
              className="sentence-tile"
              onClick={() => addTile(item)}
              type="button"
            >
              {item.tile}
            </button>
          </span>
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

function AssessmentEvidenceImage({
  alt = "",
  className = "",
  currentQuestion,
  label = "",
  onEvidenceImageError,
  role = "evidence",
  src
}) {
  const accessibleName = getAssessmentEvidenceAccessibleName({ alt, label, role });

  return (
    <img
      src={src}
      alt={accessibleName}
      className={className || undefined}
      data-assessment-media-kind="evidence"
      data-assessment-media-role={role}
      loading="lazy"
      decoding="async"
      onError={() => onEvidenceImageError?.({
        questionId: currentQuestion?.id || "",
        src,
        role
      })}
    />
  );
}

function PairSelectionQuestion({
  currentQuestion,
  answerQuestion,
  speakText,
  onEvidenceImageError
}) {
  const [selectedWords, setSelectedWords] = useState([]);
  const showCardAudio = true;
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
                <AssessmentEvidenceImage
                  src={image}
                  alt={card.alt}
                  label={label}
                  role="choice"
                  currentQuestion={currentQuestion}
                  onEvidenceImageError={onEvidenceImageError}
                />
                {!currentQuestion.hideWrittenLabels && <strong>{label}</strong>}
              </button>

              {showCardAudio && (
                <AssessmentAudioButton
                  text={label}
                  audioPath={getApprovedCardAudioPath(card)}
                  speakText={speakText}
                  label={`Hear ${label}`}
                  className="initial-sound-card-audio"
                  showDisabled
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

function VisualCardChoiceQuestion({
  currentQuestion,
  answerQuestion,
  speakText,
  onEvidenceImageError
}) {
  const [selectedValues, setSelectedValues] = useState([]);
  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);
  const showCardAudio = true;
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
                  <AssessmentEvidenceImage
                    src={image}
                    alt={card.alt}
                    label={label}
                    role="choice"
                    currentQuestion={currentQuestion}
                    onEvidenceImageError={onEvidenceImageError}
                  />
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
                  showDisabled
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

function PictureSequenceOrderQuestion({
  currentQuestion,
  answerQuestion,
  speakText,
  onEvidenceImageError
}) {
  const sourceCards = useMemo(
    () => currentQuestion.sequenceCards || [],
    [currentQuestion.sequenceCards]
  );
  const displayCards = useMemo(() => {
    if (sourceCards.length < 2) return sourceCards;
    const offset = Array.from(String(currentQuestion.id || "sequence"))
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % sourceCards.length;
    const rotated = [...sourceCards.slice(offset), ...sourceCards.slice(0, offset)];
    return offset === 0 ? [...rotated].reverse() : rotated;
  }, [currentQuestion.id, sourceCards]);
  const [orderedValues, setOrderedValues] = useState([]);

  useEffect(() => {
    setOrderedValues([]);
  }, [currentQuestion.id]);

  function choose(card) {
    setOrderedValues(previous => (
      previous.includes(card.value)
        ? previous.filter(value => value !== card.value)
        : [...previous, card.value]
    ));
  }

  return (
    <div className="picture-sequence-panel">
      <ol className="picture-sequence-order" aria-label="Your picture order">
        {sourceCards.map((_, index) => {
          const value = orderedValues[index];
          const card = sourceCards.find(candidate => candidate.value === value);
          return (
            <li key={`sequence-slot-${index}`}>
              <span>{index + 1}</span>
              <strong>{card?.label || "Choose a picture"}</strong>
            </li>
          );
        })}
      </ol>

      <div className="visual-card-grid picture-sequence-grid">
        {displayCards.map(card => {
          const selectedIndex = orderedValues.indexOf(card.value);
          return (
            <article className={selectedIndex >= 0 ? "visual-assessment-card selected" : "visual-assessment-card"} key={card.id || card.value}>
              <button
                className="visual-assessment-card-button"
                onClick={() => choose(card)}
                aria-label={selectedIndex >= 0 ? `Remove step ${selectedIndex + 1}: ${card.label}` : `Add ${card.label} next`}
                aria-pressed={selectedIndex >= 0}
                type="button"
              >
                <AssessmentEvidenceImage
                  src={card.image || card.imagePath}
                  alt={card.alt}
                  label={card.label}
                  role="choice"
                  currentQuestion={currentQuestion}
                  onEvidenceImageError={onEvidenceImageError}
                />
                <strong>{selectedIndex >= 0 ? `${selectedIndex + 1}. ${card.label}` : card.label}</strong>
              </button>
              <AssessmentAudioButton
                text={card.label}
                audioPath={getApprovedAudioPath(card.label, card.audioPath || "")}
                speakText={speakText}
                label={`Hear ${card.label}`}
                className="initial-sound-card-audio"
                showDisabled
              />
            </article>
          );
        })}
      </div>

      <div className="button-row">
        <button className="reset-button" onClick={() => setOrderedValues([])} type="button">
          Start again
        </button>
        <button
          className="main-button"
          disabled={orderedValues.length !== sourceCards.length}
          onClick={() => answerQuestion(orderedValues.join(" → "))}
          type="button"
        >
          Put in order
        </button>
      </div>
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
  const sentence =
    currentQuestion.sentenceWithBlank ||
    currentQuestion.visibleSentenceWithBlank ||
    currentQuestion.sentence ||
    currentQuestion.context ||
    "";
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

              <AssessmentAudioButton
                text={option.label}
                audioPath={audioPath}
                speakText={speakText}
                label={`Hear ${option.label}`}
                className="initial-sound-card-audio"
                showDisabled
              />
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

function IxlStyleTemplateQuestion({
  currentQuestion,
  answerQuestion,
  speakText,
  onEvidenceImageError
}) {
  const [selectedTiles, setSelectedTiles] = useState([]);
  const isHfwLetterBuild = isHfwLetterBuildQuestion(currentQuestion);
  const isGrammarSentenceFit = isGrammarSentenceFitQuestion(currentQuestion);
  const isSoundOrder = currentQuestion.templateType === "PUT_SOUNDS_IN_ORDER";
  const isGraphemeChoiceItem = isGraphemeChoiceQuestion(currentQuestion);
  const isShortVowelWordChoiceItem = isShortVowelWordChoiceQuestion(currentQuestion);
  const answerOptions = currentQuestion.answerOptions || [];
  const normalizedAnswerOptions = answerOptions.map(option => ({
    ...normalizeAnswerOption(option),
    media: getAnswerOptionMedia(option)
  }));
  const hasImageOptions = !isGraphemeChoiceItem && normalizedAnswerOptions.some(option => Boolean(option.media.image));
  const isCompactLetterOptions =
    (isGraphemeChoiceItem || !hasImageOptions) &&
    normalizedAnswerOptions.length <= 4 &&
    normalizedAnswerOptions.every(option => option.label.length <= 3);
  const answerGridClassName = [
    "ixl-answer-grid",
    normalizedAnswerOptions.length === 3 ? "three-options" : "",
    normalizedAnswerOptions.length === 4 ? "four-options" : "",
    hasImageOptions ? "image-options" : "",
    isCompactLetterOptions ? "letter-options" : "",
    isShortVowelWordChoiceItem ? "short-vowel-ixl-word-choice-grid" : ""
  ].filter(Boolean).join(" ");
  const showOptionAudio = normalizedAnswerOptions.length > 0;

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
    const descriptor = normalizeSoundTile(tile);
    if (descriptor.audioPath && speakText) {
      void speakText(descriptor.audioText, descriptor.audioPath, {
        allowBrowserFallback: false,
        requireApprovedAudio: true
      });
    }
    setSelectedTiles(previous => [...previous, { tile: descriptor, index }]);
  }

  function removeTile(index) {
    setSelectedTiles(previous => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  if (isSoundOrder) {
    const tiles = currentQuestion.soundTiles || [];
    const selectedIndexes = new Set(selectedTiles.map(item => item.index));
    const builtWord = selectedTiles.map(item => item.tile.answerValue).join("");
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
                key={`${item.tile.answerValue}-${item.index}`}
                onClick={() => removeTile(index)}
                type="button"
                aria-label={`Remove ${item.tile.label}`}
              >
                {item.tile.display}
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
          {tiles.map((tile, index) => {
            const descriptor = normalizeSoundTile(tile);
            return (
              <button
                className="sound-order-tile"
                disabled={selectedIndexes.has(index)}
                key={`${descriptor.answerValue}-${descriptor.label}-${index}`}
                onClick={() => addTile(tile, index)}
                type="button"
                aria-label={`Add ${descriptor.label}`}
              >
                {descriptor.display}
              </button>
            );
          })}
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
          const audioPath = isGraphemeChoiceItem
            ? getPhonemeAudioPath(label, option.media.audio || "")
            : getApprovedAudioPath(label, option.media.audio || "");
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
                  <AssessmentEvidenceImage
                    src={image}
                    alt={rawOption.alt || rawOption.imageAlt}
                    label={label}
                    role="choice"
                    currentQuestion={currentQuestion}
                    onEvidenceImageError={onEvidenceImageError}
                  />
                )}
                <strong>{label}</strong>
              </button>

              {showOptionAudio && (
                <AssessmentAudioButton
                  text={label}
                  audioPath={audioPath}
                  speakText={speakText}
                  label={`Hear ${label}`}
                  className="initial-sound-card-audio"
                  showDisabled
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function QuestionFlagControls({
  currentQuestion,
  currentStage,
  studentId,
  studentSessionToken,
  supabase,
  visiblePrompt
}) {
  const [reportStates, setReportStates] = useState(() => ({
    image: { status: "idle", reportId: "", message: "" },
    question: { status: "idle", reportId: "", message: "" }
  }));

  useEffect(() => {
    setReportStates({
      image: { status: "idle", reportId: "", message: "" },
      question: { status: "idle", reportId: "", message: "" }
    });
  }, [currentQuestion?.id]);

  async function report(type) {
    const previous = reportStates[type];
    if (previous.status === "saving" || previous.status === "saved") return;
    setReportStates(states => ({
      ...states,
      [type]: {
        ...states[type],
        status: "saving",
        message: ""
      }
    }));
    const result = await submitQuestionReport({
      supabase,
      studentId,
      studentSessionToken,
      flagType: type,
      question: currentQuestion,
      stage: currentStage,
      visiblePrompt,
      reportId: previous.reportId || undefined
    });
    setReportStates(states => ({
      ...states,
      [type]: result.ok
        ? {
            status: "saved",
            reportId: result.reportId,
            message: `${type === "image" ? "Image" : "Question"} report sent.`
          }
        : {
            status: "error",
            reportId: result.reportId,
            message: result.error?.message || "The report was not sent. Try again."
          }
    }));
  }

  if (!currentQuestion) return null;

  return (
    <div
      className="question-flag-controls"
      aria-label="Report a problem with this assessment question"
    >
      {[
        ["image", "image"],
        ["question", "question"]
      ].map(([type, noun]) => {
        const state = reportStates[type];
        const label = state.status === "saving"
          ? `Sending ${noun} report…`
          : state.status === "saved"
            ? `${noun === "image" ? "Image" : "Question"} report sent`
            : state.status === "error"
              ? `Try ${noun} report again`
              : `Report ${noun}`;
        return (
          <div key={type}>
            <button
              aria-describedby={state.message ? `question-report-${type}-status` : undefined}
              className="text-button"
              disabled={state.status === "saving" || state.status === "saved"}
              onClick={() => report(type)}
              type="button"
            >
              {label}
            </button>
            {state.message && (
              <span
                className={state.status === "error" ? "question-report-error" : "question-report-success"}
                data-question-report-id={state.reportId || undefined}
                id={`question-report-${type}-status`}
                role={state.status === "error" ? "alert" : "status"}
              >
                {state.message}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ListeningVisual() {
  return (
    <div
      className="assessment-listening-visual"
      {...getAssessmentDecorativeMediaProps()}
    >
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
  return isHfwSpellingQuestion(question);
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

function AssessmentStimulus({
  currentQuestion,
  isListenAndFindWord,
  isPairSelection,
  isVisualCardChoice,
  isIxlStyleTemplate,
  isShortVowelWordChoice,
  isListenChooseVowel,
  isGrammarSentenceFit,
  speakText,
  shouldShowImage,
  onEvidenceImageError
}) {
  if (!currentQuestion) return null;

  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);
  const isHfwLetterBuildItem = isHfwLetterBuildQuestion(currentQuestion);
  const isComprehensionPassageItem = isComprehensionPassageQuestion(currentQuestion);
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
  const hasMainImage = isRhymingPictureItem
    ? Boolean(stimulusImage)
    : isFinalSoundsEndingItem
    ? Boolean(targetObjectImage)
    : Boolean(stimulusImage) || shouldShowImage(currentQuestion);
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
            <AssessmentEvidenceImage
              key={card.id || card.word}
              src={card.image}
              alt={card.alt}
              label={card.label || card.word || card.value}
              role="prompt"
              currentQuestion={currentQuestion}
              onEvidenceImageError={onEvidenceImageError}
              className="prompt-image-card"
            />
          ))}
        </div>
      )}

      {hasMainImage && !hasPromptImages && (
        <div className="image-box assessment-main-image-wrap">
          <AssessmentEvidenceImage
            src={stimulusImage}
            alt={currentQuestion.imageAlt || currentQuestion.alt}
            label={getAssessmentMainImageLabel(currentQuestion)}
            role="stimulus"
            currentQuestion={currentQuestion}
            onEvidenceImageError={onEvidenceImageError}
            className="question-image assessment-main-image"
          />
          {isRhymingPictureItem && currentQuestion.targetWord && (
            <strong className="rhyming-target-word">{currentQuestion.targetWord}</strong>
          )}
          {!isRhymingPictureItem && (
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
          {(
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

      {visiblePassageTexts.map(text => {
        const isPrimaryComprehensionPassage =
          isComprehensionPassageItem &&
          text === String(currentQuestion.passage || "").trim();

        if (isPrimaryComprehensionPassage) {
          return (
            <ComprehensionPassageCard
              key={`${currentQuestion.id || "question"}-${text}`}
              text={text}
              currentQuestion={currentQuestion}
              speakText={speakText}
            />
          );
        }

        return (
          <div className="passage-wrap assessment-passage-card" key={text}>
            <p className="passage">{text}</p>
          </div>
        );
      })}
    </div>
  );
}

const LazyGuidedReadingPage = lazyWithRetry(() =>
  import("./guided-reading/GuidedReadingPage.jsx").then(module => ({
    default: module.GuidedReadingPage
  }))
);

function GuidedReadingLoadingFallback({ mode = "teacher" }) {
  if (mode === "student") {
    return <RouteLoadingFallback label="Loading Reading Library..." />;
  }

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
    <Suspense fallback={<GuidedReadingLoadingFallback mode={props.mode} />}>
      <LazyGuidedReadingPage {...props} />
    </Suspense>
  );
}
// THE CLASS REPORT.
//
// 2026-07-27: this is no longer a route of its own. It is what the Reports
// funnel shows when the answer to "whole class, or one student?" is the whole
// class, so the class picker and the "back to reports" button it used to carry
// have gone with the duplication - the funnel above it already asked.
function classReportSchoolYearStart(now = new Date()) {
  const current = now instanceof Date ? now : new Date(now);
  let cutoff = new Date(current.getFullYear(), 7, 1);
  if (current < cutoff) cutoff = new Date(current.getFullYear() - 1, 7, 1);
  return cutoff;
}

function shortReportDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(value);
}

function classReportPeriodLabel(dateRange = "last90", now = new Date()) {
  if (dateRange === "schoolYear") {
    return `Since ${shortReportDate(classReportSchoolYearStart(now))} (1 August school-year default)`;
  }
  return {
    last30: "Last 30 days",
    last90: "Last 90 days",
    all: "All time"
  }[dateRange] || dateRange;
}

function filterRowsForClassReportPeriod(rows = [], dateRange = "last90") {
  if (dateRange === "all") return rows;
  const now = new Date();
  let cutoff = null;

  if (dateRange === "schoolYear") {
    cutoff = classReportSchoolYearStart(now);
  } else {
    const days = { last30: 30, last90: 90 }[dateRange] || 90;
    cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
  }

  return rows.filter(record => {
    const completedAt = new Date(
      record.completedAt
      || record.completed_at
      || record.answeredAt
      || record.answered_at
      || record.date
      || 0
    );
    return Number.isFinite(completedAt.getTime()) && completedAt >= cutoff;
  });
}

// ── THE CLASS REPORT ON SCREEN ──────────────────────────────────────────────
//
// Two facts, kept apart on purpose. The split counts STUDENTS by learning
// status; the table below counts SKILLS and shows answer accuracy in its own
// column beside the class status. A percentage is never used as a status and a
// missing percentage is never printed as 0% — "Not enough results" and
// "Not checked" are their own named states in both places.

const CLASS_SPLIT_ORDER = Object.freeze([
  "needs_support",
  "developing",
  "on_track",
  "not_enough_evidence",
  "not_started"
]);

const CLASS_SKILL_STATUS_TONE = Object.freeze({
  needs_support: "needs-support",
  developing: "developing",
  mastered: "secure",
  not_enough_evidence: "not-enough",
  not_assessed: "not-checked"
});

function classAccuracyLabel(value) {
  const numeric = Number(value);
  return value !== null && value !== undefined && value !== "" && Number.isFinite(numeric)
    ? `${Math.round(numeric)}%`
    : "";
}

function ClassReportStatusSplit({ model }) {
  const distribution = Array.isArray(model?.snapshot?.statusDistribution)
    ? model.snapshot.statusDistribution
    : [];
  const byId = new Map(distribution.map(row => [row.statusId, row]));
  const cards = CLASS_SPLIT_ORDER
    .map(statusId => byId.get(statusId))
    .filter(Boolean);
  if (!cards.length) return null;
  return (
    <section className="teacher-class-report-split" aria-label="Class status split">
      {cards.map(card => (
        <article
          className={`teacher-class-report-split-card ${card.statusId}`}
          key={card.statusId}
        >
          <span className="teacher-class-report-split-label">{card.label}</span>
          <strong className="teacher-class-report-split-count">{card.count}</strong>
          <p className="teacher-class-report-split-note">
            {TEACHER_COPY.reports.classStatusNotes[card.statusId]}
          </p>
        </article>
      ))}
    </section>
  );
}

function ClassReportSkillsTable({ model, skillFilter = "", onClearSkillFilter }) {
  const rows = Array.isArray(model?.heatmap) ? model.heatmap : [];
  const totalStudents = Number(model?.snapshot?.totalStudents || 0);
  const filter = String(skillFilter || "").trim().toLowerCase();
  const visibleRows = filter
    ? rows.filter(row => (
      String(row.displaySkillName || "").toLowerCase() === filter
      || String(row.canonicalSkillName || "").toLowerCase() === filter
      || (row.rawSkillNames || []).some(name => String(name).toLowerCase() === filter)
    ))
    : rows;
  return (
    <section className="teacher-class-report-skills" aria-label="Skills with saved results">
      <div className="teacher-class-report-skills-head">
        <strong>{TEACHER_COPY.reports.skillsWithResults}</strong>
        <span>{TEACHER_COPY.reports.accuracySeparateNote}</span>
      </div>
      {skillFilter && (
        <div className="teacher-class-report-skills-filter">
          <span>Showing {skillFilter}</span>
          <button
            className="lp-button lp-button-secondary"
            onClick={onClearSkillFilter}
            type="button"
          >
            Show all skills
          </button>
        </div>
      )}
      {visibleRows.length === 0 ? (
        <p className="teacher-class-report-skills-empty">
          {skillFilter
            ? `No saved class results for ${skillFilter} yet.`
            : `${TEACHER_COPY.reports.noSavedResults}. Complete an assessment to fill this table.`}
        </p>
      ) : (
        <div className="teacher-class-report-skills-scroll">
          <table className="teacher-class-report-skills-table">
            <thead>
              <tr>
                <th scope="col">Skill</th>
                <th scope="col">Students assessed</th>
                <th scope="col">Answers</th>
                <th scope="col">Accuracy</th>
                <th scope="col">Class status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(row => {
                const accuracy = classAccuracyLabel(row.classAccuracy);
                return (
                  <tr key={row.canonicalSkillName || row.displaySkillName}>
                    <th scope="row">{row.displaySkillName}</th>
                    <td>
                      {TEACHER_COPY.reports.classSkillsAssessed(
                        row.attemptedLearnerCount,
                        totalStudents
                      )}
                    </td>
                    <td>{row.totalScoredResponses}</td>
                    <td className="teacher-class-report-accuracy">
                      {accuracy || (
                        <>
                          <span aria-hidden="true">—</span>
                          <small>{TEACHER_COPY.reports.classAccuracyUnavailable}</small>
                        </>
                      )}
                    </td>
                    <td>
                      <span
                        className={`teacher-class-report-pill ${
                          CLASS_SKILL_STATUS_TONE[row.classStatusId] || "not-checked"
                        }`}
                      >
                        {row.classStatusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="teacher-class-report-skills-footer">
        {TEACHER_COPY.reports.elBenchmarkFooter}
      </p>
    </section>
  );
}

export function TeacherReportsPage({
  allAssessmentHistory = [],
  allAnswerHistory = [],
  answerHistoryReadState = {
    status: "complete",
    complete: true,
    truncated: false,
    error: null
  },
  assessmentHistoryReadState = {
    status: "complete",
    complete: true,
    truncated: false,
    error: null
  },
  classList = [],
  loadingStudents = false,
  onRetryAnswerHistory,
  onRetryAssessmentHistory,
  onRetryStudents,
  onBack,
  selectedClassId = "",
  // A sound-map tile on the Dashboard opens this report scoped to one skill.
  // Nothing narrows unless a filter actually arrives.
  skillFilter = "",
  studentListReadState = null,
  students = [],
  teacherName = "",
  teacherId = "local",
  supabase = null
}) {
  const [dateRange, setDateRange] = useState("last90");
  const [activeSkillFilter, setActiveSkillFilter] = useState(skillFilter);
  const rosterRead = getStudentRosterReadView({
    readState: studentListReadState,
    classId: selectedClassId,
    legacyLoading: loadingStudents
  });
  const historyReady = assessmentHistoryReadState?.complete === true
    && assessmentHistoryReadState?.truncated !== true
    && !assessmentHistoryReadState?.error;
  const answersReady = answerHistoryReadState?.complete === true
    && answerHistoryReadState?.truncated !== true
    && !answerHistoryReadState?.error;
  const reportSourcesReady = historyReady && answersReady && rosterRead.complete;
  const reportSourcesLoading = ["idle", "loading"].includes(assessmentHistoryReadState?.status)
    || ["idle", "loading"].includes(answerHistoryReadState?.status)
    || rosterRead.loading;
  const reportSourceMessage = reportSourcesLoading
    ? "Loading the full class list and saved assessment results. Report figures, printing and new downloads are paused until this finishes."
    : "Some class or assessment results could not be confirmed. Report figures are hidden rather than treating missing information as zero; printing and new downloads are paused.";

  const [classSpreadsheetBusy, setClassSpreadsheetBusy] = useState(false);

  function retryReportSources() {
    if (!historyReady) onRetryAssessmentHistory?.();
    if (!answersReady) onRetryAnswerHistory?.(selectedClassId);
    if (!rosterRead.complete) onRetryStudents?.(selectedClassId);
  }

  // The class tab is about a whole class, so it filters the teacher's complete
  // record by date.
  const classAssessmentHistory = useMemo(
    () => filterRowsForClassReportPeriod(allAssessmentHistory, dateRange),
    [allAssessmentHistory, dateRange]
  );
  const classAnswerHistory = useMemo(
    () => filterRowsForClassReportPeriod(allAnswerHistory, dateRange),
    [allAnswerHistory, dateRange]
  );

  const effectiveSelectedClassId = selectedClassId || classList[0]?.id || "";
  const selectedDatePeriod = {
    key: dateRange,
    label: classReportPeriodLabel(dateRange)
  };
  const classReportingModel = useMemo(() =>
    buildClassReportModel({
      students,
      classes: classList,
      assessmentHistory: classAssessmentHistory,
      answerHistory: classAnswerHistory,
      classId: effectiveSelectedClassId,
      teacherName
    }),
  [
    students,
    classList,
    classAssessmentHistory,
    classAnswerHistory,
    effectiveSelectedClassId,
    teacherName
  ]);
  const classReportProvenanceOptions = useMemo(() => ({
    filters: {
      Class: classReportingModel.className,
      "Assessment period": selectedDatePeriod.label
    }
  }), [classReportingModel, selectedDatePeriod.label]);
  const reportTitle = classList.length === 0
    ? "No classes yet"
    : `${classReportingModel.className || "Class"} report`;

  /**
   * The class workbook.
   *
   * This used to write `class-report.csv` — a provenance preamble stapled to a
   * flat dump of every saved assessment attempt. That answered "what rows are in
   * the database". It did not answer "who do I see on Monday", which is the only
   * question a class report exists to answer.
   *
   * The raw attempt CSV is still available beside it for anyone who wants to
   * pivot the source rows themselves.
   */
  async function exportClassSpreadsheet() {
    if (!reportSourcesReady || typeof window === "undefined") return;
    if (classSpreadsheetBusy) return;
    setClassSpreadsheetBusy(true);
    try {
      const provenanceRows = buildExportProvenanceRows({
        reportTitle: "Class report",
        className: classReportingModel.className,
        learnerCount: Number(classReportingModel.snapshot?.totalStudents || 0),
        filters: `Class assessment period: ${selectedDatePeriod.label}`,
        evidenceSource: classAssessmentHistory,
        definitions: "Each Data row is one student-by-skill result inside the selected class assessment period."
      });
      // The SIMPLE class workbook: one sheet answering who needs you and what to
      // teach the group, plus the class grid to look things up in.
      //
      // exportClassReportWorkbook.js still builds the ten-sheet version — Cover,
      // Summary, Teach next, Students, Skills, Skill matrix, Tricky items, How
      // to read this, Data, About this report. Each sheet was defensible alone
      // and the total was not: a teacher had to work out which of ten tabs
      // answered the question they arrived with. Students are now ordered worst
      // first rather than by the register, because a register-ordered list of
      // thirty buries the three the report was opened for.
      const { exportSimpleClassReportExcel } = await import("../utils/exportClassReportSimple.js");
      await exportSimpleClassReportExcel({
        model: classReportingModel,
        periodLabel: selectedDatePeriod.label,
        generatedAt: new Date()
      });
    } catch (error) {
      console.error("Class report workbook export failed:", error);
    } finally {
      setClassSpreadsheetBusy(false);
    }
  }

  function exportClassAttemptRows() {
    if (!reportSourcesReady || typeof window === "undefined") return;
    const provenanceRows = buildExportProvenanceRows({
      reportTitle: "Class report — raw attempts",
      className: classReportingModel.className,
      learnerCount: Number(classReportingModel.snapshot?.totalStudents || 0),
      filters: `Class assessment period: ${selectedDatePeriod.label}`,
      evidenceSource: classAssessmentHistory,
      definitions: "Each row is one saved assessment attempt inside the selected class assessment period."
    });
    const csv = [
      exportProvenanceCsvPreamble(provenanceRows),
      "",
      exportAssessmentAttemptsCsv(classAssessmentHistory)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "class-report-attempts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="teacher-product-page teacher-class-report-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>{reportTitle}</h2>
          <p>The whole class in one place. Use Back to reports to choose one student instead.</p>
          {reportSourcesReady && (
            <p className="teacher-class-report-reconcile">
              {TEACHER_COPY.reports.classSplitReconcile(
                Number(classReportingModel.snapshot?.assessedStudents || 0),
                Number(classReportingModel.snapshot?.totalStudents || 0)
              )}
            </p>
          )}
        </div>
        <div className="class-report-header-actions">
          {onBack && (
            <button className="lp-button lp-button-secondary" onClick={onBack} type="button">
              Back to reports
            </button>
          )}
          <label className="report-filter-control">
            <span>Class assessment period</span>
            <select value={dateRange} onChange={event => setDateRange(event.target.value)}>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="schoolYear">
                Since {shortReportDate(classReportSchoolYearStart())}
              </option>
              <option value="all">All time</option>
            </select>
            {dateRange === "schoolYear" && (
              <small>
                The school-year view starts on 1 August because this school has no
                separate reporting-year start setting.
              </small>
            )}
          </label>
          <button
            className="lp-button lp-button-secondary"
            disabled={!reportSourcesReady || classSpreadsheetBusy}
            onClick={exportClassSpreadsheet}
            type="button"
          >
            {classSpreadsheetBusy ? "Building spreadsheet…" : "Export spreadsheet"}
          </button>
          <button
            className="lp-button lp-button-quiet"
            disabled={!reportSourcesReady}
            onClick={exportClassAttemptRows}
            title="The raw saved attempts, for your own pivot tables."
            type="button"
          >
            Export raw rows
          </button>
          <button
            className="lp-button lp-button-primary"
            disabled={!reportSourcesReady}
            onClick={() => printTeacherDocument(
              TEACHER_PRINT_TARGETS.CLASS,
              () => window.print()
            )}
            type="button"
          >
            Export PDF
          </button>
        </div>
      </section>

      <section className="class-report-workspace" aria-label="Class report">
        {!reportSourcesReady && (
          <TeacherSurfaceState
            surface="progress"
            state={reportSourcesLoading ? "loading" : "partial"}
            detail={reportSourceMessage}
            primaryLabel="Try loading the class report again"
            onPrimaryAction={
              !reportSourcesLoading
              && (onRetryAnswerHistory || onRetryAssessmentHistory || onRetryStudents)
                ? retryReportSources
                : undefined
            }
          />
        )}
        {reportSourcesReady && (
          <>
            <ClassReportStatusSplit model={classReportingModel} />
            <ClassReportSkillsTable
              model={classReportingModel}
              onClearSkillFilter={() => setActiveSkillFilter("")}
              skillFilter={activeSkillFilter}
            />
          </>
        )}
        <details className="class-report-formal-tools">
          <summary>
            <span>
              <strong>Formal EL reports and downloads</strong>
              <small>Grade and time-of-year reports, saved files and report history</small>
            </span>
          </summary>
          <Suspense fallback={<div className="teacher-report-card">Loading EL report tools…</div>}>
            <ElFormalAssessmentsPanel
              assessmentHistory={classAssessmentHistory}
              classes={classList}
              evidenceReady={reportSourcesReady}
              evidenceStatusMessage={reportSourceMessage}
              onRetryEvidence={reportSourcesLoading ? null : retryReportSources}
              onPrint={() => window.print()}
              reportPeriod={selectedDatePeriod}
              selectedClassId={effectiveSelectedClassId}
              students={students}
              supabase={supabase}
              teacherId={teacherId}
            />
          </Suspense>
        </details>
        <div className="class-report-print-document" aria-hidden="true">
          <Suspense fallback={null}>
            <ClassSummaryReportDocument
              model={classReportingModel}
              provenanceOptions={classReportProvenanceOptions}
            />
          </Suspense>
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
  returnToOverview,
  suggestedFocus = null,
  totalAnswered = 0
}) {
  if (!checkpoint) return null;

  const completedText =
    `${progressPhrase(checkpoint.correct, checkpoint.total)} ${checkpoint.skillLabel}`;
  const pathStatus = checkpoint.pathStatus || {
    level: checkpoint.initialSoundDebug?.level || 1,
    phase: 1,
    label: `Level ${checkpoint.initialSoundDebug?.level || 1} Phase 1`,
    nextActionLabel: "Continue next phase",
    finalStepComplete: false,
    nextSkillUnlocked: false,
    level2Optional: true
  };
  const canMoveNext = Boolean(
    checkpoint.passed &&
    pathStatus.nextSkillUnlocked &&
    checkpoint.nextSkillLabel
  );
  const completedLevelOne = Boolean(
    checkpoint.passed &&
    pathStatus.level === 1 &&
    pathStatus.phase === 2 &&
    pathStatus.nextSkillUnlocked
  );
  const completedLevelTwo = Boolean(
    checkpoint.passed &&
    pathStatus.level === 2 &&
    pathStatus.phase === 2
  );
  const isInitialSoundsCheckpoint = checkpoint?.skillId === "initial_sounds";
  const initialLevel = checkpoint.initialSoundDebug?.level || 1;
  const currentLevelMastered = pathStatus.level === 1
    ? Boolean(pathStatus.levelOnePassed)
    : Boolean(pathStatus.levelTwoPassed);
  const levelOneMastered = Boolean(pathStatus.levelOnePassed);
  const finalSoundsLevelOneMastered = Boolean(checkpoint.masteryDepth?.levelOneMastered);
  const primaryPassedLabel = completedLevelOne || completedLevelTwo || pathStatus.finalStepComplete
    ? `Move to next skill${checkpoint.nextSkillLabel ? `: ${checkpoint.nextSkillLabel}` : ""}`
    : pathStatus.nextActionLabel;
  const retryLabel = checkpoint.accuracyPassed
    ? `Continue ${pathStatus.label}`
    : `Retry ${pathStatus.label}`;

  return (
    <main className="assessment-shell checkpoint-decision-shell">
      <section className="card checkpoint-decision-card">
        <p className="panel-label">Assessment complete</p>
        <h2>You completed {completedText}.</h2>
        <div className="level-mastery-callout checkpoint-path-callout">
          <strong>{pathStatus.label}</strong>
          <p>
            {checkpoint.passed
              ? completedLevelOne
                ? "Both Level 1 phases are passed. Move to the next skill, or choose the optional harder Level 2 extension."
                : completedLevelTwo || pathStatus.finalStepComplete
                  ? "Both optional Level 2 phases are complete. The next formal step is the next skill."
                  : `Next formal step: ${pathStatus.nextActionLabel}.`
              : `Stay on ${pathStatus.label} until this phase is passed.`}
          </p>
        </div>

        {isInitialSoundsCheckpoint && (
          <div className="level-mastery-callout">
            <strong>
              {currentLevelMastered
                ? `Level ${initialLevel} passed`
                : `Level ${initialLevel} in progress`}
            </strong>
            <p>
              {currentLevelMastered && initialLevel === 1
                ? "The next skill is unlocked. Level 2 is available as an optional harder challenge."
                : levelOneMastered && initialLevel === 2
                  ? "Level 2 is using harder words after Level 1 mastery."
                  : "Pass both Level 1 phases at 70% to unlock the next skill."}
            </p>
          </div>
        )}

        <div className="checkpoint-result-grid">
          <div>
            <span>Accuracy</span>
            <strong>{checkpoint.accuracy}%</strong>
          </div>
          <div>
            <span>Assessment result</span>
            <strong>{checkpoint.passed ? "Passed" : "Needs another try"}</strong>
          </div>
          <div>
            <span>Skills assessed</span>
            <strong>
              {progressPhrase(checkpoint.coverage.mastered, checkpoint.coverage.total)} {checkpoint.coverage.unit} covered
            </strong>
          </div>
          {checkpoint.masteryDepth && (
            <div>
              <span>Secure progress</span>
              <strong>
                {progressPhrase(checkpoint.masteryDepth.mastered, checkpoint.masteryDepth.total)} mastered
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
            <h3>Correct this time</h3>
            {checkpoint.coveredThisRound.length > 0 ? (
              <div className="word-chip-row">
                {checkpoint.coveredThisRound.map(item => (
                  <span className="word-chip mastered" key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">No correct words were recorded for this round.</p>
            )}
          </section>

          <section>
            <h3>Words to practise</h3>
            {checkpoint.missedThisRound?.length > 0 ? (
              <div className="word-chip-row">
                {checkpoint.missedThisRound.map(item => (
                  <span className="word-chip" key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted-text">No missed words this round.</p>
            )}
          </section>

          {checkpoint.initialSoundDebug && (
            <section>
              <h3>Initial sounds details</h3>
              <p className="muted-text">
                Level {checkpoint.initialSoundDebug.level}, step {checkpoint.initialSoundDebug.phase || "review"}.
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
                  <strong>Unavailable items</strong>
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
              <h3>{checkpoint.masteryDepth.label} secure progress</h3>
              <p className="muted-text">
                Successful assessments so far: {checkpoint.masteryDepth.successfulRounds}.
                {finalSoundsLevelOneMastered
                  ? " Level 1 depth is complete. Level 2 is unlocked."
                  : " Level 2 stays locked until every Level 1 sound has enough correct examples."}
              </p>
              <div className="word-chip-row">
                {Object.values(checkpoint.masteryDepth.bySound || {}).map(row => (
                  <span className={row.mastered ? "word-chip mastered" : "word-chip"} key={row.target}>
                    {row.target}: {row.correctCount} correct, {row.uniqueCorrectTargetWords.length} different words
                  </span>
                ))}
              </div>
              {checkpoint.masteryDepth.contentGaps?.length > 0 && (
                <>
                  <strong>More word examples needed</strong>
                  <div className="word-chip-row">
                    {checkpoint.masteryDepth.contentGaps.map(gap => (
                      <span className="word-chip" key={gap.target}>
                        {gap.target}: {gap.availableWordCount} usable {gap.availableWordCount === 1 ? "word" : "words"} available
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
                disabled={(completedLevelOne || completedLevelTwo || pathStatus.finalStepComplete) && !canMoveNext}
                onClick={completedLevelOne || completedLevelTwo || pathStatus.finalStepComplete ? moveToNextSkill : continueSkill}
                type="button"
              >
                {primaryPassedLabel}
              </button>

              {isInitialSoundsCheckpoint && levelOneMastered && (
                <button className="report-button" onClick={reviewInitialSoundLevelOne} type="button">
                  Review Level 1
                </button>
              )}

              {completedLevelOne && (
                <button
                  className="report-button"
                  onClick={continueSkill}
                  type="button"
                >
                  Try optional Level 2 Phase 1
                </button>
              )}

              {!completedLevelOne && !completedLevelTwo && pathStatus.level === 2 && canMoveNext && (
                <button
                  className="report-button"
                  onClick={moveToNextSkill}
                  type="button"
                >
                  Move to next skill{checkpoint.nextSkillLabel ? `: ${checkpoint.nextSkillLabel}` : ""}
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

              {suggestedFocus && (
                <TeacherRecommendationExplanation
                  surface="targeted-review"
                  explanation={{
                    evidence: `${countPhrase(suggestedFocus.incorrect || 0, "incorrect answer")} point to ${suggestedFocus.target} as the clearest current practice need.`,
                    dependency: `${suggestedFocus.target} sits within ${suggestedFocus.stage} and should be assessed before advancing related skills.`,
                    confidence: `${countPhrase(totalAnswered, "scored answer")} ${totalAnswered === 1 ? "is" : "are"} available. The suggestion puts the most frequent errors first, and you can change it.`,
                    unlock: "A focused review can confirm the need, update the result, and show whether to re-teach or move on."
                  }}
                />
              )}
            </>
          )}

          <button className="report-button" onClick={returnToOverview} type="button">
            Return to student overview
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
        <strong>
          <MetricFigure metricId="current-skill">
            {currentSkillIndex + 1}/{skillTree.length}
          </MetricFigure>
        </strong>
      </div>

      <div className="dash-card wide-card">
        <span>Focus</span>
        <strong>{currentStage.label}</strong>
      </div>

      <div className="dash-card">
        <span>Round</span>
        <strong>
          <MetricFigure metricId="round">
            {roundCorrect}/{roundLength}
          </MetricFigure>
        </strong>
      </div>

      {/* This tile counts answers given in this browser session only. It is a
          different number from the accuracy in a saved report, so it is named
          differently and says so in its own definition. */}
      <div className="dash-card">
        <span>Session accuracy</span>
        <strong>
          <MetricFigure
            metricId="accuracy"
            label="Session accuracy"
            counts="Correct answers out of the answers given since this page was opened."
            timeWindow="This sitting on this device only. It starts again at zero when the page is reloaded."
            excludes="Everything saved before this sitting, and anything answered on another device. It will not match the accuracy in a saved report."
          >
            {accuracy}%
          </MetricFigure>
        </strong>
      </div>
    </div>
  );
}

const MANUAL_OUTCOME_CHOICES = [
  { value: "correct", label: "Yes", tone: "yes" },
  { value: "incorrect", label: "No", tone: "no" },
  { value: "not_administered", label: "Not checked", tone: "skip" }
];

// Green yes / red no marking, one tap per field. Restores the pre-dropdown
// current interaction; the recorded values are unchanged
// ("correct" | "incorrect" | "not_administered").
function ManualOutcomeChoice({ groupId, label, value, disabled, onChange }) {
  return (
    <div className="assessment-outcome-choice" role="group" aria-labelledby={`${groupId}-label`}>
      <span className="assessment-outcome-label" id={`${groupId}-label`}>{label}</span>

      <div className="assessment-outcome-buttons">
        {MANUAL_OUTCOME_CHOICES.map(choice => {
          const pressed = value === choice.value;
          return (
            <button
              key={choice.value}
              aria-pressed={pressed}
              className={`assessment-outcome-button outcome-${choice.tone}${pressed ? " active" : ""}`}
              disabled={disabled}
              onClick={() => onChange(choice.value)}
              type="button"
            >
              {choice.label}
            </button>
          );
        })}
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
  onPrevious,
  patternAssessment,
  resetPatternAssessment,
  returnToTeacherDashboard
}) {
  const [soundOutcome, setSoundOutcome] = useState("");
  const [wordOutcome, setWordOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const saved = patternAssessment[patternIndex];
    setSoundOutcome(saved?.soundOutcome || "");
    setWordOutcome(saved?.wordOutcome || "");
    setSaving(false);
    setSaveError("");
  }, [patternAssessment, patternIndex]);

  const currentPattern = patternItems[patternIndex];

  return (
    <main className="assessment-shell letter-focus-shell">
      {patternIndex < patternItems.length ? (
        <>
          <div className="assessment-topbar letter-topbar">
            <div className="assessment-meta">
              <span>{studentName || "Unnamed student"}</span>
              <h1>Phonics pattern assessment</h1>
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

            <button
              className="reset-button assessment-end-button"
              disabled={saving}
              title="Saves the results entered so far. If the full assessment is unfinished, you can resume it later."
              onClick={async () => {
                setSaving(true);
                setSaveError("");
                try {
                  const saved = await endAssessment(soundOutcome, wordOutcome);
                  if (saved === false) {
                    setSaveError("We couldn't save this assessment. Your choices are still here. Try again.");
                  }
                } catch (error) {
                  console.warn("Could not save and exit the phonics pattern assessment.", error);
                  setSaveError("We couldn't save this assessment. Your choices are still here. Try again.");
                } finally {
                  setSaving(false);
                }
              }}
              type="button"
            >
              {saving ? "Saving…" : "Save & exit"}
            </button>
          </div>

          <section className="card letter-focus-card pattern-focus-card">
            <div className="letter-task-instruction">
              <h2>Show the pattern and example word</h2>
              <p>Ask which sound the pattern makes, then ask the student to read the word.</p>
            </div>
            <div className="pattern-display">
              {currentPattern.pattern}
            </div>

            <div className="pattern-example">
              {currentPattern.exampleWord}
            </div>
          </section>

          <div className="letter-action-panel pattern-action-panel">
            <ManualOutcomeChoice
              disabled={saving}
              groupId="pattern-sound-outcome"
              label="Pattern sound"
              onChange={nextValue => {
                setSoundOutcome(nextValue);
                setSaveError("");
              }}
              value={soundOutcome}
            />

            <ManualOutcomeChoice
              disabled={saving}
              groupId="example-word-outcome"
              label="Example word"
              onChange={nextValue => {
                setWordOutcome(nextValue);
                setSaveError("");
              }}
              value={wordOutcome}
            />

            <div className="assessment-step-navigation">
              <button
                className="reset-button letter-previous-button"
                disabled={patternIndex === 0 || saving}
                onClick={onPrevious}
                type="button"
              >
                ← Previous pattern
              </button>
              <button
                className="main-button letter-next-button"
                disabled={!soundOutcome || !wordOutcome || saving}
                onClick={async () => {
                setSaving(true);
                setSaveError("");
                try {
                  const saved = await recordPatternResult(soundOutcome, wordOutcome);
                  if (saved === false) {
                    setSaveError("We couldn't save this result. Your choices are still here. Try again.");
                  }
                } catch (error) {
                  console.warn("Could not save the phonics pattern result.", error);
                  setSaveError("We couldn't save this result. Your choices are still here. Try again.");
                } finally {
                  setSaving(false);
                }
              }}
                type="button"
              >
                {saving
                  ? "Saving…"
                  : patternIndex === patternItems.length - 1
                    ? "Finish and save"
                    : "Next pattern"}
              </button>
            </div>
            {saveError && (
              <p className="teacher-inline-error" role="alert">{saveError}</p>
            )}
          </div>
        </>
      ) : (
        <section className="card letter-complete-card page-stack">
          <h2>Assessment complete</h2>

          <p>
            Pattern sounds correct:
            {" "}
            {progressPhrase(
              patternAssessment.filter(x => x.soundCorrect).length,
              patternAssessment.filter(x => x.soundOutcome !== "not_administered").length
            )}
          </p>

          <p>
            Example words correct:
            {" "}
            {progressPhrase(
              patternAssessment.filter(x => x.wordCorrect).length,
              patternAssessment.filter(x => x.wordOutcome !== "not_administered").length
            )}
          </p>
          <p>
            Not checked:
            {" "}
            {patternAssessment.filter(x => (
              x.soundOutcome === "not_administered" || x.wordOutcome === "not_administered"
            )).length}
          </p>

          <div className="button-row">
            <button
              className="reset-button"
              onClick={resetPatternAssessment}
            >
              Restart pattern assessment
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
  onPrevious,
  letterAssessment,
  resetLetterAssessment,
  returnToTeacherDashboard
}) {
  const [nameOutcome, setNameOutcome] = useState("");
  const [soundOutcome, setSoundOutcome] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const saved = letterAssessment[letterIndex];
    setNameOutcome(saved?.nameOutcome || "");
    setSoundOutcome(saved?.soundOutcome || "");
    setSaving(false);
    setSaveError("");
  }, [letterAssessment, letterIndex]);

  const currentLetter = letterItems[letterIndex];

  return (
    <main className="assessment-shell letter-focus-shell">
      {letterIndex < letterItems.length ? (
        <>
          <div className="assessment-topbar letter-topbar">
            <div className="assessment-meta">
              <span>{studentName || "Unnamed student"}</span>
              <h1>Letter name and sound assessment</h1>
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

            <button
              className="reset-button assessment-end-button"
              disabled={saving}
              title="Saves the results entered so far. If the full assessment is unfinished, you can resume it later."
              onClick={async () => {
                setSaving(true);
                setSaveError("");
                try {
                  const saved = await endAssessment(nameOutcome, soundOutcome);
                  if (saved === false) {
                    setSaveError("We couldn't save this assessment. Your choices are still here. Try again.");
                  }
                } catch (error) {
                  console.warn("Could not save and exit the letter assessment.", error);
                  setSaveError("We couldn't save this assessment. Your choices are still here. Try again.");
                } finally {
                  setSaving(false);
                }
              }}
              type="button"
            >
              {saving ? "Saving…" : "Save & exit"}
            </button>
          </div>

          <section className="card letter-focus-card">
            <div className="letter-task-instruction">
              <h2>Show this letter to the student</h2>
              <p>Ask for the letter name and the sound it makes.</p>
            </div>
            <div className="letter-display">
              {currentLetter.display}
            </div>
          </section>

          <div className="letter-action-panel">
            <ManualOutcomeChoice
              disabled={saving}
              groupId="letter-name-outcome"
              label="Letter name"
              onChange={nextValue => {
                setNameOutcome(nextValue);
                setSaveError("");
              }}
              value={nameOutcome}
            />

            <ManualOutcomeChoice
              disabled={saving}
              groupId="letter-sound-outcome"
              label="Letter sound"
              onChange={nextValue => {
                setSoundOutcome(nextValue);
                setSaveError("");
              }}
              value={soundOutcome}
            />

            <div className="assessment-step-navigation">
              <button
                className="reset-button letter-previous-button"
                disabled={letterIndex === 0 || saving}
                onClick={onPrevious}
                type="button"
              >
                ← Previous letter
              </button>
              <button
                className="main-button letter-next-button"
                disabled={!nameOutcome || !soundOutcome || saving}
                onClick={async () => {
                setSaving(true);
                setSaveError("");
                try {
                  const saved = await recordLetterResult(nameOutcome, soundOutcome);
                  if (saved === false) {
                    setSaveError("We couldn't save this result. Your choices are still here. Try again.");
                  }
                } catch (error) {
                  console.warn("Could not save the letter result.", error);
                  setSaveError("We couldn't save this result. Your choices are still here. Try again.");
                } finally {
                  setSaving(false);
                }
              }}
                type="button"
              >
                {saving
                  ? "Saving…"
                  : letterIndex === letterItems.length - 1
                    ? "Finish and save"
                    : "Next letter"}
              </button>
            </div>
            {saveError && (
              <p className="teacher-inline-error" role="alert">{saveError}</p>
            )}
          </div>
        </>
      ) : (
        <section className="card letter-complete-card page-stack">
          <h2>Assessment complete</h2>

          <p>
            Letter names known:
            {" "}
            {progressPhrase(
              letterAssessment.filter(x => x.knowsName).length,
              letterAssessment.filter(x => x.nameOutcome !== "not_administered").length
            )}
          </p>

          <p>
            Letter sounds known:
            {" "}
            {progressPhrase(
              letterAssessment.filter(x => x.knowsSound).length,
              letterAssessment.filter(x => x.soundOutcome !== "not_administered").length
            )}
          </p>
          <p>
            Items not assessed:
            {" "}
            {letterAssessment.filter(x => (
              x.nameOutcome === "not_administered" || x.soundOutcome === "not_administered"
            )).length}
          </p>

          <div className="button-row">
            <button
              className="reset-button"
              onClick={resetLetterAssessment}
            >
              Restart letter assessment
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
  reviseLastAnswer,
  speakText,
  message,
  endAssessment,
  returnToStudentOverview,
  assessmentMode,
  isAssessmentTransitioning = false,
  assessmentFullscreen = false,
  toggleAssessmentFullscreen = null,
  onEvidenceImageError = null,
  skillTree = [],
  onChangeSkillLevel = null,
  studentId = "",
  studentSessionToken = "",
  supabase = null
}) {
  const hasCurrentQuestion = Boolean(currentQuestion);
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
  const feedbackAdvanceRef = useRef({ pickQuestion, setFeedback });

  useEffect(() => {
    feedbackAdvanceRef.current = { pickQuestion, setFeedback };
  }, [pickQuestion, setFeedback]);

  useEffect(() => {
    if (!feedback) return undefined;
    const delay = feedback.isCorrect ? 1800 : 3200;
    const timer = window.setTimeout(() => {
      const actions = feedbackAdvanceRef.current;
      actions.setFeedback(null);
      actions.pickQuestion();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const isListenAndFindWord =
    hasCurrentQuestion && (
      currentQuestion?.questionType === "listen_and_find_word" ||
      isHfwAudioFindWordQuestion(currentQuestion)
    );
  const isPairSelection =
    hasCurrentQuestion && ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(currentQuestion?.questionType);
  const isVisualCardChoice =
    hasCurrentQuestion &&
    (currentQuestion?.questionType === "visual_card_choice" || isRhymingPictureQuestion(currentQuestion)) &&
    !isGraphemeChoiceQuestion(currentQuestion);
  const isPictureSequenceItem =
    hasCurrentQuestion && currentQuestion?.questionType === "picture_sequence_order";
  const isIxlStyleTemplate =
    hasCurrentQuestion && (
      currentQuestion?.questionType === "ixl_template" ||
      isHfwLetterBuildQuestion(currentQuestion)
    );
  const isFinalSoundsEndingItem = hasCurrentQuestion && isFinalSoundsEndingQuestion(currentQuestion);
  const isGraphemeChoiceItem = hasCurrentQuestion && isGraphemeChoiceQuestion(currentQuestion);
  const isRhymingPictureItem = hasCurrentQuestion && isRhymingPictureQuestion(currentQuestion);
  const isShortVowelWordChoiceItem = hasCurrentQuestion && isShortVowelWordChoiceQuestion(currentQuestion);
  const isListenChooseVowelItem = hasCurrentQuestion && isListenChooseVowelQuestion(currentQuestion);
  const isGrammarSentenceFitItem = hasCurrentQuestion && isGrammarSentenceFitQuestion(currentQuestion);
  const isComprehensionPassageItem = hasCurrentQuestion && isComprehensionPassageQuestion(currentQuestion);
  const isHfwSkillItem = hasCurrentQuestion && String(safeSkillId || "").toLowerCase().startsWith("hfw_");
  const assessmentShellClassName = [
    "assessment-shell",
    assessmentFullscreen ? "fullscreen" : ""
  ].filter(Boolean).join(" ");
  const renderAssessmentTopbar = () => (
    <div className="assessment-topbar">
      <div className="assessment-meta">
        <span>{studentName || "Unnamed student"}</span>
        <strong>
          {assessmentMode === "targetedReview"
            ? "Targeted Review"
            : `${currentSkillIndex + 1}. ${safeCurrentStage.label}`}
        </strong>
        {currentQuestion && (
          <span className="assessment-question-level">
            Question level {Number(currentQuestion.level || currentQuestion.difficulty || 1) >= 2 ? 2 : 1}
          </span>
        )}
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

        <div
          className="assessment-progress-dots"
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuemin="1"
          aria-valuemax={roundLength}
          aria-valuenow={Math.min(roundAnswers.length + 1, roundLength)}
          aria-valuetext={`Question ${Math.min(roundAnswers.length + 1, roundLength)} of ${roundLength}`}
        >
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

      <div className="assessment-topbar-actions">
        {/* The level picker used to live on a separate screen the teacher had to
            back out to. It belongs where the check is: choosing a level here
            restarts the round at that level. */}
        {onChangeSkillLevel && skillTree.length > 0 && assessmentMode !== "targetedReview" && (
          <label className="assessment-skill-level">
            <span>Skill</span>
            <select
              value={currentSkillIndex}
              onChange={event => onChangeSkillLevel(Number(event.target.value))}
              aria-label="Change the skill for this assessment"
            >
              {skillTree.map((stage, index) => (
                <option key={stage.id} value={index}>
                  {index + 1}. {stage.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {toggleAssessmentFullscreen && (
          <button
            className={[
              "report-button",
              "assessment-fullscreen-button",
              assessmentFullscreen ? "active" : ""
            ].filter(Boolean).join(" ")}
            onClick={toggleAssessmentFullscreen}
            type="button"
            aria-label={assessmentFullscreen ? "Exit full screen" : "Enter full screen"}
            title={assessmentFullscreen ? "Exit full screen" : "Full screen"}
          >
            {/* 2026-07-27: these were the literal strings "[]" and "X". The button
                rendered a visible "[] Full screen" to teachers mid-assessment. The Learn
                area (src/App.jsx) already had the correct corner-bracket and close icons
                as inline SVG; this is the same pair rather than a new drawing. */}
            {assessmentFullscreen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M8 8l8 8M16 8l-8 8" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
              </svg>
            )}
            <span>{assessmentFullscreen ? "Exit" : "Full screen"}</span>
          </button>
        )}

        <button className="reset-button assessment-end-button" onClick={endAssessment} type="button">
          End assessment
        </button>
      </div>
    </div>
  );
  const renderAssessmentLoadingCard = ({ title = "Getting the assessment ready...", actionLabel = "" } = {}) => (
    <div className="card assessment-card assessment-loading-card">
      <div className="assessment-loading-mark" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <h2>{title}</h2>
      {message && <p className="message">{message}</p>}
      {actionLabel && (
        <div className="button-row assessment-start-row">
          <button className="main-button" onClick={pickQuestion} type="button">
            {actionLabel}
          </button>
          <button className="report-button" onClick={assessmentExit} type="button">
            Return to student overview
          </button>
        </div>
      )}
    </div>
  );
  const renderFeedbackCard = () => feedback ? (
    <motion.div
      className={[
        "feedback-card assessment-feedback",
        feedback.isCorrect ? "correct-feedback" : "wrong-feedback",
        feedback.skillId === "final_sounds" ? "final-sounds-feedback" : ""
      ].filter(Boolean).join(" ")}
      role="status"
      aria-live="assertive"
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h2>{feedback.isCorrect ? "Correct" : "Incorrect"}</h2>
      <p>{feedback.explanation}</p>
      <p className="feedback-auto-advance">Next question…</p>
    </motion.div>
  ) : null;

  const hasValidAssessmentTransitionState =
    Boolean(feedback) ||
    Boolean(isAssessmentTransitioning);
  const shouldShowAssessmentLoadingState =
    !currentQuestion && !hasValidAssessmentTransitionState;

  if (shouldShowAssessmentLoadingState) {
    return (
      <main className={assessmentShellClassName}>
        {renderAssessmentLoadingCard({
          actionLabel: roundAnswers.length === 0 ? "Start Skill Round" : "Next Question"
        })}
      </main>
    );
  }

  if (!currentQuestion && feedback) {
    return (
      <main className={assessmentShellClassName}>
        {renderAssessmentTopbar()}
        {renderFeedbackCard()}
      </main>
    );
  }

  if (!currentQuestion && isAssessmentTransitioning) {
    return (
      <main className={assessmentShellClassName}>
        {renderAssessmentTopbar()}
        {renderAssessmentLoadingCard({ title: "Next question is getting ready..." })}
      </main>
    );
  }

  if (currentQuestion && !safeSkillId) {
    console.error("Assessment missing skillId", {
      currentQuestion,
      currentStage
    });

    return (
      <main className={assessmentShellClassName}>
        <div className="card assessment-card">
          <h2>This assessment needs a quick fix.</h2>
          <p>Please return and try again.</p>
          <button className="main-button" onClick={assessmentExit} type="button">
            Return to student overview
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
  const promptAudioText =
    currentQuestion?.spokenPrompt ||
    visiblePrompt ||
    currentQuestion?.audioText ||
    "";
  const promptAudioPath = getApprovedAudioPath(
    promptAudioText,
    currentQuestion?.promptAudioPath
      || currentQuestion?.instructionAudioPath
      || ""
  );
  const rawPromptAudioPath = currentQuestion?.promptAudioPath
    || currentQuestion?.instructionAudioPath
    || "";
  const normalizedChoices = (currentQuestion?.choices || []).map(choice => ({
    ...normalizeAnswerOption(choice),
    media: getAnswerOptionMedia(choice)
  }));
  const getChoiceAudioText = choice =>
    isListenChooseVowelItem && /^[aeiou]$/i.test(choice.label)
      ? choice.label.toLowerCase()
      : choice.label;
  const textChoiceAudioPaths = Object.fromEntries(
    normalizedChoices.map(choice => [
      choice.value,
      isListenChooseVowelItem || isGraphemeChoiceItem
        ? getPhonemeAudioPath(getChoiceAudioText(choice), choice.media.audio || "")
        : getApprovedAudioPath(getChoiceAudioText(choice), choice.media.audio || "")
    ])
  );
  const showTextChoiceAudio =
    !isPairSelection &&
    !isVisualCardChoice &&
    !isIxlStyleTemplate &&
    normalizedChoices.length > 0;

  return (
    <main className={assessmentShellClassName}>
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
              isListenChooseVowelItem ? "short-vowel-listen-choice-card" : "",
              isComprehensionPassageItem ? "comprehension-assessment-layout" : ""
            ].filter(Boolean).join(" ")}
            key={currentQuestion.id}
            data-assessment-question-id={currentQuestion.id}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.96 }}
          >
            <div className="question-line assessment-prompt">
              <AssessmentAudioButton
                text={promptAudioText}
                audioPath={promptAudioPath || rawPromptAudioPath}
                speakText={speakText}
                label="Listen to question"
                className={isPairSelection ? "mini-audio-button instruction-audio-button" : "mini-audio-button"}
                showDisabled
              />
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
              onEvidenceImageError={onEvidenceImageError}
            />

            {isPictureSequenceItem ? (
              <PictureSequenceOrderQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
                onEvidenceImageError={onEvidenceImageError}
              />
            ) : isPairSelection ? (
              <PairSelectionQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
                onEvidenceImageError={onEvidenceImageError}
              />
            ) : isVisualCardChoice ? (
              <VisualCardChoiceQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
                onEvidenceImageError={onEvidenceImageError}
              />
            ) : isIxlStyleTemplate ? (
              <IxlStyleTemplateQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
                onEvidenceImageError={onEvidenceImageError}
              />
            ) : currentQuestion.questionType === "fix_sentence" ? (
              <FixSentenceQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
                speakText={speakText}
              />
            ) : (
              <div className={[
                isComprehensionPassageItem
                  ? "choices comprehension-choice-list"
                  : isListenAndFindWord && !isShortVowelWordChoiceItem ? "choices visual-word-choices assessment-answer-grid" : "choices assessment-answer-grid",
                isShortVowelWordChoiceItem ? "short-vowel-word-choice-grid" : "",
                isListenChooseVowelItem ? "vowel-choice-grid" : "",
                isGraphemeChoiceItem ? "grapheme-choice-grid final-sounds-grapheme-grid" : ""
              ].filter(Boolean).join(" ")}>
                {normalizedChoices.map((choice, index) => {
                  const choiceImage = currentQuestion.choiceImages?.[choice.value] || currentQuestion.choiceImages?.[choice.label] || {};
                  const choiceButtonClassName = [
                    isListenAndFindWord && !isShortVowelWordChoiceItem ? "choice-button visual-word-choice assessment-answer-card" : "choice-button assessment-answer-card",
                    isComprehensionPassageItem ? "comprehension-choice-button" : "",
                    isShortVowelWordChoiceItem ? "short-vowel-word-choice-button" : "",
                    isGraphemeChoiceItem ? "grapheme-choice-button final-sound-choice-button final-sound-grapheme-option" : ""
                  ].filter(Boolean).join(" ");

                  return (
                  <div
                    className={[
                      isListenAndFindWord && !isShortVowelWordChoiceItem ? "choice-wrap visual-word-choice-wrap" : "choice-wrap",
                      isComprehensionPassageItem ? "comprehension-choice-wrap" : ""
                    ].filter(Boolean).join(" ")}
                    key={index}
                  >
                    {showTextChoiceAudio && (
                      <AssessmentAudioButton
                        text={getChoiceAudioText(choice)}
                        audioPath={textChoiceAudioPaths[choice.value]}
                        speakText={speakText}
                        label={`Listen to ${choice.label}`}
                        className="choice-audio"
                        showDisabled
                      />
                    )}
                    <button
                      className={choiceButtonClassName}
                      onClick={() => answerQuestion(choice.value)}
                      type="button"
                    >
                      {isListenAndFindWord && !isShortVowelWordChoiceItem && !isGraphemeChoiceItem && choiceImage.image && (
                        <AssessmentEvidenceImage
                          src={choiceImage.image}
                          alt={choiceImage.alt}
                          label={choice.label}
                          role="choice"
                          currentQuestion={currentQuestion}
                          onEvidenceImageError={onEvidenceImageError}
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
            <QuestionFlagControls
              currentQuestion={currentQuestion}
              currentStage={safeCurrentStage}
              studentId={studentId}
              studentSessionToken={studentSessionToken}
              supabase={supabase}
              visiblePrompt={visiblePrompt}
            />
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
