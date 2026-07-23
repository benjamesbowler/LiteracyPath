import { CHILD_BRAND } from "../data/childBrand.js";
import { TEACHER_BRAND } from "../data/teacherBrand.js";
import teacherMarkUrl from "../assets/logomark.svg";

export function StudentEntryPage({ onStudent, onTeacher }) {
  return (
    <main className="student-entry-page pals-entry">
      <section className="student-entry-hero" aria-labelledby="entry-gateway-title">
        <header className="entry-gateway-intro">
          <p className="entry-gateway-domain">literacy.guide</p>
          <h1 id="entry-gateway-title">Choose your space</h1>
          <p>One platform, with the right experience for every reader and teacher.</p>
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
              Students: {CHILD_BRAND.name}
            </span>
            <span className="entry-card-brand entry-student-brand" aria-hidden="true">
              <img
                src={CHILD_BRAND.logoPath}
                alt=""
                className="entry-brand-logo entry-student-logo"
              />
            </span>
            <span className="student-entry-card-text" id="student-entry-description">
              Books, games and guided adventures made for young readers.
            </span>
            <span className="student-entry-card-cta pals-cta">Students</span>
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
              Assessment, planning, teaching resources and progress, all in one place.
            </span>
            <span className="student-entry-card-cta pals-cta">Teachers</span>
          </button>
        </div>
      </section>
    </main>
  );
}
