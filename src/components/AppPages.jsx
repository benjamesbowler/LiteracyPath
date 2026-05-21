import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function FixSentenceQuestion({ currentQuestion, answerQuestion }) {
  const [selectedTiles, setSelectedTiles] = useState([]);

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
          Clear
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
  switchStudent,
  viewReport
}) {
  const steps = [
    { id: "select", label: "Class/Student Select" },
    { id: "overview", label: "Student Overview" },
    { id: "assessment", label: "Assessment" },
    { id: "finished", label: "Report" }
  ];

  const activeStep =
    appView === "letters" || appView === "advancedPhonics" ? "assessment" : appView;

  return (
    <nav className="top-nav" aria-label="Teacher navigation">
      <div className="breadcrumb">
        {steps.map((step, index) => (
          <span
            className={
              step.id === activeStep
                ? "breadcrumb-step active"
                : "breadcrumb-step"
            }
            key={step.id}
          >
            {step.label}
            {index < steps.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </span>
        ))}
      </div>

      <div className="top-nav-meta">
        <span>{nameSaved ? studentName || "Unnamed student" : "No student selected"}</span>
        {nameSaved && currentStage && <span>{currentStage.label}</span>}
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
      </div>
    </nav>
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
  setShowClassDashboard
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
                  <th>Mastered</th>
                  <th>Current Skill</th>
                  <th>Last Active</th>
                  <th>Open</th>
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
  setAppView,
  switchStudent
}) {
  const strongestAreas =
    weaknessSnapshot.strongest.slice(0, 3);

  const needsPractice =
    weaknessSnapshot.needsPractice.slice(0, 4);

  const suggestedFocus =
    weaknessSnapshot.suggestedNextFocus;

  return (
    <div className="card page-card page-stack">
      <h2>Student Overview</h2>

      <p><strong>Student:</strong> {studentName || "Unnamed student"}</p>
      <p><strong>Current skill:</strong> {currentSkillIndex + 1}. {currentStage.label}</p>
      <p><strong>Overall accuracy:</strong> {accuracy}%</p>
      <p><strong>Questions answered:</strong> {totalAnswered}</p>
      <p><strong>Mastery rule:</strong> {passScore}/{roundLength} correct to unlock this skill.</p>

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

      <section className="overview-actions section-grid" aria-label="Student overview actions">
        <div className="overview-action-card primary-action-card">
          <div>
            <h3>Primary</h3>
            <p>Continue the mastery path for this student.</p>
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
            className="card assessment-card"
            key={currentQuestion.id}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            {shouldShowImage(currentQuestion) && (
              <div className="image-box">
                <img
                  src={currentQuestion.imagePath}
                  alt="question visual"
                  className="question-image"
                />
              </div>
            )}

            {currentQuestion.passage && (
              <div className="passage-wrap">
                <p className="passage">{currentQuestion.passage}</p>
              </div>
            )}

            <div className="question-line">
              <button
                className="mini-audio-button"
                onClick={() => speakText(currentQuestion.spokenPrompt || currentQuestion.prompt || currentQuestion.question)}
                aria-label="Listen to question"
                type="button"
              >
                🔊
              </button>
              <h2>{currentQuestion.prompt || currentQuestion.question}</h2>
            </div>

            <button className="flag-button" onClick={flagCurrentQuestion}>
              ⚠️ Flag Question
            </button>

            {currentQuestion.questionType === "fix_sentence" ? (
              <FixSentenceQuestion
                currentQuestion={currentQuestion}
                answerQuestion={answerQuestion}
              />
            ) : (
              <div className="choices">
                {currentQuestion.choices.map((choice, index) => (
                  <div className="choice-wrap" key={index}>
                    <button
                      className="choice-audio"
                      onClick={() => speakText(choice)}
                      aria-label={`Listen to ${choice}`}
                      type="button"
                    >
                      🔊
                    </button>
                    <button
                      className="choice-button"
                      onClick={() => answerQuestion(choice)}
                    >
                      {choice}
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
          <h2>{feedback.isCorrect ? "Correct!" : "Let's learn from that one"}</h2>

          <p><strong>Your answer:</strong> {feedback.chosen}</p>
          <p><strong>Correct answer:</strong> {feedback.correct}</p>

          {!feedback.isCorrect && (
            <div className="teaching-slide">
              <h3>Teaching Tip</h3>
              <p>{feedback.explanation}</p>
              <p><strong>Skill focus:</strong> {feedback.skill}</p>
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
  allowPassageAudio,
  setAllowPassageAudio,
  exportData,
  exportCSVData
}) {
  return (
    <div className="report-panel page-stack">
      <h2>Finished Report</h2>

      <div className="button-row">
        <button className="main-button" onClick={startAssessment}>
          Enter Full Screen Assessment
        </button>

        <button className="report-button" onClick={goToOverview}>
          Student Overview
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
      <p><strong>Mastery rule:</strong> 9/10 correct to unlock the next skill.</p>

      <h3>Skill Mastery</h3>

      {skillTree.map((stage, index) => {
        const data = mastery[stage.id];

        return (
          <div className="skill-row" key={stage.id}>
            <span>{index + 1}. {stage.label}</span>
            <span>{data?.mastered ? "Mastered" : index === currentSkillIndex ? "Current" : "Locked"}</span>
            <span>{data ? `${data.lastScore}/${data.lastTotal}` : "-"}</span>
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
      </div>
    </div>
  );
}
