function StudentHomeCard({ title, subtitle, meta, art, onClick }) {
  return (
    <button className="student-home-card" onClick={onClick} type="button">
      <span className="student-home-card-art" aria-hidden="true">
        <img src={art} alt="" loading="lazy" />
      </span>
      <span className="student-home-card-label">
        {meta && <small className="student-home-card-meta">{meta}</small>}
        <strong>{title}</strong>
        <small className="student-home-card-subtitle">{subtitle}</small>
      </span>
    </button>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h9v2H6v12h7v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H10v-2h6.4l-2.2-2.2 1.4-1.4Z" />
    </svg>
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
          <span className="student-home-eyebrow">Hello</span>
          <strong>{studentName || "Reader"}</strong>
        </div>
        <button className="student-home-logout" onClick={onLogout} type="button" aria-label="Log out">
          <SignOutIcon />
          <span>Sign out</span>
        </button>
      </header>

      <section className="student-home-intro" aria-label="Student practice">
        <h1>Today&apos;s Practice</h1>
        <p>Letters, stories, and books in one place.</p>
      </section>

      <section className="student-home-grid" aria-label="Student activities">
        <StudentHomeCard
          art="/images/learn-games/home/home-learn.webp"
          meta="Start here"
          title="Phonics Practice"
          subtitle="Letters, words, and games"
          onClick={onOpenPhonicsLearn}
        />
        <StudentHomeCard
          art="/images/learn-games/home/home-story-quests.webp"
          meta="Story path"
          title="Story Quests"
          subtitle="Read, choose, and collect words"
          onClick={onOpenStoryQuests}
        />
        <StudentHomeCard
          art="/images/learn-games/home/home-guided-reading.webp"
          meta="Book shelf"
          title="Reading Library"
          subtitle="Listen, read, and reread"
          onClick={onOpenGuidedReading}
        />
      </section>
    </main>
  );
}
