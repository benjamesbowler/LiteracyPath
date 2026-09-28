import { author, key as K, wrong as W } from "./builders.mjs";
const rows=[
 ["ai",1,"mail","m__l",["ay","ea","oa"]], ["ay",1,"gray","gr__",["ai","oy","ow"]],
 ["ee",1,"deep","d__p",["ea","ai","oo"]], ["ea",1,"meat","m__t",["ee","oa","oi"]],
 ["oa",1,"float","fl__t",["ow","ai","oo"]], ["igh",1,"high","h___",["i_e","ay","ee"]],
 ["oo",2,"cool","c__l",["ou","ow","oa"]], ["ow",2,"frown","fr__n",["ou","oa","aw"]],
 ["ou",2,"mouth","m__th",["ow","oo","oa"]], ["oi",2,"join","j__n",["oy","ow","ou"]],
 ["oy",2,"joyful","j__ful",["oi","ow","ay"]], ["ew",2,"dew","d__",["oo","ou","ow"]],
 ["aw",2,"dawn","d__n",["oa","ow","ou"]]
];
export default author("vowel_teams",rows.map(([u,lvl,target,blank,rivals])=>({
 u,lvl,fmt:"LONG_VOWEL_TEAM_COMPLETE",prompt:`Which letters complete ${blank}?`,spoken:`${target}. Which letters complete the word?`,
 choices:[K(u),...rivals.map(t=>W(t,"D-PATTERN-TRAP"))],target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",
 constructClaim:"map_spoken_word_to_vowel_team_spelling",note:"New real-word target with same-sound rival spellings and alternative vowel-team sounds; exact spelling is necessary, not just the initial consonant."
})));
