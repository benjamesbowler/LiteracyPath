import { getLedaInstructionAudioPath } from './ledaProductionAudio.js';

const SOURCE = 'src/data/literacyMockPrintCapacity.js';
const credit = (label, name) => ({ label, name });
// These layouts change the actual print conventions that the reader must use:
// role order, combined or shared credits, labels, and competing cover features.
// A renamed cover with the same credit layout is not added as another probe.
const covers = [];
const cover = (task, level, id, title, credits, key, foils, demand, options = {}) =>
  covers.push({ task, level, id, title, credits, key, foils, demand, ...options });

cover('title',1,'question-title','Where Do Seeds Go?',[
  credit('Words by','Ruth Green'),credit('Drawings by','Ash Cole')],
'Where Do Seeds Go?',['Ruth Green','Ash Cole'],'Recognize a question as the book title while distinguishing words and drawings credits.');
cover('title',1,'combined-creator','Home at Last!',[
  credit('Story and pictures by','Nina Hart'),credit('Printed by','Red Oak Press')],
'Home at Last!',['Nina Hart','Red Oak Press'],'Separate the book title from a combined creator credit and a printing credit.');
cover('title',1,'paired-writers','Tall, Taller, Tallest',[
  credit('Written by','Luis Park and Eve Day'),credit('Pictures by','Kim Lane')],
'Tall, Taller, Tallest',['Luis Park and Eve Day','Kim Lane'],'Find one title when the writer line names two people.');
cover('title',1,'colon-labels','UP!',[
  credit('Words:','Maya Brook'),credit('Pictures:','Finn Moss')],
'UP!',['Maya Brook','Finn Moss'],'Distinguish a short uppercase title from longer creator names identified with colon labels.');
cover('title',1,'named-character','Otto and the Moon',[
  credit('Written by','Bea Lake'),credit('Cover picture by','Owen Bell')],
'Otto and the Moon',['Bea Lake','Owen Bell'],'Treat a character name within the title as part of the title, rather than another creator credit.');
cover('title',1,'art-first','Knock! Knock!',[
  credit('Pictures by','Ella Woods'),credit('Written by','Theo Reed')],
'Knock! Knock!',['Ella Woods','Theo Reed'],'Locate a title containing repeated spoken words when the art credit comes before the writer.');
cover('title',1,'class-created','Can You Find Me?',[
  credit('Written and drawn by','The Blue Class')],
'Can You Find Me?',['The Blue Class','For our families'],'Distinguish the title from a class creator and a separate dedication.',{context:'For our families'});

cover('author',1,'art-first-writer','The Lost Button',[
  credit('Pictures by','Tara West'),credit('Written by','Eli Stone')],
'Eli Stone',['Tara West','The Lost Button'],'Find the explicit writer credit after the picture credit.');
cover('author',1,'words-drawings','A Pocket of Sand',[
  credit('Words by','Mila Snow'),credit('Drawings by','Noah Reed')],
'Mila Snow',['Noah Reed','A Pocket of Sand'],'Connect the words credit with writing and distinguish it from drawing.');
cover('author',1,'joint-authors','Two Ways Home',[
  credit('Written by','Anna Hill and Ben Fox'),credit('Pictures by','Rose Park')],
'Anna Hill and Ben Fox',['Rose Park','Two Ways Home'],'Keep both names in a joint writer credit together.');
cover('author',1,'writer-artist','The Paper Whale',[
  credit('Story and pictures by','Ada Lane'),credit('Printed by','Little Pine Books')],
'Ada Lane',['Little Pine Books','The Paper Whale'],'Recognize that one person can write the story and make its pictures.');
cover('author',1,'named-roles','The Busy Nest',[
  credit('Author:','Leo Hart'),credit('Illustrator:','Imani Day')],
'Leo Hart',['Imani Day','The Busy Nest'],'Use the explicit author role label instead of a byline.');
cover('author',1,'class-writer','Our Garden Book',[
  credit('Written by','The Green Class'),credit('Pictures by','Zoe Bell')],
'The Green Class',['Zoe Bell','Our Garden Book'],'Recognize a class as the credited writer rather than assuming an individual name must be correct.');
cover('author',1,'title-name','Milo’s Boat',[
  credit('Cover picture by','Jude Oak'),credit('Written by','Pia Brook')],
'Pia Brook',['Milo','Jude Oak'],'Distinguish the writer from a character named in the title and the cover artist.');
cover('author',1,'dedication-name','A Gift for Gran',[
  credit('Written by','Esme Ray')],
'Esme Ray',['Gran','Toby'],'Use the writer credit while ignoring names in the title and dedication.',{context:'For Toby, who loves surprises.'});

cover('illustrator',1,'picture-first','The Window Cat',[
  credit('Pictures by','Ravi Wood'),credit('Written by','June Moss')],
'Ravi Wood',['June Moss','The Window Cat'],'Locate a picture credit placed before the writing credit.');
cover('illustrator',1,'drawings-words','A Trail of Shells',[
  credit('Words by','Ida Fox'),credit('Drawings by','Amir Hill')],
'Amir Hill',['Ida Fox','A Trail of Shells'],'Connect a drawings credit with the person who made the pictures.');
cover('illustrator',1,'joint-artists','Building a Den',[
  credit('Written by','Kit Reed'),credit('Pictures by','Lena Sun and Max Dale')],
'Lena Sun and Max Dale',['Kit Reed','Building a Den'],'Keep the two names in a shared picture credit together.');
cover('illustrator',1,'one-creator','The Blue Umbrella',[
  credit('Written and drawn by','Iris Lake'),credit('Printed by','Field Books')],
'Iris Lake',['Field Books','The Blue Umbrella'],'Recognize the artist in a combined writing-and-drawing credit.');
cover('illustrator',1,'labelled-artist','Under the Stairs',[
  credit('Illustrator:','Theo Finch'),credit('Author:','Amara Snow')],
'Theo Finch',['Amara Snow','Under the Stairs'],'Identify the illustrator from a role label rather than a Pictures by phrase.');
cover('illustrator',1,'group-artists','Our Street in Spring',[
  credit('Written by','Nora Elm'),credit('Pictures by','The Yellow Class')],
'The Yellow Class',['Nora Elm','Our Street in Spring'],'Recognize a class as the credited picture maker.');
cover('illustrator',1,'dedicated-artist','A Fox for Faye',[
  credit('Pictures by','Omar Lane')],
'Omar Lane',['Faye','Grandad'],'Ignore a title character and dedication recipient when locating the picture credit.',{context:'For Grandad, with love.'});
cover('illustrator',1,'art-colon','The Tiny Door',[
  credit('Story:','Sana Bell'),credit('Art:','Evan Cole')],
'Evan Cole',['Sana Bell','The Tiny Door'],'Distinguish a short Art label from the Story label.');

cover('author',2,'map-credit','A River Journey',[
  credit('by','Sol West'),credit('Maps by','Lily Brook'),credit('Illustrated by','Nico Hill')],
'Sol West',['Lily Brook','Nico Hill'],'Interpret a bare byline among separate map and illustration credits.');
cover('author',2,'dedication-byline','The Long Way Back',[
  credit('Illustrated by','Asha Reed'),credit('by','Felix Green')],
'Felix Green',['Asha Reed','Aunt Rosa'],'Locate a byline after the art credit and distinguish a dedication recipient.',{context:'For Aunt Rosa, who showed us the way.'});
cover('author',2,'joint-byline','Summer at the Lake',[
  credit('by','Rosa Park and Dev Stone'),credit('Illustrated by','Clara Moss')],
'Rosa Park and Dev Stone',['Clara Moss','Summer at the Lake'],'Read both writers in a joint byline without choosing the illustrator.');
cover('author',2,'credit-and-press','Seeds of Change',[
  credit('A book by','Hazel Day'),credit('Published by','Bright Leaf Books')],
'Hazel Day',['Bright Leaf Books','A gardener’s story'],'Distinguish the creator byline from a publishing credit and subtitle.',{subtitle:'A gardener’s story'});
cover('author',2,'author-and-cover','The Glass Mountain',[
  credit('Cover art by','Rowan Grey'),credit('Text by','Cleo West')],
'Cleo West',['Rowan Grey','Adventures beyond the valley'],'Connect Text by with authorship when the cover art credit appears first.',{subtitle:'Adventures beyond the valley'});
cover('author',2,'illustrated-combined','A Home for Every Bird',[
  credit('Written and illustrated by','Sofia Lake'),credit('Maps by','Arlo Reed')],
'Sofia Lake',['Arlo Reed','For bird lovers'],'Resolve a combined author-illustrator credit against a separate contributor and dedication.',{context:'For bird lovers'});
cover('author',2,'series-byline','Footprints in the Snow',[
  credit('Story by','Dara Finch'),credit('Series created by','Pip Elm'),credit('Illustrations by','Leon Sun')],
'Dara Finch',['Pip Elm','Leon Sun'],'Distinguish the author of this story from the creator of its series.');
cover('author',2,'poetry-credit','Words for a Windy Day',[
  credit('Poems by','Nadia Hart'),credit('Drawings by','Louis Bell'),credit('Cover design by','Mira Fox')],
'Nadia Hart',['Louis Bell','Mira Fox'],'Use the poems credit to identify the author among two visual contributors.');
cover('author',2,'byline-name-trap','Jasper’s Island',[
  credit('by','Amina Cole'),credit('Illustrated by','Jasper Wells')],
'Amina Cole',['Jasper Wells','Jasper’s Island'],'Do not infer authorship from the name repeated in the title and art credit.');

cover('illustrator',2,'byline-and-art','Beneath the Bridge',[
  credit('by','Tomas Hill'),credit('Illustrations by','Lila Woods'),credit('Maps by','Zain Fox')],
'Lila Woods',['Tomas Hill','Zain Fox'],'Distinguish the illustration credit from a bare author byline and map credit.');
cover('illustrator',2,'illustrator-first','The Rain Makers',[
  credit('Illustrated by','Mae Green'),credit('A story by','Alex Stone')],
'Mae Green',['Alex Stone','For Uncle Joe'],'Find the artist before the author credit while ignoring a dedication.',{context:'For Uncle Joe'});
cover('illustrator',2,'paired-illustrators','Homes High and Low',[
  credit('by','Eden Ray'),credit('Illustrated by','Rory Bell and Asha Lane')],
'Rory Bell and Asha Lane',['Eden Ray','Homes High and Low'],'Keep both credited illustrators together instead of choosing the single author.');
cover('illustrator',2,'whole-book-artist','The Lantern Tree',[
  credit('Written and illustrated by','Oona West'),credit('Cover lettering by','Miles Brook')],
'Oona West',['Miles Brook','For Mum'],'Distinguish the whole-book illustrator from a person credited only for cover lettering.',{context:'For Mum'});
cover('illustrator',2,'text-and-drawings','Life Under a Log',[
  credit('Drawings by','Ari Elm'),credit('Text by','Mabel Fox'),credit('Printed by','Acorn Press')],
'Ari Elm',['Mabel Fox','Acorn Press'],'Identify the picture maker through a Drawings credit among text and printing credits.');
cover('illustrator',2,'title-name-artist','Ruby and the Storm',[
  credit('A book by','Ruby Dale'),credit('Illustrated by','Henri Moss')],
'Henri Moss',['Ruby Dale','A tale of courage'],'Ignore the author name repeated in the title and identify the separate illustrator.',{subtitle:'A tale of courage'});
cover('illustrator',2,'studio-art','The Moonlit Fair',[
  credit('Illustrations by','Small Lantern Studio'),credit('Written by','Mina Hart')],
'Small Lantern Studio',['Mina Hart','Stories after sunset'],'Recognize an art studio as the credited illustrator rather than choosing a person name.',{subtitle:'Stories after sunset'});
cover('illustrator',2,'series-and-art','The Missing Acorn',[
  credit('Story by','Beau Reed'),credit('Illustrated by','Imogen Lake'),credit('Series created by','Elio Park')],
'Imogen Lake',['Beau Reed','Elio Park'],'Separate the artist for this story from its writer and the creator of the series.');
cover('illustrator',2,'poem-drawings','A Basket of Rhymes',[
  credit('Poems by','Nell Dove'),credit('Illustrations by','Otis Ray'),credit('Book design by','Hana Green')],
'Otis Ray',['Nell Dove','Hana Green'],'Distinguish illustrations from page design and poems when all contributors are named.');

cover('title',2,'subtitle-contrast','Under Our Feet',[
  credit('by','Suri Bell'),credit('Illustrated by','Jonah Moss')],
'Under Our Feet',['Discovering life in the soil','Suri Bell'],'Separate the main title from a descriptive subtitle and author byline.',{subtitle:'Discovering life in the soil'});
cover('title',2,'series-number','The Lighthouse Door',[
  credit('A story by','Luca Hart')],
'The Lighthouse Door',['Harbour Mysteries — Book 2','Luca Hart'],'Distinguish the title of one book from the series and volume line.',{subtitle:'Harbour Mysteries — Book 2'});
cover('title',2,'title-question','Who Lives Here?',[
  credit('Written by','Elsa Day'),credit('Pictures by','Wild Meadow Studio')],
'Who Lives Here?',['Animal homes near and far','Wild Meadow Studio'],'Recognize a question title against a descriptive subtitle and an art studio name.',{subtitle:'Animal homes near and far'});
cover('title',2,'cover-badge','The Sunflower Race',[
  credit('Story and pictures by','Milo Ray')],
'The Sunflower Race',['A read-together book','Milo Ray'],'Distinguish the title from a reading-use cover badge and combined creator credit.',{context:'A read-together book'});
cover('title',2,'edition-statement','Bridges Around Us',[
  credit('by','Dalia Green'),credit('Published by','Stone Bridge Press')],
'Bridges Around Us',['New edition','Dalia Green'],'Separate the enduring title from the edition statement and author.',{subtitle:'New edition'});
cover('title',2,'series-vs-subtitle','The Hidden Harbour',[
  credit('Written by','Remy Woods')],
'The Hidden Harbour',['Island Explorers','A journey through caves'],'Find the main title among both a series label and a descriptive subtitle.',{subtitle:'A journey through caves',context:'Island Explorers'});
cover('title',2,'collection-title','One More Story',[
  credit('Stories by','Alma Cole'),credit('Pictures by','Theo Elm')],
'One More Story',['Five tales to share','Alma Cole'],'Identify a collection title rather than the line describing its contents or its author.',{subtitle:'Five tales to share'});
cover('title',2,'title-and-dedication','The Smallest Star',[
  credit('Written and illustrated by','Farah Lake'),credit('Published by','Night Sky Books')],
'The Smallest Star',['For every dreamer','Night Sky Books'],'Distinguish the title from a dedication and the publisher name.',{context:'For every dreamer'});

const pageNavigation = [
  ['left-to-right','Left-hand page 2: We packed the picnic.\nRight-hand page 3: We set off.\nYou have finished the left-hand page.','Which page should you read next?','3','2','4','Move from the finished left-hand page to the facing right-hand page.'],
  ['turn-the-spread','The open book shows pages 4 and 5.\nYou have finished both pages.','Which page should you read next?','6','4','7','Turn to the next spread after completing both visible pages.'],
  ['printed-continuation','Page 8: The tunnel grew darker.\nAt the bottom: Story continues on page 12.','Where should you continue this story?','12','8','9','Follow an explicit continuation reference instead of automatically choosing the next number.'],
  ['blank-facing-page','Page 14 is blank.\nPage 15 begins: The fox woke up.\nYou have opened the book at this pair of pages.','Which page has the story to read?','15','14','16','Locate the story-bearing page when its facing page is blank.'],
  ['return-after-picture','Page 17: The children reached the castle.\nPage 18: A full-page castle picture.\nPage 19: The gate slowly opened.','Which page continues the words after the picture?','19','17','18','Continue the written story after an intervening picture-only page.'],
  ['numbered-range','Read pages 20 to 22.\nYou have finished page 20.','Which page should you read next?','21','20','22','Advance one page within the assigned range without jumping straight to its last page.'],
  ['two-parts','Page 7 ends: Turn to page 10 for Part Two.\nPages 8 and 9 show a game.','Where does Part Two begin?','10','8','9','Use a printed part reference instead of detouring through the intervening activity pages.'],
  ['bookmark-return','The bookmark is between pages 24 and 25.\nYou have already read page 24.','Which page should you start when you return?','25','24','26','Resume at the unread facing page indicated by a bookmark and completed-page record.'],
];

export function buildLiteracyMockPrintCapacityItems(bank) {
  const output = [];
  const make = (template, key, prompt, passage, labels, explanation, demand, textFeature) => {
    const id = `mock.capacity.print.${key}`;
    const choices = labels.map((label, index) => ({ id: `c${index}`, label }));
    const stimulusKey = passage.toLowerCase().replace(/\s+/g,' ').trim();
    const cue = { role:'instruction',text:prompt,path:getLedaInstructionAudioPath(prompt),required:true };
    return { ...template,id,canonicalItemId:id,sourceItemId:id,itemSnapshot:undefined,
      prompt,passage,targetWord:'',image:'',imageAlt:'',textFeature,choices,answer:'c0',
      stimulusKey,canonicalPassageId:stimulusKey,exposureFamilyId:`mock-print:${stimulusKey}`,
      renderTargetText:false,tutorialOnly:false,
      requiredAudioCues:[cue],requiredAudioPaths:[cue.path].filter(Boolean),requiredImagePaths:[],
      sourceProvenance:{kind:'original_mock_print_capacity',file:SOURCE,sourceId:key,taskTemplate:template.id},
      mediaDecision:{role:'text-only',paths:[],constructReview:'approved',answerNeutral:'approved',
        reason:'The complete authored print layout supplies the evidence; only the task instruction is narrated.'},
      explanation,difficultyEvidence:demand,
      distractorRationales:Object.fromEntries(choices.slice(1).map(choice => [choice.id,
        `${choice.label} identifies a different printed role or position. ${explanation}`])),
    };
  };
  for (const row of covers) {
    const template = bank.find(item => item.skillId === 'print_concepts' && item.constructClaim === row.task && item.level === row.level && !item.tutorialOnly);
    if (!template) throw new Error(`Missing print capacity template: ${row.task}:${row.level}`);
    const feature = {kind:'book_cover',title:row.title,credits:row.credits,...(row.subtitle?{subtitle:row.subtitle}:{}),...(row.context?{context:row.context}:{})};
    const passage = [row.title,row.subtitle,...row.credits.map(value=>`${value.label} ${value.name}`),row.context].filter(Boolean).join('\n');
    const label = row.task === 'title' ? 'title' : row.task === 'author' ? 'writer' : 'picture maker';
    output.push(make(template,`${row.task}.l${row.level}.${row.id}`,template.prompt,passage,[row.key,...row.foils],
      `${row.key} is the ${label} identified by this cover.`,row.demand,feature));
  }
  const template = bank.find(item=>item.id==='literacy.print_concepts.next-page');
  if (!template) throw new Error('Missing page navigation template.');
  for (const [id,passage,prompt,key,a,b,demand] of pageNavigation) output.push(make(template,`page-navigation.${id}`,prompt,passage,[key,a,b],
    `Page ${key} is the required place to continue. ${demand}`,demand));
  return output;
}
