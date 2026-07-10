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
  "letter-garden": lazyWithRetry(() => import("./LetterGarden.jsx")),
  "rocket-run": lazyWithRetry(() => import("./RocketRunGame.jsx")),
  "letter-leap": lazyWithRetry(() => import("./LetterLeapGame.jsx")),
  "word-climb": lazyWithRetry(() => import("./WordClimbGame.jsx")),
  "sound-racer": lazyWithRetry(() => import("./SoundRacerGame.jsx")),
  "word-bridge": lazyWithRetry(() => import("./WordBridgeGame.jsx")),
  "sound-beat": lazyWithRetry(() => import("./SoundBeatGame.jsx")),
  "rhyme-pop": lazyWithRetry(() => import("./RhymePopGame.jsx")),
  "sound-safari": lazyWithRetry(() => import("./SoundSafariGame.jsx")),
  "reel-read": lazyWithRetry(() => import("./ReelReadGame.jsx")),
  "star-gallery": lazyWithRetry(() => import("./StarGalleryGame.jsx")),
  "sentence-express": lazyWithRetry(() => import("./SentenceExpressArcade.jsx"))
};
