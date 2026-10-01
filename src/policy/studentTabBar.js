// Lightweight child-navigation registry. Both the shell and its build-time
// audio projection use these exact labels without loading the full catalogue.
// Home cards and the corresponding bottom tabs share the same object art.
// The Home tab keeps its house glyph so it is distinct from My Hollow's tree.
export const STUDENT_NAVIGATION_ART = Object.freeze({
  map: "/images/navigation/map-icon.webp",
  books: "/images/navigation/books-icon.webp",
  stories: "/images/navigation/story-icon.webp",
  arcade: "/images/navigation/arcade-icon.webp",
  phonics: "/images/navigation/letters-icon.webp",
  words: "/images/navigation/words-icon.webp",
  sounds: "/images/navigation/sounds-icon.webp",
  hollow: "/images/navigation/hollow-icon.webp"
});

export const STUDENT_RAIL_HOME = Object.freeze({
  id: "home",
  label: "Home",
  icon: "home",
  tab: "home"
});

export const STUDENT_RAIL_DESTINATIONS = Object.freeze([
  Object.freeze({ id: "sounds", label: "Sound Seekers", icon: "sound", tab: "sounds" }),
  Object.freeze({ id: "phonics", label: "Phonics", icon: "phonics", tab: "sounds" }),
  Object.freeze({ id: "words", label: "Words", icon: "words", tab: "sounds" }),
  Object.freeze({ id: "map", label: "Adventure Map", icon: "map", tab: "sounds" }),
  Object.freeze({ id: "books", label: "Books", icon: "book", tab: "books" }),
  Object.freeze({ id: "stories", label: "Story Quests", icon: "story", tab: "books" }),
  Object.freeze({ id: "arcade", label: "Arcade", icon: "arcade", tab: "games" }),
  Object.freeze({ id: "hollow", label: "My Hollow", icon: "hollow", tab: "hollow" })
]);

export const STUDENT_TAB_BAR = Object.freeze([
  Object.freeze({ id: "home", label: "Home", icon: "home" }),
  Object.freeze({ id: "sounds", label: "Sounds", icon: "soundWaves" }),
  Object.freeze({ id: "books", label: "Books", icon: "book" }),
  Object.freeze({ id: "games", label: "Games", icon: "arcade" }),
  Object.freeze({ id: "hollow", label: "Hollow", icon: "hollow" })
]);
