import { useState } from "react";
import { createRoot } from "react-dom/client";
import { useStudentFocusSession } from "../../src/hooks/useStudentFocusSession.js";
import { STUDENT_FOCUS_CONTENT_VERSION } from "../../src/data/studentFocusSessionCore.js";

const scenario = new URLSearchParams(window.location.search).get("scenario") || "first-stall";
const requests = [];
window.__focusPollingRequests = requests;
const pending = new Map();
function response(token) {
  return { data: { ok: true, session: {
    id: token === "synthetic-second" ? "focus-second" : "focus-first",
    target: "cycle_practice", status: "active", content_version: STUDENT_FOCUS_CONTENT_VERSION,
    resolved_config: { cycle_id: "cycle-4" }
  } }, error: null };
}
const client = {
  call(name, args) {
    const entry = { number: requests.length + 1, token: args.p_token, aborted: false };
    requests.push(entry);
    const stalled = scenario === "always-stall"
      || (scenario === "first-stall" && entry.number === 1)
      || (scenario === "active-stall" && entry.number === 2)
      || (scenario === "switch-after-connected" && args.p_token === "synthetic-second");
    const request = stalled ? new Promise(resolve => pending.set(entry.number, () => resolve(response(args.p_token))))
      : Promise.resolve(response(args.p_token));
    request.abortSignal = signal => {
      signal.addEventListener("abort", () => { entry.aborted = true; }, { once: true });
      return request;
    };
    return request;
  }
};
window.__completeFocusPollingRequest = number => pending.get(number)?.();

function Harness() {
  const [token, setToken] = useState("synthetic-first");
  const state = useStudentFocusSession({ client, token, currentView: "cycle_practice" });
  return <main>
    <output data-testid="connection">{state.connection}</output>
    <output data-testid="assignment">{state.session?.id || "none"}</output>
    <button type="button" onClick={() => setToken("synthetic-second")}>Switch student</button>
  </main>;
}
createRoot(document.getElementById("root")).render(<Harness />);
