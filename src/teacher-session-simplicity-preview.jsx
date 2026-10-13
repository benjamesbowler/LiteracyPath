import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.js';
import './index.css';
import './App.css';
import { StudentSessionSetupDialog } from './components/student-sessions/StudentSessionSetupDialog.jsx';
import { ReadingSessionSetup } from './components/guided-reading/ReadingSessionSetup.jsx';
import { ReadingSessionRecoveryDialog } from './components/guided-reading/ReadingSessionRecoveryDialog.jsx';
import { ReadingSessionBar } from './components/guided-reading/ReadingSessionBar.jsx';
import { TeacherReadingSessionStrip } from './components/teacher/sessions/TeacherReadingSessionStrip.jsx';
import { useReadingSessionHost } from './hooks/useReadingSessionHost.js';
import { resolveLaunchAudience } from './utils/teacherLaunchContext.js';

const params = new URLSearchParams(location.search);
const students = ['Amina', 'Ben', 'Cara', 'Dev', 'Emi', 'Finn', 'Gia'].map((name, index) => ({ id: `student-${index}`, name }));
const initialIds = params.get('selected') === 'all' ? students.map(row => row.id) : (params.get('selected') || '').split(',').filter(Boolean);
const readingSession = { id: 'reading-preview', class_id: 'class-preview', teacher_id: 'teacher-preview', student_ids: ['student-0', 'student-1'], book_id: 'fixture-book', page_index: 0, page_numbers: [1, 2], book: { title: 'Synthetic reading', pages: [{}, {}] } };
window.__teacherSessionCalls = [];
window.__readingOffline = params.get('offline') === '1';
window.__readingExpired = params.get('expired') === '1';
const client = {
  async call(name, args) {
    window.__teacherSessionCalls.push({ name, args });
    if (name === 'teacher_get_reading_session_presence') return { data: { ok: true, presence: [] } };
    if (name === 'teacher_save_reading_marks' || name === 'teacher_set_reading_session_page') {
      if (window.__readingOffline) throw new Error('Synthetic offline');
      if (window.__readingExpired) return { data: { ok: false, error: 'session_ended' } };
      return { data: { ok: true } };
    }
    if (name === 'teacher_resume_reading_session') { if (params.get('ended') === '1') return { data: { ok: false, error: 'session_ended' } }; window.__readingExpired = false; return { data: { ok: true, session: readingSession } }; }
    if (name === 'teacher_end_reading_session') return { data: { ok: !window.__readingOffline } };
    if (params.get('reject') === '1') return { data: { ok: false, error: 'student_busy', student_id: 'student-0' } };
    if (name === 'teacher_start_reading_session') return { data: { ok: true, session: { ...readingSession, student_ids: args.p_student_ids, book_id: args.p_book_id, page_numbers: args.p_page_numbers } } };
    return { data: { ok: true, session: { id: 'focus-preview', class_id: 'class-preview', teacher_id: 'teacher-preview', status: 'active' } } };
  },
  table() { return { select() { return this; }, in() { return this; }, eq() { return this; }, then(resolve) { return Promise.resolve({ data: [] }).then(resolve); } }; }
};
export function Preview() {
  const [setup, setSetup] = useState(params.get('mode') || 'focus');
  const [context, setContext] = useState(null);
  const [active, setActive] = useState(params.get('mode') === 'reading-live' ? readingSession : null);
  const [lastStarted, setLastStarted] = useState(null);
  const host = useReadingSessionHost({ client, initialSession: active, students });
  return <main className="app" style={{ padding: 24 }}>
    <h1>Synthetic teacher session workflow</h1>
    {setup === 'recovery' && <ReadingSessionRecoveryDialog session={readingSession} onResume={async () => { window.__resumeCalls = (window.__resumeCalls || 0) + 1; await new Promise((_, reject) => { window.__rejectRecovery = () => reject(new Error('Synthetic roster read failed')); }); }} onEnd={async () => { throw new Error('Synthetic end failed'); }} />}
    {lastStarted && <p role="status">Started {lastStarted.id}</p>}
    {setup === 'focus' && <StudentSessionSetupDialog client={client} classId="class-preview" className="Preview class" students={students} initialStudentIds={initialIds} initialPurpose={params.get('purpose') || 'practise'} initialTarget={params.get('target') || 'cycle_practice'} initialCycleId="cycle-1" onClose={() => setSetup(current => current === 'focus' ? '' : current)} onStarted={setLastStarted} onStartGuidedReading={next => { setContext(next); setSetup('reading'); }} skillTree={[{ id: 'initial_sounds', label: 'Initial sounds' }]} />}
    {setup === 'reading' && <ReadingSessionSetup open client={client} classId="class-preview" students={students} initialStudentIds={context ? resolveLaunchAudience(context, students).students.map(row => row.id) : initialIds} onClose={() => setSetup('')} onStarted={session => { setLastStarted(session); setActive(session); setSetup('reading-live'); }} />}
    {active && <>
      <ReadingSessionBar host={host} book={active.book} pageIndex={host.session?.page_index || 0} pageCount={2} />
      <button type="button" onClick={() => host.onTurn(1)}>Turn page</button>
      <button type="button" disabled={!host.markTarget} onClick={() => host.onMark(host.markTarget.id, 0, 0, 'correct')}>Record reading mark</button>
      <button type="button" onClick={() => { window.__readingOffline = false; host.retrySaving(); }}>Restore connection</button>
      <TeacherReadingSessionStrip host={host} teacherId="teacher-preview" onOpen={() => {}} onOpenResults={() => {}} />
    </>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Preview />);
