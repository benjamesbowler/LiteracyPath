import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { getPreferredPhonemeAudioPath } from './phonemeAudioBank.js';

const FILE = 'src/data/literacyMockCorrectionsV9.js';
const split = value => value.split(' ');
const choices = labels => labels.map((label, index) => ({ id: `c${index}`, label }));
const cue = (role, text, choiceId) => ({ role, text,
  path: role === 'instruction' || role === 'passage' ? getLedaInstructionAudioPath(text) || null : getLedaWordAudioPath(text) || getLedaInstructionAudioPath(text) || null,
  required: true, ...(choiceId ? { choiceId, value: text } : {}) });
const provenance = id => ({ kind: 'original_literacy_guide_v9_correction', file: FILE, sourceId: id });
const media = reason => ({ role: 'audio-and-print', paths: [], constructReview: 'approved', answerNeutral: 'approved', reason });
const strip = q => { const result = { ...q }; delete result.itemSnapshot; return result; };

// Literal spoken targets. Final phonemes are authored units, never guessed
// from a final letter (eight, white, soup and guide have silent/complex spellings).
const FINAL_TARGETS = {
  t: 'bite date eight light meat night seat street sweet wheat white',
  d: 'bead bread food guide hide made ride road seed side wide',
  p: 'deep hope leap ripe rope shape shop soup sweep',
  k: 'bake black break brick cheek check cloak cook crack creek lake like lock make pack pink rock shake sick snack snake speak stick take thick track week',
  n: 'rain green chain clean fine line nine pine shine soon stone tune bone',
  m: 'name game foam same home time',
  f: 'safe knife life wife',
  v: 'give save cave dive drive',
  s: 'ice rice race lace nice price twice class grass',
};
const FINAL_CHOICES = {
  t: [['cat', 't'], ['cap', 'p'], ['can', 'n']], d: [['bed', 'd'], ['bet', 't'], ['beg', 'g']],
  p: [['cup', 'p'], ['cut', 't'], ['cub', 'b']], k: [['neck', 'k'], ['net', 't'], ['web', 'b']],
  n: [['sun', 'n'], ['cup', 'p'], ['bus', 's']], m: [['ham', 'm'], ['hat', 't'], ['hen', 'n']],
  f: [['leaf', 'f'], ['leg', 'g'], ['lip', 'p']], v: [['five', 'v'], ['fish', 'sh'], ['fin', 'n']],
  s: [['bus', 's'], ['bug', 'g'], ['bun', 'n']],
};
const INITIAL_TARGETS = split('bite date deep food guide hide hope lake light like line made make meat name neck nine note pack pain pine pipe race rain ride road rope seed seat side soon soup take tape teeth tune type week wide');
const INITIAL_KEYS = { b: 'bus', d: 'dog', f: 'fish', g: 'goat', h: 'hat', l: 'log', m: 'map', n: 'net', p: 'pig', r: 'rabbit', s: 'sun', t: 'tent', w: 'web' };

// These replace the operation of the excluded vowel-letter rows with an
// actual comparison of spoken words. Each key changes both outer phonemes.
const MEDIAL_ROWS = [
 ['dot','rob','bed','pig','LOT'],['cot','rod','sun','net','LOT'],
 ['peg','hen','cat','fish','DRESS'],['rod','cot','bed','sun','LOT'],
 ['bud','sun','bed','pig','STRUT'],['kit','pig','bed','sun','KIT'],
 ['jet','hen','cat','cup','DRESS'],['rib','fin','bed','cat','KIT'],
 ['gas','pan','bed','pig','TRAP'],['bet','hen','dog','cup','DRESS'],
 ['pat','can','leg','pig','TRAP'],['dip','fin','cat','sun','KIT'],
 ['hum','cup','cat','pig','STRUT'],['sum','rug','bed','fish','STRUT'],
];
// Every sequence has three separately recorded phonemes. No recording of the
// whole target is played as the stimulus; the child must blend the sequence.
const ORAL_BLENDS = [
 ['lab','l a b','lap','cab'],['lot','l o t','let','rot'],['tip','t i p','tin','lip'],
 ['fed','f e d','bed','red'],['big','b i g','pig','bib'],['hip','h i p','hit','lip'],
 ['hot','h o t','hat','hut'],['jug','j u g','bug','job'],['mum','m u m','mud','hum'],
 ['mud','m u d','mug','bud'],['mug','m u g','bug','mud'],['rot','r o t','rod','hot'],
 ['sap','s a p','sat','sip'],['sob','s o b','sub','job'],['ten','t e n','tin','pen'],
 ['tin','t i n','ten','pin'],
];
// Exact existing rasters reviewed at child-card size for this publication.
// Foils describe actions absent from the foreground target, avoiding e.g.
// cook/stir, drive/sit, carry/walk or lift/bend as simultaneously true answers.
const ACTION_ROWS = [
 ['build','verb-build','sleep','drink'],['pour','verb-pour','clap','jump'],
 ['bake','verb-bake','swim','sing'],['stir','stir','run','sleep'],
 ['drive','verb-drive','dig','clap'],['peel','peel','kick','sing'],
 ['stand','stand','sleep','swim'],['cook','verb-cook','clap','read'],
 ['ride','ride','crawl','draw'],['chop','chop','sleep','swim'],
 ['bend','bend','hop','sing'],['lift','lift','drink','crawl'],
 ['yawn','yawn','clap','swim'],['smell','smell','drink','write'],
 ['carry','carry','sleep','swim'],['march','march','crawl','sleep'],
 ['feed','feed','jump','write'],
];
// Pictured word decoding: entry contrasts the initial; the next rung keeps
// all three initials identical so the complete CVC spelling is necessary.
// Each exact image was inspected. Word targets are new, while the two rungs
// retain one shared lexical identity rather than manufacturing fresh forms.
const READING_ROWS = [
 ['cap','/images/assessment/objective-words/cap.webp','cat','cup'],
 ['bin','/images/assessment/rhyming/variants/in/bin-02.webp','big','bit'],
 ['nut','/images/assessment/objective-words/nut.webp','net','nap'],
 ['wig','/images/assessment/generated/phonics-quality/wig.webp','win','wet'],
 ['van','/images/assessment/objective-words/van.webp','vet','vat'],
 ['web','/images/assessment/objective-words/web.webp','wet','win'],
 ['cub','/media/vocabulary/images/cub.webp','cup','cut'],
 ['fog','/images/assessment/release-support/targets/fog-dfebbd.webp','fox','fan'],
 ['fin','/images/child-mode/vocabulary/fin.webp','fit','fun'],
 ['yak','/images/assessment/release-media/yak-419086a8.webp','yam','yes'],
 ['cab','/media/final-sounds/images/b/cab.webp','can','cap'],
 ['cob','/media/final-sounds/images/b/cob.webp','cot','cub'],
];

// Four spoken phonemes, five separate LETTER responses. Silent e is not a
// phoneme. Every entry below has an explicitly authored pronunciation.
const SPLIT_BUILDS = [
 ['blame','b l eɪ m'],['blade','b l eɪ d'],['blaze','b l eɪ z'],['brave','b r eɪ v'],['brace','b r eɪ s'],
 ['crane','k r eɪ n'],['crave','k r eɪ v'],['crate','k r eɪ t'],['drape','d r eɪ p'],['frame','f r eɪ m'],['flame','f l eɪ m'],
 ['grace','g r eɪ s'],['grade','g r eɪ d'],['grape','g r eɪ p'],['grave','g r eɪ v'],['graze','g r eɪ z'],
 ['plane','p l eɪ n'],['plate','p l eɪ t'],['place','p l eɪ s'],['scale','s k eɪ l'],['skate','s k eɪ t'],['slate','s l eɪ t'],
 ['snake','s n eɪ k'],['spade','s p eɪ d'],['space','s p eɪ s'],['state','s t eɪ t'],
 ['stage','s t eɪ dʒ'],['trade','t r eɪ d'],['trace','t r eɪ s'],
 ['bride','b r aɪ d'],['bribe','b r aɪ b'],['drive','d r aɪ v'],['prime','p r aɪ m'],['prize','p r aɪ z'],
 ['grime','g r aɪ m'],['glide','g l aɪ d'],['slide','s l aɪ d'],['slice','s l aɪ s'],['slime','s l aɪ m'],['smile','s m aɪ l'],
 ['spike','s p aɪ k'],['spine','s p aɪ n'],['spite','s p aɪ t'],['stile','s t aɪ l'],['tribe','t r aɪ b'],['tripe','t r aɪ p'],['twice','t w aɪ s'],
 ['broke','b r oʊ k'],['close','k l oʊ z'],['clove','k l oʊ v'],['clone','k l oʊ n'],['drone','d r oʊ n'],['drove','d r oʊ v'],
 ['globe','g l oʊ b'],['grove','g r oʊ v'],['probe','p r oʊ b'],['prose','p r oʊ z'],['slope','s l oʊ p'],['smoke','s m oʊ k'],
 ['spoke','s p oʊ k'],['stole','s t oʊ l'],['stove','s t oʊ v'],['stone','s t oʊ n'],
 ['crude','k r uː d'],['flute','f l uː t'],['fluke','f l uː k'],['prune','p r uː n'],['truce','t r uː s'],['plume','p l uː m'],
 ['taste','t eɪ s t'],['paste','p eɪ s t'],['haste','h eɪ s t'],['waste','w eɪ s t'],['baste','b eɪ s t'],
];
// Exactly five spoken phonemes. These targets require the extra consonant
// while preserving a vowel team; plural s is explicitly /s/ or /z/ below.
const FIVE_BUILDS = [
 ['stream','s t r ea m','s t r iː m'],['street','s t r ee t','s t r iː t'],['streak','s t r ea k','s t r iː k'],
 ['scream','s c r ea m','s k r iː m'],['sprain','s p r ai n','s p r eɪ n'],['strain','s t r ai n','s t r eɪ n'],
 ['sprout','s p r ou t','s p r aʊ t'],['screen','s c r ee n','s k r iː n'],
 ['sleeps','s l ee p s','s l iː p s'],['trains','t r ai n s','t r eɪ n z'],['brains','b r ai n s','b r eɪ n z'],
 ['floats','f l oa t s','f l oʊ t s'],['toasts','t oa s t s','t oʊ s t s'],['greens','g r ee n s','g r iː n z'],
 ['dreams','d r ea m s','d r iː m z'],['steams','s t ea m s','s t iː m z'],['creeks','c r ee k s','k r iː k s'],
 ['spoons','s p oo n s','s p uː n z'],['brooms','b r oo m s','b r uː m z'],['blooms','b l oo m s','b l uː m z'],
 ['grains','g r ai n s','g r eɪ n z'],['plains','p l ai n s','p l eɪ n z'],['cloaks','c l oa k s','k l oʊ k s'],
 ['coasts','c oa s t s','k oʊ s t s'],['roasts','r oa s t s','r oʊ s t s'],['boasts','b oa s t s','b oʊ s t s'],
 ['cleans','c l ea n s','k l iː n z'],['steeps','s t ee p s','s t iː p s'],['gleams','g l ea m s','g l iː m z'],
 ['trails','t r ai l s','t r eɪ l z'],['snails','s n ai l s','s n eɪ l z'],['bleeds','b l ee d s','b l iː d z'],
 ['pleads','p l ea d s','p l iː d z'],['flails','f l ai l s','f l eɪ l z'],['paints','p ai n t s','p eɪ n t s'],
 ['points','p oi n t s','p ɔɪ n t s'],['joints','j oi n t s','dʒ ɔɪ n t s'],['sweeps','s w ee p s','s w iː p s'],['sweets','s w ee t s','s w iː t s'],
];
// Compounds add a second meaningful part and at least one further phoneme.
// Grapheme response units remain distinct from phonemes and printed letters.
const COMPOUND_BUILDS = [
 ['raincoat','r ai n c oa t','r eɪ n k oʊ t','rain coat'],['rainbows','r ai n b ow s','r eɪ n b oʊ z','rain bow s'],
 ['snowman','s n ow m a n','s n oʊ m æ n','snow man'],['bedroom','b e d r oo m','b ɛ d r uː m','bed room'],
 ['classroom','c l a ss r oo m','k l æ s r uː m','class room'],['daydream','d ay d r ea m','d eɪ d r iː m','day dream'],
 ['sunbeam','s u n b ea m','s ʌ n b iː m','sun beam'],['sunroof','s u n r oo f','s ʌ n r uː f','sun roof'],
 ['sailboat','s ai l b oa t','s eɪ l b oʊ t','sail boat'],['seashells','s ea sh e ll s','s iː ʃ ɛ l z','sea shell s'],
 ['toothbrush','t oo th b r u sh','t uː θ b r ʌ ʃ','tooth brush'],['toothpaste','t oo th p a s t e','t uː θ p eɪ s t','tooth paste'],
 ['toothpick','t oo th p i ck','t uː θ p ɪ k','tooth pick'],['weekend','w ee k e n d','w iː k ɛ n d','week end'],
 ['weekdays','w ee k d ay s','w iː k d eɪ z','week day s'],['beehives','b ee h i v e s','b iː h aɪ v z','bee hive s'],
 ['beetroot','b ee t r oo t','b iː t r uː t','beet root'],['bluebell','b l ue b e ll','b l uː b ɛ l','blue bell'],
 ['blueprint','b l ue p r i n t','b l uː p r ɪ n t','blue print'],['footstep','f oo t s t e p','f ʊ t s t ɛ p','foot step'],
 ['football','f oo t b a ll','f ʊ t b ɔː l','foot ball'],['bookcase','b oo k c a s e','b ʊ k k eɪ s','book case'],
 ['bookshop','b oo k sh o p','b ʊ k ʃ ɒ p','book shop'],['bookshelf','b oo k sh e l f','b ʊ k ʃ ɛ l f','book shelf'],
 ['cookbook','c oo k b oo k','k ʊ k b ʊ k','cook book'],['moonlight','m oo n l igh t','m uː n l aɪ t','moon light'],
 ['moonbeam','m oo n b ea m','m uː n b iː m','moon beam'],['moonstone','m oo n s t o n e','m uː n s t oʊ n','moon stone'],
 ['spoonful','s p oo n f u l','s p uː n f ʊ l','spoon ful'],['teaspoon','t ea s p oo n','t iː s p uː n','tea spoon'],
 ['teacups','t ea c u p s','t iː k ʌ p s','tea cup s'],['teapots','t ea p o t s','t iː p ɒ t s','tea pot s'],
 ['treetop','t r ee t o p','t r iː t ɒ p','tree top'],['treehouse','t r ee h ou s e','t r iː h aʊ s','tree house'],
 ['boathouse','b oa t h ou s e','b oʊ t h aʊ s','boat house'],['roadside','r oa d s i d e','r oʊ d s aɪ d','road side'],
 ['roadways','r oa d w ay s','r oʊ d w eɪ z','road way s'],['railways','r ai l w ay s','r eɪ l w eɪ z','rail way s'],
 ['railroad','r ai l r oa d','r eɪ l r oʊ d','rail road'],['raincloud','r ai n c l ou d','r eɪ n k l aʊ d','rain cloud'],
 ['playtime','p l ay t i m e','p l eɪ t aɪ m','play time'],['seagulls','s ea g u ll s','s iː g ʌ l z','sea gull s'],
 ['playground','p l ay g r ou n d','p l eɪ g r aʊ n d','play ground'],['footprint','f oo t p r i n t','f ʊ t p r ɪ n t','foot print'],
 ['paintbrush','p ai n t b r u sh','p eɪ n t b r ʌ ʃ','paint brush'],['steamship','s t ea m sh i p','s t iː m ʃ ɪ p','steam ship'],
 ['beachball','b ea ch b a ll','b iː tʃ b ɔː l','beach ball'],['beachside','b ea ch s i d e','b iː tʃ s aɪ d','beach side'],
];

// Each key preserves an explicit scope distinction; the foils change that
// same quantifier, exception, temporal direction, or necessary condition.
const SCOPE_ROWS = [
 ['trays','Every tray except the green one held two cups. The green tray was empty.','All trays other than the green one had two cups.','Every tray had two cups.','Only the green tray had two cups.','every_except'],
 ['hats','Only children wearing hats could join the walk. Amir wore a hat and joined.','A hat was necessary for a child to join the walk.','Every child joined, whether or not they wore a hat.','Children wearing hats had to stay at school.','only_necessary'],
 ['lanterns','There were two tables of lanterns. No lantern on the left table was lit. All the lanterns on the right table were lit.','Only the lanterns on the right table were lit.','Lanterns on both tables were lit.','Only the lanterns on the left table were lit.','all_none'],
 ['red-blue','Neither the red bag nor the blue bag held a towel. Each towel was in the basket.','Both bags were without towels.','Both bags held towels.','One bag held all the towels.','neither'],
 ['tickets','Every ticket had been sold before the doors opened.','No tickets remained for sale when the doors opened.','Some tickets remained for sale when the doors opened.','Tickets first went on sale after the doors opened.','all_none'],
 ['claps','The class stood up before the last clap. They sat down after it.','The last clap came between standing up and sitting down.','The last clap came before both movements.','The last clap came after both movements.','before_after'],
 ['watering','Until the soil dried, Rosa did not water the pot. She watered it as soon as it was dry.','Rosa waited for dry soil before watering.','Rosa watered while the soil was still wet.','Rosa never watered the pot, even after it dried.','until'],
 ['gate','Children could enter only after an adult opened the gate.','The adult had to open the gate before children entered.','Children entered before the adult opened the gate.','Children could enter whenever they reached the closed gate.','only_after'],
 ['crates','All the small crates were empty. Some large crates held books.','Some large crates held books, and no small crate held books.','Every large crate contained books.','Some small crates contained books.','all_some'],
 ['colours','Mina painted every flag except the yellow flag. She left that flag plain.','Only the yellow flag was left unpainted.','Only the yellow flag was painted.','Every flag was left unpainted.','every_except'],
 ['seeds','Each child planted two seeds, and no child planted any more.','Every child planted exactly two seeds.','Only two children planted seeds.','Every child planted at least three seeds.','exact_quantity'],
 ['brushes','Bo washed the brushes before putting them away.','The brushes were already washed when Bo put them away.','Bo put the brushes away before washing them.','Bo washed the brushes while they remained in the cupboard.','before'],
 ['library','The library remained closed until the worker fixed the door. It opened as soon as the repair was finished.','The repair came before the library opened.','The library opened before the repair.','The library stayed closed after the repair was finished.','until'],
 ['dancers','Everyone in the show was either a dancer or a singer. Every dancer wore a blue ribbon. No singer wore a blue ribbon.','Anyone in the show wearing a blue ribbon was a dancer, not a singer.','Every singer wore the same ribbon as the dancers.','No dancer wore a blue ribbon.','all_none'],
 ['boxes','Only boxes with a star were sent to the hall. Some starred boxes stayed behind.','A star was needed for a box to be sent, but not every starred box went.','Every starred box was sent to the hall.','Boxes without stars were the only ones sent.','only_not_sufficient'],
 ['rain','The players stayed inside unless the rain stopped. The rain continued all afternoon.','The players remained inside throughout the afternoon.','The players went outside while the rain continued.','The players went outside before it began to rain.','unless'],
 ['race','Tess finished before Noor, and Noor finished before Sol.','Noor finished after Tess but before Sol.','Noor finished before both Tess and Sol.','Noor finished after both Tess and Sol.','temporal_scope'],
 ['shelves','No books were put on the top shelf. Every new book went on the bottom shelf.','All the new books were below the top shelf.','Some new books went on the top shelf.','Every shelf received some new books.','all_none'],
 ['baskets','Every basket contained apples, but only one basket also contained pears.','Apples were in all the baskets; pears were in just one.','Pears were in all the baskets; apples were in just one.','Only one basket contained any fruit.','all_only_one'],
 ['practice','Not every child finished the puzzle. Three children were still working.','Some children had not finished the puzzle.','No child had finished the puzzle.','Every child had finished the puzzle.','not_all'],
 ['lunch','Jin fed the rabbit after lunch but before the music lesson.','Rabbit feeding happened between lunch and music.','Rabbit feeding happened before both lunch and music.','Rabbit feeding happened after both lunch and music.','before_after'],
 ['buttons','Lena used all the round buttons and none of the square buttons.','Every round button was used, and every square button was left unused.','Every round and square button was used.','Every used button was square.','all_none'],
 ['homework','Only pupils who returned a signed form could take a book home. Not all those pupils chose a book.','A signed form was required, but it did not mean a pupil took a book.','Every pupil with a signed form took a book.','A pupil without a signed form could take a book.','only_not_sufficient'],
 ['candles','Dad put out the candles after the song ended.','The song had already ended when Dad put out the candles.','Dad put out the candles before the song ended.','The candles were out before the song began.','after'],
 ['seats','Every seat beside the window was taken. Two seats beside the door were free.','The free seats described were beside the door, not the window.','Two seats beside the window were free.','Every seat beside the door was taken.','every_exception'],
];

function oralComparisons() {
  const output = [];
  for (const [phoneme, words] of Object.entries(FINAL_TARGETS)) for (const word of split(words)) {
    const id = `mock.v9.sounds.final.${word}`, prompt = 'Which word has the same final sound?';
    const labels = FINAL_CHOICES[phoneme].map(([label]) => label), options = choices(labels);
    output.push({ id, skillId: 'final_sounds', domainId: 'sound_awareness', level: 1, format: 'choice', answerMode: 'exact',
      prompt, targetWord: word, choices: options, answer: 'c0', hideWrittenLabels: true, renderTargetText: false,
      modality: 'listening', evidenceModality: 'audio', displayPassageDuringResponse: false,
      requiredAudioCues: [cue('instruction', prompt), cue('target_word', word), ...options.map(c => cue('choice', c.label, c.id))],
      stimulusKey: word, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`,
      constructClaim: 'spoken_final_phoneme_comparison', sourceProvenance: provenance(id),
      taskDemand: { reviewed: true, operation: 'spoken_final_phoneme_comparison', features: { oralComparison: true, position: 'final', requiresLetters: false },
        proof: { targetWord: word, targetFinalPhoneme: phoneme, choiceFinalPhonemes: Object.fromEntries(FINAL_CHOICES[phoneme].map(([, sound], i) => [`c${i}`, sound])) } },
      explanation: `${word} and ${labels[0]} end with the same spoken phoneme.`,
      distractorRationales: Object.fromEntries(options.slice(1).map(c => [c.id, `${c.label} ends with a different phoneme from ${word}.`])),
      mediaDecision: { ...media('Only exact recordings supply target and alternatives; no printed spellings or letter names are delivered.'), role: 'audio-only' },
    });
  }
  for (const word of INITIAL_TARGETS) {
    const key = INITIAL_KEYS[word[0]], labels = [key, ...['dog', 'fish', 'pig'].filter(w => w[0] !== word[0]).slice(0, 2)];
    const options = choices(labels), prompt = 'Which word has the same starting sound?', id = `mock.v9.sounds.initial.${word}`;
    output.push({ id, skillId: 'initial_sounds', domainId: 'sound_awareness', level: 1, format: 'choice', answerMode: 'exact',
      prompt, targetWord: word, choices: options, answer: 'c0', hideWrittenLabels: true, renderTargetText: false,
      modality: 'listening', evidenceModality: 'audio', displayPassageDuringResponse: false,
      constructClaim: 'initial_sound_discrimination', requiredAudioCues: [cue('instruction', prompt), cue('target_word', word), ...options.map(c => cue('choice', c.label, c.id))],
      stimulusKey: word, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`, sourceProvenance: provenance(id),
      explanation: `${word} and ${key} share their initial spoken phoneme.`,
      distractorRationales: Object.fromEntries(options.slice(1).map(c => [c.id, `${c.label} has a different initial phoneme.`])),
      mediaDecision: { ...media('The target and every alternative are recorded; letter matching is not required.'), role: 'audio-only' },
    });
  }
  return output;
}

function construction(word, responseTiles, phonemes, band, extra = {}) {
  const prompt = 'Build the word you hear.', id = `mock.v9.phonics.build.b${band}.${word}`;
  const team = responseTiles.find(tile => /^(ai|ay|ee|ea|oa|oo|ow|ou|oi|ue|igh)$/.test(tile));
  const vowelSpare = ['ai', 'oa', 'ee'].find(tile => !responseTiles.includes(tile));
  const spareTiles = band === 4 ? ['o', 'u', 'z', 'j'].filter(tile => !responseTiles.includes(tile)).slice(0, 2) : [vowelSpare];
  while (spareTiles.length < 2) spareTiles.push(['z', 'v', 'j'].find(tile => !responseTiles.includes(tile) && !spareTiles.includes(tile)));
  if (responseTiles.join('') !== word || phonemes.length !== (band === 4 ? 4 : band === 5 ? 5 : phonemes.length) || band === 6 && phonemes.length < 6) throw Error(`Invalid literal V9 construction: ${word}`);
  const operation = band === 4 ? 'construct_split_vowel_word_with_spares' : band === 5 ? 'construct_five_phoneme_team_word' : 'construct_extended_compound_word';
  return { id, skillId: band === 4 ? 'long_vowels' : 'vowel_teams', domainId: 'phonics', level: 2,
    format: 'build_word', answerMode: 'exact', answer: word, targetWord: word, responseLength: responseTiles.length,
    choices: choices([...responseTiles, ...spareTiles]), prompt, modality: 'dictation', evidenceModality: 'audio+print',
    constructClaim: operation, requiredAudioCues: [cue('instruction', prompt), cue('target_word', word)],
    stimulusKey: word, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`,
    taskDemand: { reviewed: true, operation, features: { phonemeCount: phonemes.length, responseUnitCount: responseTiles.length,
      letterCount: word.length, spareTiles: 2, splitVowel: band === 4, vowelTeam: team || null, ...(band === 6 ? { compound: Boolean(extra.compoundParts), morphemeExtension: Boolean(extra.morphemeExtension) } : {}) },
      proof: { targetWord: word, responseTiles, phonemes, spareTiles, ...extra } },
    difficultyEvidence: band === 4 ? 'Retain four spoken phonemes while coordinating a split vowel across five letter positions and rejecting two spare letters.'
      : band === 5 ? 'Hold five spoken phonemes, retain a vowel team and reject two spare graphemes.'
        : 'Construct six or more spoken phonemes across a meaningful compound or morpheme extension, retaining vowel-team spellings and rejecting two spare graphemes.',
    explanation: `The ordered response units ${responseTiles.join(' + ')} spell ${word}. Silent letters are orthographic units, not additional phonemes.`,
    distractorRationales: Object.fromEntries(spareTiles.map((tile, i) => [`c${responseTiles.length + i}`, `${tile} changes the required spelling of the exact dictated word.`])),
    sourceProvenance: provenance(id), mediaDecision: media('The exact word is dictated. Only silent printed letter/grapheme tiles are offered; pictures and spoken tile labels cannot give away its spelling.'),
  };
}

function correctedBoundaries(base) {
  return Array.from({ length: 8 }, (_, index) => {
    const old = base.find(q => q.id === `mock.capacity.writing.boundary-${index + 1}`);
    if (!old) throw Error(`Missing boundary source ${index + 1}`);
    return { ...strip(old), id: `mock.v9.writing.boundary-${index + 1}`, sourceItemId: `mock.v9.writing.boundary-${index + 1}`,
      choices: old.choices.map(c => ({ ...c, label: c.label.replace(/\.\s+([a-z])/g, (_, letter) => `. ${letter.toUpperCase()}`) })),
      sourceProvenance: { ...provenance(`boundary-${index + 1}`), correctedSourceId: old.id },
      taskDemand: { reviewed: true, operation: 'sentence_boundary', features: { twoCompleteThoughts: true, capitalizationBalanced: true },
        proof: { key: old.choices.find(c => c.id === old.answer).label, wrongBoundaries: 'Both alternatives split within a subject or predicate; all alternatives capitalize after the internal stop.' } },
      requiredAudioCues: [cue('instruction', old.prompt)],
      distractorRationales: { c1: 'Splits the first thought after its first word, leaving fragments.', c2: 'Splits within the second thought rather than between the two complete thoughts.' },
    };
  });
}

function correctedClauses(base) {
  return ['while', 'until'].map(word => {
    const old = base.find(q => q.id === `mock.capacity.writing.complete-hard-${word}`);
    if (!old) throw Error(`Missing dependent-clause source ${word}`);
    return { ...strip(old), id: `mock.v9.writing.dependent-complete.${word}`, sourceItemId: `mock.v9.writing.dependent-complete.${word}`,
      constructClaim: 'distinguish_complete_dependent_clause_sentence',
      taskDemand: { reviewed: true, operation: 'distinguish_complete_dependent_clause_sentence',
        features: { dependentClause: true, mainClauseRequired: true, competingFragments: 2 },
        proof: { dependentClause: word === 'while' ? 'While I held the ladder' : 'until the gate opened',
          mainClause: word === 'while' ? 'Dad climbed up' : 'We waited', key: old.choices.find(c => c.id === old.answer).label } },
      sourceProvenance: { ...provenance(`dependent-complete.${word}`), correctedSourceId: old.id },
    };
  });
}

function scopeItems() {
  return SCOPE_ROWS.map(([slug, passage, key, foilA, foilB, scope]) => {
    const id = `mock.v9.language.scope.${slug}`, prompt = 'Which sentence keeps the same meaning?', options = choices([key, foilA, foilB]);
    return { id, skillId: 'sentence_comprehension', domainId: 'language', level: 2, format: 'choice', answerMode: 'exact',
      prompt, passage, choices: options, answer: 'c0', targetWord: '', modality: 'recognition', evidenceModality: 'audio+text', oralLanguageAccess: true,
      constructClaim: 'preserve_explicit_scope', requiredAudioCues: [cue('instruction', prompt), cue('passage', passage), ...options.map(c => cue('choice', c.label, c.id))],
      stimulusKey: passage.toLowerCase(), canonicalPassageId: passage.toLowerCase(), exposureFamilyId: `v9-language-scope:${slug}`,
      taskDemand: { reviewed: true, operation: 'preserve_explicit_scope', features: { scope, parallelScopeContrasts: 2 },
        proof: { source: passage, retained: key, rejected: [foilA, foilB], distinction: scope } },
      explanation: `The key preserves the passage's ${scope.replaceAll('_', ' ')} relationship.`,
      distractorRationales: { c1: 'Changes a stated quantity, exception, direction or necessary condition.', c2: 'Reverses or removes the same scope relationship.' },
      sourceProvenance: provenance(id), mediaDecision: media('All stimulus and response language is independently replayable; understanding scope is measured without incidental decoding.'),
    };
  });
}

function medialComparisons() {
  return MEDIAL_ROWS.map(([word, key, foilA, foilB, lexicalSet]) => {
    const foils = [foilA, foilB];
    const prompt = 'Which word has the same middle vowel sound?', id = `mock.v9.sounds.medial.${word}`, options = choices([key, ...foils]);
    return { id, skillId: 'short_vowel_discrimination', domainId: 'sound_awareness', level: 2, format: 'choice', answerMode: 'exact',
      prompt, targetWord: word, choices: options, answer: 'c0', hideWrittenLabels: true, modality: 'listening', evidenceModality: 'audio',
      requiredAudioCues: [cue('instruction', prompt), cue('target_word', word), ...options.map(c => cue('choice', c.label, c.id))],
      constructClaim: 'spoken_medial_vowel_discrimination', stimulusKey: word, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`,
      taskDemand: { reviewed: true, operation: 'spoken_medial_vowel_discrimination', features: { sharedLexicalSet: lexicalSet, differentFinalPhonemes: true }, proof: { target: word, key, foils } },
      sourceProvenance: provenance(id), explanation: `${word} and ${key} share the ${lexicalSet} vowel while their outside consonants differ.`,
      distractorRationales: { c1: 'Changes the internal vowel to a different lexical set.', c2: 'Changes the internal vowel to a different lexical set.' },
      mediaDecision: { ...media('Both targets belong to the same vowel lexical set; exact recordings supply every spoken word.'), role: 'audio-only' },
    };
  });
}

function oralBlends() {
  return ORAL_BLENDS.map(([word, sequence, foilA, foilB]) => {
    const id = `mock.v9.sounds.blend.${word}`, prompt = 'Listen to the sounds. Which word do they make?';
    const phones = split(sequence), options = choices([word, foilA, foilB]);
    return { id, skillId: 'sound_manipulation', domainId: 'sound_awareness', level: 2, format: 'choice', answerMode: 'exact',
      prompt, targetWord: word, choices: options, answer: 'c0', hideWrittenLabels: true, renderTargetText: false,
      modality: 'listening', evidenceModality: 'audio', displayPassageDuringResponse: false,
      requiredAudioCues: [cue('instruction', prompt), ...phones.map(text => ({ role: 'phoneme', text, path: getPreferredPhonemeAudioPath(text) || null, required: true })),
        ...options.map(c => cue('choice', c.label, c.id))],
      stimulusKey: sequence, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`,
      constructClaim: 'blend_phonemes', sourceProvenance: provenance(id),
      taskDemand: { reviewed: true, operation: 'blend_phonemes', features: { phonemeCount: 3, requiresLetters: false },
        proof: { targetWord: word, phonemeCueKeys: phones, retained: word, rejected: [foilA, foilB] } },
      explanation: `Blending the three recorded phonemes in order makes ${word}.`,
      distractorRationales: Object.fromEntries(options.slice(1).map(c => [c.id, `${c.label} changes at least one recorded phoneme.`])),
      mediaDecision: { ...media('The stimulus is three atomic phoneme recordings. Only replayable spoken alternatives supply the responses; no print or target-word recording is exposed.'), role: 'audio-only' },
    };
  });
}

function actionItems() {
  return ACTION_ROWS.flatMap(([word, imageName, foilA, foilB]) => [0, 1].map(band => {
    const id = `mock.v9.language.action.${band}.${word}`, image = `/media/vocabulary/images/${imageName}.webp`;
    const prompt = 'Which word matches the picture?', options = choices(band === 0 ? [word, 'moon'] : [word, foilA, foilB]);
    return { id, skillId: 'verbs', domainId: 'language', level: band + 1, foundationBand: band,
      format: 'choice', answerMode: 'exact', prompt, targetWord: word, choices: options, answer: 'c0', image, imageAlt: word,
      modality: 'recognition', evidenceModality: 'audio+image+print',
      requiredAudioCues: [cue('instruction', prompt), ...options.map(c => cue('choice', c.label, c.id))],
      stimulusKey: `action-meaning:${word}`, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`,
      constructClaim: band === 0 ? 'action_word_against_object_word' : 'distinguish_action_word_meaning', sourceProvenance: provenance(id),
      taskDemand: { reviewed: true, operation: band === 0 ? 'action_word_against_object_word' : 'distinguish_action_word_meaning',
        features: { recordedResponses: true, distinctActionFoils: band === 1 }, proof: { picturedAction: word, retained: word, rejected: options.slice(1).map(c => c.label), image } },
      explanation: `The pictured action is ${word}.`,
      distractorRationales: Object.fromEntries(options.slice(1).map(c => [c.id, `${c.label} does not describe the pictured foreground action.`])),
      mediaDecision: { ...media('This exact foreground action raster was visually inspected at child-card size; each foil names an absent action or object.'), role: 'evidence', paths: [image] },
    };
  }));
}

function readingItems() {
  return READING_ROWS.flatMap(([word, image, foilA, foilB], index) => [0, 1].map(band => {
    const id = `mock.v9.reading.word.${band}.${word}`, prompt = 'Which word matches the picture?';
    const distinct = [...READING_ROWS.slice(index + 1), ...READING_ROWS.slice(0, index)]
      .find(([other]) => other[0] !== word[0])[0];
    const options = choices(band === 0 ? [word, distinct] : [word, foilA, foilB]);
    return { id, skillId: 'picture_word_reading', domainId: 'reading', level: band + 1, foundationBand: band,
      format: 'choice', answerMode: 'exact', prompt, targetWord: word, choices: options, answer: 'c0', image, imageAlt: word,
      modality: 'reading', evidenceModality: 'image+print', requiredAudioCues: [cue('instruction', prompt)],
      stimulusKey: `read-picture-word:${word}`, canonicalPassageId: word, exposureFamilyId: `mock-foundation-word:${word}`,
      constructClaim: band === 0 ? 'read_word_distinct_initials' : 'read_complete_cvc_word', sourceProvenance: provenance(id),
      taskDemand: { reviewed: true, operation: band === 0 ? 'read_word_distinct_initials' : 'read_complete_cvc_word',
        features: { silentPrintedResponses: true, sameInitialAlternatives: band === 1 ? 3 : 0 },
        proof: { picturedWord: word, retained: word, rejected: options.slice(1).map(c => c.label), image } },
      explanation: `The complete printed word ${word} names the pictured target.`,
      distractorRationales: Object.fromEntries(options.slice(1).map(c => [c.id, `${c.label} spells a different word from the pictured ${word}.`])),
      mediaDecision: { ...media('The exact target raster was inspected at child-card size. It contains no printed target; the instruction is spoken but every assessed word remains silent.'), role: 'evidence', paths: [image] },
    };
  }));
}

/** Original V9 sources and new immutable replacement identities only. */
export function buildLiteracyMockCorrectionsV9(base) {
  return [
    ...oralComparisons(), ...correctedBoundaries(base), ...correctedClauses(base), ...scopeItems(), ...medialComparisons(), ...oralBlends(), ...actionItems(), ...readingItems(),
    ...SPLIT_BUILDS.map(([word, phones]) => construction(word, [...word], split(phones), 4, { splitVowelPositions: word[2] && /[aeiou]/.test(word[2]) ? [2, 4] : [1, 4] })),
    ...FIVE_BUILDS.map(([word, units, phones]) => construction(word, split(units), split(phones), 5)),
    ...COMPOUND_BUILDS.map(([word, units, phones, parts]) => {
      const unitsOfMeaning = split(parts);
      const meaning = word === 'spoonful' ? { morphemeExtension: { stem: 'spoon', suffix: 'ful' } }
        : unitsOfMeaning.length === 3 ? { compoundParts: [unitsOfMeaning[0], unitsOfMeaning[1] + unitsOfMeaning[2]], morphemeExtension: { stem: unitsOfMeaning.slice(0, 2).join(''), suffix: unitsOfMeaning[2] } }
          : { compoundParts: unitsOfMeaning };
      return construction(word, split(units), split(phones), 6, meaning);
    }),
  ];
}

/** Exact text requests for the existing Leda generator; this never creates audio. */
export function listLiteracyMockCorrectionsV9AudioGaps(base) {
  const gaps = new Map();
  for (const q of buildLiteracyMockCorrectionsV9(base)) for (const c of q.requiredAudioCues) if (!c.path) {
    const role = c.role === 'instruction' ? 'assessment_prompt' : c.role === 'passage' ? 'assessment_passage' : 'isolated_word';
    const key = `${role}:${c.text}`, record = gaps.get(key) || { role, text: c.text, itemIds: [] };
    record.itemIds.push(q.id); gaps.set(key, record);
  }
  return [...gaps.values()];
}
