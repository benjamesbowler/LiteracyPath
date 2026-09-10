// Explicit spoken messages for supported reconstruction. These are not
// independent decoding or grammar evidence; target audio models the sentence.
const MESSAGES={
 'meadow-08-3':[
  'Hungry opens the picnic basket.','Muddy places cups beside the plates.','Clucky brings three clean spoons.','Speedy carries the folded blanket.','Woolly puts apples in a bowl.','Bouncy waits beside the picnic table.',
  'Please share the red apples.','Keep the little cups together.','Pass a clean plate to Muddy.','Put the empty bowl inside the basket.','Fold the blanket after the picnic.','Leave the grass clean for everyone.'
 ],
 'meadow-10-4':[
  'Our friends will meet by the gate.','Bring your lantern to the farm.','Follow Speedy along the wooden fence.','The welcome sign points towards the barn.','Clucky saves a seat for Shy.','Muddy carries the last picnic basket.',
  'Please close the gate behind you.','Walk slowly beside the little chicks.','Help Woolly carry the wide blanket.','Put your cup beside your plate.','Thank the friends who made the path.','We can explore a new land together.'
 ],
 'dino-11-4':[
  'Sunny waits at the valley entrance.','Chompy finds a smooth stepping stone.','The green basket belongs to Fancy.','A short trail leads to the cave.','The welcome flag hangs above the gate.','Our friends follow the river into the valley.',
  'Leave the basket beside Sunny.','Carry the flag towards the stone arch.','Keep the narrow trail clear.','Show Chompy the shallow crossing.','Return the spare rope to Fancy.','Invite the waiting friends into the valley.'
 ],
 'dino-13-3':[
  'The first parcel goes to the cave.','The second parcel belongs to Fancy.','Chompy checks the label before leaving.','Sunny carries a basket along the ridge.','A wooden sign points towards the shelter.','The empty cart waits below the tree.',
  'First place the parcel in the cart.','Next follow the path around the rock.','Then stop beside the cave entrance.','Give the labelled parcel to Chompy.','Bring the empty cart back to Sunny.','Finally put the spare rope on the hook.'
 ],
 'dino-15-1':[
  'The lever rests beside the small rock.','A wooden beam blocks the narrow path.','Sunny checks the rope before pulling.','Chompy stands on the firm ground.','The loose plank belongs on the bridge.','Fancy carries a smooth wheel to the cart.',
  'Move the basket away from the lever.','Place the short beam under the plank.','Pull the rope towards the large tree.','Turn the wooden wheel very slowly.','Keep the open path clear for Chompy.','Return the tools when the bridge is ready.'
 ],
 'dino-16-4':[
  'The upper trail passes behind the tall tree.','The lower trail leads towards the stream.','A wide ledge gives everyone room to rest.','Sunny can see the shelter from here.','The small basket waits below the sign.','Chompy follows the footprints across the sand.',
  'Choose the wide trail beside the rocks.','Keep the heavy basket on the low shelf.','Help Fancy reach the sheltered ledge.','Follow the arrow towards the shaded path.','Wait for Sunny at the next resting place.','Take the gentle path back to the valley.'
 ],
 'dino-17-2':[
  'Fancy sorts the smooth stones into baskets.','Sunny finds a small shell beside the pool.','The longer rope reaches the wooden post.','Chompy carries the lighter basket first.','A narrow plank rests behind the sign.','The blue flag marks the sheltered route.',
  'Put the round stone beside the shell.','Carry the shorter rope to the low post.','Choose the wider basket for the leaves.','Leave the rough stones under the bench.','Bring the empty tray back to Fancy.','Check that every tool has a place.'
 ],
 'dino-18-3':[
  'Fancy writes a label for the wooden gate.','The spare signs lean against the wall.','Sunny brings a brush to the workshop.','Chompy holds the plank above the bench.','The paint pot stands beside the clean cloth.','A small arrow points towards the valley.',
  'Read the label before moving the sign.','Place the dry brush on the shelf.','Carry the finished sign to the gate.','Turn the arrow towards the safe path.','Keep the wet paint away from the cloth.','Return the spare planks to the workshop.'
 ],
 'dino-19-1':[
  'The little boat waits beside the landing.','A long rope joins the boat to the post.','Sunny checks the path around the lake.','Chompy sees a flag above the far bank.','The folded sail rests inside the shelter.','Fancy puts a basket near the wooden seat.',
  'Keep the rope beside the landing post.','Carry the folded sail to the boat.','Follow the flag towards the sheltered bank.','Put the dry basket on the high shelf.','Bring the empty boat back to the landing.','Leave room for the next group of friends.'
 ],
 'dino-20-2':[
  'The valley gathering begins beside the lake.','Sunny hangs a flag above the entrance.','Chompy brings cups for the waiting friends.','Fancy places the welcome basket on the table.','The wide path reaches the gathering place.','A small lantern shines beside the boat.',
  'Please leave the entrance clear.','Show the visitors where to put their baskets.','Carry the last tray to the long table.','Give the empty seat to a waiting friend.','Follow the lanterns back to the landing.','Thank everyone who helped repair the valley.'
 ],
 'moonwood-23-3':[
  'Wren follows the lanterns through the quiet grove.','Burrow carries a small basket under the branches.','The silver sign points towards the bridge.','Pip waits beside the mossy tree.','A warm light shines above the shelter.','The narrow trail passes behind the old stump.',
  'Bring the spare lantern to Wren.','Hang the little basket beside the shelter.','Follow Pip around the fallen branch.','Leave the bridge clear for Burrow.','Place the dry leaves inside the wooden tray.','Return along the trail with the silver sign.'
 ],
 'moonwood-25-4':[
  'The boat rests between the landing posts.','Wren holds the rope beside the wide pier.','Burrow finds a dry basket under the seat.','Pip watches the lantern on the far bank.','A low branch hangs above the quiet water.','The narrow channel passes beside the reeds.',
  'Guide the boat around the mossy island.','Keep the rope inside the boat.','Stop beside the pier with two lanterns.','Put the empty basket under the wooden seat.','Wait for Wren before leaving the landing.','Follow the sheltered channel back to Burrow.'
 ],
 'moonwood-27-4':[
  'Stone waits where the two paths meet.','The wide gate gives Stone room to pass.','Wren checks the low branch above the trail.','Burrow moves a basket away from the crossing.','Pip finds a gentle slope beside the stream.','The little sign points around the narrow arch.',
  'Guide Stone towards the wider gate.','Keep the gentle slope clear of baskets.','Move the hanging rope above the path.','Show Wren the resting place beside the stream.','Follow the broad trail around the old tree.','Leave enough room for every friend to join.'
 ],
 'moonwood-30-4':[
  'The lantern trail joins the three gathering paths.','Wren welcomes the friends beside the wide bridge.','Burrow brings a basket from the quiet grove.','Pip hangs the final lantern above the gate.','Stone rests beside the sheltered meeting place.','The repaired boat waits at the bright landing.',
  'Follow the lights towards the gathering.','Bring the spare cups to Burrow.','Leave the wide bridge clear for Stone.','Guide the last boat to the lantern pier.','Share the welcome basket with our new friends.','Remember the paths that we repaired together.'
 ]
};
const audio=[];
function clip(id,text){const path=`/audio/sound-seekers/campaign/${id}.mp3`;audio.push({id,text,audio:path});return path;}
export const CAMPAIGN_SENTENCE_TRANSFER_PACKS=Object.fromEntries(Object.entries(MESSAGES).map(([missionId,sentences])=>[missionId,sentences.map((sentence,i)=>{
 const id=`${missionId}-sentence-transfer-${i}`,text=`Build this message: ${sentence}`;
 return {id,text,audio:clip(id,text),sentence,construct:'sentence_order',objectId:'letter',options:[],correctId:null,actId:i<6?'retrieve':'apply',familyId:'sentence-express'};
})]));
// Context sentences identify WHEN without speaking the inflected answer.
const TENSE=[
 ['Yesterday','Burrow','walk','walked','walks','will walk'],['Every morning','Pip','help','helps','helped','will help'],['Tomorrow','Wren','paint','will paint','painted','paints'],
 ['Last night','Stone','rest','rested','rests','will rest'],['Every afternoon','Burrow','look','looks','looked','will look'],['Next week','Pip','jump','will jump','jumped','jumps'],
 ['Yesterday','Wren','wave','waved','waves','will wave'],['Every evening','Stone','wait','waits','waited','will wait'],['Tomorrow','Burrow','play','will play','played','plays'],
 ['Last week','Pip','climb','climbed','climbs','will climb'],['Every day','Wren','work','works','worked','will work'],['Next month','Stone','visit','will visit','visited','visits']
];
CAMPAIGN_SENTENCE_TRANSFER_PACKS['moonwood-29-3']=TENSE.map(([when,who,verb,form,...others],i)=>{
 const id=`moonwood-29-3-tense-transfer-${i}`,text=`Think about ${who} and the action ${verb}. Finish the message about ${when.toLowerCase()}.`;
 const options=[form,...others].map((label,n)=>({id:`form-${n}`,icon:'letter',label,audio:clip(`${id}-option-${n}`,label)}));
 return {id,text,audio:clip(id,text),prefix:`${when} ${who}`,form,options,construct:'grammar_tense',objectId:'letter',actId:i<6?'retrieve':'apply',familyId:'sentence-express'};
});
export const CAMPAIGN_SENTENCE_TRANSFER_AUDIO=audio;
