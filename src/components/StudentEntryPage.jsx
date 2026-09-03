import { CHILD_BRAND } from "../data/childBrand.js";
import { PRODUCT_CATALOG_FACTS } from "../data/productCatalogFacts.js";
import { TEACHER_BRAND } from "../data/teacherBrand.js";
import teacherMarkUrl from "../assets/logomark.png";
import "../styles/landing.css";

// The public landing page (2026-07-28 redesign). One React surface, same two
// exits as the old "Choose your space" gateway - onStudent / onTeacher - so
// session logic upstream is untouched. Every catalogue number comes from the
// lightweight verified public-facts module, whose unit contract compares it
// with the authoritative book, game and cycle datasets.

const FEATURE_TILES = [
  {
    id: "library",
    image: "/images/home-sage/reading-library.webp",
    title: "Reading library",
    text: `${PRODUCT_CATALOG_FACTS.guidedReadingBooks} levelled books across three levels, with read-aloud and tap-any-word help.`
  },
  {
    id: "skills",
    image: "/images/home-sage/adventure-map.webp",
    title: "Skills quest",
    text: `A map of ${PRODUCT_CATALOG_FACTS.skillCycles} cycles that always starts at the right next sound.`
  },
  {
    id: "arcade",
    image: "/images/home-sage/arcade.webp",
    title: "Game arcade",
    text: `Rhyme Pop, Sound Racer and ${PRODUCT_CATALOG_FACTS.learningGames - 2} more — every one is real reading practice.`
  },
  {
    id: "stories",
    image: "/images/home-sage/story-quests.webp",
    title: "Story quests",
    text: "Choose-your-path stories where reading the words moves the story on."
  }
];

const WORLD_CARDS = [
  {
    id: "meadow",
    band: "Level A · cycles 1–9",
    name: "Meadow Pals",
    text: "First sounds, first words, first whole books — sunny stories for brand-new readers.",
    panorama: "/images/pals/meadow-panorama.webp",
    emblem: "/images/pals/meadow-emblem.webp"
  },
  {
    id: "dino",
    band: "Level B · cycles 10–18",
    name: "Dino Pals",
    text: "Longer words, digraphs and blends, in warm prehistoric adventures.",
    panorama: "/images/pals/dino-panorama.webp",
    emblem: "/images/pals/dino-emblem.webp"
  },
  {
    id: "moonwood",
    band: "Level C · cycles 19–27",
    name: "Moonwood Tales",
    text: "Fluency, comprehension and real chapter-style reading under the moon.",
    panorama: "/images/pals/moonwood-panorama.webp",
    emblem: "/images/pals/moonwood-emblem.webp"
  }
];

const TEACHER_STEPS = [
  {
    number: "1",
    title: "Checks without the admin",
    text: "Seven kinds of check — skills, letters, phonics, benchmark bands — each with the right starting point chosen for you.",
    chips: ["Class", "Child", "Check", "Begin"]
  },
  {
    number: "2",
    title: "Reports that say what to do",
    text: "Reports for one student or the whole class, in plain words — what's going well, what's next, and one thing to practise at home.",
    chips: ["Overview", "Skills", "Parent note"]
  },
  {
    number: "3",
    title: "Plan and print in one place",
    text: "Teaching resources, worksheets and whole-class Present mode, matched to the cycle your class is actually on.",
    chips: ["Present mode", "Worksheets"]
  }
];

export function StudentEntryPage({ onStudent, onTeacher, onTry }) {
  return (
    <main className="student-entry-page pals-entry lp-landing">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="lp-landing-header">
        <span className="lp-landing-wordmark">
          <img src={teacherMarkUrl} alt="" className="lp-landing-mark" />
          <span>
            <span className="lp-landing-domain">literacy.guide</span>
            <span className="lp-landing-tag">Read · Play · Progress</span>
          </span>
        </span>
        <nav className="lp-landing-nav" aria-label="Page sections">
          <a href="#for-children">For children</a>
          <a href="#three-worlds">What's inside</a>
          <a href="#for-teachers">For teachers</a>
          {/* Sits BEFORE Sign in and styled as the quieter of the two. It is the
              no-commitment door for a visitor with no account, so it belongs on
              the way to signing in rather than competing with it — and it is
              deliberately out of the child/teacher card grid below, which is a
              two-card layout and stays that way. */}
          {onTry && (
            <button type="button" className="lp-landing-try" onClick={onTry}>
              Try for free
            </button>
          )}
          <button type="button" className="lp-landing-signin" onClick={onTeacher}>
            Sign in
          </button>
        </nav>
      </header>

      {/* ── Hero with the two branded destinations ────────────────────── */}
      <section className="student-entry-hero lp-landing-hero" aria-labelledby="entry-gateway-title">
        <header className="entry-gateway-intro">
          <p className="lp-landing-kicker">Phonics · Books · Games · Teacher tools</p>
          <h1 id="entry-gateway-title">Learning to read, one guided step at a time.</h1>
          <p className="lp-landing-lede">
            {CHILD_BRAND.name} gives children books, games and adventures they actually
            want to open. Behind them, {TEACHER_BRAND.endorsedName} turns every tap into
            a clear picture of what each child can do next.
          </p>
        </header>

        <div className="student-entry-grid">
          <button
            className="student-entry-card student-primary-entry"
            onClick={onStudent}
            type="button"
            aria-labelledby="student-entry-title"
            aria-describedby="student-entry-description"
          >
            <span className="entry-card-accessible-title" id="student-entry-title">
              Children: {CHILD_BRAND.name}
            </span>
            <span className="entry-card-brand entry-student-brand" aria-hidden="true">
              <img
                src={CHILD_BRAND.logoPath}
                alt=""
                className="entry-brand-logo entry-student-logo"
              />
            </span>
            <span className="student-entry-card-text" id="student-entry-description">
              Books, games and guided adventures made for young readers. Sign in by
              tapping three pictures.
            </span>
            <span className="student-entry-card-cta pals-cta">Start playing</span>
          </button>


          <button
            className="student-entry-card teacher-entry"
            onClick={onTeacher}
            type="button"
            aria-labelledby="teacher-entry-title"
            aria-describedby="teacher-entry-description"
          >
            <span className="entry-card-accessible-title" id="teacher-entry-title">
              Teachers: {TEACHER_BRAND.endorsedName}
            </span>
            <span className="entry-card-brand entry-teacher-brand" aria-hidden="true">
              <img
                src={teacherMarkUrl}
                alt=""
                className="entry-brand-logo entry-teacher-mark"
              />
              <span className="entry-teacher-wordmark">
                <span className="entry-teacher-name">{TEACHER_BRAND.name}</span>
                <span className="entry-teacher-tools">{TEACHER_BRAND.areaName}</span>
              </span>
            </span>
            <span className="student-entry-card-text" id="teacher-entry-description">
              Checks, planning, teaching resources and progress in one place — no
              spreadsheets to keep.
            </span>
            <span className="student-entry-card-cta pals-cta">Open Teacher Tools</span>
          </button>
        </div>

        <dl className="lp-landing-stats" aria-label="What the platform includes">
          <div><dt>{PRODUCT_CATALOG_FACTS.guidedReadingBooks}</dt><dd>levelled books</dd></div>
          <div><dt>{PRODUCT_CATALOG_FACTS.skillCycles}</dt><dd>skill cycles</dd></div>
          <div><dt>{PRODUCT_CATALOG_FACTS.learningGames}</dt><dd>learning games</dd></div>
          <div className="lp-landing-stat-note"><dt>Nicknames only</dt><dd>never surnames</dd></div>
        </dl>
      </section>

      {/* ── For children ──────────────────────────────────────────────── */}
      <section className="lp-landing-section" id="for-children" aria-labelledby="landing-children-title">
        <div className="lp-landing-section-head">
          <p className="lp-landing-kicker">For children, ages 4–7</p>
          <h2 id="landing-children-title">It feels like a game. It teaches like a reading lesson.</h2>
          <p className="lp-landing-lede">
            Every session mixes one short skill practice, one book and one adventure — so
            children read every day without being asked twice.
          </p>
        </div>
        <img
          src="/images/pals/poses/meadow-wave.webp"
          alt=""
          className="lp-landing-pal lp-landing-pal-wave"
        />
        <ul className="lp-landing-tiles">
          {FEATURE_TILES.map(tile => (
            <li key={tile.id} className="lp-landing-tile">
              <img src={tile.image} alt="" className="lp-landing-tile-art" loading="lazy" decoding="async" />
              <h3>{tile.title}</h3>
              <p>{tile.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Three worlds ──────────────────────────────────────────────── */}
      <section className="lp-landing-section lp-landing-worlds" id="three-worlds" aria-labelledby="landing-worlds-title">
        <div className="lp-landing-section-head lp-landing-center">
          <p className="lp-landing-kicker">Three worlds, one path</p>
          <h2 id="landing-worlds-title">Children don't move through easy, medium and hard.</h2>
          <p className="lp-landing-lede">
            They travel through three worlds they already know from our books. Levelling
            up means the next world opens.
          </p>
        </div>
        <ul className="lp-landing-world-grid">
          {WORLD_CARDS.map(world => (
            <li key={world.id} className="lp-landing-world" style={{ backgroundImage: `url(${world.panorama})` }}>
              <span className="lp-landing-world-band">
                <img src={world.emblem} alt="" loading="lazy" decoding="async" />
                {world.band}
              </span>
              <h3>{world.name}</h3>
              <p>{world.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── For teachers ──────────────────────────────────────────────── */}
      <section className="lp-landing-section lp-landing-teachers" id="for-teachers" aria-labelledby="landing-teachers-title">
        <div className="lp-landing-section-head">
          <p className="lp-landing-kicker lp-landing-kicker-light">
            <img src={teacherMarkUrl} alt="" className="lp-landing-kicker-mark" />
            {TEACHER_BRAND.endorsedName}
          </p>
          <h2 id="landing-teachers-title">Two clear paths, and you always know where you are.</h2>
          <p className="lp-landing-lede">
            Checks and reports each follow one funnel — pick the class, pick the
            child, pick what you're doing, begin. Refreshing keeps your place.
          </p>
        </div>
        <ul className="lp-landing-steps">
          {TEACHER_STEPS.map(step => (
            <li key={step.number} className="lp-landing-step">
              <span className="lp-landing-step-number" aria-hidden="true">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <span className="lp-landing-chip-row" aria-hidden="true">
                {step.chips.map(chip => (
                  <span key={chip} className="lp-landing-chip">{chip}</span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <div className="lp-landing-setup">
          <div>
            <h3>Set up a class in four steps</h3>
            <p>
              Create your class, add first names or nicknames, choose sign-in pictures,
              do one quick check. Results appear on their own after that.
            </p>
          </div>
          <button type="button" className="lp-landing-cta-button" onClick={onTeacher}>
            Create a free class
          </button>
        </div>
      </section>

      {/* ── Safe by default ───────────────────────────────────────────── */}
      <section className="lp-landing-section lp-landing-safe" aria-labelledby="landing-safe-title">
        <div className="lp-landing-safe-text">
          <p className="lp-landing-kicker">Safe by default</p>
          <h2 id="landing-safe-title">Built for a classroom of five-year-olds.</h2>
          <ul className="lp-landing-safe-list">
            <li>Children sign in with a class code and three pictures — no email, no password to forget.</li>
            <li>Children appear under friendly made-up nicknames. First names or nicknames only, never surnames.</li>
            <li>Every button is a real tap target, every instruction is read aloud, and children only ever see encouragement.</li>
          </ul>
        </div>
        <div className="lp-landing-safe-art" aria-hidden="true">
          <img src="/images/pals/poses/dino-read.webp" alt="" />
          <img src="/images/pals/poses/moonwood-celebrate.webp" alt="" />
        </div>
      </section>

      {/* ── Final call to action ──────────────────────────────────────── */}
      <section className="lp-landing-final" aria-labelledby="landing-final-title">
        <h2 id="landing-final-title">Choose your space and start today.</h2>
        <p>One platform, with the right experience for every reader and teacher.</p>
        <div className="lp-landing-final-actions">
          <button type="button" className="lp-landing-final-child" onClick={onStudent}>
            I'm a child
          </button>
          <button type="button" className="lp-landing-final-teacher" onClick={onTeacher}>
            I'm a teacher
          </button>
        </div>
      </section>

      <footer className="lp-landing-footer">
        <span className="lp-landing-wordmark">
          <img src={teacherMarkUrl} alt="" className="lp-landing-mark" />
          <span className="lp-landing-domain">literacy.guide</span>
        </span>
        <span className="lp-landing-footer-note">
          © 2026 literacy.guide · {CHILD_BRAND.name}
        </span>
        <nav className="lp-landing-legal-links" aria-label="Legal information">
          <a href="/legal.html">Legal</a>
          <a href="/privacy.html">Privacy</a>
          <a href="/terms.html">Terms</a>
          <a href="/cookies.html">Cookies</a>
          <a href="/accessibility.html">Accessibility</a>
        </nav>
      </footer>
    </main>
  );
}
