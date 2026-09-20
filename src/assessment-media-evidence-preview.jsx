import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-vibrant.css";
import "./styles/sage-subpages.css";
import "./styles/student-sessions.css";
import { AssessmentPage } from "./components/AppPages.jsx";
import { StudentSessionNotice } from "./components/student-sessions/StudentSessionNotice.jsx";
import { refillAssessmentRoundAfterMediaFailure } from "./policy/assessmentMediaEvidence.js";
import { importV3Bank } from "./data/v3/v3Registry.js";
import { createAssessmentRoundController } from "./appState/assessmentRoundController.js";
import { buildAssessmentAttemptRecord } from "./data/assessmentHistoryStore.js";

const BROKEN_SOURCE = "/images/assessment/does-not-exist-a3-10.webp";
const PREVIEW_PARAMS = new URLSearchParams(window.location.search);
const IS_COMPACT_VISUAL_GRID = PREVIEW_PARAMS.get("scenario") === "compact-visual-grid";
const IS_LOCKED_ASSESSMENT = PREVIEW_PARAMS.get("locked") === "1";
const IS_RESPONSE_LATENCY = PREVIEW_PARAMS.get("scenario") === "response-latency";
const REQUESTED_SKILL = PREVIEW_PARAMS.get("skill") || "";
const REQUESTED_ITEM_ID = PREVIEW_PARAMS.get("item") || "";

const COMPACT_VISUAL_GRID_QUESTION = {
  id: "preview.initial_sounds.rat.v1",
  skillId: "initial_sounds",
  assessmentSkillId: "initial_sounds",
  skill: "Initial Sounds",
  skillName: "Initial Sounds",
  level: 1,
  difficulty: 1,
  questionType: "visual_card_choice",
  formatType: "INITIAL_SOUND_PAIR_SELECT",
  question: "Which word has the same starting sound?",
  prompt: "Which word has the same starting sound?",
  spokenPrompt: "Rat. Which word has the same starting sound?",
  targetWord: "rat",
  answer: "rose",
  correctAnswer: "rose",
  choices: ["rose", "map", "tent", "web"],
  imageCards: [
    {
      id: "preview.initial_sounds.rat.v1_card_rose",
      word: "rose",
      value: "rose",
      label: "rose",
      image: "/images/assessment/objective-words/rose.webp",
      imageAlt: "rose"
    },
    {
      id: "preview.initial_sounds.rat.v1_card_map",
      word: "map",
      value: "map",
      label: "map",
      image: "/images/assessment/objective-words/map.webp",
      imageAlt: "map"
    },
    {
      id: "preview.initial_sounds.rat.v1_card_tent",
      word: "tent",
      value: "tent",
      label: "tent",
      image: "/images/assessment/objective-words/tent.webp",
      imageAlt: "tent"
    },
    {
      id: "preview.initial_sounds.rat.v1_card_web",
      word: "web",
      value: "web",
      label: "web",
      image: "/images/assessment/objective-words/web.webp",
      imageAlt: "web"
    }
  ]
};

const FAILED_QUESTION = {
  id: "failed-picture-item",
  skillId: "initial_sounds",
  skill: "Initial Sounds",
  skillName: "Initial Sounds",
  questionType: "listen_and_find_word",
  formatType: "LISTEN_FIND_WORD",
  question: "Listen and find the word.",
  prompt: "Listen and find the word.",
  answer: "cat",
  correctAnswer: "cat",
  choices: ["cat", "dog"],
  choiceImages: {
    cat: {
      image: BROKEN_SOURCE,
      alt: "A cat"
    },
    dog: {
      image: "/images/child-mode/initial-sounds/dog.webp",
      alt: "A dog"
    }
  }
};

const SHARED_FAILURE_QUESTION = {
  ...FAILED_QUESTION,
  id: "shared-broken-picture-item",
  choices: ["cat", "map"],
  answer: "map",
  correctAnswer: "map",
  choiceImages: {
    cat: {
      image: BROKEN_SOURCE,
      alt: "A cat"
    },
    map: {
      image: "/images/child-mode/initial-sounds/map.webp",
      alt: "A map"
    }
  }
};

const SAFE_QUESTION = {
  ...FAILED_QUESTION,
  id: "replacement-picture-item",
  answer: "sun",
  correctAnswer: "sun",
  choices: ["sun", "map"],
  choiceImages: {
    sun: {
      image: "/images/child-mode/initial-sounds/sun.webp"
    },
    map: {
      image: "/images/child-mode/initial-sounds/map.webp",
      alt: "A folded map"
    }
  }
};

const SAFE_REFILL = {
  ...FAILED_QUESTION,
  id: "second-safe-picture-item",
  answer: "dog",
  correctAnswer: "dog",
  choices: ["dog", "cat"],
  choiceImages: {
    dog: {
      image: "/images/child-mode/initial-sounds/dog.webp"
    },
    cat: {
      image: "/images/child-mode/initial-sounds/cat.webp"
    }
  }
};

const CANDIDATES = [
  FAILED_QUESTION,
  SHARED_FAILURE_QUESTION,
  SAFE_QUESTION,
  SAFE_REFILL
];

export function AssessmentMediaEvidencePreview({ inspectedQuestion = null }) {
  const [round, setRound] = useState(() => IS_COMPACT_VISUAL_GRID
    ? [COMPACT_VISUAL_GRID_QUESTION]
    : inspectedQuestion ? [inspectedQuestion]
    : IS_RESPONSE_LATENCY ? [SAFE_QUESTION, SAFE_REFILL] : [FAILED_QUESTION, SAFE_QUESTION]);
  const [currentQuestion, setCurrentQuestion] = useState(() => IS_COMPACT_VISUAL_GRID
    ? COMPACT_VISUAL_GRID_QUESTION
    : inspectedQuestion || (IS_RESPONSE_LATENCY ? SAFE_QUESTION : FAILED_QUESTION));
  const [failureCount, setFailureCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [answerCount, setAnswerCount] = useState(0);
  const [lastAnswer, setLastAnswer] = useState("");
  const answerInFlightRef = useRef(false);
  const handledQuestionIds = useRef(new Set());

  async function previewAnswer(choice) {
    if (!IS_RESPONSE_LATENCY || answerInFlightRef.current) return;
    answerInFlightRef.current = true;
    setSavingAnswer(true);
    // The browser regression holds this preview-only response to exercise the
    // production renderer's pending-save state independently of credentials.
    let response;
    try {
      response = await fetch("/__preview_assessment_answer__");
    } catch (error) {
      answerInFlightRef.current = false;
      setSavingAnswer(false);
      throw error;
    }
    if (!response.ok) {
      answerInFlightRef.current = false;
      setSavingAnswer(false);
      return false;
    }
    setLastAnswer(JSON.stringify(choice));
    setAnswerCount(count => count + 1);
    setCurrentQuestion(null);
    setFeedback({ isCorrect: choice === currentQuestion.answer, explanation: "" });
    setSavingAnswer(false);
  }

  function previewNextQuestion() {
    if (!IS_RESPONSE_LATENCY) return;
    answerInFlightRef.current = false;
    setCurrentQuestion(SAFE_REFILL);
  }

  function handleEvidenceImageError({ questionId, src }) {
    if (handledQuestionIds.current.has(questionId)) return;
    handledQuestionIds.current.add(questionId);
    const refilled = refillAssessmentRoundAfterMediaFailure({
      round,
      failedQuestionId: questionId,
      failedSource: src,
      candidates: CANDIDATES,
      targetLength: 2
    });
    setFailureCount(count => count + 1);
    setRound(refilled);
    setCurrentQuestion(refilled[0] || null);
  }

  return (
    <div
      className={IS_COMPACT_VISUAL_GRID || inspectedQuestion
        ? "app assessment-app no-sidebar lp-skin-sage"
        : "app student-mode-app no-sidebar lp-skin-sage"}
      data-preview-surface="assessment-media-evidence"
      data-preview-scenario={IS_COMPACT_VISUAL_GRID ? "compact-visual-grid" : inspectedQuestion ? "generated-v3-item" : "media-evidence"}
      data-failure-count={failureCount}
      data-answer-count={answerCount}
      data-last-answer={lastAnswer}
      data-round-question-ids={round.map(question => question.id).join(",")}
    >
      <AssessmentPage
        currentQuestion={currentQuestion}
        feedback={feedback}
        studentName={IS_COMPACT_VISUAL_GRID || inspectedQuestion ? "Teacher Ben" : "Aaron"}
        currentSkillIndex={0}
        currentStage={{
          id: currentQuestion?.skillId || "initial_sounds",
          label: currentQuestion?.skillName || "Initial Sounds"
        }}
        setFeedback={setFeedback}
        pickQuestion={previewNextQuestion}
        roundAnswers={Array(answerCount).fill(true)}
        roundLength={IS_COMPACT_VISUAL_GRID ? 10 : inspectedQuestion ? 1 : 2}
        roundProgress={IS_COMPACT_VISUAL_GRID ? 10 : inspectedQuestion ? 100 : 0}
        shouldShowImage={() => false}
        answerQuestion={previewAnswer}
        speakText={() => {}}
        message=""
        endAssessment={() => {}}
        returnToStudentOverview={() => {}}
        assessmentMode="mastery"
        toggleAssessmentFullscreen={IS_COMPACT_VISUAL_GRID || inspectedQuestion ? () => {} : null}
        skillTree={IS_COMPACT_VISUAL_GRID || inspectedQuestion
          ? [{ id: currentQuestion?.skillId || "initial_sounds", label: currentQuestion?.skillName || "Initial Sounds" }]
          : []}
        onChangeSkillLevel={IS_COMPACT_VISUAL_GRID || inspectedQuestion ? () => {} : null}
        onEvidenceImageError={IS_COMPACT_VISUAL_GRID || inspectedQuestion ? null : handleEvidenceImageError}
        independentAssessment={IS_LOCKED_ASSESSMENT || IS_RESPONSE_LATENCY}
        isAssessmentTransitioning={savingAnswer}
        sessionNotice={IS_LOCKED_ASSESSMENT ? (
          <StudentSessionNotice
            placement="inline"
            session={{ target: "skills_assessment" }}
          />
        ) : null}
      />
    </div>
  );
}

// Exercise the real completion/retry controller without requiring a classroom
// account. Browser checks replace only the Supabase transport for this preview.
const COMPLETION_PREVIEW_STAGE = { id: "cvc_short_vowels", label: "CVC words" };
function AssessmentCompletionPreview() {
  const stage = COMPLETION_PREVIEW_STAGE;
  const [assessmentSaveState, setAssessmentSaveState] = useState(null);
  const [appView, setAppView] = useState("assessment");
  const [roundAnswers, setRoundAnswers] = useState(Array(10).fill(true));
  const answerHistoryRef = useRef([]);
  const answerInFlightRef = useRef(false);
  const roundItemKeysRef = useRef([]);
  const roundQuestionIdsRef = useRef([]);
  const pendingAssessmentCompletionRef = useRef(null);
  const assessmentCompletionOwner = "completion-preview";
  pendingAssessmentCompletionRef.owner = assessmentCompletionOwner;
  const noop = () => {};
  const { retryCompletedAssessment } = createAssessmentRoundController({
    answerHistoryRef, answerInFlightRef, roundItemKeysRef, roundQuestionIdsRef,
    pendingAssessmentCompletionRef, assessmentCompletionOwner, setAssessmentSaveState,
    studentId: "11111111-1111-4111-8111-111111111111",
    studentSessionToken: "synthetic-preview-token",
    studentFocusSession: {
      id: "33333333-3333-4333-8333-333333333333", target: "skills_assessment",
      teacher_id: "22222222-2222-4222-8222-222222222222",
      resolved_config: { skill_id: stage.id, level: 1, phase: 1 }
    },
    ROUND_LENGTH: 10, setAppView, setRoundAnswers,
    setAssessmentTransitioning: noop, setMessage: noop, setAssessmentHistory: noop,
    setMastery: noop, setCheckpointDecision: noop, setRoundItemKeys: noop,
    setRoundQuestionIds: noop, resetAssessmentMediaUsage: noop,
    setCurrentQuestion: noop, setFeedback: noop
  });
  const beginRef = useRef(retryCompletedAssessment);
  useEffect(() => {
    const attemptRecord = buildAssessmentAttemptRecord({
      studentId: "11111111-1111-4111-8111-111111111111",
      teacherId: "22222222-2222-4222-8222-222222222222",
      stage, assessmentType: "skill_checkpoint",
      checkpoint: { pathStatus: { level: 1, phase: 1 }, passed: true },
      questionRecords: Array.from({ length: 10 }, (_, index) => ({
        questionId: `preview-full-round-question-${index}`,
        skillId: stage.id, question: "Find cat", chosen: "cat", correct: "cat",
        isCorrect: true, answeredAt: "2026-09-19T00:00:00.000Z"
      }))
    });
    pendingAssessmentCompletionRef.current = { attemptRecord, checkpoint: {}, stage, score: 10, mastered: false };
    void beginRef.current();
  }, [stage]);
  return (
    <div className="app student-mode-app no-sidebar lp-skin-sage">
      {appView === "checkpoint" ? <main className="student-focus-complete"><h1>All done!</h1></main> : (
        <AssessmentPage
          currentStage={stage} currentQuestion={null} feedback={null}
          setFeedback={noop} pickQuestion={noop} roundAnswers={roundAnswers}
          roundLength={10} roundProgress={100} assessmentMode="mastery"
          assessmentSaveState={assessmentSaveState}
          retryCompletedAssessment={retryCompletedAssessment}
          independentAssessment
          sessionNotice={<StudentSessionNotice placement="inline" session={{ target: "skills_assessment" }} />}
        />
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
if (PREVIEW_PARAMS.get("scenario") === "completion-recovery") {
  root.render(<AssessmentCompletionPreview />);
} else if (REQUESTED_SKILL) {
  const questions = await importV3Bank(REQUESTED_SKILL);
  const inspectedQuestion = questions.find(question => question.id === REQUESTED_ITEM_ID) || questions[0] || null;
  root.render(<AssessmentMediaEvidencePreview inspectedQuestion={inspectedQuestion} />);
} else {
  root.render(<AssessmentMediaEvidencePreview />);
}
