import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {collectAppVisualSourceGraph} from './appVisualSourceGraph.mjs';
import {collectPresentRuntimeImageBindings} from '../appVisualReviewInventory.mjs';
import {collectHistoricalReviewSourceState,checkHistoricalReviewSourceRole,heldAdministrativeBindingRole,HISTORICAL_REVIEW_KINDS,HISTORICAL_REVIEW_SOURCE_COHORT} from './appVisualHistoricalReviewSources.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fingerprint=value=>({count:value.length,sha256:hash(JSON.stringify(value))});
const REVIEW='src/content/appVisualAssetReviews.generated.js';
const QA='src/data/generated/mediaQaReviewItems.generated.js';
const BOOKS='src/data/guidedReadingBooks.js';
export const HELD_SOURCE_EVALUATOR='tools/auditAppVisualHeldSources.mjs';
export const HELD_SOURCE_VALIDATOR='tools/lib/appVisualHeldSources.mjs';
export const PACK8_HELD_BOOK_IDS=Object.freeze('gr-a-26,gr-a-27,gr-a-28,gr-a-29,gr-a-30,gr-b-31,gr-b-32,gr-b-33,gr-b-34,gr-b-35,gr-c-37,gr-c-38,gr-c-39,gr-c-40,gr-d-42,gr-d-43,gr-d-44,gr-d-45,gr-e-46,gr-e-47,gr-e-48,gr-e-49,gr-e-50'.split(','));
// These exact aliases have specific source/hold roles. This is deliberately
// not a namespace exemption for arbitrary unused or unreviewed artwork.
export const HELD_LEXICAL_SOURCES=Object.freeze({
  '/images/assessment/objective-words/hut.webp':['src/content/assessments/v3/objectiveAssessmentImageStyleDecisions.generated.js'],
  '/images/assessment/objective-words/ram.webp':['src/content/assessments/v3/objectiveAssessmentImageStyleDecisions.generated.js'],
  '/images/child-mode/blends/drum.webp':[],
  '/images/child-mode/cvc/book.webp':['src/data/childAssets.js','src/data/literacyMockFoundationV5.js'],
  '/images/child-mode/initial-sounds/bed.webp':['src/data/assessmentImageStyleBlocklist.js','src/data/childWordMediaManifest.js'],
  '/images/child-mode/plurals/dogs.webp':['src/data/childWordMediaManifest.js'],
  '/images/child-mode/ui/cave-button-panel.webp':['src/data/childWordMediaManifest.js'],
  '/images/child-mode/vocabulary/tool.webp':['src/data/childWordImageOverrides.js'],
  '/images/emotions/sad_child.webp':['src/data/childAssets.js'],
  '/images/generated/boy_afraid.webp':[],
  '/images/generated/goat_inside_barn.webp':[],
  '/images/generated/riddle_box.webp':[],
  '/images/learn-games/art/sound-sort-factory.webp':['src/components/learn/games/shared/illustratedGameScenes.js'],
  '/images/present/sentences/cat-ran.webp':['src/data/presentVocabulary.js'],
  '/images/present/sentences/cat-sat.webp':['src/data/presentVocabulary.js']
});
export const HELD_UNREACHABLE_SOURCES=Object.freeze({
  '/game-assets/sound-seekers/avatars-v3/chompy.webp':'src/features/soundSeekers/visual/CharacterSystem.jsx',
  '/game-assets/sound-seekers/avatars-v3/muddy.webp':'src/features/soundSeekers/visual/CharacterSystem.jsx',
  '/game-assets/sound-seekers/campaign/environment/materials.png':'src/features/soundSeekers/v3/render/illustratedWorldArt.js',
  ...Object.fromEntries(['forge-settlement','glass-marsh','river-gardens','seedwake-meadow','star-reach','storm-coast'].map(id=>[`/game-assets/sound-seekers/v2/biomes/${id}/background.webp`,'src/features/soundSeekers/content/biomeKits.js']))
});
export const HELD_THEME_REFERENCE='/game-assets/sound-seekers/characters/chompy/pose-ready.webp';
const POLICY=['src/policy/literacyItemEligibility.js','src/policy/literacyMockVersions.js','src/data/assessmentImageStyleBlocklist.js'];
const TOOLS=[HELD_SOURCE_EVALUATOR,HELD_SOURCE_VALIDATOR,'tools/lib/appVisualSourceGraph.mjs','tools/appVisualReviewInventory.mjs','tools/checkAppVisualReview.mjs','tools/auditFiniteImageBindings.mjs','tools/lib/inactiveImageRetirement.mjs','tools/lib/appVisualHistoricalReviewSources.mjs',HISTORICAL_REVIEW_SOURCE_COHORT];

function sourceFiles(root){
  const rows=[];
  function walk(relative){
    const directory=path.join(root,relative);if(!fs.existsSync(directory))return;
    for(const item of fs.readdirSync(directory,{withFileTypes:true})){
      const file=relative+'/'+item.name;
      if(item.isDirectory())walk(file);
      else if(item.isFile()&&/\.(?:[cm]?js|jsx|tsx?|json|html|css|svg)$/.test(file))rows.push({path:file,sha256:hash(fs.readFileSync(path.join(root,file)))});
    }
  }
  for(const directory of ['src','preview','demos'])walk(directory);
  return rows.sort((a,b)=>a.path.localeCompare(b.path));
}

export function checkHeldSourceEligibility({asset,inventoryItem,rawBooks,runtimePaths,finitePaths,reachable,dynamicRuntimePaths=new Set(),historicalReviewState}={}){
  const fail=reason=>({valid:false,reason});
  if(!asset||!inventoryItem||asset.path!==inventoryItem.path)return fail('not a current source inventory member');
  if(dynamicRuntimePaths.has(asset.path))return fail('current finite dynamic artwork loader can select this image');
  if(inventoryItem.sources.some(s=>['runtime-guided-reading','runtime-story-quests','runtime-present-document','source-image-file'].includes(s)))return fail('active runtime/imported image');
  let allowed,role;
  if(asset.kind==='guided-reading-unpublished-source'){
    if(!PACK8_HELD_BOOK_IDS.includes(asset.bookId))return fail('outside exact Pack8 book set');
    const book=rawBooks.find(b=>b.id===asset.bookId);
    if(!book||book.active!==false||book.qaStatus!=='needs_regeneration'||book.needsRegeneration!==true||!book.regenerationReason)return fail('book no longer explicitly held');
    const index=book.pages.findIndex(p=>p.image===asset.path),cover=book.coverImage===asset.path;
    if(!cover&&index<0)return fail('not this held book image');
    if(cover?asset.role!=='cover':asset.role!=='page'||asset.pageIndex!==index)return fail('incorrect exact book/page binding');
    if(book.pages.some(p=>p.active!==false||p.qaStatus!=='needs_regeneration'||!p.regenerationReason))return fail('page no longer explicitly held');
    // Clean regenerated replacements may reuse the public book ID. Bind this
    // disposition to the held original cover/pages, never to the ID alone.
    if([book.coverImage,...book.pages.map(p=>p.image)].some(p=>runtimePaths.has(p)))return fail('published original book/image');
    allowed=[BOOKS];role={bookId:book.id,role:cover?'cover':'page',...(cover?{}:{pageIndex:index}),reason:book.regenerationReason,pageReasons:book.pages.map(p=>p.regenerationReason)};
  }else if(asset.kind==='unselected-legacy-word-source'){
    allowed=HELD_LEXICAL_SOURCES[asset.path];if(!allowed)return fail('outside exact fifteen aliases');
    if(finitePaths.has(asset.path))return fail('selected/bound by current, retention, or accepted historical branch');
    role={sourceRole:'retained-lexical-hold-or-historical-alias',selectedBindings:0};
  }else if(asset.kind==='unreachable-legacy-author-source'){
    const owner=HELD_UNREACHABLE_SOURCES[asset.path];if(!owner)return fail('outside exact nine author sources');
    if(reachable.has(owner))return fail('legacy author module reachable from main');
    allowed=[owner];role={sourceRole:'unreachable-author-input',owner};
  }else if(HISTORICAL_REVIEW_KINDS.includes(asset.kind)){
    const result=checkHistoricalReviewSourceRole({asset,state:historicalReviewState,finitePaths,runtimePaths});
    if(!result.valid)return result;
    allowed=result.allowed;role=result.role;
  }else return fail('unknown held-source kind');
  const permitted=new Set([REVIEW,QA,...allowed]);
  for(const source of inventoryItem.sources){
    if(source==='runtime-media-registry')continue;
    if(!source.startsWith('source-literal:')||!permitted.has(source.slice(15)))return fail('new or unaudited source consumer '+source);
  }
  if(!inventoryItem.sources.some(s=>s==='source-literal:'+REVIEW)&&!allowed.some(p=>inventoryItem.sources.includes('source-literal:'+p)))return fail('missing retained source role');
  return {valid:true,role};
}

export async function collectAppVisualHeldSourceProof(root,assets,inventory){
  const filesBefore=sourceFiles(root),toolsBefore=TOOLS.map(p=>({path:p,sha256:hash(fs.readFileSync(path.join(root,p)))}));
  const graph=collectAppVisualSourceGraph(root),reachable=new Set(graph.modules),errors=[...graph.issues,...graph.dynamic],rows=[];
  const rawBooks=(await import(pathToFileURL(path.join(root,BOOKS)))).guidedReadingBookCandidates;
  const runtime=(await import(pathToFileURL(path.join(root,'src/utils/guidedReading/runtimeBooks.js')))).getRuntimeGuidedReadingBooks();
  const runtimeBindings=runtime.map(book=>({id:book.id,cover:book.coverImage,pages:book.pages.map(p=>p.image)}));
  const runtimePaths=new Set(runtimeBindings.flatMap(book=>[book.cover,...book.pages]).map(p=>p.split(/[?#]/)[0]));
  const publicIndex=(await import(pathToFileURL(path.join(root,'src/data/generated/guidedReadingBookIndex.generated.js')))).GUIDED_READING_BOOK_INDEX;
  const indexBindings=publicIndex.map(book=>({id:book.id,pages:(book.reviewedPageMedia?.pages||[]).map(p=>book.reviewedPageMedia.prefix+p[1])}));
  if(!same(indexBindings,runtimeBindings.map(({id,pages})=>({id,pages}))))errors.push('public discovery index does not match all current runtime book/page bindings');
  for(const book of indexBindings)for(const p of book.pages)runtimePaths.add(p.split(/[?#]/)[0]);
  for(const file of graph.modules.filter(p=>p!==BOOKS&&/\.[cm]?jsx?$/.test(p)))if(/\bguidedReadingBookCandidates\b/.test(fs.readFileSync(path.join(root,file),'utf8')))errors.push({file,reason:'raw held candidate catalogue has a new runtime consumer'});
  // The source-literal inventory cannot see roots combined with pose names.
  // These are the current finite dynamic loaders overlapping this exact old
  // author-art namespace; inspect their full authored domains as well.
  const playfield=(await import(pathToFileURL(path.join(root,'src/features/soundSeekers/rounded/campaignPlayfield.js'))));
  const dynamicRuntimePaths=new Set(collectPresentRuntimeImageBindings().map(row=>row.path));
  for(const familyId of Object.keys(playfield.CAMPAIGN_PLAY))for(const stageId of ['meadow-test','dino-test','moonwood-test'])dynamicRuntimePaths.add(playfield.campaignPlayfieldLandscape({familyId,stageId}));
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lp-held-source-proof-'));
  let finite,finiteFingerprint;
  try{
    const output=path.join(temp,'finite.json');
    finiteFingerprint=JSON.parse(execFileSync(process.execPath,[path.join(root,'tools/auditFiniteImageBindings.mjs'),'--output='+output],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));
    finite=JSON.parse(fs.readFileSync(output,'utf8'));
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
  errors.push(...finite.errors);
  if(finite.historicalBranches.length!==15||finite.coverage.length<50)errors.push('incomplete accepted-history/finite consumer coverage');
  const assetPaths=new Set(assets.map(a=>a.path)),byPath=new Map(inventory.map(row=>[row.path,row]));
  const needsAdministrativeProof=assets.some(a=>HISTORICAL_REVIEW_KINDS.includes(a.kind))||finite.allFiniteImageBindings.some(r=>assetPaths.has(r.path)&&r.surface==='Admin Media QA actual all-row thumbnail selector');
  const historicalReviewState=needsAdministrativeProof?await collectHistoricalReviewSourceState(root,finite):null;
  if(historicalReviewState)errors.push(...historicalReviewState.errors);
  const administrativeBindings=[],learnerBindings=[];
  for(const binding of finite.allFiniteImageBindings){
    const role=heldAdministrativeBindingRole(binding,{assetPaths,state:historicalReviewState});
    if(role)administrativeBindings.push({...binding,role});else learnerBindings.push(binding);
  }
  const finitePaths=new Set(learnerBindings.map(row=>row.path));
  if(historicalReviewState)historicalReviewState.summary.exactRetainedPurposeBindings=fingerprint(administrativeBindings);
  for(const asset of [...assets].sort((a,b)=>a.path.localeCompare(b.path))){
    const item=byPath.get(asset.path),result=checkHeldSourceEligibility({asset,inventoryItem:item,rawBooks,runtimePaths,finitePaths,reachable,dynamicRuntimePaths,historicalReviewState});
    const absolute=item?.absolutePath;
    if(!result.valid)errors.push({path:asset.path,reason:result.reason});
    rows.push({id:asset.id,path:asset.path,kind:asset.kind,sha256:absolute&&fs.existsSync(absolute)?hash(fs.readFileSync(absolute)):null,sources:item?.sources||[],eligibility:result});
  }
  const files=sourceFiles(root),toolFiles=TOOLS.map(p=>({path:p,sha256:hash(fs.readFileSync(path.join(root,p)))}));
  if(!same(filesBefore,files)||!same(toolsBefore,toolFiles))errors.push('source/tool bytes changed during held-source evaluation; retry only after current consumer changes are complete');
  const report={kind:'app-visual-held-source-proof-v1',assetDefinitions:hash(JSON.stringify(assets)),assets:rows,
    graph:{...fingerprint(graph.modules),modules:graph.modules,edges:fingerprint(graph.edges),issues:graph.issues,dynamic:graph.dynamic},
    runtimeBooks:{...fingerprint([...runtimePaths].sort()),books:runtime.length,bindings:fingerprint(runtimeBindings),publicIndexBindings:fingerprint(indexBindings)},
    dynamicArtworkLoaders:{paths:[...dynamicRuntimePaths].sort(),...fingerprint([...dynamicRuntimePaths].sort()),sources:['src/components/quest/bookCharacterAvatar.js','src/features/soundSeekers/rounded/campaignPlayfield.js']},
    finite:{allBindings:finiteFingerprint.allBindings,positiveBindings:finiteFingerprint.positiveBindings,coverage:finiteFingerprint.coverage,historicalBranches:finiteFingerprint.historicalBranches,evaluator:finiteFingerprint.evaluator},
    historicalAdministrativeSources:historicalReviewState?.summary||null,
    runtimeSources:{...fingerprint(files),files},tools:toolFiles,
    policies:POLICY.map(p=>({path:p,sha256:hash(fs.readFileSync(path.join(root,p)))})),errors};
  return report;
}

export function validateAppVisualHeldSources({registry,currentProof,records,inventory}={}){
  const failures=[],held=new Map(),fail=message=>failures.push(message);
  if(registry?.schemaVersion!==1||!Array.isArray(registry.assets))return {failures:['malformed held-source registry'],held};
  const candidates=registry.assets,ids=new Set(),paths=new Set();
  for(const a of candidates){
    if(!a||!/^[a-z0-9][a-z0-9-]*$/.test(a.id)||ids.has(a.id)||paths.has(a.path)||typeof a.path!=='string'||path.posix.normalize(a.path)!==a.path||!/^\/(?:images|guided-reading|game-assets|media)\//.test(a.path)||!/^([a-f0-9]{64})$/.test(a.sha256))fail('malformed or duplicate held-source asset');
    ids.add(a?.id);paths.add(a?.path);
  }
  if(failures.length)return {failures,held};
  if(!candidates.length){if(records.some(r=>r.status==='held-source'))fail('held-source records have no exact disposition');return {failures,held};}
  if(!currentProof||currentProof.kind!=='app-visual-held-source-proof-v1'||currentProof.errors?.length!==0||!same(registry.proof,currentProof))fail('held-source proof is absent, invalid, or stale; rerun the current evaluator after reviewing source changes');
  if(currentProof?.assetDefinitions!==hash(JSON.stringify(candidates)))fail('held-source definitions changed after proof');
  const proofRows=new Map((currentProof?.assets||[]).map(a=>[a.path,a]));
  const recordMap=new Map(records.map(r=>[r.path,r])),inventoryMap=new Map(inventory.map(r=>[r.path,r]));
  for(const asset of candidates){
    const proof=proofRows.get(asset.path),record=recordMap.get(asset.path);
    if(!inventoryMap.has(asset.path)||!proof?.eligibility?.valid||proof.sha256!==asset.sha256||proof.id!==asset.id||proof.kind!==asset.kind)fail(asset.path+': current source/bytes/eligibility do not match disposition');
    if(record?.status!=='held-source'||record.sourceDispositionId!==asset.id||record.sha256!==asset.sha256)fail(asset.path+': missing exact held-source review record');
    else held.set(asset.path,asset);
  }
  for(const record of records)if(record.status==='held-source'&&!paths.has(record.path))fail(record.path+': unregistered held-source status');
  return {failures,held};
}
