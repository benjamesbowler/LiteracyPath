export function ProgressStars({ stars = 0, size = "md" }) {
  const starCount = Math.max(0, Math.min(3, stars));
  return (
    <div className={`lg-progress-stars lg-progress-stars-${size}`} aria-label={`${starCount} out of 3 stars`}>
      {[0, 1, 2].map(index => (
        <span key={index} aria-hidden="true" className={index < starCount ? "earned" : ""}>
          ★
        </span>
      ))}
    </div>
  );
}

export default ProgressStars;
