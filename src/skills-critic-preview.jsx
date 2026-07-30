/* eslint-disable react-hooks/refs */
// Skills-assessment CRITIC preview harness.
//
// Mounts the REAL AssessmentPage driven by the REAL round controller
// (createAssessmentRoundController) over the REAL published bank
// (loadAssessmentSkillBank -> prepareRuntimeQuestionBank) for one skill —
// the same code path a child's sitting runs, minus auth and persistence
// (teacherId is empty so every remote write guard returns early).
//
// URL: /preview/skills-critic.html?skill=<runtime skill id>
// Driver API (window.__critic):
//   ready            -> true once the first question is mounted
//   state()          -> { question, roundProgress, roundLength, feedback, spoken }
//   bank()           -> the full prepared runtime bank for the skill
//   answer(text)     -> answer the current question
//   answerCorrect()  -> answer with the current question's key
//   next()           -> clear feedback / advance via the real pickQuestion
// Audio is RECORDED, not played: every speakText call is pushed to the
// spoken log so critics can audit audio coverage headlessly.

import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-vibrant.css";
import "./styles/sage-subpages.css";

import { AssessmentPage } from "./components/AppPages.jsx";
import { createAssessmentRoundController } from "./appState/assessmentRoundController.js";
import { skillTree } from "./skillTree";
import { getMasteryRule } from "./masterySystem.js";
import { loadAssessmentSkillBank } from "./data/loadAssessmentSkillBank.js";
import { prepareRuntimeQuestionBank } from "./appState/assessmentRuntime.js";
import { getHfwRuntimeEligibilityIssues } from "./data/hfwRuntimeEligibility.js";
import { loadAssessmentMediaPickerModule } from "./appState/appRuntimeServices.js";

const params = new URLSearchParams(window.location.search);
const requestedSkill = params.get("skill") || "initial_sounds";
const stageIndex = Math.max(0, skillTree.findIndex(stage => stage.id === requestedSkill));
const stage = skillTree[stageIndex];

const spokenLog = [];

export function CriticHarness() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [message, setMessage] = useState("loading bank…");
  const [roundAnswers, setRoundAnswers] = useState([]);
  const [roundItemKeys, setRoundItemKeys] = useState([]);
  const [, setRoundQuestionIds] = useState([]);
  const [mastery, setMastery] = useState({});
  const [itemMastery, setItemMastery] = useState({});
  const [itemSessionSeen, setItemSessionSeen] = useState({});
  const [answerHistory, setAnswerHistory] = useState([]);
  const [usedByStage, setUsedByStage] = useState({});
  const [, setAssessmentHistory] = useState([]);
  const [, setTotalAnswered] = useState(0);
  const [, setCorrectAnswered] = useState(0);

  const allQuestionsRef = useRef([]);
  const answerHistoryRef = useRef([]);
  const answerInFlightRef = useRef(false);
  const assessmentActiveRef = useRef(true);
  const assessmentMediaPickerRef = useRef(null);
  const assessmentMediaUsageRef = useRef(null);
  const failedAssessmentMediaRef = useRef({ failedQuestionIds: new Set(), failedSources: new Set() });
  const initialSoundForcedLevelRef = useRef(null);
  const initialSoundRoundAskedLettersRef = useRef(new Set());
  const initialSoundRoundMetaRef = useRef(null);
  const initialSoundRoundQueueRef = useRef(null);
  const roundItemKeysRef = useRef([]);
  const roundQuestionIdsRef = useRef([]);

  useEffect(() => { answerHistoryRef.current = answerHistory; }, [answerHistory]);
  useEffect(() => { roundItemKeysRef.current = roundItemKeys; }, [roundItemKeys]);

  const masteryRule = getMasteryRule(stage.label);
  const ROUND_LENGTH = masteryRule.roundLength;
  const PASS_SCORE = masteryRule.passScore;

  const controller = useMemo(() => createAssessmentRoundController({
    allQuestionsRef, answerHistory, answerHistoryRef, answerInFlightRef,
    assessmentActiveRef, assessmentMediaPickerRef, assessmentMediaUsageRef,
    // targetedReview mode: answers skip the supabase durability gate (no
    // teacher session exists in a preview) while feedback and round advance
    // behave exactly like a real sitting.
    assessmentMode: "targetedReview",
    currentQuestion, currentSkillIndex: stageIndex, currentStage: stage,
    excludeSessionMediaFailures: questions => questions,
    failedAssessmentMediaRef, initialSoundForcedLevelRef, initialSoundRoundAskedLettersRef,
    initialSoundRoundMetaRef, initialSoundRoundQueueRef,
    itemMastery, itemSessionSeen, mastery,
    PASS_SCORE,
    resetAssessmentMediaUsage: () => {
      assessmentMediaUsageRef.current = assessmentMediaPickerRef.current
        ? assessmentMediaPickerRef.current.createAssessmentSessionMediaUsage()
        : null;
    },
    ROUND_LENGTH, roundAnswers, roundItemKeys, roundItemKeysRef, roundQuestionIdsRef,
    selectedClassId: null,
    setAnswerHistory, setAppView: () => {}, setAssessmentHistory,
    setAssessmentTransitioning: () => {}, setCheckpointDecision: () => {},
    setCorrectAnswered, setCurrentQuestion, setDiagnosticFollowUp: () => {},
    setFeedback, setItemMastery, setItemSessionSeen, setMastery,
    setMessage, setRoundAnswers, setRoundItemKeys, setRoundQuestionIds,
    setShowConfetti: () => {}, setTotalAnswered, setUsedByStage,
    studentId: "critic-student", studentName: "Critic", teacherId: "",
    usedByStage, weaknessSnapshot: {},
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentQuestion, roundAnswers, roundItemKeys, itemMastery, itemSessionSeen, mastery, answerHistory, usedByStage, allQuestions]);

  const recordingSpeakText = (text, audioPath = "", options = {}) => {
    spokenLog.push({ text, audioPath, options, questionId: currentQuestion?.id || null });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        assessmentMediaPickerRef.current = await loadAssessmentMediaPickerModule();
        assessmentMediaUsageRef.current = assessmentMediaPickerRef.current.createAssessmentSessionMediaUsage();
        const bank = await loadAssessmentSkillBank(stage.id);
        const isHfw = /^hfw_/.test(stage.id);
        const prepared = prepareRuntimeQuestionBank(bank, isHfw ? { getHfwRuntimeEligibilityIssues } : {});
        if (cancelled) return;
        allQuestionsRef.current = prepared;
        setAllQuestions(prepared);
        setMessage("");
        controller.pickQuestion("mastery", stageIndex);
      } catch (error) {
        console.error("critic harness bank load failed", error);
        setMessage(`bank load failed: ${error?.message || error}`);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.__critic = {
      ready: Boolean(currentQuestion),
      skill: stage.id,
      stageLabel: stage.label,
      roundLength: ROUND_LENGTH,
      state: () => ({
        question: currentQuestion,
        feedback,
        message,
        roundProgress: roundAnswers.length,
        roundLength: ROUND_LENGTH,
        spoken: spokenLog
      }),
      bank: () => allQuestionsRef.current,
      answer: text => controller.answerQuestion(text),
      answerCorrect: () => controller.answerQuestion(currentQuestion?.correctAnswer ?? currentQuestion?.answer),
      next: () => controller.pickQuestion("mastery", stageIndex)
    };
  }, [currentQuestion, feedback, message, roundAnswers, controller, ROUND_LENGTH]);

  return (
    <AssessmentPage
      currentQuestion={currentQuestion}
      feedback={feedback}
      studentName="Critic"
      currentSkillIndex={stageIndex}
      currentStage={stage}
      setFeedback={setFeedback}
      pickQuestion={controller.pickQuestion}
      roundAnswers={roundAnswers}
      roundLength={ROUND_LENGTH}
      roundProgress={roundAnswers.length}
      shouldShowImage={controller.shouldShowImage}
      answerQuestion={controller.answerQuestion}
      speakText={recordingSpeakText}
      message={message}
      endAssessment={() => {}}
      returnToStudentOverview={() => {}}
      assessmentMode="mastery"
      skillTree={skillTree}
    />
  );
}

createRoot(document.getElementById("root")).render(<CriticHarness />);
