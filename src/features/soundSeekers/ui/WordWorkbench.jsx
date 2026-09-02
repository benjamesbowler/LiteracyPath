import { useId } from "react";
import MeaningPayoff from "./MeaningPayoff.jsx";
import "./WordWorkbench.css";

function correctionMessage(correction) {
  if (!correction || !Number.isFinite(correction.supportLevel) || correction.supportLevel <= 0) return null;
  if (correction.modelOnce || correction.supportLevel >= 3) {
    return "Watch one example. Then try a fresh tile.";
  }
  if (correction.isolatePosition || correction.reduceIrrelevantLoad || correction.supportLevel >= 2) {
    return "Look at the highlighted sound box. Try again.";
  }
  return "Listen to the whole word again. Then try a tile.";
}

function TargetCue() {
  return (
    <div className="ss-workbench__target" aria-hidden="true">
      <span className="ss-workbench__target-glow" />
      <span className="ss-workbench__target-object">
        <span className="ss-workbench__target-leaf" />
      </span>
      <span className="ss-workbench__target-wave ss-workbench__target-wave--one" />
      <span className="ss-workbench__target-wave ss-workbench__target-wave--two" />
    </div>
  );
}

function SoundBox({ slot, index, label, current, morphology }) {
  const isFilled = Boolean(slot.tileId);
  const visibleLabel = morphology && index === 0 ? morphology.baseWord : label;
  return (
    <div
      className={`ss-workbench__sound-box ss-workbench__sound-box--${isFilled ? "filled" : "empty"}`}
      data-slot-state={isFilled ? "filled" : "empty"}
      role="img"
      aria-label={`Sound box ${index + 1}, ${isFilled ? "filled" : "empty"}`}
      aria-current={current ? "step" : undefined}
    >
      <span className="ss-workbench__sound-box-number" aria-hidden="true">{index + 1}</span>
      <span className="ss-workbench__sound-box-mark" aria-hidden="true">
        {visibleLabel || ""}
      </span>
    </div>
  );
}

function MorphologyTeaching({ morphology, ready }) {
  return (
    <section className="ss-workbench__morphology" aria-labelledby="ss-morphology-title">
      <div>
        <p className="ss-workbench__morph-kicker">Practice only — no score</p>
        <h3 id="ss-morphology-title">Try a word ending</h3>
      </div>
      <div className="ss-workbench__morph-equation" aria-label={`${morphology.baseWord} plus ${morphology.ending}`}>
        <span>{morphology.baseWord}</span>
        <span aria-hidden="true">+</span>
        <span>{morphology.ending}</span>
      </div>
      {ready ? (
        <p className="ss-workbench__morph-result" role="status" aria-live="polite">
          <strong>{morphology.derivedWord}</strong>
          <span>{morphology.meaning}</span>
        </p>
      ) : null}
    </section>
  );
}

export default function WordWorkbench({
  model,
  meaningPayoff = null,
  onInput,
  onReplayWholeWord,
  onReplayMeaning
}) {
  const headingId = useId();
  const rackById = new Map((model?.rack || []).map(tile => [tile.id, tile]));
  const placedTileIds = new Set((model?.slots || []).map(slot => slot.tileId).filter(Boolean));
  const currentSlotIndex = (model?.slots || []).findIndex(slot => !slot.tileId);
  const correction = correctionMessage(model?.correction);
  const interactionLocked = model?.status === "awaiting_mission_commit";
  const morphologyReady = Boolean(model?.morphology && model.sweep === "meaning_ready");
  const sweepReady = !model?.morphology && model?.sweep === "ready";

  return (
    <section className="ss-workbench" aria-labelledby={headingId}>
      <header className="ss-workbench__header">
        <TargetCue />
        <div className="ss-workbench__instruction">
          <p className="ss-workbench__eyebrow">Build the sound trail</p>
          <h2 id={headingId}>{model?.instructionLabel || "Build the word."}</h2>
        </div>
        <button
          className="ss-workbench__control ss-workbench__replay"
          type="button"
          aria-label="Hear the whole word again"
          onClick={() => onReplayWholeWord?.()}
        >
          <span className="ss-workbench__speaker" aria-hidden="true">▶</span>
          <span>Hear word</span>
        </button>
      </header>

      {model?.morphology ? (
        <MorphologyTeaching morphology={model.morphology} ready={morphologyReady} />
      ) : null}

      <div className="ss-workbench__build-zone">
        <div className="ss-workbench__slots" role="group" aria-label="Sound boxes">
          {(model?.slots || []).map((slot, index) => (
            <SoundBox
              key={slot.id}
              slot={slot}
              index={index}
              label={rackById.get(slot.tileId)?.label}
              current={index === currentSlotIndex}
              morphology={model?.morphology}
            />
          ))}
        </div>

        <div className="ss-workbench__rack-shell">
          <p className="ss-workbench__rack-label">Choose a tile</p>
          <div className="ss-workbench__rack" role="group" aria-label="Grapheme tiles">
            {(model?.rack || []).map(tile => {
              const placed = placedTileIds.has(tile.id);
              return (
                <button
                  className="ss-workbench__tile"
                  key={tile.id}
                  type="button"
                  aria-label={`${tile.label} grapheme tile`}
                  aria-pressed={placed}
                  disabled={placed || interactionLocked}
                  onClick={() => onInput?.({ type: "place_tile", tileId: tile.id })}
                >
                  <span aria-hidden="true">{tile.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {sweepReady ? (
          <button
            className="ss-workbench__control ss-workbench__sweep"
            type="button"
            aria-label="Sweep and read the whole word"
            onClick={() => onInput?.({ type: "sweep_word" })}
          >
            <span className="ss-workbench__sweep-line" aria-hidden="true">→</span>
            <span>Sweep and read</span>
          </button>
        ) : null}
      </div>

      {correction ? (
        <p className="ss-workbench__correction" role="status" aria-live="polite">{correction}</p>
      ) : null}

      {meaningPayoff ? (
        <MeaningPayoff {...meaningPayoff} onReplay={onReplayMeaning} />
      ) : null}
    </section>
  );
}
