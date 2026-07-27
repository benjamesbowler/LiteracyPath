import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient.js";
import { playCueAudio } from "../utils/audio/cuePlayer.js";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";
import { SYMBOL_PASSWORD_LENGTH } from "../data/symbolPasswordIcons.js";
import {
  loadCompatibleStudentClass,
  loginCompatibleStudent
} from "../data/classApiCompatibility.js";
import { classifyStudentCodeRecovery } from "../policy/studentLoginRecovery.js";
import { SymbolPasswordPad } from "./SymbolPasswordPad.jsx";
import { CHILD_COPY } from "../copy/childCopy.js";

// Recorded child-voice prompts (public/audio/ui/voice). Missing clips stay
// silent and the picture-first UI remains usable; browser TTS is never used.
const VOICE_LINES = {
  "class-code": CHILD_COPY.signIn.missingCode,
  "who-are-you": CHILD_COPY.signIn.whoAreYou,
  "tap-your-pictures": CHILD_COPY.signIn.pictures,
  "did-not-match": "That did not match.",
  "try-again": CHILD_COPY.actions.tryAgain,
  "ask-teacher": CHILD_COPY.signIn.askTeacher
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
const CLASS_ACCESS_DEVICE_STORAGE_KEY = "lp-class-access-device-v1";
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

function readOrCreateClassAccessDeviceId() {
  try {
    const saved = window.localStorage.getItem(CLASS_ACCESS_DEVICE_STORAGE_KEY);
    if (/^[A-Za-z0-9._:-]{16,120}$/.test(saved || "")) return saved;
    const generated = globalThis.crypto?.randomUUID?.()
      || `lp-device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
    window.localStorage.setItem(CLASS_ACCESS_DEVICE_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `lp-device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
  }
}

function FriendlyBack({ onClick }) {
  return (
    <button
      className="student-flow-text-link student-teacher-escape"
      onClick={onClick}
      type="button"
    >
      I am a teacher
    </button>
  );
}

const EXAMPLE_CLASS_CODE = "ABC123";

function ClassCodeExample() {
  return (
    <aside className="student-class-code-example" aria-label={`Class code example: ${EXAMPLE_CLASS_CODE}`}>
      <span>Example class code</span>
      <div aria-hidden="true">
        {EXAMPLE_CLASS_CODE.split("").map((character, index) => (
          <strong key={`${character}-${index}`}>{character}</strong>
        ))}
      </div>
      <p>Type the letters and numbers your teacher shows you.</p>
    </aside>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div className="student-flow-header">
      <img src="/images/pals/poses/meadow-wave.webp" alt="" />
      <div>
        <h1 data-child-title="">{title}</h1>
        {subtitle && <p data-child-instruction="">{subtitle}</p>}
      </div>
    </div>
  );
}

function getProgressStep(step) {
  if (step === "password" || step === "not-ready") return "pictures";
  return step;
}

function StepProgress({ step }) {
  const currentIndex = STEP_ITEMS.findIndex(item => item.id === getProgressStep(step));
  return (
    <ol className="student-flow-stepper" aria-label="Sign-in steps" data-child-progress="">
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

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7l-4 3H5Z" fill="currentColor" />
      <path d="M15.5 9.5a4 4 0 0 1 0 5M18 7a8 8 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function StudentLoginRecovery({ recovery, onHear }) {
  return (
    <section
      className="student-login-recovery"
      data-login-recovery={recovery.id}
      role="alert"
      aria-live="assertive"
    >
      <img src={recovery.image} alt="" data-recovery-illustration={recovery.id} />
      <div>
        <h2>{recovery.title}</h2>
        <p>{recovery.detail}</p>
        <button
          className="student-recovery-hear"
          type="button"
          aria-label={`Hear: ${recovery.title}`}
          onClick={onHear}
        >
          <SpeakerIcon />
          Hear what to do
        </button>
      </div>
    </section>
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

export function StudentLoginFlow({
  client = supabase,
  onTeacherEntry,
  onSessionStart
}) {
  const [step, setStep] = useState("code");
  // Seed from the remembered class so a shared device shows its code while the
  // roster re-verifies (avoids a setState-in-effect just to prefill this).
  const [codeInput, setCodeInput] = useState(() => readRememberedContext()?.code || "");
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sequence, setSequence] = useState("");
  const [status, setStatus] = useState("");
  const [recovery, setRecovery] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const deviceIdRef = useRef(readOrCreateClassAccessDeviceId());
  // Synchronous guard so a fast double-tap can't fire the same RPC twice
  // before React state updates land.
  const busyRef = useRef(false);

  const normalizedCodeInput = useMemo(
    () => codeInput.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6),
    [codeInput]
  );

  // Apply a resolved class roster (from a code lookup) to state.
  function applyClassContext(payload, code) {
    setSelectedClass(payload.class || null);
    setSelectedSchool(payload.school || null);
    setStudents(normalizeRows(payload.students));
    setSelectedStudent(null);
    setStatus("");
    setRecovery(null);
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
      if (!silentOnFail) {
        setRecovery(null);
        setStatus(CHILD_COPY.signIn.missingCode);
      }
      return false;
    }
    setLoading(true);
    setRecovery(null);
    const { data, error } = await loadCompatibleStudentClass({
      client,
      code,
      deviceId: deviceIdRef.current
    });
    setLoading(false);
    if (error || !data?.ok) {
      if (!silentOnFail) {
        const nextRecovery = classifyStudentCodeRecovery({
          data,
          error,
          online: typeof navigator === "undefined" ? true : navigator.onLine
        });
        setStatus("");
        setRecovery(nextRecovery);
        speakLine(nextRecovery.audioKey);
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
    setStatus("");
    setRecovery(null);
    setLocked(false);
    if (!row.has_password) {
      setStep("not-ready");
      speakLine("ask-teacher", { rate: 0.84 });
      return;
    }
    setStep("password");
    speakLine("tap-your-pictures", { rate: 0.84 });
  }

  function forgetClass() {
    try {
      window.localStorage.removeItem(CLASS_CONTEXT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setCodeInput("");
    setStudents([]);
    setSelectedClass(null);
    setSelectedSchool(null);
    setSelectedStudent(null);
    setStatus("");
    setRecovery(null);
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
      setStatus(CHILD_COPY.signIn.askTeacher);
      return;
    }
    try {
      onSessionStart?.(session);
    } catch (error) {
      console.error("Could not start student session.", error);
      setStatus(CHILD_COPY.signIn.askTeacher);
    }
  }

  async function submitLogin(nextSequence) {
    if (!selectedStudent || nextSequence.length !== SYMBOL_PASSWORD_LENGTH) return;
    setLoading(true);
    setStatus("");
    setRecovery(null);
    const { data, error } = await loginCompatibleStudent({
      client,
      studentId: selectedStudent.id,
      sequence: nextSequence,
      deviceId: deviceIdRef.current,
      code: normalizedCodeInput
    });
    setLoading(false);
    setSequence("");
    if (error || !data?.ok) {
      const code = data?.error || error?.message || "wrong_password";
      if (code === "locked" || code === "rate_limited") {
        setLocked(true);
        setStatus(CHILD_COPY.signIn.askTeacher);
      } else if (code === "no_password") {
        setStep("not-ready");
        setStatus("");
        speakLine("ask-teacher", { rate: 0.84 });
      } else {
        setStatus(CHILD_COPY.signIn.tryAgain);
        speakLine("try-again", { rate: 0.86 });
      }
      return;
    }
    startSession(data);
  }

  return (
    <main className="student-login-flow" data-child-surface="student-login">
      <section className={`student-flow-card${status ? " has-status" : ""}${locked ? " locked" : ""}`}>
        {step === "code" && (
          <>
            <StepHeader title={CHILD_COPY.signIn.classCodeTitle} subtitle={CHILD_COPY.signIn.classCodeHelp} />
            <StepProgress step={step} />
            <div className="student-code-entry-layout" data-child-choices="">
              <div className="student-code-entry-form">
                <label htmlFor="student-class-code">Your class code</label>
                <input
                  id="student-class-code"
                  className="student-flow-search student-flow-code"
                  value={codeInput}
                  placeholder="ABC123"
                  onChange={event => {
                    setCodeInput(event.target.value);
                    setStatus("");
                    setRecovery(null);
                  }}
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
                  data-child-primary=""
                  data-child-emphasis="primary"
                  data-child-emphasis-cue=""
                >
                  {loading ? "Checking…" : "Go"}
                </button>
              </div>
              <ClassCodeExample />
            </div>
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
              <StudentFlowState title="No names are ready yet" detail={CHILD_COPY.signIn.askTeacher} />
            )}
          </>
        )}

        {step === "password" && (
          <>
            <StepHeader title="Tap your pictures" subtitle={selectedStudent?.name} />
            <StepProgress step={step} />
            {locked ? (
              <div className="student-lockout-card">
                <h2>{CHILD_COPY.signIn.askTeacher}</h2>
                <p>Your teacher can reset your pictures from the class dashboard.</p>
              </div>
            ) : (
              <SymbolPasswordPad value={sequence} onChange={setSequence} onComplete={submitLogin} disabled={loading} />
            )}
          </>
        )}

        {step === "not-ready" && (
          <>
            <StepHeader title="Ask your teacher" subtitle={selectedStudent?.name} />
            <StepProgress step={step} />
            <div className="student-lockout-card">
              <h2>Your pictures are not ready yet</h2>
              <p>Your teacher can choose your three sign-in pictures.</p>
            </div>
          </>
        )}

        {recovery && (
          <StudentLoginRecovery
            recovery={recovery}
            onHear={() => speakLine(recovery.audioKey)}
          />
        )}
        {status && <p className="student-flow-status" role="status" aria-live="polite">{status}</p>}
        <div className="student-flow-footer">
          {step === "student" && (
            <button className="student-flow-back" onClick={forgetClass} type="button">
              Not your class?
            </button>
          )}
          {(step === "password" || step === "not-ready") && (
            <button className="student-flow-back" onClick={() => {
              setStatus("");
              setRecovery(null);
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
