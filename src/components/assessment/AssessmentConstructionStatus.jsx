import ActivityButton from "../ActivityButton.jsx";

export function AssessmentConstructionStatus({ pending, error, onRetry, readyText, children }) {
  if (error) {
    return <div className="assessment-construction-retry" role="alert">
      <p>Your answer is still here. Try saving it again.</p>
      <ActivityButton className="wa-audio" onClick={onRetry}>Try saving again</ActivityButton>
    </div>;
  }
  return <p className="assessment-construction-guide" role="status">{pending ? readyText : children}</p>;
}
