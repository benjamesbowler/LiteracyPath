import { useRef, useState } from "react";
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

const BROKEN_SOURCE = "/images/assessment/does-not-exist-a3-10.webp";
const PREVIEW_PARAMS = new URLSearchParams(window.location.search);
const IS_COMPACT_VISUAL_GRID = PREVIEW_PARAMS.get("scenario") === "compact-visual-grid";
const IS_LOCKED_ASSESSMENT = PREVIEW_PARAMS.get("locked") === "1";
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
    : inspectedQuestion ? [inspectedQuestion] : [FAILED_QUESTION, SAFE_QUESTION]);
  const [currentQuestion, setCurrentQuestion] = useState(() => IS_COMPACT_VISUAL_GRID
    ? COMPACT_VISUAL_GRID_QUESTION
    : inspectedQuestion || FAILED_QUESTION);
  const [failureCount, setFailureCount] = useState(0);
  const handledQuestionIds = useRef(new Set());

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
      data-round-question-ids={round.map(question => question.id).join(",")}
    >
      <AssessmentPage
        currentQuestion={currentQuestion}
        feedback={null}
        studentName={IS_COMPACT_VISUAL_GRID || inspectedQuestion ? "Teacher Ben" : "Aaron"}
        currentSkillIndex={0}
        currentStage={{
          id: currentQuestion?.skillId || "initial_sounds",
          label: currentQuestion?.skillName || "Initial Sounds"
        }}
        setFeedback={() => {}}
        pickQuestion={() => {}}
        roundAnswers={[]}
        roundLength={IS_COMPACT_VISUAL_GRID ? 10 : inspectedQuestion ? 1 : 2}
        roundProgress={IS_COMPACT_VISUAL_GRID ? 10 : inspectedQuestion ? 100 : 0}
        shouldShowImage={() => false}
        answerQuestion={() => {}}
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
        independentAssessment={IS_LOCKED_ASSESSMENT}
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

const root = createRoot(document.getElementById("root"));
if (REQUESTED_SKILL) {
  const questions = await importV3Bank(REQUESTED_SKILL);
  const inspectedQuestion = questions.find(question => question.id === REQUESTED_ITEM_ID) || questions[0] || null;
  root.render(<AssessmentMediaEvidencePreview inspectedQuestion={inspectedQuestion} />);
} else {
  root.render(<AssessmentMediaEvidencePreview />);
}
