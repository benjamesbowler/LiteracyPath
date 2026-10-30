import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import '../../src/styles/ui-quality-pass.css';
import ComprehensionPage from '../../src/components/comprehension/ComprehensionPage.jsx';

function Fixture(){
 const [teacherId,setTeacherId]=useState('teacher-a');
 const [classId,setClassId]=useState('class-a');
 const teacher=new URLSearchParams(location.search).get('child')!=='1';
 const scope=teacher?`${teacherId}:class:${classId}:teacher`:`${teacherId}:child:one`;
 const groupScope=teacher&&classId?`${teacherId}:class:${classId}`:'';
 return <><div aria-label="Fixture account and class" style={{display:'flex',flexWrap:'wrap',gap:12,padding:12}}><label>Fixture teacher<select value={teacherId} onChange={event=>setTeacherId(event.target.value)}><option>teacher-a</option><option>teacher-b</option></select></label><label>Fixture class<select value={classId} onChange={event=>setClassId(event.target.value)}><option>class-a</option><option>class-b</option><option value="">No class</option></select></label></div><ComprehensionPage key={scope} teacher={teacher} scope={scope} groupScope={groupScope} onBack={()=>{}}/></>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
