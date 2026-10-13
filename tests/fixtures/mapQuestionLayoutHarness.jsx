import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import '../../src/styles/skills-practice.css';
import '../../src/styles/literacy-practice.css';
import '../../src/styles/literacy-mock.css';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { AssessmentPage } from '../../src/components/AppPages.jsx';
import { LiteracyMockQuestion } from '../../src/components/progress/LiteracyMockQuestion.jsx';
import { loadLiteracyPracticeBank, presentLiteracyPracticeQuestion } from '../../src/data/literacyPracticeBank.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { normalizeAssessmentQuestion } from '../../src/appState/assessmentRuntime.js';

const [practice, mock] = await Promise.all([loadLiteracyPracticeBank(), loadLiteracyMockBank()]);
const banks = { practice, mock };
const root = createRoot(document.getElementById('root'));
let revision = 0;
window.__mapLayout = {
  answer: null,
  inventory: () => Object.fromEntries(Object.entries(banks).map(([name, bank]) => [name, bank.map(q => ({ id: q.id, format: q.format || q.mapInteraction || q.questionType || 'choice', skillId: q.skillId }))])),
  longest: name => Object.values(banks[name].reduce((groups, q) => {
    const format = q.format || q.mapInteraction || q.questionType || 'choice';
    const length = JSON.stringify(q.choices || q.answerOptions || q.options || []).length;
    if (!groups[format] || length > groups[format].length) groups[format] = { id: q.id, format, length };
    return groups;
  }, {})),
  show(name, id, disabled = false) {
    const source = banks[name].find(q => q.id === id);
    if (!source) throw new Error(`Unknown ${name} question: ${id}`);
    const q = name === 'practice' ? { ...presentLiteracyPracticeQuestion(normalizeAssessmentQuestion(source, source.skillId)), requireExplicitSubmit: true } : source;
    const output = name === 'practice' ? <div key={++revision} className="skills-practice-play literacy-practice-play">
      <div className="skills-practice-tools"><button>Take a break</button><button>I don't know yet</button></div>
      <p className="literacy-practice-response-status">Choose, check, then move on.</p>
      <AssessmentPage studentName="Alex" currentSkillIndex={0} currentStage={{ level: q.level, phase: 1, label: source.skillName || source.skillId }}
        currentQuestion={q} roundAnswers={[]} feedback={null} message="" childPractice practiceFeedbackOnly
        answerQuestion={selected => { window.__mapLayout.answer = selected; return true; }} speakText={async () => ({ ok: true })} pickQuestion={() => {}} endAssessment={() => {}}
        roundLength={40} roundProgress={50} shouldShowImage={item => Boolean(item.imagePath || item.imageUrl || item.targetImage)} practiceTitle="Literacy explorer" />
    </div> : <main key={++revision} className="literacy-mock"><div className="literacy-mock-canvas">
      <header className="literacy-mock-header"><h1>Reading &amp; language</h1><span>Look, listen, and choose.</span></header>
      <LiteracyMockQuestion item={q} seed="layout-audit" index={20} total={43} studentName="Alex" disabled={disabled} onSubmit={() => {}} />
    </div></main>;
    flushSync(() => root.render(output));
    return { id: source.id, prompt: q.prompt, format: source.format || source.mapInteraction || source.questionType || 'choice' };
  }
};
const query = new URLSearchParams(location.search);
window.__mapLayout.show(query.get('bank') || 'practice', query.get('item') || 'literacy.writing_purpose.missing-dog');
