// THE CHILD NAVIGATION POLICY.
//
// 2026-07-29 — the kids-side redesign replaces the left rail with a five-tab
// bottom bar (mockups/design-handoff-kids-side/README.md, "Global Chrome").
// The spec is explicit that this module gets a CORRESPONDING REVISION, not a
// bypass, so the tab bar is derived from the same destination registry the rail
// used rather than being a second, independent list that can drift from it.
//
// The shape of the revision:
//
//   * STUDENT_RAIL_DESTINATIONS keeps every place a child can go — the redesign
//     is a re-layout, not a cull, and all seven destinations stay reachable.
//   * Each destination now declares the TAB it lights. There are eight places
//     (Home plus the seven) and only five tabs, so several places share one:
//     Story Quests lights Books, and both the Adventure Map and Letters light
//     Sounds. A place with no tab of its own is the normal case, not an edge
//     case — which is exactly why the mapping lives on the destination and not
//     in a switch statement inside a component.
//   * selectActiveStudentTab() therefore CANNOT return nothing. An unknown
//     place falls back to Home. The bar is never left with nothing lit; a child
//     who cannot read the title still has the lit tab telling them where they
//     are.
//   * validateStudentTabCoverage() is the guard that keeps the two lists in
//     step: add a destination without a tab and it fails.
//
// The rail's own helpers (selectStudentRailItems, speakStudentRailLabel) are
// unchanged and still in use — reduced-choice mode is a teacher setting that
// outlives the layout, and tap-to-hear is how a pre-reader uses either shape.

export const STUDENT_RAIL_HOME = Object.freeze({
  id: "home",
  label: "Home",
  icon: "home",
  tab: "home"
});

export const STUDENT_RAIL_ICON_PATHS = Object.freeze({
  home: "M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z",
  sound: "M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6",
  // The tab bar's speaker carries a second wave: at 27px the rail's single arc
  // reads as a smudge, and the tab is the one icon a child navigates by.
  soundWaves: "M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6M18.6 6a8 8 0 0 1 0 12",
  phonics: "M5 19V6a2 2 0 0 1 2-2h10M7 19h11M9 15h6M9 11h6",
  map: "M9 4 3 7v13l6-3 6 3 6-3V4l-6 3z M9 4v13 M15 7v13",
  book: "M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z M8 3v18",
  story: "m12 4 2 4.2 4.6.6-3.4 3.2.9 4.6L12 14.4l-4.1 2.2.9-4.6L5.4 8.8 10 8.2Z",
  arcade: "M3 8h18v9H3z M7 12h2M17 12h.01M8 11v2",
  hollow: "M4 11 12 4l8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20c1.5-3.5 4.2-5 7.5-5s6 1.5 7.5 5"
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

// The five tabs, left to right, exactly as the spec's table orders them. Labels
// are one short high-frequency word each: the icon carries the meaning for a
// child who cannot read the label yet.
export const STUDENT_TAB_BAR = Object.freeze([
  Object.freeze({ id: "home", label: "Home", icon: "home" }),
  Object.freeze({ id: "sounds", label: "Sounds", icon: "soundWaves" }),
  Object.freeze({ id: "books", label: "Books", icon: "book" }),
  Object.freeze({ id: "games", label: "Games", icon: "arcade" }),
  Object.freeze({ id: "hollow", label: "Hollow", icon: "hollow" })
]);

export const STUDENT_TAB_FALLBACK = "home";

// Every place, keyed by id, including Home. Built from the two lists above so
// there is no third place for the mapping to be written down and go stale.
const PLACE_TABS = new Map(
  [STUDENT_RAIL_HOME, ...STUDENT_RAIL_DESTINATIONS].map(place => [place.id, place.tab])
);

/**
 * Which tab lights up for the place the child is currently in.
 *
 * Always returns a tab id that exists in STUDENT_TAB_BAR — an unrecognised or
 * missing place falls back to Home rather than returning nothing, because a
 * bottom bar with nothing lit tells a five-year-old they are lost.
 */
export function selectActiveStudentTab(placeId) {
  const mapped = PLACE_TABS.get(String(placeId || ""));
  if (mapped && STUDENT_TAB_BAR.some(tab => tab.id === mapped)) return mapped;
  return STUDENT_TAB_FALLBACK;
}

/**
 * The guard that keeps the destination registry and the tab bar in step.
 * `unmapped` lists places whose declared tab does not exist; `unusedTabs`
 * lists tabs no place points at (a tab nothing can light is dead chrome).
 */
export function validateStudentTabCoverage(
  places = [STUDENT_RAIL_HOME, ...STUDENT_RAIL_DESTINATIONS],
  tabs = STUDENT_TAB_BAR
) {
  const tabIds = new Set(tabs.map(tab => tab.id));
  const unmapped = places.filter(place => !tabIds.has(place.tab)).map(place => place.id);
  const used = new Set(places.map(place => place.tab));
  const unusedTabs = tabs.filter(tab => !used.has(tab.id)).map(tab => tab.id);
  return Object.freeze({
    pass: unmapped.length === 0 && unusedTabs.length === 0,
    unmapped: Object.freeze(unmapped),
    unusedTabs: Object.freeze(unusedTabs)
  });
}

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
