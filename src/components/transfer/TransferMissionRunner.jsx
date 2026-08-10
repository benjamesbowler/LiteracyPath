import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createTransferEvidencePayload } from "../../utils/transfer/scoreTransferEvidence.js";
import {
  appendTransferCompletion,
  beginTransferMission,
  saveTransferMissionStep
} from "../../policy/transferMissionPolicy.js";
import { logStudentActivity, queueProgressSave } from "../../utils/progressSync.js";
import { localProgressStorageKey } from "../../utils/progressKeys.js";
import { TransferMissionResult } from "./TransferMissionResult.jsx";
import "../../styles/transfer-missions.css";

export function TransferMissionRunner({ mission, scopeKey, progress, onProgress, onComplete, onClose }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const resumable = progress.active?.missionId === mission.id
    && progress.active?.contentVersion === mission.contentVersion
    ? progress.active
    : null;
  const [currentProgress, setCurrentProgress] = useState(() => beginTransferMission(progress, mission));
  const [rehearsed, setRehearsed] = useState(Boolean(resumable?.rehearsed));
  const [results, setResults] = useState(() => resumable?.itemResults || []);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [finished, setFinished] = useState(false);
  const index = Math.min(results.length, mission.items.length - 1);
  const item = mission.items[index];

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const previouslyFocused = document.activeElement;
    const background = [...document.body.children].filter(element => element !== dialog);
    const backgroundState = background.map(element => ({ element, inert: element.inert, ariaHidden: element.getAttribute("aria-hidden") }));
    background.forEach(element => { element.inert = true; element.setAttribute("aria-hidden", "true"); });
    const focusable = () => [...dialog.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
    (dialog.querySelector("[data-autofocus]") || focusable()[0] || dialog).focus();
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
    dialog.addEventListener("keydown", onKeyDown);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      backgroundState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden"); else element.setAttribute("aria-hidden", ariaHidden);
      });
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, [finished, rehearsed]);

  function persist(next) {
    setCurrentProgress(next);
    try {
      window.localStorage.setItem(
        localProgressStorageKey("transfer_missions", scopeKey),
        JSON.stringify(next)
      );
    } catch {
      // The cloud queue remains the recoverable copy when local storage is unavailable.
    }
    queueProgressSave("transfer_missions", "__all__", next, { scopeKey });
    onProgress?.(next);
  }

  function finishRehearsal(response) {
    if (response !== mission.mechanicRehearsal.answer) {
      setFeedback(mission.mechanicRehearsal.incorrectFeedback);
      return;
    }
    const next = saveTransferMissionStep(currentProgress, mission, {
      rehearsed: true,
      itemResults: results
    });
    setRehearsed(true);
    setFeedback("");
    persist(next);
  }

  function answer(response) {
    const correct = response === item.answer;
    setAttempts(count => count + 1);
    if (!correct) {
      setFeedback(item.incorrectFeedback || "That one does not match yet. Look at the middle sound and try again.");
      return;
    }
    const nextResults = [
      ...results,
      { itemId: item.id, state: attempts === 0 ? "correct" : "correct_after_support", response, attempts: attempts + 1 }
    ];
    if (nextResults.length < mission.items.length) {
      setResults(nextResults);
      setAttempts(0);
      setFeedback("Good checking. Now try the next one.");
      persist(saveTransferMissionStep(currentProgress, mission, {
        rehearsed: true,
        itemResults: nextResults
      }));
      return;
    }
    const evidence = createTransferEvidencePayload({
      mission,
      itemResults: nextResults,
      supportState: nextResults.some(result => result.attempts > 1) ? "corrective_feedback" : "none",
      mechanicRehearsalCompleted: true
    });
    const updated = appendTransferCompletion(currentProgress, evidence);
    persist(updated);
    logStudentActivity("transfer_missions", mission.id, "completed", evidence);
    setFinished(true);
    onComplete?.(updated);
  }

  const overlay = finished
    ? <div ref={dialogRef} tabIndex={-1} className="transfer-overlay" role="dialog" aria-modal="true" aria-label="Transfer mission result"><TransferMissionResult mission={mission} onClose={onClose} /></div>
    : <div ref={dialogRef} tabIndex={-1} className="transfer-overlay" role="dialog" aria-modal="true" aria-labelledby="transfer-runner-title" aria-describedby="transfer-runner-help"><section className="transfer-runner"><button data-autofocus type="button" onClick={onClose}>Leave for now</button><span>{rehearsed ? `Step ${index + 1} of ${mission.items.length}` : "Practice first — this does not count"}</span><h2 id="transfer-runner-title">{rehearsed ? item.prompt : mission.mechanicRehearsal.prompt}</h2><div>{(rehearsed ? item.choices : mission.mechanicRehearsal.choices).map(choice => <button type="button" key={choice} onClick={() => rehearsed ? answer(choice) : finishRehearsal(choice)}>{choice}</button>)}</div><p id="transfer-runner-help" className={feedback ? "transfer-feedback" : ""} role="status">{feedback || (rehearsed ? "Take your time. There is no speed score." : mission.mechanicRehearsal.help)}</p></section></div>;
  return typeof document === "undefined" ? overlay : createPortal(overlay, document.body);
}
