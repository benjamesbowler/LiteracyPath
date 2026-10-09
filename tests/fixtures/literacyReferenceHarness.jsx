import '../../src/styles/fonts.js';
import '../../src/index.css';
import '../../src/App.css';
import '../../src/styles/skills-practice.css';
import '../../src/styles/literacy-practice.css';
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import { AssessmentPage } from '../../src/components/AppPages.jsx';
import { loadLiteracyReferenceBank } from '../../src/data/literacyReferenceBank.js';
import { normalizeAssessmentQuestion, getQuestionAnswer, normalizeMultiSelectAnswer } from '../../src/appState/assessmentRuntime.js';
import { presentLiteracyPracticeQuestion } from '../../src/data/literacyPracticeBank.js';
import { shuffleLearningQuestionChoices } from '../../src/utils/answerPositionShuffle.js';

function Harness() {
  const id = new URLSearchParams(location.search).get('item') || 'long-a';
  const source = loadLiteracyReferenceBank().find(item => item.sourceProvenance.sourceId === id);
  const question = presentLiteracyPracticeQuestion(shuffleLearningQuestionChoices(normalizeAssessmentQuestion(source,source.skillId), 'reference-ui'));
  const answer = useRef(null);
  const [result, setResult] = useState('');
  const [missing, setMissing] = useState('');
  return <div className="skills-practice-play literacy-practice-play" style={{height:'100dvh'}}>
    <AssessmentPage studentName="Alex" currentSkillIndex={0} skillTree={[{id:question.skillId,label:'Classroom questions'}]} currentStage={{level:question.level,phase:1,label:'Classroom questions'}}
      currentQuestion={question} roundAnswers={[]} feedback={null} message="" childPractice practiceFeedbackOnly
      answerQuestion={choice=>{
        if(answer.current || missing) return false;
        const correct = question.correctAnswers ? normalizeMultiSelectAnswer(choice) === normalizeMultiSelectAnswer(getQuestionAnswer(question)) : choice === question.answer;
        answer.current=choice;window.__referenceAnswer={choice,correct};setResult(correct?'Correct':'Incorrect');return true;
      }} speakText={async()=>{}} pickQuestion={()=>{}} endAssessment={()=>{}} onEvidenceImageError={failure=>setMissing(failure.src)}
      roundLength={40} roundProgress={0} shouldShowImage={()=>false} practiceTitle="MAP practice" />
    {result && <div role="status">{result}: {question.explanation}</div>}
    {missing && <div role="alert">Required image unavailable. Answer not scored.</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
