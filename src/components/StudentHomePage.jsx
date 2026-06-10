function StudentHomeCard({ title, subtitle, icon, onClick }) {
  return (
    <button className="student-home-card" onClick={onClick} type="button">
      <span className="student-home-card-icon" aria-hidden="true">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
    </button>
  );
}

export function StudentHomePage({
  studentName,
  onOpenPhonicsLearn,
  onOpenStoryQuests,
  onOpenGuidedReading,
  onLogout
}) {
  return (
    <main className="student-home-page">
      <header className="student-home-topbar">
        <div className="student-home-avatar" aria-hidden="true">
          {String(studentName || "S").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <span>Hello</span>
          <strong>{studentName || "Reader"}</strong>
        </div>
        <button className="student-home-logout" onClick={onLogout} type="button" aria-label="Log out">
          Door
        </button>
      </header>

      <section className="student-home-grid" aria-label="Student activities">
        <StudentHomeCard
          icon="Aa"
          title="Learn"
          subtitle="Letters and sounds"
          onClick={onOpenPhonicsLearn}
        />
        <StudentHomeCard
          icon="Book"
          title="Story Quests"
          subtitle="Read and choose"
          onClick={onOpenStoryQuests}
        />
        <StudentHomeCard
          icon="Read"
          title="Guided Reading"
          subtitle="Books and audio"
          onClick={onOpenGuidedReading}
        />
      </section>
    </main>
  );
}
