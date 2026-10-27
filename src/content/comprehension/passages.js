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
 ['muddy-mat','Muddy and the Mat','short','Short a / short u','muddy',['mud','mat','sun'],
  'Muddy sat in the mud. The sun was hot. Muddy got up and ran to a mat. The mat was in a hut. Muddy sat on it. The mat was not hot. Muddy had a nap in the hut.',[
   ['Where was Muddy at first?','In the mud',['In the hut','On the mat','In a bed'],[0]],
   ['Where was the mat?','In a hut',['In a van','In a box','In a bag'],[3]],
   ['Why did Muddy have a nap in the hut?','The mat there was not hot',['The sun was in the hut','The mat was wet','The hut had a bed'],[1,5,6]]
  ],'Draw Muddy resting in the hut. Label the mat.'],
 ['pip-bag','Pip and the Red Bag','short','Short a / short e','pip',['bag','red','peg'],
  'Pip had a red bag. Pip put a pen in it. Then Pip put a map in the bag. The bag had a rip. The pen fell out. Pip got the pen and put the bag on a peg. Pip got a box for the pen and map.',[
   ['What colour was the bag?','Red',['Tan','Pink','Black'],[0]],
   ['What fell out of the bag?','The pen',['The map','The peg','The box'],[4]],
   ['Why did Pip get a box?','The bag had a rip',['The pen was red','The map was wet','The peg was in the box'],[3,6]]
  ],'Draw what Pip put in the box. Label both things.'],
 ['fluff-log','Fluff and the Log','short','Short o / short i','fluff',['log','hop','sit'],
  'Fluff can hop on a log. The log is big. Fluff hops up, but the log tips. Fluff gets off. Fluff puts the log in a pit. It cannot tip in the pit. Now Fluff can hop up and sit on the log.',[
   ['What does Fluff hop on?','A log',['A box','A mat','A bed'],[0]],
   ['What happens when Fluff first hops up?','The log tips',['The log rolls into a hut','The log gets wet','The log snaps'],[2]],
   ['Why can Fluff sit on the log at the end?','It cannot tip in the pit',['It is now a box','It has a lid','It is now small'],[4,5,6]]
  ],'Draw the log in the pit. Label the log and pit.'],
 ['socks-cup','Socks and the Cup','short','Short u / short e','socks',['cup','jug','wet'],
  'Socks has a cup and a jug. The jug is full. Socks tips the jug to fill the cup. Some spills on the mat. The mat is wet. Socks gets a mop. Socks mops up the spill, then fills the cup a bit at a time.',[
   ['What is full at the start?','The jug',['The cup','The mop','The mat'],[1]],
   ['What gets wet?','The mat',['The bed','The bag','The hat'],[4]],
   ['What does Socks do after mopping?','Fills the cup a bit at a time',['Puts the cup in a bag','Tips the cup onto the mat','Fills the mop'],[6]]
  ],'Draw the cup and jug. Label both.'],
 ['chips-shed','Chips in the Shed','digraph','sh','chips',['shed','fish','dish','shuts'],
  'Chips has a dish for the fish. The dish is in the shed. Chips opens the shed, but cannot see the dish. A big bag is on top of it. Chips shifts the bag and gets the dish. Chips fills it, then shuts the shed.',[
   ['Who is the dish for?','The fish',['Chips','A hen','A dog'],[0]],
   ['What hides the dish?','A big bag',['A mat','A box','A jug'],[3]],
   ['What does Chips do to find the dish?','Shifts the bag',['Shuts the shed','Fills the dish','Moves the shed'],[4]]
  ],'Draw the bag on top of the dish. Label both.'],
 ['chompy-chip','Chompy Makes a Chip Path','digraph','ch','chompy',['chip','chips','much'],
  'Chompy has a bag of wood chips. The path to the bench is wet. Chompy puts a chip on the path. One chip is not much help. Chompy adds the rest of the chips. Now the wet patch is covered. Chompy can get to the bench.',[
   ['What is in the bag?','Wood chips',['Fish','Nuts','Shells'],[0]],
   ['Where does the path go?','To the bench',['To a shed','To a shop','To a pond'],[1]],
   ['Why does Chompy add more chips?','One chip is not much help',['The bench is in the bag','The chips are wet','The path has gone'],[3,4,5]]
  ],'Draw the chip path to the bench. Label the path.'],
 ['fluff-path','Fluff on the Thin Path','digraph','th','fluff',['thin','path','with'],
  'Fluff walks on a thin path with a bag. A thick branch is on the path. Fluff cannot step over it with the bag. Fluff puts the bag down and shifts the branch. Then Fluff picks up the bag. The path is clear for the rest of the walk.',[
   ['What is Fluff carrying?','A bag',['A dish','A net','A cup'],[0]],
   ['What blocks the path?','A thick branch',['A thin mat','A big bag','A wet log'],[1]],
   ['What does Fluff do before shifting the branch?','Puts the bag down',['Picks up the bag','Finishes the walk','Climbs a tree'],[3,4]]
  ],'Draw Fluff clearing the path. Label the branch.'],
 ['pip-tent','Pip and the Tent Peg','digraph','st / nt blends','pip',['tent','gust','lost'],
  'Pip puts up a tent. A gust lifts one side. Pip sees that a peg is lost. Pip looks in the long grass next to the tent. There is the peg. Pip puts it back in the ground. The next gust comes, but the tent stays up.',[
   ['What lifts one side of the tent?','A gust',['A peg','The grass','A bag'],[1]],
   ['Where does Pip find the peg?','In the long grass',['In the tent','Under a bed','In a box'],[3,4]],
   ['Why does the tent stay up at the end?','Pip puts the peg back',['The tent is gone','Pip cuts the grass','There is no next gust'],[5,6]]
  ],'Draw the tent with its pegs. Label one peg.'],
 ['muddy-cake','Muddy Saves the Cake','silent','a-e','muddy',['cake','made','safe'],
  'Muddy made a cake. Muddy put it on a plate by the gate. A ball hit the gate and made it shake. The plate slid close to the edge. Muddy caught the plate and took the cake inside. The cake was safe on the big table.',[
   ['What did Muddy make?','A cake',['A game','A kite','A boat'],[0]],
   ['What made the gate shake?','A ball',['The plate','The cake','A bag'],[2]],
   ['Where was the cake safe at the end?','On the big table',['By the gate','On the edge','On the grass'],[5]]
  ],'Draw the cake in its safe place. Label the cake.'],
 ['socks-kite','Socks and the Kite','silent','i-e','socks',['kite','line','side'],
  'Socks took a kite to the field. The kite had a long line. Socks ran, but the kite fell on its side. The line was stuck under a stone. Socks lifted the stone and freed the line. This time the kite rose high in the sky.',[
   ['Where did Socks take the kite?','To the field',['To the shed','To the beach','To the pond'],[0]],
   ['What was under a stone?','The line',['The kite','A bag','A plate'],[3]],
   ['Why could the kite rise at the end?','Socks freed the line',['Socks made the stone bigger','The kite lost its line','Socks went inside'],[4,5]]
  ],'Draw the kite in the sky. Label the kite and line.'],
 ['pip-home','Pip Finds a Note','silent','o-e','pip',['home','note','rope'],
  'Pip came home and found a note on the gate. The note said to look by the rope. Pip went to the rope swing. A small box was under it. In the box was the cap Pip had lost. Pip put on the cap and took the box home.',[
   ['Where was the note?','On the gate',['In the box','On the rope','Under the cap'],[0]],
   ['What was in the box?','The lost cap',['The note','The rope','A cake'],[4]],
   ['What helped Pip find the box?','The note',['The cap','A kite','A map in the box'],[1,2,3]]
  ],'Draw where Pip found the box. Label the rope and box.'],
 ['fluff-tune','Fluff and the Flute','silent','u-e','fluff',['tune','flute','use'],
  'Fluff can play a tune on a flute. Fluff wants to use it by the pond. The pond is full of noise. Fluff cannot hear the soft tune. Fluff moves to a quiet spot under a tree. There, Fluff can hear each note and play the tune again.',[
   ['What does Fluff play?','A flute',['A drum','A bell','A horn'],[0]],
   ['Why does Fluff leave the pond?','It is too noisy to hear the tune',['The flute is lost','The tree falls','The tune is finished'],[2,3]],
   ['Where does Fluff play at the end?','Under a tree',['In the pond','By a gate','In a boat'],[4,5]]
  ],'Draw Fluff in the quiet spot. Label the tree.'],
 ['chips-cube','Chips and the Ice Cube','silent','u-e','chips',['cube','huge','use'],
  'Chips has a huge ice cube in a tub. Chips wants to use the tub for plants. The cube will not tip out. Chips puts the tub in the sun. Bit by bit, the ice melts. Chips pours out the water. Now the tub has space for soil and seeds.',[
   ['What is in the tub at first?','A huge ice cube',['Soil','Plants','Seeds'],[0]],
   ['Where does Chips put the tub?','In the sun',['In the shed','Under a bed','In the pond'],[3]],
   ['Why can Chips use the tub for plants at the end?','The ice has melted and the water is out',['The ice has grown','The tub is full of ice','The plants have gone'],[4,5,6]]
  ],'Draw what Chips can put in the empty tub. Label it.'],
 ['chompy-game','Chompy Makes a Game','silent','a-e / i-e','chompy',['game','make','line','five'],
  'Chompy wants to make a game with five stones. Chompy draws a line in the dust and sets a cup beyond it. The aim is to slide a stone into the cup. The first stone stops short. Chompy moves the cup closer, then tries again. This stone lands in the cup.',[
   ['How many stones does Chompy have?','Five',['One','Three','Ten'],[0]],
   ['What is the aim of the game?','Slide a stone into the cup',['Put dust in the cup','Stack stones on the line','Hide the cup'],[2]],
   ['What does Chompy change after the first try?','Moves the cup closer',['Moves the line farther away','Gets a bigger stone','Takes away the cup'],[3,4]]
  ],'Draw the game. Label the line and cup.'],
 ['muddy-rain','Muddy and the Rain Pail','teams','ai','muddy',['rain','pail','wait'],
  'Muddy sets a pail by the gate to catch the rain. Muddy wants the water for a small plant. After the rain, Muddy lifts the pail. Water drips through a crack in its base. Muddy slips a bowl under the pail. The bowl catches the water. Muddy does not have to wait for more rain.',[
   ['Why does Muddy collect rain?','For a small plant',['To wash a gate','To fill the pond','To make a cake'],[1]],
   ['Why does water drip from the pail?','There is a crack in its base',['The pail is too full','The bowl has a crack','The rain has stopped'],[3]],
   ['What saves the water?','A bowl under the pail',['A cap on the gate','A leaf on the plant','A bag by the gate'],[4,5]]
  ],'Draw the bowl catching water. Label the pail and bowl.'],
 ['pip-play','Pip Plans a Play','teams','ay','pip',['play','day','stay'],
  'Pip plans a play for a sunny day. Pip makes a stage from a flat tray. The tray starts to sway on the grass. Pip puts it on a low, wide box. Now the stage can stay still. Pip sets out the little puppets. The play can begin.',[
   ['What is the stage made from?','A flat tray',['A long rope','A big leaf','A plate'],[1]],
   ['What goes under the tray?','A low, wide box',['A tall cup','A soft bag','A thin stick'],[3]],
   ['Why does Pip move the tray?','It starts to sway on the grass',['The puppets are lost','The play is over','The sun has gone'],[2,3]]
  ],'Draw the puppet stage. Label the tray and box.'],
 ['fluff-seeds','Fluff and the Seeds','teams','ee','fluff',['seeds','three','green'],
  'Fluff has three seeds in a little pot. Each week, Fluff gives them water. Two green shoots appear, but the third seed has no shoot. Fluff keeps the soil damp and waits. At the end of the next week, a third green shoot appears. All three seeds have begun to grow.',[
   ['How many seeds does Fluff plant?','Three',['Two','Four','Six'],[0]],
   ['How many shoots appear first?','Two',['One','Three','Five'],[2]],
   ['What does Fluff do while waiting?','Keeps the soil damp',['Throws away the pot','Pulls out the seeds','Stops giving water'],[3]]
  ],'Draw the pot at the end. Label one green shoot.'],
 ['socks-beach','Socks at the Beach','teams','ea','socks',['beach','sea','reach'],
  'Socks walks on the beach by the sea. A red cap blows off and lands on a rock. Socks cannot reach it from the sand. Socks finds a long stick and slides the cap off the rock. The cap lands on dry sand. Socks picks it up and holds it tight.',[
   ['Where does the cap land first?','On a rock',['In the sea','On dry sand','In a boat'],[1]],
   ['What does Socks use to reach the cap?','A long stick',['A shell','A bag','A rope'],[3]],
   ['Why does Socks need the stick?','The cap is out of reach',['The stick is red','The cap is in a bag','The sea is dry'],[2,3]]
  ],'Draw how Socks gets the cap. Label the rock and stick.'],
 ['chips-boat','Chips and the Little Boat','teams','oa','chips',['boat','float','soak'],
  'Chips makes a little boat from a leaf. Chips sets it in a shallow pool. A small stone makes the boat sink. Chips takes the stone out and tries a dry twig instead. The twig does not soak up much water. Now the leaf boat can float across the pool.',[
   ['What is the boat made from?','A leaf',['A stone','A twig','A shell'],[0]],
   ['What makes the boat sink?','A small stone',['A dry twig','The shallow pool','The leaf stem'],[2]],
   ['What does Chips put in instead of the stone?','A dry twig',['A second stone','A wet bag','A cup of water'],[3]]
  ],'Draw the floating boat. Label the leaf and twig.'],
 ['chompy-snow','Chompy in the Snow','teams','ow as in snow','chompy',['snow','slow','low'],
  'Chompy rolls a ball of snow down a low slope. The ball grows as it rolls. Chompy wants it to stop by a row of stones. The ball is moving too fast. Chompy adds a ridge of snow in its path. The ridge makes the ball slow down and stop before the stones.',[
   ['What grows as it rolls?','The snowball',['The slope','The row of stones','The ridge'],[1]],
   ['Where does Chompy want the ball to stop?','By a row of stones',['In a pond','Inside a shed','On a bridge'],[2]],
   ['Why does Chompy add a ridge?','To slow the ball down',['To make the ball faster','To hide the stones','To melt the snow'],[4,5]]
  ],'Draw the ridge stopping the snowball. Label the ridge.'],
 ['pip-night','Pip and the Night Light','teams','igh','pip',['night','light','bright'],
  'Pip takes a light outside at night to find a dropped key. The light makes the grass bright, but Pip cannot see the key. Pip lowers the light close to the ground. A small shape shines beside a stone. It is the key. Pip picks it up and goes inside.',[
   ['What is Pip looking for?','A key',['A cap','A seed','A coin'],[0]],
   ['What does Pip do with the light?','Lowers it close to the ground',['Puts it inside a box','Turns it off','Hangs it in a tree'],[2]],
   ['Where is the key?','Beside a stone',['Under a pot','On the gate','In the light'],[3,4]]
  ],'Draw where Pip finds the key. Label the key and stone.'],
 ['fluff-blue','Fluff and the Blue Sign','teams','ue','fluff',['blue','glue','true'],
  'Fluff makes a blue sign for the seed stall. The sign says that each bag has ten seeds. Fluff counts the seeds to check that the sign is true. One bag has only nine. Fluff adds one seed, then uses glue to fix the sign to the stall. Now every bag matches the sign.',[
   ['What colour is the sign?','Blue',['Green','Red','Yellow'],[0]],
   ['What is wrong with one bag?','It has only nine seeds',['It has eleven seeds','It has no seeds','It has only one seed'],[3]],
   ['Why does Fluff count the seeds?','To check that the sign is true',['To mix the glue','To make the sign blue','To close the stall'],[1,2]]
  ],'Draw a bag with the right number of seeds. Label it.'],
 ['socks-trail','Socks Makes a Trail','teams','ai / ay','socks',['trail','rain','way','stay'],
  'Socks lays paper arrows along a trail. The arrows show the way to a picnic. Rain begins, and one arrow turns to mush. Socks puts flat stones in arrow shapes instead. The stones can stay in place in the rain. Socks follows the new trail and reaches the picnic with a dry bag of food.',[
   ['What do the arrows show?','The way to a picnic',['The way to a shop','The way to a cave','The way to a beach'],[1]],
   ['What happens to one paper arrow?','It turns to mush',['It turns into a stone','It falls in a bag','It points to a shop'],[2]],
   ['Why does Socks use stones?','They can stay in place in the rain',['They are made of paper','They keep the food warm','They stop the rain'],[3,4]]
  ],'Draw one stone arrow on the trail. Label it.'],
 ['muddy-seat','Muddy Makes a Seat','teams','ee / ea','muddy',['seat','tree','needs'],
  'Muddy needs a seat by the tree. Muddy finds a wide plank and two short logs. Muddy sets one end of the plank on each log. The seat wobbles on the uneven ground. Muddy moves one log to a flat spot and tests the seat again. This time it is steady. Muddy can sit and read.',[
   ['Where does Muddy need a seat?','By the tree',['By the sea','In a boat','In a shed'],[0]],
   ['What supports the plank?','Two short logs',['Three tall sticks','A wide bowl','A small box'],[1,2]],
   ['How does Muddy make the seat steady?','Moves one log to a flat spot',['Adds a book to the plank','Puts a bag on the tree','Takes both logs away'],[3,4,5]]
  ],'Draw the steady seat. Label the plank and logs.']
];

export const COMPREHENSION_PASSAGES = drafts.map(([id,title,family,focus,character,targetWords,text,questions,draw], passageIndex) => {
 const sentences = text.match(/[^.!?]+[.!?]+/g).map(s=>s.trim());
 // Support includes proper names, inflections and unfamiliar vocabulary. It is
 // deliberately conservative: never guess that a substring proves decodability.
 const supportWords = [...new Set(WORDS(text).filter(w=>!FOUNDATION.has(w)&&!targetWords.includes(w)))];
 return Object.freeze({id,title,family,focus,character,targetWords,text,sentences,draw,
  band:'B', construct:'Text-supported reading comprehension', responseMode:'Select; discuss or write on print',
  wordCount:WORDS(text).length, supportWords,
  prerequisites: family==='short' ? ['Short vowel sounds','CVC blending','Preview support words']
    : family==='digraph' ? ['Short vowels',focus,'Preview support words']
    : family==='silent' ? ['Short vowels','Consonant digraphs and blends',focus,'Preview support words']
    : ['Short vowels','Consonant digraphs and blends','Silent e',focus,'Preview support words'],
  readingMode:'Phonics-focused; preview support words',
  questions:questions.map(([prompt,answer,distractors,evidence],i)=>{
   const options=[answer,...distractors]; const shift=(passageIndex+i)%4;
   return {id:`${id}-q${i+1}`,prompt,answer,options:[...options.slice(shift),...options.slice(0,shift)],evidence:evidence.map(n=>sentences[n])};
  })
 });
});
export function passageById(id) { return COMPREHENSION_PASSAGES.find(p=>p.id===id)||null; }
