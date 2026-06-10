import { useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import Hero from '@/sections/Hero';
import GamesHub from '@/sections/GamesHub';
import HowItWorks from '@/sections/HowItWorks';
import LearningProgress from '@/sections/LearningProgress';
import ForTeachers from '@/sections/ForTeachers';
import GameOverlay from '@/components/GameOverlay';
import { isSoundEnabled } from '@/lib/progress';

export default function Home() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleScrollTo = useCallback((id: string) => {
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleSoundToggle = useCallback((enabled: boolean) => {
    setSoundOn(enabled);
  }, []);

  return (
    <>
      <Layout onScrollTo={handleScrollTo} onSoundToggle={handleSoundToggle}>
        <Hero onScrollTo={handleScrollTo} />
        <GamesHub
          onLaunchGame={setActiveGame}
          isSoundEnabled={soundOn}
        />
        <HowItWorks />
        <LearningProgress />
        <ForTeachers onScrollTo={handleScrollTo} />
      </Layout>

      <GameOverlay
        isOpen={activeGame !== null}
        gameId={activeGame}
        onClose={() => setActiveGame(null)}
        isSoundEnabled={soundOn}
      />
    </>
  );
}
