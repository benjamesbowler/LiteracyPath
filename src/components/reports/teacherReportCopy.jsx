export function teacherReportText(value) {
  if (typeof value !== "string") return value;
  const preserveLeadingCase = (source, replacement) => (
    /^[A-Z]/.test(source)
      ? `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`
      : replacement
  );
  return value
    .replace(/\bcheck again\b/gi, match => preserveLeadingCase(match, "review again"))
    .replace(/\bcheck the\b/gi, match => preserveLeadingCase(match, "review the"))
    .replace(/\bchecks?\b/gi, match => preserveLeadingCase(
      match,
      match.toLowerCase().endsWith("s") ? "assessments" : "assessment"
    ))
    .replace(/\b(?:child|children)\b/gi, match => preserveLeadingCase(
      match,
      match.toLowerCase() === "children" ? "students" : "student"
    ))
    .replace(/\blearners?\b/gi, match => preserveLeadingCase(
      match,
      match.toLowerCase().endsWith("s") ? "students" : "student"
    ));
}
