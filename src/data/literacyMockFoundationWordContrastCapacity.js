import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { literacyMockTaskKey } from '../utils/literacyMockConditions.js';

// Every row preserves all consonant phonemes in two real-word vowel foils.
// These are lexical contrasts, not generated letter swaps or hidden nonwords.
export const MOCK_SHORT_VOWEL_CONTRASTS = Object.freeze({
  1: {
    a: ['cat cot cut','bat bet bit','bag beg bug','hat hit hot','pan pen pin','cap cop cup','map mop mope','rat rot rut','tap tip top','jam gem gym','ham hem hum'],
    e: ['bed bad bid','beg bag big','bell ball bill','leg log lug','net nit nut','pen pan pin','pet pat pit','ten tan tin','jet jot jut','peg pig pug'],
    i: ['pig peg pug','pin pan pen','lid led lad','bin ban bun','fin fan fun','kit cat cut','bit bat bet','rip rap rope','dig dog dug','tin tan ton','sit sat set','rim ram room'],
    o: ['pot pat pet','dog dig dug','log leg lug','mop map mope','hop hip heap','top tap tip','cot cat cut','rod red rid','dot date debt','pop pup peep'],
    u: ['sun sin sane','bug bag big','cup cap cop','mud mad mid','rug rag rig','tub tab tube','cub cab cob','cut cat cot','jug jig jog','nut net nit','bud bad bed','hut hot hat'],
  },
  2: {
    a: ['band bend bond','flap flip flop','slap slip slop','stack stick stock','stamp stomp stump','crack crick crock','track trick truck','trap trip troop','hand hind hound'],
    e: ['bend band bond','blend bland blind','desk disk dusk','melt malt molt','step steep stoop','belt bolt built','crest crust crossed','test taste toast','tent tint taint'],
    i: ['disk desk dusk','flip flap flop','slip slap slop','stick stack stock','trip trap troop','brick brake brook','grin grain grown','lift left loft','slit slot slate'],
    o: ['pond pinned penned','plot plate pleat','block black bleak','drop drip drape','stomp stamp stump','loft lift left','crock crack crick','stock stack stick','flop flap flip','cross crass crease'],
    u: ['dusk desk disk','stuck stick stack','stump stamp stomp','lump lamp limp','strut street straight','crust crest crossed','slug slag slog','drum dram dream','must mist most','just jest joist'],
  },
});
const labels = values => values.map((label,index)=>({id:`c${index}`,label}));
const instruction = text => ({role:'instruction',text,path:getLedaInstructionAudioPath(text)});
const cue = text => ({role:'target_word',text,path:getLedaWordAudioPath(text)});
const PICTURE_ROOT = '/images/assessment/literacy-mock/capacity/foundation-';
const wordPicture = (word,pictures) => pictures.get(word) || `${PICTURE_ROOT}${word}.webp`;

export function buildLiteracyMockFoundationWordContrastCapacity(bank, authoredItem, pictures) {
  const output=[];
  const groups=Map.groupBy(bank.filter(i=>!i.tutorialOnly),i=>JSON.stringify([literacyMockTaskKey(i),i.level]));
  for(const rows of groups.values()) {
    const template=rows[0];
    const picture=template.constructClaim.startsWith('match_spoken_short_vowel_word:');
    const heard=template.skillId==='short_vowel_discrimination'&&template.sourceFormat==='LISTEN_FIND_WORD'&&/^short_[aeiou]$/.test(template.constructClaim);
    if(!picture&&!heard)continue;
    const vowel=template.constructClaim.at(-1);
    const seen=new Set(rows.map(i=>i.targetWord));
    for(const row of MOCK_SHORT_VOWEL_CONTRASTS[template.level][vowel]) {
      if(seen.size>=10)break;
      const [word,...foils]=row.split(' ');if(seen.has(word))continue;
      if(picture&&['must','just'].includes(word))continue;
      const shift=output.length%3, values=[word,...foils];
      const choices=labels([...values.slice(shift),...values.slice(0,shift)]);
      const image=picture?wordPicture(word,pictures):'';
      const prompt=picture?'Which word names the picture?':'Which printed word matches the recording?';
      output.push(authoredItem(template,`contrast.${picture?'picture':'heard'}.l${template.level}.short_${vowel}.${word}`,{
        prompt,choices,answer:choices.find(c=>c.label===word).id,targetWord:word,image,imageAlt:image?word:'',
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,
        requiredAudioCues:[instruction(prompt),cue(word)],
        explanation:`${word} matches the complete spoken target. ${foils.join(' and ')} keep the consonant sounds but change the vowel.`,
        difficultyEvidence:template.level===2?'Retain the initial or final consonant cluster while distinguishing two real-word changes to the medial vowel.'
          :'Distinguish the medial short vowel of a spoken three-phoneme word from two real minimal-pair alternatives.',
        distractorRationales:Object.fromEntries(choices.filter(c=>c.label!==word).map(c=>[c.id,`D-VOWEL: ${c.label} preserves the consonant phonemes but changes the spoken vowel in ${word}.`])),
        mediaDecision:{role:image?'target':'audio-and-print',paths:image?[image]:[],constructReview:image.startsWith(PICTURE_ROOT)?'pending':'approved',answerNeutral:'approved',
          reason:'The complete spoken target is required. Printed alternatives are silent; a direct target illustration supports only the existing pictured condition.'},
        sourceProvenance:{kind:'original_mock_foundation_capacity',file:'src/data/literacyMockFoundationWordContrastCapacity.js',sourceId:`${picture?'picture':'heard'}:${vowel}:${word}`,taskTemplate:template.id},
      }));seen.add(word);
    }
  }
  for(const level of [1,2]) {
    const rows=bank.filter(i=>i.skillId==='short_vowel_discrimination'&&i.constructClaim==='spoken_medial_vowel_discrimination'&&i.level===level);
    const template=rows[0],seen=new Set(rows.map(i=>i.targetWord));
    for(const vowel of 'aeiou') {
      if(seen.size>=10)break;
      const word=MOCK_SHORT_VOWEL_CONTRASTS[level][vowel].map(row=>row.split(' ')[0]).find(w=>!seen.has(w));
      const choices=labels([vowel,...[...'aeiou'].filter(v=>v!==vowel).slice(0,3)]);
      const prompt='Which letter spells the middle vowel sound?';
      output.push(authoredItem(template,`medial-vowel.l${level}.${word}`,{prompt,choices,answer:'c0',targetWord:word,
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,requiredAudioCues:[instruction(prompt),cue(word)],
        explanation:`The medial vowel in ${word} is conventionally spelled ${vowel}.`,
        difficultyEvidence:level===2?'Isolate the short vowel while retaining a consonant cluster.':'Isolate the short vowel in a three-phoneme spoken word.',
        distractorRationales:Object.fromEntries(choices.slice(1).map(c=>[c.id,`D-VOWEL: ${c.label} substitutes a different short vowel.`])),
        mediaDecision:{role:'audio-and-print',paths:[],constructReview:'approved',answerNeutral:'approved',reason:'Only the exact target and direction are spoken; printed vowel choices stay silent.'},
        sourceProvenance:{kind:'original_mock_foundation_capacity',file:'src/data/literacyMockFoundationWordContrastCapacity.js',sourceId:`medial:${word}`,taskTemplate:template.id},
      }));seen.add(word);
    }
  }
  const team=bank.find(i=>i.constructClaim==='spoken_to_real_word_vowel_team_recognition'&&i.level===2);
  for(const [word,...foils] of [['point','paint','pint','joint'],['claw','clay','crow','flaw']]) {
    const choices=labels([word,...foils]);const prompt='Which printed word matches the recording?';
    output.push(authoredItem(team,`team-word.${word}`,{prompt,choices,answer:'c0',targetWord:word,
      stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,
      requiredAudioCues:[instruction(prompt),cue(word)],
      explanation:`${word} is the conventional printed spelling of the exact spoken target.`,
      difficultyEvidence:'Read the complete word, retaining its team and rejecting a changed vowel, onset or final consonant.',
      distractorRationales:Object.fromEntries(choices.slice(1).map(c=>[c.id,`${c.label} changes a vowel or consonant in ${word}.`])),
      mediaDecision:{role:'audio-and-print',paths:[],constructReview:'approved',answerNeutral:'approved',reason:'The target word is spoken; all real-word printed alternatives remain silent.'},
      sourceProvenance:{kind:'original_mock_foundation_capacity',file:'src/data/literacyMockFoundationWordContrastCapacity.js',sourceId:`team:${word}`,taskTemplate:team.id},
    }));
  }
  return output;
}
