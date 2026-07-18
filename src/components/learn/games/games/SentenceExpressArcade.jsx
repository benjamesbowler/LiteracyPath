import { useEffect, useRef, useState } from "react";
import SentenceExpressGame from "./SentenceExpressGame.jsx";
import { LEVELS_PER_LINE, buildLevel } from "../../../../utils/sentenceExpressLevels.js";

// First-run onboarding is remembered per device; storage can be denied
// (private mode), in which case the intro simply shows again next session.
const ONBOARD_KEY = "lp-arcade-onboarded-v1:sentence-express";

function readOnboarded() {
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return false;
  }
}

function markOnboarded() {
  try {
    window.localStorage.setItem(ONBOARD_KEY, "1");
  } catch {
    /* onboarding is optional */
  }
}

// Static card (no animated intro) so prefers-reduced-motion is respected.
// Ticket-stub styling echoes the game's sx palette (parchment/ink/brass).
const onboardScrimStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1, // below GamePlayer's quit/resume dialogs (z-index 2)
  display: "grid",
  placeItems: "center",
  background: "rgba(16,21,29,.72)",
  padding: 20,
  cursor: "pointer",
  fontFamily: "var(--kid-font-display, Fredoka, sans-serif)"
};

const onboardPanelStyle = {
  width: "min(100%, 450px)",
  background: "#fdf6e3",
  border: "3px solid #10151d",
  borderRadius: 14,
  boxShadow: "6px 6px 0 rgba(10,15,24,.4)",
  color: "#10151d",
  padding: "22px 26px",
  textAlign: "center"
};

function SentenceExpressOnboarding({ onStart }) {
  useEffect(() => {
    const onKey = event => {
      if (event.key === "Escape") return; // GamePlayer owns Esc (quit dialog).
      onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to play Sentence Express"
      style={onboardScrimStyle}
      onClick={onStart}
    >
      <div style={onboardPanelStyle}>
        <div style={{ fontWeight: 900, fontSize: "1.25rem", letterSpacing: "1.5px", textTransform: "uppercase" }}>
          Sentence Express
        </div>
        <div style={{ width: 72, height: 4, margin: "10px auto 0", background: "#f4b942", borderRadius: 2 }} aria-hidden="true" />
        <p style={{ margin: "12px 0 0", fontWeight: 700, fontSize: "1rem", lineHeight: 1.4 }}>
          Rebuild the sentence train: couple the word cars in order!
        </p>
        <div style={{ marginTop: 14, display: "grid", gap: 8, textAlign: "left", fontWeight: 600, fontSize: ".88rem", lineHeight: 1.45 }}>
          <span>Listen to the station master, then click or tap the word cars in order.</span>
          <span>Swap the rusty car and load the missing crate when they roll in.</span>
          <span>Pick the capital engine and the right end-mark caboose ( . ! ? ).</span>
        </div>
        <div style={{
          marginTop: 18,
          display: "inline-block",
          background: "linear-gradient(#ffd76a,#dfa32c)",
          border: "3px solid #10151d",
          borderRadius: 12,
          padding: "8px 22px",
          fontWeight: 900,
          fontSize: "1rem"
        }}>
          Tap to play
        </div>
        <div style={{ marginTop: 8, fontSize: ".74rem", fontWeight: 700, color: "rgba(16,21,29,.6)" }}>
          or press any key
        </div>
      </div>
    </div>
  );
}

/* GamePlayer-contract adapter for Sentence Express.
   The game reports {level, stars, mistakes, express} after EVERY level and
   calls onQuit once when the 10-level line is finished; the arcade expects
   one onComplete(stars, score, words) for the whole run. This wrapper
   accumulates the run and translates. The internal quit button is hidden
   (showQuit=false) so GamePlayer's own close is the only early exit -
   matching every other arcade game (early exit = no completion recorded,
   but per-level checkpoints still allow resuming).
   Resume: GamePlayer restarts a checkpointed run at startLevel, so only the
   remaining levels (LEVELS_PER_LINE - startLevel) are played this session;
   completion - and the word tally - are measured against those, not the
   full line, or a resumed run could never finish nor clear its checkpoint. */
export default function SentenceExpressArcade({
  difficulty,
  startLevel,
  onScoreUpdate,
  onProgressUpdate,
  onComplete,
  onCheckpoint,
  onEngineReady,
  isSoundEnabled
}) {
  const start = Math.max(0, Math.min(LEVELS_PER_LINE - 1, Number(startLevel) || 0));
  const runRef = useRef({ score: 0, starSum: 0, levelsDone: 0, words: 0 });
  // First-run intro: the game mounts only after dismissal, so gameplay is
  // trivially frozen behind the overlay (no rAF, timers, or audio can run).
  const [introOpen, setIntroOpen] = useState(() => !readOnboarded());

  if (introOpen) {
    return (
      <SentenceExpressOnboarding
        onStart={() => {
          markOnboarded();
          setIntroOpen(false);
        }}
      />
    );
  }

  return (
    <SentenceExpressGame
      difficulty={difficulty}
      startLevel={start}
      isSoundEnabled={isSoundEnabled}
      showQuit={false}
      onEngineReady={onEngineReady}
      onComplete={result => {
        const run = runRef.current;
        run.levelsDone += 1;
        run.starSum += Math.max(0, Number(result?.stars) || 0);
        run.score += (Math.max(0, Number(result?.stars) || 0) * 10) + (Math.max(0, Number(result?.express) || 0) * 5);
        // Levels are deterministic: rebuild the one just finished to count
        // the train words the child actually coupled.
        run.words += buildLevel(difficulty, Number(result?.level) || 0)
          .trains.reduce((sum, t) => sum + t.words.length, 0);
        onScoreUpdate?.(run.score);
        onProgressUpdate?.(Math.min(start + run.levelsDone, LEVELS_PER_LINE), LEVELS_PER_LINE);
        onCheckpoint?.(Math.min((Number(result?.level) || 0) + 1, LEVELS_PER_LINE - 1), LEVELS_PER_LINE);
      }}
      onQuit={() => {
        const run = runRef.current;
        if (run.levelsDone >= LEVELS_PER_LINE - start) {
          // Shared rubric: finishing the whole line is worth at least 1 star.
          const stars = Math.max(1, Math.round(run.starSum / run.levelsDone));
          onComplete?.(stars, run.score, run.words);
        }
      }}
    />
  );
}
