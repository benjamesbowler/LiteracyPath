// Lightweight child-navigation registry. Both the shell and its build-time
// audio projection use these exact labels without loading the full catalogue.
// Home cards and the corresponding bottom tabs share the same object art.
// The Home tab keeps its house glyph so it is distinct from My Hollow's tree.
export const STUDENT_NAVIGATION_ART = Object.freeze({
  map: "/images/navigation/ui/map-icon.webp",
  books: "/images/navigation/ui/books-icon.webp",
  stories: "/images/navigation/ui/story-icon.webp",
  arcade: "/images/navigation/ui/arcade-icon.webp",
  phonics: "/images/navigation/ui/letters-icon.webp",
  words: "/images/navigation/ui/words-icon.webp",
  sounds: "/images/navigation/ui/sounds-icon.webp",
  skills: "/images/navigation/ui/map-icon.webp",
  hollow: "/images/navigation/ui/hollow-icon.webp"
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
