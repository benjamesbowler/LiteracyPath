export default function ReadingProgressBadge({ progress, book }) {
  const totalPages = Number(book?.pageCount || book?.pages?.length || 0);
  const currentPage = Number(progress?.currentPage || 0);
  const completed = Boolean(progress?.completed);

  if (completed) {
    return <span className="pd-reading-badge complete">Completed</span>;
  }

  if (currentPage > 0 && totalPages > 0) {
    return <span className="pd-reading-badge">Page {Math.min(currentPage, totalPages)} of {totalPages}</span>;
  }

  if (book?.downloadStatus === "pending_network_download" || !totalPages) {
    return <span className="pd-reading-badge pending">Pending pages</span>;
  }

  return <span className="pd-reading-badge">Not started</span>;
}
