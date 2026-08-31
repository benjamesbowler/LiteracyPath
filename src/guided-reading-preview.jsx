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
import { BookQuiz } from "./components/guided-reading/BookQuiz.jsx";
import { GuidedReadingPage } from "./components/guided-reading/GuidedReadingPage.jsx";
import { StudentSessionNotice } from "./components/student-sessions/StudentSessionNotice.jsx";
import { guidedReadingBooks } from "./data/guidedReadingBooks.js";

export function GuidedReadingPreview() {
  const params = new URLSearchParams(window.location.search);
  const requestedBookId = params.get("book") || "moonwood-tales-c-25";
  const book = guidedReadingBooks.find(item => item.id === requestedBookId) || guidedReadingBooks[0];
  const [records, setRecords] = useState({});
  useEffect(() => {
    window.__guidedReadingPreviewRecords = records;
  }, [records]);
  const [quizResult, setQuizResult] = useState(null);
  const staleGroupHost = params.has("stale-group") ? {
    session: {
      id: "stale-preview-session",
      book_id: book.id,
      page_numbers: [1],
      page_index: 0,
      status: "ended"
    }
  } : null;

  if (params.has("quiz")) {
    return (
      <main className="student-mode-app lp-skin-sage" style={{ minHeight: "100dvh" }}>
        {quizResult ? (
          <p role="status">Preview finished: {quizResult.correct}/{quizResult.total}</p>
        ) : (
          <BookQuiz
            book={book}
            onFinish={(correct, total) => setQuizResult({ correct, total })}
          />
        )}
      </main>
    );
  }

  const reader = (
    <GuidedReadingPage
      guidedReadingRecords={records}
      initialBookId={book.id}
      mode="student"
      sessionHost={staleGroupHost}
      saveGuidedReadingRecord={(bookId, nextRecord) => {
        setRecords(current => ({ ...current, [bookId]: nextRecord }));
      }}
      speakText={() => {}}
      studentId="guided-reading-preview"
      studentName="Preview Reader"
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
