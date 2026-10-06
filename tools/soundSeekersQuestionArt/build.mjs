import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { campaignDisplayChoices, campaignSceneDescriptor, campaignDestinationAppearance, campaignPropAppearance } from '../../src/features/soundSeekers/rounded/campaignPresentation.js';
import { campaignQuestionImage, campaignQuestionArtSignature, CAMPAIGN_QUESTION_ART_SIZE } from '../../src/features/soundSeekers/rounded/campaignQuestionArt.js';
import { CAMPAIGN_OBJECT_ROLES } from '../../src/features/soundSeekers/v3/content/campaignLearningPacks.js';
import { CAST } from '../../src/features/soundSeekers/v3/content/cast.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sourceRoot = path.join(root, 'public/game-assets/sound-seekers/question-art');
const outputRoot = path.join(root, 'public/images/sound-seekers/questions');
const { width: WIDTH, height: HEIGHT } = CAMPAIGN_QUESTION_ART_SIZE;
const clear = { r: 255, g: 255, b: 255, alpha: 0 };
const sprites = new Map(), scaled = new Map();
const spriteKey = (kind, attrs = {}) => {
  const values = Object.fromEntries(Object.entries(attrs).filter(([key]) => ['colour', 'shape', 'surface', 'material', 'stripeColour', 'open', 'direction', 'lighting'].includes(key)));
  // These are exact natural colours/materials of the corresponding source,
  // not guesses from words, an answer key, or an unrelated media fallback.
  if ((kind === 'leaf' && values.colour === 'green') || (kind === 'feather' && values.colour === 'white') || (kind === 'carrot' && values.colour === 'orange')) delete values.colour;
  if ((kind === 'dock' && values.material === 'wood')) delete values.material;
  if ((kind === 'gate' && values.open === false) || (kind === 'seat' && values.open === true)) delete values.open;
  if (kind === 'rock' && !Object.keys(values).length) kind = 'stone';
  if (kind === 'berry' && !values.colour) values.colour = 'red';
  if (kind === 'flower' && !values.colour) values.colour = 'yellow';
  if (kind === 'bay' && !values.colour) values.colour = 'red';
  const suffix = Object.entries(values).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(',');
  return kind + (suffix ? `:${suffix}` : '');
};

async function register(key, input, rect) {
  const image = sharp(input).extract(rect).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  // Select the atlas object's substantial alpha components. Tiny fragments
  // from an adjacent cell never become part of its registered source frame.
  const seen = new Uint8Array(info.width * info.height), components = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || data[start * 4 + 3] <= 40) continue;
    const stack = [start]; seen[start] = 1;
    let area = 0, left = info.width, right = 0, top = info.height, bottom = 0;
    while (stack.length) {
      const pixel = stack.pop(), x = pixel % info.width, y = Math.floor(pixel / info.width);
      area++; left = Math.min(left,x); right = Math.max(right,x); top = Math.min(top,y); bottom = Math.max(bottom,y);
      for (const next of [x ? pixel-1 : -1, x < info.width-1 ? pixel+1 : -1, y ? pixel-info.width : -1, y < info.height-1 ? pixel+info.width : -1]) {
        if (next < 0 || seen[next] || data[next*4+3] <= 40) continue;
        seen[next] = 1; stack.push(next);
      }
    }
    components.push({area,left,right,top,bottom});
  }
  const largest = Math.max(...components.map(part=>part.area));
  const retained = components.filter(part=>part.area >= Math.max(48, largest * .02));
  let left = Math.min(...retained.map(part=>part.left)), top = Math.min(...retained.map(part=>part.top));
  const right = Math.max(...retained.map(part=>part.right)), bottom = Math.max(...retained.map(part=>part.bottom));
  if (right <= left || bottom <= top) throw new Error(`Empty source illustration: ${key}`);
  const width = right - left + 1, height = bottom - top + 1;
  const png = await sharp(data, { raw: info }).extract({ left, top, width, height }).png().toBuffer();
  sprites.set(key, { png, width, height });
}

const sheets = JSON.parse(await fs.readFile(new URL('sources.json', import.meta.url)));
for (const sheet of sheets) {
  const input = path.join(sourceRoot, `${sheet.name}.png`), meta = await sharp(input).metadata();
  if (!meta.hasAlpha) throw new Error(`Source must retain genuine alpha: ${input}`);
  const columns = sheet.columns || 4, rows = sheet.rows || 4;
  for (const [index, key] of sheet.cells.entries()) {
    const x = Math.floor(index % columns * meta.width / columns), y = Math.floor(Math.floor(index / columns) * meta.height / rows);
    const right = Math.floor((index % columns + 1) * meta.width / columns), bottom = Math.floor((Math.floor(index / columns) + 1) * meta.height / rows);
    const [kind, fields] = key.split(':');
    const attrs = Object.fromEntries((fields || '').split(',').filter(Boolean).map(field => field.split('=')));
    const rect = sheet.rects?.[key] || { left: x, top: y, width: right - x, height: bottom - y };
    await register(spriteKey(kind, attrs), input, rect);
  }
}

// Retain the existing owned painted objects for the roles already illustrated.
const learning = {
  button: [55,78,239,239], ribbon: [358,70,283,258], seat: [681,27,229,319], tree: [988,19,300,336],
  pond: [20,381,338,240], towel: [18,646,312,243], soap: [370,677,264,183], cloth: [673,655,303,254], brush: [1012,680,277,214],
  ball: [48,920,233,238], cushion: [328,924,313,246], hat: [655,941,334,220], bag: [1024,907,245,259]
};
for (const [key, [left, top, width, height]] of Object.entries(learning)) await register(key, path.join(root, 'public/game-assets/sound-seekers/campaign/environment/learning-props.png'), { left, top, width, height });
for (const [key, rect] of Object.entries({ basket: [983,332,227,266], lantern: [77,627,150,282], bucket: [356,627,226,284], wheel: [356,943,225,282], ladder: [690,940,167,289], sign: [30,336,248,253], lever: [356,329,223,281], workbench:[943,966,297,235] })) {
  const [left, top, width, height] = rect;
  await register(key, path.join(root, 'public/game-assets/sound-seekers/campaign/environment/puzzle-props.png'), { left, top, width, height });
}
for (const [id, cast] of Object.entries(CAST)) {
  const input = path.join(root, 'public', cast.sprite);
  const meta = await sharp(input).metadata();
  await register(`pal-${id}`, input, { left: 0, top: 0, width: meta.width, height: meta.height });
}

function dimensions(sprite, width, attrs = {}, maxHeight = 280) {
  attrs = campaignPropAppearance(sprite.key?.split(':')[0], attrs);
  const size = { small: .60, little: .60, large: 1.14, big: 1.14 }[attrs.sizeVariant] || 1;
  const wide = { wide: 1.20, narrow: .65 }[attrs.widthVariant || attrs.sizeVariant] || (attrs.lengthVariant === 'long' ? 1.35 : 1);
  const tall = { long: 1.25, short: .62, tall: 1.25 }[attrs.heightVariant || attrs.sizeVariant] || 1;
  const baseWidth = Math.min(width, maxHeight * sprite.width / sprite.height);
  return { width: Math.round(baseWidth * size * wide), height: Math.round(baseWidth * sprite.height / sprite.width * size * tall) };
}

function source(kind, attrs = {}) {
  const key = spriteKey(kind, attrs), sprite = sprites.get(key);
  if (!sprite) throw new Error(`Missing exact painted source: ${key}`);
  return { key, ...sprite };
}

async function layer(layers, kind, attrs, x, feet, width, { maxHeight = 280, clip = null, explicitKey = '' } = {}) {
  const sprite = explicitKey ? { key: explicitKey, ...sprites.get(explicitKey) } : source(kind, attrs);
  if (!sprite.png) throw new Error(`Missing exact painted source: ${explicitKey}`);
  const dims = dimensions(sprite, width, attrs, maxHeight), cacheKey = `${sprite.key}:${dims.width}:${dims.height}`;
  if (!scaled.has(cacheKey)) scaled.set(cacheKey, sharp(sprite.png).resize(dims.width, dims.height).png().toBuffer());
  let input = await scaled.get(cacheKey), left = Math.round(x - dims.width / 2), top = Math.round(feet - dims.height);
  if (clip) {
    const offset = Math.max(0, Math.min(dims.height - 1, Math.round(clip * dims.height)));
    input = await sharp(input).extract({ left: 0, top: offset, width: dims.width, height: dims.height - offset }).png().toBuffer();
    top += offset;
  }
  const m = await sharp(input).metadata();
  if (left < 0 || top < 0 || left + m.width > WIDTH || top + m.height > HEIGHT) throw new Error(`Clipped illustration ${sprite.key}: ${left},${top},${m.width},${m.height}`);
  layers.push({ input, left, top });
  return { x, feet, top: feet - dims.height, ...dims };
}

const SURFACE = { rail:.15, stool:.12, shelf:.13, bed:.37, seat:.60, bench:.58, rack:.52, bridge:.57, dock:.30, raft:.33, cart:.38, ledge:.22, stair:.20, ladder:.20, gate:.18, tree:.48, root:.30, post:.12, rock:.17, stone:.17, tray:.63, basket:.60, nest:.58, boat:.62, pot:.33, bay:.76 };
const FRONT = { tray:.66, basket:.62, nest:.57, boat:.69, pot:.42, bay:.82 };
const container = new Set(Object.keys(FRONT));

async function relationScene(layers, kind, attrs, landmark, relation, x = 240, width = 285) {
  let ref = typeof landmark === 'string' ? { kind: landmark } : landmark;
  if(relation==='on'&&ref.kind==='shelf'&&attrs.elevation) ref={...ref,elevation:attrs.elevation};
  if(kind==='shelf'&&attrs.elevation&&relation==='beside'){
    await layer(layers,'',{},240,381,421,{explicitKey:'wall-floor',maxHeight:350});
    const feet={high:183,middle:265,low:348}[attrs.elevation];
    const shelf=await layer(layers,'shelf',{},240,feet,292,{maxHeight:86});
    await layer(layers,ref.kind,ref,240,shelf.top+shelf.height*.12,95,{maxHeight:80});
    return shelf;
  }
  let special = relation === 'under' && ['root','post','pillow','lantern','tree'].includes(ref.kind) ? `${ref.kind}-under` : '';
  // A closed lid makes ON physically different from the open container used
  // for IN. Place the object on the clear front lid, away from its handle.
  if (relation === 'on' && ref.kind === 'basket') special = 'basket-with-lid';
  if (relation === 'on' && ref.kind === 'rail' && ['towel','cloth'].includes(kind)) {
    return layer(layers, '', {}, x, 352, width, { explicitKey: `${kind}-on-rail`, maxHeight: 286 });
  }
  const beside = relation === 'beside';
  const hostX = beside ? 154 : x, hostWidth = beside ? 225 : width;
  let feet = relation === 'above' ? 300 : relation === 'below' ? 268 : 353;
  if (ref.kind === 'shelf') feet = relation === 'above' ? 300 : relation === 'on' ? 267 : 226;
  if(ref.elevation){await layer(layers,'',{},240,381,421,{explicitKey:'wall-floor',maxHeight:350}); feet=ref.elevation==='high'?212:ref.elevation==='middle'?286:353;}
  const host = await layer(layers, ref.kind, ref, hostX, feet, hostWidth, { explicitKey: special, maxHeight: ['above','below'].includes(relation) ? 125 : 275 });
  const surface = host.top + host.height * (special === 'basket-with-lid' ? .40 : SURFACE[ref.kind] || .24);
  let objectX = beside ? 369 : x, objectFeet = 353, objectWidth = beside ? 132 : 133;
  if (relation === 'on') objectFeet = surface + 3;
  if (special === 'basket-with-lid') { objectX = x - host.width * .18; objectWidth = Math.min(96, host.width * .35); }
  if (relation === 'in') { objectFeet = surface + host.height * .19; objectWidth = Math.min(140, host.width * .45); }
  if (relation === 'above') { objectFeet = host.top - 20; objectWidth = 106; }
  if (relation === 'below') { objectFeet = 366; objectWidth = 98; }
  if (relation === 'under') {
    objectWidth = ['tree','shade','root','post','lantern','shelf'].includes(ref.kind) ? 112 : 88;
    if (ref.kind === 'tree') objectX = x + 62;
    if (ref.kind === 'lantern') objectX = x + 42;
    if (ref.kind === 'pillow') objectX = x - 44;
  }
  if (relation === 'behind') { objectX = x + 80; objectFeet = host.top + host.height * .57; objectWidth = 136; }
  if (relation === 'behind') {
    layers.pop();
    await layer(layers, kind, attrs, objectX, objectFeet, objectWidth, { maxHeight: 135 });
    return layer(layers, ref.kind, ref, hostX, feet, hostWidth, { maxHeight: 275 });
  }
  const count=attrs.count||1;
  let object;
  for(let index=0;index<count;index++) object=await layer(layers, kind, { ...attrs, elevation: undefined }, objectX+(index-(count-1)/2)*56, objectFeet, attrs.count?48:objectWidth, { maxHeight: relation === 'under' ? 86 : relation === 'on' ? Math.min(112, Math.max(42, (surface - 20) / 1.55)) : 140 });
  if (relation === 'in' && FRONT[ref.kind]) await layer(layers, ref.kind, ref, hostX, feet, hostWidth, { clip: FRONT[ref.kind], maxHeight: 275 });
  return object;
}

async function render(descriptor) {
  const layers = [], a = descriptor.appearance || {}, kind = descriptor.kind;
  const attributes = Object.fromEntries(Object.entries(a).filter(([key]) => !['kind','relation','landmark','scenery','residentId'].includes(key)));
  if (a.relation && a.landmark) {
    const ref = typeof a.landmark === 'string' ? {kind:a.landmark} : a.landmark;
    if (descriptor.destination && kind === ref.kind) {
      await relationScene(layers, descriptor.carriedKind, {}, campaignDestinationAppearance(descriptor).landmark, a.relation);
    } else {
      const host = await relationScene(layers, kind, attributes, ref, a.relation);
      // A destination can itself be above/below/beside another landmark.
      // Preserve that real destination instead of replacing it by the carrier.
      if (descriptor.destination && descriptor.carriedKind) await layer(layers, descriptor.carriedKind, {}, host.x, host.top+host.height*(SURFACE[kind]||.72), 70, { maxHeight: Math.min(65,host.top-15) });
    }
  } else if (a.ordinal) {
    for (let index = 0; index < 2; index++) await layer(layers, kind, {}, 129 + index * 222, 336, 194, { maxHeight: 182 });
    if (descriptor.carriedKind) await layer(layers, descriptor.carriedKind, {}, 129 + (Number(a.ordinal) - 1) * 222, 244, 84, { maxHeight: 84 });
  } else {
    if (a.elevation) await layer(layers, '', {}, 240, 381, 421, { explicitKey:'wall-floor', maxHeight:350 });
    for (const scenery of a.scenery || []) await layer(layers, scenery.kind === 'tree' ? 'tree-under' : scenery.kind, {}, scenery.kind === 'sun' ? 378 : scenery.kind === 'pond' ? 346 : 225, scenery.kind === 'sun' ? 118 : 350, scenery.kind === 'sun' ? 90 : scenery.kind === 'pond' ? 240 : 320, { maxHeight:305 });
    const count = a.count || 1, width = a.count ? 117 : 232;
    const feet = a.elevation ? {high:164,middle:256,low:347}[a.elevation] : 337;
    for (let index = 0; index < count; index++) await layer(layers, kind, attributes, 240 + (index - (count-1)/2) * 135, feet, width, { maxHeight:a.elevation ? 122 : 255 });
    if (descriptor.destination && descriptor.carriedKind) {
      if (container.has(kind) && !a.scenery) {
        layers.pop();
        await relationScene(layers, descriptor.carriedKind, {}, {kind,...attributes}, 'in');
      } else await layer(layers, descriptor.carriedKind, {}, 325, 360, 79, {maxHeight:76});
    }
  }
  const owner = descriptor.residentId || a.residentId || a.landmark?.residentId;
  if (owner) await layer(layers, `pal-${owner}`, {}, 405, 133, 82, { maxHeight: 108 });
  if (a.worldId) await layer(layers, {meadow:'flower',dino:'fern',moonwood:'lantern'}[a.worldId], {}, 405, 139, 78, {maxHeight:105});
  if (a.accessory) await layer(layers, a.accessory.kind, a.accessory, 280, 283, 80, {maxHeight:77});
  const file = path.join(root, 'public', campaignQuestionImage(descriptor));
  await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: clear } }).composite(layers).webp({quality:88,alphaQuality:100}).toFile(file);
}

export function collectQuestionArtDescriptors() {
  const descriptors = new Map(), progress = { targets: {} };
  for (const mission of CAMPAIGN_MISSIONS) for(const replayOrdinal of [0,1,2]) for (const beat of buildCampaignMission(mission, progress, {replayOrdinal}).beats) {
    if (beat.mechanic === 'sound_signpost') for (const id of beat.targetIds) progress.targets[id] = {taught:true};
    if (beat.view.objectId) { const d={kind:beat.view.objectId}; descriptors.set(campaignQuestionArtSignature(d),d); }
    for (const choice of campaignDisplayChoices(beat)) {
      const d=campaignSceneDescriptor(beat,choice);
      if (d) descriptors.set(campaignQuestionArtSignature(d),d);
    }
  }
  for (const kind of [...CAMPAIGN_OBJECT_ROLES,'basket','parcel']) {const d={kind};descriptors.set(campaignQuestionArtSignature(d),d);}
  return [...descriptors.values()];
}

await fs.mkdir(outputRoot,{recursive:true});
const sceneRoot=path.join(sourceRoot,'props');
await fs.mkdir(sceneRoot,{recursive:true});
const sceneKinds=['tree','tray','lever','door','basket','lantern','crate','ladder','workbench','hedge','raft','dock','plank',...[...sprites.keys()].filter(key=>key.startsWith('scene-'))];
const sceneArt={};
for(const kind of sceneKinds){
  const sprite=sprites.get(kind), file=`${kind}.webp`;
  await sharp(sprite.png).resize({width:360,height:360,fit:'inside',withoutEnlargement:true}).webp({quality:90,alphaQuality:100}).toFile(path.join(sceneRoot,file));
  sceneArt[kind]={source:`/game-assets/sound-seekers/question-art/props/${file}`,aspect:sprite.width/sprite.height};
}
await fs.writeFile(path.join(root,'src/features/soundSeekers/rounded/campaignSceneArt.generated.json'),JSON.stringify(sceneArt,null,2)+'\n');
const landscape=JSON.parse(await fs.readFile(new URL('landscape-source.json',import.meta.url))), input=path.join(sourceRoot,landscape.file), meta=await sharp(input).metadata();
for(const [index,name] of landscape.rows.entries()){
  const top=Math.floor(index*meta.height/3)+3,bottom=Math.floor((index+1)*meta.height/3)-3;
  await sharp(input).extract({left:0,top,width:meta.width,height:bottom-top}).webp({quality:88}).toFile(path.join(sourceRoot,`landscape-${name}.webp`));
}
const descriptors=collectQuestionArtDescriptors(), collisions=new Set(), failures=[];
for (const descriptor of descriptors) {
  const file=campaignQuestionImage(descriptor);
  if(collisions.has(file))throw new Error(`Question-art signature collision: ${file}`);
  collisions.add(file);
}
let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<descriptors.length){
    const descriptor=descriptors[cursor++];
    try {await render(descriptor);} catch(error) {failures.push(`${descriptor.label || descriptor.kind}: ${error.message}`);}
  }
}));
if(failures.length) throw new Error(`${failures.length} unresolved scene images:\n${[...new Set(failures)].join('\n')}`);
// Remove only generated files no longer selected by the current question corpus.
for(const file of await fs.readdir(outputRoot))if(file.endsWith('.webp')&&!collisions.has(`/images/sound-seekers/questions/${file}`))await fs.unlink(path.join(outputRoot,file));
console.log(`Rendered ${descriptors.length} exact question images from ${sprites.size} painted sources.`);
