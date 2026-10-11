// Mock-only controlled inventories. Each entry is a real lexical target, not
// an altered sentence frame. Blueprint authority: BLUEPRINTS_PHONICS.md §§12–14.
// Split-e exposure e_e is deliberately absent. The two pronunciations of ow
// are separate inventories; no ambiguous read/lead/bow/sow targets are used.
export const MOCK_PATTERN_WORDS = Object.freeze({
  'complete_split_vowel_spelling:a_e': {
    1: 'cake game name gate lake tape cape cane mane made hate rate late same take bake lane pane',
  },
  'complete_split_vowel_spelling:i_e': {
    1: 'bike kite time ride bite ripe fine pine dime hide mine line nine side',
  },
  'complete_split_vowel_spelling:o_e': {
    1: 'home bone rope nose cone note hope robe rode code tone dome hole mole pole',
  },
  'complete_split_vowel_spelling:u_e': {
    1: 'cube tune mule cute tube use duke dune fuse huge rude rule',
  },
  'complete_vowel_team_spelling:ai:long_a': {
    1: 'rain sail mail pail tail wait pain main bait fail paid rail',
    2: 'strain sprain braid brain grain train trail snail paint faint saint drain',
  },
  'complete_vowel_team_spelling:ay:long_a': {
    1: 'day hay lay may pay ray say way bay jay',
    2: 'spray stray play tray stay clay gray sway fray pray',
  },
  'complete_vowel_team_spelling:ee:long_e': {
    1: 'bee see fee tee seed feed weed need deep keep week feet',
    2: 'screen street green sleep sheep sweep steep creek cheek fleece squeeze freeze',
  },
  'complete_vowel_team_spelling:ea:long_e': {
    1: 'sea pea tea leaf meat seat team bead deal heal heat meal',
    2: 'stream dream cream clean speak treat reach beach peach wheat plead sneak',
  },
  'complete_vowel_team_spelling:oa:long_o': {
    1: 'boat coat goat moat soap road load loaf coal foam soak roam',
    2: 'throat float croak cloak coach roast toast boast coast groan bloat',
  },
  'complete_vowel_team_spelling:igh:long_i': {
    1: 'high sigh thigh light night right fight might sight tight',
    2: 'bright flight fright slight midnight twilight sunlight daylight eyesight skylight',
  },
  'complete_vowel_team_spelling:oo:moon': {
    2: 'moon spoon broom room pool stool school food soon zoo bloom boot',
  },
  'complete_vowel_team_spelling:ow:long_o': {
    2: 'snow blow grow show slow flow throw glow crow low rainbow window',
  },
  'complete_vowel_team_spelling:ow:cloud': {
    2: 'cow now how owl down town brown crown frown clown growl',
  },
  'complete_vowel_team_spelling:ou:cloud': {
    2: 'out loud cloud found round sound shout mouth south proud count ground',
  },
  'complete_vowel_team_spelling:oi:coin': {
    2: 'coin soil boil foil oil join point joint moist spoil choice voice',
  },
  'complete_vowel_team_spelling:oy:coin': {
    2: 'boy toy joy soy coy annoy enjoy destroy employ decoy',
  },
  'complete_vowel_team_spelling:ew:moon': {
    2: 'few new dew flew grew blew chew crew drew screw threw stew',
  },
  'complete_vowel_team_spelling:aw:saw': {
    2: 'saw law paw flaw jaw draw claw straw crawl gnaw',
  },
  'complete_r_controlled_spelling:ar': {
    1: 'car far jar tar bar star park farm hard dark card arm',
    2: 'car far jar tar bar star park farm hard dark card arm scarf sharp charm smart start spark',
  },
  'complete_r_controlled_spelling:or': {
    1: 'for fork corn born torn horn cord sort port sport storm short',
    2: 'for fork corn born torn horn cord sort port sport storm short north torch porch snort',
  },
  'complete_r_controlled_spelling:er': {
    1: 'her fern herd term germ verb perch stern serve nerve',
    2: 'her fern herd term germ verb perch stern serve nerve verse',
  },
  'complete_r_controlled_spelling:ir': {
    1: 'bird girl dirt shirt skirt first third thirst whirl chirp stir firm',
    2: 'bird girl dirt shirt skirt first third thirst whirl chirp stir firm squirm',
  },
  'complete_r_controlled_spelling:ur': {
    1: 'fur hurt burn turn curl surf burst nurse purse curb',
    2: 'fur hurt burn turn curl surf burst nurse purse curb church churn slurp',
  },
});
