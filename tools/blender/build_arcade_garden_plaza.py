"""Build the retained garden/plaza kit in Blender. Coordinates: Y-up, -Z-forward.
Imported geometry is CC0; the rover body and source assembly are original.
"""
import math
import bpy, bmesh, json, hashlib, subprocess, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'source-art/arcade/garden-plaza'
OUT=ROOT/'public/game-assets/arcade-worlds'
REVIEW=ROOT/'.artifacts/arcade-world-upgrade'
for p in (SOURCE,OUT,REVIEW):p.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version=0

def v(p):return (p[0],-p[2],p[1])
def mat(name,hex,rough=.7,metal=0):
 rgb=[int(hex[i:i+2],16)/255 for i in (0,2,4)];rgb=[x/12.92 if x<.04045 else ((x+.055)/1.055)**2.4 for x in rgb]
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*rgb,1)
 b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*rgb,1);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 return m
M={k:mat(k,c,r,metal) for k,c,r,metal in [('Teal','387F78',.55,.12),('Cream','E9DCC0',.72,0),('Tire','283438',.85,0),('Metal','B6BFBC',.4,.6),('Seat','79543C',.9,0),('Wood','B0814D',.85,0),('Dark','263F42',.65,.12),('Light','FFE9A9',.45,.1),('Coral','C86645',.75,0)]}

def new_scene(name):
 scene=bpy.data.scenes.new(name);bpy.context.window.scene=scene;return scene

def mesh(name,pts,faces,material,bevel=0,smooth=False):
 d=bpy.data.meshes.new(name);d.from_pydata([v(p) for p in pts],[],faces);d.update()
 bm=bmesh.new();bm.from_mesh(d);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(d);bm.free()
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);d.materials.append(M[material])
 if bevel:
  m=o.modifiers.new('Rounded manufactured edges','BEVEL');m.width=bevel;m.segments=3
  o.modifiers.new('Surface normals','WEIGHTED_NORMAL')
 for f in d.polygons:f.use_smooth=smooth
 return o

def box(name,p,s,material,bevel=.08):
 x,y,z=p;a,b,c=[q/2 for q in s]
 return mesh(name,[(x+i*a,y+j*b,z+k*c) for i,j,k in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]],[(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)],material,bevel)

def beam(name,a,b,r,material,r2=None,n=20):
 a,b=Vector(a),Vector(b);d=(b-a).normalized();t=d.cross(Vector((0,1,0)))
 if t.length<.01:t=d.cross(Vector((1,0,0)))
 t.normalize();u=d.cross(t)
 pts=[tuple(p+rad*(t*math.cos(j*math.tau/n)+u*math.sin(j*math.tau/n))) for p,rad in [(a,r),(b,r if r2 is None else r2)] for j in range(n)]
 return mesh(name,pts,[tuple(reversed(range(n))),tuple(range(n,n*2))]+[(j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n)],material,0,True)

def curve(name,pts,r,material):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=8;data.bevel_depth=r;data.bevel_resolution=3
 sp=data.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
 for bp,p in zip(sp.bezier_points,pts):bp.co=v(p);bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);data.materials.append(M[material]);return o

def bounds(objects):
 pts=[o.matrix_world@Vector(c) for o in objects if o.type=='MESH' for c in o.bound_box]
 return Vector(tuple(min(p[i] for p in pts) for i in range(3))),Vector(tuple(max(p[i] for p in pts) for i in range(3)))

def camera_lights(scene):
 meshes=[o for o in scene.objects if o.type in ('MESH','CURVE')];bpy.context.view_layer.update();lo,hi=bounds(meshes);c=(lo+hi)/2;span=max(hi-lo)
 bpy.ops.object.camera_add(location=c+Vector((span*1.3,-span*1.9,span*.9)));cam=bpy.context.object;cam.name='Delivery camera';cam.data.type='ORTHO';cam.data.ortho_scale=span*1.5;cam.rotation_euler=(c-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
 for name,pos,power,size in [('Key',(-3,-4,7),950,5),('Fill',(4,-1,4),500,5),('Rim',(0,4,6),850,4)]:
  bpy.ops.object.light_add(type='AREA',location=c+Vector(pos)*span/5);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size*span/5;o.rotation_euler=(c-o.location).to_track_quat('-Z','Y').to_euler()
 world=bpy.data.worlds.new(scene.name+' atmosphere');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.52,.65,.72,1);world.node_tree.nodes['Background'].inputs[1].default_value=.4;scene.world=world
 scene.render.engine='CYCLES';scene.cycles.samples=20;scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.view_settings.view_transform='AgX'

RECORDS=[]
def deliver(scene,id,source,animated=False):
 bpy.context.window.scene=scene;bpy.context.view_layer.update()
 for image in bpy.data.images:
  limit=256 if 'Normal' in image.name else 512
  if image.source=='FILE' and max(image.size)>limit:
   if image.packed_file:
    unpacked=REVIEW/'optimized-textures';unpacked.mkdir(exist_ok=True);packed_path=unpacked/image.name;packed_path.write_bytes(image.packed_file.data);image.unpack(method='REMOVE');image.filepath=str(packed_path);image.reload()
   ratio=limit/max(image.size);_ = image.pixels[0];image.scale(max(1,round(image.size[0]*ratio)),max(1,round(image.size[1]*ratio)))
   optimized=REVIEW/'optimized-textures';optimized.mkdir(exist_ok=True);image.filepath_raw=str(optimized/(image.name.replace('/','_')+'.png'));image.file_format='PNG';image.save();image.pack()
 bpy.ops.object.select_all(action='DESELECT')
 objects=[o for o in scene.objects if o.type in ('MESH','CURVE','ARMATURE') and o.name in bpy.context.view_layer.objects]
 copies=[]
 for original in objects:
  if original.type not in ('MESH','CURVE'):continue
  evaluated=original.evaluated_get(bpy.context.evaluated_depsgraph_get())
  copy=bpy.data.objects.new(original.name,bpy.data.meshes.new_from_object(evaluated));scene.collection.objects.link(copy);copy.matrix_world=original.matrix_world.copy();copies.append(copy)
 static=[o for o in copies if not o.name.startswith('Wheel_')]
 if static:
  for o in static:o.select_set(True)
  bpy.context.view_layer.objects.active=static[0];bpy.ops.object.join();merged=bpy.context.object;merged.name='Authored structure';copies=[merged]+[o for o in copies if o not in static]
 bpy.ops.object.select_all(action='DESELECT')
 for o in copies:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/(id+'.glb')),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=animated)
 for o in copies:bpy.data.objects.remove(o,do_unlink=True)
 lo,hi=bounds(objects);data=(OUT/(id+'.glb')).read_bytes()
 RECORDS.append({'id':id,'url':'/game-assets/arcade-worlds/'+id+'.glb','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'source':source,'bounds':{'min':[lo.x,lo.z,-hi.y],'max':[hi.x,hi.z,-lo.y]}})
 camera_lights(scene);scene.render.filepath=str(REVIEW/(id+'.png'))
 if '--reuse-renders' not in sys.argv or not (REVIEW/(id+'.png')).exists():bpy.ops.render.render(write_still=True)
 # Ground-registered transparent views also support the canvas game worlds.
 if id in ['broadleaf-tree','birch-canopy','flowering-shrub','woodland-rock','meadow-grass']:
  sprites=OUT/'sprites';sprites.mkdir(exist_ok=True)
  subprocess.run(['python3','-c','from PIL import Image;import sys;im=Image.open(sys.argv[1]);im.crop(im.getchannel("A").getbbox()).save(sys.argv[2],quality=88,method=4)',str(REVIEW/(id+'.png')),str(sprites/(id+'.webp'))],check=True)
  RECORDS[-1]['sprite']={'url':'/game-assets/arcade-worlds/sprites/'+id+'.webp','registration':'cropped-alpha-bottom-centre','bytes':(sprites/(id+'.webp')).stat().st_size,'sha256':hashlib.sha256((sprites/(id+'.webp')).read_bytes()).hexdigest()}


# Imported architecture retains its UV atlas; the complete dependency is embedded.
for name,id in [('building-type-a','park-house'),('building-type-g','park-workshop'),('building-type-k','park-cafe')]:
 scene=new_scene(id);bpy.ops.import_scene.gltf(filepath=str(SOURCE/'imports'/(name+'.glb')))
 for o in scene.objects:
  if o.type=='MESH':
   o.name=id+' structure'
   for m in o.data.materials:
    if m and m.use_nodes:m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.84
 deliver(scene,id,{'creator':'Kenney','license':'CC0-1.0','pack':'City Kit Suburban 2.0','input':'imports/'+name+'.glb','sourceUrl':'https://kenney.nl/assets/city-kit-suburban'})

# Original rover; every visible wheel has a true axle pivot in the export.
scene=new_scene('garden-rover')
box('Pressed chassis',(0,.7,0),(2.4,.48,3.5),'Teal',.22)
box('Rounded bonnet',(0,1.24,-1.04),(1.88,.86,1.25),'Teal',.27)
box('Cream bonnet stripe',(0,1.689,-1.07),(.45,.025,1.0),'Cream',.02)
box('Front grille housing',(0,1.18,-1.69),(1.64,.53,.1),'Dark',.1)
for x in [-.6,-.4,-.2,0,.2,.4,.6]:box('Grille rib',(x,1.18,-1.76),(.045,.39,.06),'Metal',.018)
curve('Front bumper',[(-1.22,.71,-1.75),(-.95,.7,-1.97),(.95,.7,-1.97),(1.22,.71,-1.75)],.105,'Cream')
for x in [-1,1]:
 beam('Headlight housing',(x,1.22,-1.55),(x,1.22,-1.83),.23,'Dark')
 beam('Headlight lens',(x,1.22,-1.83),(x,1.22,-1.845),.18,'Light')
 box('Footboard',(x*1.13,.72,.16),(.55,.16,1.24),'Cream',.08)
 curve('Wheel guard',[(x*1.36,.99,-1.65),(x*1.36,1.24,-1.13),(x*1.36,1.0,-.62)],.15,'Teal')
box('Seat cushion',(0,1.2,.45),(1.3,.18,.82),'Seat',.14)
box('Seat back',(0,1.57,.87),(1.32,.72,.19),'Seat',.15)
curve('Rear safety hoop',[(-.99,.82,.92),(-.99,2.75,.92),(.99,2.75,.92),(.99,.82,.92)],.065,'Cream')
box('Basket floor',(0,1.09,1.36),(1.75,.14,.84),'Wood',.06)
for x in [-.84,.84]:
 for y in [1.27,1.49]:box('Basket side slat',(x,y,1.35),(.09,.13,.86),'Wood',.025)
for z in [.95,1.76]:
 for y in [1.27,1.49]:box('Basket end slat',(0,y,z),(1.75,.13,.09),'Wood',.025)
beam('Garden tool handle',(.58,1.2,1.34),(.35,2.37,1.37),.043,'Wood')
box('Garden tool grip',(.35,2.38,1.37),(.34,.1,.12),'Dark',.04)
beam('Steering column',(0,1.05,-.26),(0,1.7,-.42),.065,'Dark')
curve('Steering wheel',[(-.37,1.73,-.45),(0,1.84,-.61),(.37,1.73,-.45),(0,1.61,-.28),(-.37,1.73,-.45)],.04,'Dark')
for x,label in [(-1.25,'L'),(1.25,'R')]:
 for z,axle in [(-1.12,'F'),(1.12,'B')]:
  parts=[];parts.append(beam('Tread',(x-.2,.57,z),(x+.2,.57,z),.57,'Tire',n=32));parts.append(beam('Wheel rim',(x-.215,.57,z),(x+.215,.57,z),.31,'Cream',n=24));parts.append(beam('Axle cap',(x-.23,.57,z),(x+.23,.57,z),.14,'Metal'))
  for j in range(14):
   a=j*math.tau/14;parts.append(box('Tread lug',(0,0,0),(.44,.055,.07),'Tire',.015));parts[-1].location=v((x,.57+math.cos(a)*.563,z+math.sin(a)*.563));parts[-1].rotation_euler[0]=a
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();wheel=bpy.context.object;wheel.name='Wheel_'+axle+label;scene.cursor.location=v((x,.57,z));bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
# Preserve the existing approved Pip kart driver's seated anatomy and materials.
existing=set(scene.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/game-assets/sound-racer/models/pip-kart.glb'))
imported=[o for o in scene.objects if o not in existing]
body_bones={'hips','chest','neck','head','upperarm.L','forearm.L','hand.L','upperarm.R','forearm.R','hand.R','thigh.L','shin.L','foot.L','thigh.R','shin.R','foot.R'}
driver=[]
for original in imported:
 if original.type!='MESH':continue
 groups={g.index for g in original.vertex_groups if g.name in body_bones}
 allowed={vert.index for vert in original.data.vertices if sum(g.weight for g in vert.groups if g.group in groups)>.75}
 if not allowed:continue
 copy=original.copy();copy.data=original.data.copy();scene.collection.objects.link(copy)
 bm=bmesh.new();bm.from_mesh(copy.data);bm.verts.ensure_lookup_table();bmesh.ops.delete(bm,geom=[vert for vert in bm.verts if vert.index not in allowed],context='VERTS');bm.to_mesh(copy.data);bm.free()
 bpy.context.view_layer.update();evaluated=copy.evaluated_get(bpy.context.evaluated_depsgraph_get());obj=bpy.data.objects.new('Pip driver '+original.name,bpy.data.meshes.new_from_object(evaluated));scene.collection.objects.link(obj);obj.matrix_world=copy.matrix_world.copy();driver.append(obj);bpy.data.objects.remove(copy,do_unlink=True)
for o in imported:bpy.data.objects.remove(o,do_unlink=True)
if not driver:raise RuntimeError('Canonical Pip driver extraction failed')
bpy.context.view_layer.update();lo,hi=bounds(driver);scale=1.8/(hi.z-lo.z);centre=(lo+hi)/2
for o in driver:
 o.location=(o.location-Vector((centre.x,centre.y,lo.z)))*scale+Vector(v((0,1.25,.14)));o.scale*=scale
# Separate source parts, welded runtime static surfaces; wheels keep their pivots.
deliver(scene,'garden-rover',{'creator':'Literacy Guide','license':'Project-owned','input':'build_arcade_garden_plaza.py','characterSource':'public/game-assets/sound-racer/models/pip-kart.glb'})

# Nature imports are processed below when their complete dependency set is present.
for name,id in [('BirchTree_1','birch-canopy'),('BirchTree_3','birch-tall'),('Bush_Large_Flowers','flowering-shrub')]:
 source=SOURCE/'imports/quaternius'/(name+'.gltf')
 if not source.exists():raise RuntimeError('Missing nature source '+str(source))
 scene=new_scene(id);bpy.ops.import_scene.gltf(filepath=str(source))
 for o in scene.objects:
  if o.type=='MESH':
   o.name=id+' '+o.name
   for m in o.data.materials:
    if m and m.use_nodes:m.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.93
 deliver(scene,id,{'creator':'Quaternius','license':'CC0-1.0','pack':'Ultimate Stylized Nature','input':'imports/quaternius/'+name+'.gltf','sourceUrl':'https://quaternius.com/packs/ultimatestylizednature.html'})
for name,id in [('rock_largeA','mossy-rock')]:
 scene=new_scene(id);bpy.ops.import_scene.gltf(filepath=str(SOURCE/'imports'/(name+'.glb')))
 for o in scene.objects:
  if o.type=='MESH':
   for m in o.data.materials:
    if not m:continue
    color='7F8A68' if 'grass' in m.name else '8F8C80';replacement=mat(id+' '+m.name,color,.95);o.data.materials[o.data.materials.find(m.name)]=replacement
 deliver(scene,id,{'creator':'Kenney','license':'CC0-1.0','pack':'Nature Kit 2.1','input':'imports/'+name+'.glb','sourceUrl':'https://kenney.nl/assets/nature-kit'})
# Broad canopy meshes retain their authored UVs and complete packed textures.
for name,id in [('NormalTree_1','broadleaf-tree'),('NormalTree_3','broadleaf-tall'),('MapleTree_1','maple-tree'),('Rock_1','woodland-rock'),('Grass_Small','meadow-grass')]:
 scene=new_scene(id)
 with bpy.data.libraries.load(str(SOURCE/'imports/quaternius/woodland-selection.blend'),link=False) as (data,out):out.objects=[name]
 for o in out.objects:scene.collection.objects.link(o)
 deliver(scene,id,{'creator':'Quaternius','license':'CC0-1.0','pack':'Ultimate Stylized Nature','input':'imports/quaternius/woodland-selection.blend','sourceObject':name,'sourceUrl':'https://quaternius.com/packs/ultimatestylizednature.html'})

# One repeatable bark surface for the continuous climbing route.
texture_dir=OUT/'textures';texture_dir.mkdir(exist_ok=True)
for image in bpy.data.images:
 if image.name.startswith('NormalTree_Bark.'):
  image.filepath_raw=str(REVIEW/'bark-surface.png');image.file_format='PNG';image.save()
  subprocess.run(['python3','-c','from PIL import Image;import sys;Image.open(sys.argv[1]).save(sys.argv[2],quality=90,method=6)',str(REVIEW/'bark-surface.png'),str(texture_dir/'bark.webp')],check=True);break
# Save the complete editable scene bank, with packed source textures.
for image in bpy.data.images:
 if image.source=='FILE' and image.has_data:image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'Garden-and-Plaza.blend'),compress=True)
inputs=[p for p in (SOURCE/'imports').rglob('*') if p.is_file()]
manifest={'schemaVersion':1,'blender':bpy.app.version_string,'source':'source-art/arcade/garden-plaza/Garden-and-Plaza.blend','sourceSha256':hashlib.sha256((SOURCE/'Garden-and-Plaza.blend').read_bytes()).hexdigest(),'authoring':'tools/blender/build_arcade_garden_plaza.py','authoringSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'models':RECORDS,'textures':[{'url':'/game-assets/arcade-worlds/textures/'+p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in texture_dir.iterdir()],'inputs':[{'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Delivered',len(RECORDS),'models',sum(m['bytes'] for m in RECORDS),'bytes')
