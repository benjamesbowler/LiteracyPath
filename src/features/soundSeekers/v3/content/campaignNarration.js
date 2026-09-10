// Fixed, source-owned spoken support. Playing a meeting line never gates input
// and never creates reading or listening attainment evidence.
import { CAMPAIGN_STAGES } from './campaign.js';
const ROOT = '/audio/sound-seekers/campaign';
const line = (id, text) => Object.freeze({ text, audio: `${ROOT}/${id}.mp3` });
export const CAMPAIGN_STAGE_NARRATION = Object.freeze(Object.fromEntries(
  CAMPAIGN_STAGES.map(stage => [stage.id, line(`stage-${stage.id}-problem`, stage.problem)])
));
export const CAMPAIGN_FAMILY_NARRATION = Object.freeze({
  'sound-steps': line('family-sound-steps-help', 'Listen. Jump onto the sound or word you hear.'),
  'word-pop': line('family-word-pop-help', 'Listen. Aim at the sound or word you hear.'),
  'rescue-bridge': line('family-rescue-bridge-help', 'Listen to the word. Build it with the planks.'),
  'tree-rescue': line('family-tree-rescue-help', 'Choose the right word. Climb up to help your friend.'),
  'pals-post': line('family-pals-post-help', 'Listen to the message. Take the parcel to the right place.'),
  'sound-herd': line('family-sound-herd-help', 'Listen. Help each word find its sound group.'),
  'river-route': line('family-river-route-help', 'Listen to the directions. Choose a safe way through.'),
  'sentence-express': line('family-sentence-express-help', 'Put the words together to make the message.'),
  'fix-it-workshop': line('family-fix-it-workshop-help', 'Listen. Change the letters to fix the word.'),
  'garden-kitchen': line('family-garden-kitchen-help', 'Listen. Pick it up and put it in the right place.'),
  'lantern-search': line('family-lantern-search-help', 'Listen to the clue. Find what it describes.'),
  'story-rescue': line('family-story-rescue-help', 'Listen to the message. Help your friend finish the plan.')
});
export const CAMPAIGN_MISSION_NARRATION = Object.freeze({
  'meadow-01-1': line('mission-meadow-01-1-goal', 'Muddy needs a bucket. Follow the sounds to find it.'),
  'meadow-01-2': line('mission-meadow-01-2-goal', 'The soap is on the shelf. Use bubbles to get it.'),
  'meadow-01-3': line('mission-meadow-01-3-goal', 'Muddy needs a mat. Build words to fix the bridges.'),
  'meadow-01-4': line('mission-meadow-01-4-goal', "Let's get the bath ready. Put each thing in its place."),
  'meadow-01-5': line('mission-meadow-01-5-goal', 'Bring the bath things home. Help Muddy get ready.'),
  'meadow-01-side-1': line('mission-meadow-01-side-1-goal', 'Tiny lost a button. Listen and find the little one.'),
  'meadow-01-side-2': line('mission-meadow-01-side-2-goal', 'Shy needs a cushion. Listen and take it to the right seat.')
});
export const CAMPAIGN_NARRATION_AUDIO = Object.freeze([
  ...Object.entries(CAMPAIGN_STAGE_NARRATION).map(([ownerId, cue]) => ({ id: `stage-${ownerId}-problem`, ownerId, kind: 'stage-problem', ...cue })),
  ...Object.entries(CAMPAIGN_FAMILY_NARRATION).map(([ownerId, cue]) => ({ id: `family-${ownerId}-help`, ownerId, kind: 'family-help', ...cue })),
  ...Object.entries(CAMPAIGN_MISSION_NARRATION).map(([ownerId, cue]) => ({ id: `mission-${ownerId}-goal`, ownerId, kind: 'mission-goal', ...cue }))
].map(Object.freeze));
