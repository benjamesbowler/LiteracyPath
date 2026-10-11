const rows=[];
const add=(templateId,id,passage,labels,explanation,foilReasons)=>rows.push({templateId,id,passage,labels,
  prompt:'What lesson does this story teach?',explanation,foilReasons,paired:true,
  demand:'Infer a general lesson connecting choices and outcomes, rather than repeat a plot detail or endorse a contradicted rule.',
  sourceFile:'src/data/literacyMockComprehensionCapacityThemes.js'});
const mistake=(...args)=>add('mock.depth.theme.estimate',...args);
mistake('wrong-date-poster',
  'Jay made a bright poster for a school fair but copied the date incorrectly. Several families asked about the wrong day. Jay corrected the posters and apologized. For the next event, he asked a partner to check every important fact before making copies, and the notices were accurate.',
  ['A mistake can show you what to check next time.','An attractive poster never needs its facts checked.','Asking for help means you should stop making posters.'],
  'Jay learns a checking routine from the date error and uses it successfully.',
  ['The bright design did not prevent the incorrect information.','Help improves Jay’s work instead of ending it.']);
mistake('overfilled-pot',
  'Mika filled a plant pot right to the rim with soil. When she watered it, muddy water spilled over the edge. She removed some soil and left room for the water to soak in. When potting another plant, she remembered to leave the same useful space at the top.',
  ['Use what goes wrong to improve your method.','A pot works best when no water can enter it.','Spilled soil means a plant can never grow.'],
  'She changes her method after seeing why the first attempt spilled.',
  ['The plant still needs water, with space for it to soak in.','The problem is corrected rather than treated as permanent failure.']);
mistake('map-facing',
  'Ari followed a trail map while holding it upside down and took a wrong turn. At a signpost, he matched the map’s north arrow with the path directions. He found his way back. On later walks, he checked how the map was facing before choosing a trail.',
  ['Understanding an error can help prevent it happening again.','Maps should be ignored after one wrong turn.','The shortest trail is always the correct one.'],
  'Ari identifies the orientation error and adopts a useful check.',
  ['He learns to use the map correctly rather than abandon it.','The story concerns orientation, not choosing by distance.']);
mistake('thread-knot',
  'Leena’s first few stitches slipped out because she had not secured the thread. She asked her aunt to show her how to begin with a knot. Leena unpicked the loose section and sewed it again. Before starting her next piece, she checked the thread was secure.',
  ['Learning from an early problem can strengthen later work.','Loose stitches always make a finished piece stronger.','Someone else must finish every job that goes wrong.'],
  'Leena learns a preparation step and then completes the repair herself.',
  ['The loose stitches fail and have to be redone.','Her aunt teaches the step, but Leena does the work.']);
mistake('seed-labels',
  'Omar planted several kinds of seeds without labels. Later he could not remember which tiny shoots were which. He compared them with pictures and sorted out the names with his teacher. The next time he planted seeds, he wrote and placed labels before covering the pots.',
  ['A problem can teach you to organize information earlier.','All plants look the same when they have grown.','Labels should be added only after names are forgotten.'],
  'The forgotten names lead Omar to label at the start of future planting.',
  ['Comparing pictures helps identify differences between the plants.','He deliberately labels earlier to avoid repeating the problem.']);
mistake('mixed-paint-record',
  'Priya mixed a green she loved but forgot how she had made it. When the paint ran out, she could not match the colour easily. She tested small amounts and wrote down the mixture that worked. Later she used her notes to make the same green again.',
  ['Recording a useful method can help you repeat it.','Guessing every mixture is quicker than keeping notes.','A colour can be made only once and never again.'],
  'The notes solve the difficulty of reproducing the mixture.',
  ['Guessing created a long search when the colour ran out.','She successfully makes the same green again using her record.']);
mistake('rushed-model-steps',
  'Ben began a model before reading all the instructions. He glued two parts together that were meant to move. He carefully separated them and studied the diagram. When he restarted, he checked each step first. The finished model’s wheels turned freely.',
  ['Taking time to understand directions can prevent repeated mistakes.','Finishing quickly matters more than moving parts working.','Instructions are useful only after a model is finished.'],
  'Checking directions before each step leads to a working model.',
  ['Rushing causes the problem rather than the successful outcome.','He checks directions during the work, before completion.']);
mistake('wrong-size-box',
  'Nora decorated a box for her brother’s long model train. At the end she discovered the train would not fit. She made a longer box and measured before decorating it. When asked to wrap a different gift later, she checked its size before choosing the wrapping.',
  ['Check a task’s needs before spending time on finishing touches.','Decorations can make any small box hold a large gift.','Every gift needs exactly the same size of box.'],
  'Nora learns to check fit before doing decorative work.',
  ['Decoration cannot solve the size problem in the story.','She checks the new gift rather than assuming the same size.']);

const kindness=(...args)=>add('mock.depth.theme.welcome',...args);
kindness('new-neighbour-bags',
  'Pia saw her new neighbour struggling with several bags and held the door for him. She did not expect anything back. Days later, Pia’s wheelbarrow tipped in the garden. The neighbour came over to help collect the soil. They began stopping to help each other with small jobs.',
  ['Small acts of help can begin a caring friendship.','You should agree on a reward before helping someone.','Only neighbours with the same tools can help each other.'],
  'An unrequested act of kindness grows into mutual help.',
  ['Pia helps without expecting a reward.','They help with different jobs; matching tools is not the lesson.']);
kindness('library-seat',
  'At story time, Finn noticed a younger child could not see past the crowd. He moved aside and shared his front space. The next week, Finn arrived carrying a heavy craft box. The same child hurried to hold the door, smiling when he recognized Finn.',
  ['Kindness can encourage kindness on another occasion.','Good deeds must be repaid with an identical good deed.','The best seat belongs only to the earliest visitor.'],
  'The later offer of different help follows Finn’s thoughtful action.',
  ['Sharing space and holding a door are different acts.','Finn willingly shares the good view.']);
kindness('winter-mittens',
  'Mae lent spare mittens to a classmate whose hands were cold. When Mae later broke her arm, the classmate offered to carry her books without being asked. Mae realized that the care she had shown was now coming back in a different way.',
  ['Caring for others can lead them to care for you.','People should help only when asked by an adult.','Borrowing mittens means you must lend mittens in return.'],
  'The classmate responds to earlier kindness with a different useful action.',
  ['The classmate offers help without a request.','The returned kindness concerns books, not another pair of mittens.']);
kindness('market-stall-help',
  'When wind scattered a stallholder’s paper bags, Arun stopped to gather them. He was only passing through the market. Weeks later, Arun lost a small parcel there. The stallholder recognized him, helped search and found it under a bench. Arun thanked her for taking the time.',
  ['Helping someone can build goodwill that lasts.','Helping is worthwhile only if a reward comes immediately.','A person who loses something should search entirely alone.'],
  'The stallholder remembers his help and later helps him in return.',
  ['The return help comes weeks later and was not bargained for.','The story shows the value of another person joining the search.']);
kindness('patient-partner',
  'Lila patiently explained a new board game to Tomas instead of leaving him out. On a later art day, Lila struggled with folding a tricky paper shape. Tomas sat beside her and showed her the steps slowly, just as she had done with the game.',
  ['Patient help can encourage others to offer patient help.','The best learner should always work without a partner.','Teaching a game makes someone an expert at every craft.'],
  'Tomas returns the same thoughtful approach in a different activity.',
  ['Both children benefit from a partner’s explanation.','The story shows different strengths, not expertise in every activity.']);
kindness('garden-water-share',
  'During a dry week, Bea offered water from her full tank to a neighbour with thirsty plants. Later, when Bea was away, the neighbour checked Bea’s garden each day and watered the new seedlings. Bea returned to healthy plants and a note welcoming her home.',
  ['Sharing help can create a relationship of mutual care.','Water should be shared only after someone pays for it.','Neighbours should look after only plants they own.'],
  'Each neighbour gives care when the other needs it.',
  ['No payment is requested or given.','Both care for plants beyond their own garden.']);
kindness('spare-pencil',
  'Noah noticed that a new classmate had no pencil, so he quietly offered a spare. A month later, Noah missed several lessons. The classmate made clear notes about the shared project and saved them for him. Noah found it much easier to join in when he returned.',
  ['A thoughtful action can inspire later thoughtfulness.','A borrowed pencil must be returned as a pile of notes.','Classmates should keep project information to themselves.'],
  'The useful notes are a later act of consideration, not a literal exchange.',
  ['The notes are a different kindness, not a required way to repay the pencil.','Sharing information helps Noah rejoin the group.']);
kindness('broken-cart',
  'An older gardener’s cart lost a wheel near the gate. Ella called for help and stayed to collect the fallen tools. Later, the gardener saw Ella puzzling over a bare flowerbed. He offered spare seedlings and advice, remembering how willingly she had helped him.',
  ['Freely given help can lead to generosity in return.','People should help only with problems they can fix alone.','Good neighbours always exchange exactly the same objects.'],
  'The gardener remembers Ella’s help and responds generously in another situation.',
  ['Ella calls for help rather than repairing the cart alone.','Tools, seedlings and advice are different forms of help.']);

const effort=(...args)=>add('mock.depth.theme.skate',...args);
effort('drum-rhythm',
  'At first, Dev lost his place whenever the drum pattern changed. He practised one short section each day and gradually joined the sections. After several weeks, he could keep the beat while the group sang. He still practised the parts that sometimes confused him.',
  ['Steady, focused practice can build a difficult skill.','One successful performance means practice is never needed again.','Difficult parts should be skipped so practice feels easy.'],
  'Short repeated practice and attention to difficult sections produce progress.',
  ['Dev continues to practise after success.','He works on confusing parts rather than skipping them.']);
effort('reading-garden-signs',
  'Hana wanted to read the plant signs in her grandparents’ garden. Each visit, they helped her learn a few unfamiliar words. She looked for the same words in books and on seed packets. Later she could read a new planting sign and explain it to her younger brother.',
  ['Regular practice in different places can help learning transfer.','Learning one sign means you can read every word immediately.','It is better to avoid words you do not already know.'],
  'Practice over visits and in several settings prepares Hana for a new sign.',
  ['Her progress takes repeated learning, not one instant success.','She actively learns unfamiliar words.']);
effort('patient-saving',
  'Omar wanted a simple telescope. Instead of spending every small amount he received, he put some into a labelled tin each week. The amount grew slowly. Months later, he counted enough to buy the telescope and felt pleased that he had kept to his plan.',
  ['Small, steady efforts can help you reach a larger goal.','A goal is worthwhile only if you reach it on the first day.','Keeping a plan means never checking your progress.'],
  'Regular small savings eventually meet the larger goal.',
  ['The goal takes months, and he remains pleased with it.','He counts the money to check when he has enough.']);
effort('long-jigsaw',
  'Mina’s large jigsaw seemed impossible on the first evening. She sorted the pieces by edges and colours and worked on a little section after school. Some sections took many attempts. Over two weeks the empty spaces shrank, until she placed the final piece and saw the complete picture.',
  ['A large challenge can be completed through patient smaller steps.','If a puzzle is difficult at first, it cannot be finished.','Every piece should fit on the first attempt.'],
  'Sorting and steady work on sections lead to completion despite difficulty.',
  ['The initially difficult puzzle is eventually completed.','Some sections explicitly require many attempts.']);
effort('young-dog-trust',
  'A shy dog hid when Joel visited the shelter. Joel followed the keeper’s advice, sitting quietly and letting the dog choose when to approach. He returned regularly and stayed calm each time. Gradually the dog came closer, and one day it rested beside him without hiding.',
  ['Patient, consistent care can build trust over time.','Trust grows faster when you force someone to come closer.','A shy animal will never become comfortable with anyone.'],
  'Joel’s calm repeated visits allow the dog’s confidence to grow.',
  ['He lets the dog choose its distance rather than forcing contact.','The dog eventually rests beside him.']);
effort('rough-path-cleanup',
  'A neglected path was covered in litter. One morning’s cleanup barely changed it. The neighbours planned short weekly sessions, sorting rubbish and arranging collection. After many weeks, the path was clear enough for families to use again. They continued checking it so rubbish would not pile up.',
  ['Shared, repeated effort can make a lasting improvement.','If one session changes little, further work is useless.','Once a place is clean, it never needs attention again.'],
  'Regular work and ongoing care succeed where one brief effort was not enough.',
  ['Further sessions produce the visible improvement.','The neighbours continue checking the path.']);
effort('clear-handwriting',
  'Safa found that others could not read the labels she wrote. She practised a few letter shapes slowly each day, paying attention to spaces. Her first changes were small. By the time the class made an exhibition, visitors could read her labels without asking her to explain them.',
  ['Careful practice can make gradual improvement useful to others.','Working quickly is always more helpful than working clearly.','Small improvements do not matter unless they happen immediately.'],
  'Slow attention to shapes and spaces eventually produces readable labels.',
  ['Slowing down, rather than rushing, helps her improve.','Small gradual changes lead to the final useful result.']);
effort('balance-beam',
  'Ravi stepped off the low balance beam many times. With the instructor nearby, he practised looking ahead and moving slowly. He returned to the safe low beam at each lesson. Eventually he could cross its length without stepping off and was ready to try the next challenge.',
  ['Using a helpful strategy repeatedly can lead to progress.','Repeated difficulty proves you should never try a skill again.','The safest way to improve is to begin on the highest beam.'],
  'He combines safe practice with a specific strategy and improves over time.',
  ['He improves after repeated difficulty.','He begins on a low beam with support nearby.']);

export const comprehensionCapacityThemes=rows;
