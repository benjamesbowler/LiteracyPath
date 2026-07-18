import { useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateQuestHumanAcceptance,
  QUEST_HUMAN_PROFILES,
  sealQuestHumanObservation,
  validateQuestHumanObservation,
  verifyQuestHumanObservation
} from "../../utils/questHumanAcceptance.js";
import "../../styles/quest-evidence.css";

const STORAGE_KEY = "lp-quest-human-field-records-v1";
const MAX_IMPORT_BYTES = 1024 * 1024;

const PROFILE_DEFINITIONS = Object.freeze([
  {
    id: "child-first-use",
    shortLabel: "First use",
    label: "First-time child play",
    target: "8 different children",
    description: "Watch without teaching the controls first. Record only what the child does independently and the prompts an adult actually gives.",
    fields: [
      { key: "tasksShown", label: "Tasks shown", type: "number", min: 4 },
      { key: "tasksIndependent", label: "Completed without help", type: "number", min: 0 },
      { key: "adultPrompts", label: "Adult prompts given", type: "number", min: 0 },
      { key: "blocked", label: "Was play blocked?", type: "boolean" },
      { key: "severeFrustrationIncidents", label: "Severe frustration incidents", type: "number", min: 0 },
      { key: "enjoymentRating", label: "Enjoyment rating", type: "number", min: 1, max: 5, hint: "1 is very low, 5 is very high" }
    ]
  },
  {
    id: "child-repeat-play",
    shortLabel: "Repeat play",
    label: "Repeat child play",
    target: "6 different children",
    description: "Use a child who has played before. Observe whether the actions remain clear and whether the child chooses to continue or replay.",
    fields: [
      { key: "tasksShown", label: "Tasks shown", type: "number", min: 4 },
      { key: "tasksIndependent", label: "Completed without help", type: "number", min: 0 },
      { key: "adultPrompts", label: "Adult prompts given", type: "number", min: 0 },
      { key: "blocked", label: "Was play blocked?", type: "boolean" },
      { key: "severeFrustrationIncidents", label: "Severe frustration incidents", type: "number", min: 0 },
      { key: "enjoymentRating", label: "Enjoyment rating", type: "number", min: 1, max: 5, hint: "1 is very low, 5 is very high" },
      { key: "voluntaryReplay", label: "Did the child choose to replay?", type: "boolean" },
      { key: "boredomIncidents", label: "Boredom incidents", type: "number", min: 0 }
    ]
  },
  {
    id: "reward-choice",
    shortLabel: "Rewards",
    label: "Reward and shop choice",
    target: "8 different children",
    description: "After earning Sparks and a relic, watch whether the child understands the shop, cumulative equipment, and what the relic changed.",
    fields: [
      { key: "independentStoreChoice", label: "Chose a shop item independently?", type: "boolean" },
      { key: "cumulativeGearRecognized", label: "Recognised that gear stays equipped together?", type: "boolean" },
      { key: "relicPurposeExplained", label: "Could explain what the relic changed?", type: "boolean" },
      { key: "sparksAvailable", label: "Sparks available", type: "number", min: 0 },
      { key: "sparksSpent", label: "Sparks spent", type: "number", min: 0 }
    ]
  },
  {
    id: "teacher-report",
    shortLabel: "Adult report",
    label: "Teacher or parent report",
    target: "5 different adults",
    description: "Show the real report, ask the prepared interpretation questions, and record whether the adult identifies the correct next teaching action.",
    fields: [
      { key: "questionsAsked", label: "Interpretation questions asked", type: "number", min: 4 },
      { key: "questionsCorrect", label: "Questions answered correctly", type: "number", min: 0 },
      { key: "nextActionAccurate", label: "Selected the correct next action?", type: "boolean" },
      { key: "usefulnessRating", label: "Report usefulness", type: "number", min: 1, max: 5, hint: "1 is not useful, 5 is very useful" }
    ]
  },
  {
    id: "classroom-audio",
    shortLabel: "Room audio",
    label: "Classroom audio",
    target: "3 different room profiles",
    description: "Play phonics prompts with the normal score and room noise present. Record intelligibility, cue masking, and sensory discomfort exactly as observed.",
    fields: [
      { key: "roomProfile", label: "Anonymous room profile", type: "text", hint: "For example ROOM-LIBRARY" },
      { key: "deviceModel", label: "Playback device model", type: "text" },
      { key: "promptsPlayed", label: "Prompts played", type: "number", min: 10 },
      { key: "promptsUnderstood", label: "Prompts understood", type: "number", min: 0 },
      { key: "maskingIncidents", label: "Score or effect masking incidents", type: "number", min: 0 },
      { key: "discomfortIncidents", label: "Sensory discomfort incidents", type: "number", min: 0 }
    ]
  }
]);

const PROFILE_BY_ID = Object.freeze(Object.fromEntries(PROFILE_DEFINITIONS.map(profile => [profile.id, profile])));
const FAILURE_LABELS = Object.freeze({
  schema: "Evidence format",
  profile: "Study type",
  session: "Session code",
  observer: "Observer code",
  participant: "Participant code",
  consent: "Consent confirmation",
  date: "Observation date",
  setting: "Setting code",
  privacy: "Privacy check",
  age: "Age",
  tasks: "Task counts",
  prompts: "Adult prompts",
  enjoyment: "Enjoyment rating",
  frustration: "Frustration incidents",
  choice: "Independent shop choice",
  gear: "Cumulative equipment",
  relic: "Relic purpose",
  spend: "Sparks",
  role: "Adult role",
  questions: "Interpretation questions",
  action: "Next action",
  usefulness: "Usefulness rating",
  room: "Room profile",
  device: "Playback device",
  masking: "Masking incidents",
  comfort: "Comfort incidents",
  "evidence-hash": "Integrity seal"
});

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function emptyMeasures(profileId) {
  return Object.fromEntries(PROFILE_BY_ID[profileId].fields.map(field => [field.key, ""]));
}

function createDraft(profileId, carried = {}) {
  return {
    sessionId: "",
    observedAt: localDateTimeValue(),
    observerId: carried.observerId || "",
    settingId: carried.settingId || "",
    consentConfirmed: false,
    participantId: "",
    ageYears: "",
    role: "",
    measures: emptyMeasures(profileId)
  };
}

function parseFieldValue(field, value) {
  if (field.type === "number") return value === "" ? "" : Number(value);
  if (field.type === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
    return "";
  }
  return String(value || "").trim();
}

function observationFromDraft(profileId, draft) {
  const profile = PROFILE_BY_ID[profileId];
  const participant = { anonymousId: String(draft.participantId || "").trim() };
  if (["child-first-use", "child-repeat-play", "reward-choice"].includes(profileId)) {
    participant.ageYears = draft.ageYears === "" ? "" : Number(draft.ageYears);
  }
  if (profileId === "teacher-report") participant.role = draft.role;
  const observedDate = new Date(draft.observedAt);
  return {
    schemaVersion: 1,
    profileId,
    sessionId: String(draft.sessionId || "").trim(),
    observedAt: Number.isFinite(observedDate.getTime()) ? observedDate.toISOString() : "",
    observerId: String(draft.observerId || "").trim(),
    settingId: String(draft.settingId || "").trim(),
    consentConfirmed: draft.consentConfirmed === true,
    participant,
    measures: Object.fromEntries(profile.fields.map(field => [field.key, parseFieldValue(field, draft.measures[field.key])]))
  };
}

function recordKey(record) {
  return `${record.profileId}:${String(record.sessionId || "").toLowerCase()}`;
}

function downloadJson(fileName, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFileName(record) {
  return `${record.profileId}-${record.sessionId}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function profileCount(records, profileId) {
  return records.filter(record => record.profileId === profileId).length;
}

function checkLabel(id) {
  return id.split("-").map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
}

function FieldControl({ field, value, onChange }) {
  const id = `measure-${field.key}`;
  if (field.type === "boolean") {
    return (
      <fieldset className="qe-field qe-binary-field">
        <legend>{field.label}</legend>
        <div className="qe-binary" role="radiogroup" aria-label={field.label}>
          {[{ label: "Yes", value: "true" }, { label: "No", value: "false" }].map(option => (
            <label key={option.value} className={value === option.value ? "is-selected" : ""}>
              <input
                type="radio"
                name={field.key}
                value={option.value}
                checked={value === option.value}
                onChange={event => onChange(event.target.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <label className="qe-field" htmlFor={id}>
      <span>{field.label}</span>
      <input
        id={id}
        type={field.type}
        value={value}
        min={field.min}
        max={field.max}
        step={field.type === "number" ? 1 : undefined}
        inputMode={field.type === "number" ? "numeric" : undefined}
        autoComplete="off"
        spellCheck={field.type === "text" ? false : undefined}
        onChange={event => onChange(event.target.value)}
      />
      {field.hint && <small>{field.hint}</small>}
    </label>
  );
}

export default function QuestFieldStudyConsole() {
  const [profileId, setProfileId] = useState(QUEST_HUMAN_PROFILES[0]);
  const [draft, setDraft] = useState(() => createDraft(QUEST_HUMAN_PROFILES[0]));
  const [records, setRecords] = useState([]);
  const [restored, setRestored] = useState(false);
  const [message, setMessage] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const importRef = useRef(null);
  const profile = PROFILE_BY_ID[profileId];
  const candidate = useMemo(() => observationFromDraft(profileId, draft), [draft, profileId]);
  const validation = useMemo(() => validateQuestHumanObservation(candidate), [candidate]);
  const acceptance = useMemo(() => evaluateQuestHumanAcceptance(records), [records]);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      let stored = [];
      try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        stored = Array.isArray(parsed) ? parsed : [];
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      const verified = await Promise.all(stored.map(async record => ({ record, result: await verifyQuestHumanObservation(record) })));
      if (cancelled) return;
      const clean = verified.filter(item => item.result.status === "valid").map(item => item.record);
      setRecords(clean);
      setRestored(true);
      const rejected = verified.length - clean.length;
      if (rejected) setMessage({ tone: "warning", text: `${rejected} damaged or incomplete stored record${rejected === 1 ? " was" : "s were"} excluded.` });
      window.__questEvidenceReady = true;
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!restored) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.__questEvidenceRecords = records;
  }, [records, restored]);

  const updateDraft = (key, value) => {
    setDraft(current => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const updateMeasure = (key, value) => {
    setDraft(current => ({ ...current, measures: { ...current.measures, [key]: value } }));
    setMessage(null);
  };

  const chooseProfile = nextProfileId => {
    setProfileId(nextProfileId);
    setDraft(current => createDraft(nextProfileId, current));
    setMessage(null);
    setShowErrors(false);
  };

  const saveObservation = async event => {
    event.preventDefault();
    setShowErrors(true);
    if (validation.status !== "valid") {
      setMessage({ tone: "error", text: "Complete the highlighted evidence fields before saving." });
      return;
    }
    if (records.some(record => recordKey(record) === recordKey(candidate))) {
      setMessage({ tone: "error", text: "That study type and session code already exist. Use a new anonymous session code." });
      return;
    }
    const sealed = await sealQuestHumanObservation(candidate);
    setRecords(current => [...current, sealed]);
    downloadJson(`${safeFileName(sealed)}.json`, sealed);
    setMessage({ tone: "success", text: "Observation validated, sealed, stored locally, and downloaded." });
    setDraft(current => createDraft(profileId, current));
    setShowErrors(false);
  };

  const importFiles = async event => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    const existingKeys = new Set(records.map(recordKey));
    const imported = [];
    const rejected = [];
    for (const file of files) {
      if (file.size > MAX_IMPORT_BYTES) {
        rejected.push(`${file.name}: file is larger than 1 MB`);
        continue;
      }
      try {
        const payload = JSON.parse(await file.text());
        const candidates = Array.isArray(payload) ? payload : Array.isArray(payload?.records) ? payload.records : [payload];
        for (const record of candidates) {
          const verification = await verifyQuestHumanObservation(record);
          const key = recordKey(record);
          if (verification.status !== "valid") {
            rejected.push(`${file.name}: ${verification.failures.map(failure => FAILURE_LABELS[failure] || failure).join(", ")}`);
          } else if (existingKeys.has(key)) {
            rejected.push(`${file.name}: duplicate ${record.profileId} session ${record.sessionId}`);
          } else {
            existingKeys.add(key);
            imported.push(record);
          }
        }
      } catch {
        rejected.push(`${file.name}: not a valid evidence file`);
      }
    }
    if (imported.length) setRecords(current => [...current, ...imported]);
    const importedText = `${imported.length} verified record${imported.length === 1 ? "" : "s"} imported.`;
    setMessage({
      tone: rejected.length ? "warning" : "success",
      text: rejected.length ? `${importedText} ${rejected.length} rejected: ${rejected.slice(0, 3).join("; ")}` : importedText
    });
  };

  const exportBundle = () => {
    if (!records.length) {
      setMessage({ tone: "error", text: "There are no verified records to export yet." });
      return;
    }
    downloadJson(`sound-seekers-human-evidence-${new Date().toISOString().slice(0, 10)}.json`, {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      records
    });
    setMessage({ tone: "success", text: `${records.length} sealed records exported as one evidence bundle.` });
  };

  const removeRecord = record => {
    if (!window.confirm(`Remove anonymous session ${record.sessionId} from this browser?`)) return;
    setRecords(current => current.filter(candidateRecord => recordKey(candidateRecord) !== recordKey(record)));
    setMessage({ tone: "warning", text: `Session ${record.sessionId} was removed from this browser only.` });
  };

  const clearRecords = () => {
    if (!records.length || !window.confirm("Remove every locally stored observation from this browser? Downloaded files will not be changed.")) return;
    setRecords([]);
    setMessage({ tone: "warning", text: "Local evidence cleared. Downloaded evidence files were not changed." });
  };

  const participantLabel = profileId === "teacher-report"
    ? "Adult study code"
    : profileId === "classroom-audio" ? "Audio observation code" : "Child study code";

  return (
    <main className="qe-app">
      <header className="qe-header">
        <div className="qe-brand" aria-label="Sound Seekers field study">
          <span aria-hidden="true">SS</span>
          <div>
            <strong>Sound Seekers</strong>
            <small>Field acceptance console</small>
          </div>
        </div>
        <p className="qe-privacy"><strong>No names.</strong> Use anonymous study codes only.</p>
        <a className="qe-play-link" href="/preview/quest.html?view=den&display=pixel&sound=1" target="_blank" rel="noreferrer">Open game session</a>
      </header>

      <div className="qe-workspace">
        <nav className="qe-profile-nav" aria-label="Observation types">
          <div className="qe-nav-heading">
            <small>Study sequence</small>
            <strong>{records.length} sealed records</strong>
          </div>
          <div className="qe-profile-tabs">
            {PROFILE_DEFINITIONS.map((item, index) => (
              <button
                type="button"
                key={item.id}
                className={profileId === item.id ? "is-active" : ""}
                aria-pressed={profileId === item.id}
                onClick={() => chooseProfile(item.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{item.shortLabel}</strong><small>{profileCount(records, item.id)} recorded</small></span>
              </button>
            ))}
          </div>
          <div className="qe-record-tools">
            <input ref={importRef} type="file" accept="application/json,.json" multiple hidden onChange={importFiles} />
            <button type="button" onClick={() => importRef.current?.click()}>Import evidence</button>
            <button type="button" onClick={exportBundle}>Export all records</button>
          </div>
        </nav>

        <section className="qe-form-column" aria-labelledby="qe-form-title">
          <div className="qe-form-intro">
            <div>
              <small>{profile.target}</small>
              <h1 id="qe-form-title">{profile.label}</h1>
            </div>
            <span className={`qe-status-chip is-${acceptance.categoryStatus[profileId]}`}>{acceptance.categoryStatus[profileId]}</span>
          </div>
          <p className="qe-description">{profile.description}</p>

          {message && <div className={`qe-message is-${message.tone}`} role="status" aria-live="polite">{message.text}</div>}
          {showErrors && validation.status !== "valid" && (
            <div className="qe-errors" role="alert">
              <strong>Needs attention</strong>
              <span>{validation.failures.map(failure => FAILURE_LABELS[failure] || failure).join(", ")}</span>
            </div>
          )}

          <form className="qe-observation-form" onSubmit={saveObservation} noValidate>
            <fieldset className="qe-section">
              <legend>Session</legend>
              <div className="qe-field-grid">
                <label className="qe-field" htmlFor="session-id">
                  <span>Anonymous session code</span>
                  <input id="session-id" value={draft.sessionId} autoComplete="off" spellCheck="false" placeholder="SESSION-001" onChange={event => updateDraft("sessionId", event.target.value)} />
                </label>
                <label className="qe-field" htmlFor="observed-at">
                  <span>Observed at</span>
                  <input id="observed-at" type="datetime-local" value={draft.observedAt} onChange={event => updateDraft("observedAt", event.target.value)} />
                </label>
                <label className="qe-field" htmlFor="observer-id">
                  <span>Observer code</span>
                  <input id="observer-id" value={draft.observerId} autoComplete="off" spellCheck="false" placeholder="OBS-01" onChange={event => updateDraft("observerId", event.target.value)} />
                </label>
                <label className="qe-field" htmlFor="setting-id">
                  <span>Setting code</span>
                  <input id="setting-id" value={draft.settingId} autoComplete="off" spellCheck="false" placeholder="ROOM-QUIET" onChange={event => updateDraft("settingId", event.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset className="qe-section">
              <legend>Participant</legend>
              <div className="qe-field-grid">
                <label className="qe-field" htmlFor="participant-id">
                  <span>{participantLabel}</span>
                  <input id="participant-id" value={draft.participantId} autoComplete="off" spellCheck="false" placeholder={profileId === "teacher-report" ? "ADULT-001" : "CHILD-001"} onChange={event => updateDraft("participantId", event.target.value)} />
                </label>
                {["child-first-use", "child-repeat-play", "reward-choice"].includes(profileId) && (
                  <label className="qe-field" htmlFor="age-years">
                    <span>Age in years</span>
                    <input id="age-years" type="number" min="4" max="8" step="1" inputMode="numeric" value={draft.ageYears} onChange={event => updateDraft("ageYears", event.target.value)} />
                  </label>
                )}
                {profileId === "teacher-report" && (
                  <label className="qe-field" htmlFor="adult-role">
                    <span>Adult role</span>
                    <select id="adult-role" value={draft.role} onChange={event => updateDraft("role", event.target.value)}>
                      <option value="">Choose a role</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="specialist">Literacy specialist</option>
                    </select>
                  </label>
                )}
              </div>
            </fieldset>

            <fieldset className="qe-section">
              <legend>Observed measures</legend>
              <div className="qe-field-grid">
                {profile.fields.map(field => (
                  <FieldControl key={field.key} field={field} value={draft.measures[field.key]} onChange={value => updateMeasure(field.key, value)} />
                ))}
              </div>
            </fieldset>

            <label className="qe-consent">
              <input type="checkbox" checked={draft.consentConfirmed} onChange={event => updateDraft("consentConfirmed", event.target.checked)} />
              <span><strong>Consent confirmed</strong><small>No direct identifiers have been entered.</small></span>
            </label>

            <div className="qe-form-actions">
              <button className="qe-save" type="submit">Validate and save observation</button>
              <small>Saving downloads an integrity-sealed JSON record and keeps a verified local copy.</small>
            </div>
          </form>

          <section className="qe-saved" aria-labelledby="qe-saved-title">
            <div className="qe-section-heading">
              <div><small>Local browser</small><h2 id="qe-saved-title">Sealed observations</h2></div>
              <button type="button" onClick={clearRecords} disabled={!records.length}>Clear local records</button>
            </div>
            {!records.length ? (
              <p className="qe-empty">No observations are stored in this browser yet.</p>
            ) : (
              <ol className="qe-record-list">
                {[...records].reverse().map(record => (
                  <li key={recordKey(record)}>
                    <span className="qe-record-type">{PROFILE_BY_ID[record.profileId]?.shortLabel || record.profileId}</span>
                    <span><strong>{record.sessionId}</strong><small>{record.participant.anonymousId} · {new Date(record.observedAt).toLocaleDateString()}</small></span>
                    <code title="Evidence integrity hash">{record.evidenceHash.slice(0, 8)}</code>
                    <button type="button" onClick={() => removeRecord(record)}>Remove</button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>

        <aside className="qe-matrix" aria-labelledby="qe-matrix-title">
          <div className="qe-matrix-heading">
            <small>Release evidence</small>
            <h2 id="qe-matrix-title">Acceptance matrix</h2>
            <strong className={`qe-overall is-${acceptance.status}`}>{acceptance.status}</strong>
          </div>
          <p>Individual participants are never labelled pass or fail. Only the complete anonymised cohort is assessed.</p>
          <div className="qe-matrix-groups">
            {PROFILE_DEFINITIONS.map(item => (
              <details key={item.id} open={item.id === profileId}>
                <summary>
                  <span><strong>{item.shortLabel}</strong><small>{profileCount(records, item.id)} records</small></span>
                  <span className={`qe-dot is-${acceptance.categoryStatus[item.id]}`} aria-label={acceptance.categoryStatus[item.id]} />
                </summary>
                <ul>
                  {(acceptance.categories[item.id] || []).map(check => (
                    <li key={check.id} className={check.pass ? "is-pass" : "is-open"}>
                      <span>{checkLabel(check.id)}</span>
                      <strong>{check.pass ? "Pass" : check.detail}</strong>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <div className="qe-integrity-note">
            <strong>{acceptance.validRecords} verified</strong>
            <span>{acceptance.invalidRecords} invalid · {acceptance.duplicateRecords} duplicate</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
