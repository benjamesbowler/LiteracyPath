import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Escape the scaled child stage and its header/navigation stacking contexts.
export function ImmersiveReader({ active, children }) {
  const host = useRef(null);
  useEffect(() => {
    if (!active) return undefined;
    const previousFocus = document.activeElement;
    const root = document.getElementById("root");
    const wasInert = root?.inert;
    const overflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    const controls = () => [...host.current.querySelectorAll("button:not(:disabled), summary, [tabindex='0']")]
      .filter(node => node.getClientRects().length && !node.closest("[inert]"));
    controls()[0]?.focus({ preventScroll: true });
    const containFocus = event => {
      if (event.key !== "Tab") return;
      const nodes = controls();
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (document.activeElement === first || !host.current.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !host.current.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener("keydown", containFocus);
    return () => {
      document.removeEventListener("keydown", containFocus);
      if (root) root.inert = wasInert;
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [active]);
  if (!active) return children;
  return createPortal(<div ref={host} className="guided-reading-reader-open guided-immersive-reader student-guided-reading-page">{children}</div>, document.body);
}
