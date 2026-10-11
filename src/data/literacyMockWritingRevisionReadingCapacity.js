// Independent reading revisions: every option must preserve the supplied
// relationship or satisfy the explicitly stated revision purpose.
const rows = [];
function group(templateId, prefix, demand, specs) {
 for (const [id, passage, key, a, b, explanation] of specs) rows.push({
  templateId, id: `revision-reading-${prefix}-${id}`,
  passage: templateId === 'literacy.writing_revision.expand-relevant' ? `${passage} Explain why.` : passage,
  labels: [key,a,b], explanation, demand,
 });
}
group('literacy.writing_revision.combine-repetition', 'combine',
 'Combine two supplied facts while preserving both roles, attributes or actions.', [
 ['lantern','The lantern is blue. The lantern hangs beside the door.','The blue lantern hangs beside the door.','The blue door hangs beside the lantern.','The lantern hangs beside the blue door.','Blue describes the lantern, and the lantern is what hangs beside the door.'],
 ['helpers','The cook chopped carrots. The helper peeled potatoes.','The cook chopped carrots, and the helper peeled potatoes.','The cook peeled potatoes, and the helper chopped carrots.','The cook chopped carrots and peeled potatoes while the helper waited.','The combined sentence keeps each action with its original person.'],
 ['bridge','The wooden bridge is narrow. The wooden bridge crosses the stream.','The narrow wooden bridge crosses the stream.','The wide wooden bridge crosses the stream.','The narrow wooden stream crosses the bridge.','Both the bridge’s material and width remain attached to the bridge.'],
 ['warmth','A wool scarf kept my neck warm. A wool hat kept my head warm.','A wool scarf warmed my neck, and a wool hat warmed my head.','A wool scarf warmed my head, and a wool hat warmed my neck.','A wool scarf warmed my neck, and a wool hat warmed my hands.','Each item keeps its stated body part; the foils exchange or change those parts.'],
 ['library','The library lends books. The library also lends recorded stories.','The library lends both books and recorded stories.','The library lends books but keeps all recorded stories for itself.','The library lends recorded stories instead of books.','Both kinds can be borrowed; neither one replaces or excludes the other.'],
 ['kite','Wind lifted the kite. The string kept the kite from drifting away.','Wind lifted the kite, while its string kept it from drifting away.','The string lifted the kite, while wind kept it from drifting away.','Wind lifted the kite after its string drifted away.','The revision keeps the wind’s lifting action and the string’s restraining function.'],
 ['cups','The tall cup holds juice. The short cup holds water.','The tall cup holds juice, and the short cup holds water.','The tall cup holds water, and the short cup holds juice.','Both the tall cup and the short cup hold juice.','The two different drinks stay associated with their stated cups.'],
 ['seeds','We planted beans beside the fence. We planted carrots near the path.','We planted beans beside the fence and carrots near the path.','We planted carrots beside the fence and beans near the path.','We planted beans and carrots together beside the fence.','The combined sentence preserves the different planting locations.'],
]);
group('literacy.writing_revision.clear-reference', 'reference',
 'Replace an unclear pronoun with the intended referent supported by the surrounding facts.', [
 ['window','The ball hit the window. It cracked. The ball stayed round, but the glass had a split.','The ball hit the window. The window cracked.','The ball hit the window. The ball cracked.','The ball hit the window. They both cracked.','The split glass identifies the window; the ball’s unchanged shape rules out the alternatives.'],
 ['helmet','A cyclist lent a helmet to a skater. She wore it. The skater fastened the helmet strap under her own chin.','A cyclist lent a helmet to a skater. The skater wore the helmet.','A cyclist lent a helmet to a skater. The cyclist wore the helmet.','A cyclist lent a helmet to a skater. She put it on.','The skater’s need identifies the wearer, and the helmet is the protection.'],
 ['soup','Dad poured soup into a bowl. It was hot. The soup had just boiled; the empty bowl had been cool.','Dad poured soup into a bowl. The soup was hot.','Dad poured soup into a bowl. Dad was hot.','Dad poured soup into a bowl. The empty bowl had been hot.','The boiling soup is the intended hot thing; the prior bowl temperature is explicitly cool.'],
 ['dog','A puppy followed a cat. It climbed the tree. The puppy stayed on the ground and barked upward.','A puppy followed a cat. The cat climbed the tree.','A puppy followed a cat. The puppy climbed the tree.','A puppy followed a cat. Both animals climbed the tree.','The puppy remains below, so the cat is the climber.'],
 ['box','The parcel rested on a shelf. It was wrapped in brown paper. The shelf was bare wood.','The parcel rested on a shelf. The parcel was wrapped in brown paper.','The parcel rested on a shelf. The shelf was wrapped in brown paper.','The parcel and shelf were both wrapped in brown paper.','Wrapping belongs to the parcel; bare wood excludes the shelf.'],
 ['coat','A teacher handed a coat to a pupil. He put it on. The pupil pulled both arms into the coat’s sleeves.','A teacher handed a coat to a pupil. The pupil put on the coat.','A teacher handed a coat to a pupil. The teacher put on the coat.','A teacher handed a coat to a pupil. He wore it outside.','The departing pupil needs the coat, making both actor and object explicit.'],
 ['bicycle','A bicycle leaned against a wheelbarrow. It had a flat tire. The wheelbarrow’s tire was firm, but the bicycle’s rear rim touched the ground.','A bicycle leaned against a wheelbarrow. The bicycle had a flat tire.','A bicycle leaned against a wheelbarrow. The wheelbarrow had a flat tire.','A bicycle leaned against a wheelbarrow. They both had flat tires.','The firm wheelbarrow tire rules out that referent; the bicycle’s low rim identifies its flat tire.'],
 ['ladder','The painter leaned a ladder against a wall. It slipped. The ladder’s feet moved, but the wall stayed still.','The painter leaned a ladder against a wall. The ladder slipped.','The painter leaned a ladder against a wall. The wall slipped.','The painter leaned a ladder against a wall. The painter moved the wall.','The moving feet identify the ladder as the object that slipped.'],
]);
group('literacy.writing_revision.expand-relevant', 'detail',
 'Add the detail that explains the stated event or quality, rather than a related incidental fact.', [
 ['shelter','Our shelter kept the books dry during the shower.','Its roof blocked the rain.','Its posts were painted green during the holiday.','The books contained stories about adventures.','The roof explains how the shelter kept the books dry.'],
 ['tower','The block tower fell during our test.','Its narrow base tipped over.','Some blocks were yellow and others were blue.','We stored the blocks in a box after lunch.','A tipping base explains the fall; colors and storage do not.'],
 ['quiet','The new door makes the reading room quieter.','Seals around its edges block outside noise.','The handle is round and made from shiny metal.','The door was delivered on a large truck.','Sealing the noise gap explains the reduction in sound.'],
 ['plant','The plant began to wilt before we watered it.','Its soil had dried out.','Its pot was bought at the market last month.','Its leaves were counted during a class activity.','Lack of water explains wilting; purchase and counting do not.'],
 ['bus','The bus could not continue along the lane.','A low branch blocked the way above its tall roof.','A passenger had a bag beside her seat.','The driver wore a clean blue shirt.','The obstruction explains why the bus could not continue.'],
 ['recipe','Our second mixture made a thicker paste.','We used less water with the same amount of flour.','We stirred it in a bowl with a red rim.','We made it after cleaning the workbench.','The lower water proportion explains the thicker consistency.'],
 ['sign','The replacement sign is easier to read from far away.','Its larger letters stand out clearly against a plain background.','Its wooden post stands beside the same path.','Its message was written on a Tuesday.','Letter size and contrast explain improved readability.'],
 ['jacket','The jacket kept me warm during the cold wind.','Its thick lining trapped a layer of warm air.','Its pocket held my ticket for the journey.','Its zip had a small silver pull.','Insulation explains warmth, while the ticket and zipper detail do not.'],
]);
group('literacy.writing_revision.revise-agreement', 'agreement',
 'Use the head subject and stated time to choose the matching finite verb form.', [
 ['bus','Every morning, the bus ___ outside our school.','The bus stops outside our school.','The bus stop outside our school.','The bus stopping outside our school.','The singular bus requires stops in the simple present.'],
 ['geese','Right now, two geese ___ swimming beside the bank.','Two geese are swimming beside the bank.','Two geese is swimming beside the bank.','Two geese am swimming beside the bank.','Plural geese takes are, not is or am.'],
 ['string','The end of the two strings ___ tied to a hook.','The end of the two strings is tied to a hook.','The end of the two strings are tied to a hook.','The end of the two strings am tied to a hook.','The head subject end is singular despite the nearby plural strings.'],
 ['gloves','Both gloves ___ missing from the shelf now.','Both gloves are missing from the shelf now.','Both gloves is missing from the shelf now.','Both gloves am missing from the shelf now.','Both gloves is a plural subject and therefore takes are.'],
 ['roots','The roots of the tree ___ water from the soil.','The roots of the tree take water from the soil.','The roots of the tree takes water from the soil.','The roots of the tree taking water from the soil.','Plural roots controls take; the nearby singular tree does not control the verb.'],
 ['self','I ___ ready to help right now.','I am ready to help right now.','I is ready to help right now.','I are ready to help right now.','The first-person singular pronoun I uses am.'],
 ['sister','My sister and I ___ taking turns.','My sister and I are taking turns.','My sister and I is taking turns.','My sister and I am taking turns.','The compound subject refers to two people and takes are.'],
 ['each','Each of the lamps ___ a separate switch.','Each of the lamps has a separate switch.','Each of the lamps have a separate switch.','Each of the lamps having a separate switch.','Each is singular, so has agrees even though lamps is plural.'],
 ['birds','The birds on the roof ___ singing now.','The birds on the roof are singing now.','The birds on the roof is singing now.','The birds on the roof am singing now.','Plural birds takes are; the singular roof is only a location.'],
]);
group('literacy.writing_revision.keep-sequence', 'meaning',
 'Preserve the stated order, condition, comparison or cause when changing sentence form.', [
 ['bell','We lined up after the bell rang.','The bell rang, and then we lined up.','We lined up, and then the bell rang.','We lined up before the bell began to ring.','After places the bell first and lining up second.'],
 ['paint','Before adding water, stir the powder.','Stir the powder first, then add water.','Add water first, then stir the powder.','Leave the powder still while adding water.','Before requires stirring to precede adding water.'],
 ['rain','We stayed under the roof because it was raining.','The rain was why we stayed under the roof.','The rain began because we stayed under the roof.','We left the roof even though it was raining.','The rain causes the sheltering; the alternatives reverse cause or change the action.'],
 ['ready','Move the model only after the glue is dry.','Move the model only when the glue is dry.','Move the model while the glue is still wet.','Dry the glue only after moving the model.','Dry glue is the required condition before moving the model.'],
 ['height','The sunflower is taller than the rose bush.','The rose bush is shorter than the sunflower.','The sunflower is shorter than the rose bush.','The two plants are exactly the same height.','Reversing the comparison words preserves which plant is taller.'],
 ['except','Every box except the green one was empty.','The green box was the only box with something inside.','All the boxes, including the green one, were empty.','Only the green box was empty.','Except identifies the green box as the single nonempty box.'],
 ['still','Although the path was muddy, we finished the walk.','We completed the walk even though the path was muddy.','The muddy path stopped us from finishing the walk.','The path became muddy only after we finished walking.','Although preserves finishing despite mud, not failure or a new time relationship.'],
 ['until','Wait beside the gate until the caretaker arrives.','Stay beside the gate while waiting for the caretaker to arrive.','Leave the gate before the caretaker arrives.','Go to the gate only after the caretaker has left.','Until keeps the waiting in place before the caretaker arrives.'],
]);
group('literacy.writing_revision.stronger-word', 'precision',
 'Choose an action word supported by specific manner evidence, rather than another plausible action.', [
 ['rope','The child went up the rope by pulling with both hands and pushing with both feet.','climbed','slid','jumped','Hands and feet pulling upward support climbed; sliding or jumping describes different movement.'],
 ['quiet','To avoid waking the baby, Dad spoke in a very soft voice.','whispered','shouted','sang','A very soft speaking voice supports whispered rather than loud calling or singing.'],
 ['mud','The boot went deep into soft mud under the child’s weight.','sank','bounced','rolled','Moving down into soft material under weight is sinking.'],
 ['thread','She moved the needle through the cloth to make small stitches.','sewed','wove','knitted','Needle stitches through cloth identify sewing; weaving and knitting use different processes.'],
 ['door','The wind shut the door with a sudden loud bang.','slammed','closed gently','opened','The sudden force and bang support slammed; a gentle closure loses that manner and opened reverses it.'],
 ['search','He looked closely through every drawer until he found the missing key.','searched','glanced','ignored','Systematic looking for a missing object is searching, not a brief glance or inattention.'],
 ['liquid','Water came slowly from the loose tap, one small drop at a time.','dripped','gushed','splashed','Separate slow drops identify dripping; gushing and splashing have different movement and amount.'],
 ['paper','She pulled the paper apart along a jagged line using both hands.','tore','folded','smoothed','Pulling apart with a ragged edge is tearing, not bending or flattening.'],
 ['cold','His hands shook in the icy wind, and his teeth began to chatter.','shivered','stretched','waved','Cold shaking and chattering teeth support shivered; the other actions are voluntary movements.'],
]);
export const WRITING_REVISION_READING_CAPACITY = Object.freeze(rows);
