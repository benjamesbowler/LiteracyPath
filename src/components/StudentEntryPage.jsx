import { CHILD_BRAND } from "../data/childBrand.js";

export function StudentEntryPage({ onStudent, onTeacher }) {
  return (
    <main className="student-entry-page pals-entry">
      <section className="student-entry-hero" aria-label="Choose how to enter">
        <div className="pals-entry-brand">
          <img
            src={CHILD_BRAND.logoPath}
            alt={CHILD_BRAND.endorsedName}
            className="pals-entry-logo"
          />
        </div>

        <div className="student-entry-grid">
          <button
            className="student-entry-card student-primary-entry"
            onClick={onStudent}
            type="button"
            aria-label="Open student sign in"
          >
            <span className="student-entry-card-title">{CHILD_BRAND.name}</span>
            <span className="student-entry-card-text">Find your school and class, then sign in with your picture password.</span>
            <span className="student-entry-card-cta pals-cta">Start learning</span>
          </button>

          <button
            className="student-entry-card teacher-entry"
            onClick={onTeacher}
            type="button"
            aria-label="Open teacher sign in"
          >
            <span className="student-entry-card-title">Teachers</span>
            <span className="student-entry-card-text">Classes, checkpoints, reports, and guided reading.</span>
            <span className="student-entry-card-cta pals-cta ghost">Open dashboard</span>
          </button>
        </div>
      </section>
    </main>
  );
}
