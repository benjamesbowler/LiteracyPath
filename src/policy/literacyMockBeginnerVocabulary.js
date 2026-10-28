// Reviewed incidental vocabulary for First steps and Starter only. Word length,
// CVC spelling and an audio file do not establish familiarity for an entry ESL
// learner. Published item text/keys stay immutable; eligibility applies this
// review separately so an unsuitable question is not counted as a child error.
const words = text => Object.freeze(text.trim().split(/\s+/));

// Concrete classroom, home, body, food and familiar animal words. Familiar
// longer words (banana, elephant, toothbrush) are deliberately retained: this
// is a vocabulary review, not a syllable/character-count rule.
const objects = words(`ant apple bag ball banana basket bath beach bear bed bee bell belt bench
  bike bird blanket boat book boot bottle bowl box bread broom brush bus butterfly
  cake camera car carrot cat caterpillar chair cheese chin clock cloud coat comb
  chick cone cookie corn cow crayon cup deer desk dinosaur dog doll dolphin door dress drum duck egg elbow
  elephant face fan feather fish foot fork fox frog gate glass goat grapes guitar hair hand
  hat hen horse house jacket jam jet kangaroo key king kite ladder lamp leaf leg
  lemon lid lion log map mat meat milk monkey moon mop mountain mouse mouth mug nest net
  nose nut orange pan peach pear pen pencil penguin phone pig pillow pizza plate
  plum plug pot potato pumpkin rabbit rain rat rice ring river rock rocket rose ruler scarf
  scissors seal shark sheep shell ship shirt shoe shorts sink skirt slide snail snake
  snow sock sofa soup spider spoon star stick sun swing table tent tiger tomato
  tie tooth toothbrush towel train tree truck umbrella van vase watch water watermelon
  web whale wheel window zebra zero zipper zoo`);

// High-utility short spoken words for sound comparisons and early decoding.
// Common concrete phonics words such as cub, den, peg and ram remain usable;
// obscure short words such as cob, fig, vat, jut and rut do not become easy
// simply because their spelling has three letters.
const shortWords = words(`bad bag ban bat bed beg bet bib bid big bin bit box bud bug bun bus but cab
  can cap cat cot cub cup cut dad dam den did dig dim dip dog dot dug fan fat fed
  fin fit fix fog fox fun gap gas gem get got gum gun had ham has hat hem hen hid him hip his
  hit hop hot hug hum hut jam jet job jog jug kit lap led leg let lid lip lit log
  lot mad man map mat men met mix mop mud mug nap net nip nod not nut pad pan pat
  peg pen pet pig pin pit pod pop pot pup rag ram ran rat red rib rid rim rip rob
  rod rot rub rug run sad sat set sip sit six sum sun tag tan tap ten tin tip top tub
  tug van vet wag web wet wig win yes yet zip`);
const functionWords = words(`a all an and are as at be been being both but by can could day did do
  does down each end for from get go gone good got had has have he her here hers
  him his how i if in into is it its may me my new no not now of off on once one
  or our out own put say saw see she so some that the their them then there these they
  this those through to too two up us use very was way we were what when where
  which who why will with you your`);
const soundWords = words(`bake bead bite black bone break brick cave chain check cheek class clean
  cook crack creek date deep dive drive eight fine five foam food game give grass
  green hide home hope hot ice jump knife lake leap life light like line lock
  made make meat name neck nice night nine note pack pain pine pink pipe race
  rain read rice ride ripe road rope safe same save seat seed shake shape shine
  shop sick side sleep smile snack snake soon soup speak stone street sweep sweet
  take tape teeth thick time track tune twice type week wheat white wide wife`);
const actions = words(`bake bend bounce build carry catch chop clap climb cook crawl cry cut dance
  dig draw drink drive eat feed fold hop hug jump kick laugh lift look march peel
  point pour pull push read ride roll run shake shout sing sit skip sleep smell
  smile sneeze spill spin stand stir stretch swim throw walk wash wave wear
  whisper write yawn`);
const directions = words(`about at capital choose correctly find first has hear last letter letters
  listen match matches matching name named names one picture same sentence small sound
  start starting starts tap the uses which word words write written`);

// Additional short sentence words reviewed in the lower listening/writing
// banks. Do not whitelist an entire source bank: that was the original bug.
const sentenceWords = words(`after against an and arrived arriving asleep beat before began behind beside birds
  boxes boy broken bunch button by cage came candle cannot carries carry chewed child chips
  chocolate class cleaned close clouds cold come cousin cut dark draw ears eats
  dad fell filled fire fixed fly for found friend fruit full gate glow gold grandpa grow
  happens hay heavy helped high hold hole hot hurts into is its keep left legs
  line lit lives long loose lost loudly lunch made mitten moon mud needs of open paper park path
  away hook little photo planted planting play please pond puppy purple raindrops red rest room rubbed run sails
  salty sandcastles sea seed seeds serve shared shut silver sister sleeps slept
  slices slipper slowly soft some soon station steady stopped straight swims
  socks swam sweep take talk tapped tastes teddy tells that there these this through time to trail trip
  trunk turn turned visit want wears went will wind winter with writing yellow your`);
const names = words(`ada ali amir arlo ava ben bo cora dylan elena eli esme eva felix hazel hugo
  ian ida iris ivy jade jay joe joy kai kim leila leo lily lou luca madrid maeve
  max may meg mia nico nina noah october omar otis pippa poppy ravi rory sam sara
  soren spot sue sunday tessa theo tom wednesday zara zoe`);

const union = (...lists) => Object.freeze([...new Set(lists.flat())].sort());
export const LITERACY_MOCK_BEGINNER_VOCABULARY = Object.freeze({
  // Familiar vocabulary is the V12 editorial contract. Historical publications
  // keep their original admission and saved evidence; new sessions use V12.
  contentVersions: words('literacy-mock-v12'),
  areaVersions: words('areas-v6'),
  bands: Object.freeze([0, 1]),
  families: Object.freeze({
    sound_awareness: Object.freeze({ skills: words('initial_sounds final_sounds'), allowedWords: union(objects, shortWords, functionWords, soundWords, directions) }),
    phonics: Object.freeze({ skills: words('cvc_short_vowels hfw_1_25 hfw_26_50 hfw_51_75 hfw_76_100'), allowedWords: union(objects, shortWords, functionWords, directions, words('arm art ball boy dry ear fork hats hit ill seed sheep shed shout son tall twin wax')) }),
    vocabulary: Object.freeze({ skills: words('picture_vocabulary'), allowedWords: union(objects, directions, functionWords) }),
    listening: Object.freeze({ skills: words('listen_words_phrases'), allowedWords: union(objects, directions, functionWords, actions, sentenceWords) }),
    reading: Object.freeze({ skills: words('picture_word_reading'), allowedWords: union(shortWords, directions, functionWords) }),
    language: Object.freeze({ skills: words('verbs'), allowedWords: union(objects, directions, actions) }),
    writing: Object.freeze({ skills: words('capitalization'), allowedWords: union(objects, shortWords, directions, functionWords, sentenceWords, names) }),
    print: Object.freeze({ skills: words('letter_knowledge'), allowedWords: union(directions, functionWords, words('the to'), 'abcdefghijklmnopqrstuvwxyz'.split('')) }),
  }),
});

const families = new Map(Object.entries(LITERACY_MOCK_BEGINNER_VOCABULARY.families)
  .map(([domain, policy]) => [domain, { skills: new Set(policy.skills), words: new Set(policy.allowedWords) }]));
const tokens = value => String(value ?? '').toLowerCase().match(/[a-z]+/g) || [];

/** Review the actual child-facing evidence, including distractors and recorded
 * wording. IDs, file names and a trusted-looking difficulty note cannot admit
 * vocabulary. Context must be supplied by the exact published snapshot. */
export function literacyMockBeginnerVocabularyIssue(snapshot = {}) {
  const policy = LITERACY_MOCK_BEGINNER_VOCABULARY;
  if (!snapshot || snapshot.tutorialOnly
    || !policy.contentVersions.includes(snapshot.contentVersion)
    || !policy.areaVersions.includes(snapshot.adaptiveAreaVersion)
    || !policy.bands.includes(snapshot.adaptiveAreaBand)) return null;
  const family = families.get(snapshot.domainId);
  if (!family || !family.skills.has(snapshot.skillId)) return null;
  const text = [snapshot.targetWord, snapshot.prompt, snapshot.passage, snapshot.sentence,
    ...(snapshot.choices || []).map(choice => typeof choice === 'string' ? choice : choice.label ?? choice.text ?? choice.value),
    ...(snapshot.requiredAudioCues || []).map(cue => cue.text)];
  const unfamiliarWords = [...new Set(text.flatMap(tokens).filter(word => !family.words.has(word)))].sort();
  if (!unfamiliarWords.length) return null;
  return {
    code: 'beginner_vocabulary', unfamiliarWords,
    reason: `This First steps or Starter question includes vocabulary outside its reviewed familiar-word set (${unfamiliarWords.join(', ')}). Unfamiliar incidental words must not determine an entry learner's result.`,
  };
}
