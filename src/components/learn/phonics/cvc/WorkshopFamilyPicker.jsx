import { cvcWordFamilies } from "../../../../data/cvcWordFamilies.js";
import { WordImage } from "../components/WordImage.jsx";
import { makeCvcWordModels } from "./cvcHelpers.js";

export function WorkshopFamilyPicker({ progress = {}, onSelectFamily }) {
  const completedCount = cvcWordFamilies.filter(family => progress[family.id] === "completed").length;
  return <section className="cvc-picker" aria-labelledby="word-workshop-title">
    <header className="cvc-picker-hero"><div><h1 id="word-workshop-title" data-child-title="">Words</h1><p data-child-instruction="">Choose any word family. Listen, build and change words.</p></div></header>
    <div className="cvc-family-grid" role="group" aria-label="All word families" data-child-choices="" data-child-primary="">
      {cvcWordFamilies.map(family => {
        const status = progress[family.id] || "default";
        const label = status === "completed" ? "Complete" : status === "inprogress" ? "Try again" : "Play";
        const words = makeCvcWordModels(family.buildWords.slice(0, 3), family);
        return <button key={family.id} type="button" className={`cvc-family-card ${status}`} onClick={() => onSelectFamily(family)} aria-label={`${family.rime} word family, ${label}`} data-child-emphasis="choice">
          <span className="cvc-family-rime">-{family.rime}</span>
          <span className="cvc-family-images" aria-hidden="true">{words.map(model => <span className="cvc-family-thumb" key={model.word}><WordImage src={model.image} word={model.word} /></span>)}</span>
          <span className="cvc-family-examples">{family.buildWords.join(" · ")}</span>
          <span className="cvc-family-state">{status === "completed" && <span aria-hidden="true">✓ </span>}{label}<span aria-hidden="true"> →</span></span>
        </button>;
      })}
    </div>
    <p className="cvc-picker-progress" data-child-progress="">{completedCount} of {cvcWordFamilies.length} word families complete</p>
  </section>;
}
