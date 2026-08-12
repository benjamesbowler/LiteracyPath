import StudentGlassShell from "../../components/StudentGlassShell.jsx";
import { SubjectSwitch } from "../../components/SubjectSwitch.jsx";
import { SUBJECT_IDS } from "../../subjects/subjectRegistry.js";
import "../../styles/maths-phase-zero.css";

const NUMBER_DOTS = [1, 2, 3, 4, 5];

export function MathsHome({
  studentName = "Mathematician",
  progressScopeKey = "default",
  onOpenLiteracy
}) {
  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="maths"
      tabs={[]}
      showWallet={false}
      showGrownUps={false}
      onHome={onOpenLiteracy}
      headerActions={(
        <SubjectSwitch
          activeSubject={SUBJECT_IDS.MATHS}
          onSelectSubject={subjectId => {
            if (subjectId === SUBJECT_IDS.LITERACY) onOpenLiteracy?.();
          }}
          variant="child"
        />
      )}
    >
      <div className="maths-child-home" data-child-surface="maths-home">
        <div className="maths-child-orbit" aria-hidden="true">
          <span>2</span><span>5</span><span>8</span>
        </div>
        <section className="maths-child-hero" aria-labelledby="maths-child-title">
          <p className="maths-child-kicker">Your Maths place</p>
          <h1 id="maths-child-title">Numbers are on their way, {studentName}.</h1>
          <p>
            Your teacher will let you know when Maths activities are ready.
            Nothing needs doing here today.
          </p>
          <div className="maths-number-path" aria-label="Numbers one to five">
            {NUMBER_DOTS.map(number => <span key={number}>{number}</span>)}
          </div>
          <button type="button" className="maths-back-to-literacy" onClick={onOpenLiteracy}>
            Go to Literacy
          </button>
        </section>
        <section className="maths-coming-grid" aria-label="Maths activities being prepared">
          <article>
            <span className="maths-coming-icon" aria-hidden="true">•••</span>
            <h2>Count</h2>
            <p>Move objects and find how many.</p>
            <small>Coming next</small>
          </article>
          <article>
            <span className="maths-coming-icon" aria-hidden="true">&lt; = &gt;</span>
            <h2>Compare</h2>
            <p>Find more, fewer and the same.</p>
            <small>Coming next</small>
          </article>
          <article>
            <span className="maths-coming-icon" aria-hidden="true">5 + 5</span>
            <h2>Make</h2>
            <p>Build numbers in different ways.</p>
            <small>Coming next</small>
          </article>
        </section>
      </div>
    </StudentGlassShell>
  );
}
