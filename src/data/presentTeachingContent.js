// Authored US-English teaching units. IPA specifies the intended spoken result;
// spelling fragments are display aids, never an automatic phonology algorithm.
export const THREE_SYLLABLE_BANK = [
  ['strawberry',['straw','ber','ry'],'berry','strawber','/ˈstrɔː.bɛ.ri/','/ˈbɛ.ri/','/ˈstrɔː.bɛ/'],
  ['blueberry',['blue','ber','ry'],'berry','blueber','/ˈbluː.bɛ.ri/','/ˈbɛ.ri/','/ˈbluː.bɛ/'],
  ['butterfly',['but','ter','fly'],'terfly','butter','/ˈbʌ.tɚ.flaɪ/','/tɚ.flaɪ/','/ˈbʌ.tɚ/'],
  ['basketball',['bas','ket','ball'],'ketball','basket','/ˈbæs.kɪt.bɔːl/','/kɪt.bɔːl/','/ˈbæs.kɪt/'],
  ['ladybug',['la','dy','bug'],'dybug','lady','/ˈleɪ.di.bʌɡ/','/di.bʌɡ/','/ˈleɪ.di/'],
  ['grasshopper',['grass','hop','per'],'hopper','grasshop','/ˈɡræs.hɑ.pɚ/','/ˈhɑ.pɚ/','/ˈɡræs.hɑ/']
].map(([word,spokenUnits,firstResult,lastResult,ipa,firstIpa,lastIpa])=>({word,spokenUnits,first:spokenUnits[0],last:spokenUnits[2],rest:firstResult,firstResult,lastResult,unitType:'syllable',pronunciationReference:{dialect:'en-US',ipa,firstIpa,lastIpa},teacherNote:'Tap three syllables. Remove exactly one tap. The remainder may be a sound chunk rather than a word; keep its original vowel sounds.'}));
export function getPresentOralDeletion(word,position='first') {
  const item=THREE_SYLLABLE_BANK.find(record=>record.word===word);
  if(!item) return null;
  if(!['first','last'].includes(position)) throw new RangeError('Use first or last syllable.');
  return {...item,operation:'delete',removedUnitIndices:[position==='first'?0:2],expectedSpokenResult:position==='first'?item.firstResult:item.lastResult,expectedIpa:position==='first'?item.pronunciationReference.firstIpa:item.pronunciationReference.lastIpa};
}
export const PRESENT_WEEKLY_ORAL_SCHEDULE = [
  {day:'Monday',skillIndices:[0,1],purpose:'Model each declared oral skill, then try a different item.'},
  {day:'Tuesday',skillIndices:[1,0],purpose:'Retrieve the second skill first; revisit the first skill.'},
  {day:'Wednesday',skillIndices:[0,1],purpose:'Contrast the named units; explain what was removed or changed.'},
  {day:'Thursday',skillIndices:[1,0],purpose:'Apply both skills to fresh spoken words.'},
  {day:'Friday',skillIndices:[0,1],purpose:'Retrieve both skills without a prior answer model; sample supported and fresh responses separately.'}
];
export function getPresentTeachingSchedule(cycleNumber,dayIndex=0,skillCount=2,format='core') {
  const day=PRESENT_WEEKLY_ORAL_SCHEDULE[Math.max(0,Math.min(4,dayIndex))];
  const availableIndices=day.skillIndices.filter(index=>index<skillCount);
  const skillIndices=format==='review'?(availableIndices.length?[availableIndices[0]]:[]):availableIndices;
  return {...day,cycleNumber,format,skillIndices,rationale:format==='review'
    ?'Quick revisit selects one named oral skill per day: first, second, first, second, first across the week. This deliberate 3:2 allocation prioritises the first curriculum skill while retrieving the second twice. A one-skill cycle uses its only skill daily. Full cumulative sound and HFW review remains the default.'
    :'Daily lesson and Explore further give both declared oral skills a daily turn; first-turn order alternates deliberately. A one-skill cycle has one turn. Full cumulative review remains the default.'};
}

const HFW_ROWS = [
 ['am','æ m','a:m','', 'Being, when I talk about myself.','I am here.'],
 ['I','aɪ','','I','The person who is speaking.','I can help.'],
 ['a','ə','','a','One thing, before its name.','a cat'],
 ['the','ð ə','th','e','Points to a particular thing.','the red bag'],
 ['an','æ n','a:n','','One thing, before a vowel sound.','an egg'],
 ['and','æ n d','a:n:d','','Joins things or ideas.','you and me'],
 ['is','ɪ z','i','s','Being, for one person or thing.','It is hot.'],
 ['of','ə v','','o:f','Shows a part or connection.','a cup of water'],
 ['go','ɡ oʊ','g','o','Move to another place.','go home'],
 ['no','n oʊ','n','o','Refuses or says none.','no more'],
 ['so','s oʊ','s','o','Can mean very or therefore.','so big'],
 ['do','d uː','d','o','Perform an action.','do a job'],
 ['my','m aɪ','m','y','Belonging to me.','my bag'],
 ['to','t uː','t','o','Shows where someone goes.','to school'],
 ['into','ɪ n t uː','i:n:t','o','From outside to inside.','into the box'],
 ['said','s ɛ d','s:d','ai','Told something with words.','She said hello.'],
 ['not','n ɑ t','n:o:t','','Makes an idea negative.','not hot'],
 ['that','ð æ t','th:a:t','','Points to something farther away.','that hat'],
 ['he','h iː','h','e','A word for a boy or man already named.','He can run.'],
 ['me','m iː','m','e','The speaker receiving an action.','help me'],
 ['she','ʃ iː','sh','e','A word for a girl or woman already named.','She can run.'],
 ['are','ɑ r','','are','Being, with you or more than one.','You are here.'],
 ['as','æ z','a','s','Can show the same way or degree.','as tall as me'],
 ['you','j uː','','y:ou','The person I am talking to.','You can help.'],
 ['see','s iː','s','ee','Notice with your eyes.','see a bird'],
 ['was','w ʌ z','w','a:s','Being in the past.','It was hot.'],
 ['for','f ɔ r','f','or','Shows who receives something.','for you'],
 ['or','ɔ r','','or','Offers another choice.','cat or dog'],
 ['her','h ɝ','h','er','Belonging to a girl or woman; also names her as receiver.','her hat'],
 ['his','h ɪ z','h:i','s','Belonging to a boy or man.','his hat'],
 ['this','ð ɪ s','th:i:s','','Points to something near.','this cup'],
 ['with','w ɪ ð','w:i:th','','Together with or using something.','with a friend'],
 ['your','j ɔ r','y','our','Belonging to the person I am talking to.','your bag'],
 ['good','ɡ ʊ d','g:d','oo','Pleasant or useful; describes a positive quality.','good food'],
 ['look','l ʊ k','l:k','oo','Turn your eyes to notice.','look here'],
 ['all','ɔ l','','all','Every one or the whole amount.','all the blocks'],
 ['says','s ɛ z','s','ay:s','Tells something with words now.','He says hello.'],
 ['they','ð eɪ','th','ey','People or things already named.','They can help.'],
 ['each','iː tʃ','ch','ea','Every one considered separately.','each child'],
 ['like','l aɪ k','l:k','i:e','Enjoy or find pleasing.','I like apples.'],
 ['little','l ɪ t ə l','l:i:tt','le','Small in size or amount.','a little cup'],
 ['from','f r ʌ m','f:r:m','o','Shows a starting place or source.','from home'],
 ['have','h æ v','h:a:v','e','Own, hold or experience.','have a bag'],
 ['more','m ɔ r','m','ore','A greater amount or an extra amount.','more water'],
 ['about','ə b aʊ t','b:t','a:ou','Can mean concerning a topic.','a book about dogs'],
 ['out','aʊ t','t','ou','From inside to outside.','come out'],
 ['put','p ʊ t','p:t','u','Place something somewhere.','put it here'],
 ['be','b iː','b','e','Exist or become a certain way.','be kind'],
 ['get','ɡ ɛ t','g:e:t','','Receive or collect.','get a cup'],
 ['very','v ɛ r iː','v:e:r','y','Adds strength to a description.','very big'],
 ['what','w ʌ t','wh:t','a','Asks which thing or information.','What is it?'],
 ['when','w ɛ n','wh:e:n','','Asks at which time.','When can we go?'],
 ['who','h uː','','wh:o','Asks which person.','Who is here?'],
 ['does','d ʌ z','d','oe:s','Performs an action, with he or she.','She does it.'],
 ['goes','ɡ oʊ z','g','oe:s','Moves somewhere, with he or she.','He goes home.'],
 ['only','oʊ n l iː','n:l','o:y','Just one or no others.','only one'],
 ['other','ʌ ð ɚ','th','o:er','A different one.','the other cup'],
 ['off','ɔ f','o:ff','','Away from a surface or switched out of use.','take it off'],
 ['which','w ɪ tʃ','wh:i:ch','','Asks someone to select from choices.','Which cup?'],
 ['again','ə ɡ ɛ n','g:n','a:ai','One more time.','try again'],
 ['day','d eɪ','d','ay','The light part of a day, or a whole date.','a sunny day'],
 ['say','s eɪ','s','ay','Speak words.','say hello'],
 ['by','b aɪ','b','y','Can mean beside something.','by the door'],
 ['why','w aɪ','wh','y','Asks for a reason.','Why did it fall?'],
 ['try','t r aɪ','t:r','y','Make an effort to do something.','try to help'],
 ['first','f ɝ s t','f:s:t','ir','Before all the others in order.','first in line'],
 ['friend','f r ɛ n d','f:r:n:d','ie','Someone you know and enjoy being with.','my friend'],
 ['half','h æ f','h:a:f','l','One of two equal parts.','half an apple']
];
export const PRESENT_HFW_TEACHING=Object.fromEntries(HFW_ROWS.map(([word,sounds,regular,exception,meaning,phrase])=>[word,{word,phonemeIds:sounds.split(' '),regularParts:regular?regular.split(':'):[],exceptionParts:exception?exception.split(':'):[],meaning,phrase,pronunciationReference:{dialect:'en-US',ipa:sounds},mappingNote:'Regular means a correspondence used elsewhere in English; exception parts include code not yet secure in the early sequence. Teach their sound explicitly. Dialect variants may change vowels or with /θ/.',coverWritePrompt:`Read ${word}, say its sounds, cover it, write it from memory, then uncover and compare.`,likelyError:exception?`Using the usual early sound for ${exception.replaceAll(':',' / ')}.`:'Omitting or reversing a spoken sound.',correction:exception?`Map the familiar parts first; explicitly explain ${exception.replaceAll(':',' / ')} in this word, then hide and retry.`:'Say each sound and match it to its spelling, then hide and retry.',evidenceClaim:'supported-practice'}]));
export function getPresentHfwTeaching(word){return PRESENT_HFW_TEACHING[word]||null;}
const SOUND_BOX_ROWS=[['am',['æ','m'],['a','m']],['mat',['m','æ','t'],['m','a','t']],['sat',['s','æ','t'],['s','a','t']],['sit',['s','ɪ','t'],['s','i','t']],['ship',['ʃ','ɪ','p'],['sh','i','p']],['chip',['tʃ','ɪ','p'],['ch','i','p']],['box',['b','ɑ','k','s'],['b','o','x']],['ring',['r','ɪ','ŋ'],['r','i','ng']],['sink',['s','ɪ','ŋ','k'],['s','i','nk']]];
export const PRESENT_SOUND_BOX_ITEMS=SOUND_BOX_ROWS.map(([word,phonemeIds,graphemes])=>({id:`sound-box-${word}`,word,phonemeIds,graphemes,boxCount:phonemeIds.length,prerequisites:{graphemes},graphemeToPhonemeIndices:word==='box'?[[0],[1],[2,3]]:word==='sink'?[[0],[1],[2,3]]:graphemes.map((_,i)=>[i]),teacherNote:word==='box'?'x spells two sounds /k/ /s/: four counters, three spelling tiles.':word==='sink'?'nk spells /ŋ/ /k/: four counters, three spelling tiles.':'Move one counter for each sound, then map the spelling.',responseMode:'everyone-counters-then-volunteer',evidenceClaim:'supported-practice'}));
const CHAIN_ROWS=[['early',['mat','sat','sit'],[['m','a','t'],['s','a','t'],['s','i','t']],[0,1]],['digraph',['ship','chip','chin'],[['sh','i','p'],['ch','i','p'],['ch','i','n']],[0,2]],['short-vowel',['cat','cot','dot'],[['c','a','t'],['c','o','t'],['d','o','t']],[1,0]],['ng',['ring','sing','sang'],[['r','i','ng'],['s','i','ng'],['s','a','ng']],[0,1]]];
export const PRESENT_WORD_CHAINS=CHAIN_ROWS.map(([id,words,units,indices])=>({id:`chain-${id}`,words,prerequisites:{graphemes:[...new Set(units.flat())]},steps:indices.map((index,i)=>({from:words[i],to:words[i+1],operation:'substitute',unitType:'grapheme',index,oldUnit:units[i][index],newUnit:units[i+1][index],fromUnits:units[i],toUnits:units[i+1]})),teacherPrompt:'Hear the change. Everyone builds or writes before the board reveal. Read the whole new word. What stayed the same?',evidenceClaim:'supported-practice'}));

PRESENT_WORD_CHAINS.unshift({id:'chain-first-words',words:['am','at','mat'],prerequisites:{graphemes:['a','m','t']},steps:[
 {from:'am',to:'at',operation:'substitute',unitType:'grapheme',index:1,oldUnit:'m',newUnit:'t',fromUnits:['a','m'],toUnits:['a','t']},
 {from:'at',to:'mat',operation:'add',unitType:'grapheme',index:0,oldUnit:'',newUnit:'m',fromUnits:['a','t'],toUnits:['m','a','t']}
],teacherPrompt:'Say am. Change the last sound to /t/. Say at. Add /m/ at the beginning. Read mat. Build first, then reveal.',evidenceClaim:'supported-practice'});

function eligible(items,available){const taught=new Set(available||[]);return items.filter(item=>item.prerequisites.graphemes.every(g=>taught.has(g)));}
export function getPresentWordChains(availableSpellings){return eligible(PRESENT_WORD_CHAINS,availableSpellings);}
export function getPresentSoundBoxes(availableSpellings){return eligible(PRESENT_SOUND_BOX_ITEMS,availableSpellings);}
export const PRESENT_SORT_ACTIVITIES=[
 {id:'sort-animals-objects',construct:'semantic-category',headings:['animals','things people use'],items:[{word:'dog',group:0,reason:'A dog is a living animal.'},{word:'hen',group:0,reason:'A hen is a living bird.'},{word:'cup',group:1,reason:'People use a cup to drink.'},{word:'bag',group:1,reason:'People use a bag to carry things.'}],prompt:'Name the pictures. Sort by meaning, then explain the rule.'},
 {id:'sort-initial-m-s',construct:'initial-phoneme',headings:['/m/','/s/'],prerequisites:{graphemes:['m','s']},items:[{word:'map',group:0,reason:'map begins /m/.'},{word:'mat',group:0,reason:'mat begins /m/.'},{word:'sun',group:1,reason:'sun begins /s/.'},{word:'sock',group:1,reason:'sock begins /s/.'}],prompt:'Listen to the named pictures. Sort by the first spoken sound. Hide print during listening.'},
 {id:'sort-sh-ch',construct:'print-pattern',headings:['sh','ch'],prerequisites:{graphemes:['sh','ch','i','p','n']},items:[{word:'ship',group:0,reason:'ship has sh at the start.'},{word:'shin',group:0,reason:'shin has sh at the start.'},{word:'chip',group:1,reason:'chip has ch at the start.'},{word:'chin',group:1,reason:'chin has ch at the start.'}],prompt:'Read the print. Sort by the written starting spelling, then explain.'}
];
export const PRESENT_RETELL_STORY={id:'seed-water-sprout',construct:'oral-narrative',readingPurpose:'teacher-read-aloud',title:'A seed grows',events:[{id:'plant',text:'A child plants a seed in a pot.',sceneRequirements:'A girl placing one seed into soil in a pot.',imagePath:'/images/assessment/literacy-interactions/seed-1.webp',mediaGap:''},{id:'water',text:'The child waters the seed.',sceneRequirements:'Same girl and pot; water reaching soil.',imagePath:'/images/assessment/literacy-interactions/seed-2.webp',mediaGap:''},{id:'sprout',text:'Later, a sprout grows.',sceneRequirements:'Same pot with a visible sprout and the same girl.',imagePath:'/images/assessment/literacy-interactions/seed-3.webp',mediaGap:''}],meaningPrompt:'What helped the seed grow? Tell the story using first, next and later.',acceptedResponses:['The child planted the seed, watered it, and later a sprout grew.','Water helped the seed grow.'],teacherModel:'First the child planted a seed. Next the child watered it. Later a sprout grew. Water helped the seed grow.',support:'Retell two neighbouring events with gestures; adult supplies the event names.',stretch:'Explain why watering came before the sprout.',imageStatus:'existing-scenes-parent-visually-reviewed',evidenceClaim:'teacher-led-oral-practice'};

// Explicit mappings include silent letters and multi-phoneme chunks. These are
// not generated from letter count. A later regular pattern is distinguished
// from a lexical exception; either can need attention before its teaching day.
const HFW_MAPPING_ROWS = [
 ['am','a=æ|m=m'],['I','I=aɪ'],['a','a=ə'],['the','th=ð|e=ə'],['an','a=æ|n=n'],['and','a=æ|n=n|d=d'],['is','i=ɪ|s=z'],['of','o=ə|f=v'],
 ['go','g=ɡ|o=oʊ'],['no','n=n|o=oʊ'],['so','s=s|o=oʊ'],['do','d=d|o=uː'],['my','m=m|y=aɪ'],['to','t=t|o=uː'],['into','i=ɪ|n=n|t=t|o=uː'],['said','s=s|ai=ɛ|d=d'],
 ['not','n=n|o=ɑ|t=t'],['that','th=ð|a=æ|t=t'],['he','h=h|e=iː'],['me','m=m|e=iː'],['she','sh=ʃ|e=iː'],['are','are=ɑ,r'],['as','a=æ|s=z'],['you','y=j|ou=uː'],
 ['see','s=s|ee=iː'],['was','w=w|a=ʌ|s=z'],['for','f=f|or=ɔ,r'],['or','or=ɔ,r'],['her','h=h|er=ɝ'],['his','h=h|i=ɪ|s=z'],['this','th=ð|i=ɪ|s=s'],['with','w=w|i=ɪ|th=ð'],['your','y=j|our=ɔ,r'],
 ['good','g=ɡ|oo=ʊ|d=d'],['look','l=l|oo=ʊ|k=k'],['all','a=ɔ|ll=l'],['says','s=s|ay=ɛ|s=z'],['they','th=ð|ey=eɪ'],['each','ea=iː|ch=tʃ'],['like','l=l|i=aɪ|k=k|e='],['little','l=l|i=ɪ|tt=t|le=ə,l'],
 ['from','f=f|r=r|o=ʌ|m=m'],['have','h=h|a=æ|v=v|e='],['more','m=m|ore=ɔ,r'],['about','a=ə|b=b|ou=aʊ|t=t'],['out','ou=aʊ|t=t'],['put','p=p|u=ʊ|t=t'],['be','b=b|e=iː'],['get','g=ɡ|e=ɛ|t=t'],['very','v=v|e=ɛ|r=r|y=iː'],
 ['what','wh=w|a=ʌ|t=t'],['when','wh=w|e=ɛ|n=n'],['who','wh=h|o=uː'],['does','d=d|oe=ʌ|s=z'],['goes','g=ɡ|oe=oʊ|s=z'],['only','o=oʊ|n=n|l=l|y=iː'],['other','o=ʌ|th=ð|er=ɚ'],['off','o=ɔ|ff=f'],['which','wh=w|i=ɪ|ch=tʃ'],['again','a=ə|g=ɡ|ai=ɛ|n=n'],
 ['day','d=d|ay=eɪ'],['say','s=s|ay=eɪ'],['by','b=b|y=aɪ'],['why','wh=w|y=aɪ'],['try','t=t|r=r|y=aɪ'],['first','f=f|ir=ɝ|s=s|t=t'],['friend','f=f|r=r|ie=ɛ|n=n|d=d'],['half','h=h|a=æ|l=|f=f']
];
const LEXICAL_EXCEPTIONS={I:['I'],a:['a'],the:['e'],of:['o','f'],do:['o'],to:['o'],into:['o'],said:['ai'],are:['are'],you:['ou'],was:['a'],your:['our'],says:['ay'],have:['e'],from:['o'],put:['u'],what:['a'],who:['wh','o'],does:['oe'],other:['o'],again:['ai'],friend:['ie'],half:['l']};
for(const [word,mapping] of HFW_MAPPING_ROWS){
 const record=PRESENT_HFW_TEACHING[word];
 record.attentionParts=record.exceptionParts;
 record.exceptionParts=LEXICAL_EXCEPTIONS[word]||[];
 record.graphemePhonemeMap=mapping.split('|').map(part=>{
  const [grapheme,sounds]=part.split('=');
  return {grapheme,phonemeIds:sounds?sounds.split(','):[],status:record.exceptionParts.includes(grapheme)?'lexical-exception':'regular-correspondence',requiresExplicitTeaching:record.attentionParts.includes(grapheme)};
 });
 record.regularParts=record.graphemePhonemeMap.filter(part=>part.status==='regular-correspondence').map(part=>part.grapheme);
 record.mappingNote='US-English model. Lexical exceptions and later regular code are separate; attention parts still need explicit teaching at their scheduled introduction. In like, i and final e form one split spelling; final e has no separate sound. Dialect can change vowels or voiced/unvoiced with.';
}
