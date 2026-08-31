import "../styles/phonics.css";
import { PhonicsLearnTab } from "./learn/phonics/PhonicsLearnTab";

export function PhonicsLearnPage({
  initialIsland = "letters",
  initialStep = 1,
  leaderboardClient,
  lockedToLetters = false,
  lockedGameId = null,
  onLockedGameAvailabilityChange = null,
  progressScopeKey = "default"
}) {
  const exactGameLock = lockedGameId !== null;
  const resolvedInitialIsland = exactGameLock ? "games" : lockedToLetters ? "letters" : initialIsland;
  return (
    <main
      className="learn-area-page phonics-learn-page"
      aria-label="Phonics Learning"
      data-child-surface={resolvedInitialIsland === "games" ? "arcade" : "phonics"}
    >
      <section className="phonics-tab-shell" aria-label="Phonics">
        <PhonicsLearnTab
          key={`${progressScopeKey}-${resolvedInitialIsland}-${lockedToLetters ? "locked" : "open"}-${exactGameLock ? String(lockedGameId || "missing") : "all"}`}
          initialIsland={resolvedInitialIsland}
          initialStep={initialStep}
          leaderboardClient={leaderboardClient}
          lockedToLetters={lockedToLetters}
          lockedGameId={lockedGameId}
          onLockedGameAvailabilityChange={onLockedGameAvailabilityChange}
          progressScopeKey={progressScopeKey}
        />
      </section>
    </main>
  );
}
