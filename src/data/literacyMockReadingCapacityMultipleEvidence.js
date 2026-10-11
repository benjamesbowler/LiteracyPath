const rows=[];
const add=(id,prompt,passage,labels,explanation,wrongOne,wrongThree)=>rows.push({id,prompt,passage,labels,explanation,
  templateId:'mock.evidence.paper',answerIndexes:[0,2],foilReasons:[],distractorRationales:{c1:wrongOne,c3:wrongThree},
  demand:'Select both details that support the stated central idea, distinguishing them from true but unrelated facts in the same account.',
  sourceFile:'src/data/literacyMockReadingCapacityMultipleEvidence.js'});
add('evidence-library-access','Choose the two details that support the idea that the library helps more people borrow books.',
  'The library is making borrowing easier for people with different needs. A delivery van takes books to readers who cannot travel. The building has a red tiled roof. The library now opens late for people who work during the day. A painting of the town hangs beside the desk.',
  ['A van takes books to people who cannot travel.','The building has a red tiled roof.','The library opens late for daytime workers.','A town painting hangs beside the desk.'],
  'Delivery reaches housebound readers, and later hours reach people unavailable during the day.', 'Roof colour does not help people access borrowing.','The painting is a true decorative detail, not a borrowing service.');
add('evidence-garden-wildlife','Choose the two details that support the idea that this garden provides homes for wildlife.',
  'The school garden provides places for wildlife to live. A pile of logs offers dark spaces for beetles. The gate was painted green last week. Nest boxes give birds sheltered places to raise their young. The sign at the entrance carries the school’s name.',
  ['The log pile offers dark spaces for beetles.','The gate was painted green.','Nest boxes shelter birds and their young.','The sign carries the school’s name.'],
  'The logs and nest boxes each provide shelter for living creatures.', 'The gate’s paint colour does not describe an animal home.','The sign identifies the school rather than supplying shelter.');
add('evidence-boat-safety','Choose the two details that support the idea that the boat crew prepared for emergencies.',
  'Before the trip, the crew checked equipment for emergencies. They tested the radio used to call for help. The boat’s name was painted on its bow. They checked that there was a working life jacket for every passenger. The captain’s cap had a silver badge.',
  ['The crew tested the radio used to call for help.','The boat’s name was painted on its bow.','There was a working life jacket for every passenger.','The captain’s cap had a silver badge.'],
  'A working emergency radio and life jackets prepare the crew to help people if something goes wrong.', 'The name identifies the boat but does not show an equipment safety check.','The badge is a clothing detail rather than emergency preparation.');
add('evidence-museum-preserve','Choose the two details that support the idea that the museum protects fragile objects.',
  'The museum takes care to protect its fragile objects. Glass cases keep visitors from touching the old pottery. The entrance hall has six tall windows. Low lighting helps stop delicate fabrics from fading. A café beside the exit sells fruit juice.',
  ['Glass cases stop visitors touching old pottery.','The entrance hall has six tall windows.','Low lighting helps prevent fabrics from fading.','The café sells fruit juice.'],
  'The cases prevent handling damage, and low light reduces fading.', 'The window count gives no protective function in this text.','Drinks for visitors do not protect collection objects.');
add('evidence-water-saving','Choose the two details that support the idea that the family is reducing wasted water.',
  'The family has changed how it uses water. They fixed the dripping bathroom tap. Their bathroom has yellow tiles. They collect rain in a barrel for watering plants. Their garden path curves around an apple tree.',
  ['They fixed the dripping tap.','The bathroom has yellow tiles.','They collect rain for watering plants.','The path curves around an apple tree.'],
  'Fixing a drip prevents loss, and collecting rain reduces the need for tap water in the garden.', 'Tile colour does not change water use.','The path’s shape is not linked to saving water.');
add('evidence-bus-comfort','Choose the two details that support the idea that the new bus is easier for passengers to use.',
  'The new bus was designed to help passengers travel comfortably. A low entrance allows easier boarding for people who cannot climb high steps. The bus is painted blue and white. Clear screens show the next stop so passengers know when to get off. Its route number is twelve.',
  ['The low entrance makes boarding easier.','The bus is blue and white.','Clear screens show passengers the next stop.','The route number is twelve.'],
  'The low entrance helps people get on, and the clear information helps them get off at the right place.', 'The colour scheme does not establish easier use.','The particular route number is not a usability feature.');
export const readingCapacityMultipleEvidence=rows;
