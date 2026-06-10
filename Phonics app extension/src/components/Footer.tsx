import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, getDifficulty, saveDifficulty } from '@/lib/progress';
import HeroWave from './HeroWave';

interface FooterProps {
  onScrollTo?: (id: string) => void;
}

export default function Footer({ onScrollTo }: FooterProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [difficulty, setDifficulty] = useState(getDifficulty());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const setDiff = (d: 'easy' | 'medium' | 'hard') => {
    setDifficulty(d);
    saveDifficulty(d);
  };

  return (
    <footer className="relative bg-deep-teal pt-20 pb-6 px-6">
      {/* Wave Top Border */}
      <div className="absolute top-[-60px] left-0 right-0 h-[80px]">
        <HeroWave fill="#005555" className="w-full h-full" />
      </div>
      {/* Coral accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-coral" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Column 1 - Brand */}
        <div className="relative">
          <div className="font-display text-[20px] text-white">Phonics Fun House</div>
          <p className="mt-2 text-white/70 font-body text-[14px]">
            Making reading fun, one game at a time.
          </p>
          {/* Phinny peeking */}
          <img
            src="/phinny-cat.png"
            alt="Phinny"
            className="absolute -bottom-12 left-0 w-20 h-20 object-contain hidden lg:block"
            loading="lazy"
          />
        </div>

        {/* Column 2 - Quick Links */}
        <div>
          <h4 className="font-body font-bold text-[14px] text-white mb-3">Quick Links</h4>
          <ul className="space-y-2">
            {['Games', 'How It Works', 'For Teachers', 'Progress'].map((label) => (
              <li key={label}>
                <button
                  onClick={() => onScrollTo?.(label.toLowerCase().replace(/ /g, '-'))}
                  className="font-body text-[14px] text-white/80 hover:text-white hover:underline transition-all"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 - Learning Levels */}
        <div>
          <h4 className="font-body font-bold text-[14px] text-white mb-3">Learning Levels</h4>
          <ul className="space-y-2">
            {['CVC Words', 'Sight Words', 'Blending', 'Reading'].map((label) => (
              <li key={label}>
                <span className="font-body text-[14px] text-white/80">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4 - Settings */}
        <div>
          <h4 className="font-body font-bold text-[14px] text-white mb-3">Settings</h4>
          <div className="space-y-3">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="flex items-center gap-2 font-body text-[14px] text-white/80 hover:text-white transition-colors"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Sound: {soundOn ? 'On' : 'Off'}
            </button>

            {/* Difficulty */}
            <div>
              <span className="font-body text-[14px] text-white/80 block mb-1">Level:</span>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiff(d)}
                    className={`
                      px-3 py-1 rounded-full text-[12px] font-body font-bold capitalize
                      transition-colors duration-200
                      ${difficulty === d ? 'bg-coral text-white' : 'bg-white/20 text-white hover:bg-white/30'}
                    `}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1 space-y-1">
              <button className="block font-body text-[14px] text-white/80 hover:text-white hover:underline">
                Parent Guide
              </button>
              <button className="block font-body text-[14px] text-white/80 hover:text-white hover:underline">
                FAQ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1200px] mx-auto mt-12 pt-6 border-t border-white/15 text-center">
        <p className="font-body text-[12px] text-white/50">
          &copy; 2025 Phonics Fun House. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
