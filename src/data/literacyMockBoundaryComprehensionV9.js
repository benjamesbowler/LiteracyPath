import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';

const FILE='src/data/literacyMockBoundaryComprehensionV9.js';

// Original paired episodes. Each ceiling foil is useful advice for exactly
// one supplied episode; only the key explains both mistake-to-repair changes.
// The one-episode and two-episode variants share an exposure family across
// reading and listening. Adding an episode does not create a fresh story.
export const LITERACY_MOCK_V9_BOUNDARY_THEME_ROWS=[
  {id:'small-trial',episodes:[
    'Mira painted every paper flag before trying the new paint. When the flags dried, the paint cracked. She tried a little paint on spare paper, chose one that stayed smooth, and made the flags again.',
    'Owen filled a whole watering can from an old jug. Water leaked through a crack and soaked the bench. He poured a little water into the next jug first. That jug stayed dry underneath, so he used it.'
  ],lesson:'Try a small test before doing the whole job.',partials:['Test unfamiliar paint on a piece of spare paper.','Check an old jug for leaks before filling it.'],entryFoils:['Keep different paint colors in their own pots.','Choose flag colors that visitors can see clearly.']},
  {id:'check-the-request',episodes:[
    'Bo heard that a parcel belonged by the side door. He put it beside the playground door, but the collector waited elsewhere. Bo asked which side door was meant, then moved it to the door beside the office.',
    'Nia was asked to put the seed tray in a bright place. She chose the sunny outdoor wall, where the rain flooded it. She checked with the gardener and moved it to the bright indoor window the gardener had meant.'
  ],lesson:'Check unclear directions before choosing what to do.',partials:['Find out which door a collector actually means.','Check whether a bright growing place should be indoors.'],entryFoils:['Choose a box that is easy to carry.','Keep the path beside a busy door clear.']},
  {id:'wait-for-the-change',episodes:[
    'Finn glued a handle onto a cardboard basket and lifted it at once. The wet joint slid apart. He glued it again and left it flat until the joint was firm. This time the handle stayed on.',
    'Aya packed a painted clay tile while its surface was still wet. The wrapping stuck to the picture. She painted a new tile and left it on the rack until it was dry before wrapping it.'
  ],lesson:'Allow a change to finish before the next step.',partials:['Let a glued handle become firm before lifting.','Let a painted tile dry before wrapping it.'],entryFoils:['Use a handle large enough for your hand.','Plan what a basket will hold before decorating.']},
  {id:'manageable-parts',episodes:[
    'Eli tried to learn a long drum pattern all at once and kept losing his place. He practiced its first short part, then the next part. After joining the practiced parts, he could play the pattern through.',
    'Rosa tried to copy a large map in one hurried drawing. Several streets were missing. She copied one small square of the map at a time, checking each square before moving on. Her new drawing included the streets.'
  ],lesson:'A large task can be tackled in smaller parts.',partials:['Practice short drum phrases before joining the pattern.','Copy and check one small map section at a time.'],entryFoils:['Listen to other players before choosing an instrument.','Give every player a chance to lead the music.']},
  {id:'choose-fitting-tools',episodes:[
    'Kai used a wide cup to pour beads into a narrow bottle. Beads bounced onto the floor. He held a funnel in the neck and poured through it. The beads went into the bottle.',
    'Lena used a thick brush to paint the tiny windows on her model. Paint covered the wall around each window. She changed to a thin brush and painted the remaining windows without covering the walls.'
  ],lesson:'Choose a tool that fits the particular job.',partials:['Use a funnel when filling a narrow bottle.','Use a thin brush for small painted details.'],entryFoils:['Sort differently colored beads into separate groups.','Keep a record of how many beads you collect.']},
  {id:'leave-working-space',episodes:[
    'Tess pushed all her seedlings into one corner of the tray. Their leaves overlapped and bent. She moved them farther apart into the empty spaces. The leaves no longer pressed against one another.',
    'Arun crowded the drying rack with wet paintings touching edge to edge. Two pictures stuck together. He moved the next paintings onto separate spaces with gaps between them. They dried without sticking.'
  ],lesson:'Leave enough space for things to work properly.',partials:['Give growing seedlings room between their leaves.','Keep wet paintings apart while they are drying.'],entryFoils:['Choose plant labels that can survive getting wet.','Count the seedlings before carrying a full tray.']},
  {id:'keep-a-record',episodes:[
    'Jo kept the game scores in her head. After a break she could not remember which team had seven points. On the next game she marked every point on a scorecard. The teams could check the score after the break.',
    'Mateo lent out the class puppets without writing down the borrowers. At tidy-up he did not know who still had one. Next time he wrote each name beside a puppet picture and ticked it when the puppet returned.'
  ],lesson:'A simple record can preserve details we may forget.',partials:['Mark each point so a game score can be checked.','Record who borrows each shared classroom puppet.'],entryFoils:['Choose teams with equal numbers of players.','Give both teams a chance to practice first.']},
  {id:'complete-information',episodes:[
    'Sal wrote that the picnic would begin at ten, but left out the day. His cousin arrived on the wrong morning. Sal sent another note with both the day and the time, and his cousin came to the picnic.',
    'Pia copied that the model needed three strips, but left out their length. Her group cut strips too short for the roof. She checked the plan and wrote both the number and the length. The new strips reached across.'
  ],lesson:'Useful instructions need all the important details.',partials:['Include the day as well as the picnic time.','Include strip lengths as well as how many to cut.'],entryFoils:['Send a picnic invitation in a strong envelope.','Choose a picnic place with room for everyone.']},
  {id:'mark-before-removing',episodes:[
    'Ren took every shelf out of a toy cupboard to clean it. Later she could not tell which shelf had fitted each space. Before cleaning the next cupboard, she put matching marks on the shelves and their spaces. They went back easily.',
    'Theo pulled the ribbons out of a woven mat and forgot their order. Before repairing another section, he drew where each ribbon went. He followed the drawing and put the ribbons back in the same places.'
  ],lesson:'Record the arrangement before taking something apart.',partials:['Mark shelves so they return to the correct spaces.','Draw a ribbon pattern before removing its ribbons.'],entryFoils:['Keep cleaning cloths away from the toy collection.','Measure a cupboard before choosing what to store.']},
  {id:'fix-the-cause',episodes:[
    'Maya kept wiping water from under a plant pot. The puddle returned whenever she watered it because its tray was cracked. She replaced the tray. After the next watering, the shelf stayed dry.',
    'Ben rebuilt the top of his block tower whenever it leaned. It kept leaning because a folded cloth was under one corner of the base. He flattened the cloth and rebuilt the base. The tower stayed upright.'
  ],lesson:'Find the cause instead of repeating a temporary fix.',partials:['Replace a cracked tray that keeps leaking water.','Level a tower base before rebuilding its top.'],entryFoils:['Choose plants that fit the space on a shelf.','Share the watering jobs between the gardeners.']},
  {id:'change-a-failed-method',episodes:[
    'Zara pushed the same puzzle piece harder each time it would not fit. The cardboard began to bend. She stopped pushing, turned the piece, and found the position that matched the gap.',
    'Hugo pulled both ends of a knotted ribbon to free it. The knot grew tighter. He loosened one small loop with his fingers instead. The ribbon came free without another hard pull.'
  ],lesson:'When a method fails, try a different approach.',partials:['Turn a puzzle piece rather than forcing it down.','Loosen a knot instead of pulling both ends.'],entryFoils:['Sort puzzle pieces into groups with similar colors.','Choose a puzzle with enough pieces for everyone.']},
  {id:'check-identity',episodes:[
    'Amir took a blue coat from the hook because it looked like his. Its owner came looking for it. Amir checked the name inside and returned it. Then he checked another blue coat and found his own name.',
    'Ivy carried a seed packet to the bean bed because its picture looked like beans. The gardener showed her that it was a pea packet. Ivy read the names on the remaining packets before taking the bean seeds.'
  ],lesson:'Check identity instead of relying on a quick resemblance.',partials:['Read a coat name before taking a similar coat.','Read seed names before choosing what to plant.'],entryFoils:['Hang a wet coat where it can dry.','Keep coats low enough for children to reach.']},
  {id:'prepare-the-earlier-step',episodes:[
    'Noor tied the ribbon tightly around an empty gift box. Then she had to undo it to put the gift inside. For the next gift she packed and closed the box before tying its ribbon.',
    'Leo mixed a batch of plaster before making a space for the mold. While he searched for a clear tray, the mixture became too stiff to pour. For the next batch he set out the mold and tray before mixing.'
  ],lesson:'Do needed earlier steps before starting later ones.',partials:['Put a gift inside before tying its box shut.','Set out a mold before mixing material for it.'],entryFoils:['Choose wrapping that is large enough for the box.','Match a gift to the interests of its owner.']},
  {id:'consider-another-view',episodes:[
    'Ada hung the picture list above her own head. The younger children could not see what to collect. She crouched beside them, noticed the shelf in their way, and moved the list down where they could see it.',
    'Jin explained the model while holding its opening toward himself. His partner could not see the part he named. Jin moved around to his partner’s side and turned the model. The opening was now visible to both of them.'
  ],lesson:'Check what another person can actually see.',partials:['Put a picture list where younger children can see.','Turn a model opening toward the person watching.'],entryFoils:['Use sturdy paper for a list that stays up.','Choose clear pictures of the objects to collect.']},
  {id:'gather-first',episodes:[
    'Alma poured paint onto a mixing plate and then went to find a brush and water. The paint dried while she searched. Before her next painting she put the brush, water and plate together, then poured the paint.',
    'Sam started building the puppet stage before checking its fasteners. He held two walls up for a long time while a friend searched for clips. Next time he collected the clips and walls together before joining the stage.'
  ],lesson:'Gather the needed materials before beginning the job.',partials:['Set out painting tools before pouring the paint.','Collect the clips before holding stage walls together.'],entryFoils:['Choose paint colors that show against the background.','Keep a finished painting safe from dusty shelves.']},
  {id:'respect-capacity',episodes:[
    'Luca piled beans above the rim of a small tray. They spilled whenever he moved it. He divided them between two trays, leaving space below each rim. He carried both trays without losing beans.',
    'Esme stuffed every costume into one small bag. The zipper could not close. She moved some costumes into a second bag. Both bags closed, and the costumes stayed inside on the walk to the hall.'
  ],lesson:'Use enough containers for the amount you have.',partials:['Divide loose beans between trays before carrying them.','Split costumes between bags that can close properly.'],entryFoils:['Sort the beans by size before comparing them.','Keep a note of who has borrowed each tray.']},
  {id:'protect-from-conditions',episodes:[
    'Ravi spread his loose map pages on an outdoor bench. A gust blew two pages across the yard. He moved behind a closed window and spread them on an indoor table. The pages stayed where he put them.',
    'Mila left her paper shop signs outside when rain began. The words ran down the paper. She made new signs and put them beneath the stall’s clear roof. Rain fell around the stall, but the signs stayed dry.'
  ],lesson:'Protect work from the conditions that could damage it.',partials:['Keep loose map pages sheltered from the wind.','Keep paper shop signs sheltered from the rain.'],entryFoils:['Check that the pages show the whole walking route.','Choose a map large enough for the group to share.']},
  {id:'make-a-visible-guide',episodes:[
    'Olive described a complicated block pattern while her friend tried to remember every part. The copied pattern was different. Olive drew a small plan with each block’s place. Her friend used it to rebuild the pattern.',
    'Dev called out the drum rhythm once and expected the group to remember it. They stopped at different places. He drew a row of beat marks and pointed along them. The group could follow the same rhythm.'
  ],lesson:'A visible guide can support a complicated explanation.',partials:['Draw block positions when describing a complicated pattern.','Show beat marks when teaching a remembered drum rhythm.'],entryFoils:['Check that a block base is firm and level.','Give each builder a share of the available blocks.']},
  {id:'tell-people-a-change',episodes:[
    'Asha moved the meeting blanket from the tree to the porch when rain began. Her friend kept waiting under the tree. Asha went back and explained the change. Her friend brought his bag to the dry porch.',
    'Max changed the class shop’s opening time on his own note. The helpers arrived at the old time. Before changing it again, he spoke to each helper and changed the shared sign. They arrived together.'
  ],lesson:'Tell affected people when a plan changes.',partials:['Tell a waiting friend when the meeting place moves.','Tell every helper when the shop opening time changes.'],entryFoils:['Choose a blanket large enough for the visitors.','Take a bag that keeps picnic food together.']},
  {id:'compare-with-the-original',episodes:[
    'Suri copied a striped flag and thought it was finished. When she held it beside the original, she noticed a missing white stripe. She added it, then compared the two flags once more.',
    'Dan rebuilt a small bridge from a drawing and began putting the drawing away. He looked back at it and noticed a support he had left out. He added that support before trying the bridge.'
  ],lesson:'Compare finished work with its guide before moving on.',partials:['Compare a copied flag with all its original stripes.','Check every bridge support against the supplied drawing.'],entryFoils:['Choose fabric that will move freely in the wind.','Use a straight pole to display the finished flag.']},
  {id:'keep-working-parts-free',episodes:[
    'Imani wrapped bright paper around every part of her toy cart. The paper jammed between a wheel and the frame. She cut the paper away from the moving wheel. The cart rolled again.',
    'Felix tied a large bow across the mouth of his cardboard trumpet. Almost no sound came out. He moved the bow onto the side, leaving the opening clear. He could hear the trumpet again.'
  ],lesson:'Decoration should leave the useful parts able to work.',partials:['Keep wrapping paper away from a cart’s moving wheels.','Keep a trumpet opening clear of a decorative bow.'],entryFoils:['Choose colors that make a toy cart easy to find.','Give the cart a handle that is comfortable to hold.']},
  {id:'search-in-order',episodes:[
    'Tariq kept searching the same three drawers for a missing stamp. He could not remember which ones he had checked. He placed an empty card beside each searched drawer and moved to the next one. He found the stamp in a new drawer.',
    'Mei looked for a book by jumping between several shelves. She kept returning to shelves she had already searched. She began at one end and checked each shelf in turn. On the next shelf she found the book.'
  ],lesson:'Search in an order that avoids checking places repeatedly.',partials:['Mark drawers that have already been searched for a stamp.','Check bookshelves one at a time from one end.'],entryFoils:['Store stamps where damp air cannot reach them.','Keep a list of people who borrow the stamp set.']},
  {id:'use-the-same-reference',episodes:[
    'Poppy compared two paper strips by holding one higher than the other. She chose the wrong longer strip. She laid them flat with their left ends together. Now she could see which strip reached farther.',
    'Yusuf counted how long two toy cars rolled, but started counting at different moments. His numbers did not compare the full journeys. He rolled them again and began counting at the start line each time.'
  ],lesson:'Use the same starting reference when comparing results.',partials:['Line up strip ends before comparing their lengths.','Start timing each toy car at its start line.'],entryFoils:['Choose scissors that can cut the paper strips cleanly.','Keep cut paper strips together until the craft begins.']},
  {id:'ask-about-the-need',episodes:[
    'Grace made a tiny book pocket for her partner without asking which book it would hold. The book was too wide. She asked to see the book and made a wider pocket that held it.',
    'Dani set out a high stool for the visiting drummer without asking what she needed. The drummer’s feet could not reach her pedal. Dani asked about the drum, then brought a low seat. The drummer could use the pedal.'
  ],lesson:'Find out what someone needs before making a choice.',partials:['Check the partner’s book before making its pocket.','Ask which seat lets a drummer reach the pedal.'],entryFoils:['Choose strong paper for a pocket that holds books.','Write the owner’s name clearly on the book pocket.']},
  {id:'enough-not-most',episodes:[
    'Quinn covered the whole card with a thick puddle of glue. It soaked through and wrinkled the paper. On the next card she used a thin line only where the pieces joined. The card stayed flat.',
    'Hana kept adding soap to the wash bowl after the water was already bubbly. Foam spilled over the edge. For the next bowl she added a small amount and stopped when it was enough to wash the tools.'
  ],lesson:'Use the amount needed instead of adding the most.',partials:['Use a thin glue line where the card pieces join.','Stop adding soap when there is enough for washing.'],entryFoils:['Choose card colors that stand out against the wall.','Keep loose card pieces in a labelled storage tray.']},
  {id:'check-each-part',episodes:[
    'Ellis checked one wheel on the model bus and said the bus was ready. A different wheel stuck when he pushed it. He turned every wheel by hand, freed the stuck one, and tried the bus again.',
    'Anya pulled one handle on a carrying box to check it. When she lifted both handles, the unchecked handle came loose. After repairing it, she tested each handle separately before carrying the box.'
  ],lesson:'One successful check does not check every part.',partials:['Check every model bus wheel before calling it ready.','Test each carrying handle before lifting the box.'],entryFoils:['Choose a bus color that passengers can recognize.','Leave enough space inside a bus for its seats.']},
  {id:'keep-a-way-back',episodes:[
    'Omar cut up his only pattern while trying a new shape. When the new shape failed, he could not return to the first pattern. For his next trial he traced a spare copy and cut that copy instead.',
    'Cleo changed the only written plan for her puppet scene and later forgot the earlier ending. Before her next change, she copied the plan onto another sheet. She could compare both endings and choose one.'
  ],lesson:'Keep an earlier version when trying an uncertain change.',partials:['Cut a spare pattern copy when testing a new shape.','Save a scene plan before changing its written ending.'],entryFoils:['Choose scissors suited to the thickness of the paper.','Write a pattern title that describes its finished shape.']},
  {id:'choose-by-the-job',episodes:[
    'Bela chose shiny thin paper for the base of her model because it looked special. The base bent under the model. She tried a plain stiff sheet, which held the model level, and used that sheet for the base.',
    'Kofi chose a beautiful basket with very wide gaps to carry small counters. Counters fell through. He tried a plain tub with solid sides. The counters stayed inside, so he carried them in the tub.'
  ],lesson:'Choose by the job a thing must do, not its looks.',partials:['Choose a model base stiff enough to support its load.','Choose a counter container without gaps they can fall through.'],entryFoils:['Choose colors that make the model’s shape easy to see.','Measure the model before deciding where to display it.']},
];

const ENTRY_REPAIR_EVIDENCE={
  'small-trial':'The flag paint cracked because it had not been tried on spare paper; separating colors or making flags visible would not test that paint.',
  'check-the-request':'The parcel reached the wrong door because the direction was unclear; box size and keeping a path clear would not identify the intended door.',
  'wait-for-the-change':'The wet glued joint slid apart because Finn lifted it too soon; handle size and planning the contents would not make that joint firm.',
  'manageable-parts':'Eli lost his place in a long pattern and succeeded after practicing its short parts; choosing an instrument or sharing leadership was not the difficulty.',
  'choose-fitting-tools':'The wide cup could not direct beads into the narrow neck; sorting or counting beads would not change that opening.',
  'leave-working-space':'The seedlings pressed against one another because they were crowded; labels and counting would not leave room between the leaves.',
  'keep-a-record':'Jo forgot the score after a break and used written marks to retain it; team size and practice time would not preserve the score.',
  'complete-information':'The note left out the day, causing an arrival on the wrong morning; an envelope or larger picnic site would not supply the missing day.',
  'mark-before-removing':'Ren could not restore the shelves to their places and solved this with matching marks; choosing cupboard contents or moving cloths would not record the arrangement.',
  'fix-the-cause':'The same puddle returned because the tray was cracked; plant size and dividing watering jobs would not repair the leak.',
  'change-a-failed-method':'Pushing bent the puzzle piece, while turning it revealed the fit; sorting colors or sharing pieces would not change the failing method.',
  'check-identity':'A similar appearance led Amir to take another coat; drying coats or lowering hooks would not identify the owner.',
  'prepare-the-earlier-step':'The empty box had been tied before the gift was inside, so the ribbon had to be undone; wrapping size and gift choice would not correct that order.',
  'consider-another-view':'The younger children could not see past the shelf; strong paper and clear pictures would not move the list into their view.',
  'gather-first':'The paint dried while Alma searched for tools; color contrast and protecting a finished picture would not have put the tools ready beforehand.',
  'respect-capacity':'Beans spilled because the small tray was overfilled; sorting beans and recording tray loans would not provide more space.',
  'protect-from-conditions':'The wind scattered loose pages, and moving indoors sheltered them; map size and route coverage would not stop the gust.',
  'make-a-visible-guide':'The spoken block description was hard to retain and a drawn plan supplied a continuing reference; stability and fair shares were not the copying problem.',
  'tell-people-a-change':'The friend waited at the old place because the move had not been explained; blanket size and carrying food would not tell the friend where to go.',
  'compare-with-the-original':'Comparison revealed a missing stripe after Suri thought she had finished; fabric movement and the display pole would not reveal that omission.',
  'keep-working-parts-free':'Wrapping jammed a moving wheel; attractive colors and a comfortable handle would not clear the wheel.',
  'search-in-order':'Tariq repeated searches because he had not tracked the checked drawers; dry storage and a borrower list would not organize this search.',
  'use-the-same-reference':'Holding the strips at different starting positions gave a misleading comparison; cutting tools and storage would not align their ends.',
  'ask-about-the-need':'The pocket was too narrow for the actual book; strong paper and an owner name would not establish the required size.',
  'enough-not-most':'Excess glue soaked and wrinkled the card; the card colors and the storage tray would not reduce that excess.',
  'check-each-part':'An unchecked wheel stuck after one different wheel had passed a check; bus color and seat space would not test the other wheels.',
  'keep-a-way-back':'Cutting the only pattern removed the earlier version; suitable scissors and a title would not preserve an uncut copy.',
  'choose-by-the-job':'The attractive thin base bent under the load; visible colors and display measurements would not make that base stiff enough.',
};

function audio(role,text,choiceId){
  return {role,text,path:(role==='choice'?getLedaWordAudioPath(text):'')||getLedaInstructionAudioPath(text)||null,
    required:true,...(choiceId?{choiceId,value:text}:{})};
}

export function buildLiteracyMockBoundaryComprehensionV9(){
  const result=[];
  for(const row of LITERACY_MOCK_V9_BOUNDARY_THEME_ROWS)for(const band of [5,6])for(const domainId of ['reading','listening']){
    const listening=domainId==='listening',passage=(band===5?row.episodes.slice(0,1):row.episodes).join(' ');
    const labels=[row.lesson,...(band===5?row.entryFoils:row.partials)];
    const choices=labels.map((label,index)=>({id:`c${index}`,label}));
    const prompt='What lesson best fits the whole story?',claim='lesson_mistake_fixed';
    const id=`mock.v9.boundary-comprehension.${domainId}.${row.id}.b${band}`,family=`v9-boundary-comprehension:${row.id}`;
    const requiredAudioCues=[audio('instruction',prompt)];
    if(listening)requiredAudioCues.push(audio('passage',passage),...choices.map(choice=>audio('choice',choice.label,choice.id)));
    const rationales=band===5?row.entryFoils.map(foil=>`“${foil}” does not explain this correction. ${ENTRY_REPAIR_EVIDENCE[row.id]}`)
      :row.partials.map((foil,index)=>`“${foil}” explains episode ${index+1}, but episode ${2-index} instead concerns this different action: ${row.partials[1-index]} The choice leaves that episode unexplained.`);
    result.push({id,sourceItemId:id,canonicalItemId:`mock.v9.boundary-comprehension.${row.id}.b${band}`,contentVersion:'literacy-mock-v9',
      domainId,skillId:listening?'listen_theme':'theme',level:band===5?1:2,format:'choice',answerMode:'exact',
      sourceFormat:'ORIGINAL_BOUNDARY_COMPREHENSION_V9',constructClaim:listening?`listening_${claim}`:claim,
      prompt,passage,choices,answer:'c0',targetWord:'',renderTargetText:false,hideWrittenLabels:false,
      modality:domainId,evidenceModality:listening?'audio':'text',displayPassageDuringResponse:!listening,
      image:'',imageAlt:'',requiredImagePaths:[],tutorialOnly:false,
      stimulusKey:passage.normalize('NFKC').toLowerCase(),canonicalPassageId:passage,exposureFamilyId:family,
      requiredAudioCues,requiredAudioPaths:[...new Set(requiredAudioCues.map(cue=>cue.path).filter(Boolean))],
      mediaReady:requiredAudioCues.every(cue=>Boolean(cue.path)),
      missingAudioCues:requiredAudioCues.filter(cue=>!cue.path).map(({role,text,choiceId})=>({role,text,...(choiceId?{choiceId}:{})})),
      taskDemand:{reviewed:true,operation:claim,features:{episodesToIntegrate:band===5?1:2,...(band===6?{plausiblePartialLessons:2}:{})},
        choiceCount:3,passageWordCount:passage.split(/\s+/).length,
        proof:{key:`${row.lesson} It explains the mistake-to-repair change${band===6?' in both episodes':''}.`,
          evidence:band===5?row.episodes.slice(0,1):[...row.episodes],
          ...(band===6?{partialLessons:[...row.partials],foils:rationales}:{}),
          mistakeRepairPairs:(band===5?row.episodes.slice(0,1):row.episodes).map((episode,index)=>({episode:index+1,evidence:episode}))}},
      difficultyEvidence:band===5?'Infer an unstated lesson from a mistaken action and its effective correction.'
        :'Infer one lesson across two different mistakes and repairs while rejecting two true lessons covering one episode each.',
      explanation:band===5?`${row.lesson} The changed action resolves the problem in this episode.`
        :`${row.lesson} Each other choice explains one episode, while this lesson explains both.`,
      distractorRationales:{c1:rationales[0],c2:rationales[1]},
      sourceProvenance:{kind:'original_literacy_guide_boundary_comprehension',file:FILE,sourceId:id,pairedFamily:family,
        originalAuthorship:'Original episode pairs and response contrasts; no NWEA questions or illustrations reused.'},
      mediaDecision:{role:listening?'audio-only':'text-only',paths:[],constructReview:'approved',answerNeutral:'approved',
        reason:listening?'The exact passage and each choice are recorded. No printed passage substitutes for listening.'
          :'The complete printed passage supplies the evidence. Only the question is narrated; passage and choices remain independent reading.'}});
  }
  return result;
}

export function listLiteracyMockBoundaryComprehensionV9AudioGaps(){
  const gaps=new Map();
  for(const q of buildLiteracyMockBoundaryComprehensionV9())for(const cue of q.requiredAudioCues)if(!cue.path){
    const role=cue.role==='instruction'?'assessment_prompt':cue.role==='passage'?'assessment_passage':'isolated_word';
    const key=`${role}:${cue.text}`,record=gaps.get(key)||{role,text:cue.text,itemIds:[]};
    record.itemIds.push(q.id);gaps.set(key,record);
  }
  return [...gaps.values()];
}
