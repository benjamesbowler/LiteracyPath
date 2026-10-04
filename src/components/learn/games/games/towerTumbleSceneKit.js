import manifest from '../../../../../source-art/arcade/physical-worlds/tower-tumble/scene-kit-v1.json';
import { preloadPhysicalPalArt, drawPhysicalPalArt } from '../shared/physicalPalArt.js';

// Original source artwork and measured atlas rectangles have one authoring
// authority. Runtime never calls a generator or chooses a learning response.
const decodedImages = new Map();
export const TOWER_TUMBLE_SCENE_KIT = manifest;

function decodeImage(url) {
  if (typeof Image === 'undefined') return Promise.resolve(null);
  if (!decodedImages.has(url)) decodedImages.set(url, new Promise(resolve => {
    const image = new Image(); let finished = false;
    const finish = value => {
      if (finished) return; finished = true; clearTimeout(timeout);
      image.onload = image.onerror = null;
      if (!value) decodedImages.delete(url);
      resolve(value);
    };
    const timeout = setTimeout(() => finish(null), 8000);
    image.onload = async () => {
      try { await image.decode(); } catch { /* Loaded browsers without decode still work. */ }
      finish(image.naturalWidth ? image : null);
    };
    image.onerror = () => finish(null); image.src = url;
  }));
  return decodedImages.get(url);
}

export async function loadTowerTumbleSceneKit(world = 'meadow') {
  const asset = id => manifest.assets.find(item => item.id === id);
  const [materials, props, landscape, pal] = await Promise.all([
    decodeImage(asset('materials-atlas-v1').runtime),
    decodeImage(asset('props-atlas-v1').runtime),
    decodeImage(asset(`${world}-landscape-v1`).runtime),
    // A stalled character asset retains the complete geometry recovery path.
    Promise.all([preloadPhysicalPalArt(world),preloadPhysicalPalArt(world,{actions:['tools']})]).then(([image])=>image),
  ]);
  return { world, materials, props, landscape, pal,
    delivery:{materials:materials?'delivered':'unavailable',props:props?'delivered':'unavailable',landscape:landscape?'delivered':'unavailable',pal:pal?'delivered':'unavailable'} };
}

export function cropTowerArt(image, bounds) {
  if (!image || !bounds) return null;
  const [x,y,right,bottom] = bounds, canvas = document.createElement('canvas');
  canvas.width = right-x; canvas.height = bottom-y;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image,x,y,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
  return canvas;
}

export function towerArtTexture(THREE, image, bounds, { repeat=[1,1], alpha=false } = {}) {
  const source = bounds ? cropTowerArt(image,bounds) : image;
  if (!source) return null;
  const texture = source === image ? new THREE.Texture(source) : new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = alpha ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  texture.repeat.set(...repeat); texture.anisotropy = 2;
  texture.generateMipmaps = !alpha;
  texture.minFilter = alpha ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
  return texture;
}

export function towerBrickCanvas(kit, chunk) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const bounds = manifest.materials.blankBrickFace;
  if (kit?.materials) context.drawImage(kit.materials,bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1],0,0,256,256);
  else { context.fillStyle='#d5a181';context.fillRect(0,0,256,256); }
  // This is a response grapheme painted at runtime, never a baked target word.
  const bevel = context.createLinearGradient(0,0,256,256);
  bevel.addColorStop(0,'rgba(255,241,216,.55)');bevel.addColorStop(.12,'rgba(255,241,216,.03)');
  bevel.addColorStop(.82,'rgba(47,31,25,.02)');bevel.addColorStop(1,'rgba(47,31,25,.5)');
  context.fillStyle=bevel;context.fillRect(0,0,256,256);
  context.strokeStyle='rgba(83,53,37,.6)';context.lineWidth=5;context.strokeRect(4,4,248,248);
  context.font=`600 ${chunk.length>1?116:148}px Fredoka,Nunito,sans-serif`;
  context.textAlign='center';context.textBaseline='middle';
  context.fillStyle='#fff0d9';context.fillText(chunk,129,144);
  context.fillStyle='#352920';context.fillText(chunk,128,141);
  return canvas;
}

export function drawTowerPal(context, kit, x, baseline, height, options = {}) {
  if (!kit?.pal) return false;
  return drawPhysicalPalArt(context,{world:kit.world,x,y:baseline,height,...options});
}
