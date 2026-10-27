// Reviewed spelling-and-sound vocabulary for this finite, authored story bank.
// This is deliberately not a pronunciation engine: an unfamiliar word needs
// review here when a story is added. Never infer a sound from a substring or
// trust targetWords as a pronunciation override. Lists include reviewed
// inflections/compounds; all matching occurrences can then be marked together.
// Short vowels require their usual single-letter spelling. For example, some
// has /ʌ/ but is not an example of the focused short-u spelling. US-English
// teaching conventions apply (grass/path/half/past have short a); those words
// vary in accents with the BATH vowel. th includes voiced and unvoiced sounds.
// u-e/ue/ew include both /uː/ and /juː/, as in flute/cube and blew/stew.
// Known character names qualify when their regular spelling carries the focus.
// They remain support words; a mark makes no full-word decodability claim.
const vocabulary = {
  'short a': `adds an and as at back bad bag bags bat can cannot cans cap cat
    flat grass had half ham hand hands hangs has hat jam lap last man map mat
    nap pan past path ran sad sat scrap snack stand tag tan tap that van`,
  'short e': `bed bench empty end fell fed get gets hen help helps left leg
    let men met net peg pen pens pet red set shelf step steps ten tent them
    then wet yet`,
  'short i': `big bigger bin bins bit bits did dig dip dish fills fit fits him
    his hit if in ink into is it kick kicks kid lid lifts lip little mix picks
    chips pig pin pip pit raisins rip sits sit six sink spills still stick sticks swimming this
    tin tip tips which will wind with zip`,
  'short o': `box cannot chompy dot dog got hop hot log logs mop not off on onto pond
    pot rock shop sock socks spot stop stops top`,
  'short u': `bucket bug bus but cup cut cuts duck ducks dug fluff fun hug hut jug
    jump mud muddy mug mum nut nuts rub rug run shut shuts sun tub tug under until up`,
  sh: `brush brushes dish fish pushes shelf shed shop shopping shuts splashes washes`,
  ch: `bench check checks cheese chest chip chips chompy chops each kitchen latch lunch much sandwich`,
  th: `another bath both cloth other path that the them then there these thick
    thin third this three through threads with without`,
  st: `dust fast first gust just last list lost post resting stamp stand stands
    starts stay stays step steps stick sticks still stops`,
  nt: `front into plant plants tent until wants`,
  ng: `along hangs long ring string swings`,
  nk: `drink drinks ink pink sink`,
  ck: `back block blocks check checks clock pack packs picks rock sick snack
    stick sticks stuck tick`,
  'a-e': `brakes cake case cases game gate made make makes name page place
    plate race safe same shake space stage take takes tape`,
  'i-e': `beside bike five hike ice inside kite like line lines nine ride side size
    slide slides time wide wipe wipes write writes`,
  'o-e': `bone close closer closes cone home hose nose note rose rope stone stones`,
  'u-e': `cube cute flute mule tube tune use uses`,
  'e-e': `these`,
  ai: `pail rail rain raincoat trail train wait waited waiting waits`,
  ay: `away day hay lay lays may pay pays play plays say stay stays tray way`,
  ee: `bee feel feels feet green keep keeps meet need needs see seed seeds sees
    sheep sheet sleep sleeps squeeze squeezes sweep sweeps teeth three tree week`,
  ea: `beach clean cleans each eat eats leaf leaves peach reach read sea seat
    steam tea team`,
  oa: `boat coat coats float foam road soak toast toaster`,
  ow: `arrow arrows below blow blows bowl follow follows grow grows grown low
    row show shows slow slowly snow snowball throw throws window yellow`,
  igh: `bright high light night right tight`,
  ue: `blue glue`,
  ie: `field piece`,
  ew: `blew few new stew`,
};
const wordsByPattern = new Map(Object.entries(vocabulary).map(([pattern, words]) => [
  pattern, new Set(words.trim().split(/\s+/)),
]));
/**
 * Return unique focused story words, lowercased and in first-occurrence order.
 * Apostrophes delimit words like the renderer: Fluff's/Fluff’s returns fluff,
 * so its matching base name is marked while the possessive ending is retained.
 */
export function getPassagePhonicsWords(passage) {
  if (typeof passage?.text !== 'string' || typeof passage?.focus !== 'string') return [];
  const patterns = passage.focus.toLowerCase().split('/').map(part =>
    part.trim().replace(/\s+as in\s+.+$/, '').replace(/\s+blends?$/, ''),
  );
  const focusedVocabulary = patterns.map(pattern => wordsByPattern.get(pattern)).filter(Boolean);
  const marked = new Set();
  for (const match of passage.text.matchAll(/\b[a-z]+\b/gi)) {
    const word = match[0].toLowerCase();
    if (focusedVocabulary.some(words => words.has(word))) marked.add(word);
  }
  return [...marked];
}
