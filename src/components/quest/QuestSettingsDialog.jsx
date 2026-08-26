import { useEffect, useRef, useState } from "react";

export default function QuestSettingsDialog({
  open,
  triggerRef,
  settings,
  onSettingChange,
  onResetCharacter,
  onResetProgress,
  onClose
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const wasOpenRef = useRef(false);
  const [fallback, setFallback] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    let focusFrame = 0;
    const supportsNativeModal = (
      typeof dialog.showModal === "function"
      && typeof dialog.close === "function"
    );

    if (open) {
      wasOpenRef.current = true;
      let useFallback = !supportsNativeModal;
      if (!useFallback && !dialog.open) {
        try {
          dialog.showModal();
        } catch {
          useFallback = true;
        }
      }
      if (useFallback) {
        dialog.setAttribute("open", "");
        dialog.dataset.fallbackModal = "true";
      } else {
        delete dialog.dataset.fallbackModal;
      }
      setFallback(useFallback);
      focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      const wasFallback = dialog.dataset.fallbackModal === "true";
      if (dialog.open || dialog.hasAttribute("open")) {
        if (!wasFallback && typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
      }
      delete dialog.dataset.fallbackModal;
      setFallback(false);
      setConfirmingReset(false);
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        focusFrame = window.requestAnimationFrame(() => triggerRef?.current?.focus());
      }
    }

    return () => window.cancelAnimationFrame(focusFrame);
  }, [open, triggerRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const root = dialog?.closest(".q-root");
    if (!root || !open || !fallback) return undefined;
    const siblings = [...root.children].filter(child => (
      child !== dialog && !child.classList.contains("q-settings-fallback-backdrop")
    ));
    for (const sibling of siblings) {
      sibling.setAttribute("inert", "");
      sibling.setAttribute("aria-hidden", "true");
    }
    return () => {
      for (const sibling of siblings) {
        sibling.removeAttribute("inert");
        sibling.removeAttribute("aria-hidden");
      }
    };
  }, [fallback, open]);

  const containFocus = event => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = [...(dialogRef.current?.querySelectorAll(
      "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
    ) || [])];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (!dialogRef.current?.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const resetCharacter = () => {
    setConfirmingReset(false);
    onResetCharacter?.();
  };

  const resetProgress = () => {
    setConfirmingReset(false);
    onResetProgress?.();
  };

  return (
    <>
      {open && fallback && <div className="q-settings-fallback-backdrop" aria-hidden="true" />}
      <dialog
        ref={dialogRef}
        className="q-settings-dialog"
        open={open && fallback ? true : undefined}
        data-fallback-modal={open && fallback ? "true" : undefined}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-labelledby="q-settings-title"
        onClose={onClose}
        onCancel={event => { event.preventDefault(); onClose?.(); }}
        onKeyDown={containFocus}
      >
        <div className="q-settings-head">
          <div>
            <span>For this device</span>
            <h2 id="q-settings-title">Display, sound and access</h2>
          </div>
          <button ref={closeRef} type="button" className="q-settings-close" onClick={onClose} aria-label="Close settings">Close</button>
        </div>
        <p>Choose the most comfortable way to play.</p>
        <fieldset className="q-accessibility-options">
          <legend>Comfort</legend>
          <label><input type="checkbox" checked={Boolean(settings?.reducedMotion)} onChange={event => onSettingChange?.("reducedMotion", event.target.checked)} />Reduce motion</label>
          <label><input type="checkbox" checked={Boolean(settings?.highContrast)} onChange={event => onSettingChange?.("highContrast", event.target.checked)} />High contrast</label>
          <label><input type="checkbox" checked={settings?.musicEnabled !== false} onChange={event => onSettingChange?.("musicEnabled", event.target.checked)} />Music on (spoken audio stays on)</label>
          <label><input type="checkbox" checked={settings?.soundEnabled !== false} onChange={event => onSettingChange?.("soundEnabled", event.target.checked)} />Spoken audio and game sounds on</label>
        </fieldset>

        <fieldset className="q-reset-options">
          <legend>Start again</legend>
          <button type="button" className="q-ghost q-reset-creature" onClick={resetCharacter}>
            Choose a new book character
          </button>
          <small>Your sounds, stones and stars all stay.</small>

          {confirmingReset ? (
            <div className="q-reset-confirm" role="group" aria-label="Confirm starting over">
              <strong>Start the whole adventure again?</strong>
              <small>Your stones, stars and book character go back to the beginning. This cannot be undone.</small>
              <div className="q-reset-confirm-actions">
                <button type="button" className="q-ghost" onClick={() => setConfirmingReset(false)}>No, keep going</button>
                <button type="button" className="q-danger" onClick={resetProgress}>Yes, start again</button>
              </div>
            </div>
          ) : (
            <button type="button" className="q-ghost q-reset-progress" onClick={() => setConfirmingReset(true)}>
              Start the adventure again
            </button>
          )}
        </fieldset>

        <button type="button" className="q-primary q-settings-done" onClick={onClose}>Done</button>
      </dialog>
    </>
  );
}
