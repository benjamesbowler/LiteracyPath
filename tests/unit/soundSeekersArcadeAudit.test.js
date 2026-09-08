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
  assert.match(phonicsHook, /AUDIO_PHONEME_PATHS\.has\(src\)/);
  assert.match(loginFlow, /STUDENT_LOGIN_VOICE_AUDIO\[key\]/);
  assert.match(loginFlow, /playCueAudio\(src/);
  assert.doesNotMatch(loginFlow, /speakWithBrowser/);
  assert.doesNotMatch(loginFlow, /\/audio\/ui\/voice\//);
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

test("Sound Racer keeps one-shot completion, owned rendering, audio and reduced-motion recovery", async () => {
  const racer = await source("src/features/soundRacer/RacerSession.jsx");
  const scene = await source("src/features/soundRacer/scene.js");
  const fallback = await source("src/features/soundRacer/RacerFallback.jsx");
  assert.match(racer, /current\.phase === 'finished' && !finished\.current/);
  assert.match(racer, /finished\.current = true/);
  assert.match(racer, /cancelAnimationFrame\(frame\)/);
  assert.match(racer, /abort\.abort\(\); owner\?\.dispose\(\)/);
  assert.match(scene, /disposeRenderer\(renderer, \{ forceContextLoss: true \}\)/);
  assert.match(scene, /disposeOwnedModelInstance/);
  assert.match(racer, /query\.addEventListener\('change', change\)/);
  assert.match(racer, /query\.removeEventListener\('change', change\)/);
  assert.match(fallback, /cameraDistance = reducedMotion/);
  assert.match(racer, /playRacerTarget\(mission\.target/);
  assert.match(racer, /const exampleWord = mission\.exampleWord/);
  assert.match(racer, /role="region" aria-label="Sound example"/);
  assert.match(racer, /role="region" aria-label="How to steer"/);
  assert.match(racer, /playRacerExample\(exampleWord/);
  assert.match(racer, /isCurrent: \(\) => alive\.current && sound\.current/);
  assert.doesNotMatch(racer, />S<\/span>[\s\S]*>sun<\/span>/);
});

test("Sound Safari reduces actual critter travel and follows live OS motion changes", async () => {
  const safari = await source("src/components/learn/games/games/SoundSafariArcadeGame.jsx");
  assert.match(safari, /let reduceMotion = motionQuery\?\.matches \?\? prefersReducedMotion\(\)/);
  assert.match(safari, /const syncReducedMotion = event => \{[\s\S]*reduceMotion = Boolean\(event\.matches\);[\s\S]*renderProfile = detectSafariRenderProfile\(reduceMotion\);[\s\S]*resize\(\);[\s\S]*\};/);
  assert.match(safari, /motionQuery\?\.addEventListener\?\.\("change", syncReducedMotion\)/);
  assert.match(safari, /motionQuery\?\.removeEventListener\?\.\("change", syncReducedMotion\)/);
  assert.match(safari, /const motionDt = reduceMotion \? dt \* 0\.35 : dt/);
  assert.match(safari, /critter\.x \+= critter\.vx \* motionDt/);
  assert.match(safari, /critter\.y \+= critter\.vy \* motionDt/);
  assert.match(safari, /function onPointerDown\(event\)[\s\S]*captureAt\(point\.x, point\.y\)/);
  assert.match(safari, /drawNet\(ctx, state, theme, w, h, images\.net\)/);
});

test("Sound Safari keeps cinematic grading behind crisp literacy surfaces and tiers decorative work", async () => {
  const safari = await source("src/components/learn/games/games/SoundSafariArcadeGame.jsx");
  assert.match(safari, /const SAFARI_RENDER_PROFILES = \{[\s\S]*pixelRatioCap: 1,[\s\S]*pixelRatioCap: 1\.5,[\s\S]*pixelRatioCap: 2/);
  assert.match(safari, /const cappedDpr = Math\.min\(size\.dpr, renderProfile\.pixelRatioCap\)/);
  assert.match(safari, /ctx\.imageSmoothingEnabled = true/);
  assert.doesNotMatch(safari, /ctx\.imageSmoothingEnabled = false/);
  assert.doesNotMatch(safari, /function drawScreenGrade/);
  assert.doesNotMatch(safari, /for \(let y = 0; y < h; y \+= (?:4|8)\)/);
  assert.match(safari, /drawSceneLighting\(ctx, w, h, activeTheme, renderProfile\);\s*drawSafari\(ctx, state, config, activeTheme, images, w, h\);\s*drawHud/);
});

test("Sentence Express layers its world without grading over literacy controls", async () => {
  const css = await source("src/styles/sentence-express.css");
  assert.match(css, /\.sx-sky::before,[\s\S]*\.sx-sky::after/);
  assert.match(css, /\.sx-scroll \.sx-far \{ animation: sx-parallax-far/);
  assert.match(css, /\.sx-scroll \.sx-mid \{ animation: sx-parallax-mid/);
  assert.match(css, /\.sx-stage::after \{[\s\S]*z-index: 5/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.sx-scroll \.sx-far, \.sx-scroll \.sx-mid \{ animation: none; \}/);
  assert.match(css, /@media \(update: slow\)/);
  for (const minimum of ["min-height: 56px", "width: 58px; height: 58px"]) {
    assert.match(css, new RegExp(minimum.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
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

test("reported Arcade objectives and replay controls keep child-readable hierarchy", async () => {
  const [skate, express, expressCss, grove, soundKeys, soundKeysCss, reel, racer] = await Promise.all([
    source("src/components/learn/games/games/GrammarGrindGame.jsx"),
    source("src/components/learn/games/games/SentenceExpressGame.jsx"),
    source("src/styles/sentence-express.css"),
    source("src/components/learn/games/games/StarGalleryArcadeGame.jsx"),
    source("src/components/learn/games/games/SoundKeysGame.jsx"),
    source("src/features/soundkeys/soundkeys.css"),
    source("src/components/learn/games/games/ReelReadGame.jsx"),
    source("src/features/soundRacer/RacerSession.jsx")
  ]);

  assert.match(skate, /data-gg="prompt" data-child-instruction/);
  assert.match(skate, /`Collect \$\{nextSegment \|\| "the next sound"\} next`/);
  assert.match(skate, /`Build \$\{level\.audioWord\}: \$\{\(level\.segments \|\| \[\]\)\.join\(" → "\)\}`/);
  assert.match(skate, /data-gg="hear"[\s\S]*?min-height:56px[\s\S]*?font-size:1rem/);
  assert.match(skate, /setAttribute\("aria-label", level\.audioWord \? `Hear \$\{level\.audioWord\} again`/);

  assert.match(express, /className="sx-objective" data-child-instruction/);
  assert.match(express, /className="sx-target">\{targetSentence\}/);
  assert.match(express, /aria-label="Hear the sentence again"/);
  assert.match(expressCss, /\.sx-bubble \.sx-objective \{[\s\S]*?font-size: 18px/);
  assert.match(expressCss, /\.sx-bubble \.sx-target \{[\s\S]*?font-size: clamp\(20px/);
  assert.match(expressCss, /\.sx-bell \{[\s\S]*?font-size: 16px[\s\S]*?min-width: 210px; min-height: 60px/);

  assert.match(grove, /data-role="prompt" data-child-instruction/);
  assert.match(grove, /<button data-role="replay" type="button" aria-label="Hear the sentence again"/);
  assert.match(grove, /data-role="replay"[\s\S]*?min-width:220px;min-height:56px[\s\S]*?font-size:16px/);
  assert.match(grove, /nodes\.replay\.addEventListener\("click", event =>/);

  assert.match(soundKeys, /className="soundkeys-listen" aria-label=\{isSoundEnabled \? `Hear \$\{target\.display\} again` : "Word replay unavailable while sound is off"\}/);
  assert.match(soundKeys, /disabled=\{!isSoundEnabled\}/);
  assert.match(soundKeys, /onClick=\{\(\) => \{ if \(isSoundEnabled\) playAudio\(target\.audio\); \}\}/);
  assert.match(soundKeys, /\{isSoundEnabled \? "Hear word again" : "Sound is off"\}<\/button>/);
  assert.match(soundKeysCss, /\.soundkeys-listen \{[\s\S]*?min-width: 168px; min-height: 56px;[\s\S]*?font-size: 16px/);

  assert.match(reel, /data-rr="replay" type="button" aria-label="Hear the target word again"[\s\S]*?min-width:96px;min-height:66px[\s\S]*?font-size:1rem/);
  assert.match(reel, /function layoutReplayControl\(\)[\s\S]*?btnReplay\.style\.width = compact && !crowded \? "96px" : "168px"/);
  assert.match(reel, /function refreshSoundState\(\)[\s\S]*?btnReplay\.disabled = !enabled;[\s\S]*?Word replay unavailable while sound is off/);
  assert.match(reel, /engineRef\.current\?\.refreshSoundState\?\.\(\)/);
  assert.match(reel, /if \(!opts\.getSound\?\.\(\)\) return;/);
  assert.match(reel, /btnReplay\.addEventListener\("click", replayTarget\)/);
  assert.match(reel, /btnReplay\.removeEventListener\("click", replayTarget\)/);

  assert.match(racer, /data-sr="hear-target" aria-label=\{`Hear \$\{mission\.target\.toUpperCase\(\)\} sound again`\}/);
  const racerCss = await source("src/features/soundRacer/sound-racer.css");
  assert.match(racerCss, /min-height:\s*56px/);
});

test("every 3D arcade surface re-probes quality on resize and motion changes", async () => {
  const files = [
    "src/components/learn/games/games/RocketRunGame.jsx",
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

test("Sound Racer re-probes scene quality on resize and owns live motion updates", async () => {
  const scene = await source("src/features/soundRacer/scene.js");
  const session = await source("src/features/soundRacer/RacerSession.jsx");
  assert.match(scene, /const resize = \(\) => \{[\s\S]*?pipeline\.setTier\(requestedQuality\(\)\)/);
  assert.match(scene, /const requestedQuality = [^;]*detectQualityTier\(\)[^;]*qualityCeiling/);
  assert.match(scene, /pipeline\.setTier\(/);
  assert.match(scene, /onResize: resize/);
  assert.match(session, /query\.addEventListener\('change', change\)/);
  assert.match(session, /query\.removeEventListener\('change', change\)/);
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
