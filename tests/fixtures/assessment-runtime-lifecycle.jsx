import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/App.css";
import { AssessmentPage, CheckpointDecisionPage } from "../../src/components/AppPages.jsx";
import { createAssessmentRoundController } from "../../src/appState/assessmentRoundController.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { prepareRuntimeQuestionBank } from "../../src/appState/assessmentRuntime.js";
import { loadAssessmentAttempts, saveAssessmentAttemptLocal } from "../../src/data/assessmentHistoryStore.js";
import * as mediaPicker from "../../src/data/assessmentMediaPicker.js";
import { excludeFailedAssessmentMediaQuestions } from "../../src/policy/assessmentMediaEvidence.js";
import { getSkillBlueprint, RETENTION_RULE } from "../../src/content/blueprints/skillBlueprints.js";
import { skillTree } from "../../src/skillTree.js";
import { APP_VIEWS } from "../../src/appState/appViews.js";

const TEACHER = "runtime-integration-teacher", KEY = "assessment-runtime-integration-draft";
const blank = studentId => ({ studentId, currentSkillIndex: 0, currentQuestion: null, feedback: null, roundAnswers: [], roundItemKeys: [], roundQuestionIds: [], answerHistory: [], itemMastery: {}, itemSessionSeen: {}, mastery: {}, usedByStage: {}, message: "", assessmentMode: "mastery", assessmentTransitioning: false, appView: "idle", totalAnswered: 0, correctAnswered: 0 });
function Fixture() {
  const [state, setState] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY))?.state || blank("A"); } catch { return blank("A"); } });
  const restored = useRef(JSON.parse(localStorage.getItem(KEY) || "null"));
  const assessmentSittingRef = useRef(restored.current?.plan || null);
  const allQuestionsRef = useRef([]), answerHistoryRef = useRef(state.answerHistory), answerInFlightRef = useRef(false);
  const roundItemKeysRef = useRef(state.roundItemKeys), roundQuestionIdsRef = useRef(state.roundQuestionIds);
  const activeRef = useRef(state.appView === APP_VIEWS.ASSESSMENT);
  const pendingRef = useRef({ current: null, revision: 0 });
  const failedRef = useRef({ failedQuestionIds: new Set(), failedSources: new Set() });
  const mediaRef = useRef(mediaPicker), usageRef = useRef(mediaPicker.createAssessmentSessionMediaUsage());
  const initialQueue = useRef([]), initialMeta = useRef(null), initialForced = useRef(null), initialAsked = useRef(new Set());
  const stage = skillTree[state.currentSkillIndex], owner = `${state.studentId}:${TEACHER}`;
  pendingRef.current.owner = owner;
  const setters = {};
  for (const key of ["answerHistory", "appView", "assessmentHistory", "assessmentTransitioning", "checkpointDecision", "correctAnswered", "currentQuestion", "diagnosticFollowUp", "feedback", "itemMastery", "itemSessionSeen", "mastery", "message", "roundAnswers", "roundItemKeys", "roundQuestionIds", "showConfetti", "totalAnswered", "usedByStage", "assessmentSaveState"]) {
    setters[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => setState(previous => ({ ...previous, [key]: typeof value === "function" ? value(previous[key]) : value }));
  }
  const length = state.assessmentMode === "retention" ? RETENTION_RULE.items : getSkillBlueprint(stage.id).sitting;
  const controller = createAssessmentRoundController({
    ...state, ...setters, currentStage: stage, teacherId: TEACHER, studentName: state.studentId, selectedClassId: "local-test-class",
    allQuestionsRef, answerHistoryRef, answerInFlightRef, assessmentActiveRef: activeRef,
    assessmentSittingRef, roundItemKeysRef, roundQuestionIdsRef,
    assessmentMediaPickerRef: mediaRef, assessmentMediaUsageRef: usageRef, failedAssessmentMediaRef: failedRef,
    initialSoundRoundQueueRef: initialQueue, initialSoundRoundMetaRef: initialMeta, initialSoundForcedLevelRef: initialForced, initialSoundRoundAskedLettersRef: initialAsked,
    pendingAssessmentCompletionRef: pendingRef.current, assessmentCompletionOwner: owner,
    ROUND_LENGTH: length, PASS_SCORE: state.assessmentMode === "retention" ? RETENTION_RULE.passMin : Math.ceil(length * 0.7),
    resetAssessmentMediaUsage: () => { usageRef.current = mediaPicker.createAssessmentSessionMediaUsage(); },
    excludeSessionMediaFailures: bank => excludeFailedAssessmentMediaQuestions(bank, failedRef.current), weaknessSnapshot: {}
  });
  useEffect(() => {
    answerHistoryRef.current = state.answerHistory;
    roundItemKeysRef.current = state.roundItemKeys;
    roundQuestionIdsRef.current = state.roundQuestionIds;
    localStorage.setItem(KEY, JSON.stringify({ state, plan: assessmentSittingRef.current }));
  }, [state]);
  const latest = useRef(null);
  latest.current = { state, controller };
  useEffect(() => {
    if (!restored.current?.plan) return;
    const saved = restored.current; restored.current = null;
    void loadAssessmentSkillBank(saved.plan.skillId, { retention: saved.plan.mode === "retention" }).then(bank => {
      allQuestionsRef.current = prepareRuntimeQuestionBank(bank);
      latest.current.controller.pickQuestion(saved.plan.mode, saved.state.currentSkillIndex);
    });
  }, []);
  async function start(skillId = stage.id) {
    const index = skillTree.findIndex(row => row.id === skillId);
    const status = controller.getCurrentSkillStatus(skillTree[index]);
    const mode = status.level1.currentPassed && status.level2.currentPassed ? "retention" : "mastery";
    allQuestionsRef.current = prepareRuntimeQuestionBank(await loadAssessmentSkillBank(skillId, { retention: mode === "retention" }));
    pendingRef.current.revision += 1;
    pendingRef.current.current = null;
    failedRef.current = { failedQuestionIds: new Set(), failedSources: new Set() };
    assessmentSittingRef.current = null;
    const current = latest.current.controller;
    const assigned = latest.current.state.studentFocusSession?.resolved_config;
    const plan = current.startAssessmentSitting(skillTree[index], { mode, assignedStep: assigned ? { level: Number(assigned.level), phase: Number(assigned.phase) } : null });
    if (plan.error) { setters.setMessage(plan.error); return; }
    activeRef.current = true; answerInFlightRef.current = false;
    roundQuestionIdsRef.current = []; roundItemKeysRef.current = [];
    setState(previous => ({ ...previous, currentSkillIndex: index, assessmentMode: plan.mode, currentQuestion: null, feedback: null, roundAnswers: [], roundQuestionIds: [], roundItemKeys: [], appView: APP_VIEWS.ASSESSMENT }));
    // Pick after the render so the same owner/revision guard used by the app
    // is captured by answer and playback callbacks.
    setTimeout(() => latest.current.controller.pickQuestion(plan.mode, index), 0);
  }
  function stop() { activeRef.current = false; assessmentSittingRef.current = null; pendingRef.current.revision += 1; setState(previous => ({ ...previous, appView: "idle", currentQuestion: null, feedback: null })); }
  function switchLearner(studentId) { stop(); answerHistoryRef.current = []; roundQuestionIdsRef.current = []; roundItemKeysRef.current = []; setState(blank(studentId)); }
  // Read-only inspection plus explicit fixture controls; no product test hooks.
  window.assessmentIntegration = {
    state, plan: assessmentSittingRef.current, start, stop, switchLearner,
    assignFocus: session => setState(previous => ({ ...previous, studentFocusSession: session, studentSessionToken: "local-session-token" })),
    restrictToSitting: () => { allQuestionsRef.current = allQuestionsRef.current.filter(question => assessmentSittingRef.current.questionIds.includes(question.id)); },
    attempts: () => loadAssessmentAttempts({ teacherId: TEACHER }),
    seed: row => saveAssessmentAttemptLocal({ ...row, teacherId: TEACHER }, { teacherId: TEACHER }),
    correct: () => controller.answerQuestion(state.currentQuestion.answer),
    incorrect: () => controller.answerQuestion(state.currentQuestion.choices.find(value => value !== state.currentQuestion.answer)),
    replay: () => controller.speakText(state.currentQuestion.audioText || state.currentQuestion.targetWord, state.currentQuestion.audioPath, { requireApprovedAudio: true, allowBrowserFallback: false, audioRole: "target_word" })
  };
  return <>
    <nav aria-label="Integration fixture controls"><button onClick={() => start("initial_sounds")}>Start Initial Sounds</button><button onClick={() => start("nouns")}>Start Nouns</button><button onClick={() => start("rhyming")}>Start Rhyming</button><button onClick={stop}>Stop check</button><button onClick={() => switchLearner(state.studentId === "A" ? "B" : "A")}>Switch learner</button></nav>
    <output data-testid="runtime-status">{JSON.stringify({ student: state.studentId, answers: state.roundAnswers.length, status: state.checkpointDecision?.skillStatus?.status || null })}</output>
    {state.appView === APP_VIEWS.ASSESSMENT ? <AssessmentPage {...state} currentStage={stage} studentName={state.studentId} roundLength={length} roundProgress={state.roundAnswers.length / length * 100} shouldShowImage={controller.shouldShowImage} answerQuestion={controller.answerQuestion} reviseLastAnswer={controller.reviseLastAnswer} speakText={controller.speakText} pickQuestion={controller.pickQuestion} restartAssessment={() => start()} setFeedback={setters.setFeedback} endAssessment={stop} returnToStudentOverview={stop} onEvidenceImageError={controller.handleAssessmentEvidenceImageError} independentAssessment isAssessmentTransitioning={state.assessmentTransitioning} assessmentSaveState={state.assessmentSaveState} retryCompletedAssessment={controller.retryCompletedAssessment} /> : state.appView === APP_VIEWS.CHECKPOINT ? <CheckpointDecisionPage checkpoint={state.checkpointDecision} continueSkill={() => start()} retrySkill={() => start()} returnToOverview={stop} moveToNextSkill={stop} reviewMistakes={stop} /> : <p role="status">{state.message || "Ready"}</p>}
  </>;
}
const root = window.assessmentIntegrationRoot || createRoot(document.getElementById("root"));
window.assessmentIntegrationRoot = root;
root.render(<Fixture />);
