import { GUIDED_READING_BOOK_INDEX } from "./generated/guidedReadingBookIndex.generated.js";
import { guidedReadingContentId, guidedReadingEdition, guidedReadingProgressKey } from "../utils/guidedReading/editions.js";
// Shared reading remains compatible across ordinary web app deployments. Bump
// this only for a breaking change to the frozen-session/follower contract.
export const READING_SESSION_CONTENT_VERSION = "guided-reading-session-v1";

export function readingSessionContentVersion(book = {}, base = READING_SESSION_CONTENT_VERSION) {
  const edition = guidedReadingEdition(book);
  return edition ? `${base}:${edition}` : base;
}

export function readingSessionBook(session, books = GUIDED_READING_BOOK_INDEX) {
  return books.find(book => book.id === guidedReadingContentId(session?.book_id)) || null;
}

export function isReadingSessionCompatible(session, book = readingSessionBook(session), base = READING_SESSION_CONTENT_VERSION) {
  if (!session) return false;
  return session.content_version === readingSessionContentVersion(book || {}, base)
    && session.book_id === (book ? guidedReadingProgressKey(book) : session.book_id);
}

export function isPreviousTopicReadingSession(session, book = readingSessionBook(session)) {
  return Boolean(book && guidedReadingEdition(book) && session?.book_id === book.id
    && session.content_version === READING_SESSION_CONTENT_VERSION);
}

// Recovery only: replay exact unsent operations against their original frozen
// session. This does not open the new manuscript or adopt its word indices.
export async function resumePreviousTopicReadingSession({ client, session, book = readingSessionBook(session) }) {
  if (!isPreviousTopicReadingSession(session, book)) throw new Error("Not a previous-topic reading session.");
  const result = await callReadingRpc(client, "teacher_resume_reading_session", { p_session_id: session.id });
  if (result?.ok !== true || ["id", "teacher_id", "class_id", "book_id", "content_version"].some(key => result.session?.[key] !== session[key])) {
    throw new Error("The earlier reading session could not be confirmed. Pending changes are retained.");
  }
  return result;
}

function requireClient(client) {
  if (!client) throw new Error("Shared reading is unavailable while the service is offline.");
  return client;
}

async function callReadingRpc(client, name, args) {
  const { data, error } = await requireClient(client).call(name, args);
  if (error) throw error;
  return data;
}

export function startReadingSession({
  client,
  classId,
  bookId,
  book,
  pageNumbers,
  studentIds,
  contentVersion = READING_SESSION_CONTENT_VERSION
}) {
  return callReadingRpc(client, "teacher_start_reading_session", {
    p_class_id: classId,
    p_book_id: book ? guidedReadingProgressKey(book) : bookId,
    p_page_numbers: pageNumbers,
    p_student_ids: studentIds,
    p_content_version: readingSessionContentVersion(book || {}, contentVersion)
  });
}

export function setReadingSessionPage({ client, sessionId, pageIndex }) {
  return callReadingRpc(client, "teacher_set_reading_session_page", {
    p_session_id: sessionId,
    p_page_index: pageIndex
  });
}

export function endReadingSession({ client, sessionId }) {
  return callReadingRpc(client, "teacher_end_reading_session", {
    p_session_id: sessionId
  });
}

export function getReadingSessionPresence({ client, sessionId }) {
  return callReadingRpc(client, "teacher_get_reading_session_presence", {
    p_session_id: sessionId
  });
}

export function saveReadingMarks({
  client,
  sessionId,
  studentId,
  pageIndex,
  marks,
  clientEventId
}) {
  return callReadingRpc(client, "teacher_save_reading_marks", {
    p_session_id: sessionId,
    p_student_id: studentId,
    p_page_index: pageIndex,
    p_marks: marks,
    p_client_event_id: clientEventId
  });
}

export function getStudentReadingSession({
  client,
  token,
  pageIndex = null,
  contentOk = true
}) {
  return callReadingRpc(client, "student_get_reading_session", {
    p_token: token,
    p_page_index: pageIndex,
    p_content_ok: contentOk
  });
}

export async function resumeReadingSession({ client, sessionId, session }) {
  if (session && !isReadingSessionCompatible(session)) throw Object.assign(new Error("This session uses an older book edition. Start a new reading group for the current book."), { code: "reading_edition_changed" });
  const result = await callReadingRpc(client, "teacher_resume_reading_session", { p_session_id: sessionId });
  if (result?.ok === true && !isReadingSessionCompatible(result.session)) throw Object.assign(new Error("This session uses an older book edition. Start a new reading group for the current book."), { code: "reading_edition_changed" });
  return result;
}
