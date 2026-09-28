import { author, key as K, wrong as W } from "./builders.mjs";
const targets = [
 ["bl",1,"black","__ack",["b","cl","br"]], ["cl",1,"clean","__ean",["c","cr","gl"]],
 ["fl",1,"flat","__at",["f","fr","sl"]], ["pl",1,"plum","__um",["p","pr","cl"]],
 ["sl",1,"slim","__im",["s","sm","fl"]], ["br",1,"brave","__ave",["b","bl","dr"]],
 ["cr",1,"crack","__ack",["c","cl","tr"]], ["dr",1,"drip","__ip",["d","tr","br"]],
 ["fr",1,"fresh","__esh",["f","fl","gr"]], ["gr",1,"grass","__ass",["g","gl","cr"]],
 ["st",1,"step","__ep",["s","sp","sk"]], ["sw",1,"swam","__am",["s","sm","sl"]],
 ["sc",2,"scare","__are",["s","sk","st"]], ["sk",2,"skate","__ate",["s","sc","sp"]],
 ["sm",2,"small","__all",["s","sn","sl"]], ["sn",2,"snap","__ap",["s","sm","st"]],
 ["sp",2,"spin","__in",["s","st","sl"]], ["tr",2,"trip","__ip",["t","dr","cr"]],
 ["nd",2,"bend","be__",["n","nt","nk"]], ["nt",2,"spent","spe__",["n","nd","nk"]],
 ["mp",2,"bump","bu__",["m","nd","nt"]], ["nk",2,"thank","tha__",["n","ng","nt"]],
 ["lt",2,"felt","fe__",["l","ft","st"]], ["ft",2,"swift","swi__",["f","lt","st"]]
];
export default author("blends",targets.map(([u,lvl,target,blank,rivals])=>({
 u,lvl,fmt:"BLEND_COMPLETE_WORD",prompt:`Choose the missing letters for ${blank}.`,
 spoken:`${target}. Choose the missing letters.`,choices:[K(u),W(rivals[0],"D-ONSET"),...rivals.slice(1).map(t=>W(t,"D-PATTERN-TRAP"))],
 target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",
 pos:lvl===2&&["nd","nt","mp","nk","lt","ft"].includes(u)?"final":"initial",
 constructClaim:"map_spoken_word_to_blend_spelling",
 note:"New spoken target with an explicit one-consonant reduction trap and two neighbouring blends; the complete cluster is necessary."
})));
