import { useMemo, useRef, useState } from "react";
import { LESSON_ADAPTATIONS } from "../../../content/lessons/lessonAdaptations.js";
import { buildLessonComponentRegistry, lessonTargetsForCycle } from "../../../content/lessons/lessonComponentRegistry.js";
import { buildSmallGroupLesson } from "../../../utils/lessons/buildSmallGroupLesson.js";
import { createLessonRecipe, LESSON_DURATIONS } from "../../../utils/lessons/validateLessonRecipe.js";
import { createTeacherLessonPlan, recordTeacherLessonDelivery } from "../../../data/lessonPlans.js";
import { TeacherPageHeader } from "../ui/TeacherPrimitives.jsx";
import "./teacherLessonComposer.css";

export function TeacherLessonComposerPage({ client, classId, cycleId, students = [], onClose }) {
  const activeStudents = students.filter(student => !student.archived_at && !student.archivedAt);
  const targets = lessonTargetsForCycle(cycleId);
  const [targetKey, setTargetKey] = useState(targets[0]?.key || "");
  const [duration, setDuration] = useState(12);
  const [learnerIds, setLearnerIds] = useState(() => activeStudents.map(student => student.id));
  const [adaptations, setAdaptations] = useState([]);
  const [deliveryStep, setDeliveryStep] = useState(null);
  const [saveState, setSaveState] = useState({ status: "idle", message: "" });
  const [savedPlanId, setSavedPlanId] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const planVersionRef = useRef(0);

  function markPlanChanged() {
    planVersionRef.current += 1;
    setSavedPlanId("");
    setSaveState(current => current.status === "saved" ? { status: "idle", message: "Lesson choices changed. Save this version before recording delivery." } : current);
  }

  const lesson = useMemo(() => {
    if (!targetKey || !learnerIds.length) return null;
    const registry = buildLessonComponentRegistry({ cycleId, targetKey, durationMinutes: duration });
    const recipe = createLessonRecipe({
      recipeId: `${cycleId}:${targetKey}:${duration}:${learnerIds.slice().sort().join("-")}`,
      durationMinutes: duration,
      cycleId,
      targetKey,
      prerequisiteKeys: [],
      learnerIds,
      componentIds: Object.values(registry.components).map(({ id, role }) => ({ id, role })),
      contentVersion: registry.contentVersion,
      adaptations
    });
    return buildSmallGroupLesson({ recipe, componentRegistry: registry.components });
  }, [adaptations, cycleId, duration, learnerIds, targetKey]);

  function toggleLearner(id) {
    markPlanChanged();
    setLearnerIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  }

  function toggleAdaptation(id) {
    markPlanChanged();
    setAdaptations(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  }

  async function savePlan() {
    if (!client || !lesson) return;
    const requestVersion = planVersionRef.current;
    setSaveState({ status: "saving", message: "Saving lesson plan…" });
    try {
      const registry = buildLessonComponentRegistry({ cycleId, targetKey, durationMinutes: duration });
      const recipe = createLessonRecipe({
        recipeId: lesson.recipeId,
        durationMinutes: duration,
        cycleId,
        targetKey,
        learnerIds,
        componentIds: Object.values(registry.components).map(({ id, role }) => ({ id, role })),
        contentVersion: registry.contentVersion,
        adaptations
      });
      const saved = await createTeacherLessonPlan(client, {
        classId,
        learnerIds,
        recipe,
        evidenceSource: { kind: "teacher_selected", limitations: "No automatic diagnosis or mastery update." }
      });
      if (requestVersion !== planVersionRef.current) return;
      setSavedPlanId(saved.plan_id);
      setSaveState({ status: "saved", message: "Lesson plan saved. The recipe and learner group are frozen for delivery." });
    } catch {
      if (requestVersion !== planVersionRef.current) return;
      setSaveState({ status: "error", message: "The lesson plan could not be saved. Your choices are still here; try again." });
    }
  }

  async function recordDelivery(completionState) {
    if (!savedPlanId) {
      setSaveState({ status: "error", message: "Save the lesson plan before recording delivery." });
      return;
    }
    setSaveState({ status: "saving", message: "Recording delivery…" });
    try {
      await recordTeacherLessonDelivery(client, {
        planId: savedPlanId,
        learnerIds,
        completionState,
        notes: deliveryNote,
        observedSupport: { source: "teacher_observation", masteryUpdated: false }
      });
      setSaveState({ status: "saved", message: completionState === "not_delivered" ? "Lesson marked not delivered. No learner outcome was inferred." : "Delivery recorded as practice evidence. Mastery was not changed." });
      setDeliveryStep(null);
    } catch {
      setSaveState({ status: "error", message: "The lesson delivery could not be recorded. Your note is still here; try again." });
    }
  }

  if (!targets.length) {
    return (
      <section className="lesson-composer lesson-composer-empty">
        <TeacherPageHeader eyebrow="Small-group lesson" title="Choose a teaching cycle" description="Assessment and review blocks do not introduce a new phonics target. Set a numbered teaching cycle in the class context bar." />
        <button className="lp-button" type="button" onClick={onClose}>Back to resources</button>
      </section>
    );
  }

  return (
    <section className="lesson-composer" aria-labelledby="lesson-composer-title">
      <TeacherPageHeader
        eyebrow="Small-group lesson composer"
        title="Plan a teachable lesson"
        description="Built from the selected curriculum cycle. You choose the group, target, time and supports before using it."
      >
        <button className="lp-button" type="button" onClick={onClose}>Back to resources</button>
      </TeacherPageHeader>

      <div className="lesson-composer-evidence" role="note">
        <strong>Evidence source:</strong> teacher-selected class context and target. This plan does not diagnose learners or update mastery. If evidence is limited, run the exit observation and record <em>not checked</em> rather than incorrect.
      </div>

      <div className="lesson-composer-layout">
        <aside className="lesson-composer-controls" aria-label="Lesson choices">
          <label>Instructional target
            <select value={targetKey} onChange={event => { markPlanChanged(); setTargetKey(event.target.value); }}>
              {targets.map(target => <option value={target.key} key={target.key}>{target.label}</option>)}
            </select>
          </label>

          <fieldset>
            <legend>Lesson length</legend>
            <div className="lesson-composer-segmented">
              {LESSON_DURATIONS.map(minutes => (
                <button className={duration === minutes ? "is-selected" : ""} type="button" aria-pressed={duration === minutes} onClick={() => { markPlanChanged(); setDuration(minutes); }} key={minutes}>{minutes} min</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Learners ({learnerIds.length} selected)</legend>
            <div className="lesson-composer-checks">
              {activeStudents.map(student => (
                <label key={student.id}><input type="checkbox" checked={learnerIds.includes(student.id)} onChange={() => toggleLearner(student.id)} /> {student.name}</label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Access supports</legend>
            <div className="lesson-composer-checks">
              {Object.values(LESSON_ADAPTATIONS).map(item => (
                <label key={item.id}><input type="checkbox" checked={adaptations.includes(item.id)} onChange={() => toggleAdaptation(item.id)} /> {item.label}</label>
              ))}
            </div>
          </fieldset>
        </aside>

        <div className="lesson-composer-preview" aria-live="polite">
          {!learnerIds.length ? (
            <div className="lesson-composer-warning"><h3>Choose at least one learner</h3><p>The lesson preview will appear when the group is selected.</p></div>
          ) : lesson ? (
            <>
              <div className="lesson-composer-summary">
                <div><span>Target</span><strong>{targets.find(target => target.key === targetKey)?.label}</strong></div>
                <div><span>Time</span><strong>{duration} minutes</strong></div>
                <div><span>Group</span><strong>{learnerIds.length} learners</strong></div>
                <div><span>Evidence</span><strong>Practice observation</strong></div>
              </div>

              <ol className="lesson-sequence">
                {lesson.steps.map(step => (
                  <li key={step.id} className={deliveryStep === step.stepNumber ? "is-delivering" : ""}>
                    <div className="lesson-step-number">{step.stepNumber}</div>
                    <div>
                      <p className="lesson-step-role">{step.role}</p>
                      <h3>{step.title}</h3>
                      <p><strong>Say and do:</strong> {step.teacherText}</p>
                      <p><strong>Learners:</strong> {step.learnerTask}</p>
                      {step.examples.length > 0 && <p className="lesson-step-examples">Reviewed examples: {step.examples.join(" · ")}</p>}
                      {step.application?.bookTitle && <p className="lesson-step-examples">Approved text: {step.application.bookTitle} · Level {step.application.bookLevel}</p>}
                      <p className="lesson-step-materials">Materials: {step.materials.join(", ")}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {adaptations.length > 0 && (
                <section className="lesson-composer-supports"><h3>Selected access supports</h3>{adaptations.map(id => <p key={id}><strong>{LESSON_ADAPTATIONS[id]?.label}:</strong> {LESSON_ADAPTATIONS[id]?.guidance}</p>)}</section>
              )}

              <div className="lesson-composer-actions">
                <button className="lp-button lp-button-primary" type="button" disabled={!client || saveState.status === "saving"} onClick={savePlan}>{saveState.status === "saving" ? "Saving…" : "Save lesson plan"}</button>
                <button className="lp-button lp-button-primary" type="button" onClick={() => setDeliveryStep(current => current ? null : 1)}>{deliveryStep ? "Leave delivery mode" : "Start compact delivery"}</button>
                <button className="lp-button" type="button" onClick={() => window.print()}>Print teacher pack</button>
              </div>
              {saveState.message && <p className={`lesson-composer-save lesson-composer-save-${saveState.status}`} role="status">{saveState.message}</p>}

              {deliveryStep && (
                <>
                  <div className="lesson-delivery-bar" role="region" aria-label="Lesson delivery controls">
                    <button type="button" disabled={deliveryStep === 1} onClick={() => setDeliveryStep(step => Math.max(1, step - 1))}>Previous</button>
                    <strong>Step {deliveryStep} of {lesson.steps.length}</strong>
                    <button type="button" disabled={deliveryStep === lesson.steps.length} onClick={() => setDeliveryStep(step => Math.min(lesson.steps.length, step + 1))}>Next</button>
                  </div>
                  {deliveryStep === lesson.steps.length && (
                    <section className="lesson-delivery-finish" aria-label="Record lesson delivery">
                      <label>Optional observation note<textarea value={deliveryNote} maxLength={2000} onChange={event => setDeliveryNote(event.target.value)} placeholder="Record observable support or a follow-up need. Do not enter a diagnosis." /></label>
                      <div><button type="button" onClick={() => recordDelivery("delivered")}>Record delivered</button><button type="button" onClick={() => recordDelivery("partially_delivered")}>Partly delivered</button><button type="button" onClick={() => recordDelivery("not_delivered")}>Not delivered</button></div>
                    </section>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
