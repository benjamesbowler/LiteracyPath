import { elSkillsBlockCycles } from '../../../data/elSkillsBlockCycles.js';
import { getLedaInstructionAudioPath } from '../../../data/ledaProductionAudio.js';
import { AUDIO_QUEST_PATHS } from '../../../data/generated/audioQuestPaths.generated.js';
import { ARCADE_JOURNEYS, completedArcadeChapters } from '../../../utils/arcadeJourneys.js';

const SKILL_GAMES = Object.freeze({
  spoken_syllable_counting: ['drum-trail'],
  syllables: ['drum-trail'],
  sentence_comprehension: ['lantern-lagoon'],
  initial_sounds: ['rocket-run', 'sound-racer', 'word-climb'],
  written_prefix: ['sound-sort-factory'],
  written_grapheme_sorting: ['sound-sort-factory'],
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

const HIGH_FREQUENCY_GAMES = ['pop-the-word', 'sight-word-memory'];

function cyclePracticeCandidates(cycle) {
  if (!cycle) return [];
  switch (cycle.phase) {
    case 'early-letter-sound':
    case 'letter-sound-expansion':
    case 'cvc-onset':
    case 'letter-sound-completion':
      return SKILL_GAMES.initial_sounds;
    case 'cvc-rime':
      return SKILL_GAMES.word_families;
    case 'digraphs':
      return SKILL_GAMES.written_prefix;
    case 'patterns':
      return cycle.focusLetters.some(({ grapheme }) => grapheme === 'ing')
        ? SKILL_GAMES.word_families : ['letter-garden', 'cvc-word-builder'];
    case 'microphase-wrap-up':
    case 'pattern-power':
      return cycle.highFrequencyWords.length ? HIGH_FREQUENCY_GAMES : [];
    default:
      return [];
  }
}

export const ARCADE_RECOMMENDATION_COPY = Object.freeze({
  teacher: 'Your teacher chose this game.',
  earlyCycle: 'Try a beginning-sound game for this cycle.',
  laterCycle: 'Try a word game for your reading practice.',
  saved: 'Keep going from your saved place.',
  replay: 'You have played these games. Try this one again.',
  explore: 'Try a game you have not played yet.'
});
export const arcadeSkillReason = skill => `Practise: ${String(skill).toLowerCase()}.`;
export function arcadeRecommendationAudioPath(reason) {
  const path = getLedaInstructionAudioPath(reason);
  return AUDIO_QUEST_PATHS.has(path) ? path : "";
}
export function arcadeRecommendationAudioTexts(games) {
  const focusedIds = new Set([...Object.values(SKILL_GAMES).flat(), ...HIGH_FREQUENCY_GAMES]);
  return [...new Set([...Object.values(ARCADE_RECOMMENDATION_COPY),
    ...games.filter(game => focusedIds.has(game.id) && game.recommendationReasonAudio !== 'text-only').map(game => arcadeSkillReason(game.skill))])];
}

function hasCheckpoint(record, difficulty) {
  return Boolean(record?.checkpoints?.[difficulty]);
}

const hasPlayed = record => Boolean(record?.plays > 0 || record?.stars > 0 || record?.lastPlayedAt);

/** Recommend a relevant practice construct, without claiming code placement or mastery. */
export function arcadeRecommendation({ games = [], progress = {}, recommendedSkill = '', currentCycleId = '', assignedGameId = '' } = {}) {
  const available = ids => ids.map(id => games.find(game => game.id === id)).filter(Boolean);
  const difficulty = progress.difficulty || 'easy';
  const recordFor = game => progress.games?.[game?.id];
  const hasResume = game => hasCheckpoint(recordFor(game), difficulty);
  const unfinished = game => !ARCADE_JOURNEYS[game.id]
    || completedArcadeChapters(recordFor(game), difficulty).length < ARCADE_JOURNEYS[game.id].chapterCount;
  const choose = candidates => candidates.find(hasResume) || [...candidates].sort((a, b) =>
    Number(unfinished(b)) - Number(unfinished(a))
    || Number(hasPlayed(recordFor(a))) - Number(hasPlayed(recordFor(b)))
    || String(recordFor(a)?.lastPlayedAt || '').localeCompare(String(recordFor(b)?.lastPlayedAt || ''))
  )[0];
  const assigned = games.find(game => game.id === assignedGameId);
  if (assigned) return { game: assigned, reason: ARCADE_RECOMMENDATION_COPY.teacher, basis: 'teacher' };
  const skill = String(recommendedSkill || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const skillIds = skill.startsWith('hfw_') || skill.includes('high_frequency')
    ? HIGH_FREQUENCY_GAMES : SKILL_GAMES[skill] || [];
  const relevant = choose(available(skillIds));
  if (relevant) return { game: relevant, reason: arcadeSkillReason(relevant.skill), basis: 'skill' };
  const cycle = elSkillsBlockCycles.find(row => row.id === currentCycleId && Number.isInteger(row.cycleNumber));
  const cycleGame = choose(available(cyclePracticeCandidates(cycle)));
  if (cycleGame) return { game: cycleGame, reason: arcadeSkillReason(cycleGame.skill), basis: 'cycle' };
  const game = choose(games);
  return { game, reason: hasResume(game)
    ? ARCADE_RECOMMENDATION_COPY.saved : hasPlayed(recordFor(game))
      ? ARCADE_RECOMMENDATION_COPY.replay : ARCADE_RECOMMENDATION_COPY.explore, basis: 'exploration' };
}
