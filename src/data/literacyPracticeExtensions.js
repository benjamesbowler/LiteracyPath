import { literacySkill } from '../policy/literacyPracticePolicy.js';

// Original MAP-preparation practice, not NWEA items or a calibrated assessment.
// Public activities are explicitly identified below; no retention questions or
// reserved progress-check questions are borrowed. A missing recording remains a
// missing requirement, never a licence to substitute a different spoken task.
export const LITERACY_EXTENSION_VERSION = 'literacy-extensions-2026-10-10.1';
export const LITERACY_EXTENSION_SKILLS = Object.freeze([
  literacySkill('letter_knowledge', 'Letter names and matching cases', 'print', 'Match a spoken letter name to print, then match its upper and lower cases.'),
  literacySkill('print_concepts', 'Print and book concepts', 'print', 'Find titles, authors, words, and the next reading position in a real book.'),
  literacySkill('syllable_awareness', 'Syllables in spoken words', 'sound_awareness', 'Say a new word naturally and tap each spoken beat without seeing its spelling.'),
  literacySkill('sound_manipulation', 'Changing and blending sounds', 'sound_awareness', 'Blend, add, remove, or change a spoken sound before checking a fresh word.'),
  literacySkill('capitalization', 'Capital letters in writing', 'writing', 'Check the beginning of a sentence, names, days, places, and the pronoun I.'),
  literacySkill('punctuation', 'Punctuation and editing', 'writing', 'Choose a mark for the sentence purpose, then edit a fresh sentence.'),
  literacySkill('informational_features', 'Information, text features, and evidence', 'reading', 'Use a heading, contents page, glossary, or supporting fact to find information.'),
  literacySkill('literary_craft', 'Story language, narrators, and genre', 'reading', 'Explain who tells a story and what a writer’s chosen words help you imagine.'),
  literacySkill('writing_purpose', 'Writing for a reader and purpose', 'writing', 'Choose the message that gives a particular reader the information they need.'),
  literacySkill('writing_organization', 'Planning and organizing writing', 'writing', 'Choose an opening, supporting detail, connecting word, or ending that fits the whole text.'),
  literacySkill('writing_revision', 'Revising sentences and details', 'writing', 'Improve a sentence for clarity and meaning, then explain the change.'),
]);

// Spoken teaching is separate from first-response cues. These concise rules
// explain the exact construct while the worked model shows its specific case.
// [cue ID, exact speech, constructs (skill-qualified where meanings differ)]
const TEACHING_CUES = [
  ['title', 'A title names the book. A person’s name tells who made it.', 'title'],
  ['author', 'The author writes the words. Look for the writing credit.', 'author'],
  ['illustrator', 'The illustrator makes the pictures. Look for the picture credit.', 'illustrator'],
  ['word-position', 'Read words from left to right. The first word starts; the last word ends.', 'first_word|last_word|reading_direction'],
  ['word-unit', 'Letters join to make words. Spaces separate words.', 'word_vs_letter|word_spaces'],
  ['letter-position', 'Follow the letters from left to right to find the first or last one.', 'first_letter|last_letter'],
  ['new-line', 'At the end of a line, move to the left of the next line.', 'return_sweep'],
  ['sentences', 'Each sentence tells a whole thought. A full stop or question mark can end it.', 'sentence_boundary|complete_sentence'],
  ['pages', 'Page numbers go forward one at a time.', 'page_navigation'],
  ['letter-name', 'Look at the marked letter while you hear its name.', 'letter_name'],
  ['letter-case', 'Big and small forms of a letter share the same name.', 'letter_case'],
  ['syllables', 'Say the word slowly. Tap once for each beat you hear.', 'oral_syllable_count'],
  ['blend', 'Join the sounds in order. Keep every sound to make the whole word.', 'blend_phonemes'],
  ['word-part', 'Take away the named word part. Say only the part that is left.', 'delete_word_part'],
  ['change-sound', 'Change only the sound named in the question. Keep the other sounds.', 'substitute_initial|substitute_final'],
  ['remove-sound', 'Leave out the named sound. Join the sounds that remain.', 'delete_phoneme'],
  ['add-sound', 'Keep the original sounds. Put the new sound where the question says.', 'add_phoneme'],
  ['sentence-capital', 'Start a sentence with a capital. Keep ordinary words inside it lowercase.', 'sentence_capital'],
  ['name-capital', 'Names of people, places, days and months begin with capitals.', 'proper_name|places|days|month'],
  ['capital-i', 'The word I always uses a capital, even inside a sentence.', 'pronoun_i'],
  ['question-mark', 'A question asks for information. End it with a question mark.', 'question_mark'],
  ['full-stop', 'A calm telling sentence ends with a full stop.', 'full_stop'],
  ['exclamation', 'An exclamation mark shows a strong feeling or an excited call.', 'exclamation_mark'],
  ['list-commas', 'Commas separate the different things in a list.', 'list_comma'],
  ['greeting', 'Put the comma after the whole greeting, including the person’s name.', 'greeting'],
  ['contraction', 'An apostrophe takes the place of missing letters when two words join.', 'contraction'],
  ['possession', 'For one owner, write who owns it, then an apostrophe and the letter s.', 'possession'],
  ['speech-marks', 'Quotation marks go around only the words that someone says.', 'dialogue'],
  ['contents', 'Match the topic on the contents page, then read its page number.', 'contents'],
  ['heading', 'A heading or topic sentence needs to cover all the main facts.', 'heading|topic_sentence'],
  ['glossary', 'A glossary explains words. Choose the meaning that fits this sentence.', 'glossary'],
  ['support', 'Useful details support the topic. Unrelated facts belong somewhere else.', 'supporting_detail|claim_evidence|relevance|relevant_detail'],
  ['purpose', 'Look at what the text does: explain facts, tell a story, or ask for action.', 'purpose'],
  ['speaker', 'Look beside the spoken words. Said or called can name the speaker.', 'speaker'],
  ['narrator', 'I and we include the storyteller. Names and they can describe others.', 'narrator|literary_craft:compare_texts'],
  ['fiction', 'Impossible actions show make-believe. A fact text describes real things.', 'fiction|genre'],
  ['sound-words', 'Sound words help us imagine a noise. Listen to how the word sounds.', 'sound_words|sensory_language'],
  ['feeling', 'Actions and describing words give clues about feelings and mood.', 'word_choice|mood'],
  ['poetry', 'Listen for rhythm and matching word endings. Look at the poem’s short lines.', 'poetry'],
  ['simile', 'The writer compares two things to help us imagine a quality they share.', 'simile'],
  ['personification', 'The writer gives a thing a human action. It is not happening literally.', 'personification'],
  ['invitation', 'An invitation asks someone to join you. It does more than tell news.', 'invitation'],
  ['thanks', 'A thank-you message tells someone you appreciate what they gave or did.', 'thanks'],
  ['request', 'A clear request or direction tells the reader what to do.', 'direction|request'],
  ['description', 'Specific details help the reader identify the right person or thing.', 'description|detail'],
  ['information', 'Give the reader the needed facts. A preference or fantasy is different.', 'information'],
  ['opinion-reason', 'A reason explains why an idea is useful. Just repeating the idea is not enough.', 'opinion_reason|persuasion'],
  ['audience', 'Think about the reader. Include the information they need to act.', 'audience'],
  ['research', 'Choose a factual source about the question’s topic.', 'research'],
  ['opening', 'An opening introduces what the writing will be about.', 'opening'],
  ['ending', 'An ending brings the ideas together or closes the events.', 'ending'],
  ['sequence', 'Think about what must happen first, next and last.', 'sequence'],
  ['connection', 'A joining word must show the right link between the ideas.', 'connecting_word'],
  ['precise', 'Choose the word that names exactly what happens in this situation.', 'precise_word'],
  ['agreement', 'The verb must fit who does the action and whether there is one or more.', 'agreement'],
  ['pronoun', 'A pronoun stands for a noun. Make clear who, what, and how many it means.', 'pronoun|pronoun_reference'],
  ['tense', 'Time words tell when it happened. The verb must match that time.', 'verb_tense'],
  ['same-meaning', 'Keep every original fact and the same order of events when revising.', 'combine_sentences|preserve_meaning'],
  ['compare-facts', 'To choose a shared fact, find evidence for it in each text.', 'informational_features:compare_texts'],
  ['structure', 'Look for steps in order, a comparison, or a problem and its solution.', 'text_structure'],
  ['opinion', 'An opinion tells a judgement or preference. A fact can be checked.', 'fact_opinion'],
];
export const LITERACY_TEACHING_PROMPTS = Object.freeze(Object.fromEntries(TEACHING_CUES.map(([id, speech]) => [id, speech])));
const teachingCueByConstruct = Object.fromEntries(TEACHING_CUES.flatMap(([id, , constructs]) => constructs.split('|').map(construct => [construct, id])));
export function literacyTeachingCueId(item) {
  return teachingCueByConstruct[`${item.skillId}:${item.constructClaim}`] || teachingCueByConstruct[item.constructClaim];
}

// [id, level, evidence unit, prompt, complete printed stimulus, key,
//  distractor 1, distractor 2, construct-linked explanation]
const PRINT = [
  ['book-title',1,'title','What is the title of this book?','A Rainy Walk\nWritten by Mina Fox\nPictures by Leo Sun','A Rainy Walk','Mina Fox','Leo Sun','The title names the book. A Rainy Walk is the title.'],
  ['book-writer',1,'author','Who wrote this book?','Little Boats\nWritten by Tom Reed\nPictures by Eva Hill','Tom Reed','Little Boats','Eva Hill','Written by tells us the writer’s name: Tom Reed.'],
  ['book-artist',1,'illustrator','Who drew the pictures?','A Red Kite\nWritten by Ali Moss\nPictures by Jo Bell','Jo Bell','Ali Moss','A Red Kite','Pictures by tells us who drew the pictures: Jo Bell.'],
  ['first-word',1,'first_word','Which word starts the sentence?','Birds sit in trees.','birds','sit','trees','We read this sentence from left to right. Birds comes first.'],
  ['last-word',1,'last_word','Which word is last in the sentence?','A frog jumps.','jumps','a','frog','Jumps is the last word, just before the full stop.'],
  ['one-word',1,'word_vs_letter','Which choice is one word?','A word has letters joined together.','cat','c','cat runs','Cat is one word. C is one letter, and cat runs has two words.'],
  ['word-spaces',1,'word_spaces','How many words are in this sentence?','We like music.','3','2','4','The spaces separate three words: We, like, and music.'],
  ['first-letter',1,'first_letter','Choose the first letter.','sun','s','u','n','S comes first in sun when we read from left to right.'],
  ['last-letter',1,'last_letter','Choose the last letter.','bus','s','b','u','S comes last in bus.'],
  ['word-order',1,'reading_direction','Which word do you read after dogs?','The dogs run home.','run','the','home','Read from left to right. Run comes immediately after dogs.'],
  ['new-line',2,'return_sweep','Which word starts the second line?','The small bird\nmade a nest.','made','bird','nest','After bird, move to the left of the next line: made.'],
  ['sentence-end',2,'sentence_boundary','Which word ends the first sentence?','Rain fell. We ran home.','fell','home','rain','The first full stop follows fell, so fell ends the first sentence.'],
  ['next-page',2,'page_navigation','Which page comes next?','You have finished page 6.','7','5','8','Page numbers move forward one at a time: page 7 follows page 6.'],
  ['byline',2,'author','Who is the author?','The Hidden Gate\nby Sam Oak\nIllustrated by Kim Lake','Sam Oak','Kim Lake','The Hidden Gate','The byline gives Sam Oak as the author; Kim Lake made the pictures.'],
  ['cover-roles',2,'illustrator','Who is the illustrator?','Night Sounds\nAn information book by Erin West\nIllustrated by Pat Brook','Pat Brook','Erin West','Night Sounds','Illustrated by identifies the person who made the pictures.'],
  ['two-sentences',2,'sentence_boundary','How many sentences are here?','Can we go? Yes, the rain has stopped.','2','3','1','The question mark ends one sentence. The full stop ends the second.'],
  ['letters-words',2,'word_vs_letter','Which choice contains two words?','Count whole words, not the letters inside them.','blue sky','butterfly','we see birds','Blue and sky are two separate words. Butterfly is one word.'],
  ['second-line-direction',2,'return_sweep','Which word comes next after little?','I saw a little\nfish by the rock.','fish','rock','saw','Move back to the left edge of the next line and read fish.'],
];

const INFORMATION = [
  ['contents-bees',1,'contents','Which page tells about bees?','Contents\nAnts — page 2\nBees — page 5\nWorms — page 8','5','2','8','The contents page lists Bees beside page 5.'],
  ['contents-build',1,'contents','Which page explains how to build a kite?','Contents\nThings you need — page 3\nBuilding a kite — page 6\nFlying safely — page 9','6','3','9','Building a kite is the section on page 6.'],
  ['heading-food',1,'heading','Which heading fits these facts?','Rabbits eat grass. They also eat leaves and hay.','What Rabbits Eat','Where Rabbits Sleep','How Rabbits Move','Every fact tells about rabbit food, so What Rabbits Eat fits.'],
  ['heading-shell',1,'heading','Which heading fits these facts?','A turtle has a hard shell. The shell protects it.','A Turtle’s Shell','A Turtle’s Food','A Turtle’s Eggs','Both sentences explain the turtle’s shell.'],
  ['glossary-pup',1,'glossary','What does pup mean in this glossary?','Glossary\npup: a young dog\nfur: an animal’s soft hair\npaw: an animal’s foot','a young dog','an animal’s foot','an animal’s soft hair','The glossary gives a young dog as the meaning of pup.'],
  ['glossary-root',1,'glossary','What does root mean here?','Glossary\nroot: a plant part that takes in water\nstem: a plant part that holds up leaves','a part that takes in water','a part that holds up leaves','a part that makes seeds','The root entry says that roots take in water.'],
  ['fact-support',1,'supporting_detail','Which fact shows that penguins can swim?','Penguins are birds. They use their flippers to move through water. They have feathers.','They use flippers to move through water.','They are birds.','They have feathers.','Moving through water with flippers is evidence of swimming.'],
  ['instructions-purpose',1,'purpose','Why did the writer write these steps?','Put a seed in soil. Add water. Leave the pot near light.','to show how to plant a seed','to tell a funny seed story','to describe a rainy day','The steps tell the reader what to do to plant a seed.'],
  ['contents-select',2,'contents','Where should you look to learn what owls eat?','Contents\nBody and feathers — page 4\nHunting for food — page 7\nEggs and chicks — page 10','Hunting for food, page 7','Body and feathers, page 4','Eggs and chicks, page 10','Hunting for food is the section likely to explain an owl’s food.'],
  ['glossary-context',2,'glossary','Which glossary meaning fits the sentence?','The bat flew out of the cave.\nGlossary\nbat: a flying animal\nbat: a stick used to hit a ball','a flying animal','a stick for hitting a ball','an opening in a cave','Flew and cave show that bat means the animal here.'],
  ['compare-facts',2,'compare_texts','What do both texts tell us?','Text A: Ducks have feathers and lay eggs.\nText B: Hens lay eggs and scratch the ground for food.','Both birds lay eggs.','Both birds scratch the ground.','Both birds swim in ponds.','Both texts state that the birds lay eggs.'],
  ['evidence-reason',2,'claim_evidence','Which fact supports planting trees for shade?','Trees provide shade in hot places. A tree’s leaves block sunlight. Some trees grow fruit.','A tree’s leaves block sunlight.','Some trees grow fruit.','Trees have roots underground.','Blocking sunlight explains how trees make shade.'],
  ['fact-opinion',2,'fact_opinion','Which sentence is an opinion?','Frogs have back legs. Some frogs live near ponds. Frogs are the best pets.','Frogs are the best pets.','Frogs have back legs.','Some frogs live near ponds.','Best pets tells someone’s preference. People can disagree about it.'],
  ['sequence-structure',2,'text_structure','How does the writer organize this text?','First, wash the apple. Next, cut it into pieces. Finally, share the pieces.','as steps in order','as two things being compared','as a problem with no solution','First, next, and finally put the actions in order.'],
  ['compare-structure',2,'text_structure','How are the two animals compared?','A snail has a shell. A slug has no shell. Both move slowly.','by a difference and a similarity','by the order they were born','by a problem and its solution','Shells show a difference; moving slowly shows a similarity.'],
  ['author-persuade',2,'purpose','What does the writer want readers to do?','Please keep our pond clean. Put litter in a bin. Clean water helps the animals that live here.','put litter in a bin','take animals home','swim across the pond','Please and the request to use a bin show the writer’s purpose.'],
];

const LITERARY = [
  ['speaker-dialogue',1,'speaker','Who says the words in quotation marks?','“I found it!” said Mia. Ben ran to see.','Mia','Ben','both children','Said Mia tells us that Mia is speaking.'],
  ['narrator-i',1,'narrator','Who tells this story?','I am Pip the mouse. I live under a tree.','Pip the mouse','the tree','a child named Mia','I am Pip tells us that Pip is telling his own story.'],
  ['story-real',1,'fiction','Which detail makes this a make-believe story?','A bear wore a coat. It bought a ticket and drove a bus.','The bear drove a bus.','The bear had fur.','The bear was big.','A bear driving a bus is make-believe.'],
  ['sound-word',1,'sound_words','Which word helps you hear the bell?','Ding! The bell rang. We went inside.','Ding','inside','we','Ding sounds like a bell, so it helps us imagine the noise.'],
  ['sense-sound',1,'sensory_language','Which words tell about a sound?','Soft rain fell. The roof went tap, tap, tap.','tap, tap, tap','soft rain','the roof','Tap, tap, tap imitates the sound of rain on the roof.'],
  ['feeling-words',1,'word_choice','Which words show that Nia feels happy?','Nia grinned and skipped home. She held a blue bag.','grinned and skipped','a blue bag','she held','Grinning and skipping both help show Nia’s happy mood.'],
  ['story-type',1,'genre','Which choice describes this text?','A fox found a magic key. It opened a door in the moon.','a make-believe story','steps for making a key','facts about real foxes','Magic and a door in the moon make this a make-believe story.'],
  ['poem-lines',1,'poetry','Which two words rhyme in the poem?','A star is bright,\nIt shines at night.','bright and night','star and shines','a and it','Bright and night have the same spoken ending.'],
  ['simile-quick',2,'simile','What does quick as a flash mean?','Nora ran quick as a flash to catch the rolling ball.','Nora ran very fast.','Nora made a bright light.','Nora stopped to rest.','The comparison describes Nora’s speed, not a real flash of light.'],
  ['simile-soft',2,'simile','Why does the writer say soft as a cloud?','Lena touched the scarf. It felt as soft as a cloud.','to describe how the scarf feels','to say the scarf is in the sky','to explain where scarves come from','The comparison helps the reader imagine the scarf’s soft texture.'],
  ['viewpoint-third',2,'narrator','Who tells this story?','Ari opened the box. He smiled when he saw the kitten.','someone outside the story','Ari telling his own story','the kitten telling its own story','The narrator calls Ari he and describes what Ari does.'],
  ['viewpoint-first',2,'narrator','Which clue shows the narrator is a character?','I hid behind the curtain. My brother walked past me.','The narrator says I and my.','The story has a curtain.','The brother walks past.','I and my show that the narrator is telling about their own experience.'],
  ['mood-storm',2,'mood','Which words make the scene feel frightening?','The door creaked. A shadow slid across the silent room.','creaked and shadow','door and room','across and the','Creaked and shadow help create an uneasy mood.'],
  ['personification',2,'personification','What does the wind whispered mean here?','The wind whispered through the leaves. Nobody was speaking.','The wind made a soft sound.','The wind said real words.','A person hid in the tree.','Nobody was speaking; whispered describes the wind’s quiet sound.'],
  ['genre-poem',2,'poetry','Which feature makes this text a poem?','Small feet patter,\nRaindrops scatter.\nOff we go,\nNice and slow.','short lines with rhythm and rhyme','a list of numbered steps','headings above animal facts','The short lines have rhythm and rhyming endings.'],
  ['compare-narrators',2,'compare_texts','How are the narrators different?','Text A: I climbed the hill and waved.\nText B: Kim climbed the hill and waved.','A tells its own action; B tells Kim’s action.','Both narrators call themselves Kim.','Only B describes climbing a hill.','I makes A a character’s own account; B describes Kim from outside.'],
];

const PURPOSE = [
  ['invite',1,'invitation','Choose the sentence that says it best.','You want a friend to come and play.','Would you like to play with me?','I played at home yesterday.','My toy box is very big.','An invitation asks the friend to join you.'],
  ['thank',1,'thanks','Choose the sentence that says it best.','Gran gave you a book. Write to thank her.','Thank you for my lovely book.','Where did you put my book?','I want a different story.','Thank you tells Gran that you appreciate the gift.'],
  ['sign',1,'direction','Choose the sentence that says it best.','You need a sign to keep a gate shut.','Please close the gate.','The gate is made of wood.','I like our green gate.','The sign tells readers what they need to do.'],
  ['lost',1,'description','Choose the sentence that says it best.','Help someone find your lost red hat.','I lost a red hat with a star.','My coat is warm and blue.','I like to wear hats.','The colour and star help someone recognize the missing hat.'],
  ['tell-news',1,'information','Choose the sentence that says it best.','Tell your friend that you have a new puppy.','We have a new puppy at home.','Do you have any pets?','Please feed my cat today.','This sentence shares the news about the new puppy.'],
  ['request',1,'request','Choose the sentence that says it best.','You want your teacher to help open a jar.','Please help me open this jar.','This jar once held jam.','The jar is on the table.','A request politely asks the reader for the help you need.'],
  ['opinion-reason',2,'opinion_reason','Which sentence gives a reason for the opinion?','Our class should grow beans.','Beans grow quickly, so we can watch changes.','Our class should grow beans every year.','The plant pot is next to the window.','Growing quickly explains why beans would be useful for the class.'],
  ['audience-directions',2,'audience','Choose the sentence that says it best.','A visitor needs to find the library from your classroom.','Turn left at our door; the library is opposite.','The library is my favourite room in school.','We went to the library on Tuesday.','The visitor needs a route, so the directions fit the audience.'],
  ['inform-versus-opinion',2,'information','Which sentence belongs in a fact book about bees?','The writer wants to teach facts about bees.','Bees collect nectar from flowers.','Bees are the most wonderful insects.','A bee wore a tiny crown.','Collecting nectar is a fact; the other choices are opinion and fantasy.'],
  ['persuade-reason',2,'persuasion','Choose the sentence that says it best.','Ask families to walk to school when they can.','Walking can reduce the number of cars near our school.','Some cars near our school have blue doors.','Our school has a gate and a long fence.','Fewer cars is a relevant reason for the requested action.'],
  ['invitation-details',2,'audience','Which sentence gives the missing information?','Come to my party on Saturday. The invitation needs a place.','Meet us at the park by the pond.','We will have a wonderful time together.','Saturday is my favourite day of the week.','The park by the pond tells guests where to go.'],
  ['research-source',2,'research','Which source would help answer the question?','How do caterpillars become butterflies?','a book about insect life cycles','a book showing how insects find food','a story about a talking caterpillar','An insect life-cycle book explains the change from caterpillar to butterfly.'],
];

const ORGANIZATION = [
  ['opening-pet',1,'opening','Which sentence is the best beginning?','The next sentences tell about your pet fish.','My pet fish is called Dot.','My pet dog is called Dot.','My trip to the lake was fun.','Naming the pet introduces what the writing will be about.'],
  ['ending-home',1,'ending','Which sentence is the best ending?','We packed our bags. We rode home from the beach.','Our day at the beach was over.','First we must pack our bags.','Tomorrow is a different day.','This ending closes the account of the beach trip.'],
  ['steps-wash',1,'sequence','What should come first?','Then dry your hands on a towel.','Wash your hands with soap and water.','Put the dry towel away.','Eat your lunch with dirty hands.','Hands must be washed before they are dried.'],
  ['on-topic',1,'supporting_detail','Which sentence belongs with these facts?','These facts tell about cats’ bodies. Cats have whiskers. Cats have paws.','Cats have soft fur.','Cats eat food from a bowl.','Cats like warm places to sleep.','Whiskers, paws, and fur are body parts. The other facts describe eating and sleeping.'],
  ['next-step',1,'sequence','Which step comes next?','Put bread on a plate. Spread jam on the bread.','Put another slice of bread on top.','Wash the plate before using it.','Take an empty jar to the shop.','Adding the top slice follows spreading jam when making a sandwich.'],
  ['simple-link',1,'connecting_word','Choose the best word.','I packed a cup ___ a plate.','and','but','because','And joins two things that were packed.'],
  ['topic-sentence',2,'topic_sentence','Which sentence introduces all these facts?','Bees carry pollen between flowers. Butterflies can carry pollen too. Some birds also move pollen.','Several animals help move pollen between flowers.','Bees carry pollen as they visit flowers.','Flowers give food to several animals.','The topic sentence covers bees, butterflies, and birds moving pollen.'],
  ['transition-cause',2,'connecting_word','Choose the best word.','The path was flooded, ___ we took another route.','so','but','before','So connects the flooded path to its result: a different route.'],
  ['support-topic',2,'supporting_detail','Which detail best supports the topic sentence?','Our playground is a good place to watch birds.','Sparrows gather at the feeder beside the fence.','The swings have shiny metal chains.','We line up when the bell rings.','Birds gathering at a feeder supports the topic of bird watching.'],
  ['ending-opinion',2,'ending','Which ending fits this opinion paragraph?','We should have a class plant. We can learn how it grows. Taking turns watering it will help us share jobs.','A class plant would help us learn and work together.','Many people keep plants in different rooms.','First, open a bag of soil.','The ending brings together the paragraph’s two reasons.'],
  ['order-whole',2,'sequence','Which sentence should come before the last one?','We mixed the batter. ___. Then we ate the warm cakes.','We cooked small spoonfuls in a pan.','We washed the dishes after eating.','We bought a pan the next day.','The batter must be cooked before the cakes can be eaten.'],
  ['remove-detail',2,'relevance','Which sentence belongs in a different paragraph?','Our pond is full of life. Tadpoles swim near the weeds. My new shoes are too tight. Dragonflies rest on the reeds.','My new shoes are too tight.','Tadpoles swim near the weeds.','Dragonflies rest on the reeds.','The shoes are unrelated to the paragraph’s topic: pond life.'],
];

const REVISION = [
  ['precise-verb',1,'precise_word','Choose the best word.','The baby was asleep, so I ___ past the door.','tiptoed','stomped','shouted','Tiptoed means moving quietly, which fits the sleeping baby.'],
  ['clear-colour',1,'detail','Which sentence helps us find the right cup?','Your cup is the blue one with a white star.','Please pass the blue cup with a white star.','Please pass that thing over there.','Please pass something from the table.','The colour and star make the request clear.'],
  ['complete-thought',1,'complete_sentence','Which choice is a complete sentence?','Choose words that tell a whole thought.','The puppy sleeps.','Under the chair.','The small puppy.','The puppy sleeps tells who and what happens.'],
  ['verb-match',1,'agreement','Choose the best word.','One bird ___ on the fence.','sits','sit','sitting','One bird takes sits in this complete sentence.'],
  ['pronoun',1,'pronoun','Choose the best word.','The boys have a ball. ___ play outside.','They','He','It','They refers to the boys, who are more than one person.'],
  ['time-word',1,'verb_tense','Choose the best word.','Yesterday we ___ in the pond.','swam','swim','swimming','Yesterday tells us to use the past-tense word swam.'],
  ['combine-repetition',2,'combine_sentences','Which sentence keeps the same meaning?','The kite is red. The kite has a long tail.','The red kite has a long tail.','The long kite has a red tail.','The red tail has a kite.','The revision keeps both facts without repeating the kite.'],
  ['clear-reference',2,'pronoun_reference','Which revision makes the meaning clear?','Maya gave Zoe a scarf. She wore it home. Zoe wore it.','Maya gave Zoe a scarf. Zoe wore it home.','Maya gave Zoe a scarf. She did it.','Maya gave Zoe a scarf. Maya wore it home.','Using Zoe’s name makes clear who wore the scarf.'],
  ['expand-relevant',2,'relevant_detail','Which detail would improve this sentence?','The bag broke. Tell the reader why.','The heavy books tore its thin paper sides.','The bag was carried on a Tuesday.','The person holding it had a blue hat.','The heavy books and thin paper explain why the bag broke.'],
  ['revise-agreement',2,'agreement','Which sentence uses the correct verb?','Describe two ducks moving across the pond now.','The ducks are swimming across the pond.','The ducks is swimming across the pond.','The ducks was swimming across the pond.','Plural ducks agrees with are for what is happening now.'],
  ['keep-sequence',2,'preserve_meaning','Which sentence keeps the same meaning?','Before we ate, we washed our hands.','We washed our hands and then ate.','We ate and then washed our hands.','We washed our hands while we ate.','Before means the hand washing came first.'],
  ['stronger-word',2,'precise_word','Which word makes the action more precise?','The rabbit moved into its hole with one quick jump.','leaped','rested','wandered','Leaped names the quick jumping action described in the sentence.'],
];

const PUNCTUATION_EXTENSION = [
  ['list-comma',2,'list_comma','Which sentence uses commas correctly?','Name three things you packed.','I packed socks, boots, and a hat.','I packed, socks boots and a hat.','I, packed socks boots and a hat.','Commas separate the three things in the list.'],
  ['greeting-comma',2,'greeting','Which greeting is written correctly?','Start a friendly letter to Gran.','Dear Gran,','Dear, Gran','Dear Gran?','A comma follows the greeting in a friendly letter.'],
  ['contraction-not',2,'contraction','Which word correctly joins do and not?','I do not want to be late.','don’t','do’nt','dont','The apostrophe in don’t takes the place of the missing o.'],
  ['contraction-is',2,'contraction','Which word correctly joins it and is?','It is time to go home.','it’s','its','its’','It’s means it is; the apostrophe marks the missing letter.'],
  ['possessive',2,'possession','Which phrase shows that the bag belongs to one girl?','One girl owns the bag.','the girl’s bag','the girls bag','the girls’ bag','Girl’s uses an apostrophe before s for one girl’s bag.'],
  ['speech-marks',2,'dialogue','Which sentence puts quotation marks around the spoken words?','Ben says that he can help.','Ben said, “I can help.”','“Ben said, I can help.”','Ben “said, I can” help.','Only I can help is spoken, so only those words go inside quotation marks.'],
  ['sentence-break',2,'sentence_boundary','Which choice separates the two complete sentences?','The rain stopped we went out','The rain stopped. We went out.','The rain. Stopped we went out.','The rain stopped we. Went out.','The rain stopped and We went out each tell a complete thought.'],
  ['question-order',2,'question_mark','Which sentence is punctuated as a question?','Ask where the bus stops.','Where does the bus stop?','Where does the bus stop.','Where does the bus stop!','A question that asks for information ends with a question mark.'],
];

// Full oral tasks are deliberately not printed during the first response.
// The operation, rather than visible spelling, determines the answer.
const SOUND = [
  ['blend-map',1,'blend_phonemes','Listen to these sounds: /m/ /a/ /p/. Which word do they make?','map','mat','cap','Blend all three sounds in order: /m/ /a/ /p/ makes map.'],
  ['blend-sun',1,'blend_phonemes','Listen to these sounds: /s/ /u/ /n/. Which word do they make?','sun','sock','run','Joining /s/ /u/ /n/ makes sun.'],
  ['blend-fish',1,'blend_phonemes','Listen to these sounds: /f/ /i/ /sh/. Which word do they make?','fish','fin','dish','The last sound is /sh/, so these sounds make fish.'],
  ['blend-cup',1,'blend_phonemes','Listen to these sounds: /k/ /u/ /p/. Which word do they make?','cup','cub','cut','Keep the final /p/: the whole word is cup.'],
  ['compound-cupcake',1,'delete_word_part','Listen. Cupcake. Take away cake. Tap what is left.','cup','cake','cap','Taking cake away from cupcake leaves cup.'],
  ['compound-football',1,'delete_word_part','Listen. Football. Take away foot. Tap what is left.','ball','foot','fall','Taking foot away from football leaves ball.'],
  ['compound-snowman',1,'delete_word_part','Listen. Snowman. Take away man. Tap what is left.','snow','man','sun','Removing man from snowman leaves snow.'],
  ['compound-toothbrush',1,'delete_word_part','Listen. Toothbrush. Take away tooth. Tap what is left.','brush','tooth','bus','Removing tooth from toothbrush leaves brush.'],
  ['change-initial-cat',2,'substitute_initial','Say cat. Change its first sound to the first sound in house. What is the new word?','hat','cat','cap','The ending stays /a/ /t/. Replacing /k/ with /h/ makes hat.'],
  ['change-initial-pan',2,'substitute_initial','Say pan. Change its first sound to the first sound in fish. What is the new word?','fan','pan','pin','Replace only the first sound: pan becomes fan.'],
  ['change-final-map',2,'substitute_final','Say map. Change its last sound to the last sound in boat. What is the new word?','mat','map','tap','The first two sounds stay the same; the new final /t/ makes mat.'],
  ['change-final-bag',2,'substitute_final','Say bag. Change its last sound to the last sound in hat. What is the new word?','bat','bag','bug','Changing the final sound of bag to /t/ makes bat.'],
  ['delete-s-swing',2,'delete_phoneme','Say swing. Take away its first sound. What word is left?','wing','sing','ring','Swing begins with /s/ then /w/. Removing /s/ leaves wing.'],
  ['delete-s-snow',2,'delete_phoneme','Say snow. Take away its first sound. What word is left?','no','so','sun','Removing /s/ leaves the spoken word no.'],
  ['add-s-top',2,'add_phoneme','Say top. Add the first sound in sun at the beginning. What word do you make?','stop','top','spot','Put /s/ before top without changing the other sounds: stop.'],
  ['add-s-pin',2,'add_phoneme','Say pin. Add the first sound in sock at the beginning. What word do you make?','spin','pin','sip','Adding /s/ before pin makes spin.'],
];

// Additional oral evidence uses already reviewed phonemes, word recordings and
// complete instructions. The printed spellings remain hidden during response.
const ORAL_TRANSFER = [
  ['blend-bat', ['b','a','t'], 'bat', 'bad', 'hat', 'Joining /b/ /a/ /t/ makes bat.', 'Changes the final sound to /d/.', 'Changes the first sound to /h/.'],
  ['blend-bed', ['b','e','d'], 'bed', 'bet', 'red', 'Joining /b/ /e/ /d/ makes bed.', 'Changes the final sound to /t/.', 'Changes the first sound to /r/.'],
  ['blend-hen', ['h','e','n'], 'hen', 'ten', 'pen', 'Joining /h/ /e/ /n/ makes hen.', 'Substitutes /t/ for the first sound.', 'Substitutes /p/ for the first sound.'],
  ['blend-leg', ['l','e','g'], 'leg', 'led', 'peg', 'Joining /l/ /e/ /g/ makes leg.', 'Changes the final sound to /d/.', 'Changes the first sound to /p/.'],
  ['blend-pan', ['p','a','n'], 'pan', 'pat', 'fan', 'Joining /p/ /a/ /n/ makes pan.', 'Changes the final sound to /t/.', 'Changes the first sound to /f/.'],
  ['blend-run', ['r','u','n'], 'run', 'rug', 'sun', 'Joining /r/ /u/ /n/ makes run.', 'Changes the final sound to /g/.', 'Changes the first sound to /s/.'],
  ['blend-ship', ['sh','i','p'], 'ship', 'shin', 'chip', 'Joining /sh/ /i/ /p/ makes ship.', 'Changes the final sound to /n/.', 'Changes the first sound to /ch/.'],
  ['blend-duck', ['d','u','k'], 'duck', 'dug', 'dock', 'Joining /d/ /u/ /k/ makes duck.', 'Changes the final sound to /g/.', 'Changes the middle vowel to /o/.'],
];
const COMPOUND_TRANSFER = [
  ['cupcake','cup','cake','cap'], ['football','ball','foot','fall'],
  ['mailbox','box','mail','bell'], ['mailbox','mail','box','bell'],
  ['rainbow','bow','rain','row'], ['rainbow','rain','bow','row'],
  ['snowman','snow','man','sun'], ['sunflower','flower','sun','snow'],
  ['sunflower','sun','flower','fly'], ['toothbrush','brush','tooth','bus'],
];

/** A semantic presentation of the exact printed source, never decorative art. */
export function literacyTextFeature(item) {
  const lines = String(item.passage || '').split('\n');
  if (item.constructClaim === 'contents' && lines[0] === 'Contents') return {
    kind: 'contents', title: lines[0], entries: lines.slice(1).map(line => {
      const match = /^(.*?) — page (\d+)$/.exec(line);
      if (!match) throw new Error(`Incomplete contents entry: ${item.id}`);
      return { label: match[1], page: Number(match[2]) };
    }),
  };
  const glossaryIndex = lines.indexOf('Glossary');
  if (item.constructClaim === 'glossary' && glossaryIndex >= 0) return {
    kind: 'glossary', title: 'Glossary', ...(glossaryIndex ? { context: lines.slice(0, glossaryIndex).join('\n') } : {}),
    entries: lines.slice(glossaryIndex + 1).map(line => {
      const divider = line.indexOf(': ');
      if (divider < 1) throw new Error(`Incomplete glossary entry: ${item.id}`);
      return { term: line.slice(0, divider), definition: line.slice(divider + 2) };
    }),
  };
  if (['title','author','illustrator'].includes(item.constructClaim) && lines.length > 1) {
    const credits = [], subtitles = [];
    for (const line of lines.slice(1)) {
      const match = /^(Written by|Pictures by|Illustrated by|An information book by|A story by|Words:|Art:|by) (.+)$/.exec(line);
      if (match) credits.push({ label: match[1], name: match[2] }); else subtitles.push(line);
    }
    return { kind: 'book_cover', title: lines[0], ...(subtitles.length ? { subtitle: subtitles.join('\n') } : {}), credits };
  }
  return null;
}

// Each pair explains the actual wrong alternatives in the authored row above.
// These remain attached to the answer value when the runtime shuffles choices.
const MISCONCEPTIONS = {
  'book-title':['Confuses the author name with the title.','Confuses the illustrator name with the title.'],
  'book-writer':['Chooses the title instead of the writer.','Confuses illustrator and author.'],
  'book-artist':['Confuses writer and illustrator.','Chooses the title instead of the artist.'],
  'first-word':['Selects an internal word instead of the first.','Confuses the last word with the first.'],
  'last-word':['Confuses the first word with the last.','Selects an internal word instead of the last.'],
  'one-word':['Confuses one letter with one word.','Treats a two-word phrase as one word.'],
  'word-spaces':['Undercounts the three space-separated words.','Overcounts the three words.'],
  'first-letter':['Selects the middle letter.','Confuses the last letter with the first.'],
  'last-letter':['Confuses the first letter with the last.','Selects the middle letter.'],
  'word-order':['Moves backwards rather than forwards from dogs.','Skips the immediate next word.'],
  'new-line':['Stays on the previous line.','Starts at the right end of the next line.'],
  'sentence-end':['Chooses the end of the second sentence.','Confuses the beginning and end of the first sentence.'],
  'next-page':['Moves backwards one page.','Skips a page.'],
  byline:['Confuses the illustrator credit with the author byline.','Chooses the title instead of the author.'],
  'cover-roles':['Confuses author and illustrator.','Chooses the title instead of the illustrator.'],
  'two-sentences':['Treats the comma as another sentence boundary.','Overlooks the boundary at the question mark.'],
  'letters-words':['Treats a compound word as two printed words.','Selects three words instead of two.'],
  'second-line-direction':['Moves to the end rather than the start of the new line.','Returns to an earlier word on the first line.'],
  'contents-bees':['Uses the page for a neighbouring topic, Ants.','Uses the page for a neighbouring topic, Worms.'],
  'contents-build':['Chooses preparation materials rather than building instructions.','Chooses later flying guidance rather than building instructions.'],
  'heading-food':['Chooses a related animal topic unsupported by this paragraph.','Chooses movement rather than the common food topic.'],
  'heading-shell':['Chooses food although both facts concern the shell.','Chooses eggs although neither fact discusses eggs.'],
  'glossary-pup':['Uses the definition from the paw entry.','Uses the definition from the fur entry.'],
  'glossary-root':['Uses the definition from the stem entry.','Substitutes background knowledge for the supplied definition.'],
  'fact-support':['Selects a classification fact that does not show swimming.','Selects a body-covering fact that does not show swimming.'],
  'instructions-purpose':['Confuses instructions with an entertaining story.','Confuses the seed instructions with a weather description.'],
  'contents-select':['Chooses physical appearance instead of food.','Chooses reproduction instead of food.'],
  'glossary-context':['Chooses a listed but contextually incompatible meaning.','Mistakes a context location for the word’s meaning.'],
  'compare-facts':['Attributes a fact from one text to both.','Adds a familiar animal fact absent from both texts.'],
  'evidence-reason':['Selects a true but irrelevant benefit of trees.','Selects background information without connecting it to shade.'],
  'fact-opinion':['Mistakes a verifiable physical fact for a preference.','Mistakes a verifiable habitat fact for a preference.'],
  'sequence-structure':['Mistakes a sequence for comparison.','Mistakes instructions for an unresolved problem.'],
  'compare-structure':['Mistakes a comparison for chronological order.','Mistakes a comparison for problem and solution.'],
  'author-persuade':['Adds an action not requested by the writer.','Confuses the pond setting with the writer’s requested action.'],
  'speaker-dialogue':['Attributes the quoted words to the next named character.','Assumes that every named character says the quoted words.'],
  'narrator-i':['Confuses the narrator with the setting.','Invents a narrator absent from the text.'],
  'story-real':['Chooses a realistic physical trait instead of a fantasy action.','Chooses a realistic size detail instead of a fantasy action.'],
  'sound-word':['Chooses a location word instead of a sound imitation.','Chooses a pronoun instead of a sound imitation.'],
  'sense-sound':['Chooses a weather description instead of the sound words.','Chooses the source object instead of the sound description.'],
  'feeling-words':['Treats colour as evidence of a character’s emotion.','Selects a neutral action instead of the two emotional clues.'],
  'story-type':['Confuses narrative events with instructions.','Treats a fantasy event as a fact about real animals.'],
  'poem-lines':['Chooses words by shared initial letters rather than ending sounds.','Chooses short function words rather than a rhyming pair.'],
  'simile-quick':['Interprets figurative comparison as literal light production.','Reverses the action by choosing stopping rather than running.'],
  'simile-soft':['Interprets the cloud comparison as literal location.','Confuses a description with an explanation of origin.'],
  'viewpoint-third':['Treats a named character as a first-person narrator despite he.','Invents the kitten as narrator without first-person evidence.'],
  'viewpoint-first':['Uses a setting object rather than a point-of-view clue.','Uses another character’s action rather than narrator language.'],
  'mood-storm':['Chooses neutral setting nouns instead of mood-making words.','Chooses function words instead of descriptive clues.'],
  personification:['Interprets human-like description as literal speech.','Invents a person despite the explicit absence of speech.'],
  'genre-poem':['Confuses verse with procedural writing.','Confuses verse with informational features.'],
  'compare-narrators':['Applies Text B’s character name to both narrators.','Overlooks the same hill-climbing action in Text A.'],
  invite:['Reports a past event instead of inviting the reader.','Describes a toy box instead of asking the reader to join.'],
  thank:['Asks about the gift’s location instead of showing thanks.','Requests a different gift instead of showing appreciation.'],
  sign:['Describes gate material instead of giving the needed direction.','States a preference instead of the needed action.'],
  lost:['Describes the wrong object.','States a general preference rather than identifying the lost hat.'],
  'tell-news':['Asks about the reader instead of sharing the new puppy news.','Requests pet care instead of reporting the new puppy.'],
  request:['Gives the jar’s history instead of asking for help.','Gives its location without requesting the needed help.'],
  'opinion-reason':['Repeats the opinion without giving a reason.','Supplies an unrelated location fact.'],
  'audience-directions':['Gives a personal preference instead of a route.','Gives a past visit date instead of directions.'],
  'inform-versus-opinion':['Offers a preference instead of a factual statement.','Offers fantasy instead of factual information.'],
  'persuade-reason':['Chooses an incidental colour fact rather than a benefit of walking.','Chooses an unrelated school description rather than a reason.'],
  'invitation-details':['Adds enthusiasm but still omits the place.','Repeats the day without giving the place.'],
  'research-source':['Chooses a factual insect topic that does not explain how the insect changes.','Chooses fiction instead of a factual life-cycle explanation.'],
  'opening-pet':['Uses an opening about a different pet.','Uses a plausible opening about a different topic.'],
  'ending-home':['Returns to preparation after the completed trip.','Gives an unrelated future fact rather than closing the trip.'],
  'steps-wash':['Puts away the towel before the washing step.','Chooses an action that does not prepare for drying clean hands.'],
  'on-topic':['Keeps the animal topic but switches from body parts to eating.','Keeps the animal topic but switches from body parts to sleeping.'],
  'next-step':['Moves backwards to preparation instead of the next sandwich step.','Chooses an unrelated errand instead of the next making step.'],
  'simple-link':['Uses contrast where the list needs addition.','Uses a reason connector where two objects are being joined.'],
  'topic-sentence':['Covers only the bee detail instead of all three animal groups.','Reverses the focus from animals moving pollen to flowers feeding animals.'],
  'transition-cause':['Signals contrast where the text gives a consequence.','Uses a time relation that breaks the cause-result meaning.'],
  'support-topic':['Adds a true playground detail unrelated to birds.','Adds a routine unrelated to the bird-watching claim.'],
  'ending-opinion':['Adds a broad plant fact instead of bringing together the reasons.','Changes from an opinion to the first step of instructions.'],
  'order-whole':['Places cleanup before eating.','Adds a later shopping event instead of the needed cooking step.'],
  'remove-detail':['Removes a detail that directly supports pond life.','Removes another relevant pond-life detail.'],
  'precise-verb':['Chooses a noisy movement that conflicts with the sleeping baby.','Chooses a loud vocal action rather than quiet movement.'],
  'clear-colour':['Uses a vague reference without identifying the cup.','Requests any object rather than specifying the cup.'],
  'complete-thought':['Chooses a location phrase without a subject and main verb.','Chooses a noun phrase without a main verb.'],
  'verb-match':['Uses a plural/base verb with the singular subject.','Uses an ing form without the required helping verb.'],
  pronoun:['Uses a singular pronoun for the plural boys.','Uses an object pronoun reference inappropriate for the boys.'],
  'time-word':['Uses present tense despite yesterday.','Uses an ing form without an auxiliary rather than a past-tense verb.'],
  'combine-repetition':['Moves the colour and length onto the wrong parts.','Reverses which object has the other.'],
  'clear-reference':['Keeps an unclear pronoun and loses the concrete action.','Names the wrong person as the scarf wearer.'],
  'expand-relevant':['Adds timing that does not explain the bag breaking.','Adds an irrelevant appearance detail about the carrier.'],
  'revise-agreement':['Uses a singular present auxiliary with plural ducks.','Uses a singular past auxiliary for plural ducks moving now.'],
  'keep-sequence':['Reverses the event order.','Changes before into simultaneous actions.'],
  'stronger-word':['Replaces movement with rest.','Replaces one quick jump with unhurried movement.'],
  'list-comma':['Puts a comma between the verb and its first object.','Puts a comma between the subject and verb.'],
  'greeting-comma':['Separates Dear from the addressee rather than ending the greeting.','Treats a greeting as a question.'],
  'contraction-not':['Places the apostrophe away from the omitted letter.','Omits the contraction apostrophe.'],
  'contraction-is':['Confuses the possessive its with it is.','Misplaces the apostrophe after s.'],
  possessive:['Omits the apostrophe marking ownership.','Uses the plural possessive despite one girl.'],
  'speech-marks':['Includes the narrator’s attribution inside the quotation.','Includes attribution and excludes some actual spoken words.'],
  'sentence-break':['Splits the subject from the first sentence’s verb.','Moves the second sentence’s subject into the first sentence.'],
  'question-order':['Uses a telling-sentence mark for an information question.','Uses an exclamation mark for an information question.'],
  'pronoun-i':['Capitalizes a common noun inside the sentence.','Capitalizes a common noun at the end of the sentence.'],
  month:['Capitalizes a common noun instead of the month name.','Capitalizes a preposition instead of the month name.'],
  'place-name':['Capitalizes the verb instead of the place name.','Capitalizes a common time noun instead of the place name.'],
  'sentence-edit':['Leaves the proper name and sentence beginning lowercase.','Unnecessarily capitalizes the common noun dog.'],
  'blend-map':['Changes the final phoneme from /p/ to /t/.','Changes the initial phoneme from /m/ to /k/.'],
  'blend-sun':['Matches the first phoneme but replaces the rest.','Replaces the first phoneme while keeping the rime.'],
  'blend-fish':['Substitutes final /n/ for /sh/.','Substitutes initial /d/ for /f/.'],
  'blend-cup':['Substitutes the voiced final /b/ for /p/.','Substitutes final /t/ for /p/.'],
  'compound-cupcake':['Returns the removed part rather than the remainder.','Changes the vowel in the remaining part.'],
  'compound-football':['Returns the removed part rather than the remainder.','Carries the original first consonant into the remaining word.'],
  'compound-snowman':['Returns the removed part rather than the remainder.','Changes the sounds of the remaining snow.'],
  'compound-toothbrush':['Returns the removed part rather than the remainder.','Deletes sounds inside brush as well as the requested part.'],
  'change-initial-cat':['Leaves the original word unchanged.','Changes the final sound instead of the initial sound.'],
  'change-initial-pan':['Leaves the original word unchanged.','Changes the medial vowel rather than the initial sound.'],
  'change-final-map':['Leaves the original word unchanged.','Changes the initial sound instead of the final sound.'],
  'change-final-bag':['Leaves the original word unchanged.','Changes the medial vowel instead of the final sound.'],
  'delete-s-swing':['Deletes the second consonant rather than the first.','Replaces the cluster with a new consonant instead of deleting only /s/.'],
  'delete-s-snow':['Deletes /n/ instead of the first sound /s/.','Changes the remaining vowel as well as the initial cluster.'],
  'add-s-top':['Leaves the original word unchanged.','Reorders the original sounds while adding /s/.'],
  'add-s-pin':['Leaves the original word unchanged.','Loses the final /n/ and reorders the sounds.'],
};

// Fresh evidence for microconstructs that otherwise had only one first probe.
// Each row changes the actual evidence and answer contrast; these are not
// renamed copies of an identical sentence. The original spoken task is reused.
const TRANSFER_PARTNERS = [
  ['book-title','cover-title','Birds at Home\nA book about nests\nby Omar Page','Birds at Home','A book about nests','Omar Page','Birds at Home names the book; the next line describes its topic.','Confuses the descriptive subtitle with the main title.','Confuses the author with the title.'],
  ['book-writer','cover-writer','The Lost Sock\nWords: Ruth Cole\nArt: Max Pine','Ruth Cole','Max Pine','The Lost Sock','Words credits Ruth Cole with writing; Art credits Max Pine with pictures.','Confuses the picture credit with the writing credit.','Chooses the book name rather than its writer.'],
  ['book-artist','cover-pictures','Cloud Shapes\nA story by June Ray\nIllustrated by Wes Ford','Wes Ford','June Ray','Cloud Shapes','Illustrated by tells us that Wes Ford drew the pictures.','Confuses the story writer with the picture maker.','Chooses the title instead of a person.'],
  ['first-word','first-command','Please put your boots here.','please','put','here','Please is the first printed word, even though put names the action.','Chooses the action verb rather than the first word.','Confuses the last word with the first.'],
  ['last-word','last-question','Where is my coat?','coat','where','my','Coat is the last word before the question mark.','Chooses the opening question word.','Stops one word before the end.'],
  ['one-word','joined-word','Look for one whole printed word.','sunflower','sun flower','s u n','Sunflower is one printed word. Spaces separate the other choices.','Splits a compound into two printed words.','Mistakes spaced individual letters for a word.'],
  ['word-spaces','count-question','Can I help you?','4','3','5','There are four words: Can, I, help, and you.','Misses a short word when counting.','Counts punctuation as another word.'],
  ['first-letter','first-cluster','frog','f','r','g','F is first; r is the next letter in the starting blend.','Chooses the second letter of the starting blend.','Chooses the final letter.'],
  ['last-letter','last-digraph','fish','h','s','f','The last letter is h. The last sound uses both s and h.','Chooses the first letter of the final digraph.','Chooses the first letter of the word.'],
  ['word-order','next-word-play','Cats and dogs play in the yard.','play','cats','and','Play comes immediately after dogs when reading from left to right.','Returns to the beginning of the sentence.','Moves backwards within the sentence.'],
  ['next-page','facing-pages','The left page is page 8. The right page comes next.','9','7','10','The right page follows page 8, so it is page 9.','Moves backwards rather than to the facing next page.','Skips the facing page.'],
  ['fact-support','penguin-observation','Penguins stood on the rocks. One dived and moved underwater. Its feathers looked wet.','One dived and moved underwater.','Penguins stood on the rocks.','Its feathers looked wet.','Moving underwater directly shows swimming; being wet alone does not.','Uses a land action rather than swimming evidence.','Treats wet feathers alone as proof of swimming.'],
  ['instructions-purpose','instruction-fold','Fold the paper in half. Open it. Cut along the fold.','to explain how to cut paper in half','to describe the colour of paper','to tell a story about a paper bird','These are actions in order for cutting paper into two parts.','Chooses description rather than the task performed.','Adds a narrative purpose absent from the steps.'],
  ['compare-facts','two-plant-texts','Text A: Bean plants need light and water.\nText B: Sunflowers need water and have tall stems.','Both plants need water.','Both plants have tall stems.','Both plants make beans.','Water is the need stated in both texts.','Attributes a fact from only one text to both.','Transfers one plant’s name to the other plant.'],
  ['evidence-reason','shade-observation','The bench under the tree stayed cool at noon. A sunny bench nearby felt hot. Birds sat in the tree.','The shaded bench stayed cooler than the sunny bench.','Birds sat in the tree.','There were two benches in the park.','The two benches show how tree shade helps in the heat.','Selects a tree fact unrelated to shade or cooling.','Selects a count without the relevant temperature difference.'],
  ['fact-opinion','opinion-beach','The beach has sand. Crabs live there. Everyone should visit this lovely beach.','Everyone should visit this lovely beach.','The beach has sand.','Crabs live there.','Should and lovely express a judgement about visiting the beach.','Mistakes a verifiable material fact for a judgement.','Mistakes a verifiable animal fact for a preference.'],
  ['speaker-dialogue','speaker-before','Dad called, “Come inside!” Liv closed her book.','Dad','Liv','the book','Dad called introduces the person saying Come inside.','Attributes the speech to the listener.','Mistakes an object for the speaker.'],
  ['narrator-i','narrator-diary','My name is Ella. Yesterday I planted a bean.','Ella','the bean','Ella’s teacher','Ella introduces herself and tells what she did.','Confuses the story object with the narrator.','Invents an adult narrator absent from the text.'],
  ['story-real','fiction-plant','A rose pulled up its roots. It danced down the road.','The rose danced down the road.','The rose had roots.','The road was long.','A rose cannot walk or dance in real life.','Chooses a realistic plant feature.','Chooses a realistic setting detail.'],
  ['sound-word','bell-clang','The big bell went CLANG! Birds flew from the roof.','CLANG','birds','roof','Clang imitates the sound of the bell.','Chooses the animals that reacted to the sound.','Chooses the location rather than the sound word.'],
  ['sense-sound','sound-floor','The boards were brown. They creaked under my feet.','creaked','brown','my feet','Creaked describes the noise the boards made.','Chooses a colour rather than a sound.','Chooses the cause of the noise rather than its description.'],
  ['feeling-words','happy-success','Nia cheered and hugged her friend. Their kite flew high.','cheered and hugged','flew high','their kite','Cheering and hugging both show Nia’s joy.','Chooses the kite’s movement rather than Nia’s emotional actions.','Chooses an object rather than emotional evidence.'],
  ['story-type','fantasy-whale','A whale put on skates. It raced a cloud.','a fantasy story','a set of skating rules','a report about whale food','Skating whales and racing clouds belong to fantasy.','Confuses narrated fantasy with rules.','Confuses fantasy with informational reporting.'],
  ['poem-lines','rhyme-sea','A small fish swam in the sea,\nThen waved its tail at me.','sea and me','fish and swam','tail and small','Sea and me rhyme because their spoken endings match.','Chooses adjacent words with different endings.','Chooses words by a shared final letter rather than matching sounds.'],
  ['mood-storm','mood-cave','A howl echoed through the cave. A low growl came closer.','howl and growl','cave and through','came and a','The threatening animal sounds make this scene frightening.','Chooses neutral location words.','Chooses neutral function/action words.'],
  ['personification','wind-reeds','The wind whispered through the dry reeds. No person was there.','The reeds made a quiet rustling sound.','The wind told a secret in words.','A person called from the reeds.','Whispered compares the quiet wind sound to a human whisper.','Takes the human-like description literally.','Invents a person despite the explicit information.'],
  ['compare-narrators','viewpoint-boat','Text A: We pushed our boat into the water.\nText B: The children pushed their boat into the water.','A includes the storyteller; B describes the children.','Both storytellers say they are in the boat.','Only A describes a boat going into water.','We includes the narrator; the children describes them from outside.','Overlooks the outside narrator in B.','Misses the action shared by both passages.'],
  ['invite','invite-performance','Invite your family to watch your class sing.','Please come to hear our class sing on Friday.','Our class practised singing this morning.','I like listening to songs at home.','Please come invites the family to attend the performance.','Reports practice instead of inviting attendance.','Gives a preference instead of an invitation.'],
  ['thank','thanks-help','A neighbour helped find your dog. Thank them in a note.','Thank you for helping me find my dog.','Have you seen my dog today?','My dog has a soft brown coat.','The note thanks the neighbour for the help they gave.','Requests help instead of acknowledging completed help.','Describes the dog instead of expressing thanks.'],
  ['sign','sign-library','Write a sign asking readers to be quiet.','Please use a quiet voice in the library.','There are many books in this room.','I borrowed a book about trains.','The sign requests the action needed in the library.','Describes the setting without directing behaviour.','Reports a personal event instead of a direction.'],
  ['lost','missing-dog','Help people recognize your missing dog.','Small brown dog with one white ear.','My dog likes running in the park.','Dogs are good friends to people.','Size, colour, and the white ear identify this particular dog.','Gives behaviour that does not distinguish this dog.','Gives a general opinion rather than identifying details.'],
  ['tell-news','news-hatch','Tell your class that the eggs have hatched.','Three chicks came out of the eggs today.','Where do birds lay their eggs?','Please wash your hands before lunch.','This sentence shares the new event the class needs to know.','Asks a general question instead of telling the news.','Gives an unrelated instruction instead of news.'],
  ['request','request-book','Ask your friend to lend you a book.','May I borrow your book about sharks?','Your shark book has a blue cover.','I read a book at home yesterday.','May I borrow politely asks for the book.','Describes the object without making the request.','Reports past reading instead of asking to borrow.'],
  ['opinion-reason','reason-reading','Our class should have more time to read.','Reading time lets us enjoy and finish more books.','Our class should read more every day.','The shelves are next to the window.','Finishing and enjoying books is a reason for more reading time.','Repeats the opinion without supporting it.','Gives a location unrelated to the request.'],
  ['persuade-reason','garden-volunteers','Ask families to help plant a school garden.','The garden will give children a place to learn about plants.','Our school opens its doors in the morning.','The garden will be beside the school gate.','Learning about plants is a relevant benefit of a school garden.','Gives a schedule fact without supporting the garden.','Gives the garden location rather than a reason to volunteer.'],
  ['research-source','research-weather','Why do puddles dry up after rain?','a science book about water drying up','a collection of stories about rainbows','a map showing local walking paths','A science book about water drying up explains what happens to puddles.','Chooses fictional stories rather than an explanatory source.','Chooses a location source rather than a process explanation.'],
  ['opening-pet','opening-report','The next sentences explain how to care for a hamster.','A hamster needs food, water, and a safe home.','Hamsters have soft fur and small ears.','I saw a hamster in a pet shop.','The opening introduces the care information that follows.','Introduces appearance rather than the care information that follows.','Introduces a visit rather than how to care for the animal.'],
  ['ending-home','ending-search','We looked under the bed. We found the missing shoe.','Now we had both shoes and could go outside.','First we need to look under the bed.','Shoes can be made from many materials.','The ending shows the result of finding the missing shoe.','Moves backwards to the beginning of the search.','Changes to unrelated general information.'],
  ['on-topic','details-weather','Snow covered the ground. Ice hung from the roof.','Our puddle froze in the cold.','My brother bought a new pencil.','We ate pasta for dinner.','A frozen puddle adds another detail about the cold weather.','Changes from cold weather to school supplies.','Changes from cold weather to food.'],
  ['simple-link','list-two-actions','I washed my hands ___ dried them.','and','or','because','And joins two actions that both happened.','Makes the two completed actions alternatives.','Adds an unsupported reason relationship.'],
  ['topic-sentence','topic-stay-safe','Wear a helmet. Look both ways at roads. Use your brakes to slow down.','There are several ways to stay safe on a bike.','Helmets come in many colours.','All roads are quiet in the morning.','The topic sentence includes all three cycling safety ideas.','Focuses on an incidental feature of one detail.','Introduces an unsupported claim unrelated to all three directions.'],
  ['remove-detail','irrelevant-recipe','Mix flour and water. Add a pinch of salt. My cousin has a green bike. Knead the dough.','My cousin has a green bike.','Add a pinch of salt.','Knead the dough.','The bicycle sentence is unrelated to making dough.','Removes a relevant ingredient step.','Removes a relevant preparation step.'],
  ['precise-verb','quiet-move','Everyone in the library was reading, so I ___ to Dad.','whispered','yelled','sang','Whispered means using a quiet voice that fits the setting.','Chooses a loud voice that conflicts with the quiet setting.','Chooses singing instead of quiet speech.'],
  ['clear-colour','specific-cup','Your cup is tall, green, and beside the sink.','Please pass the tall green cup beside the sink.','Please give me one of those things.','Please bring anything that holds water.','Its height, colour, and place identify the requested cup.','Uses a vague reference without identifying the cup.','Accepts many containers instead of the particular cup.'],
  ['complete-thought','complete-weather','Write a whole thought about the storm.','Rain fell all night.','After the rain.','The dark clouds.','Rain fell all night tells what happened in a complete sentence.','Chooses an incomplete time phrase.','Chooses a noun phrase without a main verb.'],
  ['verb-match','plural-verb','Two rabbits ___ in the grass.','hop','hops','hopping','Two rabbits takes hop in this sentence.','Uses a singular verb with a plural subject.','Uses an ing form without a helping verb.'],
  ['pronoun','plural-objects','The cups are clean. ___ are on the shelf.','They','It','She','They refers to more than one cup.','Uses a singular pronoun for several cups.','Uses a person pronoun for inanimate cups.'],
  ['time-word','past-irregular','Last night Dad ___ us a story.','told','tells','telling','Last night places the action in the past, so told fits.','Uses present tense despite the past time.','Uses an ing form without its auxiliary.'],
  ['combine-repetition','combine-two-actions','Ava opened the box. Ava lifted out a kite.','Ava opened the box and lifted out a kite.','Ava opened the kite and lifted out a box.','Ava lifted the box without opening it.','The combined sentence preserves both actions and their objects.','Swaps the objects of the actions.','Contradicts the stated opening action.'],
  ['clear-reference','unclear-object','The ball hit the vase. It broke. The vase broke.','The ball hit the vase. The vase broke.','The ball hit the vase. The ball broke.','The ball hit the vase. Something happened.','Naming the vase removes the unclear it.','Names the wrong thing as broken.','Removes the useful information rather than clarifying it.'],
  ['expand-relevant','explain-delay','We arrived late. Tell the reader why.','A fallen tree blocked the road to school.','Our school gate is painted blue.','My friend wore a warm jumper.','The blocked road explains why the journey took longer.','Adds a setting detail unrelated to the delay.','Adds clothing information unrelated to the delay.'],
  ['keep-sequence','after-meaning','After the paint dried, we hung up the picture.','We let the paint dry, then hung up the picture.','We hung up the picture before the paint dried.','We painted the picture after hanging it up.','After means the paint dried first and hanging came later.','Reverses the two stated events.','Changes both the event and its order.'],
  ['list-comma','comma-three-foods','Name three fruits you bought.','We bought pears, apples, and plums.','We bought pears apples, and plums.','We, bought pears apples and plums.','Commas separate pears, apples, and plums in the list.','Separates only the final item while joining the first two.','Separates the subject from the verb.'],
  ['greeting-comma','greeting-letter','Start a friendly letter to your friend Maya.','Dear Maya,','Dear Maya.','Dear, Maya,','The comma comes after the complete greeting Dear Maya.','Ends the greeting with a full stop.','Adds an extra comma inside the greeting.'],
  ['possessive','one-girl-bag','The bag belongs to a girl called Joy.','Joy’s bag','Joys bag','Joys’ bag','Joy’s shows that the bag belongs to the girl named Joy.','Omits the ownership apostrophe.','Puts the apostrophe after an added s instead of after the girl’s name.'],
  ['speech-marks','dialogue-at-end','Ella says that she is ready.','“I am ready,” said Ella.','I am “ready, said” Ella.','“I am ready, said Ella.”','The quotation marks contain only Ella’s spoken words.','Puts only part of the speech and some attribution inside the marks.','Includes the narrator’s attribution inside the spoken quotation.'],
  ['sentence-break','two-thoughts','The cake cooled we added the icing','The cake cooled. We added the icing.','The cake. Cooled we added the icing.','The cake cooled we added. The icing.','Both The cake cooled and We added the icing are complete sentences.','Splits the first subject from its verb.','Leaves a noun fragment as the second sentence.'],
  ['pronoun-i','capital-i-after-name','Noah and i walked home together.','i','walked','together','The pronoun I always needs a capital, even inside a sentence.','Capitalizes the action word rather than the pronoun.','Capitalizes an ordinary adverb rather than the pronoun.'],
  ['month','month-letter','Her birthday is in august.','august','birthday','her','August is a month name and begins with a capital.','Capitalizes an ordinary noun rather than the month.','Chooses a pronoun already capitalized at the sentence beginning.'],
  ['sentence-fix-medium-0','proper-name-label','This letter is for my friend ___.','Ali','ali','alI','Ali is a person’s name, so its first letter is capitalized.','Leaves the name entirely lowercase.','Puts the capital at the end rather than the beginning.'],
  ['sentence-fix-hard-4','weekday-schedule','We swim every ___ before lunch.','Thursday','thursday','thursDay','Thursday names a day of the week and begins with a capital.','Leaves a day name entirely lowercase.','Puts a capital inside the day name.'],
];

let cached;
export async function loadLiteracyPracticeExtensions() {
  if (!cached) cached = buildExtensions();
  return cached;
}

async function buildExtensions() {
  const [{ SENTENCE_FIX }, { DRUM_TRAIL_WORDS }, leda, cycle, adventure, phoneme] = await Promise.all([
    import('./learnGamesData.js'), import('./drumTrailContent.js'), import('./ledaProductionAudio.js'),
    import('./generated/cyclePracticeInstructionAudio.generated.js'), import('./generated/adventureMapInstructionAudio.generated.js'),
    import('./phonemeAudioBank.js'),
  ]);
  const exactInstruction = text => leda.getLedaProductionAudioPath(text)
    || cycle.CYCLE_PRACTICE_INSTRUCTION_AUDIO[leda.normalizeLedaAudioText(text)]
    || adventure.ADVENTURE_MAP_INSTRUCTION_AUDIO[leda.normalizeLedaAudioText(text)] || '';
  const items = [];
  const add = (skillId, row, extra = {}) => {
    const [key, level, unit, prompt, passage, answer, d1, d2, explanation] = row;
    const skill = LITERACY_EXTENSION_SKILLS.find(value => value.id === skillId);
    const choices = [answer, d1, d2];
    const spokenPrompt = extra.spokenPrompt || prompt;
    const audioRequirements = [{ role: 'instruction', text: spokenPrompt, path: exactInstruction(spokenPrompt), required: true }, ...(extra.audioRequirements || [])];
    const modality = extra.literacyModality || 'reading';
    const decision = {
      role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'not-applicable: no decorative or answer-revealing images',
      reason: modality === 'listening' ? 'Authored oral evidence is the construct; printed target words would supply a shortcut.'
        : 'The complete printed stimulus is the evidence. Illustration would add no necessary information or reveal the answer.',
      construct: unit,
    };
    items.push({
      id: `literacy.${skillId}.${key}`, skillId, assessmentSkillId: skillId, skill: skill.label, skillName: skill.label,
      level, phase: 1, itemKey: unit, evidenceUnit: unit, constructClaim: unit, formatType: 'LITERACY_CHOICE', questionType: 'choice',
      literacyDomainId: skill.domainId, literacyModality: modality, prompt, question: prompt, spokenPrompt,
      passage, choices, answer, correctAnswer: answer, answerOptions: choices.map(value => ({ value, label: value })),
      explanation, rationale: explanation,
      distractorRationales: Object.fromEntries([d1,d2].map((choice, index) => [choice, MISCONCEPTIONS[key]?.[index] || ''])),
      source: LITERACY_EXTENSION_VERSION, sourceProvenance: { kind: 'original_practice', file: 'src/data/literacyPracticeExtensions.js', sourceId: key },
      assessmentMediaDecision: decision, mediaDecision: decision, evidenceModality: modality === 'listening' ? 'audio' : 'text',
      v3AuthoredMedia: { target: false, cards: false }, suppressStimulusAudio: true,
      suppressChoiceAudio: true, allowChoiceAudio: false, instructionAudioText: spokenPrompt, instructionAudioPath: audioRequirements[0].path,
      ...extra, audioRequirements,
      // Availability is explicit. The runtime must not offer a question whose
      // required exact recordings are unavailable or have failed.
      literacyAudioReady: audioRequirements.every(cue => Boolean(cue.path)),
    });
  };

  for (const [skillId, rows] of [['print_concepts', PRINT], ['informational_features', INFORMATION], ['literary_craft', LITERARY], ['writing_purpose', PURPOSE], ['writing_organization', ORGANIZATION], ['writing_revision', REVISION], ['punctuation', PUNCTUATION_EXTENSION]]) {
    for (const row of rows) add(skillId, row);
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const confusions = { A:'HV', B:'DP', C:'GO', D:'BO', E:'FT', F:'ET', G:'CQ', H:'AN', I:'LT', J:'IL', K:'RX', L:'IT', M:'NW', N:'MH', O:'CQ', P:'BR', Q:'OG', R:'PK', S:'CZ', T:'IF', U:'VY', V:'UY', W:'MN', X:'KY', Y:'VT', Z:'SN' };
  for (const letter of letters) {
    const targetPath = leda.getLedaProductionAudioPath(letter, ['letter_name']);
    const distractors = [...confusions[letter]];
    add('letter_knowledge', [`name-${letter.toLowerCase()}`,1,'letter_name','Listen. Choose the matching letter.','',letter,...distractors,`The name you heard belongs to the letter ${letter}.`], {
      literacyModality: 'recognition', evidenceModality: 'audio+text', suppressStimulusAudio: false, audioText: letter, audioPath: targetPath, audioRole: 'target_word',
      audioRequirements: [{ role: 'target_word', text: letter, path: targetPath, required: true, audioKind: 'letter_name' }],
      distractorRationales: Object.fromEntries(distractors.map(value => [value, `Letter-name confusion: selects ${value} for the heard name ${letter}.`])),
      sourceProvenance: { kind: 'original_practice_with_public_recording', file: 'src/data/generated/ledaProductionAudio.generated.js', sourceId: `letter_name:${letter.toLowerCase()}` },
    });
    add('letter_knowledge', [`case-${letter.toLowerCase()}`,2,'letter_case','Tap the matching letter.',letter.toLowerCase(),letter,...distractors,`${letter.toLowerCase()} and ${letter} are the small and big forms of the same letter.`], {
      literacyModality: 'recognition',
      distractorRationales: Object.fromEntries(distractors.map(value => [value, `Case correspondence confusion: matches lowercase ${letter.toLowerCase()} to ${value} instead of ${letter}.`])),
    });
  }

  for (const [wordIndex, word] of DRUM_TRAIL_WORDS.entries()) {
    const correct = String(word.syllables);
    const alternatives = ['1','2','3','4'].filter(n => n !== correct);
    const competitors = wordIndex % 2 ? [alternatives[0], alternatives[2]] : alternatives.slice(0, 2);
    add('syllable_awareness', [word.word,word.syllables <= 2 ? 1 : 2,'oral_syllable_count','Listen. Tap how many beats.','',correct,...competitors,`Say the word slowly: ${word.parts.join(' · ')}. You can hear ${correct} ${word.syllables === 1 ? 'beat' : 'beats'}.`], {
      literacyModality: 'listening', suppressStimulusAudio: false, audioText: word.word, audioPath: word.audio, audioRole: 'target_word',
      audioRequirements: [{ role: 'target_word', text: word.word, path: word.audio, required: true }],
      distractorRationales: Object.fromEntries(competitors.map(value => [value, `${Number(value) < word.syllables ? 'Undercounts' : 'Overcounts'} the ${word.syllables} spoken syllables in ${word.word}; counts ${value}.`])),
      sourceProvenance: { kind: 'approved_public_practice', file: 'src/data/drumTrailContent.js', sourceId: word.id, version: word.contentVersion, familiarity: 'May have been practised in Drum Trail.' },
    });
  }

  const blendingSounds = { 'blend-map': ['m','a','p'], 'blend-sun': ['s','u','n'], 'blend-fish': ['f','i','sh'], 'blend-cup': ['k','u','p'],
    ...Object.fromEntries(ORAL_TRANSFER.map(([key, sounds]) => [key, sounds])) };
  const additionalOral = [
    ...ORAL_TRANSFER.map(([key, , answer, d1, d2, explanation, r1, r2]) =>
      [key,1,'blend_phonemes','Listen to the sounds. Which word do they make?',answer,d1,d2,explanation,r1,r2]),
    ...COMPOUND_TRANSFER.map(([word, removed, answer, d2]) =>
      [`compound-${word}-remove-${removed}`,1,'delete_word_part',`Listen. ${word}. Take away ${removed}. Tap what is left.`,
        answer,removed,d2,`Taking ${removed} away from ${word} leaves ${answer}.`,
        `Returns the removed part ${removed}, rather than the remaining part ${answer}.`,
        `Changes sounds inside the remaining part instead of preserving ${answer}.`]),
  ];
  for (const [key, level, unit, authoredSpeech, answer, d1, d2, explanation, r1, r2] of [...SOUND, ...additionalOral]) {
    const choices = [answer, d1, d2];
    const choiceAudioPaths = Object.fromEntries(choices.map(word => [word, leda.getLedaWordAudioPath(word)]));
    const sounds = blendingSounds[key] || [];
    const spokenPrompt = sounds.length ? 'Listen to the sounds. Which word do they make?' : authoredSpeech;
    add('sound_manipulation', [key,level,unit,'Listen. Choose the new word.','',answer,d1,d2,explanation], {
      spokenPrompt, literacyModality: 'listening', hideWrittenLabels: true, suppressChoiceAudio: false, allowChoiceAudio: true, choiceAudioPaths,
      phonemeSequence: sounds, oralStimulus: sounds.length ? sounds.join(' | ') : authoredSpeech,
      exposureFamilyId: sounds.length ? `oral-blend:${answer}` : unit === 'delete_word_part'
        ? `oral-compound:${/Listen\. ([^.]+)/i.exec(authoredSpeech)?.[1].toLowerCase()}` : `oral-operation:${key}`,
      ...(r1 && r2 ? { distractorRationales: { [d1]: r1, [d2]: r2 } } : {}),
      audioRequirements: [
        ...sounds.map(text => ({ role: 'phoneme', text, path: phoneme.getPreferredPhonemeAudioPath(text), required: true })),
        ...choices.map(text => ({ role: 'choice', text, value: text, path: choiceAudioPaths[text], required: true })),
      ],
      sourceProvenance: { kind: 'original_oral_practice', file: 'src/data/literacyPracticeExtensions.js', sourceId: key, note: 'A full oral task; not a printed spelling or word-reading item.' },
    });
  }

  for (const [sourceLevel, rows] of Object.entries(SENTENCE_FIX)) {
    rows.forEach((row, index) => {
      if (!['capital','end'].includes(row.kind)) return;
      const skillId = row.kind === 'capital' ? 'capitalization' : 'punctuation';
      const unit = row.kind === 'capital' ? row.prompt.startsWith('Names') ? 'proper_name' : row.prompt.startsWith('Days') ? 'days' : row.prompt.startsWith('Places') ? 'places' : 'sentence_capital'
        : row.answer === '?' ? 'question_mark' : row.answer === '!' ? 'exclamation_mark' : 'full_stop';
      const explanation = row.kind === 'capital' ? `${row.answer} uses the capital letter needed here.`
        : row.answer === '?' ? 'This asks a question, so it needs a question mark.' : row.answer === '!' ? 'The sentence expresses strong feeling, so it needs an exclamation mark.' : 'A calm telling sentence ends with a full stop.';
      // Whole printed sentences vary the real punctuation contrast while
      // preserving the source's purpose and key. A second .?! button set alone
      // cannot count as a fresh choice set after teaching.
      const renderOption = mark => row.kind === 'end' ? row.display.replace('___', mark) : mark;
      const answer = renderOption(row.answer);
      const distractors = row.options.filter(option => option !== row.answer).map(renderOption);
      const prompt = row.kind === 'capital' && unit === 'sentence_capital' ? 'Which word starts the sentence with a capital letter?' : row.prompt;
      const punctuationName = { '.':'a calm telling sentence', '?':'a question', '!':'an exclamation' };
      add(skillId, [`sentence-fix-${sourceLevel}-${index}`,sourceLevel === 'hard' ? 2 : 1,unit,prompt,row.display,answer,...distractors,explanation], {
        literacyModality: 'recognition',
        originalAnswer: row.answer,
        distractorRationales: Object.fromEntries(distractors.map(value => [value, row.kind === 'capital'
          ? value === value.toLowerCase() ? `Omits the required initial capital for ${unit}.` : 'Puts a capital inside the word instead of using its conventional initial capital.'
          : `Treats ${punctuationName[row.answer]} as ${punctuationName[value.at(-1)]}.`])),
        sourceProvenance: { kind: 'approved_public_practice', file: 'src/data/learnGamesData.js', sourceId: `SENTENCE_FIX.${sourceLevel}[${index}]`, familiarity: 'May have been practised in Sentence Fix-It.' },
      });
    });
  }

  // New editing contexts extend the public sentence-initial/proper-name stock.
  for (const row of [
    ['pronoun-i',2,'pronoun_i','Which word needs a capital letter?','My friend and i made a den.','i','friend','den','The pronoun I is always written as a capital letter.'],
    ['month',2,'month','Which word needs a capital letter?','Our trip is in april.','april','trip','in','April is the name of a month and begins with a capital.'],
    ['place-name',2,'places','Which word needs a capital letter?','We visited london last year.','london','visited','year','London is a place name, so it begins with a capital.'],
    ['sentence-edit',2,'sentence_capital','Which sentence uses capital letters correctly?','Write a sentence about Ben and his dog.','Ben has a dog.','ben has a dog.','Ben has a Dog.','Ben is a name at the start of the sentence; dog is a common noun.'],
  ]) add('capitalization', row, { literacyModality: 'recognition' });

  for (const [sourceKey, key, passage, answer, d1, d2, explanation, r1, r2] of TRANSFER_PARTNERS) {
    const source = items.find(item => item.id.endsWith(`.${sourceKey}`));
    if (!source) throw new Error(`Missing original literacy task for fresh partner: ${sourceKey}`);
    const choices = [answer, d1, d2];
    const partner = { ...source, id: `literacy.${source.skillId}.${key}`, passage, choices, answer, correctAnswer: answer,
      answerOptions: choices.map(value => ({ value, label: value })), explanation, rationale: explanation,
      distractorRationales: { [d1]: r1, [d2]: r2 },
      sourceProvenance: { kind: 'original_practice', file: 'src/data/literacyPracticeExtensions.js', sourceId: key, relatedPromptSource: source.id },
      transferPartnerId: source.id,
    };
    delete partner.originalAnswer;
    source.transferPartnerId = partner.id;
    items.push(partner);
  }

  for (const item of items) {
    const textFeature = literacyTextFeature(item);
    if (textFeature) item.textFeature = textFeature;
    const cueId = literacyTeachingCueId(item);
    if (!cueId) throw new Error(`Missing constructive spoken feedback: ${item.id}`);
    item.teachingCueId = cueId;
    item.teachingPrompt = LITERACY_TEACHING_PROMPTS[cueId];
    item.teachingAudioRequirements = [{ role: 'instruction', text: item.teachingPrompt, path: exactInstruction(item.teachingPrompt), required: true }];
    item.teachingAudioReady = item.teachingAudioRequirements.every(cue => Boolean(cue.path));
  }
  return items;
}

/** Exact, deduplicated recording worklist. No provider call or browser fallback. */
export function listLiteracyPracticeAudioGaps(items = []) {
  return listRequiredAudioGaps(items, 'audioRequirements');
}

export function listLiteracyPracticeTeachingAudioGaps(items = []) {
  return listRequiredAudioGaps(items, 'teachingAudioRequirements');
}

function listRequiredAudioGaps(items, field) {
  const byKey = new Map();
  for (const item of items) for (const cue of item[field] || []) {
    if (!cue.required || cue.path) continue;
    const key = `${cue.role}:${cue.text}`;
    if (!byKey.has(key)) byKey.set(key, { role: cue.role, text: cue.text, itemIds: [] });
    byKey.get(key).itemIds.push(item.id);
  }
  return [...byKey.values()].sort((a, b) => a.role.localeCompare(b.role) || a.text.localeCompare(b.text));
}
