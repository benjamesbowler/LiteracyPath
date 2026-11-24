import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { LITERACY_MOCK_BEGINNER_VOCABULARY, literacyMockBeginnerVocabularyIssue } from '../policy/literacyMockBeginnerVocabulary.js';
import { LITERACY_MOCK_ADAPTIVE_VERSION } from '../policy/literacyMockVersions.js';
import { newLiteracyMockV14Items } from './literacyMockV14Items.js';

const words = text => text.split(' ');

// Explicit sound inventories. Spelling alone cannot establish the sound of
// phone, cone, nose, or the final consonants of words such as knife and give.
const ONSETS = {
  b:'bag ball bear bed bee bike bird boot bus', k:'cake cap car cat coat corn cow cup key kite',
  d:'deer desk dog doll door duck', f:'fan feather fish foot fork fox', g:'gate goat', h:'hand hat hen horse house',
  j:'jam jar jet', l:'leaf leg lemon lion log', m:'map mat milk moon mop mouse mug',
  n:'neck nest net nose nut', p:'pan peach pear pen pig pin pot', r:'rabbit rain rat ring rock',
  s:'sand seal sink snail snake sock sun', sh:'sheep shell ship shoe', t:'tent tiger tire tooth top',
  v:'van vase', w:'watch web whale wheel wig', z:'zebra zipper zoo',
};
const FINALS = {
  t:'bat boat coat feet hat light mat net seat wet', d:'bed bird food head lid mud red seed',
  p:'cap cup hop lip map mop soap soup tap', k:'back bike book cake duck lake lock neck rock sock',
  n:'bun can fan green hen lion moon pan pen rain sun', m:'arm drum farm foam gum ham jam room',
  f:'beef leaf life roof safe', v:'cave dive five give wave', s:'bus face grass ice mouse race', z:'nose rose',
};
const grouped = groups => Object.entries(groups).flatMap(([sound,list]) => words(list).map(label => ({sound,label})));
const soundVocabulary = new Set(LITERACY_MOCK_BEGINNER_VOCABULARY.families.sound_awareness.allowedWords);
const onsetWords = grouped(ONSETS), finalWords = grouped(FINALS);

// These labels refer to single, concrete objects absent from the reviewed
// action scenes. For picture-to-print, exclude aliases and incidental objects.
const readingFoils = words('hen pig mop fan cup jam pen bib pot fox bag jet rug bus van net nut wig web tub mug');
const sceneExclusions = {
  den:'log', pup:'dog', cub:'bear', bin:'can', cot:'bed', bat:'net', jam:'pot cup', top:'peg',
  gum:'lip', dam:'log', rub:'rag', leg:'wig', nut:'cup', bag:'sac', pen:'lid', wig:'cap',
};
const actionNouns = words('fox sheep jet fan whale fork goat drum tent key pig mop sock fish moon kite hat umbrella nest');
const incidentalNouns = {
  sleep:'bed', cook:'fork', bake:'fork', eat:'fork', wear:'sock hat', peel:'fork', stir:'fork',
  carry:'hat', drive:'hat', swim:'fish', bend:'sock', kick:'sock', walk:'hat', march:'hat', feed:'hen',
};
// Each key scene shows just one of these candidate actions. Exclusions for a
// specific scene cover secondary actions (e.g. holding a tool while digging).
const phonicsVocabulary = new Set(LITERACY_MOCK_BEGINNER_VOCABULARY.families.phonics.allowedWords);
const frequentWords = words('all an and are as at be been but by can could did do does down for from get go had has have he her here him his how if in into is it its may me my no not now of off on one or our out over ran said saw say see she so some that the them then they this to too two up us was we went were what when will with yes you your').filter(w => phonicsVocabulary.has(w));
const sameSound = ['to too two','no know','by buy bye','one won','for four','are our','their there','hear here','see sea','be bee','so sew','him hymn','were whir','we wee','its it'].map(words);

const actionVerbs = words('swim peel clap sleep bounce hug sneeze stir chop kick pour whisper dig read fold crawl');
const relatedActions = {
  throw:'bounce', push:'roll', pull:'stretch', roll:'bounce push', bounce:'throw roll', cook:'stir pour chop peel',
  bake:'stir pour chop peel', eat:'stir', drink:'pour', cut:'chop', peel:'chop', read:'whisper',
  draw:'read', shout:'whisper', hug:'whisper', whisper:'hug', sneeze:'whisper', wash:'pour', feed:'pour',
  carry:'hug', write:'read', sleep:'hug', lift:'hug', bend:'crawl', stretch:'clap', point:'clap', sing:'whisper',
};

function hash(value) {
  let h = 2166136261;
  for (const character of value) h = Math.imul(h ^ character.charCodeAt(0), 16777619);
  return h >>> 0;
}
function pickDistinct(pool, count, item, counts, groupOf = value => value, occupied = []) {
  const blocked = new Set(occupied);
  const candidates = [...pool].sort((a,b) => (counts.get(a) || 0) - (counts.get(b) || 0)
    || hash(item.id + a) - hash(item.id + b));
  const picked = [];
  for (const word of candidates) {
    if (blocked.has(groupOf(word))) continue;
    picked.push(word);
    blocked.add(groupOf(word));
    counts.set(word, (counts.get(word) || 0) + 1);
    if (picked.length === count) return picked;
  }
  throw Error('Incomplete reviewed contrast for ' + item.id);
}

function reviseChoiceLabels(item, labelsById, pictures) {
  const choices = item.choices.map(choice => {
    const label = labelsById.get(choice.id);
    if (!label || label === choice.label) return choice;
    const updated = { id: choice.id, label };
    if (choice.audioPath) {
      updated.audioPath = getLedaWordAudioPath(label);
      if (!updated.audioPath) throw Error('Missing spoken choice: ' + label);
    }
    if (choice.image) Object.assign(updated, pictures.get(label));
    return updated;
  });
  const byId = new Map(choices.map(choice => [choice.id, choice]));
  const requiredAudioCues = item.requiredAudioCues.map(cue => {
    const choice = byId.get(cue.choiceId);
    return cue.role === 'choice' && choice ? {...cue, text:choice.label, value:choice.label, path:choice.audioPath} : cue;
  });
  const requiredImagePaths = [...new Set([item.image,...choices.map(c => c.image)].filter(Boolean))];
  const foils = choices.filter(choice => choice.id !== item.answer);
  const key = byId.get(item.answer).label;
  let reason;
  if (item.domainId === 'sound_awareness') {
    const position = item.adaptiveAreaBand === 0 ? 'first' : 'last';
    reason = word => `The ${position} sound of ${word} differs from that of ${item.targetWord}.`;
  } else if (item.domainId === 'phonics') reason = word => word+' is a different printed word from the recording of '+key+'.';
  else if (item.domainId === 'writing') reason = () => 'The capital letters do not follow the requested pattern.';
  else reason = word => `The picture shows ${key}; ${word} does not describe it.`;
  const proof = item.taskDemand?.proof;
  return {...item, choices, requiredAudioCues, requiredImagePaths,
    requiredAudioPaths:[...new Set(requiredAudioCues.map(c => c.path))],
    mediaDecision:{...item.mediaDecision, paths:requiredImagePaths},
    distractorRationales:Object.fromEntries(foils.map(c => [c.id,reason(c.label)])),
    ...(proof && { taskDemand:{...item.taskDemand,proof:{...proof,
      ...(proof.rejected && {rejected:foils.map(c=>c.label)}),
      ...(proof.nameCaseForms && {nameCaseForms:Object.fromEntries(choices.map(c=>[c.id,c.label]))}),
      ...(proof.choiceFinalPhonemes && {choiceFinalPhonemes:Object.fromEntries(choices.map(c=>[c.id, finalWords.find(w=>w.label===c.label)?.sound || proof.choiceFinalPhonemes[c.id]]))}),
    }}}),
    ...(item.domainId === 'sound_awareness' && {explanation:`${key} and ${item.targetWord} share their ${item.adaptiveAreaBand === 0 ? 'first' : 'last'} sound.`}),
  };
}

function reviseEarlyItem(item, counts, pictures) {
  const band = item.adaptiveAreaBand;
  if (!item.adaptiveMixedEligible || item.tutorialOnly || item.format !== 'choice' || band > 1) return item;
  const key = item.choices.find(c=>c.id===item.answer);
  const foilIds = item.choices.filter(c=>c.id!==item.answer).map(c=>c.id);
  const updates = new Map();
  const excluded = words(sceneExclusions[item.targetWord] || '');
  if (item.domainId === 'reading' && band === 0) {
    const foils = pickDistinct(readingFoils.filter(w=>!excluded.includes(w)),3,item,counts,w=>w[0],[key.label[0]]);
    foilIds.forEach((id,i)=>updates.set(id,foils[i]));
  } else if (item.domainId === 'phonics' && band === 0 &&
      item.choices.filter(c => c.id !== item.answer).some(c => ['and','the','as'].includes(c.label))) {
    const target = key.label.toLowerCase();
    const homophones = sameSound.find(set => set.includes(target)) || [];
    const candidates = frequentWords.filter(w => w !== target && !homophones.includes(w) && Math.abs(w.length - target.length) <= 2);
    // Include a partial visual match so scanning a single familiar letter
    // cannot reliably identify the recording. Rotate the remaining foils.
    const near = candidates.filter(w => w[0] === target[0] || w.slice(-1) === target.slice(-1));
    const first = pickDistinct(near.length ? near : candidates,1,item,counts)[0];
    const foils = [first,...pickDistinct(candidates,2,item,counts,w=>w,[first])];
    foilIds.forEach((id,i)=>updates.set(id,foils[i]));
  } else if (item.domainId === 'language' && item.skillId === 'verbs') {
    // One old classroom illustration is a group scene without an identifiable
    // crying action. Keep historical evidence but leave it outside new tests.
    if (item.targetWord === 'cry') return {...item, adaptiveMixedEligible:false};
    const excludedWords = words((band ? relatedActions : incidentalNouns)[key.label] || '');
    const pool = (band ? actionVerbs : actionNouns).filter(w=>w!==key.label && !excludedWords.includes(w) && getLedaWordAudioPath(w));
    const foils = pickDistinct(pool,3,item,counts);
    foilIds.forEach((id,i)=>updates.set(id,foils[i]));
  } else if (item.domainId === 'sound_awareness' && ['initial_sounds','final_sounds'].includes(item.skillId)) {
    const lexicon = band === 0 ? onsetWords : finalWords;
    const usesPictures = Boolean(key.image);
    const available = lexicon.filter(w=>soundVocabulary.has(w.label) && w.label!==item.targetWord && getLedaWordAudioPath(w.label) && (!usesPictures || pictures.has(w.label)));
    const soundOf = new Map(lexicon.map(w=>[w.label,w.sound]));
    const sound = band === 0 ? soundOf.get(key.label) : item.taskDemand?.proof?.targetFinalPhoneme;
    if (!sound) return item;
    const options = available.filter(w=>w.sound===sound).map(w=>w.label);
    if (options.length) updates.set(key.id, pickDistinct(options,1,item,counts)[0]);
    const foils = pickDistinct(available.map(w=>w.label),3,item,counts,w=>soundOf.get(w),[sound]);
    foilIds.forEach((id,i)=>updates.set(id,foils[i]));
  } else if (item.domainId === 'writing') {
    const initialOnly = /starts .*(?:capital letter)/.test(item.prompt);
    const competing = item.choices.filter(c=>c.id!==item.answer && (c.label === c.label.toUpperCase() || initialOnly && /^[A-Z]/.test(c.label)));
    if (!competing.length) return item;
    const lower = key.label.toLowerCase();
    const normal = new Set(item.choices.map(c=>c.label));
    const positions = [...lower].map((char,i)=>i>0 && /[a-z]/.test(char) ? i : -1).filter(i=>i>=0).reverse();
    const alternatives = positions.map(i=>lower.slice(0,i)+lower[i].toUpperCase()+lower.slice(i+1));
    alternatives.push(lower[0]+lower.slice(1).toUpperCase());
    for (const choice of competing) {
      const replacement = alternatives.find(label=>!normal.has(label));
      if (!replacement) return initialOnly ? {...item,adaptiveMixedEligible:false} : item;
      updates.set(choice.id,replacement);
      normal.add(replacement);
    }
  } else return item;
  return reviseChoiceLabels(item,updates,pictures);
}

export function validV14ActionContrast(item) {
  if (item.domainId !== 'language' || item.skillId !== 'verbs' || item.format !== 'choice'
    || !item.image || item.choices.length !== 4 || !item.taskDemand?.reviewed) return false;
  const key = item.choices.find(c => c.id === item.answer);
  if (!key || key.label !== item.targetWord || item.taskDemand.proof?.picturedAction !== key.label
    || !item.choices.every(c => c.audioPath && item.requiredAudioCues.some(cue => cue.role === 'choice'
      && cue.choiceId === c.id && cue.text === c.label && cue.path === c.audioPath))) return false;
  const words = item.constructClaim === 'action_word_against_object_word' ? actionNouns
    : item.constructClaim === 'distinguish_action_word_meaning' ? actionVerbs : [];
  return item.choices.filter(c => c.id !== key.id).every(c => words.includes(c.label));
}

export function buildLiteracyMockV14(base) {
  const pictures = new Map(['hammer','saw','wrench'].map(word => [word,{
    image:'/images/assessment/literacy-classroom/'+word+'.webp',imageAlt:word,
  }]));
  for (const item of base.filter(i=>i.adaptiveMixedEligible && i.mediaReady && !i.tutorialOnly)) {
    for (const c of item.choices) if (c.image && !pictures.has(c.label)) pictures.set(c.label,{image:c.image,imageAlt:c.imageAlt || c.label});
  }
  const counts = new Map();
  const revised = base.map(item=>{
    const cell = item.domainId + ':' + item.adaptiveAreaBand;
    if (!counts.has(cell)) counts.set(cell,new Map());
    let updated = reviseEarlyItem(item,counts.get(cell),pictures);
    if (updated.adaptiveMixedEligible && updated.domainId === 'sound_awareness' && updated.prompt === 'Listen. Choose the new word.'
      && updated.requiredAudioCues.some(c => c.role === 'phoneme')) {
      const instruction = updated.requiredAudioCues.find(c => c.role === 'instruction');
      if (instruction) updated = {...updated,prompt:instruction.text};
    }
    if (updated.domainId === 'sound_awareness' && updated.adaptiveMixedEligible
      && ['Which word rhymes with the word you hear?', 'Which word has the same starting sound?'].includes(updated.prompt)
      && updated.requiredAudioCues.some(c => c.role === 'target_word')
      && updated.requiredAudioCues.some(c => c.role === 'instruction' && c.text !== updated.prompt)) {
      const requiredAudioCues = updated.requiredAudioCues.map(c => c.role === 'instruction'
        ? {...c,text:updated.prompt,path:getLedaInstructionAudioPath(updated.prompt)} : c);
      updated = {...updated,requiredAudioCues,requiredAudioPaths:[...new Set(requiredAudioCues.map(c=>c.path))]};
    }
    if (updated.adaptiveMixedEligible && updated.format === 'build_word' && updated.choices.every(c => /^[a-z]$/.test(c.label))
      && updated.requiredAudioCues.some(c => c.role === 'target_word' && c.text === updated.answer)) {
      updated = {...updated,alphabetSpelling:true};
    }
    return updated;
  });
  // Keep literal option identities stable for scoring and replay. Distribute
  // authored key slots within each cell before the session's own seeded shuffle.
  const slots = new Map();
  const result = [...revised,...newLiteracyMockV14Items(pictures)].map(item=>{
    const snapshot = {...item,contentVersion:LITERACY_MOCK_ADAPTIVE_VERSION};
    delete snapshot.itemSnapshot;
    if (snapshot.adaptiveMixedEligible && snapshot.format === 'choice') {
      const cell = [snapshot.domainId,snapshot.adaptiveAreaBand,snapshot.choices.length].join(':');
      const visit = slots.get(cell) || 0;
      slots.set(cell,visit + 1);
      const index = snapshot.choices.findIndex(c => c.id === snapshot.answer);
      if (index < 0) throw Error('Missing choice key: '+snapshot.id);
      const choices = snapshot.choices.slice();
      const [correct] = choices.splice(index,1);
      choices.splice((visit + hash(cell)) % snapshot.choices.length,0,correct);
      snapshot.choices = choices;
    }
    if (snapshot.adaptiveMixedEligible) {
      const issue = literacyMockBeginnerVocabularyIssue(snapshot);
      if (issue) throw Error(snapshot.id + ': ' + issue.reason);
    }
    return {...snapshot,itemSnapshot:snapshot};
  });
  if (new Set(result.map(i=>i.id)).size !== result.length) throw Error('Duplicate V14 question IDs.');
  return result;
}
