#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { SOUND_SEEKERS_TEACH_TARGETS } from "../src/features/soundSeekers/content/teachTargetMetadata.js";
import { QUEST_STOPS } from "../src/data/questSequence.js";
import { segmentWord } from "../src/utils/questSegments.js";
import { assertPronunciationsMatchReference } from "./soundSeekersPronunciationAudit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "src/features/soundSeekers/content");
const BASIC = Object.freeze({
  a: "short_a", e: "short_e", i: "short_i", o: "short_o", u: "short_u",
  bb: "b", dd: "d", ff: "f", gg: "g", ll: "l", mm: "m", nn: "n",
  pp: "p", rr: "r", ss: "s", tt: "t", zz: "zz"
});
const CURRICULUM_TARGET_IDS = new Set(QUEST_STOPS.flatMap(stop => stop.teach.map(target => target.id)));

// These mappings are an authored review ledger, not a spelling rule. Only
// words used by scored v2 word decisions (plus named regression fixtures) may
// copy non-null evidence into the shipping record. All other generated units
// are explicitly non-assessed until an author reviews and adds them here.
const REVIEWED_EVIDENCE_TARGETS = Object.freeze({
  action: Object.freeze(["a", "c", "tion"]),
  bike: Object.freeze(["b", "i_e", "k"]),
  bird: Object.freeze(["b", "ir", "d"]),
  boat: Object.freeze(["b", "oa", "t"]),
  book: Object.freeze(["b", "oo_short", "k"]),
  box: Object.freeze(["b", "o", "x"]),
  bun: Object.freeze(["b", "u", "n"]),
  by: Object.freeze(["b", "y_ie"]),
  cake: Object.freeze(["c", "a_e", "k"]),
  car: Object.freeze(["c", "ar"]),
  cat: Object.freeze(["c", "a", "t"]),
  cats: Object.freeze(["c", "a", "t", "suffix_s"]),
  chair: Object.freeze(["ch", "air"]),
  city: Object.freeze(["c_s", "i", "t", "y_ee"]),
  clap: Object.freeze(["c", "l", "a", "p"]),
  coin: Object.freeze(["c", "oi", "n"]),
  cube: Object.freeze(["c", "u_e", "b"]),
  cup: Object.freeze(["c", "u", "p"]),
  fiction: Object.freeze(["f", "i", "c", "tion"]),
  frog: Object.freeze(["f", "r", "o", "g"]),
  hand: Object.freeze(["h", "a", "n", "d"]),
  hear: Object.freeze(["h", "ear"]),
  home: Object.freeze(["h", "o_e", "m"]),
  hot: Object.freeze(["h", "o", "t"]),
  jam: Object.freeze(["j", "a", "m"]),
  light: Object.freeze(["l", "igh", "t"]),
  little: Object.freeze(["l", "i", "t", "le"]),
  mat: Object.freeze(["m", "a", "t"]),
  moon: Object.freeze(["m", "oo", "n"]),
  near: Object.freeze(["n", "ear"]),
  night: Object.freeze(["n", "igh", "t"]),
  point: Object.freeze(["p", "oi", "n", "t"]),
  pop: Object.freeze(["p", "o", "p"]),
  pure: Object.freeze(["p", "ure"]),
  rain: Object.freeze(["r", "ai", "n"]),
  rock: Object.freeze(["r", "o", "ck"]),
  ship: Object.freeze(["sh", "i", "p"]),
  sit: Object.freeze(["s", "i", "t"]),
  sound: Object.freeze(["s", "ou", "n", "d"]),
  spin: Object.freeze(["s", "p", "i", "n"]),
  stone: Object.freeze(["s", "t", "o_e", "n"]),
  storm: Object.freeze(["s", "t", "or", "m"]),
  table: Object.freeze(["t", null, "b", "le"]),
  station: Object.freeze(["s", "t", null, "tion"]),
  theme: Object.freeze(["th", "e_e", "m"]),
  thin: Object.freeze(["th", "i", "n"]),
  thing: Object.freeze(["th", "i", "ng"]),
  tree: Object.freeze(["t", "r", "ee"]),
  truck: Object.freeze(["t", "r", "u", "ck"])
});

const SHORT_OO = new Set(["book", "look", "cook", "foot", "good", "wood", "hook", "took"]);
const OW_AS_OU = new Set(["cow", "now", "brown", "down", "town", "how"]);
const Y_LONG_I = new Set(["by", "my", "try", "why", "fly", "cry", "sky"]);
const Y_LONG_E = new Set(["happy", "funny", "sunny", "muddy", "silly", "city", "ready", "any", "many"]);
const EA_SHORT_E = new Set(["bread", "head", "ready"]);
const VOICED_TH = new Set(["the", "this", "that", "then", "them", "with", "they", "their", "there", "these"]);
const FINAL_Z = new Set(["dogs", "goes", "these", "use", "amuse", "fuse", "close"]);

// Each tuple is [printed grapheme, instructional sound key, authored role,
// optional reviewed evidence target]. The compiler fills omitted values only
// from the explicit curriculum maps above, then persists the result.
// These are the contextual/irregular records that spelling alone cannot supply.
const EXPLICIT = Object.freeze({
  map: [["m", "m", "regular"], ["a", "short_a", "regular"], ["p", "p", "regular"]],
  top: [["t", "t", "regular"], ["o", "short_o", "regular"], ["p", "p", "regular"]],
  sun: [["s", "s", "regular"], ["u", "short_u", "regular"], ["n", "n", "regular"]],
  dog: [["d", "d", "regular"], ["o", "aw", "irregular"], ["g", "g", "regular"]],
  insect: [["i", "short_i", "regular"], ["n", "n", "regular"], ["s", "s", "regular"], ["e", "short_e", "regular"], ["c", "c", "regular"], ["t", "t", "regular"]],
  ox: [["o", "short_o", "regular"], ["x", "x", "regular"]],
  umbrella: [["u", "short_u", "regular"], ["m", "m", "regular"], ["b", "b", "regular"], ["r", "r", "regular"], ["e", "short_e", "regular"], ["ll", "l", "regular"], ["a", "schwa", "irregular"]],
  egg: [["e", "short_e", "regular"], ["gg", "g", "regular"]],
  web: [["w", "w", "regular"], ["e", "short_e", "regular"], ["b", "b", "regular"]],
  queen: [["qu", "qu", "regular"], ["ee", "ee", "regular"], ["n", "n", "regular"]],
  yak: [["y", "y", "regular"], ["a", "short_a", "regular"], ["k", "k", "regular"]],

  i: [["i", "i_e", "irregular"]],
  the: [["th", "th_voiced", "irregular"], ["e", "schwa", "irregular"]],
  is: [["i", "short_i", "regular"], ["s", "z", "irregular"]],
  a: [["a", "schwa", "irregular"]],
  to: [["t", "t", "regular"], ["o", "oo", "irregular"]],
  my: [["m", "m", "regular"], ["y", "y_ie", "irregular"]],
  he: [["h", "h", "regular"], ["e", "ee", "irregular"]],
  she: [["sh", "sh", "regular"], ["e", "ee", "irregular"]],
  we: [["w", "w", "regular"], ["e", "ee", "irregular"]],
  me: [["m", "m", "regular"], ["e", "ee", "irregular"]],
  be: [["b", "b", "regular"], ["e", "ee", "irregular"]],
  was: [["w", "w", "regular"], ["a", "short_o", "irregular"], ["s", "z", "irregular"]],
  no: [["n", "n", "regular"], ["o", "ow", "irregular"]],
  you: [["y", "y", "regular"], ["ou", "oo", "irregular"]],
  they: [["th", "th_voiced", "irregular"], ["ey", "ay", "irregular"]],
  her: [["h", "h", "regular"], ["er", "er", "regular"]],
  all: [["a", "aw", "irregular"], ["ll", "l", "regular"]],
  are: [["are", "ar", "irregular"]],
  said: [["s", "s", "regular"], ["ai", "short_e", "irregular"], ["d", "d", "regular"]],
  so: [["s", "s", "regular"], ["o", "ow", "irregular"]],
  have: [["h", "h", "regular"], ["a", "short_a", "regular"], ["ve", "v", "irregular"]],
  some: [["s", "s", "regular"], ["o", "short_u", "irregular"], ["me", "m", "irregular"]],
  come: [["c", "c", "regular"], ["o", "short_u", "irregular"], ["me", "m", "irregular"]],
  were: [["w", "w", "regular"], ["ere", "er", "irregular"]],
  there: [["th", "th_voiced", "irregular"], ["ere", "air", "irregular"]],
  little: [["l", "l", "regular"], ["i", "short_i", "regular"], ["tt", "t", "regular"], ["le", "le", "regular"]],
  one: [["o", "once_onset", "irregular"], ["ne", "n", "irregular"]],
  do: [["d", "d", "regular"], ["o", "oo", "irregular"]],
  what: [["wh", "w", "regular"], ["a", "short_u", "irregular"], ["t", "t", "regular"]],
  oh: [["oh", "ow", "irregular"]],
  their: [["th", "th_voiced", "irregular"], ["eir", "air", "irregular"]],
  people: [["p", "p", "regular"], ["eo", "ee", "irregular"], ["p", "p", "regular"], ["le", "le", "regular"]],
  looked: [["l", "l", "regular"], ["oo", "oo_short", "regular"], ["k", "k", "regular"], ["ed", "t", "suffix-past-unvoiced"]],
  called: [["c", "c", "regular"], ["a", "aw", "irregular"], ["ll", "l", "regular"], ["ed", "d", "suffix-past-voiced"]],
  asked: [["a", "short_a", "regular"], ["s", "s", "regular"], ["k", "k", "regular"], ["ed", "t", "suffix-past-unvoiced"]],
  your: [["y", "y", "regular"], ["our", "or", "irregular"]],
  water: [["w", "w", "regular"], ["a", "aw", "irregular"], ["t", "t", "regular"], ["er", "er", "regular"]],
  where: [["wh", "w", "regular"], ["ere", "air", "irregular"]],
  who: [["wh", "h", "irregular"], ["o", "oo", "irregular"]],
  again: [["a", "schwa", "irregular"], ["g", "g", "regular"], ["ai", "short_e", "irregular"], ["n", "n", "regular"]],
  thought: [["th", "th", "regular"], ["ough", "aw", "irregular"], ["t", "t", "regular"]],
  through: [["th", "th", "regular"], ["r", "r", "regular"], ["ough", "oo", "irregular"]],
  work: [["w", "w", "regular"], ["or", "er", "irregular"], ["k", "k", "regular"]],
  any: [["a", "short_e", "irregular"], ["n", "n", "regular"], ["y", "y_ee", "irregular"]],
  many: [["m", "m", "regular"], ["a", "short_e", "irregular"], ["n", "n", "regular"], ["y", "y_ee", "irregular"]],
  laughed: [["l", "l", "regular"], ["a", "short_a", "irregular"], ["ugh", "f", "irregular"], ["ed", "t", "suffix-past-unvoiced"]],
  because: [["b", "b", "regular"], ["e", "short_i", "irregular"], ["c", "c", "regular"], ["au", "aw", "irregular"], ["se", "z", "irregular"]],
  different: [["d", "d", "regular"], ["i", "short_i", "regular"], ["ff", "f", "regular"], ["er", "er", "regular"], ["e", "schwa", "irregular"], ["n", "n", "regular"], ["t", "t", "regular"]],
  eyes: [["eye", "i_e", "irregular"], ["s", "z", "suffix-plural-voiced"]],
  friends: [["f", "f", "regular"], ["r", "r", "regular"], ["ie", "short_e", "irregular"], ["n", "n", "regular"], ["d", "d", "regular"], ["s", "z", "suffix-plural-voiced"]],
  once: [["o", "once_onset", "irregular"], ["n", "n", "regular"], ["ce", "s", "irregular"]],
  please: [["p", "p", "regular"], ["l", "l", "regular"], ["ea", "ee", "regular"], ["se", "z", "irregular"]],
  could: [["c", "c", "regular"], ["oul", "oo_short", "irregular"], ["d", "d", "regular"]],
  would: [["w", "w", "regular"], ["oul", "oo_short", "irregular"], ["d", "d", "regular"]],
  should: [["sh", "sh", "regular"], ["oul", "oo_short", "irregular"], ["d", "d", "regular"]],
  giant: [["g", "g_j", "context-soft-g"], ["i", "i_e", "irregular"], ["a", "schwa", "irregular"], ["n", "n", "regular"], ["t", "t", "regular"]],
  jumped: [["j", "j", "regular"], ["u", "short_u", "regular"], ["m", "m", "regular"], ["p", "p", "regular"], ["ed", "t", "suffix-past-unvoiced"]],
  landed: [["l", "l", "regular"], ["a", "short_a", "regular"], ["n", "n", "regular"], ["d", "d", "regular"], ["ed", "ed_id", "suffix-past-syllabic"]],
  wanted: [["w", "w", "regular"], ["a", "aw", "context"], ["n", "n", "regular"], ["t", "t", "regular"], ["ed", "ed_id", "suffix-past-syllabic"]],
  amuse: [["a", "schwa", "irregular"], ["m", "m", "regular"], ["u_e", "u_e", "regular"], ["s", "z", "irregular"]],
  as: [["a", "short_a", "regular"], ["s", "z", "irregular"]],
  before: [["b", "b", "regular"], ["e", "short_i", "irregular"], ["f", "f", "regular"], ["ore", "ore", "regular"]],
  birds: [["b", "b", "regular"], ["ir", "ir", "regular"], ["d", "d", "regular"], ["s", "z", "suffix-plural-voiced"]],
  bridge: [["b", "b", "regular"], ["r", "r", "regular"], ["i", "short_i", "regular"], ["dge", "g_j", "irregular"]],
  clear: [["c", "c", "regular"], ["l", "l", "regular"], ["ear", "ear_lax", "context"]],
  climb: [["c", "c", "regular"], ["l", "l", "regular"], ["i", "i_e", "irregular"], ["mb", "m", "irregular"]],
  complete: [["c", "c", "regular"], ["o", "schwa", "irregular"], ["m", "m", "regular"], ["p", "p", "regular"], ["l", "l", "regular"], ["e_e", "e_e", "regular"], ["t", "t", "regular"]],
  creature: [["c", "c", "regular"], ["r", "r", "regular"], ["ea", "ea", "regular"], ["t", "ch", "irregular"], ["ure", "er", "irregular"]],
  cross: [["c", "c", "regular"], ["r", "r", "regular"], ["o", "aw", "context"], ["ss", "s", "regular"]],
  dear: [["d", "d", "regular"], ["ear", "ear_lax", "context"]],
  delete: [["d", "d", "regular"], ["e", "short_i", "irregular"], ["l", "l", "regular"], ["e_e", "e_e", "regular"], ["t", "t", "regular"]],
  echo: [["e", "short_e", "regular"], ["ch", "ch_k", "context"], ["o", "ow", "context"]],
  every: [["e", "short_e", "regular"], ["v", "v", "regular"], ["er", "er", "regular"], ["y", "y_ee", "context"]],
  fear: [["f", "f", "regular"], ["ear", "ear_lax", "context"]],
  from: [["f", "f", "regular"], ["r", "r", "regular"], ["o", "short_u", "irregular"], ["m", "m", "regular"]],
  go: [["g", "g", "regular"], ["o", "ow", "irregular"]],
  going: [["g", "g", "regular"], ["o", "ow", "irregular"], ["i", "short_i", "suffix-progressive"], ["ng", "ng", "suffix-progressive"]],
  here: [["h", "h", "regular"], ["ere", "ear", "irregular"]],
  huge: [["h", "h", "regular"], ["u_e", "u_e", "regular"], ["g", "g_j", "context-soft-g"]],
  leave: [["l", "l", "regular"], ["ea", "ea", "regular"], ["ve", "v", "irregular"]],
  listen: [["l", "l", "regular"], ["i", "short_i", "regular"], ["st", "s", "irregular"], ["e", "schwa", "irregular"], ["n", "n", "regular"]],
  long: [["l", "l", "regular"], ["o", "aw", "context"], ["ng", "ng", "regular"]],
  lotion: [["l", "l", "regular"], ["o", "o_e", "context"], ["tion", "tion", "regular"]],
  manure: [["m", "m", "regular"], ["a", "schwa", "irregular"], ["n", "n", "regular"], ["ure", "ure_no_y", "context"]],
  motion: [["m", "m", "regular"], ["o", "o_e", "context"], ["tion", "tion", "regular"]],
  nation: [["n", "n", "regular"], ["a", "a_e", "context"], ["tion", "tion", "regular"]],
  near: [["n", "n", "regular"], ["ear", "ear_lax", "context"]],
  obscure: [["o", "schwa", "irregular"], ["b", "b", "regular"], ["s", "s", "regular"], ["c", "c", "regular"], ["ure", "ure", "regular"]],
  of: [["o", "short_u", "irregular"], ["f", "v", "irregular"]],
  off: [["o", "aw", "context"], ["ff", "f", "regular"]],
  over: [["o", "o_e", "irregular"], ["v", "v", "regular"], ["er", "er", "regular"]],
  picture: [["p", "p", "regular"], ["i", "short_i", "regular"], ["c", "c", "regular"], ["t", "ch", "irregular"], ["ure", "er", "irregular"]],
  secure: [["s", "s", "regular"], ["e", "short_i", "irregular"], ["c", "c", "regular"], ["ure", "ure", "regular"]],
  song: [["s", "s", "regular"], ["o", "aw", "context"], ["ng", "ng", "regular"]],
  stars: [["s", "s", "regular"], ["t", "t", "regular"], ["ar", "ar", "regular"], ["s", "z", "suffix-plural-voiced"]],
  station: [["s", "s", "regular"], ["t", "t", "regular"], ["a", "a_e", "context"], ["tion", "tion", "regular"]],
  sure: [["s", "sh", "irregular"], ["ure", "ure_no_y", "context"]],
  table: [["t", "t", "regular"], ["a", "a_e", "context"], ["b", "b", "regular"], ["le", "le", "regular"]],
  tube: [["t", "t", "regular"], ["u_e", "oo", "context"], ["b", "b", "regular"]],
  waking: [["w", "w", "regular"], ["a", "a_e", "context"], ["k", "k", "regular"], ["i", "short_i", "suffix-progressive"], ["ng", "ng", "suffix-progressive"]],
  walked: [["w", "w", "regular"], ["al", "aw", "irregular"], ["k", "k", "regular"], ["ed", "t", "suffix-past-unvoiced"]],
  whole: [["wh", "h", "irregular"], ["o", "ow", "irregular"], ["le", "l", "irregular"]],
  words: [["w", "w", "regular"], ["or", "er", "irregular"], ["d", "d", "regular"], ["s", "z", "suffix-plural-voiced"]],
  year: [["y", "y", "regular"], ["ear", "ear_lax", "context"]]
});

const BLOCKED_KEYS = Object.freeze({
  schwa: "release_blocked_missing_instructional_audio",
  once_onset: "release_blocked_missing_instructional_audio",
  ed_id: "release_blocked_missing_instructional_audio",
  ear_lax: "release_blocked_missing_instructional_audio",
  ure_no_y: "release_blocked_missing_instructional_audio"
});

const FUNCTION_MEANINGS = Object.freeze({
  a: ["determiner", "One person or thing, without saying exactly which one."],
  all: ["determiner", "Every one of a group, with none left out."],
  and: ["conjunction", "A joining word that puts ideas together."],
  any: ["determiner", "One or more, without choosing a particular one."],
  are: ["verb", "A form of be used when talking about you or more than one."],
  be: ["verb", "To exist or to have a particular state."],
  because: ["conjunction", "A word that introduces the reason something happened."],
  could: ["verb", "A word used for something that was possible or might happen."],
  do: ["verb", "To carry out an action."],
  he: ["pronoun", "A word used for a boy or man already being talked about."],
  her: ["pronoun", "A word used for a girl or woman already being talked about."],
  i: ["pronoun", "The word a speaker uses to mean themself."],
  is: ["verb", "A form of be used for one person or thing."],
  many: ["determiner", "A large number of people or things."],
  me: ["pronoun", "The word a speaker uses when an action happens to them."],
  my: ["determiner", "Belonging to the person who is speaking."],
  no: ["determiner", "Not any; used to show that something is absent or not allowed."],
  one: ["number", "The number that comes before two."],
  she: ["pronoun", "A word used for a girl or woman already being talked about."],
  should: ["verb", "A word used for what is a good or expected thing to do."],
  so: ["conjunction", "A joining word that shows a result."],
  some: ["determiner", "An amount or number, but not all."],
  the: ["determiner", "A word used before a particular person, place, or thing."],
  their: ["determiner", "Belonging to the people or things being talked about."],
  there: ["adverb", "In, at, or toward that place."],
  they: ["pronoun", "A word used for people or things already being talked about."],
  this: ["determiner", "The person or thing that is close or being pointed to."],
  through: ["preposition", "From one side or end of something to the other."],
  to: ["preposition", "A word that can show direction, place, or the start of an action."],
  was: ["verb", "A past form of be used for one person or thing."],
  we: ["pronoun", "The word a speaker uses for themself and other people together."],
  were: ["verb", "A past form of be used for you or more than one."],
  what: ["pronoun", "A question word used to ask about a thing or idea."],
  when: ["adverb", "A question word used to ask about time."],
  where: ["adverb", "A question word used to ask about a place."],
  who: ["pronoun", "A question word used to ask which person."],
  would: ["verb", "A word used to talk about an imagined choice or likely action."],
  you: ["pronoun", "The word used for the person or people being spoken to."],
  your: ["determiner", "Belonging to the person or people being spoken to."]
});

const MEANING_HINTS = Object.freeze({
  map: ["noun", "A drawing that shows where places are."],
  top: ["noun", "A toy that spins on a point."],
  sun: ["noun", "The star that gives Earth daylight and warmth."],
  insect: ["noun", "A small animal with six legs."],
  ox: ["noun", "A large farm animal that can pull heavy loads."],
  umbrella: ["noun", "A cover held above you to keep off rain."],
  egg: ["noun", "An oval object laid by a bird."],
  web: ["noun", "Silk threads spun by a spider."],
  queen: ["noun", "A woman who rules a kingdom."],
  yak: ["noun", "A large shaggy animal with horns."],

  ship: ["noun", "A large boat that carries people or things across water."],
  moon: ["noun", "The round object seen in the night sky that moves around Earth."],
  cake: ["noun", "A sweet baked food often shared at a celebration."],
  pop: ["verb", "To burst suddenly or make a short, sharp sound."],
  cat: ["noun", "A small furry animal often kept as a pet."],
  cats: ["noun", "More than one cat."],
  dog: ["noun", "A friendly animal often kept as a pet."],
  dogs: ["noun", "More than one dog."],
  city: ["noun", "A large town where many people live and work."],
  giant: ["noun", "A very large imaginary person or creature."],
  table: ["noun", "A piece of furniture with a flat top and legs."],
  apple: ["noun", "A round fruit that grows on a tree."],
  wanted: ["verb", "Wished to have or do something in the past."],
  landed: ["verb", "Came down onto the ground or another surface."],
  jumped: ["verb", "Pushed off the ground and moved into the air in the past."],
  new: ["adjective", "Made, found, or received only a short time ago."],
  grew: ["verb", "Became bigger or developed over time."],
  few: ["determiner", "A small number of people or things."],
  thin: ["adjective", "Having only a small distance from one side to the other."],
  work: ["verb", "To use effort to complete a job or task."],
  friends: ["noun", "People who know, like, and care about one another."],
  people: ["noun", "Human beings considered as a group."],
  thought: ["verb", "Used the mind to form an idea or remember something."],
  different: ["adjective", "Not the same as something else."],
  again: ["adverb", "One more time."],
  please: ["adverb", "A polite word used when asking for something."],
  eyes: ["noun", "The parts of the body used for seeing."],
  water: ["noun", "The clear liquid that people, animals, and plants need to live."],
  laughed: ["verb", "Made a happy sound because something was funny."],
  called: ["verb", "Spoke loudly to get attention or gave something a name."],
  asked: ["verb", "Used words to request information or help."],
  looked: ["verb", "Turned the eyes toward something to see it."],
  once: ["adverb", "One time, and not more than that."],
  little: ["adjective", "Small in size or amount."],
  have: ["verb", "To own, hold, or experience something."],
  like: ["verb", "To enjoy or feel pleased by something."],
  come: ["verb", "To move toward a place or person."],
  out: ["adverb", "Away from the inside of a place or thing."],
  oh: ["interjection", "A short word used to show surprise, understanding, or feeling."]
});

const AUTHORED_SENSES = Object.freeze(Object.fromEntries(`
action|something that a person or thing does
air|the invisible gas people and animals breathe
am|a form of be used with I
amuse|to make someone smile or enjoy themselves
an|one person or thing before a vowel sound
apple|a round fruit that grows on a tree
arm|the body part from shoulder to hand
as|in the same way or at the same time
at|in, on, or near a particular place
athlete|a person who trains and takes part in sports
back|the rear part of a body or object
bad|not good, pleasant, or helpful
bang|a sudden loud noise
bank|land beside a river, or a place that keeps money
bark|the outer covering of a tree, or a dog's sharp sound
bat|an animal that flies at night, or a club used in games
bath|water used for washing the whole body
beach|sand or stones beside the sea or a lake
bed|a piece of furniture used for sleeping
before|earlier than a time or event
bell|a hollow object that rings when struck
best|better than every other choice
big|large in size
bike|a two-wheeled vehicle moved by pedals
bin|a container used to hold or collect things
bird|an animal with feathers, wings, and a beak
birds|more than one bird
bit|a small piece, or the past form of bite
black|the darkest colour
block|a solid piece, or something that stops a path
blow|to move air from the mouth or be moved by wind
blue|the colour of a clear daytime sky
boat|a small vessel that travels on water
bone|a hard part inside a body that supports it
book|pages joined together for reading
born|brought into life
bottle|a container with a narrow neck for liquids
box|a container with flat sides
boy|a male child
bread|food baked from flour and water
brick|a hard block used for building walls
bridge|a structure that carries a path over a gap
bright|giving much light or looking full of colour
bring|to carry something toward a person or place
brown|the colour of soil or tree bark
bud|a small new growth that can become a leaf or flower
bun|a small round bread roll
burn|to be hurt or changed by heat or fire
bus|a large road vehicle that carries many people
but|a joining word that introduces a different idea
buzz|a low humming sound made by a bee or machine
by|near something, or showing who did an action
camp|a place where people stay in tents or cabins
can|to be able to, or a metal container
candle|wax with a wick that gives light when lit
cap|a soft hat with a brim
car|a road vehicle with four wheels
card|a stiff piece of paper used for a message or game
care|to look after someone or think something matters
cell|a tiny basic part of a living thing, or a small room
chair|a seat for one person with a back
chat|to talk in a friendly way
chess|a board game played with two sets of pieces
chew|to crush food with the teeth
chin|the part of the face below the mouth
chip|a small broken piece, or a thin piece of food
chop|to cut with a strong downward movement
clap|to strike the hands together to make a sound
claw|a sharp curved nail on an animal
clear|easy to see or understand
click|a short sharp sound, or to press a computer control
climb|to move upward using hands, feet, or both
close|to shut, or to be near
cloud|a white or grey mass of tiny water drops in the sky
coat|clothing worn over other clothes for warmth
coin|a small round piece of metal used as money
complete|finished with no part missing
cook|to prepare food using heat
corn|a tall crop with rows of yellow kernels
cow|a large farm animal that can give milk
crab|a sea animal with a hard shell and claws
crash|to hit something hard and suddenly
creature|a living animal or an imaginary living being
cross|to go from one side to another
cry|to have tears because of a strong feeling
cub|the young of animals such as bears, lions, or foxes
cube|a solid shape with six equal square faces
cup|a small container used for drinking
cure|to make an illness or problem go away
curl|to form or move into a curved shape
cut|to divide something with a sharp tool
cute|pleasant and appealing in a small or playful way
dad|a father
dark|having little or no light
day|the time from morning until night
dear|loved or valued very much
delete|to remove words, pictures, or information
did|the past form of do
dish|a shallow container used for serving food
doll|a toy shaped like a person
down|toward a lower place
draw|to make a picture with lines
dream|pictures and events the mind experiences during sleep
drip|to fall in small drops
drum|a musical instrument played by striking its surface
duck|a water bird with a broad bill
ear|the body part used for hearing
eat|to take food into the mouth and swallow it
echo|a sound heard again after bouncing back
endure|to keep going through something difficult
enjoy|to take pleasure in something
every|each one in a group
extreme|very great or far beyond what is usual
fair|reasonable and equal, or a public event with games
fan|a device that moves air, or a person who strongly likes something
farm|land used to grow crops or raise animals
fast|moving or happening quickly
fear|the feeling of being afraid
feet|more than one foot
fell|moved downward suddenly; the past form of fall
fern|a green plant with feathery leaves and no flowers
fiction|a story created from imagination
fight|to struggle against someone or something
fin|a flat body part that helps a fish swim
fish|an animal that lives in water and breathes through gills
fit|the right size or shape, or healthy and strong
fix|to repair something that is broken
fizz|a soft hissing sound made by bubbles
flag|a piece of cloth with a design used as a symbol
flame|the bright burning part of a fire
flip|to turn over quickly
fly|to move through the air
follow|to go behind or move along the same route
food|things people or animals eat for energy and growth
foot|the body part at the end of a leg
fork|a tool with pointed prongs used for eating
found|discovered or came upon; the past form of find
fox|a wild animal with a pointed face and bushy tail
frog|a small jumping animal that lives on land and in water
from|showing the place, time, or person where something starts
funny|making someone laugh or seeming strange
fuse|a safety part that stops too much electricity, or to join by melting
game|an activity played for fun using rules
gap|an empty space between things
gas|a substance like air that spreads to fill a space
gate|a movable barrier in a fence or wall
gem|a valuable or beautiful stone
get|to receive, obtain, or reach something
gift|something given to another person
girl|a female child
glad|happy and pleased
glass|a hard clear material, or a cup made from it
globe|a round model of Earth, or any ball-shaped object
glue|a sticky substance used to join things
go|to move or travel somewhere
goat|a farm animal with hooves and often horns
goes|moves or travels; a form of go
going|moving or travelling toward a place
good|helpful, pleasant, or of high quality
got|received or obtained; the past form of get
grab|to take hold of something quickly
green|the colour of grass and many leaves
grin|a wide smile
grow|to become bigger or develop
had|owned or experienced in the past
hair|the strands that grow from skin
ham|meat from a pig's leg
hand|the body part at the end of an arm
happy|feeling pleased or full of joy
hard|firm, difficult, or requiring much effort
hat|a covering worn on the head
head|the top body part containing the brain, eyes, ears, nose, and mouth
hear|to notice sound with the ears
here|in or at this place
hid|put out of sight; the past form of hide
hide|to put something where it cannot be seen
high|far above the ground or another level
him|a pronoun for a boy or man receiving an action
hiss|a long sharp s sound
hit|to strike or touch something with force
hole|an opening or empty space in something
home|the place where a person or family lives
hook|a curved tool used to catch or hold things
hot|having a high temperature
how|a question word asking in what way
huff|to breathe out loudly, often from effort or annoyance
huge|very large
hurt|to cause pain or feel pain
ice|water frozen into a hard solid
if|a word introducing something that may happen
in|inside a place or thing
it|a pronoun for a thing or animal already mentioned
its|belonging to a thing or animal
jam|fruit spread, a tight blockage, or to push something into a space
jet|a fast aircraft powered by jet engines
job|a piece of work or a paid role
join|to connect or become part of a group
joke|something said or done to make people laugh
joy|a strong feeling of happiness
jug|a container with a handle used for pouring liquid
jump|to push off a surface and move into the air
jumping|pushing off a surface and moving into the air
keep|to continue to have, hold, or stay with something
kick|to strike with the foot
kid|a child, or a young goat
king|a male ruler
kiss|to touch with the lips to show affection
kit|a set of tools or supplies for one purpose
kite|a light frame flown in the wind on a string
lamp|a device that gives light
land|the solid ground, or to come down onto it
last|coming after all others, or continuing for a time
late|after the expected or usual time
leaf|a flat green part that grows from a plant stem
leave|to go away from a person or place
leg|a body part used for standing and walking
less|a smaller amount
lid|a cover for the top of a container
lie|to rest flat, or to say something untrue
lift|to raise something to a higher place
light|brightness that makes seeing possible, or not heavy
listen|to pay attention to sound
lit|gave light to, or was burning
lock|a device that keeps something shut
long|measuring a great distance from end to end
look|to turn the eyes toward something
lot|a large amount or number
lotion|a smooth liquid rubbed onto the skin
loud|making a strong sound
mad|angry or upset
made|created or built; the past form of make
magic|imaginary power that makes surprising things happen
mail|letters and parcels sent to people
make|to create, build, or cause something
man|an adult male person
manure|animal waste used to help plants grow
mat|a small flat covering placed on a floor or surface
mats|more than one mat
may|might happen, or having permission
middle|the part halfway between two ends
mile|a measure of distance equal to 1,760 yards
miss|to fail to hit, reach, or notice something
mix|to combine things together
more|a greater amount or number
motion|the act of moving
mouth|the body opening used for eating and speaking
much|a large amount
muddy|covered with or full of mud
mule|an animal whose parents are a horse and a donkey
must|used for something required or certain
mute|silent, or to turn off sound
name|a word used to identify a person, place, or thing
nation|a country and its people
near|a short distance away
net|woven string with open spaces used to catch or hold things
night|the dark time between evening and morning
not|a word that makes a statement negative
note|a short written message, or a musical sound
now|at the present time
obscure|not well known or difficult to see clearly
of|showing belonging, connection, amount, or material
off|away from, not touching, or not operating
oil|a slippery liquid used as food, fuel, or lubricant
on|touching and supported by a surface, or operating
over|above, across, or finished
paint|coloured liquid spread on a surface, or to apply it
pair|two things that belong or work together
park|public green land, or to leave a vehicle in a place
pat|to touch gently with a flat hand
path|a track made for walking
paw|the foot of an animal with claws or pads
pen|a tool that writes with ink, or a small animal enclosure
pick|to choose or take something
picture|an image made by drawing, painting, or a camera
pie|baked food with pastry around a filling
pig|a farm animal with a snout and curly tail
pin|a small pointed object used to fasten things
pink|a pale red colour
pit|a deep hole in the ground, or a hard fruit stone
plan|an organized idea for what to do
plate|a flat dish used for serving food
play|to take part in a game or activity for enjoyment
plum|a small round fruit with a stone inside
point|a sharp end, a place, or an important idea
pot|a container used for cooking or growing plants
press|to push firmly
prop|an object that supports something or is used in a performance
puff|a small burst of air, smoke, or breath
pup|a young dog
pure|clean and not mixed with anything unwanted
puzzle|a problem or game solved by careful thinking
quest|a long search or adventure with a purpose
quit|to stop doing something
race|a contest to see who is fastest
rain|water drops falling from clouds
ran|moved quickly on foot; the past form of run
rat|a small rodent with a long tail
reach|to stretch to touch something or arrive at a place
read|to understand written words
reading|the act of understanding written words
ready|prepared for what will happen next
red|the colour of a ripe tomato or stop sign
rest|to relax or stop working for a while
rich|having much money, flavour, or useful material
ride|to travel on an animal or in a vehicle
right|correct, or the direction opposite left
rim|the outer edge of a round object
ring|a circular band, or a clear bell-like sound
road|a hard route made for vehicles
rock|a hard natural piece of stone
rocks|more than one rock
room|a part of a building enclosed by walls
rope|a thick strong cord made from twisted strands
round|shaped like a circle or ball
run|to move quickly on foot
`.trim().split("\n").map(row => {
  const separator = row.indexOf("|");
  return [row.slice(0, separator), ["multiple", row.slice(separator + 1)]];
})));

const AUTHORED_SENSES_LATE = Object.freeze(Object.fromEntries(`
sad|feeling unhappy
said|spoke words; the past form of say
sail|a sheet that catches wind to move a boat
sand|tiny grains of rock found on beaches or in deserts
sat|rested on a seat or surface; the past form of sit
saw|a toothed cutting tool, or the past form of see
say|to speak words
scare|to make someone feel afraid
school|a place where children learn
seat|a place made for sitting
secure|safe, firmly fixed, or protected
see|to notice something with the eyes
seed|the small part of a plant that can grow into a new plant
shape|the outline or form of something
share|to let others use or have part of something
sharp|having a fine edge or point that can cut
shed|a small simple building used for storage
sheep|a woolly farm animal
shell|the hard outer covering of an animal or object
shine|to give or reflect bright light
shirt|clothing worn on the upper body
shop|a place where things are sold, or to buy things
short|small in length, height, or time
shout|to speak very loudly
show|to let someone see or understand something
sick|ill or not feeling well
side|an edge, face, or position beside something
sight|something seen, or the ability to see
silly|playful, foolish, or not sensible
simple|easy to understand or do
sing|to make music with the voice
singing|making music with the voice
sink|to move downward below a surface, or a basin with taps
sit|to rest with the body's weight on a seat
six|the number after five
skin|the outer covering of a person's or animal's body
skip|to move with a step and hop, or leave something out
sky|the space above Earth where clouds and stars are seen
slide|to move smoothly across a surface
slip|to slide by accident or move out of place
slow|moving or happening without much speed
slug|a small soft animal like a snail without a shell
smell|to notice an odour with the nose, or the odour itself
smile|a happy or friendly look made by curving the mouth
smoke|the grey or dark gas and particles made by burning
snake|a long legless reptile
snap|to break suddenly or make a quick sharp sound
snip|to cut with a quick small movement
snow|soft white ice crystals falling from clouds
sock|clothing worn on a foot
soft|easy to press, smooth, or not loud
soil|the earth in which plants grow
song|words and music sung together
soon|after a short time
sound|something heard when vibrations reach the ears
spare|extra or available when needed
spin|to turn around and around quickly
spoon|a small eating tool with a rounded bowl
spot|a small mark, or a particular place
spun|turned around quickly; the past form of spin
stair|one step in a staircase
star|a bright ball of hot gas seen in the night sky
stare|to look steadily for a long time
stars|more than one star
start|to begin
station|a place where trains or buses stop, or a work position
stay|to remain in a place or condition
step|one movement of a foot, or one part of a process
still|not moving, or continuing up to a time
stone|a hard solid piece of rock
stop|to end movement or an action
store|a shop, or to keep something for later
storm|weather with strong wind, rain, snow, thunder, or lightning
such|of the kind just mentioned
sunny|bright with light from the sun
sure|certain or confident that something is true
surf|waves breaking near shore, or to ride them on a board
swim|to move through water using the body
swing|to move back and forth around a fixed point
take|to get, carry, or move something
tape|a long narrow strip used for sticking or recording
team|a group that works or plays together
tell|to give information by speaking or writing
ten|the number after nine
term|a word for something, or a set period of time
thank|to tell someone you are grateful
that|a word pointing to a person or thing farther away
them|a pronoun for people or things receiving an action
theme|the main idea that runs through a story or activity
then|at that time or next in order
these|a word pointing to nearby people or things
thing|an object, action, event, or idea
third|coming after first and second
tie|to fasten with a knot, or an equal result
time|what clocks measure as events pass
tin|a silvery metal, or a metal container
toast|bread browned by heat
toe|one of the small parts at the end of a foot
took|carried or received; the past form of take
town|a place with streets and buildings, smaller than a city
toy|an object made for play
train|railway vehicles joined together, or to practise a skill
trash|rubbish that is thrown away
tray|a flat container used to carry things
tree|a tall plant with a trunk and branches
trip|a journey, or to catch a foot and stumble
truck|a large road vehicle used to carry goods
true|correct and based on fact
try|to make an effort to do something
tube|a long hollow object, often round
turn|to change direction or rotate
up|toward a higher place
us|a pronoun for the speaker and other people receiving an action
use|to do something with an object for a purpose
van|a road vehicle used to carry people or goods
vet|an animal doctor
wait|to stay until something happens or someone arrives
waking|stopping sleep and becoming awake
walked|moved on foot at a steady pace in the past
wax|a soft solid material used in candles or polish
way|a route, direction, or method
went|travelled or moved; the past form of go
whale|a very large sea mammal
which|a question word used to choose from known options
whip|to strike or move quickly with a flexible cord
white|the lightest colour, like fresh snow
whole|complete, with every part included
why|a question word used to ask for a reason
win|to finish first or succeed in a contest
wink|to close and open one eye quickly
wish|to want or hope for something
wit|the ability to think quickly and say clever things
with|together with, using, or having something
wood|the hard material inside a tree
words|spoken or written units that carry meaning
year|a period of twelve months
yes|a word used to agree or answer positively
yum|a sound used to show that food tastes good
zap|to strike or affect suddenly with energy
zip|a fastener with interlocking teeth, or to move quickly
`.trim().split("\n").map(row => {
  const separator = row.indexOf("|");
  return [row.slice(0, separator), ["multiple", row.slice(separator + 1)]];
})));

function storyTokens(stop) {
  return (stop.pages || []).flatMap(page => [page.text, ...(page.choices || [])]
    .flatMap(text => String(text).toLowerCase().match(/[a-z']+/g) || [])
    .map(word => word.replace(/'s$/, "")));
}

function assignLetterIndices(word, authoredUnits) {
  const claimed = new Set();
  return authoredUnits.map(([grapheme, soundKey, role = "regular", evidenceTargetId]) => {
    const letters = grapheme.includes("_") ? grapheme.split("_") : grapheme.split("");
    const indices = [];
    let searchFrom = 0;
    for (const letter of letters) {
      let found = -1;
      for (let index = searchFrom; index < word.length; index += 1) {
        if (!claimed.has(index) && word[index] === letter) { found = index; break; }
      }
      if (found < 0) {
        for (let index = 0; index < word.length; index += 1) {
          if (!claimed.has(index) && word[index] === letter) { found = index; break; }
        }
      }
      if (found < 0) throw new Error(`${word}: cannot place grapheme ${grapheme}`);
      claimed.add(found);
      indices.push(found);
      searchFrom = found + 1;
    }
    if (evidenceTargetId === undefined) {
      throw new Error(`${word}:${grapheme} is missing an explicit reviewed evidence value`);
    }
    const reviewedEvidenceTargetId = evidenceTargetId;
    if (reviewedEvidenceTargetId !== null && !CURRICULUM_TARGET_IDS.has(reviewedEvidenceTargetId)) {
      throw new Error(`${word}:${grapheme} has unknown evidence target ${reviewedEvidenceTargetId}`);
    }
    return {
      grapheme,
      soundKey,
      letterIndices: indices,
      role,
      evidenceTargetId: reviewedEvidenceTargetId,
      ...(BLOCKED_KEYS[soundKey] ? { releaseBlockingStatus: BLOCKED_KEYS[soundKey] } : {})
    };
  });
}

function soundKeyFor(word, grapheme, unitIndex, segments) {
  if (grapheme === "th" && VOICED_TH.has(word)) return "th_voiced";
  if (grapheme === "ew") return word === "few" ? "ew_yoo" : "ew";
  if (grapheme === "oo" && SHORT_OO.has(word)) return "oo_short";
  if (grapheme === "ow" && OW_AS_OU.has(word)) return "ow_ou";
  if (grapheme === "y" && Y_LONG_I.has(word)) return "y_ie";
  if (grapheme === "y" && Y_LONG_E.has(word)) return "y_ee";
  if (grapheme === "ea" && EA_SHORT_E.has(word)) return "ea_e";
  if (grapheme === "g" && (word === "gem" || (word === "magic" && unitIndex === 2))) return "g_j";
  if (grapheme === "c" && ["city", "cell", "race", "ice"].includes(word)) return "c_s";
  if (grapheme === "ch" && ["school", "echo"].includes(word)) return "ch_k";
  if (grapheme === "s" && FINAL_Z.has(word) && unitIndex === segments.length - 1) return "z";
  return BASIC[grapheme] || grapheme;
}

function roleFor(word, grapheme, unitIndex, segments, soundKey) {
  if (word === "cats" && unitIndex === segments.length - 1) return "suffix-plural-unvoiced";
  if (word === "dogs" && unitIndex === segments.length - 1) return "suffix-plural-voiced";
  if (["jumping", "singing", "reading"].includes(word) && unitIndex >= segments.length - 2) return "suffix-progressive";
  if (soundKey === "th_voiced") return "context-voiced-th";
  if (["c_s", "g_j", "ch_k", "ea_e", "oo_short", "ow_ou", "ew_yoo"].includes(soundKey)) return "context";
  return "regular";
}

function authoredUnitsFor(word) {
  const authored = EXPLICIT[word] || (() => {
    const segments = segmentWord(word);
    return segments.map((grapheme, unitIndex) => {
      const soundKey = soundKeyFor(word, grapheme, unitIndex, segments);
      return [grapheme, soundKey, roleFor(word, grapheme, unitIndex, segments, soundKey)];
    });
  })();
  const reviewedTargets = REVIEWED_EVIDENCE_TARGETS[word] || null;
  if (reviewedTargets && reviewedTargets.length !== authored.length) {
    throw new Error(`${word}: reviewed evidence target count does not match authored units`);
  }
  return authored.map(([grapheme, soundKey, role = "regular", evidenceTargetId], unitIndex) => [
    grapheme,
    soundKey,
    role,
    reviewedTargets ? reviewedTargets[unitIndex] : (evidenceTargetId ?? null)
  ]);
}

function meaningFor(word) {
  const authoredMeaning = FUNCTION_MEANINGS[word]
    || MEANING_HINTS[word]
    || AUTHORED_SENSES[word]
    || AUTHORED_SENSES_LATE[word];
  if (!authoredMeaning) throw new Error(`${word}: missing authored child-safe meaning`);
  const [partOfSpeech, sense] = authoredMeaning;
  const actionCue = partOfSpeech === "verb"
    ? `Act out “${word}” with a simple movement, then use it in a short sentence.`
    : `Point to or mime an example of “${word},” then use it in a short sentence.`;
  return {
    id: meaningIdFor(word), word, sense, actionCue, partOfSpeech, ageBand: "5-8",
    reference: { kind: "action", id: `meaning-action-${word}` }
  };
}

function meaningIdFor(word) {
  return word === "ship" ? "ship-vessel" : `${word}-meaning`;
}

function buildCorpus() {
  const entries = new Map();
  for (const stop of QUEST_STOPS) {
    const story = storyTokens(stop);
    for (const value of [...stop.words, ...stop.heartWords, ...story]) {
      const word = value.toLowerCase();
      const entry = entries.get(word) || { word, taughtAt: new Set(), decodable: false, heartWord: false, connectedText: false };
      entry.taughtAt.add(stop.id);
      if (stop.words.some(item => item.toLowerCase() === word)) entry.decodable = true;
      if (stop.heartWords.some(item => item.toLowerCase() === word)) entry.heartWord = true;
      if (story.includes(word)) entry.connectedText = true;
      entries.set(word, entry);
    }
  }
  // Oral picture anchors are not additions to the independently decodable bank.
  for(const [targetId,metadata] of Object.entries(SOUND_SEEKERS_TEACH_TARGETS)){
    for(const {word} of [metadata,...metadata.alternates||[]])if(word&&!entries.has(word)){
      const stop=QUEST_STOPS.find(s=>s.teach.some(t=>t.id===targetId));
      entries.set(word,{word,taughtAt:new Set(stop?[stop.id]:[]),decodable:false,heartWord:false,connectedText:false,oralAnchor:true});
    }
  }
  // SS-03 names `pop` as the repeated-tile acceptance fixture even though the
  // legacy 431-word banks did not include it. Keep it explicit so the shared
  // workbench cannot silently lose duplicate physical tiles.
  entries.set("pop", {
    word: "pop",
    taughtAt: new Set(["s5"]),
    decodable: true,
    heartWord: false,
    connectedText: false,
    workbenchFixture: true
  });
  return [...entries.values()].sort((a, b) => a.word.localeCompare(b.word));
}

function buildRecords() {
  return Object.fromEntries(buildCorpus().map(entry => {
    const tags = [
      ...(entry.decodable ? ["decodable"] : []),
      ...(entry.heartWord ? ["heart-word"] : []),
      ...(entry.connectedText ? ["connected-text"] : []),
      ...(entry.oralAnchor ? ["oral-teaching-anchor"] : []),
      ...(entry.workbenchFixture ? ["word-workbench-fixture"] : [])
    ];
    return [entry.word, {
      id: entry.word,
      word: entry.word,
      pronunciation: entry.word,
      meaningId: meaningIdFor(entry.word),
      units: assignLetterIndices(entry.word, authoredUnitsFor(entry.word)),
      taughtAt: [...entry.taughtAt].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
      tags
    }];
  }));
}

function renderModule(exportName, value, intro) {
  return `${intro}\nexport const ${exportName} = Object.freeze(${JSON.stringify(value, null, 2)});\n`;
}

function renderCorpusInvariant(records) {
  const recordIds = Object.keys(records).sort((left, right) => left.localeCompare(right));
  const contentHash = createHash("sha256").update(JSON.stringify(records)).digest("hex");
  return `// Generated canonical membership and content identity. Do not hand-edit.\n`
    + `export const PRONUNCIATION_CORPUS_RECORD_IDS = Object.freeze(${JSON.stringify(recordIds, null, 2)});\n`
    + `export const PRONUNCIATION_CORPUS_CONTENT_HASH = ${JSON.stringify(contentHash)};\n`
    + "export const PRONUNCIATION_CORPUS_RECORD_COUNT = PRONUNCIATION_CORPUS_RECORD_IDS.length;\n";
}

const records = buildRecords();
assertPronunciationsMatchReference(records);
const meanings = Object.fromEntries(Object.keys(records).map(word => [meaningIdFor(word), meaningFor(word)]));
const outputs = new Map([
  [path.join(CONTENT_DIR, "pronunciationRecords.js"), renderModule("PRONUNCIATION_RECORDS", records,
    "// Explicit shipping records compiled at authoring time. Runtime code must not segment spellings.")],
  [path.join(CONTENT_DIR, "pronunciationCorpusInvariant.generated.js"), renderCorpusInvariant(records)],
  [path.join(CONTENT_DIR, "wordMeanings.js"), renderModule("WORD_MEANINGS", meanings,
    "// Child-safe meaning/action records for every currently reachable Sound Seekers word.")]
]);

if (process.argv.includes("--write")) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  for (const [file, source] of outputs) fs.writeFileSync(file, source);
  console.log(`Wrote ${Object.keys(records).length} explicit pronunciation records, the derived corpus invariant, and ${Object.keys(meanings).length} meaning records.`);
} else {
  let stale = false;
  for (const [file, expected] of outputs) {
    const actual = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    if (actual !== expected) {
      stale = true;
      console.error(`${path.relative(ROOT, file)} is stale; run node tools/buildSoundSeekersPronunciationLexicon.mjs --write`);
    }
  }
  if (stale) process.exit(1);
  console.log(`Sound Seekers pronunciation source is current: ${Object.keys(records).length} records.`);
}
