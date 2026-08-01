export const INITIAL_READING_FOLLOWER_STATE = Object.freeze({
  session: null,
  page: null,
  connection: "idle",
  contentOk: true,
  failureCount: 0
});

export function followerRetryDelay(failureCount) {
  const exponent = Math.max(0, Number(failureCount || 0) - 1);
  return Math.min(8000, 1000 * (2 ** exponent));
}

export function resolveFollowerPage({ books = [], session, contentVersion }) {
  if (!session) return { page: null, book: null, contentOk: true };
  const book = books.find(candidate => candidate.id === session.book_id) || null;
  const pageNumber = session.page_numbers?.[session.page_index];
  const page = book?.pages?.find(candidate => candidate.pageNumber === pageNumber) || null;
  return {
    book,
    page,
    contentOk: Boolean(
      page
      && session.content_version
      && session.content_version === contentVersion
    )
  };
}

export function reduceReadingFollowerState(state, event) {
  if (event.type === "failure") {
    const failureCount = state.failureCount + 1;
    return {
      ...state,
      failureCount,
      // The follower is optional until a real shared-reading session has been
      // received. Backend setup or network failures must not turn the entire
      // student app into a false "Waiting for your teacher" screen.
      connection: state.session && failureCount >= 3
        ? "reconnecting"
        : state.connection
    };
  }
  if (event.type === "session") {
    if (!event.session) {
      return state.session
        ? { ...state, session: null, connection: "ended", failureCount: 0 }
        : { ...INITIAL_READING_FOLLOWER_STATE };
    }
    return {
      session: event.session,
      page: event.page || state.page,
      connection: event.contentOk ? "live" : "live",
      contentOk: Boolean(event.contentOk),
      failureCount: 0
    };
  }
  if (event.type === "reset") return { ...INITIAL_READING_FOLLOWER_STATE };
  return state;
}
