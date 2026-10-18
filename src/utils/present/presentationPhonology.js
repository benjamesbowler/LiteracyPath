// Oral listening activities: the teacher establishes each picture name before
// children clap or compare endings. Print is support, never a decoding test.
export const PRESENT_SYLLABLE_WORDS = [
  {word:'apple',beats:2},{word:'cat',beats:1},{word:'elephant',beats:3},
  {word:'map',beats:1},{word:'rabbit',beats:2},{word:'butterfly',beats:3},
  {word:'sun',beats:1},{word:'pencil',beats:2},{word:'umbrella',beats:3},
  {word:'dog',beats:1},{word:'window',beats:2},{word:'octopus',beats:3},
  {word:'fish',beats:1},{word:'monkey',beats:2},{word:'tomato',beats:3},
  {word:'goat',beats:1},{word:'potato',beats:3},{word:'bird',beats:1}
];
export const PRESENT_RHYME_WORDS = [
  {word:'cat',rhyme:'hat',other:'dog'}, {word:'dog',rhyme:'log',other:'sun'},
  {word:'pig',rhyme:'wig',other:'map'}, {word:'bug',rhyme:'rug',other:'hen'},
  {word:'fan',rhyme:'van',other:'leaf'}, {word:'goat',rhyme:'boat',other:'cup'},
  {word:'fox',rhyme:'box',other:'fish'}, {word:'bee',rhyme:'tree',other:'cat'},
  {word:'cake',rhyme:'snake',other:'sock'}
];

export function buildPresentPhonology({cycle,day,names,world,slide,esc,wordAudio,wordImage,shuffle}) {
 const index=(cycle.cycleNumber-1)*2+(['wednesday','friday'].includes(day)?1:0);
 const hear=word=>`<button class="p-audio p-audio-ghost" type="button" data-play="${esc(wordAudio(word))}">Hear ${esc(word)}</button>`;
 const picture=word=>({imagePath:wordImage(word),meaning:word,imageRole:'vocabulary-support',sceneRequirements:`Recognisable ${word}; teacher establishes the spoken picture name.`});
 const build=(kind,item)=>{
  const syllables=kind==='syllables';
  const words=syllables?[item.word]:[item.word,item.rhyme,item.other];
  const choices=shuffle(syllables?[1,2,3].map(value=>({text:String(value),correct:value===item.beats})):[{text:item.rhyme,correct:true},{text:item.other,correct:false}],`${cycle.id}:${day}:${kind}`);
  const prompt=syllables?'Listen, say the word and clap its beats. How many?':`Which picture rhymes with ${item.word}? Listen to the endings.`;
  const explanation=syllables?`${item.word} has ${item.beats} ${item.beats===1?'beat':'beats'}. Say it slowly and clap ${item.beats} ${item.beats===1?'time':'times'}.`:`${item.word} and ${item.rhyme} rhyme. Their ending sounds are the same.`;
  return slide(world,`<p class="p-kicker">${syllables?'Clap the syllables':'Listen for a rhyme'}</p><p class="p-teacher-prompt">${esc(prompt)} Everyone responds before the teacher chooses.</p><div class="p-language-layout" data-language-activity data-phonology="${kind}"><div class="p-phonology-model"><img class="p-language-picture" src="${esc(wordImage(item.word))}" alt="${esc(item.word)}"/>${hear(item.word)}</div><div class="p-language-response"><p class="p-language-stem">${syllables?'Clap. Count. Choose.':`What rhymes with ${esc(item.word)}?`}</p><div class="p-language-choices">${choices.map(choice=>`<div class="p-phonology-option"><button class="p-language-choice" type="button" data-language-choice data-language-correct="${choice.correct}" data-language-explanation="${esc(choice.correct?explanation:syllables?'Listen again. Say the whole word slowly and clap each beat.':`Listen to ${item.word} and ${choice.text}. Compare their ending sounds and try again.`)}" aria-pressed="false">${syllables?esc(choice.text):`<img src="${esc(wordImage(choice.text))}" alt="${esc(choice.text)}"/><span>${esc(choice.text)}</span>`}</button>${syllables?'':hear(choice.text)}</div>`).join('')}</div><p class="p-class-feedback" data-language-feedback role="status">${syllables?'Listen, clap and show the number with your fingers.':'Say both picture names, then point to your choice.'}</p></div></div>`,{
   cls:syllables?'p-syllable':'p-rhyming',section:'Games',responseCue:'Everyone: listen, say the picture names, then clap or point before the teacher selects.',
   teacher:`Establish each familiar picture name orally; replay its recording if useful. ${prompt} Model: ${explanation} Keep a wrong choice for listening and repair. No writing, counters or child devices. Supported oral participation is not a score.`,
   meta:{target:item.word,construct:syllables?'syllable-counting':'rhyme-recognition',oralFamily:kind,spokenWord:item.word,syllableCount:syllables?item.beats:undefined,rhymingWord:syllables?undefined:item.rhyme,answer:syllables?String(item.beats):item.rhyme,choices,codeStatus:'adult-supported-oral',childReadingClaim:false,responseTurns:3,vocabularyScenes:words.map(picture),requiredAudio:words.map(word=>({src:wordAudio(word),type:'audio',role:'spoken-word',transcript:word,required:true}))}
  });
 };
 return names.filter(name=>['syllables','rhyme'].includes(name)).map(name=>build(name,name==='syllables'?PRESENT_SYLLABLE_WORDS[index%PRESENT_SYLLABLE_WORDS.length]:PRESENT_RHYME_WORDS[index%PRESENT_RHYME_WORDS.length]));
}

export const PRESENT_PHONOLOGY_CSS=`
.p-phonology-model,.p-phonology-option {display:flex;flex-direction:column;align-items:center;gap:16px;}
.p-phonology-option .p-language-choice {display:flex;flex-direction:column;align-items:center;gap:12px;min-width:150px;}
.p-phonology-option img {width:180px;height:160px;object-fit:contain;}
.p-syllable .p-language-choice {font-size:100px;min-width:160px;}
.p-syllable,.p-rhyming {gap:22px;}
`;
