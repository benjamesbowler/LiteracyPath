import { elSkillsBlockCycles } from '../data/elSkillsBlockCycles.js';
import { ALL_HFW_WORD_SET } from '../data/highFrequencyWordBands.js';
import { FRY_WORD_FREQUENCY } from '../data/fryWordFrequency.js';

export const WORD_MATCH_VERSION = 'word-match-cycles-v1';
export const WORD_MATCH_PAIRS = 4;
const wordForm = word => word.toLowerCase() === 'i' ? 'I' : word.toLowerCase();
export const normalizeWordMatchBoard = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;

// The cycle curriculum owns introduction order. Frequency only orders the
// remaining reviewed words after every cycle word has been introduced.
const introduced = new Set();
export const WORD_MATCH_WORDS = Object.freeze([
  ...elSkillsBlockCycles.filter(cycle => cycle.type === 'cycle')
    .sort((a, b) => a.cycleNumber - b.cycleNumber)
    .flatMap(cycle => cycle.highFrequencyWords.map(word => ({ word: wordForm(word), cycle: cycle.cycleNumber }))),
  ...FRY_WORD_FREQUENCY.filter(word => ALL_HFW_WORD_SET.has(word))
    .map(word => ({ word: wordForm(word), cycle: null }))
].filter(({ word }) => {
  if (introduced.has(word)) return false;
  introduced.add(word);
  return true;
}).map(Object.freeze));

export const WORD_MATCH_BOARD_COUNT = Math.ceil(WORD_MATCH_WORDS.length / WORD_MATCH_PAIRS);
export const WORD_MATCH_EXTENSION_START = Math.ceil(WORD_MATCH_WORDS.filter(item => item.cycle).length / WORD_MATCH_PAIRS);

export function completedWordMatchCycles(progress = {}) {
  return elSkillsBlockCycles.filter(cycle => cycle.type === 'cycle')
    .every(cycle => progress.cycles?.[cycle.id]?.stars > 0);
}

export function adventureWordMatchOptions(progress = {}) {
  if (!completedWordMatchCycles(progress)) return {};
  return { wordMatchStartBoard: Math.max(WORD_MATCH_EXTENSION_START, normalizeWordMatchBoard(progress.cycles?.['cycle-27']?.wordMatchNextBoard)) };
}

export function wordMatchBoardWords(boardIndex = 0) {
  const index = normalizeWordMatchBoard(boardIndex) % WORD_MATCH_BOARD_COUNT;
  const words = WORD_MATCH_WORDS.slice(index * WORD_MATCH_PAIRS, (index + 1) * WORD_MATCH_PAIRS);
  // The final board reviews earlier words to keep four distinct pairs.
  for (let back = index * WORD_MATCH_PAIRS - 1; words.length < WORD_MATCH_PAIRS; back -= 1) {
    words.push(WORD_MATCH_WORDS[back]);
  }
  return words;
}

export function nextWordMatchBoard(progress = {}) {
  const completed = new Map();
  for (const event of progress.games?.['sight-word-memory']?.practiceRecord?.completions || []) {
    for (const step of event.steps || []) {
      const match = String(step.round || '').match(/^word-match-cycles-v1:(\d+):(\d+)$/);
      if (!match) continue;
      const board = Number(match[1]), pair = Number(match[2]);
      if (!Number.isSafeInteger(board)) continue;
      if (pair >= WORD_MATCH_PAIRS || step.target !== wordMatchBoardWords(board)[pair]?.word) continue;
      if (!completed.has(board)) completed.set(board, new Set());
      completed.get(board).add(pair);
    }
  }
  // A replay is idempotent, and out-of-order synced receipts cannot skip a gap.
  let board = 0;
  while (completed.get(board)?.size === WORD_MATCH_PAIRS) board += 1;
  return board;
}

export function replayWordMatchBoard(evidence, fallback = 0) {
  const boards = (evidence?.firstResponses || []).flatMap(step => {
    const match = String(step.round || '').match(/^word-match-cycles-v1:(\d+):[0-3]$/);
    return match && Number.isSafeInteger(Number(match[1])) ? [Number(match[1])] : [];
  });
  return boards.length ? Math.min(...boards) : fallback;
}
