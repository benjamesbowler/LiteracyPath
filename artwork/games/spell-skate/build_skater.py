"""Original Spell & Skate character. Editable mesh, skinning and authored contact poses.
Run with Blender --background --python this_file.py -- ROOT.
No external geometry, textures or character assets are used.
"""
import bpy, math, os, sys, json
from mathutils import Vector, Matrix, Quaternion
ROOT=sys.argv[sys.argv.index('--')+1]
SRC=os.path.join(ROOT,'artwork/games/spell-skate'); OUT=os.path.join(ROOT,'public/game-assets/spell-skate')
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.fps=30
materials={}
for name,color,rough,metal in [('skin',(0.54,.25,.105,1),.6,0),('shirt',(.035,.49,.43,1),.7,0),('navy',(.045,.075,.18,1),.78,0),('hair',(.07,.027,.013,1),.8,0),('cream',(.91,.94,.87,1),.6,0),('gold',(.98,.61,.055,1),.5,0),('grip',(.027,.037,.049,1),.93,0),('rubber',(.10,.13,.14,1),.7,0),('metal',(.38,.43,.48,1),.28,.8),('white',(.97,.99,1,1),.3,0),('iris',(.15,.07,.025,1),.3,0)]:
 m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;materials[name]=m
bones={
 'board':((0,0,0),(0,-1,0),None),
 'hips':((0,0,1.63),(0,0,1.95),'board'),
 'chest':((0,0,1.95),(0,0,2.66),'hips'),
 'neck':((0,0,2.66),(0,0,2.86),'chest'),
 'head':((0,0,2.86),(0,0,3.5),'neck'),
}
for side,sgn,y in [('L',-1,-.67),('R',1,.65)]:
 hip=(sgn*.25,0,1.63);knee=(sgn*.27,y*.54,1.13);ankle=(sgn*.23,y,.67)
 bones['thigh.'+side]=(hip,knee,'hips');bones['shin.'+side]=(knee,ankle,'thigh.'+side);bones['foot.'+side]=(ankle,(sgn*.23+.38,y,.67),'shin.'+side)
 shoulder=(sgn*.53,0,2.51);elbow=(sgn*.76,-.055,2.02);wrist=(sgn*.91,-.18,1.69)
 bones['arm.'+side]=(shoulder,elbow,'chest');bones['forearm.'+side]=(elbow,wrist,'arm.'+side);bones['hand.'+side]=(wrist,(sgn*.97,-.2,1.5),'forearm.'+side)
for x in [-.56,.56]:
 for y in [-1.06,1.06]: bones['wheel_%s_%s'%(x,y)]=((x,y,.22),(x+.2,y,.22),'board')
arm=bpy.data.armatures.new('SkaterSemanticRig');rig=bpy.data.objects.new('SkaterRig',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(head,tail,parent) in bones.items():
 b=arm.edit_bones.new(name);b.head=head;b.tail=tail
 if parent:b.parent=arm.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def mesh(name,verts,faces,mat,bone,sub=1,weights=None):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.data.materials.append(materials[mat])
 for p in data.polygons:p.use_smooth=True
 if sub:
  bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('AuthoredSurfaceRefinement','SUBSURF');mod.levels=sub;bpy.ops.object.modifier_apply(modifier=mod.name)
 # Applying subdivision first leaves rigid clothing/head surfaces exact; articulated limbs have multi-part overlapping cloth joints.
 group=obj.vertex_groups.new(name=bone);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
 mod=obj.modifiers.new('SemanticSkin','ARMATURE');mod.object=rig;obj.parent=rig
 return obj

def rings(name,centres,radii,mat,bone,segments=20,sub=1):
 verts=[]
 for (x,y,z),(rx,ry) in zip(centres,radii):
  for i in range(segments):
   a=2*math.pi*i/segments;verts.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
 faces=[]
 for j in range(len(centres)-1):
  for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
 faces.extend([tuple(reversed(range(segments))),tuple((len(centres)-1)*segments+i for i in range(segments))])
 return mesh(name,verts,faces,mat,bone,sub)

def ellipsoid(name,centre,scale,mat,bone,segments=24,rows=14):
 verts=[]
 for j in range(rows+1):
  p=math.pi*j/rows
  for i in range(segments):
   a=2*math.pi*i/segments;cheek=1+.06*math.cos(p*3)
   verts.append((centre[0]+math.sin(p)*math.cos(a)*scale[0]*cheek,centre[1]+math.sin(p)*math.sin(a)*scale[1],centre[2]+math.cos(p)*scale[2]))
 faces=[]
 for j in range(rows):
  for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
 return mesh(name,verts,faces,mat,bone,0)

def limb(name,a,b,radii,mat,bone):
 a=Vector(a);b=Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,1,0))).normalized();v=axis.cross(u).normalized();verts=[];steps=[0,.06,.22,.5,.78,.94,1]
 for t in steps:
  r=radii[0]*(1-t)+radii[1]*t;r*=.90 if t in [0,1] else 1;center=a.lerp(b,t)
  for i in range(16):
   q=center+(u*math.cos(i*math.tau/16)+v*math.sin(i*math.tau/16))*r;verts.append(q)
 faces=[]
 for j in range(len(steps)-1):
  for i in range(16):faces.append((j*16+i,j*16+(i+1)%16,(j+1)*16+(i+1)%16,(j+1)*16+i))
 faces.extend([tuple(reversed(range(16))),tuple((len(steps)-1)*16+i for i in range(16))]);return mesh(name,verts,faces,mat,bone,1)

# Tailored curved torso and shorts: authored profiles rather than stacked boxes.
rings('TealShirt',[(0,0,z) for z in [1.76,1.79,1.90,2.12,2.39,2.53,2.57]],[(.34,.25),(.36,.26),(.35,.25),(.42,.27),(.51,.275),(.48,.24),(.31,.20)],'shirt','chest')
rings('ShirtHem',[(0,0,z) for z in [1.77,1.80,1.84]],[(.365,.265),(.365,.265),(.354,.26)],'cream','chest',sub=0)
rings('ShortsWaist',[(0,0,z) for z in [1.43,1.5,1.73,1.81]],[(.40,.29),(.42,.29),(.38,.27),(.35,.26)],'navy','hips')
ellipsoid('Neck',(0,0,2.70),(.20,.18,.24),'skin','neck')
ellipsoid('Face',(0,-.035,3.09),(.43,.385,.48),'skin','head',32,20)
# Face points toward Blender -Y (positive runtime Z).
for side,sgn in [('L',-1),('R',1)]:
 ellipsoid('Ear.'+side,(sgn*.425,-.01,3.07),(.085,.075,.135),'skin','head',16,10)
 ellipsoid('EyeWhite.'+side,(sgn*.16,-.385,3.15),(.10,.038,.13),'white','head',20,12)
 ellipsoid('Iris.'+side,(sgn*.16,-.421,3.15),(.050,.020,.074),'iris','head',16,10)
 ellipsoid('Pupil.'+side,(sgn*.16,-.438,3.15),(.026,.008,.048),'grip','head',12,8)
 ellipsoid('EyeGlint.'+side,(sgn*.16-.015,-.447,3.183),(.013,.004,.021),'white','head',10,6)
 ellipsoid('Brow.'+side,(sgn*.16,-.382,3.32),(.115,.027,.027),'hair','head',16,8)
ellipsoid('Nose',(0,-.40,3.02),(.095,.091,.095),'skin','head',16,10)
ellipsoid('Smile',(0,-.386,2.92),(.13,.018,.026),'hair','head',20,8)
ellipsoid('LowerLip',(0,-.391,2.898),(.10,.014,.020),'skin','head',16,8)
ellipsoid('Hair',(0,.028,3.30),(.45,.385,.32),'hair','head')
rings('GoldenCap',[(0,.015,z) for z in [3.29,3.34,3.45,3.56,3.64,3.69]],[(.49,.43),(.50,.44),(.46,.405),(.34,.30),(.21,.18),(.015,.012)],'gold','head',32,0)
# Curved visor with thickness and a stitched, shaped outline.
verts=[];faces=[]
for layer in [0,.035]:
 for j in range(5):
  t=j/4
  for i in range(17):
   a=-math.pi/2+i/16*math.pi;x=math.sin(a)*(.42+.09*t);y=-.15-math.cos(a)*(.20+.43*t);z=3.315+.055*(x/.5)**2-layer;verts.append((x,y,z))
for l in range(2):
 for j in range(4):
  for i in range(16):
   a=l*85+j*17+i;faces.append((a,a+1,a+18,a+17) if l==0 else(a+17,a+18,a+1,a))
mesh('CapVisor',verts,faces,'gold','head',1)
for side,sgn in [('L',-1),('R',1)]:
 for key,mat,rs in [('arm','shirt',(.22,.19)),('forearm','skin',(.16,.12)),('thigh','navy',(.23,.20)),('shin','skin',(.17,.13))]:
  a,b,_=bones[key+'.'+side];limb(key+'.'+side,a,b,rs,mat,key+'.'+side)
  if key in ['arm','thigh']:ellipsoid(key+'Joint.'+side,b,(rs[1]*1.015,rs[1]*1.015,rs[1]*1.015),mat,key+'.'+side,16,10)
 a,b,_=bones['hand.'+side];limb('Hand.'+side,a,b,(.125,.09),'skin','hand.'+side)
 a=bones['foot.'+side][0];x,y,z=a
 # Foot silhouette is longer across the board, with a rounded toe and raised heel collar.
 rings('Sneaker.'+side,[(x+.10,y,z-.075),(x+.10,y,z-.04),(x+.08,y,z+.055),(x-.04,y,z+.13)],[(.36,.15),(.38,.16),(.33,.155),(.20,.13)],'cream','foot.'+side,24)
 rings('Sole.'+side,[(x+.10,y,z-.105),(x+.10,y,z-.065)],[(.38,.162),(.38,.162)],'rubber','foot.'+side,24,0)
 for l in range(3):ellipsoid('Lace%d.%s'%(l,side),(x+.03+l*.075,y,z+.085),(.02,.13,.015),'white','foot.'+side,12,6)
# Laminated deck: elliptical rails, concave cross section and lifted nose/tail.
verts=[];faces=[];rows=25;cols=13
for layer in [0,-.08]:
 for j in range(rows):
  y=-1.8+j/(rows-1)*3.6;end=max(0,(abs(y)-1.25)/.55);width=.54*math.sqrt(max(.015,1-end**2))
  for i in range(cols):
   u=-1+2*i/(cols-1);verts.append((u*width,y,.52+.23*end**2+.035*u*u+layer))
for l in range(2):
 for j in range(rows-1):
  for i in range(cols-1):
   a=l*rows*cols+j*cols+i;faces.append((a,a+1,a+1+cols,a+cols) if l==0 else(a+cols,a+1+cols,a+1,a))
for j in range(rows-1):
 for i in [0,cols-1]:
  a=j*cols+i;b=(j+1)*cols+i;faces.append((a,b,b+rows*cols,a+rows*cols))
deck=mesh('MapleDeck',verts,faces,'gold','board',1)
# Grip inset follows identical concavity; no detached flat card.
v=[];f=[]
for j in range(rows):
 y=-1.65+j/(rows-1)*3.3;end=max(0,(abs(y)-1.25)/.55);width=.49*math.sqrt(max(.015,1-end**2))
 for i in range(cols):
  u=-1+2*i/(cols-1);v.append((u*width,y,.528+.23*end**2+.035*u*u))
for j in range(rows-1):
 for i in range(cols-1):a=j*cols+i;f.append((a,a+1,a+1+cols,a+cols))
mesh('GripTape',v,f,'grip','board',0)
for y in [-1.06,1.06]:
 limb('TruckAxle'+str(y),(-.53,y,.25),(.53,y,.25),(.075,.075),'metal','board')
 limb('TruckStem'+str(y),(0,y,.25),(0,y,.45),(.10,.14),'metal','board')
 for x in [-.56,.56]:
  # Lathed wheel tread, oriented around X.
  vs=[];fs=[]
  for dx,r in [(-.12,.17),(-.095,.22),(.095,.22),(.12,.17)]:
   for i in range(24):a=i*math.tau/24;vs.append((x+dx,y+math.cos(a)*r,.22+math.sin(a)*r))
  for k in range(3):
   for i in range(24):a=k*24+i;fs.append((a,k*24+(i+1)%24,(k+1)*24+(i+1)%24,a+24))
  mesh('Wheel_%s_%s'%(x,y),vs,fs,'cream','wheel_%s_%s'%(x,y),0)

# Analytic two-bone contact solve. Feet remain on the deck except the pushing foot.
def knee_point(hip,ankle,side):
 h=Vector(hip);a=Vector(ankle);d=(a-h);dist=min(d.length,1.265);u=d.normalized();mid=h+u*(dist*.5);bend=math.sqrt(max(.001,.645**2-(dist*.5)**2));pole=Vector((-.2,-1,0));perp=(pole-u*pole.dot(u)).normalized();return mid+perp*bend

desired_pose={}
def pose_bone(name,a,b):
 p=rig.pose.bones[name];a=Vector(a);b=Vector(b);bind=rig.data.bones[name];rest=(bind.tail_local-bind.head_local).normalized();rot=rest.rotation_difference((b-a).normalized()) @ bind.matrix_local.to_quaternion();desired_pose[name]=Matrix.LocRotScale(a,rot,Vector((1,(b-a).length/max(.001,bind.length),1)))

def pose(state,t):
 desired_pose.clear()
 wave=math.sin(t*math.tau);crouch={'coast':.10,'push':.12,'turn_left':.23,'turn_right':.23,'crouch':.38,'jump':.34,'land':.40*(1-t),'grind':.28,'stumble':.22,'recover':.22*(1-t)}[state]
 if state=='push': crouch=.12+.22*max(0,wave)
 lean=(-.12 if state=='turn_left' else .12 if state=='turn_right' else .03*wave if state=='push' else 0)
 hip=Vector((lean,0,1.63-crouch));chest=hip+Vector((lean*.4,-crouch*.45,.80));neck=chest+Vector((0,0,.23));head=neck+Vector((0,0,.20))
 pose_bone('board',(0,0,0),(0,-1,0));pose_bone('hips',hip,hip+Vector((0,0,.32)));pose_bone('chest',hip+Vector((0,0,.32)),chest+Vector((0,0,.23)));pose_bone('neck',neck,head);pose_bone('head',head,head+Vector((0,0,.64)))
 for side,sgn,y in [('L',-1,-.67),('R',1,.65)]:
  ankle=Vector((sgn*.23,y,.67))
  if state=='push' and side=='R':
   phase=math.sin(t*math.tau);ankle.x+=.28*math.sin(math.pi*t)**2;ankle.y-=.45*phase;ankle.z-=.565*max(0,phase);ankle.z+=.22*max(0,-phase)
  h=hip+Vector((sgn*.25,0,0));k=knee_point(h,ankle,side);pose_bone('thigh.'+side,h,k);pose_bone('shin.'+side,k,ankle);pose_bone('foot.'+side,ankle,ankle+Vector((.38,0,0)))
  shoulder=chest+Vector((sgn*.53,0,-.04));spread=.38 if state in ['jump','grind','stumble'] else .10
  elbow=shoulder+Vector((sgn*(.24+spread),-.10-.12*wave,-.40+crouch*.5));wrist=elbow+Vector((sgn*.15,-.14,-.30+spread));pose_bone('arm.'+side,shoulder,elbow);pose_bone('forearm.'+side,elbow,wrist);pose_bone('hand.'+side,wrist,wrist+Vector((sgn*.06,-.02,-.19)))
 for name,(a,b,parent) in bones.items():
  if name.startswith('wheel_'):
   rot=Quaternion((1,0,0),-t*math.tau*2) @ rig.data.bones[name].matrix_local.to_quaternion();desired_pose[name]=Matrix.LocRotScale(Vector(a),rot,Vector((1,1,1)))
 for name,desired in desired_pose.items():
  bind=rig.data.bones[name];parent=bind.parent
  rig.pose.bones[name].matrix=desired
  bpy.context.view_layer.update()
 bpy.context.view_layer.update()

clips=[('coast',1.6),('push',1.0),('turn_left',1.0),('turn_right',1.0),('crouch',.45),('jump',.65),('land',.42),('grind',1.2),('stumble',.55),('recover',.65)]
rig.animation_data_create()
for name,duration in clips:
 action=bpy.data.actions.new(name);rig.animation_data.action=action;frames=round(duration*30)
 for frame in range(frames+1):
  scene.frame_set(frame);pose(name,frame/frames)
  for bone in rig.pose.bones:
   bone.rotation_mode='QUATERNION';bone.keyframe_insert('location',frame=frame);bone.keyframe_insert('rotation_quaternion',frame=frame);bone.keyframe_insert('scale',frame=frame)
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,0,action);strip.name=name
 rig.animation_data.action=None
for track in rig.animation_data.nla_tracks:track.mute=True
scene.frame_set(0);pose('coast',0)
# Editable file retains rig and clips. glTF uses named NLA tracks.
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC,'spell-skater.blend'))
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'spell-skater.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_yup=True,export_apply=False)
print('AUTHORED_SKATER_EXPORTED',os.path.getsize(os.path.join(OUT,'spell-skater.glb')))

import base64
with open(os.path.join(OUT,"spell-skater.glb"),"rb") as f: encoded=base64.b64encode(f.read()).decode()
with open(os.path.join(ROOT,"src/components/learn/games/games/spellSkaterFallback.js"),"w") as f: f.write("// Generated from the authored GLB by artwork/games/spell-skate/build_skater.py.\nexport const SPELL_SKATER_BASE64 = "+repr(encoded)+";\n")
