import "../styles/phonics.css";
import { PhonicsLearnTab } from "./learn/phonics/PhonicsLearnTab";

export function PhonicsLearnPage({
  initialIsland = "letters",
  initialStep = 1,
  progressScopeKey = "default"
}) {
  return (
    <main
      className="learn-area-page phonics-learn-page"
      aria-label="Phonics Learning"
      data-child-surface={initialIsland === "games" ? "arcade" : "phonics"}
    >
      <section className="phonics-tab-shell" aria-label="Phonics">
        <PhonicsLearnTab
          key={`${progressScopeKey}-${initialIsland}`}
          initialIsland={initialIsland}
          initialStep={initialStep}
          progressScopeKey={progressScopeKey}
        />
      </section>
    </main>
  );
}
