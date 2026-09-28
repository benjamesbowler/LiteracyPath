import { author, key as K, wrong as W } from "./builders.mjs";
// Visually reviewed existing scenes, new inverse relationships. These are
// additional relational questions, not additional artwork or retention scenes.
const rows=[
 ["above",1,"fish-below-boat","A boat and an orange fish.","Where is the boat compared with the fish?",["above the fish","below the fish","inside the fish","behind the fish"]],
 ["below",1,"clock-above-picture","A red clock and a framed picture.","Where is the picture compared with the clock?",["below the clock","above the clock","inside the clock","behind the clock"]],
 ["behind",1,"dog-in-front-of-house","A brown dog and a house.","Where is the house compared with the dog?",["behind the dog","in front of the dog","under the dog","inside the dog"]],
 ["in_front_of",1,"cat-behind-sofa","A cat and a blue sofa.","Where is the sofa compared with the cat?",["in front of the cat","behind the cat","above the cat","inside the cat"]],
 ["under",1,"bridge-over-stream","A wooden bridge and a stream.","Where does the stream flow?",["under the bridge","on the bridge","above the bridge","inside the bridge"]],
 ["below",1,"light-above-table","A hanging light and a table.","Where is the table compared with the light?",["below the light","above the light","inside the light","behind the light"]],
 ["inside_outside",2,"fence_around_garden","Flowers, soil and a wooden fence.","Which phrase fits? The flowers grow ___.",["inside the fence","outside the fence","above the fence","on top of the fence"]],
 ["around",2,"deer_among_trees","A deer and several trees.","Which phrase fits? The trees stand ___.",["around the deer","inside the deer","under the deer","on top of the deer"]]
];
export default author("prepositions_of_place",rows.map(([u,lvl,img,imgAlt,prompt,answers])=>({
 u,lvl,fmt:lvl===1?"PREPOSITION_SCENE_CHOICE":"PREPOSITION_PRECISION",prompt,spoken:prompt,
 choices:answers.map((t,i)=>i?W(t,"D-FUNCTION-SWAP"):K(t)),img,imgAlt,target:img,suppressStimulusAudio:true,
 media:"image-required",evidenceModality:"image+text",constructClaim:"inverse_spatial_relation",
 note:"The referenced object changes from the existing question: identify the inverse relationship in the inspected scene. This shared image is not counted as a new scene or independent retention evidence."
})));
