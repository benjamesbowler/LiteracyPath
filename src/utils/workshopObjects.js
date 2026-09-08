// Authored spelling tiles and object actions for this construction game.
// Keep visible spelling separate from the canonical recorded phoneme key.
// The pool stays inside the live CVC curriculum bands; abstract verbs and
// adjectives do not become invented picture objects.
const recipes = [
  ["cat", "c a t", "rest", "mat", "The cat rests on the mat."],
  ["bed", "b e d", "room", "room", "The bed is ready in the room."],
  ["bat", "b a t", "fly", "night sky", "The bat flies across the night sky."],
  ["bus", "b u s", "drive", "bus stop", "The bus reaches the stop."],
  ["pen", "p e n", "write", "paper", "The pen draws a blue line."],
  ["fan", "f a n", "blow", "paper", "The fan blows the paper aside."],
  ["mop", "m o p", "clean", "floor", "The mop clears the puddle."],
  ["net", "n e t", "catch", "ball", "The net catches the ball."],
  ["hat", "h a t", "hang", "peg", "The hat hangs on the peg."],
  ["cup", "c u p", "plate", "tray", "The cup rests on the tray."],
  ["ship", "sh i p", "float", "water trough", "The ship floats across the water."],
  ["fish", "f i sh", "float", "pond", "The fish swims across the pond."],
  ["frog", "f r o g", "hop", "lily pad", "The frog lands on the lily pad."],
  ["tree", "t r ee", "grow", "meadow", "The tree grows tall in the meadow."],
  ["flag", "f l a g", "wave", "flagpole", "The flag rises up the pole."],
  ["lamp", "l a m p", "light", "workbench", "The lamp lights the workbench."],
  ["rock", "r o ck", "drop", "bucket", "The rock lands in the bucket."],
  ["ring", "r i ng", "drop", "box", "The ring rests inside the box."],
  ["drum", "d r u m", "beat", "music stand", "The sticks tap the drum."],
  ["duck", "d u ck", "float", "pond", "The duck crosses the pond."],
  ["brush", "b r u sh", "comb", "hair", "The brush smooths the tangled hair."],
  ["clock", "c l o ck", "tick", "workbench", "The clock starts ticking."],
  ["train", "t r ai n", "rail", "track", "The train reaches the station."],
  ["plant", "p l a n t", "grow", "window", "The plant grows by the window."],
  ["shirt", "sh ir t", "hang", "peg", "The shirt hangs on the peg."],
  ["bread", "b r ea d", "plate", "plate", "The bread lands on the plate."],
  ["dress", "d r e ss", "spin", "dance floor", "The dress turns on the dance floor."],
  ["glass", "g l a ss", "plate", "tray", "The glass rests on the tray."],
  ["stamp", "s t a m p", "post", "envelope", "The stamp goes on the envelope."],
  ["bench", "b e n ch", "park", "park path", "The bench is ready beside the path."]
];

export const WORKSHOP_OBJECTS = Object.freeze(Object.fromEntries(recipes.map(([word, spelling, action, destination, useResult]) => [word, Object.freeze({
  action, destination, useResult,
  units: Object.freeze(spelling.split(" ").map(grapheme => Object.freeze({
    grapheme,
    phoneme: word === "bread" && grapheme === "ea" ? "ea_e" : grapheme === "ss" ? "s" : grapheme
  })))
})])));
