// Lightweight public facts for the landing page. The full book and game
// catalogues are deliberately deferred from first load; a unit contract checks
// these figures against their authoritative datasets so marketing copy cannot
// drift silently when the catalogues change.
export const PRODUCT_CATALOG_FACTS = Object.freeze({
  guidedReadingBooks: 226,
  skillCycles: 27,
  learningGames: 22
});
