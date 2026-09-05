// Sound Seekers v3 — one Gemini TTS voice per cast character, with a short
// acting-direction prompt and a speaking-rate tweak for the sleepier or
// quicker personalities. Used by tools/generateSoundSeekersV3Lines.mjs to
// voice the Meet/Fix lines in ./trail.js.
//
// voiceFor(castKey) always returns the same frozen { voice, rate, prompt }
// for a given CAST key (see ./cast.js), or throws for an unknown one.

import { CAST } from "./cast.js";

export const VOICE_MODEL = "gemini-2.5-flash-tts";

const SLOW = 0.9;
const QUICK = 1.05;
const NORMAL = 1.0;

// Cast keys that read a little slower or a little quicker than the default.
const RATE_BY_KEY = Object.freeze({
  sleepy: SLOW, dozy: SLOW, stone: SLOW, grumpy: SLOW, "dino-grumpy": SLOW, luna: SLOW, fern: SLOW,
  bouncy: QUICK, "dino-bouncy": QUICK, zippy: QUICK, speedy: QUICK, brave: QUICK, noisy: QUICK, honky: QUICK, flappy: QUICK
});

// castKey → [Gemini voice name, one-clause character description for the prompt].
const VOICE_BY_KEY = Object.freeze({
  // ── Meadow Pals (Sunny Meadow Farm) ───────────────────────────────────────
  muddy: ["Puck", "an eager, sensory little pig who loves mud, excited and a little breathless"],
  woolly: ["Vindemiatrix", "a gentle, patient little lamb, calm and kind"],
  clucky: ["Kore", "a proud, organised grown-up hen, brisk and direct"],
  splashy: ["Erinome", "a practical, observant little duckling, clear and quick"],
  bouncy: ["Laomedeia", "an energetic, optimistic little lamb on springs, bright and bouncy"],
  brave: ["Sadachbia", "a bold, action-first little chick, small but fearless-sounding"],
  giggly: ["Zephyr", "a playful little goose who finds everything funny, with a giggle in the voice"],
  hungry: ["Callirrhoe", "a curious, easy-going young cow, warm and a little dreamy"],
  cuddly: ["Aoede", "a warm, enthusiastic little cat, affectionate and a bit too loud at first"],
  noisy: ["Fenrir", "a loud, enthusiastic little rooster with a big voice learning to match the place"],
  grumpy: ["Algenib", "a short, stocky goat who values quiet, dry, low and unhurried"],
  sleepy: ["Umbriel", "a slow, comfort-loving little donkey, drowsy and soft"],
  shy: ["Achernar", "a quiet, cautious little mouse, soft and small"],
  tiny: ["Autonoe", "a very small, resourceful field mouse with a tiny bright voice"],
  speedy: ["Achird", "a fast, keen, friendly young farm dog"],

  // ── Dino Pals (Sunny Hollow) ──────────────────────────────────────────────
  chompy: ["Puck", "a big-hearted, confident young T-rex, cheerful and hungry"],
  sunny: ["Laomedeia", "a playful, hopeful young triceratops"],
  dozy: ["Umbriel", "a slow, comfort-seeking young stegosaur, drowsy"],
  "dino-grumpy": ["Algenib", "a dry, solitary young ankylosaur of few words, low and unhurried"],
  bossy: ["Kore", "a young pterodactyl who loves plans and clear roles, firm and organised"],
  wiggly: ["Callirrhoe", "a social, movement-loving young diplodocus, easy-going"],
  zippy: ["Sadachbia", "a fast, curious young velociraptor, quick and lively"],
  honky: ["Fenrir", "a young parasaurolophus with a powerful voice, big and enthusiastic"],
  cheeky: ["Zubenelgenubi", "a playful, cheeky young oviraptor with a grin in the voice"],
  "dino-shy": ["Achernar", "a quiet, observant young long-necked dinosaur, soft"],
  fancy: ["Pulcherrima", "an expressive, exacting young stegosaur who likes things just so"],
  clumsy: ["Enceladus", "a tall, careful young long-necked dinosaur, gentle and breathy"],
  flappy: ["Autonoe", "a small feathered young dinosaur, bright and quick"],
  sneezy: ["Iapetus", "a small young parasaurolophus with a sniffle, clear and friendly"],
  "dino-bouncy": ["Zephyr", "an exuberant, physical young dinosaur on springs, bright"],

  // ── Moonwood Tales ────────────────────────────────────────────────────────
  pip: ["Achird", "a quick, curious woodland boy about seven, friendly and observant"],
  wren: ["Leda", "an inventive, eager, bookish child witch about seven"],
  flint: ["Sadachbia", "a brave, action-first explorer boy about eight, lively"],
  spark: ["Puck", "a confident junior wizard about eight, upbeat"],
  burrow: ["Rasalgethi", "a practical, map-minded mole, informative and kindly"],
  luna: ["Gacrux", "an observant, patient owl, mature and calm"],
  fern: ["Sulafat", "a calm, musical fern sprite, warm and grounded"],
  glimmer: ["Zephyr", "an earnest, excitable young dragon, bright"],
  stone: ["Charon", "a very large, slow, literal, gentle stone giant, deep and unhurried"]
});

function buildEntry(castKey) {
  const cast = CAST[castKey];
  const voiceInfo = VOICE_BY_KEY[castKey];
  if (!cast || !voiceInfo) throw new Error(`voices.js: no voice mapped for cast key "${castKey}"`);
  const [voice, description] = voiceInfo;
  const rate = RATE_BY_KEY[castKey] ?? NORMAL;
  const prompt = `Speak as ${cast.name}, ${description} in a children's picture book read to five-year-olds. `
    + "Clear, warm and natural; every word crisp; never shouty or exaggerated.";
  return Object.freeze({ voice, rate, prompt });
}

export const VOICE_CAST = Object.freeze(
  Object.fromEntries(Object.keys(VOICE_BY_KEY).map(castKey => [castKey, buildEntry(castKey)]))
);

export function voiceFor(castKey) {
  const entry = VOICE_CAST[castKey];
  if (!entry) throw new Error(`voiceFor: unknown Sound Seekers cast key "${castKey}"`);
  return entry;
}
