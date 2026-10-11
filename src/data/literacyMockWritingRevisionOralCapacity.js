const rows = [];
function group(templateId, prefix, specs, prompt = 'Choose the best word.') {
  for (const [id, passage, key, a, b, explanation, choiceAudioOverrides] of specs) rows.push({ templateId, id: `${prefix}-${id}`, prompt, passage, labels: [key, a, b], explanation, ...(choiceAudioOverrides ? { choiceAudioOverrides } : {}) });
}
group('literacy.writing_revision.precise-verb', 'precise-entry', [
  ['soup', 'The soup was hot, so I took a tiny drink. I ___ it.', 'sipped', 'spilled', 'poured', 'Sipped means drank a little at a time.'],
  ['coin', 'The coin fell from my hand and ___ across the floor on its edge.', 'rolled', 'floated', 'flew', 'Rolled describes turning along the floor on its edge.'],
  ['paper', 'I used scissors to ___ the paper into two pieces.', 'cut', 'fold', 'crumple', 'Cutting with scissors separates the paper into pieces.'],
  ['sand', 'I used a brush to ___ sand off the step.', 'sweep', 'wash', 'dig', 'Sweeping moves loose sand with a brush.'],
  ['bell', 'I shook the little bell so that it would ___.', 'ring', 'whisper', 'shine', 'Ring names the sound a shaken bell makes.'],
  ['ice', 'The ice became water in the warm room. It ___.', 'melted', 'froze', 'cracked', 'Melting is the change from ice to water.'],
  ['bread', 'I put butter on my bread and used a knife to ___ it evenly.', 'spread', 'chop', 'peel', 'Spread describes covering the bread with a thin layer of butter.'],
]);
group('literacy.writing_revision.clear-colour', 'detail-entry', [
  ['key', 'The key you need has a round red tag.', 'Please bring the key with the round red tag.', 'Please bring something that opens a lock.', 'Please bring one of the metal things.', 'The tag identifies the requested key.'],
  ['book', 'The book you want has a train on its cover.', 'Find the book showing a train.', 'Please find any book with a cover and several pages.', 'Please find something from the bookshelf.', 'The cover detail identifies the requested book.'],
  ['glove', 'Your lost glove has a hole in the thumb.', 'My glove has a torn thumb.', 'I lost a warm thing that I wear outside.', 'I lost a thing that covers my hand.', 'The hole gives a useful identifying feature.'],
  ['gate', 'Visitors should use the wooden gate beside the pond.', 'Use the wooden gate by the pond.', 'Enter through any gate that opens onto the path.', 'Use the first opening you see in the fence.', 'The material and location identify the entrance.'],
  ['towel', 'Your towel has yellow stripes along its edges.', 'Bring my towel with yellow-striped edges.', 'Please bring something to dry with.', 'Please bring one of the things in the bathroom.', 'The edge pattern identifies the towel.'],
  ['parcel', 'The parcel for Grandma is wrapped in brown paper and tied with string.', 'Give Grandma the string-tied brown parcel.', 'Give Grandma something that came in the post.', 'Give Grandma one of the things on the table.', 'The wrapping and string identify the intended parcel.'],
  ['path', 'The path to the pond goes past the windmill.', 'Follow the path that passes the windmill.', 'Follow a path that goes somewhere.', 'Follow one of the ways through the park.', 'The landmark identifies which path to follow.'],
], 'Which sentence gives the useful identifying detail?');
group('literacy.writing_revision.complete-thought', 'complete-entry', [
  ['bell', '', 'The bell rang.', 'Beside the bell.', 'The silver bell.', 'The key tells what the bell did; the others are fragments.'],
  ['leaves', '', 'Leaves covered the path.', 'The leaves on the path.', 'Under the fallen leaves.', 'The key has a subject and a complete action.'],
  ['bread', '', 'We baked bread.', 'Some warm bread.', 'After the bread.', 'The key tells who did what.'],
  ['fish', '', 'A fish splashed.', 'The fish in the pond.', 'Near the fish.', 'The key tells a complete action by the fish.'],
  ['bus', '', 'Our bus arrived.', 'At the bus stop.', 'The big red bus.', 'The key tells what happened to the bus.'],
  ['rope', '', 'The rope snapped.', 'Along the rope.', 'A long piece of rope.', 'The key states a complete event.'],
  ['stars', '', 'Stars shone above us.', 'The bright stars.', 'Above the quiet town.', 'The key includes a subject and its action.'],
], 'Which choice is a complete sentence?');
group('literacy.writing_revision.verb-match', 'agreement-entry', [
  ['bee', 'One bee ___ over the flowers each morning.', 'buzzes', 'buzz', 'buzzing', 'The singular subject one bee takes buzzes.'],
  ['boots', 'My boots ___ muddy now.', 'are', 'is', 'be', 'The plural subject boots takes are.'],
  ['window', 'This window ___ a small crack.', 'has', 'have', 'having', 'The singular subject window takes has.'],
  ['friends', 'My friends ___ their bags here every day.', 'leave', 'leaves', 'leaving', 'The plural subject friends takes leave.'],
  ['I', 'I ___ ready to start now.', 'am', 'is', 'are', 'The pronoun I takes am.'],
  ['you', 'You ___ a turn after me.', 'have', 'has', 'having', 'You takes have rather than has.'],
  ['lamp', 'The lamp ___ brightly every night.', 'shines', 'shine', 'shining', 'The singular subject lamp takes shines.'],
]);
group('literacy.writing_revision.pronoun', 'pronoun-entry', [
  ['kettle', 'The kettle is full. ___ is heavy.', 'It', 'They', 'We', 'It replaces the single object kettle.'],
  ['sister', 'My sister is here. ___ brought her violin.', 'She', 'He', 'We', 'She refers to the sister.'],
  ['brother', 'My brother is a baker. ___ makes bread.', 'He', 'She', 'It', 'He refers to the brother.'],
  ['team', 'My friend and I planted beans. ___ watered them.', 'We', 'He', 'It', 'We includes the speaker and the friend.'],
  ['shoes', 'The shoes are wet. Put ___ by the heater.', 'them', 'it', 'him', 'Them replaces the plural objects shoes.'],
  ['speaker', 'Dad gave a ticket to me. The ticket is for ___.', 'me', 'I', 'we', 'Me is the object pronoun after for.'],
  ['visitor', 'I said to the visitor, “___ can sit here.”', 'You', 'He', 'It', 'You addresses the visitor directly.'],
]);
group('literacy.writing_revision.time-word', 'tense-entry', [
  ['draw', 'Yesterday I ___ a map.', 'drew', 'draw', 'drawing', 'Drew names the completed past action.'],
  ['eat', 'Last night we ___ all the peas.', 'ate', 'eat', 'eating', 'Ate is the past form matching last night.'],
  ['build', 'Last summer they ___ a shed.', 'built', 'build', 'building', 'Built matches a completed event last summer.'],
  ['catch', 'Yesterday the keeper ___ the ball.', 'caught', 'catches', 'catching', 'Caught is the past form of catch.'],
  ['sing', 'Last Friday our class ___ a song.', 'sang', 'sing', 'singing', 'Sang describes the completed past action.'],
  ['find', 'This morning I ___ my missing sock.', 'found', 'finds', 'finding', 'Found completes the sentence about an earlier discovery.'],
  ['bring', 'Yesterday the driver ___ our parcel.', 'brought', 'brings', 'bringing', 'Brought is the past form of bring.'],
]);
group('mock.depth.revision-precise-hard', 'precise-hard', [
  ['water', 'Only a few drops escaped through the tiny crack each minute. Water ___ from the tank.', 'dripped', 'gushed', 'splashed', 'Dripped matches separate small drops, unlike a strong flow or impact.'],
  ['carve', 'She removed thin pieces of wood with a small knife to make a bird. She ___ the wood.', 'carved', 'polished', 'measured', 'Carving shapes wood by cutting pieces away.'],
  ['knead', 'He pressed and folded the soft dough again and again with his hands. He ___ it.', 'kneaded', 'sliced', 'stirred', 'Kneading is repeated pressing and folding, not cutting or stirring.'],
  ['glance', 'I looked at the clock for a moment, then returned to my book. I ___ at it.', 'glanced', 'stared', 'gazed', 'Glanced specifies a brief look, unlike sustained looking.'],
  ['stagger', 'The heavy load made her lose balance and take uneven steps. She ___ towards the bench.', 'staggered', 'marched', 'glided', 'Staggered fits unsteady movement caused by the heavy load.'],
  ['scatter', 'The burst bag sent seeds in many different directions. The seeds ___ across the floor.', 'scattered', 'gathered', 'stacked', 'Scattered describes spreading apart in different directions.'],
  ['wring', 'I twisted the wet cloth with both hands to squeeze out the water. I ___ it.', 'wrung', 'rinsed', 'soaked', 'Wrung names twisting to remove water; the other actions add water.', {
    wrung: {
      path: '/audio/production/en-US/supplemental/rung-823f6d5890.mp3',
      recordedText: 'rung',
      ipa: 'ɹʌŋ',
      sha256: '7419e2bb69775f41720cfed7f63ea901b852f452ca224edd5835a0362cac33a9',
      sourceCommit: '5283849c64ab02be30e2d4f1b2d447d9645e6ddf',
      deliveryCommit: 'd078e2abb085e9938e17c1b52da4af4adf7c12be',
      reason: 'Whole existing Leda recording: wrung and rung are exact spoken homophones. The written choice remains wrung; no splice or new synthesis.',
    },
  }],
  ['peer', 'The opening was tiny and dark. I leaned close and looked carefully through it. I ___ inside.', 'peered', 'glanced', 'blinked', 'Peered describes a careful effort to see through the difficult opening.'],
]);
group('mock.depth.revision-detail-1', 'detail-hard', [
  ['umbrella', 'Two umbrellas are red. Yours has a curved handle and a silver tip.', 'Bring the red umbrella with a curved handle and silver tip.', 'Bring the red umbrella with a silver handle and curved tip.', 'Bring any red umbrella with a handle.', 'The key preserves both identifying features in their correct locations.'],
  ['locker', 'The locker you need is below the clock, with a blue star on its door.', 'Use the locker below the clock with a blue star on its door.', 'Use the locker above the clock with a blue star on its door.', 'Use any locker with a clock nearby.', 'Both the below relation and the star are needed to identify the locker.'],
  ['seedbag', 'Several bags contain beans. The climbing beans are in the small bag marked with a ladder picture.', 'Choose the small bean bag marked with a ladder picture.', 'Choose the large bean bag marked with a ladder picture.', 'Choose any small bag of beans.', 'Size and label distinguish the intended beans.'],
  ['animal', 'Two rabbits have brown ears. The missing rabbit also has one white paw.', 'Our missing rabbit has brown ears and one white paw.', 'Our missing rabbit has white ears and one brown paw.', 'Our missing rabbit has brown ears like the other rabbit.', 'The paw detail distinguishes the rabbit and must not swap with the ear colour.'],
  ['route', 'Both paths reach a bridge. Your route crosses the narrow bridge beside the mill.', 'Cross the narrow bridge beside the mill.', 'Cross the wide bridge beside the mill.', 'Cross whichever bridge you reach first.', 'The width and landmark select the intended crossing.'],
  ['fabric', 'Three pieces of cloth have spots. Use the piece with large green spots on a white background.', 'Use the white cloth with large green spots.', 'Use the green cloth with large white spots.', 'Use any cloth with spots of any size.', 'The key keeps the foreground and background colours distinct.'],
  ['toolbox', 'Both toolboxes are grey. The one for the car has a yellow handle and no wheels.', 'Take the grey toolbox with a yellow handle and no wheels.', 'Take the grey toolbox with yellow wheels and no handle.', 'Take any grey toolbox with yellow parts.', 'The key specifies both the handle and absence of wheels.'],
  ['seat', 'Our seats are in the back row, directly beside the left aisle.', 'Our seats are in the back row beside the left aisle.', 'Our seats are in the front row beside the left aisle.', 'Our seats are somewhere beside an aisle.', 'The row and side together identify the seats.'],
], 'Which sentence identifies the intended thing accurately?');
group('mock.depth.complete-sentence-1', 'complete-hard', [
  ['until', '', 'We waited until the gate opened.', 'Until the heavy garden gate finally opened for all of us.', 'The waiting children beside the gate.', 'The main clause we waited completes the thought.'],
  ['although', '', 'Although the hill was steep, we reached the top.', 'Although the steep hill beyond the village was covered with slippery stones.', 'The steep hill above the village.', 'The key includes a main clause after the although clause.'],
  ['because', '', 'The floor dried quickly because the sun came out.', 'Because the bright morning sun came out from behind the clouds.', 'The wet floor near the sunny window.', 'The key states a main event and its reason.'],
  ['while', '', 'While I held the ladder, Dad climbed up.', 'While I held the tall wooden ladder against the garden wall.', 'Dad on the ladder beside the wall.', 'The main clause Dad climbed up completes the while clause.'],
  ['subject', '', 'The basket full of apples fell over.', 'The basket full of fresh apples.', 'Beside the basket full of apples.', 'The subject basket has a complete predicate fell over.'],
  ['relative', '', 'The child who found the shell showed it to us.', 'The child who found the shiny shell.', 'When the child found the shell.', 'The key adds a main predicate to the longer subject.'],
  ['if', '', 'If the rain stops, we can play outside.', 'If the rain stops before lunch.', 'The playground after the heavy rain.', 'The key includes the outcome that completes the condition.'],
  ['before', '', 'Before the shop closed, we bought some milk.', 'Before the little shop closed.', 'The milk in the shop by the road.', 'The main clause tells what happened before closing.'],
], 'Which choice is a complete sentence?');
group('mock.depth.agreement-1', 'agreement-hard', [
  ['jar', 'The jar of buttons ___ on the desk now.', 'is', 'are', 'be', 'The singular subject is jar, not the nearby plural buttons.'],
  ['keys', 'The keys beside the bowl ___ missing now.', 'are', 'is', 'be', 'The plural subject is keys, not the nearby singular bowl.'],
  ['picture', 'The picture of the horses ___ a wooden frame.', 'has', 'have', 'having', 'The singular picture takes has despite the plural horses.'],
  ['paths', 'The paths around the lake ___ at the gate.', 'meet', 'meets', 'meeting', 'The plural paths take meet rather than the form for singular lake.'],
  ['one', 'One of the children ___ the register every morning.', 'carries', 'carry', 'carrying', 'One is the singular head of the subject.'],
  ['both', 'Both of the doors ___ fresh paint now.', 'need', 'needs', 'needing', 'Both makes the subject plural.'],
  ['each', 'Each of the bags ___ a name tag.', 'has', 'have', 'having', 'Each refers to a single bag at a time and takes has.'],
  ['books', 'The books under my coat ___ to the library.', 'belong', 'belongs', 'belonging', 'The plural books control the verb despite the nearby singular coat.'],
]);
group('mock.depth.pronoun-1', 'pronoun-hard', [
  ['object-pair', 'The coach called my sister and me. She wanted to speak to ___.', 'us', 'we', 'her', 'Us includes both people and has the object form after to.'],
  ['subject-pair', 'My cousin and I made a kite. ___ tested it together.', 'We', 'Us', 'He', 'We replaces the pair including the speaker in subject position.'],
  ['boys', 'The boys watched their sister perform. ___ clapped when she finished.', 'They', 'Them', 'Him', 'They replaces the boys in subject position; them and him are object forms.'],
  ['female-object', 'My aunt was carrying a box. I opened the door for ___.', 'her', 'she', 'him', 'Her refers to the aunt in object position after for.'],
  ['male-object', 'My brother needed a ruler. I passed it to ___.', 'him', 'he', 'her', 'Him refers to the brother as the recipient.'],
  ['objects', 'The bowls were beside the jug. We put ___ into the cupboard, but left the jug out.', 'them', 'it', 'her', 'Them refers to the plural bowls, contrasted with the jug.'],
  ['possession', 'This coat belongs to me. It is ___.', 'mine', 'my', 'me', 'Mine is the independent possessive form needed at the end.'],
  ['reflexive', 'No one helped Dad tie his laces. He tied them ___.', 'himself', 'herself', 'themselves', 'Himself refers back to the singular male subject acting without help.'],
]);
group('mock.depth.tense-1', 'tense-hard', [
  ['ride', 'I ride my bicycle most days, but yesterday I ___ the bus.', 'took', 'take', 'taking', 'Yesterday shifts the action from habitual present to past took.'],
  ['sleep', 'The puppy usually sleeps in its basket. Last night it ___ beside my bed.', 'slept', 'sleeps', 'sleeping', 'Last night requires the irregular past slept.'],
  ['write', 'She writes her name on each drawing. Yesterday she ___ a whole message.', 'wrote', 'writes', 'writing', 'The second sentence shifts to completed past wrote.'],
  ['wash', 'We wash the brushes after each lesson. Yesterday we ___ the paint pots as well.', 'washed', 'wash', 'washing', 'Yesterday shifts the action from the general present to completed past washed.'],
  ['paint', 'We paint small pictures each week. Last week we ___ a whole wall.', 'painted', 'paint', 'painting', 'The completed last-week event requires the past painted.'],
  ['freeze', 'Water freezes when it is very cold. During the cold night, our pond ___.', 'froze', 'freezes', 'freezing', 'The particular completed night takes froze rather than the general present rule.'],
  ['break', 'This thin string breaks easily. Yesterday it ___ while I pulled the kite.', 'broke', 'breaks', 'breaking', 'The past event takes broke despite the present-tense first sentence.'],
  ['clean', 'I clean my desk each day. Last Monday I ___ the cupboards too.', 'cleaned', 'clean', 'cleaning', 'Last Monday requires the completed past form cleaned.'],
]);
export const WRITING_REVISION_ORAL_CAPACITY = Object.freeze(rows);
