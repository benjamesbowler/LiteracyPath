import { filterBooks } from "../../content/books/bookFilters.js";
import BookCard from "./BookCard.jsx";

export default function BookGrid({ books, filters, progressByBook, onRead }) {
  const visibleBooks = filterBooks(books, filters);

  if (!visibleBooks.length) {
    return (
      <div className="pd-book-empty">
        <h3>No books match these filters.</h3>
        <p>Reset the filters to see the full curated public-domain list.</p>
      </div>
    );
  }

  return (
    <div className="pd-book-grid">
      {visibleBooks.map(book => (
        <BookCard
          book={book}
          key={book.id}
          onRead={onRead}
          progress={progressByBook?.[book.id]}
        />
      ))}
    </div>
  );
}
