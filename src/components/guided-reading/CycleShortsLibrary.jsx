import {useRef,useState} from 'react';
import {CYCLE_SHORTS} from '../../content/cycle-shorts/passages.js';
import {PassageWorkspace} from '../comprehension/ComprehensionPage.jsx';
import {TeacherPageShell,TeacherPageHeader} from '../teacher/ui/TeacherPrimitives.jsx';

export default function CycleShortsLibrary({teacher=false,scope='cycle-shorts',onBack}) {
 const [selected,setSelected]=useState(null);
 const heading=useRef(null);
 const Shell=teacher?TeacherPageShell:'section';
 return <Shell {...(teacher?{product:'cycle-shorts',intent:'resources'}:{'data-child-surface':'reading-comprehension','data-learning-lane':'language_and_meaning'})} className="rc-page rc-cycle-shorts">
  <nav aria-label="Cycle Shorts navigation"><button className="rc-back" onClick={()=>{if(selected){setSelected(null);requestAnimationFrame(()=>heading.current?.focus());}else onBack?.();}}>← {selected?'All Cycle Shorts':'Back to Guided Reading'}</button></nav>
  {!selected?<>
   {teacher?<TeacherPageHeader title="Cycle Shorts" eyebrow="Guided Reading · Sunny Meadow Farm" description="One short read-together story and three questions for each cycle."/>:<header className="rc-heading"><h1 ref={heading} tabIndex={-1} data-child-title="">Cycle Shorts</h1><p data-child-instruction="">Read a farm story together. Talk about what happened.</p></header>}
   <p className="rc-note">Bold words practise familiar sight words and the week’s sounds. Read names and other words together. These stories are supported reading.</p>
   <p role="status" data-child-progress="">27 cycle stories</p>
   <div className="rc-catalogue" role="group" aria-label="Choose a Cycle Short" data-child-choices="">{CYCLE_SHORTS.map((p,i)=><article className="rc-card" key={p.id}><button className="rc-card-open" data-child-primary={!teacher&&i===0?'':undefined} onClick={()=>setSelected(p)} aria-label={`Read Cycle ${p.cycleNumber}: ${p.title}`}><img src="/images/worksheets/muddy-colouring.webp" alt=""/><span className="rc-card-copy"><span className="rc-focus">Cycle {p.cycleNumber}</span><strong>{p.title}</strong><span>{p.wordCount} words · Read together</span></span></button></article>)}</div>
  </>:<>
   <p className="rc-note">This week’s sight words: {selected.weeklySightWords.join(', ')}. Read unfamiliar words together.</p>
   <PassageWorkspace key={selected.id} passage={selected} teacher={teacher} scope={`${scope}:cycle-shorts`} printable={false}/>
  </>}
 </Shell>;
}
