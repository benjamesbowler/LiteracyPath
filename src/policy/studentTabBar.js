// Lightweight child-navigation registry. Both the shell and its build-time
// audio projection use these exact labels without loading the full catalogue.
export const STUDENT_RAIL_HOME = Object.freeze({
  id: "home",
  label: "Home",
  icon: "home",
  tab: "home"
});

export const STUDENT_RAIL_DESTINATIONS = Object.freeze([
  Object.freeze({ id: "sounds", label: "Sound Seekers", icon: "sound", tab: "sounds" }),
  Object.freeze({ id: "phonics", label: "Phonics", icon: "phonics", tab: "sounds" }),
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
