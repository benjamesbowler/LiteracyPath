import { author, key as K, wrong as W } from "./builders.mjs";
const rows=[
 ["short_a",1,"map","m_p",["a","e","i","o"]], ["short_e",1,"red","r_d",["e","a","i","u"]],
 ["short_i",1,"wig","w_g",["i","e","o","a"]], ["short_o",1,"fog","f_g",["o","a","u","i"]],
 ["short_u",1,"mud","m_d",["u","a","o","e"]], ["short_a",2,"clap","cl_p",["a","e","i","o"]],
 ["short_e",2,"sled","sl_d",["e","i","a","u"]], ["short_i",2,"lift","l_ft",["i","e","a","o"]],
 ["short_o",2,"stomp","st_mp",["o","u","a","i"]], ["short_u",2,"stump","st_mp",["u","o","i","e"]]
];
export default author("cvc_short_vowels",rows.map(([u,lvl,target,blank,vowels],index)=>({
 u,lvl,ph:index%2+1,fmt:"MISSING_VOWEL_CVC",prompt:`Which vowel completes ${blank}?`,
 spoken:`${target}. Which vowel completes the word?`,choices:vowels.map((t,i)=>i?W(t,"D-VOWEL"):K(t)),
 target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",constructClaim:"heard_word_medial_vowel_spelling",
 note:lvl===1?"Apply the vowel spelling to a previously untested CVC target; exact audio removes unrelated picture-naming demand.":"Map the heard vowel inside a longer consonant frame; near minimal-pair alternatives create meaningful vowel pressure."
})));
