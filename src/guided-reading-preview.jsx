import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/student-vibrant.css";
import "./styles/comic-theme.css";
import "./styles/home-sage.css";
import "./styles/sage-subpages.css";
import "./styles/sage-soft.generated.css";
import "./styles/sage-form.css";
import "./styles/kids-glass.css";
import "./styles/ui-quality-pass.css";
import "./styles/student-sessions.css";
import StudentGlassShell from "./components/StudentGlassShell.jsx";
import { GuidedReadingPage } from "./components/guided-reading/GuidedReadingPage.jsx";
import { StudentSessionNotice } from "./components/student-sessions/StudentSessionNotice.jsx";
import { getGuidedReadingBookMetadata } from "./data/guidedReadingBookMetadata.js";
import { guidedReadingBooks } from "./data/guidedReadingBooks.js";

export function GuidedReadingPreview() {
  const params = new URLSearchParams(window.location.search);
  const requestedBookId = params.get("book") || "moonwood-tales-c-25";
  const requestedMode = ["teacher", "class", "adminReview"].includes(params.get("mode"))
    ? params.get("mode")
    : "student";
  const book = guidedReadingBooks.find(item => item.id === requestedBookId) || guidedReadingBooks[0];
  const [records, setRecords] = useState(() => params.has("complete-c-standard")
    ? Object.fromEntries(guidedReadingBooks
      .filter(item => (
        item.id !== book.id
        && item.level === "C"
        && getGuidedReadingBookMetadata(item)?.readingBandProfile === "standard"
      ))
      .map(item => [item.id, {
        completed: true,
        completedAt: "2026-09-02T10:00:00.000Z",
        completedPages: item.pages.length,
        totalPages: item.pages.length
      }]))
    : {});
  useEffect(() => {
    window.__guidedReadingPreviewRecords = records;
  }, [records]);
  const staleGroupHost = params.has("stale-group") ? {
    session: {
      id: "stale-preview-session",
      book_id: book.id,
      page_numbers: [1],
      page_index: 0,
      status: "ended"
    }
  } : null;

  const reader = (
    <GuidedReadingPage
      guidedReadingRecords={records}
      initialBookId={book.id}
      mode={requestedMode}
      sessionHost={staleGroupHost}
      saveGuidedReadingRecord={(bookId, nextRecord) => {
        setRecords(current => ({ ...current, [bookId]: nextRecord }));
      }}
      speakText={() => {}}
      studentId={requestedMode === "student" ? "guided-reading-preview" : ""}
      studentName={requestedMode === "student" ? "Preview Reader" : ""}
    />
  );

  if (params.has("locked")) {
    return (
      <main className="app student-mode-app lp-skin-sage">
        <StudentGlassShell
          active="books"
          headerActions={(
            <StudentSessionNotice
              placement="header"
              session={{ target: "assigned_book" }}
            />
          )}
          profileInteractive={false}
          scopeKey="guided-reading-preview"
          showGrownUps={false}
          showWallet={false}
          studentName="Preview Reader"
          tabs={[]}
        >
          {reader}
        </StudentGlassShell>
      </main>
    );
  }

  return (
    <main className="app student-mode-app lp-skin-sage">
      {reader}
    </main>
  );
}

const rootElement = document.getElementById("root");
const root = import.meta.hot?.data.root || createRoot(rootElement);
root.render(<GuidedReadingPreview />);

if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.root = root;
  });
}
