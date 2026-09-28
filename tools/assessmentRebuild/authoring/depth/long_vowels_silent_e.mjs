import { author, key as K, wrong as W } from "./builders.mjs";
const rows=[
 ["a_e",1,"name","n_m_",["i_e","o_e","u_e"]], ["i_e",1,"hide","h_d_",["a_e","o_e","u_e"]],
 ["o_e",1,"nose","n_s_",["a_e","i_e","u_e"]], ["u_e",1,"June","J_n_",["a_e","i_e","o_e"]],
 ["a_e",2,"bake","b_k_",["i_e","o_e","u_e"]], ["i_e",2,"shine","sh_n_",["a_e","o_e","u_e"]],
 ["o_e",2,"stone","st_n_",["a_e","i_e","u_e"]], ["u_e",2,"costume","cost_m_",["a_e","i_e","o_e"]]
];
export default author("long_vowels_silent_e",rows.map(([u,lvl,target,blank,rivals])=>({
 u,lvl,fmt:"LONG_VOWEL_SILENT_E_PATTERN",prompt:`Which vowel pattern completes ${blank}?`,spoken:`${target}. Which vowel pattern completes the word?`,
 choices:[K(u),...rivals.map(t=>W(t,"D-VOWEL"))],target,media:"audio-required",evidenceModality:"audio+print",audioRole:"target_word",
 constructClaim:"silent_e_vowel_spelling",note:lvl===1?"New familiar VCe word rather than another permutation of an existing target.":"Apply the VCe pattern within a consonant cluster or longer word; no vowel-team knowledge is required."
})));
