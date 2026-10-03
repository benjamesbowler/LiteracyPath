import { useEffect, useState } from "react";
import { AdventureGame } from "./AdventureGame.jsx";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { WordPicture, PhonicsTargetHint } from "./PhonicsPlayShared.jsx";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { buildFactoryOuting } from "./sentenceWorkshopModel.js";
import "./phonics-sentence-worlds.css";

function SoundFactoryStage({ sort, state, isSoundEnabled }) {
  const item = sort.items[state.index] || sort.items.at(-1);
  const bins = [item.binA || sort.binA, item.binB || sort.binB];
  const [retry, setRetry] = useState(() => ({ index: state.worldSnapshot?.factoryRetryIndex, bin: state.worldSnapshot?.factoryRetryBin || "" }));
  const [mistakes, setMistakes] = useState(() => state.worldSnapshot?.factoryRetryIndex === state.index ? state.worldSnapshot?.factoryHintMistakes || 0 : 0);
  const { canHear, replay, unavailable } = useRecordedPracticeCue(item.word, isSoundEnabled && !state.paused, true, state.ownReplay);
  const busy = state.motion.phase !== "idle";
  const correct = state.motion.phase === "correct";
  const { arrivalReady, paused, finish } = state;
  // The parent result owner already waits for the readable word/audio result.
  // Completion needs no second Feed/Deliver action or running animation clock.
  useEffect(() => { if (arrivalReady && !paused) finish(); }, [arrivalReady, paused, finish]);
  const wrongBin = retry.index === state.index ? retry.bin : "";
  const feedback = correct ? `${item.word} starts with ${item.bin}. Parcel sorted!` : wrongBin ? "Listen again. Which starting sound do you hear?" : "Listen to the word. Tap its starting sound.";
  function choose(bin) {
    state.sortItem(bin);
    if (bin !== item.bin) {
      setRetry({ index: state.index, bin });
      const count = (retry.index === state.index ? mistakes : 0) + 1;
      setMistakes(count);
      state.onWorldSnapshot?.({ factoryRetryIndex: state.index, factoryRetryBin: bin, factoryHintMistakes: count });
    }
  }
  return <section className={`psw-game psw-factory${state.paused ? " is-paused" : ""}`} data-aw-mode="sort" data-aw-index={state.index} data-belt-phase={state.motion.phase} aria-label="Sound Sort Factory">
    <header className="psw-hud"><div><strong>Sort by the starting sound</strong><span>{unavailable ? "Tap Hear to try the voice again." : "Listen, then choose a chute."}</span></div><span className="psw-progress">Parcel {state.index + 1}/{sort.items.length}</span><button type="button" className="psw-replay" aria-label="Hear the word" disabled={!canHear || state.paused} onClick={() => state.ownReplay(replay())}>♪<span>Hear</span></button></header>
    <div className="psw-factory-floor">
      <img className="psw-factory-guide" src={CAST.chompy.sprite} alt="Chompy" draggable="false" />
      <div className="psw-parcel-belt" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div className={`psw-factory-parcel${correct ? " is-sorted" : ""}`} data-aw="parcel" data-word={item.word} style={{ "--parcel-side": state.motion.bin === bins[0] ? -1 : 1 }}>
        <WordPicture word={item.word} answerNeutral={!correct} />
        {correct && <strong>{item.word}</strong>}<PhonicsTargetHint word={item.word} mistakes={retry.index === state.index ? mistakes : 0} solved={correct} /><small>{correct ? "✓ Sorted" : "Ready to sort"}</small>
      </div>
      <div className="psw-chute-bank" role="group" aria-label="Starting letter chutes">{bins.map((bin, index) => <button type="button" key={bin} className={`psw-factory-chute psw-chute-${index}${state.motion.bin === bin && correct ? " is-correct" : ""}${wrongBin === bin && !correct ? " is-wrong" : ""}`} data-aw="chute" data-bin={bin} aria-label={`Sort into ${bin} chute`} disabled={state.paused || busy || state.arrivalReady} onClick={() => choose(bin)}><strong>{bin}</strong><span>starts with {bin}</span><span className="psw-chute-mouth" aria-hidden="true" /><small>{state.motion.bin === bin && correct ? "✓ Matched" : "Tap to sort"}</small></button>)}</div>
      <div className="psw-output-belt" aria-label={`${state.index} parcels sorted`}>{sort.items.slice(Math.max(0, state.index - 6), state.index).filter(parcel => correct || parcel.word !== item.word).map((parcel, index) => <span key={`${state.index}:${index}`}>✓ {parcel.word}</span>)}</div>
    </div>
    <footer className="psw-feedback" role="status" data-aw="feedback" data-feedback-kind={correct ? "success" : wrongBin ? "retry" : "guide"}>{feedback}</footer>
  </section>;
}

export default function SoundSortFactory(props) {
  return <AdventureGame {...props} title="Sound Sort Factory" mode="sort" stageComponents={{ sort: SoundFactoryStage }} roundBuilders={{ sort: buildFactoryOuting }} />;
}
