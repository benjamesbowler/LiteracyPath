import { ADDITIONAL_COMPREHENSION_DRAFTS, ADDITIONAL_WORD_HELP } from './additionalPassages.js';
// Original authored short passages. Focus tags are teaching labels, not calibrated
// reading levels. The exact foundation list below is reviewed spelling vocabulary;
// everything outside it and the passage's authored targets is exposed for support.
const FOUNDATION = new Set(`a an and as at back bad bag bat bed big bin bit box bug bus but can cap cat cup cut dad did dig dip dog dot dug fat fed fit fix fog for fun get got had ham has hat hen hid him his hit hop hot hug hut if in is it jam jet job jug kid kit lap leg let lid lip log lot mad man map mat men met mix mop mud mug mum nap net nod not nut off on pan pat peg pen pet pig pin pit pop pot pup ran rat red rid rip rod rot rub rug run sad sat set sip sit six sob sock socks sun tag tan tap ten tin tip top tub tug up van vet wag web wet win zip zig zag with the to of he she we me be go no so my you your are was have said they their there this that them then from into out one two what when who where why how will all some come little help look like see do does were put down good now too very`.split(/\s+/));
const WORDS = text => text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];

export const COMPREHENSION_FAMILIES = [
  {id:'short',label:'Short vowels'}, {id:'digraph',label:'Digraphs and blends'},
  {id:'silent',label:'Silent e'}, {id:'teams',label:'Vowel teams'}
];
// Each question: literal prompt, acceptable answer, three plausible distractors,
// and exact source-sentence indices. Open written responses allow equivalent wording.
const drafts = [
 ["muddy-mat", "Muddy and the Mat", "short", "Short a / short u", "muddy", ["mud", "mat", "sun"],
  "Muddy sat in the mud. The sun was hot. Muddy got up and ran to a mat. The mat was in a hut. Muddy sat on it. The mat was not hot. Muddy had a nap in the hut.",[
   ["Where was Muddy at first?", "In the mud", ["In the hut", "On the mat", "In a bed"], [0]],
   ["Where was the mat?", "In a hut", ["In a van", "In a box", "In a bag"], [3]],
   ["Why did Muddy have a nap in the hut?", "The mat was not hot", ["The mat was wet", "The hut had a bed", "The mat was in the sun"], [1, 5, 6]]
  ],"Draw Muddy on the mat in the hut. Write mat by the mat."],
 ["pip-bag", "Pip and the Red Bag", "short", "Short a / short e", "pip", ["bag", "red", "peg"],
  "Pip had a red bag. Pip put a pen in it. Then Pip put a map in the bag. The bag had a rip. The pen fell out. Pip got the pen and put the bag on a peg. Pip got a box for the pen and map.",[
   ["What colour was the bag?", "Red", ["Blue", "Green", "Black"], [0]],
   ["What fell out of the bag?", "The pen", ["The peg", "The box", "The map"], [4]],
   ["Why did Pip get a box?", "The bag had a rip", ["The peg was in the box", "The pen was red", "The map was wet"], [3, 6]]
  ],"Draw the pen and map in the box. Write pen and map."],
 ["fluff-log", "Fluff and the Log", "short", "Short o / short i", "fluff", ["log", "hop", "sit"],
  "Fluff can hop onto a big log. The log rolls, and Fluff falls off. Fluff gets up and puts the log in a pit. The pit is a hole in the ground. The log cannot roll in the pit. Now Fluff can sit on the log.",[
   ["What does Fluff hop onto?", "A log", ["A box", "A mat", "A bed"], [0]],
   ["What happens when Fluff hops onto the log?", "The log rolls", ["The log breaks", "The log gets wet", "The log falls into a pond"], [1]],
   ["Why does Fluff put the log in the pit?", "So the log cannot roll", ["So the log can float", "So the log gets wet", "So the log is in the sun"], [2, 4]]
  ],"Draw the log in the hole. Write log by the log."],
 ["socks-cup", "Socks and the Cup", "short", "Short u / short e", "socks", ["cup", "jug", "wet"],
  "Socks has a cup and a jug of water. Socks pours water from the jug into the cup. Some water spills on the mat. Socks gets a mop and cleans the wet mat. Then Socks fills the cup slowly. This time, no water spills.",[
   ["What is in the jug?", "Water", ["Milk", "Juice", "Sand"], [0]],
   ["What gets wet?", "The mat", ["The bed", "The bag", "The hat"], [2]],
   ["What does Socks do just after cleaning the mat?", "Fills the cup slowly", ["Gets a mop", "Cleans the wet mat", "Spills water on the mat"], [3, 4]]
  ],"Draw the cup and jug. Write cup and jug."],
 ["chips-shed", "Chips in the Shed", "digraph", "sh", "chips", ["shed", "fish", "dish", "shuts"],
  "Chips has a dish for the fish. The dish is in the shed. Chips opens the shed but cannot see the dish. A big bag is on top of it. Chips moves the bag and gets the dish. Chips puts fish food in the dish, then shuts the shed.",[
   ["Who is the dish for?", "The fish", ["Chips", "A hen", "A dog"], [0]],
   ["What is on top of the dish?", "A big bag", ["A mat", "A box", "A jug"], [3]],
   ["What does Chips move to get the dish?", "The bag", ["The shed", "The fish", "The door"], [4]]
  ],"Draw the bag on top of the dish. Write bag and dish."],
 ["chompy-chip", "Chompy Makes a Chip Path", "digraph", "ch", "chompy", ["chip", "chips", "bench"],
  "Chompy has a bag of wood chips. Wood chips are small bits of wood. The path to the bench is muddy. Chompy puts one chip on the path. One chip cannot cover the mud. Chompy adds more chips until the mud is covered. Now Chompy can walk to the bench without getting muddy.",[
   ["What is in the bag?", "Wood chips", ["Leaves", "Nuts", "Stones"], [0]],
   ["Where does the path go?", "To the bench", ["To a shed", "To a shop", "To a pond"], [2]],
   ["Why does Chompy add more chips?", "One chip cannot cover the mud", ["The bench needs a seat", "The bag has a hole", "The path is too dry"], [4, 5]]
  ],"Draw the chips covering the muddy path. Write path by the path."],
 ["fluff-path", "Fluff and the Branch", "digraph", "th", "fluff", ["thick", "path", "with"],
  "Fluff walks on a path with a bag. A thick branch is on the path. Fluff puts the bag down to move the branch. Fluff pulls the branch off the path. Then Fluff picks up the bag and walks on. Now the branch is not in the way.",[
   ["What is Fluff carrying?", "A bag", ["A dish", "A net", "A cup"], [0]],
   ["What is on the path?", "A thick branch", ["A thin mat", "A big bag", "A wet log"], [1]],
   ["What does Fluff do just before pulling the branch?", "Puts the bag down", ["Picks up the bag", "Walks on", "Pulls the branch off the path"], [2, 3]]
  ],"Draw Fluff moving the branch. Write branch by the branch."],
 ["pip-tent", "Pip and the Tent Peg", "digraph", "st / nt blends", "pip", ["tent", "gust", "lost"],
  "Pip puts up a tent. A gust of wind lifts one side. One of the tent pegs is lost. Pip finds the peg in the grass by the tent. Pip pushes the peg into the ground to hold the tent down. The next gust comes, but the tent stays up.",[
   ["What lifts one side of the tent?", "A gust of wind", ["A peg", "The grass", "A bag"], [1]],
   ["Where does Pip find the peg?", "In the grass", ["In the tent", "Under a bed", "In a box"], [3]],
   ["Where does Pip put the peg?", "In the ground", ["On a shelf", "Under a table", "In a bag"], [4]]
  ],"Draw the tent with its pegs in the ground. Write tent."],
 ["muddy-cake", "Muddy Saves the Cake", "silent", "a-e", "muddy", ["cake", "made", "safe"],
  "Muddy made a cake. Muddy put the cake on a plate on a table. A ball hit the table and made it shake. The plate slid to the edge of the table. Muddy caught the plate and took the cake inside. The cake was safe on the kitchen table.",[
   ["What did Muddy make?", "A cake", ["A game", "A kite", "A boat"], [0]],
   ["What made the table shake?", "A ball", ["The plate", "The cake", "A bag"], [2]],
   ["Where was the cake at the end?", "On the kitchen table", ["By the gate", "On the grass", "On a bench"], [5]]
  ],"Draw the cake on the kitchen table. Write cake."],
 ["socks-kite", "Socks and the Kite", "silent", "i-e", "socks", ["kite", "line", "time"],
  "Socks took a kite to the field. Socks held the long kite line and ran. The kite did not go up. The line was stuck under a stone. Socks lifted the stone and pulled the line out. This time, the kite went high in the sky.",[
   ["Where did Socks take the kite?", "To the field", ["To the shed", "To the beach", "To the pond"], [0]],
   ["What was under a stone?", "The kite line", ["The kite", "A bag", "A plate"], [3]],
   ["Why could the kite go up at the end?", "Socks pulled the line out", ["Socks got a new kite", "The kite had a shorter line", "Socks went inside"], [4, 5]]
  ],"Draw the kite in the sky. Write kite and line."],
 ["pip-home", "Pip Finds a Note", "silent", "o-e", "pip", ["home", "note", "rope"],
  "Pip came home and found a note on the gate. The note said to look under the rope swing. Pip went to the swing and found a small box. The lost cap was in the box. Pip put on the cap and took the box home.",[
   ["Where was the note?", "On the gate", ["In the box", "On the rope", "Under the cap"], [0]],
   ["What was in the box?", "The lost cap", ["The note", "The rope", "A cake"], [3]],
   ["What told Pip where to find the box?", "The note", ["The cap", "A kite", "A map"], [1, 2]]
  ],"Draw the box under the swing. Write box and rope."],
 ["fluff-tune", "Fluff and the Flute", "silent", "u-e", "fluff", ["tune", "flute", "use"],
  "Fluff can play a tune on a flute. Fluff plays by the pond. Ducks quack loudly, and Fluff cannot hear the tune. Fluff wants to use the flute in a quiet place. Fluff walks to a tree away from the ducks. Now Fluff can hear the tune.",[
   ["What does Fluff play?", "A flute", ["A drum", "A bell", "A horn"], [0]],
   ["Why does Fluff leave the pond?", "The ducks are too loud", ["The flute is lost", "The tree falls", "The tune is finished"], [2, 3]],
   ["Where does Fluff go to play?", "To a tree away from the ducks", ["Into the pond", "To a gate", "Into a boat"], [4, 5]]
  ],"Draw Fluff playing by the tree. Write tree."],
 ["chips-cube", "Chips and the Ice Cube", "silent", "u-e", "chips", ["cube", "use"],
  "Chips has a big ice cube in a tub. Chips wants to use the tub for plants. The ice is stuck in the tub. Chips puts the tub in the sun. The ice melts into water. Chips pours out the water and puts soil in the tub. Now Chips can plant the seeds.",[
   ["What is in the tub at first?", "An ice cube", ["Soil", "Plants", "Seeds"], [0]],
   ["Where does Chips put the tub?", "In the sun", ["In the shed", "Under a bed", "In the pond"], [3]],
   ["What happens to the ice in the sun?", "It melts into water", ["It gets bigger", "It turns into soil", "It freezes again"], [4]]
  ],"Draw the tub with soil and seeds. Write seeds."],
 ["chompy-game", "Chompy Makes a Game", "silent", "a-e / i-e", "chompy", ["game", "make", "line", "five"],
  "Chompy wants to make a game with five stones. Chompy draws a line and puts a cup on its side. Chompy slides a stone from the line to the cup. The stone stops before the cup. Chompy moves the cup closer to the line. The next stone goes into the cup.",[
   ["How many stones does Chompy have?", "Five", ["One", "Three", "Ten"], [0]],
   ["Where does Chompy want the stone to go?", "Into the cup", ["Onto the line", "Under the cup", "Into a bag"], [2, 5]],
   ["What does Chompy move after the first try?", "The cup", ["The line", "The bag", "The stones in the bag"], [4]]
  ],"Draw the cup on its side by the line. Write cup and line."],
 ["muddy-rain", "Muddy and the Rain Pail", "teams", "ai", "muddy", ["rain", "pail", "waiting"],
  "Muddy puts a pail, a small bucket, outside in the rain. Muddy wants the water for a small plant. The pail has a hole in the bottom. Water drips out. Muddy puts a bowl under the pail. The bowl catches the water. Muddy can water the plant without waiting for more rain.",[
   ["Why does Muddy want the water?", "For a small plant", ["To wash a gate", "To fill the pond", "To make a cake"], [1]],
   ["Why does water drip out of the pail?", "It has a hole in the bottom", ["It is too full", "The bowl has a hole", "The rain has stopped"], [2, 3]],
   ["What catches the water under the pail?", "A bowl", ["A cap", "A leaf", "A bag"], [4, 5]]
  ],"Draw the bowl under the pail. Write bowl and pail."],
 ["pip-play", "Pip Plans a Play", "teams", "ay", "pip", ["play", "day", "stay"],
  "Pip plans a puppet play for a sunny day. Pip makes a small stage from a tray. The tray tips to one side on the grass. Pip puts the tray on a low, flat box. Now the stage can stay still. Pip puts the puppets on the stage. The play can begin.",[
   ["What does Pip use to make the stage?", "A tray", ["A rope", "A leaf", "A plate"], [1]],
   ["What does Pip put under the tray?", "A low, flat box", ["A tall cup", "A soft bag", "A thin stick"], [3]],
   ["Why does Pip move the tray onto a box?", "The tray tips on the grass", ["The puppets are lost", "The play is over", "The sun has gone"], [2, 3]]
  ],"Draw the puppets on the stage. Write tray and box."],
 ["fluff-seeds", "Fluff and the Seeds", "teams", "ee", "fluff", ["seeds", "three", "green"],
  "Fluff plants three seeds in a little pot. Fluff gives the seeds water each week. Two little green plants grow. The third seed has not grown yet. Fluff keeps giving it water and waits. A week later, a third green plant grows. Now all three seeds have grown into plants.",[
   ["How many seeds does Fluff plant?", "Three", ["Two", "Four", "Six"], [0]],
   ["How many plants grow first?", "Two", ["One", "Three", "Five"], [2]],
   ["What does Fluff keep giving the seed?", "Water", ["Soil", "Sand", "Food"], [4]]
  ],"Draw the pot with all three plants. Write green."],
 ["socks-beach", "Socks at the Beach", "teams", "ea", "socks", ["beach", "sea", "reach"],
  "Socks walks on the beach by the sea. The wind blows a red cap onto a rock. Socks cannot reach the cap from the sand. Socks uses a long stick to push the cap off the rock. The cap falls onto the sand. Socks picks it up and holds it tight.",[
   ["Where does the cap land first?", "On a rock", ["In the sea", "On the sand", "In a boat"], [1]],
   ["What does Socks use to get the cap?", "A long stick", ["A shell", "A bag", "A rope"], [3]],
   ["Why does Socks need the stick?", "Socks cannot reach the cap", ["The stick is red", "The cap is in a bag", "The cap is wet"], [2, 3]]
  ],"Draw Socks using the stick to get the cap. Write cap and stick."],
 ["chips-boat", "Chips and the Little Boat", "teams", "oa", "chips", ["boat", "float", "soak"],
  "Chips makes a little boat from a leaf. Chips puts the boat in a small pool of water. A stone in the boat makes it sink. Chips takes out the stone and adds a small, dry stick. The stick does not soak up much water. Now the boat can float across the pool.",[
   ["What is the boat made from?", "A leaf", ["A stone", "A stick", "A shell"], [0]],
   ["What makes the boat sink?", "A stone", ["A dry stick", "A shell", "A seed"], [2]],
   ["What does Chips put in instead of the stone?", "A small, dry stick", ["A second stone", "A wet bag", "A cup of water"], [3]]
  ],"Draw the leaf boat with the small stick. Write boat and stick."],
 ["chompy-snow", "Chompy in the Snow", "teams", "ow as in snow", "chompy", ["snow", "slow", "low"],
  "Chompy rolls a ball of snow down a low hill. The snowball gets bigger as it rolls. It rolls fast towards a row of stones. Chompy puts more snow in front of the ball. The ball hits the snow and starts to slow down. It stops before it hits the stones.",[
   ["What gets bigger as it rolls?", "The snowball", ["The hill", "The stones", "The tree"], [1]],
   ["What is the snowball rolling towards?", "A row of stones", ["A pond", "A shed", "A bridge"], [2]],
   ["What makes the snowball slow down?", "The snow Chompy puts in front", ["The stones behind Chompy", "The sun above the hill", "The wind behind the ball"], [3, 4]]
  ],"Draw the snow in front of the snowball. Write snow."],
 ["pip-night", "Pip and the Night Light", "teams", "igh", "pip", ["night", "light", "bright"],
  "Pip drops a key in the grass at night. Pip takes a bright light outside to find the key. Pip holds the light high but cannot see the key. Pip moves the light close to the ground. Now Pip sees the key beside a stone. Pip picks up the key and goes inside.",[
   ["What is Pip looking for?", "A key", ["A cap", "A seed", "A coin"], [0, 1]],
   ["What does Pip do to find the key?", "Moves the light close to the ground", ["Puts the light inside a box", "Turns the light off", "Hangs the light in a tree"], [3, 4]],
   ["Where is the key?", "Beside a stone", ["Under a pot", "On the gate", "In a box"], [4]]
  ],"Draw the key beside the stone. Write key and stone."],
 ["fluff-blue", "Fluff and the Blue Sign", "teams", "ue", "fluff", ["blue", "glue"],
  "Fluff sells seeds at a table. Fluff makes a blue sign that says ten seeds in each bag. Fluff counts the seeds in each bag. One bag has only nine seeds. Fluff adds one more seed to that bag. Then Fluff uses glue to stick the sign to the table.",[
   ["What colour is the sign?", "Blue", ["Green", "Red", "Yellow"], [1]],
   ["How many seeds are in one bag before Fluff adds a seed?", "Nine", ["Eleven", "Ten", "One"], [3]],
   ["Why does Fluff add one seed to the bag?", "The sign says ten, but the bag has nine", ["The bag has no seeds", "The table needs more seeds", "The glue is in the bag"], [1, 3, 4]]
  ],"Draw ten seeds in a bag. Write ten."],
 ["socks-trail", "Socks Makes a Trail", "teams", "ai / ay", "socks", ["trail", "rain", "way", "stay"],
  "Socks puts paper arrows on a trail. The arrows show the way to a picnic. Rain makes one paper arrow wet, and it tears. Socks uses flat stones to make new arrows. The stone arrows stay in place in the rain. Socks follows them to the picnic with a bag of food.",[
   ["What do the arrows show?", "The way to a picnic", ["The way to a shop", "The way to a cave", "The way to a beach"], [1]],
   ["What happens to one paper arrow in the rain?", "It gets wet and tears", ["It blows into a tree", "It falls in a bag", "It stays dry"], [2]],
   ["Why does Socks use stones to make new arrows?", "They stay in place in the rain", ["They keep the food warm", "They stop the rain", "They are lighter than paper"], [3, 4]]
  ],"Draw an arrow made from stones. Write trail."],
 ["muddy-seat", "Muddy Makes a Seat", "teams", "ee / ea", "muddy", ["seat", "tree", "needs"],
  "Muddy needs a seat by the tree. Muddy finds a wide board and two short logs. Muddy puts one end of the board on each log. The seat moves from side to side on the bumpy ground. Muddy moves one log to a flat place. Now the seat does not move. Muddy can sit and read.",[
   ["Where does Muddy need a seat?", "By the tree", ["By the sea", "In a boat", "In a shed"], [0]],
   ["What is under the board?", "Two short logs", ["Three tall sticks", "A wide bowl", "A small box"], [1, 2]],
   ["How does Muddy stop the seat moving?", "Moves one log to a flat place", ["Puts a book on the board", "Puts a bag on the tree", "Takes both logs away"], [3, 4, 5]]
  ],"Draw the board on the two logs. Write seat and logs."]
];

// Plain meanings support vocabulary without giving a question answer.
const WORD_HELP = {
 "muddy-mat": [
  [
   "hut",
   "a small house"
  ],
  [
   "nap",
   "a short sleep"
  ]
 ],
 "pip-bag": [
  [
   "rip",
   "a tear or hole"
  ],
  [
   "peg",
   "a short stick used to hang things"
  ]
 ],
 "fluff-log": [
  [
   "log",
   "a thick piece of wood from a tree"
  ],
  [
   "pit",
   "a hole in the ground"
  ]
 ],
 "socks-cup": [
  [
   "jug",
   "a pot with a handle for pouring drinks"
  ],
  [
   "mop",
   "a tool for cleaning floors"
  ]
 ],
 "chips-shed": [
  [
   "shed",
   "a small building for keeping things"
  ]
 ],
 "chompy-chip": [
  [
   "wood chips",
   "small bits of wood"
  ],
  [
   "bench",
   "a long seat"
  ]
 ],
 "fluff-path": [
  [
   "branch",
   "a part of a tree"
  ],
  [
   "path",
   "a place to walk along"
  ]
 ],
 "pip-tent": [
  [
   "gust",
   "a strong rush of wind"
  ],
  [
   "tent peg",
   "a short stick that holds a tent down"
  ]
 ],
 "muddy-cake": [
  [
   "edge",
   "the side of the table"
  ]
 ],
 "socks-kite": [
  [
   "kite line",
   "the string that holds a kite"
  ]
 ],
 "pip-home": [
  [
   "note",
   "a short written message"
  ],
  [
   "rope swing",
   "a seat that hangs from a rope"
  ]
 ],
 "fluff-tune": [
  [
   "flute",
   "a musical instrument you blow into"
  ],
  [
   "tune",
   "a short piece of music"
  ]
 ],
 "chips-cube": [
  [
   "melts",
   "changes from ice to water"
  ],
  [
   "soil",
   "the earth that plants grow in"
  ]
 ],
 "chompy-game": [
  [
   "slides",
   "moves along without being lifted"
  ]
 ],
 "muddy-rain": [
  [
   "pail",
   "a bucket"
  ]
 ],
 "pip-play": [
  [
   "puppet",
   "a toy you move to tell a story"
  ],
  [
   "stage",
   "a place to show a play"
  ]
 ],
 "fluff-seeds": [
  [
   "seed",
   "a small part of a plant that can grow"
  ]
 ],
 "socks-beach": [
  [
   "reach",
   "stretch your arm to touch something"
  ]
 ],
 "chips-boat": [
  [
   "soak up",
   "take in water"
  ],
  [
   "float",
   "stay on top of water"
  ]
 ],
 "chompy-snow": [
  [
   "snowball",
   "a ball made of snow"
  ]
 ],
 "pip-night": [
  [
   "bright",
   "giving a lot of light"
  ]
 ],
 "fluff-blue": [
  [
   "sign",
   "written words that tell people something"
  ]
 ],
 "socks-trail": [
  [
   "trail",
   "a path"
  ],
  [
   "arrow",
   "a mark that shows which way to go"
  ]
 ],
 "muddy-seat": [
  [
   "board",
   "a flat piece of wood"
  ],
  [
   "logs",
   "thick pieces of wood from a tree"
  ]
 ]
};

export const COMPREHENSION_PASSAGES = [...drafts,...ADDITIONAL_COMPREHENSION_DRAFTS].map(([id,title,family,focus,character,targetWords,text,questions,draw]) => {
 const sentences = text.match(/[^.!?]+[.!?]+/g).map(s=>s.trim());
 // Support includes proper names, inflections and unfamiliar vocabulary. It is
 // deliberately conservative: never guess that a substring proves decodability.
 const supportWords = [...new Set(WORDS(text).filter(w=>!FOUNDATION.has(w)&&!targetWords.includes(w)))];
 return Object.freeze({id,title,family,focus,character,targetWords,text,sentences,draw,
  band:'B', construct:'Text-supported reading comprehension', responseMode:'Select; discuss or write on print',
  wordCount:WORDS(text).length, supportWords, wordHelp:WORD_HELP[id]||ADDITIONAL_WORD_HELP[id],
  prerequisites: family==='short' ? ['Short vowel sounds','CVC blending','Preview support words']
    : family==='digraph' ? ['Short vowels',focus,'Preview support words']
    : family==='silent' ? ['Short vowels','Consonant digraphs and blends',focus,'Preview support words']
    : ['Short vowels','Consonant digraphs and blends','Silent e',focus,'Preview support words'],
  readingMode:'Phonics-focused; preview support words',
  questions:questions.map(([prompt,answer,distractors,evidence],i)=>{
   const options=[answer,...distractors];
   return {id:`${id}-q${i+1}`,prompt,answer,options,evidence:evidence.map(n=>sentences[n])};
  })
 });
});
export function passageById(id) { return COMPREHENSION_PASSAGES.find(p=>p.id===id)||null; }
