"""Original canonical 360-degree skaters on the retained complete skate rig.

The sports canonical actor recipe owns identity/UV materials. This derivative
retargets its actual surfaces to the original board/foot/balance contact rig,
authors open hands and deck-aligned feet, and preserves all ten physics states.
Old skater sources, models and clips remain untouched until native gates pass.
"""
import bpy, bmesh, sys, os, json, hashlib
from mathutils import Vector, Matrix

ROOT = sys.argv[sys.argv.index('--')+1]
world = sys.argv[sys.argv.index('--world')+1] if '--world' in sys.argv else 'meadow'
character_id, character = {'meadow':('bouncy','Bouncy'),'dino':('chompy','Chompy'),'moonwood':('pip','Pip')}[world]
actor_path=os.path.join(ROOT,'artwork/games/sound-racer/build_canonical_racers.py')
actor_recipe=open(actor_path).read()
exec(compile(actor_recipe[:actor_recipe.index("{'meadow':add_bouncy")],actor_path,'exec'),globals())
old_rig=rig
old_bones={name:bone.matrix_local.copy() for name,bone in old_rig.data.bones.items()}
before=set(scene.objects)
{'meadow':add_bouncy,'dino':add_chompy,'moonwood':add_pip}[world]()
actor_objects=[obj for obj in scene.objects if obj not in before and obj.type=='MESH']
# Chompy and Pip create their canonical surface materials with the actor. Retain
# that complete table before the original board recipe establishes its own bank.
old_materials=dict(materials)

base_path=os.path.join(ROOT,'artwork/games/spell-skate/build_skater.py')
skate_recipe=open(base_path).read()
prefix=skate_recipe[:skate_recipe.index('# Tailored curved torso')]
prefix=prefix.replace("bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)", '')
exec(compile(prefix,base_path,'exec'),globals())
materials.update(old_materials)
rig.name=character+'SkaterRig';rig.data.name=character+'SkaterSemanticRig'
new_bones={name:bone.matrix_local.copy() for name,bone in rig.data.bones.items()}
name_map={name:name.replace('upperarm.','arm.') for name in old_bones}

def transformed(point, old_name):
    target_name=name_map[old_name]
    a=old_bones[old_name];b=new_bones[target_name]
    q=Vector(point)
    if old_name in ('hips','chest','neck','head'):
        # Racer faces Blender+Y, the park's contact/camera rig faces Blender-Y.
        q.y=a.translation.y-(q.y-a.translation.y)
    local=a.inverted() @ q
    old_length=old_rig.data.bones[old_name].length
    new_length=rig.data.bones[target_name].length
    radial=1.28 if old_name in ('head','neck') else 1.38
    if old_name.startswith(('thigh.','shin.')) and world=='meadow': radial=1.14
    return b @ Vector((local.x*radial,local.y*new_length/old_length,local.z*radial))

retained=set(actor_objects)
for obj in actor_objects:
    group_names={group.index:group.name for group in obj.vertex_groups}
    if any(name.startswith(('hand.','foot.')) for name in group_names.values()):
        retained.discard(obj)
        bpy.data.objects.remove(obj,do_unlink=True);continue
    for vertex in obj.data.vertices:
        contributors=[(group_names[group.group],group.weight) for group in vertex.groups if group.weight>0]
        vertex.co=sum((transformed(vertex.co,name)*weight for name,weight in contributors),Vector())
    if any(name in ('hips','chest','neck','head') for name in group_names.values()):
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.reverse_faces(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    for group in obj.vertex_groups: group.name=name_map[group.name]
    obj.parent=rig
    for modifier in obj.modifiers:
        if modifier.type=='ARMATURE': modifier.object=rig

for obj in list(scene.objects):
    if obj is rig or obj in retained:continue
    bpy.data.objects.remove(obj,do_unlink=True)

# The full concave maple deck, grip, trucks and all four lathed wheels are the
# old physical/contact authority, not a replacement flat board graphic.
board=skate_recipe[skate_recipe.index('# Laminated deck:'):skate_recipe.index('# Analytic two-bone contact solve.')]
exec(compile(board,base_path,'exec'),globals())

def add_original_uv(obj):
    if obj.data.uv_layers:return
    uv=obj.data.uv_layers.new(name='OriginalSkateMaterialUV')
    for poly in obj.data.polygons:
        axis=max(range(3),key=lambda n:abs(poly.normal[n]));axes=[n for n in range(3) if n!=axis]
        for loop in poly.loop_indices:
            p=obj.data.vertices[obj.data.loops[loop].vertex_index].co
            uv.data[loop].uv=(p[axes[0]]*.85,p[axes[1]]*.85)

for side,s in [('L',-1),('R',1)]:
    ankle=Vector(bones['foot.'+side][0]);x,y,z=ankle
    foot_material={'meadow':'BrownSuedeHoof','dino':'OrangeDinosaurVelour','moonwood':'LeatherLight'}[world]
    sole_material={'meadow':'BrownSuedeHoof','dino':'DinoBelly','moonwood':'Leather'}[world]
    for name,z_values,radii,mat in [
      ('AttachedFoot',[z-.075,z-.04,z+.055,z+.13],[(.32,.14),(.34,.15),(.29,.143),(.17,.115)],foot_material),
      ('ContactSole',[z-.105,z-.065],[(.34,.152),(.34,.152)],sole_material)]:
        obj=rings(character+name+'.'+side,[(x+.08,y,h) for h in z_values],radii,mat,'foot.'+side,28,0)
        add_original_uv(obj)
    if world=='dino':
        for toe in [-1,0,1]:ellipsoid('ChompySkateToenail.'+side,(x+.395,y+toe*.081,z-.025),(.048,.029,.028),'DinoNail','foot.'+side,16,10)
    if world=='moonwood':
        rings('PipSkateBootCuff.'+side,[(x-.045,y,h) for h in [z+.073,z+.147]],[(.17,.126)]*2,'PipCollar','foot.'+side,28,0)
    wrist=Vector(bones['hand.'+side][0]);tip=Vector(bones['hand.'+side][1]);axis=(tip-wrist).normalized()
    mat={'meadow':'BrownSuedeHoof','dino':'OrangeDinosaurVelour','moonwood':'PipSkin'}[world]
    # Original free balance hands replace the seated wheel-grip geometry.
    palm=ellipsoid(character+'OpenBalancePalm.'+side,wrist.lerp(tip,.42),(.13,.083,.15),mat,'hand.'+side,28,18)
    add_original_uv(palm)
    if world!='meadow':
        for finger in range(3 if world=='dino' else 4):
            origin=wrist.lerp(tip,.66)+Vector((s*(finger-1.5)*.053,0,0))
            end=origin+axis*(.16-.024*abs(finger-1.5))
            limb(character+'BalanceFinger.'+side,origin,end,(.030,.018),mat,'hand.'+side)
        thumb=wrist.lerp(tip,.30)+Vector((-s*.10,-.025,0))
        limb(character+'BalanceThumb.'+side,thumb,thumb+Vector((-s*.06,-.03,-.12)),(.041,.028),mat,'hand.'+side)

# Independent original plank art gives the existing curved maple deck actual
# grain in every camera/spin view; top grip remains its readable dark surface.
deck_material=materials['gold'];image=bpy.data.images.load(os.path.join(ROOT,'public/game-assets/physical-arcade/burrow-builders/materials/plank-albedo-v1.webp'));image.pack()
texture=deck_material.node_tree.nodes.new('ShaderNodeTexImage');texture.image=image
deck_material.node_tree.links.new(texture.outputs['Color'],deck_material.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
for obj in scene.objects:
    if obj.type=='MESH' and obj.name.startswith('MapleDeck'):add_original_uv(obj)

clips_source=skate_recipe[skate_recipe.index('# Analytic two-bone contact solve.'):skate_recipe.index('# Editable file retains rig')]
exec(compile(clips_source,base_path,'exec'),globals())
SRC=os.path.join(ROOT,'source-art/arcade/spell-skate-3d');OUT=os.path.join(ROOT,'public/game-assets/spell-skate/models')
os.makedirs(SRC,exist_ok=True);os.makedirs(OUT,exist_ok=True)
bpy.context.preferences.filepaths.save_version=0
blend=os.path.join(SRC,character_id+'-skater-v2.blend');bpy.ops.wm.save_as_mainfile(filepath=blend)
for mat in list(bpy.data.materials):
    objects=[obj for obj in scene.objects if obj.type=='MESH' and obj.data.materials and obj.data.materials[0]==mat]
    if len(objects)<2:continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=character+'Skater_'+mat.name
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
for obj in scene.objects:
    if obj.type=='MESH':obj.select_set(True)
path=os.path.join(OUT,character_id+'-skater-v2.glb')
# The pushing foot crosses ground/deck contact at odd authored frames. Keep
# every original 30 Hz key so interpolation cannot sink the sole at crossover.
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_skins=True,export_yup=True,export_force_sampling=True,export_frame_step=1,export_materials='EXPORT')
record={'world':world,'character':character,'status':'Original full 3D derivative; actual clip/contact/native park verification pending',
 'source':'artwork/games/spell-skate/build_canonical_skaters.py','recipeSha256':hashlib.sha256(open(__file__,'rb').read()).hexdigest(),
 'actorRecipe':'artwork/games/sound-racer/build_canonical_racers.py','actorRecipeSha256':hashlib.sha256(actor_recipe.encode()).hexdigest(),
 'boardAndContactRecipe':'artwork/games/spell-skate/build_skater.py','boardRecipeSha256':hashlib.sha256(skate_recipe.encode()).hexdigest(),
 'editable':'source-art/arcade/spell-skate-3d/'+character_id+'-skater-v2.blend','runtime':'/game-assets/spell-skate/models/'+character_id+'-skater-v2.glb',
 'sha256':hashlib.sha256(open(path,'rb').read()).hexdigest(),'bytes':os.path.getsize(path),'clips':[name for name,duration in clips],
 'semanticBones':list(bones),'axes':'Runtime+Y up,+Z forward. Tyres ground0; left and right deck soles .565; right pushing foot intentionally reaches ground.',
 'identity':'Canonical '+character+' original 360-degree surface/material derivative; exactly two true coil legs for Bouncy; open balance hands, deck-registered feet and complete board.',
 'ownership':'Original retained sports actor geometry + approved original UV materials and maple grain; no external model/service.'}
open(os.path.join(SRC,character_id+'-skater-v2.json'),'w').write(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
