import { author, text, key as K, wrong as W } from "./builders.mjs";
const N = "D-FUNCTION-SWAP", S = "D-SEMANTIC";
const cloze = (u, lvl, sentence, words, note) => text(u,lvl,"PLURAL_SPELLING_CONTEXT","Which word fits?", [K(words[0]),W(words[1],N),W(words[2],S),W(words[3],S)],note,{sentence});
export default author("plurals", [
  cloze("plural_add_s",1,"Two ___ protect my hands from the cold.",["gloves","glove","scarf","mitten"],"Plural s with a number cue; paired objects contrast against singular and another clothing noun."),
  cloze("plural_concept",1,"Three baby ___ hatched and began chirping.",["chicks","chick","shell","egg"],"Number and meaning are both necessary: eggshells cannot chirp."),
  cloze("plural_add_es",1,"Both ___ tell the time on our wrists.",["watches","watch","clock","ring"],"The wrist clue separates watches from another valid plural timepiece."),
  cloze("plural_add_es",1,"Two red ___ had pointed ears and bushy tails.",["foxes","fox","box","cub"],"Real-word es contrast with an explicit action; only the plural animal completes it."),
  cloze("plural_y_to_ies",2,"Two ___ flap patterned wings above the flowers.",["butterflies","butterfly","berry","bird"],"Apply consonant-y to ies to a longer familiar animal word, using both meaning and number."),
  cloze("plural_irregular",2,"The dentist counted twenty baby ___ in my mouth.",["teeth","tooth","feet","foot"],"Irregular number and body-part meaning both constrain the response."),
  cloze("plural_f_to_ves",2,"Two young ___ stayed close to their mother cow.",["calves","calf","wolf","lamb"],"F-to-ves generalization to a less frequently tested animal word with explicit cow evidence."),
  cloze("plural_in_sentence",2,"There are six ___ in our choir, and each is a child.",["children","child","chicken","choir"],"Combine number agreement and meaning, rather than accepting every plural noun.")
]);
