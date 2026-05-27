import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getApprovedAudioPath } from "../data/audioPreferenceManifest";
import {
  formatGuidedReadingType,
  getGuidedReadingProgress,
  getGuidedReadingWordStatusRows,
  guidedReadingBooks,
  normalizeGuidedReadingType,
  summarizeGuidedReadingProgress,
  summarizeGuidedReadingRecord,
  summarizeGuidedReadingRecords
} from "../data/guidedReadingBooks";
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
import { analyzeGuidedReadingPage, enrichGuidedReadingBook } from "../utils/guidedReading/phonicsPageAnalyzer.js";
import { recommendBooksForStudent } from "../utils/guidedReading/recommendBooksForStudent.js";
import {
  isGuidedReadingAssetDeleted,
  isGuidedReadingBookDeleted
} from "../data/deletedMediaManifest.js";
import { getFinalSoundsLevel1QuestionIssues } from "../data/earlyPhonicsValidation.js";
import { getTargetObjectImage } from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

export function AuthPage({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authLoading,
  authMessage,
  signUpTeacher,
  logInTeacher
}) {
  return (
    <div className="card page-card page-stack auth-card">
      <div className="auth-heading">
        <h2>Teacher Login</h2>
        <p className="muted-text">Sign in to view only your own classes and student data.</p>
      </div>

      <label className="auth-field">
        <strong>Email</strong>
        <input
          autoComplete="email"
          inputMode="email"
          value={authEmail}
          placeholder="teacher@example.com"
          onChange={event => setAuthEmail(event.target.value)}
          type="email"
        />
      </label>

      <label className="auth-field">
        <strong>Password</strong>
        <input
          autoComplete="current-password"
          value={authPassword}
          placeholder="Password"
          onChange={event => setAuthPassword(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") logInTeacher();
          }}
          type="password"
        />
      </label>

      <div className="button-row auth-actions">
        <button className="main-button" disabled={authLoading} onClick={logInTeacher}>
          Log In
        </button>

        <button className="report-button" disabled={authLoading} onClick={signUpTeacher}>
          Sign Up
        </button>
      </div>

      {authMessage && <p className="message auth-message">{authMessage}</p>}
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

function AssessmentAudioButton({
  text,
  audioPath = "",
  speakText,
  label = "Play audio",
  className = "mini-audio-button"
}) {
  const approvedAudioPath = getApprovedAudioPath(text, audioPath);

  if (!approvedAudioPath) return null;

  return (
    <button
      className={`assessment-audio-button ${className}`}
      onClick={() =>
        speakText(text, approvedAudioPath, {
          allowBrowserFallback: false,
          requireApprovedAudio: true
        })
      }
      aria-label={label}
      type="button"
    >
      <span aria-hidden="true">🔊</span>
    </button>
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
  goToReports,
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
    { id: "teacher", label: teacherEmail || "Signed in" },
    { id: "student", label: nameSaved ? studentName || "Unnamed student" : "No student selected" },
    ...(nameSaved && currentStage ? [{ id: "stage", label: currentStage.label }] : [])
  ];

  return (
    <nav className="top-nav" aria-label="Teacher navigation">
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
            <span className="breadcrumb-label">{item.label}</span>
            {index < infoItems.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </span>
        ))}
      </div>

      <div className="top-nav-actions">
        <button
          className={appView === "overview" ? "nav-button primary" : "nav-button"}
          onClick={goToOverview}
          disabled={!nameSaved}
        >
          Student Overview
        </button>

        <button
          className={appView === "skills" ? "nav-button primary" : "nav-button"}
          onClick={goToSkills}
          disabled={!nameSaved}
        >
          Skills
        </button>

        <button
          className={appView === "elAssessments" ? "nav-button primary" : "nav-button"}
          onClick={goToElAssessments}
          disabled={!nameSaved}
        >
          EL Assessments
        </button>

        <button
          className={appView === "guidedReading" ? "nav-button primary" : "nav-button"}
          onClick={goToGuidedReading}
          disabled={!nameSaved}
        >
          Guided Reading
        </button>

        <button
          className={appView === "reports" || appView === "finished" ? "nav-button primary" : "nav-button"}
          onClick={goToReports}
          disabled={!nameSaved}
        >
          Reports
        </button>

        <button
          className={appView === "tools" ? "nav-button primary" : "nav-button"}
          onClick={goToTools}
          disabled={!nameSaved}
        >
          Tools
        </button>

        <button className="nav-button" onClick={switchStudent}>
          Switch Student
        </button>

        {isAdmin && (
          <button className="nav-button" onClick={openAdminDashboard}>
            Admin Dashboard
          </button>
        )}

        <button className="nav-button" onClick={logOutTeacher}>
          Log Out
        </button>
      </div>
    </nav>
  );
}

function PairSelectionQuestion({ currentQuestion, answerQuestion, speakText }) {
  const [selectedWords, setSelectedWords] = useState([]);
  const showCardAudio = shouldShowUniformCardAudio(currentQuestion.imageCards || []);

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
    <div className="initial-sound-pair-panel">
      <div className="initial-sound-card-grid">
        {(currentQuestion.imageCards || []).map(card => {
          const label = getAnswerOptionLabel(card) || card.word;
          const value = getAnswerOptionValue(card) || label;
          const selected = selectedWords.includes(value);
          const image = card.image || card.imageUrl || card.imagePath || "";

          return (
            <article
              className={selected ? "initial-sound-card selected" : "initial-sound-card"}
              key={value}
            >
              <button
                className="initial-sound-image-button"
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
        className="main-button initial-sound-submit"
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

function IxlStyleTemplateQuestion({ currentQuestion, answerQuestion, speakText }) {
  const [selectedTiles, setSelectedTiles] = useState([]);
  const isSoundOrder = currentQuestion.templateType === "PUT_SOUNDS_IN_ORDER";
  const answerOptions = currentQuestion.answerOptions || [];
  const normalizedAnswerOptions = answerOptions.map(option => ({
    ...normalizeAnswerOption(option),
    media: getAnswerOptionMedia(option)
  }));
  const hasImageOptions = normalizedAnswerOptions.some(option => Boolean(option.media.image));
  const isCompactLetterOptions =
    !hasImageOptions &&
    normalizedAnswerOptions.length <= 4 &&
    normalizedAnswerOptions.every(option => option.label.length <= 3);
  const answerGridClassName = [
    "ixl-answer-grid",
    normalizedAnswerOptions.length === 4 ? "four-options" : "",
    hasImageOptions ? "image-options" : "",
    isCompactLetterOptions ? "letter-options" : ""
  ].filter(Boolean).join(" ");
  const showOptionAudio =
    normalizedAnswerOptions.length > 0 &&
    normalizedAnswerOptions.every(option => Boolean(getApprovedAudioPath(option.label, option.media.audio || "")));

  useEffect(() => {
    setSelectedTiles([]);
  }, [currentQuestion.id]);

  function addTile(tile, index) {
    setSelectedTiles(previous => [...previous, { tile, index }]);
  }

  function removeTile(index) {
    setSelectedTiles(previous => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  if (isSoundOrder) {
    const selectedIndexes = new Set(selectedTiles.map(item => item.index));
    const builtWord = selectedTiles.map(item => item.tile).join("");

    return (
      <div className="ixl-template-panel">
        <div className="sound-order-build" aria-label="Built word">
          {selectedTiles.length === 0 ? (
            <span className="sound-order-placeholder">Tap the sounds in order</span>
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
        </div>

        <div className="sound-order-tile-row">
          {(currentQuestion.soundTiles || []).map((tile, index) => (
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
            disabled={builtWord.length !== String(currentQuestion.correctAnswer || currentQuestion.answer || "").length}
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
            <article className={image ? "ixl-answer-card image-card" : "ixl-answer-card"} key={`${value}-${index}`}>
              <button
                className="ixl-answer-button"
                onClick={() => answerQuestion(value)}
                type="button"
              >
                {image && (
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

function isFinalSoundsEndingQuestion(question = {}) {
  return String(question?.skillId || "").toLowerCase() === "final_sounds" &&
    String(question?.formatType || question?.templateType || "").toUpperCase() === "ENDING_SOUND";
}

function isRhymingPictureQuestion(question = {}) {
  return String(question?.skillId || "").toLowerCase() === "rhyming" &&
    String(question?.formatType || question?.templateType || "").toUpperCase() === "RHYMING_PICTURE";
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
  return safeQuestion.prompt || safeQuestion.question || "";
}

function formatAnswerForFeedback(value = "") {
  return String(value || "").split("|").filter(Boolean).join(", ");
}

function AssessmentStimulus({ currentQuestion, isListenAndFindWord, isPairSelection, isVisualCardChoice, isIxlStyleTemplate, speakText, shouldShowImage }) {
  if (!currentQuestion) return null;

  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);
  const approvedStimulusAudioPath = getApprovedAudioPath(
    currentQuestion.audioText || currentQuestion.targetWord || currentQuestion.answer,
    isRhymingPictureItem ? "" : currentQuestion.audioPath
  );
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
  const hasMainImage = isRhymingPictureItem
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
    Boolean(approvedStimulusAudioPath || isListenAndFindWord || currentQuestion.formatType === "LISTEN_FIND_WORD");

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
          {!isRhymingPictureItem && approvedStimulusAudioPath && (
            <AssessmentAudioButton
              text={currentQuestion.audioText || currentQuestion.targetWord || currentQuestion.answer}
              audioPath={approvedStimulusAudioPath}
              speakText={speakText}
              label="Hear the word"
              className="mini-audio-button assessment-stimulus-audio"
            />
          )}
        </div>
      )}

      {shouldShowListeningVisual && (
        <div className="assessment-listening-panel">
          <ListeningVisual />
          {approvedStimulusAudioPath && (
            <AssessmentAudioButton
              text={currentQuestion.audioText || currentQuestion.targetWord || currentQuestion.answer}
              audioPath={approvedStimulusAudioPath}
              speakText={speakText}
              label="Hear the word"
              className="mini-audio-button assessment-stimulus-audio"
            />
          )}
        </div>
      )}

      {currentQuestion.passage && (
        <div className="passage-wrap assessment-passage-card">
          <p className="passage">{currentQuestion.passage}</p>
        </div>
      )}

      {(currentQuestion.sentence || currentQuestion.context) && (
        <div className="passage-wrap assessment-passage-card">
          <p className="passage">{currentQuestion.sentence || currentQuestion.context}</p>
        </div>
      )}
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
            Reset Student Progress
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

                return (
                  <article className={`skill-catalogue-row ${status.toLowerCase()}`} key={stage.id}>
                    <div className="skill-index-badge">{index + 1}</div>
                    <div className="skill-row-main">
                      <strong>{stage.label}</strong>
                      <span>{status}</span>
                    </div>
                    <div className="skill-row-meter">
                      <span>Checkpoint {data ? `${data.lastScore}/${data.lastTotal}` : "-"}</span>
                      <span className="mini-progress-bar"><span style={{ width: `${checkpointPercent}%` }}></span></span>
                    </div>
                    <div className="skill-row-meter">
                      <span>Coverage {coverage.mastered}/{coverage.total} {coverage.unit}</span>
                      <span className="mini-progress-bar secondary"><span style={{ width: `${coveragePercent}%` }}></span></span>
                    </div>
                    <button
                      className={index === currentSkillIndex ? "lp-button lp-button-primary" : "lp-button lp-button-secondary"}
                      disabled={!unlocked}
                      onClick={() => startSkill(index)}
                      type="button"
                    >
                      {index === currentSkillIndex ? "Start" : data?.mastered ? "Practice" : "Open"}
                    </button>
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
  openGuidedReading,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment
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
          <p>Run the formal letter identification assessment and export the Excel workbook when complete.</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startLetterAssessment}>
              Start Letter Assessment
            </button>
            {letterAssessment.length > 0 && (
              <button className="lp-button lp-button-secondary" onClick={exportLetterAssessment} type="button">
                Export Letter Excel
              </button>
            )}
          </div>
        </article>

        <article className="teacher-action-panel">
          <h3>Advanced Phonics Patterns</h3>
          <p>Run the formal pattern assessment and export pattern-level Excel results when complete.</p>
          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={startAdvancedPhonicsAssessment}>
              Start Advanced Phonics
            </button>
            {patternAssessment.length > 0 && (
              <button className="lp-button lp-button-secondary" onClick={exportPatternAssessment} type="button">
                Export Pattern Excel
              </button>
            )}
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

function GuidedReadingImage({ src, alt, className = "", onLoad }) {
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
  }, [src]);

  if (!src || missing) {
    return (
      <div className={`guided-reading-image-fallback ${className}`} role="img" aria-label={alt || "Book page image unavailable"}>
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      onError={() => setMissing(true)}
      onLoad={onLoad}
      src={src}
    />
  );
}

const DEBUG_AUTOFIT = false;

function AutoFitReadingText({
  children,
  className = "",
  text = "",
  layoutVersion = 0,
  maxFontSize = 30,
  minFontSize = 16,
  lineHeight = 1.28,
  ...props
}) {
  const frameRef = useRef(null);
  const contentRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return undefined;

    let cancelled = false;
    const rafIds = [];
    const timerIds = [];

    const fitText = (trigger = "layout") => {
      if (cancelled) return;
      if (!frame.clientWidth || !frame.clientHeight) return;

      content.style.fontSize = `${maxFontSize}px`;
      content.style.lineHeight = String(lineHeight);
      content.style.overflowY = "hidden";

      let fittedSize = maxFontSize;
      for (let size = maxFontSize; size >= minFontSize; size -= 1) {
        content.style.fontSize = `${size}px`;
        fittedSize = size;
        if (
          content.scrollHeight <= frame.clientHeight + 1 &&
          content.scrollWidth <= frame.clientWidth + 1
        ) {
          break;
        }
      }

      const stillOverflowing =
        content.scrollHeight > frame.clientHeight + 1 ||
        content.scrollWidth > frame.clientWidth + 1;

      content.style.fontSize = `${fittedSize}px`;
      content.style.overflowY = stillOverflowing ? "auto" : "hidden";
      setIsOverflowing(stillOverflowing);

      if (DEBUG_AUTOFIT) {
        console.debug("[Guided Reading autofit]", {
          trigger,
          textLength: String(text || "").length,
          frameWidth: frame.clientWidth,
          frameHeight: frame.clientHeight,
          fontSize: fittedSize,
          scrollHeight: content.scrollHeight,
          clientHeight: frame.clientHeight,
          overflow: stillOverflowing
        });
      }
    };

    const scheduleFit = (trigger = "resize") => {
      const rafId = window.requestAnimationFrame(() => fitText(trigger));
      rafIds.push(rafId);
    };

    fitText("initial");
    const raf1 = window.requestAnimationFrame(() => {
      fitText("raf-1");
      const raf2 = window.requestAnimationFrame(() => fitText("raf-2"));
      rafIds.push(raf2);
    });
    rafIds.push(raf1);
    timerIds.push(window.setTimeout(() => fitText("timeout-0"), 0));
    timerIds.push(window.setTimeout(() => fitText("timeout-100"), 100));

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => fitText("fonts-ready")).catch(() => {});
    }

    let frameObserver;
    let parentObserver;
    if (typeof ResizeObserver !== "undefined") {
      frameObserver = new ResizeObserver(() => scheduleFit("frame-resize"));
      frameObserver.observe(frame);
      if (frame.parentElement) {
        parentObserver = new ResizeObserver(() => scheduleFit("parent-resize"));
        parentObserver.observe(frame.parentElement);
      }
    } else {
      window.addEventListener("resize", scheduleFit);
    }

    window.addEventListener("orientationchange", scheduleFit);

    return () => {
      cancelled = true;
      rafIds.forEach(id => window.cancelAnimationFrame(id));
      timerIds.forEach(id => window.clearTimeout(id));
      if (frameObserver) frameObserver.disconnect();
      if (parentObserver) parentObserver.disconnect();
      if (!frameObserver) window.removeEventListener("resize", scheduleFit);
      window.removeEventListener("orientationchange", scheduleFit);
    };
  }, [text, layoutVersion, maxFontSize, minFontSize, lineHeight]);

  return (
    <div className={isOverflowing ? "guided-page-text-frame overflowing" : "guided-page-text-frame"} ref={frameRef}>
      <div
        {...props}
        className={`${className} auto-fit-reading-text`}
        ref={contentRef}
      >
        {children}
      </div>
    </div>
  );
}

function getGuidedBookCover(book = {}) {
  const src = book.cover || book.coverImage || book.coverUrl || "";
  if (src && isGuidedReadingAssetDeleted({ bookId: book.id, path: src, pageNumber: 0 })) {
    return {
      src: "",
      isGenerated: true
    };
  }
  return {
    src,
    isGenerated: !src
  };
}

function GuidedBookCover({ book }) {
  const cover = getGuidedBookCover(book);

  if (!cover.src) {
    return (
      <div className="guided-book-generated-cover" role="img" aria-label={`${book.title} generated cover`}>
        <span>{formatGuidedReadingType(book.type)}</span>
        <strong>{book.title}</strong>
        <small>Level {book.level}</small>
      </div>
    );
  }

  return (
    <GuidedReadingImage
      alt={`${book.title} cover`}
      className="guided-book-cover"
      src={cover.src}
    />
  );
}

function tokenizeReadingText(text = "") {
  const normalizedText = String(text || "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  const tokens = normalizedText.match(/[A-Za-z0-9'-]+|[^A-Za-z0-9'-]+/g) || [];
  let wordIndex = -1;

  return tokens.map((token, index) => {
    if (/^[A-Za-z0-9'-]+$/.test(token)) {
      wordIndex += 1;
      return { token, index, type: "word", wordIndex };
    }

    return { token, index, type: "text", wordIndex: null };
  });
}

function speakWithBrowserVoice(text = "", onEnd) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) {
    onEnd?.();
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

function sentenceParts(text = "") {
  const matches = String(text || "").match(/[^.!?]+[.!?]*/g) || [];
  return matches.map(sentence => sentence.trim()).filter(Boolean);
}

const guidedReadingLevels = ["A", "B", "C", "D", "E", "F"];

function getRuntimeGuidedReadingBooks() {
  return guidedReadingBooks
    .filter(book => !isGuidedReadingBookDeleted(book.id))
    .map(book => ({
      ...book,
      pages: (book.pages || []).filter(page =>
        !isGuidedReadingAssetDeleted({
          bookId: book.id,
          path: page.image,
          pageNumber: page.pageNumber
        })
      )
    }))
    .filter(book => (book.pages || []).length > 0);
}

function getGuidedReadingTypeStats(type) {
  const normalizedType = normalizeGuidedReadingType(type);
  const books = getRuntimeGuidedReadingBooks().filter(book => normalizeGuidedReadingType(book.type) === normalizedType);
  return {
    type: normalizedType,
    label: formatGuidedReadingType(normalizedType),
    books,
    count: books.length,
    levels: [...new Set(books.map(book => book.level).filter(Boolean))].sort()
  };
}

function getGuidedReadingLevelBooks(type, level) {
  return getRuntimeGuidedReadingBooks().filter(book =>
    normalizeGuidedReadingType(book.type) === normalizeGuidedReadingType(type) &&
    book.level === level
  );
}

export function GuidedReadingPage({
  studentId,
  studentName,
  guidedReadingRecords = {},
  saveGuidedReadingRecord,
  speakText,
  returnToElAssessments,
  viewReports
}) {
  const [selectedBookId, setSelectedBookId] = useState(() => getRuntimeGuidedReadingBooks()[0]?.id || "");
  const [selectedLibraryType, setSelectedLibraryType] = useState("");
  const [selectedLibraryLevel, setSelectedLibraryLevel] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readingMode, setReadingMode] = useState("reading");
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(null);
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState(null);
  const [audioNotice, setAudioNotice] = useState("");
  const [isPageAudioPlaying, setIsPageAudioPlaying] = useState(false);
  const [teacherNotesOpen, setTeacherNotesOpen] = useState(false);
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);
  const [readerLayoutVersion, setReaderLayoutVersion] = useState(0);
  const guidedReaderShellRef = useRef(null);
  const pageAudioRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const sentenceTimersRef = useRef([]);
  const lastVisitedPageRef = useRef("");
  const touchStartRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const runtimeGuidedReadingBooks = getRuntimeGuidedReadingBooks();
  const selectedBook = runtimeGuidedReadingBooks.find(book => book.id === selectedBookId) || runtimeGuidedReadingBooks[0];
  const page = selectedBook?.pages?.[pageIndex];
  const record = guidedReadingRecords[selectedBook?.id] || {
    bookId: selectedBook?.id,
    title: selectedBook?.title,
    type: selectedBook?.type,
    level: selectedBook?.level,
    pages: {},
    wholeBookNote: ""
  };
  const currentPageRecord = record.pages?.[pageIndex] || {
    wordMarks: {},
    wordTexts: page?.words?.map(word => word.text) || [],
    note: ""
  };
  const summary = summarizeGuidedReadingRecord(record);
  const readingProgress = selectedBook ? getGuidedReadingProgress(selectedBook, record) : null;
  const enrichedSelectedBook = selectedBook ? enrichGuidedReadingBook(selectedBook) : null;
  const pageAnalysis = page ? analyzeGuidedReadingPage(page) : null;
  const recommendedBooks = recommendBooksForStudent({
    books: runtimeGuidedReadingBooks,
    studentProgress: {
      currentMicrophase: enrichedSelectedBook?.recommendedMicrophase,
      needs: enrichedSelectedBook?.recommendedSkillsToReinforce || []
    },
    readingHistory: guidedReadingRecords
  }).slice(0, 5);
  const readingTokens = tokenizeReadingText(page?.text || "");
  const pageSentences = sentenceParts(page?.text || "");
  let sentenceWordOffset = -1;
  const sentenceTokenGroups = pageSentences.length
    ? pageSentences.map((sentence, sentenceIndex) => ({
      sentenceIndex,
      tokens: tokenizeReadingText(sentence).map(item => {
        if (item.type !== "word") return item;
        sentenceWordOffset += 1;
        return { ...item, wordIndex: sentenceWordOffset };
      })
    }))
    : [{
      sentenceIndex: 0,
      tokens: readingTokens
    }];
  const typeCards = ["fiction", "nonfiction"]
    .map(getGuidedReadingTypeStats)
    .filter(card => card.count > 0);
  const availableLevels = selectedLibraryType
    ? guidedReadingLevels.filter(level => getGuidedReadingLevelBooks(selectedLibraryType, level).length > 0)
    : [];
  const visibleLibraryBooks = selectedLibraryType && selectedLibraryLevel
    ? getGuidedReadingLevelBooks(selectedLibraryType, selectedLibraryLevel)
    : [];
  const reviewModeBooks = runtimeGuidedReadingBooks.filter(book => book.reviewMode);

  useEffect(() => {
    return () => {
      if (pageAudioRef.current) {
        pageAudioRef.current.pause();
        pageAudioRef.current = null;
      }
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      if (sentenceTimersRef.current.length) {
        sentenceTimersRef.current.forEach(clearTimeout);
        sentenceTimersRef.current = [];
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setAudioNotice("");
    setHighlightedWordIndex(null);
    setHighlightedSentenceIndex(null);
    stopPageAudio();
  }, [selectedBookId, pageIndex]);

  useEffect(() => {
    if (!readerOpen || !selectedBook || !page) return;
    recordGuidedPageVisit(pageIndex);
  }, [readerOpen, selectedBookId, pageIndex]);

  useEffect(() => {
    if (readerOpen) setTeacherNotesOpen(false);
  }, [readerOpen, selectedBookId]);

  useEffect(() => {
    if (!readerOpen) return;
    setReaderLayoutVersion(version => version + 1);
  }, [
    readerOpen,
    selectedBookId,
    pageIndex,
    page?.image,
    page?.text,
    readingMode,
    teacherNotesOpen,
    isReaderFullscreen
  ]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    function handleFullscreenChange() {
      setIsReaderFullscreen(document.fullscreenElement === guidedReaderShellRef.current);
      setReaderLayoutVersion(version => version + 1);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!readerOpen || showSummary) return undefined;

    function handleKeyDown(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === "textarea" || tagName === "input" || tagName === "select") return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousPage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextPage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readerOpen, showSummary, pageIndex, selectedBook?.pages?.length]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const hiddenReviewBooks = reviewModeBooks.filter(book =>
      !getGuidedReadingLevelBooks(book.type, book.level).some(item => item.id === book.id)
    );
    console.info("[Guided Reading] visible book audit", {
      totalBooks: runtimeGuidedReadingBooks.length,
      reviewModeBooks: reviewModeBooks.map(book => ({
        id: book.id,
        title: book.title,
        type: book.type,
        level: book.level,
        pages: book.pages?.length || 0,
        hasCover: Boolean(book.coverImage),
        qaStatus: book.qaStatus
      })),
      hiddenReviewBooks: hiddenReviewBooks.map(book => ({
        id: book.id,
        reason: "Not returned by type/level shelf lookup"
      }))
    });
  }, []);

  function updateRecord(patch) {
    if (!selectedBook) return;
    saveGuidedReadingRecord(selectedBook.id, {
      ...record,
      studentId,
      bookId: selectedBook.id,
      title: selectedBook.title,
      type: selectedBook.type,
      level: selectedBook.level,
      updatedAt: new Date().toISOString(),
      ...patch
    });
  }

  function touchBookProgress(nextPageIndex = pageIndex, patch = {}) {
    if (!selectedBook) return;
    const now = new Date().toISOString();
    const totalPages = selectedBook.pages.length;
    const previous = guidedReadingRecords[selectedBook.id] || record || {};

    saveGuidedReadingRecord(selectedBook.id, {
      ...previous,
      studentId,
      bookId: selectedBook.id,
      title: selectedBook.title,
      type: normalizeGuidedReadingType(selectedBook.type),
      level: selectedBook.level,
      firstReadAt: previous.firstReadAt || now,
      lastReadAt: now,
      completedPages: Math.min(totalPages, Math.max(Number(previous.completedPages || 0), nextPageIndex + 1)),
      totalPages,
      completed: Boolean(previous.completed || previous.completedAt),
      readCount: Number(previous.readCount || (previous.completed || previous.completedAt ? 1 : 0)),
      updatedAt: now,
      ...patch
    });
  }

  function recordGuidedPageVisit(nextPageIndex = pageIndex) {
    if (!selectedBook) return;
    const visitKey = `${selectedBook.id}:${nextPageIndex}`;
    if (lastVisitedPageRef.current === visitKey) {
      touchBookProgress(nextPageIndex);
      return;
    }
    lastVisitedPageRef.current = visitKey;
    const previous = guidedReadingRecords[selectedBook.id] || record || {};
    const previousStats = previous.pageStats || {};
    const pageKey = String(nextPageIndex + 1);
    const previousPageStats = previousStats[pageKey] || {};
    const openedCount = Number(previousPageStats.openedCount || 0) + 1;

    touchBookProgress(nextPageIndex, {
      pageStats: {
        ...previousStats,
        [pageKey]: {
          ...previousPageStats,
          openedCount,
          rereadCount: Math.max(0, openedCount - 1),
          lastOpenedAt: new Date().toISOString()
        }
      }
    });
  }

  function updatePageRecord(nextPageRecord) {
    if (!page) return;
    updateRecord({
      pages: {
        ...record.pages,
        [pageIndex]: {
          ...currentPageRecord,
          wordTexts: (page.words || []).map(word => word.text),
          updatedAt: new Date().toISOString(),
          ...nextPageRecord
        }
      }
    });
  }

  function cycleWordMark(wordIndex) {
    const existing = currentPageRecord.wordMarks?.[wordIndex] || "";
    const next =
      existing === ""
        ? "correct"
        : existing === "correct"
          ? "support"
          : "";
    const wordMarks = { ...(currentPageRecord.wordMarks || {}) };

    if (next) wordMarks[wordIndex] = next;
    else delete wordMarks[wordIndex];

    updatePageRecord({ wordMarks });
  }

  function updatePageNote(note) {
    updatePageRecord({ note });
  }

  function updateWholeBookNote(wholeBookNote) {
    updateRecord({ wholeBookNote });
  }

  function completeBook() {
    if (!selectedBook) return;
    stopPageAudio();
    const now = new Date().toISOString();
    const wasCompleted = Boolean(record.completed || record.completedAt);
    const nextReadCount = wasCompleted
      ? Number(record.readCount || 1) + 1
      : Math.max(1, Number(record.readCount || 0) + 1);

    touchBookProgress(selectedBook.pages.length - 1, {
      completed: true,
      completedAt: record.completedAt || now,
      lastReadAt: now,
      readCount: nextReadCount,
      completedPages: selectedBook.pages.length,
      totalPages: selectedBook.pages.length
    });
    setShowSummary(true);
  }

  function changeBook(bookId) {
    setSelectedBookId(bookId);
    setPageIndex(0);
    setShowSummary(false);
    setReaderOpen(true);
    setReadingMode("reading");
  }

  function closeReader() {
    stopPageAudio();
    if (typeof document !== "undefined" && document.fullscreenElement === guidedReaderShellRef.current) {
      document.exitFullscreen?.().catch(() => {});
    }
    setReaderOpen(false);
    setShowSummary(false);
  }

  async function toggleReaderFullscreen() {
    const shell = guidedReaderShellRef.current;
    if (!shell || typeof document === "undefined") {
      setIsReaderFullscreen(value => !value);
      return;
    }

    try {
      if (document.fullscreenElement === shell) {
        await document.exitFullscreen();
      } else if (shell.requestFullscreen) {
        await shell.requestFullscreen();
      } else {
        setIsReaderFullscreen(value => !value);
      }
    } catch (error) {
      console.warn("Guided Reading fullscreen toggle unavailable.", error);
      setIsReaderFullscreen(value => !value);
    }
  }

  function goToPreviousPage() {
    setPageIndex(index => Math.max(0, index - 1));
  }

  function goToNextPage() {
    setPageIndex(index => Math.min(selectedBook.pages.length - 1, index + 1));
  }

  function handlePageTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  }

  function handlePageTouchEnd(event) {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 54 || Math.abs(deltaY) > 70) return;

    if (deltaX < 0) goToNextPage();
    else goToPreviousPage();
  }

  function stopPageAudio() {
    if (pageAudioRef.current) {
      pageAudioRef.current.pause();
      pageAudioRef.current.currentTime = 0;
      pageAudioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    sentenceTimersRef.current.forEach(clearTimeout);
    sentenceTimersRef.current = [];
    setHighlightedSentenceIndex(null);
    setIsPageAudioPlaying(false);
  }

  async function togglePageAudio() {
    if (pageAudioRef.current && isPageAudioPlaying) {
      stopPageAudio();
      return;
    }
    if (isPageAudioPlaying) {
      stopPageAudio();
      return;
    }

    stopPageAudio();
    const previous = guidedReadingRecords[selectedBook.id] || record || {};
    const previousStats = previous.pageStats || {};
    const pageKey = String(pageIndex + 1);
    const previousPageStats = previousStats[pageKey] || {};
    touchBookProgress(pageIndex, {
      readPageButtonUses: Number(previous.readPageButtonUses || 0) + 1,
      pageStats: {
        ...previousStats,
        [pageKey]: {
          ...previousPageStats,
          readPageButtonUses: Number(previousPageStats.readPageButtonUses || 0) + 1,
          lastReadPageAt: new Date().toISOString()
        }
      }
    });

    if (!page?.pageAudio) {
      setAudioNotice("Using browser voice for this page while narration audio is pending.");
      setIsPageAudioPlaying(true);
      runSentenceHighlights(pageSentences);
      const spoken = speakWithBrowserVoice(page?.text || "", () => {
        setIsPageAudioPlaying(false);
        setHighlightedSentenceIndex(null);
      });
      if (!spoken) {
        setIsPageAudioPlaying(false);
        setAudioNotice("Page narration is not available for this page.");
      }
      return;
    }

    try {
      const audio = new Audio(page.pageAudio);
      pageAudioRef.current = audio;
      setIsPageAudioPlaying(true);
      runSentenceHighlights(pageSentences);
      audio.onended = () => {
        pageAudioRef.current = null;
        setIsPageAudioPlaying(false);
        setHighlightedSentenceIndex(null);
      };
      audio.onerror = () => {
        pageAudioRef.current = null;
        setIsPageAudioPlaying(false);
        setAudioNotice("Using browser voice because page audio could not be loaded.");
        const spoken = speakWithBrowserVoice(page?.text || "", () => {
          setIsPageAudioPlaying(false);
          setHighlightedSentenceIndex(null);
        });
        if (spoken) {
          setIsPageAudioPlaying(true);
          runSentenceHighlights(pageSentences);
        }
      };
      await audio.play();
    } catch (error) {
      console.warn("Guided Reading page audio unavailable.", error);
      pageAudioRef.current = null;
      setAudioNotice("Using browser voice because page audio could not be played.");
      const spoken = speakWithBrowserVoice(page?.text || "", () => {
        setIsPageAudioPlaying(false);
        setHighlightedSentenceIndex(null);
      });
      setIsPageAudioPlaying(spoken);
      if (spoken) runSentenceHighlights(pageSentences);
    }
  }

  function runSentenceHighlights(sentences = []) {
    sentenceTimersRef.current.forEach(clearTimeout);
    sentenceTimersRef.current = [];
    if (!sentences.length) return;
    const totalWords = sentences.join(" ").split(/\s+/).filter(Boolean).length || 1;
    let elapsed = 0;
    sentences.forEach((sentence, index) => {
      const wordsInSentence = sentence.split(/\s+/).filter(Boolean).length || 1;
      sentenceTimersRef.current.push(setTimeout(() => setHighlightedSentenceIndex(index), elapsed));
      elapsed += Math.max(900, wordsInSentence * 420);
    });
    sentenceTimersRef.current.push(setTimeout(() => setHighlightedSentenceIndex(null), Math.max(elapsed, totalWords * 360)));
  }

  function brieflyHighlightWord(wordIndex) {
    setHighlightedWordIndex(wordIndex);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedWordIndex(null), 700);
  }

  function playWordAudio(word, wordIndex) {
    const approvedAudioPath = getApprovedAudioPath(word?.text, word?.audioPath);
    if (!approvedAudioPath) {
      setAudioNotice("Using browser voice for this word while word audio is pending.");
      brieflyHighlightWord(wordIndex);
      speakWithBrowserVoice(word?.text || "");
      return;
    }

    setAudioNotice("");
    brieflyHighlightWord(wordIndex);
    speakText(word.text, approvedAudioPath, {
      allowBrowserFallback: false,
      requireApprovedAudio: true
    });
  }

  function handleWordClick(wordIndex, event) {
    const word = (page.words || [])[wordIndex] || (pageAnalysis?.words?.[wordIndex] ? { text: pageAnalysis.words[wordIndex] } : null);
    if (!word) return;

    if (readingMode === "marking" && !event.altKey) {
      cycleWordMark(wordIndex);
      return;
    }

    playWordAudio(word, wordIndex);
  }

  const recordSummaries = summarizeGuidedReadingRecords(guidedReadingRecords);

  if (!selectedBook) {
    return (
      <div className="teacher-product-page guided-reading-page">
        <section className="teacher-page-header">
          <div>
            <p className="panel-label">Guided Reading</p>
            <h2>{studentName || "Student"} Reading Conference</h2>
            <p>Guided Reading books are temporarily paused while the page images and app text are regenerated to match correctly.</p>
          </div>

          <div className="teacher-action-list">
            <button className="lp-button lp-button-secondary" onClick={returnToElAssessments} type="button">
              EL Assessments
            </button>
            <button className="lp-button lp-button-secondary" onClick={viewReports} type="button">
              Reports
            </button>
          </div>
        </section>

        <section className="guided-reader-empty">
          <h3>No approved Guided Reading books are active right now.</h3>
          <p>
            The imported book pack was disabled because page illustrations include embedded text and story details that conflict with the app text.
            The QA report lists the exact books/pages Kimi needs to regenerate.
          </p>
        </section>

        {recordSummaries.length > 0 && (
          <section className="teacher-action-panel">
            <h3>Saved guided reading summaries</h3>
            <div className="guided-record-list">
              {recordSummaries.map(item => (
                <article key={item.bookId}>
                  <strong>{item.title}</strong>
                  <span>{item.correct}/{item.attempted} correct · {item.accuracy}%</span>
                  <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={readerOpen ? "guided-reading-page guided-reading-reader-open" : "teacher-product-page guided-reading-page"}>
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Guided Reading</p>
          <h2>{studentName || "Student"} Reading Conference</h2>
          <p>Use original sample books to listen, mark word reading, and capture teacher notes.</p>
        </div>

        <div className="teacher-action-list">
          <button className="lp-button lp-button-secondary" onClick={returnToElAssessments} type="button">
            EL Assessments
          </button>
          <button className="lp-button lp-button-secondary" onClick={viewReports} type="button">
            Reports
          </button>
        </div>
      </section>

      {!readerOpen && reviewModeBooks.length > 0 && (
        <section className="guided-review-shelf" aria-label="Guided Reading review books">
          <div className="guided-review-shelf-header">
            <div>
              <p className="panel-label">Review</p>
              <h3>Guided Reading Review Books</h3>
              <p>These books are visible for teacher review when nonfiction content needs image/text or narration checks.</p>
            </div>
            <span>{reviewModeBooks.length} books</span>
          </div>

          <div className="guided-book-grid">
            {reviewModeBooks.map(book => {
              const progress = getGuidedReadingProgress(book, guidedReadingRecords[book.id]);

              return (
                <article
                  className={book.id === selectedBook.id ? "guided-book-card active review-mode" : "guided-book-card review-mode"}
                  key={book.id}
                >
                  <span className="guided-review-badge">Review</span>
                  {progress.completed && <span className="guided-complete-badge" aria-label="Completed">✓</span>}
                  <div className="guided-book-cover-wrap">
                    <GuidedBookCover book={book} />
                  </div>
                  <div className="guided-book-info">
                    <h3 className="guided-book-title">{book.title}</h3>
                    <p className="guided-book-meta">{book.seriesTitle ? `${book.seriesTitle} · ` : ""}{formatGuidedReadingType(book.type)} · Level {book.level} · {book.pages.length} pages</p>
                    <p className="guided-book-status">{book.teacherPreviewOnly ? "Teacher Preview" : book.imageAlignmentStatus === "needs_review" ? "Image Review" : "Audio Pending"}</p>
                    <button
                      className="guided-book-action"
                      onClick={() => changeBook(book.id)}
                      type="button"
                    >
                      {book.teacherPreviewOnly ? "Preview" : progress.completed ? "Read Again" : "Read"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!readerOpen && (
      <section className="guided-library-breadcrumb" aria-label="Guided reading library path">
        <button
          className={!selectedLibraryType ? "active" : ""}
          onClick={() => {
            setSelectedLibraryType("");
            setSelectedLibraryLevel("");
          }}
          type="button"
        >
          Guided Reading
        </button>
        {selectedLibraryType && (
          <>
            <span>/</span>
            <button
              className={!selectedLibraryLevel ? "active" : ""}
              onClick={() => setSelectedLibraryLevel("")}
              type="button"
            >
              {formatGuidedReadingType(selectedLibraryType)}
            </button>
          </>
        )}
        {selectedLibraryLevel && (
          <>
            <span>/</span>
          <strong>Level {selectedLibraryLevel}</strong>
          </>
        )}
      </section>
      )}

      {!readerOpen && (
      <section className="guided-reading-library" aria-label="Guided reading library">
        {!selectedLibraryType && (
          <div className="guided-category-grid">
            {typeCards.map(card => (
              <button
                className="guided-category-card"
                key={card.type}
                onClick={() => {
                  setSelectedLibraryType(card.type);
                  setSelectedLibraryLevel("");
                }}
                type="button"
              >
                <span className="guided-category-icon">N</span>
                <strong>{card.label}</strong>
                <small>{card.count} books · Levels {card.levels.join(", ")}</small>
              </button>
            ))}
          </div>
        )}

        {selectedLibraryType && !selectedLibraryLevel && (
          <div className="guided-level-grid">
            {availableLevels.map(level => {
              const books = getGuidedReadingLevelBooks(selectedLibraryType, level);
              const completedCount = books.filter(book =>
                getGuidedReadingProgress(book, guidedReadingRecords[book.id]).completed
              ).length;

              return (
                <button
                  className="guided-level-card"
                  key={level}
                  onClick={() => setSelectedLibraryLevel(level)}
                  type="button"
                >
                  <strong>Level {level}</strong>
                  <span>{books.length} books</span>
                  <small>{completedCount}/{books.length} completed</small>
                </button>
              );
            })}
          </div>
        )}

        {selectedLibraryType && selectedLibraryLevel && (
          <div className="guided-book-grid">
            {visibleLibraryBooks.map(book => {
              const progress = getGuidedReadingProgress(book, guidedReadingRecords[book.id]);

              return (
                <article
                  className={book.id === selectedBook.id ? "guided-book-card active" : "guided-book-card"}
                  key={book.id}
                >
                  {progress.completed && <span className="guided-complete-badge" aria-label="Completed">✓</span>}
                  {(book.reviewMode || book.teacherPreviewOnly) && <span className="guided-review-badge">{book.teacherPreviewOnly ? "Preview" : "Review"}</span>}
                  <div className="guided-book-cover-wrap">
                    <GuidedBookCover book={book} />
                  </div>
                  <div className="guided-book-info">
                    <h3 className="guided-book-title">{book.title}</h3>
                    <p className="guided-book-meta">{book.seriesTitle ? `${book.seriesTitle} · ` : ""}{formatGuidedReadingType(book.type)} · Level {book.level} · {book.pages.length} pages</p>
                    {(book.reviewMode || book.teacherPreviewOnly) && (
                      <p className="guided-book-status">
                        {book.teacherPreviewOnly ? "Teacher Preview: needs image QA" : book.imageAlignmentStatus === "needs_review" ? "Image Review" : "Audio Pending"}
                      </p>
                    )}
                    <button
                      className="guided-book-action"
                      onClick={() => changeBook(book.id)}
                      type="button"
                    >
                      {book.teacherPreviewOnly ? "Preview" : progress.completed ? "Read Again" : "Read"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      )}

      {!readerOpen && recommendedBooks.length > 0 && (
        <section className="guided-recommendation-panel" aria-label="Guided reading recommendations">
          <div>
            <p className="panel-label">Adaptive Recommendations</p>
            <h3>Suggested next reads</h3>
            <p>Based on phonics patterns, decodable percentage, rereading history, and current review-safe book status.</p>
          </div>
          <div className="guided-recommendation-list">
            {recommendedBooks.map(item => (
              <button key={item.book.id} onClick={() => changeBook(item.book.id)} type="button">
                <strong>{item.book.title}</strong>
                <span>Level {item.book.level} · {item.book.recommendedMicrophase || "early reading"}</span>
                <small>{item.reasons.slice(0, 2).join(" · ")}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {readerOpen && !showSummary ? (
        <section
          className={[
            "guided-reader-shell",
            teacherNotesOpen ? "notes-open" : "",
            isReaderFullscreen ? "fullscreen" : ""
          ].filter(Boolean).join(" ")}
          ref={guidedReaderShellRef}
          aria-label={`${selectedBook.title} full-screen reader`}
        >
          <div className="guided-reader-card">
            <div className="guided-reader-header">
              <div>
                <p className="panel-label">{selectedBook.type} · Level {selectedBook.level}</p>
                <h3>{selectedBook.title}</h3>
                <p>{(selectedBook.targetSkills || selectedBook.recommendedSkillsToReinforce || []).join(" · ")}</p>
              </div>
              <div className="guided-page-controls">
                <button
                  className={isPageAudioPlaying ? "lp-button lp-button-secondary active" : "lp-button lp-button-secondary"}
                  onClick={togglePageAudio}
                  type="button"
                >
                  {isPageAudioPlaying ? "Stop Reading" : "Read Page"}
                </button>
                <strong>Page {pageIndex + 1} of {selectedBook.pages.length}</strong>
                <button className="lp-button lp-button-secondary" onClick={() => setTeacherNotesOpen(value => !value)} type="button">
                  Teacher Notes
                </button>
                <button className="lp-button lp-button-secondary" onClick={toggleReaderFullscreen} type="button">
                  {isReaderFullscreen ? "Exit Full Screen" : "Full Screen"}
                </button>
                <button className="lp-button lp-button-secondary" onClick={closeReader} type="button">
                  Close Reader
                </button>
              </div>
            </div>

            <div className="guided-reader-modebar" aria-label="Guided Reading mode">
              <div className="guided-mode-toggle" role="group" aria-label="Reader mode">
                <button
                  className={readingMode === "reading" ? "active" : ""}
                  onClick={() => setReadingMode("reading")}
                  type="button"
                >
                  Reading Mode
                </button>
                <button
                  className={readingMode === "marking" ? "active" : ""}
                  onClick={() => setReadingMode("marking")}
                  type="button"
                >
                  Marking Mode
                </button>
              </div>
              <p>
                {readingMode === "reading"
                  ? "Tap a word to hear it when approved word audio is available."
                  : "Tap words to cycle neutral, read correctly, and needs support. Alt-click a word to hear it."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="guided-page-layout"
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -18 }}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 18 }}
                key={`${selectedBook.id}-${pageIndex}`}
                onTouchEnd={handlePageTouchEnd}
                onTouchStart={handlePageTouchStart}
                transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
              >
                <div className="guided-page-image-card">
                  <GuidedReadingImage
                    alt=""
                    className="guided-page-image"
                    onLoad={() => setReaderLayoutVersion(version => version + 1)}
                    src={page.image}
                  />
                </div>

                <div className="guided-page-reading">
                  <AutoFitReadingText
                    aria-label="Page text"
                    className={`guided-page-text ${readingMode}`}
                    layoutVersion={readerLayoutVersion}
                    text={`${selectedBook.id}-${pageIndex}-${page.text || ""}-${readingMode}-${isReaderFullscreen ? "fullscreen" : "windowed"}`}
                  >
                    {sentenceTokenGroups.map(group => (
                      <span
                        className={highlightedSentenceIndex === group.sentenceIndex ? "guided-sentence active" : "guided-sentence"}
                        key={`sentence-${group.sentenceIndex}`}
                      >
                        {group.tokens.map(item => {
                          if (item.type === "text") {
                            return <span aria-hidden="true" key={`text-${group.sentenceIndex}-${item.index}`}>{item.token}</span>;
                          }

                          const mark = currentPageRecord.wordMarks?.[item.wordIndex] || "";
                          const isHighlighted = highlightedWordIndex === item.wordIndex;

                          return (
                            <button
                              aria-label={`${readingMode === "marking" ? "Mark" : "Hear"} ${item.token}`}
                              className={`guided-word ${readingMode} ${mark || "neutral"} ${isHighlighted ? "heard" : ""}`}
                              key={`word-${group.sentenceIndex}-${item.index}-${item.wordIndex}`}
                              onClick={event => handleWordClick(item.wordIndex, event)}
                              onContextMenu={event => {
                                event.preventDefault();
                                playWordAudio((page.words || [])[item.wordIndex] || { text: item.token }, item.wordIndex);
                              }}
                              title={readingMode === "marking" ? "Mark word. Right-click or Alt-click to hear audio if available." : "Tap to hear word audio if available."}
                              type="button"
                            >
                              {item.token}
                            </button>
                          );
                        })}
                        {" "}
                      </span>
                    ))}
                  </AutoFitReadingText>

                  {audioNotice && <p className="guided-audio-notice">{audioNotice}</p>}
                  {pageIndex === selectedBook.pages.length - 1 && readingProgress?.completed && (
                    <p className="guided-complete-message">Book completed. You can finish again to record a reread.</p>
                  )}

                  {readingMode === "marking" && (
                    <div className="guided-mark-legend" aria-label="Word marking legend">
                      <span><b className="legend-dot correct"></b> Read correctly</span>
                      <span><b className="legend-dot support"></b> Needs support</span>
                      <span><b className="legend-dot neutral"></b> Unmarked</span>
                    </div>
                  )}

                  <details className="guided-note-drawer">
                    <summary>Page notes</summary>
                    <label className="guided-note-field">
                      <strong>Page note</strong>
                      <textarea
                        value={currentPageRecord.note || ""}
                        onChange={event => updatePageNote(event.target.value)}
                        placeholder="Add miscues, strategy use, fluency notes, or comprehension observations."
                      />
                    </label>
                  </details>

                  <details className="guided-note-drawer">
                    <summary>Comprehension prompts</summary>
                    <div className="guided-comprehension-prompts">
                      {(enrichedSelectedBook?.comprehensionQuestionSeeds || []).map(prompt => (
                        <button key={prompt} className="guided-comprehension-chip" onClick={() => speakWithBrowserVoice(prompt)} type="button">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="guided-reader-actions">
              <button
                className="lp-button lp-button-secondary"
                disabled={pageIndex === 0}
                onClick={goToPreviousPage}
                type="button"
              >
                Previous Page
              </button>
              {pageIndex < selectedBook.pages.length - 1 ? (
                <button
                  className="lp-button lp-button-primary"
                  onClick={goToNextPage}
                  type="button"
                >
                  Next Page
                </button>
              ) : (
                <button className="lp-button lp-button-primary" onClick={completeBook} type="button">
                  Finish Book
                </button>
              )}
            </div>
          </div>

          <aside className={teacherNotesOpen ? "guided-notes-panel open" : "guided-notes-panel"} aria-hidden={!teacherNotesOpen}>
            <div className="guided-notes-header">
              <h3>Teacher Notes</h3>
              <button className="lp-button lp-button-secondary" onClick={() => setTeacherNotesOpen(false)} type="button">
                Hide
              </button>
            </div>
            <textarea
              value={record.wholeBookNote || ""}
              onChange={event => updateWholeBookNote(event.target.value)}
              placeholder="Overall reading behavior, confidence, prompt level, next teaching point."
            />
            <div className="guided-mini-summary">
              <span>Attempted: {summary.attempted}</span>
              <span>Correct: {summary.correct}</span>
              <span>Support: {summary.support}</span>
              <span>Accuracy: {summary.accuracy}%</span>
            </div>
          </aside>
        </section>
      ) : showSummary ? (
        <section className="guided-reading-summary">
          <div>
            <p className="panel-label">Book Complete</p>
            <h3>{selectedBook.title}</h3>
            <p>{readingProgress?.lastReadAt ? `Last read ${new Date(readingProgress.lastReadAt).toLocaleString()}` : "Summary saved locally."}</p>
          </div>

          <div className="checkpoint-result-grid">
            <div>
              <span>Read count</span>
              <strong>{readingProgress?.readCount || 1}</strong>
            </div>
            <div>
              <span>Pages completed</span>
              <strong>{readingProgress?.completedPages || selectedBook.pages.length}/{selectedBook.pages.length}</strong>
            </div>
            <div>
              <span>Total words attempted</span>
              <strong>{summary.attempted}</strong>
            </div>
            <div>
              <span>Read correctly</span>
              <strong>{summary.correct}</strong>
            </div>
            <div>
              <span>Accuracy</span>
              <strong>{summary.accuracy}%</strong>
            </div>
          </div>

          <div className="checkpoint-detail-grid">
            <section>
              <h3>Support words</h3>
              <p>{summary.supportWords.length ? summary.supportWords.join(", ") : "No support words marked."}</p>
            </section>
            <section>
              <h3>Teacher notes</h3>
              <p>{summary.wholeBookNote || "No whole-book note yet."}</p>
              {summary.pageNotes.map(item => (
                <p key={item.page}><strong>Page {item.page}:</strong> {item.note}</p>
              ))}
            </section>
          </div>

          <div className="teacher-action-list">
            <button className="lp-button lp-button-primary" onClick={() => {
              setReaderOpen(true);
              setShowSummary(false);
            }} type="button">
              Continue Marking
            </button>
            <button className="lp-button lp-button-secondary" onClick={viewReports} type="button">
              View Reports
            </button>
            <button className="lp-button lp-button-secondary" onClick={closeReader} type="button">
              Back to Library
            </button>
          </div>
        </section>
      ) : (
        <section className="guided-reader-empty">
          <h3>Select a book to open the reader.</h3>
          <p>Books open in a focused reader with large images, page narration, normal reading text, and optional teacher marking tools.</p>
        </section>
      )}

      {recordSummaries.length > 0 && (
        <section className="teacher-action-panel">
          <h3>Saved guided reading summaries</h3>
          <div className="guided-record-list">
            {recordSummaries.map(item => (
              <article key={item.bookId}>
                <strong>{item.title}</strong>
                <span>{item.correct}/{item.attempted} correct · {item.accuracy}%</span>
                <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export function TeacherReportsPage({
  studentName,
  viewFinishedReport,
  openGuidedReading,
  guidedReadingRecords = {},
  skillMasterySummary = [],
  exportData,
  exportCSVData,
  exportReadingReport,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment
}) {
  const readingProgress = summarizeGuidedReadingProgress(guidedReadingRecords);
  const guidedSummaries = summarizeGuidedReadingRecords(guidedReadingRecords);
  const wordStatusRows = getGuidedReadingWordStatusRows(guidedReadingRecords);
  const greenWordRows = wordStatusRows.filter(row => row.status === "Read Correctly");
  const orangeWordRows = wordStatusRows.filter(row => row.status === "Needs Support");

  return (
    <div className="teacher-product-page">
      <section className="teacher-page-header">
        <div>
          <p className="panel-label">Reports</p>
          <h2>{studentName || "Student"} Reports</h2>
          <p>Review assessment results and export files from one focused report area.</p>
        </div>
      </section>

      <section className="teacher-action-panel-grid">
        <article className="teacher-action-panel">
          <h3>Student Report</h3>
          <p>Open the finished report view for checkpoint summaries, coverage, mastered items, and teacher notes.</p>
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
          <p>
            {readingProgress.totalBooksRead} books completed · {readingProgress.inProgressBooks.length} in progress · {readingProgress.totalRereads} rereads
          </p>
          <div className="guided-reading-report-mini">
            <span>Non-Fiction: {readingProgress.nonfictionCount}</span>
            <span>Latest: {readingProgress.latestReadingDate ? new Date(readingProgress.latestReadingDate).toLocaleDateString() : "Not yet"}</span>
          </div>
          {readingProgress.completedBooks.length > 0 && (
            <div className="reading-report-table compact">
              {readingProgress.completedBooks.slice(0, 6).map(row => (
                <article key={row.bookId}>
                  <strong>{row.title}</strong>
                  <span>Level {row.level} · {formatGuidedReadingType(row.type)} · read {row.readCount}x</span>
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
          {greenWordRows.length > 0 ? (
            <div className="guided-record-list compact">
              {greenWordRows.slice(0, 10).map(row => (
                <article key={`${row.bookId}-${row.page}-${row.word}-${row.date}-green`}>
                  <strong>{row.word}</strong>
                  <span>{row.title} · Level {row.level} · Page {row.page}</span>
                  <span>Count: {row.count}</span>
                </article>
              ))}
            </div>
          ) : (
            <p>No green words marked yet.</p>
          )}
        </article>

        <article className="teacher-action-panel">
          <h3>Words Needing Support</h3>
          {orangeWordRows.length > 0 ? (
            <div className="guided-record-list compact">
              {orangeWordRows.slice(0, 10).map(row => (
                <article key={`${row.bookId}-${row.page}-${row.word}-${row.date}-orange`}>
                  <strong>{row.word}</strong>
                  <span>{row.title} · Level {row.level} · Page {row.page}</span>
                  <span>Count: {row.count}</span>
                </article>
              ))}
            </div>
          ) : (
            <p>No orange support words marked yet.</p>
          )}
        </article>

        <article className="teacher-action-panel">
          <h3>Guided Reading Conference Notes</h3>
          {guidedSummaries.length > 0 ? (
            <div className="guided-record-list compact">
              {guidedSummaries.map(item => (
                <article key={item.bookId}>
                  <strong>{item.title}</strong>
                  <span>{item.correct}/{item.attempted} correct · {item.accuracy}%</span>
                  <span>{item.supportWords.length ? `Support: ${item.supportWords.join(", ")}` : "No support words marked"}</span>
                </article>
              ))}
            </div>
          ) : (
            <p>No guided reading records saved for this student yet.</p>
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
  onAdaptiveReset,
  onFullReset,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card reset-progress-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-progress-title">
        <h2 id="reset-progress-title">Reset Student Progress</h2>
        <p>
          This will keep {studentName || "the student"} and the class in place. Choose the scope carefully.
        </p>

        <div className="reset-progress-options">
          <button
            className="main-button"
            disabled={resetting}
            onClick={onAdaptiveReset}
            type="button"
          >
            Reset adaptive assessment progress only
          </button>
          <p>
            Clears checkpoint progress, skill progression, item mastery, and adaptive answer history for this student.
            Formal EL assessment results stay available.
          </p>

          <button
            className="reset-button"
            disabled={resetting}
            onClick={onFullReset}
            type="button"
          >
            Reset all student assessment data including formal EL results
          </button>
          <p>
            Also clears local Letter Name/Sound and Advanced Phonics assessment results for this selected student.
          </p>
        </div>

        <div className="button-row">
          <button
            className="report-button"
            disabled={resetting}
            onClick={onCancel}
            type="button"
          >
            Cancel
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
  const initialContinueLabel =
    isInitialSoundsCheckpoint && currentLevelMastered && initialLevel === 1
      ? "Start Level 2"
      : isInitialSoundsCheckpoint && initialLevel === 2
        ? "Continue Level 2"
        : "Continue this skill to build mastery";

  return (
    <main className="assessment-shell checkpoint-decision-shell">
      <section className="card checkpoint-decision-card">
        <p className="panel-label">Checkpoint complete</p>
        <h2>You completed {completedText}.</h2>

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
                Level 2 stays locked until every Level 1 sound has enough correct examples.
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
              <button className="main-button" onClick={continueSkill} type="button">
                {initialContinueLabel}
              </button>

              {isInitialSoundsCheckpoint && levelOneMastered && (
                <button className="report-button" onClick={reviewInitialSoundLevelOne} type="button">
                  Review Level 1
                </button>
              )}

              <button
                className="report-button"
                disabled={!canMoveNext}
                onClick={moveToNextSkill}
                type="button"
              >
                Move to next skill{checkpoint.nextSkillLabel ? `: ${checkpoint.nextSkillLabel}` : ""}
              </button>
            </>
          ) : (
            <>
              <button className="main-button" onClick={checkpoint.accuracyPassed ? continueSkill : retrySkill} type="button">
                {checkpoint.accuracyPassed ? "Keep going in this skill" : "Retry this skill"}
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
  exportPatternAssessment,
  resetPatternAssessment
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
              className="report-button"
              onClick={exportPatternAssessment}
            >
              Export Pattern Excel
            </button>

            <button
              className="reset-button"
              onClick={resetPatternAssessment}
            >
              Restart Pattern Assessment
            </button>
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
  exportLetterAssessment,
  resetLetterAssessment
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
              className="report-button"
              onClick={exportLetterAssessment}
            >
              Export Letter Excel
            </button>

            <button
              className="reset-button"
              onClick={resetLetterAssessment}
            >
              Restart Letter Assessment
            </button>
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
  assessmentMode
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
    currentQuestion?.questionType === "listen_and_find_word";
  const isPairSelection =
    ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(currentQuestion?.questionType);
  const isVisualCardChoice =
    currentQuestion?.questionType === "visual_card_choice";
  const isIxlStyleTemplate =
    currentQuestion?.questionType === "ixl_template";
  const isFinalSoundsEndingItem = isFinalSoundsEndingQuestion(currentQuestion);
  const isRhymingPictureItem = isRhymingPictureQuestion(currentQuestion);

  if (!currentQuestion && !feedback) {
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
  const promptAudioPath = isRhymingPictureItem
    ? ""
    : getApprovedAudioPath(promptAudioText, isPairSelection ? currentQuestion?.audioPath || "" : "");
  const normalizedChoices = (currentQuestion?.choices || []).map(choice => ({
    ...normalizeAnswerOption(choice),
    media: getAnswerOptionMedia(choice)
  }));
  const textChoiceAudioPaths = Object.fromEntries(
    normalizedChoices.map(choice => [
      choice.value,
      getApprovedAudioPath(choice.label, choice.media.audio || "")
    ])
  );
  const showTextChoiceAudio =
    !isListenAndFindWord &&
    !isPairSelection &&
    !isVisualCardChoice &&
    !isIxlStyleTemplate &&
    normalizedChoices.length > 0 &&
    normalizedChoices.every(choice => Boolean(textChoiceAudioPaths[choice.value]));

  return (
    <main className="assessment-shell">
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

        <button className="reset-button assessment-end-button" onClick={endAssessment}>
          End Assessment
        </button>
      </div>

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
              isRhymingPictureItem ? "rhyming-assessment-layout" : ""
            ].filter(Boolean).join(" ")}
            key={currentQuestion.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <div className="question-line assessment-prompt">
              {promptAudioPath && (
                <AssessmentAudioButton
                  text={promptAudioText}
                  audioPath={promptAudioPath}
                  speakText={speakText}
                  label="Listen to question"
                  className={isPairSelection ? "mini-audio-button instruction-audio-button" : "mini-audio-button"}
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
              <div className={isListenAndFindWord ? "choices visual-word-choices assessment-answer-grid" : "choices assessment-answer-grid"}>
                {normalizedChoices.map((choice, index) => {
                  const choiceImage = currentQuestion.choiceImages?.[choice.value] || currentQuestion.choiceImages?.[choice.label] || {};
                  const choiceButtonClassName = [
                    isListenAndFindWord ? "choice-button visual-word-choice assessment-answer-card" : "choice-button assessment-answer-card",
                    isFinalSoundsEndingItem ? "final-sound-choice-button" : ""
                  ].filter(Boolean).join(" ");

                  return (
                  <div
                    className={isListenAndFindWord ? "choice-wrap visual-word-choice-wrap" : "choice-wrap"}
                    key={index}
                  >
                    {showTextChoiceAudio && (
                      <AssessmentAudioButton
                        text={choice.label}
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
                      {isListenAndFindWord && choiceImage.image && (
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

      {feedback && (
        <motion.div
          className={
            feedback.isCorrect
              ? "feedback-card assessment-feedback correct-feedback"
              : "feedback-card assessment-feedback wrong-feedback"
          }
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
                      {feedback.support.correctWords.map(word => {
                        const card = feedback.support.cardsByWord[word];
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
                      {feedback.support.chosenWords.map(word => {
                        const card = feedback.support.cardsByWord[word];
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
                setFeedback(null);
                pickQuestion();
              }}
            >
              Continue
            </button>
          )}
        </motion.div>
      )}

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
  exportPatternAssessment
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
      </div>
    </div>
  );
}
