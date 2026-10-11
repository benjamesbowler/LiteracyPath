import { useCallback, useEffect, useId, useRef, useState } from "react";

/** Read availability only when this action is visible, including inside report details. */
export function LiteracyMockFreshAction({ studentId, sourceSessionId, questionId, skillId, loadCapacity, onPrepare, disabled, children }) {
  const element = useRef(null);
  const generation = useRef({ value: 0 });
  const descriptionId = useId();
  const [result, setResult] = useState(null);
  const [state, setState] = useState("idle");
  const refresh = useCallback(async () => {
    const current = ++generation.current.value;
    setState("loading");
    try {
      const capacity = await loadCapacity({ studentId, sourceSessionId, questionId, skillId });
      if (generation.current.value !== current) return;
      setResult(capacity); setState("ready");
    } catch {
      if (generation.current.value !== current) return;
      // An unavailable count is not evidence of an empty bank.
      setResult(null); setState("error");
    }
  }, [loadCapacity, studentId, sourceSessionId, questionId, skillId]);

  useEffect(() => {
    if (!loadCapacity) return undefined;
    const requestGeneration = generation.current;
    let observer;
    let timer;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect(); void refresh();
        }
      });
      observer.observe(element.current);
    } else timer = setTimeout(() => { void refresh(); }, 0);
    return () => { requestGeneration.value++; observer?.disconnect(); clearTimeout(timer); };
  }, [loadCapacity, refresh]);

  const exhausted = state === "ready" && result?.remainingCount === 0;
  const count = result?.remainingCount;
  return <div ref={element} className="literacy-mock-fresh-action">
    <button type="button" disabled={disabled || exhausted} aria-describedby={loadCapacity ? descriptionId : undefined} onClick={onPrepare}>{children}</button>
    {loadCapacity && <div id={descriptionId} className="literacy-mock-fresh-capacity" aria-live="polite">
      {state === "idle" || state === "loading" ? <small>Checking fresh examples…</small> : state === "error" ? <small>Fresh example count is unavailable. Preparation will check availability again.</small> : <>
        <small>{exhausted ? "No fresh examples remain for this task, level and access conditions. Collect a comparable example outside this practice bank." : `${result.countKind === "lower_bound" ? "At least " : ""}${count} fresh ${count === 1 ? "example remains" : "examples remain"}. A check can include ${result.checkItemCount} ${result.checkItemCount === 1 ? "question" : "questions"}.`}</small>
        <small>Based on recorded exposure · Checked {new Date(result.checkedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. Availability is checked again when preparing.</small>
      </>}
      {(state === "ready" || state === "error") && <button type="button" className="literacy-mock-capacity-refresh" onClick={() => void refresh()} disabled={disabled}>Refresh fresh example count</button>}
    </div>}
  </div>;
}
