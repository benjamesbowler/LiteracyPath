import { useMemo, useState } from "react";
import StudentGlassShell from "../../components/StudentGlassShell.jsx";
import { mathsSkillById, APPROVED_FOUNDATION_SKILL_IDS } from "../curriculum/mathsSkillTree.js";
import { recordStudentMathsEvidence } from "../data/mathsEvidenceStore.js";
import { MathsManipulative } from "../manipulatives/MathsManipulative.jsx";
import { mathsActivityRecipesBySkill, MATHS_CONTENT_VERSION, MATHS_LESSON_STAGES } from "./mathsActivityRecipes.js";
import { buildMathsAssessmentRound, classifyMathsResponse } from "../assessment/mathsAssessmentBank.js";
import { releasedMathsStories } from "../stories/mathsStoryCatalog.js";
import { createMathsGameSession, evaluateMathsGameRound, mathsGames } from "../games/mathsGames.js";
import { mathsSongs } from "../music/mathsSongs.js";
import "../../styles/maths-platform.css";

const LESSON_STORAGE_PREFIX = "lp-maths-lesson:v1:";
const OBJECT_NOUNS = Object.freeze({
  meadow_stones: ["meadow stone", "meadow stones"],
  buttons: ["button", "buttons"],
  leaves: ["leaf", "leaves"],
  shells: ["shell", "shells"],
  stone: ["stone", "stones"],
  bun: ["bun", "buns"],
  berry: ["berry", "berries"],
  duckling: ["duckling", "ducklings"]
});

function quantityNoun(family, count) {
  const pair = OBJECT_NOUNS[family] || [String(family).replaceAll("_", " "), `${String(family).replaceAll("_", " ")}s`];
  return pair[count === 1 ? 0 : 1];
}

function useMathsEvidence({ client, studentId, token }) {
  const [saveState, setSaveState] = useState("");
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

function AreaShell({ studentName, progressScopeKey, surfaceId, title, eyebrow, onHome, children }) {
  return <StudentGlassShell studentName={studentName} scopeKey={progressScopeKey} active="maths" tabs={[]} showWallet={false} showGrownUps={false} onHome={onHome}>
    <main className="maths-student-area" data-child-surface={surfaceId}>
      <header className="maths-area-heading"><p data-child-instruction>{eyebrow}</p><h1 data-child-title>{title}</h1></header>
      {children}
    </main>
  </StudentGlassShell>;
}

function QuantityPicture({ model, objectFamily = "stone" }) {
  if (!model) return null;
  if (model.kind === "groups") {
    const total = model.parts.reduce((sum, value) => sum + value, Number(model.pool || 0));
    return <div className="maths-picture-groups" role="img" aria-label={`${model.parts.join(" and ")} ${quantityNoun(objectFamily, total)} in two groups${model.pool ? `, with ${model.pool} waiting` : ""}`}>
      <div>{Array.from({ length: model.parts[0] }, (_, index) => <span key={index} />)}</div>
      {Number.isFinite(model.pool) && <div className="maths-picture-pool" aria-label={`${model.pool} waiting`}>{Array.from({ length: model.pool }, (_, index) => <span key={index} />)}</div>}
      <div>{Array.from({ length: model.parts[1] }, (_, index) => <span key={index} />)}</div>
    </div>;
  }
  const capacity = model.capacity || Math.max(5, model.target || model.total || 5);
  const filled = model.filled ?? model.shown ?? model.visible ?? model.total ?? 0;
  if (["frame", "missing"].includes(model.kind)) {
    return <div className={`maths-picture-frame cells-${capacity}`} role="img" aria-label={`${filled} filled spaces out of ${capacity}`}>
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
  return <div className="maths-picture-objects" role="img" aria-label={`${count} ${quantityNoun(objectFamily, count)}`}>
    {Array.from({ length: count }, (_, index) => <span data-object={model.object || objectFamily} key={index} />)}
  </div>;
}

export function MathsLessonPlayer({ studentName, progressScopeKey, client, studentId, token, onHome }) {
  const [skillId, setSkillId] = useState(APPROVED_FOUNDATION_SKILL_IDS[0]);
  const storageKey = `${LESSON_STORAGE_PREFIX}${studentId || progressScopeKey}:${skillId}`;
  const initialStep = (() => { try { return Math.max(0, Math.min(6, Number(localStorage.getItem(storageKey)) || 0)); } catch { return 0; } })();
  const [step, setStep] = useState(initialStep);
  const [modelState, setModelState] = useState(null);
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  const recipes = mathsActivityRecipesBySkill[skillId];
  const stage = MATHS_LESSON_STAGES[step];
  const recipe = recipes[Math.min(recipes.length - 1, stage === "retrieve" ? 0 : stage === "model" || stage === "notice" ? 1 : stage === "make" ? 2 : stage === "explain" ? 2 : stage === "apply" ? 3 : 4)];
  const move = next => {
    setStep(next);
    try { localStorage.setItem(storageKey, String(next)); } catch { /* resilient private mode */ }
  };
  const finish = async () => {
    await record({ skillId, eventType: "practice_attempt", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "lesson_player", recipeId: recipe.id, stage: "check", manipulativeId: recipe.manipulativeId, state: modelState, outcome: "completed_formative_check" } });
    try { localStorage.removeItem(storageKey); } catch { /* no-op */ }
    move(0);
  };
  return <AreaShell eyebrow="Make · explain · apply" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-lesson" title="Maths lesson">
    <div className="maths-skill-picker"><label htmlFor="maths-lesson-skill">Choose a learning goal</label><select id="maths-lesson-skill" onChange={event => { setSkillId(event.target.value); setStep(0); }} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></div>
    <ol className="maths-lesson-progress" data-child-progress aria-label={`Lesson step ${step + 1} of 7`} tabIndex={0}>{MATHS_LESSON_STAGES.map((item, index) => <li className={index === step ? "is-current" : index < step ? "is-done" : ""} key={item}><span>{index + 1}</span>{item}</li>)}</ol>
    <section className="maths-lesson-card" data-child-choices>
      <div><p className="maths-stage-label">{stage}</p><h2>{stage === "notice" ? "What do you notice?" : recipe.title}</h2><p className="maths-instruction">{stage === "notice" ? "Look at the model. What can you see without changing it yet?" : stage === "explain" ? "Tell how your model shows the number. You can point as you explain; nothing is recorded." : stage === "check" ? "Check your model one last time. This is practice, not a test." : recipe.instructionText}</p></div>
      <MathsManipulative id={recipe.manipulativeId} key={`${skillId}:${recipe.manipulativeId}`} maximum={recipe.initialState.maximum} mode={stage === "check" ? "guided" : "explore"} onStateChange={setModelState} />
    </section>
    <div className="maths-player-nav"><button disabled={step === 0} onClick={() => move(step - 1)} type="button">Back</button>{step < 6 ? <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => move(step + 1)} type="button">Next: {MATHS_LESSON_STAGES[step + 1]}</button> : <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={finish} type="button">Finish practice</button>}</div>
    {saveState && <p className="maths-save-state" role="status">{saveState}</p>}
  </AreaShell>;
}

function AssessmentVisual({ item }) {
  const { blueprintId, values } = item;
  if (blueprintId === "compare_quantities") return <div className="maths-assessment-compare"><QuantityPicture model={{ total: values.target }} /><QuantityPicture model={{ total: values.other }} /></div>;
  if (blueprintId === "part_whole") return <QuantityPicture model={{ kind: "part_whole", total: values.target, parts: [values.partA, "?"] }} />;
  if (blueprintId === "quick_quantity") return <QuantityPicture model={{ kind: values.target <= 5 ? "frame" : "objects", capacity: 5, filled: values.target, total: values.target }} />;
  if (blueprintId === "count_collection") return <QuantityPicture model={{ total: values.target }} objectFamily={item.surface.objectFamily} />;
  return <div className="maths-target-number" aria-label={`Target number ${values.target}`}>{values.target}</div>;
}

export function MathsAssessmentPlayer({ studentName, progressScopeKey, client, studentId, token, assessmentSeed = "", onHome }) {
  const [skillId, setSkillId] = useState(APPROVED_FOUNDATION_SKILL_IDS[1]);
  const [sessionSeed, setSessionSeed] = useState(() => assessmentSeed || `${studentId || "student"}-${Date.now()}`);
  const items = useMemo(() => buildMathsAssessmentRound({ skillId, seed: sessionSeed, length: 6 }), [sessionSeed, skillId]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  const item = items[index];
  const options = item?.blueprintId === "compare_quantities" ? ["a", "same", "b"] : Array.from(new Set([item?.expected, Math.max(0, Number(item?.expected) - 1), Math.min(item?.values.maximum || 20, Number(item?.expected) + 1)])).filter(value => !Number.isNaN(value));
  const answer = async response => {
    const result = classifyMathsResponse(item, response);
    setResponses(rows => [...rows, { itemKey: item.itemKey, response, ...result }]);
    await record({ skillId, eventType: "skills_check_response", contentVersion: item.contentVersion, evidence: { schemaVersion: 1, source: "maths_skills_check", itemKey: item.itemKey, blueprintId: item.blueprintId, representation: item.representationFamilies[index % item.representationFamilies.length], promptText: item.promptText, expected: item.expected, response, correct: result.correct, classification: result.classification, misconceptionCodes: result.misconceptionCodes } });
    setFeedback(result.correct ? "That model matches." : "Thank you. Let’s look at another one.");
    window.setTimeout(() => { setFeedback(""); setIndex(current => current + 1); }, 450);
  };
  const restart = () => { setIndex(0); setResponses([]); setSessionSeed(`${studentId || "student"}-${Date.now()}`); };
  if (index >= items.length) return <AreaShell eyebrow="Finished" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Skills check complete"><section className="maths-finish-card" data-child-choices data-child-progress><span aria-hidden="true">✓</span><h2>All done</h2><p>You worked through {responses.length} maths decisions. Your teacher will use the models—not a score—to choose what comes next.</p><button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={restart} type="button">Try another set</button>{saveState && <p role="status">{saveState}</p>}</section></AreaShell>;
  return <AreaShell eyebrow="Short, calm, formative" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-check" title="Maths skills check">
    <div className="maths-skill-picker"><label htmlFor="maths-check-skill">Learning goal</label><select id="maths-check-skill" onChange={event => { setSkillId(event.target.value); setIndex(0); setResponses([]); }} value={skillId}>{APPROVED_FOUNDATION_SKILL_IDS.map(id => <option key={id} value={id}>{mathsSkillById[id].childLabel}</option>)}</select></div>
    <div className="maths-check-progress" data-child-progress><span style={{ width: `${(index / items.length) * 100}%` }} /><small>{index + 1} of {items.length}</small></div>
    <section className="maths-check-card"><p className="maths-instruction">{item.promptText}</p><AssessmentVisual item={item} /><div className="maths-answer-grid" data-child-choices data-child-emphasis="primary" data-child-primary><p className="maths-answer-cue" data-child-emphasis-cue>Choose your answer</p>{options.map(option => <button disabled={Boolean(feedback)} key={option} onClick={() => answer(option)} type="button">{option === "a" ? "Left group" : option === "b" ? "Right group" : option === "same" ? "Same amount" : option}</button>)}</div><p aria-live="polite" className="maths-feedback">{feedback}</p></section>
  </AreaShell>;
}

function StoryModel({ model }) {
  if (!model) return null;
  if (model.kind === "groups") return <QuantityPicture model={model} objectFamily={model.object || "berry"} />;
  return <QuantityPicture model={model} objectFamily={model.object || "bun"} />;
}

export function MathsStoryLibrary({ studentName, progressScopeKey, onHome }) {
  const [selected, setSelected] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  if (!selected) return <AreaShell eyebrow="Read, notice, talk" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Number stories"><p className="maths-library-progress" data-child-progress>{releasedMathsStories.length} released stories</p><div className="maths-story-grid" data-child-choices>{releasedMathsStories.map((item, index) => <button data-child-emphasis={index === 0 ? "primary" : "choice"} data-child-primary={index === 0 ? "" : undefined} key={item.id} onClick={() => { setSelected(item); setPageIndex(0); }} type="button"><img alt="" src={item.coverImage} /><span><small>Foundation number story</small><strong>{item.title}</strong><em data-child-emphasis-cue={index === 0 ? "" : undefined}>{index === 0 ? "Start next" : item.mathsPromise}</em>{index === 0 && <small>{item.mathsPromise}</small>}</span></button>)}</div><section className="maths-song-shelf"><h2>Move and chant</h2><div>{mathsSongs.map(song => <details key={song.id}><summary>{song.title}</summary><p>Original {song.tempo} BPM classroom chant · guide audio is not a child recording.</p><pre>{song.lyrics}</pre></details>)}</div></section></AreaShell>;
  const page = selected.pages[pageIndex];
  return <AreaShell eyebrow={`${selected.title} · page ${pageIndex + 1} of ${selected.pages.length}`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-stories" title="Number story"><article className="maths-story-reader" data-child-choices data-child-progress><button className="maths-story-close" onClick={() => setSelected(null)} type="button">Back to stories</button><div className="maths-story-scene"><div className="maths-story-background" style={{ backgroundImage: `url(${selected.coverImage})` }} /><StoryModel model={page.model} /></div><p>{page.exactText}</p><div className="maths-player-nav"><button disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)} type="button">Previous page</button>{pageIndex < selected.pages.length - 1 ? <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => setPageIndex(pageIndex + 1)} type="button">Next page</button> : <button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => setSelected(null)} type="button">Finish story</button>}</div></article></AreaShell>;
}

export function MathsArcade({ studentName, progressScopeKey, client, studentId, token, onHome }) {
  const [gameId, setGameId] = useState("");
  const session = useMemo(() => gameId ? createMathsGameSession(gameId, `${studentId || "student"}-daily`) : null, [gameId, studentId]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { record, saveState } = useMathsEvidence({ client, studentId, token });
  if (!session) return <AreaShell eyebrow="Practice through play" onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title="Maths Arcade"><p className="maths-library-progress" data-child-progress>{mathsGames.length} untimed games</p><div className="maths-game-grid" data-child-choices>{mathsGames.map((game, gameIndex) => <button data-child-emphasis={gameIndex === 0 ? "primary" : "choice"} data-child-primary={gameIndex === 0 ? "" : undefined} data-game={game.id} key={game.id} onClick={() => { setGameId(game.id); setIndex(0); setCorrect(0); }} type="button"><span>{["↟", "▦", "●", "＝"][gameIndex]}</span><strong>{game.title}</strong><small>{game.strapline}</small><em data-child-emphasis-cue={gameIndex === 0 ? "" : undefined}>{gameIndex === 0 ? "Play next" : "8 maths decisions · no timer"}</em>{gameIndex === 0 && <small>8 maths decisions · no timer</small>}</button>)}</div></AreaShell>;
  if (index >= session.items.length) return <AreaShell eyebrow={session.title} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title="Natural stopping place"><section className="maths-finish-card" data-child-choices data-child-progress><span aria-hidden="true">⌂</span><h2>You reached camp</h2><p>You made {session.items.length} maths decisions and matched {correct}. Games are practice only; they never mark a skill Secure.</p><button className="maths-primary" data-child-emphasis="primary" data-child-emphasis-cue data-child-primary onClick={() => setGameId("")} type="button">Choose another game</button>{saveState && <p>{saveState}</p>}</section></AreaShell>;
  const round = session.items[index];
  const choose = async value => {
    const result = evaluateMathsGameRound(round, value);
    setCorrect(count => count + (result.correct ? 1 : 0));
    setFeedback(result.feedbackText);
    await record({ skillId: session.skillIds[0], eventType: "practice_attempt", contentVersion: MATHS_CONTENT_VERSION, evidence: { schemaVersion: 1, source: "maths_arcade", gameId: session.id, roundId: round.id, seed: session.seed, response: value, expected: round.target, correct: result.correct, misconceptionCodes: result.misconceptionCodes } });
    window.setTimeout(() => { setIndex(valueIndex => valueIndex + 1); setFeedback(""); }, 550);
  };
  return <AreaShell eyebrow={`${session.title} · ${index + 1} of 8`} onHome={onHome} progressScopeKey={progressScopeKey} studentName={studentName} surfaceId="maths-arcade" title={session.strapline}><section className={`maths-game-stage is-${session.id}`} data-child-progress><div className="maths-game-route">{session.items.map((_, position) => <span className={position < index ? "is-done" : position === index ? "is-current" : ""} key={position}>{position + 1}</span>)}</div><h2>{round.prompt}</h2>{session.id === "frame-foundry" && <QuantityPicture model={{ kind: "frame", capacity: 10, filled: round.model.shown }} />}{session.id === "count-and-carry" && <QuantityPicture model={{ total: round.model.total }} />}{session.id === "quantity-match" && <div className="maths-target-number">{round.model.target}</div>}{session.id === "number-trail" && <div className="maths-trail-start">Start at <strong>{round.model.start}</strong></div>}<div className="maths-answer-grid" data-child-choices data-child-emphasis="primary" data-child-primary><p className="maths-answer-cue" data-child-emphasis-cue>Choose your answer</p>{round.options.map(option => <button disabled={Boolean(feedback)} key={option} onClick={() => choose(option)} type="button">{option}</button>)}</div><p aria-live="polite" className="maths-feedback">{feedback}</p></section></AreaShell>;
}
