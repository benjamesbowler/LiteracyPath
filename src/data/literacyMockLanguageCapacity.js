import { buildLiteracyMockSpatialCapacityItems } from './literacyMockSpatialCapacity.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { normalizeSpokenCloze } from '../utils/assessmentSpokenText.js';

// Each row changes the evidence, lexical decision or grammatical relationship.
// The referenced template owns the exact task, level and access conditions.
const groups = [];
const cloze = (template, rows, stem = 'Which word fits?') => groups.push({ template, rows, stem });
const direct = (template, rows) => groups.push({ template, rows, direct: true });

cloze('lp3.nouns.l1.A.noun_person.v1', [
 ['drummer','The ___ played music with two sticks.','drummer','loud','quickly','A drummer names the person making music; loud and quickly describe sound or manner.'],
]);
cloze('lp3.nouns.l1.A.noun_animal.v1', [
 ['whale','A ___ breathes air through its blowhole.','whale','deep','splash','A whale is the animal with a blowhole; the other words do not name that animal.'],
]);
cloze('lp3.nouns.l1.A.noun_place.v1', [
 ['library','We borrow books from the ___.','library','read','quiet','Library names the place where books are borrowed; read is an action and quiet is a quality.'],
]);
cloze('lp3.nouns.l1.A.noun_thing.v1', [
 ['comb','A ___ untangles my hair.','comb','neatly','smooth','Comb names a tool; neatly and smooth do not name the tool in this sentence.'],
]);
cloze('lp3.nouns.l2.A.noun_in_sentence.v1', [
 ['branch','The ___ snapped under the nest.','branch','fragile','suddenly','Branch names what snapped; fragile describes and suddenly tells when or how quickly.'],
]);
cloze('lp3.verbs.l1.A.verb_action_body.v1', [
 ['kneel','To rest on our knees, we ___.','kneel','knee','low','Kneel names the body action; knee names a body part and low describes position.'],
]);
cloze('lp3.verbs.l1.A.verb_action_object.v1', [
 ['peel','We ___ the skin off a banana.','peel','yellow','fruit','Peel is the action that removes the skin; yellow and fruit do not name this action.'],
]);
cloze('lp3.verbs.l2.A.verb_in_sentence.v1', [
 ['fasten','Please ___ the buckle before the ride begins.','fasten','loose','strap','Fasten names connecting the buckle; loose is an adjective and strap names the band.'],
]);
direct('lp3.verbs.l2.A.verb_vs_noun.v1', [
 ['verb-garden','Which word tells the action in “Roots absorb water slowly”?','absorb','roots','slowly','Absorb names what the roots do; roots names the plant part and slowly describes manner.'],
]);
cloze('lp3.adjectives.l1.A.adj_size.v1', [
 ['tiny-seed','The seed is smaller than a pea. It is ___.','tiny','huge','wide','Tiny fits the stated very small size; huge and wide describe different dimensions or amounts.'],
]);
cloze('lp3.adjectives.l1.A.adj_color.v1', [
 ['white-snow','Fresh snow matches this ___ sheet of paper.','white','orange','purple','Ordinary fresh snow is white; the other colors do not match the stated reference.'],
]);
cloze('lp3.adjectives.l1.A.adj_texture_state.v1', [
 ['wet-sleeve','Rain soaked my sleeve. My sleeve is ___.','wet','dry','dusty','Soaked means water has made the sleeve wet; dry contradicts the rain and dusty is unsupported.'],
]);
cloze('lp3.adjectives.l1.A.adj_feeling.v1', [
 ['angry-broken','I felt ___ when someone broke my toy on purpose.','angry','sleepy','hungry','Angry describes the feeling caused by deliberate damage; sleepy and hungry describe unrelated needs.'],
]);
cloze('lp3.adjectives.l2.A.adj_in_sentence.v1', [
 ['stale-bread','Bread left uncovered became dry and ___.','stale','fresh','juicy','Dry exposed bread becomes stale; fresh and juicy contradict that change.'],
]);
cloze('lp3.adjectives.l2.A.adj_precision.v1', [
 ['transparent-pane','We saw clearly through the ___ glass.','transparent','cloudy','frosted','Transparent allows a clear view; cloudy and frosted glass blur it.'],
]);

cloze('mock.depth.nurse', [
 ['librarian','The ___ checks out books and helps readers find them.','librarian','cashier','mechanic','Checking out library books identifies a librarian, not a shop cashier or repair worker.'],
 ['firefighter','Smoke filled the room; the ___ arrived with a hose.','firefighter','gardener','lifeguard','Smoke and a rescue hose indicate a firefighter; the other workers have different duties.'],
 ['pilot','From the cockpit, the ___ steered the airplane.','pilot','sailor','driver','The cockpit and airplane identify a pilot; a sailor steers a boat and a driver a road vehicle.'],
 ['dentist','The ___ repaired a hole in my tooth.','dentist','doctor','barber','Repairing a tooth is a dentist’s work; the other occupations do not match the dental clue.'],
 ['referee','The ___ stopped the match after a foul.','referee','player','spectator','A referee enforces the rules; a player participates and a spectator watches.'],
 ['conductor','Facing the musicians, the ___ signaled when to begin.','conductor','dancer','singer','Signaling an ensemble’s start identifies the conductor rather than another performer.'],
 ['carpenter','The ___ measured wood before building a cupboard.','carpenter','plumber','electrician','Building wooden furniture points to a carpenter; plumbing and wiring are different trades.'],
 ['vet','The sick rabbit was examined by a ___.','vet','dentist','coach','A veterinarian treats sick animals; the alternatives treat teeth or train athletes.'],
]);
cloze('mock.depth.hedgehog', [
 ['snail','A ___ carried its spiral shell across the leaf.','snail','slug','worm','A snail carries a spiral shell; slugs and worms lack that shell.'],
 ['kangaroo','The baby ___ climbed into its mother’s pouch.','kangaroo','deer','zebra','A kangaroo carries its young in a pouch; the other mammals do not.'],
 ['octopus','The ___ gripped the rock with eight arms.','octopus','seal','dolphin','Eight gripping arms identify an octopus, rather than a mammal with flippers.'],
 ['woodpecker','The ___ tapped holes in the trunk with its beak.','woodpecker','duck','gull','Trunk drilling with a beak identifies a woodpecker; ducks and gulls feed differently.'],
 ['silkworm','The ___ spun silk around its body to make a cocoon.','silkworm','earthworm','centipede','Silk and a cocoon identify a silkworm; the other small animals do not spin cocoons.'],
 ['tadpole','A ___ swam with a tail before growing frog legs.','tadpole','minnow','newt','The frog’s tail-bearing early stage is a tadpole; the other names are different animals.'],
 ['porcupine','Sharp quills covered the back of the ___.','porcupine','squirrel','otter','Protective quills distinguish a porcupine from these other furry mammals.'],
 ['seahorse','The ___ curled its tail around sea grass underwater.','seahorse','crab','jellyfish','A seahorse has a grasping curled tail; crabs and jellyfish do not.'],
]);
cloze('mock.depth.bakery', [
 ['aquarium','At the ___, we watched fish through huge glass tanks.','aquarium','aviary','stable','Glass tanks of fish identify an aquarium; the alternatives house birds or horses.'],
 ['station','Our train stopped at the ___ to collect passengers.','station','airport','garage','Trains collect passengers at a station; airports serve aircraft and garages store or repair vehicles.'],
 ['orchard','Workers picked ripe apples from trees in the ___.','orchard','meadow','greenhouse','An orchard is an area of fruit trees; the alternatives do not identify that planting.'],
 ['harbor','Boats sheltered from rough waves in the ___.','harbor','pond','waterfall','A harbor provides protected mooring for boats; a pond or waterfall does not fit the marine refuge.'],
 ['museum','The ___ displayed old tools with labels about their history.','museum','factory','warehouse','Labeled historical displays identify a museum; factories make goods and warehouses store them.'],
 ['kitchen','Steam rose from pots cooking in the ___.','kitchen','bedroom','hallway','Pots cooking identify the kitchen; the other rooms serve different uses.'],
 ['theater','The curtains opened and actors stepped onto the stage of the ___.','theater','library','stadium','Actors, stage and opening curtains identify a theater rather than the alternatives.'],
 ['clinic','I waited at the ___ for a nurse to dress my cut.','clinic','pharmacy','gym','Wound treatment by a nurse identifies a clinic; a pharmacy supplies medicine and a gym exercise space.'],
]);
cloze('mock.depth.sieve', [
 ['funnel','A ___ guided juice into the narrow bottle opening.','funnel','sieve','tray','A funnel channels liquid into a narrow neck; a sieve strains and a tray supports objects.'],
 ['compass','The hiker checked a ___ to find north.','compass','thermometer','clock','A compass indicates direction; the other instruments measure temperature or time.'],
 ['thermometer','A ___ showed how warm the water was.','thermometer','ruler','scale','A thermometer measures temperature; a ruler measures length and a scale measures weight.'],
 ['tongs','Use the ___ to grip and lift the hot corn.','tongs','whisk','grater','Tongs grip food; a whisk mixes and a grater shreds.'],
 ['hinge','The door swung on a ___ fixed to the frame.','hinge','handle','lock','A hinge is the turning joint; a handle and a lock do not form that joint.'],
 ['anchor','The sailor lowered an ___ to stop the boat drifting.','anchor','oar','sail','An anchor holds a boat in position; oars and sails help move it.'],
 ['magnifier','The tiny print looked larger through the ___.','magnifier','mirror','window','A magnifier enlarges apparent size; a mirror reflects and an ordinary window does not enlarge.'],
 ['ladder','We climbed the ___ one rung at a time.','ladder','ramp','staircase','Rungs identify a ladder; ramps have slopes and staircases have steps.'],
]);
cloze('mock.depth.crawl', [
 ['tiptoe','To move quietly past the baby, ___ on your toes.','tiptoe','stamp','march','Tiptoeing uses the toes quietly; stamping and marching do not meet both clues.'],
 ['leap','Push off hard and ___ across the wide ditch.','leap','shuffle','kneel','Leaping clears a gap; shuffling stays on the ground and kneeling does not cross it.'],
 ['duck','The beam was low, so I had to ___ my head.','duck','tilt','lift','Ducking lowers the head to pass under a beam; tilting or lifting does not establish clearance.'],
 ['stretch','Reach both arms as far upward as possible and ___.','stretch','curl','squat','Stretching extends the body; curling and squatting shorten or lower it.'],
 ['stagger','Dizzy after spinning, I began to ___ from side to side.','stagger','march','glide','Staggering describes unsteady walking; marching and gliding imply controlled movement.'],
 ['shrug','I did not know, so I ___ my shoulders.','shrugged','nodded','waved','Shrugging lifts the shoulders; nodding uses the head and waving uses the hand.'],
 ['wade','The water reached my knees as I ___ across.','waded','dived','floated','Wading means walking through shallow water; diving and floating describe different movement.'],
 ['balance','On one foot, I held my arms out to ___.','balance','kneel','roll','Arms held out help balance on one foot; kneeling and rolling would change the stated position.'],
]);
cloze('mock.depth.fold', [
 ['thread','Push the string through the bead to ___ it.','thread','knot','weave','Threading passes string through a hole; knotting and weaving are different operations.'],
 ['wring','Twist the wet cloth firmly to ___ out the water.','wring','soak','sprinkle','Wringing twists water out; soaking and sprinkling add water.'],
 ['scoop','Use the curved spoon to ___ ice cream into the bowl.','scoop','slice','whisk','Scooping lifts a rounded portion; slicing cuts and whisking mixes.'],
 ['fasten-object','Join the two ends of the strap to ___ the bag.','fasten','unroll','empty','Fastening joins and secures the ends; unrolling and emptying do not.'],
 ['stack','Put each block directly on the one below to ___ them.','stack','scatter','sort','Stacking makes a vertical pile; scattering separates and sorting groups by a property.'],
 ['spread','Move the knife across the bread to ___ the butter.','spread','pour','grate','Spreading covers a surface with a layer; pouring and grating do not match the described knife movement.'],
 ['coil','Wind the rope into round loops to ___ it.','coil','stretch','tear','Coiling forms loops; stretching lengthens and tearing breaks apart.'],
 ['squeeze','Press the lemon halves firmly to ___ out the juice.','squeeze','peel','stir','Squeezing uses pressure to release juice; peeling removes skin and stirring mixes.'],
]);
cloze('mock.depth.rinse', [
 ['sort','Put all the red counters together to ___ them by color.','sort','count','measure','Sorting groups by a property; counting totals and measuring size do not group by color.'],
 ['repair','The wheel was broken; Dad replaced it to ___ the cart.','repair','decorate','borrow','Replacing a broken part repairs the cart; decorating or borrowing does not restore it.'],
 ['compare','Look at both leaves together to ___ their sizes.','compare','collect','hide','Comparing considers two sizes together; collecting and hiding do not examine the relationship.'],
 ['rinse-rice','Water ran through the rice, carrying dirt away as we ___ it.','rinsed','fried','stored','Rinsing uses water to carry dirt away; frying and storing are different processes.'],
 ['count','Touch each shell once and say a number to ___ them.','count','weigh','polish','Counting assigns a number to each object; weighing and polishing do not find the number.'],
 ['notice','A small movement caught my eye, and I ___ the moth.','noticed','forgot','imagined','Noticed means became aware of something present; forgot and imagined do not describe seeing it.'],
 ['rescue','A worker pulled the trapped puppy free to ___ it.','rescue','train','chase','Freeing a trapped animal rescues it; training and chasing do not match the purpose.'],
 ['share','We divided the crackers fairly so everyone could ___ them.','share','hide','waste','Sharing distributes food among people; hiding and wasting do not meet the stated fair division.'],
]);
cloze('mock.depth.narrow', [
 ['shallow','The water barely covered our ankles; it was ___.','shallow','deep','wide','Ankle-high water is shallow; deep contradicts it and wide measures a different dimension.'],
 ['thick','Many pages made the book ___ from cover to cover.','thick','tall','narrow','Many pages increase thickness; height and width are different dimensions.'],
 ['long','The ribbon reached from one wall to the other; it was ___.','long','deep','thick','Reaching across the room gives length evidence rather than depth or thickness.'],
 ['short','The pencil was too ___ to reach the bottom of the jar.','short','wide','heavy','Insufficient reach concerns length; width and weight do not explain it.'],
 ['broad','Three people could sit side by side on the ___ bench.','broad','shallow','thin','Side-by-side seating indicates width; shallow and thin describe different dimensions.'],
 ['steep','The hill rose sharply, making the path ___.','steep','flat','wide','A sharp rise indicates a steep slope; flat contradicts it and wide is unrelated to incline.'],
 ['equal','Both strings measured ten centimeters; their lengths were ___.','equal','uneven','tiny','Matching measurements make the lengths equal; uneven contradicts them and tiny is not a comparison.'],
 ['vast','The desert stretched beyond what we could see; it was ___.','vast','narrow','shallow','Vast describes an immense area; narrow and shallow refer to different limited dimensions.'],
]);
cloze('mock.depth.pale', [
 ['navy','The blue paint was almost black; it was ___ blue.','navy','sky','pale','Navy identifies very dark blue; sky and pale blue are lighter.'],
 ['golden','The baked crust shone yellow-brown; it looked ___.','golden','silver','violet','Golden describes the yellow-brown color; the other hues conflict with the evidence.'],
 ['scarlet','The cloth was a vivid, bright red called ___.','scarlet','maroon','pink','Scarlet is vivid bright red; maroon is dark red and pink is pale red.'],
 ['faded','Sunlight had drained the curtain’s color; it looked ___.','faded','vivid','glossy','Faded means weakened in color; vivid is strong and glossy describes shine.'],
 ['multicolored','Red, yellow and blue stripes made the scarf ___.','multicolored','plain','colorless','Several different colors make it multicolored; plain or colorless does not fit.'],
 ['silvery','The fish flashed with a gray, metal-like shine; it looked ___.','silvery','golden','scarlet','Silvery matches shiny gray; golden and scarlet identify different colors.'],
 ['turquoise','The paint was a greenish blue called ___.','turquoise','purple','orange','Turquoise is greenish blue; purple and orange are different color mixtures.'],
 ['maroon','The ribbon was dark brownish red, or ___.','maroon','pink','scarlet','Maroon is dark brownish red; pink is pale and scarlet is vivid bright red.'],
]);
cloze('mock.depth.brittle', [
 ['flexible','The rubber strip bent easily without breaking; it was ___.','flexible','brittle','rigid','Flexible material bends without breaking; brittle breaks and rigid resists bending.'],
 ['slippery','Soap made the handle slide out of my hand; it was ___.','slippery','sticky','rough','Slippery surfaces slide; sticky grips and rough adds friction.'],
 ['porous','Water soaked into the sponge through tiny holes; it was ___.','porous','solid','waterproof','Porous material admits water through holes; solid and waterproof do not explain absorption.'],
 ['smooth','My fingers found no bumps on the polished stone; it was ___.','smooth','coarse','spiky','Smooth means without noticeable bumps; coarse and spiky would feel uneven.'],
 ['crumbly','The dry biscuit broke into many loose bits; it was ___.','crumbly','stretchy','chewy','Crumbly food breaks into pieces; stretchy and chewy hold together differently.'],
 ['sticky','The syrup held my fingers together; it felt ___.','sticky','slippery','powdery','Sticky material adheres to fingers; slippery and powdery do not hold them together.'],
 ['rigid','The board stayed straight when I tried to bend it; it was ___.','rigid','flexible','elastic','Rigid material resists bending; flexible and elastic material changes shape.'],
 ['damp','The towel was slightly wet, but not dripping; it was ___.','damp','soaked','dry','Damp means a little wet; soaked is much wetter and dry has no moisture.'],
]);
cloze('mock.depth.relieved', [
 ['proud','After practicing, I finished the difficult song and felt ___ of my effort.','proud','ashamed','jealous','Pride fits satisfaction in one’s own effort; shame and jealousy have different causes.'],
 ['disappointed','The canceled trip had been my hope all week; I felt ___.','disappointed','delighted','relieved','A hoped-for event not happening brings disappointment; the alternatives imply welcome news.'],
 ['curious','I wondered how the clock worked and wanted to look inside; I was ___.','curious','bored','certain','Wanting to discover how something works is curiosity; boredom and certainty do not fit.'],
 ['embarrassed','Everyone noticed my mistake, and I wished I could hide; I felt ___.','embarrassed','proud','grateful','Wishing to hide after public attention indicates embarrassment rather than pride or thanks.'],
 ['grateful','A stranger returned my lost coat, and I wanted to thank her; I felt ___.','grateful','jealous','annoyed','Wanting to thank someone for help expresses gratitude; the alternatives do not.'],
 ['frustrated','The knot would not come loose despite many tries; I felt ___.','frustrated','content','amused','Repeated unsuccessful effort produces frustration; content and amused do not describe that obstacle.'],
 ['jealous','I wished I had the prize my friend received; I felt ___.','jealous','relieved','grateful','Wanting another person’s prize signals jealousy; relief and gratitude concern different events.'],
 ['confident','I knew the routine well and trusted myself to perform it; I felt ___.','confident','doubtful','startled','Trust in one’s readiness is confidence; doubt and surprise contradict that state.'],
]);

direct('lp3.plurals.l2.A.plural_y_to_ies.v4', [
 ['error-boxs','Which word is spelled incorrectly? The boxs held old toys.','boxs','held','toys','Boxes needs es after x; held and toys are correctly spelled.'],
 ['error-dishs','Which word is spelled incorrectly? Clean dishs dried on the rack.','dishs','dried','rack','Dishes needs es after sh; dried and rack are correctly spelled.'],
 ['error-bushs','Which word is spelled incorrectly? Birds nested in the bushs.','bushs','birds','nested','Bushes needs es after sh; birds and nested are correctly spelled.'],
]);
direct('lp3.plurals.l2.C.plural_y_to_ies.v6', [
 ['plural-thieves','Which is the plural of thief?','thieves','thief','thieves’','Thieves names more than one thief; thief is singular and thieves’ marks possession.'],
 ['plural-loaves','Which is the plural of loaf?','loaves','loaf','loaf’s','Loaves names more than one loaf; loaf is singular and loaf’s marks possession.'],
]);
cloze('lp3.plurals.l1.A.plural_add_s.v101', [
 ['plural-flags','Three ___ waved from poles.','flags','flag','wheels','Flags wave from poles; flag is singular and wheels do not fit this evidence.'],
 ['plural-kites','Two ___ flew on strings.','kites','kite','stones','Kites fly on strings; kite is singular and stones do not.'],
 ['plural-candles','Four ___ burned on the cake.','candles','candle','ribbons','Candles burn on cakes; candle names one and ribbons are not burning lights.'],
 ['plural-beaks','Both birds opened their ___ to sing.','beaks','beak','tails','Birds sing through beaks; beak is singular and tails do not open to sing.'],
 ['plural-stamps','Five ___ paid for the letters’ postage.','stamps','stamp','buttons','Postage is paid with stamps; stamp names one and buttons do not pay postage.'],
 ['plural-wings','Two ___ lifted the bird into the air.','wings','wing','paws','Wings enable the bird’s flight; wing is singular and birds do not have paws.'],
 ['plural-keys','Three ___ unlocked different doors.','keys','key','combs','Keys unlock doors; key names one and combs do not unlock them.'],
 ['plural-seeds','Several ___ sprouted in the soil.','seeds','seed','coins','Seeds sprout; seed is singular and coins cannot sprout.'],
 ['plural-shells','Two ___ protected the snails’ soft bodies.','shells','shell','feathers','Snail shells protect soft bodies; shell names one and snails do not have feathers.'],
]);
cloze('lp3.plurals.l1.B.plural_concept.v102', [
 ['plural-bells','Three ___ rang in the tower.','bells','bell','bricks','Bells ring; bell is singular and bricks make up the tower rather than ring.'],
 ['plural-nests','Two ___ held the birds’ eggs.','nests','nest','beaks','Nests hold eggs for birds; nest names one and beaks are not egg-holding homes.'],
 ['plural-caps','Both bottles had screw-on ___.','caps','cap','handles','Screw-on caps close bottles; cap is singular and handles do not close them.'],
 ['plural-boots','My two ___ kept my feet dry.','boots','boot','mittens','Boots cover feet; boot is singular and mittens cover hands.'],
 ['plural-petals','Five ___ fell from the flower.','petals','petal','roots','Petals are the flower parts that fall; petal is singular and roots are below ground.'],
 ['plural-rails','The train rolled along two metal ___.','rails','rail','ropes','A train runs on rails; rail names one and ropes do not form a train track.'],
 ['plural-eggs','Three ___ cracked before the chicks emerged.','eggs','egg','leaves','Chicks emerge from eggs; egg names one and leaves do not hatch.'],
 ['plural-crayons','Six ___ left colored marks on paper.','crayons','crayon','socks','Crayons make colored marks; crayon names one and socks are not drawing tools.'],
 ['plural-lamps','Three ___ lit the dark room.','lamps','lamp','vases','Lamps give light; lamp names one and vases do not light rooms.'],
]);
cloze('lp3.plurals.l1.C.plural_add_es.v103', [
 ['plural-dresses','The shop hung two ___ on hangers.','dresses','dress','spoons','Dresses are hanging clothes; dress is singular and spoons do not fit the clothing display.'],
 ['plural-boxes','Four cardboard ___ held our moving things.','boxes','box','clouds','Cardboard boxes hold objects; box is singular and clouds are not cardboard containers.'],
 ['plural-brushes','Two paint ___ stood in the pot.','brushes','brush','buttons','Paint brushes are tools kept in a pot; brush names one and buttons are not paint tools.'],
 ['plural-peaches','The basket held three fuzzy ___.','peaches','peach','plums','Peaches have fuzzy skins; peach names one and plums have smooth skins.'],
 ['plural-benches','The park’s two ___ were seats with backs.','benches','bench','fences','Park benches are seats; bench names one and fences mark boundaries.'],
 ['plural-lunches','We packed two ___ to eat at noon.','lunches','lunch','blankets','Lunches are meals eaten at noon; lunch names one and blankets are not meals.'],
 ['plural-bushes','Three low ___ grew beside the path.','bushes','bush','fountains','Bushes are low growing plants; bush names one and fountains do not grow.'],
 ['plural-torches','Both battery ___ shone into the cave.','torches','torch','baskets','Torches supply battery-powered light; torch names one and baskets do not shine.'],
]);
cloze('lp3.plurals.l2.B.plural_y_to_ies.v105', [
 ['plural-libraries','Both town ___ lend books to readers.','libraries','library','bookmarks','Libraries lend books; library names one and bookmarks do not lend things.'],
 ['plural-babies','The two newborn ___ slept in separate cribs.','babies','baby','blankets','Newborn babies sleep in cribs; baby names one and blankets are not newborn people.'],
 ['plural-berries','We picked ripe ___ from the thorny bush.','berries','berry','pebbles','Berries ripen on bushes; berry names one and pebbles do not ripen.'],
 ['plural-cities','The map showed large ___ connected by highways.','cities','city','buildings','Cities are settlements linked by highways; city names one and individual buildings are not the map’s settlements.'],
 ['plural-puppies','Our dog gave birth to five ___.','puppies','puppy','kittens','Baby dogs are puppies; puppy is singular and kittens are baby cats.'],
 ['plural-stories','We listened to two bedtime ___.','stories','story','pillows','Stories can be listened to; story names one and pillows are not narratives.'],
 ['plural-parties','Each class planned a celebration, making three ___.','parties','party','lessons','Parties are celebrations; party names one and lessons do not necessarily celebrate.'],
 ['plural-ponies','Three small ___ carried children around the paddock.','ponies','pony','puppies','Ponies are small equines ridden in paddocks; pony is singular and puppies cannot carry riders.'],
 ['plural-flies','Several ___ buzzed around the fruit and landed on it.','flies','fly','slugs','Flies buzz through the air; fly names one and slugs do not fly or buzz.'],
]);
cloze('lp3.plurals.l2.C.plural_irregular.v106', [
 ['irregular-mice','Tiny ___ gnawed the grain sacks with sharp front teeth.','mice','mouse','kittens','Mice are small grain-gnawing rodents; mouse names one and kittens are not rodents.'],
 ['irregular-geese','A flock of ___ honked beside the pond.','geese','goose','ducks','Geese honk; goose names one and ducks typically quack.'],
 ['irregular-feet','Both of my ___ fitted inside the new shoes.','feet','foot','hands','Feet go in shoes; foot names one and hands do not fit the stated use.'],
 ['irregular-children','The classroom held twenty ___ and one teacher.','children','child','childhood','Children names young people; child names one and childhood is a period of life.'],
 ['irregular-people','Several ___ waited in line, each holding a ticket.','people','person','peoples','People is the ordinary plural of person; person names one and peoples refers to distinct populations.'],
 ['irregular-women','Two adult females are two ___.','women','woman','girls','Women is the plural adult-female term; woman names one and girls refers to children.'],
 ['irregular-men','Three adult males are three ___.','men','man','boys','Men is the plural adult-male term; man names one and boys refers to children.'],
 ['irregular-sheep','The flock had twelve ___, all growing thick wool.','sheep','sheep’s','shepherd','Sheep is also the plural form; sheep’s marks possession and shepherd names a person.'],
 ['irregular-oxen','Two trained ___ pulled the heavy farm cart.','oxen','ox','ox’s','Oxen is the plural of ox; ox names one and ox’s marks possession.'],
]);
cloze('lp3.plurals.l2.A.plural_f_to_ves.v107', [
 ['ves-leaves','In fall, the tree shed many brown ___.','leaves','leaf','petals','Tree leaves are shed in fall; leaf names one and petals belong to flowers.'],
 ['ves-loaves','The baker sliced two ___ of bread.','loaves','loaf','slices','Loaves are whole shaped breads that can be sliced; loaf names one and slices are the results.'],
 ['ves-knives','Both table ___ had handles and cutting blades.','knives','knife','forks','Knives have cutting blades; knife names one and forks have prongs.'],
 ['ves-wolves','Three wild ___ hunted together in a pack.','wolves','wolf','deer','Wolves are pack-hunting wild canines; wolf names one and deer are herbivores.'],
 ['ves-shelves','We put the books on three wall ___.','shelves','shelf','ceilings','Shelves support books; shelf names one and ceilings are overhead surfaces.'],
 ['ves-thieves','Police caught two ___ who had stolen the bicycles.','thieves','thief','thieves’','Thieves names more than one person who steals; thief is singular and thieves’ marks possession.'],
 ['ves-halves','One equal cut divided the orange into two ___.','halves','half','quarters','A single division into two equal parts creates halves; half is singular and quarters require four parts.'],
 ['ves-selves','After resting, the children felt like their usual ___.','selves','self','shelves','Selves is the plural of self; self is singular and shelves is an unrelated plural.'],
 ['ves-scarves','Two soft ___ were wrapped around the children’s necks.','scarves','scarf','gloves','Scarves cover necks; scarf names one and gloves cover hands.'],
]);
cloze('lp3.plurals.l2.B.plural_in_sentence.v108', [
 ['sentence-plural-rooms','The hotel has twelve ___, each with a bed.','rooms','room','roof','Rooms are countable spaces containing beds; room is singular and roof does not name the spaces.'],
 ['sentence-plural-teeth','The comb lost several ___ when it snapped.','teeth','tooth','mouths','A comb’s projecting points are teeth; tooth is singular and mouths are not comb parts.'],
 ['sentence-plural-stems','Each flower stood on a stalk, making six ___.','stems','stem','roots','Flower stalks are stems; stem is singular and roots grow below the plant.'],
 ['sentence-plural-trays','Workers slid both loaded ___ into the oven.','trays','tray','napkins','Trays support food in an oven; tray names one and napkins are not baking supports.'],
 ['sentence-plural-hooves','The horse lifted both front ___ to clear the fence.','hooves','hoof','horns','Hooves are the horse’s hard foot coverings; hoof is singular and horses do not have horns.'],
 ['sentence-plural-wishes','Before blowing out candles, each child made two ___.','wishes','wish','whistles','Birthday wishes are made before candle blowing; wish names one and whistles are sounds.'],
 ['sentence-plural-branches','Birds perched on several ___ high in the tree.','branches','branch','roots','Branches form the tree’s elevated supports; branch names one and roots are not high in the tree.'],
 ['sentence-plural-passengers','The bus stopped so three ___ could get off.','passengers','passenger','passengers’','Passengers is the plural noun; passenger is singular and passengers’ marks possession.'],
 ['sentence-plural-potatoes','The cook peeled five ___ for the soup.','potatoes','potato','plates','Potatoes are vegetables peeled for soup; potato names one and plates cannot be peeled as food.'],
]);
cloze('mock.depth.plural-bus', [
 ['hard-es-matches','One box held many wooden ___ for lighting fires.','matches','match','matchbox','Matches are small fire-lighting sticks; match names one and matchbox names their container.'],
 ['hard-es-classes','The school divided the pupils into four ___.','classes','class','classroom','Classes are groups of pupils; class names one and classroom names a room.'],
 ['hard-es-beaches','The island has three sandy ___ beside the sea.','beaches','beach','waves','Beaches are sandy shores; beach names one and waves are moving water.'],
 ['hard-es-buses','Different ___ carried the two teams to the match.','buses','bus','buses’','Buses is the plural vehicle noun; bus names one and buses’ marks possession.'],
 ['hard-es-foxes','Two ___ with bushy tails watched the henhouse.','foxes','fox','fox’s','Foxes names more than one fox; fox is singular and fox’s marks possession.'],
 ['hard-es-dishes','After supper, all the dirty ___ went into the sink.','dishes','dish','dish’s','Dishes is the plural tableware noun; dish is singular and dish’s marks possession.'],
 ['hard-es-stitches','The seam needed six more ___ to close the hole.','stitches','stitch','needles','Stitches are the sewn loops that close the hole; stitch is singular and needles are tools.'],
 ['hard-es-wishes','The card contained good ___ for the coming year.','wishes','wish','wisher','Wishes are expressions of hope; wish names one and wisher names a person.'],
]);

cloze('mock.depth.scarf', [
 ['literal-broom','The helper held the bag open while the cleaner swept dust into it.','the cleaner','the helper','the visitor','The cleaner swept; the helper’s different job was holding the bag.','Who swept the dust?'],
 ['literal-eggs','After the duck left her nest, a squirrel carried a nut past the eggs.','a nut','the eggs','the nest','The squirrel carried a nut; the eggs remained in the duck’s nest.','What did the squirrel carry?'],
 ['literal-scarer','A crow ignored the scarecrow until the farmer clapped and the dog barked.','the farmer','the crow','the scarecrow','The farmer is explicitly the person who clapped; the dog made a different sound.','Who clapped?'],
 ['literal-paints','Although her brother fetched water, Tara mixed the paint with a wooden stick.','a wooden stick','a water jug','a paintbrush','The stick is the stated mixing tool; the other objects do not perform the mixing.','What did Tara use to mix paint?'],
 ['literal-bell','The driver rang the bell before the passenger lifted her suitcase from the rack.','the passenger','the driver','the guard','The passenger lifted her suitcase; the driver rang the bell first.','Who lifted the suitcase?'],
 ['literal-stone','Beneath the stone that Dad turned over, a beetle crawled past a tiny worm.','a beetle','a worm','a stone','The beetle crawled; the worm is a different creature present in the scene.','What crawled past the worm?'],
 ['literal-sandwich','While the cook made soup, her assistant cut the bread and a server set bowls out.','the assistant','the cook','the server','The assistant cut bread; cooking soup and setting bowls are the other jobs.','Who cut the bread?'],
 ['literal-parcel','The parcel contained a scarf wrapped around a cup, but the empty box held only paper.','a scarf','paper','an empty box','The scarf was wrapped around the cup; paper belongs to the other box.','What was wrapped around the cup?'],
]);
cloze('mock.depth.basket', [
 ['where-gloves','Before hanging her coat on the hook, Ella tucked her gloves into its pockets.','in the coat pockets','on the hook','under the coat','The gloves went into the pockets; the coat itself was then hung on the hook.','Where did Ella put her gloves?'],
 ['when-paint','We cleaned the brushes after painting but before putting the finished pictures on the shelf.','after painting','before painting','after displaying the pictures','Cleaning falls between painting and display; the other positions reverse that order.','When did we clean the brushes?'],
 ['where-kitten','The kitten left the basket by the stairs and curled up behind the warm stove.','behind the stove','in the basket','on the stairs','Behind the stove is the kitten’s final resting place; the basket was its earlier place.','Where did the kitten curl up?'],
 ['when-seeds','Once the frost ended, we planted seeds and waited until summer to pick beans.','after the frost ended','during the summer harvest','before the frost ended','Planting followed the frost and preceded harvest; the other times conflict with the sequence.','When did we plant the seeds?'],
 ['where-ticket','My ticket slipped beneath the seat while my map stayed folded inside the blue bag.','beneath the seat','inside the blue bag','on the seat','The ticket fell beneath the seat; the map is the object in the bag.','Where did the ticket slip?'],
 ['when-snack','At dawn the walkers set out; they stopped for a snack halfway up the hill.','halfway up the hill','before setting out','after reaching the top','The snack stop was halfway up, between starting and reaching the top.','When did the walkers eat a snack?'],
 ['where-shells','We left wet shoes outside the tent and stored our dry shells in a tin.','in a tin','outside the tent','inside the wet shoes','The dry shells were stored in the tin; the wet shoes were outside.','Where did we store the shells?'],
 ['when-alarm','The alarm sounded after everyone had sat down, just before the film was due to start.','after everyone sat down','before anyone sat down','after the film ended','The alarm occurred between sitting and the planned start; the other times contradict it.','When did the alarm sound?'],
]);
cloze('mock.depth.gate', [
 ['action-bridge','Instead of crossing the bridge, the goat stepped carefully along stones through the shallow stream.','It stepped along stones.','It crossed the bridge.','It swam through deep water.','The goat used stepping stones; the sentence explicitly excludes the bridge and describes shallow water.','How did the goat cross the stream?'],
 ['action-door','With both hands full, Rosa nudged the loose door open using her elbow.','She used her elbow.','She pulled with her hands.','She pushed with her foot.','Her elbow opened the door; her hands were occupied and no foot action is stated.','How did Rosa open the door?'],
 ['action-path','The snail slid along the leaf while an ant hurried past carrying a crumb.','It slid along the leaf.','It hurried past the snail.','It carried a crumb.','Sliding is the snail’s action; the other actions belong to the ant.','How did the snail move?'],
 ['action-parcel','Dad loosened the string carefully rather than cutting it, so we could use it again.','He loosened the string.','He cut the string.','He tore the paper.','Dad loosened the string to preserve it; cutting is explicitly rejected.','How did Dad open the tied parcel?'],
 ['action-seed','The wind carried the seed away until its tiny threads caught on a rough fence.','It was carried by wind.','It was thrown by a bird.','It rolled along the ground.','The wind is the stated means of movement; neither throwing nor rolling is described.','How did the seed travel?'],
 ['action-water','Lea tipped the full jug slowly, sending a thin stream into the smallest cup.','She poured slowly.','She splashed with her fingers.','She scooped with the cup.','Tipping the jug creates a controlled pour; splashing and scooping are different movements.','How did Lea fill the cup?'],
 ['action-hill','The cyclist got off at the steep hill and pushed the bicycle to the top.','She pushed it uphill.','She rode it uphill.','She carried it overhead.','After getting off, the cyclist pushed; riding and carrying contradict the stated action.','How did the cyclist move the bicycle uphill?'],
 ['action-crumbs','Rather than brush the crumbs away, Theo gathered them with a damp cloth.','He used a damp cloth.','He used a dry brush.','He blew them away.','A damp cloth gathered the crumbs; brushing was rejected and blowing was not stated.','How did Theo collect the crumbs?'],
]);

direct('lp3.prefixes_suffixes.l2.A.suffix_s_es.v1', [
 ['affix-pushes','Complete “They push; he ___”.','pushes','pushing','pushed','He takes the present-tense ending es; pushing and pushed change the grammatical form.'],
 ['affix-fixes','Complete “We fix; she ___”.','fixes','fixing','fixed','She takes present-tense fixes; the other forms do not complete this simple-present contrast.'],
 ['affix-misses','Complete “I miss; he ___”.','misses','missing','missed','The third-person singular present form adds es after ss.'],
]);
direct('lp3.prefixes_suffixes.l2.A.suffix_ing.v1', [
 ['affix-painting','Add -ing to paint.','painting','painted','painter','Painting has the requested ing ending; painted marks past and painter names a person.'],
 ['affix-stirring','Add -ing to stir.','stirring','stirred','stirs','Stirring doubles the final r before ing; stirred and stirs have other endings.'],
]);
direct('lp3.prefixes_suffixes.l2.A.suffix_ed.v1', [
 ['affix-brushed','Add -ed to brush.','brushed','brushes','brushing','Brushed is the requested past form; the alternatives mark present or ongoing action.'],
 ['affix-folded','Add -ed to fold.','folded','folding','folds','Folded adds the requested ed ending; the alternatives have other suffixes.'],
]);
direct('lp3.prefixes_suffixes.l2.A.suffix_er_est.v1', [
 ['affix-brightest','Add -est to bright.','brightest','brighter','brightly','Brightest marks the greatest degree; brighter compares and brightly describes manner.'],
 ['affix-thinner','Add -er to thin.','thinner','thinnest','thinly','Thinner is the comparative form; thinnest is superlative and thinly describes manner.'],
 ['affix-neatest','Add -est to neat.','neatest','neater','neatly','Neatest is the superlative; the alternatives have different grammatical functions.'],
]);
direct('lp3.prefixes_suffixes.l2.A.suffix_ly.v1', [
 ['affix-safely','Add -ly to safe.','safely','safer','safest','Safely describes manner; safer and safest compare degrees of safety.'],
 ['affix-slowly','Add -ly to slow.','slowly','slower','slowest','Slowly gives the requested manner form; the other forms compare speed.'],
]);
direct('lp3.prefixes_suffixes.l2.A.prefix_pre.v1', [
 ['affix-prepay','Pay before receiving something. Which word adds pre- to pay?','prepay','repay','paying','Prepay means pay beforehand; repay means pay back and paying marks ongoing action.'],
 ['affix-prewash','Wash fabric before sewing. Which word adds pre- to wash?','prewash','rewash','washed','Prewash marks washing beforehand; rewash means again and washed marks past action.'],
 ['affix-precut','Cut the pieces before class. Which word adds pre- to cut?','precut','recut','cutting','Precut marks cutting in advance; recut means again and cutting marks ongoing action.'],
]);
direct('lp3.prefixes_suffixes.l1.A.prefix_un.v101', [
 ['un-untie','What does “untie” mean?','loosen a knot','make a knot','cut a string','Untie reverses tying; it loosens a knot rather than making one or cutting the string.'],
 ['un-unzip','A coat is zipped shut. What does “unzip” mean?','open its zipper','close its zipper','replace its zipper','Unzip reverses zipping; replacing a zipper is a different action.'],
 ['un-uncover','What does “uncover” ask you to do?','take the cover off','put the cover on','fold the cover up','Uncover removes a cover; putting on or folding it does not give the prefix’s reversal.'],
 ['un-unfair','A rule is unfair. What does that mean?','It is not fair.','It is always fair.','It is a new rule.','Un means not in unfair; age of the rule is unrelated.'],
 ['un-unwell','What does “unwell” mean?','not feeling healthy','feeling very healthy','feeling very hungry','Unwell negates well; hunger alone does not mean illness.'],
 ['un-untrue','Someone says a story is untrue. What do they mean?','It did not really happen.','It really did happen.','It happened long ago.','Untrue means not true; being long ago does not make a story false.'],
 ['un-unsafe','What does “unsafe” mean?','not safe to use','ready to use safely','hard to use quickly','Un negates safe; speed or difficulty is a different property.'],
 ['un-unload','A truck is full. What does “unload” mean?','take the load off','put the load on','drive the load away','Unload reverses loading; driving moves the load without removing it.'],
 ['un-unplug','What does “unplug” mean?','pull the plug out','push the plug in','move the cord aside','Unplug reverses connecting a plug; moving the cord need not disconnect it.'],
]);
direct('lp3.prefixes_suffixes.l1.B.prefix_re.v102', [
 ['re-reread','You missed a sentence. What does “reread” mean?','read it again','read it faster','stop reading it','Re means again; speed and stopping are different instructions.'],
 ['re-refill','The jug is empty. What does “refill” mean?','fill it again','empty it fully','carry it away','Refill repeats filling; the alternatives do not replace its contents.'],
 ['re-retell','What does “retell” a story mean?','tell it again','forget its ending','change every character','Retell repeats telling; it need not change the characters or forget details.'],
 ['re-rebuild','A wall fell. What does “rebuild” mean?','build it again','knock it down','paint it red','Rebuild repeats construction, rather than destruction or color change.'],
 ['re-replay','The song has ended. What does “replay” mean?','play it again','play it louder','choose another song','Replay repeats the same performance; louder or different is not implied.'],
 ['re-rewrite','What does “rewrite” the note mean?','write it again','hide it away','read it aloud','Rewrite repeats writing; hiding and reading do not write a new version.'],
 ['re-reuse','What does “reuse” a box mean?','use it again','throw it away','buy another box','Reuse gives the same box another use; buying another replaces it.'],
 ['re-repaint','What does “repaint” the door mean?','paint it again','remove the door','open the door','Repaint repeats painting; removing or opening does not change paint.'],
 ['re-reopen','The shop shut. What does “reopen” mean?','open it again','keep it shut','move it elsewhere','Reopen reverses a closure by opening again; it does not mean moving.'],
]);
direct('lp3.prefixes_suffixes.l1.C.suffix_ful.v103', [
 ['ful-careful','What does “careful” mean?','taking plenty of care','taking no care','needing someone’s care','Careful describes care taken in acting; needing care describes the recipient.'],
 ['ful-helpful','A helpful person is ready to do what?','give useful help','ask for all the help','refuse to help','Helpful describes offering help rather than requesting or refusing it.'],
 ['ful-colorful','What does “colorful” mean?','having many colors','having no colors','being one pale color','Colorful means rich in color; the alternatives reduce or remove it.'],
 ['ful-playful','A playful puppy is full of what?','a wish to play','a wish to sleep','a need to hide','Playful describes readiness for play, not sleep or concealment.'],
 ['ful-peaceful','What does “peaceful” mean?','calm and without fighting','noisy and full of fighting','busy and in a hurry','Peaceful expresses peace; fighting contradicts it and hurry is a different state.'],
 ['ful-painful','A painful cut causes what?','a lot of pain','no pain at all','a feeling of hunger','Painful describes causing pain; hunger is unrelated and no pain is the opposite.'],
 ['ful-fearful','What does “fearful” mean?','feeling a lot of fear','feeling no fear','wanting to cause fear','Fearful describes the person’s fear; causing fear is a different relationship.'],
 ['ful-cheerful','A cheerful person is full of what?','a happy mood','an angry mood','a sleepy feeling','Cheerful describes good spirits; anger and sleepiness do not express cheer.'],
 ['ful-thoughtful','A thoughtful gift shows what?','careful thought for someone','no thought about someone','a wish to get the gift back','Thoughtful describes consideration in choosing; the alternatives do not show it.'],
]);
direct('lp3.prefixes_suffixes.l1.A.suffix_less.v104', [
 ['less-toothless','A baby has no teeth. Which word fits?','toothless','toothy','teething','Less means without; toothy has visible teeth and teething means teeth are growing.'],
 ['less-shoeless','A child wears no shoes. Which word fits?','shoeless','shoes','shoelaces','Shoeless means without shoes; shoes and shoelaces name objects rather than this state.'],
 ['less-homeless','A family has no home. Which word describes that?','homeless','homely','homeward','Homeless means without a home; homely describes a quality and homeward a direction.'],
 ['less-sleeveless','A shirt has no sleeves. Which word fits?','sleeveless','sleeved','sleeves','Sleeveless means without sleeves; sleeved has sleeves and sleeves names the parts.'],
 ['less-seedless','These grapes have no seeds. Which word fits?','seedless','seeded','seeding','Seedless means without seeds; seeded and seeding do not mean their absence.'],
 ['less-cloudless','There are no clouds today. The sky is ___.','cloudless','cloudy','clouded','Cloudless means without clouds; cloudy and clouded mean clouds are present.'],
 ['less-harmless','What does harmless mean?','not causing harm','not needing food','not moving around','Harmless means not causing harm; it does not remove ordinary needs or movement.'],
 ['less-helpless','Someone helpless cannot do what alone?','help themselves','feel anything','speak clearly','Helpless concerns ability to manage without help; it does not mean loss of feeling or speech.'],
 ['less-careless','What does “careless” mean?','not taking enough care','taking plenty of care','asking someone for care','Careless means acting without due care; receiving care is a different relationship.'],
]);
direct('lp3.prefixes_suffixes.l1.B.suffix_er_person.v105', [
 ['er-painter','What is a painter?','someone who paints','a place for paint','something painted','Er names the person doing the action, not the location or product.'],
 ['er-farmer','What is a farmer?','someone who works a farm','a building on a farm','food grown on a farm','Farmer names the person; the alternatives name a place or product.'],
 ['er-reader','The reader opened her book. Who is the reader?','someone who reads','a book to read','a place to read','Here reader names the person doing the reading; book and place are different roles.'],
 ['er-singer','What is a singer?','someone who sings','a song to sing','a room for singing','Singer names the performer, rather than the song or room.'],
 ['er-builder','What is a builder?','someone who builds','something already built','a tool used to build','Builder names the person doing construction, not its result or a tool.'],
 ['er-swimmer','Who is a swimmer?','a person who swims','a pool for swimming','a suit for swimming','Swimmer names the person; the pool and suit support the activity.'],
 ['er-dancer','What is a dancer?','someone who dances','music for a dance','a floor for dancing','Dancer names the performer, not the music or floor.'],
 ['er-driver','What is a driver?','someone who drives','a road for driving','a car being driven','Driver names the person controlling the vehicle; road and car are not people.'],
 ['er-baker','What is a baker?','someone who bakes','bread already baked','an oven for baking','Baker names the person, not the baked product or equipment.'],
]);
cloze('mock.depth.affix-careless', [
 ['affix-unlocked','The gate had been locked. Dad turned the key and it could open.','unlocked','relocked','locking','Un reverses locking; relocked would secure the gate again and locking is the process.','Which word describes the gate now?'],
 ['affix-reheated','Our soup cooled, so the cook warmed it a second time.','reheated','preheated','unheated','Reheated means heated again; preheated is before use and unheated means not heated.','Which word describes what the cook did?'],
 ['affix-thankful','A neighbor brought the lost puppy home. Its owner wanted to express thanks.','thankful','thankless','thanking','Thankful describes feeling gratitude; thankless lacks gratitude or appreciation, and thanking names the action.','Which word describes the owner’s feeling?'],
 ['affix-restless','Milo kept shifting in bed and could not settle down to rest.','restless','rested','restful','Restless means unable to rest calmly; rested and restful describe the opposite condition.','Which word describes Milo?'],
 ['affix-predict','Before the race began, the reporter said which runner would win.','predicted','repeated','prevented','Predicting states an expected future result; preventing stops something from happening and repeating says something again.','Which word describes the reporter’s action?'],
 ['affix-misread','Jo read the sign as “closed,” but it actually said “close.”','misread','reread','unread','Misread means read wrongly; reread is reading again and unread means not read.','Which word describes Jo’s mistake?'],
 ['affix-washable','The label says the cover can be washed without being damaged.','washable','washed','washing','Able marks possibility: washable can be washed; washed and washing describe actions or states.','Which word describes the cover?'],
 ['affix-kindness','Ana shared her lunch with someone who had forgotten theirs.','kindness','unkindness','kindest','Ness turns kind into the name of a quality; unkindness reverses it and kindest compares people.','Which word names the quality of Ana’s action?'],
]);

direct('lp3.antonyms_synonyms.l1.A.antonym_concrete.v1', [
 ['opposite-go-stop','Which pair has opposite meanings?','go — stop','go — travel','go — move','Stop ends movement; travel and move describe forms of going.'],
]);
direct('lp3.antonyms_synonyms.l1.A.synonym_concrete.v1', [
 ['same-speak-talk','Find two words that mean the same.','speak — talk','speak — listen','speak — whisper','Speak and talk name using words aloud; listen receives words and whisper is one quieter kind.'],
 ['same-tug-pull','Find two words that mean the same.','tug — pull','tug — push','tug — lift','Tug means pull, usually sharply; pushing and lifting move in different ways.'],
]);
direct('lp3.antonyms_synonyms.l1.A.antonym_picture.v1', [
 ['opposite-give-take','Which pair has opposite meanings?','give — take','give — offer','give — hand over','Give transfers away and take transfers toward oneself; the others describe giving.'],
 ['opposite-win-lose','Which pair has opposite meanings?','win — lose','win — succeed','win — triumph','Losing is opposite to winning; succeeding and triumphing describe success.'],
]);
direct('lp3.antonyms_synonyms.l1.A.synonym_picture.v1', [
 ['same-neat','The desk is neat. Which word means the same as neat?','tidy','messy','empty','Tidy means arranged neatly; empty describes contents and messy is the opposite.'],
]);
direct('lp3.antonyms_synonyms.l2.A.antonym_precise.v1', [
 ['opposite-reduce','Which is the opposite of reduce?','increase','decrease','lessen','Increase makes an amount larger; decrease and lessen both reduce it.'],
]);
direct('lp3.antonyms_synonyms.l2.A.synonym_shade.v1', [
 ['same-murmur','Which word is closest to murmur?','mutter','announce','shout','Mutter and murmur both describe low, quiet speech; announce and shout are not quiet in the same way.'],
]);
cloze('lp3.antonyms_synonyms.l2.A.antonym_in_context.v1', [
 ['opposite-entered','One visitor entered the room; another did the opposite and ___.','exited','approached','explored','Exited reverses entering; approaching or exploring does not mean leaving.','Which opposite word fits?'],
]);
cloze('lp3.antonyms_synonyms.l2.A.synonym_in_context.v1', [
 ['same-selected','Rae selected a book. She ___ it from the shelf.','chose','rejected','returned','Selected and chose describe making a choice; rejecting and returning describe different actions.','Which same-meaning word fits?'],
]);
direct('mock.depth.antonym_concrete-borrow', [
 ['opposite-advance-retreat','Which pair has opposite meanings?','advance — retreat','advance — proceed','advance — approach','Retreat moves back; proceed and approach continue movement forward or toward something.'],
 ['opposite-arrive-depart','Which pair has opposite meanings?','arrive — depart','arrive — reach','arrive — enter','Depart means leave while arrive means reach a place; reaching and entering are associated with arrival.'],
 ['opposite-increase-decrease','Which pair has opposite meanings?','increase — decrease','increase — grow','increase — expand','Decrease reduces quantity or size; grow and expand increase it.'],
 ['opposite-include-exclude','Which pair has opposite meanings?','include — exclude','include — contain','include — involve','Exclude leaves out; contain and involve both bring something into the group or activity.'],
 ['opposite-accept-refuse','Which pair has opposite meanings?','accept — refuse','accept — agree','accept — receive','Refuse declines what accepting allows; agree and receive relate to acceptance.'],
 ['opposite-attach-detach','Which pair has opposite meanings?','attach — detach','attach — connect','attach — fasten','Detach separates; connect and fasten join as attach does.'],
 ['opposite-permit-forbid','Which pair has opposite meanings?','permit — forbid','permit — allow','permit — authorize','Forbid prevents permission; allow and authorize grant it.'],
 ['opposite-gather-scatter','Which pair has opposite meanings?','gather — scatter','gather — collect','gather — assemble','Scatter spreads apart; collect and assemble bring together.'],
]);
direct('mock.depth.antonym_picture-borrow', [
 ['opposite-flexible-rigid','Which pair has opposite meanings?','flexible — rigid','flexible — bendable','flexible — pliable','Rigid resists bending; bendable and pliable share flexibility.'],
 ['opposite-fragile-durable','Which pair has opposite meanings?','fragile — durable','fragile — delicate','fragile — breakable','Durable resists damage; delicate and breakable describe fragility.'],
 ['opposite-opaque-transparent','Which pair has opposite meanings?','opaque — transparent','opaque — cloudy','opaque — solid-colored','Transparent allows a clear view through; opaque blocks it, and the alternatives also obscure the view.'],
 ['opposite-gradual-sudden','Which pair has opposite meanings?','gradual — sudden','gradual — slow','gradual — step by step','Sudden happens all at once; slow and step by step describe gradual change.'],
 ['opposite-generous-stingy','Which pair has opposite meanings?','generous — stingy','generous — giving','generous — sharing','Stingy means unwilling to give; giving and sharing express generosity.'],
 ['opposite-frequent-rare','Which pair has opposite meanings?','frequent — rare','frequent — common','frequent — regular','Rare means seldom happening; common and regular indicate repeated occurrence.'],
 ['opposite-cautious-reckless','Which pair has opposite meanings?','cautious — reckless','cautious — careful','cautious — watchful','Reckless disregards danger; careful and watchful share caution.'],
 ['opposite-temporary-permanent','Which pair has opposite meanings?','temporary — permanent','temporary — short-lived','temporary — brief','Permanent continues; brief and short-lived describe limited duration.'],
]);
direct('mock.depth.synonym_concrete-reluctant', [
 ['same-cautious-careful','Find two words that mean the same.','cautious — careful','cautious — fearless','cautious — curious','Careful shares caution; fearless concerns lack of fear and curious concerns wanting to know.'],
 ['same-rapid-swift','Find two words that mean the same.','rapid — swift','rapid — steady','rapid — delayed','Rapid and swift mean fast; steady describes consistency and delayed means late.'],
 ['same-assist-help','Find two words that mean the same.','assist — help','assist — watch','assist — hinder','Help shares assist’s meaning; watching does not necessarily help and hindering impedes.'],
 ['same-permit-allow','Find two words that mean the same.','permit — allow','permit — demand','permit — refuse','Allow gives permission; demand requires an action and refuse denies it.'],
 ['same-scarce-rare','Find two words that mean the same.','scarce — rare','scarce — enough','scarce — plentiful','Rare and scarce mean not common or not plentiful; the other choices describe sufficient or abundant supply.'],
 ['same-ordinary-usual','Find two words that mean the same.','ordinary — usual','ordinary — special','ordinary — surprising','Usual matches ordinary; special and surprising distinguish something from what is normal.'],
 ['same-fortunate-lucky','Find two words that mean the same.','fortunate — lucky','fortunate — skilled','fortunate — wealthy','Lucky expresses good fortune; skill and wealth do not themselves mean luck.'],
 ['same-timid-shy','Find two words that mean the same.','timid — shy','timid — bold','timid — relaxed','Shy shares lack of confidence; bold is the opposite and relaxed means at ease.'],
]);
direct('mock.depth.synonym_picture-reluctant', [
 ['same-vacant','The vacant room had nobody in it. Which word means vacant here?','empty','crowded','silent','Vacant means unoccupied; a silent room may still contain people and crowded is the opposite.'],
 ['same-sturdy','The sturdy chair held a heavy load. Which word means sturdy?','strong','heavy','delicate','Sturdy means strong enough to hold up; heavy is its weight and delicate suggests fragility.'],
 ['same-weary','After the long walk, I felt weary. Which word means weary?','tired','rested','eager','Weary means tired; rested and eager describe different states.'],
 ['same-soaked','Rain soaked my coat completely. Which word means soaked?','drenched','damp','dry','Drenched means thoroughly wet; damp means only slightly wet and dry means not wet.'],
 ['same-glum','He looked glum after the loss. Which word means glum?','unhappy','cheerful','sleepy','Glum describes unhappiness; cheerfulness is opposite and sleepiness is a different state.'],
 ['same-gleaming','The polished cup was gleaming. Which word means gleaming?','shining','fading','tarnished','Gleaming means shining brightly; fading loses brightness and tarnished metal has lost its shine.'],
 ['same-parched','My parched throat needed water. Which word means parched?','very dry','slightly cool','quite sore','Parched means extremely dry; soreness and coolness do not supply the moisture meaning.'],
 ['same-cramped','We could hardly move in the cramped space. What does cramped mean?','too small for comfort','wide and open','full of fresh air','Cramped concerns insufficient room to move; air freshness is unrelated and wide open is opposite.'],
]);

cloze('lp3.homophones_homonyms.l1.A.sea_see.v1', [
 ['sea-waves','Waves broke on the beach beside the ___.','sea','see','seed','Sea names the salt water beside the beach; see is a looking action and seed is a plant part.','Which spelling fits?'],
 ['sea-sailing','The ship left the harbor for the open ___.','sea','see','seal','Open sea is the water beyond the harbor; see and seal do not name it.','Which spelling fits?'],
 ['see-telescope','Through the telescope, I could ___ the tiny star.','see','sea','sew','See means observe with the eyes; sea names water and sew joins fabric.','Which spelling fits?'],
 ['see-curtain','Opening the curtains lets us ___ outside.','see','sea','seen','See completes the present action after lets us; sea names water and seen is a different verb form.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.sun_son.v1', [
 ['sun-shadow','Our shadows grew as the ___ sank.','sun','son','soon','The setting sun changes shadows; son names a child and soon refers to time.','Which spelling fits?'],
 ['sun-cloud','A cloud hid the ___, making the playground darker.','sun','son','sum','The sun provides daylight; son names a child and sum is a total.','Which spelling fits?'],
 ['son-family','Mum has a daughter and a ___.','son','sun','song','Son names a male child in a family; sun and song have different meanings.','Which spelling fits?'],
 ['son-parent','The father held his baby ___ gently.','son','sun','soon','A parent’s male child is a son; sun names the star and soon is time.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.be_bee.v1', [
 ['bee-flower','The buzzing ___ gathered nectar from a flower.','bee','be','bean','A bee gathers nectar; be is a verb and bean names a plant seed.','Which spelling fits?'],
 ['bee-hive','A ___ flew home to the hive.','bee','be','bead','A bee lives in a hive; be and bead do not name the flying insect.','Which spelling fits?'],
 ['be-quiet','Please ___ quiet while the baby sleeps.','be','bee','been','Be is the requested form after please; bee names an insect and been is another verb form.','Which spelling fits?'],
 ['be-future','I want to ___ a doctor someday.','be','bee','being','Be follows want to; bee names an insect and being is not the required form.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.no_know.v1', [
 ['no-empty','The basket was empty; ___ apples remained.','no','know','now','No marks zero apples; know means understand and now indicates time.','Which spelling fits?'],
 ['no-answer','Asked if she was tired, she answered ___.','no','know','new','No is a negative answer; know means understand and new means not old.','Which spelling fits?'],
 ['know-fact','I ___ the answer, so I raised my hand.','know','no','now','Know means have the answer in mind; no denies and now refers to time.','Which spelling fits?'],
 ['know-name','We just met; I do not ___ your name.','know','no','known','Know means be aware of the name; no is negative and known is a different verb form.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.one_won.v1', [
 ['one-last','All but ___ candle had gone out.','one','won','own','One names the remaining quantity; won is past winning and own means possess.','Which spelling fits?'],
 ['one-only','The sign allows just ___ person at a time.','one','won','once','One names the permitted number; won names winning and once means one time.','Which spelling fits?'],
 ['won-medal','Our runner finished first and ___ the race.','won','one','win','Won is past winning; one is a number and win is not past tense.','Which spelling fits?'],
 ['won-game','They scored most points and ___ the game.','won','one','own','Won names their victory; one is a number and own means possess.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.ate_eight.v1', [
 ['ate-before','Yesterday, I ___ breakfast before walking to school.','ate','eight','eat','Ate is the past action of eating; eight is a number and eat is not past tense.','Which spelling fits?'],
 ['ate-leftovers','Only crumbs remained because the mouse ___ the biscuit.','ate','eight','late','Ate explains eating the biscuit; eight is a number and late describes time.','Which spelling fits?'],
 ['eight-clock','The clock struck ___ times at that hour.','eight','ate','eaten','Eight supplies a number of strikes; ate and eaten are eating forms.','Which spelling fits?'],
 ['eight-count','The count went seven, ___, nine.','eight','ate','eighty','Eight lies between seven and nine; ate is an eating action and eighty is a different number.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.hear_here.v1', [
 ['hear-whisper','Come closer so you can ___ my whisper.','hear','here','heard','Hear means detect a sound; here names a place and heard is a different verb form.','Which spelling fits?'],
 ['hear-bells','From far away, we could ___ the bells.','hear','here','hears','Hear follows could and means detect sound; here names a place and hears has a different ending.','Which spelling fits?'],
 ['here-seat','Sit right ___ beside me.','here','hear','hair','Here identifies the nearby place; hear concerns sound and hair is part of the body.','Which spelling fits?'],
 ['here-map','On the map, this dot means “You are ___.”','here','hear','hearing','Here identifies the current place; hear and hearing refer to listening.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l1.A.blue_blew.v1', [
 ['blue-paint','White paint made the dark ___ paint paler.','blue','blew','blow','Blue names a color that can become paler; blew and blow name actions.','Which spelling fits?'],
 ['blue-color','The sky was bright ___ after the clouds cleared.','blue','blew','blown','Blue describes the sky’s color; blew and blown are forms of blow.','Which spelling fits?'],
 ['blew-candles','She took a breath and ___ out the candle.','blew','blue','blow','Blew is the past action of blowing; blue is a color and blow is not past tense.','Which spelling fits?'],
 ['blew-leaves','A sudden gust ___ the leaves across the path.','blew','blue','blowing','Blew describes the gust’s completed action; blue names color and blowing is not the required form.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.to_two_too.v1', [
 ['to-recipient','The note was addressed ___ the school cook.','to','two','too','To marks the recipient; two is a number and too means also or excessively.','Which spelling fits?'],
 ['two-pair','The pair of gloves contained ___ separate gloves.','two','to','too','Two names the quantity in a pair; to and too do not name a number.','Which spelling fits?'],
 ['too-also','I packed a snack, and my friend packed one ___.','too','two','to','Too means also; two names a quantity and to introduces a direction or recipient.','Which spelling fits?'],
 ['too-degree','The shelf was ___ high for me to reach.','too','to','two','Too means excessively high here; the other spellings do not express that degree.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.there_their.v1', [
 ['their-team','The runners collected ___ medals after the race.','their','there','they','Their marks medals belonging to the runners; there is place and they names the people.','Which spelling fits?'],
 ['there-location','Leave the parcel over ___ by the green door.','there','their','them','There points to a location; their marks ownership and them names people or things.','Which spelling fits?'],
 ['their-return','The neighbors lent us ___ ladder and later came to collect it.','their','there','they’re','Their identifies the ladder’s owners; there names place and they’re means they are.','Which spelling fits?'],
 ['there-exists','When we lifted the lid, ___ was a note inside.','there','their','they’re','There was introduces what existed inside; the other spellings do not complete this construction.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.right_write.v1', [
 ['right-hand','Your left hand is opposite your ___ hand.','right','write','ride','Right names the side opposite left; write is making words and ride is traveling on something.','Which spelling fits?'],
 ['write-message','The keyboard broke, so I had to ___ the note by hand.','write','right','wrote','Write follows had to and means form written words; right is a direction and wrote is past tense.','Which spelling fits?'],
 ['right-correct','I checked the sum twice and found it was ___.','right','write','written','Right means correct here; write and written concern forming words.','Which spelling fits?'],
 ['write-author','To enter the contest, children must ___ an original story.','write','right','writer','Write names creating the story; right is a direction or correctness and writer names a person.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.new_knew.v1', [
 ['new-unopened','The unopened packet contained a ___ toothbrush.','new','knew','know','New describes an unused object; knew and know concern knowledge.','Which spelling fits?'],
 ['knew-familiar','Having walked this route before, I ___ where to turn.','knew','new','known','Knew is past knowledge of the route; new describes novelty and known is a different form.','Which spelling fits?'],
 ['new-replacement','The old handle broke, and we fitted a ___ one.','new','knew','news','New describes the replacement; knew means understood and news is information.','Which spelling fits?'],
 ['knew-secret','Before the surprise, only the organizers ___ the plan.','knew','new','knowing','Knew describes past awareness; new is a property and knowing is not the required finite verb.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.hour_our.v1', [
 ['hour-duration','Sixty minutes passed, so we had waited an ___.','hour','our','ours','Hour names sixty minutes; our and ours express ownership.','Which spelling fits?'],
 ['our-belonging','We built the shelter together, so it was ___ shelter.','our','hour','ours','Our comes before a noun to mark shared ownership; hour is time and ours stands alone.','Which spelling fits?'],
 ['hour-schedule','The lesson begins at ten and lasts until eleven: one ___.','hour','our','hours','Hour is the singular time unit after one; our is ownership and hours is plural.','Which spelling fits?'],
 ['our-class','The speaker asked all of us to raise ___ hands.','our','hour','ours','Our connects hands to us; hour names time and ours does not precede hands.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.flower_flour.v1', [
 ['flower-bee','The bee landed on a ___ and gathered nectar.','flower','flour','flow','Flower names the bloom with nectar; flour is ground grain and flow names movement.','Which spelling fits?'],
 ['flour-dough','The baker mixed ground wheat ___ with water to make dough.','flour','flower','floor','Flour is the powdered grain used in dough; flower and floor have different meanings.','Which spelling fits?'],
 ['flower-stem','A red ___ opened at the top of the green stem.','flower','flour','flowed','Flower names the opening bloom; flour is powder and flowed is a verb.','Which spelling fits?'],
 ['flour-dust','Fine white ___ puffed from the torn baking bag.','flour','flower','floor','Flour is the fine baking powder from grain; flower and floor do not fit the dust-like material.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.would_wood.v1', [
 ['wood-material','The carpenter sanded a rough piece of ___.','wood','would','wooden','Wood is the material; would is an auxiliary and wooden is an adjective.','Which spelling fits?'],
 ['would-polite','___ you please hold the door while I carry this?','Would','Wood','Woods','Would forms a polite request; wood and woods name material or trees.','Which spelling fits?'],
 ['wood-fire','Dry ___ burned steadily in the campfire.','wood','would','wooden','Wood is the burnable material; would and wooden cannot name it here.','Which spelling fits?'],
 ['would-condition','If it stopped raining, we ___ play outside.','would','wood','woods','Would expresses the possible result of a condition; wood and woods name material or places.','Which spelling fits?'],
]);
cloze('lp3.homophones_homonyms.l2.A.made_maid.v1', [
 ['made-built','Yesterday, we ___ a model bridge using cardboard and tape.','made','maid','make','Made is the past action of creating; maid names a worker and make is present tense.','Which spelling fits?'],
 ['maid-hotel','The hotel ___ cleaned the room and changed the sheets.','maid','made','maker','Maid names a worker doing household cleaning; made is an action and maker creates objects.','Which spelling fits?'],
 ['made-decision','After comparing the routes, the group ___ its choice.','made','maid','making','Made completes the past expression made a choice; maid names a worker and making is not the required form.','Which spelling fits?'],
 ['maid-story','In the story, a ___ worked in the queen’s household.','maid','made','make','Maid names the household worker; made and make describe creating.','Which spelling fits?'],
]);
direct('lp3.homophones_homonyms.l2.A.homonym_bat.v1', [
 ['bat-animal-flight','Which sentence uses bat to mean the animal?','The bat spread its wings and flew out.','The batter gripped the bat with both hands.','The wooden bat rested beside the ball.','Spreading wings and flying identifies the mammal; gripping and wooden describe sports equipment.'],
 ['bat-animal-food','Which sentence uses bat to mean the animal?','A bat caught a moth above the pond.','A bat struck the ball over the fence.','A bat lay across the team’s kit bag.','Catching a moth as food identifies the animal; the other sentences describe equipment.'],
 ['bat-animal-roost','Which sentence uses bat to mean the animal?','The bat clung to the roof of the cave.','The bat slipped from the player’s hands.','The bat broke when the ball hit it.','Clinging to a cave roof is animal behavior; the other uses refer to a sports bat.'],
 ['bat-animal-young','Which sentence uses bat to mean the animal?','The mother bat carried her baby beneath a wing.','The new bat had tape around its handle.','The damaged bat was replaced before the match.','A mother with a wing and baby is an animal; handles and match equipment are the other sense.'],
 ['bat-tool-handle','Which sentence uses bat to mean sports equipment?','The player wrapped fresh tape around the bat’s handle.','The bat folded its wings against its body.','The bat chased insects in the evening air.','A taped handle identifies equipment; wings and insect hunting identify the animal.'],
 ['bat-tool-hit','Which sentence uses bat to mean sports equipment?','A swing of the bat sent the ball toward the boundary.','The bat swooped between two trees after sunset.','The bat hung upside down from a branch.','Hitting a ball with a swing identifies the sports tool; the other actions describe a mammal.'],
 ['bat-tool-repair','Which sentence uses bat to mean sports equipment?','The coach replaced the bat because its wood had cracked.','The bat slept until the light began to fade.','The bat opened its mouth to catch a moth.','Cracked wood identifies a manufactured tool; sleeping and feeding identify the animal.'],
 ['bat-tool-storage','Which sentence uses bat to mean sports equipment?','After practice, I stored the bat with my gloves and ball.','A bat found shelter in a narrow roof space.','The bat returned to its colony before dawn.','Storing it with a ball and gloves identifies the sports bat; shelter and colony concern the animal.'],
]);
direct('lp3.homophones_homonyms.l2.A.homonym_ring.v1', [
 ['ring-sound-phone','Which sentence uses ring to mean a sound?','The phone’s ring interrupted our quiet game.','She twisted the silver ring around her finger.','The jeweler measured the ring before repairing it.','A phone interrupting silence produces a sound; fingers and jewelry repair identify the object.'],
 ['ring-sound-door','Which sentence uses ring to mean a sound?','At the doorbell’s first ring, the dog woke up.','A tiny diamond glittered on the gold ring.','The ring fitted neatly inside the velvet box.','The doorbell waking a dog supplies auditory evidence; diamonds and a box describe jewelry.'],
 ['ring-sound-school','Which sentence uses ring to mean a sound?','The bell’s ring told us that the break had ended.','The loose ring slipped off into the sink.','A smooth ring covered the mark on her finger.','A bell announcing a time produces a sound; the other rings are worn objects.'],
 ['ring-sound-metal','Which sentence uses ring to mean a sound?','The metal bowl gave a clear ring when tapped.','The ring was polished until its stone shone.','She carried the ring in a small cloth pouch.','A tapped bowl’s ring is its sound; polishing and carrying refer to jewelry.'],
 ['ring-jewel-fit','Which sentence uses ring to mean jewelry?','The ring was too tight to slide past her knuckle.','The alarm’s ring brought everyone to the door.','A distant ring echoed from the church bell.','Fit around a knuckle identifies jewelry; alarms and bells make sounds.'],
 ['ring-jewel-stone','Which sentence uses ring to mean jewelry?','A green stone was set into the ring.','The ring of the telephone stopped suddenly.','We waited for the bell’s final ring.','A stone set into a ring describes a wearable object; the other uses name sounds.'],
 ['ring-jewel-lost','Which sentence uses ring to mean jewelry?','She searched the grass for the ring lost from her finger.','The sharp ring of the timer ended the game.','The doorbell’s ring sent the puppy running.','A finger-worn ring can be lost in grass; timers and doorbells produce sounds.'],
 ['ring-jewel-gift','Which sentence uses ring to mean jewelry?','Grandma gave me a silver ring in a tiny box.','The school bell’s ring carried across the field.','A long ring came from the old telephone.','Silver and a gift box identify jewelry; bells and telephones identify sounds.'],
]);


cloze('mock.depth.context_clues.bank', [
 ['clue-basin','The children washed clay from their hands in a basin, a wide bowl that held warm water. They dipped their fingers below the surface and rubbed off the mud.','a wide bowl','a narrow pipe','a dry towel','The phrase after the comma directly defines basin; dipping hands confirms it holds water.','What does basin mean here?'],
 ['clue-cargo','The ship carried cargo, the goods being moved from one place to another. Workers lifted boxes of fruit off the deck and loaded crates of tools for the next port.','goods being moved','people steering a ship','the ship’s resting place','The definition and examples of fruit and tools identify transported goods.','What does cargo mean here?'],
 ['clue-sapling','Beside the huge oak stood a sapling, a young tree with a thin trunk. Its few small branches bent in the breeze. A stake helped it stay upright while its roots grew.','a young tree','a fallen branch','a climbing vine','The definition young tree is supported by its thin trunk, small branches and developing roots.','What does sapling mean here?'],
 ['clue-burrow','The rabbit slipped into its burrow, a tunnel or hole dug into the ground. It disappeared below the grass. The fox could not follow it into the narrow underground passage.','an underground hole or tunnel','a nest high in a tree','a patch of tall grass','The direct definition and underground passage show that burrow is a dug shelter.','What does burrow mean here?'],
 ['clue-ledge','The bird rested on a ledge, a narrow flat shelf of rock sticking out from the cliff. There was just enough space for its feet. The cliff dropped steeply below it.','a narrow shelf of rock','a deep crack in rock','a loose pile of stones','The definition and tiny standing surface identify a projecting rock shelf.','What does ledge mean here?'],
 ['clue-reservoir','After the dry summer, workers checked the reservoir, a large place where water is stored. Rain would refill it. Pipes carried its stored water to homes in the town.','a place that stores water','a machine that cleans streets','a stream that flows uphill','The definition and later reference to stored water identify the reservoir’s function.','What does reservoir mean here?'],
 ['clue-canopy','Rain pattered on the canopy, a covering stretched above the market stall. The cloth kept the fruit and the seller dry. Customers stepped beneath it to escape the shower.','a covering stretched overhead','a basket holding fruit','a path between stalls','The direct definition and shelter beneath the cloth identify an overhead covering.','What does canopy mean here?'],
 ['clue-debris','After the storm, debris, or scattered broken pieces, covered the path. The helpers collected bits of roof tile, snapped twigs and smashed pots. Soon the path was clear again.','scattered broken pieces','freshly planted flowers','water running downhill','The phrase after or defines debris, and the listed fragments support that meaning.','What does debris mean here?'],
]);
cloze('mock.depth.context_clues.shelter', [
 ['clue-tools','Before fixing the gate, Dad gathered his tools. He put a hammer, a saw and a screwdriver beside the wood. Each would help him do a different part of the repair.','things used to do a job','parts that need repairing','places to keep wood','Hammer, saw and screwdriver are examples of tools used for repair.','What does tools mean here?'],
 ['clue-vehicles','The class counted vehicles passing the school. A bus stopped, two bicycles rolled past and a delivery van turned the corner. Each carried someone or something along the road.','things that carry people or goods','places beside a road','people waiting at a stop','Bus, bicycles and van exemplify transport, reinforced by what they carry.','What does vehicles mean here?'],
 ['clue-ingredients','Mum checked the ingredients before making soup. Carrots, onions, beans and water were ready on the bench. She would put them together in the pot to make the meal.','foods and other things used in a recipe','tools used to stir a meal','steps written in a recipe','The carrots, onions, beans and water are the things combined to make the soup.','What does ingredients mean here?'],
 ['clue-instruments','The musicians unpacked their instruments. One lifted a violin, another opened a flute case and a third set up a drum. Soon their different sounds filled the room.','objects used to make music','people who listen to music','rooms where music is played','Violin, flute and drum exemplify objects played to produce music.','What does instruments mean here?'],
 ['clue-habitats','The book showed animals in their habitats. A frog sat in a pond, a camel walked across a desert and a squirrel climbed a forest tree. Each animal was shown where it normally lived.','places where living things normally live','foods that animals search for','ways animals move around','Pond, desert and forest are living places; the final sentence confirms that relation.','What does habitats mean here?'],
 ['clue-containers','We needed containers for the picnic food. Jam went into a jar, juice filled a bottle and bread fitted into a box. Nothing had to be carried loose in our hands.','things used to hold other things','things used to cut food','things that make food warm','Jar, bottle and box are examples of objects that hold the food and drink.','What does containers mean here?'],
 ['clue-fasteners','The display showed different fasteners. A button held a shirt closed, a zip joined the sides of a bag and a buckle secured a belt. All kept things joined or shut.','things that join or secure parts','things that measure length','things that make holes','Button, zip and buckle exemplify devices that hold parts together.','What does fasteners mean here?'],
 ['clue-footwear','The shop sold footwear for different days. Boots waited near the door, sandals filled a summer shelf and trainers stood beside sports socks. Customers tried them on their feet.','things worn on the feet','things carried in the hands','things worn over a coat','Boots, sandals and trainers are examples worn on feet.','What does footwear mean here?'],
]);
cloze('mock.depth.context_clues.hesitated', [
 ['clue-inspected','Before taking the bicycle home, the mechanic inspected it. She looked closely at both tires, tested the brakes and checked each loose bolt. Only then did she say it was ready.','examined carefully','carried quickly','decorated brightly','The careful looking, testing and checking show what inspected means.','What does inspected mean here?'],
 ['clue-stumbled','A root caught Ben’s toe as he crossed the path. He stumbled, threw his arms forward and nearly fell. He steadied himself against the fence before taking another step.','lost his balance while walking','stopped to look around','jumped over something easily','Catching a toe, nearly falling and regaining balance show a stumble.','What does stumbled mean here?'],
 ['clue-hoisted','The sail lay low on the deck. Two sailors pulled hard on the rope and hoisted it. Up it rose along the tall pole until the wind filled it above their heads.','lifted it upward','folded it into a pile','pushed it underwater','The sail rises as the sailors pull, establishing upward lifting.','What does hoisted mean here?'],
 ['clue-peered','The tiny print was hard to see in the dim room. Ava leaned close and peered at the label. She narrowed her eyes until she could make out the small letters.','looked closely with effort','called out loudly','moved away in a hurry','Leaning close and narrowing the eyes to read show careful effortful looking.','What does peered mean here?'],
 ['clue-shivered','Cold wind blew through Tom’s wet coat. He shivered; his shoulders shook and his teeth clicked together. He wrapped a dry blanket around himself and moved toward the fire.','shook because he was cold','sweated because he was hot','stretched because he was tired','The cold, shaking shoulders and chattering teeth establish shivering.','What does shivered mean here?'],
 ['clue-beckoned','The room was noisy, so Mia did not call across it. She beckoned to her friend, curling her fingers toward herself. Her friend saw the signal and came over.','signaled someone to come closer','warned someone to stay away','asked everyone to be quiet','The inward hand signal and approaching friend reveal beckoned.','What does beckoned mean here?'],
 ['clue-ambled','There was no need to hurry. The friends ambled along the river, stopping now and then to watch a duck or admire a leaf. Their slow walk lasted all afternoon.','walked slowly and easily','ran as fast as possible','waited without moving','The absence of hurry, leisurely stops and slow walk establish ambled.','What does ambled mean here?'],
 ['clue-clutched','A gust tugged at the paper map. Leo clutched it, pressing his fingers tightly around both edges. Even when the wind blew harder, he did not let it slip away.','held tightly','folded neatly','threw suddenly','Tight fingers and preventing the map from escaping show a firm grip.','What does clutched mean here?'],
]);

const relationSets = [
 ['mock.relations.same-everyday','same-sets-1',[['begin','start'],['shut','close'],['gift','present']]],
 ['mock.relations.same-everyday','same-sets-2',[['stone','rock'],['ill','sick'],['road','street']]],
 ['mock.relations.same-everyday','same-sets-3',[['angry','mad'],['child','kid'],['under','below']]],
 ['mock.relations.same-everyday','same-sets-4',[['finish','end'],['scared','afraid'],['insect','bug']]],
 ['mock.relations.same-everyday','same-sets-5',[['jump','leap'],['reply','answer'],['smell','scent']]],
 ['mock.relations.same-everyday','same-sets-6',[['house','home'],['large','big'],['neat','tidy']]],
 ['mock.relations.same-everyday','same-sets-7',[['shop','store'],['laugh','giggle'],['friend','pal']]],
 ['mock.relations.same-precise','same-sets-8',[['select','choose'],['purchase','buy'],['repair','mend']]],
 ['mock.relations.same-precise','same-sets-9',[['brief','short'],['silent','quiet'],['distant','faraway']]],
 ['mock.relations.same-precise','same-sets-10',[['wealthy','rich'],['ancient','very old'],['seldom','rarely']]],
 ['mock.relations.same-precise','same-sets-11',[['observe','watch'],['reply','respond'],['vanish','disappear']]],
 ['mock.relations.same-precise','same-sets-12',[['enormous','huge'],['delighted','very pleased'],['furious','very angry']]],
 ['mock.relations.same-precise','same-sets-13',[['grasp','hold'],['rescue','save'],['depart','leave']]],
 ['mock.relations.same-precise','same-sets-14',[['gentle','mild'],['hollow','empty inside'],['narrow','not wide']]],
 ['mock.relations.same-precise','same-sets-15',[['amusing','funny'],['drowsy','sleepy'],['swift','fast']]],
 ['mock.relations.same-precise','same-sets-16',[['honest','truthful'],['loyal','faithful'],['willing','ready to agree']]],
 ['mock.relations.opposite-size','opposite-sets-1',[['long','short'],['fast','slow'],['clean','dirty']]],
 ['mock.relations.opposite-size','opposite-sets-2',[['in','out'],['before','after'],['front','back']]],
 ['mock.relations.opposite-size','opposite-sets-3',[['happy','sad'],['awake','asleep'],['same','different']]],
 ['mock.relations.opposite-size','opposite-sets-4',[['give','take'],['come','go'],['push','pull']]],
 ['mock.relations.opposite-size','opposite-sets-5',[['light','dark'],['loud','quiet'],['hard','soft']]],
 ['mock.relations.opposite-size','opposite-sets-6',[['high','low'],['left','right'],['first','last']]],
 ['mock.relations.opposite-size','opposite-sets-7',[['all','none'],['always','never'],['yes','no']]],
 ['mock.relations.opposite-quality','opposite-sets-8',[['shallow','deep'],['tight','loose'],['wide','narrow']]],
 ['mock.relations.opposite-quality','opposite-sets-9',[['brave','fearful'],['polite','rude'],['patient','impatient']]],
 ['mock.relations.opposite-quality','opposite-sets-10',[['arrive','leave'],['borrow','lend'],['include','exclude']]],
 ['mock.relations.opposite-quality','opposite-sets-11',[['safe','dangerous'],['strong','weak'],['healthy','sick']]],
 ['mock.relations.opposite-quality','opposite-sets-12',[['float','sink'],['rise','fall'],['remember','forget']]],
 ['mock.relations.opposite-quality','opposite-sets-13',[['early','late'],['past','future'],['ancient','modern']]],
 ['mock.relations.opposite-quality','opposite-sets-14',[['fresh','stale'],['ripe','unripe'],['smooth','rough']]],
 ['mock.relations.opposite-quality','opposite-sets-15',[['empty','full'],['thin','thick'],['straight','curved']]],
 ['mock.relations.opposite-quality','opposite-sets-16',[['private','public'],['simple','complex'],['natural','artificial']]],
];

const selectedSets = [
 ['mock.plurals.animals','set-tools',['hammers','nail','saws','drill']],
 ['mock.plurals.animals','set-garden',['pots','seed','rakes','spade']],
 ['mock.plurals.animals','set-clothes',['shirts','coat','skirts','scarf']],
 ['mock.plurals.animals','set-body',['arms','nose','legs','chin']],
 ['mock.plurals.animals','set-cooking',['pans','spoon','cups','ladle']],
 ['mock.plurals.animals','set-transport',['cars','bus','trains','boat']],
 ['mock.plurals.animals','set-nature',['trees','leaf','flowers','root']],
 ['mock.plurals.endings','set-es-kitchen',['dishes','glass','lunches','peach']],
 ['mock.plurals.endings','set-ies-town',['libraries','city','factories','family']],
 ['mock.plurals.endings','set-ves-home',['shelves','knife','loaves','half']],
 ['mock.plurals.endings','set-irregular',['geese','mouse','teeth','foot']],
 ['mock.plurals.endings','set-ies-young',['puppies','baby','ponies','fairy']],
 ['mock.plurals.endings','set-es-outside',['bushes','bench','beaches','fox']],
 ['mock.plurals.endings','set-ves-animals',['wolves','calf','calves','wolf']],
 ['mock.plurals.endings','set-oes-food',['potatoes','tomato','tomatoes','potato']],
];

export function buildLiteracyMockLanguageCapacityItems(bank) {
  const byId = new Map(bank.map(item => [item.id, item]));
  const result = groups.flatMap(group => {
    const template = byId.get(group.template);
    if (!template) throw new Error(`Missing language capacity template: ${group.template}`);
    return group.rows.map(([slug, context, answer, d1, d2, explanation, question]) => {
      const id = `mock.capacity.language.${slug}`;
      const passage = group.direct ? '' : context;
      const prompt = question || (group.direct ? context : group.stem);
      const choices = [answer, d1, d2].map((label, index) => ({ id: `c${index}`, label }));
      const templateNarratesPassage = !template.passage || template.requiredAudioCues.some(cue => cue.role === 'instruction'
        && cue.text.includes(normalizeSpokenCloze(template.passage)));
      const instruction = normalizeSpokenCloze(template.modality === 'reading' || !passage || !templateNarratesPassage
        ? prompt : `${passage} ${prompt}`);
      const requiredAudioCues = [{ role: 'instruction', text: instruction, path: getLedaInstructionAudioPath(instruction) }];
      if (template.requiredAudioCues.some(cue => cue.role === 'choice')) requiredAudioCues.push(...choices.map(choice => ({
        role: 'choice', choiceId: choice.id, value: choice.label, text: choice.label,
        path: getLedaWordAudioPath(choice.label) || getLedaInstructionAudioPath(choice.label),
      })));
      return { ...template, id, sourceItemId: id, canonicalItemId: id, prompt, passage,
        targetWord: '', image: '', imageAlt: '', choices, answer: 'c0', requiredAudioCues,
        stimulusKey: (passage || `response-evidence:${JSON.stringify([answer])}`).normalize('NFKC').toLowerCase(), exposureFamilyId: `mock-language-capacity:${slug}`,
        explanation, distractorRationales: { c1: `${d1}: ${explanation}`, c2: `${d2}: ${explanation}` },
        difficultyEvidence: template.level === 1 ? 'Apply the named word or grammar relationship to one complete familiar context.'
          : 'Discriminate related alternatives using the exact contextual, morphological or semantic evidence.',
        tutorialOnly: false,
        sourceProvenance: { kind: 'original_mock_capacity', file: 'src/data/literacyMockLanguageCapacity.js', sourceId: slug, taskTemplate: group.template },
        mediaDecision: { role: 'text-only', paths: [], constructReview: 'approved', answerNeutral: 'approved',
          reason: 'The supplied language is the evidence; no picture is required for the printed or narrated word relationship.' },
      };
    });
  });
  for (const [templateId, slug, labels] of selectedSets) {
    const template = byId.get(templateId);
    if (!template) throw new Error(`Missing plural-set template: ${templateId}`);
    const id = `mock.capacity.language.${slug}`;
    const choices = labels.map((label, index) => ({ id: `c${index}`, label }));
    result.push({ ...template, id, sourceItemId: id, canonicalItemId: id, choices, answer: ['c0', 'c2'],
      stimulusKey: `plural-set:${[...labels].sort().join('|')}`, exposureFamilyId: `mock-language-capacity:${slug}`,
      explanation: `${labels[0]} and ${labels[2]} name more than one; ${labels[1]} and ${labels[3]} name one.`,
      distractorRationales: { c1: `${labels[1]} is singular.`, c3: `${labels[3]} is singular.` },
      sourceProvenance: { kind: 'original_mock_capacity', file: 'src/data/literacyMockLanguageCapacity.js', sourceId: slug, taskTemplate: templateId },
    });
  }
  for (const [templateId, slug, pairs] of relationSets) {
    const template = byId.get(templateId);
    if (!template) throw new Error(`Missing relation-set template: ${templateId}`);
    const id = `mock.capacity.language.${slug}`;
    result.push({ ...template, id, sourceItemId: id, canonicalItemId: id,
      choices: pairs.map((pair, index) => ({ id: `c${index}`, label: pair[1] })),
      matchTargets: pairs.map((pair, index) => ({ id: `m${index}`, label: pair[0] })),
      answer: pairs.map((_, index) => `c${index}`),
      stimulusKey: `relation-set:${pairs.map(pair => pair.join('=')).sort().join('|')}`,
      exposureFamilyId: `mock-language-capacity:${slug}`,
      explanation: pairs.map(pair => `${pair[0]} matches ${pair[1]}.`).join(' '), distractorRationales: {},
      sourceProvenance: { kind: 'original_mock_capacity', file: 'src/data/literacyMockLanguageCapacity.js', sourceId: slug, taskTemplate: templateId },
    });
  }
  return [...result, ...buildLiteracyMockSpatialCapacityItems(bank)];
}
