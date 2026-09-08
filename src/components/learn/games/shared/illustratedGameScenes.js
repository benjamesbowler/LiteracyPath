export const ILLUSTRATED_GAME_SCENES = Object.freeze({
  build: {
    id: "cvc-word-builder",
    src: "/images/learn-games/art/cvc-word-builder.webp",
    width: 1133,
    height: 760
  },
  memory: {
    id: "sight-word-memory",
    src: "/images/learn-games/art/sight-word-memory.webp",
    width: 1133,
    height: 760
  },
  family: {
    id: "blend-and-build",
    src: "/images/learn-games/art/blend-and-build.webp",
    width: 1133,
    height: 760
  },
  target: {
    id: "pop-the-word",
    src: "/images/learn-games/art/pop-the-word.webp",
    width: 1133,
    height: 760
  },
  sentence: {
    id: "word-hopscotch",
    src: "/images/learn-games/art/word-hopscotch.webp",
    width: 1133,
    height: 760
  },
  quiz: {
    id: "reading-race",
    src: "/images/learn-games/art/reading-race.webp",
    width: 1133,
    height: 760
  },
  rescue: {
    id: "word-rescue",
    // The live bridge and destination are the rescue action; avoid promising
    // a decorative helicopter interaction that the child cannot control.
    src: "/images/backdrops/activity-bg-meadow.webp",
    width: 1920,
    height: 1080
  },
  sort: {
    id: "sound-sort-factory",
    src: "/images/learn-games/art/sound-sort-factory.webp",
    width: 640,
    height: 640
  },
  garden: {
    id: "letter-garden",
    // The old garden card carried giant decorative ABC letters, which competed
    // with the live word-change instruction. This authored meadow scene keeps
    // the garden world while leaving all instructional lettering to the stage.
    src: "/images/backdrops/activity-bg-meadow.webp",
    width: 1920,
    height: 1080
  }
});

export const ILLUSTRATED_GAME_IDS = Object.freeze(
  Object.values(ILLUSTRATED_GAME_SCENES).map(scene => scene.id)
);
