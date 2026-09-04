import { useEffect, useMemo, useRef, useState } from "react";
import {
  canonicalTeachAudioBinding,
  canonicalTeachItem,
  createTeachAudioRequests
} from "../runtime/teachAllAudio.js";

function targetUnits(item) {
  return Array.isArray(item.anchorEvidence?.units) ? item.anchorEvidence.units : [];
}

function TeachAllSequenceSession({ item, binding, audioController, onComplete }) {
  if (!audioController || typeof audioController.request !== "function"
    || typeof audioController.invalidate !== "function"
    || typeof audioController.getSnapshot !== "function"
    || typeof audioController.subscribe !== "function"
    || typeof onComplete !== "function") {
    throw new TypeError("Teach-all needs one live audio owner and a completion action");
  }
  const requests = useMemo(() => createTeachAudioRequests(item), [item]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ready, setReady] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState("unavailable");
  const receiptsRef = useRef([]);
  const capturedCueRef = useRef(null);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    const unsubscribe = audioController.subscribe(snapshot => {
      const currentIndex = activeIndexRef.current;
      if (currentIndex < 0 || currentIndex >= requests.length) return;
      const request = requests[currentIndex];
      if (snapshot.request?.cueId !== request.cueId) return;
      setDeliveryStatus(snapshot.delivery?.status || "unavailable");
      if (snapshot.delivery?.status !== "completed"
        || capturedCueRef.current === request.cueId) return;
      capturedCueRef.current = request.cueId;
      receiptsRef.current = [...receiptsRef.current, snapshot.delivery];
      const nextIndex = currentIndex + 1;
      if (nextIndex < requests.length) {
        capturedCueRef.current = null;
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
        audioController.request(requests[nextIndex], binding);
      } else {
        setReady(true);
      }
    });
    return () => {
      unsubscribe();
      audioController.invalidate(binding);
    };
  }, [audioController, binding, requests]);

  function playLesson() {
    audioController.invalidate(binding);
    receiptsRef.current = [];
    capturedCueRef.current = null;
    setReady(false);
    setDeliveryStatus("unavailable");
    activeIndexRef.current = 0;
    setActiveIndex(0);
    audioController.request(requests[0], binding);
  }

  function complete() {
    if (!ready || receiptsRef.current.length !== requests.length) return;
    setReady(false);
    onComplete(Object.freeze({
      type: "complete-teach",
      teachIndex: item.teachIndex,
      targetId: item.targetId,
      audioDeliveries: Object.freeze([...receiptsRef.current])
    }));
  }

  const progress = activeIndex < 0 ? "Ready to listen"
    : ready ? "Lesson heard"
      : deliveryStatus === "unavailable" ? "Turn voices and sounds on to continue"
      : `Listening ${Math.min(activeIndex + 1, requests.length)} of ${requests.length}`;

  const activeRequest = activeIndex >= 0 ? requests[activeIndex] : null;
  const soundSteps = targetUnits(item).length
    ? targetUnits(item)
    : [{ grapheme: item.graphemeDisplay, soundKey: item.targetId }];

  function replayCurrentCue() {
    const request = activeRequest || requests[0];
    if (request) audioController.request(request, binding);
  }

  return (
    <main
      className="ss-teach"
      aria-labelledby="ss-teach-title"
      data-teach-stop-id={item.stopId}
      data-teach-index={item.teachIndex}
      data-teach-target-id={item.targetId}
      data-instruction-id={item.instructionId}
      data-scored="false"
    >
      <section className="ss-teach__card">
        <div className="ss-teach__copy">
          <p className="ss-eyebrow">Sound camp · stop {item.teachIndex + 1}</p>
          <h1 id="ss-teach-title">Meet {item.childLabel}</h1>
          <p className="ss-teach__instruction">{item.childText}</p>
          <button
            className="ss-teach__grapheme"
            type="button"
            aria-label={`Hear ${item.childLabel} again`}
            onClick={replayCurrentCue}
          >
            <span aria-hidden="true">{item.graphemeDisplay}</span>
            <span className="ss-teach__grapheme-hint">tap to hear</span>
          </button>
          <dl className="ss-teach__cues">
            <div><dt>Say it</dt><dd>{item.mouthCue}</dd></div>
            <div><dt>Notice it</dt><dd>{item.morphologyCue}</dd></div>
          </dl>
        </div>
        <figure className="ss-teach__anchor">
          {item.anchorImage?.id ? (
            <img
              src={item.anchorImage.id}
              alt={item.anchorWord}
              onError={event => { event.currentTarget.style.display = "none"; }}
            />
          ) : null}
          <figcaption>
            <strong>{item.anchorWord}</strong>
            <span>{item.workedExample}</span>
          </figcaption>
        </figure>
      </section>

      <section className="ss-teach__sound-track" aria-label={`Sound steps in ${item.anchorWord}`}>
        <div className="ss-teach__sound-track-heading">
          <span>{soundSteps.length > 1 ? "Build the word" : "Find the sound"}</span>
          <span>{Math.min(Math.max(activeIndex + 1, 0), requests.length)} / {requests.length} listening cues heard</span>
        </div>
        <ol className="ss-teach__units" aria-label={`Sound parts in ${item.anchorWord}`}>
          {soundSteps.map((unit, index) => (
            <li
              key={`${unit.grapheme}:${unit.soundKey}:${index}`}
              data-active={activeIndex >= 0 && activeIndex % soundSteps.length === index ? "true" : undefined}
              data-heard={activeIndex > index || ready ? "true" : undefined}
            >
              <strong>{unit.grapheme}</strong><span>{unit.soundKey}</span>
            </li>
          ))}
        </ol>
      </section>

      {item.alternateExamples.length ? (
        <details className="ss-teach__alternates">
          <summary>Try this sound in more words</summary>
          <h2 id="ss-teach-alternates-title">Try it in more words</h2>
          <ul aria-labelledby="ss-teach-alternates-title">
            {item.alternateExamples.map((example, index) => (
              <li key={`${example.anchorWord}:${index}`}>
                <strong>{example.anchorWord}</strong><span>{example.childText}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="ss-teach__controls">
        <button className="ss-secondary-button" type="button" onClick={playLesson}>
          {activeIndex < 0 ? "Start the sound trail" : "Replay the sound trail"}
          {activeIndex < 0 ? <span className="ss-visually-hidden" aria-hidden="true">Hear the whole lesson</span> : null}
        </button>
        <p role="status" aria-live="polite">{progress}</p>
        <button className="ss-primary-button" type="button" disabled={!ready} onClick={complete}>
          {ready ? "Use the sound on the trail" : "Listen to continue"}
          <span className="ss-visually-hidden" aria-hidden="true">I heard every part</span>
        </button>
      </div>
    </main>
  );
}

export function TeachAllSequence({ item: rawItem, binding: rawBinding, audioController, onComplete }) {
  const item = canonicalTeachItem(rawItem);
  const binding = useMemo(() => canonicalTeachAudioBinding(rawBinding), [rawBinding]);
  const sessionKey = `${binding.scopeKey}:${binding.missionId}:${binding.phaseId}:${binding.attemptId}:${item.teachIndex}:${item.targetId}`;
  return (
    <TeachAllSequenceSession
      key={sessionKey}
      item={item}
      binding={binding}
      audioController={audioController}
      onComplete={onComplete}
    />
  );
}

export default TeachAllSequence;
