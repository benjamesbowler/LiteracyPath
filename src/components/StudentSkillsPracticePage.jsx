import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { skillTree } from "../skillTree.js";
import { getAssessmentSkillGroup, loadAssessmentSkillBank } from "../data/loadAssessmentSkillBank.js";
import { AssessmentPage } from "./AppPages.jsx";
import { comparableSentenceAnswer, getQuestionAnswer, isFixSentenceQuestion, isPairSelectionQuestion, normalizeAssessmentQuestion, normalizeMultiSelectAnswer, normalizePairSelectionAnswer } from "../appState/assessmentRuntime.js";
import { getAssessmentStimulusAudioText } from "../utils/assessmentAudioPolicy.js";
import { resolveAssessmentLedaAudioPath } from "../utils/assessmentLedaResolver.js";
import { playAssessmentCue } from "../utils/audio/assessmentPlayback.js";
import { stopCueAudio } from "../utils/audio/cuePlayer.js";
import { speakWithBrowser } from "../utils/audio/speakWithBrowser.js";
import { getActiveProgressSyncSession, logStudentActivity } from "../utils/progressSync.js";
import { buildSkillsPracticeReport, createSkillsPracticeEvent, selectSkillsPracticeQuestions, shufflePracticeChoices } from "../utils/skillsPracticeModel.js";
import { loadSkillsPracticeProgress, loadSkillsPracticeSession, saveSkillsPracticeEvent, saveSkillsPracticeSession } from "../utils/skillsPracticeProgress.js";
import "../styles/skills-practice.css";

const GROUPS = [
  { id: "early_phonics", title: "Listen to sounds", image: "/images/home-sage/sound-seekers.webp" },
  { id: "hfw", title: "Read common words", image: "/images/home-sage/reading-library.webp" },
  { id: "replacement_phonics", title: "Word sounds", image: "/images/home-sage/phonics.webp" },
  { id: "grammar_language", title: "Words and sentences", image: "/images/home-sage/story-quests.webp" },
  { id: "comprehension", title: "Read and think", image: "/images/home-sage/adventure-map.webp" }
];
const ANSWER_BUTTONS = ".assessment-answer-card, .initial-sound-image-button, .visual-assessment-card-button, .ixl-answer-button, .sound-order-tile, .sound-order-selected-tile, .sentence-tile";

function prepare(item, sessionId) {
  const question = normalizeAssessmentQuestion(item, item.skillId);
  const choices = isPairSelectionQuestion(question) ? question.choices : shufflePracticeChoices(question.choices, `${sessionId}:${item.id}:choices`);
  return { ...question, answer: getQuestionAnswer(question), choices,
    answerOptions: shufflePracticeChoices(question.answerOptions, `${sessionId}:${item.id}:options`),
    imageCards: shufflePracticeChoices(question.imageCards, `${sessionId}:${item.id}:cards`),
    soundTiles: shufflePracticeChoices(question.soundTiles, `${sessionId}:${item.id}:sounds`),
    letterTiles: shufflePracticeChoices(question.letterTiles, `${sessionId}:${item.id}:letters`) };
}

function grade(question, choice) {
  const key = getQuestionAnswer(question);
  if (isFixSentenceQuestion(question)) return comparableSentenceAnswer(choice) === comparableSentenceAnswer(key);
  if (isPairSelectionQuestion(question)) return normalizePairSelectionAnswer(choice) === normalizePairSelectionAnswer(key);
  if (question.correctAnswers?.length > 1) return normalizeMultiSelectAnswer(choice) === normalizeMultiSelectAnswer(key);
  return choice === key;
}

function explanation(question) {
  return [question.explanation, question.rationale].find(value => typeof value === "string" && value.trim()) || `The answer is “${getQuestionAnswer(question)}”. ${question.passage || question.story ? "Use the details in the story." : "Look and listen carefully, then try the next question."}`;
}

export function StudentSkillsPracticePage({ progressScopeKey, onExit, studentName = "Reader" }) {
  const [session, setSession] = useState(null);
  const [plan, setPlan] = useState([]);
  const [status, setStatus] = useState("map");
  const [group, setGroup] = useState(() => getAssessmentSkillGroup(loadSkillsPracticeSession(progressScopeKey)?.skillId || skillTree[0].id));
  const [chosenSkill, setChosenSkill] = useState(() => loadSkillsPracticeSession(progressScopeKey)?.skillId || skillTree[0].id);
  const [harder, setHarder] = useState(() => loadSkillsPracticeSession(progressScopeKey)?.level === 2);
  const [feedback, setFeedback] = useState(null);
  const [message, setMessage] = useState("");
  const [skillPreview, setSkillPreview] = useState("");
  const [readyQuestion, setReadyQuestion] = useState("");
  const [record, setRecord] = useState(() => loadSkillsPracticeProgress(progressScopeKey));
  const [resume, setResume] = useState(() => loadSkillsPracticeSession(progressScopeKey));
  const stateRef = useRef(null);
  const progressOwner = useRef(getActiveProgressSyncSession());
  const owner = useRef({ active: true, request: 0, readyAt: null, answer: null, supportUsed: false, audioPending: false, autoPlayed: false, sequencePending: false, primaryDelivered: false, mediaRecovering: false, imageReady: false, instructionDelivery: "not_started", targetDelivery: "not_started", instructionDelivered: false, targetDelivered: false, repeat: 0, hiddenAt: null, inactiveMs: 0 });
  useLayoutEffect(() => { stateRef.current = { session, plan, status, feedback, playAudio, questionReady, recordUnanswered }; });
  const currentQuestion = session ? plan[session.index] || null : null;
  const currentStage = skillTree.find(skill => skill.id === (session?.skillId || chosenSkill)) || skillTree[0];
  const report = buildSkillsPracticeReport({ practiceRecord: record });
  const allGroups = GROUPS.filter(item => skillTree.some(skill => getAssessmentSkillGroup(skill.id) === item.id));
  const groupSkills = skillTree.filter(skill => getAssessmentSkillGroup(skill.id) === group);

  useEffect(() => {
    owner.current.active = true;
    const visibility = () => {
      if (document.hidden) { owner.current.hiddenAt = performance.now(); stopCueAudio(); }
      else if (owner.current.hiddenAt !== null) {
        owner.current.inactiveMs += performance.now() - owner.current.hiddenAt; owner.current.hiddenAt = null;
        const current = stateRef.current;
        if (current.status === "play" && !owner.current.answer && owner.current.readyAt === null) current.questionReady(current.plan[current.session?.index]?.id);
      }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stateRef.current.recordUnanswered();
      owner.current.active = false; owner.current.request++; stopCueAudio(); document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const hydrate = event => {
      if (event.detail?.studentId !== progressScopeKey) return;
      setRecord(loadSkillsPracticeProgress(progressScopeKey));
      setResume(loadSkillsPracticeSession(progressScopeKey));
    };
    window.addEventListener("lp-progress-hydrated", hydrate);
    return () => window.removeEventListener("lp-progress-hydrated", hydrate);
  }, [progressScopeKey]);

  const observe = useCallback((itemId, event, payload) => {
    if (getActiveProgressSyncSession()?.studentId === progressScopeKey) logStudentActivity("skills_practice", itemId, event, payload);
  }, [progressScopeKey]);

  const recordOffer = useCallback(question => {
    if (owner.current.offeredId === question.id) return;
    owner.current.offeredId = question.id;
    observe(question.id, "items_offered", { collectionVersion: 2, itemIds: [question.id], mode: "practice", skillId: question.skillId, level: question.level, phase: question.phase });
  }, [observe]);

  const questionReady = useCallback(questionId => {
    const question = stateRef.current.plan[stateRef.current.session?.index];
    if (question?.id === questionId && !owner.current.mediaRecovering) { owner.current.imageReady = true; recordOffer(question); }
    if (question?.id !== questionId || owner.current.answer || owner.current.audioPending || owner.current.sequencePending || owner.current.mediaRecovering || document.hidden) return;
    if (!owner.current.autoPlayed) {
      owner.current.autoPlayed = true; owner.current.sequencePending = true;
      const request = owner.current.request;
      void (async () => {
        const instruction = question.spokenPrompt || question.prompt || question.question;
        const instructed = await stateRef.current.playAudio(instruction, question.instructionAudioPath || question.promptAudioPath, { audioRole: "instruction", requiredSequence: true });
        const target = getAssessmentStimulusAudioText(question);
        const targetDelivery = instructed?.ok && target ? await stateRef.current.playAudio(target, question.audioPath || question.audioUrl, { audioRole: "target_word", requiredSequence: true }) : null;
        if (owner.current.active && request === owner.current.request && stateRef.current.plan[stateRef.current.session?.index]?.id === questionId) {
          owner.current.sequencePending = false;
          owner.current.primaryDelivered = Boolean(instructed?.ok && (!target || targetDelivery?.ok));
          owner.current.autoPlayed = owner.current.primaryDelivered;
          if (owner.current.primaryDelivered && owner.current.readyAt === null && !owner.current.answer) { owner.current.readyAt = performance.now(); owner.current.inactiveMs = 0; setReadyQuestion(questionId); }
        }
      })();
      return;
    }
    if (owner.current.primaryDelivered && owner.current.readyAt === null) { owner.current.readyAt = performance.now(); owner.current.inactiveMs = 0; setReadyQuestion(questionId); }
  }, [recordOffer]);

  async function startPractice(saved = null) {
    stopCueAudio();
    const request = ++owner.current.request;
    setStatus("loading"); setMessage(""); setReadyQuestion("");
    const skillId = saved?.skillId || chosenSkill;
    const nextSession = saved || { id: crypto.randomUUID(), skillId, level: harder ? 2 : 1, index: 0, answers: [], questionIds: [], startedAt: new Date().toISOString() };
    try {
      const bank = await loadAssessmentSkillBank(skillId);
      if (!owner.current.active || request !== owner.current.request) return;
      const priorIds = record.completions.flatMap(event => event.steps.map(step => step.questionId));
      const selected = saved?.questionIds?.length
        ? saved.questionIds.map(id => bank.find(item => item.id === id)).filter(Boolean)
        : selectSkillsPracticeQuestions(bank, { level: nextSession.level, seed: nextSession.id, previousIds: priorIds });
      if (!selected.length || (saved && selected.length !== saved.questionIds.length)) throw new Error("This trail needs new questions. Choose a skill to start a new trail.");
      nextSession.questionIds = selected.map(item => item.id);
      // A committed first answer is never asked or counted again after reload.
      nextSession.index = Math.max(nextSession.index, nextSession.answers.length);
      saveSkillsPracticeSession(progressScopeKey, nextSession);
      owner.current = { ...owner.current, readyAt: null, answer: null, supportUsed: Boolean(nextSession.supportQuestionIds?.includes(selected[nextSession.index]?.id)), audioPending: false, autoPlayed: false, sequencePending: false, primaryDelivered: false, mediaRecovering: false, imageReady: false, instructionDelivery: "not_started", targetDelivery: "not_started", instructionDelivered: false, targetDelivered: false, offeredId: null, repeat: 0, inactiveMs: 0 };
      setSession(nextSession); setPlan(selected.map(item => prepare(item, nextSession.id))); setResume(nextSession);
      if (nextSession.index >= selected.length) { saveSkillsPracticeSession(progressScopeKey, null); setResume(null); setStatus("complete"); }
      else setStatus("play");
    } catch (error) { setMessage(error.message || "We could not open this trail. Try again."); setStatus("error"); }
  }

  function logAnswer(event) {
    const step = event.steps[0];
    observe(step.questionId, "answer", {
      collectionVersion: 2, questionId: step.questionId, skillId: step.skillId, phase: step.phase, level: step.level,
      mode: "practice", sessionId: event.sessionId, responseId: event.id, firstResponseCorrect: step.firstResponseCorrect, answerMatch: step.answerMatch,
      responseTimeMs: step.responseTimeMs, attemptCount: step.responseStatus === "answered" ? 1 : 0,
      repeatPressCount: 0, ignoredPressCount: 0, supportUsed: step.supportUsed, evidenceType: step.evidenceType,
      validity: step.validity, responseStatus: step.responseStatus, audioRequired: step.audioRequired, audioDelivery: step.audioDelivery,
      mediaReady: step.mediaReady, mediaFailure: step.responseStatus === "media_failed",
      instructionDelivery: step.instructionDelivery, targetDelivery: step.targetDelivery, responseTimeBoundary: step.responseTimeBoundary,
      selected: step.selected, expected: step.expected
    });
  }

  function saveAnswer(event, nextSession) {
    try {
      const nextRecord = saveSkillsPracticeEvent(progressScopeKey, event, nextSession);
      setRecord(nextRecord); setSession(nextSession); setResume(nextSession); setMessage("");
      logAnswer(event);
      setFeedback({ isCorrect: event.steps[0].answerMatch, explanation: event.steps[0].responseStatus === "answered" ? explanation(currentQuestion) : "You can try this skill again whenever you like." });
      return true;
    } catch (error) {
      if (error.savedProgress) {
        setRecord(error.savedProgress.games["skills-trail"].practiceRecord); setSession(nextSession); setResume(nextSession);
        setFeedback({ isCorrect: event.steps[0].answerMatch, explanation: explanation(currentQuestion) });
        logAnswer(event); return true;
      }
      setMessage("Your answer is still here. Try saving it again."); setStatus("save-error"); return false;
    }
  }

  function answer(choice, responseStatus = "answered") {
    if (!currentQuestion || owner.current.answer) return false;
    if (responseStatus === "answered" && (!owner.current.imageReady || owner.current.mediaRecovering)) return false;
    const event = createSkillsPracticeEvent({ question: currentQuestion, sessionId: session.id,
      responseId: `${session.id}:${currentQuestion.id}`, selected: choice, isCorrect: responseStatus === "answered" ? grade(currentQuestion, choice) : null,
      responseStatus, supportUsed: owner.current.supportUsed, mediaReady: owner.current.imageReady,
      audioRequired: !currentQuestion.suppressStimulusAudio && Boolean(getAssessmentStimulusAudioText(currentQuestion)) && /audio/.test(currentQuestion.evidenceModality || currentQuestion.mediaTier || ""),
      targetDelivered: owner.current.targetDelivered,
      instructionDelivery: owner.current.instructionDelivery, targetDelivery: owner.current.targetDelivery,
      responseTimeMs: owner.current.readyAt === null ? null : performance.now() - owner.current.readyAt - owner.current.inactiveMs });
    const nextSession = { ...session, answers: [...session.answers, event.steps[0].answerMatch] };
    owner.current.answer = { event, nextSession };
    return saveAnswer(event, nextSession);
  }

  async function playAudio(text, path = "", options = {}) {
    // Replay may replace narration immediately. This invalidates the old
    // automatic sequence, without blocking response controls or inventing delivery.
    if (owner.current.sequencePending && !options.requiredSequence) {
      owner.current.request++; owner.current.sequencePending = false; owner.current.autoPlayed = false; stopCueAudio();
    }
    const questionId = currentQuestion?.id;
    const request = owner.current.request;
    const approved = resolveAssessmentLedaAudioPath(text, options.audioRole) || path;
    if (!approved && options.allowBrowserFallback) return { ok: speakWithBrowser(text, { rate: 0.85 }), fallback: true };
    owner.current.audioPending = true;
    let terminal;
    const completion = new Promise(resolve => { terminal = resolve; });
    const delivery = await playAssessmentCue(approved, { onDelivery: event => {
      options.onDelivery?.(event);
      if (request === owner.current.request) {
        const role = options.audioRole === "target_word" ? "targetDelivery" : options.audioRole === "instruction" ? "instructionDelivery" : null;
        if (role) owner.current[role] = event.type;
        if (event.type === "completed" && role) owner.current[role === "targetDelivery" ? "targetDelivered" : "instructionDelivered"] = true;
      }
      observe(questionId, "media_delivery", { collectionVersion: 2, questionId,
        skillId: currentQuestion?.skillId, sessionId: session?.id, audioRole: options.audioRole || "replay", deliveryState: event.type });
      if (["completed", "interrupted", "failed", "unavailable"].includes(event.type)) terminal(event.type);
    }, onUnavailable: () => terminal("failed") });
    const outcome = await completion;
    if (!owner.current.active || request !== owner.current.request || stateRef.current.plan[stateRef.current.session?.index]?.id !== questionId) return { ok: false };
    owner.current.audioPending = false;
    if (outcome === "completed" && !options.requiredSequence && !owner.current.answer && owner.current.imageReady
      && owner.current.instructionDelivered && (!getAssessmentStimulusAudioText(currentQuestion) || owner.current.targetDelivered)
      && owner.current.readyAt === null) {
      owner.current.primaryDelivered = true; owner.current.autoPlayed = true;
      owner.current.readyAt = performance.now(); owner.current.inactiveMs = 0; setReadyQuestion(questionId);
    }
    if (outcome === "failed") replaceMediaFailure();
    return { ...delivery, ok: outcome === "completed" };
  }

  async function replaceMediaFailure() {
    if (!currentQuestion || owner.current.answer || owner.current.mediaRecovering) return;
    owner.current.mediaRecovering = true;
    const failed = currentQuestion;
    const request = ++owner.current.request;
    stopCueAudio(); setReadyQuestion("");
    const event = createSkillsPracticeEvent({ question: failed, sessionId: session.id, responseId: `${session.id}:${failed.id}`, responseStatus: "media_failed" });
    try {
      setRecord(saveSkillsPracticeEvent(progressScopeKey, event)); logAnswer(event);
      const bank = await loadAssessmentSkillBank(session.skillId);
      if (!owner.current.active || request !== owner.current.request) return;
      const replacement = selectSkillsPracticeQuestions(bank, { level: session.level, seed: `${session.id}:${failed.id}`, failedIds: [...session.questionIds, ...record.completions.flatMap(item => item.steps.filter(step => step.responseStatus === "media_failed").map(step => step.questionId))], count: 1 })[0];
      if (!replacement) throw new Error("The pictures or sound could not load. Try another skill.");
      const nextPlan = [...plan]; nextPlan[session.index] = prepare(replacement, session.id);
      const nextSession = { ...session, questionIds: nextPlan.map(item => item.id) };
      saveSkillsPracticeSession(progressScopeKey, nextSession);
      owner.current.readyAt = null; owner.current.audioPending = false; owner.current.autoPlayed = false; owner.current.sequencePending = false; owner.current.primaryDelivered = false; owner.current.mediaRecovering = false; owner.current.imageReady = false; owner.current.instructionDelivery = "not_started"; owner.current.targetDelivery = "not_started"; owner.current.instructionDelivered = false; owner.current.targetDelivered = false; owner.current.offeredId = null;
      setReadyQuestion(""); setPlan(nextPlan); setSession(nextSession); setResume(nextSession); setMessage("We found another question for you.");
    } catch (error) { setMessage(error.message); setStatus("error"); }
  }

  function advance() {
    if (!owner.current.answer) return;
    stopCueAudio();
    const next = { ...stateRef.current.session, index: stateRef.current.session.index + 1 };
    owner.current.request++;
    owner.current = { ...owner.current, answer: null, supportUsed: false, readyAt: null, audioPending: false, autoPlayed: false, sequencePending: false, primaryDelivered: false, mediaRecovering: false, imageReady: false, instructionDelivery: "not_started", targetDelivery: "not_started", instructionDelivered: false, targetDelivered: false, offeredId: null, repeat: 0, inactiveMs: 0 };
    setReadyQuestion(""); setFeedback(null); setSession(next);
    if (next.index >= plan.length) {
      saveSkillsPracticeSession(progressScopeKey, null); setResume(null); setStatus("complete");
    } else { saveSkillsPracticeSession(progressScopeKey, next); setResume(next); }
  }

  function capturePress(event) {
    if (!currentQuestion || !event.target.closest(ANSWER_BUTTONS)) return;
    if (!owner.current.answer && owner.current.imageReady && !owner.current.mediaRecovering) return;
    owner.current.repeat++;
    observe(currentQuestion.id, "press", { collectionVersion: 2, questionId: currentQuestion.id,
      skillId: currentQuestion.skillId, mode: "practice", sessionId: session.id, responseId: owner.current.answer?.event.id,
      repeatPressCount: owner.current.answer ? 1 : 0, ignoredPressCount: 1, reason: owner.current.answer ? "answer_locked" : "images_pending" });
  }

  function gateInput(event) {
    if (event.target.closest(ANSWER_BUTTONS) && (owner.current.answer || owner.current.mediaRecovering || !owner.current.imageReady)) {
      event.preventDefault(); event.stopPropagation();
    }
  }

  function recordUnanswered() {
    const current = stateRef.current;
    const question = current.plan[current.session?.index];
    // Reset/deletion and learner switches may unmount an old surface. They
    // must not recreate cleared progress or attribute an exit to another child.
    if (progressOwner.current && getActiveProgressSyncSession()?.studentId !== progressOwner.current.studentId) return true;
    if (current.session && loadSkillsPracticeSession(progressScopeKey)?.id !== current.session.id) return true;
    if (question && !owner.current.answer && owner.current.offeredId === question.id) {
      const event = createSkillsPracticeEvent({ question, sessionId: current.session.id,
        responseId: `${current.session.id}:${question.id}:no-response:${crypto.randomUUID()}`, responseStatus: "no_response", supportUsed: owner.current.supportUsed,
        mediaReady: owner.current.imageReady, instructionDelivery: owner.current.instructionDelivery, targetDelivery: owner.current.targetDelivery });
      try { saveSkillsPracticeEvent(progressScopeKey, event); logAnswer(event); }
      catch (error) { if (!error.savedProgress) return false; }
      owner.current.offeredId = null;
    }
    return true;
  }

  function leaveTrail() {
    if (!recordUnanswered()) { setMessage("Try again to save your practice before leaving."); return; }
    setRecord(loadSkillsPracticeProgress(progressScopeKey));
    stopCueAudio(); owner.current.request++; setFeedback(null); setStatus("map");
  }

  function showHelp() {
    owner.current.supportUsed = true;
    const next = { ...session, supportQuestionIds: [...new Set([...(session.supportQuestionIds || []), currentQuestion.id])] };
    try { saveSkillsPracticeSession(progressScopeKey, next); setSession(next); setResume(next); setMessage(explanation(currentQuestion)); }
    catch { setMessage("Your help is still here. Please keep this page open while saving catches up."); }
  }

  async function hearSkill() {
    const request = ++owner.current.request;
    stopCueAudio(); setSkillPreview("Getting the sound ready…");
    try {
      const bank = await loadAssessmentSkillBank(chosenSkill);
      if (!owner.current.active || request !== owner.current.request || !["map", "complete", "error"].includes(stateRef.current.status)) return;
      const sample = bank.find(question => !question.retentionOnly && Number(question.level || 1) === (harder ? 2 : 1));
      const text = sample.spokenPrompt || sample.prompt || sample.question;
      const path = resolveAssessmentLedaAudioPath(text, "instruction") || sample.instructionAudioPath || sample.promptAudioPath;
      setSkillPreview(text);
      const delivered = await playAssessmentCue(path);
      if (!delivered.ok && owner.current.active && request === owner.current.request) setSkillPreview("The sound could not play. Tap Hear this skill to try again.");
    } catch { if (owner.current.active && request === owner.current.request) setSkillPreview("The sound could not load. Tap Hear this skill to try again."); }
  }

  if (status === "play" || status === "save-error") return (
    <div className="skills-practice-play" data-skills-practice-ready={readyQuestion === currentQuestion?.id} onPointerDownCapture={capturePress} onClickCapture={gateInput}>
      <div className="skills-practice-tools">
        <button type="button" onClick={leaveTrail}>Choose a skill</button>
        <p role="status">Choose an answer. You can listen again or ask for help.</p>
        {status === "save-error" ? <button type="button" className="skills-practice-main" onClick={() => { if (saveAnswer(owner.current.answer.event, owner.current.answer.nextSession)) setStatus("play"); }}>Try saving again</button>
          : <><button type="button" disabled={Boolean(feedback)} onClick={showHelp}>Show me</button>
            <button type="button" disabled={Boolean(feedback)} onClick={() => answer(null, "skipped")}>Try another</button></>}
      </div>
      <AssessmentPage currentQuestion={currentQuestion} studentName={studentName} currentStage={currentStage} currentSkillIndex={skillTree.indexOf(currentStage)}
        roundAnswers={session.answers.slice(0, session.index)} roundLength={plan.length} roundProgress={(session.index / plan.length) * 100}
        feedback={feedback} setFeedback={setFeedback} pickQuestion={advance} answerQuestion={answer} speakText={playAudio}
        shouldShowImage={question => Boolean(question.imagePath || question.imageUrl || question.targetImage)}
        onEvidenceImageError={replaceMediaFailure} onQuestionReady={questionReady} childPractice
        endAssessment={leaveTrail} assessmentMode="practice" message={message} />
    </div>
  );

  return (
    <main className="skills-practice-map" data-child-surface="skills-practice">
      <header><h1 data-child-title="">Skills trail</h1><button type="button" onClick={onExit}>Home</button></header>
      <div className="skills-practice-start">
        <button type="button" className="skills-practice-main" data-child-primary="" data-child-emphasis="primary" data-child-emphasis-cue="" disabled={status === "loading"} onClick={() => startPractice(resume)}>{status === "loading" ? "Getting ready…" : resume ? "Carry on" : `Play ${currentStage.label}`}</button>
      </div>
      <p data-child-instruction="">Choose a skill. Look, listen, and try the questions.</p>
      <p data-child-progress="">{report.answered} practice {report.answered === 1 ? "question" : "questions"} tried · {report.skills.length} {report.skills.length === 1 ? "skill" : "skills"} explored</p>
      {status === "complete" && <p role="status">You finished this trail! Choose any skill to play again.</p>}
      {(status === "error" || message) && <p role="alert">{message}</p>}
      <div className="skills-practice-options"><label><input type="checkbox" checked={harder} onChange={event => { setHarder(event.target.checked); setResume(null); }} /> Try harder questions</label>
        <button type="button" onClick={hearSkill}><span aria-hidden="true">🔊</span> Hear this skill</button></div>
      {skillPreview && <p className="skills-practice-audio-preview" role="status">{skillPreview}</p>}
      <div className="skills-practice-groups" role="group" aria-label="Skill areas" data-child-choices="">
        {allGroups.map(item => <button type="button" key={item.id} aria-pressed={item.id === group} onClick={() => { stopCueAudio(); owner.current.request++; setSkillPreview(""); setGroup(item.id); setChosenSkill(skillTree.find(skill => getAssessmentSkillGroup(skill.id) === item.id).id); setResume(null); }}><img src={item.image} alt="" /><span>{item.title}</span></button>)}
      </div>
      <section className="skills-practice-stops" aria-label="Choose a skill">
        {groupSkills.map(skill => <button type="button" key={skill.id} aria-pressed={skill.id === chosenSkill} onClick={() => { stopCueAudio(); owner.current.request++; setSkillPreview(""); setChosenSkill(skill.id); setResume(null); }}>
          <img className="skills-practice-stop-picture" src={GROUPS.find(item => item.id === group).image} alt="" /><strong>{skill.label}</strong><small>{report.skills.find(row => row.skillId === skill.id)?.responses.length || 0} turns tried</small>
        </button>)}
      </section>
    </main>
  );
}
