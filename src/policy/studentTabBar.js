// Lightweight child-shell registry. Audio and reduced-choice helpers live in
// studentRailPolicy and load only after a signed-in child opens that shell.
export const STUDENT_TAB_BAR = Object.freeze([
  Object.freeze({ id: "home", label: "Home", icon: "home" }),
  Object.freeze({ id: "sounds", label: "Sounds", icon: "soundWaves" }),
  Object.freeze({ id: "books", label: "Books", icon: "book" }),
  Object.freeze({ id: "games", label: "Games", icon: "arcade" }),
  Object.freeze({ id: "hollow", label: "Hollow", icon: "hollow" })
]);
