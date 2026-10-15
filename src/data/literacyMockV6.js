import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { literacyMockDemandV6, LITERACY_MOCK_DEMAND_LADDERS } from '../policy/literacyMockDemandV6.js';

// Phoneme tiles are deliberately authored. The same target has one exposure
// identity at either rung; changing its tile bank cannot manufacture fresh work.
const teamWords=[
 ['rain','r ai n'],['boat','b oa t'],['seed','s ee d'],['feet','f ee t'],['moon','m oo n'],['food','f oo d'],
 ['goat','g oa t'],['coat','c oa t'],['soap','s oa p'],['mail','m ai l'],['sail','s ai l'],['tail','t ai l'],
 ['pain','p ai n'],['rail','r ai l'],['wait','w ai t'],['road','r oa d'],['load','l oa d'],['team','t ea m'],
 ['meat','m ea t'],['neat','n ea t'],['seat','s ea t'],['heat','h ea t'],['loaf','l oa f'],
 ['paint','p ai n t'],['train','t r ai n'],['brain','b r ai n'],['float','f l oa t'],['toast','t oa s t'],
 ['sleep','s l ee p'],['green','g r ee n'],['dream','d r ea m'],['steam','s t ea m'],['creek','c r ee k'],
 ['spoon','s p oo n'],['broom','b r oo m'],['bloom','b l oo m'],['grain','g r ai n'],['plain','p l ai n'],
 ['cloak','c l oa k'],['coast','c oa s t'],['roast','r oa s t'],['boast','b oa s t'],['clean','c l ea n'],['steep','s t ee p'],
];

export function buildLiteracyMockV6(base,normalize) {
 const prompt='Build the word you hear.',instruction=getLedaInstructionAudioPath(prompt);
 if(!instruction)throw Error('Missing exact word-construction direction.');
 const originals=teamWords.map(([word,sequence])=>{
  const target=getLedaWordAudioPath(word),tiles=sequence.split(' '),team=tiles.find(t=>t.length===2);
  if(!target||tiles.join('')!==word)throw Error(`Missing or invalid vowel-team source: ${word}`);
  const vowelFoil=team==='ai'?'oa':'ai',consonantFoil=tiles.includes('z')?'v':'z';
  return normalize({id:`mock.v6.phonics.team-build.${word}`,skillId:'vowel_teams',domainId:'phonics',level:2,
   format:'build_word',answerMode:'exact',prompt,answer:word,targetWord:word,phonemeTiles:tiles,
   choices:[...tiles,vowelFoil,consonantFoil].map((label,i)=>({id:`c${i}`,label})),
   modality:'dictation',evidenceModality:'audio+print',constructClaim:'construct_vowel_team_word_with_spare_tiles',
   requiredAudioCues:[{role:'instruction',text:prompt,path:instruction,required:true},{role:'target_word',text:word,path:target,required:true}],
   stimulusKey:word,exposureFamilyId:`v6-phonics-team:${word}`,
   mediaDecision:{role:'audio-and-print',paths:[],constructReview:'approved',answerNeutral:'approved',reason:'The recorded word is the dictation stimulus. Images and spoken tile labels would supply unwanted help.'},
   sourceProvenance:{kind:'original_literacy_guide',file:'src/data/literacyMockV6.js',sourceId:word},
   taskDemand:{reviewed:true,operation:'construct_vowel_team_word_with_spare_tiles',features:{phonemeCount:tiles.length,vowelTeam:team,consonantBlend:tiles.length>=4,spareTiles:2}},
   difficultyEvidence:tiles.length===3?'Construct a whole three-phoneme word using a vowel team while rejecting spare graphemes.':'Coordinate a consonant blend and vowel team across at least four phonemes while rejecting spare graphemes.',
  });
 });
 return [...base,...originals].map(q=>{
  const band=literacyMockDemandV6(q),adaptiveDemand=band===null?null:LITERACY_MOCK_DEMAND_LADDERS[q.domainId][band];
  const snapshot={...q.itemSnapshot,contentVersion:'literacy-mock-v6',adaptiveAreaVersion:'areas-v2',adaptiveAreaBand:band,adaptiveMixedEligible:band!==null,adaptiveDemand};
  return {...q,...snapshot,itemSnapshot:snapshot};
 });
}
