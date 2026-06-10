import { lazy } from "react";

export const LEARN_GAMES = {
  "cvc-word-builder": lazy(() => import("./CVCWordBuilder.jsx")),
  "sight-word-memory": lazy(() => import("./SightWordMemory.jsx")),
  "sound-slide": lazy(() => import("./SoundSlide.jsx")),
  "blend-and-build": lazy(() => import("./BlendAndBuild.jsx")),
  "rhyme-time": lazy(() => import("./RhymeTime.jsx")),
  "sight-word-fishing": lazy(() => import("./SightWordFishing.jsx")),
  "cvc-train": lazy(() => import("./CVCTrain.jsx")),
  "pop-the-word": lazy(() => import("./PopTheWord.jsx")),
  "word-hopscotch": lazy(() => import("./WordHopscotch.jsx")),
  "reading-race": lazy(() => import("./ReadingRace.jsx"))
};
