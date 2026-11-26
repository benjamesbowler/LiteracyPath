import { ADDITIONAL_COMPREHENSION_DRAFTS, ADDITIONAL_WORD_HELP, ORIGINAL_DISCUSSION } from './additionalPassages.js';
import { EXPANSION_COMPREHENSION_DRAFTS, EXPANSION_WORD_HELP, EXPANSION_DISCUSSION } from './expansionPassages.js';
// Original authored short passages. Focus tags are teaching labels, not calibrated
// reading levels. The exact foundation list below is reviewed spelling vocabulary;
// everything outside it and the passage's authored targets is exposed for support.
const FOUNDATION = new Set(`a an and as at back bad bag bat bed big bin bit box bug bus but can cap cat cup cut dad did dig dip dog dot dug fat fed fit fix fog for fun get got had ham has hat hen hid him his hit hop hot hug hut if in is it jam jet job jug kid kit lap leg let lid lip log lot mad man map mat men met mix mop mud mug mum nap net nod not nut off on pan pat peg pen pet pig pin pit pop pot pup ran rat red rid rip rod rot rub rug run sad sat set sip sit six sob sock socks sun tag tan tap ten tin tip top tub tug up van vet wag web wet win zip zig zag with the to of he she we me be go no so my you your are was have said they their there this that them then from into out one two what when who where why how will all some come little help look like see do does were put down good now too very`.split(/\s+/));
const WORDS = text => text.toLowerCase().match(/[a-z]+(?:['’][a-z]+)?/g) || [];

export const COMPREHENSION_FAMILIES = [
  {id:'short',label:'Short vowels'}, {id:'digraph',label:'Digraphs and blends'},
  {id:'silent',label:'Silent e'}, {id:'teams',label:'Vowel teams'}
];
// Each question: literal prompt, acceptable answer, three plausible distractors,
// and exact source-sentence indices. Open written responses allow equivalent wording.
const drafts = [
  ["muddy-mat", "Muddy and the Mat", "short", "Short a / short u", "muddy", ["mud","mat","sun"],
    "The mud was warm where Muddy sat. The sun got hot. Across the yard, a mat lay inside a hut. Muddy ran to the hut and felt the mat. It was cool. Muddy curled up on it for a nap.", [
    ["Where was Muddy sitting when the sun got hot?","In the mud",["In the hut","On the mat","Across the yard from the mud"],[0,1]],
    ["How did Muddy check the mat?","By touching the mat",["By watching the sun","By checking the mud","By looking inside the hut"],[3]],
    ["What made the mat better for a nap than the mud?","It felt cooler than the mud",["It was warmer","It lay in the sun","It felt just like the mud"],[0,3,4]]
  ], "Draw the two places Muddy tried. Write hot by one and cool by the other."],
  ["pip-bag", "Pip and the Red Bag", "short", "Short a / short e", "pip", ["bag","red","peg"],
    "A pen and a map went into Pip's red bag. On the way to the peg, the pen fell out. Pip picked it up and looked inside the bag. There was a rip near the bottom. Pip hung the empty bag on the peg. The pen and map went into a box together.", [
    ["What made Pip look inside the bag?","The pen fell out",["The bag fell off the peg","The map fell into the box","The box fell over"],[1,2]],
    ["Where was the rip?","Near the bottom of the bag",["Near the top of the bag","Under the map in the box","Under the peg on the wall"],[3]],
    ["Which two things changed places together?","The pen and the map",["The bag and the map","The pen and the bag","The box and the bag"],[0,5]]
  ], "Draw what was on the peg and what was in the box. Write bag, pen and map."],
  ["fluff-log", "Fluff and the Log", "short", "Short o / short i", "fluff", ["log","hop","sit"],
    "Fluff took a hop onto a big log. The log rolled, and Fluff fell off. A pit in the ground was just wide enough for it. Fluff got up and pushed the log into the pit. This time the log stayed still. Fluff could sit on it without falling.", [
    ["Which thing happened as soon as Fluff landed?","The log rolled under Fluff",["The log stayed still","The log slid into the pit","The log got stuck"],[1]],
    ["What did Fluff do between falling and sitting?","Pushed the log into the pit",["Took a hop onto the log","Sat beside the pit","Rolled out of the pit"],[1,3,5]],
    ["Why could Fluff sit after the fall?","The pit held the log still",["The log rolled past the pit","The log rolled on the ground","Fluff left the log on the ground"],[3,4]]
  ], "Draw the log just after the hop and again in the pit. Write roll or sit beside each picture."],
  ["socks-cup", "Socks and the Cup", "short", "Short u / short e", "socks", ["cup","jug","wet"],
    "Water splashed over the side of the cup. Socks set the jug down and looked at the wet mat. First came the mop. When the mat was dry, Socks tried again. This time Socks poured slowly from the jug. The cup filled without another splash.", [
    ["Which thing did Socks put down to clean up?","The jug",["The mop","The cup","The mat"],[1]],
    ["When did Socks try pouring again?","After the mat was dry",["Before setting the jug down","While the mat was wet","Before using the mop"],[3]],
    ["What changed on the second try?","How fast Socks poured",["Which cup Socks filled","What was in the jug","Where Socks put the mat"],[4,5]]
  ], "Draw both tries at pouring. Write wet by the first mat and dry by the second."],
  ["chips-shed", "Chips in the Shed", "digraph", "sh", "chips", ["shed","fish","dish","shuts"],
    "It is time to feed the fish. Chips goes to the shed for the dish. The shelf looks empty until Chips lifts a big bag. There is the dish, right under it! Chips fills the dish with fish food. With the food ready, Chips shuts the shed door.", [
    ["Why did Chips go to the shed?","To get the dish",["To fill the bag","To shut the door","To move the shelf"],[1]],
    ["What kept Chips from seeing the dish?","The bag on top of it",["The food inside it","The shelf above it","The door behind it"],[2,3]],
    ["When did Chips shut the door?","After filling the dish",["Before finding the dish","Before lifting the bag","Before going to the shelf"],[4,5]]
  ], "Draw the shelf before Chips lifts the bag. Write dish where the dish is hiding."],
  ["chompy-chip", "Chompy Makes a Chip Path", "digraph", "ch", "chompy", ["chip","chips","bench"],
    "Mud covered the path to the bench. Chompy had a bag of wood chips. One chip made a tiny dry spot in the mud. There was still no place for a whole foot. Chompy spread the rest of the chips along the path. Then Chompy walked to the bench with clean feet.", [
    ["Where did Chompy want to walk?","To the bench",["To the bag","To the first chip","To the edge of the mud"],[0]],
    ["What was wrong with the first dry spot?","It was too small for a foot",["It was under the bench","It was too far from the bag","It was full of chips"],[2,3]],
    ["How can we tell the chips worked?","Chompy's feet stayed clean",["The bag held wood chips","The mud covered the path","One chip made a tiny spot"],[4,5]]
  ], "Draw a foot beside one chip, then draw the finished path. Write chips on the path."],
  ["fluff-path", "Fluff and the Branch", "digraph", "th", "fluff", ["thick","path","with"],
    "Around a bend, Fluff found a thick branch across the path. Fluff tried to pull it with one paw. The bag in the other paw bumped against it. Down went the bag. With both paws free, Fluff pulled the branch off the path. Then Fluff picked up the bag and walked on.", [
    ["What kept one paw busy at the bend?","Holding the bag",["Pushing the branch","Picking up things from the path","Holding two branches together"],[1,2]],
    ["Why did Fluff put the bag down?","To use both paws",["To mark the bend","To carry the branch in it","To leave it on the path"],[2,3,4]],
    ["What stayed off the path at the end?","The branch",["The bag","Fluff","Fluff and the bag"],[4,5]]
  ], "Draw Fluff's paws before and after putting down the bag. Write pull by the second picture."],
  ["pip-tent", "Pip and the Tent Peg", "digraph", "st / nt blends", "pip", ["tent","gust","lost"],
    "A gust lifted one side of Pip's tent. A peg was missing from that side. Was it lost inside the tent? Pip looked outside and found it in the grass. Pip pushed the peg deep into the ground. Another gust came, and this time the tent stayed down.", [
    ["What went wrong in the wind?","One side of the tent lifted",["Both sides fell in","The whole tent fell over","The peg bent in the ground"],[0]],
    ["Where did Pip find the missing peg?","In the grass",["In the tent","Deep in the ground","Under the tent"],[3]],
    ["How did Pip know the tent peg held?","That side stayed in place in the wind",["That side lifted again in the wind","The peg lay outside in the grass","The wind had stopped before the test"],[4,5]]
  ], "Draw the side of the tent in each gust. Write peg where Pip put it."],
  ["muddy-cake", "Muddy Saves the Cake", "silent", "a-e", "muddy", ["cake","made","safe"],
    "Muddy had made a cake and set it outside to cool. A ball hit the table. The plate slid, carrying the cake towards the edge. Muddy caught the plate before it fell. Inside, the kitchen table stood still. Muddy left the cake there, safe on its plate.", [
    ["What started the plate moving?","The ball hit the table",["The cake cooled","Muddy caught the plate","Muddy moved the cake inside"],[1,2]],
    ["What would have fallen if Muddy hadn't caught it?","The plate with the cake",["The ball under the table","The kitchen table","The cake without its plate"],[2,3]],
    ["Why did Muddy choose the kitchen table?","It held the plate steady",["It was beside the ball","It already held the cake","It was outside"],[4,5]]
  ], "Draw the moment Muddy caught the plate. Write edge by the part of the table the plate reached."],
  ["socks-kite", "Socks and the Kite", "silent", "i-e", "socks", ["kite","line","time"],
    "Socks ran across the field, but the kite stayed down. The long line stretched tight behind Socks. One bit of line ran under a stone. Socks lifted the stone and pulled the line free. “Time for another run,” said Socks. This time the kite climbed above the field.", [
    ["What was caught under the stone?","Part of the line",["Part of the kite","The whole kite","Both ends of the line"],[2]],
    ["What did Socks do just before pulling the line free?","Lifted the stone off the line",["Ran across the field","Let go of the line","Pulled the kite down"],[3]],
    ["Why did the second run work?","The line was free",["The stone held the line tight","The kite stayed down","Socks ran under the line"],[3,5]]
  ], "Draw the line before the second run. Write stone at the place Socks had to check."],
  ["pip-home", "Pip Finds a Note", "silent", "o-e", "pip", ["home","note","rope"],
    "At home, Pip found a note on the gate. “Look under the rope swing,” said the note. Pip went straight to the swing. There, on the ground, was a little box. Inside lay the cap Pip had lost. Pip wore the cap and carried the box home.", [
    ["Where did the note send Pip?","Under the swing",["Back to the gate","Inside the box","Into the house"],[1]],
    ["What was inside the box?","The cap Pip had lost",["The note from the gate","A piece of rope","A note about the cap"],[3,4]],
    ["Where was the cap on the way home?","On Pip’s head",["In the box","Under the swing","By the gate"],[5]]
  ], "Draw an arrow from the note to the place it names. Write cap inside your box."],
  ["fluff-tune", "Fluff and the Flute", "silent", "u-e", "fluff", ["tune","flute","use"],
    "Fluff played a tune on the flute beside the pond. The ducks began to quack. Fluff kept playing but could hardly hear a note. A tree stood well away from the noisy pond. Fluff went there to use the flute again. This time Fluff could hear every note.", [
    ["What got in the way of hearing the tune?","Quacks from the pond",["Notes from another flute","Ducks beside the tree","A tune across the pond"],[1,2]],
    ["What did Fluff do when the ducks began to quack?","Kept playing at first",["Stopped playing at once","Went to the tree before playing again","Played more quietly at once"],[1,2]],
    ["Where did Fluff go to hear the tune clearly?","By the tree away from the pond",["By the pond beside the ducks","Across the pond beside the ducks","Back to the first place by the pond"],[3,4,5],{"To a tree away from the ducks":"By the tree away from the pond","A tree":"By the tree away from the pond","Into the pond":null,"To a gate":null,"Into a boat":null,"A bench":null,"A gate":null,"A boat":null}]
  ], "Draw the two places Fluff played. Write loud by the ducks and quiet by the tree."],
  ["chips-cube", "Chips and the Ice Cube", "silent", "u-e", "chips", ["cube","use"],
    "Chips has seeds to plant but no empty pot. One tub holds a big ice cube. Chips tries to tip it out. The cube is stuck. Out in the sun, the ice slowly melts into water. Chips pours it away and adds soil. Now Chips can use the tub for seeds.", [
    ["Why couldn't Chips use the tub at first?","Ice filled the tub",["Soil filled the tub","Seeds filled the tub","Water filled the tub"],[1,3]],
    ["What did the sun change?","Ice into water",["Water into ice","Soil into mud","Seeds into plants"],[4]],
    ["What went into the tub after the water came out?","Soil",["Ice","More water","A pot"],[5]]
  ], "Draw the tub twice, once with the cube and once ready for seeds. Write ice and soil."],
  ["chompy-game", "Chompy Makes a Game", "silent", "a-e / i-e", "chompy", ["game","make","line","five"],
    "Five stones and a cup were all Chompy needed for a game. To make a goal, Chompy laid the cup on its side. Chompy drew a line and slid one stone from there. It stopped short of the cup. Chompy moved the cup closer. The next stone went in.", [
    ["How did Chompy set up the goal?","Laid the cup on its side",["Put a stone in the cup","Drew a line around the stones","Set the cup on the line"],[1]],
    ["Where did the first stone stop?","Before the cup",["Inside the cup","Behind the cup","Beside the line it started from"],[3]],
    ["Which change made the goal easier to reach?","Moving the cup nearer the line",["Moving the line behind the stones","Putting all five stones in the cup","Turning the cup away from the line"],[3,4]]
  ], "Draw the line and both places the cup stood. Write first and next by the two places."],
  ["muddy-rain", "Muddy and the Rain Pail", "teams", "ai", "muddy", ["rain","pail","waiting"],
    "Muddy set a pail outside to catch rain for a plant. The rain fell in, but the pail never filled. Drops came through a hole in the bottom. Instead of waiting for more rain, Muddy fetched a bowl. It fit under the pail and caught the drops. There was water for the plant after all.", [
    ["Where was the water going?","Through the bottom of the pail",["Over the top of the pail","Through the bottom of the bowl","Over the top of the bowl"],[1,2]],
    ["Where did Muddy set the bowl?","Under the hole",["Inside the pail","Above the pail","Under the plant"],[2,3,4]],
    ["Why was the bowl useful?","It caught water leaving the pail",["It stopped rain entering the pail","It kept the plant out of the rain","It covered the hole inside the pail"],[2,4]]
  ], "Draw the path of a drop from the sky to the bowl. Write pail and bowl."],
  ["pip-play", "Pip Plans a Play", "teams", "ay", "pip", ["play","day","stay"],
    "On the day of the puppet play, Pip needed a stage. A tray on the grass looked just right. Then one end tipped up when Pip touched the other. “My puppets will fall,” Pip said. Pip set the tray on a low, flat box. Now the puppets could stay on the tray for the play.", [
    ["What did Pip try as a stage first?","A tray on the grass",["A box on the grass","A tray on a box","A box on a tray"],[0,1]],
    ["What happened when Pip touched one end?","The other end tipped up",["Both ends stayed still","The box tipped up","The puppets came out"],[2]],
    ["What did the flat box change?","It stopped the tray from tipping",["It lifted just one end","It held the puppets inside","It lowered the tray onto the grass"],[2,4,5]]
  ], "Draw a side view of the finished stage. Write tray above box."],
  ["fluff-seeds", "Fluff and the Seeds", "teams", "ee", "fluff", ["seeds","three","green"],
    "Fluff planted three seeds in one pot and watered them each week. Two green shoots appeared. Fluff looked for the third one. Fluff left the soil alone and kept watering. A week later, one more shoot came up. Fluff counted again and found all three.", [
    ["What first made Fluff wonder about one seed?","Only two shoots came up",["Three shoots came up together","The pot had no soil","All the soil was dry"],[0,1]],
    ["What did Fluff do while waiting?","Kept watering the same pot",["Planted three more seeds","Moved the two shoots","Dug up the third seed"],[3]],
    ["How was the third shoot different?","It came up a week later",["It came up first","It grew in another pot","It got no water"],[1,4]]
  ], "Draw the pot on two different weeks. Write two and three under the right pictures."],
  ["socks-beach", "Socks at the Beach", "teams", "ea", "socks", ["beach","sea","reach"],
    "On the beach, the wind blew a red cap off Socks. It landed on a rock by the sea. From the sand, Socks stretched but could not reach it. A long stick could. Socks pushed the cap off the rock with the stick. It dropped onto the sand, and Socks picked it up.", [
    ["Where was the cap when Socks first tried to reach it?","On the rock",["On the sand","In the sea","On the stick"],[1,2]],
    ["What did the stick do to the cap?","Pushed it onto the sand",["Pulled it from the sand","Held it on the rock","Lifted it from the sea"],[4,5]],
    ["Why was the cap easier to reach at the end?","It was back on the sand",["It was on a higher rock","The stick was on the sand","The wind caught it again"],[2,5]]
  ], "Draw an arrow showing how the cap moved when the stick touched it. Write rock and sand."],
  ["chips-boat", "Chips and the Little Boat", "teams", "oa", "chips", ["boat","float","soak"],
    "A leaf made a fine little boat for Chips. Chips set it on the pool and added a stone. Down went the boat. Chips took the stone out and tried a small dry stick. The stick did not soak up much water. This time the leaf could float all the way across.", [
    ["What was the boat made from?","A leaf",["A stick","A stone","A leaf wrapped round a stone"],[0]],
    ["What changed between the two trips?","What Chips put in the boat",["What Chips used for the boat","Where Chips put the boat","Who put the leaf on the pool"],[1,3]],
    ["Which load reached the far side?","Just the stick",["Just the stone","Both the stick and stone","No load at all"],[3,5]]
  ], "Draw the two loads on opposite sides of your page. Write sink or float under each boat."],
  ["chompy-snow", "Chompy in the Snow", "teams", "ow as in snow", "chompy", ["snow","slow","low"],
    "Chompy rolled a little ball of snow down a low hill. Chompy watched it grow bigger and bigger. A row of stones lay straight ahead. Chompy put a pile of snow in front of the ball. It hit the pile and began to slow down. The ball stopped just short of the stones.", [
    ["As the ball rolled down the hill, what happened to its size?","It grew bigger",["It became smaller","It stayed the same size","It broke into smaller balls"],[0,1]],
    ["Which did the ball reach first?","The pile of snow",["The row of stones","The end of the row","The grass beside the stones"],[3,4,5]],
    ["Which part of the trip came last?","Stopping short of the stones",["Growing bigger on the hill","Hitting the pile of snow","Rolling down the low hill"],[4,5]]
  ], "Draw the ball, pile and stones in order. Write stop where the ball stopped."],
  ["pip-night", "Pip and the Night Light", "teams", "igh", "pip", ["night","light","bright"],
    "At night, Pip dropped a key in the grass. A bright light held high showed plenty of grass. It did not show the key. Pip lowered the light almost to the ground. Beside a stone, something shone. Pip picked up the key beside the stone.", [
    ["What was Pip trying to find?","A dropped key",["A bright light","A little stone","A patch of grass"],[0]],
    ["Where did Pip hold the light on the first try?","High above the grass",["Low beside the stone","Down near the key","Close to the ground"],[1,2,3]],
    ["Which clue helped Pip spot the key?","Something shone beside a stone",["The grass was bright under the high light","Something fell beside the light","A stone moved in the grass"],[4,5]]
  ], "Draw the light in the position that worked. Write key where Pip spotted it."],
  ["fluff-blue", "Fluff and the Blue Sign", "teams", "ue", "fluff", ["blue","glue"],
    "At Fluff's table, a blue sign promised ten seeds per bag. Fluff counted the seeds before sticking up the sign. One bag held just nine. In went another seed. Now the sign was right for every bag. Fluff used glue to stick it to the table.", [
    ["What did the sign tell people?","How many seeds each bag held",["How many bags were on the table","How much glue to use","How many signs Fluff needed"],[0]],
    ["When did Fluff use the glue?","After adding a seed",["Before counting the seeds","Before finding the short bag","While counting to nine"],[3,5]],
    ["What is wrong with the bag of nine seeds?","The bag needs one more seed",["The bag needs ten more seeds","The sign needs one more bag","The bag needs one less seed"],[0,2],{"The sign says ten, but the bag has nine":"The bag needs one more seed","One seed is missing":"The bag needs one more seed"}]
  ], "Draw the sign beside the corrected bag. Write the number that belongs on the sign."],
  ["socks-trail", "Socks Makes a Trail", "teams", "ai / ay", "socks", ["trail","rain","way","stay"],
    "Paper arrows showed the way along Socks's picnic trail. Rain soaked one arrow, and the paper tore. Socks gathered flat stones from the trail. “These could point the way,” Socks said. Socks laid them in arrow shapes. They could stay in place even in the rain. Socks followed the arrows with the picnic food.", [
    ["What spoiled one of the first arrows?","Rain tore the paper",["Rain moved the flat stones","Food covered the paper","A bag hid the stones"],[0,1]],
    ["What stayed the same when Socks changed the arrows?","The way to the picnic",["The paper on the trail","The stones in their old places","The shape of each stone"],[0,4,6]],
    ["Why did Socks choose stones for the new arrows?","Rain could not tear them",["They could cover the picnic food","They could dry the paper","They could catch the rain"],[1,3,5]]
  ], "Draw a stone arrow that someone could follow. Write picnic at the end it points towards."],
  ["muddy-seat", "Muddy Makes a Seat", "teams", "ee / ea", "muddy", ["seat","tree","needs"],
    "Muddy needs a seat in the shade of a tree. A wide board rests across two short logs. When Muddy tries it, the seat rocks from side to side. One log sits on bumpy ground. Muddy shifts that log to a flat spot. Now the board stays still and Muddy can read.", [
    ["What supported the ends of the board?","Two short logs",["The tree and one log","One log and a book","Two wide boards"],[1]],
    ["Where did Muddy find the trouble?","Under one end of the board",["Across the top of the board","On the side of the tree","In the middle of the board"],[2,3]],
    ["Where did Muddy put the log to steady the seat?","On a flat spot",["On the bumpy ground","On the wide board","Across the other log"],[3,4]]
  ], "Draw the board and show what is under each end. Write flat under the log Muddy moved."]
];

// Plain meanings support vocabulary without giving a question answer.
const WORD_HELP = {
  "muddy-mat": [["hut","a small house"],["nap","a short sleep"]],
  "pip-bag": [["rip","a tear or hole"],["peg","a short stick used to hang things"]],
  "fluff-log": [["log","a thick piece of wood from a tree"],["pit","a hole in the ground"]],
  "socks-cup": [["jug","a pot with a handle for pouring drinks"],["mop","a tool for cleaning floors"]],
  "chips-shed": [["shed","a small building for keeping things"]],
  "chompy-chip": [["wood chips","small bits of wood"],["bench","a long seat"]],
  "fluff-path": [["branch","a part of a tree"],["path","a place to walk along"]],
  "pip-tent": [["gust","a strong rush of wind"],["peg","a short stake pushed into the ground"]],
  "muddy-cake": [["edge","the side of the table"]],
  "socks-kite": [["line","a long string"],["stretched","pulled out straight"]],
  "pip-home": [["note","a short written message"],["rope swing","a seat that hangs from a rope"]],
  "fluff-tune": [["flute","a musical instrument you blow into"],["tune","a short piece of music"]],
  "chips-cube": [["melts","changes from ice to water"],["soil","the earth that plants grow in"]],
  "chompy-game": [["goal","a place to aim for"]],
  "muddy-rain": [["pail","a bucket"]],
  "pip-play": [["puppet","a toy you move to tell a story"],["stage","a place to put on a show"]],
  "fluff-seeds": [["seed","a small part of a plant that can grow"]],
  "socks-beach": [["reach","stretch your arm to touch something"]],
  "chips-boat": [["soak up","take in water"],["float","stay on top of water"]],
  "chompy-snow": [["pile","a heap of things in one place"]],
  "pip-night": [["bright","giving a lot of light"]],
  "fluff-blue": [["sign","written words that tell people something"]],
  "socks-trail": [["trail","a path"],["arrow","a mark that shows which way to go"]],
  "muddy-seat": [["board","a flat piece of wood"],["logs","thick pieces of wood from a tree"]]
};

// Shared with the paged renderer so quoted endings stay attached to their evidence.
export function passageSentences(text) {
 return text.trim().split(/(?<=[.!?][”"]?)\s+/u);
}

export const COMPREHENSION_PASSAGES = [...drafts,...ADDITIONAL_COMPREHENSION_DRAFTS,...EXPANSION_COMPREHENSION_DRAFTS].map(([id,title,family,focus,character,targetWords,text,questions,draw]) => {
 const sentences = passageSentences(text);
 // Support includes proper names, inflections and unfamiliar vocabulary. It is
 // deliberately conservative: never guess that a substring proves decodability.
 const supportWords = [...new Set(WORDS(text).filter(w=>!FOUNDATION.has(w)&&!targetWords.includes(w)))];
 return Object.freeze({id,title,family,focus,character,targetWords,text,sentences,draw,
  discussion:ORIGINAL_DISCUSSION[id] || EXPANSION_DISCUSSION[id], practiceEdition:'2026-11', band:'B', construct:'Text-supported reading comprehension', responseMode:'Select; discuss or write on print',
  wordCount:WORDS(text).length, supportWords, wordHelp:WORD_HELP[id]||ADDITIONAL_WORD_HELP[id]||EXPANSION_WORD_HELP[id],
  prerequisites: family==='short' ? ['Short vowel sounds','CVC blending','Preview support words']
    : family==='digraph' ? ['Short vowels',focus,'Preview support words']
    : family==='silent' ? ['Short vowels','Consonant digraphs and blends',focus,'Preview support words']
    : ['Short vowels','Consonant digraphs and blends','Silent e',focus,'Preview support words'],
  readingMode:'Phonics-focused; preview support words',
  questions:questions.map(([prompt,answer,distractors,evidence,previousOptions],i)=>{
   const options=[answer,...distractors];
   return {id:`${id}-q${i+1}`,prompt,answer,options,evidence:evidence.map(n=>sentences[n]),...(previousOptions?{previousOptions}:{})};
  })
 });
});
export function passageById(id) { return COMPREHENSION_PASSAGES.find(p=>p.id===id)||null; }
