import type { GameProps } from './types';
import type { ComponentType } from 'react';
import CVCWordBuilder from './CVCWordBuilder';
import SightWordMemory from './SightWordMemory';
import SoundSlide from './SoundSlide';
import BlendAndBuild from './BlendAndBuild';
import RhymeTime from './RhymeTime';
import SightWordFishing from './SightWordFishing';
import CVCTrain from './CVCTrain';
import PopTheWord from './PopTheWord';
import WordHopscotch from './WordHopscotch';
import ReadingRace from './ReadingRace';

export interface GameEntry {
  component: ComponentType<GameProps>;
  title: string;
}

export const GAMES_MAP: Record<string, GameEntry> = {
  'cvc-word-builder': { component: CVCWordBuilder, title: 'CVC Word Builder' },
  'sight-word-memory': { component: SightWordMemory, title: 'Sight Word Memory' },
  'sound-slide': { component: SoundSlide, title: 'Sound Slide' },
  'blend-build': { component: BlendAndBuild, title: 'Blend & Build' },
  'rhyme-time': { component: RhymeTime, title: 'Rhyme Time' },
  'sight-word-fishing': { component: SightWordFishing, title: 'Sight Word Fishing' },
  'cvc-train': { component: CVCTrain, title: 'CVC Train' },
  'pop-the-word': { component: PopTheWord, title: 'Pop the Word' },
  'word-hopscotch': { component: WordHopscotch, title: 'Word Hopscotch' },
  'reading-race': { component: ReadingRace, title: 'Reading Race' },
};

export { default as CVCWordBuilder } from './CVCWordBuilder';
export { default as SightWordMemory } from './SightWordMemory';
export { default as SoundSlide } from './SoundSlide';
export { default as BlendAndBuild } from './BlendAndBuild';
export { default as RhymeTime } from './RhymeTime';
export { default as SightWordFishing } from './SightWordFishing';
export { default as CVCTrain } from './CVCTrain';
export { default as PopTheWord } from './PopTheWord';
export { default as WordHopscotch } from './WordHopscotch';
export { default as ReadingRace } from './ReadingRace';
export type { GameProps };
