// Read-only exhaustive finite caller audit. Hooks expose private authored domains in memory only.
// Current selectors, retention and every accepted MAP resume branch remain authoritative.
import fs from 'node:fs';
import path from 'node:path';
import {registerHooks,createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),registryArgument=args.find(x=>x.startsWith('--registry=')),outputArgument=args.find(x=>x.startsWith('--output='));
if(args.some(x=>!x.startsWith('--registry=')&&!x.startsWith('--output=')))throw Error('Usage: node tools/auditFiniteImageBindings.mjs [--registry=path] [--output=path]');
const registry=JSON.parse(fs.readFileSync(path.resolve(root,registryArgument?.slice(11)||'tools/manifests/inactive-image-retirements.json'),'utf8'));
if(registry.schemaVersion!==1||!Array.isArray(registry.retirements))throw Error('Invalid inactive image registry');
const retiredPaths=new Set(registry.retirements.flatMap(row=>row.assets.map(a=>a.oldPath)));
import {fingerprintFiniteImageBindings} from './lib/inactiveImageRetirement.mjs';
const require=createRequire(root+'/package.json'),espree=require('espree');
const sha=x=>createHash('sha256').update(x).digest('hex');
const hooks=new Set([
'src/utils/rallyPalsRules.js','src/utils/towerTumbleRules.js','src/utils/burrowBuildersRules.js',
'src/utils/buildingGrowingRounds.js','src/utils/adventureRounds.js','src/utils/starGalleryRounds.js',
'src/utils/grammarGrindLevels.js','src/utils/reelReadLevels.js','src/utils/rhymePopLevels.js',
'src/components/cycle-practice/cyclePracticeContent.js','src/components/elQuest/elQuestEngine.js',
'src/data/presentDailyReading.js','src/data/presentVocabulary.js','src/features/soundkeys/content.js',
'src/utils/worksheets/worksheetBuilder.js','src/utils/curriculumLadder.js','src/data/v3/v3Registry.js']);
const sourceFiles=[],loadedSources=new Map();
registerHooks({load(url,ctx,next){const r=next(url,ctx);if(!url.startsWith('file:'))return r;const p=path.relative(root,fileURLToPath(url));if(p.startsWith('src/')&&/\.(js|jsx|json)$/.test(p))loadedSources.set(p,sha(fs.readFileSync(root+'/'+p)));
 if(!hooks.has(p))return r;
 const s=String(r.source),tree=espree.parse(s,{ecmaVersion:'latest',sourceType:'module'}),names=[];
 for(let n of tree.body){if(n.type==='ExportNamedDeclaration')n=n.declaration;if(!n)continue;
  if(n.type==='VariableDeclaration')for(const d of n.declarations)if(d.id.type==='Identifier')names.push(d.id.name);
  if(n.type==='FunctionDeclaration'&&n.id)names.push(n.id.name);
  if(n.type==='ImportDeclaration')for(const sp of n.specifiers)names.push(sp.local.name);
 }
 sourceFiles.push({path:p,sha256:sha(fs.readFileSync(root+'/'+p)),auditExportNames:names});
 return {...r,source:s+'\nexport const __auditLocals={'+[...new Set(names)].join(',')+'};\n'};
}});
const imp=p=>import(pathToFileURL(root+'/'+p));
const pending=new Map([...retiredPaths].map(p=>[p,{path:p}]));
const potential=new Map(),positive=new Map(),coverage=[],errors=[],allFiniteImageBindings=new Map(),questionSelectionDomains=[],sourceRoles=[];
function pathProof(p,surface,word,kind='finite-input-bound'){p=String(p||'').split(/[?#]/)[0];if(!/^\/(images|media|phonics)\//.test(String(p)))return;const key=JSON.stringify([surface,word,p,kind]);allFiniteImageBindings.set(key,{surface,word,path:p,kind});if(!pending.has(p))return;const map=kind==='positive-current-output'?positive:potential;const a=map.get(p)||[];if(a.length<20&&!a.some(x=>x.surface===surface&&x.word===word))a.push({surface,word,kind});map.set(p,a);}
function collectImages(v,surface,kind='finite-input-bound',field=''){if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){if(typeof x==='string'&&/^\/(images|media|phonics)\//.test(x)&&/\.(webp|png|jpe?g)(?:[?#].*)?$/.test(x))pathProof(x,surface,field+'/'+k,kind);else if(x&&typeof x==='object')collectImages(x,surface,kind,field+'/'+k);}}
const child=await imp('src/data/childAssets.js'),arcade=await imp('src/data/arcadeCuePictures.js');
function wordBound(words,surface,resolver=child.getChildWordAsset,kind='finite-input-bound'){const unique=[...new Set(words.filter(x=>typeof x==='string').map(x=>x.toLowerCase()))];for(const w of unique)collectImages(resolver(w),surface,kind,w);coverage.push({surface,method:'Complete authored word domain; actual resolver applied. Superset used only as a negative bound.',words:unique.length,wordDomain:unique.sort()});}
function imagePaths(v){if(!v||typeof v!=='object')return[];return Object.values(v).flatMap(x=>typeof x==='string'&&/^\/(images|media|phonics)\//.test(x)&&/\.(webp|png|jpe?g)(?:[?#].*)?$/.test(x)?[x.split(/[?#]/)[0]]:x&&typeof x==='object'?imagePaths(x):[]);}
function selectionDomain(kind,items){questionSelectionDomains.push({kind,questionIds:[...new Set(items.map(q=>q.id).filter(Boolean))].sort(),imagePaths:[...new Set(items.flatMap(imagePaths))].sort()});}
function pinSourceRole(file,role,details={}){const sha256=sha(fs.readFileSync(root+'/'+file));loadedSources.set(file,sha256);sourceRoles.push({path:file,sha256,role,...details});}
function strings(v){if(typeof v==='string')return[v];if(Array.isArray(v))return v.flatMap(strings);if(v&&typeof v==='object')return Object.values(v).flatMap(strings);return[];}
const sk=await imp('src/features/soundkeys/content.js');wordBound(sk.SOUNDKEY_WORDS.map(x=>x.id),'SoundKeys all authored SOUNDKEY_WORDS (superset of difficulty profiles)');
const rally=(await imp('src/utils/rallyPalsRules.js')).__auditLocals;wordBound(Object.values(rally.BANKS).flat().map(x=>x[0]),'Rally complete BANKS word column');
const tower=(await imp('src/utils/towerTumbleRules.js')).__auditLocals;wordBound(Object.values(tower.BANKS).flat().map(x=>x.split('|').join('')),'Tower complete BANKS joined chunks');
const burrow=(await imp('src/utils/burrowBuildersRules.js')).__auditLocals;wordBound(Object.values(burrow.WORD_BLUEPRINTS).flat().map(x=>x[0]),'Burrow complete WORD_BLUEPRINTS');
const grow=await imp('src/utils/buildingGrowingRounds.js');wordBound(['easy','medium','hard'].flatMap(d=>grow.__auditLocals.cleanCvcPool(d)),'CVC Workshop complete cleanCvcPool');
wordBound(strings(grow.__auditLocals.FAMILY_OBJECTS).concat(grow.__auditLocals.BLEND_TARGETS.map(x=>x[1])),'Legacy Arcade Practice family root and every FAMILY_OBJECTS candidate rendered by PhonicsPlayConstruction');
wordBound(grow.buildGrowingGardenRounds().map(x=>x.word),'Growing Garden all forward/reverse targets');
const pb=await imp('src/components/learn/games/games/phonicsBuildingRounds.js');wordBound(Object.values(pb.BUILDING_FAMILIES).flatMap(rows=>rows.flatMap(x=>x.slice(1))),'Current Blend and Build all authored family members');
wordBound(strings(pb.GARDEN_LETTER_CONTRASTS),'Current Letter Garden all contrast endpoints');
const adv=await imp('src/utils/adventureRounds.js'),al=adv.__auditLocals;
wordBound([...new Set(Object.values(al.SORT_PAIRS).flat(2))].flatMap(k=>(al.LETTER_EXAMPLES[k]||[]).filter(w=>/^[a-z]{2,6}$/.test(w)&&w.startsWith(k)&&al.hasWordAudio(w))),'Sound Sort Factory all possible eligible LETTER_EXAMPLES before random slicing');
wordBound(['cat','bat','fan','hat','tree','flag','frog','lamp','fish','train'],'Recognition Match collection fixed ten objects (not HFW card text)');
const cvc=await imp('src/data/cvcWordFamilies.js');wordBound(strings(cvc.cvcWordFamilies).filter(w=>/^[a-z]{3}$/.test(w)),'CVC StepBuild/StepHear/StepMagic complete authored family data',w=>child.getChildWordAsset(w,{allowBlockedAssessmentImage:true}));
const phon=await imp('src/data/phonicsLessons.js');collectImages(phon.lessons,'All authored Phonics Alphabet lesson word/distractor images');coverage.push({surface:'Phonics Alphabet',method:'All exported lesson images, including distractors',lessons:phon.lessons.flatMap(x=>x.letters).length});
const drum=await imp('src/data/drumTrailContent.js');collectImages(drum,'All authored Drum Trail definitions');
const star=await imp('src/utils/starGalleryRounds.js');for(const d of ['easy','medium','hard'])for(const lev of star.starGalleryLadder(d,0))for(const item of lev.items)for(const repair of item.repairs)collectImages(star.starGalleryPicture(repair),'Star Gallery complete authored ladder repairs');
const grammar=await imp('src/utils/grammarGrindLevels.js');wordBound(Object.values(grammar.__auditLocals.JOURNEY_BANKS).flat(2).map(x=>x.audioWord),'Grammar Grind complete exact audioWord across all three journey chapters/difficulties');
const sound=await imp('src/utils/soundBeatTracks.js');for(const d of ['easy','medium','hard'])for(const lev of sound.soundBeatLadder(d,0))wordBound(lev.items.map(x=>x.word),'Sound Beat complete ladder '+d+':'+lev.level);
const learn=await imp('src/data/learnGamesData.js');wordBound(strings(learn.CVC_WORDS),'Letter Leap all shared finite CVC_WORDS');wordBound(strings(learn.CVC_WORDS),'Word Bridge all finite word-mode targets',arcade.getArcadeCuePicture);
const reel=await imp('src/utils/reelReadLevels.js');wordBound(Object.values(reel.__auditLocals.LEVELS).flat().map(x=>x.target),'Reel Read all authored level targets',arcade.getArcadeCuePicture);
const rhyme=await imp('src/utils/rhymePopLevels.js');wordBound(rhyme.__auditLocals.RHYME_GROUPS.map(x=>x.targetWord),'Rhyme Pop all authored targetWords (not response rhymes)',arcade.getArcadeCuePicture);
const rhymeV2=await imp('src/utils/rhymePopV2Levels.js');
// Every family member can become the anchor after replayShuffle. The complete
// authored set plus the current local equivalent map is exact for every seed.
const rhymeV2Targets=rhyme.__auditLocals.RHYME_GROUPS.flatMap(g=>[g.targetWord,...g.rhymingWords]).map(w=>rhymeV2.RHYME_POP_V2_EQUIVALENTS[w]||w);
wordBound(rhymeV2Targets,'Current Rhyme Pop V2 every authored family-member anchor across all acts and arbitrary replay seeds',arcade.getArcadeCuePicture,'positive-current-output');
const reelV2=await imp('src/utils/reelReadV2Levels.js');
// reelReadLadder visits all ten authored levels; seeds reorder within bands.
// V2 applies its current local equivalent without changing the complete set.
wordBound(['easy','medium','hard'].flatMap(d=>reelV2.reelReadV2Ladder(d,0).map(x=>x.target)),'Current Reel Read V2 all authored targets including exact local equivalent',arcade.getArcadeCuePicture,'positive-current-output');
const safari=await imp('src/utils/soundSafariRounds.js');wordBound(Object.values(safari.SOUND_SAFARI_WORDS).flat().map(x=>typeof x==='string'?x:x.word),'Sound Safari complete model target words',arcade.getArcadeCuePicture);
const pres=await imp('src/data/presentDailyReading.js'),vocab=await imp('src/data/presentVocabulary.js');collectImages(pres.PRESENT_DAILY_READING,'Present all finite authored daily-reading cards');collectImages(vocab.PRESENT_VOCABULARY,'Present all finite authored vocabulary cards');
const presenter=await imp('src/utils/present/presentationBuilder.js');let presentDocs=0;
for(const c of presenter.presentationCycleOptions())for(const day of ['',...presenter.PRESENTATION_DAYS.map(x=>x.value)]){
 const doc=presenter.buildCyclePresentation(c.id,{day,format:'core'});presentDocs++;collectImages(doc.manifest,'Present exhaustive actual offered document manifest','finite-input-bound');
 for(const m of (doc.html||'').matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/g)){const u=m[1].replace(/^https?:\/\/[^/]+/,'');pathProof(u,'Present exhaustive actual offered document HTML',c.id+':'+day,'positive-current-output');}
}
coverage.push({surface:'Present',documents:presentDocs,method:'All current cycle options and five explicit days plus aggregate saved default; only offered core format. Retired formats normalize to core. No custom target word field.'});
// All six-page documents are the complete offered cycle/type/page domain, not seeded sampling.
const ws=await imp('src/utils/worksheets/worksheetBuilder.js');let docs=0;for(const c of ws.worksheetCycleOptions())for(const type of ws.availableWorksheetTypes(ws.getWorksheetCycle(c.id))){const {html}=ws.buildWorksheetDocument({cycleId:c.id,type,pages:6});docs++;for(const m of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/g))pathProof(m[1],'Worksheet all offered cycles/types/pages',c.id+':'+type,'positive-current-output');}
coverage.push({surface:'Worksheets',documents:docs,pages:6,method:'All UI-offered cycles/types and maximum pack length; all prefixes included. No custom word entry.'});
const cycle=await imp('src/components/cycle-practice/cyclePracticeContent.js'),cl=cycle.__auditLocals,eq=await imp('src/components/elQuest/elQuestEngine.js'),el=eq.__auditLocals;
const oralCycleWords=[...strings(cl.CYCLE_SOUND_WORDS),...strings(cl.CYCLE_FINAL_SOUND_WORDS),...cl.RHYME_FAMILIES.flat(),...cl.CYCLE_ORAL_BEAT_WORDS,...cl.CYCLE_PRACTICE_EXTRA_WORDS,...strings(cl.CYCLE_WORD_PARTS)];
wordBound(oralCycleWords,'Cycle Practice all oral picture domains through exact picture predicate',w=>({image:cl.picture(w)?.image}));
wordBound(cl.BUILD_WORDS.filter(w=>!cl.CYCLE_WORD_BUILD_IMAGE_HOLDOUTS.includes(w)&&cl.picture(w)),'Cycle Practice BUILD_WORDS after explicit build holdouts/picture predicate',w=>({image:cycle.cycleWordImage(w)}));
wordBound(Object.values(cl.CYCLE_HFW_CONTEXTS).map(x=>x.imageWord),'Cycle Practice all HFW context imageWord fields (HFW word itself is not pictured)',w=>({image:cycle.cycleWordImage(w)}));
collectImages(cl.CYCLE_WORD_BUILD_INVENTORY,'Cycle Practice exact pinned CVC build images');
collectImages(eq.ADVENTURE_WORD_BUILD_INVENTORY,'Adventure exact pinned CVC missing-letter images');
const adventureWords=[...strings(el.CYCLE_SOUND_WORDS),...strings(el.CYCLE_FINAL_SOUND_WORDS),...eq.ADVENTURE_RHYME_FAMILIES.flat(),...eq.ADVENTURE_COMPOUNDS.flatMap(x=>[x.word,...x.parts])];
wordBound(adventureWords.filter(el.isCyclePictureWordEligible),'Adventure exact picture pools/foils/compounds; LETTER_EXAMPLES sound-only and HFW matching text-only',w=>({image:eq.adventureWordImage(w)}));
const lex=await imp('src/features/soundSeekers/v3/engine/lexicon.js'),quest=await imp('src/data/questSequence.js');const max=Math.max(...quest.QUEST_STOPS.map(x=>x.index));wordBound([...lex.decodableWordsThrough(max),...lex.heartWordsKnownThrough(max)],'Sound Seekers v3 all curriculum words through final stop, exact clean-picture admission',w=>({image:lex.wordImage(w)}));
wordBound(quest.QUEST_STOPS.flatMap(s=>s.teach.map(t=>lex.targetInfo(t.id)?.anchorWord)).filter(Boolean),'Sound Seekers v3 all exact curriculum teaching anchors',w=>({image:lex.teachingAnchorImage(w)}));
const picker=await imp('src/data/assessmentMediaPicker.js');const load=await imp('src/data/loadAssessmentSkillBank.js');let banks=0,questions=0,controlledV3=0;for(const skill of load.getActiveAssessmentSkillIds())for(const retention of [false,true]){try{const q=await load.loadAssessmentSkillBank(skill,{retention});banks++;questions+=q.length;selectionDomain('current-formal:'+skill+':retention='+retention,q);collectImages(q,'Formal Assessment complete current V3 '+(retention?'retention':'normal')+' bank '+skill,'positive-current-output');for(const item of q){const resolved=picker.resolveQuestionMediaDynamically(item,{skillId:skill,level:item.level,phase:item.phase});if(resolved.assessmentMediaResolution?.imageAssetId==='v3-reviewed-media')controlledV3++;collectImages(resolved,'Formal actual dynamic media decision '+skill,'finite-input-bound');}}catch(e){errors.push({surface:'Assessment loader',skill,retention,error:e.message});}}
coverage.push({surface:'Formal Assessment',banks,questions,controlledV3,method:'Every current skill normal and retention bank through exact loader/eligibility; authored-media flags prevent injected pictures.'});
// Re-evaluate every accepted historical MAP resume branch using the actual JSX slots.
const runtime=await imp('src/data/literacyMockRuntimeBank.js'),versions=await imp('src/policy/literacyMockVersions.js'),elig=await imp('src/policy/literacyItemEligibility.js');
const historicalBranches=[],historicalPaths=new Set();
function runtimeImageSlots(item){const out=[];if(item.image)out.push(item.image);if(item.format!=='select_text')for(const c of item.choices||[])if(c.image)out.push(c.image);if(item.format==='match')for(const t of item.matchTargets||[])if(t.image)out.push(t.image);return out;}
for(const version of versions.LITERACY_MOCK_VERSIONS)for(const mixed of [false,...(['literacy-mock-v10','literacy-mock-v11','literacy-mock-v12'].includes(version)?[true]:[])]){
 const items=await runtime.loadLiteracyMockRuntimeBank({contentVersion:version,mixed}),admitted=items.filter(elig.isLiteracyItemEligible),selected=new Set();
 selectionDomain('accepted-historical-map:'+version+':mixed='+mixed,admitted);
 for(const item of admitted)for(const src of runtimeImageSlots(item)){const p=src.split(/[?#]/)[0];selected.add(p);historicalPaths.add(p);pathProof(p,'Accepted MAP historical/current actual runtime slots',version+':'+mixed+':'+item.id,'positive-current-output');}
 historicalBranches.push({version,mixed,total:items.length,eligible:admitted.length,withdrawn:items.length-admitted.length,uniqueImages:selected.size,matchedPending:[...selected].filter(p=>pending.has(p))});
}
coverage.push({surface:'MAP all accepted V1–V12 historical/current resume',method:'Every accepted loadRuntime branch, mixed variants V10–12, item eligibility, actual JSX image slots; no population inference.',branches:historicalBranches.length,uniqueImages:historicalPaths.size});
const practice=await imp('src/data/literacyPracticeBank.js'),reference=await imp('src/data/literacyReferenceBank.js');
for(const [kind,items]of [
 ['current-practice-including-reference',(await practice.loadLiteracyPracticeBank()).map(practice.presentLiteracyPracticeQuestion)],
 ['saved-practice-including-retired-offerings',(await practice.loadLiteracyPracticeBank({includeRetired:true})).map(practice.presentLiteracyPracticeQuestion)],
 ['assessment-preview-all-classroom-reference-IDs',reference.loadLiteracyReferenceBank().map(practice.presentLiteracyPracticeQuestion)]
]){selectionDomain(kind,items);collectImages(items,kind,'positive-current-output');}
coverage.push({surface:'Current and retained question selection identity domains',domains:questionSelectionDomains.length,sha256:sha(JSON.stringify(questionSelectionDomains)),method:'Fresh complete eligible formal normal/retention, accepted historical MAP branches, current/saved practice and classroom-reference preview domains. Nested image supersets are conservative negative bounds.'});
const qaItems=await imp('src/data/generated/mediaQaReviewItems.generated.js'),qaStatus=await imp('src/data/mediaQaReviewStatus.js'),qaRows=qaStatus.mergeMediaQaReviewItems(qaItems.mediaQaReviewItems,{}),qaCaller='src/components/admin/MediaQaReviewPage.jsx',qaText=fs.readFileSync(root+'/'+qaCaller,'utf8');
if(!qaText.includes('src={row.imagePath}')||!qaText.includes('mergeMediaQaReviewItems(mediaQaReviewItems, overrides)')||!qaText.includes('statusFilter === "all"'))throw Error('Admin QA thumbnail selector changed; review its exact domain');
for(const row of qaRows)pathProof(row.imagePath,'Admin Media QA actual all-row thumbnail selector',row.reviewId,'positive-current-output');
pinSourceRole(qaCaller,'actual-admin-thumbnail-caller',{selector:'all status/skill/search filters cover every merged review row; img.src is row.imagePath'});
coverage.push({surface:'Admin Media QA historical and current review thumbnails',rows:qaRows.length,uniqueImages:new Set(qaRows.map(x=>x.imagePath).filter(Boolean)).size,method:'Exact mergeMediaQaReviewItems with checked-in decisions; All status filter exposes every fixed row. Historical review purpose does not confer child image approval.'});
const styleRaw=await imp('src/content/assessments/v3/assessmentImageStyleDecisions.generated.js'),style=await imp('src/content/assessments/v3/assessmentImageStyleDecisions.js'),review=await imp('src/content/assessments/v3/assessmentImageReviewPolicy.js'),rejectedAudit=await imp('src/content/assessments/v3/assessmentMediaAuditRejectedHashes.generated.js');
for(const [p,r]of Object.entries(style.ASSESSMENT_IMAGE_STYLE_DECISIONS))pathProof(p,'Current assessment approved source decision authority',r.sha256,'approved-source-authority');
const rawCandidateRoles=Object.values(styleRaw.ASSESSMENT_IMAGE_STYLE_DECISIONS).filter(r=>retiredPaths.has(r.path)).map(r=>({path:r.path,sha256:r.sha256,role:style.ASSESSMENT_IMAGE_STYLE_DECISIONS[r.path]?'approved-source-authority':review.ASSESSMENT_REJECTED_IMAGE_HASHES[r.sha256]?'filtered-exact-rejected-pixel-record':'UNCLASSIFIED'}));
if(rawCandidateRoles.some(r=>r.role==='UNCLASSIFIED'))throw Error('Unclassified candidate style-decision reference');
const rejectedCandidateRoles=Object.entries(rejectedAudit.ASSESSMENT_MEDIA_AUDIT_REJECTED_HASHES).filter(([,r])=>retiredPaths.has(r.path)).map(([hash,r])=>({path:r.path,rejectedSha256:hash,role:'negative-rejected-pixel-record'}));
pinSourceRole('src/content/assessments/v3/assessmentImageStyleDecisions.generated.js','source-style-review-authority',{candidateReferences:rawCandidateRoles});
pinSourceRole('src/content/assessments/v3/assessmentMediaAuditRejectedHashes.generated.js','negative-rejected-pixel-authority',{candidateReferences:rejectedCandidateRoles});
coverage.push({surface:'Assessment style-decision and rejected-pixel authorities',approvedSources:Object.keys(style.ASSESSMENT_IMAGE_STYLE_DECISIONS).length,rawCandidateRoles,rejectedCandidateRoles,method:'Approved source paths are explicit conservative bounds; filtered/rejected records retain exact hash and role only, never a visual image selection.'});
const previewFile='src/assessment-media-evidence-preview.jsx',previewText=fs.readFileSync(root+'/'+previewFile,'utf8'),previewAst=espree.parse(previewText,{ecmaVersion:'latest',sourceType:'module',ecmaFeatures:{jsx:true},range:true}),fixtureNames=new Set(['BROKEN_SOURCE','COMPACT_VISUAL_GRID_QUESTION','FAILED_QUESTION','SHARED_FAILURE_QUESTION','SAFE_QUESTION','SAFE_REFILL','CANDIDATES']);
const fixtureNodes=previewAst.body.filter(n=>n.type==='VariableDeclaration'&&n.declarations.some(x=>fixtureNames.has(x.id.name))||n.type==='FunctionDeclaration'&&n.id.name==='previewWordImage');
if(fixtureNodes.length!==8)throw Error('Synthetic preview fixture domain changed; review all branches');
const version=await imp('src/utils/repairedImageVersion.js');
const fixtures=new Function('getChildWordAsset','withRepairedImageVersion',fixtureNodes.map(n=>previewText.slice(...n.range)).join('\n')+';return {COMPACT_VISUAL_GRID_QUESTION,FAILED_QUESTION,SHARED_FAILURE_QUESTION,SAFE_QUESTION,SAFE_REFILL,CANDIDATES};')(child.getChildWordAsset,version.withRepairedImageVersion);
collectImages(fixtures,'Assessment media-evidence preview exact synthetic fixture branches','positive-current-output');
const registryV3=await imp('src/data/v3/v3Registry.js');let previewBanks=0,previewQuestions=0;
for(const skill of Object.keys(registryV3.__auditLocals.V3_BANK_IMPORTS)){const q=(await registryV3.importV3Bank(skill)).map(x=>load.normalizeV3Question(x,skill));previewBanks++;previewQuestions+=q.length;collectImages(q,'Assessment media-evidence preview every registered V3 skill/item parameter','positive-current-output');}
pinSourceRole(previewFile,'actual-assessment-proof-preview',{syntheticFixtureDomain:[...fixtureNames],registeredV3Banks:previewBanks,classroomReferenceDomain:'assessment-preview-all-classroom-reference-IDs',intentionalFailureProbe:'/images/assessment/does-not-exist-a3-10.webp'});
coverage.push({surface:'Assessment media-evidence actual preview selectors',syntheticFixtures:7,registeredV3Banks:previewBanks,registeredV3Questions:previewQuestions,classroomReferenceItems:reference.loadLiteracyReferenceBank().length,method:'Exact synthetic fixture constants execute same current word resolver; every registered skill/item inspection and classroom-reference ID enumerated. Completion-recovery has no image. Expected broken-source probe stays intentional.'});
const out={createdUtc:new Date().toISOString(),questionSelectionDomains,sourceRoles,allFiniteImageBindings:[...allFiniteImageBindings.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))),historicalBranches,pendingInputCount:pending.size,method:'Exhaustive finite caller-input domains and actual deterministic picture resolvers. Broad domains are negative bounds only, not proof that every bound member is shown. No source mutation.',sourceFiles,loadedSources:[...loadedSources].map(([path,sha256])=>({path,sha256})),coverage,errors,potential:[...potential].map(([path,proofs])=>({path,proofs})),positive:[...positive].map(([path,proofs])=>({path,proofs})),outsideAllFiniteBounds:[...pending.keys()].filter(p=>!potential.has(p)&&!positive.has(p))};
if(outputArgument){const output=path.resolve(root,outputArgument.slice(9));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');}
console.log(JSON.stringify(fingerprintFiniteImageBindings(out,{retiredPaths,root,evaluatorPath:'tools/auditFiniteImageBindings.mjs'})));
