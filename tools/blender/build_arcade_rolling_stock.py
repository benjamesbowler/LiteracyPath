"""Original editable toy railway. Native wheels rotate at their true axle pivots.
Transparent eight-frame sprites preserve the same camera and registration.
"""
import math
import bpy,json,hashlib,subprocess,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/game-assets/arcade-worlds/trains';SOURCE=ROOT/'source-art/arcade/rolling-stock';REVIEW=ROOT/'.artifacts/arcade-world-upgrade/trains'
for p in [OUT,SOURCE,REVIEW]:p.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.preferences.filepaths.save_version=0

def mat(name,c,rough=.5,metal=0):
 rgb=[int(c[i:i+2],16)/255 for i in (0,2,4)];rgb=[v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*rgb,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal;return m
M={k:mat(k,c,r,m) for k,c,r,m in [('Paint','448A9B',.45,.15),('Coral','BA604A',.5,.1),('Cream','F0DEB4',.7,0),('Brass','CDA64F',.35,.65),('Rubber','24363B',.7,0),('Metal','819391',.3,.65),('Glass','8BD3D3',.24,.15),('Dark','234A55',.6,.2),('Wood','8C6543',.85,0)]}
def box(name,p,size,material,bevel=.06):
 bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(M[material]);mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=3;o.modifiers.new('Surface normals','WEIGHTED_NORMAL');return o
def cylinder(name,p,r,depth,material,axis='Z'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=r,depth=depth,location=p);o=bpy.context.object;o.name=name
 if axis=='X':o.rotation_euler.y=math.pi/2
 if axis=='Y':o.rotation_euler.x=math.pi/2
 o.data.materials.append(M[material]);mod=o.modifiers.new('Cast edge','BEVEL');mod.width=.018;mod.segments=2;o.modifiers.new('Smooth normals','WEIGHTED_NORMAL');return o

def wheel(x,y):
 parts=[cylinder('Wheel tire',(x,y,.35),.35,.16,'Rubber','Y'),cylinder('Wheel rim',(x,y-.1,.35),.29,.045,'Brass','Y'),cylinder('Wheel centre',(x,y-.13,.35),.21,.045,'Dark','Y')]
 for j in range(8):
  a=j*math.pi/4;spoke=box('Wheel spoke',(x+math.sin(a)*.11,y-.16,.35+math.cos(a)*.11),(.035,.027,.21),'Metal',.01);spoke.rotation_euler.y=a;parts.append(spoke)
 parts.append(cylinder('Wheel hub',(x,y-.18,.35),.065,.06,'Cream','Y'))
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();o=bpy.context.object;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.name='Wheel '+str(x)+' '+str(y);bpy.context.scene.cursor.location=(x,y,.35);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');return o
records=[]
for kind in ['wagon','engine','caboose']:
 scene=bpy.data.scenes.new(kind);bpy.context.window.scene=scene
 length=3.7 if kind=='engine' else 3.2
 box('Cast chassis',(0,0,.57),(length,1.25,.22),'Dark')
 box('Cream running board',(0,-.05,.76),(length+.12,1.4,.12),'Cream',.04)
 for side in [-1,1]:box('Coupler',(side*(length/2+.18),0,.54),(.4,.25,.16),'Metal',.035)
 paint='Coral' if kind in ['engine','caboose'] else 'Paint'
 if kind=='engine':
  cylinder('Boiler',(-.63,0,1.27),.58,2.0,paint,'X');cylinder('Smokebox front',(-1.68,0,1.27),.59,.14,'Dark','X')
  for x in [-1.25,-.25]:cylinder('Boiler brass band',(x,0,1.27),.591,.065,'Brass','X')
  box('Cab floor',(1.05,0,.95),(1.15,1.2,.25),paint)
  for x in [.54,1.54]:
   for y in [-.53,.53]:box('Cab pillar',(x,y,1.62),(.12,.12,1.1),paint,.035)
  for y in [-.55,.55]:
   box('Cab window',(1.04,y,1.7),(.8,.05,.62),'Glass',.04)
   box('Cab lower panel',(1.04,y,1.15),(.9,.1,.35),paint,.03)
  box('Cab roof',(1.04,0,2.29),(1.37,1.52,.17),'Dark',.12)
  cylinder('Chimney',(-1.02,0,2.05),.17,.72,'Dark');cylinder('Chimney rim',(-1.02,0,2.41),.24,.12,'Brass')
  cylinder('Steam dome',(-.1,0,1.93),.2,.33,'Brass')
  cylinder('Headlamp',(-1.79,-.07,1.45),.19,.15,'Brass','X');cylinder('Headlamp lens',(-1.88,-.07,1.45),.135,.04,'Cream','X')
  # An inset side plate keeps the word visually separated from machinery.
  box('Word plate',(-.65,-.602,1.19),(1.72,.045,.59),'Cream',.085)
 else:
  box('Coach body',(0,0,1.3),(3.1,1.2,1.02),paint,.11)
  for x in [-1.42,1.42]:
   box('Corner brass binding',(x,-.625,1.3),(.045,.04,.89),'Brass',.01)
   for z in [.9,1.07,1.48,1.66]:cylinder('Rivet',(x,-.655,z),.022,.025,'Brass','Y')
  for z in [.87,1.73]:box('Coach rim',(0,-.63,z),(2.91,.04,.035),'Brass',.008)
  box('Curved coach roof',(0,0,1.92),(3.34,1.42,.26),'Dark',.13)
  box('Recessed word panel',(0,-.628,1.31),(2.51,.055,.59),'Cream',.07)
  if kind=='caboose':
   box('Cupola',(0,0,2.18),(1.05,.85,.45),paint,.07)
   for x in [-.25,.25]:box('Cupola window',(x,-.432,2.19),(.3,.04,.26),'Glass',.025)
   box('Cupola roof',(0,0,2.43),(1.26,1.08,.13),'Dark',.07)
 wheels=[wheel(x,y) for x in [-1.08,1.08] for y in [-.59,.59]]
 objects=list(scene.objects)
 for o in objects:o.select_set(True)
 bpy.ops.object.camera_add(location=(0,-12,4.8));cam=bpy.context.object;target=Vector((0,0,1.18));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.4;scene.camera=cam
 for name,p,power,size in [('Key',(-3,-5,7),650,5),('Fill',(3,-1,4),220,4),('Rim',(1,4,5),480,3)]:
  bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
 scene.world=bpy.data.worlds.new(kind+' ambient');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35
 scene.render.engine='CYCLES';scene.cycles.samples=12;scene.render.film_transparent=True;scene.render.resolution_x=512;scene.render.resolution_y=320;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX'
 frames=REVIEW/kind;frames.mkdir(exist_ok=True)
 for i in range(8):
  scene.frame_set(i*3)
  for w in wheels:w.rotation_euler.y=i*math.tau/64
  for w in wheels:w.keyframe_insert(data_path='rotation_euler',frame=i*3)
  scene.render.filepath=str(frames/(str(i)+'.png'))
  if '--reuse-renders' not in sys.argv or not (frames/(str(i)+'.png')).exists():bpy.ops.render.render(write_still=True)
 subprocess.run(['python3','-c',"from PIL import Image;from pathlib import Path;import sys;root=Path(sys.argv[1]);im=Image.new('RGBA',(2048,640));[im.paste(Image.open(root/(str(i)+'.png')),(i%4*512,i//4*320)) for i in range(8)];im.save(sys.argv[2],quality=90,method=4)",str(frames),str(OUT/(kind+'.webp'))],check=True)
 # One spoke pitch loops smoothly; exporting after keying preserves real motion.
 scene.frame_start=0;scene.frame_end=24
 for w in wheels:w.rotation_euler.y=math.tau/8;w.keyframe_insert(data_path='rotation_euler',frame=24)
 scene.frame_set(0);bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/(kind+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_animations=True,export_animation_mode='SCENE',export_frame_range=True)
 records.append({'id':kind,'url':'/game-assets/arcade-worlds/trains/'+kind+'.glb','glbSha256':hashlib.sha256((OUT/(kind+'.glb')).read_bytes()).hexdigest(),'glbBytes':(OUT/(kind+'.glb')).stat().st_size,'sprite':{'url':'/game-assets/arcade-worlds/trains/'+kind+'.webp','width':512,'height':320,'frames':8,'columns':4,'fps':12},'sha256':hashlib.sha256((OUT/(kind+'.webp')).read_bytes()).hexdigest()})
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'Railway.blend'),compress=True)
(OUT/'manifest.json').write_text(json.dumps({'creator':'Literacy Guide','license':'Project-owned','source':'source-art/arcade/rolling-stock/Railway.blend','sourceSha256':hashlib.sha256((SOURCE/'Railway.blend').read_bytes()).hexdigest(),'authoring':'tools/blender/build_arcade_rolling_stock.py','authoringSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'assets':records},indent=2)+'\n')
