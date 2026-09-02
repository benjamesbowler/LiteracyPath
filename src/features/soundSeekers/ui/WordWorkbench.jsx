import { useEffect, useId, useState } from "react";
import {
  getPronunciation,
  getWordMeaning
} from "../content/pronunciationLexicon.js";
import { isRecursivelyFrozen } from "../engine/powers/contracts.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "../visual/visualTokens.js";
import MeaningPayoff from "./MeaningPayoff.jsx";
import "./WordWorkbench.css";

const TOKEN_STYLE = Object.freeze(Object.fromEntries(
  Object.entries(SOUND_SEEKERS_VISUAL_TOKENS).map(([tokenId, value]) => (
    [`--ss-token-${tokenId}`, value]
  ))
));
const CORRECTION_KEYS = Object.freeze([
  "mode", "replayContrast", "selectedContrast", "visibleText", "spokenText"
]);
const MODEL_KEYS = Object.freeze([
  "challengeId", "powerId", "instructionLabel", "visualCue", "status", "correction",
  "slots", "rack", "sweep", "morphology"
]);
const SAFE_CORRECTION_KEYS = new Set([
  "supportLevel", "mode", "replayContrast", "isolatePosition", "reduceIrrelevantLoad",
  "modelOnce", "requiresFreshAttempt", "queueIsomorphicReview"
]);
const CORRECTION_MODES = new Set(["discover", "retry", "narrow", "teach", "guided"]);

function exactRecord(value, keys) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key));
}

function nonemptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function validCorrectionModel(value) {
  if (value === null) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  if (!entries.length || entries.some(([key]) => !SAFE_CORRECTION_KEYS.has(key))) return false;
  for (const [key, item] of entries) {
    if (key === "supportLevel" && (!Number.isInteger(item) || item < 1 || item > 3)) return false;
    if (key === "mode" && !CORRECTION_MODES.has(item)) return false;
    if (["replayContrast", "reduceIrrelevantLoad", "modelOnce", "requiresFreshAttempt", "queueIsomorphicReview"].includes(key)
      && typeof item !== "boolean") return false;
    if (key === "isolatePosition" && item !== null
      && !(nonemptyString(item) || (Number.isInteger(item) && item >= 0))) return false;
  }
  return true;
}

function validCollectionRecord(value, keys) {
  return exactRecord(value, keys) && keys.every(key => {
    if (key === "tileId") return value[key] === null || nonemptyString(value[key]);
    return nonemptyString(value[key]);
  });
}

function validWordForgeModel(model) {
  if (!exactRecord(model, MODEL_KEYS) || !isRecursivelyFrozen(model)
    || model.powerId !== "word_forge" || !nonemptyString(model.challengeId)
    || !["active", "awaiting_mission_commit"].includes(model.status)
    || !validCorrectionModel(model.correction)
    || !Array.isArray(model.rack) || model.rack.length < 1 || model.rack.length > 12
    || !Array.isArray(model.slots) || model.slots.length < 1 || model.slots.length > 12
    || model.rack.some(tile => !validCollectionRecord(tile, ["id", "label"]))
    || model.slots.some(slot => !validCollectionRecord(slot, ["id", "tileId"]))) return false;

  const rackIds = model.rack.map(tile => tile.id);
  const slotIds = model.slots.map(slot => slot.id);
  const placedIds = model.slots.map(slot => slot.tileId).filter(Boolean);
  if (new Set(rackIds).size !== rackIds.length
    || new Set(slotIds).size !== slotIds.length
    || new Set(placedIds).size !== placedIds.length) return false;

  if (model.morphology === null) {
    return model.instructionLabel === "Choose the letter or letter team for this sound."
      && exactRecord(model.visualCue, ["kind"])
      && model.visualCue.kind === "whole_word"
      && model.rack.length >= 2
      && ["not_ready", "ready"].includes(model.sweep)
      && (model.sweep !== "ready"
        || (model.status === "active" && model.slots.every(slot => slot.tileId !== null)))
      && placedIds.every(id => rackIds.includes(id));
  }

  return model.instructionLabel === "Endings can change or extend a word."
    && exactRecord(model.visualCue, ["kind"])
    && model.visualCue.kind === "morphology"
    && ["not_ready", "meaning_ready"].includes(model.sweep)
    && placedIds.every(id => id === "morphology-base-fixed" || rackIds.includes(id))
    && Boolean(validMorphologyModel(model));
}

function childGrapheme(value) {
  const label = String(value || "");
  const splitDigraph = /^([a-z])_([a-z])$/u.exec(label);
  return splitDigraph ? `${splitDigraph[1]}…${splitDigraph[2]}` : label;
}

function spokenGrapheme(value) {
  const label = String(value || "");
  const splitDigraph = /^([a-z])_([a-z])$/u.exec(label);
  return splitDigraph ? `${splitDigraph[1]} blank ${splitDigraph[2]}` : label;
}

function cueGeometry(referenceId, sense) {
  const id = `${referenceId} ${sense}`.toLocaleLowerCase("en-US");
  if (/ship|boat|vessel|water.*travel/u.test(id)) return { id: "water-vessel", shape: "M 12 67 L 108 67 L 91 92 L 29 92 Z M 39 65 L 58 31 L 58 65 M 61 35 L 92 59 L 61 59 Z", mark: "M 16 101 Q 36 90 56 101 Q 76 112 105 99" };
  if (/moon|night sky/u.test(id)) return { id: "night-moon", shape: "M 78 16 A 43 43 0 1 0 91 93 A 35 35 0 0 1 78 16", mark: "M 21 29 L 27 38 L 37 42 L 27 46 L 21 55 L 17 46 L 7 42 L 17 38 Z" };
  if (/cake|baked food|celebration/u.test(id)) return { id: "celebration-cake", shape: "M 20 51 Q 60 30 100 51 L 100 93 Q 60 112 20 93 Z M 20 51 Q 60 72 100 51", mark: "M 38 42 L 38 20 M 60 38 L 60 14 M 82 42 L 82 20" };
  if (/hot|high temperature/u.test(id)) return { id: "high-temperature", shape: "M 50 18 A 11 11 0 0 1 72 18 L 72 72 A 25 25 0 1 1 50 72 Z", mark: "M 61 38 L 61 88 M 84 37 Q 95 49 84 61 M 96 29 Q 114 49 96 69" };
  if (/pop|burst|sharp sound/u.test(id)) return { id: "sudden-burst", shape: "M 60 9 L 70 39 L 98 20 L 86 50 L 116 55 L 87 66 L 106 91 L 75 78 L 68 111 L 55 81 L 28 103 L 39 72 L 7 68 L 37 55 L 17 31 L 49 42 Z", mark: "M 24 18 L 38 35 M 96 83 L 110 101" };
  if (/animal|bird|cat|frog|dog|fish/u.test(id)) return { id: "living-creature", shape: "M 17 77 Q 17 35 58 31 Q 101 34 103 75 Q 88 98 59 98 Q 29 98 17 77 Z M 29 41 L 19 17 L 44 33 M 84 34 L 103 16 L 95 46", mark: "M 39 62 A 4 6 0 1 0 40 62 M 76 62 A 4 6 0 1 0 77 62 M 50 80 Q 60 89 71 80" };
  if (/book|page|read|story|writing/u.test(id)) return { id: "open-pages", shape: "M 10 29 Q 34 18 57 32 L 57 98 Q 35 84 10 92 Z M 63 32 Q 85 18 109 29 L 109 92 Q 84 84 63 98 Z", mark: "M 22 48 L 47 52 M 22 63 L 47 67 M 73 52 L 99 48 M 73 67 L 99 63" };
  if (/rain|storm|cloud|weather/u.test(id)) return { id: "weather", shape: "M 17 54 Q 22 31 44 34 Q 55 10 78 27 Q 105 25 108 56 Q 99 70 79 69 L 32 69 Q 20 68 17 54 Z", mark: "M 38 78 L 30 100 M 62 78 L 54 100 M 87 78 L 79 100" };
  if (/tree|plant|leaf|grow/u.test(id)) return { id: "growing-plant", shape: "M 49 103 L 54 68 Q 21 70 25 46 Q 27 28 48 30 Q 57 7 76 24 Q 99 21 104 45 Q 111 69 77 70 L 82 103 Z", mark: "M 60 95 L 65 45 M 64 62 L 44 47 M 65 56 L 84 39" };
  if (/sound|hear|buzz|clap|drum/u.test(id)) return { id: "sound-action", shape: "M 13 48 L 35 48 L 60 26 L 60 94 L 35 72 L 13 72 Z", mark: "M 72 46 Q 91 60 72 75 M 84 33 Q 115 60 84 87" };
  if (/mat|flat covering|thin|small distance/u.test(id)) return { id: "flat-object", shape: "M 12 61 L 88 28 L 108 58 L 32 96 Z", mark: "M 31 62 L 80 41 M 43 79 L 93 58" };
  if (/cup|container|drinking|cube|solid shape/u.test(id)) return { id: "container-shape", shape: "M 20 37 L 92 37 L 104 98 L 15 98 Z M 28 37 Q 29 16 49 16 L 67 16 Q 88 16 88 37", mark: "M 34 56 L 84 56 M 40 72 L 79 72" };
  if (/jam|fruit spread/u.test(id)) return { id: "fruit-jar", shape: "M 27 25 L 93 25 L 99 99 L 21 99 Z", mark: "M 22 43 L 98 43 M 40 67 Q 60 50 81 67" };
  if (/rock|stone|hard natural/u.test(id)) return { id: "stone", shape: "M 12 84 L 26 42 L 55 19 L 91 33 L 108 74 L 89 102 L 36 104 Z", mark: "M 31 69 L 49 45 L 76 51 M 67 83 L 93 70" };
  if (/bike|car|vehicle|wheels|pedals/u.test(id)) return { id: "road-vehicle", shape: "M 14 78 L 30 47 L 82 42 L 106 73 L 101 87 L 18 87 Z M 29 91 A 13 13 0 1 0 30 91 M 85 91 A 13 13 0 1 0 86 91", mark: "M 38 48 L 49 28 L 75 28 L 86 43" };
  if (/spin|turn around/u.test(id)) return { id: "turning-action", shape: "M 25 65 A 35 35 0 1 1 44 94", mark: "M 21 39 L 25 65 L 48 53" };
  if (/light|brightness/u.test(id)) return { id: "bright-light", shape: "M 60 10 L 70 37 L 99 29 L 82 54 L 108 70 L 77 71 L 77 103 L 59 79 L 37 103 L 42 72 L 11 68 L 38 52 L 21 28 L 51 37 Z", mark: "M 60 42 A 19 19 0 1 0 61 42" };
  if (/city|town|buildings/u.test(id)) return { id: "city-place", shape: "M 15 101 L 15 43 L 47 43 L 47 101 M 53 101 L 53 20 L 89 20 L 89 101 M 95 101 L 95 57 L 110 57 L 110 101", mark: "M 27 57 L 35 57 M 65 37 L 77 37 M 65 54 L 77 54" };
  if (/little|small in size/u.test(id)) return { id: "small-object", shape: "M 18 25 L 103 25 L 103 103 L 18 103 Z", mark: "M 47 54 L 74 54 L 74 79 L 47 79 Z M 28 38 L 92 38" };
  return null;
}

function pronunciationMatchesModel(pronunciation, model) {
  if (model.morphology !== null || !pronunciation) return false;
  const canonical = getPronunciation(pronunciation.id || pronunciation.word);
  if (!canonical || pronunciation !== canonical || canonical.units.length !== model.slots.length) return false;
  const availableLabels = model.rack.map(tile => tile.label);
  for (const unit of canonical.units) {
    const index = availableLabels.indexOf(unit.grapheme);
    if (index < 0) return false;
    availableLabels.splice(index, 1);
  }
  const rackById = new Map(model.rack.map(tile => [tile.id, tile]));
  return model.slots.every((slot, index) => slot.tileId === null
    || rackById.get(slot.tileId)?.label === canonical.units[index]?.grapheme);
}

function TargetCue({ model, pronunciation }) {
  if (model.visualCue.kind !== "whole_word" || !pronunciationMatchesModel(pronunciation, model)) return null;
  const canonical = pronunciation;
  const meaning = getWordMeaning(canonical.meaningId);
  if (!meaning?.reference || !["image", "action"].includes(meaning.reference.kind)) return null;
  const escapedWord = canonical.word.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  if (new RegExp(`\\b${escapedWord}\\b`, "iu").test(meaning.sense)) return null;
  const geometry = cueGeometry(meaning.reference.id, meaning.sense);
  if (!geometry) return null;
  return (
    <figure className="ss-workbench__target" role="img" aria-label={meaning.sense} data-cue-geometry={geometry.id}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path className="ss-workbench__target-shape" d={geometry.shape} />
        <path className="ss-workbench__target-mark" d={geometry.mark} />
      </svg>
    </figure>
  );
}

function SoundBox({ slot, index, label, current, morphology }) {
  const isFilled = Boolean(slot.tileId);
  const rawLabel = morphology && index === 0 ? morphology.baseWord : label;
  const visibleLabel = childGrapheme(rawLabel);
  const accessibleLabel = isFilled
    ? `Sound box ${index + 1}, ${spokenGrapheme(rawLabel)}, placed`
    : `Sound box ${index + 1}, empty`;
  return (
    <div className={`ss-workbench__sound-box ss-workbench__sound-box--${isFilled ? "filled" : "empty"}`} data-slot-state={isFilled ? "filled" : "empty"} role="img" aria-label={accessibleLabel} aria-current={current ? "step" : undefined}>
      <span className="ss-workbench__sound-box-number" aria-hidden="true">{index + 1}</span>
      <span className="ss-workbench__sound-box-mark">{visibleLabel}</span>
    </div>
  );
}

function validMorphologyModel(model) {
  const morphology = model?.morphology;
  if (!morphology || model.powerId !== "word_forge"
    || model.instructionLabel !== "Endings can change or extend a word."
    || model.visualCue?.kind !== "morphology"
    || !/^content-placement-attempt:.+:s38-morphology:0:0:challenge:0:morphology$/u.test(model.challengeId || "")
    || !exactRecord(morphology, ["kind", "baseWord", "ending", "derivedWord", "meaning"])
    || morphology.kind !== "morphology_introduction"
    || ["baseWord", "ending", "derivedWord", "meaning"].some(key => !String(morphology[key] || "").trim())
    || `${morphology.baseWord}${morphology.ending}` !== morphology.derivedWord
    || model.rack?.length !== 1
    || model.rack[0]?.id !== "morphology-ending-tile"
    || model.rack[0]?.label !== morphology.ending
    || model.slots?.length !== 2
    || model.slots[0]?.id !== "morphology-base-slot"
    || model.slots[0]?.tileId !== "morphology-base-fixed"
    || model.slots[1]?.id !== "morphology-ending-slot") return null;
  const active = model.status === "active" && model.sweep === "not_ready" && model.slots[1].tileId === null;
  const advanced = model.status === "awaiting_mission_commit"
    && model.sweep === "meaning_ready" && model.slots[1].tileId === "morphology-ending-tile";
  return active || advanced ? morphology : null;
}

function MorphologyTeaching({ morphology, ready }) {
  return (
    <section className="ss-workbench__morphology" aria-labelledby="ss-morphology-title">
      <div><p className="ss-workbench__morph-kicker">Practice only — no score</p><h3 id="ss-morphology-title">Try a word ending</h3></div>
      <div className="ss-workbench__morph-equation" aria-label={`${morphology.baseWord} plus ${morphology.ending}`}>
        <span>{morphology.baseWord}</span><span aria-hidden="true">+</span><span>{morphology.ending}</span>
      </div>
      {ready ? <p className="ss-workbench__morph-result" role="status" aria-live="polite"><strong>{morphology.derivedWord}</strong><span>{morphology.meaning}</span></p> : null}
    </section>
  );
}

function validCorrectionPresentation(value, model) {
  return exactRecord(value, CORRECTION_KEYS)
    && Object.isFrozen(value)
    && CORRECTION_MODES.has(value.mode)
    && typeof value.replayContrast === "boolean"
    && typeof value.selectedContrast === "string" && value.selectedContrast.trim()
    && typeof value.visibleText === "string" && value.visibleText.trim()
    && value.visibleText === value.spokenText
    && model.status === "active"
    && model.correction !== null
    && model.correction.mode === value.mode
    && model.correction.replayContrast === value.replayContrast
    && model.rack.some(tile => tile.label === value.selectedContrast);
}

function useVisualViewportReflow() {
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const update = () => setWidth(viewport.scale > 1 ? Math.floor(viewport.width) : null);
    update();
    viewport.addEventListener("resize", update);
    return () => viewport.removeEventListener("resize", update);
  }, []);
  return width;
}

export default function WordWorkbench({
  model,
  pronunciation = null,
  meaningPayoff = null,
  correctionPresentation = null,
  onInput,
  onReplayWholeWord,
  onReplayMeaning
}) {
  const headingId = useId();
  const visualViewportWidth = useVisualViewportReflow();
  if (!validWordForgeModel(model)) return null;
  const targetCueVisible = model.visualCue.kind === "whole_word"
    && pronunciationMatchesModel(pronunciation, model);
  const morphology = validMorphologyModel(model);
  const rackById = new Map((model?.rack || []).map(tile => [tile.id, tile]));
  const placedTileIds = new Set((model?.slots || []).map(slot => slot.tileId).filter(Boolean));
  const currentSlotIndex = (model?.slots || []).findIndex(slot => !slot.tileId);
  const interactionLocked = model?.status === "awaiting_mission_commit";
  const sweepReady = !model?.morphology && model?.sweep === "ready";
  const correction = validCorrectionPresentation(correctionPresentation, model) ? correctionPresentation : null;

  return (
    <section
      className="ss-workbench"
      aria-labelledby={headingId}
      style={{
        ...TOKEN_STYLE,
        ...(visualViewportWidth ? { width: `${visualViewportWidth}px`, marginInline: 0 } : {})
      }}
    >
      <header className={`ss-workbench__header${targetCueVisible ? "" : " ss-workbench__header--without-cue"}`}>
        <TargetCue model={model} pronunciation={pronunciation} />
        <div className="ss-workbench__instruction"><p className="ss-workbench__eyebrow">Build the sound trail</p><h2 id={headingId}>{model?.instructionLabel || "Build the word."}</h2></div>
        <button className="ss-workbench__control ss-workbench__replay" type="button" aria-label="Hear the whole word again" onClick={() => onReplayWholeWord?.()}>
          <span className="ss-workbench__speaker" aria-hidden="true">▶</span><span>Hear word</span>
        </button>
      </header>

      {morphology ? <MorphologyTeaching morphology={morphology} ready={false} /> : null}

      <div className="ss-workbench__build-zone">
        <div className="ss-workbench__slots" role="group" aria-label="Sound boxes">
          {(model?.slots || []).map((slot, index) => <SoundBox key={slot.id} slot={slot} index={index} label={rackById.get(slot.tileId)?.label} current={index === currentSlotIndex} morphology={morphology} />)}
        </div>

        <div className="ss-workbench__rack-shell">
          <p className="ss-workbench__rack-label">Choose a tile</p>
          <div className="ss-workbench__rack" role="group" aria-label="Grapheme tiles">
            {(model?.rack || []).map(tile => {
              const placed = placedTileIds.has(tile.id);
              const locked = placed || interactionLocked;
              return (
                <button
                  className="ss-workbench__tile"
                  key={tile.id}
                  type="button"
                  aria-label={`${spokenGrapheme(tile.label)} grapheme tile${placed ? ", placed" : ""}`}
                  aria-pressed={placed}
                  aria-disabled={locked}
                  onClick={() => { if (!locked) onInput?.({ type: "place_tile", tileId: tile.id }); }}
                >
                  <span aria-hidden="true">{childGrapheme(tile.label)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {sweepReady ? <button className="ss-workbench__control ss-workbench__sweep" type="button" aria-label="Sweep and read the whole word" onClick={() => onInput?.({ type: "sweep_word" })}><span className="ss-workbench__sweep-line" aria-hidden="true">→</span><span>Sweep and read</span></button> : null}
      </div>

      {correction ? <p className="ss-workbench__correction" role="status" aria-live="polite" data-correction-mode={correction.mode} data-replay-contrast={String(correction.replayContrast)} data-selected-contrast={childGrapheme(correction.selectedContrast)}>{correction.visibleText}</p> : null}
      {meaningPayoff ? <MeaningPayoff {...meaningPayoff} onReplay={onReplayMeaning} /> : null}
    </section>
  );
}
