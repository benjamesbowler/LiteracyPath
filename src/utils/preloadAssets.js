// Idle-time asset warming. Called once when a student lands on home so
// world art, game cards, and common UI sounds are already cached before
// the child taps into them. Never blocks first paint.
import { GAME_LIST } from "../data/learnGamesData";
import { CHILD_BRAND } from "../data/childBrand.js";
import { COMPANIONS } from "./studentProfile.js";
import { getLedaInstructionAudioPath } from "../data/ledaProductionAudio.js";

// Home board tile backgrounds — heavy webp that otherwise paint blank/black on
// a cold visit; warm them so re-visits are instant.
const HOME_TILE_ART = [
  "home-phonics",
  "home-skills-quest",
  "home-arcade",
  "home-story-quests",
  "home-reading-library"
].map(name => `/images/learn-games/home/${name}.webp`);

let warmed = false;
const KEEP_ALIVE = [];

function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  KEEP_ALIVE.push(img);
}

function preloadAudio(src) {
  if (!src) return;
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = src;
  KEEP_ALIVE.push(audio);
}

export function warmStudentAssets(world) {
  if (warmed || typeof window === "undefined") return;
  warmed = true;

  const run = () => {
    // Active world art (backdrops, banner, sprite, poses)
    if (world) {
      preloadImage(world.banner);
      // The child Home paints its hero on the clean backdrop, not the panorama.
      preloadImage(world.backdrop);
      preloadImage(world.emblem);
      preloadImage(world.point);
      preloadImage(`/images/pals/sprites/${world.id}-idle-4.webp`);
      ["wave", "celebrate", "think", "read"].forEach(pose =>
        preloadImage(`/images/pals/poses/${world.id}-${pose}.webp`));
    }
    preloadImage(CHILD_BRAND.logoPath);
    preloadImage(CHILD_BRAND.markPath);
    preloadImage("/images/learn-games/phinny-cheering.webp");

    // Home board tiles + companion faces (both paint blank on a cold visit)
    HOME_TILE_ART.forEach(preloadImage);
    (COMPANIONS || []).forEach(companion => preloadImage(companion.image));

    // Game card art so the hub grids pop in instantly. Both hub tabs (Arcade
    // and Phonics Practice) render card art, so warm every visible game's
    // tile: arcade games plus the practice shelf (not hidden, not word-climb,
    // mirroring the hub's filters). A game may explicitly register cardArt as
    // an authored icon fallback while its separate landscape tile is pending;
    // this avoids preloading a guaranteed missing URL.
    GAME_LIST.filter(game =>
      (game.surfaces || []).includes("arcade") || (!game.hidden && game.id !== "word-climb")
    ).forEach(game => preloadImage(game.cardArt || `/images/learn-games/art/${game.id}.webp`));

    // Most-played instruction audio
    [
      getLedaInstructionAudioPath("Build the word you hear"),
      getLedaInstructionAudioPath("Listen then tap the matching word"),
      getLedaInstructionAudioPath("Find the matching sight words")
    ].forEach(preloadAudio);
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    window.setTimeout(run, 1200);
  }
}
