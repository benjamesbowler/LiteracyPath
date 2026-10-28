import {literacyMockDemandV12} from '../../src/policy/literacyMockDemandV12.js';
import {literacyMockDemandV11,LITERACY_MOCK_V11_LADDERS} from '../../src/policy/literacyMockDemandV11.js';
import {literacyMockBoundaryLimits} from '../../src/policy/literacyMockBoundaryPolicy.js';
import {getLiteracyMockAudioV11Path} from '../../src/data/literacyMockAudioV11.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LITERACY_MOCK_VERSION } from '../../src/policy/literacyMockVersions.js';
import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_V9_AREA_VERSION } from '../../src/policy/literacyMockBoundaryV9.js';
import { literacyMockDemandV9, LITERACY_MOCK_V9_LADDERS } from '../../src/policy/literacyMockDemandV9.js';
import { literacyMockDemandV10, LITERACY_MOCK_V10_LADDERS } from '../../src/policy/literacyMockDemandV10.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath, getLedaProductionAudioPath, LEDA_LANGUAGE_AUDIO_ROLES, normalizeLedaAudioText } from '../../src/data/ledaProductionAudio.js';
import { CYCLE_PRACTICE_INSTRUCTION_AUDIO } from '../../src/data/generated/cyclePracticeInstructionAudio.generated.js';
import { ADVENTURE_MAP_INSTRUCTION_AUDIO } from '../../src/data/generated/adventureMapInstructionAudio.generated.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { isKnownBadAudioPath } from '../../src/data/knownBadWordAudio.js';
import { DRUM_TRAIL_WORDS } from '../../src/data/drumTrailContent.js';
import { mockConstructionLength } from '../../src/utils/literacyMockResponse.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const text=value=>typeof value==='string' && value.trim().length>0;
const sameValues=(left,right)=>Array.isArray(left)&&Array.isArray(right)&&JSON.stringify([...left].sort())===JSON.stringify([...right].sort());
const publicFileExists=value=>text(value) && value.startsWith('/') && fs.existsSync(path.join(ROOT,'public',value.split('#')[0]));
const formats=new Set(['choice','multi_select','order','match','select_text','build_word']);
const cueRoles=new Set(['instruction','target_word','phoneme','choice','passage']);
const constructionOperations=new Set(['construct_split_vowel','construct_five_phoneme_team','construct_extended_compound']);

/** The current adaptive admission is the scope. Historical, tutorial and
 * quarantined/noneligible records remain immutable and are not relabelled. */
export function currentLiteracyMockAuditItems(bank,{contentVersion=LITERACY_MOCK_VERSION}={}) {
  return bank.filter(q=>q.contentVersion===contentVersion && q.adaptiveMixedEligible===true && !q.tutorialOnly && isLiteracyItemEligible(q));
}

function availableCuePaths(cue,version) {
  if(cue.role==='phoneme')return new Set([getPreferredPhonemeAudioPath(cue.text)].filter(Boolean));
  return new Set([...(['literacy-mock-v11','literacy-mock-v12'].includes(version)?[getLiteracyMockAudioV11Path(cue.text)]:[]),getLedaInstructionAudioPath(cue.text),getLedaWordAudioPath(cue.text),
    ...LEDA_LANGUAGE_AUDIO_ROLES.map(role=>getLedaProductionAudioPath(cue.text,[role])),
    CYCLE_PRACTICE_INSTRUCTION_AUDIO[normalizeLedaAudioText(cue.text)],ADVENTURE_MAP_INSTRUCTION_AUDIO[normalizeLedaAudioText(cue.text)],
    DRUM_TRAIL_WORDS.find(word=>word.word===cue.text)?.audio].filter(Boolean));
}

function buildableLengths(answer,choices,offset=0,used=new Set()) {
  if(offset===answer.length)return new Set([0]);
  const result=new Set();
  choices.forEach((choice,index)=>{
    if(used.has(index) || !text(choice.label) || !answer.startsWith(choice.label,offset))return;
    const next=new Set(used);next.add(index);
    for(const length of buildableLengths(answer,choices,offset+choice.label.length,next))result.add(length+1);
  });
  return result;
}

/** Validate the normalized Mock shape directly. Its ID-valued keys and
 * per-role cues are different from the public practice question schema. */
export function auditLiteracyMockItem(q,{assetExists=publicFileExists,sourceItems}={}) {
  const issues=[];
  const add=(code,message)=>issues.push({code,message});
  const choices=Array.isArray(q.choices)?q.choices:[],ids=choices.map(c=>c.id);
  const cues=Array.isArray(q.requiredAudioCues)?q.requiredAudioCues:[];
  const band=q.adaptiveAreaBand,operation=q.adaptiveDemand?.operation;
  const classify=q.contentVersion==='literacy-mock-v12'?q=>literacyMockDemandV12(q,{sourceItems}):q.contentVersion==='literacy-mock-v11'?q=>literacyMockDemandV11(q,{sourceItems}):q.contentVersion==='literacy-mock-v10'?literacyMockDemandV10:literacyMockDemandV9;
  const ladders=['literacy-mock-v11','literacy-mock-v12'].includes(q.contentVersion)?LITERACY_MOCK_V11_LADDERS:q.contentVersion==='literacy-mock-v10'?LITERACY_MOCK_V10_LADDERS:LITERACY_MOCK_V9_LADDERS;
  if(!text(q.id)||!text(q.prompt)||!text(q.skillId)||!text(q.constructClaim)||![1,2].includes(q.level)
    || !LITERACY_MOCK_AREA_ORDER.includes(q.domainId)||!formats.has(q.format)
    ||choices.length<2||new Set(ids).size!==ids.length||choices.some(c=>!text(c.id)||!text(c.label)))add('Q-MOCK-SHAPE','A normalized item needs a stable ID, literal prompt/construct, domain, source level and distinct labelled response IDs.');
  if(q.adaptiveAreaVersion!==(['literacy-mock-v11','literacy-mock-v12'].includes(q.contentVersion)?literacyMockBoundaryLimits(q.contentVersion).areaVersion:LITERACY_MOCK_V9_AREA_VERSION)||!Number.isInteger(band)||band<0||band>LITERACY_MOCK_AREA_MAX[q.domainId]
    ||JSON.stringify(q.adaptiveDemand)!==JSON.stringify(ladders[q.domainId]?.[band])
    ||classify(q)!==band)add('Q-MOCK-DEMAND','The declared current adaptive band must match the actual admitted operation and its literal evidence contract.');

  if(['literacy-mock-v11','literacy-mock-v12'].includes(q.contentVersion)&&q.format==='choice'&&choices.length!==4)add('Q-MOCK-FOUR-CHOICES','Every current single-answer multiple-choice question needs one key and three distractors.');
  if(['choice','select_text'].includes(q.format)){
    if(q.answerMode!=='exact'||typeof q.answer!=='string'||ids.filter(id=>id===q.answer).length!==1)add('Q-MOCK-KEY','A selected response needs exactly one literal keyed choice ID.');
  }else if(q.format==='multi_select'){
    if(q.answerMode!=='set'||!Array.isArray(q.answer)||q.answer.length!==q.selectCount||new Set(q.answer).size!==q.answer.length||q.answer.some(id=>!ids.includes(id)))add('Q-MOCK-KEY','Choose-all scoring requires the complete distinct keyed set and matching selection count.');
  }else if(['order','match'].includes(q.format)){
    const length=q.format==='match'?q.matchTargets?.length:q.sequenceLength||choices.length;
    if(q.answerMode!=='sequence'||!Array.isArray(q.answer)||q.answer.length!==length||q.answer.some(id=>!ids.includes(id))
      ||q.format==='order'&&new Set(q.answer).size!==q.answer.length)add('Q-MOCK-KEY','An ordered or matched response needs a complete, buildable sequence key.');
    if(q.format==='match'&&(!Array.isArray(q.matchTargets)||q.matchTargets.some(target=>!text(target.label)&&!text(target.image))))add('Q-MOCK-MATCH','Every matching target needs its literal visible text or evidence picture.');
  }else if(q.format==='build_word'){
    const lengths=typeof q.answer==='string'?buildableLengths(q.answer,choices):new Set();
    if(q.answerMode!=='exact'||!text(q.answer)||q.answer!==q.targetWord||!lengths.has(mockConstructionLength(q))||q.renderTargetText||q.hideWrittenLabels)add('Q-MOCK-BUILD','Dictated construction needs a hidden exact target and a complete spelling buildable from distinct physical tiles at the displayed response length.');
  }
  if(q.format==='select_text'&&(choices.map(c=>c.label).join(' ')!==q.passage||choices.some((c,index)=>c.tokenIndex!==index)))add('Q-MOCK-TEXT','Selectable words must preserve the literal passage and token order.');

  if(!cues.some(c=>c.role==='instruction'))add('Q-MOCK-AUDIO','Every item requires an exact recorded instruction.');
  for(const cue of cues){
    if(!cueRoles.has(cue.role)||!text(cue.text)||!text(cue.path)||!assetExists(cue.path)||isKnownBadAudioPath(cue.path))add('Q-MOCK-AUDIO',`Missing or unavailable exact ${cue.role||'unknown'} recording: ${cue.text||'(no text)'}`);
    else if(!availableCuePaths(cue,q.contentVersion).has(cue.path))add('Q-MOCK-AUDIO-SOURCE',`The ${cue.role} recording does not resolve to an approved exact-text source: ${cue.text}`);
    if(cue.role==='choice'&&!choices.some(c=>c.id===cue.choiceId&&c.label===cue.text&&(c.audioPath===cue.path||!c.audioPath&&!cue.path)))add('Q-MOCK-AUDIO-CHOICE','A required choice recording must map to the exact shuffled response ID, label and playback path.');
    if(cue.role==='passage'&&cue.text!==q.passage)add('Q-MOCK-AUDIO-PASSAGE','Passage replay must record the complete literal saved passage.');
  }
  if(!sameValues(q.requiredAudioPaths||[],[...new Set(cues.map(c=>c.path).filter(Boolean))]))add('Q-MOCK-AUDIO-LEDGER','Required audio paths must match the complete cue sequence.');
  if(q.hideWrittenLabels&&(q.domainId==='sound_awareness'||choices.some(c=>!c.image))&&choices.some(c=>cues.filter(cue=>cue.role==='choice'&&cue.choiceId===c.id&&cue.text===c.label).length!==1))add('Q-MOCK-AUDIO-CHOICE','Spoken-only response options require exactly one complete recorded choice per response ID. Picture referent choices remain visual evidence.');
  if(q.modality==='reading'&&(cues.some(c=>c.role!=='instruction')||choices.some(c=>c.audioPath)))add('Q-MOCK-READING-LEAK','Independent reading must not narrate the assessed stimulus or its printed alternatives.');
  if(q.domainId==='listening'&&q.passage&&q.displayPassageDuringResponse!==false)add('Q-MOCK-LISTENING-LEAK','A listening claim cannot print its recorded stimulus during the scored response.');
  if(q.domainId==='sound_awareness'&&(!q.hideWrittenLabels||q.renderTargetText||q.passage&&q.displayPassageDuringResponse!==false
    ||choices.every(c=>/^[a-z]$/i.test(c.label))||/grapheme_mapping|letter_spells/.test(q.constructClaim)))add('Q-MOCK-ORAL-SOUND','Oral sound comparison cannot substitute printed grapheme mapping or expose the assessed spellings.');

  const images=[...new Set([q.image,...choices.map(c=>c.image),...(q.matchTargets||[]).map(target=>target.image)].filter(Boolean))];
  if(!sameValues(q.requiredImagePaths||[],images))add('Q-MOCK-IMAGE-LEDGER','Required image paths must cover every stimulus, choice and matching target picture.');
  for(const image of images)if(!assetExists(image))add('Q-MOCK-IMAGE',`Missing exact required evidence image: ${image}`);
  if(q.image&&!text(q.imageAlt)||choices.some(c=>c.image&&!text(c.imageAlt))||(q.matchTargets||[]).some(target=>target.image&&!text(target.imageAlt)))add('Q-MOCK-IMAGE-ALT','Evidence pictures need their literal object or scene alternatives.');
  if(String(q.evidenceModality).includes('image')&&images.length===0)add('Q-MOCK-IMAGE','The declared image evidence has no evidence image.');
  if(!q.mediaDecision||!(text(q.mediaDecision.reason)||q.mediaDecision.constructReview==='approved')||q.mediaDecision.constructReview==='pending'||q.mediaReady!==true)add('Q-MOCK-MEDIA','Every admitted item needs its declared media rationale or recorded construct review, and complete available required recordings and artwork.');

  if(operation==='separate_two_thoughts'||/sentence_boundary/.test(q.constructClaim)){
    const afterStop=value=>/\.\s+[A-Z]/.test(value);
    const key=choices.find(c=>c.id===q.answer);
    if(choices.length>1&&choices.every(c=>/\.\s+[A-Za-z]/.test(c.label))&&key&&afterStop(key.label)&&choices.filter(c=>afterStop(c.label)).length===1)add('Q-MOCK-BOUNDARY-CUE','The boundary key is uniquely identifiable by capitalization after its internal stop.');
  }
  if(operation==='preserve_scope'){
    const proof=q.taskDemand?.proof||{},features=q.taskDemand?.features||{},key=choices.find(c=>c.id===q.answer)?.label;
    if(q.taskDemand?.reviewed!==true||!text(features.scope)||features.parallelScopeContrasts!==choices.length-1
      ||proof.source!==q.passage||proof.retained!==key||!Array.isArray(proof.rejected)
      ||!sameValues(proof.rejected,choices.filter(c=>c.id!==q.answer).map(c=>c.label))||!text(proof.distinction))add('Q-MOCK-SCOPE-PROOF','A scope claim needs reviewed literal source, retained key, every rejected scope contrast and named distinction; matching all/only vocabulary is insufficient.');
  }
  if(constructionOperations.has(operation)){
    const proof=q.taskDemand?.proof||{},features=q.taskDemand?.features||{};
    const units=Array.isArray(proof.responseTiles)?proof.responseTiles:[],phones=Array.isArray(proof.phonemes)?proof.phonemes:[],spares=Array.isArray(proof.spareTiles)?proof.spareTiles:[];
    if(q.taskDemand?.reviewed!==true||q.format!=='build_word'||q.modality!=='dictation'||q.evidenceModality!=='audio+print'
      ||proof.targetWord!==q.targetWord||units.join('')!==q.answer||phones.some(phone=>!text(phone)||/silent/i.test(phone))
      ||phones.length!==features.phonemeCount||units.length!==features.responseUnitCount||q.answer.length!==features.letterCount
      ||q.responseLength!==units.length||spares.length!==features.spareTiles||spares.length<2||spares.some(tile=>units.includes(tile))
      ||!sameValues(choices.map(c=>c.label),[...units,...spares])||images.length||choices.some(c=>c.audioPath)||cues.some(c=>c.role==='choice')
      ||!cues.some(c=>c.role==='target_word'&&c.text===q.targetWord))add('Q-MOCK-PHONICS-PROOF','Construction demand must match literal response units, spoken phonemes, letter count, distinct spare foils and hidden dictated target.');
    if(operation==='construct_split_vowel'&&(phones.length!==4||units.length!==5||!features.splitVowel||proof.splitVowelPositions?.length!==2
      ||proof.splitVowelPositions[1]!==4||units[4]!=='e'||!sameValues(units,[...q.answer])))add('Q-MOCK-PHONICS-UNITS','Split-vowel construction requires four spoken phonemes across five separate letters, including silent final e.');
    if(operation==='construct_five_phoneme_team'&&(phones.length!==5||units.length<5||!units.includes(features.vowelTeam)))add('Q-MOCK-PHONICS-UNITS','The five-phoneme vowel-team operation must contain five authored spoken phonemes and its literal vowel-team response unit.');
    if(operation==='construct_extended_compound'&&(phones.length<6||units.length<6||!units.includes(features.vowelTeam)
      ||!(Array.isArray(proof.compoundParts)&&proof.compoundParts.length>=2&&proof.compoundParts.join('')===q.answer
        ||text(proof.morphemeExtension?.stem)&&text(proof.morphemeExtension?.suffix)&&proof.morphemeExtension.stem+proof.morphemeExtension.suffix===q.answer)))add('Q-MOCK-PHONICS-UNITS','Extended construction needs at least six spoken phonemes and literal meaningful compound parts or a declared morpheme extension.');
  }
  return issues;
}

export function auditLiteracyMockBank(bank,options={}) {
  const items=currentLiteracyMockAuditItems(bank,options),issues=[],ids=new Set(),sourceItems=new Map(bank.map(item=>[item.id,item]));
  for(const q of items){
    if(ids.has(q.id))issues.push({id:q.id,code:'Q-MOCK-ID',message:'Duplicate current admitted item identity.'});
    ids.add(q.id);
    for(const issue of auditLiteracyMockItem(q,{...options,sourceItems:sourceItems}))issues.push({id:q.id,...issue});
  }
  for(const domainId of LITERACY_MOCK_AREA_ORDER)for(let band=0;band<=LITERACY_MOCK_AREA_MAX[domainId];band++){
    if(!items.some(q=>q.domainId===domainId&&q.adaptiveAreaBand===band))issues.push({id:`${domainId}:${band}`,code:'Q-MOCK-COVERAGE',message:'The current adaptive route has no admitted item at this authored task demand.'});
  }
  return issues;
}
