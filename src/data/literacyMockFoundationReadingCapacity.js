import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { MOCK_PATTERN_WORDS } from './literacyMockFoundationWords.js';
import { literacyMockTaskKey } from '../utils/literacyMockConditions.js';

// Literal lexical targets and sound contrasts. Reusing an instruction does not
// create a new item: every added probe reads a different target word.
const SHORT_READ = {
  a: 'cat hat map pan bag cap rat jam van man nap bat',
  e: 'bed red hen net pet leg peg ten web wet jet pen vet',
  i: 'pig wig pin sip hit lid bin fin kit bit rip dig zip tin sit rim',
  o: 'pot dog log mop hop top cot rod fog dot pop hog cod',
  u: 'sun bug cup mud rug tub cub cut hug jug mug nut pup tug dug hut fun',
};
const SHORT_FOILS = { a: ['bed','pig','sun'], e: ['cat','dog','cup'], i: ['bed','cat','sun'],
  o: ['pig','bed','cup'], u: ['cat','pig','dog'] };
const SOUND_ANCHORS = { long_a: 'cake', long_e: 'tree', long_o: 'home', long_i: 'kite',
  short_e: 'bed', moon: 'blue', cloud: 'out', coin: 'boy', saw: 'saw' };
const SOUND_FOILS = {
  long_a: 'bed pig cup desk nest tent chest shelf shell helmet rabbit pumpkin',
  long_e: 'cat dog cup hand lamp drum brick clock brush rabbit helmet pumpkin',
  long_o: 'pig bed cup nest hand lamp brush chest shelf rabbit helmet plastic',
  long_i: 'cat bed dog hand lamp drum brush chest shelf rabbit helmet pumpkin',
  short_e: 'sea bee tea leaf meat team beach sheep green clean stream screen',
  moon: 'bed pig cat book sock rain point shout chest ground garden rainbow',
  cloud: 'bed pig sun snow moon rain sleep green sheep screen kitten bedroom',
  coin: 'bed sun cat rain food moon green sheep sleep screen rabbit helmet',
  saw: 'bed pig cow moon rain snow cloud green sleep shower flower bedroom',
};
const nearLength = (pool, word) => words(pool).map((value,index)=>({value,index,d:Math.abs(value.length-word.length)}))
  .sort((a,b)=>a.d-b.d||a.index-b.index).slice(0,3).map(row=>row.value);
const EA_SHORT = 'bread head dead spread thread tread dread deaf sweat breath';
const EXCLUDE = {
  'oo:moon': { non: 'book look cook hook took good wood wool foot stood', yes: 'moon spoon food zoo pool boot' },
  'ow:long_o': { non: 'cow now how owl down town brown crown frown clown', yes: 'snow blow grow show slow flow' },
  'ow:cloud': { non: 'snow blow grow show slow flow throw glow crow low', yes: 'cow down town brown crown clown' },
  'ou:cloud': { non: 'soup group youth you could should would touch young double', yes: 'out loud cloud round sound shout' },
};
const R_FOILS = {
  ar: 'corn bird fur shirt skirt nurse church thirst', or: 'car girl her farm park sharp scarf garden',
  er: 'car horn here star fork sharp short north garden', ir: 'car corn deer barn fork sharp short north garden', ur: 'car fork pure star horn sharp short north garden',
};
const R_ANCHORS = { ar: 'car', or: 'fork', er: 'bird', ir: 'fur', ur: 'her' };
const norm = value => String(value || '').toLowerCase().replace(/\s+/g,' ').trim();
const correctLabel = item => item.choices.find(c => c.id === item.answer)?.label || '';
const words = value => value?.split(' ') || [];

export function buildLiteracyMockFoundationReadingCapacity(bank, authoredItem) {
  const output = [];
  const groups = Map.groupBy(bank.filter(item => !item.tutorialOnly), item => JSON.stringify([literacyMockTaskKey(item), item.level]));
  for (const rows of groups.values()) {
    const template = rows[0], claim = template.constructClaim;
    const seen = new Set(rows.map(item => norm(correctLabel(item))).filter(Boolean));
    const usedStimuli = new Set(rows.map(item => norm(item.stimulusKey)));
    let capacity = usedStimuli.size;
    let inventory, mode = '', pattern, sound;
    if (claim.startsWith('identify_read_short_vowel_sound:')) {
      pattern = claim.split(':')[1].at(-1); inventory = words(SHORT_READ[pattern]); mode = 'read-short';
    } else if (claim.startsWith('identify_read_vowel_sound:') || claim.startsWith('match_read_vowel_sound:')) {
      [, pattern, sound] = claim.split(':');
      inventory = words(sound === 'short_e' ? EA_SHORT : MOCK_PATTERN_WORDS[`complete_vowel_team_spelling:${pattern}:${sound}`]?.[template.level]);
      mode = claim.startsWith('match_') ? 'match-team' : 'read-team';
    } else if (claim.startsWith('exclude_read_vowel_sound:')) {
      [, pattern, sound] = claim.split(':'); inventory = words(EXCLUDE[`${pattern}:${sound}`]?.non); mode = 'exclude-team';
    } else if (claim.startsWith('identify_heard_r_controlled_spelling:')) {
      pattern = claim.split(':')[1]; inventory = words(MOCK_PATTERN_WORDS[`complete_r_controlled_spelling:${pattern}`]?.[1]); mode = 'heard-r';
      seen.clear(); rows.forEach(item => seen.add(norm(item.targetWord)));
    } else if (claim.startsWith('match_read_r_controlled_sound:')) {
      pattern = claim.split(':')[1]; inventory = words(MOCK_PATTERN_WORDS[`complete_r_controlled_spelling:${pattern}`]?.[2] + ({er:' berth swerve merge jerk pert',ir:' smirk quirk shirk',ur:' blur spur slur'}[pattern] || '')); mode = 'match-r';
    } else continue;
    for (const word of inventory) {
      if (capacity >= 10) break;
      if (seen.has(word) || usedStimuli.has(word)) continue;
      let correct = word, foils, prompt = template.prompt, target = '', demand;
      if (mode === 'read-short') {
        foils = SHORT_FOILS[pattern];
        demand = 'Read a new CVC target and distinguish its short vowel from three other vowel categories.';
      } else if (mode === 'read-team' || mode === 'match-team') {
        foils = nearLength(SOUND_FOILS[sound], word);
        target = mode === 'match-team' ? SOUND_ANCHORS[sound] : '';
        if (target === word) target = { cloud: 'cloud', coin: 'coin' }[sound];
        demand = mode === 'match-team' ? 'Decode an unseen written word and match its vowel to a spoken anchor, rejecting a competing pronunciation or vowel.'
          : 'Decode a new word and identify the requested vowel sound; no answer word is spoken.';
      } else if (mode === 'exclude-team') {
        foils = words(EXCLUDE[`${pattern}:${sound}`].yes).slice(output.length % 3, output.length % 3 + 3);
        demand = 'Decode every printed word and reject the one that lacks the requested vowel sound, including the other pronunciation of the same letters where available.';
      } else if (mode === 'heard-r') {
        correct = pattern; target = word;
        foils = ['ar','or','er','ir','ur'].filter(value => value !== pattern).slice(0,3);
        demand = 'Retrieve the conventional r-controlled spelling of a new spoken word; this fixed pattern-selection operation retains its stated demand ceiling.';
      } else {
        target = R_ANCHORS[pattern]; foils = nearLength(R_FOILS[pattern], word);
        demand = 'Decode a new printed r-controlled word and match its spoken vowel while rejecting ar/or and an alternative sound, without treating er/ir/ur as different vowel sounds.';
      }
      const values = [correct, ...foils];
      if (new Set(values).size !== values.length) throw new Error(`Duplicate foundation reading choice: ${claim}/${word}`);
      const offset = output.length % values.length;
      const choices = [...values.slice(offset),...values.slice(0,offset)].map((label,index) => ({id:`c${index}`,label}));
      const cues = [{role:'instruction',text:prompt,path:getLedaInstructionAudioPath(prompt)}];
      if (target) cues.push({role:'target_word',text:target,path:getLedaWordAudioPath(target)});
      const identity = `mock-foundation-word:${word}`;
      output.push(authoredItem(template, `reading.${claim.replaceAll(':','-')}.l${template.level}.${word}`, {
        prompt, choices, answer:choices.find(c=>c.label===correct).id, targetWord:target,
        stimulusKey:word, canonicalPassageId:word, exposureFamilyId:identity,
        requiredAudioCues:cues,
        explanation: mode === 'heard-r' ? `${word} conventionally spells its r-controlled vowel with ${pattern}.`
          : mode === 'exclude-team' ? `${word} has a different vowel from ${sound === 'moon' ? 'moon' : sound === 'cloud' ? 'cloud' : 'snow'}; the other three choices share the requested vowel.`
            : `${word} has the requested vowel sound. Each other printed word has a different vowel.`,
        difficultyEvidence:demand,
        distractorRationales:Object.fromEntries(choices.filter(c=>c.label!==correct).map(c=>[c.id,mode === 'heard-r'
          ? `${c.label} does not give the conventional vowel spelling in ${word}.`
          : mode === 'exclude-team' ? `${c.label} has the requested vowel sound, so it is not the exception.`
            : `${c.label} has a different vowel from the requested sound.`])),
        mediaDecision:{role:'audio-and-print',paths:[],constructReview:'approved',answerNeutral:'approved',
          reason:'Directions and a required reference word, where the existing task supplies one, are spoken. Printed word alternatives remain silent.'},
        sourceProvenance:{kind:'original_mock_foundation_capacity',file:'src/data/literacyMockFoundationReadingCapacity.js',sourceId:`${claim}:${word}`,taskTemplate:template.id},
      }));
      seen.add(word); capacity++;
    }
  }
  return output;
}
