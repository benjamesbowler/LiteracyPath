import { useState } from "react";
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
  const resumable = progress.active?.missionId === mission.id
    && progress.active?.contentVersion === mission.contentVersion
    ? progress.active
    : null;
  const [currentProgress, setCurrentProgress] = useState(() => beginTransferMission(progress, mission));
  const [rehearsed, setRehearsed] = useState(Boolean(resumable?.rehearsed));
  const [results, setResults] = useState(() => resumable?.itemResults || []);
  const [finished, setFinished] = useState(false);
  const index = Math.min(results.length, mission.items.length - 1);
  const item = mission.items[index];

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

  function finishRehearsal() {
    const next = saveTransferMissionStep(currentProgress, mission, {
      rehearsed: true,
      itemResults: results
    });
    setRehearsed(true);
    persist(next);
  }

  function answer(response) {
    const nextResults = [
      ...results,
      { itemId: item.id, state: response === item.answer ? "correct" : "incorrect", response }
    ];
    if (nextResults.length < mission.items.length) {
      setResults(nextResults);
      persist(saveTransferMissionStep(currentProgress, mission, {
        rehearsed: true,
        itemResults: nextResults
      }));
      return;
    }
    const evidence = createTransferEvidencePayload({
      mission,
      itemResults: nextResults,
      supportState: "none",
      mechanicRehearsalCompleted: true
    });
    const updated = appendTransferCompletion(currentProgress, evidence);
    persist(updated);
    logStudentActivity("transfer_missions", mission.id, "completed", evidence);
    setFinished(true);
    onComplete?.(updated);
  }

  const overlay = finished
    ? <div className="transfer-overlay" role="dialog" aria-modal="true" aria-label="Transfer mission result"><TransferMissionResult mission={mission} onClose={onClose} /></div>
    : <div className="transfer-overlay" role="dialog" aria-modal="true" aria-labelledby="transfer-runner-title"><section className="transfer-runner"><button type="button" onClick={onClose}>Leave for now</button><span>{rehearsed ? `Step ${index + 1} of ${mission.items.length}` : "Practice first — this does not count"}</span><h2 id="transfer-runner-title">{rehearsed ? item.prompt : mission.mechanicRehearsal.prompt}</h2><div>{(rehearsed ? item.choices : mission.mechanicRehearsal.choices).map(choice => <button type="button" key={choice} onClick={() => rehearsed ? answer(choice) : finishRehearsal()}>{choice}</button>)}</div><p>{rehearsed ? "Take your time. There is no speed score." : "Choose either button to learn how this mission works."}</p></section></div>;
  return typeof document === "undefined" ? overlay : createPortal(overlay, document.body);
}
