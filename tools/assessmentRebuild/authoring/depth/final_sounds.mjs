import { author, key as K, wrong as W } from "./builders.mjs";
const targets = [
  ["b",1,"rib","tub",["rat","cup","hen"]], ["d",1,"red","re_",["r","t","b"]],
  ["g",1,"bug","bag",["bed","duck","sun"]], ["l",1,"bell","tail",["bed","hen","cup"]],
  ["m",1,"ram","gum",["rat","hen","cup"]], ["n",1,"pan","sun",["pot","ham","bed"]],
  ["p",1,"cap","map",["cat","tub","hen"]], ["t",1,"wet","cat",["web","bed","hen"]],
  ["sh",2,"crash","cra__",["ch","th","cr"]], ["th",2,"teeth","tee__",["sh","ch","t"]],
  ["ll",2,"smell","sme__",["ng","nd","sm"]], ["ng",2,"bang","ba__",["nk","nd","b"]],
  ["nd",2,"stand","sta__",["nt","nk","st"]], ["nk",2,"sink","si__",["ng","nt","s"]],
  ["st",2,"chest","che__",["sk","ft","ch"]], ["sk",2,"task","ta__",["st","nk","t"]],
  ["ft",2,"drift","dri__",["st","lt","dr"]], ["lt",2,"quilt","qui__",["ft","nt","qu"]]
];
export default author("final_sounds", targets.map(([u,lvl,target,blank,rivals])=> lvl === 1 && u !== "d" ? ({
  u,lvl,fmt:"ENDING_SOUND_WORD_MATCH",prompt:"Which word has the same final sound?",
  spoken:`${target[0].toUpperCase()}${target.slice(1)}. Which word has the same final sound?`,
  choices:[K(blank),...rivals.map((t,i)=>W(t,i===0?"D-POSITION":"D-RIME-NEAR"))],
  target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",pos:"final",
  constructClaim:"final_sound_discrimination",
  note:"A new heard-anchor and word comparison within the reviewed Level 1 vocabulary. The initial-sound rival and contrasting final sounds require attention to the ending, without a new spelling pattern."
}) : ({
  u,lvl,fmt:"ENDING_SOUND",prompt:`Which ${lvl===1?"letter":"letters"} complete${lvl===1?"s":""} ${blank}?`,
  spoken:`${target}. Which ${lvl===1?"letter matches the final sound":"letters complete the ending"}?`,
  choices:[K(u),...rivals.map((t,i)=>W(t,i===(lvl===1?0:rivals.length-1)?"D-POSITION":"D-RIME-NEAR"))],
  target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",pos:"final",
  constructClaim:"final_sound_grapheme_mapping",
  note: lvl===1 ? "A new exact spoken target; printed answer options name single final sounds." : "Choose the complete final spelling cluster, not a single component phoneme; contrasts include rival endings and onset intrusion."
})));
