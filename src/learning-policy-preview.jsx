import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { TeacherProgressOverview } from "./components/teacher/TeacherProgressOverview.jsx";

const POLICY_NOW = new Date("2026-07-24T12:00:00.000Z");
const rows = [
  {
    id: "amara",
    name: "Amara",
    answered: 1,
    correct: 1,
    accuracy: 100,
    masteredCount: 0,
    currentSkill: "Final Sounds",
    evidenceSkills: ["Final Sounds"],
    lastActive: "2026-07-23T08:00:00.000Z",
    soundSeekers: {
      lastActiveAt: "2026-07-23T08:00:00.000Z",
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
    id: "aisha",
    name: "Aisha",
    answered: 12,
    correct: 5,
    accuracy: 42,
    masteredCount: 0,
    currentSkill: "Initial Sounds",
    evidenceSkills: ["Initial Sounds", "Final Sounds"],
    lastActive: "2026-07-23T09:00:00.000Z",
    soundSeekers: {
      lastActiveAt: "2026-07-23T09:00:00.000Z",
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
    id: "noah",
    name: "Noah",
    answered: 20,
    correct: 18,
    accuracy: 90,
    masteredCount: 3,
    currentSkill: "CVC Short Vowels",
    evidenceSkills: ["Initial Sounds", "Final Sounds", "CVC Short Vowels"],
    lastActive: "2026-07-23T10:00:00.000Z",
    soundSeekers: null
  }
];

export function LearningPolicyPreview() {
  const [selectedLearnerId, setSelectedLearnerId] = useState("amara");
  return (
    <main
      className="teacher-mode-app lp-skin-sage"
      data-preview-surface="learning-policy"
    >
      <h1>Learning policy evidence preview</h1>
      <TeacherProgressOverview
        className="Audit Class A"
        classList={[{ id: "class-a", name: "Audit Class A" }]}
        selectedClassId="class-a"
        onSelectClass={() => {}}
        rows={rows}
        selectedLearnerId={selectedLearnerId}
        policyNow={POLICY_NOW}
        onSelectLearner={setSelectedLearnerId}
        onClearLearner={() => setSelectedLearnerId("")}
        onOpenReports={() => {}}
      />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<LearningPolicyPreview />);
