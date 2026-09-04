import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SoundSeekersV3 from "./v3/SoundSeekersV3.jsx";
import { loadV3Progress, saveV3Progress } from "./v3/storage.js";

const EMPTY_ACCESSIBILITY_SETTINGS = Object.freeze({});
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function visibleFocusTargets(host) {
  const view = host.ownerDocument.defaultView;
  return [...host.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element => {
    if (element.tabIndex < 0 || element.matches(":disabled")
      || element.closest("[hidden], [inert], [aria-hidden='true']")) return false;
    const style = view?.getComputedStyle(element);
    return style?.display !== "none" && style?.visibility !== "hidden"
      && element.getClientRects().length > 0;
  });
}

function focusRouteSurface(host) {
  const surface = host.querySelector("[data-sound-seekers-game][aria-label], .ss3 button, .ss3 h1");
  if (surface && typeof surface.focus === "function") {
    surface.focus({ preventScroll: true });
  }
}

function restoreAttribute(element, name, value) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function isolateSibling(element) {
  const snapshot = Object.freeze({
    element,
    ariaHidden: element.getAttribute("aria-hidden"),
    inertAttribute: element.getAttribute("inert"),
    inertSupported: "inert" in element,
    inertProperty: "inert" in element ? element.inert : undefined
  });
  element.setAttribute("aria-hidden", "true");
  if (snapshot.inertSupported) element.inert = true;
  else element.setAttribute("inert", "");
  return snapshot;
}

function restoreSibling(snapshot) {
  restoreAttribute(snapshot.element, "aria-hidden", snapshot.ariaHidden);
  if (snapshot.inertSupported) snapshot.element.inert = snapshot.inertProperty;
  restoreAttribute(snapshot.element, "inert", snapshot.inertAttribute);
}

export default function SoundSeekersRoute({
  progressScopeKey,
  isSoundEnabled = true,
  onExit,
  initialFixtureId = null,
  accessibilitySettings = EMPTY_ACCESSIBILITY_SETTINGS
}) {
  if (typeof progressScopeKey !== "string" || !progressScopeKey.trim()
    || typeof isSoundEnabled !== "boolean" || typeof onExit !== "function"
    || (initialFixtureId !== null && (typeof initialFixtureId !== "string" || !initialFixtureId.trim()))
    || !accessibilitySettings || typeof accessibilitySettings !== "object"
    || Array.isArray(accessibilitySettings)) {
    throw new TypeError("Sound Seekers route props are invalid");
  }
  const [portalHost, setPortalHost] = useState(null);
  const returnFocusRef = useRef(
    typeof document !== "undefined" && typeof document.activeElement?.focus === "function"
      ? document.activeElement
      : null
  );

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return undefined;
    const ownerDocument = document;
    const body = ownerDocument.body;
    const returnFocusTarget = returnFocusRef.current;
    const siblingSnapshots = [...body.children].map(isolateSibling);
    const previousBodyOverflow = Object.freeze({
      value: body.style.getPropertyValue("overflow"),
      priority: body.style.getPropertyPriority("overflow")
    });
    const host = ownerDocument.createElement("div");
    host.setAttribute("data-sound-seekers-route-portal", "");
    body.append(host);
    body.style.setProperty("overflow", "hidden", "important");

    function keepTabInside(event) {
      if (event.defaultPrevented || event.key !== "Tab" || !host.isConnected) return;
      const targets = visibleFocusTargets(host);
      const active = ownerDocument.activeElement;
      if (!targets.length) {
        event.preventDefault();
        focusRouteSurface(host);
        return;
      }
      const first = targets[0];
      const last = targets.at(-1);
      if (!host.contains(active) || !targets.includes(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    ownerDocument.addEventListener("keydown", keepTabInside);
    let active = true;
    queueMicrotask(() => {
      if (active && host.isConnected) setPortalHost(host);
    });

    return () => {
      active = false;
      ownerDocument.removeEventListener("keydown", keepTabInside);
      host.remove();
      for (const snapshot of siblingSnapshots) restoreSibling(snapshot);
      if (previousBodyOverflow.value) {
        body.style.setProperty("overflow", previousBodyOverflow.value, previousBodyOverflow.priority);
      } else {
        body.style.removeProperty("overflow");
      }
      if (returnFocusTarget?.isConnected && typeof returnFocusTarget.focus === "function") {
        returnFocusTarget.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (!portalHost?.isConnected) return;
    focusRouteSurface(portalHost);
  }, [portalHost]);

  const leave = useCallback(() => {
    onExit();
  }, [onExit]);

  // v3 "Story Trail" (2026-09-04) replaces the v2 DOM game. The v2 engine stays
  // on disk for the zero-reference cleanup pass; nothing here imports it.
  const game = (
    <SoundSeekersV3
      progressScopeKey={progressScopeKey}
      isSoundEnabled={isSoundEnabled}
      onExit={leave}
      accessibilitySettings={accessibilitySettings}
      loadProgress={loadV3Progress}
      saveProgress={saveV3Progress}
      initialStopId={initialFixtureId && /^s\d+$/.test(initialFixtureId) ? initialFixtureId : null}
    />
  );
  return portalHost ? createPortal(game, portalHost) : null;
}
