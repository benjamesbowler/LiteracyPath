import { useEffect, useRef, useState } from "react";

/** Let a complete construction settle, then submit its immutable first answer.
 * A failed save can retry that answer, never edit it into a different response.
 */
export function useAssessmentCompletion(questionId, answerQuestion) {
  const [state, setState] = useState({ questionId, status: "ready" });
  const completion = useRef({ questionId, status: "ready", timer: null });

  useEffect(() => {
    const current = { questionId, status: "ready", timer: null };
    completion.current = current;
    return () => {
      current.cancelled = true;
      clearTimeout(current.timer);
    };
  }, [questionId]);

  async function submit(current) {
    if (current.cancelled || current.status === "saving") return;
    current.status = "saving";
    setState({ questionId, status: "saving" });
    try {
      const result = await answerQuestion(current.answer);
      if (result === false) throw new Error("Answer was not saved");
    } catch {
      if (current.cancelled) return;
      current.status = "error";
      setState({ questionId, status: "error" });
    }
  }

  const complete = answer => {
    const current = completion.current;
    if (current.questionId !== questionId || current.status !== "ready") return;
    current.answer = answer;
    current.status = "settling";
    setState({ questionId, status: "settling" });
    current.timer = setTimeout(() => { void submit(current); }, 240);
  };
  const retry = () => {
    const current = completion.current;
    if (current.questionId === questionId && current.status === "error") void submit(current);
  };
  const status = state.questionId === questionId ? state.status : "ready";
  return { complete, pending: status !== "ready", error: status === "error", retry };
}
