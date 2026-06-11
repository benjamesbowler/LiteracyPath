function StudentHomeCard({ title, subtitle, art, onClick }) {
  return (
    <button className="student-home-card" onClick={onClick} type="button">
      <span className="student-home-card-art" aria-hidden="true">
        <img src={art} alt="" loading="lazy" />
      </span>
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
          art="/images/learn-games/home/home-learn.webp"
          title="Learn"
          subtitle="Letters and sounds"
          onClick={onOpenPhonicsLearn}
        />
        <StudentHomeCard
          art="/images/learn-games/home/home-story-quests.webp"
          title="Story Quests"
          subtitle="Read and choose"
          onClick={onOpenStoryQuests}
        />
        <StudentHomeCard
          art="/images/learn-games/home/home-guided-reading.webp"
          title="Guided Reading"
          subtitle="Books and audio"
          onClick={onOpenGuidedReading}
        />
      </section>
    </main>
  );
}
