import { lazyWithRetry } from "../../../../utils/lazyWithRetry.js";

export const LEARN_GAMES = {
  "cvc-word-builder": lazyWithRetry(() => import("./CVCWordBuilder.jsx")),
  "sight-word-memory": lazyWithRetry(() => import("./SightWordMemory.jsx")),
  "blend-and-build": lazyWithRetry(() => import("./BlendAndBuild.jsx")),
  "pop-the-word": lazyWithRetry(() => import("./PopTheWord.jsx")),
  "word-hopscotch": lazyWithRetry(() => import("./WordHopscotch.jsx")),
  "reading-race": lazyWithRetry(() => import("./ReadingRace.jsx")),
  "word-rescue": lazyWithRetry(() => import("./WordRescue.jsx")),
  "sound-sort-factory": lazyWithRetry(() => import("./SoundSortFactory.jsx")),
  "letter-garden": lazyWithRetry(() => import("./LetterGarden.jsx"))
};
