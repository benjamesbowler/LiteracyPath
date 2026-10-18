import { presentGameSchedule } from '../../data/presentDailyReading.js';
import {presentSentenceRounds, presentMissingRounds} from './presentationSentenceRounds.js';

// Whole-class response fields stay on the projected slide. Only the teacher
// operates the controls; completion is supported participation, never a score.
export function buildPresentClassGames({cycle,day,world,slide,esc,mediaUrl,sentenceAudio,wordAudio,shuffle,words,letters,focusWords=[]}) {
  const names=presentGameSchedule(cycle.cycleNumber,day);
  const make=(body,options)=>slide(world,body,{...options,section:'Games',responseCue:'Everyone: think, then say or point before the teacher selects on screen.'});
  const teaching={support:'Teacher reads untaught words aloud and invites everyone to respond.',evidenceClaim:'supported-participation'};
  const audioFor=card=>({src:sentenceAudio(card.sentence),type:'audio',role:'sentence',transcript:card.sentence,required:true});
  const pictured=card=>({...card,imagePath:mediaUrl(card.imagePath),audioPath:sentenceAudio(card.sentence)});
  const progress=kind=>`<p class="p-round-progress" data-${kind}-progress role="status" aria-live="polite">Round 1 of 3</p>`;
  const views={};
  if(names.includes('detective')){
    const rounds=presentSentenceRounds(cycle.cycleNumber,day,'detective').map((source,index)=>{
      const card=pictured(source);
      const matches=(cycle.cycleNumber+['monday','tuesday','wednesday','thursday','friday'].indexOf(day)+index)%2===0;
      return {...card,sentence:matches?source.sentence:source.wrongSentence,correctSentence:source.sentence,matches,audioPath:matches?card.audioPath:'',correctAudioPath:card.audioPath};
    });
    const first=rounds[0];
    views.detective=make(`<p class="p-kicker">Sentence Detective</p><p class="p-teacher-prompt">Read together. Does the sentence match the picture? Everyone shows thumbs up or down.</p><div class="p-class-game" data-detective-game data-detective-rounds="${esc(JSON.stringify(rounds))}"><img class="p-class-picture" data-detective-image src="${esc(first.imagePath)}" alt="${esc(first.sceneRequirements)}"/><div class="p-class-response">${progress('detective')}<p class="p-class-sentence" data-detective-sentence>${esc(first.sentence)}</p><div class="p-lesson-actions"><button class="p-audio" type="button" data-detective-answer="yes">Matches</button><button class="p-audio" type="button" data-detective-answer="no">Does not match</button></div><p class="p-class-feedback" data-detective-feedback role="status">Think first. Explain your choice.</p><div class="p-lesson-actions"><button class="p-audio p-audio-ghost" type="button" data-detective-hear ${first.audioPath?'':'hidden'}>Hear</button><button class="p-audio" type="button" data-detective-repair disabled>Read and compare</button><button class="p-audio p-audio-ghost" type="button" data-detective-next>Next round</button></div></div></div>`,{cls:'p-sentence-detective',teacher:'Three rounds: everyone judges the literal picture/print match before the teacher selects. Read and compare reveals the authored repair; keep a wrong selection for discussion. Read untaught words aloud. No child needs equipment.',meta:{target:'Sentence Detective',construct:'supported-sentence-picture-comparison',rounds,answer:rounds.map(r=>r.correctSentence).join(' / '),requiredAudio:rounds.map(r=>({src:r.correctAudioPath,type:'audio',role:'sentence',transcript:r.correctSentence,required:true})),teacher:teaching,codeStatus:'adult-supported'}});
  }
  if(names.includes('missing')){
    const pool=[...new Set(words)];
    const rounds=presentMissingRounds({cycle,day,words,letters,focusWords,shuffle,wordAudio});
    const items=rounds[0]?.items||[];
    if(items.length){
      const order=rounds.map(round=>round.targetIndex);
      views.missing=make(`<p class="p-kicker">What's Missing?</p><p class="p-teacher-prompt">Read them together. Close your eyes while one disappears. Everyone says what is missing.</p><div class="p-missing-game" data-missing-game data-missing-rounds="${esc(JSON.stringify(rounds))}" data-missing-items="${esc(JSON.stringify(items))}" data-missing-order="${esc(JSON.stringify(order))}">${progress('missing')}<div class="p-missing-items" data-missing-board>${items.map((item,index)=>`<span data-missing-item="${index}">${esc(item.text)}</span>`).join('')}</div><p class="p-class-feedback" data-missing-feedback role="status">Look carefully and read every ${pool.length?'word':'letter'}.</p><div class="p-lesson-actions"><button class="p-audio" type="button" data-missing-hide>Hide one</button><button class="p-audio p-audio-ghost" type="button" data-missing-reveal disabled>Reveal</button><button class="p-audio p-audio-ghost" type="button" data-missing-next>Next round</button></div></div>`,{cls:'p-whats-missing',teacher:'Three rounds with changing boards and targets. Read all available taught words before hiding one. The class thinks, then answers together; use the recalled word in a fresh phrase. Early cycles use already-introduced letter forms without adding untaught sight words.',meta:{target:items.map(i=>i.text).join(', '),construct:pool.length?'sight-word-retrieval':'letter-retrieval',items,rounds,requiredAudio:rounds.flatMap(round=>round.items).filter(i=>i.audio).map(i=>({src:i.audio,type:'audio',role:'review',transcript:i.text,required:true})),teacher:teaching,codeStatus:'taught-words-or-letters'}});
    }
  }
  if(names.includes('scramble')){
    const rounds=presentSentenceRounds(cycle.cycleNumber,day,'scramble').map(pictured);
    const card=rounds[0];
    views.scramble=make(`<p class="p-kicker">Sentence Mix-Up</p><p class="p-teacher-prompt">Read the sentence with its picture. After 15 seconds, help your teacher put the words back in order.</p><div class="p-class-game" data-scramble-game data-scramble-card="${esc(JSON.stringify(card))}" data-scramble-rounds="${esc(JSON.stringify(rounds))}"><img class="p-class-picture" data-scramble-image src="${esc(card.imagePath)}" alt="${esc(card.sceneRequirements)}"/><div class="p-class-response">${progress('scramble')}<p class="p-class-sentence" data-scramble-model>${esc(card.sentence)}</p><div class="p-scramble-draft" data-scramble-draft aria-label="Our sentence" hidden></div><div class="p-scramble-bank" data-scramble-bank role="group" aria-label="Mixed-up words" hidden></div><div class="p-lesson-actions"><span class="p-scramble-count" data-scramble-count role="timer" aria-label="Reading seconds remaining" aria-live="off">15</span><button class="p-audio" type="button" data-scramble-start>Start 15 seconds</button><button class="p-audio p-audio-ghost" type="button" data-scramble-hear>Hear sentence</button></div><p class="p-class-feedback" data-scramble-feedback role="status">Read together before starting the countdown.</p><div class="p-lesson-actions"><button class="p-audio" type="button" data-scramble-check disabled hidden>Check order</button><button class="p-audio p-audio-ghost" type="button" data-scramble-reset>Read it again</button><button class="p-audio p-audio-ghost" type="button" data-scramble-next disabled>Next sentence</button></div></div></div>`,{cls:'p-sentence-scramble',teacher:'Three different sentences. Teacher starts the 15-second reading countdown after establishing the picture meaning. Pause or resume for class thinking time. The sentence then mixes automatically; the picture remains. Everyone proposes the next word; teacher selects. Select an assembled word to return it and repair. Keep an incorrect draft for discussion. Read it again restores this round. After a correct order, Next sentence changes the picture and words and waits for a fresh 15-second start. Play again resets the three-round set. No materials or child devices.',meta:{...card,target:card.sentence,construct:'supported-sentence-ordering',rounds,countdownSeconds:15,answer:rounds.map(r=>r.sentence).join(' / '),requiredAudio:rounds.map(audioFor),teacher:teaching,codeStatus:'adult-supported'}});
  }
  return names.filter(name=>views[name]).map(name=>views[name]);
}

export const PRESENT_CLASS_GAMES_CSS=`
.p-class-game {display:grid;grid-template-columns:420px minmax(0,1fr);gap:44px;align-items:center;width:100%;}
.p-class-picture {width:420px;height:390px;object-fit:contain;background:var(--surface);border-radius:28px;padding:18px;}
.p-round-progress {font:700 26px/1.3 'Andika',sans-serif;margin:0;color:var(--ink);}
.p-class-response {display:flex;flex-direction:column;align-items:center;gap:20px;min-width:0;}
.p-class-sentence {font:700 64px/1.35 'Andika', sans-serif;margin:0;text-align:center;max-width:100%;}
.p-class-feedback {font:400 29px/1.35 'Source Sans 3',sans-serif;margin:0;text-align:center;min-height:42px;}
.p-class-response .p-lesson-actions {flex-wrap:wrap;gap:14px;justify-content:center;}
.p-class-response .p-audio,.p-missing-game .p-audio {font-size:30px;padding:16px 22px;}
.p-scramble-bank,.p-scramble-draft {display:flex;flex-wrap:wrap;justify-content:center;gap:12px;width:100%;min-height:82px;}
.p-scramble-draft {border-bottom:3px solid var(--n-300);padding:12px 0;}
.p-scramble-bank button,.p-scramble-draft button {font:700 48px/1.25 'Andika',sans-serif;border:2px solid var(--n-300);background:var(--surface);color:var(--ink);border-radius:16px;padding:10px 16px;}
.p-scramble-count {font:700 48px/1.2 'Andika',sans-serif;min-width:70px;text-align:center;color:var(--ink);}
.p-missing-game {display:flex;flex-direction:column;align-items:center;gap:28px;width:100%;}
.p-missing-items {display:flex;flex-wrap:wrap;justify-content:center;gap:40px;width:100%;}
.p-missing-items span {font:700 100px/1.3 'Andika',sans-serif;min-width:180px;text-align:center;background:var(--surface);border-radius:24px;padding:24px;}
.p-sentence-scramble,.p-sentence-detective,.p-whats-missing {gap:22px;}
`;
