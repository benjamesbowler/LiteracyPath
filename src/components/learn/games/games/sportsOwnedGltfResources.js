// These GLTF trees are independently parsed by one sports game owner. Their
// embedded image bitmaps are not shared caches; GPU Texture.dispose alone does
// not close ImageBitmap backing storage. Environment maps belong to the render
// pipeline and are deliberately left to that owner.
const disposedTrees=new WeakSet();
function releaseImage(image){
  if(typeof image.close==='function'){image.close();return 'bitmaps';}
  if(typeof image.getContext==='function'){image.width=image.height=1;return 'canvases';}
  if(typeof image.removeAttribute==='function'){image.removeAttribute('src');return 'imageElements';}
  return null;
}
export function disposeOwnedSportsTexture(texture){
  const data=texture.source?.data??texture.image,images=new Set((Array.isArray(data)?data:[data]).filter(Boolean));
  for(const image of images)releaseImage(image);
  texture.dispose();texture.source.data=null;
}
function releaseOwnedTree(root){
  if(!root)return null;
  const geometries=new Set(),materials=new Set(),textures=new Set(),images=new Set(),skeletons=new Set();
  root.traverse(node=>{
    if(node.isInstancedMesh)node.dispose();
    // Sprite's default quad is engine-shared, unlike a parsed GLTF geometry.
    if(node.geometry&&!node.isSprite)geometries.add(node.geometry);
    if(node.skeleton)skeletons.add(node.skeleton);
    for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[]){
      materials.add(material);
      for(const [key,value]of Object.entries(material))if(key!=='envMap'&&value?.isTexture)textures.add(value);
    }
  });
  for(const texture of textures){
    const data=texture.source?.data??texture.image;
    for(const image of Array.isArray(data)?data:[data])if(image)images.add(image);
  }
  let bitmaps=0,canvases=0,imageElements=0;
  for(const image of images){
    const kind=releaseImage(image);if(kind==='bitmaps')bitmaps++;else if(kind==='canvases')canvases++;else if(kind==='imageElements')imageElements++;
  }
  for(const texture of textures){texture.dispose();texture.source.data=null;}
  for(const material of materials)material.dispose();
  for(const geometry of geometries)geometry.dispose();
  for(const skeleton of skeletons)skeleton.dispose();
  root.clear();
  return {geometries:geometries.size,materials:materials.size,textures:textures.size,images:images.size,bitmaps,canvases,imageElements,skeletons:skeletons.size};
}
export function disposeOwnedSportsGltf(root){
  if(!root||disposedTrees.has(root))return null;
  disposedTrees.add(root);
  return releaseOwnedTree(root);
}

// These group roots are reused for the next real circuit. Clearing one owned
// generation makes a repeated release empty without poisoning later children
// in a global disposed-root cache. Canvas-required gates are separate owners.
export function disposeOwnedSportsPrimaryGroup(root){return releaseOwnedTree(root);}

// Word-label canvases belong to one generated gate set. A reset, saved restore
// or final exit retires that complete set; Canvas recovery itself still uses
// the active set and must not call this boundary.
export function disposeOwnedSportsWordGates(root,gates){
  const receipt=disposeOwnedSportsPrimaryGroup(root);
  for(const gate of gates){
    if(gate.mesh)delete gate.mesh.userData.sprite;
    gate.mesh=null;
  }
  gates.length=0;
  return receipt;
}
