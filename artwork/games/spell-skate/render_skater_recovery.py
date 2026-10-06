"""Render original model-derived, alpha skating recovery art.

One azimuth owns one bounded 1024x2560 action sheet (4 phases x 10 states).
--pilot renders only one 256-square coast pose for direct quality/cost review.
This recipe never embeds or duplicates encoded model bytes in JavaScript.
"""
import bpy, sys, os, math, json, hashlib
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = sys.argv[sys.argv.index('--') + 1]
world = sys.argv[sys.argv.index('--world') + 1] if '--world' in sys.argv else 'meadow'
view = int(sys.argv[sys.argv.index('--view') + 1]) if '--view' in sys.argv else 0
pilot = '--pilot' in sys.argv
character = {'meadow':'bouncy','dino':'chompy','moonwood':'pip'}[world]
source = os.path.join(ROOT, 'source-art/arcade/spell-skate-3d', character+'-skater-v2.blend')
primary = os.path.join(ROOT, 'public/game-assets/spell-skate/models', character+'-skater-v2.glb')
out = os.path.join(ROOT, 'source-art/arcade/spell-skate-3d/recovery', character, 'view-'+str(view))
if not pilot: out=os.path.join(out,'frames')
os.makedirs(out, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=source)
scene = bpy.context.scene
rig = next(obj for obj in scene.objects if obj.type == 'ARMATURE')
for track in rig.animation_data.nla_tracks: track.mute = True
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.threads_mode = 'FIXED'; scene.render.threads = 2
scene.render.resolution_x = scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'Medium High Contrast' if 'Medium High Contrast' in scene.view_settings.bl_rna.properties['look'].enum_items else 'None'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.78,.84,.91,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .6
for name,position,energy,size in [('WarmKey',(-3,-4,6),430,4),('SoftFill',(3,2,4),240,3)]:
    bpy.ops.object.light_add(type='AREA', location=position)
    lamp=bpy.context.object;lamp.name=name;lamp.data.energy=energy;lamp.data.shape='DISK';lamp.data.size=size
    lamp.rotation_euler = (Vector((0,0,1))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add()
camera=bpy.context.object; scene.camera=camera; camera.name='RegisteredSkaterCamera'
azimuth=view*math.tau/8
camera.location=(7*math.sin(azimuth),7*math.cos(azimuth),5.65)
camera.rotation_euler=(Vector((0,0,1.45))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=4.95
states=['coast','push','turn_left','turn_right','crouch','jump','land','grind','stumble','recover']
frames=[]
def measured_contact(obj):
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    points=[evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
    minimum=min(point.z for point in points)
    planted=[point for point in points if point.z<=minimum+.002]
    contact=sum(planted,Vector())/len(planted)
    evaluated.to_mesh_clear()
    return contact
tyres=sorted([obj for obj in scene.objects if obj.type=='MESH' and obj.name.startswith('Wheel_')],key=lambda obj:obj.name)
soles=[next(obj for obj in scene.objects if obj.type=='MESH' and obj.name.endswith('ContactSole.'+side)) for side in ['L','R']]
assert len(tyres)==4,'The complete original board must retain all four tyres'
for state in (['coast'] if pilot else states):
    action=next(track.strips[0].action for track in rig.animation_data.nla_tracks if track.name==state)
    rig.animation_data.action=action
    if action.slots: rig.animation_data.action_slot=action.slots[0]
    lo,hi=action.frame_range
    for phase_index,phase in enumerate(([.35] if pilot else [0,.25,.5,.75])):
        scene.frame_set(round(lo+(hi-lo)*phase)); bpy.context.view_layer.update()
        file=state+'-'+str(phase_index)+'.png'
        scene.render.filepath=os.path.join(out,file); bpy.ops.render.render(write_still=True)
        def pixel(p):
            q=world_to_camera_view(scene,camera,Vector(p));return [round(q.x*256,4),round((1-q.y)*256,4)]
        frames.append({'source':file,'sha256':hashlib.sha256(open(scene.render.filepath,'rb').read()).hexdigest(),
          'state':state,'phase':phase,'sourceFrame':scene.frame_current,
          'groundAnchor':pixel((0,0,0)),
          'tyreContacts':[pixel(measured_contact(obj)) for obj in tyres],
          'soleContacts':[pixel(measured_contact(obj)) for obj in soles],
          'contactWorld':{'tyres':[list(measured_contact(obj)) for obj in tyres],'soles':[list(measured_contact(obj)) for obj in soles]}})
record={'world':world,'character':character,'view':view,'azimuth':azimuth,'elevation':camera.rotation_euler.x,
 'status':'One-view model-derived quality/cost pilot; direct runtime review pending' if pilot else 'Authored directional recovery source',
 'modelSha256':hashlib.sha256(open(primary,'rb').read()).hexdigest(),'editableSha256':hashlib.sha256(open(source,'rb').read()).hexdigest(),
 'recipeSha256':hashlib.sha256(open(__file__,'rb').read()).hexdigest(),'cell':[256,256],'viewSheet':[1024,2560],'pixelsPerUnit':256/camera.data.ortho_scale,'kind':'skater',
 'viewDecodedBytes':1024*2560*4,'phases':[0,.25,.5,.75],'states':states,'frames':frames,
 'ownership':'Original retained canonical skater/board mesh, ten native contact clips and original UV maps. Local Blender CPU render; no external service.'}
open(os.path.join(out,'registration.json'),'w').write(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
