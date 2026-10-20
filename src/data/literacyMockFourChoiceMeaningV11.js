import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { getLiteracyMockAudioV11Path } from './literacyMockAudioV11.js';

const FILE = 'src/data/literacyMockFourChoiceMeaningV11.js';
const MEANING_AREAS = new Set(['vocabulary', 'language', 'writing', 'reading', 'listening']);
const relationClaims = new Set(['antonym_concrete', 'antonym_picture', 'synonym_concrete', 'synonym_picture']);
const copy = value => JSON.parse(JSON.stringify(value));
const norm = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

// These are authored replacements, not a lexicon filter that silently drops
// difficult tiers. In each row the key comes first, followed by three named
// misconceptions. The existing exposure identity is retained conservatively.
const OPPOSITES = {
  hot: ['cold', 'warm', 'red', 'dry'], big: ['small', 'tall', 'wide', 'long'], up: ['down', 'over', 'top', 'high'],
  wet: ['dry', 'cold', 'muddy', 'warm'], full: ['empty', 'heavy', 'round', 'big'], wide: ['narrow', 'long', 'deep', 'thick'],
  awake: ['asleep', 'happy', 'busy', 'tired'], night: ['day', 'dark', 'moon', 'bed'], new: ['old', 'clean', 'shiny', 'small'],
  open: ['shut', 'wide', 'empty', 'big'], clean: ['dirty', 'soft', 'wet', 'fresh'], tall: ['short', 'high', 'long', 'big'],
  push: ['pull', 'press', 'lift', 'hold'], fast: ['slow', 'quick', 'early', 'first'], soft: ['hard', 'warm', 'light', 'smooth'],
  smooth: ['rough', 'flat', 'wet', 'round'], empty: ['full', 'small', 'light', 'open'],
  lend: ['borrow', 'give', 'share', 'carry'], grow: ['get smaller', 'plant', 'water', 'feed'], go: ['stop', 'walk', 'run', 'move'],
  give: ['take', 'share', 'hold', 'carry'], win: ['lose', 'play', 'try', 'score'],
  forward: ['back', 'ahead', 'near', 'past'], come: ['go', 'walk', 'run', 'reach'], more: ['less', 'many', 'lots', 'some'],
  in: ['out', 'inside', 'under', 'near'], yes: ['no', 'please', 'hello', 'thanks'], on: ['off', 'over', 'above', 'near'],
  together: ['apart', 'near', 'close', 'beside'], bend: ['straighten', 'turn', 'twist', 'fold'],
  weak: ['strong', 'thin', 'small', 'soft'], dark: ['light', 'black', 'grey', 'night'], slowly: ['quickly', 'gently', 'quietly', 'carefully'],
  kind: ['mean', 'nice', 'helpful', 'good'], always: ['never', 'often', 'again', 'daily'], careful: ['careless', 'safe', 'slow', 'gentle'],
  now: ['later', 'here', 'today', 'soon'],
};
const SYNONYMS = {
  happy: ['glad', 'sad', 'angry', 'tired'], shout: ['yell', 'sing', 'talk', 'whisper'], little: ['small', 'big', 'wide', 'long'],
  begin: ['start', 'stop', 'end', 'wait'], cross: ['angry', 'calm', 'sad', 'happy'], wet: ['damp', 'dry', 'cold', 'muddy'],
  bright: ['light', 'dark', 'cold', 'quiet'], hard: ['firm', 'soft', 'rough', 'smooth'], cold: ['chilly', 'hot', 'warm', 'dry'],
  scared: ['afraid', 'angry', 'brave', 'lonely'], quick: ['fast', 'slow', 'early', 'late'], sleepy: ['tired', 'awake', 'calm', 'hungry'],
  near: ['close', 'far', 'above', 'behind'], strong: ['tough', 'weak', 'thick', 'heavy'], close: ['shut', 'open', 'turn', 'lift'],
  ill: ['sick', 'well', 'tired', 'hungry'], shut: ['close', 'open', 'lock', 'pull'],
  speak: ['talk', 'listen', 'write', 'read'], tug: ['pull', 'push', 'lift', 'drop'], neat: ['tidy', 'messy', 'empty', 'full'],
  shy: ['timid', 'bold', 'loud', 'angry'], easy: ['simple', 'hard', 'quick', 'short'], end: ['finish', 'begin', 'wait', 'play'],
  gift: ['present', 'box', 'paper', 'card'], friend: ['pal', 'teacher', 'stranger', 'child'],
  home: ['house', 'school', 'shop', 'park'], funny: ['silly', 'sad', 'angry', 'scary'],
  jump: ['leap', 'sit', 'walk', 'run'], see: ['look', 'hear', 'smell', 'feel'],
  empty: ['bare', 'full', 'quiet', 'small'], big: ['large', 'small', 'wide', 'long'], tired: ['sleepy', 'rested', 'hungry', 'busy'],
  sad: ['unhappy', 'glad', 'sleepy', 'angry'], shining: ['bright', 'dark', 'dull', 'pale'], dry: ['not wet', 'very cold', 'quite sore', 'a bit hot'],
  small: ['little', 'wide', 'long', 'big'],
};
// Difficult predecessor targets are rewritten as familiar meaning contrasts;
// this is a content repair at the existing band, never a new "harder" item.
const RELATION_TARGET_REPAIRS = {
  expand: 'grow', advance: 'forward', arrive: 'come', increase: 'more', include: 'in', accept: 'yes', attach: 'on',
  permit: 'yes', gather: 'together', flexible: 'bend', fragile: 'weak', opaque: 'dark', gradual: 'slowly',
  generous: 'kind', frequent: 'always', cautious: 'careful', temporary: 'now',
  reluctant: 'scared', rapid: 'quick', assist: 'end', scarce: 'small', ordinary: 'easy', fortunate: 'happy', timid: 'scared',
  vacant: 'empty', sturdy: 'strong', weary: 'tired', soaked: 'wet', glum: 'sad', gleaming: 'shining', parched: 'dry', cramped: 'small',
};
const SYNONYM_TARGET_REPAIRS = { shy:'scared', cautious: 'neat', permit: 'gift', fragile: 'easy', reluctant: 'scared' };

const EXTRA_BY_KEY = new Map([
  ['The pond path was built last spring.', ['Pond plants give small animals places to hide.', 'Describes how pond plants shelter animals, which is the paragraph topic.']],
  ['The flour is kept in a blue cupboard.', ['Mix flour and water.', 'Gives a dough-making step that belongs with the other instructions.']],
  ['Most town buses are painted red.', ['Wait for people to get off before stepping on.', 'Gives another bus-travel instruction rather than an unrelated colour fact.']],
  ['The shelter was beside our favourite climbing tree.', ['We laid large leaves across the roof.', 'Explains building the waterproof shelter, which is the paragraph topic.']],
  ['The pot had a picture of a bean on it.', ['The stem grew two more leaves.', 'Describes plant growth rather than decoration on its container.']],
  ['The tent was a present from our cousins.', ['We checked that the patch covered the tear.', 'Gives another repair step rather than the tent’s history.']],
  ['The trader wore a green apron.', ['Coins clinked as a customer paid.', 'Names another market sound rather than a visible colour.']],
  ['Our brushes have wooden handles.', ['Shake the water gently from the clean brush.', 'Explains brush cleaning rather than the materials in a handle.']],
  ['One leaf came from beside the school gate.', ['Some leaf edges had tiny teeth.', 'Describes leaf edges rather than where a leaf was collected.']],
  ['The puppet plays a fox in our show.', ['A loose arm needs a few stitches.', 'Names another puppet repair rather than the puppet’s story role.']],
  ['The puppy sleeps.', ['The puppy under the chair.', 'Names the puppy and a place but has no finite verb telling what the puppy does.']],
  ['The rain stopped.', ['The rain over the garden.', 'Names the rain and a place but gives no complete action or statement.']],
  ['The bell rang.', ['The bell above the door.', 'Names a bell and a place without a complete predicate.']],
  ['Leaves covered the path.', ['The leaves beside the wall.', 'Names leaves and a place without telling a complete thought.']],
  ['A fish splashed.', ['A fish with silver scales.', 'Names and describes a fish without a complete predicate.']],
  ['Our bus arrived.', ['Our bus beside the school.', 'Names the bus and a place without stating a complete thought.']],
  ['The rope snapped.', ['The rope across the stream.', 'Names the rope and a place without a complete predicate.']],
  ['Stars shone above us.', ['The stars above the roof.', 'Names the stars and a place without a complete predicate.']],
  ['The basket full of apples fell over.', ['The apples in the basket.', 'Names apples and their location without a complete predicate.']],
  ['While I held the ladder, Dad climbed up.', ['While Dad climbed the ladder.', 'An opening while-clause still needs a main clause to finish the thought.']],
  ['We waited until the gate opened.', ['Until we could go through the gate.', 'An opening until-clause does not supply an independent main clause.']],
  ['careless', ['carefully', 'Names a careful manner; the passage says Rae acted without care.']],
  ['reusable', ['reusing', 'Names an ongoing use rather than the bag’s ability to be used again.']],
  ['unlocked', ['locked', 'Keeps the locked state instead of reversing it with un-.']],
  ['reheated', ['heating', 'Names heating without the again meaning supplied by re-.']],
  ['thankful', ['unthankful', 'Reverses the grateful meaning that the described response requires.']],
  ['restless', ['resting', 'Describes resting rather than being unable to stay at rest.']],
  ['misread', ['reading', 'Names reading without the wrong meaning supplied by mis-.']],
  ['washable', ['unwashed', 'Says it has not been washed, not that it can be washed.']],
  ['kindness', ['unkind', 'Names the opposite quality and does not name the helpful act as a noun.']],
  ['refilled', ['filling', 'Does not express filling again after the container was emptied.']],
  ['miscounted', ['counting', 'Does not express the wrong result required by mis-.']],
  ['unpacked', ['packing', 'Describes putting things in rather than taking them out.']],
  ['unfastened', ['fastening', 'Describes doing up the fastening rather than undoing it.']],
  ['harmless', ['harming', 'Describes causing harm rather than causing no harm.']],
  ['colourless', ['colouring', 'Names adding colour rather than having no colour.']],
  ['unfair', ['fairest', 'Names the most fair rather than the unfair treatment described.']],
  ['disconnected', ['connecting', 'Names joining rather than the separated state described.']],
  ['in the lockers', ['beside the front desk', 'Chooses a believable museum location that the passage does not give for the bags.']],
  ['above the hall entrance', ['beside the hall entrance', 'Keeps the correct entrance but changes the stated above relationship.']],
  ['on the porch', ['under the stairs', 'Chooses a believable place for boots that is not their stated location.']],
  ['on the wire rack', ['inside the cupboard', 'Chooses a kitchen location that is not the cake’s stated resting place.']],
  ['inside Noor’s bag', ['beside Noor’s bag', 'Keeps the named bag but changes inside to beside.']],
  ['inside the cups', ['beside the cups', 'Keeps the named cups but changes the stated inside relationship.']],
  ['on a tray', ['under a tray', 'Keeps the named tray but reverses the stated on relationship.']],
  ['inside the drawer', ['beneath the desk', 'Chooses another storage place without the passage’s drawer detail.']],
  ['behind the curtain', ['in front of the curtain', 'Uses the correct curtain but reverses its relation to the mask.']],
  ['beside the clock', ['below the clock', 'Keeps the clock but substitutes below for beside.']],
  ['under the carpet', ['on top of the carpet', 'Keeps the carpet but reverses the hidden under relationship.']],
  ['inside a tall vase', ['beside a tall vase', 'Keeps the correct vase but changes inside to beside.']],
  ['above the shoe rack', ['beside the shoe rack', 'Keeps the rack but changes the stated above relationship.']],
  ['by the fence', ['beside the goal', 'Names another sports-area location that was not stated for the cones.']],
  ['inside the jacket pocket', ['outside the jacket pocket', 'Keeps the jacket pocket but reverses inside and outside.']],
  ['Noor', ['Mina', 'Substitutes another child for the person named as doing this action.']],
  ['Gran', ['Grandad', 'Substitutes another family member for the person named as doing this action.']],
  ['Sam', ['Ben', 'Substitutes another child for the person named as doing this action.']],
  ['Ada', ['Mina', 'Substitutes another child for the person named as doing this action.']],
  ['the keeper', ['the vet', 'Chooses another animal-care role rather than the person named in the passage.']],
  ['the teacher', ['the helper', 'Chooses another classroom adult rather than the person named in the passage.']],
  ['Dad', ['Gran', 'Substitutes another family member for the person named as doing this action.']],
  ['Grandad', ['Mum', 'Substitutes another family member for the person named as doing this action.']],
  ['the librarian', ['the cleaner', 'Chooses another school worker rather than the person named in the passage.']],
  ['Rina', ['Noor', 'Substitutes another child for the person named as carrying the tray.']],
  ['the gardener', ['the driver', 'Chooses another worker rather than the person named as lifting the stone.']],
  ['my brother', ['my aunt', 'Substitutes another family member for the person named as counting the buttons.']],
  ['the caretaker', ['the teacher', 'Chooses another school adult rather than the person named as opening the gate.']],
  ['a visitor', ['a parent', 'Substitutes another person for the visitor who returned the mitten.']],
  ['the goalkeeper', ['the captain', 'Chooses another football role rather than the person named as collecting the bibs.']],
  ['the note', ['the ticket', 'Chooses another flat paper object but the passage specifically names the note.']],
  ['a bucket', ['a bowl', 'Chooses another container but the passage specifically names a bucket.']],
  ['purple fabric', ['blue cloth', 'Keeps the kind of stage covering but changes the stated purple colour.']],
  ['the photograph', ['the letter', 'Chooses another paper item but the passage specifically names the photograph.']],
  ['seeds', ['sugar', 'Chooses another possible loaf topping but the passage specifically names seeds.']],
  ['a camera', ['a mask', 'Chooses another diving item but the passage specifically names a camera.']],
  ['Mira’s paintbrushes', ['Mira’s crayons', 'Chooses other drawing tools but the passage specifically names paintbrushes.']],
  ['a blanket', ['a scarf', 'Chooses another fabric wrapping but the passage specifically names a blanket.']],
]);

const CONTEXT_FOILS = {
  bank: 'a deep part of a river', bark: 'a tree’s fallen leaf', bat: 'a feather from a bird', spring: 'a button on a toy',
  trunk: 'a low branch of a tree', glass: 'a bottle holding a drink', wave: 'a clap made with two hands', seal: 'a label on the side of a jar',
  ring: 'a small band worn on a wrist', match: 'a practice before a game', cap: 'a ring around a bottle’s base', fan: 'a window that lets air in',
  nail: 'a hole made in a board', palm: 'a long leaf from a tree', letter: 'a picture on an envelope', jam: 'a crossing where traffic must stop',
  chest: 'a shelf for holding blankets', date: 'a time shown on a clock', patch: 'a tear made in cloth', crane: 'a bird’s long feather',
  coach: 'a person watching a game', clip: 'a strip of sticky tape', rock: 'loose soil beside a path', post: 'a name written on a parcel',
  pitch: 'a line marking a playing field', pupil: 'a child’s school uniform',
};
const MAIN_IDEA_FOILS = {
  roots: 'Roots change colour in different seasons.', compost: 'Gardeners choose plants for a new garden.', duck: 'Ducks build nests beside water.',
  seeds: 'People sort seeds before planting.', worms: 'Worms make new leaves grow on plants.', shadow: 'A torch is made from several spare parts.',
  bees: 'Bees keep their hive warm at night.', pond: 'Frogs catch insects away from water.', rain: 'A roof keeps rain from entering a house.',
  owl: 'Young owls learn to leave their nests.', backpack: 'How to make a backpack from cloth.', 'bus-stop': 'How bus drivers learn a new route.',
  lunchbox: 'How to choose fruit for a healthy lunch.', 'library-returns': 'How writers choose names for their books.',
  'weather-notebook': 'How to choose clothes for a rainy day.', 'model-workshop': 'How builders design a new model before starting.',
  'school-garden': 'How to pick seeds for a new flower bed.', 'drinking-station': 'How to wash bottles before filling them.',
  'book-swap': 'How to repair the torn pages in a book.', performance: 'How actors learn the words for a play.',
  'animal-care': 'How to teach a pet a new trick.', 'station-information': 'How workers build a new train platform.',
  'lost-property': 'How to fix a broken classroom toy.', 'mobile-library': 'How drivers repair the engine of a van.',
  'class-kitchen': 'How to choose recipes for a cooking lesson.', 'playground-check': 'How to choose games for the playground.',
  'river-crossing': 'How workers build boats beside the river.', 'evening-route': 'How visitors choose what time to arrive.',
  'welcome-desk': 'How teachers plan the lessons in each room.', 'school-deliveries': 'How drivers pack parcels into a delivery van.',
  'costume-room': 'How actors learn to play their characters.', 'sports-centre': 'How teachers design a new sports class.',
  'picnic-cart': 'How a family chooses food for a picnic.', 'music-loans': 'How learners choose songs for a concert.',
  'walking-group': 'How walkers choose comfortable new shoes.',
};
// A fourth theme response overgeneralises the initial failed action, or gives
// useful advice about the topic without explaining its mistake-to-repair arc.
// Every label is authored for this story family, across both episode counts.
const THEME_FOILS = {
  check: 'Trust your first guess when the job seems easy.', listen: 'The first part of a message is all you need.',
  cause: 'A stronger push is the best way to solve every problem.', help: 'Work alone so nobody needs to hear your problem.',
  adapt: 'Keep the first plan even when it does not work.', needs: 'Use one plan for everything, even when needs differ.',
  test: 'Testing is only useful after all the work is done.', feedback: 'A finished piece should stay the same when readers are confused.',
  slow: 'Moving faster always makes the work more accurate.', record: 'Details are easiest to remember without writing them down.',
  permission: 'A thing is free to use whenever its owner is away.', 'shared-space': 'The best place to build is wherever there is empty floor.',
  'turn-taking': 'Being first matters more than waiting for other people.', 'fair-materials': 'One person should keep the best supplies for their own work.',
  'returning-tools': 'Shared tools should stay with the last person who used them.', 'owning-errors': 'Quietly hiding a mistake is the best way to fix it.',
  'keeping-promises': 'A promised job can wait until somebody else notices it.', 'fair-comparisons': 'Different starting points make every race equally fair.',
  'check-assumptions': 'A quick guess is enough when things look familiar.', 'resolve-disagreement': 'The stronger partner should choose the plan for everyone.',
  'recognise-limits': 'Taking the biggest job alone always helps the group most.', 'repairing-harm': 'Damage stops mattering when somebody puts it out of sight.',
  'let-others-learn': 'Helping means doing every hard step for the learner.', 'losing-well': 'A player who loses should decide the new score.',
  'try-a-role': 'Only try a job after knowing that you will enjoy it.', 'ask-before-helping': 'Empty spaces in someone’s work should always be filled in.',
  'needs-before-extras': 'Adding more decoration always makes a model work better.', 'shared-supplies': 'The next person should deal with supplies left running.',
  'welcome-newcomers': 'New players should learn the rules by guessing alone.', 'clear-directions': 'Repeating the same vague words always makes directions clear.',
  'look-for-evidence': 'The first sign of a problem always tells you its cause.', 'small-contributions': 'A small job is never useful to the whole group.',
  'small-trial': 'Start with the whole job so no time is spent on tests.', 'check-the-request': 'Choose the first possible meaning of unclear directions.',
  'wait-for-the-change': 'Begin the next step while every surface is still wet.', 'manageable-parts': 'Do every part at once to make a large task easier.',
  'choose-fitting-tools': 'Use the biggest tool for every job.', 'leave-working-space': 'Things work best when they are packed tightly together.',
  'keep-a-record': 'Keep every detail in your head instead of making notes.', 'complete-information': 'Leave out details so every instruction stays short.',
  'mark-before-removing': 'Take everything apart before deciding how it fits together.', 'fix-the-cause': 'Repeat the same quick fix whenever the problem returns.',
  'change-a-failed-method': 'Use more force rather than changing a failed method.', 'check-identity': 'Things that look alike must belong to the same person.',
  'prepare-the-earlier-step': 'Start the last step first to finish sooner.', 'consider-another-view': 'What you can see must be clear to everyone else.',
  'gather-first': 'Begin work before finding the tools you will need.', 'respect-capacity': 'One small container should hold everything you have.',
  'protect-from-conditions': 'Leave paper outside so there is more space to work.', 'make-a-visible-guide': 'One spoken explanation is always enough to copy every part.',
  'tell-people-a-change': 'Changing your own note is enough to tell everyone a new plan.', 'compare-with-the-original': 'A copy is finished as soon as it looks close enough.',
  'keep-working-parts-free': 'Cover every working part when you decorate a model.', 'search-in-order': 'Search the same places again before looking anywhere new.',
  'use-the-same-reference': 'Different starting points always give a fair comparison.', 'ask-about-the-need': 'Choose what looks best before asking what someone needs.',
  'enough-not-most': 'Adding the most material always makes a better result.', 'check-each-part': 'If one part works, every other part must work too.',
  'keep-a-way-back': 'Always change the only copy when trying a new idea.', 'choose-by-the-job': 'Choose the best-looking material for every job.',
};
const SEQUENCE_FOILS = {
  photo: 'taking down a photo', club: 'putting away the cards', garden: 'putting on her gloves', picnic: 'folding the blanket', art: 'putting away the brush',
  music: 'putting away the drums', library: 'opening another book', boat: 'taking off a hat', puppet: 'closing the bag', walk: 'putting away the bags',
  'puppet-rehearsal': 'unpacking the puppet’s clothes', 'bakery-timer': 'putting away the flour', 'night-walk': 'folding the blanket',
  'shore-visit': 'opening the map', 'music-club': 'putting away the shakers', 'train-journey': 'putting away his bottle', 'market-stall': 'paying for the pear',
  'pool-arrival': 'opening his bag', 'display-work': 'taking down the plan', 'post-room': 'putting stamps on the cards', 'visitor-desk': 'taking off the badge',
  'animal-park': 'opening the animal gate', 'boat-outing': 'folding the flag', 'sports-field': 'putting away the hoop', 'pottery-room': 'drying the clay',
  'seed-session': 'planting the seeds', 'map-room': 'opening the atlas', 'star-watch': 'putting away the chair', 'school-office': 'opening the register',
  'ferry-trip': 'collecting his ticket', 'kitchen-apples': 'cutting up the apples', 'stage-practice': 'starting the fan', 'science-table': 'rubbing out the line',
  'book-corner': 'putting the book away', 'craft-fair': 'closing the tin', 'cafe-tables': 'collecting the menus', 'cycle-hut': 'putting on his helmet',
  'field-trip': 'packing away the pencils', 'community-hall': 'opening the window', 'camp-bag': 'unpacking her cup', 'vet-visit': 'feeding the puppy',
  'winter-rink': 'putting on her scarf', 'nursery-room': 'taking the bear off the bed', 'party-lunch': 'emptying the jug', 'nature-watch': 'drawing a butterfly',
};
const SCOPE_FOILS = {
  trays: 'The green tray had one cup.', hats: 'Every child wearing a hat joined the walk.', lanterns: 'No lantern on either table was lit.',
  'red-blue': 'The basket was empty, and both bags were empty too.', tickets: 'Every ticket had been given away before the doors opened.',
  claps: 'The children stood up and sat down during the last clap.', watering: 'Rosa waited until long after the soil dried before watering.', gate: 'Only the adult could go through the open gate.',
  crates: 'None of the large crates contained books.', colours: 'The yellow flag was painted along with the other flags.', seeds: 'Every child planted just one seed.',
  brushes: 'Bo washed only some of the brushes before putting them away.', library: 'The library opened while the repair was still happening.',
  dancers: 'Only some of the dancers wore blue ribbons.', boxes: 'Boxes without stars were sent along with starred boxes.',
  rain: 'The players moved between inside and outside all afternoon.', race: 'Sol finished first and Tess finished last.', shelves: 'Every new book stayed off the bottom shelf.',
  baskets: 'Every basket had both apples and pears.', practice: 'Only three children finished the puzzle.', lunch: 'Music came first, then rabbit feeding, then lunch.',
  buttons: 'Only some round buttons were used, and no square buttons were used.', homework: 'No pupil with a signed form could take a book.', candles: 'Dad put out the candles as the last note of the song was ending.',
  seats: 'There was just one free seat beside the door.',
};
const SEQUENCE_ENDINGS = {
  photo: 'At the end, Nia took down a photo.', club: 'At the end, Ren put away the cards.', garden: 'At the end, Uma put on her gloves.',
  picnic: 'At the end, Dad folded the blanket.', art: 'At the end, Bea put away the brush.', music: 'At the end, the class put away the drums.',
  library: 'At the end, Tess opened another book.', boat: 'At the end, Kit took off the hat.', puppet: 'At the end, Arun closed the bag.',
  walk: 'At the end, the group put away the bags.', 'puppet-rehearsal': 'At the end, the players unpacked the puppet’s clothes.',
  'bakery-timer': 'At the end, the baker put away the flour.', 'night-walk': 'At the end, Kai folded the blanket.',
  'shore-visit': 'At the end, Tess opened the map.', 'music-club': 'At the end, the children put away the shakers.',
  'train-journey': 'At the end, Dad put away his bottle.', 'market-stall': 'At the end, Lina paid for the pear.',
  'pool-arrival': 'At the end, Sol opened his bag.', 'display-work': 'At the end, the group took down the plan.',
  'post-room': 'At the end, Bo put stamps on the cards.', 'visitor-desk': 'At the end, the visitor took off the badge.',
  'animal-park': 'At the end, the keeper opened the animal gate.', 'boat-outing': 'At the end, Arun folded the flag.',
  'sports-field': 'At the end, Jo put away the hoop.', 'pottery-room': 'At the end, the potter dried the clay.',
  'seed-session': 'At the end, the class planted the seeds.', 'map-room': 'At the end, Ren opened the atlas.',
  'star-watch': 'At the end, May put away the chair.', 'school-office': 'At the end, the teacher opened the register.',
  'ferry-trip': 'At the end, Finn collected his ticket.', 'kitchen-apples': 'At the end, Mina cut up the apples.',
  'stage-practice': 'At the end, the actors started the fan.', 'science-table': 'At the end, the class rubbed out the line.',
  'book-corner': 'At the end, Noor put the book away.', 'craft-fair': 'At the end, the helper closed the tin.',
  'cafe-tables': 'At the end, Eve collected the menus.', 'cycle-hut': 'At the end, the cyclist put on his helmet.',
  'field-trip': 'At the end, the group packed away the pencils.', 'community-hall': 'At the end, Sal opened the window.',
  'camp-bag': 'At the end, Kit unpacked her cup.', 'vet-visit': 'At the end, the nurse fed the puppy.',
  'winter-rink': 'At the end, Ada put on her scarf.', 'nursery-room': 'At the end, Dad took the bear off the bed.',
  'party-lunch': 'At the end, Bea emptied the jug.', 'nature-watch': 'At the end, Eli drew a butterfly.',
};

function familySlug(item) {
  const id = item.sourceProvenance?.v11MeaningChoices?.originalId || item.id;
  if (id.startsWith('mock.v4.comprehension.')) return id.split('.').at(-1);
  return id.split('.').at(-2);
}

function relationRepair(item) {
  if (!relationClaims.has(item.constructClaim)) return null;
  const opposite = item.constructClaim.startsWith('antonym');
  const labels = item.choices.map(c => c.label);
  const pair = labels.every(label => label.includes(' — '));
  const pool = opposite ? OPPOSITES : SYNONYMS;
  let target = pair ? labels.find(label => label.startsWith(labels[0].split(' — ')[0]))?.split(' — ')[0] : '';
  // One old borrow row starts its key with lend and its last foil with borrow;
  // retain lend. Single-word rows declare the target in their printed prompt.
  if (!target) {
    const words = [...Object.keys(RELATION_TARGET_REPAIRS), ...Object.keys(pool)]
      .filter(word => new RegExp(`\\b${word}\\b`, 'i').test(item.prompt));
    target = words[0];
  }
  const originalTarget = target;
  target = (!opposite && SYNONYM_TARGET_REPAIRS[target]) || RELATION_TARGET_REPAIRS[target] || target;
  if (!pool[target]) throw Error(`Missing familiar V11 relation contrast: ${item.id} (${originalTarget} -> ${target}).`);
  const responses = pool[target];
  const prompt = opposite ? 'Which words mean the opposite?' : 'Find two words that mean the same.';
  const relationAlias = `v11-relation:${opposite ? 'opposite' : 'synonym'}:${[target, responses[0]].sort().join(':')}`;
  return { prompt, passage: '', targetWord: '', canonicalPassageId: relationAlias, stimulusKey: relationAlias, renderTargetText: false, image: '', imageAlt: '', requiredImagePaths: [],
    choices: responses.map((response, i) => ({ id: `c${i}`, label: `${target} — ${response}` })), answer: 'c0',
    explanation: opposite ? `${target} and ${responses[0]} name opposite meanings.` : `${target} and ${responses[0]} mean about the same.`,
    distractorRationales: Object.fromEntries(responses.slice(1).map((response, i) => [`c${i + 1}`, opposite
      ? `${response} names a related action, property or idea, but does not reverse the meaning of ${target}.`
      : `${response} names a different action, feeling or property; it does not mean ${target}.`])),
    lexicalExposureWords: [...new Set([...(item.lexicalExposureWords || []), target, ...responses])],
    mediaDecision: { role: 'text-and-audio', paths: [], constructReview: 'approved', answerNeutral: 'approved',
      reason: 'Familiar spoken and printed word pairs measure one meaning relation. Exact response recordings are required; no image or unrelated vocabulary is introduced.' },
  };
}

function fourthResponse(item) {
  const key = item.choices.find(c => c.id === item.answer)?.label;
  const claim = item.constructClaim.replace(/^listening_/, '');
  if (claim.includes('sentence_boundary')) {
    // A missing interior boundary is a specific, diagnostic alternative to the
    // two existing misplaced boundaries. Preserve the full authored word order.
    const label = key.replace(/\. (?=[A-Z])/g, ' ');
    return [label, 'Leaves both complete thoughts joined without the full stop needed between them.'];
  }
  if (claim === 'number_detail') {
    const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    const used = new Set(item.choices.map(c => c.label));
    const n = numbers.indexOf(key);
    const label = [numbers[n + 1], numbers[n - 1], numbers[n + 2], numbers[n - 2]].find(value => value && !used.has(value));
    return [label, `Confuses the explicitly stated count ${key} with the nearby count ${label}.`];
  }
  if (claim === 'story_event_order') {
    const slug = familySlug(item), label = SEQUENCE_FOILS[slug];
    if (!label || !SEQUENCE_ENDINGS[slug]) throw Error(`Missing V11 fourth temporal event: ${item.id}`);
    return [label, 'This event is explicitly placed at the end of the revised account, so it cannot be the first event.'];
  }
  if (claim === 'mostly_about_info') {
    const label = MAIN_IDEA_FOILS[familySlug(item)];
    if (!label) throw Error(`Missing V11 main idea foil: ${item.id}`);
    return [label, 'Keeps the passage topic but proposes an account that the supplied details do not explain.'];
  }
  if (claim === 'lesson_mistake_fixed') {
    const label = THEME_FOILS[familySlug(item)];
    if (!label) throw Error(`Missing V11 theme foil: ${item.id}`);
    return [label, 'Overgeneralises the failed first approach; the repair in the supplied story shows why this lesson does not fit.'];
  }
  if (claim === 'meaning_at_named_occurrence') {
    const word = item.targetWord;
    const label = CONTEXT_FOILS[word];
    if (!label) throw Error(`Missing V11 context foil: ${item.id} (${word})`);
    return [label, `Names a related object or detail rather than what ${word} means at the queried occurrence.`];
  }
  if (claim === 'preserve_explicit_scope') {
    const slug = item.id.split('.').at(-1), label = SCOPE_FOILS[slug];
    if (!label) throw Error(`Missing V11 scope foil: ${item.id}`);
    return [label, 'Changes a stated quantity, restriction, order or exception, so it does not preserve the supplied meaning.'];
  }
  const authored = EXTRA_BY_KEY.get(key);
  if (!authored) throw Error(`Missing authored V11 fourth foil: ${item.id} (${claim}: ${key})`);
  return authored;
}

const recordedChoiceIndexes = new WeakMap();
function exactWordPath(text, bank) {
  const currentPath = getLedaWordAudioPath(text) || getLedaInstructionAudioPath(text);
  if (currentPath) return currentPath;
  if (!recordedChoiceIndexes.has(bank)) {
    const index = new Map();
    for (const item of bank) for (const cue of item.requiredAudioCues || []) {
      if (cue.role === 'choice' && cue.text && cue.path && !index.has(cue.text)) index.set(cue.text, cue.path);
    }
    recordedChoiceIndexes.set(bank, index);
  }
  return recordedChoiceIndexes.get(bank).get(text) || getLiteracyMockAudioV11Path(text, ['isolated_word']) || null;
}
function refreshMedia(item, source, bank) {
  const old = source.requiredAudioCues || [];
  const spokenChoices = old.some(c => c.role === 'choice') || relationClaims.has(item.constructClaim);
  let cues = old.filter(c => c.role !== 'choice').map(c => ({ ...c }));
  for (const cue of cues) {
    if (cue.role === 'instruction' && cue.text !== item.prompt) { cue.text = item.prompt; cue.path = getLedaInstructionAudioPath(item.prompt) || getLiteracyMockAudioV11Path(item.prompt, ['assessment_prompt']) || null; }
    if (cue.role === 'passage' && cue.text !== item.passage) { cue.text = item.passage; cue.path = getLedaInstructionAudioPath(item.passage) || getLiteracyMockAudioV11Path(item.passage, ['assessment_passage']) || null; }
  }
  if (spokenChoices) {
    item.choices = item.choices.map(c => ({ ...c, audioPath: exactWordPath(c.label, bank) }));
    cues.push(...item.choices.map(c => ({ role: 'choice', choiceId: c.id, text: c.label, value: c.label, path: c.audioPath, required: true })));
  } else {
    item.choices = item.choices.map(c => { const choice = { ...c }; delete choice.audioPath; return choice; });
  }
  item.requiredAudioCues = cues;
  item.requiredAudioPaths = [...new Set(cues.map(c => c.path).filter(Boolean))];
  item.missingAudioCues = cues.filter(c => c.required !== false && !c.path).map(({ role, text, choiceId }) => ({ role, text, ...(choiceId ? { choiceId } : {}) }));
  item.mediaReady = item.missingAudioCues.length === 0 && (source.mediaReady || source.missingAudioCues?.length > 0);
}

/** Immutable V11 repair for every active single-answer meaning choice at b2+.
 * Historical snapshots and lower-band foundations are owned by other builders.
 * Unknown eligible sources fail authoring instead of receiving a generic foil. */
export function upgradeMeaningChoicesV11(source, bank = []) {
  if (source.sourceProvenance?.v11MeaningChoices || (source.contentVersion && !['literacy-mock-v10', 'literacy-mock-v11'].includes(source.contentVersion))) return source;
  if (!source.adaptiveMixedEligible || !MEANING_AREAS.has(source.domainId) || source.adaptiveAreaBand < 2 || source.format !== 'choice' || Array.isArray(source.answer)) return source;
  const relation = relationRepair(source);
  if (!relation && source.choices.length === 4) return source;
  const item = { ...copy(source), ...(relation || {}) };
  delete item.itemSnapshot;
  if (!relation) {
    const [label, rationale] = fourthResponse(item);
    const id = 'c3';
    if (item.choices.some(c => c.id === id)) throw Error(`V11 fourth choice id collision: ${item.id}`);
    item.choices.push({ id, label });
    item.distractorRationales = { ...item.distractorRationales, [id]: rationale };
    if (item.constructClaim.replace(/^listening_/, '') === 'story_event_order') {
      item.passage = `${item.passage} ${SEQUENCE_ENDINGS[familySlug(item)]}`;
      item.taskDemand = { ...item.taskDemand, features: { ...item.taskDemand?.features, responseEvents: 4, explicitlyLastFourthEvent: true },
        proof: { ...item.taskDemand?.proof, fourthEvent: label, fourthEventEvidence: SEQUENCE_ENDINGS[familySlug(item)] } };
    }
  }
  if (item.choices.length !== 4 || new Set(item.choices.map(c => norm(c.label))).size !== 4) throw Error(`Invalid V11 four-choice set: ${source.id}`);
  item.id = `${source.id}.v11`;
  item.sourceItemId = item.id;
  item.canonicalItemId = item.id;
  item.sourceProvenance = { ...item.sourceProvenance, v11MeaningChoices: { file: FILE, originalId: source.id, authoredFourth: true,
    ...(relation ? { familiarWordRelationRepair: true, priorCanonicalPassageId: source.canonicalPassageId, priorStimulusKey: source.stimulusKey } : {}) } };
  item.taskDemand = { ...item.taskDemand, choiceCount: 4 };
  if(item.constructClaim==='preserve_explicit_scope')item.taskDemand={...item.taskDemand,
    features:{...item.taskDemand.features,parallelScopeContrasts:3},
    proof:{...item.taskDemand.proof,rejected:item.choices.filter(c=>c.id!==item.answer).map(c=>c.label)}};
  refreshMedia(item, source, bank);
  return item;
}

/** Exact requests only; generating or publishing recordings is a separate step. */
export function listMeaningChoicesV11AudioGaps(bank) {
  const gaps = new Map();
  for (const source of bank) {
    const item = upgradeMeaningChoicesV11(source, bank);
    if (item === source) continue;
    for (const cue of item.requiredAudioCues.filter(c => c.required !== false && !c.path)) {
      const role = cue.role === 'choice' ? 'isolated_word' : cue.role === 'passage' ? 'assessment_passage' : 'assessment_prompt';
      const key = `${role}:${cue.text}`, record = gaps.get(key) || { role, text: cue.text, itemIds: [] };
      record.itemIds.push(item.id); gaps.set(key, record);
    }
  }
  return [...gaps.values()];
}
