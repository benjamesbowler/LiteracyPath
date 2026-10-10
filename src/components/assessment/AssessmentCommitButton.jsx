import { ArrowRight } from '@phosphor-icons/react';
import ActivityButton from '../ActivityButton.jsx';

export function AssessmentCommitButton({ question, ready, pending = false, onCommit }) {
  if (!question.requireExplicitSubmit) return null;
  return <div className="assessment-commit-row">
    <span role="status">{ready ? 'You can change your answer before moving on.' : 'Finish choosing your answer.'}</span>
    <ActivityButton type="button" className="assessment-commit wa-choice" data-child-primary
      disabled={!ready || pending} onClick={onCommit}>
      {question.practiceAdministration === 'rehearsal' ? 'Next' : 'Check answer'}<ArrowRight aria-hidden="true"/>
    </ActivityButton>
  </div>;
}
