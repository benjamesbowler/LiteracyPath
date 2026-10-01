export function AssessmentShell({ children, className = "", onPointerDownCapture }) {
  return (
    <main onPointerDownCapture={onPointerDownCapture} className={["assessment-shell", className].filter(Boolean).join(" ")}>
      {children}
    </main>
  );
}
