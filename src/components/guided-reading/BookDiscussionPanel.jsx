export default function BookDiscussionPanel({ discussion, onGoToPage }) {
  if (!discussion) return null;

  return (
    <details className="guided-reading-discussion">
      <summary>Discuss this book</summary>
      <div className="guided-reading-discussion-content">
        <section aria-labelledby="guided-reading-discussion-oral">
          <span aria-hidden="true" className="guided-reading-discussion-number">1</span>
          <div>
            <strong id="guided-reading-discussion-oral">Ask aloud</strong>
            <p>{discussion.oral.prompt}</p>
            <p className="guided-reading-discussion-note">
              <strong>Listen for:</strong> {discussion.oral.listenFor}
            </p>
          </div>
        </section>
        <section aria-labelledby="guided-reading-discussion-visual">
          <span aria-hidden="true" className="guided-reading-discussion-number">2</span>
          <div>
            <strong id="guided-reading-discussion-visual">Ask about the picture</strong>
            <p>{discussion.visual.prompt}</p>
            <p className="guided-reading-discussion-note">
              <strong>Look for:</strong> {discussion.visual.lookFor}
            </p>
            <button
              className="lp-button lp-button-secondary"
              onClick={() => onGoToPage?.(discussion.visual.page)}
              type="button"
            >
              Look again at page {discussion.visual.page}
            </button>
          </div>
        </section>
      </div>
    </details>
  );
}
