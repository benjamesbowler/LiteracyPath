import { getChildWordAsset } from './childAssets.js';
import { PRESENT_VOCABULARY } from './presentVocabulary.js';

// Two adult-supported ESL reading cards per day: visible colours, quantities,
// parts, actions and spatial relationships. Inspect the mapped artwork before
// changing a claim. Questions and embodied commands practise the same language.
const WEEKLY_CARDS = {

  1: [
    ["apple", "This apple is red.", "What colour is the apple?", ["red"]],
    ["map", "The map has a red cross.", "What red mark is on the map?", ["a cross"]],
    ["apple", "The apple has one leaf.", "How many leaves can you see?", ["one"]],
    ["map", "There is a ship on the map.", "What boat is on the map?", ["a ship"]],
    ["apple", "What colour is the leaf?", "What colour is the leaf?", ["green"]],
    ["map", "Count the ships on the map.", "How many ships can you see?", ["one"]],
    ["ant", "The ant is black.", "What colour is the ant?", ["black"]],
    ["sun", "The sun is yellow.", "What colour is the sun?", ["yellow"]],
    ["apple", "A green leaf is above the apple.", "Where is the green leaf?", ["above the apple"]],
    ["map", "The cross is below the ship.", "Where is the cross?", ["below the ship"]]
  ],
  2: [
    ["tent", "The tent is green.", "What colour is the tent?", ["green"]],
    ["sock", "The sock is white and grey.", "What colours are on the sock?", ["white and grey"]],
    ["tent", "The tent has an open door.", "Is the tent door open or closed?", ["open"]],
    ["sock", "The heel is grey.", "What colour is the heel?", ["grey"]],
    ["tent", "Is the tent open?", "Is the tent open or closed?", ["open"]],
    ["sock", "Point to the grey toe.", "What colour is the toe?", ["grey"]],
    ["apple", "The apple has a brown stem.", "What colour is the stem?", ["brown"]],
    ["map", "The treasure is on the map.", "Where is the treasure?", ["on the map"]],
    ["tent", "The door is at the front.", "Where is the door?", ["at the front"]],
    ["sock", "The toe is below the top.", "Where is the toe?", ["below the top"]]
  ],
  3: [
    ["nest", "Two eggs are in the nest.", "How many eggs are in the nest?", ["two"]],
    ["igloo", "The igloo has a blue doorway.", "What colour is the doorway?", ["blue"]],
    ["nest", "The eggs are pale blue.", "What colour are the eggs?", ["pale blue"]],
    ["igloo", "The doorway is open.", "Is the doorway open or closed?", ["open"]],
    ["nest", "How many eggs are there?", "How many eggs are in the nest?", ["two"]],
    ["igloo", "Trace the round roof.", "What shape is the roof?", ["round"]],
    ["tent", "This tent has green sides.", "What colour are the sides?", ["green"]],
    ["sock", "This sock has a grey heel.", "What colour is the heel?", ["grey"]],
    ["nest", "The nest is around the eggs.", "What is around the eggs?", ["the nest"]],
    ["igloo", "Snow blocks make the walls.", "What makes the walls?", ["snow blocks"]]
  ],
  4: [
    ["fan", "The fan is blue.", "What colour is the fan?", ["blue"]],
    ["dog", "The dog has brown ears.", "What colour are the ears?", ["brown"]],
    ["fan", "The fan has four blades.", "How many blades can you see?", ["four"]],
    ["dog", "The dog is sitting down.", "What is the dog doing?", ["sitting"]],
    ["fan", "How many blades can you count?", "How many blades can you count?", ["four"]],
    ["dog", "Count the dog's ears.", "How many ears can you see?", ["two"]],
    ["nest", "The eggs are inside the nest.", "Where are the eggs?", ["inside the nest"]],
    ["igloo", "This igloo has a curved roof.", "What shape is the roof?", ["curved"]],
    ["fan", "The base is below the blades.", "Where is the base?", ["below the blades"]],
    ["dog", "The dog has four paws.", "How many paws can you see?", ["four"]]
  ],
  5: [
    ["octopus", "The octopus is purple.", "What colour is the octopus?", ["purple"]],
    ["log", "The log has brown bark.", "What colour is the bark?", ["brown"]],
    ["octopus", "The octopus has two eyes.", "How many eyes can you see?", ["two"]],
    ["log", "There are rings inside the log.", "Where can you see the rings?", ["inside the log"]],
    ["octopus", "What colour are its arms?", "What colour are the arms?", ["purple"]],
    ["log", "Trace a ring on the log.", "What shape are the rings?", ["round"]],
    ["fan", "This fan has a round front.", "What shape is the front?", ["round"]],
    ["dog", "This dog has a white chest.", "What colour is the chest?", ["white"]],
    ["octopus", "The arms have little suckers.", "What is on the arms?", ["suckers"]],
    ["log", "The bark is outside the rings.", "Where is the bark?", ["outside the rings"]]
  ],
  6: [
    ["rug", "The rug has a red edge.", "What colour is the edge?", ["red"]],
    ["hen", "The hen has brown feathers.", "What colour are the feathers?", ["brown"]],
    ["rug", "One end of the rug is rolled.", "How many ends are rolled?", ["one"]],
    ["hen", "The hen has a yellow beak.", "What colour is the beak?", ["yellow"]],
    ["rug", "What shapes are on the rug?", "What shapes can you see?", ["diamonds"]],
    ["hen", "Count the hen's eyes.", "How many eyes can you see?", ["two"]],
    ["octopus", "This octopus has a round head.", "What shape is its head?", ["round"]],
    ["log", "This log has a round end.", "What shape is the end?", ["round"]],
    ["rug", "The rug has yellow tassels.", "What colour are the tassels?", ["yellow"]],
    ["hen", "The red comb is above the eyes.", "Where is the comb?", ["above the eyes"]]
  ],
  7: [
    ["mouse", "The mouse is grey.", "What colour is the mouse?", ["grey"]],
    ["lamp", "The lamp is green.", "What colour is the lamp?", ["green"]],
    ["mouse", "The mouse has two pink ears.", "How many pink ears can you see?", ["two"]],
    ["lamp", "The shade is above the base.", "Where is the shade?", ["above the base"]],
    ["mouse", "What colour is the long tail?", "What colour is the tail?", ["pink"]],
    ["lamp", "Trace the wide lamp shade.", "Which part is wide?", ["the shade"]],
    ["rug", "The rolled end makes a spiral.", "What pattern is at the rolled end?", ["a spiral"]],
    ["hen", "This hen has two yellow feet.", "How many yellow feet can you see?", ["two"]],
    ["mouse", "The whiskers are beside its nose.", "Where are the whiskers?", ["beside its nose"]],
    ["lamp", "The base is round.", "What shape is the base?", ["round"]]
  ],
  8: [
    ["bag", "The bag is brown.", "What colour is the bag?", ["brown"]],
    ["web", "The spider is below the web.", "Where is the spider?", ["below the web"]],
    ["bag", "The bag has two handles.", "How many handles can you see?", ["two"]],
    ["web", "The web has many threads.", "What makes up the web?", ["threads"]],
    ["bag", "What colour are the handles?", "What colour are the handles?", ["brown"]],
    ["web", "Trace a thread to the middle.", "Where do the threads meet?", ["in the middle"]],
    ["mouse", "This mouse has a curved tail.", "What shape is the tail?", ["curved"]],
    ["lamp", "This lamp has a wide shade.", "Which part is wide?", ["the shade"]],
    ["bag", "The handles are above the bag.", "Where are the handles?", ["above the bag"]],
    ["web", "The spider hangs from a thread.", "What does the spider hang from?", ["a thread"]]
  ],
  9: [
    ["quilt", "The quilt has colourful squares.", "What shapes are on the quilt?", ["squares"]],
    ["umbrella", "The umbrella is orange.", "What colour is the umbrella?", ["orange"]],
    ["quilt", "Some squares have white stars.", "What white shapes can you see?", ["stars"]],
    ["umbrella", "The handle curves at the bottom.", "Where does the handle curve?", ["at the bottom"]],
    ["quilt", "How many squares are across the top?", "How many squares are across the top?", ["four"]],
    ["umbrella", "Trace the curved handle.", "What shape is the handle?", ["curved"]],
    ["bag", "This bag has a flat bottom.", "What shape is the bottom?", ["flat"]],
    ["web", "The spider is black.", "What colour is the spider?", ["black"]],
    ["quilt", "The corners are rounded.", "What shape are the corners?", ["rounded"]],
    ["umbrella", "The umbrella is open.", "Is the umbrella open or closed?", ["open"]]
  ],
  10: [
    ["cup", "This cup is blue.", "What colour is the cup?", ["blue"]],
    ["goat", "The goat has brown fur.", "What colour is some of the fur?", ["brown"]],
    ["cup", "The cup has one handle.", "How many handles can you see?", ["one"]],
    ["goat", "The goat has two horns.", "How many horns can you see?", ["two"]],
    ["cup", "What colour is the handle?", "What colour is the handle?", ["blue"]],
    ["goat", "Count the goat's hooves.", "How many hooves can you see?", ["four"]],
    ["quilt", "The quilt has green squares.", "What colour are some of the squares?", ["green"]],
    ["umbrella", "This umbrella has a brown handle.", "What colour is the handle?", ["brown"]],
    ["cup", "The handle is beside the cup.", "Where is the handle?", ["beside the cup"]],
    ["goat", "The horns are above the ears.", "Where are the horns?", ["above the ears"]]
  ],
  11: [
    ["pan", "The pan has a long handle.", "Is the handle long or short?", ["long"]],
    ["box", "The box is brown.", "What colour is the box?", ["brown"]],
    ["pan", "The inside of the pan is black.", "What colour is inside the pan?", ["black"]],
    ["box", "The box is closed.", "Is the box open or closed?", ["closed"]],
    ["pan", "What shape is the pan?", "What shape is the pan?", ["round"]],
    ["box", "Trace the edge of the lid.", "Which part is on top?", ["the lid"]],
    ["cup", "The top of the cup is open.", "Is the cup open or closed?", ["open"]],
    ["goat", "The goat has a little beard.", "What hangs below the chin?", ["a beard"]],
    ["pan", "The handle is beside the pan.", "Where is the handle?", ["beside the pan"]],
    ["box", "There is tape on the top.", "Where is the tape?", ["on the top"]]
  ],
  12: [
    ["egg", "The egg has a brown shell.", "What colour is the shell?", ["brown"]],
    ["vest", "The vest is orange.", "What colour is the vest?", ["orange"]],
    ["egg", "The egg is oval.", "What shape is the egg?", ["oval"]],
    ["vest", "The vest has two grey stripes.", "How many grey stripes can you see?", ["two"]],
    ["egg", "Is the shell cracked?", "Is the shell cracked or whole?", ["whole"]],
    ["vest", "Count the stripes on the vest.", "How many stripes can you see?", ["two"]],
    ["pan", "This pan has a silver handle.", "What colour is the handle?", ["silver"]],
    ["box", "This box has a flat top.", "What shape is the top?", ["flat"]],
    ["egg", "The top is narrower than the bottom.", "Which end is narrower?", ["the top"]],
    ["vest", "There are no sleeves on the vest.", "Does the vest have sleeves?", ["no"]]
  ],
  13: [
    ["kite", "The kite is red and blue.", "What colours are on the kite?", ["red and blue"]],
    ["jug", "The jug has one handle.", "How many handles can you see?", ["one"]],
    ["kite", "The tail is below the kite.", "Where is the tail?", ["below the kite"]],
    ["jug", "The jug is partly full.", "Is the jug empty or partly full?", ["partly full"]],
    ["kite", "What colours are the bows?", "What colours are the bows?", ["red and blue"]],
    ["jug", "Trace the curved handle.", "What shape is the handle?", ["curved"]],
    ["egg", "This egg has a smooth shell.", "Is the shell smooth or spiky?", ["smooth"]],
    ["vest", "The grey stripes go across the vest.", "Which way do the stripes go?", ["across"]],
    ["kite", "The kite has four corners.", "How many corners can you see?", ["four"]],
    ["jug", "The spout is opposite the handle.", "Where is the spout?", ["opposite the handle"]]
  ],
  14: [
    ["van", "The van is blue.", "What colour is the van?", ["blue"]],
    ["kite", "This kite has a long tail.", "Which part is long?", ["the tail"]],
    ["van", "The van has two yellow lights.", "How many yellow lights can you see?", ["two"]],
    ["jump", "The boy is jumping.", "What is the boy doing?", ["jumping"]],
    ["van", "What colour are the windows?", "What colour are the windows?", ["blue"]],
    ["jump", "Raise your hands like the boy.", "Where are the boy's hands?", ["above his head"]],
    ["jug", "This jug is partly full.", "Is the jug full to the top?", ["no"]],
    ["sock", "The sock has a white top.", "What colour is the top?", ["white"]],
    ["van", "Two wheels are on this side.", "How many wheels are on this side?", ["two"]],
    ["jump", "Both feet are off the ground.", "Where are the boy's feet?", ["off the ground"]]
  ],
  15: [
    ["shell", "The shell is on the sand.", "Where is the shell?", ["on the sand"]],
    ["chair", "The chair is red.", "What colour is the chair?", ["red"]],
    ["shell", "The shell has a spiral.", "What pattern can you see?", ["a spiral"]],
    ["chair", "The chair has two arms.", "How many arms does the chair have?", ["two"]],
    ["shell", "What is behind the shell?", "What is behind the shell?", ["the sea"]],
    ["chair", "Count the buttons on the back.", "How many buttons can you see?", ["two"]],
    ["van", "The wheels are below the windows.", "Where are the wheels?", ["below the windows"]],
    ["lamp", "The green shade is above the base.", "Where is the shade?", ["above the base"]],
    ["shell", "The sea is blue.", "What colour is the sea?", ["blue"]],
    ["chair", "The seat is between the arms.", "Where is the seat?", ["between the arms"]]
  ],
  16: [
    ["ball", "The ball is red and blue.", "What colours are on the ball?", ["red and blue"]],
    ["chair", "This chair has a soft seat.", "Which part do we sit on?", ["the seat"]],
    ["ball", "The ball is round.", "What shape is the ball?", ["round"]],
    ["call", "The boy is holding a phone.", "What is the boy holding?", ["a phone"]],
    ["ball", "What colour is the wide stripe?", "What colour is the wide stripe?", ["blue"]],
    ["call", "Pretend to hold a phone by your ear.", "Where is the boy's phone?", ["by his ear"]],
    ["shell", "This shell has brown stripes.", "What colour are the stripes?", ["brown"]],
    ["van", "This van has a black mirror.", "What colour is the mirror?", ["black"]],
    ["ball", "A blue stripe curves around the ball.", "Where is the blue stripe?", ["around the ball"]],
    ["call", "The boy is sitting at a table.", "Where is the boy sitting?", ["at a table"]]
  ],
  17: [
    ["ink", "The ink bottle is blue.", "What colour is the bottle?", ["blue"]],
    ["pig", "The pig is pink.", "What colour is the pig?", ["pink"]],
    ["ink", "A feather is in the bottle.", "Where is the feather?", ["in the bottle"]],
    ["pig", "The pig has a curly tail.", "What shape is the tail?", ["curly"]],
    ["ink", "What colour is the feather?", "What colour is the feather?", ["brown"]],
    ["pig", "Count the pig's ears.", "How many ears can you see?", ["two"]],
    ["ball", "This ball has a wide blue stripe.", "What colour is the wide stripe?", ["blue"]],
    ["chair", "This chair has four short legs.", "How many legs does the chair have?", ["four"]],
    ["ink", "The feather leans to one side.", "Which way does the feather lean?", ["to one side"]],
    ["pig", "The snout has two nostrils.", "How many nostrils can you see?", ["two"]]
  ],
  18: [
    ["ox", "The ox has two horns.", "How many horns can you see?", ["two"]],
    ["pot", "The pot has two handles.", "How many handles can you see?", ["two"]],
    ["ox", "The ox has brown fur.", "What colour is the fur?", ["brown"]],
    ["pot", "The lid is on the pot.", "Where is the lid?", ["on the pot"]],
    ["ox", "What colour are the horns?", "What colour are the horns?", ["cream"]],
    ["pot", "Trace the round lid.", "What shape is the lid?", ["round"]],
    ["ink", "This feather has a pointed tip.", "What shape is the tip?", ["pointed"]],
    ["pig", "This pig has two black eyes.", "How many eyes can you see?", ["two"]],
    ["ox", "The hooves are below the legs.", "Where are the hooves?", ["below the legs"]],
    ["pot", "The handles are beside the lid.", "Where are the handles?", ["beside the lid"]]
  ],
  19: [
    ["sun", "The sun has yellow rays.", "What colour are the rays?", ["yellow"]],
    ["pot", "This pot has a silver lid.", "What colour is the lid?", ["silver"]],
    ["sun", "The middle of the sun is round.", "What shape is the middle?", ["round"]],
    ["under", "The cat is under the table.", "Where is the cat?", ["under the table"]],
    ["sun", "How many long rays can you count?", "How many long rays can you count?", ["eight"]],
    ["under", "Point above the cat to the table.", "What is above the cat?", ["the table"]],
    ["ox", "This ox has a short tail.", "Is the tail long or short?", ["short"]],
    ["pig", "The pig has two pink ears.", "How many pink ears can you see?", ["two"]],
    ["sun", "The rays are around the middle.", "Where are the rays?", ["around the middle"]],
    ["under", "The cat is between the table legs.", "Where is the cat?", ["between the table legs"]]
  ],
  20: [
    ["net", "The net has a long handle.", "Is the handle long or short?", ["long"]],
    ["elephant", "The elephant is grey.", "What colour is the elephant?", ["grey"]],
    ["net", "The mesh is inside the hoop.", "Where is the mesh?", ["inside the hoop"]],
    ["elephant", "The trunk curves up.", "Which way does the trunk curve?", ["up"]],
    ["net", "What colour is the handle?", "What colour is the handle?", ["brown"]],
    ["elephant", "Count the elephant's ears.", "How many ears does the elephant have?", ["two"]],
    ["sun", "There are eight rays around the sun.", "How many rays can you see?", ["eight"]],
    ["pot", "This pot has a knob on top.", "Where is the knob?", ["on top"]],
    ["net", "The hoop is above the handle.", "Where is the hoop?", ["above the handle"]],
    ["elephant", "The ears have pink insides.", "What colour is inside the ears?", ["pink"]]
  ],
  21: [
    ["whale", "The whale is blue.", "What colour is the whale?", ["blue"]],
    ["wheel", "The wheel is brown.", "What colour is the wheel?", ["brown"]],
    ["whale", "The whale has a white belly.", "What colour is the belly?", ["white"]],
    ["wheel", "The spokes meet in the middle.", "Where do the spokes meet?", ["in the middle"]],
    ["whale", "What is above the whale's head?", "What is above the head?", ["water"]],
    ["wheel", "Trace the round rim.", "What shape is the rim?", ["round"]],
    ["net", "This net has little spaces.", "What can you see in the mesh?", ["spaces"]],
    ["elephant", "This elephant has a raised trunk.", "Which part is raised?", ["the trunk"]],
    ["whale", "Water sprays above the whale.", "Where does the water spray?", ["above the whale"]],
    ["wheel", "The middle is inside the rim.", "Where is the middle?", ["inside the rim"]]
  ],
  22: [
    ["sink", "The sink has a silver tap.", "What colour is the tap?", ["silver"]],
    ["wheel", "This wheel has a round middle.", "What shape is the middle?", ["round"]],
    ["sink", "The tap is above the drain.", "Where is the tap?", ["above the drain"]],
    ["pink", "The child is painting with a brush.", "What is the child doing?", ["painting"]],
    ["sink", "Where does the water go?", "Where does water go in the sink?", ["down the drain"]],
    ["pink", "Pretend to paint a pink shape.", "What colour is the paint?", ["pink"]],
    ["whale", "This whale has two blue flippers.", "How many flippers can you see?", ["two"]],
    ["net", "The net has a brown hoop.", "What colour is the hoop?", ["brown"]],
    ["sink", "The drain is at the bottom.", "Where is the drain?", ["at the bottom"]],
    ["pink", "The brush is beside the pink paint.", "Where is the brush?", ["beside the pink paint"]]
  ],
  23: [
    ["ring", "The ring has a blue stone.", "What colour is the stone?", ["blue"]],
    ["sink", "This sink has a round drain.", "What shape is the drain?", ["round"]],
    ["ring", "The band of the ring is gold.", "What colour is the band?", ["gold"]],
    ["sing", "The girl is singing into a microphone.", "What is the girl doing?", ["singing"]],
    ["ring", "What shape is the band?", "What shape is the band?", ["round"]],
    ["sing", "Pretend to hold a microphone.", "What is the girl holding?", ["a microphone"]],
    ["wheel", "The rim goes around the spokes.", "Where is the rim?", ["around the spokes"]],
    ["whale", "The whale has a blue tail.", "What colour is the tail?", ["blue"]],
    ["ring", "The stone is above the band.", "Where is the stone?", ["above the band"]],
    ["sing", "The girl has a pink headband.", "What colour is the headband?", ["pink"]]
  ],
  24: [
    ["bell", "The bell has a red loop.", "What colour is the loop?", ["red"]],
    ["dress", "The dress is blue.", "What colour is the dress?", ["blue"]],
    ["bell", "The bell is silver.", "What colour is the bell?", ["silver"]],
    ["dress", "The dress has two buttons.", "How many buttons can you see?", ["two"]],
    ["bell", "Where is the red loop?", "Where is the loop?", ["above the bell"]],
    ["dress", "Count the buttons on the dress.", "How many buttons can you see?", ["two"]],
    ["ring", "This ring has a round gold band.", "What shape is the band?", ["round"]],
    ["sink", "This tap curves over the sink.", "Where is the tap?", ["over the sink"]],
    ["bell", "The opening is below the loop.", "Where is the opening?", ["below the loop"]],
    ["dress", "The collar is above the buttons.", "Where is the collar?", ["above the buttons"]]
  ],
  25: [
    ["bell", "This bell has a round body.", "What shape is the body?", ["round"]],
    ["dress", "This dress has short sleeves.", "Are the sleeves long or short?", ["short"]],
    ["day", "The sun is outside the window.", "Where is the sun?", ["outside the window"]],
    ["stay", "The dog is sitting beside the boy.", "Where is the dog?", ["beside the boy"]],
    ["day", "What is on the bed?", "What is on the bed?", ["a quilt"]],
    ["stay", "Pretend to sit like the dog.", "What is the dog doing?", ["sitting"]],
    ["ring", "This stone is above a gold band.", "Where is the stone?", ["above a gold band"]],
    ["chair", "This chair has round arms.", "What shape are the arms?", ["round"]],
    ["day", "The boy is stretching his arms.", "What is the boy doing?", ["stretching"]],
    ["stay", "The boy holds up one hand.", "How many hands does the boy hold up?", ["one"]]
  ],
  26: [
    ["pig", "This pig has a round snout.", "What shape is the snout?", ["round"]],
    ["dress", "This dress is on a hanger.", "Where is the dress?", ["on a hanger"]],
    ["cry", "Tears are on the child's cheeks.", "Where are the tears?", ["on the cheeks"]],
    ["shy", "The child is holding a book.", "What is the child holding?", ["a book"]],
    ["cry", "Who is beside the child?", "Who is beside the child?", ["an adult"]],
    ["shy", "Pretend to open a book.", "Is the child's book open or closed?", ["open"]],
    ["bell", "This silver bell has a red loop.", "What colour is the loop?", ["red"]],
    ["ring", "This blue stone is on a ring.", "Where is the blue stone?", ["on a ring"]],
    ["cry", "The adult is sitting beside the child.", "Where is the adult?", ["beside the child"]],
    ["shy", "The child is wearing blue trousers.", "What colour are the trousers?", ["blue"]]
  ],
  27: [
    ["wheel", "This wheel has a thick brown rim.", "What colour is the rim?", ["brown"]],
    ["bell", "This red loop is above the bell.", "Where is the loop?", ["above the bell"]],
    ["song", "The girl has a microphone in her hand.", "What is in the girl's hand?", ["a microphone"]],
    ["long", "The snake is green.", "What colour is the snake?", ["green"]],
    ["song", "What colour is the girl's top?", "What colour is the girl's top?", ["purple"]],
    ["long", "Trace the snake's curved body.", "What shape is the body?", ["curved"]],
    ["dress", "This blue dress has a white collar.", "What colour is the collar?", ["white"]],
    ["pig", "This pig has four short legs.", "How many legs does the pig have?", ["four"]],
    ["song", "There is a music note beside the girl.", "Where is the music note?", ["beside the girl"]],
    ["long", "The snake has a long winding body.", "Is the body long or short?", ["long"]]
  ]
};

const ART_SCENES = {
  apple: 'One red apple with a visible green leaf.',
  map: 'An illustrated treasure map with places and treasure marks.',
  ant: 'One recognisable ant.', sun: 'One sun with visible rays.',
  tent: 'A green tent with a visible front opening.',
  sock: 'One sock with a distinct heel.',
  nest: 'A woven brown bird nest containing exactly two pale-blue eggs.',
  igloo: 'A domed igloo with snow blocks and a doorway.',
  fan: 'A blue electric fan with four visible blades, a round front and a base below.',
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
  cup: 'One blue cup with an open top and one handle beside it.',
  goat: 'A cream and brown goat with two horns, four hooves and a beard.',
  pan: 'A pan with a long handle.', box: 'A box with a visible top and corners.',
  egg: 'An intact egg with its outer shell visible.',
  vest: 'A sleeveless vest with stripes and armholes.',
  kite: 'A kite with bows on its trailing tail; no flying-action claim.',
  jug: 'A jug with a visible handle and pouring spout.',
  van: 'A van with windows and wheels.',
  jump: 'A boy jumping with feet airborne and hands raised.',
  shell: 'A spiral shell.', chair: 'A red armchair with two arms, two back buttons, four short brown legs and a seat between the arms.',
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
  dress: 'A blue dress on a hanger with short sleeves, two buttons and a white collar.',
  day: 'A bedroom with a window and the sun visible outside.',
  stay: 'A dog seated beside a boy; no duration or obedience claim.',
  cry: 'A child with visible tears on the cheeks sitting in bed beside a supportive adult and holding a framed picture.',
  shy: 'A child in blue trousers holding an open book in a classroom; appearance does not establish a feeling.',
  song: 'A girl singing into a microphone with musical notes beside her.',
  long: 'A snake with its full long winding body and tail visible.'
};
const vocabulary = Object.fromEntries(Object.values(PRESENT_VOCABULARY).flat().map(card => [card.word, card]));
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
// Every picture has a literal, falsifiable statement pair. All correct scripts
// also occur in the daily bank. Questions/commands reuse the pictured fact as
// their repaired reading; a false draft never borrows a true sentence's audio.
const PICTURE_CONTRASTS = {
  apple: ["This apple is red.", "This apple is blue.", "colour"],
  map: ["The map has a red cross.", "The map has a blue cross.", "colour"],
  ant: ["The ant is black.", "The ant is pink.", "colour"],
  sun: ["The sun is yellow.", "The sun is green.", "colour"],
  tent: ["The tent is green.", "The tent is purple.", "colour"],
  sock: ["The heel is grey.", "The heel is red.", "colour"],
  nest: ["Two eggs are in the nest.", "Four eggs are in the nest.", "count"],
  igloo: ["The doorway is open.", "The doorway is closed.", "object-state"],
  fan: ["The fan has four blades.", "The fan has two blades.", "count"],
  dog: ["The dog is sitting down.", "The dog is jumping up.", "action"],
  octopus: ["The octopus is purple.", "The octopus is orange.", "colour"],
  log: ["The log has brown bark.", "The log has blue bark.", "colour"],
  rug: ["One end of the rug is rolled.", "Both ends of the rug are flat.", "object-state"],
  hen: ["The hen has a yellow beak.", "The hen has a blue beak.", "colour"],
  mouse: ["The mouse has two pink ears.", "The mouse has four pink ears.", "count"],
  lamp: ["The lamp is green.", "The lamp is pink.", "colour"],
  bag: ["The bag has two handles.", "The bag has four handles.", "count"],
  web: ["The spider is below the web.", "The spider is above the web.", "position"],
  quilt: ["Some squares have white stars.", "Some squares have black stars.", "colour"],
  umbrella: ["The umbrella is open.", "The umbrella is closed.", "object-state"],
  cup: ["This cup is blue.", "This cup is green.", "colour"],
  goat: ["The goat has two horns.", "The goat has one horn.", "count"],
  pan: ["The pan has a long handle.", "The pan has no handle.", "object-part"],
  box: ["The box is closed.", "The box is open.", "object-state"],
  egg: ["The egg has a brown shell.", "The egg has a blue shell.", "colour"],
  vest: ["The vest is orange.", "The vest is purple.", "colour"],
  kite: ["The kite is red and blue.", "The kite is green and yellow.", "colour"],
  jug: ["The jug has one handle.", "The jug has two handles.", "count"],
  van: ["The van is blue.", "The van is red.", "colour"],
  jump: ["The boy is jumping.", "The boy is sitting.", "action"],
  shell: ["The shell is on the sand.", "The shell is in a tree.", "position"],
  chair: ["The chair is red.", "The chair is green.", "colour"],
  ball: ["The ball is red and blue.", "The ball is green and yellow.", "colour"],
  call: ["The boy is holding a phone.", "The boy is holding a cup.", "held-object"],
  ink: ["A feather is in the bottle.", "A flower is in the bottle.", "contents"],
  pig: ["The pig is pink.", "The pig is blue.", "colour"],
  ox: ["The ox has two horns.", "The ox has one horn.", "count"],
  pot: ["The lid is on the pot.", "The lid is under the pot.", "position"],
  under: ["The cat is under the table.", "The cat is on the table.", "position"],
  net: ["The net has a long handle.", "The net has no handle.", "object-part"],
  elephant: ["The trunk curves up.", "The trunk curves down.", "position"],
  whale: ["The whale is blue.", "The whale is red.", "colour"],
  wheel: ["The wheel is brown.", "The wheel is purple.", "colour"],
  sink: ["The tap is above the drain.", "The tap is below the drain.", "position"],
  pink: ["The child is painting with a brush.", "The child is painting with a spoon.", "tool"],
  ring: ["The ring has a blue stone.", "The ring has a red stone.", "colour"],
  sing: ["The girl is singing into a microphone.", "The girl is singing into a cup.", "held-object"],
  bell: ["The bell has a red loop.", "The bell has a blue loop.", "colour"],
  dress: ["The dress is blue.", "The dress is orange.", "colour"],
  day: ["The sun is outside the window.", "The sun is under the bed.", "position"],
  stay: ["The dog is sitting beside the boy.", "The dog is sitting on the boy.", "position"],
  cry: ["Tears are on the child's cheeks.", "Tears are on the child's shoes.", "position"],
  shy: ["The child is holding a book.", "The child is holding a ball.", "held-object"],
  song: ["The girl has a microphone in her hand.", "The girl has a spoon in her hand.", "held-object"],
  long: ["The snake is green.", "The snake is purple.", "colour"]
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
    const [correctSentence, wrongSentence, contrastKind] = PICTURE_CONTRASTS[word];
    card.detectiveSource = { correctSentence, wrongSentence, contrastKind };
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
    ['detective', 'scramble', 'missing', ...(Number(cycleNumber) % 2 === 0 ? ['pairs'] : [])]
  ][dayIndex(day)];
}
