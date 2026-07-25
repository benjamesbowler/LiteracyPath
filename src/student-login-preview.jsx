import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import { StudentLoginFlow } from "./components/StudentLoginFlow.jsx";

const scenario = new URLSearchParams(window.location.search).get("scenario") || "code-not-found";

const client = {
  async rpc(name) {
    if (name !== "student_class_by_code") {
      return { data: null, error: { message: "Unexpected preview RPC." } };
    }
    if (scenario === "code-not-found") {
      return { data: { ok: false, error: "not_found" }, error: null };
    }
    if (scenario === "offline") {
      return {
        data: null,
        error: { code: "network_error", message: "Failed to fetch" }
      };
    }
    if (scenario === "code-expired") {
      return { data: { ok: false, error: "code_expired" }, error: null };
    }
    if (scenario === "rate-limited") {
      return {
        data: { ok: false, error: "rate_limited", retry_seconds: 120 },
        error: null
      };
    }
    return { data: { ok: false, error: "class_unavailable" }, error: null };
  }
};

export function StudentLoginPreview() {
  return (
    <div className="app student-mode-app student-login-app-shell lp-skin-sage">
      <StudentLoginFlow
        client={client}
        onTeacherEntry={() => {
          document.documentElement.dataset.teacherEntry = "true";
        }}
        onSessionStart={() => {
          document.documentElement.dataset.studentSession = "true";
        }}
      />
    </div>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<StudentLoginPreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
