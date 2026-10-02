import { campaignMotion } from './campaignPresentation.js';

// Public, already-settled state supplies scenery progress. No choice index,
// target picture, private key or motion can judge or reveal an answer here.
export function projectCampaignScene(beat, state = {}, feedback = null) {
  const view = beat?.view || {};
  let total = 1, progress = state.done ? 1 : 0;
  if (['word_forge', 'sentence_build'].includes(beat?.mechanic)) {
    total = view.workshop?.mode === 'replace' ? 1 : Math.max(1, view.slots || 1);
    progress = view.workshop?.mode === 'replace' ? Number(Boolean(state.done))
      : Array.isArray(state.placed) ? state.placed.length : 0;
  } else if (beat?.mechanic === 'sound_sort') {
    total = Math.max(1, view.items?.length || 1);
    // A held completed sort item has its previous itemIndex. The receipt map
    // remains authoritative across that held frame and partial restoration.
    progress = Math.max(Number(state.itemIndex) || 0,
      state.placed && !Array.isArray(state.placed) ? Object.keys(state.placed).length : 0);
  } else if (beat?.mechanic === 'sound_signpost') {
    total = Math.max(1, view.cards?.length || 1);
    progress = state.done ? total : state.cardsHeard?.length || 0;
  }
  progress = Math.max(0, Math.min(total, progress));
  const motion = campaignMotion(beat, state, feedback);
  const basketCounts = (view.bins || []).map(bin => Object.values(state.placed || {}).filter(id => id === bin.id).length);
  const arrivalBasket = motion.accepted && feedback?.action?.binId
    ? Math.max(0, (view.bins || []).findIndex(bin => bin.id === feedback.action.binId)) : 0;
  return { total, progress, fraction: progress / total, accepted: motion.accepted,
    key: `${beat?.id || 'scene'}:${progress}:${motion.key}`, paused: Boolean(state.paused), basketCounts, arrivalBasket };
}
