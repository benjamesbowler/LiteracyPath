// Presentation and motor design only. Exact stimuli and accepted answers remain
// owned by campaignChallenges; neither the area type nor scenery knows the key.
export const ACTIVITY_AREAS=Object.freeze({
 'sound-steps':{name:'Echo Stepping Stones',verb:'Listen and jump',prop:'grass-platform',setting:'grove',view:'side'},
 'word-pop':{name:'The Word Orchard',verb:'Aim and release',prop:'basket',setting:'orchard',view:'side'},
 'rescue-bridge':{name:'Bridge Builders',verb:'Build and cross',prop:'bridge',setting:'water',view:'side'},
 'tree-rescue':{name:'Canopy Rescue',verb:'Climb and find',prop:'ladder',setting:'canopy',view:'side'},
 'pals-post':{name:'The Delivery Yard',verb:'Carry and deliver',prop:'crate',setting:'village',view:'side'},
 'sound-herd':{name:'The Sorting Meadow',verb:'Guide the Pals',prop:'hedge',setting:'meadow',view:'side'},
 'river-route':{name:'River Junctions',verb:'Choose a crossing',prop:'wheel',setting:'water',view:'side'},
 'sentence-express':{name:'Message Railway',verb:'Join the message',prop:'wood-platform',setting:'workshop',view:'side'},
 'fix-it-workshop':{name:'The Word Workshop',verb:'Repair the parts',prop:'workbench',setting:'workshop',view:'side'},
 'garden-kitchen':{name:'The Garden Kitchen',verb:'Follow and place',prop:'basket',setting:'garden',view:'side'},
 'lantern-search':{name:'Lantern Labyrinth',verb:'Read, explore, discover',prop:'lantern',setting:'maze',view:'depth'},
 'story-rescue':{name:'The Story Trail',verb:'Follow the clues',prop:'chest',setting:'maze',view:'depth'}
});
export const activityAreaFor=family=>ACTIVITY_AREAS[family]||ACTIVITY_AREAS['sound-steps'];
export const usesMazeArea=beat=>['lantern-search','story-rescue'].includes(beat?.familyId)&&beat?.mechanic==='story_bridge'&&!beat.view?.phase?.includes('pickup');
