import {cycleShortFor,cycleShortLearningWords} from '../../content/cycle-shorts/passages.js';
import {resolveComprehensionPassageAudio} from '../../content/comprehension/audio.js';

export function buildPresentCycleShorts({cycle,world,day,slide,esc,audioButton,shuffle}) {
 const p=cycleShortFor(cycle.cycleNumber);
 if(!p)return [];
 const targets=new Set(cycleShortLearningWords(p,day));
 const marked=p.text.split(/(\b[a-zA-Z]+\b)/).map(word=>targets.has(word.toLowerCase())?`<strong>${esc(word)}</strong>`:esc(word)).join('');
 const audio=resolveComprehensionPassageAudio(p).path;
 const readTogether='Read unfamiliar words together. Bold words revisit familiar sight words and this week’s sounds.';
 const common={passageId:p.id,sourcePassageId:p.sourcePassageId,cycleNumber:p.cycleNumber,world:'Sunny Meadow Farm',codeStatus:'adult-supported',construct:'supported-reading-comprehension',requiredAudio:audio?[{src:audio,type:'audio',role:'cycle-short',transcript:`${p.title}\n\n${p.text}`,required:true}]:[]};
 const story=slide(world,`<p class="p-kicker">Cycle Shorts · Sunny Meadow Farm</p><h2 class="p-short-title">${esc(p.title)}</h2><p class="p-short-story">${marked}</p>${audioButton(audio,'Hear story')}<p class="p-short-note">${esc(readTogether)}</p>`,{cls:'p-cycle-short',section:'Reading',teacher:`Read the complete story, then ask what happened first, next and last. ${readTogether} This is supported, unscored participation.`,meta:{...common,target:p.title,storyText:p.text,learningWords:[...targets],responseTurns:2}});
 return [story,...p.questions.map((q,i)=>{
  const options=shuffle(q.options,`${p.id}:${i}`);
  return slide(world,`<p class="p-kicker">Cycle Shorts · Question ${i+1} of 3</p><div class="p-short-question-layout"><div><h2 class="p-short-title">${esc(p.title)}</h2><p class="p-short-reread">${marked}</p></div><div><h3 class="p-short-prompt">${esc(q.prompt)}</h3><ol class="p-short-options" type="A">${options.map(value=>`<li>${esc(value)}</li>`).join('')}</ol>${audioButton(audio,'Hear story again')}${'<button class="p-reveal-btn" type="button" data-reveal-toggle><span>Show the answer</span></button>'}<div class="p-answer p-short-evidence is-revealed"><strong>${esc(q.answer)}</strong><p>${esc(q.evidence.join(' '))}</p></div></div></div>`,{cls:'p-cycle-short-question',section:'Reading',reveal:true,teacher:'Read the question and all four choices aloud. Everyone thinks and answers orally. Reveal the answer and find its evidence together; accept equivalent text-supported answers. No score is recorded.',meta:{...common,questionId:q.id,target:q.prompt,answer:q.answer,options,evidence:q.evidence,responseTurns:2}});
 })];
}

export const PRESENT_CYCLE_SHORTS_CSS=`
.p-cycle-short,.p-cycle-short-question {gap:20px;}
.p-short-title {font:700 54px/1.2 Andika,sans-serif;margin:0;}
.p-short-story {font:400 64px/1.45 Andika,sans-serif;max-width:1580px;margin:12px 0;}
.p-short-story strong,.p-short-reread strong {font-weight:700;}
.p-short-note {font-size:26px;color:#5C677A;margin:0;}
.p-short-question-layout {display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;width:100%;}
.p-short-reread {font:400 44px/1.45 Andika,sans-serif;margin:18px 0;}
.p-short-prompt {font:700 48px/1.25 Andika,sans-serif;margin:0 0 16px;}
.p-short-options {font:400 38px/1.3 Andika,sans-serif;margin:12px 0 18px;padding-left:56px;}
.p-short-options li {padding:5px 0;}
.p-short-evidence {font:400 30px/1.3 Andika,sans-serif;margin-top:14px;padding:12px 16px;border-radius:12px;}
.p-short-evidence p {margin:10px 0;color:inherit;}
`;
