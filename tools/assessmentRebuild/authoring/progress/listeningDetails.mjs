import sentenceSource from '../sentence_comprehension.mjs';
import detailSource from '../key_details.mjs';
import { questions as publishedSentences } from '../../../../src/data/v3/banks/sentence_comprehension.v3.generated.js';
import { questions as publishedDetails } from '../../../../src/data/v3/banks/key_details.v3.generated.js';

// Reuse only an exact recorded stimulus from an ordinary, non-retention item.
// Every question below asks a different explicit detail from its source item.
// The generated bank retains source coordinates and the public-passage family.
const sentenceRows = [
  ['literal_who_what',1,1,'What color were the flowers?','red','green','blue'],
  ['literal_who_what',1,2,'Who gave Milo the sticker?','the dentist','the teacher','the waiter'],
  ['literal_who_what',1,3,'Where did the mail carrier whistle?','the street','the kitchen','the garden'],
  ['literal_who_what',1,4,'How many blocks did Ren stack?','four','two','six'],
  ['literal_who_what',1,5,'How many slices of toast burned?','two','one','three'],
  ['literal_who_what',1,7,'What was shiny?','the bottle top','the feather','the coin'],
  ['literal_who_what',1,8,'What did Miss Faro use to fix the table?','folded card','sticky tape','strong glue'],
  ['literal_where_when',1,1,'Where does the choir practise?','the hall','the park','the library'],
  ['literal_where_when',1,2,'What does Dad store in the bowl?','glasses','keys','coins'],
  ['literal_where_when',1,3,'Which leaf hid the frog?','the largest','the smallest','the torn one'],
  ['literal_where_when',1,4,'Which day has swimming lessons?','Friday','Monday','Tuesday'],
  ['literal_where_when',1,5,'What does Mom park behind the bins?','her bike','her car','her scooter'],
  ['literal_where_when',1,6,'Which place opens at seven?','the market','the school','the pool'],
  ['literal_where_when',1,7,'What grows beside Grandpa’s chair?','roses','beans','carrots'],
  ['literal_where_when',1,8,'What animal was found in the cupboard?','a kitten','a puppy','a rabbit'],
  ['literal_action',1,1,'What was the dog doing?','sleeping','barking','eating'],
  ['literal_action',1,2,'How many plates did the waiter carry?','six','four','eight'],
  ['literal_action',1,3,'How many lemons did Grandma use?','three','two','four'],
  ['literal_action',1,4,'Where did the goalkeeper send the ball?','above the goal','inside the goal','beside the goal'],
  ['literal_action',1,5,'Where did Kofi repair the map?','his desk','the floor','a bench'],
  ['literal_action',1,6,'Who made the cough that the parrot copied?','Grandpa','Grandma','a neighbour'],
  ['literal_action',1,7,'Where did Ada roll the snowball?','the street','the garden','the playground'],
  ['literal_action',1,8,'Where did the librarian stamp the date?','inside the book','on the bag','on the card'],
  ['two_clause',2,1,'What did the movers carry upstairs?','furniture','shopping','luggage'],
  ['two_clause',2,2,'What did Rosa wear?','boots','sandals','slippers'],
  ['two_clause',2,3,'What was shared at the picnic?','birthday cake','fresh fruit','warm soup'],
  ['two_clause',2,4,'Where was the warning sign?','the beach','the pool','the park'],
  ['two_clause',2,5,'What gift did Jin want to buy?','a plant','a book','a cake'],
  ['two_clause',2,6,'What was wet on the bench?','paint','rain','glue'],
  ['two_clause',2,7,'Where did Tara practise all week?','in goal','in midfield','in attack'],
  ['two_clause',2,8,'What smelled good at the fair?','bread','cakes','flowers'],
  ['pronoun_reference',2,1,'What did Maya pass to her brother?','a brush','a pencil','a ruler']
];

const shortRows = [
  ['what_happened',1,1,'Where did Owen first search?','the science shelf','the reading table','the helper’s desk'],
  ['what_happened',1,2,'What did Leo keep the wide brush for?','the wheels','the ladder','the windows'],
  ['what_happened',1,3,'How many empty shells did Jonah take?','three','four','five'],
  ['what_happened',1,4,'Where did the fallen rolls land?','a clean tray','the floor','a chair'],
  ['what_happened',1,5,'Who tightened Nina’s chain?','her dad','her friend','her teacher'],
  ['what_happened',1,6,'What lay beside the park bench?','a pine cone','an acorn','a leaf'],
  ['what_happened',1,7,'Which day did Nora cross off?','Monday','Friday','Wednesday'],
  ['what_happened',1,8,'What was below the eggs?','heavy cans','soft bread','fresh fruit'],
  ['where',1,1,'What grew in Maya’s pot?','sunflowers','beans','roses'],
  ['where',1,2,'What did Miss Green hear?','thunder','a bell','a whistle'],
  ['where',1,3,'What stood above the large books?','small books','toy cars','board games'],
  ['where',1,4,'What was beside the gift shop?','the cafe','the dinosaur room','the stairs'],
  ['where',1,5,'Where did Hana put the puzzles?','the top shelf','the red bin','the bottom drawer'],
  ['where',1,6,'What pattern was on Toby’s towel?','stripes','spots','stars'],
  ['where',1,7,'Where did Ivy find the coin?','the classroom door','the lost box','the playground gate'],
  ['where',1,8,'What color was the glove?','red','yellow','purple'],
  ['who',1,1,'What did Mina bring back?','a skipping rope','a ball','a basket'],
  ['who',1,2,'What kept blowing the leaves around?','the wind','a fan','a broom'],
  ['who',1,3,'What color pencil did Maya have?','blue','orange','yellow'],
  ['who',1,4,'Where did Rosa put the saved ball?','under the blanket','beside the pond','inside a basket'],
  ['who',1,5,'What color frame did Zoe choose?','yellow','purple','pink'],
  ['number_detail',1,1,'What was the class preparing for?','a picnic','a concert','a race'],
  ['number_detail',1,2,'How many low notes did Mr. Hill play?','five','three','six'],
  ['number_detail',1,3,'Where did Max get the cushions?','the shelf','the rug','the chair'],
  ['number_detail',1,4,'What was changed to fix the clock?','its battery','its hands','its case'],
  ['who',1,8,'Where was the puddle?','the school door','the bus stop','the playground gate'],
  ['number_detail',1,5,'How many lemons were on Tayo’s list?','two lemons','three lemons','four lemons'],
  ['number_detail',1,6,'What color were the butterflies?','white','blue','orange'],
  ['number_detail',1,7,'What did the principal buy?','a brownie','an oat bar','a sandwich'],
  ['number_detail',1,8,'What color blocks were at the top?','yellow','red','blue'],
  ['who',1,6,'Where was the folded name drawn from?','a cup','a bowl','a box'],
  ['who',1,7,'Where was Sana’s spare whistle?','on her bag','in her coat','on her desk']
];

const longRows = [
  ['precise_detail',2,1,'Where did Talia put the plain rolls?','the back shelf','the front counter','the glass window'],
  ['precise_detail',2,2,'What did the children record in the notebook?','the watering order','the weather forecast','the fruit weights'],
  ['precise_detail',2,3,'What color were both bookmarks?','yellow','blue','green'],
  ['precise_detail',2,4,'What did Sofia draw on her music?','a circle','a star','an arrow'],
  ['precise_detail',2,5,'What did the chess club hold in its photograph?','a board','carrots','seeds'],
  ['precise_detail',2,6,'Where did both soil cups stand?','a sunny shelf','a dark cupboard','a window outside'],
  ['precise_detail',2,7,'What kept the crackers dry?','a sealed box','the cooler’s ice','the fridge’s tray'],
  ['precise_detail',2,8,'What sticker was on both lunchboxes?','a rocket','a star','a planet'],
  ['detail_across_sentences',2,1,'What was in the feeder after school?','only dust','half the seeds','all the seeds'],
  ['detail_across_sentences',2,2,'Where was the box key kept over the weekend?','the office','the classroom','the hall'],
  ['detail_across_sentences',2,3,'What fruit grew on Baby Mo’s tree?','plums','apples','cherries'],
  ['detail_across_sentences',2,4,'What became the throne?','two gold chairs','a cardboard box','a wooden bench'],
  ['detail_across_sentences',2,5,'Who received Keya’s kickboard?','a beginner','her new teacher','a middle-group swimmer'],
  ['detail_across_sentences',2,6,'How many cups were saved for drinks?','six','three','twelve'],
  ['detail_across_sentences',2,7,'Where did Meena leave the watering can?','under the sink','beside the dishes','on the wall'],
  ['detail_across_sentences',2,8,'What was beside the older benches?','flowers','seed dishes','bird cages'],
  ['which_is_not',2,1,'Where did the fish wait during cleaning?','a bucket','the castle','the aquarium'],
  ['which_is_not',2,2,'What color were the running lanes?','white','red','blue'],
  ['which_is_not',2,3,'Who would carry the bird guide?','the teacher','Amir','a neighbour'],
  ['which_is_not',2,4,'Where did Grandpa keep his radio?','near the door','under the mower','on the window shelf'],
  ['which_is_not',2,5,'Where was the signing table?','near the open doors','beside the picture tables','at the back wall'],
  ['which_is_not',2,6,'What instrument did Mr. Okoye play?','a guitar','a drum','a piano'],
  ['which_is_not',2,7,'Which floor was in the dinosaur room?','a smooth floor','a rough floor','a carpeted floor'],
  ['which_is_not',2,8,'What carried the largest pumpkin?','a wheelbarrow','a basket','a trowel'],
  ['detail_across_sentences',2,20,'What color were the games’ labels?','white','green','pink'],
  ['precise_detail',2,20,'What would Noor use the tape for?','holding shapes together','measuring straight sides','cutting paper shapes'],
  ['which_is_not',2,20,'Where would lunch be provided?','the park','the school','the cafe'],
  ['detail_across_sentences',2,21,'Which pet arrived last?','the dog','the rabbit','the cat'],
  ['precise_detail',2,21,'What slowed the return journey?','heavy wind','thick fog','strong rain'],
  ['detail_across_sentences',2,22,'What was in the smaller box?','paper maps','the display stand','wooden tools'],
  ['which_is_not',2,21,'How many rows did the choir stand in?','two rows','one row','four rows'],
  ['detail_across_sentences',2,23,'Which fan setting was used?','the lowest','the highest','the middle one']
];

const toItems = (source, rows, tier) => rows.map(([unit, level, variant, prompt, key, ...foils], index) => {
  const original = source.items.find(item => item.u === unit && item.lvl === level && item.v === variant && !item.retention && !item.retentionOnly);
  if (!original?.passage || original.prompt === prompt) throw new Error(`Missing or unchanged listening source ${source.skillId}/${unit}/${variant}`);
  const published = (source.skillId === 'sentence_comprehension' ? publishedSentences : publishedDetails).find(item => item.passage === original.passage && !item.retentionOnly);
  if (!published) throw new Error(`Listening source has no published non-retention passage: ${source.skillId}/${unit}/${variant}`);
  return {
    trackId: 'listening_stories', tier, sourceKey: `${tier}-${index + 1}`, prompt,
    passage: original.passage,
    sourceItemId: published.id,
    sourceReuse: 'approved_public_recorded_passage',
    options: [key, ...foils].map((text, i) => ({ text, key: i === 0, rationale: i === 0 ? 'KEY' : 'D-OPPOSITE' })),
    note: 'A new literal-detail question, with an explicit key in the exact recorded source passage. Public passage familiarity is unknown; known source-family exposure excludes it.'
  };
});

export default [...toItems(sentenceSource, sentenceRows, 0), ...toItems(detailSource, shortRows, 1), ...toItems(detailSource, longRows, 2)];
