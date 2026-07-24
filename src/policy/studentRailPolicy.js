export const STUDENT_RAIL_HOME = Object.freeze({
  id: "home",
  label: "Home",
  icon: "home"
});

export const STUDENT_RAIL_ICON_PATHS = Object.freeze({
  home: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z",
  sound: "M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6",
  phonics: "M5 19V6a2 2 0 0 1 2-2h10M7 19h11M9 15h6M9 11h6",
  map: "M9 4 3 7v13l6-3 6 3 6-3V4l-6 3z M9 4v13 M15 7v13",
  book: "M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z M8 3v18",
  story: "m12 4 2 4.2 4.6.6-3.4 3.2.9 4.6L12 14.4l-4.1 2.2.9-4.6L5.4 8.8 10 8.2Z",
  arcade: "M3 8h18v9H3z M7 12h2M17 12h.01M8 11v2",
  hollow: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
});

export const STUDENT_RAIL_DESTINATIONS = Object.freeze([
  Object.freeze({ id: "sounds", label: "Sound Seekers", icon: "sound" }),
  Object.freeze({ id: "phonics", label: "Phonics", icon: "phonics" }),
  Object.freeze({ id: "map", label: "Adventure Map", icon: "map" }),
  Object.freeze({ id: "books", label: "Books", icon: "book" }),
  Object.freeze({ id: "stories", label: "Story Quests", icon: "story" }),
  Object.freeze({ id: "arcade", label: "Arcade", icon: "arcade" }),
  Object.freeze({ id: "hollow", label: "My Hollow", icon: "hollow" })
]);

export const REDUCED_CHOICE_RAIL_IDS = Object.freeze([
  "sounds",
  "phonics",
  "books"
]);

export function selectStudentRailItems(
  nav = [],
  { active = "home", reducedChoiceMode = false } = {}
) {
  const available = nav.filter(item => item?.go || item?.id === active);
  if (!reducedChoiceMode) return available;
  const reducedIds = new Set(REDUCED_CHOICE_RAIL_IDS);
  return available.filter(item => reducedIds.has(item.id) || item.id === active);
}

export function speakStudentRailLabel(label, browser = globalThis) {
  const text = String(label || "").trim();
  const speech = browser?.speechSynthesis;
  const Utterance = browser?.SpeechSynthesisUtterance;
  if (!text || !speech?.speak || typeof Utterance !== "function") return false;

  const utterance = new Utterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  speech.cancel?.();
  speech.speak(utterance);
  return true;
}
