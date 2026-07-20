import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { playCueAudio } from "../utils/audio/cuePlayer.js";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";
import { SYMBOL_PASSWORD_LENGTH } from "../data/symbolPasswordIcons.js";
import { SymbolPasswordPad } from "./SymbolPasswordPad.jsx";

// Recorded child-voice prompts (public/audio/ui/voice). Missing clips stay
// silent and the picture-first UI remains usable; browser TTS is never used.
const VOICE_LINES = {
  "class-code": "Ask your teacher for your class code.",
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
  if (!VOICE_LINES[key]) return false;
  const src = `/audio/ui/voice/${key}.mp3`;
  if (!AUDIO_FILE_PATHS.has(src)) return false;
  playCueAudio(src, { volume: options.volume ?? 0.9 });
  return true;
}

// Remember the whole class context on this device so a shared classroom iPad
// jumps straight to the name list. The code is the roster key, so it is what we
// re-check on launch; the id/name are only a cached label for the header.
const CLASS_CONTEXT_STORAGE_KEY = "lp-student-login-class-context-v1";
const STEP_ITEMS = [
  { id: "code", label: "Class" },
  { id: "student", label: "Name" },
  { id: "pictures", label: "Pictures" }
];

function normalizeRows(data) {
  return Array.isArray(data) ? data : [];
}

function readRememberedContext() {
  try {
    const raw = window.localStorage.getItem(CLASS_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.code === "string" ? parsed : null;
  } catch {
    return null;
  }
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
      <img src="/images/pals/poses/meadow-wave.webp" alt="" />
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
  const [step, setStep] = useState("code");
  // Seed from the remembered class so a shared device shows its code while the
  // roster re-verifies (avoids a setState-in-effect just to prefill this).
  const [codeInput, setCodeInput] = useState(() => readRememberedContext()?.code || "");
  const [classCode, setClassCode] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sequence, setSequence] = useState("");
  const [confirmSequence, setConfirmSequence] = useState("");
  const [setupSequence, setSetupSequence] = useState("");
  const [setupConfirming, setSetupConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  // Synchronous guard so a fast double-tap can't fire the same RPC twice
  // before React state updates land.
  const busyRef = useRef(false);

  const normalizedCodeInput = useMemo(
    () => codeInput.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6),
    [codeInput]
  );

  // Apply a resolved class roster (from a code lookup) to state.
  function applyClassContext(payload, code) {
    setClassCode(code);
    setSelectedClass(payload.class || null);
    setSelectedSchool(payload.school || null);
    setStudents(normalizeRows(payload.students));
    setSelectedStudent(null);
    setStatus("");
    setStep("student");
    speakLine("who-are-you", { rate: 0.9 });
    try {
      window.localStorage.setItem(
        CLASS_CONTEXT_STORAGE_KEY,
        JSON.stringify({ code, class: payload.class || null, school: payload.school || null })
      );
    } catch {
      // Remembering the class is only a convenience.
    }
  }

  async function resolveCode(rawCode, { silentOnFail = false } = {}) {
    const code = String(rawCode || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (code.length < 4) {
      if (!silentOnFail) setStatus("Enter the class code your teacher gave you.");
      return false;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("student_class_by_code", { p_code: code });
    setLoading(false);
    if (error || !data?.ok) {
      if (!silentOnFail) {
        setStatus(data?.error === "not_found" ? "That code did not match. Check with your teacher." : "Class list is not ready yet. Ask your teacher.");
      }
      return false;
    }
    applyClassContext(data, code);
    return true;
  }

  // On a shared classroom device, re-verify the remembered code and jump to the
  // name list. If the teacher regenerated the code, this fails silently and the
  // child sees the code entry screen.
  useEffect(() => {
    let cancelled = false;
    const remembered = readRememberedContext();
    if (!remembered) return undefined;
    (async () => {
      if (cancelled) return;
      const ok = await resolveCode(remembered.code, { silentOnFail: true });
      if (!ok && !cancelled) {
        try {
          window.localStorage.removeItem(CLASS_CONTEXT_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCode() {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      await resolveCode(normalizedCodeInput);
    } finally {
      busyRef.current = false;
    }
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

  function forgetClass() {
    try {
      window.localStorage.removeItem(CLASS_CONTEXT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setClassCode("");
    setCodeInput("");
    setStudents([]);
    setSelectedClass(null);
    setSelectedSchool(null);
    setSelectedStudent(null);
    setStatus("");
    setStep("code");
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
      p_sequence: nextSequence,
      p_code: classCode
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
        {step === "code" && (
          <>
            <StepHeader title="Enter your class code" subtitle="Your teacher will tell you the code." />
            <StepProgress step={step} />
            <input
              className="student-flow-search student-flow-code"
              value={codeInput}
              placeholder="ABC123"
              onChange={event => setCodeInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") submitCode();
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Class code"
              inputMode="text"
            />
            <button
              className="lp-button lp-button-primary student-flow-code-go"
              type="button"
              onClick={submitCode}
              disabled={loading || normalizedCodeInput.length < 4}
            >
              {loading ? "Checking…" : "Go"}
            </button>
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
          {step === "student" && (
            <button className="student-flow-back" onClick={forgetClass} type="button">
              Not your class?
            </button>
          )}
          {(step === "password" || step === "setup") && (
            <button className="student-flow-back" onClick={() => {
              setStatus("");
              setLocked(false);
              setStep("student");
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
