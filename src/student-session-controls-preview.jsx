import { useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-sessions.css";
import { StudentSessionBar } from "./components/student-sessions/StudentSessionBar.jsx";
import { StudentSessionSetup } from "./components/student-sessions/StudentSessionSetup.jsx";
import { STUDENT_FOCUS_TARGETS } from "./policy/studentFocusTargets.js";

const STUDENTS = [
  { id: "student-a", name: "Amina", symbol_password: ["sun", "tree", "fish"] },
  { id: "student-b", name: "Ben", symbol_password: ["moon", "book", "star"] },
  { id: "student-c", name: "Cara", symbol_password: ["cat", "hat", "leaf"] }
];

const CLASS_DASHBOARD = STUDENTS.map(student => ({
  id: student.id,
  currentSkill: "Initial Sounds",
  evidenceReadStatus: "complete"
}));

const ACTIVE_SESSION = {
  id: "focus-preview",
  teacher_id: "teacher-preview",
  target: STUDENT_FOCUS_TARGETS.ADVENTURE_MAP,
  status: "active",
  selection_scope: "whole_class"
};

const ACTIVE_MEMBERS = STUDENTS.map(student => ({
  student_id: student.id,
  status: "active",
  connected: true,
  content_ok: true,
  resolved_config: {
    map_mode: "one_space_for_everyone",
    cycle_id: "cycle-14",
    cycle_number: 14,
    space_name: "Fern Jungle"
  }
}));

const PREVIEW_PARAMS = new URLSearchParams(window.location.search);
const PRESELECTED_STUDENT_IDS = PREVIEW_PARAMS.get("selected")
  ? [PREVIEW_PARAMS.get("selected")]
  : [];
const PREVIEW_TARGET = PREVIEW_PARAMS.get("target") === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE
  ? STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE
  : STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT;

const client = {
  async call(name, args) {
    window.__studentSessionPreviewLastRpc = { name, args };
    return {
      data: {
        ok: true,
        session: {
          ...ACTIVE_SESSION,
          target: args.p_target,
          selection_scope: args.p_whole_class ? "whole_class" : "selected_students"
        }
      },
      error: null
    };
  }
};

export function StudentSessionControlsPreview() {
  const startsActive = PREVIEW_PARAMS.get("active") === "1";
  const [session, setSession] = useState(startsActive ? {
    ...ACTIVE_SESSION, ...(PREVIEW_PARAMS.get("cycleResults") === "1" ? { target: STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE } : {})
  } : null);
  const members = PREVIEW_PARAMS.get("cycleResults") !== "1" ? ACTIVE_MEMBERS : ACTIVE_MEMBERS.map((member, index) => ({
    ...member, status: "needs_attention", cycle_practice_result: {
      attemptId: `synthetic-cycle-${index}`, cycleId: "cycle-1", status: "incomplete",
      totalQuestions: 4, correctCount: index ? 0 : 1, scoredQuestions: index ? 0 : 2,
      accuracy: index ? null : 50, supportedCount: index ? 2 : 1, mediaFailedCount: index ? 2 : 1,
      practiceSeconds: 1810, checkSeconds: 48, sessionElapsedSeconds: 2015, evidenceStatus: "validated_client_report",
      practiceManifest: [{ construct: "letter_sound", responses: 12 }, { construct: "letter_formation", responses: 8 }],
      checkedConstructs: ["letter_sound", "letter_formation", "phoneme"],
      questionRecords: index ? [] : [
        { questionId: "missed-m", itemKey: "m", construct: "letter_sound", evidenceConstruct: "letter_sound", selected: "n", responseStatus: "incorrect", evidence: {} },
        { questionId: "supported-s", itemKey: "s", construct: "letter_formation", evidenceConstruct: "supported_trace", selected: "s", responseStatus: "supported", evidence: { supportLevel: 1 } },
        { questionId: "media-t", itemKey: "t", construct: "phoneme", evidenceConstruct: "phoneme", selected: null, responseStatus: "media_failed", evidence: {} }
      ]
    }
  }));

  if (session) {
    return (
      <main className="app" data-preview-surface="student-session-live-controls">
        <StudentSessionBar
          connection="connected"
          members={members}
          onEnd={async endAction => {
            document.documentElement.dataset.lastEndAction = endAction;
            return true;
          }}
          session={session}
          students={STUDENTS}
        />
      </main>
    );
  }

  return (
    <main className="app" data-preview-surface="student-session-setup">
      <StudentSessionSetup
        assessmentHistory={[]}
        assessmentHistoryReady
        classDashboard={CLASS_DASHBOARD}
        classId="class-preview"
        className="Maple Class"
        client={client}
        initialTarget={PREVIEW_TARGET}
        initialStudentIds={PRESELECTED_STUDENT_IDS}
        onClose={() => {}}
        onStarted={nextSession => setSession(nextSession)}
        skillTree={[{ id: "initial_sounds", label: "Initial Sounds" }]}
        students={STUDENTS}
      />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<StudentSessionControlsPreview />);
