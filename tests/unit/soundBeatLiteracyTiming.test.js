import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  soundBeatBlendCompletionAction,
  soundBeatTapFeedback
} from "../../src/utils/soundBeatTracks.js";

const enginePath = new URL("../../src/components/learn/games/games/Ps1ArcadeGame.jsx", import.meta.url);
const onboardingPath = new URL("../../src/components/learn/games/games/SoundBeatGame.jsx", import.meta.url);

test("Sound Beat accepts the visible sound regardless of beat timing", () => {
  for (const deltaMs of [-5000, -900, -20, 0, 320, 900, 5000, Number.POSITIVE_INFINITY]) {
    const feedback = soundBeatTapFeedback({ deltaMs, windowMs: 400 });
    assert.equal(feedback.advance, true, `delta ${deltaMs} did not advance`);
    assert.equal(feedback.literacyAccepted, true, `delta ${deltaMs} became a literacy error`);
    assert.ok(!/miss|wrong|fail|try again/i.test(feedback.rhythmLabel));
    assert.ok(feedback.rhythmBonus >= 0);
  }
});

test("beat accuracy changes bonus feedback, not literacy acceptance", () => {
  const onBeat = soundBeatTapFeedback({ deltaMs: 10, windowMs: 400 });
  const late = soundBeatTapFeedback({ deltaMs: 2400, windowMs: 400 });

  assert.ok(onBeat.rhythmBonus > late.rhythmBonus);
  assert.equal(onBeat.literacyAccepted, late.literacyAccepted);
  assert.equal(late.rhythmLabel, "SOUND ON!");
});

test("GO blend is always accepted and retains distinct blend feedback", () => {
  const blend = soundBeatTapFeedback({ deltaMs: 9000, windowMs: 1, isBlend: true });
  assert.equal(blend.advance, true);
  assert.equal(blend.literacyAccepted, true);
  assert.equal(blend.rhythmLabel, "BLENDED!");
});

test("a completed GO blend defers progress while the game is paused", () => {
  assert.equal(soundBeatBlendCompletionAction({ paused: true, sameTask: true }), "defer");
  assert.equal(soundBeatBlendCompletionAction({ paused: false, sameTask: true }), "advance");
  assert.equal(soundBeatBlendCompletionAction({ paused: false, sameTask: false }), "ignore");
  assert.equal(soundBeatBlendCompletionAction({ ended: true, sameTask: true }), "ignore");
});

test("Canvas engine advances only a correct literacy choice and never times it out", async () => {
  const source = await readFile(enginePath, "utf8");

  assert.match(source, /const notes = \[\.\.\.task\.item\.beats, "blend"\]/);
  assert.match(source, /soundBeatTapFeedback\(\{/);
  assert.match(source, /safeChoiceIndex !== choiceSet\.answerIndex/);
  assert.match(source, /state\.mistakes \+= 1/);
  assert.match(source, /state\.beatIndex \+= 1/);
  assert.doesNotMatch(source, /function missCurrent|autoMissWindow|currentWordClean/);
  assert.match(source, /event\.key !== " " && event\.key !== "Enter" && event\.key !== "ArrowUp"/);
  assert.match(source, /canvas\.addEventListener\("pointerdown", onPointerDown\)/);
  assert.match(source, /canvas\.addEventListener\("pointerup", onPointerUp\)/);
  assert.match(source, /canvas\.addEventListener\("pointercancel", onPointerCancel\)/);
  assert.match(source, /canvas\.addEventListener\("lostpointercapture", onLostPointerCapture\)/);
  assert.match(source, /active && !state\.reduceMotion/);
  assert.match(source, /item\.beatUnit === "phoneme"/);
  assert.match(source, /if \(isInteractiveKeyTarget\(event\.target\)\) return/);
  assert.match(source, /liveStatus\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /if \(!state\.reduceMotion\) \{\s+const burstPoint/);
  assert.match(source, /replayPrompt\(\) \{\s+speakActiveNote\(\)/);
  assert.match(source, /if \(state\.beatIndex < task\.item\.beats\.length\) void speakActiveNote\(\)/);
  assert.match(
    source,
    /async function finishBlendedWord[\s\S]*await speakCompletedTarget\(task\.item\)[\s\S]*endCurrentWord\(points\)/
  );
  assert.match(source, /state\.pendingBlendCompletion = \{ task, points \}/);
  assert.match(source, /const deferredBlend = state\.pendingBlendCompletion/);
  assert.match(source, /if \(!task \|\| state\.countdown > 0 \|\| state\.awaitingBlend\) return/);
});

test("onboarding explains that rhythm is a bonus and GO blends", async () => {
  const source = await readFile(onboardingPath, "utf8");
  assert.match(source, /Beat timing adds bonus points; only the sound choice affects learning progress\./);
  assert.match(source, /choose the matching sound pad; with sound off, match the shown model/i);
  assert.match(source, /Finish with GO to blend the whole word\./);
  assert.match(source, /aria-label="Hear the current sound again"/);
  assert.match(source, /minWidth: 56/);
  assert.match(source, /minHeight: 56/);
  assert.match(source, /if \(isInteractiveKeyTarget\(event\.target\)\) return/);
});
