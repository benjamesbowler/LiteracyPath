import { useState } from "react";

import {
  STUDENT_RAIL_HOME,
  STUDENT_RAIL_ICON_PATHS,
  selectStudentRailItems,
  speakStudentRailLabel
} from "../policy/studentRailPolicy.js";

function RailIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-rail-icon={name}
    >
      <path d={STUDENT_RAIL_ICON_PATHS[name] || STUDENT_RAIL_ICON_PATHS.home} />
    </svg>
  );
}

function HearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7l-4 3H5Z" fill="currentColor" />
      <path d="M15.5 9.5a4 4 0 0 1 0 5M18 7a8 8 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function StudentRailNav({
  active = "home",
  nav = [],
  onHome,
  reducedChoiceMode = false
}) {
  const [speechStatus, setSpeechStatus] = useState("");
  const items = selectStudentRailItems(nav, { active, reducedChoiceMode });
  const destinations = [
    { ...STUDENT_RAIL_HOME, go: active === "home" ? undefined : onHome },
    ...items
  ];

  function hear(label) {
    const spoken = speakStudentRailLabel(label, window);
    setSpeechStatus(spoken ? `${label} spoken.` : `Speech is unavailable. ${label}.`);
  }

  return (
    <nav
      className="hs-nav"
      aria-label="Places to play"
      data-choice-mode={reducedChoiceMode ? "reduced" : "full"}
    >
      {destinations.map(item => {
        const isActive = active === item.id;
        return (
          <span className="hs-nav-item" key={item.id} data-rail-destination={item.id}>
            <button
              type="button"
              className={`hs-nav-destination${isActive ? " is-active" : ""}`}
              onClick={isActive ? undefined : item.go}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              <RailIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
            <button
              type="button"
              className="hs-nav-hear"
              aria-label={`Hear ${item.label}`}
              onClick={() => hear(item.label)}
            >
              <HearIcon />
            </button>
          </span>
        );
      })}
      <span className="hs-nav-status" role="status" aria-live="polite">{speechStatus}</span>
    </nav>
  );
}
