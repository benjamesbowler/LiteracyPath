import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  trigger: boolean;
}

export default function ConfettiCelebration({ trigger }: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!trigger) return;
    const colors = ['#FF7F50', '#FFC857', '#008080', '#FFFFFF'];
    
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      colors,
    };

    confetti({ ...defaults, particleCount: 50, scalar: 1.2, shapes: ['circle', 'square'] as const });
    
    const interval = setInterval(() => {
      confetti({ ...defaults, particleCount: 15, scalar: 0.8, shapes: ['circle'] as const });
    }, 400);

    setTimeout(() => clearInterval(interval), 2500);

    return () => clearInterval(interval);
  }, [trigger]);

  return null;
}
