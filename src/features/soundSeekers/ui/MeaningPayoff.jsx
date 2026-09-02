function MeaningIllustration({ visual, reducedMotion }) {
  const glyph = ["moon", "ship"].includes(visual?.glyph) ? visual.glyph : "discovery";
  return (
    <div
      className={`ss-meaning-payoff__visual ss-meaning-payoff__visual--${glyph}`}
      role="img"
      aria-label={visual?.accessibleLabel || "A picture showing the word meaning"}
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <span className="ss-meaning-payoff__halo" aria-hidden="true" />
      <span className="ss-meaning-payoff__picture" aria-hidden="true">
        <span className="ss-meaning-payoff__picture-main" />
        <span className="ss-meaning-payoff__picture-detail" />
      </span>
    </div>
  );
}

export default function MeaningPayoff({ support, visual, reducedMotion = false, onReplay }) {
  if (!support?.wordId || !support?.childDefinition) return null;
  return (
    <aside
      className="ss-meaning-payoff"
      aria-labelledby="ss-meaning-payoff-title"
      data-motion={reducedMotion ? "reduced" : "full"}
    >
      <MeaningIllustration visual={visual} reducedMotion={reducedMotion} />
      <div className="ss-meaning-payoff__copy">
        <p className="ss-meaning-payoff__eyebrow">Word discovery</p>
        <h3 id="ss-meaning-payoff-title">{support.wordId}</h3>
        <p className="ss-meaning-payoff__definition">{support.childDefinition}</p>
        {support.actionPrompt ? (
          <p className="ss-meaning-payoff__action">{support.actionPrompt}</p>
        ) : null}
        <button
          className="ss-workbench__control ss-meaning-payoff__replay"
          type="button"
          aria-label="Hear the meaning again"
          onClick={() => onReplay?.()}
        >
          <span className="ss-workbench__speaker" aria-hidden="true">▶</span>
          <span>Hear meaning</span>
        </button>
      </div>
    </aside>
  );
}
