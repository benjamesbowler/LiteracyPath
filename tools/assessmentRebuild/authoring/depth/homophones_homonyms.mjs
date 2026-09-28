import { author, text, key as K, wrong as W } from "./builders.mjs";
const H = "D-HOMOPHONE", V = "D-VISUAL-NEIGHBOR", F = "D-FUNCTION-SWAP";
const c=(u,lvl,sentence,correct,homophone,a,b,note)=>text(u,lvl,"HOMOPHONE_CONTEXT_CLOZE",`Which spelling fits: ${sentence}`,[K(correct),W(homophone,H),W(a,F),W(b,V)],note,{sentence});
export default author("homophones_homonyms",[
  c("sea_see",1,"Can you ___ through these clear glasses?","see","sea","seen","seed","Vision action in a modal frame; the sound-alike is the intended spelling trap."),
  c("sun_son",1,"Their only boy is their ___.","son","sun","sons","song","Family meaning and explicit singular distinguish all real-word alternatives."),
  c("be_bee",1,"A buzzing ___ gathered pollen from the flower.","bee","be","been","beet","Concrete animal meaning supplies the homophone contrast."),
  c("no_know",1,"Right now, I ___ the answer.","know","no","knows","known","Present-time cue excludes a grammatical past alternative."),
  c("one_won",1,"Yesterday our team ___ the final game.","won","one","win","winning","Past time and competition meaning select the victory spelling."),
  c("ate_eight",1,"Four plus four makes ___.","eight","ate","eighty","eighteen","Number-word knowledge in a familiar quantity relation; all distractors are true real words."),
  c("hear_here",1,"I can ___ bells ringing far away.","hear","here","heard","heart","Perception action after can excludes past tense and location."),
  c("blue_blew",1,"Her new coat matched the clear ___ sky.","blue","blew","blow","blown","Colour meaning selects the spelling without a colour-revealing picture."),
  c("to_two_too",2,"The jar is ___ tight for me to open.","too","two","to","tooth","Degree meaning contrasts all three homophones."),
  c("there_their",2,"The twins labelled both bags with ___ names.","their","there","them","theirs","Possession before a plural noun, not a location or standalone possessive."),
  c("right_write",2,"Use a pencil to ___ a message on this card.","write","right","wrote","writer","Infinitive verb in an authentic written-message context."),
  c("new_knew",2,"Before the lesson yesterday, I already ___ that fact.","knew","new","know","known","Two past-time cues make knew uniquely correct without relying on picture naming."),
  c("hour_our",2,"Sixty minutes make one ___.","hour","our","hours","ours","Quantity and time meaning distinguish singular noun from possessive."),
  c("flower_flour",2,"The gardener picked a ___ with five pink petals.","flower","flour","flowers","flowering","Botanical evidence and singular article constrain meaning and number."),
  c("would_wood",2,"The carpenter cut a plank from solid ___.","wood","would","wooden","woods","Material noun rather than modal verb or related adjective."),
  c("made_maid",2,"Last Saturday, Dad ___ a shelf from old boards.","made","maid","maker","makes","Explicit past time and making sense exclude present and homophone alternatives.")
]);
