"""Author Pip's independent climbing poses from the approved semantic mesh.
Blender --background --python build_climber.py -- REPOSITORY_ROOT [--render]
The source .blend remains untouched. Named surfaces remain editable in our .blend.
"""
import bpy, math, sys, os, json, hashlib
from mathutils import Vector, Matrix
ROOT = sys.argv[sys.argv.index('--') + 1]
SRC = os.path.join(ROOT, 'artwork/games/word-climb')
OUT = os.path.join(ROOT, 'public/game-assets/word-climb')
QA = os.path.join(ROOT, '.artifacts/word-climb-production')
source = os.path.join(ROOT, 'artwork/games/sound-racer/pip-kart.blend')
source_hash = hashlib.sha256(open(source, 'rb').read()).hexdigest()
if source_hash != 'ee12f4192b8930476b11a4158ed1a157843be3d830f7ade585ca7dc82efc30e9':
    raise RuntimeError('Pip source changed: review the new semantic mesh before updating the approved snapshot hash.')
bpy.ops.wm.open_mainfile(filepath=source)
scene = bpy.context.scene
scene.render.fps = 30
bpy.context.preferences.filepaths.save_version = 0
rig = next(o for o in scene.objects if o.type == 'ARMATURE')
rig.name = 'PipClimberRig'
rig.animation_data_clear()
keep = {'hips','chest','neck','head'} | {p+'.'+s for p in ['upperarm','forearm','hand','thigh','shin','foot'] for s in ['L','R']}
for obj in list(scene.objects):
    if obj != rig and (obj.type != 'MESH' or not any(g.name in keep for g in obj.vertex_groups)):
        bpy.data.objects.remove(obj, do_unlink=True)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
rig.data.edit_bones['hips'].parent = None
for bone in list(rig.data.edit_bones):
    if bone.name not in keep: rig.data.edit_bones.remove(bone)
bpy.ops.object.mode_set(mode='OBJECT')
rest = {b.name:(b.head_local.copy(),b.tail_local.copy(),b.parent.name if b.parent else None,b.matrix_local.copy()) for b in rig.data.bones}
order = sorted(rest, key=lambda n: len(rig.data.bones[n].parent_recursive))
rig.animation_data_create()

def pose(clip, t):
    # Feet have explicit independent contacts. Torso squash is knee flexion,
    # never a whole-character scale that separates the boots from the shelf.
    wave = math.sin(t*math.tau)
    drop = .015*wave if clip == 'rest' else 0
    if clip == 'land': drop = -.24 * math.sin(math.pi*t) * (1-t)
    if clip == 'jump': drop = -.13 * math.sin(math.pi*t)
    if clip in ['grip','recover']: drop = -.14
    if clip == 'summit': drop = .025*wave
    targets = {}
    def shift(p): return Vector((p[0],p[1]+.36,p[2]+.37+drop))
    for name in ['hips','chest','neck','head']:
        a,b,_,_ = rest[name]; targets[name] = (shift(a),shift(b))
    for side,s in [('L',-1),('R',1)]:
        shoulder = Vector((s*.27,0,1.77+drop))
        hip = Vector((s*.17,.04,1.16+drop))
        knee = Vector((s*.23,.08,.65+drop*.45))
        ankle = Vector((s*.25,0,.092))
        elbow = Vector((s*.36,.025,1.42+drop))
        wrist = Vector((s*.32,.09,1.10+drop))
        handtail = wrist + Vector((0,.045,-.055))
        if clip in ['jump','grip','recover','climb']:
            # A small shoulder shrug preserves sleeve overlap while putting
            # the curled hands above the hair, never across Pip's eyes.
            shoulder.z += .10
            elbow = Vector((s*.39,.10,2.26+drop))
            wrist = Vector((s*.30,.23,2.59+drop+(.015 if side=='L' else -.025)))
            handtail = wrist + Vector((0,.065,.025))
            knee = Vector((s*.26,.31,.81+drop))
            ankle = Vector((s*.28,.02,.29 if side=='L' else .13))
        if clip == 'climb':
            # Opposite hand and boot advance together; one side holds while
            # the other reaches, with hands beyond the hair silhouette.
            reach = math.sin(t*math.tau + (0 if side=='L' else math.pi))
            wrist.z += .12*reach
            elbow.z += .06*reach
            handtail = wrist + Vector((0,.065,.025))
            knee.z -= .10*reach
            ankle.z -= .10*reach
            ankle.y += .10
        if clip == 'summit':
            elbow = Vector((s*.50,.03,1.90+drop))
            wrist = Vector((s*.57,.03,2.20+drop+.035*wave))
            handtail = wrist + Vector((0,.025,.065))
        targets.update({
            'upperarm.'+side:(shoulder,elbow), 'forearm.'+side:(elbow,wrist),
            'hand.'+side:(wrist,handtail), 'thigh.'+side:(hip,knee),
            'shin.'+side:(knee,ankle), 'foot.'+side:(ankle,ankle+Vector((0,.27,-.02)))})
    desired = {}
    for name in order:
        a,b = targets[name]; ra,rb,parent,matrix = rest[name]
        rotation = (rb-ra).rotation_difference(b-a) @ matrix.to_quaternion()
        desired[name] = Matrix.LocRotScale(a,rotation,Vector((1,(b-a).length/(rb-ra).length,1)))
        bone = rig.pose.bones[name]; bone.rotation_mode='QUATERNION'
        bone.matrix_basis = matrix.inverted() @ rest[parent][3] @ desired[parent].inverted() @ desired[name] if parent else matrix.inverted() @ desired[name]
    bpy.context.view_layer.update()

clips = {'rest':60,'climb':42,'jump':28,'land':12,'grip':18,'recover':28,'summit':60}
for clip,frames in clips.items():
    action=bpy.data.actions.new('climb_'+clip); rig.animation_data.action=action
    for frame in range(1,frames+1):
        pose(clip,(frame-1)/(frames-1))
        for bone in rig.pose.bones:
            for path in ['location','rotation_quaternion','scale']: bone.keyframe_insert(path,frame=frame)
    track=rig.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);track.mute=True
    rig.animation_data.action=None
pose('rest',0)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SRC,'pip-climber.blend'))
# Runtime batches share original materials while retaining the semantic skin.
for material in list(bpy.data.materials):
    objects=[o for o in scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==material]
    if len(objects)<2: continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name='PipClimber_'+material.name
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.ops.object.select_all(action='SELECT')
path=os.path.join(OUT,'pip-climber.glb')
bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_skins=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_yup=True,export_force_sampling=True)
import base64
open(os.path.join(ROOT,'src/components/learn/games/games/wordClimbAssetFallback.js'),'w').write('// Exact authored character recovery copy, generated by build_climber.py.\nexport const CLIMBER_GLB_BASE64 = '+json.dumps(base64.b64encode(open(path,'rb').read()).decode())+';\n')
for track in rig.animation_data.nla_tracks:track.mute=True
pose('rest',0)
if '--render' in sys.argv:
    scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.render.resolution_x=700;scene.render.resolution_y=800;scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    bpy.ops.object.light_add(type='AREA',location=(2,4,6));bpy.context.object.data.energy=550;bpy.context.object.data.size=4
    bpy.ops.object.light_add(type='AREA',location=(-3,-2,4));bpy.context.object.data.energy=350;bpy.context.object.data.size=3
    bpy.ops.object.camera_add(location=(3,6,3));camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=3.05
    camera.rotation_euler=(Vector((0,0,1.2))-camera.location).to_track_quat('-Z','Y').to_euler()
    for clip in clips:
        pose(clip,.4);scene.render.filepath=os.path.join(QA,'pip-'+clip+'.png');bpy.ops.render.render(write_still=True)
record={'character':'Pip','canon':'STORY_BIBLE_PART_2_CANON.md §3 MOON-PIP','reference':'/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp','sourceSnapshotSha256':source_hash,'editable':'artwork/games/word-climb/pip-climber.blend','runtime':'/game-assets/word-climb/pip-climber.glb','sha256':hashlib.sha256(open(path,'rb').read()).hexdigest(),'bytes':os.path.getsize(path),'clips':list(clips),'bones':order,'geometry':'Original in-project semantic Pip mesh; vehicle removed; independent authored climbing contacts','approval':'Pending direct in-game review; no human or physical-device approval claimed'}
record.update(source='artwork/games/word-climb/build_climber.py',worldSource='src/components/learn/games/games/wordClimbSceneKit.js')
open(os.path.join(SRC,'asset-record.json'),'w').write(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
