export function ChoiceGrid({ children, className = "" }) {
  return (
    <div className={["choices assessment-answer-grid", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
