import { author, key as K, wrong as W } from "./builders.mjs";
const targets=[
 ["ch",1,"cheese","__eese","initial",["c","sh","th"]],
 ["sh",1,"sheep","__eep","initial",["s","ch","wh"]],
 ["th",1,"thread","__read","initial",["t","sh","ch"]],
 ["wh",1,"which","__ich","initial",["w","th","ph"]],
 ["ph",1,"pheasant","__easant","initial",["p","th","wh"]],
 ["ck",1,"luck","lu__","final",["c","ch","sh"]],
 ["ch",2,"catch","cat__","final",["c","sh","ck"]],
 ["sh",2,"rush","ru__","final",["s","ch","th"]],
 ["th",2,"cloth","clo__","final",["t","sh","ch"]],
 ["wh",2,"whirlpool","__irlpool","initial",["w","th","ph"]],
 ["ph",2,"photograph","__otograph","initial",["p","th","wh"]],
 ["ck",2,"click","cli__","final",["c","ch","sh"]]
];
export default author("digraphs", targets.map(([u,lvl,target,blank,pos,rivals])=>({
 u,lvl,fmt:"DIGRAPH_COMPLETE_WORD",prompt:`${u==="ch"?"Select":"Choose"} the missing letters for ${blank}.`,
 spoken:`${target}. Choose the missing letters.`,choices:[K(u),W(rivals[0],"D-ONSET"),...rivals.slice(1).map(t=>W(t,"D-PATTERN-TRAP"))],
 target,pos,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",
 constructClaim:"map_spoken_word_to_digraph_spelling",
 note: "Transfer to a new target; distinguish a two-letter spelling from reduction to one letter and rival digraphs. The blank asks for letters, not an ambiguous isolated sound."
})));
