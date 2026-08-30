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
    src: "/images/learn-games/art/word-rescue.webp",
    width: 640,
    height: 640
  },
  sort: {
    id: "sound-sort-factory",
    src: "/images/learn-games/art/sound-sort-factory.webp",
    width: 640,
    height: 640
  },
  garden: {
    id: "letter-garden",
    src: "/images/learn-games/art/letter-garden.webp",
    width: 640,
    height: 640
  }
});

export const ILLUSTRATED_GAME_IDS = Object.freeze(
  Object.values(ILLUSTRATED_GAME_SCENES).map(scene => scene.id)
);
