export function StarIcon({ filled = false, className = "" }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 24 24"
      focusable="false"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2l-5-4.9 6.9-1L12 2Z" />
    </svg>
  );
}

export default StarIcon;
