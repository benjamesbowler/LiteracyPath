// Authored oral-language decisions. Scene object IDs, not labels or image
// guesses, establish the choices. Audio is generated from these exact scripts.
const clip = id => `/audio/sound-seekers/campaign/${id}.mp3`;
const placement = (id, text, objectId, locations, correctId, construct = 'oral_prepositions') => ({
  id, text, audio: clip(id), objectId, construct,
  options: locations.map(([optionId, label]) => ({ id: optionId, label })), correctId
});
const rail = [['rail', 'on the rail'], ['tray', 'in the tray'], ['stool', 'under the stool']];
const roots = [['little', 'little button'], ['large', 'large button'], ['ribbon', 'ribbon']];
const seats = [['shade', 'seat under the tree'], ['sun', 'seat in the sun'], ['pond', 'seat by the pond']];

export const CAMPAIGN_LANGUAGE = Object.freeze({
  'meadow-01-4': [
    placement('oak-towel-rail', 'Put the towel on the rail.', 'towel', rail, 'rail'),
    placement('oak-soap-tray', 'Put the soap in the tray.', 'soap', rail, 'tray'),
    placement('oak-bucket-stool', 'Put the bucket under the stool.', 'bucket', rail, 'stool'),
    placement('oak-cloth-tray', 'Put the cloth in the tray.', 'cloth', rail, 'tray'),
    placement('oak-brush-rail', 'Put the brush on the rail.', 'brush', rail, 'rail'),
    placement('oak-ball-stool', 'Put the ball under the stool.', 'ball', rail, 'stool')
  ],
  'meadow-01-side-1': [
    placement('oak-button-little', 'Find the little button.', 'button', roots, 'little', 'oral_vocabulary'),
    placement('oak-button-large', 'Find the large button.', 'button', roots, 'large', 'oral_vocabulary'),
    placement('oak-button-ribbon', 'Find the ribbon.', 'ribbon', roots, 'ribbon', 'oral_vocabulary')
  ],
  'meadow-01-side-2': [
    placement('oak-seat-shade', 'Take the cushion to the seat under the tree.', 'cushion', seats, 'shade', 'listening_directions'),
    placement('oak-seat-pond', 'Take the bag to the seat by the pond.', 'bag', seats, 'pond', 'listening_directions'),
    placement('oak-seat-sun', 'Take the hat to the seat in the sun.', 'hat', seats, 'sun', 'listening_directions')
  ],
  'meadow-01-5': [
    placement('oak-final-towel', 'Put the towel on the rail.', 'towel', rail, 'rail'),
    placement('oak-final-soap', 'Put the soap in the tray.', 'soap', rail, 'tray'),
    placement('oak-final-bucket', 'Put the bucket under the stool.', 'bucket', rail, 'stool')
  ]
});

export const CAMPAIGN_HELP_LINES = Object.freeze({
  welcome: { text: 'Choose a friend. Run, jump, and explore together.', audio: clip('welcome') },
  walk: { text: 'Go and see Muddy by the oak tree.', audio: clip('walk') },
  steps: { text: 'Listen. Jump onto the sound you hear.', audio: clip('steps') },
  pop: { text: 'Listen. Aim your bubble at the sound.', audio: clip('pop') },
  bridge: { text: 'Listen to the word. Build it with the planks.', audio: clip('bridge') },
  carry: { text: 'Listen. Take it to the right place.', audio: clip('carry') },
  recover: { text: 'Back on your feet. Try that jump again.', audio: clip('recover') },
  complete: { text: 'You helped! Have a look around.', audio: clip('complete') }
});
