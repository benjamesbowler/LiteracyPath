import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import WoodlandChapter from "./WoodlandChapter.jsx";
import RoundedCampaign from "./rounded/RoundedCampaign.jsx";
import { warmQuestOfflineExecutable } from "../../utils/offlineShell.js";
import { woodlandChapterStorageKey } from "../../utils/progressKeys.js";
import { readChapterSaveResult } from "../../../demos/sound-seekers/src/chapter/storage.js";
import { woodlandReturn } from "./soundSeekersEntry.js";

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
  const surface = host.querySelector("[data-sound-seekers-game][aria-label]");
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
  ephemeral = false,
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
  useEffect(() => { void warmQuestOfflineExecutable(); }, []);
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
    // Keep the isolated game above the underlying app's floating navigation.
    Object.assign(host.style, { position: "fixed", inset: "0", zIndex: "1000" });
    body.append(host);
    body.style.setProperty("overflow", "hidden", "important");

    function keepTabInside(event) {
      if (event.defaultPrevented || event.key !== "Tab" || !host.isConnected) return;
      const targets = visibleFocusTargets(host);
      const active = ownerDocument.activeElement;
      // The chapter's modal owns its own Tab cycle. Moving focus here first
      // would make its handler process the same keystroke a second time.
      const modal = active?.closest('[role="dialog"][aria-modal="true"]');
      if (modal && host.contains(modal)) return;
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

  const leave = useCallback(() => {
    onExit();
  }, [onExit]);

  return portalHost ? createPortal(
    <SoundSeekersJourneys key={progressScopeKey} {...{ portalHost, progressScopeKey, isSoundEnabled, ephemeral, accessibilitySettings, leave }} />,
    portalHost
  ) : null;
}

function SoundSeekersJourneys({ portalHost, progressScopeKey, isSoundEnabled, ephemeral, accessibilitySettings, leave }) {
  const [journey, setJourney] = useState('campaign');
  const [getStorage] = useState(() => {
    if (!ephemeral) return () => window.localStorage;
    // Try sessions share their two checkpoints only within this visit.
    const bytes = new Map();
    const memory = {
      getItem: key => bytes.get(key) ?? null,
      setItem: (key, value) => bytes.set(key, value),
      removeItem: key => bytes.delete(key)
    };
    return () => memory;
  });
  const woodlandKey = woodlandChapterStorageKey(progressScopeKey);
  const [woodland, setWoodland] = useState(() => woodlandReturn(readChapterSaveResult(woodlandKey, getStorage)));
  const refreshWoodland = useCallback(() => setWoodland(woodlandReturn(readChapterSaveResult(woodlandKey, getStorage))), [getStorage, woodlandKey]);

  useEffect(() => {
    if (ephemeral) return undefined;
    const hydrated = event => {
      if (event.detail?.studentId === progressScopeKey) refreshWoodland();
    };
    const changed = event => {
      if (event.key === woodlandKey || event.key === null) refreshWoodland();
    };
    window.addEventListener('lp-progress-hydrated', hydrated);
    window.addEventListener('storage', changed);
    return () => {
      window.removeEventListener('lp-progress-hydrated', hydrated);
      window.removeEventListener('storage', changed);
    };
  }, [ephemeral, progressScopeKey, refreshWoodland, woodlandKey]);
  useEffect(() => {
    if (!portalHost?.isConnected) return;
    focusRouteSurface(portalHost);
  }, [portalHost, journey]);

  // The expanded rounded3D journey and original chapter keep separate saves.
  return (
    journey === 'woodland' ? <WoodlandChapter
      key={progressScopeKey}
      progressScopeKey={progressScopeKey}
      isSoundEnabled={isSoundEnabled}
      ephemeral={ephemeral}
      getStorage={getStorage}
      onExit={leave}
      onOpenCampaign={() => { refreshWoodland(); setJourney('campaign'); }}
      accessibilitySettings={accessibilitySettings}
    /> : <RoundedCampaign
      key={progressScopeKey}
      progressScopeKey={progressScopeKey}
      isSoundEnabled={isSoundEnabled}
      ephemeral={ephemeral}
      getStorage={getStorage}
      accessibilitySettings={accessibilitySettings}
      onExit={leave}
      woodlandEntry={woodland}
      onOpenWoodland={() => setJourney('woodland')}
    />
  );
}
