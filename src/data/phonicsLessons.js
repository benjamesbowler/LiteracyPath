import { getApprovedAudioPath } from "./audioPreferenceManifest.js";
import { getChildWordAsset } from "./childAssets.js";
import { getPreferredPhonemeAudioPath } from "./phonemeAudioBank.js";

/**
 * @typedef {{ word: string, image: string, audio: string, phonemeBreakdown: string }} PhonicsWord
 * @typedef {{ letter: string, phonicSound: string, phonicAudio: string, letterNameAudio: string, words: PhonicsWord[], distractors: PhonicsWord[], traceSVG: string, matchPrompt?: string }} LetterLesson
 */

function word(w, phoneme) {
  const asset = getChildWordAsset(w) || {};
  const fallbackImage = `/phonics/images/${w}.png`;
  const fallbackAudio = `/phonics/audio/words/${w}.mp3`;
  const approvedAudio = getApprovedAudioPath(w, asset.audio || fallbackAudio);

  return {
    word: w,
    image: asset.image || asset.fallbackImage || fallbackImage,
    audio: approvedAudio || asset.audio || fallbackAudio,
    phonemeBreakdown: phoneme
  };
}

function letter(l, sound, words, distractors, traceSVG, options = {}) {
  const lowerLetter = String(l || "").toLowerCase();

  return {
    letter: l,
    phonicSound: sound,
    phonicAudio: getPreferredPhonemeAudioPath(lowerLetter),
    letterNameAudio: `/phonics/audio/letters/${lowerLetter}-name.mp3`,
    words,
    distractors,
    traceSVG,
    ...options
  };
}

export const lessons = [
  {
    level: 1,
    levelName: "Initial Sounds",
    levelColor: "#4D96FF",
    letters: [

      letter("A", "a-a-a",
        [word("apple",      "a-a-apple"),
         word("ant",        "a-a-ant"),
         word("axe",        "a-a-axe"),
         word("alligator",  "a-a-alligator")],
        [word("ball",  "b-b-ball"),
         word("cup",   "c-c-cup"),
         word("dog",   "d-d-dog"),
         word("fish",  "f-f-fish")],
        "M 120 320 L 200 80 L 280 320 M 148 224 L 252 224"
      ),

      letter("B", "b-b-b",
        [word("ball",       "b-b-ball"),
         word("bear",       "b-b-bear"),
         word("bus",        "b-b-bus"),
         word("book",       "b-b-book")],
        [word("cat",    "c-c-cat"),
         word("dog",    "d-d-dog"),
         word("egg",    "e-e-egg"),
         word("frog",   "f-f-frog")],
        "M 120 80 L 120 320 M 120 80 Q 240 80 240 140 Q 240 200 120 200 M 120 200 Q 250 200 250 260 Q 250 320 120 320"
      ),

      letter("C", "c-c-c",
        [word("cat",        "c-c-cat"),
         word("cup",        "c-c-cup"),
         word("car",        "c-c-car"),
         word("cap",        "c-c-cap")],
        [word("dog",    "d-d-dog"),
         word("egg",    "e-e-egg"),
         word("fox",    "f-f-fox"),
         word("goat",   "g-g-goat")],
        "M 300 130 Q 260 60 190 60 Q 90 60 90 200 Q 90 340 190 340 Q 260 340 300 270"
      ),

      letter("D", "d-d-d",
        [word("dog",        "d-d-dog"),
         word("duck",       "d-d-duck"),
         word("drum",       "d-d-drum"),
         word("dig",        "d-d-dig")],
        [word("egg",    "e-e-egg"),
         word("fox",    "f-f-fox"),
         word("goat",   "g-g-goat"),
         word("hat",    "h-h-hat")],
        "M 120 80 L 120 320 M 120 80 L 210 80 Q 310 80 310 200 Q 310 320 210 320 L 120 320"
      ),

      letter("E", "e-e-e",
        [word("egg",        "e-e-egg"),
         word("elephant",   "e-e-elephant"),
         word("envelope",   "e-e-envelope")],
        [word("fox",    "f-f-fox"),
         word("goat",   "g-g-goat"),
         word("hat",    "h-h-hat"),
         word("ink",    "i-i-ink")],
        "M 280 80 L 120 80 L 120 320 L 280 320 M 120 200 L 255 200"
      ),

      letter("F", "f-f-f",
        [word("fish",       "f-f-fish"),
         word("frog",       "f-f-frog"),
         word("fan",        "f-f-fan"),
         word("fox",        "f-f-fox")],
        [word("goat",   "g-g-goat"),
         word("hat",    "h-h-hat"),
         word("ink",    "i-i-ink"),
         word("jam",    "j-j-jam")],
        "M 280 80 L 120 80 L 120 320 M 120 200 L 255 200"
      ),

      letter("G", "g-g-g",
        [word("goat",       "g-g-goat"),
         word("gate",       "g-g-gate"),
         word("girl",       "g-g-girl"),
         word("gum",        "g-g-gum")],
        [word("hat",    "h-h-hat"),
         word("ink",    "i-i-ink"),
         word("jam",    "j-j-jam"),
         word("kite",   "k-k-kite")],
        "M 295 130 Q 255 60 185 60 Q 85 60 85 200 Q 85 340 185 340 Q 260 340 295 285 L 295 200 L 215 200"
      ),

      letter("H", "h-h-h",
        [word("hat",        "h-h-hat"),
         word("horse",      "h-h-horse"),
         word("hand",       "h-h-hand"),
         word("house",      "h-h-house")],
        [word("ink",    "i-i-ink"),
         word("jam",    "j-j-jam"),
         word("kite",   "k-k-kite"),
         word("lion",   "l-l-lion")],
        "M 120 80 L 120 320 M 280 80 L 280 320 M 120 200 L 280 200"
      ),

      letter("I", "i-i-i",
        [word("ink",        "i-i-ink"),
         word("insect",     "i-i-insect"),
         word("igloo",      "i-i-igloo")],
        [word("jam",    "j-j-jam"),
         word("kite",   "k-k-kite"),
         word("lion",   "l-l-lion"),
         word("moon",   "m-m-moon")],
        "M 155 80 L 245 80 M 200 80 L 200 320 M 155 320 L 245 320"
      ),

      letter("J", "j-j-j",
        [word("jam",        "j-j-jam"),
         word("jug",        "j-j-jug"),
         word("jet",        "j-j-jet"),
         word("jog",        "j-j-jog")],
        [word("kite",   "k-k-kite"),
         word("lion",   "l-l-lion"),
         word("moon",   "m-m-moon"),
         word("net",    "n-n-net")],
        "M 155 80 L 245 80 M 200 80 L 200 280 Q 200 340 135 340 Q 95 340 95 295"
      ),

      letter("K", "k-k-k",
        [word("kite",       "k-k-kite"),
         word("key",        "k-k-key"),
         word("king",       "k-k-king"),
         word("kid",        "k-k-kid")],
        [word("lion",   "l-l-lion"),
         word("moon",   "m-m-moon"),
         word("net",    "n-n-net"),
         word("pig",    "p-p-pig")],
        "M 120 80 L 120 320 M 280 80 L 120 200 L 280 320"
      ),

      letter("L", "l-l-l",
        [word("lion",       "l-l-lion"),
         word("leaf",       "l-l-leaf"),
         word("lamp",       "l-l-lamp"),
         word("log",        "l-l-log")],
        [word("moon",   "m-m-moon"),
         word("net",    "n-n-net"),
         word("pan",    "p-p-pan"),
         word("pig",    "p-p-pig")],
        "M 120 80 L 120 320 L 290 320"
      ),

      letter("M", "m-m-m",
        [word("moon",       "m-m-moon"),
         word("map",        "m-m-map"),
         word("mug",        "m-m-mug"),
         word("man",        "m-m-man")],
        [word("net",    "n-n-net"),
         word("ox",     "o-o-ox"),
         word("pig",    "p-p-pig"),
         word("queen",  "qu-qu-queen")],
        "M 100 320 L 100 80 L 200 200 L 300 80 L 300 320"
      ),

      letter("N", "n-n-n",
        [word("net",        "n-n-net"),
         word("nose",       "n-n-nose"),
         word("nap",        "n-n-nap")],
        [word("ox",     "o-o-ox"),
         word("pig",    "p-p-pig"),
         word("queen",  "qu-qu-queen"),
         word("rat",    "r-r-rat")],
        "M 120 320 L 120 80 L 280 320 L 280 80"
      ),

      letter("O", "o-o-o",
        [word("orange",     "o-o-orange"),
         word("ox",         "o-o-ox"),
         word("octopus",    "o-o-octopus")],
        [word("pig",    "p-p-pig"),
         word("queen",  "qu-qu-queen"),
         word("rat",    "r-r-rat"),
         word("snake",  "s-s-snake")],
        "M 200 60 Q 310 60 310 200 Q 310 340 200 340 Q 90 340 90 200 Q 90 60 200 60"
      ),

      letter("P", "p-p-p",
        [word("pig",        "p-p-pig"),
         word("pen",        "p-p-pen"),
         word("pan",        "p-p-pan"),
         word("pot",        "p-p-pot")],
        [word("queen",  "qu-qu-queen"),
         word("rat",    "r-r-rat"),
         word("snake",  "s-s-snake"),
         word("tiger",  "t-t-tiger")],
        "M 120 80 L 120 320 M 120 80 L 235 80 Q 295 80 295 155 Q 295 230 120 230"
      ),

      letter("Q", "qu-qu-qu",
        [word("queen",      "qu-qu-queen"),
         word("quilt",      "qu-qu-quilt")],
        [word("rat",    "r-r-rat"),
         word("snake",  "s-s-snake"),
         word("tiger",  "t-t-tiger"),
         word("umbrella","u-u-umbrella")],
        "M 200 60 Q 310 60 310 200 Q 310 340 200 340 Q 90 340 90 200 Q 90 60 200 60 M 245 285 L 310 345"
      ),

      letter("R", "r-r-r",
        [word("ring",       "r-r-ring"),
         word("rat",        "r-r-rat"),
         word("rug",        "r-r-rug"),
         word("run",        "r-r-run")],
        [word("snake",  "s-s-snake"),
         word("tiger",  "t-t-tiger"),
         word("umbrella","u-u-umbrella"),
         word("van",    "v-v-van")],
        "M 120 80 L 120 320 M 120 80 L 235 80 Q 295 80 295 155 Q 295 225 120 225 M 200 225 L 295 320"
      ),

      letter("S", "s-s-s",
        [word("snake",      "s-s-snake"),
         word("sun",        "s-s-sun"),
         word("sock",       "s-s-sock"),
         word("star",       "s-s-star")],
        [word("tiger",  "t-t-tiger"),
         word("umbrella","u-u-umbrella"),
         word("van",    "v-v-van"),
         word("whale",  "wh-wh-whale")],
        "M 285 115 Q 260 60 200 60 Q 100 60 100 155 Q 100 205 200 205 Q 310 205 310 285 Q 310 340 200 340 Q 140 340 115 295"
      ),

      letter("T", "t-t-t",
        [word("tiger",      "t-t-tiger"),
         word("train",      "t-t-train"),
         word("tree",       "t-t-tree"),
         word("tent",       "t-t-tent")],
        [word("umbrella","u-u-umbrella"),
         word("van",    "v-v-van"),
         word("whale",  "wh-wh-whale"),
         word("yo-yo",  "y-y-yo-yo")],
        "M 120 80 L 280 80 M 200 80 L 200 320"
      ),

      letter("U", "u-u-u",
        [word("umbrella",   "u-u-umbrella"),
         word("up",         "u-u-up"),
         word("under",      "u-u-under")],
        [word("van",    "v-v-van"),
         word("whale",  "wh-wh-whale"),
         word("yo-yo",  "y-y-yo-yo"),
         word("zebra",  "z-z-zebra")],
        "M 120 80 L 120 268 Q 120 345 200 345 Q 280 345 280 268 L 280 80"
      ),

      letter("V", "v-v-v",
        [word("van",        "v-v-van"),
         word("vest",       "v-v-vest"),
         word("vase",       "v-v-vase")],
        [word("whale",  "wh-wh-whale"),
         word("yo-yo",  "y-y-yo-yo"),
         word("zebra",  "z-z-zebra"),
         word("apple",  "a-a-apple")],
        "M 100 80 L 200 330 L 300 80"
      ),

      letter("W", "w-w-w",
        [word("whale",      "wh-wh-whale"),
         word("web",        "w-w-web"),
         word("worm",       "w-w-worm"),
         word("wig",        "w-w-wig")],
        [word("yo-yo",  "y-y-yo-yo"),
         word("zebra",  "z-z-zebra"),
         word("apple",  "a-a-apple"),
         word("ball",   "b-b-ball")],
        "M 80 80 L 145 320 L 200 170 L 255 320 L 320 80"
      ),

      letter("X", "x-x-x",
        [word("fox",        "fo-x"),
         word("box",        "bo-x"),
         word("fix",        "fi-x"),
         word("ox",         "o-x")],
        [word("yo-yo",  "y-y-yo-yo"),
         word("zebra",  "z-z-zebra"),
         word("apple",  "a-a-apple"),
         word("ball",   "b-b-ball")],
        "M 120 80 L 280 320 M 280 80 L 120 320",
        { matchPosition: "end", matchPrompt: "Look at the words. Find the X endings." }
      ),

      letter("Y", "y-y-y",
        [word("yo-yo",      "y-y-yo-yo"),
         word("yawn",       "y-y-yawn"),
         word("yell",       "y-y-yell"),
         word("yum",        "y-y-yum")],
        [word("zebra",  "z-z-zebra"),
         word("apple",  "a-a-apple"),
         word("ball",   "b-b-ball"),
         word("cat",    "c-c-cat")],
        "M 100 80 L 200 210 L 300 80 M 200 210 L 200 320"
      ),

      letter("Z", "z-z-z",
        [word("zebra",      "z-z-zebra"),
         word("zip",        "z-z-zip"),
         word("zoo",        "z-z-zoo")],
        [word("apple",  "a-a-apple"),
         word("ball",   "b-b-ball"),
         word("cat",    "c-c-cat"),
         word("dog",    "d-d-dog")],
        "M 120 80 L 280 80 L 120 320 L 280 320"
      ),
    ]
  }
];

export function getLessonByLetter(letter) {
  if (!letter) return undefined;
  for (const lesson of lessons) {
    const found = lesson.letters.find(
      item => item.letter.toLowerCase() === String(letter).toLowerCase()
    );
    if (found) return found;
  }
  return undefined;
}

export function getAllLetters() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
}

export function getAvailableLetters() {
  return lessons.flatMap(lesson => lesson.letters.map(item => item.letter));
}
