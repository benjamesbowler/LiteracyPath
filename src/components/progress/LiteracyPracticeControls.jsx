import { useEffect, useState } from 'react';
import { SpeakerHigh } from '@phosphor-icons/react';
import { playAssessmentCue } from '../../utils/audio/assessmentPlayback.js';
import { stopCueAudio } from '../../utils/audio/cuePlayer.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../data/progressCheckInstructions.js';
import { progressCheckAudioPath } from '../../utils/progressCheckAudio.js';
import { MapInteractionPanel } from '../assessment/MapInteractionPanel.jsx';

// Mechanics practice has no learner score, item event or literacy inference.
export function LiteracyPracticeControls({ onClose }) {
  const [step, setStep] = useState(0), [selected, setSelected] = useState(null);
  const [audioMessage, setAudioMessage] = useState('');
  useEffect(() => () => {
    stopCueAudio();
    try { sessionStorage.removeItem('lp-map-draft:mechanic-demo:control-picture-placement'); } catch { /* No learner evidence is stored here. */ }
  }, []);
  const close = () => { stopCueAudio(); onClose(); };
  const replay = async () => {
    setAudioMessage('Listening…');
    const result = await playAssessmentCue(progressCheckAudioPath(PROGRESS_CHECK_INSTRUCTIONS.circle));
    setAudioMessage(result.ok ? 'You can listen again.' : 'The sound could not play. Try the speaker again.');
  };
  return <section className="literacy-controls-practice" aria-label="Try the buttons">
    <header><h2>Try the buttons</h2><button type="button" onClick={close}>Close practice</button></header>
    <p>Button practice · no score</p>
    {step === 0 ? <>
      <p>Choose the circle. You can change your choice before Next.</p>
      <button type="button" aria-label="Check my sound" onClick={replay}><SpeakerHigh aria-hidden="true"/> Listen</button>
      <div className="literacy-controls-shapes" role="group" aria-label="Practice shapes">
        <button type="button" aria-label="Circle" aria-pressed={selected === 'circle'} onClick={() => setSelected('circle')}><span className="practice-circle"/></button>
        <button type="button" aria-label="Square" aria-pressed={selected === 'square'} onClick={() => setSelected('square')}><span className="practice-square"/></button>
      </div>
      <p role="status">{audioMessage}</p>
      <button type="button" disabled={selected === null} onClick={() => selected === 'circle' ? setStep(1) : setAudioMessage('The circle is round. Try changing your choice.')}>Next →</button>
    </> : <>
      <p>Move the picture into the space. Tap the picture, then the space. You can also drag. Remove lets you change it.</p>
      <div className="literacy-practice-play"><div className="assessment-shell"><MapInteractionPanel currentQuestion={{id:'control-picture-placement',practiceSessionId:'mechanic-demo',mapInteraction:'order',mapSlots:1,answerOptions:[{value:'book',label:'book',alt:'A book',image:'/images/navigation/ui/books-icon.webp'}]}}
        answerQuestion={close}/></div></div>
    </>}
  </section>;
}
