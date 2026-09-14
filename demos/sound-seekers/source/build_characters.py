"""Author and export Lantern Trail's canonical Bouncy and Woolly characters.

Run with Blender 5.2: blender --background --factory-startup --python this_file
Geometry is authored here; no downloaded meshes, textures or rigs are used.
The reference image is read for design continuity, not embedded in the mesh.
Blender coordinates: Z up / -Y forward. glTF export: Y up / +Z forward.
"""
from pathlib import Path
import math
import json
import random
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'characters'
EVIDENCE = ROOT.parents[1] / '.artifacts' / 'sound-seekers-lantern-demo' / 'characters'
ASSETS.mkdir(parents=True, exist_ok=True)
EVIDENCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.armatures, bpy.data.actions):
    for data in list(datablocks):
        if data.users == 0:
            datablocks.remove(data)
random.seed(416)
bpy.context.preferences.filepaths.save_version = 0


def material(name, hex_color, roughness=.7, metal=0):
    srgb = tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    rgb = tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in srgb)
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metal
    return mat


mats = {
    'wool': material('Bouncy • honey-gold wool', 'F3BC39', .86),
    'tuft': material('Bouncy • sunlit wool tips', 'FFCB50', .84),
    'face': material('Bouncy • warm cream face', 'FFDA82', .78),
    'ear': material('Bouncy • peach inner ears', 'D67B45', .8),
    'scarf': material('Bouncy • red cotton scarf', 'BE2420', .9),
    'scarf_light': material('Bouncy • scarf fold highlights', 'E03F24', .82),
    'hoof': material('Bouncy • chestnut hooves', '50321D', .72),
    'dark': material('Bouncy • nose and smile', '281B13', .7),
    'eye': material('Bouncy • warm ivory eyes', 'FFF7D8', .4),
    'pupil': material('Bouncy • dark kind eyes', '130F0B', .22),
    'glint': material('Bouncy • eye glints', 'FFFFFF', .16),
    'metal': material('Bouncy • silver coil springs', 'B9C2C1', .25, .68),
}

arm_data = bpy.data.armatures.new('Bouncy soft-part rig')
rig = bpy.data.objects.new('Bouncy', arm_data)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bones = {
    'Root': ((0,0,0), None),
    'Body': ((0,0,.65), 'Root'),
    'Head': ((0,0,1.46), 'Body'),
    'Ear.L': ((-.36,0,1.87), 'Head'),
    'Ear.R': ((.36,0,1.87), 'Head'),
    'Arm.L': ((-.29,0,1.24), 'Body'),
    'Arm.R': ((.29,0,1.24), 'Body'),
    'Foot.L': ((-.205,0,.17), 'Root'),
    'Foot.R': ((.205,0,.17), 'Root'),
    'Eye.L': ((-.163,-.36,1.846), 'Head'),
    'Eye.R': ((.163,-.36,1.846), 'Head'),
    'Scarf.L': ((-.03,-.30,1.38), 'Body'),
    'Scarf.R': ((.03,-.30,1.38), 'Body'),
}
for name, (head, parent) in bones.items():
    bone = arm_data.edit_bones.new(name)
    bone.head = head
    bone.tail = Vector(head) + Vector((0,.17,0))
    if parent:
        bone.parent = arm_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
parts = []


def mesh_object(name, vertices, faces, mat, bone='Body', weights=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mats[mat])
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    if weights:
        for bone_name, vertex_weights in weights.items():
            group = obj.vertex_groups.new(name=bone_name)
            for index, weight in vertex_weights:
                if weight > .0001:
                    group.add([index], weight, 'REPLACE')
    else:
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(vertices))), 1, 'REPLACE')
    parts.append(obj)
    return obj


def soft_shape(name, loc, scale, mat, bone='Body', segments=32, rings=20, wool=0, pear=0, tilt=0):
    """A sculpted ovoid with shaped profile and restrained flowing wool ridges."""
    vertices = []
    for i in range(rings+1):
        v = math.pi*i/rings
        sv, cv = math.sin(v), math.cos(v)
        for j in range(segments):
            u = 2*math.pi*j/segments
            ripple = 1 + wool*(.52*math.sin(11*u+2.8*cv)*math.sin(8*v)+.48*math.cos(9*u-3*cv)*math.sin(11*v))
            width = 1 - pear*cv
            x = scale[0] * sv*math.cos(u)*width*ripple
            y = scale[1] * sv*math.sin(u)*ripple
            z = scale[2] * cv
            xx = x*math.cos(tilt)+z*math.sin(tilt)
            zz = -x*math.sin(tilt)+z*math.cos(tilt)
            vertices.append((loc[0]+xx,loc[1]+y,loc[2]+zz))
    faces=[]
    for i in range(rings):
        for j in range(segments):
            a=i*segments+j
            b=i*segments+(j+1)%segments
            c=(i+1)*segments+(j+1)%segments
            d=(i+1)*segments+j
            faces.append((a,d,c,b))
    return mesh_object(name,vertices,faces,mat,bone)


def tube(name, points, radii, mat, bone='Body', sides=9, weights_fn=None):
    verts=[]
    for i, p in enumerate(points):
        p=Vector(p)
        tangent = Vector(points[min(i+1,len(points)-1)]) - Vector(points[max(i-1,0)])
        tangent.normalize()
        axis=Vector((0,1,0))
        if abs(tangent.dot(axis))>.93:
            axis=Vector((1,0,0))
        normal=tangent.cross(axis).normalized()
        binormal=tangent.cross(normal).normalized()
        radius=radii[i] if isinstance(radii,list) else radii
        for j in range(sides):
            angle=2*math.pi*j/sides
            verts.append(tuple(p+radius*(normal*math.cos(angle)+binormal*math.sin(angle))))
    faces=[]
    for i in range(len(points)-1):
        for j in range(sides):
            a=i*sides+j
            b=i*sides+(j+1)%sides
            c=(i+1)*sides+(j+1)%sides
            d=(i+1)*sides+j
            faces.append((a,b,c,d))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple((len(points)-1)*sides+j for j in range(sides)))
    weights=None
    if weights_fn:
        weights={}
        for idx,co in enumerate(verts):
            for bn,w in weights_fn(co).items():
                weights.setdefault(bn,[]).append((idx,w))
    return mesh_object(name,verts,faces,mat,bone,weights)


def ribbon(name, points, widths, mat, bone='Body'):
    verts=[]
    n=len(points)
    for i,(x,y,z) in enumerate(points):
        width=widths[i]
        for j in range(9):
            u=(j/8-.5)*2
            verts.append((x+u*width,y+.024*u*u-.013*math.cos(i/n*math.pi)*math.cos(u*math.pi),z+.024*math.sin(u*math.pi)))
    faces=[]
    for i in range(n-1):
        for j in range(8):
            a=i*9+j
            faces.append((a,a+1,a+10,a+9))
    obj=mesh_object(name,verts,faces,mat,bone)
    solid=obj.modifiers.new('Cotton thickness','SOLIDIFY')
    solid.thickness=.015
    sub=obj.modifiers.new('Soft fabric surface','SUBSURF')
    sub.levels=2
    bpy.context.view_layer.objects.active=obj
    for modifier in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    return obj


def ear(side):
    """Curved leaf volume, with an inset peach surface, rather than a cone."""
    sign=-1 if side=='L' else 1
    for inset,mat in [(False,'wool'),(True,'ear')]:
        verts=[]
        ring_count=22
        for i in range(ring_count+1):
            t=i/ring_count
            if inset:
                t=.12+.78*t
            x=sign*(.36+.39*t)
            z=1.91-.13*t-.045*math.sin(math.pi*t)
            y=-.002-.10*t-.05*math.sin(math.pi*t)
            width=.128*math.sin(math.pi*t)**.65*(.81 if inset else 1)
            depth=.058*math.sin(math.pi*t)**.6
            for j in range(16):
                a=2*math.pi*j/16
                verts.append((x, y+depth*math.cos(a)-(.032 if inset else 0),z+width*math.sin(a)))
        faces=[]
        for i in range(ring_count):
            for j in range(16):
                a=i*16+j;b=i*16+(j+1)%16;c=(i+1)*16+(j+1)%16;d=(i+1)*16+j
                faces.append((a,b,c,d))
        mesh_object('Curved '+side+(' peach ear inset' if inset else ' golden ear'),verts,faces,mat,'Ear.'+side)


# The body is a shaped, pear-like fleece volume with directional surface folds.
soft_shape('Pear-shaped fleece body',(0,.015,1.057),(.397,.285,.456),'wool',segments=64,rings=40,wool=.030,pear=.12)
for row,z in enumerate([.665,.735,.83,.935,1.05,1.165,1.285,1.37]):
    nz=(z-1.057)/.456
    radial=math.sqrt(max(.01,1-nz*nz))
    count=15 if row not in (0,7) else 10
    for j in range(count):
        a=2*math.pi*(j+.5*(row%2))/count
        x=.373*radial*math.cos(a)
        y=.269*radial*math.sin(a)+.015
        size=.077+random.random()*.019
        soft_shape('Layered body wool curl',(x,y,z), (size,size*.71,size*1.04),'tuft' if (row+j)%4==0 else 'wool',segments=16,rings=10,wool=.035,tilt=random.uniform(-.3,.3))

soft_shape('Rounded wool head',(0,.018,1.765),(.409,.297,.421),'wool','Head',segments=48,rings=32,wool=.013)
soft_shape('Sculpted face patch',(0,-.227,1.752),(.328,.157,.330),'face','Head',segments=48,rings=32,pear=.12)
soft_shape('Soft smiling muzzle',(0,-.334,1.603),(.177,.081,.105),'face','Head',segments=32,rings=18,pear=.2)

# A deliberate top crest and cheek border preserve the illustrated lamb silhouette.
for i,(x,z,sx,sz) in enumerate([(-.295,2.021,.105,.103),(-.219,2.103,.114,.108),(-.107,2.146,.115,.093),(.014,2.165,.123,.095),(.139,2.137,.116,.102),(.258,2.077,.103,.106),(.334,1.982,.084,.101)]):
    soft_shape('Crown tuft %02d'%i,(x,-.07,z),(sx,.219,sz),'tuft','Head',segments=24,rings=16,wool=.035)
for sign in (-1,1):
    for k in range(5):
        z=1.892-k*.084
        x=sign*(.345-(.025 if k==4 else 0))
        soft_shape('Cheek wool scallop',(x,-.087,z),(.075,.145,.084),'wool','Head',segments=20,rings=14,wool=.025)
ear('L');ear('R')

for side,sign in [('L',-1),('R',1)]:
    x=sign*.151
    soft_shape('Kind ivory eye '+side,(x,-.366,1.848),(.086,.042,.123),'eye','Eye.'+side,segments=32,rings=22)
    soft_shape('Deep pupil '+side,(x+sign*.003,-.404,1.840),(.047,.018,.077),'pupil','Eye.'+side,segments=28,rings=20)
    soft_shape('Bright eye glint '+side,(x-.014,-.422,1.882),(.019,.009,.023),'glint','Eye.'+side,segments=16,rings=12)
    soft_shape('Small eye glint '+side,(x+.019,-.421,1.817),(.009,.006,.010),'glint','Eye.'+side,segments=12,rings=10)
    points=[]
    for j in range(19):
        t=j/18
        points.append((x-.061+.124*t,-.344,1.996+.021*math.sin(math.pi*t)))
    tube('Gentle eyebrow '+side,points,[.006+.004*math.sin(math.pi*j/18) for j in range(19)],'hoof','Head',sides=7)

# Heart-shaped nose and a genuinely curved mouth line stay legible at game scale.
soft_shape('Nose left lobe',(-.025,-.410,1.694),(.048,.026,.027),'hoof','Head',segments=24,rings=16)
soft_shape('Nose right lobe',(.025,-.410,1.694),(.048,.026,.027),'hoof','Head',segments=24,rings=16)
soft_shape('Nose soft tip',(0,-.423,1.678),(.044,.023,.035),'hoof','Head',segments=24,rings=16)
tube('Nose to smile',[(0,-.417,1.669),(0,-.418,1.639),(0,-.413,1.617)],.006,'dark','Head')
smile=[]
for i in range(35):
    t=i/34
    smile.append((-.137+.274*t,-.431+.031*(abs(t-.5)*2)**2,1.63-.048*math.sin(math.pi*t)))
tube('Warm curved smile',smile,[.005+.001*math.sin(math.pi*i/34) for i in range(35)],'dark','Head')

# Soft cotton scarf collar: oval strip, with a folded knot and two leaf-like tails.
verts=[];faces=[]
for i in range(64):
    a=2*math.pi*i/64
    for j in range(7):
        t=j/6
        verts.append(((.281+.007*math.sin(t*math.pi))*math.cos(a),(.251+.009*math.sin(t*math.pi))*math.sin(a)-.018,1.386+.117*t+.018*math.sin(a)))
for i in range(64):
    for j in range(6):
        a=i*7+j;b=((i+1)%64)*7+j
        faces.append((a,b,b+1,a+1))
mesh_object('Red scarf wrapped collar',verts,faces,'scarf','Body')
soft_shape('Folded scarf knot',(0,-.290,1.406),(.067,.038,.063),'scarf_light','Body',segments=24,rings=16,tilt=.12)
ribbon('Scarf left tail',[(-.022,-.31,1.405),(-.052,-.33,1.345),(-.084,-.343,1.26),(-.12,-.326,1.179),(-.143,-.31,1.157)],[.023,.037,.048,.039,.005],'scarf','Scarf.L')
ribbon('Scarf right tail',[(.025,-.31,1.403),(.054,-.345,1.345),(.087,-.36,1.266),(.109,-.331,1.191),(.101,-.31,1.169)],[.023,.04,.05,.035,.005],'scarf_light','Scarf.R')

# Fleece-covered arms terminate in two chestnut hand hooves.
for side,sign in [('L',-1),('R',1)]:
    soft_shape('Soft upper arm '+side,(sign*.348,-.002,1.139),(.113,.122,.209),'wool','Arm.'+side,segments=28,rings=20,wool=.035,tilt=sign*-.30)
    soft_shape('Arm cuff wool '+side,(sign*.417,-.034,.987),(.098,.105,.107),'tuft','Arm.'+side,segments=24,rings=16,wool=.035)
    soft_shape('Hand hoof '+side,(sign*.429,-.049,.913),(.092,.085,.115),'hoof','Arm.'+side,segments=28,rings=20,pear=.1,tilt=sign*-.10)
    tube('Hand hoof cleft '+side,[(sign*.429,-.130,.852),(sign*.429,-.138,.887),(sign*.429,-.133,.915)],.0045,'dark','Arm.'+side,sides=6)

# Precisely two springs. Their vertices blend between the planted hoof and body
# so compression/extension remains connected throughout every animation.
for side,sign in [('L',-1),('R',1)]:
    x=sign*.205
    points=[]
    turns=5
    for i in range(201):
        t=i/200
        a=2*math.pi*turns*t
        radius=.062*(.88+.12*math.sin(math.pi*t))
        points.append((x+radius*math.cos(a),radius*math.sin(a),.205+.455*t))
    def spring_weights(co, side=side):
        t=max(0,min(1,(co[2]-.205)/.455))
        return {'Body':t,'Foot.'+side:1-t}
    tube('Five-turn spring '+side,points,.0175,'metal',sides=10,weights_fn=spring_weights)
    soft_shape('Upper spring socket '+side,(x,0,.653),(.082,.082,.039),'hoof','Body',segments=24,rings=14)
    soft_shape('Lower spring socket '+side,(x,0,.21),(.08,.083,.029),'metal','Foot.'+side,segments=24,rings=14)
    soft_shape('Cloven foot hoof '+side,(x,-.051,.105),(.14,.168,.105),'hoof','Foot.'+side,segments=36,rings=24,pear=.14)
    tube('Foot hoof cleft '+side,[(x,-.211,.029),(x,-.215,.065),(x,-.197,.118),(x,-.154,.153)],.0065,'dark','Foot.'+side,sides=7)

# A small fleece tail reads from the adventure camera without altering the front model.
soft_shape('Wool tail',(0,.305,.958),(.102,.12,.127),'tuft','Body',segments=24,rings=16,wool=.04,tilt=.11)

# Join by material into one skinned renderable. Semantic part names remain in
# this editable generation source; named bone groups retain deformation control.
bpy.ops.object.select_all(action='DESELECT')
for part in parts:
    part.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.join()
hero=bpy.context.object
hero.name='Bouncy sculpted surface'
decimate=hero.modifiers.new('Mobile-friendly smooth surface reduction','DECIMATE')
decimate.ratio=.66
bpy.ops.object.modifier_apply(modifier=decimate.name)
modifier=hero.modifiers.new('Bouncy soft-part deformation','ARMATURE')
modifier.object=rig
hero.parent=rig
hero['design_reference']='public/game-assets/sound-seekers/v3/cast/meadow/bouncy.webp'
hero['spring_count']=2
hero['turns_per_spring']=5
hero['authorship']='Original procedural Blender modeling for Lantern Trail demo; no imported model geometry.'


def reset_pose():
    for bone in rig.pose.bones:
        bone.rotation_mode='XYZ'
        bone.location=(0,0,0)
        bone.rotation_euler=(0,0,0)
        bone.scale=(1,1,1)


def pose_key(frame):
    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path='location',frame=frame,group=bone.name)
        bone.keyframe_insert(data_path='rotation_euler',frame=frame,group=bone.name)
        bone.keyframe_insert(data_path='scale',frame=frame,group=bone.name)


rig.animation_data_create()
actions=[]
for name,frames in [('Idle',96),('Walk',20),('Celebrate',64)]:
    action=bpy.data.actions.new(name)
    action.use_fake_user=True
    rig.animation_data.action=action
    for frame in range(frames+1):
        reset_pose()
        t=frame/frames
        p=2*math.pi*t
        b=rig.pose.bones
        if name=='Idle':
            breath=math.sin(p)
            b['Body'].location.z=.008*breath
            b['Body'].scale=(1+.005*breath,1+.009*breath,1-.003*breath)
            b['Head'].rotation_euler.x=.011*math.sin(p+.3)
            b['Head'].rotation_euler.z=.018*math.sin(p)
            b['Ear.L'].rotation_euler.y=.025*math.sin(p+.5)
            b['Ear.R'].rotation_euler.y=.021*math.sin(p+.8)
            b['Arm.L'].rotation_euler.y=.018*math.sin(p+.7)
            b['Arm.R'].rotation_euler.y=-.018*math.sin(p+.4)
            b['Scarf.L'].rotation_euler.x=.025*math.sin(p+.4)
            b['Scarf.R'].rotation_euler.x=.022*math.sin(p+.8)
            if 61 <= frame <= 66:
                blink=[1,.65,.06,.06,.55,1][frame-61]
                b['Eye.L'].scale.z=blink;b['Eye.R'].scale.z=blink
        elif name=='Walk':
            b['Body'].location.z=.037*(1-math.cos(2*p))
            b['Body'].rotation_euler.y=.033*math.sin(p)
            b['Body'].rotation_euler.x=.05
            b['Head'].rotation_euler.x=-.03+.014*math.sin(2*p+.5)
            for side,offset,sign in [('L',0,1),('R',math.pi,-1)]:
                phase=p+offset
                b['Foot.'+side].location.y=-.21*math.cos(phase)
                b['Foot.'+side].location.z=.115*max(0,math.sin(phase))
                b['Foot.'+side].rotation_euler.x=.15*math.sin(phase)
                b['Arm.'+side].rotation_euler.x=-.35*math.cos(phase)
                b['Arm.'+side].rotation_euler.y=.06*sign
                b['Ear.'+side].rotation_euler.y=sign*.05*math.sin(2*p-.7)
                b['Scarf.'+side].rotation_euler.x=-.06+.09*math.sin(2*p-.8-offset*.2)
        else:
            # Chosen anticipation -> spring release -> landing -> happy settle.
            key_times=[0,.09,.16,.25,.36,.43,.55,.67,.78,.88,1]
            body_values=[0,-.09,-.12,.30,.13,-.06,.21,.02,-.02,.015,0]
            foot_values=[0,0,0,.26,.09,0,.15,0,0,0,0]
            def sample(values):
                for k in range(len(key_times)-1):
                    if t<=key_times[k+1]:
                        u=(t-key_times[k])/(key_times[k+1]-key_times[k])
                        u=max(0,min(1,u));u=u*u*(3-2*u)
                        return values[k]*(1-u)+values[k+1]*u
                return values[-1]
            lift=sample(body_values);feet=sample(foot_values)
            b['Body'].location.z=lift
            b['Foot.L'].location.z=feet;b['Foot.R'].location.z=feet
            crouch=max(0,-lift)
            b['Body'].scale=(1+crouch*.3,1+crouch*.3,1-crouch*.3)
            cheer=math.sin(math.pi*max(0,min(1,(t-.12)/.82)))
            b['Arm.L'].rotation_euler.y=.87*cheer
            b['Arm.R'].rotation_euler.y=-.87*cheer
            b['Head'].rotation_euler.z=.06*math.sin(p*2)*cheer
            b['Head'].rotation_euler.x=-.07*cheer
            b['Ear.L'].rotation_euler.y=.13*math.sin(4*p-.6)*cheer
            b['Ear.R'].rotation_euler.y=-.13*math.sin(4*p-.9)*cheer
            b['Scarf.L'].rotation_euler.x=.18*math.sin(4*p-1)*cheer
            b['Scarf.R'].rotation_euler.x=.19*math.sin(4*p-1.3)*cheer
        pose_key(frame)
    actions.append(action)

reset_pose()
rig.animation_data.action=None
for action in actions:
    track=rig.animation_data.nla_tracks.new()
    track.name=action.name
    strip=track.strips.new(action.name,0,action)
    strip.action_frame_start=0
    strip.action_frame_end={'Idle':96,'Walk':20,'Celebrate':64}[action.name]
    track.mute=True

scene=bpy.context.scene
scene.render.fps=24
scene.frame_start=0
scene.frame_end=96
scene.frame_set(0)
rig['runtime_forward']='+Z (glTF)'
rig['runtime_up']='+Y (glTF)'
rig['animation_notes']='Idle 4s loop; Walk 0.8333s in-place loop; Celebrate 2.6667s one-shot with anticipation and landing. Cross-fade recommended.'

bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True);hero.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'bouncy.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='ACTIONS',export_merge_animation='ACTION',export_anim_single_armature=True,export_force_sampling=True,export_frame_range=False,export_optimize_animation_size=True,export_materials='EXPORT',export_skins=True,export_extras=True,export_apply=False)

# Render evidence uses the actual mesh and authored rig in this saved source.
floor_mat=material('Review floor • muted sage','788B66',.9)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.009))
floor=bpy.context.object;floor.name='REVIEW ONLY • floor';floor.data.materials.append(floor_mat)
world=bpy.data.worlds.new('Warm studio')
scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.28,.34,.27,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5


def area(name,loc,power,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc
    ob.rotation_euler=(Vector((0,0,1.15))-ob.location).to_track_quat('-Z','Y').to_euler()
    return ob


area('REVIEW ONLY • broad warm key',(-3,-4,6),500,4.0,(1,.88,.68))
area('REVIEW ONLY • soft front fill',(3,-2,3.3),240,3.0,(.80,.90,1))
area('REVIEW ONLY • golden rim',(1,3,4.8),600,3.0,(1,.75,.45))
cam_data=bpy.data.cameras.new('REVIEW ONLY • camera')
cam=bpy.data.objects.new('REVIEW ONLY • camera',cam_data)
bpy.context.collection.objects.link(cam);scene.camera=cam
cam_data.type='ORTHO';cam_data.ortho_scale=3.0
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=720;scene.render.resolution_y=820;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX'
rig.animation_data.action=actions[0]
scene.frame_set(0)
cam.location=(3.2,-6.6,3.0)
cam.rotation_euler=(Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(EVIDENCE/'bouncy-three-quarter.png')
bpy.ops.render.render(write_still=True)
cam.location=(0,-6.6,2.4)
cam.rotation_euler=(Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(EVIDENCE/'bouncy-front.png')
bpy.ops.render.render(write_still=True)
rig.animation_data.action=actions[2];scene.frame_set(17)
cam.location=(3.2,-6.6,3.0)
cam.rotation_euler=(Vector((0,0,1.25))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(EVIDENCE/'bouncy-celebrate.png')
bpy.ops.render.render(write_still=True)
rig.animation_data.action=actions[0];scene.frame_set(0)
scene.render.filepath=str(EVIDENCE/'bouncy-three-quarter.png')
bouncy_rig,bouncy_hero,bouncy_actions=rig,hero,actions
bouncy_hero.hide_render=True

# Woolly is a separately authored canonical lamb resident. Four natural legs,
# cream fleece, blue eyes and a peach nose distinguish this character from Bouncy.
parts=[]
mats=dict(mats)
for key,color in [('wool','F8E6AC'),('tuft','FFF1C4'),('face','F7C895'),('ear','EBA782')]:
    mats[key]=material('Woolly • '+key,color,.82)
mats['iris']=material('Woolly • blue irises','2588B0',.32)
mats['nose']=material('Woolly • peach nose','C7785B',.74)
arm_data=bpy.data.armatures.new('Woolly soft-part rig')
rig=bpy.data.objects.new('Woolly',arm_data)
bpy.context.collection.objects.link(rig)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
woolly_bones={
    'Root':((0,0,0),None),'Body':((0,0,.60),'Root'),'Head':((0,0,1.46),'Body'),
    'Ear.L':((-.36,0,1.87),'Head'),'Ear.R':((.36,0,1.87),'Head'),
    'Eye.L':((-.151,-.36,1.846),'Head'),'Eye.R':((.151,-.36,1.846),'Head'),
    'Foot.L':((-.20,-.12,.15),'Root'),'Foot.R':((.20,-.12,.15),'Root'),
    'FootBack.L':((-.27,.16,.15),'Root'),'FootBack.R':((.27,.16,.15),'Root')
}
for name,(head,parent) in woolly_bones.items():
    bone=arm_data.edit_bones.new(name);bone.head=head;bone.tail=Vector(head)+Vector((0,.17,0))
    if parent:bone.parent=arm_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
soft_shape('Woolly rounded fleece body',(0,.018,1.047),(.434,.337,.479),'wool',segments=48,rings=32,wool=.025,pear=.09)
for row,z in enumerate([.64,.75,.87,.99,1.11,1.23,1.35,1.43]):
    nz=(z-1.047)/.479;radial=math.sqrt(max(.01,1-nz*nz))
    count=15 if row not in (0,7) else 10
    for j in range(count):
        a=2*math.pi*(j+.45*(row%2))/count
        size=.085+random.random()*.025
        soft_shape('Woolly fleece curl',(.41*radial*math.cos(a),.315*radial*math.sin(a)+.018,z), (size,size*.72,size),'tuft' if (row+j)%4==0 else 'wool',segments=14,rings=10,wool=.03,tilt=random.uniform(-.2,.2))
soft_shape('Woolly rounded head',(0,.018,1.765),(.409,.297,.421),'wool','Head',segments=40,rings=28,wool=.013)
soft_shape('Woolly warm face',(0,-.227,1.752),(.328,.157,.330),'face','Head',segments=40,rings=28,pear=.12)
soft_shape('Woolly muzzle',(0,-.334,1.603),(.177,.081,.105),'face','Head',segments=28,rings=18,pear=.2)
for i,(x,z,sx,sz) in enumerate([(-.295,2.021,.105,.103),(-.219,2.103,.114,.108),(-.107,2.146,.115,.093),(.014,2.165,.123,.095),(.139,2.137,.116,.102),(.258,2.077,.103,.106),(.334,1.982,.084,.101)]):
    soft_shape('Woolly crown tuft %02d'%i,(x,-.07,z),(sx,.219,sz),'tuft','Head',segments=20,rings=14,wool=.03)
for sign in (-1,1):
    for k in range(5):
        soft_shape('Woolly cheek scallop',(sign*(.345-(.025 if k==4 else 0)),-.087,1.892-k*.084),(.075,.145,.084),'wool','Head',segments=18,rings=12,wool=.02)
ear('L');ear('R')
for side,sign in [('L',-1),('R',1)]:
    x=sign*.151
    soft_shape('Woolly ivory eye '+side,(x,-.366,1.848),(.086,.042,.123),'eye','Eye.'+side,segments=28,rings=20)
    soft_shape('Woolly blue iris '+side,(x,-.404,1.84),(.055,.019,.081),'iris','Eye.'+side,segments=24,rings=18)
    soft_shape('Woolly pupil '+side,(x,-.420,1.838),(.031,.009,.057),'pupil','Eye.'+side,segments=24,rings=18)
    soft_shape('Woolly eye glint '+side,(x-.012,-.433,1.880),(.018,.007,.021),'glint','Eye.'+side,segments=14,rings=10)
    points=[(x-.061+.124*j/18,-.344,1.996+.021*math.sin(math.pi*j/18)) for j in range(19)]
    tube('Woolly gentle eyebrow '+side,points,[.006+.003*math.sin(math.pi*j/18) for j in range(19)],'hoof','Head',sides=7)
soft_shape('Woolly nose left',(-.025,-.410,1.694),(.044,.024,.023),'nose','Head',segments=20,rings=14)
soft_shape('Woolly nose right',(.025,-.410,1.694),(.044,.024,.023),'nose','Head',segments=20,rings=14)
soft_shape('Woolly nose tip',(0,-.422,1.680),(.034,.019,.028),'nose','Head',segments=20,rings=14)
tube('Woolly nose to mouth',[(0,-.423,1.669),(0,-.424,1.639),(0,-.425,1.617)],.0055,'hoof','Head')
tube('Woolly kind smile',[(-.13+.26*i/34,-.431+.031*(abs(i/34-.5)*2)**2,1.63-.047*math.sin(math.pi*i/34))for i in range(35)],.0055,'hoof','Head')
for prefix,y,width in [('Foot',-.12,.20),('FootBack',.16,.27)]:
    for side,sign in [('L',-1),('R',1)]:
        x=sign*width;bn=prefix+'.'+side
        points=[(x,y,.18+.49*j/24) for j in range(25)]
        def leg_weights(co,bn=bn):
            t=max(0,min(1,(co[2]-.18)/.49))
            return {'Body':t,bn:1-t}
        tube('Woolly natural leg '+bn,points,[.059+.018*j/24 for j in range(25)],'face',sides=16,weights_fn=leg_weights)
        soft_shape('Woolly cloven hoof '+bn,(x,y-.022,.105),(.092,.106,.105),'hoof',bn,segments=28,rings=20,pear=.08)
        tube('Woolly hoof cleft '+bn,[(x,y-.13,.025),(x,y-.132,.06),(x,y-.123,.109)],.0045,'dark',bn,sides=7)
soft_shape('Woolly fleece tail',(0,.35,.96),(.11,.15,.14),'tuft',segments=20,rings=14,wool=.025)
bpy.ops.object.select_all(action='DESELECT')
for part in parts:part.select_set(True)
bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join()
hero=bpy.context.object;hero.name='Woolly sculpted surface'
decimate=hero.modifiers.new('Mobile-friendly smooth surface reduction','DECIMATE');decimate.ratio=.68
bpy.ops.object.modifier_apply(modifier=decimate.name)
modifier=hero.modifiers.new('Woolly soft-part deformation','ARMATURE');modifier.object=rig
hero.parent=rig
hero['design_reference']='public/game-assets/sound-seekers/v3/cast/meadow/woolly.webp'
hero['natural_leg_count']=4
hero['authorship']='Original procedural Blender modeling for Lantern Trail demo; no imported model geometry.'
rig.animation_data_create();actions=[]
for name,frames in [('Idle',120),('Walk',32),('Celebrate',72)]:
    action=bpy.data.actions.new('Woolly | '+name);action.use_fake_user=True;rig.animation_data.action=action
    for frame in range(frames+1):
        reset_pose();t=frame/frames;p=2*math.pi*t;b=rig.pose.bones
        if name=='Idle':
            b['Body'].location.z=.005*math.sin(p)
            b['Head'].rotation_euler.z=.025*math.sin(p)
            b['Head'].rotation_euler.x=.01*math.sin(p+.3)
            b['Ear.L'].rotation_euler.y=.02*math.sin(p+.4)
            b['Ear.R'].rotation_euler.y=.02*math.sin(p+.7)
            if 77 <= frame <=82:
                blink=[1,.65,.06,.06,.55,1][frame-77]
                b['Eye.L'].scale.z=blink;b['Eye.R'].scale.z=blink
        elif name=='Walk':
            b['Body'].location.z=.016*(1-math.cos(2*p))
            b['Head'].rotation_euler.x=.018*math.sin(2*p+.5)
            for bn,offset in [('Foot.L',0),('Foot.R',math.pi),('FootBack.L',math.pi),('FootBack.R',0)]:
                phase=p+offset;b[bn].location.y=-.13*math.cos(phase)
                b[bn].location.z=.07*max(0,math.sin(phase))
        else:
            wave=math.sin(math.pi*t)**2
            b['Body'].location.z=.014*math.sin(p*2)*wave
            b['Head'].rotation_euler.z=.09*math.sin(p*2)*wave
            b['Head'].rotation_euler.x=-.06*wave
            b['Ear.L'].rotation_euler.y=.09*math.sin(p*2-.4)*wave
            b['Ear.R'].rotation_euler.y=-.09*math.sin(p*2-.7)*wave
        pose_key(frame)
    actions.append(action)
reset_pose();rig.animation_data.action=None
for action,name,frames in zip(actions,['Idle','Walk','Celebrate'],[120,32,72]):
    track=rig.animation_data.nla_tracks.new();track.name=name
    strip=track.strips.new(name,0,action);strip.action_frame_start=0;strip.action_frame_end=frames;track.mute=True
scene.frame_set(0)
rig['runtime_forward']='+Z (glTF)';rig['runtime_up']='+Y (glTF)'
rig['animation_notes']='Idle 5s loop; Walk 1.3333s in-place loop; Celebrate 3s gentle happy nod. Cross-fade recommended.'
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);hero.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(ASSETS/'woolly.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',export_force_sampling=True,export_frame_range=False,export_optimize_animation_size=True,export_materials='EXPORT',export_skins=True,export_extras=True,export_apply=False)
rig.animation_data.action=actions[0];scene.frame_set(0)
cam.location=(3.2,-6.6,3.0);cam.rotation_euler=(Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(EVIDENCE/'woolly-three-quarter.png');bpy.ops.render.render(write_still=True)
cam.location=(0,-6.6,2.4);cam.rotation_euler=(Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(EVIDENCE/'woolly-front.png');bpy.ops.render.render(write_still=True)

# The editable source opens on both characters, with review lighting separated
# from the two export selections and no duplicate alternate source files.
bouncy_hero.hide_render=False;bouncy_rig.location.x=-.97;rig.location.x=.97
cam.location=(3.0,-8.0,3.25);cam.rotation_euler=(Vector((0,0,1.12))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=4.8
scene.frame_start=0;scene.frame_end=120
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'source'/'characters.blend'))

# Import each exported GLB into a fresh Blender scene and inspect that artifact.
for character in ['bouncy','woolly']:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS/(character+'.glb')))
    meshes=[ob for ob in bpy.context.scene.objects if ob.type=='MESH' and any(m.type=='ARMATURE' for m in ob.modifiers)]
    verts=[ob.matrix_world@Vector(corner) for ob in meshes for corner in ob.bound_box]
    bounds={axis:[min(v[i] for v in verts),max(v[i] for v in verts)] for i,axis in enumerate('XYZ')}
    report={
        'model':character+'.glb','bytes':(ASSETS/(character+'.glb')).stat().st_size,
        'mesh_objects':len(meshes),'vertices':sum(len(ob.data.vertices) for ob in meshes),
        'triangles':sum(len(ob.data.polygons) for ob in meshes),
        'reimport_blender_bounds':bounds,
        'reimport_actions':[action.name for action in bpy.data.actions],
        'rigs':[ob.name for ob in bpy.context.scene.objects if ob.type=='ARMATURE'],
        'expected_height':2.25,'gltf_up':'+Y','gltf_forward':'+Z',
        'evidence_boundary':'Export/reimport and rendered poses checked here; running-game lighting, movement speed, mobile performance and physical-device evidence are owned by the demo integration.'
    }
    (EVIDENCE/(character+'-export-check.json')).write_text(json.dumps(report,indent=2)+'\n')
    print('CHARACTER_EXPORT_REPORT '+json.dumps(report))
