import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { literacyMockTaskKey } from '../utils/literacyMockConditions.js';

const SOURCE = 'src/data/literacyMockPhonicsLaddersV4.js';
const words = text => text.split(' ');
const norm = text => String(text || '').normalize('NFKC').toLowerCase().trim();
const keyWord = item => norm(item.choices?.find(choice => choice.id === item.answer)?.label);
const target = item => norm(item.targetWord || item.audioText);
const wordIdentity = word => `mock-foundation-word:${word}`;
const instruction = text => ({ role: 'instruction', text, path: getLedaInstructionAudioPath(text) });
const wordCue = text => ({ role: 'target_word', text, path: getLedaWordAudioPath(text) });
const choicesFor = labels => labels.map((label, index) => ({ id: `c${index}`, label }));

// These are literal phoneme-load inventories, not spelling-length heuristics.
// ck, sh, ch, th and doubled consonants are each one phoneme; ship/fish/sock
// therefore cannot become a four-phoneme short-vowel probe merely by having
// four letters. Every listed harder target below has at least four phonemes.
const SHORT = {
  a: { easy: 'cat hat map pan bag cap rat jam van man nap bat', hard: 'flag lamp crab hand band clap flap trap sand camp stack stamp black slap crack track', foils: 'bed pig sun' },
  e: { easy: 'bed red hen net pet leg peg ten web wet jet pen', hard: 'nest vest belt desk sled tent step melt dress bend blend crest test bench', foils: 'cat dog cup' },
  i: { easy: 'pig wig pin sip hit lid bin fin kit bit rip dig', hard: 'brick gift swim click lift slip milk list mist trip stick grin disk flip slit', foils: 'bed cat sun' },
  o: { easy: 'pot dog log mop hop top cot rod fog dot pop hog', hard: 'frog clock pond spot stomp stop drop plot cross loft block stock fox crock', foils: 'pig bed cup' },
  u: { easy: 'sun bug cup mud rug tub cub cut hug jug mug nut', hard: 'drum brush plug truck clump plum stump lump crust jump dusk hunt stuck strut slug', foils: 'cat pig dog' },
};
const STABLE_TEAMS=new Set(['ai:long_a','ay:long_a','ee:long_e','ea:long_e','oa:long_o','igh:long_i']);
const LATER_TEAMS=new Set(['oo:moon','ow:long_o','ow:cloud','ou:cloud','oi:coin','oy:coin','ew:moon','aw:saw']);
const SHORT_READ_CONTRASTS={a:'farm face fall',e:'herd leaf here',i:'mile girl bird',o:'home boat soup',u:'cute hurt put'};
const TEAM_WORD_NEIGHBOURS=['rain raid rail rake','day dad dam dab','bee bed bet beg','leaf leak lean leap','boat boot bolt boast',
  'night nice knife ninth','sheet sheep sheen shell','team teen tear teach','coat coin coal cone','light lime line lice',
  'chain chair chase chalk','train trail tray trap','play plate plane plum','tray trap tram track','green greet greed greek',
  'stream streak street stripe','road roam robe rose','bright bride brine brick','sail said sand salt','hay hat ham had'];
const SPLIT_TWINS={cane:'can',cape:'cap',tape:'tap',mane:'man',made:'mad',rate:'rat',hate:'hat',pane:'pan',plane:'plan',slate:'slat',
  kite:'kit',pine:'pin',ride:'rid',dime:'dim',bite:'bit',ripe:'rip',fine:'fin',slime:'slim',shine:'shin',slide:'slid',
  hope:'hop',note:'not',robe:'rob',rode:'rod',code:'cod',cone:'con',cope:'cop',lobe:'lob',globe:'glob',slope:'slop'};
const DIGRAPH_SEQUENCE_HARD = new Set(words('bench brunch branch chest brush fresh blush plush shrimp thrill thrift think thank black clock crack track brick stick flock trick'));

// The fourteen picture/recording contracts have exactly ten reviewed lexical
// targets apiece. Harder variants deliberately reuse those same word families:
// a learner who encountered clock at entry cannot count clock as fresh later.
// All harder alternatives retain the taught blend. Identifying cl alone no longer
// distinguishes clock/clack/click/cluck; the complete written rime is needed.
const BLEND_NEIGHBOURS = {
  cl: ['clock clack click cluck', 'clap clip clamp clump', 'clam clamp clap clump', 'clip clap click clump', 'clog clock cluck clap', 'club clap clip clog', 'clay claw clack clump', 'claw clay cloud clown', 'cloud clown claw clump', 'clown cloud clay claw'],
  fl: ['flag flap flat flash', 'flat flap flag float', 'flap flip flop flat', 'flip flap flop fled', 'flop flip flap flow', 'flow flew float floor', 'flea flew flow flute', 'flute float flow fly', 'float flute flat flow', 'floor flow float flower'],
  br: ['brush brick bread branch', 'bread braid broom brush', 'brick bridge bring brush', 'bridge brick braid brush', 'brown brain broom bread', 'broom brown bread brush', 'braid bread brain brace', 'branch brush bridge brown', 'broth brush bread brown', 'brace braid brain brick'],
  cr: ['crab crib crack crust', 'crib crab creek crumb', 'crow crown crew cry', 'cry crow crew crab', 'crack creek croak crock', 'crown crow crane crab', 'crust crest crack crock', 'crane crate crown creek', 'crate crane crack crust', 'creek croak crack crock'],
  fr: ['frog from frost front', 'frame fray free fries', 'fruit free freeze fresh', 'frost front frond frown', 'fries fray free freeze', 'frill free fruit front', 'frond front frost frown', 'frown frond frost frame', 'freeze free fries fridge', 'fridge frill frost fruit'],
  st: ['star start storm store', 'stick stock stack stuck', 'stop step steep stem', 'step stop steep steam', 'stem steam storm stump', 'stamp stump stomp stem', 'stone stove store storm', 'stool stall still steel', 'storm store star stem', 'stack stock stick stuck'],
  sk: ['skateboard skate skirt skates', 'skate skirt skit sky', 'skirt skit skate skull', 'skull skill skin skit', 'ski sky skip skin', 'skin skit skid skip', 'sketch skit skate skirt', 'skunk skull skin skid', 'sky ski skip skid', 'skip skid skit skin'],
  sn: ['snake snack snap snip', 'snail snore snout snow', 'snap snip snack snake', 'snow snore snout snail', 'snout snore snow snail', 'sneeze snooze snore snow', 'snack snake snap snip', 'snore snout snow snail', 'snip snap snack snake', 'snowsuit snow snowman snowball'],
  sp: ['spoon spool sport spit', 'spin span spit spot', 'spot spit spat span', 'spider spiral spike spire', 'spade space spare spike', 'sponge spine spoon spade', 'spill spell spin split', 'spool spoon spill spell', 'spike spine spade space', 'spear spare sport spool'],
  nt: ['tent tint taunt dent', 'ant pant rant lint', 'plant slant chant print', 'paint point pint pant', 'point paint pint joint', 'mint lint hint pint', 'joint point paint print', 'dent tent tint bent', 'vent bent dent tent', 'print plant point pint'],
  mp: ['lamp lump limp camp', 'camp lamp damp bump', 'stump stamp stomp clump', 'clamp clump cramp camp', 'stamp stump stomp clamp', 'jump bump lump pump', 'pump bump lump lamp', 'bump pump lump jump', 'ramp camp lamp damp', 'chimp champ chomp crimp'],
  nk: ['pink punk sink wink', 'sink sunk pink bank', 'wink pink sink bank', 'bank bunk tank sink', 'tank bank pink punk', 'trunk prank drink tank', 'skunk bunk sunk sink', 'drink drank drunk trunk', 'plank prank blank blink', 'ink pink sink wink'],
  lt: ['belt bolt built melt', 'melt malt molt felt', 'salt silt bolt belt', 'bolt belt built molt', 'quilt guilt built tilt', 'kilt tilt silt wilt', 'pelt felt melt belt', 'felt pelt melt belt', 'tilt kilt silt wilt', 'vault fault bolt salt'],
  ft: ['gift lift left loft', 'lift left loft gift', 'raft rift craft draft', 'left lift loft gift', 'soft sift shaft shift', 'craft draft drift shaft', 'draft drift craft raft', 'loft left lift soft', 'tuft lift loft left', 'shaft shift sift soft'],
};

const hasExactTargetCue = item => (item.requiredAudioCues || []).some(cue => cue.role === 'target_word'
  && norm(cue.text) === target(item) && target(item));
const hasImage = item => Boolean(item.image || item.choices?.some(choice => choice.image));
const OWN_SKILLS = new Set(['initial_sounds','final_sounds','rhyming','cvc_short_vowels','blends','digraphs','long_vowels','vowel_teams','r_controlled']);
const INITIAL_CLUSTERS = new Set(words('flamingo dragon bread glass flag flap clock clap crab frog brush brick drum stick step snow spoon swim stump plum plug truck'));
const INITIAL_CLUSTER_MAPS = ['flag f l v t','flap f l v b','clock c l g s','clap c l g f','crab c r g b',
  'frog f r v g','brush b r p d','brick b r p k','drum d r t m','stick s t z k','step s t z p','snow s n z o',
  'spoon s p z n','swim s w z m','stump s t z m'];
const INITIAL_CLUSTER_COMPARISONS = ['boat brush ring pig','cap clock lamp goat','fan frog ring van','dog drum ring tent',
  'goat glass lamp cap','pig plum lamp bed','sun snow net zebra','pen plug lamp bed','tent truck ring dog','sock stick tent zebra'];
const RHYME_EASY = ['cat hat dog sun','dog log cat bed','sun fun bed cat','pig wig map cup','hen pen cat dog',
  'bed red dog sun','bug rug pen map','pot cot bed pig','hop mop rat sun','cup pup pig cat'];
const RHYME_HARD = ['hand sand pan bed','belt melt bell cat','camp lamp cap cup','best nest net nut','pink sink pin sock',
  'gift lift kit left','mask task map sock','tent bent ten net','lump jump cup lamp','list mist kit lift'];
const RHYME_PICTURE_HARD = ['hand sand pan bed','belt melt bell cat','camp lamp cap cup','pink sink pin sock',
  'gift lift kit left','tent vent ten net','lump jump cup lamp','list mist kit lift','fox box fog sock','plant ant pan band'];
const multipleCoda = word => /(?:nd|nt|nk|st|sk|ft|lt|mp|ld|lf|lp|lk|pt|ct|ks|x)$/.test(word);
const hasBlend=(word,pattern)=>['nt','mp','nk','lt','ft'].includes(pattern)?word.endsWith(pattern):word.startsWith(pattern);
const sequenceParts=word=>word.match(/ck|sh|ch|th|ss|ll|ff|zz|[a-z]/g);

function buildLength(word, choices) {
  const visit = (offset, used, count) => {
    if (offset === word.length) return count;
    const lengths = choices.flatMap((choice,index) => !used.has(index) && word.startsWith(choice.label,offset)
      ? [visit(offset + choice.label.length,new Set([...used,index]),count+1)] : []);
    return Math.min(...lengths);
  };
  const length = visit(0,new Set(),0);
  return Number.isFinite(length) ? length : undefined;
}

/** Apply only when constructing v4; published v3 snapshots are never passed back through this correction. */
export function correctLiteracyMockPhonicsV4(item) {
  if (item.tutorialOnly || !OWN_SKILLS.has(item.skillId)) return item;
  if(item.sourceProvenance?.kind==='original_mock_phonics_v4')return item;
  const claim = item.constructClaim || '';
  // A v3 snapshot is immutable evidence of v3. It must not override the v4
  // authoring fields when task identities are regrouped before normalization.
  const result = { ...item };
  delete result.itemSnapshot;
  // Evidence metadata follows rendered evidence, not a legacy source's missing
  // field. Merely sharing a broad skill does not make unlike operations one task.
  if (hasExactTargetCue(item)) result.evidenceModality = hasImage(item)
    ? item.hideWrittenLabels ? 'audio+image' : 'audio+image+print' : 'audio+print';
  else if (!item.hideWrittenLabels && item.choices?.every(choice => !choice.image)
    && item.requiredAudioCues?.every(cue => cue.role === 'instruction')) result.evidenceModality = 'text';
  if(item.requiredAudioCues?.some(cue=>cue.role==='instruction'&&/\. (?:Listen to the first sound\.|Which word has the same vowel sound\?)/.test(cue.text))) {
    result.evidenceModality='audio+print';
  }

  if (item.skillId === 'initial_sounds') {
    const clustered = INITIAL_CLUSTERS.has(target(item)) || (claim === 'initial_sound_discrimination'
      && INITIAL_CLUSTERS.has(keyWord(item)));
    result.level = clustered ? 2 : 1;
    result.difficultyEvidence = clustered
      ? 'Isolate the first single phoneme from an adjacent consonant in a spoken onset cluster; the response does not name the whole blend.'
      : 'Identify or compare one initial phoneme in a simple onset. Extra syllables, later taught letters and another occurrence of the same word do not raise this demand.';
    if (target(item)) { result.stimulusKey=target(item); result.exposureFamilyId=wordIdentity(target(item)); }
  }
  if (item.skillId === 'final_sounds' && claim === 'final_sound_grapheme_mapping') {
    // Both levels visibly complete a blank, but L2 can supply a whole cluster.
    // The original L2 direction already says letters/ending; do not call /lt/
    // a single final sound. Existing cue text/paths stay unchanged.
    result.constructClaim = 'complete_spoken_word_ending_spelling';
    const ending = keyWord(item);
    result.level = ['nd','nt','nk','st','sk','ft','lt','mp'].includes(ending) ? 2 : 1;
    if(result.level===2){
      const rivals={nd:['ld','rd','d'],nt:['st','lt','t'],nk:['lk','ck','k'],st:['nt','ft','t'],
        sk:['nk','lk','k'],ft:['st','nt','t'],lt:['nt','st','t'],mp:['lp','p','m']}[ending];
      result.choices=choicesFor([ending,...rivals].slice(0,item.choices.length));result.answer='c0';
      result.distractorRationales=reasons(result.choices,'c0',label=>`${label} omits or changes part of the entire ending ${ending} in ${target(item)}; its last sound alone does not complete this word.`);
    }
    result.difficultyEvidence = result.level === 2
      ? 'Supply the conventional spelling of a two-phoneme ending cluster while rejecting other endings sharing its last phoneme. Matching only the last sound cannot select the key.'
      : 'Complete the conventional spelling of one final spoken phoneme. sh/th/ng and doubled ll are one sound, not two.';
    result.stimulusKey=target(item); result.exposureFamilyId=wordIdentity(target(item));
  }
  if(item.skillId==='final_sounds'&&claim==='final_sound_discrimination'){
    result.level=multipleCoda(target(item))?2:1;
    result.difficultyEvidence=result.level===2?'Isolate one last phoneme from a spoken final consonant cluster while rejecting the immediately preceding consonant.'
      :'Compare a single final phoneme in a simple ending. A spelling digraph still represents one final phoneme.';
    result.stimulusKey=target(item);result.exposureFamilyId=wordIdentity(target(item));
  }
  if (item.skillId === 'final_sounds' && claim === 'final_sound_comparison_with_print_support') {
    result.constructClaim='compare_spoken_final_phoneme_with_print_support';
    result.level=multipleCoda(target(item))&&multipleCoda(keyWord(item))?2:1;
    result.difficultyEvidence=result.level===2?'Isolate one last phoneme after the other consonant in the target’s two-phoneme spoken ending; spoken answer words and visible print support remain available.'
      :'Compare one final spoken phoneme with a spoken answer word and visible print support. sh/th/ng and ll each represent one final sound, so their spelling length does not raise the spoken comparison demand.';
    result.stimulusKey=target(item);result.exposureFamilyId=wordIdentity(target(item));
  }
  if (item.skillId === 'rhyming') {
    const pair = claim === 'spoken_rhyme_pair' && Array.isArray(item.answer)
      ? item.answer.map(id=>norm(item.choices.find(choice=>choice.id===id)?.label)) : [];
    const harder = pair.length ? pair.every(multipleCoda) : multipleCoda(target(item));
    result.level = harder ? 2 : 1;
    result.difficultyEvidence = harder
      ? 'Compare the complete spoken rime, including at least two final consonant phonemes; a shared vowel or just the last consonant is insufficient.'
      : 'Compare a vowel plus one final consonant (or an open spoken rime). A long vowel, spelling digraph, doubled letter or onset cluster is not an extra coda phoneme.';
    if (pair.length) {
      const identity=`rhyme-pair:${pair.sort().join('|')}`;
      result.stimulusKey=identity;result.exposureFamilyId=identity;result.canonicalPassageId=identity;
      if (item.choices.every(choice=>choice.image)
        && item.choices.every(choice=>(item.requiredAudioCues || []).some(cue=>cue.role==='choice' && cue.choiceId===choice.id))) {
        result.evidenceModality='audio+image';
      }
    }
  }

  if (item.skillId === 'blends' && BLEND_NEIGHBOURS[claim] && hasExactTargetCue(item) && item.image) {
    result.constructClaim = `match_spoken_blend_word:${claim}`;
    result.level = 1;
    const originalFoils=item.choices.filter(choice=>choice.id!==item.answer).map(choice=>norm(choice.label));
    const retained=originalFoils.find(word=>hasBlend(word,claim));
    const broad=[...originalFoils,...words('cat bed sun dog')].filter(word=>word!==target(item)&&!hasBlend(word,claim));
    const foils=[...(retained?[retained]:[]),...new Set(broad)].slice(0,3);
    result.choices=choicesFor([target(item),...foils]);result.answer='c0';
    result.distractorRationales=reasons(result.choices,'c0',label=>hasBlend(label,claim)
      ?`${label} retains ${claim} but changes another phoneme of the exact spoken word.`
      :`${label} omits or changes ${claim} in the exact spoken word.`);
    result.difficultyEvidence = 'Match an exact pictured and spoken word to silent print; only one foil can retain the taught blend, so two broad omissions/substitutions support the entry discrimination.';
  }
  // Native v3 used one claim for both supplying a cluster and selecting a whole
  // printed word. These response operations remain distinct in v4.
  if (item.skillId === 'blends' && claim === 'map_spoken_word_to_blend_spelling') {
    const fullWord = keyWord(item) === target(item);
    result.constructClaim = fullWord ? 'match_spoken_blend_word' : 'complete_heard_blend_spelling';
    if (item.level === 2 && fullWord) {
      result.level = 1;
      result.difficultyEvidence = 'Match the exact spoken word to print. Later taught blend names alone do not establish a harder reading operation.';
    } else if (item.level === 2 && !fullWord) {
      const blank = item.prompt.match(/([a-z]*)(__)([a-z]*)/i);
      if (!blank?.[1] && !/^(?:spr|str|spl|scr|squ)/.test(target(item))) result.level = 1;
      result.difficultyEvidence = result.level === 2
        ? 'Locate and supply a consonant cluster after earlier phonemes, rather than completing the initial two-consonant onset.'
        : 'Supply the initial two-consonant cluster of an exact heard word; changing the taught cluster name is comparable entry evidence.';
    }
  }
  const short = claim.match(/^(identify_read_short_vowel_sound|complete_short_vowel_spelling|construct_short_vowel_phoneme_sequence|match_spoken_short_vowel_word):short_([aeiou])$/);
  if (short) {
    const word = short[1] === 'identify_read_short_vowel_sound' ? keyWord(item) : target(item);
    const harder = words(SHORT[short[2]].hard).includes(word);
    result.level = harder ? 2 : 1;
    result.difficultyEvidence = harder
      ? short[1] === 'identify_read_short_vowel_sound'
        ? 'Read a short-vowel word containing at least four phonemes, retaining its initial or final consonant cluster while identifying the vowel.'
        : 'Locate or retain the short vowel within at least four phonemes, including an initial or final consonant cluster.'
      : 'Read or supply the medial short vowel in a three-phoneme word. A consonant digraph or doubled letter does not add a phoneme.';
    if (short[1] === 'construct_short_vowel_phoneme_sequence') {
      result.prompt = 'Build the word you hear.';
      result.requiredAudioCues = [instruction(result.prompt), wordCue(word)];
      result.responseLength = buildLength(word,item.choices);
    }
    if(short[1]==='identify_read_short_vowel_sound'&&harder){
      result.choices=choicesFor([word,...words(SHORT_READ_CONTRASTS[short[2]])]);result.answer='c0';
      result.distractorRationales=reasons(result.choices,'c0',label=>`${label} retains the written vowel letter but gives it a different conventional vowel sound.`);
      result.difficultyEvidence='Reject three real words retaining the same written vowel letter but giving it different conventional vowel sounds. Letter presence and an onset shortcut cannot identify the key.';
    }
    if(['complete_short_vowel_spelling','match_spoken_short_vowel_word'].includes(short[1])){
      result.level=1;result.demandCeiling=1;
      result.ceilingReason='The fixed variable-vowel response supplies the other consonants. Adding a supplied cluster does not require building or identifying more phonemes; use the complete phoneme-sequence or reviewed reading-contrast ladder for adaptive evidence.';
      result.difficultyEvidence=result.ceilingReason;
    }
  }
  const team = claim.match(/^(complete_vowel_team_spelling|identify_read_vowel_sound):(.+)$/);
  if (team && STABLE_TEAMS.has(team[2])) {
    result.level=1;result.demandCeiling=1;
    result.ceilingReason='A fixed taught vowel-team spelling can be selected from its letters; the other supplied consonants do not require a higher response. Exact spoken-word matching with close real neighbours supplies the adaptive decoding ladder.';
    result.difficultyEvidence=result.ceilingReason;
  }
  if(claim==='identify_read_vowel_sound:ea:short_e'){
    result.level=1;result.demandCeiling=1;
    result.ceilingReason='Adding a transparent compound to the same vowel-category decision does not require decoding every supplied phoneme. Use exact spoken-word matching for adaptive decoding evidence.';
    result.difficultyEvidence=result.ceilingReason;
  }
  const later=claim.match(/^(complete_vowel_team_spelling|match_read_vowel_sound|exclude_read_vowel_sound):(.+)$/);
  if(later&&LATER_TEAMS.has(later[2])){
    const word=later[1]==='complete_vowel_team_spelling'?target(item):keyWord(item);
    result.level=1;result.demandCeiling=1;
    result.ceilingReason='The fixed taught spelling/sound selection supplies the other consonants. Neither a later pattern label nor supplied extra letters proves a harder response; use the exact spoken-word matching ladder.';
    result.difficultyEvidence=result.ceilingReason;
    result.exposureFamilyId=wordIdentity(word);
    if(later[1]==='exclude_read_vowel_sound')result.stimulusKey=word;
  }
  const split = claim.match(/^identify_read_split_vowel_sound:(a_e|i_e|o_e)$/);
  if (split) {
    const word=keyWord(item),twin=SPLIT_TWINS[word],closeContrast=twin&&item.choices.some(choice=>norm(choice.label)===twin);
    result.level=closeContrast?2:1;
    result.difficultyEvidence=closeContrast?'Decode the long vowel while rejecting its real short-vowel twin with the same other consonants; onset or final-consonant matching cannot decide between them.'
      :'Decode the split vowel against words with different consonants and vowels. Supplied clusters alone do not require a stronger vowel decision.';
  }
  if(item.skillId==='digraphs'&&claim==='map_spoken_word_to_digraph_spelling'){
    const blank=item.prompt.match(/([a-z]*)(__)([a-z]*)/i),later=Boolean(blank?.[1]);
    result.level=later?2:1;
    result.difficultyEvidence=later?'Locate the digraph after earlier spoken phonemes while completing the conventional spelling of an exact supplied word.'
      :'Supply the initial digraph in an exact supplied word. Another word length or later taught digraph is not a higher response operation.';
    result.stimulusKey=target(item);result.exposureFamilyId=wordIdentity(target(item));
  }
  if (item.skillId==='digraphs' && claim==='construct_dictated_word') {
    result.level=DIGRAPH_SEQUENCE_HARD.has(target(item))?2:1;
    result.prompt='Build the word you hear.';
    result.requiredAudioCues=[instruction(result.prompt),wordCue(target(item))];
    result.responseLength=buildLength(target(item),item.choices);
    result.difficultyEvidence=result.level===2?'Retain and order at least four spoken phonemes while representing a digraph with its conventional spelling.'
      :'Retain and order three spoken phonemes. chick/shell/chess/chill/shock/shack/check/thick each still has three phonemes despite extra printed letters.';
  }
  // All er/ir/ur alternatives share the /er/ vowel in the reference accent.
  // Retained L2 completion must actually include both sibling spellings.
  // Fixed ar/or choice remains entry evidence.
  // More consonants, or a repeated L1 word with the same distractors, is not proof.
  if (claim.startsWith('complete_r_controlled_spelling:')) {
    const pattern = claim.split(':')[1], labels = item.choices.map(choice => norm(choice.label));
    const siblings = ['er', 'ir', 'ur'].filter(value => value !== pattern);
    const hardContrast = ['er','ir','ur'].includes(pattern) && siblings.every(value => labels.includes(value));
    result.level = hardContrast ? 2 : 1;
    result.difficultyEvidence = hardContrast
      ? 'Retrieve the conventional spelling of the supplied word while rejecting both of the other er/ir/ur spellings of the same vowel sound.'
      : 'Select the conventional r-controlled spelling against alternatives with a different vowel; extra consonants alone do not establish a harder tier.';
    result.stimulusKey=target(item);result.exposureFamilyId=wordIdentity(target(item));
    if(['er','ir','ur'].includes(pattern)){
      result.choices=choicesFor(hardContrast?[pattern,...siblings]:[pattern,'ar','or']);result.answer='c0';
      result.distractorRationales=reasons(result.choices,'c0',label=>hardContrast
        ?`${label} can spell the same vowel elsewhere, but does not give the conventional spelling of ${target(item)}.`
        :`${label} spells a different vowel from the supplied word ${target(item)}.`);
    }
  }
  if (claim.startsWith('match_read_r_controlled_sound:')) {
    result.level=1;result.demandCeiling=1;
    result.ceilingReason='The supplied consonants do not increase the fixed r-vowel comparison. The reviewed er/ir/ur conventional-spelling contrast supplies a separate complete adaptive spelling ladder.';
    // Repeated heard car/her/fur anchors do not create a new independent
    // stimulus. The silent keyed lexical word remains part of the alias.
    result.exposureFamilyId=wordIdentity(keyWord(item));
    result.canonicalPassageId=keyWord(item);
    result.difficultyEvidence=result.ceilingReason;
  }
  if (claim === 'spoken_to_real_word_vowel_team_recognition') {
    result.level = 1;
    result.difficultyEvidence = 'Match an exact spoken word to silent print. A later taught vowel-team label does not make this same recognition operation harder.';
  }
  if (claim === 'heard_sound_picture_discrimination' && item.skillId === 'digraphs') {
    const final = /final|last/.test(item.prompt);
    result.constructClaim = final ? 'compare_spoken_final_digraph_sound' : 'compare_spoken_initial_digraph_sound';
    // A different initial letter spelling is not extra spoken discrimination.
    if (!final) result.level = 1;
    result.difficultyEvidence = final
      ? 'Compare the last spoken phoneme after the preceding word sounds; initial-sound comparison is a separate task.'
      : 'Compare a single initial spoken phoneme. A longer word or a different spelling of that sound does not establish a harder operation.';
  }
  return result;
}

function make(template, id, extras) {
  const identity = `mock.v4.phonics.${id}`;
  const base={...template};
  for(const key of ['itemSnapshot','finiteInventory','demandCeiling','ceilingReason','ceilingNextTask'])delete base[key];
  return { ...base, id: identity, canonicalItemId: identity, sourceItemId: identity,
    tutorialOnly: false, targetWord: '', image: '', imageAlt: '', passage: '', renderTargetText: false,
    sourceProvenance: { kind: 'original_mock_phonics_v4', file: SOURCE, sourceId: id, taskTemplate: template.id },
    ...extras };
}
const printDecision = reason => ({ role: 'audio-and-print', paths: [], constructReview: 'approved', answerNeutral: 'approved', reason });
const reasons = (choices, answer, rationale) => Object.fromEntries(choices.filter(choice => choice.id !== answer)
  .map(choice => [choice.id, rationale(choice.label)]));

/** Raw normalized-shape additions. Parent normalizes/retags and snapshots these for v4 only. */
export function buildLiteracyMockPhonicsLaddersV4(bank) {
  const corrected = bank.map(item => correctLiteracyMockPhonicsV4(item));
  const recordedWords=new Map();
  for(const item of bank)for(const cue of item.requiredAudioCues||[]){
    if(cue.role==='target_word'&&cue.path&&norm(cue.text)===target(item))recordedWords.set(norm(cue.text),cue);
  }
  // A reviewed recording may have explicit provenance rather than a generic
  // resolver alias (serve). Preserve that exact cue instead of declaring the
  // word ready from a guessed path or silently replacing its recording.
  const wordCue=text=>recordedWords.has(norm(text))?{...recordedWords.get(norm(text)),role:'target_word',text}
    :{role:'target_word',text,path:getLedaWordAudioPath(text)};
  const output = [];
  const pictures = new Map();
  for (const item of bank.filter(item => item.mediaReady)) {
    if (item.image && target(item)) pictures.set(target(item),item.image);
    for (const choice of item.choices || []) if (choice.image) pictures.set(norm(choice.label),choice.image);
  }
  const groups = Map.groupBy(corrected.filter(item => OWN_SKILLS.has(item.skillId) && !item.tutorialOnly), literacyMockTaskKey);
  const add = (template, level, word, extras, suffix = '') => {
    const rows = [...(groups.get(literacyMockTaskKey(template)) || []), ...output.filter(item => literacyMockTaskKey(item) === literacyMockTaskKey(template))];
    if (rows.some(item => item.level === level && (target(item) || keyWord(item)) === word)) return;
    output.push(make(template, `${template.constructClaim.replaceAll(':','-')}.${template.evidenceModality || 'undeclared'}.l${level}.${word}${suffix}`, {
      level, stimulusKey: word, canonicalPassageId: word, exposureFamilyId: wordIdentity(word), ...extras,
    }));
  };

  for (const rows of groups.values()) {
    const template = rows[0], claim = template.constructClaim;
    if(claim==='spoken_to_real_word_vowel_team_recognition'){
      for(const row of TEAM_WORD_NEIGHBOURS){
        const [word,...neighbours]=words(row);
        for(const level of [1,2]){
          const labels=level===2?[word,...neighbours]:[word,...words('bed pig cup cat dog sun').filter(value=>value!==word).slice(0,3)];
          const choices=choicesFor(labels);
          add(template,level,word,{prompt:'Which printed word matches the recording?',targetWord:word,choices,answer:'c0',evidenceModality:'audio+print',
            requiredAudioCues:[instruction('Which printed word matches the recording?'),wordCue(word)],
            explanation:`${word} matches the exact spoken word. The other words change or add one or more spoken phonemes.`,
            difficultyEvidence:level===2?'Reject real neighbours that retain the spoken onset and share much of the written word. Matching the initial sound or taught vowel pattern alone cannot select the exact word.'
              :'Match the exact spoken word to silent print against broad familiar alternatives; the initial sound or vowel can distinguish the entry choices.',
            distractorRationales:reasons(choices,'c0',label=>`${label} shares or changes part of ${word} but does not represent the complete supplied spoken word.`),
            mediaDecision:printDecision('Exact existing target-word audio supplies access at both levels; all written alternatives remain silent, requiring an exact whole-word print match.'),
          });
        }
      }
    }
    const readShort=claim.match(/^identify_read_short_vowel_sound:short_([aeiou])$/);
    if(readShort){
      const vowel=readShort[1],inventory=SHORT[vowel];
      for(const level of [1,2])for(const word of words(level===1?inventory.easy:inventory.hard)){
        const choices=choicesFor([word,...words(level===2?SHORT_READ_CONTRASTS[vowel]:inventory.foils)]);
        add(template,level,word,{choices,answer:'c0',evidenceModality:template.evidenceModality,
          requiredAudioCues:template.requiredAudioCues,
          explanation:`${word} has the requested short vowel. The other words give the written vowel a different conventional sound.`,
          difficultyEvidence:level===2?'Reject three real alternatives retaining the same written vowel letter but giving it different conventional pronunciations; letter presence and initial-letter matching cannot key the response.'
            :'Identify the requested short vowel against broad alternatives with different written vowel letters.',
          distractorRationales:reasons(choices,'c0',label=>`${label} gives the vowel a different conventional sound from the requested short vowel.`),
          mediaDecision:printDecision('The exact template instruction, including any concrete heard vowel anchor, is preserved. Silent printed alternatives carry the vowel evidence.'),
        });
      }
    }
    if (template.skillId==='r_controlled' && claim.startsWith('complete_r_controlled_spelling:')) {
      const pattern=claim.split(':')[1];
      if (['er','ir','ur'].includes(pattern)) for(const word of new Set(rows.map(target).filter(Boolean))) {
        const choices=choicesFor([pattern,'ar','or']);
        add(template,1,word,{prompt:`Which letters complete ${word.replace(pattern,'__')}?`,targetWord:word,choices,answer:'c0',
          requiredAudioCues:[instruction('Which letters complete the word?'),wordCue(word)],
          explanation:`The conventional spelling of ${word} uses ${pattern}. ar and or spell different vowel sounds.`,
          difficultyEvidence:'Select the conventional r-controlled spelling against two different-sound vowel spellings. The harder tier must reject both same-sound er/ir/ur siblings.',
          distractorRationales:reasons(choices,'c0',label=>`${label} changes the vowel spelling and sound of ${word}.`),
          mediaDecision:printDecision('Exact heard target audio supplies the word; the incomplete printed form and silent spelling choices carry spelling evidence.'),
        });
      }
    }
    if(template.skillId==='digraphs'&&claim==='construct_dictated_word'){
      for(const word of DIGRAPH_SEQUENCE_HARD){
        const image=pictures.get(word);if(hasImage(template)&&!image)continue;
        const graphemes=sequenceParts(word),choices=choicesFor(graphemes);
        add(template,2,word,{prompt:'Build the word you hear.',format:'build_word',answer:word,targetWord:word,choices,responseLength:graphemes.length,
          image:hasImage(template)?image:'',imageAlt:hasImage(template)?word:'',
          requiredAudioCues:[instruction('Build the word you hear.'),wordCue(word)],
          explanation:`Order ${graphemes.join(' + ')} to spell the complete spoken word ${word}.`,
          difficultyEvidence:'Retain and order at least four spoken phonemes, including an adjacent consonant cluster, while representing a digraph with its conventional spelling.',
          distractorRationales:{},
          mediaDecision:{...printDecision('The exact existing recording supplies the spelling target. Existing reviewed pictures retain entry access; visible tiles are the response and no printed target model appears.'),role:hasImage(template)?'target':'audio-and-print',paths:hasImage(template)?[image]:[]},
        });
      }
    }
    if (template.skillId === 'rhyming' && claim === 'spoken_rhyme_discrimination') {
      const audioTemplate={...template,evidenceModality:'audio',image:'',choices:template.choices.map(choice=>{
        const result={...choice};delete result.image;delete result.imageAlt;return result;
      })};
      for (const level of [1,2]) for (const row of level===1?RHYME_EASY:RHYME_HARD) {
        const [word,correct,...foils]=words(row), choices=choicesFor([correct,...foils]);
        add(audioTemplate,level,word,{prompt:'Which word rhymes with the word you hear?',targetWord:word,choices,answer:'c0',
          hideWrittenLabels:true,evidenceModality:'audio',
          requiredAudioCues:[instruction('Which word rhymes with the word you hear?'),wordCue(word),
            ...choices.map(choice=>({role:'choice',choiceId:choice.id,value:choice.label,text:choice.label,path:getLedaWordAudioPath(choice.label)}))],
          explanation:`${word} and ${correct} share the complete vowel and ending; ${foils.join(' and ')} change or omit part of that spoken rime.`,
          difficultyEvidence:level===2?'Retain a two-phoneme final coda when comparing the whole spoken rime; reject a shorter partial rime or a changed vowel/coda.'
            :'Compare a simple vowel-plus-one-consonant spoken rime against different broad rimes.',
          distractorRationales:reasons(choices,'c0',label=>`${label} omits or changes a vowel or consonant of the complete ending in ${word}; a partial ending match does not rhyme.`),
          mediaDecision:{...printDecision('An explicitly authored audio-only rhyme task supplies exact target and choice recordings. Hidden spellings and numbered replay controls preserve the spoken comparison.'),role:'audio-only'},
        });
      }
    }
    if (template.skillId === 'rhyming' && claim === 'spoken_rhyme_pair') {
      for (const row of RHYME_PICTURE_HARD) {
        const [first,second,...foils]=words(row), labels=[first,second,...foils];
        if (labels.some(label=>!pictures.get(label))) continue;
        const choices=choicesFor(labels).map(choice=>({...choice,image:pictures.get(choice.label),imageAlt:choice.label}));
        const identity=`rhyme-pair:${[first,second].sort().join('|')}`;
        if (rows.some(item=>item.stimulusKey===identity&&item.level===2)) continue;
        add(template,2,`${first}-${second}`,{format:'multi_select',answerMode:'set',selectCount:2,
          prompt:'Choose the two pictures that rhyme.',choices,answer:['c0','c1'],hideWrittenLabels:true,evidenceModality:'audio+image',
          stimulusKey:identity,canonicalPassageId:identity,exposureFamilyId:identity,
          requiredAudioCues:[instruction('Choose the two pictures that rhyme.'),...choices.map(choice=>({role:'choice',choiceId:choice.id,value:choice.label,text:choice.label,path:getLedaWordAudioPath(choice.label)}))],
          explanation:`${first} and ${second} share the entire spoken rime, including both final consonant phonemes. The other words change or omit part of that rime.`,
          difficultyEvidence:'Select a complete spoken rhyme pair with at least two coda phonemes; reject a partial-rime neighbour while comparing four spoken alternatives.',
          distractorRationales:Object.fromEntries(choices.filter(choice=>!['c0','c1'].includes(choice.id))
            .map(choice=>[choice.id,`${choice.label} omits or changes part of the complete vowel-plus-cluster rime.`])),
          mediaDecision:{role:'answer-cards',paths:choices.map(choice=>choice.image),constructReview:'approved',answerNeutral:'approved',
            reason:'The existing reviewed exact-word pictures and recordings supply every card. Spelling labels remain hidden; two final phonemes, not printed letters, create the added demand.'},
        });
      }
    }
    if (template.skillId === 'initial_sounds' && claim === 'initial_sound_discrimination') {
      for (const row of INITIAL_CLUSTER_COMPARISONS) {
        const [word,...labels]=words(row), original=rows.find(item=>target(item)===word);
        if (!original || labels.some(label=>!pictures.get(label))) continue;
        const choices=choicesFor(labels).map(choice=>({...choice,image:pictures.get(choice.label),imageAlt:choice.label}));
        add(template,2,word,{prompt:original.prompt,targetWord:word,choices,answer:'c0',hideWrittenLabels:true,
          requiredAudioCues:[...original.requiredAudioCues.filter(cue=>cue.role==='instruction'||cue.role==='target_word'),
            ...choices.map(choice=>({role:'choice',choiceId:choice.id,value:choice.label,text:choice.label,path:getLedaWordAudioPath(choice.label)}))],
          evidenceModality:'audio+image',
          explanation:`${word} and ${labels[0]} share the first single phoneme. ${labels[1]} instead matches the second consonant inside the correct choice's onset.`,
          difficultyEvidence:'Extract the first phoneme from the correct choice’s consonant cluster rather than match its second cluster member or a voiced/unvoiced near sound.',
          distractorRationales:reasons(choices,'c0',label=>label===labels[1]?`${label} matches a later member of the consonant cluster, not its first phoneme.`:`${label} changes the requested initial phoneme.`),
          mediaDecision:{role:'answer-cards',paths:choices.map(choice=>choice.image),constructReview:'approved',answerNeutral:'approved',
            reason:'The existing exact anchor instruction and target recording are unchanged; every new hidden-label answer card has its reviewed picture and exact word recording.'},
        });
      }
    }
    if (template.skillId==='final_sounds' && ['complete_spoken_word_ending_spelling','compare_spoken_final_phoneme_with_print_support'].includes(claim)
      && hasImage(template)) {
      const otherRows=corrected.filter(item=>item.skillId===template.skillId&&item.constructClaim===claim&&item.level===2&&!hasImage(item));
      for(const item of otherRows){
        const word=target(item),image=pictures.get(word);if(!image)continue;
        const extras={...item};
        for(const key of ['id','canonicalItemId','sourceItemId','itemSnapshot','sourceProvenance'])delete extras[key];
        add(template,2,word,{...extras,image,imageAlt:word,evidenceModality:template.evidenceModality,
          distractorRationales:reasons(item.choices,item.answer,label=>`${label} omits, changes or selects only part of the requested spoken ending of ${word}.`),
          mediaDecision:{role:'target',paths:[image],constructReview:'approved',answerNeutral:'approved',
            reason:'The existing exact ending instruction/recording and response choices are retained, with an existing reviewed exact-target picture matching the entry access condition.'},
        },'.pictured');
      }
    }
    if (template.skillId === 'initial_sounds' && claim === 'initial_sound_grapheme_mapping') {
      for (const row of INITIAL_CLUSTER_MAPS) {
        const [word,...labels] = words(row), image = pictures.get(word);
        if (hasImage(template) && !image) continue;
        const choices = choicesFor(labels);
        add(template,2,word,{prompt:'Listen to the word. What is the first sound?',targetWord:word,choices,answer:'c0',
          image:hasImage(template)?image:'',imageAlt:hasImage(template)?word:'',
          requiredAudioCues:[instruction('Listen to the word. What is the first sound?'),wordCue(word)],
          explanation:`${word} begins with the single sound represented by ${labels[0]}. ${labels[1]} represents the next consonant in its onset, not the first.`,
          difficultyEvidence:'Isolate the first single phoneme of a two-consonant spoken onset while rejecting the immediately following cluster member and a close voiced/unvoiced alternative.',
          distractorRationales:reasons(choices,'c0',label=>label===labels[1]?`${label} selects the next consonant inside the onset instead of the first phoneme.`:`${label} changes the first phoneme of ${word}.`),
          mediaDecision:{...printDecision('The exact existing spoken word supplies the phonological stimulus; the reviewed target picture retains entry access. The response is one sound-mapping letter, never the whole blend.'),role:hasImage(template)?'target':'audio-and-print',paths:hasImage(template)?[image]:[]},
        });
      }
    }
    const buildShort = claim.match(/^construct_short_vowel_phoneme_sequence:short_([aeiou])$/);
    if (buildShort) {
      const inventory = SHORT[buildShort[1]];
      for (const level of [1,2]) for (const word of words(level === 1 ? inventory.easy : inventory.hard)) {
        // x spells /k s/. It is a legitimate four-phoneme reading target but
        // cannot serve as one tile in a one-tile-per-phoneme sequence task.
        if(word.includes('x'))continue;
        const image = pictures.get(word);
        // The current task's picture requirement cannot be converted into a
        // text-only task to fill its pool. Missing reviewed pictures stay out.
        if (hasImage(template) && !image) continue;
        const graphemes = sequenceParts(word);
        const choices = choicesFor(graphemes);
        add(template,level,word,{prompt:'Build the word you hear.',format:'build_word',answer:word,
          targetWord:word,choices,responseLength:graphemes.length,
          image:hasImage(template)?image:'',imageAlt:hasImage(template)?word:'',
          evidenceModality:hasImage(template)?'audio+image+print':'audio+print',
          requiredAudioCues:[instruction('Build the word you hear.'),wordCue(word)],
          explanation:`Order ${graphemes.join(' + ')} to spell the complete spoken word ${word}.`,
          difficultyEvidence:level===2?'Retain and order at least four phonemes, including an initial or final consonant cluster, rather than the three-phoneme entry sequence.'
            :'Retain and order the complete three-phoneme short-vowel sequence.',
          distractorRationales:{},
          mediaDecision:{...printDecision('Existing exact word audio supplies the spelling stimulus; visible tiles are the response, without a printed target model.'),
            role:hasImage(template)?'target':'audio-and-print',paths:hasImage(template)?[image]:[]},
        });
      }
    }
    const blend = claim.match(/^match_spoken_blend_word:(cl|fl|br|cr|fr|st|sk|sn|sp|nt|mp|nk|lt|ft)$/);
    if (blend) for (const row of BLEND_NEIGHBOURS[blend[1]]) {
      const [word, ...foils] = words(row), original = rows.find(item => target(item) === word);
      if (!original?.image || !hasExactTargetCue(original)) throw new Error(`Missing reviewed v4 blend target contract: ${word}`);
      const choices = choicesFor([word, ...foils]);
      add(template, 2, word, { prompt: 'Which word names the picture?', choices, answer: 'c0', targetWord: word,
        image: original.image, imageAlt: original.imageAlt,
        evidenceModality: 'audio+image+print',
        requiredAudioCues: [instruction('Which word names the picture?'), wordCue(word)],
        explanation: `${word} matches the exact pictured and spoken target. Every alternative keeps ${blend[1]}, so the child must read the complete word.`,
        difficultyEvidence: `Reject three real neighbours that retain ${blend[1]} by reading the other phonemes. Matching the blend alone could distinguish the entry options but cannot answer this item.`,
        distractorRationales: reasons(choices, 'c0', label => `${label} retains ${blend[1]} but changes other phonemes of ${word}; matching the blend alone is insufficient.`),
        mediaDecision: { ...printDecision('The exact existing reviewed picture and word recording retain the entry access contract. Silent neighbours require complete print discrimination.'), role:'target', paths:[original.image] },
      });
    }


  }
  return output;
}
