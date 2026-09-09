// The authored Safari order is also its level order: three words per level.
// Availability must never remove a word or shift the following levels.
export const SOUND_SAFARI_WORDS = Object.freeze({
  easy: Object.freeze([
    "cat", "sun", "mop", "big", "hat", "log", "pen", "cup", "dog", "jam",
    "red", "wet", "run", "bug", "pig", "web", "hen", "fox", "zip", "van",
    "top", "net", "mud", "duck", "bed", "ten", "cap", "bus", "pot", "leg"
  ]),
  medium: Object.freeze([
    "frog", "plant", "crisp", "drum", "stone", "flame", "brush", "green", "splash", "track",
    "clock", "snail", "train", "clap", "brain", "sleep", "float", "smile", "chair", "thread",
    "crash", "string", "spring", "bright", "twist", "storm", "shark", "three", "slide", "prize"
  ]),
  hard: Object.freeze([
    "sunlight", "rainbow", "moon", "star", "meadow", "forest", "river", "rabbit", "silver", "night",
    "dark", "owl", "glow", "badger", "thunder", "glimmer", "squirrel", "acorn", "mist", "fern",
    "oak", "butterfly", "moss", "woodland", "dream", "mushroom", "glowing", "stream", "shining", "sunset"
  ])
});
