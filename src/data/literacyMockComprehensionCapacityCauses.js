const rows=[];
const add=(templateId,id,prompt,passage,labels,explanation,foilReasons)=>rows.push({templateId,id,prompt,passage,labels,explanation,foilReasons,paired:true,
  demand:'Identify the stated causal relationship among nearby events, alternative conditions and reversed explanations.',
  sourceFile:'src/data/literacyMockComprehensionCapacityCauses.js'});
const effect=(...args)=>add('mock.depth.cause_effect.shade',...args);
effect('path-flood','What happened because water covered the short path?',
  'The group hoped to take the short path beside the stream. Heavy rain had covered it with water, so the leader chose the longer path over the hill. The group had packed lunch before leaving home. They ate it at the viewpoint and continued towards the village.',
  ['The group took the longer path.','The group packed lunch at home.','The group caused heavy rain to fall.'],'The covered short path made the leader choose the longer route.',
  ['Lunch was packed before the group discovered the flooded path.','This reverses the relationship; the group did not cause the rain.']);
effect('zip-caught','What happened because cloth caught in the zip?',
  'Jules was putting on a coat when its lining caught in the zip. The zip stopped halfway, leaving the coat open. Jules’s brother had already found his gloves. Mum gently pulled the lining free, and then Jules could close the coat before they went outside.',
  ['The coat could not close fully.','Jules’s brother found his gloves.','The coat closed before Mum helped.'],'The trapped lining stopped the zip before the coat was closed.',
  ['Finding gloves was a separate event.','The coat closed only after Mum freed the lining.']);
effect('basket-handle','What happened when the basket handle broke?',
  'Nell had just paid for apples when her basket handle broke. She caught the basket against her knee, but two apples rolled onto the ground. The seller brought a strong bag for the fruit. A dog was sleeping beside the stall throughout the accident.',
  ['Two apples rolled onto the ground.','The seller received payment for the apples.','The sleeping dog broke the basket handle.'],'The broken handle led to two apples falling out.',
  ['Payment happened just before the break.','The dog was sleeping; it did not break the handle.']);
effect('window-noise','What changed after the teacher shut the window?',
  'Builders were using a loud machine outside the classroom. The teacher shut the window, which made the noise much quieter inside. The children could hear their partner read again. The machine kept working outside, and the building fence stayed in the same place.',
  ['The children could hear their partner read.','The builders stopped using the machine.','The building fence moved closer to the room.'],'Closing the window reduced noise enough for partner reading to be heard.',
  ['The passage says the machine kept working.','The fence stayed in the same place.']);
effect('ink-spill','What happened because ink spilled on the address?',
  'An envelope lay beside an open ink bottle. When the bottle tipped, ink spread across the address and hid the house number. The letter inside stayed dry. Bea copied the address onto a clean envelope because the first one could no longer be read clearly.',
  ['Bea copied the address onto a clean envelope.','The letter inside became wet with ink.','The house number made the bottle tip over.'],'The unreadable address made a new envelope necessary.',
  ['The letter stayed dry.','This reverses the cause; the printed number did not tip the bottle.']);
effect('icy-drink','What happened because the jug was almost empty?',
  'The children were sharing water after their walk. When the jug was almost empty, their teacher refilled it from the tap. The cups had been washed before the walk. After the refill, there was enough water for the children still waiting in line.',
  ['The teacher refilled the jug.','The cups were washed before the walk.','The teacher put the cups away.'],'The low amount of water prompted the refill.',
  ['Washing the cups was an earlier preparation step.','The waiting children still needed the cups for water.']);
effect('cardboard-wet','What happened because rain softened the cardboard roof?',
  'The class left its cardboard model outside overnight. Rain soaked the roof and made it soft, so the roof sagged into the model. A plastic flag on top stayed bright. The next morning, the class brought the model inside and began making a waterproof cover.',
  ['The roof sagged into the model.','The plastic flag lost its bright colour.','The class left the model outside the next night.'],'The rain-softened roof bent and sagged.',
  ['The plastic flag stayed bright.','The class brought the model inside; leaving it outside was the earlier event.']);
effect('sign-turned','What happened because the arrow pointed the wrong way?',
  'A direction sign had turned in the wind. Its arrow pointed away from the picnic ground, so two walkers followed the wrong track. They noticed their mistake at a locked gate. After returning, they used a map and told a ranger about the loose sign.',
  ['Two walkers followed the wrong track.','A ranger locked the picnic gate.','The map turned the sign in the wind.'],'The incorrect arrow misdirected the walkers.',
  ['The gate is described as locked, but the passage gives no such action by a ranger.','The wind turned the sign before the walkers used their map.']);

const cause=(...args)=>add('mock.depth.cause_effect.bell',...args);
cause('torch-contact','Why did the torch begin working again?',
  'The torch would not light, even with new batteries. Tao noticed that the cap was loose and the batteries were not held firmly against the metal contact. He tightened the cap. The torch immediately lit, although he had not changed the batteries or bulb again.',
  ['Tao tightened the loose cap.','Tao replaced the bulb.','Tao removed the new batteries.'],'Tightening the cap restored the battery contact just before the light returned.',
  ['The passage explicitly says the bulb was not changed again.','The new batteries remained in the torch.']);
cause('paper-plane-tail','Why did the paper plane stop turning sharply to one side?',
  'A paper plane kept turning sharply to the left. One wing was folded much higher than the other. Lina adjusted the wings until they matched, then launched it from the same place. This time it flew straight. She used the same paper and did not throw it harder.',
  ['Lina made the two wings match.','Lina used a different sheet of paper.','Lina threw the plane much harder.'],'The changed wing shape explains the different flight while the other conditions stayed the same.',
  ['The paper stayed the same.','The passage says she did not throw harder.']);
cause('seed-tray-dry','Why did one tray of seedlings wilt?',
  'Two trays of the same seedlings stood beside each other. Both received the same light. The class watered one tray but missed the other during a holiday. The missed tray dried out and its plants wilted. After watering, several of those plants slowly stood upright again.',
  ['That tray had not been watered.','That tray received less light.','That tray held a different kind of seed.'],'The missed watering is the stated difference between the trays.',
  ['The passage says both trays received the same light.','The seedlings were the same kind.']);
cause('wet-floor-mat','Why did shoes leave fewer wet marks after lunch?',
  'Rain continued all morning, and wet shoes left marks in the entrance hall. Before lunch, the caretaker put a large absorbent mat inside the door. People wiped their shoes on it. After lunch there were fewer wet marks, although rain still fell outside.',
  ['People wiped their shoes on the new mat.','The rain stopped before lunch.','People stopped entering the building.'],'The new mat removed water from shoes while the rain continued.',
  ['Rain still fell after lunch.','People continued entering and wiping their shoes.']);
cause('blocked-flute','Why could the flute make a clear sound again?',
  'Mika’s simple wooden flute made a weak, rough sound. A small piece of paper was stuck across the opening where air passed. Her teacher carefully removed it. Mika blew in the same way as before, and a clear note sounded. The flute had not been replaced.',
  ['The paper blocking the opening was removed.','Mika blew much harder than before.','The teacher gave Mika a different flute.'],'Removing the blockage is the changed condition that restored the sound.',
  ['Mika blew in the same way.','The passage says the flute was not replaced.']);
cause('bus-delay','Why did the class arrive later than planned?',
  'The class reached its bus stop on time. A fallen branch blocked the usual road, so the driver used a longer route. No one got off at the wrong stop, and the bus worked normally. They arrived late at the museum because of the extra distance.',
  ['The driver had to take a longer route.','The class was late reaching the bus stop.','The bus broke down on the road.'],'The blocked road required a longer journey.',
  ['The class reached the stop on time.','The bus worked normally.']);
cause('cake-light','Why could the baker see the cake through the oven window?',
  'The oven window was so greasy that the baker could not see inside. When the oven was cool, she cleaned the glass thoroughly. During the next bake she could see the cake through the same window. The kitchen light and the oven lamp were unchanged.',
  ['She cleaned grease from the glass.','She fitted a brighter oven lamp.','She moved the cake outside the oven.'],'Cleaning the window removed the obstruction to seeing through it.',
  ['The oven lamp was unchanged.','She saw the next cake through the oven window while it baked.']);
cause('tent-rope','Why did the tent stop leaning towards the path?',
  'The tent leaned towards the path even though its poles were straight. A rope on the opposite side had slipped loose from its peg. Kim pulled the rope tight and secured it again. The tent stood upright without changing the poles or moving to another spot.',
  ['Kim tightened and secured the loose rope.','Kim replaced the bent tent poles.','Kim moved the tent away from the path.'],'Securing the loose supporting rope restored the tent’s position.',
  ['The poles were straight and were not replaced.','The tent stayed in the same spot.']);

const because=(...args)=>add('mock.depth.cause_effect.ice',...args);
because('sandwich-paper','Which sentence explains why the sandwich stayed dry?',
  'Water spilled inside a picnic bag. One sandwich was wrapped in a waterproof container, while an unwrapped napkin beside it became wet. When the bag was opened, the sandwich inside the closed container was dry. The bag itself had not kept the water out.',
  ['The closed waterproof container kept water off the sandwich.','The picnic bag kept all water away from the food.','The napkin kept the whole picnic bag dry.'],'The closed container separated the sandwich from the spilled water.',
  ['Water had spilled inside the bag, so the bag alone was not protection.','The napkin and bag were wet.']);
because('library-dark','Which sentence explains why the reading corner became darker?',
  'A bright lamp lit the reading corner. Someone accidentally pulled its plug from the wall while moving a chair. The lamp went out, and the corner became dark. The ceiling light elsewhere in the room stayed on until closing time.',
  ['Pulling out the plug stopped the lamp lighting the corner.','The dark corner pulled the lamp’s plug from the wall.','Closing time made the chair move across the room.'],'Removing power from the lamp caused the loss of its light.',
  ['Darkness followed the unplugging, rather than causing it.','The chair moved before closing time; the passage gives no such cause.']);
because('clay-thumb','Which sentence explains the hollow in the clay?',
  'A smooth ball of soft clay lay on the board. Hana pressed her thumb into its centre and then lifted her hand. A hollow remained where her thumb had pushed. Later she put a bead beside the clay, without touching the hollow.',
  ['Hana’s thumb pressing into the clay made the hollow.','The bead beside the clay pressed out the hollow.','The board pushed into the clay from underneath.'],'Pressure from the thumb changed the soft clay’s shape.',
  ['The bead was placed later and did not touch the hollow.','The passage describes pressure from above by the thumb, not from the board.']);
because('curtain-breeze','Which sentence explains why the curtain moved?',
  'The room was still until Anya opened the window. A breeze blew in and lifted the curtain away from the wall. When she shut the window again, the curtain settled. No one had touched the curtain while it was moving.',
  ['Air entering the open window moved the curtain.','The moving curtain opened and closed the window.','Anya pushed the curtain with her hand.'],'The curtain moved with the entering breeze and settled when the opening closed.',
  ['Anya operated the window; the curtain did not.','The text explicitly says no one touched the curtain.']);
because('marble-track','Which sentence explains why the marble stopped?',
  'A marble rolled smoothly down a sloping wooden track. It reached a strip of thick felt and slowed to a stop. Earlier marbles had rolled farther along the bare wood. The slope had not changed, but the new rough strip resisted the moving marble.',
  ['The rough felt slowed the marble until it stopped.','The stopped marble made the felt become rough.','Making the slope steeper stopped the marble sooner.'],'The new surface is the stated reason the marble slowed.',
  ['This reverses the relationship between the felt and the motion.','The slope did not change.']);
because('swing-push','Which sentence explains why the empty swing began moving?',
  'An empty swing hung still. Sam gave the seat a gentle push, then stepped back. The swing moved away and returned several times, gradually slowing. A bird landed on the fence only after the swing was already moving.',
  ['Sam’s push started the swing moving.','The moving swing caused Sam’s earlier push.','The bird landing on the fence started the swing.'],'The push came immediately before the swing began to move.',
  ['The swing’s later movement cannot cause the earlier push.','The bird landed after movement had begun.']);
because('flower-stain','Which sentence explains the purple marks on the cloth?',
  'A bowl of crushed dark berries tipped onto a pale cloth. Juice spread across it and left purple marks. Sora rinsed the cloth later, making the marks lighter. The cloth had been plain before the juice spilled.',
  ['Spilled berry juice left purple marks on the cloth.','Purple marks caused the berries to fall into the bowl.','Rinsing a plain cloth created the first purple marks.'],'The juice spread onto the plain cloth before the marks appeared.',
  ['This reverses the direction of cause.','Rinsing happened afterward and lightened existing marks.']);
because('bottle-squeeze','Which sentence explains why water came out?',
  'A soft bottle had a small hole near its base. While it rested upright, only a few drops escaped. When Leo squeezed its sides, water squirted through the hole. He stopped squeezing and the strong stream ended, though the hole remained.',
  ['Squeezing the bottle pushed water through the hole.','Water outside the bottle squeezed Leo’s hand.','The hole vanished when Leo stopped squeezing.'],'The changing squeeze explains the changing water flow.',
  ['Leo’s hand squeezed the bottle, not the other way around.','The hole remained after the stream stopped.']);

export const comprehensionCapacityCauses=rows;
