import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createWoodMaterial } from '../shared/physicalArcadeWorld.js';
import { physicalThemeForDifficulty } from '../shared/physicalArcadeThemes.js';

// Shared by the live world and the offline thumbnail renderer. Never maintain
// a second approximation of the child's actual building pieces.
export function partMesh(THREE, block, theme = physicalThemeForDifficulty('easy'), resources = { get: (_key, factory) => factory() }) {
  const group = new THREE.Group();
  const box = (...sizes) => resources.get(`box:${sizes.join(':')}`, () => new RoundedBoxGeometry(...sizes, 1, Math.min(...sizes) * .12));
  const sphere = (...sizes) => resources.get(`sphere:${sizes.join(':')}`, () => new THREE.SphereGeometry(...sizes));
  const cylinder = (...sizes) => resources.get(`cylinder:${sizes.join(':')}`, () => new THREE.CylinderGeometry(...sizes));
  const wood = () => resources.get('wood', () => resources.material?.('plank', theme.id === 'moonwood' ? '#cfccd9' : '#fff2d6') || createWoodMaterial(THREE, { color: theme.wood }));
  const cream = () => resources.get('cream', () => new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#e1eadb' : '#f4e5b5', roughness: .85 }));
  const add = (geometry, material, x = 0, y = 0, z = 0, parent = group) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  if (block.type === 'wood' || block.type === 'stone') {
    add(box(.92, .94, .92), block.type === 'wood' ? wood() : resources.get('stone', () => resources.material?.('stone', '#fff9ed') || new THREE.MeshStandardMaterial({ color: theme.stone, roughness: .95 })), 0, .47);
    if (block.type === 'stone') for (const [x, y] of [[-.25, .25], [.2, .6]]) add(box(.38, .025, .035), resources.get('stone-mark', () => new THREE.MeshStandardMaterial({ color: '#829399' })), x, y, .47);
  } else if (block.type === 'bridge') {
    for (let i = 0; i < 5; i++) add(box(.95, .16, .17), wood(), 0, .09, -.36 + i * .18);
    for (const z of [-.42, .42]) { add(box(1.05, .09, .09), wood(), 0, .55, z); for (const x of [-.43, .43]) add(box(.09, .6, .09), wood(), x, .3, z); }
  } else if (block.type === 'roof') {
    const roof = resources.get('roof-shingles', () => resources.material?.('shingle', theme.id === 'moonwood' ? '#809ec1' : theme.id === 'dino' ? '#d4bf8b' : '#ffefc9') || new THREE.MeshStandardMaterial({ color: '#d96845', roughness: .8 }));
    const left = add(box(.75, .13, 1.2), roof, -.25, .27); left.rotation.z = .55;
    const right = add(box(.75, .13, 1.2), roof, .25, .27); right.rotation.z = -.55;
    add(box(.11, .12, 1.26), roof, 0, .5);
    if (theme.id === 'dino') for (const z of [-.4, 0, .4]) add(box(1.16, .04, .07), cream(), 0, .27, z);
    if (theme.id === 'moonwood') add(sphere(.075, 8, 5), new THREE.MeshStandardMaterial({ color: theme.accent, emissive: theme.accent, emissiveIntensity: .3 }), 0, .58);
  } else if (block.type === 'window') {
    add(box(.92, .86, .15), wood(), 0, .43);
    add(box(.7, .63, .18), new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? theme.accent : '#8ed9eb', emissive: theme.id === 'moonwood' ? theme.accent : '#000000', emissiveIntensity: .35, metalness: .1, roughness: .25 }), 0, .45, .015);
    add(box(.06, .65, .2), cream(), 0, .45, .02); add(box(.72, .06, .2), cream(), 0, .45, .02);
  } else if (block.type === 'garden') {
    add(box(.95, .2, .95), wood(), 0, .1);
    add(box(.8, .04, .8), new THREE.MeshStandardMaterial({ color: '#775437' }), 0, .22);
    const plants = new THREE.Group(); plants.position.y = .23; group.add(plants); group.userData.gardenPlants = plants;
    const leafShape = new THREE.Shape(); leafShape.moveTo(0, 0); leafShape.bezierCurveTo(.14, .08, .16, .33, 0, .47); leafShape.bezierCurveTo(-.16, .33, -.14, .08, 0, 0);
    const leafGeometry = resources.get('garden-leaf', () => new THREE.ExtrudeGeometry(leafShape, { depth: .014, bevelEnabled: true, bevelSize: .008, bevelThickness: .006, bevelSegments: 1, steps: 1 }));
    const leafMaterial = resources.get('garden-leaf-material', () => new THREE.MeshStandardMaterial({ color: theme.id === 'moonwood' ? '#6daa97' : '#478849', roughness: .83 }));
    for (const [x, z] of [[-.22, -.2], [.2, -.2], [-.22, .2], [.2, .2]]) {
      add(cylinder(.025, .025, .28, 5), resources.get('garden-stems', () => new THREE.MeshStandardMaterial({ color: '#528d3d' })), x, .15, z, plants);
      add(sphere(.11, 6, 4), resources.get('garden-fruit', () => new THREE.MeshStandardMaterial({ color: theme.id === 'dino' ? '#71a34e' : theme.id === 'moonwood' ? '#b9a8e5' : '#efaa46' })), x, .31, z, plants);
      for (let leaf = 0; leaf < 4; leaf++) { const object = add(leafGeometry, leafMaterial, x, .12, z, plants); object.rotation.set(.62 + (leaf % 2) * .2, leaf * Math.PI / 2, .15); object.scale.set(.55, .65, .55); }
      if (theme.id === 'dino') { const leaf = add(box(.25, .025, .08), new THREE.MeshStandardMaterial({ color: theme.foliage }), x, .21, z, plants); leaf.rotation.z = .35; }
    }
    compactScenery(THREE, plants, resources, 'garden-plants');
  } else if (block.type === 'gate') {
    for (const x of [-.42, .42]) add(box(.13, 1, .13), wood(), x, .5);
    for (const y of [.3, .7]) add(box(.86, .09, .1), wood(), 0, y);
    add(box(.075, .82, .1), cream(), 0, .5);
  } else if (block.type === 'bed') {
    add(box(.8, .25, .98), wood(), 0, .2); add(box(.75, .16, .88), cream(), 0, .42);
    add(box(.7, .08, .25), new THREE.MeshStandardMaterial({ color: '#e5f5f1' }), 0, .55, -.28);
    const blanket = add(box(.75, .1, .58), new THREE.MeshStandardMaterial({ color: '#80bac5' }), 0, .53, .15); blanket.userData.keepDynamicMaterial = true; group.userData.bedBlanket = blanket;
  } else if (block.type === 'dam') {
    for (const x of [-.35, 0, .35]) add(box(.29, .95, .2), wood(), x, .45);
    for (const y of [.25, .7]) add(box(1, .12, .27), wood(), 0, y);
  } else if (block.type === 'channel') {
    const soil = new THREE.MeshStandardMaterial({ color: '#a98457', roughness: .96 });
    for (const x of [-.43, .43]) add(box(.13, .2, .99), soil, x, -.08);
  }
  group.position.set(block.x - 5, block.y + .035, block.z - 5); group.rotation.y = block.rotation * Math.PI / 2;
  group.userData.cell = { x: block.x, z: block.z }; return compactScenery(THREE, group, resources, `part-${block.type}`);
}

export function compactScenery(THREE, group, resources, kind) {
  const byMaterial = new Map(), retained = [];
  for (const mesh of group.children) {
    if (!mesh.isMesh || mesh.userData.keepDynamicMaterial) { retained.push(mesh); continue; }
    if (!byMaterial.has(mesh.material)) byMaterial.set(mesh.material, []); byMaterial.get(mesh.material).push(mesh);
  }
  const compact = [];
  for (const [material, meshes] of byMaterial) {
    const geometry = resources.get(`merged:${kind}:${material.uuid}`, () => {
      const parts = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
      const merged = mergeGeometries(parts, false); for (const part of parts) part.dispose(); return merged;
    });
    if (!geometry) return group;
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; compact.push(mesh);
  }
  group.clear(); group.add(...compact, ...retained); return group;
}
