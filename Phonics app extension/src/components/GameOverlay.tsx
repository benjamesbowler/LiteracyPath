import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GAMES_MAP } from '@/games';
import { getDifficulty } from '@/lib/progress';
import { speak, cancelSpeech } from '@/lib/speech';

interface GameOverlayProps {
  isOpen: boolean;
  gameId: string | null;
  onClose: () => void;
  isSoundEnabled: boolean;
}

export default function GameOverlay({ isOpen, gameId, onClose, isSoundEnabled }: GameOverlayProps) {
  const [score, setScore] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const game = gameId ? GAMES_MAP[gameId] : null;
  const GameComponent = game?.component;

  const handleScoreUpdate = useCallback((s: number) => {
    setScore(s);
  }, []);

  const handleComplete = useCallback(() => {
    // Completion handled by game
  }, []);

  const handleClose = () => {
    setShowConfirm(true);
  };

  const confirmQuit = () => {
    setShowConfirm(false);
    setScore(0);
    cancelSpeech();
    onClose();
  };

  const keepPlaying = () => {
    setShowConfirm(false);
  };

  const difficulty = getDifficulty();

  return (
    <AnimatePresence>
      {isOpen && GameComponent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-overlay-bg flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="h-[60px] px-6 flex items-center justify-between bg-[rgba(0,85,85,0.5)] border-b-2 border-white/10 shrink-0">
            <h2 className="font-display text-[36px] leading-tight text-white">
              {game?.title ?? 'Game'}
            </h2>
            <div className="flex items-center gap-6">
              <span className="font-display text-[40px] leading-none text-white">
                {score}
              </span>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Close game"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Game Board */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex-1 overflow-auto p-8"
          >
            <GameComponent
              difficulty={difficulty}
              onScoreUpdate={handleScoreUpdate}
              onComplete={handleComplete}
              isSoundEnabled={isSoundEnabled}
            />
          </motion.div>

          {/* Phinny Helper */}
          <button
            onClick={() => {
              if (isSoundEnabled) {
                speak(`Play ${game?.title ?? 'the game'}. Follow the instructions on screen!`);
              }
            }}
            className="absolute bottom-4 left-4 w-20 h-20 z-10 hover:scale-110 transition-transform"
            aria-label="Replay instructions"
          >
            <img
              src="/phinny-waving.png"
              alt="Phinny helper"
              className="w-full h-full object-contain"
            />
          </button>

          {/* Quit Confirmation */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="bg-soft-cream rounded-3xl p-8 max-w-sm w-full text-center shadow-xl"
                >
                  <p className="font-body text-[18px] text-dark-text mb-6">
                    Are you sure you want to quit? Your progress will be saved!
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={keepPlaying}
                      className="px-6 py-3 bg-coral text-white rounded-full font-body font-bold text-[16px] shadow-button hover:shadow-button-hover hover:scale-105 transition-all"
                    >
                      Keep Playing
                    </button>
                    <button
                      onClick={confirmQuit}
                      className="px-6 py-3 border-2 border-ocean-teal text-ocean-teal rounded-full font-body font-bold text-[16px] hover:bg-ocean-teal hover:text-white transition-all"
                    >
                      Quit
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
