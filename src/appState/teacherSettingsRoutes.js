const TEACHER_SETTINGS_SECTION_IDS = new Set([
  "school",
  "site",
  "privacy",
  "account"
]);

export function readTeacherSettingsSection(hash = "") {
  const path = String(hash || "").replace(/^#/, "").split("?")[0];
  const section = path.match(/^teacher\/settings\/([^/]+)$/)?.[1] || "school";
  return TEACHER_SETTINGS_SECTION_IDS.has(section) ? section : "school";
}

export function teacherSettingsHash(section, classId = "") {
  const safeSection = TEACHER_SETTINGS_SECTION_IDS.has(section) ? section : "school";
  const query = new URLSearchParams();
  if (classId) query.set("class", classId);
  return `#teacher/settings/${safeSection}${query.size ? `?${query.toString()}` : ""}`;
}
