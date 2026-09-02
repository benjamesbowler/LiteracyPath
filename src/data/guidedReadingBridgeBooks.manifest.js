// Production handoff for Tasks 5-7. This list freezes collection membership,
// page count, cast, treatment, and media directory before media is generated.
const row = (slug, title, bridgeGenre, visualTreatment, cast) => Object.freeze({
  id: "willow-street-" + slug,
  title,
  bridgeGenre,
  visualTreatment,
  readingBandProfile: "standard",
  readingMode: "predictable-levelled",
  readingPageProfile: "compact-stable",
  cast: Object.freeze(cast),
  pageCount: 8,
  mediaDirectory: "/guided-reading/willow-street/" + slug
});

export const WILLOW_STREET_BOOK_MANIFEST = Object.freeze([
  row("the-lunchbox-mix-up", "The Lunchbox Mix-Up", "everyday-fiction", "willow-street-illustrated", ["WILLOW-MAYA", "WILLOW-SAMIR"]),
  row("the-lost-library-book", "The Lost Library Book", "everyday-fiction", "willow-street-illustrated", ["WILLOW-ZOE", "WILLOW-LEO"]),
  row("the-windy-picnic", "The Windy Picnic", "everyday-fiction", "willow-street-illustrated", ["WILLOW-MAYA", "WILLOW-ZOE", "WILLOW-LEO"]),
  row("the-puddle-plan", "The Puddle Plan", "everyday-fiction", "willow-street-illustrated", ["WILLOW-LEO", "WILLOW-SAMIR"]),
  row("the-squeaky-wheel", "The Squeaky Wheel", "everyday-fiction", "willow-street-illustrated", ["WILLOW-ZOE", "WILLOW-SAMIR"]),
  row("the-garden-gate", "The Garden Gate", "everyday-fiction", "willow-street-illustrated", ["WILLOW-MAYA", "WILLOW-LEO"]),
  row("nanis-chapati-lunch", "Nani's Chapati Lunch", "culture-community", "willow-street-illustrated", ["WILLOW-MAYA", "WILLOW-NANI"]),
  row("dumplings-for-new-year", "Dumplings for New Year", "culture-community", "willow-street-illustrated", ["WILLOW-ZOE", "WILLOW-AUNT-MEI"]),
  row("drums-for-carnival", "Drums for Carnival", "culture-community", "willow-street-illustrated", ["WILLOW-LEO", "WILLOW-MR-BAPTISTE"]),
  row("eid-morning-with-samir", "Eid Morning with Samir", "culture-community", "willow-street-illustrated", ["WILLOW-SAMIR", "WILLOW-MAYA"]),
  row("grow-a-bean-in-a-jar", "Grow a Bean in a Jar", "procedure", "willow-street-illustrated", ["WILLOW-MAYA"]),
  row("make-a-paper-kite", "Make a Paper Kite", "procedure", "willow-street-illustrated", ["WILLOW-SAMIR"]),
  row("build-a-cardboard-ramp", "Build a Cardboard Ramp", "procedure", "willow-street-illustrated", ["WILLOW-LEO"]),
  row("make-fruit-and-yoghurt-cups", "Make Fruit and Yoghurt Cups", "procedure", "willow-street-illustrated", ["WILLOW-ZOE"]),
  row("from-wheat-to-bread", "From Wheat to Bread", "photorealistic-nonfiction", "self-created-photorealistic", []),
  row("where-rainwater-goes", "Where Rainwater Goes", "photorealistic-nonfiction", "self-created-photorealistic", []),
  row("inside-a-fire-station", "Inside a Fire Station", "photorealistic-nonfiction", "self-created-photorealistic", []),
  row("how-paper-is-recycled", "How Paper Is Recycled", "photorealistic-nonfiction", "self-created-photorealistic", []),
  row("a-snail-comes-out-at-night", "A Snail Comes Out at Night", "photorealistic-nonfiction", "self-created-photorealistic", []),
  row("how-a-book-is-made", "How a Book Is Made", "photorealistic-nonfiction", "self-created-photorealistic", [])
]);
