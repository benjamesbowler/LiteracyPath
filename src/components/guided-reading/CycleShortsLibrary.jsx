import {useRef,useState} from 'react';
import {CYCLE_SHORTS} from '../../content/cycle-shorts/passages.js';
import {PassageWorkspace} from '../comprehension/ComprehensionPage.jsx';
import {TeacherPageShell,TeacherPageHeader} from '../teacher/ui/TeacherPrimitives.jsx';
import ChildPageControls from '../ChildPageControls.jsx';
import {useChildPages} from '../../hooks/useChildPages.js';
import {usePassageCatalogueSize} from '../comprehension/usePassageCatalogueSize.js';

export default function CycleShortsLibrary({teacher=false,scope='cycle-shorts',onBack}) {
 const [selected,setSelected]=useState(null);
 const heading=useRef(null);
 const pageSize=usePassageCatalogueSize();
 const {visibleItems,pageIndex,pageCount,setPageIndex}=useChildPages(CYCLE_SHORTS,pageSize,scope);
 function returnToShorts(){
  setSelected(null);
  requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));
 }
 const Shell=teacher?TeacherPageShell:'section';
 return <Shell {...(teacher?{product:'cycle-shorts',intent:'resources'}:{'data-child-surface':'reading-comprehension','data-learning-lane':'language_and_meaning'})} className={`rc-page rc-cycle-shorts${!teacher&&!selected?' rc-child-catalogue':''}`}>
  {(!selected||teacher)&&<nav aria-label="Cycle Shorts navigation"><button className="rc-back" onClick={selected?returnToShorts:onBack}>← {selected?'All Cycle Shorts':'Back to Guided Reading'}</button></nav>}
  {!selected?<>
   {teacher?<TeacherPageHeader title="Cycle Shorts" eyebrow="Guided Reading · Sunny Meadow Farm" description="One short read-together story and three questions for each cycle."/>:<header className="rc-heading"><h1 ref={heading} tabIndex={-1} data-child-title="">Cycle Shorts</h1><p data-child-instruction="">Read a farm story together. Talk about what happened.</p></header>}
   {teacher&&<p className="rc-note">Bold words practise familiar sight words and the week’s sounds. Read names and other words together. These stories are supported reading.</p>}
   <p className="rc-count" role="status" data-child-progress="">{CYCLE_SHORTS.length} cycle stories</p>
   <div className="rc-catalogue" role="group" aria-label="Choose a Cycle Short" data-child-choices="">{(teacher?CYCLE_SHORTS:visibleItems).map((p,i)=><article className="rc-card" key={p.id}><button className="rc-card-open" data-child-primary={!teacher&&i===0?'':undefined} data-child-emphasis={!teacher&&i===0?'primary':undefined} onClick={()=>setSelected(p)} aria-label={`Read Cycle ${p.cycleNumber}: ${p.title}`}><img src="/images/worksheets/muddy-colouring.webp" alt=""/><span className="rc-card-copy"><span className="rc-focus">Cycle {p.cycleNumber}</span><strong data-child-emphasis-cue={!teacher&&i===0?'':undefined}>{p.title}</strong><span>{p.wordCount} words · Read together</span></span></button></article>)}</div>
   {!teacher&&<ChildPageControls pageIndex={pageIndex} pageCount={pageCount} onPageChange={setPageIndex} label="Cycle Shorts pages"/>}
  </>:<>
   {teacher&&<p className="rc-note">This week’s sight words: {selected.weeklySightWords.join(', ')}. Read unfamiliar words together.</p>}
   <PassageWorkspace key={selected.id} passage={selected} teacher={teacher} scope={`${scope}:cycle-shorts`} printable={false} onBackToPassages={teacher?undefined:returnToShorts} backLabel="All Cycle Shorts"/>
  </>}
 </Shell>;
}
