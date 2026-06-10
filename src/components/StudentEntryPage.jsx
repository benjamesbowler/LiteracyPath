import logoUrl from "../assets/logo.svg";

export function StudentEntryPage({ onStudent, onTeacher }) {
  return (
    <main className="student-entry-page">
      <section className="student-entry-hero" aria-label="Choose how to enter">
        <img src={logoUrl} alt="Literacy Guide" className="student-entry-logo" />
        <div className="student-entry-copy">
          <h1>Welcome to Literacy Guide</h1>
          <p>Choose how you would like to sign in.</p>
        </div>

        <div className="student-entry-grid">
          <button className="student-entry-card student-primary-entry" onClick={onStudent} type="button">
            <span className="student-entry-visual" aria-hidden="true">
              <img src="/images/learn-games/phinny-waving.png" alt="" />
            </span>
            <span className="student-entry-card-title">Student</span>
            <span className="student-entry-card-text">Sign in with your school, class, and picture password.</span>
            <span className="student-entry-card-cta">Start learning</span>
          </button>

          <button className="student-entry-card teacher-entry" onClick={onTeacher} type="button">
            <span className="student-entry-visual student-entry-adult-icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10L12 5 2 10l10 5 10-5z" />
                <path d="M6 12v4.5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5V12" />
                <path d="M22 10v6" />
              </svg>
            </span>
            <span className="student-entry-card-title">Teacher or Parent</span>
            <span className="student-entry-card-text">Manage classes, run assessments, and track progress.</span>
            <span className="student-entry-card-cta">Sign in</span>
          </button>
        </div>
      </section>
    </main>
  );
}
