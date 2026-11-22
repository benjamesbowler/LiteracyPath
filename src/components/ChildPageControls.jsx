import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import "../styles/child-page-controls.css";

export default function ChildPageControls({ pageIndex, pageCount, onPageChange, label = "Pages" }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="child-page-controls" aria-label={label}>
      <button type="button" aria-disabled={pageIndex === 0} onClick={() => pageIndex > 0 && onPageChange(pageIndex - 1)}>
        <CaretLeft size={16} weight="bold" aria-hidden="true" /> Previous
      </button>
      <span role="status">Page {pageIndex + 1} of {pageCount}</span>
      <button type="button" aria-disabled={pageIndex >= pageCount - 1} onClick={() => pageIndex < pageCount - 1 && onPageChange(pageIndex + 1)}>
        Next <CaretRight size={16} weight="bold" aria-hidden="true" />
      </button>
    </nav>
  );
}
