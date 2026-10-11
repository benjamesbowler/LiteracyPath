import { getLedaInstructionAudioPath, getLedaWordAudioPath } from './ledaProductionAudio.js';
import { literacyMockTaskKey } from '../utils/literacyMockConditions.js';

// Each target has its own concrete object/action referent. Foils omit or change
// a cluster member, or keep the cluster while changing the remainder of the word.
export const MOCK_PICTURED_BLEND_CONTRASTS = Object.freeze({
  cl: ['clock lock click sock','clap cap flap clip','clam lamb clamp clap','clip lip clap slip','clog log frog clock','club cub crab clap','clay lay play day','claw law draw crow','cloud loud crowd clown','clown crown cloud brown'],
  fl: ['flag lag flap flat','flat fat flag slat','flap lap flag clap','flip lip flap slip','flop lop flip slop','flow low glow slow','flea fee fly plea','flute loot float fruit','float flat boat coat','floor four flower door'],
  br: ['brush rush crush brick','bread red braid thread','brick rick click bridge','bridge ridge fridge branch','brown down crown broom','broom room bloom brush','braid raid bread brain','branch ranch bench brush','broth moth both brush','brace race grace brake'],
  cr: ['crab cab crib grab','crib rib crab grip','crow row grow cow','cry rye dry fry','crack rack track crock','crown clown brown crow','crust rust trust crest','crane cane drain crown','crate rate grate crack','creek cheek crook reek'],
  fr: ['frog fog log from','frame fame flame farm','fruit root flute foot','frost lost first forest','fries rise flies fry','frill rill grill fill','frond fond front fern','frown crown brown down','freeze fees breeze free','fridge ridge bridge friend'],
  st: ['star tar scar start','stick tick slick stack','stop top shop step','step stop steep stem','stem hem steam step','stamp camp stump ramp','stone tone stove storm','stool tool school spoon','storm form store star','stack tack slack stick'],
  sk: ['skate late state slate','skirt shirt dirt skit','skull dull skill school','ski sea sky key','skin kin spin sin','sketch etch stretch fetch','skunk sunk trunk stunk','sky sigh spy sly','skip sip slip skid','skid kid slid skip'],
  sn: ['snail sail scale tail','snake sake shake stake','snap nap slap snip','snow sew slow show','snout shout stout scout','sneeze knees freeze sleeve','snack sack stack snake','snore sore store snout','snip nip skip snap','snowsuit spacesuit swimsuit jumpsuit'],
  sp: ['spin pin skin span','spot pot slot spit','spider rider slider spire','spoon soon spool school','spade made shade space','sponge plunge strange spring','spill pill skill spell','spool pool spoon stool','spike pike like spine','spear peer spare sphere'],
  nt: ['ant at an art','tent ten vent tint','plant plan plank pant','paint pain pant point','point coin pint joint','mint mitt mist lint','joint join point joist','dent den tent bent','vent vet tent vest','print pint point prince'],
  mp: ['lamp lamb limp lump','camp cap clamp damp','stump sum stamp dump','clamp clam clump camp','stamp stack camp stomp','jump jug lump bump','pump pup bump lump','bump bun pump lump','ramp ram lamp camp','chimp chip champ crimp'],
  nk: ['pink pin pick punk','sink sin sick silk','wink win wick wing','bank ban back tank','tank tan tack task','trunk truck drunk trick','skunk sunk skulk stink','drink drip trick drain','plank plan plant prank','ink in it pink'],
  lt: ['belt bell bet bolt','melt met felt malt','salt sat sale silt','bolt bowl boat belt','quilt quit quill guilt','kilt kit kill tilt','pelt pet felt belt','felt fell fed melt','tilt till tin kilt','vault vat fault volt'],
  ft: ['gift gill lift shift','lift lit list left','raft rat craft rift','left let lift lest','soft sock sort loft','craft cart raft draft','draft raft craft drift','loft lot lost left','tuft tub tough puff','shaft shift raft staff'],
});

export function buildLiteracyMockFoundationBlendCapacity(bank, authoredItem, pictures) {
  const output=[];
  const groups=Map.groupBy(bank.filter(i=>i.skillId==='blends'&&!i.tutorialOnly&&MOCK_PICTURED_BLEND_CONTRASTS[i.constructClaim]),i=>JSON.stringify([literacyMockTaskKey(i),i.level]));
  for(const rows of groups.values()) {
    const template=rows[0],seen=new Set(rows.map(i=>i.targetWord));
    for(const row of MOCK_PICTURED_BLEND_CONTRASTS[template.constructClaim]) {
      if(seen.size>=10)break;
      const [word,...foils]=row.split(' ');if(seen.has(word))continue;
      const all=[word,...foils], shift=output.length%4;
      const choices=[...all.slice(shift),...all.slice(0,shift)].map((label,index)=>({id:`c${index}`,label}));
      const image=pictures.get(word)||`/images/assessment/literacy-mock/capacity/foundation-${word}.webp`;
      const prompt='Which word names the picture?';
      output.push(authoredItem(template,`blend-print.${template.constructClaim}.l${template.level}.${word}`,{
        prompt,choices,answer:choices.find(c=>c.label===word).id,targetWord:word,image,imageAlt:word,
        stimulusKey:word,canonicalPassageId:word,exposureFamilyId:`mock-foundation-word:${word}`,
        requiredAudioCues:[{role:'instruction',text:prompt,path:getLedaInstructionAudioPath(prompt)},{role:'target_word',text:word,path:getLedaWordAudioPath(word)}],
        explanation:`${word} names the supplied target. Retain every sound in the ${template.constructClaim} cluster and the rest of the word.`,
        difficultyEvidence:template.level===1?'Decode a new pictured and spoken word with the taught initial two-consonant blend.'
          :'Keep all sounds in the later initial or final blend while rejecting an omission, a neighbouring cluster or a changed word ending.',
        distractorRationales:Object.fromEntries(choices.filter(c=>c.label!==word).map(c=>[c.id,`${c.label} drops or changes a consonant in the target cluster, or keeps the cluster but changes the rest of ${word}.`])),
        mediaDecision:{role:'target',paths:[image],constructReview:image.startsWith('/images/assessment/literacy-mock/capacity/foundation-')?'pending':'approved',answerNeutral:'approved',reason:'The concrete target picture supports an exact required spoken word. None of the printed spelling alternatives is narrated.'},
        sourceProvenance:{kind:'original_mock_foundation_capacity',file:'src/data/literacyMockFoundationBlendCapacity.js',sourceId:`${template.constructClaim}:${word}`,taskTemplate:template.id},
      }));seen.add(word);
    }
  }
  return output;
}
