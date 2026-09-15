// Shared short-vowel CVC words with reviewed, text-free pictures. The cycle
// and taught-grapheme checks both apply; sight-word exposure does not unlock
// an untaught phonics spelling. X is two phonemes and is not CVC here.
export const CYCLE_WORD_BUILD_INVENTORY = Object.freeze([
  ["mat", 2, "/media/initial-sounds/images/m/mat.webp"],
  ["sit", 3, "/images/child-mode/short-i/sit.webp"],
  ["tin", 3, "/media/vocabulary/images/tin.webp"],
  ["fan", 4, "/images/child-mode/initial-sounds/fan.webp"],
  ["hat", 6, "/images/child-mode/cvc/hat.webp"],
  ["ram", 6, "/images/child-mode/short-a/ram.webp"],
  ["rat", 6, "/images/child-mode/initial-sounds/rat.webp"],
  ["bat", 8, "/images/child-mode/cvc/bat.webp"],
  ["sun", 9, "/images/child-mode/cvc/sun.webp"],
  ["run", 9, "/images/child-mode/initial-sounds/run.webp"],
  ["bun", 9, "/images/child-mode/short-u/bun.webp"],
  ["log", 10, "/images/child-mode/cvc/log.webp"],
  ["wig", 10, "/images/child-mode/short-i/wig.webp"],
  ["mug", 10, "/images/child-mode/cvc/mug.webp"],
  ["cat", 10, "/images/child-mode/cvc/cat.webp"],
  ["can", 10, "/media/vocabulary/images/can.webp"],
  ["bag", 10, "/images/child-mode/cvc/bag.webp"],
  ["bug", 10, "/images/child-mode/cvc/bug.webp"],
  ["dog", 10, "/images/child-mode/cvc/dog.webp"],
  ["cup", 11, "/images/assessment/objective-words/cup.webp"],
  ["map", 11, "/images/child-mode/cvc/map.webp"],
  ["cap", 11, "/images/child-mode/cvc/cap.webp"],
  ["pan", 11, "/images/child-mode/cvc/pan.webp"],
  ["pig", 11, "/images/child-mode/short-i/pig.webp"],
  ["pin", 11, "/images/child-mode/minimal-pairs/pin.webp"],
  ["pot", 11, "/images/child-mode/cvc/pot.webp"],
  ["pup", 11, "/images/assessment/rhyming/variants/pup/pup-02.webp"],
  ["web", 12, "/images/child-mode/short-e/web.webp"],
  ["van", 12, "/images/child-mode/initial-sounds/van.webp"],
  ["hen", 12, "/images/child-mode/initial-sounds/hen.webp"],
  ["net", 12, "/images/child-mode/short-e/net.webp"],
  ["bed", 12, "/images/child-mode/cvc/bed.webp"],
  ["pen", 12, "/images/child-mode/short-e/pen.webp"],
  ["kit", 13, "/media/vocabulary/images/kit.webp"],
  ["kid", 13, "/images/child-mode/initial-sounds/kid.webp"],
  ["jam", 13, "/images/child-mode/short-a/jam.webp"],
  ["jet", 13, "/images/child-mode/short-e/jet.webp"],
  ["zip", 13, "/images/child-mode/short-i/zip.webp"]
].map(([word, authorizedFromCycle, image]) => Object.freeze({ word, graphemes: [...word], authorizedFromCycle, image })));

// These existing generic registry pictures were rejected for printing the
// answer or failing to identify the intended object. Keep them out of word
// construction on both learning surfaces, including the independent check.
export const CYCLE_WORD_BUILD_IMAGE_HOLDOUTS = Object.freeze(["sat", "man", "fin", "dad", "fat", "lot", "gum", "gap", "vet"]);
