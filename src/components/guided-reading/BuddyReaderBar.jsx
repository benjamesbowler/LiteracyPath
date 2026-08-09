export function BuddyReaderBar({
  reader,
  pageNumber,
  isAudioPlaying,
  isAudioLoading,
  ledaTurnHeard,
  onChildDone,
  onHearLeda,
  onLedaDone,
  onStop
}) {
  return (
    <section className="buddy-reader-bar" aria-label="Buddy Reader with Leda" data-buddy-reader={reader}>
      <div>
        <span>Buddy Reader · Page {pageNumber}</span>
        <strong>{reader === "child" ? "Your turn" : "Leda’s turn"}</strong>
        <p>
          {reader === "child"
            ? "Read this page aloud or quietly, then tap done. Your voice is never recorded."
            : ledaTurnHeard
              ? "Leda has finished this page. Now swap turns."
              : "Listen to Leda read this page, then swap turns."}
        </p>
      </div>
      <div>
        {reader === "child" ? (
          <button className="lp-button lp-button-primary" type="button" onClick={onChildDone}>I read this page</button>
        ) : ledaTurnHeard ? (
          <button className="lp-button lp-button-primary" type="button" onClick={onLedaDone}>My turn next</button>
        ) : (
          <button className="lp-button lp-button-primary" disabled={isAudioLoading} type="button" onClick={onHearLeda}>
            {isAudioLoading ? "Getting Leda ready…" : isAudioPlaying ? "Leda is reading…" : "Hear Leda read"}
          </button>
        )}
        <button className="lp-button lp-button-secondary" type="button" onClick={onStop}>Stop buddy reading</button>
      </div>
    </section>
  );
}
