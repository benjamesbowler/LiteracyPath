const rows=[];
const add=(templateId,id,prompt,passage,labels,explanation,foilReasons)=>rows.push({templateId,id,prompt,passage,labels,explanation,foilReasons,paired:true,
  demand:'Combine more than one supplied clue; reject an alternative supported only by a nearby detail or contradicted by the account.',
  sourceFile:'src/data/literacyMockComprehensionCapacityInference.js'});
const feeling=(...args)=>add('mock.depth.inference.stage',...args);
feeling('first-audition','How is Theo most likely feeling before his turn?',
  'Theo knew his song well at home. Now he waited outside the audition room, rubbing his palms on his trousers. Each time a name was called, he looked up quickly and checked that his music was still in his hand. He had not yet heard anyone’s decision.',
  ['nervous about performing','angry about the decision','bored with waiting for lunch'],'His repeated checking and restless hands suggest nervousness before performing.',
  ['No decision has been made for him to be angry about.','His alert reactions show concern about the audition, not lunch or boredom.']);
feeling('found-ring','How does Nan most likely feel at the end?',
  'Nan had searched the kitchen twice for her ring. She kept looking at her bare finger. When it appeared in the bottom of a shopping bag, she let out a long breath and smiled. She put it on and finally sat down with her untouched cup of tea.',
  ['relieved that the ring is safe','disappointed with the ring','jealous of someone’s jewellery'],'Her searching stops and she relaxes when the missing ring is found.',
  ['She smiles and puts the ring on rather than rejecting it.','No other person’s jewellery is involved.']);
feeling('unopened-letter','How is Safa most likely feeling about the letter?',
  'A letter with her name arrived from a country Safa had never visited. She turned the envelope over, examined the unfamiliar stamp and asked who might have sent it. Before opening it, she fetched an atlas to find the country marked beside the stamp.',
  ['curious about its sender and origin','ashamed of sending it late','tired of receiving the same letter'],'Her questions, inspection and atlas search show a wish to learn more.',
  ['She is receiving this letter, not apologizing for sending it.','Its unfamiliar stamp and origin show novelty rather than repeated boredom.']);
feeling('cancelled-trip','How is Ben most likely feeling when the trip is cancelled?',
  'Ben had counted the days until the boat trip. His packed bag waited by the door. When the trip was cancelled because of strong winds, he lowered his head and slowly unpacked the binoculars. He asked whether there might be another trip next month.',
  ['disappointed about missing the trip','relieved to avoid a trip he disliked','proud of sailing in strong winds'],'His eager preparation followed by dejected unpacking indicates disappointment.',
  ['Counting the days and preparing eagerly show he wanted the trip.','The trip never takes place, so he has not sailed in the wind.']);
feeling('finished-mural','How does Eli most likely feel about the finished mural?',
  'Eli had spent weeks helping paint the school mural. At its opening, he stood a little taller when visitors admired the river he had painted. He pointed out the tiny fish to his family and smiled while explaining how he had mixed the colours.',
  ['proud of his contribution','worried that the mural is missing','lonely because nobody came'],'His posture, smile and eagerness to show his work suggest pride.',
  ['He is showing the completed mural to visitors.','Visitors and his family are present.']);
feeling('pushed-aside','How does Mara most likely feel when her partner interrupts?',
  'Mara began explaining her idea for the model. Her partner interrupted again and moved her pieces aside. Mara pressed her lips together and said firmly, “Please let me finish. I have listened to your idea.” She kept her own plan open on the table.',
  ['frustrated at not being heard','grateful for the interruption','afraid that her plan is lost'],'Her firm request and tense expression show frustration with being interrupted.',
  ['She asks for the interruption to stop rather than thanking her partner.','Her plan remains open in front of her.']);
feeling('surprise-visit','How does Grandpa most likely feel when he opens the door?',
  'Grandpa expected a quiet afternoon alone. When he opened the door, his grandchildren stood there with a picnic basket. His eyebrows rose and he said, “You’re here!” Then he laughed and quickly made room for everyone to come inside.',
  ['happily surprised by the visitors','annoyed that nobody visited','worried because he knew they were coming'],'Raised eyebrows show surprise, while laughter and welcoming them show pleasure.',
  ['The grandchildren are present, and he welcomes them.','He expected to be alone, so he had not known about the visit.']);
feeling('team-invitation','How does Inez most likely feel after the invitation?',
  'Inez watched a group play from the edge of the yard. She wanted to join but had not spoken. A player waved her over and explained the game. Inez’s tight shoulders relaxed, and soon she was laughing and taking her turn with the others.',
  ['welcomed and more at ease','upset about being left out of every turn','embarrassed because the group sent her away'],'Joining, relaxing and laughing suggest that the invitation made her feel welcome.',
  ['She takes turns with the group.','The player invites her in rather than sending her away.']);

const place=(...args)=>add('mock.depth.inference.repair',...args);
place('returned-books','Where is Lena most likely waiting?',
  'Lena placed two borrowed books into a return slot. Ahead of her, someone asked a worker where to find books about stars. Rows of labelled shelves filled the room, and a sign asked visitors to keep their voices low. Lena waited with her borrowing card in her hand.',
  ['at a library’s book-return desk','at a bookshop till','at a theatre entrance'],'Returning borrowed books and using a borrowing card identify a library.',
  ['A bookshop sells books; the borrowing and return clues point elsewhere.','A theatre entrance does not fit the book return and shelves.']);
place('tooth-check','Where is Omar most likely sitting?',
  'Omar leaned back in a wide chair. A bright lamp shone towards his mouth. The person beside him wore gloves and asked him to open wide while she checked each tooth with a small mirror. Omar’s coat hung by the door, and a cup stood near the chair.',
  ['in a dentist’s room','in a hairdresser’s chair','in a classroom reading corner'],'Checking teeth with a mouth mirror distinguishes a dental visit.',
  ['A hairdresser may use a chair and mirror, but does not examine each tooth.','The specialized tooth examination does not fit a reading corner.']);
place('departure-board','Where are the travellers most likely waiting?',
  'Travellers watched a board showing track numbers and departure times. An announcement said their train would leave from track four. They pulled their cases towards the platform, staying behind the marked line until it was time to board. A ticket inspector checked the route on their tickets.',
  ['at a railway station','at an airport gate','at a bus stop'],'Train, tracks and platform clues together identify a railway station.',
  ['An airport has departures and tickets, but not a train on track four.','A bus stop does not use railway tracks and platforms.']);
place('animal-check','Where is Priya most likely taking her rabbit?',
  'Priya carried her rabbit in a box with air holes. In the waiting room, a dog sat beside its owner. A worker called the rabbit’s name and led Priya to a room with scales and an examination table. The rabbit’s health card lay open beside the scales.',
  ['to an animal clinic','to an animal food shop','to a classroom pet show'],'The named appointment, examination table and health record suggest veterinary care.',
  ['Animal supplies alone would not explain a health examination.','The examination equipment and appointment fit a clinic rather than a display.']);
place('baking-counter','Where is Suri most likely shopping?',
  'Suri looked through glass at warm loaves and trays of rolls. Behind the counter, a worker dusted flour from an apron and placed dough into an oven. Suri chose a seeded loaf, which the worker sliced and wrapped before taking payment.',
  ['at a bakery selling fresh bread','at a seed stall','at a pottery workshop'],'Making and selling loaves from dough identifies a bakery.',
  ['Seeded describes the loaf; the passage is about buying bread, not planting seeds.','An oven and apron alone could fit pottery, but dough and sliced loaves do not.']);
place('paintings-room','Where is the family most likely visiting?',
  'The family moved slowly between paintings hung on plain walls. Small labels gave the artists’ names and dates. A guide explained how one artist had used light and shadow. The children were asked to look closely without touching the pictures.',
  ['an art gallery with labelled paintings','a paint shop','a family kitchen'],'Displayed paintings, artist labels and a guide indicate an art gallery.',
  ['A supply shop sells materials rather than presenting labelled works for a guided visit.','The arrangement of public displays does not suggest a kitchen.']);
place('lane-rope','Where is Ravi most likely having a lesson?',
  'Ravi put his towel on a bench and pulled goggles over his eyes. A rope divided the water into lanes. His instructor waited beside a ladder and reminded him to breathe out under the water. A lifeguard watched the people from a tall chair.',
  ['at a swimming pool','beside a boating lake','at a climbing centre'],'Goggles, swimming lanes and underwater breathing instruction identify a pool lesson.',
  ['Boating does not fit practising breathing under water in marked lanes.','The ladder alone is not enough to support climbing when the other clues concern swimming.']);
place('plant-labels','Where is Mei most likely choosing a present?',
  'Mei walked between rows of living plants in pots. Labels explained how much light each plant needed. A worker helped her choose one that suited a sunny window and added a bag of potting soil. Mei paid for it at a counter near stacks of empty flowerpots.',
  ['at a garden centre','at a vegetable market','at a furniture shop'],'Potted plants, care labels and potting soil identify a garden centre.',
  ['The purchase is a living window plant, not harvested vegetables.','The sunny window is where the plant will go; no furniture is being sold.']);

const predict=(...args)=>add('mock.depth.inference.kite',...args);
predict('loose-shoelace','What will Nia most likely do next?',
  'Nia was about to join a running game when she felt a lace brush her ankle. She looked down and saw that one shoe was untied. She stepped out of the players’ way and bent towards the shoe, keeping its loose lace in her hand.',
  ['tie her loose lace before joining the running game','run with her lace loose','take off both shoes'],'Stepping aside, bending and holding the lace prepare her to tie it.',
  ['Her preparatory actions show that she has paused before running.','She is holding the loose lace to address one untied shoe; nothing suggests removing both shoes.']);
predict('empty-paint-tray','What will the painter most likely do next?',
  'The painter rolled a patch of blue onto the wall, but the colour grew faint. The paint tray was nearly empty. She put the roller down, removed the lid from the blue paint tin and lifted the tin towards the tray.',
  ['refill the empty tray from the open blue paint tin','wipe the painted patch','carry the tray away'],'Opening and lifting the paint tin towards the empty tray signals a refill.',
  ['No cloth is mentioned, and she is preparing more paint.','She brings paint towards the tray instead of carrying it away.']);
predict('bus-number-check','What will Ben most likely do next?',
  'Ben needed bus twelve. A bus approached showing twelve above its windscreen. He checked the number once more, closed his book and stood near the boarding point with his travel card ready. The bus slowed beside him.',
  ['use his travel card to board the number twelve bus','reopen his book','look for another bus'],'The correct bus and his ready card support boarding next.',
  ['Closing the book and standing ready suggest the opposite.','The arriving bus already has the number he needs.']);
predict('paper-rip','What will the child most likely do next?',
  'The paper chain broke between two loops. Eva picked up a short strip of sticky tape and brought the torn edges together. She held them still with one hand while peeling the tape from her other hand.',
  ['attach the sticky tape to join the torn paper edges','tear the loops apart','put the tape away'],'She aligns the tear and prepares sticky tape for a repair.',
  ['Holding the edges together shows repair rather than further tearing.','She is peeling and positioning the tape to use it.']);
predict('overflowing-bin','What will the caretaker most likely do next?',
  'The recycling bin was full, and its lid would not close. The caretaker brought an empty bag, opened it beside the bin and put on work gloves. He checked the label to make sure the contents belonged in the recycling collection.',
  ['transfer the recycling into the bag','leave more rubbish on top of the lid','wash the bin without removing its contents'],'The open bag and gloves prepare him to empty the full bin.',
  ['The full bin is the problem he is preparing to solve.','The prepared bag and collection check support emptying the bin; no washing tools are described.']);
predict('garden-hose-kink','What will Lia most likely try next?',
  'Lia turned on the tap, but little water reached the hose nozzle. She followed the hose and found it sharply bent beneath a chair leg. She put down the nozzle and reached for the chair, keeping her eyes on the trapped section.',
  ['move the chair and straighten the hose','turn the nozzle towards a different flower','turn the tap higher while leaving the chair in place'],'She has identified the blocked section and is reaching to release it.',
  ['Changing the flower does not address the bent hose she is examining.','She has put down the nozzle and reached for the chair, not returned to the tap.']);
predict('recipe-measure','What will the cook most likely do next?',
  'The recipe said to add one cup of oats. Uma found the measuring cup, opened the oat jar and placed the mixing bowl beside her. She held the cup over the jar so any spilled oats would fall back inside.',
  ['measure a cup of oats for the bowl','wash the bowl before adding anything','pour oats straight from the jar without measuring'],'The recipe and prepared measuring cup support measuring oats next.',
  ['She is preparing the ingredients, not water or washing tools.','Holding the measuring cup over the jar shows that she is about to measure the specified amount.']);
predict('quiet-birdwatch','What will Arun most likely do next?',
  'Arun heard a bird call from the reeds. He stopped talking and slowly lifted his binoculars. His friend pointed to a brown bird on a stem, and Arun turned the binoculars towards that exact spot.',
  ['look at the bird through the binoculars','shout so the bird flies somewhere else','pack the binoculars away without looking'],'Lifting and aiming the binoculars prepares him to observe the bird.',
  ['He deliberately stopped talking and moved slowly.','His attention and the binoculars are directed towards the bird.']);

export const comprehensionCapacityInference=rows;
