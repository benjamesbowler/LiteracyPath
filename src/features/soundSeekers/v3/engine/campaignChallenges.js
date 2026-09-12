// Campaign items keep the existing authority/publicBeat contract. Descriptors
// without authored language stimuli fail explicitly; they never become a random quiz.
import { QUEST_STOPS } from '../../../../data/questSequence.js';
import { buildEchoHunt, buildSignpost, buildWordForge, buildStoryBridge, buildSoundSort, DOMAINS, MECHANICS } from './challenges.js';
import { createBeatState, resolveAction } from './authority.js';
import { CAMPAIGN_LEARNING_PACKS, CAMPAIGN_LEARNING_WORD_AUDIO } from '../content/campaignLearningPacks.js';
import { getLedaWordAudioPath } from '../../../../data/ledaProductionAudio.js';
import { CAMPAIGN_TRANSFER_PACKS } from '../content/campaignTransferPacks.js';
import { CAMPAIGN_SENTENCE_TRANSFER_PACKS } from '../content/campaignSentenceTransfer.js';
import { CAMPAIGN_LANGUAGE } from '../content/campaignLanguage.js';
import { targetInfo, targetAudio, wordAudio, unitsFor, isSoundDistinct, phonemeAudio, soundLabel } from './lexicon.js';
import { INITIAL_SOUND_TARGET_IDS } from '../../content/teachTargetMetadata.js';
import { createRng, hashSeed } from './rng.js';

export class CampaignContentError extends Error {
  constructor(code, missionId, detail) { super(`${missionId}: ${detail}`); this.name = 'CampaignContentError'; this.code = code; this.missionId = missionId; }
}
const fail = (code, mission, detail) => { throw new CampaignContentError(code, mission?.id || 'unknown-mission', detail); };
// Preserve the corpus segmentation. Only its explicit morphological role is
// mapped to the already-canonical teaching target; no spelling is inferred.
export function campaignUnitTarget(unit) {
 if(unit.role?.startsWith('suffix-past'))return 'suffix_ed';
 if(unit.role?.startsWith('suffix-plural'))return 'suffix_s';
 if(unit.role==='suffix-progressive')return 'suffix_ing';
 return unit.targetId;
}
const spokenWord = word => CAMPAIGN_LEARNING_WORD_AUDIO[word] || wordAudio(word) || getLedaWordAudioPath(word) || '';
const context = (mode, construct) => ({ mode, construct, evidenceUse: 'formative-only' });
export function createCampaignBeatState(beat) {
  let state = beat.mechanic === 'sentence_build' ? { ...createBeatState(beat), placed: [], slotErrors: 0 } : createBeatState(beat);
  if(beat.view.workshop?.mode==='replace')state={...state,wordUnits:[...beat.view.workshop.baseUnits]};
  return beat.supportContext?.mode === 'supported-practice'
    ? { ...state, modelShown: true, supportUsed: ['instructional-model'] }
    : state;
}
function decorate(beat, mission, ordinal, mode, construct) {
  return { ...beat, id: `${mission.id}-item-${ordinal}`, missionId: mission.id, familyId: mission.familyId, variantId: mission.variantId, supportContext: context(mode, construct) };
}
function soundBeat(mission, targetId, pool, stopIndex, ordinal, direction, mode) {
  const original = buildEchoHunt({ stopId: mission.curriculum.anchorIds[0], stopIndex, targetId, ordinal });
  if (!original) fail('unavailable-sound-builder', mission, `No sound challenge for ${targetId}`);
  const rng = createRng(hashSeed(`${mission.id}:${ordinal}:${direction}`));
  const options = rng.shuffle(pool).map((id,i) => ({ id:`opt${i}`, grapheme:targetInfo(id).grapheme, audio:targetAudio(id), soundLabel:original.view.target.soundLabel, targetId:id }));
  const key = { optionId:options.find(o=>o.targetId===targetId).id, optionTargets:Object.fromEntries(options.map(o=>[o.id,o.targetId])) };
  const audio = targetAudio(targetId);
  const beat = { ...original, domain:direction==='sound-to-letter'?DOMAINS.P2G:DOMAINS.G2P,
    prompt: { text:direction==='sound-to-letter'?'Listen. Find the letter.':`Find the sound for ${targetInfo(targetId).grapheme}.`, cues:direction==='sound-to-letter'?[{kind:'phoneme',src:audio}]:[] },
    view: { target: { soundLabel:'', audio:direction==='sound-to-letter'?audio:'', anchorWord:'', anchorAudio:'', grapheme:direction==='letter-to-sound'?targetInfo(targetId).grapheme:'' },
      options:options.map(({id,grapheme,audio})=>({id,grapheme:direction==='sound-to-letter'?grapheme:'',audio,soundLabel:''})), direction }, key };
  return decorate(beat,mission,ordinal,mode,direction);
}
function wordBeat(mission, word, allowed, stopIndex, ordinal, mode) {
  const units = unitsFor(word);
  if (!units?.length || units.some(u=>u.role==='irregular'||!allowed.has(campaignUnitTarget(u)))) fail('untaught-word',mission,`Word ${word} has unavailable or untaught units`);
  if (!spokenWord(word)) fail('missing-word-audio',mission,`Committed word audio missing: ${word}`);
  const beat = buildWordForge({stopId:mission.curriculum.anchorIds[0],stopIndex,word,ordinal,review:mode==='supported-practice'});
  if (!beat) fail('missing-word-configuration',mission,`Cannot build ${word}`);
  const graphemes = new Set([...allowed].map(id=>targetInfo(id)?.grapheme));
  beat.view.tiles = beat.view.tiles.filter(tile=>beat.key.sequence.includes(tile.id) || graphemes.has(tile.grapheme));
  if (beat.view.tiles.some(tile=>!tile.audio)) fail('missing-unit-audio',mission,`Missing tile audio for ${word}`);
  beat.key.word = word;
  beat.targetIds=[...new Set(units.map(campaignUnitTarget).filter(Boolean))];
  beat.prompt = {text:'Build the word.',cues:[{kind:'word',src:spokenWord(word)}]};
  beat.view = {...beat.view,word:'',wordAudio:spokenWord(word),image:''};
  return decorate(beat,mission,ordinal,mode,'word-segmentation-encoding');
}
function oralBeats(mission, ordinal, mode = 'independent-check') {
  const original = CAMPAIGN_LANGUAGE[mission.id] || CAMPAIGN_LEARNING_PACKS[mission.id];
  const extension=CAMPAIGN_TRANSFER_PACKS[mission.id]||CAMPAIGN_SENTENCE_TRANSFER_PACKS[mission.id]||[];
  const pack=original?[...extension.filter(i=>i.actId==='retrieve'),...original,...extension.filter(i=>i.actId==='apply')]:null;
  if (!Array.isArray(pack) || !pack.length) fail('missing-authored-oral-pack',mission,'An authored scene action pack with exact committed direction audio is required');
  const rng = createRng(hashSeed(`${mission.id}:${ordinal}:semantic`));
  return pack.flatMap((item,index)=>{
    const sceneMission={...mission,familyId:item.familyId||mission.familyId};
    const section={actId:item.actId||'solve',sectionId:`${mission.id}-${item.actId||'solve'}`};
    if(item.sentence) return [{...sentenceBeat(sceneMission,item,ordinal+index*2,mode),...section}];
    if(item.construct==='grammar_tense')return [{...grammarBeat(sceneMission,item,ordinal+index*2,mode),...section}];
    if (!item.audio?.startsWith('/audio/sound-seekers/campaign/') || !Array.isArray(item.options) || item.options.filter(c=>c.id===item.correctId).length!==1 || new Set(item.options.map(o=>o.id)).size!==item.options.length) fail('invalid-oral-pack',mission,'Oral items require committed audio and unique scene choices with exactly one destination');
    const choices = rng.shuffle([item.options.find(o=>o.id===item.correctId),...rng.shuffle(item.options.filter(o=>o.id!==item.correctId)).slice(0,2)]);
    const beat = buildStoryBridge({stopId:mission.curriculum.anchorIds[0],story:{text:item.text,choices:choices.map(o=>({label:'',icon:o.id,correct:o.id===item.correctId}))},ordinal:ordinal+index});
    if (!beat) fail('invalid-oral-pack',mission,'Missing authored oral direction');
    beat.domain=item.construct;beat.prompt={text:'Listen. Then help.',cues:[{kind:'instruction',src:item.audio}]};
    beat.key.supportText=item.text;
    beat.view={text:'',words:[],choices:beat.view.choices.map(choice=>({...choice,audio:choices.find(o=>o.id===choice.icon)?.audio||''})),sceneObjects:choices.map(o=>({...o})),objectId:item.text.startsWith('Find ')?'':item.objectId,phase:item.text.startsWith('Find ')?'search':'delivery',scenarioId:item.id};
    const delivery = {...decorate(beat,sceneMission,ordinal+index*2+1,mode,item.construct),...section};
    delivery.key.scenarioId=item.id;
    if(!/^Put |^Take |^Guide /.test(item.text) || !CAMPAIGN_LEARNING_PACKS[mission.id])return [delivery];
    const objects = [...new Set(pack.map(entry=>entry.objectId).filter(Boolean))];
    if(objects.length<2)return [delivery];
    const pickupOptions = rng.shuffle([item.objectId,...rng.shuffle(objects.filter(id=>id!==item.objectId)).slice(0,2)]).map((icon,i)=>({id:`pickup-${i}`,label:'',icon}));
    const pickup = decorate({...beat,domain:'oral_object_vocabulary',key:{choiceId:pickupOptions.find(o=>o.icon===item.objectId).id,supportText:item.text,scenarioId:item.id},view:{text:'',words:[],choices:pickupOptions,sceneObjects:pickupOptions.map(o=>({id:o.icon,icon:o.icon,label:o.icon.replaceAll('-',' ')})),objectId:'',phase:'pickup',scenarioId:item.id}},mission,ordinal+index*2,mode,'oral_object_vocabulary');
    return [{...pickup,familyId:sceneMission.familyId,...section},delivery];
  });
}
// Accessibility transcription is an explicit supported attempt, never an
// invisible change to an independent listening/encoding item.
// Call this with the private authored beat only. Its returned line is explicit
// learner-requested support; answer keys never enter the scene projection.
export function campaignTextSupport(beat,state={}) {
  if(beat.mechanic===MECHANICS.SIGNPOST)return beat.view.cards.map(card=>`${card.grapheme}: ${targetInfo(card.targetId)?.anchorWord||card.anchorWord}.`).join(' ');
  if(beat.mechanic===MECHANICS.ECHO_HUNT){
    const targetId=beat.key?.optionTargets?.[beat.key?.optionId]||beat.targetIds?.[0],info=targetInfo(targetId),sound=soundLabel(targetId);
    if(info&&sound){
      const word=info.anchorWord,example=word?(INITIAL_SOUND_TARGET_IDS.includes(targetId)?`${word.charAt(0).toUpperCase()+word.slice(1)} starts with ${sound}.`:`Hear ${sound} in ${word}.`):'';
      return `${beat.view.direction==='letter-to-sound'||beat.domain===DOMAINS.G2P?`Find the ${sound} sound for ${info.grapheme}.`:`Find ${info.grapheme}.`} ${example}`.trim();
    }
  }
  if(beat.mechanic===MECHANICS.SOUND_SORT){
    const items=beat.view.items||[],item=items[Math.min(state.itemIndex||0,Math.max(0,items.length-1))];
    const labels=(beat.view.bins||[]).map(bin=>{
      if(beat.domain==='spelling_pattern_sort')return bin.grapheme||bin.label;
      const id=beat.key?.binTargets?.[bin.id],info=targetInfo(id),sound=bin.soundLabel||soundLabel(id)||bin.grapheme||bin.label;
      return beat.view.mode==='read'&&info?.anchorWord?`${sound} as in ${info.anchorWord}`:sound;
    }).filter(Boolean).join(' or ');
    if(item?.word&&labels){
      const task=beat.domain==='spelling_pattern_sort'?'Choose its letter pattern':beat.view.mode==='initial'?'Choose its first sound':beat.view.mode==='contains'?'Choose a sound in the word':'Choose the matching sound';
      return `Word: ${item.word}. ${task}: ${labels}.`;
    }
  }
  const authored=beat.key?.supportText||beat.key?.word||beat.view?.text||beat.view?.context||beat.prompt?.text;
  return typeof authored==='string'&&authored.trim()?authored.trim():'Look at the choices. Choose the one that helps your friend.';
}
export function resolveCampaignAction(beat, state, action) {
  const saved = state || createCampaignBeatState(beat);
  const current = saved.supportUsed.includes('text-support')?{...saved,modelShown:true}:saved;
  if (beat.mechanic === MECHANICS.SIGNPOST && ['REQUEST_TEXT_SUPPORT','REQUEST_MODEL'].includes(action.type) && !current.done) {
    const line=campaignTextSupport(beat,current);
    return {state:{...current,done:true,modelShown:true,supportUsed:[...new Set([...current.supportUsed,'visual-introduction'])]},outcome:{type:'complete',line,taught:beat.targetIds,exposure:'visual-supported',evidence:null}};
  }
  if (action.type === 'REQUEST_TEXT_SUPPORT' && !current.done) {
    return {state:{...current,modelShown:true,supportUsed:[...new Set([...current.supportUsed,'text-support'])]},outcome:{type:'model',line:campaignTextSupport(beat,current),textSupport:true}};
  }
  if(beat.mechanic==='sentence_build')return resolveSentence(beat,current,action);
  const result=resolveAction(beat,current,action);
  // Sort substeps share the current supported attempt. Its next visible item
  // must not become independent merely because the shared reducer resets the
  // per-item model flag while explicit text support remains active.
  if(current.supportUsed.includes('text-support')){
    result.state={...result.state,modelShown:true};
    if(result.outcome.evidence){result.outcome.independent=false;result.outcome.evidence={...result.outcome.evidence,independent:false,supportUsed:[...new Set([...result.outcome.evidence.supportUsed,'text-support'])]};}
  }
  if(beat.mechanic===MECHANICS.WORD_FORGE&&result.outcome.type==='complete')result.state={...result.state,completedWord:beat.key.word};
  if(beat.view.workshop?.mode==='replace'){
    const workshop=beat.view.workshop;
    const wordUnits=[...(current.wordUnits||workshop.baseUnits)];
    if(result.outcome.type==='complete')wordUnits[workshop.slotIndex]=beat.view.tiles.find(t=>t.id===action.tileId).grapheme;
    result.state={...result.state,wordUnits};
    if(result.outcome.type==='incorrect')result.outcome.line='Keep the other parts. Listen again and change the marked part.';
    if(result.outcome.evidence)result.outcome.evidence={...result.outcome.evidence,construct:'phoneme-substitution-encoding',baseWord:workshop.baseWord,changedSlot:workshop.slotIndex};
  }
  if(result.outcome.type==='incorrect' && beat.mechanic===MECHANICS.STORY_BRIDGE && beat.domain!==DOMAINS.TEXT) result.outcome.line=result.outcome.revealId?'Watch this place. Listen to the instruction again.':'Listen again. Check the object and its place.';
  if(result.outcome.evidence && beat.supportContext?.mode==='supported-practice') {
    result.outcome.independent=false;
    result.outcome.evidence={...result.outcome.evidence,independent:false,supportUsed:[...new Set([...result.outcome.evidence.supportUsed,'instructional-model'])]};
  }
  if(result.outcome.evidence && beat.domain==='spelling_pattern_sort' && result.outcome.evidence.errorType)result.outcome.evidence.errorType='spelling_pattern';
  if(result.outcome.evidence && beat.key?.scenarioId)result.outcome.evidence={...result.outcome.evidence,scenarioId:beat.key.scenarioId,correlatedScenario:true};
  return result;
}
export function buildCampaignMission(mission, progress = {}, { replayOrdinal = 0 } = {}) {
  if (!mission?.id || !mission.curriculum) fail('invalid-mission',mission,'Mission curriculum is required');
  const c=mission.curriculum, index=QUEST_STOPS.findIndex(s=>s.id===c.anchorIds?.[0]);
  if(index<0)fail('invalid-anchor',mission,'Canonical curriculum anchor missing');
  const ordinal=Number.isSafeInteger(replayOrdinal)&&replayOrdinal>=0?replayOrdinal*100:0;
  const targets=c.targetIds||[];
  const canonical = new Set((c.anchorIds||[]).flatMap(id=>QUEST_STOPS.find(s=>s.id===id)?.teach.map(t=>t.id)||[]));
  for(const id of targets)if(!canonical.has(id)||!targetInfo(id))fail('unavailable-target',mission,`Target ${id} lacks canonical metadata or recorded sound`);
  for(const id of c.minimumTaughtTargetIds||[])if(!progress.targets?.[id]?.taught)fail('untaught-prerequisite',mission,`Teach ${id} before this printed task`);
  if(!mission.id.startsWith('meadow-01-'))return buildExtendedMission(mission,progress,ordinal);
  if(c.construct?.startsWith('oral-'))return missionPack(mission,oralBeats(mission,ordinal));
  const beats=[];
  if(c.mode==='teach'){
    if(targets.length!==2)fail('invalid-introduction',mission,'Opening introduction requires its two authored sounds');
    for(const [i,id] of targets.entries())beats.push(decorate(buildSignpost({stopId:c.anchorIds[0],targetIds:[id],ordinal,index:i}),mission,ordinal+i,'supported-practice','sound-introduction'));
    for(let round=0;round<3;round++)for(const [i,id]of targets.entries())beats.push(soundBeat(mission,id,targets,QUEST_STOPS[index].index,ordinal+2+round*2+i,round===1?'letter-to-sound':'sound-to-letter',round===0?'supported-practice':'independent-check'));
  }else{
    if(!Array.isArray(c.allowedWordIds)||!c.allowedWordIds.length)fail('missing-word-pack',mission,'No explicitly authored build words');
    const canonicalWords=new Set(c.anchorIds.flatMap(id=>QUEST_STOPS.find(s=>s.id===id)?.words||[]));
    const allowed=new Set(targets);
    const words = CAMPAIGN_LANGUAGE[mission.id] ? c.allowedWordIds.filter(word=>word==='mat') : c.allowedWordIds;
    for(const [i,word]of words.entries()){
      if(!canonicalWords.has(word))fail('noncanonical-word',mission,`Word ${word} is absent from the canonical anchor`);
      beats.push(wordBeat(mission,word,allowed,QUEST_STOPS[index].index,ordinal+i,c.printRole==='supported-review'?'supported-practice':'independent-check'));
    }
  }
  if(CAMPAIGN_LANGUAGE[mission.id]) beats.push(...oralBeats(mission,ordinal+beats.length,'supported-practice'));
  return missionPack(mission,beats);
}

function sentenceBeat(mission,item,ordinal) {
  const tokens=item.sentence.trim().split(/\s+/);
  const rng=createRng(hashSeed(`${mission.id}:sentence:${ordinal}`));
  const tiles=rng.shuffle(tokens.map((grapheme,i)=>({id:`token-${i}`,grapheme,audio:spokenWord(grapheme.replace(/[.,!?]/g,''))})));
  return decorate({id:item.id,mechanic:'sentence_build',stopId:mission.curriculum.anchorIds[0],targetIds:[],domain:'spoken_sentence_order',review:false,prompt:{text:'Build the message.',cues:[{kind:'instruction',src:item.audio}]},view:{tiles,slots:tokens.length,word:'',image:'',objectId:'letter',scenarioId:item.id},key:{sequence:tokens.map((_,i)=>`token-${i}`),supportText:item.sentence,scenarioId:item.id},seed:rng.next()},mission,ordinal,'supported-practice','spoken_sentence_order');
}
function resolveSentence(beat,s,action) {
  if(s.done)return {state:s,outcome:{type:'ignored'}};
  const expected=beat.key.sequence[s.placed.length];
  if(action.type==='REQUEST_MODEL')return {state:{...s,modelShown:true,supportUsed:[...new Set([...s.supportUsed,'model'])]},outcome:{type:'model',line:'Listen to the message. Try this word next.',revealId:expected,slot:s.placed.length}};
  if(action.type==='REMOVE_LAST')return {state:{...s,placed:s.placed.slice(0,-1)},outcome:{type:'removed',slot:Math.max(0,s.placed.length-1)}};
  const tile=beat.view.tiles.find(t=>t.id===action.tileId);
  if(action.type!=='PLACE_TILE'||!tile||s.placed.includes(tile.id))return {state:s,outcome:{type:'ignored'}};
  const target=beat.view.tiles.find(t=>t.id===expected);
  if(tile.grapheme===target.grapheme){
    const placed=[...s.placed,tile.id],done=placed.length===beat.key.sequence.length;
    const independent=beat.domain==='grammar_tense'&&!s.modelShown&&s.errors===0;
    return {state:{...s,placed,done},outcome:{type:done?'complete':'progress',tileId:tile.id,slot:s.placed.length,...(done?{independent,evidence:{kind:'practice',beatId:beat.id,stopId:beat.stopId,mechanic:beat.mechanic,domain:beat.domain,targetIds:[],independent,supportUsed:[...new Set([...s.supportUsed,...(beat.domain==='grammar_tense'?[]:['spoken-sentence-model'])])],review:false,scenarioId:beat.key.scenarioId,correlatedScenario:true,errors:s.errors}}:{})}};
  }
  const errors=s.errors+1,modelShown=s.modelShown||errors>=2;
  return {state:{...s,errors,slotErrors:s.slotErrors+1,modelShown},outcome:{type:'incorrect',line:'Listen to the message again. Which word comes next?',revealId:errors>=2?expected:null,slot:s.placed.length}};
}
function wordIsAvailable(word,allowed) {
  const units=unitsFor(word);
  return Boolean(units?.length>=2&&spokenWord(word)&&units.every(u=>u.role!=='irregular'&&allowed.has(campaignUnitTarget(u))));
}
function touchesTarget(word,id) {
  const units=unitsFor(word),info=targetInfo(id);
  if(units?.some(u=>campaignUnitTarget(u)===id))return true;
  if(info?.kind==='blend')return units?.some((_,i)=>info.units.every((part,j)=>units[i+j]?.soundKey===part.soundKey));

  return false;
}
function readingBeat(mission,word,pool,ordinal,mode) {
  const rng=createRng(hashSeed(`${mission.id}:read:${ordinal}`));
  const words=rng.shuffle([word,...rng.shuffle(pool.filter(w=>w!==word)).slice(0,2)]);
  if(words.length<2)fail('insufficient-reading-contrast',mission,`Need a second taught word beside ${word}`);
  const beat=buildStoryBridge({stopId:mission.curriculum.anchorIds[0],story:{text:word,choices:words.map(w=>({label:w,icon:'sign',correct:w===word}))},ordinal});
  beat.domain='auditory_word_recognition';beat.targetIds=[...new Set(unitsFor(word).map(campaignUnitTarget).filter(Boolean))];
  beat.prompt={text:'Listen. Find the word.',cues:[{kind:'word',src:spokenWord(word)}]};
  beat.view={text:'',words:[],choices:beat.view.choices,objectId:'sign'};beat.key.supportText=word;
  return decorate(beat,mission,ordinal,mode,'auditory_word_recognition');
}
function sortingBeat(mission,pool,targets,allowed,stopIndex,ordinal,mode) {
  const stop=QUEST_STOPS.find(s=>s.id===mission.curriculum.anchorIds[0]);
  const pairs=[];
  const candidateTargets=[...new Set([...targets,...pool.flatMap(w=>unitsFor(w).map(campaignUnitTarget))])];
  const matching=new Map(candidateTargets.map(id=>[id,new Set(pool.filter(word=>touchesTarget(word,id)))]));
  for(let i=0;i<candidateTargets.length;i++)for(let j=i+1;j<candidateTargets.length;j++){
    const a=candidateTargets[i],b=candidateTargets[j];
    if(!a||!b||!allowed.has(a)||!allowed.has(b))continue;
    const aWords=[...matching.get(a)].filter(w=>!matching.get(b).has(w));
    const bWords=[...matching.get(b)].filter(w=>!matching.get(a).has(w));
    if(aWords.length>=1&&bWords.length>=1)pairs.push({a,b,aWords,bWords});
  }
  const rng=createRng(hashSeed(`${mission.id}:sort:${ordinal}`));
  const pair=pairs.find(p=>targets.includes(p.a)&&targets.includes(p.b))||pairs.find(p=>targets.includes(p.a)||targets.includes(p.b))||pairs[0];
  if(!pair) return null;
  // Retain the existing builder where its eligible initial-sound pool agrees
  // with this mission. Otherwise use explicit word-context spelling bins.
  const built=isSoundDistinct(pair.a,pair.b)?buildSoundSort({stopId:stop.id,stopIndex,stop:{...stop,words:pool},targetA:pair.a,targetB:pair.b,ordinal}):null;
  if(built&&built.view.items.every(i=>wordIsAvailable(i.word,allowed)&&pool.includes(i.word))){
    built.view.items=built.view.items.map(i=>({...i,audio:spokenWord(i.word)}));
    return decorate(built,mission,ordinal,mode,'sound-contrast');
  }
  const bins=[pair.a,pair.b].map((id,i)=>({id:`bin${i}`,grapheme:targetInfo(pair.a).grapheme===targetInfo(pair.b).grapheme?`${targetInfo(id).grapheme} in ${targetInfo(id).anchorWord}`:targetInfo(id).grapheme,soundLabel:'',audio:targetAudio(id),anchorWord:targetInfo(id).anchorWord,anchorAudio:spokenWord(targetInfo(id).anchorWord)}));
  const raw=[...rng.shuffle(pair.aWords).slice(0,3).map(word=>({word,bin:'bin0'})),...rng.shuffle(pair.bWords).slice(0,3).map(word=>({word,bin:'bin1'}))];
  const items=rng.shuffle(raw).map((entry,i)=>({...entry,id:`item${i}`}));
  return decorate({mechanic:MECHANICS.SOUND_SORT,stopId:stop.id,targetIds:[pair.a,pair.b],domain:'spelling_pattern_sort',review:false,prompt:{text:'Read the word. Find its letter pattern.',cues:[]},view:{mode:'read',bins,items:items.map(({id,word})=>({id,word,audio:spokenWord(word),image:''}))},key:{bins:Object.fromEntries(items.map(i=>[i.id,i.bin])),binTargets:{bin0:pair.a,bin1:pair.b}},seed:rng.next()},mission,ordinal,mode,'spelling_pattern_sort');
}
function buildExtendedMission(mission,progress,ordinal) {
  const c=mission.curriculum,anchors=c.anchorIds.map(id=>QUEST_STOPS.find(s=>s.id===id));
  const stopIndex=Math.max(...anchors.map(s=>s.index));
  const targets=c.targetIds||[],allowed=new Set(Object.keys(progress.targets||{}).filter(id=>progress.targets[id]?.taught));
  const beats=[];
  if(c.mode==='teach')for(const [i,id]of targets.entries()){
    allowed.add(id);
    const sign=buildSignpost({stopId:c.anchorIds[0],targetIds:[id],ordinal,index:i});
    if(!sign)fail('unavailable-introduction',mission,`No canonical introduction for ${id}`);
    sign.prompt.cues=sign.prompt.cues.filter(cue=>cue.src);
    const anchor=targetInfo(id)?.anchorWord;
    if(anchor&&spokenWord(anchor)){
      sign.view.cards=sign.view.cards.map(card=>({...card,anchorAudio:spokenWord(card.anchorWord)}));
      if(!sign.prompt.cues.some(cue=>cue.kind==='word'))sign.prompt.cues.push({kind:'word',src:spokenWord(anchor),text:anchor});
    }
    beats.push(decorate(sign,mission,ordinal+i,'supported-practice','sound-introduction'));
  }
  if(CAMPAIGN_LEARNING_PACKS[mission.id]) {
    beats.push(...oralBeats(mission,ordinal+beats.length,c.mode==='teach'?'supported-practice':'independent-check'));
    if(mission.finale){
      const cumulative=[...new Set(QUEST_STOPS.filter(stop=>stop.index<=stopIndex).flatMap(stop=>stop.words))].filter(word=>wordIsAvailable(word,allowed));
      const current=new Set(anchors.flatMap(stop=>stop.words));
      const candidates=[...cumulative.filter(word=>current.has(word)),...cumulative.filter(word=>!current.has(word))];
      if(cumulative.length>=2)for(const [n,word]of candidates.slice(0,6).entries()){
        const extra=readingBeat({...mission,familyId:n%2?'word-pop':'sound-steps'},word,cumulative,ordinal+beats.length*2+100, 'independent-check');
        beats.push({...extra,actId:'solve',sectionId:`${mission.id}-solve-reading`});
      }
    }
    return missionPack(mission,beats);
  }
  const sourceWords=[...new Set(anchors.flatMap(s=>s.words))];
  const pool=sourceWords.filter(word=>wordIsAvailable(word,allowed));
  if(!pool.length)fail('no-eligible-canonical-words',mission,`Teach prerequisites and provide canonical pronunciation/audio for ${sourceWords.join(', ')}`);
  const focused=pool.filter(word=>!targets.length||targets.some(id=>touchesTarget(word,id)));
  if(!focused.length)fail('no-target-word-configuration',mission,`No currently taught word demonstrates ${targets.join(', ')}`);
  const rng=createRng(hashSeed(`${mission.id}:word-section:${ordinal}`));
  const cumulative=[...new Set(QUEST_STOPS.filter(stop=>stop.index<=stopIndex).flatMap(stop=>stop.words))].filter(word=>wordIsAvailable(word,allowed));
  const shuffled=rng.shuffle(focused),review=rng.shuffle(cumulative.filter(word=>!focused.includes(word)));
  const retrieveWords=mission.kind==='optional'?[]:review.slice(0,6);
  const solveWords=shuffled.slice(0,mission.kind==='optional'?6:12);
  const applyWords=mission.kind==='optional'?[]:[...shuffled.slice(12),...review.slice(6)].slice(0,6);
  const words=[...retrieveWords,...solveWords,...applyWords];
  const actForWord=word=>retrieveWords.includes(word)?'retrieve':applyWords.includes(word)?'apply':'solve';
  const practicePool=mission.kind==='optional'?pool:cumulative;
  const mode=c.mode==='teach'?'supported-practice':'independent-check';
  const encoding=mission.familyId==='rescue-bridge'||mission.familyId==='fix-it-workshop';
  if(mission.familyId==='sound-herd'){
    const usedWords=new Set();
    for(let section=0;section<(mission.kind==='optional'?2:4);section++){
      const remaining=practicePool.filter(word=>!usedWords.has(word));
      const sort=sortingBeat(mission,remaining,targets,allowed,stopIndex,ordinal+beats.length,mode);
      if(!sort)break;
      for(const item of sort.view.items)usedWords.add(item.word);
      beats.push({...sort,actId:section===0?'retrieve':section===3?'apply':'solve',sectionId:`${mission.id}-sort-${section+1}`});
    }
  }else if(mission.familyId==='fix-it-workshop'){
    const earlierWords=[...new Set(QUEST_STOPS.filter(stop=>stop.index<=stopIndex).flatMap(stop=>stop.words))].filter(word=>wordIsAvailable(word,allowed));
    for(const word of words){
      const focusMission=actForWord(word)==='solve'?mission:{...mission,curriculum:{...mission.curriculum,targetIds:unitsFor(word).map(campaignUnitTarget)}};
      const replacement=workshopBeat(focusMission,word,earlierWords,allowed,stopIndex,ordinal+beats.length,actForWord(word)==='retrieve'?'independent-check':mode);
      if(replacement)beats.push({...replacement,actId:actForWord(word),sectionId:`${mission.id}-${actForWord(word)}`});
      if(beats.filter(b=>b.key).length>=(mission.kind==='optional'?6:24))break;
    }
    if(!beats.some(b=>b.key&&b.actId==='solve')){
      for(const word of solveWords.slice(0,mission.kind==='optional'?2:4)){
        if(unitsFor(word).some(unit=>!phonemeAudio(unit.soundKey,word)))continue;
        const assembly=wordBeat(mission,word,allowed,stopIndex,ordinal+beats.length,'supported-practice');
        assembly.view.workshop={mode:'assembly',reason:'No taught canonical one-part contrast available.'};
        assembly.prompt.text='Build a word at the workshop.';assembly.supportContext.construct='instructional-word-assembly';beats.push({...assembly,actId:'solve'});
      }
    }
  }else if(encoding){
    let wordCount=0;
    for(const word of words){
      if(unitsFor(word).some(unit=>!phonemeAudio(unit.soundKey,word)))continue;
      beats.push({...wordBeat(mission,word,allowed,stopIndex,ordinal+beats.length,actForWord(word)==='retrieve'?'independent-check':mode),actId:actForWord(word),sectionId:`${mission.id}-${actForWord(word)}`});
      wordCount++;
      if(wordCount>=(mission.kind==='optional'?3:24))break;
    }
  }else if(['word-pop','tree-rescue','sound-steps'].includes(mission.familyId)){
    for(const word of words.slice(0,mission.kind==='optional'?6:24))beats.push({...readingBeat(mission,word,practicePool,ordinal+beats.length,actForWord(word)==='retrieve'?'independent-check':mode),actId:actForWord(word),sectionId:`${mission.id}-${actForWord(word)}`});
  }else fail('missing-authored-mission-pack',mission,`No executable pack for family ${mission.familyId}`);
  if(!beats.some(beat=>beat.key))fail('empty-practice-pack',mission,'No eligible decisions remain after instruction');
  return missionPack(mission,beats);
}
function missionPack(mission,beats) {
  const rank={retrieve:0,solve:1,apply:2};
  const intros=beats.filter(b=>b.mechanic===MECHANICS.SIGNPOST),tasks=beats.filter(b=>b.mechanic!==MECHANICS.SIGNPOST).sort((a,b)=>(rank[a.actId||'solve']??1)-(rank[b.actId||'solve']??1));
  const actIds=[...new Set(tasks.map(b=>b.actId||'solve'))];
  const titles={retrieve:'Find the supplies',solve:'Help your friend',apply:'Bring it home'};
  beats=[...intros,...tasks.map(b=>({...b,act:actIds.length>1?{id:b.actId||'solve',title:titles[b.actId||'solve'],index:actIds.indexOf(b.actId||'solve'),total:actIds.length}:undefined}))];
  const scenarioCount=new Set(tasks.flatMap(b=>b.mechanic===MECHANICS.SOUND_SORT?b.view.items.map(item=>`${b.id}:${item.id}`):[b.key?.scenarioId||b.id])).size;
  const decisionCount=beats.reduce((n,b)=>n+(b.mechanic===MECHANICS.SIGNPOST?0:b.mechanic===MECHANICS.WORD_FORGE||b.mechanic==='sentence_build'?b.view.slots:b.mechanic===MECHANICS.SOUND_SORT?b.view.items.length:1),0);
  return {missionId:mission.id,beats,coverage:{decisionCount,scenarioCount,wordLevelDecisions:tasks.filter(b=>b.key?.word||b.domain==='auditory_word_recognition').length,sectionCount:new Set(beats.map(b=>b.sectionId||b.view.scenarioId||b.id)).size,durationEvidence:'requires-measured-playthrough',independentMasteryClaim:false}};
}

function grammarBeat(mission,item,ordinal,mode) {
 const rng=createRng(hashSeed(`${mission.id}:grammar:${ordinal}`));
 const tiles=rng.shuffle(item.options.map(option=>({id:option.id,grapheme:option.label,audio:option.audio})));
 return decorate({mechanic:'sentence_build',stopId:mission.curriculum.anchorIds[0],targetIds:[],domain:'grammar_tense',review:false,prompt:{text:'Finish the message.',cues:[{kind:'instruction',src:item.audio}]},view:{tiles,slots:1,context:item.prefix,objectId:'letter',scenarioId:item.id},key:{sequence:[item.options.find(o=>o.label===item.form).id],supportText:`${item.prefix} ${item.form}.`,scenarioId:item.id},seed:rng.next()},mission,ordinal,mode,'grammar_tense');
}

function workshopBeat(mission,word,sourceWords,allowed,stopIndex,ordinal,mode){
 const targetUnits=unitsFor(word);
 if(targetUnits.some(unit=>!phonemeAudio(unit.soundKey,word)))return null;
 const pairs=sourceWords.filter(base=>base!==word).map(base=>({base,units:unitsFor(base)})).filter(({units})=>units.length===targetUnits.length).map(pair=>({...pair,differences:pair.units.map((unit,i)=>unit.grapheme!==targetUnits[i].grapheme?i:-1).filter(i=>i>=0)})).filter(pair=>pair.differences.length===1&&mission.curriculum.targetIds.includes(campaignUnitTarget(targetUnits[pair.differences[0]]))&&pair.units.every((unit,i)=>pair.differences.includes(i)||unit.soundKey===targetUnits[i].soundKey));
 const rng=createRng(hashSeed(`${mission.id}:workshop:${ordinal}`));
 const pair=rng.shuffle(pairs).find(({base,units,differences})=>phonemeAudio(units[differences[0]].soundKey,base));
 if(!pair)return null;
 const slotIndex=pair.differences[0],unit=targetUnits[slotIndex],old=pair.units[slotIndex];
 const beat=wordBeat(mission,word,allowed,stopIndex,ordinal,mode);
 const correctId=beat.key.sequence[slotIndex];
 const candidates=beat.view.tiles.filter(tile=>tile.id===correctId||!beat.key.sequence.includes(tile.id));
 if(!candidates.some(tile=>tile.grapheme===old.grapheme)){candidates.push({id:'original-part',grapheme:old.grapheme,audio:phonemeAudio(old.soundKey,pair.base)});beat.key.tileSounds['original-part']=old.soundKey;}
 beat.view.tiles=rng.shuffle(candidates);beat.view.slots=1;
 beat.view.workshop={mode:'replace',baseWord:pair.base,baseWordAudio:spokenWord(pair.base),baseUnits:pair.units.map(u=>u.grapheme),slotIndex};
 beat.key.sequence=[correctId];beat.key.tileSounds=Object.fromEntries(beat.view.tiles.map(tile=>[tile.id,beat.key.tileSounds[tile.id]]));
 beat.targetIds=[campaignUnitTarget(unit)];beat.supportContext.construct='phoneme-substitution-encoding';
 beat.prompt.text='Listen. Change the marked part.';
 return beat;
}


// Refresh unscored picture introductions on resume. Saved answers, attempts,
// support and completed outcomes retain their original identity and history.
export function refreshCampaignTeaching(beats){
 return beats.map(beat=>{
  if(beat.mechanic!==MECHANICS.SIGNPOST)return beat;
  const current=buildSignpost({stopId:beat.stopId,targetIds:beat.targetIds,index:beat.view.position});
  const cards=current.view.cards.map(card=>({...card,anchorAudio:spokenWord(card.anchorWord)||card.anchorAudio}));
  const cues=current.prompt.cues.map(cue=>cue.kind==='word'?{...cue,src:spokenWord(cue.text)||cue.src}:cue);
  return {...beat,view:{...beat.view,cards},prompt:{...current.prompt,cues}};
 });
}
