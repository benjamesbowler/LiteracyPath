import { getChildWordAsset } from './childAssets.js';
import { PRESENT_VOCABULARY } from './presentVocabulary.js';

// Two deliberately authored cards per day. These are adult-supported shared
// reading, including familiar oral vocabulary before its spelling is taught.
// Literal picture details below were checked against the current shared art.
// Questions and commands invite a response; they do not claim a pictured action.
const WEEKLY_CARDS = {
  1: [
    ['apple', 'This is an apple.'], ['map', 'This is a map.'],
    ['apple', 'Can you see the apple?'], ['map', 'Find the map.'],
    ['apple', 'Look at the leaf.', 'What part of the apple picture do we find?', ['leaf', 'the leaf']],
    ['map', 'Where is the treasure?', 'What are we looking for on the map?', ['treasure', 'the treasure']],
    ['ant', 'Here is an ant.'], ['sun', 'Here is the sun.'],
    ['apple', 'Point to the apple.'], ['map', 'Show me the map.']
  ],
  2: [
    ['tent', 'This is a tent.'], ['sock', 'Here is a sock.'],
    ['tent', 'Can you find the tent?'], ['sock', 'Look at the sock.'],
    ['tent', 'Where is the tent opening?', 'Which part can we point to?', ['opening', 'the opening', 'the door']],
    ['sock', 'Point to the heel.', 'Which part of the sock do we find?', ['heel', 'the heel']],
    ['apple', 'Here is an apple.'], ['map', 'Here is a map.'],
    ['tent', 'Show me the tent.'], ['sock', 'Can you see the sock?']
  ],
  3: [
    ['nest', 'This is a nest.'], ['igloo', 'This is an igloo.'],
    ['nest', 'Look at the eggs.', 'What is inside the nest?', ['eggs', 'the eggs']],
    ['igloo', 'Can you find the doorway?', 'Which part of the igloo do we find?', ['doorway', 'the doorway', 'opening']],
    ['nest', 'Where are the eggs?', 'Where are the eggs?', ['in the nest', 'nest']],
    ['igloo', 'Point to a snow block.', 'What do we point to?', ['a snow block', 'snow block']],
    ['tent', 'Here is a tent.'], ['sock', 'This is a sock.'],
    ['nest', 'Can you see the nest?'], ['igloo', 'Show me the igloo.']
  ],
  4: [
    ['fan', 'This is a fan.'], ['dog', 'This is a dog.'],
    ['fan', 'Can you find the fan?'], ['dog', 'Look at the ears.', 'What part of the dog do we find?', ['ears', 'the ears']],
    ['fan', 'Point to the middle.', 'Which part of the fan do we point to?', ['middle', 'the middle', 'centre']],
    ['dog', 'Where is the tail?', 'What are we looking for?', ['tail', 'the tail']],
    ['nest', 'Here is a nest.'], ['igloo', 'Here is an igloo.'],
    ['fan', 'Show me the fan.'], ['dog', 'Can you see the paws?', 'What parts can we see?', ['paws', 'the paws']]
  ],
  5: [
    ['octopus', 'This is an octopus.'], ['log', 'This is a log.'],
    ['octopus', 'Can you see the octopus?'], ['log', 'Look at the rings.', 'What marks can we see in the log?', ['rings', 'the rings']],
    ['octopus', 'Point to an arm.', 'What part of the octopus do we find?', ['an arm', 'arm']],
    ['log', 'Can you find the bark?', 'Which outer part of the log do we find?', ['bark', 'the bark']],
    ['fan', 'Here is a fan.'], ['dog', 'Here is a dog.'],
    ['octopus', 'Show me the octopus.'], ['log', 'Point to the log.']
  ],
  6: [
    ['rug', 'This is a rug.'], ['hen', 'This is a hen.'],
    ['rug', 'Look at the pattern.', 'What can we see on the rug?', ['pattern', 'the pattern']],
    ['hen', 'Can you find the beak?', 'What part of the hen do we find?', ['beak', 'the beak']],
    ['rug', 'Point to the rolled end.', 'Which part of the rug do we point to?', ['rolled end', 'the rolled end']],
    ['hen', 'Where are the feathers?', 'What covers the hen?', ['feathers', 'the feathers']],
    ['octopus', 'Here is an octopus.'], ['log', 'Here is a log.'],
    ['rug', 'Can you see the rug?'], ['hen', 'Show me the hen.']
  ],
  7: [
    ['mouse', 'This is a mouse.'], ['lamp', 'This is a lamp.'],
    ['mouse', 'Look at the whiskers.', 'What do we see beside the nose?', ['whiskers', 'the whiskers']],
    ['lamp', 'Can you find the shade?', 'Which part of the lamp do we find?', ['shade', 'the shade']],
    ['mouse', 'Where is the tail?', 'What part are we looking for?', ['tail', 'the tail']],
    ['lamp', 'Point to the base.', 'Which part of the lamp do we point to?', ['base', 'the base', 'bottom']],
    ['rug', 'Here is a rug.'], ['hen', 'Here is a hen.'],
    ['mouse', 'Can you see the mouse?'], ['lamp', 'Show me the lamp.']
  ],
  8: [
    ['bag', 'This is a bag.'], ['web', 'This is a web.'],
    ['bag', 'Can you see the handles?', 'What parts do we see on the bag?', ['handles', 'the handles']],
    ['web', 'Look at the spider.', 'What animal is beside the web?', ['spider', 'the spider']],
    ['bag', 'Point to the bag.'], ['web', 'Where are the threads?', 'What makes up the web?', ['threads', 'the threads']],
    ['mouse', 'Here is a mouse.'], ['lamp', 'Here is a lamp.'],
    ['bag', 'Show me the handles.', 'What parts of the bag do we show?', ['handles', 'the handles']],
    ['web', 'Can you find the web?']
  ],
  9: [
    ['quilt', 'This is a quilt.'], ['umbrella', 'This is an umbrella.'],
    ['quilt', 'Look at the squares.', 'What shapes can we see on the quilt?', ['squares', 'the squares']],
    ['umbrella', 'Can you find the handle?', 'Which part of the umbrella do we find?', ['handle', 'the handle']],
    ['quilt', 'Point to a star.', 'What shape do we find on the quilt?', ['star', 'a star']],
    ['umbrella', 'Where is the curved handle?', 'Which part are we looking for?', ['handle', 'the curved handle']],
    ['bag', 'Here is a bag.'], ['web', 'Here is a web.'],
    ['quilt', 'Can you see the quilt?'], ['umbrella', 'Show me the umbrella.']
  ],
  10: [
    ['cup', 'This is a cup.'], ['goat', 'This is a goat.'],
    ['cup', 'Can you find the handle?', 'Which part of the cup do we find?', ['handle', 'the handle']],
    ['goat', 'Look at the horns.', 'What parts are on the goat\'s head?', ['horns', 'the horns']],
    ['cup', 'Point to the cup.'], ['goat', 'Where are the hooves?', 'What parts are at the ends of the legs?', ['hooves', 'the hooves']],
    ['quilt', 'Here is a quilt.'], ['umbrella', 'Here is an umbrella.'],
    ['cup', 'Show me the cup.'], ['goat', 'Can you see the goat?']
  ],
  11: [
    ['pan', 'This is a pan.'], ['box', 'This is a box.'],
    ['pan', 'Look at the handle.', 'What part sticks out from the pan?', ['handle', 'the handle']],
    ['box', 'Can you see the corners?', 'What parts of the box do we find?', ['corners', 'the corners']],
    ['pan', 'Point to the pan.'], ['box', 'Where is the top?', 'Which part of the box do we find?', ['top', 'the top']],
    ['cup', 'Here is a cup.'], ['goat', 'Here is a goat.'],
    ['pan', 'Can you find the pan?'], ['box', 'Show me the box.']
  ],
  12: [
    ['egg', 'This is an egg.'], ['vest', 'This is a vest.'],
    ['egg', 'Can you see the egg?'], ['vest', 'Look at the stripes.', 'What can we see across the vest?', ['stripes', 'the stripes']],
    ['egg', 'Point to the shell.', 'What is the outside of the egg called?', ['shell', 'the shell']],
    ['vest', 'Where are the armholes?', 'Which openings do we find in the vest?', ['armholes', 'the armholes']],
    ['pan', 'Here is a pan.'], ['box', 'Here is a box.'],
    ['egg', 'Show me the egg.'], ['vest', 'Can you find the vest?']
  ],
  13: [
    ['kite', 'This is a kite.'], ['jug', 'This is a jug.'],
    ['kite', 'Look at the tail.', 'Which part hangs below the kite?', ['tail', 'the tail']],
    ['jug', 'Can you find the handle?', 'Which part of the jug do we find?', ['handle', 'the handle']],
    ['kite', 'Point to a bow.', 'What can we find on the kite\'s tail?', ['bow', 'a bow']],
    ['jug', 'Where is the spout?', 'Which part can we pour from?', ['spout', 'the spout']],
    ['egg', 'Here is an egg.'], ['vest', 'Here is a vest.'],
    ['kite', 'Can you see the kite?'], ['jug', 'Show me the jug.']
  ],
  14: [
    ['van', 'This is a van.'], ['kite', 'Here is the kite.'],
    ['van', 'Can you see the wheels?', 'What round parts are below the van?', ['wheels', 'the wheels']],
    ['jump', 'Look at the boy jumping.', 'What is the boy doing?', ['jumping', 'a jump']],
    ['van', 'Point to the windows.', 'What parts of the van do we find?', ['windows', 'the windows']],
    ['jump', 'Are his feet off the ground?', 'Are the boy\'s feet off the ground?', ['yes', 'yes, they are']],
    ['jug', 'Here is the jug.'], ['sock', 'Here is the sock.'],
    ['van', 'Show me the van.'], ['jump', 'Find the raised hands.', 'What parts of the boy do we find?', ['hands', 'the raised hands']]
  ],
  15: [
    ['shell', 'This is a shell.'], ['chair', 'This is a chair.'],
    ['shell', 'Can you see the spiral?', 'What curved pattern do we see?', ['spiral', 'the spiral']],
    ['chair', 'Look at the seat.', 'Which part of the chair do we find?', ['seat', 'the seat']],
    ['shell', 'Point to the shell.'], ['chair', 'Where are the arms?', 'Which parts are beside the seat?', ['arms', 'the arms']],
    ['van', 'Here is a van.'], ['lamp', 'Here is the lamp.'],
    ['shell', 'Show me the spiral.', 'What pattern do we show?', ['spiral', 'the spiral']],
    ['chair', 'Can you find the chair?']
  ],
  16: [
    ['ball', 'This is a ball.'], ['chair', 'Here is the chair.'],
    ['ball', 'Can you see the ball?'], ['call', 'Look at the phone.', 'What is beside the boy\'s ear?', ['phone', 'the phone']],
    ['ball', 'Point to the blue stripe.', 'What do we point to on the ball?', ['blue stripe', 'the blue stripe']],
    ['call', 'Where is the phone?', 'Where is the phone in the picture?', ['by his ear', 'beside his ear', 'in his hand']],
    ['shell', 'Here is a shell.'], ['van', 'Here is the van.'],
    ['ball', 'Show me the ball.'], ['call', 'Can you find the boy?', 'Who can we find in the picture?', ['boy', 'the boy']]
  ],
  17: [
    ['ink', 'This is ink.'], ['pig', 'This is a pig.'],
    ['ink', 'Look at the feather.', 'What is standing in the ink?', ['feather', 'the feather']],
    ['pig', 'Can you find the snout?', 'What part of the pig do we find?', ['snout', 'the snout']],
    ['ink', 'Point to the bottle.', 'What holds the ink?', ['bottle', 'the bottle']],
    ['pig', 'Where is the curly tail?', 'What part of the pig is curled?', ['tail', 'the tail']],
    ['ball', 'Here is a ball.'], ['chair', 'See this chair.'],
    ['ink', 'Can you see the ink?'], ['pig', 'Show me the pig.']
  ],
  18: [
    ['ox', 'This is an ox.'], ['pot', 'This is a pot.'],
    ['ox', 'Can you find the horns?', 'What parts of the ox do we find?', ['horns', 'the horns']],
    ['pot', 'Look at the lid.', 'What covers the top of the pot?', ['lid', 'the lid']],
    ['ox', 'Point to the hooves.', 'What parts are at the ends of the legs?', ['hooves', 'the hooves']],
    ['pot', 'Where are the handles?', 'What parts are beside the pot?', ['handles', 'the handles']],
    ['ink', 'Here is some ink.'], ['pig', 'Here is a pig.'],
    ['ox', 'Show me the ox.'], ['pot', 'Can you see the pot?']
  ],
  19: [
    ['sun', 'This is the sun.'], ['pot', 'Here is the pot.'],
    ['sun', 'Can you see the sun?'], ['under', 'The cat is under the table.', 'Where is the cat?', ['under the table', 'below the table']],
    ['sun', 'Point to a ray.', 'What part of the sun picture do we find?', ['ray', 'a ray']],
    ['under', 'What is above the cat?', 'What is above the cat?', ['table', 'the table']],
    ['ox', 'Here is an ox.'], ['pig', 'Here is the pig.'],
    ['sun', 'Show me the sun.'], ['under', 'Find the cat under the table.', 'Where do we find the cat?', ['under the table', 'below the table']]
  ],
  20: [
    ['net', 'This is a net.'], ['elephant', 'This is an elephant.'],
    ['net', 'Look at the handle.', 'What long part of the net do we find?', ['handle', 'the handle']],
    ['elephant', 'Can you find the trunk?', 'What part of the elephant do we find?', ['trunk', 'the trunk']],
    ['net', 'Point to the mesh.', 'Which part has little spaces?', ['mesh', 'the mesh']],
    ['elephant', 'Where are the ears?', 'What parts of the elephant do we find?', ['ears', 'the ears']],
    ['sun', 'Here is the sun again.'], ['pot', 'Look, here is a pot.'],
    ['net', 'Can you see the net?'], ['elephant', 'Show me the elephant.']
  ],
  21: [
    ['whale', 'This is a whale.'], ['wheel', 'This is a wheel.'],
    ['whale', 'Can you find the tail?', 'What part of the whale do we find?', ['tail', 'the tail']],
    ['wheel', 'Look at the spokes.', 'What parts connect the middle to the rim?', ['spokes', 'the spokes']],
    ['whale', 'Point to the flipper.', 'What part of the whale do we point to?', ['flipper', 'the flipper']],
    ['wheel', 'Where is the middle?', 'Which part of the wheel do we find?', ['middle', 'the middle', 'centre']],
    ['net', 'Here is a net.'], ['elephant', 'Here is an elephant.'],
    ['whale', 'Show me the whale.'], ['wheel', 'Can you see the wheel?']
  ],
  22: [
    ['sink', 'This is a sink.'], ['wheel', 'Here is the wheel.'],
    ['sink', 'Can you find the tap?', 'What part is above the sink?', ['tap', 'the tap', 'faucet']],
    ['pink', 'The paint is pink.', 'What colour is the paint?', ['pink']],
    ['sink', 'Point to the drain.', 'Which part is at the bottom of the sink?', ['drain', 'the drain']],
    ['pink', 'Where is the paintbrush?', 'What tool is the child holding?', ['paintbrush', 'the paintbrush', 'brush']],
    ['whale', 'Here is a whale.'], ['net', 'Here is the net.'],
    ['sink', 'Show me the sink.'], ['pink', 'Find the pink paint.', 'What colour paint do we find?', ['pink', 'pink paint']]
  ],
  23: [
    ['ring', 'This is a ring.'], ['sink', 'Here is the sink.'],
    ['ring', 'Look at the blue stone.', 'What colour is the stone?', ['blue']],
    ['sing', 'The girl is singing.', 'What is the girl doing?', ['singing', 'singing a song']],
    ['ring', 'Can you see the ring?'], ['sing', 'Where is the microphone?', 'What is the girl holding?', ['microphone', 'the microphone']],
    ['wheel', 'See this wheel.'], ['whale', 'Here is the whale.'],
    ['ring', 'Show me the ring.'], ['sing', 'Point to a music note.', 'What symbol do we find by the singer?', ['music note', 'a music note', 'note']]
  ],
  24: [
    ['bell', 'This is a bell.'], ['dress', 'This is a dress.'],
    ['bell', 'Can you see the bell?'], ['dress', 'Look at the buttons.', 'What parts go down the front of the dress?', ['buttons', 'the buttons']],
    ['bell', 'Point to the red loop.', 'What coloured part is above the bell?', ['red loop', 'the red loop']],
    ['dress', 'Where is the collar?', 'What part is at the top of the dress?', ['collar', 'the collar']],
    ['ring', 'Here is a ring.'], ['sink', 'Look, here is the sink.'],
    ['bell', 'Show me the bell.'], ['dress', 'Can you find the dress?']
  ],
  25: [
    ['bell', 'Here is the bell.'], ['dress', 'Here is a dress.'],
    ['day', 'Look at the sun outside.', 'What is outside the window?', ['sun', 'the sun']],
    ['stay', 'The dog is beside the boy.', 'Where is the dog?', ['beside the boy', 'by the boy']],
    ['day', 'Can you find the window?', 'What part of the room do we find?', ['window', 'the window']],
    ['stay', 'Point to the seated dog.', 'Which animal do we point to?', ['dog', 'the seated dog']],
    ['ring', 'Here is the ring.'], ['chair', 'Look, here is a chair.'],
    ['day', 'Show me the sun.', 'What do we show outside the window?', ['sun', 'the sun']],
    ['stay', 'Where is the boy?', 'Who is beside the dog?', ['boy', 'the boy']]
  ],
  26: [
    ['pig', 'Look, here is a pig.'], ['dress', 'Here is the dress.'],
    ['cry', 'The child has tears.', 'What can we see on the child\'s face?', ['tears', 'the tears']],
    ['shy', 'Look at the book.', 'What is the child holding?', ['book', 'the book']],
    ['cry', 'Can you find the tears?', 'What can we find on the child\'s face?', ['tears', 'the tears']],
    ['shy', 'Where is the child with a book?', 'Who has the book?', ['child', 'the child with a book']],
    ['bell', 'Look, here is a bell.'], ['ring', 'Look, here is a ring.'],
    ['cry', 'Point to a tear.', 'What do we point to on the face?', ['tear', 'a tear']],
    ['shy', 'Show me the book.', 'What is the child holding?', ['book', 'the book']]
  ],
  27: [
    ['wheel', 'Look, here is a wheel.'], ['bell', 'See this bell.'],
    ['song', 'The girl sings a song.', 'What does the girl sing?', ['a song', 'song']],
    ['long', 'Look at the long snake.', 'What animal is long?', ['snake', 'the snake']],
    ['song', 'Can you find the microphone?', 'What is beside the singer\'s mouth?', ['microphone', 'the microphone']],
    ['long', 'Where is the snake\'s tail?', 'What part is at the end of the snake?', ['tail', 'the tail']],
    ['dress', 'Look, here is a dress.'], ['pig', 'See this pig.'],
    ['song', 'Point to a music note.', 'What symbol is beside the singer?', ['music note', 'a music note', 'note']],
    ['long', 'Show me the snake.', 'What animal do we show?', ['snake', 'the snake']]
  ]
};

const ART_SCENES = {
  apple: 'One red apple with a visible green leaf.',
  map: 'An illustrated treasure map with places and treasure marks.',
  ant: 'One recognisable ant.', sun: 'One sun with visible rays.',
  tent: 'A green tent with a visible front opening.',
  sock: 'One sock with a distinct heel.',
  nest: 'A woven bird nest containing eggs.',
  igloo: 'A domed igloo with snow blocks and a doorway.',
  fan: 'An electric fan with its middle visible.',
  dog: 'A seated dog with ears, paws and a tail visible.',
  octopus: 'An octopus with recognisable arms; no arm-count claim.',
  log: 'A cut log with bark and rings visible on the end.',
  rug: 'A patterned rug with one rolled end.',
  hen: 'A hen with feathers and a visible beak.',
  mouse: 'A mouse with visible whiskers and a tail.',
  lamp: 'A lamp with a shade and base.',
  bag: 'A bag with two visible handles.',
  web: 'A spider beside its visible threaded web.',
  quilt: 'A patchwork quilt with squares and stars.',
  umbrella: 'An umbrella with a curved handle.',
  cup: 'A cup with a visible handle.',
  goat: 'A goat with visible horns and hooves.',
  pan: 'A pan with a long handle.', box: 'A box with a visible top and corners.',
  egg: 'An intact egg with its outer shell visible.',
  vest: 'A sleeveless vest with stripes and armholes.',
  kite: 'A kite with bows on its trailing tail; no flying-action claim.',
  jug: 'A jug with a visible handle and pouring spout.',
  van: 'A van with windows and wheels.',
  jump: 'A boy jumping with feet airborne and hands raised.',
  shell: 'A spiral shell.', chair: 'An armchair with a seat and arms.',
  ball: 'A ball with a blue stripe; no rolling-action claim.',
  call: 'A boy holding a phone beside his ear.',
  ink: 'A bottle of ink containing a feather quill.',
  pig: 'A pig with a snout and curly tail.',
  ox: 'An ox with horns and hooves.', pot: 'A cooking pot with a lid and handles.',
  under: 'A cat below the tabletop, between the table legs.',
  net: 'A net with a handle and open mesh.',
  elephant: 'An elephant with a trunk and ears visible.',
  whale: 'A whale with a visible flipper and tail.',
  wheel: 'A wheel with a middle, rim and spokes; no turning-action claim.',
  sink: 'A sink with a tap and drain.',
  pink: 'A child holding a brush beside visibly pink paint.',
  ring: 'A ring with a blue stone.',
  sing: 'A girl singing into a microphone with musical notes beside her.',
  bell: 'A bell with a red hanging loop; no sound claim.',
  dress: 'A dress with buttons and a collar.',
  day: 'A bedroom with a window and the sun visible outside.',
  stay: 'A dog seated beside a boy; no duration or obedience claim.',
  cry: 'A child with visible tears on the cheeks.',
  shy: 'A child holding a book in a classroom; appearance does not establish a feeling.',
  song: 'A girl singing into a microphone with musical notes beside her.',
  long: 'A snake with its full long winding body and tail visible.'
};
const vocabulary = Object.fromEntries(Object.values(PRESENT_VOCABULARY).flat().map(card => [card.word, card]));
const detectiveIndices = new Set([0, 1, 6, 7]);
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
// These use exact sentences already in the narration corpus, on the same
// pictured referent. A contrast changes one visibly checkable detail. No sound,
// unseen action, internal feeling or imagined off-picture event supplies the key.
const DETECTIVE_DETAILS = {
  '3:0': ['Look at the eggs.', 'Look at the stones.', 'contents'],
  '4:1': ['Look at the ears.', 'Look at the horns.', 'body-part'],
  '5:1': ['Look at the rings.', 'Look at the wheels.', 'visible-detail'],
  '6:0': ['Look at the pattern.', 'Look at the feathers.', 'visible-detail'],
  '7:1': ['Point to the base.', 'Point to the beak.', 'object-part'],
  '8:0': ['Show me the handles.', 'Show me the wheels.', 'object-part'],
  '9:0': ['Point to a star.', 'Point to a heart.', 'pattern'],
  '10:1': ['Look at the horns.', 'Look at the feathers.', 'body-part'],
  '11:0': ['Look at the handle.', 'Look at the beak.', 'object-part'],
  '12:0': ['An egg has a shell.', 'An egg has fur.', 'covering'],
  '12:1': ['This vest has no sleeves.', 'This vest has long sleeves.', 'clothing-part'],
  '13:0': ['Look at the tail.', 'Look at the legs.', 'object-part'],
  '14:0': ['A van has wheels.', 'A van has wings.', 'vehicle-part'],
  '15:1': ['Look at the seat.', 'Look at the trunk.', 'object-part'],
  '16:0': ['Point to the blue stripe.', 'Point to the green stripe.', 'colour'],
  '17:0': ['Look at the feather.', 'Look at the leaf.', 'visible-detail'],
  '17:1': ['Look at the ears.', 'Look at the horns.', 'body-part'],
  '18:0': ['Look at the horns.', 'Look at the feathers.', 'body-part'],
  '18:1': ['Look at the lid.', 'Look at the spout.', 'object-part'],
  '19:0': ['Point to a ray.', 'Point to a stem.', 'visible-detail'],
  '20:0': ['Point to the mesh.', 'Point to the bark.', 'material'],
  '20:1': ['An elephant has a trunk.', 'An elephant has a beak.', 'body-part'],
  '21:0': ['Point to the flipper.', 'Point to the ears.', 'body-part'],
  '21:1': ['Look at the spokes.', 'Look at the feathers.', 'object-part'],
  '22:0': ['Point to the drain.', 'Point to the feather.', 'object-part'],
  '23:0': ['Look at the blue stone.', 'Look at the red stone.', 'colour'],
  '24:0': ['Point to the red loop.', 'Point to the blue loop.', 'colour'],
  '24:1': ['Look at the buttons.', 'Look at the wheels.', 'clothing-part'],
  '25:1': ['Look at the buttons.', 'Look at the wheels.', 'clothing-part'],
  '26:7': ['Look at the blue stone.', 'Look at the green stone.', 'colour'],
  '27:0': ['Look at the spokes.', 'Look at the feathers.', 'object-part'],
  '27:1': ['Point to the red loop.', 'Point to the blue loop.', 'colour']
};

export const PRESENT_DAILY_READING = Object.fromEntries(Object.entries(WEEKLY_CARDS).map(([cycle, rows]) => [cycle,
  rows.map(([word, sentence, meaningPrompt = 'What does this sentence help us notice?', acceptedResponses = [word]], index) => {
    const imagePath = vocabulary[word]?.imagePath || getChildWordAsset(word)?.image || '';
    const card = {
      id: `present-daily-c${cycle}-${index + 1}`, word, sentence, imagePath,
      imageRole: 'shared-reading-evidence',
      sceneRequirements: `${ART_SCENES[word]} Caption: “${sentence}” Questions and commands invite looking; they do not assert an unseen action or feeling.`,
      meaningPrompt, acceptedResponses,
      readingPurpose: 'supported-shared-reading', childReadingClaim: false
    };
    if (detectiveIndices.has(index)) {
      // Only concrete identity/reference captions enter this game. The wrong
      // noun names a visibly absent, dissimilar object, never an unseen feeling.
      const wrongWord = word === 'dog' ? 'lamp' : 'dog';
      const noun = word === 'ink' ? 'ink' : word;
      const pattern = new RegExp(`\\b${noun}\\b`, 'i');
      let wrongSentence = word === 'ink' ? 'This is a dog.' : sentence.replace(pattern, wrongWord);
      wrongSentence = wrongSentence.replace(/\ban dog\b/g, 'a dog').replace(/\bsome dog\b/g, 'a dog');
      const detail = DETECTIVE_DETAILS[`${cycle}:${index}`];
      card.detectiveSource = detail
        ? { correctSentence: detail[0], wrongSentence: detail[1], contrastKind: detail[2] }
        : { correctSentence: sentence, wrongSentence, contrastKind: 'referent' };
    }
    return card;
  })
]));

function dayIndex(day) {
  const index = DAYS.indexOf(String(day).toLowerCase());
  if (index < 0) throw new RangeError(`Unknown Present teaching day: ${day}`);
  return index;
}

export function dailyPresentReading(cycleNumber, day) {
  const cards = PRESENT_DAILY_READING[cycleNumber];
  if (!cards) throw new RangeError(`Unknown Present cycle: ${cycleNumber}`);
  const start = dayIndex(day) * 2;
  return cards.slice(start, start + 2);
}

export function presentGameSchedule(cycleNumber, day) {
  if (!PRESENT_DAILY_READING[cycleNumber]) throw new RangeError(`Unknown Present cycle: ${cycleNumber}`);
  return [
    ['detective'], ['scramble'], ['missing'], ['detective'],
    ['scramble', Number(cycleNumber) % 2 === 0 ? 'pairs' : 'missing']
  ][dayIndex(day)];
}
