import {getLiteracyMockAudioV11Path} from './literacyMockAudioV11.js';
import { getLedaInstructionAudioPath } from './ledaProductionAudio.js';

const FILE = 'src/data/literacyMockWritingCapacityV11.js';
const NAMES = ['Ada','Ava','Bo','Eva','Ian','Ida','Ivy','Jay','Joe','Joy','Kai','Kim','Leo','Lou','May','Meg','Sam','Sue','Tom','Zoe'];
const PROMPT = 'Choose the name with one capital at the start.';

// Reserve real names against every active capitalization use, including names
// embedded in Starter sentences and canonical aliases. A different case form,
// sentence or option set cannot turn an encountered name into fresh evidence.
function usedCapitalizationWords(base) {
  const used = new Set();
  for (const item of base) {
    if (!item.adaptiveMixedEligible || item.skillId !== 'capitalization') continue;
    const values = [item.prompt,item.passage,item.targetWord,item.canonicalPassageId,item.stimulusKey,item.exposureFamilyId,
      item.taskDemand?.proof?.targetName,...(item.choices || []).map(choice => choice.label)];
    for (const value of values) if (typeof value === 'string') for (const word of value.toLowerCase().match(/[a-z]+/g) || []) used.add(word);
  }
  return used;
}

/** Fresh familiar name-case observations at the existing writing entry task.
 * Names are silent printed evidence. Only the existing instruction is spoken;
 * no new recording or picture is required for this capitalization operation. */
export function buildLiteracyMockWritingCapacityV11(base, normalize) {
  const instruction = getLedaInstructionAudioPath(PROMPT)||getLiteracyMockAudioV11Path(PROMPT,['assessment_prompt']);
  const used = usedCapitalizationWords(base), output = [];
  for (const name of NAMES) {
    const lower = name.toLowerCase();
    if (used.has(lower)) continue;
    const misplaced = `${lower.slice(0,-1)}${lower.at(-1).toUpperCase()}`;
    const forms = [name,lower,misplaced,name.toUpperCase()];
    if (new Set(forms).size !== 4) throw Error(`Invalid four-case name contrast: ${name}`);
    const choices = forms.map((label,index) => ({id:`c${index}`,label}));
    const id = `mock.v11.writing.name.${lower}`, family = `name-capital:${lower}`;
    const source = {
      id,skillId:'capitalization',domainId:'writing',level:1,format:'choice',answerMode:'exact',
      prompt:PROMPT,passage:'',targetWord:name,renderTargetText:false,suppressStimulusAudio:true,
      modality:'recognition',evidenceModality:'print',hideWrittenLabels:false,displayPassageDuringResponse:true,
      choices,answer:'c0',constructClaim:'recognize_name_capital_form',
      stimulusKey:family,canonicalPassageId:family,exposureFamilyId:family,
      requiredAudioCues:[{role:'instruction',text:PROMPT,path:instruction,required:true}],
      sourceProvenance:{kind:'original_literacy_guide_v11_name_capacity',file:FILE,sourceId:id},
      mediaDecision:{role:'text-only',paths:[],constructReview:'approved',answerNeutral:'approved',
        reason:'The visible case pattern supplies the complete capitalization evidence. The exact instruction is narrated; the name and its alternatives remain silent.'},
      distractorRationales:{
        c1:'Missing initial capital: every letter is small, so the name does not begin with its required capital.',
        c2:'Capital in the wrong place: the last letter is capitalized while the first letter remains small.',
        c3:'Every letter capitalized: the conventional name form needs an initial capital followed by small letters.',
      },
      taskDemand:{reviewed:true,operation:'capitalize_name',features:{initialCapitalRequired:true,silentPrintedChoices:true,responseCount:4},
        proof:{targetName:name,nameCaseForms:Object.fromEntries(choices.map(choice=>[choice.id,choice.label])),retained:name,rejected:forms.slice(1)}},
      explanation:`${name} begins with a capital letter and continues with small letters.`,
      difficultyEvidence:'Recognize the conventional initial-capital form of one short familiar first name; all four options retain exactly the same letters.',
    };
    const item = {...normalize(source),foundationBand:0,adaptiveAreaBand:0,adaptiveMixedEligible:true,
      canonicalPassageId:family,stimulusKey:family,exposureFamilyId:family,
      adaptiveDemand:{operation:'capitalize_name',requires:'Recognize the conventional capitalized form of a supplied name.'}};
    output.push({...item,itemSnapshot:{...item}});
    used.add(lower);
  }
  return output;
}
