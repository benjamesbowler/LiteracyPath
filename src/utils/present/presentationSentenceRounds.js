import {PRESENT_DAILY_READING} from '../../data/presentDailyReading.js';
import {PRESENT_SENTENCE_CONTRASTS} from '../../data/presentSentenceContrasts.js';

const DAYS={detective:['monday','thursday','friday'],scramble:['tuesday','friday']};
const rotate=(items,offset)=>items.length?[...items.slice(offset%items.length),...items.slice(0,offset%items.length)]:[];
const unique=cards=>[...new Map(cards.map(card=>[card.sentence,card])).values()];

// Build the actual sequence first. A review points to a real earlier practice
// round, not a future card or a review of a review. Extra supported descriptions
// may reuse an already-familiar picture; they introduce no new phonics claim.
export function presentSentenceRounds(cycleNumber,day,kind){
 const number=Number(cycleNumber),days=DAYS[kind];
 if(!PRESENT_DAILY_READING[number]||!days)throw new RangeError('Unknown Present sentence activity');
 if(!days.includes(day))return [];
 const history=new Map(),bank=Object.values(PRESENT_DAILY_READING).flat();
 for(let week=1;week<=number;week++){
  const weekly=PRESENT_DAILY_READING[week],pictures=new Set(weekly.map(card=>card.word));
  const candidates=unique([...weekly,...bank.filter(card=>pictures.has(card.word))]);
  const practice=kind==='detective'?candidates.flatMap(card=>{
   const wrongSentence=PRESENT_SENTENCE_CONTRASTS.get(card.sentence)||(card.sentence===card.detectiveSource.correctSentence?card.detectiveSource.wrongSentence:null);
   return wrongSentence?[{...card,wrongSentence,detectiveSource:{correctSentence:card.sentence,wrongSentence,contrastKind:card.sentence===card.detectiveSource.correctSentence?card.detectiveSource.contrastKind:'visible-picture-detail'}}]:[];
  }):candidates;
  const used=new Set(),rounds=[];
  const take=(pool,reviewCycle=null)=>{
   const card=pool.find(card=>!used.has(card.sentence));
   if(!card)return false;
   used.add(card.sentence);
   rounds.push({...card,practiceCycle:reviewCycle||week,reviewCycle,roundRole:reviewCycle?'earlier-review':week===1?'starter-practice':'weekly-practice'});
   return true;
  };
  for(let session=0;session<days.length;session++){
   // Prefer the day's useful model, then another picture before a second fact
   // about the same object. All nine/six weekly sentences remain distinct.
   const preferred=weekly.slice(['monday','tuesday','wednesday','thursday','friday'].indexOf(days[session])*2);
   for(let slot=0;slot<2;slot++){
    const last=rounds.at(-1);
    const pool=unique([...preferred.filter(c=>practice.some(p=>p.sentence===c.sentence)),...practice]);
    const ordered=[...pool.filter(c=>c.word!==last?.word),...pool].map(c=>practice.find(p=>p.sentence===c.sentence));
    if(!take(ordered))throw new Error(`Insufficient ${kind} practice in cycle ${week}`);
   }
   let reviewed=false;
   if(week>1){
    const preferredWeek=session===0||week===2?week-1:Math.max(1,week-(2+week%4));
    const sources=[...history.keys()].sort((a,b)=>Math.abs(a-preferredWeek)-Math.abs(b-preferredWeek));
    for(const source of sources){
     const past=rotate(history.get(source).filter(c=>!c.reviewCycle),week+session);
     if(take([...past.filter(c=>c.word!==rounds.at(-1)?.word),...past],source)){reviewed=true;break;}
    }
   }
   if(!reviewed&&!take(practice))throw new Error(`Insufficient ${kind} review in cycle ${week}`);
  }
  history.set(week,rounds);
 }
 return history.get(number).slice(days.indexOf(day)*3,days.indexOf(day)*3+3).map((card,index)=>({...card,activityRound:index+1,activityRoundCount:3}));
}

// The caller supplies only HFWs introduced by this exact teaching day. The
// first tiny banks deliberately repeat; no future word fills an empty slot.
export function presentMissingRounds({cycle,day,words,letters,focusWords,shuffle,wordAudio}){
 const pool=[...new Set(words)],current=pool.filter(word=>(cycle.highFrequencyWords||focusWords).includes(word));
 const review=pool.filter(word=>!current.includes(word));
 const recent=review.slice(-4),older=review.slice(0,-4);
 const choose=(preferred,count)=>uniqueText([...preferred,...pool]).slice(0,count);
 const wednesday=choose([current[0],recent.at(-1),older.at(-1)||recent.at(-2)].filter(Boolean),3);
 const friday=choose([current.at(-1),older[0]||recent[0],...shuffle(review,`${cycle.id}:missing-review`),...current].filter(word=>word&&!wednesday.includes(word)),3);
 const ordered=day==='friday'?friday:wednesday;
 const fallback=letters.map(card=>({text:card.text||`${card.spelling.toUpperCase()}${card.spelling}`,audio:card.audio||''}));
 return Array.from({length:3},(_,index)=>{
  const target=pool.length?ordered[index%ordered.length]:fallback[index%fallback.length]?.text;
  const previous=review.includes(target);
  const others=rotate(shuffle(pool.filter(word=>word!==target),`${cycle.id}:${day}:missing-board`),index*3);
  const items=pool.length?shuffle([target,...uniqueText([...current.filter(word=>word!==target),...others]).slice(0,3)],`${cycle.id}:${day}:missing-positions:${index}`).map(text=>({text,audio:wordAudio(text)})):rotate(fallback,index).slice(0,4);
  return {items,targetIndex:items.findIndex(item=>item.text===target),target,roundRole:previous?'earlier-review':'weekly-practice',activityRound:index+1,activityRoundCount:3};
 }).filter(round=>round.items.length);
}
function uniqueText(items){return [...new Set(items)];}
