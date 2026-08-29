import { useEffect, useRef, useState } from "react";

import { STUDENT_RAIL_ICON_PATHS } from "../policy/studentRailPolicy.js";

const GUIDE_STEPS = Object.freeze([
  Object.freeze({
    id: "start",
    title: "Your best next step",
    body: "The big Play button shows you a good place to start."
  }),
  Object.freeze({
    id: "choose",
    title: "You can choose, too",
    body: "Tap a picture card, or use the buttons at the bottom to go somewhere else."
  }),
  Object.freeze({
    id: "help",
    title: "Help is always here",
    body: "Tap a speaker to hear words. Tap Help whenever you want to see this tour again."
  })
]);

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function GuideIcon({ name }) {
  return (
    <svg className="kg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={STUDENT_RAIL_ICON_PATHS[name] || STUDENT_RAIL_ICON_PATHS.home} />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" fill="currentColor" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9.4 8.4a3 3 0 1 1 4.2 2.75c-1.25.62-1.6 1.15-1.6 2.35" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="17.4" r="1.2" fill="currentColor" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 9.5v5h3.6l4.4 3.4V6.1L8.6 9.5H5Z" fill="currentColor" />
      <path d="M16.4 9a4.6 4.6 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StepPicture({ companion, step }) {
  return (
    <div className="kg-welcome-picture" data-guide-picture={step.id} aria-hidden="true">
      {step.id === "start" && (
        <span className="kg-welcome-play-picture"><PlayIcon /></span>
      )}
      {step.id === "choose" && (
        <span className="kg-welcome-place-pictures">
          {["soundWaves", "book", "arcade", "hollow"].map(name => (
            <span key={name}><GuideIcon name={name} /></span>
          ))}
        </span>
      )}
      {step.id === "help" && (
        <span className="kg-welcome-help-pictures">
          <span><SpeakerIcon /></span>
          <span><QuestionIcon /></span>
        </span>
      )}
      {companion?.image && (
        <img className="kg-welcome-companion" src={companion.image} alt="" />
      )}
    </div>
  );
}

function backgroundElements(dialog) {
  const main = dialog.closest(".kg-main");
  const stage = dialog.closest(".kg-stage");
  if (!main || !stage) return [];
  return [
    ...[...stage.children].filter(element => element !== main),
    ...[...main.children].filter(element => element !== dialog)
  ];
}

export function StudentWelcomeGuide({
  companion,
  onClose,
  onHear,
  studentName
}) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [stepIndex, setStepIndex] = useState(0);
  const step = GUIDE_STEPS[stepIndex];
  const finalStep = stepIndex === GUIDE_STEPS.length - 1;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previouslyFocused = document.activeElement;
    const background = backgroundElements(dialog).map(element => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden")
    }));
    background.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    titleRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (!controls.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls.at(-1).focus();
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault();
        controls[0].focus();
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      background.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  useEffect(() => {
    titleRef.current?.focus();
  }, [stepIndex]);

  const spokenText = stepIndex === 0
    ? `Welcome, ${studentName || "reader"}. ${step.title}. ${step.body}`
    : `${step.title}. ${step.body}`;

  return (
    <div
      ref={dialogRef}
      className="kg-welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kg-welcome-title"
      aria-describedby="kg-welcome-body"
      data-student-welcome-guide=""
      tabIndex={-1}
    >
      <section className="kg-welcome-card kg-glass kg-glass--strong">
        <header className="kg-welcome-card-head">
          <span className="kg-welcome-progress" aria-label={`Step ${stepIndex + 1} of ${GUIDE_STEPS.length}`}>
            {GUIDE_STEPS.map((item, index) => (
              <span key={item.id} className={index === stepIndex ? "is-current" : ""} aria-hidden="true" />
            ))}
          </span>
          <button className="kg-welcome-skip" type="button" onClick={onClose}>
            Skip for now
          </button>
        </header>

        <div className="kg-welcome-card-body">
          <StepPicture companion={companion} step={step} />
          <div className="kg-welcome-copy">
            {stepIndex === 0 && <p className="kg-welcome-kicker">Welcome, {studentName || "reader"}!</p>}
            <h2 id="kg-welcome-title" ref={titleRef} tabIndex={-1}>{step.title}</h2>
            <p id="kg-welcome-body">{step.body}</p>
            {onHear && (
              <button
                className="kg-welcome-hear"
                type="button"
                aria-label="Hear this help"
                onClick={() => onHear(spokenText)}
              >
                <SpeakerIcon />
                Hear this
              </button>
            )}
          </div>
        </div>

        <footer className="kg-welcome-actions">
          <button
            className="kg-welcome-back"
            type="button"
            onClick={() => setStepIndex(index => Math.max(0, index - 1))}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button
            className="kg-welcome-next"
            type="button"
            onClick={() => {
              if (finalStep) onClose?.();
              else setStepIndex(index => index + 1);
            }}
          >
            {finalStep ? "Let’s go" : "Next"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export function StudentHelpReminder({ onDismiss, onShowGuide }) {
  return (
    <aside
      className="kg-help-reminder kg-glass kg-glass--strong"
      role="dialog"
      aria-modal="false"
      aria-labelledby="kg-help-reminder-title"
      data-student-help-reminder=""
    >
      <span className="kg-help-reminder-icon" aria-hidden="true"><QuestionIcon /></span>
      <div>
        <strong id="kg-help-reminder-title">Want a quick tour?</strong>
        <span>I can show you where to go.</span>
      </div>
      <button type="button" className="kg-help-reminder-show" onClick={onShowGuide}>Show me</button>
      <button type="button" className="kg-help-reminder-dismiss" onClick={onDismiss}>Not now</button>
    </aside>
  );
}
