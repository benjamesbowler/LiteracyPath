import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { speakWithBrowser } from "../utils/audio/speakWithBrowser.js";
import { playCueAudio } from "../utils/audio/cuePlayer.js";
import { SYMBOL_PASSWORD_LENGTH } from "../data/symbolPasswordIcons.js";
import { SymbolPasswordPad } from "./SymbolPasswordPad.jsx";

// Recorded child-voice prompts (public/audio/ui/voice). Browser speech is
// only the fallback while a recording is missing.
const VOICE_LINES = {
  "pick-your-school": "Pick your school.",
  "pick-your-class": "Pick your class.",
  "who-are-you": "Who are you?",
  "tap-your-pictures": "Tap your three secret pictures.",
  "choose-your-pictures": "Choose your three secret pictures.",
  "do-it-again": "Do it again to make sure.",
  "did-not-match": "Those did not match. Try again.",
  "try-again": "Try again.",
  "great-job": "Great job!",
  "ask-teacher": "Ask your teacher for help."
};

function speakLine(key, options = {}) {
  const text = VOICE_LINES[key];
  if (!text) return;
  playCueAudio(`/audio/ui/voice/${key}.mp3`, {
    volume: 0.9,
    onUnavailable: () => speakWithBrowser(text, options)
  });
}

const SCHOOL_STORAGE_KEY = "lp-student-login-school";
const CLASS_STORAGE_KEY = "lp-student-login-class";
const STEP_ITEMS = [
  { id: "school", label: "School" },
  { id: "class", label: "Class" },
  { id: "student", label: "Name" },
  { id: "pictures", label: "Pictures" }
];

function normalizeRows(data) {
  return Array.isArray(data) ? data : [];
}

function FriendlyBack({ onClick }) {
  return (
    <button className="student-flow-text-link" onClick={onClick} type="button">
      I am a teacher
    </button>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div className="student-flow-header">
      <img src="/images/learn-games/phinny-waving.png" alt="" />
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

function getProgressStep(step) {
  if (step === "password" || step === "setup") return "pictures";
  return step;
}

function StepProgress({ step }) {
  const currentIndex = STEP_ITEMS.findIndex(item => item.id === getProgressStep(step));
  return (
    <ol className="student-flow-stepper" aria-label="Student sign in steps">
      {STEP_ITEMS.map((item, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = currentIndex > index;
        return (
          <li
            className={`${isCurrent ? "current" : ""}${isComplete ? " complete" : ""}`}
            key={item.id}
            aria-current={isCurrent ? "step" : undefined}
          >
            <span aria-hidden="true">{isComplete ? "OK" : index + 1}</span>
            {item.label}
          </li>
        );
      })}
    </ol>
  );
}

function StudentFlowState({ title, detail, loading = false }) {
  return (
    <div className={`student-flow-state${loading ? " loading" : ""}`} role="status" aria-live="polite">
      {loading && <span className="student-flow-spinner" aria-hidden="true" />}
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  );
}

function TileGrid({ rows, onPick, selectedId, renderTitle, disabled = false }) {
  return (
    <div className="student-flow-tile-grid">
      {rows.map(row => (
        <button
          className={row.id === selectedId ? "student-flow-tile selected" : "student-flow-tile"}
          disabled={disabled}
          key={row.id}
          onClick={() => onPick(row)}
          type="button"
        >
          <span className="student-flow-avatar" aria-hidden="true">
            {String(row.name || "?").slice(0, 1).toUpperCase()}
          </span>
          <strong>{renderTitle ? renderTitle(row) : row.name}</strong>
        </button>
      ))}
    </div>
  );
}

export function StudentLoginFlow({ onTeacherEntry, onSessionStart }) {
  const [step, setStep] = useState("school");
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sequence, setSequence] = useState("");
  const [confirmSequence, setConfirmSequence] = useState("");
  const [setupSequence, setSetupSequence] = useState("");
  const [setupConfirming, setSetupConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredSchools = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return schools;
    return schools.filter(row => String(row.name || "").toLowerCase().includes(clean));
  }, [query, schools]);

  useEffect(() => {
    let cancelled = false;
    async function loadSchools() {
      setLoading(true);
      const { data, error } = await supabase.rpc("student_list_schools");
      if (cancelled) return;
      setLoading(false);
      if (error) {
        console.error("Student school list failed.", error);
        setStatus("School list is not ready yet. Ask your teacher for help.");
        return;
      }
      const rows = normalizeRows(data);
      setSchools(rows);
      try {
        const rememberedId = window.localStorage.getItem(SCHOOL_STORAGE_KEY);
        const remembered = rows.find(row => row.id === rememberedId);
        if (remembered) setSelectedSchool(remembered);
      } catch {
        // Remembered choices are only a convenience.
      }
    }
    loadSchools();
    return () => {
      cancelled = true;
    };
  }, []);

  async function pickSchool(row) {
    setSelectedSchool(row);
    setSelectedClass(null);
    setSelectedStudent(null);
    setStatus("");
    try {
      window.localStorage.setItem(SCHOOL_STORAGE_KEY, row.id);
    } catch {
      // Ignore local storage failures.
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("student_list_classes", { p_school_id: row.id });
    setLoading(false);
    if (error) {
      console.error("Student class list failed.", error);
      setStatus("Classes are not ready yet.");
      return;
    }
    const rows = normalizeRows(data);
    setClasses(rows);
    setStep("class");
  }

  async function pickClass(row) {
    setSelectedClass(row);
    setSelectedStudent(null);
    setStatus("");
    try {
      window.localStorage.setItem(CLASS_STORAGE_KEY, row.id);
    } catch {
      // Ignore local storage failures.
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("student_list_students", { p_class_id: row.id });
    setLoading(false);
    if (error) {
      console.error("Student list failed.", error);
      setStatus("Names are not ready yet.");
      return;
    }
    setStudents(normalizeRows(data));
    setStep("student");
  }

  function pickStudent(row) {
    setSelectedStudent(row);
    setSequence("");
    setSetupSequence("");
    setSetupConfirming(false);
    setStatus("");
    setLocked(false);
    setStep(row.has_password ? "password" : "setup");
    speakLine(row.has_password ? "tap-your-pictures" : "choose-your-pictures", { rate: 0.84 });
  }

  function startSession(result = {}) {
    const session = {
      token: result.token,
      studentId: result.student_id || selectedStudent?.id,
      studentName: result.student_name || selectedStudent?.name,
      classId: result.class_id || selectedClass?.id,
      teacherId: result.teacher_id || "",
      schoolId: result.school_id || selectedSchool?.id,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000
    };
    if (!session.token || !session.studentId) {
      console.error("Student session missing token or id.", result);
      setStatus(`Login worked but no session was returned (token=${session.token ? "yes" : "MISSING"}, student=${session.studentId ? "yes" : "MISSING"}).`);
      return;
    }
    try {
      onSessionStart?.(session);
    } catch (error) {
      console.error("Could not start student session.", error);
      setStatus(`Could not open the app: ${error?.message || error}`);
    }
  }

  async function submitLogin(nextSequence) {
    if (!selectedStudent || nextSequence.length !== SYMBOL_PASSWORD_LENGTH) return;
    setLoading(true);
    setStatus("");
    const { data, error } = await supabase.rpc("student_login", {
      p_student_id: selectedStudent.id,
      p_sequence: nextSequence
    });
    setLoading(false);
    setSequence("");
    if (error || !data?.ok) {
      const code = data?.error || error?.message || "wrong_password";
      if (code === "locked") {
        setLocked(true);
        setStatus("Ask your teacher for help.");
      } else if (code === "no_password") {
        setStep("setup");
      } else {
        setStatus("Try again!");
        speakLine("try-again", { rate: 0.86 });
      }
      return;
    }
    startSession(data);
  }

  async function submitSetup(nextSequence) {
    if (!selectedStudent || nextSequence.length !== SYMBOL_PASSWORD_LENGTH) return;
    if (!setupConfirming) {
      setSetupSequence(nextSequence);
      setConfirmSequence("");
      setSetupConfirming(true);
      setStatus("Do it again.");
      speakLine("do-it-again", { rate: 0.84 });
      return;
    }
    if (nextSequence !== setupSequence) {
      setSetupSequence("");
      setConfirmSequence("");
      setSetupConfirming(false);
      setStatus("Those did not match. Try again.");
      speakLine("did-not-match", { rate: 0.84 });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("student_set_password", {
      p_student_id: selectedStudent.id,
      p_sequence: nextSequence
    });
    setLoading(false);
    if (error || !data?.ok) {
      setStatus("Ask your teacher for help.");
      return;
    }
    speakLine("great-job", { rate: 0.9 });
    startSession(data);
  }

  return (
    <main className="student-login-flow">
      <section className={`student-flow-card${status ? " has-status" : ""}${locked ? " locked" : ""}`}>
        {step === "school" && (
          <>
            <StepHeader title="Pick your school" subtitle="Tap the big tile." />
            <StepProgress step={step} />
            <input
              className="student-flow-search"
              value={query}
              placeholder="Find school"
              onChange={event => setQuery(event.target.value)}
              type="search"
              aria-label="Find school"
            />
            {loading ? (
              <StudentFlowState title="Loading schools" detail="This should only take a moment." loading />
            ) : filteredSchools.length > 0 ? (
              <TileGrid rows={filteredSchools} selectedId={selectedSchool?.id} onPick={pickSchool} />
            ) : schools.length > 0 ? (
              <StudentFlowState title="No school matches that search" detail="Try a shorter school name." />
            ) : (
              <StudentFlowState title="No schools are ready yet" detail="Ask your teacher to finish school setup." />
            )}
          </>
        )}

        {step === "class" && (
          <>
            <StepHeader title="Pick your class" subtitle={selectedSchool?.name} />
            <StepProgress step={step} />
            {loading ? (
              <StudentFlowState title="Loading classes" loading />
            ) : classes.length > 0 ? (
              <TileGrid rows={classes} selectedId={selectedClass?.id} onPick={pickClass} />
            ) : (
              <StudentFlowState title="No classes are ready yet" detail="Ask your teacher to add your class." />
            )}
          </>
        )}

        {step === "student" && (
          <>
            <StepHeader title="Who are you?" subtitle={selectedClass?.name} />
            <StepProgress step={step} />
            {loading ? (
              <StudentFlowState title="Loading names" loading />
            ) : students.length > 0 ? (
              <TileGrid rows={students} selectedId={selectedStudent?.id} onPick={pickStudent} />
            ) : (
              <StudentFlowState title="No students are ready yet" detail="Ask your teacher to add your name." />
            )}
          </>
        )}

        {step === "password" && (
          <>
            <StepHeader title="Tap your pictures" subtitle={selectedStudent?.name} />
            <StepProgress step={step} />
            {locked ? (
              <div className="student-lockout-card">
                <h2>Ask your teacher for help</h2>
                <p>Your teacher can reset your pictures from the class dashboard.</p>
              </div>
            ) : (
              <SymbolPasswordPad value={sequence} onChange={setSequence} onComplete={submitLogin} disabled={loading} />
            )}
          </>
        )}

        {step === "setup" && (
          <>
            <StepHeader
              title={setupConfirming ? "Do it again" : "Choose your pictures"}
              subtitle={setupConfirming ? "Tap the same three pictures." : "Pick three secret pictures."}
            />
            <StepProgress step={step} />
            <SymbolPasswordPad
              value={setupConfirming ? confirmSequence : setupSequence}
              onChange={setupConfirming ? setConfirmSequence : setSetupSequence}
              onComplete={submitSetup}
              disabled={loading}
            />
          </>
        )}

        {status && <p className="student-flow-status" role="status" aria-live="polite">{status}</p>}
        <div className="student-flow-footer">
          {step !== "school" && (
            <button className="student-flow-back" onClick={() => {
              setStatus("");
              setStep(step === "class" ? "school" : step === "student" ? "class" : "student");
            }} type="button">
              Back
            </button>
          )}
          <FriendlyBack onClick={onTeacherEntry} />
        </div>
      </section>
    </main>
  );
}
