export function AssessmentShell({ children, className = "" }) {
  return (
    <main className={["assessment-shell", className].filter(Boolean).join(" ")}>
      {children}
    </main>
  );
}
