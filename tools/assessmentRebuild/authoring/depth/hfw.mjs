import { author, key as K, wrong as W } from "./builders.mjs";
// Independent language contexts for every one of the 100 approved words.
// L1 hears the complete sentence and recognizes the missing printed word;
// L2 hears a different sentence and encodes the word from distractor tiles.
// No answer is inferred from grammar alone or printed in the instruction.
export function hfwDepth(skillId, source) {
 const rows=source.trim().split("\n").flatMap(line=>{
  const [u,recognition,encoding,distractors]=line.trim().split("|");
  if(!u||!recognition?.includes("___")||!encoding?.includes("___")||distractors?.split(",").length!==3)throw new Error(`Invalid HFW source: ${line}`);
  const prompt=u==="the"?"Listen. Choose its missing word.":"Listen. Pick the missing word.";
  const common={u,media:"audio-required",target:u,audioRole:"target_word",evidenceModality:"audio+print"};
  return [{...common,lvl:1,fmt:"HFW_SENTENCE_CLOZE",prompt,spoken:`${recognition.replace("___",u)} ${prompt}`,sentence:recognition,
   choices:[K(u),...distractors.split(",").map(t=>W(t,"D-FUNCTION-SWAP"))],constructClaim:"contextual_high_frequency_word_recognition",
   note:"Recognize the exact spoken word in a new complete sentence. Distractors are real words from this or earlier taught bands; the complete sentence recording supplies the exact word to recognize."},
   {...common,lvl:2,fmt:"HFW_LETTER_BUILD",prompt:u==="the"?"Listen. Build its missing word.":"Listen. Build the missing word.",spoken:`${encoding.replace("___",u)} Build the missing word.`,sentence:encoding,sentenceText:encoding.replace("___",u),
   choices:[K(u)],letterTiles:[...u,...({a:["e","o"],i:["e","y"]}[u]||["e","a"])],constructClaim:"contextual_high_frequency_word_encoding",
   note:"Encode the word in a different original context, retaining its repeated letters and competing vowel tiles; recognition choices cannot supply the spelling."}];
 });
 return author(skillId,rows);
}
