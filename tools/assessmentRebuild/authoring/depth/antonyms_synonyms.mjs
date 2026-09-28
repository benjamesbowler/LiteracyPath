import { author, text, key as K, wrong as W } from "./builders.mjs";
const D = "D-SAME-DOMAIN", O = "D-OPPOSITE";
export default author("antonyms_synonyms", [
  text("antonym_concrete",1,"WORD_RELATION_TEXT_CHOICE","Which word means the opposite of ‘empty’?",[K("full"),W("hollow",D),W("vacant",D),W("bare",D)],"Contents contrast: the other words share absence rather than an unrelated category."),
  text("synonym_concrete",1,"WORD_RELATION_TEXT_CHOICE","Which word means the same as ‘begin’?",[K("start"),W("finish",O),W("pause",D),W("restart",D)],"All options concern the stage of an action; only start is equivalent."),
  text("antonym_picture",1,"LANGUAGE_PAIR_TEXT_CHOICE","Which pair has opposite meanings?",[K("awake — asleep"),W("awake — alert",D),W("awake — watchful",D),W("awake — wakeful",D)],"Familiar state contrast with same-domain distractors, not a subjective face image."),
  text("synonym_picture",1,"LANGUAGE_PAIR_TEXT_CHOICE","Which pair has the same meaning?",[K("shut — close"),W("shut — open",O),W("shut — lock",D),W("shut — slam",D)],"Locking or slamming adds a different action; closing alone matches shut."),
  text("antonym_precise",2,"LANGUAGE_PAIR_TEXT_CHOICE","Which word is the opposite of ‘generous’?",[K("selfish"),W("giving",D),W("kind",D),W("helpful",D)],"Precise social meaning; distractors are positive related traits, not merely unrelated adjectives."),
  text("synonym_shade",2,"LANGUAGE_PAIR_TEXT_CHOICE","Which word means ‘walk slowly for pleasure’?",[K("stroll"),W("march",D),W("dash",D),W("creep",D)],"Pace and purpose distinguish strolling from rhythm, speed and stealth."),
  text("antonym_in_context",2,"LANGUAGE_PAIR_TEXT_CHOICE","Which word has the opposite meaning to ‘ancient’ here?",[K("modern"),W("old",D),W("historic",D),W("aged",D)],"The intended age sense is fixed by the building context.",{sentence:"The ancient tower has stood for hundreds of years."}),
  text("synonym_in_context",2,"LANGUAGE_PAIR_TEXT_CHOICE","Which word can replace ‘faint’ without changing the meaning?",[K("dim"),W("bright",O),W("steady",D),W("flashing",D)],"Context selects weak light rather than the collapse sense of faint.",{sentence:"A faint light glowed at the far end of the tunnel."})
]);
