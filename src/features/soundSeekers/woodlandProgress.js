import { PROJECTS } from '../../../demos/sound-seekers/src/chapter/content.js';
import { freshChapter, parseChapter } from '../../../demos/sound-seekers/src/chapter/progress.js';

export const WOODLAND_PROGRESS_ROW = 'woodland_homecoming_v1';
const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const ordinal = job => Math.min(24, count(job?.act) * 8 + count(job?.round) + Number(job?.pending === true));
const read = value => parseChapter(JSON.stringify(value));

// Reuse the deployed quest transport's forward-only repairs and reset codec.
// This separate row contains supported-practice checkpoints, never assessment
// evidence. Its transport version does not revive the previous game runtime.
export function encodeWoodlandProgress(progress) {
  if (!read(progress)) return null;
  return {
    v: 2, contentVersion: 'sound-seekers-v2',
    reset: { epoch: count(progress.resetEpoch), at: progress.updatedAt || '' },
    trail: {
      routeCursor: 1, journeyStep: 1, completedStopIds: [],
      repairs: Object.fromEntries(PROJECTS.map(project => [project.id, ordinal(progress.jobs[project.id])])),
      chapterCoverage: { woodland: {
        attempts: count(progress.attempts),
        lastAnswerMs: count(Date.parse(progress.lastAnsweredAt || '')),
        fireflies: Object.fromEntries((progress.fireflies || []).map(id => [id, true]))
      } }
    },
    evidence: [], confusions: {}, contentDecks: {}, attemptReceipts: [],
    journal: { words: [], scenes: [], stickers: [] }, rewards: { claimedIds: [] },
    checkpoint: { contentVersion: 'sound-seekers-v2', kind: WOODLAND_PROGRESS_ROW, updatedAt: progress.updatedAt || '', woodland: progress },
    settings: progress.settings
  };
}

export function decodeWoodlandProgress(packet) {
  if (packet?.checkpoint?.kind !== WOODLAND_PROGRESS_ROW) return null;
  const saved = read(packet.checkpoint.woodland);
  if (!saved) return null;
  const next = { ...saved, jobs: { ...saved.jobs }, resetEpoch: count(packet.reset?.epoch) };
  for (const project of PROJECTS) {
    const target = Math.min(24, Math.max(ordinal(saved.jobs[project.id]), count(packet.trail?.repairs?.[project.id])));
    if (target !== ordinal(saved.jobs[project.id])) {
      next.jobs[project.id] = { act: Math.floor(target / 8), round: target % 8, built: '', used: [], pending: false };
      next.mode = 'explore'; next.rewardAct = null;
    }
  }
  const participation = packet.trail?.chapterCoverage?.woodland || {};
  next.attempts = Math.max(next.attempts, count(participation.attempts));
  const answered = count(participation.lastAnswerMs);
  next.lastAnsweredAt = answered ? new Date(answered).toISOString() : saved.lastAnsweredAt || '';
  next.fireflies = [...new Set([...next.fireflies, ...Object.keys(participation.fireflies || {}).filter(id => participation.fireflies[id] === true).map(Number)])];
  next.complete = PROJECTS.every(project => next.jobs[project.id].act === 3);
  if (next.complete) next.mode = 'complete';
  return read(next);
}

export function mergeWoodlandProgress(left, right) {
  if (!decodeWoodlandProgress(left)) return decodeWoodlandProgress(right) ? right : left;
  if (!decodeWoodlandProgress(right)) return left;
  const leftEpoch = count(left.reset?.epoch), rightEpoch = count(right.reset?.epoch);
  if (leftEpoch !== rightEpoch) return leftEpoch > rightEpoch ? left : right;
  const latest = String(left.checkpoint.updatedAt) >= String(right.checkpoint.updatedAt) ? left : right;
  const a = left.trail.chapterCoverage?.woodland || {}, b = right.trail.chapterCoverage?.woodland || {};
  return {
    ...latest,
    trail: { ...latest.trail,
      repairs: Object.fromEntries(PROJECTS.map(project => [project.id, Math.max(count(left.trail.repairs?.[project.id]), count(right.trail.repairs?.[project.id]))])),
      chapterCoverage: { woodland: {
        attempts: Math.max(count(a.attempts), count(b.attempts)),
        lastAnswerMs: Math.max(count(a.lastAnswerMs), count(b.lastAnswerMs)),
        fireflies: { ...a.fireflies, ...b.fireflies }
      } }
    }
  };
}

export function woodlandHomeSummary(progress) {
  const chapter = read(progress) || freshChapter(1);
  const completed = PROJECTS.filter(project => chapter.jobs[project.id].act === 3).length;
  const project = PROJECTS.find(item => item.id === chapter.active);
  return { completed, remaining: PROJECTS.length - completed,
    started: chapter.attempts > 0 || completed > 0,
    next: chapter.complete ? 'The woodland is ready for the Pals.' : project.acts[Math.min(2, chapter.jobs[project.id].act)].title };
}

export function woodlandParticipation(packet) {
  const chapter = decodeWoodlandProgress(packet);
  if (!chapter) return null;
  return { practiceOnly: true, attempts: chapter.attempts,
    projectsCompleted: woodlandHomeSummary(chapter).completed, totalProjects: PROJECTS.length,
    lastActiveAt: chapter.lastAnsweredAt || '',
    label: 'Woodland practice' };
}
