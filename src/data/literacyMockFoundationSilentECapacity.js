import { getLedaInstructionAudioPath } from './ledaProductionAudio.js';
import { MOCK_SILENT_E_TWINS } from './literacyMockPhonicsDepth.js';

const ENTRY = {
  a_e:'cake game name gate lake tape cape cane mane made hate rate late same take bake lane pane',
  i_e:'bike kite time ride bite ripe fine pine dime hide mine line nine side',
  o_e:'home bone rope nose cone note hope robe rode code tone dome hole mole pole',
  u_e:'cube tune mule cute tube duke dune rude rule fuse',
};
const FOILS={a_e:['fish','sock','nest'],i_e:['hand','lamp','desk'],o_e:['time','cake','bird'],u_e:['hand','desk','fish']};
export function buildLiteracyMockFoundationSilentECapacity(bank, authoredItem) {
  const output=[];
  for(const [pattern,pairs]of Object.entries(MOCK_SILENT_E_TWINS)) for(const level of[1,2]) {
    const claim=`identify_read_split_vowel_sound:${pattern}`;
    const rows=bank.filter(i=>i.constructClaim===claim&&i.level===level&&!i.tutorialOnly);
    const template=rows[0]||bank.find(i=>i.constructClaim===claim);
    const seen=new Set(rows.map(i=>i.choices.find(c=>c.id===i.answer)?.label));
    const inventory=level===1?ENTRY[pattern].split(' '):Object.keys(pairs);
    const limit=level===2&&pattern==='u_e'?3:10;
    for(const word of inventory) {
      if(seen.size>=limit)break;if(seen.has(word))continue;
      const others=level===1?FOILS[pattern]:[pairs[word],...(word.length>4?pattern==='i_e'?['stone','flute']:['spine','flute']:pattern==='i_e'?['home','cake']:pattern==='a_e'?['time','home']:['time','cake'])];
      const all=[word,...others],shift=output.length%4;
      const choices=[...all.slice(shift),...all.slice(0,shift)].map((label,index)=>({id:`c${index}`,label}));
      const prompt=`Which word has the long ${pattern[0]} sound?`;
      output.push(authoredItem({...template,level},`silent-e-category.${pattern}.l${level}.${word}`,{
        prompt,choices,answer:choices.find(c=>c.label===word).id,
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,
        requiredAudioCues:[{role:'instruction',text:prompt,path:getLedaInstructionAudioPath(prompt)}],
        difficultyEvidence:level===2?'Read the silent-e word while rejecting its real short-vowel twin with unchanged consonant phonemes.'
          :'Identify the long vowel in a clean silent-e word among other familiar vowel categories.',
        explanation:level===2?`${word} has the long vowel; ${pairs[word]} has the short vowel with the same consonant phonemes.`:`${word} has the requested long vowel. The other words have different vowels.`,
        distractorRationales:Object.fromEntries(choices.filter(c=>c.label!==word).map(c=>[c.id,c.label===pairs[word]?'D-PATTERN-TRAP: the short-vowel twin omits the final silent e.':'D-VOWEL: this word has a different vowel sound.'])),
        mediaDecision:{role:'text-only',paths:[],constructReview:'approved',answerNeutral:'approved',reason:'The child reads the printed alternatives; only the direction is narrated.'},
        sourceProvenance:{kind:'original_mock_foundation_capacity',file:'src/data/literacyMockFoundationSilentECapacity.js',sourceId:`${pattern}:${level}:${word}`,taskTemplate:template.id,taskTemplateLevel:level},
      }));seen.add(word);
    }
  }
  return output;
}
