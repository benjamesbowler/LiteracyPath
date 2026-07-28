export const ACCESSIBILITY_SAVE_ERROR =
  "We couldn't save these accessibility settings. Nothing changed. Review the choices and try again.";

export async function runAccessibilitySave({ onSave, student, draft } = {}) {
  try {
    const saved = await onSave?.(student, draft);
    return saved === true
      ? { ok: true, error: "" }
      : { ok: false, error: ACCESSIBILITY_SAVE_ERROR };
  } catch {
    return { ok: false, error: ACCESSIBILITY_SAVE_ERROR };
  }
}
