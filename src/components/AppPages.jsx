import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getApprovedAudioPath } from "../data/audioPreferenceManifest";
import {
  getApprovedCardAudioPath,
  shouldShowUniformCardAudio
} from "../assessmentContentValidation";

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
      <div>
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
  switchStudent,
  viewReport,
  teacherEmail,
  logOutTeacher,
  isAdmin,
  openAdminDashboard,
  openChildMode
}) {
  const steps = [
    { id: "select", label: "Class/Student Select" },
    { id: "overview", label: "Student Overview" },
    { id: "assessment", label: "Assessment" },
    { id: "finished", label: "Report" }
  ];

  const activeStep =
    appView === "letters" || appView === "advancedPhonics" ? "assessment" : appView;
  const infoItems = [
    ...steps.map(step => ({ id: step.id, label: step.label, active: step.id === activeStep })),
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
          className="nav-button"
          onClick={goToOverview}
          disabled={!nameSaved}
        >
          Student Overview
        </button>

        <button className="nav-button" onClick={switchStudent}>
          Switch Student
        </button>

        <button
          className="nav-button primary"
          onClick={viewReport}
          disabled={!nameSaved}
        >
          View Report
        </button>

        {isAdmin && (
          <>
            <button className="nav-button" onClick={openChildMode}>
              Learning World
            </button>

            <button className="nav-button" onClick={openAdminDashboard}>
              Admin Dashboard
            </button>
          </>
        )}

        <button className="nav-button" onClick={logOutTeacher}>
          Log Out
        </button>
      </div>
    </nav>
  );
}


export function QuestionFlagDialog({
  open,
  question,
  issueType,
  setIssueType,
  note,
  setNote,
  submitting,
  onSubmit,
  onCancel,
  getDiagnosticTarget
}) {
  if (!open || !question) return null;

  const choices = question.choices || question.tiles || [];
  const questionText = question.prompt || question.question || question.brokenSentence || "Untitled question";
  const correctAnswer = question.questionType === "fix_sentence"
    ? question.correctSentence
    : question.answer;
  const diagnosticTarget = question.diagnosticTarget || getDiagnosticTarget(question);
  const issueOptions = [
    "Incorrect answer",
    "Confusing wording",
    "Too hard",
    "Too easy",
    "Bad audio",
    "Bad image",
    "Wrong skill",
    "Other"
  ];

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="flag-dialog" role="dialog" aria-modal="true" aria-label="Flag question for review">
        <div className="page-stack">
          <div>
            <h2>Flag Question</h2>
            <p className="muted-text">This sends the item to the app owner for review.</p>
          </div>

          <div className="flag-question-summary">
            <p><strong>Question:</strong> {questionText}</p>
            <p><strong>Skill:</strong> {question.skill || "Unknown skill"}</p>
            <p><strong>Diagnostic target:</strong> {diagnosticTarget || "General"}</p>
            <p><strong>Correct answer:</strong> {correctAnswer || "Not set"}</p>

            {choices.length > 0 && (
              <div>
                <strong>Answer choices:</strong>
                <ul>
                  {choices.map((choice, index) => (
                    <li key={String(choice) + "-" + index}>{choice}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <label className="auth-field">
            <strong>Issue type</strong>
            <select value={issueType} onChange={event => setIssueType(event.target.value)}>
              {issueOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="auth-field">
            <strong>What is wrong with this question?</strong>
            <textarea
              className="flag-note-input"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Optional teacher note"
              rows={4}
            />
          </label>

          <div className="button-row flag-dialog-actions">
            <button className="reset-button" onClick={onCancel} disabled={submitting} type="button">
              Cancel
            </button>
            <button className="main-button" onClick={onSubmit} disabled={submitting} type="button">
              {submitting ? "Submitting..." : "Submit Flag"}
            </button>
          </div>
        </div>
      </div>
    </div>
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
          const selected = selectedWords.includes(card.word);

          return (
            <article
              className={selected ? "initial-sound-card selected" : "initial-sound-card"}
              key={card.word}
            >
              <button
                className="initial-sound-image-button"
                onClick={() => toggleWord(card.word)}
                aria-pressed={selected}
                aria-label={`Select picture for ${card.word}`}
                type="button"
              >
                <img src={card.image} alt={card.alt || `Picture for ${card.word}`} />
                {!currentQuestion.hideWrittenLabels && <strong>{card.word}</strong>}
              </button>

              {showCardAudio && (
                <AssessmentAudioButton
                  text={card.word}
                  audioPath={getApprovedCardAudioPath(card)}
                  speakText={speakText}
                  label={`Hear ${card.word}`}
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
  const showCardAudio = shouldShowUniformCardAudio(currentQuestion.imageCards || []);

  return (
    <div className="visual-card-choice-panel">
      <div className="visual-card-grid">
        {(currentQuestion.imageCards || []).map(card => {
          return (
            <article className="visual-assessment-card" key={card.id || card.word}>
              <button
                className="visual-assessment-card-button"
                onClick={() => answerQuestion(card.value || card.word)}
                aria-label={`Choose ${card.word}`}
                type="button"
              >
                {card.image && (
                  <img src={card.image} alt={card.alt || `Picture for ${card.word}`} />
                )}
                {!currentQuestion.hideWrittenLabels && <strong>{card.word}</strong>}
              </button>

              {showCardAudio && (
                <AssessmentAudioButton
                  text={card.word}
                  audioPath={getApprovedCardAudioPath(card)}
                  speakText={speakText}
                  label={`Hear ${card.word}`}
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

function AssessmentStimulus({ currentQuestion, isListenAndFindWord, isPairSelection, isVisualCardChoice, speakText, shouldShowImage }) {
  const approvedStimulusAudioPath = getApprovedAudioPath(
    currentQuestion.audioText || currentQuestion.targetWord || currentQuestion.answer,
    currentQuestion.audioPath
  );
  const hasPromptImages = currentQuestion.promptImageCards?.length > 0;
  const hasPassage = Boolean(currentQuestion.passage || currentQuestion.sentence || currentQuestion.context);
  const hasMainImage = shouldShowImage(currentQuestion) || (
    currentQuestion.imagePath &&
    (
      currentQuestion.formatType === "PICTURE_TO_PRINT_MATCH" ||
      currentQuestion.formatType === "PLURAL_IMAGE_SPELLING" ||
      currentQuestion.question?.toLowerCase().includes("matches the picture")
    )
  );
  const shouldShowListeningVisual =
    !hasPromptImages &&
    !hasPassage &&
    !hasMainImage &&
    !isPairSelection &&
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
            src={currentQuestion.imagePath}
            alt="question visual"
            className="question-image assessment-main-image"
          />
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
  flags,
  teachers,
  classes,
  students,
  statusFilter,
  setStatusFilter,
  loading,
  refreshDashboard,
  resolveFlag,
  reopenFlag,
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
            <p className="muted-text">Review flagged questions and manage app data.</p>
          </div>

          <div className="button-row admin-controls">
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="open">Open flags</option>
              <option value="resolved">Resolved flags</option>
              <option value="all">All flags</option>
            </select>
            <button className="report-button" onClick={refreshDashboard} disabled={loading} type="button">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="report-panel page-stack admin-section">
        <h3>Flagged Questions</h3>

        {flags.length === 0 ? (
          <p>No flagged questions for this filter.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Student</th>
                  <th>Skill</th>
                  <th>Question</th>
                  <th>Choices</th>
                  <th>Correct</th>
                  <th>Issue</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {flags.map(flag => (
                  <tr key={flag.id}>
                    <td>{flag.status}</td>
                    <td>{flag.created_at ? new Date(flag.created_at).toLocaleString() : ""}</td>
                    <td>{flag.teacher_email || flag.teacher_id}</td>
                    <td>{flag.class_name}</td>
                    <td>{flag.student_name}</td>
                    <td>
                      <strong>{flag.skill}</strong>
                      <div className="muted-text">{flag.diagnostic_target}</div>
                    </td>
                    <td className="admin-question-cell">{flag.question_text}</td>
                    <td>{Array.isArray(flag.choices) ? flag.choices.join(", ") : ""}</td>
                    <td>{flag.correct_answer}</td>
                    <td>{flag.issue_type}</td>
                    <td>{flag.note}</td>
                    <td>
                      {flag.status === "resolved" ? (
                        <button className="report-button" onClick={() => reopenFlag(flag.id)} type="button">
                          Reopen
                        </button>
                      ) : (
                        <button className="report-button" onClick={() => resolveFlag(flag.id)} type="button">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  <th>Flags</th>
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
                    <td>{teacher.flags}</td>
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
  childLearningEvidence,
  setAppView,
  switchStudent,
  letterAssessment = [],
  patternAssessment = [],
  exportLetterAssessment,
  exportPatternAssessment
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

  const childEvidence = childLearningEvidence || {
    tableMissing: false,
    worldsPlayed: [],
    missionsCompleted: [],
    attempted: 0,
    correct: 0,
    recentAccuracy: null,
    masteredWords: [],
    focus: "No Child Learning World practice yet",
    supportNeeds: [],
    lastPlayed: null,
    masteryChips: []
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

  return (
    <div className="card page-card page-stack">
      <h2>Student Overview</h2>

      <p><strong>Student:</strong> {studentName || "Unnamed student"}</p>
      <p><strong>Current skill:</strong> {currentSkillIndex + 1}. {currentStage.label}</p>
      <p><strong>Overall accuracy:</strong> {accuracy}%</p>
      <p><strong>Questions answered:</strong> {totalAnswered}</p>
      <p><strong>Checkpoint rule:</strong> {passScore}/{roundLength} correct to unlock the next skill.</p>
      <p className="muted-text">Checkpoint means enough evidence to proceed. Mastery coverage means item-level completion within the skill.</p>

      <section className="checkpoint-coverage-panel">
        <div className="coverage-card">
          <div className="coverage-card-header">
            <strong>Checkpoint Progress</strong>
            <span>{checkpointPassed ? "Checkpoint Passed" : `${roundCorrect}/${roundLength} correct`}</span>
          </div>
          <div className="coverage-bar" aria-label="Checkpoint progress">
            <span style={{ width: `${checkpointPercent}%` }}></span>
          </div>
          <p>{passScore}/{roundLength} correct gate keeps the current unlock logic.</p>
        </div>

        <div className="coverage-card">
          <div className="coverage-card-header">
            <strong>Item Coverage Progress</strong>
            <span>{currentCoverage.mastered}/{currentCoverage.total} {currentCoverage.unit} mastered</span>
          </div>
          <div className="coverage-bar secondary" aria-label="Item coverage progress">
            <span style={{ width: `${coveragePercent}%` }}></span>
          </div>
          <p>Coverage source: item_mastery rows.</p>
        </div>
      </section>

      <label>
        <strong>Start or adjust skill level:</strong>
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

      <section className="weakness-snapshot">
        <h3>Weakness Snapshot</h3>

        <div className="weakness-grid">
          <div>
            <strong>Strongest areas</strong>
            {strongestAreas.length > 0 ? (
              <ul>
                {strongestAreas.map(item => (
                  <li key={`${item.stage}-${item.target}`}>
                    {item.target} ({item.correct}/{item.total})
                  </li>
                ))}
              </ul>
            ) : (
              <p>Not enough data yet.</p>
            )}
          </div>

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
            <strong>Suggested next focus</strong>
            <p>
              {suggestedFocus
                ? `${suggestedFocus.target} in ${suggestedFocus.stage}`
                : "Complete more questions to build a recommendation."}
            </p>
          </div>
        </div>
      </section>

      <section className="child-learning-panel">
        <div className="child-learning-header">
          <div>
            <p className="panel-label">Child Learning World Practice Data</p>
            <h3>Child Learning World Progress</h3>
          </div>
          <span className="practice-source-label">Separate from EL assessments and reports</span>
        </div>

        {childEvidence.tableMissing ? (
          <p className="child-learning-empty">
            Child Learning World practice data is not available yet.
          </p>
        ) : childEvidence.attempted === 0 ? (
          <p className="child-learning-empty">
            No Child Learning World practice has been recorded for this student yet.
          </p>
        ) : (
          <>
            <div className="child-learning-grid">
              <div>
                <strong>Worlds Played</strong>
                <p>{childEvidence.worldsPlayed.join(", ") || "None yet"}</p>
              </div>

              <div>
                <strong>Child Mode Accuracy</strong>
                <p>{childEvidence.attempted} attempted / {childEvidence.correct} correct / {childEvidence.recentAccuracy ?? 0}% recent</p>
              </div>

              <div>
                <strong>Current Focus / Needs Support</strong>
                <p>{childEvidence.focus}</p>
              </div>

              <div>
                <strong>Last Played</strong>
                <p>{childEvidence.lastPlayed ? new Date(childEvidence.lastPlayed).toLocaleString() : "No activity yet"}</p>
              </div>
            </div>

            <div className="child-learning-lists">
              <div>
                <strong>Missions Completed</strong>
                {childEvidence.missionsCompleted.length > 0 ? (
                  <ul>
                    {childEvidence.missionsCompleted.map(mission => (
                      <li key={mission}>{mission}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No missions completed yet.</p>
                )}
              </div>

              <div>
                <strong>Mastered Child Mode Words</strong>
                {childEvidence.masteredWords.length > 0 ? (
                  <div className="word-chip-row">
                    {childEvidence.masteredWords.map(word => (
                      <span className="word-chip mastered" key={word}>{word}</span>
                    ))}
                  </div>
                ) : (
                  <p>No Child Mode words mastered yet.</p>
                )}
              </div>
            </div>

            <div className="mastery-chip-row" aria-label="Child Mode mastery status">
              {childEvidence.masteryChips.map(item => (
                <span className={`mastery-chip ${item.status}`} key={item.word}>
                  {item.word}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      <details className="item-mastery-debug">
        <summary>Developer item mastery snapshot</summary>

        <p className="muted-text">
          Note: Child Mode evidence is tagged separately as child_mode and is not part of formal EL assessment exports yet.
        </p>

        <div className="item-mastery-grid">
          <div>
            <strong>Mastered items</strong>
            {itemSnapshot.mastered.length > 0 ? (
              <ul>
                {itemSnapshot.mastered.map(item => (
                  <li key={item.itemType + "-" + item.itemKey}>
                    {formatItemLabel(item)}
                  </li>
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
                  <li key={item.itemType + "-" + item.itemKey}>
                    {formatItemLabel(item)}
                  </li>
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

          <div>
            <strong>Question format evidence</strong>
            {itemSnapshot.evidence.length > 0 ? (
              <ul>
                {itemSnapshot.evidence.map(item => (
                  <li key={item.itemType + "-evidence-" + item.itemKey}>
                    {formatEvidenceLabel(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No format evidence recorded yet.</p>
            )}
          </div>
        </div>
      </details>

      <section className="overview-actions section-grid" aria-label="Student overview actions">
        <div className="overview-action-card primary-action-card">
          <div>
            <h3>Primary</h3>
            <p>Continue the checkpoint path for this student.</p>
          </div>

          <button className="main-button overview-action-button" onClick={startAssessment}>
            Enter Full Screen Assessment
          </button>
        </div>

        <div className="overview-action-card">
          <div>
            <h3>Review</h3>
            <p>Practice the weakest recent target when enough data exists.</p>
          </div>

          <button
            className="report-button overview-action-button"
            disabled={!suggestedFocus}
            onClick={startTargetedReview}
          >
            Start Targeted Review
          </button>
        </div>

        <div className="overview-action-card tools-action-card">
          <div>
            <h3>Assessment Tools</h3>
            <p>Run focused supplemental assessments.</p>
          </div>

          <div className="overview-button-group button-row">
            <button
              className="report-button overview-action-button"
              onClick={() => setAppView("letters")}
            >
              Letter Name and Sound Assessment
            </button>

            <button
              className="report-button overview-action-button"
              onClick={startAdvancedPhonicsAssessment}
            >
              Advanced Phonics Pattern Assessment
            </button>

            {letterAssessment.length > 0 && (
              <button
                className="report-button overview-action-button secondary"
                onClick={exportLetterAssessment}
                type="button"
              >
                Export Letter Excel
              </button>
            )}

            {patternAssessment.length > 0 && (
              <button
                className="report-button overview-action-button secondary"
                onClick={exportPatternAssessment}
                type="button"
              >
                Export Pattern Excel
              </button>
            )}
          </div>
        </div>

        <div className="overview-action-card reports-action-card">
          <div>
            <h3>Reports</h3>
            <p>Review results or choose another student.</p>
          </div>

          <div className="overview-button-group button-row">
            <button
              className="report-button overview-action-button"
              onClick={() => setAppView("finished")}
            >
              View Report
            </button>

            <button className="report-button overview-action-button secondary" onClick={switchStudent}>
              Switch Student
            </button>
          </div>
        </div>
      </section>
    </div>
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
  flagCurrentQuestion,
  answerQuestion,
  speakText,
  message,
  endAssessment,
  assessmentMode
}) {
  const isListenAndFindWord =
    currentQuestion?.questionType === "listen_and_find_word";
  const isPairSelection =
    ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(currentQuestion?.questionType);
  const isVisualCardChoice =
    currentQuestion?.questionType === "visual_card_choice";
  const promptAudioText =
    currentQuestion?.spokenPrompt ||
    currentQuestion?.prompt ||
    currentQuestion?.question ||
    currentQuestion?.audioText ||
    "";
  const promptAudioPath = getApprovedAudioPath(promptAudioText, isPairSelection ? currentQuestion?.audioPath || "" : "");
  const textChoiceAudioPaths = Object.fromEntries(
    (currentQuestion?.choices || []).map(choice => [
      choice,
      getApprovedAudioPath(choice)
    ])
  );
  const showTextChoiceAudio =
    !isListenAndFindWord &&
    !isPairSelection &&
    !isVisualCardChoice &&
    currentQuestion?.choices?.length > 0 &&
    currentQuestion.choices.every(choice => Boolean(textChoiceAudioPaths[choice]));

  return (
    <main className="assessment-shell">
      <div className="assessment-topbar">
        <div className="assessment-meta">
          <span>{studentName || "Unnamed student"}</span>
          <strong>
            {assessmentMode === "targetedReview"
              ? "Targeted Review"
              : `${currentSkillIndex + 1}. ${currentStage.label}`}
          </strong>
        </div>

        <div className="assessment-progress">
          <div className="progress-label">
            Mastery Round Progress: {roundAnswers.length}/{roundLength}
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${roundProgress}%` }}
            ></div>
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
            className="card assessment-card assessment-question-layout"
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
              <h2>{currentQuestion.prompt || currentQuestion.question}</h2>
            </div>

            <AssessmentStimulus
              currentQuestion={currentQuestion}
              isListenAndFindWord={isListenAndFindWord}
              isPairSelection={isPairSelection}
              isVisualCardChoice={isVisualCardChoice}
              speakText={speakText}
              shouldShowImage={shouldShowImage}
            />

            <button className="flag-button" onClick={flagCurrentQuestion}>
              ⚠️ Flag Question
            </button>

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
            ) : currentQuestion.questionType === "fix_sentence" ? (
              <FixSentenceQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
              />
            ) : (
              <div className={isListenAndFindWord ? "choices visual-word-choices assessment-answer-grid" : "choices assessment-answer-grid"}>
                {currentQuestion.choices.map((choice, index) => (
                  <div
                    className={isListenAndFindWord ? "choice-wrap visual-word-choice-wrap" : "choice-wrap"}
                    key={index}
                  >
                    {showTextChoiceAudio && (
                      <AssessmentAudioButton
                        text={choice}
                        audioPath={textChoiceAudioPaths[choice]}
                        speakText={speakText}
                        label={`Listen to ${choice}`}
                        className="choice-audio"
                      />
                    )}
                    <button
                      className={isListenAndFindWord ? "choice-button visual-word-choice assessment-answer-card" : "choice-button assessment-answer-card"}
                      onClick={() => answerQuestion(choice)}
                    >
                      {isListenAndFindWord && currentQuestion.choiceImages?.[choice]?.image && (
                        <img
                          src={currentQuestion.choiceImages[choice].image}
                          alt={currentQuestion.choiceImages[choice].alt || `Picture for ${choice}`}
                          className="visual-word-choice-image"
                        />
                      )}
                      <span>{choice}</span>
                    </button>
                  </div>
                ))}
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
              <p><strong>Your answer:</strong> {feedback.chosen}</p>
              <p><strong>Correct answer:</strong> {feedback.correct}</p>
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

          <button
            className="main-button"
            onClick={() => {
              setFeedback(null);
              pickQuestion();
            }}
          >
            Continue
          </button>
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
