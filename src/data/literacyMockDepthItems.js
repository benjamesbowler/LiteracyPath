import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { normalizeSpokenCloze } from '../utils/assessmentSpokenText.js';

// Mock-only authored examples. A template supplies the exact skill/construct
// and access contract; the rows supply new evidence, keys and misconception
// contrasts. No published historical catalogue is changed by this loader.
const text = (id, template, level, passage, answer, d1, d2, explanation, demand, prompt) =>
  ({ id, template, level, passage, labels: [answer, d1, d2], explanation, demand, ...(prompt ? { prompt } : {}) });
const ROWS = [
  text('title-subtitle-entry','literacy.print_concepts.book-title',1,'Night Visitors\nWritten by Bea Hill\nPictures by Len Moss','Night Visitors','Bea Hill','Len Moss','Night Visitors names the book; the other names identify its creators.','Locate the book title among two creator credits.'),
  text('title-subtitle-hard','literacy.print_concepts.book-title',2,'Small Pond, Big World\nA guide to pond animals\nWritten by Mira Wood\nPictures by Small Bird Studio','Small Pond, Big World','A guide to pond animals','Small Bird Studio','Small Pond, Big World is the title. The guide line describes its topic and the studio is credited for art.','Distinguish the title from a subtitle and an organization name.'),
  text('title-series-hard','literacy.print_concepts.book-title',2,'Our Nature Library\nBook 4\nThe Secret Life of Trees\nA book by Ella Green','The Secret Life of Trees','Our Nature Library','Ella Green','The Secret Life of Trees names this book; Our Nature Library names the series.','Distinguish this book title from a series title and an author credit.'),
  text('heading-bird-entry','literacy.informational_features.heading-food',1,'A robin eats worms. It also eats small insects.','What Robins Eat','Where Robins Nest','How Robins Fly','Both facts describe the robin’s food.','Identify the shared topic of two explicit facts.'),
  text('heading-warm-hard','literacy.informational_features.heading-food',2,'A duck spreads oil over its feathers. Rain runs off the oily surface. Dry feathers trap warm air next to its body.','How Ducks Keep Warm and Dry','How Ducks Find Food in Water','How Ducks Fly in Cold Weather','The oil keeps feathers dry, and the trapped air keeps the body warm.','Integrate a linked explanation across three facts; distinguish related duck topics.'),
  text('heading-seeds-hard','literacy.informational_features.heading-food',2,'Some seeds float on the wind. Others cling to animals’ fur. Floating seeds can also travel along streams.','How Seeds Travel to New Places','How Animals Eat Different Seeds','How Plants Use Wind and Water','All three methods carry seeds away to new places.','Find one heading that covers three different methods, not just a shared setting.'),
  text('speaker-turn-entry','literacy.literary_craft.speaker-dialogue',1,'“Wait for me!” called Ravi. Tess stopped at the gate.','Ravi','Tess','both children','Called Ravi identifies who said the quoted words.','Locate the speaker after one line of dialogue.'),
  text('speaker-turn-hard','literacy.literary_craft.speaker-dialogue',2,'“I have the map,” said Una. “Do you have the torch?”\n“Yes,” replied Mo. “We can go now.”','Mo','Una','both children','Mo replies yes and continues speaking in the same turn.','Track two speakers and an unattributed second utterance within the same turn.','Who says “We can go now”?'),
  text('speaker-reply-hard','literacy.literary_craft.speaker-dialogue',2,'“Who wants the last apple?” asked Dad.\n“Please may I have it?” Ben said.\n“You may,” Dad replied.','Ben','Dad','both speakers','Ben’s dialogue tag identifies his request; Dad asks and answers.','Locate the middle speaker within alternating dialogue turns.','Who asks to have the apple?'),
  text('invite-entry','literacy.writing_purpose.invite',1,'Invite your friend to make a kite with you.','Would you like to make a kite with me?','Did you make a kite at home yesterday?','Please give my kite back to me.','Only the first message asks the friend to join the activity.','Recognize an invitation among a question and a request.'),
  text('invite-hard','literacy.writing_purpose.invite',2,'Invite Jo to paint with you at your house after lunch.','Jo, come to my house after lunch to paint.','Jo, come to my house before lunch to paint.','Jo, I will come to your house after lunch to paint.','The invitation keeps the requested person, place, activity and time.','Preserve four communication details against two plausible invitation errors.'),
  text('invite-picnic-hard','literacy.writing_purpose.invite',2,'Invite your cousin to a picnic in the park on Sunday.','Please join our picnic in the park on Sunday.','Please join our picnic at home on Sunday.','Please join our picnic in the park on Saturday.','Only the first invitation keeps both the place and day.','Discriminate invitations with competing time and location details.'),
  text('organization-opening-entry','literacy.writing_organization.opening-pet',1,'The next sentences tell how our class made a bird feeder.','Our class made a feeder for the birds.','Birds sang outside our classroom window.','Our teacher has a pet bird at home.','The first sentence introduces the activity described next.','Choose an opening that introduces the declared activity.'),
  text('organization-opening-hard','literacy.writing_organization.opening-pet',2,'The next sentences explain how worms loosen soil and mix dead leaves into it.','Worms help improve the soil in two ways.','Worms loosen soil as they move through it.','Dead leaves fall onto the soil in autumn.','The first opening covers both jobs; the other choices cover one detail or only the setting.','Choose an opening covering two linked contributions over a true but partial detail.'),
  text('organization-opening-pool-hard','literacy.writing_organization.opening-pet',2,'The next sentences explain how the pool is cleaned and how swimmers are kept safe.','Many jobs keep the swimming pool ready for visitors.','Workers keep the water in the pool clean.','Children enjoy splashing in a swimming pool.','The first opening includes maintenance and safety; the cleaning sentence covers only one part.','Select a general opening that includes two distinct aspects of one topic.'),
  text('revision-precise-entry','literacy.writing_revision.precise-verb',1,'The baby was sleeping, so Dad ___ the door gently.','closed','slammed','kicked','Closed fits the gentle action; slammed and kicked would be noisy.','Choose an action matching an explicit manner clue.'),
  text('revision-precise-hard','literacy.writing_revision.precise-verb',2,'The narrow gap was too low to walk through, so I ___ beneath it on my hands and knees.','crawled','crouched','slipped','Crawled describes moving on hands and knees; crouching is a posture and slipped does not describe the given movement.','Discriminate related movement words using two physical clues.'),
  text('revision-precise-rope-hard','literacy.writing_revision.precise-verb',2,'A knot held the rope tightly. I pulled it in short, sharp movements; I ___ it.','tugged','carried','stretched','Tugged means pulling in short sharp movements; the sentence does not say the rope grew longer.','Distinguish a precise verb from related object movements using manner evidence.'),
];

// Oral writing ladders keep all context and alternatives audible at both levels.
const oralLadder = (id, template, entry, first, second) => {
  for (const [index, row] of [entry, first, second].entries()) ROWS.push(text(
    `${id}-${index}`, template, index ? 2 : 1, ...row,
    index ? 'Keep all stated constraints while comparing plausible messages of the same kind.' : 'Identify the intended message using one explicit contextual requirement.'));
};
oralLadder('thanks','literacy.writing_purpose.thank',
  ['Your neighbour watered your plant. Thank her.','Thank you for watering my plant.','Please water my plant tomorrow.','My plant needs water every day.','Only the first message thanks the neighbour for what she did.'],
  ['Thank Amir for lending his bike and say when you will return it.','Thank you for lending your bike. I will bring it back tonight.','Thank you for fixing my bike. I will ride it home tonight.','Please lend me your bike. I will bring it back tonight.','The first message thanks Amir for the loan and gives a return time.'],
  ['Thank Ana for helping find your dog. The dog was not a gift.','Thank you for helping me find my dog.','Thank you for giving me a lovely dog.','Please help me look for my lost dog.','Only the first message thanks Ana for the completed help.']);
oralLadder('direction','literacy.writing_purpose.sign',
  ['Write a sign asking visitors to wipe their feet.','Please wipe your feet before coming in.','Please take your bag when you leave.','Please keep your shoes on the shelf.','Only the first sign requests wiping feet.'],
  ['Visitors must close the gate to keep the rabbit in, but they must not lock it.','Please close the gate, but leave it unlocked.','Please close the gate and lock it behind you.','Please leave the gate open for the rabbit.','The first sign satisfies both closing and not locking.'],
  ['Tell walkers to use the small bridge because the large bridge is closed.','Use the small bridge. The large bridge is closed.','Use the large bridge. The small bridge is closed.','Both bridges are open. Choose either bridge.','The first direction keeps the route and closure information correct.']);
oralLadder('description','literacy.writing_purpose.lost',
  ['Tell someone that your missing bag is green.','I lost my green bag.','I lost my blue bag.','I found a green coat.','The first message keeps the object, colour and fact that it is missing.'],
  ['Your missing dog is small and brown, with one white paw.','I lost a small brown dog with one white paw.','I lost a small white dog with one brown paw.','I lost a large brown dog with four white paws.','Only the first description preserves every identifying detail.'],
  ['Describe a red lunchbox with a silver lid and no handle.','The red lunchbox has a silver lid and no handle.','The silver lunchbox has a red lid and no handle.','The red lunchbox has a silver lid and a handle.','The first description keeps the parts, colours and absent handle correct.']);
oralLadder('information','literacy.writing_purpose.tell-news',
  ['Tell your friend that your class has a new fish.','Our class has a new fish.','Does your class have a fish?','Our class wants to get a fish.','The first sentence reports the new fish as a fact.'],
  ['Tell families that the trip is now on Tuesday, not Monday. The place is unchanged.','Our trip is now on Tuesday. We will visit the same place.','Our trip is still on Monday. We will visit a new place.','Our trip is now on Tuesday. We will visit a new place.','The first message reports only the change that happened.'],
  ['The library opens at nine tomorrow, one hour later than usual. Tell visitors.','Tomorrow the library opens at nine, later than usual.','Tomorrow the library opens at eight, as usual.','Tomorrow the library closes at nine, earlier than usual.','The first message preserves the opening time and the direction of the change.']);
oralLadder('request','literacy.writing_purpose.request',
  ['Ask an adult to help tie your shoelace.','Please help me tie my shoelace.','Please put my shoes in the box.','Please help me find my blue socks.','The first request asks for the specified help.'],
  ['Ask to borrow a ruler until the end of the lesson. Do not ask to keep it.','May I borrow your ruler and return it after the lesson?','May I have your ruler to keep after the lesson?','May I borrow your ruler and return it next week?','The first request asks for a loan with the required return time.'],
  ['Ask your neighbour to feed the cat tonight, but not to let it outside.','Please feed the cat tonight and keep it indoors.','Please feed the cat tomorrow and keep it indoors.','Please feed the cat tonight and let it outside.','The first request keeps both the time and the indoor condition.']);
oralLadder('ending','literacy.writing_organization.ending-home',
  ['We put the last piece in the puzzle. The whole picture was complete.','We had finished the puzzle together.','We were ready to choose a puzzle.','We started looking for the corner pieces.','The first ending closes the completed activity.'],
  ['We tried three designs for our paper bridge. The last design held ten coins without bending.','After testing and changing it, we had a strong bridge.','Our first design held ten coins without bending.','Paper bridges always break when coins are added.','The first ending brings together the trial process and its successful result.'],
  ['We asked neighbours for spare seeds. Everyone shared some, and every garden box was planted.','By sharing seeds, we filled all the garden boxes.','We still needed to ask for seeds for every box.','One neighbour kept all the seeds for a single box.','The first ending sums up the joint effort and the completed result.']);
oralLadder('writing-sequence','literacy.writing_organization.steps-wash',
  ['Put on your socks, then put on your shoes.','Put your socks on your feet.','Tie the laces of your shoes.','Put your shoes on your feet.','The socks must go on before the shoes.'],
  ['To post the letter, put it in an envelope, write the address, add a stamp, and use the post box.','Put the letter inside an envelope.','Write the address on the envelope.','Stick a stamp on the envelope.','Putting the letter in the envelope is the first of the four supplied steps.'],
  ['Before painting, cover the table. Then place the paper, pour the paint, and choose a brush.','Cover the table to protect it.','Place the paper on the table.','Pour some paint into a pot.','The covering comes before all the other stated preparations.']);
oralLadder('writing-support','literacy.writing_organization.on-topic',
  ['These facts describe winter weather. Snow fell. The pond froze.','Ice covered the garden path.','My new boots were red.','We packed a bag for school.','Ice on the path gives another winter-weather fact.'],
  ['The paragraph explains how a thick coat helps a polar bear stay warm.','Air trapped in the thick fur slows heat loss.','The bear’s pale fur helps it blend into snow.','The bear has strong legs for swimming.','Only the first detail explains how the coat helps retain warmth.'],
  ['The paragraph explains why our class can use less paper.','We write on both sides before taking a new sheet.','We keep new paper in a cupboard beside the door.','Our sheets of paper come in different colours.','Using both sides reduces the number of new sheets needed.']);
oralLadder('connecting-word','literacy.writing_organization.simple-link',
  ['The list names both things I packed: a spoon ___ a bowl.','and','but','because','And joins the two things in the list.'],
  ['The path was muddy, ___ we wore our boots to keep dry.','so','but','or','So expresses the result of the muddy condition.'],
  ['I wanted to ride my bike, ___ its flat tyre meant I had to walk.','but','so','and','But shows the contrast between the desired ride and what prevented it.']);
oralLadder('revision-detail','literacy.writing_revision.clear-colour',
  ['Your scarf is the yellow one beside the door.','Please pass the yellow scarf beside the door.','Please pass something from near the door.','Please pass that thing from over there.','Only the first request identifies the scarf using the supplied details.'],
  ['There are three blue cups. Yours has a white stripe inside the rim.','Please pass the blue cup with a white stripe inside its rim.','Please pass the blue cup with a white stripe on its handle.','Please pass any blue cup from the table.','The inside-rim detail distinguishes this cup from the other blue cups.'],
  ['Two coats are green. Yours has black buttons and a torn pocket.','My green coat has black buttons and a torn pocket.','My green coat has a black pocket and torn buttons.','My coat is green, like the other coat beside it.','Only the first description preserves both distinguishing features.']);
oralLadder('complete-sentence','literacy.writing_revision.complete-thought',
  ['Choose words that tell a whole thought.','The rain stopped.','Under the dark cloud.','The heavy rain.','The rain stopped has both a subject and a complete action.'],
  ['Choose words that tell a whole thought.','After the rain stopped, we went outside.','After the rain stopped outside.','The children outside after the rain.','The first choice contains a complete main clause after the time clause.'],
  ['Choose words that tell a whole thought.','The dog beside the gate barked at us.','The dog beside the gate and the fence.','While the dog beside the gate barked.','Only the first choice is a complete sentence rather than a phrase or dependent clause.']);
oralLadder('agreement','literacy.writing_revision.verb-match',
  ['The two kittens ___ beside the fire now.','sit','sits','sitting','The plural subject kittens takes sit in this complete present sentence.'],
  ['The box of coloured pencils ___ on the shelf now.','sits','sit','sitting','The subject is the singular box; pencils is inside the of-phrase.'],
  ['The children beside the teacher ___ ready now.','are','is','was','The subject children is plural even though the nearer noun teacher is singular.']);
oralLadder('pronoun','literacy.writing_revision.pronoun',
  ['The girls put on their coats. ___ went outside.','They','She','It','They refers to the plural girls.'],
  ['Mum gave Ben and me the tickets. She handed the tickets to ___.','us','we','him','The tickets go to Ben and the narrator together, in the object position.'],
  ['The kittens followed their mother. ___ curled up together while their mother ate.','They','She','It','They refers to the kittens; their mother is the separate singular animal.']);
oralLadder('tense','literacy.writing_revision.time-word',
  ['Yesterday the frog ___ over the stone.','jumped','jumps','jumping','Yesterday requires the completed past action jumped.'],
  ['The bell usually rings at nine, but yesterday it ___ at ten.','rang','rings','ringing','The sentence changes from a usual present action to one past event.'],
  ['I take the bus most days. Last Friday I ___ instead.','walked','walk','walking','Last Friday places the second action in the past despite the preceding present-tense habit.']);

// Contextual grammar ladders replace cross-part-of-speech giveaways with
// competitors from the same grammatical category and explicit semantic clues.
const grammar = (skill, construct, id, sentence, key, d1, d2, why) => ROWS.push(text(
  id, `@${skill}:${construct}`, 2, sentence, key, d1, d2, why,
  'Use the sentence meaning to discriminate alternatives from the same grammatical category.',
  `${skill === 'nouns' ? 'Which naming word fits?' : skill === 'verbs' ? 'Which doing word fits?' : 'Which description fits best?'} ${sentence}`));
for (const row of [
 ['noun_person','nurse','The ___ checked the patient’s temperature before giving the medicine.','nurse','driver','baker','A nurse cares for a patient; all three choices name people.'],
 ['noun_person','librarian','The ___ helped us find a book and recorded its return date.','librarian','author','painter','A librarian lends and records books; an author writes them.'],
 ['noun_animal','hedgehog','The ___ curled into a ball with its sharp spines pointing out.','hedgehog','rabbit','tortoise','A hedgehog curls up with exposed spines; the other animals have different protection.'],
 ['noun_animal','squirrel','The ___ flicked its bushy tail and carried a nut up the tree.','squirrel','mouse','owl','The bushy tail and carrying nuts up trees identify a squirrel.'],
 ['noun_place','bakery','We entered the ___ to buy a loaf still warm from the oven.','bakery','library','garage','A bakery makes and sells bread; all choices name places.'],
 ['noun_place','harbour','Fishing boats sheltered from the rough sea in the ___.','harbour','station','airport','A harbour shelters boats; the alternatives serve other kinds of transport.'],
 ['noun_thing','sieve','Pour the mixture through the ___ so the liquid passes but the lumps stay.','sieve','spoon','bowl','A sieve separates lumps from liquid rather than holding or stirring both.'],
 ['noun_thing','thermometer','The ___ showed that the water was too hot for the fish.','thermometer','ruler','clock','A thermometer measures temperature; the others measure length or time.'],
]) grammar('nouns',...row);
for (const row of [
 ['verb_action_body','crawl','To pass beneath the low net, we had to ___ on our hands and knees.','crawl','march','leap','Crawl matches moving on hands and knees beneath a low obstacle.'],
 ['verb_action_body','whisper','The baby was asleep, so we chose to ___ instead of speaking loudly.','whisper','shout','sing','Whisper is the quiet way of speaking required by the sleeping baby.'],
 ['verb_action_object','fold','To make the paper fit inside the envelope, ___ it in half.','fold','roll','crumple','Fold in half describes making a flat, half-size sheet; rolling and crumpling make different shapes.'],
 ['verb_action_object','strain','To remove the leaves but keep the tea, ___ it.','strain','stir','pour','Strain specifically means separating the leaves from the liquid; stirring mixes them and pouring only moves the liquid.'],
 ['verb_everyday','rinse','After washing the cup, ___ it with clean water to remove the soap.','rinse','fill','dry','Rinse means using clean water to remove soap; fill alone does not specify cleaning.'],
 ['verb_everyday','return','After borrowing the book, remember to ___ it to its owner.','return','lend','keep','Return gives the borrowed book back; lend describes the owner’s earlier action.'],
]) grammar('verbs',...row);
for (const row of [
 ['adj_size','narrow','Only one person could pass through the ___ gap at a time.','narrow','shallow','short','Narrow describes limited width, which restricts people passing side by side.'],
 ['adj_size','deep','The ___ pond was too far down for my feet to reach the bottom.','deep','wide','long','Deep describes the distance down to the bottom, not across the pond.'],
 ['adj_color','pale','The painter mixed white into the blue paint, making a ___ blue.','pale','dark','bright','Adding white lightens blue into a paler colour.'],
 ['adj_color','darker','Beside the light grey stone, the nearly black stone looked ___.','darker','paler','lighter','Nearly black is darker than light grey; the other choices reverse the comparison.'],
 ['adj_texture_state','brittle','The dry twig snapped with a light touch because it was ___.','brittle','flexible','sticky','Brittle describes something that breaks easily rather than bending.'],
 ['adj_texture_state','damp','The towel was no longer dripping, but it was still slightly wet, or ___.','damp','soaked','dry','Damp means slightly wet, between soaked and dry.'],
 ['adj_feeling','relieved','When the missing puppy came home safely, Sam stopped worrying and felt ___.','relieved','jealous','lonely','Relieved describes worry ending when the puppy is safe.'],
 ['adj_feeling','disappointed','After practising all week, Mai felt ___ when the concert was cancelled.','disappointed','relieved','curious','Disappointed fits an expected happy event not happening.'],
]) grammar('adjectives',...row);
const extra = (skill, construct, id, prompt, passage, key, d1, d2, why, demand) =>
  ROWS.push(text(id, `@${skill}:${construct}`, 2, passage,key,d1,d2,why,demand,prompt));
extra('plurals','plural_add_es','plural-bus','Which word fits?','Three ___ carried our class to the museum.','buses','bus','busies','Buses is the standard plural of bus here.','Apply the es plural ending against the singular and an over-doubled form.');
extra('plurals','plural_add_es','plural-dish','Which word fits?','We put both clean ___ on the shelf.','dishes','dishs','dish','Dishes adds es after sh; dishs omits the needed vowel.','Discriminate the correct spelling of an es plural from an overgeneralized s form.');
extra('prefix_suffix','apply_affix_meaning_in_context','affix-careless','Which word describes the action?','Rae knew the pot was fragile but tossed it into the box without taking care.','careless','careful','caring','Careless uses less to mean without care; the other forms suggest care.','Apply an affix meaning against same-root contrasts.');
extra('prefix_suffix','apply_affix_meaning_in_context','affix-reusable','Which word describes the bag?','This bag can be used again many times.','reusable','unusable','used','Reusable combines again with able to be used; unusable means it cannot be used.','Distinguish two affixed forms of the same root using a complete context.');
for (const construct of ['antonym_concrete','antonym_picture']) {
 extra('antonyms_synonyms',construct,`${construct}-borrow`,'Which pair has opposite meanings?','','lend — borrow','lend — loan','borrow — receive','Lend gives something temporarily; borrow receives it temporarily.','Compare converse actions; reject a synonym pair and two related receiving actions.');
 extra('antonyms_synonyms',construct,`${construct}-expand`,'Which pair has opposite meanings?','','expand — shrink','expand — grow','shrink — shorten','Expand increases size; shrink decreases it.','Recognize a size-change opposition among two near-synonym alternatives.');
}
for (const construct of ['synonym_concrete','synonym_picture']) {
 extra('antonyms_synonyms',construct,`${construct}-reluctant`,'Find two words that mean the same.','','reluctant — unwilling','reluctant — unable','reluctant — eager','Reluctant means unwilling, not unable; eager gives the opposite attitude.','Separate willingness from ability and the opposite motivation.');
 extra('antonyms_synonyms',construct,`${construct}-fragile`,'Find two words that mean the same.','','fragile — breakable','fragile — broken','fragile — flexible','Fragile means breakable; broken means damage has already happened, and flexible means bendable.','Separate a disposition to break from an already broken state and a different material property.');
}
for (const row of [
 ['literal_who_what','scarf','What did Lina carry?','While Dad carried the bag, Lina carried the red scarf that Mum had knitted.','the red scarf','the bag','the knitting needles','Lina carried the scarf; Dad carried the bag and Mum was its maker.'],
 ['literal_who_what','pencil','Who lent Jo the pencil?','Jo borrowed the pencil from Tess after returning Max’s ruler.','Tess','Max','Jo','The from phrase identifies Tess as the lender; Max owned the ruler.'],
 ['literal_where_when','basket','Where did Al put the basket?','Before lunch, Al put the basket beside the door, then carried the bag upstairs.','beside the door','upstairs','under the table','The basket stayed beside the door; the bag went upstairs.'],
 ['literal_where_when','meeting','When will the children meet?','The children will meet after lunch, although their teacher arrives before lunch.','after lunch','before lunch','during lunch','The first clause gives the children’s time; the second gives the teacher’s different time.'],
 ['literal_action','gate','How did Nell move through the gate?','Nell squeezed through the narrow gate while her brother jumped over the low fence.','She squeezed through it.','She jumped over it.','She climbed under it.','Nell squeezed; jumping belongs to her brother at the fence.'],
 ['literal_action','rope','What did Arun do with the rope?','After Bea untied the rope, Arun coiled it neatly rather than dragging it across the mud.','He coiled it neatly.','He untied it.','He dragged it through mud.','Arun coiled the rope; Bea untied it and dragging is explicitly rejected.'],
]) extra('sentence_comprehension',...row,'Track the named actor, object or time across clauses containing a plausible competing detail.');

// Print navigation develops beyond a single line without narrating its evidence.
for (const row of [
 ['first-word-entry','first-word',1,'Little birds sing.','Little','birds','sing','Little is the first printed word.','Locate the beginning of a short printed sentence.'],
 ['last-word-entry','last-word',1,'We saw a rainbow.','rainbow','saw','a','Rainbow is the final word before the full stop.','Locate the last word in a short printed sentence.'],
 ['spaces-entry','word-spaces',1,'My dog can swim.','4','3','5','The spaces separate My, dog, can and swim: four words.','Count four printed words using spaces.'],
 ['first-letter-entry','first-letter',1,'map','m','a','p','M is at the beginning of map.','Locate the first glyph of a printed word.'],
 ['last-letter-entry','last-letter',1,'hen','n','h','e','N is at the end of hen.','Locate the last glyph of a printed word.'],
 ['spaces-contraction','word-spaces',2,'We can’t see Sam’s puppy.','5','6','7','Apostrophes inside can’t and Sam’s do not create word spaces; there are five words.','Count space-separated words despite internal apostrophes.'],
 ['spaces-quoted','word-spaces',2,'“Please wait,” called Mr Fox.','5','4','6','Quotation marks, comma and full stop attach to words; the five words are Please, wait, called, Mr and Fox.','Count words across quotation and abbreviation punctuation without counting marks as words.'],
]) ROWS.push(text(row[0],`literacy.print_concepts.${row[1]}`,...row.slice(2)));
ROWS.push(text('direction-entry','literacy.print_concepts.word-order',1,'The dogs play outside.','play','The','outside','Play follows dogs in left-to-right reading.','Move to the next word on one line.'));
ROWS.push(text('direction-wrap','literacy.print_concepts.word-order',2,'The dogs\nrun across the field.','run','The','field','After dogs at the line end, reading continues at the left of the next line with run.','Return to the left edge on the next line rather than continue along the margin.'));
ROWS.push(text('direction-wrap-second','literacy.print_concepts.word-order',2,'At sunset the dogs\nrest beside the door.','rest','sunset','door','Rest is the first word of the next line after dogs.','Track the next word across a line break after an introductory phrase.'));
extra('informational_features','supporting_detail','penguin-evidence','Which fact best supports the idea that penguins are adapted for swimming?',
 'Penguins have feathers and lay eggs. Their strong flippers push them through water. They gather in colonies, and many have black backs and white fronts.',
 'Their strong flippers push them through water.','They gather in large colonies.','They have black backs and white fronts.',
 'The flippers provide the movement used for swimming; the other facts describe unrelated traits.','Distinguish direct functional evidence from true facts about the same animal.');
extra('informational_features','supporting_detail','desert-evidence','Which fact supports the idea that this plant saves water?',
 'The desert plant has thick stems that store water. A waxy coating reduces water loss. Its flowers open in bright colours, and insects visit them.',
 'A waxy coating reduces water loss.','Its flowers have bright colours.','Insects visit its open flowers.',
 'Reduced water loss directly supports saving water; the flower facts concern pollination.','Select an explanatory detail among true facts from two different processes.');
for (const row of [
 ['fiction','fox-vote','Which detail makes this a make-believe story?','The fox brushed snow from its fur. It followed tracks to a cabin, knocked politely, and asked the rabbit to vote for it as mayor.','The fox asked to be elected mayor.','The fox brushed snow from its fur.','The fox followed tracks through snow.','Speaking about an election assigns a human social action to the animal.'],
 ['fiction','moon-message','Which detail makes this a make-believe story?','Lea watched the moon rise above the sea. Its reflection trembled on the water. Then the moon whispered her name and invited her to climb a silver staircase.','The moon whispered Lea’s name.','The moon rose above the sea.','Its reflection moved on the water.','A moon speaking to a person is fantasy; moonrise and moving reflections can occur.'],
 ['sound_words','metal','Which word helps you hear the sudden impact?','The lid slipped. Clang! It struck the metal pan, then rolled quietly across the floor.','Clang','slipped','quietly','Clang imitates the ringing impact; quietly describes low volume rather than the impact sound.'],
 ['sound_words','paper','Which word imitates the sound of tearing paper?','Rrrip! The paper tore. The breeze rustled the leaves as Kay folded the remaining sheet.','Rrrip','rustled','folded','Rrrip imitates the tearing itself; rustled is the separate sound of leaves.'],
 ['sensory_language','kitchen','Which words tell about a sound?','Warm steam rose from the pan. A sharp hiss came from its edge, and the air smelled of lemons.','a sharp hiss','warm steam','smelled of lemons','Hiss is heard; the other details concern warmth and smell.'],
 ['sensory_language','hall','Which words tell about a sound?','The icy handle felt rough. Beyond the dark door, faint footsteps echoed down the hall.','faint footsteps echoed','the icy handle','beyond the dark door','Footsteps echoing is auditory evidence; icy and dark concern other senses.'],
 ['word_choice','nervous','Which words show that Nia feels nervous?','Nia wore a yellow coat. At the classroom door, she gripped her bag and hesitated before knocking.','gripped her bag and hesitated','wore a yellow coat','at the classroom door','Gripping and hesitation suggest tension; clothing and place do not establish a feeling.'],
 ['word_choice','relief','Which words show that Omar feels relieved?','Omar had searched for his brother. When he saw him safe, his shoulders relaxed and he let out a long breath.','shoulders relaxed and let out a long breath','had searched for his brother','when he saw him safe','Relaxing and releasing breath show the feeling; finding his brother explains its cause.'],
 ['genre','recipe','Which choice describes this text?','To make the oat cakes, mix the oats with milk. Press the mixture into rounds. Bake until firm, then leave them to cool before eating.','instructions for making food','a story about a baker','facts about where oats grow','The text directs actions in a preparation process.'],
 ['genre','factbook','Which choice describes this text?','A barn owl often hunts after dark. Its soft feathers help it fly quietly. It listens carefully for small animals moving below.','facts about a real animal','a story with a talking owl','instructions for making an owl nest','The passage explains real habits and adaptations; it neither tells a fictional event nor directs the reader.'],
]) extra('literary_craft',...row,'Interpret a targeted text feature among meaningful nearby details rather than unrelated nouns.');


export function buildLiteracyMockDepthItems(bank) {
  const byId = new Map(bank.map(item => [item.id, item]));
  return ROWS.map(row => {
    const template = row.template.startsWith('@') ? bank.find(item => item.level === 1 && `${item.skillId}:${item.constructClaim}` === row.template.slice(1)) : byId.get(row.template);
    if (!template) throw new Error(`Missing mock depth template: ${row.template}`);
    if (template.constructClaim === 'synonym_picture' && row.id.startsWith('synonym_picture')) {
      const reluctant = row.id.endsWith('reluctant');
      row.prompt = reluctant ? 'Jo was reluctant to enter. Which word means the same as reluctant here?' : 'This thin glass is fragile. Which word means the same as fragile here?';
      row.labels = reluctant ? ['unwilling','unable','eager'] : ['breakable','broken','flexible'];
    }
    const prompt = row.prompt || template.prompt;
    const choices = row.labels.map((label, index) => ({ id: `c${index}`, label }));
    const oral = template.oralLanguageAccess === true;
    const spokenPrompt = template.modality === 'reading' ? prompt : normalizeSpokenCloze(prompt);
    const cues = [{ role: 'instruction', text: spokenPrompt, path: getLedaInstructionAudioPath(spokenPrompt) }];
    if (oral || template.modality === 'listening') cues.push({ role: 'passage', text: normalizeSpokenCloze(row.passage),
      path: getLedaInstructionAudioPath(normalizeSpokenCloze(row.passage)) });
    if (oral || template.requiredAudioCues.some(cue => cue.role === 'choice')) cues.push(...choices.map(choice => ({
      role: 'choice', choiceId: choice.id, value: choice.label, text: choice.label,
      path: getLedaWordAudioPath(choice.label) || getLedaInstructionAudioPath(choice.label),
    })));
    return { ...template, id: `mock.depth.${row.id}`, sourceItemId: `mock.depth.${row.id}`,
      canonicalItemId: `mock.depth.${row.id}`, level: row.level, prompt, passage: row.passage,
      textFeature: {
        'title-subtitle-entry': { kind: 'book_cover', title: 'Night Visitors', credits: [
          { label: 'Written by', name: 'Bea Hill' }, { label: 'Pictures by', name: 'Len Moss' }] },
        'title-subtitle-hard': { kind: 'book_cover', title: 'Small Pond, Big World', subtitle: 'A guide to pond animals', credits: [
          { label: 'Written by', name: 'Mira Wood' }, { label: 'Pictures by', name: 'Small Bird Studio' }] },
        'title-series-hard': { kind: 'book_cover', title: 'The Secret Life of Trees', subtitle: 'Our Nature Library — Book 4', credits: [
          { label: 'A book by', name: 'Ella Green' }] },
      }[row.id],
      choices, answer: 'c0', format: 'choice', answerMode: 'exact', targetWord: '', image: '', imageAlt: '',
      requiredAudioCues: cues, tutorialOnly: false, stimulusKey: (row.id.startsWith('complete-sentence') || !row.passage ? row.labels.join('|') : row.passage).toLowerCase(),
      ...(row.id.startsWith('complete-sentence') ? { passageIsInstruction: true } : {}),
      exposureFamilyId: `mock-depth:${row.id.replace(/^synonym_(?:concrete|picture)-/, 'synonym-')}`, explanation: row.explanation,
      difficultyEvidence: row.demand,
      distractorRationales: { c1: `${row.labels[1]} does not satisfy the complete evidence. ${row.explanation}`,
        c2: `${row.labels[2]} does not satisfy the complete evidence. ${row.explanation}` },
      sourceProvenance: { kind: 'original_mock_depth', file: 'src/data/literacyMockDepthItems.js',
        sourceId: row.id, taskTemplate: row.template },
      mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
        reason: oral ? 'Exact oral context and choices preserve the entry oral-language conditions.' : 'The complete printed evidence is required for this reading task.' },
    };
  });
}
