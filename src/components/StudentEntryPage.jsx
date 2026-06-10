import logoUrl from "../assets/logo.svg";

export function StudentEntryPage({ onStudent, onTeacher }) {
  return (
    <main className="student-entry-page">
      <section className="student-entry-hero" aria-label="Choose how to enter">
        <img src={logoUrl} alt="Literacy Guide" className="student-entry-logo" />
        <div className="student-entry-copy">
          <p className="panel-label">Welcome</p>
          <h1>Who is using Literacy Guide?</h1>
        </div>

        <div className="student-entry-grid">
          <button className="student-entry-card student-primary-entry" onClick={onStudent} type="button">
            <img src="/images/learn-games/phinny-waving.png" alt="" />
            <span>I am a student</span>
          </button>

          <button className="student-entry-card teacher-entry" onClick={onTeacher} type="button">
            <span className="student-entry-adult-icon" aria-hidden="true">Aa</span>
            <span>I am a teacher or parent</span>
          </button>
        </div>
      </section>
    </main>
  );
}
