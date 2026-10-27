import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {TeacherDialog} from '../teacher/ui/TeacherDialog.jsx';
import {addBrowserFullscreenListener,exitBrowserFullscreen,getBrowserFullscreenElement} from '../../utils/browserFullscreen.js';
import {passagePicture} from '../../content/comprehension/pictures.js';
import {getPassagePhonicsWords} from '../../content/comprehension/phonics.js';
import {paginateLessonText} from './lessonPaging.js';

function PagedText({text,renderText,kind='story',unpaged=false}){
 const box=useRef(null),measure=useRef(null);
 const [layout,setLayout]=useState({pages:[text],index:0});
 useLayoutEffect(()=>{
  const region=box.current,probe=measure.current;
  if(!region||!probe||unpaged)return;
  function size(){
   probe.style.width=`${region.clientWidth}px`;
   const pages=paginateLessonText(text,value=>{probe.textContent=value;return probe.getBoundingClientRect().height<=region.clientHeight+.5;});
   setLayout(old=>({pages,index:Math.min(old.index,pages.length-1)}));
  }
  const observer=new ResizeObserver(size);observer.observe(region);size();document.fonts.ready.then(size);
  return()=>observer.disconnect();
 },[text,unpaged]);
 const pages=unpaged?[text]:layout.pages;
 const index=unpaged?0:Math.min(layout.index,pages.length-1),value=pages[index];
 return <div className={`rc-paged rc-paged-${kind}`}>
  <div ref={box} className="rc-text-box"><p className="rc-lesson-text" data-lesson-text={kind} data-page-index={index}>{renderText?renderText(value):value}</p><p className="rc-lesson-text rc-text-measure" ref={measure} aria-hidden="true"/></div>
  <div className="rc-text-pager" role="group" aria-label={`${kind} pages`}><button aria-label={`Previous ${kind} page`} disabled={!index} onClick={()=>setLayout(old=>({...old,index:old.index-1}))}>←</button><span role="status">{kind==='story'?'Reading':'Page'} {index+1} of {pages.length}</span><button aria-label={`Next ${kind} page`} disabled={index===pages.length-1} onClick={()=>setLayout(old=>({...old,index:old.index+1}))}>→</button></div>
 </div>;
}

export function StoryPicture({passage,shown,onToggle}){
 const picture=passagePicture(passage),[failed,setFailed]=useState(false);
 return <section className="rc-lesson-picture" aria-label="Story pictures"><button aria-pressed={shown} onClick={onToggle}>{shown?'Hide pictures':'Show pictures'}</button>{shown?(picture&&!failed?<img src={picture.src} alt={picture.alt} onError={()=>setFailed(true)}/>:<div className="rc-picture-error" role="status"><p>This story picture could not load. You can read or listen with Leda.</p><button onClick={()=>{setFailed(false);}}>Try picture again</button></div>):<p>Pictures are hidden. Read or listen to the story, then show the pictures when you are ready.</p>}</section>;
}

export default function ComprehensionLesson({passage:p,mode,teacher,q,questionIndex,selection,response,checked,reveal,showComplete,practice,highlight,audioNote,saved,pictures,onPictureToggle,onExit,onStoryAudio,onQuestionAudio,onStop,onHighlight,onRead,onSelect,onCheck,onReveal,onNext,onFinish,onReset,renderText}){
 const [view,setView]=useState('read'),[support,setSupport]=useState(false),[clue,setClue]=useState(false);
 const [compact,setCompact]=useState(()=>window.matchMedia('(max-width:959px), (max-height:649px)').matches);
 const stage=useRef(null),wasNative=useRef(false),closeRef=useRef(onExit);
 useLayoutEffect(()=>{closeRef.current=onExit;});
 useEffect(()=>{
  const oldOverflow=document.body.style.overflow;
  const element=stage.current;
  const media=window.matchMedia('(max-width:959px), (max-height:649px)');
  const updateCompact=()=>setCompact(media.matches);media.addEventListener('change',updateCompact);
  const siblings=[...document.body.children].filter(el=>el!==stage.current);
  const inert=siblings.map(el=>[el,el.inert,el.style.display]);siblings.forEach(el=>{el.inert=true;el.style.display='none';});document.body.style.overflow='hidden';
  const viewport=window.visualViewport;
  function size(){if(stage.current){stage.current.style.height=`${viewport?.height||window.innerHeight}px`;stage.current.style.width=`${viewport?.width||window.innerWidth}px`;stage.current.style.top=`${viewport?.offsetTop||0}px`;stage.current.style.left=`${viewport?.offsetLeft||0}px`;}}
  function nativeChange(){const native=getBrowserFullscreenElement(document);if(native===stage.current)wasNative.current=true;else if(wasNative.current)closeRef.current();}
  size();nativeChange();viewport?.addEventListener('resize',size);viewport?.addEventListener('scroll',size);window.addEventListener('resize',size);
  function escape(event){
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeRef.current();return;}
   if(event.key!=='Tab')return;
   const buttons=[...element.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
   const first=buttons[0],last=buttons.at(-1);
   if((event.shiftKey&&document.activeElement===first)||(!event.shiftKey&&document.activeElement===last)||!element.contains(document.activeElement)){event.preventDefault();event.stopPropagation();(event.shiftKey?last:first)?.focus();}
  }
  document.addEventListener('keydown',escape,true);
  const remove=addBrowserFullscreenListener(document,nativeChange);
  return()=>{document.body.style.overflow=oldOverflow;inert.forEach(([el,value,display])=>{el.inert=value;el.style.display=display;});viewport?.removeEventListener('resize',size);viewport?.removeEventListener('scroll',size);window.removeEventListener('resize',size);remove();document.removeEventListener('keydown',escape,true);media.removeEventListener('change',updateCompact);if(getBrowserFullscreenElement(document)===element)void exitBrowserFullscreen(document);};
 },[]);
 const hasFeedback=mode==='student'?Boolean(checked||response?.correct||(!selection&&response)):reveal;
 const showingClue=clue&&hasFeedback&&compact;
 const firstFocus=useRef(true);
 useLayoutEffect(()=>{if(firstFocus.current){firstFocus.current=false;return;}const target=stage.current?.querySelector(showingClue?'[data-clue-title]':showComplete?'[data-complete-title]':'[data-lesson-question-title]');if(view==='questions'||!compact)target?.focus();},[showingClue,showComplete,questionIndex,view,compact]);
 const feedback=mode==='student'?`${response?.correct?'That fits the story.':'Look back at this part. Try another answer.'} ${q.evidence.join(' ')}`:`Answer: ${q.answer}. ${q.evidence.join(' ')} Accept answers in the reader’s own words when they match the story.`;
 const supportText=`Pattern words: ${getPassagePhonicsWords(p).join(', ')}. Support words: ${p.supportWords.join(', ')||'No additional words'}. Word help: ${p.wordHelp.map(([word,meaning])=>`${word}: ${meaning}`).join('. ')}. Read new words together first. You can listen to the story for help.`;
 function questionMove(index){setClue(false);onNext(index);}
 const nav=<div className="rc-lesson-question-nav"><button disabled={!questionIndex} onClick={()=>questionMove(questionIndex-1)}>Previous</button>{questionIndex<p.questions.length-1?<button className={mode==='student'&&response?.correct?'rc-primary':undefined} disabled={mode==='student'&&!response?.correct} onClick={()=>questionMove(questionIndex+1)}>Next</button>:mode==='student'?<button className={practice.completed?'rc-primary':undefined} disabled={!practice.completed} onClick={onFinish}>Finish</button>:null}</div>;
 return createPortal(<div ref={stage} id="rc-lesson-stage" className="rc-stage-host rc-page" data-fullscreen-lesson="" data-lesson-mode={mode}>
  <TeacherDialog className="rc-lesson" label={`${p.title} · full-screen lesson`} onClose={onExit}>
   <header className="rc-lesson-heading"><div><p>{teacher?mode==='whole'?'Whole group':mode==='small'?'Small group':'Teacher preview':'Reading practice'}</p><h1>{p.title}</h1></div><button data-autofocus="" aria-label={`Exit full screen: ${p.title}`} onClick={onExit}>Exit full screen</button></header>
   <div className="rc-lesson-tools"><div className="rc-lesson-tabs" role="group" aria-label="Lesson view">{[['read','Read'],['pictures','Pictures'],['questions','Questions']].map(([id,label])=><button key={id} aria-pressed={!support&&view===id} onClick={()=>{setView(id);setSupport(false);}}>{label}</button>)}</div><div className="rc-lesson-audio" role="group" aria-label="Reading support">{compact?<button aria-label={view==='questions'?'Hear question and choices':'Hear story with Leda'} onClick={view==='questions'?onQuestionAudio:onStoryAudio}>Leda</button>:<><button aria-label="Hear story with Leda" onClick={onStoryAudio}>Hear story</button><button aria-label="Hear question and choices" onClick={onQuestionAudio}>Hear question</button></>}<button aria-label="Stop voice" onClick={onStop}>Stop</button><button aria-label={highlight?'Hide word marks':'Mark phonics words'} aria-pressed={highlight} onClick={onHighlight}>Marks</button><button aria-pressed={support} onClick={()=>setSupport(!support)}>Words</button></div></div>
   <div className={`rc-lesson-body${support?' rc-show-support':''}`} data-view={view}>
    {support?<section className="rc-lesson-support"><h2>Words to read together</h2><PagedText text={supportText} kind="word help"/></section>:<>
    <section className="rc-lesson-reading" aria-label="Story passage"><p className="rc-lesson-instruction">Read the story. {p.focus} {highlight?'· Word marks on':''}</p><PagedText text={p.text} renderText={renderText} unpaged={!compact}/><fieldset className="rc-lesson-reread"><legend>Read again</legend>{practice.reads.map((read,i)=><label key={i}><input type="checkbox" checked={read} onChange={()=>onRead(i)}/>Read {i+1}</label>)}</fieldset></section>
    <StoryPicture passage={p} shown={pictures} onToggle={onPictureToggle}/>
    <section className={`rc-lesson-question${showingClue?' rc-show-clue':''}`} aria-label="Comprehension questions">
     {showComplete?<><h2 tabIndex={-1} data-complete-title="">You finished this practice!</h2><PagedText text={`Tell the story in your own words. ${p.draw}`} kind="retell"/><button className="rc-primary" onClick={()=>{setClue(false);onReset();}}>Start again</button></>:<>
      <div className="rc-lesson-question-title"><p>Question {questionIndex+1} of {p.questions.length}</p><h2 tabIndex={-1} data-lesson-question-title="">{q.prompt}</h2></div>
      {showingClue?<div className="rc-lesson-clue"><h3 tabIndex={-1} data-clue-title="">Story clue</h3><PagedText text={feedback} kind="story clue"/><button className={mode==='student'&&!response?.correct?'rc-primary':undefined} onClick={()=>setClue(false)}>Back to choices</button></div>:<>
       <div className="rc-options rc-lesson-options" role="group" aria-label="Answer choices">{q.options.map((option,index)=><button key={option} aria-label={option} aria-pressed={(selection||(mode==='student'?response?.last:''))===option} disabled={mode==='student'&&Boolean(response?.correct)} data-correct={mode!=='student'&&reveal&&option===q.answer?true:undefined} onClick={()=>onSelect(option)}><span className="rc-option-letter" aria-hidden="true">{'ABCD'[index]}</span><span>{option}</span></button>)}</div>
       <div className="rc-lesson-check">{mode==='student'?response?.correct?<button onClick={()=>setClue(true)}>Read story clue</button>:<button className="rc-primary" disabled={!selection||checked} onClick={()=>{onCheck();setClue(true);}}>Check answer</button>:<button className="rc-primary" onClick={()=>{onReveal();setClue(!reveal);}}>{reveal?'Hide answer':'Reveal answer'}</button>}{hasFeedback&&mode==='student'&&!response?.correct&&<button onClick={()=>setClue(true)}>Story clue</button>}</div>
       {hasFeedback&&<div className="rc-lesson-inline-feedback" role="status">{feedback}</div>}
      </>}
      {nav}
     </>}
    </section>
    </>}
   </div>
   <p className="rc-lesson-status" role="status">{!saved?'Progress stays here while this page is open. ':''}{audioNote||'Read or listen. Choose an answer.'}</p>
  </TeacherDialog>
 </div>,document.body);
}
