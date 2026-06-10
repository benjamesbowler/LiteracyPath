const PROGRESS_KEY = 'phonics-progress';
const DIFFICULTY_KEY = 'phonics-difficulty';
const SOUND_KEY = 'phonics-sound-enabled';

export interface GameProgressEntry {
  stars: 0 | 1 | 2 | 3;
  highScore: number;
  wordsCompleted: string[];
}

export interface GameProgress {
  [gameId: string]: GameProgressEntry;
}

export function getProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveProgress(
  gameId: string,
  stars: 0 | 1 | 2 | 3,
  score: number,
  wordsCompleted: string[]
): void {
  const progress = getProgress();
  const existing = progress[gameId];
  progress[gameId] = {
    stars: Math.max(stars, existing?.stars ?? 0) as 0 | 1 | 2 | 3,
    highScore: Math.max(score, existing?.highScore ?? 0),
    wordsCompleted: [
      ...new Set([...(existing?.wordsCompleted ?? []), ...wordsCompleted]),
    ],
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getDifficulty(): 'easy' | 'medium' | 'hard' {
  const val = localStorage.getItem(DIFFICULTY_KEY);
  if (val === 'easy' || val === 'medium' || val === 'hard') return val;
  return 'easy';
}

export function saveDifficulty(diff: 'easy' | 'medium' | 'hard'): void {
  localStorage.setItem(DIFFICULTY_KEY, diff);
}

export function isSoundEnabled(): boolean {
  const val = localStorage.getItem(SOUND_KEY);
  return val !== 'false';
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(SOUND_KEY, String(enabled));
}

export function getTotalStars(): number {
  const progress = getProgress();
  return Object.values(progress).reduce((sum, entry) => sum + (entry.stars ?? 0), 0);
}

export function getGameStars(gameId: string): 0 | 1 | 2 | 3 {
  const progress = getProgress();
  return (progress[gameId]?.stars ?? 0) as 0 | 1 | 2 | 3;
}
