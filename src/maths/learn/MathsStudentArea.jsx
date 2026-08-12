import { useEffect, useMemo, useState } from "react";
import StudentGlassShell from "../../components/StudentGlassShell.jsx";
import { mathsSkillById, APPROVED_FOUNDATION_SKILL_IDS } from "../curriculum/mathsSkillTree.js";
import { flushMathsEvidenceQueue, recordStudentMathsEvidence } from "../data/mathsEvidenceStore.js";
import { MathsManipulative } from "../manipulatives/MathsManipulative.jsx";
import { MathsAudioButton, MathsSongPlayer } from "../media/MathsAudioButton.jsx";
import { mathsActivityRecipesBySkill, MATHS_CONTENT_VERSION, MATHS_LESSON_STAGES } from "./mathsActivityRecipes.js";
import { assessmentOptionsForItem, buildMathsAssessmentRound, classifyMathsResponse } from "../assessment/mathsAssessmentBank.js";
import { releasedMathsStories } from "../stories/mathsStoryCatalog.js";
import { createMathsGameSession, evaluateMathsGameRound, mathsGames } from "../games/mathsGames.js";
import { mathsSongs } from "../music/mathsSongs.js";
import "../../styles/maths-platform.css";

export const MATHS_LESSON_STORAGE_PREFIX = "lp-maths-lesson:v1:";
const OBJECT_NOUNS = Object.freeze({ meadow_stones: ["meadow stone", "meadow stones"], buttons: ["button", "buttons"], leaves: ["leaf", "leaves"], shells: ["shell", "shells"], stone: ["stone", "stones"], bun: ["bun", "buns"], berry: ["berry", "berries"], duckling: ["duckling", "ducklings"] });
const STAGE_CHOICES = Object.freeze({
  retrieve: ["I touched each one once", "I used a known number"],
  notice: ["I noticed a whole", "I noticed smaller parts"],
  model: ["I watched what changed", "I watched what stayed the same"],
  explain: ["I can point to the whole", "I can point to the parts"]
});

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
        setSaveState(`${result.flushed} saved Maths ${result.flushed === 1 ? "result" : "results"} synced.`);
        return client.call("student_report_maths_evidence_sync_health", { p_token: token, p_delivered: result.flushed, p_pending: result.remaining, p_rejected: result.rejected });
      })
      .catch(() => {});
    void flush();
    window.addEventListener("online", flush);
    return () => { current = false; window.removeEventListener("online", flush); };
  }, [client, studentId, token]);
  const record = async input => {
    if (!client || !studentId || !token) {
      setSaveState("Practice finished on this device. Cloud saving is unavailable.");
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
    <main className="maths-student-area" data-child-surface={surfaceId}>
      <header className="maths-area-heading"><p data-child-instruction>{eyebrow}</p><h1 data-child-title>{title}</h1></header>
      {children}
    </main>
  </StudentGlassShell>;
}

export function QuantityPicture({ model, objectFamily = "stone", compact = false, hidden = false }) {
  if (!model) return null;
  if (hidden) return <div aria-label="The quantity is hidden. Choose what you saw." className="maths-quantity-mask" role="img"><span aria-hidden="true">?</span><small>Picture hidden</small></div>;
  if (model.kind === "groups") {
    const total = model.parts.reduce((sum, value) => sum + Number(value || 0), Number(model.pool || 0));
    return <div className="maths-picture-groups" role="img" aria-label={`${model.parts.join(" and ")} ${quantityNoun(objectFamily, total)} in two groups${model.pool ? `, with ${model.pool} waiting` : ""}`}>
      <div>{Array.from({ length: model.parts[0] }, (_, index) => <span key={index} />)}</div>
      {Number.isFinite(model.pool) && <div className="maths-picture-pool" aria-label={`${model.pool} waiting`}>{Array.from({ length: model.pool }, (_, index) => <span key={index} />)}</div>}
      <div>{Array.from({ length: model.parts[1] }, (_, index) => <span key={index} />)}</div>
    </div>;
  }
  const capacity = model.capacity || Math.max(5, model.target || model.total || 5);
  const filled = model.filled ?? model.shown ?? model.visible ?? model.total ?? 0;
  if (["frame", "missing"].includes(model.kind)) {
    return <div className={`maths-picture-frame cells-${capacity}${compact ? " is-compact" : ""}`} role="img" aria-label={`${filled} filled spaces out of ${capacity}`}>
      {Array.from({ length: capacity }, (_, index) => <span className={index < filled ? "is-filled" : ""} key={index} />)}
    </div>;
  }
  if (["part_whole", "equation"].includes(model.kind)) {
    return <div className="maths-picture-part-whole" role="img" aria-label={`${model.parts.join(" and ")} make ${model.total}`}>
      <strong>{model.total}</strong><div>{model.parts.map((part, index) => <span key={index}>{part}</span>)}</div>
      {model.kind === "equation" && <small>{model.parts.join(" + ")} = {model.total}</small>}
    </div>;
  }
  const count = model.visible ?? model.total ?? model.target ?? 0;
  return <div className={`maths-picture-objects${compact ? " is-compact" : ""}`} role="img" aria-label={`${count} ${quantityNoun(objectFamily, count)}`}>
    {Array.from({ length: count }, (_, index) => <span data-object={model.object || objectFamily} key={index} />)}
  </div>;
}

function QuantityBuilder({ capacity, initial = 0, prompt, onSubmit, disabled = false }) {
  const [count, setCount] = useState(initial);
  const [actions, setActions] = useState([]);
  const change = next => {
    const value = Math.max(0, Math.min(capacity, next));
    setCount(value);
    setActions(rows => [...rows, value > count ? "add" : "remove"]);
  };
  return <div className="maths-quantity-builder">
    <p>{prompt}</p>
    <QuantityPicture model={{ kind: "frame", capacity, filled: count }} />
    <div className="maths-builder-controls" role="group" aria-label="Build the quantity">
      <button disabled={disabled || count === 0} onClick={() => change(count - 1)} type="button">Take one away</button>
      <output aria-live="polite">{count}</output>
      <button disabled={disabled || count === capacity} onClick={() => change(count + 1)} type="button">Add one</button>
    </div>
    <button className="maths-submit-model" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled} onClick={() => onSubmit(count, { count, actions, capacity })} type="button">Check my model</button>
  </div>;
}

export function MathsLessonPlayer({ studentName, progressScopeKey, client, studentId, token, assignment = null, onHome }) {
  const assignedSkill = assignment?.skillId && APPROVED_FOUNDATION_SKILL_IDS.includes(assignment.skillId) ? assignment.skillId : "";
  const [skillId, setSkillId] = useState(assignedSkill || APPROVED_FOUNDATION_SKILL_IDS[0]);
  const storageKey = `${MATHS_LESSON_STORAGE_PREFIX}${studentId || progressScopeKey}:${skillId}`;
  const initialStep = (() => { try { return Math.max(0, Math.min(6, Number(localStorage.getItem(storageKey)) || 0)); } catch { return 0; } })();
  const [step, setStep] = useState(initialStep);
  const [modelState, setModelState] = useState(null);
  const [stageReady, setStageReady] = useState(false);
  const [stageFeedback, setStageFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  const recipes = mathsActivityRecipesBySkill[skillId];
  const stage = MATHS_LESSON_STAGES[step];
  const recipe = recipes[Math.min(recipes.length - 1, stage === "retrieve" ? 0 : ["model", "notice"].includes(stage) ? 1 : ["make", "explain"].includes(stage) ? 2 : stage === "apply" ? 3 : 4)];
  const move = next => {
    setStep(next);
    setStageReady(false);
    setStageFeedback("");
    try { localStorage.setItem(storageKey, String(next)); } catch { /* resilient private mode */ }
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
  if (finished) return <AreaShell eyebrow="Natural stopping point" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-lesson" title="Lesson complete"><section className="maths-finish-card" data-child-choices data-child-progress><span aria-hidden="true">✓</span><h2>You made and explained a model</h2><p>{assignment ? assignmentComplete ? "Your teacher’s activity is complete." : "Your work is saved. The assignment will remain visible until its cloud evidence is confirmed." : "Your practice is saved without changing a mastery score."}</p><button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={onHome} type="button">Back to Maths</button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  const selectStageThought = text => { setStageReady(true); setStageFeedback(text); };
  return <AreaShell eyebrow="Make · explain · apply" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-lesson" title="Maths lesson">
    <div className="maths-skill-picker"><label htmlFor="maths-lesson-skill">Learning goal</label><select disabled={Boolean(assignedSkill)} id="maths-lesson-skill" onChange={event => { setSkillId(event.target.value); setStep(0); setStageReady(false); }} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select>{assignedSkill && <small>Chosen by your teacher</small>}</div>
    <div className="maths-lesson-progress-compact" data-child-progress><strong>Step {step + 1} of 7</strong><span>{stage}</span><details><summary>See all lesson steps</summary><ol>{MATHS_LESSON_STAGES.map((item, index) => <li className={index === step ? "is-current" : index < step ? "is-done" : ""} key={item}>{index + 1}. {item}</li>)}</ol></details></div>
    <section className="maths-lesson-card" data-child-choices>
      <div><p className="maths-stage-label">{stage}</p><h2>{stage === "notice" ? "What do you notice?" : recipe.title}</h2><p className="maths-instruction">{stage === "notice" ? "Look at the model. Choose one thing you notice before changing it." : stage === "explain" ? "Point to the model, then choose what your explanation included. Nothing is recorded." : stage === "check" ? "Change the model to show your idea independently, then finish the practice." : recipe.instructionText}</p><MathsAudioButton client={client} requestId={recipe.instructionAudioId} token={token} /></div>
      <MathsManipulative id={recipe.manipulativeId} key={`${skillId}:${recipe.manipulativeId}`} maximum={recipe.initialState.maximum} mode={stage === "check" ? "guided" : "explore"} onStateChange={state => { setModelState(state); if (!["retrieve", "notice", "model", "explain"].includes(stage)) setStageReady(true); }} />
      {STAGE_CHOICES[stage] && <div className="maths-stage-choices" role="group" aria-label={`Show your ${stage} thinking`}>{STAGE_CHOICES[stage].map(text => <button aria-pressed={stageFeedback === text} key={text} onClick={() => selectStageThought(text)} type="button">{text}</button>)}</div>}
      {stageFeedback && <p className="maths-feedback" aria-live="polite">Good noticing: {stageFeedback.toLowerCase()}.</p>}
    </section>
    <div className="maths-player-nav"><button disabled={step === 0} onClick={() => move(step - 1)} type="button">Back</button>{step < 6 ? <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={!stageReady} onClick={() => move(step + 1)} type="button">{stageReady ? `Next: ${MATHS_LESSON_STAGES[step + 1]}` : "Complete this step"}</button> : <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={!stageReady} onClick={finish} type="button">{stageReady ? "Finish practice" : "Change the model first"}</button>}</div>
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
      ? <div className="maths-nonvisual-quantity" role="note">Accessible quantity description: {item.values.target} dots.</div>
      : <QuantityPicture hidden={!visible} model={{ kind: item.representation === "five_frame" ? "frame" : "objects", capacity: 5, filled: item.values.target, total: item.values.target }} />}
    <button className="maths-access-alternative" onClick={() => { setAccessMode("non_visual_description"); setVisible(false); }} type="button">Use a non-visual description</button>
    <AnswerChoices disabled={disabled} item={item} onAnswer={(response, detail) => onAnswer(response, { ...detail, accessMode, flashDurationMs: accessMode === "visual_flash" ? 1500 : null })} />
  </div>;
}

function AnswerChoices({ item, disabled, onAnswer, asFrames = false }) {
  const options = assessmentOptionsForItem(item);
  return <div className={`maths-answer-grid${asFrames ? " is-frame-choice" : ""}`} data-child-choices data-child-emphasis="primary" data-child-primary role="group" aria-label="Choose your answer"><p className="maths-answer-cue" data-child-emphasis-cue>Choose your answer</p>{options.map((option, slot) => <button data-answer-slot={slot} disabled={disabled} key={option} onClick={() => onAnswer(option, { responseMode: "single_select", optionSlot: slot, options })} type="button">{asFrames ? <QuantityPicture compact model={{ kind: "frame", capacity: 10, filled: Number(option) }} /> : option === "a" ? "Left group" : option === "b" ? "Right group" : option === "same" ? "Same amount" : option}</button>)}</div>;
}

function AssessmentInteraction({ item, disabled, onAnswer }) {
  if (item.blueprintId === "make_quantity") return <QuantityBuilder capacity={item.values.maximum} disabled={disabled} onSubmit={(response, detail) => onAnswer(response, { ...detail, responseMode: "construct", component: "tap_counter_frame" })} prompt={`Add or remove counters until the frame shows ${item.values.target}.`} />;
  if (item.blueprintId === "part_whole") return <div className="maths-part-whole-question"><QuantityPicture model={{ kind: "part_whole", total: item.values.target, parts: [item.values.partA, "?"] }} /><QuantityBuilder capacity={item.values.target} disabled={disabled} onSubmit={(response, detail) => onAnswer(response, { ...detail, responseMode: "construct", component: "missing_part_builder", knownPart: item.values.partA })} prompt="Build only the hidden part." /></div>;
  if (item.blueprintId === "quick_quantity") return <QuickQuantity disabled={disabled} item={item} onAnswer={onAnswer} />;
  if (item.blueprintId === "compare_quantities") return <><div className="maths-assessment-compare"><QuantityPicture model={{ total: item.values.target }} objectFamily={item.surface.objectFamily} /><QuantityPicture model={{ total: item.values.other }} objectFamily={item.surface.objectFamily} /></div><AnswerChoices disabled={disabled} item={item} onAnswer={onAnswer} /></>;
  return <><QuantityPicture model={{ total: item.values.target }} objectFamily={item.surface.objectFamily} /><AnswerChoices disabled={disabled} item={item} onAnswer={onAnswer} /></>;
}

export function MathsAssessmentPlayer({ studentName, progressScopeKey, client, studentId, token, assessmentSeed = "", assignment = null, onHome }) {
  const assignedSkill = assignment?.skillId && APPROVED_FOUNDATION_SKILL_IDS.includes(assignment.skillId) ? assignment.skillId : "";
  const [skillId, setSkillId] = useState(assignedSkill || APPROVED_FOUNDATION_SKILL_IDS[1]);
  const [sessionSeed, setSessionSeed] = useState(() => assessmentSeed || `${studentId || "student"}-${Date.now()}`);
  const items = useMemo(() => buildMathsAssessmentRound({ skillId, seed: sessionSeed, length: 6 }), [sessionSeed, skillId]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  const item = items[index];
  const answer = async (response, renderedResponse = {}) => {
    const result = classifyMathsResponse(item, response);
    setResponses(rows => [...rows, { itemKey: item.itemKey, response, ...result }]);
    const renderedRepresentation = { ...item.renderSpec, component: renderedResponse.component || item.representation, response: renderedResponse };
    const saved = await record({ skillId, eventType: "skills_check_response", contentVersion: item.contentVersion, evidence: { schemaVersion: 1, source: "maths_skills_check", assignmentId: assignment?.id || null, itemKey: item.itemKey, modelIndex: item.modelIndex, blueprintId: item.blueprintId, representation: renderedResponse.accessMode === "non_visual_description" ? "auditory_count_description" : item.representation, renderedRepresentation, promptText: item.promptText, response, correct: result.correct, classification: result.classification, observedSignals: result.observedSignals } });
    if (index === items.length - 1) setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
    setFeedback(result.correct ? "That model matches." : "Thank you. Your teacher will look at the response pattern.");
    window.setTimeout(() => { setFeedback(""); setIndex(current => current + 1); }, 650);
  };
  const restart = () => { setIndex(0); setResponses([]); setSessionSeed(`${studentId || "student"}-${Date.now()}`); };
  if (index >= items.length) return <AreaShell eyebrow="Finished" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Skills check complete"><section className="maths-finish-card" data-child-choices data-child-progress><span aria-hidden="true">✓</span><h2>All done</h2><p>You worked through {responses.length} maths decisions. Your teacher will use the models—not a score—to choose what comes next.</p>{assignment && <p>{assignmentComplete ? "Your teacher’s assigned check is complete." : "Your responses are saved; completion will confirm when cloud evidence is available."}</p>}<button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={assignment ? onHome : restart} type="button">{assignment ? "Back to Maths" : "Try another set"}</button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  return <AreaShell eyebrow="Short, calm, formative" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Maths skills check">
    <div className="maths-skill-picker"><label htmlFor="maths-check-skill">Learning goal</label><select disabled={Boolean(assignedSkill)} id="maths-check-skill" onChange={event => { setSkillId(event.target.value); setIndex(0); setResponses([]); }} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select>{assignedSkill && <small>Chosen by your teacher</small>}</div>
    <div className="maths-check-progress" data-child-progress><span style={{ width: `${(index / items.length) * 100}%` }} /><small>{index + 1} of {items.length}</small></div>
    <section className="maths-check-card"><div className="maths-check-prompt"><p className="maths-instruction">{item.promptText}</p><MathsAudioButton client={client} compact requestId={`assessment:${item.id}:prompt`} token={token} /></div><AssessmentInteraction disabled={Boolean(feedback)} item={item} key={item.itemKey} onAnswer={answer} /><p aria-live="polite" className="maths-feedback">{feedback}</p></section>
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
  if (finishedStory) return <AreaShell eyebrow="Story stopping point" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Story complete"><section className="maths-story-finish" data-child-choices data-child-progress><h2>You followed the maths through the whole story</h2><p>{finishedStory.mathsPromise}</p><article><strong>Try it at home</strong><p>{finishedStory.familyPrompt}</p><small>No family account, child photo or child recording is needed.</small></article>{assignment && <p>{assignmentComplete ? "Your teacher’s story assignment is complete." : "The story is finished; cloud completion will confirm when evidence is available."}</p>}<button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => { setFinishedStory(null); setSelected(null); setPageIndex(0); }} type="button">Back to story shelf</button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  if (!selected) return <AreaShell eyebrow="Read, notice, talk" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Number stories"><p className="maths-library-progress" data-child-progress>{releasedMathsStories.length} released stories</p><div className="maths-story-grid" data-child-choices>{releasedMathsStories.map((item, index) => <button data-child-emphasis={index === 0 ? "primary" : "choice"} data-child-primary={index === 0 ? "" : undefined} key={item.id} onClick={() => { setSelected(item); setPageIndex(0); setFocus(""); }} type="button"><img alt="" src={item.coverImage} /><span><small>Foundation number story</small><strong>{item.title}</strong><em data-child-emphasis-cue={index === 0 ? "" : undefined}>{index === 0 ? "Start next" : item.mathsPromise}</em>{index === 0 && <small>{item.mathsPromise}</small>}</span></button>)}</div><section className="maths-song-shelf"><h2>Move and chant</h2><div>{mathsSongs.map(song => <details key={song.id}><summary>{song.title}</summary><p>Original {song.tempo} BPM classroom chant · guide audio uses the adult Leda voice.</p><MathsSongPlayer client={client} song={song} token={token} /><pre>{song.lyrics}</pre></details>)}</div></section></AreaShell>;
  const page = selected.pages[pageIndex];
  const finish = async () => {
    const saved = await record({ skillId: assignment?.skillId || selected.skillIds[0], eventType: "practice_attempt", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "maths_number_story", assignmentId: assignment?.id || null, storyId: selected.id, pagesRead: selected.pages.length, representation: page.model?.kind || "story_context", renderedRepresentation: page.model, outcome: "story_completed" } });
    setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
    setFinishedStory(selected);
  };
  return <AreaShell eyebrow={`${selected.title} · page ${pageIndex + 1} of ${selected.pages.length}`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Number story"><article className="maths-story-reader" data-child-choices data-child-progress><button className="maths-story-close" onClick={() => assignedStory ? onHome?.() : setSelected(null)} type="button">{assignedStory ? "Back to Maths" : "Back to stories"}</button><div className="maths-story-scene"><div className="maths-story-background" style={{ backgroundImage: `url(${selected.coverImage})` }} /><StoryModel focus={focus} model={page.model} /></div><div className="maths-story-text"><p>{page.exactText}</p><MathsAudioButton client={client} requestId={`story:${selected.id}:page:${page.pageNumber}`} token={token} /></div>{page.model?.parts?.length > 1 && <div className="maths-story-notice" role="group" aria-label="Notice the maths in this page"><span>Tap what you want to notice:</span><button aria-pressed={focus === "whole"} onClick={() => setFocus("whole")} type="button">The whole: {page.model.total}</button><button aria-pressed={focus === "parts"} onClick={() => setFocus("parts")} type="button">The parts: {page.model.parts.join(" and ")}</button></div>}<aside className="maths-story-talk"><strong>Talk together</strong><span>{selected.teacherPrompts[pageIndex % selected.teacherPrompts.length]}</span></aside><div className="maths-player-nav"><button disabled={pageIndex === 0} onClick={() => { setPageIndex(pageIndex - 1); setFocus(""); }} type="button">Previous page</button>{pageIndex < selected.pages.length - 1 ? <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => { setPageIndex(pageIndex + 1); setFocus(""); }} type="button">Next page</button> : <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={finish} type="button">Finish story</button>}</div></article></AreaShell>;
}

function ArcadeMechanic({ round, gameId, disabled, onAnswer }) {
  const [carried, setCarried] = useState([]);
  if (gameId === "frame-foundry") return <QuantityBuilder capacity={10} disabled={disabled} initial={0} onSubmit={(response, detail) => onAnswer(response, { ...detail, component: "frame_forge" })} prompt={`Add the ${round.target} counters that are missing.`} />;
  if (gameId === "count-and-carry") return <div className="maths-carry-game"><div className="maths-parcel-field" role="group" aria-label={`${round.model.total} parcels to carry`}>{Array.from({ length: round.model.total }, (_, index) => <button aria-pressed={carried.includes(index)} disabled={disabled || carried.includes(index)} key={index} onClick={() => setCarried(items => [...items, index])} type="button">{carried.includes(index) ? "✓" : "●"}</button>)}</div><div className="maths-cart" aria-live="polite">Cart: {carried.length} parcels</div><button className="maths-submit-model" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary disabled={disabled || carried.length !== round.model.total} onClick={() => onAnswer(carried.length, { component: "one_to_one_carry", movedItemIndexes: carried })} type="button">Count the cart</button></div>;
  if (gameId === "quantity-match" && round.mechanic === "compare_frames") return <div className="maths-compare-game" data-child-choices data-child-primary role="group" aria-label="Compare the two frames"><div><QuantityPicture compact model={{ kind: "frame", capacity: 10, filled: round.model.left }} /><QuantityPicture compact model={{ kind: "frame", capacity: 10, filled: round.model.right }} /></div>{round.options.map((option, slot) => <button data-answer-slot={slot} disabled={disabled} key={option} onClick={() => onAnswer(option, { component: "compare_frames", optionSlot: slot, left: round.model.left, right: round.model.right })} type="button">{option === "a" ? "Left frame" : option === "b" ? "Right frame" : "Same amount"}</button>)}</div>;
  if (gameId === "quantity-match") return <div className="maths-frame-match" data-child-choices data-child-primary role="group" aria-label="Choose the matching frame">{round.options.map((option, slot) => <button data-answer-slot={slot} disabled={disabled} key={option} onClick={() => onAnswer(option, { component: "frame_match", optionSlot: slot, shownCounts: round.options })} type="button"><QuantityPicture compact model={{ kind: "frame", capacity: 10, filled: option }} /></button>)}</div>;
  return <div className="maths-number-trail-game" data-child-choices data-child-primary role="group" aria-label="Choose the next stepping stone"><div className="maths-trail-start">Start at <strong>{round.model.start}</strong></div><div>{round.options.map((option, slot) => <button data-answer-slot={slot} disabled={disabled} key={option} onClick={() => onAnswer(option, { component: "number_trail", optionSlot: slot, pathOptions: round.options })} type="button">{option}</button>)}</div></div>;
}

export function MathsArcade({ studentName, progressScopeKey, client, studentId, token, assignment = null, onHome }) {
  const assignedGameId = assignment?.activityId && mathsGames.some(game => game.id === assignment.activityId) ? assignment.activityId : "";
  const [gameId, setGameId] = useState(assignedGameId);
  const session = useMemo(() => gameId ? createMathsGameSession(gameId, `${studentId || "student"}-daily`, assignment?.skillId || "") : null, [assignment?.skillId, gameId, studentId]);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  if (!session) return <AreaShell eyebrow="Practice through play" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title="Maths Arcade"><p className="maths-library-progress" data-child-progress>{mathsGames.length} untimed games</p><div className="maths-game-grid" data-child-choices>{mathsGames.map((game, gameIndex) => <button data-child-emphasis={gameIndex === 0 ? "primary" : "choice"} data-child-primary={gameIndex === 0 ? "" : undefined} data-game={game.id} key={game.id} onClick={() => { setGameId(game.id); setIndex(0); }} type="button"><span>{["↟", "▦", "●", "＝"][gameIndex]}</span><strong>{game.title}</strong><small>{game.strapline}</small><em data-child-emphasis-cue={gameIndex === 0 ? "" : undefined}>{gameIndex === 0 ? "Play next" : "8 maths decisions · no timer"}</em>{gameIndex === 0 && <small>8 maths decisions · no timer</small>}</button>)}</div></AreaShell>;
  if (index >= session.items.length) return <AreaShell eyebrow={session.title} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title="Natural stopping place"><section className="maths-finish-card" data-child-choices data-child-progress><span aria-hidden="true">⌂</span><h2>You reached camp</h2><p>You made {session.items.length} maths decisions and repaired each model before moving on. Games are practice only.</p>{assignment && <p>{assignmentComplete ? "Your teacher’s game assignment is complete." : "Your practice is saved; cloud completion is still confirming."}</p>}<button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={assignedGameId ? onHome : () => setGameId("")} type="button">{assignedGameId ? "Back to Maths" : "Choose another game"}</button>{saveState && <p>{saveState}</p>}</section></AreaShell>;
  const round = session.items[index];
  const choose = async (value, renderedResponse = {}) => {
    const result = evaluateMathsGameRound(round, value);
    setFeedback(result.feedbackText);
    const saved = await record({ skillId: round.skillId, eventType: "practice_attempt", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "maths_arcade", assignmentId: assignment?.id || null, gameId: session.id, roundId: round.id, seed: session.seed, response: value, correct: result.correct, classification: result.classification, observedSignals: result.observedSignals, representation: round.mechanic, renderedRepresentation: { mechanic: round.mechanic, model: round.model, response: renderedResponse } } });
    if (result.correct && index === session.items.length - 1) setAssignmentComplete(await completeAssignedActivity({ assignment, client, token, saved }).catch(() => false));
    window.setTimeout(() => { if (result.correct) setIndex(valueIndex => valueIndex + 1); setFeedback(""); }, result.correct ? 550 : 900);
  };
  return <AreaShell eyebrow={`${session.title} · ${index + 1} of 8`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title={session.strapline}><section className={`maths-game-stage is-${session.id}`} data-child-progress><div className="maths-game-route">{session.items.map((_, position) => <span className={position < index ? "is-done" : position === index ? "is-current" : ""} key={position}>{position + 1}</span>)}</div><h2>{round.prompt}</h2>{session.id === "frame-foundry" && <QuantityPicture model={{ kind: "frame", capacity: 10, filled: round.model.shown }} />}<ArcadeMechanic disabled={Boolean(feedback)} gameId={session.id} key={round.id} onAnswer={choose} round={round} /><p aria-live="polite" className="maths-feedback">{feedback}</p></section></AreaShell>;
}
