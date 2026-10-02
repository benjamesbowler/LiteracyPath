import { wordRows } from './tracks.mjs';

// Spoken single-word synonym recognition; all alternatives are from the same
// semantic domain and part of speech. No printed spelling can carry the answer.
export default wordRows('word_meaning', [
  [
    ['big','large','small','narrow'], ['small','little','huge','wide'], ['happy','glad','sad','angry'], ['sad','unhappy','glad','angry'],
    ['fast','quick','slow','steady'], ['quiet','silent','loud','musical'], ['loud','noisy','quiet','musical'], ['cold','chilly','hot','wet'],
    ['hot','heated','cold','frozen'], ['angry','mad','calm','pleased'], ['clean','spotless','dirty','dusty'], ['muddy','dirty','dry','dusty'],
    ['easy','simple','hard','impossible'], ['hard','difficult','easy','impossible'], ['pretty','beautiful','homely','plain'], ['strong','powerful','weak','gentle'],
    ['ill','sick','strong','sleepy'], ['wet','damp','dry','hot'], ['dry','arid','wet','cold'], ['bright','shiny','dark','cloudy'],
    ['dim','faint','bright','colorful'], ['kind','caring','unkind','shy'], ['mean','unkind','kind','shy'], ['safe','secure','unsafe','fragile'],
    ['bad','awful','good','plain'], ['good','fine','bad','wrong'], ['right','correct','wrong','left'], ['near','nearby','far','above'],
    ['over','above','below','inside'], ['under','below','above','beside'], ['help','aid','hurt','push'], ['talk','speak','sing','listen']
  ],
  [
    ['huge','enormous','narrow','shallow'], ['tiny','small','tall','wide'], ['cheerful','joyful','calm','worried'], ['afraid','scared','surprised','curious'],
    ['brave','fearless','careful','nervous'], ['tired','weary','awake','restless'], ['clever','smart','silly','worried'], ['cross','angry','gentle','pleased'],
    ['damp','moist','dry','dusty'], ['soaked','drenched','dry','dusty'], ['neat','tidy','crowded','empty'], ['messy','untidy','clean','crowded'],
    ['flat','level','curved','bumpy'], ['rough','bumpy','smooth','soft'], ['thin','slim','short','wide'], ['wide','broad','long','tall'],
    ['narrow','slim','short','low'], ['thick','fat','wide','tall'], ['swift','rapid','steady','slow'], ['speedy','fast','steady','gentle'],
    ['peaceful','calm','nervous','restless'], ['rich','wealthy','poor','hungry'], ['poor','needy','wealthy','hungry'], ['simple','easy','short','complicated'],
    ['shy','timid','bold','cheerful'], ['nervous','worried','calm','pleased'], ['astonished','surprised','angry','curious'], ['delighted','pleased','nervous','angry'],
    ['homely','plain','lovely','shiny'], ['brilliant','bright','dim','cloudy'], ['freezing','cold','warm','wet'], ['tricky','difficult','simple','slow']
  ],
  [
    ['begin','start','continue','finish'], ['finish','end','pause','continue'], ['choose','pick','collect','arrange'], ['repair','fix','build','clean'],
    ['collect','gather','carry','sort'], ['understand','know','guess','forget'], ['join','connect','separate','divide'], ['notice','spot','watch','search'],
    ['search','hunt','watch','notice'], ['mend','repair','build','decorate'], ['whisper','murmur','shout','sing'], ['shout','yell','talk','sing'],
    ['hurry','rush','move','jog'], ['stroll','walk','march','run'], ['tug','pull','push','lift'], ['lift','raise','pull','carry'],
    ['grip','hold','touch','tap'], ['close','shut','open','fill'], ['twirl','spin','slide','lift'], ['throw','cast','drop','place'],
    ['reply','answer','ask','explain'], ['buy','purchase','borrow','sell'], ['require','need','want','offer'], ['divide','split','join','mix'],
    ['leap','jump','walk','crawl'], ['weep','cry','laugh','shout'], ['chuckle','laugh','weep','whisper'], ['giggle','laugh','sob','talk'],
    ['exit','leave','enter','return'], ['blend','mix','split','empty'], ['slice','cut','break','stir'], ['discover','find','lose','search']
  ]
]);
