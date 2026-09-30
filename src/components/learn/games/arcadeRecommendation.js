import { elSkillsBlockCycles } from '../../../data/elSkillsBlockCycles.js';

const SKILL_GAMES = Object.freeze({
  initial_sounds: ['rocket-run', 'sound-racer', 'word-climb', 'sound-sort-factory'],
  rhyming: ['rhyme-pop'],
  cvc_short_vowels: ['letter-leap', 'cvc-word-builder', 'letter-garden'],
  short_vowel_discrimination: ['letter-leap', 'cvc-word-builder'],
  phoneme_segmentation: ['sound-safari', 'soundkeys'],
  phoneme_blending: ['soundkeys', 'sound-beat'],
  spelling: ['letter-leap', 'letter-garden', 'cvc-word-builder'],
  word_families: ['blend-and-build', 'word-bridge'],
  sentence_order: ['sentence-express', 'word-hopscotch'],
  punctuation: ['sentence-express', 'reading-race', 'star-gallery']
});

export const ARCADE_RECOMMENDATION_COPY = Object.freeze({
  teacher: 'Your teacher chose this game.',
  earlyCycle: 'Try a beginning-sound game for this cycle.',
  laterCycle: 'Try a word game for your reading practice.',
  saved: 'Keep going from your saved place.',
  replay: 'You have played these games. Try this one again.',
  explore: 'Try a game you have not played yet.'
});
export const arcadeSkillReason = skill => `Practise: ${String(skill).toLowerCase()}.`;
export function arcadeRecommendationAudioTexts(games) {
  const focusedIds = new Set([...Object.values(SKILL_GAMES).flat(), 'pop-the-word', 'sight-word-memory']);
  return [...new Set([...Object.values(ARCADE_RECOMMENDATION_COPY),
    ...games.filter(game => focusedIds.has(game.id)).map(game => arcadeSkillReason(game.skill))])];
}

function hasCheckpoint(record, difficulty) {
  return Boolean(record?.checkpoints?.[difficulty]);
}

/** Recommend a relevant practice construct, without claiming code placement or mastery. */
export function arcadeRecommendation({ games = [], progress = {}, recommendedSkill = '', currentCycleId = '', assignedGameId = '' } = {}) {
  const available = ids => ids.map(id => games.find(game => game.id === id)).filter(Boolean);
  const choose = candidates => candidates.find(game => hasCheckpoint(progress.games?.[game.id], progress.difficulty))
    || candidates.find(game => !(progress.games?.[game.id]?.stars > 0)) || candidates[0];
  const assigned = games.find(game => game.id === assignedGameId);
  if (assigned) return { game: assigned, reason: ARCADE_RECOMMENDATION_COPY.teacher, basis: 'teacher' };
  const skill = String(recommendedSkill || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const skillIds = skill.startsWith('hfw_') || skill.includes('high_frequency')
    ? ['pop-the-word', 'sight-word-memory'] : SKILL_GAMES[skill] || [];
  const relevant = choose(available(skillIds));
  if (relevant) return { game: relevant, reason: arcadeSkillReason(relevant.skill), basis: 'skill' };
  const cycle = elSkillsBlockCycles.find(row => row.id === currentCycleId && Number.isInteger(row.cycleNumber));
  const cycleGame = cycle ? choose(available(cycle.cycleNumber <= 24
    ? ['rocket-run', 'sound-racer', 'sound-sort-factory', 'word-climb']
    : ['word-rescue', 'sentence-express', 'word-hopscotch', 'reading-race'])) : null;
  if (cycleGame) return { game: cycleGame, reason: cycle.cycleNumber <= 24
    ? ARCADE_RECOMMENDATION_COPY.earlyCycle : ARCADE_RECOMMENDATION_COPY.laterCycle, basis: 'cycle' };
  const game = choose(games);
  return { game, reason: hasCheckpoint(progress.games?.[game?.id], progress.difficulty)
    ? ARCADE_RECOMMENDATION_COPY.saved : progress.games?.[game?.id]?.stars > 0
      ? ARCADE_RECOMMENDATION_COPY.replay : ARCADE_RECOMMENDATION_COPY.explore, basis: 'exploration' };
}
