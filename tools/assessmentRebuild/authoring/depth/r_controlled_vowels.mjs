import { author, key as K, wrong as W } from "./builders.mjs";
const rows=[
 ["ar",1,"yard","y__d",["or","er","ir"]], ["or",1,"torn","t__n",["ar","er","ur"]],
 ["er",1,"germ","g__m",["ir","ur","ar"]], ["ir",1,"twirl","tw__l",["er","ur","or"]],
 ["ur",1,"surfer","s__fer",["ir","er","ar"]], ["ar",2,"artist","__tist",["or","er","ir"]],
 ["or",2,"order","__der",["ar","er","ur"]], ["er",2,"pepper","pepp__",["ir","ur","or"]],
 ["ir",2,"whirl","wh__l",["er","ur","ar"]], ["ur",2,"blur","bl__",["ir","er","or"]]
];
export default author("r_controlled_vowels",rows.map(([u,lvl,target,blank,rivals])=>({
 u,lvl,fmt:"R_CONTROLLED_PATTERN",prompt:`Which two letters complete ${blank}?`,spoken:`${target}. Which two letters complete the word?`,
 choices:[K(u),...rivals.map(t=>W(t,"D-PATTERN-TRAP"))],target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",
 constructClaim:"map_spoken_word_to_r_controlled_spelling",note:"Exact named-word spelling separates er/ir/ur rivals; the question never asks for a unique spelling of an unnamed sound."
})));
