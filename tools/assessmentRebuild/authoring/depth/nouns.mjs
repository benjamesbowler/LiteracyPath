import { author, text, key as K, wrong as W } from "./builders.mjs";
export default author("nouns", [
  text("noun_person", 1, "GRAMMAR_WORD_CHOICE", "Which word names someone who fixes a pipe?", [K("plumber"), W("repair"), W("leaking"), W("carefully")], "A person word contrasted with the related action, state and manner."),
  text("noun_animal", 1, "GRAMMAR_WORD_CHOICE", "Which word names an animal?", [K("otter"), W("swims"), W("sleepy"), W("gently")], "New aquatic mammal vocabulary; grammatical category stays the target."),
  text("noun_place", 1, "GRAMMAR_WORD_CHOICE", "Which word names somewhere people watch a film?", [K("cinema"), W("watch"), W("funny"), W("quietly")], "Naming a place rather than the action done there."),
  text("noun_thing", 1, "GRAMMAR_WORD_CHOICE", "Which naming word means something used for cutting paper?", [K("scissors"), W("cut"), W("sharp"), W("carefully")], "A plural-looking object name is still a naming word."),
  text("noun_in_sentence", 2, "GRAMMAR_CONTRAST", "Which word names something in ‘Our coach carried the equipment’?", [K("equipment"), W("carried"), W("our"), W("the")], "Transfer from easily pictured count nouns to a familiar mass noun."),
  text("noun_vs_verb", 2, "GRAMMAR_CONTRAST", "Where is ‘paint’ a naming word?", [K("The paint dried overnight."), W("We paint very carefully."), W("Please paint the fence."), W("They paint after lunch.")], "The same word changes function; meaning and syntax, not memorized word lists, decide."),
  text("noun_two_step", 2, "GRAMMAR_CONTRAST", "Which sentence has exactly TWO naming words?", [K("Our footprints crossed the sand."), W("We waited quietly."), W("Our little puppy slept peacefully."), W("Footprints crossed sand and mud.")], "Count two plural/mass nouns while rejecting zero, one and three; sentence length is not the rule."),
  text("noun_vs_verb", 2, "GRAMMAR_CONTRAST", "Where is ‘brush’ a naming word?", [K("A soft brush cleaned it."), W("We brush our teeth."), W("Please brush slowly."), W("They brush every morning.")], "Transfer a flexible familiar word to its actual function in a complete sentence.")
]);
