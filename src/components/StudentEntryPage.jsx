const ENTRY_PALS = [
  { id: "meadow", image: "/images/pals/poses/meadow-wave.webp" },
  { id: "dino", image: "/images/pals/poses/dino-wave.webp" },
  { id: "moonwood", image: "/images/pals/poses/moonwood-wave.webp" }
];

export function StudentEntryPage({ onStudent, onTeacher }) {
  return (
    <main className="student-entry-page pals-entry">
      <section className="student-entry-hero" aria-label="Choose how to enter">
        <div className="pals-entry-brand">
          <img
            src="/images/pals/literacy-pals-logo.webp"
            alt="Literacy Pals"
            className="pals-entry-logo"
          />
          <div className="pals-entry-cast" aria-hidden="true">
            {ENTRY_PALS.map((pal, index) => (
              <img
                key={pal.id}
                src={pal.image}
                alt=""
                className="pals-entry-pal"
                style={{ "--pal-bounce-delay": `${index * 0.35}s` }}
              />
            ))}
          </div>
        </div>

        <div className="student-entry-grid">
          <button
            className="student-entry-card student-primary-entry"
            onClick={onStudent}
            type="button"
            aria-label="Open student sign in"
          >
            <span className="student-entry-card-title">Literacy Pals</span>
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
