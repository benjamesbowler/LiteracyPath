import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-vibrant.css";
import "./styles/sage-subpages.css";
import { AssessmentPage } from "./components/AppPages.jsx";
import { refillAssessmentRoundAfterMediaFailure } from "./policy/assessmentMediaEvidence.js";
import { importV3Bank } from "./data/v3/v3Registry.js";

const BROKEN_SOURCE = "/images/assessment/does-not-exist-a3-10.webp";
const PREVIEW_PARAMS = new URLSearchParams(window.location.search);
const IS_COMPACT_VISUAL_GRID = PREVIEW_PARAMS.get("scenario") === "compact-visual-grid";
const REQUESTED_SKILL = PREVIEW_PARAMS.get("skill") || "";
const REQUESTED_ITEM_ID = PREVIEW_PARAMS.get("item") || "";

const COMPACT_VISUAL_GRID_QUESTION = {
  id: "lp3.initial_sounds.l1.C.j.v3",
  skillId: "initial_sounds",
  assessmentSkillId: "initial_sounds",
  skill: "Initial Sounds",
  skillName: "Initial Sounds",
  level: 1,
  difficulty: 1,
  questionType: "visual_card_choice",
  formatType: "INITIAL_SOUND_PAIR_SELECT",
  question: "Which one starts like jug?",
  prompt: "Which one starts like jug?",
  spokenPrompt: "jug. Which one starts with the same sound as jug?",
  targetWord: "jug",
  answer: "jet",
  correctAnswer: "jet",
  choices: ["drum", "yarn", "mug", "jet"],
  imageCards: [
    {
      id: "lp3.initial_sounds.l1.C.j.v3_card_drum",
      word: "drum",
      value: "drum",
      label: "drum",
      image: "/images/assessment/blends/drum.webp",
      imageAlt: "drum"
    },
    {
      id: "lp3.initial_sounds.l1.C.j.v3_card_yarn",
      word: "yarn",
      value: "yarn",
      label: "yarn",
      image: "/images/child-mode/initial-sounds/yarn.png",
      imageAlt: "yarn"
    },
    {
      id: "lp3.initial_sounds.l1.C.j.v3_card_mug",
      word: "mug",
      value: "mug",
      label: "mug",
      image: "/images/assessment/rhyming/variants/mug/mug-02.webp",
      imageAlt: "mug"
    },
    {
      id: "lp3.initial_sounds.l1.C.j.v3_card_jet",
      word: "jet",
      value: "jet",
      label: "jet",
      image: "/images/assessment/rhyming/variants/et/jet-02.webp",
      imageAlt: "jet"
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
