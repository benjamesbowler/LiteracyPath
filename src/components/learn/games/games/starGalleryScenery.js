import { createRegisteredPalArtBank, registeredPalFrameGeometry } from '../shared/registeredPalArt.js';
import { GROVE_SCENERY_ASSETS } from './starGallerySceneryData.js';

const backgroundAtlas = asset => ({ ...asset, pixelsPerUnit: asset.height / 2.2, nominalHeight: 2.2,
  frames: [{ id: 'retained-complete-image', cell: [0, 0, asset.width, asset.height], anchor: [asset.width / 2, asset.height / 2], sockets: {} }] });
export function groveSceneryPlan(world) {
  return { world, groundTileWorldSize: 12,
    horizons: [{ x: 0, y: 12, z: -108, yaw: 0 }, { x: 0, y: 12, z: 108, yaw: Math.PI },
      { x: -138, y: 12, z: 0, yaw: Math.PI / 2 }, { x: 138, y: 12, z: 0, yaw: -Math.PI / 2 }],
    plants: [-72, -48, -24, 0, 24, 48, 72].flatMap((z,index) => [-1,1].flatMap(side => [
      { x: side * (8 + index % 3), z: z + side * 2, action: 'flower-bed', height: 2.7 + index % 2 * .4 },
      { x: side * (34 + index % 2 * 9), z: z + 7, action: 'sapling', height: 2.1 + index % 3 * .3 }
    ])) };
}

// One engine owns its texture instances and decoded-image references. These
// surfaces decorate the existing world; answer placement/collision are external.
export function createGroveSceneryDetails(THREE, { world, root, ground, paths, atlases }) {
  const plan = groveSceneryPlan(world), kit = atlases[`${world}-grove-kit`];
  const assets = { grass: GROVE_SCENERY_ASSETS['grass-albedo-v1'], soil: GROVE_SCENERY_ASSETS['soil-albedo-v1'],
    horizon: GROVE_SCENERY_ASSETS[`${world}-horizon-v1`] };
  const bank = createRegisteredPalArtBank({ ...Object.fromEntries(Object.entries(assets).map(([name,asset]) => [name,backgroundAtlas(asset)])), kit });
  const group = new THREE.Group(); group.name = 'Original grove route plants and boundary landscapes'; root.add(group);
  const images = {}, textures = new Set(), materials = new Set(), geometries = new Set(), replacedMaterials = new Set(), plantCards = [];
  const cameraQuaternion = new THREE.Quaternion(), parentQuaternion = new THREE.Quaternion();
  let disposed = false;
  function texture(image,repeat) {
    const map = new THREE.Texture(image); map.colorSpace = THREE.SRGBColorSpace; map.needsUpdate = true;
    if (repeat) { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(...repeat); }
    map.anisotropy = 4; textures.add(map); return map;
  }
  function replaceMap(mesh,map) {
    const material = mesh.material;
    if (material.map && !textures.has(material.map)) material.map.dispose();
    material.map = map; material.needsUpdate = true; replacedMaterials.add(material);
  }
  const ready = bank.preload().then(decoded => {
    if (disposed) return false;
    ['grass','soil','horizon','kit'].forEach((name,index) => { if(decoded[index]) images[name] = decoded[index]; });
    if (images.grass) { const map=texture(images.grass,[(236 + 20) / plan.groundTileWorldSize,(176 + 20) / plan.groundTileWorldSize]);map.offset.y=(1-map.repeat.y%1)%1;replaceMap(ground,map); }
    if (images.soil) { const map=texture(images.soil,[1,24]); paths.traverse(mesh => { if(mesh.isMesh)replaceMap(mesh,map); }); }
    if (images.horizon) {
      const map=texture(images.horizon),material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.025,depthWrite:false,side:THREE.FrontSide,toneMapped:false,fog:false});materials.add(material);
      const geometry=new THREE.PlaneGeometry(128 * images.horizon.width / images.horizon.height,128);geometries.add(geometry);
      for(const place of plan.horizons){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(place.x,place.y,place.z);mesh.rotation.y=place.yaw;mesh.renderOrder=-4;mesh.userData.groveAuthoredHorizon=true;group.add(mesh);}
    }
    if (images.kit) {
      const map=texture(images.kit),material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.04,depthWrite:true,side:THREE.DoubleSide,toneMapped:false});materials.add(material);
      const frames = new Map();
      for(const action of ['flower-bed','sapling']) {
        const frame=kit.frames.find(candidate=>candidate.action===action);if(!frame)continue;
        const registration=registeredPalFrameGeometry(kit,frame),geometry=new THREE.PlaneGeometry(...registration.scale),uv=geometry.attributes.uv,[l,t,r,b]=frame.cell;
        uv.setXY(0,l/kit.width,1-t/kit.height);uv.setXY(1,r/kit.width,1-t/kit.height);uv.setXY(2,l/kit.width,1-b/kit.height);uv.setXY(3,r/kit.width,1-b/kit.height);
        geometry.translate((.5-registration.center[0])*registration.scale[0],(.5-registration.center[1])*registration.scale[1],0);geometries.add(geometry);frames.set(action,geometry);
      }
      for(const plant of plan.plants){const geometry=frames.get(plant.action);if(!geometry)continue;
        const holder=new THREE.Group(),mesh=new THREE.Mesh(geometry,material);holder.position.set(plant.x,.025,plant.z);holder.scale.setScalar(plant.height/kit.nominalHeight);holder.add(mesh);group.add(holder);plantCards.push(holder);}
    }
    return Boolean(images.grass&&images.soil&&images.horizon&&images.kit);
  });
  return { ready, plan,
    update(camera) { if(disposed)return;camera.getWorldQuaternion(cameraQuaternion);group.getWorldQuaternion(parentQuaternion);parentQuaternion.invert();for(const card of plantCards)card.quaternion.copy(parentQuaternion).multiply(cameraQuaternion); },
    canvasAssets:()=>disposed?null:{images,plan,group,ground,paths,kit},
    inspect:()=>({world,delivery:bank.delivery(),plantCount:plantCards.length,horizonCount:group.children.filter(child=>child.userData.groveAuthoredHorizon).length,
      representation:'retained-authored-materials-and-world-placed-boundary-scenery',collisionObjectsAdded:0,disposed}),
    dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.clear();for(const material of replacedMaterials)if(textures.has(material.map))material.map=null;
      for(const map of textures)map.dispose();for(const material of materials)material.dispose();for(const geometry of geometries)geometry.dispose();bank.dispose();for(const name of Object.keys(images))delete images[name];}
  };
}
