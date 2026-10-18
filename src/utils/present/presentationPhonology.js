// Oral listening activities: the teacher establishes each picture name before
// children clap or compare endings. Print is support, never a decoding test.
import {PRESENT_VOCABULARY} from '../../data/presentVocabulary.js';

export const PRESENT_SYLLABLE_WORDS = [
  {word:'apple',beats:2},{word:'cat',beats:1},{word:'elephant',beats:3},
  {word:'map',beats:1},{word:'rabbit',beats:2},{word:'butterfly',beats:3},
  {word:'sun',beats:1},{word:'pencil',beats:2},{word:'umbrella',beats:3},
  {word:'dog',beats:1},{word:'window',beats:2},{word:'octopus',beats:3},
  {word:'fish',beats:1},{word:'monkey',beats:2},{word:'tomato',beats:3},
  {word:'goat',beats:1},{word:'potato',beats:3},{word:'bird',beats:1},
  {word:'igloo',beats:2},{word:'under',beats:2},
  ...['tent','sock','nest','fan','log','rug','hen','mouse','lamp','bag','web',
   'quilt','cup','pan','box','egg','vest','kite','jug','van','jump','shell',
   'chair','ball','call','ink','pig','ox','pot','net','whale','wheel','sink',
   'pink','ring','sing','bell','dress','day','stay','cry','shy','song','long']
   .map(word=>({word,beats:1}))
];
export const PRESENT_RHYME_WORDS = [
  {word:'cat',rhyme:'hat',other:'dog'}, {word:'dog',rhyme:'log',other:'sun'},
  {word:'pig',rhyme:'wig',other:'map'}, {word:'bug',rhyme:'rug',other:'hen'},
  {word:'fan',rhyme:'van',other:'leaf'}, {word:'goat',rhyme:'boat',other:'cup'},
  {word:'fox',rhyme:'box',other:'fish'}, {word:'bee',rhyme:'tree',other:'cat'},
  {word:'cake',rhyme:'snake',other:'sock'}, {word:'map',rhyme:'cap',other:'hen'},
  {word:'pin',rhyme:'fin',other:'hat'}, {word:'net',rhyme:'wet',other:'cup'},
  {word:'bed',rhyme:'red',other:'pig'}, {word:'top',rhyme:'mop',other:'hat'},
  {word:'hen',rhyme:'pen',other:'dog'}, {word:'sock',rhyme:'rock',other:'cup'},
  {word:'star',rhyme:'car',other:'pig'}, {word:'book',rhyme:'cook',other:'fan'},
  {word:'nest',rhyme:'vest',other:'dog'}, {word:'mouse',rhyme:'house',other:'cat'},
  {word:'bag',rhyme:'flag',other:'cup'}
];

const rotate=(items,offset)=>items.length?[...items.slice(offset%items.length),...items.slice(0,offset%items.length)]:[];

// Build the actual earlier lesson sequence, so review provenance names a real
// previous occurrence rather than guessing that an arbitrary word was taught.
export function presentPhonologyRounds(cycleNumber,day,kind) {
 const number=Number(cycleNumber);
 if(!Number.isInteger(number)||!PRESENT_VOCABULARY[number])throw new RangeError(`Unknown Present cycle: ${cycleNumber}`);
 const activityDays=kind==='syllables'?['monday','wednesday']:kind==='rhyme'?['tuesday','friday']:[];
 if(!activityDays.length)throw new RangeError(`Unknown oral activity: ${kind}`);
 if(!activityDays.includes(day))return [];
 const bank=kind==='syllables'?PRESENT_SYLLABLE_WORDS:PRESENT_RHYME_WORDS;
 const history=new Map(),seen=new Set();
 for(let week=1;week<=number;week++){
  const used=new Set(),reviews=[];
  const takeReview=(candidates,sourceCycle,role)=>{
   const item=candidates.find(item=>!used.has(item.word));
   if(!item)throw new Error(`No distinct ${kind} review for cycle ${week}`);
   used.add(item.word);reviews.push({...item,reviewCycle:sourceCycle||item.sourceCycle,roundRole:role});
  };
  const previous=history.get(week-1)||[];
  const previousPractice=previous.filter(item=>!item.reviewCycle);
  if(week>1){
   takeReview(rotate(previousPractice,week),week-1,'last-week');
   if(week===2)takeReview(rotate(previousPractice,week+2),week-1,'last-week');
   else {
    const lastWords=new Set(previous.map(item=>item.word));
    const preferredWeek=Math.max(1,week-(2+week%4));
    const olderWeeks=[...history].filter(([number])=>number<week-1).sort(([a],[b])=>Math.abs(a-preferredWeek)-Math.abs(b-preferredWeek));
    const older=olderWeeks.flatMap(([number,items])=>rotate(items.filter(item=>!item.reviewCycle&&!lastWords.has(item.word)),week).map(item=>({...item,sourceCycle:number})));
    takeReview(older,null,'earlier-review');
   }
  }
  const focus=new Set(PRESENT_VOCABULARY[week].map(item=>item.word));
  const rotated=rotate(bank,(week-1)*4);
  const candidates=[...rotated.filter(item=>focus.has(item.word)||focus.has(item.rhyme)),...rotated.filter(item=>!seen.has(item.word)),...rotated.filter(item=>!previous.some(old=>old.word===item.word)),...rotated];
  const practice=[];
  const takePractice=preferred=>{
   const item=preferred.find(item=>!used.has(item.word));
   if(!item)throw new Error(`No distinct ${kind} practice for cycle ${week}`);
   used.add(item.word);practice.push({...item,reviewCycle:null,roundRole:week===1?'starter-practice':'weekly-practice'});
  };
  // One current vocabulary anchor per day when available; add contrasting beat
  // counts and fresh rhyme families before reusing older practice examples.
  const current=candidates.filter(item=>focus.has(item.word)||focus.has(item.rhyme));
  while(practice.length<2&&current.some(item=>!used.has(item.word)))takePractice(current);
  while(practice.length<(week===1?6:4)){
   const anchor=practice.length===2?practice[0]:practice.length===3?practice[1]:null;
   let desired=practice.length===2?(week%2?2:3):practice.length===3?(week%2?3:2):[1,2,3][practice.length%3];
   if(anchor?.beats===desired)desired=desired===2?3:2;
   const varied=kind==='syllables'?candidates.filter(item=>item.beats===desired):[];
   takePractice([...varied,...candidates]);
  }
  const rounds=week===1?[practice[0],practice[2],practice[4],practice[1],practice[3],practice[5]]:[practice[0],practice[2],reviews[0],practice[1],practice[3],reviews[1]];
  history.set(week,rounds);rounds.forEach(item=>seen.add(item.word));
 }
 return history.get(number).slice(activityDays.indexOf(day)*3,activityDays.indexOf(day)*3+3).map((item,index)=>({...item,oralRound:index+1,oralRoundCount:3}));
}

export function buildPresentPhonology({cycle,day,names,world,slide,esc,wordAudio,wordImage,shuffle}) {
 const hear=word=>`<button class="p-audio p-audio-ghost" type="button" data-play="${esc(wordAudio(word))}">Hear ${esc(word)}</button>`;
 const picture=word=>({imagePath:wordImage(word),meaning:word,imageRole:'vocabulary-support',sceneRequirements:`Recognisable ${word}; teacher establishes the spoken picture name.`});
 const build=(kind,item)=>{
  const syllables=kind==='syllables';
  const words=syllables?[item.word]:[item.word,item.rhyme,item.other];
  const choices=shuffle(syllables?[1,2,3].map(value=>({text:String(value),correct:value===item.beats})):[{text:item.rhyme,correct:true},{text:item.other,correct:false}],`${cycle.id}:${day}:${kind}`);
  const prompt=syllables?'Listen, say the word and clap its beats. How many?':`Which picture rhymes with ${item.word}? Listen to the endings.`;
  const explanation=syllables?`${item.word} has ${item.beats} ${item.beats===1?'beat':'beats'}. Say it slowly and clap ${item.beats} ${item.beats===1?'time':'times'}.`:`${item.word} and ${item.rhyme} rhyme. Their ending sounds are the same.`;
  const reviewLabel=item.roundRole==='last-week'?'Remember last week':item.roundRole==='earlier-review'?'Remember an earlier week':"This week's practice";
  return slide(world,`<p class="p-kicker">${syllables?'Clap the syllables':'Listen for a rhyme'} · Round ${item.oralRound} of 3 · ${reviewLabel}</p><p class="p-teacher-prompt">${esc(prompt)} Everyone responds before the teacher chooses.</p><div class="p-language-layout" data-language-activity data-phonology="${kind}" data-phonology-round="${item.oralRound}"><div class="p-phonology-model"><img class="p-language-picture" src="${esc(wordImage(item.word))}" alt="${esc(item.word)}"/>${hear(item.word)}</div><div class="p-language-response"><p class="p-language-stem">${syllables?'Clap. Count. Choose.':`What rhymes with ${esc(item.word)}?`}</p><div class="p-language-choices">${choices.map(choice=>`<div class="p-phonology-option"><button class="p-language-choice" type="button" data-language-choice data-language-correct="${choice.correct}" data-language-explanation="${esc(choice.correct?explanation:syllables?'Listen again. Say the whole word slowly and clap each beat.':`Listen to ${item.word} and ${choice.text}. Compare their ending sounds and try again.`)}" aria-pressed="false">${syllables?esc(choice.text):`<img src="${esc(wordImage(choice.text))}" alt=""/><span>${esc(choice.text)}</span>`}</button>${syllables?'':hear(choice.text)}</div>`).join('')}</div><p class="p-class-feedback" data-language-feedback role="status">${syllables?'Listen, clap and show the number with your fingers.':'Say both picture names, then point to your choice.'}</p></div></div>`,{
   cls:syllables?'p-syllable':'p-rhyming',section:'Games',responseCue:'Everyone: listen, say the picture names, then clap or point before the teacher selects.',
   teacher:`Round ${item.oralRound} of 3. ${item.reviewCycle?`Retrieve the word actually practised in cycle ${item.reviewCycle}.`:'Establish the current practice word orally.'} Replay its recording if useful. ${prompt} Model: ${explanation} Keep a wrong choice for listening and repair. Use the normal Next slide control for the next round. No writing, counters or child devices. Supported oral participation is not a score.`,
   meta:{target:item.word,construct:syllables?'syllable-counting':'rhyme-recognition',oralFamily:kind,oralActivityId:`${cycle.id}:${day}:${kind}`,oralRound:item.oralRound,oralRoundCount:3,roundRole:item.roundRole,reviewCycle:item.reviewCycle,spokenWord:item.word,syllableCount:syllables?item.beats:undefined,rhymingWord:syllables?undefined:item.rhyme,answer:syllables?String(item.beats):item.rhyme,choices,codeStatus:'adult-supported-oral',childReadingClaim:false,responseTurns:3,vocabularyScenes:words.map(picture),requiredAudio:words.map(word=>({src:wordAudio(word),type:'audio',role:'spoken-word',transcript:word,required:true}))}
  });
 };
 return names.filter(name=>['syllables','rhyme'].includes(name)).flatMap(name=>presentPhonologyRounds(cycle.cycleNumber,day,name).map(item=>build(name,item)));
}

export const PRESENT_PHONOLOGY_CSS=`
.p-phonology-model,.p-phonology-option {display:flex;flex-direction:column;align-items:center;gap:16px;}
.p-phonology-option .p-language-choice {display:flex;flex-direction:column;align-items:center;gap:12px;min-width:150px;}
.p-phonology-option img {width:180px;height:160px;object-fit:contain;}
.p-syllable .p-language-choice {font-size:100px;min-width:160px;}
.p-syllable,.p-rhyming {gap:22px;}
`;
