import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { TeacherStudentsPage } from "./components/TeacherStudentsPage.jsx";
import { LEARNING_POLICY_VERSION } from "./policy/learningPolicy.js";

const classId = "class-a";
const teacherId = "teacher-policy-preview";
const classList = [{
  id: classId,
  name: "Audit Class A",
  access_code: "READ42",
  leaderboard_scope: "class"
}];
const students = [
  {
    id: "amara",
    name: "Amara",
    class_id: classId,
    teacher_id: teacherId,
    symbol_password: "123"
  },
  {
    id: "aisha",
    name: "Aisha",
    class_id: classId,
    teacher_id: teacherId,
    symbol_password: "234"
  },
  {
    id: "noah",
    name: "Noah",
    class_id: classId,
    teacher_id: teacherId,
    symbol_password: "341"
  }
];
const recentEvidenceTime = new Date().toISOString();
const dashboardRows = [
  {
    classId,
    id: "amara",
    answered: 1,
    correct: 1,
    accuracy: 100,
    currentAnswered: 1,
    currentCorrect: 1,
    currentAccuracy: 100,
    currentEvidenceSkills: ["Final Sounds"],
    currentLastActive: recentEvidenceTime,
    evidenceReadStatus: "complete",
    masteredCount: 0,
    currentSkill: "Final Sounds",
    evidenceSkills: ["Final Sounds"],
    lastActive: recentEvidenceTime,
    soundSeekers: {
      lastActiveAt: recentEvidenceTime,
      heat: [{
        id: "m",
        label: "m",
        stopName: "Moss Gate",
        bucket: "reteach",
        seen: 10,
        independentSeen: 1,
        accuracy: 0
      }]
    }
  },
  {
    classId,
    id: "aisha",
    answered: 12,
    correct: 5,
    accuracy: 42,
    currentAnswered: 12,
    currentCorrect: 5,
    currentAccuracy: 42,
    currentEvidenceSkills: ["Initial Sounds", "Final Sounds"],
    currentLastActive: recentEvidenceTime,
    evidenceReadStatus: "complete",
    masteredCount: 0,
    currentSkill: "Initial Sounds",
    evidenceSkills: ["Initial Sounds", "Final Sounds"],
    lastActive: recentEvidenceTime,
    soundSeekers: {
      lastActiveAt: recentEvidenceTime,
      heat: [{
        id: "sh",
        label: "sh",
        stopName: "Shell Crossing",
        bucket: "reteach",
        seen: 8,
        independentSeen: 8,
        accuracy: 38
      }]
    }
  },
  {
    classId,
    id: "noah",
    answered: 20,
    correct: 18,
    accuracy: 90,
    currentAnswered: 20,
    currentCorrect: 18,
    currentAccuracy: 90,
    currentEvidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
    currentLastActive: recentEvidenceTime,
    evidenceReadStatus: "complete",
    masteredCount: 3,
    currentSkill: "CVC Short Vowels",
    evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
    lastActive: recentEvidenceTime,
    soundSeekers: null
  }
];
const noop = () => {};
const asyncNoop = async () => {};

export function LearningPolicyPreview() {
  const [selectedClassId, setSelectedClassId] = useState(classId);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentList, setStudentList] = useState(students);
  const [newClassName, setNewClassName] = useState("");

  return (
    <div
      className="teacher-mode-app lp-skin-sage"
      data-learning-policy-version={LEARNING_POLICY_VERSION}
      data-preview-surface="learning-policy"
    >
      <TeacherStudentsPage
        classList={classList}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        studentList={studentList}
        setStudentList={setStudentList}
        archivedStudentList={[]}
        selectedStudentId={selectedStudentId}
        onLoadStudent={setSelectedStudentId}
        onClearStudent={() => setSelectedStudentId("")}
        selectedGroupId="all"
        onSelectGroup={noop}
        loadStudents={asyncNoop}
        assignQuestPractice={asyncNoop}
        clearQuestPractice={asyncNoop}
        setReducedChoiceMode={asyncNoop}
        setAccessibilitySettings={asyncNoop}
        onStartCheck={noop}
        onOpenReport={noop}
        onOpenGuidedReading={noop}
        onOpenStoryQuests={noop}
        onOpenElFormalCheck={asyncNoop}
        onResetCheckData={asyncNoop}
        createClass={asyncNoop}
        newClassName={newClassName}
        setNewClassName={setNewClassName}
        createStudent={asyncNoop}
        teacherId={teacherId}
        classDashboard={dashboardRows}
        loadClassDashboard={asyncNoop}
        skillTree={[
          { id: "initial_sounds", label: "Initial Sounds" },
          { id: "final_sounds", label: "Final Sounds" },
          { id: "cvc_short_vowels", label: "CVC Short Vowels" }
        ]}
        updateStudentName={async () => true}
        updateStudentSymbolPassword={async () => true}
        resetStudentSymbolPassword={asyncNoop}
        startStudentLogin={noop}
        schoolName="Literacy Guide Audit School"
        hasSchool
        activitySyncHealthSeedRows={[]}
      />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<LearningPolicyPreview />);
