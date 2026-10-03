import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import { useMemo, useRef, useState } from "react";
import { buildPhonicsBlendMissions, shuffleBuildingChoices as shuffle } from "./phonicsBuildingRounds.js";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { speakWord } from "../../../../utils/learnGamesAudio.js";
import { gameRandom } from "../../../../utils/gameReplay.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { WordPicture } from "./PhonicsPlayShared.jsx";
import { useStageSnapshot, useResumeTransition } from "./phonicsSession.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { BuildingScene } from "./CVCWordBuilder.jsx";
import "./phonics-building.css";

export function BlendWorkshopStage({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const mission = state.missions[round], targets = mission.targets || [mission.word];
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const [built, setBuilt] = useState(resume?.built || []);
  const [onset, setOnset] = useState(resume?.finished ? resume?.onset || "" : "");
  const [wrong, setWrong] = useState(resume?.wrong || "");
  const [hintMistakes, setHintMistakes] = useState(resume?.attempts || 0);
  const [heldTarget, setHeldTarget] = useState("");
  const [finished, setFinished] = useState(Boolean(resume?.finished));
  const busy = useRef(Boolean(resume?.finished)), attempts = useRef(resume?.attempts || 0), builtRef = useRef(built);
  const target = heldTarget || targets.find(word => !built.includes(word)) || targets.at(-1);
  const options = useMemo(() => {
    const existing = resume?.options?.map(item => typeof item === "string" ? item : item.grapheme);
    if (existing?.length) return existing;
    const real = [...new Set(mission.familyWords.map(word => word.slice(0, -mission.rime.length)))];
    const random = state.sessionSeed ? gameRandom(`${state.sessionSeed}:${state.rerollKey || 0}:${round}:onset-bank`) : Math.random;
    const extra = shuffle(["b", "m", "s", "p", "sh", "ch", "tr", "cl"].filter(part => !real.includes(part)), random).slice(0, Math.max(0, 3 - real.length));
    return shuffle([...real, ...extra], random);
  }, [mission, resume, state.sessionSeed, state.rerollKey, round]);
  const { canHear, replay } = useRecordedPracticeCue(target, isSoundEnabled && !paused, true, ownReplay);
  function join(part) {
    if (paused || busy.current) return;
    const word = part + mission.rime, accepted = word === target;
    setOnset(part);
    recordFirstResponse({ ...practiceEvidence("onset_rime_construction", ["picture_cue", "recorded_word_cue", "visible_rime"]), game: "blend-family", round: `${round}:${builtRef.current.length}`, target, response: word, correct: accepted });
    if (!accepted) {
      attempts.current += 1; setHintMistakes(attempts.current); miss(); setWrong(`${part} + ${mission.rime} makes ${word}. Listen again. Try a different beginning.`);
      if (isSoundEnabled) void speakWord(target);
      return;
    }
    busy.current = true; setWrong(""); setHeldTarget(word);
    const next = [...builtRef.current, word]; builtRef.current = next; setBuilt(next);
    addScore(12); onDiscover({ id: `family-${round}-${word}`, word });
    if (attempts.current) recordAssistedRetry({ game: "blend-family", round: `${round}:${next.length - 1}`, target: word, attempts: attempts.current, supportUsed: ["rime_contrast", "reversible_onset"] });
    attempts.current = 0; setHintMistakes(0);
    const isLast = next.length >= targets.length;
    if (isLast) { setFinished(true); setCorrect(correct + 1); }
    holdResult(() => {
      if (isLast) { if (round + 1 >= state.total) finish(correct + 1); else setRound(round + 1); }
      else { setHeldTarget(""); setOnset(""); busy.current = false; }
    }, LEARNING_PACE.word, () => isSoundEnabled ? speakWord(word) : undefined);
  }
  useStageSnapshot(() => ({ onset, built, wrong, finished, options, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.finished, () => round + 1 >= state.total ? finish(correct) : setRound(round + 1), schedule, LEARNING_PACE.word);
  return <BuildingScene kind="family" difficulty={difficulty} prompt={heldTarget ? `${heldTarget} built!` : "Build the word"} instruction={`Tap a beginning. Keep the ${mission.rime} ending.`} target={target} paused={paused} progress={correct} total={state.total} canHear={canHear} replay={replay} feedback={wrong || (heldTarget ? `${onset} + ${mission.rime} = ${heldTarget}!` : `Which beginning joins ${mission.rime} to match the picture?`)} collection={discovered} solved={Boolean(heldTarget)} mistakes={hintMistakes}>
    <div className="pb-family-display" aria-label="Words in this collection">{targets.map(word => <div className={`pb-family-object${built.includes(word) ? " is-built" : ""}${word === target ? " is-current" : ""}`} key={word}><WordPicture word={word} answerNeutral={!built.includes(word)} /><strong>{built.includes(word) ? word : "?"}</strong>{built.includes(word) && <span aria-label="Built">✓</span>}</div>)}</div>
    <div className={`pb-workbench pb-blend-bench${heldTarget ? " is-complete" : ""}`}>
      <div className="pb-join-row"><span className="pb-onset-space">{onset || "?"}</span><span aria-hidden="true">+</span><strong className="pb-rime" data-rime={mission.rime}>{mission.rime}</strong><span aria-hidden="true">=</span><strong className="pb-blended-word">{heldTarget || "…"}</strong></div>
      <div className="pb-piece-bank" role="group" aria-label="Beginning sound tiles">{options.map(part => <button type="button" className="pb-tile" data-onset={part} key={part} disabled={paused || Boolean(heldTarget) || finished} onClick={() => join(part)} aria-label={`Join ${part} to ${mission.rime}`}>{part}</button>)}</div>
    </div>
  </BuildingScene>;
}

export default function BlendAndBuild(props) {
  return <ArcadePracticeGame {...props} title="Blend & Build" mode="family" stageComponents={{ family: BlendWorkshopStage }} roundBuilders={{ family: buildPhonicsBlendMissions }} />;
}
