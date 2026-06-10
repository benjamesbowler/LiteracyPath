import { lazyWithRetry } from "../../../../utils/lazyWithRetry.js";

export const LEARN_GAMES = {
  "cvc-word-builder": lazyWithRetry(() => import("./CVCWordBuilder.jsx")),
  "sight-word-memory": lazyWithRetry(() => import("./SightWordMemory.jsx")),
  "sound-slide": lazyWithRetry(() => import("./SoundSlide.jsx")),
  "blend-and-build": lazyWithRetry(() => import("./BlendAndBuild.jsx")),
  "rhyme-time": lazyWithRetry(() => import("./RhymeTime.jsx")),
  "sight-word-fishing": lazyWithRetry(() => import("./SightWordFishing.jsx")),
  "cvc-train": lazyWithRetry(() => import("./CVCTrain.jsx")),
  "pop-the-word": lazyWithRetry(() => import("./PopTheWord.jsx")),
  "word-hopscotch": lazyWithRetry(() => import("./WordHopscotch.jsx")),
  "reading-race": lazyWithRetry(() => import("./ReadingRace.jsx"))
};
