import { author, key as K, wrong as W } from "./builders.mjs";
// Each new anchor/contrast is authored, with full spoken options. Using a
// cluster in an anchor adds onset interference without revealing written rimes.
const rows=[
 ["at",1,"flat","hat","flag","hot","leaf"], ["an",1,"pan","fan","pat","pen","pot"],
 ["ap",1,"tap","nap","tag","tip","tin"], ["am",1,"clam","jam","clap","drum","crab"],
 ["ag",1,"flag","bag","flat","fog","cloth"], ["ub",1,"club","tub","clap","cab","cup"],
 ["ed",1,"bed","red","bet","bad","blanket"], ["en",1,"hen","pen","hat","pin","egg"],
 ["et",1,"net","jet","neck","nut","fish"], ["eg",1,"beg","leg","bed","bag","dog"],
 ["ig",1,"big","pig","bin","bug","small"], ["in",1,"fin","tin","fish","fan","tail"],
 ["ip",1,"ship","lip","shin","shop","boat"], ["ock",1,"rock","sock","rod","rack","stone"],
 ["og",1,"dog","log","dot","dig","cat"], ["op",1,"hop","top","hot","hip","jump"],
 ["ot",1,"hot","pot","hop","hut","warm"], ["ug",1,"slug","rug","slip","rag","snail"],
 ["un",1,"sun","run","sock","sand","moon"], ["up",1,"grown-up","cup","grow","cap","mum"],
 ["ut",1,"nut","cut","nap","net","seed"],
 ["ing",2,"spring","wing","spray","rang","flower"], ["ang",2,"rang","hang","rag","ring","bell"],
 ["ong",2,"strong","long","string","sang","weak"], ["ink",2,"think","sink","thin","tank","mind"],
 ["ock",2,"clock","block","clap","click","watch"], ["ack",2,"black","track","blank","brick","white"],
 ["ick",2,"thick","quick","thin","check","wide"], ["ill",2,"grill","hill","grin","well","cook"],
 ["all",2,"tall","small","tail","tell","high"], ["ell",2,"smell","shell","smile","spill","nose"],
 ["ash",2,"crash","flash","crab","fresh","car"], ["ish",2,"dish","wish","dig","dash","plate"],
 ["uck",2,"stuck","truck","stick","stack","glue"], ["ake",2,"lake","shake","late","like","pond"],
 ["ame",2,"flame","name","flat","foam","fire"], ["ide",2,"slide","hide","slip","sled","play"],
 ["ight",2,"bright","kite","brick","boat","lamp"], ["oat",2,"float","goat","flat","foot","swim"],
 ["eep",2,"deep","sleep","deer","dip","ocean"], ["ouse",2,"doghouse","mouse","dog","loose","pet"],
 ["ird",2,"heard","bird","head","board","ear"], ["urn",2,"fern","turn","fan","torn","leaf"],
 ["ar",2,"star","far","stop","store","sky"], ["or",2,"door","more","dog","deer","room"]
];
export default author("rhyming",rows.map(([u,lvl,target,key,onset,near,meaning])=>({
 u,lvl,fmt:lvl===1?"RHYME_MATCH_PICTURE":"READ_FIND_RHYME",
 prompt:"Which word rhymes with the word you hear?",spoken:`${target}. Which word rhymes with it?`,
 choices:[K(key),W(onset,"D-ONSET"),W(near,"D-RIME-NEAR"),W(meaning,"D-SEMANTIC")],
 target,media:"audio-required",evidenceModality:"audio",constructClaim:"spoken_rhyme_discrimination",hideWrittenLabels:true,
 note:lvl===1?"New spoken comparison with separate same-onset, near-rime and meaning distractors; print cannot substitute for listening.":"Transfer rhyme across clusters or different spellings; compare complete spoken endings instead of looking for matching letter chunks."
})));
