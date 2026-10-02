import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, SpeakerHigh } from "@phosphor-icons/react";
import { excludeFailedAssessmentMediaQuestions, questionUsesFailedAssessmentMedia } from "../policy/assessmentMediaEvidence.js";
import { skillTree } from "../skillTree.js";
import { getAssessmentSkillGroup, loadAssessmentSkillBank } from "../data/loadAssessmentSkillBank.js";
import { AssessmentPage } from "./AppPages.jsx";
import { comparableSentenceAnswer, getQuestionAnswer, isFixSentenceQuestion, isPairSelectionQuestion, normalizeAssessmentQuestion, normalizeMultiSelectAnswer, normalizePairSelectionAnswer } from "../appState/assessmentRuntime.js";
import { getPreferredPhonemeAudioPath } from "../data/phonemeAudioBank.js";
import { getAssessmentStimulusAudioText } from "../utils/assessmentAudioPolicy.js";
import { resolveAssessmentLedaAudioPath } from "../utils/assessmentLedaResolver.js";
import { playAssessmentCue } from "../utils/audio/assessmentPlayback.js";
import { stopCueAudio } from "../utils/audio/cuePlayer.js";
import { speakWithBrowser } from "../utils/audio/speakWithBrowser.js";
import { getActiveProgressSyncSession, logStudentActivity } from "../utils/progressSync.js";
import { buildSkillsPracticeReport, createSkillsPracticeEvent, selectSkillsPracticeQuestions, shufflePracticeChoices } from "../utils/skillsPracticeModel.js";
import { loadSkillsPracticeProgress, loadSkillsPracticeSession, saveSkillsPracticeEvent, saveSkillsPracticeSession } from "../utils/skillsPracticeProgress.js";
import "../styles/skills-practice.css";
import { createLearningResponseEpisode, commitLearningResponse, advanceLearningResponseReceipt, recordLearningGuidedAction, recordLearningGuidedStep, startLearningWithModel, learningResponseRecoveryIssue, selectFreshLearningTransfer, learningStimulusSignature, learningGuidedModelIsPlaced, learningResponseCompletionEvent } from "../utils/learningResponseState.js";
import { learningModelLabel } from "../utils/learningResponseAdapters.js";
import { LearningTeachingCard } from "./learning/LearningTeachingCard.jsx";

const GROUPS = [
  { id: "early_phonics", title: "Listen to sounds", image: "/images/navigation/sounds-icon.webp" },
  { id: "hfw", title: "Read common words", image: "/images/navigation/books-icon.webp" },
  { id: "replacement_phonics", title: "Word sounds", image: "/images/navigation/words-icon.webp" },
  { id: "grammar_language", title: "Words and sentences", image: "/images/navigation/story-icon.webp" },
  { id: "comprehension", title: "Read and think", image: "/images/navigation/map-icon.webp" }
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
  return [question.explanation, question.rationale].find(value => typeof value === "string" && value.trim()) || `The answer is “${learningModelLabel(question.correctAnswers || getQuestionAnswer(question), question)}”. ${question.passage || question.story ? "Use the details in the story." : "Look and listen carefully, then try the next question."}`;
}

function StudentSkillsPracticeSession({ progressScopeKey, onExit, studentName = "Reader" }) {
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
  const [teachingRevision, setTeachingRevision] = useState(0);
  const [record, setRecord] = useState(() => loadSkillsPracticeProgress(progressScopeKey));
  const [resume, setResume] = useState(() => loadSkillsPracticeSession(progressScopeKey));
  const stateRef = useRef(null);
  const bankRef = useRef([]);
  const progressOwner = useRef(getActiveProgressSyncSession());
  const owner = useRef({ active: true, request: 0, readyAt: null, answer: null, supportUsed: false, audioPending: false, autoPlayed: false, sequencePending: false, primaryDelivered: false, mediaRecovering: false, imageReady: false, instructionDelivery: "not_started", targetDelivery: "not_started", instructionDelivered: false, targetDelivered: false, repeat: 0, hiddenAt: null, inactiveMs: 0 });
  useLayoutEffect(() => { stateRef.current = { session, plan, status, feedback, currentQuestion, playAudio, questionReady, recordUnanswered }; });
  const episode = session?.responseEpisode;
  const currentQuestion = episode?.question || (session ? plan[session.index] || null : null);
  const displayedSkillId = status === "play" || status === "save-error" ? session?.skillId : chosenSkill;
  const currentStage = skillTree.find(skill => skill.id === displayedSkillId) || skillTree[0];
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
        if (current.status === "play" && !owner.current.answer && owner.current.readyAt === null) current.questionReady(current.currentQuestion?.id);
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
    const question = stateRef.current.currentQuestion;
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
        if (owner.current.active && request === owner.current.request && stateRef.current.currentQuestion?.id === questionId) {
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

  function makeEpisode(question, nextSession, index) {
    const transfer = selectFreshLearningTransfer(question, bankRef.current, { excludedIds: nextSession.questionIds });
    const preparedTransfer = transfer ? prepare(transfer, `${nextSession.id}:transfer:${index}`) : null;
    return createLearningResponseEpisode({ id: `${nextSession.id}:slot:${index}`, instrument: "skills_trail_practice", slotId: String(index),
      question, expected: question.correctAnswers || getQuestionAnswer(question), transfer: preparedTransfer ? { question: preparedTransfer, expected: preparedTransfer.correctAnswers || getQuestionAnswer(preparedTransfer) } : null });
  }
  function saveEpisode(nextEpisode, base = stateRef.current.session) {
    const taughtStimuli = [...new Set([...(base.taughtStimuli || []), ...nextEpisode.guidedActions.map(action => learningStimulusSignature(action.question)),
      ...(nextEpisode.guidedActions.length ? nextEpisode.responses.filter(response => response.presentationRole === "transfer").map(response => learningStimulusSignature(response.question)) : [])])];
    const nextSession = { ...base, taughtStimuli, responseEpisode: nextEpisode };
    const event = learningResponseCompletionEvent(nextEpisode);
    try {
      if (!event.steps.length) saveSkillsPracticeSession(progressScopeKey, nextSession);
      else setRecord(saveSkillsPracticeEvent(progressScopeKey, event, nextSession));
    } catch (error) {
      if (error.savedProgress) setRecord(error.savedProgress.games["skills-trail"].practiceRecord);
      else { owner.current.pendingLearning = nextEpisode; throw error; }
    }
    owner.current.pendingLearning = null;
    setSession(nextSession); setResume(nextSession);
    stateRef.current = { ...stateRef.current, session: nextSession, currentQuestion: nextEpisode.question };
    return nextSession;
  }
  function resetPresentation() {
    owner.current.request++; stopCueAudio();
    owner.current = { ...owner.current, answer: null, supportUsed: false, readyAt: null, audioPending: false, autoPlayed: false, sequencePending: false, primaryDelivered: false, mediaRecovering: false, imageReady: false, instructionDelivery: "not_started", targetDelivery: "not_started", instructionDelivered: false, targetDelivered: false, offeredId: null, repeat: 0, inactiveMs: 0 };
    setReadyQuestion(""); setFeedback(null); setMessage("");
  }

  async function startPractice(saved = null) {
    stopCueAudio();
    const request = ++owner.current.request;
    setStatus("loading"); setMessage(""); setReadyQuestion("");
    const skillId = saved?.skillId || chosenSkill;
    const nextSession = saved || { id: crypto.randomUUID(), skillId, level: harder ? 2 : 1, index: 0, answers: [], questionIds: [], startedAt: new Date().toISOString() };
    try {
      if (learningResponseRecoveryIssue(saved?.responseEpisode)) throw new Error("This saved learning session needs an app update. Your answers are kept here.");
      const loadedBank = await loadAssessmentSkillBank(skillId);
      const bank = excludeFailedAssessmentMediaQuestions(loadedBank, { failedQuestionIds: saved?.failedQuestionIds || [], failedSources: saved?.failedMediaSources || [] });
      bankRef.current = bank;
      if (!owner.current.active || request !== owner.current.request) return;
      const priorIds = record.completions.flatMap(event => event.steps.map(step => step.questionId));
      const selected = saved?.questionIds?.length
        ? saved.questionIds.map(id => bank.find(item => item.id === id)).filter(Boolean)
        : selectSkillsPracticeQuestions(bank, { level: nextSession.level, seed: nextSession.id, previousIds: priorIds });
      if (!selected.length || (saved && selected.length !== saved.questionIds.length)) throw new Error("This trail needs new questions. Choose a skill to start a new trail.");
      nextSession.questionIds = selected.map(item => item.id);
      // A committed first answer is never asked or counted again after reload.
      if (!nextSession.responseEpisode) nextSession.index = Math.max(nextSession.index, nextSession.answers.length);
      if (nextSession.index < selected.length && !nextSession.responseEpisode) nextSession.responseEpisode = makeEpisode(prepare(selected[nextSession.index], nextSession.id), nextSession, nextSession.index);
      saveSkillsPracticeSession(progressScopeKey, nextSession);
      owner.current = { ...owner.current, readyAt: null, answer: null, supportUsed: Boolean(nextSession.supportQuestionIds?.includes(selected[nextSession.index]?.id)), audioPending: false, autoPlayed: false, sequencePending: false, primaryDelivered: false, mediaRecovering: false, imageReady: false, instructionDelivery: "not_started", targetDelivery: "not_started", instructionDelivered: false, targetDelivered: false, offeredId: null, repeat: 0, inactiveMs: 0 };
      setSession(nextSession); setPlan(selected.map(item => prepare(item, nextSession.id))); setResume(nextSession);
      if (nextSession.responseEpisode?.phase === "complete") {
        stateRef.current = { ...stateRef.current, session: nextSession, plan: selected.map(item => prepare(item, nextSession.id)) };
        finishEpisode(nextSession.responseEpisode, selected.map(item => prepare(item, nextSession.id))); return;
      }
      if (nextSession.responseEpisode?.phase === "receipt") {
        const response = nextSession.responseEpisode.responses.at(-1);
        owner.current.answer = { event: null, nextSession };
        setFeedback({ isCorrect: response.observedCorrect, explanation: explanation(nextSession.responseEpisode.question) });
      }
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
    if (!currentQuestion || owner.current.answer || episode?.phase !== "answer") return false;
    if (responseStatus === "answered" && (!owner.current.imageReady || owner.current.mediaRecovering)) return false;
    const recentlyTaught = (session.taughtStimuli || []).includes(learningStimulusSignature(currentQuestion));
    const event = createSkillsPracticeEvent({ question: currentQuestion, sessionId: session.id,
      responseId: `${episode.id}:${episode.role}`, selected: choice, isCorrect: responseStatus === "answered" ? grade(currentQuestion, choice) : null,
      responseStatus, supportUsed: owner.current.supportUsed || recentlyTaught || episode.role === "transfer", mediaReady: owner.current.imageReady,
      audioRequired: !currentQuestion.suppressStimulusAudio && Boolean(getAssessmentStimulusAudioText(currentQuestion)) && /audio/.test(currentQuestion.evidenceModality || currentQuestion.mediaTier || ""),
      targetDelivered: owner.current.targetDelivered,
      instructionDelivery: owner.current.instructionDelivery, targetDelivery: owner.current.targetDelivery,
      responseTimeMs: owner.current.readyAt === null ? null : performance.now() - owner.current.readyAt - owner.current.inactiveMs });
    event.steps[0].presentationRole = episode.role;
    const nextEpisode = commitLearningResponse(episode, { selected: choice, correct: event.steps[0].answerMatch, responseStatus,
      valid: event.steps[0].validity === "valid" || ["no_response", "supported"].includes(responseStatus), supported: owner.current.supportUsed || recentlyTaught,
      supportUsed: recentlyTaught ? ["recent_transfer_teaching"] : owner.current.supportUsed ? ["requested_model"] : [], responseTimeMs: event.steps[0].responseTimeMs,
      media: { image: owner.current.imageReady, targetAudio: owner.current.targetDelivery } });
    const nextSession = { ...session, feedbackRemainingMs: null, responseEpisode: nextEpisode,
      answers: episode.role === "first_probe" ? [...session.answers, event.steps[0].answerMatch] : session.answers };
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
    if (!owner.current.active || request !== owner.current.request || stateRef.current.currentQuestion?.id !== questionId) return { ok: false };
    owner.current.audioPending = false;
    if (outcome === "completed" && !options.requiredSequence && !owner.current.answer && owner.current.imageReady
      && owner.current.instructionDelivered && (!getAssessmentStimulusAudioText(currentQuestion) || owner.current.targetDelivered)
      && owner.current.readyAt === null) {
      owner.current.primaryDelivered = true; owner.current.autoPlayed = true;
      owner.current.readyAt = performance.now(); owner.current.inactiveMs = 0; setReadyQuestion(questionId);
    }
    if (outcome === "failed") replaceMediaFailure({ src: approved, questionId });
    return { ...delivery, ok: outcome === "completed" };
  }

  async function replaceMediaFailure({ src = "", questionId = currentQuestion?.id } = {}) {
    if (!currentQuestion || questionId !== currentQuestion.id || owner.current.answer || owner.current.mediaRecovering) return;
    owner.current.mediaRecovering = true;
    const failed = currentQuestion;
    const request = ++owner.current.request;
    stopCueAudio(); setReadyQuestion("");
    const event = createSkillsPracticeEvent({ question: failed, sessionId: session.id, responseId: `${session.id}:${failed.id}`, responseStatus: "media_failed" });
    try {
      setRecord(saveSkillsPracticeEvent(progressScopeKey, event)); logAnswer(event);
      const bank = await loadAssessmentSkillBank(session.skillId);
      if (!owner.current.active || request !== owner.current.request) return;
      const failedQuestionIds = [...new Set([...(session.failedQuestionIds || []), failed.id])];
      const failedMediaSources = [...new Set([...(session.failedMediaSources || []), src].filter(Boolean))];
      const failures = { failedQuestionIds, failedSources: failedMediaSources };
      const nextPlan = [...plan];
      const affected = nextPlan.flatMap((item, index) => index >= session.index && questionUsesFailedAssessmentMedia(item, failures) ? [index] : []);
      const replacements = selectSkillsPracticeQuestions(excludeFailedAssessmentMediaQuestions(bank, failures), {
        level: session.level, seed: `${session.id}:${failed.id}`, failedIds: session.questionIds, count: affected.length
      });
      if (replacements.length !== affected.length) throw new Error("The pictures or sound could not load. Try another skill.");
      affected.forEach((index, replacementIndex) => { nextPlan[index] = prepare(replacements[replacementIndex], session.id); });
      let replacementEpisode;
      if (episode?.role === "transfer") {
        const transfer = selectFreshLearningTransfer(episode.firstQuestion, excludeFailedAssessmentMediaQuestions(bank, failures), { excludedIds: [...session.questionIds, failed.id] });
        if (!transfer) throw new Error("This example could not load. Choose another skill to keep learning.");
        const question = prepare(transfer, `${episode.id}:replacement:${failed.id}`);
        replacementEpisode = { ...episode, question, expected: question.correctAnswers || getQuestionAnswer(question), transfer: { question, expected: question.correctAnswers || getQuestionAnswer(question) } };
      }
      const nextSession = { ...session, questionIds: nextPlan.map(item => item.id), failedQuestionIds, failedMediaSources,
        responseEpisode: replacementEpisode || makeEpisode(nextPlan[session.index], session, session.index) };
      saveSkillsPracticeSession(progressScopeKey, nextSession);
      owner.current.readyAt = null; owner.current.audioPending = false; owner.current.autoPlayed = false; owner.current.sequencePending = false; owner.current.primaryDelivered = false; owner.current.mediaRecovering = false; owner.current.imageReady = false; owner.current.instructionDelivery = "not_started"; owner.current.targetDelivery = "not_started"; owner.current.instructionDelivered = false; owner.current.targetDelivered = false; owner.current.offeredId = null;
      setReadyQuestion(""); setPlan(nextPlan); setSession(nextSession); setResume(nextSession); setMessage("We found another question for you.");
    } catch (error) { setMessage(error.message); setStatus("error"); }
  }

  function advance() {
    if (!owner.current.answer) return;
    const advanced = advanceLearningResponseReceipt(stateRef.current.session.responseEpisode);
    try { saveEpisode(advanced); } catch { setMessage("Your answer is saved. Try saving the next step again."); setStatus("save-error"); return; }
    resetPresentation();
    if (advanced.phase !== "complete") return;
    finishEpisode(advanced);
  }
  function finishEpisode(completed, currentPlan = plan) {
    const base = stateRef.current.session;
    const next = { ...base, index: base.index + 1, responseEpisode: null };
    const nextPlan = [...currentPlan];
    if (completed.completion?.unresolved && next.index < currentPlan.length && Number(currentPlan[next.index].level || 1) === 2) {
      const easier = selectSkillsPracticeQuestions(bankRef.current, { level: 1, seed: `${next.id}:easier:${next.index}`, failedIds: [...next.questionIds, ...(next.failedQuestionIds || [])], count: 1 })[0];
      if (easier) {
        nextPlan[next.index] = prepare(easier, next.id);
        next.questionIds = nextPlan.map(question => question.id);
        setPlan(nextPlan);
      }
    }
    if (next.index < currentPlan.length) { const created = makeEpisode(nextPlan[next.index], next, next.index); next.responseEpisode = completed.completion?.unresolved ? startLearningWithModel(created) : created; }
    if (completed.completion?.unresolved && next.level === 2) setMessage("Let's use a little help with the next one.");
    try { saveSkillsPracticeSession(progressScopeKey, next.index >= currentPlan.length ? null : next); }
    catch (error) {
      if (!error.savedProgress) {
        owner.current.pendingSession = { next, nextPlan }; setStatus("save-error"); setMessage("Your finished turn is held here. Try saving before carrying on."); return false;
      }
    }
    applyPracticeContinuation(next, nextPlan);
    return true;
  }
  function applyPracticeContinuation(next, nextPlan) {
    owner.current.pendingSession = null; setSession(next); setPlan(nextPlan);
    setResume(next.index >= nextPlan.length ? null : next); setStatus(next.index >= nextPlan.length ? "complete" : "play");
    stateRef.current = { ...stateRef.current, session: next, plan: nextPlan, currentQuestion: next.responseEpisode?.question || nextPlan[next.index] };
  }
  function guided(selected) {
    const current = stateRef.current.session.responseEpisode;
    const next = recordLearningGuidedAction(current, selected);
    if (next === current) return;
    try {
      saveEpisode(next); resetPresentation();
      if (next.phase === "complete") finishEpisode(next);
    } catch { setStatus("save-error"); setMessage("Your example is still here. Try saving it again."); }
  }

  function checkpointFeedback(remainingMs) {
    const current = stateRef.current.session;
    if (current?.responseEpisode?.phase !== "receipt" || !Number.isFinite(remainingMs)) return;
    const next = { ...current, feedbackRemainingMs: Math.max(0, remainingMs) };
    stateRef.current = { ...stateRef.current, session: next };
    try { saveSkillsPracticeSession(progressScopeKey, next); } catch { /* The first response is already retained; replay the full receipt if this timing checkpoint cannot save. */ }
  }

  function retryLearningSave() {
    try {
      const continuation = owner.current.pendingSession;
      if (continuation) {
        saveSkillsPracticeSession(progressScopeKey, continuation.next.index >= continuation.nextPlan.length ? null : continuation.next);
        applyPracticeContinuation(continuation.next, continuation.nextPlan); resetPresentation(); return;
      }
      const pending = owner.current.pendingLearning;
      if (pending) {
        const completedModel = learningGuidedModelIsPlaced(pending) ? recordLearningGuidedAction(pending, pending.expected, pending.events.at(-1)?.occurredAt) : pending;
        saveEpisode(completedModel); setTeachingRevision(value => value + 1); resetPresentation(); setStatus("play");
        if (completedModel.phase === "complete") finishEpisode(completedModel);
      } else if (owner.current.answer?.event) { if (saveAnswer(owner.current.answer.event, owner.current.answer.nextSession)) setStatus("play"); }
      else { saveEpisode(stateRef.current.session.responseEpisode); setStatus("play"); }
    } catch { setStatus("save-error"); setMessage("Your work is held here. Try saving again."); }
  }

  function capturePress(event) {
    if (!currentQuestion || !event.target.closest(ANSWER_BUTTONS)) return;
    if (!owner.current.answer && owner.current.imageReady && !owner.current.mediaRecovering) return;
    owner.current.repeat++;
    observe(currentQuestion.id, "press", { collectionVersion: 2, questionId: currentQuestion.id,
      skillId: currentQuestion.skillId, mode: "practice", sessionId: session.id, responseId: owner.current.answer?.event?.id,
      repeatPressCount: owner.current.answer ? 1 : 0, ignoredPressCount: 1, reason: owner.current.answer ? "answer_locked" : "images_pending" });
  }

  function gateInput(event) {
    if (event.target.closest(ANSWER_BUTTONS) && (owner.current.answer || owner.current.mediaRecovering || !owner.current.imageReady)) {
      event.preventDefault(); event.stopPropagation();
    }
  }

  function recordUnanswered() {
    const current = stateRef.current;
    const question = current.currentQuestion;
    // Reset/deletion and learner switches may unmount an old surface. They
    // must not recreate cleared progress or attribute an exit to another child.
    if (progressOwner.current && getActiveProgressSyncSession()?.studentId !== progressOwner.current.studentId) return true;
    if (current.session && loadSkillsPracticeSession(progressScopeKey)?.id !== current.session.id) return true;
    if (question && current.session?.responseEpisode?.phase === "answer" && !owner.current.answer && owner.current.offeredId === question.id) {
      const event = createSkillsPracticeEvent({ question, sessionId: current.session.id,
        responseId: `${current.session.id}:${question.id}:abandoned:${crypto.randomUUID()}`, responseStatus: "abandoned", supportUsed: owner.current.supportUsed,
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

  async function replayWorkedModel() {
    const target = getAssessmentStimulusAudioText(currentQuestion);
    if (target) await playAudio(target, currentQuestion.audioPath || currentQuestion.audioUrl, { audioRole: "target_word" });
    const expected = currentQuestion.correctAnswers || getQuestionAnswer(currentQuestion);
    for (const part of Array.isArray(expected) ? expected : [expected]) {
      const label = typeof part === "object" ? part.word || part.label || part.letter : String(part ?? "");
      const path = getPreferredPhonemeAudioPath(label) || resolveAssessmentLedaAudioPath(label, "target_word");
      if (path) await playAudio(label, path, { audioRole: "worked_model" });
    }
  }
  function showHelp() {
    if (!episode || episode.phase !== "answer" || owner.current.answer) return;
    owner.current.supportUsed = true;
    answer(null, "supported");
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
        {status === "save-error" ? <button type="button" className="skills-practice-main" onClick={retryLearningSave}>Try saving again</button>
          : <><button type="button" disabled={Boolean(feedback) || episode?.phase !== "answer"} onClick={showHelp}>Show me</button>
            <button type="button" disabled={Boolean(feedback) || episode?.phase !== "answer"} onClick={() => answer(null, "no_response")}>I don't know yet</button></>}
      </div>
      {["teaching", "finish_teaching"].includes(episode?.phase) ? <LearningTeachingCard key={`${episode.id}:${episode.phase}:${teachingRevision}`} episode={episode} disabled={status === "save-error"} explanation={explanation(currentQuestion)}
        image={currentQuestion.imagePath || currentQuestion.targetImage || currentQuestion.imageUrl} word={currentQuestion.targetWord}
        passage={currentQuestion.passage || currentQuestion.story} onGuided={guided} onGuidedStep={index => { try { saveEpisode(recordLearningGuidedStep(stateRef.current.session.responseEpisode, index)); return true; } catch { setStatus("save-error"); setMessage("Your learning is still here. Try saving again."); return false; } }} onLeave={leaveTrail}
        onReplay={replayWorkedModel} />
        : <AssessmentPage practiceFeedbackRemainingMs={session.feedbackRemainingMs} onPracticeFeedbackCheckpoint={checkpointFeedback} currentQuestion={currentQuestion} studentName={studentName} currentStage={currentStage} currentSkillIndex={skillTree.indexOf(currentStage)}
        roundAnswers={session.answers.slice(0, session.index)} roundLength={plan.length} roundProgress={(session.index / plan.length) * 100}
        feedback={feedback} setFeedback={setFeedback} pickQuestion={advance} answerQuestion={answer} speakText={playAudio}
        shouldShowImage={question => Boolean(question.imagePath || question.imageUrl || question.targetImage)}
        onEvidenceImageError={replaceMediaFailure} onQuestionReady={questionReady} childPractice
        endAssessment={leaveTrail} assessmentMode="practice" message={message} />}
    </div>
  );

  return (
    <main className="skills-practice-map" data-child-surface="skills-practice">
      <header><div><h1 data-child-title="">Skills trail</h1>
        <p data-child-instruction="">Choose a skill, then play a short trail.</p>
        <p className="skills-practice-progress" data-child-progress="">{report.answered} {report.answered === 1 ? "question" : "questions"} tried · {report.skills.length} {report.skills.length === 1 ? "skill" : "skills"} explored</p>
      </div><button type="button" onClick={onExit}>Home</button></header>
      <section className="skills-practice-start" aria-label="Your selected skill">
        <img className="skills-practice-launch-picture" src={GROUPS.find(item => item.id === group)?.image} alt="" />
        <div className="skills-practice-selected"><span>{resume ? "Your saved trail" : "Ready to play"}</span>
          <h2>{currentStage.label}</h2><p>{resume ? `Question ${Math.min(resume.index + 1, resume.questionIds.length)} of ${resume.questionIds.length}` : "6 questions · Look, listen, and choose"}</p>
        </div>
        <button type="button" className="skills-practice-main" data-child-primary="" data-child-emphasis="primary" data-child-emphasis-cue="" disabled={status === "loading"} onClick={() => startPractice(resume)}>{status === "loading" ? "Getting ready…" : resume ? "Carry on" : `Play ${currentStage.label}`}</button>
        <div className="skills-practice-options"><button type="button" onClick={hearSkill}><SpeakerHigh aria-hidden="true" size={22} /> Hear this skill</button>
          <button type="button" role="switch" aria-checked={harder} onClick={() => { setHarder(value => !value); setResume(null); }}><span className="skills-practice-level-check" aria-hidden="true">{harder ? "✓" : ""}</span> Try harder questions</button>
        </div>
        {skillPreview && <p className="skills-practice-audio-preview" role="status">{skillPreview}</p>}
      </section>
      {status === "complete" && <p className="skills-practice-notice" role="status">You finished this trail! Choose any skill to play again.</p>}
      {(status === "error" || message) && <p className="skills-practice-notice" role="alert">{message}</p>}
      <h2 className="skills-practice-section-title">Choose an area</h2>
      <div className="skills-practice-groups" role="group" aria-label="Skill areas" data-child-choices="">
        {allGroups.map(item => <button type="button" key={item.id} aria-pressed={item.id === group} onClick={() => { stopCueAudio(); owner.current.request++; setSkillPreview(""); setGroup(item.id); setChosenSkill(skillTree.find(skill => getAssessmentSkillGroup(skill.id) === item.id).id); setResume(null); }}><img src={item.image} alt="" /><span>{item.title}</span></button>)}
      </div>
      <h2 className="skills-practice-section-title">Choose a skill</h2>
      <section className="skills-practice-stops" aria-label="Choose a skill">
        {groupSkills.map(skill => <button type="button" key={skill.id} aria-pressed={skill.id === chosenSkill} onClick={() => { stopCueAudio(); owner.current.request++; setSkillPreview(""); setChosenSkill(skill.id); setResume(null); }}>
          <img className="skills-practice-stop-picture" src={GROUPS.find(item => item.id === group).image} alt="" /><strong>{skill.label}</strong><small>{report.skills.find(row => row.skillId === skill.id)?.responses.filter(response => response.responseStatus === "answered").length || 0} questions tried</small>{skill.id === chosenSkill && <Check className="skills-practice-selected-check" aria-hidden="true" size={22} />}
        </button>)}
      </section>
    </main>
  );
}

export function StudentSkillsPracticePage(props) {
  return <StudentSkillsPracticeSession key={props.progressScopeKey || "default"} {...props} />;
}
