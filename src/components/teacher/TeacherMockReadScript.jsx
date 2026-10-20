import { mockChoices } from '../../utils/literacyMockPlanner.js';
import { literacyMockNarrationCues } from '../../utils/literacyMockNarration.js';

export function TeacherMockReadScript({item,seed}) {
  const cues=literacyMockNarrationCues(item,mockChoices(item,seed));
  const directions=cues.filter(cue=>cue.role!=='choice');
  const choices=cues.filter(cue=>cue.role==='choice');
  return <details className="whole-class-teacher-script" open>
    <summary>Teacher script · recordings off</summary>
    <div role="region" aria-label="Teacher reading script">
      <p className="whole-class-script-guidance">Read aloud, then close this script before the class answers.</p>
      {directions.map((cue,index)=><p className="whole-class-script-line" key={index}>
        {cue.role==='phoneme' ? <>Sound, not letter name: <strong>/{cue.text}/</strong>{/short[-_]/.test(cue.path) && ' (short vowel)'}</> : cue.text}
      </p>)}
      {choices.length ? <>
        <p className="whole-class-script-guidance">Pause for two seconds, then read these options in order.</p>
        {choices.map((cue,index)=><p className="whole-class-script-choice" key={index}>{cue.choiceNumber}. {cue.text}</p>)}
      </> : <p className="whole-class-script-guidance">Let the class read the printed answer choices.</p>}
    </div>
  </details>;
}
