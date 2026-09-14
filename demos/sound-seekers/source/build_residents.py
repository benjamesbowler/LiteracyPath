"""Add canonical Clucky and Splashy residents without rebuilding the hero GLBs.

Run after build_characters.py with Blender 5.2. Source references are the
repository's v3/cast/meadow/clucky.webp and splashy.webp, inspected directly
during authoring. All geometry, materials and animation are authored here.
"""
from pathlib import Path
import math
import json
import hashlib
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'/'characters'
EVIDENCE=ROOT.parents[1]/'.artifacts'/'sound-seekers-lantern-demo'/'characters'
SOURCE=ROOT/'source'/'characters.blend'
EVIDENCE.mkdir(parents=True,exist_ok=True)
prior_hashes={name:hashlib.sha256((ASSETS/(name+'.glb')).read_bytes()).hexdigest() for name in ['bouncy','woolly']}
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
bpy.context.preferences.filepaths.save_version=0
for obj in list(bpy.data.objects):
    if obj.name.startswith(('Clucky','Splashy')):
        bpy.data.objects.remove(obj,do_unlink=True)
for action in list(bpy.data.actions):
    if action.name.startswith(('Clucky |','Splashy |')):
        bpy.data.actions.remove(action)
for datablocks in (bpy.data.meshes,bpy.data.armatures,bpy.data.materials):
    for block in list(datablocks):
        if block.users==0 and block.name.startswith(('Clucky','Splashy')):
            datablocks.remove(block)
for obj in bpy.context.scene.objects:
    if obj.type=='MESH' and not obj.name.startswith('REVIEW ONLY'):
        obj.hide_render=True


def material(name,hex_color,rough=.75):
    srgb=[int(hex_color[i:i+2],16)/255 for i in (0,2,4)]
    rgb=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb]
    mat=bpy.data.materials.new(name);mat.diffuse_color=(*rgb,1);mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Roughness'].default_value=rough
    return mat


def make_rig(name):
    data=bpy.data.armatures.new(name+' soft-part rig');rig=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(rig);bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
    bones={
        'Root':((0,0,0),None),'Body':((0,0,.28),'Root'),'Head':((0,0,.98),'Body'),
        'Wing.L':((-.30,0,.85),'Body'),'Wing.R':((.30,0,.85),'Body'),
        'Foot.L':((-.155,0,.10),'Root'),'Foot.R':((.155,0,.10),'Root'),
        'Eye.L':((-.16,-.29,1.30),'Head'),'Eye.R':((.16,-.29,1.30),'Head'),
        'Crest':((0,0,1.47),'Head'),'Tail':((0,.27,.60),'Body')
    }
    for bn,(head,parent) in bones.items():
        bone=data.edit_bones.new(bn);bone.head=head;bone.tail=Vector(head)+Vector((0,.15,0))
        if parent:bone.parent=data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig


def mesh(name,verts,faces,mat,bone='Body',weights=None):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);data.materials.append(mats[mat])
    for p in data.polygons:p.use_smooth=True
    if weights:
        groups={}
        for i,co in enumerate(verts):
            for bn,w in weights(co).items():
                if bn not in groups:groups[bn]=obj.vertex_groups.new(name=bn)
                if w>.0001:groups[bn].add([i],w,'REPLACE')
    else:
        vg=obj.vertex_groups.new(name=bone);vg.add(list(range(len(verts))),1,'REPLACE')
    parts.append(obj);return obj


def soft(name,loc,scale,mat,bone='Body',segments=32,rings=20,pear=0,tilt=0,ridge=0):
    verts=[]
    for i in range(rings+1):
        v=math.pi*i/rings;sv=math.sin(v);cv=math.cos(v)
        for j in range(segments):
            u=2*math.pi*j/segments;r=1+ridge*math.sin(6*u+2*cv)*math.sin(7*v)
            x=scale[0]*sv*math.cos(u)*(1-pear*cv)*r
            y=scale[1]*sv*math.sin(u)*r;z=scale[2]*cv
            verts.append((loc[0]+x*math.cos(tilt)+z*math.sin(tilt),loc[1]+y,loc[2]-x*math.sin(tilt)+z*math.cos(tilt)))
    faces=[]
    for i in range(rings):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments;c=(i+1)*segments+(j+1)%segments;d=(i+1)*segments+j
            faces.append((a,d,c,b))
    return mesh(name,verts,faces,mat,bone)


def tube(name,points,radius,mat,bone='Body',sides=9,weights=None):
    verts=[]
    for i,point in enumerate(points):
        p=Vector(point);t=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(i-1,0)])).normalized()
        axis=Vector((0,1,0)) if abs(t.y)<.93 else Vector((1,0,0))
        n=t.cross(axis).normalized();b=t.cross(n).normalized();r=radius[i] if isinstance(radius,list) else radius
        for j in range(sides):
            a=2*math.pi*j/sides;verts.append(tuple(p+r*(n*math.cos(a)+b*math.sin(a))))
    faces=[]
    for i in range(len(points)-1):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+(j+1)%sides;d=(i+1)*sides+j
            faces.append((a,b,c,d))
    faces.append(tuple(reversed(range(sides))));faces.append(tuple((len(points)-1)*sides+j for j in range(sides)))
    return mesh(name,verts,faces,mat,bone,weights)


def leaf(name,centers,widths,thickness,mat,bone='Body'):
    """A curved, solid feather blade, shaped along its authored centre line."""
    verts=[];sides=16
    for i,(x,y,z) in enumerate(centers):
        width=widths[i]
        for j in range(sides):
            a=2*math.pi*j/sides
            verts.append((x+thickness*math.cos(a)*math.sin(math.pi*i/(len(centers)-1)),y+width*math.sin(a),z))
    faces=[]
    for i in range(len(centers)-1):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+(j+1)%sides;d=(i+1)*sides+j
            faces.append((a,b,c,d))
    return mesh(name,verts,faces,mat,bone)


def beak_wedge(name,loc,width,length,height,mat,bone='Head',drop=.035):
    verts=[];rings=22;sides=24
    for i in range(rings+1):
        t=i/rings;profile=max(.006,(1-t)**.78)
        for j in range(sides):
            a=2*math.pi*j/sides
            verts.append((loc[0]+width*profile*math.cos(a),loc[1]-length*t,loc[2]+height*profile*math.sin(a)-drop*t))
    faces=[]
    for i in range(rings):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides;c=(i+1)*sides+(j+1)%sides;d=(i+1)*sides+j
            faces.append((a,b,c,d))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple(rings*sides+j for j in range(sides)))
    return mesh(name,verts,faces,mat,bone)


def webbed_foot(side,sign):
    """Rounded radial web surface with three readable forward toe lobes."""
    verts=[];segments=64;rings=14;x=sign*.155
    for i in range(rings+1):
        v=math.pi*i/rings
        for j in range(segments):
            u=2*math.pi*j/segments
            front=max(0,-math.sin(u))
            lobe=1+.16*math.cos(6*u)*front**3
            verts.append((x+.127*math.sin(v)*math.cos(u)*lobe,-.07+.149*math.sin(v)*math.sin(u)*lobe,.038+.037*math.cos(v)))
    faces=[]
    for i in range(rings):
        for j in range(segments):
            a=i*segments+j;b=i*segments+(j+1)%segments;c=(i+1)*segments+(j+1)%segments;d=(i+1)*segments+j
            faces.append((a,d,c,b))
    mesh('Splashy webbed foot '+side,verts,faces,'feet','Foot.'+side)
    for offset in (-.035,.035):
        tube('Splashy web crease '+side,[(x+offset*.6,-.07,.075),(x+offset,-.115,.071),(x+offset*1.7,-.175,.058)],.0033,'crease','Foot.'+side,sides=6)


def animate(rig,name):
    rig.animation_data_create();actions=[]
    for clip,frames in [('Idle',96),('Walk',24),('Celebrate',60)]:
        action=bpy.data.actions.new(name+' | '+clip);action.use_fake_user=True;rig.animation_data.action=action
        for frame in range(frames+1):
            t=frame/frames;p=2*math.pi*t;b=rig.pose.bones
            for bone in b:
                bone.rotation_mode='XYZ';bone.location=(0,0,0);bone.rotation_euler=(0,0,0);bone.scale=(1,1,1)
            if clip=='Idle':
                breath=math.sin(p);b['Body'].location.z=.005*breath
                b['Body'].scale=(1+.005*breath,1+.008*breath,1-.003*breath)
                b['Head'].rotation_euler.z=.022*math.sin(p)
                b['Head'].rotation_euler.x=.014*math.sin(p+.3)
                b['Wing.L'].rotation_euler.y=.018*math.sin(p+.2)
                b['Wing.R'].rotation_euler.y=-.018*math.sin(p+.5)
                b['Crest'].rotation_euler.y=.025*math.sin(p+.6)
                b['Tail'].rotation_euler.x=.027*math.sin(p+.4)
                if 65<=frame<=70:
                    blink=[1,.65,.06,.06,.6,1][frame-65];b['Eye.L'].scale.z=blink;b['Eye.R'].scale.z=blink
            elif clip=='Walk':
                b['Body'].location.z=.021*(1-math.cos(2*p));b['Body'].rotation_euler.y=.033*math.sin(p)
                b['Head'].rotation_euler.x=.020*math.sin(p*2+.3)
                for side,offset,sign in [('L',0,1),('R',math.pi,-1)]:
                    phase=p+offset;b['Foot.'+side].location.y=-.115*math.cos(phase)
                    b['Foot.'+side].location.z=.07*max(0,math.sin(phase))
                    b['Wing.'+side].rotation_euler.y=sign*(.04+.03*math.sin(phase))
                b['Tail'].rotation_euler.x=.04*math.sin(2*p+.6)
            else:
                cheer=math.sin(math.pi*t)**2;flap=math.sin(p*3)
                b['Wing.L'].rotation_euler.y=(.48+.19*flap)*cheer
                b['Wing.R'].rotation_euler.y=-(.48+.19*flap)*cheer
                b['Head'].rotation_euler.z=.06*math.sin(p*2)*cheer
                b['Head'].rotation_euler.x=-.05*cheer
                b['Body'].location.z=.014*math.sin(p*2)*cheer
                b['Crest'].rotation_euler.y=.07*math.sin(p*3-.4)*cheer
                b['Tail'].rotation_euler.x=.10*math.sin(p*3-.4)*cheer
            for bone in b:
                for prop in ['location','rotation_euler','scale']:
                    bone.keyframe_insert(data_path=prop,frame=frame,group=bone.name)
        actions.append(action)
    rig.animation_data.action=None
    for action,clip,frames in zip(actions,['Idle','Walk','Celebrate'],[96,24,60]):
        track=rig.animation_data.nla_tracks.new();track.name=clip
        strip=track.strips.new(clip,0,action);strip.action_frame_start=0;strip.action_frame_end=frames;track.mute=True
    return actions


scene=bpy.context.scene;scene.render.fps=24;scene.frame_start=0;scene.frame_end=96
scene.cycles.samples=20
cam=scene.camera;cam.data.ortho_scale=2.22
all_new=[]
for name in ['Clucky','Splashy']:
    parts=[];rig=make_rig(name)
    colors={
        'Clucky':{'body':'F35621','highlight':'FC6931','wing':'DA411B','beak':'FFC329','feet':'E5A416','crest':'CE2226','dark':'2C170D','eye':'FFF6D8','white':'FFFFFF','crease':'B37B10'},
        'Splashy':{'body':'FFDE31','highlight':'FFE65A','wing':'F3CE29','beak':'F89A19','feet':'EB8711','crest':'FFE65A','dark':'2C1B0B','eye':'FFFEED','white':'FFFFFF','crease':'B66D0D'}
    }[name]
    mats={key:material(name+' • '+key,value,.26 if key in ['dark','white'] else .78)for key,value in colors.items()}
    if name=='Clucky':
        soft('Clucky plump pear body',(0,.015,.705),(.458,.315,.467),'body',segments=52,rings=32,pear=.18,ridge=.006)
        soft('Clucky rising neck and head',(0,-.015,1.160),(.265,.231,.346),'highlight','Head',segments=44,rings=30,pear=.12)
        # Individual neck feathers make a flowing collar over the breast.
        for j in range(11):
            a=2*math.pi*j/11
            soft('Clucky neck feather',(.220*math.cos(a),.19*math.sin(a)-.005,.997),(.087,.063,.154),'highlight','Head',segments=20,rings=14,pear=.25,tilt=-.23*math.cos(a))
        for side,sign in [('L',-1),('R',1)]:
            soft('Clucky rounded wing shoulder '+side,(sign*.315,.013,.974),(.096,.134,.135),'wing','Wing.'+side,segments=24,rings=18)
            centers=[];widths=[]
            for i in range(25):
                t=i/24;centers.append((sign*(.331+.12*math.sin(math.pi*t)),.035-.072*t,1.025-.535*t));widths.append(.182*math.sin(math.pi*t)**.65)
            leaf('Clucky long feathered wing '+side,centers,widths,.045,'wing','Wing.'+side)
            for k in range(3):
                soft('Clucky wing feather tip '+side,(sign*(.405-.014*k),-.06+.055*k,.567+.016*k),(.048,.068,.142),'wing','Wing.'+side,segments=18,rings=14,pear=-.3,tilt=sign*-.2)
        # A red comb with three distinct lobes and the canonical paired wattles.
        soft('Clucky comb central',(0,-.003,1.557),(.054,.056,.140),'crest','Crest',segments=28,rings=20,pear=.25,tilt=.07)
        soft('Clucky comb left',(-.067,-.003,1.526),(.047,.05,.087),'crest','Crest',segments=24,rings=18,pear=.18,tilt=-.3)
        soft('Clucky comb right',(.067,-.003,1.523),(.047,.05,.084),'crest','Crest',segments=24,rings=18,pear=.2,tilt=.29)
        for sign in (-1,1):
            soft('Clucky red wattle',(sign*.040,-.226,1.076),(.043,.038,.09),'crest','Head',segments=24,rings=18,pear=.25,tilt=sign*-.2)
        beak_wedge('Clucky tapered yellow upper beak',(0,-.210,1.260),.120,.224,.050,'beak')
        beak_wedge('Clucky tapered golden lower beak',(0,-.214,1.231),.095,.194,.027,'feet',drop=.020)
        for side,sign in [('L',-1),('R',1)]:
            x=sign*.108
            soft('Clucky kind dark eye '+side,(x,-.222,1.338),(.034,.026,.054),'dark','Eye.'+side,segments=26,rings=18)
            soft('Clucky tiny eye glint '+side,(x-.008,-.246,1.36),(.007,.004,.009),'white','Eye.'+side,segments=12,rings=10)
            tube('Clucky eyebrow '+side,[(x-.035+.07*i/18,-.204,1.418+.012*math.sin(math.pi*i/18))for i in range(19)],.0046,'dark','Head',sides=7)
        for side,sign in [('L',-1),('R',1)]:
            x=sign*.155;bn='Foot.'+side
            def weights(co,bn=bn):
                t=max(0,min(1,(co[2]-.07)/.28));return {'Body':t,bn:1-t}
            tube('Clucky natural shin '+side,[(x,0,.073+.28*i/20)for i in range(21)],.031,'feet',sides=14,weights=weights)
            soft('Clucky foot pad '+side,(x,-.025,.044),(.062,.067,.036),'feet',bn,segments=24,rings=16)
            for offset,end_y in [(-.090,-.12),(0,-.194),(.09,-.12)]:
                points=[(x,-.006,.045),(x+offset*.4,end_y*.4,.032),(x+offset*.8,end_y*.78,.026),(x+offset,end_y,.022)]
                tube('Clucky rounded toe '+side,points,[.025,.024,.021,.015],'feet',bn,sides=12)
                soft('Clucky toe tip '+side,points[-1],(.017,.02,.017),'feet',bn,segments=14,rings=10)
        for k in range(3):
            soft('Clucky soft tail plume',((k-1)*.072,.300,.79+(1-abs(k-1))*.047),(.072,.208,.108),'wing','Tail',segments=24,rings=16,pear=.12)
    else:
        soft('Splashy round breast',(0,.012,.627),(.355,.264,.379),'body',segments=48,rings=32,pear=.12,ridge=.004)
        soft('Splashy large round duckling head',(0,-.006,1.198),(.410,.303,.391),'body','Head',segments=56,rings=36,pear=.10)
        for sign in (-1,1):
            soft('Splashy soft cheek',(sign*.289,-.080,1.083),(.101,.198,.106),'body','Head',segments=24,rings=18,pear=.10)
        for x,z,tilt,sx,sz in [(-.056,1.585,-.23,.043,.133),(.006,1.622,.18,.047,.135),(.076,1.601,.55,.041,.109)]:
            soft('Splashy little crest feather',(x,.015,z),(sx,.074,sz),'crest','Crest',segments=24,rings=18,pear=.30,tilt=tilt)
        for side,sign in [('L',-1),('R',1)]:
            soft('Splashy downy wing shoulder '+side,(sign*.262,.012,.827),(.091,.119,.125),'highlight','Wing.'+side,segments=24,rings=18)
            centers=[];widths=[]
            for i in range(25):
                t=i/24;centers.append((sign*(.281+.110*math.sin(math.pi*t)),.017-.020*t,.902-.394*t));widths.append(.129*math.sin(math.pi*t)**.70)
            leaf('Splashy short wing '+side,centers,widths,.047,'highlight','Wing.'+side)
            for k in range(3):
                soft('Splashy wing feather tip '+side,(sign*(.350+.012*k),-.071+.049*k,.569+.024*k),(.049,.060,.088),'highlight','Wing.'+side,segments=20,rings=14,pear=-.27,tilt=sign*-.4)
        soft('Splashy broad orange upper bill',(0,-.352,1.094),(.198,.145,.065),'beak','Head',segments=44,rings=28,pear=.13)
        soft('Splashy lower orange bill',(0,-.351,1.062),(.172,.128,.039),'feet','Head',segments=36,rings=24)
        tube('Splashy smiling bill seam',[(-.165+.33*i/36,-.503+.067*(abs(i/36-.5)*2)**2,1.086-.016*math.sin(math.pi*i/36))for i in range(37)],.0047,'dark','Head',sides=7)
        for sign in (-1,1):
            soft('Splashy nostril',(sign*.049,-.448,1.135),(.009,.005,.006),'crease','Head',segments=14,rings=10)
        for side,sign in [('L',-1),('R',1)]:
            x=sign*.165
            soft('Splashy ivory eye '+side,(x,-.273,1.302),(.087,.038,.119),'eye','Eye.'+side,segments=32,rings=22)
            soft('Splashy bright pupil '+side,(x+sign*.003,-.308,1.295),(.046,.02,.076),'dark','Eye.'+side,segments=28,rings=20)
            soft('Splashy eye glint '+side,(x-.013,-.326,1.334),(.017,.008,.021),'white','Eye.'+side,segments=16,rings=12)
            tube('Splashy curved eyebrow '+side,[(x-.060+.12*i/20,-.235,1.465+.018*math.sin(math.pi*i/20))for i in range(21)],.006,'dark','Head',sides=8)
        for side,sign in [('L',-1),('R',1)]:
            x=sign*.155;bn='Foot.'+side
            def weights(co,bn=bn):
                t=max(0,min(1,(co[2]-.055)/.30));return {'Body':t,bn:1-t}
            tube('Splashy short natural shin '+side,[(x,0,.055+.30*i/20)for i in range(21)],.033,'feet',sides=14,weights=weights)
            webbed_foot(side,sign)
        for k in range(3):
            soft('Splashy small tail feather',((k-1)*.056,.258,.585+(1-abs(k-1))*.035),(.065,.169,.091),'highlight','Tail',segments=24,rings=16)
    bpy.ops.object.select_all(action='DESELECT')
    for part in parts:part.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();surface=bpy.context.object;surface.name=name+' sculpted surface'
    ground_offset=min(v.co.z for v in surface.data.vertices)
    for vertex in surface.data.vertices:vertex.co.z-=ground_offset
    dec=surface.modifiers.new('Smooth mobile geometry reduction','DECIMATE');dec.ratio=.73
    bpy.ops.object.modifier_apply(modifier=dec.name)
    mod=surface.modifiers.new(name+' soft-part deformation','ARMATURE');mod.object=rig;surface.parent=rig
    surface['design_reference']='public/game-assets/sound-seekers/v3/cast/meadow/'+name.lower()+'.webp'
    surface['authorship']='Original authored mesh, materials and animation; no imported model geometry.'
    surface['wing_count']=2;surface['leg_count']=2
    rig['runtime_up']='+Y (glTF)';rig['runtime_forward']='+Z (glTF)';rig['ground_origin']=True
    actions=animate(rig,name);scene.frame_set(0)
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);surface.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ASSETS/(name.lower()+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_merge_animation='NLA_TRACK',export_force_sampling=True,export_frame_range=False,export_optimize_animation_size=True,export_materials='EXPORT',export_skins=True,export_extras=True,export_apply=False)
    rig.animation_data.action=actions[0];scene.frame_set(0)
    cam.location=(2.6,-6.0,2.3);cam.rotation_euler=(Vector((0,0,.84))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(EVIDENCE/(name.lower()+'-three-quarter.png'));bpy.ops.render.render(write_still=True)
    cam.location=(0,-6,2.0);cam.rotation_euler=(Vector((0,0,.84))-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(EVIDENCE/(name.lower()+'-front.png'));bpy.ops.render.render(write_still=True)
    rig.animation_data.action=actions[2];scene.frame_set(30)
    scene.render.filepath=str(EVIDENCE/(name.lower()+'-celebrate.png'));bpy.ops.render.render(write_still=True)
    rig.animation_data.action=actions[0];scene.frame_set(0);surface.hide_render=True
    all_new.append((rig,surface))

# Save the four editable characters together. These layout transforms are not
# present in the already-exported grounded character GLBs.
for name,x in [('Bouncy',-2.18),('Woolly',-.70),('Splashy',.78),('Clucky',2.15)]:
    rig=bpy.data.objects[name];rig.location.x=x
    for child in rig.children:
        if child.type=='MESH':child.hide_render=False
cam.data.ortho_scale=7.0;cam.location=(3,-10,3.6);cam.rotation_euler=(Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
for name,expected in prior_hashes.items():
    assert hashlib.sha256((ASSETS/(name+'.glb')).read_bytes()).hexdigest()==expected, name+' export changed unexpectedly'

# Verify each newly exported artifact in a fresh import, excluding the hidden
# bone-shape mesh that Blender's glTF importer creates for its rig display.
for name in ['clucky','splashy']:
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ASSETS/(name+'.glb')))
    surfaces=[ob for ob in bpy.context.scene.objects if ob.type=='MESH' and any(m.type=='ARMATURE' for m in ob.modifiers)]
    verts=[ob.matrix_world@Vector(corner)for ob in surfaces for corner in ob.bound_box]
    report={
        'model':name+'.glb','bytes':(ASSETS/(name+'.glb')).stat().st_size,
        'sha256':hashlib.sha256((ASSETS/(name+'.glb')).read_bytes()).hexdigest(),
        'mesh_objects':len(surfaces),'triangles':sum(len(ob.data.polygons)for ob in surfaces),
        'vertices':sum(len(ob.data.vertices)for ob in surfaces),
        'reimport_blender_bounds':{axis:[min(v[i]for v in verts),max(v[i]for v in verts)]for i,axis in enumerate('XYZ')},
        'actions':[a.name for a in bpy.data.actions],'gltf_up':'+Y','gltf_forward':'+Z',
        'bouncy_woolly_exports_unchanged':True,
        'evidence_boundary':'Asset render and fresh glTF import; integrated demo playback and physical-device performance checked separately.'
    }
    (EVIDENCE/(name+'-export-check.json')).write_text(json.dumps(report,indent=2)+'\n');print('RESIDENT_EXPORT_REPORT '+json.dumps(report))
