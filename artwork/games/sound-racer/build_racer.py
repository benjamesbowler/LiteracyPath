"""Sound Racer: original open kart and canonical Pip adaptation.
Editable mesh profiles, semantic skin and fixed wheel/hand/pedal contacts.
Blender 5.2 --background --python this_file.py -- ROOT
Reference: public/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp.
Geometry is authored here; no external mesh or texture is incorporated.
"""
import bpy, math, sys, os, json, hashlib
from mathutils import Vector, Matrix
ROOT=sys.argv[sys.argv.index('--')+1]
SRC=os.path.join(ROOT,'artwork/games/sound-racer');OUT=os.path.join(ROOT,'public/game-assets/sound-racer/models');QA=os.path.join(ROOT,'.artifacts/full-game-upgrades/racer-production')
os.makedirs(SRC,exist_ok=True);os.makedirs(OUT,exist_ok=True);os.makedirs(QA,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.fps=30;bpy.context.preferences.filepaths.save_version=0
materials={}
for name,c,r,m in [('Skin',(.92,.56,.27),.62,0),('Cheek',(.94,.31,.13),.65,0),('Tunic',(.24,.34,.07),.85,0),('TunicLight',(.39,.46,.12),.82,0),('Leather',(.23,.12,.045),.84,0),('LeatherLight',(.42,.25,.09),.8,0),('Hair',(.25,.105,.025),.8,0),('HairLight',(.34,.16,.041),.8,0),('White',(.97,.94,.78),.4,0),('Ink',(.025,.024,.017),.52,0),('Iris',(.19,.085,.023),.5,0),('Paint',(.02,.38,.29),.26,.35),('Cream',(.95,.78,.35),.35,.2),('Seat',(.042,.066,.072),.93,0),('Rubber',(.018,.027,.031),.96,0),('Metal',(.36,.44,.44),.3,.8),('Lamp',(.98,.7,.19),.22,.1),('Red',(.61,.036,.024),.4,.2)]:
 mat=bpy.data.materials.new(name);mat.diffuse_color=(*c,1);mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=r;p.inputs['Metallic'].default_value=m
 if name=='Lamp':p.inputs['Emission Color'].default_value=(*c,1);p.inputs['Emission Strength'].default_value=.6
 materials[name]=mat
# Blender +Y is forward, +Z up; runtime glTF forward -Z, up +Y.
bones={'chassis':((0,0,.52),(0,0,.82),None),'hips':((0,-.36,.78),(0,-.37,1.02),'chassis'),'chest':((0,-.37,1.02),(0,-.40,1.48),'hips'),'neck':((0,-.40,1.48),(0,-.40,1.58),'chest'),'head':((0,-.40,1.58),(0,-.40,2.12),'neck'),'steering':((0,.24,1.0),(0,.08,1.16),'chassis')}
for side,s in [('L',-1),('R',1)]:
 shoulder=(s*.27,-.36,1.40);elbow=(s*.34,-.02,1.18);wrist=(s*.23,.20,1.02)
 hip=(s*.17,-.32,.79);knee=(s*.23,.12,.67);ankle=(s*.25,.65,.39)
 for n,a,b,p in [('upperarm',shoulder,elbow,'chest'),('forearm',elbow,wrist,'upperarm.'+side),('hand',wrist,(s*.23,.27,1.02),'forearm.'+side),('thigh',hip,knee,'hips'),('shin',knee,ankle,'thigh.'+side),('foot',ankle,(s*.25,.92,.37),'shin.'+side)]:bones[n+'.'+side]=(a,b,p)
 for axle,y in [('front',.85),('rear',-.87)]:
  n=axle+'.'+side;center=(s*1.02,y,.37)
  bones['suspension.'+n]=(center,(center[0],center[1],center[2]+.2),None)
  bones['steer.'+n]=(center,(center[0],center[1],center[2]+.2),'suspension.'+n)
  bones['roll.'+n]=(center,(center[0]+.2,center[1],center[2]),'steer.'+n)
arm=bpy.data.armatures.new('PipKartSemanticRig');rig=bpy.data.objects.new('PipKartRig',arm);scene.collection.objects.link(rig);bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(a,b,p) in bones.items():
 bone=arm.edit_bones.new(name);bone.head=a;bone.tail=b
 if p:bone.parent=arm.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT');rig.select_set(False)

def mesh(name,verts,faces,mat,bone,sub=0):
 data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update();obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.data.materials.append(materials[mat])
 for p in data.polygons:p.use_smooth=True
 if sub:
  bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('ProfileRefinement','SUBSURF');mod.levels=sub;bpy.ops.object.modifier_apply(modifier=mod.name)
 group=obj.vertex_groups.new(name=bone);group.add(list(range(len(obj.data.vertices))),1,'REPLACE');mod=obj.modifiers.new('SemanticSkin','ARMATURE');mod.object=rig;obj.parent=rig
 return obj

def rings(name,centers,radii,mat,bone,segments=20,sub=1):
 verts=[];faces=[]
 for (x,y,z),(rx,ry) in zip(centers,radii):
  for i in range(segments):
   a=math.tau*i/segments;verts.append((x+rx*math.cos(a),y+ry*math.sin(a),z))
 for j in range(len(centers)-1):
  for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
 faces.extend([tuple(reversed(range(segments))),tuple((len(centers)-1)*segments+i for i in range(segments))]);return mesh(name,verts,faces,mat,bone,sub)

def oval(name,c,s,mat,bone,segments=20,rows=12):
 verts=[];faces=[]
 for j in range(rows+1):
  p=math.pi*j/rows
  for i in range(segments):
   a=math.tau*i/segments;verts.append((c[0]+math.sin(p)*math.cos(a)*s[0],c[1]+math.sin(p)*math.sin(a)*s[1],c[2]+math.cos(p)*s[2]))
 for j in range(rows):
  for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
 return mesh(name,verts,faces,mat,bone)

def tube(name,points,radii,mat,bone,segments=12):
 verts=[];faces=[]
 for j,p in enumerate(points):
  direction=Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)]);direction.normalize();u=direction.cross(Vector((0,0,1)))
  if u.length<.001:u=direction.cross(Vector((0,1,0)))
  u.normalize();v=direction.cross(u)
  for i in range(segments):verts.append(Vector(p)+(u*math.cos(math.tau*i/segments)+v*math.sin(math.tau*i/segments))*radii[j])
 for j in range(len(points)-1):
  for i in range(segments):faces.append((j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i))
 faces.extend([tuple(reversed(range(segments))),tuple((len(points)-1)*segments+i for i in range(segments))]);return mesh(name,verts,faces,mat,bone)

def limb(name,a,b,r1,r2,mat,bone):
 a=Vector(a);b=Vector(b);ts=[0,.08,.25,.5,.75,.92,1];return tube(name,[a.lerp(b,t) for t in ts],[(r1*(1-t)+r2*t)*(.92 if t in [0,1] else 1) for t in ts],mat,bone,16)

def torus(name,center,major,minor,mat,bone,axis='Z',n=32,m=10):
 verts=[];faces=[]
 for i in range(n):
  a=i*math.tau/n
  for j in range(m):
   b=j*math.tau/m;r=major+minor*math.cos(b);p=(r*math.cos(a),r*math.sin(a),minor*math.sin(b));p=(p[2],p[0],p[1]) if axis=='X' else p
   verts.append(tuple(center[k]+p[k] for k in range(3)))
 for i in range(n):
  for j in range(m):faces.append((i*m+j,i*m+(j+1)%m,((i+1)%n)*m+(j+1)%m,((i+1)%n)*m+j))
 return mesh(name,verts,faces,mat,bone)
# Chassis silhouette: an open tub with an actual cavity and smoothly joined rim.
verts=[];faces=[];n=48
for level in range(4):
 for i in range(n):
  a=math.tau*i/n;side=math.cos(a);fore=math.sin(a);width=.74 if fore>0 else .87;y=fore*1.24-.03;x=side*width
  if level==0:z=.30;x*=.9;y*=.94
  elif level==1:z=.56
  elif level==2:z=.60;x*=.82;y*=.82
  else:z=.39;x*=.80;y*=.80
  verts.append((x,y,z))
for l in range(3):
 for i in range(n):faces.append((l*n+i,l*n+(i+1)%n,(l+1)*n+(i+1)%n,(l+1)*n+i))
faces.append(tuple(3*n+i for i in range(n)));mesh('OpenMonocoque',verts,faces,'Paint','chassis',1)
# Curved wing, sidepods and seat.
for side,s in [('L',-1),('R',1)]:
 oval('SidePod.'+side,(s*.78,-.08,.47),(.24,.64,.19),'Paint','chassis')
 tube('CreamRail.'+side,[(s*.75,-1.05,.62),(s*.84,-.65,.64),(s*.83,0,.65),(s*.68,.63,.63)],[.035]*4,'Cream','chassis')
 tube('FrontBumper.'+side,[(0,1.40,.34),(s*.62,1.35,.34),(s*.96,1.13,.34)],[.07]*3,'Metal','chassis')
 oval('Headlamp.'+side,(s*.43,1.15,.64),(.16,.065,.085),'Lamp','chassis')
 oval('BrakeLamp.'+side,(s*.66,-1.20,.57),(.11,.035,.065),'Red','chassis')
 tube('Exhaust.'+side,[(s*.56,-.88,.33),(s*.56,-1.42,.34)],[.085,.095],'Metal','chassis')
 oval('Pedal.'+side,(s*.25,.89,.31),(.16,.19,.028),'Metal','chassis')
 tube('FrontAxle.'+side,[(s*.40,.85,.40),(s*.96,.85,.37)],[.047,.047],'Metal','chassis')
 tube('RearAxle.'+side,[(s*.40,-.87,.40),(s*.96,-.87,.37)],[.047,.047],'Metal','chassis')
oval('SeatCushion',(0,-.40,.68),(.42,.42,.12),'Seat','chassis')
oval('SeatBack',(0,-.72,1.02),(.42,.12,.49),'Seat','chassis')
for x in [-.28,.28]:tube('SeatStitch',[(x,-.591,.80),(x,-.601,1.19)],[.012,.012],'Cream','chassis',8)
oval('NoseCowl',(0,.88,.58),(.48,.43,.15),'Paint','chassis')
tube('NoseStripe',[(0,.54,.715),(0,.80,.736),(0,1.1,.68)],[.045,.05,.035],'Cream','chassis')
# Steering ring in tilted plane; grip locations define the hand target.
points=[]
for i in range(41):
 a=math.tau*i/40;points.append((.235*math.cos(a),.24+.16*math.sin(a),1.0+.16*math.sin(a)))
tube('SteeringRim',points,[.033]*len(points),'Seat','steering',10)
for s in [-1,1]:tube('SteeringSpoke',[(0,.24,1),(s*.23,.24,1)],[.02,.024],'Metal','steering')
tube('SteeringColumn',[(0,.49,.53),(0,.24,1)],[.035,.035],'Metal','chassis')
oval('SteeringBadge',(0,.255,1.016),(.065,.033,.047),'Cream','steering')
for side,s in [('L',-1),('R',1)]:
 for axle,y in [('front',.85),('rear',-.87)]:
  b='roll.'+axle+'.'+side;c=(s*1.02,y,.37);torus('Tyre.'+axle+'.'+side,c,.267,.103,'Rubber',b,'X',32,12)
  # Bevelled tyre shoulders and radial tread remain genuine geometry.
  torus('Rim.'+axle+'.'+side,(s*1.12,y,.37),.158,.027,'Cream',b,'X',24,8)
  for i in range(6):
   a=math.tau*i/6;tube('Spoke',[(s*1.135,y,.37),(s*1.135,y+math.cos(a)*.145,.37+math.sin(a)*.145)],[.022,.019],'Metal',b,8)
  oval('Hub',(s*1.14,y,.37),(.04,.057,.057),'Cream',b,16,8)
  for i in range(16):
   a=math.tau*i/16;points=[(s*.96,y+math.cos(a-.035)*.369,.37+math.sin(a-.035)*.369),(s*1.08,y+math.cos(a+.035)*.369,.37+math.sin(a+.035)*.369)]
   tube('Tread',points,[.011,.011],'Seat',b,6)
# Pip: hooded woodland tunic, satchel, shaped face/hair and pointed ears.
rings('TunicBody',[(0,-.35,z) for z in [.82,.86,.95,1.13,1.33,1.43,1.46]],[(.26,.21),(.29,.23),(.27,.20),(.27,.18),(.31,.19),(.28,.17),(.18,.14)],'Tunic','chest')
rings('TunicHem',[(0,-.35,z) for z in [.82,.85,.90]],[(.29,.23),(.30,.24),(.29,.23)],'TunicLight','chest',sub=0)
rings('Belt',[(0,-.35,z) for z in [.97,1.02]],[(.276,.215),(.276,.21)],'Leather','chest',sub=0)
oval('Buckle',(0,-.132,1.0),(.072,.025,.047),'Cream','chest')
oval('FoldedHood',(0,-.52,1.40),(.30,.16,.17),'TunicLight','chest')
for s in [-1,1]:
 tube('Collar',[(s*.03,-.15,1.34),(s*.13,-.18,1.43),(s*.16,-.34,1.48)],[.036,.046,.032],'TunicLight','chest')
 tube('CollarLace',[(s*.045,-.151,1.33),(-s*.045,-.151,1.29)],[.012,.012],'LeatherLight','chest',8)
oval('Neck',(0,-.40,1.51),(.105,.103,.16),'Skin','neck')
# Face profile rings: jaw, cheeks, temples and rounded forehead.
rings('Face',[(0,-.36,z) for z in [1.55,1.57,1.64,1.78,1.94,2.04,2.075]],[(.10,.12),(.16,.16),(.23,.21),(.27,.245),(.245,.23),(.16,.15),(.03,.035)],'Skin','head',28)
for side,s in [('L',-1),('R',1)]:
 # Rounded pointed ear custom silhouette.
 mesh('PointedEar.'+side,[(s*.235,-.37,1.79),(s*.29,-.31,1.73),(s*.46,-.35,1.89),(s*.30,-.45,1.89),(s*.29,-.32,1.81)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(3,2,1,0)],'Skin','head',0)
 mesh('EarInside.'+side,[(s*.283,-.317,1.80),(s*.37,-.365,1.846),(s*.30,-.371,1.855)],[(0,1,2)],'Cheek','head')
 oval('EyeWhite.'+side,(s*.104,-.140,1.847),(.069,.012,.087),'White','head',20,12)
 oval('Iris.'+side,(s*.104,-.124,1.843),(.044,.007,.066),'Iris','head',16,10)
 oval('Pupil.'+side,(s*.104,-.118,1.843),(.028,.004,.050),'Ink','head',16,10)
 oval('Glint.'+side,(s*.096,-.112,1.870),(.010,.005,.016),'White','head',10,6)
 tube('Brow.'+side,[(s*.045,-.161,1.957),(s*.10,-.14,1.965),(s*.16,-.164,1.951)],[.020,.025,.018],'Hair','head')
 oval('RosyCheek.'+side,(s*.185,-.172,1.745),(.043,.003,.027),'Cheek','head',12,8)
oval('Nose',(0,-.093,1.774),(.061,.072,.061),'Skin','head',20,12)
tube('Smile',[(-.07,-.155,1.691),(0,-.132,1.666),(.065,-.155,1.694)],[.012,.013,.010],'Ink','head',10)
# A continuous swept hair shell with a nape and asymmetric hairline. The
# tapered forehead locks are shallow surfaces, not tubes or disconnected buns.
verts=[];faces=[];cols=40;rows=18
for j in range(rows+1):
 for i in range(cols):
  a=math.tau*i/cols;front=max(0,math.sin(a));back=max(0,-math.sin(a));edge=1.70-.57*front+.76*back+.08*math.sin(5*a)*front
  p=edge*j/rows;x=.294*math.sin(p)*math.cos(a);y=-.40+.28*math.sin(p)*math.sin(a);z=1.86+.30*math.cos(p)+.032*math.sin(a-.7)*math.sin(p)
  verts.append((x,y,z))
for j in range(rows):
 for i in range(cols):faces.append((j*cols+i,j*cols+(i+1)%cols,(j+1)*cols+(i+1)%cols,(j+1)*cols+i))
mesh('ContinuousSweptHair',verts,faces,'Hair','head')
# Shallow overlapping swept sections break up the back-of-head silhouette.
# Their centres follow the scalp, with flattened cross sections and nape tips.
for strand in range(9):
 azimuth=math.pi+.10+strand*(math.pi-.20)/8;vs=[];fs=[];steps=9;around=10
 for j in range(steps):
  t=j/(steps-1);p=.38+2.05*t;a=azimuth+.22*math.sin(t*math.pi)
  c=Vector((.302*math.sin(p)*math.cos(a),-.40+.287*math.sin(p)*math.sin(a),1.86+.307*math.cos(p)))
  tangent=Vector((-math.sin(a),math.cos(a),0));normal=Vector((math.sin(p)*math.cos(a),math.sin(p)*math.sin(a),math.cos(p)))
  width=(.042+.016*math.sin(t*math.pi))*(1-t**6)+.001;depth=.011+.010*math.sin(t*math.pi);c+=normal*.005
  for k in range(around):
   q=c+tangent*(math.cos(k*math.tau/around)*width)+normal*(math.sin(k*math.tau/around)*depth);vs.append(q)
 for j in range(steps-1):
  for k in range(around):fs.append((j*around+k,j*around+(k+1)%around,(j+1)*around+(k+1)%around,(j+1)*around+k))
 fs.extend([tuple(reversed(range(around))),tuple((steps-1)*around+k for k in range(around))]);mesh('SweptNape%d'%strand,vs,fs,'HairLight' if strand%4==0 else 'Hair','head')
for index,(x,drop) in enumerate([(-.19,.08),(-.08,.035),(.045,.005),(.16,.035)]):
 centers=[(x-.045,-.25,2.11),(x+.022,-.132,2.035),(x+.06,-.133,1.94-drop)]
 vs=[];fs=[]
 for j,c in enumerate(centers):
  width=[.057,.062,.002][j];depth=[.025,.036,.002][j]
  for k in range(12):
   a=math.tau*k/12;vs.append((c[0]+math.cos(a)*width,c[1]+math.sin(a)*depth,c[2]))
 for j in range(2):
  for k in range(12):fs.append((j*12+k,j*12+(k+1)%12,(j+1)*12+(k+1)%12,(j+1)*12+k))
 fs.extend([tuple(reversed(range(12))),tuple(24+k for k in range(12))]);mesh('ForeheadSweep%d'%index,vs,fs,'HairLight' if index==1 else 'Hair','head',1)
for side,s in [('L',-1),('R',1)]:
 tube('Sideburn.'+side,[(s*.245,-.30,1.95),(s*.26,-.33,1.82),(s*.22,-.32,1.77)],[.07,.065,.015],'Hair','head')
 for part,mat,rs in [('upperarm','Tunic',(.14,.125)),('forearm','Tunic',(.123,.095)),('thigh','Leather',(.145,.13)),('shin','Leather',(.12,.085))]:
  a,b,_=bones[part+'.'+side];limb(part+'.'+side,a,b,*rs,mat,part+'.'+side);oval('Joint.'+part+side,b,(rs[1],)*3,mat,part+'.'+side,16,8)
 wrist=bones['hand.'+side][0];oval('Palm.'+side,(s*.232,.23,1.018),(.075,.062,.049),'Skin','hand.'+side,16,10)
 for finger in range(4):
  x=s*(.19+finger*.025);tube('Finger%d.%s'%(finger,side),[(x,.22,1.043),(x,.273,1.034),(x,.281,.992),(x,.258,.98)],[.015,.015,.013,.009],'Skin','hand.'+side,8)
 tube('Thumb.'+side,[(s*.177,.217,1.017),(s*.168,.25,1.0),(s*.187,.269,.991)],[.022,.019,.014],'Skin','hand.'+side,10)
 rings('Boot.'+side,[(s*.25,.78,z) for z in [.31,.34,.40,.50]],[(.115,.20),(.12,.22),(.115,.20),(.085,.10)],'LeatherLight','foot.'+side,20)
 rings('BootSole.'+side,[(s*.25,.79,z) for z in [.298,.335]],[(.124,.221),(.124,.221)],'Leather','foot.'+side,20,0)
 rings('BootCuff.'+side,[(s*.25,.66,z) for z in [.47,.51]],[(.096,.106),(.096,.106)],'TunicLight','foot.'+side,16,0)
 for y in [.76,.81,.86]:tube('BootLace',[(s*.25-.065,y,.445),(s*.25+.065,y,.445)],[.009,.009],'Leather','foot.'+side,6)
oval('Satchel',(-.33,-.53,1.02),(.14,.12,.22),'LeatherLight','chest')
oval('SatchelFlap',(-.34,-.421,1.11),(.13,.03,.105),'Leather','chest')
oval('SatchelClasp',(-.34,-.389,1.06),(.027,.012,.03),'Cream','chest')
tube('SatchelStrap',[(-.34,-.30,1.01),(-.24,-.14,1.19),(.20,-.23,1.43)],[.029,.029,.029],'Leather','chest')
# Keyframed analytic seated contacts. Hands stay on the steering ring and feet
# stay on pedals as the torso leans; no disconnected hand/wheel animation.
rig.animation_data_create();clip_frames={'drive':60,'turn_left':36,'turn_right':36,'brake':30,'recover':36,'celebrate':60}
for clip,end in clip_frames.items():
 action=bpy.data.actions.new(clip);rig.animation_data.action=action
 for f in range(1,end+1):
  t=(f-1)/(end-1);wave=math.sin(t*math.tau);lean=(-.10 if clip=='turn_left' else .10 if clip=='turn_right' else 0);nod=(.055 if clip=='brake' else 0)
  if clip=='recover':lean=math.sin(t*math.tau*2)*.12*(1-t)
  lift=.007*wave if clip=='drive' else .012*wave if clip=='celebrate' else 0
  targets=dict(bones)
  def moved(p,amount=1):return (p[0]+lean*amount,p[1]+nod*amount,p[2]+lift*amount)
  for key,amount in [('hips',.1),('chest',.55),('neck',1),('head',1)]:
   a,b,p=bones[key];targets[key]=(moved(a,amount),moved(b,amount+(.35 if key=='chest' else 0)),p)
  steer_angle=.32 if clip=='turn_left' else -.32 if clip=='turn_right' else 0
  steering_rotation=Matrix.Rotation(steer_angle,4,Vector((0,-1,1)).normalized())
  steering_center=Vector((0,.24,1))
  def wheel_contact(p):return steering_center+steering_rotation.to_3x3()@(Vector(p)-steering_center)
  for side,s in [('L',-1),('R',1)]:
   hand_a,hand_b,hand_parent=bones['hand.'+side];targets['hand.'+side]=(wheel_contact(hand_a),wheel_contact(hand_b),hand_parent)
   shoulder=moved(bones['upperarm.'+side][0],.85);wrist=targets['hand.'+side][0];elbow=list(bones['forearm.'+side][0]);elbow[0]+=lean*.35;elbow[1]+=nod*.4
   targets['upperarm.'+side]=(shoulder,elbow,'chest');targets['forearm.'+side]=(elbow,wrist,'upperarm.'+side)
  desired_matrices={}
  for name,(head,tail,parent) in targets.items():
   bone=rig.pose.bones[name];a=Vector(head);b=Vector(tail);length=(b-a).length/(Vector(bones[name][1])-Vector(bones[name][0])).length
   bone.rotation_mode='QUATERNION';rest_direction=Vector(bones[name][1])-Vector(bones[name][0]);rotation=rest_direction.rotation_difference(b-a)@arm.bones[name].matrix_local.to_quaternion();desired=Matrix.LocRotScale(a,rotation,Vector((1,length,1)))
   if name=='steering':desired=desired@Matrix.Rotation(steer_angle,4,'Y')
   desired_matrices[name]=desired
   rest=arm.bones[name].matrix_local
   bone.matrix_basis=(rest.inverted()@arm.bones[parent].matrix_local@desired_matrices[parent].inverted()@desired) if parent else rest.inverted()@desired
   bone.keyframe_insert('location',frame=f);bone.keyframe_insert('rotation_quaternion',frame=f);bone.keyframe_insert('scale',frame=f)
  bpy.context.view_layer.update()
 track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);rig.animation_data.action=None
# Keep individual named mesh surfaces editable in the .blend; runtime join by
# material reduces draw calls while preserving all semantic vertex groups.
scene.frame_set(1)
for track in rig.animation_data.nla_tracks:track.mute=True
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC,'pip-kart.blend'))
for mat in materials:
 objects=[obj for obj in list(scene.objects) if obj.type=='MESH' and obj.data.materials and obj.data.materials[0].name==mat]
 if len(objects)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for obj in objects:obj.select_set(True)
 bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='PipKart_'+mat
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for obj in scene.objects:
 if obj.type=='MESH':obj.select_set(True)
path=os.path.join(OUT,'pip-kart.glb');bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_yup=True,export_force_sampling=True,export_materials='EXPORT')
import base64
open(os.path.join(ROOT,'src/components/learn/games/games/soundRacerKartFallback.js'),'w').write('// Exact authored GLB recovery copy; regenerated by build_racer.py.\nexport const RACER_KART_BASE64 = '+json.dumps(base64.b64encode(open(path,'rb').read()).decode())+';\n')
for track in rig.animation_data.nla_tracks:track.mute=True
# Review front-three-quarter and chase views, using the runtime-exported mesh.
if '--no-render' not in sys.argv:
 scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
 scene.world.color=(.18,.18,.18)
 bpy.ops.object.light_add(type='AREA',location=(2,4,6));bpy.context.object.data.energy=600;bpy.context.object.data.size=4
 bpy.ops.object.light_add(type='AREA',location=(-3,-2,4));bpy.context.object.data.energy=400;bpy.context.object.data.size=3
 bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=4.4
 for name,position in [('front',(4,6,4)),('chase',(3,-6,3.7)),('side',(6,0,2.8))]:
  camera.location=position;camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(QA,'pip-kart-'+name+'.png');bpy.ops.render.render(write_still=True)
report={'source':'artwork/games/sound-racer/build_racer.py','editable':'artwork/games/sound-racer/pip-kart.blend','runtime':'/game-assets/sound-racer/models/pip-kart.glb','bytes':os.path.getsize(path),'sha256':hashlib.sha256(open(path,'rb').read()).hexdigest(),'clips':list(clip_frames),'bones':list(bones),'character':'Pip','reference':'public/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp','geometry':'Original authored geometry; no incorporated external geometry or textures','axes':'Runtime +Y up, -Z forward; ground contact y=0','ownership':'LiteracyPath original implementation; canonical character adaptation subject to direct likeness review'}
open(os.path.join(SRC,'asset-record.json'),'w').write(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
