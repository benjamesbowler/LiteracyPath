import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle,
  GameController,
  GridNine,
  LockSimple,
  SpeakerHigh,
  SquaresFour
} from "@phosphor-icons/react";
import StudentGlassShell from "../../components/StudentGlassShell.jsx";
import { SubjectSwitch } from "../../components/SubjectSwitch.jsx";
import { SUBJECT_IDS } from "../../subjects/subjectRegistry.js";
import { MathsAudioButton } from "../media/MathsAudioButton.jsx";
import "../../styles/maths-platform.css";
import "../../styles/maths-platform-v2.css";

const ACTIVITY_META = Object.freeze({
  lesson: Object.freeze({ label: "Guided lesson", action: "Continue lesson", Icon: SquaresFour }),
  skills_check: Object.freeze({ label: "Skills check", action: "Start check", Icon: CheckCircle }),
  game: Object.freeze({ label: "Arcade mission", action: "Play mission", Icon: GameController }),
  number_story: Object.freeze({ label: "Number story", action: "Read story", Icon: BookOpenText })
});

function dueLabel(assignment, renderedAt) {
  if (!assignment?.dueAt) return "Ready when you are";
  const due = new Date(assignment.dueAt);
  if (Number.isNaN(due.getTime())) return "Ready when you are";
  const overdue = due.getTime() < renderedAt;
  return `${overdue ? "Ready to finish · due " : "Due "}${due.toLocaleDateString()}`;
}

function HomeDestination({ className, title, description, action, Icon, onOpen }) {
  return (
    <button className={`maths-destination ${className}`} onClick={onOpen} type="button">
      <span className="maths-destination-icon" aria-hidden="true"><Icon size={28} weight="duotone" /></span>
      <span className="maths-destination-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="maths-destination-action">{action}<ArrowRight aria-hidden="true" size={18} weight="bold" /></span>
    </button>
  );
}

export function MathsHome({ studentName = "Mathematician", progressScopeKey = "default", client, token = "", onOpenLiteracy, onOpenLearn, onOpenAssessment, onOpenStories, onOpenArcade }) {
  const [assignments, setAssignments] = useState([]);
  const [assignmentState, setAssignmentState] = useState(token ? "loading" : "unavailable");
  const [loadVersion, setLoadVersion] = useState(0);
  const [renderedAt] = useState(() => Date.now());
  useEffect(() => {
    let current = true;
    if (!client?.call || !token) return undefined;
    Promise.resolve()
      .then(() => client.call("student_list_maths_assignments", { p_token: token }))
      .then(({ data, error }) => {
        if (!current) return;
        if (error || !data?.ok) throw error || new Error(data?.error || "assignment_read_failed");
        setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        setAssignmentState("ready");
      })
      .catch(() => { if (current) setAssignmentState("error"); });
    return () => { current = false; };
  }, [client, loadVersion, token]);

  const openAssignment = assignment => ({
    lesson: onOpenLearn,
    skills_check: onOpenAssessment,
    game: onOpenArcade,
    number_story: onOpenStories
  }[assignment.activityType]?.(assignment));
  const pending = assignments.filter(assignment => !assignment.completedAt);
  const completedToday = assignments.filter(assignment => assignment.completedAt && new Date(assignment.completedAt).toDateString() === new Date(renderedAt).toDateString());
  const recommended = pending[0] || null;
  const recommendedMeta = recommended ? ACTIVITY_META[recommended.activityType] || ACTIVITY_META.lesson : ACTIVITY_META.lesson;
  const RecommendedIcon = recommendedMeta.Icon;

  return (
    <StudentGlassShell
      studentName={studentName}
      scopeKey={progressScopeKey}
      active="maths"
      tabs={[]}
      showWallet={false}
      showGrownUps={false}
      onHome={onOpenLiteracy}
      headerActions={<SubjectSwitch activeSubject={SUBJECT_IDS.MATHS} onSelectSubject={subjectId => { if (subjectId === SUBJECT_IDS.LITERACY) onOpenLiteracy?.(); }} variant="child" />}
    >
      <div className="maths-home-v2" data-child-surface="maths-home">
        <section className="maths-home-hero">
          <div className="maths-home-hero-copy">
            <p className="maths-eyebrow">Your Maths place</p>
            <h1 data-child-title>Ready to make sense of numbers, {studentName}?</h1>
            <div className="maths-home-spoken-intro"><p data-child-instruction>Move it. See it. Explain it.</p><MathsAudioButton client={client} compact label="Hear the Maths choices" requestId="maths-home:intro" token={token} /></div>
            <div className="maths-recommended-card" data-child-choices data-child-progress>
              <span className="maths-recommended-icon" aria-hidden="true"><RecommendedIcon size={30} weight="duotone" /></span>
              <span>
                <small>{recommended ? `From your teacher · ${recommendedMeta.label}` : "Recommended next · Guided lesson"}</small>
                <strong>{recommended?.title || "Build a number on the trail"}</strong>
                <em>{recommended ? dueLabel(recommended, renderedAt) : "Seven calm steps · stop after the check"}</em>
              </span>
              <button
                className="maths-primary"
                data-child-emphasis="primary"
                data-child-emphasis-cue
                data-child-primary
                onClick={() => recommended ? openAssignment(recommended) : onOpenLearn?.(null)}
                type="button"
              >
                {recommendedMeta.action}<ArrowRight aria-hidden="true" size={20} weight="bold" />
              </button>
            </div>
            {assignmentState === "loading" && <p className="maths-home-inline-state" role="status">Checking today’s teacher activities…</p>}
            {assignmentState === "error" && (
              <div className="maths-home-inline-state is-error" role="alert">
                <span>Teacher activities could not load. Every practice area still works.</span>
                <button onClick={() => { setAssignmentState("loading"); setLoadVersion(value => value + 1); }} type="button">Try again</button>
              </div>
            )}
            {recommended && pending.length > 1 && <p className="maths-home-inline-state">{pending.length - 1} more teacher {pending.length === 2 ? "activity" : "activities"} waiting after this one.</p>}
            {completedToday.length > 0 && <p className="maths-home-inline-state is-finished"><CheckCircle aria-hidden="true" size={18} weight="fill" /> {completedToday.length} finished today</p>}
          </div>
          <div className="maths-home-world" aria-hidden="true">
            <div className="maths-home-sun" />
            <div className="maths-home-cloud is-one" />
            <div className="maths-home-cloud is-two" />
            <div className="maths-home-frame">
              {Array.from({ length: 10 }, (_, index) => <span className={index < 7 ? "is-filled" : ""} key={index} />)}
            </div>
            <img alt="" src="/images/companions/fluff.webp" />
            <strong>7</strong>
          </div>
        </section>

        <section className="maths-home-journey" aria-labelledby="maths-choose-title">
          <header><p className="maths-eyebrow">Choose your way to practise</p><h2 id="maths-choose-title">Where shall we go?</h2></header>
          <div className="maths-destination-grid" data-child-choices>
            <HomeDestination action="Learn" className="is-learn" description="Build and explain with counters and frames" Icon={GridNine} onOpen={() => onOpenLearn?.(null)} title="Guided lesson" />
            <HomeDestination action="Show" className="is-check" description="Six calm decisions for your teacher" Icon={CheckCircle} onOpen={() => onOpenAssessment?.(null)} title="Skills check" />
            <HomeDestination action="Read" className="is-story" description="Follow a quantity through a real story" Icon={BookOpenText} onOpen={() => onOpenStories?.(null)} title="Number stories" />
            <HomeDestination action="Play" className="is-arcade" description="Move, build and compare in full game worlds" Icon={GameController} onOpen={() => onOpenArcade?.(null)} title="Maths Arcade" />
          </div>
        </section>

        <footer className="maths-home-trust">
          <span><LockSimple aria-hidden="true" size={17} weight="fill" /> No child voice or image recording</span>
          <span><SpeakerHigh aria-hidden="true" size={17} weight="fill" /> Tap audio when you want the words read</span>
        </footer>
      </div>
    </StudentGlassShell>
  );
}
