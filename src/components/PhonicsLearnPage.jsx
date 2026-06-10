import "../styles/phonics.css";
import { PhonicsLearnTab } from "./learn/phonics/PhonicsLearnTab";

export function PhonicsLearnPage({ progressScopeKey = "default" }) {
  return (
    <main className="learn-area-page phonics-learn-page" aria-label="Phonics Learning">
      <section className="phonics-tab-shell" aria-label="Phonics">
        <PhonicsLearnTab key={progressScopeKey} progressScopeKey={progressScopeKey} />
      </section>
    </main>
  );
}
