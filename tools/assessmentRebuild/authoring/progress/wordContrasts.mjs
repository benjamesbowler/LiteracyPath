import { wordRows } from './tracks.mjs';

// Each row is an individually specified target/key/competitor contrast. These
// fixed-inventory tasks have no cloned passage, interchangeable name or scenery.
export default [
  ...wordRows('hear_sounds', [
    [
      ['apple','ant','moon','fish'], ['boat','bed','sun','hat'], ['cat','cup','net','leg'], ['dog','duck','map','zip'],
      ['egg','elbow','fox','rat'], ['fan','fish','bed','cup'], ['goat','gate','sun','pen'], ['hat','hen','van','dog'],
      ['igloo','insect','moon','fox'], ['jam','jet','hat','net'], ['kite','key','pig','web'], ['leaf','leg','cup','sun'],
      ['moon','map','zip','hat'], ['net','nose','fish','bed'], ['octopus','ox','sun','jet'], ['pig','pen','moon','leg'],
      ['rat','rug','cup','fox'], ['sun','sock','bed','map'], ['top','tent','van','hen'], ['umbrella','up','jet','fish'],
      ['van','vest','dog','hat'], ['web','wig','moon','sun'], ['yellow','yawn','cup','net'], ['zip','zoo','hat','bed'],
      ['bear','book','sun','hat'], ['corn','cap','leg','moon'], ['door','desk','map','zip'], ['foot','fin','bed','cup'],
      ['gum','gate','sun','pen'], ['house','hen','van','dog'], ['jug','jam','hat','net'], ['lamp','leg','cup','sun']
    ],
    [
      ['ball','bus','pig','dog'], ['duck','desk','top','goat'], ['fish','fin','van','sun'], ['goose','gum','kite','duck'],
      ['pan','pot','boat','top'], ['tent','tap','dog','kite'], ['vest','vet','fan','web'], ['zebra','zip','sun','jet'],
      ['milk','mop','net','leg'], ['nose','nut','map','rat'], ['red','ring','web','leg'], ['wet','web','red','yellow'],
      ['sock','soap','zip','shop'], ['shell','ship','sun','chin'], ['chin','chip','ship','jet'], ['thin','thumb','fin','sun'],
      ['juice','jam','chin','zip'], ['log','leaf','rat','net'], ['hen','hat','fan','van'], ['yarn','yellow','wet','jam'],
      ['cow','cap','goat','top'], ['bat','ball','pot','dog'], ['pot','pan','boat','top'], ['oven','under','apple','insect'],
      ['book','bus','pig','dog'], ['desk','duck','tap','goat'], ['fin','fan','van','hat'], ['gate','gum','cup','dog'],
      ['pink','pen','bed','top'], ['tap','tent','dog','kite'], ['vase','van','fan','web'], ['zoom','zip','sun','jam']
    ],
    [
      ['black','bag','pan','drum'], ['bread','bus','pot','frog'], ['clap','cat','goat','flag'], ['crab','cup','gum','drum'],
      ['drum','dog','top','crab'], ['dress','duck','tap','flag'], ['flag','fan','van','grin'], ['frog','fin','vet','clap'],
      ['glass','goat','kite','plug'], ['grin','gate','cat','spin'], ['plan','pig','boat','twig'], ['plug','pen','bed','swim'],
      ['pram','pot','ball','stop'], ['skate','sun','zip','ship'], ['skin','sock','zoo','shell'], ['skip','soap','zebra','chin'],
      ['sleep','sun','zip','thin'], ['small','sock','zoo','shop'], ['snail','soap','zebra','chip'], ['snow','sun','zip','thumb'],
      ['spin','sock','zoo','ship'], ['stop','sun','zebra','shell'], ['swim','soap','zip','chin'], ['twig','top','dog','crab'],
      ['blot','bag','pan','fan'], ['brick','bus','pot','drum'], ['clock','cup','goat','fan'], ['drop','dog','top','spin'],
      ['flap','fan','van','clap'], ['glad','goat','cat','stop'], ['plum','pig','bed','twig'], ['trip','top','dog','crab']
    ]
  ]),
  ...wordRows('printed_words', [
    [
      ['cat','cat','cot','cut'], ['dog','dog','dig','dug'], ['pig','pig','pin','pit'], ['hen','hen','pen','ten'],
      ['fox','fox','box','fix'], ['cup','cup','cap','cot'], ['sun','sun','sip','sum'], ['map','map','mop','mat'],
      ['bed','bed','bad','bud'], ['leg','leg','log','lag'], ['net','net','nut','not'], ['hat','hat','hit','hot'],
      ['pen','pen','pan','pin'], ['bus','bus','bun','bug'], ['rat','rat','red','rug'], ['van','van','fan','vat'],
      ['bag','bag','big','bog'], ['log','log','dog','lot'], ['web','web','wet','well'], ['zip','zip','zap','sip'],
      ['jet','jet','get','pet'], ['fin','fin','fan','fun'], ['mop','mop','map','hop'], ['tub','tub','tab','cub'],
      ['top','top','tap','tip'], ['pot','pot','pit','pet'], ['cut','cut','cat','cot'], ['hop','hop','hip','hot'],
      ['sit','sit','sat','set'], ['tap','tap','top','tip'], ['rug','rug','rag','rig'], ['gum','gum','gem','gap']
    ],
    [
      ['flag','flag','flap','flat'], ['drum','drum','drip','drop'], ['frog','frog','from','flag'], ['clap','clap','clip','club'],
      ['step','step','stop','slip'], ['stop','stop','step','shop'], ['crab','crab','grab','crib'], ['grin','grin','grip','grab'],
      ['plug','plug','plum','plan'], ['spin','spin','spun','spot'], ['twin','twin','thin','tin'], ['swim','swim','swam','swum'],
      ['shop','shop','ship','chop'], ['ship','ship','shop','chip'], ['fish','fish','dish','wish'], ['chip','chip','chop','ship'],
      ['chop','chop','chip','shop'], ['chin','chin','shin','chat'], ['thin','thin','then','chin'], ['chat','chat','that','chip'],
      ['shell','shell','smell','spell'], ['brush','brush','bread','crush'], ['truck','truck','track','trick'], ['black','black','block','blank'],
      ['plum','plum','plug','plan'], ['brick','brick','black','block'], ['flap','flap','flag','flat'], ['skip','skip','slip','ship'],
      ['snack','snack','stack','stick'], ['best','best','bent','vest'], ['milk','milk','mill','mix'], ['hand','hand','band','land']
    ],
    [
      ['cake','cake','cane','cape'], ['gate','gate','game','cape'], ['cape','cape','cake','cane'], ['game','game','gate','tame'],
      ['name','name','nine','tame'], ['lake','lake','like','late'], ['bike','bike','bake','bite'], ['kite','kite','kit','bite'],
      ['pine','pine','pin','line'], ['five','five','fine','bike'], ['nine','nine','mine','name'], ['time','time','tame','tile'],
      ['home','home','hope','dome'], ['rope','rope','ripe','robe'], ['nose','nose','note','rose'], ['rose','rose','rise','rope'],
      ['cube','cube','cute','tube'], ['mule','mule','mile','lime'], ['boat','boat','boot','coat'], ['rain','rain','ring','run'],
      ['seed','seed','need','send'], ['feet','feet','feed','meet'], ['moon','moon','noon','soon'], ['coat','coat','cat','cart'],
      ['tail','tail','tall','tile'], ['sail','sail','soil','sell'], ['maid','maid','tail','rain'], ['road','road','read','rude'],
      ['boot','boot','boat','book'], ['feed','feed','feet','need'], ['leaf','leaf','left','leap'], ['team','team','tent','term']
    ]
  ]),
  ...wordRows('common_words', [
    [
      ['in','in','up','so'], ['on','on','at','he'], ['no','no','we','it'], ['to','to','my','as'],
      ['so','so','be','an'], ['go','go','if','us'], ['he','he','or','by'], ['we','we','am','up'],
      ['be','be','it','my'], ['me','me','of','no'], ['at','at','he','so'], ['up','up','in','do'],
      ['it','it','we','by'], ['is','is','go','an'], ['as','as','me','or'], ['us','us','to','he'],
      ['by','by','am','no'], ['my','my','of','we'], ['or','or','be','at'], ['do','do','if','up'],
      ['if','if','no','me'], ['an','an','so','by'], ['am','am','it','us'], ['of','of','up','he'],
      ['oh','oh','if','us'], ['a','a','it','we'], ['I','I','he','my'], ['yes','yes','by','in'],
      ['all','all','can','but'], ['and','and','the','for'], ['but','but','was','you'], ['can','can','are','his']
    ],
    [
      ['you','you','your','young'], ['are','are','art','arm'], ['was','was','has','saw'], ['the','the','then','them'],
      ['one','one','once','on'], ['two','two','tall','tie'], ['has','has','had','his'], ['had','had','has','hid'],
      ['him','him','his','hum'], ['her','her','here','hers'], ['his','his','has','this'], ['for','for','far','from'],
      ['our','our','out','or'], ['out','out','our','but'], ['now','now','new','how'], ['how','how','who','now'],
      ['who','who','how','why'], ['see','see','set','she'], ['too','too','tool','top'], ['old','old','odd','off'],
      ['get','get','got','let'], ['let','let','lot','get'], ['put','put','pot','but'], ['not','not','now','net'],
      ['day','day','may','way'], ['may','may','my','many'], ['way','way','was','why'], ['say','say','saw','see'],
      ['new','new','now','news'], ['off','off','of','old'], ['ask','ask','as','ash'], ['why','why','who','way']
    ],
    [
      ['there','there','three','these'], ['their','their','these','them'], ['where','where','with','when'], ['what','what','that','when'],
      ['when','when','then','went'], ['which','which','with','while'], ['would','would','could','should'], ['could','could','would','cold'],
      ['should','should','would','show'], ['about','about','above','out'], ['after','after','often','again'], ['before','before','behind','below'],
      ['other','other','order','over'], ['under','under','until','uncle'], ['little','little','letter','later'], ['people','people','purple','pupil'],
      ['because','because','became','become'], ['again','again','against','along'], ['very','very','every','vary'], ['every','every','ever','very'],
      ['only','only','once','open'], ['some','some','same','come'], ['come','come','came','some'], ['said','said','sad','side'],
      ['many','many','may','money'], ['any','any','and','away'], ['over','over','ever','other'], ['into','into','onto','in'],
      ['from','from','form','for'], ['first','first','fast','frost'], ['your','your','you','young'], ['through','through','though','three']
    ]
  ])
];
