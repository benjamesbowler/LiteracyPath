import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function focusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter(element =>
      !element.hasAttribute("hidden")
      && element.getAttribute("aria-hidden") !== "true"
    );
}

export function TeacherDialog({
  open = true,
  label,
  labelledBy,
  className = "",
  onClose,
  closeOnEscape = true,
  trapFocus = true,
  modal = true,
  children
}) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const preferred = dialog.querySelector("[data-autofocus]");
    const first = focusableElements(dialog)[0];
    (preferred || first || dialog).focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && closeOnEscape && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !trapFocus) return;
      const candidates = focusableElements(dialog);
      if (!candidates.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const firstCandidate = candidates[0];
      const lastCandidate = candidates.at(-1);
      if (event.shiftKey && document.activeElement === firstCandidate) {
        event.preventDefault();
        lastCandidate.focus();
      } else if (!event.shiftKey && document.activeElement === lastCandidate) {
        event.preventDefault();
        firstCandidate.focus();
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [closeOnEscape, open, trapFocus]);

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      className={className}
      role="dialog"
      aria-modal={modal ? "true" : "false"}
      aria-label={label}
      aria-labelledby={labelledBy}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

export function TeacherDrawer({
  label,
  className = "teacher-learner-drawer-dialog",
  onClose,
  children
}) {
  return (
    <TeacherDialog
      className={className}
      label={label}
      modal={false}
      onClose={onClose}
      trapFocus={false}
    >
      {children}
    </TeacherDialog>
  );
}

export function TeacherModal({
  className = "",
  ...props
}) {
  return (
    <TeacherDialog
      className={["symbol-password-modal", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
