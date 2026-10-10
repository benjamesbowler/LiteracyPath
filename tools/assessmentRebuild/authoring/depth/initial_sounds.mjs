import { author, key as K, wrong as W } from "./builders.mjs";
// New spoken vocabulary for every onset at both levels. The second target is
// longer or has stronger competing sounds; print never displays either word.
const targets = [
 ["a","axe","alligator",["e","o","s"],["i","g","l"]],
 ["b","bat","basketball",["p","a","t"],["p","s","l"]],
 ["c","cup","cucumber",["g","u","p"],["g","m","b"]],
 ["d","dot","dragon",["b","o","t"],["t","r","g"]],
 ["e","end","exit",["i","n","d"],["a","s","t"]],
 ["f","foot","factory",["v","u","t"],["v","k","r"]],
 ["g","gum","goldfish",["k","u","m"],["k","l","f"]],
 ["h","hip","hamster",["n","i","p"],["n","m","s"]],
 ["i","ill","impossible",["e","l","u"],["e","m","p"]],
 ["j","jog","jigsaw",["y","o","g"],["y","s","i"]],
 ["k","kid","kitten",["g","i","d"],["g","t","n"]],
 ["l","lip","lizard",["n","i","p"],["r","z","d"]],
 ["m","mud","monkey",["n","u","d"],["n","k","e"]],
 ["n","nap","napkin",["m","a","p"],["m","p","k"]],
 ["o","off","office",["a","f","e"],["a","f","s"]],
 ["p","pot","pineapple",["b","o","t"],["b","n","l"]],
 ["r","rug","rabbit",["w","u","g"],["w","b","t"]],
 ["s","sad","seahorse",["z","a","d"],["z","h","r"]],
 ["t","tap","toothbrush",["d","a","p"],["d","b","u"]],
 ["u","us","uncle",["o","s","i"],["o","k","l"]],
 ["v","vet","village",["f","e","t"],["f","l","i"]],
 ["w","wig","waterfall",["v","i","g"],["v","t","l"]],
 ["y","yell","yummy",["j","e","l"],["j","u","m"]],
 ["z","zip","zigzag",["s","i","p"],["s","g","a"]]
];
export default author("initial_sounds", targets.flatMap(([u, first, second, rivals1, rivals2]) => [first,second].map((target,i)=>({
  u,lvl:i+1,ph:u < "n" ? 1 : 2,fmt:"FIRST_SOUND",prompt:"Which letter matches the first sound?",
  spoken:`${target[0].toUpperCase()}${target.slice(1)}. Which letter matches the first sound?`,target,
  choices:[K(u),...(i===0?rivals1:rivals2).map((t,j)=>W(t,j===0?("aeiou".includes(u)?"D-VOWEL":"D-ONSET"):("aeiou".includes(t)?"D-VOWEL":"D-POSITION")))],
  media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",
  constructClaim:"initial_sound_grapheme_mapping",
  note:i===0 ? `Isolate the initial sound of the new familiar spoken target ${target}; no printed target supplies the key.` : `Transfer initial-sound isolation to ${target}, retaining later-sound interference in a longer word.`
}))));
