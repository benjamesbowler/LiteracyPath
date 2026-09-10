// Authored sound units: spelling and pronunciation are separate. Greedy letter
// splitting cannot distinguish ea in thread from ea in dream, or ow in owl
// from ow in glow. Underscores retain the taught split-digraph notation.
// Pronunciation cross-check: CMUdict revision
// 74790861f652b15e4ac49015a90074ad62a27690 (cmusphinx/cmudict), alongside the
// app's approved phoneme recordings and established r-controlled units.
const rows = {
  easy: [
    ['cat', 'c a t'], ['sun', 's u n'], ['mop', 'm o p'],
    ['big', 'b i g'], ['hat', 'h a t'], ['log', 'l o g'],
    ['pen', 'p e n'], ['cup', 'c u p'], ['dog', 'd o g'],
    ['jam', 'j a m'], ['red', 'r e d'], ['wet', 'w e t'],
    ['run', 'r u n'], ['bug', 'b u g'], ['pig', 'p i g'],
    ['web', 'w e b'], ['hen', 'h e n'], ['sock', 's o ck~k'],
    ['zip', 'z i p'], ['van', 'v a n'], ['top', 't o p'],
    ['net', 'n e t'], ['mud', 'm u d'], ['duck', 'd u ck~k'],
    ['bed', 'b e d'], ['ten', 't e n'], ['cap', 'c a p'],
    ['bus', 'b u s'], ['pot', 'p o t'], ['leg', 'l e g']
  ],
  medium: [
    ['frog', 'f r o g'], ['plant', 'p l a n t'], ['crisp', 'c r i s p'],
    ['drum', 'd r u m'], ['stone', 's t o_e n'], ['flame', 'f l a_e m'],
    ['brush', 'b r u sh'], ['green', 'g r ee n'], ['splash', 's p l a sh'],
    ['track', 't r a ck~k'], ['clock', 'c l o ck~k'], ['snail', 's n ai l'],
    ['train', 't r ai n'], ['clap', 'c l a p'], ['brain', 'b r ai n'],
    ['sleep', 's l ee p'], ['float', 'f l oa t'], ['smile', 's m i_e l'],
    ['chair', 'ch air'], ['thread', 'th r ea~ea_e d'], ['crash', 'c r a sh'],
    ['string', 's t r i ng'], ['spring', 's p r i ng'], ['bright', 'b r igh t'],
    ['twist', 't w i s t'], ['storm', 's t or m'], ['shark', 'sh ar k'],
    ['three', 'th r ee'], ['slide', 's l i_e d'], ['prize', 'p r i_e z']
  ],
  hard: [
    ['sunlight', 's u n l igh t'], ['rainbow', 'r ai n b ow'], ['moon', 'm oo n'],
    ['star', 's t ar'], ['meadow', 'm ea~ea_e d ow'], ['frost', 'f r o s t'],
    ['river', 'r i v er'], ['rabbit', 'r a bb~b i t'], ['silver', 's i l v er'],
    ['night', 'n igh t'], ['dark', 'd ar k'], ['owl', 'ow~ow_ou l'],
    ['glow', 'g l ow'], ['badger', 'b a dg~j er'], ['thunder', 'th u n d er'],
    ['glimmer', 'g l i mm~m er'], ['sunshine', 's u n sh i_e n'], ['acorn', 'a~a_e c or n'],
    ['mist', 'm i s t'], ['fern', 'f er n'], ['oak', 'oa k'],
    ['butterfly', 'b u tt~t er f l y~y_ie'], ['moss', 'm o ss~s'], ['goldfish', 'g o~o_e l d f i sh'],
    ['dream', 'd r ea m'], ['mushroom', 'm u sh r oo m'], ['glowing', 'g l ow i ng'],
    ['stream', 's t r ea m'], ['shining', 'sh i~i_e n i ng'], ['sunset', 's u n s e t']
  ]
};

export const SOUND_SAFARI_MODELS = Object.freeze(Object.fromEntries(
  Object.entries(rows).map(([difficulty, words]) => [difficulty, Object.freeze(
    words.map(([word, authored]) => {
      const units = authored.split(' ').map(unit => {
        const [label, soundKey = label] = unit.split('~');
        // c and k must also compare as one sound when choosing distractors.
        return Object.freeze({ label, soundKey: soundKey === 'c' ? 'k' : soundKey });
      });
      return Object.freeze({ word, units: Object.freeze(units) });
    })
  )])
));
