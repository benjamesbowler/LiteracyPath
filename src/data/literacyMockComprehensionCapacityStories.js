const rows = [];
const add = (templateId,id,prompt,passage,labels,explanation,foilReasons,demand,choiceAudioOverrides) => rows.push({
  templateId,id,prompt,passage,labels,explanation,foilReasons,demand,paired:true,choiceAudioOverrides,
});
const detailDemand = 'Retrieve the requested detail while keeping a competing actor, action, stage or category separate.';
const what = (id,prompt,passage,labels,explanation,foilReasons) => add('mock.depth.key_details.parcel',id,prompt,passage,labels,explanation,foilReasons,detailDemand);
what('sleeve-patch','What did Rosa sew onto her sleeve?',
  'Rosa wanted to mend her jacket. She cut a star from blue cloth and a circle from red cloth. The circle covered the hole in her sleeve, so she sewed it there. She kept the star for a bag. A yellow button was already on the jacket.',
  ['a red circle','a blue star','a yellow button'],'Rosa sewed the red circle over the sleeve hole.',
  ['The star was saved for a different object.','The button was already attached; Rosa did not sew it on.']);
what('telescope-night','What did the group look at after the moon?',
  'During an evening sky watch, the group first pointed its telescope at the moon. Clouds then covered the moon, so the leader turned the telescope towards a bright planet. The children took turns looking at the planet. They discussed distant stars, but did not point the telescope at them.',
  ['a bright planet','distant stars','the moon'],'The leader turned the telescope towards a planet after the moon was covered.',
  ['The group discussed stars without viewing them through the telescope.','The moon was viewed first, before the requested change.']);
what('apron-pocket','What did Caleb take out to measure the board?',
  'Caleb carried a pencil, a ruler and a small brush in his apron. He drew a dot with the pencil, then put it away. He took out the ruler and measured the board. Only after cutting the board did he use the brush to sweep the sawdust from the table.',
  ['a ruler','a pencil','a small brush'],'Caleb used the ruler for measuring.',
  ['The pencil made a dot during the earlier step.','The brush removed sawdust after the board was cut.']);
what('soup-stall','What did the cook give to the last customer?',
  'The soup stall had bread rolls and bowls of soup. A customer bought the last roll before noon. The next customer asked for soup, and the cook filled a bowl for her. After she left, the cook washed a cup that someone had returned. No more customers arrived.',
  ['a bowl of soup','a bread roll','a clean cup'],'The last customer received the bowl of soup.',
  ['The roll went to the customer before her.','The cook washed a returned cup after she had left.']);
what('snail-observation','What did the class use to record the snail’s path?',
  'The class watched a snail move across clear plastic. Ivo held a leaf near the end to encourage it forward. Asha followed the path with a marker on the other side of the plastic. The teacher took a photograph of the children when they had finished. The marker line showed every turn.',
  ['a marker line','a leaf','a photograph of the children'],'The marker line recorded the snail’s turns.',
  ['The leaf encouraged the snail to move; it did not record its path.','The photograph showed the children after the activity.']);
what('storm-radio','What did the family turn on when the lights went out?',
  'A storm shook the windows. When the lights went out, Amir turned on a battery radio to hear the weather report. His sister found a torch but waited to use it until she went upstairs. Their father had switched off the television before the storm began.',
  ['a battery radio','a torch','the television'],'Amir turned on the radio when the lights failed.',
  ['The torch was found then, but used later upstairs.','The television had been switched off before the storm.']);
what('seed-envelopes','What did Wren put into the envelopes?',
  'Wren shook dry bean pods over a tray. Small stones that had been on the tray fell into a cup. Wren picked up the beans and placed them in paper envelopes for next spring. She left the empty pods in a basket to carry to the compost heap.',
  ['beans','small stones','empty pods'],'Wren placed the beans in envelopes for planting later.',
  ['The stones fell into a cup.','The empty pods went into a basket for compost.']);
what('puppet-repair','What did the children use to join the puppet’s arm?',
  'The puppet’s arm fell off during rehearsal. Mina suggested using glue, but the teacher explained that the arm needed to swing. The children joined it with a loose split pin. They wrapped tape around a crack in the puppet’s stand, then tried the moving arm again.',
  ['a loose split pin','glue','tape'],'The split pin joined the arm while allowing it to move.',
  ['Glue was suggested but rejected for the arm.','Tape repaired the stand, not the arm.']);

const where = (id,prompt,passage,labels,explanation,foilReasons) => add('mock.depth.key_details.museum',id,prompt,passage,labels,explanation,foilReasons,detailDemand);
where('library-display','Where were the new books during the reading event?',
  'New books arrived at the library in boxes beside the lift. Before the reading event, the librarian put them on a low table near the window. Children looked through them there. At closing time, helpers moved them to a shelf by the door, ready for borrowing the next day.',
  ['on the window table','in boxes beside the lift','on a shelf beside the door'],'The new books were on the window table during the event.',
  ['The boxes waited by the lift before the event.','The books moved to the door shelf after the event.']);
where('football-whistle','Where did the coach find the whistle?',
  'The coach usually kept a whistle in a coat pocket. Before the match, the pocket was empty. She checked the equipment bag and found cones, but no whistle. A player spotted it hanging from a hook behind the changing-room door. The coach put it around her neck for the match.',
  ['on the door hook','inside the coach’s coat pocket','inside the bag with the cones'],'The whistle was found hanging on the hook.',
  ['The coat pocket was its usual place, but was empty.','The bag contained cones, not the whistle.']);
where('bread-cooling','Where did the baker leave the bread to cool?',
  'The baker took four loaves from the oven. A tray on the counter held dough that had not been baked. She placed the hot loaves on a wire rack beside the back window. Later, when they were cool, she arranged them in the glass display by the till.',
  ['on a wire rack','on the tray of unbaked dough','in the display beside the till'],'The hot loaves cooled on the wire rack.',
  ['The tray held unbaked dough.','The display held the loaves only after cooling.']);
where('pond-camera','Where did Yara leave her camera while collecting water?',
  'Yara carried a camera to the pond in a shoulder bag. To collect a water sample, she took the camera out and set it on a dry bench. She used both hands to fill the jar. Her friend waited on the bridge with the bag. Yara collected the camera before leaving.',
  ['on a dry bench','inside the shoulder bag','on the bridge'],'Yara set the camera on the bench while filling the jar.',
  ['The bag carried the camera to the pond, but not during collection.','Her friend stood on the bridge with the empty bag.']);
where('theatre-coats','Where did the visitors put their coats?',
  'The visitors entered the theatre through the side door. Signs directed them past a room full of costumes and into a hall with numbered hooks. They hung their coats on the hooks before taking their seats. Bags had to stay beneath the seats, away from the aisle.',
  ['on the hall hooks','in the room full of costumes','under the visitors’ theatre seats'],'The visitors hung coats on the hall hooks.',
  ['The costume room was a place they passed.','Bags, rather than coats, went beneath the seats.']);
where('market-bicycle','Where was the bicycle during the market visit?',
  'Felix rode to the market and locked his bicycle to a rail by the fountain. He carried his basket to the fruit stall. A broken basket handle meant he had to visit the repair tent too. When shopping was finished, he returned to the fountain and unlocked the bicycle.',
  ['at a rail by the fountain','beside the fruit stall','inside the repair tent'],'The bicycle stayed locked by the fountain.',
  ['Felix took the basket, not the bicycle, to the fruit stall.','The repair tent was visited because of the basket handle.']);
where('shell-label','Where did the small shell stay after the display changed?',
  'The class moved large shells from a tray to a glass case. A small striped shell was too fragile to move, so it stayed in its padded box on the teacher’s desk. Its label was copied onto the class poster. The poster hung outside the classroom for visitors.',
  ['in a padded box on the desk','inside the glass case','on the poster outside'],'The small shell remained in its padded box.',
  ['The large shells moved into the glass case.','The poster displayed a copied label, not the shell.']);
where('festival-banner','Where did the helpers hang the finished banner?',
  'The helpers painted a banner on the playground floor and waited for it to dry. Rain was expected, so they carried it indoors. They hung it above the entrance to the hall. Small paper flags stayed beneath the covered walkway, while a map was pinned to the noticeboard.',
  ['above the hall entrance','beneath the covered walkway','on the noticeboard'],'The finished banner hung above the hall entrance.',
  ['The paper flags were beneath the walkway.','The noticeboard held a map.']);

const who = (id,prompt,passage,labels,explanation,foilReasons) => add('mock.depth.key_details.model',id,prompt,passage,labels,explanation,foilReasons,detailDemand);
who('class-aquarium','Who measured the fish food?',
  'A care chart named Zara as the person to feed the fish. Zara was away, so Owen asked Priya to take over. Priya measured one small spoonful of food and sprinkled it on the water. Owen checked the filter while the fish ate. Zara returned the following day.',
  ['Priya','Zara','Owen'],'Priya measured the food when she took over the feeding job.',
  ['Zara was assigned the job but was away.','Owen asked for help and checked the filter.']);
who('lost-ticket-window','Who returned the lost ticket to the visitor?',
  'A visitor dropped a ticket near the gate. Lee saw it fall but could not leave the gate, so he called to Sana. Sana picked up the ticket and handed it to Mo at the information window. Mo called the visitor’s name and returned the ticket when she came over.',
  ['Mo','Lee','Sana'],'Mo returned the ticket to the visitor at the window.',
  ['Lee noticed the ticket falling.','Sana picked it up and handed it to Mo.']);
who('school-announcement','Who read the announcement aloud?',
  'Tali wrote a short announcement about the plant sale. Her teacher checked the date, and Niko copied the corrected words onto a card. At assembly, the microphone was passed to Tali, who read the card to the school. Niko stood beside the poster showing the prices.',
  ['Tali','Niko','the teacher'],'Tali received the microphone and read the card aloud.',
  ['Niko copied the words and stood beside the poster.','The teacher checked the date but did not read the announcement.']);
who('kite-rescue','Who held the ladder steady?',
  'A kite caught in a low tree. An adult named Ruth brought a ladder. Dev wanted to climb it, but Ruth explained that she would do the climbing. She asked Dev to hold the bottom steady while Sol watched for people on the path. Ruth reached the kite and brought it down.',
  ['Dev','Ruth','Sol'],'Dev held the bottom of the ladder steady.',
  ['Ruth brought and climbed the ladder.','Sol watched the path.']);
who('birthday-recording','Who recorded the birthday message?',
  'Grandma lived far away. Bo drew a birthday picture, while Hana planned a message. Dad showed Hana which button to press on the recorder. Hana then pressed it and spoke the message herself. Dad sent the recording with a photograph of Bo’s picture.',
  ['Hana','Dad','Bo'],'Hana pressed the recorder button and spoke the message.',
  ['Dad explained the button and sent the finished recording.','Bo drew the picture.']);
who('garden-signs','Who painted the words on the garden signs?',
  'Three friends made signs for the garden. Ellis cut the wood and sanded its edges. Noor drew the letter outlines in pencil. Ben carefully filled the outlines with green paint. When the paint dried, Ellis fixed each sign to a stake beside the plants.',
  ['Ben','Noor','Ellis'],'Ben filled the letter outlines with paint.',
  ['Noor drew the pencil outlines.','Ellis prepared the wood and installed the signs.']);
who('snow-path-call','Who first asked for the icy path to be cleared?',
  'Asha noticed ice covering the path outside school. She told the office and asked for the path to be cleared. Mr Hall brought a bag of grit. A parent, Dan, helped him spread it across the ice. Later the headteacher thanked all three for making the path safer.',
  ['Asha','Mr Hall','Dan'],'Asha contacted the office and asked for clearing.',
  ['Mr Hall brought grit after the request.','Dan helped spread the grit.']);
who('chess-timekeeper','Who kept time during the chess game?',
  'Iris and Malik sat down to play chess. Ren had taught them the rules and offered to watch. Ren pressed the clock after each turn and announced when their time was nearly over. The club leader wrote the result on a chart once Iris and Malik finished playing.',
  ['Ren','the club leader','Malik'],'Ren operated the clock and announced the remaining time.',
  ['The club leader recorded the result afterward.','Malik was one of the players.']);

const number = (id,prompt,passage,labels,explanation,foilReasons) => add('mock.depth.key_details.shelves',id,prompt,passage,labels,explanation,foilReasons,detailDemand);
number('pond-jars','How many jars contained pond water?',
  'The class brought nine jars to the pond. Four jars were filled with pond water for a science activity. Three held clean water for washing hands, and two stayed empty as spares. The teacher placed all nine in a crate for the walk back to school.',
  ['four','three','nine'],'Four jars held the requested pond water.',
  ['Three jars held clean washing water.','Nine counts every jar, including other uses and spares.']);
number('choir-arrivals','How many singers arrived by train?',
  'The choir travelled to a concert in two groups. Seven singers took the train with two teachers. Five other singers came in a minibus. Everyone met at the hall, where three musicians were already waiting. The train group arrived first and carried in the music folders.',
  ['seven','five','two'],'Seven singers travelled by train.',
  ['Five singers came by minibus.','Two counts the teachers accompanying the train group.']);
number('repair-buttons','How many buttons did the tailor replace?',
  'A coat had eight buttons. The tailor found that three were cracked and replaced those with new ones. Two other buttons were loose, so she sewed them on more firmly. She left the remaining buttons alone. When the coat was finished, it still had eight buttons.',
  ['three','two','eight'],'The tailor replaced the three cracked buttons.',
  ['Two loose buttons were tightened, not replaced.','Eight is the total number on the coat.']);
number('shelter-towels','How many towels went to the animal shelter?',
  'Neighbours collected twelve towels. Six clean towels were packed for the animal shelter. Four torn towels became cleaning cloths in the workshop. Two damp towels were hung up to dry before anyone decided where to send them. A volunteer drove the packed towels to the shelter.',
  ['six','four','twelve'],'Six towels were packed and sent to the shelter.',
  ['Four torn towels stayed in the workshop as cloths.','Twelve counts the whole collection, including towels sent elsewhere.']);
number('puzzle-pieces','How many pieces were found under the mat?',
  'The puzzle was missing ten pieces. A search of the box uncovered three. Another four were beneath the mat. Two had slipped into a book, and one was inside a slipper. The children put every piece back before packing the completed puzzle away.',
  ['four','three','two'],'Four pieces were beneath the mat.',
  ['Three pieces were inside the box.','Two pieces had slipped into a book.']);
number('orchard-baskets','How many baskets were taken to the kitchen?',
  'The orchard team filled eleven baskets with apples. Five baskets were carried straight to the kitchen for making juice. Three were placed on a stall to sell. The remaining three were left in a cool shed for another day. Empty baskets were stacked beside the trees.',
  ['five','three','eleven'],'Five baskets went to the kitchen.',
  ['Three describes either the stall group or the shed group.','Eleven is the total number filled.']);
number('museum-models','How many models were made from clay?',
  'A display contained fourteen small models. Six were made from clay and stood on a square board. Five wooden models were arranged beside them. Three paper models hung above the table on threads. The labels explained the materials, not the size or age of each model.',
  ['six','five','three'],'The passage names six clay models.',
  ['Five models were wooden.','Three hanging models were paper.']);
number('library-maps','How many maps could visitors borrow?',
  'A library kept ten maps in its local-history corner. Two old maps were protected behind glass. Five modern maps could be borrowed. Three large maps were available to study at a table but had to stay in the library. Each group had a sign explaining its use.',
  ['five','three','ten'],'Five modern maps were available for borrowing.',
  ['Three maps could be studied only inside the library.','Ten counts all the maps, including those that could not leave.']);

add('lp3.key_details.l1.A.where.v1','entry-rain-boots','Where did May leave her boots?',
  'May came home from a muddy walk. She left her boots on the porch. Then she went inside in her socks. Dad put a mat beside the boots to catch the drops of water.',
  ['on the porch','inside the house','beside the road'],'The passage directly says May left her boots on the porch.',
  ['May went inside; her boots stayed outside.','The road is not the place named for the boots.'],'Locate one explicitly stated place in a short account.');
add('lp3.key_details.l1.A.who.v1','entry-picnic-bread','Who brought bread to the picnic?',
  'Finn carried a blanket to the picnic. His aunt carried a basket of bread. They spread the blanket under a tree. Finn’s cousin arrived with apples, and they all sat down to eat.',
  ['Finn’s aunt','Finn','Finn’s cousin'],'Finn’s aunt carried the basket of bread.',
  ['Finn carried the blanket.','Finn’s cousin brought apples.'],'Retrieve the explicitly named actor without changing the passage wording.', {
    Finn: {
      path:'/audio/production/en-US/isolated_word/fin-f8c9abfd8c.mp3',
      recordedText:'Fin.',ipa:'fɪn',
      sha256:'9fd7460a64502ebaa0d8a7c88c26fbed87838c3eb0eba26f6de98249e688338a',
      sourceCommit:'258c79c59747f696d89cea157d5fd57e5eac8fe9',
      deliveryCommit:'d078e2abb085e9938e17c1b52da4af4adf7c12be',
      reason:'Whole existing Leda recording: Finn and fin are exact spoken homophones. No splice or new synthesis.',
    },
  });

export const comprehensionCapacityStories = rows;
