import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { speakWithBrowser } from "../../src/utils/audio/speakWithBrowser.js";
import { hasPhonicsAudioSource } from "../../src/hooks/usePhonicsAudio.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../../src/data/ledaProductionAudio.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function source(relativePath) {
  return readFile(resolve(ROOT, relativePath), "utf8");
}

test("gold voice policy stays recorded-only across shared phonics and login audio", async () => {
  assert.equal(speakWithBrowser("never synthesize this"), false);
  for (const digraph of ["wh", "ck", "ng"]) {
    assert.equal(hasPhonicsAudioSource(`/audio/phonemes/${digraph}.mp3`), true, `${digraph} needs recorded reinforcement`);
  }
  for (const reviewed of ["sh", "ch", "th-unvoiced", "th-voiced"]) {
    assert.equal(
      hasPhonicsAudioSource(`/audio/phonemes/reviewed/${reviewed}.mp3`),
      true,
      `${reviewed} must use its human-ear approved recording`
    );
  }
  assert.equal(hasPhonicsAudioSource(getLedaInstructionAudioPath("Great job")), true);
  assert.equal(hasPhonicsAudioSource(getLedaWordAudioPath("tap")), true);
  assert.equal(hasPhonicsAudioSource(getLedaInstructionAudioPath("Listen and find")), true);
  assert.equal(hasPhonicsAudioSource("generated:phoneme:a"), false);
  assert.equal(hasPhonicsAudioSource("/audio/phonemes/not-a-real-clip.mp3"), false);

  const [browserFallback, phonicsHook, loginFlow, stepTracer] = await Promise.all([
    source("src/utils/audio/speakWithBrowser.js"),
    source("src/hooks/usePhonicsAudio.js"),
    source("src/components/StudentLoginFlow.jsx"),
    source("src/components/learn/phonics/components/learning/StepTracer.jsx")
  ]);
  for (const [name, text] of Object.entries({ browserFallback, phonicsHook, loginFlow })) {
    assert.doesNotMatch(text, /SpeechSynthesisUtterance|createOscillator/, `${name} reintroduced synthetic speech`);
  }
  assert.match(phonicsHook, /AUDIO_FILE_PATHS\.has\(src\)/);
  assert.match(loginFlow, /AUDIO_FILE_PATHS\.has\(src\)/);
  assert.doesNotMatch(loginFlow, /speakWithBrowser/);
  assert.doesNotMatch(loginFlow, /\/audio\/ui\/voice\//);
  assert.match(loginFlow, /getLedaInstructionAudioPath\(text\)/);
  for (const text of [
    "Ask your teacher for the class code.",
    "Who are you?",
    "Tap your three secret pictures.",
    "That did not match.",
    "Try again",
    "Ask your teacher for help."
  ]) {
    assert.equal(
      hasPhonicsAudioSource(getLedaInstructionAudioPath(text) || getLedaWordAudioPath(text)),
      true,
      `login prompt must use recorded Leda audio: ${text}`
    );
  }
  const tracerInstructionSources = [
    ["Watch me first", "WATCH_ME_FIRST_AUDIO"],
    ["Start at the top", "START_AT_TOP_AUDIO"],
    ["Now you try", "NOW_YOU_TRY_AUDIO"]
  ];
  for (const [text, constantName] of tracerInstructionSources) {
    const src = getLedaInstructionAudioPath(text);
    assert.equal(hasPhonicsAudioSource(src), true, `tracer instruction ${src} must be manifest-backed`);
    assert.match(stepTracer, new RegExp(`${constantName} = getLedaInstructionAudioPath`));
  }
  assert.doesNotMatch(stepTracer, /usePhonicsAudio\(\s*""/, "tracer instructions still route an empty source into the audio hook");
  assert.match(stepTracer, /playCueSequence\(\[WATCH_ME_FIRST_AUDIO, START_AT_TOP_AUDIO\]/);
  assert.match(stepTracer, /playCueAudio\(NOW_YOU_TRY_AUDIO\)/);

  const productionFiles = [
    "src/components/guided-reading/GuidedReadingPage.jsx",
    "src/components/StudentLoginFlow.jsx",
    "src/hooks/usePhonicsAudio.js",
    "src/utils/audio/speakWithBrowser.js"
  ];
  for (const relativePath of productionFiles) {
    const text = await source(relativePath);
    assert.doesNotMatch(text, /SpeechSynthesisUtterance|speechSynthesis\.speak\(/, `${relativePath} reintroduced browser TTS`);
  }
});

test("Sound Racer retains its one-shot, cleanup, cache, static-overlay, and reduced-motion guards", async () => {
  const racer = await source("src/components/learn/games/games/SoundRacerGame.jsx");
  assert.match(racer, /if \(completionSent\) return;/);
  assert.match(racer, /doneButton\.disabled = true/);
  assert.match(racer, /registerCleanup: cleanup => startupCleanups\.push\(cleanup\)/);
  assert.match(racer, /disposeRenderer\(renderer, \{ forceContextLoss: true \}\)/);
  assert.match(racer, /textureCanvasCache = new Map\(\)/);
  assert.match(racer, /prewarmMapTextures\(levelIdx \+ 1\)/);
  assert.match(racer, /if \(!pausedFrameRendered\)/);
  assert.match(racer, /playerZ \+= speed \* dt \* \(reduceMotion \? 0\.55 : 1\)/);
  assert.match(racer, /const opticalFlowScale = reduceMotion \? 0\.45 : 1/);
  assert.match(racer, /if \(!activates\) return;[\s\S]*event\.preventDefault\(\)/);
  assert.match(racer, /getLedaInstructionAudioPath\("Great job"\)/);
  assert.match(racer, /buildSoundRacerTutorial\(track, \{ hasRecordedAudio: hasRecordedSpeech \}\)/);
  assert.match(racer, /data-sr="tutorial-phonics" aria-label="Sound example"/);
  assert.match(racer, /data-sr="tutorial-motor" aria-label="How to steer"/);
  assert.match(racer, /data-sr="intro-hear"/);
  assert.match(racer, /speakPhoneme\(tutorial\.target\)[\s\S]*speakWord\(tutorial\.exampleWord\)/);
  assert.doesNotMatch(racer, />S<\/span>[\s\S]*>sun<\/span>/);
});

test("Sound Safari reduces actual critter travel and follows live OS motion changes", async () => {
  const safari = await source("src/components/learn/games/games/SoundSafariArcadeGame.jsx");
  assert.match(safari, /let reduceMotion = motionQuery\?\.matches \?\? prefersReducedMotion\(\)/);
  assert.match(safari, /const syncReducedMotion = event => \{ reduceMotion = Boolean\(event\.matches\); \}/);
  assert.match(safari, /motionQuery\?\.addEventListener\?\.\("change", syncReducedMotion\)/);
  assert.match(safari, /motionQuery\?\.removeEventListener\?\.\("change", syncReducedMotion\)/);
  assert.match(safari, /const motionDt = reduceMotion \? dt \* 0\.35 : dt/);
  assert.match(safari, /critter\.x \+= critter\.vx \* motionDt/);
  assert.match(safari, /critter\.y \+= critter\.vy \* motionDt/);
  assert.match(safari, /function onPointerDown\(event\)[\s\S]*captureAt\(point\.x, point\.y\)/);
  assert.match(safari, /drawNet\(ctx, state, theme, w, h, images\.net\)/);
});

test("Sentence Grove offers named hold-safe movement buttons as an alternative to drag steering", async () => {
  const grove = await source("src/components/learn/games/games/StarGalleryArcadeGame.jsx");
  for (const name of ["Move forward", "Move back", "Turn left", "Turn right", "Cut the nearby answer tree"]) {
    assert.match(grove, new RegExp(`aria-label="${name}"`));
  }
  assert.match(grove, /bindTouchButton\(nodes\.moveForward, "up"\)/);
  assert.match(grove, /bindTouchButton\(nodes\.moveBack, "down"\)/);
  assert.match(grove, /bindTouchButton\(nodes\.turnLeft, "left"\)/);
  assert.match(grove, /bindTouchButton\(nodes\.turnRight, "right"\)/);
  assert.match(grove, /addEventListener\("pointercancel", up\)/);
  assert.match(grove, /addEventListener\("lostpointercapture", up\)/);
});

test("every 3D arcade surface re-probes quality on resize and motion changes", async () => {
  const files = [
    "src/components/learn/games/games/RocketRunGame.jsx",
    "src/components/learn/games/games/SoundRacerGame.jsx",
    "src/components/learn/games/games/StarGalleryArcadeGame.jsx",
    "src/components/learn/games/games/GrammarGrindGame.jsx"
  ];
  for (const relativePath of files) {
    const text = await source(relativePath);
    assert.match(text, /let qualityTier = detectQualityTier\(\)/, `${relativePath} freezes its initial tier`);
    assert.match(text, /function reassessQualityTier\(\)/, `${relativePath} lacks a live re-probe`);
    assert.match(text, /onResize:\s*(?:reassessQualityTier|handleResize|\(\)\s*=>[\s\S]{0,180}reassessQualityTier)/, `${relativePath} does not re-probe after resize`);
    if (/onResize:\s*handleResize/.test(text)) {
      assert.match(text, /const handleResize = \(\) => \{\s*reassessQualityTier\(\)/);
    }
    assert.match(text, /addEventListener\?\.\("change", syncMotionPreference\)/, `${relativePath} ignores a live motion change`);
    assert.match(text, /removeEventListener\?\.\("change", syncMotionPreference\)/, `${relativePath} leaks its motion probe`);
  }
});

test("shared confetti subscribes to live OS motion and cleans up", async () => {
  const confetti = await source("src/components/learn/games/shared/ConfettiCelebration.jsx");
  assert.match(confetti, /addEventListener\("change", syncReducedMotion\)/);
  assert.match(confetti, /removeEventListener\("change", syncReducedMotion\)/);
  assert.match(confetti, /addListener\?\.\(syncReducedMotion\)/);
  assert.match(confetti, /removeListener\?\.\(syncReducedMotion\)/);
  assert.match(confetti, /if \(!show \|\| prefersReducedMotion \|\| reducedMotion\) return null/);
});

test("pre-reader game controls never offer a silent hear-word lifeline", async () => {
  const [arcade, adventure, wordBridge, grammarGrind, safari, soundBeat, reward, learnGamesAudio] = await Promise.all([
    source("src/components/learn/games/games/ArcadePracticeGame.jsx"),
    source("src/components/learn/games/games/AdventureGame.jsx"),
    source("src/components/learn/games/games/WordBridgeGame.jsx"),
    source("src/components/learn/games/games/GrammarGrindGame.jsx"),
    source("src/components/learn/games/games/SoundSafariArcadeGame.jsx"),
    source("src/components/learn/games/games/SoundBeatGame.jsx"),
    source("src/components/quest/RewardScreen.jsx"),
    source("src/utils/learnGamesAudio.js")
  ]);
  assert.match(arcade, /hasRecordedSpeech/);
  assert.match(adventure, /hasRecordedSpeech/);
  assert.match(wordBridge, /hasRecordedSpeech\(targetSpeechText\(\)\)/);
  assert.match(wordBridge, /elHear\.disabled = !available/);
  assert.match(grammarGrind, /levelSpeechParts\(\)\.some\(part => hasRecordedSpeech\(part\)\)/);
  assert.match(grammarGrind, /el\.hear\.disabled = !canHearLevel/);
  assert.match(safari, /presentedUnits/);
  assert.match(safari, /fieldGuideReplayBox/);
  assert.match(safari, /speakPhoneme\(value\)/);
  assert.match(soundBeat, /getLedaWordAudioPath\("tap"\)/);
  assert.match(learnGamesAudio, /phonemeAudioCandidates\(normalized\)/);
  assert.doesNotMatch(learnGamesAudio, /clean-human\/graphemes/);
  assert.match(learnGamesAudio, /if \(played\) return;\s*speakWithBrowser\(normalized, options\);\s*return;/);
  assert.match(learnGamesAudio, /existingAudioPaths\(wordAudioCandidates\(slug\)\)\.length > 0/);
  assert.match(reward, /getLedaInstructionAudioPath\("Great job"\)/);
  assert.match(reward, /timers\.forEach\(timer => clearTimeout\(timer\)\);\s*stopCueAudio\(\)/);
  assert.match(reward, /aria-hidden="true">(?:→|➜|▶)/);
});

test("the early adventure and skate routes stay book-led, physical, and recoverable", async () => {
  const [creator, avatarPolicy, trail, questCss, skate, chapters] = await Promise.all([
    source("src/components/quest/CreatureCreator.jsx"),
    source("src/components/quest/bookCharacterAvatar.js"),
    source("src/components/quest/world/QuestTrail2D.jsx"),
    source("src/styles/quest.css"),
    source("src/components/learn/games/games/GrammarGrindGame.jsx"),
    source("src/data/questChapters.js")
  ]);

  assert.match(creator, /BookCharacterAvatar/);
  assert.match(creator, /Pick a book friend and a finished look\./);
  assert.match(avatarPolicy, /sound-seekers\/characters\/muddy/);
  assert.match(avatarPolicy, /painted artwork, never a Phaser\/CSS tint/);
  assert.doesNotMatch(creator, /Your adventure look/);
  assert.match(trail, /<BookCharacterAvatar/);
  assert.match(trail, /creature=\{state\.creature\}/);
  assert.match(trail, /parentElement\.scrollTop = 0/);
  assert.match(trail, /className="q2d-resident is-guide"/);
  assert.match(questCss, /data-mechanic="sound-hunt"/);
  assert.match(questCss, /seed-lantern\.png/);

  assert.match(skate, /MAX_SPEED = \{ easy: 9,/);
  assert.match(skate, /TOKEN_COUNT = \{ easy: 0,/);
  assert.match(skate, /Explore the skate park\. Find each sound in order/);
  assert.match(skate, /grammarGrindSegmentChoices/);
  assert.match(skate, /rebuildLineChoices\(\)/);
  assert.match(skate, /Move forward/);
  assert.match(skate, /Move back/);
  assert.match(skate, /player\.pos\.set\(0, 0, 24\)/);
  assert.doesNotMatch(skate, /easyLaneChosen/);
  assert.doesNotMatch(skate, /The skater moves for you/);
  assert.match(chapters, /guide: \{ name: "Bouncy", role: "lantern keeper"/);
  assert.doesNotMatch(chapters, /guide: \{ name: "Pip", role: "lantern keeper"/);
});
