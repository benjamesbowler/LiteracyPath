export interface GameProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onScoreUpdate: (score: number) => void;
  onComplete: (stars: number) => void;
  isSoundEnabled: boolean;
}
