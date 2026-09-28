import { author, key as K, wrong as W } from "./builders.mjs";
const rows=[
 ["short_a",1,"jam",["a","e","u","o"]], ["short_e",1,"peg",["e","i","a","u"]],
 ["short_i",1,"lid",["i","e","o","u"]], ["short_o",1,"rod",["o","u","a","i"]],
 ["short_u",1,"hug",["u","o","a","e"]], ["short_a",2,"sand",["a","e","i","o"]],
 ["short_e",2,"tent",["e","i","a","u"]], ["short_i",2,"fish",["i","e","a","o"]],
 ["short_o",2,"frog",["o","u","a","i"]], ["short_u",2,"lump",["u","o","i","e"]]
];
export default author("short_vowel_discrimination",rows.map(([u,lvl,target,vowels],index)=>({
 u,lvl,ph:index%2+1,fmt:"LISTEN_CHOOSE_VOWEL",prompt:"Which letter spells the middle vowel sound?",
 spoken:`${target}. Which letter spells the middle vowel sound?`,choices:vowels.map((t,i)=>i?W(t,"D-VOWEL"):K(t)),
 target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",constructClaim:"spoken_medial_vowel_discrimination",
 note:lvl===1?"New short spoken word; no written target gives the vowel away.":"Isolate the medial vowel through a digraph or consonant cluster in a new target."
})));
