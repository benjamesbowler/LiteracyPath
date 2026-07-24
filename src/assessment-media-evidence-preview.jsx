import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-vibrant.css";
import "./styles/sage-subpages.css";
import { AssessmentPage } from "./components/AppPages.jsx";
import { refillAssessmentRoundAfterMediaFailure } from "./policy/assessmentMediaEvidence.js";

const BROKEN_SOURCE = "/images/assessment/does-not-exist-a3-10.webp";

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
      image: "/images/child-mode/initial-sounds/dog.png",
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
      image: "/images/child-mode/initial-sounds/map.png",
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
      image: "/images/child-mode/initial-sounds/sun.png"
    },
    map: {
      image: "/images/child-mode/initial-sounds/map.png",
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
      image: "/images/child-mode/initial-sounds/dog.png"
    },
    cat: {
      image: "/images/child-mode/initial-sounds/cat.png"
    }
  }
};

const CANDIDATES = [
  FAILED_QUESTION,
  SHARED_FAILURE_QUESTION,
  SAFE_QUESTION,
  SAFE_REFILL
];

export function AssessmentMediaEvidencePreview() {
  const [round, setRound] = useState([FAILED_QUESTION, SAFE_QUESTION]);
  const [currentQuestion, setCurrentQuestion] = useState(FAILED_QUESTION);
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
      className="app student-mode-app no-sidebar lp-skin-sage"
      data-preview-surface="assessment-media-evidence"
      data-failure-count={failureCount}
      data-round-question-ids={round.map(question => question.id).join(",")}
    >
      <AssessmentPage
        currentQuestion={currentQuestion}
        feedback={null}
        studentName="Aaron"
        currentSkillIndex={0}
        currentStage={{ id: "initial_sounds", label: "Initial Sounds" }}
        setFeedback={() => {}}
        pickQuestion={() => {}}
        roundAnswers={[]}
        roundLength={2}
        roundProgress={0}
        shouldShowImage={() => false}
        answerQuestion={() => {}}
        speakText={() => {}}
        message=""
        endAssessment={() => {}}
        returnToStudentOverview={() => {}}
        assessmentMode="mastery"
        onEvidenceImageError={handleEvidenceImageError}
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<AssessmentMediaEvidencePreview />);
