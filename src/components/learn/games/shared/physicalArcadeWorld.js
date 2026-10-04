import { addAuthoredPalArt, animateAuthoredPalArt } from './physicalPalArt.js';

// Editable, original Meadow Pals geometry shared by the three physical Arcade
// worlds. +Z is the character's front; feet rest at y=0. Curriculum and game
// state remain in their own engines. These primitives add no asset download.
function clusteredOrbs(THREE, geometry, material, transforms, parent) {
  const cluster = new THREE.InstancedMesh(geometry, material, transforms.length);
  const pose = new THREE.Object3D();
  transforms.forEach(([x, y, z, sx, sy = sx, sz = sx], index) => {
    pose.position.set(x, y, z); pose.scale.set(sx, sy, sz); pose.updateMatrix();
    cluster.setMatrixAt(index, pose.matrix);
  });
  cluster.instanceMatrix.needsUpdate = true;
  cluster.castShadow = true; parent.add(cluster);
  return cluster;
}

export function createWoodMaterial(THREE, { color = '#a56b36', dark = false } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color; ctx.fillRect(0, 0, 128, 128);
    for (let index = 0; index < 26; index += 1) {
      ctx.strokeStyle = index % 3 ? 'rgba(68,36,15,.13)' : 'rgba(255,231,179,.18)';
      ctx.lineWidth = index % 5 ? 1 : 2; ctx.beginPath();
      for (let x = 0; x <= 128; x += 4) {
        const y = index * 5 + Math.sin(x / 26 + index) * 2.8;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  const map = ctx ? new THREE.CanvasTexture(canvas) : null;
  if (map) { map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; }
  return new THREE.MeshStandardMaterial({ map, color: map ? (dark ? '#b7a18e' : '#ffffff') : color, roughness: .83 });
}

export function createGraphemeTexture(THREE, text, { background = '#f7e0b1', color = '#372c26', transparent = false } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (!transparent) {
      ctx.fillStyle = background; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(98,59,29,.2)'; ctx.lineWidth = 7; ctx.strokeRect(8, 8, 240, 240);
    }
    ctx.fillStyle = color; ctx.font = `${String(text).length > 2 ? 98 : 134}px Fredoka, Nunito, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(text), 128, 141, 222);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMeadowTree(THREE, { height = 3.4, variant = 0 } = {}) {
  const tree = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#88613d', roughness: .95 });
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: variant % 3 === 1 ? '#96b35e' : variant % 3 === 2 ? '#537e52' : '#6f9b55', roughness: .91 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .22, height * .56, 12), trunkMaterial);
  trunk.position.y = height * .28; trunk.castShadow = true; tree.add(trunk);
  const cluster = new THREE.IcosahedronGeometry(height * .25, 2);
  clusteredOrbs(THREE, cluster, foliageMaterial,
    [[0,.74,0,1.15],[-.16,.65,.05,.93],[.17,.68,.03,.88],[.02,.89,-.06,.87],[0,.64,-.17,.91]]
      .map(([x,y,z,size]) => [x * height,y * height,z * height,size]), tree);
  return tree;
}

export function createBouncyFigure(THREE, { scale = 1 } = {}) {
  const root = new THREE.Group(); root.name = 'Bouncy';
  root.userData.characterId = 'bouncy';
  const fleece = new THREE.MeshStandardMaterial({ color: '#ffd254', roughness: .88 });
  const face = new THREE.MeshStandardMaterial({ color: '#ffe0a0', roughness: .86 });
  const innerEar = new THREE.MeshStandardMaterial({ color: '#efaf84', roughness: .9 });
  const brown = new THREE.MeshStandardMaterial({ color: '#684631', roughness: .7 });
  const dark = new THREE.MeshStandardMaterial({ color: '#261d1b', roughness: .4 });
  const white = new THREE.MeshStandardMaterial({ color: '#fffdf4', roughness: .47 });
  const scarf = new THREE.MeshStandardMaterial({ color: '#e34738', roughness: .8, side: THREE.DoubleSide });
  const metal = new THREE.MeshStandardMaterial({ color: '#bec9cf', metalness: .75, roughness: .3 });
  const sphere = new THREE.SphereGeometry(1, 12, 9);
  const orb = (material, x, y, z, sx, sy = sx, sz = sx, parent = root) => {
    const mesh = new THREE.Mesh(sphere, material); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const body = new THREE.Group(); body.position.y = 1.07; root.add(body);
  orb(fleece, 0, 0, 0, .41, .48, .33, body);
  const bodyCurls = [];
  for (let row = 0; row < 4; row += 1) for (let index = 0; index < 8; index += 1) {
    const angle = index / 8 * Math.PI * 2 + row * .29;
    const radius = row === 0 || row === 3 ? .27 : .35;
    bodyCurls.push([Math.sin(angle) * radius, -.32 + row * .21, Math.cos(angle) * radius * .8, .13 + (index % 3) * .01, .14, .13]);
  }
  clusteredOrbs(THREE, sphere, fleece, bodyCurls, body);
  const head = new THREE.Group(); head.position.set(0, 1.75, .06); root.add(head);
  orb(face, 0, 0, .10, .31, .36, .28, head);
  orb(face, 0, -.17, .34, .20, .135, .12, head);
  orb(brown, 0, -.11, .442, .064, .041, .029, head);
  for (const side of [-1, 1]) {
    orb(white, side * .126, .05, .347, .093, .12, .024, head);
    orb(dark, side * .126, .042, .374, .044, .064, .019, head);
    orb(white, side * .14, .071, .389, .014, .019, .007, head);
    const ear = orb(fleece, side * .37, -.08, .025, .125, .29, .08, head); ear.rotation.z = side * .62;
    const inside = orb(innerEar, side * .385, -.087, .093, .074, .205, .014, head); inside.rotation.z = side * .62;
    const brow = orb(brown, side * .13, .196, .338, .081, .013, .01, head); brow.rotation.z = side * .11;
  }
  const headCurls = [];
  for (let index = 0; index < 12; index += 1) {
    const angle = index / 12 * Math.PI * 2;
    headCurls.push([Math.cos(angle) * .245, .245 + Math.sin(angle) * .045, Math.sin(angle) * .19 + .035, .125, .127, .12]);
  }
  headCurls.push([0, .34, .035, .14, .14, .12]);
  clusteredOrbs(THREE, sphere, fleece, headCurls, head);
  const mouthPoints = [new THREE.Vector3(-.085,-.209,.412),new THREE.Vector3(0,-.24,.435),new THREE.Vector3(.09,-.203,.412)];
  const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mouthPoints), 8, .008, 5, false), brown); head.add(smile);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.235,.037,6,18), scarf); collar.rotation.x = Math.PI / 2; collar.position.set(0,1.44,.04); root.add(collar);
  const knot = orb(scarf, .16, 1.43, .253, .073, .069, .06);
  const tailShape = new THREE.Shape(); tailShape.moveTo(0,0); tailShape.quadraticCurveTo(.13,-.14,.16,-.30); tailShape.quadraticCurveTo(-.04,-.27,-.06,-.02); tailShape.closePath();
  const neckerchief = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), scarf); neckerchief.position.set(.15,1.40,.24); neckerchief.rotation.z = -.22; root.add(neckerchief);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .37, 1.27, .06); arm.rotation.z = side * .25; root.add(arm);
    orb(fleece, 0,-.16,.0,.104,.21,.105,arm); orb(brown,0,-.355,.01,.109,.10,.105,arm); arms.push(arm);
  }
  const legs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(side * .18, .6, .01); root.add(leg);
    const points = [];
    for (let index = 0; index <= 48; index += 1) {
      const t = index / 48, angle = t * Math.PI * 8;
      points.push(new THREE.Vector3(Math.cos(angle) * .069,-t * .38,Math.sin(angle) * .069));
    }
    const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.017,5,false),metal); coil.castShadow=true; leg.add(coil);
    orb(brown,0,-.475,.055,.145,.10,.21,leg); legs.push(leg);
  }
  orb(fleece, 0, 1.04, -.34, .135, .135, .13);
  root.scale.setScalar(scale);
  root.userData.rig = { body, head, leftArm: arms[0], rightArm: arms[1], leftLeg: legs[0], rightLeg: legs[1], neckerchief, knot, restBodyY: 1.07 };
  return root;
}

function palSculpt(THREE, name, scale) {
  const root = new THREE.Group(); root.name = name; root.userData.characterId = name.toLowerCase();
  root.scale.setScalar(scale);
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  const material = color => new THREE.MeshStandardMaterial({ color, roughness: .82 });
  const orb = (parent, paint, x, y, z, sx, sy = sx, sz = sx) => {
    const mesh = new THREE.Mesh(sphere, paint); mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const mesh = (parent, geometry, paint, x=0,y=0,z=0) => {
    const object = new THREE.Mesh(geometry, paint); object.position.set(x,y,z); object.castShadow = true; parent.add(object); return object;
  };
  const eyes = (head, y, z, irisColor) => {
    const white = material('#fffaf1'), iris = material(irisColor), dark = material('#29251c');
    for (const side of [-1,1]) {
      orb(head, white, side*.155,y,z,.105,.145,.04);
      orb(head, iris, side*.155,y-.014,z+.043,.065,.088,.022);
      orb(head, dark, side*.155,y-.014,z+.065,.035,.060,.012);
      orb(head, white, side*.135,y+.03,z+.079,.018,.025,.007);
    }
  };
  return { root, sphere, material, orb, mesh, eyes };
}

export function createChompyFigure(THREE, { scale = 1 } = {}) {
  const {root, material, orb, mesh, eyes} = palSculpt(THREE,'Chompy',scale);
  const orange = material('#ef9a32'), belly = material('#ffe3a0'), russet = material('#cf7131'), cream = material('#fff1d6');
  const mouth = material('#613521'), pink = material('#e99084');
  const body = new THREE.Group(); body.position.y = .88; root.add(body);
  orb(body,orange,0,0,-.04,.4,.53,.34); orb(body,belly,0,-.035,.256,.29,.38,.085);
  const head = new THREE.Group(); head.position.set(0,1.68,.08); root.add(head);
  orb(head,orange,0,0,0,.47,.46,.38); orb(head,orange,0,-.045,.24,.43,.26,.26);
  orb(head,mouth,0,-.17,.472,.278,.144,.025); orb(head,pink,0,-.245,.495,.14,.05,.015);
  eyes(head,.12,.338,'#704f31');
  for (const side of [-1,1]) orb(head,russet,side*.12,-.02,.493,.023,.025,.01);
  for (let index=0;index<5;index++) {
    const tooth = mesh(head,new THREE.ConeGeometry(.033,.075,8),cream,-.18+index*.09,-.102,.507); tooth.rotation.z = Math.PI;
  }
  for (const [x,y,size] of [[-.18,.36,.045],[.12,.35,.04],[.02,.41,.04],[-.27,.26,.034]]) orb(head,russet,x,y,.2,size,size*.55,.015);
  for (const [x,y] of [[0,.43],[-.24,.39],[.24,.39]]) {
    const spike = mesh(head,new THREE.ConeGeometry(.078,.17,9),orange,x,y,-.06); spike.rotation.z = -x*.6;
  }
  const tail = new THREE.Group(); tail.position.set(0,.55,-.28); root.add(tail);
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.05,-.3),new THREE.Vector3(.12,.02,-.63),new THREE.Vector3(.21,.17,-.86)]);
  const tailGeometry = new THREE.TubeGeometry(tailCurve,24,.145,8,false), positions = tailGeometry.attributes.position;
  for (let ring=0;ring<=24;ring++) {
    const center = tailCurve.getPointAt(ring/24), taper = 1-ring/24*.9;
    for(let segment=0;segment<=8;segment++) {
      const index=ring*9+segment;
      positions.setXYZ(index,center.x+(positions.getX(index)-center.x)*taper,center.y+(positions.getY(index)-center.y)*taper,center.z+(positions.getZ(index)-center.z)*taper);
    }
  }
  tailGeometry.computeVertexNormals(); mesh(tail,tailGeometry,orange);
  const collar = mesh(root,new THREE.TorusGeometry(.27,.035,8,24),cream,0,1.3,.11); collar.rotation.x=Math.PI/2;
  const bib = new THREE.Shape(); bib.moveTo(-.24,0);bib.quadraticCurveTo(0,-.26,.24,0);bib.lineTo(-.24,0);
  const neckerchief = mesh(root,new THREE.ExtrudeGeometry(bib,{depth:.025,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2,steps:1}),cream,0,1.3,.32);
  const arms=[],legs=[];
  for(const side of [-1,1]) {
    const arm=new THREE.Group();arm.position.set(side*.38,1.07,.055);arm.rotation.z=side*.25;root.add(arm);
    orb(arm,orange,0,-.16,0,.115,.22,.12);orb(arm,orange,0,-.35,.04,.14,.1,.12);
    for(let toe=0;toe<3;toe++) orb(arm,cream,-.075+toe*.065,-.36,.139,.026,.035,.045);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.20,.47,.025);root.add(leg);
    orb(leg,orange,0,-.07,0,.18,.24,.18);orb(leg,orange,0,-.35,.10,.21,.12,.23);
    for(let toe=0;toe<3;toe++) orb(leg,cream,-.10+toe*.10,-.38,.303,.044,.045,.072);legs.push(leg);
  }
  root.userData.rig={body,head,leftArm:arms[0],rightArm:arms[1],leftLeg:legs[0],rightLeg:legs[1],neckerchief,tail,restBodyY:.88};
  return root;
}

export function createPipFigure(THREE, { scale = 1 } = {}) {
  const {root, material, orb, mesh, eyes}=palSculpt(THREE,'Pip',scale);
  const skin=material('#f2cb99'), hair=material('#82512e'), darkHair=material('#674227'), green=material('#577743'), brown=material('#785037'), gold=material('#d69b43');
  const body=new THREE.Group();body.position.y=1.02;root.add(body);
  orb(body,green,0,.035,0,.29,.37,.22);
  const tunicProfile=[new THREE.Vector2(.32,-.33),new THREE.Vector2(.29,-.12),new THREE.Vector2(.255,.04),new THREE.Vector2(.30,.22)];
  mesh(body,new THREE.LatheGeometry(tunicProfile,18),green);
  const belt=mesh(body,new THREE.TorusGeometry(.278,.033,7,24),brown,0,-.07,0);belt.rotation.x=Math.PI/2;
  mesh(body,new THREE.BoxGeometry(.115,.10,.04),gold,0,-.07,.29);
  mesh(body,new THREE.BoxGeometry(.065,.05,.05),brown,0,-.07,.306);
  const head=new THREE.Group();head.position.set(0,1.73,.015);root.add(head);
  orb(head,skin,0,-.025,.05,.34,.4,.31);orb(head,skin,0,-.07,.355,.06,.075,.06);
  eyes(head,.04,.321,'#668047');
  const earShape=new THREE.Shape();earShape.moveTo(0,-.12);earShape.quadraticCurveTo(.22,-.06,.36,.15);earShape.quadraticCurveTo(.12,.17,0,.06);earShape.closePath();
  const earGeometry=new THREE.ExtrudeGeometry(earShape,{depth:.035,bevelEnabled:true,bevelThickness:.02,bevelSize:.025,bevelSegments:2,steps:1});
  for(const side of [-1,1]) {
    const ear=mesh(head,earGeometry,skin,side*.28,-.02,.0);ear.scale.x=side;
    orb(head,darkHair,side*.15,.207,.29,.083,.016,.018).rotation.z=side*.1;
  }
  // Layered sculpted hair with authored swept bangs and side locks.
  orb(head,hair,0,.18,-.05,.37,.28,.32);
  for(const [x,y,rotation,size] of [[-.24,.20,-.38,.78],[-.08,.27,-.60,.92],[.10,.30,-.8,1],[.27,.24,-.85,.76]]) {
    const strand=new THREE.Shape();strand.moveTo(-.10,.09);strand.quadraticCurveTo(.08,.17,.16,.06);strand.quadraticCurveTo(.14,-.12,-.09,-.23);strand.quadraticCurveTo(.01,-.01,-.10,.09);
    const bang=mesh(head,new THREE.ExtrudeGeometry(strand,{depth:.06,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1}),hair,x,y,.24);bang.rotation.z=rotation;bang.scale.setScalar(size);
  }
  for(const side of [-1,1]) orb(head,hair,side*.3,-.12,-.06,.08,.20,.18);
  const smileCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.08,-.19,.322),new THREE.Vector3(0,-.225,.346),new THREE.Vector3(.08,-.19,.322)]);
  mesh(head,new THREE.TubeGeometry(smileCurve,12,.009,6,false),darkHair);
  const arms=[],legs=[];
  for(const side of [-1,1]) {
    const arm=new THREE.Group();arm.position.set(side*.27,1.25,.02);arm.rotation.z=side*.24;root.add(arm);
    orb(arm,green,0,-.08,0,.105,.16,.11);orb(arm,skin,0,-.22,0,.077,.13,.078);orb(arm,skin,0,-.355,.025,.10,.085,.079);arms.push(arm);
    const leg=new THREE.Group();leg.position.set(side*.14,.68,0);root.add(leg);
    orb(leg,skin,0,-.12,0,.08,.20,.08);orb(leg,brown,0,-.39,0,.12,.21,.125);
    orb(leg,brown,0,-.56,.09,.13,.10,.22);const cuff=mesh(leg,new THREE.TorusGeometry(.105,.026,7,18),gold,0,-.23,0);cuff.rotation.x=Math.PI/2;legs.push(leg);
  }
  root.userData.rig={body,head,leftArm:arms[0],rightArm:arms[1],leftLeg:legs[0],rightLeg:legs[1],restBodyY:1.02};
  return root;
}

export function createPalFigure(THREE, { world = 'meadow', scale = 1, artActions } = {}) {
  const root = world==='dino' ? createChompyFigure(THREE,{scale}) : world==='moonwood' ? createPipFigure(THREE,{scale}) : createBouncyFigure(THREE,{scale});
  return addAuthoredPalArt(THREE, root, { world, actions: artActions });
}

export function createWorldTree(THREE, { world = 'meadow', height = 3.4, variant = 0 } = {}) {
  if(world==='meadow')return createMeadowTree(THREE,{height,variant});
  const tree=new THREE.Group();
  const bark=new THREE.MeshStandardMaterial({color:world==='dino'?'#916445':'#554c60',roughness:.93});
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.11,.19,height*.64,10),bark);trunk.position.y=height*.32;trunk.castShadow=true;tree.add(trunk);
  const foliage=new THREE.MeshStandardMaterial({color:world==='dino'?'#3e7c4f':'#214b43',roughness:.9,side:THREE.DoubleSide});
  if(world==='dino') {
    const leaf=new THREE.Shape();leaf.moveTo(0,0);leaf.quadraticCurveTo(.31,.40,0,1.25);leaf.quadraticCurveTo(-.31,.40,0,0);
    const geometry=new THREE.ExtrudeGeometry(leaf,{depth:.025,bevelEnabled:false,steps:1});
    for(let index=0;index<9;index++){const branch=new THREE.Group();branch.position.y=height*.57;branch.rotation.y=index/9*Math.PI*2;const frond=new THREE.Mesh(geometry,foliage);frond.rotation.x=1.10;frond.scale.setScalar(height*.50);frond.castShadow=true;branch.add(frond);tree.add(branch);}
  } else {
    for(let tier=0;tier<3;tier++){const needles=new THREE.Mesh(new THREE.ConeGeometry(height*(.27-tier*.055),height*.46,12),foliage);needles.position.y=height*(.49+tier*.19);needles.castShadow=true;tree.add(needles);}
  }
  return tree;
}

export function animateBouncyFigure(group, time = 0, moving = false) {
  const rig = group?.userData?.rig; if (!rig) return;
  const gait = moving ? Math.sin(time * 9) : 0;
  rig.leftLeg.rotation.x = gait * .36; rig.rightLeg.rotation.x = -gait * .36;
  rig.leftArm.rotation.x = -gait * .31; rig.rightArm.rotation.x = gait * .31;
  rig.body.position.y = (rig.restBodyY ?? 1.07) + (moving ? Math.abs(gait) * .045 : 0);
  if(rig.neckerchief)rig.neckerchief.rotation.x = moving ? Math.sin(time * 8) * .08 : 0;
  if(rig.tail)rig.tail.rotation.y = moving ? Math.sin(time * 7) * .10 : 0;
}

export function animatePalFigure(group, time = 0, moving = false, options = {}) {
  if (!animateAuthoredPalArt(group, time, moving, options)) animateBouncyFigure(group, time, moving);
}
