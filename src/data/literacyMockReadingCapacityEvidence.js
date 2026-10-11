const rows=[];
const add=(templateId,id,prompt,passage,labels,explanation,foilReasons)=>rows.push({templateId,id,prompt,passage,labels,explanation,foilReasons,
  demand:'Select the detail or heading that addresses the stated idea, keeping nearby true information separate.',
  sourceFile:'src/data/literacyMockReadingCapacityEvidence.js'});
const heading1=(id,passage,labels,why,foils)=>add('literacy.informational_features.heading-food',id,'Which heading fits these facts?',passage,labels,why,foils);
heading1('heading-turtle-body','A turtle has a hard shell. Its head and legs stick out from openings in the shell.',
  ['A Turtle’s Body','A Turtle’s Food','A Turtle’s Home'],'Both facts describe parts of the turtle’s body.',['The text says nothing about food.','The shell is a body part; no place where turtles live is described.']);
heading1('heading-getting-school','Some children walk to school. Others ride a bus or cycle with an adult.',
  ['Ways to Get to School','Games at School','Food for School Lunch'],'Both sentences describe travel to school.',['No games are described.','No meals are described.']);
heading1('heading-washing-hands','Wet your hands and add soap. Rub all over them. Rinse away the soap and dry your hands.',
  ['How to Wash Your Hands','How to Brush Your Hair','How to Fill a Bath'],'Every step belongs to hand washing.',['The instructions concern hands, not hair.','The steps do not describe filling a bath.']);
heading1('heading-bird-movement','A bird may fly from branch to branch. It can also hop along the ground.',
  ['How Birds Move','What Birds Eat','Where Birds Lay Eggs'],'Flying and hopping are ways of moving.',['No food is named.','The text gives no information about eggs.']);
heading1('heading-rain-clothes','A raincoat helps keep your clothes dry. Boots keep puddle water away from your socks.',
  ['Clothes for Wet Weather','Clothes for Sleeping','Clothes for Hot Sunshine'],'Both items protect a wearer from water.',['Neither sentence concerns sleepwear.','Protection from rain is the shared topic, not keeping cool.']);
heading1('heading-kitchen-tools','A whisk mixes ingredients. A sieve lets liquid pass while keeping larger pieces behind.',
  ['Jobs of Kitchen Tools','Colours in the Kitchen','Places to Buy Food'],'Both facts explain what a kitchen tool does.',['No colours are supplied.','No shops or other buying places are described.']);
heading1('heading-seed-parts','A seed has a covering around it. Inside is a tiny plant and a supply of food for its first growth.',
  ['Inside a Seed','Collecting Autumn Leaves','Animals in a Garden'],'The facts describe a seed’s parts and contents.',['Leaves are not the subject.','No garden animals are described.']);
const heading2=(id,passage,labels,why,foils)=>add('mock.depth.heading-warm-hard',id,'Which heading best fits the whole paragraph?',passage,labels,why,foils);
heading2('heading-night-visibility','When walking near roads after dark, people need drivers to notice them. A light shows where they are. Reflective strips return light from car lamps. Bright clothing can also help someone stand out. These features have a shared purpose even though they work in different ways.',
  ['Being Seen After Dark','Choosing a Favourite Jacket','How Car Lamps Are Made'],'The paragraph connects several ways to make a person visible.',['Clothing preference is not the point.','Car lamps are mentioned as a source of light, not a manufacturing topic.']);
heading2('heading-safe-storage','In the workshop, sharp tools go into covered holders. Heavy boxes stay on low shelves. Spilled liquid is wiped up quickly, and walking paths are kept clear. Each arrangement reduces a different way someone could be hurt.',
  ['Making a Workshop Safer','Building Taller Shelves','Sorting Tools by Colour'],'All the details reduce hazards in the workshop.',['Tall shelves are not recommended; heavy boxes stay low.','Colour is not part of the storage plan.']);
heading2('heading-young-readers','The library put simple books on low shelves. Picture labels helped children find subjects. A soft rug gave families a place to sit together, and a short story session welcomed new visitors. The changes made the space easier for young readers to use.',
  ['Welcoming Young Readers','Keeping Every Visitor Quiet','Storing the Oldest Books'],'The arrangements serve children and families in several ways.',['Quietness is not the shared purpose of the changes.','Book age and preservation are not discussed.']);
heading2('heading-food-travel','Food can be protected during a journey in different ways. A firm box keeps fruit from being crushed. A sealed container stops soup leaking. A cool bag slows warming. The best choice depends on what needs protecting and how it might be damaged.',
  ['Protecting Food on a Journey','Packing Only Fresh Fruit','Cooking Soup Outdoors'],'The three containers protect different foods from different problems.',['Fruit is just one example.','The soup is transported, not cooked outdoors.']);
heading2('heading-shared-space','In the community garden, everyone uses the same path and tool shed. A clear sign explains where tools belong. Gardeners return equipment clean and keep their plants from blocking the path. These small agreements help different people work comfortably in one place.',
  ['Sharing a Garden Considerately','Growing the Tallest Plants','Buying a Separate Shed for Everyone'],'The paragraph explains agreements for using shared space.',['Tall plants are not the goal.','The shed remains shared, not duplicated for each gardener.']);
heading2('heading-art-preservation','A drawing can fade in strong sunlight. Damp can damage its paper, and rough handling can tear an edge. A protective frame, a dry place and careful handling reduce these problems. Keeping artwork safe involves more than choosing where it looks attractive.',
  ['Looking After Paper Artwork','Learning to Draw in Sunlight','Choosing the Brightest Paint'],'All the details concern preventing damage to an existing drawing.',['The passage does not teach drawing technique.','It addresses paper and handling, not paint selection.']);
heading2('heading-water-saving','The school fixed dripping taps and collected rainwater for its garden. Pupils also turned taps off while soaping their hands. Each action reduced water that would otherwise be wasted. The school checked its use over time to see whether the changes helped.',
  ['Using Less Water at School','Making the Garden Larger','Washing Hands Less Often'],'The repairs and habits share the aim of reducing waste.',['No garden expansion is planned.','The habit changes how taps are used during washing, not how often hands are washed.']);
heading2('heading-clear-instructions','Good instructions put actions in a useful order. They name the things needed and use words the reader understands. A picture can show a difficult step. Trying the instructions helps the writer notice anything missing before someone else follows them.',
  ['Helping Readers Follow Instructions','Making Every Sentence Longer','Writing Stories with Surprise Endings'],'The paragraph describes several ways to make instructions usable.',['Lengthening sentences is not advised.','The writing is procedural rather than a story.']);

const support1=(id,prompt,passage,labels,why,foils)=>add('literacy.informational_features.fact-support',id,prompt,passage,labels,why,foils);
support1('support-reuse-puppet','Which detail shows that the puppet uses an old object?',
  'Our puppet has a body made from an empty cereal box. Its face is painted blue. We gave it a paper hat.',
  ['Its body is an empty cereal box.','Its face is blue.','It has a paper hat.'],'The previously used cereal box is an old object used again.',['A colour does not show reuse.','The text does not say the paper hat was previously used.']);
support1('support-cold-day','Which detail shows that the day was cold?',
  'Frost covered the grass beside the school. A red bus stopped at the gate. Children carried their bags inside.',
  ['Frost covered the grass.','A red bus stopped.','Children carried bags.'],'Frost is evidence of freezing conditions.',['A bus’s colour does not show temperature.','Children can carry bags in any weather.']);
support1('support-helpful-child','Which detail shows that Asha helped someone?',
  'Asha wore a striped coat. She carried a heavy bag for her grandfather. They walked past the pond together.',
  ['She carried his bag.','She wore a striped coat.','They walked past the pond together.'],'Carrying his heavy bag is a helpful action.',['Clothing does not establish help.','Walking past a pond is a location detail.']);
support1('support-windy-day','Which detail shows that wind was blowing?',
  'The washing flapped on the line. A yellow bucket stood below it. Dad carried a basket from the house.',
  ['The washing flapped.','A yellow bucket stood below it.','Dad carried a basket from the house.'],'The flapping washing shows moving air.',['Colour is unrelated to wind.','Carrying a basket does not establish wind.']);
support1('support-busy-café','Which detail shows that the café was busy?',
  'People waited in a long queue at the counter. A small clock hung on the wall. The door had a brass handle.',
  ['People waited in a long queue.','A clock hung on the wall.','The door had a brass handle.'],'A queue of customers supports the idea that the café is busy.',['A clock could hang in a quiet café too.','The handle’s material says nothing about customer numbers.']);
support1('support-growing-plant','Which detail shows that the plant is growing?',
  'Two new leaves opened on the bean plant. Its pot stood beside a window. A label gave the date it was planted.',
  ['Two new leaves opened.','The pot was beside a window.','A label gave a date.'],'New leaves are new growth.',['Position by a window is not itself evidence of growth.','The date records planting, not a present change in the plant.']);
support1('support-careful-packing','Which detail shows that Jo packed the glass carefully?',
  'Jo wrapped the glass in thick soft paper. The box was brown. She carried the parcel across the room.',
  ['Soft paper protected the glass.','The box was brown.','She carried the parcel across the room.'],'Soft wrapping protects the glass.',['The box colour does not show care.','Moving across a room does not show how it was packed.']);
support1('support-quiet-room','Which detail shows that people were keeping the room quiet?',
  'Visitors spoke in whispers. Three chairs stood near a table. A map hung beside the door.',
  ['Visitors spoke in whispers.','There were three chairs.','A map hung by the door.'],'Whispering keeps voices quiet.',['The number of chairs does not indicate sound level.','A map’s position does not establish quiet behaviour.']);

const support2=(id,prompt,passage,labels,why,foils)=>add('mock.depth.penguin-evidence',id,prompt,passage,labels,why,foils);
support2('support-waterproof-coat','Which fact supports the idea that the coat keeps rain out?',
  'The coat has a smooth blue outer layer. Water forms drops on that layer and rolls away without soaking through. There are two deep pockets, and a yellow loop lets the coat hang on a hook.',
  ['Rain does not soak through.','The coat has two deep pockets.','A yellow loop fits over a hook.'],'The water behaviour directly demonstrates protection from rain.',['Pocket depth concerns storage.','The loop concerns hanging the coat.']);
support2('support-bird-feeder-safety','Which detail supports the idea that the feeder helps small birds eat safely?',
  'The feeder hangs high above the ground, beyond a cat’s reach. Its roof is painted green, and a clear side shows how much seed remains. The owner fills it in the morning while wearing red gloves.',
  ['Cats cannot reach it.','Its roof is painted green.','The owner fills it each morning in red gloves.'],'Distance from a hunting cat supports the safety claim.',['A painted colour alone does not demonstrate safety.','The owner’s glove colour is unrelated to bird safety.']);
support2('support-insulated-box','Which detail best supports the idea that the box keeps food cool?',
  'Two closed boxes held matching ice packs in the same room. After an hour, more ice remained in the thick-sided box. That box had a red handle and a label showing its owner’s name. Both boxes stood on the same table.',
  ['More ice remained in the thick-sided box.','The box had a red handle.','The owner’s name was on a label.'],'The comparative ice result is evidence of slower warming.',['Handle colour does not measure cooling.','An owner label identifies the box but does not test its function.']);
support2('support-clear-sign','Which detail supports the idea that the new sign is easier to read?',
  'The old sign used tiny pale letters. The replacement uses large dark letters on a light background, visible from the far gate. Its wooden frame is older than the post. A gardener planted flowers below it after it was installed.',
  ['Its letters are visible from the far gate.','Its frame is older than the post.','Flowers grow below the sign.'],'Being readable at a distance directly supports the claim.',['Frame age does not establish readability.','The flowers decorate the site but do not show how easily letters can be read.']);
support2('support-wide-webbed-feet','Which fact supports the idea that the duck’s feet help it swim?',
  'Skin stretches between the duck’s toes, forming a broad surface that pushes against the water. Its feathers have brown patches. It rests beside the reeds, and its nest contains several pale eggs.',
  ['The broad surface pushes against the water.','Its feathers have brown patches.','Its nest contains pale eggs.'],'The feet’s pushing surface explains their function in swimming.',['Feather colour does not explain the feet.','Egg colour is unrelated to swimming.']);
support2('support-strong-container','Which detail supports the idea that the container is strong?',
  'During a test, a stack of heavy books rested on the closed container without bending its lid. The lid was orange and had a circular mark in one corner. After the test, a worker carried the container into a storeroom.',
  ['Heavy books did not bend the lid.','The lid was orange.','A worker carried it to a storeroom.'],'Withstanding a heavy load is evidence of strength.',['Colour does not establish strength.','Being moved into storage does not test strength.']);
support2('support-accessible-path','Which detail supports the idea that more people can use the new path?',
  'The new path has a smooth surface and a gentle slope instead of steep steps. A wheelchair user can reach the hall along it. There are yellow flowers beside the path, and a notice records when the work was finished.',
  ['Wheelchairs can use it.','Yellow flowers grow beside it.','A notice records the finishing date.'],'The stated access for a wheelchair user directly supports broader use.',['Flowers are decorative rather than evidence of access.','A completion date does not show who can use the path.']);
support2('support-habitat-cover','Which detail supports the idea that the log pile shelters small animals?',
  'Gaps beneath the stacked logs stay covered even when rain falls. A mouse was seen carrying dry leaves into one gap. The top log is pale grey, and the pile stands three metres from the garden gate.',
  ['The gaps stay covered when rain falls.','The top log is pale grey.','The pile is three metres from the gate.'],'A covered space offers protection from rain.',['Wood colour does not establish shelter.','Distance from the gate does not itself establish protection.']);

const evidence=(id,prompt,passage,labels,why,foils)=>add('literacy.informational_features.evidence-reason',id,prompt,passage,labels,why,foils);
evidence('evidence-pushcart','Which result best supports the claim that wheels make this load easier to move?',
  'A class moved the same load along the same flat path. Without wheels, two children struggled to drag it. On a wheeled cart, one child moved it steadily. They used a blue rope in both trials.',
  ['One child moved the loaded cart.','The rope was blue in both trials.','Both trials used the same flat path.'],'The comparison shows less effort with the wheeled cart.',['The rope colour is unchanged and does not explain the difference.','Using the same path controls the comparison but does not report the result.']);
evidence('evidence-absorbent-cloth','Which result supports the claim that the thick cloth absorbs more water?',
  'Two dry cloths of the same size were tested. Each was placed in the same amount of water for the same time. The thick cloth held more water when lifted out. Both cloths had stripes and were hung on the same line afterward.',
  ['The thicker cloth held more water.','The two cloths had matching striped patterns.','Both cloths were hung on the same line afterwards.'],'The controlled comparison directly measures water held.',['A shared pattern is not an absorption result.','Drying on the same line happens after the measurement.']);
evidence('evidence-book-cover','Which detail supports the claim that the cover protects the book?',
  'A drink spilled over a book with a wipe-clean cover. The cover became wet, but the pages beneath stayed dry. A matching uncovered booklet beside it had wet pages. Both books had pictures on their first pages.',
  ['Only uncovered pages got wet.','Both books had pictures on their first pages.','The books lay next to each other during the spill.'],'The difference in page damage supports the protective function.',['Pictures do not establish water protection.','Being beside each other gives test context, not the outcome.']);
evidence('evidence-plant-light','Which result supports the idea that the seedlings grew towards the light?',
  'Several seedlings stood by one window. Their stems gradually bent towards it. When the tray was turned, new growth curved back towards the window. Watering stayed the same, and every plant remained in its original pot.',
  ['Growth curved back towards the light.','Every plant remained in the same original pot.','The seedlings received the same watering throughout.'],'The repeated direction of growth relative to light supports the idea.',['Unchanged pots do not show the direction of growth.','Unchanged watering helps comparison but is not the growth result.']);
evidence('evidence-reading-light','Which observation supports the claim that the new lamp helps reading?',
  'Before the lamp was added, readers moved their books close to the window. With the lamp on, they could read small print clearly at the table. The table and books were unchanged. The lamp’s cord was black.',
  ['Readers could see small print clearly at the table.','The lamp had a black cord.','The table was the same as before.'],'The improved visibility directly addresses reading.',['Cord colour is irrelevant to seeing print.','An unchanged table supports the comparison but does not demonstrate the benefit.']);
evidence('evidence-seed-travel','Which detail supports the idea that an animal can carry this seed away?',
  'The seed has tiny hooks. During a walk, several seeds caught firmly in a dog’s fur and stayed there until it reached another field. The seed cases were brown, and the dog had walked past a pond.',
  ['Seeds stayed in the dog’s fur until another field.','The seed cases were brown.','The dog walked past a pond.'],'The seeds were carried to a new place on the animal.',['Seed colour does not show transport.','Passing the pond alone does not show that seeds travelled.']);
evidence('evidence-warm-mittens','Which result supports the claim that the mittens help keep hands warm?',
  'On a cold walk, one child wore mittens while another carried the same kind in a pocket. The child wearing mittens said her hands stayed warm. The other’s hands became cold until he put his mittens on. Both children wore blue coats.',
  ['Cold hands warmed after the mittens were put on.','Both coats were blue.','One child had pockets in his coat.'],'The reported change after wearing mittens supports their warming effect.',['Matching coat colour is unrelated to hand warmth.','A pocket’s existence does not show the effect of wearing mittens.']);
evidence('evidence-two-handles','Which result supports the claim that two handles help people carry the box together?',
  'With one handle, the box tilted when two people tried to share its weight. After a handle was fitted at each end, they lifted it evenly and carried it together. The contents and the route stayed the same. A label on the lid named the owner.',
  ['They lifted the box evenly using handles at both ends.','The lid named the owner.','The route stayed the same.'],'The balanced shared lift is the result explained by the added handle.',['The owner label has no bearing on carrying.','The unchanged route is a control, not the successful lifting result.']);

export const readingCapacityEvidence=rows;
