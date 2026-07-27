/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "../styles/assessment.css";
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
import { buildClassReportModel } from "../data/reportingSystem.js";
import { getFinalSoundsLevel1QuestionIssues } from "../data/earlyPhonicsValidation.js";
import { getTargetObjectImage } from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { isHfwSpellingQuestion } from "../data/isHfwSpellingQuestion.js";
import { addQuestionFlag } from "../data/questionFlagStore.js";
import { AssessmentAudioButton } from "./assessment/AssessmentAudioButton.jsx";
import { HfwLetterBuildPanel } from "./assessment/HfwLetterBuildPanel.jsx";
import { MetricFigure } from "./MetricDefinition.jsx";
import { RouteLoadingFallback } from "./RouteLoadingFallback.jsx";
import { TeacherRecommendationExplanation } from "./recommendations/RecommendationExplanation.jsx";
import {
  getAssessmentDecorativeMediaProps,
  getAssessmentEvidenceAccessibleName,
  getAssessmentMainImageLabel
} from "../policy/assessmentMediaEvidence.js";
import { lazyWithRetry } from "../utils/lazyWithRetry.js";
import { countPhrase, progressPhrase } from "../copy/teacherCopy.js";

export { AuthPage } from "./AuthPage.jsx";

const EL_BENCHMARK_ASSESSMENT_IDS = new Set([
  "el_phonological_awareness",
  "el_encoding",
  "el_decoding",
  "el_oral_reading_fluency"
]);

const FormalClassReportDocument = lazyWithRetry(() =>
  import("./AdminDashboardPage.jsx").then(module => ({
    default: module.FormalClassReportDocument
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

function getApprovedAudioPath(_text = "", audioPath = "") {
  return audioPath || "";
}

const SHORT_VOWEL_AUDIO_PATHS = {
  a: "/audio/student-mode/clean-human/graphemes/short_vowels/short_a.mp3",
  e: "/audio/student-mode/clean-human/graphemes/short_vowels/short_e.mp3",
  i: "/audio/student-mode/clean-human/graphemes/short_vowels/short_i.mp3",
  o: "/audio/student-mode/clean-human/graphemes/short_vowels/short_o.mp3",
  u: "/audio/student-mode/clean-human/graphemes/short_vowels/short_u.mp3"
};

const CONSONANT_AUDIO_PATHS = Object.fromEntries(
  "bcdfghjklmnpqrstvwxyz".split("").map(letter => [
    letter,
    `/audio/student-mode/clean-human/graphemes/consonants/${letter}.mp3`
  ])
);

function getShortVowelLetter(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .match(/^(?:short[_\s-]*)?([aeiou])$/)?.[1] || "";
}

function getPhonemeAudioPath(value = "", fallbackPath = "") {
  const shortVowel = getShortVowelLetter(value);
  if (shortVowel) return SHORT_VOWEL_AUDIO_PATHS[shortVowel] || fallbackPath || "";

  const normalized = String(value || "").trim().toLowerCase();
  if (CONSONANT_AUDIO_PATHS[normalized]) return CONSONANT_AUDIO_PATHS[normalized];
  if (/^(ch|ck|ff|ft|ll|mp|nd|ng|ph|sh|sk|ss|st|th|wh)$/.test(normalized)) {
    return `/audio/student-mode/clean-human/graphemes/digraphs_blends/${normalized}.mp3`;
  }

  return fallbackPath || "";
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

function ComprehensionPassageCard({ text, currentQuestion }) {
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
    normalizedAnswerOptions.length === 3 ? "three-options" : "",
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

function QuestionFlagControls({ currentQuestion, currentStage, visiblePrompt }) {
  const [flaggedTypes, setFlaggedTypes] = useState(() => new Set());

  useEffect(() => {
    setFlaggedTypes(new Set());
  }, [currentQuestion?.id]);

  function flag(type) {
    addQuestionFlag({
      flagType: type,
      question: currentQuestion,
      stage: currentStage,
      visiblePrompt
    });
    setFlaggedTypes(previous => new Set([...previous, type]));
  }

  if (!currentQuestion) return null;

  return (
    <div className="question-flag-controls" aria-label="Flag this question for review">
      {[
        ["image", "Flag image"],
        ["question", "Flag question"]
      ].map(([type, label]) => (
        <label key={type}>
          <input
            checked={flaggedTypes.has(type)}
            onChange={event => {
              if (event.target.checked) flag(type);
            }}
            type="checkbox"
          />
          <span>{flaggedTypes.has(type) ? `${label} sent` : label}</span>
        </label>
      ))}
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
  const hasMainImage = isListenChooseVowel || isShortVowelWordChoice
    ? false
    : isComprehensionPassageItem
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
// This page used to open on a second student-report picker that duplicated the
// one on Reports and needed a student selected somewhere else to work at all.
// Per-student reports now open from the Student panel, so this page is what its
// route already said it was: the class report.
export function TeacherReportsPage({
  allAssessmentHistory = [],
  classList = [],
  selectedClassId = "",
  setSelectedClassId,
  students = [],
  teacherName = "",
  teacherId = "local",
  supabase = null,
  onBackToReports = null
}) {
  const [dateRange, setDateRange] = useState("last90");

  // The class tab is about a whole class, so it filters the teacher's complete
  // record by date.
  const classAssessmentHistory = useMemo(() => {
    if (dateRange === "all") return allAssessmentHistory;
    const now = new Date();
    let cutoff = null;

    if (dateRange === "schoolYear") {
      cutoff = new Date(now.getFullYear(), 7, 1);
      if (now < cutoff) cutoff = new Date(now.getFullYear() - 1, 7, 1);
    } else {
      const days = { last30: 30, last90: 90 }[dateRange] || 90;
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
    }

    return allAssessmentHistory.filter(record => {
      const completedAt = new Date(record.completedAt || record.date || 0);
      return Number.isFinite(completedAt.getTime()) && completedAt >= cutoff;
    });
  }, [allAssessmentHistory, dateRange]);

  const effectiveSelectedClassId = selectedClassId || classList[0]?.id || "";
  const classReportingModel = useMemo(() =>
    buildClassReportModel({
      students,
      classes: classList,
      assessmentHistory: classAssessmentHistory,
      classId: effectiveSelectedClassId,
      teacherName
    }),
  [students, classList, classAssessmentHistory, effectiveSelectedClassId, teacherName]);
  const classReportProvenanceOptions = useMemo(() => ({
    filters: {
      Class: classReportingModel.className,
      "Check period": {
        last30: "Last 30 days",
        last90: "Last 90 days",
        schoolYear: "This school year",
        all: "All time"
      }[dateRange] || dateRange
    }
  }), [classReportingModel, dateRange]);
  const getClassOptionLabel = cls => cls.name || cls.className || cls.class_name || "Class";

  return (
    <div className="teacher-product-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>Class report</h2>
          <p>See the whole class in one place. Open one student&apos;s report from the Student panel.</p>
        </div>
        {onBackToReports && (
          <button
            className="lp-button lp-button-secondary"
            onClick={onBackToReports}
            type="button"
          >
            Back to reports
          </button>
        )}
        <label className="report-filter-control">
          <span>Class check period</span>
          <select value={dateRange} onChange={event => setDateRange(event.target.value)}>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="schoolYear">This school year</option>
            <option value="all">All time</option>
          </select>
        </label>
      </section>

      <section className="class-report-workspace" aria-label="Class report">
        <div className="class-report-print-actions class-report-view-controls screen-only">
          <label>
            Class
            <select
              value={effectiveSelectedClassId}
              onChange={event => setSelectedClassId?.(event.target.value || null)}
              disabled={classList.length === 0}
            >
              {classList.length === 0 ? (
                <option value="">No classes yet</option>
              ) : classList.map(cls => (
                <option key={cls.id} value={cls.id}>{getClassOptionLabel(cls)}</option>
              ))}
            </select>
          </label>
          <button className="lp-button lp-button-primary" onClick={() => window.print()} type="button">
            Export Class PDF
          </button>
        </div>
        <Suspense fallback={<div className="teacher-report-card">Loading EL formal report history…</div>}>
          <ElFormalAssessmentsPanel
            assessmentHistory={allAssessmentHistory}
            classes={classList}
            onPrint={() => window.print()}
            selectedClassId={effectiveSelectedClassId}
            students={students}
            supabase={supabase}
            teacherId={teacherId}
          />
        </Suspense>
        <Suspense fallback={<div className="teacher-action-panel">Loading class report...</div>}>
          <FormalClassReportDocument
            model={classReportingModel}
            provenanceOptions={classReportProvenanceOptions}
          />
        </Suspense>
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
        <p className="panel-label">Check complete</p>
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
            <span>Check</span>
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
            <h3>Learned correctly</h3>
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

              {suggestedFocus && (
                <TeacherRecommendationExplanation
                  surface="targeted-review"
                  explanation={{
                    evidence: `${countPhrase(suggestedFocus.incorrect || 0, "saved miss", "saved misses")} identify ${suggestedFocus.target} as the strongest current practice signal.`,
                    dependency: `${suggestedFocus.target} sits within ${suggestedFocus.stage} and should be checked before advancing related skills.`,
                    confidence: `${countPhrase(totalAnswered, "scored answer")} are available; the suggestion ranks saved misses and remains teacher-reviewable.`,
                    unlock: "A focused review can confirm the gap, update the result, and show whether to re-teach or move on."
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
              <strong>Phonics Pattern Diagnostic</strong>
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
              End check
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
          <h2>Check complete</h2>

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
              Restart pattern check
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
              End check
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
          <h2>Check complete</h2>

          <p>
            Letter names known:
            {" "}
            {progressPhrase(letterAssessment.filter(x => x.knowsName).length, 52)}
          </p>

          <p>
            Letter sounds known:
            {" "}
            {progressPhrase(letterAssessment.filter(x => x.knowsSound).length, 52)}
          </p>

          <div className="button-row">
            <button
              className="reset-button"
              onClick={resetLetterAssessment}
            >
              Restart letter check
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
  isAssessmentTransitioning = false,
  assessmentFullscreen = false,
  toggleAssessmentFullscreen = null,
  onEvidenceImageError = null,
  skillTree = [],
  onChangeSkillLevel = null
}) {
  const hasCurrentQuestion = Boolean(currentQuestion);
  const safeSkillId =
    currentQuestion?.skillId ??
    currentStage?.id ??
    currentQuestion?.skill ??
    null;
  const safeCurrentStage = currentStage || {
    id: safeSkillId || "unknown_skill",
    label: currentQuestion?.skillName || currentQuestion?.skill || "Check"
  };
  const assessmentExit = returnToStudentOverview || endAssessment;

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
          aria-label="Check progress"
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
            <span>Level</span>
            <select
              value={currentSkillIndex}
              onChange={event => onChangeSkillLevel(Number(event.target.value))}
              aria-label="Change the skill level for this check"
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
            <span aria-hidden="true">{assessmentFullscreen ? "X" : "[]"}</span>
            <span>{assessmentFullscreen ? "Exit" : "Full screen"}</span>
          </button>
        )}

        <button className="reset-button assessment-end-button" onClick={endAssessment} type="button">
          End check
        </button>
      </div>
    </div>
  );
  const renderAssessmentLoadingCard = ({ title = "Getting the check ready...", actionLabel = "" } = {}) => (
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
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <h2>{feedback.isCorrect ? "Correct!" : feedback.support?.type === "pair_selection" ? "Let's look closer!" : "Let's learn from that one"}</h2>

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
                        <img
                          src={card.image}
                          alt={card.alt || `Picture for ${word}`}
                          data-assessment-media-kind="feedback"
                          loading="lazy"
                          decoding="async"
                        />
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
                        <img
                          src={card.image}
                          alt={card.alt || `Picture for ${word}`}
                          data-assessment-media-kind="feedback"
                          loading="lazy"
                          decoding="async"
                        />
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
          <h2>This check needs a quick fix.</h2>
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
      ? choice.label.toLowerCase()
      : choice.label;
  const textChoiceAudioPaths = Object.fromEntries(
    normalizedChoices.map(choice => [
      choice.value,
      isListenChooseVowelItem
        ? getPhonemeAudioPath(getChoiceAudioText(choice), choice.media.audio || "")
        : getApprovedAudioPath(getChoiceAudioText(choice), choice.media.audio || "")
    ])
  );
  const showTextChoiceAudio =
    (!isListenAndFindWord || isShortVowelWordChoiceItem) &&
    !String(safeSkillId || "").toLowerCase().startsWith("hfw_") &&
    !isComprehensionPassageItem &&
    !isPairSelection &&
    !isVisualCardChoice &&
    !isIxlStyleTemplate &&
    normalizedChoices.length > 0 &&
    normalizedChoices.every(choice => Boolean(textChoiceAudioPaths[choice.value]));

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
              onEvidenceImageError={onEvidenceImageError}
            />

            {isPairSelection ? (
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
