import { START, canWalk } from '../rules.js';
import { PROJECTS, ACTS, activityDeck } from './content.js';

export const SAVE_KEY = 'sound-seekers-woodland-homecoming-v1';
const checkpoint = () => ({ act: 0, round: 0, built: '', used: [], pending: false });
export function freshChapter(seed = Math.floor(Math.random() * 0x7fffffff)) {
  return { version: 1, seed, active: 'picnic', jobs: Object.fromEntries(PROJECTS.map(p => [p.id, checkpoint()])),
    mode: 'explore', rewardAct: null, complete: false, position: { ...START }, fireflies: [], seconds: 0, attempts: 0,
    settings: { muted: false, reduced: false, low: false } };
}
export const available = (p, id) => PROJECTS.find(job => job.id === id)?.needs.every(need => p.jobs[need].act === 3) || false;
export const currentAct = p => ACTS.find(a => a.projectId === p.active && a.actIndex === Math.min(2, p.jobs[p.active].act));
export const currentRound = p => activityDeck(currentAct(p), p.seed)[p.jobs[p.active].round];
export const lights = p => PROJECTS.filter(job => job.light && p.jobs[job.id].act === 3).length;
export const repairs = p => Object.fromEntries(PROJECTS.map(job => [job.id, p.jobs[job.id].act]));
export const finishedRounds = p => Object.values(p.jobs).reduce((sum, job) => sum + job.act * 8 + job.round + Number(job.pending), 0);
export function selectProject(p, id) {
  if (!available(p, id) || p.jobs[id].act === 3) return p;
  return { ...p, active: id, mode: 'explore' };
}
export function judgeChoice(p, choiceId) {
  const round = currentRound(p), job = p.jobs[p.active], choice = round.choices.find(c => c.id === choiceId);
  if (!choice || job.pending || job.act === 3 || job.used.includes(choiceId)) return { accepted: false, correct: false, progress: p };
  const correct = round.kind === 'build' ? choice.label === round.word[job.built.length] : choiceId === round.answer;
  const built = correct && round.kind === 'build' ? job.built + choice.label : job.built;
  const used = correct && round.kind === 'build' ? [...job.used, choiceId] : job.used;
  const finished = correct && (round.kind !== 'build' || built.length === round.word.length);
  return { accepted: true, correct, finished, progress: { ...p, attempts: p.attempts + 1, jobs: {
    ...p.jobs, [p.active]: { ...job, built, used, pending: finished },
  } } };
}
export function settleChapter(p) {
  const job = p.jobs[p.active];
  if (!job.pending) return p;
  const end = job.round === 7;
  return { ...p, mode: end ? 'reward' : 'activity', rewardAct: end ? currentAct(p).id : null, jobs: {
    ...p.jobs, [p.active]: { ...checkpoint(), act: job.act + Number(end), round: end ? 0 : job.round + 1 },
  } };
}
export function claimReward(p) {
  if (p.mode !== 'reward') return p;
  const complete = PROJECTS.every(job => p.jobs[job.id].act === 3);
  const active = p.jobs[p.active].act < 3 ? p.active : PROJECTS.find(job => available(p, job.id) && p.jobs[job.id].act < 3)?.id || 'tree';
  return { ...p, active, mode: complete ? 'complete' : 'explore', complete, rewardAct: null };
}
export function parseChapter(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Number.isInteger(data.seed) || data.seed < 0 || data.seed > 0x7fffffff || !data.jobs) return null;
    const p = freshChapter(data.seed);
    for (const project of PROJECTS) {
      const j = data.jobs[project.id];
      if (!j || !Number.isInteger(j.act) || j.act < 0 || j.act > 3 || !Number.isInteger(j.round) || j.round < 0 || j.round > 7) return null;
      p.jobs[project.id] = { ...checkpoint(), act: j.act, round: j.act === 3 ? 0 : j.round };
      if (j.act === 3) continue;
      const round = activityDeck(project.acts[j.act], p.seed)[j.round];
      const used = Array.isArray(j.used) ? j.used : [];
      const letters = used.map(id => round.choices.find(c => c.id === id)?.label).join('');
      const validBuild = round.kind === 'build' && new Set(used).size === used.length && used.every(id => round.choices.some(c => c.id === id)) && letters === j.built && round.word.startsWith(letters);
      p.jobs[project.id].built = validBuild ? letters : '';
      p.jobs[project.id].used = validBuild ? used : [];
      p.jobs[project.id].pending = j.pending === true && (round.kind !== 'build' || letters === round.word && validBuild);
    }
    if (PROJECTS.some(job => p.jobs[job.id].act > 0 && !available(p, job.id))) return null;
    p.active = PROJECTS.some(job => job.id === data.active) && available(p, data.active) ? data.active : 'picnic';
    p.mode = ['activity', 'reward', 'complete'].includes(data.mode) ? data.mode : 'explore';
    p.rewardAct = ACTS.find(a => a.id === data.rewardAct && a.projectId === p.active && a.actIndex + 1 === p.jobs[p.active].act)?.id || null;
    if (p.mode === 'reward' && !p.rewardAct) p.mode = 'explore';
    p.complete = PROJECTS.every(job => p.jobs[job.id].act === 3) && data.complete === true;
    if (p.complete) p.mode = 'complete';
    else if (p.mode === 'complete') p.mode = 'explore';
    if (p.jobs[p.active].act === 3 && p.mode !== 'reward' && !p.complete) p.active = PROJECTS.find(job => available(p, job.id) && p.jobs[job.id].act < 3)?.id || 'tree';
    const movementStage = p.jobs.brook.act === 3 ? 2 : 0;
    if (Number.isFinite(data.position?.x) && Number.isFinite(data.position?.z) && canWalk(data.position.x, data.position.z, movementStage)) p.position = { x: data.position.x, z: data.position.z };
    p.fireflies = Array.isArray(data.fireflies) ? [...new Set(data.fireflies.filter(i => Number.isInteger(i) && i >= 0 && i < 5))] : [];
    for (const key of ['seconds', 'attempts']) p[key] = Number.isFinite(data[key]) ? Math.max(0, Math.floor(data[key])) : 0;
    for (const key of ['muted', 'reduced', 'low']) p.settings[key] = data.settings?.[key] === true;
    return settleChapter(p);
  } catch { return null; }
}
