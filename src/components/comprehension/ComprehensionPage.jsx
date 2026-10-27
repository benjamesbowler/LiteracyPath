import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPREHENSION_PASSAGES, COMPREHENSION_FAMILIES, passageById } from '../../content/comprehension/passages.js';
import { getPassagePhonicsWords } from '../../content/comprehension/phonics.js';
import { resolveComprehensionPassageAudio, resolveComprehensionQuestionAudio } from '../../content/comprehension/audio.js';
import { createComprehensionPlayer } from '../../content/comprehension/playback.js';
import { STOP_CHILD_AUDIO_EVENT, stopAllChildAudio } from '../../utils/audio/childAudioLifecycle.js';
import { readPractice, reducePractice, savePractice, practiceQuestion } from '../../content/comprehension/practice.js';
import { buildComprehensionDocument, openComprehensionPrint, teachingPrompts } from '../../content/comprehension/print.js';
import { TeacherPageShell, TeacherPageHeader } from '../teacher/ui/TeacherPrimitives.jsx';
import { WorksheetPreview } from '../WorksheetPreview.jsx';
import './comprehension.css';

function useComprehensionAudio(ownerKey){
 const [audioNote,setAudioNote]=useState('');
 const [player]=useState(()=>createComprehensionPlayer({onNote:setAudioNote,stopOtherAudio:()=>stopAllChildAudio('comprehension-play')}));
 useEffect(()=>{
  const active=player;
  const stop=()=>active.stop('Audio stopped.');
  const hidden=()=>{if(document.hidden)stop();};
  window.addEventListener(STOP_CHILD_AUDIO_EVENT,stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',hidden);
  return()=>{active.cancel();window.removeEventListener(STOP_CHILD_AUDIO_EVENT,stop);window.removeEventListener('pagehide',stop);document.removeEventListener('visibilitychange',hidden);};
 },[ownerKey,player]);
 return {audioNote,playAudio:player.play,stopAudio:player.stop};
}

function storage() { try { return window.sessionStorage; } catch { return null; } }
const titleCase = text => text[0].toUpperCase()+text.slice(1);
const selectionKey = scope => `lp-comprehension-selection:${encodeURIComponent(scope)}`;
function rememberedSelection(scope) { try { const id=storage()?.getItem(selectionKey(scope));return passageById(id)?id:''; } catch{return '';} }

export default function ComprehensionPage({ teacher=false, scope='', onBack }) {
 // The router keys this workspace by account/learner, so state cannot migrate
 // between learners even when the same device keeps the route mounted.
 const [selectedId,setSelectedId]=useState(()=>rememberedSelection(scope));
 const [family,setFamily]=useState('all');
 const [focus,setFocus]=useState('all');
 const [length,setLength]=useState('all');
 const [search,setSearch]=useState('');
 const [filtersOpen,setFiltersOpen]=useState(false);
 const [batch,setBatch]=useState([]);
 const [note,setNote]=useState('');
 const [busy,setBusy]=useState(false);
 const p=passageById(selectedId);
 const catalogueHeading=useRef(null);
 const visible=useMemo(()=>COMPREHENSION_PASSAGES.filter(p=>(family==='all'||p.family===family)&&(focus==='all'||p.focus===focus)&&(length==='all'||(length==='short'?p.wordCount<=45:p.wordCount>45))&&`${p.title} ${p.focus} ${p.character}`.toLowerCase().includes(search.trim().toLowerCase())),[family,focus,length,search]);
 function choose(id){setSelectedId(id);setNote('');try{storage()?.setItem(selectionKey(scope),id);}catch{/* in-memory access remains available */}}
 function backToList(){choose('');requestAnimationFrame(()=>catalogueHeading.current?.focus());}
 async function print(ids,variant){
  setNote('Preparing the print pages…');setBusy(true);
  try {await openComprehensionPrint({passageIds:ids,variant});setNote('Print pages opened. Choose your printer or Save as PDF.');}
  catch(error){setNote(error.message||'The print pages could not open. Check your connection, then try again.');}
  finally{setBusy(false);}
 }
 const Shell=teacher?TeacherPageShell:'section';
 return <Shell {...(teacher?{product:'comprehension',intent:'resources'}:{'data-child-surface':'reading-comprehension','data-learning-lane':'language_and_meaning'})} className={`rc-page${!teacher&&!p?" rc-child-catalogue":""}`}>
  <nav aria-label="Reading comprehension navigation"><button className="rc-back" onClick={p?backToList:onBack}>← {p?'All passages':teacher?'Back to Teach':'Back to Books'}</button></nav>
  {teacher?<TeacherPageHeader eyebrow="Teaching resources" title="Reading Comprehension" description="One passage for reading together, group work and practice."/>:<header className="rc-heading">{!p?<h1 ref={catalogueHeading} tabIndex={-1} data-child-title="">Reading Comprehension</h1>:<p>Reading Comprehension</p>}<p data-child-instruction="">{p?'Read the story. Choose an answer and check it.':'Pick a story. Read it and find the answers.'}</p></header>}
  {teacher&&<h1 className="rc-sr-only" ref={catalogueHeading} tabIndex={-1}>Reading Comprehension passages</h1>}
  {p?<PassageWorkspace key={`${scope}:${p.id}`} passage={p} teacher={teacher} scope={scope||'temporary'} print={print} busy={busy}/>:<>
   {!teacher&&<button className="rc-find-toggle" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(!filtersOpen)}>{filtersOpen?"Hide search":"Find a story"}</button>}
   {(teacher||filtersOpen)&&<section className="rc-filters" aria-label="Find a passage">
    <label>Find a story<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Title or character"/></label>
    <label>Phonics<select value={family} onChange={e=>{setFamily(e.target.value);setFocus('all');}}><option value="all">All patterns</option>{COMPREHENSION_FAMILIES.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
    <label>Focus<select value={focus} onChange={e=>setFocus(e.target.value)}><option value="all">All focuses</option>{[...new Set(COMPREHENSION_PASSAGES.filter(p=>family==='all'||p.family===family).map(p=>p.focus))].map(f=><option key={f}>{f}</option>)}</select></label>
    <label>Length<select value={length} onChange={e=>setLength(e.target.value)}><option value="all">All lengths</option><option value="short">Shorter · up to 45 words</option><option value="more">More reading · 46+ words</option></select></label>
   </section>}
   {teacher&&<p className="rc-note">Choose a pattern your readers have learned. Preview each passage’s support words before independent reading.</p>}
   <p className="rc-count" role="status" data-child-progress="">{visible.length} {visible.length===1?'passage':'passages'}</p>
   {!visible.length&&<div className="rc-panel"><p>No passages match these choices.</p><button className="rc-primary" data-child-primary="" onClick={()=>{setFamily('all');setFocus('all');setLength('all');setSearch('');}}>Show all passages</button></div>}
   {teacher&&<section className="rc-panel rc-batch" aria-label="Print selected passages"><h2>Print pack · {batch.length} selected</h2><p>Selections stay in your pack when you change filters.</p><div className="rc-actions"><button disabled={!visible.length||visible.every(p=>batch.includes(p.id))} onClick={()=>setBatch(ids=>[...new Set([...ids,...visible.map(p=>p.id)])])}>Select shown</button><button disabled={!batch.length||busy} onClick={()=>print(batch,'choice')}>Print multiple-choice sheets</button><button disabled={!batch.length||busy} onClick={()=>print(batch,'worksheet')}>Print written-answer sheets</button><button disabled={!batch.length||busy} onClick={()=>print(batch,'pair')}>Print with drawing pages</button><button disabled={!batch.length||busy} onClick={()=>print(batch,'teacher')}>Print teacher guides</button><button disabled={!batch.length} onClick={()=>setBatch([])}>Clear selection</button></div></section>}
   <div className="rc-catalogue" role="group" aria-label="Choose a passage" data-child-choices="">{visible.map((p,index)=><article className="rc-card" key={p.id}>
    <button className="rc-card-open" data-child-primary={!teacher&&index===0?"":undefined} data-child-emphasis={!teacher&&index===0?"primary":undefined} onClick={()=>choose(p.id)} aria-label={`Read ${p.title}`}><img src={`/images/worksheets/${p.character}-colouring.webp`} alt=""/><span className="rc-card-copy"><span className="rc-focus">{p.focus}</span><strong data-child-emphasis-cue={!teacher&&index===0?"":undefined}>{p.title}</strong><span>{p.wordCount} words · {titleCase(p.character)}</span></span></button>
    {teacher&&<label className="rc-batch-choice"><input type="checkbox" checked={batch.includes(p.id)} onChange={e=>setBatch(ids=>e.target.checked?[...ids,p.id]:ids.filter(id=>id!==p.id))}/> Add to print pack</label>}
   </article>)}</div>

  </>}
  <p className="rc-status" role="status" aria-live="polite">{note}</p>
 </Shell>;
}

function PassageWorkspace({passage:p,teacher,scope,print,busy}){
 const [mode,setMode]=useState(teacher?'whole':'student');
 const [highlight,setHighlight]=useState(false);
 const [notes,setNotes]=useState(false);
 const [questionIndex,setQuestionIndex]=useState(0);
 const [reveal,setReveal]=useState(false);
 const [selection,setSelection]=useState('');
 const [checked,setChecked]=useState(false);
 const [showComplete,setShowComplete]=useState(false);
 const [printVariant,setPrintVariant]=useState('choice');
 const [preview,setPreview]=useState(false);
 const practiceScope=teacher?`${scope}:teacher-preview`:scope;
 const [practice,setPractice]=useState(()=>readPractice(storage(),practiceScope,p));
 const [saved,setSaved]=useState(true);
 const [supportOpen,setSupportOpen]=useState(false);
 const heading=useRef(null);const questionHeading=useRef(null);const completeHeading=useRef(null);
 const q=practiceQuestion(p,practice,questionIndex);
 const response=practice.responses[q.id];
 const prompts=teachingPrompts(p);
 const {audioNote,playAudio,stopAudio}=useComprehensionAudio(`${p.id}:${mode}:${questionIndex}`);
 useEffect(()=>{heading.current?.focus();},[]);
 useEffect(()=>{if(showComplete)completeHeading.current?.focus();},[showComplete]);
 function update(action){const next=reducePractice(p,practice,action);setPractice(next);setSaved(savePractice(storage(),practiceScope,p,next));}
 function nextQuestion(index){stopAudio();setQuestionIndex(index);setSelection('');setChecked(false);setReveal(false);requestAnimationFrame(()=>questionHeading.current?.focus());}
 function changeMode(value){stopAudio();setMode(value);setNotes(false);setReveal(false);setQuestionIndex(0);setSelection('');setChecked(false);setShowComplete(false);}
 const exactWords=new Set(getPassagePhonicsWords(p));
 const sentenceText=(sentence,index)=><span key={index} className={reveal&&teacher&&mode!=='student'&&q.evidence.includes(sentence)?'rc-evidence':''}>{sentence.split(/(\b[a-zA-Z]+\b)/).map((word,i)=>highlight&&exactWords.has(word.toLowerCase())?<mark key={i} data-phonics-word={word.toLowerCase()}>{word}</mark>:word)}{' '}</span>;
 const childVariant=printVariant==='pair'?'choice':printVariant;
 const previewDoc=preview?buildComprehensionDocument({passageIds:[p.id],variant:childVariant}):null;
 return <div className={`rc-workspace rc-mode-${mode}`}>
  <header className="rc-story-heading"><div><p className="rc-focus">{p.focus} · {p.wordCount} words</p><h1 ref={heading} tabIndex={-1} data-child-title={teacher?undefined:""}>{p.title}</h1></div><img src={`/images/worksheets/${p.character}-colouring.webp`} alt={`${titleCase(p.character)}, the character in this story`}/></header>
  {teacher&&<div className="rc-modes" role="group" aria-label="Teaching mode">{[['whole','Whole group'],['small','Small group'],['student','Student practice']].map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>changeMode(id)}>{label}</button>)}</div>}
  {teacher&&<p className="rc-note">{mode==='student'?'Teacher preview. Responses stay on this device and do not become student results.':mode==='small'?'Read with your group, discuss the story, then find the evidence together.':'Read on the class screen. Reveal each answer when you are ready.'}</p>}
  <section className="rc-support rc-panel"><button aria-expanded={supportOpen} onClick={()=>setSupportOpen(!supportOpen)}>Words to read together</button>{supportOpen&&<div><p><strong>Pattern words:</strong> {[...exactWords].join(', ')}</p><p><strong>Support words:</strong> {p.supportWords.join(', ')||'No additional words.'}</p>{teacher&&<p><strong>Before reading:</strong> {p.prerequisites.join('; ')}.</p>}<div className="rc-word-help"><strong>Word help</strong>{p.wordHelp.map(([word,meaning])=><p key={word}><strong>{word}:</strong> {meaning}</p>)}</div><p>Read new words together first. You can listen to the story for help.</p></div>}</section>
  {teacher&&mode==='small'&&<section className="rc-private rc-panel"><button aria-expanded={notes} onClick={()=>setNotes(!notes)}>Teacher notes · show privately</button>{notes&&<div><h2>Before</h2><p>{prompts.before}</p><h2>During</h2><p>{prompts.during}</p><h2>After</h2><p>{prompts.after}</p><details><summary>Answer guidance</summary>{p.questions.map(q=><p key={q.id}><strong>{q.prompt}</strong> {q.answer}. Listen for: {q.evidence.join(' ')}</p>)}</details><p>Hide these notes before showing the screen to the group.</p></div>}</section>}
  <div className="rc-reading-layout">
   <section className="rc-reading rc-panel" aria-label="Story passage"><div className="rc-actions"><button aria-pressed={highlight} onClick={()=>setHighlight(!highlight)}>{highlight?'Hide word marks':'Mark phonics words'}</button><button onClick={()=>playAudio(resolveComprehensionPassageAudio(p))}>Hear with Leda</button><button onClick={()=>stopAudio('Audio stopped.')}>Stop voice</button></div><p className="rc-mark-note">Word marks: {p.focus}</p><p className="rc-passage">{p.sentences.map(sentenceText)}</p>
    <fieldset className="rc-reread"><legend>Read again</legend>{practice.reads.map((read,i)=><label key={i}><input type="checkbox" checked={read} onChange={()=>update({type:'read',index:i})}/> Read {i+1}</label>)}</fieldset>
    <p className="rc-speech-note" role="status">{audioNote}</p>
   </section>
   <section className="rc-question rc-panel" aria-label="Comprehension questions">
    {showComplete?<div className="rc-complete" data-child-choices=""><h2 data-child-progress="" ref={completeHeading} tabIndex={-1}>You finished this practice!</h2><p>Tell the story in your own words.</p><p>{p.draw}</p><button data-child-primary="" className="rc-primary" onClick={()=>print([p.id],'extension')} disabled={busy}>Print a drawing page</button><button onClick={()=>{update({type:'reset'});setShowComplete(false);nextQuestion(0);}}>Start again</button></div>:<>
     <p className="rc-focus" data-child-progress="">Question {questionIndex+1} of {p.questions.length}</p><h2 ref={questionHeading} tabIndex={-1}>{q.prompt}</h2>
     <button className="rc-audio-question" onClick={()=>playAudio(resolveComprehensionQuestionAudio(q))}>Hear question and choices</button>
     {mode!=='student'&&<p>Choose together. Then reveal the answer.</p>}
     <div className="rc-options" data-child-choices={mode==='student'?"":undefined} role="group" aria-label="Answer choices">{q.options.map((option,index)=><button key={option} aria-label={option} aria-pressed={(selection||(mode==='student'?response?.last:''))===option} disabled={mode==='student'&&Boolean(response?.correct)} data-correct={mode!=='student'&&reveal&&option===q.answer?true:undefined} onClick={()=>{setSelection(option);setChecked(false);}}><span className="rc-option-letter" aria-hidden="true">{'ABCD'[index]}</span><span>{option}</span></button>)}</div>
     {mode==='student'?<>
      {(!response?.correct)&&<button className="rc-primary" data-child-primary="" disabled={!selection||checked} onClick={()=>{stopAudio();update({type:'answer',questionId:q.id,value:selection});setChecked(true);}}>Check answer</button>}
      {(checked||response?.correct||(!selection&&response))&&<div className="rc-feedback" role="status"><strong>{response?.correct?'That fits the story.':'Look back at this part. Try another answer.'}</strong><p>{q.evidence.join(' ')}</p></div>}
     </>:<><p>Point to the part of the story that helps.</p><button className="rc-primary" aria-expanded={reveal} onClick={()=>{stopAudio();setReveal(!reveal);}}>{reveal?'Hide answer and evidence':'Reveal answer and evidence'}</button>{reveal&&<div className="rc-feedback"><p><strong>Answer: {q.answer}</strong></p><p>{q.evidence.join(' ')}</p><p>Accept answers in the reader’s own words when they match the story.</p></div>}</>}
     <div className="rc-question-nav"><button disabled={questionIndex===0} onClick={()=>nextQuestion(questionIndex-1)}>Previous question</button>{questionIndex<2?<button data-child-primary={mode==='student'&&response?.correct?"":undefined} className={mode==='student'&&response?.correct?"rc-primary":undefined} disabled={mode==='student'&&!response?.correct} onClick={()=>nextQuestion(questionIndex+1)}>Next question</button>:mode==='student'&&<button data-child-primary={response?.correct?"":undefined} className={response?.correct?"rc-primary":undefined} disabled={!practice.completed} onClick={()=>{stopAudio();setShowComplete(true);}}>Finish practice</button>}</div>
     {mode==='student'&&<button className="rc-reset" onClick={()=>{update({type:'reset'});nextQuestion(0);}}>Start again</button>}
    </>}
   </section>
  </div>
  {!saved&&<p role="status">Progress is available while this page stays open. This browser could not keep it for reload.</p>}
  <section className="rc-print rc-panel" aria-label="Printable worksheets"><h2>Read, write and colour</h2><p>Black-and-white pages with character outlines, handwriting lines and space to draw.</p><div className="rc-actions"><label>Page<select value={printVariant} onChange={e=>setPrintVariant(e.target.value)}><option value="choice">Read and choose · multiple choice</option><option value="worksheet">Read and write answers</option><option value="extension">Draw, retell and find words</option><option value="pair">Multiple choice and drawing pages</option>{teacher&&<option value="teacher">Teacher guide and answers</option>}</select></label><button disabled={busy} onClick={()=>print([p.id],printVariant)}>Print / Save as PDF</button><button aria-expanded={preview} onClick={()=>setPreview(!preview)}>{preview?'Hide preview':'Preview page'}</button></div>{previewDoc&&<div className="rc-preview">{printVariant==='pair'&&<p>Showing the reading sheet. Choose the drawing page above to preview it.</p>}<WorksheetPreview html={previewDoc.html} title={previewDoc.title}/></div>}</section>
 </div>;
}
