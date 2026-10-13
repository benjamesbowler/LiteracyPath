import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import { createRoot } from 'react-dom/client';
import { LiteracyPracticePage } from '../../src/components/progress/LiteracyPracticePage.jsx';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { loadSkillsPracticeSession, loadSkillsPracticeProgress, saveSkillsPracticeSession } from '../../src/utils/skillsPracticeProgress.js';
const studentId = 'literacy-practice-preview';
window.__literacy = { bank: loadLiteracyPracticeBank, session: () => loadSkillsPracticeSession(studentId, 'literacy-practice'), record: () => loadSkillsPracticeProgress(studentId, 'literacy-practice') };
// Private fixture only: exercise a particular authored item through the real
// resume, audio, grading and adaptive flow rather than bypassing its controls.
window.__literacy.seedReference = async sourceId => {
  const { loadLiteracyReferenceBank } = await import('../../src/data/literacyReferenceBank.js');
  const question = loadLiteracyReferenceBank().find(item=>item.sourceProvenance.sourceId===sourceId);
  const saved = window.__literacy.session();
  if (!question?.literacyAudioReady || !saved || saved.answers.length) throw new Error('Seed requires a ready source item and an unanswered local sitting.');
  saveSkillsPracticeSession(studentId,{...saved,index:0,responseEpisode:null,questionIds:[question.id,...saved.questionIds.slice(1)],
    questionSkills:{...saved.questionSkills,[question.id]:question.skillId},adaptiveDemand:{tier:question.practiceDemand,successes:0}},'literacy-practice');
  return question;
};
window.__literacy.seedQuestion = async questionId => {
  const question = (await loadLiteracyPracticeBank()).find(item => item.id === questionId);
  const saved = window.__literacy.session();
  if (!question || !saved || saved.answers.length) throw new Error('Seed requires an authored item and an unanswered sitting.');
  saveSkillsPracticeSession(studentId, { ...saved, index: 0, responseEpisode: null,
    questionIds: [question.id, ...saved.questionIds.filter(id => id !== question.id).slice(0, saved.questionIds.length - 1)],
    questionSkills: { ...saved.questionSkills, [question.id]: question.skillId },
    ...(Number.isInteger(question.practiceDemand) ? {adaptiveDemand:{tier:question.practiceDemand,successes:0}} : {}) }, 'literacy-practice');
  return question;
};
// Historical recovery fixture: mount the retained engine directly, without
// reopening the retired public practice entry in ProgressCheckPage.
createRoot(document.getElementById('root')).render(<LiteracyPracticePage studentId={studentId} studentName="Alex" teacherId="local" onExit={() => { location.hash = 'finished'; }}/>);
