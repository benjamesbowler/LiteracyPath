const rows = [];
const add = (templateId,id,passage,labels,explanation,foilReasons) => rows.push({templateId,id,passage,labels,
  prompt:'What is this passage mostly about?',explanation,foilReasons,paired:true,
  demand:'Choose an account of the whole passage over a true narrow detail or an unsupported account.',
  sourceFile:'src/data/literacyMockComprehensionCapacityMainIdeas.js'});
const fiction = (...args) => add('mock.depth.main_idea.bridge',...args);
fiction('mole-concert',
  'Mole wanted to join the woodland concert, but his singing was very quiet. The others could not hear him over the drums. Mole tried tapping smooth stones together instead. Their clear clicks fitted the song. At the concert he kept the beat, and the singers followed him.',
  ['Mole finds a way to join the music.','Mole taps smooth stones to make a clicking sound.','Mole teaches the other animals to sing more quietly.'],
  'The problem and solution concern finding a musical role that works for Mole.',
  ['The stones are one detail of his solution, not the whole account.','The other animals follow his beat; he does not teach quiet singing.']);
fiction('boat-delivery',
  'A storm broke the bridge to Fox’s island. Rabbit had promised to bring Fox a birthday cake. She wrapped the cake, tied it safely inside a little boat and rowed across the calm inlet. Fox met her at the shore. They ate together while watching workers begin to mend the bridge.',
  ['Rabbit keeps a promise by finding another route.','Workers begin mending a bridge after a storm.','Fox builds a boat to bring Rabbit a cake.'],
  'Rabbit’s promise, blocked route and boat journey form the complete story.',
  ['Bridge repair is the closing background detail.','The alternative reverses who transports the cake and invents boat building.']);
fiction('lost-colour',
  'Tomas spilled water over the picture he was painting. The blue sky spread down into the green field. At first he wanted to throw the picture away. Then he turned the spreading colour into a pond and added reeds. He liked his changed picture enough to put it on the wall.',
  ['Tomas turns an accidental spill into a new picture.','Tomas paints reeds beside a blue pond.','Tomas learns to copy a picture without mistakes.'],
  'The main change is his creative response to the spill.',
  ['Painting reeds is only the final part of his solution.','He changes his own picture rather than copying or avoiding every mistake.']);
fiction('hedgehog-party',
  'Hedgehog arrived at a party carrying a balloon. When he hugged his friends, his prickles burst it. He worried that he would spoil the games too. His friends made a game of rolling apples towards baskets. Hedgehog joined happily, and no balloons were needed for the game.',
  ['The friends find a party game Hedgehog can enjoy.','Hedgehog carries a balloon to a party.','Hedgehog leaves the party before the games begin.'],
  'The story moves from Hedgehog’s difficulty to an inclusive game.',
  ['Carrying the balloon is the opening event, not the whole story.','Hedgehog joins the game instead of leaving.']);
fiction('train-window',
  'On a long train ride, Mina grew bored with her puzzle. Her grandfather suggested drawing things outside. Mina drew a crooked tree, a striped tent and a river bend. She joined the pictures into a map. When they arrived, she used the map to tell her cousin about the journey.',
  ['Mina enjoys recording and sharing her journey.','Mina draws the striped tent she sees outside the train.','Mina finishes her puzzle to find the correct train station.'],
  'Drawing and sharing the sights turn a boring ride into an engaging activity.',
  ['The tent is just one of several sights.','The puzzle is set aside and is not used for navigation.']);
fiction('dragon-library',
  'A young dragon wanted to visit the village library. Every excited sneeze sent sparks from his nose, so the librarian worried about the books. They arranged a reading place in the stone courtyard. The dragon listened there while children took turns bringing stories outside to share.',
  ['Dragon finds a safe way to enjoy stories.','The young dragon sneezes excitedly near the library books.','The dragon learns to read and no longer sneezes sparks.'],
  'The central problem is access to stories, solved by the courtyard arrangement.',
  ['The sneezing creates the problem but does not describe how it is solved.','The story never says reading stops his sneezes.']);
fiction('missing-dance-step',
  'Suki forgot a step during dance practice and stopped moving. Her partner showed her how to follow the drumbeats. They practised the tricky part slowly, then joined the rest of the dance. At the show, Suki heard the familiar beats and completed the step without stopping.',
  ['Suki uses rhythm and practice to learn a difficult step.','Suki listens to drums during a dance show.','Suki changes partners because she dislikes the dance.'],
  'The practice strategy explains her later success.',
  ['Hearing drums at the show omits the learning process.','Her partner helps her; no change of partner or dislike is described.']);
fiction('otter-post',
  'Otter delivered letters along the river. One morning the addresses washed off his bag of envelopes. He visited the animals and asked who was expecting news. With their help he matched every letter to its owner. Afterward, he made a waterproof cover for his delivery bag.',
  ['Otter solves a delivery problem and protects future letters.','Otter visits animals who live beside a river.','Otter decides to stop delivering letters to his neighbours.'],
  'The wet addresses, solution and new cover are all parts of handling the delivery problem.',
  ['Visiting neighbours is one action within that problem.','The new cover prepares him to continue delivering.']);

const info = (...args) => add('mock.depth.main_idea.roots',...args);
info('bicycle-checks',
  'A bicycle needs several checks before a ride. Firm tyres help it roll smoothly. Brakes must stop the wheels when squeezed. A loose chain can slip, so its position matters too. Looking at just one part does not tell you whether the whole bicycle is ready to use.',
  ['Several checks keep a bicycle safe.','Firm tyres help a bicycle roll smoothly.','A bicycle is ready whenever its tyres are firm.'],
  'The passage connects checks of tyres, brakes and chain.',
  ['Tyre condition is one of three checks.','The final sentence explicitly rejects relying on one part.']);
info('rainwater-tank',
  'Rain falling on a roof can flow through gutters into a tank. A cover keeps leaves out of the stored water. A tap near the bottom lets a gardener fill a watering can. The tank links collecting, protecting and using rainwater in one simple system.',
  ['A tank system collects and supplies rainwater for a garden.','A cover stops leaves falling into stored water.','A watering can sends garden water back onto a roof.'],
  'The main idea includes the water’s route and use, not just the tank cover.',
  ['Keeping leaves out is one part of the system.','The alternative reverses the direction of water movement.']);
info('library-help',
  'A library offers more than shelves of books. Clear labels help people find subjects. Staff can suggest a story or show someone how to search. Tables provide room to study, and some libraries hold storytelling events. These services help different people use and enjoy information.',
  ['Libraries help people in several ways beyond storing books.','Labels help visitors find books about a subject.','Libraries are mainly places for storytelling events.'],
  'The whole passage lists several services for different needs.',
  ['Labels are one example rather than the complete topic.','Storytelling is one possible service, not the main purpose given.']);
info('tree-shelter',
  'One tree can provide many useful places for wildlife. Birds may build nests among its branches. Beetles can hide under loose bark. A hollow trunk may shelter a small animal, while fallen leaves protect creatures near the ground. Different parts of the same tree support different lives.',
  ['Different parts of a tree provide shelter for wildlife.','Birds can build nests among a tree’s branches.','All animals live together inside a hollow tree trunk.'],
  'The passage repeatedly shows different shelter locations within one tree.',
  ['Bird nests are only one of the examples.','The animals are described using different places, not one shared hollow.']);
info('school-kitchen',
  'Preparing lunch for a school takes more than cooking. Ingredients must arrive and be stored safely. Workers prepare enough portions and keep equipment clean. Before serving, they check which meals belong to children with different food needs. Careful preparation connects all these jobs.',
  ['Many coordinated jobs are needed to prepare school lunches.','Kitchen workers keep cooking equipment clean.','Cooking begins only after every child chooses a meal.'],
  'The text describes several connected jobs from deliveries to serving.',
  ['Cleaning equipment is just one of the jobs.','The passage does not say every child chooses before cooking starts.']);
info('reusable-bottle',
  'A reusable bottle can be filled again instead of thrown away after one drink. It needs washing between uses. A tight lid helps prevent leaks in a bag. If its parts can be replaced when worn, the same bottle can stay useful for longer.',
  ['Care and repair help a reusable bottle last.','A tight bottle lid helps prevent leaks.','A reusable bottle never needs cleaning or new parts.'],
  'Repeated use, washing and replaceable parts explain how the bottle remains useful.',
  ['The lid is one useful part rather than the whole topic.','The text states that washing and sometimes replacing parts are needed.']);
info('bus-stop-information',
  'A bus stop gives travellers several kinds of information. A route number identifies the service. A map shows places along its journey. A timetable tells when buses are expected. Reading these together helps a traveller choose a bus and plan when to wait for it.',
  ['Bus-stop information helps people plan a journey.','A route map shows places a bus visits.','A timetable lists every traveller riding on a bus.'],
  'Numbers, maps and times work together to support travel planning.',
  ['The map is one source of information.','A timetable gives expected times, not passenger names.']);
info('garden-compost',
  'A compost heap can turn plant scraps into material for a garden. Fruit peel, fallen leaves and cut grass can go into it. Over time, small living things help break the scraps down. Gardeners then mix the finished compost into soil instead of treating every plant scrap as rubbish.',
  ['Composting turns plant scraps into useful garden material.','Fruit peel and fallen leaves can go in a heap.','Gardeners use finished compost to wrap fresh fruit.'],
  'The full process runs from discarded scraps to useful soil material.',
  ['The list of scraps is only the beginning of the process.','Finished compost is mixed into soil, not used as wrapping.']);

const everyday = (...args) => add('mock.depth.main_idea.market',...args);
everyday('quiet-corner',
  'Our class wanted a quieter place to read. We moved a shelf away from the door and put cushions behind it. We agreed to speak softly there and return books neatly. After trying the space for a week, we added a lamp so the pages were easier to see.',
  ['The class creates and improves a quiet reading space.','The class moves a shelf away from the door.','The class decides to stop sharing books with each other.'],
  'The furniture, shared rules and later lamp all support the new reading space.',
  ['Moving the shelf is only the first action.','Nothing says that sharing books stops.']);
everyday('walking-route',
  'Our family planned a walk to the park. We chose a route with safe crossings and checked how long it would take. We packed water and a map. During the walk, a closed path meant we used the map to choose a different way and still reached the park.',
  ['The family plans a walk and adjusts to a blocked path.','The family packs water before leaving home.','The family gives up its walk because a path is closed.'],
  'Preparation and the later route change are the important connected events.',
  ['Packing water is a single preparation detail.','The family reaches the park by another route.']);
everyday('class-exhibition',
  'We wanted visitors to understand our class models. Each group wrote a short label explaining its model. We put related models together and drew arrows showing a route around the room. During the exhibition, we answered questions and noticed which labels needed clearer words.',
  ['The class helps visitors understand and explore its models.','The class draws arrows around the room.','The class hides unfinished models from every visitor.'],
  'Labels, grouping, routes and answers all make the models understandable.',
  ['Arrows are one method among several.','The passage does not describe hiding models.']);
everyday('shared-tools',
  'People in our building began sharing garden tools. They listed what each person could lend and set a return day. A notebook recorded who had each tool. When a handle broke, the borrower reported it, and the group arranged a repair before anyone used it again.',
  ['Neighbours organize responsible sharing of garden tools.','A notebook records who has borrowed each tool.','Neighbours agree that broken tools should be kept secretly.'],
  'The lending list, return rule, notebook and repair all support responsible sharing.',
  ['The notebook is only one part of the arrangement.','The borrower reports the damage instead of hiding it.']);
everyday('family-recipe',
  'Grandad showed us how to make his bean soup. We wrote down the ingredients as he used them and measured amounts he usually guessed. Then we tried the written recipe ourselves. When the soup was too thick, he helped us correct the water amount on the page.',
  ['The family records and tests Grandad’s soup recipe.','Grandad guesses some amounts when making soup.','The family replaces the soup with a different meal.'],
  'Writing, trying and correcting the recipe are the connected main actions.',
  ['Guessing amounts describes Grandad’s original method, not the full activity.','They improve the same soup recipe rather than replace the meal.']);
everyday('rainy-playtime',
  'Rain kept our class indoors at break. We first crowded around one box of blocks. To make room for everyone, we set up a drawing table, a puzzle area and a building space. Children chose an activity and changed places when they were ready, without pushing.',
  ['The class organizes indoor play so everyone has room.','The class starts break with a box of blocks.','Rain causes the class to cancel every break activity.'],
  'The new activity areas solve the crowding problem during indoor break.',
  ['The blocks are the crowded starting activity.','Several activities continue after the change.']);
everyday('food-collection',
  'Our club collected food for a community cupboard. We checked which unopened foods were needed before bringing donations. At the hall, we sorted tins, rice and other packets. We checked the dates and packed boxes so the cupboard volunteers could find each kind easily.',
  ['The club gathers and organizes suitable food donations.','The club sorts tins and rice at the hall.','The club opens every packet before donating the food.'],
  'Checking needs, collecting and sorting all prepare usable donations.',
  ['Sorting is one stage of the larger project.','The donations are described as unopened.']);
everyday('weather-notebook',
  'For one month we recorded the weather each morning. We drew cloud shapes, noted rain and checked a thermometer. At the end, we grouped the records by week. The notebook showed that one wet week was warmer than a later dry week, which surprised us.',
  ['The class collects weather observations and compares them.','The class checks a thermometer each morning.','The class finds that every rainy week is colder.'],
  'The passage includes both gathering observations and finding a pattern.',
  ['Temperature is just one of the recorded observations.','The wet week was warmer, contradicting this generalization.']);

export const comprehensionCapacityMainIdeas = rows;
