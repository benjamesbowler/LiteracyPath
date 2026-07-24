/* eslint-disable no-unused-vars, react-hooks/set-state-in-effect, react-hooks/purity -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { summarizeAssessmentHistory } from "../data/assessmentHistoryStore.js";
import { buildClassReportModel } from "../data/reportingSystem.js";
import { getFinalSoundsLevel1QuestionIssues } from "../data/earlyPhonicsValidation.js";
import { getTargetObjectImage } from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { isHfwSpellingQuestion } from "../data/isHfwSpellingQuestion.js";
import { addQuestionFlag } from "../data/questionFlagStore.js";
import { AssessmentAudioButton } from "./assessment/AssessmentAudioButton.jsx";
import { HfwLetterBuildPanel } from "./assessment/HfwLetterBuildPanel.jsx";
import { RouteLoadingFallback } from "./RouteLoadingFallback.jsx";
import {
  getGuidedReadingLandingMeta,
  getSkillsCheckLandingMeta
} from "./reports/studentReportUiUtils.js";
import {
  getAssessmentDecorativeMediaProps,
  getAssessmentEvidenceAccessibleName,
  getAssessmentMainImageLabel
} from "../policy/assessmentMediaEvidence.js";
import { importWithRetry, lazyWithRetry } from "../utils/lazyWithRetry.js";
import {
  EL_BENCHMARK_CATALOG,
  EL_BENCHMARK_IDS,
  EL_DECODING_MICROPHASES,
  listElBenchmarkRoutes
} from "../data/elBenchmarkAssessments.js";
import {
  findLatestElBenchmarkAttempt,
  getElBenchmarkPrerequisiteStatus,
  isCompletedElBenchmarkRouteEvidence
} from "../data/elBenchmarkSession.js";
import "../styles/el-assessment-hub.css";

export { AuthPage } from "./AuthPage.jsx";

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
  a: "/audio/child-mode/clean-human/graphemes/short_vowels/short_a.mp3",
  e: "/audio/child-mode/clean-human/graphemes/short_vowels/short_e.mp3",
  i: "/audio/child-mode/clean-human/graphemes/short_vowels/short_i.mp3",
  o: "/audio/child-mode/clean-human/graphemes/short_vowels/short_o.mp3",
  u: "/audio/child-mode/clean-human/graphemes/short_vowels/short_u.mp3"
};

const CONSONANT_AUDIO_PATHS = Object.fromEntries(
  "bcdfghjklmnpqrstvwxyz".split("").map(letter => [
    letter,
    `/audio/child-mode/clean-human/graphemes/consonants/${letter}.mp3`
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
    return `/audio/child-mode/clean-human/graphemes/digraphs_blends/${normalized}.mp3`;
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

export function StudentOverviewPage({
  diagnosticFollowUp = false,
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
  coverageSnapshot,
  switchStudent,
  openResetStudentProgress,
  isAdmin = false
}) {
  const strongestAreas =
    weaknessSnapshot.strongest.slice(0, 3);

  const needsPractice =
    weaknessSnapshot.needsPractice.slice(0, 4);

  const suggestedFocus =
    weaknessSnapshot.suggestedNextFocus;

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
  const isDiagnosticFollowUp = diagnosticFollowUp;
  const purposeLabel = isDiagnosticFollowUp ? "Diagnostic follow-up" : "Universal benchmark";
  const purposeDescription = isDiagnosticFollowUp
    ? "Choose the skill named by existing evidence and collect only the closer evidence you need."
    : "Follow the shared literacy sequence to establish a consistent starting point.";

  return (
    <div className="card page-card teacher-overview-dashboard">
      <section className="teacher-overview-hero" aria-label="Student overview summary">
        <div className="teacher-student-title">
          <p className="panel-label">{purposeLabel}</p>
          <h2>{studentName || "Unnamed student"}</h2>
          <p>{purposeDescription}</p>
          <small>{currentSkillIndex + 1}. {currentStage.label}</small>
        </div>

        <div className="teacher-metric-strip" aria-label="Student progress summary">
          <div>
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <span>Current round</span>
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
            <strong>
              {hasProgress
                ? `Continue ${purposeLabel.toLowerCase()}`
                : `Begin ${purposeLabel.toLowerCase()}`}
            </strong>
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
            <strong>Current round progress</strong>
            <span>{checkpointPassed ? "Passed" : `${roundCorrect}/${roundLength}`}</span>
          </div>
          <div className="coverage-bar" aria-label="Current round progress">
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

const EL_WINDOW_LABELS = Object.freeze({ BOY: "Beginning of year", MOY: "Middle of year", EOY: "End of year" });

function formatBenchmarkMinutes(value, assessmentId = "", grade = "") {
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    if (grade === "1") return "5–10 min";
    if (grade === "2") return "1–5 min";
    if (grade === "K") return "Optional in Kindergarten";
  }
  if (Number.isFinite(Number(value))) return `About ${Number(value)} min`;
  const minimum = Number(value?.minimum);
  const maximum = Number(value?.maximum);
  if (Number.isFinite(minimum) && Number.isFinite(maximum)) {
    return minimum === maximum ? `About ${minimum} min` : `${minimum}-${maximum} min`;
  }
  return "Teacher paced";
}

function getElPathGuidance(grade, windowName) {
  if (grade === "K") {
    if (windowName === "BOY") {
      return "Start with Letter Name and Sound, then Sound Awareness. Add spelling or word reading later if needed.";
    }
    return "Start with Letter Name and Sound and Sound Awareness. Add spelling and word reading when letter sounds are secure.";
  }
  return "A useful order is Spelling, Word Reading, Reading Fluency, then Sound Awareness. Use Letter Name and Sound when earlier evidence suggests it.";
}

function getBenchmarkRecommendation(assessmentId, grade, windowName) {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    return { label: "Recommended", tone: "recommended", detail: "One-to-one oral check at every benchmark window." };
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY && grade === "K") {
    return { label: "Optional in K", tone: "optional", detail: "Not on the routine Kindergarten path; use only when decoding evidence supports it." };
  }
  if ([EL_BENCHMARK_IDS.ENCODING, EL_BENCHMARK_IDS.DECODING].includes(assessmentId) && grade === "K") {
    if (windowName === "BOY") {
      return { label: "Not routine", tone: "as-needed", detail: "Begin with letter and oral sound evidence." };
    }
    return { label: "Prerequisite", tone: "optional", detail: "Use only after the student accurately demonstrates the taught letter sounds." };
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    return { label: "After Decoding", tone: "recommended", detail: "Begin at the last decoding band read accurately and automatically." };
  }
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    return { label: "After Encoding", tone: "recommended", detail: "Start at the encoding-indicated band and retain automaticity evidence." };
  }
  return { label: "Recommended", tone: "recommended", detail: "Use the selected grade and benchmark window route." };
}

function formatAttemptStatus(attempt) {
  if (!attempt) return "Not assessed";
  const status = attempt.administrationStatus || attempt.status || "recorded";
  return status.replace(/_/g, " ").replace(/^\w/, letter => letter.toUpperCase());
}

function humanizeBenchmarkKey(value = "") {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

const EL_PREREQUISITE_REASON_OPTIONS = Object.freeze([
  {
    id: "recent_classroom_evidence",
    label: "Recent classroom work",
    detail: "Current work shows the student is ready.",
    reason: "Recent classroom evidence shows the student is ready for this assessment."
  },
  {
    id: "equivalent_assessment_evidence",
    label: "Equivalent check completed",
    detail: "I have comparable assessment evidence.",
    reason: "The teacher reviewed equivalent assessment evidence showing the student is ready for this assessment."
  },
  {
    id: "student_support_decision",
    label: "Student support decision",
    detail: "This start matches an agreed support or accommodation.",
    reason: "This starting decision follows the student's agreed support or accommodation."
  },
  {
    id: "other",
    label: "Other reason",
    detail: "Add a short explanation.",
    reason: ""
  }
]);

function getPrerequisiteReasonText(reasonId = "", otherReason = "") {
  if (reasonId === "other") return String(otherReason || "").trim();
  return EL_PREREQUISITE_REASON_OPTIONS.find(option => option.id === reasonId)?.reason || "";
}

function getBenchmarkCardDescription(assessmentId, fallback = "") {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) {
    return "Listen to short sound tasks and tap the student's response.";
  }
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) {
    return "The student writes each word on paper; you tap the closest result.";
  }
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
    return "The student reads words from the screen; you tap how they read each one.";
  }
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
    return "The student reads on screen while the built-in timer guides the check.";
  }
  return fallback;
}

function getBenchmarkCardNote(assessmentId) {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) return "Teacher-led · spoken responses";
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) return "Paper and pencil";
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) return "Student reads on screen";
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) return "Built-in one-minute timer";
  return "Teacher paced";
}

function getBenchmarkStartLabel(assessmentId) {
  if (assessmentId === EL_BENCHMARK_IDS.PHONOLOGICAL_AWARENESS) return "sound awareness";
  if (assessmentId === EL_BENCHMARK_IDS.ENCODING) return "spelling";
  if (assessmentId === EL_BENCHMARK_IDS.DECODING) return "word reading";
  if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) return "reading fluency";
  return "assessment";
}

export function ELAssessmentsPage({
  studentId,
  studentName,
  startLetterAssessment,
  startAdvancedPhonicsAssessment,
  startElBenchmarkAssessment,
  resumeElBenchmarkAssessment,
  discardElBenchmarkDraft,
  elBenchmarkDraft = null,
  assessmentHistory = []
}) {
  const [grade, setGrade] = useState(elBenchmarkDraft?.grade || "K");
  const [windowName, setWindowName] = useState(elBenchmarkDraft?.window || "BOY");
  const [pendingStart, setPendingStart] = useState(null);
  const [prerequisiteReason, setPrerequisiteReason] = useState("");
  const [prerequisiteOtherReason, setPrerequisiteOtherReason] = useState("");
  const prerequisiteReviewRef = useRef(null);
  const routes = useMemo(() => listElBenchmarkRoutes(), []);
  const selectedRoute = useMemo(() => routes.find(route => (
    route.grade === grade && route.window === windowName
  )), [grade, routes, windowName]);
  const latestByAssessment = useMemo(() => Object.fromEntries(
    EL_BENCHMARK_CATALOG.map(entry => [entry.id, findLatestElBenchmarkAttempt({
      assessmentHistory,
      studentId,
      assessmentId: entry.id,
      grade,
      window: windowName
    })])
  ), [assessmentHistory, grade, studentId, windowName]);
  const completedHistory = useMemo(() => (
    assessmentHistory.filter(isCompletedElBenchmarkRouteEvidence)
  ), [assessmentHistory]);
  const latestCompletedByAssessment = useMemo(() => Object.fromEntries(
    EL_BENCHMARK_CATALOG.map(entry => [entry.id, findLatestElBenchmarkAttempt({
      assessmentHistory: completedHistory,
      studentId,
      assessmentId: entry.id,
      grade,
      window: windowName
    })])
  ), [completedHistory, grade, studentId, windowName]);
  const draftCatalogEntry = elBenchmarkDraft
    ? EL_BENCHMARK_CATALOG.find(entry => entry.id === elBenchmarkDraft.assessmentId)
    : null;
  const decodingBandOptions = useMemo(() => {
    const startIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === selectedRoute?.rangeStart);
    const endIndex = EL_DECODING_MICROPHASES.findIndex(row => row.id === selectedRoute?.rangeEnd);
    if (startIndex < 0 || endIndex < startIndex) return [];
    return EL_DECODING_MICROPHASES.slice(startIndex, endIndex + 1);
  }, [selectedRoute]);
  const latestEncoding = latestCompletedByAssessment[EL_BENCHMARK_IDS.ENCODING];
  const confirmedEncodingIndication = latestEncoding?.confirmedPlacement?.candidateMicrophase ||
    latestEncoding?.confirmedPlacement?.microphase || "";
  const provisionalEncodingIndication = latestEncoding?.candidatePlacement?.candidateMicrophase ||
    latestEncoding?.candidatePlacement?.microphase || "";
  const encodingIndication = confirmedEncodingIndication || provisionalEncodingIndication;
  const encodingIndicationSource = confirmedEncodingIndication
    ? "confirmed_encoding_placement"
    : provisionalEncodingIndication
      ? "provisional_encoding_indication"
      : "grade_window_anchor";
  const latestDecoding = latestCompletedByAssessment[EL_BENCHMARK_IDS.DECODING];
  const savedFluencyHandoff = latestDecoding?.metrics?.fluencyStartMicrophase ||
    latestDecoding?.fluencyStartMicrophase ||
    latestDecoding?.confirmedPlacement?.fluencyStartMicrophase ||
    null;
  const fluencyIndication = String(
    typeof savedFluencyHandoff === "string"
      ? savedFluencyHandoff
      : savedFluencyHandoff?.microphase || savedFluencyHandoff?.id || ""
  );
  const allowedStartIds = new Set(decodingBandOptions.map(row => row.id));
  const initialDecodingIndication = allowedStartIds.has(encodingIndication) ? encodingIndication : "";
  const initialFluencyIndication = allowedStartIds.has(fluencyIndication) ? fluencyIndication : "";
  const [decodingStart, setDecodingStart] = useState(
    initialDecodingIndication || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre"
  );
  const [decodingStartSource, setDecodingStartSource] = useState(
    initialDecodingIndication ? encodingIndicationSource : "grade_window_anchor"
  );
  const [fluencyStart, setFluencyStart] = useState(
    initialFluencyIndication || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre"
  );
  const [fluencyStartSource, setFluencyStartSource] = useState(
    initialFluencyIndication ? "decoding_fluency_handoff" : "grade_window_anchor"
  );

  useEffect(() => {
    const allowed = new Set(decodingBandOptions.map(row => row.id));
    const indicated = allowed.has(encodingIndication) ? encodingIndication : "";
    setDecodingStart(indicated || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre");
    setDecodingStartSource(indicated ? encodingIndicationSource : "grade_window_anchor");
  }, [decodingBandOptions, encodingIndication, encodingIndicationSource, selectedRoute?.expectedMicrophase]);

  useEffect(() => {
    const allowed = new Set(decodingBandOptions.map(row => row.id));
    const indicated = allowed.has(fluencyIndication) ? fluencyIndication : "";
    setFluencyStart(indicated || selectedRoute?.expectedMicrophase || decodingBandOptions[0]?.id || "middle_pre");
    setFluencyStartSource(indicated ? "decoding_fluency_handoff" : "grade_window_anchor");
  }, [decodingBandOptions, fluencyIndication, selectedRoute?.expectedMicrophase]);

  useEffect(() => {
    setPendingStart(null);
    setPrerequisiteReason("");
    setPrerequisiteOtherReason("");
  }, [grade, windowName]);

  useEffect(() => {
    if (!pendingStart || !prerequisiteReviewRef.current) return;
    prerequisiteReviewRef.current.focus({ preventScroll: true });
    prerequisiteReviewRef.current.scrollIntoView({ block: "center" });
  }, [pendingStart]);

  const prerequisiteFor = assessmentId => {
    const baseStatus = getElBenchmarkPrerequisiteStatus({
      assessmentHistory,
      studentId,
      assessmentId,
      grade,
      window: windowName
    });
    if (assessmentId === EL_BENCHMARK_IDS.DECODING) {
      const allowed = decodingBandOptions.some(row => row.id === confirmedEncodingIndication);
      if (confirmedEncodingIndication && !allowed) {
        return {
          ...baseStatus,
          state: "override",
          code: "confirmed_encoding_outside_selected_route",
          message: "The confirmed Encoding band is outside this grade/window route. Record why a different in-range start is appropriate."
        };
      }
      if (
        confirmedEncodingIndication &&
        decodingStartSource === "teacher_selected" &&
        decodingStart !== confirmedEncodingIndication
      ) {
        return {
          ...baseStatus,
          state: "override",
          code: "teacher_changed_confirmed_encoding_start",
          message: `Encoding indicated ${humanizeBenchmarkKey(confirmedEncodingIndication)}. Record why ${humanizeBenchmarkKey(decodingStart)} is the better Decoding start.`
        };
      }
    }
    if (assessmentId === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY) {
      const allowed = decodingBandOptions.some(row => row.id === fluencyIndication);
      if (fluencyIndication && !allowed) {
        return {
          ...baseStatus,
          state: "override",
          code: "decoding_fluency_handoff_outside_selected_route",
          message: "The completed Decoding handoff is outside this grade/window route. Record why a different in-range Fluency start is appropriate."
        };
      }
      if (
        fluencyIndication &&
        fluencyStartSource === "teacher_selected" &&
        fluencyStart !== fluencyIndication
      ) {
        return {
          ...baseStatus,
          state: "override",
          code: "teacher_changed_decoding_fluency_handoff",
          message: `Decoding indicated ${humanizeBenchmarkKey(fluencyIndication)}. Record why ${humanizeBenchmarkKey(fluencyStart)} is the better Fluency start.`
        };
      }
    }
    return baseStatus;
  };

  const launchAssessment = (entry, prerequisite, reason = "") => {
    const teacherReviewed = prerequisite.state !== "ready" && Boolean(reason.trim());
    const useEncodingProvenance = entry.id === EL_BENCHMARK_IDS.DECODING &&
      decodingStartSource === "confirmed_encoding_placement" &&
      decodingStart === confirmedEncodingIndication;
    const useFluencyProvenance = entry.id === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY &&
      fluencyStartSource === "decoding_fluency_handoff" &&
      fluencyStart === fluencyIndication;
    const selectedStart = entry.id === EL_BENCHMARK_IDS.DECODING
      ? (useEncodingProvenance ? "" : decodingStart)
      : entry.id === EL_BENCHMARK_IDS.ORAL_READING_FLUENCY
        ? (useFluencyProvenance ? "" : fluencyStart)
        : "";
    startElBenchmarkAssessment?.(entry.id, {
      grade,
      window: windowName,
      startMicrophase: selectedStart,
      prerequisiteReview: {
        state: prerequisite.state,
        code: prerequisite.code,
        evidenceAttemptId: prerequisite.evidenceAttemptId || "",
        teacherConfirmed: teacherReviewed,
        overrideReason: reason.trim(),
        reviewedAt: teacherReviewed ? new Date().toISOString() : ""
      }
    });
    setPendingStart(null);
    setPrerequisiteReason("");
    setPrerequisiteOtherReason("");
  };

  const requestAssessmentStart = entry => {
    const prerequisite = prerequisiteFor(entry.id);
    if (prerequisite.state === "ready") {
      launchAssessment(entry, prerequisite);
      return;
    }
    setPendingStart({ entry, prerequisite });
    setPrerequisiteReason("");
    setPrerequisiteOtherReason("");
  };

  const prerequisiteReasonText = getPrerequisiteReasonText(
    prerequisiteReason,
    prerequisiteOtherReason
  );

  return (
    <div className="teacher-product-page el-assessment-hub">
      <section className="teacher-page-header el-assessment-hub-hero">
        <div>
          <p className="panel-label">Progress monitoring</p>
          <h2>Choose a comparable assessment for {studentName || "this student"}</h2>
          <p>Set the grade and time of year once, then start the check you need.</p>
        </div>
        <span className="el-assessment-provisional-label">Six early literacy checks</span>
      </section>

      <section className="el-assessment-route-panel" aria-labelledby="el-assessment-route-title">
        <div className="el-assessment-route-copy">
          <p className="panel-label">Student level</p>
          <h3 id="el-assessment-route-title">Grade and time of year</h3>
          <p>{getElPathGuidance(grade, windowName)}</p>
        </div>
        <div className="el-assessment-route-controls">
          <label>
            Grade
            <select onChange={event => setGrade(event.target.value)} value={grade}>
              <option value="K">Kindergarten</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
            </select>
          </label>
          <label>
            Time of year
            <select onChange={event => setWindowName(event.target.value)} value={windowName}>
              {Object.entries(EL_WINDOW_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <details className="el-assessment-advanced-starts">
          <summary>
            <span>Advanced starting points</span>
            <small>Optional · change only when earlier evidence supports a different start</small>
          </summary>
          <div className="el-assessment-advanced-start-grid">
            <label>
              Decoding start
              <select onChange={event => {
                setDecodingStart(event.target.value);
                setDecodingStartSource("teacher_selected");
              }} value={decodingStart}>
                {decodingBandOptions.map(band => (
                  <option key={band.id} value={band.id}>
                    {band.label}{band.anchorCycle ? ` · Cycle ${band.anchorCycle}` : ""}
                  </option>
                ))}
              </select>
              <small>
                {confirmedEncodingIndication && decodingBandOptions.some(row => row.id === confirmedEncodingIndication)
                  ? "Set from the latest teacher-confirmed Encoding result."
                  : provisionalEncodingIndication && decodingBandOptions.some(row => row.id === provisionalEncodingIndication)
                    ? "Set from a provisional Encoding result; review before starting Decoding."
                    : "The usual grade and window starting point is selected."}
              </small>
            </label>
            <label>
              Fluency start
              <select onChange={event => {
                setFluencyStart(event.target.value);
                setFluencyStartSource("teacher_selected");
              }} value={fluencyStart}>
                {decodingBandOptions.map(band => (
                  <option key={band.id} value={band.id}>
                    {band.label}{band.anchorCycle ? ` · Cycle ${band.anchorCycle} anchor` : ""}
                  </option>
                ))}
              </select>
              <small>
                {fluencyIndication && decodingBandOptions.some(row => row.id === fluencyIndication)
                  ? "Set from the latest completed Decoding result."
                  : "The usual grade and window starting point is selected."}
              </small>
            </label>
          </div>
          <p className="el-assessment-advanced-note">
            Results are descriptive. No unpublished cut score is assumed.
          </p>
        </details>
      </section>

      {pendingStart && (
        <section
          aria-labelledby="el-prerequisite-review-title"
          className="el-assessment-prerequisite-review"
          ref={prerequisiteReviewRef}
          tabIndex="-1"
        >
          <div>
            <p className="panel-label">Sequence check</p>
            <h3 id="el-prerequisite-review-title">One quick check before starting</h3>
            <p>{pendingStart.prerequisite.message}</p>
          </div>
          <fieldset className="el-assessment-reason-fieldset">
            <legend>Why are you starting here?</legend>
            <div className="el-assessment-reason-options">
              {EL_PREREQUISITE_REASON_OPTIONS.map(option => (
                <button
                  aria-pressed={prerequisiteReason === option.id}
                  key={option.id}
                  onClick={() => {
                    setPrerequisiteReason(option.id);
                    if (option.id !== "other") setPrerequisiteOtherReason("");
                  }}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
          {prerequisiteReason === "other" && (
            <label className="el-assessment-other-reason">
              Short explanation
              <textarea
                autoFocus
                onChange={event => setPrerequisiteOtherReason(event.target.value)}
                placeholder="Briefly note the evidence or reason."
                rows={2}
                value={prerequisiteOtherReason}
              />
            </label>
          )}
          <div className="teacher-action-list">
            <button
              className="lp-button lp-button-primary"
              disabled={!prerequisiteReasonText}
              onClick={() => launchAssessment(
                pendingStart.entry,
                pendingStart.prerequisite,
                prerequisiteReasonText
              )}
              type="button"
            >
              Start {pendingStart.entry.shortTitle || pendingStart.entry.title}
            </button>
            <button
              className="lp-button lp-button-secondary"
              onClick={() => {
                setPendingStart(null);
                setPrerequisiteReason("");
                setPrerequisiteOtherReason("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {elBenchmarkDraft && draftCatalogEntry && (
        <section className="el-assessment-draft-banner" aria-label="Saved benchmark draft">
          <div>
            <span>Saved draft</span>
            <strong>{draftCatalogEntry.title}</strong>
            <small>{elBenchmarkDraft.grade === "K" ? "Kindergarten" : `Grade ${elBenchmarkDraft.grade}`} · {EL_WINDOW_LABELS[elBenchmarkDraft.window] || elBenchmarkDraft.window} · {formatAttemptStatus(elBenchmarkDraft)}</small>
          </div>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-primary" onClick={resumeElBenchmarkAssessment} type="button">Resume draft</button>
            <button className="lp-button lp-button-secondary" onClick={discardElBenchmarkDraft} type="button">Discard draft</button>
          </div>
        </section>
      )}

      <div className="el-assessment-list-heading">
        <div>
          <p className="panel-label">Assessments</p>
          <h3>Choose one check</h3>
        </div>
        <p>Each assessment saves its own results. You can come back for another when you are ready.</p>
      </div>

      <section className="el-assessment-domain-grid">
        <article className="teacher-action-panel el-assessment-domain-card" data-domain="letters">
          <div className="el-assessment-card-topline">
            <span className="el-assessment-card-index">01</span>
            <span className="el-assessment-recommendation recommended">Core evidence</span>
          </div>
          <h3>Letter Name and Sound</h3>
          <p>Name and sound recognition for uppercase and lowercase letters.</p>
          <small>Assessment 1 · existing assessment retained unchanged · Kindergarten routine · Grade 1/2 as needed</small>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startLetterAssessment}>
              Start Letter Assessment
            </button>
          </div>
        </article>

        <article className="teacher-action-panel el-assessment-domain-card supplemental" data-domain="advanced-phonics">
          <div className="el-assessment-card-topline">
            <span className="el-assessment-card-index">02</span>
            <span className="el-assessment-recommendation supplemental">Established supplemental diagnostic</span>
          </div>
          <h3>Phonics Pattern Diagnostic</h3>
          <p>Take a closer look at advanced phoneme and grapheme-pattern knowledge using the established scoring route.</p>
          <small>Assessment 2 · established supplemental diagnostic</small>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startAdvancedPhonicsAssessment}>
              Start Phonics Pattern Diagnostic
            </button>
          </div>
        </article>

        {EL_BENCHMARK_CATALOG.map((entry, index) => {
          const recommendation = getBenchmarkRecommendation(entry.id, grade, windowName);
          const latest = latestByAssessment[entry.id];
          const prerequisite = prerequisiteFor(entry.id);
          return (
            <article className="teacher-action-panel el-assessment-domain-card" data-domain={entry.id} key={entry.id}>
              <div className="el-assessment-card-topline">
                <span className="el-assessment-card-index">{String(index + 3).padStart(2, "0")}</span>
                <span className={`el-assessment-recommendation ${recommendation.tone}`}>{recommendation.label}</span>
              </div>
              <h3>{entry.title}</h3>
              <p>{getBenchmarkCardDescription(entry.id, entry.description)}</p>
              <small>{getBenchmarkCardNote(entry.id)} · {formatBenchmarkMinutes(entry.estimatedMinutes, entry.id, grade)}</small>
              <div className="el-assessment-card-evidence">
                <span>{formatAttemptStatus(latest)}</span>
                {latest?.completedAt && <time dateTime={latest.completedAt}>{new Date(latest.completedAt).toLocaleDateString()}</time>}
              </div>
              {prerequisite.state !== "ready" && (
                <p className="el-assessment-prerequisite-note">Quick evidence check needed before starting.</p>
              )}
              <div className="teacher-action-list">
                <button
                  className="lp-button lp-button-secondary"
                  disabled={Boolean(elBenchmarkDraft)}
                  onClick={() => requestAssessmentStart(entry)}
                  title={elBenchmarkDraft ? "Resume or discard the saved draft before starting another benchmark" : undefined}
                  type="button"
                >
                  {prerequisite.state === "ready" ? "Start" : "Check & start"} {getBenchmarkStartLabel(entry.id)}
                </button>
              </div>
            </article>
          );
        })}

      </section>

      <p className="el-assessment-validity-note">
        These are original, versioned LiteracyPath instruments aligned to the supplied EL Skills Block overview. They are not official EL Education forms, nationally normed scores, or diagnostic tests for a disability.
      </p>
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
export function TeacherReportsPage({
  studentName,
  startAssessment,
  viewFinishedReport,
  guidedReadingRecords = {},
  assessmentHistory = [],
  allAssessmentHistory = [],
  skillMasterySummary = [],
  classList = [],
  selectedClassId = "",
  setSelectedClassId,
  students = [],
  teacherName = "",
  teacherId = "local",
  supabase = null,
  evidenceReady = true
}) {
  const [detailsReady, setDetailsReady] = useState(false);
  const [dateRange, setDateRange] = useState("last90");
  const [reportTab, setReportTab] = useState("student");
  const [guidedReadingReportHelpers, setGuidedReadingReportHelpers] = useState(null);
  const [guidedReadingReportLoadStatus, setGuidedReadingReportLoadStatus] = useState("idle");
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
    setGuidedReadingReportLoadStatus("loading");
    importWithRetry(() => import("../data/guidedReadingBooks"))
      .then(module => {
        if (cancelled) return;
        if (typeof module.summarizeGuidedReadingProgress !== "function") {
          throw new Error("Guided Reading summary helper is unavailable.");
        }
        setGuidedReadingReportHelpers({
          summarizeGuidedReadingProgress: module.summarizeGuidedReadingProgress
        });
        setGuidedReadingReportLoadStatus("ready");
      })
      .catch(error => {
        if (cancelled) return;
        console.error("Guided Reading report summary could not be loaded:", error);
        setGuidedReadingReportLoadStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [detailsReady, guidedReadingReportHelpers]);

  const guidedReadingDetailsReady = detailsReady && Boolean(guidedReadingReportHelpers);

  const filteredAssessmentHistory = useMemo(() => {
    if (dateRange === "all") return assessmentHistory;
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

  // Student report availability must use the student's full record. The date
  // control belongs to the Class tab only and must never make older student
  // evidence look absent on the landing page.
  const fullStudentAssessmentSummary = useMemo(
    () => summarizeAssessmentHistory(assessmentHistory),
    [assessmentHistory]
  );

  const elAssessmentAttemptCount = useMemo(() => {
    const benchmarkIds = new Set(Object.values(EL_BENCHMARK_IDS));
    return assessmentHistory.filter(record => {
      const assessmentId = String(record.assessmentType || record.skillId || "");
      return assessmentId === "el_letter_assessment" ||
        assessmentId === "advanced_phonics_patterns" ||
        benchmarkIds.has(assessmentId);
    }).length;
  }, [assessmentHistory]);

  const skillCheckpointAttemptCount = useMemo(() => assessmentHistory.filter(record => {
    const assessmentType = String(record?.assessmentType || record?.assessment_type || "")
      .trim()
      .toLowerCase();
    return assessmentType === "skill_checkpoint";
  }).length, [assessmentHistory]);

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

  const hasAssessmentData =
    fullStudentAssessmentSummary.attempts > 0 ||
    skillMasterySummary.some(summary => summary.masteredCount > 0);
  const hasReadingData = Object.keys(guidedReadingRecords || {}).length > 0 || (Boolean(readingProgress) && (
    readingProgress.totalBooksRead > 0 ||
    readingProgress.inProgressBooks.length > 0 ||
    readingProgress.totalRereads > 0
  ));
  const effectiveSelectedClassId = selectedClassId || classList[0]?.id || "";
  const classReportingModel = useMemo(() =>
    buildClassReportModel({
      students,
      classes: classList,
      assessmentHistory: filteredAssessmentHistory,
      classId: effectiveSelectedClassId,
      teacherName
    }),
  [students, classList, filteredAssessmentHistory, effectiveSelectedClassId, teacherName]);
  const classReportProvenanceOptions = useMemo(() => ({
    filters: {
      Class: classReportingModel.className,
      "Assessment period": {
        last30: "Last 30 days",
        last90: "Last 90 days",
        schoolYear: "This school year",
        all: "All time"
      }[dateRange] || dateRange
    }
  }), [classReportingModel, dateRange]);
  const getClassOptionLabel = cls => cls.name || cls.className || cls.class_name || "Class";

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
          <h2>Reports</h2>
          <p>Review student and class progress from one focused report area.</p>
        </div>
        {reportTab === "class" && (
          <label className="report-filter-control">
            <span>Class assessment period</span>
            <select value={dateRange} onChange={event => setDateRange(event.target.value)}>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="schoolYear">This school year</option>
              <option value="all">All time</option>
            </select>
          </label>
        )}
      </section>

      <div className="teacher-tabs reports-tab-switcher" aria-label="Report scope">
        <button
          type="button"
          className={reportTab === "student" ? "active" : ""}
          aria-pressed={reportTab === "student"}
          onClick={() => setReportTab("student")}
        >
          Student Report
        </button>
        <button
          type="button"
          className={reportTab === "class" ? "active" : ""}
          aria-pressed={reportTab === "class"}
          onClick={() => setReportTab("class")}
        >
          Class Report
        </button>
      </div>

      {reportTab === "student" && (
      <section className="report-choice-workspace" aria-label="Student reports">
        <header className="report-choice-student">
          <div>
            <span>Selected student</span>
            <h3>{studentName || "Choose a student"}</h3>
          </div>
          <p>Start with the whole-child summary, or open the area where the evidence was collected.</p>
        </header>

        {!evidenceReady && (
          <p className="message" role="status">
            Loading the complete learner evidence record…
          </p>
        )}

        <div className="report-choice-grid">
          {[
            {
              id: "whole-child",
              title: "Whole Child",
              description: "See what the student knows across every learning area, with evidence and next steps.",
              meta: hasAssessmentData || hasReadingData ? "Evidence available" : "Ready for first evidence"
            },
            {
              id: "el-assessments",
              title: "EL Assessments",
              description: "Review Assessments 1-6 together without unrelated reading or game data.",
              meta: elAssessmentAttemptCount ? `${elAssessmentAttemptCount} saved assessment${elAssessmentAttemptCount === 1 ? "" : "s"}` : "No saved attempts yet"
            },
            {
              id: "guided-reading",
              title: "Guided Reading",
              description: "Review books, words read correctly, support words and every teacher note.",
              meta: getGuidedReadingLandingMeta({
                progress: readingProgress,
                loadStatus: guidedReadingReportLoadStatus
              })
            },
            {
              id: "skills-check",
              title: "Skills Check",
              description: "See formal checkpoint results, skill progress and question-level evidence.",
              meta: getSkillsCheckLandingMeta({
                attemptCount: skillCheckpointAttemptCount,
                skillMasterySummary
              })
            },
            {
              id: "other-learning",
              title: "Other Learning",
              description: "See simple practice evidence from Sound Seekers, Arcade and Story Quests.",
              meta: "Practice evidence only"
            }
          ].map(option => (
            <article className={`report-choice-card ${option.id === "whole-child" ? "featured" : ""}`} key={option.id}>
              <div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </div>
              <span>{option.meta}</span>
              <button
                className="lp-button lp-button-primary"
                disabled={!evidenceReady}
                onClick={() => viewFinishedReport(option.id)}
                type="button"
              >
                Open {option.title}
              </button>
            </article>
          ))}
        </div>

        {!hasAssessmentData && startAssessment && (
          <div className="report-choice-first-step">
            <div>
              <strong>No formal assessment evidence yet</strong>
              <p>Start the first assessment to begin the student record.</p>
            </div>
            <button className="lp-button lp-button-secondary" onClick={startAssessment} type="button">
              Start first assessment
            </button>
          </div>
        )}
      </section>
      )}

      {reportTab === "class" && (
        <section className="class-report-workspace" aria-label="Class Report">
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
      )}
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
  isAssessmentTransitioning = false,
  assessmentFullscreen = false,
  toggleAssessmentFullscreen = null,
  onEvidenceImageError = null
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
          End Assessment
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
            Return to Student Overview
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
    <div className="report-panel page-stack finished-report-panel">
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
