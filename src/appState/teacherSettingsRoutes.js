const TEACHER_SETTINGS_SECTION_IDS = new Set([
  "school",
  "site",
  "privacy",
  "account"
]);

export function canonicalTeacherSettingsRoutePath(path = "") {
  const normalized = String(path || "").replace(/^#/, "").split("?")[0];
  if (normalized === "teacher/settings") return normalized;
  const section = normalized.match(/^teacher\/settings\/([^/]+)$/)?.[1] || "";
  return TEACHER_SETTINGS_SECTION_IDS.has(section)
    ? "teacher/settings"
    : normalized;
}

export function readTeacherSettingsSection(hash = "") {
  const path = String(hash || "").replace(/^#/, "").split("?")[0];
  const section = path.match(/^teacher\/settings\/([^/]+)$/)?.[1] || "school";
  return TEACHER_SETTINGS_SECTION_IDS.has(section) ? section : "school";
}

// The v2 Settings screen lands on a grid of cards, not on a section, so it needs
// a different question answered: "does this URL name a section at all?".
// `readTeacherSettingsSection` keeps its old contract (which section does this
// hash MEAN — School when it names none) because that safe-landing behaviour is
// what `canonicalTeacherSettingsRoutePath` and the app-level URL mirror rely on.
export function readTeacherSettingsOpenSection(hash = "") {
  const path = String(hash || "").replace(/^#/, "").split("?")[0];
  const section = path.match(/^teacher\/settings\/([^/]+)$/)?.[1] || "";
  return TEACHER_SETTINGS_SECTION_IDS.has(section) ? section : "";
}

export function teacherSettingsHash(section, classId = "") {
  const query = new URLSearchParams();
  if (classId) query.set("class", classId);
  const suffix = query.size ? `?${query.toString()}` : "";
  // No section at all means the card overview, whose address is the bare Settings
  // route. A section that is merely unrecognised is still corrected to School,
  // so a bad name can never be read as "the teacher asked for the overview".
  if (!section) return `#teacher/settings${suffix}`;
  const safeSection = TEACHER_SETTINGS_SECTION_IDS.has(section) ? section : "school";
  return `#teacher/settings/${safeSection}${suffix}`;
}
