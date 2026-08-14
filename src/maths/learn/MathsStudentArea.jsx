import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle,
  Eye,
  GridNine,
  House,
  ListNumbers,
  SpeakerHigh,
  Sparkle
} from "@phosphor-icons/react";
import StudentGlassShell from "../../components/StudentGlassShell.jsx";
import { mathsSkillById, APPROVED_FOUNDATION_SKILL_IDS } from "../curriculum/mathsSkillTree.js";
import { flushMathsEvidenceQueue, mathsLessonStorageKey, recordStudentMathsEvidence } from "../data/mathsEvidenceStore.js";
import { MathsManipulative } from "../manipulatives/MathsManipulative.jsx";
import { MathsAudioButton, MathsSongPlayer } from "../media/MathsAudioButton.jsx";
import { mathsActivityRecipesBySkill, mathsLessonInstruction, mathsLessonInstructionAudioId, mathsLessonStageIsReady, MATHS_CONTENT_VERSION, MATHS_LESSON_STAGES, MATHS_LESSON_STAGE_GOALS } from "./mathsActivityRecipes.js";
import { assessmentOptionsForItem, buildMathsAssessmentRound, classifyMathsResponse } from "../assessment/mathsAssessmentBank.js";
import { releasedMathsStories } from "../stories/mathsStoryCatalog.js";
import { createMathsGameSession, evaluateMathsGameRound, mathsGames } from "../games/mathsGames.js";
import { mathsArcadeArt } from "../games/mathsArcadeArt.js";
import { mathsSongs } from "../music/mathsSongs.js";
import { mathsLessonStageChoices } from "./mathsLessonReflections.js";
import "../../styles/maths-platform.css";
import "../../styles/maths-platform-v2.css";

const MathsArcadeGame = lazy(() => import("../games/MathsArcadeGames.jsx")
  .then(module => ({ default: module.MathsArcadeGame })));

const OBJECT_NOUNS = Object.freeze({ meadow_stones: ["meadow stone", "meadow stones"], buttons: ["button", "buttons"], leaves: ["leaf", "leaves"], shells: ["shell", "shells"], stone: ["stone", "stones"], bun: ["bun", "buns"], berry: ["berry", "berries"], duckling: ["duckling", "ducklings"] });
const quantityNoun = (family, count) => {
  const name = String(family || "stone").replaceAll("_", " ");
  const pair = OBJECT_NOUNS[family] || [name, `${name}s`];
  return pair[count === 1 ? 0 : 1];
};

function useMathsEvidence({ client, studentId, token }) {
  const [saveState, setSaveState] = useState("");
  useEffect(() => {
    if (!client || !studentId || !token) return undefined;
    let current = true;
    const flush = () => flushMathsEvidenceQueue({ audience: "student", scopeId: studentId, client, token })
      .then(result => {
        if (!current || !result.flushed) return;
        setSaveState(`${result.flushed} saved Maths ${result.flushed === 1 ? "result" : "results"} synced${result.assignmentsCompleted ? `; ${result.assignmentsCompleted} assignment${result.assignmentsCompleted === 1 ? "" : "s"} completed` : ""}.`);
        return client.call("student_report_maths_evidence_sync_health", { p_token: token, p_delivered: result.flushed, p_pending: result.remaining, p_rejected: result.rejected });
      })
      .catch(() => {});
    void flush();
    window.addEventListener("online", flush);
    return () => { current = false; window.removeEventListener("online", flush); };
  }, [client, studentId, token]);
  const record = async input => {
    if (!client || !studentId || !token) {
      setSaveState("Cloud saving is unavailable, so this practice has not been added to your teacher’s report.");
      return null;
    }
    setSaveState("Saving…");
    try {
      const result = await recordStudentMathsEvidence({ client, studentId, token, ...input });
      setSaveState(result.cloudSaved ? "Saved" : result.queued ? "Saved on this device; it will sync automatically." : "This result could not be saved.");
      return result;
    } catch {
      setSaveState("This result could not be saved. You can keep using Maths.");
      return null;
    }
  };
  return { record, saveState };
}

async function completeAssignedActivity({ assignment, client, token, saved }) {
  if (!assignment?.id || !saved?.cloudSaved || !client?.call || !token) return false;
  const { data, error } = await client.call("student_complete_maths_assignment", { p_token: token, p_assignment_id: assignment.id });
  return !error && Boolean(data?.ok);
}

function AreaShell({ studentName, progressScopeKey, surfaceId, title, eyebrow, onHome, children }) {
  return <StudentGlassShell studentName={studentName} scopeKey={progressScopeKey} active="maths" tabs={[]} showWallet={false} showGrownUps={false} onHome={onHome}>
    <div className="maths-student-area maths-student-area-v2" data-child-surface={surfaceId}>
      <header className="maths-area-heading maths-area-heading-v2">
        <button aria-label="Back to Maths home" onClick={onHome} type="button"><ArrowLeft aria-hidden="true" size={20} weight="bold" /><span>Maths home</span></button>
        <div><p data-child-instruction>{eyebrow}</p><h1 data-child-title>{title}</h1></div>
      </header>
      {children}
    </div>
  </StudentGlassShell>;
}

export function QuantityPicture({ model, objectFamily = "stone", compact = false, hidden = false, accessibleLabel = "" }) {
  if (!model) return null;
  if (hidden) return <div aria-label="The quantity is hidden. Choose what you saw." className="maths-quantity-mask" role="img"><span aria-hidden="true">?</span><small>Picture hidden</small></div>;
  if (model.kind === "groups") {
    const family = model.object || objectFamily;
    const total = model.parts.reduce((sum, value) => sum + Number(value || 0), Number(model.pool || 0));
    return <div className="maths-picture-groups" role="img" aria-label={accessibleLabel || `${model.parts.join(" and ")} ${quantityNoun(family, total)} in two groups${model.pool ? `, with ${model.pool} waiting` : ""}`}>
      <div data-group-label={model.groupLabels?.[0] || "group one"}>{Array.from({ length: model.parts[0] }, (_, index) => <span data-object={family} key={index} />)}</div>
      {Number.isFinite(model.pool) && <div className="maths-picture-pool" data-group-label="waiting" aria-label={`${model.pool} waiting`}>{Array.from({ length: model.pool }, (_, index) => <span data-object={family} key={index} />)}</div>}
      <div data-group-label={model.groupLabels?.[1] || "group two"}>{Array.from({ length: model.parts[1] }, (_, index) => <span data-object={family} key={index} />)}</div>
    </div>;
  }
  const capacity = model.capacity || Math.max(5, model.target || model.total || 5);
  const filled = model.filled ?? model.shown ?? model.visible ?? (model.kind === "missing" ? model.parts?.[0] : undefined) ?? model.total ?? 0;
  if (["frame", "missing"].includes(model.kind)) {
    const firstPart = Number(model.parts?.[0]);
    return <div className={`maths-picture-frame cells-${capacity}${compact ? " is-compact" : ""}`} role="img" aria-label={accessibleLabel || `${filled} filled spaces out of ${capacity}${Number.isFinite(firstPart) ? `, split into ${firstPart} and ${Math.max(0, filled - firstPart)}` : ""}`}>
      {Array.from({ length: capacity }, (_, index) => <span className={index < filled ? `is-filled ${Number.isFinite(firstPart) && index >= firstPart ? "is-part-b" : "is-part-a"}` : "is-empty"} key={index} />)}
    </div>;
  }
  if (["part_whole", "equation"].includes(model.kind)) {
    return <div className="maths-picture-part-whole" role="img" aria-label={accessibleLabel || `${model.parts.join(" and ")} make ${model.total}`}>
      <strong>{model.total}</strong><div>{model.parts.map((part, index) => <span key={index}>{part}</span>)}</div>
      {model.kind === "equation" && <small>{model.parts.join(" + ")} = {model.total}</small>}
    </div>;
  }
  const count = model.visible ?? model.total ?? model.target ?? 0;
  return <div className={`maths-picture-objects arrangement-${model.arrangement || "cluster"}${compact ? " is-compact" : ""}`} role="img" aria-label={accessibleLabel || `${count} ${quantityNoun(objectFamily, count)}`}>
    {Array.from({ length: count }, (_, index) => <span data-object={model.object || objectFamily} key={index} />)}
  </div>;
}

function QuantityBuilder({ capacity, initial = 0, prompt, onSubmit, disabled = false, representation = "frame", submitLabel = "Use this model" }) {
  const [count, setCount] = useState(initial);
  const [actions, setActions] = useState([]);
  const change = next => {
    const value = Math.max(0, Math.min(capacity, next));
    setCount(value);
    setActions(rows => [...rows, value > count ? "add" : "remove"]);
  };
  return <div className="maths-quantity-builder">
    <p>{prompt}</p>
    {representation === "counter_tray"
      ? <div className="maths-builder-counter-tray" role="img" aria-label={`${count} counters in the tray`}>{Array.from({ length: count }, (_, index) => <span key={index} />)}</div>
      : <QuantityPicture model={{ kind: "frame", capacity, filled: count }} />}
    <div className="maths-builder-controls" role="group" aria-label="Build the quantity">
      <button disabled={disabled || count === 0} onClick={() => change(count - 1)} type="button">Take one away</button>
      <output aria-live="polite">{count}</output>
      <button disabled={disabled || count === capacity} onClick={() => change(count + 1)} type="button">Add one</button>
    </div>
    <button className="maths-submit-model" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled} onClick={() => onSubmit(count, { count, actions, capacity, component: representation === "counter_tray" ? "counter_tray_builder" : "frame_builder", representation })} type="button">{submitLabel}</button>
  </div>;
}

export function MathsLessonPlayer({ studentName, progressScopeKey, client, studentId, token, assignment = null, onHome }) {
  const assignedSkill = assignment?.skillId && APPROVED_FOUNDATION_SKILL_IDS.includes(assignment.skillId) ? assignment.skillId : "";
  const initialSkillId = assignedSkill || APPROVED_FOUNDATION_SKILL_IDS[0];
  const readCheckpoint = selectedSkillId => {
    try {
      const raw = localStorage.getItem(mathsLessonStorageKey(studentId || progressScopeKey, selectedSkillId));
      if (!raw) return { step: 0, modelState: null, stageFeedback: "" };
      if (/^\d+$/.test(raw)) return { step: Math.max(0, Math.min(6, Number(raw))), modelState: null, stageFeedback: "" };
      const value = JSON.parse(raw);
      return { step: Math.max(0, Math.min(6, Number(value?.step) || 0)), modelState: value?.modelState || null, stageFeedback: String(value?.stageFeedback || ""), stageActionCount: Math.max(0, Number(value?.stageActionCount) || 0) };
    } catch { return { step: 0, modelState: null, stageFeedback: "" }; }
  };
  const initialCheckpoint = readCheckpoint(initialSkillId);
  const [skillId, setSkillId] = useState(initialSkillId);
  const storageKey = mathsLessonStorageKey(studentId || progressScopeKey, skillId);
  const [step, setStep] = useState(initialCheckpoint.step);
  const [modelState, setModelState] = useState(initialCheckpoint.modelState);
  const [stageFeedback, setStageFeedback] = useState(initialCheckpoint.stageFeedback);
  const [stageActionCount, setStageActionCount] = useState(initialCheckpoint.stageActionCount || 0);
  const [finished, setFinished] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  const recipes = mathsActivityRecipesBySkill[skillId];
  const stage = MATHS_LESSON_STAGES[step];
  const stageChoices = mathsLessonStageChoices(skillId, stage);
  const recipe = recipes[Math.min(recipes.length - 1, stage === "retrieve" ? 0 : ["model", "notice"].includes(stage) ? 1 : ["make", "explain"].includes(stage) ? 2 : stage === "apply" ? 3 : 4)];
  const stageReady = mathsLessonStageIsReady(skillId, stage, modelState, stageFeedback, stageActionCount);
  const persist = checkpoint => {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, ...checkpoint })); } catch { /* resilient private mode */ }
  };
  const move = next => {
    setStep(next);
    setStageFeedback("");
    setStageActionCount(0);
    persist({ step: next, modelState, stageFeedback: "", stageActionCount: 0 });
  };
  const finish = async () => {
    const saved = await record({
      skillId,
      eventType: "practice_attempt",
      contentVersion: MATHS_CONTENT_VERSION,
      evidence: { schemaVersion: 1, source: "lesson_player", assignmentId: assignment?.id || null, recipeId: recipe.id, stage: "check", manipulativeId: recipe.manipulativeId, representation: recipe.manipulativeId, renderedRepresentation: { component: recipe.manipulativeId, state: modelState }, outcome: "completed_formative_check" }
    });
    setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
    try { localStorage.removeItem(storageKey); } catch { /* no-op */ }
    setFinished(true);
  };
  if (finished) return <AreaShell eyebrow="Natural stopping point" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-lesson" title="Lesson complete"><section className="maths-finish-card maths-finish-card-v2" data-child-choices data-child-progress><CheckCircle aria-hidden="true" size={58} weight="duotone" /><h2>You made and explained a model</h2><p>{assignment ? assignmentComplete ? "Your teacher’s activity is complete." : "Your work is saved. The assignment will remain visible until its cloud evidence is confirmed." : "Your practice is saved without changing a mastery score."}</p><button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={onHome} type="button">Back to Maths <House aria-hidden="true" size={20} weight="bold" /></button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  const selectStageThought = text => { setStageFeedback(text); persist({ step, modelState, stageFeedback: text, stageActionCount }); };
  const changeSkill = nextSkillId => {
    const checkpoint = readCheckpoint(nextSkillId);
    setSkillId(nextSkillId);
    setStep(checkpoint.step);
    setModelState(checkpoint.modelState);
    setStageFeedback(checkpoint.stageFeedback);
    setStageActionCount(checkpoint.stageActionCount || 0);
  };
  return <AreaShell eyebrow="Make · explain · apply" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-lesson" title="Guided lesson">
    <div className="maths-lesson-toolbar">
      <label htmlFor="maths-lesson-skill"><span>Learning goal</span><select disabled={Boolean(assignedSkill)} id="maths-lesson-skill" onChange={event => changeSkill(event.target.value)} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label>
      <div className="maths-lesson-progress-v2" data-child-progress><span>{step + 1}</span><div><small>Step {step + 1} of 7</small><strong>{stage}</strong></div><details><summary><ListNumbers aria-hidden="true" size={19} /> All steps</summary><ol>{MATHS_LESSON_STAGES.map((item, index) => <li className={index === step ? "is-current" : index < step ? "is-done" : ""} key={item}>{index + 1}. {item}</li>)}</ol></details></div>
    </div>
    <section className="maths-lesson-workbench" data-child-choices>
      <aside className="maths-lesson-coach">
        <p className="maths-stage-label">{stage}</p>
        <h2>{stage === "notice" ? "What do you notice?" : recipe.title}</h2>
        <p className="maths-instruction">{mathsLessonInstruction(recipe, stage)}</p>
        {MATHS_LESSON_STAGE_GOALS[skillId]?.[stage] && <p className="maths-stage-goal"><strong>Your challenge</strong><span>{MATHS_LESSON_STAGE_GOALS[skillId][stage]}</span></p>}
        <MathsAudioButton client={client} requestId={mathsLessonInstructionAudioId(recipe, stage)} token={token} />
        {stageChoices.length > 0 && <div className="maths-stage-choices" role="group" aria-label={`Show your ${stage} thinking`}>{stageChoices.map(text => <button aria-pressed={stageFeedback === text} key={text} onClick={() => selectStageThought(text)} type="button">{text}</button>)}</div>}
        {stageFeedback && <p className="maths-feedback" aria-live="polite">Your note is selected. Make sure the model matches the challenge.</p>}
      </aside>
      <div className="maths-lesson-model"><MathsManipulative id={recipe.manipulativeId} initialState={modelState?.id === recipe.manipulativeId ? modelState : null} key={`${skillId}:${recipe.manipulativeId}`} maximum={recipe.initialState.maximum} mode={stage === "check" ? "guided" : "explore"} onStateChange={state => { const nextCount = stageActionCount + 1; setStageActionCount(nextCount); setModelState(state); persist({ step, modelState: state, stageFeedback, stageActionCount: nextCount }); }} /></div>
    </section>
    <div className="maths-player-nav maths-player-nav-v2"><button disabled={step === 0} onClick={() => move(step - 1)} type="button"><ArrowLeft aria-hidden="true" size={20} weight="bold" /> Back</button>{step < 6 ? <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={!stageReady} onClick={() => move(step + 1)} type="button">{stageReady ? `Next: ${MATHS_LESSON_STAGES[step + 1]}` : stageChoices.length > 0 ? "Use the model and choose a note" : "Make the model match"}<ArrowRight aria-hidden="true" size={20} weight="bold" /></button> : <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={!stageReady} onClick={finish} type="button">{stageReady ? "Finish practice" : "Change the model first"}<CheckCircle aria-hidden="true" size={20} weight="bold" /></button>}</div>
    {saveState && <p className="maths-save-state" role="status">{saveState}</p>}
  </AreaShell>;
}

function QuickQuantity({ item, disabled, onAnswer }) {
  const [visible, setVisible] = useState(true);
  const [accessMode, setAccessMode] = useState("visual_flash");
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className="maths-quick-quantity">
    {accessMode === "non_visual_description"
      ? <div className="maths-nonvisual-quantity"><p>Alternative counting task. Move through the unnumbered objects one at a time, then choose the total.</p><div aria-label="Explore unnumbered objects one at a time" role="group">{Array.from({ length: item.values.target }, (_, index) => <button aria-label="Countable object" key={index} type="button">Object</button>)}</div></div>
      : <QuantityPicture accessibleLabel="A small quantity is shown briefly. Look at the pattern without using this description to answer." hidden={!visible} model={{ kind: item.representation === "five_frame" ? "frame" : "objects", arrangement: item.surface.arrangement, capacity: 5, filled: item.values.target, total: item.values.target }} objectFamily={item.surface.objectFamily} />}
    <button className="maths-access-alternative" onClick={() => { setAccessMode("non_visual_description"); setVisible(false); }} type="button">Use an untimed counting alternative</button>
    <AnswerChoices disabled={disabled} item={item} onAnswer={(response, detail) => onAnswer(response, { ...detail, accessMode, flashDurationMs: accessMode === "visual_flash" ? 1500 : null })} />
  </div>;
}

function AnswerChoices({ item, disabled, onAnswer, asFrames = false }) {
  const options = assessmentOptionsForItem(item);
  return <div className={`maths-answer-grid${asFrames ? " is-frame-choice" : ""}`} data-child-choices data-child-emphasis="primary" data-child-primary role="group" aria-label="Choose your answer"><p className="maths-answer-cue" data-child-emphasis-cue>Choose your answer</p>{options.map((option, slot) => <button data-answer-slot={slot} disabled={disabled} key={option} onClick={() => onAnswer(option, { responseMode: "single_select", optionSlot: slot, options })} type="button">{asFrames ? <QuantityPicture compact model={{ kind: "frame", capacity: 10, filled: Number(option) }} /> : option === "a" ? "Left group" : option === "b" ? "Right group" : option === "same" ? "Same amount" : option}</button>)}</div>;
}

function AssessmentInteraction({ item, disabled, onAnswer }) {
  if (item.blueprintId === "number_sequence") return <div className="maths-sequence-question"><div className={`maths-sequence-picture is-${item.representation}`} role="img" aria-label={`A number path shows ${item.values.sequence.map(value => value === null ? "a blank" : value).join(", ")}.`}>
    {item.values.sequence.map((value, index) => <span className={value === null ? "is-blank" : ""} key={`${value}:${index}`}>{value === null ? "?" : value}</span>)}
  </div><AnswerChoices disabled={disabled} item={item} onAnswer={(response, detail) => onAnswer(response, { ...detail, component: item.representation, representation: item.representation, sequence: item.values.sequence })} /></div>;
  if (item.blueprintId === "make_quantity") return <QuantityBuilder capacity={item.values.maximum} disabled={disabled} representation={item.representation === "counter_tray" ? "counter_tray" : "frame"} onSubmit={(response, detail) => onAnswer(response, { ...detail, responseMode: "construct", representation: item.representation })} prompt={`Add or remove counters until the model shows ${item.values.target}.`} />;
  if (item.blueprintId === "part_whole") return <div className="maths-part-whole-question">{item.representation === "two_colour_frame" ? <QuantityPicture model={{ kind: "frame", capacity: item.values.target, filled: item.values.partA, parts: [item.values.partA, 0] }} /> : <QuantityPicture model={{ kind: "part_whole", total: item.values.target, parts: [item.values.partA, "?"] }} />}<QuantityBuilder capacity={item.values.target} disabled={disabled} representation={item.representation === "two_colour_frame" ? "frame" : "counter_tray"} onSubmit={(response, detail) => onAnswer(response, { ...detail, responseMode: "construct", component: `${item.representation}_missing_part_builder`, representation: item.representation, knownPart: item.values.partA })} prompt="Build only the hidden part." submitLabel="Use this missing part" /></div>;
  if (item.blueprintId === "quick_quantity") return <QuickQuantity disabled={disabled} item={item} onAnswer={onAnswer} />;
  if (item.blueprintId === "compare_quantities") return <><div className={`maths-assessment-compare is-${item.representation}`}>{item.representation === "structured_frames" ? <><QuantityPicture accessibleLabel="Left frame. Count its filled spaces." model={{ kind: "frame", capacity: item.values.maximum <= 10 ? 10 : 20, filled: item.values.target }} /><QuantityPicture accessibleLabel="Right frame. Count its filled spaces." model={{ kind: "frame", capacity: item.values.maximum <= 10 ? 10 : 20, filled: item.values.other }} /></> : <><QuantityPicture accessibleLabel="Left group. Count its objects." model={{ total: item.values.target, arrangement: "row" }} objectFamily={item.surface.objectFamily} /><QuantityPicture accessibleLabel="Right group. Count its objects." model={{ total: item.values.other, arrangement: "row" }} objectFamily={item.surface.objectFamily} /></>}</div><AnswerChoices disabled={disabled} item={item} onAnswer={(response, detail) => onAnswer(response, { ...detail, component: item.representation, representation: item.representation })} /></>;
  return <>{item.representation === "structured_frame" ? <QuantityPicture accessibleLabel="A counting frame. Count its filled spaces." model={{ kind: "frame", capacity: item.values.maximum <= 10 ? 10 : 20, filled: item.values.target }} /> : <QuantityPicture accessibleLabel="A collection of objects. Count each object once." model={{ total: item.values.target, arrangement: item.surface.arrangement }} objectFamily={item.surface.objectFamily} />}<AnswerChoices disabled={disabled} item={item} onAnswer={(response, detail) => onAnswer(response, { ...detail, component: item.representation, representation: item.representation })} /></>;
}

export function MathsAssessmentPlayer({ studentName, progressScopeKey, client, studentId, token, assessmentSeed = "", assignment = null, onHome }) {
  const assignedSkill = assignment?.skillId && APPROVED_FOUNDATION_SKILL_IDS.includes(assignment.skillId) ? assignment.skillId : "";
  const [skillId, setSkillId] = useState(assignedSkill || APPROVED_FOUNDATION_SKILL_IDS[1]);
  const [sessionSeed, setSessionSeed] = useState(() => assessmentSeed || `${studentId || "student"}-${Date.now()}`);
  const items = useMemo(() => buildMathsAssessmentRound({ skillId, seed: sessionSeed, length: 6 }), [sessionSeed, skillId]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  const item = items[index];
  const answer = async (response, renderedResponse = {}) => {
    if (submitting || feedback) return;
    setSubmitting(true);
    const result = classifyMathsResponse(item, response);
    setResponses(rows => [...rows, { itemKey: item.itemKey, response, ...result }]);
    const renderedRepresentation = { ...item.renderSpec, component: renderedResponse.component || item.representation, response: renderedResponse };
    const actualRepresentation = renderedResponse.accessMode === "non_visual_description" ? "sequential_access_count" : renderedResponse.representation || item.representation;
    const saved = await record({ skillId, eventType: "skills_check_response", contentVersion: item.contentVersion, evidence: { schemaVersion: 1, source: "maths_skills_check", sessionId: sessionSeed, assignmentId: assignment?.id || null, itemKey: item.itemKey, modelIndex: item.modelIndex, blueprintId: item.blueprintId, representation: actualRepresentation, constructChanged: renderedResponse.accessMode === "non_visual_description", renderedRepresentation, promptText: item.promptText, response, correct: result.correct, classification: result.classification, observedSignals: result.observedSignals } });
    if (index === items.length - 1) setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
    setFeedback(result.classification === "not_checked" ? "Not sure was saved. That is a valid response." : "Response saved. Your teacher will look at the model, not a score.");
    setSubmitting(false);
  };
  const nextDecision = () => { setFeedback(""); setIndex(current => current + 1); };
  const restart = () => { setIndex(0); setResponses([]); setStarted(false); setSessionSeed(`${studentId || "student"}-${Date.now()}`); };
  if (index >= items.length) return <AreaShell eyebrow="Finished" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Skills check complete"><section className="maths-finish-card maths-finish-card-v2" data-child-choices data-child-progress><CheckCircle aria-hidden="true" size={58} weight="duotone" /><h2>All done</h2><p>You worked through {responses.length} maths decisions. Your teacher will use the models, not a score, to choose what comes next.</p>{assignment && <p>{assignmentComplete ? "Your teacher’s assigned check is complete." : "Your responses are saved. Completion will confirm when cloud evidence is available."}</p>}<button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={assignment ? onHome : restart} type="button">{assignment ? "Back to Maths" : "Try another set"}</button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  if (!started) return <AreaShell eyebrow="Short, calm and untimed" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Skills check"><section className="maths-check-start" data-child-choices data-child-progress>
    <div className="maths-check-start-visual" aria-hidden="true"><Eye size={74} weight="duotone" /><span>6</span></div>
    <div><p className="maths-stage-label">What will happen</p><h2>Show what you know</h2><p className="maths-check-goal">Learning goal: <strong>{mathsSkillById[skillId].childLabel}</strong></p><MathsAudioButton client={client} compact label="Hear how the check works" requestId="maths-check:intro" token={token} /><ul><li><GridNine aria-hidden="true" size={22} /> Six maths decisions</li><li><SpeakerHigh aria-hidden="true" size={22} /> Audio for every instruction</li><li><CheckCircle aria-hidden="true" size={22} /> No timer, no score and a “Not sure yet” choice</li></ul>{skillId === "F-N-SUBITISE-5" && <p className="maths-check-practice-note">A small practice picture appears briefly before each choice. An untimed counting alternative is always available.</p>}<label htmlFor="maths-check-skill"><span>Learning goal</span><select disabled={Boolean(assignedSkill)} id="maths-check-skill" onChange={event => { setSkillId(event.target.value); setIndex(0); setResponses([]); }} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></label><button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => setStarted(true)} type="button">Start the check <ArrowRight aria-hidden="true" size={20} weight="bold" /></button></div>
  </section></AreaShell>;
  return <AreaShell eyebrow={`${mathsSkillById[skillId].childLabel} · decision ${index + 1} of ${items.length}`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Skills check">
    <div className="maths-check-progress maths-check-progress-v2" data-child-progress><span style={{ width: `${((index + 1) / items.length) * 100}%` }} /><small>{index + 1} of {items.length}</small></div>
    <section className="maths-check-card maths-check-card-v2"><div className="maths-check-prompt"><p className="maths-instruction">{item.promptText}</p><MathsAudioButton client={client} compact requestId={`assessment:${item.id}:${item.surface.id}:prompt`} token={token} /></div><div className="maths-check-interaction"><AssessmentInteraction disabled={submitting || Boolean(feedback)} item={item} key={item.itemKey} onAnswer={answer} /></div>{!feedback && <button className="maths-not-sure" disabled={submitting} onClick={() => answer(null, { responseMode: "not_sure", component: item.representation, representation: item.representation })} type="button">Not sure yet</button>}<p aria-live="polite" className="maths-feedback">{submitting && !feedback ? "Saving response…" : feedback}</p>{feedback && <button className="maths-primary maths-check-next" data-child-emphasis="primary" data-child-primary onClick={nextDecision} type="button">{index === items.length - 1 ? "Finish check" : "Next decision"} <ArrowRight aria-hidden="true" size={20} /></button>}</section>
  </AreaShell>;
}

function StoryModel({ model, focus }) {
  if (!model) return null;
  const family = model.object || "bun";
  return <div className={`maths-story-model${focus ? ` is-focus-${focus}` : ""}`}><QuantityPicture model={model.kind === "groups" ? model : model} objectFamily={family} /></div>;
}

export function MathsStoryLibrary({ studentName, progressScopeKey, client, studentId, token, assignment = null, onHome }) {
  const assignedStory = assignment?.activityId ? releasedMathsStories.find(story => story.id === assignment.activityId) || null : null;
  const [selected, setSelected] = useState(assignedStory);
  const [pageIndex, setPageIndex] = useState(0);
  const [focus, setFocus] = useState("");
  const [finishedStory, setFinishedStory] = useState(null);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  if (finishedStory) return <AreaShell eyebrow="Story stopping point" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Story complete"><section className="maths-story-finish maths-finish-card-v2" data-child-choices data-child-progress><CheckCircle aria-hidden="true" size={58} weight="duotone" /><h2>You followed the maths through the whole story</h2><p>{finishedStory.mathsPromise}</p><article><strong>Try it at home</strong><p>{finishedStory.familyPrompt}</p><small>No family account, child photo or child recording is needed.</small></article>{assignment && <p>{assignmentComplete ? "Your teacher’s story assignment is complete." : "The story is finished. Cloud completion will confirm when evidence is available."}</p>}<button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={assignment ? onHome : () => { setFinishedStory(null); setSelected(null); setPageIndex(0); }} type="button">{assignment ? "Back to Maths" : "Back to story shelf"}</button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  if (!selected) return <AreaShell eyebrow="Read · notice · talk" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Number stories"><section className="maths-story-library-v2" data-child-progress><header><div><p className="maths-stage-label">{releasedMathsStories.length} stories ready now</p><h2>Follow the number through the story</h2><span>Reading is never scored as Maths. You can listen to every page.</span></div><BookOpenText aria-hidden="true" size={60} weight="duotone" /></header><div className="maths-story-grid maths-story-grid-v2" data-child-choices>{releasedMathsStories.map((item, index) => <button data-child-emphasis={index === 0 ? "primary" : "choice"} data-child-primary={index === 0 ? "" : undefined} key={item.id} onClick={() => { setSelected(item); setPageIndex(0); setFocus(""); }} type="button"><img alt="" src={item.coverImage} /><span><small>{item.skillIds.map(id => mathsSkillById[id]?.childLabel).filter(Boolean).join(" · ")}</small><strong>{item.title}</strong><em>{item.mathsPromise}</em><b data-child-emphasis-cue={index === 0 ? "" : undefined}>{index === 0 ? "Read next" : "Open story"}<ArrowRight aria-hidden="true" size={18} /></b></span></button>)}</div><section className="maths-song-shelf maths-song-shelf-v2"><h2>Move and chant</h2><div>{mathsSongs.map(song => <details key={song.id}><summary>{song.title}</summary><p>Original {song.tempo} BPM classroom chant. Guide audio uses the adult Leda voice.</p><MathsSongPlayer client={client} song={song} token={token} /><pre>{song.lyrics}</pre></details>)}</div></section></section></AreaShell>;
  const page = selected.pages[pageIndex];
  const finish = async () => {
    const saved = await record({ skillId: assignment?.skillId || selected.skillIds[0], eventType: "practice_attempt", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "maths_number_story", assignmentId: assignment?.id || null, storyId: selected.id, pagesRead: selected.pages.length, representation: page.model?.kind || "story_context", renderedRepresentation: page.model, outcome: "story_completed" } });
    setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
    setFinishedStory(selected);
  };
  return <AreaShell eyebrow={`${selected.title} · page ${pageIndex + 1} of ${selected.pages.length}`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Number story"><article className="maths-story-reader maths-story-reader-v2" data-child-choices data-child-progress><div className="maths-story-page-visual"><img alt={page.visualDescription || ""} src={page.image || selected.coverImage} /><div className={`maths-story-scene is-page-${page.pageNumber}`} data-story={selected.id}><StoryModel focus={focus} model={page.model} /></div><span>Page {pageIndex + 1} of {selected.pages.length}</span></div><div className="maths-story-page-copy"><button className="maths-story-close" onClick={() => assignedStory ? onHome?.() : setSelected(null)} type="button"><ArrowLeft aria-hidden="true" size={18} /> {assignedStory ? "Maths home" : "Story shelf"}</button><div className="maths-story-text"><p>{page.exactText}</p><MathsAudioButton client={client} requestId={`story:${selected.id}:page:${page.pageNumber}`} token={token} /></div>{page.model?.parts?.length > 1 && <div className="maths-story-notice" role="group" aria-label="Notice the maths in this page"><span>Notice the maths</span><button aria-pressed={focus === "whole"} onClick={() => setFocus("whole")} type="button">Whole: {page.model.total}</button><button aria-pressed={focus === "parts"} onClick={() => setFocus("parts")} type="button">Parts: {page.model.parts.join(" and ")}</button></div>}<aside className="maths-story-talk"><strong>Talk together</strong><span>{page.talkPrompt}</span></aside><div className="maths-player-nav maths-player-nav-v2"><button disabled={pageIndex === 0} onClick={() => { setPageIndex(pageIndex - 1); setFocus(""); }} type="button"><ArrowLeft aria-hidden="true" size={20} /> Previous</button>{pageIndex < selected.pages.length - 1 ? <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => { setPageIndex(pageIndex + 1); setFocus(""); }} type="button">Next page <ArrowRight aria-hidden="true" size={20} /></button> : <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={finish} type="button">Finish story <CheckCircle aria-hidden="true" size={20} /></button>}</div></div></article></AreaShell>;
}

export function MathsArcade({ studentName, progressScopeKey, client, studentId, token, assignment = null, onHome }) {
  const assignedGameId = assignment?.activityId && mathsGames.some(game => game.id === assignment.activityId) ? assignment.activityId : "";
  const [gameId, setGameId] = useState(assignedGameId);
  const dayKey = new Date().toISOString().slice(0, 10);
  const session = useMemo(() => gameId ? createMathsGameSession(gameId, `${studentId || "student"}-${dayKey}`, assignment?.skillId || "") : null, [assignment?.skillId, dayKey, gameId, studentId]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [roundCorrect, setRoundCorrect] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  if (!session) return <AreaShell eyebrow="Practice through play" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title="Maths Arcade"><section className="maths-arcade-library" data-child-progress><header><div><p className="maths-stage-label">Five different game worlds</p><h2>Choose how you want to think</h2><span>Every world is untimed. Maths—not speed—moves you forward.</span><MathsAudioButton client={client} compact label="Hear how Arcade works" requestId="maths-arcade:intro" token={token} /></div><Sparkle aria-hidden="true" size={58} weight="duotone" /></header><div className="maths-game-grid maths-game-grid-v2" data-child-choices>{mathsGames.map((game, gameIndex) => { const art = mathsArcadeArt(game.id); const Icon = art.icon; return <button className={art.className} data-child-emphasis={gameIndex === 0 ? "primary" : "choice"} data-child-primary={gameIndex === 0 ? "" : undefined} data-game={game.id} key={game.id} onClick={() => { setGameId(game.id); setIndex(0); }} type="button"><span className="maths-game-card-world"><Icon aria-hidden="true" size={54} weight="duotone" /><i /><i /><i /></span><span className="maths-game-card-copy"><small>{art.world}</small><strong>{game.title}</strong><em>{game.strapline}</em><b data-child-emphasis-cue={gameIndex === 0 ? "" : undefined}>{gameIndex === 0 ? "Play next" : "Open world"} <ArrowRight aria-hidden="true" size={18} /></b><small>8 decisions · no timer · no lives</small></span></button>; })}</div></section></AreaShell>;
  if (index >= session.items.length) return <AreaShell eyebrow={session.title} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title="Natural stopping place"><section className="maths-finish-card" data-child-choices data-child-progress><span aria-hidden="true">⌂</span><h2>You reached camp</h2><p>You made {session.items.length} maths decisions and repaired each model before moving on. Games are practice only.</p>{assignment && <p>{assignmentComplete ? "Your teacher’s game assignment is complete." : "Your practice is saved; cloud completion is still confirming."}</p>}<button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={assignedGameId ? onHome : () => setGameId("")} type="button">{assignedGameId ? "Back to Maths" : "Choose another game"}</button>{saveState && <p>{saveState}</p>}</section></AreaShell>;
  const round = session.items[index];
  const choose = async (value, renderedResponse = {}) => {
    const result = evaluateMathsGameRound(round, value);
    setFeedback(result.feedbackText);
    setRoundCorrect(result.correct);
    const saved = await record({ skillId: round.skillId, eventType: "practice_attempt", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "maths_arcade", assignmentId: assignment?.id || null, gameId: session.id, roundId: round.id, seed: session.seed, response: value, correct: result.correct, classification: result.classification, observedSignals: result.observedSignals, representation: round.mechanic, renderedRepresentation: { mechanic: round.mechanic, model: round.model, response: renderedResponse } } });
    if (result.correct && index === session.items.length - 1) setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
  };
  const continueRound = () => {
    if (roundCorrect) setIndex(valueIndex => valueIndex + 1);
    setRoundCorrect(false);
    setFeedback("");
  };
  const art = mathsArcadeArt(session.id);
  const controlText = session.id === "quantity-match"
    ? round.mechanic === "compare_frames" ? "Pair one from each bank, then compare what remains." : "Add or remove planks, then test your bridge."
    : art.control;
  return <AreaShell eyebrow={`${art.world} · challenge ${index + 1} of 8`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title={session.title}><section className={`maths-game-stage maths-game-stage-v2 ${art.className}`} data-child-progress><header className="maths-arcade-mission"><div><span>Mission</span><h2>{round.prompt}</h2><p>{controlText}</p><MathsAudioButton client={client} compact label="Hear this mission" requestId={`arcade:${session.id}:instruction`} token={token} /></div><div className="maths-game-route" aria-label={`Challenge ${index + 1} of ${session.items.length}`}>{session.items.map((_, position) => <span className={position < index ? "is-done" : position === index ? "is-current" : ""} key={position}>{position < index ? <Check aria-hidden="true" size={15} weight="bold" /> : position + 1}</span>)}</div></header><Suspense fallback={<div aria-live="polite" className="maths-arcade-loading">Opening the game world…</div>}><MathsArcadeGame disabled={Boolean(feedback)} gameId={session.id} key={round.id} onAnswer={choose} round={round} /></Suspense><div className="maths-arcade-feedback-row"><p aria-live="polite" className="maths-feedback maths-arcade-feedback">{feedback}</p>{feedback && <MathsAudioButton client={client} compact label={roundCorrect ? "Hear why it works" : "Hear the repair hint"} requestId={`arcade:${session.id}:${roundCorrect ? "success" : "repair"}`} token={token} />}</div>{feedback && <button className="maths-primary maths-arcade-continue" data-child-emphasis="primary" data-child-primary onClick={continueRound} type="button">{roundCorrect ? "Continue journey" : "Repair this challenge"} <ArrowRight aria-hidden="true" size={20} /></button>}</section></AreaShell>;
}
