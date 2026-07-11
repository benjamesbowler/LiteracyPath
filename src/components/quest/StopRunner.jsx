// THE STOP RUNNER — the only thing that owns progress.
//
// Sequences: Teach -> shells -> the Gate -> Reward. Every response funnels
// through ONE handler here, which is the only place mastery is ever written.
// The shells stay dumb; if they didn't, a bug in the tenth shell would silently
// corrupt a child's record and we wouldn't find it for a month.
//
// A CHECKPOINT IS WRITTEN AFTER EVERY SHELL, not every stop. Losing a
// 90-second shell is a shrug. Losing a 12-minute stop is a child who doesn't
// come back.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParallaxScene from "./ParallaxScene.jsx";
import CreatureFigure from "./CreatureFigure.jsx";
import KnowledgeTree from "./shells/KnowledgeTree.jsx";
import SoundStones from "./shells/SoundStones.jsx";
import BeastFeed from "./shells/BeastFeed.jsx";
import StoneBridge from "./shells/StoneBridge.jsx";
import EchoCave from "./shells/EchoCave.jsx";
import WordBeast from "./shells/WordBeast.jsx";
import SoundSort from "./shells/SoundSort.jsx";
import TrailRun from "./shells/TrailRun.jsx";
import TrailSigns from "./shells/TrailSigns.jsx";
import StoryStones from "./shells/StoryStones.jsx";
import GateCheck from "./shells/GateCheck.jsx";
import { buildStop } from "../../utils/questRounds.js";
import { makeCatchUp } from "../../utils/catchUpQueue.js";
import { starRubric } from "../../utils/starRubric.js";
import { targetsForStop } from "../../utils/questReviewScheduler.js";
import { getStop, targetsAtStop } from "../../data/questSequence.js";

// All nine playable shells. A stop that asks for one with no rounds available
// (a Sound Sort at a stop with nothing to sort, a Word Beast at a stop with no
// heart words) simply SKIPS it rather than showing an empty screen.
const SHELLS = {
  "sound-stones": SoundStones,
  "beast-feed": BeastFeed,
  "trail-run": TrailRun,
  "stone-bridge": StoneBridge,
  "echo-cave": EchoCave,
  "sound-sort": SoundSort,
  "word-beast": WordBeast,
  "trail-signs": TrailSigns,
  "story-stones": StoryStones
};

const PHASES = { TEACH: "teach", SHELL: "shell", GATE: "gate" };

export default function StopRunner({
  stopId,
  state,
  resume = null,
  isSoundEnabled = true,
  onAnswer,          // (target, correct, shell)
  onCheckpoint,      // ({ stopId, phase, shellIndex, roundIndex })
  onFinish,          // (stars, tally)
  onQuit
}) {
  const stop = getStop(stopId);

  // Targets = what this stop teaches + what the review scheduler says is due.
  const targets = useMemo(
    () => targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1),
    [stopId, state.mastery, stop]
  );

  // Seeded on the stop AND on how many stops the child has done, so a replay is
  // not the identical quiz — but a crash mid-stop resumes the SAME quiz.
  const seed = useMemo(
    () => (stop?.index || 1) * 1000 + (state.trail.stopsDone.length || 0),
    [stop, state.trail.stopsDone.length]
  );

  const built = useMemo(() => buildStop(stopId, { mastery: state.mastery, targets, seed }), [stopId, state.mastery, targets, seed]);

  const playable = useMemo(
    () => (stop?.shells || []).filter(id => SHELLS[id] && (built?.rounds[id] || []).length),
    [stop, built]
  );

  const [phase, setPhase] = useState(resume?.phase || PHASES.TEACH);
  const [shellIndex, setShellIndex] = useState(resume?.shellIndex ?? 0);
  const [roundIndex, setRoundIndex] = useState(0);
  // `attempt` exists because of a real hole the linter walked me into: when a
  // shell is down to its last target and the child MISSES it, the catch-up queue
  // re-serves the SAME round index. Key the shell on roundIndex alone and the
  // component never remounts — the child is left staring at their own wrong
  // answer with every button disabled. Bumping this on every round guarantees a
  // fresh mount, which is also what resets the shell's internal state.
  const [attempt, setAttempt] = useState(0);
  // The creature's mood is RENDERED, so it must be state — a ref read during
  // render is both a lint error and a real staleness bug: the creature would
  // keep whatever face it had at the last unrelated re-render.
  const [mood, setMood] = useState("idle");
  const tally = useRef({ correct: 0, total: 0, mistakes: 0 });

  const shellId = playable[shellIndex];
  const rounds = shellId ? built.rounds[shellId] : [];

  // The catch-up queue: a missed target comes BACK, three places later, and the
  // shell does not end until every target — including the recovered ones — is
  // done. Already written, already tested; we don't write a second one.
  const catchUp = useRef(null);
  useEffect(() => {
    catchUp.current = makeCatchUp(rounds.map((_, i) => i), { requeueGap: 3 });
    setRoundIndex(catchUp.current.peek() ?? 0);
  }, [shellId, rounds.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkpoint = useCallback((nextPhase, nextShell) => {
    onCheckpoint?.({ stopId, phase: nextPhase, shellIndex: nextShell });
  }, [onCheckpoint, stopId]);

  // ONE response in, zero-or-many mastery writes out.
  //
  //   a string  -> one grapheme (Sound Stones, Beast Feed, Trail Run, the Gate)
  //   an array  -> every grapheme in the word (Stone Bridge, Echo Cave): blending
  //                "sat" correctly proves s, a AND t, and crediting only the
  //                first one threw away two thirds of the evidence
  //   null      -> no mastery at all (Trail Signs, Story Stones). Reading an
  //                instruction is comprehension, not a grapheme response; writing
  //                it into the mastery map would put a stone carved "rock" in
  //                front of a child and ask which one makes that sound.
  //
  // The tally still counts every response either way, so the star rubric is
  // honest even for the shells that score no mastery.
  const record = useCallback((correct, target) => {
    tally.current.total += 1;
    if (correct) tally.current.correct += 1;
    else tally.current.mistakes += 1;

    if (target == null) return;
    const shell = phase === PHASES.GATE ? "gate" : shellId;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) onAnswer?.(one, correct, shell);
    }
  }, [onAnswer, phase, shellId]);

  const nextRound = useCallback(() => {
    const queue = catchUp.current;
    if (!queue) return;

    // The LAST answer decides whether this round is done or comes back. We read
    // it from the tally rather than threading it through — the shell has already
    // told us via onAnswer.
    const wasCorrect = tally.current.lastCorrect !== false;
    if (wasCorrect) queue.complete();
    else queue.miss();
    tally.current.lastCorrect = undefined;

    setAttempt(n => n + 1);

    if (queue.isDone) {
      const next = shellIndex + 1;
      if (next < playable.length) {
        setShellIndex(next);
        checkpoint(PHASES.SHELL, next);
      } else {
        setPhase(PHASES.GATE);
        checkpoint(PHASES.GATE, next);
      }
      return;
    }
    setRoundIndex(queue.peek());
  }, [shellIndex, playable.length, checkpoint]);

  const answer = useCallback((correct, target) => {
    tally.current.lastCorrect = correct;
    // A wrong answer makes the creature sad for a beat. It NEVER makes it fail:
    // there is no fail state in this mode, and the face is the only place the
    // child is told "not that one".
    setMood(correct ? "cheer" : "sad");
    record(correct, target);
  }, [record]);

  function finishGate() {
    const t = tally.current;
    const stars = starRubric({ correct: t.correct, total: t.total, mistakes: t.mistakes, deaths: 0 });
    onFinish?.(stars, { ...t });
  }

  if (!stop || !built) return null;

  const Shell = shellId ? SHELLS[shellId] : null;
  const round = rounds[roundIndex];
  const world = stop.world;

  return (
    <div className="q-screen q-stop">
      <ParallaxScene world={world} offset={12} className="q-stop-scene">
        <div className="q-stop-creature">
          <CreatureFigure key={`${mood}-${attempt}`} creature={state.creature} size={96} mood={mood} />
        </div>
      </ParallaxScene>

      <header className="q-stop-bar">
        <button type="button" className="q-ghost q-quit" onClick={onQuit} aria-label="Leave this stop">Leave</button>
        <span className="q-stop-name">{stop.name}</span>
        <span className="q-pips" aria-label="progress through this stop">
          {[PHASES.TEACH, ...playable, PHASES.GATE].map((id, i) => {
            const at = phase === PHASES.TEACH ? 0
              : phase === PHASES.GATE ? playable.length + 1
                : shellIndex + 1;
            return <span key={`${id}-${i}`} className={i <= at ? "is-on" : ""} />;
          })}
        </span>
      </header>

      <main className="q-stop-body">
        {phase === PHASES.TEACH && (
          <KnowledgeTree
            entries={built.teach}
            isSoundEnabled={isSoundEnabled}
            onDone={() => { setPhase(PHASES.SHELL); checkpoint(PHASES.SHELL, 0); }}
          />
        )}

        {phase === PHASES.SHELL && Shell && round && (
          <Shell
            key={`${shellId}-${roundIndex}-${attempt}`}
            round={round}
            isSoundEnabled={isSoundEnabled}
            onAnswer={answer}
            onNext={nextRound}
          />
        )}

        {phase === PHASES.GATE && (
          <GateCheck
            rounds={built.rounds.gate}
            isSoundEnabled={isSoundEnabled}
            onAnswer={answer}
            onDone={finishGate}
          />
        )}
      </main>
    </div>
  );
}
