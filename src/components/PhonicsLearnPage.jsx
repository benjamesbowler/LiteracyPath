import "../styles/phonics.css";
import { PhonicsLearnTab } from "./learn/phonics/PhonicsLearnTab";

export function PhonicsLearnPage({
  initialIsland = "letters",
  initialStep = 1,
  lockedToLetters = false,
  progressScopeKey = "default"
}) {
  const resolvedInitialIsland = lockedToLetters ? "letters" : initialIsland;
  return (
    <main
      className="learn-area-page phonics-learn-page"
      aria-label="Phonics Learning"
      data-child-surface={resolvedInitialIsland === "games" ? "arcade" : "phonics"}
    >
      <section className="phonics-tab-shell" aria-label="Phonics">
        <PhonicsLearnTab
          key={`${progressScopeKey}-${resolvedInitialIsland}-${lockedToLetters ? "locked" : "open"}`}
          initialIsland={resolvedInitialIsland}
          initialStep={initialStep}
          lockedToLetters={lockedToLetters}
          progressScopeKey={progressScopeKey}
        />
      </section>
    </main>
  );
}
