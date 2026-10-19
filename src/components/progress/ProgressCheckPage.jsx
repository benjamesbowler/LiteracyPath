import { LiteracyMockPage } from "./LiteracyMockPage.jsx";
import "../../styles/progress-check.css";

// MAP has one learner route: a teacher-started, token-scoped mock.
// Historical practice/check records remain readable in teacher reports.
function ProgressCheckRoute(props) {
  if (props.token && props.focusSession?.resolved_config?.plan_kind === "mock") return <LiteracyMockPage {...props}/>;
  return <main className="progress-check" data-child-surface="progress-check">
    <h1 data-child-title>Adaptive Literacy Test</h1>
    <p data-child-instruction>Your teacher starts this test. Ask your teacher when it is time.</p>
    <div data-child-choices><p data-child-progress>Waiting for your teacher</p></div>
    <button type="button" data-child-primary onClick={props.onExit}>Back</button>
  </main>;
}

export function ProgressCheckPage(props) {
  return <ProgressCheckRoute key={`${props.studentId}:${props.focusSession?.id || "free"}:${props.focusSession?.resolved_config?.plan_kind || "free"}`} {...props}/>;
}
