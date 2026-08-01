import { useEffect, useState } from "react";
import "./StudentReadingFollower.css";

export function StudentReadingFollower({ follower }) {
  const { session, page, connection, contentOk } = follower;

  useEffect(() => {
    if (!session) return;
    window.speechSynthesis?.cancel?.();
    document.querySelectorAll("audio").forEach(element => {
      try {
        element.pause();
        element.currentTime = 0;
      } catch {
        // A detached media element can reject seeking; shared reading still
        // remains silent because playback was paused first.
      }
    });
  }, [session]);

  if (connection === "idle") return null;
  if (connection === "ended") {
    return (
      <section className="student-reading-follower student-reading-follower-ended" aria-live="polite">
        <p>All done reading!</p>
      </section>
    );
  }

  if (!contentOk || !page) {
    return (
      <section className="student-reading-follower student-reading-follower-holding" aria-live="polite">
        <p>Waiting for your teacher</p>
        <span className="student-reading-connection hollow" aria-label="Waiting for your teacher" />
      </section>
    );
  }

  return (
    <StudentReadingPage
      connection={connection}
      key={`${session.id}:${session.page_index}`}
      page={page}
      session={session}
    />
  );
}

function StudentReadingPage({ connection, page, session }) {
  const [imagePainted, setImagePainted] = useState(false);
  const [textOnly, setTextOnly] = useState(() => !page?.image);

  useEffect(() => {
    if (!page?.image || imagePainted) return undefined;
    const timer = window.setTimeout(() => setTextOnly(true), 2000);
    return () => window.clearTimeout(timer);
  }, [imagePainted, page?.image]);

  const reconnecting = connection === "reconnecting";
  const pageCount = session.page_numbers?.length || 0;
  return (
    <section
      className={`student-reading-follower${reconnecting ? " reconnecting" : ""}${textOnly ? " text-only" : ""}${imagePainted ? " image-painted" : ""}`}
      aria-label="Reading together"
    >
      <p className="visually-hidden" aria-live="polite">
        Page {(session.page_index || 0) + 1} of {pageCount}
      </p>
      <div className="student-reading-page">
        {page.image && (
          <div className="student-reading-image-frame" aria-hidden={textOnly && !imagePainted ? "true" : undefined}>
            <img
              alt={page.imageAlt || "Story picture"}
              className={imagePainted ? "painted" : ""}
              onError={() => setTextOnly(true)}
              onLoad={() => {
                setImagePainted(true);
              }}
              src={page.image}
            />
          </div>
        )}
        <div className="student-reading-text">
          <p>{page.text}</p>
        </div>
      </div>
      {reconnecting && <p className="student-reading-waiting">Waiting for your teacher</p>}
      <span
        className={`student-reading-connection ${reconnecting ? "hollow" : "filled"}`}
        aria-label={reconnecting ? "Waiting for your teacher" : "Connected"}
      />
    </section>
  );
}
