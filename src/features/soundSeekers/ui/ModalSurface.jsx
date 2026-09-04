import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function visibleFocusTargets(dialog) {
  const view = dialog.ownerDocument.defaultView;
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element => {
    if (element.closest("[hidden], [aria-hidden='true']")) return false;
    const style = view?.getComputedStyle(element);
    return style?.display !== "none" && style?.visibility !== "hidden"
      && element.getClientRects().length > 0;
  });
}

function focusFirst(dialog) {
  const preferred = dialog.querySelector("[data-ss-modal-initial-focus]");
  const target = preferred && visibleFocusTargets(dialog).includes(preferred)
    ? preferred
    : visibleFocusTargets(dialog)[0] || dialog;
  target.focus({ preventScroll: true });
}

export function ModalSurface({ labelledBy, className = "", onClose, children }) {
  if (typeof labelledBy !== "string" || !labelledBy.trim()
    || typeof className !== "string" || typeof onClose !== "function") {
    throw new TypeError("Sound Seekers modal needs a label, class name, and close action");
  }
  const layerRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const layer = layerRef.current;
    const dialog = dialogRef.current;
    if (!layer || !dialog) return undefined;
    const document = dialog.ownerDocument;
    const previousFocus = document.activeElement;
    const background = [...(layer.parentElement?.children || [])]
      .filter(element => element !== layer)
      .map(element => ({
        element,
        ariaHidden: element.getAttribute("aria-hidden"),
        inert: element.hasAttribute("inert")
      }));
    const scrollingRoot = layer.closest(".sound-seekers-v2");
    const previousOverflow = scrollingRoot?.style.overflow ?? "";

    for (const entry of background) {
      entry.element.setAttribute("aria-hidden", "true");
      entry.element.setAttribute("inert", "");
    }
    if (scrollingRoot) scrollingRoot.style.overflow = "hidden";

    const keepFocusInside = event => {
      if (!dialog.contains(event.target)) focusFirst(dialog);
    };
    document.addEventListener("focusin", keepFocusInside);
    focusFirst(dialog);

    return () => {
      document.removeEventListener("focusin", keepFocusInside);
      for (const entry of background) {
        if (entry.ariaHidden === null) entry.element.removeAttribute("aria-hidden");
        else entry.element.setAttribute("aria-hidden", entry.ariaHidden);
        if (entry.inert) entry.element.setAttribute("inert", "");
        else entry.element.removeAttribute("inert");
      }
      if (scrollingRoot) scrollingRoot.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && typeof previousFocus.focus === "function") {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const targets = visibleFocusTargets(dialog);
    if (!targets.length) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }
    const first = targets[0];
    const last = targets.at(-1);
    const active = dialog.ownerDocument.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  return (
    <div
      ref={layerRef}
      className="ss-modal-layer"
      data-sound-seekers-modal-layer=""
      role="presentation"
    >
      <section
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {children}
      </section>
    </div>
  );
}

export default ModalSurface;
