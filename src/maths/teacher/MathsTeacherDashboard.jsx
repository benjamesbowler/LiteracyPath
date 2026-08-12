import { mathsCyclesForYear } from "../curriculum/mathsCycles.js";
import {
  approvedMathsSkills,
  mathsSkillTree,
  mathsSkillsForYear
} from "../curriculum/mathsSkillTree.js";
import "../../styles/maths-phase-zero.css";

const FOUNDATION_CYCLES = mathsCyclesForYear("F");
const APPROVED_SKILLS = approvedMathsSkills();

function NumberMark() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <circle cx="48" cy="48" r="44" fill="#E9E2FF" />
      <circle cx="31" cy="30" r="8" fill="#7C5CFC" />
      <rect x="51" y="20" width="20" height="20" rx="5" fill="#F2A54A" />
      <path d="M26 67h45" stroke="#193B36" strokeWidth="8" strokeLinecap="round" />
      <path d="M34 54v26M48 50v30M63 55v25" stroke="#38A083" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
export function MathsTeacherDashboard({
  className = "",
  studentCount = null
}) {
  const yearCounts = ["F", "1", "2"].map(year => ({
    year,
    total: mathsSkillsForYear(year).length,
    approved: mathsSkillsForYear(year, { includePlanned: false }).length
  }));

  return (
    <main className="maths-teacher-dashboard" data-maths-surface="teacher-dashboard">
      <header className="maths-teacher-hero">
        <div className="maths-teacher-hero-copy">
          <p className="maths-kicker">Maths · Phase 0</p>
          <h1>Maths now has a proper home.</h1>
          <p className="maths-teacher-intro">
            The Foundation–Year 2 curriculum spine is mapped and the first eight
            Foundation number skills are approved. Lessons, practice, checks and
            reports will connect here in the next implementation phase.
          </p>
          <div className="maths-context-chips" aria-label="Current Maths context">
            <span>{className || "Choose a class in Literacy"}</span>
            {Number.isInteger(studentCount) && (
              <span>{studentCount} {studentCount === 1 ? "learner" : "learners"}</span>
            )}
          </div>
        </div>
        <div className="maths-teacher-mark"><NumberMark /></div>
      </header>

      <section className="maths-readiness-note" aria-labelledby="maths-readiness-heading">
        <span className="maths-readiness-icon" aria-hidden="true">i</span>
        <div>
          <h2 id="maths-readiness-heading">Curriculum foundation only</h2>
          <p>
            No Maths activity or assessment evidence is being recorded yet. Nothing on
            this page changes learner progress or Literacy records.
          </p>
        </div>
      </section>

      <section className="maths-status-grid" aria-label="Maths curriculum status">
        <article>
          <strong>{mathsSkillTree.length}</strong>
          <span>F–2 skills mapped</span>
        </article>
        <article>
          <strong>{APPROVED_SKILLS.length}</strong>
          <span>Foundation skills approved</span>
        </article>
        <article>
          <strong>{mathsSkillTree.length - APPROVED_SKILLS.length}</strong>
          <span>skills held as planned</span>
        </article>
      </section>

      <section className="maths-teacher-section" aria-labelledby="maths-approved-title">
        <div className="maths-section-heading">
          <div>
            <p className="maths-kicker">Approved first slice</p>
            <h2 id="maths-approved-title">Foundation number foundations</h2>
          </div>
          <span className="maths-approved-badge">Curriculum approved</span>
        </div>
        <div className="maths-cycle-grid">
          {FOUNDATION_CYCLES.slice(0, 4).map(cycle => {
            const released = cycle.skillIds
              .map(skillId => APPROVED_SKILLS.find(skill => skill.id === skillId))
              .filter(Boolean);
            return (
              <article className="maths-cycle-card" key={cycle.id}>
                <span className="maths-cycle-number">Cycle {cycle.number}</span>
                <h3>{cycle.label}</h3>
                {released.length ? (
                  <ul>
                    {released.map(skill => (
                      <li key={skill.id}>
                        <span aria-hidden="true">✓</span>
                        <div>
                          <strong>{skill.childLabel}</strong>
                          <small>{skill.id}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="maths-cycle-planned">Content is still planned.</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="maths-year-plan" aria-labelledby="maths-plan-title">
        <div className="maths-section-heading">
          <div>
            <p className="maths-kicker">Full spine</p>
            <h2 id="maths-plan-title">Release stays deliberately gated</h2>
          </div>
        </div>
        <div className="maths-year-plan-grid">
          {yearCounts.map(({ year, total, approved }) => (
            <article key={year}>
              <span>{year === "F" ? "Foundation" : `Year ${year}`}</span>
              <strong>{approved} approved · {total - approved} planned</strong>
              <div className="maths-year-meter" aria-hidden="true">
                <span style={{ width: `${(approved / total) * 100}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
